import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {lighten, makePileBodies, mix, pileSamples, simulatePile, type PileBody, type PileEvent, type PileKind, type PileSeg} from '../../core/r2-pr3-kit';

/**
 * Physics pile: objects fall, bounce, stack and topple. A tiny deterministic 2D rigid-body sim (circle clusters, so
 * boxes and triangles have rounded corners) is pre-simulated once at 120 Hz with a seed and sampled per frame;
 * collision frames are exposed (physicsPileEvents) so a host can sync SFX. Mixed shapes, or letter tiles from
 * `text` that fall and stack into a heap. Walls: box, bowl or floor.
 */
type Props = {
  count: number;
  shapes: PileKind[];
  text: string;
  size: number;
  container: 'box' | 'bowl' | 'floor';
  restitution: number;
  friction: number;
  spawnEvery: number;
  startFrame: number;
  colors: string[];
  background: string;
  ink: string;
  impacts: boolean;
  seed: number;
};

const LETTER_FONT = fonts.display;

const layout = (P0: Props, w: number, h: number, u: number, frames: number) => {
  const cx = w / 2;
  const portrait = h > w;
  // portrait: a much taller heap (more bodies, faster spawn) so the tall frame is not mostly empty
  const P: Props = portrait && !P0.text.trim() ? {...P0, count: Math.round(P0.count * 2.6), spawnEvery: P0.spawnEvery * 0.5} : P0;
  const floorY = h * (portrait ? 0.86 : 0.88);
  const bw = Math.min(w * 0.46, 620 * u);
  const wr = 22 * u;
  const walls: PileSeg[] = [];
  let x0 = 0;
  let x1 = w;
  const top = -40 * u;
  if (P.container === 'box') {
    walls.push([cx - bw - wr, -3000, cx - bw - wr, floorY + wr], [cx - bw - wr, floorY + wr, cx + bw + wr, floorY + wr], [cx + bw + wr, floorY + wr, cx + bw + wr, -3000]);
    x0 = cx - bw;
    x1 = cx + bw;
  } else if (P.container === 'bowl') {
    const yt = h * 0.5;
    walls.push([cx - bw * 1.15, yt, cx - bw * 0.5, floorY + wr], [cx - bw * 0.5, floorY + wr, cx + bw * 0.5, floorY + wr], [cx + bw * 0.5, floorY + wr, cx + bw * 1.15, yt]);
    x0 = cx - bw * 0.95;
    x1 = cx + bw * 0.95;
  } else {
    walls.push([-wr, -3000, -wr, floorY + wr], [-wr, floorY + wr, w + wr, floorY + wr], [w + wr, floorY + wr, w + wr, -3000]);
    x0 = w * 0.2;
    x1 = w * 0.8;
  }
  const size = P.size * u;
  let bodies: PileBody[];
  let letters: string[] = [];
  if (P.text.trim()) {
    letters = P.text.replace(/\s+/g, '').split('');
    const r = (seed: number) => {
      let a = seed;
      return () => {
        a = (a * 1664525 + 1013904223) >>> 0;
        return a / 4294967296;
      };
    };
    const rnd = r(P.seed + 11);
    bodies = letters.map((_, i) => ({
      kind: 'box' as PileKind,
      w: size * 1.0,
      h: size * 1.1,
      spawn: P.startFrame + Math.round(i * P.spawnEvery),
      x: x0 + (x1 - x0) * (0.15 + 0.7 * rnd()),
      y: top - size,
      angle: (rnd() - 0.5) * 1.4,
      vx: (rnd() - 0.5) * 120,
      vy: 120 + rnd() * 120,
      spin: (rnd() - 0.5) * 5,
    }));
  } else {
    bodies = makePileBodies(P.count, P.seed, {x0, x1, top}, size, P.shapes.length ? P.shapes : ['circle', 'box', 'tri'], P.spawnEvery, P.startFrame);
  }
  const key = JSON.stringify([P.count, P.shapes, P.text, P.size, P.container, P.restitution, P.friction, P.spawnEvery, P.startFrame, P.seed, Math.round(w), Math.round(h), frames]);
  const sim = simulatePile(key, bodies, walls, {frames, restitution: P.restitution, friction: P.friction, gravity: 2600 * u, wallRadius: wr});
  return {bodies, walls, wr, sim, letters, floorY};
};

/** collision events (frame, position, strength 0-1) for SFX sync; same layout as the motion at the given size */
export const physicsPileEvents = (props: Partial<Props> = {}, w = 1920, h = 1080, frames = 210): PileEvent[] => {
  const P = {...physicsPile.defaultProps, ...props} as Props;
  return layout(P, w, h, Math.min(w, h) / 1080, frames).sim.events;
};

const PhysicsPile: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const {bodies, walls, wr, sim, letters} = layout(P, w, h, u, durationInFrames);
  const f = Math.min(frame, sim.frames - 1);
  const n = sim.count;
  const colors = P.colors.length ? P.colors : ['#FF6B4A'];
  let li = 0;
  const els = bodies.map((b, i) => {
    const o = (f * n + i) * 3;
    const x = sim.data[o];
    if (Number.isNaN(x)) return null;
    const y = sim.data[o + 1];
    const a = (sim.data[o + 2] * 180) / Math.PI;
    const col = colors[i % colors.length];
    const dark = mix(col, '#000000', 0.35);
    const r = sim.radius[i];
    const letter = letters.length ? letters[li++ % letters.length] : '';
    let shape: React.ReactNode;
    if (b.kind === 'circle') {
      shape = (
        <>
          <circle r={b.w / 2} fill={col} stroke={dark} strokeWidth={3 * u} />
          <circle cx={b.w * 0.16} cy={-b.w * 0.16} r={b.w * 0.14} fill={lighten(col, 0.55)} opacity={0.9} />
        </>
      );
    } else if (b.kind === 'box') {
      shape = (
        <>
          <rect x={-b.w / 2} y={-b.h / 2} width={b.w} height={b.h} rx={r} fill={col} stroke={dark} strokeWidth={3 * u} />
          {!letter && <rect x={-b.w / 2 + 7 * u} y={-b.h / 2 + 7 * u} width={b.w * 0.4} height={5 * u} rx={2.5 * u} fill={lighten(col, 0.6)} opacity={0.85} />}
          {letter && (
            <text textAnchor="middle" dominantBaseline="central" y={u * 2} fontSize={b.h * 0.72} fontFamily={LETTER_FONT} fill={P.ink}>
              {letter}
            </text>
          )}
        </>
      );
    } else {
      const s = pileSamples('tri', b.w, b.h);
      const d = `M${s.verts.map((v) => `${v[0].toFixed(1)} ${v[1].toFixed(1)}`).join('L')}Z`;
      shape = (
        <>
          <path d={d} fill={dark} stroke={dark} strokeWidth={2 * s.r} strokeLinejoin="round" />
          <path d={d} fill={col} stroke={col} strokeWidth={2 * s.r - 6 * u} strokeLinejoin="round" />
        </>
      );
    }
    return (
      <g key={i} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${a.toFixed(2)})`}>
        {shape}
      </g>
    );
  });

  const marks = P.impacts
    ? sim.events
        .filter((e) => frame >= e.frame && frame < e.frame + 9)
        .map((e, i) => {
          const t = (frame - e.frame) / 9;
          const rr = (18 + 40 * e.strength) * u * (0.4 + t);
          return (
            <g key={i} opacity={(1 - t) * (0.25 + 0.5 * e.strength)}>
              <circle cx={e.x} cy={e.y} r={rr} fill="none" stroke={P.ink} strokeWidth={2.5 * u} />
              {[-0.9, -0.3, 0.3, 0.9].map((k, j) => (
                <line key={j} x1={e.x + Math.sin(k) * rr * 1.1} y1={e.y - Math.cos(k) * rr * 1.1} x2={e.x + Math.sin(k) * rr * 1.5} y2={e.y - Math.cos(k) * rr * 1.5} stroke={P.ink} strokeWidth={2.5 * u} strokeLinecap="round" />
              ))}
            </g>
          );
        })
    : null;

  return (
    <AbsoluteFill style={{background: P.background}}>
      <Svg>
        {walls
          .filter((s) => Math.abs(s[0] - s[2]) > 1 || Math.abs(s[1] - s[3]) > 1)
          .map((s, i) => (
            <line key={i} x1={s[0]} y1={Math.max(s[1], -50)} x2={s[2]} y2={Math.max(s[3], -50)} stroke={mix(P.background, P.ink, 0.18)} strokeWidth={wr * 2} strokeLinecap="round" />
          ))}
        {els}
        {marks}
      </Svg>
    </AbsoluteFill>
  );
};

export const physicsPile = defineMotion<Props>({
  id: 'physics-pile',
  title: 'Physics pile (falling, stacking shapes)',
  category: 'fx',
  description:
    'Colourful circles, rounded boxes and triangles (or letter tiles from a word) drop in one after another, bounce, tumble, stack and settle in a box, bowl or on the floor; a deterministic pre-simulated 2D rigid-body sim at 120 Hz sampled per frame, with small impact marks and exported collision frames for sound effects.',
  source: ['prompt-corpus research: physics-pile (18 cases, ideas only; original implementation)'],
  useFor: 'Playful product demos, logos or words that fall into a heap, music-from-collisions, data drops (one body per item), toy / game stories.',
  durationInFrames: 210,
  defaultProps: {
    count: 26,
    shapes: ['circle', 'box', 'tri'],
    text: '',
    size: 112,
    container: 'box',
    restitution: 0.38,
    friction: 0.55,
    spawnEvery: 3,
    startFrame: 6,
    colors: ['#FF6B4A', '#FFC145', '#3DD6A3', '#4D8BFF', '#B26BFF', '#FF7EB6'],
    background: '#F3EEE4',
    ink: '#2A2622',
    impacts: true,
    seed: 5,
  },
  propDocs: {
    count: 'number of bodies (ignored when text is set)',
    shapes: "mix of 'circle' | 'box' | 'tri'",
    text: 'letters that fall as tiles instead of shapes (e.g. a brand name)',
    size: 'body size in u (1u = 1px at 1080 on the short side)',
    container: "'box' (walls + floor) | 'bowl' (slanted) | 'floor'",
    restitution: 'bounciness 0.2-0.5',
    friction: 'surface friction 0-1',
    spawnEvery: 'frames between spawns',
    startFrame: 'frame of the first spawn',
    colors: 'body colours, cycled',
    background: 'background colour',
    ink: 'wall / impact / letter colour',
    impacts: 'draw small impact bursts at hard collisions',
    seed: 'randomness seed',
  },
  component: PhysicsPile,
  tags: ['physics', 'pile', 'falling', 'bounce', 'stack', 'topple', 'collision', 'rigid body', 'gravity', 'shapes', 'letters', 'toy', 'playful', 'drop', 'marbles', 'data drop', 'sfx sync', 'deterministic'],
});
