// Adapted from mg-styles-15/demos/07-liquid/js/textsdf.js, shaders.js (SDF morph), scene.js, type.js (MIT, © mg-styles-15 authors) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {useSafeId} from '../../core/image-kit';
import {LiquidShade, hash, mixN, taper, textWidth} from '../../core/r2-mg2b-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Liquid logo reveal: a row of coloured beads gathers and fuses into a capsule, erupts into a crown of spikes while each
 * bead morphs into its letter of a glossy jelly wordmark (shape crossfade under the goo threshold), the letters joined by
 * thin liquid bridges that snap one after another; a glint sweeps across, a drip forms under one letter, falls and
 * ripples the floor, and the tagline fades in.
 */
type Props = {
  word: string;
  tagline: string;
  colors: string[];
  gatherAt: number;
  burstAt: number;
  snapAt: number;
  glintAt: number;
  drip: {letter: number; at: number};
  light: number;
  background: string;
};

const BlobToWordmark: React.FC<Props> = ({word, tagline, colors, gatherAt, burstAt, snapAt, glintAt, drip, light, background}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy} = useStage();
  const id = useSafeId('btw');
  const letters = [...word.toUpperCase()].filter((c) => c !== ' ');
  const n = Math.max(1, letters.length);
  const em = letters.map((c) => textWidth(c, 100, fonts.display) / 100 + 0.04);
  const emSum = em.reduce((a, b) => a + b, 0);
  const fs = Math.min((w * 0.86) / Math.max(1, emSum), h * 0.4, 400 * u);
  const pitch = (fs * emSum) / n;
  const mid = (n - 1) / 2;
  const base = cy + fs * 0.34; // text baseline
  const midY = cy - fs * 0.02;
  const floor = base + fs * 0.12;
  const col = (i: number) => colors[i % colors.length];
  const slotX = (i: number) => cx - (fs * emSum) / 2 + fs * (em.slice(0, i).reduce((a, b) => a + b, 0) + em[i] / 2);
  const rb = fs * 0.2;

  const g = ease.inOut(prog(frame, gatherAt, gatherAt + 16));
  const m = ease.inOut(prog(frame, burstAt, burstAt + 26));
  const spikeE = prog(frame, burstAt - 6, burstAt + 8, ease.out) * (1 - prog(frame, burstAt + 12, burstAt + 34, ease.in));
  const letterA = prog(frame, burstAt + 10, burstAt + 32, ease.out);

  const shapes: React.ReactNode[] = [];
  // beads -> capsule -> slot ellipses
  for (let i = 0; i < n; i++) {
    const pop = clamp((frame - i * 2) / 8);
    const popS = pop < 1 ? Math.sin(pop * Math.PI * 0.5) * (1 + 0.25 * Math.sin(pop * Math.PI)) : 1;
    const bob = Math.sin(frame * 0.12 + i) * 5 * u * (1 - g);
    const capX = cx + (i - mid) * rb * 1.15;
    const x = mixN(mixN(slotX(i), capX, g), slotX(i), m);
    const y = midY + bob;
    const rx = mixN(rb * 1.12, fs * em[i] * 0.4, m) * popS;
    const ry = mixN(rb * 1.12, fs * 0.36, m) * popS;
    const a = Math.pow(1 - m, 1.4);
    if (a > 0.02) shapes.push(<ellipse key={'b' + i} cx={x} cy={y} rx={rx * Math.max(0.2, a)} ry={ry * Math.max(0.2, a)} fill={col(i)} opacity={Math.min(1, a * 1.5)} />);
  }
  // crown of spikes
  if (spikeE > 0.01) {
    const ns = 11;
    for (let k = 0; k < ns; k++) {
      const s = (k / (ns - 1)) * 2 - 1;
      const len = (fs * 0.55 + hash(k * 3) * fs * 0.35) * spikeE;
      const ang = -Math.PI / 2 + s * 1.1;
      const bx = cx + s * (n * rb * 0.9);
      taper(bx, midY - rb * 0.3, bx + Math.cos(ang) * len, midY - rb * 0.3 + Math.sin(ang) * len, rb * 0.42, rb * 0.08, 6).forEach((c, q) =>
        shapes.push(<circle key={`s${k}_${q}`} cx={c.x} cy={c.y} r={Math.max(0.5, c.r)} fill={col(k)} />),
      );
    }
  }
  // letters
  const lsc = mixN(0.82, 1, letterA);
  if (letterA > 0.02) {
    letters.forEach((ch, i) => {
      shapes.push(
        <text
          key={'t' + i}
          x={slotX(i)}
          y={base}
          textAnchor="middle"
          fontFamily={fonts.display}
          fontSize={fs * lsc}
          fill={col(i)}
          stroke={col(i)}
          strokeWidth={fs * 0.01}
          opacity={Math.min(1, letterA * 1.2)}
          transform={`translate(0,${(1 - lsc) * -fs * 0.1})`}
        >
          {ch}
        </text>,
      );
    });
    // bridges snapping 2 frames apart
    for (let i = 0; i < n - 1; i++) {
      const t0 = snapAt + i * 2;
      const th = frame < t0 ? fs * 0.1 * (1 + 0.15 * Math.sin(frame * 0.4 + i)) * (1 - 0.3 * clamp((frame - t0 + 14) / 14)) : fs * 0.06 * clamp(1 - (frame - t0) / 3);
      if (th > 0.8) {
        const xa = slotX(i) + fs * em[i] * 0.2;
        const xb = slotX(i + 1) - fs * em[i + 1] * 0.2;
        const sag = frame < t0 ? 0 : (frame - t0) * 3 * u;
        shapes.push(<rect key={'br' + i} x={xa} y={midY - th / 2 + sag} width={xb - xa} height={th} rx={th / 2} fill={col(i)} opacity={letterA} />);
      }
    }
  }
  // drip under a letter
  const di = clamp(Math.round(drip.letter), 0, n - 1);
  const dt = frame - drip.at;
  const dx0 = slotX(di);
  let dripLandT = -1;
  if (dt >= 0 && letterA > 0.9) {
    const grow = clamp(dt / 20);
    const fallT = (dt - 20) / 30;
    const gDrop = 3600 * u;
    const y0 = base + fs * 0.02;
    const dropR = (10 + 8 * grow) * u;
    const dist = floor - y0 - dropR - 4 * u;
    const tFall = Math.sqrt((2 * dist) / gDrop);
    dripLandT = 20 + tFall * 30;
    if (fallT < 0) {
      const dy = y0 + dist * 0.28 * ease.out(grow);
      taper(dx0, y0 - 6 * u, dx0, dy, 11 * u, dropR, 6).forEach((c, q) => shapes.push(<circle key={'dr' + q} cx={c.x} cy={c.y} r={c.r} fill={col(di)} />));
    } else if (fallT < tFall) {
      const dy = y0 + dist * 0.28 + 0.5 * gDrop * fallT * fallT * (1 - 0.28 * 0) ;
      const stretch = 1 + 0.35 * clamp(fallT / tFall);
      shapes.push(<ellipse key="drf" cx={dx0} cy={Math.min(dy, floor - dropR)} rx={dropR / Math.sqrt(stretch)} ry={dropR * stretch} fill={col(di)} />);
      // neck remnant under the letter, recoiling
      taper(dx0, y0 - 6 * u, dx0, y0 + 20 * u * Math.max(0, 1 - fallT * 6), 9 * u, 2 * u, 4).forEach((c, q) => shapes.push(<circle key={'nk' + q} cx={c.x} cy={c.y} r={c.r} fill={col(di)} />));
    } else {
      const r = clamp((fallT - tFall) / 0.25);
      shapes.push(<ellipse key="drl" cx={dx0} cy={floor - 3 * u} rx={dropR * (1 + 0.8 * r)} ry={dropR * 0.35 * (1 - r) + 2 * u} fill={col(di)} opacity={1 - r} />);
    }
  }
  // glint band (alpha mask of the shaded shape)
  const gT = prog(frame, glintAt, glintAt + 12, ease.inOut);
  const glintOn = gT > 0 && gT < 1;
  const gx = mixN(cx - w * 0.5, cx + w * 0.5, gT);
  // ripples
  const rip = dripLandT >= 0 ? (dt - dripLandT) / 30 : -1;
  const tagA = prog(frame, drip.at + 6, drip.at + 22);

  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <defs>
          <radialGradient id={id + 'bg'} cx="50%" cy="42%" r="80%">
            <stop offset="0" stopColor="#1f4a66" />
            <stop offset="0.6" stopColor="#0f2438" />
            <stop offset="1" stopColor="#060e1c" />
          </radialGradient>
          <linearGradient id={id + 'fl'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a3d56" />
            <stop offset="1" stopColor="#060e1c" />
          </linearGradient>
          <linearGradient id={id + 'gl'} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.5" stopColor="#fff" stopOpacity={0.95} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          {glintOn && (
            <mask id={id + 'gm'} style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
              <g opacity={1}>
                <LiquidShade id={id + 'g2'} w={w} h={h} u={u} blur={7} gloss={0} rim={0} light={light}>
                  {shapes}
                </LiquidShade>
              </g>
            </mask>
          )}
        </defs>
        <rect width={w} height={h} fill={`url(#${id}bg)`} />
        <rect x={0} y={floor} width={w} height={h - floor} fill={`url(#${id}fl)`} />
        <rect x={0} y={floor} width={w} height={2 * u} fill="#8fd0ff" opacity={0.22} />
        {rip >= 0 &&
          [0, 0.12, 0.24].map((o, q) => {
            const r = rip - o;
            if (r < 0 || r > 0.9) return null;
            return <ellipse key={q} cx={dx0} cy={floor + 6 * u} rx={r * 260 * u} ry={r * 34 * u} fill="none" stroke="#bfe6ff" strokeWidth={2.5 * u} opacity={0.6 * (1 - r / 0.9)} />;
          })}
        <LiquidShade id={id} w={w} h={h} u={u} blur={7} gloss={1} rim={0.5} light={light}>
          {shapes}
        </LiquidShade>
        {glintOn && (
          <g mask={`url(#${id}gm)`}>
            <g transform={`translate(${gx},${cy}) skewX(-20)`}>
              <rect x={-fs * 0.1} y={-h} width={fs * 0.2} height={h * 2} fill={`url(#${id}gl)`} />
            </g>
          </g>
        )}
        {tagline && (
          <text x={cx} y={floor + fs * 0.32} textAnchor="middle" fontFamily={fonts.sans} fontWeight={600} fontSize={fs * 0.12} letterSpacing={fs * 0.03} fill="#d4ecff" opacity={tagA * 0.9}>
            {tagline.toUpperCase()}
          </text>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const blobToWordmark = defineMotion<Props>({
  id: 'blob-to-wordmark',
  title: 'Blob to wordmark',
  category: 'text',
  description:
    'A row of coloured beads gathers and fuses into a capsule, erupts into a crown of spikes and morphs into a glossy liquid wordmark; thin liquid bridges join the letters and snap one after another, a glint sweeps across, a drip forms under one letter, falls and ripples the floor, and a tagline fades in.',
  source: ['mg-styles-15 demos/07-liquid textsdf.js, shaders.js SDF morph, scene.js, type.js (MIT)', 'video 07-liquid 5.75-10 s'],
  useFor: 'Liquid logo reveals for beverages, cosmetics and apps named after liquids; end cards.',
  durationInFrames: 160,
  defaultProps: {
    word: 'JUICY',
    tagline: 'cold pressed daily',
    colors: ['#ff4d8d', '#ffb02e', '#2ee6c8', '#7a5cff', '#ff6a3d'],
    gatherAt: 16,
    burstAt: 46,
    snapAt: 74,
    glintAt: 100,
    drip: {letter: 2, at: 108},
    light: 225,
    background: '#060e1c',
  },
  propDocs: {
    word: 'the wordmark (4-7 letters work best; one bead per letter)',
    tagline: 'small line that fades in at the end (empty = none)',
    colors: 'per-letter colours, cycled',
    gatherAt: 'frame the beads start gathering into a capsule',
    burstAt: 'frame the capsule erupts and morphs into letters',
    snapAt: 'frame the first letter bridge snaps (one more every 2 frames)',
    glintAt: 'frame the glint sweep starts',
    drip: '{letter: index of the letter that drips, at: frame the drip starts forming}',
    light: 'key light azimuth in degrees',
    background: 'backdrop base colour',
  },
  component: BlobToWordmark,
  tags: ['liquid', 'logo', 'wordmark', 'blob', 'morph', 'goo', 'drip', 'bridge', 'glossy', 'jelly', 'reveal', 'beverage', 'cosmetics', 'end card', 'title', 'ripple', 'glint'],
});
