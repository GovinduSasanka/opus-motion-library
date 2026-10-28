// Adapted from lemo-opuscar/styles/brick-toy engine ("Rebuild into something else", CC BY 4.0 docs; code MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {Brick, BRICK_COLORS, BrickMesh, BrickStage, brickArc, cellsToBricks, hh, lf, pixelText, snapOvershoot} from '../../core/r2-la1-kit';
import {useStage} from '../../core/stage';
import {CameraRig, Stage3D, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * The same set of bricks lifts off one word and reassembles into a different one: bricks are matched between
 * the two layouts by size and colour (greedy nearest), each arcs from A to B with a staggered start on 8ths
 * and snaps on landing; leftover bricks tuck away behind, missing ones fly in from off-set bins.
 */
type Props = {
  from: string;
  to: string;
  palette: string[];
  morphAt: number;
  stagger: number;
  flightFrames: number;
  stepFps: number;
  background: string;
  desk: string;
  captionFrom: string;
  captionTo: string;
  seed: number;
};

const layout = (text: string, palette: string[], seed: number) => {
  const {cells, width} = pixelText(text);
  return cellsToBricks(cells, palette, seed, 1, 'letter').map((b) => ({...b, x: b.x - width / 2}));
};

const RebuildMorph: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {u, fps, portrait} = useStage();
  const {pairs, spanX, spanY} = useMemo(() => {
    const A = layout(p.from, p.palette, p.seed);
    const B = layout(p.to, p.palette, p.seed + 1);
    // greedy match by (w, color) then nearest position
    const usedB = new Set<number>();
    const pairs: {a: Brick | null; b: Brick | null; key: number}[] = [];
    A.forEach((a, ai) => {
      let best = -1;
      let bd = 1e9;
      B.forEach((b, bi) => {
        if (usedB.has(bi)) return;
        const d = (b.w === a.w ? 0 : 40) + (b.color === a.color ? 0 : 18) + Math.hypot(b.x - a.x, b.y - a.y);
        if (d < bd) {
          bd = d;
          best = bi;
        }
      });
      if (best >= 0) {
        usedB.add(best);
        pairs.push({a, b: B[best], key: ai});
      } else pairs.push({a, b: null, key: ai});
    });
    B.forEach((b, bi) => {
      if (!usedB.has(bi)) pairs.push({a: null, b, key: 1000 + bi});
    });
    const all = [...A, ...B];
    return {pairs, spanX: Math.max(...all.map((x) => Math.abs(x.x) + x.w / 2), 6), spanY: Math.max(...all.map((x) => x.y + 0.6), 5)};
  }, [p.from, p.to, p.palette, p.seed]);
  const hold = Math.max(1, Math.round(fps / p.stepFps));
  const fq = Math.floor(frame / hold) * hold;
  const n = pairs.length;
  const morphEnd = p.morphAt + n * p.stagger * 0.25 + p.flightFrames;
  const k = prog(frame, 0, morphEnd + 30, ease.sine);
  const dist = spanX * (portrait ? 3.4 : 2.1) + 8;
  const pos: V3 = [Math.sin(lerp(0.26, 0.06, k)) * dist, dist * lerp(0.26, 0.16, k) + spanY * 0.5, Math.cos(lerp(0.26, 0.06, k)) * dist];
  const tgt: V3 = [0, spanY * 0.5, 0];
  const capK = prog(frame, p.morphAt - 20, p.morphAt + 30, ease.inOut);
  const cap1In = prog(frame, 14, 26, ease.out);
  const cap2In = prog(frame, morphEnd + 4, morphEnd + 18, ease.out);

  return (
    <AbsoluteFill style={{background: p.background, filter: 'contrast(1.12) saturate(1.1)'}}>
      <Stage3D shadows="soft">
        <CameraRig position={pos} target={tgt} fov={portrait ? 44 : 34} />
        <BrickStage desk={p.desk} plateR={Math.ceil(spanX + 5)}>
          {pairs.map(({a, b, key}, i) => {
            const brick = (a ?? b)!;
            const t0 = p.morphAt + (i % Math.max(1, Math.floor(n * 0.25))) * p.stagger + Math.floor(i / Math.max(1, Math.floor(n * 0.25))) * p.stagger;
            const t01 = clamp((fq - t0) / p.flightFrames);
            const sd = hh(key, p.seed);
            const bin: [number, number, number] = [(sd - 0.5) * spanX * 4, 0.6, -spanX - 5 - sd * 5];
            const A: [number, number, number] = a ? [a.x, a.y, a.z] : bin;
            const Bp: [number, number, number] = b ? [b.x, b.y, b.z] : bin;
            if (fq < t0) {
              if (!a) return null; // extra bricks wait off-stage until needed
              return <BrickMesh key={key} b={brick} pos={A} />;
            }
            if (t01 >= 1 && !b) return null; // retired bricks end in the bin, hidden behind
            const [x, y, z] = t01 >= 1 ? Bp : brickArc(t01, A, Bp, 4 + sd * 3);
            const ov = b ? snapOvershoot(fq - (t0 + p.flightFrames)) : 0;
            const rot: [number, number, number] = t01 > 0 && t01 < 1 ? [(1 - t01) * (sd - 0.5) * 1.4, t01 * sd * 2, (1 - t01) * (sd - 0.5)] : [0, 0, 0];
            return <BrickMesh key={key} b={b ?? brick} pos={[x, y + Math.max(0, ov), z]} rot={rot} />;
          })}
        </BrickStage>
      </Stage3D>
      {(p.captionFrom || p.captionTo) && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 120 * u,
            transform: 'translateX(-50%)',
            opacity: Math.max(cap1In * (1 - capK), cap2In),
            background: 'rgba(18,20,26,0.62)',
            color: '#fff',
            borderRadius: 40 * u,
            padding: `${16 * u}px ${34 * u}px`,
            fontFamily: lf.sans,
            fontWeight: 600,
            fontSize: 42 * u,
            whiteSpace: 'nowrap',
          }}
        >
          {capK < 0.5 ? p.captionFrom : p.captionTo}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const brickRebuildMorph = defineMotion<Props>({
  id: 'brick-rebuild-morph',
  title: 'Brick rebuild morph',
  category: '3d',
  description:
    'The same set of glossy toy bricks lifts off one word and reassembles into a different one: bricks matched by size and colour arc across on staggered 8ths and snap on landing, with spare bricks flying in from bins behind the baseplate.',
  source: ['lemo-opuscar styles/brick-toy "Rebuild into something else" + engine (MIT code / CC BY 4.0 docs, LemoLab)', 'analysis/sources/lemo-styles-a.md §6 brick-rebuild-morph'],
  useFor: 'Transformation stories in a playful material: career change, before/after, rebrand, a word re-spelled.',
  durationInFrames: 210,
  defaultProps: {
    from: 'WORK',
    to: 'PLAY',
    palette: [BRICK_COLORS.red, BRICK_COLORS.yellow, BRICK_COLORS.blue, BRICK_COLORS.green],
    morphAt: 52,
    stagger: 2,
    flightFrames: 22,
    stepFps: 12,
    background: '#cfd4d8',
    desk: '#9b958c',
    captionFrom: 'It spelled one thing for years…',
    captionTo: '…until we rebuilt it.',
    seed: 5,
    } as Props,
  propDocs: {
    from: 'the first word (5×7 pixel font)',
    to: 'the word it rebuilds into',
    palette: 'brick colours (one per letter)',
    morphAt: 'frame the morph starts',
    stagger: 'frames between brick departures',
    flightFrames: 'flight time of one brick',
    stepFps: 'stop-motion stepping of brick movement',
    background: 'studio wall colour',
    desk: 'desk colour',
    captionFrom: 'subtitle shown with the first word',
    captionTo: 'subtitle shown after the rebuild',
    seed: 'matching / flight seed',
  },
  component: RebuildMorph,
  tags: ['bricks', 'toy', 'morph', 'rebuild', 'transformation', 'before after', 'word swap', 'stop motion', '3d', 'playful', 'rebrand', 'change'],
});
