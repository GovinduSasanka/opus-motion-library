// Adapted from lemo-opuscar/styles/archive-lighttable/demo/film.js band() / paper() / annot() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {useSafeId} from '../../core/image-kit';
import {DOC_DEFAULT, DocText, LightTable, docLayout, eo3, lf, seg, spanBox} from '../../core/r2-la1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A backlit document on a light table: the camera eases in, one line of type brightens left-to-right while
 * the rest of the page dims to ~62 %; an underline draws under it, the figure gets ringed and lifts into a
 * dark reading card with a label and source.
 */
type Props = {
  org: string;
  title: string;
  meta: string;
  lines: string[];
  keyLine: number;
  keyNumber: string;
  cardLabel: string;
  cardValue: string;
  cardSource: string;
  accent: string;
  sweepAt: number;
  zoom: number;
  table: string;
  desk: string;
};

const LineLightUp: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = useSafeId('lightline');
  const L = docLayout(p.lines);
  const kl = Math.min(L.lines.length - 1, Math.max(0, p.keyLine));
  const key = L.lines[kl];
  const nb = spanBox(key, p.keyNumber);
  // base page placement
  const pageH = portrait ? Math.min(h * 0.7, (w * 0.92 * L.H) / L.W) : h * 0.92;
  const k = pageH / L.H;
  const pageW = L.W * k;
  const px0 = (w - pageW) / 2;
  const py0 = (h - pageH) / 2;
  // camera push toward the key line (landscape: line sits left so the card fits right; portrait: card below)
  const S = p.sweepAt;
  const push = prog(frame, S - 28, S + 4, ease.inOut);
  const zoomFit = Math.min(p.zoom, (w * (portrait ? 0.9 : 0.55)) / (key.w * k));
  const Z = lerp(1, zoomFit, push) * lerp(1.03, 1, prog(frame, 0, 30, ease.out));
  const lineCx = px0 + (key.x + key.w / 2) * k;
  const lineCy = py0 + key.y * k;
  const tx = portrait ? w * 0.5 : w * 0.31;
  const ty = portrait ? h * 0.36 : h * 0.42;
  const camX = lerp(w / 2, lineCx, push);
  const camY = lerp(h / 2, lineCy, push);
  const sX = lerp(w / 2, tx, push);
  const sY = lerp(h / 2, ty, push);
  const toS = (x: number, y: number): [number, number] => [sX + (px0 + x * k - camX) * Z, sY + (py0 + y * k - camY) * Z];
  const pageT = `translate(${sX} ${sY}) scale(${Z}) translate(${-camX} ${-camY}) translate(${px0} ${py0}) scale(${k})`;

  // band sweep
  const band = eo3(seg(frame, S, S + 18));
  const dim = prog(frame, S - 4, S + 10, ease.out);
  const bx0 = key.x - 30;
  const bx1 = key.x + key.w + 40;
  const xs = lerp(bx0, bx1 + 40, band);
  const ul = eo3(seg(frame, S + 16, S + 30));
  const ring = eo3(seg(frame, S + 30, S + 44));
  const lift = ease.inOut(seg(frame, S + 48, S + 66));
  const cardIn = eo3(seg(frame, S + 52, S + 66));
  const typedSrc = Math.floor(Math.max(0, frame - (S + 68)) * 1.6);

  // card in screen space
  const cardW = portrait ? w * 0.8 : w * 0.33;
  const cardH = (portrait ? 330 : 300) * u;
  const cardX = portrait ? (w - cardW) / 2 : w * 0.62;
  const cardY = portrait ? h * 0.56 : h * 0.5 - cardH / 2;
  const ncx = (nb.x0 + nb.x1) / 2;
  const ncy = (nb.y0 + nb.y1) / 2;
  const [nsx, nsy] = toS(ncx, ncy);
  const valSize = (portrait ? 120 : 104) * u;
  const vx = cardX + 40 * u;
  const vy = cardY + 92 * u + valSize * 0.75;
  const fromSize = key.size * k * Z;
  const curSize = lerp(fromSize, valSize, lift);
  const curX = lerp(nsx - (nb.x1 - nb.x0) * k * Z * 0.5, vx, lift);
  const curY = lerp(nsy + fromSize * 0.33, vy, lift);
  const [rx, ry] = toS(nb.x1 + 22, ncy);

  return (
    <AbsoluteFill style={{background: p.desk}}>
      <Svg>
        <defs>
          <linearGradient id={`${id}-band`} gradientUnits="userSpaceOnUse" x1={bx0 - 30} y1={0} x2={xs} y2={0}>
            <stop offset="0" stopColor="#000" stopOpacity={0} />
            <stop offset={30 / Math.max(60, xs - bx0 + 30)} stopColor="#000" stopOpacity={1} />
            <stop offset={Math.max(0.5, 1 - 40 / Math.max(60, xs - bx0 + 30))} stopColor="#000" stopOpacity={1} />
            <stop offset="1" stopColor="#000" stopOpacity={0} />
          </linearGradient>
          <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={6000} height={6000}>
            <rect x={-2000} y={-2000} width={6000} height={6000} fill="#fff" />
            <rect x={bx0 - 30} y={key.y - 40} width={Math.max(0, xs - bx0 + 30)} height={58} fill={`url(#${id}-band)`} />
          </mask>
          <filter id={`${id}-ps`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={12} />
          </filter>
        </defs>
        <LightTable id={id} w={w} h={h} u={u} table={p.table} desk={p.desk} />
        <g transform={pageT}>
          <rect x={10} y={16} width={L.W} height={L.H} fill="#000" opacity={0.16} filter={`url(#${id}-ps)`} />
          <rect width={L.W} height={L.H + (portrait ? 1500 : 0)} fill="#fbfaf4" />
          <DocText L={L} org={p.org} title={p.title} meta={p.meta} />
          {/* rest of the page dims; the band stays lit */}
          <rect x={-20} y={-20} width={L.W + 40} height={L.H + 40 + (portrait ? 1500 : 0)} fill="#0e0f11" opacity={0.38 * dim} mask={`url(#${id}-m)`} />
          {/* lit ink: darker type on brighter paper inside the band */}

          <rect x={bx0} y={key.y - 34} width={Math.max(0, Math.min(xs, bx1) - bx0)} height={46} fill="#ffffff" opacity={0.55 * band} />
          <text x={key.x} y={key.y} fontFamily={lf.text} fontSize={key.size} fill="#050506" textLength={key.justify ? key.w : undefined} lengthAdjust="spacing" clipPath={undefined} opacity={band}>
            {key.text}
          </text>
          {ul > 0 && <rect x={key.x} y={key.y + 8} width={key.w * ul} height={3.5} fill={p.accent} />}
          {ring > 0 && (
            <ellipse cx={ncx} cy={ncy} rx={(nb.x1 - nb.x0) / 2 + 20} ry={28} fill="none" stroke={p.accent} strokeWidth={3.5} pathLength={1} strokeDasharray={`${ring} 2`} transform={`rotate(-4 ${ncx} ${ncy})`} />
          )}
        </g>
        {/* leader from the ring to the card */}
        {cardIn > 0 && (
          <path
            d={portrait ? `M${nsx} ${nsy + 30 * u} L${nsx} ${cardY - 10 * u}` : `M${rx} ${ry} L${cardX - 12 * u} ${ry}`}
            stroke={p.accent}
            strokeWidth={2.5 * u}
            pathLength={1}
            strokeDasharray={`${cardIn} 2`}
            fill="none"
          />
        )}
        {/* reading card */}
        {cardIn > 0 && (
          <g opacity={Math.min(1, cardIn * 1.5)}>
            <rect x={cardX} y={cardY} width={cardW * cardIn} height={cardH} rx={3 * u} fill="rgba(14,15,17,0.74)" />
            <rect x={cardX} y={cardY} width={5 * u} height={cardH} fill={p.accent} />
            <text x={cardX + 40 * u} y={cardY + 62 * u} fontFamily={lf.sans} fontWeight={600} fontSize={26 * u} letterSpacing={3 * u} fill="#cfd3d8">
              {p.cardLabel}
            </text>
            <text x={cardX + 40 * u} y={cardY + cardH - 40 * u} fontFamily={lf.plex} fontSize={21 * u} fill="#9aa0a6">
              {p.cardSource.slice(0, typedSrc)}
            </text>
          </g>
        )}
        {/* the figure lifting off the page into the card */}
        {lift > 0 && (
          <text x={curX} y={curY} fontFamily={lift > 0.5 ? lf.plex : lf.text} fontWeight={lift > 0.5 ? 500 : 400} fontSize={curSize} fill={lift > 0.4 ? '#ffffff' : '#050506'}>
            {lift > 0.5 ? p.cardValue : p.keyNumber}
          </text>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const lineLightUp = defineMotion<Props>({
  id: 'line-light-up',
  title: 'Line light-up (backlit document)',
  category: 'document',
  description:
    'A backlit document on a light table: the camera eases in, one line of type brightens left-to-right while the rest of the page dims, an underline draws under it, the figure is ringed in the signal colour and lifts into a dark reading card with label and source.',
  source: ['lemo-opuscar styles/archive-lighttable demo/film.js band(), paper(), annot() (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §1 line-light-up'],
  useFor: 'Quoting a source document on screen — contracts, receipts, patents, reports, clippings — for documentary, news and explainer videos.',
  durationInFrames: 150,
  defaultProps: {
    org: DOC_DEFAULT.org,
    title: DOC_DEFAULT.title,
    meta: DOC_DEFAULT.meta,
    lines: DOC_DEFAULT.lines,
    keyLine: DOC_DEFAULT.keyLine,
    keyNumber: DOC_DEFAULT.keyNumber,
    cardLabel: 'CLEAR SPAN REQUIRED',
    cardValue: '1,208 m',
    cardSource: 'Source: NH-2041, p. 3',
    accent: '#FF5A1F',
    sweepAt: 36,
    zoom: 1.75,
    table: '#F7F9FB',
    desk: '#0E0F11',
  },
  propDocs: {
    org: 'letterhead line',
    title: 'document title',
    meta: 'reference / date line',
    lines: 'body lines (one string per printed line)',
    keyLine: 'index of the line that lights up',
    keyNumber: 'the figure inside that line that is ringed and lifted',
    cardLabel: 'reading-card label (caps)',
    cardValue: 'value shown big on the card (the lifted figure lands here)',
    cardSource: 'source line typed on the card',
    accent: 'signal colour (underline, ring, leader, card edge)',
    sweepAt: 'frame the light band starts sweeping (camera push ends here)',
    zoom: 'camera zoom on the line',
    table: 'light-table colour',
    desk: 'desk colour',
  },
  component: LineLightUp,
  tags: ['document', 'highlight', 'quote', 'evidence', 'line', 'light up', 'underline', 'ring', 'callout', 'card', 'source', 'citation', 'report', 'contract', 'news', 'documentary', 'archive', 'light table'],
});
