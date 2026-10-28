// Idea after lemo-opuscar styles/microscope (LemoLab, MIT code / CC BY 4.0 docs) — re-implemented, no source code copied.
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {loadFont as loadBarlow} from '@remotion/google-fonts/BarlowCondensed';
import {loadFont as loadPlex} from '@remotion/google-fonts/IBMPlexMono';
import {clamp, ease, lerp, prog, springAt} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {resolveSrc} from '../../core/asset';
import {rng} from '../../core/random';
import {smoothClosed} from '../../core/shapes';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * microscope-dive — one continuous log-space zoom (powers of ten) from a glass slide on a graphite bench down through
 * nested levels of a procedural stained specimen to one nucleus; focus racks in, breathes at every magnification step and
 * sweeps a focal plane on landing; a frosted instrument panel (1-2-5 scale bar, rolling field of view, magnification with a
 * turning turret glyph) and a measurement ring with a reading panel at the end.
 */
type Props = {
  label: string;
  value: number;
  unit: string;
  method: string;
  stain: 'he' | 'trichrome';
  accent: string;
  bench: string;
  seed: number;
  title: string;
  src: string;
  fieldLabel?: string;
};

const PAL = {
  he: {bg: '#F4D2E0', cyto: '#E39BBB', cyto2: '#D98AAE', mem: '#F6D9E5', nuc: '#5D3F98', nucD: '#34226A', nucL: '#7B5FB6', gran: '#C2689A', septa: '#F7DDE8', lob: ['#DD97B8', '#D586AC', '#E3A2C0'], blob: '#D88FB4'},
  trichrome: {bg: '#7F95C9', cyto: '#C9473F', cyto2: '#B53B36', mem: '#E39A93', nuc: '#34274F', nucD: '#1F1735', nucL: '#4F3F75', gran: '#962A28', septa: '#4A77BB', lob: ['#C2423C', '#B93A35', '#CC5048'], blob: '#A9534F'},
};

const hsh = (a: number, b: number, c = 0) => {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const circ = (x: number, y: number, r: number) => `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0`;
const ell = (x: number, y: number, rx: number, ry: number, phi: number) => {
  const c = Math.cos(phi);
  const s = Math.sin(phi);
  const deg = (phi * 180) / Math.PI;
  return `M${(x - c * rx).toFixed(1)} ${(y - s * rx).toFixed(1)}A${rx.toFixed(1)} ${ry.toFixed(1)} ${deg.toFixed(0)} 1 0 ${(x + c * rx).toFixed(1)} ${(y + s * rx).toFixed(1)}A${rx.toFixed(1)} ${ry.toFixed(1)} ${deg.toFixed(0)} 1 0 ${(x - c * rx).toFixed(1)} ${(y - s * rx).toFixed(1)}`;
};
const niceBar = (maxUm: number) => {
  let best = 1;
  for (let e = -1; e < 6; e++) for (const m of [1, 2, 5]) { const v = m * Math.pow(10, e); if (v <= maxUm) best = v; }
  return best;
};
const fmtLen = (um: number) => (um >= 1000 ? `${+(um / 1000).toPrecision(3)} mm` : `${+um.toPrecision(3)} µm`);
const fmtFov = (mm: number) => {
  if (mm >= 1) return `${mm >= 10 ? mm.toFixed(1) : mm.toFixed(2)} mm`;
  const um = mm * 1000;
  return `${um >= 100 ? um.toFixed(0) : um >= 10 ? um.toFixed(1) : um.toFixed(2)} µm`;
};
const unitToUm = (unit: string) => (/^\s*mm\s*$/i.test(unit) ? 1000 : /^\s*nm\s*$/i.test(unit) ? 0.001 : 1);

// ------------------------------------------------------------------ tissue silhouette (mm)
const rho = (th: number, s: number) => 1 + 0.1 * Math.cos(2 * th + s) + 0.07 * Math.cos(3 * th + s * 2.1) + 0.045 * Math.cos(5 * th + s * 3.3) + 0.02 * Math.cos(7 * th + s);
const BX = 6.2;
const BY = 4.2;
const blobPts = (seed: number, k: number): [number, number][] =>
  Array.from({length: 64}, (_, i) => {
    const th = (i / 64) * Math.PI * 2;
    const r = rho(th, seed * 1.7);
    return [Math.cos(th) * BX * r * k, Math.sin(th) * BY * r * k];
  });
const inBlob = (x: number, y: number, seed: number, k = 0.93) => {
  const th = Math.atan2(y / BY, x / BX);
  return Math.hypot(x / BX, y / BY) < rho(th, seed * 1.7) * k;
};

// ------------------------------------------------------------------ nucleus geometry (um, relative to centre)
const nucR = (th: number, Rn: number, seed: number) => Rn * (1 + 0.035 * Math.cos(2 * th + seed) + 0.015 * Math.cos(3 * th + seed * 2) + 0.008 * Math.cos(5 * th + seed * 3));
const nucPath = (Rn: number, seed: number, k: number) => {
  let d = '';
  for (let i = 0; i < 72; i++) {
    const th = (i / 72) * Math.PI * 2;
    const r = nucR(th, Rn, seed) * k;
    d += `${i ? 'L' : 'M'}${(Math.cos(th) * r).toFixed(1)} ${(Math.sin(th) * r).toFixed(1)}`;
  }
  return d + 'Z';
};

type Cell = {x: number; y: number; rx: number; ry: number; phi: number; home: boolean; i: number; j: number};
const cellAt = (i: number, j: number, seed: number, dd: number, Rn: number): Cell => {
  const home = i === 0 && j === 0;
  const jx = home ? 0 : (hsh(i, j, seed * 7 + 1) - 0.5) * 0.34 * dd;
  const jy = home ? 0 : (hsh(i, j, seed * 7 + 2) - 0.5) * 0.34 * dd;
  const k = home ? 1 : 0.58 + 0.22 * hsh(i, j, seed * 7 + 3);
  const el = home ? 1 : 0.88 + 0.24 * hsh(i, j, seed * 7 + 4);
  return {x: (i + 0.5 * (j & 1)) * dd + jx, y: j * dd * 0.866 + jy, rx: Rn * k * Math.sqrt(el), ry: (Rn * k) / Math.sqrt(el), phi: home ? 0 : hsh(i, j, seed * 7 + 5) * Math.PI, home, i, j};
};

const MicroscopeDive: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait, square} = useStage();
  const short = Math.min(w, h);
  const pal = PAL[p.stain] ?? PAL.he;
  const barlow = loadBarlow('normal', {weights: ['300', '500', '600'], subsets: ['latin']}).fontFamily;
  const plex = loadPlex('normal', {weights: ['400', '500'], subsets: ['latin']}).fontFamily;
  const t = frame / fps;
  const useImg = !!p.src;

  // ---- scale model
  const D = clamp(p.value * unitToUm(p.unit), 1, 200); // nucleus diameter, um
  const ds = clamp(D / 8.4, 0.5, 2.5);
  const Rn = D / 2;
  const dd = D * 3.8;
  const FOV0 = square ? 82 : 50;
  const fovEnd = useImg ? 1.4 : D / 0.34 / 1000; // mm, short side at landing
  const fovH1 = 5;
  const fovH2 = 0.19 * ds;
  const A1 = Math.log(FOV0 / fovH1);
  const A2 = Math.log(fovH1 / Math.max(fovH2, fovEnd * 1.5));
  const creepTotal = 0.03 + 0.03 + 0.025;
  const A3 = Math.log(Math.max(fovH2, fovEnd * 1.5) / fovEnd) - 0.06;
  const hold = (a: number, b: number, amt: number) => amt * prog(frame, a, b, ease.sine);
  const L =
    A1 * prog(frame, 18, 72, ease.sine) + A2 * prog(frame, 86, 134, ease.sine) + A3 * prog(frame, 148, 204, ease.sine) +
    hold(0, 26, 0.025) + hold(72, 86, 0.03) + hold(134, 148, 0.03) + 0.06 * prog(frame, 204, 340, ease.sine) - creepTotal * 0;
  const fov = FOV0 * Math.exp(-L); // mm, short side
  const S = short / fov; // px per mm
  const roll = (portrait ? 90 : 0) - 8 + 14 * prog(frame, 18, 204, ease.sine) + 3 * prog(frame, 204, 340, ease.sine);
  const Pt = portrait ? {x: w * 0.5, y: h * 0.4} : square ? {x: w * 0.54, y: h * 0.44} : {x: w * 0.4, y: h * 0.52};
  const ringR = useImg ? 0.17 * short : (Rn / (fov * 1000)) * short;

  // magnification ladder (reference field = FOV0)
  const Mnow = FOV0 / fov;
  const Mend = FOV0 / (fovEnd * Math.exp(-0.05));
  const niceEnd = (() => { let b = 1; for (let e = 0; e < 6; e++) for (const m of [1, 2, 5]) if (m * Math.pow(10, e) <= Mend * 1.02) b = m * Math.pow(10, e); return b; })();
  const steps = useMemo(() => [1, 5, 20, 100, 500, 2000, 10000, 50000].filter((s) => s < niceEnd * 0.95).concat([niceEnd]), [niceEnd]);
  const crossFrames = useMemo(() => {
    // frame at which each step is first reached
    const out: number[] = [];
    for (let k = 1; k < steps.length; k++) {
      let ff = 300;
      for (let f = 0; f < 300; f++) {
        const Lf =
          A1 * prog(f, 18, 72, ease.sine) + A2 * prog(f, 86, 134, ease.sine) + A3 * prog(f, 148, 204, ease.sine) +
          0.025 * prog(f, 0, 26, ease.sine) + 0.03 * prog(f, 72, 86, ease.sine) + 0.03 * prog(f, 134, 148, ease.sine) + 0.06 * prog(f, 204, 340, ease.sine);
        if (Math.exp(Lf) >= steps[k] * 0.95) { ff = f; break; }
      }
      out.push(ff);
    }
    return out;
  }, [steps, A1, A2, A3]);
  let stepIdx = 0;
  for (let k = 1; k < steps.length; k++) if (Mnow >= steps[k] * 0.95) stepIdx = k;
  const mag = steps[stepIdx];
  const lastChange = stepIdx > 0 ? crossFrames[stepIdx - 1] : -99;

  // ---- focus
  const breath = crossFrames.reduce((m, tf) => {
    const d = frame - tf;
    const v = d < -3 ? 0 : d < 0 ? ease.out((d + 3) / 3) : d < 10 ? 1 - ease.out(d / 10) : 0;
    return Math.max(m, v);
  }, 0);
  const rack = 1 - prog(frame, 0, 22, ease.out);
  const soft = prog(frame, 192, 206, ease.out) * (1 - prog(frame, 246, 252, ease.sine));
  const blur = (15 * rack + 4.5 * breath + 6.5 * soft) * u;
  const sweepOn = frame >= 196 && frame < 252;
  const sweepP = prog(frame, 208, 240, ease.sine);

  // ---- level opacities
  const lvl = (hi: number, lo: number) => clamp((Math.log(hi) - Math.log(fov)) / (Math.log(hi) - Math.log(lo)));
  const o1 = lvl(14, 9);
  const o2 = lvl(1.45 * ds, 0.9 * ds);
  const o3 = lvl(0.17 * ds, 0.1 * ds);
  const showL0 = useImg || o1 < 1;
  const showL1 = !useImg && o1 > 0 && o2 < 1;
  const showL2 = !useImg && o2 > 0 && o3 < 1;
  const showL3 = !useImg && o3 > 0;

  const gT = (Sk: number) => `translate(${Pt.x} ${Pt.y}) rotate(${roll}) scale(${S / Sk})`;
  const visRect = (Sk: number, m: number) => {
    const sc = S / Sk;
    const a = (-roll * Math.PI) / 180;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [px, py] of [[-m, -m], [w + m, -m], [-m, h + m], [w + m, h + m]]) {
      const dx = px - Pt.x;
      const dy = py - Pt.y;
      const lx = (dx * ca - dy * sa) / sc;
      const ly = (dx * sa + dy * ca) / sc;
      x0 = Math.min(x0, lx); x1 = Math.max(x1, lx); y0 = Math.min(y0, ly); y1 = Math.max(y1, ly);
    }
    return {x0, y0, x1, y1};
  };

  // ---- static geometry
  const S0 = short / FOV0;
  const S1 = short / 10;
  const slideX = useMemo(() => {
    const a = (((portrait ? 90 : 0) - 8) * Math.PI) / 180;
    const vx = ((w / 2 - Pt.x) * Math.cos(-a) - (h / 2 - Pt.y) * Math.sin(-a)) / S0;
    return vx;
  }, [portrait, w, h, Pt.x, Pt.y, S0]);
  const lobules = useMemo(() => {
    const sp = 0.85;
    const lo: {d: string; c: string; dots: string}[] = [];
    let dots = '';
    const r = rng(p.seed * 31 + 7);
    for (let j = -8; j <= 8; j++)
      for (let i = -9; i <= 9; i++) {
        const home = i === 0 && j === 0;
        const cx = (i + 0.5 * (j & 1)) * sp + (home ? 0 : (hsh(i, j, p.seed) - 0.5) * 0.18);
        const cy = j * sp * 0.866 + (home ? 0 : (hsh(i, j, p.seed + 9) - 0.5) * 0.18);
        if (!inBlob(cx, cy, p.seed, 0.9)) continue;
        const rr = sp * 0.43;
        const pts: [number, number][] = Array.from({length: 9}, (_, k) => {
          const th = (k / 9) * Math.PI * 2;
          const q = rr * (0.88 + 0.24 * hsh(i * 9 + k, j, p.seed + 3));
          return [(cx + Math.cos(th) * q) * S1, (cy + Math.sin(th) * q) * S1];
        });
        lo.push({d: smoothClosed(pts), c: pal.lob[Math.floor(hsh(i, j, p.seed + 5) * 3)], dots: ''});
        for (let k = 0; k < 16; k++) {
          const th = r() * Math.PI * 2;
          const q = Math.sqrt(r()) * rr * 0.85;
          dots += circ((cx + Math.cos(th) * q) * S1, (cy + Math.sin(th) * q) * S1, 1.7);
        }
      }
    return {lo, dots};
  }, [p.seed, p.stain, S1]);
  const specks = useMemo(() => {
    const r = rng(p.seed * 13 + 1);
    let d = '';
    for (let k = 0; k < 420; k++) {
      const x = (r() - 0.5) * 2 * BX;
      const y = (r() - 0.5) * 2 * BY;
      if (inBlob(x, y, p.seed, 0.92)) d += circ(x * S0, y * S0, (0.04 + r() * 0.07) * S0);
    }
    return d;
  }, [p.seed, S0]);
  const nucleusClumps = useMemo(() => {
    const r = rng(p.seed * 17 + 3);
    return Array.from({length: 110}, (_, k) => {
      const th = r() * Math.PI * 2;
      const per = k < 80;
      const f = per ? 0.62 + 0.34 * Math.pow(r(), 0.7) : 0.45 * Math.sqrt(r());
      const rad = nucR(th, Rn, p.seed) * f;
      return {x: Math.cos(th) * rad, y: Math.sin(th) * rad, r: Rn * (0.035 + 0.07 * r()), light: k >= 92};
    });
  }, [p.seed, Rn]);

  // ================================================================ layers
  const bgLayer = (
    <>
      <rect x={-80 * u} y={-80 * u} width={w + 160 * u} height={h + 160 * u} fill="url(#md-bench)" />
    </>
  );

  const slideLayer = showL0 && (
    <g transform={gT(S0)} opacity={useImg ? 1 : 1}>
      {/* slide shadow */}
      {[0, 1, 2, 3, 4].map((k) => (
        <rect key={k} x={(slideX - 38 - 0.5 - k * 0.4 + 1) * S0} y={(-13 - 0.5 - k * 0.4 + 1.4) * S0} width={(76 + 1 + k * 0.8) * S0} height={(26 + 1 + k * 0.8) * S0} rx={1.2 * S0} fill="#000" opacity={0.12} />
      ))}
      <rect x={(slideX - 38) * S0} y={-13 * S0} width={76 * S0} height={26 * S0} rx={0.7 * S0} fill="#F4F1EC" />
      <rect x={(slideX - 38) * S0} y={-13 * S0} width={76 * S0} height={26 * S0} rx={0.7 * S0} fill="none" stroke="#BFD9D2" strokeWidth={0.3 * S0} opacity={0.8} />
      <rect x={(slideX + 20) * S0} y={-12.4 * S0} width={17.4 * S0} height={24.8 * S0} fill="#E8E2D6" />
      {[0, 1, 2].map((k) => (
        <line key={k} x1={(slideX + 22) * S0} x2={(slideX + 35.4) * S0} y1={(4 + k * 3) * S0} y2={(4 + k * 3) * S0} stroke="#181B1F" strokeWidth={0.12 * S0} opacity={0.3} />
      ))}
      {p.title && (
        <g opacity={prog(frame, 6, 36, ease.out)}>
          <clipPath id="md-tclip">
            <rect x={(slideX + 20) * S0} y={-13 * S0} width={17.4 * S0 * prog(frame, 6, 36, ease.sine)} height={26 * S0} />
          </clipPath>
          <text x={(slideX + 28.7) * S0} y={-3 * S0} textAnchor="middle" fontFamily={fonts.serif} fontWeight={700} fontSize={Math.min(3.4, 15 / Math.max(4, p.title.length) * 1.6) * S0} fill="#181B1F" clipPath="url(#md-tclip)">
            {p.title}
          </text>
        </g>
      )}
      {/* cover slip */}
      <rect x={-11 * S0} y={-11 * S0} width={22 * S0} height={22 * S0} rx={0.5 * S0} fill="#fff" opacity={0.1} stroke="#fff" strokeOpacity={0.7} strokeWidth={0.14 * S0} />
      {/* specimen */}
      <clipPath id="md-blob">
        <path d={smoothClosed(blobPts(p.seed, 1).map(([x, y]) => [x * S0, y * S0] as [number, number]))} />
      </clipPath>
      {useImg ? (
        <image href={resolveSrc(p.src)} x={-7 * S0} y={-7 * S0} width={14 * S0} height={14 * S0} preserveAspectRatio="xMidYMid slice" clipPath="url(#md-blob)" />
      ) : (
        <g>
          <path d={smoothClosed(blobPts(p.seed, 1).map(([x, y]) => [x * S0, y * S0] as [number, number]))} fill="url(#md-blobfill)" stroke={pal.cyto2} strokeWidth={0.1 * S0} />
          <path d={specks} fill={pal.nuc} opacity={0.3} clipPath="url(#md-blob)" />
        </g>
      )}
    </g>
  );

  const lobLayer = showL1 && (
    <g opacity={o1} transform={gT(S1)}>
      <path d={smoothClosed(blobPts(p.seed, 1).map(([x, y]) => [x * S1, y * S1] as [number, number]))} fill={pal.septa} stroke={pal.cyto2} strokeWidth={1.2} />
      {lobules.lo.map((l, i) => (
        <path key={i} d={l.d} fill={l.c} />
      ))}
      <path d={lobules.dots} fill={pal.nuc} opacity={0.55} />
    </g>
  );

  // cell fields
  const S2 = short / 0.6;
  const S3 = short / 0.1;
  const cellField = (Sk: number, detail: boolean) => {
    const v = visRect(Sk, 60 * u);
    const k = Sk / 1000; // px per um
    const i0 = Math.floor(v.x0 / k / dd) - 1;
    const i1 = Math.ceil(v.x1 / k / dd) + 1;
    const j0 = Math.floor(v.y0 / k / (dd * 0.866)) - 1;
    const j1 = Math.ceil(v.y1 / k / (dd * 0.866)) + 1;
    let cy1 = '';
    let cy2 = '';
    let nuc = '';
    let nucIn = '';
    let gran = '';
    let halo = '';
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        const c = cellAt(i, j, p.seed, dd, Rn);
        const cx = c.x * k;
        const cy = c.y * k;
        const r = dd * 0.57 * k * (0.94 + 0.12 * hsh(i, j, p.seed + 11));
        if (hsh(i, j, p.seed + 12) < 0.5) cy1 += circ(cx, cy, r); else cy2 += circ(cx, cy, r);
        if (c.home && detail) continue;
        halo += ell(cx, cy, c.rx * k * 1.7, c.ry * k * 1.7, c.phi);
        nuc += ell(cx, cy, c.rx * k, c.ry * k, c.phi);
        nucIn += ell(cx, cy, c.rx * k * 0.62, c.ry * k * 0.62, c.phi);
        if (detail) {
          for (let g = 0; g < 9; g++) {
            const th = hsh(i, j, g * 3 + 20) * Math.PI * 2;
            const q = (0.2 + 0.3 * hsh(i, j, g * 3 + 21)) * dd;
            const gx = c.x + Math.cos(th) * q;
            const gy = c.y + Math.sin(th) * q;
            if (Math.hypot(gx - c.x, gy - c.y) < c.rx * 1.25) continue;
            gran += circ(gx * k, gy * k, dd * (0.016 + 0.02 * hsh(i, j, g + 40)) * k);
          }
        }
      }
    return (
      <>
        <rect x={v.x0} y={v.y0} width={v.x1 - v.x0} height={v.y1 - v.y0} fill={pal.bg} />
        <path d={cy1} fill={pal.cyto} />
        <path d={cy2} fill={pal.cyto2} />
        <path d={halo} fill={pal.gran} opacity={0.2} />
        <rect x={v.x0} y={v.y0} width={v.x1 - v.x0} height={v.y1 - v.y0} fill={pal.nucD} filter={`url(#md-cyto-${detail ? 3 : 2})`} opacity={detail ? 0.26 : 0.16} />
        {detail && <path d={gran} fill={pal.gran} opacity={0.55} />}
        <path d={nuc} fill={pal.nuc} stroke={pal.nucD} strokeWidth={Math.max(1, 0.18 * k)} />
        <path d={nucIn} fill={pal.nucL} opacity={0.4} />
        {detail && (
          <g transform={`scale(${k})`}>
            <path d={nucPath(Rn, p.seed, 1)} fill="url(#md-nuc)" stroke={pal.nucD} strokeWidth={0.28} />
            <clipPath id={`md-nclip-${Math.round(Sk)}`}>
              <path d={nucPath(Rn, p.seed, 0.98)} />
            </clipPath>
            <g clipPath={`url(#md-nclip-${Math.round(Sk)})`}>
              <rect x={-Rn * 1.2} y={-Rn * 1.2} width={Rn * 2.4} height={Rn * 2.4} fill={pal.nucD} filter="url(#md-chro)" opacity={0.9} transform="scale(1)" />
              {nucleusClumps.map((c, i) => (
                <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={c.light ? pal.nucL : pal.nucD} opacity={c.light ? 0.28 : 0.7} />
              ))}
              <circle cx={Rn * 0.18} cy={-Rn * 0.12} r={Rn * 0.24} fill={pal.nucL} opacity={0.3} />
              <circle cx={Rn * 0.18} cy={-Rn * 0.12} r={Rn * 0.15} fill={pal.nucD} />
            </g>
            <path d={nucPath(Rn, p.seed, 0.93)} fill="none" stroke={pal.nucL} strokeWidth={0.12} opacity={0.5} />
          </g>
        )}
      </>
    );
  };
  const L2layer = showL2 && <g opacity={o2} transform={gT(S2)}>{cellField(S2, false)}</g>;
  const L3layer = showL3 && <g opacity={o3} transform={gT(S3)}>{cellField(S3, true)}</g>;

  const sceneInner = (
    <>
      {bgLayer}
      {slideLayer}
      {lobLayer}
      {L2layer}
      {L3layer}
    </>
  );

  // lighting overlays
  const poolX = w * (0.5 + 0.14 * Math.sin(t * 0.6));
  const poolY = h * (0.45 + 0.08 * Math.cos(t * 0.5 + 1));
  const poolOp = 0.9 * (1 - prog(frame, 40, 100, ease.sine));
  const vig = 0.15 + 0.45 * prog(frame, 40, 200, ease.sine);
  const defs = (
    <defs>
      <linearGradient id="md-bench" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={p.bench} />
        <stop offset="1" stopColor="#2A3036" />
      </linearGradient>
      <radialGradient id="md-blobfill" cx="45%" cy="40%" r="65%">
        <stop offset="0" stopColor="#E3A8C4" />
        <stop offset="1" stopColor={pal.blob} />
      </radialGradient>
      <radialGradient id="md-nuc" cx="45%" cy="40%" r="62%">
        <stop offset="0" stopColor={pal.nucL} />
        <stop offset="0.7" stopColor={pal.nuc} />
        <stop offset="1" stopColor={pal.nucD} />
      </radialGradient>
      <filter id="md-chro" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={3} seed={p.seed} result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.12 0 0 0 0 0.08 0 0 0 0 0.28 3.4 0 0 0 -1.5" />
      </filter>
      {[2, 3].map((n) => (
        <filter key={n} id={`md-cyto-${n}`} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency={1.6 / (dd * (n === 2 ? S2 : S3) / 1000)} numOctaves={3} seed={p.seed + n} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.2 0 0 0 0 0.05 0 0 0 0 0.3 0 0 0 -2.6 1.5" />
        </filter>
      ))}
      <radialGradient id="md-pool">
        <stop offset="0" stopColor="#fff" stopOpacity={0.22} />
        <stop offset="1" stopColor="#fff" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="md-vig" cx="50%" cy="50%" r="75%">
        <stop offset="0.5" stopColor="#0A0B0E" stopOpacity={0} />
        <stop offset="1" stopColor="#0A0B0E" stopOpacity={1} />
      </radialGradient>
    </defs>
  );
  const scene = (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      {defs}
      {sceneInner}
      <ellipse cx={poolX} cy={poolY} rx={w * 0.5} ry={h * 0.6} fill="url(#md-pool)" opacity={poolOp} />
      <rect x={0} y={0} width={w} height={h} fill="url(#md-vig)" opacity={vig} />
    </svg>
  );

  // ---- instrument panel
  const panelW = (portrait ? 440 : 410) * u;
  const barMax = 200 * u;
  const fovUm = fov * 1000;
  const barUm = niceBar((barMax / short) * fovUm);
  const barPx = (barUm / fovUm) * short;
  const turn = crossFrames.reduce((a, tf) => a + 90 * ease.back(prog(frame, tf, tf + 12, ease.linear)), 0);
  const flash = lastChange >= 0 ? Math.sin(Math.PI * clamp((frame - lastChange) / 26)) : 0;
  const glass: React.CSSProperties = {
    position: 'absolute',
    background: 'rgba(12,14,17,0.74)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `${1 * u}px solid rgba(255,255,255,0.14)`,
    borderRadius: 14 * u,
    color: '#F4F1EC',
  };
  const instIn = prog(frame, 4, 22, ease.out);
  const instrument = (
    <div style={{...glass, left: 40 * u, top: 40 * u, width: panelW, padding: `${18 * u}px ${22 * u}px`, opacity: instIn, transform: `translateY(${(1 - instIn) * -10 * u}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18 * u}}>
        <svg width={64 * u} height={64 * u} viewBox="-32 -32 64 64" style={{flex: 'none'}}>
          <g transform={`rotate(${turn})`}>
            <circle r={22} fill="none" stroke="rgba(244,241,236,0.55)" strokeWidth={2} />
            {[0, 90, 180, 270].map((a, i) => (
              <rect key={a} x={-5} y={-30} width={10} height={i === 0 ? 14 : 10} rx={3} fill={i === 0 ? p.accent : 'rgba(244,241,236,0.7)'} transform={`rotate(${a})`} />
            ))}
          </g>
        </svg>
        <div style={{fontFamily: barlow, fontWeight: 500, fontSize: 64 * u, lineHeight: 1, letterSpacing: 1 * u, transform: `scale(${1 + 0.12 * (1 - ease.out(clamp((frame - lastChange) / 10)))})`, transformOrigin: 'left center'}}>
          {mag}×
        </div>
        <div style={{marginLeft: 'auto', textAlign: 'right', fontFamily: plex, fontSize: 22 * u, lineHeight: 1.25}}>
          <div style={{opacity: 0.6, fontSize: 20 * u}}>{p.fieldLabel}</div>
          <div style={{fontWeight: 500}}>{fmtFov(fov)}</div>
        </div>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 14 * u, marginTop: 16 * u}}>
        <div style={{width: barMax, height: 18 * u, position: 'relative', flex: 'none'}}>
          <div style={{position: 'absolute', left: 0, bottom: 0, width: barPx, height: 3 * u, background: '#F4F1EC'}} />
          <div style={{position: 'absolute', left: 0, bottom: 0, width: 3 * u, height: 16 * u, background: '#F4F1EC'}} />
          <div style={{position: 'absolute', left: barPx - 3 * u, bottom: 0, width: 3 * u, height: 16 * u, background: '#F4F1EC'}} />
        </div>
        <div style={{fontFamily: barlow, fontWeight: 500, fontSize: 34 * u, lineHeight: 1}}>{fmtLen(barUm)}</div>
      </div>
    </div>
  );
  const flashEl = lastChange >= 0 && frame < lastChange + 26 && frame > 20 && (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: (portrait ? 140 : 80) * u, display: 'flex', justifyContent: 'center', opacity: Math.min(1, 1.6 * flash)}}>
      <div style={{...glass, position: 'relative', padding: `${6 * u}px ${44 * u}px`, borderRadius: 22 * u, fontFamily: barlow, fontWeight: 500, fontSize: 130 * u, lineHeight: 1.1, letterSpacing: 2 * u, transform: `scale(${0.92 + 0.08 * ease.out(clamp((frame - lastChange) / 8))})`}}>
        {mag}×
      </div>
    </div>
  );

  // ---- measurement ring + reading
  const ringP = prog(frame, 216, 240, ease.out);
  const tickP = prog(frame, 236, 246, ease.out);
  const leadP = prog(frame, 240, 258, ease.sine);
  const panelP = prog(frame, 246, 262, ease.out);
  const sideLayout = !portrait && !square;
  const ang = sideLayout ? (-35 * Math.PI) / 180 : portrait ? (55 * Math.PI) / 180 : (40 * Math.PI) / 180;
  const P0 = {x: Pt.x + Math.cos(ang) * ringR, y: Pt.y + Math.sin(ang) * ringR};
  const E = {x: P0.x + (sideLayout ? 90 : 60) * u, y: P0.y + (sideLayout ? -90 : 60) * u};
  const rPanelW = (sideLayout ? 620 : portrait ? 920 : 920) * u;
  const rPanelH = (portrait ? 330 : 290) * u;
  const rPanelL = sideLayout ? w - 80 * u - rPanelW : (w - rPanelW) / 2;
  const rPanelT = sideLayout ? E.y - 40 * u : portrait ? Pt.y + ringR + 210 * u : Math.min(h - 70 * u - rPanelH, Pt.y + ringR + 80 * u);
  const A = sideLayout ? {x: rPanelL, y: E.y} : {x: E.x, y: rPanelT};
  const lead = [P0, E, A];
  const l1 = Math.hypot(E.x - P0.x, E.y - P0.y);
  const l2 = Math.hypot(A.x - E.x, A.y - E.y);
  const lt = leadP * (l1 + l2);
  const pt = (n: number) => {
    if (n <= l1) return {x: lerp(P0.x, E.x, n / l1), y: lerp(P0.y, E.y, n / l1)};
    const q = clamp((n - l1) / l2);
    return {x: lerp(E.x, A.x, q), y: lerp(E.y, A.y, q)};
  };
  const leadEnd = pt(lt);
  const leadPts = lt <= l1 ? [P0, leadEnd] : [P0, E, leadEnd];
  const decimals = (String(p.value).split('.')[1] || '').length;
  const shown = p.value * ease.out(prog(frame, 250, 274, ease.linear));
  const sp = springAt(frame, fps, 274, 'pop');
  const bump = frame >= 274 ? 1 + 0.07 * 4 * sp * (1 - sp) : 1;
  const a0 = -Math.PI / 2;
  const arcEnd = a0 + Math.PI * 2 * Math.min(0.9999, ringP);
  const ringD = `M${Pt.x + Math.cos(a0) * ringR} ${Pt.y + Math.sin(a0) * ringR}A${ringR} ${ringR} 0 ${ringP > 0.5 ? 1 : 0} 1 ${Pt.x + Math.cos(arcEnd) * ringR} ${Pt.y + Math.sin(arcEnd) * ringR}`;
  const overlay = (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
      {ringP > 0 && (
        <g fill="none" strokeLinecap="round">
          <path d={ringD} stroke="rgba(0,0,0,0.4)" strokeWidth={7 * u} />
          <path d={ringD} stroke={p.accent} strokeWidth={3 * u} />
          {[0, 90, 180, 270].map((a) => {
            const r = (a * Math.PI) / 180;
            const r0 = ringR - 4 * u;
            const r1 = ringR + 18 * u * tickP;
            const x0 = Pt.x + Math.cos(r) * r0;
            const y0 = Pt.y + Math.sin(r) * r0;
            const x1 = Pt.x + Math.cos(r) * r1;
            const y1 = Pt.y + Math.sin(r) * r1;
            return tickP > 0 ? (
              <g key={a}>
                <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="rgba(0,0,0,0.4)" strokeWidth={6 * u} />
                <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={p.accent} strokeWidth={2.6 * u} />
              </g>
            ) : null;
          })}
        </g>
      )}
      {leadP > 0 && (
        <g fill="none" strokeLinejoin="round">
          <polyline points={leadPts.map((q) => `${q.x},${q.y}`).join(' ')} stroke="rgba(0,0,0,0.4)" strokeWidth={5 * u} />
          <polyline points={leadPts.map((q) => `${q.x},${q.y}`).join(' ')} stroke={p.accent} strokeWidth={2.4 * u} />
        </g>
      )}
    </svg>
  );
  const reading = (
    <div style={{...glass, left: rPanelL, top: rPanelT, width: rPanelW, height: rPanelH, padding: `${22 * u}px ${30 * u}px`, opacity: panelP, transform: `translateY(${(1 - panelP) * 14 * u}px)`, boxSizing: 'border-box'}}>
      <div style={{fontFamily: barlow, fontWeight: 500, fontSize: 28 * u, letterSpacing: 3 * u, textTransform: 'uppercase', opacity: 0.85}}>{p.label}</div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 14 * u, color: p.accent, fontFamily: barlow, fontWeight: 300, transform: `scale(${bump})`, transformOrigin: 'left bottom', marginTop: 4 * u}}>
        <span style={{fontSize: (portrait ? 170 : 150) * u, lineHeight: 1.0, fontVariantNumeric: 'tabular-nums'}}>{shown.toFixed(decimals)}</span>
        <span style={{fontSize: 60 * u}}>{p.unit}</span>
      </div>
      <div style={{fontFamily: plex, fontSize: 22 * u, opacity: 0.8 * prog(frame, 270, 284, ease.out), marginTop: 6 * u}}>{p.method}</div>
    </div>
  );

  // ---- compose with focus
  const sweepAng = 12;
  const front = lerp(-0.25, 1.25, sweepP);
  const maskImg = `linear-gradient(${90 + sweepAng}deg, #000 ${(front * 100 - 0).toFixed(1)}%, rgba(0,0,0,0) ${(front * 100 + 0.1).toFixed(1)}%)`;
  const maskBand = `linear-gradient(${90 + sweepAng}deg, rgba(0,0,0,0) ${((front - 0.34) * 100).toFixed(1)}%, #000 ${((front - 0.26) * 100).toFixed(1)}%, #000 ${((front - 0.02) * 100).toFixed(1)}%, rgba(0,0,0,0) ${((front + 0.03) * 100).toFixed(1)}%)`;
  void maskBand;
  const blurStyle: React.CSSProperties = blur > 0.2 ? {filter: `blur(${blur}px)`} : {};
  return (
    <AbsoluteFill style={{background: '#0B0D0F', overflow: 'hidden'}}>
      <AbsoluteFill style={{...blurStyle, transform: 'scale(1.0)'}}>{scene}</AbsoluteFill>
      {sweepOn && (
        <AbsoluteFill style={{WebkitMaskImage: maskImg, maskImage: maskImg}}>{scene}</AbsoluteFill>
      )}
      {overlay}
      {instrument}
      {flashEl}
      {reading}
    </AbsoluteFill>
  );
};

export const microscopeDive = defineMotion<Props>({
  id: 'microscope-dive',
  title: 'Microscope dive',
  category: 'data',
  description:
    'One continuous powers-of-ten zoom from a glass slide on a graphite bench through a procedural stained tissue section and cell field to a single nucleus; focus racks in, breathes at each magnification step and sweeps a focal plane on landing; frosted instrument panel (1-2-5 scale bar, rolling field of view, magnification and turning turret glyph) and a measurement ring with leader to a reading panel.',
  source: ['lemo-opuscar styles/microscope (LemoLab, MIT code / CC BY 4.0 docs) — idea only, re-implemented'],
  useFor: 'Scale reveals from object to cell, "one measured number" beats, science / medical / materials explainers, powers-of-ten transitions.',
  durationInFrames: 300,
  defaultProps: {
    label: 'Nucleus diameter',
    value: 8.4,
    unit: 'µm',
    method: 'least-squares circle · 72 rays',
    stain: 'he',
    accent: 'rgb(120,240,205)',
    bench: '#0B0D0F',
    seed: 4,
    title: '',
    src: '',
    fieldLabel: 'FIELD',
  },
  propDocs: {
    label: 'small label above the reading',
    value: 'the measured number (also sets the nucleus size, and so the final field of view)',
    unit: "unit of the reading ('µm', 'nm' or 'mm')",
    method: 'mono method line under the reading',
    stain: "'he' (pink / purple) or 'trichrome' (red / blue)",
    accent: 'measurement ring and reading colour',
    bench: 'bench colour at the dark end of the graphite gradient',
    seed: 'seed for the procedural specimen',
    title: 'optional small title written on the slide label at the start',
    src: 'optional public/ image used as the specimen (zoom range is shortened so it stays sharp; give value/unit that match the circled region)',
    fieldLabel: 'small label above the field-of-view readout',
  },
  component: MicroscopeDive,
  tags: ['microscope', 'zoom', 'powers of ten', 'scale', 'cell', 'nucleus', 'slide', 'histology', 'science', 'measurement', 'scale bar', 'instrument', 'focus', 'data', 'biology', 'lab'],
});
