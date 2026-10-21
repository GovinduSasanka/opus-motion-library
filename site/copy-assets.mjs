// Copies the library files the site shows into site/public (gitignored, regenerated on every build):
//   public/demo/*.jpg      images the motions load with staticFile() (served at <base>/demo/…)
//   gallery/*.jpg          3-frame preview strip of every motion
//   recipes/previews/*.jpg recipe previews
// public/music, public/sfx and public/voice are NOT copied (no motion on the site needs audio).
import fs from 'node:fs';
const pairs = [
  ['../public/demo/', './public/demo/'],
  ['../gallery/', './public/gallery/'],
  ['../recipes/previews/', './public/recipes/'],
];
let n = 0;
for (const [a, b] of pairs) {
  const from = new URL(a, import.meta.url);
  const to = new URL(b, import.meta.url);
  fs.mkdirSync(to, {recursive: true});
  for (const f of fs.readdirSync(from)) {
    if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
    fs.copyFileSync(new URL(f, from), new URL(f, to));
    n++;
  }
}
console.log(`copied ${n} images into site/public (demo, gallery, recipes)`);
