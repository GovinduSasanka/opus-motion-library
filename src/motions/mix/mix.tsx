import React from 'react';
import {AbsoluteFill, Freeze, useCurrentFrame} from 'remotion';
import {Layers, LayerSpec} from '../../Layers';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {h1} from '../../core/r2-e4-kit';

/**
 * Per-layer extras (all optional; a layer without any of them renders exactly as before):
 *  - halo {size, color, stamps}: a paper-coloured knock-out rim around the layer's silhouette (drop-shadow ring)
 *  - breathe {amp, bpm | beatFrames, phase, onTwos, pivot, peak[{from,to,mult}], freeze[{from,to}]}: squash / stretch with the beat
 *  - stepFps / jitterPx / jitterDeg / boilFps: stop-motion stepping and boil for ANY motion
 */
export type LayerHalo = {size?: number; color?: string; stamps?: number};
export type LayerBreathe = {
  amp?: number;
  bpm?: number;
  beatFrames?: number;
  phase?: number;
  onTwos?: boolean;
  pivot?: 'bottom' | 'center' | 'top';
  peak?: {from: number; to: number; mult?: number}[];
  freeze?: {from: number; to: number}[];
};
export type MixLayer = LayerSpec & {
  halo?: LayerHalo;
  breathe?: LayerBreathe;
  stepFps?: number;
  jitterPx?: number;
  jitterDeg?: number;
  boilFps?: number;
};

type Props = {background: string; layers: MixLayer[]};

const hasExtras = (l: MixLayer) => !!(l.halo || l.breathe || l.stepFps || l.jitterPx || l.jitterDeg || l.boilFps);

const breatheAt = (b: LayerBreathe, frame: number, fps: number) => {
  let f = frame;
  for (const z of b.freeze ?? []) if (f >= z.from && f < z.to) f = z.from;
  if (b.onTwos !== false) f = Math.floor(f / 2) * 2;
  const beat = b.beatFrames ?? (fps * 60) / (b.bpm ?? 100);
  let a = b.amp ?? 0.06;
  for (const pk of b.peak ?? []) if (f >= pk.from && f < pk.to) a *= pk.mult ?? 3;
  const c = Math.cos(2 * Math.PI * (f / beat + (b.phase ?? 0)));
  return {sy: 1 + c * a, sx: 1 - 0.6 * c * a};
};

const Extra: React.FC<{l: MixLayer; length: number}> = ({l, length}) => {
  const frame = useCurrentFrame();
  const {fps, u} = useStage();
  // time quantising (stop-motion): the whole layer sees the stepped frame
  const step = l.stepFps && l.stepFps > 0 ? Math.max(1, fps / l.stepFps) : 1;
  const qf = step > 1 ? Math.floor(frame / step) * step : frame;
  // boil / jitter on the (possibly different) boil clock
  const bstep = l.boilFps && l.boilFps > 0 ? Math.max(1, fps / l.boilFps) : step;
  const bf = Math.floor(frame / bstep);
  const jp = (l.jitterPx ?? 0) * u;
  const jd = l.jitterDeg ?? 0;
  const jx = jp ? (h1('jx', bf) - 0.5) * 2 * jp : 0;
  const jy = jp ? (h1('jy', bf) - 0.5) * 2 * jp : 0;
  const jr = jd ? (h1('jr', bf) - 0.5) * 2 * jd : 0;
  const br = l.breathe ? breatheAt(l.breathe, frame, fps) : null;
  const pivot = l.breathe?.pivot ?? 'bottom';
  const halo = l.halo;
  let filter: string | undefined;
  if (halo) {
    const n = Math.max(4, Math.min(16, Math.round(halo.stamps ?? 8)));
    const sz = (halo.size ?? 5) * u;
    const col = halo.color ?? '#f4efe4';
    filter = Array.from({length: n}, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return `drop-shadow(${(Math.cos(a) * sz).toFixed(2)}px ${(Math.sin(a) * sz).toFixed(2)}px 0 ${col})`;
    }).join(' ');
  }
  const transforms: string[] = [];
  if (jx || jy) transforms.push(`translate(${jx}px, ${jy}px)`);
  if (jr) transforms.push(`rotate(${jr}deg)`);
  if (br) transforms.push(`scale(${br.sx}, ${br.sy})`);
  const inner: MixLayer = {...l, opacity: undefined, blend: undefined};
  return (
    <AbsoluteFill style={{opacity: l.opacity ?? 1, mixBlendMode: l.blend}}>
      <AbsoluteFill
        style={{
          transformOrigin: pivot === 'bottom' ? '50% 100%' : pivot === 'top' ? '50% 0%' : '50% 50%',
          transform: transforms.length ? transforms.join(' ') : undefined,
          filter,
        }}
      >
        <Freeze frame={qf}>
          <Layers layers={[inner]} length={length} />
        </Freeze>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Mix several motions in one frame: each layer is a motion id with its own props, timing, opacity and blend. */
const Mix: React.FC<Props> = ({background, layers}) => {
  const {durationInFrames} = useStage();
  if (!layers.some(hasExtras)) {
    return (
      <AbsoluteFill style={{background}}>
        <Layers layers={layers} length={durationInFrames} />
      </AbsoluteFill>
    );
  }
  // group consecutive plain layers, render layers with extras one by one (stacking order is preserved)
  const out: React.ReactNode[] = [];
  let run: LayerSpec[] = [];
  const flush = () => {
    if (run.length) out.push(<Layers key={`g${out.length}`} layers={run} length={durationInFrames} />);
    run = [];
  };
  layers.forEach((l, i) => {
    if (hasExtras(l)) {
      flush();
      out.push(<Extra key={`x${i}`} l={l} length={durationInFrames} />);
    } else run.push(l);
  });
  flush();
  return <AbsoluteFill style={{background}}>{out}</AbsoluteFill>;
};

export const mix = defineMotion<Props>({
  id: 'mix',
  title: 'Mix (layer motions together)',
  category: 'fx',
  description: 'Stacks any motions in one frame: backdrop + subject + text + accent, each with its own timing, opacity and blend mode. Per-layer extras: knock-out halo, beat breathe (squash/stretch on the beat) and stop-motion stepping / boil.',
  source: ['library'],
  useFor: 'Building a richer shot out of several motions at once (e.g. aurora sky + neon sign + embers, or a photo look + callouts + captions).',
  durationInFrames: 180,
  defaultProps: {
    background: '#05070d',
    layers: [
      {motion: 'aurora', props: {pixelSize: 0}},
      {motion: 'blur-in-title', from: 24, props: {title: 'NORTHERN LIGHTS', subtitle: 'a mix of three motions', swapTo: null, backdrop: 'none', background: 'transparent', layout: 'upper'}},
      {motion: 'embers', props: {mode: 'motes', background: 'transparent'}, blend: 'screen'},
    ],
  },
  propDocs: {
    background: 'colour under all layers',
    layers:
      '[{motion, props?, from?, duration?, offset?, opacity?, blend?, scale?, x?, y?, style?, halo?, breathe?, stepFps?, jitterPx?, jitterDeg?, boilFps?}] bottom to top. Extras: halo {size px, color, stamps} knock-out rim; breathe {amp 0.06, bpm | beatFrames, phase, onTwos, pivot bottom|center|top, peak [{from,to,mult}], freeze [{from,to}]} squash/stretch on the beat; stepFps (quantise the layer to N fps, e.g. 12), jitterPx / jitterDeg (seeded per-step wobble), boilFps (boil clock)',
  },
  component: Mix,
  tags: ['mix', 'layers', 'combine', 'composite', 'halo', 'knockout', 'beat', 'breathe', 'stop-motion', 'boil', 'squash', 'stretch'],
});
