import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // the library is linked with file:../.. — make sure it uses THIS app's React / Remotion (one copy of each)
    dedupe: ['react', 'react-dom', 'remotion', '@remotion/player', '@remotion/three', '@remotion/transitions', '@remotion/google-fonts', '@remotion/noise', '@remotion/paths', '@remotion/layout-utils', 'three', '@react-three/fiber'],
  },
  build: {chunkSizeWarningLimit: 2000},
});
