import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BackPlate, DEFAULT_SCENE_PALETTE, FrontPlate, MidPlate, Photo, SubjectPlate} from '../../core/cam-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Orbit parallax: a faux-3D camera orbit around a cut-out subject. Layers (far background, mid ground, subject, foreground)
 * slide against each other by depth as the camera swings through ±`orbitDeg`; the subject also turns a little (perspective
 * rotateY) and its contact shadow slides. Use `src` for the background photo and `subjectSrc` (transparent PNG) for the subject.
 */
type Props = {
  src: string;
  subjectSrc: string;
  orbitDeg: number;
  cycles: number;
  phase: number;
  depth: number;
  tilt: number;
  subjectScale: number;
  foreground: boolean;
  shadow: boolean;
  palette: string[];
  accent: string;
  background: string;
};

const OrbitParallax: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const th = Math.sin((frame / durationInFrames) * Math.PI * 2 * p.cycles + p.phase); // -1..1 orbit position
  const px = th * p.depth * w * 0.06; // base parallax travel in px
  const hasSrc = !!p.src;
  const rotY = th * p.orbitDeg;
  const bob = Math.cos((frame / durationInFrames) * Math.PI * 2 * p.cycles + p.phase) * p.tilt * h * 0.006;
  return (
    <AbsoluteFill style={{background: p.background, overflow: 'hidden', perspective: 1400 * u}}>
      <AbsoluteFill style={{transform: `translate(${-px * 0.35}px, ${bob * 0.3}px) scale(1.18)`}}>
        {hasSrc ? <Photo src={p.src} /> : <BackPlate i={0} pal={p.palette} />}
      </AbsoluteFill>
      {!hasSrc ? (
        <AbsoluteFill style={{transform: `translate(${-px * 0.7}px, ${bob * 0.5}px) scale(1.12)`}}>
          <MidPlate i={0} pal={p.palette} />
        </AbsoluteFill>
      ) : null}
      {p.shadow ? (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <ellipse cx={w / 2 + px * 0.5} cy={h * 0.925} rx={h * 0.16 * p.subjectScale * (1 - Math.abs(th) * 0.25)} ry={h * 0.022} fill="#000" opacity={0.35} />
        </svg>
      ) : null}
      <AbsoluteFill style={{transform: `translate(${px * 0.15}px, ${bob}px) scale(${p.subjectScale}) rotateY(${rotY}deg)`, transformOrigin: '50% 90%'}}>
        {p.subjectSrc ? (
          <AbsoluteFill style={{padding: `${h * 0.06}px ${w * 0.22}px`}}>
            <Photo src={p.subjectSrc} fit="contain" />
          </AbsoluteFill>
        ) : (
          <SubjectPlate i={0} pal={p.palette} accent={p.accent} size={0.56} />
        )}
      </AbsoluteFill>
      {p.foreground && !hasSrc ? (
        <AbsoluteFill style={{transform: `translate(${px * 1.3}px, ${bob * 1.2}px) scale(1.14)`, transformOrigin: '50% 100%'}}>
          <FrontPlate i={0} pal={p.palette} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 58%, rgba(0,0,0,0.4) 100%)'}} />
    </AbsoluteFill>
  );
};

export const orbitParallax = defineMotion<Props>({
  id: 'orbit-parallax',
  title: 'Orbit parallax',
  category: 'camera',
  description: '2.5D camera orbit around a cut-out subject: depth layers slide against each other while the subject turns slightly.',
  source: ['camera-vocabulary: orbit / 2.5D parallax'],
  useFor: 'Bringing a still product, person or character photo to life; hero images and portfolio shots; photo-to-3D-feel loops.',
  durationInFrames: 150,
  defaultProps: {
    src: '',
    subjectSrc: '',
    orbitDeg: 14,
    cycles: 1,
    phase: 0,
    depth: 1,
    tilt: 1,
    subjectScale: 1,
    foreground: true,
    shadow: true,
    palette: DEFAULT_SCENE_PALETTE,
    accent: '#ffd166',
    background: '#000000',
  },
  propDocs: {
    src: 'background picture (empty = procedural layered scene)',
    subjectSrc: 'transparent PNG cut-out subject (empty = procedural figure)',
    orbitDeg: 'subject turn at the extremes of the orbit, degrees',
    cycles: 'full left-right-left orbits over the clip (loops seamlessly)',
    phase: 'starting phase in radians',
    depth: 'parallax strength multiplier',
    tilt: 'vertical bob multiplier',
    subjectScale: 'subject size multiplier',
    foreground: 'procedural foreground layer (when no src)',
    shadow: 'contact shadow under the subject',
    palette: 'procedural scene colours',
    accent: 'procedural subject accent',
    background: 'base colour',
  },
  component: OrbitParallax,
  tags: ['orbit', 'parallax', '2.5d', 'depth', 'camera', 'cutout', 'hero', 'photo'],
});
