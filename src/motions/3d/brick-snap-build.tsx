// Adapted from lemo-opuscar/styles/brick-toy/demo/bricks.js + main.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {Brick, BRICK_COLORS, BrickMesh, BrickStage, brickArc, cellsToBricks, hh, lf, pixelText, snapOvershoot} from '../../core/r2-la1-kit';
import {useStage} from '../../core/stage';
import {CameraRig, Stage3D, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * Stop-motion macro brick build: glossy toy bricks fly in on arcs, one per beat, and click into place with a
 * tiny overshoot, stacking into a word (5×7 pixel font split into running-bond bricks) or a custom voxel
 * list. Brick motion steps at 12 fps while the camera glides on ones.
 */
type Props = {
  text: string;
  bricks: Brick[];
  palette: string[];
  colorBy: 'row' | 'random' | 'letter';
  beatFrames: number;
  startAt: number;
  stepFps: number;
  background: string;
  desk: string;
  caption: string;
  seed: number;
};

const SnapBuild: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const bricks = useMemo(() => {
    if (p.bricks.length) return p.bricks;
    const {cells, width} = pixelText(p.text);
    const bs = cellsToBricks(cells, p.palette, p.seed, 1, p.colorBy);
    return bs.map((b) => ({...b, x: b.x - width / 2}));
  }, [p.bricks, p.text, p.palette, p.seed, p.colorBy]);
  // land order: bottom row first, then left → right
  const order = useMemo(() => {
    const idx = bricks.map((_, i) => i);
    idx.sort((a, b2) => bricks[a].y - bricks[b2].y || bricks[a].x - bricks[b2].x);
    const rank = new Array(bricks.length);
    idx.forEach((bi, k) => (rank[bi] = k));
    return rank as number[];
  }, [bricks]);
  const landAt = (i: number) => p.startAt + order[i] * p.beatFrames;
  const hold = Math.max(1, Math.round(fps / p.stepFps));
  const fq = Math.floor(frame / hold) * hold; // bricks on twos
  const n = bricks.length;
  const total = p.startAt + n * p.beatFrames;
  const spanX = Math.max(...bricks.map((b) => Math.abs(b.x) + b.w / 2), 6);
  const spanY = Math.max(...bricks.map((b) => b.y + b.h / 2), 4);

  // camera on ones: slow glide + pull back as the build grows
  const k = prog(frame, 0, total + 20, ease.sine);
  const dist = lerp(spanX * 1.5 + 6, spanX * (portrait ? 3.4 : 2.1) + 8, k);
  const ang = lerp(0.3, 0.08, k);
  const elev = lerp(0.3, 0.17, k);
  const tgtY = lerp(1.4, spanY * 0.52, k);
  const pos: V3 = [Math.sin(ang) * dist, dist * elev + tgtY, Math.cos(ang) * dist];
  const tgt: V3 = [0, tgtY, 0];
  const capIn = prog(frame, total + 6, total + 20, ease.out);

  return (
    <AbsoluteFill style={{background: p.background, filter: 'contrast(1.12) saturate(1.1)'}}>
      <Stage3D shadows="soft">
        <CameraRig position={pos} target={tgt} fov={portrait ? 44 : 34} />
        <BrickStage desk={p.desk} plateR={Math.ceil(spanX + 4)}>
          {bricks.map((b, i) => {
            const L = landAt(i);
            if (fq < L - p.beatFrames * 2.2) return null;
            const t01 = clamp((fq - (L - p.beatFrames * 2.2)) / (p.beatFrames * 2.2));
            const target: [number, number, number] = [b.x, b.y, b.z];
            const sd = hh(i, p.seed);
            const from: [number, number, number] = [b.x + (sd - 0.5) * spanX * 3, spanY + 6 + sd * 5, b.z + 10 + sd * 8];
            const [x, y, z] = t01 >= 1 ? target : brickArc(t01, from, target, 3 + sd * 3);
            const ov = snapOvershoot(fq - L);
            const rot: [number, number, number] = t01 >= 1 ? [0, 0, 0] : [(1 - t01) * (sd - 0.5) * 1.6, (1 - t01) * sd * 2.2, (1 - t01) * (sd - 0.5)];
            return <BrickMesh key={i} b={b} pos={[x, y + Math.max(0, ov), z]} rot={rot} />;
          })}
        </BrickStage>
      </Stage3D>
      {p.caption && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 120 * u,
            transform: `translate(-50%, ${(1 - capIn) * 20 * u}px)`,
            opacity: capIn,
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
          <span style={{display: 'inline-block', width: 30 * u, height: 18 * u, background: BRICK_COLORS.yellow, borderRadius: 3 * u, marginRight: 18 * u}} />
          {p.caption}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const brickSnapBuild = defineMotion<Props>({
  id: 'brick-snap-build',
  title: 'Brick snap build',
  category: '3d',
  description:
    'Stop-motion macro toy bricks fly in on arcs, one per beat, and click into place with a tiny overshoot, stacking into a word (or custom voxel list) on a studded baseplate; bricks step at 12 fps while the camera glides on ones.',
  source: ['lemo-opuscar styles/brick-toy demo/bricks.js, main.js (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §6 brick-snap-build'],
  useFor: '"Built from the ground up" brand / product / logo builds, education and kids\' content, countdowns.',
  durationInFrames: 180,
  defaultProps: {
    text: 'BUILD',
    bricks: [],
    palette: [BRICK_COLORS.red, BRICK_COLORS.yellow, BRICK_COLORS.blue, BRICK_COLORS.green, BRICK_COLORS.white],
    colorBy: 'letter',
    beatFrames: 2,
    startAt: 10,
    stepFps: 12,
    background: '#cfd4d8',
    desk: '#9b958c',
    caption: 'Built brick by brick.',
    seed: 3,
  },
  propDocs: {
    text: 'word built from bricks via a 5×7 pixel font (A–Z 0–9, ♥)',
    bricks: 'custom brick list [{x,y,z,w,d,h,color}] in stud units (y up, h 1.2 = brick); overrides text',
    palette: 'brick colours',
    colorBy: 'letter = one colour per letter, row = per row stripes, random = scattered',
    beatFrames: 'frames between brick landings',
    startAt: 'frame the first brick lands',
    stepFps: 'stop-motion stepping of brick movement (12 = on twos at 24)',
    background: 'studio wall colour',
    desk: 'desk colour',
    caption: 'subtitle pill under the build (empty = none)',
    seed: 'flight path / colour seed',
  },
  component: SnapBuild,
  tags: ['bricks', 'toy', 'lego-like', 'build', 'stop motion', 'macro', '3d', 'snap', 'word', 'logo build', 'kids', 'education', 'playful', 'product'],
});
