import fs from 'node:fs';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site at https://govindusasanka.github.io/opus-motion-library/
// Override with SITE_BASE=/ for a root deploy (or a custom domain).
const base = process.env.SITE_BASE ?? '/opus-motion-library/';

// counts that are not already imported by the app (styles.json is large, only its length is needed)
const styles = JSON.parse(fs.readFileSync(new URL('../styles.json', import.meta.url), 'utf8')) as unknown[];

export default defineConfig({
  base,
  plugins: [react()],
  define: {__MGL_STYLES__: JSON.stringify(styles.length)},
  resolve: {
    // the library is linked with file:.. — make sure it uses THIS app's React / Remotion (one copy of each)
    dedupe: ['react', 'react-dom', 'remotion', '@remotion/player', '@remotion/three', '@remotion/transitions', '@remotion/google-fonts', '@remotion/noise', '@remotion/paths', '@remotion/layout-utils', 'three', '@react-three/fiber'],
  },
  server: {fs: {allow: ['..']}},
  build: {chunkSizeWarningLimit: 2500, assetsInlineLimit: 0},
});
