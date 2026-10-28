import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {mixHex, withAlpha} from '../../core/r2-s1-kit';
import {useSafeId} from '../../core/image-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {bgCss, cycles, fract, isDark, loopPhase, surface} from '../../core/ui-loop-kit';

/**
 * Skeleton loading placeholders with a diagonal shimmer sweep: a `card` (image + title + text + button), a `list` of
 * avatar rows, a `profile` header with a stat row, or a `grid` of small cards. The shimmer is one gradient in screen space,
 * so every bone lights up in sync as it passes; it starts and ends fully off the screen, so the loop is seamless.
 */
type Layout = 'card' | 'list' | 'profile' | 'grid';
type Props = {
  layout: Layout;
  rows: number;
  sweeps: number;
  angle: number;
  showHeader: boolean;
  background: string;
  cardColor: string;
  boneColor: string;
  shimmerColor: string;
  accent: string;
};

type Bone = {x: number; y: number; w: number; h: number; r: number; accent?: boolean};

const SkeletonShimmer: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames, portrait} = useStage();
  const uid = useSafeId('ssh');
  const ph = loopPhase(frame, durationInFrames);
  const sweeps = cycles(P.sweeps);
  const dark = isDark(surface(P.background, '#ffffff'));
  const base = surface(P.background, dark ? '#0F1218' : '#F2F4F8');
  const card = P.cardColor === 'auto' ? (dark ? mixHex(base, '#ffffff', 0.06) : '#FFFFFF') : P.cardColor;
  const bone = P.boneColor === 'auto' ? (dark ? mixHex(card, '#ffffff', 0.1) : mixHex(card, '#1E2433', 0.13)) : P.boneColor;
  const shim = P.shimmerColor === 'auto' ? (dark ? '#ffffff' : '#ffffff') : P.shimmerColor;
  const shimA = dark ? 0.16 : 0.7;

  // ---- layout in px --------------------------------------------------------------------------------
  const S = (portrait ? 1.35 : 1.4) * u;
  const bones: Bone[] = [];
  const panels: {x: number; y: number; w: number; h: number; r: number}[] = [];
  const rows = Math.max(1, Math.min(8, Math.round(P.rows)));

  const headerH = P.showHeader ? 84 * S : 0;
  const top = headerH;
  if (P.showHeader) {
    bones.push({x: 48 * S, y: 26 * S, w: 40 * S, h: 40 * S, r: 20 * S});
    bones.push({x: 106 * S, y: 38 * S, w: 150 * S, h: 16 * S, r: 8 * S});
    const nb = 3;
    for (let i = 0; i < nb; i++) bones.push({x: w - 48 * S - (i + 1) * 90 * S, y: 38 * S, w: 66 * S, h: 16 * S, r: 8 * S});
  }
  const availH = h - top;

  if (P.layout === 'card') {
    const cw = Math.min(portrait ? w * 0.88 : 760 * S, w * 0.9);
    const imgH = Math.min(cw * 0.5, availH * 0.36);
    const lines = Math.max(2, rows);
    const ch = 36 * S + imgH + 28 * S + 34 * S + 18 * S + lines * 26 * S + 22 * S + 64 * S;
    const x0 = (w - cw) / 2;
    const y0 = top + Math.max(24 * S, (availH - ch) / 2);
    panels.push({x: x0, y: y0, w: cw, h: ch, r: 28 * S});
    let y = y0 + 28 * S;
    bones.push({x: x0 + 28 * S, y, w: cw - 56 * S, h: imgH, r: 18 * S});
    y += imgH + 28 * S;
    bones.push({x: x0 + 28 * S, y, w: cw * 0.55, h: 28 * S, r: 14 * S});
    y += 34 * S + 18 * S;
    for (let i = 0; i < lines; i++) {
      bones.push({x: x0 + 28 * S, y, w: (cw - 56 * S) * (i === lines - 1 ? 0.62 : 1 - (i % 2) * 0.08), h: 16 * S, r: 8 * S});
      y += 26 * S;
    }
    y += 22 * S;
    bones.push({x: x0 + 28 * S, y, w: 150 * S, h: 44 * S, r: 22 * S, accent: true});
    bones.push({x: x0 + 28 * S + 166 * S, y, w: 100 * S, h: 44 * S, r: 22 * S});
  } else if (P.layout === 'list') {
    const lw = Math.min(portrait ? w * 0.92 : 900 * S, w * 0.92);
    const n = Math.max(2, Math.min(rows + 2, portrait ? 7 : 5));
    const rh = Math.min(132 * S, (availH - 60 * S) / n);
    const ch = n * rh + 20 * S;
    const x0 = (w - lw) / 2;
    const y0 = top + Math.max(20 * S, (availH - ch) / 2);
    panels.push({x: x0, y: y0, w: lw, h: ch, r: 28 * S});
    for (let i = 0; i < n; i++) {
      const cy = y0 + 10 * S + rh * (i + 0.5);
      const av = rh * 0.56;
      bones.push({x: x0 + 32 * S, y: cy - av / 2, w: av, h: av, r: av / 2});
      const tx = x0 + 32 * S + av + 26 * S;
      const tw = lw - (tx - x0) - 40 * S - 70 * S;
      bones.push({x: tx, y: cy - 20 * S, w: tw * (0.62 + ((i * 37) % 30) / 100), h: 18 * S, r: 9 * S});
      bones.push({x: tx, y: cy + 8 * S, w: tw * (0.4 + ((i * 53) % 35) / 100), h: 14 * S, r: 7 * S});
      bones.push({x: x0 + lw - 32 * S - 54 * S, y: cy - 8 * S, w: 54 * S, h: 16 * S, r: 8 * S});
    }
  } else if (P.layout === 'profile') {
    const pw = Math.min(portrait ? w * 0.92 : 880 * S, w * 0.92);
    const av = 150 * S;
    const lines = Math.max(2, Math.min(rows, 5));
    const ch = 44 * S + av + 30 * S + 30 * S + 22 * S + lines * 26 * S + 30 * S + 100 * S + 40 * S;
    const x0 = (w - pw) / 2;
    const y0 = top + Math.max(20 * S, (availH - ch) / 2);
    panels.push({x: x0, y: y0, w: pw, h: ch, r: 30 * S});
    const cx0 = x0 + pw / 2;
    let y = y0 + 44 * S;
    bones.push({x: cx0 - av / 2, y, w: av, h: av, r: av / 2});
    y += av + 30 * S;
    bones.push({x: cx0 - 130 * S, y, w: 260 * S, h: 28 * S, r: 14 * S});
    y += 30 * S + 22 * S;
    for (let i = 0; i < lines; i++) {
      const lw = (pw - 120 * S) * (i === lines - 1 ? 0.5 : 1);
      bones.push({x: cx0 - lw / 2, y, w: lw, h: 16 * S, r: 8 * S});
      y += 26 * S;
    }
    y += 30 * S;
    const sw = (pw - 100 * S - 2 * 24 * S) / 3;
    for (let i = 0; i < 3; i++) {
      bones.push({x: x0 + 50 * S + i * (sw + 24 * S), y, w: sw, h: 100 * S, r: 20 * S});
    }
  } else {
    // grid of small cards
    const cols = portrait ? 2 : 3;
    const nRows = portrait ? Math.min(3, Math.max(2, Math.ceil(rows / 1.5))) : 2;
    const gw = Math.min(w * 0.92, portrait ? w * 0.92 : 1500 * S);
    const gap = 26 * S;
    const cw = (gw - gap * (cols - 1)) / cols;
    const imgH = cw * 0.58;
    const chh = 18 * S + imgH + 20 * S + 24 * S + 12 * S + 16 * S + 22 * S;
    const totalH = nRows * chh + (nRows - 1) * gap;
    const x0 = (w - gw) / 2;
    const y0 = top + Math.max(20 * S, (availH - totalH) / 2);
    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = x0 + c * (cw + gap);
        const y = y0 + r * (chh + gap);
        panels.push({x, y, w: cw, h: chh, r: 24 * S});
        bones.push({x: x + 18 * S, y: y + 18 * S, w: cw - 36 * S, h: imgH, r: 14 * S});
        bones.push({x: x + 18 * S, y: y + 18 * S + imgH + 20 * S, w: (cw - 36 * S) * 0.75, h: 20 * S, r: 10 * S});
        bones.push({x: x + 18 * S, y: y + 18 * S + imgH + 20 * S + 32 * S, w: (cw - 36 * S) * 0.5, h: 14 * S, r: 7 * S});
      }
    }
  }

  // ---- shimmer gradient: a band sweeping left -> right in screen space, rotated by `angle` ------------
  const band = Math.max(w, h) * 0.26;
  const ang = (P.angle * Math.PI) / 180;
  const reach = w + h * Math.abs(Math.tan(ang)) + band * 2;
  const pos = -band + reach * fract(ph * sweeps);
  const gid = `${uid}-g`;

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      <Svg>
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={pos - band / 2} y1={0} x2={pos + band / 2} y2={0} gradientTransform={`rotate(${P.angle} ${pos} ${h / 2})`}>
            <stop offset="0" stopColor={shim} stopOpacity={0} />
            <stop offset="0.5" stopColor={shim} stopOpacity={shimA} />
            <stop offset="1" stopColor={shim} stopOpacity={0} />
          </linearGradient>
        </defs>
        {P.showHeader && <rect x={0} y={0} width={w} height={headerH} fill={card} opacity={0.75} />}
        {panels.map((p, i) => (
          <rect key={`p${i}`} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r} fill={card} stroke={withAlpha(dark ? '#ffffff' : '#1E2433', dark ? 0.06 : 0.05)} strokeWidth={1.5 * u} />
        ))}
        {bones.map((b, i) => (
          <rect key={`b${i}`} x={b.x} y={b.y} width={b.w} height={b.h} rx={b.r} fill={b.accent ? mixHex(bone, P.accent, 0.35) : bone} />
        ))}
        {bones.map((b, i) => (
          <rect key={`s${i}`} x={b.x} y={b.y} width={b.w} height={b.h} rx={b.r} fill={`url(#${gid})`} />
        ))}
      </Svg>
    </AbsoluteFill>
  );
};

export const skeletonShimmer = defineMotion<Props>({
  id: 'skeleton-shimmer',
  title: 'Skeleton shimmer',
  category: 'ui',
  description: 'A card, list, profile or card-grid skeleton placeholder with a soft diagonal shimmer sweeping across every bone, in a seamless loop.',
  source: ['original'],
  useFor: 'Loading states for websites and apps — a "content is on its way" backdrop, product demos of fast-loading UI, or a loading overlay before real content fades in.',
  durationInFrames: 120,
  defaultProps: {
    layout: 'card',
    rows: 3,
    sweeps: 1,
    angle: 18,
    showHeader: true,
    background: '#EDF0F6',
    cardColor: 'auto',
    boneColor: 'auto',
    shimmerColor: 'auto',
    accent: '#4F6BFF',
  },
  propDocs: {
    layout: 'card | list | profile | grid',
    rows: 'how many text lines / list rows (2-8)',
    sweeps: 'shimmer passes per 4 s loop (integer)',
    angle: 'shimmer band tilt in degrees',
    showHeader: 'show a skeleton app header bar',
    background: 'page colour (dark colours switch to a dark skeleton), or "transparent"',
    cardColor: 'panel colour, or "auto"',
    boneColor: 'placeholder block colour, or "auto"',
    shimmerColor: 'shimmer highlight colour, or "auto"',
    accent: 'tint of the call-to-action bone',
  },
  component: SkeletonShimmer,
  tags: ['skeleton', 'shimmer', 'loading', 'placeholder', 'ui', 'website', 'app', 'loop', 'card', 'list', 'wireframe', 'content-loading'],
});
