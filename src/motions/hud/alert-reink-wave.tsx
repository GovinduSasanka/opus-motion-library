// Adapted from mg-styles-15/demos/22-hud/js/post.js (COMP_FS reink / uWave) (MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {hs, mg1Fonts} from '../../core/r2-mg1-kit';
import {cl, smooth} from '../../core/r2-mg1b-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Pal = {main: string; hot: string; dim: string; bg: string};
type Props = {
  fromPalette: Pal;
  toPalette: Pal;
  at: number;
  duration: number;
  originX: number;
  originY: number;
  fromLabel: string;
  toLabel: string;
  callSign: string;
  keepRed: boolean;
};

type HudArgs = {pal: Pal; alert: boolean; frame: number; w: number; h: number; u: number; ox: number; oy: number; rr: number; portrait: boolean; label: string; callSign: string; at: number; uid: string};

const tc = (f: number) => {
  const s = f / 30;
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}:${String(Math.floor((s % 1) * 30)).padStart(2, '0')}`;
};

const Hud: React.FC<HudArgs> = ({pal, alert, frame, w, h, u, ox, oy, rr, portrait, label, callSign, at, uid}) => {
  const boot = prog(frame, 0, 18, ease.out);
  const sweepA = ((frame * (alert ? 7 : 3.2)) % 360) * (Math.PI / 180);
  const ticks: React.ReactNode[] = [];
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2;
    const L = i % 5 === 0 ? 18 : 9;
    ticks.push(<line key={i} x1={ox + Math.cos(a) * rr} y1={oy + Math.sin(a) * rr} x2={ox + Math.cos(a) * (rr - L * u)} y2={oy + Math.sin(a) * (rr - L * u)} stroke={pal.main} strokeWidth={(i % 5 === 0 ? 2.4 : 1.4) * u} opacity={0.75} />);
  }
  const wedges: React.ReactNode[] = [];
  for (let k = 0; k < 16; k++) {
    const a0 = sweepA - (k + 1) * 0.045;
    const a1 = sweepA - k * 0.045;
    wedges.push(
      <path key={k} d={`M${ox} ${oy}L${ox + Math.cos(a0) * rr} ${oy + Math.sin(a0) * rr}A${rr} ${rr} 0 0 1 ${ox + Math.cos(a1) * rr} ${oy + Math.sin(a1) * rr}Z`} fill={pal.main} opacity={0.2 * (1 - k / 16)} />,
    );
  }
  // blips: stationary contacts + one incoming that arrives at the origin on `at`
  const blips: React.ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const a = hs(i, 4) * Math.PI * 2;
    const r = (0.25 + hs(i, 9) * 0.7) * rr;
    const dA = ((sweepA - a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const glow = Math.max(0, 1 - dA / 2.4);
    blips.push(<circle key={i} cx={ox + Math.cos(a) * r} cy={oy + Math.sin(a) * r} r={(5 + glow * 4) * u} fill={pal.main} opacity={0.25 + glow * 0.7} />);
  }
  const inc = prog(frame, 22, at, ease.inOut);
  const ia = -2.2;
  const ir = rr * 1.05 * (1 - inc);
  const bx = ox + Math.cos(ia) * ir;
  const by = oy + Math.sin(ia) * ir;
  const threat = alert ? 0.94 : 0.12 + 0.5 * inc;
  // side panels
  const bars = [0.55 + 0.25 * Math.sin(frame * 0.11), 0.4 + 0.3 * Math.sin(frame * 0.17 + 1), 0.7 + 0.2 * Math.sin(frame * 0.09 + 2), 0.35 + 0.3 * Math.sin(frame * 0.21 + 3), threat];
  const names = alert ? ['LINK', 'HULL', 'POWER', 'SHIELD', 'THREAT'] : ['SIGNAL', 'LOAD', 'POWER', 'LINK', 'THREAT'];
  const panel = (px: number, py: number, pw: number, ph: number, k: number) => {
    const rows = bars.length;
    const rh = (ph - 74 * u) / rows;
    return (
      <g opacity={boot}>
        <rect x={px} y={py} width={pw} height={ph} fill={pal.main} opacity={0.05} />
        <path d={`M${px} ${py + 24 * u}V${py}H${px + 24 * u}M${px + pw - 24 * u} ${py + ph}H${px + pw}V${py + ph - 24 * u}`} stroke={pal.main} strokeWidth={2.4 * u} fill="none" />
        <text x={px + 16 * u} y={py + 40 * u} fontFamily={mg1Fonts.tech} fontWeight={700} fontSize={22 * u} letterSpacing={4 * u} fill={pal.main}>
          {k === 0 ? `0${1 + (alert ? 1 : 0)} // SYSTEM` : `0${3 + (alert ? 1 : 0)} // CONTACT`}
        </text>
        {bars.map((v, i) => {
          const yy = py + 60 * u + i * rh;
          const vv = k === 0 ? v : cl(1 - v * 0.8 + (alert ? 0.15 : 0));
          const hot = i === 4;
          return (
            <g key={i}>
              <text x={px + 16 * u} y={yy + rh * 0.42} fontFamily={fonts.mono} fontSize={17 * u} fill={pal.main} opacity={0.8}>
                {k === 0 ? names[i] : ['RNG', 'BRG', 'VEL', 'ALT', 'ID'][i]}
              </text>
              <rect x={px + 16 * u} y={yy + rh * 0.52} width={pw - 90 * u} height={7 * u} fill={pal.dim} opacity={0.5} />
              <rect x={px + 16 * u} y={yy + rh * 0.52} width={(pw - 90 * u) * vv} height={7 * u} fill={hot && alert ? pal.hot : pal.main} />
              <text x={px + pw - 16 * u} y={yy + rh * 0.42} textAnchor="end" fontFamily={fonts.mono} fontWeight={700} fontSize={19 * u} fill={hot && alert ? pal.hot : pal.main}>
                {Math.round(vv * 100)}
              </text>
            </g>
          );
        })}
      </g>
    );
  };
  const pw = portrait ? w * 0.84 : w * 0.24;
  const ph = portrait ? h * 0.15 : h * 0.4;
  const lx = portrait ? (w - pw) / 2 : w * 0.05;
  const ly = portrait ? h * 0.09 : h * 0.3;
  const rx = portrait ? (w - pw) / 2 : w * 0.95 - pw;
  const ry = portrait ? h * 0.76 : h * 0.3;
  const blink = alert ? (Math.floor(frame / 8) % 2 === 0 ? 1 : 0.35) : 1;
  return (
    <g>
      <rect width={w} height={h} fill={pal.bg} />
      {/* grid */}
      {Array.from({length: Math.ceil(w / (90 * u))}).map((_, i) => (
        <line key={'v' + i} x1={i * 90 * u} x2={i * 90 * u} y1={0} y2={h} stroke={pal.dim} strokeWidth={1 * u} opacity={0.2} />
      ))}
      {Array.from({length: Math.ceil(h / (90 * u))}).map((_, i) => (
        <line key={'h' + i} x1={0} x2={w} y1={i * 90 * u} y2={i * 90 * u} stroke={pal.dim} strokeWidth={1 * u} opacity={0.2} />
      ))}
      <g opacity={boot}>
        {[0.25, 0.5, 0.75, 1].map((f, i) => (
          <circle key={i} cx={ox} cy={oy} r={rr * f} fill="none" stroke={pal.main} strokeWidth={(i === 3 ? 3 : 1.5) * u} opacity={i === 3 ? 0.9 : 0.4} />
        ))}
        {ticks}
        {wedges}
        <line x1={ox - rr} x2={ox + rr} y1={oy} y2={oy} stroke={pal.main} strokeWidth={1.2 * u} opacity={0.35} />
        <line x1={ox} x2={ox} y1={oy - rr} y2={oy + rr} stroke={pal.main} strokeWidth={1.2 * u} opacity={0.35} />
        {blips}
        {/* incoming contact */}
        <g opacity={prog(frame, 22, 30, ease.out) * (1 - 0.0)}>
          <rect x={bx - 14 * u} y={by - 14 * u} width={28 * u} height={28 * u} fill="none" stroke={pal.hot} strokeWidth={2.4 * u} transform={`rotate(45 ${bx} ${by})`} />
          <line x1={bx} y1={by} x2={ox} y2={oy} stroke={pal.hot} strokeWidth={1.4 * u} strokeDasharray={`${6 * u} ${8 * u}`} opacity={0.6} />
        </g>
        {/* target at origin */}
        <circle cx={ox} cy={oy} r={11 * u} fill={pal.main} />
        <circle cx={ox} cy={oy} r={(26 + ((frame % 36) / 36) * 34) * u} fill="none" stroke={pal.main} strokeWidth={2 * u} opacity={1 - (frame % 36) / 36} />
      </g>
      {/* header + panels */}
      <g opacity={boot}>
        <text x={w * 0.05} y={h * 0.075} fontFamily={mg1Fonts.tech} fontWeight={700} fontSize={(portrait ? 30 : 34) * u} letterSpacing={6 * u} fill={pal.main}>
          {callSign}
        </text>
        <text x={w * 0.95} y={h * 0.075} textAnchor="end" fontFamily={fonts.mono} fontSize={26 * u} fill={pal.main} opacity={0.9}>
          {tc(frame)}
        </text>
        <text x={cx0(w)} y={portrait ? h * 0.72 : h * 0.9} textAnchor="middle" fontFamily={mg1Fonts.tech} fontWeight={700} fontSize={(portrait ? 58 : 66) * u} letterSpacing={9 * u} fill={alert ? pal.hot : pal.main} opacity={blink}>
          {label}
        </text>
        <line x1={w * 0.05} x2={w * 0.95} y1={h * 0.095} y2={h * 0.095} stroke={pal.main} strokeWidth={2 * u} opacity={0.5} />
      </g>
      {panel(lx, ly, pw, ph, 0)}
      {panel(rx, ry, pw, ph, 1)}
      <defs>
        <clipPath id={`${uid}-c`}>
          <rect width={w} height={h} />
        </clipPath>
      </defs>
    </g>
  );
};
const cx0 = (w: number) => w / 2;

const bezE = (t: number) => Easing.bezier(0.25, 0.55, 0.35, 1)(t);

const AlertReinkWave: React.FC<Props> = ({fromPalette, toPalette, at, duration, originX, originY, fromLabel, toLabel, callSign, keepRed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const ox = w * originX;
  const oy = h * originY;
  const rr = Math.min(w, h) * (portrait ? 0.34 : 0.3);
  const Rmax = Math.max(Math.hypot(ox, oy), Math.hypot(w - ox, oy), Math.hypot(ox, h - oy), Math.hypot(w - ox, h - oy)) + 140 * u;
  const lin = prog(frame, at, at + duration, bezE);
  const R = Rmax * lin;
  const feather = 110 * u;
  const front = frame >= at ? Math.exp(-(((Math.max(0, frame - at - duration * 0.55)) / 10) ** 2)) : 0;
  const flash = frame >= at && frame < at + 4 ? 0.35 * (1 - (frame - at) / 4) : 0;
  const shake = frame >= at && frame < at + 12 ? Math.sin((frame - at) * 3.1) * 7 * u * (1 - (frame - at) / 12) : 0;
  const common = {frame, w, h, u, ox, oy, rr, portrait, callSign, at};
  return (
    <AbsoluteFill style={{background: fromPalette.bg}}>
      <Svg>
        <defs>
          <radialGradient id="arw-grad" gradientUnits="userSpaceOnUse" cx={ox} cy={oy} r={Math.max(1, R)}>
            <stop offset={Math.max(0, (R - feather) / Math.max(1, R))} stopColor="#fff" />
            <stop offset={1} stopColor="#000" />
          </radialGradient>
          <mask id="arw-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
            <rect width={w} height={h} fill="url(#arw-grad)" />
          </mask>
          <filter id="arw-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={34 * u} />
          </filter>
        </defs>
        <g transform={`translate(${shake} ${-shake * 0.6})`}>
          <Hud {...common} pal={fromPalette} alert={false} label={fromLabel} uid="arw-a" />
          {frame >= at && R > 1 && (
            <g mask="url(#arw-mask)">
              <Hud {...common} pal={toPalette} alert label={toLabel} uid="arw-b" />
            </g>
          )}
          {frame >= at && R > 1 && (
            <g>
              <circle cx={ox} cy={oy} r={Math.max(1, R - 22 * u)} fill="none" stroke={toPalette.main} strokeWidth={90 * u} opacity={0.3 * front} filter="url(#arw-glow)" />
              <circle cx={ox} cy={oy} r={R} fill="none" stroke={toPalette.hot} strokeWidth={3.2 * u} opacity={front} />
              <circle cx={ox} cy={oy} r={Math.max(1, R - 7 * u)} fill="none" stroke="#fff" strokeWidth={1.4 * u} opacity={front * 0.9} />
            </g>
          )}
          {keepRed && (
            <g>
              <circle cx={w * 0.05 + 12 * u} cy={h * 0.935} r={9 * u} fill="#FF2A3D" opacity={Math.floor(frame / 15) % 2 === 0 ? 1 : 0.45} />
              <text x={w * 0.05 + 34 * u} y={h * 0.935 + 8 * u} fontFamily={fonts.mono} fontWeight={700} fontSize={24 * u} letterSpacing={3 * u} fill="#FF2A3D">
                REC
              </text>
            </g>
          )}
        </g>
        <rect width={w} height={h} fill="#fff" opacity={flash} />
        {/* edge glow once alert is established */}
        <rect width={w} height={h} fill="none" stroke={toPalette.main} strokeWidth={10 * u} opacity={smooth(at + duration, at + duration + 10, frame) * (0.25 + 0.2 * Math.sin(frame * 0.4))} />
      </Svg>
    </AbsoluteFill>
  );
};

export const alertReinkWave = defineMotion<Props>({
  id: 'alert-reink-wave',
  title: 'Alert re-ink wave',
  category: 'hud',
  description:
    'A cyan radar HUD scans while a contact closes in; at the climax a ring expands from the target and everything inside it is re-inked from cyan to orange (a feathered mask edge, a thin white-hot front and a soft orange annulus ride the wave), the readouts flip to the alert copy and true reds (the REC dot) keep their colour.',
  source: ['mg-styles-15 demos/22-hud/js/post.js COMP_FS reink / uWave (MIT)'],
  useFor: 'The climax beat of any HUD, alert or "status changed" moment; generalises to any palette swap (day to night, calm to alarm, brand A to brand B).',
  durationInFrames: 180,
  defaultProps: {
    fromPalette: {main: '#19E6FF', hot: '#B8F8FF', dim: '#0E6F80', bg: '#04141C'},
    toPalette: {main: '#FF7A1A', hot: '#FFDBB3', dim: '#8A3A0A', bg: '#150904'},
    at: 96,
    duration: 20,
    originX: 0.5,
    originY: 0.5,
    fromLabel: 'ALL CLEAR',
    toLabel: 'THREAT DETECTED',
    callSign: 'SENTINEL-7 // OVERWATCH',
    keepRed: true,
  },
  propDocs: {
    fromPalette: 'palette before the wave {main, hot, dim, bg}',
    toPalette: 'palette after the wave {main, hot, dim, bg}',
    at: 'frame the wave leaves the target',
    duration: 'frames for the wave to cross the frame (~0.45 s to 1300 px)',
    originX: 'wave origin x as fraction of width',
    originY: 'wave origin y as fraction of height',
    fromLabel: 'status copy before the wave',
    toLabel: 'status copy after the wave',
    callSign: 'header call sign',
    keepRed: 'true reds (REC dot) are exempt from the re-ink',
  },
  component: AlertReinkWave,
  tags: ['hud', 'alert', 'palette swap', 'recolour', 'wave', 'radar', 'shockwave', 'status change', 'climax', 'sci-fi', 'cyan orange', 're-skin'],
});
