import {clamp} from './ease';
import {n2} from './random';

/**
 * Round-2 group E2: camera helpers for ken-burns (handheld "fear" rig, beat kicks, stepped punch-ins).
 * Pure functions of the frame. Rig numbers from lemo-opuscar styles/backrooms demo rig (MIT) — see THIRD_PARTY_NOTICES.md.
 */

export interface RigCfg {
  /** overall amount, 0 = off, 1 = documentary camcorder */
  amount: number;
  /** footsteps per second */
  gait: number;
  breathHz: number;
  /** fear keys 0..1 spread evenly across the duration (tremor grows with fear) */
  fear: number[];
  /** [from, to] frame ranges where the breath is held (bob/sway/breath freeze, tremor stays) */
  holdBreath: number[][];
}

const sampleKeys = (keys: number[], k: number) => {
  if (!keys.length) return 0;
  if (keys.length === 1) return keys[0];
  const x = clamp(k) * (keys.length - 1);
  const i = Math.min(keys.length - 2, Math.floor(x));
  return keys[i] + (keys[i + 1] - keys[i]) * (x - i);
};

/** px offsets, roll in degrees and a scale multiplier */
export const rigAt = (frame: number, fps: number, h: number, u: number, D: number, cfg: RigCfg, seed: number) => {
  if (cfg.amount <= 0) return {x: 0, y: 0, roll: 0, scale: 1};
  const t = frame / fps;
  const fear = sampleKeys(cfg.fear, frame / Math.max(1, D));
  const held = cfg.holdBreath.some((r) => frame >= r[0] && frame <= r[1]);
  const live = held ? 0.12 : 1;
  const a = cfg.amount;
  const bob = Math.sin(t * Math.PI * 2 * cfg.gait) * 0.006 * h * live * (1 + fear * 0.6);
  const sway = Math.sin(t * Math.PI * cfg.gait + 1.3) * 0.0033 * h * live;
  const roll = Math.sin(t * Math.PI * cfg.gait + 0.4) * 0.8 * live;
  const breath = 1 + 0.004 * Math.sin(t * Math.PI * 2 * cfg.breathHz) * live;
  const tr = (hz: number, amp: number, s: string) => n2(seed + s, t * hz, 0.7) * amp * fear * u;
  const trX = tr(1, 3, 'a') + tr(3.5, 1.6, 'b') + tr(9, 0.9, 'c');
  const trY = tr(1, 2.6, 'd') + tr(3.5, 1.5, 'e') + tr(9, 0.8, 'f');
  return {x: (sway + trX) * a, y: (bob + trY) * a, roll: roll * a, scale: 1 + (breath - 1) * a + 0.006 * a};
};

/** damped kick shake: A e^{-8u} sin(2 pi 12 u), u in seconds since the hit */
export const kickAt = (frame: number, fps: number, kicks: {at: number; amp: number}[], u: number) => {
  let x = 0;
  let y = 0;
  let r = 0;
  for (const k of kicks) {
    const s = (frame - k.at) / fps;
    if (s < 0 || s > 0.7) continue;
    const e = Math.exp(-8 * s);
    x += k.amp * u * e * Math.sin(Math.PI * 2 * 12 * s);
    y += 0.8 * k.amp * u * e * Math.cos(Math.PI * 2 * 12 * s);
    r += 0.05 * k.amp * e * Math.sin(Math.PI * 2 * 10 * s);
  }
  return {x, y, r};
};

/** stepped punch-in: the zoom of the latest punch that already happened inside this shot */
export const punchZoom = (frame: number, punches: {at: number; zoom: number}[], from: number, to: number) => {
  let z = 1;
  let at = -1;
  for (const p of punches) if (p.at >= from && p.at < to && frame >= p.at && p.at >= at) {
    z = p.zoom;
    at = p.at;
  }
  return z;
};
