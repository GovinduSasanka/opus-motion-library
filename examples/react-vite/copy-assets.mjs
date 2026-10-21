// Motions load images with staticFile(): the host must serve the library's public/ files at its web root.
// This example only needs the demo photos, so it copies public/demo into its own public/ (gitignored).
import fs from 'node:fs';
const from = new URL('../../public/demo/', import.meta.url);
const to = new URL('./public/demo/', import.meta.url);
fs.mkdirSync(to, {recursive: true});
for (const f of fs.readdirSync(from)) if (/\.(jpe?g|png|webp)$/i.test(f)) fs.copyFileSync(new URL(f, from), new URL(f, to));
console.log('copied public/demo images');
