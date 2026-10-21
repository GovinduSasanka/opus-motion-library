import {registry} from '../registry';
import {Compose, specDuration} from '../Compose';
import {motionMeta} from '../meta';
import type {MotionResolver} from './types';

/** every motion bundled in (simple; largest bundle) */
export const staticResolver: MotionResolver = {
  motion: (id) => registry[id],
  compose: () => ({Compose, specDuration}),
  meta: (id) => motionMeta[id],
};
