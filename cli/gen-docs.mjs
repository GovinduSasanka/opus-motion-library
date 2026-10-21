#!/usr/bin/env node
// Writes docs/CATALOG.md (every motion with props) and docs/TECHNIQUES.md (every reverse-engineered
// source technique -> the library motion / transition that rebuilds it). Run after cli/gen-registry.mjs.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'));
const ids = new Set(catalog.map((m) => m.id));
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const short = (v) => {
  const s = JSON.stringify(v);
  return s.length > 60 ? s.slice(0, 57) + '…' : s;
};

// ---------- CATALOG.md
const order = ['text', 'transition', 'shape', 'fx', 'environment', 'character', 'data', 'ui', 'hud', 'camera', 'texture', '3d', 'particles', 'illustration'];
const cats = [...new Set(catalog.map((m) => m.category))].sort((a, b) => (order.indexOf(a) + 99) % 99 - (order.indexOf(b) + 99) % 99);
let md = `# Motion catalog\n\n${catalog.length} motions. Generated from \`catalog.json\` by \`cli/gen-docs.mjs\` — do not edit by hand.\n\n`;
md += `Render any of them: \`node cli/mgl.mjs render <id> [--props '{...}'] [--format landscape|square|portrait]\`. Previews live in \`gallery/\`.\n\n`;
md += `Choosing: \`node cli/mgl.mjs suggest "<what you need>"\` and [CHOOSING.md](CHOOSING.md). Using them in a website / app / other project: [INTEGRATION.md](INTEGRATION.md).\n\n`;
md += cats.map((c) => `- [${c}](#${c}) (${catalog.filter((m) => m.category === c).length})`).join('\n') + '\n- [recipes](#recipes) (ready-made mixes)\n\n';
// quick capability index
const yes = (f) => catalog.filter(f).map((m) => `\`${m.id}\``).join(', ');
md += `## Capability index\n\n| capability | motions |\n|---|---|\n`;
md += `| overlay (transparent background — put it on top of other motions or your page) | ${yes((m) => m.overlay)} |\n`;
md += `| seamless loop | ${yes((m) => m.loopable)} |\n`;
md += `| takes your image (\`src\` / \`images\` / \`heroSrc\`) | ${yes((m) => m.takesImage)} |\n`;
md += `| heavy (three.js / WebGL — prefer an exported video on mobile web) | ${yes((m) => m.weight === 'heavy')} |\n\n`;
// recipes
const recipeDir = path.join(root, 'recipes');
const recipes = fs.existsSync(recipeDir) ? fs.readdirSync(recipeDir).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(fs.readFileSync(path.join(recipeDir, f), 'utf8'))) : [];
if (recipes.length) {
  md += `## recipes\n\nReady-made mixes in \`recipes/\` — render with \`node cli/mgl.mjs recipe <id>\`, play on the web with \`<MotionBackground recipe="<id>">\` / \`<MotionMix recipe="<id>">\` / \`<opus-motion recipe="<id>">\`.\n\n`;
  for (const r of recipes) {
    md += `### \`${r.id}\` — ${r.title} (${r.format})\n\n`;
    if (fs.existsSync(path.join(recipeDir, 'previews', `${r.id}.jpg`))) md += `![${r.id}](../recipes/previews/${r.id}.jpg)\n\n`;
    const mixOf = r.layers ? r.layers.map((l) => `\`${l.motion}\`${l.role ? ` (${l.role})` : ''}`).join(' + ') : r.scenes.map((s) => (s.motion ? `\`${s.motion}\`` : (s.layers ?? []).map((l) => `\`${l.motion}\``).join(' + '))).join(' → ');
    md += `${r.useFor}\n\n**Mix:** ${mixOf}  \n${r.notes ? `**Customise:** ${r.notes}\n` : ''}\n`;
  }
}
md += `## motions by category\n\n`;
for (const c of cats) {
  md += `## ${c}\n\n`;
  for (const m of catalog.filter((x) => x.category === c)) {
    md += `### \`${m.id}\` — ${m.title}\n\n`;
    if (fs.existsSync(path.join(root, 'gallery', `${m.id}.jpg`))) md += `![${m.id}](../gallery/${m.id}.jpg)\n\n`;
    md += `${m.description}\n\n**Use for:** ${m.useFor}  \n**Rebuilt from:** ${m.source.join(', ')}  \n**Default length:** ${m.durationInFrames} frames (${(m.durationInFrames / 30).toFixed(1)} s @ 30 fps)${m.bestLength && m.bestLength !== m.durationInFrames ? ` · best ${m.bestLength}` : ''}\n\n`;
    if (m.roles) {
      const caps = [
        m.overlay ? `overlay (\`${JSON.stringify(m.overlayProps)}\`)` : 'paints its own background',
        m.loopable ? 'seamless loop' : null,
        m.takesText ? `text: ${m.textProps.map((k) => `\`${k}\``).join(', ')}` : null,
        m.takesImage ? `image: ${m.imageProps.map((k) => `\`${k}\``).join(', ')}` : null,
        `weight: ${m.weight}`,
      ].filter(Boolean);
      md += `**Roles:** ${m.roles.join(', ')} · **Mood:** ${m.mood.join(', ') || '—'}  \n**Capabilities:** ${caps.join(' · ')}  \n`;
      if (m.pairsWith?.length) md += `**Pairs well with:** ${m.pairsWith.map((p) => `\`${p}\``).join(', ')}  \n`;
      if (m.notes) md += `**Note:** ${m.notes}  \n`;
      if (m.avoid) md += `**Avoid:** ${m.avoid}  \n`;
      md += '\n';
    }
    md += `| prop | default | notes |\n|---|---|---|\n`;
    for (const [k, v] of Object.entries(m.props)) md += `| \`${k}\` | \`${esc(short(v.default))}\` | ${esc(v.doc)} |\n`;
    md += '\n';
  }
}
fs.writeFileSync(path.join(root, 'docs', 'CATALOG.md'), md);

// ---------- CHOOSING.md "pairs well with" table (between markers)
const choosingFile = path.join(root, 'docs', 'CHOOSING.md');
if (fs.existsSync(choosingFile)) {
  const c = fs.readFileSync(choosingFile, 'utf8');
  const rows = catalog
    .filter((m) => m.pairsWith?.length)
    .map((m) => `| \`${m.id}\` | ${m.roles.join(', ')} | ${m.pairsWith.map((x) => `\`${x}\``).join(', ')} | ${esc(m.avoid ?? m.notes ?? '')} |`)
    .join('\n');
  const table = `<!-- pairs:start -->\n| motion | roles | pairs well with | note |\n|---|---|---|---|\n${rows}\n<!-- pairs:end -->`;
  fs.writeFileSync(choosingFile, c.replace(/<!-- pairs:start -->[\s\S]*<!-- pairs:end -->/, table));
}

// ---------- TECHNIQUES.md
// PLAN.md rows map motion ids to "(vN technique-id, ...)" lists; analysis docs define the technique ids.
const plan = fs.readFileSync(path.join(root, 'docs', 'PLAN.md'), 'utf8');
const transitionsDoc = fs.existsSync(path.join(root, 'docs', 'TRANSITIONS.md')) ? fs.readFileSync(path.join(root, 'docs', 'TRANSITIONS.md'), 'utf8') : '';
const covers = {}; // technique id -> Set(motion ids)
const add = (tech, target) => ((covers[tech] ??= new Set()).add(target));
// table rows: | motion-id ✅ | v10 a, v22 b |
for (const line of plan.split('\n')) {
  const row = line.match(/^\|\s*([a-z0-9-]+)[^|]*\|(.+)\|\s*$/);
  if (row && ids.has(row[1])) for (const t of row[2].matchAll(/([a-z][a-z0-9]*(?:-[a-z0-9]+)+)/g)) add(t[1], row[1]);
  // inline lists: motion-id (v1 a, b, v2 c) ·
  for (const item of line.matchAll(/`?([a-z0-9]+(?:-[a-z0-9]+)*)`?\s*(?:✅\s*)?\(([^)]*)\)/g)) {
    const target = ids.has(item[1]) ? item[1] : null;
    if (target) for (const t of item[2].matchAll(/([a-z][a-z0-9]*(?:-[a-z0-9]+)+)/g)) add(t[1], target);
    // transition types are listed as `type` (vN ...)
    if (!target && /transition/i.test(plan.slice(0, plan.indexOf(line)).split('## ').pop()?.split('\n')[0] ?? '')) for (const t of item[2].matchAll(/([a-z][a-z0-9]*(?:-[a-z0-9]+)+)/g)) add(t[1], `transition:${item[1]}`);
  }
}
// motions also declare their sources in descriptions / source fields
for (const m of catalog) for (const s of m.source) for (const t of s.matchAll(/([a-z][a-z0-9]*(?:-[a-z0-9]+)+)/g)) add(t[1], m.id);
for (const t of transitionsDoc.matchAll(/`([a-z-]+)`[^\n]*?\b([a-z]+(?:-[a-z]+){1,})\b/g)) void t;

const manual = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'technique-map.json'), 'utf8'));
let tmd = `# Technique map\n\nEvery motion technique documented in \`analysis/videoN.md\` and the library motion (or transition) that rebuilds it.\nGenerated by \`cli/gen-docs.mjs\`. Techniques without a direct entry are covered by a core helper (\`src/core\`) or are\nfootage-only effects (painted characters, photoreal renders) noted in the analysis doc.\n\n`;
let total = 0;
let mapped = 0;
const vids = fs.readdirSync(path.join(root, 'analysis')).filter((f) => /^video\d+\.md$/.test(f)).sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5)));
for (const f of vids) {
  const doc = fs.readFileSync(path.join(root, 'analysis', f), 'utf8');
  const title = (doc.match(/^# (.+)$/m) ?? [, f])[1];
  const techs = [...new Set([...doc.matchAll(/^###\s+`?([a-z0-9]+(?:-[a-z0-9]+)+)`?/gm)].map((m) => m[1]))];
  tmd += `## ${f.replace('.md', '')} — ${title.replace(/^video\d+\s*[—-]\s*/, '')}\n\n| source technique | rebuilt by |\n|---|---|\n`;
  for (const t of techs) {
    total++;
    const by = [...(covers[t] ?? [])];
    const man = manual[t];
    const footage = man?.startsWith('-:');
    if (by.length || (man && !footage)) mapped++;
    const cell = by.length ? by.map((b) => `\`${b}\``).join(', ') : man ? (footage ? `_${man.slice(2).trim()}_` : man) : '_not mapped_';
    tmd += `| \`${t}\` | ${cell} |\n`;
  }
  tmd += '\n';
}
tmd = tmd.replace('# Technique map\n\n', `# Technique map\n\n**${total} techniques documented across ${vids.length} videos; ${mapped} are rebuilt by a library motion, transition or core helper; the rest are footage-only (painted characters / photoreal 3D props) and noted as such.**\n\n`);
fs.writeFileSync(path.join(root, 'docs', 'TECHNIQUES.md'), tmd);
console.log(`docs: CATALOG.md (${catalog.length} motions), TECHNIQUES.md (${mapped}/${total} techniques mapped)`);
