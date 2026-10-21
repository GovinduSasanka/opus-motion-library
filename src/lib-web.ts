/**
 * opus-motion-library/web — lean entry for websites and apps: the same MotionPlayer / MotionMix / MotionBackground,
 * but every motion is a separate chunk fetched the first time it is shown (multi-scene Compose specs load the
 * full registry on demand).
 *
 *   import {MotionBackground} from 'opus-motion-library/web';
 */
import {createWebComponents} from './web/components';
import {lazyResolver} from './web/lazy';

export {lazyResolver, preloadMotions} from './web/lazy';
export {motionMeta} from './meta';
export {recipes} from './recipes';
export {createWebComponents, useReducedMotion} from './web/components';
export type {MotionPlayerProps, MotionMixProps, MotionBackgroundProps} from './web/components';
export type {MixLayer, MixSpec, Recipe, RecipeLayer, Format, LoopMode, MotionResolver, CommonPlayerProps, MotionMetaLite} from './web/types';
export type {CatalogEntry} from './web/catalog-types';
export {FORMAT_SIZE} from './web/types';

export const {MotionPlayer, MotionMix, MotionBackground} = createWebComponents(lazyResolver);
