import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {PaperFilter, easeInExpo, easeOutCubic, h01, lin, mountainRange, rgba, shadeHex, star4} from '../../core/r2-x58-kit';

/**
 * x5 portal-glow: a golden ring stands between paper-stone ruins with a four-point star in its centre; 16–24 light
 * rays rotate slowly behind the star (6°/s), the ring pulses (0.9–1.0 at 0.5 Hz), a glow pool shimmers in the
 * stone basin below, small glints wink along the pillars and motes drift up. At `bloomAt` the light ramps to a
 * warm white-out over 0.25 s (easeInExpo) — the "burnout" scene change.
 */
type Props = {
  background: string;
  color: string;
  glow: string;
  x: number;
  y: number;
  size: number;
  rays: number;
  raySpeed: number;
  pulse: number;
  bloomAt: number;
  bloomColor: string;
  ruins: boolean;
  stone: string;
  seed: number;
};

const PortalGlow: React.FC<Props> = ({background, color, glow, x, y, size, rays, raySpeed, pulse, bloomAt, bloomColor, ruins, stone, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const S = Math.min(w, h);
  const cx = w * x;
  const cy = h * (portrait ? y + 0.1 : y);
  const R = (S * size) / 2;
  const id = `portal-glow-${seed}`;
  const intro = easeOutCubic(lin(frame, 0, 24));
  const pul = 1 - pulse * 0.5 * (1 + Math.sin(t * Math.PI * 2 * 0.5));
  const bloom = bloomAt > 0 ? easeInExpo(lin(frame, bloomAt, bloomAt + 0.25 * fps)) : 0;
  const pre = bloomAt > 0 ? lin(frame, bloomAt - 30, bloomAt) : 0;
  const lightK = intro * pul * (1 + pre * 0.6);
  const floorY = cy + R * 1.55;
  const pillarW = S * 0.13;
  const gap = R * 1.45;
  const pillars = portrait
    ? [{x: cx - gap - pillarW, top: cy - R * 1.6}, {x: cx + gap, top: cy - R * 1.4}]
    : [
        {x: cx - gap - pillarW * 2.15, top: cy - R * 1.2},
        {x: cx - gap - pillarW, top: cy - R * 1.75},
        {x: cx + gap, top: cy - R * 1.6},
        {x: cx + gap + pillarW * 1.15, top: cy - R * 1.05},
      ];
  const far = mountainRange(seed + 2, -w * 0.05, w * 1.05, floorY - S * 0.08, S * 0.1, S * 0.3, portrait ? 3 : 5);
  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <PaperFilter id={`${id}-p`} u={u} h={h} rim="#F4E3B6" seed={seed} />
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={shadeHex(background, -0.2)} />
            <stop offset="100%" stopColor={shadeHex(background, 0.15)} />
          </linearGradient>
          <radialGradient id={`${id}-halo`}>
            <stop offset="0%" stopColor={glow} stopOpacity={0.85} />
            <stop offset="30%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={`${id}-ray`}>
            <stop offset="10%" stopColor={glow} stopOpacity={0.9} />
            <stop offset="100%" stopColor={glow} stopOpacity={0} />
          </radialGradient>
          <linearGradient id={`${id}-stone`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={shadeHex(stone, 0.25)} />
            <stop offset="55%" stopColor={stone} />
            <stop offset="100%" stopColor={shadeHex(stone, -0.3)} />
          </linearGradient>
          <filter id={`${id}-bl`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={R * 0.06} />
          </filter>
          <filter id={`${id}-bl2`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={3 * u} />
          </filter>
        </defs>
        <rect width={w} height={h} fill={`url(#${id}-sky)`} />
        {Array.from({length: 70}, (_, i) => (
          <circle key={i} cx={h01(i, seed, 1) * w} cy={h01(i, seed, 2) * h * 0.6} r={(0.8 + 1.4 * h01(i, 3)) * u} fill="#FFF3D6" opacity={0.3 + 0.6 * Math.abs(Math.sin(t * (0.8 + h01(i, 5)) + i))} />
        ))}
        {[0, 1, 2].map((i) => {
          const sx = w * (0.15 + i * 0.34) + (i === 1 ? w * 0.05 : 0);
          const sy = h * (0.12 + 0.05 * i);
          return <path key={i} d={star4(S * 0.012, 0.2)} transform={`translate(${sx} ${sy})`} fill={color} opacity={0.8} />;
        })}
        <g filter={`url(#${id}-p)`}>
          <path d={far.base} fill="#5D63A5" />
          <path d={far.shade} fill="#3E4889" opacity={0.7} />
          <path d={far.snow} fill="#D9D3E8" />
        </g>
        {/* rays behind the star */}
        <g transform={`translate(${cx} ${cy}) rotate(${t * raySpeed})`} opacity={0.55 * lightK} style={{mixBlendMode: 'screen'}}>
          {Array.from({length: rays}, (_, i) => {
            const a = (i / rays) * 360;
            const L = R * (i % 2 ? 1.25 : 1.75);
            const wd = R * 0.05;
            return <path key={i} d={`M0 0 L${-wd} ${-L} L${wd} ${-L}Z`} fill={`url(#${id}-ray)`} transform={`rotate(${a})`} />;
          })}
        </g>
        <circle cx={cx} cy={cy} r={R * 2.6} fill={`url(#${id}-halo)`} opacity={0.75 * lightK} />
        {/* pillars */}
        {ruins
          ? pillars.map((p, i) => {
              const ph = floorY - p.top;
              const blocks = Math.max(4, Math.round(ph / (pillarW * 0.55)));
              return (
                <g key={i} filter={`url(#${id}-p)`}>
                  {Array.from({length: blocks}, (_, k) => {
                    const by = p.top + (k / blocks) * ph;
                    const jitter = (h01(i, k, 7) - 0.5) * pillarW * 0.08;
                    return <rect key={k} x={p.x + jitter} y={by} width={pillarW} height={ph / blocks - 2 * u} fill={`url(#${id}-stone)`} />;
                  })}
                  <path d={`M${p.x} ${p.top} l${pillarW * 0.3} ${-pillarW * 0.25} l${pillarW * 0.35} ${pillarW * 0.12} l${pillarW * 0.35} ${-pillarW * 0.08} v${pillarW * 0.21}Z`} fill={shadeHex(stone, 0.1)} />
                  {/* carved glowing moon / star */}
                  <g transform={`translate(${p.x + pillarW / 2} ${p.top + ph * 0.32})`} opacity={0.6 + 0.4 * lightK}>
                    {i % 2 ? (
                      <path d={star4(pillarW * 0.16, 0.2)} fill={glow} />
                    ) : (
                      <path d={`M${pillarW * 0.1} ${-pillarW * 0.2} A${pillarW * 0.2} ${pillarW * 0.2} 0 1 0 ${pillarW * 0.1} ${pillarW * 0.2} A${pillarW * 0.15} ${pillarW * 0.2} 0 1 1 ${pillarW * 0.1} ${-pillarW * 0.2}Z`} fill={glow} />
                    )}
                  </g>
                  {/* vines */}
                  <path d={`M${p.x + pillarW * 0.15} ${p.top} q${pillarW * 0.2} ${ph * 0.2} ${-pillarW * 0.05} ${ph * 0.45}`} stroke="#6E8F3E" strokeWidth={4 * u} fill="none" />
                  {Array.from({length: 6}, (_, k) => (
                    <ellipse key={k} cx={p.x + pillarW * (0.15 + 0.08 * Math.sin(k))} cy={p.top + ph * (0.05 + k * 0.07)} rx={5 * u} ry={3 * u} fill="#8DB04C" />
                  ))}
                </g>
              );
            })
          : null}
        {/* glints along the pillars */}
        {ruins
          ? Array.from({length: 8}, (_, i) => {
              const p = pillars[i % pillars.length];
              const per = 1.6 + h01(i, 9);
              const ph = ((t + h01(i, 4) * per) % per) / per;
              const k = ph < 0.2 ? Math.sin((ph / 0.2) * Math.PI) : 0;
              if (k <= 0) return null;
              return <path key={i} d={star4(S * 0.012 * k, 0.15)} transform={`translate(${p.x + pillarW * (0.2 + 0.6 * h01(i, 2))} ${p.top + (floorY - p.top) * (0.2 + 0.6 * h01(i, 3))})`} fill="#FFF6D8" />;
            })
          : null}
        {/* ring */}
        <g transform={`translate(${cx} ${cy}) scale(${0.85 + 0.15 * intro})`}>
          <circle r={R} fill="none" stroke={color} strokeWidth={R * 0.2} opacity={0.35 * lightK} filter={`url(#${id}-bl)`} />
          <circle r={R} fill="none" stroke={shadeHex(color, -0.25)} strokeWidth={R * 0.1} />
          <circle r={R} fill="none" stroke={color} strokeWidth={R * 0.06} opacity={0.75 + 0.25 * pul} />
          <circle r={R * 0.93} fill="none" stroke={glow} strokeWidth={R * 0.012} opacity={0.8} />
          {Array.from({length: 24}, (_, i) => (
            <line key={i} x1={0} y1={-R * 1.04} x2={0} y2={-R * 0.96} stroke={shadeHex(color, -0.4)} strokeWidth={1.5 * u} transform={`rotate(${i * 15})`} />
          ))}
          <circle r={R * 0.5} fill={glow} opacity={0.25 * lightK} filter={`url(#${id}-bl)`} />
          <g transform={`scale(${(0.9 + 0.1 * pul) * (0.6 + 0.4 * intro)})`}>
            <path d={star4(R * 0.62, 0.12)} fill={color} />
            <path d={star4(R * 0.62, 0.12)} fill={glow} transform="rotate(45) scale(0.45)" />
            <path d={star4(R * 0.36, 0.16)} fill="#FFFBEA" />
          </g>
        </g>
        {/* basin + glow pool + steps */}
        <g>
          <ellipse cx={cx} cy={floorY - R * 0.08} rx={R * 0.95} ry={R * 0.6} fill={glow} opacity={0.35 * lightK} filter={`url(#${id}-bl)`} />
          <g filter={`url(#${id}-p)`}>
            <path d={`M${cx - R * 0.75} ${floorY - R * 0.25} Q${cx} ${floorY + R * 0.25} ${cx + R * 0.75} ${floorY - R * 0.25} L${cx + R * 0.55} ${floorY + R * 0.05} L${cx - R * 0.55} ${floorY + R * 0.05}Z`} fill={stone} />
            {[0, 1, 2].map((k) => (
              <rect key={k} x={cx - R * (0.9 + k * 0.25)} y={floorY + R * (0.05 + k * 0.14)} width={R * (1.8 + k * 0.5)} height={R * 0.14} fill={shadeHex(stone, -0.05 * k)} />
            ))}
          </g>
          <ellipse cx={cx} cy={floorY - R * 0.25} rx={R * 0.72} ry={R * 0.08} fill={glow} opacity={0.6 + 0.3 * Math.sin(t * 3)} />
          {Array.from({length: 7}, (_, i) => (
            <path key={i} d={`M${cx - R * 0.5 + i * R * 0.16} ${floorY - R * 0.27} q${R * 0.02} ${-R * 0.25} ${0} ${-R * 0.5}`} stroke={glow} strokeWidth={2 * u} opacity={(0.3 + 0.3 * Math.sin(t * 4 + i)) * lightK} fill="none" filter={`url(#${id}-bl2)`} />
          ))}
        </g>
        {/* ground */}
        <g filter={`url(#${id}-p)`}>
          <path d={`M0 ${floorY + R * 0.47} Q${w * 0.5} ${floorY + R * 0.4} ${w} ${floorY + R * 0.47} V${h} H0Z`} fill="#3E5A35" />
          {Array.from({length: 9}, (_, i) => {
            const bx = (i / 8) * w;
            const br = S * (0.05 + 0.04 * h01(i, 71));
            if (Math.abs(bx - cx) < R * 1.3) return null;
            return <ellipse key={`b${i}`} cx={bx} cy={floorY + R * 0.5} rx={br * 1.4} ry={br} fill={i % 2 ? '#2D4630' : '#355238'} />;
          })}
          {Array.from({length: 4}, (_, i) => {
            const rx0 = i < 2 ? w * (0.08 + i * 0.14) : w * (0.72 + (i - 2) * 0.16);
            const ry0 = h * 0.94;
            const s = S * 0.07;
            return <path key={`r${i}`} d={`M${rx0 - s} ${ry0} L${rx0 - s * 0.7} ${ry0 - s * 0.8} L${rx0 + s * 0.1} ${ry0 - s} L${rx0 + s} ${ry0 - s * 0.4} L${rx0 + s * 1.1} ${ry0}Z`} fill="#5A5A5C" />;
          })}
          {Array.from({length: 30}, (_, i) => (
            <circle key={i} cx={w * h01(i, 51)} cy={floorY + R * 0.55 + (h - floorY) * 0.5 * h01(i, 52)} r={(4 + 4 * h01(i, 53)) * u} fill={['#D84F3E', '#E9A531', '#F2E9E4'][i % 3]} />
          ))}
        </g>
        {/* rising motes */}
        {Array.from({length: 22}, (_, i) => {
          const per = 3 + 2 * h01(i, 61);
          const ph = ((t + h01(i, 62) * per) % per) / per;
          const mx = cx + (h01(i, 63) - 0.5) * R * 1.6 + Math.sin(t * 1.5 + i) * 6 * u;
          const my = floorY - R * 0.3 - ph * R * 2.2;
          return <circle key={i} cx={mx} cy={my} r={2.2 * u} fill="#FFF3C4" opacity={Math.sin(ph * Math.PI) * 0.9 * intro} />;
        })}
      </svg>
      {bloom > 0 ? <AbsoluteFill style={{background: `radial-gradient(circle at ${x * 100}% ${y * 100}%, ${rgba(bloomColor, 1)} ${bloom * 60}%, ${rgba(bloomColor, bloom)} 100%)`}} /> : null}
    </AbsoluteFill>
  );
};

export const portalGlow = defineMotion<Props>({
  id: 'portal-glow',
  title: 'Portal glow',
  category: 'fx',
  description:
    'A golden ring between paper-stone ruins with a four-point star at its centre, slowly rotating light rays, a pulsing glow, a shimmering basin pool, winking glints and rising motes, ending in a warm white-out bloom.',
  source: ['video x5 48.3-53.9 s (star-portal ruins + burnout)', 'video x5 30.4-35.8 s (cave ripple glow)'],
  useFor: '"The goal / destination / unlock" beat, level-ups and launches; ends in a white-out you can cut on.',
  durationInFrames: 180,
  defaultProps: {
    background: '#182C4B',
    color: '#EDCB6A',
    glow: '#FFF0B8',
    x: 0.5,
    y: 0.42,
    size: 0.36,
    rays: 20,
    raySpeed: 6,
    pulse: 0.1,
    bloomAt: 164,
    bloomColor: '#FBF4E0',
    ruins: true,
    stone: '#C8A866',
    seed: 4,
  },
  propDocs: {
    background: 'night sky colour',
    color: 'ring / star gold',
    glow: 'light colour (rays, halo, pool)',
    x: 'ring centre x (fraction of width)',
    y: 'ring centre y (fraction of height)',
    size: 'ring diameter as a fraction of the short side',
    rays: 'number of light rays behind the star (16–24)',
    raySpeed: 'ray rotation in degrees per second',
    pulse: 'pulse depth (0.1 = 0.9–1.0 opacity at 0.5 Hz)',
    bloomAt: 'frame the light blooms into a white-out (0 = never)',
    bloomColor: "white-out colour ('#FBF4E0' warm, '#F5F9FA' cool)",
    ruins: 'draw the stone pillars, carvings and glints',
    stone: 'pillar stone colour',
    seed: 'layout seed',
  },
  component: PortalGlow,
  tags: ['portal', 'glow', 'ring', 'star', 'golden', 'rays', 'ruins', 'magic', 'destination', 'unlock', 'bloom', 'whiteout', 'paper', 'storybook', 'level up', 'fantasy'],
});
