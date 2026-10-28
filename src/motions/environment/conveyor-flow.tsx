import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {ActionTicks, Cassette, Cobbles, GouacheFinish, IdeaCard, SB, SideHouse, Shrub, StoryTown, Workshop, workshopGeo, x14Fonts} from '../../core/r2-x14-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * x4 conveyor-flow (19.6–24.1 s): the workshop's big arched doors swing open and identical products
 * (cassettes by default) come out one after another onto a wooden belt that runs toward the camera / lower
 * right. Speed is constant in world space, so on screen items accelerate (≈ easeInQuad) and grow 0.4 → 1.0
 * with perspective; spacing stays even; belt slats scroll and the rail rollers turn.
 */

type Props = {
  background: string;
  item: 'cassette' | 'box' | 'card';
  itemSrc: string;
  colors: string[];
  startAt: number;
  gapFrames: number;
  travelFrames: number;
  count: number;
  perspective: number;
  itemSize: number;
  openDoors: boolean;
  sign: string;
  beltColor: string;
  railColor: string;
  ticks: boolean;
  seed: number;
};

type Pt = {x: number; y: number};

const ConveyorFlow: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const lw = Math.max(1.2, 2 * u);
  const s = Math.min((w * 0.86) / 1050, (h * 0.66) / 820);
  const baseY = portrait ? h * 0.52 : h * 0.72;
  const bx = portrait ? w * 0.5 : w * 0.4;
  const horizon = baseY - (portrait ? 0.06 : 0.13) * h;
  const geo = workshopGeo(bx, baseY, s);
  const doorOpen = p.openDoors ? prog(frame, 2, 11, ease.out) : 0;

  // belt geometry (screen): far end at the door threshold, near end past the lower-right corner
  const far: Pt = {x: bx, y: baseY - 24 * s};
  const near: Pt = portrait ? {x: w * 0.92, y: h * 1.08} : {x: w * 0.86, y: h * 1.12};
  const Z = Math.max(1.05, p.perspective);
  const wf = 126 * s;
  const wn = wf * Z;
  const dx = near.x - far.x;
  const dy = near.y - far.y;
  const dl = Math.hypot(dx, dy);
  const nx = -dy / dl;
  const ny = dx / dl;
  const beltAng = (Math.atan2(dy, dx) * 180) / Math.PI;
  const sig = (uu: number) => {
    const z = lerp(Z, 1, uu);
    return (1 / z - 1 / Z) / (1 - 1 / Z);
  };
  const at = (sg: number, side: number): Pt => {
    const c = {x: lerp(far.x, near.x, sg), y: lerp(far.y, near.y, sg)};
    const wd = lerp(wf, wn, sg) / 2;
    return {x: c.x + nx * wd * side, y: c.y + ny * wd * side};
  };
  // the side whose edge is lower on screen faces the camera
  const front = at(0.5, 1).y > at(0.5, -1).y ? 1 : -1;
  const railH = (sg: number) => lerp(14, 14 * Z, sg) * s;
  const pts = (arr: Pt[]) => arr.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
  const quad = (a: number, b: number, side: number, drop: (sg: number) => number) => {
    const A = at(a, side);
    const B = at(b, side);
    return pts([A, B, {x: B.x, y: B.y + drop(b)}, {x: A.x, y: A.y + drop(a)}]);
  };

  const speed = 1 / p.travelFrames;
  const t = Math.max(0, frame - p.startAt + p.gapFrames * 0.3);
  const slats = Array.from({length: 26}, (_, k) => {
    const uu = (((k / 26 + t * speed) % 1) + 1) % 1;
    return sig(uu);
  });
  const rollers = Array.from({length: 9}, (_, k) => sig((k + 0.5) / 9));

  // items
  const items: {uu: number; i: number}[] = [];
  const maxI = p.count > 0 ? p.count : 999;
  for (let i = 0; i < maxI; i++) {
    const uu = (frame - p.startAt - i * p.gapFrames) / p.travelFrames;
    if (uu < 0) break;
    if (uu <= 1.25) items.push({uu, i});
  }
  items.sort((a, b) => a.uu - b.uu);
  const itemNear = p.itemSize * u;
  const spawnTick = p.ticks && frame >= p.startAt && (frame - p.startAt) % p.gapFrames < 5 && (p.count <= 0 || (frame - p.startAt) / p.gapFrames < p.count);

  const drawItem = (uu: number, i: number) => {
    const sg = sig(uu);
    const z = lerp(Z, 1, uu);
    const sc = 1 / z;
    const c = {x: lerp(far.x, near.x, sg), y: lerp(far.y, near.y, sg)};
    const iw = itemNear * sc;
    const op = clamp(uu / 0.06);
    const col = p.colors.length ? p.colors[i % p.colors.length] : '#7C6E8A';
    const rot = beltAng * 0.5 - 8;
    if (p.itemSrc)
      return (
        <g key={i} transform={`translate(${c.x} ${c.y - iw * 0.18}) rotate(${rot}) scale(1 0.62)`} opacity={op}>
          <rect x={-iw / 2} y={-iw * 0.36} width={iw} height={iw * 0.72} fill="#FFF" stroke={SB.ink} strokeWidth={lw} />
          <foreignObject x={-iw / 2 + 3} y={-iw * 0.36 + 3} width={iw - 6} height={iw * 0.72 - 6}>
            <Img src={resolveSrc(p.itemSrc)} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
          </foreignObject>
        </g>
      );
    if (p.item === 'card') return <IdeaCard key={i} x={c.x} y={c.y - iw * 0.2} size={iw * 0.8} rot={rot} squash={0.6} lw={lw} />;
    if (p.item === 'box') {
      const bw = iw * 0.8;
      const bh = bw * 0.55;
      const top = bw * 0.32;
      return (
        <g key={i} transform={`translate(${c.x} ${c.y - bh * 0.5}) rotate(${rot * 0.4})`} opacity={op} stroke={SB.ink} strokeWidth={lw} strokeLinejoin="round">
          <path d={`M${-bw / 2},${-bh / 2} L${-bw / 2 + top * 0.6},${-bh / 2 - top} L${bw / 2 + top * 0.6},${-bh / 2 - top} L${bw / 2},${-bh / 2} Z`} fill="#E3B47A" />
          <path d={`M${bw / 2},${-bh / 2} L${bw / 2 + top * 0.6},${-bh / 2 - top} L${bw / 2 + top * 0.6},${bh / 2 - top} L${bw / 2},${bh / 2} Z`} fill="#B98451" />
          <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} fill="#CF9A62" />
          <path d={`M${-bw * 0.05 + top * 0.3},${-bh / 2 - top / 2} L${bw * 0.05 + top * 0.3},${-bh / 2 - top / 2}`} stroke={col} strokeWidth={bw * 0.08} />
          <rect x={-bw * 0.06} y={-bh / 2} width={bw * 0.12} height={bh} fill={col} stroke="none" opacity={0.85} />
        </g>
      );
    }
    return <Cassette key={i} x={c.x} y={c.y - iw * 0.14} w={iw} body={col} rot={rot} squash={0.62} lw={lw * 0.9} opacity={op} />;
  };

  const scene = p.background === 'scene';
  return (
    <AbsoluteFill style={{background: scene ? SB.skyLow : p.background}}>
      <Svg>
        {scene && (
          <g>
            <StoryTown w={w} h={h} horizon={horizon} s={s} frame={frame} seed={p.seed} />
            <Cobbles w={w} h={h} top={horizon + 0.03 * h} s={s * 1.1} seed={p.seed + 1} />
            <Workshop x={bx} y={baseY} s={s} frame={frame} lw={lw} glow={[1, 1, 1, 1, 1, 1]} doorOpen={doorOpen} sign={p.sign} signFont={x14Fonts.softSerif} gearAngle={frame * 2.4} smoke={0.8} breathe={1} />
            <Shrub x={geo.left - 10 * s} y={baseY + 8 * s} s={s * 0.9} seed={p.seed} frame={frame} />
            {portrait && <Shrub x={w * 0.14} y={h * 0.95} s={s * 2} seed={p.seed + 2} planter frame={frame} lw={lw} />}
            {portrait && <Shrub x={w * 0.08} y={h * 0.72} s={s * 1.2} seed={p.seed + 4} planter frame={frame} lw={lw} />}
            {!portrait && <SideHouse side="left" w={w} h={h} ground={baseY + 0.07 * h} s={s * 1.15} lw={lw} frame={frame} />}
          </g>
        )}
        {/* legs + rollers' shadow on the paving */}
        {rollers.map((sg, k) => {
          const A = at(sg, front);
          const legH = lerp(40, 40 * Z, sg) * s;
          return <line key={'leg' + k} x1={A.x} y1={A.y + railH(sg)} x2={A.x} y2={A.y + railH(sg) + legH} stroke="#41545A" strokeWidth={lerp(5, 5 * Z, sg) * s} />;
        })}
        <polygon points={pts([at(0, -1), at(1, -1), {x: at(1, 1).x, y: at(1, 1).y + 30 * Z * s}, {x: at(0, 1).x, y: at(0, 1).y + 10 * s}])} fill="#000" opacity={0.13} transform={`translate(${12 * s} ${34 * s})`} />
        {/* back rail lip */}
        <polygon points={quad(0, 1, -front, (sg) => -railH(sg) * 0.45)} fill={p.railColor} stroke={SB.ink} strokeWidth={lw} strokeLinejoin="round" />
        {/* belt surface + slats */}
        <polygon points={pts([at(0, -1), at(1, -1), at(1, 1), at(0, 1)])} fill={p.beltColor} stroke={SB.ink} strokeWidth={lw} strokeLinejoin="round" />
        {slats.map((sg, k) => {
          const A = at(sg, -1);
          const B = at(sg, 1);
          return <line key={'sl' + k} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#6E5238" strokeWidth={lerp(1, Z, sg) * 1.4 * s} opacity={0.55} />;
        })}
        <polygon points={pts([at(0, -1), at(1, -1), at(1, -0.55), at(0, -0.55)])} fill="#FFFFFF" opacity={0.08} />
        {/* items */}
        {items.map((it) => drawItem(it.uu, it.i))}
        {/* front rail face + rollers */}
        <polygon points={quad(0, 1, front, railH)} fill={p.railColor} stroke={SB.ink} strokeWidth={lw} strokeLinejoin="round" />
        {rollers.map((sg, k) => {
          const A = at(sg, front);
          const r = lerp(9, 9 * Z, sg) * s;
          const ang = (frame * 9 * (1 / lerp(Z, 1, sg))) % 360;
          return (
            <g key={'r' + k} transform={`translate(${A.x} ${A.y + railH(sg) * 0.55}) rotate(${ang})`}>
              <circle r={r} fill="#8C7A5E" stroke={SB.ink} strokeWidth={lw * 0.8} />
              <path d={`M${-r * 0.7},0 H${r * 0.7} M0,${-r * 0.7} V${r * 0.7}`} stroke={SB.ink} strokeWidth={lw * 0.8} />
              <circle r={r * 0.25} fill={SB.metalLight} />
            </g>
          );
        })}
        {spawnTick && <ActionTicks frame={frame} x={bx} y={geo.door.top - 6 * s} size={80 * s} dir={-90} spread={110} count={4} seed={p.seed + 7} width={lw * 1.2} />}
      </Svg>
      {scene && <GouacheFinish w={w} h={h} seed={p.seed} vignette={0.12} />}
    </AbsoluteFill>
  );
};

export const conveyorFlow = defineMotion<Props>({
  id: 'conveyor-flow',
  title: 'Conveyor flow',
  category: 'environment',
  description:
    'Storybook workshop doors swing open and identical products (cassettes, boxes, cards or your image) roll out one after another on a wooden perspective belt toward the lower right, growing with depth at an even spacing while slats scroll and rollers turn.',
  source: ['video x4 0:19.6-0:24.1 (conveyor-flow)'],
  useFor: '"Output / production / shipping" metaphors: many generated items (videos, orders, builds) leaving a system; pass itemSrc for your own product.',
  durationInFrames: 150,
  defaultProps: {
    background: 'scene',
    item: 'cassette',
    itemSrc: '',
    colors: ['#7C6E8A', '#C9584A', '#4F7F9A', '#D29A3A', '#5F8A6A'],
    startAt: 12,
    gapFrames: 18,
    travelFrames: 90,
    count: 0,
    perspective: 2.5,
    itemSize: 230,
    openDoors: true,
    sign: '',
    beltColor: '#9C7652',
    railColor: '#5F7678',
    ticks: true,
    seed: 5,
  },
  propDocs: {
    background: "'scene' = procedural gouache street + workshop, or a CSS colour (belt + items only)",
    item: 'built-in item: cassette | box | card',
    itemSrc: 'optional image (public/ path or URL) used as the item instead',
    colors: 'item body colours, cycled',
    startAt: 'frame the first item leaves the doors',
    gapFrames: 'frames between items (≈ 0.6 s)',
    travelFrames: 'frames for an item to ride the whole belt (≈ 3 s)',
    count: 'number of items (0 = endless)',
    perspective: 'near/far depth ratio: items grow 1/perspective → 1',
    itemSize: 'item width at the near end, in u',
    openDoors: 'swing the workshop doors open at the start',
    sign: 'text on the plaque above the door (empty = blank)',
    beltColor: 'belt slat colour',
    railColor: 'belt rail colour',
    ticks: 'small action ticks over the door as each item appears',
    seed: 'town / cloud seed',
  },
  component: ConveyorFlow,
  tags: ['conveyor', 'belt', 'factory', 'production', 'output', 'shipping', 'assembly-line', 'cassette', 'products', 'perspective', 'storybook', 'gouache', 'illustration', 'workshop', 'doors', 'loop', 'x4'],
});
