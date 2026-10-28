// Adapted from pdoom-video/app/src/scenes/ascent-note.ts (guilloché rosettes, lathe waves, line-relief portrait) (MIT, © 2026 Giacomo Magnanini) — see THIRD_PARTY_NOTICES.md
// Original note design and copy ("Northwind Reserve"); no real currency, issuer or brand is reproduced.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {usePlatePixels} from '../../core/image-kit';
import {E, TREATISE, clamp01, lerpN, noise1, plexMono} from '../../core/r2-music-kit';

type Props = {
  title: string;
  subtitle: string;
  denomination: string;
  serial: string;
  src: string;
  paper: string;
  ink: string;
  accent: string;
  lobes: number;
  curves: number;
  background: string;
};

const f1 = (n: number) => n.toFixed(1);

const GuillocheNote: React.FC<Props> = ({title, subtitle, denomination, serial, src, paper, ink, accent, lobes, curves, background}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const px = usePlatePixels({src: src || undefined, seed: 5}, 240);
  // note geometry (landscape note; in portrait it is turned 90° like a vertical note)
  const aspect = 2.25;
  const NW = portrait ? Math.min(h * 0.86, w * 0.9 * aspect) : Math.min(w * 0.88, h * 0.84 * aspect);
  const NH = NW / aspect;
  const s = NW / 1600; // note units -> px
  const drift = 1 + 0.03 * E.outCubic(clamp01(t / 8));
  const draw = (a: number, b: number) => E.outCubic(clamp01((t - a) / (b - a)));
  const strokeW = Math.max(0.6, 0.9 * s * 1.6);
  // ---- woven border band: phase-shifted sines along the inset rectangle perimeter
  const band = (inset: number, bw: number, k: number, phase: number) => {
    const W0 = 1600 - inset * 2;
    const H0 = 1600 / aspect - inset * 2;
    const per = 2 * (W0 + H0);
    const pts: string[] = [];
    const N = 900;
    for (let i = 0; i <= N; i++) {
      const sl = (i / N) * per;
      let x: number;
      let y: number;
      let nx: number;
      let ny: number;
      if (sl < W0) [x, y, nx, ny] = [inset + sl, inset, 0, 1];
      else if (sl < W0 + H0) [x, y, nx, ny] = [inset + W0, inset + sl - W0, -1, 0];
      else if (sl < 2 * W0 + H0) [x, y, nx, ny] = [inset + W0 - (sl - W0 - H0), inset + H0, 0, -1];
      else [x, y, nx, ny] = [inset, inset + H0 - (sl - 2 * W0 - H0), 1, 0];
      const off = bw / 2 + (bw / 2) * Math.sin((sl / per) * Math.PI * 2 * k + phase);
      pts.push(`${f1(x + nx * off)} ${f1(y + ny * off)}`);
    }
    return 'M' + pts.join(' L');
  };
  // ---- rosette: r = R + a·sin(nθ + φk) family
  const rosette = (cx: number, cy: number, R: number, a: number, n: number, K: number, spin: number) =>
    Array.from({length: K}, (_, k) => {
      const ph = (k / K) * Math.PI * 2 + spin;
      const pts: string[] = [];
      const N = 240;
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * Math.PI * 2;
        const r = R + a * Math.sin(n * th + ph);
        pts.push(`${f1(cx + Math.cos(th) * r)} ${f1(cy + Math.sin(th) * r)}`);
      }
      return 'M' + pts.join(' L') + ' Z';
    });
  const NHu = 1600 / aspect;
  const rosA = rosette(1210, NHu / 2, 190, 34, Math.round(lobes), Math.round(curves), t * 0.08);
  const rosB = rosette(1210, NHu / 2, 118, 18, Math.round(lobes) + 4, Math.round(curves * 0.6), -t * 0.12);
  const rosC = rosette(170, 120, 62, 12, 8, 16, t * 0.1);
  // ---- lathe waves across the field
  const lathe = Array.from({length: 22}, (_, i) => {
    const y0 = 150 + i * 18;
    const pts: string[] = [];
    for (let x = 60; x <= 1540; x += 10) pts.push(`${x} ${f1(y0 + 14 * Math.sin(x * 0.012 + i * 0.35) + 6 * Math.sin(x * 0.031 - i * 0.2))}`);
    return 'M' + pts.join(' L');
  });
  // ---- line-relief portrait oval: horizontal lines displaced by height, thickened by shade
  const ox = 560;
  const oy = NHu / 2 + 10;
  const orx = 210;
  const ory = 250;
  const reliefN = 46;
  const heightAt = (xx: number, yy: number) => {
    // xx,yy in 0..1 inside the oval box
    if (px && src) {
      const ix = Math.min(px.w - 1, Math.max(0, Math.floor(xx * px.w)));
      const iy = Math.min(px.h - 1, Math.max(0, Math.floor(yy * px.h)));
      const i = (iy * px.w + ix) * 4;
      const l = (0.2126 * px.data[i] + 0.7152 * px.data[i + 1] + 0.0722 * px.data[i + 2]) / 255;
      return l;
    }
    // procedural emblem: sun disc over a mountain range
    const sun = Math.max(0, 1 - Math.hypot(xx - 0.62, yy - 0.34) / 0.16);
    const ridge = 0.62 - 0.18 * Math.exp(-Math.pow((xx - 0.38) / 0.18, 2)) - 0.1 * Math.exp(-Math.pow((xx - 0.75) / 0.12, 2)) + 0.03 * noise1(xx * 14, 3);
    const mount = yy > ridge ? 0.45 + 0.35 * (1 - (yy - ridge) * 2) + 0.15 * noise1(xx * 30 + yy * 9, 7) : 0;
    return Math.max(sun, mount, yy < ridge ? 0.12 : 0);
  };
  const relief = Array.from({length: reliefN}, (_, i) => {
    const yy = (i + 0.5) / reliefN;
    const pts: [number, number, number][] = [];
    for (let k = 0; k <= 70; k++) {
      const xx = k / 70;
      const ex = (xx - 0.5) / 0.5;
      const ey = (yy - 0.5) / 0.5;
      if (ex * ex + ey * ey > 1) continue;
      const hgt = heightAt(xx, yy);
      pts.push([ox - orx + xx * orx * 2, oy - ory + yy * ory * 2 - hgt * 9, 0.4 + 2.4 * hgt]);
    }
    return pts;
  });
  const reliefK = draw(1.2, 3.6);
  // ---- typing serial
  const serialShown = serial.slice(0, Math.floor(clamp01((t - 3.2) / 1.2) * serial.length));
  const stamp = E.outBack(clamp01((t - 4.6) / 0.25), 2.4);
  const clear = background === 'transparent';
  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background, alignItems: 'center', justifyContent: 'center'}}>
      <svg
        width={portrait ? NH : NW}
        height={portrait ? NW : NH}
        viewBox={portrait ? `0 0 ${NHu} 1600` : `0 0 1600 ${NHu}`}
        style={{transform: `scale(${drift}) rotate(${-0.6 + 0.6 * draw(0, 6)}deg)`, overflow: 'visible', filter: `drop-shadow(0 ${14 * u}px ${30 * u}px rgba(0,0,0,0.45))`}}
      >
        <g transform={portrait ? `translate(${NHu} 0) rotate(90)` : undefined}>
          <rect width={1600} height={NHu} rx={14} fill={paper} />
          {/* lathe field */}
          <g stroke={ink} strokeWidth={strokeW * 0.7} fill="none" opacity={0.28}>
            {lathe.map((d, i) => (
              <path key={i} d={d} pathLength={1} strokeDasharray={`${draw(0.1 + i * 0.02, 1.6 + i * 0.02)} 1`} />
            ))}
          </g>
          {/* border bands */}
          <g fill="none" stroke={ink} strokeWidth={strokeW * 0.8} opacity={0.75}>
            {[0, 1, 2, 3, 4, 5].map((k) => (
              <path key={k} d={band(26, 34, 120, (k / 6) * Math.PI * 2)} pathLength={1} strokeDasharray={`${draw(0, 2.2)} 1`} />
            ))}
          </g>
          <rect x={22} y={22} width={1556} height={NHu - 44} fill="none" stroke={ink} strokeWidth={strokeW * 1.6} rx={8} />
          <rect x={66} y={66} width={1468} height={NHu - 132} fill="none" stroke={ink} strokeWidth={strokeW} rx={4} />
          {/* rosettes */}
          <g fill="none" stroke={ink} strokeWidth={strokeW * 0.6} opacity={0.85}>
            {rosA.map((d, i) => (
              <path key={'a' + i} d={d} pathLength={1} strokeDasharray={`${draw(0.4 + i * 0.015, 2.4 + i * 0.015)} 1`} />
            ))}
          </g>
          <g fill="none" stroke={accent} strokeWidth={strokeW * 0.6} opacity={0.75}>
            {rosB.map((d, i) => (
              <path key={'b' + i} d={d} pathLength={1} strokeDasharray={`${draw(1 + i * 0.02, 2.8 + i * 0.02)} 1`} />
            ))}
          </g>
          <g fill="none" stroke={ink} strokeWidth={strokeW * 0.5} opacity={0.7}>
            {rosC.map((d, i) => (
              <path key={'c' + i} d={d} pathLength={1} strokeDasharray={`${draw(0.8, 2.2)} 1`} />
            ))}
          </g>
          {/* denomination in the rosette */}
          <text x={1210} y={NHu / 2 + 44} textAnchor="middle" fontFamily={fonts.serif} fontWeight={700} fontSize={128} fill={ink} opacity={draw(1.8, 2.6)}>
            {denomination}
          </text>
          <text x={170} y={142} textAnchor="middle" fontFamily={fonts.serif} fontWeight={700} fontSize={58} fill={ink} opacity={draw(1, 1.8)}>
            {denomination}
          </text>
          <text x={1460} y={NHu - 98} textAnchor="middle" fontFamily={fonts.serif} fontWeight={700} fontSize={58} fill={ink} opacity={draw(1.2, 2)}>
            {denomination}
          </text>
          {/* portrait oval with line relief */}
          <defs>
            <clipPath id="gnoteoval">
              <ellipse cx={ox} cy={oy} rx={orx} ry={ory} />
            </clipPath>
          </defs>
          <ellipse cx={ox} cy={oy} rx={orx + 14} ry={ory + 14} fill="none" stroke={ink} strokeWidth={strokeW * 1.2} />
          <ellipse cx={ox} cy={oy} rx={orx + 5} ry={ory + 5} fill="none" stroke={ink} strokeWidth={strokeW * 0.6} />
          <g clipPath="url(#gnoteoval)">
            {relief.map((pts, i) => {
              if (pts.length < 2) return null;
              const vis = Math.floor(pts.length * clamp01(reliefK * 1.4 - (i / reliefN) * 0.4));
              if (vis < 2) return null;
              const P = pts.slice(0, vis);
              const top = P.map(([x, y, wd]) => `${f1(x)} ${f1(y - wd / 2)}`);
              const bot = P.slice().reverse().map(([x, y, wd]) => `${f1(x)} ${f1(y + wd / 2)}`);
              return <path key={i} d={'M' + [...top, ...bot].join(' L') + ' Z'} fill={ink} opacity={0.9} />;
            })}
          </g>
          {/* lettering */}
          <text x={790} y={128} textAnchor="middle" fontFamily={fonts.serif} fontWeight={700} fontSize={44} letterSpacing={12} fill={ink} opacity={draw(0.6, 1.4)}>
            {title.toUpperCase()}
          </text>
          <text x={800 + 110} y={NHu - 92} textAnchor="middle" fontFamily={fonts.serif} fontSize={30} letterSpacing={9} fill={ink} opacity={draw(1.4, 2.2)}>
            {subtitle.toUpperCase()}
          </text>
          <text x={120} y={NHu - 98} fontFamily={plexMono} fontSize={30} letterSpacing={4} fill={accent}>
            {serialShown}
          </text>
          <text x={1480} y={200} textAnchor="end" fontFamily={plexMono} fontSize={30} letterSpacing={4} fill={accent}>
            {serialShown}
          </text>
          {/* hazard-orange seal */}
          {stamp > 0.01 ? (
            <g transform={`translate(905 ${NHu / 2 + 10}) scale(${stamp}) rotate(-8)`} opacity={0.88}>
              <circle r={70} fill="none" stroke={accent} strokeWidth={6} />
              <circle r={56} fill="none" stroke={accent} strokeWidth={2} />
              {Array.from({length: 24}, (_, i) => {
                const a = (i / 24) * Math.PI * 2;
                return <line key={i} x1={Math.cos(a) * 58} y1={Math.sin(a) * 58} x2={Math.cos(a) * 68} y2={Math.sin(a) * 68} stroke={accent} strokeWidth={2} />;
              })}
              <text y={12} textAnchor="middle" fontFamily={fonts.serif} fontWeight={700} fontSize={34} fill={accent}>
                ✦
              </text>
            </g>
          ) : null}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const guillocheNote = defineMotion<Props>({
  id: 'guilloche-note',
  title: 'Guilloché banknote',
  category: 'music',
  description:
    'A banknote engraves itself on bone paper: lathe-work waves and a woven border band draw on, interlaced guilloché rosettes (r = R + a·sin(nθ + φ)) slowly turn, a portrait oval fills with line-relief engraving (horizontal lines lifted and thickened by the picture), serial numbers type in hazard orange and a seal stamps on.',
  source: ['pdoom-video app/src/scenes/ascent-note.ts + plate fig06 (MIT); original note design and copy'],
  useFor: 'Money / finance / stock videos, certificates, vouchers, premium end cards; pass a `src` image to put any subject in the relief oval.',
  durationInFrames: 210,
  defaultProps: {
    title: 'Northwind Reserve',
    subtitle: 'Payable to the bearer on demand',
    denomination: '100',
    serial: 'NW 482 913 A',
    src: '',
    paper: '#EEE9DF',
    ink: '#2A2622',
    accent: TREATISE.signal,
    lobes: 12,
    curves: 36,
    background: '#121214',
  },
  propDocs: {
    title: 'issuer line across the top',
    subtitle: 'small line along the bottom',
    denomination: 'value printed in the rosette and corners',
    serial: 'serial number (types on in the accent colour)',
    src: 'optional picture for the line-relief oval (public/ path or URL); empty = procedural sun-over-mountains emblem',
    paper: 'note paper colour',
    ink: 'engraving ink',
    accent: 'serial / seal / inner rosette colour',
    lobes: 'rosette lobes (6–18)',
    curves: 'curves per rosette (20–60)',
    background: "colour behind the note or 'transparent'",
  },
  component: GuillocheNote,
  tags: ['banknote', 'money', 'guilloche', 'engraving', 'rosette', 'certificate', 'finance', 'currency', 'voucher', 'line relief', 'security print', 'treatise', 'premium'],
});
