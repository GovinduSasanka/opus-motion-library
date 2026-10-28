// Adapted from mg-styles-15/demos/20-pixel/film.js (drawRays, fountPos, zoomAt, chest states) (MIT, © mg-styles-15 authors) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {hexRgb} from '../../core/r2-s1-kit';
import {Pix, PixelImg, RGB, bay, hash, mixRgbN, pixDims, pixRgba} from '../../core/r2-mg2b-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Pixel reward beat: a treasure chest shakes while the picture steps in by whole-number zooms (x6, x8, x10, x12) with a
 * "?" then "!" bubble, hops its lid twice, then bursts open: palette flash, a rotating fan of 18 dithered light rays that
 * grows and collapses in two stepped drops, a ballistic coin fountain and an item that rises and glows. Everything stays
 * on whole pixels.
 */
type Props = {
  at: number;
  item: 'gem' | 'star' | 'heart';
  itemColor: string;
  rayColors: string[];
  fountainCount: number;
  zoomSteps: number[];
  emotes: boolean;
  seed: number;
};

const C = {bg: 0, wall: 1, wallLt: 2, floor: 3, floorLt: 4, wood: 5, woodDk: 6, woodLt: 7, metal: 8, gold: 9, goldDk: 10, white: 11, ink: 12, rayA: 13, rayB: 14, item: 15, itemLt: 16, bubble: 17};
const SPR: Record<string, string[]> = {
  gem: ['..####..', '.######.', '########', '########', '.######.', '..####..', '...##...'],
  star: ['...#...', '...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '.#...#.'],
  heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
};

const PixelRewardBurst: React.FC<Props> = ({at, item, itemColor, rayColors, fountainCount, zoomSteps, emotes, seed}) => {
  const frame = useCurrentFrame();
  const {w, h} = useStage();
  const [bw, bh] = pixDims(w, h);
  const k = bw / 320;
  const ww = Math.ceil(bw / 6) + 10;
  const wh = Math.ceil(bh / 6) + 10;
  const floorY = Math.round(wh * 0.66);
  const cxw = Math.floor(ww / 2);
  const tau = frame - at;
  const opened = tau >= 0;

  // ---- zoom + shake + lid hops
  const zs = zoomSteps.length >= 4 ? zoomSteps : [6, 8, 10, 12];
  const stage = tau >= 0 ? 0 : tau >= -6 ? 3 : tau >= -9 ? 2 : tau >= -12 ? 1 : 0;
  const z = zs[stage];
  const sh = stage === 0 ? 0 : stage === 1 ? (frame & 1 ? -0.5 : 0.5) : frame & 1 ? -0.5 : 1;
  const ox = Math.round(sh * z * 0.5);
  const hop1 = tau >= -9 && tau < -7 ? 1 : 0;
  const hop2 = tau >= -4 && tau < -2 ? 2 : 0;
  const lidLift = hop1 || hop2;

  // ---- world
  const wp = new Pix(ww, wh, C.bg);
  for (let y = 0; y < floorY; y++) for (let x = 0; x < ww; x++) {
    const row = Math.floor(y / 4);
    const off = row % 2 ? 4 : 0;
    wp.d[y * ww + x] = (x + off) % 8 === 0 || y % 4 === 0 ? C.wall : C.wallLt;
  }
  for (let y = floorY; y < wh; y++) for (let x = 0; x < ww; x++) wp.d[y * ww + x] = ((x >> 2) + ((y - floorY) >> 1)) % 2 ? C.floor : C.floorLt;
  wp.rect(0, floorY - 1, ww, 1, C.ink);
  const bx = cxw - 7;
  const by = floorY - 8;
  wp.ellipse(cxw, floorY + 1, 10, 2, C.ink);
  wp.rect(bx, by, 14, 8, C.wood);
  wp.rect(bx, by + 6, 14, 2, C.woodDk);
  wp.rect(bx + 6, by, 2, 8, C.metal);
  if (!opened) {
    const ly = by - 4 - (lidLift ? 1 : 0);
    wp.rect(bx, ly, 14, 4, C.woodLt);
    wp.rect(bx + 1, ly - 1, 12, 1, C.woodLt);
    wp.rect(bx, ly + 3, 14, 1, C.woodDk);
    wp.rect(bx + 6, ly, 2, 4, C.metal);
    wp.rect(bx + 6, by + 1, 2, 2, C.gold);
  } else {
    wp.rect(bx + 1, by - 1, 12, 2, C.gold);
    wp.rect(bx + 2, by - 1, 10, 1, C.white);
    wp.rect(bx + 1, by - 6, 12, 2, C.woodDk);
    wp.rect(bx + 1, by - 5, 12, 4, C.woodLt);
    wp.rect(bx + 6, by - 6, 2, 5, C.metal);
  }
  wp.rect(bx, by, 14, 1, C.woodLt);
  wp.rect(bx, by - 1, 1, 9, C.ink);
  wp.rect(bx + 13, by - 1, 1, 9, C.ink);
  wp.rect(bx, by + 8, 14, 1, C.ink);

  // ---- output: whole-number zoom sampled from the world
  const out = new Pix(bw, bh, C.bg);
  const camY = floorY - 6;
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const wx = Math.floor(cxw + (x - bw / 2 - ox) / z);
    const wy = Math.floor(camY + (y - bh / 2) / z);
    const v = wp.get(wx, wy);
    out.d[y * bw + x] = v === 255 ? C.bg : v;
  }
  const ccx = Math.round(bw / 2 + ox);
  const ccy = Math.round(bh / 2 - 2 * z);
  const chestTop = ccy;

  if (opened) {
    // ---- rays (dithered, behind the chest)
    const R0 = tau < 6 ? 30 + 26 * tau : tau < 32 ? 160 - 4 * (tau - 5) + 2 * Math.sin(tau) : tau < 35 ? 34 : tau < 38 ? 18 : 0;
    const R = R0 * k;
    if (R > 0) {
      const rot = 0.035 * Math.floor(tau / 3);
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
        const c0 = out.d[y * bw + x];
        if (c0 > C.floorLt) continue;
        const dx = x - ccx;
        const dy = y - chestTop;
        const d = Math.hypot(dx, dy);
        if (d < 14 * k || d > R) continue;
        const band = Math.floor(((Math.atan2(dy, dx) + Math.PI + rot) / (Math.PI * 2)) * 18);
        if (band % 2) continue;
        const fall = Math.min(1, (R - d) / (R * 0.55));
        if (fall * 1.3 > bay(x, y)) out.d[y * bw + x] = fall > 0.6 && bay(x, y) < 0.5 ? C.rayB : C.rayA;
      }
    }
    // ---- coin fountain (integer ballistic)
    const gy = Math.round(bh * 0.8);
    for (let i = 0; i < fountainCount; i++) {
      const t0 = 1 + Math.floor(i / 2);
      const t = (tau - t0) / 30;
      if (t < 0) continue;
      const vx = (hash(i * 7 + seed) - 0.5) * 110 * k;
      const vy = -(170 + hash(i * 3 + seed + 9) * 110) * k;
      const g = 520 * k;
      let py = chestTop + vy * t + 0.5 * g * t * t;
      const px = ccx + vx * t;
      if (py > gy) {
        const tl = (-vy + Math.sqrt(vy * vy + 2 * g * (gy - chestTop))) / g;
        const tb = t - tl;
        py = gy - Math.max(0, 0.4 * -vy * tb * 0.9 - 0.5 * g * tb * tb * 0.9);
      }
      const wd = [5, 4, 2, 1, 2, 4][(Math.floor(frame / 3) + i) % 6];
      const sc = Math.max(1, Math.round(k * 1.2));
      out.ellipse(Math.round(px), Math.round(py), (wd * sc) / 2 + 0.5, 2.5 * sc, C.ink);
      out.ellipse(Math.round(px), Math.round(py), Math.max(0.5, (wd * sc) / 2 - 0.5), 2 * sc - 0.5, C.gold);
    }
    // ---- rising item with a glow
    const rise = Math.min(1, Math.max(0, (tau - 4) / 22));
    const ez = 1 - Math.pow(1 - rise, 3);
    const iy = Math.round(chestTop - 8 * k * 3 - 28 * k * ez + (rise >= 1 ? Math.sin(tau * 0.25) * 1.5 : 0));
    const sc = Math.max(2, Math.round(bh / 90));
    if (tau > 3) {
      const gr = (16 + 6 * Math.sin(tau * 0.3)) * k * ez;
      for (let y = -Math.ceil(gr); y <= gr; y++) for (let x = -Math.ceil(gr); x <= gr; x++) {
        const d = Math.hypot(x, y);
        const X = ccx + x;
        const Y = iy + y;
        if (d < gr && (1 - d / gr) * 0.9 > bay(X, Y) && out.get(X, Y) <= C.floorLt) out.px(X, Y, C.rayB);
      }
      const spr = SPR[item] ?? SPR.gem;
      const sw = spr[0].length;
      for (let j = 0; j < spr.length; j++) for (let i = 0; i < sw; i++) {
        if (spr[j][i] !== '#') continue;
        const px = ccx - Math.floor((sw * sc) / 2) + i * sc;
        const py = iy - Math.floor((spr.length * sc) / 2) + j * sc;
        out.rect(px - 1, py - 1, sc + 2, sc + 2, C.ink);
      }
      for (let j = 0; j < spr.length; j++) for (let i = 0; i < sw; i++) {
        if (spr[j][i] !== '#') continue;
        const px = ccx - Math.floor((sw * sc) / 2) + i * sc;
        const py = iy - Math.floor((spr.length * sc) / 2) + j * sc;
        out.rect(px, py, sc, sc, i + j < 4 ? C.itemLt : C.item);
      }
    }
  }
  // ---- emote bubbles
  if (emotes) {
    const show = (a: number, b: number, ch: string) => {
      if (frame < a || frame >= b) return;
      const p = Math.min(1, (frame - a) / 3);
      const bs = Math.max(1, Math.round(z / 5));
      const bwid = Math.round(12 * bs * p);
      const bx0 = ccx + 6 * z * 0.4;
      const by0 = chestTop - 12 * z * 0.5 - 16 * bs;
      out.rect(bx0 - 1, by0 - 1, bwid + 2, 14 * bs + 2, C.ink);
      out.rect(bx0, by0, bwid, 14 * bs, C.white);
      out.rect(bx0 + 2 * bs, by0 + 14 * bs, 2 * bs, 2 * bs, C.white);
      if (p >= 1) out.text(ch, Math.round(bx0 + 3.5 * bs - bs / 2), Math.round(by0 + 3.5 * bs), C.ink, bs);
    };
    show(Math.max(0, at - 28), at - 12, '?');
    show(at - 7, at, '!');
  }

  // ---- palette (flash on the burst)
  const fl = tau === 0 ? 0.85 : tau === 1 ? 0.45 : tau === 2 ? 0.18 : 0;
  const raw: RGB[] = [
    hexRgb('#0d0b1e'), hexRgb('#2a2450'), hexRgb('#3a3270'), hexRgb('#4a3a5a'), hexRgb('#5c486e'), hexRgb('#b5703d'), hexRgb('#7d4425'), hexRgb('#d99a5a'), hexRgb('#9aa6c0'),
    hexRgb('#ffd23a'), hexRgb('#c8901a'), [255, 255, 255], hexRgb('#140f24'), hexRgb(rayColors[0] ?? '#ffe27a'), hexRgb(rayColors[1] ?? '#fff6c8'), hexRgb(itemColor), mixRgbN(hexRgb(itemColor), [255, 255, 255], 0.6), [255, 255, 255],
  ].map((c) => c as RGB);
  const pal = fl ? raw.map((c) => mixRgbN(c, [255, 255, 255], fl)) : raw;
  const rgba = pixRgba(out, pal);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <PixelImg w={bw} h={bh} rgba={rgba} width={w} height={h} />
    </AbsoluteFill>
  );
};

export const pixelRewardBurst = defineMotion<Props>({
  id: 'pixel-reward-burst',
  title: 'Pixel reward burst',
  category: 'game',
  description:
    'A pixel treasure chest shakes while the view steps in by whole-number zooms (x6, x8, x10, x12) with "?" and "!" bubbles and two lid hops, then bursts open: palette flash, a rotating fan of dithered light rays that grows and collapses in stepped drops, a ballistic coin fountain and a gem that rises and glows.',
  source: ['mg-styles-15 demos/20-pixel/film.js drawRays, fountPos, zoomAt, chest states (MIT)', 'video 20-pixel 5.9-7.2 s'],
  useFor: 'Unlock / reward / reveal beats in gamified product videos, giveaways and "new feature" reveals.',
  durationInFrames: 120,
  defaultProps: {
    at: 34,
    item: 'gem',
    itemColor: '#35e0ff',
    rayColors: ['#ffe27a', '#fff6c8'],
    fountainCount: 16,
    zoomSteps: [6, 8, 10, 12],
    emotes: true,
    seed: 2,
  },
  propDocs: {
    at: 'frame of the burst (flash)',
    item: 'rising reward: gem | star | heart',
    itemColor: 'item colour',
    rayColors: 'two ray colours, outer and inner',
    fountainCount: 'coins in the fountain',
    zoomSteps: 'four whole-number zoom levels before the burst',
    emotes: 'show the ? and ! speech bubbles',
    seed: 'seed for the coin fountain',
  },
  component: PixelRewardBurst,
  tags: ['pixel', 'pixel art', 'reward', 'chest', 'treasure', 'loot', 'unlock', 'coins', 'rays', 'burst', 'zoom', 'game', 'retro', 'reveal', 'giveaway', 'gamification'],
});
