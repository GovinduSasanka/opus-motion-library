/**
 * opus-motion-library — main entry (everything bundled, static registry).
 *
 *   import {MotionPlayer, MotionBackground, MotionMix, registry, recipes} from 'opus-motion-library';
 *
 * For websites that only need a few motions, prefer `opus-motion-library/web` (same components, each motion is
 * code-split and loaded on first use) or copy just what you need with `node cli/mgl.mjs add <ids> --to <dir>`.
 */
import {createWebComponents} from './web/components';
import {staticResolver} from './web/static';

export {registry, motions} from './registry';
export {motionMeta} from './meta';
export {recipes} from './recipes';
export {Compose, specDuration, sceneLength} from './Compose';
export type {ComposeSpec, SceneSpec} from './Compose';
export {Layers, MotionById} from './Layers';
export type {LayerSpec} from './Layers';
export {presentationFor, transitionFrames, TRANSITION_TYPES, DEFAULTS as TRANSITION_DEFAULTS} from './transitions';
export type {TransitionSpec, TransitionType} from './transitions';
export {defineMotion} from './core/types';
export type {MotionDef, Category} from './core/types';
export {useStage, Svg} from './core/stage';
export {ease, prog, tween, clamp, lerp} from './core/ease';
export {fonts} from './core/fonts';
export {resolveSrc} from './core/asset';
export type {CatalogEntry} from './web/catalog-types';
export type {MixLayer, MixSpec, Recipe, RecipeLayer, Format, LoopMode, MotionResolver, CommonPlayerProps, MotionMetaLite} from './web/types';
export {FORMAT_SIZE} from './web/types';
export {createWebComponents, useReducedMotion} from './web/components';
export type {MotionPlayerProps, MotionMixProps, MotionBackgroundProps} from './web/components';
export {MotionComp, LayersComp, DefLayers, DefMotion, crossfadeWindow} from './web/hosts';
export {staticResolver} from './web/static';

/** React components (client-side). In Next.js App Router use them from a 'use client' file. */
export const {MotionPlayer, MotionMix, MotionBackground} = createWebComponents(staticResolver);

// keep the web layer's structural types compatible with the composer's
import type {LayerSpec as _L} from './Layers';
import type {MixLayer as _ML} from './web/types';
type _Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
/** compile-time check: fails `tsc` if src/Layers.tsx LayerSpec and web MixLayer drift apart */
export type __LayerTypesInSync = _Same<_L, _ML> extends true ? true : never;
const _layerCheck: __LayerTypesInSync = true;
void _layerCheck;
