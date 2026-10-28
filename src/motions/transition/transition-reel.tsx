import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {defineMotion} from '../../core/types';
import {DEFAULTS, presentationFor, transitionFrames, TransitionSpec} from '../../transitions';

/**
 * Demo reel of every scene transition in src/transitions.tsx. Contrasting procedural colour panels,
 * each labelled with the transition that just revealed it. Entries are "type" or "type:variant".
 */
type Props = {
  types: string[];
  /** 'default' = `types` as given; 'all' = `types` + every other type/variant in transitions.json; 'extra' = only the ones `types` lacks */
  include: 'default' | 'all' | 'extra';
  holdFrames: number;
  /** 0 = each type's recommended length */
  transitionFrames: number;
  title: string;
  /** opening-panel note; `{n}` = the number of transitions */
  subtitle?: string;
  /** word before the variant name on a panel */
  variantLabel?: string;
  /** [background, ink, accent] per panel, cycled; [] = the default palette */
  panels?: string[][];
  /** per-entry note text overrides, e.g. {"wipe": "my note"} (key = "type" or "type:variant") */
  notes?: Record<string, string>;
  background?: string;
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
  'iris:ring': 'iris variant · expanding ring edge',
  'iris:medallion': 'iris variant · medallion reveal',
  'iris:marker': 'iris variant · marker-drawn circle',
  'iris:bloom': 'iris variant · soft bloom',
  'blob:fog': 'blob variant · fog bank',
  'blob:ink': 'blob variant · ink spread',
  'blob:bubble': 'blob variant · bubbles',
  'strip:shutter': 'strip variant · shutter',
  'page-turn:curl3d': 'page turn variant · 3D curl',
  'dots:halftone': 'dots variant · halftone',
  'wipe:brush': 'wipe variant · brush edge',
  'wipe:soft': 'wipe variant · soft edge',
  'wipe:mist': 'wipe variant · mist edge',
  'wipe:band': 'wipe variant · band edge',
  'diagonal:band': 'diagonal variant · band',
  'diagonal:strips': 'diagonal variant · strips',
  'bands:rows': 'bands variant · rows',
  'bands:cols': 'bands variant · columns',
  'bands:quarter': 'bands variant · quarters',
  'slide:scroll': 'slide variant · scroll',
  'tear:peel': 'tear variant · peel',
  'zoom:snap': 'zoom variant · snap',
  'push-blur:whip': 'push-blur variant · whip pan',
  strip: 'v21 eye-strip-slam',
  dots: 'v18 dot-zoom-punch',
  'dots:bokeh': 'v18 particle-burst-zoom',
  xray: 'v6 xray-hatch-hole',
  door: 'art-deco splitOpen',
  'door:revolve': 'art-deco revolve (glass wing)',
  'door:saloon': 'x4 swing-doors-reveal',
  curtain: 'paper-lantern cloudCurtain',
  'curtain:velvet': 'stage velvet curtains',
  crt: 'crt power off -> on',
  'crt:off': 'crt switch-off (pdoom crt-collapse)',
  'crt:on': 'crt power-on (20-pixel PWR)',
  tracking: 'vhs tracking-tear time jump',
  rewrite: 'sheet fig-number rewrite',
  erase: 'board erase-to-ghost',
  blinds: 'newsreel blinds (slats turn)',
  'blinds:vertical': 'paper-popup sky slats',
  'blinds:open': 'x2 field-blinds-wipe',
  tiles: 'bauhaus tile-cascade',
  'tiles:radial': 'bauhaus tile ripple (radial)',
  mosaic: 'pixel-rpg mosaic cross',
  'mosaic:swirl': 'pixel-rpg encounter swirl',
  overprint: 'risograph overprint wipe',
  scan: 'satellite scan-swap',
  'scan:tear': 'satellite map tear (light bar)',
  portal: 'scifi-toon portal wipe',
  occluder: 'shadow-puppet pillar wipe',
  'occluder:trunks': 'x5 trunk pass (parallax)',
  'occluder:foliage': 'x5 foliage close-and-part',
  'occluder:clouds': 'x5 cloud bank',
  'occluder:waves': 'x5 wave wall',
  squeegee: 'silkscreen squeegee pull',
  lights: 'projection-room lights-out',
  flood: '07-liquid flood sheets',
  stripes: '18-hanazi candy-stripe wipe',
  burn: 'pdoom page burn-through',
  brush: 'ClaudeAnimationBase brushWipe',
  ball: 'x2 ball-zoom-flood',
  shockwave: 'x2 core-shockwave-reveal',
  screen: 'x4 screen-portal-push',
  'layer-swap': 'x5 diorama layer-swap',
  expand: 'x6 container-expand',
  'expand:collapse': 'x6 collapse to a dot',
  'diagonal:stepped': 'x2 stepped-diagonal-wipe',
  'bands:line': 'x2 line-open-wipe',
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

/** every type / variant known to src/transitions.tsx, minus the ones already in `base` ('cut' excluded) */
export const extraTypes = (base: string[]): string[] => Object.keys(DEFAULTS).filter((k) => k !== 'cut' && !base.includes(k));

const resolveTypes = (types: string[], include: Props['include']): string[] =>
  include === 'all' ? [...types, ...extraTypes(types)] : include === 'extra' ? extraTypes(types) : types;

export const reelDuration = (types: string[], hold: number, tf: number) =>
  (types.length + 1) * hold + types.map(parse).reduce((a, s) => a + framesOf(s, tf), 0);

const Panel: React.FC<{index: number; total: number; name: string; variant?: string; note: string; variantLabel: string; panels: string[][]}> = ({index, total, name, variant, note, variantLabel, panels}) => {
  const frame = useCurrentFrame();
  const {width: w, height: h} = useVideoConfig();
  const u = Math.min(w, h) / 1080;
  const portrait = h > w;
  const [bg, ink, accent] = panels[index % panels.length];
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
        {variant && <div style={{fontFamily: fonts.grotesk, fontWeight: 700, fontSize: 52 * u, marginTop: 8 * u, color: accent}}>{variantLabel} {variant}</div>}
        <div style={{fontFamily: fonts.mono, fontSize: 26 * u, marginTop: 22 * u, opacity: 0.8}}>{note}</div>
      </div>
    </AbsoluteFill>
  );
};

const TransitionReel: React.FC<Props> = ({types: typesIn, include = 'default', holdFrames, transitionFrames: tf, title, subtitle = '{n} scene transitions · src/transitions.tsx', variantLabel = 'variant ·', panels: panelsIn, notes = {}, background = '#000'}) => {
  const panels = panelsIn && panelsIn.length ? panelsIn : PANELS;
  const {width, height} = useVideoConfig();
  const types = resolveTypes(typesIn, include);
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
          <Panel index={0} total={n} name={title} note={subtitle.replace('{n}', String(n))} variantLabel={variantLabel} panels={panels} />
        ) : (
          <Panel index={i} total={n} name={specs[i - 1].type} variant={specs[i - 1].variant} variantLabel={variantLabel} panels={panels} note={notes[key] ?? notes[specs[i - 1].type] ?? SOURCES[key] ?? SOURCES[specs[i - 1].type] ?? `${key} · ${framesOf(specs[i - 1], tf)} frames`} />
        )}
      </TransitionSeries.Sequence>,
    );
    if (i < n && tfs[i] > 0) {
      items.push(<TransitionSeries.Transition key={`t${i}`} presentation={presentationFor(specs[i], width, height)} timing={linearTiming({durationInFrames: tfs[i]})} />);
    }
  }
  return (
    <AbsoluteFill style={{background}}>
      <TransitionSeries>{items}</TransitionSeries>
    </AbsoluteFill>
  );
};

const DEFAULT_TYPES = [
  'fade', 'slide', 'wipe', 'clock', 'flip', 'iris', 'blob', 'tear', 'zoom', 'flash', 'flash:plain', 'glitch', 'ripple', 'spiral',
  'wave', 'wave:lines', 'bands', 'bands:center', 'diagonal', 'push-blur', 'page-turn', 'page-turn:roll', 'storm', 'storm:watercolor',
  'whiteout', 'whiteout:burnout', 'whiteout:blizzard', 'bar', 'bar:black', 'strip', 'dots', 'dots:bokeh', 'xray',
  // round 2
  'door', 'door:revolve', 'door:saloon', 'curtain', 'curtain:velvet', 'crt', 'crt:off', 'crt:on', 'tracking', 'rewrite',
  'erase', 'blinds', 'blinds:vertical', 'blinds:open', 'tiles', 'tiles:radial', 'mosaic', 'mosaic:swirl', 'overprint',
  'scan', 'scan:tear', 'portal', 'occluder', 'occluder:trunks', 'occluder:foliage', 'occluder:clouds', 'occluder:waves',
  'squeegee', 'lights', 'flood', 'stripes', 'burn', 'brush', 'ball', 'shockwave', 'screen', 'layer-swap', 'expand',
  'expand:collapse', 'diagonal:stepped', 'bands:line',
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
  defaultProps: {types: DEFAULT_TYPES, include: 'default', holdFrames: DEFAULT_HOLD, transitionFrames: 0, title: 'Transitions', subtitle: '{n} scene transitions · src/transitions.tsx', variantLabel: 'variant ·', panels: PANELS, notes: {}, background: '#000000'},
  propDocs: {
    types: 'transition entries to show in order, "type" or "type:variant" (e.g. "page-turn:roll")',
    include: '"default" = just `types`; "all" = `types` plus every other transition and variant in transitions.json (each labelled); "extra" = only the ones `types` lacks. The default render length covers only the default list: for "all"/"extra" pass a longer duration (render --frames N, N = reelDuration)',
    holdFrames: 'frames each panel holds between transitions',
    transitionFrames: 'length of every transition in frames; 0 = each type\'s recommended length',
    title: 'label on the opening panel',
    subtitle: 'note under the opening label; {n} = number of transitions',
    variantLabel: 'word before the variant name on a panel',
    panels: '[[background, ink, accent], ...] colours of the labelled panels, cycled',
    notes: 'overrides for the small note on each panel, keyed "type" or "type:variant"',
    background: 'colour behind the series (normally covered)',
  },
  component: TransitionReel,
  tags: ['transition', 'demo', 'reel', 'wipe'],
});
