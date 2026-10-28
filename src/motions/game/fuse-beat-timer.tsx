// Adapted from lemo-opuscar/styles/microgame/demo/hud.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {TOON, ToonPart, ToonStage, ToonText, toonStar} from '../../core/r2-la3c-kit';
import {TAU, cl, eo3, h1, lf, lerp, popCurve} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * microgame fuse timer: a rope fuse along the bottom with one knot per beat. A sparkling spark (6-10 star particles a
 * frame) travels along it at constant speed so it passes each knot exactly on the beat, burning the rope behind it,
 * toward a small rocket / bomb. A big beats-left numeral pops on every beat. `freezeBeat` freezes the spark (replays).
 */
type Props = {
  beats: number;
  bpm: number;
  startFrame: number;
  endIcon: string;
  freezeBeat: number;
  stage: boolean;
  showCount: boolean;
  readyText: string;
  doneText: string;
  rope: string;
  spark: string;
  seed: number;
  background: string;
  rayColor: string;
  ink: string;
  textColor: string;
  accent: string;
  accent2: string;
  alert: string;
};

const FuseBeatTimer: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const fpb = 1800 / p.bpm;
  const dur = p.beats * fpb;
  const end = p.startFrame + dur;
  const id = `fuse-${p.seed}`;
  const rocket = p.endIcon !== 'bomb';

  // ---- fuse geometry (arc-length table) ---------------------------------------------------------
  const geo = React.useMemo(() => {
    const iconW = rocket ? 262 * u : 196 * u;
    const x0 = w * 0.07;
    const x1 = Math.max(x0 + 200 * u, w * 0.94 - iconW);
    const yb = h * (portrait ? 0.8 : 0.82);
    const amp = 20 * u;
    const N = 220;
    const pts: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      pts.push([lerp(x0, x1, s), yb + Math.sin(s * TAU * 2.1 + 0.6) * amp * (0.35 + 0.65 * Math.sin(s * Math.PI))]);
    }
    const len = [0];
    for (let i = 1; i <= N; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return {pts, len, L: len[N], x1, yb};
  }, [w, h, u, portrait, rocket]);
  const at = (s: number): [number, number] => {
    const target = cl(s) * geo.L;
    let lo = 0;
    let hi = geo.len.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (geo.len[m] < target) lo = m;
      else hi = m;
    }
    const f = (target - geo.len[lo]) / Math.max(1e-6, geo.len[hi] - geo.len[lo]);
    return [lerp(geo.pts[lo][0], geo.pts[hi][0], f), lerp(geo.pts[lo][1], geo.pts[hi][1], f)];
  };
  const sub = (a: number, b: number) => {
    const out: [number, number][] = [];
    const n = Math.max(2, Math.ceil((b - a) * 120));
    for (let i = 0; i <= n; i++) out.push(at(lerp(a, b, i / n)));
    return 'M' + out.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L');
  };

  // ---- progress ---------------------------------------------------------------------------------
  const maxP = p.freezeBeat >= 0 ? cl(p.freezeBeat / p.beats) : 1;
  const prog = (f: number) => Math.min(maxP, cl((f - p.startFrame) / dur));
  const pr = prog(frame);
  const draw = eo3(frame / 16); // rope draws on left -> right
  const burning = frame >= p.startFrame && pr < 1;
  const done = frame >= end && p.freezeBeat < 0;
  const beat = Math.min(p.beats - 1, Math.max(0, Math.floor((frame - p.startFrame) / fpb)));
  const phase = frame >= p.startFrame ? ((frame - p.startFrame) % fpb) / fpb : 1;
  const counting = frame >= p.startFrame && !done;
  const beatPulse = counting ? Math.pow(Math.max(0, 1 - phase * 3.2), 2) : 0;

  const frozenPhase = p.freezeBeat >= 0 && frame >= p.startFrame + p.freezeBeat * fpb;
  const sp = at(pr);
  const sparkVisible = frame >= p.startFrame - 2 && (burning || frozenPhase);

  // ---- icon -------------------------------------------------------------------------------------
  const ex = geo.x1;
  const ey = geo.yb;
  const iconIn = popCurve((frame - 8) / 30 * 1);
  const fin = frame - end; // frames since the fuse reached the icon
  const rocketGo = rocket && fin > 8;
  const launch = rocketGo ? Math.pow((fin - 8) / 22, 2.2) : 0;
  const shake = rocket && fin > 0 && fin <= 8 ? Math.sin(fin * 3.1) * 5 * u : 0;
  const blast = !rocket && fin >= 0;
  const bombGone = blast && fin > 5;

  const rocketBody = 'M0 -26 L96 -32 Q150 -30 176 0 Q150 30 96 32 L0 26 Z';
  const rocketNose = 'M108 -31 Q152 -29 176 0 Q152 29 108 31 Z';
  const finTop = 'M14 -26 L-18 -64 L52 -30 Z';
  const finBot = 'M14 26 L-18 64 L52 30 Z';
  const flame = (len: number) => `M0 -16 Q${-len * 0.6} -20 ${-len} 0 Q${-len * 0.6} 20 0 16 Z`;

  // ---- sparks -----------------------------------------------------------------------------------
  const particles: React.ReactNode[] = [];
  if (sparkVisible && !frozenPhase) {
    for (let j = 0; j < 14; j++) {
      const fs = frame - j;
      if (fs < p.startFrame) break;
      const sp0 = at(prog(fs));
      for (let i = 0; i < 7; i++) {
        const a = h1(fs, i, p.seed) * TAU;
        const v = (4.5 + h1(fs, i, 9) * 9) * u;
        const x = sp0[0] + Math.cos(a) * v * j * 0.55;
        const y = sp0[1] + Math.sin(a) * v * j * 0.55 - j * 1.5 * u + j * j * 0.22 * u;
        const life = 1 - j / 14;
        const col = [p.spark, TOON.orange, '#FFFFFF', TOON.cream][Math.floor(h1(fs, i, 4) * 4)];
        particles.push(<path key={`${j}-${i}`} d={toonStar((6 + h1(fs, i, 5) * 11) * u * life, 0.25)} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(h1(fs, i, 6) * 90).toFixed(0)})`} fill={col} opacity={life} />);
      }
    }
  }

  const readyK = popCurve((frame - 10) / 30);
  const doneK = done ? popCurve((fin - 1) / 30) : 0;
  const numK = 1 + 0.42 * beatPulse;
  const left = p.beats - beat;
  const bigY = h * (portrait ? 0.4 : 0.42);
  const bigS = Math.min(w, h) * (portrait ? 0.44 : 0.38);
  const pulseY = counting ? beatPulse : 0;

  // knots
  const knots = Array.from({length: p.beats}, (_, i) => (i + 1) / p.beats);

  return (
    <AbsoluteFill style={{background: p.stage ? p.background : 'transparent'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {p.stage && <ToonStage w={w} h={h} frame={frame} id={id} ground={p.background} ray={p.rayColor} />}

        {/* central numeral */}
        {p.showCount && (
          <g>
            {frame < p.startFrame && readyK > 0.02 && <ToonText x={w / 2} y={bigY + bigS * 0.08} size={bigS * 0.3} text={p.readyText} font={lf.titan} fill={p.textColor} ink={p.ink} drop={p.accent2} dropOff={10 * u} sw={16 * u} rotate={-4} scale={Math.max(0.01, readyK)} />}
            {counting && <ToonText x={w / 2} y={bigY + bigS * 0.34 * numK} size={bigS * numK} text={String(left)} font={lf.titan} fill={left <= 2 ? p.accent : p.textColor} ink={p.ink} drop={left <= 2 ? p.alert : p.accent2} dropOff={14 * u} sw={22 * u} rotate={-4} />}
            {done && doneK > 0.02 && <ToonText x={w / 2} y={bigY + bigS * 0.08} size={bigS * 0.5} text={p.doneText} font={lf.titan} fill={p.accent} ink={p.ink} drop={p.alert} dropOff={12 * u} sw={20 * u} rotate={-4} scale={Math.max(0.01, doneK)} />}
          </g>
        )}

        {/* fuse: shadow, ink outline, unburnt rope, charred part */}
        {draw > 0.001 && (
          <g>
            <path d={sub(0, draw)} transform={`translate(${6 * u} ${8 * u})`} fill="none" stroke={p.ink} strokeOpacity={0.4} strokeWidth={36 * u} strokeLinecap="round" strokeLinejoin="round" />
            <path d={sub(0, draw)} fill="none" stroke={p.ink} strokeWidth={36 * u} strokeLinecap="round" strokeLinejoin="round" />
            {draw > pr + 0.002 && <path d={sub(pr, draw)} fill="none" stroke={p.rope} strokeWidth={21 * u} strokeLinecap="round" />}
            {draw > pr + 0.002 && <path d={sub(pr, draw)} transform={`translate(${-2 * u} ${-3 * u})`} fill="none" stroke={mixHex(p.rope, '#FFF3D0', 0.55)} strokeWidth={5 * u} strokeLinecap="round" strokeDasharray={`${14 * u} ${12 * u}`} />}
            {pr > 0.002 && <path d={sub(0, pr)} fill="none" stroke="#3A2B38" strokeWidth={16 * u} strokeLinecap="round" />}
            {knots.map((s, i) => {
              if (s > draw) return null;
              const [kx, ky] = at(s);
              const passed = pr >= s - 1e-4;
              const since = (frame - (p.startFrame + s * dur)) / fpb;
              const flash = passed && since < 0.5 && since >= 0 ? Math.pow(1 - since * 2, 2) : 0;
              const r = (18 + 9 * flash) * u;
              return (
                <g key={i} transform={`translate(${kx} ${ky})`}>
                  <ellipse rx={r * 1.05} ry={r} fill={passed ? '#3A2B38' : p.rope} stroke={p.ink} strokeWidth={5 * u} />
                  {!passed && <ellipse rx={r * 0.5} ry={r * 0.4} cx={-r * 0.25} cy={-r * 0.3} fill={mixHex(p.rope, '#FFF3D0', 0.6)} />}
                  {flash > 0.02 && <path d={toonStar(36 * u * flash + 14 * u, 0.2)} fill={TOON.gold} opacity={flash} />}
                </g>
              );
            })}
          </g>
        )}

        {/* icon */}
        {iconIn > 0.01 && rocket && (
          <g transform={`translate(${ex + launch * w * 0.9 + shake} ${ey + 2 * u - launch * h * 0.16}) rotate(${-launch * 18}) scale(${u * 1.45 * Math.max(0.01, iconIn)})`}>
            {rocketGo && <path d={flame(60 + 40 * Math.abs(Math.sin(frame * 1.7)))} fill={TOON.orange} stroke={TOON.ink} strokeWidth={6} strokeLinejoin="round" />}
            {rocketGo && <path d={flame(34 + 24 * Math.abs(Math.sin(frame * 2.3)))} fill={TOON.gold} />}
            <ToonPart id={`${id}-fb`} d={finTop} fill={TOON.red} sh={5} sw={6} />
            <ToonPart id={`${id}-fb2`} d={finBot} fill={mixHex(TOON.red, '#000000', 0.12)} sh={5} sw={6} />
            <ToonPart id={`${id}-rb`} d={rocketBody} fill={TOON.cream} shade="#BDB2D6" sh={7} sw={6.5} drop={7} />
            <ToonPart id={`${id}-rn`} d={rocketNose} fill={TOON.red} sh={7} sw={6.5} />
            <circle cx={78} cy={0} r={15} fill={TOON.cyan} stroke={TOON.ink} strokeWidth={6} />
            <circle cx={73} cy={-5} r={4.5} fill="#fff" opacity={0.9} />
          </g>
        )}
        {iconIn > 0.01 && !rocket && !bombGone && (
          <g transform={`translate(${ex + 80 * u} ${ey + 20 * u}) scale(${u * 1.4 * Math.max(0.01, iconIn) * (blast ? 1 + fin * 0.07 : 1)}) rotate(${blast ? fin * 8 : 0})`}>
            <ToonPart id={`${id}-bm`} d="M-56 0 A56 56 0 1 0 56 0 A56 56 0 1 0 -56 0 Z" fill="#3A3366" shade="#241C47" sh={9} sw={7} drop={8} />
            <path d="M-34 -22 A42 42 0 0 1 -6 -40" fill="none" stroke="#9A8FDA" strokeWidth={8} strokeLinecap="round" />
            <ToonPart id={`${id}-bc`} d="M-62 -26 L-40 -50 L-26 -36 L-48 -12 Z" fill={TOON.gold} sh={4} sw={6} />
            {blast && <circle r={60} fill={TOON.gold} opacity={Math.max(0, 1 - fin / 5) * 0.8} />}
          </g>
        )}
        {blast && fin <= 14 && (
          <g transform={`translate(${ex + 80 * u} ${ey + 20 * u})`}>
            <circle r={(fin / 14) * 190 * u} fill="none" stroke={TOON.gold} strokeWidth={Math.max(1, (1 - fin / 14) * 18 * u)} opacity={1 - fin / 14} />
            {Array.from({length: 14}, (_, i) => {
              const a = (i / 14) * TAU + h1(i, p.seed) * 0.4;
              const rr = (20 + fin * 13 + h1(i, 3) * 40) * u;
              return <path key={i} d={toonStar(18 * u * (1 - fin / 16), 0.25)} transform={`translate(${Math.cos(a) * rr} ${Math.sin(a) * rr})`} fill={i % 2 ? TOON.orange : TOON.gold} />;
            })}
          </g>
        )}

        {/* spark */}
        {sparkVisible && (
          <g>
            {particles}
            <circle cx={sp[0]} cy={sp[1]} r={(50 + 6 * Math.sin(frame * 1.3)) * u} fill={TOON.orange} opacity={0.35} />
            <path d={toonStar(34 * u, 0.28)} transform={`translate(${sp[0]} ${sp[1]}) rotate(${frame * 14})`} fill={p.spark} stroke={p.ink} strokeWidth={3 * u} strokeLinejoin="round" />
            <path d={toonStar(15 * u, 0.3)} transform={`translate(${sp[0]} ${sp[1]}) rotate(${-frame * 9})`} fill="#fff" />
          </g>
        )}
        {pulseY > 0.01 && <rect x={0} y={h - 8 * u} width={w} height={8 * u} fill={p.accent} opacity={pulseY * 0.8} />}
      </svg>
    </AbsoluteFill>
  );
};

const mixHex = (a: string, b: string, t: number) => {
  const A = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const B = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join('');
};

export const fuseBeatTimer = defineMotion<Props>({
  id: 'fuse-beat-timer',
  title: 'Fuse beat timer',
  category: 'game',
  description:
    'A rope fuse along the bottom with one knot per beat; a sparkling spark spawning star particles travels along it so it passes every knot exactly on the beat, charring the rope, toward a rocket (that launches) or a bomb (that bursts). A big beats-left numeral pops on every beat over a violet sunburst stage.',
  source: ['lemo-opuscar styles/microgame demo/hud.js (MIT, LemoLab) — fuse timer, hard-shadow toon parts'],
  useFor: 'Countdowns for quizzes, challenges and limited-time offers; on-beat timers; game-show / microgame formats; set stage=false to overlay the fuse on any scene.',
  durationInFrames: 180,
  defaultProps: {beats: 8, bpm: 120, startFrame: 24, endIcon: 'rocket', freezeBeat: -1, stage: true, showCount: true, readyText: 'READY?', doneText: 'GO!', rope: TOON.rope, spark: TOON.gold, seed: 4, background: TOON.ground, rayColor: '#3A1A78', ink: TOON.ink, textColor: '#ffffff', accent: TOON.gold, accent2: TOON.magenta, alert: TOON.red},
  propDocs: {
    beats: 'number of beats = number of knots (4-8 typical)',
    bpm: 'tempo; the spark travels one knot per beat',
    startFrame: 'frame the spark is lit',
    endIcon: 'rocket | bomb',
    freezeBeat: 'freeze the spark at this beat (replays); -1 = run to the end',
    stage: 'paint the violet sunburst stage; false = transparent overlay (fuse + numeral only)',
    showCount: 'show the big beats-left numeral',
    readyText: 'word shown before the spark is lit',
    doneText: 'word shown when the fuse reaches the icon',
    rope: 'rope colour',
    spark: 'spark star colour',
    seed: 'particle seed',
    background: 'stage ground colour (stage=true)',
    rayColor: 'stage sunburst ray colour',
    ink: 'outline colour of the fuse and numerals',
    textColor: 'READY? / beat numeral fill colour',
    accent: 'numeral colour for the last 2 beats, GO! fill and beat pulse bar',
    accent2: 'hard-shadow colour of READY? and the numeral',
    alert: 'hard-shadow colour of GO! and the last-2-beats numeral',
  },
  component: FuseBeatTimer,
  tags: ['fuse', 'timer', 'countdown', 'beat', 'bpm', 'spark', 'bomb', 'rocket', 'microgame', 'game show', 'quiz', 'challenge', 'toon', 'hud', 'limited time', 'on-beat', 'hard shadow', 'stars', 'knots'],
});
