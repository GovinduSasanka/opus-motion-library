// Capability metadata for catalog.json: heuristics over each motion's props / tags / description,
// plus measurements from cli/probe-meta.mjs (docs/motion-probe.json) and hand overrides (docs/motion-meta.json).
// Used by cli/gen-registry.mjs. Order of precedence: override > measurement > heuristic.

const TEXT_KEYS = new Set([
  'title', 'subtitle', 'text', 'subtext', 'lines', 'label', 'labels', 'headline', 'subheadline', 'word', 'messages', 'items', 'caption',
  'keyword', 'preTitle', 'logo', 'tagline', 'chapter', 'fromChapter', 'brand', 'eras', 'landmarks', 'categories', 'centerLabel', 'credit',
  'footnote', 'surfaceTitle', 'surfaceNote', 'kicker', 'contact', 'contactSub', 'ctas', 'nav', 'features', 'cards', 'panels', 'stages',
  'readoutLabels', 'finalLabel', 'sublabel', 'unit', 'prefix', 'thoughtCaption', 'verdict', 'badge', 'url', 'sideCopy', 'sideMono',
  'swapTo', 'pill', 'headerRight', 'counterLabel', 'chapters', 'xLabel', 'yLabel', 'gaugeLabels', 'dropLabels', 'scaleLabel', 'left', 'right',
  'waypoints', 'levels', 'keyframes', 'logos', 'icon', 'bursts',
]);
const IMAGE_KEYS = ['src', 'images', 'heroSrc', 'image', 'windowImages'];
const COLOR_RE = /^#[0-9a-f]{3,8}$/i;

const has = (m, k) => Object.prototype.hasOwnProperty.call(m.props, k);
const doc = (m, k) => (has(m, k) ? String(m.props[k].doc ?? '') : '');
const def = (m, k) => (has(m, k) ? m.props[k].default : undefined);
const hay = (m) => [m.id, m.title, m.description, m.useFor, (m.tags ?? []).join(' ')].join(' ').toLowerCase();
/** what it looks like (not what it is for) */
const lookHay = (m) => [m.id, m.title, m.description, (m.tags ?? []).join(' ')].join(' ').toLowerCase();

/** props that make the motion paint only its foreground (transparent background), or null */
export const inferOverlayProps = (m) => {
  const o = {};
  if (has(m, 'overlay') && typeof def(m, 'overlay') === 'boolean' && /transparent/i.test(doc(m, 'overlay'))) o.overlay = true;
  if (has(m, 'scene') && typeof def(m, 'scene') === 'boolean' && /transparent|overlay/i.test(doc(m, 'scene'))) o.scene = false;
  if (has(m, 'background') && /transparent/i.test(doc(m, 'background'))) o.background = 'transparent';
  if (has(m, 'backdrop')) {
    const b = def(m, 'backdrop');
    const d = doc(m, 'backdrop');
    if (typeof b === 'boolean' && o.background) o.backdrop = false;
    else if (typeof b === 'string' && /transparent/i.test(d)) o.backdrop = 'transparent';
    // text-kit procedural backdrops: 'none' = transparent (when no colour is forced)
    else if (typeof b === 'string' && (/\bnone\b|any backdrop kind|…|ocean|ink|dunes|peaks|dusk|comic/.test(d) || b === 'auto')) {
      o.backdrop = 'none';
      if (has(m, 'background')) o.background = 'transparent';
    }
  }
  if (Object.keys(o).length && has(m, 'showSubject')) o.showSubject = false;
  if (Object.keys(o).length && has(m, 'previewSubject')) o.previewSubject = false;
  return Object.keys(o).length ? o : null;
};

export const inferTextProps = (m) =>
  Object.entries(m.props)
    .filter(([k, v]) => TEXT_KEYS.has(k) && (typeof v.default === 'string' ? !COLOR_RE.test(v.default) : Array.isArray(v.default) || (v.default && typeof v.default === 'object') || v.default === null))
    .map(([k]) => k);

export const inferImageProps = (m) => IMAGE_KEYS.filter((k) => has(m, k) && (typeof def(m, k) === 'string' || Array.isArray(def(m, k))));

export const inferColorProps = (m) =>
  Object.entries(m.props)
    .filter(([, v]) => (typeof v.default === 'string' && COLOR_RE.test(v.default)) || (Array.isArray(v.default) && v.default.length && v.default.every((x) => typeof x === 'string' && COLOR_RE.test(x))))
    .map(([k]) => k);

const LOOKS = [
  ['paper', /paper|pencil|sketch|doodle|hand-drawn|handwrit|ballpoint|crayon|origami|parchment|craft/],
  ['neon', /neon|glow sign|synthwave|80s/],
  ['blueprint', /blueprint|line-art|wireframe|technical|schematic/],
  ['photo', /\bimage\b|photo|picture|footage/],
  ['3d', /\b3d\b|three|isometric|extru|clay|terrain mesh|point ?cloud/],
  ['pixel', /pixel|dither|8-bit|retro/],
  ['comic', /comic|manga|halftone|pop-art|anime|toon/],
  ['cinematic', /film|cinematic|letterbox|anamorphic|documentary|godray|volumetric/],
  ['nature', /nature|grass|flower|petal|bird|fish|ocean|sky|sun|rain|snow|forest|insect|aurora|landscape|plant|weather|water/],
  ['hud', /\bhud\b|reticle|telemetry|timecode|radar|scan|sonar|science|data|chart|gauge/],
  ['playful', /mascot|cute|bounce|emote|character|bot|cartoon|crowd|party|confetti/],
  ['editorial', /serif|editorial|documentary|chapter|caption|credits|magazine/],
  ['ui', /\bui\b|website|browser|chat|sms|cards|phone|mockup|landing/],
  ['night', /night|dark|stars|moon|neon|fireworks|firefly/],
];

const luminanceMood = (luma) => (luma == null ? null : luma < 70 ? 'dark' : luma > 165 ? 'light' : 'mid');

export const inferRoles = (m, overlay) => {
  const r = new Set();
  const h = hay(m);
  if (m.category === 'transition') return ['transition'];
  if (m.id === 'mix') return ['mix'];
  if (m.category === 'text') r.add('type');
  if (['environment', 'image', 'texture'].includes(m.category)) r.add('backdrop');
  if (overlay && (m.category === 'fx' || /particles|overlay|ambience|sparkle|glint|confetti/.test(h))) r.add('accent');
  if (['shape', 'character', 'data', 'ui', '3d', 'illustration', 'hud'].includes(m.category)) r.add('subject');
  if (m.id === 'hud-chrome' || m.id === 'film-look' || m.id === 'kinetic-captions' || m.id === 'callout-labels') r.add('frame');
  if (!r.size) r.add('subject');
  return [...r];
};

/**
 * @param m  catalog entry (id, title, category, description, useFor, tags, props, durationInFrames)
 * @param probe  measurements for this motion from docs/motion-probe.json (luma, seam, transparent) or undefined
 * @param o  hand overrides from docs/motion-meta.json (any field below) or undefined
 */
export const enrich = (m, probe = {}, o = {}) => {
  const overlayHeur = inferOverlayProps(m);
  const overlayProps = o.overlayProps !== undefined ? o.overlayProps : overlayHeur;
  // measured: fraction of fully transparent pixels when rendered with overlayProps
  const measuredOverlay = probe.alpha != null ? probe.alpha < 0.85 : probe.transparent == null ? null : probe.transparent > 0.15;
  const overlay = o.overlay ?? (overlayProps ? measuredOverlay ?? true : false);
  const h = hay(m);
  const looks = LOOKS.filter(([, re]) => re.test(lookHay(m))).map(([k]) => k);
  if (m.category === 'image' && !looks.includes('photo')) looks.push('photo');
  const mood = [luminanceMood(probe.luma), ...looks].filter(Boolean);
  const imageProps = o.imageProps ?? inferImageProps(m);
  const textProps = o.textProps ?? inferTextProps(m);
  // seam = diff(last frame -> first frame) / median diff between consecutive frames; ≤ 1.6 reads as a seamless loop
  // and the motion must still be moving at the end (end ≥ 0.3), otherwise it simply finished (bursts, reveals)
  const measuredLoop = probe.seam == null ? null : probe.seam <= 1.6 && probe.motion > 0.05 && (probe.end == null || probe.end >= 0.3);
  return {
    overlay: Boolean(overlay),
    overlayProps: overlay ? overlayProps ?? null : null,
    takesImage: imageProps.length > 0,
    imageProps,
    takesText: textProps.length > 0,
    textProps,
    colorProps: o.colorProps ?? inferColorProps(m),
    loopable: o.loopable ?? measuredLoop ?? false,
    ...(o.loopProps ? {loopProps: o.loopProps} : {}),
    bestLength: o.bestLength ?? m.durationInFrames,
    mood: o.mood ?? [...new Set(mood)],
    roles: o.roles ?? inferRoles(m, overlay),
    weight: o.weight ?? (m.category === 'image' ? 'medium' : 'light'),
    formats: ['landscape', 'square', 'portrait'],
    pairsWith: o.pairsWith ?? [],
    ...(o.notes ? {notes: o.notes} : {}),
    ...(o.avoid ? {avoid: o.avoid} : {}),
  };
};
