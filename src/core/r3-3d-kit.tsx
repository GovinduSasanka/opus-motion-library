/**
 * r3-3d-kit — shared helpers for the round-3 3D motions (floating-devices-stack, isometric-room-build,
 * 3d-text-extrude-spin, low-poly-terrain-flyover, orbiting-icons-sphere).
 * Everything is a pure function of the frame: no Math.random, no Date, no canvas drawing.
 *
 *  - StudioEnv: image-based PBR light from a procedural room (no asset)
 *  - fitDistBox / viewShift: aspect-aware camera framing so one scene works at 16:9, 1:1 and 9:16
 *  - uiScreenTexture / coverTexture / roundedPlane: procedural app screens, "cover" fit for user images, rounded screens
 *  - Headline: HTML title block that reflows (left column on landscape, top / bottom on portrait)
 *  - bgCss: background gradient from one colour (or 'transparent')
 */
import React, {useLayoutEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from './ease';
import {fonts} from './fonts';
import {dataTexture, mixHex, rgb, shade} from './r2-pr2-kit';
import {useStage} from './stage';

export type V3 = [number, number, number];

/** procedural studio image-based light (adds soft reflections to glossy / metal materials) */
export const StudioEnv: React.FC<{intensity?: number}> = ({intensity = 0.9}) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = env.texture;
    scene.environmentIntensity = intensity;
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene, intensity]);
  return null;
};

/**
 * distance a perspective camera must sit from the origin so a box of half-extents (halfW, halfH) (measured in the
 * view plane) fits at the given aspect. Works for portrait, square and landscape alike.
 */
export const fitDistBox = (halfW: number, halfH: number, fovDeg: number, aspect: number) => {
  const tv = Math.tan((fovDeg * Math.PI) / 360);
  return Math.max(halfH / tv, halfW / (tv * aspect));
};

/** shift a camera (position + target) sideways / up along its own view axes: moves the subject on screen */
export const viewShift = (pos: V3, tgt: V3, dx: number, dy: number): {position: V3; target: V3} => {
  const f = new THREE.Vector3(tgt[0] - pos[0], tgt[1] - pos[1], tgt[2] - pos[2]).normalize();
  const r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(r, f).normalize();
  const o = r.multiplyScalar(dx).add(up.multiplyScalar(dy));
  return {position: [pos[0] + o.x, pos[1] + o.y, pos[2] + o.z], target: [tgt[0] + o.x, tgt[1] + o.y, tgt[2] + o.z]};
};

/** background gradient css; 'transparent' (or '') leaves the frame clear so the motion can sit over other content */
export const bgCss = (background: string, glow?: string) => {
  if (!background || background === 'transparent') return 'transparent';
  const centre = glow ? mixHex(background, glow, 0.16) : shade(background, 0.06);
  return `radial-gradient(ellipse at 50% 42%, ${centre} 0%, ${background} 58%, ${shade(background, -0.14)} 100%)`;
};

// ------------------------------------------------------------------------------------------------
// textures
// ------------------------------------------------------------------------------------------------
/** signed distance to a rounded rectangle (negative inside) */
const sdRR = (x: number, y: number, cx: number, cy: number, hw: number, hh: number, r: number) => {
  const dx = Math.abs(x - cx) - (hw - r);
  const dy = Math.abs(y - cy) - (hh - r);
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - r;
};

/**
 * A generated app screen (header, sidebar, hero banner, card row, text lines) so devices look finished with no image.
 * `aspect` = width / height of the screen it will be mapped onto.
 */
export const uiScreenTexture = (aspect: number, bg: string, accent: string, accent2: string, seed = 1, dark = false, W = 512) => {
  const H = Math.max(32, Math.round(W / aspect));
  const f = (c: string) => rgb(c).map((v) => v / 255) as V3;
  const pageA = f(dark ? shade(bg, -0.55) : shade(bg, 0.55));
  const pageB = f(dark ? shade(bg, -0.35) : shade(bg, 0.3));
  const bar = f(dark ? shade(bg, -0.7) : '#ffffff');
  const A = f(accent);
  const B = f(accent2);
  const ink = f(dark ? '#f2f4fa' : shade(bg, -0.6));
  const wide = aspect > 1.15;
  const sideW = wide ? 0.17 * aspect * 0.55 : 0;
  const cards = wide ? 3 : 2;
  const flip = seed % 2 === 0;
  return dataTexture(W, H, (u, v) => {
    const x = u * aspect;
    const y = v;
    const px = 1 / H;
    let c: V3 = [pageA[0] + (pageB[0] - pageA[0]) * (1 - y), pageA[1] + (pageB[1] - pageA[1]) * (1 - y), pageA[2] + (pageB[2] - pageA[2]) * (1 - y)];
    const over = (col: V3, d: number, a = 1) => {
      const cov = clamp(0.5 - d / px) * a;
      c = [c[0] + (col[0] - c[0]) * cov, c[1] + (col[1] - c[1]) * cov, c[2] + (col[2] - c[2]) * cov];
    };
    // top bar
    over(bar, y - 0.9 > 0 ? -(y - 0.9) : 1, 1);
    over(A, sdRR(x, y, 0.07 * aspect * 0.5 + 0.03, 0.95, 0.022, 0.022, 0.011));
    [0, 1, 2].forEach((k) => over(ink, sdRR(x, y, aspect - 0.14 - k * 0.095, 0.95, 0.032, 0.007, 0.004), 0.5));
    // sidebar
    if (wide) {
      over(bar, x < sideW ? -(sideW - x) : 1, 0.85);
      [0, 1, 2, 3].forEach((k) => over(k === 0 ? A : ink, sdRR(x, y, sideW / 2, 0.76 - k * 0.12, sideW * 0.34, 0.02, 0.01), k === 0 ? 0.9 : 0.28));
    }
    const left = wide ? sideW + 0.05 : 0.05;
    const right = aspect - 0.05;
    const mid = (left + right) / 2;
    const hw = (right - left) / 2;
    // hero banner (accent → accent2 diagonal) with text lines and a disc
    const t = clamp((x - left) / (right - left) * 0.7 + (1 - y) * 0.5);
    const hero = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t] as V3;
    over(hero, sdRR(x, y, mid, 0.66, hw, 0.19, 0.035));
    const lx = flip ? right - hw * 0.5 : left + hw * 0.5;
    over([1, 1, 1], sdRR(x, y, lx - (flip ? 0 : 0.0), 0.74, hw * 0.4, 0.016, 0.008), 0.95);
    over([1, 1, 1], sdRR(x, y, lx - hw * 0.1, 0.67, hw * 0.3, 0.011, 0.006), 0.6);
    over([1, 1, 1], sdRR(x, y, lx - hw * 0.15, 0.6, hw * 0.25, 0.011, 0.006), 0.45);
    const dcx = flip ? left + hw * 0.34 : right - hw * 0.3;
    over([1, 1, 1], Math.hypot(x - dcx, y - 0.66) - 0.12, 0.28);
    over([1, 1, 1], Math.hypot(x - dcx, y - 0.66) - 0.07, 0.35);
    // card row
    const cw = (right - left - 0.04 * (cards - 1)) / cards;
    for (let k = 0; k < cards; k++) {
      const ccx = left + cw / 2 + k * (cw + 0.04);
      over(bar, sdRR(x, y, ccx, 0.28, cw / 2, 0.15, 0.03), 0.95);
      over(k % 2 ? B : A, sdRR(x, y, ccx - cw * 0.22, 0.34, cw * 0.18, 0.045, 0.02), 0.9);
      over(ink, sdRR(x, y, ccx, 0.22, cw * 0.38, 0.01, 0.005), 0.4);
      over(ink, sdRR(x, y, ccx - cw * 0.1, 0.17, cw * 0.28, 0.01, 0.005), 0.25);
    }
    return [c[0], c[1], c[2], 1];
  });
};

/** clone a texture so it "covers" a plane of `planeAspect` (centre-crops instead of stretching) */
export const coverTexture = (tex: THREE.Texture, planeAspect: number) => {
  const t = tex.clone();
  const img = tex.image as {width?: number; height?: number} | undefined;
  const iw = img?.width ?? 1;
  const ih = img?.height ?? 1;
  const ia = iw / ih;
  t.repeat.set(1, 1);
  t.offset.set(0, 0);
  if (ia > planeAspect) {
    t.repeat.x = planeAspect / ia;
    t.offset.x = (1 - t.repeat.x) / 2;
  } else {
    t.repeat.y = ia / planeAspect;
    t.offset.y = (1 - t.repeat.y) / 2;
  }
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
};

/** rounded-rectangle plane (w x h) with 0..1 UVs, for screens */
export const roundedPlane = (w: number, h: number, r: number, seg = 6) => {
  const s = new THREE.Shape();
  const x0 = -w / 2;
  const y0 = -h / 2;
  s.moveTo(x0 + r, y0);
  s.lineTo(x0 + w - r, y0);
  s.absarc(x0 + w - r, y0 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x0 + w, y0 + h - r);
  s.absarc(x0 + w - r, y0 + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y0 + h);
  s.absarc(x0 + r, y0 + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + r);
  s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  const g = new THREE.ShapeGeometry(s, seg);
  const p = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - x0) / w, (p.getY(i) - y0) / h);
  uv.needsUpdate = true;
  return g;
};

// ------------------------------------------------------------------------------------------------
// HTML title block
// ------------------------------------------------------------------------------------------------
export type HeadlinePlace = 'side' | 'top' | 'bottom' | 'center';

/**
 * Title + subtitle that reflows by aspect: `side` = left column (landscape / square) or top band (portrait).
 * Rendered in HTML over the canvas; fades and slides in at `at`.
 */
export const Headline: React.FC<{
  title: string;
  subtitle?: string;
  ink: string;
  accent?: string;
  at?: number;
  place?: HeadlinePlace;
  fontFamily?: string;
}> = ({title, subtitle = '', ink, accent, at = 10, place = 'side', fontFamily}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  if (!title && !subtitle) return null;
  const a = ease.out(prog(frame, at, at + 24, (t) => t));
  const len = Math.max(...title.split('\n').map((l) => l.length), 1);
  const k = len > 30 ? 0.62 : len > 20 ? 0.78 : len > 14 ? 0.9 : 1;
  const side = place === 'side';
  const fs = (side && !portrait ? 92 : portrait ? 88 : 84) * k * u;
  const box: React.CSSProperties = {position: 'absolute', color: ink, fontFamily: fontFamily ?? fonts.grotesk, textAlign: side && !portrait ? 'left' : 'center', opacity: a, transform: `translateY(${(1 - a) * 26 * u}px)`, pointerEvents: 'none'};
  if (side && !portrait) Object.assign(box, {left: w * 0.06, width: w * 0.4, top: h * 0.5, marginTop: -fs * 1.5});
  else if (place === 'bottom') Object.assign(box, {left: w * 0.06, right: w * 0.06, bottom: h * (portrait ? 0.07 : 0.09)});
  else if (place === 'center') Object.assign(box, {left: w * 0.06, right: w * 0.06, top: h * 0.5, marginTop: -fs});
  else Object.assign(box, {left: w * 0.07, right: w * 0.07, top: h * (portrait ? 0.075 : 0.08)});
  return (
    <div style={box}>
      {accent && side && !portrait && <div style={{width: 84 * u, height: 8 * u, borderRadius: 8 * u, background: accent, marginBottom: 28 * u}} />}
      <div style={{fontSize: fs, lineHeight: 1.02, fontWeight: 700, letterSpacing: -2 * u, whiteSpace: 'pre-line'}}>{title}</div>
      {subtitle && <div style={{fontSize: (portrait ? 36 : 32) * u, marginTop: 20 * u, opacity: 0.72, lineHeight: 1.3, fontWeight: 500, fontFamily: fonts.sans}}>{subtitle}</div>}
    </div>
  );
};

/** a small deterministic float for idle motion: smooth, per-item phase, integer cycles over `period` frames */
export const bob = (frame: number, period: number, phase = 0) => Math.sin(((frame / period) + phase) * Math.PI * 2);

export const toV3 = (hex: string): V3 => rgb(hex).map((v) => v / 255) as V3;
