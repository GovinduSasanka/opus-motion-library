// Adapted from mg-styles-15/demos/20-pixel/film.js (env table, makeLUT, waveR / lightAt, renderAt) (MIT, © mg-styles-15 authors) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {
  DAY_PALETTE, Pix, PixelImg, RGB, SL, STAGES, bay, cycleWater, hash, litOf, mixRgbN, paintClouds, paintHills, paintMountains, paintSky, pixDims, pixRgba, stageAtFrame,
  stagePalette,
} from '../../core/r2-mg2b-kit';
import {defineMotion} from '../../core/types';

/**
 * Honest pixel-art time of day: the lakeside scene is painted once in palette SLOTS (sky, sun, mountains, forest, grass,
 * water, cabin ...) and the day only changes which colour each slot maps to - day, afternoon, golden, sunset, dusk, night -
 * each change in two 1/3 steps two frames apart, with the water slots colour-cycling. Night arrives as a dithered ring that
 * rolls in toward the lantern (150 -> 110 -> 70 -> 36 px), and a local light pool then re-lights the nearby materials with a
 * dithered falloff. Nothing is faded: every pixel stays on the palette.
 */
type Props = {
  stagesAt: number[];
  nightWave: boolean;
  lightPool: boolean;
  label: boolean;
  palette: string[];
  seed: number;
};

const PaletteLutGrade: React.FC<Props> = ({stagesAt, nightWave, lightPool, label, palette, seed}) => {
  const frame = useCurrentFrame();
  const {w, h} = useStage();
  const [bw, bh] = pixDims(w, h);
  const k = bw / 320;
  const horizon = Math.round(bh * 0.44);
  const shore = Math.round(bh * 0.74);
  const base = DAY_PALETTE.map((c, i) => palette[i] || c);
  const at = stagesAt.length >= 5 ? stagesAt : [22, 46, 70, 94, 124];
  const stage = nightWave ? stageAtFrame(frame, at.slice(0, 4)) : stageAtFrame(frame, at);
  const stars = stage >= 3.5;
  const lamp = {x: Math.round(bw * (bw > bh ? 0.27 : 0.3)), y: shore - 17};

  const p = new Pix(bw, bh, SL.sky0);
  const o = {frame, seed, horizon, scroll: frame * 0.35, stars, sunX: Math.round(bw * 0.74), sunY: Math.round(horizon * 0.5), sunR: 10};
  paintSky(p, o);
  paintClouds(p, o, 3);
  paintMountains(p, o, 0.125, 1.1);
  paintHills(p, o, 0.3, true);
  // lake with a sun / moon reflection and palette-cycled ripples
  for (let y = horizon + 2; y < shore; y++) for (let x = 0; x < bw; x++) {
    const rip = ((x >> 3) + (y >> 1) * 2 + Math.floor(Math.sin(y * 0.9) * 2)) & 3;
    p.px(x, y, SL.wA + rip);
  }
  for (let y = horizon + 3; y < shore - 1; y++) {
    const half = 2 + Math.sin(y * 1.3 + frame * 0.1) * 1.5 + (y - horizon) * 0.08;
    for (let x = -half; x <= half; x++) if (hash(y * 31 + Math.round(x) * 7 + (frame >> 3)) < 0.55) p.px(o.sunX + x, y, SL.sun);
  }
  // far shore trees (mid) + near bank
  for (let x = 0; x < bw; x++) {
    const top = shore + Math.round(Math.sin(x * 0.05 + seed) * 1.5);
    p.px(x, top, SL.grassHi);
    p.rect(x, top + 1, 1, 3, SL.grass);
    for (let y = top + 4; y < bh; y++) p.px(x, y, hash(x * 5 + y * 11) < 0.1 + (y - top) / (bh * 2.2) ? SL.dirtDk : SL.dirt);
  }
  // cabin
  const cx0 = Math.round(bw * (bw > bh ? 0.6 : 0.52));
  p.rect(cx0, shore - 18, 34, 19, SL.cabin);
  p.rect(cx0, shore - 3, 34, 3, SL.cabinDk);
  for (let r = 0; r < 18; r += 4) p.rect(cx0, shore - 18 + r, 34, 1, SL.cabinDk);
  for (let j = 0; j < 12; j++) p.rect(cx0 - 3 + j * 0.6 * 1, shore - 30 + j, 40 - j * 1.2, 1, SL.roof);
  p.rect(cx0 + 4, shore - 14, 7, 7, SL.cabinDk);
  p.rect(cx0 + 5, shore - 13, 5, 5, SL.glow);
  p.rect(cx0 + 7, shore - 13, 1, 5, SL.cabinDk);
  p.rect(cx0 + 22, shore - 14, 7, 14, SL.cabinDk);
  p.rect(cx0 + 25, shore - 8, 1, 1, SL.coin);
  p.rect(cx0 + 24, shore - 33, 4, 8, SL.cabinDk);
  // pines on the near bank + lantern
  const pines = [0.06, 0.45, 0.9, 0.97];
  pines.forEach((f, i) => {
    const x = Math.round(bw * f);
    const hh = 24 + (i % 2) * 8;
    p.rect(x - 1, shore - 4, 3, 5, SL.trunk);
    for (let t = 0; t < 4; t++) p.tri(x, shore - hh + t * 6, 4 + t * 2, 9, t % 2 ? SL.forestHi : SL.forest);
  });
  p.rect(lamp.x, lamp.y + 3, 2, 14, SL.trunk);
  p.rect(lamp.x - 2, lamp.y - 2, 6, 6, SL.ink);
  p.rect(lamp.x - 1, lamp.y - 1, 4, 4, SL.glow);
  if (label) {
    const name = (STAGES[Math.min(5, Math.round(stage))] ?? 'night').toUpperCase();
    const nm = nightWave && frame >= at[4] ? 'NIGHT' : name;
    const mx = bh > bw ? 8 : 4;
    const my = bh > bw ? 12 : 4;
    p.text(nm, mx + 1, my + 1, SL.ink);
    p.text(nm, mx, my, SL.hud);
  }

  // palettes: current stage, night, and the warm re-lit day materials
  const water = Math.floor(frame / 3) & 3;
  const palA: RGB[] = cycleWater(stagePalette(stage, base), water);
  const palN: RGB[] = cycleWater(stagePalette(5, base), water);
  const palD: RGB[] = stagePalette(0, base);
  const radii = [150, 110, 70, 36];
  const wStep = 3;
  const nightOn = nightWave && frame >= at[4];
  const wi = Math.floor((frame - at[4]) / wStep);
  const R = !nightOn ? 1e9 : (wi >= radii.length ? 0 : radii[wi]) * k;
  const poolOn = lightPool && nightWave && frame >= at[4] + 16;
  const poolR = 34 * k * (1 + 0.04 * Math.sin(frame * 0.5) * (hash(frame >> 1) > 0.5 ? 1 : 0));
  const poolR1 = 17 * k;
  const lit = (c: number): boolean => c > SL.sky4 && c !== SL.sun && c !== SL.star && c !== SL.glow && c !== SL.white && c !== SL.hud;
  const cxw = lamp.x + 1;
  const cyw = lamp.y + 1;
  const rgba = pixRgba(p, palA, (x, y, c) => {
    const d = Math.hypot(x - cxw, (y - cyw) * 1.15);
    let col = palA[c];
    if (nightWave) {
      if (nightOn) {
        const t = (d - R) / (12 * k) + 0.5;
        const isNight = R === 0 || t > bay(x, y);
        col = isNight ? palN[c] : palA[c];
        if (poolOn && lit(c) && d < poolR) {
          const L = litOf(palD[c]);
          if (d < poolR1) col = L;
          else col = (1 - (d - poolR1) / (poolR - poolR1)) * 1.3 > bay(x, y) ? mixRgbN(palN[c], L, 0.55) : col;
        }
      }
    }
    return col;
  });
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <PixelImg w={bw} h={bh} rgba={rgba} width={w} height={h} />
    </AbsoluteFill>
  );
};

export const paletteLutGrade = defineMotion<Props>({
  id: 'palette-lut-grade',
  title: 'Palette LUT grade',
  category: 'game',
  description:
    'A pixel lakeside scene changes time of day by swapping palette slots, not by fading: day, afternoon, golden, sunset, dusk, night, each in two 1/3 steps; a dithered night front rolls in toward a lantern and a dithered light pool re-lights the nearby cabin and ground; water slots colour-cycle and stars twinkle.',
  source: ['mg-styles-15 demos/20-pixel/film.js env table, makeLUT, waveR/lightAt (MIT)', 'video 20-pixel 1.6-8.3 s'],
  useFor: 'Honest pixel-art day/night, mood shifts and spotlight effects that never leave the palette; the grading model for any pixel scene (slot-indexed art + per-stage colour table).',
  durationInFrames: 210,
  defaultProps: {stagesAt: [22, 46, 70, 94, 124], nightWave: true, lightPool: true, label: true, palette: [], seed: 4},
  propDocs: {
    stagesAt: 'five frames: when afternoon, golden, sunset, dusk and night start',
    nightWave: 'night arrives as a dithered ring rolling in toward the lantern (false = plain 1/3-step change)',
    lightPool: 'after night, the lantern re-lights nearby materials with a dithered falloff',
    label: 'show the current stage name in pixel text',
    palette: 'optional hex overrides for the daylight slot colours (38 slots, see SLOT order in r2-mg2b-kit)',
    seed: 'seed for clouds, trees and ground texture',
  },
  component: PaletteLutGrade,
  tags: ['pixel', 'pixel art', 'palette', 'lut', 'day night', 'time of day', 'sunset', 'night', 'dither', 'light pool', 'lantern', 'colour cycling', 'grade', 'retro', 'game', 'landscape'],
});
