import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, ease, lerp, prog} from './ease';
import {fonts} from './fonts';

/** scene-tag variants for round-2 group E3: fighter name plate, terminal box, show badge, event flag bar. */

export type TagVariantProps = {
  frame: number;
  fps: number;
  w: number;
  h: number;
  u: number;
  D: number;
  index: string;
  name: string;
  family: string;
  color: string;
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  tone: 'light' | 'dark';
  inAt: number;
  outBefore: number;
  side: 'left' | 'right';
  drift: number;
  subDelay: number;
  charsPerSecond: number;
  episode: string;
  ears: boolean;
  idleBob: number;
  twitchAt: number[];
  background: string;
};

const exitOf = (t: TagVariantProps) => prog(t.frame, t.D - t.outBefore - 8, t.D - t.outBefore, ease.in);

/* ---------------------------------------------------------------- fighter nameplate */
const Fighter: React.FC<TagVariantProps> = (t) => {
  const {frame, w, h, u, name, family, color, side, drift, subDelay, inAt} = t;
  const bw = w * (w > h ? 0.4 : 0.7);
  const bh = h * (w > h ? 0.08 : 0.06);
  const y0 = h * (t.corner.startsWith('top') ? 0.12 : 0.75);
  const right = side === 'right';
  const xStop = right ? w * 0.95 - bw : w * 0.05;
  const enter = ease.out(clamp((frame - inAt) / 2));
  const xOff = (right ? 1 : -1) * (1 - enter) * (bw + w * 0.1);
  const driftX = (right ? -1 : 1) * drift * w * clamp((frame - inAt) / 48);
  const x0 = xStop + xOff + driftX;
  const sk = Math.tan((-10 * Math.PI) / 180);
  const subIn = prog(frame, inAt + subDelay, inAt + subDelay + 6, ease.out);
  const sbw = bw * 0.6;
  const sbh = bh * 0.56;
  const out = 1 - exitOf(t);
  const fs = h * 0.055 * (w > h ? 1 : 0.8);
  const slant = (x: number, y: number, ww: number, hh: number) => `translate(${x} ${y + hh}) skewX(10) translate(${-x} ${-(y + hh)})`;
  void sk;
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, opacity: out}}>
      <defs>
        <pattern id="fgtHalf" width={7 * u} height={7 * u} patternUnits="userSpaceOnUse">
          <circle cx={3.5 * u} cy={3.5 * u} r={1.3 * u} fill="rgba(255,255,255,0.28)" />
        </pattern>
      </defs>
      <g transform={slant(x0, y0, bw, bh)}>
        <rect x={x0} y={y0 + bh} width={bw} height={bh * 0.1} fill="#0A1A4A" />
        <rect x={x0} y={y0} width={bw} height={bh} fill={color} />
        <rect x={x0} y={y0} width={bw} height={bh} fill="url(#fgtHalf)" />
      </g>
      <text x={right ? x0 + bw - bh * 0.5 : x0 + bh * 0.5} y={y0 + bh * 0.72} textAnchor={right ? 'end' : 'start'} fontFamily={fonts.display} fontStyle="italic" fontSize={fs} fill="#F0EBD3" stroke="#0A1A4A" strokeWidth={fs * 0.06} paintOrder="stroke" letterSpacing={fs * 0.04} style={{textTransform: 'uppercase'}}>
        {name}
      </text>
      {family && (
        <g opacity={subIn} transform={`translate(${(1 - subIn) * (right ? 12 : -12) * u} 0)`}>
          <g transform={slant(right ? x0 + bw - sbw : x0, y0 + bh * 1.35, sbw, sbh)}>
            <rect x={right ? x0 + bw - sbw : x0} y={y0 + bh * 1.35} width={sbw} height={sbh} fill="#071435" />
          </g>
          <text x={right ? x0 + bw - bh * 0.5 : x0 + bh * 0.5} y={y0 + bh * 1.35 + sbh * 0.68} textAnchor={right ? 'end' : 'start'} fontFamily={fonts.mono} fontWeight={700} fontSize={sbh * 0.5} fill="#55C5F9" letterSpacing={sbh * 0.15}>
            {family.toUpperCase()}
          </text>
        </g>
      )}
    </svg>
  );
};

/* ---------------------------------------------------------------- terminal box */
const Terminal: React.FC<TagVariantProps> = (t) => {
  const {frame, fps, w, h, u, index, name, color, tone, inAt, charsPerSecond, D} = t;
  const dark = tone === 'dark';
  const bg = color;
  const fg = dark ? '#16181D' : '#F4F1E8';
  const bx = 70 * u * (w > h ? 1 : 0.6);
  const by = 62 * u * (w > h ? 1 : 1.2);
  const live = D < fps * 1.5;
  const cps = charsPerSecond > 0 ? charsPerSecond : live ? 110 : 40;
  const idTxt = `▶ ${index}`;
  const nId = Math.max(0, Math.floor(((frame - inAt - 4) / fps) * cps));
  const nDesc = Math.max(0, Math.floor(((frame - inAt - 4) / fps) * cps) - idTxt.length - 3);
  const pop = ease.back ? ease.back(clamp((frame - inAt) / (0.18 * fps))) : ease.out(clamp((frame - inAt) / (0.18 * fps)));
  const sc = clamp(pop, 0, 1.15);
  const idFs = 54 * u * (w > h ? 1 : 0.75);
  const dFs = 40 * u * (w > h ? 1 : 0.75);
  const bwid = Math.max(360 * u, Math.max(idTxt.length * idFs * 0.5, name.length * dFs * 0.5) + 60 * u);
  const bhei = 118 * u * (w > h ? 1 : 0.9);
  const cursorOn = Math.floor(frame / (fps / 6)) % 2 === 0;
  const shown = idTxt.slice(0, nId);
  const idDone = nId >= idTxt.length;
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, opacity: 1 - exitOf(t)}}>
      <g transform={`translate(${bx} ${by}) scale(${sc})`} opacity={clamp(sc * 1.5)}>
        <rect x={0} y={0} width={bwid} height={bhei} rx={12 * u} fill={bg} stroke={fg} strokeWidth={5 * u} />
        <text x={24 * u} y={bhei * 0.5} fontFamily={fonts.mono} fontWeight={700} fontSize={idFs * 0.8} fill={fg}>
          {shown}
          {(!idDone || nDesc <= 0) && cursorOn && <tspan fill={fg}>█</tspan>}
        </text>
        <text x={24 * u} y={bhei * 0.82} fontFamily={fonts.mono} fontSize={dFs * 0.7} fill={fg} opacity={0.9}>
          {name.slice(0, nDesc)}
          {idDone && nDesc > 0 && nDesc < name.length && cursorOn && '█'}
        </text>
      </g>
    </svg>
  );
};

/* ---------------------------------------------------------------- show badge */
const Badge: React.FC<TagVariantProps> = (t) => {
  const {frame, fps, w, h, u, name, color, tone, corner, inAt, episode, ears, idleBob, twitchAt} = t;
  const dark = tone === 'dark';
  const ink = dark ? '#1B1D24' : '#FBF8F0';
  const fs = Math.min(h * 0.036, w * 0.05);
  const pw = name.length * fs * 0.9 + fs * 2.6 + (episode ? episode.length * fs * 0.5 + fs * 1.4 : 0);
  const ph = fs * 2.2;
  const right = corner.endsWith('right');
  const top = corner.startsWith('top');
  const px = right ? w - w * 0.05 - pw : w * 0.05;
  const py = top ? h * 0.055 : h - h * 0.07 - ph;
  const fly = ease.out(clamp((frame - inAt) / 14));
  const overshoot = fly >= 1 ? 1 : fly;
  const bob = Math.sin((frame / fps) * Math.PI * 2 * 0.8) * idleBob * u * clamp((frame - inAt - 14) / 10);
  const dy = (1 - overshoot) * (top ? -1 : 1) * (ph + h * 0.06) + bob;
  let tw = 0;
  for (const a of twitchAt) {
    const k = (frame - a) / 8;
    if (k >= 0 && k <= 1) tw = Math.sin(k * Math.PI) * 14;
  }
  const earW = ph * 0.46;
  const ear = (x: number, rot: number, twt: number) => (
    <path d={`M ${x - earW / 2} 0 L ${x} ${-ph * 0.5} L ${x + earW / 2} 0 Z`} fill={color} transform={`rotate(${rot + twt} ${x} 0)`} />
  );
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, opacity: 1 - exitOf(t)}}>
      <g transform={`translate(${px} ${py + dy})`}>
        {ears && (
          <g>
            {ear(ph * 0.9, -8, -tw)}
            {ear(pw - ph * 0.9, 8, tw * 0.4)}
          </g>
        )}
        <rect x={0} y={0} width={pw} height={ph} rx={ph / 2} fill={color} />
        <rect x={ph * 0.12} y={ph * 0.12} width={pw - ph * 0.24} height={ph * 0.76} rx={ph * 0.38} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5 * u} />
        <text x={ph * 0.7} y={ph * 0.65} fontFamily={fonts.display} fontSize={fs} fill={ink} letterSpacing={fs * 0.1} style={{textTransform: 'uppercase'}}>
          {name}
        </text>
        {episode && (
          <g>
            <rect x={pw - episode.length * fs * 0.5 - fs * 1.5} y={ph * 0.2} width={episode.length * fs * 0.5 + fs * 0.9} height={ph * 0.6} rx={ph * 0.3} fill={ink} opacity={0.92} />
            <text x={pw - fs * 1.05 - (episode.length * fs * 0.5) / 2 + fs * 0.05} y={ph * 0.62} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={fs * 0.62} fill={color} letterSpacing={fs * 0.05}>
              {episode}
            </text>
          </g>
        )}
      </g>
    </svg>
  );
};

/* ---------------------------------------------------------------- event flag bar */
const Flag: React.FC<TagVariantProps> = (t) => {
  const {frame, w, h, u, index, name, color, inAt} = t;
  const bh = h * 0.075;
  const bw = Math.min(w * 0.7, Math.max(w * 0.3, (index.length + name.length) * bh * 0.38 + bh * 2.2));
  const x0 = w / 2 - bw / 2;
  const a = ease.out(clamp((frame - inAt) / 9));
  const y = h - h * 0.08 - bh + (1 - a) * (bh + h * 0.1);
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, opacity: 1 - exitOf(t)}}>
      <g transform={`translate(0 ${y - (h - h * 0.08 - bh)})`}>
        <rect x={x0} y={h - h * 0.08 - bh} width={bw} height={bh} fill={color} />
        <rect x={x0} y={h - h * 0.08 - bh} width={bh * 0.22} height={bh} fill="#000" opacity={0.85} />
        <text x={x0 + bh * 0.55} y={h - h * 0.08 - bh * 0.32} fontFamily={fonts.mono} fontWeight={700} fontSize={bh * 0.46} fill="#0B0B0B" letterSpacing={bh * 0.04}>
          {index}
          <tspan fontFamily={fonts.sans} fontWeight={600} dx={bh * 0.4}>
            {name.toUpperCase()}
          </tspan>
        </text>
      </g>
    </svg>
  );
};

export const TagVariant: React.FC<{variant: 'fighter' | 'terminal' | 'badge' | 'flag'; t: TagVariantProps}> = ({variant, t}) => (
  <AbsoluteFill style={{background: t.background, pointerEvents: 'none'}}>
    {variant === 'fighter' ? <Fighter {...t} /> : variant === 'terminal' ? <Terminal {...t} /> : variant === 'badge' ? <Badge {...t} /> : <Flag {...t} />}
  </AbsoluteFill>
);

void lerp;
