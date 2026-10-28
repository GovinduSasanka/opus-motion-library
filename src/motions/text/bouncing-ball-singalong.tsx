import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {loadFont as imFell} from '@remotion/google-fonts/IMFellEnglishSC';
import {loadFont as limelight} from '@remotion/google-fonts/Limelight';
import {resolveSrc} from '../../core/asset';
import {ease, clamp} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {FilmGrain, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Cinema singalong: lyrics / a slogan on a period title card; a white ball hops from word to word exactly on the
 * beat (parabolic arc, apex ≈ 0.6 × the distance, min 0.08 H), squashing 0.75 / 1.2 for two frames when it lands,
 * and each word it touches fills from a paper-white outline to solid. Plate rgba(12,11,10,.92), white double-rule
 * border, dot-and-ring corners, small-caps serif. One hop per beat (or per cue list).
 */
type Props = {
  lines: string[];
  title: string;
  cues: number[];
  bpm: number;
  startAt: number;
  ballColor: string;
  textColor: string;
  litColor: string;
  highlight: string;
  cardStyle: string;
  font: string;
  background: string;
  src: string;
  grain: boolean;
  exit: boolean;
};

const periodFont = imFell('normal', {weights: ['400'], subsets: ['latin']}).fontFamily;
const showFont = limelight('normal', {weights: ['400'], subsets: ['latin']}).fontFamily;

const BouncingBallSingalong: React.FC<Props> = ({lines, title, cues, bpm, startAt, ballColor, textColor, litColor, highlight, cardStyle, font, background, src, grain, exit}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const period = cardStyle !== 'modern';
  const family = font === 'limelight' ? showFont : font === 'sans' ? fonts.sans : period ? periodFont : fonts.sans;
  const cw = font === 'limelight' ? 0.64 : period ? 0.66 : 0.6; // average cap width in em (+ tracking)

  const words = lines.map((l) => l.trim().split(/\s+/).filter(Boolean));
  const flat = words.flatMap((ws, li) => ws.map((wd, wi) => ({wd, li, wi})));
  const N = flat.length;
  const beat = (fps * 60) / Math.max(30, bpm);
  const cueF = flat.map((_, i) => (cues[i] !== undefined ? cues[i] : Math.round(startAt + i * beat)));

  // card + type size
  const cardW = Math.min(w * (portrait ? 0.92 : 0.8), 1500 * u);
  const innerW = cardW * 0.86;
  const lineChars = words.map((ws) => ws.join(' ').length + 0.0);
  const maxChars = Math.max(8, ...lineChars);
  const fs = Math.min(h * (portrait ? 0.075 : 0.105), innerW / (maxChars * (cw + 0.04)));
  const lineGap = fs * 2.15;
  const capH = fs * 0.7;
  const r = fs * 0.3;
  const blockH = (lines.length - 1) * lineGap + fs;
  const cardH = blockH + fs * 3.9 + (title ? fs * 0.8 : 0);
  const cardX = (w - cardW) / 2;
  const cardY = (h - cardH) / 2 + fs * 0.4;
  const firstBase = cardY + fs * 2.9 + (title ? fs * 0.8 : 0) + fs * 0.7;

  // measured layout (estimated widths; textLength pins each word to its box so the ball lands on its centre)
  const wordW = (s: string) => s.length * fs * (cw + 0.04);
  const space = fs * 0.55;
  type Box = {x: number; cx: number; wdt: number; base: number; wd: string};
  const boxes: Box[] = [];
  words.forEach((ws, li) => {
    const total = ws.reduce((a, s) => a + wordW(s), 0) + (ws.length - 1) * space;
    let x = (w - total) / 2;
    ws.forEach((wd) => {
      const wdt = wordW(wd);
      boxes.push({x, cx: x + wdt / 2, wdt, base: firstBase + li * lineGap, wd});
      x += wdt + space;
    });
  });

  // ball
  const contactY = (b: Box) => b.base - capH - r * 1.02;
  const ballAt = (() => {
    if (!N) return {x: w / 2, y: -r, sx: 1, sy: 1};
    const first = boxes[0];
    if (frame < cueF[0]) {
      const t0 = cueF[0] - 16;
      const p = clamp((frame - t0) / 16);
      const y = -r * 2 + (contactY(first) + r * 2) * ease.in(p);
      return {x: first.cx, y, sx: 1 - 0.1 * (1 - p), sy: 1 + 0.12 * (1 - p)};
    }
    let i = 0;
    for (let k = 0; k < N; k++) if (frame >= cueF[k]) i = k;
    const since = frame - cueF[i];
    const b = boxes[i];
    const next = i + 1 < N ? boxes[i + 1] : null;
    const nextF = i + 1 < N ? cueF[i + 1] : cueF[i] + Math.round(beat * 1.2);
    let x = b.cx;
    let y = contactY(b);
    let sx = 1;
    let sy = 1;
    const span = Math.max(2, nextF - cueF[i]);
    const p = clamp(since / span);
    const tx = next ? next.cx : w + r * 3;
    const ty = next ? contactY(next) : contactY(b) + fs * 0.4;
    const dist = Math.hypot(tx - b.cx, ty - contactY(b));
    const apex = Math.min(Math.max(0.6 * dist, 0.08 * h), h * 0.2);
    if (next || (exit && i === N - 1)) {
      const pe = exit || next ? p : 0;
      x = b.cx + (tx - b.cx) * pe;
      y = contactY(b) + (ty - contactY(b)) * pe - 4 * apex * pe * (1 - pe);
      sy = 1 + 0.1 * Math.sin(Math.PI * pe);
      sx = 1 - 0.05 * Math.sin(Math.PI * pe);
    }
    if (since < 2) {
      sx = 1.2;
      sy = 0.75;
    } else if (since < 6) {
      const q = (since - 2) / 4;
      sx = 1.2 - 0.2 * q + 0.04 * Math.sin(q * Math.PI);
      sy = 0.75 + 0.25 * q - 0.05 * Math.sin(q * Math.PI);
    }
    if (!next && !exit) {
      x = b.cx;
      y = contactY(b);
    }
    return {x, y, sx, sy};
  })();

  const cardIn = ease.out(clamp(frame / 14));
  const lastF = cueF[N - 1] ?? 0;
  const fadeOut = exit ? clamp((frame - (lastF + beat * 1.6)) / 12) : 0;

  return (
    <AbsoluteFill style={{background: period ? `radial-gradient(ellipse 85% 75% at 50% 45%, ${background} 0%, #1a130d 130%)` : background}}>
      {src ? <Img src={resolveSrc(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55, filter: period ? 'sepia(0.7) contrast(1.05)' : 'none'}} /> : null}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="bbs-ball" cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.6" stopColor={ballColor} />
            <stop offset="1" stopColor="#B9B3A6" />
          </radialGradient>
        </defs>
        <g opacity={cardIn * (1 - fadeOut * 0.0)} transform={`translate(${w / 2} ${h / 2}) scale(${0.94 + 0.06 * cardIn}) translate(${-w / 2} ${-h / 2})`}>
          {period ? (
            <g>
              <rect x={cardX} y={cardY} width={cardW} height={cardH} fill="rgba(12,11,10,0.92)" />
              <rect x={cardX + 10 * u} y={cardY + 10 * u} width={cardW - 20 * u} height={cardH - 20 * u} fill="none" stroke="#F4EFE3" strokeWidth={3 * u} />
              <rect x={cardX + 20 * u} y={cardY + 20 * u} width={cardW - 40 * u} height={cardH - 40 * u} fill="none" stroke="#F4EFE3" strokeWidth={1.2 * u} />
              {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b], i) => {
                const px = cardX + 20 * u + a * (cardW - 40 * u);
                const py = cardY + 20 * u + b * (cardH - 40 * u);
                return (
                  <g key={i}>
                    <circle cx={px} cy={py} r={8 * u} fill="#0C0B0A" stroke="#F4EFE3" strokeWidth={1.5 * u} />
                    <circle cx={px} cy={py} r={2.6 * u} fill="#F4EFE3" />
                  </g>
                );
              })}
            </g>
          ) : (
            <g>
              <rect x={cardX} y={cardY} width={cardW} height={cardH} rx={26 * u} fill="rgba(16,22,44,0.94)" />
              <rect x={cardX + cardW * 0.07} y={cardY + cardH - fs * 0.95} width={cardW * 0.86} height={4 * u} rx={2 * u} fill={litColor} opacity={0.7} />
            </g>
          )}
          {title ? (
            <text x={w / 2} y={cardY + fs * 1.75} textAnchor="middle" fontFamily={family} fontSize={fs * 0.42} letterSpacing={fs * 0.12} fill={textColor} opacity={0.8}>
              {title.toUpperCase()}
            </text>
          ) : null}
          {boxes.map((b, i) => {
            const lit = frame >= cueF[i];
            const k = lit ? clamp((frame - cueF[i]) / 3) : 0;
            const flash = lit && frame - cueF[i] < 4 ? 1.06 : 1;
            const isFill = highlight !== 'brighten';
            return (
              <text
                key={i}
                x={b.cx}
                y={b.base}
                textAnchor="middle"
                textLength={b.wdt}
                lengthAdjust="spacingAndGlyphs"
                fontFamily={family}
                fontSize={fs * flash}
                fill={isFill ? litColor : textColor}
                fillOpacity={isFill ? k : 0.55 + 0.45 * k}
                stroke={textColor}
                strokeWidth={isFill ? fs * 0.022 : 0}
                strokeOpacity={isFill ? 1 - k * 0.2 : 0}
                style={{fontWeight: 400}}
              >
                {b.wd.toUpperCase()}
              </text>
            );
          })}
          {/* ball: shadow on the word + ball */}
          {N ? (
            <g opacity={1 - fadeOut}>
              <g transform={`translate(${ballAt.x} ${ballAt.y}) scale(${ballAt.sx} ${ballAt.sy})`}>
                <circle r={r} fill="url(#bbs-ball)" stroke="#0C0B0A" strokeWidth={r * 0.06} />
              </g>
            </g>
          ) : null}
        </g>
      </svg>
      {grain ? <FilmGrain opacity={0.07} /> : null}
      {period ? <Vignette strength={0.5} /> : null}
    </AbsoluteFill>
  );
};

export const bouncingBallSingalong = defineMotion<Props>({
  id: 'bouncing-ball-singalong',
  title: 'Bouncing-ball singalong',
  category: 'text',
  description:
    'Lyrics or a slogan on a period cinema title card: a white ball hops from word to word on the beat along parabolic arcs, squashing as it lands, and every word lights up (outline to solid) the moment the ball touches it.',
  source: ['lemo-opuscar styles/rubber-hose/STYLE.md §8 "bouncing-ball singalong", §4 title cards (MIT / CC BY 4.0, LemoLab); original implementation'],
  useFor: 'Jingles, slogans, safety rhymes, karaoke captions, kids learning content; works over any backdrop motion (set `background` transparent-ish or pass `src`).',
  durationInFrames: 210,
  defaultProps: {
    lines: ['SING ALONG WITH ME', 'EVERY WORD IN TIME'],
    title: 'Follow the bouncing ball',
    cues: [],
    bpm: 100,
    startAt: 30,
    ballColor: '#F6F2E8',
    textColor: '#F4EFE3',
    litColor: '#FFF3C9',
    highlight: 'fill',
    cardStyle: 'period',
    font: 'serif',
    background: '#4A3A2A',
    src: '',
    grain: true,
    exit: true,
  },
  propDocs: {
    lines: 'lyric lines (replace the sample words)',
    title: 'small heading on the card (empty = none)',
    cues: 'optional frame of each word touch; empty = one hop per beat from bpm',
    bpm: 'beats per minute (one word per beat)',
    startAt: 'frame of the first touch',
    ballColor: 'ball colour',
    textColor: 'outline / unlit word colour',
    litColor: 'colour a touched word fills with',
    highlight: "'fill' (outline to solid) | 'brighten' (55 % to 100 %)",
    cardStyle: "'period' (double-rule cinema card) | 'modern' (rounded dark card)",
    font: "'serif' (small-caps period serif) | 'limelight' (show caps) | 'sans'",
    background: 'backdrop colour (period style darkens it to a vignette)',
    src: 'optional backdrop image (public path), shown dimmed behind the card',
    grain: 'film grain',
    exit: 'ball hops off the card after the last word',
  },
  component: BouncingBallSingalong,
  tags: ['singalong', 'bouncing-ball', 'lyrics', 'karaoke', 'captions', 'title-card', 'rubber-hose', 'retro', '1930s', 'jingle', 'slogan', 'kids', 'rhyme', 'beat', 'highlight', 'squash'],
});
