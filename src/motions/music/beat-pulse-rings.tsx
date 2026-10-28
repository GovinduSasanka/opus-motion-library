import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {mix, rgb3, rgbaStr} from '../../core/r2-pr3-kit';

/**
 * Beat pulse rings: on every beat of a `bpm` grid a ring is emitted from the centre disc and expands / fades;
 * every `downbeatEvery`-th beat is a bigger second-colour ring with an echo. The centre disc kicks on each beat and
 * can show the tempo. Rings from earlier beats are already in flight at frame 0, so with a whole number of bars in
 * the clip (240 frames = 8 beats at 120 bpm) it loops seamlessly. Text optional, transparent-capable.
 */
type Props = {
  bpm: number;
  startAt: number;
  shape: 'circle' | 'polygon' | 'square';
  sides: number;
  lifeBeats: number;
  downbeatEvery: number;
  thickness: number;
  centerText: string;
  centerCaption: string;
  fillDisc: boolean;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  fontFamily: string;
};

const polyPath = (cx: number, cy: number, r: number, sides: number, rot: number) => {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = rot + (i / sides) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
};

const BeatPulseRings: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, cx, cy} = useStage();
  const clear = P.background === 'transparent';
  const period = (fps * 60) / Math.max(20, P.bpm);
  const life = Math.max(1, P.lifeBeats);
  const maxR = Math.hypot(w, h) * 0.5 * 0.92;
  const disc = Math.min(w, h) * 0.12;
  const sides = P.shape === 'square' ? 4 : Math.max(3, Math.round(P.sides));
  const t = frame - P.startAt;
  const kNow = Math.floor(t / period);
  const phase = (t - kNow * period) / period; // 0..1 within the current beat
  const every = Math.max(1, Math.round(P.downbeatEvery));
  const isDown = (k: number) => (((k % every) + every) % every) === 0;
  const kick = Math.pow(1 - clamp(phase), 3) * (isDown(kNow) ? 1 : 0.6);

  const rings: React.ReactNode[] = [];
  const kMin = kNow - Math.ceil(life) - 1;
  for (let k = kMin; k <= kNow; k++) {
    const age = (t - k * period) / (period * life);
    if (age < 0 || age > 1) continue;
    const down = isDown(k);
    const e = 0.6 * ease.out(age) + 0.4 * age;
    const r = disc * 1.05 + (maxR - disc * 1.05) * e * (down ? 1 : 0.78);
    const op = Math.pow(1 - age, 1.4) * (down ? 1 : 0.75);
    const sw = Math.max(1.5 * u, P.thickness * u * (down ? 1.5 : 1) * (1 - age * 0.7));
    const col = down ? P.accent2 : P.accent;
    const rot = (k * 0.31 + age * 0.5) * (down ? 1 : -1);
    const common = {fill: 'none', stroke: col, strokeWidth: sw, strokeOpacity: op, strokeLinejoin: 'round' as const};
    const draw = (rr: number, key: string, o = 1) =>
      P.shape === 'circle' ? (
        <circle key={key} cx={cx} cy={cy} r={rr} {...common} strokeOpacity={op * o} />
      ) : (
        <path key={key} d={polyPath(cx, cy, rr, sides, P.shape === 'square' ? rot * 0.4 + Math.PI / 4 : rot)} {...common} strokeOpacity={op * o} />
      );
    rings.push(draw(r, `r${k}`));
    if (down) rings.push(draw(r * 0.9, `e${k}`, 0.45));
    // faint fill wash while young
    if (down && age < 0.5) rings.push(<circle key={`w${k}`} cx={cx} cy={cy} r={r} fill={rgbaStr(col, 0.08 * (1 - age * 2))} />);
  }

  const dr = disc * (1 + kick * 0.2);
  const heading = P.fontFamily || fonts.grotesk;
  const discCol = isDown(kNow) && phase < 0.35 ? P.accent2 : P.accent;
  const lightBg = !clear && rgb3(P.background).reduce((a, b) => a + b, 0) > 384;
  const glowA = (0.25 + kick * 0.35) * (P.fillDisc ? 1 : 0.3) * (lightBg ? 0.3 : 1);
  const bg = clear ? undefined : `radial-gradient(ellipse at 50% 50%, ${mix(P.background, P.accent, 0.12)} 0%, ${P.background} 68%)`;

  return (
    <AbsoluteFill style={{background: bg}}>
      <Svg>
        <defs>
          <radialGradient id="bpr-disc" cx="0.5" cy="0.4" r="0.7">
            <stop offset="0" stopColor={mix(discCol, '#ffffff', 0.3)} />
            <stop offset="1" stopColor={discCol} />
          </radialGradient>
          <filter id="bpr-blur">
            <feGaussianBlur stdDeviation={18 * u} />
          </filter>
        </defs>
        {rings}
        <circle cx={cx} cy={cy} r={dr * 1.5} fill={discCol} opacity={glowA} filter="url(#bpr-blur)" />
        {P.fillDisc ? (
          <circle cx={cx} cy={cy} r={dr} fill="url(#bpr-disc)" />
        ) : (
          <circle cx={cx} cy={cy} r={dr} fill="none" stroke={discCol} strokeWidth={5 * u} />
        )}
        {P.centerText && (
          <text x={cx} y={cy + disc * (P.centerCaption ? 0.12 : 0.22)} textAnchor="middle" fontFamily={heading} fontWeight={700} fontSize={disc * 0.62 * (P.centerText.length > 3 ? 0.7 : 1)} fill={P.fillDisc ? P.background === 'transparent' ? '#0b0b10' : P.background : P.ink}>
            {P.centerText}
          </text>
        )}
        {P.centerText && P.centerCaption && (
          <text x={cx} y={cy + disc * 0.46} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={disc * 0.2} letterSpacing={disc * 0.05} fill={P.fillDisc ? P.background === 'transparent' ? '#0b0b10' : P.background : P.ink} opacity={0.8}>
            {P.centerCaption.toUpperCase()}
          </text>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const beatPulseRings = defineMotion<Props>({
  id: 'beat-pulse-rings',
  title: 'Beat pulse rings (bpm grid)',
  category: 'music',
  description:
    'Concentric rings pulse out of a centre disc on every beat of a bpm grid: circles, polygons or squares in two colours, bigger echoing rings on every downbeat, the disc kicking with each hit and optionally printing the tempo. Rings are already in flight at frame 0, so a whole number of bars loops seamlessly.',
  source: ['original (beat-synced pulse pattern)'],
  useFor: 'Beat-synced hooks and drops, DJ / club / radio promos, metronome and tempo explainers, heartbeat or sonar-style attention pulses behind a logo or title. Match bpm to the soundtrack.',
  durationInFrames: 240,
  defaultProps: {
    bpm: 120,
    startAt: 0,
    shape: 'circle',
    sides: 6,
    lifeBeats: 3,
    downbeatEvery: 4,
    thickness: 6,
    centerText: '120',
    centerCaption: 'BPM',
    fillDisc: true,
    background: '#0A0C16',
    ink: '#F4F5FB',
    accent: '#5B8CFF',
    accent2: '#FF6FB5',
    fontFamily: '',
  },
  propDocs: {
    bpm: 'tempo in beats per minute (the ring grid; set to the soundtrack tempo)',
    startAt: 'frame of beat 0 (shift the grid to line up with a drop)',
    shape: "'circle' | 'polygon' | 'square'",
    sides: 'number of sides when shape is polygon (3-12)',
    lifeBeats: 'how many beats a ring lives (bigger = more rings on screen)',
    downbeatEvery: 'every Nth beat is a big second-colour ring (4 = one per bar of 4/4, 1 = all)',
    thickness: 'ring stroke thickness in px at 1080p',
    centerText: 'text in the centre disc (e.g. the bpm, a logo word); empty = no text',
    centerCaption: 'small caps line under the centre text, empty to hide',
    fillDisc: 'true = solid centre disc, false = outline only',
    background: "background colour, or 'transparent' to overlay on video",
    ink: 'centre text colour when the disc is an outline',
    accent: 'colour of the normal beat rings and the disc',
    accent2: 'colour of the downbeat rings',
    fontFamily: 'optional CSS font-family for the centre text',
  },
  component: BeatPulseRings,
  tags: ['beat', 'pulse', 'rings', 'bpm', 'tempo', 'rhythm', 'music', 'loop', 'loops', 'kick', 'drop', 'dj', 'metronome', 'radio', 'ripple', 'sonar', 'audio', 'overlay'],
});
