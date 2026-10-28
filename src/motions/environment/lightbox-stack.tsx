// Adapted from lemo-opuscar/styles/paper-lantern/demo/src/paper.js (sheet/paperMat/finish), stage.js, art.js, shots/s01_night.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {P, clamp, hash, hexRgb, pd, seg, spline, ss, xiangyun} from '../../core/r2-lb1-kit';

/**
 * Paper-cut lightbox (纸雕灯) as a 2.5D SVG stack: 8 parallel cut-paper sheets lit from behind — bright translucent
 * back layers to near-black opaque front ones (the value ladder IS the depth) — a warm moon with halo, auspicious
 * clouds, carved mountain ranges, a village whose windows switch on one by one, a river with a broken moon trail,
 * dark reeds and hanging flickering lanterns. Every sheet casts a soft shadow onto the one behind; the lamp "turns
 * on" back-to-front; the camera creeps in with lateral parallax.
 */

type Props = {
  ladder: 'night' | 'desert' | 'winter' | 'violet';
  light: {x: number; y: number; color: string; radius: number};
  moon: boolean;
  windows: number;
  lanternCount: number;
  lampOnAt: number;
  lampOnStagger: number;
  windowsAt: number;
  dolly: number;
  drift: number;
  stars: number;
  seed: number;
  background: string;
};

const LADDERS: Record<string, {sky: [string, string, string, string]; tones: string[]; lightCol: string; window: string; lantern: string}> = {
  night: {sky: ['#0A1330', '#172A58', '#2E4478', '#43598A'], tones: ['#C3CBE8', '#6A86C2', '#3F5A92', '#5A70A6', '#22325E', '#17224A', '#0E1532'], lightCol: '#FFF0CF', window: '#FFB862', lantern: '#FF8A48'},
  desert: {sky: ['#1E0E08', '#6A3020', '#C07850', '#F0C890'], tones: ['#F0C890', '#D09060', '#A05838', '#7A4028', '#4A2014', '#331309', '#1E0E08'], lightCol: '#FFD080', window: '#FFD080', lantern: '#FFB050'},
  winter: {sky: ['#101820', '#2A3A4E', '#4A6078', '#9AAEC4'], tones: ['#DFE6EE', '#9AAEC4', '#6A8098', '#4A6078', '#2E4052', '#1C2A38', '#101820'], lightCol: '#FFF4DC', window: '#FFD9A0', lantern: '#E8503A'},
  violet: {sky: ['#14102E', '#221C4A', '#2A2456', '#3A3570'], tones: ['#C8C0EC', '#8A7EC8', '#5A4F9A', '#453C80', '#2E2760', '#201A48', '#140F34'], lightCol: '#F6E6C8', window: '#E8CC90', lantern: '#FF9A58'},
};

const LightboxStack: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = 'lightbox-stack';
  const t = frame / 30;
  const L = LADDERS[p.ladder] ?? LADDERS.night;
  const lx = p.light.x * w;
  const ly = p.light.y * h;
  const lightCol = p.light.color || L.lightCol;
  // lamp-on: moon first, then layers back→front, then windows
  const moonOn = ss(seg(frame, p.lampOnAt, p.lampOnAt + 48));
  const litOf = (layer: number) => ss(seg(frame, p.lampOnAt + 18 + layer * p.lampOnStagger, p.lampOnAt + 18 + layer * p.lampOnStagger + 18));
  // camera: slow dolly in + lateral drift; parallax per depth
  const dolly = 1 + p.dolly * ss(seg(t, 0.4, 7.5));
  const camX = Math.sin(t * 0.21) * p.drift * u + t * p.drift * 0.25 * u;
  const par = (depth: number) => camX * (1.6 - depth * 1.6); // far small, near big
  const [lr, lg, lb] = hexRgb(lightCol);
  // procedural ridges
  const ridge = (seed: number, base: number, amp: number, peaks: number): P[] => {
    const pts: P[] = [[-w * 0.1, h * 1.2]];
    for (let i = 0; i <= peaks * 4; i++) {
      const x = (-0.1 + (1.2 * i) / (peaks * 4)) * w;
      const k = i / (peaks * 4);
      const y = h * base - (hash(i, seed, 1) * 0.55 + 0.45 * Math.abs(Math.sin(k * peaks * Math.PI + seed))) * amp * h;
      pts.push([x, y]);
    }
    pts.push([w * 1.1, h * 1.2]);
    return spline(pts, false, 6);
  };
  const far = React.useMemo(() => ridge(p.seed + 1, portrait ? 0.52 : 0.55, 0.16, 3), [w, h, p.seed, portrait]);
  const mid = React.useMemo(() => ridge(p.seed + 5, portrait ? 0.62 : 0.66, 0.12, 4), [w, h, p.seed, portrait]);
  // village: houses on the mid ridge
  const houses = React.useMemo(() => {
    const out: {x: number; y: number; s: number; win: P[]}[] = [];
    const n = 6;
    for (let i = 0; i < n; i++) {
      const x = w * (0.18 + (0.64 * i) / (n - 1) + (hash(i, p.seed, 3) - 0.5) * 0.06);
      const y = h * (portrait ? 0.66 : 0.7) + (hash(i, p.seed, 4) - 0.5) * 0.04 * h;
      const s = (60 + hash(i, p.seed, 5) * 40) * u * (portrait ? 0.9 : 1);
      const win: P[] = [];
      const nw = 1 + Math.floor(hash(i, p.seed, 6) * 2.5);
      for (let k = 0; k < nw; k++) win.push([x - s * 0.3 + k * s * 0.32, y - s * 0.28]);
      out.push({x, y, s, win});
    }
    return out;
  }, [w, h, u, p.seed, portrait]);
  const allWindows = houses.flatMap((hh, hi) => hh.win.map((q) => ({q, hi}))).slice(0, Math.max(0, p.windows));
  // lanterns (foreground, hanging from the top)
  const lanterns = Array.from({length: p.lanternCount}, (_, i) => {
    const x = w * (0.1 + 0.8 * hash(i, p.seed, 8));
    const len = h * (0.1 + 0.2 * hash(i, p.seed, 9));
    return {x, len, phase: hash(i, p.seed, 10) * 6};
  });
  const flick = (ph: number) => 1 + 0.06 * Math.sin(7.3 * t + ph) * Math.sin(3.1 * t + ph * 2);
  const waterY = h * (portrait ? 0.74 : 0.78);
  const glow = (depth: number, lit: number, trans: number, key: string) =>
    lit > 0 ? <rect key={key} x={-w * 0.1} y={-h * 0.1} width={w * 1.2} height={h * 1.2} fill={`url(#${id}-bl)`} opacity={trans * lit} style={{mixBlendMode: 'screen'}} /> : null;
  const shadowF = `url(#${id}-sh)`;
  return (
    <AbsoluteFill style={{background: p.background === 'auto' ? L.sky[0] : p.background, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={L.sky[0]} />
            <stop offset="0.45" stopColor={L.sky[1]} />
            <stop offset="0.75" stopColor={L.sky[2]} />
            <stop offset="1" stopColor={L.sky[3]} />
          </linearGradient>
          <radialGradient id={`${id}-bl`} cx={lx} cy={ly} r={p.light.radius * Math.min(w, h)} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={lightCol} stopOpacity={0.9} />
            <stop offset="0.5" stopColor={lightCol} stopOpacity={0.35} />
            <stop offset="1" stopColor={lightCol} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={`${id}-halo`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.52" stopColor={lightCol} stopOpacity={0.55} />
            <stop offset="0.75" stopColor={lightCol} stopOpacity={0.14} />
            <stop offset="1" stopColor={lightCol} stopOpacity={0} />
          </radialGradient>
          <filter id={`${id}-sh`} x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx={0} dy={8 * u} stdDeviation={8 * u} floodColor="#000" floodOpacity={0.4} />
          </filter>
          <filter id={`${id}-pulp`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={0.012 / u} numOctaves={3} seed={p.seed} result="n" />
            <feColorMatrix in="n" type="matrix" values={`0 0 0 0 ${lr / 255}  0 0 0 0 ${lg / 255}  0 0 0 0 ${lb / 255}  0.4 0 0 0 0`} />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          <filter id={`${id}-wg`}>
            <feGaussianBlur stdDeviation={5 * u} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform={`translate(${w / 2} ${h / 2}) scale(${dolly}) translate(${-w / 2} ${-h / 2})`}>
          {/* L0 sky sheet */}
          <g transform={`translate(${par(0)} 0)`}>
            <rect x={-w * 0.1} y={-h * 0.1} width={w * 1.2} height={h * 1.2} fill={`url(#${id}-sky)`} />
            <rect x={-w * 0.1} y={-h * 0.1} width={w * 1.2} height={h * 1.2} fill={`url(#${id}-sky)`} filter={`url(#${id}-pulp)`} opacity={0.5} />
            {Array.from({length: p.stars}, (_, i) => (
              <circle
                key={i}
                cx={hash(i, p.seed, 11) * w}
                cy={hash(i, p.seed, 12) * h * 0.55}
                r={(0.8 + hash(i, p.seed, 13) * 1.6) * u}
                fill="#EFF2FF"
                opacity={(0.35 + 0.65 * hash(i, p.seed, 14)) * (0.55 + 0.45 * Math.sin(t * 1.3 + i * 2.1)) * (0.4 + 0.6 * moonOn)}
              />
            ))}
            {p.moon && (
              <g>
                <circle cx={lx} cy={ly} r={Math.min(w, h) * 0.3} fill={`url(#${id}-halo)`} opacity={moonOn} />
                <circle cx={lx} cy={ly} r={Math.min(w, h) * 0.145} fill="#FFFAF0" opacity={0.25 + 0.75 * moonOn} />
                <circle cx={lx - Math.min(w, h) * 0.03} cy={ly - Math.min(w, h) * 0.02} r={Math.min(w, h) * 0.135} fill={lightCol} opacity={(0.25 + 0.75 * moonOn) * 0.8} />
              </g>
            )}
          </g>
          {/* L1 clouds */}
          <g transform={`translate(${par(0.12)} 0)`} filter={shadowF} opacity={0.92}>
            {[0, 1, 2].map((i) => {
              const cl = xiangyun(w * (0.14 + 0.38 * i) + Math.sin(t * 0.3 + i) * 12 * u, h * (0.16 + 0.1 * (i % 2)), (34 + 10 * (i % 2)) * u, i % 2 === 1);
              return (
                <g key={i}>
                  <path d={cl.body} fill={L.tones[0]} fillRule="evenodd" />
                  <path d={cl.spir} fill="none" stroke={L.sky[1]} strokeWidth={2.4 * u} opacity={0.8} />
                </g>
              );
            })}
            {glow(0.12, litOf(1) * moonOn, 0.9, 'g1')}
          </g>
          {/* L2 far mountains */}
          <g transform={`translate(${par(0.25)} 0)`} filter={shadowF}>
            <path d={pd(far)} fill={L.tones[1]} />
            {/* carved contour slits */}
            {far.filter((_, i) => i % 24 === 8).map((q, i) => (
              <path key={i} d={`M${q[0] - 30 * u} ${q[1] + 36 * u}q${30 * u} ${-14 * u} ${60 * u} 0`} fill="none" stroke={L.sky[1]} strokeWidth={3 * u} opacity={0.5} />
            ))}
            {glow(0.25, litOf(2) * moonOn, 0.7, 'g2')}
          </g>
          {/* L3 mid mountains */}
          <g transform={`translate(${par(0.4)} 0)`} filter={shadowF}>
            <path d={pd(mid)} fill={L.tones[2]} />
            {glow(0.4, litOf(3) * moonOn, 0.45, 'g3')}
          </g>
          {/* L4 village */}
          <g transform={`translate(${par(0.55)} 0)`} filter={shadowF}>
            <rect x={-w * 0.1} y={h * (portrait ? 0.66 : 0.7)} width={w * 1.2} height={h * 0.12} fill={L.tones[3]} />
            {houses.map((hh, i) => (
              <g key={i}>
                <rect x={hh.x - hh.s / 2} y={hh.y - hh.s * 0.52} width={hh.s} height={hh.s * 0.52} fill={L.tones[3]} />
                <path d={pd([[hh.x - hh.s * 0.62, hh.y - hh.s * 0.5], [hh.x, hh.y - hh.s * 0.88], [hh.x + hh.s * 0.62, hh.y - hh.s * 0.5]])} fill={L.tones[4]} />
              </g>
            ))}
            {allWindows.map(({q, hi}, i) => {
              const k = ss(seg(frame, p.windowsAt + i * 10, p.windowsAt + i * 10 + 18)) * flick(i * 1.7);
              return k > 0.01 ? <rect key={i} x={q[0]} y={q[1]} width={14 * u} height={18 * u} rx={2 * u} fill={L.window} opacity={clamp(k)} filter={`url(#${id}-wg)`} /> : null;
            })}
            {glow(0.55, litOf(4) * moonOn, 0.25, 'g4')}
          </g>
          {/* L5 river with moon trail */}
          <g transform={`translate(${par(0.68)} 0)`}>
            <rect x={-w * 0.1} y={waterY} width={w * 1.2} height={h * 0.3} fill={L.tones[4]} />
            {p.moon &&
              Array.from({length: 9}, (_, i) => {
                const yy = waterY + 14 * u + i * 16 * u;
                const wdt = (90 - i * 7) * u * (0.7 + 0.3 * Math.sin(t * 2.1 + i));
                return <rect key={i} x={lx - wdt / 2 + Math.sin(t * 1.4 + i * 2) * 8 * u} y={yy} width={wdt} height={4.5 * u} rx={2 * u} fill="#E9CF96" opacity={0.75 * moonOn * (1 - i / 11)} />;
              })}
            {glow(0.68, litOf(5) * moonOn, 0.3, 'g5')}
          </g>
          {/* L6 foreground bank, tree + reeds */}
          <g transform={`translate(${par(0.86)} 0)`} filter={shadowF}>
            <path d={pd(spline([[-w * 0.1, h * 0.98], [w * 0.1, h * 0.9], [w * 0.32, h * 0.93], [w * 0.5, h * 0.88], [w * 0.74, h * 0.94], [w * 1.1, h * 0.9], [w * 1.1, h * 1.2], [-w * 0.1, h * 1.2]], false, 6))} fill={L.tones[5]} />
            <g>
              {/* tree */}
              <path d={`M${w * 0.1} ${h * 0.93} C ${w * 0.1} ${h * 0.7} ${w * 0.08} ${h * 0.62} ${w * 0.055} ${h * 0.5} M${w * 0.093} ${h * 0.74} C ${w * 0.13} ${h * 0.66} ${w * 0.15} ${h * 0.62} ${w * 0.17} ${h * 0.56} M${w * 0.085} ${h * 0.62} C ${w * 0.06} ${h * 0.56} ${w * 0.045} ${h * 0.54} ${w * 0.02} ${h * 0.5}`} fill="none" stroke={L.tones[6]} strokeWidth={14 * u} strokeLinecap="round" />
              {/* reeds */}
              {Array.from({length: 12}, (_, i) => {
                const x = w * (0.62 + 0.36 * hash(i, p.seed, 15));
                const hh2 = (60 + hash(i, p.seed, 16) * 70) * u;
                const sway = Math.sin(t * 1.1 + i) * 6 * u;
                return <path key={i} d={`M${x} ${h * 0.96} q${sway * 0.4} ${-hh2 * 0.6} ${sway} ${-hh2}`} fill="none" stroke={L.tones[6]} strokeWidth={3.4 * u} strokeLinecap="round" />;
              })}
            </g>
          </g>
          {/* L7 hanging lanterns (nearest, slightly blurred) */}
          <g style={{filter: `blur(${2.5 * u}px)`}}>
            {lanterns.map((ln, i) => {
              const sw = Math.sin(t * 0.9 + ln.phase) * 0.05;
              const fl = flick(ln.phase);
              const lampOn = ss(seg(frame, p.lampOnAt + 40 + i * 8, p.lampOnAt + 58 + i * 8));
              const r = 34 * u;
              return (
                <g key={i} transform={`translate(${ln.x} 0) rotate(${(sw * 180) / Math.PI}) translate(0 ${ln.len})`}>
                  <line x1={0} y1={-ln.len} x2={0} y2={-r * 1.3} stroke="#0D1328" strokeWidth={2.5 * u} />
                  <ellipse rx={r} ry={r * 1.15} fill="#0D1328" />
                  <ellipse rx={r * 0.82} ry={r} fill={L.lantern} opacity={0.92 * lampOn * fl} filter={`url(#${id}-wg)`} />
                  <rect x={-r * 0.4} y={-r * 1.45} width={r * 0.8} height={r * 0.3} fill="#0D1328" />
                  <rect x={-r * 0.4} y={r * 1.15} width={r * 0.8} height={r * 0.3} fill="#0D1328" />
                </g>
              );
            })}
          </g>
        </g>
        {/* vignette */}
        <rect width={w} height={h} fill={`url(#${id}-vig)`} />
        <defs>
          <radialGradient id={`${id}-vig`} cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.45} />
          </radialGradient>
        </defs>
      </svg>
    </AbsoluteFill>
  );
};

export const lightboxStack = defineMotion<Props>({
  id: 'lightbox-stack',
  title: 'Paper-cut lightbox (纸雕灯)',
  category: 'environment',
  description:
    'A glowing paper-cut lamp scene in eight stacked sheets: starry pulp sky, a moon with halo, auspicious clouds with carved spirals, two mountain ranges, a village whose warm windows switch on one by one, a river with a broken moon trail, a dark tree and reeds, and blurred hanging lanterns that flicker — each sheet casting a soft shadow on the one behind while the lamp turns on back-to-front and the camera creeps in.',
  source: ['lemo-opuscar styles/paper-lantern (MIT code, CC BY 4.0 docs, LemoLab) — demo/src/paper.js, stage.js, art.js, shots/s01_night.js'],
  useFor: 'Festival greetings (Mid-Autumn, Diwali, holidays), gift and brand stories, cosy website hero backgrounds (reduced-motion still = lamp fully on).',
  durationInFrames: 240,
  defaultProps: {
    ladder: 'night',
    light: {x: 0.64, y: 0.3, color: '', radius: 0.85},
    moon: true,
    windows: 8,
    lanternCount: 3,
    lampOnAt: 10,
    lampOnStagger: 13,
    windowsAt: 90,
    dolly: 0.08,
    drift: 10,
    stars: 60,
    seed: 7,
    background: 'auto',
  },
  propDocs: {
    ladder: 'paper value ladder: "night" (indigo), "desert", "winter" or "violet" (far city)',
    light: 'backlight point {x, y (0..1), color ("" = ladder default), radius}',
    moon: 'moon + halo + river trail',
    windows: 'how many village windows switch on',
    lanternCount: 'hanging foreground lanterns',
    lampOnAt: 'frame the lamp starts turning on (moon first)',
    lampOnStagger: 'frames between each sheet lighting, back to front',
    windowsAt: 'frame the first window switches on',
    dolly: 'slow dolly-in amount',
    drift: 'lateral parallax drift in u',
    stars: 'star count',
    seed: 'scene seed (ridges, houses, reeds)',
    background: '"auto" (ladder sky) or any colour',
  },
  component: LightboxStack,
  tags: ['paper cut', 'lightbox', 'lantern', 'mid-autumn', 'festival', 'night', 'moon', 'village', 'parallax', 'backlit', 'diorama', 'hero background', 'cosy', 'chinese'],
});
