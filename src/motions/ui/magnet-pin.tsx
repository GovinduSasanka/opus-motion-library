// Idea after lemo-opuscar styles/whiteboard demo engine (MIT, LemoLab) drawPinMagnet — see THIRD_PARTY_NOTICES.md.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {withPortraitFit} from '../../core/portrait3';
import {defineMotion} from '../../core/types';

type Key = {frame: number; x?: number; y?: number; action: 'drop' | 'slide' | 'lift' | 'sink'};
type Spot = {x: number; y: number; label: string};
type Props = {
  background: string;
  shape: 'pin' | 'disc' | 'icon';
  color: string;
  ink: string;
  keys: Key[];
  spots: Spot[];
  showRoute: boolean;
  size: number;
};

const DUR = {drop: 9, slide: 26, lift: 14, sink: 20};

const MagnetPin: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const S = p.size * u;
  const px = (x: number) => x * w;
  const py = (y: number) => y * h;

  let x = 0;
  let y = 0;
  let lift = 1;
  let tilt = 0;
  let sink = 0;
  let alpha = 0;
  let click = -1;
  let started = false;
  const keys = [...p.keys].sort((a, b) => a.frame - b.frame);
  for (const k of keys) {
    if (frame < k.frame) break;
    const t = frame - k.frame;
    if (k.action === 'drop') {
      x = px(k.x ?? 0.5);
      y = py(k.y ?? 0.5);
      lift = 1 - ease.in(Math.min(1, t / DUR.drop));
      alpha = Math.min(1, t / 3);
      tilt = 0;
      sink = 0;
      started = true;
      if (t >= DUR.drop) click = t - DUR.drop;
    } else if (k.action === 'slide' && started) {
      const f = Math.min(1, t / DUR.slide);
      const sm = f * f * (3 - 2 * f);
      const nx = px(k.x ?? 0.5);
      const ny = py(k.y ?? 0.5);
      // each key runs to completion before the next, so (x, y) here is the previous rest position
      const prev = keys.slice(0, keys.indexOf(k)).filter((q) => q.x !== undefined).pop();
      const ox = prev ? px(prev.x as number) : nx;
      const oy = prev ? py(prev.y as number) : ny;
      x = ox + (nx - ox) * sm;
      y = oy + (ny - oy) * sm;
      lift = Math.sin(f * Math.PI) * 0.35;
      alpha = 1;
      if (f >= 1) click = t - DUR.slide;
    } else if (k.action === 'lift' && started) {
      const f = Math.min(1, t / DUR.lift);
      lift = ease.out(f) * 1.2;
      alpha = 1 - ease.in(f);
    } else if (k.action === 'sink' && started) {
      const f = Math.min(1, t / DUR.sink);
      tilt = 0.5 * ease.out(f);
      sink = 40 * u * ease.in(f);
      alpha = 1 - prog(f, 0.6, 1, ease.in);
    }
  }

  const liftPx = lift * 70 * u;
  const shadowScale = 1 + lift * 0.9;
  const route = keys.filter((k) => k.x !== undefined && k.y !== undefined).map((k) => [px(k.x as number), py(k.y as number)]);

  return (
    <AbsoluteFill style={{background: p.background}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="mp-body" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#fff" stopOpacity={0.55} />
            <stop offset="22%" stopColor={p.color} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.35} />
          </radialGradient>
          <filter id="mp-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={(3 + 7 * Math.min(lift, 1.2)) * u} />
          </filter>
        </defs>
        {Array.from({length: 24}, (_, i) => (
          <line key={`v${i}`} x1={(w / 24) * i} x2={(w / 24) * i} y1={0} y2={h} stroke={p.ink} strokeOpacity={0.05} strokeWidth={1.5 * u} />
        ))}
        {Array.from({length: 14}, (_, i) => (
          <line key={`h${i}`} y1={(h / 14) * i} y2={(h / 14) * i} x1={0} x2={w} stroke={p.ink} strokeOpacity={0.05} strokeWidth={1.5 * u} />
        ))}
        {p.showRoute && route.length > 1 ? (
          <path d={'M' + route.map((q) => `${q[0]} ${q[1]}`).join('L')} fill="none" stroke={p.ink} strokeOpacity={0.35} strokeWidth={3 * u} strokeDasharray={`${3 * u} ${12 * u}`} strokeLinecap="round" />
        ) : null}
        {p.spots.map((s, i) => {
          const a = prog(frame, 4 + i * 5, 18 + i * 5, ease.back);
          return (
            <g key={i} transform={`translate(${px(s.x)} ${py(s.y)}) scale(${a})`}>
              <circle r={16 * u} fill="none" stroke={p.ink} strokeOpacity={0.55} strokeWidth={3 * u} />
              <circle r={4.5 * u} fill={p.ink} opacity={0.6} />
              <text y={56 * u} textAnchor="middle" fontFamily={fonts.hand} fontWeight={700} fontSize={38 * u} fill={p.ink}>
                {s.label}
              </text>
            </g>
          );
        })}
        {started && alpha > 0 ? (
          <g opacity={alpha}>
            {click >= 0 && click < 14 ? <circle cx={x} cy={y} r={S * (0.2 + click * 0.03)} fill="none" stroke={p.color} strokeOpacity={0.6 * (1 - click / 14)} strokeWidth={3 * u} /> : null}
            <ellipse cx={x + lift * 18 * u} cy={y + 4 * u + lift * 10 * u} rx={S * 0.3 * shadowScale} ry={S * 0.1 * shadowScale} fill="#000" opacity={0.32 / shadowScale} filter="url(#mp-blur)" />
            <g transform={`translate(${x} ${y - liftPx + sink}) rotate(${(tilt * 180) / Math.PI})`}>
              {p.shape === 'disc' ? (
                <g transform={`translate(0 ${-S * 0.18})`}>
                  <circle r={S * 0.3} fill="url(#mp-body)" />
                  <circle cx={-S * 0.09} cy={-S * 0.1} r={S * 0.06} fill="#fff" opacity={0.8} />
                </g>
              ) : p.shape === 'icon' ? (
                <g transform={`translate(0 ${-S * 0.2})`}>
                  <rect x={-S * 0.34} y={-S * 0.2} width={S * 0.68} height={S * 0.34} rx={S * 0.07} fill="url(#mp-body)" />
                  <rect x={S * 0.12} y={-S * 0.14} width={S * 0.16} height={S * 0.16} rx={S * 0.03} fill="#fff" opacity={0.85} />
                  <circle cx={-S * 0.2} cy={S * 0.16} r={S * 0.07} fill="#222" />
                  <circle cx={S * 0.2} cy={S * 0.16} r={S * 0.07} fill="#222" />
                </g>
              ) : (
                <g>
                  <path d={`M0 0C${-S * 0.5} ${-S * 0.5} ${-S * 0.38} ${-S * 0.95} 0 ${-S * 0.95}C${S * 0.38} ${-S * 0.95} ${S * 0.5} ${-S * 0.5} 0 0Z`} fill="url(#mp-body)" />
                  <circle cx={0} cy={-S * 0.6} r={S * 0.14} fill="#fff" />
                  <ellipse cx={-S * 0.13} cy={-S * 0.78} rx={S * 0.07} ry={S * 0.05} fill="#fff" opacity={0.7} transform={`rotate(-30 ${-S * 0.13} ${-S * 0.78})`} />
                </g>
              )}
            </g>
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};

export const magnetPin = defineMotion<Props>({
  id: 'magnet-pin',
  title: 'Magnet pin (board token)',
  category: 'ui',
  description:
    'A glossy round magnet (an orange map pin with a white dot and a specular highlight) drops onto a board with a shrinking blurred shadow and a click ripple, slides between labelled spots with a small lift, then sinks (tilts and drops) or lifts off.',
  source: ['lemo-opuscar styles/whiteboard demo engine (MIT, LemoLab) — drawPinMagnet, own SVG build'],
  useFor: 'The hero token on any board or map: you-are-here, a delivery truck, a player piece, a "we are here" marker; pairs with map-route and board-camera.',
  durationInFrames: 210,
  defaultProps: {
    background: '#F3F0E9',
    shape: 'pin',
    color: '#F26B2A',
    ink: '#2A2C31',
    keys: [
      {frame: 24, x: 0.22, y: 0.64, action: 'drop'},
      {frame: 70, x: 0.5, y: 0.36, action: 'slide'},
      {frame: 118, x: 0.78, y: 0.62, action: 'slide'},
      {frame: 170, action: 'sink'},
    ],
    spots: [
      {x: 0.22, y: 0.64, label: 'Start'},
      {x: 0.5, y: 0.36, label: 'Depot'},
      {x: 0.78, y: 0.62, label: 'Customer'},
    ],
    showRoute: true,
    size: 210,
  },
  propDocs: {
    background: 'board colour',
    shape: "'pin' | 'disc' | 'icon'",
    color: 'magnet colour',
    ink: 'ink for grid, spots and labels',
    keys: "[{frame, x, y (0-1 fractions), action:'drop'|'slide'|'lift'|'sink'}] in order",
    spots: '[{x, y, label}] labelled places on the board (replace the sample labels)',
    showRoute: 'dotted route between keyed positions',
    size: 'pin size in px',
  },
  component: withPortraitFit(MagnetPin, {s: 1.4}),
  tags: ['pin', 'magnet', 'token', 'map', 'whiteboard', 'marker', 'location', 'you are here', 'drop', 'slide'],
});
