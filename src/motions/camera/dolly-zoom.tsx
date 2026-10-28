import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BackPlate, DEFAULT_SCENE_PALETTE, MidPlate, Photo, SubjectPlate} from '../../core/cam-kit';
import {ease, lerp, prog} from '../../core/ease';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Dolly zoom ("vertigo"): the subject stays the same size while the world behind it stretches — background layers
 * scale up (or down) by different amounts to fake the changing perspective. Give a `src` photo (the centre of it is kept
 * fixed through a feathered cut-out) and optionally a transparent `subjectSrc` PNG; with nothing, a procedural scene is used.
 */
type Props = {
  src: string;
  subjectSrc: string;
  direction: 'in' | 'out';
  amount: number;
  startAt: number;
  hold: number;
  dollyFrames: number;
  pingpong: boolean;
  subjectSize: number;
  feather: number;
  tension: number;
  palette: string[];
  background: string;
  accent: string;
};

const DollyZoom: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const f = frame - p.startAt;
  let k = prog(f, p.hold, p.hold + p.dollyFrames, ease.inOut);
  if (p.pingpong) k = Math.min(k, 1 - prog(f, p.hold + p.dollyFrames + p.hold, p.hold + p.dollyFrames * 2 + p.hold, ease.inOut));
  const t = p.direction === 'in' ? k : 1 - k;
  const sBack = lerp(1, p.amount, t);
  const sMid = lerp(1, 1 + (p.amount - 1) * 0.55, t);
  const rad = Math.max(0.08, p.subjectSize);
  const mask = `radial-gradient(ellipse ${rad * 100}% ${rad * 100 * (w / h > 1 ? 1.2 : 0.85)}% at 50% 52%, #000 ${(1 - p.feather) * 100}%, transparent 100%)`;
  const hasSrc = !!p.src;
  return (
    <AbsoluteFill style={{background: p.background, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${sBack})`, transformOrigin: '50% 52%'}}>
        {hasSrc ? <Photo src={p.src} /> : <BackPlate i={0} pal={p.palette} />}
      </AbsoluteFill>
      {!hasSrc ? (
        <AbsoluteFill style={{transform: `scale(${sMid})`, transformOrigin: '50% 80%'}}>
          <MidPlate i={0} pal={p.palette} />
        </AbsoluteFill>
      ) : null}
      {p.subjectSrc ? (
        <AbsoluteFill style={{padding: `${h * 0.08}px ${w * 0.2}px`}}>
          <Photo src={p.subjectSrc} fit="contain" />
        </AbsoluteFill>
      ) : hasSrc ? (
        <AbsoluteFill style={{WebkitMaskImage: mask, maskImage: mask}}>
          <Photo src={p.src} />
        </AbsoluteFill>
      ) : (
        <SubjectPlate i={0} pal={p.palette} accent={p.accent} size={0.56} />
      )}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 52%, transparent ${70 - p.tension * 35 * t}%, rgba(0,0,0,${0.15 + p.tension * 0.6 * t}) 100%)`}} />
      <div style={{position: 'absolute', inset: 0, boxShadow: `inset 0 0 ${120 * u * t}px rgba(0,0,0,${0.35 * p.tension})`}} />
    </AbsoluteFill>
  );
};

export const dollyZoom = defineMotion<Props>({
  id: 'dolly-zoom',
  title: 'Dolly zoom (vertigo)',
  category: 'camera',
  description: 'Vertigo effect: the subject holds its size while the background stretches behind it, with a tightening vignette.',
  source: ['camera-vocabulary: dolly zoom / Hitchcock zoom'],
  useFor: 'A moment of dread, realisation or "oh no" on a portrait, product or place photo; thriller and true-crime beats; dramatic reveal punctuation.',
  durationInFrames: 120,
  defaultProps: {
    src: '',
    subjectSrc: '',
    direction: 'in',
    amount: 1.7,
    startAt: 0,
    hold: 14,
    dollyFrames: 78,
    pingpong: false,
    subjectSize: 0.34,
    feather: 0.45,
    tension: 0.6,
    palette: DEFAULT_SCENE_PALETTE,
    background: '#000000',
    accent: '#ffd166',
  },
  propDocs: {
    src: 'public/ path or URL of the scene/background (empty = procedural scene)',
    subjectSrc: 'optional transparent cut-out PNG kept at constant size (empty = feathered centre of src)',
    direction: 'in = background swells, out = background relaxes back',
    amount: 'final background scale (1.3 gentle, 2.2 extreme)',
    startAt: 'frame the move begins',
    hold: 'frames held still before the dolly',
    dollyFrames: 'length of the dolly',
    pingpong: 'dolly there and back',
    subjectSize: 'size of the kept centre region when only src is given (0..1)',
    feather: 'softness of that cut-out edge (0..1)',
    tension: 'vignette tightening as the dolly runs (0 = none)',
    palette: 'colours for the procedural scene',
    background: 'base colour behind the layers',
    accent: 'procedural subject accent',
  },
  component: DollyZoom,
  tags: ['dolly', 'zoom', 'vertigo', 'hitchcock', 'camera', 'perspective', 'dread', 'reveal'],
});
