import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {registry} from './registry';
import {resolveStyle, StyleFrame, StyleRef} from './styles';

/**
 * A layer is one motion stacked inside a scene. Layers let you MIX motions: a backdrop
 * (environment / image look), a subject (shape / character / data), text on top, and an
 * accent (fx / particles) — all playing at once, each with its own timing and blend.
 */
export interface LayerSpec {
  motion: string;
  props?: Record<string, unknown>;
  /** frame inside the scene where this layer starts (default 0) */
  from?: number;
  /** frames this layer is visible (default: to the end of the scene) */
  duration?: number;
  /** start the motion this many frames into its own timeline */
  offset?: number;
  opacity?: number;
  /** CSS mix-blend-mode, e.g. "screen" for light/particles, "multiply" for paper/ink */
  blend?: React.CSSProperties['mixBlendMode'];
  /** uniform scale and offset (fractions of the frame) to place a layer inside the frame */
  scale?: number;
  x?: number;
  y?: number;
  /** visual style for this layer only (id from styles.json or inline) */
  style?: StyleRef;
}

const Missing: React.FC<{id: string}> = ({id}) => (
  <AbsoluteFill style={{background: '#300', color: '#fff', justifyContent: 'center', alignItems: 'center', fontSize: 48}}>unknown motion: {id}</AbsoluteFill>
);

/** render one motion by id; it always sees at least its natural length, so offsets / short cuts just crop it */
export const MotionById: React.FC<{motion: string; props?: Record<string, unknown>; offset?: number; length?: number}> = ({motion, props, offset = 0, length}) => {
  const def = registry[motion];
  if (!def) return <Missing id={motion} />;
  const C = def.component;
  return (
    <Sequence from={-offset} durationInFrames={Math.max(def.durationInFrames, (length ?? def.durationInFrames) + offset)} layout="absolute-fill">
      <C {...def.defaultProps} {...(props ?? {})} />
    </Sequence>
  );
};

/** wraps children in a StyleFrame when a style is given */
export const Styled: React.FC<{style?: StyleRef; children: React.ReactNode}> = ({style, children}) => {
  const r = resolveStyle(style);
  return r ? (
    <StyleFrame style={r.style} strength={r.strength}>
      {children}
    </StyleFrame>
  ) : (
    <>{children}</>
  );
};

export const Layers: React.FC<{layers: LayerSpec[]; length: number}> = ({layers, length}) => (
  <AbsoluteFill>
    {layers.map((l, i) => {
      const from = l.from ?? 0;
      const dur = l.duration ?? Math.max(1, length - from);
      const s = l.scale ?? 1;
      return (
        <Sequence key={i} from={from} durationInFrames={dur} layout="absolute-fill">
          <AbsoluteFill
            style={{
              opacity: l.opacity ?? 1,
              mixBlendMode: l.blend,
              transform: s !== 1 || l.x || l.y ? `translate(${(l.x ?? 0) * 100}%, ${(l.y ?? 0) * 100}%) scale(${s})` : undefined,
            }}
          >
            <Styled style={l.style}>
              <MotionById motion={l.motion} props={l.props} offset={l.offset} length={dur} />
            </Styled>
          </AbsoluteFill>
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
