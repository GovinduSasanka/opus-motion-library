import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {Header, clip, fmt, itemColor, resolveFont, useChartBox} from '../../core/r3-chart-kit';
import {isClear, mixHex} from '../../core/r3-vertical-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Room = {label: string; x: number; y: number; w: number; h: number; color?: string; area?: number};
type Door = {x: number; y: number; size?: number; orient?: 'h' | 'v'; swing?: number};
type Props = {
  title: string;
  subtitle: string;
  rooms: Room[];
  doors: Door[];
  unit: string;
  areaUnit: string;
  totalLabel: string;
  showTotal: boolean;
  showDimensions: boolean;
  colors: string[];
  background: string;
  ink: string;
  paper: string;
  accent: string;
  fontFamily: string;
  startAt: number;
  speed: number;
};

const ROOMS: Room[] = [
  {label: 'Living room', x: 0, y: 0, w: 7, h: 5},
  {label: 'Kitchen', x: 7, y: 0, w: 5, h: 3},
  {label: 'Bath', x: 7, y: 3, w: 2.5, h: 2},
  {label: 'Storage', x: 9.5, y: 3, w: 2.5, h: 2},
  {label: 'Bedroom', x: 0, y: 5, w: 5, h: 3},
  {label: 'Bedroom 2', x: 5, y: 5, w: 4, h: 3},
  {label: 'Study', x: 9, y: 5, w: 3, h: 3},
];
const DOORS: Door[] = [
  {x: 1.2, y: 0, size: 1.1, orient: 'h', swing: 1},
  {x: 7, y: 1, size: 1, orient: 'v', swing: 1},
  {x: 7, y: 3.5, size: 0.9, orient: 'v', swing: -1},
  {x: 1.2, y: 5, size: 1, orient: 'h', swing: 1},
  {x: 5.6, y: 5, size: 1, orient: 'h', swing: 1},
  {x: 10, y: 5, size: 0.9, orient: 'h', swing: 1},
];

const FloorplanDraw: React.FC<Props> = ({title, subtitle, rooms, doors, unit, areaUnit, totalLabel, showTotal, showDimensions, colors, background, ink, paper, accent, fontFamily, startAt, speed}) => {
  const frame = useCurrentFrame();
  const {u, portrait} = useStage();
  const box = useChartBox(title, subtitle);
  const font = resolveFont(fontFamily);
  const rs = rooms.slice(0, 16).filter((r) => r.w > 0 && r.h > 0);
  const n = Math.max(1, rs.length);
  const minX = Math.min(...rs.map((r) => r.x), 0);
  const minY = Math.min(...rs.map((r) => r.y), 0);
  const maxX = Math.max(...rs.map((r) => r.x + r.w), 1);
  const maxY = Math.max(...rs.map((r) => r.y + r.h), 1);
  const gw = maxX - minX;
  const gh = maxY - minY;
  const dimPad = showDimensions ? 72 * u : 14 * u;
  const chipH = showTotal ? 76 * u : 0;
  const chipGap = showTotal ? 34 * u : 0;
  const availW = box.w - dimPad - 40 * u;
  const availH = box.h - dimPad - chipH - chipGap - 30 * u;
  const s = Math.max(10 * u, Math.min(availW / gw, availH / gh));
  const groupH = gh * s + dimPad + chipGap + chipH;
  const ox = box.x + (box.w - gw * s) / 2 + (showDimensions ? dimPad * 0.4 : 0);
  const oy = box.y + Math.max(0, (box.h - groupH) * (portrait ? 0.3 : 0.5)) + 30 * u;
  const chipY = oy + gh * s + dimPad + chipGap - 2 * u;
  const X = (v: number) => ox + (v - minX) * s;
  const Y = (v: number) => oy + (v - minY) * s;
  const wall = Math.max(5 * u, s * 0.11);
  const per = 15 / speed;
  const drawDur = 34 / speed;
  const rt = (i: number) => prog(frame, startAt + 6 + i * per, startAt + 6 + i * per + drawDur, ease.inOut);
  const lastEnd = startAt + 6 + (n - 1) * per + drawDur;
  const areaOf = (r: Room) => (r.area !== undefined ? r.area : r.w * r.h);
  const totalArea = rs.reduce((a, r) => a + areaOf(r), 0);
  const totalShown = rs.reduce((a, r, i) => a + areaOf(r) * prog(frame, startAt + 6 + i * per + drawDur * 0.6, startAt + 6 + i * per + drawDur + 16, ease.out), 0);
  const bg = isClear(background) ? 'transparent' : background;
  const dec = totalArea % 1 === 0 ? 0 : 1;
  const dimT = prog(frame, lastEnd - 10, lastEnd + 20, ease.out);

  // outer boundary: draw it once, after the rooms, so walls look continuous
  const outer = `M${X(minX)},${Y(minY)} H${X(maxX)} V${Y(maxY)} H${X(minX)}Z`;
  const outerLen = 2 * (gw + gh) * s;

  return (
    <AbsoluteFill style={{background: bg}}>
      <Svg>
        <Header box={box} ink={ink} fontFamily={font} frame={frame} startAt={startAt} />
        {/* paper sheet */}
        <rect x={ox - 30 * u} y={oy - 30 * u} width={gw * s + 60 * u} height={gh * s + 60 * u} rx={20 * u} fill={paper} opacity={prog(frame, startAt, startAt + 16)} />
        {/* room fills + labels */}
        {rs.map((r, i) => {
          const t = rt(i);
          const col = itemColor(r.color, colors, i);
          const rw = r.w * s;
          const rh = r.h * s;
          const lt = prog(frame, startAt + 6 + i * per + drawDur * 0.7, startAt + 6 + i * per + drawDur + 14, ease.out);
          const size = clamp(Math.min(rw * 0.13, rh * 0.2), 14 * u, 38 * u);
          const ar = areaOf(r);
          const aStr = fmt(ar * lt, ar % 1 === 0 ? 0 : 1, '', ' ' + areaUnit);
          return (
            <g key={'r' + i}>
              <rect x={X(r.x)} y={Y(r.y)} width={rw} height={rh} fill={col} fillOpacity={0.3 * clamp(t * 2 - 0.6)} />
              <g opacity={lt} transform={`translate(0 ${(1 - lt) * 8 * u})`}>
                <text x={X(r.x) + rw / 2} y={Y(r.y) + rh / 2 + size * (rw > size * 5 ? -0.05 : -0.05)} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={size} fill={ink}>
                  {clip(r.label, rw * 0.92, size)}
                </text>
                <text x={X(r.x) + rw / 2} y={Y(r.y) + rh / 2 + size * 1.15} textAnchor="middle" fontFamily={font} fontWeight={600} fontSize={size * 0.82} fill={ink} fillOpacity={0.62} style={{fontVariantNumeric: 'tabular-nums'}}>
                  {clip(aStr, rw * 0.92, size * 0.82)}
                </text>
              </g>
            </g>
          );
        })}
        {/* walls drawing on, room by room */}
        {rs.map((r, i) => {
          const t = rt(i);
          const len = 2 * (r.w + r.h) * s;
          return (
            <path
              key={'w' + i}
              d={`M${X(r.x)},${Y(r.y)} H${X(r.x + r.w)} V${Y(r.y + r.h)} H${X(r.x)}Z`}
              fill="none"
              stroke={ink}
              strokeWidth={wall * 0.62}
              strokeLinejoin="miter"
              strokeLinecap="square"
              pathLength={len}
              strokeDasharray={len}
              strokeDashoffset={len * (1 - t)}
            />
          );
        })}
        {/* outer wall, thicker */}
        <path d={outer} fill="none" stroke={ink} strokeWidth={wall} strokeLinejoin="miter" pathLength={outerLen} strokeDasharray={outerLen} strokeDashoffset={outerLen * (1 - prog(frame, startAt + 6, lastEnd, ease.inOut))} />
        {/* doors */}
        {doors.map((d, i) => {
          const sz = (d.size ?? 1) * s;
          const sw = d.swing === -1 ? -1 : 1;
          const t = prog(frame, lastEnd - 6 + i * 4, lastEnd + 14 + i * 4, ease.out);
          const hx = X(d.x);
          const hy = Y(d.y);
          const horizontal = d.orient !== 'v';
          const gap = horizontal ? <line x1={hx} y1={hy} x2={hx + sz} y2={hy} /> : <line x1={hx} y1={hy} x2={hx} y2={hy + sz} />;
          const leaf = horizontal ? [hx, hy + sw * sz] : [hx + sw * sz, hy];
          const arcEnd = horizontal ? [hx + sz, hy] : [hx, hy + sz];
          return (
            <g key={'d' + i} opacity={t}>
              <g stroke={paper} strokeWidth={wall * 1.5}>{gap}</g>
              <line x1={hx} y1={hy} x2={leaf[0]} y2={leaf[1]} stroke={accent} strokeWidth={3 * u} strokeLinecap="round" />
              <path d={`M${leaf[0]},${leaf[1]} A${sz},${sz} 0 0 ${(horizontal ? sw === 1 : sw === -1) ? 0 : 1} ${arcEnd[0]},${arcEnd[1]}`} fill="none" stroke={accent} strokeWidth={2.5 * u} strokeDasharray={`${6 * u} ${6 * u}`} strokeLinecap="round" />
            </g>
          );
        })}
        {/* dimension lines */}
        {showDimensions && (
          <g opacity={dimT}>
            <g stroke={accent} strokeWidth={3 * u} fill="none" strokeLinecap="round">
              <path d={`M${X(minX)},${Y(maxY) + 64 * u} H${X(maxX)} M${X(minX)},${Y(maxY) + 52 * u} v${24 * u} M${X(maxX)},${Y(maxY) + 52 * u} v${24 * u}`} />
              <path d={`M${X(minX) - 64 * u},${Y(minY)} V${Y(maxY)} M${X(minX) - 76 * u},${Y(minY)} h${24 * u} M${X(minX) - 76 * u},${Y(maxY)} h${24 * u}`} />
            </g>
            <text x={(X(minX) + X(maxX)) / 2} y={Y(maxY) + 56 * u} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={24 * u} fill={accent} stroke={bg === 'transparent' ? 'none' : bg} strokeWidth={8 * u} paintOrder="stroke">
              {fmt(gw, gw % 1 === 0 ? 0 : 1, '', ' ' + unit)}
            </text>
            <text transform={`translate(${X(minX) - 72 * u} ${(Y(minY) + Y(maxY)) / 2}) rotate(-90)`} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={24 * u} fill={accent} stroke={bg === 'transparent' ? 'none' : bg} strokeWidth={8 * u} paintOrder="stroke">
              {fmt(gh, gh % 1 === 0 ? 0 : 1, '', ' ' + unit)}
            </text>
          </g>
        )}
        {/* total chip */}
        {showTotal && (
          <g opacity={prog(frame, startAt + 14, startAt + 34)} transform={`translate(0 ${(1 - prog(frame, startAt + 14, startAt + 34)) * 20 * u})`}>
            {(() => {
              const cw = Math.min(box.w, 560 * u);
              const cx0 = box.x + (box.w - cw) / 2;
              const cy0 = chipY;
              return (
                <>
                  <rect x={cx0} y={cy0} width={cw} height={chipH} rx={chipH / 2} fill={accent} />
                  <text x={cx0 + chipH * 0.55} y={cy0 + chipH * 0.64} fontFamily={font} fontWeight={600} fontSize={chipH * 0.3} letterSpacing={chipH * 0.03} fill="#fff" fillOpacity={0.85}>
                    {clip(totalLabel.toUpperCase(), cw * 0.5, chipH * 0.3, 0.66)}
                  </text>
                  <text x={cx0 + cw - chipH * 0.55} y={cy0 + chipH * 0.66} textAnchor="end" fontFamily={font} fontWeight={700} fontSize={chipH * 0.46} fill="#fff" style={{fontVariantNumeric: 'tabular-nums'}}>
                    {fmt(totalShown, dec, '', ' ' + areaUnit)}
                  </text>
                </>
              );
            })()}
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const floorplanDraw = defineMotion<Props>({
  id: 'floorplan-draw',
  title: 'Floor plan draw',
  category: 'data',
  description:
    'A top-down floor plan draws itself room by room: walls trace on, each room tints and gets its name and a counting area figure, door swings appear, dimension lines measure the whole footprint and a total-area chip counts up.',
  source: ['original round-3 vertical motion'],
  useFor:
    'Real-estate listings and new-build promos, interior design and renovation reveals, office or store layouts, venue plans. Describe the layout with a rooms list of {label, x, y, w, h} in your own units (metres, feet); areas are computed or given.',
  durationInFrames: 210,
  defaultProps: {
    title: 'Open-plan apartment',
    subtitle: 'Seven rooms on one level',
    rooms: ROOMS,
    doors: DOORS,
    unit: 'm',
    areaUnit: 'm²',
    totalLabel: 'Total area',
    showTotal: true,
    showDimensions: true,
    colors: ['#F2A65A', '#6CC5B0', '#7FA8F2', '#E88FB2', '#B79BE8', '#F2D16B', '#8BCB7A'],
    background: '#EEF1F4',
    ink: '#1C2733',
    paper: '#FBFCFD',
    accent: '#2F6FED',
    fontFamily: '',
    startAt: 6,
    speed: 1,
  },
  propDocs: {
    title: 'headline (empty = none)',
    subtitle: 'line under the headline (empty = none)',
    rooms: 'rooms [{label, x, y, w, h, color?, area?}] in your own units, top-left origin, up to 16; area defaults to w x h',
    doors: 'doors [{x, y, size?, orient?("h" on a horizontal wall / "v"), swing?(1 or -1)}] placed on walls in the same units',
    unit: 'length unit for the dimension lines',
    areaUnit: 'area unit written after the numbers',
    totalLabel: 'caption on the total-area chip',
    showTotal: 'show the total-area chip',
    showDimensions: 'show the overall width / depth dimension lines',
    colors: 'palette for rooms without their own colour',
    background: 'page colour, or "transparent"',
    ink: 'wall and text colour',
    paper: 'drawing sheet colour',
    accent: 'dimension, door and chip colour',
    fontFamily: 'CSS font family (empty = Space Grotesk)',
    startAt: 'frame the first room starts drawing',
    speed: 'animation speed multiplier',
  },
  component: FloorplanDraw,
  tags: ['floor plan', 'floorplan', 'blueprint', 'rooms', 'architecture', 'real estate', 'interior', 'layout', 'property', 'area', 'dimensions', 'draw on', 'plan view', 'overlay'],
});
