import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DEFAULT_SCENE_PALETTE, Photo, SceneStill} from '../../core/cam-kit';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Crash zoom: a snap punch-in on a point of interest. Each hit `[frame, zoom, x, y]` slams the camera from its current
 * framing to `zoom` (x, y = 0..1 target in the frame) in a few frames on an expo-out curve, with ghosted zoom-blur copies, a
 * decaying camera shake, optional radial speed lines and a flash. An optional `release` eases back out after the last hit.
 */
type Props = {
  src: string;
  hits: number[][];
  snapFrames: number;
  shake: number;
  shakeDecay: number;
  speedLines: boolean;
  lineColor: string;
  flash: number;
  creep: number;
  release: number;
  releaseAfter: number;
  palette: string[];
  accent: string;
  background: string;
};

const CrashZoom: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const hits = [...p.hits].sort((a, b) => a[0] - b[0]);
  let zoom = 1 + p.creep * prog(frame, 0, 150, ease.sine);
  let prevZ = 1;
  let ox = 0.5;
  let oy = 0.45;
  let last = -1000;
  let ghostFrom = zoom;
  for (const [at, z, x = 0.5, y = 0.45] of hits) {
    if (frame < at) break;
    const k = prog(frame, at, at + p.snapFrames, ease.expoOut);
    ghostFrom = prevZ;
    zoom = lerp(prevZ, z, k);
    prevZ = z;
    ox = x;
    oy = y;
    last = at;
  }
  if (last > -1000 && p.release > 0) {
    const r = prog(frame, last + p.releaseAfter, last + p.releaseAfter + p.release, ease.inOut);
    zoom = lerp(zoom, 1 + p.creep, r);
  }
  const since = frame - last;
  const dec = Math.exp(-Math.max(0, since) / Math.max(1, p.shakeDecay));
  const shakeAmp = last > -1000 && since >= 0 ? p.shake * dec * u : 0;
  const sx = shakeAmp * (Math.sin(frame * 2.9 + 1) + Math.sin(frame * 5.3) * 0.5);
  const sy = shakeAmp * (Math.cos(frame * 3.7) + Math.sin(frame * 4.1 + 2) * 0.5);
  const sr = shakeAmp * 0.04 * Math.sin(frame * 2.1);
  const snapping = last > -1000 && since >= 0 && since < p.snapFrames + 3;
  const lineA = last > -1000 && since >= 0 ? clamp(1 - since / 14) : 0;
  const flashA = last > -1000 && since >= 0 ? p.flash * clamp(1 - since / 5) : 0;
  const scene = p.src ? <Photo src={p.src} /> : <SceneStill i={0} pal={p.palette} accent={p.accent} />;
  const frameStyle = (z: number, a = 1): React.CSSProperties => ({
    transform: `translate(${sx}px, ${sy}px) rotate(${sr}deg) scale(${z})`,
    transformOrigin: `${ox * 100}% ${oy * 100}%`,
    opacity: a,
  });
  const ghosts = snapping ? [0.7, 0.45, 0.25].map((q) => lerp(zoom, ghostFrom, q * clamp(1 - prog(frame, last, last + p.snapFrames, ease.linear)) * 0.9)) : [];
  const lines = rng(9);
  const ex = ox * w;
  const ey = oy * h;
  const R = Math.hypot(w, h);
  return (
    <AbsoluteFill style={{background: p.background, overflow: 'hidden'}}>
      {ghosts.map((g, i) => (
        <AbsoluteFill key={i} style={frameStyle(g, 0.4)}>
          {scene}
        </AbsoluteFill>
      ))}
      <AbsoluteFill style={frameStyle(zoom)}>{scene}</AbsoluteFill>
      {p.speedLines && lineA > 0 ? (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: lineA}}>
          {Array.from({length: 64}, (_, i) => {
            const a = (i / 64) * Math.PI * 2 + lines() * 0.08;
            const r0 = (0.18 + lines() * 0.3) * R * 0.5;
            const r1 = R;
            const sp = 0.012 + lines() * 0.012;
            return (
              <path
                key={i}
                d={`M${ex + Math.cos(a - sp) * r1} ${ey + Math.sin(a - sp) * r1} L${ex + Math.cos(a) * r0} ${ey + Math.sin(a) * r0} L${ex + Math.cos(a + sp) * r1} ${ey + Math.sin(a + sp) * r1}Z`}
                fill={p.lineColor}
                opacity={0.55 + lines() * 0.4}
              />
            );
          })}
        </svg>
      ) : null}
      {flashA > 0 ? <AbsoluteFill style={{background: '#fff', opacity: flashA}} /> : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.35) 100%)'}} />
    </AbsoluteFill>
  );
};

export const crashZoom = defineMotion<Props>({
  id: 'crash-zoom',
  title: 'Crash zoom',
  category: 'camera',
  description: 'Snap punch-in on a point of interest: expo-out zoom, ghosted zoom blur, decaying shake, radial speed lines and a flash.',
  source: ['camera-vocabulary: crash zoom / snap zoom'],
  useFor: 'Comedic or dramatic emphasis on a face, product, number or object in any image; reaction beats; "wait, what?" moments.',
  durationInFrames: 150,
  defaultProps: {
    src: '',
    hits: [[36, 2.1, 0.5, 0.4], [96, 3.4, 0.5, 0.36]],
    snapFrames: 5,
    shake: 14,
    shakeDecay: 7,
    speedLines: true,
    lineColor: '#ffffff',
    flash: 0.35,
    creep: 0.05,
    release: 24,
    releaseAfter: 30,
    palette: DEFAULT_SCENE_PALETTE,
    accent: '#ffd166',
    background: '#000000',
  },
  propDocs: {
    src: 'public/ path or URL (empty = procedural scene)',
    hits: '[[frame, zoom, x, y], ...] each punch-in; x,y = target point 0..1',
    snapFrames: 'frames each snap takes (3-6 = brutal)',
    shake: 'initial camera shake in u (0 = none)',
    shakeDecay: 'frames for the shake to decay',
    speedLines: 'radial manga speed lines on each hit',
    lineColor: 'speed line colour',
    flash: 'white flash strength on a hit (0 = off)',
    creep: 'slow push-in applied before the first hit (e.g. 0.05)',
    release: 'frames to ease back out after the last hit (0 = stay punched in)',
    releaseAfter: 'frames to wait after the last hit before releasing',
    palette: 'procedural scene colours',
    accent: 'procedural subject accent',
    background: 'base colour',
  },
  component: CrashZoom,
  tags: ['crash zoom', 'snap zoom', 'punch in', 'shake', 'speed lines', 'camera', 'emphasis', 'comedy'],
});
