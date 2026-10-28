import type React from 'react';
import type {MotionDef} from '../core/types';

/*
 * The web layer only depends on these structural types (not on src/Layers.tsx / src/Compose.tsx), so `mgl add`
 * can copy a player into a host project without the whole composer. src/lib.ts asserts they stay compatible.
 */

/** one layer of a mix — same fields as LayerSpec in src/Layers.tsx */
export interface MixLayer {
  motion: string;
  props?: Record<string, unknown>;
  from?: number;
  duration?: number;
  offset?: number;
  opacity?: number;
  blend?: React.CSSProperties['mixBlendMode'];
  scale?: number;
  x?: number;
  y?: number;
}

/** a multi-scene spec — the subset of ComposeSpec (src/Compose.tsx) the web layer touches */
export interface MixSpec {
  width?: number;
  height?: number;
  fps?: number;
  background?: string;
  scenes: {motion?: string; layers?: MixLayer[]; duration?: number; props?: Record<string, unknown>; offset?: number; transition?: Record<string, unknown> & {type: string}}[];
  overlays?: {motion: string; from: number; duration: number; props?: Record<string, unknown>; offset?: number; opacity?: number; blend?: React.CSSProperties['mixBlendMode']}[];
  [k: string]: unknown;
}

export type Format = 'landscape' | 'square' | 'portrait';
export const FORMAT_SIZE: Record<Format, [number, number]> = {landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1920]};

/** a recipe layer is a Layers layer plus an optional role (backdrop | subject | type | accent | frame) */
export type RecipeLayer = MixLayer & {role?: 'backdrop' | 'subject' | 'type' | 'accent' | 'frame'; note?: string};

/** A ready-made mix: either a layer stack (one shot) or a multi-scene Compose spec. Files live in recipes/<id>.json. */
export interface Recipe {
  id: string;
  title: string;
  useFor: string;
  format: Format;
  /** frames at 30 fps (layer recipes); scene recipes sum their scenes */
  duration?: number;
  fps?: number;
  background?: string;
  layers?: RecipeLayer[];
  scenes?: MixSpec['scenes'];
  overlays?: MixSpec['overlays'];
  /** one look for the whole recipe (style id, see styles.json); scenes / layers can still set their own */
  style?: string | {id: string; strength?: number};
  /** what to change for your project, and how it behaves on the web */
  notes?: string;
  tags?: string[];
  /** web hints: loop mode for backgrounds, and which props carry the host's text / colours */
  web?: {loop?: LoopMode; textInHtml?: boolean};
}

/**
 * How a player loops:
 *  - true / 'restart'  plain loop (seamless only for motions marked `loopable`)
 *  - 'crossfade'       loops a middle section with a soft crossfade — good for ambient backgrounds with an intro
 *  - 'auto'            'restart' when the motion is loopable, otherwise 'crossfade'
 *  - false / 'once'    plays once and holds the last frame
 */
export type LoopMode = boolean | 'restart' | 'crossfade' | 'auto' | 'once';

/** Resolves motion ids to definitions. The static resolver has every motion; the lazy one code-splits per motion. */
export interface MotionResolver {
  motion: (id: string) => MotionDef<any> | undefined | Promise<MotionDef<any> | undefined>;
  /** Compose component (multi-scene specs) */
  compose: () => ComposeModule | Promise<ComposeModule>;
  meta: (id: string) => MotionMetaLite | undefined;
}

export interface ComposeModule {
  Compose: React.FC<{spec: any}>;
  specDuration: (spec: any) => number;
}

export interface MotionMetaLite {
  overlay: boolean;
  overlayProps: Record<string, unknown> | null;
  loopable: boolean;
  bestLength: number;
  roles: string[];
  weight: 'light' | 'medium' | 'heavy';
}

export interface CommonPlayerProps {
  /** visual style applied on top (style id from styles.json, e.g. "woodcut", "risograph", "blueprint") */
  look?: string | {id: string; strength?: number};
  /** composition size; defaults to `format` (landscape 1920×1080) */
  format?: Format;
  width?: number;
  height?: number;
  fps?: number;
  durationInFrames?: number;
  loop?: LoopMode;
  autoPlay?: boolean;
  controls?: boolean;
  /** 'contain' (letterbox, default) or 'cover' (fill the box and crop — use for backgrounds) */
  fit?: 'contain' | 'cover';
  /** play only while on screen (IntersectionObserver); pauses when scrolled away */
  playOnView?: boolean;
  /** don't mount the player until it is near the viewport (default true) */
  lazy?: boolean;
  /** when the visitor prefers reduced motion, show a still frame instead of playing (default true) */
  respectReducedMotion?: boolean;
  /** frame shown for reduced motion / before load (default 60 % of the duration) */
  stillFrame?: number;
  playbackRate?: number;
  className?: string;
  style?: React.CSSProperties;
  /** base URL where the library's public/ assets are served (sets window.remotion_staticBase), e.g. "/opus" */
  assetBase?: string;
  /** colour shown before the player mounts */
  placeholder?: string;
  acknowledgeRemotionLicense?: boolean;
  onEnded?: () => void;
  resolver?: MotionResolver;
}
