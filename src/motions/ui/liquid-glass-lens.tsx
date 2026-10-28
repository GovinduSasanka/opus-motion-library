// Adapted from mg-styles-15/demos/12-aurora-glass/shaders.js FS_LENS (heightAt, spectral loop) (MIT) — see THIRD_PARTY_NOTICES.md
// SVG route: feDisplacementMap driven by a precomputed normal/displacement-map PNG of the capsule, one displacement per
// colour channel (dispersion) + specular rim. Deterministic: the map is generated from pure maths, never drawn on a canvas.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {defineMotion} from '../../core/types';
import {clamp, ease, prog} from '../../core/ease';
import {Svg, useStage} from '../../core/stage';
import {fonts} from '../../core/fonts';
import {pngDataUri, smooth} from '../../core/r2-mg2a-kit';

type Props = {
  path: [number, number, number][];
  size: number;
  aspect: number;
  bezel: number;
  ior: number;
  dispersion: number;
  magnify: number;
  from: 'bead' | 'none';
  toRing: boolean;
  ringIndex: number;
  ringAt: number;
  wordmark: string;
  headline: string;
  subline: string;
  overlay: boolean;
  background: string;
  colors: string[];
};

/** displacement map for a capsule/rounded slab. R,G = sample offset (0.5 neutral), A = inside mask. Cached by aspect bucket. */
const MAPS = new Map<string, string>();
const lensMap = (aspectBucket: number, bezelFrac: number, ior: number, mag: number) => {
  const key = `${aspectBucket}|${bezelFrac}|${ior}|${mag}`;
  const hit = MAPS.get(key);
  if (hit) return hit;
  const MH = 64;
  const MW = Math.round(MH * aspectBucket);
  const px = new Uint8Array(MW * MH * 4);
  const hw = MW / 2;
  const hh = MH / 2;
  const rad = hh;
  const b = bezelFrac * hh;
  const K = 4;
  const edge = 0.35 + (ior - 1) * 3.2;
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      const dx = x + 0.5 - hw;
      const dy = y + 0.5 - hh;
      const qx = Math.abs(dx) - (hw - rad);
      const qy = Math.abs(dy) - (hh - rad);
      const sd = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad;
      const i = (y * MW + x) * 4;
      if (sd > 0.6) {
        px[i] = px[i + 1] = px[i + 2] = 128;
        px[i + 3] = 0;
        continue;
      }
      // inward direction = -grad(sd)
      let gx = Math.sign(dx) * Math.max(qx, 0);
      let gy = Math.sign(dy) * Math.max(qy, 0);
      const gl = Math.hypot(gx, gy);
      if (gl < 1e-6) {
        if (qx > qy) {
          gx = Math.sign(dx) || 1;
          gy = 0;
        } else {
          gx = 0;
          gy = Math.sign(dy) || 1;
        }
      } else {
        gx /= gl;
        gy /= gl;
      }
      const xn = clamp(-sd / b);
      const slope = Math.pow(1 - xn, K - 1) * Math.pow(Math.max(1e-4, 1 - Math.pow(1 - xn, K)), 1 / K - 1);
      const s = clamp(slope / 3.2);
      // interior magnification (sample pulled toward the centre), full strength away from the rim
      const mk = 1 - 1 / mag;
      const inner = smooth(xn * 1.4);
      let ox = -dx * mk * inner;
      let oy = -dy * mk * inner;
      // rim bending: sample from beyond the edge (outward = +grad(sd))
      ox += gx * edge * hh * 0.55 * s;
      oy += gy * edge * hh * 0.55 * s;
      const DM = hh * 1.0;
      px[i] = Math.round(clamp(0.5 + (ox / DM) * 0.5) * 255);
      px[i + 1] = Math.round(clamp(0.5 + (oy / DM) * 0.5) * 255);
      px[i + 2] = 128;
      px[i + 3] = Math.round(clamp(0.5 - sd) * 255);
    }
  }
  const uri = pngDataUri(MW, MH, px);
  MAPS.set(key, uri);
  return uri;
};

const LiquidGlassLens: React.FC<Props> = ({path, size, aspect, bezel, ior, dispersion, magnify, from, toRing, ringIndex, ringAt, wordmark, headline, subline, overlay, background, colors}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const fSans = fonts.sans;
  const fDisp = fonts.display;

  // ---------- layout of the demo page (fractions)
  const knob = {x: portrait ? 0.78 : 0.84, y: portrait ? 0.14 : 0.2};
  const left = w * (portrait ? 0.08 : 0.08);
  const hfs = portrait ? w * 0.1 : h * 0.105;
  const wmFs = Math.min(w * (portrait ? 0.19 : 0.13), h * 0.22);
  const wmAdv = wmFs * 0.86;
  const letters = wordmark.toUpperCase().split('');
  const oIdx = ringIndex >= 0 ? ringIndex : Math.max(0, letters.lastIndexOf('O'));
  const wmX = (i: number) => cx + (i - (letters.length - 1) / 2) * wmAdv;
  const wmY = cy + wmFs * 0.34;
  const ringR = wmFs * 0.36;
  const endP = toRing ? prog(frame, ringAt - 6, ringAt + 22, ease.inOut) : 0;

  // ---------- lens trajectory
  const keys = path.map(([fx, fy, f]) => ({x: fx * w, y: fy * h, f}));
  const pos = (fr: number) => {
    if (fr <= keys[0].f) return {x: keys[0].x, y: keys[0].y};
    for (let i = 1; i < keys.length; i++) {
      if (fr <= keys[i].f) {
        const t = ease.inOut(clamp((fr - keys[i - 1].f) / (keys[i].f - keys[i - 1].f)));
        return {x: keys[i - 1].x + (keys[i].x - keys[i - 1].x) * t, y: keys[i - 1].y + (keys[i].y - keys[i - 1].y) * t};
      }
    }
    const l = keys[keys.length - 1];
    return {x: l.x, y: l.y};
  };
  const p0 = pos(frame);
  const p1 = pos(frame - 1);
  const vx = p0.x - p1.x;
  const vy = p0.y - p1.y;
  const speed = Math.hypot(vx, vy) / u;

  // birth from the toggle knob (metaball bead)
  const born = from === 'bead' ? prog(frame, 6, 34, ease.back) : prog(frame, 0, 14, ease.out);
  const stretch = from === 'bead' ? 1 + 0.5 * Math.sin(Math.PI * clamp((frame - 6) / 28)) * (1 - born * 0.5) : 1;
  let hh = size * u * (from === 'bead' ? 0.28 + 0.72 * born : born);
  let asp = from === 'bead' ? 1 + (aspect - 1) * clamp((born - 0.15) / 0.85) : aspect;
  let lx = p0.x;
  let ly = p0.y;
  // knob start position glides out of the toggle
  if (from === 'bead') {
    lx = knob.x * w + (p0.x - knob.x * w) * ease.inOut(clamp((frame - 8) / 34));
    ly = knob.y * h + (p0.y - knob.y * h) * ease.inOut(clamp((frame - 8) / 34));
  }
  // squash & stretch with velocity
  asp = asp * (1 + clamp(Math.abs(vx) * 0.004, 0, 0.14)) * stretch;
  hh *= 1 - clamp(Math.abs(vx) * 0.002, 0, 0.06);
  // morph into the wordmark ring
  if (toRing) {
    const tx = wmX(oIdx);
    const ty = wmY - wmFs * 0.36;
    lx += (tx - lx) * endP;
    ly += (ty - ly) * endP;
    hh += (ringR - hh) * endP;
    asp += (1 - asp) * endP;
  }
  const hw = hh * asp;
  const lift = clamp(0.35 + speed * 0.04) * (1 - endP * 0.6);

  const aspBucket = clamp(Math.round(asp * 4) / 4, 1, 4);
  const mapUri = React.useMemo(() => lensMap(aspBucket, bezel, ior, magnify), [aspBucket, bezel, ior, magnify]);
  const scaleBase = 2 * hh;
  const sR = scaleBase * (1 + dispersion);
  const sG = scaleBase;
  const sB = scaleBase * (1 - dispersion);
  const fid = 'lgl-f';

  // ---------- page content (rendered twice: plain + refracted)
  const pageOp = 1 - endP * 0.94;
  const Scene = () => (
    <g>
      <rect width={w} height={h} fill={`url(#lgl-bg)`} />
      <circle cx={w * 0.2} cy={h * 0.78} r={Math.min(w, h) * 0.34} fill={colors[0]} opacity={0.5} filter="url(#lgl-soft)" />
      <circle cx={w * 0.82} cy={h * 0.3} r={Math.min(w, h) * 0.3} fill={colors[1]} opacity={0.45} filter="url(#lgl-soft)" />
      <circle cx={w * 0.55} cy={h * 0.95} r={Math.min(w, h) * 0.26} fill={colors[2]} opacity={0.4} filter="url(#lgl-soft)" />
      <g opacity={pageOp}>
        {/* nav */}
        <text x={left} y={h * 0.095} fontFamily={fDisp} fontSize={Math.min(h * 0.032, w * 0.05)} letterSpacing={2 * u} fill="#fff">
          {wordmark.toUpperCase()}
        </text>
        {!portrait &&
          ['Product', 'Pricing', 'Docs'].map((t, i) => (
            <text key={t} x={w * (0.55 + i * 0.09)} y={h * 0.095} fontFamily={fSans} fontWeight={600} fontSize={h * 0.022} fill="#fff" opacity={0.7}>
              {t}
            </text>
          ))}
        {/* toggle (the bead is born from its knob) */}
        <g transform={`translate(${knob.x * w} ${knob.y * h})`}>
          <rect x={-h * 0.05} y={-h * 0.022} width={h * 0.1} height={h * 0.044} rx={h * 0.022} fill={colors[1]} opacity={0.9} />
          <circle cx={h * 0.028} cy={0} r={h * 0.018} fill="#fff" opacity={from === 'bead' ? 1 - clamp((frame - 6) / 6) : 1} />
        </g>
        {/* headline */}
        <text x={left} y={h * (portrait ? 0.3 : 0.4)} fontFamily={fDisp} fontSize={hfs} fill="#fff">
          {headline.split('|')[0]}
        </text>
        <text x={left} y={h * (portrait ? 0.3 : 0.4) + hfs * 1.05} fontFamily={fDisp} fontSize={hfs} fill={colors[2]}>
          {headline.split('|')[1] ?? ''}
        </text>
        <text x={left} y={h * (portrait ? 0.3 : 0.4) + hfs * 1.05 + hfs * 0.62} fontFamily={fSans} fontWeight={600} fontSize={hfs * 0.26} fill="#fff" opacity={0.72}>
          {subline}
        </text>
        <g opacity={0.35} fill="#fff">
          {[0.62, 0.5, 0.56].map((k, i) => (
            <rect key={i} x={left} y={h * (portrait ? 0.3 : 0.4) + hfs * 1.05 + hfs * 0.95 + i * hfs * 0.2} width={w * k * (portrait ? 1 : 0.5)} height={hfs * 0.07} rx={hfs * 0.035} />
          ))}
        </g>
        {/* cards */}
        {[0, 1, 2].map((i) => {
          const gap = w * 0.02;
          const cw = (w * 0.84 - gap * 2) / 3;
          const ch = h * (portrait ? 0.16 : 0.22);
          const x = w * 0.08 + i * (cw + gap);
          const y = h * (portrait ? 0.76 : 0.7);
          return (
            <g key={i}>
              <rect x={x} y={y} width={cw} height={ch} rx={22 * u} fill="#fff" opacity={0.1} stroke="#fff" strokeOpacity={0.25} />
              <rect x={x + cw * 0.08} y={y + ch * 0.12} width={cw * 0.3} height={ch * 0.22} rx={10 * u} fill={colors[i % colors.length]} />
              {[0.45, 0.7, 0.55, 0.85, 0.6].map((v, j) => (
                <rect key={j} x={x + cw * (0.1 + j * 0.16)} y={y + ch * (0.9 - 0.45 * v)} width={cw * 0.1} height={ch * 0.45 * v} rx={4 * u} fill="#fff" opacity={0.7} />
              ))}
              <rect x={x + cw * 0.08} y={y + ch * 0.42} width={cw * 0.5} height={ch * 0.06} rx={ch * 0.03} fill="#fff" opacity={0.55} />
            </g>
          );
        })}
      </g>
      {/* wordmark end card */}
      {toRing && endP > 0 && (
        <g opacity={endP}>
          {letters.map((c, i) => (i === oIdx ? null : (
            <text key={i} x={wmX(i)} y={wmY} textAnchor="middle" fontFamily={fDisp} fontSize={wmFs} fill="#fff">
              {c}
            </text>
          )))}
        </g>
      )}
    </g>
  );

  const rimId = 'lgl-rim';
  const showLens = born > 0.01;
  const shOff = 8 * u + 22 * u * lift;
  const shBlur = 8 * u + 30 * u * lift;
  const Capsule = (props: React.SVGProps<SVGRectElement>) => <rect x={lx - hw} y={ly - hh} width={hw * 2} height={hh * 2} rx={hh} {...props} />;

  return (
    <AbsoluteFill style={{background: overlay ? 'transparent' : background}}>
      <Svg>
        <defs>
          <linearGradient id="lgl-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#120a3a" />
            <stop offset="55%" stopColor="#0b0824" />
            <stop offset="100%" stopColor="#190b3f" />
          </linearGradient>
          <filter id="lgl-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={60 * u} />
          </filter>
          <filter id="lgl-shadow" x="-30%" y="-40%" width="160%" height="200%">
            <feGaussianBlur stdDeviation={shBlur} />
          </filter>
          <linearGradient id={rimId} gradientUnits="userSpaceOnUse" x1={lx - hw} y1={ly - hh} x2={lx + hw} y2={ly + hh}>
            <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#fff" stopOpacity="0.12" />
            <stop offset="70%" stopColor="#fff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.7" />
          </linearGradient>
          <radialGradient id="lgl-caustic" cx="50%" cy="100%" r="70%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <clipPath id="lgl-clip">
            <rect x={lx - hw} y={ly - hh} width={hw * 2} height={hh * 2} rx={hh} />
          </clipPath>
          <filter id={fid} filterUnits="userSpaceOnUse" x={0} y={0} width={w} height={h} colorInterpolationFilters="sRGB">
            <feFlood floodColor="rgb(128,128,128)" floodOpacity="1" result="neutral" />
            <feImage href={mapUri} x={lx - hw} y={ly - hh} width={hw * 2} height={hh * 2} preserveAspectRatio="none" result="mapimg" />
            <feMerge result="map">
              <feMergeNode in="neutral" />
              <feMergeNode in="mapimg" />
            </feMerge>
            <feDisplacementMap in="SourceGraphic" in2="map" scale={sR} xChannelSelector="R" yChannelSelector="G" result="dR" />
            <feColorMatrix in="dR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1" result="cR" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={sG} xChannelSelector="R" yChannelSelector="G" result="dG" />
            <feColorMatrix in="dG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 0 1" result="cG" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={sB} xChannelSelector="R" yChannelSelector="G" result="dB" />
            <feColorMatrix in="dB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 0 1" result="cB" />
            <feBlend in="cR" in2="cG" mode="screen" result="rg" />
            <feBlend in="rg" in2="cB" mode="screen" result="rgb" />
            <feComposite in="rgb" in2="mapimg" operator="in" />
          </filter>
        </defs>

        {!overlay && <Scene />}
        {showLens && (
          <g>
            {/* soft shadow on the page */}
            <rect x={lx - hw} y={ly - hh + shOff} width={hw * 2} height={hh * 2} rx={hh} fill="#000" opacity={0.38} filter="url(#lgl-shadow)" />
            {/* refracted copy of the page, clipped to the capsule by the filter's alpha */}
            {!overlay && (
              <g filter={`url(#${fid})`}>
                <Scene />
              </g>
            )}
            {/* tint + caustic + rim */}
            <g clipPath="url(#lgl-clip)">
              <Capsule fill="#fff" opacity={0.045} />
              <Capsule fill="url(#lgl-caustic)" />
            </g>
            <Capsule fill="none" stroke="#fff" strokeOpacity={0.14} strokeWidth={8 * u} style={{filter: `blur(${5 * u}px)`}} />
            <Capsule fill="none" stroke={`url(#${rimId})`} strokeWidth={2.4 * u} />
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const liquidGlassLens = defineMotion<Props>({
  id: 'liquid-glass-lens',
  title: 'Liquid glass lens',
  category: 'ui',
  description: 'A capsule of clear thick glass (iOS-26 "Liquid Glass") is born from a UI toggle knob, glides over a product page magnifying it, bends the picture at its rounded bezel, splits colours into thin rainbow fringes, casts a soft shadow with a caustic glow, and ends as the "O" ring of a wordmark.',
  source: ['mg-styles-15 demos/12-aurora-glass/shaders.js FS_LENS (MIT)'],
  useFor: 'The hero wow for product launches, a lens gliding over any screenshot or website hero, and a logo end card where the lens becomes a letter.',
  durationInFrames: 200,
  defaultProps: {
    path: [[0.84, 0.2, 10], [0.5, 0.4, 56], [0.26, 0.58, 84], [0.64, 0.78, 114]],
    size: 100,
    aspect: 2.3,
    bezel: 0.85,
    ior: 1.35,
    dispersion: 0.07,
    magnify: 1.28,
    from: 'bead',
    toRing: true,
    ringIndex: -1,
    ringAt: 134,
    wordmark: 'Studio',
    headline: 'Make it|crystal clear.',
    subline: 'Interfaces made of light.',
    overlay: false,
    background: '#0b0824',
    colors: ['#7c3aed', '#06b6d4', '#f472b6'],
  },
  propDocs: {
    path: 'lens keys [x, y, frame] with x,y as 0-1 fractions of the frame; eased between keys',
    size: 'lens half-height in px at 1080',
    aspect: 'capsule length / height (1 = circle)',
    bezel: 'bezel width as a fraction of the half-height (0.3-1)',
    ior: 'index of refraction: strength of the rim bending (1.2-1.6)',
    dispersion: 'rainbow fringing amount (0 = none, 0.07 default)',
    magnify: 'interior magnification (1.15-1.3)',
    from: "'bead' = grows out of the toggle knob | 'none'",
    toRing: 'end as the O ring of the wordmark',
    ringIndex: 'wordmark letter index that becomes the ring (-1 = last O)',
    ringAt: 'frame the lens heads for the wordmark',
    wordmark: 'end-card wordmark (also the nav logo)',
    headline: 'two headline lines separated by |',
    subline: 'sentence under the headline',
    overlay: 'draw only the lens chrome (shadow + rim) with a transparent background, no refracted copy',
    background: 'backdrop colour',
    colors: 'three accent colours for the page glows and cards',
  },
  component: LiquidGlassLens,
  tags: ['liquid glass', 'glass', 'lens', 'refraction', 'dispersion', 'magnify', 'ios', 'apple', 'capsule', 'ui', 'product launch', 'logo reveal', 'wordmark', 'bead', 'metaball', 'hero', 'displacement'],
});
