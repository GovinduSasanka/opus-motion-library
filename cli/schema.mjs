/**
 * Props JSON Schema for a catalog entry (catalog.json), so editors / forms / AI tools can build a property panel
 * and validate props without reading motion source.
 *
 *   import {motionSchema} from './schema.mjs';
 *   motionSchema(catalogEntry)   // -> JSON Schema (draft 2020-12) for that motion's `props`
 *
 * Derived from `props[name].default` (type, default) and `props[name].doc` (description, "a | b | c" choices) plus
 * the entry's textProps / colorProps / imageProps. Every property is optional (defaults apply) and unknown
 * properties are allowed (a few motions read extra keys).
 *
 * Extension keywords (ignored by validators, used by property panels):
 *   x-opus-widget        text | color | image | number | toggle | select | list | json
 *   x-opus-options       known / suggested values from the doc ("a | b | c"), also when the set is open ("…")
 *   x-opus-optionLabels  {value: explanation} when the doc explains each option
 */

const IDENT = /^[A-Za-z0-9][\w.+#-]*$/;
const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

/** JSON Schema fragment describing a sample value (used for array items / object members) */
const inferShape = (v, depth = 0) => {
  const t = typeOf(v);
  if (t === 'null') return {};
  if (t === 'array') {
    if (depth > 3 || v.length === 0) return {type: 'array'};
    const item = v.find((x) => x !== null && x !== undefined);
    return {type: 'array', items: inferShape(item, depth + 1)};
  }
  if (t === 'object') {
    if (depth > 3) return {type: 'object'};
    const properties = {};
    for (const [k, x] of Object.entries(v)) properties[k] = inferShape(x, depth + 1);
    return {type: 'object', properties};
  }
  return {type: t === 'number' ? 'number' : t};
};

/** "roll (odometer digits) | tick | lock …" -> {ids, labels, open} when the doc lists choices */
const parseChoices = (doc, def) => {
  if (typeof doc !== 'string' || !doc.includes(' | ')) return null;
  // the choice list is the longest run of " | "-separated segments; prose after "(" or ":" may precede it
  const parts = doc.replace(/^[^|]*?:\s+(?=\S+(?:\s\([^)]*\))?\s\|)/, '').split(' | ').map((s) => s.trim());
  const ids = [];
  const labels = {};
  let open = false;
  for (let part of parts) {
    if (/^…|^\.\.\./.test(part)) {
      open = true;
      continue;
    }
    if (/…|\.\.\./.test(part)) open = true;
    // "roll (odometer strips)" / "tick - re-typeset" / "lock: digits spin" / '"none"'
    const m = part.match(/^["'`]?([A-Za-z0-9][\w.+#-]*)["'`]?(?:\s*(?:\(([^)]*)\)?|[-–—:=]\s*(.*)))?/);
    if (!m || !IDENT.test(m[1])) continue;
    ids.push(m[1]);
    const label = (m[2] ?? m[3] ?? '').replace(/…|\.\.\./g, '').trim();
    if (label) labels[m[1]] = label;
  }
  if (ids.length < 2) return null;
  // guard against prose that merely contains " | ": a string default must be one of the choices
  if (typeof def === 'string' && def !== '' && !ids.includes(def)) return {ids, labels, open: true, soft: true};
  return {ids, labels, open};
};

export const propSchema = (name, spec, kinds) => {
  const def = spec.default;
  const t = typeOf(def);
  const s = {};
  if (t === 'number') s.type = 'number';
  else if (t === 'string') s.type = 'string';
  else if (t === 'boolean') s.type = 'boolean';
  else if (t === 'array') Object.assign(s, inferShape(def));
  else if (t === 'object') Object.assign(s, inferShape(def));
  // null default: any type
  if (spec.doc) s.description = spec.doc;
  if (def !== undefined) s.default = def;

  let widget;
  if (kinds.image.has(name)) {
    widget = 'image';
    if (t === 'string' || t === 'null') s.type = t === 'null' ? ['string', 'null'] : 'string';
    s['x-opus-hint'] = 'path inside the served public folder ("demo/owl.jpg") or an absolute https:// / data: URL; empty = built-in picture';
  } else if (kinds.color.has(name) || (t === 'string' && HEX.test(def)) || (t === 'string' && /colou?r$/i.test(name) && /^(#|rgb|hsl)/i.test(def))) {
    widget = 'color';
  } else if (t === 'boolean') widget = 'toggle';
  else if (t === 'number') widget = 'number';
  else if (t === 'array') widget = 'list';
  else if (t === 'object') widget = 'json';
  else if (t === 'string') widget = 'text';
  if (kinds.text.has(name) && (t === 'string' || t === 'null')) widget = 'text';

  if (t === 'string') {
    const c = parseChoices(spec.doc, def);
    if (c) {
      s['x-opus-options'] = c.ids;
      if (Object.keys(c.labels).length) s['x-opus-optionLabels'] = c.labels;
      if (!c.open && widget !== 'color') {
        s.enum = c.ids.includes(def) ? c.ids : [def, ...c.ids];
        widget = 'select';
      } else if (widget === 'text') widget = 'text';
    }
  }
  if (widget) s['x-opus-widget'] = widget;
  if (kinds.text.has(name)) s['x-opus-text'] = true;
  return s;
};

export const motionSchema = (m, {id: idBase} = {}) => {
  const kinds = {text: new Set(m.textProps ?? []), color: new Set(m.colorProps ?? []), image: new Set(m.imageProps ?? [])};
  const properties = {};
  for (const [name, spec] of Object.entries(m.props ?? {})) properties[name] = propSchema(name, spec, kinds);
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    ...(idBase ? {$id: `${idBase}${m.id}.json`} : {}),
    title: `${m.title} — props`,
    description: m.description,
    type: 'object',
    properties,
    additionalProperties: true,
    'x-opus': {
      id: m.id,
      category: m.category,
      useFor: m.useFor,
      durationInFrames: m.durationInFrames,
      bestLength: m.bestLength,
      formats: m.formats,
      overlay: m.overlay,
      overlayProps: m.overlayProps ?? null,
      loopable: m.loopable,
      weight: m.weight,
      roles: m.roles,
      textProps: m.textProps ?? [],
      colorProps: m.colorProps ?? [],
      imageProps: m.imageProps ?? [],
      ...(m.avoid ? {avoid: m.avoid} : {}),
    },
  };
};

/** JSON Schema of the shared render / player request an editor sends (see docs/HTTP_API.md) */
export const renderRequestSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Render request',
  type: 'object',
  description: 'POST /api/render body. Give exactly one of motion | recipe | layers | spec.',
  properties: {
    motion: {type: 'string', description: 'motion id (GET /api/motions)'},
    recipe: {type: 'string', description: 'recipe id (GET /api/recipes)'},
    layers: {type: 'array', description: 'layer stack, bottom to top: [{motion, props?, from?, duration?, offset?, opacity?, blend?, scale?, x?, y?}]', items: {type: 'object'}},
    spec: {type: 'object', description: 'full Compose spec: {width?, height?, fps?, background?, style?, scenes:[{motion|layers, props?, duration?, offset?, transition?}], overlays?, captions?, audio?}'},
    props: {type: 'object', description: 'props for `motion` (merged over its defaults; see /api/motions/:id/schema)'},
    overrides: {type: 'object', description: 'recipe only: {motionId: props} merged into the recipe layers'},
    style: {type: 'string', description: 'style id (GET /api/styles) applied to the whole render'},
    format: {type: 'string', enum: ['mp4', 'webm', 'webm-alpha', 'prores-alpha', 'gif', 'poster'], default: 'mp4', description: 'output file type'},
    aspect: {type: 'string', enum: ['landscape', 'square', 'portrait'], description: 'preset size 1920x1080 | 1080x1080 | 1080x1920'},
    width: {type: 'integer', minimum: 16, maximum: 4096},
    height: {type: 'integer', minimum: 16, maximum: 4096},
    fps: {type: 'integer', minimum: 1, maximum: 120, default: 30},
    frames: {type: 'integer', minimum: 1, description: 'length in frames (default: the motion / recipe / spec length)'},
    frame: {type: 'integer', minimum: 0, description: 'poster only: which frame (default 60 % of the length)'},
    quality: {type: 'string', enum: ['draft', 'normal', 'high'], default: 'normal'},
    scale: {type: 'number', minimum: 0.1, maximum: 1, description: 'gif only: output scale'},
  },
  additionalProperties: false,
};
