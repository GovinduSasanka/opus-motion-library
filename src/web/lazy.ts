import type {MotionDef} from '../core/types';
import {motionMeta} from '../meta';
import {loaders} from './loaders';
import type {MotionResolver} from './types';

const cache = new Map<string, MotionDef<any> | undefined>();

/** code-split: each motion is fetched the first time it is used (ESM build: `opus-motion-library/web`) */
export const lazyResolver: MotionResolver = {
  motion: (id) => {
    if (cache.has(id)) return cache.get(id);
    const load = loaders[id];
    if (!load) return undefined;
    return load().then((def) => {
      cache.set(id, def);
      return def;
    });
  },
  compose: () => import('../Compose').then((m) => ({Compose: m.Compose, specDuration: m.specDuration})),
  meta: (id) => motionMeta[id],
};

/** fetch motions ahead of time (e.g. on hover / idle) */
export const preloadMotions = (ids: string[]) => Promise.all(ids.map((id) => lazyResolver.motion(id)));
