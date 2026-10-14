import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {clamp, ease} from '../../core/ease';
import {n2} from '../../core/random';
import {FilmGrain, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {ChannelLayer, Plate, PlatePaletteName} from '../../core/image-kit';

/**
 * Digital glitch toolkit over an image, driven by a burst list (intensity envelope):
 *  - bands (video2 glitch-band-displace / video12 glitch-slice): horizontal bands 4–40 px, 20–40 % shifted
 *    ±2–8 % W with an RGB split (R +6, B −6 px), some tinted #2FB5A8 @40 %, re-randomised every 2 frames.
 *  - smear (video2 datamosh-column-smear): thin slices of the subject repeated upward in a 25 % W column,
 *    x jitter ±3 % W, opacity 1 − k/N, new every frame.
 *  - rewind (video8 glitch-layer-rewind): 12–20 bands each showing a different "build stage" of the image
 *    (flat / inverted / posterised / final), sliding inward from the edges and leaving black slivers.
 *  - flash (video18 rgb-split-flash): 1–2 frames of white with the picture thresholded to a black
 *    silhouette and cyan / magenta / yellow copies offset (−10, 0), (+10, 0), (0, +4).
 *  - echo (video18 chroma-echo-trail): the image jolts and leaves 8 delayed copies (2 f apart) tinted along
 *    a hue cycle h = 200 + 40k, opacity 0.85 (1 − k/9), oldest drawn first.
 */
type Kind = 'bands' | 'smear' | 'rewind' | 'flash' | 'echo';
type Burst = {at: number; frames: number; kind: Kind; strength?: number};

type Props = {
  src: string;
  seed: number;
  palette: PlatePaletteName;
  bursts: Burst[];
  intensity: number;
  maxShift: number;
  rgbSplit: number;
  tint: string;
  smearColumn: number[];
  smearY: number;
  echoCount: number;
  push: number;
  grain: number;
};

const GlitchImage: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps} = useStage();

  // camera: slow push + echo jolt
  const camAt = (f: number) => {
    let jx = 0;
    let js = 0;
    for (const b of p.bursts) {
      if (b.kind !== 'echo') continue;
      const t = (f - b.at) / b.frames;
      if (t < 0 || t > 1) continue;
      const env = Math.sin(Math.PI * t) * (b.strength ?? 1) * p.intensity;
      jx += n2('ej' + p.seed, f * 0.3, 0.5) * 110 * u * env;
      js += 0.06 * env * Math.sin(t * Math.PI * 3);
    }
    return {x: jx, s: 1.03 + (p.push / 100) * (f / fps) + js + (2.2 * Math.abs(jx)) / w};
  };
  const plateAt = (f: number, dx = 0, dy = 0, style?: React.CSSProperties, key?: React.Key) => {
    const c = camAt(f);
    return (
      <AbsoluteFill key={key} style={{transform: `translate(${c.x + dx}px, ${dy}px) scale(${c.s})`, ...style}}>
        <Plate src={p.src} seed={p.seed} palette={p.palette} />
      </AbsoluteFill>
    );
  };

  // active burst + envelope (fast attack, decaying energy)
  let active: Burst | null = null;
  let env = 0;
  let bt = 0;
  for (const b of p.bursts) {
    const t = (frame - b.at) / Math.max(1, b.frames);
    if (t >= 0 && t < 1) {
      active = b;
      bt = t;
      env = (b.strength ?? 1) * p.intensity * (b.kind === 'flash' ? 1 : Math.min(1, t * 6) * Math.pow(1 - t, 0.6));
    }
  }

  const layers: React.ReactNode[] = [];
  const K = active?.kind;

  if (K === 'bands' || K === 'rewind') {
    const hold = K === 'rewind' ? 1.5 : 2;
    const sd = Math.floor(frame / hold);
    const rr = (i: number, k: string) => random(`g${p.seed}-${sd}-${i}-${k}`);
    let y = 0;
    let i = 0;
    const shiftMax = p.maxShift * w * env;
    while (y < h) {
      const bh = K === 'rewind' ? (0.02 + 0.06 * rr(i, 'h')) * h : (4 + 36 * Math.pow(rr(i, 'h'), 1.6)) * u;
      const glitched = K === 'rewind' || rr(i, 'g') < 0.22 + 0.25 * env;
      if (glitched && env > 0.02) {
        const sign = rr(i, 's') < 0.5 ? -1 : 1;
        const dx = K === 'rewind' ? sign * (0.005 + 0.035 * rr(i, 'd')) * w * env * 1.4 : sign * (0.25 + 0.75 * rr(i, 'd')) * shiftMax;
        const split = p.rgbSplit * u * (0.5 + env);
        let stageStyle: React.CSSProperties | undefined;
        if (K === 'rewind') {
          const N = 3;
          const jit = Math.floor(rr(i, 'j') * 3) - 1;
          const s = clamp(Math.round(N - Math.sin(Math.PI * bt) * N * 1.15 + jit), 0, N);
          stageStyle = [{filter: 'grayscale(1) brightness(1.5) contrast(0.55)'}, {filter: 'invert(1) hue-rotate(180deg) saturate(1.4)'}, {filter: 'contrast(1.9) saturate(2.2)'}, undefined][s];
        }
        const tinted = K === 'bands' && rr(i, 't') < 0.25;
        layers.push(
          <div key={`b${i}`} style={{position: 'absolute', left: 0, top: y, width: w, height: bh, overflow: 'hidden', background: '#000', isolation: 'isolate'}}>
            <div style={{position: 'absolute', left: 0, top: -y, width: w, height: h}}>
              {K === 'bands' ? (
                <>
                  <ChannelLayer ch="r">{plateAt(frame, dx + split, 0)}</ChannelLayer>
                  <ChannelLayer ch="g">{plateAt(frame, dx, 0)}</ChannelLayer>
                  <ChannelLayer ch="b">{plateAt(frame, dx - split, 0)}</ChannelLayer>
                </>
              ) : (
                plateAt(frame, dx, 0, stageStyle)
              )}
            </div>
            {tinted && <div style={{position: 'absolute', inset: 0, background: p.tint, opacity: 0.4, mixBlendMode: 'screen'}} />}
          </div>,
        );
      }
      y += bh;
      i++;
    }
    if (K === 'rewind') {
      // black slivers at the frame edges (bands slid inward)
      layers.push(<div key="sl" style={{position: 'absolute', left: 0, top: 0, width: 0.02 * w * env, height: h, background: '#000'}} />);
      layers.push(<div key="sr" style={{position: 'absolute', right: 0, top: 0, width: 0.015 * w * env, height: h, background: '#000'}} />);
    }
  }

  if (K === 'smear') {
    const [c0, c1] = [p.smearColumn[0] ?? 0.42, p.smearColumn[1] ?? 0.67];
    const x0 = c0 * w;
    const cw = (c1 - c0) * w;
    const ys = p.smearY * h;
    const N = 34;
    for (let k = 0; k < N; k++) {
      const r = (q: string) => random(`sm${p.seed}-${frame}-${k}-${q}`);
      const sh = Math.max((3 + 7 * r('h')) * u, (ys / N) * (0.7 + 0.7 * r('o')));
      const ysrc = ys + (r('y') - 0.3) * 14 * u;
      const ydst = ys - (k + 1) * (ys / N) * (0.75 + 0.5 * env);
      const jx = (r('x') - 0.5) * 0.06 * w;
      const op = (1 - k / N) * Math.min(1, env * 1.6);
      layers.push(
        <div key={`s${k}`} style={{position: 'absolute', left: x0, top: ydst, width: cw, height: sh, overflow: 'hidden', opacity: op}}>
          <div style={{position: 'absolute', left: -x0 + jx, top: -ysrc, width: w, height: h}}>{plateAt(frame)}</div>
        </div>,
      );
    }
    // the column itself flickers with a faint chroma edge
    layers.push(<div key="smc" style={{position: 'absolute', left: x0, top: 0, width: 2 * u, height: ys, background: p.tint, opacity: 0.35 * env}} />);
  }

  if (K === 'echo') {
    const n = p.echoCount;
    for (let k = n; k >= 1; k--) {
      const hue = (200 + 40 * k) % 360;
      layers.push(
        <AbsoluteFill key={`e${k}`} style={{isolation: 'isolate', background: '#000', mixBlendMode: 'lighten', opacity: 0.85 * (1 - k / (n + 1)) * Math.min(1, env * 2)}}>
          {plateAt(frame - 2 * k)}
          <AbsoluteFill style={{background: `hsl(${hue}, 85%, 62%)`, mixBlendMode: 'multiply'}} />
        </AbsoluteFill>,
      );
    }
  }

  const flash = K === 'flash';
  const fo = 10 * u * (0.6 + 0.4 * env);

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {flash ? (
        <AbsoluteFill style={{background: '#fff', isolation: 'isolate'}}>
          {(
            [
              ['#00ffff', -fo, 0],
              ['#ff00ff', fo, 0],
              ['#ffff00', 0, 0.4 * fo],
            ] as [string, number, number][]
          ).map(([c, dx, dy], i) => (
            <AbsoluteFill key={i} style={{isolation: 'isolate', mixBlendMode: 'multiply'}}>
              {plateAt(frame, dx, dy, {filter: 'grayscale(1) brightness(2.3) contrast(9)'})}
              <AbsoluteFill style={{background: c, mixBlendMode: 'screen'}} />
            </AbsoluteFill>
          ))}
        </AbsoluteFill>
      ) : (
        <>
          {K === 'echo' ? <AbsoluteFill style={{filter: `brightness(${1 - 0.35 * env})`}}>{plateAt(frame)}</AbsoluteFill> : plateAt(frame)}
          {layers}
        </>
      )}
      {!flash && <Vignette strength={0.3} />}
      {p.grain > 0 && <FilmGrain opacity={p.grain * 2} every={1} />}
    </AbsoluteFill>
  );
};

export const glitchImage = defineMotion<Props>({
  id: 'glitch-image',
  title: 'Glitch image bursts',
  category: 'image',
  description: 'An image hit by timed digital-glitch bursts: RGB-split band displacement, datamosh column smear, stage-rewind bands with black slivers, 1–2 frame CMY silhouette flashes and a rainbow chroma echo trail.',
  source: ['video2 glitch-band-displace + datamosh-column-smear', 'video8 0:00 glitch-layer-rewind', 'video12 0:43 glitch-slice', 'video18 rgb-split-flash + chroma-echo-trail'],
  useFor: 'Beat hits, "system error" / hacked moments, energetic transitions between stills, music-video accents.',
  durationInFrames: 150,
  defaultProps: {
    src: '',
    seed: 1,
    palette: 'dusk',
    bursts: [
      {at: 14, frames: 12, kind: 'bands', strength: 1},
      {at: 38, frames: 18, kind: 'smear', strength: 1},
      {at: 64, frames: 2, kind: 'flash'},
      {at: 68, frames: 15, kind: 'rewind', strength: 1},
      {at: 94, frames: 20, kind: 'echo', strength: 1},
      {at: 122, frames: 1, kind: 'flash'},
      {at: 124, frames: 14, kind: 'bands', strength: 0.7},
    ],
    intensity: 1,
    maxShift: 0.08,
    rgbSplit: 6,
    tint: '#2FB5A8',
    smearColumn: [0.25, 0.5],
    smearY: 0.62,
    echoCount: 8,
    push: 1,
    grain: 0.035,
  },
  propDocs: {
    src: 'public/ image path; empty = procedural plate',
    seed: 'procedural plate / glitch seed',
    palette: 'procedural plate palette: dusk | night | dawn',
    bursts: 'list of {at, frames, kind: bands|smear|rewind|flash|echo, strength} — the intensity envelope',
    intensity: 'global multiplier on every burst',
    maxShift: 'max band shift as a fraction of the width (0.02–0.08)',
    rgbSplit: 'R/B channel offset in px at 1080p inside glitched bands',
    tint: 'teal tint for some bands / smear edge',
    smearColumn: '[x0, x1] 0..1 column of the datamosh smear (≈25 % W)',
    smearY: 'source row (0..1) of the smear, i.e. the top of the subject',
    echoCount: 'number of chroma echo copies (6–10)',
    push: 'slow push-in in %/s',
    grain: 'film grain amount',
  },
  component: GlitchImage,
  tags: ['image', 'glitch', 'rgb-split', 'datamosh', 'chromatic', 'echo', 'flash', 'transition'],
});
