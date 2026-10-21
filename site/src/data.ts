import catalogJson from 'opus-motion-library/catalog.json';
import {recipes as allRecipes, type CatalogEntry, type Recipe} from 'opus-motion-library/web';
import transitionsJson from '../../transitions.json';
import transitionsMd from '../../docs/TRANSITIONS.md?raw';

export const REPO = 'https://github.com/GovinduSasanka/opus-motion-library';
export const BLOB = `${REPO}/blob/main`;
/** Vite base ("/opus-motion-library/" on GitHub Pages) — where the copied library assets are served */
export const BASE = import.meta.env.BASE_URL;
export const asset = (p: string) => `${BASE}${p.replace(/^\/+/, '')}`;

export const catalog = (catalogJson as unknown as CatalogEntry[]).slice().sort((a, b) => a.title.localeCompare(b.title));
export const byId = new Map(catalog.map((m) => [m.id, m]));
export const recipes: Recipe[] = allRecipes;
export const recipeById = new Map(recipes.map((r) => [r.id, r]));

export const CATEGORY_LABEL: Record<string, string> = {
  text: 'Type',
  shape: 'Shapes',
  fx: 'FX',
  environment: 'Worlds',
  character: 'Characters',
  data: 'Data',
  ui: 'UI',
  hud: 'HUD',
  image: 'Image looks',
  '3d': '3D',
  transition: 'Transitions',
};
export const CATEGORY_ORDER = ['text', 'shape', 'environment', 'fx', 'character', 'data', 'ui', 'hud', 'image', '3d', 'transition'];

// ---------------------------------------------------------------- transitions (docs/TRANSITIONS.md table + transitions.json)

export interface TransitionInfo {
  key: string; // "type" or "type:variant"
  type: string;
  variant?: string;
  looks: string;
  source: string;
  fields: string;
  frames: number;
}

const stripMd = (s: string) => s.replace(/`/g, '').replace(/\*\*/g, '').trim();
const rows = new Map<string, {looks: string; source: string; fields: string}>();
for (const line of transitionsMd.split(/\r?\n/)) {
  const m = line.match(/^\|\s*`([a-z-]+)`(?:\s*\(`([a-z-]+)`[^)]*\))?\s*\|(.+)$/);
  if (!m) continue;
  const cells = m[3].split('|').map((c) => c.trim());
  if (cells.length < 4) continue;
  const key = m[2] ? `${m[1]}:${m[2]}` : m[1];
  rows.set(key, {looks: stripMd(cells[0]), source: stripMd(cells[1]), fields: stripMd(cells[2])});
}
const frames = transitionsJson as Record<string, number>;
export const transitions: TransitionInfo[] = Object.keys(frames)
  .filter((k) => k !== 'cut')
  .map((key) => {
    const [type, variant] = key.split(':');
    const r = rows.get(key);
    return {key, type, variant, looks: r?.looks ?? '', source: r?.source ?? '', fields: r?.fields ?? '', frames: frames[key]};
  });

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

export const totals = {motions: catalog.length, recipes: recipes.length, transitions: Object.keys(frames).length - 1};
