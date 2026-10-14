import React from 'react';
import {Easing} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {FxRoot, isClear, useFx, weightedPick} from '../../core/fx-kit';
import {n2, rng, range} from '../../core/random';
import {Svg} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video17 confetti-burst-fill (141 flat shapes explode out of the ball and tile the frame,
 * easeOutBack 1.3 over ~0.35 s, +-90 deg spin in flight, 3 ghost copies for motion blur),
 * video7 impact-confetti (3-12 tiny squares, up-and-out, gentle gravity, 0.25-0.4 s life) and
 * video14 style-swap-confetti-burst (30-40 capsules spawned on a ring, radial 250-500 px/s,
 * upward bias, gravity, +-360 deg/s spin). Physics are analytic (linear air drag + gravity with a
 * terminal velocity), so every frame is a pure function of time.
 */
type Shape = 'circle' | 'ring' | 'square' | 'capsule' | 'dot' | 'triangle';

type Props = {
  background: string;
  x: number;
  y: number;
  delay: number;
  count: number;
  palette: string[];
  weights: number[];
  shapes: string[];
  power: number;
  gravity: number;
  size: number;
  spread: number;
  upBias: number;
  flutter: number;
  fill: boolean;
  life: number;
  ringRadius: number;
  ghosts: boolean;
  showSubject: boolean;
  subjectColor: string;
  seed: number;
};

type Piece = {
  shape: Shape;
  color: string;
  sz: number;
  vx: number;
  vy: number;
  ox: number;
  oy: number;
  rot0: number;
  spin: number;
  flipRate: number;
  flipPh: number;
  swayF: number;
  swayPh: number;
  life: number;
  delay: number;
  tx: number;
  ty: number;
  fallDelay: number;
};

const DRAG = 3.2;

const ShapeEl: React.FC<{p: Piece; flip: number; opacity: number}> = ({p, flip, opacity}) => {
  const s = p.sz;
  const fy = Math.max(0.12, Math.abs(flip));
  switch (p.shape) {
    case 'ring':
      return <ellipse rx={s * 0.5} ry={s * 0.5 * fy} fill="none" stroke={p.color} strokeWidth={s * 0.2} opacity={opacity} />;
    case 'square':
      return <rect x={-s / 2} y={(-s / 2) * fy} width={s} height={s * fy} rx={s * 0.1} fill={p.color} opacity={opacity} />;
    case 'capsule':
      return <rect x={-s * 0.22} y={-s * 0.55 * fy} width={s * 0.44} height={s * 1.1 * fy} rx={s * 0.22 * Math.min(1, fy * 2)} fill={p.color} opacity={opacity} />;
    case 'triangle': {
      const r = s * 0.6;
      return <path d={`M0 ${-r * fy} L${r * 0.87} ${r * 0.5 * fy} L${-r * 0.87} ${r * 0.5 * fy} Z`} fill={p.color} opacity={opacity} />;
    }
    case 'dot':
      return <circle r={s * 0.22} fill={p.color} opacity={opacity} />;
    default:
      return <ellipse rx={s * 0.5} ry={s * 0.5 * Math.max(0.6, fy)} fill={p.color} opacity={opacity} />;
  }
};

const ConfettiBurst: React.FC<Props> = (props) => {
  const {background, x, y, delay, count, palette, weights, shapes, power, gravity, size, spread, upBias, flutter, fill, life, ringRadius, ghosts, showSubject, subjectColor, seed} = props;
  const {f, w, h, u, px, py, durationInFrames} = useFx(x, y, delay);
  const fps = 30;

  const pieces = React.useMemo(() => {
    const r = rng(seed * 7919 + 13);
    const kinds = (shapes.length ? shapes : ['circle']) as Shape[];
    const out: Piece[] = [];
    // fill-mode targets: jittered grid over the frame (Poisson-ish, min distance ~ cell)
    let targets: [number, number][] = [];
    if (fill) {
      const cell = Math.sqrt((w * h) / Math.max(1, count));
      const cols = Math.ceil(w / cell) + 1;
      const rows = Math.ceil(h / cell) + 1;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) targets.push([(i + 0.5 + (r() - 0.5) * 0.8) * cell - cell * 0.3, (j + 0.5 + (r() - 0.5) * 0.8) * cell - cell * 0.3]);
      // shuffle
      for (let i = targets.length - 1; i > 0; i--) {
        const k = Math.floor(r() * (i + 1));
        [targets[i], targets[k]] = [targets[k], targets[i]];
      }
      targets = targets.slice(0, count);
    }
    const n = fill ? targets.length : count;
    for (let i = 0; i < n; i++) {
      const shape = kinds[Math.floor(r() * kinds.length) % kinds.length];
      const ang = -Math.PI / 2 + (r() - 0.5) * Math.PI * 2 * clamp(spread / 360, 0, 1);
      const sp = power * (160 + 2900 * Math.pow(r(), 0.75)) * u;
      const ringA = r() * Math.PI * 2;
      const rr = ringRadius * u * (0.5 + 0.5 * r());
      const [tx, ty] = targets[i] ?? [0, 0];
      out.push({
        shape,
        color: weightedPick(r, palette, weights),
        sz: (fill ? range(r, 34, 118) : range(r, 22, 58)) * u * size * (shape === 'dot' ? 1.6 : 1),
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - upBias * power * u,
        ox: Math.cos(ringA) * rr,
        oy: Math.sin(ringA) * rr,
        rot0: r() * 360,
        spin: (r() - 0.5) * 720,
        flipRate: range(r, 1.2, 3.4),
        flipPh: r() * Math.PI * 2,
        swayF: range(r, 0.9, 2.2),
        swayPh: r() * Math.PI * 2,
        life: life * range(r, 0.75, 1.15),
        delay: r() * 1.5,
        tx,
        ty,
        fallDelay: r() * 10,
      });
    }
    return out;
  }, [seed, count, palette, weights, shapes, power, size, spread, upBias, fill, life, ringRadius, w, h, u]);

  const g = 820 * gravity * u; // px/s^2
  const vt = g / DRAG; // terminal fall speed

  // physics position at time t (s) since burst
  const physAt = (p: Piece, t: number) => {
    const e = 1 - Math.exp(-DRAG * t);
    const sway = flutter * 26 * u * e * Math.sin(t * p.swayF * Math.PI * 2 + p.swayPh);
    return {
      X: px + p.ox + (p.vx / DRAG) * e + sway,
      Y: py + p.oy + ((p.vy - vt) / DRAG) * e + vt * t,
      R: p.rot0 + (p.spin * e) / DRAG * 1.4 + flutter * 25 * Math.sin(t * p.swayF * Math.PI * 2 + p.swayPh),
      F: Math.cos(p.flipPh + t * p.flipRate * Math.PI * 2 * flutter),
    };
  };

  // fill-mode position at local frame lf
  const backOut = Easing.bezier(0.34, 1.3, 0.64, 1);
  const exitStart = durationInFrames - delay - 26;
  const fillAt = (p: Piece, lf: number) => {
    const pp = clamp((lf - p.delay) / 10);
    const e = backOut(pp);
    const t = Math.max(0, lf) / fps;
    const drift = 8 * u;
    let X = px + (p.tx - px) * e + n2('cfx' + p.rot0, t * 0.4, 0) * drift * pp;
    let Y = py + (p.ty - py) * e + n2('cfy' + p.rot0, t * 0.4, 0) * drift * pp;
    const R = p.rot0 + (1 - pp) * (p.spin / 4) + t * p.spin * 0.02;
    // exit: everything drops out with gravity
    const xt = Math.max(0, lf - exitStart - p.fallDelay) / fps;
    Y += 0.5 * g * 2.2 * xt * xt;
    X += p.vx * 0.03 * xt;
    return {X, Y, R, F: 1, S: Easing.out(Easing.cubic)(pp)};
  };

  const clear = isClear(background);
  // subject: hero ball that winds up and pops at the burst
  const ballR = 80 * u * size;
  const crouch = prog(f, -14, -4, ease.inOut);
  const inflate = prog(f, -4, 0, ease.in);
  const ballSx = (1 + 0.2 * crouch - 0.2 * inflate) * (1 + 0.3 * inflate);
  const ballSy = (1 - 0.22 * crouch + 0.22 * inflate) * (1 + 0.3 * inflate);
  const ballIn = prog(f, -delay, -delay + 8, ease.back);

  const flashT = clamp(f / 9);

  return (
    <FxRoot background={background}>
      <Svg>
        {showSubject && !clear && f < 0 && (
          <g transform={`translate(${px} ${py})`}>
            <ellipse cx={0} cy={ballR * 1.3} rx={ballR * 0.9 * ballIn} ry={ballR * 0.16 * ballIn} fill="#000" opacity={0.08} />
            <g transform={`translate(0 ${ballR * (1 - ballSy)}) scale(${ballSx * ballIn} ${ballSy * ballIn})`}>
              <circle r={ballR} fill={subjectColor} />
            </g>
          </g>
        )}
        {f >= 0 && flashT < 1 && (
          <g opacity={1 - flashT}>
            <circle cx={px} cy={py} r={(40 + 260 * Easing.out(Easing.cubic)(flashT)) * u * Math.max(0.4, power) * size} fill="none" stroke={palette[0] ?? '#fff'} strokeWidth={10 * u * (1 - flashT)} />
            <circle cx={px} cy={py} r={ballR * 1.25 * Math.max(0, 1 - flashT * 2)} fill={clear ? '#fff' : subjectColor} />
          </g>
        )}
        {f >= -1 &&
          pieces.map((p, i) => {
            if (fill) {
              if (f < 0) return null;
              const A = fillAt(p, f);
              if (A.Y - p.sz > h + 20 * u) return null;
              const B = fillAt(p, f - 0.6);
              const v = Math.hypot(A.X - B.X, A.Y - B.Y);
              return (
                <g key={i}>
                  {ghosts &&
                    v > 6 * u &&
                    [0.3, 0.15, 0.08].map((o, k) => {
                      const G = fillAt(p, f - (k + 1) * 0.45);
                      return (
                        <g key={k} transform={`translate(${G.X} ${G.Y}) rotate(${G.R}) scale(${G.S})`}>
                          <ShapeEl p={p} flip={1} opacity={o} />
                        </g>
                      );
                    })}
                  <g transform={`translate(${A.X} ${A.Y}) rotate(${A.R}) scale(${A.S})`}>
                    <ShapeEl p={p} flip={1} opacity={1} />
                  </g>
                </g>
              );
            }
            const t = f / fps;
            if (t < 0) return null;
            const lifeT = t / p.life;
            if (lifeT >= 1) return null;
            const op = 1 - clamp((lifeT - 0.6) / 0.4);
            const sc = prog(f, 0, 3, ease.out);
            const A = physAt(p, t);
            if (A.Y - p.sz > h + 40 * u || A.X < -200 * u || A.X > w + 200 * u) return null;
            const B = physAt(p, Math.max(0, t - 1 / fps));
            const v = Math.hypot(A.X - B.X, A.Y - B.Y);
            return (
              <g key={i}>
                {ghosts &&
                  v > 12 * u &&
                  [0.3, 0.15].map((o, k) => {
                    const G = physAt(p, Math.max(0, t - ((k + 1) * 0.4) / fps));
                    return (
                      <g key={k} transform={`translate(${G.X} ${G.Y}) rotate(${G.R}) scale(${sc})`}>
                        <ShapeEl p={p} flip={G.F} opacity={o * op} />
                      </g>
                    );
                  })}
                <g transform={`translate(${A.X} ${A.Y}) rotate(${A.R}) scale(${sc})`}>
                  <ShapeEl p={p} flip={A.F} opacity={op} />
                </g>
              </g>
            );
          })}
      </Svg>
    </FxRoot>
  );
};

export const confettiBurst = defineMotion<Props>({
  id: 'confetti-burst',
  title: 'Confetti burst',
  category: 'fx',
  description:
    'Flat circles, rings, squares and capsules explode radially from a point with drag, gravity, spin and 3D flutter; fill mode tiles the whole frame (video17). Overlay-ready: background "transparent".',
  source: ['video17 6.40-7.50 confetti-burst-fill', 'video7 impact-confetti', 'video14 style-swap-confetti-burst'],
  useFor: 'Celebrations, completions, level-ups, "chaos" beats; small counts make an impact puff on a landing or tap.',
  durationInFrames: 100,
  defaultProps: {
    background: '#EEEBDE',
    x: 0.5,
    y: 0.55,
    delay: 18,
    count: 150,
    palette: ['#ED3821', '#2536F4', '#F5CA1E', '#F7A7CC', '#0B0D0C', '#8A877F'],
    weights: [0.18, 0.18, 0.12, 0.14, 0.2, 0.18],
    shapes: ['circle', 'ring', 'square', 'capsule', 'dot'],
    power: 1,
    gravity: 1,
    size: 1,
    spread: 360,
    upBias: 520,
    flutter: 1,
    fill: false,
    life: 4,
    ringRadius: 40,
    ghosts: true,
    showSubject: true,
    subjectColor: '#ED3821',
    seed: 3,
  },
  propDocs: {
    background: "scene colour; 'transparent' = overlay (subject ball hidden)",
    x: 'burst origin x (0..1 of frame width)',
    y: 'burst origin y (0..1 of frame height)',
    delay: 'local frame the burst fires (the hero ball winds up during the frames before it)',
    count: 'number of pieces (v17 ~141, v14 30-40, v7 3-12)',
    palette: 'piece colours',
    weights: 'relative weight of each palette colour (same length as palette, else uniform)',
    shapes: 'any of circle, ring, square, capsule, dot, triangle',
    power: 'launch speed multiplier (0.15 = tiny landing puff, 1 = fills the frame)',
    gravity: 'gravity multiplier (0 = float)',
    size: 'piece size multiplier',
    spread: 'launch cone in degrees, centred upward (360 = all directions)',
    upBias: 'extra upward launch speed in px/s (v14 -150..-500)',
    flutter: 'sway + 3D flip amount while falling (0 = rigid)',
    fill: 'true = v17 mode: pieces fly to a jittered grid that tiles the whole frame, float, then drop out',
    life: 'seconds before a piece fades (burst mode)',
    ringRadius: 'spawn ring radius in u (v14 spawns on a 60-120 px ring)',
    ghosts: 'draw motion-blur ghost copies while pieces move fast',
    showSubject: 'draw the hero ball that pops (scene mode only)',
    subjectColor: 'hero ball colour',
    seed: 'random seed',
  },
  component: ConfettiBurst,
  tags: ['confetti', 'burst', 'celebrate', 'particles', 'overlay', 'fx'],
});
