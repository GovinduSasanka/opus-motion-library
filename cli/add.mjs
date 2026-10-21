// `mgl add <motion-id|recipe-id ...> --to <host-dir>` — copy motion source into another project, shadcn-style.
//
// esbuild's metafile gives the transitive LOCAL imports of each motion (and of the composer / web player when a
// recipe or --player needs them). Files are copied under <host>/<dir>/ with the src/ structure preserved, so every
// relative import keeps working. A small registry with only the copied motions replaces the library's full one.
import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {recipeMotions} from './suggest.mjs';

const camel = (id) => id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()).replace(/^[0-9]/, (d) => `_${d}`);
const ASSET_RE = /\.(jpe?g|png|webp|gif|svg|avif|mp3|wav|ogg|m4a|mp4|webm|json)$/i;
const FORMAT = {landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1920]};

/** every string inside a value that looks like a public/ asset path */
const assetStrings = (v, out = new Set()) => {
  if (typeof v === 'string') {
    if (ASSET_RE.test(v) && !/^(https?:|data:|blob:)/.test(v)) out.add(v.replace(/^\/+/, ''));
  } else if (Array.isArray(v)) v.forEach((x) => assetStrings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => assetStrings(x, out));
  return out;
};

const pkgName = (spec) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);

export const addToHost = async ({root, ids, to, dir = 'opus-motion', publicDir = 'public', player = false, dry = false, log = console.log}) => {
  if (!to) throw new Error('mgl add: --to <host-dir> is required');
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'));
  const byId = Object.fromEntries(catalog.map((m) => [m.id, m]));
  const recipeDir = path.join(root, 'recipes');
  const recipes = Object.fromEntries(
    fs.readdirSync(recipeDir).filter((f) => f.endsWith('.json')).map((f) => {
      const r = JSON.parse(fs.readFileSync(path.join(recipeDir, f), 'utf8'));
      return [r.id, r];
    }),
  );
  const motionIds = new Set();
  const pickedRecipes = [];
  for (const id of ids) {
    if (byId[id]) motionIds.add(id);
    else if (recipes[id]) {
      pickedRecipes.push(recipes[id]);
      recipeMotions(recipes[id]).forEach((m) => motionIds.add(m));
    } else throw new Error(`mgl add: "${id}" is neither a motion nor a recipe (node cli/mgl.mjs list | recipes)`);
  }
  // the `mix` motion needs Layers + the registry; it's covered by the same machinery
  if (motionIds.has('mix')) {
    for (const l of byId.mix.props.layers.default) motionIds.add(l.motion);
  }
  const needLayers = pickedRecipes.some((r) => r.layers) || motionIds.has('mix');
  const needCompose = pickedRecipes.some((r) => r.scenes);
  const entries = [...motionIds].map((id) => path.join(root, byId[id].file));
  if (needLayers) entries.push(path.join(root, 'src', 'web', 'hosts.tsx'));
  if (needCompose) entries.push(path.join(root, 'src', 'Compose.tsx'));
  if (player) entries.push(path.join(root, 'src', 'web', 'components.tsx'), path.join(root, 'src', 'web', 'types.ts'));

  // generated in the host instead of copied
  const GENERATED = new Set(['src/registry.ts', 'src/meta.ts', 'src/recipes.ts'].map((f) => path.join(root, f)));
  const res = await build({
    entryPoints: entries,
    bundle: true,
    write: false,
    metafile: true,
    outdir: path.join(root, 'node_modules', '.cache', 'mgl-add'),
    format: 'esm',
    platform: 'browser',
    jsx: 'automatic',
    packages: 'external',
    logLevel: 'error',
    absWorkingDir: root,
    plugins: [
      {
        name: 'generated-external',
        setup(b) {
          b.onResolve({filter: /\/(registry|meta|recipes)$/}, (a) => {
            const abs = path.resolve(a.resolveDir, a.path) + '.ts';
            return GENERATED.has(abs) ? {path: abs, external: true} : undefined;
          });
        },
      },
    ],
  });
  const inputs = Object.keys(res.metafile.inputs).map((f) => path.resolve(root, f)).filter((f) => f.startsWith(path.join(root, 'src') + path.sep));
  // type-only imports are erased by esbuild; pick them up so the host typechecks (web/types.ts is self-contained)
  const typeOnly = new Set();
  for (const f of inputs) {
    const code = fs.readFileSync(f, 'utf8');
    for (const m of code.matchAll(/import\s+type\s+[^'"]+from\s+'(\.[^']+)'/g)) {
      const base = path.resolve(path.dirname(f), m[1]);
      const hit = ['.ts', '.tsx'].map((e) => base + e).find((x) => fs.existsSync(x));
      if (hit && !GENERATED.has(hit) && !inputs.includes(hit)) typeOnly.add(hit);
    }
  }
  const files = [...new Set([...inputs, ...typeOnly])].sort();
  const externals = new Set();
  for (const o of Object.values(res.metafile.outputs)) for (const i of o.imports ?? []) if (i.external && !i.path.startsWith('.') && !path.isAbsolute(i.path)) externals.add(pkgName(i.path));
  if (player) {
    externals.add('@remotion/player');
    externals.add('react-dom');
  }
  externals.add('react');
  externals.add('remotion');

  const outRoot = path.resolve(to, dir);
  const write = (rel, content) => {
    const f = path.join(outRoot, rel);
    if (!dry) {
      fs.mkdirSync(path.dirname(f), {recursive: true});
      fs.writeFileSync(f, content);
    }
    return f;
  };
  const copied = [];
  for (const f of files) {
    const rel = path.relative(path.join(root, 'src'), f);
    if (!dry) {
      fs.mkdirSync(path.dirname(path.join(outRoot, rel)), {recursive: true});
      fs.copyFileSync(f, path.join(outRoot, rel));
    }
    copied.push(rel.split(path.sep).join('/'));
  }

  // local registry + meta with only these motions
  const list = [...motionIds].sort();
  const exportName = (id) => {
    const code = fs.readFileSync(path.join(root, byId[id].file), 'utf8');
    const names = [...code.matchAll(/export const (\w+) = defineMotion/g)].map((m) => m[1]);
    return names.length === 1 ? names[0] : names.find((n) => n === camel(id)) ?? names[0];
  };
  const relImport = (id) => './' + byId[id].file.replace(/^src\//, '').replace(/\.tsx?$/, '');
  write(
    'registry.ts',
    `// Generated by \`mgl add\` from the Opus Motion Library — only the motions this project uses.\nimport type {MotionDef} from './core/types';\n${list
      .map((id) => `import {${exportName(id)}} from '${relImport(id)}';`)
      .join('\n')}\n\nexport const motions: MotionDef<any>[] = [${list.map(exportName).join(', ')}];\n\nexport const registry: Record<string, MotionDef<any>> = Object.fromEntries(motions.map((m) => [m.id, m]));\n`,
  );
  const lite = Object.fromEntries(list.map((id) => [id, {overlay: byId[id].overlay, overlayProps: byId[id].overlayProps, loopable: byId[id].loopable, bestLength: byId[id].bestLength, roles: byId[id].roles, weight: byId[id].weight}]));
  if (player || needLayers) {
    write('meta.ts', `// Generated by \`mgl add\`.\nimport type {MotionMetaLite} from './web/types';\n\nexport const motionMeta: Record<string, MotionMetaLite> = ${JSON.stringify(lite, null, 1)};\n`);
    if (!copied.includes('web/types.ts')) {
      fs.mkdirSync(path.join(outRoot, 'web'), {recursive: true});
      if (!dry) fs.copyFileSync(path.join(root, 'src', 'web', 'types.ts'), path.join(outRoot, 'web', 'types.ts'));
      copied.push('web/types.ts');
    }
  }
  if (player) {
    write('recipes.ts', `// Generated by \`mgl add\`.\nimport type {Recipe} from './web/types';\n\nexport const recipes: Recipe[] = ${JSON.stringify(pickedRecipes, null, 1)} as Recipe[];\n`);
    write(
      'web/local.ts',
      `// Generated by \`mgl add\`: resolves motions from the local registry.\nimport {registry} from '../registry';\nimport {motionMeta} from '../meta';\nimport type {MotionResolver} from './types';\n\nexport const localResolver: MotionResolver = {\n  motion: (id) => registry[id],\n  compose: () => ${
        needCompose ? "import('../Compose').then((m) => ({Compose: m.Compose, specDuration: m.specDuration}))" : "Promise.reject(new Error('Compose was not copied: run mgl add with a multi-scene recipe'))"
      },\n  meta: (id) => motionMeta[id],\n};\n`,
    );
  }
  for (const r of pickedRecipes) write(`recipes/${r.id}.json`, JSON.stringify(r, null, 1) + '\n');

  // index.ts
  const idx = ["// Generated by `mgl add` from the Opus Motion Library. Re-run `mgl add` to update; edit the copied files freely.", "import React from 'react';"];
  // Next.js App Router: the players are client components
  if (player) idx.unshift("'use client';");
  idx.push(`export {registry, motions} from './registry';`);
  for (const id of list) idx.push(`export {${exportName(id)}} from '${relImport(id)}';`);
  if (needLayers) idx.push(`import {LayersComp} from './web/hosts';`, `import {registry} from './registry';`);
  if (needCompose) idx.push(`import {Compose, specDuration} from './Compose';`, `export {Compose, specDuration};`);
  if (needLayers) idx.push(`export {DefLayers, LayersComp, MotionComp} from './web/hosts';`);
  for (const r of pickedRecipes) {
    const [w, h] = FORMAT[r.format ?? 'landscape'];
    idx.push(`import ${camel(r.id)}Json from './recipes/${r.id}.json';`);
    if (r.layers) {
      const len = r.duration ?? 180;
      idx.push(
        `/** recipe "${r.id}": ${r.title}. Use as a Remotion <Composition component={…Recipe.component} …/> or inside a <Player>. */`,
        `export const ${camel(r.id)}Recipe = {id: '${r.id}', width: ${w}, height: ${h}, fps: ${r.fps ?? 30}, durationInFrames: ${len}, recipe: ${camel(r.id)}Json,`,
        `  component: () => React.createElement(LayersComp, {layers: ${camel(r.id)}Json.layers as any, defs: registry, background: ${JSON.stringify(r.background ?? '#000')}, length: ${len}}),`,
        `};`,
      );
    } else {
      idx.push(
        `/** recipe "${r.id}": ${r.title} (multi-scene Compose spec) */`,
        `const ${camel(r.id)}Spec = {width: ${w}, height: ${h}, fps: ${r.fps ?? 30}, background: ${JSON.stringify(r.background ?? '#000')}, scenes: ${camel(r.id)}Json.scenes, overlays: (${camel(r.id)}Json as any).overlays} as any;`,
        `export const ${camel(r.id)}Recipe = {id: '${r.id}', width: ${w}, height: ${h}, fps: ${r.fps ?? 30}, durationInFrames: specDuration(${camel(r.id)}Spec), spec: ${camel(r.id)}Spec,`,
        `  component: () => React.createElement(Compose, {spec: ${camel(r.id)}Spec}),`,
        `};`,
      );
    }
  }
  if (player) {
    idx.push(`import {createWebComponents} from './web/components';`, `import {localResolver} from './web/local';`, `export const {MotionPlayer, MotionMix, MotionBackground} = createWebComponents(localResolver);`, `export {recipes} from './recipes';`);
  }
  write('index.ts', idx.join('\n') + '\n');

  // public assets referenced by defaults / recipes
  const assets = new Set();
  for (const id of list) assetStrings(Object.fromEntries(Object.entries(byId[id].props).map(([k, v]) => [k, v.default])), assets);
  for (const r of pickedRecipes) assetStrings(r, assets);
  const copiedAssets = [];
  for (const a of assets) {
    const src = path.join(root, 'public', a);
    if (!fs.existsSync(src)) continue;
    const dst = path.resolve(to, publicDir, a);
    if (!dry) {
      fs.mkdirSync(path.dirname(dst), {recursive: true});
      fs.copyFileSync(src, dst);
    }
    copiedAssets.push(a);
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const versions = {...(pkg.peerDependencies ?? {}), ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {})};
  const install = [...externals].sort().map((n) => (versions[n] ? `${n}@${versions[n].replace(/^[\^~]/, '')}` : n));
  const usesJson = needLayers || pickedRecipes.length > 0 || copied.some((f) => /three-kit|wireframe|plan-tilt/.test(f));

  log(`${dry ? '[dry run] ' : ''}copied ${copied.length} files -> ${path.relative(process.cwd(), outRoot) || outRoot}/`);
  for (const f of copied) log(`  ${f}`);
  log(`  + registry.ts${player || needLayers ? ', meta.ts' : ''}${player ? ', recipes.ts, web/local.ts' : ''}, index.ts${pickedRecipes.length ? `, recipes/*.json (${pickedRecipes.length})` : ''}`);
  if (copiedAssets.length) log(`public assets -> ${publicDir}/: ${copiedAssets.join(', ')}`);
  log(`\ninstall:\n  npm install ${install.join(' ')}`);
  const devTypes = ['@types/react', ...(externals.has('react-dom') ? ['@types/react-dom'] : []), ...(externals.has('three') ? ['@types/three'] : [])].map((n) => (versions[n] ? `${n}@${versions[n].replace(/^[\^~]/, '')}` : n));
  log(`  npm install -D ${devTypes.join(' ')}     # TypeScript hosts`);
  log(`\ntsconfig: "jsx": "react-jsx"${usesJson ? ', "resolveJsonModule": true' : ''}, "esModuleInterop": true, "skipLibCheck": true`);
  const first = list.find((id) => id !== 'mix');
  log(`\nuse (Remotion):\n  import {${pickedRecipes.length ? `${camel(pickedRecipes[0].id)}Recipe` : exportName(first)}} from './${dir}';`);
  if (pickedRecipes.length) {
    const r = camel(pickedRecipes[0].id);
    log(`  <Composition id="${pickedRecipes[0].id}" component={${r}Recipe.component} width={${r}Recipe.width} height={${r}Recipe.height} fps={30} durationInFrames={${r}Recipe.durationInFrames} />`);
  } else {
    const n = exportName(first);
    log(`  <Composition id="${first}" component={${n}.component} defaultProps={${n}.defaultProps} durationInFrames={${n}.durationInFrames} fps={30} width={1920} height={1080} />`);
  }
  if (player) {
    log(`\nuse (React website / app, client component):\n  import {MotionPlayer, MotionBackground} from './${dir}';`);
    if (pickedRecipes.length) log(`  <MotionBackground recipe="${pickedRecipes[0].id}" recipeData={undefined} style={{minHeight: '80vh'}}>…your hero…</MotionBackground>`.replace(' recipeData={undefined}', ''));
    log(`  <MotionPlayer motion="${first}" props={{}} playOnView loop="auto" />`);
  }
  return {files: copied, assets: copiedAssets, install, outRoot};
};
