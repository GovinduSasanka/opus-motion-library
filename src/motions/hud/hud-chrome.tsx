import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video17 hud-chrome-overlay + video9 scroll-progress-hud. A broadcast/dev HUD layer: corner crop
 * marks, header (title / red subtitle, right counter), live timecode, a code line typed at
 * 30 ch/s with a red block cursor (solid while typing, 2 Hz blink idle), "BPM · FPS" with a
 * 4-square beat indicator, a hairline progress bar with chapter ticks and a red playhead, and an
 * optional right-side ruler with bracket markers, a sliding orange indicator and "0N / 07".
 * Overlay: set `backdrop` to "transparent"; the default dark backdrop + bouncing ball is only a preview.
 */
type Chapter = {label: string; code: string};
type Props = {
  backdrop: string;
  previewSubject: boolean;
  theme: 'dark' | 'light';
  title: string;
  subtitle: string;
  headerRight: string;
  counterLabel: string;
  counter: string;
  chapters: Chapter[];
  bpm: number;
  accent: string;
  rulerAccent: string;
  showRuler: boolean;
  showProgress: boolean;
  rulerUnit: string;
};

const pad = (n: number, l = 2) => String(Math.floor(n)).padStart(l, '0');

const HudChrome: React.FC<Props> = ({backdrop, previewSubject, theme, title, subtitle, headerRight, counterLabel, counter, chapters, bpm, accent, rulerAccent, showRuler, showProgress, rulerUnit}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames: D, portrait} = useStage();
  const ink = theme === 'dark' ? '#EEEBDE' : '#0B0D0C';
  const grey = theme === 'dark' ? '#92908D' : '#6E6B63';
  const dim = theme === 'dark' ? '#393939' : '#C9C5B8';
  const mark = '#888888';
  const fs = 15 * u;
  const ls = fs * 0.15;
  const m = 44 * u;
  const L = Math.max(1, chapters.length);
  const chLen = D / L;
  const ch = Math.min(L - 1, Math.floor(frame / chLen));
  const chStart = ch * chLen;
  const beatLen = (fps * 60) / Math.max(1, bpm);
  const beat = Math.floor(frame / beatLen) % 4;

  // entrance
  const marks = prog(frame, 0, 8, ease.out);
  const head = prog(frame, 3, 12, ease.out);
  const foot = prog(frame, 6, 16, ease.out);
  const charsIn = (s: string, start: number, cps = 60) => s.slice(0, Math.max(0, Math.floor(((frame - start) / fps) * cps)));

  // timecode
  const tc = `${pad(frame / (fps * 3600))}:${pad((frame / (fps * 60)) % 60)}:${pad((frame / fps) % 60)}:${pad(frame % fps)}`;

  // code line
  const code = chapters[ch]?.code ?? '';
  const typedN = Math.max(0, Math.floor(((frame - chStart - 4) / fps) * 30));
  const shown = code.slice(0, typedN);
  const typing = typedN < code.length;
  const cursorOn = typing || Math.floor((frame - chStart) / (fps / 4)) % 2 === 0;
  const codeY = portrait ? h - 108 * u : h - 44 * u;
  const codeFs = Math.min(fs, (w - 2 * m - (portrait ? 0 : 640 * u)) / Math.max(1, code.length * 0.75));
  const cls = codeFs * 0.15;
  const codeW = shown.length * (codeFs * 0.6 + cls);
  const codeX0 = w / 2 - (code.length * (codeFs * 0.6 + cls)) / 2;

  // progress
  const barY = h - 72 * u;
  const p = frame / Math.max(1, D - 1);

  // ruler
  const rx = portrait ? w - 64 * u : w - 134 * u;
  const ry0 = h * (portrait ? 0.3 : 0.185);
  const ry1 = h * (portrait ? 0.7 : 0.815);
  const markY = (i: number) => ry0 + ((i + 0.5) / L) * (ry1 - ry0);
  let indY = markY(0);
  for (let i = 1; i < L; i++) indY += (markY(i) - markY(i - 1)) * prog(frame, i * chLen - 6, i * chLen + 6, ease.inOut);

  // preview subject: red ball bouncing every 2 beats
  const P = beatLen * 2;
  const bp = (frame % P) / P;
  const floorY = h * (portrait ? 0.6 : 0.66);
  const br = 64 * u;
  const hop = h * (portrait ? 0.24 : 0.3);
  const by = floorY - br - hop * 4 * bp * (1 - bp);
  const near = Math.min(bp, 1 - bp);
  const sy = near < 0.05 ? 0.72 + 0.28 * (near / 0.05) : 1 + 0.14 * clamp(1 - Math.abs(near - 0.12) / 0.1);
  const sx = 1 / Math.sqrt(sy);
  const ballX = (f: number) => w * 0.47 + Math.sin((f / D) * Math.PI * 2) * w * (portrait ? 0.22 : 0.26);
  const ballY = (f: number) => {
    const q = (f % P) / P;
    return floorY - br - hop * 4 * q * (1 - q);
  };
  const bx = ballX(frame);

  const T = (props: React.SVGProps<SVGTextElement> & {children: React.ReactNode}) => <text fontFamily={fonts.mono} fontWeight={700} fontSize={fs} letterSpacing={ls} {...props} />;

  return (
    <AbsoluteFill style={{background: backdrop}}>
      <Svg>
        {previewSubject && backdrop !== 'transparent' && (
          <g opacity={prog(frame, 0, 10)}>
            {Array.from({length: Math.ceil(w / (60 * u))}, (_, i) =>
              Array.from({length: Math.ceil(h / (60 * u))}, (_, j) => <circle key={`${i}-${j}`} cx={i * 60 * u + 30 * u} cy={j * 60 * u + 30 * u} r={1.2 * u} fill={grey} opacity={0.18} />),
            )}
            <line x1={w * 0.1} y1={floorY} x2={w * 0.84} y2={floorY} stroke={grey} strokeOpacity={0.5} strokeWidth={1.5 * u} />
            <ellipse cx={bx} cy={floorY} rx={br * (1.1 - 0.5 * ((floorY - br - by) / hop))} ry={br * 0.12} fill="#000" opacity={0.35} />
            {Array.from({length: 40}, (_, k) => frame - 1 - k).filter((f) => f >= 0).map((f) => <circle key={f} cx={ballX(f)} cy={ballY(f)} r={2.2 * u} fill={ink} opacity={0.5 * (1 - (frame - f) / 40)} />)}
            <ellipse cx={bx} cy={floorY - br * sy} rx={br * sx} ry={br * sy} fill={accent} transform={`translate(0,${by - (floorY - br)})`} />
            <text x={bx + br * 1.6} y={by + 6 * u} fontFamily={fonts.mono} fontSize={13 * u} fill={grey} letterSpacing={2 * u}>
              {`sy ${sy.toFixed(2)}`}
            </text>
          </g>
        )}
        {/* crop marks */}
        {[
          [18, 18, 1, 1],
          [w / u - 18, 18, -1, 1],
          [18, h / u - 18, 1, -1],
          [w / u - 18, h / u - 18, -1, -1],
        ].map(([x, y, dx, dy], i) => (
          <path key={i} d={`M${(x + dx * 22 * marks) * u} ${y * u} L${x * u} ${y * u} L${x * u} ${(y + dy * 22 * marks) * u}`} fill="none" stroke={mark} strokeWidth={2 * u} />
        ))}
        {/* header */}
        <g opacity={head}>
          <T x={m} y={50 * u} fill={ink}>
            {charsIn(title, 3)}
            {subtitle && (
              <tspan fill={grey}>{frame > 3 + (title.length / 60) * fps ? ' / ' : ''}</tspan>
            )}
            {subtitle && <tspan fill={accent}>{charsIn(subtitle, 3 + (title.length / 60) * fps + 2)}</tspan>}
          </T>
          <T x={w - m} y={50 * u} fill={ink} textAnchor="end">
            {headerRight}
            <tspan fill={grey}>{`   ${counterLabel} `}</tspan>
            <tspan fill={accent}>{counter}</tspan>
          </T>
        </g>
        {/* progress bar */}
        {showProgress && (
          <g opacity={foot}>
            <line x1={m} y1={barY} x2={m + (w - 2 * m) * prog(frame, 6, 20, ease.out)} y2={barY} stroke={dim} strokeWidth={2 * u} />
            {chapters.map((_, i) => (i === 0 ? null : <line key={i} x1={m + ((w - 2 * m) * i) / L} y1={barY - 4 * u} x2={m + ((w - 2 * m) * i) / L} y2={barY + 4 * u} stroke={dim} strokeWidth={1.5 * u} />))}
            <line x1={m} y1={barY} x2={m + (w - 2 * m) * p} y2={barY} stroke={accent} strokeWidth={2 * u} />
            <line x1={m + (w - 2 * m) * p} y1={barY - 7 * u} x2={m + (w - 2 * m) * p} y2={barY + 7 * u} stroke={accent} strokeWidth={2 * u} />
          </g>
        )}
        {/* footer */}
        <g opacity={foot} transform={`translate(0,${(1 - foot) * 8 * u})`}>
          <T x={m} y={h - 44 * u} fill={grey}>
            {'TC  '}
            <tspan fill={ink}>{tc}</tspan>
          </T>
          <T x={codeX0} y={codeY} fill={ink} fontWeight={400} fontSize={codeFs} letterSpacing={cls}>
            {shown}
          </T>
          {cursorOn && <rect x={codeX0 + codeW + 2 * u} y={codeY - codeFs * 0.85} width={codeFs * 0.62} height={codeFs * 1.05} fill={accent} />}
          <T x={w - m - 4 * 16 * u - 12 * u} y={h - 44 * u} fill={ink} textAnchor="end">
            {`${bpm} BPM · ${fps} FPS`}
          </T>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={w - m - (4 - i) * 16 * u + 4 * u} y={h - 44 * u - 10 * u} width={10 * u} height={10 * u} fill={i === beat ? accent : 'none'} stroke={i === beat ? accent : grey} strokeWidth={1.2 * u} />
          ))}
        </g>
        {/* right progress ruler */}
        {showRuler && (
          <g opacity={prog(frame, 8, 18)}>
            <line x1={rx} y1={ry0} x2={rx} y2={ry0 + (ry1 - ry0) * prog(frame, 8, 26, ease.out)} stroke={grey} strokeOpacity={0.7} strokeWidth={1 * u} />
            {Array.from({length: Math.floor((ry1 - ry0) / (21 * u)) + 1}, (_, i) => (
              <line key={i} x1={rx} y1={ry0 + i * 21 * u} x2={rx + 6 * u} y2={ry0 + i * 21 * u} stroke={grey} strokeOpacity={0.5} strokeWidth={1 * u} />
            ))}
            {chapters.map((_, i) => (
              <path key={i} d={`M${rx - 14 * u} ${markY(i) - 6 * u} L${rx - 14 * u} ${markY(i) + 6 * u} L${rx - 4 * u} ${markY(i) + 6 * u}`} fill="none" stroke={i <= ch ? ink : grey} strokeOpacity={i <= ch ? 0.9 : 0.5} strokeWidth={1.4 * u} />
            ))}
            <rect x={rx - 11 * u} y={indY - 1 * u} width={22 * u} height={2.4 * u} fill={rulerAccent} />
            <text x={rx - 24 * u} y={indY + 4.5 * u} textAnchor="end" fontFamily={fonts.mono} fontSize={13 * u} fill={rulerAccent} letterSpacing={2 * u}>
              {pad(ch + 1)}
            </text>
            <text x={rx + 8 * u} y={ry1 + 46 * u} textAnchor="end" fontFamily={fonts.mono} fontSize={13 * u} letterSpacing={3 * u} fill={grey}>
              <tspan fill={ink} fontWeight={700}>{pad(ch + 1)}</tspan>
              {` / ${pad(L)}${rulerUnit ? ' ' + rulerUnit : ''}`}
            </text>
            <text x={rx + 8 * u} y={ry0 - 22 * u} textAnchor="end" fontFamily={fonts.mono} fontSize={13 * u} letterSpacing={3 * u} fill={ink} opacity={0.85}>
              {(chapters[ch]?.label ?? '').toUpperCase().slice(0, 28)}
            </text>
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const hudChrome = defineMotion<Props>({
  id: 'hud-chrome',
  title: 'HUD chrome overlay',
  category: 'hud',
  description: 'Overlay HUD: corner crop marks, header with red counter, live timecode, typed code line with red block cursor, BPM beat squares, chapter progress bar and a right-side ruler with "0N / 07" counter.',
  source: ['video17 0:00-43:56 (hud-chrome-overlay, typewriter-code)', 'video9 (scroll-progress-hud)'],
  useFor: 'Technical / "made with code" framing over any scene; chaptered explainers. Set backdrop to "transparent" to overlay.',
  durationInFrames: 360,
  defaultProps: {
    backdrop: '#0B0D0C',
    previewSubject: true,
    theme: 'dark',
    title: 'THE 12 PRINCIPLES OF ANIMATION',
    subtitle: 'ONE BALL',
    headerRight: 'ONE TAKE · LIVE',
    counterLabel: 'CUTS',
    counter: '00',
    chapters: [
      {label: 'Squash & stretch', code: 'sx = 1 / sy;  // area π·r² is conserved'},
      {label: 'Anticipation', code: 'y = 540 + A·e^(-ζω·t)·sin(ωd·t); // caught'},
      {label: 'Staging', code: 'focus = shapes.filter(s => s.signal); // 1 : 140'},
      {label: 'Slow in & slow out', code: 'x = x0 + Δx·ease(u) // cubic-bezier(.7,0,.3,1)'},
      {label: 'Arcs', code: "θ'' = -(g/L)·sin θ // pendulum → arcs"},
      {label: 'Timing', code: 't = √(2h/g) // 9f heavy · 24f · 52f light'},
      {label: 'Appeal', code: 'eyes.blink(5); mood = "happy"; // ^ ^'},
    ],
    bpm: 160,
    accent: '#ED3821',
    rulerAccent: '#E24D0F',
    showRuler: true,
    showProgress: true,
    rulerUnit: '',
  },
  propDocs: {
    backdrop: 'background colour; "transparent" to use as an overlay',
    previewSubject: 'draw a bouncing red ball on the backdrop (preview only)',
    theme: 'dark = light text (for dark scenes), light = ink text',
    title: 'header left text',
    subtitle: 'header left accent text after " / "',
    headerRight: 'header right text',
    counterLabel: 'grey label before the red counter',
    counter: 'red counter value (e.g. "00")',
    chapters: 'list of {label, code}; chapters split the duration evenly; code is typed in the footer',
    bpm: 'beat indicator tempo',
    accent: 'red accent (cursor, progress, beat)',
    rulerAccent: 'orange indicator on the right ruler',
    showRuler: 'right-side progress ruler with "0N / 0L" counter',
    showProgress: 'bottom hairline progress bar with chapter ticks',
    rulerUnit: 'word after the ruler counter, e.g. "ROOMS"',
  },
  component: HudChrome,
  tags: ['hud', 'overlay', 'timecode', 'progress', 'code', 'broadcast'],
});
