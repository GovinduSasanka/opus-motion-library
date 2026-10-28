import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog, springAt} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {hexA, mixHex, useUid} from '../../core/r2-pr4-kit';
import {n2, rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Flame test: a Bunsen-style burner on a lab bench. A wire loop dips into the flame, the flame turns the colour of
 * the metal (Li crimson, Na yellow, K lilac, Cu green, Sr red, Ca orange) with sparks, a label pill names it, and the
 * matching sample bottle on the bench lights up. Flat vector, stylised.
 */
type El = {symbol: string; name: string; color: string; colorName?: string};
type Props = {
  title: string;
  subtitle: string;
  elements: El[];
  background: string;
  benchColor: string;
  baseFlame: string;
  inkColor: string;
  framesPer: number;
  startFrame: number;
  sparks: number;
  seed: number;
};

const ELEMENTS: El[] = [
  {symbol: 'Li', name: 'Lithium', color: '#ff2f5a', colorName: 'Crimson'},
  {symbol: 'Na', name: 'Sodium', color: '#ffd21f', colorName: 'Yellow'},
  {symbol: 'K', name: 'Potassium', color: '#b77cff', colorName: 'Lilac'},
  {symbol: 'Cu', name: 'Copper', color: '#31e08a', colorName: 'Green'},
  {symbol: 'Sr', name: 'Strontium', color: '#ff3b2f', colorName: 'Red'},
  {symbol: 'Ca', name: 'Calcium', color: '#ff8a2a', colorName: 'Orange'},
];

const FlameTestColors: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, portrait, fps} = useStage();
  const uid = useUid('flt');
  const els = p.elements.length ? p.elements : ELEMENTS;
  const n = els.length;
  const F = Math.max(30, p.framesPer);
  const t0 = p.startFrame;
  const end = t0 + n * F;
  const ink = p.inkColor;

  const benchY = h * (portrait ? 0.76 : 0.8);
  const bx = cx;
  const barrelTop = benchY - 284 * u;
  const flameH = 300 * u;

  // current slot
  const kRaw = Math.floor((frame - t0) / F);
  const k = clamp(kRaw, -1, n);
  const f = frame - t0 - Math.max(0, kRaw) * F;
  const neutral = p.baseFlame;
  const colAt = (): string => {
    if (kRaw < 0) return neutral;
    if (kRaw >= n) return mixHex(els[n - 1].color, neutral, prog(frame, end, end + 24, ease.inOut));
    const prev = kRaw === 0 ? neutral : els[kRaw - 1].color;
    return mixHex(prev, els[kRaw].color, prog(f, 14, 26, ease.inOut));
  };
  const fc = colAt();

  // wire loop tip: out -> flame -> out
  const tipFlame: [number, number] = [bx + 4 * u, barrelTop - flameH * 0.42];
  const tipOut: [number, number] = [bx + 300 * u, barrelTop - flameH * 0.42 - 170 * u];
  let wireT = 0;
  if (kRaw >= 0 && kRaw < n) wireT = Math.min(prog(f, 0, 16, ease.inOut), 1 - prog(f, F - 14, F, ease.inOut));
  else if (kRaw >= n) wireT = 0;
  const arc = Math.sin(wireT * Math.PI) * 14 * u;
  const tip: [number, number] = [lerp(tipOut[0], tipFlame[0], wireT) + 6 * u * Math.sin(frame * 0.7) * (wireT > 0.95 ? 1 : 0), lerp(tipOut[1], tipFlame[1], wireT) - arc];
  const anchor: [number, number] = [bx + (portrait ? 560 : 820) * u, barrelTop - flameH - 330 * u];
  const dirx = anchor[0] - tip[0];
  const diry = anchor[1] - tip[1];
  const dl = Math.hypot(dirx, diry);
  const ux = dirx / dl;
  const uy = diry / dl;
  const loopR = 17 * u;
  const hot = prog(f, 14, 22) * (kRaw >= 0 && kRaw < n ? 1 : 0);

  // flame geometry
  const flicker = 1 + 0.045 * Math.sin(frame * 0.31) + 0.03 * Math.sin(frame * 0.73 + 1);
  const intensity = 1 + 0.25 * (kRaw >= 0 && kRaw < n ? prog(f, 14, 24) : 0) * (1 - prog(f, F - 10, F)) + (wireT > 0.9 ? 0 : 0);
  const flame = (Hc: number, Wb: number, seed: string, tipShape = 1) => {
    const V = 30;
    const sway = (v: number) => (n2(seed, v * 1.8, frame * 0.06) * 15 * u + Math.sin(frame * 0.22 + v * 4) * 3 * u) * Math.pow(v, 1.4);
    const left: string[] = [];
    const right: string[] = [];
    for (let i = 0; i <= V; i++) {
      const v = i / V;
      const half = Wb * Math.pow(Math.sin(Math.PI * Math.pow(v, 0.58)), 0.95) * (1 - 0.12 * v) * (1 - tipShape * 0.0);
      const y = barrelTop - v * Hc;
      left.push(`${(bx - half + sway(v)).toFixed(1)},${y.toFixed(1)}`);
      right.push(`${(bx + half + sway(v)).toFixed(1)},${y.toFixed(1)}`);
    }
    return 'M' + left.join('L') + 'L' + right.reverse().join('L') + 'Z';
  };
  const Hc = flameH * flicker * (0.82 + 0.18 * intensity);

  // sparks
  const sparks = React.useMemo(() => {
    const g = rng(p.seed + 3);
    return Array.from({length: p.sparks}, () => ({dx: (g() - 0.5) * 70, sp: 1.2 + g() * 2.2, life: 26 + g() * 30, off: g() * 24, dr: (g() - 0.5) * 1.6, r: 1.5 + g() * 2.6}));
  }, [p.sparks, p.seed]);

  const stars = React.useMemo(() => {
    const g = rng(p.seed + 21);
    return Array.from({length: 26}, () => ({x: g(), y: g() * 0.7, s: 0.5 + g()}));
  }, [p.seed]);

  // bottles
  const L = Math.ceil(n / 2);
  const R = n - L;
  const off = (portrait ? 150 : 190) * u;
  const sp = Math.min(150 * u, (w / 2 - 70 * u - off) / Math.max(1, Math.max(L, R) - 0.5));
  const bottle = (i: number) => (i < L ? [bx - off - (L - 1 - i) * sp, i] : [bx + off + (i - L) * sp, i]) as [number, number];

  const wallGlow = 0.22 * (kRaw >= 0 && kRaw <= n ? 1 : 0.5) * (0.6 + 0.4 * intensity);
  const pillK = kRaw >= 0 && kRaw < n ? kRaw : -1;

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <linearGradient id={uid + 'wall'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mixHex(p.background, '#000000', 0.25)} />
            <stop offset="1" stopColor={mixHex(p.background, '#2b4a63', 0.25)} />
          </linearGradient>
          <radialGradient id={uid + 'glow'}>
            <stop offset="0" stopColor={fc} stopOpacity="0.9" />
            <stop offset="1" stopColor={fc} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={uid + 'steel'} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#6c7a8a" />
            <stop offset="0.35" stopColor="#d4dde6" />
            <stop offset="1" stopColor="#56626f" />
          </linearGradient>
          <linearGradient id={uid + 'fl'} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={mixHex(fc, '#3d7bff', 0.55)} stopOpacity="0.95" />
            <stop offset="0.4" stopColor={fc} stopOpacity="0.9" />
            <stop offset="1" stopColor={mixHex(fc, '#ffffff', 0.2)} stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id={uid + 'wood'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mixHex(p.benchColor, '#ffffff', 0.12)} />
            <stop offset="1" stopColor={mixHex(p.benchColor, '#000000', 0.35)} />
          </linearGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#${uid}wall)`} />
        {/* tile grid */}
        {Array.from({length: 16}, (_, i) => (
          <line key={'v' + i} x1={(i * w) / 15} y1={0} x2={(i * w) / 15} y2={benchY} stroke={hexA(ink, 0.035)} strokeWidth={2 * u} />
        ))}
        {Array.from({length: 10}, (_, i) => (
          <line key={'h' + i} x1={0} y1={(i * benchY) / 9} x2={w} y2={(i * benchY) / 9} stroke={hexA(ink, 0.035)} strokeWidth={2 * u} />
        ))}
        {stars.map((s, i) => null)}
        {/* flame light on wall */}
        <ellipse cx={bx} cy={barrelTop - flameH * 0.4} rx={w * (portrait ? 0.7 : 0.38)} ry={h * 0.5} fill={`url(#${uid}glow)`} opacity={wallGlow} />

        {/* header */}
        <text x={w * (portrait ? 0.07 : 0.06)} y={h * (portrait ? 0.07 : 0.1)} fontFamily={fonts.grotesk} fontWeight={700} fontSize={(portrait ? 46 : 50) * u} fill={ink} opacity={prog(frame, 0, 16)}>
          {p.title}
        </text>
        <text x={w * (portrait ? 0.07 : 0.06)} y={h * (portrait ? 0.07 : 0.1) + 40 * u} fontFamily={fonts.mono} fontSize={22 * u} fill={hexA(ink, 0.6)} opacity={prog(frame, 6, 22)}>
          {p.subtitle}
        </text>

        {/* bench */}
        <rect x={0} y={benchY} width={w} height={h - benchY} fill={`url(#${uid}wood)`} />
        <rect x={0} y={benchY} width={w} height={26 * u} fill={mixHex(p.benchColor, '#ffffff', 0.2)} />
        <rect x={0} y={benchY + 26 * u} width={w} height={3 * u} fill={hexA('#000000', 0.35)} />
        <ellipse cx={bx} cy={benchY + 12 * u} rx={190 * u * (0.9 + 0.2 * intensity)} ry={20 * u} fill={fc} opacity={0.28} />

        {/* sample bottles */}
        {els.map((e, i) => {
          const [x] = bottle(i);
          const active = pillK === i;
          const lift = active ? -8 * u * clamp(springAt(frame, fps, t0 + i * F + 4, 'pop'), 0, 1.2) : 0;
          const bw = 70 * u;
          const bh = 96 * u;
          const by = benchY + 6 * u + lift;
          return (
            <g key={i} opacity={prog(frame, 4 + i * 3, 18 + i * 3)}>
              {active && <ellipse cx={x} cy={benchY + 8 * u} rx={bw * 0.85} ry={9 * u} fill={e.color} opacity={0.6} />}
              <rect x={x - bw / 2} y={by - bh} width={bw} height={bh} rx={14 * u} fill={hexA('#cfe6ff', 0.16)} stroke={hexA('#cfe6ff', active ? 0.75 : 0.35)} strokeWidth={2 * u} />
              <rect x={x - bw / 2 + 4 * u} y={by - bh * 0.5} width={bw - 8 * u} height={bh * 0.5 - 4 * u} rx={10 * u} fill={e.color} opacity={active ? 1 : 0.75} />
              <rect x={x - bw * 0.32} y={by - bh - 16 * u} width={bw * 0.64} height={18 * u} rx={5 * u} fill={hexA(ink, 0.55)} />
              <text x={x} y={by - bh * 0.18} textAnchor="middle" fontFamily={fonts.display} fontSize={26 * u} fill="#0b1220" opacity={0.85}>
                {e.symbol}
              </text>
              <text x={x} y={benchY + 52 * u} textAnchor="middle" fontFamily={fonts.mono} fontSize={17 * u} fill={hexA(ink, active ? 0.95 : 0.55)}>
                {e.name.toUpperCase().slice(0, 9)}
              </text>
            </g>
          );
        })}

        {/* burner: hose, base, barrel */}
        <path d={`M${bx + 20 * u},${benchY - 6 * u} C${bx + 20 * u},${benchY + 50 * u} ${bx + 70 * u},${benchY + 90 * u} ${bx + 60 * u},${benchY + 220 * u}`} fill="none" stroke="#1a2230" strokeWidth={16 * u} strokeLinecap="round" />
        <path d={`M${bx - 105 * u},${benchY} L${bx + 105 * u},${benchY} L${bx + 70 * u},${benchY - 34 * u} L${bx - 70 * u},${benchY - 34 * u}Z`} fill={`url(#${uid}steel)`} />
        <rect x={bx - 17 * u} y={barrelTop} width={34 * u} height={250 * u} fill={`url(#${uid}steel)`} />
        <rect x={bx - 21 * u} y={barrelTop - 4 * u} width={42 * u} height={12 * u} rx={4 * u} fill="#aab6c2" />
        <rect x={bx - 27 * u} y={benchY - 34 * u - 82 * u} width={54 * u} height={44 * u} rx={6 * u} fill="#e0a43a" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={bx - 14 * u + i * 14 * u} cy={benchY - 34 * u - 60 * u} r={4.5 * u} fill="#6b4a12" />
        ))}

        {/* flame */}
        <g style={{mixBlendMode: 'screen'}}>
          <ellipse cx={bx} cy={barrelTop - Hc * 0.42} rx={Hc * 0.34} ry={Hc * 0.62} fill={`url(#${uid}glow)`} opacity={0.28 + 0.12 * intensity} />
          <path d={flame(Hc, 58 * u, 'fo')} fill={`url(#${uid}fl)`} />
          <path d={flame(Hc * 0.66, 36 * u, 'fm')} fill={mixHex(fc, '#ffffff', 0.5)} opacity={0.55} />
          <path d={flame(Hc * 0.3, 22 * u, 'fi')} fill="#4f8cff" opacity={0.85} />
        </g>

        {/* sparks */}
        {kRaw >= 0 && kRaw < n &&
          sparks.map((s, i) => {
            const age = f - 16 - s.off;
            if (age < 0 || age > s.life) return null;
            const a = 1 - age / s.life;
            const sx = bx + s.dx * u * 0.7 + s.dr * age * u * 1.2;
            const sy = barrelTop - Hc * 0.45 - age * s.sp * 3.2 * u;
            return <circle key={i} cx={sx} cy={sy} r={s.r * u * (0.5 + a)} fill={mixHex(fc, '#ffffff', 0.5)} opacity={a * 0.9} />;
          })}

        {/* wire */}
        <line x1={tip[0] + ux * loopR} y1={tip[1] + uy * loopR} x2={anchor[0]} y2={anchor[1]} stroke="#c8d2dc" strokeWidth={4 * u} strokeLinecap="round" />
        <line x1={lerp(tip[0], anchor[0], 0.62)} y1={lerp(tip[1], anchor[1], 0.62)} x2={anchor[0]} y2={anchor[1]} stroke="#7a4b2a" strokeWidth={22 * u} strokeLinecap="round" />
        <circle cx={tip[0]} cy={tip[1]} r={loopR} fill="none" stroke={mixHex('#c8d2dc', '#ffffff', hot)} strokeWidth={3.5 * u} />
        {hot > 0 && <circle cx={tip[0]} cy={tip[1]} r={loopR + 4 * u} fill="none" stroke={fc} strokeWidth={3 * u} opacity={hot * 0.6} />}
        <circle cx={tip[0]} cy={tip[1]} r={loopR - 1.5 * u} fill={fc} opacity={0.4 * wireT * hot} />

        {/* label pill */}
        {pillK >= 0 &&
          (() => {
            const e = els[pillK];
            const s = clamp(springAt(frame, fps, t0 + pillK * F + 12, 'pop'), 0, 1.15);
            const a = prog(f, 10, 18) * (1 - prog(f, F - 8, F));
            const py = portrait ? h * 0.2 : h * 0.17;
            const pw = 330 * u;
            const ph = 84 * u;
            return (
              <g transform={`translate(${bx},${py}) scale(${0.8 + 0.2 * s})`} opacity={a}>
                <rect x={-pw / 2} y={-ph / 2} width={pw} height={ph} rx={ph / 2} fill={hexA('#0a121e', 0.82)} stroke={e.color} strokeWidth={3 * u} />
                <circle cx={-pw / 2 + ph / 2} cy={0} r={ph * 0.3} fill={e.color} />
                <text x={-pw / 2 + ph / 2} y={ph * 0.1} textAnchor="middle" fontFamily={fonts.display} fontSize={ph * 0.3} fill="#0b1220">
                  {e.symbol}
                </text>
                <text x={-pw / 2 + ph + 8 * u} y={-ph * 0.06} fontFamily={fonts.grotesk} fontWeight={700} fontSize={ph * 0.36} fill={ink}>
                  {e.name}
                </text>
                <text x={-pw / 2 + ph + 8 * u} y={ph * 0.27} fontFamily={fonts.mono} fontSize={ph * 0.22} fill={hexA(ink, 0.7)}>
                  {(e.colorName ?? '').toUpperCase()}
                </text>
              </g>
            );
          })()}
      </Svg>
    </AbsoluteFill>
  );
};

export const flameTestColors = defineMotion<Props>({
  id: 'flame-test-colors',
  title: 'Flame test colours',
  category: 'data',
  description:
    'A Bunsen-style burner on a lab bench: a wire loop dips into the flame, which turns crimson, yellow, lilac, green, red and orange for Li, Na, K, Cu, Sr and Ca with sparks, a label pill and the matching sample bottle lighting up.',
  source: ['analysis/sheets/r3/v1 (strontium flame test with wire loop)'],
  useFor: 'Chemistry lessons on flame tests and emission, "why fireworks have colours", element-by-element reveals, school science channels.',
  durationInFrames: 390,
  defaultProps: {
    title: 'Flame test',
    subtitle: 'Each metal burns its own colour',
    elements: ELEMENTS,
    background: '#0f1b2b',
    benchColor: '#8a5a38',
    baseFlame: '#6ea8ff',
    inkColor: '#e9f1ff',
    framesPer: 58,
    startFrame: 22,
    sparks: 26,
    seed: 3,
  },
  propDocs: {
    title: 'headline (top-left)',
    subtitle: 'mono sub-line',
    elements: 'steps [{symbol,name,color (flame colour),colorName?}] one per dip',
    background: 'wall colour',
    benchColor: 'bench wood colour',
    baseFlame: 'flame colour before the first dip',
    inkColor: 'text colour',
    framesPer: 'frames per element (30 fps)',
    startFrame: 'frame of the first dip',
    sparks: 'spark particles per dip',
    seed: 'spark seed',
  },
  component: FlameTestColors,
  tags: ['flame', 'chemistry', 'bunsen burner', 'lab', 'element', 'metal', 'colour', 'science', 'education', 'sparks', 'fireworks', 'periodic table'],
});
