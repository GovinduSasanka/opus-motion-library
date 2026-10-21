import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, interpolate, useVideoConfig} from 'remotion';
import {TransitionSeries, linearTiming, springTiming} from '@remotion/transitions';
import {registry} from './registry';
import {presentationFor, transitionFrames, TransitionSpec} from './transitions';
import {CaptionTrack, CaptionCue} from './motions/text/kinetic-captions';
import {Layers, LayerSpec, MotionById} from './Layers';

export interface SceneSpec {
  /** motion id from the registry (or omit and give `layers` to mix several motions) */
  motion?: string;
  /** mix: several motions stacked in this scene, bottom to top */
  layers?: LayerSpec[];
  /** frames; defaults to the motion's own durationInFrames */
  duration?: number;
  props?: Record<string, unknown>;
  /** start the motion this many frames in (cut into the middle of a motion) */
  offset?: number;
  /** transition INTO the next scene */
  transition?: TransitionSpec;
}

export interface ComposeSpec {
  width?: number;
  height?: number;
  fps?: number;
  background?: string;
  scenes: SceneSpec[];
  /** overlay layers that run across scene boundaries, in absolute frames */
  overlays?: {motion: string; from: number; duration: number; props?: Record<string, unknown>; offset?: number; opacity?: number; blend?: React.CSSProperties['mixBlendMode']}[];
  captions?: CaptionCue[];
  /** cues used only for music ducking (when captions are hidden) */
  duckCues?: CaptionCue[];
  captionStyle?: Record<string, unknown>;
  audio?: {
    voice?: string;
    music?: string;
    musicVolume?: number;
    /** duck music to this fraction while voice cues play */
    duck?: number;
    musicStart?: number;
    /** several music beds over time: each fades in/out over `fade` frames and loops if short */
    musicCues?: {file: string; from: number; to: number; volume?: number; start?: number; fade?: number}[];
    sfx?: {file: string; at: number; volume?: number}[];
  };
}

/** a scene's length: explicit duration, else its motion's natural length (or the longest layer) */
export const sceneLength = (s: SceneSpec) =>
  s.duration ??
  (s.motion ? registry[s.motion]?.durationInFrames : undefined) ??
  Math.max(90, ...(s.layers ?? []).map((l) => (l.from ?? 0) + (l.duration ?? registry[l.motion]?.durationInFrames ?? 90)));

/** total length of a spec after transitions overlap scenes */
export const specDuration = (spec: ComposeSpec) => {
  let total = 0;
  spec.scenes.forEach((s, i) => {
    const d = sceneLength(s);
    total += d;
    if (i < spec.scenes.length - 1 && s.transition && s.transition.type !== 'cut') total -= transitionFrames(s.transition);
  });
  return total;
};

export const Compose: React.FC<{spec: ComposeSpec}> = ({spec}) => {
  const {fps, width, height} = useVideoConfig();
  const items: React.ReactNode[] = [];
  spec.scenes.forEach((s, i) => {
    const d = sceneLength(s);
    items.push(
      <TransitionSeries.Sequence key={`s${i}`} durationInFrames={d}>
        {s.layers ? (
          <Sequence from={-(s.offset ?? 0)} durationInFrames={d + (s.offset ?? 0)} layout="absolute-fill">
            <Layers layers={s.layers} length={d + (s.offset ?? 0)} />
          </Sequence>
        ) : (
          <MotionById motion={s.motion ?? ''} props={s.props} offset={s.offset} length={d} />
        )}
      </TransitionSeries.Sequence>,
    );
    if (i < spec.scenes.length - 1 && s.transition && s.transition.type !== 'cut') {
      const frames = transitionFrames(s.transition);
      items.push(
        <TransitionSeries.Transition
          key={`t${i}`}
          presentation={presentationFor(s.transition, width, height)}
          timing={s.transition.spring ? springTiming({config: {damping: 200}, durationInFrames: frames}) : linearTiming({durationInFrames: frames})}
        />,
      );
    }
  });

  const total = specDuration(spec);
  const a = spec.audio;
  const voiceCues = spec.captions ?? [];
  const duckCues = [...voiceCues, ...(spec.duckCues ?? [])];
  const musicVol = (f: number) => {
    const base = a?.musicVolume ?? 0.25;
    const fadeIn = interpolate(f, [0, fps], [0, 1], {extrapolateRight: 'clamp'});
    const fadeOut = interpolate(f, [total - fps * 2, total], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const speaking = duckCues.some((c) => f >= c.from - 6 && f <= c.to + 6);
    return base * fadeIn * fadeOut * (speaking ? a?.duck ?? 0.55 : 1);
  };

  return (
    <AbsoluteFill style={{background: spec.background ?? '#000'}}>
      <TransitionSeries>{items}</TransitionSeries>
      {(spec.overlays ?? []).map((o, i) => {
        if (!registry[o.motion]) return null;
        return (
          <Sequence key={`o${i}`} from={o.from} durationInFrames={o.duration} layout="absolute-fill">
            <AbsoluteFill style={{opacity: o.opacity ?? 1, mixBlendMode: o.blend}}>
              <MotionById motion={o.motion} props={o.props} offset={o.offset} length={o.duration} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {voiceCues.length > 0 && <CaptionTrack cues={voiceCues} {...(spec.captionStyle ?? {})} />}
      {a?.voice && <Audio src={staticFile(a.voice)} />}
      {a?.music && <Audio src={staticFile(a.music)} startFrom={Math.round((a.musicStart ?? 0) * fps)} volume={musicVol} loop />}
      {(a?.musicCues ?? []).map((m, i) => {
        const fade = m.fade ?? fps;
        const len = m.to - m.from;
        return (
          <Sequence key={`mc${i}`} from={m.from} durationInFrames={len}>
            <Audio
              src={staticFile(m.file)}
              loop
              startFrom={Math.round((m.start ?? 0) * fps)}
              volume={(f) => {
                const env = Math.min(interpolate(f, [0, fade], [0, 1], {extrapolateRight: 'clamp'}), interpolate(f, [len - fade, len], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
                const g = m.from + f;
                const speaking = duckCues.some((c) => g >= c.from - 6 && g <= c.to + 6);
                return (m.volume ?? a?.musicVolume ?? 0.25) * env * (speaking ? a?.duck ?? 0.55 : 1);
              }}
            />
          </Sequence>
        );
      })}
      {(a?.sfx ?? []).map((s, i) => (
        <Sequence key={`fx${i}`} from={s.at}>
          <Audio src={staticFile(s.file)} volume={s.volume ?? 0.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
