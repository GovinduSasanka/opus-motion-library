// Adapted from mg-styles-15/demos/20-pixel/film.js (LG glyphs, buildLogo, drawLogo, drawRibbon, drawPress) (MIT, © mg-styles-15 authors) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {hexRgb} from '../../core/r2-s1-kit';
import {Pix, PixelImg, RGB, bay, glyph, hash, pixDims, pixRgba} from '../../core/r2-mg2b-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Chunky pixel title card: a gold logo built from 5x7 glyph cells falls with gravity, lands on a white flash frame,
 * squashes and rebounds in 2-frame steps while the picture shakes, puffs dithered dust from its corners and throws sparks;
 * a diagonal shine band sweeps over the gold, a red ribbon unfolds under it and types a subtitle, then PRESS START blinks.
 */
type Props = {
  title: string;
  subtitle: string;
  pressStart: string;
  fillRamp: string[];
  outline: string;
  ribbonColor: string;
  background: string;
  dropAt: number;
  shineAt: number;
  glints: boolean;
  seed: number;
};

const C = {bg0: 0, bg1: 1, bg2: 2, star: 3, g0: 4, g1: 5, g2: 6, g3: 7, line: 8, ext: 9, white: 10, rib: 11, ribDk: 12, ribLt: 13, dust: 14, spark: 15, cream: 16};

const PixelLogoDrop: React.FC<Props> = ({title, subtitle, pressStart, fillRamp, outline, ribbonColor, background, dropAt, shineAt, glints, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, portrait} = useStage();
  const [bw, bh] = pixDims(w, h);
  const ramp = fillRamp.length >= 4 ? fillRamp : ['#fff3a0', '#ffd23a', '#f0a020', '#c86414'];
  const ext = hexRgb(ramp[3]).map((v) => v * 0.55) as RGB;
  const rib = hexRgb(ribbonColor) as RGB;
  const bgc = hexRgb(background) as RGB;
  const pal: RGB[] = [
    bgc,
    bgc.map((v) => Math.min(255, v + 12)) as RGB,
    bgc.map((v, i) => Math.min(255, v + [30, 22, 48][i])) as RGB,
    [255, 255, 255],
    ...ramp.slice(0, 4).map((c) => hexRgb(c) as RGB),
    hexRgb(outline) as RGB,
    ext,
    [255, 255, 255],
    rib,
    rib.map((v) => v * 0.6) as RGB,
    rib.map((v) => Math.min(255, v * 1.3 + 30)) as RGB,
    [200, 192, 216],
    [255, 230, 128],
    [255, 240, 208],
  ];

  // ---- logo layer (cells of `cell` px)
  const words = title.toUpperCase().split(' ');
  const lines = portrait && words.length > 1 ? words : [words.join(' ')];
  const maxCells = Math.max(...lines.map((l) => l.length * 6 - 1));
  const cell = Math.max(1, Math.floor(Math.min((bw * 0.82) / maxCells, (bh * 0.34) / (lines.length * 8))));
  const lh = 7 * cell;
  const LW = maxCells * cell + 8;
  const LH = lines.length * lh + (lines.length - 1) * 2 * cell + 8;
  const logo = new Pix(LW, LH);
  lines.forEach((ln, li) => {
    const x0 = Math.round((LW - (ln.length * 6 - 1) * cell) / 2);
    const y0 = 3 + li * (lh + 2 * cell);
    [...ln].forEach((ch, ci) => {
      const g = glyph(ch);
      for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) {
        if (!g[j][i]) continue;
        const gx = x0 + (ci * 6 + i) * cell;
        const gy = y0 + j * cell;
        logo.rect(gx + cell, gy + cell, cell, cell, C.ext);
      }
    });
    [...ln].forEach((ch, ci) => {
      const g = glyph(ch);
      for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) {
        if (!g[j][i]) continue;
        logo.rect(x0 + (ci * 6 + i) * cell, y0 + j * cell, cell, cell, C.g0 + Math.min(3, Math.floor((j / 7) * 4)));
      }
    });
  });
  let outl = logo.outlined(C.line);
  if (cell >= 3) outl = outl.outlined(C.line);

  // ---- timeline
  const f0 = frame - dropAt;
  const land = 12;
  const fx = Math.floor(bh * 0.1);
  const finalY = Math.round(bh * (portrait ? 0.26 : 0.3));
  const lx0 = Math.round((bw - LW) / 2);
  const s = cell / 3;
  const squashH = [6, 3, -4, -4];
  const squashW = [6, 3, -2, -2];
  const bounce = [0, -5, -2, 0];
  const shakeT = [3, -3, 2, -1, 1, 0];
  const j = f0 - land;
  let dy = 0;
  if (f0 < land) dy = -(bh * 0.75) * (1 - Math.pow(Math.max(0, f0) / land, 2));
  let dh = 0;
  let dw = 0;
  let shake = 0;
  if (j >= 0) {
    dh = (squashH[j] ?? 0) * s;
    dw = (squashW[j] ?? 0) * s;
    dy += (bounce[Math.floor(j / 2)] ?? 0) * s * (j < 8 ? 1 : 0);
    shake = (shakeT[j] ?? 0) * s;
  }

  const p = new Pix(bw, bh, C.bg0);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const t = y / bh;
    const v = t * 2.2;
    p.d[y * bw + x] = v > bay(x, y) + 0.9 ? C.bg2 : v > bay(x, y) ? C.bg1 : C.bg0;
  }
  for (let i = 0; i < 50; i++) {
    const sx = Math.floor(hash(seed * 11 + i) * bw);
    const sy = Math.floor(hash(seed * 23 + i) * bh * 0.7);
    if ((Math.floor(frame / 6) + i) % 5 !== 0) p.px(sx, sy, C.star);
  }
  p.rect(0, finalY + LH + (subtitle ? 3 * lh : 0) + 6, bw, bh, C.bg1);
  if (f0 >= 0) {
    // soft shadow grows as it falls
    const sh = f0 < land ? Math.pow(f0 / land, 2) : 1;
    const gy = finalY + LH - 1;
    for (let y = -2; y <= 2; y++) for (let x = -LW / 2; x < LW / 2; x++) {
      const px = lx0 + LW / 2 + x;
      const cov = (1 - Math.abs(x) / (LW / 2)) * sh * (1 - Math.abs(y) / 3);
      if (cov * 1.3 > bay(Math.round(px), gy + y)) p.px(px, gy + y + 2, C.bg2);
    }
    // logo
    const white = f0 === land;
    const lh2 = LH + dh;
    const lw2 = LW + dw;
    const layer = new Pix(LW, LH);
    layer.blit(outl, 0, 0);
    // shine band over the gold
    const sj = frame - shineAt;
    if (sj >= 0 && sj < 14) {
      const pos = -20 + sj * 18 * s;
      for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
        const c = layer.get(x, y);
        if (c < C.g0 || c > C.g3) continue;
        const u = x + 0.7 * y * 1;
        if ((u > pos && u < pos + 6 * s + 2) || (u > pos - 10 * s - 2 && u < pos - 10 * s)) layer.px(x, y, C.white);
      }
    }
    if (white) for (let i = 0; i < layer.d.length; i++) if (layer.d[i] !== 255) layer.d[i] = C.white;
    p.blitScaled(layer, Math.round(lx0 - dw / 2 + shake), Math.round(finalY + dy + (LH - lh2)), lw2, lh2);
    // dust + sparks
    if (j >= 0 && j < 12) {
      for (const side of [-1, 1]) for (let q = 0; q < 7; q++) {
        const rr = hash(q * 5 + (side + 2) * 17 + seed);
        const dd = (3 + rr * 6 + j * (1.6 + rr)) * s * 2;
        const px = lx0 + LW / 2 + side * (LW / 2 - 2 + dd);
        const py = gy - 1 - rr * 3 * s - j * 0.5 * s;
        if (1 - j / 12 > bay(Math.round(px), Math.round(py)) + rr * 0.2) p.rect(px, py, Math.max(1, s), Math.max(1, s), C.dust);
      }
    }
    if (j >= 0 && j < 10) {
      for (let q = 0; q < 8; q++) {
        const ang = -Math.PI * (0.1 + 0.8 * hash(q + seed * 3));
        const sp = (3 + hash(q + 40) * 4) * s;
        const px = lx0 + LW * ((q + 0.5) / 8) + Math.cos(ang) * sp * j;
        const py = finalY + 2 + Math.sin(ang) * sp * j + 0.35 * j * j * s;
        p.rect(px, py, Math.max(1, Math.round(s)), Math.max(1, Math.round(s)), j < 6 ? C.spark : C.g2);
      }
    }
    // glints at corners after the shine
    if (glints && sj >= 12 && sj < 26) {
      const k = Math.floor((sj - 12) / 2) % 4;
      const gx = [lx0 + 6, lx0 + LW - 8, lx0 + LW * 0.5, lx0 + LW * 0.25][k];
      const gyy = finalY + 3 + (k % 2) * 4;
      p.rect(gx - 3, gyy, 7, 1, C.white);
      p.rect(gx, gyy - 3, 1, 7, C.white);
    }
    // ribbon + subtitle
    const rj = j - 10;
    if (subtitle && rj >= 0) {
      const sc = Math.max(1, Math.min(Math.floor(cell / 2), Math.floor((bw * 0.82) / (subtitle.length * 6))));
      const full = Math.max(subtitle.length * 6 * sc, LW * 0.8) + 12;
      const widths = [16, 40, 64, 88];
      const rw = rj < 4 ? widths[rj] * s : Math.min(full, 88 * s + (rj - 3) * 40 * s);
      const rh = Math.max(9, 7 * sc + 4);
      const ry = finalY + LH + 7;
      const rx = Math.round(bw / 2 - rw / 2);
      p.rect(rx, ry, rw, rh, C.rib);
      p.rect(rx, ry, rw, 1, C.ribLt);
      p.rect(rx, ry + rh - 2, rw, 2, C.ribDk);
      if (rw > full * 0.6) {
        // swallow tails
        for (const sd of [-1, 1]) {
          const tx = sd < 0 ? rx - 6 : rx + rw;
          p.rect(tx, ry + 3, 6, rh, C.ribDk);
          for (let n = 0; n < 3; n++) p.rect(sd < 0 ? tx : tx + 6 - (3 - n), ry + 3 + rh - 3 + n, 3 - n, 1, C.bg0);
        }
      }
      const typed = Math.min(subtitle.length, Math.max(0, Math.floor((rj - 6) / 3) + 1));
      if (rw >= full - 2) p.text(subtitle.slice(0, typed), Math.round(bw / 2 - subtitle.length * 3 * sc), ry + Math.floor((rh - 7 * sc) / 2), C.cream, sc);
      // press start blink
      const pj = rj - 6 - subtitle.length * 3 - 6;
      if (pressStart && pj >= 0 && Math.floor(pj / 12) % 2 === 0) {
        const ps = Math.max(1, Math.floor(cell / 3));
        const tx = Math.round(bw / 2 - pressStart.length * 3 * ps);
        p.text(pressStart, tx + 1, ry + rh + 12 + 1, C.line, ps);
        p.text(pressStart, tx, ry + rh + 12, C.white, ps);
      }
    }
  }
  const rgba = pixRgba(p, pal);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <PixelImg w={bw} h={bh} rgba={rgba} width={w} height={h} />
    </AbsoluteFill>
  );
};

export const pixelLogoDrop = defineMotion<Props>({
  id: 'pixel-logo-drop',
  title: 'Pixel logo drop',
  category: 'text',
  description:
    'A chunky gold pixel-glyph logo falls with gravity, lands on a white flash frame, squashes and rebounds in 2-frame steps with a screen shake, puffs dithered dust and sparks, gets a diagonal shine sweep and corner glints; a red ribbon unfolds under it, types a subtitle and PRESS START blinks.',
  source: ['mg-styles-15 demos/20-pixel/film.js LG glyphs, drawLogo, drawRibbon, drawPress (MIT)', 'video 20-pixel 7.2-8.5 s'],
  useFor: 'Retro title cards, game-jam and stream intros, "achievement unlocked" end cards.',
  durationInFrames: 150,
  defaultProps: {
    title: 'PIXEL QUEST',
    subtitle: 'A TINY ADVENTURE',
    pressStart: 'PRESS START',
    fillRamp: ['#fff3a0', '#ffd23a', '#f0a020', '#c86414'],
    outline: '#2a1030',
    ribbonColor: '#d92b3a',
    background: '#0b0a1f',
    dropAt: 14,
    shineAt: 44,
    glints: true,
    seed: 5,
  },
  propDocs: {
    title: 'logo text (caps, 5x7 pixel glyphs; wraps per word in portrait)',
    subtitle: 'text typed on the ribbon (empty = no ribbon)',
    pressStart: 'blinking line at the bottom (empty = none)',
    fillRamp: 'four gold colours, light (top rows) to dark (bottom rows)',
    outline: 'outline colour',
    ribbonColor: 'ribbon colour',
    background: 'base backdrop colour',
    dropAt: 'frame the logo starts falling',
    shineAt: 'frame the shine band starts',
    glints: 'four-point glints after the shine',
    seed: 'seed for stars, dust and sparks',
  },
  component: PixelLogoDrop,
  tags: ['pixel', 'pixel art', 'logo', 'title', 'retro', '8-bit', 'game', 'drop', 'squash', 'shine', 'ribbon', 'press start', 'intro', 'end card', 'dust', 'sparks'],
});
