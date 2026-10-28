// Adapted from mg-styles-15/demos/01-flat-vector/index.html (updIcons) (MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog, springAt} from '../../core/ease';
import {mg1Fonts} from '../../core/r2-mg1-kit';
import {mix, cl} from '../../core/r2-mg1b-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Cell = {icon: string; label: string; color: string};
type Props = {
  cells: Cell[];
  background: string;
  ink: string;
  firstBeat: number;
  beatEvery: number;
  collapseAt: number;
  collapseTo: 'logo' | 'none';
  logoText: string;
};

const DEFAULT_CELLS: Cell[] = [
  {icon: 'bars', label: '01 PROGRESS', color: '#FF6B5A'},
  {icon: 'check', label: '02 DONE', color: '#FFB627'},
  {icon: 'heart', label: '03 LOVED', color: '#2EC4A0'},
  {icon: 'coin', label: '04 SAVED', color: '#4C7DFF'},
];

const S = 300; // cell size (design px)
const GAP = 22;

const IconArt: React.FC<{kind: string; frame: number; fps: number; b: number; color: string}> = ({kind, frame, fps, b, color}) => {
  const a = frame - b;
  if (a < 0) return <circle r={7} fill="#fff" opacity={0.45} />;
  const stroke = {stroke: '#fff', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none'};
  if (kind === 'bars') {
    const hs = [60, 100, 138];
    return (
      <g>
        {hs.map((hh, k) => {
          const g = Math.max(0, springAt(frame, fps, b + k * 3, 'snappy'));
          return <rect key={k} x={-66 + k * 46} y={72 - hh * g} width={34} height={hh * g} rx={8} fill="#fff" />;
        })}
        <path d="M-72 76H72" {...stroke} strokeWidth={8} opacity={0.9} />
      </g>
    );
  }
  if (kind === 'check') {
    const c = prog(frame, b, b + 10, ease.out);
    const k = prog(frame, b + 6, b + 18, ease.out);
    const pop = 1 + 0.08 * Math.sin(cl(a / 14) * Math.PI);
    return (
      <g transform={`scale(${pop})`}>
        <circle r={72} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - c} {...stroke} strokeWidth={10} transform="rotate(-90)" />
        <path d="M-34 6L-10 32L38 -26" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} {...stroke} strokeWidth={14} />
      </g>
    );
  }
  if (kind === 'heart') {
    const sp = Math.max(0, springAt(frame, fps, b, 'wobble'));
    const beat = 1 + 0.05 * Math.sin(Math.max(0, a - 16) * 0.35) * cl((a - 16) / 6);
    const ring = prog(frame, b + 2, b + 20, ease.out);
    return (
      <g>
        <circle r={60 + 46 * ring} fill="none" stroke="#fff" strokeWidth={5} opacity={(1 - ring) * 0.8} />
        <g transform={`translate(0 4) scale(${sp * beat * 1.15})`}>
          <path d="M0 56C-82 4 -62 -58 -30 -58C-12 -58 0 -42 0 -34C0 -42 12 -58 30 -58C62 -58 82 4 0 56Z" fill="#fff" />
        </g>
      </g>
    );
  }
  if (kind === 'coin') {
    const f = ease.out(cl(a / 26));
    const th = f * Math.PI * 4;
    const cs = Math.cos(th);
    const rx = Math.max(3, 70 * Math.abs(cs));
    const lift = -Math.sin(f * Math.PI) * 34;
    const face = cs >= 0;
    return (
      <g transform={`translate(0 ${lift})`}>
        <ellipse rx={rx} ry={70} fill="#fff" />
        <ellipse rx={rx * 0.78} ry={54} fill="none" stroke={color} strokeWidth={6} opacity={0.9} />
        {face && <path d="M0 -26L18 0L0 26L-18 0Z" fill={color} transform={`scale(${Math.abs(cs)} 1)`} />}
      </g>
    );
  }
  // custom path: draw-on then pop
  const p = prog(frame, b, b + 16, ease.out);
  const pop = 1 + 0.1 * Math.sin(cl(a / 12) * Math.PI);
  return (
    <g transform={`scale(${pop})`}>
      <path d={kind} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} {...stroke} strokeWidth={10} />
    </g>
  );
};

const IconGridBurst: React.FC<Props> = ({cells, background, ink, firstBeat, beatEvery, collapseAt, collapseTo, logoText}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, cx, cy} = useStage();
  const n = cells.length;
  const cols = n <= 1 ? 1 : n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const gw = cols * S + (cols - 1) * GAP;
  const gh = rows * S + (rows - 1) * GAP;
  const fit = Math.min((w * 0.86) / (gw * u), (h * 0.8) / (gh * u), 1.5);
  const sc = u * fit;
  const centers = cells.map((_, i) => ({x: (i % cols) * (S + GAP) - gw / 2 + S / 2, y: Math.floor(i / cols) * (S + GAP) - gh / 2 + S / 2}));
  const beats = cells.map((_, i) => firstBeat + i * beatEvery);

  // collapse to circles then merge
  const toCircle = collapseTo === 'logo' ? prog(frame, collapseAt, collapseAt + 8, ease.inOut) : 0;
  const merge = collapseTo === 'logo' ? prog(frame, collapseAt + 8, collapseAt + 26, ease.expoInOut) : 0;
  const logoIn = collapseTo === 'logo' ? prog(frame, collapseAt + 22, collapseAt + 40, ease.back) : 0;
  const textIn = collapseTo === 'logo' ? prog(frame, collapseAt + 32, collapseAt + 52, ease.out) : 0;

  // hero dot rides the active icon (hop between cell centres)
  let activeIdx = -1;
  for (let i = 0; i < n; i++) if (frame >= beats[i] - 3) activeIdx = i;
  const dotAt = (i: number) => ({x: centers[i].x + S / 2 - 38, y: centers[i].y - S / 2 + 38});
  let dot = {x: centers[0].x, y: -gh / 2 - 90};
  if (activeIdx >= 0) {
    const t0 = beats[activeIdx] - 3;
    const to = dotAt(activeIdx);
    if (activeIdx === 0) {
      const t = prog(frame, t0 - 12, t0, ease.out);
      const fr = {x: centers[0].x, y: -gh / 2 - 90};
      dot = {x: mix(fr.x, to.x, t), y: mix(fr.y, to.y, t) - Math.sin(t * Math.PI) * 50};
    } else {
      const from = dotAt(activeIdx - 1);
      const t = prog(frame, t0 - 4, t0 + 8, ease.inOut);
      dot = {x: mix(from.x, to.x, t), y: mix(from.y, to.y, t) - Math.sin(t * Math.PI) * 70};
    }
  } else {
    // arriving from above before the first beat
    const t = prog(frame, 0, Math.max(1, beats[0] - 15), ease.out);
    dot = {x: centers[0].x, y: mix(-gh / 2 - 220, -gh / 2 - 90, t)};
  }
  const sq = activeIdx >= 0 ? 1 + 0.25 * Math.sin(cl((frame - (beats[activeIdx] - 3)) / 8) * Math.PI) : 1;
  const lastB = beats[n - 1];
  const dotHome = collapseTo === 'logo' ? prog(frame, lastB + 24, collapseAt + 6, ease.inOut) : 0;
  const dx = mix(dot.x, 0, dotHome);
  const dy = mix(dot.y, 0, dotHome);

  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <g transform={`translate(${cx} ${cy}) scale(${sc})`}>
          {cells.map((c, i) => {
            const pin = Math.max(0, springAt(frame, fps, 2 + i * 3, 'pop'));
            const a = frame - beats[i];
            const pulse = a >= 0 ? 1 + 0.07 * Math.sin(cl(a / 10) * Math.PI) : 1;
            const bob = a >= 14 ? Math.sin(frame * 0.18 + i * 1.7) * 3 : 0;
            const ctr = centers[i];
            const px = mix(ctr.x, 0, merge);
            const py = mix(ctr.y, 0, merge) + bob * (1 - toCircle);
            const radius = mix(30, S / 2, toCircle);
            const shrink = 1 - merge;
            const scl = pin * pulse * shrink * mix(1, 0.62, toCircle);
            const lab = cl(1 - toCircle * 2);
            return (
              <g key={i} transform={`translate(${px} ${py}) scale(${Math.max(0.0001, scl)})`}>
                <rect x={-S / 2} y={-S / 2} width={S} height={S} rx={radius} fill={c.color} />
                <text x={-S / 2 + 24} y={-S / 2 + 44} fontFamily={mg1Fonts.dm} fontWeight={700} fontSize={25} letterSpacing={3} fill="#fff" opacity={lab * (a >= -4 ? 1 : 0.7)}>
                  {c.label}
                </text>
                <g opacity={lab}>
                  <IconArt kind={c.icon} frame={frame} fps={fps} b={beats[i]} color={c.color} />
                </g>
              </g>
            );
          })}
          {/* hero dot */}
          <g transform={`translate(${dx} ${dy}) scale(${(2 - sq) * 1.0} ${sq})`} opacity={1 - logoIn}>
            <ellipse cx={0} cy={26} rx={12} ry={4} fill={ink} opacity={0.12} />
            <circle r={17} fill={ink} />
            <circle cx={-5} cy={-6} r={5} fill="#fff" opacity={0.7} />
          </g>
          {/* logo lockup */}
          {collapseTo === 'logo' && (
            <g opacity={logoIn} transform={`scale(${mix(0.5, 1, logoIn)})`}>
              <circle r={84} fill="none" stroke={ink} strokeWidth={14} />
              {cells.map((c, i) => {
                const a0 = (i / n) * Math.PI * 2 - Math.PI / 2 + 0.06;
                const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2 - 0.06;
                const r = 50;
                return (
                  <path
                    key={'s' + i}
                    d={`M${Math.cos(a0) * r} ${Math.sin(a0) * r}A${r} ${r} 0 0 1 ${Math.cos(a1) * r} ${Math.sin(a1) * r}`}
                    stroke={c.color}
                    strokeWidth={18}
                    fill="none"
                  />
                );
              })}
              <circle cx={0} cy={0} r={17} fill={ink} />
            </g>
          )}
          {collapseTo === 'logo' && (
            <text
              x={0}
              y={196}
              textAnchor="middle"
              fontFamily={mg1Fonts.rounded}
              fontWeight={700}
              fontSize={92}
              fill={ink}
              letterSpacing={2}
              opacity={textIn}
              transform={`translate(0 ${(1 - textIn) * 24})`}
            >
              {logoText}
            </text>
          )}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const iconGridBurst = defineMotion<Props>({
  id: 'icon-grid-burst',
  title: 'Icon grid burst',
  category: 'ui',
  description:
    'A 2x2 grid of flat colour cells with numbered small-caps labels; on every beat one cell bursts alive (bars grow, a check draws, a heart pops, a coin flips) while a hero dot hops onto the active icon; then the cells round to circles, merge to the centre and become a logo lockup.',
  source: ['mg-styles-15 demos/01-flat-vector (updIcons) video 5.5-8.0 s (MIT)'],
  useFor: 'Four benefits in four beats for product promos, feature recaps and slides; ends on a brand lockup.',
  durationInFrames: 230,
  defaultProps: {
    cells: DEFAULT_CELLS,
    background: '#FFF3E0',
    ink: '#24224A',
    firstBeat: 26,
    beatEvery: 18,
    collapseAt: 140,
    collapseTo: 'logo',
    logoText: 'Lumen',
  },
  propDocs: {
    cells: 'cells[{icon: bars|check|heart|coin|<svg path d in a ±90 box>, label, color}] (1-6)',
    background: 'page colour',
    ink: 'hero dot / logo ink colour',
    firstBeat: 'frame of the first burst',
    beatEvery: 'frames between bursts (15 = 120 bpm)',
    collapseAt: 'frame the cells collapse to circles',
    collapseTo: "'logo' merges into a logo lockup, 'none' keeps the grid",
    logoText: 'wordmark under the logo ring',
  },
  component: IconGridBurst,
  tags: ['icons', 'grid', 'benefits', 'beat', 'flat', 'logo', 'bars', 'checkmark', 'heart', 'coin', 'hero dot', 'promo', 'features'],
});
