import React from 'react';
import {clamp, ease, prog} from './ease';
import {fonts} from './fonts';
import {useStage} from './stage';
import {back} from './r2-e2-kit';

/**
 * Round-2 group E2: story-caption-box variants (ornate RPG dialogue, speech bubble, banderole, paper strip).
 * Looks adapted from lemo-opuscar styles hd-2d / spy-titles / stained-glass (MIT, LemoLab) — see THIRD_PARTY_NOTICES.md.
 */

export interface StoryItem {
  text: string;
  tag?: string;
  name?: string;
  sub?: string;
  /** bubble: speaker position as frame fractions [x, y] the tail points at */
  speaker?: [number, number];
}

export interface StoryVariantProps {
  it: StoryItem;
  local: number;
  framesPerItem: number;
  charsPerSecond: number;
  size: number;
  textColor: string;
  accent: string;
  paper: string;
  ink: string;
}

const typedN = (local: number, cps: number, len: number) => clamp(Math.floor((local * cps) / 30), 0, len);

/** dark translucent plate, gold hairline border, corner ornaments, name plate on the top edge, serif text */
export const OrnateBox: React.FC<StoryVariantProps> = ({it, local, framesPerItem, size, accent, paper}) => {
  const {w, h, u, portrait} = useStage();
  const boxW = portrait ? w * 0.9 : Math.min(w * 0.7, 1300 * u);
  const fs = size * 1.15 * u;
  const typeFrames = framesPerItem * 0.9;
  const n = clamp(Math.floor((local / typeFrames) * it.text.length), 0, it.text.length);
  const done = n >= it.text.length;
  const enter = prog(local, 0, 8, ease.out);
  const corner = (rot: number, style: React.CSSProperties) => (
    <svg width={26 * u} height={26 * u} viewBox="0 0 26 26" style={{position: 'absolute', ...style, transform: `rotate(${rot}deg)`}}>
      <path d="M2 22 V2 H22" fill="none" stroke={accent} strokeWidth="2" />
      <path d="M8 8 L12 4 L16 8 L12 12 Z" fill={accent} />
    </svg>
  );
  return (
    <div style={{position: 'absolute', left: (w - boxW) / 2, width: boxW, bottom: h * 0.07, opacity: enter, transform: `translateY(${(1 - enter) * 20 * u}px)`}}>
      <div style={{position: 'relative', background: 'rgba(14,12,24,0.72)', border: `${2 * u}px solid ${accent}`, boxShadow: `0 0 0 ${5 * u}px rgba(14,12,24,0.5), 0 ${14 * u}px ${40 * u}px rgba(0,0,0,0.5)`, padding: `${fs * 0.9}px ${fs * 1.3}px ${fs * 0.7}px`, minHeight: fs * 3.2}}>
        {corner(0, {left: 4 * u, top: 4 * u})}
        {corner(90, {right: 4 * u, top: 4 * u})}
        {corner(180, {right: 4 * u, bottom: 4 * u})}
        {corner(270, {left: 4 * u, bottom: 4 * u})}
        {it.name ? (
          <div style={{position: 'absolute', left: fs * 1.1, top: -fs * 0.62, padding: `${fs * 0.1}px ${fs * 0.7}px`, background: '#16131F', border: `${2 * u}px solid ${accent}`, color: accent, fontFamily: fonts.serif, fontWeight: 700, fontSize: fs * 0.72, letterSpacing: '0.08em', textTransform: 'uppercase'}}>{it.name}</div>
        ) : null}
        <div style={{fontFamily: fonts.serif, fontWeight: 500, fontSize: fs, lineHeight: 1.4, color: paper}}>
          <span>{it.text.slice(0, n)}</span>
          <span style={{opacity: 0}}>{it.text.slice(n)}</span>
        </div>
        <div style={{position: 'absolute', right: fs * 0.8, bottom: fs * 0.45, width: fs * 0.32, height: fs * 0.32, background: accent, opacity: done ? (Math.floor(local / 12) % 2 ? 0.25 : 0.95) : 0, transform: 'rotate(45deg)'}} />
      </div>
    </div>
  );
};

/** white speech bubble, thick ink outline, pops in with overshoot, tail points at the speaker, typed text + sub line + bobbing next triangle */
export const BubbleBox: React.FC<StoryVariantProps> = ({it, local, charsPerSecond, size, ink, paper}) => {
  const {w, h, u, portrait} = useStage();
  const sp = it.speaker ?? [portrait ? 0.3 : 0.28, portrait ? 0.86 : 0.88];
  const fs = size * 1.15 * u;
  const bw = portrait ? w * 0.86 : Math.min(w * 0.58, 1100 * u);
  const bx = clamp(sp[0] * w - bw * 0.35, w * 0.04, w - bw - w * 0.04);
  const bh = fs * (it.sub ? 4.6 : 3.4);
  const by = Math.min(h * 0.62, sp[1] * h - bh - fs * 1.6);
  const pop = local < 0 ? 0 : back(prog(local, 0, 9, (x) => x), 1.8);
  const n = typedN(local, charsPerSecond, it.text.length);
  const done = n >= it.text.length;
  const typeEnd = (it.text.length / charsPerSecond) * 30;
  const subIn = prog(local, typeEnd + 2, typeEnd + 8, ease.out);
  const tipX = sp[0] * w;
  const tipY = sp[1] * h - fs * 0.2;
  const baseX = clamp(tipX, bx + bh * 0.5, bx + bw - bh * 0.5);
  const baseY = by + bh * 0.9;
  const sw = 6 * u;
  const bob = Math.sin((local / 30) * Math.PI * 4) * 6 * u;
  return (
    <>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, transformOrigin: `${baseX}px ${by + bh}px`, transform: `scale(${pop})`}}>
        <polygon points={`${baseX - fs * 0.5},${baseY} ${tipX},${tipY} ${baseX + fs * 0.35},${baseY}`} fill={paper} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
      </svg>
      <div style={{position: 'absolute', left: bx, top: by, width: bw, height: bh, boxSizing: 'border-box', background: paper, border: `${sw}px solid ${ink}`, borderRadius: 44 * u, boxShadow: `0 ${10 * u}px ${26 * u}px rgba(0,0,0,0.25)`, padding: `${fs * 0.55}px ${fs * 0.9}px`, transformOrigin: `${((baseX - bx) / bw) * 100}% 100%`, transform: `scale(${pop})`, fontFamily: fonts.sans, fontWeight: 600, fontSize: fs, color: ink, lineHeight: 1.25}}>
        <div>
          <span>{it.text.slice(0, n)}</span>
          <span style={{opacity: 0}}>{it.text.slice(n)}</span>
        </div>
        {it.sub ? <div style={{fontSize: fs * 0.7, color: '#7A5E4C', marginTop: fs * 0.25, opacity: subIn}}>{it.sub}</div> : null}
        {done && (
          <svg width={fs * 0.6} height={fs * 0.5} viewBox="0 0 10 8" style={{position: 'absolute', right: fs * 0.7, bottom: fs * 0.35 + bob * 0.5}}>
            <polygon points="0,0 10,0 5,8" fill="#E04848" />
          </svg>
        )}
      </div>
    </>
  );
};

/** parchment ribbon with curled ends and a gentle sag, unfurls from the centre; text fades in past 75 % open */
export const BanderoleBox: React.FC<StoryVariantProps> = ({it, local, size}) => {
  const {w, h, u, portrait} = useStage();
  const fs = size * 1.2 * u;
  const full = Math.min(portrait ? w * 0.92 : w * 0.7, Math.max(fs * it.text.length * 0.5 + fs * 4, w * 0.4));
  const open = prog(local, 0, 11, ease.out);
  const half = (full / 2) * open;
  const cx = w / 2;
  const cy = h * 0.82;
  const bh = fs * 2.1;
  const sag = bh * 0.12;
  const curl = bh * 0.55;
  const x0 = cx - half;
  const x1 = cx + half;
  const top = cy - bh / 2;
  const bot = cy + bh / 2;
  const body = `M${x0} ${top} Q${cx} ${top + sag * 2} ${x1} ${top} L${x1} ${bot} Q${cx} ${bot + sag * 2} ${x0} ${bot} Z`;
  const tail = (x: number, dir: number) => `M${x} ${top + sag * 0.2} L${x + dir * curl} ${top + bh * 0.12} L${x + dir * curl * 0.75} ${cy} L${x + dir * curl} ${bot - bh * 0.12} L${x} ${bot + sag * 0.2} Z`;
  const textOp = prog(open, 0.75, 1, (x) => x);
  const edge = '#b8a36a';
  const vis = open > 0.05 ? 1 : 0;
  return (
    <>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, filter: `drop-shadow(0 ${6 * u}px ${10 * u}px rgba(0,0,0,0.4))`}}>
        <path d={tail(x0 + 2, -1)} fill="#d4c28f" stroke={edge} strokeWidth={u * 1.5} opacity={vis} />
        <path d={tail(x1 - 2, 1)} fill="#d4c28f" stroke={edge} strokeWidth={u * 1.5} opacity={vis} />
        <path d={body} fill="#efe3c4" stroke={edge} strokeWidth={u * 1.5} />
        <path d={`M${x0 + bh * 0.2} ${top + bh * 0.14} Q${cx} ${top + bh * 0.14 + sag * 2} ${x1 - bh * 0.2} ${top + bh * 0.14}`} fill="none" stroke={edge} strokeWidth={u} opacity={0.7} />
        <path d={`M${x0 + bh * 0.2} ${bot - bh * 0.14} Q${cx} ${bot - bh * 0.14 + sag * 2} ${x1 - bh * 0.2} ${bot - bh * 0.14}`} fill="none" stroke={edge} strokeWidth={u} opacity={0.7} />
      </svg>
      <div style={{position: 'absolute', left: cx - full / 2 + curl, width: full - curl * 2, top: cy - bh / 2 + sag, height: bh, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: fonts.serif, fontWeight: 700, fontSize: fs, color: '#2c2113', opacity: textOp, lineHeight: 1.15}}>{it.text}</div>
    </>
  );
};

/** narrow cut-paper strip, tilted -1 deg, bottom-left, keyhole bullet, slides in from the left */
export const PaperStripBox: React.FC<StoryVariantProps> = ({it, local, size, paper, ink}) => {
  const {w, u, portrait} = useStage();
  const fs = size * 1.2 * u;
  const slide = prog(local, 0, 6, ease.out);
  const sw = Math.min(portrait ? w * 0.88 : w * 0.7, fs * it.text.length * 0.52 + fs * 3.4);
  const sh = fs * 1.9;
  const zig = (x0: number, x1: number, y: number, up: boolean) => {
    let d = '';
    const step = fs * 0.28;
    const dir = x1 >= x0 ? 1 : -1;
    for (let x = x0, i = 0; dir > 0 ? x <= x1 : x >= x1; x += step * dir, i++) d += ` L${x} ${y + (i % 2 ? (up ? -1 : 1) * 3 * u : 0)}`;
    return d;
  };
  const path = `M0 0${zig(0, sw, 0, true)} L${sw} ${sh * 0.2} L${sw - fs * 0.3} ${sh * 0.5} L${sw} ${sh * 0.8} L${sw} ${sh}${zig(sw, 0, sh, false)} L0 ${sh * 0.8} L${fs * 0.3} ${sh * 0.5} L0 ${sh * 0.2} Z`;
  return (
    <div style={{position: 'absolute', left: (portrait ? 40 : 96) * u, bottom: (portrait ? 220 : 90) * u, transformOrigin: 'left bottom', transform: `translateX(${-(1 - slide) * 60 * u}px) rotate(-1deg)`, opacity: slide}}>
      <svg width={sw} height={sh} style={{overflow: 'visible', filter: `drop-shadow(${2 * u}px ${5 * u}px ${6 * u}px rgba(0,0,0,0.4))`}}>
        <path d={path} fill={paper} />
        <g fill={ink} transform={`translate(${fs * 0.75} ${sh / 2})`}>
          <circle r={fs * 0.2} cy={-fs * 0.1} />
          <path d={`M${-fs * 0.1} ${fs * 0.05} L${fs * 0.1} ${fs * 0.05} L${fs * 0.16} ${fs * 0.42} L${-fs * 0.16} ${fs * 0.42} Z`} />
        </g>
      </svg>
      <div style={{position: 'absolute', left: fs * 1.4, top: 0, height: sh, display: 'flex', alignItems: 'center', fontFamily: fonts.grotesk, fontWeight: 700, fontSize: fs, color: ink, whiteSpace: 'nowrap', letterSpacing: '0.01em'}}>{it.text}</div>
    </div>
  );
};

export const STORY_VARIANTS: Record<string, React.FC<StoryVariantProps>> = {
  ornate: OrnateBox,
  bubble: BubbleBox,
  banderole: BanderoleBox,
  'paper-strip': PaperStripBox,
};

export const STORY_SAMPLES: Record<string, StoryItem[]> = {
  ornate: [
    {name: 'Warden', text: 'You carry the lantern now. Keep it lit until the tide turns.'},
    {name: 'Warden', text: 'The road south is long, and it does not forgive.'},
  ],
  bubble: [
    {text: 'Did you hear that?', sub: 'Hast du das gehört?', speaker: [0.3, 0.9]},
    {text: 'It came from the attic.', sub: 'Es kam vom Dachboden.', speaker: [0.7, 0.9]},
  ],
  banderole: [{text: 'The Kingdom of Lumen'}, {text: 'Anno Domini 1436'}, {text: 'Winter, the third year'}],
  'paper-strip': [{text: 'He knew the door was open.'}, {text: 'Someone had been here first.'}, {text: 'The clock stopped at nine.'}],
};
