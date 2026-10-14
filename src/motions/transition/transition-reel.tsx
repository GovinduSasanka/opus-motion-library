import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {defineMotion} from '../../core/types';
import {presentationFor, transitionFrames, TransitionSpec} from '../../transitions';

/**
 * Demo reel of every scene transition in src/transitions.tsx. Contrasting procedural colour panels,
 * each labelled with the transition that just revealed it. Entries are "type" or "type:variant".
 */
type Props = {
  types: string[];
  holdFrames: number;
  /** 0 = each type's recommended length */
  transitionFrames: number;
  title: string;
};

const SOURCES: Record<string, string> = {
  fade: 'crossfade',
  slide: 'remotion slide · v10 / v17 cards',
  wipe: 'remotion wipe',
  clock: 'remotion clock wipe · v19 HUD',
  flip: 'remotion 3D flip',
  iris: 'v4 iris-reveal-from-dot',
  blob: 'v11 x-ray blob reveal',
  tear: 'v10 torn-paper-wipe · v14 torn-seam',
  zoom: 'zoom-through · v4 v6 v19',
  flash: 'v6 light-hole-expand',
  'flash:plain': 'overexposed white flash',
  glitch: 'v8 glitch-layer-rewind',
  ripple: 'v17 ripple-flood',
  spiral: 'v17 spiral-wipe',
  wave: 'v17 liquid-wave-wipe',
  'wave:lines': 'v20 wave-line-wipe',
  bands: 'v17 luma-ramp-wipe',
  'bands:center': 'v17 bar-expand-wipe',
  diagonal: 'v6 diagonal-palette-wipe',
  'push-blur': 'v10 push-slide-blur · v20 whip-pan-truck',
  'page-turn': 'v1 page-turn-cover',
  'page-turn:roll': 'v9 paper-roll-wipe',
  storm: 'v1 storm-wall-wipe',
  'storm:watercolor': 'v1 watercolor-front-wipe',
  whiteout: 'v16 bloom-whiteout',
  'whiteout:burnout': 'v16 glow-burnout-cut',
  'whiteout:blizzard': 'v21 blizzard-whiteout-dissolve',
  bar: 'v19 bar-slide-wipe',
  'bar:black': 'v19 bar-slide-wipe (bar on black)',
  strip: 'v21 eye-strip-slam',
  dots: 'v18 dot-zoom-punch',
  'dots:bokeh': 'v18 particle-burst-zoom',
  xray: 'v6 xray-hatch-hole',
};

/** alternating dark / light panels so every transition is visible: [background, ink, accent] */
const PANELS: [string, string, string][] = [
  ['#1F2A44', '#F4EFE6', '#F2C84B'],
  ['#F2C84B', '#1A1A1A', '#E4572E'],
  ['#0E0E10', '#F4EFE6', '#17A398'],
  ['#F4EFE6', '#1F2A44', '#E4572E'],
  ['#E4572E', '#FFF4E6', '#1F2A44'],
  ['#C9D6EA', '#1F2A44', '#3383CB'],
  ['#2B2D42', '#F2C84B', '#E4572E'],
  ['#17A398', '#0E1B1A', '#F3E9D2'],
];

const parse = (s: string): TransitionSpec => {
  const [type, variant] = s.split(':');
  return {type: type as TransitionSpec['type'], variant: variant || undefined};
};

const framesOf = (spec: TransitionSpec, tf: number) => (spec.type === 'cut' ? 0 : tf > 0 ? tf : transitionFrames(spec));

export const reelDuration = (types: string[], hold: number, tf: number) =>
  (types.length + 1) * hold + types.map(parse).reduce((a, s) => a + framesOf(s, tf), 0);

const Panel: React.FC<{index: number; total: number; name: string; variant?: string; note: string}> = ({index, total, name, variant, note}) => {
  const frame = useCurrentFrame();
  const {width: w, height: h} = useVideoConfig();
  const u = Math.min(w, h) / 1080;
  const portrait = h > w;
  const [bg, ink, accent] = PANELS[index % PANELS.length];
  const enter = prog(frame, 4, 22, ease.out);
  const label = name.toUpperCase();
  const size = Math.min(190 * u, (w * 0.86) / Math.max(4, label.length * 0.78));
  const ringR = Math.min(w, h) * 0.34;
  const rcx = portrait ? w * 0.5 : w * 0.74;
  const rcy = portrait ? h * 0.3 : h * 0.5;
  const rot = frame * 0.8;
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) dots.push(<circle key={`${i}-${j}`} cx={w * 0.06 + i * 26 * u} cy={h - 70 * u - j * 26 * u} r={4 * u} fill={ink} opacity={0.28} />);
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 7}, (_, k) => (
          <line key={k} x1={-w * 0.1 + k * 0.17 * w} y1={0} x2={k * 0.17 * w + w * 0.1} y2={h} stroke={ink} strokeOpacity={0.06} strokeWidth={40 * u} />
        ))}
        <circle cx={rcx} cy={rcy} r={ringR} fill="none" stroke={accent} strokeWidth={34 * u} opacity={0.9} />
        <circle
          cx={rcx}
          cy={rcy}
          r={ringR * 0.72}
          fill="none"
          stroke={ink}
          strokeWidth={10 * u}
          strokeDasharray={`${30 * u} ${22 * u}`}
          transform={`rotate(${rot} ${rcx} ${rcy})`}
          opacity={0.55}
        />
        <circle cx={rcx + Math.cos(rot / 30) * ringR * 0.42} cy={rcy + Math.sin(rot / 30) * ringR * 0.42} r={26 * u} fill={accent} />
        {dots}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: portrait ? w * 0.07 : w * 0.06,
          right: portrait ? w * 0.07 : undefined,
          top: portrait ? h * 0.56 : h * 0.3,
          color: ink,
          transform: `translateY(${(1 - enter) * 40 * u}px)`,
          opacity: enter,
        }}
      >
        <div style={{fontFamily: fonts.mono, fontSize: 28 * u, letterSpacing: 4 * u, opacity: 0.75}}>
          {String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </div>
        <div style={{fontFamily: fonts.display, fontSize: size, lineHeight: 1.0, marginTop: 14 * u, whiteSpace: 'nowrap'}}>{label}</div>
        {variant && <div style={{fontFamily: fonts.grotesk, fontWeight: 700, fontSize: 52 * u, marginTop: 8 * u, color: accent}}>variant · {variant}</div>}
        <div style={{fontFamily: fonts.mono, fontSize: 26 * u, marginTop: 22 * u, opacity: 0.8}}>{note}</div>
      </div>
    </AbsoluteFill>
  );
};

const TransitionReel: React.FC<Props> = ({types, holdFrames, transitionFrames: tf, title}) => {
  const {width, height} = useVideoConfig();
  const specs = types.map(parse);
  const tfs = specs.map((s) => framesOf(s, tf));
  const n = specs.length;
  const items: React.ReactNode[] = [];
  for (let i = 0; i <= n; i++) {
    const d = holdFrames + (i > 0 ? tfs[i - 1] : 0) + (i < n ? tfs[i] : 0);
    const key = i > 0 ? types[i - 1] : '';
    items.push(
      <TransitionSeries.Sequence key={`s${i}`} durationInFrames={Math.max(1, d)}>
        {i === 0 ? (
          <Panel index={0} total={n} name={title} note={`${n} scene transitions · src/transitions.tsx`} />
        ) : (
          <Panel index={i} total={n} name={specs[i - 1].type} variant={specs[i - 1].variant} note={SOURCES[key] ?? SOURCES[specs[i - 1].type] ?? ''} />
        )}
      </TransitionSeries.Sequence>,
    );
    if (i < n && tfs[i] > 0) {
      items.push(<TransitionSeries.Transition key={`t${i}`} presentation={presentationFor(specs[i], width, height)} timing={linearTiming({durationInFrames: tfs[i]})} />);
    }
  }
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <TransitionSeries>{items}</TransitionSeries>
    </AbsoluteFill>
  );
};

const DEFAULT_TYPES = [
  'fade', 'slide', 'wipe', 'clock', 'flip', 'iris', 'blob', 'tear', 'zoom', 'flash', 'flash:plain', 'glitch', 'ripple', 'spiral',
  'wave', 'wave:lines', 'bands', 'bands:center', 'diagonal', 'push-blur', 'page-turn', 'page-turn:roll', 'storm', 'storm:watercolor',
  'whiteout', 'whiteout:burnout', 'whiteout:blizzard', 'bar', 'bar:black', 'strip', 'dots', 'dots:bokeh', 'xray',
];
const DEFAULT_HOLD = 36;

export const transitionReel = defineMotion<Props>({
  id: 'transition-reel',
  title: 'Transition reel',
  category: 'transition',
  description: 'Every scene transition in the library, one after another, between contrasting labelled colour panels.',
  source: ['video1', 'video4', 'video6', 'video8', 'video9', 'video10', 'video11', 'video14', 'video16', 'video17', 'video18', 'video19', 'video20', 'video21'],
  useFor: 'Previewing and choosing transitions; each panel names the transition (and variant) that revealed it.',
  durationInFrames: reelDuration(DEFAULT_TYPES, DEFAULT_HOLD, 0),
  defaultProps: {types: DEFAULT_TYPES, holdFrames: DEFAULT_HOLD, transitionFrames: 0, title: 'Transitions'},
  propDocs: {
    types: 'transition entries to show in order, "type" or "type:variant" (e.g. "page-turn:roll")',
    holdFrames: 'frames each panel holds between transitions',
    transitionFrames: 'length of every transition in frames; 0 = each type\'s recommended length',
    title: 'label on the opening panel',
  },
  component: TransitionReel,
  tags: ['transition', 'demo', 'reel', 'wipe'],
});
