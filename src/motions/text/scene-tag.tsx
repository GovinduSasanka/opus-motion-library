import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {TagVariant} from '../../core/r2-e3-tag';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Premium index tag for showreels and galleries: a small glass pill in a corner with an index
 * ("042 / 108"), a hairline and the item name. Slides in from its edge, holds, fades out.
 * Overlay by design (transparent background).
 */
type Props = {
  index: string;
  name: string;
  family: string;
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  tone: 'light' | 'dark';
  accent: string;
  accentDark: string;
  inAt: number;
  outBefore: number;
  background: string;
  /** round-2 variants: pill (default) | fighter | terminal | badge | flag */
  variant: 'pill' | 'fighter' | 'terminal' | 'badge' | 'flag';
  color: string;
  side: 'left' | 'right';
  drift: number;
  subDelay: number;
  charsPerSecond: number;
  episode: string;
  ears: boolean;
  idleBob: number;
  twitchAt: number[];
};

const SceneTag: React.FC<Props> = ({index, name, family, corner, tone, accent, accentDark, inAt, outBefore, background, variant, color, side, drift, subDelay, charsPerSecond, episode, ears, idleBob, twitchAt}) => {
  const frame = useCurrentFrame();
  const {u, w, h, fps, durationInFrames} = useStage();
  const enter = prog(frame, inAt, inAt + 12, ease.out);
  const exit = prog(frame, durationInFrames - outBefore - 8, durationInFrames - outBefore, ease.in);
  const right = corner.endsWith('right');
  const top = corner.startsWith('top');
  const dark = tone === 'dark';
  const ink = dark ? 'rgba(18,20,24,0.92)' : 'rgba(246,243,236,0.95)';
  const dim = dark ? 'rgba(18,20,24,0.55)' : 'rgba(246,243,236,0.6)';
  const glass = dark ? 'rgba(255,255,255,0.42)' : 'rgba(10,11,14,0.38)';
  const line = prog(frame, inAt + 4, inAt + 18, ease.out);
  if (variant !== 'pill') {
    return <TagVariant variant={variant} t={{frame, fps, w, h, u, D: durationInFrames, index, name, family, color, corner, tone, inAt, outBefore, side, drift, subDelay, charsPerSecond, episode, ears, idleBob, twitchAt, background}} />;
  }
  return (
    <AbsoluteFill style={{background, pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          [top ? 'top' : 'bottom']: 44 * u,
          [right ? 'right' : 'left']: 48 * u,
          display: 'flex',
          alignItems: 'center',
          gap: 14 * u,
          flexDirection: right ? 'row-reverse' : 'row',
          padding: `${10 * u}px ${18 * u}px`,
          borderRadius: 999,
          background: glass,
          backdropFilter: `blur(${10 * u}px)`,
          border: `${1 * u}px solid ${dark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)'}`,
          opacity: enter * (1 - exit),
          transform: `translateX(${(right ? 1 : -1) * (1 - enter) * 18 * u}px)`,
        }}
      >
        <span style={{fontFamily: fonts.mono, fontSize: 15 * u, letterSpacing: '0.12em', color: dark ? accentDark : accent, fontWeight: 700}}>{index}</span>
        <span style={{width: 28 * u * line, height: 1.2 * u, background: dim}} />
        <span style={{display: 'flex', flexDirection: 'column', alignItems: right ? 'flex-end' : 'flex-start', lineHeight: 1.15}}>
          <span style={{fontFamily: fonts.sans, fontWeight: 600, fontSize: 17 * u, letterSpacing: '0.14em', textTransform: 'uppercase', color: ink}}>{name}</span>
          {family ? <span style={{fontFamily: fonts.mono, fontSize: 11 * u, letterSpacing: '0.18em', textTransform: 'uppercase', color: dim, marginTop: 3 * u}}>{family}</span> : null}
        </span>
      </div>
    </AbsoluteFill>
  );
};

export const sceneTag = defineMotion<Props>({
  id: 'scene-tag',
  title: 'Scene index tag',
  category: 'text',
  description: 'Small glass pill in a corner with an index number, a hairline and a name; slides in, holds, fades. Transparent overlay.',
  source: ['library'],
  useFor: 'Labelling items in showreels, galleries, portfolios, product feature tours and step-by-step videos.',
  durationInFrames: 120,
  defaultProps: {
    index: '042',
    name: 'Depth Descent',
    family: 'environment',
    corner: 'top-left',
    tone: 'light',
    accent: '#E9C27A',
    accentDark: '#8A5A12',
    inAt: 6,
    outBefore: 4,
    background: '#1a2230',
    variant: 'pill',
    color: '#2567D2',
    side: 'right',
    drift: 0.03,
    subDelay: 12,
    charsPerSecond: 0,
    episode: 'EP.07',
    ears: true,
    idleBob: 3,
    twitchAt: [50, 90],
  },
  propDocs: {
    index: 'index text, e.g. "042 / 108"',
    name: 'item name (shown in tracked caps)',
    family: 'small second line ("" to hide)',
    corner: 'top-left | top-right | bottom-left | bottom-right',
    tone: 'light (for dark scenes) | dark (for bright scenes)',
    background: '"transparent" to overlay (default shows a preview colour)',
    variant: "pill (default) | fighter (slanted halftone name plate + sub-bar; name, family = sub-line, color, side, drift, subDelay) | terminal (typed '> ID' box; index = id, name = description, color = box fill, charsPerSecond) | badge (pill logo with cat ears + episode tag; name, episode, ears, idleBob, twitchAt) | flag (bottom event bar; index + name, color)",
    color: 'fighter / terminal / badge / flag: main fill colour',
    side: 'fighter: which side the plate slides in from',
    drift: 'fighter: slow drift while held, as a fraction of the width',
    subDelay: 'fighter: frames before the sub-bar appears',
    charsPerSecond: 'terminal: typing speed (0 = 40, or 110 when the tag lives < 1.5 s)',
    episode: 'badge: episode tag text ("" hides)',
    ears: 'badge: cat-ear triangles',
    idleBob: 'badge: idle bob in px',
    twitchAt: 'badge: frames at which an ear twitches',
  },
  component: SceneTag,
  tags: ['label', 'index', 'lower third', 'overlay', 'showreel', 'nameplate', 'fighter', 'esports', 'terminal', 'badge', 'show-logo', 'episode', 'flag', 'event-bar', 'speaker'],
});
