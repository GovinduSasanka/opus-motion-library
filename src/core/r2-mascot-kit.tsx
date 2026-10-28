// Adapted from ClaudeAnimationBase/src/clawd.js + src/core.js (MIT, © 2026 John Heibel) — see THIRD_PARTY_NOTICES.md
// Ported: the emotion behaviour table (eyes/mouth/tint/take + beat-locked idle formulas), the acted emotion timeline,
// beat dances, take/jump curves, the emote vocabulary and the per-part boil idea, re-expressed as deterministic SVG.
// NOT ported: the character design. "Nib" is an original library mascot — a plump ink-drop with a spring-driven
// curl, round eyes, separate brows, noodle arms and two capsule legs (no box body, no slit eyes, no four legs).
import React from 'react';
import {mixHex} from './character-kit';

// ------------------------------------------------------------------ vocab
export const EMOTIONS_LIST = [
  'neutral', 'happy', 'excited', 'laugh', 'love', 'shy', 'proud', 'smug', 'relieved', 'sad', 'cry', 'angry', 'furious', 'scared',
  'surprised', 'confused', 'thinking', 'idea', 'determined', 'sleepy', 'bored', 'nervous', 'suspicious', 'disgusted', 'dizzy', 'cool',
  'starstruck', 'ko', 'playful', 'mischief', 'hopeful',
] as const;
export type Emotion = (typeof EMOTIONS_LIST)[number];
export const EYE_KINDS = [
  'normal', 'look', 'wide', 'happy', 'closed', 'sleepy', 'wink', 'narrow', 'angry', 'determined', 'sad', 'teary', 'cry', 'squeeze',
  'shine', 'scared', 'blank', 'spark', 'red', 'heart', 'x', 'swirl', 'dot', 'shades',
] as const;
export type EyeKind = (typeof EYE_KINDS)[number];
export const BROW_KINDS = ['flat', 'raised', 'worried', 'angry', 'one-up', 'knit', 'none'] as const;
export type BrowKind = (typeof BROW_KINDS)[number];
export const MOUTH_KINDS = ['o', 'O', 'smile', 'grin', 'flat', 'wobble', 'cat', 'frown', 'smirk', 'laugh', 'open', 'wail', 'teeth', 'tongue', 'pout', 'yawn', 'chomp'] as const;
export type MouthKind = (typeof MOUTH_KINDS)[number];
export const CURL_KINDS = ['rest', 'perk', 'droop', 'hook', 'spiral', 'flicker', 'glow'] as const;
export type CurlKind = (typeof CURL_KINDS)[number];
export const EMOTE_KINDS = ['!', '?', '!!', '!?', 'zzz', 'sweat', 'spark', 'heart', 'hearts', 'anger', 'steam', 'bulb', 'dots', 'scribble', 'music', 'swirl', 'stars', 'cloud'] as const;
export type EmoteKind = (typeof EMOTE_KINDS)[number];
export const HAT_KINDS = ['party', 'crown', 'top', 'beanie', 'headphones', 'halo', 'wizard', 'bow', 'flower', 'cap'] as const;
export type HatKind = (typeof HAT_KINDS)[number] | '';
export const VIEW_KINDS = ['front', 'q', 'side', 'qback', 'back'] as const;
export type NibView = (typeof VIEW_KINDS)[number];
export const DANCE_STYLES = ['bounce', 'hop', 'roof', 'sway', 'spin', 'wave', 'walk', 'run', 'idle', 'stomp', 'shimmy', 'mix'] as const;
export type DanceStyle = (typeof DANCE_STYLES)[number];
export type TintName = 'pale' | 'flush' | 'blue' | 'rosy' | 'green' | 'gold';

export type NibColors = {body: string; shade: string; light: string; ink: string; cheek: string; accent: string; cream: string; paper: string};
export const NIB_COLORS: NibColors = {body: '#3F63C9', shade: '#2B4596', light: '#93AEF2', ink: '#1E1B2E', cheek: '#F28AA0', accent: '#F2B84B', cream: '#FFF6E6', paper: '#F4EEE2'};
const TINTS: Record<TintName, string> = {pale: '#E9E4F2', flush: '#E23E36', blue: '#6D86BE', rosy: '#EF8EA8', green: '#98B25E', gold: '#F0BE46'};
const DARK = '#3A1830';
const ROSE = '#E27A92';
const SKY = '#8EC3E6';
const OCHRE = '#E8AA38';
const INDIGO = '#2F3C7A';
const VIOLET = '#7B5CA8';

// ------------------------------------------------------------------ math
const TAU = Math.PI * 2;
const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const frac = (x: number) => x - Math.floor(x);
const seg = (x: number, a: number, b: number) => clamp((x - a) / (b - a));
const easeIO = (x: number) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const backOut = (x: number, s = 1.9) => {
  x = clamp(x);
  return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
};
export const hashN = (...xs: number[]) => {
  let h = 2166136261 >>> 0;
  for (const x of xs) {
    h ^= Math.floor(x * 1000003) | 0;
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
};
const f2 = (n: number) => (Math.round(n * 1000) / 1000).toString();
const pts2d = (pts: [number, number][]) => 'M' + pts.map(([x, y]) => `${f2(x)} ${f2(y)}`).join(' L') + ' Z';
const open2d = (pts: [number, number][]) => 'M' + pts.map(([x, y]) => `${f2(x)} ${f2(y)}`).join(' L');

// ------------------------------------------------------------------ timing curves (core.js, MIT)
/** surprise "take" peaking at t0 (seconds): pre-squash then a stretch-up spring */
export const takeAt = (t: number, t0: number, amt = 1) => {
  if (t < t0 - 0.1) return {sq: 0, dy: 0};
  if (t < t0) return {sq: 0.12 * amt * easeIO(seg(t, t0 - 0.1, t0)), dy: 0};
  const a = t - t0;
  return {sq: -0.26 * amt * Math.exp(-6 * a) * Math.cos(16 * a), dy: -1.2 * amt * Math.exp(-7 * a) * Math.max(0, Math.cos(9 * a))};
};
/** hop: crouch 0.12 s, parabola h units high, stretch at take-off/landing, squash on landing */
export const jumpAt = (t: number, t0: number, t1: number, h = 3) => {
  if (t < t0 - 0.12) return {dy: 0, sq: 0};
  if (t < t0) return {dy: 0, sq: 0.18 * easeIO(seg(t, t0 - 0.12, t0))};
  if (t < t1) {
    const k = (t - t0) / (t1 - t0);
    return {dy: -h * 4 * k * (1 - k), sq: -0.16 * Math.abs(1 - 2 * k)};
  }
  const a = t - t1;
  return {dy: 0, sq: 0.22 * Math.exp(-8 * a) * Math.cos(20 * a)};
};
/** auto-blink: closed 0.12 s every 3.3 s, per-character seed so crowds never twin */
export const blinkAt = (sec: number, seed = 1) => {
  const p = (sec + seed * 1.37) % 3.3;
  return p < 0.12 ? Math.sin((p / 0.12) * Math.PI) : 0;
};

// ------------------------------------------------------------------ emotions
export type BeatCtx = {bp: number; sec: number; s1: number; ab: number; hit: number; s2: number; f: number; pulse2: number; beatN: number; beatSec: number};
export const beatCtx = (sec: number, bpm = 120, offsetSec = 0): BeatCtx => {
  const beatSec = 60 / Math.max(1, bpm);
  const bp = (sec - offsetSec) / beatSec;
  const s1 = Math.sin(bp * Math.PI);
  return {bp, sec, s1, ab: Math.abs(s1), hit: Math.exp(-6 * frac(bp)), s2: Math.sin(bp * TAU), f: frac(bp), pulse2: Math.exp(-6 * frac(bp * 2)), beatN: Math.floor(bp), beatSec};
};
export type PoseDelta = {dx?: number; dy?: number; sq?: number; rot?: number; aL?: number; aR?: number; lookX?: number; lookY?: number};
export type EmotionDef = {
  eyes: EyeKind | [EyeKind, EyeKind];
  brows: BrowKind;
  mouth: MouthKind | null;
  curl: CurlKind;
  tint?: TintName;
  tintK?: number;
  blush?: number;
  gloom?: number;
  chomp?: number;
  emote?: EmoteKind;
  /** one-off emote that fades out */
  fade?: boolean;
  take: number;
  /** family + what it is for (helps agents pick) */
  family: 'joy' | 'mind' | 'sly' | 'low' | 'hot' | 'alarm';
  useFor: string;
  idle: (b: BeatCtx) => PoseDelta;
};

/** 31 emotions: face (eyes, brows, mouth, curl) + colour + emote + take size + beat-locked idle body. */
export const EMOTIONS: Record<Emotion, EmotionDef> = {
  neutral: {eyes: 'normal', brows: 'flat', mouth: 'smile', curl: 'rest', take: 0.3, family: 'mind', useFor: 'resting, listening', idle: (b) => ({dy: -0.25 * b.ab, sq: 0.03 * b.hit, aL: -0.55 + 0.05 * b.s1, aR: -0.55 - 0.05 * b.s1})},
  happy: {eyes: 'happy', brows: 'raised', mouth: 'grin', curl: 'rest', blush: 0.3, take: 0.6, family: 'joy', useFor: 'default positive beat', idle: (b) => ({dy: -1.2 * b.ab, sq: 0.1 * b.hit, aL: 0.2 + 0.4 * b.s1, aR: 0.2 - 0.4 * b.s1})},
  excited: {eyes: 'wide', brows: 'raised', mouth: 'open', curl: 'perk', emote: 'spark', take: 1, family: 'joy', useFor: 'yes!, wins, anticipation', idle: (b) => {
    const h = Math.abs(b.s2);
    return {dy: -2.4 * h, sq: 0.16 * b.pulse2 - 0.06 * h, aL: 1 + 0.5 * Math.sin(b.bp * TAU * 2), aR: 1 - 0.5 * Math.sin(b.bp * TAU * 2)};
  }},
  laugh: {eyes: 'squeeze', brows: 'raised', mouth: 'laugh', curl: 'rest', blush: 0.45, take: 0.8, family: 'joy', useFor: 'jokes, punchlines', idle: (b) => {
    const c = Math.abs(Math.sin(b.sec * TAU * 5));
    return {dy: -0.45 * c, sq: 0.08 * c - 0.04, rot: -0.07 + 0.03 * Math.sin(b.sec * TAU * 5), aL: -0.35 + 0.12 * c, aR: -0.35 + 0.12 * c};
  }},
  love: {eyes: 'heart', brows: 'raised', mouth: 'cat', curl: 'rest', blush: 0.8, tint: 'rosy', tintK: 0.5, emote: 'hearts', take: 0.7, family: 'joy', useFor: 'affection, cute payoff', idle: (b) => {
    const s = Math.sin((b.bp * Math.PI) / 2);
    return {rot: 0.08 * s, dx: 0.5 * s, dy: -0.6 * b.ab, sq: 0.05 * b.hit, aL: -0.1 + 0.15 * b.s1, aR: -0.1 - 0.15 * b.s1};
  }},
  shy: {eyes: 'look', brows: 'worried', mouth: 'wobble', curl: 'droop', blush: 1, take: 0.3, family: 'mind', useFor: 'compliments, embarrassment', idle: (b) => {
    const s = Math.sin((b.bp * Math.PI) / 2);
    return {lookX: -0.7, lookY: 0.8, sq: 0.06, rot: -0.05 + 0.02 * s, dx: 0.15 * s, aL: -0.55 + 0.15 * Math.sin(b.sec * TAU * 1.5), aR: -0.6 - 0.12 * Math.sin(b.sec * TAU * 1.5)};
  }},
  proud: {eyes: 'closed', brows: 'raised', mouth: 'smile', curl: 'perk', tint: 'gold', tintK: 0.3, emote: 'spark', take: 0.5, family: 'joy', useFor: 'achievement, done', idle: (b) => ({sq: -0.1 - 0.03 * b.ab, dy: -0.3 * b.hit, aL: -0.9, aR: -0.9, rot: 0.02 * b.s1})},
  smug: {eyes: 'narrow', brows: 'one-up', mouth: 'smirk', curl: 'rest', take: 0.4, family: 'sly', useFor: 'told you so, winner', idle: (b) => {
    const s = Math.sin((b.bp * Math.PI) / 2);
    return {lookX: 0.4, rot: -0.06 + 0.03 * s, dy: -0.2 * b.ab, aL: -0.5, aR: 0.5 + 0.15 * s};
  }},
  relieved: {eyes: 'closed', brows: 'worried', mouth: 'smile', curl: 'rest', emote: 'sweat', take: 0.4, family: 'joy', useFor: 'after danger, problem solved', idle: (b) => {
    const br = Math.sin(b.sec * TAU * 0.35);
    return {sq: 0.05 + 0.05 * br, dy: -0.15 * b.ab, aL: -0.7 + 0.1 * br, aR: -0.7 + 0.1 * br};
  }},
  sad: {eyes: 'sad', brows: 'worried', mouth: 'frown', curl: 'droop', tint: 'blue', tintK: 0.35, gloom: 0.35, emote: 'cloud', take: 0.3, family: 'low', useFor: 'loss, failure, rejection', idle: (b) => {
    const s = Math.sin((b.bp * Math.PI) / 4);
    return {sq: 0.08 + 0.02 * s, rot: 0.03 * s, aL: -0.95, aR: -0.95, lookY: 0.5};
  }},
  cry: {eyes: 'cry', brows: 'worried', mouth: 'wail', curl: 'droop', tint: 'blue', tintK: 0.2, take: 0.8, family: 'low', useFor: 'big sadness, comic despair', idle: (b) => {
    const sob = Math.sin(b.f * Math.PI) * Math.exp(-b.f * 2);
    return {sq: 0.14 * sob - 0.02, dy: -0.7 * sob, aL: 0.9 + 0.15 * Math.sin(b.sec * TAU * 6), aR: 0.9 - 0.15 * Math.sin(b.sec * TAU * 6), rot: 0.03 * b.s1};
  }},
  angry: {eyes: 'angry', brows: 'angry', mouth: 'teeth', curl: 'flicker', tint: 'flush', tintK: 0.45, emote: 'anger', take: 0.8, family: 'hot', useFor: 'annoyance, bug in prod', idle: (b) => ({dx: 0.1 * Math.sin(b.sec * TAU * 18), sq: 0.12 * b.hit, aL: -0.3 + 0.3 * b.hit, aR: -0.3 + 0.3 * b.hit})},
  furious: {eyes: 'red', brows: 'angry', mouth: 'chomp', chomp: 0.75, curl: 'flicker', tint: 'flush', tintK: 0.85, emote: 'steam', take: 1.2, family: 'hot', useFor: 'rage, chomping, shouting', idle: (b) => ({
    dx: 0.22 * Math.sin(b.sec * TAU * 20), rot: 0.025 * Math.sin(b.sec * TAU * 13), sq: 0.2 * b.hit, dy: -0.8 * Math.sin(b.f * Math.PI) * (1 - b.f), aL: 1 + 0.2 * Math.sin(b.sec * TAU * 9), aR: 1 - 0.2 * Math.sin(b.sec * TAU * 9),
  })},
  scared: {eyes: 'scared', brows: 'worried', mouth: 'wobble', curl: 'perk', tint: 'pale', tintK: 0.6, emote: 'sweat', take: 1.1, family: 'alarm', useFor: 'danger, jump scare', idle: (b) => ({
    dx: 0.1 * Math.sin(b.sec * TAU * 22), sq: -0.06, aL: 1 + 0.08 * Math.sin(b.sec * TAU * 17), aR: 1 + 0.08 * Math.sin(b.sec * TAU * 19), lookX: 0.6 * Math.sign(Math.sin(b.sec * 2.3)),
  })},
  surprised: {eyes: 'wide', brows: 'raised', mouth: 'O', curl: 'perk', emote: '!', fade: true, take: 1.3, family: 'alarm', useFor: 'discovery, plot twist', idle: (b) => ({sq: -0.12, dy: -0.3 - 0.15 * b.ab, aL: 1.1 + 0.05 * b.s2, aR: 1.1 - 0.05 * b.s2})},
  confused: {eyes: ['narrow', 'wide'], brows: 'one-up', mouth: 'wobble', curl: 'hook', emote: '?', take: 0.6, family: 'alarm', useFor: 'errors, questions', idle: (b) => ({rot: 0.1 * Math.sin((b.bp * Math.PI) / 4), aL: -0.4, aR: 1.5 + 0.15 * Math.sin(b.sec * TAU * 3), dy: -0.15 * b.ab})},
  thinking: {eyes: 'look', brows: 'one-up', mouth: 'flat', curl: 'hook', emote: 'dots', take: 0.4, family: 'mind', useFor: 'loading, pondering', idle: (b) => ({lookX: 0.5, lookY: -0.8, rot: 0.05, aR: 0.9, aL: -0.5 + 0.25 * Math.sin(b.f * Math.PI), dy: -0.1 * b.ab})},
  idea: {eyes: 'shine', brows: 'raised', mouth: 'grin', curl: 'glow', emote: 'bulb', take: 1.1, family: 'mind', useFor: 'eureka, feature reveal', idle: (b) => ({dy: -1 * b.ab, sq: -0.05 + 0.1 * b.hit, aR: 1.55 + 0.1 * b.s2, aL: -0.2 + 0.2 * b.s1})},
  determined: {eyes: 'determined', brows: 'angry', mouth: 'flat', curl: 'perk', take: 0.7, family: 'hot', useFor: 'effort, before a challenge', idle: (b) => {
    const p1 = Math.sin(b.f * Math.PI);
    const p2 = Math.abs(Math.cos(b.f * Math.PI));
    return {rot: 0.06, sq: -0.04 + 0.06 * b.hit, dy: -0.3 * b.ab, aL: 0.1 + 0.7 * p1, aR: 0.1 + 0.7 * p2};
  }},
  sleepy: {eyes: 'sleepy', brows: 'flat', mouth: 'o', curl: 'droop', emote: 'zzz', take: 0.2, family: 'low', useFor: 'night, waiting, idle', idle: (b) => {
    const br = Math.sin(b.sec * TAU * 0.3);
    return {sq: 0.05 + 0.05 * br, rot: 0.06 * Math.sin(b.sec * 0.8), aL: -0.8, aR: -0.8};
  }},
  bored: {eyes: 'narrow', brows: 'flat', mouth: 'flat', curl: 'droop', take: 0.2, family: 'low', useFor: 'waiting, slow process', idle: (b) => {
    const f = frac(b.bp / 4);
    const sigh = f < 0.3 ? easeIO(f / 0.3) : 1 - easeIO((f - 0.3) / 0.7);
    return {lookX: -0.3, lookY: 0.4, sq: 0.08 - 0.14 * sigh, rot: -0.04, aL: -0.95 + 0.05 * Math.sin(b.sec * 2), aR: -0.95 - 0.05 * Math.sin(b.sec * 2)};
  }},
  nervous: {eyes: 'look', brows: 'worried', mouth: 'wobble', curl: 'rest', tint: 'pale', tintK: 0.2, emote: 'sweat', take: 0.5, family: 'alarm', useFor: 'uncertainty, pending result', idle: (b) => ({
    lookX: b.beatN % 2 ? 0.8 : -0.8, dx: 0.3 * b.s1, sq: 0.04, aL: -0.4 + 0.2 * Math.sin(b.sec * TAU * 5), aR: -0.4 + 0.2 * Math.sin(b.sec * TAU * 5 + 1),
  })},
  suspicious: {eyes: 'narrow', brows: 'knit', mouth: 'flat', curl: 'hook', take: 0.4, family: 'sly', useFor: 'hmm, security, detective', idle: (b) => {
    const s = Math.sin(b.sec * TAU * 0.25);
    return {lookX: s, rot: -0.08 * s, dx: 0.4 * s, sq: 0.04, aL: -0.6, aR: -0.6};
  }},
  disgusted: {eyes: 'squeeze', brows: 'knit', mouth: 'wobble', curl: 'droop', tint: 'green', tintK: 0.5, take: 0.8, family: 'hot', useFor: 'gross, bad code', idle: (b) => {
    const a = frac(b.bp / 2) * b.beatSec * 2;
    const sh = Math.exp(-a * 6) * Math.sin(a * 45);
    return {rot: -0.1, dx: -0.3 + 0.15 * sh, sq: 0.05, aL: 0.7 + 0.2 * sh, aR: 0.7 - 0.2 * sh};
  }},
  dizzy: {eyes: 'swirl', brows: 'worried', mouth: 'wobble', curl: 'spiral', emote: 'stars', take: 0.7, family: 'alarm', useFor: 'after a spin or hit, overload', idle: (b) => {
    const a = b.sec * TAU * 0.8;
    return {rot: 0.12 * Math.sin(a), dx: 0.7 * Math.sin(a), dy: -0.3 * Math.abs(Math.cos(a)), aL: 0.3 + 0.6 * Math.sin(a * 1.3), aR: 0.3 - 0.6 * Math.sin(a * 1.3)};
  }},
  cool: {eyes: 'shades', brows: 'none', mouth: 'smirk', curl: 'rest', emote: 'music', take: 0.4, family: 'sly', useFor: 'confidence, swagger', idle: (b) => ({rot: 0.04 * b.hit, dy: -0.35 * b.hit, sq: 0.06 * b.hit, aL: -0.6, aR: 0.7 + 0.1 * b.s1})},
  starstruck: {eyes: 'spark', brows: 'raised', mouth: 'open', curl: 'perk', tint: 'gold', tintK: 0.3, take: 1, family: 'joy', useFor: 'awe, celebrity, big reveal', idle: (b) => {
    const h = Math.abs(b.s2);
    return {dy: -1.6 * h, sq: 0.1 * b.pulse2, aL: 1.1 + 0.35 * Math.sin(b.bp * TAU * 2), aR: 1.1 + 0.35 * Math.sin(b.bp * TAU * 2)};
  }},
  ko: {eyes: 'x', brows: 'none', mouth: 'wobble', curl: 'spiral', tint: 'pale', tintK: 0.3, emote: 'stars', take: 1, family: 'low', useFor: 'defeated, crashed', idle: (b) => ({sq: 0.28 + 0.02 * Math.sin(b.sec * 3), rot: 0.12, aL: -1.1, aR: -0.9})},
  playful: {eyes: 'wink', brows: 'one-up', mouth: 'tongue', curl: 'rest', take: 0.6, family: 'joy', useFor: 'teasing, fun', idle: (b) => {
    const side = b.beatN % 2 ? 1 : -1;
    const k = lerp(-side, side, easeOut(clamp(b.f * 3)));
    return {dx: 0.8 * k, dy: -1.4 * b.ab, rot: 0.1 * k, sq: 0.1 * b.hit, aL: 0.45 + 0.55 * k, aR: 0.45 - 0.55 * k};
  }},
  mischief: {eyes: 'narrow', brows: 'angry', mouth: 'grin', curl: 'hook', gloom: 0.3, take: 0.5, family: 'sly', useFor: 'scheming, watch this', idle: (b) => {
    const r = Math.sin(b.sec * TAU * 4);
    return {lookX: 0.3, sq: 0.07, rot: 0.04, aL: -0.15 + 0.15 * r, aR: -0.15 - 0.15 * r, dy: -0.1 * Math.abs(r)};
  }},
  hopeful: {eyes: 'shine', brows: 'worried', mouth: 'cat', curl: 'perk', blush: 0.35, take: 0.5, family: 'joy', useFor: 'wishing, asking, waiting for a result', idle: (b) => ({
    sq: -0.06 - 0.02 * b.ab, dy: -0.25 * b.ab, lookY: -0.4, aL: 0.5 + 0.05 * b.s1, aR: 0.5 - 0.05 * b.s1, rot: 0.03 * Math.sin((b.bp * Math.PI) / 2),
  })},
};
export const isEmotion = (s: string): s is Emotion => (EMOTIONS_LIST as readonly string[]).includes(s);

/** Full feel: face + colour + idle body for one emotion at a beat context. */
export type Feel = {
  emotion: Emotion;
  eyes: EyeKind | [EyeKind, EyeKind];
  brows: BrowKind;
  mouth: MouthKind | null;
  curl: CurlKind;
  tint: string | null;
  tintK: number;
  blush: number;
  gloom: number;
  chomp: number;
  emote: EmoteKind | null;
  emoteK: number;
  emoteAge: number;
  squint: number;
  dx: number;
  dy: number;
  sq: number;
  rot: number;
  aL: number;
  aR: number;
  lookX: number;
  lookY: number;
  /** curl blend 0..1 toward `curl` from `curlFrom` */
  curlFrom: CurlKind;
  curlK: number;
};
const BASE_POSE = {dx: 0, dy: 0, sq: 0, rot: 0, aL: -0.5, aR: -0.5, lookX: 0, lookY: 0};
export const feel = (name: Emotion, b: BeatCtx, over: Partial<Feel> = {}): Feel => {
  const D = EMOTIONS[name] ?? EMOTIONS.neutral;
  const p = {...BASE_POSE, ...D.idle(b)};
  return {
    emotion: name,
    eyes: D.eyes,
    brows: D.brows,
    mouth: D.mouth,
    curl: D.curl,
    tint: D.tint ? TINTS[D.tint] : null,
    tintK: D.tintK ?? 1,
    blush: D.blush ?? 0,
    gloom: D.gloom ?? 0,
    chomp: D.chomp ?? 0,
    emote: D.emote ?? null,
    emoteK: 1,
    emoteAge: b.sec,
    squint: 0,
    ...p,
    curlFrom: D.curl,
    curlK: 1,
    ...over,
  } as Feel;
};

export type EmotionKey = {at: number; emotion: string; look?: [number, number]; emote?: string};

/**
 * Acted emotion timeline (frames): eyes squint shut 0.1 s before a key, the face swaps under them, release 0.14 s;
 * a take sized by the new emotion fires; pose blends with backOut over 0.4 s; colour/blush/gloom over 0.3 s;
 * brows lead by 2 frames; the emote pops 0.06–0.32 s after the key; one-off emotes fade at 1.4–1.8 s.
 * Keys closer than 12 frames are pushed apart.
 */
export const emotionsAt = (keysIn: EmotionKey[], frame: number, fps: number, bpm = 120, offsetSec = 0, takeScale = 1): Feel => {
  const keys: EmotionKey[] = [];
  for (const k of [...keysIn].sort((a, b) => a.at - b.at)) {
    const at = keys.length ? Math.max(k.at, keys[keys.length - 1].at + 12) : k.at;
    keys.push({...k, at});
  }
  if (!keys.length) keys.push({at: 0, emotion: 'neutral'});
  const sec = frame / fps;
  const b = beatCtx(sec, bpm, offsetSec);
  let i = 0;
  while (i + 1 < keys.length && frame >= keys[i + 1].at) i++;
  const key = keys[i];
  const name = isEmotion(key.emotion) ? key.emotion : 'neutral';
  const over = (k: EmotionKey): Partial<Feel> => ({
    ...(k.look ? {lookX: k.look[0], lookY: k.look[1]} : {}),
    ...(k.emote && (EMOTE_KINDS as readonly string[]).includes(k.emote) ? {emote: k.emote as EmoteKind} : {}),
  });
  const tc = key.at / fps;
  const age = sec - tc;
  const cur = feel(name, b, over(key));
  const tn = i + 1 < keys.length ? keys[i + 1].at / fps : Infinity;
  let squint = 0;
  if (tn - sec < 0.1) squint = Math.max(squint, 1 - (tn - sec) / 0.1);
  if (i > 0 && age < 0.14) squint = Math.max(squint, 1 - age / 0.14);
  // brows lead the eyes by 2 frames
  if (i + 1 < keys.length && frame >= keys[i + 1].at - 2) {
    const nn = keys[i + 1].emotion;
    cur.brows = (EMOTIONS[isEmotion(nn) ? nn : 'neutral'] ?? EMOTIONS.neutral).brows;
  }
  const prevName = i > 0 ? (isEmotion(keys[i - 1].emotion) ? (keys[i - 1].emotion as Emotion) : 'neutral') : null;
  const prev = prevName ? feel(prevName, b, over(keys[i - 1])) : null;
  if (prev && age < 0.5) {
    const k = backOut(seg(age, 0, 0.4));
    const kc = easeIO(seg(age, 0, 0.3));
    for (const f of ['dy', 'sq', 'aL', 'aR', 'rot', 'dx', 'lookX', 'lookY'] as const) cur[f] = lerp(prev[f], cur[f], k);
    cur.blush = lerp(prev.blush, cur.blush, kc);
    cur.gloom = lerp(prev.gloom, cur.gloom, kc);
    cur.chomp = lerp(prev.chomp, cur.chomp, kc);
    // tints cross-fade: encode as mixed colour + strength
    const pa = prev.tint ? prev.tintK : 0;
    const ca = cur.tint ? cur.tintK : 0;
    const tA = prev.tint ?? cur.tint ?? '#ffffff';
    const tB = cur.tint ?? prev.tint ?? '#ffffff';
    cur.tint = mixHex(tA, tB, kc);
    cur.tintK = lerp(pa, ca, kc);
    cur.curlFrom = prev.curl;
    cur.curlK = easeIO(seg(age, 0.1, 0.35));
  }
  const D = EMOTIONS[name];
  const t1 = prev ? takeAt(sec, tc, D.take * takeScale) : {sq: 0, dy: 0};
  const nextName = i + 1 < keys.length ? keys[i + 1].emotion : null;
  const t2 = nextName ? takeAt(sec, tn, (EMOTIONS[isEmotion(nextName) ? nextName : 'neutral'].take ?? 0.6) * takeScale) : {sq: 0, dy: 0};
  cur.sq += t1.sq + t2.sq;
  cur.dy += t1.dy + t2.dy;
  cur.squint = squint;
  const same = prev && prev.emote === cur.emote;
  cur.emoteK = same ? 1 : seg(age, 0.06, 0.32) * (D.fade && !key.emote ? 1 - seg(age, 1.4, 1.8) : 1);
  cur.emoteAge = Math.max(0, age);
  if (!prev && D.fade && !key.emote) cur.emoteK = seg(age, 0.06, 0.32) * (1 - seg(age, 1.4, 1.8));
  return cur;
};

// ------------------------------------------------------------------ dances (clawd.js move(), MIT)
export type DancePose = PoseDelta & {walk?: number | null; view?: NibView; flip?: boolean; smear?: number};
const SPIN_VIEWS: [NibView, boolean][] = [
  ['front', false], ['q', false], ['side', false], ['qback', false], ['back', false], ['qback', true], ['side', true], ['q', true],
];
/** heading 0..1 (one full turn) -> drawn key view (snapped to 1/8) */
export const spinView = (ph: number): {view: NibView; flip: boolean} => {
  const i = ((Math.round(ph * 8) % 8) + 8) % 8;
  return {view: SPIN_VIEWS[i][0], flip: SPIN_VIEWS[i][1]};
};
export const danceAt = (styleIn: string, b: BeatCtx, seed = 0): DancePose => {
  const bp = b.bp;
  const bi = Math.floor(bp);
  const bf = bp - bi;
  const hit = Math.max(0, 1 - bf * 3.5);
  const s1 = Math.sin(bp * Math.PI);
  const ab = Math.abs(s1);
  const o: DancePose = {dy: 0, sq: 0, aL: 0.2, aR: 0.2, rot: 0, walk: null, dx: 0};
  let style = styleIn;
  if (style === 'mix') style = ['bounce', 'roof', 'sway', 'spin', 'hop', 'wave', 'shimmy', 'stomp'][(Math.floor(bp / 8) + seed) % 8];
  switch (style) {
    case 'bounce': o.dy = -ab * 1.6; o.sq = hit * 0.12; o.aL = 0.4 + s1; o.aR = 0.4 - s1; break;
    case 'hop': o.dy = -ab * 4; o.sq = hit * 0.18; o.aL = o.aR = 0.3 + ab * 1.1; break;
    case 'roof': o.dy = -ab * 1.2; o.sq = hit * 0.1; o.aL = o.aR = 1.25 + 0.3 * Math.sin(bp * TAU); break;
    case 'sway': o.dx = s1 * 2.4; o.rot = s1 * 0.12; o.aL = 0.5 + 0.6 * s1; o.aR = 0.5 - 0.6 * s1; o.sq = hit * 0.08; break;
    case 'spin': {
      const ph = (((bi % 4) + 4) % 4) === 3 ? bf : 0;
      Object.assign(o, spinView(ph));
      o.smear = ph > 0.1 && ph < 0.9 ? 0.5 : 0;
      o.dy = -Math.sin(ph * Math.PI) * 3 - ab;
      o.aL = o.aR = 0.6 + ph;
      o.sq = hit * 0.1;
      break;
    }
    case 'wave': o.dy = -ab; o.aR = 1.1 + 0.5 * Math.sin(bp * TAU * 2); o.aL = -0.4; o.sq = hit * 0.08; break;
    case 'walk': o.walk = bp / 2; o.dy = -ab * 0.6; o.aL = 0.3 * s1 - 0.5; o.aR = -0.3 * s1 - 0.5; break;
    case 'run': o.walk = bp * 1.5; o.dy = -Math.abs(Math.sin(bp * TAU)); o.aL = 0.8 * Math.sin(bp * TAU * 1.5); o.aR = -(o.aL as number); o.rot = -0.08; break;
    case 'idle': o.dy = -ab * 0.5; o.sq = hit * 0.05; o.aL = o.aR = -0.5; break;
    case 'stomp': o.dy = -Math.max(0, Math.sin(bp * TAU)) * 1.4; o.sq = hit * 0.2; o.rot = (bi % 2 ? 1 : -1) * 0.06 * hit; o.aL = o.aR = -0.3 + hit * 0.9; break;
    case 'shimmy': o.dx = Math.sin(bp * TAU * 2) * 0.6; o.rot = Math.sin(bp * TAU * 2) * 0.05; o.aL = 0.9 + 0.4 * Math.sin(bp * TAU * 2); o.aR = 0.9 - 0.4 * Math.sin(bp * TAU * 2); o.dy = -ab * 0.5; break;
    default: break;
  }
  return o;
};

// ------------------------------------------------------------------ views
type ViewRec = {wf: number; faceX: number; faceS: number; eyes: (-1 | 1)[]; face: boolean; behind: ('L' | 'R')[]; legX: [number, number]; curlLean: number};
export const VIEWS: Record<NibView, ViewRec> = {
  front: {wf: 1, faceX: 0, faceS: 1, eyes: [-1, 1], face: true, behind: [], legX: [-1.35, 1.35], curlLean: 0},
  q: {wf: 0.92, faceX: 0.95, faceS: 0.8, eyes: [-1, 1], face: true, behind: ['L'], legX: [-0.9, 1.5], curlLean: -0.15},
  side: {wf: 0.8, faceX: 1.9, faceS: 0.55, eyes: [1], face: true, behind: ['L'], legX: [-0.3, 0.5], curlLean: -0.3},
  qback: {wf: 0.92, faceX: -0.9, faceS: 0.8, eyes: [], face: false, behind: ['R'], legX: [-1.5, 0.9], curlLean: -0.1},
  back: {wf: 1, faceX: 0, faceS: 1, eyes: [], face: false, behind: [], legX: [-1.35, 1.35], curlLean: 0},
};

// ------------------------------------------------------------------ curl (spring-driven tuft)
type CurlParams = {a0: number; bends: number[]; len: number; glow: number; flame: number};
const curlParams = (kind: CurlKind, sec: number, seed = 1): CurlParams => {
  const n = 7;
  const fill = (v: number) => Array.from({length: n}, () => v);
  switch (kind) {
    case 'perk':
      return {a0: 0.02 * Math.sin(sec * 3), bends: fill(0.035), len: 2.3, glow: 0, flame: 0};
    case 'droop':
      return {a0: 1.15, bends: fill(0.26), len: 2.6, glow: 0, flame: 0};
    case 'hook':
      return {a0: 0.05, bends: [0, 0, 0.12, 0.45, 0.8, 0.95, 0.95], len: 2.8, glow: 0, flame: 0};
    case 'spiral':
      return {a0: 0.4, bends: fill(0.8 + 0.05 * Math.sin(sec * 4)), len: 3.1, glow: 0, flame: 0};
    case 'flicker': {
      const bends = Array.from({length: n}, (_, i) => 0.05 + 0.32 * Math.sin(sec * 17 + i * 1.3 + seed) * (i / n));
      return {a0: 0.08 * Math.sin(sec * 23 + seed), bends, len: 2.7 + 0.25 * Math.sin(sec * 31), glow: 0.3, flame: 1};
    }
    case 'glow':
      return {a0: 0.18, bends: fill(0.22), len: 2.7, glow: 1, flame: 0};
    case 'rest':
    default:
      return {a0: 0.28, bends: fill(0.34), len: 2.6, glow: 0, flame: 0};
  }
};
const mixCurl = (a: CurlParams, b: CurlParams, k: number): CurlParams => ({
  a0: lerp(a.a0, b.a0, k),
  bends: a.bends.map((v, i) => lerp(v, b.bends[i] ?? v, k)),
  len: lerp(a.len, b.len, k),
  glow: lerp(a.glow, b.glow, k),
  flame: lerp(a.flame, b.flame, k),
});

// ------------------------------------------------------------------ the rig
export type NibPose = Feel & {
  view: NibView;
  flip: boolean;
  walk: number | null;
  smear: number;
  smearDir: number;
  /** curl follow-through (radians), from body velocity */
  curlLag: number;
  sec: number;
  beat: number;
  hat: HatKind;
  blink: number;
};

/** Evaluate a full pose. Pure: same inputs, same pose. */
export const nibPoseAt = (o: {
  frame: number;
  fps: number;
  bpm?: number;
  offsetSec?: number;
  emotion?: string;
  keys?: EmotionKey[];
  dance?: string;
  seed?: number;
  takeScale?: number;
  view?: NibView;
  flip?: boolean;
  hat?: HatKind;
  extra?: (frame: number) => Partial<DancePose> | null;
}): NibPose => {
  const bpm = o.bpm ?? 120;
  const off = o.offsetSec ?? 0;
  const evalAt = (fr: number) => {
    const keys: EmotionKey[] = o.keys && o.keys.length ? o.keys : [{at: 0, emotion: o.emotion ?? 'happy'}];
    const f = emotionsAt(keys, fr, o.fps, bpm, off, o.takeScale ?? 1);
    let view: NibView = o.view ?? 'front';
    let flip = !!o.flip;
    let walk: number | null = null;
    let smear = 0;
    if (o.dance) {
      const d = danceAt(o.dance, beatCtx(fr / o.fps, bpm, off), o.seed ?? 0);
      f.dx += d.dx ?? 0;
      f.dy += d.dy ?? 0;
      f.sq += d.sq ?? 0;
      f.rot += d.rot ?? 0;
      f.aL = d.aL ?? f.aL;
      f.aR = d.aR ?? f.aR;
      if (d.walk !== undefined) walk = d.walk ?? null;
      if (d.view) {
        view = d.view;
        flip = d.flip !== undefined ? d.flip !== !!o.flip : flip;
      }
      smear = d.smear ?? 0;
    }
    const ex = o.extra ? o.extra(fr) : null;
    if (ex) {
      f.dx += ex.dx ?? 0;
      f.dy += ex.dy ?? 0;
      f.sq += ex.sq ?? 0;
      f.rot += ex.rot ?? 0;
      if (ex.aL !== undefined) f.aL = ex.aL;
      if (ex.aR !== undefined) f.aR = ex.aR;
      if (ex.lookX !== undefined) f.lookX = ex.lookX;
      if (ex.lookY !== undefined) f.lookY = ex.lookY;
      if (ex.walk !== undefined) walk = ex.walk;
      if (ex.view) view = ex.view;
      if (ex.flip !== undefined) flip = ex.flip;
      if (ex.smear !== undefined) smear = Math.max(smear, ex.smear);
    }
    return {f, view, flip, walk, smear};
  };
  const now = evalAt(o.frame);
  const before = evalAt(o.frame - 3);
  const vx = now.f.dx - before.f.dx;
  const vr = now.f.rot - before.f.rot;
  const vy = now.f.dy - before.f.dy;
  const lag = clamp(-vx * 0.35 - vr * 2.2 + vy * 0.15, -0.9, 0.9);
  const sec = o.frame / o.fps;
  const eyes = now.f.eyes;
  const blinkable = (k: EyeKind) => ['normal', 'look', 'wide', 'shine', 'determined', 'narrow'].includes(k);
  const canBlink = Array.isArray(eyes) ? blinkable(eyes[0]) && blinkable(eyes[1]) : blinkable(eyes);
  return {
    ...now.f,
    view: now.view,
    flip: now.flip,
    walk: now.walk,
    smear: now.smear,
    smearDir: Math.sign(vx) || 0,
    curlLag: lag,
    sec,
    beat: (sec - off) / (60 / bpm),
    hat: o.hat ?? '',
    blink: canBlink ? blinkAt(sec, o.seed ?? 1) : 0,
  };
};

const circlePts = (r: number, n = 22, cx = 0, cy = 0, ry = r): [number, number][] =>
  Array.from({length: n}, (_, i) => [cx + Math.cos((i / n) * TAU) * r, cy + Math.sin((i / n) * TAU) * ry] as [number, number]);
/** Sutherland–Hodgman: keep the part of a convex polygon where a·x + b·y + c >= 0 */
const clipHalf = (pts: [number, number][], a: number, b: number, c: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    const dp = a * p[0] + b * p[1] + c;
    const dq = a * q[0] + b * q[1] + c;
    if (dp >= 0) out.push(p);
    if (dp >= 0 !== dq >= 0) {
      const t = dp / (dp - dq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
};
const heartPath = (r: number) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * TAU;
    const x = 16 * Math.pow(Math.sin(a), 3);
    const y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
    pts.push([(x / 17) * r, (y / 17) * r]);
  }
  return pts2d(pts);
};
const starPath = (r: number, inner = 0.42, n = 4, rot = 0) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / n;
    const rr = i % 2 ? r * inner : r;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return pts2d(pts);
};

/** One eye in eye-local units (centre 0,0). s = -1 left / +1 right (screen). */
const Eye: React.FC<{kind: EyeKind; s: number; lookX: number; lookY: number; sec: number; beatHit: number; C: NibColors; sw: number; id: string}> = ({kind, s, lookX, lookY, sec, beatHit, C, sw, id}) => {
  const ink = C.ink;
  const lx = clamp(lookX, -1, 1) * 0.2;
  const ly = clamp(lookY, -1, 1) * 0.17;
  const line = (d: string, w = 0.24, col = ink) => <path d={d} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
  const hl = (x: number, y: number, r: number) => <circle cx={x} cy={y} r={r} fill={C.cream} />;
  const lid = (y0: number, slope: number, r = 0.64, extra?: (p: [number, number][]) => [number, number][]) => {
    let p = circlePts(r, 24, lx, ly);
    p = clipHalf(p, slope * s, 1, -y0);
    if (extra) p = extra(p);
    return p;
  };
  switch (kind) {
    case 'happy':
      return line('M-0.55 0.18 Q0 -0.6 0.55 0.18', 0.26);
    case 'closed':
      return line('M-0.55 -0.12 Q0 0.42 0.55 -0.12', 0.24);
    case 'wink':
      return s > 0 ? line('M-0.5 0.15 Q0 -0.5 0.5 0.15', 0.26) : <Eye kind="normal" s={s} lookX={lookX} lookY={lookY} sec={sec} beatHit={beatHit} C={C} sw={sw} id={id} />;
    case 'squeeze':
      return line(s < 0 ? 'M-0.42 -0.42 L0.36 0 L-0.42 0.42' : 'M0.42 -0.42 L-0.36 0 L0.42 0.42', 0.26);
    case 'cry':
      return line('M-0.6 0 Q-0.45 -0.28 -0.3 0 T0 0 T0.3 0 T0.6 0', 0.22);
    case 'x':
      return (
        <>
          {line('M-0.45 -0.45 L0.45 0.45', 0.26)}
          {line('M0.45 -0.45 L-0.45 0.45', 0.26)}
        </>
      );
    case 'dot':
      return <circle cx={lx} cy={ly} r={0.24} fill={ink} />;
    case 'blank':
      return <circle r={0.74} fill={C.cream} stroke={ink} strokeWidth={0.12} />;
    case 'scared': {
      const jx = Math.sin(sec * 61 + s) * 0.07 + lx * 0.8;
      const jy = Math.cos(sec * 47) * 0.05;
      return (
        <>
          <circle r={0.82} fill={C.cream} stroke={ink} strokeWidth={0.12} />
          <circle cx={jx} cy={jy} r={0.17} fill={ink} />
        </>
      );
    }
    case 'wide':
      return (
        <>
          <circle r={0.86} fill={C.cream} stroke={ink} strokeWidth={0.12} />
          <circle cx={lx * 1.2} cy={ly * 1.2} r={0.5} fill={ink} />
          {hl(lx * 1.2 - 0.18, ly * 1.2 - 0.2, 0.16)}
          {hl(lx * 1.2 + 0.18, ly * 1.2 + 0.15, 0.07)}
        </>
      );
    case 'shine':
      return (
        <>
          <circle cx={lx} cy={ly} r={0.74} fill={ink} />
          {hl(lx - 0.22, ly - 0.24, 0.25)}
          {hl(lx + 0.22, ly + 0.2, 0.12)}
        </>
      );
    case 'spark': {
      const k = 1 + 0.15 * Math.sin(sec * 12) + 0.1 * beatHit;
      return (
        <>
          <circle r={0.85} fill={OCHRE} opacity={0.35} />
          <path d={starPath(0.8 * k, 0.38, 4)} fill={C.cream} stroke={ink} strokeWidth={0.09} strokeLinejoin="round" />
        </>
      );
    }
    case 'heart': {
      const k = 1 + 0.14 * beatHit;
      return <path d={heartPath(0.78 * k)} fill="#E2476E" stroke={ink} strokeWidth={0.1} strokeLinejoin="round" transform="translate(0 0.05)" />;
    }
    case 'swirl': {
      const pts: [number, number][] = [];
      for (let i = 0; i < 26; i++) {
        const a = i * 0.55 + sec * 5 * s;
        const r = i * 0.026;
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      return line(open2d(pts), 0.16, VIOLET);
    }
    case 'red': {
      const p = lid(-0.1, 0.5);
      return (
        <>
          <circle r={0.95} fill="#E23E36" opacity={0.35} />
          <path d={pts2d(p)} fill="#C8243A" stroke={ink} strokeWidth={0.12} strokeLinejoin="round" />
          <circle cx={lx} cy={ly + 0.15} r={0.16} fill={ink} />
        </>
      );
    }
    case 'angry':
      return (
        <>
          <path d={pts2d(lid(-0.12, 0.5))} fill={ink} />
          {hl(lx - 0.18 * s, ly + 0.12, 0.13)}
        </>
      );
    case 'determined':
      return (
        <>
          <path d={pts2d(lid(-0.3, 0.3))} fill={ink} />
          {hl(lx - 0.2, ly + 0.05, 0.16)}
        </>
      );
    case 'sad':
    case 'teary': {
      const p = lid(-0.18, -0.42);
      const pool = kind === 'teary' ? 0.06 * Math.sin(sec * 9) : 0;
      return (
        <>
          <path d={pts2d(p)} fill={ink} />
          {hl(lx - 0.18, ly + 0.05, 0.16)}
          {kind === 'teary' ? <ellipse cx={0} cy={0.42 + pool} rx={0.52} ry={0.2} fill={SKY} opacity={0.85} /> : null}
        </>
      );
    }
    case 'narrow': {
      const p = clipHalf(lid(-0.2, 0), 0, -1, 0.24);
      return <path d={pts2d(p)} fill={ink} />;
    }
    case 'sleepy': {
      const p = lid(0.06, 0);
      return (
        <>
          <path d={pts2d(p)} fill={ink} />
          {line('M-0.68 0.06 L0.68 0.06', 0.16)}
        </>
      );
    }
    case 'shades':
      return null; // drawn once for the pair
    case 'look':
    case 'normal':
    default:
      return (
        <>
          <circle cx={lx} cy={ly} r={0.64} fill={ink} />
          {hl(lx - 0.2, ly - 0.22, 0.19)}
          {hl(lx + 0.2, ly + 0.2, 0.07)}
        </>
      );
  }
};

const Brow: React.FC<{kind: BrowKind; s: number; ink: string; x: number; y: number}> = ({kind, s, ink, x, y}) => {
  if (kind === 'none') return null;
  let dy = 0;
  let tilt = 0;
  let inward = 0;
  let arch = 0.08;
  if (kind === 'raised') {
    dy = -0.42;
    arch = 0.16;
  } else if (kind === 'worried') {
    dy = -0.22;
    tilt = 0.42;
  } else if (kind === 'angry') {
    dy = 0.12;
    tilt = -0.5;
  } else if (kind === 'knit') {
    dy = 0.1;
    tilt = -0.25;
    inward = 0.12;
  } else if (kind === 'one-up') {
    if (s < 0) {
      dy = -0.48;
      tilt = 0.08;
      arch = 0.18;
    } else {
      dy = 0.08;
      tilt = -0.12;
    }
  }
  const cx = x - s * inward;
  const ox = cx + s * 0.55;
  const ix = cx - s * 0.5;
  const oy = y + dy + tilt * 0.5;
  const iy = y + dy - tilt * 0.5;
  return <path d={`M${f2(ox)} ${f2(oy)} Q${f2(cx)} ${f2(y + dy - arch)} ${f2(ix)} ${f2(iy)}`} fill="none" stroke={ink} strokeWidth={0.3} strokeLinecap="round" />;
};

const Mouth: React.FC<{kind: MouthKind | null; chomp: number; sec: number; C: NibColors}> = ({kind, chomp, sec, C}) => {
  if (!kind) return null;
  const ink = C.ink;
  const line = (d: string, w = 0.24) => <path d={d} fill="none" stroke={ink} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
  const fillP = (d: string, fill = DARK) => <path d={d} fill={fill} stroke={ink} strokeWidth={0.14} strokeLinejoin="round" />;
  switch (kind) {
    case 'smile':
      return line('M-0.62 -0.08 Q0 0.42 0.62 -0.08');
    case 'frown':
      return line('M-0.55 0.22 Q0 -0.24 0.55 0.22');
    case 'flat':
      return line('M-0.45 0.02 L0.45 0.02');
    case 'wobble':
      return line('M-0.7 0 Q-0.52 -0.22 -0.35 0 T0 0 T0.35 0 T0.7 0', 0.2);
    case 'cat':
      return line('M-0.66 -0.12 Q-0.33 0.34 0 -0.04 Q0.33 0.34 0.66 -0.12', 0.21);
    case 'smirk':
      return line('M-0.5 0.08 Q0.1 0.2 0.62 -0.28');
    case 'o':
      return <ellipse cx={0} cy={0.05} rx={0.24} ry={0.28} fill={ink} />;
    case 'O':
      return <ellipse cx={0} cy={0.1} rx={0.46} ry={0.58} fill={DARK} stroke={ink} strokeWidth={0.14} />;
    case 'grin':
      return (
        <>
          {fillP('M-0.82 -0.22 L0.82 -0.22 Q0.78 0.7 0 0.72 Q-0.78 0.7 -0.82 -0.22 Z')}
          <path d="M-0.74 -0.16 L0.74 -0.16 L0.7 0.06 L-0.7 0.06 Z" fill={C.cream} />
          <ellipse cx={0} cy={0.5} rx={0.38} ry={0.14} fill={ROSE} />
        </>
      );
    case 'laugh':
      return (
        <>
          {fillP('M-1 -0.3 L1 -0.3 Q0.95 0.95 0 1 Q-0.95 0.95 -1 -0.3 Z')}
          <path d="M-0.9 -0.24 L0.9 -0.24 L0.86 -0.02 L-0.86 -0.02 Z" fill={C.cream} />
          <ellipse cx={0} cy={0.72} rx={0.5} ry={0.2} fill={ROSE} />
        </>
      );
    case 'open':
      return (
        <>
          <ellipse cx={0} cy={0.1} rx={0.55} ry={0.45} fill={DARK} stroke={ink} strokeWidth={0.14} />
          <ellipse cx={0} cy={0.34} rx={0.32} ry={0.13} fill={ROSE} />
        </>
      );
    case 'wail': {
      const wv = Math.sin(sec * 30) * 0.06;
      return (
        <>
          {fillP(`M-0.95 ${f2(-0.12 + wv)} L-0.35 -0.4 L0.35 ${f2(-0.4 - wv)} L0.95 -0.12 L0.75 0.75 L-0.75 0.75 Z`)}
          <ellipse cx={0} cy={0.58} rx={0.5} ry={0.15} fill={ROSE} />
        </>
      );
    }
    case 'teeth':
      return (
        <>
          <rect x={-0.85} y={-0.28} width={1.7} height={0.62} rx={0.14} fill={C.cream} stroke={ink} strokeWidth={0.13} />
          {line('M-0.8 0.03 L0.8 0.03', 0.08)}
          {[-0.42, 0, 0.42].map((x) => (
            <React.Fragment key={x}>{line(`M${x} -0.25 L${x} 0.31`, 0.07)}</React.Fragment>
          ))}
        </>
      );
    case 'tongue':
      return (
        <>
          <path d="M0.05 0.12 L0.55 0.1 Q0.62 0.62 0.32 0.66 Q0.06 0.6 0.05 0.12 Z" fill={ROSE} stroke={ink} strokeWidth={0.11} />
          {line('M-0.62 -0.06 Q0 0.36 0.62 -0.02')}
        </>
      );
    case 'pout':
      return (
        <>
          {line('M-0.35 0.1 Q0 -0.18 0.35 0.1', 0.22)}
          {line('M-0.2 0.28 Q0 0.36 0.2 0.28', 0.16)}
        </>
      );
    case 'yawn':
      return (
        <>
          <ellipse cx={0} cy={0.2} rx={0.42} ry={0.7} fill={DARK} stroke={ink} strokeWidth={0.14} />
          <ellipse cx={0} cy={0.62} rx={0.26} ry={0.16} fill={ROSE} />
        </>
      );
    case 'chomp': {
      // a wide toothy D whose teeth are sized to the opening (never cross, even at a crack)
      const k = clamp(chomp);
      const half = 0.75 + 0.75 * k;
      const gap = 0.12 + 1.15 * k;
      const top = -0.3;
      const bot = top + gap;
      const th = Math.min(0.36, 0.42 * gap);
      const up = 5;
      const lo = 6;
      const tw = (2 * half * 0.86) / up;
      return (
        <>
          {fillP(`M${f2(-half)} ${top} L${f2(half)} ${top} Q${f2(half * 0.95)} ${f2(bot + 0.35)} 0 ${f2(bot + 0.38)} Q${f2(-half * 0.95)} ${f2(bot + 0.35)} ${f2(-half)} ${top} Z`)}
          <ellipse cx={0} cy={bot + 0.12} rx={half * 0.5} ry={0.16 + 0.1 * k} fill={ROSE} />
          {Array.from({length: up}, (_, i) => {
            const x0 = -half * 0.86 + i * tw;
            return <path key={'u' + i} d={`M${f2(x0)} ${top} L${f2(x0 + tw)} ${top} L${f2(x0 + tw / 2)} ${f2(top + th)} Z`} fill={C.cream} stroke={ink} strokeWidth={0.06} strokeLinejoin="round" />;
          })}
          {Array.from({length: lo}, (_, i) => {
            const tw2 = (2 * half * 0.7) / lo;
            const x0 = -half * 0.7 + i * tw2;
            const yb = bot + 0.3 - Math.pow((x0 + tw2 / 2) / half, 2) * 0.2;
            return <path key={'l' + i} d={`M${f2(x0)} ${f2(yb)} L${f2(x0 + tw2)} ${f2(yb)} L${f2(x0 + tw2 / 2)} ${f2(yb - th * 0.85)} Z`} fill={C.cream} stroke={ink} strokeWidth={0.06} strokeLinejoin="round" />;
          })}
        </>
      );
    }
    default:
      return null;
  }
};

/** Emote mark in unit space (1 unit = rig unit); pop scale from k with backOut. */
export const NibEmote: React.FC<{kind: EmoteKind; x: number; y: number; s: number; k?: number; age: number; ink?: string; id: string}> = ({kind, x, y, s, k = 1, age, ink = NIB_COLORS.ink, id}) => {
  const p = backOut(k);
  if (p < 0.02) return null;
  const line = (d: string, w: number, col = ink) => <path d={d} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
  const bang = (dx: number) => (
    <g transform={`translate(${dx} 0) rotate(${f2((0.1 + 0.08 * Math.sin(age * 16) * Math.exp(-age * 3)) * 57.3)})`}>
      <path d="M-0.6 -2.3 L0.6 -2.3 L0.22 0.4 L-0.22 0.4 Z" fill={OCHRE} stroke={ink} strokeWidth={0.14} strokeLinejoin="round" />
      <circle cy={1.2} r={0.42} fill={OCHRE} stroke={ink} strokeWidth={0.12} />
    </g>
  );
  const quest = (dx: number) => (
    <g transform={`translate(${dx} 0) rotate(${f2((-0.08 + 0.08 * Math.sin(age * 12) * Math.exp(-age * 3)) * 57.3)})`}>
      <path d="M-0.95 -1.3 Q-0.9 -2.4 0.15 -2.4 Q1.2 -2.4 1.1 -1.45 Q1.0 -0.7 0.2 -0.4 L0.15 0.35" fill="none" stroke={ink} strokeWidth={0.95} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M-0.95 -1.3 Q-0.9 -2.4 0.15 -2.4 Q1.2 -2.4 1.1 -1.45 Q1.0 -0.7 0.2 -0.4 L0.15 0.35" fill="none" stroke={SKY} strokeWidth={0.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={0.15} cy={1.25} r={0.42} fill={SKY} stroke={ink} strokeWidth={0.12} />
    </g>
  );
  let body: React.ReactNode = null;
  switch (kind) {
    case '!':
      body = bang(0);
      break;
    case '?':
      body = quest(0);
      break;
    case '!!':
      body = (
        <>
          {bang(-0.8)}
          {bang(0.9)}
        </>
      );
      break;
    case '!?':
      body = (
        <>
          {bang(-0.9)}
          {quest(1)}
        </>
      );
      break;
    case 'zzz':
      body = Array.from({length: 3}, (_, i) => {
        const ph = frac(age * 0.4 + i / 3);
        const a = Math.sin(ph * Math.PI);
        if (a < 0.12) return null;
        const zs = (0.8 + ph * 0.7) * Math.min(1, a * 1.6);
        return (
          <g key={i} transform={`translate(${f2(ph * 2.6)} ${f2(-ph * 4.2)}) rotate(${f2((-0.15 + 0.1 * Math.sin(age * 2 + i)) * 57.3)}) scale(${f2(zs)})`} opacity={Math.min(1, a * 2)}>
            <path d="M-0.6 -0.6 L0.6 -0.6 L0.6 -0.28 L-0.12 0.3 L0.6 0.3 L0.6 0.6 L-0.6 0.6 L-0.6 0.28 L0.12 -0.3 L-0.6 -0.3 Z" fill={SKY} stroke={ink} strokeWidth={0.12} strokeLinejoin="round" />
          </g>
        );
      });
      break;
    case 'sweat':
      body = [
        [0, 0, 1],
        [1.6, 1.4, 0.7],
      ].map(([dx, dy, r], i) => (
        <path key={i} d={`M${dx} ${dy - 1.6 * r} Q${dx + 1.1 * r} ${dy + 0.1} ${dx} ${dy + 0.9 * r} Q${dx - 1.1 * r} ${dy + 0.1} ${dx} ${dy - 1.6 * r} Z`} fill={SKY} stroke={ink} strokeWidth={0.12} />
      ));
      break;
    case 'spark': {
      const tw = 1 + 0.15 * Math.sin(age * 12);
      body = (
        <>
          <path d={starPath(1.6 * tw, 0.3, 4)} fill={OCHRE} stroke={ink} strokeWidth={0.12} strokeLinejoin="round" />
          <path d={starPath(0.8 / tw, 0.3, 4)} transform="translate(1.9 1.2)" fill={OCHRE} stroke={ink} strokeWidth={0.1} strokeLinejoin="round" />
        </>
      );
      break;
    }
    case 'heart':
      body = <path d={heartPath(1.8 * (1 + 0.12 * Math.exp(-6 * frac(age * 2))))} fill="#E2476E" stroke={ink} strokeWidth={0.14} />;
      break;
    case 'hearts':
      body = Array.from({length: 3}, (_, i) => {
        const ph = frac(age * 0.55 + i / 3);
        const a = Math.sin(ph * Math.PI);
        if (a < 0.1) return null;
        return <path key={i} d={heartPath(0.5 + 0.6 * a)} transform={`translate(${f2(Math.sin(ph * 6 + i * 2) * 0.7 + i * 0.7 - 0.7)} ${f2(-ph * 3.8)})`} fill="#E2476E" stroke={ink} strokeWidth={0.12} />;
      });
      break;
    case 'anger': {
      const bb = 1 + 0.15 * Math.exp(-8 * frac(age * 2));
      body = Array.from({length: 4}, (_, i) => {
        const pts: [number, number][] = [140, 160, 180, 200, 220].map((d) => [2.1 + 1.3 * Math.cos((d * Math.PI) / 180), 1.3 * Math.sin((d * Math.PI) / 180)]);
        return (
          <g key={i} transform={`rotate(${i * 90 + 45}) scale(${f2(bb * 0.6)})`}>
            {line(open2d(pts), 0.42, '#D8394E')}
          </g>
        );
      });
      break;
    }
    case 'steam':
      body = [-1, 1].flatMap((sd) =>
        [0, 1].map((j) => {
          const ph = frac(age / 0.7 + j * 0.5 + (sd > 0 ? 0.25 : 0));
          const r = 0.55 + ph * 0.9;
          return <ellipse key={`${sd}${j}`} cx={sd * (2.6 + ph * 1.8)} cy={1 - ph * 3} rx={r} ry={r * 0.8} fill="#F6F1EA" fillOpacity={1 - ph * 0.8} stroke={ink} strokeOpacity={ph < 0.6 ? 1 : 0} strokeWidth={0.12} />;
        }),
      );
      break;
    case 'bulb': {
      const gl = 0.5 + 0.5 * Math.sin(age * 10);
      body = (
        <>
          <circle cx={0} cy={-1.4} r={3.6} fill={`url(#${id}bulbg)`} opacity={0.75 + 0.25 * gl} />
          <defs>
            <radialGradient id={`${id}bulbg`}>
              <stop offset="0" stopColor="#FFD27A" stopOpacity={0.9} />
              <stop offset="1" stopColor="#FFD27A" stopOpacity={0} />
            </radialGradient>
          </defs>
          {Array.from({length: 7}, (_, i) => {
            const a = -Math.PI / 2 + (i - 3) * 0.45;
            const r0 = 1.6;
            const r1 = 2.2 + 0.4 * gl;
            return <React.Fragment key={i}>{line(`M${f2(Math.cos(a) * r0)} ${f2(-1.4 + Math.sin(a) * r0)} L${f2(Math.cos(a) * r1)} ${f2(-1.4 + Math.sin(a) * r1)}`, 0.18, OCHRE)}</React.Fragment>;
          })}
          <ellipse cx={0} cy={-1.4} rx={1.15} ry={1.2} fill="#FFE68A" stroke={ink} strokeWidth={0.14} />
          <rect x={-0.5} y={-0.3} width={1} height={0.8} rx={0.12} fill="#9A93A8" stroke={ink} strokeWidth={0.12} />
        </>
      );
      break;
    }
    case 'dots':
      body = Array.from({length: 3}, (_, i) => {
        const ph = frac(age / 1.8);
        const q = backOut(clamp((ph - i * 0.22) * 6));
        if (q < 0.02) return null;
        return <circle key={i} cx={(i - 1) * 1.3} cy={0} r={0.42 * q} fill={ink} />;
      });
      break;
    case 'scribble': {
      const pts: [number, number][] = [];
      const bf = Math.floor(age * 12);
      for (let i = 0; i < 34; i++) {
        const a = i * 0.95;
        const r = 1.1 + 0.5 * Math.sin(i * 1.7);
        pts.push([Math.cos(a) * r * 1.5 + (hashN(i, bf) - 0.5) * 0.4, Math.sin(a) * r * 0.8 + (hashN(i, bf, 3) - 0.5) * 0.4]);
      }
      body = line(open2d(pts), 0.16);
      break;
    }
    case 'music': {
      const b1 = Math.sin(age * 5) * 0.3;
      const b2 = Math.sin(age * 5 + 2) * 0.3;
      body = (
        <>
          <g transform={`translate(0 ${f2(b1)})`}>
            <ellipse cx={0} cy={1.2} rx={0.7} ry={0.5} transform="rotate(-17 0 1.2)" fill={ink} />
            {line('M0.6 1.1 L0.6 -1.6 L1.6 -1', 0.18)}
          </g>
          <g transform={`translate(0 ${f2(b2)})`}>
            <ellipse cx={2.2} cy={2.2} rx={0.45} ry={0.33} transform="rotate(-17 2.2 2.2)" fill={ink} />
            {line('M2.6 2.15 L2.6 0.6', 0.14)}
          </g>
        </>
      );
      break;
    }
    case 'swirl': {
      const pts: [number, number][] = [];
      for (let i = 0; i < 18; i++) {
        const a = i * 0.6 + age * 5;
        const r = i * 0.09;
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      body = line(open2d(pts), 0.16, VIOLET);
      break;
    }
    case 'stars':
      body = Array.from({length: 3}, (_, i) => {
        const a = age * 5 + (i * TAU) / 3;
        const d = 0.75 + 0.25 * Math.sin(a);
        return <path key={i} d={starPath(0.75 * d, 0.45, 5, age * 3)} transform={`translate(${f2(Math.cos(a) * 4.2)} ${f2(Math.sin(a))})`} fill={OCHRE} stroke={ink} strokeWidth={0.1} strokeLinejoin="round" />;
      });
      break;
    case 'cloud': {
      const bob = Math.sin(age * 2) * 0.15;
      const c: [number, number][] = [];
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * TAU;
        const upper = Math.sin(a) < 0;
        const r = upper ? 1 + 0.38 * Math.pow(Math.abs(Math.sin(a * 3)), 0.6) : 1;
        c.push([Math.cos(a) * 2.8 * (upper ? r * 0.92 : 1), bob - 0.2 + Math.sin(a) * (upper ? 1.35 : 0.7) * r]);
      }
      body = (
        <>
          {Array.from({length: 6}, (_, i) => {
            const ph = frac(age * 2.4 + hashN(i));
            const rx = -2 + i * 0.8;
            const ry = 0.7 + ph * 2;
            return <React.Fragment key={i}>{line(`M${f2(rx)} ${f2(ry)} L${f2(rx - 0.12)} ${f2(ry + 0.7)}`, 0.16, '#5C78B8')}</React.Fragment>;
          })}
          <path d={pts2d(c)} fill="#A3A8C4" stroke={ink} strokeWidth={0.14} strokeLinejoin="round" />
        </>
      );
      break;
    }
    default:
      body = null;
  }
  return <g transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(p * s)})`}>{body}</g>;
};
const EMOTE_TOP: EmoteKind[] = ['steam', 'stars', 'cloud', 'bulb', 'scribble'];

const Hat: React.FC<{kind: HatKind; C: NibColors; hx: number; sec: number; id: string}> = ({kind, C, hx, sec, id}) => {
  const ink = C.ink;
  const sw = 0.14;
  switch (kind) {
    case 'party':
      return (
        <g transform={`translate(${hx} -7.6)`}>
          <path d="M-1.5 0 L1.5 0 L0.2 -3.6 Z" fill={C.accent} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
          <path d="M-0.95 -1.2 L1.05 -1.2 M-0.45 -2.4 L0.65 -2.4" stroke={ROSE} strokeWidth={0.35} />
          <circle cx={0.2} cy={-3.7} r={0.45} fill={ROSE} stroke={ink} strokeWidth={sw} />
        </g>
      );
    case 'crown':
      return (
        <g transform={`translate(${hx} -7.9)`}>
          <path d="M-1.7 0.5 L-1.8 -1.3 L-0.9 -0.4 L0 -1.7 L0.9 -0.4 L1.8 -1.3 L1.7 0.5 Z" fill={OCHRE} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
          <circle cx={0} cy={-0.1} r={0.25} fill={ROSE} />
        </g>
      );
    case 'top':
      return (
        <g transform={`translate(${hx} -7.6)`}>
          <rect x={-2.4} y={-0.35} width={4.8} height={0.55} rx={0.25} fill={ink} />
          <rect x={-1.5} y={-3.2} width={3} height={3} rx={0.2} fill={ink} />
          <rect x={-1.5} y={-1.1} width={3} height={0.5} fill={C.accent} />
        </g>
      );
    case 'beanie':
      return (
        <g transform={`translate(${hx} -7.2)`}>
          <path d="M-2.3 0 Q-2.2 -3 0 -3.1 Q2.2 -3 2.3 0 Z" fill="#D9534F" stroke={ink} strokeWidth={sw} />
          <rect x={-2.45} y={-0.6} width={4.9} height={0.9} rx={0.35} fill="#B8433F" stroke={ink} strokeWidth={sw} />
          <circle cx={0} cy={-3.3} r={0.55} fill={C.cream} stroke={ink} strokeWidth={sw} />
        </g>
      );
    case 'cap':
      return (
        <g transform={`translate(${hx} -7.3)`}>
          <path d="M-2.2 0 Q-2.1 -2.5 0 -2.6 Q2.1 -2.5 2.2 0 Z" fill="#D9534F" stroke={ink} strokeWidth={sw} />
          <path d="M0.8 -0.2 L3.6 0.1 Q3.7 0.5 3.2 0.55 L0.6 0.35 Z" fill="#B8433F" stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
        </g>
      );
    case 'wizard':
      return (
        <g transform={`translate(${hx} -7.5)`}>
          <path d="M-2.6 0.2 Q0 0.9 2.6 0.2 L2.4 -0.3 Q0 0.2 -2.4 -0.3 Z" fill={VIOLET} stroke={ink} strokeWidth={sw} />
          <path d="M-1.6 -0.1 L1.6 -0.1 Q0.8 -2.5 1.4 -4.6 Q-0.6 -3 -1.6 -0.1 Z" fill={VIOLET} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
          <path d={starPath(0.4, 0.45, 5)} transform="translate(0 -1.5)" fill={OCHRE} />
        </g>
      );
    case 'halo':
      return (
        <g transform={`translate(${hx} ${f2(-11 + 0.15 * Math.sin(sec * 3))})`}>
          <ellipse rx={2.2} ry={0.55} fill="none" stroke={OCHRE} strokeWidth={0.75} opacity={0.35} />
          <ellipse rx={2.2} ry={0.55} fill="none" stroke={OCHRE} strokeWidth={0.32} />
        </g>
      );
    case 'headphones':
      return (
        <g>
          <path d="M-3.4 -5.2 Q-3.6 -10.2 0 -10.2 Q3.6 -10.2 3.4 -5.2" fill="none" stroke={ink} strokeWidth={0.45} />
          <rect x={-4.2} y={-6.4} width={1.2} height={2.2} rx={0.5} fill={C.accent} stroke={ink} strokeWidth={sw} />
          <rect x={3} y={-6.4} width={1.2} height={2.2} rx={0.5} fill={C.accent} stroke={ink} strokeWidth={sw} />
        </g>
      );
    case 'bow':
      return (
        <g transform={`translate(${hx + 1.2} -7.7) rotate(18)`}>
          <path d="M0 0 L-1.2 -0.7 L-1.2 0.7 Z M0 0 L1.2 -0.7 L1.2 0.7 Z" fill={ROSE} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
          <circle r={0.3} fill={ROSE} stroke={ink} strokeWidth={sw} />
        </g>
      );
    case 'flower':
      return (
        <g transform={`translate(${hx - 1.4} -7.4)`}>
          {Array.from({length: 5}, (_, i) => (
            <ellipse key={i} cx={0} cy={-0.55} rx={0.38} ry={0.55} transform={`rotate(${i * 72})`} fill={C.cream} stroke={ink} strokeWidth={0.1} />
          ))}
          <circle r={0.32} fill={OCHRE} stroke={ink} strokeWidth={0.1} />
        </g>
      );
    default:
      return null;
  }
};
const HAT_HIDES_CURL: HatKind[] = ['party', 'top', 'beanie', 'wizard', 'cap'];

const bodyPath = (wf: number, tl = 0) =>
  `M0 -1 C${f2(2.7 * wf)} -1 ${f2(3.6 * wf)} -2.5 ${f2(3.6 * wf)} -4.4 C${f2(3.6 * wf)} -6.4 ${f2(1.7 * wf)} -7.6 ${f2(0.38 * wf + tl)} -8.85 Q${f2(tl)} -9.2 ${f2(-0.38 * wf + tl)} -8.85 C${f2(-1.7 * wf)} -7.6 ${f2(-3.6 * wf)} -6.4 ${f2(-3.6 * wf)} -4.4 C${f2(-3.6 * wf)} -2.5 ${f2(-2.7 * wf)} -1 0 -1 Z`;

export type NibLook = 'ink-wash' | 'clean';

/**
 * Draws Nib inside an SVG. (x, y) = ground point in px, u = rig unit in px (Nib is ~10u tall incl. curl).
 */
export const Nib: React.FC<{id: string; x: number; y: number; u: number; pose: NibPose; colors?: Partial<NibColors>; look?: NibLook; shadow?: boolean; boilFps?: number; fps?: number}> = ({
  id,
  x,
  y,
  u,
  pose,
  colors,
  look = 'ink-wash',
  shadow = true,
  boilFps = 12,
  fps = 30,
}) => {
  const C0: NibColors = {...NIB_COLORS, ...(colors ?? {})};
  const tk = pose.tint ? clamp(pose.tintK) : 0;
  const C: NibColors = {
    ...C0,
    body: pose.tint ? mixHex(C0.body, pose.tint, 0.55 * tk) : C0.body,
    shade: pose.tint ? mixHex(C0.shade, pose.tint, 0.5 * tk) : C0.shade,
    light: pose.tint ? mixHex(C0.light, pose.tint, 0.45 * tk) : C0.light,
  };
  const V = VIEWS[pose.view] ?? VIEWS.front;
  const flipS = pose.flip ? -1 : 1;
  const sq = clamp(pose.sq, -0.4, 0.45);
  const sxk = flipS * (1 + sq * 0.6) * (1 + pose.smear * 0.35);
  const syk = 1 - sq;
  const swPx = Math.max(1.3, u * 0.11);
  const sw = swPx / u;
  const boilF = Math.floor((pose.sec * boilFps) + 1e-6);
  const sec = pose.sec;
  const bhit = Math.exp(-6 * frac(pose.beat));
  const wf = V.wf;
  // ---------- legs
  const legs = V.legX.map((lx, i) => {
    let lift = 0;
    let swing = 0;
    if (pose.walk !== null) {
      const ph = (pose.walk + (i % 2) * 0.5) * TAU;
      if (pose.view === 'side' || pose.view === 'q' || pose.view === 'qback') {
        swing = Math.sin(ph) * 0.55;
        lift = Math.max(0, Math.cos(ph)) * 0.7;
      } else lift = Math.max(0, Math.sin(ph)) * 0.8;
    }
    const near = i === 1;
    const col = pose.view !== 'front' && pose.view !== 'back' && !near ? mixHex(C.shade, C.ink, 0.25) : C.shade;
    return <rect key={i} x={lx * wf - 0.55 + swing} y={-1.95 - lift} width={1.1} height={1.95} rx={0.55} fill={col} stroke={C.ink} strokeWidth={sw} />;
  });
  // ---------- arms
  const arm = (side: 'L' | 'R') => {
    const s = side === 'L' ? -1 : 1;
    const a = side === 'L' ? pose.aL : pose.aR;
    const px = s * 3.0 * wf;
    const py = -4.3;
    const len = 2.6;
    const dxA = s * Math.cos(a);
    const dyA = -Math.sin(a);
    const ex = px + dxA * len;
    const ey = py + dyA * len;
    // noodle bend: the control point sags under gravity and bows outward a little
    const cxp = (px + ex) / 2 + s * 0.25;
    const cyp = (py + ey) / 2 + 0.45;
    const d = `M${f2(px)} ${f2(py)} Q${f2(cxp)} ${f2(cyp)} ${f2(ex)} ${f2(ey)}`;
    return (
      <g key={side}>
        <path d={d} fill="none" stroke={C.ink} strokeWidth={0.78 + 2 * sw} strokeLinecap="round" />
        <path d={d} fill="none" stroke={C.body} strokeWidth={0.78} strokeLinecap="round" />
        <circle cx={ex} cy={ey} r={0.48} fill={C.body} stroke={C.ink} strokeWidth={sw} />
      </g>
    );
  };
  const armsBehind = (['L', 'R'] as const).filter((sd) => V.behind.includes(sd));
  const armsFront = (['L', 'R'] as const).filter((sd) => !V.behind.includes(sd));
  // ---------- curl
  const cp = mixCurl(curlParams(pose.curlFrom, sec, 1), curlParams(pose.curl, sec, 1), pose.curlK);
  const curlPts: [number, number][] = [];
  {
    let cx = 0;
    let cy = -8.95;
    let th = cp.a0 + V.curlLean + pose.curlLag * flipS * 0.9 + 0.05 * Math.sin(sec * 2.1);
    curlPts.push([cx, cy]);
    const n = cp.bends.length;
    for (let i = 0; i < n; i++) {
      th += cp.bends[i];
      cx += (cp.len / n) * Math.sin(th);
      cy -= (cp.len / n) * Math.cos(th);
      curlPts.push([cx, cy]);
    }
  }
  const ribbon = (() => {
    const L: [number, number][] = [];
    const R: [number, number][] = [];
    const n = curlPts.length;
    for (let i = 0; i < n; i++) {
      const p = curlPts[i];
      const q = curlPts[Math.min(n - 1, i + 1)];
      const o = curlPts[Math.max(0, i - 1)];
      const tx = q[0] - o[0];
      const ty = q[1] - o[1];
      const tl = Math.hypot(tx, ty) || 1;
      const wdt = lerp(0.62, 0.16, i / (n - 1)) * (1 + 0.25 * cp.flame * Math.sin(sec * 29 + i));
      L.push([p[0] - (ty / tl) * wdt, p[1] + (tx / tl) * wdt]);
      R.push([p[0] + (ty / tl) * wdt, p[1] - (tx / tl) * wdt]);
    }
    return pts2d([...L, ...R.reverse()]);
  })();
  const tip = curlPts[curlPts.length - 1];
  const hideCurl = pose.hat && HAT_HIDES_CURL.includes(pose.hat);
  // ---------- face
  const fx = V.faceX;
  const fs = V.faceS;
  const squint = clamp(Math.max(pose.squint, pose.blink));
  const eyePair = Array.isArray(pose.eyes) ? pose.eyes : [pose.eyes, pose.eyes];
  const smearEyes = pose.smear > 0.5;
  const eyeY = -5.25;
  const eyeX = 1.3;
  const shades = eyePair[0] === 'shades';
  const face = V.face ? (
    <g transform={`translate(${f2(fx)} 0) scale(${f2(fs)} 1)`}>
      {/* cheeks */}
      {pose.blush > 0.02
        ? V.eyes.map((s) => (
            <g key={'c' + s} opacity={clamp(pose.blush)}>
              <ellipse cx={s * 2.3} cy={-4.05} rx={0.62} ry={0.32} fill={C.cheek} opacity={0.85} />
              {pose.blush > 0.6
                ? [0, 1, 2].map((k) => <path key={k} d={`M${f2(s * 2.3 - 0.4 + k * 0.32)} -3.85 L${f2(s * 2.3 - 0.25 + k * 0.32)} -4.25`} stroke={mixHex(C.cheek, C.ink, 0.35)} strokeWidth={0.07} strokeLinecap="round" />)
                : null}
            </g>
          ))
        : null}
      {/* eyes */}
      {smearEyes
        ? V.eyes.map((s) => <path key={'e' + s} d={`M${s * eyeX - 0.5} ${eyeY} L${s * eyeX + 0.5} ${eyeY}`} stroke={C.ink} strokeWidth={0.22} strokeLinecap="round" />)
        : squint > 0.8
          ? V.eyes.map((s) => <path key={'e' + s} d={`M${s * eyeX - 0.5} ${eyeY} Q${s * eyeX} ${eyeY + 0.2} ${s * eyeX + 0.5} ${eyeY}`} fill="none" stroke={C.ink} strokeWidth={0.22} strokeLinecap="round" />)
          : shades
            ? (
                <g transform={`translate(0 ${eyeY})`}>
                  <path d={`M${-eyeX - 0.95} -0.45 L${-eyeX + 0.95} -0.45 L${-eyeX + 0.8} 0.55 Q${-eyeX} 0.8 ${-eyeX - 0.8} 0.55 Z`} fill={C.ink} />
                  <path d={`M${eyeX - 0.95} -0.45 L${eyeX + 0.95} -0.45 L${eyeX + 0.8} 0.55 Q${eyeX} 0.8 ${eyeX - 0.8} 0.55 Z`} fill={C.ink} />
                  <path d={`M${-eyeX + 0.9} -0.3 L${eyeX - 0.9} -0.3`} stroke={C.ink} strokeWidth={0.22} />
                  <path d={`M${-eyeX - 0.95} -0.4 L-3.3 -0.7 M${eyeX + 0.95} -0.4 L3.3 -0.7`} stroke={C.ink} strokeWidth={0.18} />
                  {[-1, 1].map((s) => (
                    <path key={s} d={`M${s * eyeX - 0.5} -0.15 L${s * eyeX - 0.15} -0.35 M${s * eyeX - 0.4} 0.2 L${s * eyeX + 0.1} -0.1`} stroke={C.cream} strokeWidth={0.12} strokeLinecap="round" opacity={0.85} />
                  ))}
                </g>
              )
            : V.eyes.map((s) => (
                <g key={'e' + s} transform={`translate(${s * eyeX} ${eyeY}) scale(1 ${f2(Math.max(0.08, 1 - squint))})`}>
                  <Eye kind={(s < 0 ? eyePair[0] : eyePair[1]) as EyeKind} s={s} lookX={pose.lookX * flipS} lookY={pose.lookY} sec={sec} beatHit={bhit} C={C} sw={sw} id={id} />
                </g>
              ))}
      {/* brows */}
      {!smearEyes ? V.eyes.map((s) => <Brow key={'b' + s} kind={pose.brows} s={s} ink={C.ink} x={s * eyeX} y={-6.45 + (squint > 0.5 ? 0.15 : 0)} />) : null}
      {/* mouth */}
      <g transform="translate(0 -3.75)">
        <Mouth kind={pose.mouth} chomp={pose.chomp} sec={sec} C={C} />
      </g>
      {/* tears */}
      {eyePair[0] === 'cry'
        ? V.eyes.map((s) => {
            const wv = Math.sin(sec * 9 + s) * 0.1;
            const drop = frac(sec * 1.6 + (s > 0 ? 0.5 : 0));
            return (
              <g key={'t' + s}>
                <path d={`M${s * eyeX - 0.18} -4.95 Q${s * (eyeX + 0.25) + wv} -3.4 ${s * (eyeX + 0.55)} -1.6 L${s * (eyeX + 0.95)} -1.6 Q${s * (eyeX + 0.55) + wv} -3.4 ${s * eyeX + 0.3} -4.95 Z`} fill={SKY} opacity={0.85} />
                <circle cx={s * (eyeX + 0.6 + drop * 2.2)} cy={-4.6 + drop * drop * 3 - drop * 1.2} r={0.22 * (1 - drop * 0.5)} fill={SKY} opacity={1 - drop} />
              </g>
            );
          })
        : null}
    </g>
  ) : null;
  // ---------- smear streaks (behind the body, trailing the move)
  const smear = pose.smear > 0.05 ? (
    <g>
      {(pose.smearDir === 0 ? [-1, 1] : [-pose.smearDir * flipS]).flatMap((s) =>
        [0, 1, 2, 3].map((i) => {
          const yy = -7.2 + i * 1.5;
          const x0 = s * 2.6 * wf;
          const len = (3 + 3 * hashN(i + 7 * s, 11)) * pose.smear;
          return (
            <g key={`${s}${i}`}>
              <path d={`M${f2(x0)} ${yy} L${f2(x0 + s * len)} ${f2(yy + 0.1)}`} stroke={C.body} strokeWidth={0.9 * pose.smear + 0.2} strokeLinecap="round" strokeDasharray="0.9 0.25 1.6 0.3" opacity={0.85} />
              {i % 2 ? <path d={`M${f2(x0 + s * len * 0.3)} ${yy + 0.5} L${f2(x0 + s * len * 1.1)} ${yy + 0.5}`} stroke={C.ink} strokeWidth={0.06} /> : null}
            </g>
          );
        }),
      )}
    </g>
  ) : null;
  // ---------- gloom
  const gloomEl =
    pose.gloom > 0.02 ? (
      <g clipPath={`url(#${id}clip)`}>
        <rect x={-4} y={-9.3} width={8} height={2.8} fill={INDIGO} opacity={0.55 * clamp(pose.gloom)} />
        {Array.from({length: 6}, (_, i) => {
          const gx = -2 + i * 0.8;
          return <path key={i} d={`M${f2(gx)} -8.6 L${f2(gx)} ${f2(-8.6 + 2.4 * pose.gloom * (0.7 + 0.3 * hashN(i)))}`} stroke={C.ink} strokeWidth={0.06} />;
        })}
      </g>
    ) : null;
  const headTop = (-9.6 + pose.dy) * (1 - sq);
  const emoteTop = pose.emote ? EMOTE_TOP.includes(pose.emote) : false;
  const filt = look === 'ink-wash';
  const shadowK = 1 - Math.min(0.5, Math.abs(pose.dy) * 0.06);
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(u)})`}>
      <defs>
        <clipPath id={`${id}clip`}>
          <path d={bodyPath(wf)} />
        </clipPath>
        {filt ? (
          <filter id={`${id}ink`} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={boilF % 97} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={0.13} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ) : null}
        <radialGradient id={`${id}glow`}>
          <stop offset="0" stopColor={C.accent} stopOpacity={0.85} />
          <stop offset="1" stopColor={C.accent} stopOpacity={0} />
        </radialGradient>
      </defs>
      {shadow ? <ellipse cx={pose.dx} cy={0.1} rx={3.3 * shadowK} ry={0.55 * shadowK} fill={C.ink} opacity={0.22} /> : null}
      <g filter={filt ? `url(#${id}ink)` : undefined}>
        <g transform={`translate(${f2(pose.dx)} ${f2(pose.dy)}) rotate(${f2(pose.rot * 57.2958)}) scale(${f2(sxk)} ${f2(syk)})`}>
          {smear}
          {armsBehind.map(arm)}
          {legs}
          {!hideCurl ? (
            <g>
              {cp.glow > 0.05 ? <circle cx={tip[0]} cy={tip[1]} r={1.8} fill={`url(#${id}glow)`} opacity={cp.glow * (0.7 + 0.3 * Math.sin(sec * 10))} /> : null}
              <path d={ribbon} fill={cp.flame > 0.5 ? mixHex(C.body, '#E23E36', 0.35) : C.body} stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />
              <circle cx={tip[0]} cy={tip[1]} r={0.3 + 0.08 * cp.flame * Math.sin(sec * 31)} fill={cp.flame > 0.5 ? '#FF8A3D' : C.accent} stroke={C.ink} strokeWidth={sw * 0.8} />
            </g>
          ) : null}
          {/* body: shade base, body crescent on top, light, outline */}
          <path d={bodyPath(wf)} fill={C.shade} />
          <g clipPath={`url(#${id}clip)`}>
            <path d={bodyPath(wf)} fill={C.body} transform="translate(-0.55 -0.5) scale(0.97)" />
            <ellipse cx={-1.6 * wf} cy={-6.2} rx={1.05} ry={1.6} transform={`rotate(-28 ${f2(-1.6 * wf)} -6.2)`} fill={C.light} opacity={0.55} />
            <circle cx={-2.05 * wf} cy={-6.9} r={0.32} fill={C.cream} opacity={0.8} />
          </g>
          {gloomEl}
          <path d={bodyPath(wf)} fill="none" stroke={C.ink} strokeWidth={sw * 1.05} strokeLinejoin="round" />
          {face}
          {pose.hat ? <Hat kind={pose.hat} C={C} hx={V.faceX * 0.3} sec={sec} id={id} /> : null}
          {armsFront.map(arm)}
        </g>
      </g>
      {pose.emote ? (
        <NibEmote
          id={id + 'em'}
          kind={pose.emote}
          x={pose.dx + (emoteTop ? 0 : flipS * 3.9)}
          y={emoteTop ? headTop - 0.7 : headTop + 0.6}
          s={emoteTop ? 0.7 : 0.85}
          k={pose.emoteK}
          age={pose.emoteAge}
          ink={C.ink}
        />
      ) : null}
    </g>
  );
};

/** All-in-one: evaluates the pose for this frame and draws Nib. */
export const NibFigure: React.FC<{
  id: string;
  x: number;
  y: number;
  u: number;
  frame: number;
  fps: number;
  bpm?: number;
  offsetSec?: number;
  emotion?: string;
  keys?: EmotionKey[];
  dance?: string;
  seed?: number;
  view?: NibView;
  flip?: boolean;
  hat?: HatKind;
  takeScale?: number;
  colors?: Partial<NibColors>;
  look?: NibLook;
  shadow?: boolean;
  onTwos?: boolean;
  extra?: (frame: number) => Partial<DancePose> | null;
}> = (p) => {
  const fr = p.onTwos ? Math.floor(p.frame / 2) * 2 : p.frame;
  const pose = nibPoseAt({frame: fr, fps: p.fps, bpm: p.bpm, offsetSec: p.offsetSec, emotion: p.emotion, keys: p.keys, dance: p.dance, seed: p.seed, takeScale: p.takeScale, view: p.view, flip: p.flip, hat: p.hat, extra: p.extra});
  return <Nib id={p.id} x={p.x} y={p.y} u={p.u} pose={pose} colors={p.colors} look={p.look} shadow={p.shadow} fps={p.fps} />;
};

// ------------------------------------------------------------------ script (box-bot vocabulary + feel/turn/dance/take/jump)
export type NibAction = {
  action: 'walk' | 'run' | 'hop' | 'jump' | 'idle' | 'feel' | 'turn' | 'dance' | 'take' | 'wave' | 'look' | 'emote';
  frames?: number;
  /** walk/run/hop/jump: target x (0..1 of frame width) */
  to?: number;
  /** walk/run/hop/jump: relative move (fraction of width) */
  dx?: number;
  /** jump/hop height in rig units */
  height?: number;
  emotion?: string;
  /** turn: target view */
  view?: NibView;
  style?: string;
  /** dance: length in beats (overrides frames) */
  beats?: number;
  size?: number;
  dir?: number;
  emote?: string;
};
const DEF_FR: Record<NibAction['action'], number> = {walk: 48, run: 30, hop: 22, jump: 30, idle: 24, feel: 36, turn: 10, dance: 60, take: 24, wave: 40, look: 24, emote: 36};

export type NibScriptState = {x: number; keys: EmotionKey[]; dance: string; extra: (frame: number) => Partial<DancePose> | null; end: number};

/** Compile a script into a position track, emotion keys and a per-frame pose extra. Pure. */
export const compileNibScript = (script: NibAction[], o: {startX: number; fps: number; bpm: number; widthPx: number; u: number; baseEmotion: string; startView?: NibView}): {xAt: (f: number) => number; keys: EmotionKey[]; extra: (f: number) => Partial<DancePose> | null; danceAt: (f: number) => string; end: number} => {
  type S = {a: NibAction; f0: number; f1: number; x0: number; x1: number; view0: NibView; view1: NibView; flip: boolean};
  const segs: S[] = [];
  let f = 0;
  let x = o.startX;
  let view: NibView = o.startView ?? 'front';
  let flip = false;
  const keys: EmotionKey[] = [{at: 0, emotion: o.baseEmotion}];
  for (const a of script) {
    const beatFr = (60 / o.bpm) * o.fps;
    const dur = Math.max(1, Math.round(a.action === 'dance' && a.beats ? a.beats * beatFr : a.frames ?? DEF_FR[a.action]));
    let x1 = x;
    if (['walk', 'run', 'hop', 'jump'].includes(a.action)) x1 = a.to !== undefined ? a.to : x + (a.dx ?? (a.action === 'walk' || a.action === 'run' ? 0.25 : 0));
    if (x1 !== x) flip = x1 < x;
    let v1 = view;
    if (a.action === 'turn') v1 = a.view ?? 'front';
    if (a.action === 'feel' && a.emotion) keys.push({at: f, emotion: a.emotion});
    if (a.action === 'emote' && a.emote) keys.push({at: f, emotion: keys[keys.length - 1].emotion, emote: a.emote});
    segs.push({a, f0: f, f1: f + dur, x0: x, x1, view0: view, view1: v1, flip});
    f += dur;
    x = x1;
    view = v1;
  }
  const find = (fr: number) => segs.find((s) => fr >= s.f0 && fr < s.f1) ?? null;
  const last = segs[segs.length - 1];
  const travel = (s: S, fr: number) => {
    const k = (fr - s.f0) / (s.f1 - s.f0);
    if (s.a.action === 'walk' || s.a.action === 'run') {
      const ramp = 0.15;
      const vMax = 1 / (1 - ramp);
      return k < ramp ? (vMax * k * k) / (2 * ramp) : k > 1 - ramp ? 1 - (vMax * (1 - k) * (1 - k)) / (2 * ramp) : vMax * (k - ramp / 2);
    }
    return easeIO(k);
  };
  const xAt = (fr: number) => {
    const s = find(fr);
    if (!s) return last && fr >= last.f1 ? last.x1 : o.startX;
    return lerp(s.x0, s.x1, travel(s, fr));
  };
  const extra = (fr: number): Partial<DancePose> | null => {
    const s = find(fr);
    const sec = fr / o.fps;
    if (!s) {
      const v = last ? last.view1 : o.startView ?? 'front';
      return {view: v, flip: last ? last.flip : false};
    }
    const a = s.a;
    const k = (fr - s.f0) / (s.f1 - s.f0);
    const t0 = s.f0 / o.fps;
    const t1 = s.f1 / o.fps;
    const out: Partial<DancePose> = {view: s.view0, flip: s.flip};
    if (a.action === 'walk' || a.action === 'run') {
      const run = a.action === 'run';
      const distU = (Math.abs(xAt(fr) - s.x0) * o.widthPx) / o.u;
      out.walk = distU / (run ? 2.4 : 3);
      out.view = 'q';
      out.dy = -Math.abs(Math.sin(out.walk * Math.PI)) * (run ? 0.7 : 0.4);
      out.rot = run ? (s.flip ? 0.1 : -0.1) : 0;
      const sw = Math.sin(out.walk * TAU);
      out.aL = -0.6 + 0.5 * sw;
      out.aR = -0.6 - 0.5 * sw;
      const speed = Math.abs(xAt(fr + 1) - xAt(fr)) * o.widthPx;
      out.smear = run ? clamp((speed / o.u - 0.35) * 1.4, 0, 0.8) : 0;
      if (k > 0.97) out.view = 'front';
    } else if (a.action === 'hop' || a.action === 'jump') {
      const h = a.height ?? (a.action === 'hop' ? 2.2 : 4);
      const takeoff = t0 + 0.13;
      const j = jumpAt(sec, takeoff, t1 - 0.12, h);
      out.dy = j.dy;
      out.sq = j.sq;
      out.aL = out.aR = j.dy < -0.5 ? 0.9 : -0.6;
      if (s.x1 !== s.x0) out.view = 'q';
    } else if (a.action === 'take') {
      const tk = takeAt(sec, t0 + 0.1, a.size ?? 1);
      out.dy = tk.dy;
      out.sq = tk.sq;
    } else if (a.action === 'turn') {
      const ord: NibView[] = ['front', 'q', 'side', 'qback', 'back'];
      const i0 = ord.indexOf(s.view0);
      const i1 = ord.indexOf(s.view1);
      out.view = ord[Math.round(lerp(i0, i1, easeIO(k)))];
      out.smear = 0.45 * Math.sin(k * Math.PI);
    } else if (a.action === 'wave') {
      out.aR = 1.2 + 0.45 * Math.sin(sec * 13);
    } else if (a.action === 'look') {
      out.lookX = (a.dir ?? 1) * easeIO(seg(k, 0, 0.25));
    }
    // landing squash after any jump that just ended
    return out;
  };
  const danceFn = (fr: number) => {
    const s = find(fr);
    return s && s.a.action === 'dance' ? s.a.style ?? 'bounce' : '';
  };
  return {xAt, keys, extra, danceAt: danceFn, end: f};
};

/** Shared prop docs for Nib motions. */
export const NIB_PROP_DOCS = {
  bodyColor: 'Nib body colour (pass the host brand colour)',
  shadeColor: 'body shade colour',
  lightColor: 'highlight colour',
  inkColor: 'outline / features colour',
  accent: 'curl-tip + prop accent colour',
  cheekColor: 'blush colour',
  look: "'ink-wash' (boiling hand-inked edge) or 'clean' (flat vector)",
  bpm: 'tempo the idle motions and dances lock to',
  offsetSec: 'time of the first beat (s)',
  seed: 'per-character seed (blink clock, dance mix order)',
} as const;
export const nibColorsFrom = (p: {bodyColor?: string; shadeColor?: string; lightColor?: string; inkColor?: string; accent?: string; cheekColor?: string}): Partial<NibColors> => {
  const o: Partial<NibColors> = {};
  if (p.bodyColor) o.body = p.bodyColor;
  if (p.shadeColor) o.shade = p.shadeColor;
  else if (p.bodyColor) o.shade = mixHex(p.bodyColor, '#000000', 0.3);
  if (p.lightColor) o.light = p.lightColor;
  else if (p.bodyColor) o.light = mixHex(p.bodyColor, '#ffffff', 0.45);
  if (p.inkColor) o.ink = p.inkColor;
  if (p.accent) o.accent = p.accent;
  if (p.cheekColor) o.cheek = p.cheekColor;
  return o;
};

/** Paper backdrop for Nib scenes ('paper' | 'transparent' | any colour). */
export const NibBackdrop: React.FC<{background: string; w: number; h: number; u: number; floorY?: number; id: string}> = ({background, w, h, u, floorY, id}) => {
  if (!background || background === 'transparent' || background === 'none') return null;
  const paper = background === 'paper';
  const bg = paper ? NIB_COLORS.paper : background;
  return (
    <g>
      <rect width={w} height={h} fill={bg} />
      {paper ? (
        <>
          <defs>
            <filter id={`${id}pf`}>
              <feTurbulence type="fractalNoise" baseFrequency={0.012} numOctaves={3} seed={4} />
              <feColorMatrix type="matrix" values="0 0 0 0 0.47  0 0 0 0 0.37  0 0 0 0 0.27  0 0 0 0.9 -0.35" />
            </filter>
            <radialGradient id={`${id}vg`} cx="50%" cy="45%" r="75%">
              <stop offset="0.55" stopColor="#785F46" stopOpacity={0} />
              <stop offset="1" stopColor="#785F46" stopOpacity={0.3} />
            </radialGradient>
          </defs>
          <rect width={w} height={h} filter={`url(#${id}pf)`} opacity={0.35} />
          <rect width={w} height={h} fill={`url(#${id}vg)`} />
        </>
      ) : null}
      {floorY !== undefined ? <path d={`M${w * 0.06} ${floorY} L${w * 0.94} ${floorY}`} stroke={NIB_COLORS.ink} strokeOpacity={0.18} strokeWidth={Math.max(1, 1.5 * u)} strokeLinecap="round" /> : null}
    </g>
  );
};

/** rig unit (px) for a character `size` fraction of the frame height (Nib is ~11u tall incl. curl) */
export const nibUnit = (size: number, w: number, h: number) => (size * Math.min(h, w * 1.25)) / 11;
