import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useStage} from './stage';

/**
 * Portrait-only wrapper: zoom the whole motion (s) around an origin (ox/oy = 0..1 of the frame),
 * optionally shifted by dy (fraction of frame height). Landscape/square render the component untouched.
 */
export const withPortraitFit = <P extends Record<string, any>>(C: React.ComponentType<P>, o: {s: number; ox?: number; oy?: number; dy?: number}): React.FC<P> => {
  const W: React.FC<P> = (p) => {
    const {portrait, h} = useStage();
    if (!portrait) return <C {...p} />;
    const {s, ox = 0.5, oy = 0.5, dy = 0} = o;
    return (
      <AbsoluteFill style={{transform: `translate(0px, ${dy * h}px) scale(${s})`, transformOrigin: `${ox * 100}% ${oy * 100}%`}}>
        <C {...p} />
      </AbsoluteFill>
    );
  };
  return W;
};
