// Adapted from lemo-opuscar/styles/dark-keynote/demo/engine.js snapGrid/assignSlots/flyPose/trail + world.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {KAppIcon, KEY, KFile, KPhoto, KeynoteStage, backOut, bRng, clamp01, eo, la2Fonts, lerpN, rgba, seg, smooth} from '../../core/r2-la2-kit';

/**
 * snap-grid-collapse — hundreds of scattered files, photos and app icons fly along curved, typed paths with coloured
 * trails into a perfect grid in one beat: each type to its own rows, same-type paths bending the same way, a
 * back(1.35) overshoot along the final tangent and a spring-settled rotation; the grid lines, container and a lime
 * light sweep appear only on landing.
 */
type Props = {
  beat: number;
  flight: number;
  rowsFiles: number;
  rowsPhotos: number;
  rowsApps: number;
  accent: string;
  caption: string;
  trail: boolean;
  seed: number;
};

type Kind = 'file' | 'photo' | 'app';
const KCOL: Record<Kind, string> = {file: '#8EA2C8', photo: '#E0A06A', app: '#8C7CF0'};
const EXTS: [string, string][] = [
  ['PDF', '#E0575B'],
  ['TXT', '#6E7890'],
  ['JPG', '#4C9BE8'],
  ['DOC', '#4C7BE8'],
  ['XLS', '#3FA66B'],
  ['KEY', '#5B7CFA'],
  ['ZIP', '#9A7B4F'],
];

const springRot = (t: number, k = 9, z = 0.42) => 1 - Math.exp(-z * k * t) * Math.cos(k * Math.sqrt(1 - z * z) * 1.6 * t);

const SnapGridCollapse: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const cols = portrait ? 8 : 16;
  const rowsK: [Kind, number][] = [
    ['file', p.rowsFiles],
    ['photo', p.rowsPhotos],
    ['app', p.rowsApps],
  ];
  const rows = rowsK.reduce((a, b) => a + b[1], 0);
  const gap = 10 * u;
  const tile = Math.min((w * 0.86 - gap * (cols - 1)) / cols, (h * (portrait ? 0.52 : 0.66) - gap * (rows - 1)) / rows);
  const gw = cols * tile + (cols - 1) * gap;
  const gh = rows * tile + (rows - 1) * gap;
  const x0 = (w - gw) / 2;
  const y0 = (h - gh) / 2 - (portrait ? 40 : 30) * u;
  const items = useMemo(() => {
    const R = bRng(p.seed * 131 + 7);
    const out: {kind: Kind; sx: number; sy: number; srot: number; ss: number; tx: number; ty: number; row: number; col: number; seed: number; ext: [string, string]; app: number; delay: number; bendS: number}[] = [];
    let r0 = 0;
    for (const [kind, nr] of rowsK) {
      const bend = kind === 'file' ? 1 : kind === 'photo' ? -1 : 0.6;
      for (let r = 0; r < nr; r++)
        for (let c = 0; c < cols; c++) {
          out.push({
            kind,
            sx: (-0.04 + R() * 1.08) * w,
            sy: (-0.04 + R() * 1.08) * h,
            srot: (R() - 0.5) * 50,
            ss: 1.05 + R() * 0.55,
            tx: x0 + c * (tile + gap) + tile / 2,
            ty: y0 + (r0 + r) * (tile + gap) + tile / 2,
            row: r0 + r,
            col: c,
            seed: Math.floor(R() * 9999),
            ext: EXTS[Math.floor(R() * EXTS.length)],
            app: Math.floor(R() * 7),
            delay: R() * 0.12,
            bendS: bend * (0.8 + R() * 0.4),
          });
        }
      r0 += nr;
    }
    return out;
  }, [p.seed, w, h, cols, tile, gap, x0, y0, p.rowsFiles, p.rowsPhotos, p.rowsApps]);
  const land = p.beat + p.flight;
  const gridIn = seg(t, land - 0.05, land + 0.35);
  const sweepP = seg(t, land + 0.35, land + 1.5);
  const pose = (it: (typeof items)[number], tt: number) => {
    const start = p.beat - p.flight * 0.15 + it.row * 0.035 + it.delay;
    const k = clamp01((tt - start) / p.flight);
    // idle drift before the beat
    const dx = Math.sin(tt * 0.6 + it.seed) * 8 * u;
    const dy = Math.cos(tt * 0.5 + it.seed * 0.7) * 8 * u;
    const fx = it.sx + dx * (1 - k);
    const fy = it.sy + dy * (1 - k);
    const q = backOut(k, 1.35);
    // curved path: perpendicular bulge, same-type paths bend the same way
    const mx = it.tx - fx;
    const my = it.ty - fy;
    const L = Math.hypot(mx, my) || 1;
    const bulge = Math.sin(Math.PI * Math.min(1, q)) * L * 0.22 * it.bendS;
    const x = lerpN(fx, it.tx, q) + (-my / L) * bulge;
    const y = lerpN(fy, it.ty, q) + (mx / L) * bulge;
    const rot = it.srot * (1 - clamp01(springRot(k * 1.2)));
    const s = lerpN(it.ss, 1, eo(k));
    return {x, y, rot, s, k};
  };
  return (
    <AbsoluteFill style={{background: KEY.bg0}}>
      <Svg style={{transform: `scale(${1 + 0.045 * eo(seg(t, land, land + 4))})`}}>
        <KeynoteStage id="sgc-st" w={w} h={h} u={u} grid={0.6} />
        {/* container + grid appear only on landing */}
        <g opacity={gridIn}>
          <rect x={x0 - 34 * u} y={y0 - 34 * u} width={gw + 68 * u} height={gh + 68 * u} rx={26 * u} fill="rgba(18,21,28,.85)" stroke="rgba(255,255,255,.09)" />
          <path d={`M${x0 - 34 * u + 26 * u} ${y0 - 32.5 * u}H${x0 + gw + 34 * u - 26 * u}`} stroke="rgba(255,255,255,.1)" />
          <g stroke="rgba(255,255,255,.05)">
            {Array.from({length: cols + 1}, (_, c) => (
              <line key={`c${c}`} x1={x0 + c * (tile + gap) - gap / 2} x2={x0 + c * (tile + gap) - gap / 2} y1={y0 - gap / 2} y2={y0 + gh + gap / 2} />
            ))}
            {Array.from({length: rows + 1}, (_, r) => (
              <line key={`r${r}`} y1={y0 + r * (tile + gap) - gap / 2} y2={y0 + r * (tile + gap) - gap / 2} x1={x0 - gap / 2} x2={x0 + gw + gap / 2} />
            ))}
          </g>
        </g>
        {/* trails */}
        {p.trail &&
          items.map((it, i) => {
            const cur = pose(it, t);
            if (cur.k <= 0 || cur.k >= 1) return null;
            const segs: React.ReactNode[] = [];
            let prev = pose(it, t - 0.24);
            for (let j = 1; j <= 8; j++) {
              const nx = pose(it, t - 0.24 + (0.24 * j) / 8);
              const a = (j / 8) * (j / 8) * 0.55;
              segs.push(<line key={j} x1={prev.x} y1={prev.y} x2={nx.x} y2={nx.y} stroke={rgba(KCOL[it.kind], a)} strokeWidth={(1.5 + 4 * (j / 8)) * u} strokeLinecap="round" />);
              prev = nx;
            }
            return <g key={`t${i}`}>{segs}</g>;
          })}
        {items.map((it, i) => {
          const q = pose(it, t);
          const tf = `translate(${q.x} ${q.y}) rotate(${q.rot}) scale(${q.s})`;
          let el: React.ReactNode;
          if (it.kind === 'file') el = <KFile x={0} y={4 * u} s={(tile / 64) * 0.95} ext={it.ext[0]} tint={it.ext[1]} font={la2Fonts.inter} mono={la2Fonts.monoHeavy} id={`sgc-f${i}`} />;
          else if (it.kind === 'photo') el = <KPhoto x={-tile / 2} y={-tile / 2} w={tile} h={tile} seed={it.seed} id={`sgc-p${i}`} />;
          else el = <KAppIcon x={0} y={0} s={tile * 0.78} k={it.app} />;
          return (
            <g key={i} transform={tf}>
              {el}
            </g>
          );
        })}
        {/* lime light sweep over the sorted grid */}
        {sweepP > 0 && sweepP < 1 && (
          <g>
            <defs>
              <linearGradient id="sgc-sw" x1="0" y1="0" x2="1" y2="0.5">
                <stop offset={Math.max(0, sweepP * 1.4 - 0.25)} stopColor={p.accent} stopOpacity={0} />
                <stop offset={Math.max(0, sweepP * 1.4 - 0.12)} stopColor={p.accent} stopOpacity={0.22} />
                <stop offset={Math.max(0, sweepP * 1.4)} stopColor={p.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <rect x={x0 - 34 * u} y={y0 - 34 * u} width={gw + 68 * u} height={gh + 68 * u} rx={26 * u} fill="url(#sgc-sw)" style={{mixBlendMode: 'screen'}} />
          </g>
        )}
        <rect x={x0 - 34 * u} y={y0 - 34 * u} width={gw + 68 * u} height={gh + 68 * u} rx={26 * u} fill="none" stroke={p.accent} strokeWidth={1.5 * u} opacity={0.6 * smooth(seg(t, land, land + 0.2)) * (1 - seg(t, land + 0.3, land + 1.2))} />
        {p.caption && (
          <text x={w / 2} y={y0 + gh + (portrait ? 150 : 100) * u} textAnchor="middle" fontFamily={la2Fonts.inter} fontWeight={500} fontSize={40 * u} fill={KEY.text} opacity={seg(t, land + 0.5, land + 0.9)} transform={`translate(0 ${(1 - eo(seg(t, land + 0.5, land + 0.9))) * 14 * u})`}>
            {p.caption}
          </text>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const snapGridCollapse = defineMotion<Props>({
  id: 'snap-grid-collapse',
  title: 'Snap grid collapse',
  category: 'ui',
  description:
    'Hundreds of scattered file icons, photo tiles and app icons drift, then fly in one beat along curved typed paths with coloured trails into a perfect grid — each type to its own rows, back-overshoot along the final tangent, spring-settled rotation — and only then the container, hairline grid and a lime light sweep appear, with a caption.',
  source: ['lemo-opuscar styles/dark-keynote (MIT, LemoLab) — demo/engine.js snapGrid, assignSlots, flyPose, trail; demo/world.js'],
  useFor: 'The "we organise it all" promise for SaaS, CMS, schedulers, file managers and inbox tools; the effect after ui-accumulation-storm.',
  durationInFrames: 180,
  defaultProps: {
    beat: 1.2,
    flight: 0.7,
    rowsFiles: 4,
    rowsPhotos: 3,
    rowsApps: 3,
    accent: KEY.accent,
    caption: 'Everything in its place.',
    trail: true,
    seed: 2,
  },
  propDocs: {
    beat: 'second of the beat the flight lands on (flights start just before it)',
    flight: 'seconds per element flight (0.5–0.8)',
    rowsFiles: 'grid rows of file icons',
    rowsPhotos: 'grid rows of photos',
    rowsApps: 'grid rows of app icons',
    accent: 'the single brand accent (sweep, landing flash)',
    caption: 'caption under the grid',
    trail: 'coloured flight trails per type',
    seed: 'scatter seed',
  },
  component: SnapGridCollapse,
  tags: ['ui', 'grid', 'snap', 'organise', 'sort', 'files', 'photos', 'icons', 'keynote', 'dark', 'saas', 'trails', 'fly', 'beat', 'order', 'solution', 'productivity'],
});
