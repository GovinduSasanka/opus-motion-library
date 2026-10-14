import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {loadFont as instrumentSerif} from '@remotion/google-fonts/InstrumentSerif';
import {clamp, ease, prog} from './ease';
import {fonts} from './fonts';
import {useStage} from './stage';

/**
 * Shared look for the video17 "12 Principles. 0 Cuts. 1 Ball." motions (bouncing-ball, ribbon-trail,
 * onion-skin-arc, easing-graph, flat-to-3d-sphere): Swiss/editorial flat vector + dev HUD chrome.
 */
export const P17 = {
  ink: '#0B0D0C',
  paper: '#EEEBDE',
  red: '#ED3821',
  blue: '#2536F4',
  yellow: '#F5CA1E',
  pink: '#F7A7CC',
  lavender: '#C9B6F2',
  grey: '#888578',
  hudGrey: '#92908D',
  hudDim: '#393939',
};

/** high-contrast italic serif for numerals / readouts (Instrument Serif Italic) */
export const serifItalic = instrumentSerif('italic', {weights: ['400'], subsets: ['latin']}).fontFamily;

/** true when a background colour is dark (HUD text flips to cream) */
export const isDarkColor = (c: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 110;
};

/** typed substring (chars per second at 30 fps) */
export const typed = (text: string, frame: number, start: number, cps = 25) => text.slice(0, Math.max(0, Math.floor(((frame - start) / 30) * cps)));

/** mono HUD label (caps, wide tracking) */
export const Mono: React.FC<{x: number; y: number; size?: number; color: string; children: React.ReactNode; anchor?: 'left' | 'right' | 'center'; opacity?: number; weight?: number}> = ({
  x,
  y,
  size = 13,
  color,
  children,
  anchor = 'left',
  opacity = 1,
  weight = 700,
}) => {
  const {u} = useStage();
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: anchor === 'right' ? 'translateX(-100%)' : anchor === 'center' ? 'translateX(-50%)' : undefined,
        fontFamily: fonts.mono,
        fontWeight: weight,
        fontSize: size * u,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        whiteSpace: 'pre',
        color,
        opacity,
        lineHeight: 1.2,
      }}
    >
      {children}
    </div>
  );
};

export type HudProps = {
  /** background the HUD sits on (text colour flips on dark) */
  bg: string;
  numeral?: string;
  title?: string;
  subtitle?: string;
  code?: string;
  header?: string;
  showTitle?: boolean;
  /** frame at which the title block rises in */
  titleAt?: number;
  bpm?: number;
};

/**
 * Persistent dev/broadcast HUD (video17 hud-chrome-overlay) + bottom-left chapter title block.
 * Crop marks, header, live timecode, typed code comment with red block cursor, beat squares, progress hairline.
 */
export const PrinciplesHud: React.FC<HudProps> = ({bg, numeral = '', title = '', subtitle = '', code = '', header = 'THE 12 PRINCIPLES OF ANIMATION', showTitle = true, titleAt = 4, bpm = 160}) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames, portrait} = useStage();
  const dark = isDarkColor(bg);
  const fg = dark ? P17.paper : P17.ink;
  const dim = dark ? P17.hudDim : '#C9C5B6';
  const sub = dark ? P17.hudGrey : '#6E6B62';
  const m = 44 * u;
  const arm = 22 * u;
  const cm = 18 * u;
  const corners: [number, number, number, number][] = [
    [cm, cm, 1, 1],
    [w - cm, cm, -1, 1],
    [cm, h - cm, 1, -1],
    [w - cm, h - cm, -1, -1],
  ];
  const sec = Math.floor(frame / 30);
  const ff = frame % 30;
  const tc = `TC 00:00:${String(sec).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
  const beatF = (60 / bpm) * 30;
  const beat = Math.floor(frame / beatF) % 4;
  const codeShown = typed(code, frame, 8, 40);
  const cursorOn = Math.floor(frame / 8) % 2 === 0 || codeShown.length < code.length;
  const p = frame / Math.max(1, durationInFrames - 1);
  const barY = h - 72 * u;
  // title block
  const rise = prog(frame, titleAt, titleAt + 12, ease.out);
  const numSize = (portrait ? 96 : 110) * u;
  const titleSize = (portrait ? 46 : 58) * u;
  const lines = title.split('\n');
  const titleBottom = h - 128 * u;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {corners.map(([x, y, sx, sy], i) => (
          <path key={i} d={`M ${x} ${y + sy * arm} L ${x} ${y} L ${x + sx * arm} ${y}`} fill="none" stroke="#888" strokeWidth={2 * u} />
        ))}
        <line x1={m} x2={w - m} y1={barY} y2={barY} stroke={dim} strokeWidth={2 * u} />
        <line x1={m} x2={m + (w - 2 * m) * p} y1={barY} y2={barY} stroke={P17.red} strokeWidth={2 * u} />
        {Array.from({length: 6}, (_, i) => {
          const x = m + ((w - 2 * m) * i) / 5;
          return <line key={i} x1={x} x2={x} y1={barY - 4 * u} y2={barY + 4 * u} stroke={dim} strokeWidth={1.5 * u} />;
        })}
        <line x1={m + (w - 2 * m) * p} x2={m + (w - 2 * m) * p} y1={barY - 7 * u} y2={barY + 7 * u} stroke={P17.red} strokeWidth={2 * u} />
        {Array.from({length: 4}, (_, i) => (
          <rect key={i} x={w - m - (4 - i) * 14 * u} y={h - 46 * u} width={9 * u} height={9 * u} fill={i === beat ? P17.red : 'none'} stroke={i === beat ? P17.red : sub} strokeWidth={1.2 * u} />
        ))}
      </svg>
      <Mono x={m} y={36 * u} color={fg}>
        {header}
      </Mono>
      <Mono x={w - m} y={36 * u} color={fg} anchor="right">
        {portrait ? 'CUTS ' : 'ONE BALL · ONE TAKE   CUTS '}
        <span style={{color: P17.red}}>00</span>
      </Mono>
      <Mono x={m} y={h - 50 * u} color={sub}>
        {tc}
      </Mono>
      {code && !portrait && (
        <Mono x={w / 2} y={h - 50 * u} color={fg} anchor="center" weight={400}>
          {codeShown}
          <span style={{background: cursorOn ? P17.red : 'transparent', color: 'transparent'}}>_</span>
        </Mono>
      )}
      <Mono x={w - m - 64 * u} y={h - 50 * u} color={sub} anchor="right">
        {`${bpm} BPM · 30 FPS`}
      </Mono>
      {code && portrait && (
        <Mono x={m} y={h - 108 * u} color={fg} weight={400} size={12}>
          {codeShown}
          <span style={{background: cursorOn ? P17.red : 'transparent', color: 'transparent'}}>_</span>
        </Mono>
      )}
      {showTitle && title && (
        <div style={{position: 'absolute', left: 88 * u - (portrait ? 30 * u : 0), top: 0, height: titleBottom - (portrait ? 40 * u : 0), display: 'flex', alignItems: 'flex-end', gap: 22 * u}}>
          <div style={{overflow: 'hidden', paddingRight: 8 * u}}>
            <div
              style={{
                fontFamily: serifItalic,
                fontStyle: 'italic',
                fontSize: numSize,
                lineHeight: 0.86,
                color: P17.red,
                transform: `translateY(${(1 - rise) * 110}%)`,
              }}
            >
              {numeral}
            </div>
          </div>
          <div style={{paddingBottom: 8 * u}}>
            {lines.map((ln, i) => {
              const r = prog(frame, titleAt + 3 + i * 3, titleAt + 15 + i * 3, ease.out);
              return (
                <div key={i} style={{overflow: 'hidden'}}>
                  <div style={{fontFamily: fonts.display, fontSize: titleSize, lineHeight: 1.0, color: fg, letterSpacing: '0.02em', transform: `translateY(${(1 - r) * 105}%)`, whiteSpace: 'nowrap'}}>
                    {ln}
                  </div>
                </div>
              );
            })}
            {subtitle && (
              <div style={{fontFamily: fonts.mono, fontSize: 13 * u, letterSpacing: '0.08em', color: sub, marginTop: 8 * u, opacity: prog(frame, titleAt + 10, titleAt + 20)}}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * Analytic gravity bounce (video17 squash-stretch-bounce): drop from rest at height h0 (px above floor),
 * gravity g (px/s^2), velocity restitution e. Returns height above floor, signed vertical velocity (up +),
 * and the time / speed of the most recent impact.
 */
export const bounceAt = (t: number, h0: number, g: number, e: number, minH = 1) => {
  if (t <= 0) return {y: h0, v: 0, lastImpact: -1, impactSpeed: 0, k: -1, rest: false};
  const T0 = Math.sqrt((2 * h0) / g);
  if (t < T0) return {y: h0 - 0.5 * g * t * t, v: -g * t, lastImpact: -1, impactSpeed: 0, k: -1, rest: false};
  let t0 = T0;
  let vk = g * T0;
  let impactV = vk;
  let k = 0;
  for (;;) {
    vk *= e;
    const hk = (vk * vk) / (2 * g);
    const dur = (2 * vk) / g;
    if (hk < minH) return {y: 0, v: 0, lastImpact: t0, impactSpeed: impactV, k, rest: true};
    if (t < t0 + dur) {
      const tau = t - t0;
      return {y: vk * tau - 0.5 * g * tau * tau, v: vk - g * tau, lastImpact: t0, impactSpeed: impactV, k, rest: false};
    }
    t0 += dur;
    impactV = vk;
    k++;
  }
};

/** list of impact times (s) and speeds for a bounce */
export const bounceImpacts = (h0: number, g: number, e: number, minH = 1) => {
  const out: {t: number; v: number}[] = [];
  let t0 = Math.sqrt((2 * h0) / g);
  let vk = g * t0;
  out.push({t: t0, v: vk});
  for (let i = 0; i < 40; i++) {
    vk *= e;
    if ((vk * vk) / (2 * g) < minH) break;
    t0 += (2 * vk) / g;
    out.push({t: t0, v: vk});
  }
  return out;
};

/** damped spring offset (video17 "caught": y = A·e^(-ζω t)·sin(ωd t)) */
export const caught = (tSec: number, A: number, zeta = 0.45, wd = 30) => {
  if (tSec <= 0) return A;
  const w0 = wd / Math.sqrt(1 - zeta * zeta);
  return A * Math.exp(-zeta * w0 * tSec) * Math.cos(wd * tSec);
};

/** red flat hero ball with optional squash (sx, sy) anchored at (ax, ay) */
export const Ball: React.FC<{x: number; y: number; r: number; sx?: number; sy?: number; ax?: number; ay?: number; color?: string; opacity?: number; blur?: number}> = ({x, y, r, sx = 1, sy = 1, ax, ay, color = P17.red, opacity = 1, blur = 0}) => {
  const px = ax ?? x;
  const py = ay ?? y;
  return (
    <g transform={`translate(${px} ${py}) scale(${sx} ${sy}) translate(${-px} ${-py})`} opacity={opacity} style={blur ? {filter: `blur(${blur}px)`} : undefined}>
      <circle cx={x} cy={y} r={r} fill={color} />
    </g>
  );
};

export {clamp};
