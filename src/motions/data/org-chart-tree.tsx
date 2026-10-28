import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {Header, clip, itemColor, ramp, resolveFont, textOn, useChartBox, wrapLines} from '../../core/r3-chart-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type TreeNode = {name: string; role?: string; color?: string; children?: TreeNode[]};
type Props = {
  tree: TreeNode;
  title: string;
  subtitle: string;
  direction: 'auto' | 'down' | 'right';
  showInitials: boolean;
  highlight: string;
  colors: string[];
  cardColor: string;
  rootColor: string;
  lineColor: string;
  background: string;
  ink: string;
  fontFamily: string;
  startAt: number;
  speed: number;
};

const DEFAULT_TREE: TreeNode = {
  name: 'Chief Executive',
  role: 'Leadership',
  children: [
    {
      name: 'Product',
      role: 'Head of Product',
      children: [
        {name: 'Design', role: 'Design lead'},
        {name: 'Research', role: 'Research lead'},
      ],
    },
    {
      name: 'Engineering',
      role: 'Head of Engineering',
      children: [
        {name: 'Platform', role: 'Team lead'},
        {name: 'Mobile', role: 'Team lead'},
        {name: 'Data', role: 'Team lead'},
      ],
    },
    {
      name: 'Growth',
      role: 'Head of Growth',
      children: [
        {name: 'Brand', role: 'Team lead'},
        {name: 'Sales', role: 'Team lead'},
      ],
    },
  ],
};

type P = {n: TreeNode; id: number; depth: number; parent: number; branch: number; slot: number; x: number; y: number; leaves: number};

const OrgChartTree: React.FC<Props> = ({tree, title, subtitle, direction, showInitials, highlight, colors, cardColor, rootColor, lineColor, background, ink, fontFamily, startAt, speed}) => {
  const frame = useCurrentFrame();
  const {u, portrait} = useStage();
  const box = useChartBox(title, subtitle);
  const font = resolveFont(fontFamily);

  const dir = direction === 'auto' ? (portrait ? 'right' : 'down') : direction;

  const flat = React.useMemo(() => {
    const out: P[] = [];
    const walk = (n: TreeNode, depth: number, parent: number, branch: number): number => {
      const id = out.length;
      const rec: P = {n, id, depth, parent, branch, slot: 0, x: 0, y: 0, leaves: 1};
      out.push(rec);
      const kids = Array.isArray(n.children) ? n.children.filter(Boolean) : [];
      if (kids.length) {
        let sum = 0;
        kids.forEach((k, ki) => {
          const kid = walk(k, depth + 1, id, depth === 0 ? ki : branch);
          sum += out[kid].leaves;
        });
        rec.leaves = sum;
      }
      return id;
    };
    if (tree && tree.name !== undefined) walk(tree, 0, -1, -1);
    // assign breadth slots: leaves in order, parents centred
    let cursor = 0;
    const place = (id: number) => {
      const kids = out.filter((p) => p.parent === id);
      if (!kids.length) {
        out[id].slot = cursor + 0.5;
        cursor += 1;
        return;
      }
      kids.forEach((k) => place(k.id));
      out[id].slot = (out[kids[0].id].slot + out[kids[kids.length - 1].id].slot) / 2;
    };
    if (out.length) place(0);
    return out;
  }, [JSON.stringify(tree)]);

  const nodes = flat;
  const maxDepth = nodes.reduce((m, p) => Math.max(m, p.depth), 0);
  const leafCount = nodes[0]?.leaves || 1;
  const levels = maxDepth + 1;

  // box sizes
  const down = dir === 'down';
  const breadth = down ? box.w : box.h;
  const length = down ? box.h : box.w;
  const slotSize = breadth / leafCount;
  const levelStep = length / levels;
  const bwMax = (portrait ? 230 : 230) * u;
  const cardW = down ? Math.min(bwMax, slotSize - 18 * u) : Math.min(levelStep - (portrait ? 44 : 60) * u, 300 * u);
  const cardH = down ? Math.min(levelStep - 56 * u, (portrait ? 120 : 108) * u) : Math.min(slotSize - 16 * u, (portrait ? 108 : 100) * u);
  const nameSize = Math.max(14 * u, Math.min((portrait ? 28 : 25) * u, cardH * 0.27, cardW / 8));
  const roleSize = nameSize * 0.78;

  nodes.forEach((p) => {
    const along = (p.depth + 0.5) * levelStep;
    const across = p.slot * slotSize;
    p.x = down ? box.x + across : box.x + along;
    p.y = down ? box.y + along : box.y + across;
  });

  const colorOf = (p: P): string => {
    if (p.n.color) return p.n.color;
    if (p.depth === 0) return rootColor;
    // walk up to level-1 ancestor
    let q = p;
    while (q.depth > 1) q = nodes[q.parent];
    return itemColor(undefined, colors, q.branch);
  };

  const hl = highlight ? nodes.findIndex((p) => p.n.name === highlight) : -1;
  const hlT = hl >= 0 ? prog(frame, startAt + (levels * 26 + 40) / speed, startAt + (levels * 26 + 62) / speed, ease.out) : 0;
  const inChain = (p: P) => {
    if (hl < 0) return true;
    // highlighted node, its ancestors and its descendants
    let q: P | undefined = nodes[hl];
    while (q) {
      if (q.id === p.id) return true;
      q = q.parent >= 0 ? nodes[q.parent] : undefined;
    }
    let r: P | undefined = p;
    while (r) {
      if (r.id === hl) return true;
      r = r.parent >= 0 ? nodes[r.parent] : undefined;
    }
    return false;
  };

  const levelStart = (d: number) => startAt + d * 26;
  const initials = (s: string) =>
    s
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');

  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <Header box={box} ink={ink} fontFamily={font} frame={frame} />

        {/* connectors */}
        {nodes.map((p) => {
          if (p.parent < 0) return null;
          const a = nodes[p.parent];
          const t = ramp(frame, levelStart(p.depth) - 8, 22, speed, ease.inOut);
          if (t <= 0) return null;
          const dim = inChain(p) ? 1 : 1 - 0.75 * hlT;
          let d: string;
          if (down) {
            const y0 = a.y + cardH / 2;
            const y1 = p.y - cardH / 2;
            const ym = (y0 + y1) / 2;
            d = `M${a.x} ${y0} L${a.x} ${ym} L${p.x} ${ym} L${p.x} ${y1}`;
          } else {
            const x0 = a.x + cardW / 2;
            const x1 = p.x - cardW / 2;
            const xm = (x0 + x1) / 2;
            d = `M${x0} ${a.y} L${xm} ${a.y} L${xm} ${p.y} L${x1} ${p.y}`;
          }
          return (
            <path key={'c' + p.id} d={d} fill="none" stroke={lineColor} strokeWidth={3 * u} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} opacity={dim} />
          );
        })}

        {/* cards */}
        {nodes.map((p) => {
          const col = colorOf(p);
          const isRoot = p.depth === 0;
          const t = ramp(frame, levelStart(p.depth) + (p.depth === 0 ? 0 : 6) + (p.slot % 1) * 0, 24, speed, ease.back);
          const tt = clamp(t);
          if (tt <= 0) return null;
          const s = 0.7 + 0.3 * Math.min(1.08, t);
          const dim = inChain(p) ? 1 : 1 - 0.7 * hlT;
          const isHl = p.id === hl;
          const fill = isRoot ? col : cardColor;
          const fg = isRoot ? textOn(col) : ink;
          const pad = 14 * u;
          const initR = showInitials ? cardH * 0.28 : 0;
          const textX = showInitials ? -cardW / 2 + pad + initR * 2 + 12 * u : 0;
          const textW = cardW - pad * 2 - (showInitials ? initR * 2 + 12 * u : 0);
          const nSz = clamp(textW / (Math.max(1, p.n.name.length) * 0.6), nameSize * 0.72, nameSize);
          const rSz = clamp(textW / (Math.max(1, (p.n.role || '').length) * 0.58), roleSize * 0.78, roleSize);
          const nameLines = wrapLines(p.n.name, textW, nSz, 0.58, 2);
          const roleLines = p.n.role ? wrapLines(p.n.role, textW, rSz, 0.58, 1) : [];
          const blockH = nameLines.length * nSz * 1.1 + (roleLines.length ? rSz * 1.25 : 0);
          const ty0 = -blockH / 2 + nSz * 0.85;
          const anchor = showInitials ? 'start' : 'middle';
          return (
            <g key={'n' + p.id} opacity={tt * dim} transform={`translate(${p.x} ${p.y}) scale(${s * (isHl ? 1 + 0.05 * hlT : 1)})`}>
              <rect x={-cardW / 2 + 2 * u} y={-cardH / 2 + 4 * u} width={cardW} height={cardH} rx={14 * u} fill={ink} fillOpacity={isRoot ? 0 : 0.06} />
              <rect x={-cardW / 2} y={-cardH / 2} width={cardW} height={cardH} rx={14 * u} fill={fill} stroke={isHl ? ink : col} strokeWidth={(isHl ? 3.5 : isRoot ? 0 : 2.5) * u} strokeOpacity={isRoot ? 0 : 0.95} />
              {!isRoot && <rect x={-cardW / 2 + 18 * u} y={-cardH / 2 - 1.5 * u} width={cardW - 36 * u} height={Math.max(5 * u, cardH * 0.06)} rx={3 * u} fill={col} />}
              {showInitials && (
                <g>
                  <circle cx={-cardW / 2 + pad + initR} cy={0} r={initR} fill={isRoot ? textOn(col) : col} fillOpacity={isRoot ? 0.2 : 1} />
                  <text x={-cardW / 2 + pad + initR} y={initR * 0.36} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={initR * 0.95} fill={isRoot ? fg : textOn(col)}>
                    {initials(p.n.name)}
                  </text>
                </g>
              )}
              {nameLines.map((l, li) => (
                <text key={li} x={textX} y={ty0 + li * nSz * 1.1} textAnchor={anchor} fontFamily={font} fontWeight={700} fontSize={nSz} fill={fg}>
                  {clip(l, textW + 4 * u, nSz)}
                </text>
              ))}
              {roleLines.map((l, li) => (
                <text key={'r' + li} x={textX} y={ty0 + nameLines.length * nSz * 1.1 + rSz * 0.2 + li * rSz * 1.2} textAnchor={anchor} fontFamily={font} fontWeight={500} fontSize={rSz} fill={fg} fillOpacity={0.62}>
                  {clip(l, textW + 4 * u, rSz)}
                </text>
              ))}
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const orgChartTree = defineMotion<Props>({
  id: 'org-chart-tree',
  title: 'Org chart tree',
  category: 'data',
  description:
    'A hierarchy diagram from one nested tree prop: the root card pops in, then elbow connectors draw down (or across, in vertical frames) and each level of cards pops in, with branches colour-coded and an optional highlighted node that spotlights its chain of command.',
  source: ['original round-3 chart motion'],
  useFor:
    'Org charts, team structures, decision trees, site maps, product families, taxonomies, family trees. Pass tree as {name, role?, children:[...]} nested to any depth; reflows left-to-right in 9:16.',
  durationInFrames: 210,
  defaultProps: {
    tree: DEFAULT_TREE,
    title: 'How the company is organised',
    subtitle: 'Three departments, seven teams',
    direction: 'auto',
    showInitials: false,
    highlight: '',
    colors: ['#2F6FED', '#FF7A45', '#16B39A', '#F2B134', '#8E5CF0', '#E5487F', '#5BC0EB', '#7A8794'],
    cardColor: '#FFFFFF',
    rootColor: '#18212B',
    lineColor: '#9AA3AD',
    background: '#F5F3EE',
    ink: '#18212B',
    fontFamily: '',
    startAt: 10,
    speed: 1,
  },
  propDocs: {
    tree: 'hierarchy {name, role?, color?, children?: [...]} nested to any depth',
    title: 'headline (empty = none)',
    subtitle: 'small line under the headline (empty = none)',
    direction: '"auto" (down in 16:9 / 1:1, across in 9:16), "down" or "right"',
    showInitials: 'draw a coloured initials badge in each card',
    highlight: 'name of a node to spotlight at the end (empty = none); its ancestors and descendants stay lit',
    colors: 'palette: one colour per top-level branch',
    cardColor: 'card fill colour',
    rootColor: 'root card colour',
    lineColor: 'connector colour',
    background: 'page colour, or "transparent" to sit over other content',
    ink: 'text colour',
    fontFamily: 'CSS font family (empty = Space Grotesk)',
    startAt: 'frame the root card appears',
    speed: 'animation speed multiplier',
  },
  component: OrgChartTree,
  tags: ['org chart', 'tree', 'hierarchy', 'diagram', 'team', 'structure', 'taxonomy', 'sitemap', 'decision tree', 'infographic', 'data', 'overlay', 'connectors'],
});
