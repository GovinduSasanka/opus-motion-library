#!/usr/bin/env node
/**
 * build-lib — builds the library for use in other projects.
 *
 *   dist/index.js                 ESM, everything (static registry)            import … from 'opus-motion-library'
 *   dist/web.js (+ dist/chunks/)  ESM, one chunk per motion, loaded on use     import … from 'opus-motion-library/web'
 *   dist/opus-motion.element.js   self-contained browser script defining <opus-motion> (React etc. included)
 *   dist/types/                   TypeScript declarations
 *
 * React, Remotion, @remotion/*, three and @react-three/fiber stay external in the ESM builds (peer dependencies).
 *   node cli/build-lib.mjs [--no-types] [--no-element]
 */
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const args = new Set(process.argv.slice(2));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const externals = ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client', 'remotion', 'remotion/*', '@remotion/*', 'three', 'three/*', '@react-three/fiber'];

fs.rmSync(dist, {recursive: true, force: true});
const t0 = Date.now();

// 1. ESM (code-split: shared code in chunks, each motion its own chunk for the /web entry)
const esm = await build({
  entryPoints: {index: path.join(root, 'src', 'lib.ts'), web: path.join(root, 'src', 'lib-web.ts')},
  outdir: dist,
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  external: externals,
  chunkNames: 'chunks/[name]-[hash]',
  banner: {js: '"use client";'},
  metafile: true,
  logLevel: 'warning',
  legalComments: 'none',
});

// 2. <opus-motion> element: everything included, minified, classic script (works from file:// and any CMS)
if (!args.has('--no-element')) {
  await build({
    entryPoints: [path.join(root, 'src', 'web', 'element.tsx')],
    outfile: path.join(dist, 'opus-motion.element.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    jsx: 'automatic',
    minify: true,
    define: {'process.env.NODE_ENV': '"production"'},
    logLevel: 'warning',
    legalComments: 'none',
    banner: {js: `/* opus-motion-library ${pkg.version} — <opus-motion> custom element. Remotion is source-available: see https://remotion.dev/license */`},
  });
}

// 3. type declarations
if (!args.has('--no-types')) {
  execFileSync(process.execPath, [path.join(root, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', path.join(root, 'tsconfig.lib.json')], {stdio: 'inherit'});
}

const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0) + ' KB';
const chunks = fs.existsSync(path.join(dist, 'chunks')) ? fs.readdirSync(path.join(dist, 'chunks')).length : 0;
console.log(`dist/index.js ${kb(path.join(dist, 'index.js'))}, dist/web.js ${kb(path.join(dist, 'web.js'))} + ${chunks} chunks`);
if (fs.existsSync(path.join(dist, 'opus-motion.element.js'))) console.log(`dist/opus-motion.element.js ${kb(path.join(dist, 'opus-motion.element.js'))}`);
const ext = new Set();
for (const o of Object.values(esm.metafile.outputs)) for (const i of o.imports ?? []) if (i.external) ext.add(i.path);
console.log(`external imports: ${[...ext].sort().join(', ')}`);
console.log(`built in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
