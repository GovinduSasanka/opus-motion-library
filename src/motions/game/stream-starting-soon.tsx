import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Crest, bgCss, bodyFont, easeOut3, fonts, headFont, initials, mixHex, mmss, sseg, withAlpha, avatarColor} from '../../core/r3-game-kit';
import {rng} from '../../core/random';
import {Svg, Vignette, useStage} from '../../core/stage';
import {estWidth} from '../../core/text-kit';
import {defineMotion} from '../../core/types';
import {TAU, loopPhase} from '../../core/ui-loop-kit';

/**
 * Looping "Starting soon" screen for a live stream or premiere: drifting diagonal stripes and orbs, a big title, a ring of
 * ticks sweeping around a live countdown, a message line and a ticker that rotates your social handles. The visuals loop
 * seamlessly; the countdown counts down second by second through the clip (set `countdownFrom` for your wait).
 * Landscape or portrait; logo is an image or a coloured initials badge.
 */
type Social = {label: string; handle: string};
type Props = {
  title: string;
  streamer: string;
  logoSrc: string;
  message: string;
  countdownFrom: number;
  socials: Social[];
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  fontFamily: string;
};

const DEFAULT_SOCIALS: Social[] = [
  {label: 'Follow', handle: '@yourhandle'},
  {label: 'Community', handle: 'yourcommunity.link'},
  {label: 'Schedule', handle: 'Live Tue / Thu / Sat'},
];

const StreamStartingSoon: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames: T, portrait, cx} = useStage();
  const head = headFont(P.fontFamily);
  const body = bodyFont(P.fontFamily);
  const mono = !P.fontFamily || P.fontFamily === 'auto' ? fonts.mono : P.fontFamily;
  const ph = loopPhase(frame, T);
  const dark = P.background && P.background !== 'transparent' ? P.background : '#0B0A1E';
  const socials = (P.socials && P.socials.length ? P.socials : DEFAULT_SOCIALS).slice(0, 5);

  // countdown
  const secs = Math.max(0, Math.round(P.countdownFrom) - Math.floor(frame / fps));
  const tickP = (frame % fps) / fps;
  const digitPulse = 1 + 0.05 * (1 - sseg(frame % fps, 0, 7));

  // layout
  const ringR = (portrait ? 262 : 192) * u;
  const ringY = h * (portrait ? 0.56 : 0.585);
  const titleY = h * (portrait ? 0.27 : 0.2);
  const words = (P.title || '').toUpperCase().split(/\s+/).filter(Boolean);
  const lines = portrait && words.length > 1 ? words : [words.join(' ')];
  let tfs = (portrait ? 190 : 150) * u;
  const widest = Math.max(...lines.map((l) => estWidth(l, tfs, 'display')));
  const maxW = w * (portrait ? 0.9 : 0.82);
  if (widest > maxW) tfs = (tfs * maxW) / widest;
  const bob = Math.sin(ph * TAU * 2) * 8 * u;

  // diagonal stripes: shift by exactly one period per loop => seamless
  const period = 220 * u;
  const shift = ph * period;
  const stripeCount = Math.ceil((w + h) / period) + 3;

  // orbs
  const orbs = [
    {c: P.accent, r: 0.42, cx: 0.22, cy: 0.3, a: 0.18, k: 1},
    {c: P.accent2, r: 0.5, cx: 0.8, cy: 0.7, a: 0.22, k: 1},
    {c: P.accent, r: 0.3, cx: 0.72, cy: 0.2, a: 0.1, k: 2},
  ];

  // particles floating up (integer cycles per loop)
  const R = rng('stream-starting-soon');
  const parts = Array.from({length: 34}, () => ({x: R(), y: R(), s: 4 + R() * 8, k: 1 + Math.floor(R() * 2), c: R() < 0.5 ? 0 : 1, ph: R()}));

  // ticker (cyclic crossfade, seamless)
  const n = socials.length;
  const seg = T / n;
  const tickerAlpha = (i: number) => {
    const d = ((((frame - (i + 0.5) * seg) % T) + T * 1.5) % T) - T / 2;
    return Math.max(0, Math.min(1, (seg / 2 + 6 - Math.abs(d)) / 12));
  };

  const ticks = 60;
  const lit = Math.floor(ph * ticks);
  const chipName = P.streamer || 'Streamer';
  const logoS = (portrait ? 128 : 92) * u;

  const brand = (
    <div style={{display: 'flex', alignItems: 'center', gap: 20 * u}}>
      <Crest size={logoS} label={initials(chipName)} color={avatarColor(chipName)} src={P.logoSrc} shape="circle" font={head} />
      <div>
        <div style={{fontFamily: head, fontSize: (portrait ? 46 : 38) * u, color: P.ink, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: 2 * u}}>{chipName}</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 10 * u, marginTop: 6 * u}}>
          <div style={{width: 14 * u, height: 14 * u, borderRadius: '50%', background: P.accent, opacity: 0.45 + 0.55 * (0.5 + 0.5 * Math.cos(ph * TAU * 6))}} />
          <div style={{fontFamily: body, fontWeight: 700, fontSize: 20 * u, letterSpacing: 5 * u, color: P.accent}}>OFFLINE</div>
        </div>
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      {bgCss(P.background) && (
        <>
          <AbsoluteFill style={{background: `linear-gradient(160deg, ${mixHex(dark, P.accent2, 0.16)}, ${dark} 55%, ${mixHex(dark, P.accent, 0.1)})`}} />
          {orbs.map((o, i) => {
            const a = ph * TAU * o.k;
            const ox = o.cx * w + Math.cos(a + i) * w * 0.04;
            const oy = o.cy * h + Math.sin(a + i) * h * 0.04;
            const rr = o.r * Math.min(w, h * 1.3);
            return <div key={i} style={{position: 'absolute', left: ox - rr, top: oy - rr, width: rr * 2, height: rr * 2, borderRadius: '50%', background: `radial-gradient(circle, ${withAlpha(o.c, o.a)}, transparent 68%)`}} />;
          })}
          <Svg>
            {Array.from({length: stripeCount}).map((_, i) => {
              const x = i * period + shift - period * 2;
              return <line key={i} x1={x} y1={h} x2={x + h * 0.6} y2={0} stroke={withAlpha(i % 2 ? P.accent : P.accent2, 0.055)} strokeWidth={46 * u} />;
            })}
          </Svg>
          <Vignette strength={0.55} />
        </>
      )}
      <Svg>
        {parts.map((p, i) => {
          const yy = (((p.y - ph * p.k) % 1) + 1) % 1;
          const x = p.x * w + Math.sin((ph * p.k + p.ph) * TAU) * 20 * u;
          const col = p.c ? P.accent : P.accent2;
          const al = 0.15 + 0.4 * Math.sin(yy * Math.PI);
          return <rect key={i} x={x - p.s * u * 0.5} y={yy * h} width={p.s * u} height={p.s * u} fill={col} opacity={al} transform={`rotate(45 ${x} ${yy * h})`} />;
        })}
      </Svg>

      {/* channel chip */}
      <div style={{position: 'absolute', left: portrait ? 0 : 70 * u, right: portrait ? 0 : undefined, top: portrait ? h * 0.075 : 56 * u, display: 'flex', justifyContent: portrait ? 'center' : 'flex-start'}}>{brand}</div>

      {/* title */}
      <div style={{position: 'absolute', left: 0, right: 0, top: titleY - (tfs * lines.length * 1.02) / 2 + bob, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        {lines.map((l, i) => (
          <div key={i} style={{position: 'relative', fontFamily: head, fontSize: tfs, lineHeight: 1.02, letterSpacing: tfs * 0.03, color: P.ink, whiteSpace: 'nowrap'}}>
            <span style={{position: 'absolute', left: 6 * u, top: 6 * u, color: P.accent, opacity: 0.9}}>{l}</span>
            <span style={{position: 'absolute', left: 12 * u, top: 12 * u, color: P.accent2, opacity: 0.5}}>{l}</span>
            <span style={{position: 'relative'}}>{l}</span>
          </div>
        ))}
      </div>

      {/* countdown ring */}
      <Svg>
        <g transform={`translate(${cx} ${ringY})`}>
          <circle r={ringR + 36 * u} fill="none" stroke={withAlpha(P.ink, 0.18)} strokeWidth={3 * u} strokeDasharray={`${18 * u} ${14 * u}`} transform={`rotate(${ph * 360})`} />
          <circle r={ringR} fill={withAlpha(dark, 0.55)} />
          {Array.from({length: ticks}).map((_, i) => {
            const a = (i / ticks) * TAU - Math.PI / 2;
            const on = i <= lit;
            const long = i % 5 === 0;
            const r1 = ringR - 4 * u;
            const r0 = r1 - (long ? 26 : 15) * u;
            return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1} stroke={on ? P.accent : withAlpha(P.ink, 0.22)} strokeWidth={(long ? 5 : 3.5) * u} strokeLinecap="round" />;
          })}
          <circle r={ringR - 46 * u} fill="none" stroke={withAlpha(P.accent2, 0.5)} strokeWidth={4 * u} strokeDasharray={1} pathLength={1} strokeDashoffset={1 - tickP} transform="rotate(-90)" />
        </g>
      </Svg>
      <div style={{position: 'absolute', left: cx - ringR, top: ringY - ringR, width: ringR * 2, height: ringR * 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontFamily: mono, fontWeight: 700, fontSize: ringR * 0.6, lineHeight: 1, color: P.ink, fontVariantNumeric: 'tabular-nums', transform: `scale(${digitPulse})`, textShadow: `0 0 ${24 * u}px ${withAlpha(P.accent, 0.5)}`}}>{mmss(secs)}</div>
        <div style={{fontFamily: body, fontWeight: 700, fontSize: ringR * 0.12, letterSpacing: ringR * 0.035, color: P.accent, marginTop: ringR * 0.07}}>{secs > 0 ? 'UNTIL WE GO LIVE' : 'ANY SECOND NOW'}</div>
      </div>

      {/* message */}
      <div style={{position: 'absolute', left: 0, right: 0, top: ringY + ringR + (portrait ? 70 : 44) * u, textAlign: 'center', fontFamily: body, fontWeight: 600, fontSize: (portrait ? 40 : 32) * u, color: withAlpha(P.ink, 0.85), padding: `0 ${60 * u}px`}}>{P.message}</div>

      {/* ticker */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: (portrait ? 150 : 92) * u, background: withAlpha('#000000', 0.5), borderTop: `${3 * u}px solid ${P.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {socials.map((s, i) => {
          const a = tickerAlpha(i);
          return (
            <div key={i} style={{position: 'absolute', display: 'flex', alignItems: 'center', gap: 22 * u, opacity: a, transform: `translateY(${(1 - a) * 14 * u}px)`}}>
              <div style={{fontFamily: body, fontWeight: 700, fontSize: (portrait ? 28 : 24) * u, letterSpacing: 5 * u, color: dark, background: P.accent, padding: `${6 * u}px ${16 * u}px`, borderRadius: 6 * u, textTransform: 'uppercase'}}>{s.label}</div>
              <div style={{fontFamily: head, fontSize: (portrait ? 44 : 40) * u, color: P.ink, whiteSpace: 'nowrap'}}>{s.handle}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

void easeOut3;

export const streamStartingSoon = defineMotion<Props>({
  id: 'stream-starting-soon',
  title: 'Stream starting soon',
  category: 'game',
  description: 'Looping "starting soon" screen: drifting stripes and orbs, a big layered title, a ring of ticks sweeping around a live mm:ss countdown, a message line and a ticker that rotates your social handles.',
  source: ['original'],
  useFor: 'Live-stream, premiere and webinar waiting screens, "be right back" and pre-roll loops. Set title, streamer, logoSrc, countdownFrom (seconds) and socials; loop it under the real countdown or render it as the idle scene.',
  durationInFrames: 300,
  defaultProps: {
    title: 'Starting Soon',
    streamer: 'Your Channel',
    logoSrc: '',
    message: 'Grab a drink, we go live in a moment',
    countdownFrom: 300,
    socials: DEFAULT_SOCIALS,
    background: '#0B0A1E',
    ink: '#FFFFFF',
    accent: '#FF3D81',
    accent2: '#7A5CFF',
    fontFamily: 'auto',
  },
  propDocs: {
    title: 'big title (STARTING SOON, BE RIGHT BACK, WE ARE LIVE...)',
    streamer: 'channel / host name shown beside the logo',
    logoSrc: 'logo image (public/ path or URL); empty = coloured initials badge',
    message: 'line under the countdown',
    countdownFrom: 'countdown start in seconds (ticks down once per second through the clip)',
    socials: 'up to 5 of {label, handle} that rotate in the bottom ticker',
    background: 'frame colour, or "transparent" to overlay content',
    ink: 'text colour',
    accent: 'main highlight colour',
    accent2: 'second colour for glow and stripes',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: StreamStartingSoon,
  tags: ['stream', 'streaming', 'starting soon', 'countdown', 'live', 'offline', 'be right back', 'waiting', 'loop', 'premiere', 'gaming', 'esports', 'webinar', 'socials', 'ticker', 'idle'],
});
