import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease} from '../../core/ease';
import {rng} from '../../core/random';
import {PixelArt} from '../../core/r2-pr1-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A native low-res pixel scene (about 160x90 logical px, upscaled by an integer factor with crisp edges): dithered
 * banded night sky, twinkling stars, a pixel moon, stepped mountains, a ground line and a procedural sprite running a
 * looping state machine (idle - charge - cast - recover). Particles are palette-stepped squares, the sprite gets a
 * 1 px rim light from the moon, character animation is quantised to 10 fps while the camera shake stays at 30 fps.
 * Everything is SVG rects (no canvas), so it is deterministic and resolution independent.
 */

type State = {name: 'idle' | 'charge' | 'cast' | 'recover'; frames: number};
type Pal = {
  sky: string[];
  star: string;
  moon: string;
  moonShade: string;
  far: string;
  near: string;
  ground: string;
  groundTop: string;
  groundDark: string;
  hero: string;
  hero2: string;
  skin: string;
  outline: string;
  magic: string;
  magicLight: string;
  rim: string;
};
type Props = {
  sprite: 'wizard' | 'knight' | 'cat' | 'custom';
  customArt: string[];
  customPalette: Record<string, string>;
  states: State[];
  palette: Pal;
  particles: number;
  pixelFactor: number;
  spriteScale: number;
  animFps: number;
  shake: number;
  moonSide: 'left' | 'right';
  seed: number;
};

// body arts (facing right); chars: o outline, h hero colour, H hero2, s skin, e eye, w white/beard, r robe, d dark robe, m metal, M metal dark, f boot, t trim
const ART: Record<string, {rows: string[]; tip: [number, number]}> = {
  wizard: {
    rows: [
      '.....oo.....',
      '....ohho....',
      '....ohho....',
      '...ohhhho...',
      '...ohttho...',
      '..ohhhhhho..',
      '.oohhhhhhoo.',
      '...osssso...',
      '...osesso...',
      '...owwwwo...',
      '..orwwwwro..',
      '..orrwwrro..',
      '.orrrrrrrro.',
      '.orrrddrrro.',
      '.orrrddrrro.',
      '.orrrddrrro.',
      '.orrrrrrrro.',
      '.oddddddddo.',
      '..offo.offo.',
    ],
    tip: [15, 2],
  },
  knight: {
    rows: [
      '....oo......',
      '...orro.....',
      '..ommmmo....',
      '..ommmmmo...',
      '..omMMMmo...',
      '..ommmmmo...',
      '...ommmo....',
      '.oommmmmoo..',
      'ommmhmmhmmo.',
      'ommmmmmmmmo.',
      'ommmhhhhmmo.',
      '.ommmmmmmo..',
      '.ommmMMmmo..',
      '..omm..mmo..',
      '..omm..mmo..',
      '..offo.offo.',
    ],
    tip: [14, 3],
  },
  cat: {
    rows: [
      '.o.o.......',
      'ohhoho.....',
      'ohhhhho....',
      'ohehehho...',
      '.ohhhho.o..',
      '.ohhhhhhho.',
      '.ohhhhhhhho',
      '.ohhhhhhhho',
      '..ohhhhhho.',
      '..ooooooo..',
    ],
    tip: [11, 6],
  },
};

const hexMix = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const c = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1)}`;
};

const PixelSpriteScene: React.FC<Props> = ({sprite, customArt, customPalette, states, palette: P, particles, pixelFactor, spriteScale, animFps, shake, moonSide, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const F = Math.max(2, Math.round((pixelFactor || 12) * u));
  const Lw = Math.floor(w / F);
  const Lh = Math.floor(h / F);
  // animation quantised (10 fps), camera at full rate
  const step = Math.max(1, Math.round(fps / Math.max(1, animFps)));
  const af = Math.floor(frame / step) * step;
  const R = rng(seed);

  // ---- state machine
  const cycle = states.reduce((a, s) => a + s.frames, 0) || 1;
  const pos = af % cycle;
  let acc = 0;
  let cur = states[0];
  let local = 0;
  for (const s of states) {
    if (pos < acc + s.frames) {
      cur = s;
      local = pos - acc;
      break;
    }
    acc += s.frames;
  }
  const lt = clamp(local / Math.max(1, cur.frames - 1), 0, 1);

  // ---- geometry
  const groundY = Math.round(Lh * (portrait ? 0.78 : 0.74));
  const heroX = Math.round(Lw * (portrait ? 0.34 : 0.34));
  const art = sprite === 'custom' && customArt.length ? {rows: customArt, tip: [customArt[0].length + 2, 2] as [number, number]} : ART[sprite === 'custom' ? 'wizard' : sprite];
  const spriteH = art.rows.length;
  const spriteW = art.rows.reduce((m, r) => Math.max(m, r.length), 0);
  const k = Math.max(1, Math.round(spriteScale || 1));
  const pal: Record<string, string> =
    sprite === 'custom'
      ? customPalette
      : {
          o: P.outline,
          h: sprite === 'cat' ? '#D98B4A' : P.hero,
          H: P.hero2,
          t: '#F2C14E',
          s: P.skin,
          e: P.outline,
          w: '#EFEAE0',
          r: P.hero,
          d: P.hero2,
          m: '#AAB4C8',
          M: '#6F7A94',
          f: '#4A3A2A',
        };

  // pose offsets
  let dx = 0;
  let dy = 0;
  let squash = 0;
  if (cur.name === 'idle') dy = Math.floor(local / 6) % 2 === 0 ? 0 : -1;
  if (cur.name === 'charge') {
    squash = lt > 0.15 ? 1 : 0;
    dy = squash;
    dx = Math.floor(local / 3) % 2 === 0 ? 0 : -((lt > 0.6 ? 1 : 0) as number);
  }
  if (cur.name === 'cast') dx = lt < 0.3 ? 2 : lt < 0.6 ? 1 : 0;
  if (cur.name === 'recover') {
    squash = lt < 0.7 ? 1 : 0;
    dy = squash;
  }
  const sx = heroX + dx;
  const sy = groundY - spriteH * k + dy;

  // ---- shake (30 fps, 1-2 logical px)
  const castAge = cur.name === 'cast' ? local : 99;
  const shk = castAge < 8 ? Math.round(shake * (1 - castAge / 8)) : 0;
  const shx = shk ? (frame % 2 ? shk : -shk) : 0;
  const shy = shk ? (Math.floor(frame / 2) % 2 ? 1 : -1) * Math.min(1, shk) : 0;

  // ---- sky
  const bands = P.sky.length;
  const skyH = groundY - Math.round(Lh * 0.12);
  const bandH = Math.ceil(skyH / bands);
  const skyEls: React.ReactNode[] = [];
  for (let b = 0; b < bands; b++) {
    skyEls.push(<rect key={`b${b}`} x={-4} y={b * bandH} width={Lw + 8} height={bandH + 1} fill={P.sky[b]} />);
    if (b < bands - 1) {
      // 2-row dither between bands
      skyEls.push(<rect key={`d${b}`} x={-4} y={(b + 1) * bandH - 2} width={Lw + 8} height={2} fill={`url(#pss-dither-${b})`} />);
    }
  }
  const lowSky = P.sky[bands - 1];

  // ---- stars
  const stars: React.ReactNode[] = [];
  const nStars = Math.round(Lw * Lh * 0.0032);
  for (let i = 0; i < nStars; i++) {
    const x = Math.floor(R() * Lw);
    const y = Math.floor(R() * skyH * 0.62);
    const big = R() > 0.86;
    const ph = Math.floor(R() * 40);
    const tw = Math.floor((af + ph) / 12) % 4;
    const col = tw === 0 ? P.sky[Math.min(3, bands - 1)] : P.star;
    stars.push(<rect key={`s${i}`} x={x} y={y} width={1} height={1} fill={col} />);
    if (big && tw !== 0) {
      stars.push(<rect key={`sa${i}`} x={x - 1} y={y} width={3} height={1} fill={P.star} opacity={0.65} />);
      stars.push(<rect key={`sb${i}`} x={x} y={y - 1} width={1} height={3} fill={P.star} opacity={0.65} />);
    }
  }

  // ---- moon
  const mr = Math.max(6, Math.round(Math.min(Lw, Lh) * 0.1));
  const mx = Math.round(Lw * (moonSide === 'right' ? 0.8 : 0.2));
  const my = Math.round(Lh * (portrait ? 0.16 : 0.22));
  const moonEls: React.ReactNode[] = [];
  for (let yy = -mr - 3; yy <= mr + 3; yy++) {
    const half = Math.sqrt(Math.max(0, (mr + 3) * (mr + 3) - yy * yy));
    const halfM = Math.sqrt(Math.max(0, mr * mr - yy * yy));
    if (half > 0) moonEls.push(<rect key={`h${yy}`} x={mx - Math.round(half)} y={my + yy} width={Math.round(half) * 2} height={1} fill={P.sky[Math.min(bands - 1, 4)]} opacity={0.5} />);
    if (halfM > 0.5) {
      // terminator shade on the far side
      const hw = Math.round(halfM);
      moonEls.push(<rect key={`m${yy}`} x={mx - hw} y={my + yy} width={hw * 2} height={1} fill={P.moon} />);
      const shade = Math.round(hw * 0.5);
      moonEls.push(<rect key={`ms${yy}`} x={moonSide === 'right' ? mx - hw : mx + hw - shade} y={my + yy} width={shade} height={1} fill={P.moonShade} />);
    }
  }
  moonEls.push(<rect key="c1" x={mx - 2} y={my - 2} width={3} height={2} fill={P.moonShade} />, <rect key="c2" x={mx + 1} y={my + 2} width={2} height={2} fill={P.moonShade} />);

  // ---- mountains (stepped silhouettes)
  const mountain = (key: string, base: number, amp: number, fq: number, ph: number, col: string, drift: number) => {
    const els: React.ReactNode[] = [];
    let runX = 0;
    let runH = -1;
    for (let x = 0; x <= Lw; x++) {
      const xx = x + drift;
      const hgt = x === Lw ? -2 : Math.round(base + Math.sin(xx * fq + ph) * amp + Math.sin(xx * fq * 2.3 + ph * 1.7) * amp * 0.45);
      if (hgt !== runH) {
        if (runH >= 0) els.push(<rect key={`${key}${runX}`} x={runX} y={groundY - runH} width={x - runX} height={runH + 1} fill={col} />);
        runX = x;
        runH = hgt;
      }
    }
    return els;
  };

  // ---- ground
  const groundEls: React.ReactNode[] = [
    <rect key="g" x={-4} y={groundY} width={Lw + 8} height={Lh - groundY + 4} fill={P.ground} />,
    <rect key="gt" x={-4} y={groundY} width={Lw + 8} height={1} fill={P.groundTop} />,
    <rect key="gd" x={-4} y={groundY + 1} width={Lw + 8} height={1} fill={hexMix(P.groundTop, P.ground, 0.5)} />,
  ];
  for (let y = groundY + 4; y < Lh; y += 4) for (let x = (y / 4) % 2 ? 1 : 4; x < Lw; x += 7) groundEls.push(<rect key={`gp${x}-${y}`} x={x} y={y} width={2} height={1} fill={P.groundDark} />);

  // ---- magic: tip position
  const tipX = sx + (sprite === 'cat' ? art.tip[0] - 1 : art.tip[0]) * k;
  const tipY = sy + art.tip[1] * k;
  const staffEls: React.ReactNode[] = [];
  if (sprite === 'wizard') {
    const stX = sx + 13 * k;
    staffEls.push(<rect key="st" x={stX} y={tipY + 2 * k} width={k} height={groundY - tipY - 2 * k} fill="#7A5230" />);
    const glow = cur.name === 'charge' ? 1 + Math.floor(lt * 3) : cur.name === 'cast' ? 3 : 0;
    staffEls.push(<rect key="gem" x={stX - k} y={tipY - k} width={3 * k} height={3 * k} fill={glow > 1 ? P.magicLight : P.magic} />);
    if (glow) staffEls.push(<rect key="gl" x={stX - k - glow} y={tipY - k - glow} width={3 * k + glow * 2} height={3 * k + glow * 2} fill={P.magic} opacity={0.32} />);
  }
  if (sprite === 'knight') {
    const stX = sx + 13 * k;
    staffEls.push(<rect key="sw" x={stX} y={tipY - 3 * k} width={k} height={11 * k} fill="#D5DCEA" />, <rect key="sh" x={stX - k} y={tipY + 7 * k} width={3 * k} height={k} fill="#F2C14E" />);
  }

  // particles
  const parts: React.ReactNode[] = [];
  const palStep = (t: number) => (t < 0.35 ? P.magic : t < 0.75 ? P.magicLight : '#FFFFFF');
  const pr = rng(seed + 9);
  const nP = Math.max(0, Math.round(particles));
  for (let i = 0; i < nP; i++) {
    const ang = pr() * Math.PI * 2;
    const rad = 14 + pr() * 14;
    const spd = 0.6 + pr() * 1.4;
    const sz = pr() > 0.7 ? 2 : 1;
    if (cur.name === 'charge') {
      const e = ease.in(clamp(lt * 1.15 - (i / nP) * 0.25, 0, 1));
      const rr = rad * (1 - e);
      parts.push(<rect key={`p${i}`} x={Math.round(tipX + Math.cos(ang + lt * 3) * rr)} y={Math.round(tipY + Math.sin(ang + lt * 3) * rr)} width={sz} height={sz} fill={palStep(e)} opacity={e < 0.98 ? 1 : 0} />);
    } else if (cur.name === 'cast') {
      const t = local;
      const dist = spd * t * 2.2;
      parts.push(<rect key={`p${i}`} x={Math.round(tipX + Math.cos(ang) * dist)} y={Math.round(tipY + Math.sin(ang) * dist + 0.04 * t * t)} width={sz} height={sz} fill={palStep(1 - t / cur.frames)} opacity={t < cur.frames - 3 ? 1 : 0} />);
    } else if (cur.name === 'recover') {
      const t = local;
      const life = clamp(t / cur.frames, 0, 1);
      if (i < nP / 3) parts.push(<rect key={`p${i}`} x={Math.round(tipX + Math.cos(ang) * 4 * (1 + life))} y={Math.round(tipY - t * 0.5 * spd - 2)} width={1} height={1} fill={life < 0.5 ? P.magicLight : P.magic} opacity={life < 0.85 ? 1 : 0} />);
    }
  }
  // cast bolt + ring
  const bolt: React.ReactNode[] = [];
  if (cur.name === 'cast') {
    const t = local;
    const reach = Math.min(Lw - tipX, t * 14);
    const th = t < 4 ? 3 : t < 8 ? 2 : 1;
    if (t < 12) {
      bolt.push(<rect key="b0" x={tipX} y={tipY - Math.floor(th / 2)} width={reach} height={th} fill={t < 6 ? '#FFFFFF' : P.magicLight} />);
      bolt.push(<rect key="b1" x={tipX} y={tipY - Math.floor(th / 2) - 1} width={reach} height={1} fill={P.magic} opacity={0.7} />);
      bolt.push(<rect key="b2" x={tipX} y={tipY + Math.ceil(th / 2)} width={reach} height={1} fill={P.magic} opacity={0.7} />);
    }
    const rr = Math.round(t * 1.6);
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      if (t < 14) bolt.push(<rect key={`r${k}`} x={Math.round(tipX + Math.cos(a) * rr)} y={Math.round(tipY + Math.sin(a) * rr)} width={1} height={1} fill={t < 6 ? '#FFFFFF' : P.magicLight} />);
    }
  }
  // cast flash
  const flash = cur.name === 'cast' && local < 2 ? 0.22 : 0;

  const offX = Math.floor((w - Lw * F) / 2);
  const offY = Math.floor((h - Lh * F) / 2);
  void spriteW;

  return (
    <AbsoluteFill style={{background: lowSky}}>
      <svg width={Lw * F} height={Lh * F} viewBox={`0 0 ${Lw} ${Lh}`} shapeRendering="crispEdges" style={{position: 'absolute', left: offX, top: offY, imageRendering: 'pixelated', overflow: 'hidden'}}>
        <defs>
          {P.sky.slice(0, -1).map((c, b) => (
            <pattern key={b} id={`pss-dither-${b}`} width={2} height={2} patternUnits="userSpaceOnUse">
              <rect width={2} height={2} fill={c} />
              <rect x={0} y={0} width={1} height={1} fill={P.sky[b + 1]} />
              <rect x={1} y={1} width={1} height={1} fill={P.sky[b + 1]} />
            </pattern>
          ))}
        </defs>
        <g transform={`translate(${shx} ${shy})`}>
          {skyEls}
          {stars}
          {moonEls}
          {mountain('mf', Lh * 0.17, Lh * 0.06, 0.07, 1.3, P.far, 0)}
          {mountain('mn', Lh * 0.09, Lh * 0.04, 0.11, 4.1, P.near, 0)}
          {groundEls}
          {/* shadow */}
          <rect x={sx + k} y={groundY} width={(spriteW - 2) * k} height={1} fill={P.groundDark} />
          {staffEls}
          <g transform={`translate(${sx} ${sy}) scale(${k})`}><PixelArt art={art.rows} pal={pal} x={0} y={0} rim={{color: P.rim, side: moonSide === 'right' ? 'right' : 'left'}} /></g>
          {bolt}
          {parts}
        </g>
        {flash ? <rect x={0} y={0} width={Lw} height={Lh} fill="#fff" opacity={flash} /> : null}
      </svg>
    </AbsoluteFill>
  );
};

export const pixelSpriteScene = defineMotion<Props>({
  id: 'pixel-sprite-scene',
  title: 'Pixel sprite scene (state machine)',
  category: 'game',
  description:
    'A native ~160x90 pixel night scene with dithered sky bands, twinkling stars, a pixel moon, stepped mountains and a ground line; a procedural wizard / knight / cat sprite loops idle, charge, cast, recover with palette-stepped particles, a 1 px moon rim light, 10 fps character timing and 1-2 px screen shake on the cast.',
  source: ['prompt-corpus: pixel-sprite-scene (40 cases)', 'awesome-opus5-5-videos prompts (MIT) — technique only'],
  useFor: 'Retro game promos, indie-dev trailers, nostalgic social posts and loading loops. Pass `sprite`, `palette` and `states` to retheme; for a lit-set storytelling look use lit-pixel-sprite instead.',
  durationInFrames: 220,
  defaultProps: {
    sprite: 'wizard',
    customArt: [],
    customPalette: {},
    states: [
      {name: 'idle', frames: 36},
      {name: 'charge', frames: 42},
      {name: 'cast', frames: 20},
      {name: 'recover', frames: 28},
    ],
    palette: {
      sky: ['#090C24', '#0F1538', '#17205A', '#25347F', '#3B4FA0', '#6B79BF'],
      star: '#FFF6D6',
      moon: '#F6EDC9',
      moonShade: '#CFC192',
      far: '#1C2559',
      near: '#101542',
      ground: '#2A2145',
      groundTop: '#5B4A8A',
      groundDark: '#1C1531',
      hero: '#6A4BD8',
      hero2: '#42308F',
      skin: '#F0C8A0',
      outline: '#120C20',
      magic: '#B66CFF',
      magicLight: '#E9C9FF',
      rim: '#BFD2FF',
    },
    particles: 26,
    pixelFactor: 12,
    spriteScale: 2,
    animFps: 10,
    shake: 2,
    moonSide: 'right',
    seed: 11,
  },
  propDocs: {
    sprite: "'wizard' | 'knight' | 'cat' | 'custom' (customArt + customPalette)",
    customArt: 'rows of characters for a custom sprite, e.g. ["..oo..","ohhho."] (.=transparent)',
    customPalette: 'map char -> hex colour for customArt',
    states: "[{name:'idle'|'charge'|'cast'|'recover', frames}] looped in order",
    palette: 'scene palette: sky[] bands (top->horizon), star, moon, far/near mountains, ground, hero colours, magic, rim',
    particles: 'particle count (0 = none)',
    spriteScale: 'integer scale of the sprite (2 = chunky 2x2 pixels)',
    pixelFactor: 'screen px per logical pixel at 1080 (12 = 160x90)',
    animFps: 'character / particle animation rate (8-12)',
    shake: 'screen-shake px on the cast (0-2)',
    moonSide: "'left' | 'right' (also the rim-light side)",
    seed: 'star / particle seed',
  },
  component: PixelSpriteScene,
  tags: ['pixel', 'pixel art', '8-bit', 'retro', 'game', 'sprite', 'wizard', 'knight', 'cat', 'night', 'moon', 'stars', 'state machine', 'magic', 'particles', 'indie', 'trailer', 'loop', 'dither'],
});
