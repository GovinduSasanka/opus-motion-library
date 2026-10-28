// Adapted from mg-styles-15/demos/05-cel-boil/js/scene.js (MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md
// (choreography ideas: wake, look, hops with arc guides, ta-da, pancake squash; the flame design is our own)
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {
  CEL,
  CelPaper,
  E,
  exposure,
  ExpRow,
  FlameArm,
  FlameFace,
  FlameSpirit,
  FlameState,
  InkBox,
  K,
  LightPool,
  Slate,
  Twinkle,
  clamp01,
  hs,
  inv,
  lerp,
  springT,
} from '../../core/r2-mg1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  background: string;
  outer: string;
  inner: string;
  ink: string;
  poolColor: string;
  boxTop: string;
  boxFront: string;
  showBox: boolean;
  arms: boolean;
  expression: 'auto' | 'neutral' | 'happy' | 'sleepy' | 'determined' | 'squeezed';
  flicker: number;
  boilAmp: number;
  size: number;
  slate: boolean;
  sceneLabel: string;
  seed: number;
};

// exposure sheet: 2s acting, 1s for take-offs / landings / the pop, 3s on holds
const SCHED: ExpRow[] = [
  [0, 24, 2],
  [24, 60, 2],
  [60, 150, 1],
  [150, 186, 3],
  [186, 216, 1],
  [216, 240, 3],
];
const HOPS = [
  {a: 66, dx: -0.75},
  {a: 92, dx: 1.45},
  {a: 118, dx: -0.7},
];
const hopState = (f: number) => {
  // returns x offset (in units of hop width), y lift (0..1), squash, flags
  let x = 0;
  let lift = 0;
  let sy = 1;
  let r = 0;
  let phase: 'ground' | 'crouch' | 'air' | 'land' = 'ground';
  let smear = false;
  let next = -1;
  let p = 0;
  for (let i = 0; i < HOPS.length; i++) {
    const {a, dx} = HOPS[i];
    const x0 = x;
    const x1 = x + dx;
    if (f < a) {
      next = i;
      break;
    }
    if (f < a + 4) {
      phase = 'crouch';
      p = (f - a) / 4;
      sy = lerp(1, 0.72, E.out2(p));
      next = i;
      x = x0;
      break;
    }
    if (f < a + 18) {
      phase = 'air';
      p = (f - a - 4) / 14;
      x = lerp(x0, x1, E.io2(p));
      lift = 4 * p * (1 - p);
      sy = p < 0.08 ? 1.32 : lerp(1.16, 1.0, Math.min(1, p * 2)) + (p > 0.6 ? (p - 0.6) * 0.3 : 0);
      r = Math.sign(dx) * 0.16 * Math.sin(Math.PI * p);
      smear = f === a + 4;
      next = i;
      break;
    }
    x = x1;
    if (f < a + 26) {
      phase = 'land';
      const t = (f - a - 18) / 30;
      sy = 1 - 0.32 * Math.exp(-t / 0.05) * Math.cos(40 * t);
    }
  }
  return {x, lift, sy, r, phase, smear, next, p};
};

const FlameSprite: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const W = w / u;
  const H = h / u;
  const {fq, id, step} = exposure(frame, SCHED, 3);
  const cx = W / 2;
  const tall = H > W * 1.2;
  const GY = tall ? H * 0.56 : H / 2 + 170;
  const FH = (tall ? 330 : 285) * p.size;
  const bw = Math.min(780, W * (tall ? 0.86 : 0.8));
  const hopW = Math.min(290, bw * 0.3);
  const seed = p.seed * 97 + id;

  // ---- choreography (on quantised time fq) --------------------------------------------------
  const ignite = springT((fq - 2) / 30, 2.0, 0.45);
  const hop = hopState(fq);
  let face: FlameFace = {eyes: 'sleepy', mouth: 'flat'};
  let armL: FlameArm = {ang: -1.05, len: 0.36, bend: 0.25};
  let armR: FlameArm = {ang: -1.05, len: 0.36, bend: 0.25};
  let sx = 1;
  let sy = 1;
  let kx = 0;
  let smearUp = false;
  if (fq < 24) face = {eyes: 'sleepy', mouth: 'flat'};
  else if (fq < 60) {
    const pop = fq < 30 ? 1.3 : 1;
    face = {eyes: fq >= 38 && fq < 42 ? 'closed' : 'open', mouth: fq < 30 ? 'o' : 'smile', pop, look: fq < 44 ? 0 : fq < 52 ? -1 : fq < 58 ? 1 : 0};
    if (fq >= 44 && fq < 58) kx = (fq < 52 ? -1 : 1) * 0.05;
  } else if (fq < 150) {
    face = hop.phase === 'crouch' ? {eyes: 'fierce', mouth: 'flat'} : hop.phase === 'air' ? {eyes: 'open', mouth: 'o', pop: 1.1} : {eyes: 'happy', mouth: 'smile', cheeks: true};
    if (hop.phase === 'ground' && fq < 66) face = {eyes: 'fierce', mouth: 'flat'};
    sy = hop.sy;
    sx = 1 / Math.sqrt(sy);
    smearUp = hop.smear;
    if (hop.phase === 'air') {
      armL = {ang: 0.9, len: 0.4, bend: 0.4};
      armR = {ang: 0.9, len: 0.4, bend: 0.4};
    }
  } else if (fq < 186) {
    face = {eyes: 'happy', mouth: 'grin', cheeks: true};
    const k = springT((fq - 150) / 30, 2.2, 0.4);
    armL = {ang: lerp(-1.05, 1.15, k), len: 0.44, bend: 0.2, big: 1.15};
    armR = {ang: lerp(-1.05, 1.15, k), len: 0.44, bend: 0.2, big: 1.15};
    sy = 1 + 0.06 * Math.sin((fq - 150) * 0.35) * Math.exp(-(fq - 150) / 20);
  } else if (fq < 200) {
    const k = E.out3(inv(186, 196, fq));
    sy = lerp(1, 0.46, k);
    sx = lerp(1, 1.6, k);
    face = {eyes: 'squeeze', mouth: 'flat'};
    armL = {ang: -0.3, len: 0.3, bend: 0.5};
    armR = {ang: -0.3, len: 0.3, bend: 0.5};
  } else {
    const t = (fq - 200) / 30;
    const k = springT(t, 2.4, 0.38);
    sy = lerp(1.45, 1, k);
    sx = 1 / Math.sqrt(sy);
    smearUp = fq === 200;
    face = fq >= 222 && fq < 230 ? {eyes: 'wink', mouth: 'grin', cheeks: true} : {eyes: 'happy', mouth: 'smile', cheeks: true};
    armL = {ang: -1.0, len: 0.36, bend: 0.25};
    armR = {ang: 0.9 + 0.4 * Math.sin((fq - 200) * 0.5), len: 0.42, bend: 0.3, big: 1.1};
  }
  if (p.expression !== 'auto') {
    const map: Record<string, FlameFace> = {
      neutral: {eyes: 'open', mouth: 'smile'},
      happy: {eyes: 'happy', mouth: 'grin', cheeks: true},
      sleepy: {eyes: 'sleepy', mouth: 'flat'},
      determined: {eyes: 'fierce', mouth: 'flat'},
      squeezed: {eyes: 'squeeze', mouth: 'flat'},
    };
    face = {...map[p.expression], look: face.look};
  }
  const fx = cx + hop.x * hopW;
  const fy = GY - hop.lift * 190;
  const s: FlameState = {
    x: fx,
    y: fy,
    H: FH * Math.max(0.04, ignite),
    sx,
    sy,
    kx,
    curl: 0.03 * Math.sin(id * 1.3),
    r: hop.r,
    seed,
    wild: 0.12 + p.flicker * 0.1,
    lick: 0.6 + p.flicker,
    face,
    arms: p.arms && fq >= 24 ? {L: armL, R: armR} : null,
    smearUp,
  };

  // dotted arc guide (red col-erase pencil) for the next hop, drawn ahead during the crouch
  const arcs: React.ReactNode[] = [];
  if (fq >= 58 && fq < 150) {
    let x0 = 0;
    HOPS.forEach((hh, i) => {
      const x1 = x0 + hh.dx;
      const show = clamp01(inv(hh.a - 8, hh.a, fq)) * (1 - clamp01(inv(hh.a + 20, hh.a + 28, fq)));
      if (show > 0) {
        const n = 16;
        for (let k = 0; k <= n; k++) {
          const q = k / n;
          if (q > show) break;
          const xx = cx + lerp(x0, x1, q) * hopW;
          const yy = GY - FH * 0.55 - 4 * q * (1 - q) * 190;
          arcs.push(<circle key={`${i}-${k}`} cx={xx + (hs(id, k) - 0.5) * 2} cy={yy + (hs(id, k, 1) - 0.5) * 2} r={3.4} fill={CEL.pencil} opacity={0.85} />);
        }
      }
      x0 = x1;
    });
  }

  // ta-da sparkles (hold on 3s)
  const sparks: React.ReactNode[] = [];
  if (fq >= 150 && fq < 200) {
    for (let k = 0; k < 4; k++) {
      const t = (fq - 152 - k * 3) / 30;
      if (t < 0) continue;
      const sc = springT(t, 2.4, 0.4) * (fq >= 186 ? 1 - inv(186, 196, fq) : 1);
      const a = -Math.PI / 2 + (k - 1.5) * 0.75;
      const R = FH * 0.95;
      sparks.push(<Twinkle key={k} x={fx + Math.cos(a) * R * 1.15} y={GY - FH * 0.5 + Math.sin(a) * R} R={26 * sc} seed={seed + k * 5} />);
    }
  }

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <g transform={`scale(${u})`}>
          <CelPaper w={W} h={H} color={p.background} drawing={id} id="mg1-flame" />
          <LightPool x={cx} y={GY - FH * 0.55} r={Math.min(W, H) * 0.36} seed={7 + (id % 4)} colors={[p.poolColor, mixPool(p.poolColor)]} amp={5 * p.boilAmp} />
          {p.showBox && <InkBox x={cx - bw / 2} y={GY + 18} w={bw} h={190} depth={70} seed={40 + (id % 4)} top={p.boxTop} front={p.boxFront} ink={p.ink} amp={p.boilAmp} />}
          {arcs}
          <FlameSpirit s={s} colors={{outer: p.outer, inner: p.inner, ink: p.ink}} amp={p.boilAmp} />
          {sparks}
          {p.slate && <Slate W={W} H={H} scene={p.sceneLabel} drawing={id} step={step} font={fonts.hand} offset={1} />}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};
const mixPool = (c: string) => c + 'aa';

export const flameSprite = defineMotion<Props>({
  id: 'flame-sprite',
  title: 'Flame sprite',
  category: 'character',
  description:
    'A hand-inked flame mascot (red outer, yellow core, paper-white glint, dot eyes, rubber-hose arms with white gloves) wakes on a cream paper stage, looks around, hops three times along red dotted arc guides with squash and stretch, throws a ta-da with sparkles, squashes to a pancake and pops back with a wink — all on ones, twos and threes with boiling ink.',
  source: ['mg-styles-15 05-cel-boil 1.0-6.5 s (MIT, Vincentwei1021) — technique after mg-styles-15; own character design'],
  useFor: 'A warm mascot for energy, ideas, "spark" and craft metaphors; intros, explainers and stickers with hand-animation charm.',
  durationInFrames: 240,
  defaultProps: {
    background: '#F4E9D0',
    outer: '#E5402B',
    inner: '#FFC425',
    ink: '#1C1613',
    poolColor: '#F3DC93',
    boxTop: '#E5402B',
    boxFront: '#FFC425',
    showBox: true,
    arms: true,
    expression: 'auto',
    flicker: 0.4,
    boilAmp: 1,
    size: 1,
    slate: true,
    sceneLabel: 'SC. 01',
    seed: 1,
  },
  propDocs: {
    background: 'paper colour',
    outer: 'outer flame colour',
    inner: 'inner flame colour',
    ink: 'ink line colour',
    poolColor: 'stepped light-pool colour behind the flame',
    boxTop: 'stage box top colour',
    boxFront: 'stage box front colour',
    showBox: 'draw the inked box the flame stands on',
    arms: 'rubber-hose arms with gloves',
    expression: "'auto' runs the acting script; or lock a face: neutral | happy | sleepy | determined | squeezed",
    flicker: 'how much the flame tongues lick between drawings (0–1)',
    boilAmp: 'line-boil strength multiplier',
    size: 'flame size multiplier',
    slate: 'show the scene slate and drawing counter',
    sceneLabel: 'slate text top-left',
    seed: 'variation seed',
  },
  component: FlameSprite,
  tags: ['flame', 'fire', 'mascot', 'character', 'cel', 'hand-drawn', 'line boil', 'on twos', 'rubber hose', 'squash and stretch', 'hop', 'cartoon', 'spark', 'idea', 'paper', 'mg-styles-15', 'cel-boil'],
});
