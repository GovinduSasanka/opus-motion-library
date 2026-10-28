// Adapted from lemo-opuscar/core/post/crt.js and styles/cel-anime-80s/demo/post.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {useSafeId} from '../../core/image-kit';
import {resolveSrc} from '../../core/asset';
import {rng} from '../../core/random';
import {s1f, sh, sseg, smooth01, easeOut3} from '../../core/r2-s1-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Soft VHS-on-CRT playback pass. A demo night scene (or your `src` image) goes through the tape-signal chain in one SVG
 * filter: luma stays sharp, chroma is smeared horizontally with the red channel shifted right, a threshold-blurred
 * phosphor glow is added; then scanlines, an RGB grille, darkened corners, per-frame noise, a power-on opening and
 * tracking-noise bursts (per-strip horizontal tear, a rolling noise band, a head-switch bar). Set `overlay` to draw only
 * the grille / scanlines / corners / noise / bursts over other layers on a transparent background.
 */
type Props = {
  src: string;
  title: string;
  subtitle: string;
  scan: number;
  grille: number;
  bleed: number;
  rshift: number;
  glow: number;
  corner: number;
  noise: number;
  powerOn: number[];
  tracking: number[][];
  overlay: boolean;
  seed: number;
  background: string;
};

const TapeScene: React.FC<{w: number; h: number; u: number; frame: number; src: string; title: string; subtitle: string; seed: number; background: string; uid: string}> = ({
  w,
  h,
  u,
  frame,
  src,
  title,
  subtitle,
  seed,
  background,
  uid,
}) => {
  const hor = h * 0.6;
  const pan = frame * 0.55 * u;
  const bld = React.useMemo(() => {
    const r = rng(seed * 31 + 7);
    const out: {x: number; bw: number; bh: number; tone: number; win: number}[] = [];
    let x = -40 * u;
    while (x < w * 1.6) {
      const bw = (46 + r() * 90) * u;
      out.push({x, bw, bh: (90 + r() * 260) * u, tone: r(), win: r()});
      x += bw + (4 + r() * 8) * u;
    }
    return out;
  }, [w, u, seed]);
  const period = w * 1.6;
  const stars = React.useMemo(() => {
    const r = rng(seed * 17 + 3);
    return Array.from({length: 46}, () => ({x: r() * w, y: r() * hor * 0.7, r: (0.8 + r() * 1.4) * u, p: r() * 6}));
  }, [w, hor, u, seed]);
  if (src) {
    return (
      <g>
        <rect width={w} height={h} fill="#0b0814" />
        <image href={resolveSrc(src)} x={0} y={0} width={w} height={h} preserveAspectRatio="xMidYMid slice" />
        {subtitle && <Sub w={w} h={h} u={u} text={subtitle} />}
      </g>
    );
  }
  const fs = Math.min(w * 0.11, 190 * u, (w * 0.92) / (Math.max(4, [...title].length) * 0.84));
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#130D1F" />
          <stop offset="0.55" stopColor="#2B1D40" />
          <stop offset="0.86" stopColor="#8A2F6E" />
          <stop offset="1" stopColor="#FF6AA0" />
        </linearGradient>
        <linearGradient id={`${uid}-sun`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD08A" />
          <stop offset="1" stopColor="#FF3FA4" />
        </linearGradient>
        <clipPath id={`${uid}-sunclip`}>
          <rect x={0} y={0} width={w} height={hor} />
        </clipPath>
        <linearGradient id={`${uid}-gnd`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A0F4F" />
          <stop offset="1" stopColor="#12081C" />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={background} />
      <rect width={w} height={hor} fill={`url(#${uid}-sky)`} />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={0.45 + 0.4 * Math.sin(frame * 0.12 + s.p)} />
      ))}
      <g clipPath={`url(#${uid}-sunclip)`}>
        <circle cx={w * 0.5} cy={hor - 8 * u} r={Math.min(w, h) * 0.26} fill={`url(#${uid}-sun)`} />
        {Array.from({length: 7}, (_, i) => (
          <rect key={i} x={0} y={hor - (Math.min(w, h) * 0.26) * (0.1 + i * 0.1) - 4 * u + 0} width={w} height={(1.5 + i * 1.7) * u} fill="#2B1D40" opacity={0.9} />
        ))}
      </g>
      {/* skyline, two parallax layers */}
      {[0, 1].map((layer) => (
        <g key={layer} transform={`translate(${-((pan * (layer ? 1 : 0.5)) % period)} 0)`}>
          {[0, 1].map((rep) => (
            <g key={rep} transform={`translate(${rep * period} 0)`}>
              {bld.map((b, i) => {
                if ((i + layer) % 2 === 0 && layer === 0) return null;
                if ((i + layer) % 2 === 1 && layer === 1) return null;
                const bh = b.bh * (layer ? 1 : 0.7);
                const col = layer ? '#0F0A1A' : '#1B1230';
                return (
                  <g key={i}>
                    <rect x={b.x} y={hor - bh} width={b.bw} height={bh + 2} fill={col} />
                    {layer === 1 &&
                      Array.from({length: Math.floor(b.bw / (14 * u)) * Math.floor(bh / (20 * u))}, (_, k) => {
                        const cols = Math.floor(b.bw / (14 * u));
                        const cxk = k % cols;
                        const cyk = Math.floor(k / cols);
                        if (sh(i, k, seed) > 0.28) return null;
                        return <rect key={k} x={b.x + (cxk + 0.25) * 14 * u} y={hor - bh + (cyk + 0.25) * 20 * u + 10 * u} width={7 * u} height={9 * u} fill={sh(i, k, 5) > 0.5 ? '#E2B24E' : '#35E7FF'} opacity={0.9} />;
                      })}
                  </g>
                );
              })}
            </g>
          ))}
        </g>
      ))}
      {/* neon bars: strong saturated edges make the chroma smear readable */}
      <rect x={w * 0.07} y={hor - 300 * u} width={26 * u} height={300 * u} fill="#FF2E4D" />
      <rect x={w * 0.07 + 40 * u} y={hor - 300 * u} width={26 * u} height={300 * u} fill="#35E7FF" />
      <rect x={w * 0.93 - 66 * u} y={hor - 240 * u} width={26 * u} height={240 * u} fill="#35E7FF" />
      <rect x={w * 0.93 - 26 * u} y={hor - 240 * u} width={26 * u} height={240 * u} fill="#FF3FA4" />
      {/* ground + moving grid */}
      <rect x={0} y={hor} width={w} height={h - hor} fill={`url(#${uid}-gnd)`} />
      {Array.from({length: 11}, (_, i) => {
        const k = (i + (frame * 0.06) % 1) / 11;
        const y = hor + (h - hor) * Math.pow(k, 2.1);
        return <line key={i} x1={0} x2={w} y1={y} y2={y} stroke="#35E7FF" strokeWidth={(0.8 + k * 2.4) * u} opacity={0.2 + 0.6 * k} />;
      })}
      {Array.from({length: 17}, (_, i) => {
        const xr = (i - 8) / 8;
        return <line key={i} x1={w / 2 + xr * w * 0.04} y1={hor} x2={w / 2 + xr * w * 1.1} y2={h} stroke="#35E7FF" strokeWidth={1.6 * u} opacity={0.4} />;
      })}
      <line x1={0} x2={w} y1={hor} y2={hor} stroke="#fff" strokeWidth={2.5 * u} opacity={0.9} />
      <text x={w / 2} y={h * 0.34} textAnchor="middle" fontFamily={s1f.dela} fontSize={fs} fill="#FFF7E8" stroke="#FF2E4D" strokeWidth={4 * u} paintOrder="stroke" letterSpacing={fs * 0.02}>
        {title}
      </text>
      {subtitle && <Sub w={w} h={h} u={u} text={subtitle} />}
    </g>
  );
};

const Sub: React.FC<{w: number; h: number; u: number; text: string}> = ({w, h, u, text}) => (
  <text x={w / 2} y={h - 96 * u} textAnchor="middle" fontFamily={s1f.barlow} fontWeight={600} fontSize={Math.min(54 * u, w * 0.07)} fill="#FFF0A0" stroke="#1a1020" strokeWidth={9 * u} paintOrder="stroke" strokeLinejoin="round">
    {text}
  </text>
);

const VhsCrtPass: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const uid = useSafeId('vhs');
  const [p0, p1] = [p.powerOn[0] ?? 0, p.powerOn[1] ?? 0];
  const power = p1 > p0 ? sseg(frame, p0, p1) : 1;
  // power-on: dot -> horizontal line (first 30 %) -> opens vertically (rest), boosted by (1-sy)^3
  const sx = p1 > p0 ? 0.02 + 0.98 * easeOut3(clamp(power / 0.3)) : 1;
  const sy = p1 > p0 ? (power < 0.3 ? 0.004 : 0.004 + 0.996 * smooth01((power - 0.3) / 0.7)) : 1;
  const boost = p1 > p0 ? Math.pow(1 - sy, 3) : 0;
  // tracking bursts
  let burst = 0;
  let bt = 0;
  for (const [a, b] of p.tracking) {
    if (frame >= a && frame <= b) {
      burst = Math.sin(Math.PI * sseg(frame, a, b)) * 0.7 + 0.3;
      bt = sseg(frame, a, b);
    }
  }
  const bandH = h * 0.14;
  const bandY = burst ? h * (0.15 + 0.7 * ((bt * 1.3 + 0.1) % 1)) : 0;
  const tearStrips = React.useMemo(() => Array.from({length: 7}, (_, i) => i), []);
  const sig = (p.bleed * u) / 3.4;
  const gl = Math.max(0.01, p.glow);

  const body = (
    <TapeScene w={w} h={h} u={u} frame={frame} src={p.src} title={p.title} subtitle={p.subtitle} seed={p.seed} background={p.background} uid={uid} />
  );

  // overlay-only mode: transparent, just the screen finish
  const finish = (
    <>
      <defs>
        <pattern id={`${uid}-sl`} width={8} height={3 * u} patternUnits="userSpaceOnUse">
          <rect width={8} height={1.1 * u} y={1.9 * u} fill="#000" opacity={clamp(p.scan * 1.2)} />
        </pattern>
        <pattern id={`${uid}-gr`} width={3 * u} height={4} patternUnits="userSpaceOnUse">
          <rect x={0} width={u} height={4} fill="#ff0000" opacity={clamp(p.grille * 1.2)} />
          <rect x={u} width={u} height={4} fill="#00ff00" opacity={clamp(p.grille * 1.2)} />
          <rect x={2 * u} width={u} height={4} fill="#0000ff" opacity={clamp(p.grille * 1.2)} />
        </pattern>
        <radialGradient id={`${uid}-cn`} cx="50%" cy="50%" r="75%">
          <stop offset="0.5" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={clamp(p.corner * 2.1)} />
        </radialGradient>
        <filter id={`${uid}-nz`} x="0" y="0" width={w} height={h} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves={1} seed={frame % 997} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  6 0 0 0 -3" />
        </filter>
        <filter id={`${uid}-nzb`} x="0" y="0" width={w} height={h} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves={1} seed={frame % 997} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -6 0 0 0 3" />
        </filter>
      </defs>
      <rect width={w} height={h} fill={`url(#${uid}-gr)`} />
      <rect width={w} height={h} fill={`url(#${uid}-sl)`} />
      <rect width={w} height={h} fill={`url(#${uid}-cn)`} />
      <rect width={w} height={h} filter={`url(#${uid}-nz)`} opacity={clamp(p.noise * 6) * 1} />
      <rect width={w} height={h} filter={`url(#${uid}-nzb)`} opacity={clamp(p.noise * 6) * 1} />
    </>
  );

  if (p.overlay) {
    return (
      <AbsoluteFill style={{background: 'transparent'}}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
          {finish}
          {burst > 0 && (
            <g>
              <rect x={0} y={bandY} width={w} height={bandH} filter={`url(#${uid}-nz)`} opacity={0.5 * burst} />
              <rect x={0} y={h * 0.95} width={w} height={h * 0.05} filter={`url(#${uid}-nz)`} opacity={0.8 * burst} />
            </g>
          )}
        </svg>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={`${uid}-tape`} x="0" y="0" width={w} height={h} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0" result="Ls" />
            <feGaussianBlur in="SourceGraphic" stdDeviation={`${sig} 0`} edgeMode="duplicate" result="B" />
            <feColorMatrix in="B" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="Rc" />
            <feOffset in="Rc" dx={p.rshift * u} dy="0" result="Rs" />
            <feColorMatrix in="B" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="GB" />
            <feComposite in="Rs" in2="GB" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="Bs" />
            <feColorMatrix in="Bs" type="matrix" values="0.701 -0.587 -0.114 0 0.5  -0.299 0.413 -0.114 0 0.5  -0.299 -0.587 0.886 0 0.5  0 0 0 1 0" result="Cc" />
            <feComposite in="Ls" in2="Cc" operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.5" result="tape" />
            <feGaussianBlur in="tape" stdDeviation={10 * u} result="gb" />
            <feColorMatrix in="gb" type="matrix" values={`${gl} 0 0 0 ${-0.15 * gl}  0 ${gl} 0 0 ${-0.15 * gl}  0 0 ${gl} 0 ${-0.15 * gl}  0 0 0 1 0`} result="glw" />
            <feComposite in="tape" in2="glw" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="out" />
            <feComponentTransfer in="out">
              <feFuncA type="table" tableValues="1 1" />
            </feComponentTransfer>
          </filter>
          <clipPath id={`${uid}-frame`}>
            <rect width={w} height={h} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${uid}-frame)`}>
          <g transform={`translate(${w / 2} ${h / 2}) scale(${sx} ${sy}) translate(${-w / 2} ${-h / 2})`}>
            <g filter={`url(#${uid}-tape)`}>
              <g id={`${uid}-scene`}>{body}</g>
              {burst > 0 &&
                tearStrips.map((i) => {
                  const y0 = bandY - bandH / 2 + (i / 7) * bandH;
                  const hh = bandH / 7;
                  const dx = (sh(frame, i, p.seed) - 0.5) * 2 * 46 * u * burst + Math.sin(frame * 0.8 + i) * 8 * u * burst;
                  return (
                    <g key={i}>
                      <clipPath id={`${uid}-tc${i}`}>
                        <rect x={0} y={y0} width={w} height={hh + 0.5} />
                      </clipPath>
                      <g clipPath={`url(#${uid}-tc${i})`}>
                        <use href={`#${uid}-scene`} x={dx} />
                      </g>
                    </g>
                  );
                })}
              {burst > 0 && (
                <>
                  <rect x={0} y={bandY - bandH * 0.1} width={w} height={bandH * 0.2} filter={`url(#${uid}-nz)`} opacity={0.55 * burst} />
                  <rect x={0} y={h * 0.955} width={w} height={h * 0.045} filter={`url(#${uid}-nz)`} opacity={0.85 * burst} />
                </>
              )}
            </g>
            {boost > 0.01 && <rect width={w} height={h} fill="#fff" opacity={boost * 0.85} />}
          </g>
        </g>
        {finish}
      </svg>
    </AbsoluteFill>
  );
};

export const vhsCrtPass = defineMotion<Props>({
  id: 'vhs-crt-pass',
  title: 'VHS CRT pass',
  category: 'fx',
  description:
    'Soft VHS-on-CRT playback over a night scene: smeared chroma with the red shifted right, scanlines, RGB grille, phosphor glow, dark corners, noise, a power-on opening and tracking-noise tears.',
  source: ['lemo-opuscar core/post/crt.js + styles/cel-anime-80s/demo/post.js (MIT, LemoLab)'],
  useFor:
    'Retro, 80s, found-footage and synthwave looks over any picture; use overlay:true for a scanline/grille/corner/noise finish over other layers; the power-on and tracking bursts double as a tape transition.',
  durationInFrames: 150,
  defaultProps: {
    src: '',
    title: 'NIGHT SHIFT',
    subtitle: 'Last train leaves at midnight.',
    scan: 0.18,
    grille: 0.06,
    bleed: 7,
    rshift: 2,
    glow: 0.35,
    corner: 0.28,
    noise: 0.018,
    powerOn: [0, 20],
    tracking: [[70, 82], [118, 123]],
    overlay: false,
    seed: 3,
    background: '#0b0814',
  },
  propDocs: {
    src: 'optional image path (public/) to put through the tape pass instead of the demo scene',
    title: 'big demo-scene title (ignored with src)',
    subtitle: 'cream-yellow subtitle composited inside the pass (empty = none)',
    scan: 'scanline darkness 0..1 (3 px period)',
    grille: 'RGB phosphor grille strength 0..1',
    bleed: 'chroma horizontal smear width in px (at 1080)',
    rshift: 'red-chroma shift to the right in px',
    glow: 'phosphor glow amount 0..1',
    corner: 'corner darkening 0..1',
    noise: 'per-frame noise amount',
    powerOn: '[startFrame, endFrame] of the CRT power-on opening (equal = off)',
    tracking: 'list of [startFrame, endFrame] tracking-noise bursts',
    overlay: 'true = transparent finish only (grille, scanlines, corners, noise, bursts) to layer over other motions',
    seed: 'seed for the demo scene and tear offsets',
    background: 'scene background colour',
  },
  component: VhsCrtPass,
  tags: ['vhs', 'crt', 'tape', 'retro', '80s', 'scanlines', 'chroma', 'glow', 'power-on', 'tracking', 'glitch', 'post', 'overlay', 'synthwave', 'found-footage'],
});
