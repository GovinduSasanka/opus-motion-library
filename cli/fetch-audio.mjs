#!/usr/bin/env node
/**
 * fetch-audio — download the royalty-free sound effects (and list the music beds) used by the demo.
 *
 *   node cli/fetch-audio.mjs
 *
 * Audio is not committed: the Pixabay Content License allows using these files in your videos but not
 * redistributing them as standalone files. Sound effects are fetched from their Pixabay CDN links in
 * public/sfx/sfx.json. Music beds are listed with their Pixabay pages (public/music/music.json): download
 * each one there (free, no account needed for most tracks) and save it under public/music/<file>.
 * Videos still render without audio — cli/direct.mjs skips any music or sfx file that is missing.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sfx = JSON.parse(fs.readFileSync(path.join(root, 'public/sfx/sfx.json'), 'utf8'));
let got = 0;
for (const s of sfx) {
  const out = path.join(root, 'public/sfx', s.file);
  if (fs.existsSync(out)) continue;
  try {
    const r = await fetch(s.src, {headers: {'user-agent': 'opus-motion-library/fetch-audio'}});
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
    got++;
    console.log(`sfx  ${s.file}`);
  } catch (e) {
    console.log(`sfx  ${s.file} FAILED (${e.message}) — download it from ${s.page}`);
  }
}
console.log(`sound effects: ${got} downloaded, ${sfx.length} in the kit\n`);
const music = JSON.parse(fs.readFileSync(path.join(root, 'public/music/music.json'), 'utf8'));
const missing = music.filter((m) => !fs.existsSync(path.join(root, 'public/music', m.file)));
if (missing.length) {
  console.log('music beds to download by hand (save as public/music/<file>):');
  for (const m of missing) console.log(`  ${m.file.padEnd(30)} ${m.title} — ${m.artist}  ${m.source}`);
} else console.log('music beds: all present');
