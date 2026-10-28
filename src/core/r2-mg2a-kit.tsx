// Shared helpers for the MG2-1 batch (holo-globe, collage-puppet, scissor-cut, ransom-note-type, mesh-gradient-bg,
// glass-ui-cards, liquid-glass-lens, grid-beat-construct, outrun-grid).
// Adapted from mg-styles-15 demos 06-collage, 09-bauhaus, 10-synthwave, 12-aurora-glass, 22-hud (MIT) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from './ease';
import {rng} from './random';
import {useStage} from './stage';
import {LAND_MASK_ROWS, LAND_RINGS} from './r2-mg2a-land';

export const smooth = (t: number) => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};
export const hermite = smooth;
export const mixN = (a: number, b: number, t: number) => a + (b - a) * t;
export const deg = Math.PI / 180;

/* ------------------------------------------------------------------ land data (Natural Earth, PD) */
let _rings: [number, number][][] | null = null;
/** coastline polylines [lon,lat][] — split where they cross the antimeridian, Antarctica's ring trimmed */
export const landRings = (): [number, number][][] => {
  if (_rings) return _rings;
  const out: [number, number][][] = [];
  for (const flat of LAND_RINGS) {
    let cur: [number, number][] = [];
    for (let i = 0; i < flat.length; i += 2) {
      const p: [number, number] = [flat[i], flat[i + 1]];
      const prev = cur[cur.length - 1];
      if (p[1] < -83 || (prev && Math.abs(p[0] - prev[0]) > 180)) {
        if (cur.length > 1) out.push(cur);
        cur = p[1] < -83 ? [] : [p];
      } else cur.push(p);
    }
    if (cur.length > 1) out.push(cur);
  }
  _rings = out;
  return out;
};
let _mask: Uint8Array | null = null;
const decodeMask = () => {
  if (_mask) return _mask;
  const m = new Uint8Array(180 * 90);
  LAND_MASK_ROWS.forEach((row, y) => {
    for (let i = 0; i < row.length; i++) {
      const v = parseInt(row[i], 16);
      for (let b = 0; b < 4; b++) m[y * 180 + i * 4 + b] = (v >> (3 - b)) & 1;
    }
  });
  _mask = m;
  return m;
};
export const isLand = (lat: number, lon: number) => {
  const m = decodeMask();
  const x = Math.min(179, Math.max(0, Math.floor((((lon + 180) % 360) + 360) % 360 / 2)));
  const y = Math.min(89, Math.max(0, Math.floor((90 - lat) / 2)));
  return m[y * 180 + x] === 1;
};

/* ------------------------------------------------------------------ uncompressed PNG data-URI (deterministic, no canvas) */
const CRC_T = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (b: Uint8Array) => {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const toB64 = (b: Uint8Array) => {
  let s = '';
  for (let i = 0; i < b.length; i += 3) {
    const n = (b[i] << 16) | ((b[i + 1] ?? 0) << 8) | (b[i + 2] ?? 0);
    s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < b.length ? B64[(n >> 6) & 63] : '=') + (i + 2 < b.length ? B64[n & 63] : '=');
  }
  return s;
};
/** RGBA8 pixels -> `data:image/png;base64,...` using stored (uncompressed) deflate blocks */
export const pngDataUri = (w: number, h: number, rgba: Uint8Array) => {
  const raw = new Uint8Array(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    raw.set(rgba.subarray(y * w * 4, (y + 1) * w * 4), y * (w * 4 + 1) + 1);
  }
  const blocks = Math.ceil(raw.length / 65535);
  const z = new Uint8Array(2 + raw.length + blocks * 5 + 4);
  let o = 0;
  z[o++] = 0x78;
  z[o++] = 0x01;
  for (let i = 0; i < blocks; i++) {
    const s = i * 65535;
    const len = Math.min(65535, raw.length - s);
    z[o++] = i === blocks - 1 ? 1 : 0;
    z[o++] = len & 255;
    z[o++] = len >> 8;
    z[o++] = ~len & 255;
    z[o++] = (~len >> 8) & 255;
    z.set(raw.subarray(s, s + len), o);
    o += len;
  }
  let a = 1;
  let b = 0;
  for (let i = 0; i < raw.length; i++) {
    a = (a + raw[i]) % 65521;
    b = (b + a) % 65521;
  }
  const ad = ((b << 16) | a) >>> 0;
  z[o++] = ad >>> 24;
  z[o++] = (ad >>> 16) & 255;
  z[o++] = (ad >>> 8) & 255;
  z[o++] = ad & 255;
  const chunk = (type: string, data: Uint8Array) => {
    const c = new Uint8Array(12 + data.length);
    const dv = new DataView(c.buffer);
    dv.setUint32(0, data.length);
    for (let i = 0; i < 4; i++) c[4 + i] = type.charCodeAt(i);
    c.set(data, 8);
    dv.setUint32(8 + data.length, crc32(c.subarray(4, 8 + data.length)));
    return c;
  };
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w);
  dv.setUint32(4, h);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', z), chunk('IEND', new Uint8Array(0))];
  const all = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let q = 0;
  for (const p of parts) {
    all.set(p, q);
    q += p.length;
  }
  return 'data:image/png;base64,' + toB64(all);
};

/* ------------------------------------------------------------------ collage helpers */
export const STEP_FPS = 12;
/** frame snapped to a 12 fps "on twos-and-a-half" grid */
export const stepFrame = (frame: number, fps = STEP_FPS, base = 30) => Math.floor((frame / base) * fps) * (base / fps);
/** slap arrival: 3 steps from 1.38x scale, then rests; returns scale + alpha + dust 0..1 */
export const slap = (frame: number, start: number, stepLen = 2.5) => {
  const k = Math.floor((frame - start) / stepLen);
  if (k < 0) return {scale: 1, alpha: 0, dust: 0, k};
  const scale = k === 0 ? 1.38 : k === 1 ? 1.2 : k === 2 ? 1.07 : 1;
  const dust = k < 2 ? 0 : clamp(1 - (k - 2) / 3);
  return {scale, alpha: 1, dust: k >= 2 ? dust : 0, k};
};
/** resting boil: +-amp px jitter that changes at 6 fps */
export const boil = (frame: number, seed: number, amp = 1.1, fps = 6) => {
  const s = Math.floor((frame / 30) * fps);
  const r = rng(seed * 977 + s * 31);
  return {x: (r() - 0.5) * 2 * amp, y: (r() - 0.5) * 2 * amp, a: (r() - 0.5) * 0.8};
};
/** jittered quad / torn rectangle polygon points */
export const tornRect = (x: number, y: number, w: number, h: number, seed: number, amp = 3, step = 22, sides: 'all' | 'ends' | 'tb' = 'all') => {
  const r = rng(seed);
  const pts: string[] = [];
  const j = (a = amp) => (r() - 0.5) * 2 * a;
  const nx = Math.max(2, Math.round(w / step));
  const ny = Math.max(2, Math.round(h / step));
  const aTB = sides === 'ends' ? amp * 0.4 : amp;
  const aLR = sides === 'tb' ? amp * 0.4 : amp;
  for (let i = 0; i <= nx; i++) pts.push(`${x + (w * i) / nx + j(1)},${y + j(aTB)}`);
  for (let i = 1; i <= ny; i++) pts.push(`${x + w + j(aLR)},${y + (h * i) / ny + j(1)}`);
  for (let i = nx - 1; i >= 0; i--) pts.push(`${x + (w * i) / nx + j(1)},${y + h + j(aTB)}`);
  for (let i = ny - 1; i >= 1; i--) pts.push(`${x + j(aLR)},${y + (h * i) / ny + j(1)}`);
  return pts.join(' ');
};

/** SVG scissors centred on its pivot, pointing along +x. open: 0..1 */
export const Scissors: React.FC<{open: number; size: number; color?: string; handle?: string}> = ({open, size, color = '#e9e6df', handle = '#d2261c'}) => {
  const a = open * 26;
  const blade = (ang: number, f: number) => (
    <g transform={`rotate(${ang})`}>
      <path d={`M${size * 0.02} 0 L${size} 0 L${size * 0.98} ${-size * 0.045 * f} L${size * 0.12} ${-size * 0.085 * f} L${-size * 0.06} ${-size * 0.05 * f} Z`} fill={color} stroke="#16130F" strokeWidth={size * 0.014} strokeLinejoin="round" />
      <path d={`M${size * 0.12} ${-size * 0.04 * f} L${size * 0.92} ${-size * 0.02 * f}`} stroke="#fff" strokeOpacity={0.7} strokeWidth={size * 0.012} />
      <path d={`M${-size * 0.06} ${-size * 0.04 * f} L${-size * 0.2} ${-size * 0.12 * f}`} stroke="#16130F" strokeWidth={size * 0.035} strokeLinecap="round" />
      <ellipse cx={-size * 0.3} cy={-size * 0.17 * f} rx={size * 0.11} ry={size * 0.075} transform={`rotate(${-26 * f} ${-size * 0.3} ${-size * 0.17 * f})`} fill="none" stroke="#16130F" strokeWidth={size * 0.058} />
      <ellipse cx={-size * 0.3} cy={-size * 0.17 * f} rx={size * 0.11} ry={size * 0.075} transform={`rotate(${-26 * f} ${-size * 0.3} ${-size * 0.17 * f})`} fill="none" stroke={handle} strokeWidth={size * 0.04} />
    </g>
  );
  return (
    <g>
      {blade(-a * 0.5, -1)}
      {blade(a * 0.5, 1)}
      <circle r={size * 0.03} fill="#16130F" />
      <circle r={size * 0.012} fill={color} />
    </g>
  );
};

/* ------------------------------------------------------------------ mesh gradient */
export type BlobSpec = {color: string; rx: number; ry: number; angle: number; intensity: number; cx: number; cy: number; period: number; ax: number; ay: number; ph: number};
export const makeBlobs = (colors: string[], count: number, seed: number): BlobSpec[] => {
  const r = rng(seed);
  return Array.from({length: count}, (_, i) => ({
    color: colors[i % colors.length],
    rx: 240 + r() * 320,
    ry: 170 + r() * 210,
    angle: (r() - 0.5) * 90,
    intensity: 0.45 + r() * 0.7,
    cx: 0.12 + r() * 0.76,
    cy: 0.12 + r() * 0.76,
    period: 24 + r() * 16,
    ax: 0.1 + r() * 0.16,
    ay: 0.08 + r() * 0.14,
    ph: r() * Math.PI * 2,
  }));
};
export const MeshBlobs: React.FC<{
  colors: string[];
  base: string;
  count: number;
  speed: number;
  warp: number;
  rippleAt: number;
  grain: number;
  motes: number;
  seed: number;
  intensity?: number;
  frameOffset?: number;
}> = ({colors, base, count, speed, warp, rippleAt, grain, motes, seed, intensity = 1, frameOffset = 0}) => {
  const frame = useCurrentFrame() + frameOffset;
  const {w, h, u} = useStage();
  const t = (frame / 30) * speed;
  const blobs = React.useMemo(() => makeBlobs(colors, count, seed), [colors, count, seed]);
  const rp = rippleAt >= 0 ? (frame - rippleAt) / 30 : -1;
  const moteList = React.useMemo(() => {
    const r = rng(seed + 99);
    return Array.from({length: motes}, () => ({x: r(), y: r(), s: 1 + r() * 2.2, sp: 0.01 + r() * 0.03, ph: r() * 6.28}));
  }, [motes, seed]);
  const gseed = Math.floor(frame / 3) % 50;
  return (
    <div style={{position: 'absolute', inset: 0, background: base, overflow: 'hidden'}}>
      {blobs.map((b, i) => {
        const a = (t / b.period) * Math.PI * 2 + b.ph;
        const breathe = 1 + 0.07 * (warp / 90) * Math.sin(a * 2 + i);
        const px = (b.cx + b.ax * Math.sin(a) + 0.04 * Math.sin(a * 3 + i)) * w;
        const py = (b.cy + b.ay * Math.cos(a * 1.0 + 1.3) + 0.03 * Math.cos(a * 2 + i)) * h;
        const rot = b.angle + (warp / 90) * 14 * Math.sin(a * 1.5 + i * 2);
        const sc = Math.max(w, h) / 1920 * 1.15 + (h > w ? 0.35 : 0);
        const rx = b.rx * sc * breathe;
        const ry = b.ry * sc / breathe;
        // ripple pushes the pool outward + brightens it
        let ox = 0;
        let oy = 0;
        let gain = 1;
        if (rp >= 0) {
          const dx = px - w / 2;
          const dy = py - h / 2;
          const dist = Math.hypot(dx, dy) || 1;
          const ring = Math.exp(-Math.pow((dist - rp * 760 * u) / (170 * u), 2));
          ox = (dx / dist) * 46 * u * ring * Math.exp(-rp * 1.3);
          oy = (dy / dist) * 46 * u * ring * Math.exp(-rp * 1.3);
          gain = 1 + 0.2 * ring * Math.exp(-rp * 1.3);
        }
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: px + ox - rx * 1.4,
              top: py + oy - ry * 1.4,
              width: rx * 2.8,
              height: ry * 2.8,
              borderRadius: '50%',
              background: `radial-gradient(ellipse at center, ${b.color} 0%, ${b.color}00 62%)`,
              opacity: clamp(b.intensity * 0.82 * intensity * gain, 0, 1),
              transform: `rotate(${rot}deg)`,
              mixBlendMode: 'screen',
              filter: `blur(${34 * u}px)`,
            }}
          />
        );
      })}
      {motes > 0 &&
        moteList.map((m, i) => {
          const yy = (((m.y - t * m.sp * 6) % 1) + 1) % 1;
          return <div key={`m${i}`} style={{position: 'absolute', left: (m.x + Math.sin(t * 0.4 + m.ph) * 0.012) * w, top: yy * h, width: m.s * u, height: m.s * u, borderRadius: '50%', background: '#fff', opacity: 0.18 + 0.4 * Math.abs(Math.sin(t * 0.8 + m.ph))}} />;
        })}
      {grain > 0 && (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: grain, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
          <filter id={`meshgrain${gseed}`}>
            <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={gseed} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width={w} height={h} filter={`url(#meshgrain${gseed})`} />
        </svg>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ glass UI blocks (DOM, sized in px already scaled by u) */
const fontSans = 'Inter, "Helvetica Neue", Arial, sans-serif';
export const ChatBubble: React.FC<{text: string; side: 'l' | 'r'; at: number; u: number; accent: string}> = ({text, side, at, u, accent}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + 14, ease.out);
  return (
    <div style={{alignSelf: side === 'r' ? 'flex-end' : 'flex-start', maxWidth: '82%', padding: `${12 * u}px ${18 * u}px`, borderRadius: 22 * u, borderBottomRightRadius: side === 'r' ? 6 * u : 22 * u, borderBottomLeftRadius: side === 'l' ? 6 * u : 22 * u, background: side === 'r' ? accent : 'rgba(255,255,255,.16)', color: '#fff', fontFamily: fontSans, fontWeight: 500, fontSize: 25 * u, lineHeight: 1.3, opacity: p, transform: `translateY(${(1 - p) * 22 * u}px) scale(${0.94 + 0.06 * p})`, boxShadow: side === 'r' ? '0 6px 18px rgba(0,0,0,.18)' : 'none'}}>
      {text}
    </div>
  );
};
export const StreamedReply: React.FC<{text: string; at: number; u: number; wordFrames?: number}> = ({text, at, u, wordFrames = 3}) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  return (
    <div style={{alignSelf: 'flex-start', maxWidth: '90%', color: 'rgba(255,255,255,.94)', fontFamily: fontSans, fontSize: 25 * u, lineHeight: 1.38, fontWeight: 400}}>
      {words.map((wd, i) => {
        const p = prog(frame, at + i * wordFrames, at + i * wordFrames + 9, ease.out);
        return (
          <span key={i} style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 9 * u}px)`, marginRight: 0.28 * 25 * u}}>
            {wd}
          </span>
        );
      })}
    </div>
  );
};
export const VoiceWave: React.FC<{u: number; width: number; at: number; accent: string; bars?: number}> = ({u, width, at, accent, bars = 28}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + 16, ease.out);
  const t = frame / 30;
  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width, height: 120 * u, opacity: p}}>
      {Array.from({length: bars}, (_, i) => {
        const env = Math.sin((i / (bars - 1)) * Math.PI);
        const v = 0.25 + 0.75 * Math.abs(Math.sin(t * 5.2 + i * 0.7) * Math.cos(t * 2.3 + i * 0.31));
        return <div key={i} style={{width: (width / bars) * 0.5, height: Math.max(5 * u, 110 * u * env * v * p), borderRadius: 99, background: 'rgba(255,255,255,.88)', boxShadow: `0 0 ${10 * u}px ${accent}`}} />;
      })}
    </div>
  );
};
export const Orb: React.FC<{u: number; size: number; at: number; c1: string; c2: string}> = ({u, size, at, c1, c2}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + 18, ease.back);
  const pulse = 1 + 0.05 * Math.sin(frame * 0.18);
  return <div style={{width: size, height: size, borderRadius: '50%', transform: `scale(${p * pulse})`, background: `radial-gradient(circle at 35% 30%, #fff 0%, ${c1} 28%, ${c2} 72%, transparent 100%)`, boxShadow: `0 0 ${60 * u}px ${c1}`, filter: `blur(${0.6 * u}px)`}} />;
};
export const Toggle: React.FC<{u: number; on: number; accent: string; label: string}> = ({u, on, accent, label}) => (
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: fontSans, color: '#fff', fontSize: 24 * u, fontWeight: 500}}>
    <span>{label}</span>
    <div style={{width: 74 * u, height: 42 * u, borderRadius: 99, background: on > 0.5 ? accent : 'rgba(255,255,255,.22)', position: 'relative'}}>
      <div style={{position: 'absolute', top: 4 * u, left: (4 + 32 * on) * u, width: 34 * u, height: 34 * u, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.25)'}} />
    </div>
  </div>
);
export const Slider: React.FC<{u: number; value: number; accent: string; label: string}> = ({u, value, accent, label}) => (
  <div style={{fontFamily: fontSans, color: '#fff', fontSize: 24 * u, fontWeight: 500}}>
    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 12 * u}}>
      <span>{label}</span>
      <span style={{opacity: 0.7}}>{Math.round(value * 100)}</span>
    </div>
    <div style={{height: 10 * u, borderRadius: 99, background: 'rgba(255,255,255,.22)', position: 'relative'}}>
      <div style={{width: `${value * 100}%`, height: '100%', borderRadius: 99, background: accent}} />
      <div style={{position: 'absolute', top: -9 * u, left: `calc(${value * 100}% - ${14 * u}px)`, width: 28 * u, height: 28 * u, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.3)'}} />
    </div>
  </div>
);
export const Chip: React.FC<{u: number; text: string; active?: boolean; accent: string; p?: number}> = ({u, text, active, accent, p = 1}) => (
  <span style={{display: 'inline-block', padding: `${8 * u}px ${18 * u}px`, borderRadius: 99, fontFamily: fontSans, fontSize: 21 * u, fontWeight: 600, color: '#fff', background: active ? accent : 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.28)', opacity: p, transform: `scale(${0.85 + 0.15 * p})`}}>
    {text}
  </span>
);

/** unit-ease helper used by several motions */
export const e01 = (frame: number, a: number, b: number, e: (t: number) => number = ease.inOut) => prog(frame, a, b, e);
