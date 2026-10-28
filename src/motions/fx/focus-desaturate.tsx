// Adapted from lemo-opuscar/styles/iso-infographic/demo/engine.js (one-colour hook: mix toward luma + #E9DFCB) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {backOut, eio3, eo3, h1, ISO, IsoCtx, isoBox, isoP, isoPoly, IsoPolys, isoRoof, isoTree, lerp, lf, seg} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  at: number;
  dur: number;
  amount: number;
  tint: string;
  label: string;
  sublabel: string;
  src: string;
  keep: number[];
  subjectColor: string;
  background: string;
  seed: number;
};

const WALLS = ['#F3E9D6', '#E8D9BE', '#F2C6B4', '#B9D9CB', '#AFCBE6', '#F4DE93'];
const ROOFS = ['#4F7FB8', '#3F8F86', '#E0874F', '#6A5A8E', '#7BA75F'];

const FocusDesaturate: React.FC<Props> = ({at, dur, amount, tint, label, sublabel, src, keep, subjectColor, background, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const d = amount * eio3(seg(frame, at, at + dur));
  const push = lerp(1, 1.12, eio3(seg(frame, 0, at + dur + 40)));
  const labelK = backOut(seg(frame, at + dur * 0.6, at + dur * 0.6 + 10), 2);

  // ---------------- image mode: filtered copy + unfiltered keep circle
  if (src) {
    const [kx, ky, kr] = keep.length >= 3 ? keep : [0.5, 0.5, 0.18];
    const R = kr * Math.min(w, h);
    const cx = kx * w;
    const cy = ky * h;
    // saturate + tint toward cream
    const sat = 1 - d;
    return (
      <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <defs>
            <filter id="fd-desat" colorInterpolationFilters="sRGB">
              <feColorMatrix type="saturate" values={String(sat)} />
              <feComponentTransfer>
                <feFuncR type="linear" slope={1 - d * 0.35} intercept={d * 0.33} />
                <feFuncG type="linear" slope={1 - d * 0.35} intercept={d * 0.31} />
                <feFuncB type="linear" slope={1 - d * 0.35} intercept={d * 0.27} />
              </feComponentTransfer>
            </filter>
            <clipPath id="fd-keep">
              <circle cx={cx} cy={cy} r={R} />
            </clipPath>
          </defs>
          <g transform={`translate(${cx} ${cy}) scale(${push}) translate(${-cx} ${-cy})`}>
            <image href={resolveSrc(src)} width={w} height={h} preserveAspectRatio="xMidYMid slice" filter="url(#fd-desat)" />
            <image href={resolveSrc(src)} width={w} height={h} preserveAspectRatio="xMidYMid slice" clipPath="url(#fd-keep)" opacity={d > 0 ? 1 : 0} />
            <circle cx={cx} cy={cy} r={R} fill="none" stroke={ISO.ink} strokeWidth={3 * u} opacity={labelK} />
          </g>
        </svg>
        {label && (
          <div style={{position: 'absolute', left: cx + R * 0.8, top: cy - R - 60 * u, opacity: labelK, fontFamily: lf.jost, color: ISO.ink, background: ISO.boardTop, border: `${2 * u}px solid ${ISO.ink}`, borderRadius: 10 * u, padding: `${8 * u}px ${16 * u}px`}}>
            <div style={{fontWeight: 600, fontSize: 26 * u, letterSpacing: 3 * u}}>{label.toUpperCase()}</div>
            {sublabel && <div style={{fontWeight: 400, fontSize: 22 * u}}>{sublabel}</div>}
          </div>
        )}
      </AbsoluteFill>
    );
  }

  // ---------------- procedural iso town
  const G = 6;
  const cell = 16;
  const span = G * cell;
  const k = Math.min((w * (portrait ? 0.95 : 0.7)) / (span * 2 * 0.866), (h * (portrait ? 0.5 : 0.78)) / (span + 30)) * push;
  const ctx: IsoCtx = {k, cx: w / 2, cy: h * (portrait ? 0.5 : 0.52) - 20 * k, polys: [], desat: d};
  const off = -span / 2;
  // ground tiles + roads
  isoBox(ctx, off - 4, off - 4, -3, off + span + 4, off + span + 4, 0, '#EFE3CB', {bias: -900});
  for (let r = 0; r <= G; r += 3) {
    isoPoly(ctx, [[off + r * cell - 2, off - 4, 0.02], [off + r * cell + 2, off - 4, 0.02], [off + r * cell + 2, off + span + 4, 0.02], [off + r * cell - 2, off + span + 4, 0.02]], '#CFC4AE', {bias: -800});
    isoPoly(ctx, [[off - 4, off + r * cell - 2, 0.02], [off + span + 4, off + r * cell - 2, 0.02], [off + span + 4, off + r * cell + 2, 0.02], [off - 4, off + r * cell + 2, 0.02]], '#CFC4AE', {bias: -800});
  }
  const subj = {gx: 4, gy: 2};
  for (let gx = 0; gx < G; gx++)
    for (let gy = 0; gy < G; gy++) {
      if (gx % 3 === 0 && gy % 3 === 0) continue;
      const x = off + gx * cell + 3.5;
      const y = off + gy * cell + 3.5;
      const r = h1(gx * 7 + gy, seed);
      const isS = gx === subj.gx && gy === subj.gy;
      const lt = frame - (2 + (gx + gy) * 1.6);
      const rise = Math.max(0, (1 - eo3(lt / 10)) * 14);
      if (lt < 0) continue;
      if (!isS && r < 0.22) {
        isoTree(ctx, x + 4, y + 4, 3.2, {rise});
        isoTree(ctx, x + 9, y + 8, 2.6, {rise});
        continue;
      }
      const ht = isS ? 9 : 5 + Math.floor(r * 4) * 3;
      const wall = isS ? '#F6EFE0' : WALLS[Math.floor(r * 97) % WALLS.length];
      const roof = isS ? subjectColor : ROOFS[Math.floor(r * 53) % ROOFS.length];
      isoBox(ctx, x, y, 0, x + 9, y + 9, ht, wall, {rise, keep: isS});
      if (r > 0.5 || isS) isoRoof(ctx, x, y, ht, x + 9, y + 9, 4, roof, {rise, keep: isS});
      else isoBox(ctx, x + 1, y + 1, ht, x + 8, y + 8, ht + 0.8, roof, {rise, keep: isS});
      // windows
      for (let wz = 0; wz < Math.floor(ht / 3); wz++)
        isoPoly(ctx, [[x + 9.01, y + 2, 2.6 + wz * 3 + rise], [x + 9.01, y + 4, 2.6 + wz * 3 + rise], [x + 9.01, y + 4, 1.2 + wz * 3 + rise], [x + 9.01, y + 2, 1.2 + wz * 3 + rise]], isS ? '#F4DE93' : '#8FB4CF', {bias: 0.05, keep: isS});
    }
  // little cars on roads (keep colour only for the subject's delivery van)
  for (let c = 0; c < 4; c++) {
    const t = ((frame / 30) * 0.08 + c * 0.25) % 1;
    const along = off - 4 + t * (span + 8);
    const lane = off + (c % 2 ? 3 : 0) * cell + (c % 2 ? 1 : -1);
    const horiz = c < 2;
    const x0 = horiz ? along : lane - 1;
    const y0 = horiz ? lane - 1 : along;
    isoBox(ctx, x0, y0, 0, x0 + (horiz ? 4 : 2.2), y0 + (horiz ? 2.2 : 4), 2, ['#E0874F', '#4F7FB8', '#7BA75F', '#F4DE93'][c], {});
  }

  const [sx, sy] = isoP(ctx, off + subj.gx * cell + 8, off + subj.gy * cell + 8, 15);
  return (
    <AbsoluteFill style={{background: lerp(0, 1, d) > 0.5 ? background : background, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: tint, opacity: d * 0.35}} />
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <IsoPolys ctx={ctx} />
        {labelK > 0 && (
          <g transform={`translate(${sx} ${sy})`} opacity={Math.min(1, labelK)}>
            <circle r={(58 + 6 * Math.sin(frame / 8)) * u * Math.min(1, labelK)} fill="none" stroke={ISO.ink} strokeWidth={2.4 * u} strokeDasharray={`${8 * u} ${6 * u}`} />
            <line x1={0} y1={-60 * u} x2={0} y2={-120 * u * labelK} stroke={ISO.ink} strokeWidth={2 * u} />
            <circle cx={0} cy={0} r={5 * u} fill={ISO.ink} />
          </g>
        )}
      </svg>
      {labelK > 0 && label && (
        <div style={{position: 'absolute', left: sx, top: sy - 120 * u * Math.min(1, labelK), transform: `translate(-50%, -100%) scale(${labelK})`, transformOrigin: '50% 100%', textAlign: 'center', background: ISO.boardTop, border: `${2 * u}px solid ${ISO.ink}`, borderRadius: 10 * u, padding: `${10 * u}px ${18 * u}px`, whiteSpace: 'nowrap'}}>
          <div style={{fontFamily: lf.jost, fontWeight: 600, fontSize: 28 * u, letterSpacing: 3 * u, color: ISO.ink}}>{label.toUpperCase()}</div>
          {sublabel && <div style={{fontFamily: lf.jost, fontWeight: 400, fontSize: 24 * u, color: ISO.ink}}>{sublabel}</div>}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const focusDesaturate = defineMotion<Props>({
  id: 'focus-desaturate',
  title: 'Focus desaturate',
  category: 'fx',
  description:
    'At the key moment the whole scene greys toward warm cream (mix with luma and #E9DFCB) while one subject keeps full colour and gets a dashed ring and label. Default scene is a flat isometric town with one red-roofed house as the subject; with src it greys an image except a kept circle.',
  source: ['lemo-opuscar styles/iso-infographic (MIT, LemoLab) — engine.js colour pipeline (desat + keep flag)'],
  useFor: '"This one" moments — one user, one store, one product, one data point in a busy scene.',
  durationInFrames: 180,
  defaultProps: {
    at: 54,
    dur: 36,
    amount: 1,
    tint: ISO.desat,
    label: 'Corner bakery',
    sublabel: 'our first customer',
    src: '',
    keep: [0.5, 0.5, 0.18],
    subjectColor: '#CF5140',
    background: ISO.ground,
    seed: 4,
  },
  propDocs: {
    at: 'frame the desaturation starts',
    dur: 'frames to fully desaturate (30–60)',
    amount: '0..1 how grey the rest gets',
    tint: 'cream the rest greys toward',
    label: 'label on the kept subject',
    sublabel: 'second label line',
    src: 'optional image in public/ — greyed except the keep circle',
    keep: 'image mode: kept circle [x, y, r] as fractions (r of the short side)',
    subjectColor: 'procedural mode: the subject roof colour',
    background: 'ground colour',
    seed: 'town layout seed',
  },
  component: FocusDesaturate,
  tags: ['desaturate', 'focus', 'spotlight', 'highlight', 'one colour', 'color pop', 'isometric', 'town', 'subject', 'grey', 'emphasis', 'image', 'explainer'],
});
