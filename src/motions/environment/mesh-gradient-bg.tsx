// Adapted from mg-styles-15/demos/12-aurora-glass (shaders.js FS_AURORA, main.js BLOBS/loopBezier) (MIT) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {defineMotion} from '../../core/types';
import {MeshBlobs} from '../../core/r2-mg2a-kit';
import {ease, prog} from '../../core/ease';

type Props = {
  colors: string[];
  base: string;
  blobs: number;
  speed: number;
  warp: number;
  rippleAt: number;
  grain: number;
  motes: number;
  seed: number;
  overlay: boolean;
};

const MeshGradientBg: React.FC<Props> = ({colors, base, blobs, speed, warp, rippleAt, grain, motes, seed, overlay}) => {
  const frame = useCurrentFrame();
  const fade = prog(frame, 0, 20, ease.out);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, opacity: fade}}>
        <MeshBlobs colors={colors} base={overlay ? 'transparent' : base} count={blobs} speed={speed} warp={warp} rippleAt={rippleAt} grain={grain} motes={motes} seed={seed} frameOffset={Math.round(40 * speed)} />
      </div>
    </AbsoluteFill>
  );
};

export const meshGradientBg = defineMotion<Props>({
  id: 'mesh-gradient-bg',
  title: 'Mesh gradient backdrop',
  category: 'environment',
  description: 'Big soft pools of violet, blue, cyan and magenta light drifting slowly over an indigo-black base, gently breathing, with an optional ripple of light and fine grain: the 2025-26 tech-brand backdrop.',
  source: ['mg-styles-15 demos/12-aurora-glass (MIT, FS_AURORA + BLOBS loops)'],
  useFor: 'Hero sections, AI product pages, keynote slides and any video that needs a calm premium moving backdrop. Cheap CSS mode: safe as a website MotionBackground (overlay=true for transparent base).',
  durationInFrames: 240,
  defaultProps: {
    colors: ['#7c3aed', '#2563eb', '#06b6d4', '#d946ef'],
    base: '#07061c',
    blobs: 7,
    speed: 2.2,
    warp: 90,
    rippleAt: 90,
    grain: 0.16,
    motes: 28,
    seed: 7,
    overlay: false,
  },
  propDocs: {
    colors: 'pool colours (cycled over the blobs)',
    base: 'base colour behind the pools',
    blobs: 'number of light pools (5-9)',
    speed: 'drift speed multiplier (1 = 24-40 s loops, default 2.2 so an 8 s clip visibly moves)',
    warp: 'shape breathing / rotation amplitude, 0 = rigid',
    rippleAt: 'frame of a light ripple that pushes the pools outward (-1 = none)',
    grain: 'film-grain opacity 0-0.4',
    motes: 'tiny drifting dust specks',
    seed: 'layout seed',
    overlay: 'transparent base so it layers over host content',
  },
  component: MeshGradientBg,
  tags: ['background', 'backdrop', 'mesh gradient', 'aurora', 'gradient', 'hero', 'website', 'ai', 'tech', 'saas', 'calm', 'loop', 'overlay', 'violet', 'blur', 'blobs'],
});
