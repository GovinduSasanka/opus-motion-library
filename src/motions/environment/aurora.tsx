import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {BlurFilter, PixelateFilter, StarField, areaK, hash01, isTransparent, ridgePath} from '../../core/environment-kit';
import {n2} from '../../core/random';
import {FilmGrain, Svg, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Aurora curtain (video21 aurora-curtain).
 * Vertical teal-green light curtains (#46DEA0 -> #1C7B64 -> #124E49, alpha tapered at both ends)
 * above silhouetted mountains on a navy #03081C starry sky. Each curtain is a ribbon of fine
 * rays that fold (x = s + A·sin(s/λ + t)), undulate (baseline sine) and shimmer
 * (opacity 0.5 + 0.3·noise(i, t·0.5)); plus 8-14 broad soft strips swaying sin(t·0.4 + i)·8 px
 * with ±3° skew, all screen-blended. Optional pixel-art pass (6 px blocks, posterize + 2x2 dither).
 */
type Props = {
  background: string;
  backdrop: boolean;
  colors: string[];
  topColor: string;
  curtains: number;
  strips: number;
  speed: number;
  intensity: number;
  height: number;
  pixelSize: number;
  stars: number;
  seed: number;
};

const Aurora: React.FC<Props> = ({background, backdrop, colors, topColor, curtains, strips, speed, intensity, height, pixelSize, stars, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = (frame / fps) * speed;
  const overlay = isTransparent(background);
  const scene = backdrop && !overlay;
  const [bright, mid, dark] = [colors[0] ?? '#46DEA0', colors[1] ?? '#1C7B64', colors[2] ?? '#124E49'];
  const hz = h * (portrait ? 0.66 : 0.7);
  const fadeIn = prog(frame, 0, 40, ease.sine);

  const curtainEls: React.ReactNode[] = [];
  const nC = Math.max(1, Math.round(curtains));
  for (let c = 0; c < nC; c++) {
    const spacing = 7 * u;
    const x0 = -0.15 * w + (hash01(seed, c, 1) - 0.5) * 0.2 * w;
    const x1 = 1.15 * w;
    const base = h * ((portrait ? 0.38 : 0.44) + 0.07 * c - (nC - 1) * 0.03);
    const A = h * 0.05;
    const lam = (420 + 200 * hash01(seed, c, 2)) * u;
    const H0 = h * height * (0.75 + 0.35 * hash01(seed, c, 3));
    let d = '';
    const rays: React.ReactNode[] = [];
    let k = 0;
    for (let s = x0; s < x1; s += spacing, k++) {
      const fold = 55 * u * Math.sin(s / (170 * u) + t * 0.5 + c * 2.1) + 22 * u * Math.sin(s / (61 * u) - t * 0.8 + c);
      const x = s + fold;
      const yb = base + A * Math.sin(x / lam + t * 0.4 + c * 1.3) + 0.4 * A * n2('aub' + seed + c, x / (300 * u), t * 0.2);
      const env = Math.min(1, Math.max(0, (s - x0) / (0.25 * w)), Math.max(0, (x1 - s) / (0.25 * w)));
      const hh = H0 * (0.45 + 0.55 * (0.5 + 0.5 * n2('auh' + seed + c, s / (260 * u), t * 0.3))) * (0.4 + 0.6 * env);
      const o = Math.max(0, Math.min(1, (0.5 + 0.3 * n2('auo' + seed + c, k * 0.21, t * 0.5)) * env * intensity));
      if (o < 0.03) continue;
      rays.push(<rect key={k} x={x.toFixed(1)} y={(yb - hh).toFixed(1)} width={(spacing * 1.7).toFixed(1)} height={(hh + 8 * u).toFixed(1)} fill={`url(#au-ray${c % 2})`} opacity={o.toFixed(2)} />);
      if (k % 4 === 0) d += `M${x.toFixed(1)} ${(yb + 4 * u).toFixed(1)}h${(spacing * 4).toFixed(1)}`;
    }
    const skew = 3 * Math.sin(t * 0.2 + c * 1.7);
    curtainEls.push(
      <g key={c} transform={`translate(${w / 2} ${base}) skewX(${skew.toFixed(2)}) translate(${-w / 2} ${-base})`}>
        <g filter="url(#au-soft)">{rays}</g>
        <path d={d} stroke={bright} strokeWidth={3 * u} opacity={0.5 * intensity} filter="url(#au-edge)" />
      </g>,
    );
  }
  const stripEls: React.ReactNode[] = [];
  for (let i = 0; i < strips; i++) {
    const sw = (40 + 100 * hash01(seed, i, 11)) * u;
    const sh = (300 + 300 * hash01(seed, i, 12)) * u * (h / Math.min(w, h)) * 0.75;
    const x = (0.05 + 0.9 * hash01(seed, i, 13)) * w + Math.sin(t * 0.4 + i) * 8 * u * 3;
    const yb = h * (portrait ? 0.4 : 0.46) + (hash01(seed, i, 14) - 0.5) * 0.06 * h;
    const o = Math.max(0, (0.5 + 0.3 * n2('aus' + seed, i, t * 0.5)) * intensity * 0.4);
    const sk = (hash01(seed, i, 15) - 0.5) * 6;
    stripEls.push(<rect key={i} x={x - sw / 2} y={yb - sh} width={sw} height={sh} fill="url(#au-ray0)" opacity={o} transform={`skewX(${sk.toFixed(1)})`} style={{transformOrigin: `${x}px ${yb}px`}} />);
  }

  const px = pixelSize > 0 ? Math.max(2, Math.round(pixelSize * u)) : 0;
  const content = (
    <g>
      {scene && (
        <g>
          <rect width={w} height={h} fill="url(#au-sky)" />
          <StarField count={Math.round(stars * areaK(w, h))} seed={seed + 3} w={w} h={h} u={u} t={t} area={[0, 0, 1, 0.7]} size={[1, 2.2]} square={px > 0} glints={px > 0 ? 0 : 0.03} />
        </g>
      )}
      <g style={{mixBlendMode: scene ? 'screen' : 'normal'}} opacity={fadeIn}>
        <g filter="url(#au-wide)">{stripEls}</g>
        {curtainEls}
      </g>
      {scene && (
        <g>
          <path d={ridgePath('aum' + seed, -10, w + 10, hz - 110 * u, 190 * u, 480 * u, hz + 4, {ridged: true, octaves: 3, step: 6 * u})} fill="#16264A" />
          <path d={ridgePath('aum' + seed, -10, w + 10, hz - 110 * u, 190 * u, 480 * u, hz + 4, {ridged: true, octaves: 3, step: 6 * u})} fill="url(#au-snow)" opacity={0.75} />
          <path d={ridgePath('aun' + seed, -10, w + 10, hz - 10 * u, 60 * u, 260 * u, hz + 4, {ridged: true, octaves: 2, step: 6 * u})} fill="#081127" />
          <rect y={hz} width={w} height={h - hz} fill="url(#au-ice)" />
          <rect y={hz} width={w} height={(h - hz) * 0.5} fill={bright} opacity={0.07 * fadeIn * intensity} filter="url(#au-wide)" />
          {Array.from({length: 7}, (_, i) => {
            const fx = hash01(seed, i, 21) * w;
            const fy = hz + (h - hz) * (0.2 + 0.7 * hash01(seed, i, 22));
            const fw = (120 + 260 * hash01(seed, i, 23)) * u * (0.5 + (fy - hz) / (h - hz));
            return <ellipse key={i} cx={fx} cy={fy} rx={fw} ry={fw * 0.08} fill="#1B2D52" opacity={0.8} />;
          })}
        </g>
      )}
    </g>
  );

  return (
    <AbsoluteFill style={{background: overlay ? 'transparent' : background}}>
      <Svg>
        <defs>
          <linearGradient id="au-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#02061A" />
            <stop offset="0.5" stopColor="#06112E" />
            <stop offset="0.72" stopColor="#0C2347" />
            <stop offset="1" stopColor="#081733" />
          </linearGradient>
          <linearGradient id="au-ice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0F2147" />
            <stop offset="1" stopColor="#050C20" />
          </linearGradient>
          <linearGradient id="au-snow" x1={0} y1={hz - 230 * u} x2={0} y2={hz - 60 * u} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#9FBCE6" />
            <stop offset="0.5" stopColor="#4A679A" stopOpacity={0.6} />
            <stop offset="1" stopColor="#16264A" stopOpacity={0} />
          </linearGradient>
          {[0, 1].map((k) => (
            <linearGradient key={k} id={`au-ray${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={topColor} stopOpacity={0} />
              <stop offset="0.3" stopColor={topColor} stopOpacity={0.18} />
              <stop offset="0.55" stopColor={dark} stopOpacity={0.45} />
              <stop offset="0.8" stopColor={mid} stopOpacity={0.8} />
              <stop offset={k ? 0.93 : 0.95} stopColor={bright} stopOpacity={1} />
              <stop offset="1" stopColor={bright} stopOpacity={0} />
            </linearGradient>
          ))}
          <BlurFilter id="au-soft" std={3 * u} />
          <BlurFilter id="au-edge" std={6 * u} />
          <BlurFilter id="au-wide" std={22 * u} />
          {px > 0 && <PixelateFilter id="au-px" size={px} w={w} h={h} levels={scene ? 14 : 0} dither={scene ? 0.035 : 0} />}
        </defs>
        {px > 0 ? <g filter="url(#au-px)">{content}</g> : content}
      </Svg>
      {scene && <Vignette strength={0.5} />}
      {scene && <FilmGrain opacity={0.05} />}
    </AbsoluteFill>
  );
};

export const aurora = defineMotion<Props>({
  id: 'aurora',
  title: 'Aurora curtain',
  category: 'environment',
  description: 'Undulating teal-green aurora curtains shimmer over a navy starry sky, snowy mountains and an icy sea, with an optional pixel-art (pixelate + dither) look. Overlay-capable.',
  source: ['video21 15.5-16.6, 24.0-27.5'],
  useFor: 'Polar / night / wonder / title-card backdrops; transparent overlay for any night sky.',
  durationInFrames: 210,
  defaultProps: {
    background: '#03081C',
    backdrop: true,
    colors: ['#46DEA0', '#1C7B64', '#124E49'],
    topColor: '#6C5BC4',
    curtains: 3,
    strips: 11,
    speed: 1,
    intensity: 1,
    height: 0.32,
    pixelSize: 6,
    stars: 170,
    seed: 1,
  },
  propDocs: {
    background: 'CSS background; "transparent" = overlay (only the curtains)',
    backdrop: 'paint sky, stars, mountains and ice',
    colors: '[bright edge, mid, dark] curtain colours',
    topColor: 'faint tint at the curtain tops',
    curtains: 'number of ray curtains (1-4)',
    strips: 'broad soft strips behind the curtains (8-14 in source)',
    speed: 'undulation speed multiplier',
    intensity: 'overall brightness multiplier',
    height: 'curtain height as a fraction of frame height',
    pixelSize: 'pixel-art block size at 1080p; 0 = smooth (6 = video21 look)',
    stars: 'stars per 1080p frame',
    seed: 'random seed',
  },
  component: Aurora,
  tags: ['sky', 'night', 'aurora', 'polar', 'pixel', 'overlay', 'ambience'],
});
