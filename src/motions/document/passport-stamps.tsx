import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease} from '../../core/ease';
import {bgOf} from '../../core/commerce-kit';
import {fonts} from '../../core/fonts';
import {mixHex, sh, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A passport page where travel stamps thud on one after another: a rubber-stamp tool drops, the inked stamp lands with a
 * shockwave and page shake, then the tool lifts away. Stamps come from `stamps[{place, date, shape, color}]`.
 */
type StampDef = {place: string; date: string; shape?: string; color?: string; label?: string};
type Props = {
  title: string;
  stamps: StampDef[];
  gap: number;
  background: string;
  paper: string;
  ink: string;
  accent: string;
  startAt: number;
};

const PALETTE = ['#2B4C9B', '#B3261E', '#1F7A4D', '#6A3FA0', '#C46A12', '#0C7C8A', '#8A2D5C', '#3D3D8F'];

/** one stamp drawn in a -100..100 box */
const StampArt: React.FC<{s: StampDef; color: string; idx: number}> = ({s, color, idx}) => {
  const shape = (s.shape ?? 'circle').toLowerCase();
  const place = (s.place || '').toUpperCase();
  const label = (s.label ?? 'ENTRY').toUpperCase();
  const fid = `pps-rough-${idx}`;
  const pid = `pps-arc-${idx}`;
  const pidB = `pps-arcb-${idx}`;
  const common = {fill: 'none', stroke: color, strokeLinejoin: 'round' as const};
  let body: React.ReactNode;
  if (shape === 'rect' || shape === 'arrow') {
    const arrow = shape === 'arrow';
    const d = arrow ? 'M-94 -52 L58 -52 L96 0 L58 52 L-94 52 Z' : 'M-94 -54 H94 V54 H-94 Z';
    const fs = Math.min(30, 150 / Math.max(4, place.length) * 1.5);
    body = (
      <g>
        <path d={d} {...common} strokeWidth={6} />
        <path d={arrow ? 'M-84 -42 L54 -42 L84 0 L54 42 L-84 42 Z' : 'M-84 -44 H84 V44 H-84 Z'} {...common} strokeWidth={2} />
        <text x={arrow ? -14 : 0} y={-6} textAnchor="middle" fontFamily={fonts.display} fontSize={fs} fill={color}>
          {place}
        </text>
        <text x={arrow ? -14 : 0} y={20} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={15} fill={color}>
          {s.date}
        </text>
        <text x={arrow ? -14 : 0} y={38} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={10.5} letterSpacing={3} fill={color}>
          {label}
        </text>
      </g>
    );
  } else if (shape === 'oval') {
    body = (
      <g>
        <ellipse rx={96} ry={64} {...common} strokeWidth={6} />
        <ellipse rx={85} ry={53} {...common} strokeWidth={2} />
        <text y={-8} textAnchor="middle" fontFamily={fonts.display} fontSize={Math.min(28, 150 / Math.max(4, place.length) * 1.5)} fill={color}>
          {place}
        </text>
        <line x1={-58} x2={58} y1={4} y2={4} stroke={color} strokeWidth={2} />
        <text y={26} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={16} fill={color}>
          {s.date}
        </text>
        <text y={42} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={10} letterSpacing={3} fill={color}>
          {label}
        </text>
      </g>
    );
  } else if (shape === 'octagon' || shape === 'hex') {
    const pts: string[] = [];
    const sides = shape === 'hex' ? 6 : 8;
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 + (shape === 'hex' ? 0 : Math.PI / sides);
      pts.push(`${(Math.cos(a) * 94).toFixed(1)},${(Math.sin(a) * 94).toFixed(1)}`);
    }
    const pts2 = pts.map((q) => q.split(',').map((v) => (parseFloat(v) * 0.88).toFixed(1)).join(','));
    body = (
      <g>
        <polygon points={pts.join(' ')} {...common} strokeWidth={6} />
        <polygon points={pts2.join(' ')} {...common} strokeWidth={2} />
        <text y={-10} textAnchor="middle" fontFamily={fonts.display} fontSize={Math.min(28, 140 / Math.max(4, place.length) * 1.5)} fill={color}>
          {place}
        </text>
        <text y={18} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={16} fill={color}>
          {s.date}
        </text>
        <text y={40} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={10} letterSpacing={3} fill={color}>
          {label}
        </text>
      </g>
    );
  } else {
    body = (
      <g>
        <circle r={94} {...common} strokeWidth={6} />
        <circle r={82} {...common} strokeWidth={2} />
        <circle r={50} {...common} strokeWidth={1.5} strokeDasharray="3 4" />
        <path id={pid} d="M-66 0 A66 66 0 0 1 66 0" fill="none" />
        <path id={pidB} d="M-74 0 A74 74 0 0 0 74 0" fill="none" />
        <text fontFamily={fonts.display} fontSize={Math.min(22, 330 / Math.max(6, place.length))} fill={color} textAnchor="middle">
          <textPath href={`#${pid}`} startOffset="50%">
            {place}
          </textPath>
        </text>
        <text fontFamily={fonts.mono} fontWeight={700} fontSize={11} letterSpacing={4} fill={color} textAnchor="middle" transform="translate(0 14)">
          <textPath href={`#${pidB}`} startOffset="50%">
            {label}
          </textPath>
        </text>
        <text y={6} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={19} fill={color}>
          {s.date}
        </text>
        <path d="M0 -34 l5.5 11 12 1.8 -8.7 8.4 2 12 -10.8 -5.7 -10.8 5.7 2 -12 -8.7 -8.4 12 -1.8z" fill={color} transform="translate(0 20) scale(0.7)" />
      </g>
    );
  }
  return (
    <svg viewBox="-100 -100 200 200" width="100%" height="100%" style={{overflow: 'visible'}}>
      <defs>
        <filter id={fid} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed={idx + 4} result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.2" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={idx + 11} result="speck" />
          <feColorMatrix in="speck" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.2 0 0 0 -1.05" result="mask" />
          <feComposite in="d" in2="mask" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${fid})`}>{body}</g>
    </svg>
  );
};

const PassportStamps: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame - p.startAt;
  const stamps = p.stamps.length ? p.stamps.slice(0, 9) : [{place: 'Stamp', date: '01 JAN 2026'}];
  const n = stamps.length;
  const gap = Math.max(10, p.gap);
  const first = 22;

  // page geometry
  const pageH = portrait ? Math.min(h * 0.84, w * 0.9 * 1.42) : h * 0.84;
  const pageW = portrait ? Math.min(w * 0.9, pageH / 1.3) : Math.min(w * 0.8, pageH * 1.5);
  const pageX = (w - pageW) / 2;
  const pageY = (h - pageH) / 2;
  const padX = pageW * 0.05;
  const headH = pageH * 0.14;
  const cols = portrait ? 2 : n <= 4 ? Math.max(2, n) : Math.min(4, Math.ceil(n / 2));
  const rows = Math.ceil(n / cols);
  const cellW = (pageW - padX * 2) / cols;
  const cellH = (pageH - headH - padX * 1.3) / rows;
  const S = Math.min(cellW, cellH) * 0.84;

  const enter = ease.out(sseg(t, 0, 18));

  // page shake from the latest impact
  let shakeX = 0;
  let shakeY = 0;
  for (let i = 0; i < n; i++) {
    const ti = first + i * gap;
    const dt = t - ti;
    if (dt >= 0 && dt < 12) {
      const k = Math.pow(1 - dt / 12, 2);
      shakeY += Math.sin(dt * 2.4) * 7 * u * k;
      shakeX += Math.cos(dt * 3.1) * 3.5 * u * k * (sh(i, 3, 3) > 0.5 ? 1 : -1);
    }
  }

  const tools: React.ReactNode[] = [];
  const rings: React.ReactNode[] = [];
  const art: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const s = stamps[i];
    const ti = first + i * gap;
    const c = s.color || PALETTE[i % PALETTE.length];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const jx = (sh(i, 1, 7) - 0.5) * cellW * 0.12;
    const jy = (sh(i, 2, 7) - 0.5) * cellH * 0.1;
    const x = pageX + padX + cellW * (col + 0.5) + jx;
    const y = pageY + headH + cellH * (row + 0.5) + jy;
    const rot = (sh(i, 4, 7) - 0.5) * 28;
    const dt = t - ti;
    if (dt >= -2) {
      const land = ease.out(sseg(dt, 0, 7));
      const sc = 1.14 - 0.14 * land;
      art.push(
        <div key={'a' + i} style={{position: 'absolute', left: x - S / 2, top: y - S / 2, width: S, height: S, transform: `rotate(${rot}deg) scale(${sc})`, opacity: dt >= 0 ? 0.92 : 0, mixBlendMode: 'multiply'}}>
          <StampArt s={s} color={c} idx={i} />
        </div>,
      );
    }
    // shockwave
    if (dt >= 0 && dt < 14) {
      const k = dt / 14;
      rings.push(<circle key={'r' + i} cx={x} cy={y} r={S * (0.35 + 0.6 * ease.out(k))} fill="none" stroke={withAlpha(c, 0.4 * (1 - k))} strokeWidth={5 * u * (1 - k)} />);
    }
    // stamping tool
    const drop = ti - 9;
    if (t >= drop && t < ti + 16) {
      const down = ease.in(sseg(t, drop, ti));
      const up = ease.out(sseg(t, ti + 2, ti + 15));
      const off = (1 - down) * S * 1.5 + up * S * 1.7;
      const tw = S * 0.44;
      tools.push(
        <div key={'t' + i} style={{position: 'absolute', left: x - tw / 2, top: y - S * 0.62 - off, width: tw, opacity: 1 - up * 0.9, transform: `rotate(${rot * 0.5}deg)`}}>
          <div style={{height: S * 0.5, borderRadius: `${S * 0.2}px ${S * 0.2}px ${S * 0.07}px ${S * 0.07}px`, background: `linear-gradient(90deg, ${mixHex(c, '#000000', 0.25)}, ${c} 45%, ${mixHex(c, '#000000', 0.3)})`, boxShadow: `0 ${6 * u}px ${14 * u}px ${withAlpha('#000000', 0.3)}`}} />
          <div style={{height: S * 0.1, width: tw * 1.3, marginLeft: -tw * 0.15, borderRadius: S * 0.03, background: '#2A2420'}} />
          <div style={{height: S * 0.06, width: tw * 1.15, marginLeft: -tw * 0.075, background: '#14110F'}} />
        </div>,
      );
    }
  }

  // page decoration: faint wavy guilloche lines
  const lines: React.ReactNode[] = [];
  for (let k = 0; k < 14; k++) {
    const yy = pageY + headH + (k / 13) * (pageH - headH - padX);
    let d = `M${pageX + padX} ${yy}`;
    for (let x = 0; x <= 24; x++) d += ` L${pageX + padX + ((pageW - padX * 2) * x) / 24} ${yy + Math.sin(x * 0.9 + k) * 3.2 * u}`;
    lines.push(<path key={k} d={d} fill="none" stroke={withAlpha(p.ink, 0.045)} strokeWidth={2 * u} />);
  }

  return (
    <AbsoluteFill style={{background: bgOf(p.background), fontFamily: fonts.sans, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${shakeX}px, ${shakeY + (1 - enter) * 40 * u}px)`, opacity: enter}}>
        <div
          style={{
            position: 'absolute',
            left: pageX,
            top: pageY,
            width: pageW,
            height: pageH,
            borderRadius: 18 * u,
            background: `linear-gradient(100deg, ${mixHex(p.paper, '#000000', 0.04)}, ${p.paper} 14%, ${p.paper} 86%, ${mixHex(p.paper, '#000000', 0.05)})`,
            boxShadow: `0 ${26 * u}px ${70 * u}px ${withAlpha('#000000', 0.35)}`,
          }}
        />
        <Svg>{lines}</Svg>
        <div style={{position: 'absolute', left: pageX + padX, top: pageY + pageH * 0.03, width: pageW - padX * 2, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', color: p.ink}}>
          <div style={{fontFamily: fonts.display, fontSize: Math.min(pageH * 0.07, 62 * u), letterSpacing: 2 * u}}>{p.title}</div>
          <div style={{fontFamily: fonts.mono, fontSize: Math.min(pageH * 0.028, 24 * u), fontWeight: 700, color: p.accent, letterSpacing: 3 * u}}>
            {String(Math.max(0, Math.min(n, Math.floor((t - first) / gap) + 1))).padStart(2, '0')} / {String(n).padStart(2, '0')}
          </div>
        </div>
        <div style={{position: 'absolute', left: pageX + padX, width: pageW - padX * 2, top: pageY + headH - pageH * 0.015, height: 3 * u, background: withAlpha(p.ink, 0.25)}} />
        {art}
        <Svg>{rings}</Svg>
        {tools}
      </div>
    </AbsoluteFill>
  );
};

export const passportStamps = defineMotion<Props>({
  id: 'passport-stamps',
  title: 'Passport stamps thud on',
  category: 'document',
  description:
    'A passport page collects travel stamps one by one: a rubber-stamp tool drops, the inked stamp lands slightly rotated with a shockwave and a page shake, then the tool lifts — circle, rectangle, oval, octagon and arrow shapes in any ink colour.',
  source: ['original (round 3)'],
  useFor: 'Travel recaps, countries-visited counters, achievement / milestone collections, "places I have been" reels, loyalty-stamp and visa-approved beats — set stamps as {place, date, shape, color}.',
  durationInFrames: 210,
  defaultProps: {
    title: 'VISAS',
    stamps: [
      {place: 'Lisbon', date: '04 MAR 2025', shape: 'circle', color: '#2B4C9B'},
      {place: 'Oslo', date: '19 APR 2025', shape: 'rect', color: '#B3261E'},
      {place: 'Kyoto', date: '02 JUN 2025', shape: 'oval', color: '#1F7A4D'},
      {place: 'Cairo', date: '30 JUL 2025', shape: 'octagon', color: '#6A3FA0'},
      {place: 'Lima', date: '11 SEP 2025', shape: 'arrow', color: '#C46A12'},
      {place: 'Sydney', date: '24 NOV 2025', shape: 'circle', color: '#0C7C8A'},
    ],
    gap: 22,
    background: '#2E3A4D',
    paper: '#F4EBD6',
    ink: '#3A3326',
    accent: '#B3261E',
    startAt: 0,
  },
  propDocs: {
    title: 'heading at the top of the page',
    stamps: 'stamps in order, up to 9: {place, date, shape (circle | rect | oval | octagon | hex | arrow), color, label?} — label is the small word (default ENTRY)',
    gap: 'frames between one stamp and the next',
    background: "table / cover colour or 'transparent'",
    paper: 'page colour',
    ink: 'heading and rule colour',
    accent: 'page counter colour',
    startAt: 'frame the scene starts',
  },
  component: PassportStamps,
  tags: ['passport', 'stamps', 'travel', 'visa', 'countries', 'visited', 'airport', 'customs', 'collection', 'achievement', 'thud', 'document'],
});
