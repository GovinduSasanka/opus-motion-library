import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {smoothClosed} from '../../core/shapes';
import {BP, GlowDot, IconKind, LineIcon, RadialPlan, ScanlineBg, typed} from '../../core/hud-kit';
import {PaperTexture, Svg, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Annotation callouts, four looks:
 *  leader    (video17 callout-leader-labels): dot pops (0.1 s), a 1 px leader draws out at 30-45 deg
 *            to a horizontal shelf (0.2 s easeOutCubic), a mono caps label types at 25 ch/s plus a
 *            grey sub-label; stagger 0.35 s. Default subject: a glossy studio sphere.
 *  room      (video9 room-label-callout): crosshair (4 corner brackets + circle-plus), T-rule
 *            (vertical 6 f, horizontal 5 f), orange "ROOM 0N", two stencil title lines rising from
 *            masks (6 f, 3 f stagger), mono metrics line. Default subject: a line-art interior.
 *  tag       (video23 object-callout-tag): translucent dark box + hollow anchor circle + diagonal
 *            leader, riding with objects that scroll past (depth descent). Default: underwater scene.
 *  medallion (video19 medallion-pop / video6 callout-inset-lens): circular vignettes pop from a
 *            small preview dot (scale 0 -> 1.08 -> 1, easeOutBack) or pie-wipe from 12 o'clock with
 *            tangent leaders, linked to anchors on a blueprint plan, tracked caps captions.
 */
type Item = {x: number; y: number; label: string; sublabel?: string; ex?: number; ey?: number; icon?: IconKind};
type Props = {
  variant: 'leader' | 'room' | 'tag' | 'medallion';
  items: Item[];
  src: string;
  stagger: number;
  medallionReveal: 'pop' | 'pie';
  accent: string;
  ink: string;
};

const easeCubicOut = (t: number) => 1 - Math.pow(1 - t, 3);

/* ---------------- leader callout ---------------- */
const LeaderCallout: React.FC<{ax: number; ay: number; ex: number; ey: number; label: string; sub?: string; start: number; ink: string; grey: string; u: number; frame: number; out: number}> = ({ax, ay, ex, ey, label, sub, start, ink, grey, u, frame, out}) => {
  const f = frame - start;
  if (f < 0) return null;
  const dot = ease.back(clamp(f / 3));
  const ln = easeCubicOut(clamp((f - 3) / 6));
  const side = ex >= 0 ? 1 : -1;
  const shelf = 46 * u;
  const bx = ax + ex;
  const by = ay + ey;
  const seg1 = Math.hypot(ex, ey);
  const total = seg1 + shelf;
  const drawn = ln * total;
  const p1 = Math.min(1, drawn / seg1);
  const p2 = clamp((drawn - seg1) / shelf);
  const fs = 19 * u;
  const tx = bx + side * (shelf + 10 * u);
  const lab = typed(label, frame, start + 8, 25);
  const sb = sub ? typed(sub, frame, start + 8 + (label.length / 25) * 30 * 0.6, 30) : '';
  return (
    <g opacity={1 - out}>
      <circle cx={ax} cy={ay} r={7 * u * dot} fill="#FFFFFF" stroke={ink} strokeWidth={1.6 * u} />
      <circle cx={ax} cy={ay} r={2.6 * u * dot} fill={ink} />
      <path d={`M${ax} ${ay} L${ax + ex * p1} ${ay + ey * p1}${p2 > 0 ? ` L${bx + side * shelf * p2} ${by}` : ''}`} fill="none" stroke={ink} strokeWidth={1.3 * u} />
      <text x={tx} y={by + fs * 0.35} textAnchor={side > 0 ? 'start' : 'end'} fill={ink} fontFamily={fonts.mono} fontWeight={700} fontSize={fs} letterSpacing={fs * 0.15}>
        {lab}
      </text>
      {sb && (
        <text x={tx} y={by + fs * 1.55} textAnchor={side > 0 ? 'start' : 'end'} fill={grey} fontFamily={fonts.mono} fontSize={12.5 * u} letterSpacing={12.5 * u * 0.18}>
          {sb}
        </text>
      )}
    </g>
  );
};

/* ---------------- subjects ---------------- */
const SphereSubject: React.FC<{cx: number; cy: number; R: number; u: number; w: number; h: number}> = ({cx, cy, R, u, w, h}) => {
  const vpY = h * 0.18;
  const horizon = cy - R * 0.35;
  return (
    <g>
      <defs>
        <radialGradient id="cl-bg" cx="45%" cy="40%" r="75%">
          <stop offset="0%" stopColor="#FBF3E6" />
          <stop offset="70%" stopColor="#E7E0D2" />
          <stop offset="100%" stopColor="#C2BDB1" />
        </radialGradient>
        <radialGradient id="cl-sph" cx="36%" cy="30%" r="78%" fx="32%" fy="26%">
          <stop offset="0%" stopColor="#FF6E52" />
          <stop offset="32%" stopColor="#ED3821" />
          <stop offset="68%" stopColor="#A9200F" />
          <stop offset="100%" stopColor="#5D100A" />
        </radialGradient>
        <radialGradient id="cl-refl" cx="78%" cy="86%" r="40%">
          <stop offset="0%" stopColor="#FF7A5C" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#FF7A5C" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="cl-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F6EFE3" stopOpacity={1} />
          <stop offset={`${(horizon / (horizon + R * 0.9)) * 100}%`} stopColor="#F1EADD" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#F1EADD" stopOpacity={0} />
        </linearGradient>
        <filter id="cl-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={22 * u} />
        </filter>
        <filter id="cl-blur2" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={5 * u} />
        </filter>
      </defs>
      <rect width={w} height={h} fill="url(#cl-bg)" />
      <g stroke="#CFC8BA" strokeWidth={1 * u} opacity={0.55}>
        {Array.from({length: 23}, (_, i) => {
          const x = w / 2 + (i - 11) * w * 0.12;
          return <line key={i} x1={w / 2 + (x - w / 2) * 0.12} y1={horizon} x2={x} y2={h} />;
        })}
        {Array.from({length: 9}, (_, i) => {
          const y = horizon + (h - horizon) * Math.pow((i + 1) / 9, 1.8);
          return <line key={`h${i}`} x1={0} y1={y} x2={w} y2={y} />;
        })}
      </g>
      <rect x={0} y={0} width={w} height={horizon + R * 0.9} fill="url(#cl-fade)" />
      <ellipse cx={cx + R * 0.55} cy={cy + R * 0.95} rx={R * 1.25} ry={R * 0.32} fill="#000" opacity={0.28} filter="url(#cl-blur)" />
      <ellipse cx={cx + R * 0.1} cy={cy + R * 0.97} rx={R * 0.62} ry={R * 0.1} fill="#000" opacity={0.35} filter="url(#cl-blur2)" />
      <circle cx={cx} cy={cy} r={R} fill="url(#cl-sph)" />
      <circle cx={cx} cy={cy} r={R} fill="url(#cl-refl)" />
      <rect x={cx - R * 0.5} y={cy - R * 0.62} width={R * 0.3} height={R * 0.22} rx={R * 0.08} fill="#FFFFFF" opacity={0.85} transform={`rotate(-35,${cx - R * 0.35},${cy - R * 0.5})`} filter="url(#cl-blur2)" />
      <path d={`M${cx + R * 0.55} ${cy - R * 0.62} A${R * 0.85} ${R * 0.85} 0 0 1 ${cx + R * 0.82} ${cy - R * 0.05}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={3 * u} strokeLinecap="round" />
    </g>
  );
};

const RoomSubject: React.FC<{w: number; h: number; u: number; frame: number; accent: string; ink: string}> = ({w, h, u, frame, accent, ink}) => {
  const k = 1 + 0.03 * prog(frame, 0, 240, ease.sine);
  const bx0 = w * 0.3;
  const bx1 = w * 0.74;
  const by0 = h * 0.3;
  const by1 = h * 0.7;
  const sw = 1.8 * u;
  const L = (x1: number, y1: number, x2: number, y2: number, o = 1, key?: string) => <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ink} strokeWidth={sw} strokeOpacity={o} strokeLinecap="round" />;
  const floorLines = Array.from({length: 9}, (_, i) => {
    const t = (i + 1) / 10;
    return L(bx0 + (bx1 - bx0) * t, by1, (bx0 + (bx1 - bx0) * t - w / 2) * 3 + w / 2, h * 1.6, 0.25, `f${i}`);
  });
  return (
    <g transform={`translate(${w / 2},${h / 2}) scale(${k}) translate(${-w / 2},${-h / 2})`}>
      <rect width={w} height={h} fill="#ECE9E0" />
      {/* room box */}
      <rect x={bx0} y={by0} width={bx1 - bx0} height={by1 - by0} fill="#F2EFE6" stroke={ink} strokeWidth={sw * 1.4} />
      {L(bx0, by0, -w * 0.1, -h * 0.25)}
      {L(bx1, by0, w * 1.1, -h * 0.25)}
      {L(bx0, by1, -w * 0.1, h * 1.25)}
      {L(bx1, by1, w * 1.1, h * 1.25)}
      {floorLines}
      {/* clerestory + window */}
      <rect x={bx0 + (bx1 - bx0) * 0.08} y={by0 + (by1 - by0) * 0.08} width={(bx1 - bx0) * 0.84} height={(by1 - by0) * 0.1} fill="none" stroke={ink} strokeWidth={sw} />
      {Array.from({length: 6}, (_, i) => L(bx0 + (bx1 - bx0) * (0.08 + (0.84 * (i + 1)) / 7), by0 + (by1 - by0) * 0.08, bx0 + (bx1 - bx0) * (0.08 + (0.84 * (i + 1)) / 7), by0 + (by1 - by0) * 0.18, 0.8, `c${i}`))}
      <rect x={bx0 + (bx1 - bx0) * 0.56} y={by0 + (by1 - by0) * 0.3} width={(bx1 - bx0) * 0.36} height={(by1 - by0) * 0.55} fill="#E4E7E2" stroke={ink} strokeWidth={sw} />
      {L(bx0 + (bx1 - bx0) * 0.74, by0 + (by1 - by0) * 0.3, bx0 + (bx1 - bx0) * 0.74, by0 + (by1 - by0) * 0.85, 0.8)}
      {/* fireplace wall */}
      <rect x={bx0 + (bx1 - bx0) * 0.1} y={by0 + (by1 - by0) * 0.26} width={(bx1 - bx0) * 0.36} height={(by1 - by0) * 0.74} fill="#2A2829" fillOpacity={0.08} stroke={ink} strokeWidth={sw} />
      <rect x={bx0 + (bx1 - bx0) * 0.17} y={by0 + (by1 - by0) * 0.62} width={(bx1 - bx0) * 0.22} height={(by1 - by0) * 0.12} fill={accent} fillOpacity={0.25 + 0.08 * Math.sin(frame * 0.4)} stroke={ink} strokeWidth={sw} />
      {/* sofa (in front) */}
      <path d={`M${w * 0.2} ${h * 0.86} L${w * 0.2} ${h * 0.74} L${w * 0.64} ${h * 0.74} L${w * 0.64} ${h * 0.86}`} fill="#F2EFE6" stroke={ink} strokeWidth={sw * 1.2} />
      {L(w * 0.2, h * 0.8, w * 0.64, h * 0.8, 0.8)}
      {[0.31, 0.42, 0.53].map((x, i) => L(w * x, h * 0.74, w * x, h * 0.8, 0.6, `s${i}`))}
      {/* arc lamp */}
      <path d={`M${w * 0.72} ${h * 0.88} Q${w * 0.72} ${h * 0.42} ${w * 0.58} ${h * 0.48}`} fill="none" stroke={ink} strokeWidth={sw} />
      <path d={`M${w * 0.55} ${h * 0.5} A${w * 0.03} ${w * 0.03} 0 0 1 ${w * 0.61} ${h * 0.5} Z`} fill={ink} fillOpacity={0.15} stroke={ink} strokeWidth={sw} />
      {/* plant */}
      {Array.from({length: 7}, (_, i) => {
        const a = -Math.PI / 2 + (i - 3) * 0.32;
        return <ellipse key={i} cx={w * 0.14 + Math.cos(a) * w * 0.04} cy={h * 0.62 + Math.sin(a) * w * 0.04} rx={w * 0.012} ry={w * 0.03} transform={`rotate(${(a * 180) / Math.PI + 90},${w * 0.14 + Math.cos(a) * w * 0.04},${h * 0.62 + Math.sin(a) * w * 0.04})`} fill="none" stroke={ink} strokeWidth={sw * 0.8} />;
      })}
      <path d={`M${w * 0.12} ${h * 0.66} L${w * 0.16} ${h * 0.66} L${w * 0.155} ${h * 0.74} L${w * 0.125} ${h * 0.74} Z`} fill="none" stroke={ink} strokeWidth={sw} />
      {/* orange construction lines */}
      <line x1={bx0} y1={by1} x2={bx1} y2={by0} stroke={accent} strokeWidth={1.2 * u} strokeDasharray={`${6 * u} ${6 * u}`} strokeOpacity={0.7} />
      <line x1={0} y1={by0 - 30 * u} x2={w} y2={by0 - 30 * u} stroke={accent} strokeWidth={u} strokeOpacity={0.35} />
    </g>
  );
};

const whalePath = (cx: number, cy: number, s: number) =>
  smoothClosed(
    [
      [-1.0, 0.0],
      [-0.75, -0.2],
      [-0.2, -0.28],
      [0.4, -0.2],
      [0.75, -0.08],
      [1.0, -0.28],
      [1.12, -0.32],
      [1.0, 0.0],
      [1.12, 0.3],
      [0.95, 0.2],
      [0.7, 0.1],
      [0.2, 0.22],
      [-0.4, 0.26],
      [-0.85, 0.15],
    ].map(([x, y]) => [cx + x * s, cy + y * s] as [number, number]),
  );

/* ---------------- main ---------------- */
const CalloutLabels: React.FC<Props> = ({variant, items, src, stagger, medallionReveal, accent, ink}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait, durationInFrames: D} = useStage();
  const S = Math.min(w, h);
  const out = prog(frame, D - 10, D - 2, ease.in);

  if (variant === 'room') {
    const list: Item[] = items.length
      ? items
      : [
          {x: portrait ? 0.14 : 0.3, y: portrait ? 0.18 : 0.13, label: 'THE/LIVING ROOM', sublabel: '12.00 × 9.00 M · 108 M² · CEILING 4.50 · OPEN FILE +'},
          {x: portrait ? 0.14 : 0.52, y: portrait ? 0.76 : 0.62, label: 'KITCHEN &/DINING', sublabel: '8.40 × 6.20 M · 52 M² · NORTH LIGHT'},
        ];
    const per = (D - 20) / list.length;
    return (
      <AbsoluteFill style={{background: '#ECE9E0'}}>
        {src ? <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : null}
        <Svg>
          {!src && <RoomSubject w={w} h={h} u={u} frame={frame} accent={accent} ink={ink} />}
          {list.map((it, i) => {
            const st = 8 + i * per;
            const f = frame - st;
            if (f < 0) return null;
            const ex = prog(frame, st + per - 14, st + per - 8);
            const o = i === list.length - 1 ? 1 - out : 1 - ex;
            if (o <= 0) return null;
            const ax = it.x * w;
            const ay = it.y * h;
            const cr = prog(frame, st, st + 4, ease.out);
            const sc = 1.15 - 0.15 * cr;
            const vx = ax + 70 * u;
            const vy0 = ay - 34 * u;
            const vH = 150 * u * prog(frame, st + 4, st + 10, ease.out);
            const hW = 240 * u * prog(frame, st + 6, st + 11, ease.out);
            const lines = it.label.split('/');
            const fsT = 34 * u;
            const metrics = it.sublabel ?? '';
            return (
              <g key={i} opacity={o}>
                <g transform={`translate(${ax},${ay}) scale(${sc})`} opacity={0.4 + 0.6 * clamp(f / 4)}>
                  {[
                    [-1, -1],
                    [1, -1],
                    [-1, 1],
                    [1, 1],
                  ].map(([sx, sy], k) => (
                    <path key={k} d={`M${sx * 26 * u} ${sy * 10 * u} L${sx * 26 * u} ${sy * 26 * u} L${sx * 10 * u} ${sy * 26 * u}`} fill="none" stroke={ink} strokeWidth={1.8 * u} />
                  ))}
                  <circle r={12 * u} fill="none" stroke={ink} strokeWidth={1.6 * u} />
                  <path d={`M${-7 * u} 0H${7 * u}M0 ${-7 * u}V${7 * u}`} stroke={ink} strokeWidth={1.6 * u} />
                </g>
                <line x1={vx} y1={vy0} x2={vx} y2={vy0 + vH} stroke={ink} strokeWidth={1.4 * u} />
                <line x1={vx - 26 * u} y1={vy0 + 22 * u} x2={vx - 26 * u + hW} y2={vy0 + 22 * u} stroke={ink} strokeWidth={1.4 * u} />
                <text x={vx + 14 * u} y={vy0 + 14 * u} fill={accent} opacity={0.85 * prog(frame, st + 10, st + 14)} fontFamily={fonts.mono} fontSize={13 * u} letterSpacing={13 * u * 0.22}>
                  {`ROOM ${String(i + 2).padStart(2, '0')}`}
                </text>
                <defs>
                  {lines.map((_, k) => (
                    <clipPath key={k} id={`cl-room${i}-${k}`}>
                      <rect x={vx + 10 * u} y={vy0 + 32 * u + k * fsT * 1.1} width={w} height={fsT * 1.12} />
                    </clipPath>
                  ))}
                </defs>
                {lines.map((ln, k) => {
                  const p = prog(frame, st + 10 + k * 3, st + 16 + k * 3, ease.out);
                  return (
                    <g key={k} clipPath={`url(#cl-room${i}-${k})`}>
                      <text x={vx + 14 * u} y={vy0 + 32 * u + k * fsT * 1.1 + fsT * 0.92 + (1 - p) * fsT * 1.1} fill={ink} fontFamily={fonts.display} fontSize={fsT} letterSpacing={fsT * 0.02}>
                        {ln.trim().toUpperCase()}
                      </text>
                    </g>
                  );
                })}
                <text x={vx + 14 * u} y={vy0 + 32 * u + lines.length * fsT * 1.1 + 26 * u} fill={ink} fillOpacity={0.6 * prog(frame, st + 20, st + 25)} fontFamily={fonts.mono} fontSize={12 * u} letterSpacing={12 * u * (0.3 - 0.1 * prog(frame, st + 20, st + 28))}>
                  {metrics}
                </text>
              </g>
            );
          })}
        </Svg>
        <PaperTexture opacity={0.3} />
      </AbsoluteFill>
    );
  }

  if (variant === 'tag') {
    // world scrolls up past objects (depth descent); tags ride with them
    const speed = (h * 1.9) / D;
    const scroll = frame * speed;
    const objs = items.length
      ? items.map((it, i) => ({wx: it.x * w, wy: it.y * h, label: it.label, kind: i % 3}))
      : [
          {wx: w * (portrait ? 0.42 : 0.36), wy: h * 0.62, label: '28 m · Humpback whale', kind: 0},
          {wx: w * (portrait ? 0.6 : 0.64), wy: h * 1.25, label: '140 m · Moon jelly', kind: 1},
          {wx: w * (portrait ? 0.38 : 0.42), wy: h * 1.95, label: '320 m · Bathysphere', kind: 2},
        ];
    const depthAt = (y: number) => Math.round(10 + (y + scroll) / (h / 90));
    const snow = rng(23);
    const flakes = Array.from({length: 90}, () => ({x: snow() * w, y: snow() * h * 3, r: (0.8 + snow() * 2) * u, o: 0.2 + snow() * 0.5}));
    const tint = clamp(scroll / (h * 2.2));
    return (
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${lerpHex('#3E9DB3', '#03405E', tint)} 0%, ${lerpHex('#066F8F', '#011C33', tint)} 100%)`}}>
        {src ? <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9}} /> : null}
        <Svg>
          {!src &&
            Array.from({length: 6}, (_, i) => {
              const x = w * (0.1 + i * 0.17) + Math.sin(frame * 0.02 + i) * 30 * u;
              return <polygon key={i} points={`${x - 30 * u},0 ${x + 30 * u},0 ${x + 160 * u},${h} ${x + 60 * u},${h}`} fill="#BFF3FF" opacity={0.05 * (1 - tint)} />;
            })}
          {flakes.map((f, i) => {
            const y = (((f.y - scroll * 0.6) % (h * 1.1)) + h * 1.1) % (h * 1.1);
            return <circle key={i} cx={f.x + Math.sin(frame * 0.03 + i) * 6 * u} cy={y} r={f.r} fill="#E6F6FA" opacity={f.o} />;
          })}
          {/* depth ruler */}
          <g>
            <line x1={w - 70 * u} y1={0} x2={w - 70 * u} y2={h} stroke="#DFF2F7" strokeOpacity={0.35} strokeWidth={u} />
            {Array.from({length: 14}, (_, k) => {
              const step = h / 9;
              const y = ((k * step - (scroll % step)) + step) % (h + step) - step / 2;
              const d = depthAt(y);
              return (
                <g key={k}>
                  <line x1={w - 78 * u} y1={y} x2={w - 62 * u} y2={y} stroke="#DFF2F7" strokeOpacity={0.6} strokeWidth={u} />
                  <text x={w - 88 * u} y={y + 5 * u} textAnchor="end" fill="#DFF2F7" fillOpacity={0.7} fontFamily={fonts.mono} fontSize={14 * u}>
                    {`${d} m`}
                  </text>
                </g>
              );
            })}
          </g>
          {objs.map((o, i) => {
            const sy = o.wy - scroll + Math.sin(frame * 0.05 + i) * 6 * u;
            const sx = o.wx + Math.sin(frame * 0.015 + i * 2) * 20 * u;
            if (sy < -h * 0.4 || sy > h * 1.4) return null;
            const s = S * 0.22;
            const art = src ? null : o.kind === 0 ? (
              <g>
                <path d={whalePath(sx, sy, s)} fill="#0E3A4C" opacity={0.85} />
                <path d={`M${sx - s * 0.2} ${sy + s * 0.16} q${s * 0.25} ${s * 0.3} ${s * 0.5} ${s * 0.1}`} fill="none" stroke="#0E3A4C" strokeWidth={s * 0.06} strokeLinecap="round" opacity={0.85} />
                {[0, 1, 2, 3].map((k) => (
                  <line key={k} x1={sx - s * (0.6 - k * 0.08)} y1={sy + s * 0.12} x2={sx - s * (0.55 - k * 0.08)} y2={sy + s * 0.22} stroke="#2C6378" strokeWidth={1.5 * u} />
                ))}
              </g>
            ) : o.kind === 1 ? (
              <g opacity={0.85}>
                <path d={`M${sx - s * 0.32} ${sy} A${s * 0.32} ${s * 0.26} 0 0 1 ${sx + s * 0.32} ${sy} Q${sx} ${sy + s * 0.06} ${sx - s * 0.32} ${sy} Z`} fill="#CFE9F5" opacity={0.6} />
                {Array.from({length: 7}, (_, k) => {
                  const x0 = sx - s * 0.26 + k * s * 0.087;
                  const wv = Math.sin(frame * 0.12 + k) * s * 0.05;
                  return <path key={k} d={`M${x0} ${sy + s * 0.02} q${wv} ${s * 0.25} 0 ${s * 0.5} t0 ${s * 0.4}`} fill="none" stroke="#CFE9F5" strokeOpacity={0.55} strokeWidth={1.6 * u} />;
                })}
              </g>
            ) : (
              <g>
                <line x1={sx} y1={sy - h} x2={sx} y2={sy - s * 0.3} stroke="#1B2B30" strokeWidth={2 * u} />
                <circle cx={sx} cy={sy} r={s * 0.3} fill="#8A6A3A" stroke="#3E2E18" strokeWidth={2 * u} />
                <circle cx={sx} cy={sy} r={s * 0.13} fill="#F3D27A" stroke="#3E2E18" strokeWidth={3 * u} />
                <circle cx={sx} cy={sy} r={s * 0.6} fill="#FFF3C0" opacity={0.08} />
              </g>
            );
            // tag timing: from when the object is well inside the frame
            const enterF = (o.wy - h * 0.72) / speed;
            const st = Math.max(10, enterF) + i * 2;
            const f = frame - st;
            const leave = (o.wy - h * 0.1) / speed;
            const oIn = prog(frame, st, st + 8, ease.out);
            const oOut = 1 - prog(frame, leave, leave + 9);
            const op = Math.min(oIn, oOut) * (1 - out);
            const ax = sx + (o.kind === 0 ? -s * 0.55 : 0);
            const ay = sy + (o.kind === 1 ? -s * 0.1 : 0);
            const boxX = ax + 80 * u;
            const boxY = ay - 96 * u + (1 - oIn) * 12 * u;
            const fs = 17 * u;
            const tw = o.label.length * fs * 0.6 + 22 * u;
            const ld = easeCubicOut(clamp((f - 2) / 9));
            return (
              <g key={i}>
                {art}
                {f >= 0 && op > 0 && (
                  <g opacity={op}>
                    <line x1={boxX} y1={boxY + fs * 1.8} x2={boxX + (ax - boxX) * ld} y2={boxY + fs * 1.8 + (ay - boxY - fs * 1.8) * ld} stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={u} />
                    <circle cx={ax} cy={ay} r={4 * u} fill="none" stroke="#FFFFFF" strokeWidth={1.4 * u} opacity={ld} />
                    <rect x={boxX} y={boxY} width={tw} height={fs * 1.8} fill="rgba(15,45,60,0.65)" stroke="#DFF2F7" strokeOpacity={0.55} strokeWidth={u} />
                    <text x={boxX + 11 * u} y={boxY + fs * 1.22} fill="#E6F6FA" fontFamily={fonts.mono} fontSize={fs}>
                      {o.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </Svg>
        <Vignette strength={0.6} />
      </AbsoluteFill>
    );
  }

  if (variant === 'medallion') {
    const R = S * (portrait ? 0.34 : 0.36);
    const mR = S * (portrait ? 0.17 : w / h < 1.3 ? 0.12 : 0.15);
    const defaults: Item[] = portrait
      ? [
          {x: 0.27, y: 0.14, label: 'Build', icon: 'build'},
          {x: 0.73, y: 0.14, label: 'Inspect', icon: 'inspect'},
          {x: 0.27, y: 0.84, label: 'Ask', icon: 'ask'},
          {x: 0.73, y: 0.84, label: 'Teach', icon: 'teach'},
        ]
      : [
          {x: 0.14, y: 0.26, label: 'Build', icon: 'build'},
          {x: 0.86, y: 0.26, label: 'Inspect', icon: 'inspect'},
          {x: 0.14, y: 0.74, label: 'Ask', icon: 'ask'},
          {x: 0.86, y: 0.74, label: 'Teach', icon: 'teach'},
        ];
    const list = items.length ? items : defaults;
    const order = [0, 1, 2, 3];
    const starts = [14, 14 + stagger, 14 + stagger * 1.67, 14 + stagger * 2.33];
    const rot = (frame * 3) / 30;
    const exitS = 1 - prog(frame, D - 8, D - 4, ease.in);
    return (
      <AbsoluteFill style={{background: BP.bg}}>
        {src ? <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85}} /> : <ScanlineBg />}
        <Svg>
          {!src && <RadialPlan id="cl-plan" cx={cx} cy={cy} r={R * prog(frame, 0, 14, ease.expoOut) + 1} rotate={rot} flow={frame} u={u} reveal={prog(frame, 0, 20)} />}
          {!src && <GlowDot id="cl-dot" x={cx} y={cy} r={6 * u} />}
          {list.map((it, i) => {
            const st = starts[order[i % 4]] + Math.floor(i / 4) * stagger * 3;
            const f = frame - st;
            if (f < -4) return null;
            const mx = it.x * w;
            const my = it.y * h;
            const dir = Math.atan2(my - cy, mx - cx);
            const anchorX = it.ex !== undefined ? mx + it.ex * u : cx + Math.cos(dir + (i % 2 ? -0.35 : 0.35)) * R * 0.62;
            const anchorY = it.ey !== undefined ? my + it.ey * u : cy + Math.sin(dir + (i % 2 ? -0.35 : 0.35)) * R * 0.62;
            const pre = prog(frame, st - 4, st, ease.out);
            const pop = f < 0 ? 0 : f < 4 ? lerp(0, 1.08, ease.out(f / 4)) : lerp(1.08, 1, ease.out(clamp((f - 4) / 3)));
            const pie = medallionReveal === 'pie' ? clamp(f / 6) : 1;
            const s = (medallionReveal === 'pie' ? (f >= 0 ? 1 : 0) : pop) * exitS;
            const rr = mR * s;
            const content = medallionReveal === 'pie' ? prog(frame, st + 6, st + 10) : prog(frame, st + 2, st + 6);
            const lineT = easeCubicOut(clamp((f - 5) / 6)) * exitS;
            const ex = mx + Math.cos(Math.atan2(anchorY - my, anchorX - mx)) * mR;
            const ey = my + Math.sin(Math.atan2(anchorY - my, anchorX - mx)) * mR;
            const pieD = (() => {
              const a1 = -Math.PI / 2 + pie * Math.PI * 2;
              if (pie >= 0.999) return '';
              const large = pie > 0.5 ? 1 : 0;
              return `M${mx} ${my} L${mx} ${my - mR} A${mR} ${mR} 0 ${large} 1 ${mx + Math.cos(a1) * mR} ${my + Math.sin(a1) * mR} Z`;
            })();
            // tangent leaders for the lens look
            const dA = Math.hypot(anchorX - mx, anchorY - my);
            const tAng = Math.acos(clamp(mR / Math.max(dA, mR + 1), -1, 1));
            const base = Math.atan2(anchorY - my, anchorX - mx);
            const fs = 20 * u;
            const label = typed(it.label.toUpperCase(), frame, st + 6, 30);
            return (
              <g key={i}>
                {f < 0 && pre > 0 && <circle cx={mx} cy={my} r={30 * u * pre} fill="none" stroke={BP.line} strokeOpacity={0.7} strokeWidth={1.5 * u} />}
                {s > 0.01 && (
                  <g>
                    <defs>
                      <clipPath id={`cl-med${i}`}>{pieD ? <path d={pieD} /> : <circle cx={mx} cy={my} r={rr} />}</clipPath>
                      <pattern id={`cl-rim${i}`} patternUnits="userSpaceOnUse" width={5 * u} height={5 * u} patternTransform="rotate(45)">
                        <line x1={0} y1={0} x2={0} y2={5 * u} stroke={BP.line} strokeWidth={u} strokeOpacity={0.55} />
                      </pattern>
                    </defs>
                    <circle cx={mx} cy={my} r={rr + 7 * u * s} fill={`url(#cl-rim${i})`} clipPath={pieD ? `url(#cl-med${i})` : undefined} />
                    <g clipPath={`url(#cl-med${i})`}>
                      <circle cx={mx} cy={my} r={rr} fill={BP.bg} />
                      <g opacity={content} transform={`translate(${mx},${my}) scale(${(0.9 + 0.1 * content) * Math.max(0.01, s)}) translate(${-mx},${-my})`}>
                        <LineIcon kind={it.icon ?? (['build', 'inspect', 'ask', 'teach'] as IconKind[])[i % 4]} id={`cl-ic${i}`} x={mx} y={my + mR * 0.05} s={mR * 0.62} sw={1.6 * u} accent={BP.blue} t={frame} />
                      </g>
                    </g>
                    <circle cx={mx} cy={my} r={rr} fill="none" stroke={BP.line} strokeWidth={2 * u} clipPath={pieD ? `url(#cl-med${i})` : undefined} />
                  </g>
                )}
                {lineT > 0 &&
                  (medallionReveal === 'pie' ? (
                    [-1, 1].map((sg) => {
                      const a = base + sg * tAng;
                      const px = mx + Math.cos(a) * mR;
                      const py = my + Math.sin(a) * mR;
                      return <line key={sg} x1={px} y1={py} x2={px + (anchorX - px) * lineT} y2={py + (anchorY - py) * lineT} stroke="#9FB2D6" strokeOpacity={0.5} strokeWidth={u} />;
                    })
                  ) : (
                    <line x1={ex} y1={ey} x2={ex + (anchorX - ex) * lineT} y2={ey + (anchorY - ey) * lineT} stroke={BP.line} strokeOpacity={0.5} strokeWidth={u} />
                  ))}
                {lineT >= 1 && (
                  <g>
                    <circle cx={anchorX} cy={anchorY} r={7 * u} fill={BP.bg} stroke={BP.line} strokeWidth={1.4 * u} />
                    <circle cx={anchorX} cy={anchorY} r={2 * u} fill={BP.blue} />
                  </g>
                )}
                {s > 0.5 && (
                  <text x={mx + fs * 0.15} y={my + mR + 46 * u} textAnchor="middle" fill={BP.line} fontFamily={fonts.mono} fontSize={fs} letterSpacing={fs * 0.3} opacity={exitS}>
                    {label}
                  </text>
                )}
              </g>
            );
          })}
        </Svg>
        <Vignette strength={0.5} />
      </AbsoluteFill>
    );
  }

  // ---- leader (default) ----
  const tall = w / h < 1.3;
  const R = S * (portrait ? 0.26 : tall ? 0.2 : 0.22);
  const float = Math.sin((frame / 45) * Math.PI * 2) * 10 * u * (src ? 0 : 1);
  const scx = cx - (tall ? 0 : R * 0.25);
  const scy = cy - R * 0.1 + float;
  const def: Item[] = tall
    ? [
        {x: -0.45, y: -0.45, label: 'HIGHLIGHT', sublabel: 'F0 .04 · CLEAR COAT', ex: -0.2, ey: -0.9},
        {x: 0.42, y: -0.38, label: 'TERMINATOR', sublabel: 'n·l = 0', ex: 0.1, ey: -1.0},
        {x: 0.25, y: 0.38, label: 'CORE SHADOW', sublabel: 'n·l < 0', ex: 0.3, ey: 0.95},
        {x: 0.62, y: 0.72, label: 'REFLECTED LIGHT', sublabel: 'BOUNCE FROM THE FLOOR', ex: -0.6, ey: 0.95},
        {x: 1.2, y: 1.05, label: 'CAST SHADOW', sublabel: 'PENUMBRA ∝ L', ex: -0.2, ey: 1.35},
      ]
    : [
        {x: -0.45, y: -0.45, label: 'HIGHLIGHT', sublabel: 'F0 .04 · CLEAR COAT', ex: -0.55, ey: -0.38},
        {x: 0.42, y: -0.38, label: 'TERMINATOR', sublabel: 'n·l = 0', ex: 0.5, ey: -0.45},
        {x: 0.25, y: 0.38, label: 'CORE SHADOW', sublabel: 'n·l < 0', ex: 0.95, ey: 0.0},
        {x: 0.6, y: 0.75, label: 'REFLECTED LIGHT', sublabel: 'BOUNCE FROM THE FLOOR', ex: 0.45, ey: 0.42},
        {x: 1.9, y: 1.0, label: 'CAST SHADOW', sublabel: 'PENUMBRA ∝ L', ex: 0.45, ey: -0.48},
      ];
  const usingDefaults = items.length === 0;
  const list = usingDefaults ? def : items;
  const grey = '#6E6B63';
  return (
    <AbsoluteFill style={{background: '#EEEBDE'}}>
      {src ? <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : null}
      <Svg>
        {!src && <SphereSubject cx={scx} cy={scy} R={R} u={u} w={w} h={h} />}
        {list.map((it, i) => {
          const isShadow = usingDefaults && i === 4;
          const ax = usingDefaults ? scx + it.x * R : it.x * w;
          const ay = usingDefaults ? (isShadow ? cy - R * 0.1 : scy) + it.y * R : it.y * h + float;
          const exv = usingDefaults ? (it.ex ?? 0.5) * R : it.ex !== undefined ? it.ex * u : (ax < w / 2 ? -1 : 1) * 90 * u;
          const eyv = usingDefaults ? (it.ey ?? -0.4) * R : it.ey !== undefined ? it.ey * u : (ay < h / 2 ? -1 : 1) * 70 * u;
          return <LeaderCallout key={i} ax={ax} ay={ay} ex={exv} ey={eyv} label={it.label} sub={it.sublabel} start={14 + i * stagger} ink={ink} grey={grey} u={u} frame={frame} out={out} />;
        })}
      </Svg>
    </AbsoluteFill>
  );
};

const lerpHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp(t))).join(',')})`;
};

export const calloutLabels = defineMotion<Props>({
  id: 'callout-labels',
  title: 'Callout labels',
  category: 'hud',
  description: 'Staggered annotation callouts — dot, leader line and typed mono label — over a procedural subject; variants: room callout with crosshair and T-rules, translucent tags riding scrolling objects, and circular medallions popping on a blueprint plan.',
  source: ['video17 31.5-34.3 (callout-leader-labels)', 'video9 17.9-18.6 (room-label-callout)', 'video23 (object-callout-tag)', 'video19 11.75-13.35 (medallion-pop)', 'video6 24.0-31.0 (callout-inset-lens)'],
  useFor: 'Label the parts of a product, diagram, room or scene; attach facts to moving objects; link vignettes to a central diagram.',
  durationInFrames: 150,
  defaultProps: {
    variant: 'leader',
    items: [],
    src: '',
    stagger: 10.5,
    medallionReveal: 'pop',
    accent: '#E24D0F',
    ink: '#0B0D0C',
  },
  propDocs: {
    variant: 'leader | room | tag | medallion',
    items: 'callouts {x, y, label, sublabel?, ex?, ey?, icon?}: x,y anchor as frame fractions (0..1); ex,ey label offset in px@1080 (leader) or plan-anchor offset (medallion); room titles split lines with "/"; [] = built-in demo',
    src: 'optional public/ image used as the subject instead of the procedural one',
    stagger: 'frames between callouts (0.35 s = 10.5)',
    medallionReveal: 'pop (scale from a preview dot) or pie (clockwise wipe + tangent leaders)',
    accent: 'accent colour (room label, medallion highlights)',
    ink: 'line / text colour for leader and room callouts',
  },
  component: CalloutLabels,
  tags: ['callout', 'label', 'annotation', 'leader line', 'hud', 'tag'],
});
