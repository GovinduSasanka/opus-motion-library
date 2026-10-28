import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BackPlate, DEFAULT_SCENE_PALETTE, FrontPlate, MidPlate, Photo, SubjectPlate, mixHex} from '../../core/cam-kit';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Rack focus: three depth layers (back, subject, front). A focus puller moves the focal plane between them on `focusKeys`
 * ([frame, focus 0 = front .. 0.5 = subject .. 1 = back]); each layer's blur grows with its distance from the focal plane, bright
 * bokeh discs bloom on the blurred layer, and the lens "breathes" slightly. Any layer can be your own picture/cut-out.
 */
type Props = {
  backSrc: string;
  subjectSrc: string;
  frontSrc: string;
  focusKeys: number[][];
  maxBlur: number;
  breathing: number;
  bokeh: boolean;
  palette: string[];
  accent: string;
  background: string;
};

const RackFocus: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const keys = p.focusKeys.length ? p.focusKeys : [[0, 0.5]];
  let focus = keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i];
    const [f1, v1] = keys[i + 1];
    if (frame >= f0 && frame <= f1) focus = lerp(v0, v1, prog(frame, f0, f1, ease.inOut));
    else if (frame > f1) focus = v1;
  }
  const blurFor = (d: number) => Math.max(0, Math.abs(d - focus) - 0.04) * 2.2 * p.maxBlur * u;
  const bBack = blurFor(1);
  const bMid = blurFor(0.5);
  const bFront = blurFor(0);
  const breathe = 1 + p.breathing * (focus - 0.5) * 0.06;
  const layer = (b: number, s: number): React.CSSProperties => ({filter: b > 0.3 ? `blur(${b}px)` : undefined, transform: `scale(${s})`});
  const hi = rng(5);
  const discs = Array.from({length: 16}, () => ({x: hi() * w, y: h * (0.12 + hi() * 0.5), r: (14 + hi() * 22) * u, a: 0.5 + hi() * 0.5}));
  const bokehA = clamp((bBack / (p.maxBlur * u)) * 1.6);
  return (
    <AbsoluteFill style={{background: p.background, overflow: 'hidden'}}>
      <AbsoluteFill style={layer(bBack, breathe * 1.06)}>
        {p.backSrc ? (
          <Photo src={p.backSrc} />
        ) : (
          <>
            <BackPlate i={0} pal={p.palette} />
            <MidPlate i={0} pal={p.palette} />
          </>
        )}
      </AbsoluteFill>
      {p.bokeh ? (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: bokehA}}>
          {discs.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r * (0.6 + bokehA * 1.4)} fill={mixHex(p.palette[i % p.palette.length], '#ffffff', 0.35)} opacity={d.a * 0.55} />
          ))}
        </svg>
      ) : null}
      <AbsoluteFill style={layer(bMid, breathe)}>
        {p.subjectSrc ? (
          <AbsoluteFill style={{padding: `${h * 0.07}px ${w * 0.22}px`}}>
            <Photo src={p.subjectSrc} fit="contain" />
          </AbsoluteFill>
        ) : (
          <SubjectPlate i={0} pal={p.palette} accent={p.accent} size={0.56} />
        )}
      </AbsoluteFill>
      <AbsoluteFill style={layer(bFront, breathe * 1.03)}>{p.frontSrc ? <Photo src={p.frontSrc} /> : <FrontPlate i={0} pal={p.palette} />}</AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 62%, rgba(0,0,0,0.4) 100%)'}} />
    </AbsoluteFill>
  );
};

export const rackFocus = defineMotion<Props>({
  id: 'rack-focus',
  title: 'Rack focus',
  category: 'camera',
  description: 'Focus pulls between a foreground, a subject and a background layer: blur follows depth, bokeh blooms, lens breathes.',
  source: ['camera-vocabulary: rack focus / focus pull'],
  useFor: 'Shifting attention from one thing to another in a still-image scene; cinematic reveals; product-then-environment shots; drama beats.',
  durationInFrames: 150,
  defaultProps: {
    backSrc: '',
    subjectSrc: '',
    frontSrc: '',
    focusKeys: [[0, 0.5], [30, 0.5], [60, 0], [90, 0], [122, 1]],
    maxBlur: 46,
    breathing: 1,
    bokeh: true,
    palette: DEFAULT_SCENE_PALETTE,
    accent: '#ffd166',
    background: '#000000',
  },
  propDocs: {
    backSrc: 'background picture (empty = procedural)',
    subjectSrc: 'transparent PNG subject (empty = procedural figure)',
    frontSrc: 'transparent PNG foreground (empty = procedural blades)',
    focusKeys: '[frame, focus] keys: 0 = foreground, 0.5 = subject, 1 = background',
    maxBlur: 'blur at the furthest depth in u',
    breathing: 'lens breathing amount (0 = none)',
    bokeh: 'bokeh discs bloom on the blurred background',
    palette: 'colours for procedural layers / bokeh',
    accent: 'procedural subject accent',
    background: 'base colour',
  },
  component: RackFocus,
  tags: ['rack focus', 'focus pull', 'depth of field', 'blur', 'camera', 'cinematic', 'bokeh', 'reveal'],
});
