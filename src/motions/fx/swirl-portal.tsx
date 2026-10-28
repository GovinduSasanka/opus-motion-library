// Adapted from lemo-opuscar/styles/scifi-toon/demo/worlds.js + main.js (portal, popOpen) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {Pt, back, catmullClosed, fx, h1, lerp, mixHex, seg, useUid, vn} from '../../core/r2-lb2-kit';

/**
 * A vertical oval "hole in the world": a lumpy, thickly outlined goo rim, five spiral arms in two alternating tints
 * rotating inside it, a pale core with a white hotspot, sparks orbiting just outside, drips sliding off the bottom and
 * two flat translucent rings of glow. Pops open with a gentle overshoot and boils on threes. Overlay-capable:
 * `background: ''` leaves the frame transparent.
 */
type Props = {
  x: number;
  y: number;
  radius: number;
  openAt: number;
  open: number;
  spin: number;
  ovalX: number;
  colors: {rim: string; armA: string; armB: string; core: string; glow: string};
  sparks: number;
  drips: boolean;
  wash: number;
  boil: boolean;
  src: string;
  background: string;
  seed: number;
};

const FPS = 30;
const N_RIM = 22;
const N_ARM = 5;

const SwirlPortal: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const id = useUid('swp');
  // time on twos for the boil; arms spin on ones
  const tBoil = Math.floor(frame / 3) * 3 / FPS;
  const t = frame / FPS;
  const openRaw = p.open >= 0 ? p.open : 0;
  const op = p.openAt >= 0 ? back(seg(t, p.openAt / FPS, p.openAt / FPS + 0.32), 1.7) : openRaw;
  const R = p.radius * u * Math.max(0, op);
  const cx = p.x * w;
  const cy = p.y * h;
  const seedIdx = (Math.floor(frame / 2) % 3) + 1;
  const tb = p.boil ? tBoil : 0;

  // rim: 22-point lumpy circle, closed Catmull-Rom
  const rim: Pt[] = Array.from({length: N_RIM}, (_, i) => {
    const a = (i / N_RIM) * Math.PI * 2;
    const k = 1 + 0.09 * (2 * vn(1.7 * i + 3 * tb, p.seed) - 1) + 0.05 * Math.sin(5 * a + 6 * tb);
    return [Math.cos(a) * R * k, Math.sin(a) * R * k] as Pt;
  });
  const rimD = catmullClosed(rim);
  const spinT = t * p.spin;

  // spiral arms as ribbons
  const arm = (k: number) => {
    const base = (2 * Math.PI * k) / N_ARM;
    const out: Pt[] = [];
    const inn: Pt[] = [];
    for (let s = 0; s <= 22; s++) {
      const uu = s / 22; // 0 at rim, 1 at centre
      const r = R * 0.95 * (1 - uu);
      const ang = base + 3.6 * uu + 2.6 * spinT;
      const wd = 0.55 * (1 - 0.7 * uu);
      out.push([Math.cos(ang + wd / 2) * r, Math.sin(ang + wd / 2) * r]);
      inn.push([Math.cos(ang - wd / 2) * r, Math.sin(ang - wd / 2) * r]);
    }
    return `M${out.map(([a, b]) => `${fx(a)},${fx(b)}`).join(' L')} L${inn.reverse().map(([a, b]) => `${fx(a)},${fx(b)}`).join(' L')} Z`;
  };

  const sparks = Array.from({length: p.sparks}, (_, i) => {
    const ph = (0.8 * t + h1(i, p.seed)) % 1;
    const ang = (i / p.sparks) * Math.PI * 2 + 1.3 * t * p.spin * (i % 2 ? 1 : -0.6);
    const dist = R * (1.05 + 0.25 * ph);
    const r = (5 + h1(i + 7, p.seed) * 4) * u * Math.min(1, op) * (1 - 0.5 * ph);
    return {x: Math.cos(ang) * dist, y: Math.sin(ang) * dist, r, white: i % 3 === 0};
  });
  const drips = [0, 1, 2].map((i) => {
    const ph = (0.9 * t + i / 3) % 1;
    const len = (20 + h1(i, p.seed + 2) * 50) * u;
    const x0 = (i - 1) * R * 0.42;
    const y0 = Math.sqrt(Math.max(0, 1 - (x0 / R) * (x0 / R))) * R * 0.98;
    return {x: x0, y: y0 + ph * 90 * u, len: len * Math.sin(Math.PI * Math.min(1, ph * 1.05)), ph};
  });
  const dripOn = p.drips && op > 0.6;
  const cid = `${id}rim`;
  const coreD = (r: number) => `M${fx(-r)},0 a${fx(r)},${fx(r)} 0 1 0 ${fx(2 * r)},0 a${fx(r)},${fx(r)} 0 1 0 ${fx(-2 * r)},0 Z`;
  const washOp = p.wash * Math.min(1, op);

  return (
    <AbsoluteFill style={{background: p.background || 'transparent'}}>
      <Svg>
        <defs>
          <filter id={`${id}boil`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency={`${0.02 / u}`} numOctaves={2} seed={seedIdx + p.seed} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={p.boil ? 7 * u : 0} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <clipPath id={cid}>
            <path d={rimD} />
          </clipPath>
          <radialGradient id={`${id}hot`}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor={p.colors.core} />
          </radialGradient>
        </defs>
        {washOp > 0 && <rect width={w} height={h} fill={p.colors.glow} opacity={washOp} />}
        {op > 0.001 && (
          <g transform={`translate(${fx(cx)},${fx(cy)})`} filter={`url(#${id}boil)`}>
            <g transform={`scale(${p.ovalX},1)`}>
              {/* two flat translucent glow rings */}
              <ellipse rx={R * 1.55} ry={R * 1.45} fill={p.colors.glow} opacity={0.14} />
              <ellipse rx={R * 1.28} ry={R * 1.22} fill={p.colors.glow} opacity={0.18} />
              {/* goo rim */}
              <path d={rimD} fill={mixHex(p.colors.rim, p.colors.armA, 0.1)} stroke={p.colors.rim} strokeWidth={8 * u} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              <g clipPath={`url(#${cid})`}>
                <circle r={R * 0.9} fill={mixHex(p.colors.armA, p.colors.rim, 0.55)} />
                {p.src ? (
                  <g>
                    <image href={resolveSrc(p.src)} x={-R} y={-R} width={2 * R} height={2 * R} preserveAspectRatio="xMidYMid slice" transform={`scale(${1 / p.ovalX},1)`} />
                    <circle r={R * 0.9} fill="none" stroke={p.colors.glow} strokeOpacity={0.5} strokeWidth={R * 0.1} />
                  </g>
                ) : (
                  Array.from({length: N_ARM}, (_, k) => <path key={k} d={arm(k)} fill={k % 2 ? p.colors.armB : p.colors.armA} stroke={p.colors.rim} strokeWidth={2 * u} strokeOpacity={0.5} strokeLinejoin="round" />)
                )}
                {!p.src && (
                  <g>
                    <path d={coreD(R * 0.3)} fill={p.colors.core} />
                    <path d={coreD(R * 0.14)} fill={`url(#${id}hot)`} />
                  </g>
                )}
              </g>
              {/* re-ink the rim line over the arms */}
              <path d={rimD} fill="none" stroke={p.colors.rim} strokeWidth={8 * u} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {/* sparks */}
              {sparks.map((s, i) => (
                <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.white ? '#fff' : p.colors.core} stroke={p.colors.rim} strokeWidth={2 * u} />
              ))}
              {dripOn &&
                drips.map((d, i) => (
                  <path key={i} d={`M${fx(d.x - 7 * u)},${fx(d.y - d.len)} Q${fx(d.x)},${fx(d.y + 8 * u)} ${fx(d.x + 7 * u)},${fx(d.y - d.len)} Z`} fill={p.colors.armB} stroke={p.colors.rim} strokeWidth={3 * u} strokeLinejoin="round" opacity={Math.min(1, (op - 0.6) * 4)} />
                ))}
            </g>
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const swirlPortal = defineMotion<Props>({
  id: 'swirl-portal',
  title: 'Swirl portal (goo-rim toon hole)',
  category: 'fx',
  description:
    'A vertical oval hole in the world with a lumpy thickly outlined goo rim, five spiral arms in two alternating tints rotating inside, a pale hot core, orbiting sparks, drips off the bottom and flat rings of glow; pops open with an overshoot and boils on threes.',
  source: ['lemo-opuscar styles/scifi-toon demo/worlds.js (portal), demo/main.js (popOpen), DEMO.md "The portal" (MIT, LemoLab)'],
  useFor: 'A "jump" device: a product teleporting between use cases, a meanwhile-in-another-universe beat, a doorway reveal for a picture (src inside the core), a playful CTA hole. Pairs with portal-wipe. Overlay-capable.',
  durationInFrames: 120,
  defaultProps: {
    x: 0.5,
    y: 0.5,
    radius: 400,
    openAt: 5,
    open: 1,
    spin: 1,
    ovalX: 0.74,
    colors: {rim: '#241a46', armA: '#6f55f0', armB: '#ff6fae', core: '#ffe9f4', glow: '#b99cff'},
    sparks: 12,
    drips: true,
    wash: 0.12,
    boil: true,
    src: '',
    background: '#1f2547',
    seed: 4,
  },
  propDocs: {
    x: 'centre x (0..1 of frame width)',
    y: 'centre y (0..1 of frame height)',
    radius: 'radius in u (1u = 1px of a 1080 short side)',
    openAt: 'frame the pop-open starts (-1 = use `open` directly, 0..1, for a transition driver)',
    open: 'manual open amount 0..1+ when openAt = -1',
    spin: 'arm spin speed multiplier',
    ovalX: 'x-scale: 0.74 oval, 1.0 for a wipe',
    colors: '{rim, armA, armB, core, glow} (non-green by default)',
    sparks: 'orbiting spark count',
    drips: 'drips off the bottom once open',
    wash: 'full-frame flat tint alpha while open',
    boil: 'wobble the outline on threes',
    src: 'optional image shown through the hole instead of the arms',
    background: 'backdrop colour; empty string = transparent overlay',
    seed: 'rim lump seed',
  },
  component: SwirlPortal,
  tags: ['portal', 'swirl', 'toon', 'hole', 'wormhole', 'sci-fi', 'transition', 'jump', 'spiral', 'goo', 'boil', 'overlay', 'doorway', 'teleport'],
});
