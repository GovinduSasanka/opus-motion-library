/**
 * Shared helpers for build batch LA3-1 (round 2). Engines:
 *  - knife:   palette-knife stroke plate (knife-paint-plate, knife-colour-relay)
 *  - pixel:   tiny procedural pixel sprites, selout outline, light tint + sheared floor shadows
 *             (lit-pixel-sprite, practical-light-shadow-jump, pixel-mascot-on-ui)
 *  - relief:  raking-lit heightfield mesh + projector (hairline-feature-trace, section-profile-chart)
 * Ideas and formulas adapted from lemo-opuscar styles/{impasto,hd-2d,lidar-survey,living-screencast} (MIT, © LemoLab)
 * — see THIRD_PARTY_NOTICES.md. Everything is a pure function of the frame and seeds.
 */
import React from 'react';
import {cl, eo3, fbm2, h1, hex3, lerp, lumaOf, mixC, RGB3, rgbHex, sstep} from './r2-la3-kit';

// ================================================================================================ knife
export type KnifePal = {
  skyTop: string; skyLow: string; sun: string; cloud: string; hillFar: string; hillNear: string; field: string; fieldHi: string;
  river: string; leaf: string; leafHi: string; trunk: string; wall: string; roof: string; door: string; umbrella: string;
};
export const KNIFE_PAL: KnifePal = {
  skyTop: '#3E6EA8', skyLow: '#F3C58E', sun: '#FFE9A8', cloud: '#FBEFE0', hillFar: '#6F7FB4', hillNear: '#4C8C6A', field: '#C9B04F', fieldHi: '#E8D07A',
  river: '#5E9CC8', leaf: '#2F6B4B', leafHi: '#8DBE5E', trunk: '#6A4630', wall: '#F1E4C8', roof: '#C4553A', door: '#2F5E8E', umbrella: '#E23B3B',
};

/** the procedural reference illustration the knife plate "paints": x,y in short-side units (short side = 1) */
export const knifeScene = (x: number, y: number, W: number, H: number, seed: number, p: KnifePal): {c: string; grp: string} => {
  const hz = H * 0.5;
  let c = p.skyTop;
  let grp = 'sky';
  const sy = Math.max(0, y) / hz;
  if (y < hz) {
    c = mixC(p.skyTop, p.skyLow, Math.pow(cl(sy), 1.5));
    const sx = W * 0.7;
    const sY = hz * 0.62;
    const d = Math.hypot(x - sx, y - sY);
    if (d < 0.075) {
      c = p.sun;
      grp = 'sun';
    } else c = mixC(c, p.sun, Math.exp(-(d - 0.075) * 5) * 0.55);
    const n = fbm2(x * 3.2 + 1.7, y * 6.5, seed, 3);
    if (n > 0.6 && y < hz * 0.85) c = mixC(c, p.cloud, cl((n - 0.6) * 4.5, 0, 0.9));
  }
  const ridgeFar = hz - 0.05 - 0.07 * fbm2(x * 2.4, 0.5, seed + 3, 3);
  const ridgeNear = hz + 0.02 + 0.045 * fbm2(x * 3, 1.5, seed + 5, 3);
  if (y >= ridgeFar && y < ridgeNear) {
    c = mixC(p.hillFar, p.skyLow, 0.25 + 0.35 * sstep(ridgeFar + 0.08, ridgeFar, y) + 0.2 * fbm2(x * 6, y * 4, seed + 9));
    grp = 'hills';
  }
  if (y >= ridgeNear) {
    const t = cl((y - ridgeNear) / (H - ridgeNear));
    c = mixC(p.hillNear, p.field, sstep(0, 0.55, t));
    if (fbm2(x * 7, y * 26, seed + 2, 3) > 0.55) c = mixC(c, p.fieldHi, 0.7);
    grp = 'field';
    // river S-curve widening toward the viewer
    const xr = W * 0.52 + 0.1 * Math.sin((y - hz) * 6 + seed);
    const wr = 0.015 + 0.13 * Math.pow(t, 1.15);
    if (Math.abs(x - xr) < wr) {
      c = mixC(p.river, p.skyLow, 0.06 + 0.16 * fbm2(x * 9, y * 5, seed + 6));
      grp = 'river';
    }
  }
  // house (right)
  const hx = W * 0.8;
  const by = hz + 0.14;
  if (x > hx - 0.12 && x < hx + 0.12 && y > by - 0.14 && y < by) {
    c = p.wall;
    grp = 'house';
    if (Math.abs(x - hx) < 0.022 && y > by - 0.07) {
      c = p.door;
      grp = 'house';
    }
    if (Math.abs(x - (hx + 0.07)) < 0.02 && Math.abs(y - (by - 0.08)) < 0.02) c = mixC(p.skyLow, '#FFFFFF', 0.3);
  } else if (y < by - 0.14 && y > by - 0.24 && Math.abs(x - hx) < 0.15 * ((y - (by - 0.24)) / 0.1 + 0.001)) {
    c = mixC(p.roof, '#000000', 0.12 * (x > hx ? 1 : 0));
    grp = 'house';
  }
  // red umbrella + figure (the one-colour exception)
  const ux = W * 0.36;
  const uy = hz + 0.3;
  const ud = Math.hypot(x - ux, y - uy);
  if (ud < 0.095 && y <= uy) {
    const a = Math.atan2(y - uy, x - ux);
    c = Math.floor((a + Math.PI) / (Math.PI / 4)) % 2 === 0 ? p.umbrella : mixC(p.umbrella, '#FFE9D6', 0.35);
    grp = 'umbrella';
  } else if (Math.abs(x - ux) < 0.013 && y > uy && y < uy + 0.12) {
    c = '#2B2B3A';
    grp = 'umbrella';
  }
  // foreground tree (left)
  const tx = W * 0.2;
  const tcy = hz - 0.02;
  if (Math.abs(x - tx) < 0.022 && y > tcy && y < H * 0.92) {
    c = mixC(p.trunk, '#2A1A10', 0.35 * sstep(tx - 0.02, tx + 0.02, x));
    grp = 'tree';
  }
  const q = ((x - tx) / 0.19) ** 2 + ((y - tcy) / 0.16) ** 2;
  if (q < 1) {
    const lit = fbm2(x * 14, y * 14, seed + 4, 3) * 0.7 + 0.45 * ((x - tx) / 0.19) * 0.5 + 0.25 * (1 - (y - tcy) / 0.16) * 0.4;
    c = mixC(p.leaf, p.leafHi, cl(lit * 0.9));
    grp = 'tree';
  }
  return {c, grp};
};

export type KStroke = {x: number; y: number; ang: number; len: number; wid: number; col: string; grey: string; grp: string; layer: number; key: number; ord: number};

const cDiff = (a: string, b: string) => {
  const A = hex3(a);
  const B = hex3(b);
  return (Math.abs(A[0] - B[0]) + Math.abs(A[1] - B[1]) + Math.abs(A[2] - B[2])) / 3;
};

export const buildKnife = (w: number, h: number, u: number, o: {scale: number; seed: number; pal: KnifePal}): KStroke[] => {
  const s = Math.min(w, h);
  const W = w / s;
  const H = h / s;
  const out: KStroke[] = [];
  const radii = [34, 17, 8].map((r) => r * u * o.scale);
  const spacing = [0.95, 1.3, 1.6];
  const grid0: {x: number; y: number; c: string}[] = [];
  radii.forEach((R, layer) => {
    const step = R * spacing[layer];
    let gi = 0;
    for (let gy = -step; gy < h + step; gy += step) {
      for (let gx = -step; gx < w + step; gx += step) {
        gi++;
        const r1 = h1(gi, o.seed, layer);
        const r2 = h1(gi, o.seed + 7, layer);
        const r3 = h1(gi, o.seed + 13, layer);
        const px = gx + (r1 - 0.5) * step * 0.9;
        const py = gy + (r2 - 0.5) * step * 0.9;
        const smp = knifeScene(px / s, py / s, W, H, o.seed, o.pal);
        if (layer === 0) grid0.push({x: px, y: py, c: smp.c});
        else {
          // error vs. the coarse underpainting here: only stroke where detail is needed
          let best = 1e9;
          let bc = smp.c;
          const R0 = radii[0] * spacing[0];
          for (const g of grid0) {
            if (Math.abs(g.x - px) > R0 * 1.2 || Math.abs(g.y - py) > R0 * 1.2) continue;
            const d = Math.hypot(g.x - px, g.y - py);
            if (d < best) {
              best = d;
              bc = g.c;
            }
          }
          const err = cDiff(smp.c, bc);
          if (err < (layer === 1 ? 14 : 22)) continue;
        }
        const flow = smp.grp === 'sky' || smp.grp === 'sun' ? -0.1 : smp.grp === 'tree' ? 0.9 : smp.grp === 'river' ? 0.12 : smp.grp === 'house' || smp.grp === 'umbrella' ? -0.7 : -0.5;
        const ang = flow + (r3 - 0.5) * 0.46;
        const len = R * (1.7 + 1.4 * h1(gi, o.seed + 3, layer));
        const wid = R * (0.95 + 0.5 * h1(gi, o.seed + 5, layer));
        const jit = (h1(gi, o.seed + 11, layer) - 0.5) * 0.12;
        const col = jit > 0 ? mixC(smp.c, '#FFFFFF', jit) : mixC(smp.c, '#000000', -jit);
        const l = lumaOf(smp.c) * 255;
        const grey = mixC(rgbHex([l * 0.92, l * 0.98, l * 1.07]), smp.c, 0.05);
        out.push({x: px, y: py, ang, len, wid, col, grey, grp: smp.grp, layer, key: cl((px / w) * 0.7 + (py / h) * 0.3 + (h1(gi, o.seed + 17) - 0.5) * 0.12), ord: h1(gi, o.seed + 19, layer)});
      }
    }
  });
  return out;
};

export type KnifeRelay = {ox: number; oy: number; speed: number; start: number; dur: number; keep: string[]};

/** stroke planes in three layers with raking-light ridges; relay turns grey strokes to colour in a wave */
export const KnifeLayers: React.FC<{
  strokes: KStroke[]; frame: number; u: number; lightAngle: number; spec: number; grey: number; appearAt: number; appearDur: number; relay?: KnifeRelay; bodies?: boolean;
}> = ({strokes, frame, u, lightAngle, spec, grey, appearAt, appearDur, relay, bodies = true}) => {
  const lx = Math.cos(lightAngle);
  const ly = Math.sin(lightAngle);
  const layers: React.ReactNode[] = [];
  for (let L = 0; L < 3; L++) {
    const body: React.ReactNode[] = [];
    let hi = '';
    let lo = '';
    for (const s of strokes) {
      if (s.layer !== L) continue;
      const k = eo3((frame - (appearAt + (s.key * 0.78 + s.layer * 0.1) * appearDur)) / 9);
      if (k <= 0.001) continue;
      const ca = Math.cos(s.ang);
      const sa = Math.sin(s.ang);
      const vx = -sa;
      const vy = ca;
      const hl = s.len / 2;
      const hw = s.wid / 2;
      const poly = (lenFrac: number) => {
        const a0 = -hl;
        const a1 = -hl + s.len * lenFrac;
        const P = [[a0, -hw], [a1, -hw], [a1, hw], [a0, hw]].map(([a, b]) => `${(s.x + ca * a + vx * b).toFixed(1)},${(s.y + sa * a + vy * b).toFixed(1)}`).join(' ');
        return P;
      };
      let r = 1;
      if (relay) {
        r = relay.keep.includes(s.grp) ? 1 : eo3((frame - (relay.start + Math.hypot(s.x - relay.ox, s.y - relay.oy) / (relay.speed * u + 1e-6))) / relay.dur);
        if (relay.speed <= 0 && !relay.keep.includes(s.grp)) r = 0;
      }
      const stroke = (col: string, frac: number, key: string) => (
        <polygon key={key} points={poly(frac)} fill={col} stroke={col} strokeWidth={s.wid * 0.1} strokeLinejoin="round" />
      );
      const gcol = relay ? s.grey : s.grey;
      const baseCol = relay ? s.col : grey > 0 ? mixC(s.col, gcol, grey) : s.col;
      if (relay) {
        if (r < 1) body.push(stroke(s.grey, k, 'g' + s.x + s.y));
        if (r > 0) body.push(stroke(s.col, Math.min(k, r), 'c' + s.x + s.y));
      } else if (bodies) body.push(stroke(baseCol, k, 'c' + s.x + s.y));
      // ridge lines along the long edges: lit edge brightens, far edge darkens
      const dv = vx * lx + vy * ly;
      const sgn = dv >= 0 ? 1 : -1;
      const e = (side: number, inset: number) => {
        const bx = s.x + vx * (hw - inset) * side;
        const by = s.y + vy * (hw - inset) * side;
        return `M${(bx - ca * hl).toFixed(1)} ${(by - sa * hl).toFixed(1)}L${(bx - ca * hl + ca * s.len * k).toFixed(1)} ${(by - sa * hl + sa * s.len * k).toFixed(1)}`;
      };
      hi += e(sgn, s.wid * 0.07);
      lo += e(-sgn, s.wid * 0.07);
    }
    layers.push(
      <g key={'L' + L}>
        {body}
        <path d={hi} fill="none" stroke="#FFF4DC" strokeOpacity={cl(spec * 1.5, 0, 0.6)} strokeWidth={(L === 0 ? 2.6 : L === 1 ? 1.8 : 1.2) * u} strokeLinecap="round" />
        <path d={lo} fill="none" stroke="#1A1018" strokeOpacity={cl(spec * 1.0, 0, 0.4)} strokeWidth={(L === 0 ? 3.4 : L === 1 ? 2.2 : 1.4) * u} strokeLinecap="round" />
      </g>,
    );
  }
  return <>{layers}</>;
};

/** canvas weave + varnish gradient laid over a plate */
export const CanvasWeave: React.FC<{w: number; h: number; u: number; id: string; opacity?: number}> = ({w, h, u, id, opacity = 0.5}) => (
  <>
    <defs>
      <pattern id={id} width={4 * u} height={4 * u} patternUnits="userSpaceOnUse">
        <rect width={4 * u} height={4 * u} fill="none" />
        <path d={`M0 ${u}H${4 * u}M0 ${3 * u}H${4 * u}`} stroke="#000" strokeOpacity="0.1" strokeWidth={0.9 * u} />
        <path d={`M${u} 0V${4 * u}M${3 * u} 0V${4 * u}`} stroke="#fff" strokeOpacity="0.08" strokeWidth={0.9 * u} />
      </pattern>
    </defs>
    <rect width={w} height={h} fill={`url(#${id})`} opacity={opacity} style={{mixBlendMode: 'multiply'}} />
  </>
);

// ================================================================================================ pixel sprites
export type CharStyle = {skin: string; hair: string; shirt: string; pants: string; shoes: string; accent: string; hat?: boolean; long?: boolean};
export const charPal = (o: CharStyle): Record<string, string> => ({s: o.skin, h: o.hair, b: o.shirt, p: o.pants, k: o.shoes, a: o.accent, e: '#1E1A26', w: '#F4EEE0'});

/** 14 x 24 front-facing pixel character; walk = 4-frame cycle (0..3), idle = 2 frames (0..1) */
export const charRows = (st: {hat?: boolean; long?: boolean}, pose: {walk?: number; idle?: number}): string[] => {
  const W = 14;
  const Hh = 24;
  const g: string[][] = Array.from({length: Hh}, () => Array(W).fill('.'));
  const put = (r: number, c: number, ch: string) => {
    if (r >= 0 && r < Hh && c >= 0 && c < W) g[r][c] = ch;
  };
  const rect = (r0: number, c0: number, r1: number, c1: number, ch: string) => {
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) put(r, c, ch);
  };
  const wf = pose.walk;
  const bob = wf !== undefined ? (wf === 2 ? 1 : 0) : pose.idle === 1 ? 1 : 0;
  const liftL = wf === 1 ? 2 : 0;
  const liftR = wf === 3 ? 2 : 0;
  const y0 = 4 - bob;
  // legs (rows 17..22), shoes row 23
  rect(17, 4, 22 - liftL, 6, 'p');
  rect(17, 7, 22 - liftR, 9, 'p');
  rect(23 - liftL, 3, 23 - liftL, 6, 'k');
  rect(23 - liftR, 7, 23 - liftR, 10, 'k');
  // torso fills down to row 17 (pants hide the gap when bobbing)
  rect(y0 + 6, 3, y0 + 12, 10, 'b');
  if (bob) rect(16, 4, 16, 9, 'p');
  rect(y0 + 11, 3, y0 + 11, 10, 'a'); // belt / sash in the accent colour
  // arms swing opposite to the legs
  const aL = wf === 3 ? -1 : wf === 1 ? 1 : 0;
  const aR = wf === 1 ? -1 : wf === 3 ? 1 : 0;
  rect(y0 + 6 + aL, 2, y0 + 9 + aL, 2, 'b');
  put(y0 + 10 + aL, 2, 's');
  rect(y0 + 6 + aR, 11, y0 + 9 + aR, 11, 'b');
  put(y0 + 10 + aR, 11, 's');
  // head
  rect(y0, 4, y0 + 5, 9, 's');
  rect(y0 - 1, 5, y0 - 1, 8, 'h');
  rect(y0, 4, y0, 9, 'h');
  put(y0 + 1, 4, 'h');
  put(y0 + 1, 9, 'h');
  if (st.long) rect(y0 + 2, 3, y0 + 6, 3, 'h'), rect(y0 + 2, 10, y0 + 6, 10, 'h');
  put(y0 + 3, 5, 'e');
  put(y0 + 3, 8, 'e');
  if (st.hat) {
    rect(y0 - 2, 4, y0 - 2, 9, 'a');
    rect(y0 - 1, 3, y0 - 1, 10, 'a');
  }
  return g.map((r) => r.join(''));
};

export const litC = (hex: string, mult: RGB3, gain = 1): string => {
  const c = hex3(hex);
  return rgbHex([c[0] * mult[0] * gain, c[1] * mult[1] * gain, c[2] * mult[2] * gain]);
};

export type SpritePath = {fill: string; d: string};
/** grid rows -> merged per-colour path data in grid units; adds a 1-px selout outline (darkened neighbour colour) */
export const spritePaths = (rows: string[], pal: Record<string, string>, o: {mult?: RGB3; gain?: number; outline?: boolean; flip?: boolean; outlineDark?: number} = {}): SpritePath[] => {
  const mult: RGB3 = o.mult ?? [1, 1, 1];
  const gain = o.gain ?? 1;
  const Hh = rows.length;
  const W = rows[0].length;
  const cell = (r: number, c: number) => {
    if (r < 0 || r >= Hh || c < 0 || c >= W) return '.';
    const cc = o.flip ? W - 1 - c : c;
    return rows[r][cc];
  };
  const byCol = new Map<string, string>();
  const add = (col: string, r: number, c: number, len: number) => byCol.set(col, (byCol.get(col) ?? '') + `M${c} ${r}h${len}v1h${-len}z`);
  for (let r = -1; r <= Hh; r++) {
    let c = -1;
    while (c <= W) {
      const ch = cell(r, c);
      let col: string | null = null;
      if (ch !== '.') col = litC(pal[ch] ?? '#ff00ff', mult, gain);
      else if (o.outline) {
        const nb = [cell(r + 1, c), cell(r - 1, c), cell(r, c - 1), cell(r, c + 1)].find((n) => n !== '.');
        if (nb) col = litC(mixC(pal[nb] ?? '#000000', '#0A0614', o.outlineDark ?? 0.62), mult, gain);
      }
      if (!col) {
        c++;
        continue;
      }
      let e = c + 1;
      while (e <= W) {
        const ch2 = cell(r, e);
        let col2: string | null = null;
        if (ch2 !== '.') col2 = litC(pal[ch2] ?? '#ff00ff', mult, gain);
        else if (o.outline) {
          const nb = [cell(r + 1, e), cell(r - 1, e), cell(r, e - 1), cell(r, e + 1)].find((n) => n !== '.');
          if (nb) col2 = litC(mixC(pal[nb] ?? '#000000', '#0A0614', o.outlineDark ?? 0.62), mult, gain);
        }
        if (col2 !== col) break;
        e++;
      }
      add(col, r, c, e - c);
      c = e;
    }
  }
  return [...byCol.entries()].map(([fill, d]) => ({fill, d}));
};

export const PixelSprite: React.FC<{paths: SpritePath[]; x: number; y: number; px: number; opacity?: number; originX?: number}> = ({paths, x, y, px, opacity = 1, originX = 0}) => (
  <g transform={`translate(${x - originX * px} ${y}) scale(${px})`} opacity={opacity} shapeRendering="crispEdges">
    {paths.map((p) => (
      <path key={p.fill} d={p.d} fill={p.fill} />
    ))}
  </g>
);

export type Light = {x: number; y: number; h: number; color: string; r: number; i: number};
/** light multiplier at a screen point: ambient + sum of warm lights with smooth falloff */
export const lightMult = (x: number, y: number, lights: Light[], ambient: RGB3, cap = 1.35): RGB3 => {
  const m: RGB3 = [...ambient] as RGB3;
  for (const L of lights) {
    const d = Math.hypot(x - L.x, (y - L.y) * 1.4);
    const f = L.i * Math.pow(Math.max(0, 1 - d / L.r), 1.6);
    const c = hex3(L.color);
    m[0] += (c[0] / 255) * f;
    m[1] += (c[1] / 255) * f;
    m[2] += (c[2] / 255) * f;
  }
  return [Math.min(cap, m[0]), Math.min(cap, m[1]), Math.min(cap, m[2])];
};

/** shadow of a vertical sprite on a floor plane from a point light at (x, y) on the floor, height h; sq flattens the floor depth axis */
export const shadowPoints = (light: {x: number; y: number; h: number}, foot: {x: number; y: number}, prof: [number, number][], sq = 0.55, thick = 0): string => {
  const proj = (px: number, z: number, side = 0): [number, number] => {
    const zc = Math.min(z, light.h * 0.82);
    const f = cl(zc / (light.h - zc), 0, 3.2);
    return [px + (px - light.x) * f, foot.y + (foot.y - light.y) * f * sq + side * thick * (1 + f * 0.6)];
  };
  const left = prof.map(([hw, z]) => proj(foot.x - hw, z, -1));
  const right = prof.map(([hw, z]) => proj(foot.x + hw, z, 1)).reverse();
  return [...left, ...right].map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');
};

// ================================================================================================ relief
export type RelCam = {yaw: number; el: number; k: number; cx: number; cy: number};
/** orthographic oblique projector: world (x east, y north, z up) -> screen + far-ness (bigger = farther) */
export const relP = (c: RelCam, x: number, y: number, z: number): [number, number, number] => {
  const cyw = Math.cos(c.yaw);
  const syw = Math.sin(c.yaw);
  const X = x * cyw - y * syw;
  const Y = x * syw + y * cyw;
  return [c.cx + X * c.k, c.cy - (z * Math.cos(c.el) + Y * Math.sin(c.el)) * c.k, Y];
};

export type RelPal = {lo: string; hi: string; zmax: number; ambient: number; interval: number};
export const RELIEF_PAL: RelPal = {lo: '#3A3C3E', hi: '#BDB6A4', zmax: 12, ambient: 0.22, interval: 2};

/** procedural survey terrain: gentle fbm + optional mounds [{x,y,r,h}] */
export const makeReliefH = (seed: number, mounds: {x: number; y: number; r: number; h: number}[] = [], amp = 4) => (x: number, y: number) => {
  let z = (fbm2(x * 0.045 + 3.1, y * 0.045 + 7.7, seed, 4) - 0.5) * 2 * amp + amp * 0.6;
  for (const m of mounds) {
    const d = Math.hypot(x - m.x, y - m.y) / m.r;
    z += m.h * Math.exp(-d * d * 1.6);
  }
  return z;
};

export type RelQuad = {pts: string; fill: string; far: number};
export const reliefQuads = (H: (x: number, y: number) => number, size: number, n: number, cam: RelCam, sun: {az: number; el: number}, pal: RelPal): RelQuad[] => {
  const out: RelQuad[] = [];
  const step = size / n;
  const sx = Math.sin(sun.az) * Math.cos(sun.el);
  const sy = Math.cos(sun.az) * Math.cos(sun.el);
  const sz = Math.sin(sun.el);
  const e = step * 0.5;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x0 = -size / 2 + i * step;
      const y0 = -size / 2 + j * step;
      const xm = x0 + step / 2;
      const ym = y0 + step / 2;
      const zc = H(xm, ym);
      const dzx = (H(xm + e, ym) - H(xm - e, ym)) / (2 * e);
      const dzy = (H(xm, ym + e) - H(xm, ym - e)) / (2 * e);
      const nl = Math.hypot(dzx, dzy, 1);
      const lam = Math.max(0, (-dzx * sx - dzy * sy + sz) / nl);
      let shade = pal.ambient + lam * 1.05;
      if (pal.interval > 0 && (zc / pal.interval) % 1 < 0.08) shade *= 0.86;
      const base = hex3(mixC(pal.lo, pal.hi, cl(zc / pal.zmax)));
      const fill = rgbHex([base[0] * shade, base[1] * shade, base[2] * shade]);
      const c = [[x0, y0], [x0 + step, y0], [x0 + step, y0 + step], [x0, y0 + step]].map(([a, b]) => relP(cam, a, b, H(a, b)));
      out.push({pts: c.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' '), fill, far: relP(cam, xm, ym, 0)[2]});
    }
  }
  return out.sort((a, b) => b.far - a.far);
};

export const ReliefMesh: React.FC<{quads: RelQuad[]}> = ({quads}) => (
  <>
    {quads.map((q, i) => (
      <polygon key={i} points={q.pts} fill={q.fill} stroke={q.fill} strokeWidth={0.7} strokeLinejoin="round" />
    ))}
  </>
);

/** polyline of plan points draped on the surface: returns the projected screen points */
export const drape = (H: (x: number, y: number) => number, cam: RelCam, pts: [number, number][], lift = 0.25): [number, number][] =>
  pts.map(([x, y]) => {
    const p = relP(cam, x, y, H(x, y) + lift);
    return [p[0], p[1]];
  });

export const lerpN = lerp;
