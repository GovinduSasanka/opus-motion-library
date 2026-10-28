import catalogJson from 'opus-motion-library/catalog.json';
import {recipes as allRecipes, type CatalogEntry, type Recipe} from 'opus-motion-library/web';
import transitionsJson from '../../transitions.json';
import transitionsMd from '../../docs/TRANSITIONS.md?raw';
import {parseTransitions, REPO_URL, type Totals, type TransitionInfo} from './seo-content';

export const REPO = REPO_URL;
export const BLOB = `${REPO}/blob/main`;
/** Vite base ("/opus-motion-library/" on GitHub Pages) — where the copied library assets are served */
export const BASE = import.meta.env.BASE_URL;
export const asset = (p: string) => `${BASE}${p.replace(/^\/+/, '')}`;

export const catalog = (catalogJson as unknown as CatalogEntry[]).slice().sort((a, b) => a.title.localeCompare(b.title));
export const byId = new Map(catalog.map((m) => [m.id, m]));
export const recipes: Recipe[] = allRecipes;
export const recipeById = new Map(recipes.map((r) => [r.id, r]));

export {CATEGORY_LABEL, CATEGORY_ORDER, categoryInfo, orderCategories} from './seo-content';
export type {TransitionInfo};

// ---------------------------------------------------------------- transitions (docs/TRANSITIONS.md table + transitions.json)

const frames = transitionsJson as Record<string, number>;
export const transitions: TransitionInfo[] = parseTransitions(transitionsMd, frames);

// ---------------------------------------------------------------- helpers

/** props worth showing in the editor first: text + colours (else the first few) */
export const starterProps = (m: CatalogEntry): Record<string, unknown> => {
  const keys = [...m.textProps, ...m.colorProps, ...m.imageProps];
  const pick = keys.length ? keys : Object.keys(m.props).slice(0, 4);
  const out: Record<string, unknown> = {};
  for (const k of pick) if (m.props[k]) out[k] = m.props[k].default;
  return out;
};

/** only the entries that differ from the motion's defaults */
export const diffProps = (m: CatalogEntry, p: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) if (!m.props[k] || JSON.stringify(m.props[k].default) !== JSON.stringify(v)) out[k] = v;
  return out;
};

export const fmtValue = (v: unknown) => {
  const s = JSON.stringify(v);
  if (s === undefined) return '—';
  return s.length > 90 ? s.slice(0, 87) + '…' : s;
};

/** every number on the site comes from here (catalog.json, recipes, transitions.json; styles.json via vite.config.ts) */
export const totals: Totals = {
  motions: catalog.length,
  styles: __MGL_STYLES__,
  transitions: transitions.length,
  recipes: recipes.length,
  categories: new Set(catalog.map((m) => m.category)).size,
};
