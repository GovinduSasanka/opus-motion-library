import React from 'react';
import {interpolate} from 'remotion';
import {clamp} from './ease';
import {n2, rng} from './random';
import {Sparkle} from './shapes';

/**
 * Character kit — reusable SVG mascots for the `character/` family and compose specs.
 *
 *  - <BoxBot>      orange cube mascot (v20 box-bot, v13 Clawd, v12 Claude): real 2.5D cuboid rig
 *                  (yaw/pitch projection) with legs, arms, eyes, expressions, snout, flower.
 *  - <MiniBot>     cheap front-view box-bot sprite for crowds.
 *  - <Blob>        white eyed sphere (v7) with squash/stretch and rolling eyes.
 *  - <Chibi>       bucket-hat explorer (v14) with era skins.
 *  - <PaperDoll>   v20 paper-doll townsperson.  <InkSoldier> v5 ink-etched legionary.
 *  - <Emote>       ? ! heart bulb sweat scribble sparkle zzz doodle icons (v20 emote-icon-pop).
 *  - <SpeedLines>, <SoftShadow>, <DeckleFrame>
 *  - evalBotScript(): turns a [{action:'walk'},{action:'hop'}…] script into a BoxBot pose at a frame.
 *
 * Everything is a pure function of its props. All `id`s must be unique per instance (defs).
 */

// ---------------------------------------------------------------- colour helpers
const parseHex = (h: string): [number, number, number] => {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const n = parseInt(s.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mixHex = (a: string, b: string, t: number) => {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const k = clamp(t);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * k));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

// ---------------------------------------------------------------- tiny 3D
type V3 = [number, number, number];
type P2 = [number, number];
type Cam = {yaw: number; pitch: number};
const rad = (d: number) => (d * Math.PI) / 180;
const toView = (p: V3, c: Cam): V3 => {
  const cs = Math.cos(c.yaw);
  const sn = Math.sin(c.yaw);
  return [p[0] * cs + p[2] * sn, p[1], -p[0] * sn + p[2] * cs];
};
const proj = (v: V3, c: Cam): P2 => [v[0], -v[1] * Math.cos(c.pitch) + v[2] * Math.sin(c.pitch)];
const rotX = (p: V3, a: number): V3 => [p[0], p[1] * Math.cos(a) - p[2] * Math.sin(a), p[1] * Math.sin(a) + p[2] * Math.cos(a)];
const rotZ = (p: V3, a: number): V3 => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a), p[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const LIGHT: V3 = (() => {
  const l: V3 = [-0.3, 0.9, 0.6];
  const n = Math.hypot(...l);
  return [l[0] / n, l[1] / n, l[2] / n];
})();

type FaceName = 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom';
const FACE_IDX: Record<FaceName, [number, number, number, number]> = {
  front: [6, 7, 5, 4],
  back: [3, 2, 0, 1],
  right: [7, 3, 1, 5],
  left: [2, 6, 4, 0],
  top: [2, 3, 7, 6],
  bottom: [4, 5, 1, 0],
};
type Face = {name: FaceName; pts: P2[]; light: number; mat: string; lu: number; lv: number};
type Part = {faces: Face[]; depth: number; kind: 'body' | 'leg' | 'arm'; key: string};

const cuboid = (min: V3, max: V3, xf: (p: V3) => V3, cam: Cam, kind: Part['kind'], key: string): Part => {
  const corners: V3[] = [];
  for (let i = 0; i < 8; i++) {
    const p: V3 = [i & 1 ? max[0] : min[0], i & 2 ? max[1] : min[1], i & 4 ? max[2] : min[2]];
    corners.push(toView(xf(p), cam));
  }
  const avg = (ps: V3[]): V3 => [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length, ps.reduce((s, p) => s + p[2], 0) / ps.length];
  const cen = avg(corners);
  const sp = Math.sin(cam.pitch);
  const cp = Math.cos(cam.pitch);
  const ex = max[0] - min[0];
  const ey = max[1] - min[1];
  const ez = max[2] - min[2];
  const sizes: Record<FaceName, [number, number]> = {front: [ex, ey], back: [ex, ey], right: [ez, ey], left: [ez, ey], top: [ex, ez], bottom: [ex, ez]};
  const faces: Face[] = [];
  (Object.keys(FACE_IDX) as FaceName[]).forEach((name) => {
    const idx = FACE_IDX[name];
    const fc = avg(idx.map((i) => corners[i]));
    const n: V3 = [fc[0] - cen[0], fc[1] - cen[1], fc[2] - cen[2]];
    const nl = Math.hypot(...n) || 1;
    if (n[1] * sp + n[2] * cp <= 1e-4 * nl) return;
    const light = (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / nl;
    const pts = idx.map((i) => proj(corners[i], cam));
    const [lu, lv] = sizes[name];
    const [tl, tr, , bl] = pts;
    const mat = `matrix(${(tr[0] - tl[0]) / lu} ${(tr[1] - tl[1]) / lu} ${(bl[0] - tl[0]) / lv} ${(bl[1] - tl[1]) / lv} ${tl[0]} ${tl[1]})`;
    faces.push({name, pts, light, mat, lu, lv});
  });
  return {faces, depth: cen[1] * sp + cen[2] * cp, kind, key};
};

const ptsStr = (pts: P2[]) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

// ---------------------------------------------------------------- styles & palettes
export type CharStyle = 'sketch' | 'clean' | 'toon';
export type BotPalette = {body: string; shade: string; top: string; leg: string; eye: string; ink: string; snout: string; flower: string};
export const BOT_PALETTES: Record<CharStyle, BotPalette> = {
  // video20 pencil sketch (sampled hatch medians)
  sketch: {body: '#CF8465', shade: '#B36A56', top: '#DE9C7E', leg: '#D29278', eye: '#262021', ink: '#2E2A26', snout: '#E59A9A', flower: '#E0626A'},
  // video13 toon-PBR Clawd
  clean: {body: '#F27A4C', shade: '#BF5235', top: '#FF9E72', leg: '#E2683F', eye: '#1E1620', ink: '#7A3420', snout: '#F59A8A', flower: '#F06A8A'},
  // video12 comic toon
  toon: {body: '#E57016', shade: '#8E4326', top: '#F79A48', leg: '#C65E18', eye: '#16081C', ink: '#16081C', snout: '#F08A6A', flower: '#FF3C8A'},
};

const faceFill = (light: number, body: string, shade: string, top: string) =>
  light >= 0.5 ? mixHex(body, top, (light - 0.5) / 0.4) : mixHex(shade, body, (light + 0.3) / 0.8);

const hash = (a: number, b: number) => {
  const r = rng(a * 7919 + b * 104729 + 13);
  return r();
};

/** sketchy ink edges that overshoot the corners (video20 architect lines) */
const SketchEdges: React.FC<{pts: P2[]; k: number; ink: string; seed: number; width: number}> = ({pts, k, ink, seed, width}) => (
  <>
    {pts.map((a, i) => {
      const b = pts[(i + 1) % pts.length];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L;
      const uy = dy / L;
      const o1 = (4 + hash(seed, i) * 10) * k;
      const o2 = (4 + hash(seed, i + 50) * 10) * k;
      const j = (hash(seed, i + 99) - 0.5) * 2 * k;
      return (
        <line
          key={i}
          x1={a[0] - ux * o1 - uy * j}
          y1={a[1] - uy * o1 + ux * j}
          x2={b[0] + ux * o2 + uy * j}
          y2={b[1] + uy * o2 - ux * j}
          stroke={ink}
          strokeWidth={width}
          strokeLinecap="round"
        />
      );
    })}
  </>
);

// ---------------------------------------------------------------- BoxBot
export type BoxExpression = 'dots' | 'blink' | 'squint' | 'happy' | 'sleep' | 'worried' | 'angry' | 'surprised';
export type BoxBotPose = {
  /** degrees; + turns the face toward screen-right */
  yaw?: number;
  /** camera elevation in degrees (how much of the top you see) */
  pitch?: number;
  /** walk phase in cycles (leg pairs alternate); undefined = standing */
  walk?: number;
  /** 0..1 leg swing amount */
  stride?: number;
  sx?: number;
  sy?: number;
  /** screen roll in degrees around the feet */
  lean?: number;
  /** arm raise in degrees (0 = hanging, 180 = straight up); L = screen-left side of the body */
  armL?: number;
  armR?: number;
  /** -1..1 eye look */
  look?: number;
  lookY?: number;
  /** 0..1 legs tucked (airborne) */
  tuck?: number;
};

export type BoxBotProps = {
  id: string;
  /** ground contact point (centre between the feet) in px */
  x: number;
  y: number;
  /** body width in px */
  size: number;
  style?: CharStyle;
  palette?: Partial<BotPalette>;
  pose?: BoxBotPose;
  expression?: BoxExpression;
  legs?: 'quad' | 'row';
  snout?: boolean;
  flower?: boolean;
  brows?: boolean;
  /** body height / width */
  hr?: number;
  /** body depth / width */
  dr?: number;
  opacity?: number;
  seed?: number;
};

/** eyes + brows + snout drawn in front-face local coords (W x H, v down) */
const BotFace: React.FC<{W: number; H: number; expression: BoxExpression; look: number; lookY: number; pal: BotPalette; brows: boolean; snout: boolean; style: CharStyle}> = ({
  W,
  H,
  expression,
  look,
  lookY,
  pal,
  brows,
  snout,
  style,
}) => {
  const ew = W * 0.095 * (expression === 'surprised' ? 1.25 : 1);
  const eh = H * 0.2 * (expression === 'surprised' ? 1.2 : 1);
  const ey = H * 0.42 + lookY * H * 0.05;
  const sw = H * 0.045;
  const xs = [W * 0.5 - W * 0.21 + look * W * 0.07, W * 0.5 + W * 0.21 + look * W * 0.07];
  const eyes = xs.map((ex, i) => {
    const side = i === 0 ? -1 : 1;
    switch (expression) {
      case 'blink':
      case 'sleep':
        return <line key={i} x1={ex - ew * 0.75} y1={ey + eh * 0.15} x2={ex + ew * 0.75} y2={ey + eh * 0.15} stroke={pal.eye} strokeWidth={sw} strokeLinecap="round" />;
      case 'happy':
        return (
          <polyline key={i} points={`${ex - ew * 0.8},${ey + eh * 0.25} ${ex},${ey - eh * 0.2} ${ex + ew * 0.8},${ey + eh * 0.25}`} fill="none" stroke={pal.eye} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        );
      case 'squint':
        return (
          <polyline
            key={i}
            points={`${ex - side * ew * 0.75},${ey - eh * 0.3} ${ex + side * ew * 0.55},${ey} ${ex - side * ew * 0.75},${ey + eh * 0.3}`}
            fill="none"
            stroke={pal.eye}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      default:
        return (
          <g key={i}>
            <rect x={ex - ew / 2} y={ey - eh / 2} width={ew} height={eh} rx={style === 'clean' ? ew * 0.22 : ew * 0.08} fill={pal.eye} />
            <circle cx={ex - ew * 0.12 + look * ew * 0.12} cy={ey - eh * 0.22} r={ew * 0.22} fill="#fff" />
          </g>
        );
    }
  });
  const browTilt = expression === 'worried' ? -16 : expression === 'angry' ? 18 : expression === 'surprised' ? -4 : expression === 'happy' ? -6 : 6;
  const browY = ey - eh * (expression === 'surprised' ? 1.0 : 0.85);
  return (
    <g>
      {brows &&
        xs.map((ex, i) => {
          const side = i === 0 ? -1 : 1;
          const a = rad(browTilt * side);
          const bl = ew * 1.1;
          return (
            <line
              key={`b${i}`}
              x1={ex - Math.cos(a) * bl * 0.5}
              y1={browY - Math.sin(a) * bl * 0.5}
              x2={ex + Math.cos(a) * bl * 0.5}
              y2={browY + Math.sin(a) * bl * 0.5}
              stroke={pal.ink}
              strokeWidth={sw * 0.55}
              strokeLinecap="round"
            />
          );
        })}
      {eyes}
      {snout && (
        <g>
          <rect x={W * 0.5 - W * 0.14 + look * W * 0.04} y={H * 0.6} width={W * 0.28} height={H * 0.2} rx={H * 0.05} fill={pal.snout} stroke={style === 'clean' ? 'none' : pal.ink} strokeWidth={sw * 0.5} />
          {[-1, 1].map((s) => (
            <ellipse key={s} cx={W * 0.5 + s * W * 0.06 + look * W * 0.04} cy={H * 0.7} rx={W * 0.022} ry={H * 0.04} fill={pal.eye} opacity={0.85} />
          ))}
        </g>
      )}
      {expression === 'surprised' && <ellipse cx={W * 0.5 + look * W * 0.05} cy={H * 0.74} rx={W * 0.035} ry={H * 0.055} fill={pal.eye} />}
    </g>
  );
};

export const BoxBot: React.FC<BoxBotProps> = ({
  id,
  x,
  y,
  size,
  style = 'sketch',
  palette,
  pose = {},
  expression = 'dots',
  legs = 'quad',
  snout = false,
  flower = false,
  brows,
  hr = 0.8,
  dr = 0.75,
  opacity = 1,
  seed = 1,
}) => {
  const pal: BotPalette = {...BOT_PALETTES[style], ...(palette ?? {})};
  const W = size;
  const H = size * hr;
  const D = size * dr;
  const legH = H * 0.3;
  const cam: Cam = {yaw: rad(pose.yaw ?? 0), pitch: rad(pose.pitch ?? 16)};
  const stride = pose.stride ?? 1;
  const tuck = pose.tuck ?? 0;
  const k = size / 300;
  const showBrows = brows ?? style === 'sketch';

  const parts: Part[] = [];
  // legs
  const legDefs =
    legs === 'quad'
      ? [
          {lx: -0.3 * W, lz: 0.24 * D, pair: 0},
          {lx: 0.3 * W, lz: 0.24 * D, pair: 1},
          {lx: -0.3 * W, lz: -0.24 * D, pair: 1},
          {lx: 0.3 * W, lz: -0.24 * D, pair: 0},
        ]
      : [-0.36, -0.12, 0.12, 0.36].map((f, i) => ({lx: f * W, lz: 0.05 * D, pair: i % 2}));
  const lw = legs === 'quad' ? 0.2 * W : 0.13 * W;
  const ld = legs === 'quad' ? 0.2 * W : 0.22 * D;
  legDefs.forEach((L, i) => {
    let lift = 0;
    let swing = 0;
    if (pose.walk !== undefined) {
      const ph = 2 * Math.PI * (pose.walk + L.pair * 0.5);
      lift = Math.max(0, Math.sin(ph)) * 0.14 * H * stride;
      swing = Math.cos(ph) * rad(12) * stride;
    }
    const len = legH * (1 - 0.35 * tuck);
    parts.push(
      cuboid([-lw / 2, -len, -ld / 2], [lw / 2, 0, ld / 2], (p) => add(rotX(p, swing), [L.lx, legH + lift + legH * 0.35 * tuck * 0.5, L.lz]), cam, 'leg', `l${i}`),
    );
  });
  // arms
  const aw = 0.1 * W;
  const al = 0.36 * H;
  const ad = 0.16 * D;
  const armSwing = pose.walk !== undefined ? Math.cos(2 * Math.PI * pose.walk) * rad(14) * stride : 0;
  [-1, 1].forEach((side) => {
    const raise = rad(side < 0 ? pose.armL ?? 16 : pose.armR ?? 16);
    const sh: V3 = [side * W * 0.5, legH + H * 0.56, D * 0.08];
    const min: V3 = side > 0 ? [0, -al, -ad / 2] : [-aw, -al, -ad / 2];
    const max: V3 = side > 0 ? [aw, 0, ad / 2] : [0, 0, ad / 2];
    parts.push(cuboid(min, max, (p) => add(rotX(rotZ(p, side * raise), armSwing * side), sh), cam, 'arm', `a${side}`));
  });
  // body
  const body = cuboid([-W / 2, legH, -D / 2], [W / 2, legH + H, D / 2], (p) => p, cam, 'body', 'body');
  const legParts = parts.filter((p) => p.kind === 'leg').sort((a, b) => a.depth - b.depth);
  const upper = [...parts.filter((p) => p.kind === 'arm'), body].sort((a, b) => a.depth - b.depth);

  const hatchId = `${id}-hatch`;
  const hatch2Id = `${id}-hatch2`;
  const renderPart = (part: Part) => {
    const isLeg = part.kind === 'leg';
    const base = isLeg ? pal.leg : pal.body;
    const sh = isLeg ? mixHex(pal.leg, pal.shade, 0.6) : pal.shade;
    return (
      <g key={part.key}>
        {part.faces.map((f, fi) => {
          const fill = faceFill(f.light, base, sh, pal.top);
          const sd = seed * 31 + fi * 7 + part.key.charCodeAt(0) * 3 + (part.key.charCodeAt(1) || 0);
          if (style === 'sketch') {
            return (
              <g key={fi}>
                <polygon points={ptsStr(f.pts)} fill={fill} />
                <polygon points={ptsStr(f.pts)} fill={`url(#${hatchId})`} />
                {f.light < 0.3 && <polygon points={ptsStr(f.pts)} fill={`url(#${hatch2Id})`} />}
                <SketchEdges pts={f.pts} k={k} ink={pal.ink} seed={sd} width={(part.kind === 'body' ? 2.4 : 1.8) * k} />
              </g>
            );
          }
          if (style === 'toon') {
            return <polygon key={fi} points={ptsStr(f.pts)} fill={fill} stroke={pal.ink} strokeWidth={0.022 * size} strokeLinejoin="round" />;
          }
          return <polygon key={fi} points={ptsStr(f.pts)} fill={fill} stroke={fill} strokeWidth={0.03 * size} strokeLinejoin="round" />;
        })}
        {part.kind === 'body' &&
          part.faces
            .filter((f) => f.name === 'front')
            .map((f) => (
              <g key="face" transform={f.mat}>
                <BotFace W={W} H={H} expression={expression} look={pose.look ?? 0} lookY={pose.lookY ?? 0} pal={pal} brows={showBrows} snout={snout} style={style} />
              </g>
            ))}
        {part.kind === 'body' && style === 'sketch' &&
          part.faces
            .filter((f) => f.name === 'front')
            .map((f) => (
              <g key="hl" transform={f.mat}>
                <line x1={W * 0.08} y1={H * 0.08} x2={W * 0.62} y2={H * 0.075} stroke="#F2B49A" strokeWidth={H * 0.012} opacity={0.8} />
              </g>
            ))}
        {part.kind === 'body' && flower &&
          part.faces
            .filter((f) => f.name === 'top')
            .map((f) => {
              const c: P2 = [(f.pts[0][0] + f.pts[2][0]) / 2, (f.pts[0][1] + f.pts[2][1]) / 2];
              const r = W * 0.07;
              return (
                <g key="fl" transform={`translate(${c[0]},${c[1] - r * 0.6})`}>
                  <line x1={0} y1={r * 0.6} x2={0} y2={r * 1.6} stroke="#5FA55A" strokeWidth={r * 0.25} />
                  {Array.from({length: 5}, (_, i) => {
                    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
                    return <circle key={i} cx={Math.cos(a) * r * 0.75} cy={Math.sin(a) * r * 0.6} r={r * 0.55} fill={pal.flower} stroke={style === 'clean' ? 'none' : pal.ink} strokeWidth={k * 1.2} />;
                  })}
                  <circle r={r * 0.4} fill="#F4D780" stroke={style === 'clean' ? 'none' : pal.ink} strokeWidth={k * 1.2} />
                </g>
              );
            })}
      </g>
    );
  };

  const sx = pose.sx ?? 1;
  const sy = pose.sy ?? 1;
  return (
    <g transform={`translate(${x},${y}) rotate(${pose.lean ?? 0}) scale(${sx},${sy})`} opacity={opacity}>
      {style === 'sketch' && (
        <defs>
          <pattern id={hatchId} patternUnits="userSpaceOnUse" width={6 * k} height={6 * k} patternTransform="rotate(-62)">
            <line x1={0} y1={0} x2={0} y2={6 * k} stroke={pal.ink} strokeWidth={1.2 * k} opacity={0.3} strokeDasharray={`${40 * k} ${6 * k}`} />
          </pattern>
          <pattern id={hatch2Id} patternUnits="userSpaceOnUse" width={5 * k} height={5 * k} patternTransform="rotate(28)">
            <line x1={0} y1={0} x2={0} y2={5 * k} stroke={pal.ink} strokeWidth={1 * k} opacity={0.24} />
          </pattern>
        </defs>
      )}
      {legParts.map(renderPart)}
      {upper.map(renderPart)}
    </g>
  );
};

// ---------------------------------------------------------------- MiniBot (crowd sprite)
/** front-view box-bot sprite: ~10 elements. (x,y) = feet, size = body width. */
export const MiniBot: React.FC<{x: number; y: number; size: number; body: string; shade: string; eye: string; ink?: string; arms?: number; blink?: boolean; outline?: boolean; topK?: number}> = ({
  x,
  y,
  size,
  body,
  shade,
  eye,
  ink = '#16081C',
  arms = 15,
  blink = false,
  outline = true,
  topK = 0.22,
}) => {
  const W = size;
  const H = size * 0.78;
  const lh = H * 0.28;
  const top = H * topK;
  const sw = outline ? Math.max(0.6, size * 0.03) : 0;
  const st = outline ? ink : 'none';
  const lw = W * 0.13;
  const by = -lh - H;
  return (
    <g transform={`translate(${x},${y})`}>
      {[-0.34, -0.12, 0.12, 0.34].map((f, i) => (
        <rect key={i} x={f * W - lw / 2} y={-lh - 1} width={lw} height={lh + 1} fill={i % 2 ? shade : mixHex(shade, body, 0.4)} stroke={st} strokeWidth={sw * 0.8} />
      ))}
      {[-1, 1].map((s) => (
        <rect
          key={s}
          x={s > 0 ? W / 2 - W * 0.02 : -W / 2 - W * 0.1}
          y={by + H * 0.45}
          width={W * 0.12}
          height={H * 0.32}
          fill={shade}
          stroke={st}
          strokeWidth={sw * 0.8}
          transform={`rotate(${-s * arms} ${s * W * 0.5} ${by + H * 0.48})`}
        />
      ))}
      <polygon points={`${-W / 2},${by} ${-W / 2 + W * 0.08},${by - top} ${W / 2 + W * 0.08},${by - top} ${W / 2},${by}`} fill={mixHex(body, '#ffffff', 0.25)} stroke={st} strokeWidth={sw} strokeLinejoin="round" />
      <rect x={-W / 2} y={by} width={W} height={H} fill={body} stroke={st} strokeWidth={sw} strokeLinejoin="round" />
      <rect x={W / 2 - W * 0.12} y={by} width={W * 0.12} height={H} fill={shade} opacity={0.35} />
      {[-1, 1].map((s) =>
        blink ? (
          <rect key={s} x={s * W * 0.2 - W * 0.06} y={by + H * 0.45} width={W * 0.12} height={Math.max(1, H * 0.04)} fill={eye} />
        ) : (
          <rect key={s} x={s * W * 0.2 - W * 0.045} y={by + H * 0.3} width={W * 0.09} height={H * 0.24} fill={eye} />
        ),
      )}
    </g>
  );
};

// ---------------------------------------------------------------- Blob (video7)
export type BlobProps = {
  id: string;
  /** contact point with the ground */
  x: number;
  y: number;
  r: number;
  sx?: number;
  sy?: number;
  /** roll angle in radians (eyes come round when cos > 0.2) */
  roll?: number;
  /** 0 closed .. 1 open */
  eyesOpen?: number;
  look?: number;
  body?: string;
  shade?: string;
  eye?: string;
  blush?: string;
};
export const Blob: React.FC<BlobProps> = ({id, x, y, r, sx = 1, sy = 1, roll = 0, eyesOpen = 1, look = 0, body = '#F9F4EE', shade = '#D9D2CA', eye = '#160A00', blush = '#F3A58C'}) => {
  const face = Math.cos(roll);
  const off = Math.sin(roll);
  const eyeVis = clamp((face - 0.15) / 0.3);
  return (
    <g transform={`translate(${x},${y}) scale(${sx},${sy})`}>
      <defs>
        <radialGradient id={`${id}-g`} cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor={body} />
          <stop offset="100%" stopColor={shade} />
        </radialGradient>
      </defs>
      <circle cx={0} cy={-r} r={r} fill={`url(#${id}-g)`} />
      {eyeVis > 0 &&
        [-1, 1].map((s) => {
          const ex = (off * 0.72 + s * 0.17 * face + look * 0.12) * r;
          return (
            <g key={s} opacity={eyeVis}>
              <ellipse cx={ex} cy={-r * 0.92} rx={r * 0.075 * Math.max(0.3, face)} ry={r * 0.13 * Math.max(0.12, eyesOpen)} fill={eye} />
              {eyesOpen > 0.5 && <circle cx={ex - r * 0.025} cy={-r * 0.97} r={r * 0.025} fill="#fff" />}
            </g>
          );
        })}
      {eyeVis > 0 && [-1, 1].map((s) => <ellipse key={`c${s}`} cx={(off * 0.72 + s * 0.34 * face) * r} cy={-r * 0.74} rx={r * 0.08 * face} ry={r * 0.05} fill={blush} opacity={0.45 * eyeVis} />)}
      <ellipse cx={-r * 0.38} cy={-r * 1.48} rx={r * 0.14} ry={r * 0.09} fill="#fff" opacity={0.9} transform={`rotate(-30 ${-r * 0.38} ${-r * 1.48})`} />
    </g>
  );
};

// ---------------------------------------------------------------- Chibi explorer (video14)
export type ChibiSkin = {
  skin: string;
  hair: string;
  hat: string;
  band: string;
  shirt: string;
  shorts: string;
  shoe: string;
  line: string;
  glass: string;
  cheek: string;
  lineW: number;
  /** crayon | pixel | rgb | none */
  fx?: 'crayon' | 'pixel' | 'rgb' | 'ink' | 'none';
};
export const CHIBI_SKINS: Record<string, ChibiSkin> = {
  clean: {skin: '#F1C9A5', hair: '#2B2320', hat: '#FBF8F1', band: '#E6DECF', shirt: '#FFFFFF', shorts: '#D8902F', shoe: '#F7F4ED', line: '#2B2320', glass: '#1E1A18', cheek: '#F2A08A', lineW: 3.2},
  cave: {skin: '#D9A273', hair: '#3B2414', hat: '#F1E6D0', band: '#C9A67C', shirt: '#F3EBDD', shorts: '#C98A3C', shoe: '#EFE4D0', line: '#4A2E1A', glass: '#3B2414', cheek: '#D9785A', lineW: 3.8, fx: 'crayon'},
  egypt: {skin: '#A0603C', hair: '#1B1410', hat: '#F7F1E1', band: '#2F5D87', shirt: '#FBF6E8', shorts: '#E9DDBF', shoe: '#F4EEDC', line: '#2A2234', glass: '#1B1410', cheek: '#B86A44', lineW: 3},
  greek: {skin: '#1B100A', hair: '#1B100A', hat: '#1B100A', band: '#1B100A', shirt: '#1B100A', shorts: '#1B100A', shoe: '#1B100A', line: '#E8834E', glass: '#E8834E', cheek: '#1B100A', lineW: 2.2},
  ink: {skin: '#F6EFE2', hair: '#1A1714', hat: '#F8F3E8', band: '#D8CFBF', shirt: '#F8F3E8', shorts: '#EDE4D3', shoe: '#F8F3E8', line: '#1A1714', glass: '#1A1714', cheek: '#E8C8B8', lineW: 4.4, fx: 'ink'},
  pixel: {skin: '#FFC890', hair: '#3A1E0E', hat: '#FFFFFF', band: '#E83A3A', shirt: '#F0F0F0', shorts: '#2C6BE0', shoe: '#E83A3A', line: '#0B0822', glass: '#0B0822', cheek: '#FF8A6A', lineW: 4, fx: 'pixel'},
  vaporwave: {skin: '#F7C2D8', hair: '#3A0F57', hat: '#FF71CE', band: '#01CDFE', shirt: '#B967FF', shorts: '#01CDFE', shoe: '#FFFB96', line: '#24062F', glass: '#24062F', cheek: '#FF71CE', lineW: 3.2, fx: 'rgb'},
};

export type ChibiPose = {
  /** walk phase in cycles; undefined = stand */
  walk?: number;
  /** arm angles in degrees (0 = hanging, +forward, 180 = up) — override walk */
  armF?: number;
  armB?: number;
  legF?: number;
  legB?: number;
  /** 0..1 body bob/squash */
  sy?: number;
  /** wave: arm F oscillation */
  wave?: number;
  blink?: boolean;
  smile?: boolean;
};

export const chibiWalk = (phase: number): Required<Pick<ChibiPose, 'armF' | 'armB' | 'legF' | 'legB'>> & {bob: number} => {
  const s = Math.sin(2 * Math.PI * phase);
  return {legF: 25 * s, legB: -25 * s, armF: -20 * s, armB: 20 * s, bob: Math.abs(Math.cos(2 * Math.PI * phase))};
};

const ChibiBody: React.FC<{skin: ChibiSkin; pose: ChibiPose}> = ({skin: S, pose}) => {
  const w = pose.walk !== undefined ? chibiWalk(pose.walk) : {legF: 0, legB: 0, armF: 4, armB: -4, bob: 1};
  const legF = pose.legF ?? w.legF;
  const legB = pose.legB ?? w.legB;
  const armF = pose.armF ?? w.armF;
  const armB = pose.armB ?? w.armB;
  const bobY = -(1 - w.bob) * 5;
  const lw = S.lineW;
  const limb = (x0: number, y0: number, ang: number, len: number, wdt: number, col: string) => {
    const a = rad(ang);
    const x1 = x0 + Math.sin(a) * len;
    const y1 = y0 + Math.cos(a) * len;
    return {x1, y1, el: [<line key="o" x1={x0} y1={y0} x2={x1} y2={y1} stroke={S.line} strokeWidth={wdt + lw * 2} strokeLinecap="round" />, <line key="i" x1={x0} y1={y0} x2={x1} y2={y1} stroke={col} strokeWidth={wdt} strokeLinecap="round" />]};
  };
  const leg = (hx: number, ang: number, key: string, dim: number) => {
    const L = limb(hx, -72, ang, 56, 17, dim ? mixHex(S.skin, '#000', dim) : S.skin);
    return (
      <g key={key}>
        {L.el}
        <rect x={L.x1 - 11} y={L.y1 - 6} width={36} height={17} rx={8} fill={dim ? mixHex(S.shoe, '#000', dim) : S.shoe} stroke={S.line} strokeWidth={lw} />
      </g>
    );
  };
  const arm = (ang: number, key: string, dim: number) => {
    const sx = 2;
    const sy = -146;
    const col = dim ? mixHex(S.skin, '#000', dim) : S.skin;
    const L = limb(sx, sy, ang, 46 + 12 * clamp((Math.abs(ang) - 80) / 60), 12, col);
    const a = rad(ang);
    return (
      <g key={key}>
        {L.el}
        <circle cx={L.x1} cy={L.y1} r={9} fill={col} stroke={S.line} strokeWidth={lw} />
        <line x1={sx} y1={sy} x2={sx + Math.sin(a) * 14} y2={sy + Math.cos(a) * 14} stroke={S.line} strokeWidth={24 + lw * 2} strokeLinecap="round" />
        <line x1={sx} y1={sy} x2={sx + Math.sin(a) * 14} y2={sy + Math.cos(a) * 14} stroke={dim ? mixHex(S.shirt, '#000', dim) : S.shirt} strokeWidth={24} strokeLinecap="round" />
      </g>
    );
  };
  return (
    <g transform={`translate(0,${bobY})`}>
      {Math.abs(armB) <= 95 && arm(armB, 'ab', 0.12)}
      {leg(-6, legB, 'lb', 0.1)}
      {leg(6, legF, 'lf', 0)}
      <path d="M -27 -104 L 27 -104 L 29 -70 L 4 -68 L 0 -78 L -4 -68 L -29 -70 Z" fill={S.shorts} stroke={S.line} strokeWidth={lw} strokeLinejoin="round" />
      <rect x={-29} y={-162} width={58} height={64} rx={16} fill={S.shirt} stroke={S.line} strokeWidth={lw} />
      {armF <= 95 && arm(armF, 'af', 0)}
      {/* head */}
      <g transform="translate(0,0)">
        <path d="M -50 -236 C -60 -212, -54 -186, -34 -176 L -14 -196 Z" fill={S.hair} stroke={S.line} strokeWidth={lw} strokeLinejoin="round" />
        <circle cx={8} cy={-212} r={58} fill={S.skin} stroke={S.line} strokeWidth={lw} />
        <path d="M -46 -232 C -40 -206, -30 -196, -16 -192 C -20 -208, -18 -222, -6 -236 Z" fill={S.hair} />
        <circle cx={-10} cy={-206} r={10} fill={S.skin} stroke={S.line} strokeWidth={lw} />
        <path d="M 4 -236 C 20 -228, 44 -226, 64 -232 L 62 -240 L 4 -242 Z" fill={S.hair} />
        <ellipse cx={26} cy={-186} rx={9} ry={5} fill={S.cheek} opacity={0.55} />
        {/* glasses */}
        <line x1={-2} y1={-210} x2={16} y2={-208} stroke={S.glass} strokeWidth={3.5} strokeLinecap="round" />
        <circle cx={32} cy={-207} r={15} fill="#FFFFFF" fillOpacity={0.18} stroke={S.glass} strokeWidth={4.5} />
        <circle cx={60} cy={-207} r={10.5} fill="#FFFFFF" fillOpacity={0.18} stroke={S.glass} strokeWidth={4} />
        <line x1={47} y1={-208} x2={50} y2={-208} stroke={S.glass} strokeWidth={3.5} />
        {pose.blink ? (
          <>
            <line x1={29} y1={-206} x2={39} y2={-206} stroke={S.line} strokeWidth={3} strokeLinecap="round" />
            <line x1={57} y1={-206} x2={64} y2={-206} stroke={S.line} strokeWidth={3} strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={35} cy={-206} r={4.6} fill={S.line} />
            <circle cx={61} cy={-206} r={3.8} fill={S.line} />
          </>
        )}
        <path d={pose.smile ? 'M 38 -184 Q 48 -174 56 -186' : 'M 40 -182 Q 47 -178 53 -183'} fill="none" stroke={S.line} strokeWidth={3} strokeLinecap="round" />
        {/* bucket hat */}
        <path d="M -44 -240 C -44 -296, 62 -298, 62 -240 Z" fill={S.hat} stroke={S.line} strokeWidth={lw} strokeLinejoin="round" />
        <path d="M -45 -252 C -10 -258, 30 -258, 62 -252 L 62 -241 C 30 -246, -10 -246, -45 -241 Z" fill={S.band} />
        <ellipse cx={9} cy={-240} rx={76} ry={15} fill={S.hat} stroke={S.line} strokeWidth={lw} />
        <path d="M -40 -244 C 0 -236, 30 -236, 58 -244" fill="none" stroke={S.line} strokeWidth={lw * 0.6} opacity={0.5} />
      </g>
      {/* raised arms come in front of the big chibi head */}
      {Math.abs(armB) > 95 && arm(armB, 'ab', 0.12)}
      {armF > 95 && arm(armF, 'af', 0)}
    </g>
  );
};

/** chibi explorer, (x,y) = feet on baseline, height in px, facing right (facing -1 flips). */
export const Chibi: React.FC<{id: string; x: number; y: number; height: number; skin?: ChibiSkin; pose?: ChibiPose; facing?: number; sy?: number; sx?: number; rotate?: number; frame?: number}> = ({
  id,
  x,
  y,
  height,
  skin = CHIBI_SKINS.clean,
  pose = {},
  facing = 1,
  sy = 1,
  sx = 1,
  rotate = 0,
  frame = 0,
}) => {
  const s = height / 300;
  const fx = skin.fx ?? 'none';
  const tf = `translate(${x},${y}) rotate(${rotate}) scale(${s * facing * sx},${s * sy})`;
  const body = <ChibiBody skin={skin} pose={pose} />;
  if (fx === 'rgb') {
    return (
      <g>
        <g transform={tf}>
          <g transform="translate(-9,0)" opacity={0.55} style={{mixBlendMode: 'screen'}}>
            <g filter={`url(#${id}-cy)`}>{body}</g>
          </g>
          <g transform="translate(9,0)" opacity={0.55} style={{mixBlendMode: 'screen'}}>
            <g filter={`url(#${id}-mg)`}>{body}</g>
          </g>
          {body}
        </g>
        <defs>
          <filter id={`${id}-cy`}>
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0.9  0 0 0 0 1  0 0 0 1 0" />
          </filter>
          <filter id={`${id}-mg`}>
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.1  0 0 0 0 0.85  0 0 0 1 0" />
          </filter>
        </defs>
      </g>
    );
  }
  if (fx === 'pixel') {
    const b = 9;
    return (
      <g transform={tf}>
        <defs>
          <filter id={`${id}-px`} x="-100" y="-320" width="220" height="340" filterUnits="userSpaceOnUse">
            <feFlood x={-100 + b / 2} y={-320 + b / 2} width={1} height={1} />
            <feComposite width={b} height={b} />
            <feTile result="a" />
            <feComposite in="SourceGraphic" in2="a" operator="in" />
            <feMorphology operator="dilate" radius={b / 2} />
          </filter>
        </defs>
        <g filter={`url(#${id}-px)`}>{body}</g>
      </g>
    );
  }
  if (fx === 'crayon' || fx === 'ink') {
    const seed = Math.floor(frame / 3) % 7;
    return (
      <g transform={tf}>
        <defs>
          <filter id={`${id}-cr${seed}`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency={fx === 'crayon' ? 0.09 : 0.05} numOctaves={2} seed={seed} />
            <feDisplacementMap in="SourceGraphic" scale={fx === 'crayon' ? 5 : 3.5} />
          </filter>
        </defs>
        <g filter={`url(#${id}-cr${seed})`}>{body}</g>
      </g>
    );
  }
  return <g transform={tf}>{body}</g>;
};

// ---------------------------------------------------------------- PaperDoll (video20 crowd)
export const PaperDoll: React.FC<{x: number; y: number; h: number; shirt: string; pants: string; skin: string; hair: string; ink?: string; arm?: number; bob?: number}> = ({
  x,
  y,
  h,
  shirt,
  pants,
  skin,
  hair,
  ink = '#2E2A26',
  arm = 145,
  bob = 0,
}) => {
  const s = h / 100;
  const sw = 2.2;
  return (
    <g transform={`translate(${x},${y - bob}) scale(${s})`}>
      <rect x={-11} y={-40} width={9} height={40} fill={pants} stroke={ink} strokeWidth={sw} />
      <rect x={2} y={-40} width={9} height={40} fill={pants} stroke={ink} strokeWidth={sw} />
      {[-1, 1].map((d) => {
        const a = rad(arm);
        const x0 = d * 12;
        const y0 = -70;
        const x1 = x0 + d * Math.sin(a) * 30;
        const y1 = y0 + Math.cos(a) * 30;
        return (
          <g key={d}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={ink} strokeWidth={8 + sw * 2} strokeLinecap="round" />
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={skin} strokeWidth={8} strokeLinecap="round" />
          </g>
        );
      })}
      <rect x={-14} y={-76} width={28} height={40} rx={3} fill={shirt} stroke={ink} strokeWidth={sw} />
      <circle cx={0} cy={-90} r={13} fill={skin} stroke={ink} strokeWidth={sw} />
      <path d="M -13 -92 C -13 -108, 13 -108, 13 -92 C 8 -98, -8 -98, -13 -92 Z" fill={hair} stroke={ink} strokeWidth={sw * 0.8} />
      <circle cx={-4.5} cy={-89} r={1.6} fill={ink} />
      <circle cx={4.5} cy={-89} r={1.6} fill={ink} />
      <path d="M -4 -83 Q 0 -79 4 -83" fill="none" stroke={ink} strokeWidth={1.4} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------- InkSoldier (video5)
export const InkSoldier: React.FC<{x: number; y: number; h: number; ink?: string; mid?: string; light?: string; detail?: boolean}> = ({x, y, h, ink = '#2D3A6F', mid = '#6A74A2', light = '#E6E9F3', detail = true}) => {
  const s = h / 100;
  const sw = 2.4;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <line x1={-30} y1={2} x2={-30} y2={-128} stroke={ink} strokeWidth={2.6} />
      <path d="M -30 -136 L -34 -126 L -26 -126 Z" fill={ink} />
      <rect x={-15} y={-20} width={11} height={20} rx={3} fill={mid} stroke={ink} strokeWidth={sw} />
      <rect x={4} y={-20} width={11} height={20} rx={3} fill={mid} stroke={ink} strokeWidth={sw} />
      <rect x={-22} y={-52} width={44} height={36} rx={8} fill={light} stroke={ink} strokeWidth={sw} />
      {detail && [0, 1, 2].map((i) => <line key={i} x1={-20} y1={-40 + i * 7} x2={20} y2={-40 + i * 7} stroke={mid} strokeWidth={1.6} />)}
      <rect x={-21} y={-86} width={42} height={34} rx={9} fill={light} stroke={ink} strokeWidth={sw} />
      <rect x={-11} y={-74} width={6} height={5} fill={ink} />
      <rect x={5} y={-74} width={6} height={5} fill={ink} />
      <path d="M -25 -82 C -25 -110, 25 -110, 25 -82 Z" fill={mid} stroke={ink} strokeWidth={sw} />
      <rect x={-27} y={-84} width={54} height={6} rx={3} fill={light} stroke={ink} strokeWidth={sw * 0.8} />
      <path d="M -4 -104 C -2 -116, 6 -116, 8 -104" fill={ink} />
      {detail && <path d="M -18 -92 L 18 -100 M -14 -88 L 20 -96" stroke={ink} strokeWidth={1} opacity={0.5} />}
      <rect x={8} y={-60} width={26} height={46} rx={6} fill={mid} stroke={ink} strokeWidth={sw} />
      <circle cx={21} cy={-37} r={5} fill={light} stroke={ink} strokeWidth={1.6} />
      {detail && <path d="M 12 -54 L 30 -20 M 30 -54 L 12 -20" stroke={ink} strokeWidth={1} opacity={0.45} />}
    </g>
  );
};

// ---------------------------------------------------------------- Emote icons (video20 emote-icon-pop)
export type EmoteType = '?' | '!' | 'heart' | 'bulb' | 'sweat' | 'scribble' | 'sparkle' | 'zzz';
/** doodle icon anchored at its bottom centre. `t` = frames since start, `dur` = total frames (fade 5 f at the end). */
export const Emote: React.FC<{id: string; type: EmoteType; x: number; y: number; size: number; t: number; dur: number; ink?: string; color?: string; frame?: number}> = ({
  id,
  type,
  x,
  y,
  size,
  t,
  dur,
  ink = '#2E2A26',
  color,
  frame = 0,
}) => {
  if (t < 0 || t > dur) return null;
  const op = interpolate(t, [0, 1, Math.max(2, dur - 5), dur], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sc = interpolate(t, [0, 2], [0.85, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s = (size / 100) * sc;
  let body: React.ReactNode = null;
  switch (type) {
    case '?':
      body = (
        <g>
          <path d="M -22 -80 C -24 -108, 28 -110, 24 -78 C 21 -58, 0 -58, 1 -36" fill="none" stroke={color ?? ink} strokeWidth={9} strokeLinecap="round" />
          <circle cx={1} cy={-14} r={6.5} fill={color ?? ink} />
        </g>
      );
      break;
    case '!':
      body = (
        <g>
          <path d="M -12 -100 L 12 -100 L 5 -36 L -5 -36 Z" fill={color ?? '#D65A5A'} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
          <circle cx={0} cy={-16} r={8} fill={color ?? '#D65A5A'} stroke={ink} strokeWidth={4} />
          <line x1={-24} y1={-92} x2={-38} y2={-104} stroke={ink} strokeWidth={4} strokeLinecap="round" />
          <line x1={24} y1={-92} x2={38} y2={-104} stroke={ink} strokeWidth={4} strokeLinecap="round" />
          <line x1={-28} y1={-70} x2={-44} y2={-70} stroke={ink} strokeWidth={4} strokeLinecap="round" />
        </g>
      );
      break;
    case 'heart': {
      const heart = (hs: number) => `M 0 ${hs * 0.35} C ${-hs} ${-hs * 0.25}, ${-hs * 0.5} ${-hs * 0.98}, 0 ${-hs * 0.45} C ${hs * 0.5} ${-hs * 0.98}, ${hs} ${-hs * 0.25}, 0 ${hs * 0.35} Z`;
      body = (
        <g>
          {[0, 1, 2].map((k) => {
            const tk = t - k * 6;
            if (tk < 0) return null;
            const rise = tk * 1.4;
            const o = clamp(1 - (tk - 20) / 14) * clamp(tk / 2);
            return (
              <g key={k} transform={`translate(${(k - 1) * 30},${-40 - rise - (k % 2) * 12}) rotate(${(k - 1) * 10})`} opacity={o}>
                <path d={heart(k === 1 ? 34 : 24)} fill={color ?? '#E38C76'} stroke="#C0403E" strokeWidth={3.5} strokeLinejoin="round" />
              </g>
            );
          })}
        </g>
      );
      break;
    }
    case 'bulb':
      body = (
        <g>
          <defs>
            <radialGradient id={`${id}-bg`}>
              <stop offset="0%" stopColor="#FFF3B0" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#FFF3B0" stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={0} cy={-62} r={48} fill={`url(#${id}-bg)`} />
          <path d="M -26 -64 C -26 -100, 26 -100, 26 -64 C 26 -48, 12 -44, 11 -32 L -11 -32 C -12 -44, -26 -48, -26 -64 Z" fill={color ?? '#F4D780'} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
          <rect x={-11} y={-32} width={22} height={14} rx={3} fill="#B1A79A" stroke={ink} strokeWidth={3.5} />
          <path d="M -7 -48 L -4 -64 L 4 -56 L 7 -70" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
          {[-1, 0, 1].map((k) => (
            <line key={k} x1={k * 40} y1={-100 + Math.abs(k) * 22} x2={k * 52} y2={-112 + Math.abs(k) * 26} stroke={ink} strokeWidth={4} strokeLinecap="round" />
          ))}
        </g>
      );
      break;
    case 'sweat':
      body = <path d="M 20 -92 C 6 -70, 0 -58, 8 -48 C 16 -40, 34 -44, 34 -58 C 34 -68, 26 -78, 20 -92 Z" fill={color ?? '#8BB8E8'} stroke={ink} strokeWidth={4} strokeLinejoin="round" />;
      break;
    case 'scribble': {
      const seed = Math.floor((frame * 24) / 30);
      const r = rng(seed * 13 + 5);
      let d = '';
      for (let k = 0; k < 8; k++) {
        const cx = (r() - 0.5) * 18;
        const cy = -55 + (r() - 0.5) * 10;
        const rx = 42 * (0.85 + r() * 0.3);
        const ry = 19 * (0.85 + r() * 0.3);
        const rot = (r() - 0.5) * 0.3;
        const a0 = r() * Math.PI * 2;
        const span = (330 + r() * 50) * (Math.PI / 180);
        for (let i = 0; i <= 14; i++) {
          const a = a0 + (span * i) / 14;
          const px = Math.cos(a) * rx;
          const py = Math.sin(a) * ry;
          const X = cx + px * Math.cos(rot) - py * Math.sin(rot);
          const Y = cy + px * Math.sin(rot) + py * Math.cos(rot);
          d += `${i === 0 ? 'M' : 'L'} ${X.toFixed(1)} ${Y.toFixed(1)} `;
        }
      }
      body = (
        <g>
          <path d={d} fill="none" stroke={ink} strokeWidth={2.4} strokeLinejoin="round" />
          <path d="M 0 -30 q 5 -5 0 -10 q -5 -5 0 -10" fill="none" stroke="#D65A5A" strokeWidth={2.5} transform="translate(0,26)" />
        </g>
      );
      break;
    }
    case 'sparkle':
      body = (
        <g>
          {[
            [-34, -60, 22, '#E8B84A'],
            [24, -86, 16, '#5FA55A'],
            [36, -36, 13, '#4A6FC2'],
            [-6, -104, 11, '#D65A5A'],
          ].map(([sx, sy, ss, c], i) => (
            <Sparkle key={i} x={sx as number} y={sy as number} size={(ss as number) * (0.8 + 0.25 * Math.sin(t * 0.5 + i * 1.7))} color={c as string} rotate={t * 2} />
          ))}
        </g>
      );
      break;
    case 'zzz':
      body = (
        <g>
          {[0, 1, 2].map((k) => {
            const tk = (t + k * 10) % 30;
            const o = clamp(tk / 4) * clamp((30 - tk) / 6);
            const zs = 14 + k * 5;
            return (
              <path
                key={k}
                d={`M ${-zs / 2} ${-zs / 2} L ${zs / 2} ${-zs / 2} L ${-zs / 2} ${zs / 2} L ${zs / 2} ${zs / 2}`}
                fill="none"
                stroke={color ?? ink}
                strokeWidth={4}
                strokeLinejoin="round"
                strokeLinecap="round"
                transform={`translate(${-10 + tk * 1.2 + k * 8},${-30 - tk * 2})`}
                opacity={o}
              />
            );
          })}
        </g>
      );
      break;
  }
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={op}>
      {body}
    </g>
  );
};

// ---------------------------------------------------------------- SpeedLines / SoftShadow / DeckleFrame
/** 3–4 short ink dashes trailing behind a moving body (v20). (x,y) = body centre, dir = +1 moving right. */
export const SpeedLines: React.FC<{x: number; y: number; size: number; dir: number; amount: number; frame: number; color?: string}> = ({x, y, size, dir, amount, frame, color = '#2E2A26'}) => {
  if (amount <= 0.01) return null;
  const f2 = Math.floor(frame / 2);
  return (
    <g opacity={0.6 * amount}>
      {[-0.28, -0.06, 0.16, 0.34].map((fy, i) => {
        const r = rng(f2 * 17 + i * 101);
        const len = size * (0.1 + 0.15 * r()) * (0.6 + 0.4 * amount);
        const x0 = x - dir * (size * (0.62 + 0.12 * i + 0.06 * r()));
        return <line key={i} x1={x0} y1={y + fy * size} x2={x0 - dir * len} y2={y + fy * size} stroke={color} strokeWidth={Math.max(1.5, size * 0.012)} strokeLinecap="round" />;
      })}
    </g>
  );
};

export const SoftShadow: React.FC<{id: string; x: number; y: number; rx: number; ry: number; color?: string; opacity?: number}> = ({id, x, y, rx, ry, color = '#3A2A20', opacity = 0.3}) => (
  <g>
    <defs>
      <radialGradient id={`${id}-sh`}>
        <stop offset="0%" stopColor={color} stopOpacity={opacity} />
        <stop offset="60%" stopColor={color} stopOpacity={opacity * 0.6} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={`url(#${id}-sh)`} />
  </g>
);

/** torn watercolour paper frame (video20 deckle-vignette-frame), static. */
export const DeckleFrame: React.FC<{id: string; w: number; h: number; u: number; margin?: string; bleed?: string; seed?: number}> = ({id, w, h, u, margin = '#E3DAC9', bleed = '#B8AC98', seed = 3}) => {
  const ix = Math.max(26 * u, w * 0.035);
  const iy = Math.max(24 * u, h * 0.04);
  const amp = 14 * u;
  const step = 18 * u;
  const pts: P2[] = [];
  const edge = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number, k: number) => {
    const L = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(2, Math.ceil(L / step));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const s = (t * L) / (60 * u);
      const d = (n2(`dk${seed}${k}`, s, 0.3) * 0.75 + n2(`dk${seed}${k}b`, s * 4, 1.7) * 0.25) * amp;
      pts.push([x0 + (x1 - x0) * t + nx * d, y0 + (y1 - y0) * t + ny * d]);
    }
  };
  edge(ix, iy, w - ix, iy, 0, 1, 0);
  edge(w - ix, iy, w - ix, h - iy, -1, 0, 1);
  edge(w - ix, h - iy, ix, h - iy, 0, -1, 2);
  edge(ix, h - iy, ix, iy, 1, 0, 3);
  const inner = `M ${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ')} Z`;
  return (
    <g>
      <defs>
        <filter id={`${id}-bl`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={10 * u} />
        </filter>
      </defs>
      <path d={inner} fill="none" stroke={bleed} strokeWidth={26 * u} opacity={0.45} filter={`url(#${id}-bl)`} style={{mixBlendMode: 'multiply'}} />
      <path d={`M 0 0 H ${w} V ${h} H 0 Z ${inner}`} fill={margin} fillRule="evenodd" />
      <path d={inner} fill="none" stroke={bleed} strokeWidth={1.4 * u} opacity={0.55} />
    </g>
  );
};

// ---------------------------------------------------------------- BoxBot script engine
export type BotAction = {
  action: 'walk' | 'run' | 'hop' | 'idle' | 'blink' | 'look' | 'emote' | 'wave' | 'turn' | 'expression';
  frames?: number;
  /** walk/run/hop: absolute target x as a fraction of frame width */
  to?: number;
  /** walk/run/hop: relative move as a fraction of frame width (used when `to` is absent) */
  dx?: number;
  /** hop height in body widths */
  height?: number;
  /** look: -1 left, 1 right */
  dir?: number;
  icon?: EmoteType;
  expression?: BoxExpression;
  /** turn: target yaw in degrees */
  yaw?: number;
};

type Seg = {a: BotAction; start: number; end: number; x0: number; x1: number; yaw0: number; yaw1: number};

export type BotState = {
  x: number;
  lift: number;
  pose: BoxBotPose;
  expression: BoxExpression;
  speed: number;
  dir: number;
  emote?: {type: EmoteType; t: number; dur: number};
  shadowK: number;
  landing: number;
};

const DEF_FRAMES: Record<BotAction['action'], number> = {walk: 48, run: 30, hop: 26, idle: 24, blink: 10, look: 22, emote: 32, wave: 40, turn: 10, expression: 24};

export const buildBotSegments = (script: BotAction[], startX: number, restYaw = -22): Seg[] => {
  let f = 0;
  let x = startX;
  let yaw = restYaw;
  let facing = restYaw >= 0 ? 1 : -1;
  return script.map((a) => {
    const dur = Math.max(1, Math.round(a.frames ?? DEF_FRAMES[a.action]));
    let x1 = x;
    if (a.action === 'walk' || a.action === 'run' || a.action === 'hop') {
      x1 = a.to !== undefined ? a.to : x + (a.dx ?? (a.action === 'hop' ? 0 : 0.25));
    }
    const moveDir = Math.sign(x1 - x);
    if (moveDir !== 0) facing = moveDir;
    let yaw1 = yaw;
    if (a.action === 'walk' || a.action === 'run') yaw1 = facing * 38;
    else if (a.action === 'hop') yaw1 = moveDir !== 0 ? facing * 30 : yaw;
    else if (a.action === 'turn') yaw1 = a.yaw ?? 0;
    else if (a.action === 'wave') yaw1 = facing * 8;
    else if (a.action === 'look') yaw1 = (a.dir ?? 1) * 24;
    else yaw1 = Math.abs(yaw) > 30 ? facing * 20 : yaw;
    const seg: Seg = {a, start: f, end: f + dur, x0: x, x1, yaw0: yaw, yaw1};
    f += dur;
    x = x1;
    yaw = yaw1;
    return seg;
  });
};

const EMOTE_EXPR: Record<EmoteType, BoxExpression> = {'?': 'dots', '!': 'surprised', heart: 'happy', bulb: 'happy', sweat: 'worried', scribble: 'angry', sparkle: 'happy', zzz: 'sleep'};

/** Evaluate a BoxBot script at a (character) frame. Returns x in frame-width fraction, lift in body widths. */
export const evalBotScript = (segs: Seg[], frame: number, cycle = 14): BotState => {
  const last = segs[segs.length - 1];
  const seg = segs.find((s) => frame >= s.start && frame < s.end) ?? last;
  const local = frame - seg.start;
  const dur = seg.end - seg.start;
  const after = frame >= last.end;
  const a = seg.a;
  const yawT = interpolate(local, [0, Math.min(8, dur)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const smooth = yawT * yawT * (3 - 2 * yawT);
  const pose: BoxBotPose = {yaw: seg.yaw0 + (seg.yaw1 - seg.yaw0) * smooth, armL: 16, armR: 16};
  let x = seg.x1;
  let lift = 0;
  let expression: BoxExpression = a.expression ?? 'dots';
  let speed = 0;
  let emote: BotState['emote'];
  let shadowK = 1;
  let landing = -1;
  const dir = Math.sign(seg.x1 - seg.x0) || (seg.yaw1 >= 0 ? 1 : -1);

  if (after) {
    pose.yaw = last.yaw1;
  } else if (a.action === 'walk' || a.action === 'run') {
    const run = a.action === 'run';
    const t = local / dur;
    const ramp = 0.12;
    // linear cruise with short eased ramps so the legs never skate
    const vMax = 1 / (1 - ramp);
    const p = t < ramp ? (vMax * t * t) / (2 * ramp) : t > 1 - ramp ? 1 - (vMax * (1 - t) * (1 - t)) / (2 * ramp) : vMax * (t - ramp / 2);
    x = seg.x0 + (seg.x1 - seg.x0) * p;
    const cyc = run ? cycle * 0.65 : cycle;
    pose.walk = local / cyc;
    pose.stride = Math.min(1, Math.min(local, dur - local) / 4) * (run ? 1.3 : 1);
    lift = Math.abs(Math.sin(2 * Math.PI * pose.walk)) * 0.02 * 0.8 * (run ? 1.8 : 1);
    pose.lean = Math.sin(2 * Math.PI * pose.walk) * 3 + dir * (run ? 7 : 2);
    speed = Math.min(1, Math.min(local, dur - local) / 5) * (run ? 1 : 0.7);
  } else if (a.action === 'hop') {
    const antic = 4;
    const land = 8;
    const air = Math.max(6, dur - antic - land);
    const h = a.height ?? 0.9;
    if (local < antic) {
      const q = local / antic;
      pose.sx = 1 + 0.07 * q;
      pose.sy = 1 - 0.1 * q;
      pose.armL = pose.armR = 16 - 10 * q;
      x = seg.x0;
    } else if (local < antic + air) {
      const u = (local - antic) / air;
      const uu = u < 0.6 ? (0.5 * u) / 0.6 : 0.5 + (0.5 * (u - 0.6)) / 0.4;
      lift = h * Math.sin(Math.PI * uu);
      x = seg.x0 + (seg.x1 - seg.x0) * u;
      const st = u < 0.3 ? 0.08 * (1 - u / 0.3) : 0;
      pose.sx = 1 - st * 0.5;
      pose.sy = 1 + st;
      pose.armL = pose.armR = 150 - 40 * u;
      pose.tuck = Math.sin(Math.PI * u);
      pose.lean = (seg.x1 !== seg.x0 ? dir * 10 : 0) * Math.sin(Math.PI * u);
      shadowK = 1 - 0.4 * Math.sin(Math.PI * uu);
      speed = seg.x1 !== seg.x0 ? 0.8 : 0;
    } else {
      const q = (local - antic - air) / land;
      const sq = 1 - q;
      const e = sq * sq;
      pose.sx = 1 + 0.1 * e;
      pose.sy = 1 - 0.14 * e;
      pose.armL = pose.armR = 16 + 30 * e;
      landing = local - antic - air;
      if (landing < 9) expression = 'squint';
    }
  } else if (a.action === 'look') {
    const q = interpolate(local, [0, 3, dur - 3, dur], [0, 1, 1, 0.4], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    pose.look = (a.dir ?? 1) * q;
  } else if (a.action === 'blink') {
    const mid = Math.floor(dur / 2) - 2;
    if (local >= mid && local < mid + 4) expression = 'blink';
  } else if (a.action === 'emote') {
    const type = a.icon ?? '?';
    emote = {type, t: local - 1, dur: dur - 1};
    expression = a.expression ?? EMOTE_EXPR[type];
    if (type === '?') pose.lean = -6 * Math.min(1, local / 4);
    if (type === '!') lift = 0.12 * Math.max(0, Math.sin((Math.PI * local) / 6)) * (local < 6 ? 1 : 0);
    if (type === 'heart' || type === 'sparkle') {
      pose.sy = 1 + 0.03 * Math.sin(local * 0.6);
      pose.armL = pose.armR = 60 + 20 * Math.sin(local * 0.6);
    }
    if (type === 'sweat') pose.armL = 6;
  } else if (a.action === 'wave') {
    expression = a.expression ?? 'happy';
    const up = Math.min(1, local / 5, (dur - local) / 5);
    const wav = Math.sin((local / 10) * Math.PI * 2) * 25;
    if (dir >= 0) pose.armR = 16 + (125 + wav - 16) * up;
    else pose.armL = 16 + (125 + wav - 16) * up;
  } else {
    pose.sy = 1 + 0.012 * Math.sin((frame / 30) * Math.PI * 2);
  }
  // carried look from the previous look action fades back to centre over 6 f
  if (a.action !== 'look') {
    const i = segs.indexOf(seg);
    const prev = i > 0 ? segs[i - 1] : undefined;
    if (prev && prev.a.action === 'look') pose.look = (prev.a.dir ?? 1) * 0.4 * clamp(1 - local / 6);
  }
  // auto blink while eyes are plain dots
  if (expression === 'dots' && a.action !== 'blink' && ((frame + 30) % 87) < 4) expression = 'blink';
  // speed lines linger 5 f after a move ends
  if (speed === 0 && !after) {
    const i = segs.indexOf(seg);
    const prev = i > 0 ? segs[i - 1] : undefined;
    if (prev && (prev.a.action === 'walk' || prev.a.action === 'run') && local < 5) speed = 0.7 * (1 - local / 5);
  }
  return {x, lift, pose, expression, speed, dir, emote, shadowK, landing};
};
