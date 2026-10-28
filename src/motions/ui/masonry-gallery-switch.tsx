import React from 'react';
import {AbsoluteFill, Img, spring, staticFile, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {hexA, mixHex, useUid} from '../../core/r2-pr4-kit';
import {rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Masonry gallery switch: pastel aurora background; a ring of cards turns in a single carousel, then the view toggle
 * flips from "Ring" to "Gallery" and every card springs (staggered) from its ring position into a masonry grid with
 * a "Gallery" header. Card art is procedural (or an image via `src`); titles are generic samples.
 */
type Item = {title: string; tag?: string; meta?: string; color?: string; ratio?: number; src?: string};
type Props = {
  title: string;
  subtitle: string;
  ringTitle: string;
  ringLabel: string;
  gridLabel: string;
  items: Item[];
  background: string;
  palette: string[];
  inkColor: string;
  accent: string;
  switchFrame: number;
  spin: number;
  seed: number;
};

const ITEMS: Item[] = [
  {title: 'Aurora study', tag: 'MOTION', meta: '12.7k', color: '#7c8cff', ratio: 0.8},
  {title: 'Glass dashboard', tag: 'UI', meta: '9.3k', color: '#ff8fc2', ratio: 1.0},
  {title: 'Orbit loader', tag: '3D', meta: '21k', color: '#5fd3b0', ratio: 1.3},
  {title: 'Soft gradients', tag: 'COLOUR', meta: '4.1k', color: '#ffb86b', ratio: 0.9},
  {title: 'Paper fold', tag: 'MOTION', meta: '7.8k', color: '#b08cff', ratio: 1.15},
  {title: 'Night market', tag: 'ILLUSTRATION', meta: '15k', color: '#6cc7ff', ratio: 0.75},
  {title: 'Pixel garden', tag: 'GAME', meta: '3.2k', color: '#8fdc7a', ratio: 1.2},
  {title: 'Wave studio', tag: 'AUDIO', meta: '6.6k', color: '#ff8c8c', ratio: 0.95},
  {title: 'Type specimen', tag: 'TYPE', meta: '11k', color: '#9aa6ff', ratio: 1.25},
  {title: 'Cloud icons', tag: 'ICONS', meta: '5.5k', color: '#6fd6d6', ratio: 0.85},
  {title: 'Pocket synth', tag: 'AUDIO', meta: '8.9k', color: '#f59ad0', ratio: 1.1},
  {title: 'Slow motion', tag: 'VIDEO', meta: '18k', color: '#ffc76b', ratio: 0.8},
];

const MasonryGallerySwitch: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, portrait, fps} = useStage();
  const uid = useUid('mgs');
  const items = p.items.length ? p.items : ITEMS;
  const N = items.length;
  const ink = p.inkColor;
  const tall = w < h * 1.3;
  const T = p.switchFrame;

  const g = React.useMemo(() => {
    const r = rng(p.seed + 5);
    return items.map(() => ({tilt: (r() - 0.5) * 2, ph: r() * 6.28, blob: [r(), r(), r(), r()]}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N, p.seed]);

  // ---- ring layout ----
  const cwR = tall ? w * 0.26 : Math.min(w * 0.17, h * 0.27);
  const RxR = tall ? w * 0.37 : w * 0.32;
  const cyR = h * (tall ? 0.52 : 0.54);
  const ang = p.spin * prog(frame, 0, T + 4, ease.out);

  // ---- masonry layout ----
  const cols = portrait ? 2 : tall ? 3 : 4;
  const gap = 22 * u;
  const mx = w * (portrait ? 0.06 : 0.06);
  const areaW = w - mx * 2;
  const cwG = (areaW - gap * (cols - 1)) / cols;
  const gy0 = h * (portrait ? 0.22 : tall ? 0.25 : 0.27);
  const heights = new Array(cols).fill(0);
  const cap = (W: number) => Math.min(64 * u, W * 0.22);
  const slots = items.map((it, i) => {
    let c = 0;
    for (let k = 1; k < cols; k++) if (heights[k] < heights[c] - 1) c = k;
    const ratio = it.ratio ?? 1;
    const artH = cwG * ratio * (portrait ? 0.9 : 0.78);
    const H = artH + cap(cwG);
    const s = {x: mx + c * (cwG + gap) + cwG / 2, y: gy0 + heights[c] + H / 2, W: cwG, H};
    heights[c] += H + gap;
    return s;
  });
  const scroll = prog(frame, T + 55, T + 150, ease.inOut) * Math.min(h * 0.16, 170 * u);

  const palette = p.palette.length ? p.palette : ['#c9d4ff'];
  const aurora = [
    {x: 0.18, y: 0.25, r: 0.5, c: palette[0 % palette.length], s: 0.011},
    {x: 0.82, y: 0.2, r: 0.46, c: palette[1 % palette.length], s: 0.014},
    {x: 0.55, y: 0.85, r: 0.5, c: palette[2 % palette.length], s: 0.01},
    {x: 0.1, y: 0.9, r: 0.4, c: palette[3 % palette.length], s: 0.013},
    {x: 0.9, y: 0.75, r: 0.42, c: palette[4 % palette.length], s: 0.012},
  ];

  const drawCard = (i: number, W: number, H: number, k: number) => {
    const it = items[i];
    const col = it.color ?? palette[i % palette.length];
    const c = cap(W);
    const artH = H - c;
    const rr = Math.min(22 * u, W * 0.08);
    const b = g[i].blob;
    const fs = clamp(W * 0.075, 14 * u, 26 * u);
    return (
      <g>
        <defs>
          <clipPath id={`${uid}c${i}`}>
            <rect x={-W / 2} y={-H / 2} width={W} height={artH} rx={rr} />
          </clipPath>
          <clipPath id={`${uid}f${i}`}>
            <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={rr} />
          </clipPath>
          <linearGradient id={`${uid}g${i}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={mixHex(col, '#ffffff', 0.45)} />
            <stop offset="1" stopColor={col} />
          </linearGradient>
        </defs>
        <rect x={-W / 2 + 4 * u} y={-H / 2 + 14 * u} width={W} height={H} rx={rr + 4 * u} fill="#5a4a9a" opacity={0.12} />
        <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={rr} fill="#ffffff" opacity={0.96} />
        <g clipPath={`url(#${uid}f${i})`}>
        <g clipPath={`url(#${uid}c${i})`}>
          <rect x={-W / 2} y={-H / 2} width={W} height={artH} fill={`url(#${uid}g${i})`} />
          {it.src ? (
            <foreignObject x={-W / 2} y={-H / 2} width={W} height={artH}>
              <Img src={it.src.startsWith('http') ? it.src : staticFile(it.src)} style={{width: W, height: artH, objectFit: 'cover'}} />
            </foreignObject>
          ) : (
            <>
              <circle cx={-W / 2 + W * (0.25 + b[0] * 0.5)} cy={-H / 2 + artH * (0.3 + b[1] * 0.3)} r={W * (0.22 + b[2] * 0.12)} fill="#ffffff" opacity={0.35} />
              <circle cx={-W / 2 + W * (0.55 + b[3] * 0.3)} cy={-H / 2 + artH * (0.55 + b[0] * 0.3)} r={W * (0.14 + b[1] * 0.1)} fill={mixHex(col, '#2a2560', 0.45)} opacity={0.4} />
              <rect x={-W * 0.3} y={-H / 2 + artH * 0.62} width={W * 0.6} height={artH * 0.1} rx={artH * 0.05} fill="#ffffff" opacity={0.55} />
            </>
          )}
        </g>
        <text x={-W / 2 + W * 0.06} y={H / 2 - c * 0.52} fontFamily={fonts.grotesk} fontWeight={700} fontSize={fs} fill="#1f1a3d">
          {it.title}
        </text>
        <text x={-W / 2 + W * 0.06} y={H / 2 - c * 0.16} fontFamily={fonts.mono} fontSize={fs * 0.62} fill="#8a84b0" letterSpacing={fs * 0.04}>
          {`${(it.tag ?? '').toUpperCase()}${it.meta ? '  ·  ' + it.meta : ''}`}
        </text>
        </g>
      </g>
    );
  };

  // ---- per-card state ----
  const cards = items.map((it, i) => {
    const a = (i / N) * Math.PI * 2 + ang;
    const z = Math.cos(a); // 1 = front
    const sc = 0.5 + 0.5 * (z + 1) * 0.5 + 0.0; // 0.5..1
    const sx = 0.22 + 0.78 * Math.abs(Math.sin(a + Math.PI / 2));
    const rW = cwR * sc;
    const ratio = it.ratio ?? 1;
    const rH = (cwR * ratio * 0.8 + cap(cwR)) * sc;
    const ringPos = {x: cx + Math.sin(a) * RxR, y: cyR + z * 24 * u - (z + 1) * 4 * u, W: rW * sx, H: rH, op: 0.62 + 0.38 * (z + 1) * 0.5, z};
    const intro = prog(frame, 2 + i * 2, 26 + i * 2, ease.out);
    const m = frame < T ? 0 : clamp(spring({frame: frame - T - i * 3, fps, config: {damping: 15, stiffness: 120, mass: 0.8}}), 0, 1.35);
    const s = slots[i];
    const gy = s.y - scroll;
    const x = lerp(ringPos.x, s.x, m);
    const y = lerp(ringPos.y, gy, m);
    const W = lerp(ringPos.W, s.W, m);
    const H = lerp(ringPos.H, s.H, m);
    const op = lerp(ringPos.op, 1, clamp(m)) * intro;
    const rot = g[i].tilt * 7 * Math.sin(clamp(m, 0, 1) * Math.PI);
    const key = lerp(z, 2 + i * 0.001, clamp(m * 2));
    return {i, x, y, W, H, op, rot, key, intro, m};
  });
  cards.sort((a, b) => a.key - b.key);

  const ringFade = 1 - prog(frame, T - 4, T + 26, ease.out);
  const gridIn = prog(frame, T + 14, T + 44, ease.out);
  const barY = h * (portrait ? 0.045 : 0.07);
  const tabW = 150 * u;
  const tabSwitch = prog(frame, T - 2, T + 16, ease.inOut);

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          {aurora.map((a, i) => (
            <radialGradient key={i} id={`${uid}a${i}`}>
              <stop offset="0" stopColor={a.c} stopOpacity="0.95" />
              <stop offset="1" stopColor={a.c} stopOpacity="0" />
            </radialGradient>
          ))}
          <linearGradient id={`${uid}fade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.background} stopOpacity="1" />
            <stop offset="0.72" stopColor={p.background} stopOpacity="0.96" />
            <stop offset="1" stopColor={p.background} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width={w} height={h} fill={p.background} />
        {aurora.map((a, i) => (
          <ellipse
            key={i}
            cx={w * (a.x + 0.05 * Math.sin(frame * a.s + i * 2))}
            cy={h * (a.y + 0.04 * Math.cos(frame * a.s * 1.3 + i))}
            rx={w * a.r * (tall ? 0.9 : 0.62)}
            ry={h * a.r * (tall ? 0.45 : 0.8)}
            fill={`url(#${uid}a${i})`}
            opacity={0.8}
          />
        ))}

        {/* big faint ring title */}
        {p.ringTitle && (
          <text x={cx} y={cyR + (tall ? 0.08 : 0.1) * h} textAnchor="middle" fontFamily={fonts.serif} fontSize={Math.min(w * 0.26, h * 0.3)} fill={mixHex(palette[1 % palette.length], '#ffffff', 0.25)} opacity={0.55 * ringFade * prog(frame, 0, 24)}>
            {p.ringTitle}
          </text>
        )}

        {/* cards */}
        {cards.map((c) => (
          <g key={c.i} transform={`translate(${c.x},${c.y}) rotate(${c.rot}) scale(1)`} opacity={c.op}>
            {drawCard(c.i, Math.max(2, c.W), c.H, c.m)}
          </g>
        ))}

        {/* header fade above the grid */}
        <rect x={0} y={0} width={w} height={barY + 70 * u} fill={`url(#${uid}fade)`} opacity={gridIn * 0.98} />
        <g opacity={gridIn * (1 - prog(scroll, 0, 90 * u))} transform={`translate(0,${(1 - gridIn) * 18 * u - scroll})`}>
          <text x={mx} y={gy0 - 66 * u - (portrait ? 0 : 0)} fontFamily={fonts.serif} fontWeight={700} fontSize={(portrait ? 92 : tall ? 88 : 84) * u} fill={ink}>
            {p.title}
          </text>
          <text x={mx} y={gy0 - 24 * u} fontFamily={fonts.mono} fontSize={20 * u} fill={hexA(ink, 0.55)}>
            {p.subtitle}
          </text>
        </g>

        {/* top bar */}
        <g opacity={prog(frame, 0, 16)}>
          <circle cx={mx + 14 * u} cy={barY} r={14 * u} fill={ink} />
          <circle cx={mx + 14 * u} cy={barY} r={5 * u} fill={p.background} />
          <rect x={cx - tabW} y={barY - 25 * u} width={tabW * 2} height={50 * u} rx={25 * u} fill="#ffffff" opacity={0.75} stroke={hexA(ink, 0.08)} strokeWidth={1.5 * u} />
          <rect x={cx - tabW + 5 * u + tabSwitch * (tabW - 5 * u)} y={barY - 20 * u} width={tabW - 10 * u} height={40 * u} rx={20 * u} fill={ink} />
          <text x={cx - tabW / 2} y={barY + 7 * u} textAnchor="middle" fontFamily={fonts.sans} fontWeight={600} fontSize={20 * u} fill={mixHex('#ffffff', ink, tabSwitch)}>
            {p.ringLabel}
          </text>
          <text x={cx + tabW / 2} y={barY + 7 * u} textAnchor="middle" fontFamily={fonts.sans} fontWeight={600} fontSize={20 * u} fill={mixHex(ink, '#ffffff', tabSwitch)}>
            {p.gridLabel}
          </text>
          <circle cx={w - mx - 14 * u} cy={barY} r={16 * u} fill={p.accent} opacity={0.9} />
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const masonryGallerySwitch = defineMotion<Props>({
  id: 'masonry-gallery-switch',
  title: 'Ring to masonry gallery switch',
  category: 'ui',
  description:
    'Pastel aurora backdrop: a carousel ring of cards turns, the Ring/Gallery toggle flips and every card springs (staggered) into a masonry grid under a large "Gallery" header.',
  source: ['analysis/sheets/r3/v5 (pastel gallery app, ring view to gallery grid)'],
  useFor: 'Showcase and portfolio reveals, app tours ("switch between views"), template or asset library intros, "browse everything" beats.',
  durationInFrames: 270,
  defaultProps: {
    title: 'Gallery',
    subtitle: '12 builds  ·  most trending first',
    ringTitle: 'Top 10',
    ringLabel: 'Ring',
    gridLabel: 'Gallery',
    items: ITEMS,
    background: '#f5f2fc',
    palette: ['#c9d4ff', '#ffc9e3', '#cdf3e3', '#ffe6c4', '#e0d2ff'],
    inkColor: '#1f1a3d',
    accent: '#8b7bff',
    switchFrame: 104,
    spin: 3.4,
    seed: 2,
  },
  propDocs: {
    title: 'grid-view header',
    subtitle: 'mono sub-line under the header',
    ringTitle: 'huge faint serif word behind the ring ("" for none)',
    ringLabel: 'first toggle label',
    gridLabel: 'second toggle label',
    items: 'cards [{title,tag?,meta?,color?,ratio? (height/width),src? (public/ image path or URL)}]',
    background: 'base page colour',
    palette: 'aurora blob colours (5 used)',
    inkColor: 'text / active toggle colour',
    accent: 'avatar dot colour',
    switchFrame: 'frame the view switch starts',
    spin: 'radians the ring turns before the switch',
    seed: 'art / tilt seed',
  },
  component: MasonryGallerySwitch,
  tags: ['gallery', 'masonry', 'grid', 'cards', 'carousel', 'ring', 'pastel', 'aurora', 'portfolio', 'showcase', 'app', 'ui', 'switch', 'toggle', 'spring', 'stagger'],
});
