// Adapted from lemo-opuscar/styles/newsreel/demo/index.html (scenePaper) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {FilmGrain} from '../../core/stage';
import {Newspaper, OldFilm, PencilStroke, WaxFilter, clamp, eo, greaseRing, jolt, lbf, lerp, seg, ss} from '../../core/r2-lb1-kit';

/**
 * Newsreel "the headline said…" move: a newspaper spins out of the dark desk into the lens — tiny and turning fast,
 * growing and decelerating through 2.5 turns with three faint motion-blur ghosts — slams flat with a vertical jolt
 * and a 3 % bounce, pushes toward the headline, punches in on a beat, then a grease-pencil ring is drawn around the
 * detail. Warm-silver 1.37:1 projector gate with flicker, scratches and dust; the paper is procedural unless `src`
 * is given.
 */

type Props = {
  src: string;
  masthead: string;
  headline: string;
  subhead: string;
  dateline: string;
  focus: [number, number];
  punchAt: number;
  punchFocus: [number, number];
  punchScale: number;
  flyFrames: number;
  turns: number;
  ghosts: number;
  ringAt: number;
  ring: boolean;
  ringColor: string;
  gate: number;
  damage: number;
  seed: number;
  background: string;
};

const SpinningHeadline: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = 'spinning-headline';
  // portrait: no 1.37:1 gate (it left black bars) and a gentler punch-in so the headline stays inside the frame width
  const gateA = portrait ? 0 : p.gate;
  const punchScaleA = portrait ? Math.min(p.punchScale, 1) : p.punchScale;
  const pushAmt = portrait ? 0.05 : 0.18;
  // gate rect
  let gx = 0;
  let gy = 0;
  let gw = w;
  let gh = h;
  if (gateA > 0) {
    if (w / h > gateA) {
      gw = h * gateA;
      gx = (w - gw) / 2;
    } else {
      gh = w / gateA;
      gy = (h - gh) / 2;
    }
  }
  // paper size: fits inside the gate
  const PW = Math.min(gw, gh * 0.78) * 0.92;
  const PH = PW * 1.3;
  const fitK = Math.min(gw / PW, gh / PH) * 0.86;
  const T = p.flyFrames;
  const uF = ss(seg(frame, 0, T));
  const scale = fitK * (0.06 + 0.94 * Math.pow(uF, 2.3));
  const rot = -Math.pow(1 - uF, 1.25) * p.turns * 360;
  const d = Math.max(0, (frame - T) / 30);
  const slam = jolt(d, 14, 70) * 16 * u;
  const kick = frame >= T ? Math.exp(-18 * d) * Math.cos(55 * d) * 0.03 : 0;
  // push toward the headline then punch-in
  const pushK = ss(seg(frame, T + 6, p.punchAt - 2));
  const punchK = eo(seg(frame, p.punchAt, p.punchAt + 4));
  const creep = seg(frame, p.punchAt + 4, p.punchAt + 80) * 0.05;
  const zoom = (1 + pushAmt * pushK) * lerp(1, punchScaleA, punchK) * (1 + creep * punchK);
  const focus: [number, number] = [lerp(0.5, lerp(p.focus[0], p.punchFocus[0], punchK), Math.max(pushK * 0.7, punchK)), lerp(0.5, lerp(p.focus[1], p.punchFocus[1], punchK), Math.max(pushK * 0.7, punchK))];
  const cx = gx + gw / 2;
  const cy = gy + gh / 2 + slam;
  const fx = (focus[0] - 0.5) * PW;
  const fy = (focus[1] - 0.5) * PH;
  const sc = scale * zoom * (1 + kick);
  const paper = (
    <g id={`${id}-paper`}>
      {p.src ? (
        <foreignObject x={-PW / 2} y={-PH / 2} width={PW} height={PH}>
          <Img src={resolveSrc(p.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </foreignObject>
      ) : (
        <g transform={`translate(${-PW / 2} ${-PH / 2})`}>
          <Newspaper W={PW} H={PH} masthead={p.masthead} headline={p.headline} subhead={p.subhead} dateline={p.dateline} seed={p.seed} serif={lbf('fell')} condensed={lbf('oswald')} id={id} />
        </g>
      )}
    </g>
  );
  const ghostEls: React.ReactNode[] = [];
  if (frame < T) {
    for (let k2 = 1; k2 <= p.ghosts; k2++) {
      const fg = frame - 0.018 * 30 * k2 * (T / 36);
      if (fg < 0) continue;
      const ug = ss(seg(fg, 0, T));
      const sg = fitK * (0.06 + 0.94 * Math.pow(ug, 2.3)) * zoom;
      const rg = -Math.pow(1 - ug, 1.25) * p.turns * 360;
      ghostEls.push(
        <g key={k2} transform={`translate(${cx} ${cy}) scale(${sg}) rotate(${rg}) translate(${-fx * 0} 0)`} opacity={0.22}>
          <use href={`#${id}-paper`} />
        </g>,
      );
    }
  }
  // grease ring around the punch focus (paper space)
  const ringPts = React.useMemo(
    () => greaseRing(-PW / 2 + p.punchFocus[0] * PW, -PH / 2 + p.punchFocus[1] * PH, PW * 0.17, PH * 0.055, -0.08, p.seed, u / Math.max(0.3, fitK)),
    [PW, PH, p.punchFocus[0], p.punchFocus[1], p.seed, u, fitK],
  );
  const ringK = p.ring ? eo(seg(frame, p.ringAt, p.ringAt + 9)) : 0;
  return (
    <AbsoluteFill style={{background: p.background, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id={`${id}-desk`} cx={cx} cy={cy} r={Math.max(gw, gh) * 0.7} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#5B5751" />
            <stop offset="1" stopColor="#151413" />
          </radialGradient>
          <filter id={`${id}-sh`} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx={14 * u * clamp(1 - uF + 0.2)} dy={14 * u * clamp(1 - uF + 0.2)} stdDeviation={(40 - 26 * uF) * u} floodColor="#000" floodOpacity={0.6} />
          </filter>
          <WaxFilter id={`${id}-wax`} u={u} />
          {/* warm-silver grade on the paper */}
          <filter id={`${id}-silver`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope={1.04} intercept={-0.015} />
              <feFuncG type="linear" slope={1.0} intercept={-0.02} />
              <feFuncB type="linear" slope={0.88} intercept={-0.02} />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect x={gx} y={gy} width={gw} height={gh} fill={`url(#${id}-desk)`} />
        <g filter={`url(#${id}-silver)`}>
          {ghostEls}
          <g transform={`translate(${cx} ${cy}) scale(${sc}) rotate(${rot}) translate(${-fx * Math.max(pushK, punchK)} ${-fy * Math.max(pushK, punchK)})`} filter={frame < T + 10 ? `url(#${id}-sh)` : undefined}>
            {paper}
            {ringK > 0 && <PencilStroke pts={ringPts} p={ringK} color={p.ringColor} width={(7 * u) / Math.max(0.35, sc)} u={u / Math.max(0.35, sc)} filter={`url(#${id}-wax)`} />}
          </g>
        </g>
      </svg>
      <OldFilm id={id} frame={frame} w={w} h={h} u={u} gate={gateA} flicker={0.035 * p.damage} scratches={Math.round(3 * p.damage)} dust={Math.round(4 * p.damage)} hair={p.damage > 0.5} vignette={0.55 * p.damage + 0.15} />
      <FilmGrain opacity={0.07 * p.damage} />
    </AbsoluteFill>
  );
};

export const spinningHeadline = defineMotion<Props>({
  id: 'spinning-headline',
  title: 'Spinning headline (newsreel paper)',
  category: 'image',
  description:
    'A newspaper spins out of the dark desk into the lens — growing and decelerating through 2.5 turns with faint motion-blur ghosts — slams flat with a jolt, pushes toward the headline, punches in on a beat, and a warm-white grease-pencil ring is drawn around the detail; all inside a flickering 1.37:1 projector gate.',
  source: ['lemo-opuscar styles/newsreel (MIT code, CC BY 4.0 docs, LemoLab) — demo/index.html scenePaper'],
  useFor: '"The headline said…" beats in history, PR, legal, true-crime and news explainers; works with your own front-page image.',
  durationInFrames: 150,
  defaultProps: {
    src: '',
    masthead: 'The Northwind Herald',
    headline: 'CANAL OPENS AT LAST',
    subhead: 'Ten thousand turn out for the first crossing',
    dateline: 'MONDAY, MARCH 14, 1927',
    focus: [0.5, 0.26],
    punchAt: 84,
    punchFocus: [0.5, 0.26],
    punchScale: 2.1,
    flyFrames: 36,
    turns: 2.5,
    ghosts: 3,
    ringAt: 100,
    ring: true,
    ringColor: 'rgba(250,248,240,0.92)',
    gate: 1.37,
    damage: 1,
    seed: 3,
    background: '#000000',
  },
  propDocs: {
    src: 'optional newspaper / telegram / poster image (replaces the procedural front page)',
    masthead: 'procedural paper: masthead',
    headline: 'procedural paper: big headline',
    subhead: 'procedural paper: subhead',
    dateline: 'procedural paper: dateline',
    focus: 'push target [x, y] 0..1 of the paper',
    punchAt: 'frame of the punch-in',
    punchFocus: 'punch-in target [x, y]',
    punchScale: 'punch-in scale',
    flyFrames: 'frames for the spin-in',
    turns: 'revolutions during the fly',
    ghosts: 'motion-blur ghost copies (0–3)',
    ringAt: 'frame the grease ring starts',
    ring: 'draw the grease-pencil ring',
    ringColor: 'ring colour',
    gate: 'pillarbox gate aspect (0 = none)',
    damage: 'projector damage amount 0..1 (flicker, scratches, dust, grain)',
    seed: 'variation seed',
    background: 'outside-gate colour',
  },
  component: SpinningHeadline,
  tags: ['newspaper', 'headline', 'spin', 'newsreel', '1920s', 'archive', 'vintage', 'montage', 'slam', 'punch in', 'grease pencil', 'film gate', 'history'],
});
