import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Star fusion shells: a glowing orange star grows on a deep purple starfield, a pie wedge opens to reveal concentric
 * fusion shells labelled H, He, C, O, Si, Fe toward the core, the iron core swells, then the star collapses to a point
 * and bursts as a supernova of coloured dashes that settles into a nebula.
 */
type Props = {
  shells: string[];
  shellColors: string[];
  background: string;
  starColor: string;
  glowColor: string;
  burstColors: string[];
  chipColor: string;
  chipText: string;
  wedgeCenterDeg: number;
  wedgeWidthDeg: number;
  starSize: number;
  dashes: number;
  seed: number;
};

const arc = (cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) => {
  const p = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  if (r0 < 0.5) return `M ${cx} ${cy} L ${p(r1, a0)} A ${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} Z`;
  return `M ${p(r1, a0)} A ${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 ${large} 0 ${p(r0, a0)} Z`;
};

const StarFusionShells: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const short = Math.min(w, h);
  const shells = p.shells.length ? p.shells : ['H'];
  const n = shells.length;
  const idp = 'sfs';

  const stars = React.useMemo(() => {
    const r = rng(p.seed);
    return Array.from({length: 110}, () => ({x: r(), y: r(), s: 0.6 + r() * 1.6, o: 0.25 + r() * 0.6, ph: r() * 6.28}));
  }, [p.seed]);
  const parts = React.useMemo(() => {
    const r = rng(p.seed + 77);
    return Array.from({length: Math.max(20, Math.round(p.dashes))}, (_, i) => ({
      a: r() * Math.PI * 2,
      sp: 0.25 + Math.pow(r(), 0.7) * 0.95,
      len: 9 + r() * 20,
      th: 3 + r() * 3,
      col: p.burstColors[Math.floor(r() * p.burstColors.length) % p.burstColors.length],
      rf: 0.18 + r() * 0.42,
      sw: (r() - 0.5) * 1.6,
      i,
    }));
  }, [p.seed, p.dashes, p.burstColors]);

  // timeline (30 fps, 240 frames)
  const grow = prog(frame, 0, 40, ease.out);
  const open = prog(frame, 38, 72, ease.inOut);
  const core = prog(frame, 70, 135, ease.sine);
  const collapse = prog(frame, 138, 156, ease.in);
  const burst = prog(frame, 158, 232, ease.out);
  const settle = prog(frame, 190, 240, ease.inOut);
  const R = p.starSize * 0.5 * short * (portrait ? 1.0 : 0.82) * lerp(0.3, 1, grow) * (1 - collapse) * (1 + 0.012 * Math.sin(frame * 0.3));
  const maxR = Math.hypot(w, h) * 0.5;
  const pre = frame < 158;

  const c = lerp(0.12, 0.42, core);
  const edges = Array.from({length: n + 1}, (_, k) => (k === n ? 0 : 1 - (k / Math.max(1, n - 1)) * (1 - c)));
  const half = (((p.wedgeWidthDeg * 0.5 * Math.PI) / 180) * open);
  const ac = (p.wedgeCenterDeg * Math.PI) / 180;
  const a0 = ac - half;
  const a1 = ac + half;
  const color = (k: number) => p.shellColors[Math.min(k, p.shellColors.length - 1)];
  const chipR = 21 * u;

  // glow builds up to the collapse flash
  const flash = clamp(prog(frame, 150, 160, ease.out) - prog(frame, 160, 185, ease.sine));
  const nebula = prog(frame, 175, 240, ease.out);

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <radialGradient id={`${idp}-bg`} cx="50%" cy="50%" r="75%">
            <stop offset="0" stopColor="#2A1757" />
            <stop offset="1" stopColor={p.background} />
          </radialGradient>
          <radialGradient id={`${idp}-body`} cx="42%" cy="40%" r="75%">
            <stop offset="0" stopColor="#FFC26A" />
            <stop offset="0.55" stopColor={p.starColor} />
            <stop offset="1" stopColor="#F07A2A" />
          </radialGradient>
          <radialGradient id={`${idp}-glow`}>
            <stop offset="0.5" stopColor={p.glowColor} stopOpacity="0.55" />
            <stop offset="1" stopColor={p.glowColor} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${idp}-neb`}>
            <stop offset="0" stopColor="#FFB070" stopOpacity="0.5" />
            <stop offset="0.45" stopColor="#7A4BC0" stopOpacity="0.28" />
            <stop offset="1" stopColor="#3A1E70" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`${idp}-clip`}>
            <circle cx={cx} cy={cy} r={Math.max(1, R)} />
          </clipPath>
        </defs>
        <rect width={w} height={h} fill={`url(#${idp}-bg)`} />
        {stars.map((s, i) => (
          <circle key={i} cx={s.x * w} cy={s.y * h} r={s.s * u} fill="#fff" opacity={s.o * (0.6 + 0.4 * Math.sin(frame * 0.12 + s.ph))} />
        ))}

        {nebula > 0 && (
          <ellipse cx={cx} cy={cy} rx={maxR * 0.55 * nebula} ry={maxR * 0.34 * nebula} fill={`url(#${idp}-neb)`} transform={`rotate(-18 ${cx} ${cy})`} opacity={0.4 + 0.6 * settle} />
        )}

        {pre && R > 2 && (
          <g>
            <circle cx={cx} cy={cy} r={R * 1.75} fill={`url(#${idp}-glow)`} opacity={0.55 + 0.45 * collapse} />
            <circle cx={cx} cy={cy} r={R} fill={`url(#${idp}-body)`} />
            <g clipPath={`url(#${idp}-clip)`}>
              {Array.from({length: 9}, (_, i) => {
                const a = (i / 9) * 360 + frame * 0.35;
                return <ellipse key={i} cx={cx + R * 0.52} cy={cy} rx={R * 0.3} ry={R * 0.1} fill="#FFE2A0" opacity={0.16 + 0.06 * Math.sin(frame * 0.1 + i)} transform={`rotate(${a} ${cx} ${cy})`} />;
              })}
              {Array.from({length: 5}, (_, i) => (
                <circle key={i} cx={cx + Math.cos(i * 2.4 + frame * 0.01) * R * 0.45} cy={cy + Math.sin(i * 2.1) * R * 0.4} r={R * 0.28} fill="#FFF0C0" opacity={0.1} />
              ))}
            </g>
            {open > 0.01 &&
              Array.from({length: n}, (_, k) => {
                const rIn = R * edges[k + 1];
                const rOut = R * edges[k];
                const stagger = clamp(open * 1.6 - k * 0.1);
                return <path key={k} d={arc(cx, cy, rIn, rOut, a0, a0 + (a1 - a0) * Math.max(0.02, stagger))} fill={color(k)} stroke={p.background} strokeOpacity={0.35} strokeWidth={1.5 * u} />;
              })}
            {open > 0.6 &&
              shells.map((label, k) => {
                const rm = R * (edges[k] + edges[k + 1]) * 0.5;
                const rr = k === n - 1 ? chipR * (1 + 0.5 * core) : chipR;
                const px = cx + rm * Math.cos(a1);
                const py = cy + rm * Math.sin(a1);
                const o = clamp((open - 0.6) / 0.4 - k * 0.06);
                const wd = rr * (label.length > 1 ? 2.1 : 1.7);
                return (
                  <g key={k} opacity={o} transform={`translate(${px} ${py}) scale(${lerp(0.6, 1, o)})`}>
                    <rect x={-wd / 2} y={-rr * 0.8} width={wd} height={rr * 1.6} rx={rr * 0.8} fill={p.chipColor} />
                    <text y={rr * 0.3} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={rr * 0.95} fill={p.chipText}>
                      {label}
                    </text>
                  </g>
                );
              })}
          </g>
        )}

        {frame >= 150 && frame < 205 && (
          <g>
            <circle cx={cx} cy={cy} r={(60 + 260 * flash) * u} fill={`url(#${idp}-glow)`} opacity={flash} />
            <circle cx={cx} cy={cy} r={(5 + 5 * flash) * u} fill="#fff" opacity={clamp(prog(frame, 150, 158, ease.out) * (1 - burst))} />
          </g>
        )}
        {burst > 0 && burst < 1.01 && (
          <circle cx={cx} cy={cy} r={maxR * 1.1 * burst} fill="none" stroke="#B9A6FF" strokeOpacity={0.5 * (1 - burst)} strokeWidth={5 * u} />
        )}

        {frame >= 158 &&
          parts.map((q) => {
            const rb = q.sp * maxR * burst * 0.7;
            const r = rb * lerp(1, q.rf / q.sp, settle);
            const ang = q.a + q.sw * settle * 0.8;
            const x = cx + r * Math.cos(ang);
            const y = cy + r * Math.sin(ang) * lerp(1, 0.72, settle);
            const len = q.len * u * lerp(1, 0.25, settle) * clamp(burst * 3);
            const rot = (ang * 180) / Math.PI;
            return <rect key={q.i} x={-len / 2} y={-q.th * u * 0.5} width={len} height={q.th * u} rx={q.th * u * 0.5} fill={q.col} opacity={0.95 - 0.25 * settle} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`} />;
          })}
      </Svg>
    </AbsoluteFill>
  );
};

export const starFusionShells = defineMotion<Props>({
  id: 'star-fusion-shells',
  title: 'Star fusion shells',
  category: 'data',
  description:
    'A glowing orange star grows on a purple starfield, a pie wedge opens onto labelled concentric fusion shells (H to Fe), the iron core swells, the star collapses and bursts as a supernova of coloured dashes that settles into a nebula.',
  source: ['analysis/sheets/r3/v3'],
  useFor: 'Explaining stellar nucleosynthesis, layered structures with a growing core, or any build-up then collapse-and-burst reveal.',
  durationInFrames: 240,
  defaultProps: {
    shells: ['H', 'He', 'C', 'O', 'Si', 'Fe'],
    shellColors: ['#FFD98A', '#FFB65E', '#FF8C45', '#E5553E', '#A93654', '#B9C2F0'],
    background: '#120A2B',
    starColor: '#FF9F3C',
    glowColor: '#FF8A2A',
    burstColors: ['#FFC857', '#FF7A59', '#7FD6FF', '#B28DFF', '#6EE7B7', '#FFFFFF'],
    chipColor: '#1B1230',
    chipText: '#FFE9B0',
    wedgeCenterDeg: -35,
    wedgeWidthDeg: 80,
    starSize: 0.9,
    dashes: 320,
    seed: 11,
  },
  propDocs: {
    shells: 'shell labels from outer to core (the last one is the growing core)',
    shellColors: 'fill per shell, outer to core',
    background: 'deep space colour',
    starColor: 'star body colour',
    glowColor: 'bloom colour around the star',
    burstColors: 'colours of the supernova dashes',
    chipColor: 'label chip fill',
    chipText: 'label chip text colour',
    wedgeCenterDeg: 'direction of the cut-away wedge in degrees (0 = right, -90 = up)',
    wedgeWidthDeg: 'opening angle of the wedge',
    starSize: 'star diameter as a fraction of the short side',
    dashes: 'number of supernova dashes',
    seed: 'random seed for stars and dashes',
  },
  component: StarFusionShells,
  tags: ['star', 'supernova', 'shells', 'fusion', 'science', 'explainer'],
});
