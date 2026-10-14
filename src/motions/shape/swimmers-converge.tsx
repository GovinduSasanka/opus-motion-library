import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {Sparkle} from '../../core/shapes';
import {Reticle, TypedLabel, VK, VoidBg} from '../../core/void-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video11 wavy-swimmers-converge + pulse-shockwave-ring + twin-dot-fusion (fertilization, 2.1-3.55 s).
 * Small agents with travelling-sine tails swim in along dotted S-curve guides (easeOutQuad, slowing) and stop at a
 * ring around a glowing target, pointing inward. One gets through: flash, the membrane recolours lavender -> teal,
 * an easeOutExpo shockwave ring runs out and the others fade. Then two glossy dots with aster spikes drift together
 * and fuse in a white starburst.
 */
type Props = {
  count: number;
  stopRadius: number;
  tailLength: number;
  waveHz: number;
  arriveFrames: number;
  hitAt: number;
  fusion: boolean;
  color: string;
  membrane: string;
  hitColor: string;
  dotColors: [string, string];
  label: string;
  finalLabel: string;
  seed: number;
};

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const Aster: React.FC<{x: number; y: number; r: number; color: string; spikes: number; len: number; rot: number; opacity: number; u: number; seed: number}> = ({x, y, r, color, spikes, len, rot, opacity, u, seed}) => {
  const q = rng(seed);
  return (
    <g opacity={opacity}>
      {Array.from({length: spikes}, (_, i) => {
        const a = (i / spikes) * Math.PI * 2 + rot + q() * 0.1;
        const l = len * (0.5 + q() * 0.5);
        return <line key={i} x1={x + Math.cos(a) * r * 1.3} y1={y + Math.sin(a) * r * 1.3} x2={x + Math.cos(a) * (r * 1.3 + l)} y2={y + Math.sin(a) * (r * 1.3 + l)} stroke={color} strokeWidth={1 * u} opacity={0.6} />;
      })}
      <circle cx={x} cy={y} r={r * 1.8} fill={color} opacity={0.25} style={{filter: `blur(${6 * u}px)`}} />
      <circle cx={x} cy={y} r={r} fill={color} />
      <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.3} fill="#fff" opacity={0.85} />
    </g>
  );
};

const SwimmersConverge: React.FC<Props> = ({count, stopRadius, tailLength, waveHz, arriveFrames, hitAt, fusion, color, membrane, hitColor, dotColors, label, finalLabel, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const R = Math.min(w, h) * (portrait ? 0.27 : 0.2);
  const Rs = R * stopRadius;
  const S0 = Math.hypot(w, h) * 0.58;
  const r = rng(seed);
  const n = Math.max(1, Math.round(count));
  const sw = Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.35 - Math.PI / 2;
    return {a, bend: (r() < 0.5 ? -1 : 1) * (0.18 + r() * 0.2), t0: Math.floor(r() * 14), dur: arriveFrames * (0.85 + r() * 0.3), ph: r() * 6};
  });
  // winner: the one closest to the upper-right
  let win = 0;
  let best = -9;
  sw.forEach((s, i) => {
    const sc = Math.cos(s.a + Math.PI / 4) * 1;
    if (sc > best) {
      best = sc;
      win = i;
    }
  });
  const H = hitAt;
  sw[win] = {...sw[win], t0: 0, dur: Math.min(sw[win].dur, H - 12)};
  const pathAt = (s: (typeof sw)[0], t: number) => {
    const d = S0 + (Rs - S0) * t;
    const th = s.a + s.bend * Math.sin(Math.PI * t) + s.bend * 0.35 * Math.sin(2 * Math.PI * t);
    return [cx + Math.cos(th) * d, cy + Math.sin(th) * d];
  };
  const hit = frame >= H;
  const recolor = prog(frame, H, H + 3);
  const memCol = interpolateColors(recolor, [0, 1], [membrane, hitColor]);
  const loserFade = 1 - prog(frame, H, H + 6);
  const wave = prog(frame, H, H + 10, easeOutExpo);
  const wave2 = prog(frame, H + 2, H + 14, easeOutExpo);
  // fusion timeline
  const F0 = H + 8;
  const F1 = H + 22;
  const F2 = F1 + 16;
  const winner = sw[win];
  const entry = [cx + Math.cos(winner.a) * R, cy + Math.sin(winner.a) * R];
  const maleStart = [cx + Math.cos(winner.a) * R * 0.62, cy + Math.sin(winner.a) * R * 0.62];
  const femaleStart = [cx - R * 0.3, cy + R * 0.22];
  const fz = easeInOutCubic(clamp((frame - F1) / (F2 - F1)));
  const meet = [cx, cy];
  const mPos = [maleStart[0] + (meet[0] - maleStart[0]) * fz, maleStart[1] + (meet[1] - maleStart[1]) * fz + Math.sin(fz * Math.PI) * R * 0.08];
  const fPos = [femaleStart[0] + (meet[0] - femaleStart[0]) * fz, femaleStart[1] + (meet[1] - femaleStart[1]) * fz - Math.sin(fz * Math.PI) * R * 0.08];
  const fused = fusion && frame >= F2;
  const flash = fusion ? prog(frame, F2, F2 + 3, ease.out) * (1 - prog(frame, F2 + 4, F2 + 16, ease.in)) : 0;
  const shock3 = prog(frame, F2, F2 + 12, easeOutExpo);
  const breathe = 1 + 0.015 * Math.sin(frame * 0.12);
  const corona = Array.from({length: 120}, (_, i) => {
    const q = rng(seed * 101 + i);
    const a = (i / 120) * Math.PI * 2 + q() * 0.05;
    const d = R * (1.1 + q() * 0.32);
    return {x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, rx: (7 + q() * 7) * u, ry: (4 + q() * 4) * u, rot: (a * 180) / Math.PI + (q() - 0.5) * 60, o: 0.5 + q() * 0.4};
  });
  const hex = 16 * u;
  const omega = (2 * Math.PI * waveHz) / 30;
  const id = `swc-${seed}`;
  return (
    <AbsoluteFill>
      <VoidBg seed={seed + 5} />
      <Svg>
        <defs>
          <radialGradient id={`${id}-cyto`} cx="45%" cy="40%" r="65%">
            <stop offset="0" stopColor="#3A3F8A" />
            <stop offset="0.7" stopColor="#282D6D" />
            <stop offset="1" stopColor="#1E204A" />
          </radialGradient>
          <pattern id={`${id}-hex`} patternUnits="userSpaceOnUse" width={hex * 3} height={hex * Math.sqrt(3)}>
            <path
              d={`M 0 ${(hex * Math.sqrt(3)) / 2} L ${hex / 2} 0 L ${hex * 1.5} 0 L ${hex * 2} ${(hex * Math.sqrt(3)) / 2} L ${hex * 1.5} ${hex * Math.sqrt(3)} L ${hex / 2} ${hex * Math.sqrt(3)} Z M ${hex * 2} ${(hex * Math.sqrt(3)) / 2} L ${hex * 3} ${(hex * Math.sqrt(3)) / 2}`}
              fill="none"
              stroke="#5A60B0"
              strokeWidth={0.8 * u}
            />
          </pattern>
          <clipPath id={`${id}-clip`}>
            <circle cx={cx} cy={cy} r={R * 0.95} />
          </clipPath>
          <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={4 * u} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <Reticle cx={cx} cy={cy} r={R * 1.85} draw={prog(frame, 0, 20, ease.out)} rotate={-frame * 0.04} opacity={0.9} />
        <circle cx={cx} cy={cy} r={Rs} fill="none" stroke={VK.reticle} strokeWidth={1 * u} strokeDasharray={`${2 * u} ${6 * u}`} opacity={0.7 * prog(frame, 4, 18)} />
        {/* guide paths */}
        {sw.map((s, i) => {
          const pts = Array.from({length: 40}, (_, k) => pathAt(s, k / 39));
          return <polyline key={`g${i}`} points={pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} fill="none" stroke={VK.reticle} strokeWidth={1 * u} strokeDasharray={`${2 * u} ${6 * u}`} opacity={prog(frame, 2, 14) * (i === win ? 1 : loserFade)} />;
        })}
        {/* corona cells */}
        <g opacity={1 - 0.5 * prog(frame, F2, F2 + 30)}>
          {corona.map((c, i) => (
            <ellipse key={i} cx={c.x} cy={c.y} rx={c.rx * breathe} ry={c.ry} transform={`rotate(${c.rot} ${c.x} ${c.y})`} fill="#40408E" stroke="#8683D8" strokeWidth={1 * u} opacity={c.o} />
          ))}
        </g>
        {/* egg */}
        <circle cx={cx} cy={cy} r={R * breathe} fill={`url(#${id}-cyto)`} />
        <g clipPath={`url(#${id}-clip)`} opacity={0.4}>
          <rect x={cx - R} y={cy - R} width={R * 2} height={R * 2} fill={`url(#${id}-hex)`} />
        </g>
        <g filter={`url(#${id}-glow)`}>
          <circle cx={cx} cy={cy} r={R * breathe} fill="none" stroke={memCol} strokeWidth={(5 + 3 * recolor * (1 - prog(frame, H + 4, H + 20))) * u} />
          <circle cx={cx} cy={cy} r={R * 0.92 * breathe} fill="none" stroke={memCol} strokeWidth={1.2 * u} opacity={0.6} />
        </g>
        {/* shockwaves */}
        {hit && wave < 1 && <circle cx={cx} cy={cy} r={R + (R * 0.96) * wave} fill="none" stroke={VK.membrane} strokeWidth={2 * u} opacity={1 - clamp((wave - 0.5) / 0.5)} />}
        {hit && wave2 < 1 && <circle cx={cx} cy={cy} r={R + (R * 0.7) * wave2} fill="none" stroke={hitColor} strokeWidth={1.5 * u} opacity={0.7 * (1 - clamp((wave2 - 0.5) / 0.5))} />}
        {/* pronuclei */}
        {fusion && !fused && <Aster x={fPos[0]} y={fPos[1]} r={R * 0.075} color={dotColors[0]} spikes={24} len={R * 0.22 * prog(frame, F0, F0 + 10)} rot={frame * 0.01} opacity={1} u={u} seed={3} />}
        {!fusion && <circle cx={femaleStart[0]} cy={femaleStart[1]} r={R * 0.06} fill={dotColors[0]} />}
        {fusion && frame >= F0 && !fused && <Aster x={mPos[0]} y={mPos[1]} r={R * 0.07 * prog(frame, F0, F0 + 4, ease.back)} color={dotColors[1]} spikes={22} len={R * 0.2 * prog(frame, F0 + 2, F0 + 12)} rot={-frame * 0.012} opacity={1} u={u} seed={5} />}
        {fused && (
          <g>
            <circle cx={cx} cy={cy} r={R * 0.16 * (1 + 0.06 * Math.sin(frame * 0.2))} fill="#E9E6FF" opacity={0.25} style={{filter: `blur(${8 * u}px)`}} />
            <circle cx={cx} cy={cy} r={R * 0.09} fill="#F1EEFF" />
            <circle cx={cx - R * 0.03} cy={cy - R * 0.03} r={R * 0.03} fill="#fff" />
          </g>
        )}
        {fused && shock3 < 1 && <circle cx={cx} cy={cy} r={R * 0.1 + R * 1.2 * shock3} fill="none" stroke="#F1EEFF" strokeWidth={2 * u} opacity={1 - shock3} />}
        {flash > 0 && (
          <g>
            <circle cx={cx} cy={cy} r={R * 0.5 * flash} fill="#fff" opacity={0.35 * flash} style={{filter: `blur(${10 * u}px)`}} />
            <Sparkle x={cx} y={cy} size={R * 0.5 * flash} color="#FFFFFF" rotate={frame * 3} />
          </g>
        )}
        {/* swimmers */}
        {sw.map((s, i) => {
          const isWin = i === win;
          const op = isWin ? 1 - prog(frame, H + 1, H + 5) : loserFade;
          if (op <= 0) return null;
          const tq = 1 - (1 - clamp((frame - s.t0) / s.dur)) * (1 - clamp((frame - s.t0) / s.dur));
          let head = pathAt(s, tq);
          const ahead = pathAt(s, Math.min(1, tq + 0.01));
          let dir = [ahead[0] - head[0], ahead[1] - head[1]];
          if (tq >= 0.995) dir = [cx - head[0], cy - head[1]];
          const dl = Math.hypot(dir[0], dir[1]) || 1;
          dir = [dir[0] / dl, dir[1] / dl];
          if (isWin && frame >= H - 8) {
            const k = prog(frame, H - 8, H, (x) => x * x);
            head = [head[0] + (entry[0] - head[0]) * k, head[1] + (entry[1] - head[1]) * k];
          }
          const perp = [-dir[1], dir[0]];
          const L = tailLength * u;
          const speed = 1 - tq;
          const wv = omega * (0.5 + 0.5 * speed);
          const pts = Array.from({length: 22}, (_, k) => {
            const sk = (k / 21) * L;
            const A = 6 * u * (0.3 + 0.7 * (k / 21));
            const off = A * Math.sin((2 * Math.PI * sk) / (45 * u) - frame * wv - s.ph);
            return [head[0] - dir[0] * sk + perp[0] * off, head[1] - dir[1] * sk + perp[1] * off];
          });
          const ang = (Math.atan2(dir[1], dir[0]) * 180) / Math.PI;
          return (
            <g key={i} opacity={op}>
              <polyline points={pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} fill="none" stroke={color} strokeWidth={1.5 * u} strokeLinecap="round" opacity={0.85} />
              <ellipse cx={head[0]} cy={head[1]} rx={10 * u} ry={7 * u} transform={`rotate(${ang} ${head[0]} ${head[1]})`} fill="#EAFBFF" stroke={VK.cyan} strokeWidth={1.5 * u} style={{filter: `drop-shadow(0 0 ${4 * u}px ${VK.cyan})`}} />
            </g>
          );
        })}
        {hit && frame < H + 6 && <Sparkle x={entry[0]} y={entry[1]} size={(30 + 30 * Math.sin(prog(frame, H, H + 6) * Math.PI)) * u} color="#FFFFFF" rotate={20} opacity={Math.sin(prog(frame, H, H + 6) * Math.PI)} />}
      </Svg>
      <TypedLabel x={portrait ? w * 0.08 : w * 0.06} y={portrait ? h * 0.8 : h * 0.82} text={label} sub={`sperm ${n} → 1`} start={H + 2} size={26} color={hit ? VK.pink : VK.hud} />
      {fusion && finalLabel && <TypedLabel x={portrait ? w * 0.92 : w * 0.94} y={portrait ? h * 0.14 : h * 0.1} text={finalLabel} start={F2 + 6} size={22} anchor="right" />}
      <TypedLabel x={portrait ? w * 0.92 : w * 0.94} y={portrait ? h * 0.8 : h * 0.86} text="100 µm" start={6} size={16} anchor="right" />
    </AbsoluteFill>
  );
};

export const swimmersConverge = defineMotion<Props>({
  id: 'swimmers-converge',
  title: 'Swimmers converge + shockwave + fusion',
  category: 'shape',
  description: 'Small glowing agents with wavy sine tails swim in along dotted S-curves and stop around a glowing cell; one gets through with a flash and an expo shockwave ring, the rest fade, then two aster dots drift together and fuse in a starburst.',
  source: ['video11 0:02.1-0:03.55 wavy-swimmers-converge + pulse-shockwave-ring + twin-dot-fusion'],
  useFor: 'Competition / "one wins" moments, many inputs converging on a goal, biology or origin stories, two things combining into one.',
  durationInFrames: 150,
  defaultProps: {
    count: 13,
    stopRadius: 1.5,
    tailLength: 90,
    waveHz: 4,
    arriveFrames: 52,
    hitAt: 72,
    fusion: true,
    color: '#EAFBFF',
    membrane: VK.membrane,
    hitColor: VK.teal,
    dotColors: [VK.magenta, VK.cyan],
    label: 'fertilization · t = 0 s',
    finalLabel: 'two become one',
    seed: 4,
  },
  propDocs: {
    count: 'number of swimmers',
    stopRadius: 'where they stop, in target radii',
    tailLength: 'tail length in u',
    waveHz: 'tail undulation frequency',
    arriveFrames: 'average frames to arrive (easeOutQuad)',
    hitAt: 'frame the winner touches the membrane (flash + shockwave)',
    fusion: 'run the twin-dot fusion after the hit',
    membrane: 'membrane colour before the hit',
    hitColor: 'membrane colour after the hit',
    dotColors: 'the two fusing dots [resident, incoming]',
    label: 'typed label at the hit',
    finalLabel: 'typed label after fusion',
    seed: 'layout randomness',
  },
  component: SwimmersConverge,
  tags: ['swim', 'converge', 'biology', 'cell', 'shockwave', 'fusion', 'hud', 'science'],
});
