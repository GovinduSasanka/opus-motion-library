import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useStage} from './stage';

/**
 * Portrait-only zoom of a motion's content layer (landscape/square render the children untouched).
 * s = scale, ox/oy = transform origin (0..1 of the frame), dy = vertical shift as a fraction of the frame height.
 */
export const PortraitFit: React.FC<{s: number; ox?: number; oy?: number; dy?: number; children: React.ReactNode}> = ({s, ox = 0.5, oy = 0.5, dy = 0, children}) => {
  const {portrait, h} = useStage();
  if (!portrait) return <>{children}</>;
  return <AbsoluteFill style={{transform: `translate(0px, ${dy * h}px) scale(${s})`, transformOrigin: `${ox * 100}% ${oy * 100}%`}}>{children}</AbsoluteFill>;
};
