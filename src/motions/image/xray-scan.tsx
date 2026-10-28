import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {n2, rng} from '../../core/random';
import {smoothClosed} from '../../core/shapes';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {FilterDefs, Plate, PlatePaletteName, hexRgb, useSafeId} from '../../core/image-kit';

/**
 * Reveal an x-ray / blueprint render of an image.
 *  - beam (video2 xray-scan-sweep): vertical scan beam (3–4 px core #e6f6ff, 40–60 px glow #82b9d7 @40 %,
 *    2–3 trailing lines 20–30 px behind) travelling 0.75 W/s linear; the wake shows the x-ray layer,
 *    +20 % brighter under the beam, 1 px scanlines every 4 px @6 %, ±3 % luma flicker. Second pass restores colour.
 *  - blob (video11 organic-blob-reveal): lobed blob (±12 % radius noise, rotating 20°/s) opens in 9 f
 *    (cubic-bezier .55,0,.45,1) with 300 ink bristles on the rim; closes with a 7 f ease-in blob.
 *  - hole (video6 xray-hatch-hole): 2-frame wireframe flash, then a hole with a hand-hatched ink edge opens
 *    to full frame in ≈4 f (easeInQuad), strokes re-seeded every 2 f.
 * X-ray layer: the procedural plate is drawn as glowing line art; real images go through an
 * inverted-luma + edge-detect (feConvolveMatrix) filter.
 */
type Props = {
  src: string;
  seed: number;
  palette: PlatePaletteName;
  mode: 'beam' | 'blob' | 'hole' | 'cutaway';
  look: 'blueprint' | 'xray';
  speed: number;
  start: number;
  passes: number;
  beamColor: string;
  glowColor: string;
  glowWidth: number;
  flicker: number;
  reticle: boolean;
  bristleColor: string;
  push: number;
  words: {text: string; at: number}[];
  object: 'battery' | 'pipe' | 'cell';
  coreColor: string;
  inkColor: string;
  clayColor: string;
  orbitDeg: number;
  cutAngle: number;
};

/** 2D half-section of an object: hatched cut walls around a glowing emissive core, glow tinting the floor */
const Cutaway: React.FC<{p: Props; frame: number; w: number; h: number; u: number; D: number; id: string}> = ({p, frame, w, h, u, D, id}) => {
  const e = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t));
  const drift = e(frame / Math.max(1, D * 0.8)) * p.orbitDeg;
  const intro = prog(frame, 0, 22, ease.out);
  const vert = h > w;
  const L = (vert ? h * 0.52 : w * 0.46) * intro;
  const Rr = (vert ? w * 0.22 : h * 0.2) * (p.object === 'pipe' ? 0.8 : 1);
  const wall = Rr * 0.12 * 2;
  const glow = 0.85 + 0.15 * Math.sin(frame * 0.12);
  const cut = clamp(p.cutAngle / 180);
  const rot = (vert ? 90 : 0) + drift * 0.5;
  const capW = p.object === 'battery' ? Rr * 0.28 : 0;
  const body = (
    <g transform={`translate(${w / 2} ${h * (vert ? 0.46 : 0.5)}) rotate(${rot}) skewX(${-drift * 0.3})`}>
      {/* floor glow */}
      <ellipse cx={0} cy={Rr * 1.5} rx={L * 0.7} ry={Rr * 0.35} fill={p.coreColor} opacity={0.18 * glow} filter={`url(#${id}b)`} />
      {/* back half (clay) */}
      <rect x={-L / 2} y={-Rr} width={L} height={Rr * 2} rx={p.object === 'cell' ? Rr * 0.9 : Rr * 0.18} fill={p.clayColor} stroke={p.inkColor} strokeWidth={2 * u} />
      {capW > 0 && <rect x={L / 2} y={-Rr * 0.32} width={capW} height={Rr * 0.64} rx={Rr * 0.08} fill={p.clayColor} stroke={p.inkColor} strokeWidth={2 * u} />}
      {/* cut-away window: the front of the can is removed */}
      <rect x={-L / 2 + wall} y={-Rr + wall + Rr * 2 * (1 - cut) * 0.0} width={L - wall * 2} height={(Rr - wall) * 2} rx={Rr * 0.1} fill="#050805" />
      {/* hatched walls (cut faces) */}
      <rect x={-L / 2} y={-Rr} width={L} height={wall} fill={`url(#${id}h)`} stroke={p.inkColor} strokeWidth={1.5 * u} />
      <rect x={-L / 2} y={Rr - wall} width={L} height={wall} fill={`url(#${id}h)`} stroke={p.inkColor} strokeWidth={1.5 * u} />
      <rect x={-L / 2} y={-Rr} width={wall} height={Rr * 2} fill={`url(#${id}h)`} stroke={p.inkColor} strokeWidth={1.5 * u} />
      <rect x={L / 2 - wall} y={-Rr} width={wall} height={Rr * 2} fill={`url(#${id}h)`} stroke={p.inkColor} strokeWidth={1.5 * u} />
      {/* emissive core */}
      <rect x={-L / 2 + wall * 1.6} y={-Rr + wall * 1.6} width={L - wall * 3.2} height={(Rr - wall * 1.6) * 2} rx={Rr * 0.12} fill={p.coreColor} opacity={0.35 * glow} filter={`url(#${id}b)`} />
      <rect x={-L / 2 + wall * 1.6} y={-Rr + wall * 1.6} width={L - wall * 3.2} height={(Rr - wall * 1.6) * 2} rx={Rr * 0.12} fill={`url(#${id}c)`} />
    </g>
  );
  return (
    <AbsoluteFill style={{background: '#0b0d0c'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id={`${id}h`} width={6 * u} height={6 * u} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={6 * u} height={6 * u} fill={p.clayColor} />
            <line x1={0} y1={0} x2={0} y2={6 * u} stroke={p.inkColor} strokeWidth={1.4 * u} />
          </pattern>
          <radialGradient id={`${id}c`} cx="50%" cy="50%" r="65%">
            <stop offset="0" stopColor="#d8ffe4" />
            <stop offset="0.45" stopColor={p.coreColor} />
            <stop offset="1" stopColor={p.coreColor} stopOpacity={0.85} />
          </radialGradient>
          <filter id={`${id}b`} x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation={9 * u} />
          </filter>
          <radialGradient id={`${id}f`} cx="50%" cy="60%" r="60%">
            <stop offset="0" stopColor={p.coreColor} stopOpacity={0.14 * glow} />
            <stop offset="1" stopColor={p.coreColor} stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#${id}f)`} />
        {body}
      </svg>
    </AbsoluteFill>
  );
};

const LOOKS = {
  blueprint: {stroke: '#D8DAF5', ground: '#070818', ramp: ['#E8EAFF', '#8A8FC8', '#2A2E66', '#070818']},
  xray: {stroke: '#A8DDFF', ground: '#03111d', ramp: ['#E6F6FF', '#6FB3D9', '#173E5E', '#020B14']},
};

const XrayScan: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames: D, cx, cy} = useStage();
  const fid = useSafeId('xr');
  const look = LOOKS[p.look] ?? LOOKS.blueprint;
  const zoom = 1 + (p.push / 100) * (frame / fps);
  if (p.mode === 'cutaway') return <Cutaway p={p} frame={frame} w={w} h={h} u={u} D={D} id={fid} />;

  const colour = (
    <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '60% 55%'}}>
      <Plate src={p.src} seed={p.seed} palette={p.palette} />
    </AbsoluteFill>
  );
  // reticle / construction circles while the x-ray is visible (video11 blueprint guides)
  const retT = p.reticle ? prog(frame, p.start + 18, p.start + 48, ease.out) : 0;
  const rr = 210 * u;
  const rxc = w * 0.64;
  const ryc = h * 0.5;
  const circ = 2 * Math.PI * rr;

  const flick = 1 + (random(`xf${frame}`) - 0.5) * 2 * p.flicker;
  const xray = (
    <AbsoluteFill style={{background: look.ground}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '60% 55%', filter: `${p.src ? `url(#${fid}) ` : ''}brightness(${flick})`}}>
        {p.src ? <Plate src={p.src} /> : <Plate seed={p.seed} palette={p.palette} mode="lines" stroke={look.stroke} ground={look.ground} />}
      </AbsoluteFill>
      {/* scanlines: 1 px every 4 px @ 6 % */}
      <AbsoluteFill style={{backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) ${u}px, transparent ${u}px, transparent ${4 * u}px)`}} />
      {p.words.length > 0 && (
        <div style={{position: 'absolute', left: 0, top: h * 0.4, width: w, height: h * 0.2, display: 'flex'}}>
          {p.words.map((wd, i) => (
            <div key={i} style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Archivo, Impact, sans-serif', fontWeight: 800, fontSize: Math.min(h * 0.14, ((w / p.words.length) * 0.9) / Math.max(2, Math.max(...p.words.map((x) => x.text.length)) * 0.62)), letterSpacing: '0.02em', color: look.stroke, textShadow: `0 0 ${12 * u}px ${look.stroke}`, opacity: 0.95}}>
              {wd.text}
            </div>
          ))}
        </div>
      )}
      {retT > 0.001 && (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: retT}}>
          <g stroke={look.stroke} fill="none" strokeWidth={1.4 * u}>
            <circle cx={rxc} cy={ryc} r={rr} strokeDasharray={`${circ * retT} ${circ}`} transform={`rotate(${-90 + frame * 0.4} ${rxc} ${ryc})`} opacity={0.8} />
            <circle cx={rxc} cy={ryc} r={rr * 1.35} strokeDasharray={`${4 * u} ${7 * u}`} opacity={0.45} transform={`rotate(${-frame * 0.3} ${rxc} ${ryc})`} />
            <circle cx={rxc} cy={ryc} r={rr * 0.55} opacity={0.5} strokeDasharray={`${circ * 0.55 * retT} ${circ}`} />
            {[0, 90, 180, 270].map((a) => (
              <line key={a} x1={rxc + Math.cos((a * Math.PI) / 180) * rr * 0.92} y1={ryc + Math.sin((a * Math.PI) / 180) * rr * 0.92} x2={rxc + Math.cos((a * Math.PI) / 180) * rr * 1.18} y2={ryc + Math.sin((a * Math.PI) / 180) * rr * 1.18} strokeWidth={2 * u} />
            ))}
            <line x1={rxc - rr * 1.6 * retT} y1={ryc} x2={rxc + rr * 1.6 * retT} y2={ryc} opacity={0.3} />
            <line x1={rxc} y1={ryc - rr * 1.6 * retT} x2={rxc} y2={ryc + rr * 1.6 * retT} opacity={0.3} />
          </g>
        </svg>
      )}
    </AbsoluteFill>
  );

  // ---- reveal geometry ------------------------------------------------------------------------
  let reveal: React.ReactNode = null;
  let overlay: React.ReactNode = null;
  let xrayAmount = 0;

  if (p.mode === 'beam') {
    const pxPerF = (p.speed * w) / fps;
    const margin = 80 * u;
    const passLen = Math.ceil((w + 2 * margin) / pxPerF);
    const gap = Math.max(10, Math.round((D - p.start - passLen * p.passes - 8) / Math.max(1, p.passes - 1)));
    let bx = -margin;
    let dir = 1;
    let revealW = 0;
    for (let k = 0; k < p.passes; k++) {
      const s = p.start + k * (passLen + gap);
      const t = (frame - s) / passLen;
      if (frame < s) break;
      dir = k % 2 === 0 ? 1 : -1;
      const x = -margin + clamp(t) * (w + 2 * margin);
      bx = dir > 0 ? x : w - x;
      revealW = clamp(bx, 0, w);
      if (t > 1) bx = dir > 0 ? w + margin * 3 : -margin * 3;
    }
    if (p.words.length) {
      // the beam's leading edge is the karaoke cursor: word i occupies x in [i/n, (i+1)/n] of the width
      const n = p.words.length;
      let wi = -1;
      for (let i = 0; i < n; i++) if (frame >= p.words[i].at) wi = i;
      if (wi < 0) {
        bx = -margin;
        revealW = 0;
      } else {
        const next = wi + 1 < n ? p.words[wi + 1].at : p.words[wi].at + 14;
        const t = ease.inOut(clamp((frame - p.words[wi].at) / Math.max(4, Math.min(next - p.words[wi].at, 18))));
        bx = ((wi + t) / n) * w;
        revealW = clamp(bx, 0, w);
        dir = 1;
      }
    }
    const beamVisible = bx > -margin && bx < w + margin;
    reveal = <AbsoluteFill style={{clipPath: `inset(0 ${w - revealW}px 0 0)`}}>{xray}</AbsoluteFill>;
    xrayAmount = revealW / w;
    const gw = p.glowWidth * u;
    overlay = beamVisible && (
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}}>
        <defs>
          <linearGradient id={`${fid}g`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={p.glowColor} stopOpacity={0} />
            <stop offset="0.5" stopColor={p.glowColor} stopOpacity={0.4} />
            <stop offset="1" stopColor={p.glowColor} stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`${fid}b`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.5" stopColor="#fff" stopOpacity={0.2} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* +20 % brightness band under the beam */}
        <rect x={bx - gw * 3} y={0} width={gw * 6} height={h} fill={`url(#${fid}b)`} />
        <rect x={bx - gw} y={0} width={gw * 2} height={h} fill={`url(#${fid}g)`} />
        {[1, 2, 3].map((k) => (
          <rect key={k} x={bx - dir * (8 + k * 9) * u} y={0} width={1 * u} height={h} fill={p.beamColor} opacity={0.5 - k * 0.12} />
        ))}
        <rect x={bx - 1.75 * u} y={0} width={3.5 * u} height={h} fill={p.beamColor} />
        <rect x={bx - 0.75 * u} y={0} width={1.5 * u} height={h} fill="#fff" />
      </svg>
    );
  } else if (p.mode === 'blob') {
    // open: 9 f, cubic-bezier(.55,0,.45,1), r_max beyond the corners; close: 7 f stronger ease-in
    const rMax = Math.hypot(w, h) * 0.75;
    const openT = interpolate(frame, [p.start, p.start + 9], [0, 1], {easing: Easing.bezier(0.55, 0, 0.45, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const closeS = D - 30;
    const closeT = interpolate(frame, [closeS, closeS + 7], [0, 1], {easing: Easing.bezier(0.6, 0, 0.9, 0.6), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const blob = (sx: number, sy: number, R: number, t: number, seed: string) => {
      const ccx = sx + (cx - sx) * ease.out(t) * 0.5;
      const ccy = sy + (cy - sy) * ease.out(t) * 0.5;
      const pts: [number, number][] = [];
      const rot = (frame / fps) * ((20 * Math.PI) / 180);
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        const rr = R * (1 + 0.12 * n2(seed, Math.cos(a + rot) * 1.3, Math.sin(a + rot) * 1.3 + frame * 0.02) + 0.06 * Math.sin(a * 5 + rot));
        pts.push([ccx + Math.cos(a) * rr, ccy + Math.sin(a) * rr]);
      }
      return {d: smoothClosed(pts), pts, ccx, ccy};
    };
    const bristles = (b: {pts: [number, number][]; ccx: number; ccy: number}, seed: number) => {
      const r = rng(seed + Math.floor(frame / 2));
      let d = '';
      for (let i = 0; i < 300; i++) {
        const k = Math.floor(r() * 64);
        const [x, y] = b.pts[k];
        const a = Math.atan2(y - b.ccy, x - b.ccx) + (r() - 0.5) * 0.52;
        const l = (6 + 14 * r()) * u;
        const s0 = (r() - 0.6) * 6 * u;
        d += `M${(x + Math.cos(a) * s0).toFixed(1)} ${(y + Math.sin(a) * s0).toFixed(1)}l${(Math.cos(a) * l).toFixed(1)} ${(Math.sin(a) * l).toFixed(1)}`;
      }
      return d;
    };
    const ink = p.bristleColor;
    if (closeT <= 0) {
      const b = blob(w * 0.6, h * 0.52, rMax * openT, openT, 'bo' + p.seed);
      xrayAmount = openT;
      reveal = openT > 0 && <AbsoluteFill style={{clipPath: openT >= 1 ? undefined : `path('${b.d}')`}}>{xray}</AbsoluteFill>;
      overlay = openT > 0 && openT < 1 && (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <path d={b.d} fill="none" stroke={ink} strokeWidth={2 * u} strokeOpacity={0.8} />
          <path d={bristles(b, 11)} stroke={ink} strokeOpacity={0.6} strokeWidth={1.2 * u} />
        </svg>
      );
    } else {
      // colour comes back through a second blob
      const b = blob(w * 0.83, h * 0.38, rMax * closeT, closeT, 'bc' + p.seed);
      xrayAmount = 1 - closeT;
      reveal = (
        <>
          {xray}
          <AbsoluteFill style={{clipPath: closeT >= 1 ? undefined : `path('${b.d}')`}}>{colour}</AbsoluteFill>
        </>
      );
      overlay = closeT < 1 && (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <path d={b.d} fill="none" stroke={ink} strokeWidth={2 * u} strokeOpacity={0.8} />
          <path d={bristles(b, 23)} stroke={ink} strokeOpacity={0.6} strokeWidth={1.2 * u} />
        </svg>
      );
    }
  } else {
    // hole: wireframe flash (2 f), then hatched-edge hole 0 -> full in 4 f (easeInQuad)
    const wf0 = p.start;
    const h0 = p.start + 3;
    const full = Math.hypot(w, h) * 0.62;
    const t = interpolate(frame, [h0, h0 + 4], [0, 1], {easing: Easing.in(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const R = full * t;
    const hx = w * 0.58;
    const hy = h * 0.5;
    const pts: [number, number][] = [];
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const rr = R * (1 + 0.04 * n2('hole' + p.seed, Math.cos(a) * 3, Math.sin(a) * 3 + Math.floor(frame / 2)));
      pts.push([hx + Math.cos(a) * rr, hy + Math.sin(a) * rr]);
    }
    const d = smoothClosed(pts);
    xrayAmount = t;
    const flash = frame >= wf0 && frame < wf0 + 2;
    reveal = (
      <>
        {flash && <AbsoluteFill style={{mixBlendMode: 'screen', opacity: 0.85}}>{xray}</AbsoluteFill>}
        {t > 0 && <AbsoluteFill style={{clipPath: t >= 1 ? undefined : `path('${d}')`}}>{xray}</AbsoluteFill>}
      </>
    );
    if (t > 0 && t < 1) {
      const r = rng(p.seed * 7 + Math.floor(frame / 2));
      const n = Math.round((Math.PI * 2 * R) / (4 * u));
      let hd = '';
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2;
        const rr = R + (r() - 0.5) * 30 * u;
        const sa = a + (r() - 0.5) * ((50 * Math.PI) / 180);
        const l = (20 + 20 * r()) * u;
        const x = hx + Math.cos(a) * rr;
        const y = hy + Math.sin(a) * rr;
        hd += `M${(x - (Math.cos(sa) * l) / 2).toFixed(1)} ${(y - (Math.sin(sa) * l) / 2).toFixed(1)}l${(Math.cos(sa) * l).toFixed(1)} ${(Math.sin(sa) * l).toFixed(1)}`;
      }
      overlay = (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply'}}>
          <path d={hd} stroke={p.bristleColor} strokeWidth={2.2 * u} strokeLinecap="round" opacity={0.9} />
        </svg>
      );
    }
  }

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {p.src && (
        <FilterDefs>
          <XrayFilter id={fid} ramp={look.ramp} />
        </FilterDefs>
      )}
      {colour}
      {reveal}
      {overlay}
    </AbsoluteFill>
  );
};

/** inverted-luma ramp + Laplacian edges: x-ray / blueprint render of a real image */
const XrayFilter: React.FC<{id: string; ramp: string[]}> = ({id, ramp}) => {
  const c = ramp.map(hexRgb);
  const tv = (k: number) => c.map((v) => (v[k] / 255).toFixed(3)).join(' ');
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0" result="l" />
      <feGaussianBlur in="l" stdDeviation="1.2" result="lb" />
      <feConvolveMatrix in="lb" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="e" />
      <feComponentTransfer in="e" result="e2">
        <feFuncR type="linear" slope="5" />
        <feFuncG type="linear" slope="5" />
        <feFuncB type="linear" slope="5" />
      </feComponentTransfer>
      <feComponentTransfer in="l" result="ramp">
        <feFuncR type="table" tableValues={tv(0)} />
        <feFuncG type="table" tableValues={tv(1)} />
        <feFuncB type="table" tableValues={tv(2)} />
      </feComponentTransfer>
      <feComponentTransfer in="ramp" result="dim">
        <feFuncR type="linear" slope="0.75" />
        <feFuncG type="linear" slope="0.75" />
        <feFuncB type="linear" slope="0.75" />
      </feComponentTransfer>
      <feComposite in="dim" in2="e2" operator="arithmetic" k1="0" k2="1" k3="0.9" k4="0" />
    </filter>
  );
};

export const xrayScan = defineMotion<Props>({
  id: 'xray-scan',
  title: 'X-ray scan reveal',
  category: 'image',
  description: 'A glowing vertical scan beam (or an inky organic blob / hatched hole) sweeps across an image, revealing a glowing x-ray / blueprint line-art version in its wake.',
  source: ['video2 0:00 xray-scan-sweep', 'video11 0:01.3 organic-blob-reveal + blueprint-xray-style', 'video6 0:01.4 xray-hatch-hole'],
  useFor: 'Showing what is inside / how it works, scanning or analysing beats, tech and science explainers.',
  durationInFrames: 150,
  defaultProps: {
    src: '',
    seed: 1,
    palette: 'dusk',
    mode: 'beam',
    look: 'blueprint',
    speed: 0.75,
    start: 14,
    passes: 2,
    beamColor: '#e6f6ff',
    glowColor: '#82b9d7',
    glowWidth: 50,
    flicker: 0.03,
    reticle: true,
    bristleColor: '#10131C',
    push: 1.2,
    words: [],
    object: 'battery',
    coreColor: '#2DFF71',
    inkColor: '#1d1b17',
    clayColor: '#e8e1d2',
    orbitDeg: 8,
    cutAngle: 180,
  },
  propDocs: {
    src: 'public/ image path (edge-detected into an x-ray); empty = procedural plate drawn as line art',
    seed: 'procedural plate seed',
    palette: 'procedural plate palette: dusk | night | dawn',
    look: 'blueprint (lavender on navy) | xray (cyan on deep blue)',
    speed: 'beam speed in frame-widths per second (0.75 measured)',
    start: 'frame the first reveal starts',
    passes: 'beam passes: 1 = reveal only, 2 = reveal then sweep back to colour',
    beamColor: 'beam core colour',
    glowColor: 'beam glow colour (drawn at 40 %)',
    glowWidth: 'beam glow half-width in px at 1080p (40–60)',
    flicker: 'x-ray luminance flicker (±3 %)',
    reticle: 'draw construction circles / reticle over the x-ray',
    bristleColor: 'blob / hole ink edge colour',
    push: 'slow push-in in %/s',
    mode: 'beam | blob | hole | cutaway (half-section drawing of an object: hatched cut walls around a glowing core)',
    words: "beam mode karaoke cursor: [{text, at}] words laid across the frame; the beam's leading edge advances on each word's `at` frame, revealing the word cut into the x-ray layer",
    object: 'cutaway: battery | pipe | cell',
    coreColor: 'cutaway: emissive core colour (#2DFF71)',
    inkColor: 'cutaway: line / hatch ink',
    clayColor: 'cutaway: clay body colour',
    orbitDeg: 'cutaway: slow camera drift in degrees over the shot',
    cutAngle: 'cutaway: cut extent in degrees (180 = half section)',
  },
  component: XrayScan,
  tags: ['image', 'xray', 'scan', 'blueprint', 'reveal', 'beam', 'wipe', 'cutaway', 'cross-section', 'battery', 'whats inside', 'karaoke', 'lyrics'],
});
