import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LinGrad, TAU, hash01, mixHex, rgba} from '../../core/environment-kit';
import {NATURE_DOCS, NatureText, cyc, sinc, useLoop} from '../../core/nature-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Lava-lamp metaballs: soft blobs rise, stretch, merge and split through an SVG "goo" filter (blur + alpha
 * threshold) over a glowing liquid. Full-frame backdrop, or inside a lamp silhouette. Every blob makes a whole
 * number of trips per loop, so it loops seamlessly.
 */
type Props = {
  background: string;
  colors: string[];
  glow: string;
  shape: string;
  blobs: number;
  blobSize: number;
  goo: number;
  shine: boolean;
  speed: number;
  density: number;
  seed: number;
  title: string;
  subtitle: string;
  fontFamily: string;
  ink: string;
  titlePosition: string;
  titleSize: number;
};

const LavaLampBlobs: React.FC<Props> = ({background, colors, glow, shape, blobs, blobSize, goo, shine, speed, density, seed, title, subtitle, fontFamily, ink, titlePosition, titleSize}) => {
  const {p} = useLoop();
  const {w, h, u, portrait} = useStage();
  const lamp = shape === 'lamp';
  const pal = colors.length ? colors : ['#FF4D8D'];
  // liquid region: whole frame, or the lamp body
  const lw = lamp ? Math.min(w * 0.8, (portrait ? 560 : 440) * u * 1.0) : w;
  const lh = lamp ? Math.min(h * 0.82, 900 * u * (portrait ? 1.5 : 1.1)) : h;
  const lx = (w - lw) / 2;
  const ly = lamp ? (h - lh) / 2 : 0;
  const n = Math.max(2, Math.round(blobs * density));
  const gstd = (lamp ? 14 : 26) * u * goo;
  const body = lamp
    ? `M${lx + lw * 0.2} ${ly}L${lx + lw * 0.8} ${ly}C${lx + lw * 0.88} ${ly + lh * 0.45} ${lx + lw * 1.04} ${ly + lh * 0.75} ${lx + lw * 1.0} ${ly + lh}L${lx} ${ly + lh}C${lx - lw * 0.04} ${ly + lh * 0.75} ${lx + lw * 0.12} ${ly + lh * 0.45} ${lx + lw * 0.2} ${ly}Z`
    : '';

  const els: React.ReactNode[] = [];
  const sizeK = (lamp ? lw / 440 : Math.min(w, h) / 1080) * (lamp ? 1 : portrait ? 1 : 1) * blobSize;
  for (let i = 0; i < n; i++) {
    const r = (46 + 78 * hash01(seed, i, 1)) * (lamp ? 1.0 : 1.2) * (lamp ? sizeK : u * blobSize);
    const k = Math.max(1, cyc(speed, 1 + Math.floor(hash01(seed, i, 2) * 2)));
    const ph = hash01(seed, i, 3);
    const travel = lh * 0.5 - r * 0.9;
    const cyc_ = -Math.cos(TAU * (k * p + ph));
    // ease so blobs linger at top / bottom
    const e = Math.sign(cyc_) * Math.pow(Math.abs(cyc_), 0.8);
    const y = ly + lh / 2 + e * travel;
    const x = lx + lw * (0.14 + 0.72 * ((i + hash01(seed, i, 4) * 0.8) / n)) + (lamp ? 0 : 0) + sinc(1 + (i % 2), p, hash01(seed, i, 5)) * 30 * u * blobSize;
    const vel = Math.sin(TAU * (k * p + ph)); // -1..1 stretch with speed
    const sx = 1 - 0.1 * Math.abs(vel);
    const sy = 1 + 0.22 * Math.abs(vel);
    els.push(
      <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`}>
        <circle r={r} fill={`url(#llb-g${i % pal.length})`} />
      </g>,
    );
  }

  const poolR = (lamp ? lw * 0.42 : Math.max(w, h) * 0.22);
  const pools = (
    <g>
      <ellipse cx={lx + lw / 2} cy={ly + lh + poolR * 0.35 - (lamp ? 6 * u : 0) + 12 * u * sinc(1, p)} rx={lw * 0.62} ry={poolR * 0.62} fill={`url(#llb-g0)`} />
      <ellipse cx={lx + lw / 2} cy={ly - poolR * 0.3 - 10 * u * sinc(1, p, 0.5)} rx={lw * 0.5} ry={poolR * 0.5} fill={`url(#llb-g${pal.length > 1 ? 1 : 0})`} />
    </g>
  );

  const liquidId = 'llb-liquid';
  const metal = '#1A1420';
  return (
    <AbsoluteFill style={{background: lamp ? mixHex(background, '#000000', 0.55) : background}}>
      <Svg>
        <defs>
          <LinGrad id={liquidId} y1={0} y2={1} stops={[[0, mixHex(background, '#000000', 0.2)], [0.7, background], [1, mixHex(background, glow, 0.45)]]} />
          <radialGradient id="llb-heat" cx="0.5" cy="1" r="0.8">
            <stop offset="0" stopColor={glow} stopOpacity={0.55 + 0.08 * sinc(1, p)} />
            <stop offset="1" stopColor={glow} stopOpacity={0} />
          </radialGradient>
          {pal.map((c, i) => (
            <radialGradient key={i} id={`llb-g${i}`} cx="0.38" cy="0.35" r="0.75">
              <stop offset="0" stopColor={mixHex(c, '#FFFFFF', 0.3)} />
              <stop offset="1" stopColor={c} />
            </radialGradient>
          ))}
          <filter id="llb-goo" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={gstd} />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
          </filter>
          {lamp ? <clipPath id="llb-clip"><path d={body} /></clipPath> : null}
          <linearGradient id="llb-shine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset="0.18" stopColor="#FFFFFF" stopOpacity={0.22} />
            <stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset="0.85" stopColor="#FFFFFF" stopOpacity={0.1} />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </linearGradient>
        </defs>
        {lamp ? (
          <g>
            <circle cx={w / 2} cy={h / 2} r={Math.max(w, h) * 0.5} fill="url(#llb-heat)" opacity={0.3} />
            <g clipPath="url(#llb-clip)">
              <rect x={lx - 20} y={ly - 20} width={lw + 40} height={lh + 40} fill={`url(#${liquidId})`} />
              <g filter="url(#llb-goo)">{pools}{els}</g>
              <rect x={lx} y={ly} width={lw} height={lh} fill="url(#llb-heat)" opacity={0.55} />
              {shine ? <rect x={lx} y={ly} width={lw} height={lh} fill="url(#llb-shine)" /> : null}
            </g>
            <path d={body} fill="none" stroke={rgba('#FFFFFF', 0.12)} strokeWidth={2 * u} />
            <path d={`M${lx + lw * 0.16} ${ly}L${lx + lw * 0.84} ${ly}L${lx + lw * 0.76} ${ly - lw * 0.28}Q${lx + lw * 0.5} ${ly - lw * 0.46} ${lx + lw * 0.24} ${ly - lw * 0.28}Z`} fill={metal} />
            <circle cx={w / 2} cy={ly - lw * 0.4} r={lw * 0.05} fill={metal} />
            <path d={`M${lx - lw * 0.02} ${ly + lh}L${lx + lw * 1.02} ${ly + lh}L${lx + lw * 1.14} ${ly + lh + lw * 0.34}L${lx - lw * 0.14} ${ly + lh + lw * 0.34}Z`} fill={metal} />
            <rect x={lx - lw * 0.14} y={ly + lh + lw * 0.34} width={lw * 1.28} height={lw * 0.05} fill={mixHex(metal, glow, 0.25)} />
          </g>
        ) : (
          <g>
            <rect width={w} height={h} fill={`url(#${liquidId})`} />
            <g filter="url(#llb-goo)">{pools}{els}</g>
            <rect width={w} height={h} fill="url(#llb-heat)" opacity={0.5} />
          </g>
        )}
      </Svg>
      <NatureText title={title} subtitle={subtitle} fontFamily={fontFamily} ink={ink || '#FFF6FA'} position={titlePosition} size={titleSize} shadow={rgba('#1A0018', 0.45)} />
    </AbsoluteFill>
  );
};

export const lavaLampBlobs = defineMotion<Props>({
  id: 'lava-lamp-blobs',
  title: 'Lava lamp blobs',
  category: 'environment',
  description:
    'Gooey metaball blobs slowly rising, stretching, merging and splitting over a glowing liquid gradient: a full-frame psychedelic backdrop or contained in a retro lava-lamp silhouette; palette-driven and seamlessly loopable.',
  source: ['original — round 3 nature backdrops'],
  useFor:
    'Relaxing / lo-fi / retro-70s backdrops, music and podcast visuals, wellness and creative-brand heroes, loading and ambient screens, title cards; set background and a colour list from the brand palette, or switch shape to "lamp" for an object.',
  durationInFrames: 240,
  defaultProps: {
    background: '#2B0A3D',
    colors: ['#FF4D8D', '#FF9A3C', '#FFD23C'],
    glow: '#FF5A4F',
    shape: 'full',
    blobs: 9,
    blobSize: 1,
    goo: 1,
    shine: true,
    speed: 1,
    density: 1,
    seed: 12,
    title: '',
    subtitle: '',
    fontFamily: 'display',
    ink: '',
    titlePosition: 'center',
    titleSize: 1,
  },
  propDocs: {
    background: 'liquid colour (CSS hex); the glow warms its bottom',
    colors: 'blob colours (hex list), cycled across the blobs',
    glow: 'heat glow colour at the bottom',
    shape: '"full" (blobs fill the whole frame) | "lamp" (inside a lava-lamp silhouette)',
    blobs: 'number of blobs at default density',
    blobSize: 'blob size multiplier',
    goo: 'how strongly blobs merge (0.5 = barely, 1 = default, 1.6 = very gooey)',
    shine: 'lamp mode: glass highlight on the lamp',
    speed: NATURE_DOCS.speed,
    density: NATURE_DOCS.density,
    seed: NATURE_DOCS.seed,
    title: NATURE_DOCS.title,
    subtitle: NATURE_DOCS.subtitle,
    fontFamily: NATURE_DOCS.fontFamily,
    ink: NATURE_DOCS.ink,
    titlePosition: NATURE_DOCS.titlePosition,
    titleSize: NATURE_DOCS.titleSize,
  },
  component: LavaLampBlobs,
  tags: ['lava lamp', 'blobs', 'metaballs', 'goo', 'liquid', 'retro', '70s', 'psychedelic', 'lo-fi', 'ambient', 'loop', 'backdrop', 'gradient', 'relax', 'wellness', 'music'],
});
