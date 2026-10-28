import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {backOut, easeOut3, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {fitText, inkOn} from '../../core/r3-explain';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Venn diagram of 2 or 3 translucent circles that grow in one by one with labels and a few example words, then
 * the overlap is lit up and its label pops in the middle.
 */
type Props = {
  title: string;
  sets: string[];
  items: string[][];
  overlap: string;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  accent3: string;
  fontFamily: string;
  startAt: number;
  stagger: number;
};

const VennDiagramOverlap: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt);
  const font = p.fontFamily || fonts.grotesk;
  const sets = (p.sets || []).slice(0, 3);
  const n = Math.max(2, sets.length);
  const cols = [p.accent, p.accent2, p.accent3];
  const titleH = p.title ? (portrait ? 130 : 120) * u : 0;
  const per = Math.max(10, p.stagger || 26);
  const titleIn = easeOut3(sseg(f, 0, 20));
  const showBg = p.background !== 'transparent';
  const areaTop = h * 0.04 + titleH;
  const areaH = h - areaTop - h * 0.04;
  const cx0 = w / 2;
  const cy0 = areaTop + areaH / 2;

  // circle layout
  let r: number;
  let centers: {x: number; y: number}[];
  if (n === 2) {
    if (portrait) {
      r = Math.min(w * 0.36, areaH * 0.29);
      const d = r * 1.05;
      centers = [
        {x: cx0, y: cy0 - d / 2},
        {x: cx0, y: cy0 + d / 2},
      ];
    } else {
      r = Math.min(areaH * 0.42, w * 0.2);
      const d = r * 1.12;
      centers = [
        {x: cx0 - d / 2, y: cy0},
        {x: cx0 + d / 2, y: cy0},
      ];
    }
  } else {
    r = portrait ? Math.min(w * 0.29, areaH * 0.2) : Math.min(areaH * 0.29, w * 0.16);
    const d = r * 1.0;
    const rad = d / Math.sqrt(3);
    centers = [0, 1, 2].map((i) => {
      const a = (-90 + i * 120) * (Math.PI / 180);
      return {x: cx0 + Math.cos(a) * rad * 1.15, y: cy0 + Math.sin(a) * rad * 1.15 + r * 0.08};
    });
  }

  const grow = (i: number) => backOut(sseg(f, 16 + i * per, 16 + i * per + 22), 1.4);
  const olStart = 16 + n * per + 14;
  const ol = easeOut3(sseg(f, olStart, olStart + 22));
  const olText = backOut(sseg(f, olStart + 10, olStart + 30), 2);
  const uid = 'venn';
  const bg = p.background === 'transparent' ? '#ffffff' : p.background;

  // exclusive-region anchor: away from the centroid
  const mc = {x: centers.reduce((s, c) => s + c.x, 0) / n, y: centers.reduce((s, c) => s + c.y, 0) / n};
  const anchorFor = (i: number) => {
    const c = centers[i];
    let dx = c.x - mc.x;
    let dy = c.y - mc.y;
    const L = Math.hypot(dx, dy) || 1;
    dx /= L;
    dy /= L;
    return {x: c.x + dx * r * 0.42, y: c.y + dy * r * 0.42, dx, dy};
  };

  const pairs: [number, number][] = n === 2 ? [[0, 1]] : [[0, 1], [1, 2], [0, 2]];

  return (
    <AbsoluteFill style={{background: showBg ? p.background : undefined}}>
      <Svg>
        <defs>
          {centers.map((c, i) => (
            <clipPath key={i} id={`${uid}-c${i}`}>
              <circle cx={c.x} cy={c.y} r={r} />
            </clipPath>
          ))}
        </defs>
        {p.title ? (
          <text x={w / 2} y={h * 0.04 + titleH * 0.6} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={Math.min((portrait ? 64 : 56) * u, (w * 0.9) / Math.max(8, p.title.length * 0.56))} fill={p.ink} opacity={titleIn} transform={`translate(0 ${(1 - titleIn) * -20 * u})`}>
            {p.title}
          </text>
        ) : null}
        {/* circles */}
        {centers.map((c, i) => {
          const k = grow(i);
          return <circle key={i} cx={c.x} cy={c.y} r={Math.max(0.001, r * k)} fill={withAlpha(cols[i], 0.34)} stroke={cols[i]} strokeWidth={6 * u} opacity={Math.min(1, k * 2)} />;
        })}
        {/* overlap highlight(s) */}
        {ol > 0
          ? pairs.map(([a, b], i) => (
              <g key={i} clipPath={`url(#${uid}-c${a})`}>
                <circle cx={centers[b].x} cy={centers[b].y} r={r} fill={withAlpha(mixHex(cols[a], cols[b], 0.5), 0.55 * ol)} stroke={p.ink} strokeOpacity={0.85 * ol} strokeWidth={4 * u} />
              </g>
            ))
          : null}
        {ol > 0 && n === 3 ? (
          <g clipPath={`url(#${uid}-c0)`}>
            <g clipPath={`url(#${uid}-c1)`}>
              <circle cx={centers[2].x} cy={centers[2].y} r={r} fill={withAlpha(bg === '#ffffff' ? '#ffffff' : bg, 0.0)} />
              <g clipPath={`url(#${uid}-c2)`}>
                <rect x={0} y={0} width={w} height={h} fill={withAlpha('#FFFFFF', 0.5 * ol)} />
              </g>
            </g>
          </g>
        ) : null}
        {/* set labels + items */}
        {sets.map((s, i) => {
          const k = easeOut3(sseg(f, 26 + i * per, 44 + i * per));
          const a = anchorFor(i);
          const items = (p.items?.[i] || []).slice(0, 3);
          const lblFs = Math.min((portrait ? 46 : 42) * u, (r * 1.0) / Math.max(4, s.length * 0.58));
          const labY = a.y - (items.length ? 10 * u : 0);
          return (
            <g key={i} opacity={k} transform={`translate(0 ${(1 - k) * 14 * u})`}>
              <text x={a.x} y={labY} textAnchor="middle" fontFamily={font} fontWeight={800} fontSize={lblFs} fill={p.ink} stroke={withAlpha(bg, 0.0)}>
                {s}
              </text>
              {items.map((it, j) => (
                <text key={j} x={a.x} y={labY + (j + 1) * 36 * u} textAnchor="middle" fontFamily={fonts.sans} fontWeight={500} fontSize={Math.min(28 * u, (r * 0.9) / Math.max(4, it.length * 0.55))} fill={withAlpha(p.ink, 0.78)}>
                  {it}
                </text>
              ))}
            </g>
          );
        })}
        {/* overlap label */}
        {p.overlap ? (
          <g transform={`translate(${mc.x} ${mc.y + (n === 3 ? r * 0.02 : 0)}) scale(${Math.max(0.001, olText)})`}>
            {(() => {
              const fit = fitText(p.overlap, r * 0.7, r * 0.6, (portrait ? 38 : 34) * u, 16 * u, 0.58, 1.1);
              const bw = Math.max(...fit.lines.map((l) => l.length)) * fit.fs * 0.58 + 36 * u;
              const bh = fit.lines.length * fit.fs * fit.lh + 24 * u;
              return (
                <g>
                  <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={bh * 0.28} fill={p.ink} />
                  <text textAnchor="middle" fontFamily={font} fontWeight={800} fontSize={fit.fs} fill={inkOn(p.ink)}>
                    {fit.lines.map((l, j) => (
                      <tspan key={j} x={0} y={(j - (fit.lines.length - 1) / 2) * fit.fs * fit.lh + fit.fs * 0.34}>
                        {l}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            })()}
          </g>
        ) : null}
      </Svg>
    </AbsoluteFill>
  );
};

export const vennDiagramOverlap = defineMotion<Props>({
  id: 'venn-diagram-overlap',
  title: 'Venn diagram overlap',
  category: 'data',
  description: 'Two or three translucent circles pop in one by one with labels and example words, then the overlap region lights up and its label lands in the middle.',
  source: ['original (round 3)'],
  useFor: 'Explaining overlaps and intersections — skills vs interests, audience segments, ikigai-style frameworks, compare-and-contrast lessons — pass `sets`, `items` and the `overlap` label.',
  durationInFrames: 210,
  defaultProps: {
    title: 'Where it gets interesting',
    sets: ['Things you love', 'Things you are good at'],
    items: [['Music', 'Travel', 'Games'], ['Writing', 'Maths', 'Design']],
    overlap: 'Your sweet spot',
    background: '#14192B',
    ink: '#F4F6FC',
    accent: '#FF7A59',
    accent2: '#4FA8FF',
    accent3: '#7BE0A4',
    fontFamily: '',
    startAt: 0,
    stagger: 26,
  },
  propDocs: {
    title: 'heading (empty = none)',
    sets: 'circle labels (2 or 3)',
    items: 'array (one per set) of up to 3 short example words in that set',
    overlap: 'label for the overlap (centre) region',
    background: "backdrop colour or 'transparent'",
    ink: 'text colour',
    accent: 'first circle colour',
    accent2: 'second circle colour',
    accent3: 'third circle colour',
    fontFamily: 'optional CSS font-family (empty = grotesk)',
    startAt: 'frame the title starts',
    stagger: 'frames between circles',
  },
  component: VennDiagramOverlap,
  tags: ['venn', 'overlap', 'intersection', 'sets', 'diagram', 'compare', 'circles', 'framework', 'ikigai', 'logic', 'explainer', 'education'],
});
