// Adapted from mg-styles-15/demos/20-pixel/film.js (layers, hero sprite, entities, HUD) (MIT, © mg-styles-15 authors) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Scanlines, Vignette, useStage} from '../../core/stage';
import {
  DAY_PALETTE, Pix, PixelImg, RGB, SL, bay, cycleWater, hash, paintClouds, paintHills, paintMountains, paintSky, pixDims, pixRgba, stageAtFrame, stagePalette,
} from '../../core/r2-mg2b-kit';
import {defineMotion} from '../../core/types';

/**
 * Attract-mode pixel platformer: a 180p index-colour picture (crisp nearest-neighbour upscale) with sky, drifting clouds,
 * three parallax layers (far mountains with a palette-cycling waterfall, forest hills, near bushes), a scrolling ground
 * with a river and a sagging plank bridge, a chibi hero with a six-pose run cycle, jump and stomp arcs, coins with spin
 * frames, slimes, crates, floating "+100" popups and a SCORE / COIN HUD. Events place coins, stomps and jumps on the beat.
 */
type Ev = {t: number; kind: 'jump' | 'coin' | 'stomp' | 'stop'};
type Props = {
  events: Ev[];
  scrollSpeed: number;
  heroColor: string;
  palette: string[];
  stagesAt: number[];
  hud: boolean;
  crt: boolean;
  seed: number;
};

const arc = (f: number, t0: number, len: number, apex: number) => {
  if (f < t0 || f > t0 + len) return 0;
  const s = (f - t0) / len;
  return apex * 4 * s * (1 - s);
};
const GAP = {start: 260, width: 72, period: 640};
const gapOf = (wx: number) => {
  const m = ((wx % GAP.period) + GAP.period) % GAP.period;
  return m >= GAP.start && m < GAP.start + GAP.width ? (m - GAP.start) / GAP.width : -1;
};

const heroLayer = (frame: number, air: number, stand: boolean) => {
  const L = new Pix(22, 26);
  const pose = Math.floor(frame / 3) % 6;
  const a = (pose / 6) * Math.PI * 2;
  const hx = 10;
  const fl = (off: number, lift: number, c: number) => {
    L.line(hx, 17, hx + off, 22 - lift, c);
    L.line(hx + 1, 17, hx + off + 1, 22 - lift, c);
    L.rect(hx + off - 1, 22 - lift, 4, 2, SL.hair);
  };
  const s1 = air ? 4 : stand ? 0 : Math.sin(a) * 3.5;
  const s2 = air ? -3 : stand ? 0 : -Math.sin(a) * 3.5;
  const l1 = air ? 2 : stand ? 0 : Math.max(0, Math.cos(a)) * 2.5;
  const l2 = air ? 4 : stand ? 0 : Math.max(0, -Math.cos(a)) * 2.5;
  fl(s2, l2, SL.suitDk);
  // scarf tail (3-phase flutter)
  const sw = [0, 1, -1][Math.floor(frame / 3) % 3];
  const sc = air ? -2 : 0;
  L.rect(2, 12 + sw + sc, 6, 2, SL.coin);
  L.rect(0, 13 + (sw === 1 ? -1 : 1) + sc, 3, 2, SL.coinDk);
  // body
  L.rect(7, 11, 8, 7, SL.suit);
  L.rect(7, 16, 8, 2, SL.suitDk);
  fl(s1, l1, SL.suit);
  // arms
  const ax = air ? 4 : stand ? 0 : Math.sin(a + Math.PI) * 3;
  L.line(11, 12, 11 + ax + (air ? 2 : 0), air ? 8 : 15, SL.skin);
  // head + cap
  L.ellipse(11, 6, 5.4, 5, SL.skin);
  L.rect(5.6, 1, 11, 4, SL.suit);
  L.rect(5, 4, 12, 1, SL.suitDk);
  L.rect(14, 3, 5, 2, SL.suit);
  L.px(13, 7, SL.ink);
  L.px(14, 7, SL.ink);
  L.rect(5, 6, 2, 3, SL.hair);
  return L.outlined(SL.ink);
};
const slimeLayer = (squash: number) => {
  const L = new Pix(14, 10);
  const ry = squash > 0 ? 1.6 : 5;
  const rx = squash > 0 ? 7 : 6;
  L.ellipse(7, 9 - ry + 0.2, rx, ry, SL.slime);
  if (!squash) {
    L.rect(2, 7, 10, 2, SL.slimeDk);
    L.rect(4, 3, 2, 3, SL.white);
    L.rect(8, 3, 2, 3, SL.white);
    L.px(5, 5, SL.ink);
    L.px(9, 5, SL.ink);
  } else {
    L.rect(3, 8, 8, 1, SL.slimeDk);
  }
  return L.outlined(SL.ink);
};
const crateLayer = () => {
  const L = new Pix(14, 12);
  L.rect(1, 1, 12, 10, SL.wood);
  L.rect(1, 1, 12, 1, SL.cloud);
  L.rect(1, 10, 12, 1, SL.cabinDk);
  L.line(2, 2, 11, 9, SL.cabinDk);
  L.line(11, 2, 2, 9, SL.cabinDk);
  return L.outlined(SL.ink);
};
const coinLayer = (frame: number) => {
  const L = new Pix(9, 9);
  const wd = [5, 4, 2, 1, 2, 4][Math.floor(frame / 3) % 6];
  L.ellipse(4.5, 4.5, wd, 4, SL.coinDk);
  L.ellipse(4.5, 4.5, Math.max(0.5, wd - 1), 3, SL.coin);
  if (wd > 2) L.px(4, 3, SL.white);
  return L.outlined(SL.ink);
};

const PixelPlatformer: React.FC<Props> = ({events, scrollSpeed, heroColor, palette, stagesAt, hud, crt, seed}) => {
  const frame = useCurrentFrame();
  const {w, h} = useStage();
  const [bw, bh] = pixDims(w, h);
  const horizon = Math.round(bh * 0.5);
  const groundY = Math.round(bh * 0.76);
  const heroX = Math.round(bw * 0.3);
  const v = scrollSpeed;
  const stop = events.find((e) => e.kind === 'stop');
  const D = 12;
  const sc = (f: number) => {
    if (!stop || f <= stop.t) return v * f;
    const p = Math.min(1, (f - stop.t) / D);
    return v * (stop.t + D * (p - (p * p) / 2));
  };
  const scroll = sc(frame);
  const stopped = !!stop && frame > stop.t + D;
  const base = palette.length >= DAY_PALETTE.length ? palette : DAY_PALETTE.map((c, i) => (palette[i] ? palette[i] : c));
  const baseP = base.slice();
  if (heroColor) baseP[SL.suit] = heroColor;
  const stage = stagesAt.length ? stageAtFrame(frame, stagesAt) : 0;
  const pal: RGB[] = cycleWater(stagePalette(stage, baseP), Math.floor(frame / 3) & 3);
  const night = stage >= 4.3;

  const p = new Pix(bw, bh, SL.sky0);
  const o = {frame, seed, horizon, scroll, stars: night, sunX: Math.round(bw * 0.78), sunY: Math.round(horizon * 0.36), sunR: 9};
  paintSky(p, o);
  paintClouds(p, o, 4);
  paintMountains(p, o, 0.125, 1);
  paintHills(p, o, 0.3, true);
  // waterfall on the mid layer (palette-cycled)
  const wfSpan = 430;
  for (let i = -1; i < 3; i++) {
    const wx = 150 + i * wfSpan;
    const x = Math.round(wx - scroll * 0.3);
    if (x < -6 || x > bw + 6) continue;
    for (let y = horizon - 22; y < horizon + 1; y++) for (let k = 0; k < 4; k++) p.px(x + k, y, SL.wA + ((y >> 1) + k) % 4);
    p.rect(x - 2, horizon - 1, 8, 2, SL.cloud);
  }
  // meadow between the hills and the ground line (dithered forest -> grass)
  for (let y = horizon + 2; y < groundY; y++) for (let x = 0; x < bw; x++) {
    const k = (y - horizon - 2) / Math.max(1, groundY - horizon - 2);
    p.px(x, y, k * 1.15 > bay(x, y) ? (k > 0.55 ? SL.grass : SL.forestHi) : SL.forest);
  }
  // near bushes (factor .55)
  const bsx = scroll * 0.55;
  for (let i = Math.floor(bsx / 46) - 1; i < Math.floor(bsx / 46) + Math.ceil(bw / 46) + 2; i++) {
    const x = Math.round(i * 46 + hash(i + seed) * 20 - bsx);
    p.ellipse(x, groundY - 4, 11, 6, SL.forest);
    p.ellipse(x - 2, groundY - 6, 6, 3, SL.forestHi);
  }
  // ground, river, bridge
  const heroWorld = scroll + heroX;
  const sagAt = (wx: number, load: number) => {
    const g = gapOf(wx);
    return g < 0 ? 0 : Math.sin(g * Math.PI) * (2 + load * 2);
  };
  const heroOnBridge = gapOf(heroWorld) >= 0;
  for (let x = 0; x < bw; x++) {
    const wx = Math.floor(x + scroll);
    const g = gapOf(wx);
    if (g < 0) {
      p.rect(x, groundY, 1, 1, SL.grassHi);
      p.rect(x, groundY + 1, 1, 2, SL.grass);
      if (hash(wx * 3 + seed) < 0.12) p.px(x, groundY - 1, SL.grass);
      for (let y = groundY + 3; y < bh; y++) p.px(x, y, hash(wx * 7 + y * 13) < 0.12 + (y - groundY) / (bh * 1.8) ? SL.dirtDk : SL.dirt);
    } else {
      for (let y = groundY + 2; y < bh; y++) p.px(x, y, SL.wA + (((x + Math.floor(scroll * 0.6)) >> 2) + (y >> 1)) % 4);
      p.rect(x, groundY, 1, 2, y2(g, x, scroll) ? SL.wB : SL.wC);
      // planks
      const sag = sagAt(wx, heroOnBridge ? 1 : 0);
      const py = Math.round(groundY - 1 + sag);
      p.rect(x, py, 1, 2, (wx >> 2) % 2 ? SL.wood : SL.cabinDk);
      p.px(x, py - 1, SL.cabin);
      if (wx % 12 < 1) p.rect(x, py + 2, 1, 3, SL.cabinDk);
    }
  }
  // entities
  const entLayer: {layer: Pix; x: number; y: number}[] = [];
  const pops: {text: string; x: number; y: number}[] = [];
  let score = 0;
  let coins = 0;
  const heroGround = groundY - sagAt(heroWorld, 1);
  let air = 0;
  let airDir = 0;
  events.forEach((e, ei) => {
    const X = v * e.t + heroX;
    const sx = X - scroll;
    if (e.kind === 'coin') {
      air = Math.max(air, arc(frame, e.t - 10, 20, 34));
      for (let k = -1; k <= 1; k++) {
        const tc = e.t + (k * 9) / v;
        const cy = groundY - 13 - arc(tc, e.t - 10, 20, 34);
        if (frame < tc) entLayer.push({layer: coinLayer(frame + ei * 2), x: sx + k * 9 - 4, y: cy - 4});
        else {
          score += 100;
          coins += 1;
          const age = frame - tc;
          if (age < 22) pops.push({text: '+100', x: heroX - 8 + k * 2, y: cy - 8 - age * 0.7});
          if (age < 5) for (let q = 0; q < 4; q++) p.px(heroX + 6 + Math.cos(q * 1.57 + age) * (age * 2 + 2), cy + Math.sin(q * 1.57 + age) * (age * 2 + 2), SL.coin);
        }
      }
    } else if (e.kind === 'stomp') {
      air = Math.max(air, arc(frame, e.t - 16, 16, 30), arc(frame, e.t, 10, 12));
      if (frame < e.t) entLayer.push({layer: slimeLayer(0), x: sx - 7 + Math.sin(frame * 0.4) * 0.6, y: groundY - 9});
      else {
        score += 500;
        const age = frame - e.t;
        if (age < 7) entLayer.push({layer: slimeLayer(1), x: sx - 7 - age * 0.3, y: groundY - 9});
        if (age < 26) pops.push({text: '+500', x: heroX - 4, y: groundY - 26 - age * 0.7});
      }
    } else if (e.kind === 'jump') {
      air = Math.max(air, arc(frame, e.t - 11, 22, 30));
      if (sx > -14 && sx < bw + 14) entLayer.push({layer: crateLayer(), x: sx - 7, y: groundY - 11});
    }
  });
  airDir = air;
  for (const e of entLayer) p.blit(e.layer, Math.round(e.x), Math.round(e.y));
  const feet = Math.round(heroGround - air);
  p.blit(heroLayer(frame, airDir > 1.5 ? 1 : 0, stopped), heroX - 11, feet - 24);
  // popups + HUD
  for (const pp of pops) {
    p.text(pp.text, Math.round(pp.x) + 1, Math.round(pp.y) + 1, SL.ink);
    p.text(pp.text, Math.round(pp.x), Math.round(pp.y), SL.hud);
  }
  if (hud) {
    const mx = bh > bw ? 8 : 4; // portrait: keep the HUD inside a safe margin
    const my = bh > bw ? 12 : 4;
    const sc6 = String(score).padStart(6, '0');
    p.text('SCORE ' + sc6, mx + 1, my + 1, SL.ink);
    p.text('SCORE ' + sc6, mx, my, SL.hud);
    const ct = 'X' + String(coins).padStart(2, '0');
    const cxp = bw - mx - ct.length * 6;
    p.text(ct, cxp + 1, my + 1, SL.ink);
    p.text(ct, cxp, my, SL.hud);
    p.blit(coinLayer(0), cxp - 11, my - 1);
  }
  const rgba = pixRgba(p, pal);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <PixelImg w={bw} h={bh} rgba={rgba} width={w} height={h} />
      {crt && <Scanlines gap={Math.max(2, Math.round(w / bw / 2))} opacity={0.2} />}
      {crt && <Vignette strength={0.45} />}
    </AbsoluteFill>
  );
};
const y2 = (g: number, x: number, scroll: number) => (Math.floor(x + scroll * 0.6 + g * 40) >> 2) % 2 === 0;

export const pixelPlatformerScene = defineMotion<Props>({
  id: 'pixel-platformer-scene',
  title: 'Pixel platformer scene',
  category: 'game',
  description:
    'Attract-mode pixel platformer in crisp 180p index colour: parallax mountains, clouds, forest hills with a colour-cycling waterfall, a scrolling ground with a river and sagging plank bridge, a chibi hero running, jumping, grabbing coins and stomping slimes, with +100 / +500 popups and a SCORE / COIN HUD.',
  source: ['mg-styles-15 demos/20-pixel/film.js (MIT)', 'video 20-pixel 0.3-4.4 s'],
  useFor: 'Gaming channels, indie-game trailers, "level up" beats in explainers and nostalgic brand ads; set `events` to land coins and stomps on the music.',
  durationInFrames: 240,
  defaultProps: {
    events: [
      {t: 30, kind: 'coin'},
      {t: 56, kind: 'coin'},
      {t: 84, kind: 'stomp'},
      {t: 106, kind: 'coin'},
      {t: 205, kind: 'jump'},
      {t: 234, kind: 'stomp'},
    ],
    scrollSpeed: 1.25,
    heroColor: '',
    palette: [],
    stagesAt: [],
    hud: true,
    crt: true,
    seed: 3,
  },
  propDocs: {
    events: 'list of {t (frame the hero meets it), kind: coin | stomp | jump | stop}; stop = decelerate and stand',
    scrollSpeed: 'world scroll in pixels per frame (180p picture)',
    heroColor: 'hero suit colour (hex); empty = default red',
    palette: 'optional hex overrides for the 38 palette slots (see SLOT order in r2-mg2b-kit); empty = daylight palette',
    stagesAt: 'frames at which the day shifts to afternoon, golden, sunset, dusk, night (empty = stay daytime)',
    hud: 'show the SCORE / COIN counters',
    crt: 'scanlines + vignette over the upscaled pixels',
    seed: 'seed for clouds, trees and ground texture',
  },
  component: PixelPlatformer,
  tags: ['pixel', 'pixel art', 'platformer', 'game', '8-bit', 'retro', 'parallax', 'hero', 'coins', 'stomp', 'hud', 'score', 'attract mode', 'crt', 'level', 'trailer'],
});
