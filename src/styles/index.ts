import {styles, styleList} from './registry';
import type {StyleDef} from './engine';

export {StyleFrame} from './engine';
export type {StyleDef, FilterStep, StyleOverlays} from './engine';
export {styles, styleList};

/** a style reference: an id from the registry, an inline StyleDef, or {id, strength} */
export type StyleRef = string | StyleDef | {id: string; strength?: number} | null | undefined;

export const resolveStyle = (ref: StyleRef): {style: StyleDef; strength: number} | null => {
  if (!ref) return null;
  if (typeof ref === 'string') return styles[ref] ? {style: styles[ref], strength: 1} : null;
  if ('steps' in ref) return {style: ref as StyleDef, strength: 1};
  const s = styles[(ref as {id: string}).id];
  return s ? {style: s, strength: (ref as {strength?: number}).strength ?? 1} : null;
};
