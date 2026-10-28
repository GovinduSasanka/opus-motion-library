// Adapted from mg-styles-15/demos/05-cel-boil/js/scene.js drawStrikeSmear / smearUp (MIT, © Vincentwei1021)
// — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {CEL, CelPaper, FlameSpirit, IP, P2, Slate, circlePts, fillShape, hs, inkLoop, inkStroke, lerp, speedLineDs, spline, springT, xf} from '../../core/r2-mg1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  background: string;
  subject: 'ball' | 'flame' | 'star';
  color: string;
  accent: string;
  ink: string;
  stretch: number;
  multiples: number;
  streaks: number;
  size: number;
  holdFrames: number;
  ground: boolean;
  slate: boolean;
  seed: number;
};

const STATIONS: P2[] = [
  [0.24, 0.64],
  [0.76, 0.64],
  [0.56, 0.3],
  [0.24, 0.64],
];

type Pose = {x: number; y: number; ax: number; sAlong: number; sAcross: number; op?: number};

const SmearFrame: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const W = w / u;
  const H = h / u;
  const tall = H > W * 1.2;
  const R = 88 * p.size * (tall ? 1.1 : 1);
  const HOLD = Math.max(6, Math.round(p.holdFrames));
  const MOVE = 6 + 2 + 8;
  const CYC = HOLD + MOVE;
  const st = STATIONS.map(([x, y]) => [x * W, (tall ? 0.18 + y * 0.6 : y) * H] as P2);
  const groundY = st[0][1] + R;
  const nMoves = st.length - 1;

  // ---- which phase -------------------------------------------------------------------------------
  const mi = Math.min(nMoves - 1, Math.floor(frame / CYC));
  const lf = frame - mi * CYC;
  const A = st[mi];
  const B = st[mi + 1];
  const dir = Math.atan2(B[1] - A[1], B[0] - A[0]);
  const dist = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const cd = Math.cos(dir);
  const sdn = Math.sin(dir);
  let mode: 'hold' | 'antic' | 'smear' | 'multi' | 'land' = 'hold';
  const after = frame >= nMoves * CYC;
  let pose: Pose = {x: A[0], y: A[1], ax: dir, sAlong: 1, sAcross: 1};
  let drawing = 0;
  let step = 2;
  let landT = 0;
  if (after) {
    const B2 = st[nMoves];
    const t = (frame - nMoves * CYC) / 30;
    mode = 'hold';
    pose = {x: B2[0], y: B2[1], ax: 0, sAlong: 1, sAcross: 1};
    drawing = 400 + Math.floor((frame - nMoves * CYC) / 2);
    landT = t;
  } else if (lf < HOLD) {
    mode = 'hold';
    const q = Math.floor(lf / 2) * 2;
    const bob = Math.sin((q / HOLD) * Math.PI * 2) * 0.03;
    pose = {x: A[0], y: A[1], ax: Math.PI / 2, sAlong: 1 - bob, sAcross: 1 + bob};
    drawing = mi * 40 + Math.floor(lf / 2);
  } else if (lf < HOLD + 6) {
    mode = 'antic';
    step = 1;
    const q = (lf - HOLD + 1) / 6;
    const k = Math.sin(q * Math.PI * 0.5);
    pose = {x: A[0] - cd * R * 0.35 * k, y: A[1] - sdn * R * 0.35 * k, ax: dir, sAlong: 1 - 0.28 * k, sAcross: 1 + 0.2 * k};
    drawing = mi * 40 + 20 + (lf - HOLD);
  } else if (lf === HOLD + 6) {
    mode = 'smear';
    step = 1;
    pose = {x: lerp(A[0], B[0], 0.9), y: lerp(A[1], B[1], 0.9), ax: dir, sAlong: 1, sAcross: 0.8};
    drawing = mi * 40 + 27;
  } else if (lf === HOLD + 7) {
    mode = 'multi';
    step = 1;
    pose = {x: B[0] + cd * R * 0.25, y: B[1] + sdn * R * 0.25, ax: dir, sAlong: 1.12, sAcross: 0.9};
    drawing = mi * 40 + 28;
  } else {
    mode = 'land';
    step = 1;
    landT = (lf - HOLD - 8) / 30;
    const k = 1 - springT(landT, 3.2, 0.32);
    pose = {x: B[0] + cd * R * 0.25 * Math.max(0, k), y: B[1] + sdn * R * 0.25 * Math.max(0, k), ax: dir, sAlong: 1 - 0.3 * k, sAcross: 1 + 0.25 * k};
    drawing = mi * 40 + 29 + (lf - HOLD - 8);
  }
  const seed = p.seed * 53 + drawing;
  const reg: [number, number] = [-5, 4];

  // ---- subject drawing ----------------------------------------------------------------------------
  const subject = (q: Pose, sd: number, key: string, op = 1): React.ReactNode => {
    const xform = (P: IP[]) => {
      // squash/stretch along the travel axis
      const c = Math.cos(q.ax);
      const s = Math.sin(q.ax);
      return P.map(([x, y, cr]) => {
        const a = x * c + y * s;
        const b = -x * s + y * c;
        const a2 = a * q.sAlong;
        const b2 = b * q.sAcross;
        return [q.x + a2 * c - b2 * s, q.y + a2 * s + b2 * c, cr] as IP;
      });
    };
    if (p.subject === 'flame') {
      const sy = q.ax > 1.3 && q.ax < 1.9 ? q.sAlong : q.sAcross;
      return (
        <g key={key} opacity={op}>
          <FlameSpirit
            s={{x: q.x, y: q.y + R, H: R * 3.2, sx: 1 / Math.sqrt(sy), sy, seed: sd, r: Math.abs(Math.cos(q.ax)) > 0.5 && q.sAlong !== 1 ? Math.cos(q.ax) * 0.25 : 0, face: {eyes: mode === 'antic' ? 'fierce' : mode === 'land' ? 'squeeze' : 'open', mouth: mode === 'hold' ? 'smile' : 'o'}, drops: false}}
            colors={{outer: p.color, inner: p.accent, ink: p.ink}}
          />
        </g>
      );
    }
    const base: IP[] =
      p.subject === 'star'
        ? Array.from({length: 10}, (_, i): IP => {
            const a = -Math.PI / 2 + (i * Math.PI) / 5;
            const r = i % 2 ? R * 0.5 : R * 1.15;
            return [Math.cos(a) * r, Math.sin(a) * r, i % 2 ? 0 : 1];
          })
        : circlePts(0, 0, R, 28);
    const d = spline(xform(base), true, 4);
    const hl = xform([
      [-R * 0.45, -R * 0.35],
      [-R * 0.15, -R * 0.62],
    ]);
    return (
      <g key={key} opacity={op}>
        <path d={fillShape(d, {seed: sd, amp: 1.4, dx: reg[0], dy: reg[1]})} fill={p.color} />
        <path d={inkStroke(hl, {seed: sd + 5, w: R * 0.16, t0: 4, t1: 8, amp: 0.8, heavy: 0})} fill={CEL.hi} />
        {inkLoop(d, {seed: sd + 1, w: 5.5, amp: 1.4, heavy: 0.4, splits: 2}).map((dd, i) => (
          <path key={i} d={dd} fill={p.ink} />
        ))}
      </g>
    );
  };

  const layers: React.ReactNode[] = [];
  if (mode === 'smear') {
    // one drawing: the subject stretched back along its path into a tapering hull, streaked with dry brush
    const back = dist * 0.9 * p.stretch;
    const r = R * 0.95;
    const P: IP[] = [
      [r, 0],
      [r * 0.6, r * 0.85],
      [-back * 0.45, r * 0.5],
      [-back, 0, 1],
      [-back * 0.45, -r * 0.5],
      [r * 0.6, -r * 0.85],
    ];
    const d = spline(xf(P, {x: pose.x, y: pose.y, r: dir}), true, 4);
    layers.push(<path key="sm-f" d={fillShape(d, {seed, amp: 1.5, dx: reg[0], dy: reg[1]})} fill={p.color} />);
    // dry-brush streaks inside the hull (paper showing through)
    for (let k = 0; k < p.streaks; k++) {
      const off = (k / Math.max(1, p.streaks - 1) - 0.5) * r * 0.9;
      const L0 = back * (0.25 + 0.5 * hs(seed, k));
      const a: P2 = [pose.x - cd * L0 - sdn * off, pose.y - sdn * L0 + cd * off];
      const b: P2 = [pose.x - cd * (back * 0.95) - sdn * off * 0.4, pose.y - sdn * (back * 0.95) + cd * off * 0.4];
      layers.push(<path key={'st' + k} d={inkStroke([a, b], {seed: seed * 3 + k, w: 4, t0: 30, t1: 30, min: 0.05, amp: 1, heavy: 0})} fill={CEL.hi} opacity={0.9} />);
    }
    inkLoop(d, {seed: seed + 2, w: 5.5, amp: 1.5, splits: 2}).forEach((dd, i) => layers.push(<path key={'sm-l' + i} d={dd} fill={p.ink} />));
  } else if (mode === 'multi') {
    // multiples: overlapping copies between the last two poses
    const n = Math.max(2, Math.round(p.multiples));
    for (let k = 0; k < n; k++) {
      const q = 0.3 + (k / n) * 0.62;
      layers.push(subject({x: lerp(A[0], B[0], q), y: lerp(A[1], B[1], q), ax: dir, sAlong: 1.05, sAcross: 0.92}, seed + 10 + k, 'm' + k, 0.62 + 0.3 * (k / n)));
    }
    layers.push(subject(pose, seed, 'main'));
  } else {
    layers.push(subject(pose, seed, 'main'));
  }
  // speed lines trailing behind the arrival (on 1s, 4 frames)
  if (mode === 'multi' || (mode === 'land' && landT < 5 / 30)) {
    const fade = mode === 'multi' ? 1 : 1 - landT * 6;
    speedLineDs(pose.x - cd * R * 1.6, pose.y - sdn * R * 1.6, dir, 4, dist * 0.35, R * 1.5, seed + 77, 4.2).forEach((d, i) =>
      layers.push(<path key={'sl' + i} d={d} fill={p.ink} opacity={fade} />),
    );
  }
  // impact star when landing on the ground after a fall
  if (mode === 'land' && landT < 3 / 30 && B[1] >= groundY - R - 1 && sdn > 0.3) {
    const P: IP[] = Array.from({length: 16}, (_, i): IP => {
      const a = (i / 16) * Math.PI * 2;
      const r = (i % 2 ? 0.45 : 1) * R * (1.6 + 0.4 * hs(seed, i));
      return [pose.x + Math.cos(a) * r * 1.3, groundY - 6 + Math.sin(a) * r * 0.6, 1];
    });
    layers.unshift(<path key="imp" d={fillShape(spline(P, true, 6), {seed, amp: 1.5})} fill={p.accent} />);
  }

  const shadowY = groundY + 8;
  const air = Math.max(0, groundY - R - pose.y);
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <g transform={`scale(${u})`}>
          {p.background !== 'transparent' && <CelPaper w={W} h={H} color={p.background} drawing={drawing} id="mg1-smear" />}
          {p.ground && (
            <>
              <path d={inkStroke([[W * 0.08, groundY + 14], [W * 0.5, groundY + 18], [W * 0.92, groundY + 12]], {seed: p.seed + Math.floor(drawing / 2), w: 4.5, amp: 1.6})} fill={p.ink} />
              <ellipse cx={pose.x} cy={shadowY} rx={R * (1.1 - Math.min(0.6, air / 900))} ry={R * 0.16} fill={p.ink} opacity={0.18} />
            </>
          )}
          {layers}
          {p.slate && <Slate W={W} H={H} scene="SMEAR" drawing={drawing} step={step} font={fonts.hand} offset={1} />}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const smearFrame = defineMotion<Props>({
  id: 'smear-frame',
  title: 'Smear frame',
  category: 'fx',
  description:
    'Hand-animation smears: a red ink ball (or the flame mascot, or a star) holds on twos, anticipates, then whips to its next spot in one stretched dry-brush smear drawing followed by one "multiples" drawing of overlapping copies, landing with squash, trailing speed lines and an impact star on the slam.',
  source: ['mg-styles-15 05-cel-boil 0.29-0.46 s, scene.js drawStrikeSmear / smearUp (MIT, Vincentwei1021) — technique after mg-styles-15'],
  useFor: 'Instant "animator craft" accents on hits, whooshes and logo slams; the multiples / smear grammar for any fast move in a hand-drawn piece.',
  durationInFrames: 150,
  defaultProps: {
    background: '#F4E9D0',
    subject: 'ball',
    color: '#E5402B',
    accent: '#FFC425',
    ink: '#1C1613',
    stretch: 1,
    multiples: 3,
    streaks: 5,
    size: 1,
    holdFrames: 20,
    ground: true,
    slate: true,
    seed: 1,
  },
  propDocs: {
    background: "paper colour ('transparent' to overlay)",
    subject: 'ball | flame | star',
    color: 'subject fill colour',
    accent: 'impact star / inner flame colour',
    ink: 'ink colour',
    stretch: 'smear length as a fraction of the move (1 ≈ 90 %)',
    multiples: 'copies in the multiples drawing (3–4)',
    streaks: 'dry-brush streaks inside the smear',
    size: 'subject size multiplier',
    holdFrames: 'frames held (on twos) at each station before the next whip',
    ground: 'ink ground line and contact shadow',
    slate: 'show exposure + drawing counter',
    seed: 'variation seed',
  },
  component: SmearFrame,
  tags: ['smear', 'smear frame', 'multiples', 'motion blur', 'whoosh', 'hit', 'cel', 'hand-drawn', 'ink', 'squash and stretch', 'anticipation', 'speed lines', 'on ones', 'cartoon', 'mg-styles-15', 'cel-boil'],
});
