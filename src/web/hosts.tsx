import React from 'react';
import {resolveStyle, StyleFrame, StyleRef} from '../styles';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import type {MotionDef} from '../core/types';
import type {MixLayer as LayerSpec} from './types';

/**
 * Player compositions. They mirror src/Layers.tsx exactly, but take motion definitions as data instead of
 * reading the global registry, so the web build can code-split per motion and `mgl add` can copy only what a
 * host project uses.
 */

export type Defs = Record<string, MotionDef<any> | undefined>;

/** crossfade loop: plays [start, D) of the motion, and over the last `fade` frames blends in [start-fade, start) so the wrap is invisible */
export interface LoopWindow {
  start: number;
  fade: number;
  /** natural length of the motion */
  length: number;
}

const Missing: React.FC<{id: string}> = ({id}) => (
  <AbsoluteFill style={{background: '#300', color: '#fff', justifyContent: 'center', alignItems: 'center', fontSize: 48, fontFamily: 'sans-serif'}}>unknown motion: {id}</AbsoluteFill>
);

/** one motion from its definition; it always sees at least its natural length (same rule as Layers.MotionById) */
export const DefMotion: React.FC<{def?: MotionDef<any>; id?: string; props?: Record<string, unknown>; offset?: number; length?: number}> = ({def, id, props, offset = 0, length}) => {
  if (!def) return <Missing id={id ?? '?'} />;
  const C = def.component;
  return (
    <Sequence from={-offset} durationInFrames={Math.max(def.durationInFrames, (length ?? def.durationInFrames) + offset)} layout="absolute-fill">
      <C {...def.defaultProps} {...(props ?? {})} />
    </Sequence>
  );
};

const CrossfadeTail: React.FC<{from: number; fade: number; children: React.ReactNode}> = ({from, fade, children}) => {
  const frame = useCurrentFrame();
  if (frame < from) return null;
  return <AbsoluteFill style={{opacity: Math.min(1, (frame - from + 1) / fade)}}>{children}</AbsoluteFill>;
};

/** apply a visual style (look) to everything inside */
export const Look: React.FC<{look?: StyleRef; children: React.ReactNode}> = ({look, children}) => {
  const r = resolveStyle(look);
  return r ? (
    <StyleFrame style={r.style} strength={r.strength}>
      {children}
    </StyleFrame>
  ) : (
    <>{children}</>
  );
};

/** Player root for a single motion (optionally with a crossfade loop window) */
export const MotionComp: React.FC<{def?: MotionDef<any>; id?: string; props?: Record<string, unknown>; background?: string; window?: LoopWindow | null; look?: StyleRef}> = ({look, ...p}) => (
  <Look look={look}>
    <MotionCompInner {...p} />
  </Look>
);

const MotionCompInner: React.FC<{def?: MotionDef<any>; id?: string; props?: Record<string, unknown>; background?: string; window?: LoopWindow | null}> = ({def, id, props, background, window: win}) => {
  if (!def) return <Missing id={id ?? '?'} />;
  const C = def.component;
  const merged = {...def.defaultProps, ...(props ?? {})};
  if (!win) {
    return (
      <AbsoluteFill style={{background}}>
        <C {...merged} />
      </AbsoluteFill>
    );
  }
  const L = win.length - win.start;
  return (
    <AbsoluteFill style={{background}}>
      <Sequence from={-win.start} durationInFrames={win.length} layout="absolute-fill">
        <C {...merged} />
      </Sequence>
      <CrossfadeTail from={L - win.fade} fade={win.fade}>
        <Sequence from={L - win.start} durationInFrames={win.length} layout="absolute-fill">
          <C {...merged} />
        </Sequence>
      </CrossfadeTail>
    </AbsoluteFill>
  );
};

/** same semantics as src/Layers.tsx `Layers` */
export const DefLayers: React.FC<{layers: LayerSpec[]; defs: Defs; length: number}> = ({layers, defs, length}) => (
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
            <DefMotion def={defs[l.motion]} id={l.motion} props={l.props} offset={l.offset} length={dur} />
          </AbsoluteFill>
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

/** Player root for a layer stack; `window` crossfade-loops the whole stack */
export const LayersComp: React.FC<{layers: LayerSpec[]; defs: Defs; background?: string; length: number; window?: LoopWindow | null; look?: StyleRef}> = ({look, ...p}) => (
  <Look look={look}>
    <LayersCompInner {...p} />
  </Look>
);

const LayersCompInner: React.FC<{layers: LayerSpec[]; defs: Defs; background?: string; length: number; window?: LoopWindow | null}> = ({layers, defs, background, length, window: win}) => {
  if (!win) {
    return (
      <AbsoluteFill style={{background}}>
        <DefLayers layers={layers} defs={defs} length={length} />
      </AbsoluteFill>
    );
  }
  const L = win.length - win.start;
  return (
    <AbsoluteFill style={{background}}>
      <Sequence from={-win.start} durationInFrames={win.length} layout="absolute-fill">
        <DefLayers layers={layers} defs={defs} length={win.length} />
      </Sequence>
      <CrossfadeTail from={L - win.fade} fade={win.fade}>
        <Sequence from={L - win.start} durationInFrames={win.length} layout="absolute-fill">
          <AbsoluteFill style={{background}}>
            <DefLayers layers={layers} defs={defs} length={win.length} />
          </AbsoluteFill>
        </Sequence>
      </CrossfadeTail>
    </AbsoluteFill>
  );
};

/** choose a crossfade window: skip the intro (25 %), fade over ≤ 1 s */
export const crossfadeWindow = (length: number, fps = 30): LoopWindow => {
  const fade = Math.max(8, Math.min(fps, Math.round(length * 0.15)));
  const start = Math.max(fade, Math.round(length * 0.25));
  return {start, fade, length};
};
