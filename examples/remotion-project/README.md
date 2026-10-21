# Using the library inside an existing Remotion project (`mgl add`)

`mgl add` copies only the source a host project needs — shadcn-style — instead of making it depend on the whole
library. esbuild's metafile traces each motion's (and recipe's) transitive local imports; the files are copied under
`<host>/src/opus-motion/` with the library's folder structure, so every relative import keeps working, and a small
`registry.ts` with only those motions replaces the full one. Public assets referenced by the defaults or recipes are
copied into the host's `public/`.

This folder is a minimal "existing" Remotion project (`src/index.ts`, `src/Root.tsx`) that uses a recipe and a motion.

## Steps

```bash
# 1. in the host project: copy motions / recipes (choose with: node <lib>/cli/mgl.mjs suggest "…")
node ../../cli/mgl.mjs add hero-aurora-night product-launch number-counter --to src --public ../public
#    -> src/opus-motion/{core, motions, Compose.tsx, Layers.tsx, transitions.tsx, web/hosts.tsx, registry.ts, index.ts, recipes/}

# 2. install exactly what it printed (Remotion packages must share one version)
npm install

# 3. use them
#    src/Root.tsx:  import {heroAuroraNightRecipe, productLaunchRecipe, numberCounter} from './opus-motion';
npx tsc --noEmit
npx remotion still src/index.ts hero out/hero.png --frame=150
npx remotion render src/index.ts launch out/launch.mp4
```

Add `--player` to also copy `MotionPlayer` / `MotionMix` / `MotionBackground` (for a React website that wants the
same motions live), and `--dry` to see what would be copied.

`src/Root.tsx` shows three ways to use the copies:

```tsx
<Composition id="hero" component={heroAuroraNightRecipe.component} … durationInFrames={heroAuroraNightRecipe.durationInFrames} />   // a layered recipe
<Composition id="launch" component={productLaunchRecipe.component} … />                                                          // a multi-scene recipe (Compose)
<Composition id="counter" component={numberCounter.component} defaultProps={{...numberCounter.defaultProps, label: 'DOWNLOADS', unit: ''}} … />
```

Inside your own scenes, a copied motion is just a component: `<numberCounter.component {...numberCounter.defaultProps} label="…" />`.

## Verified

Done for real into a scratch copy of this project (2026-10-21): `mgl add hero-aurora-night product-launch
number-counter --player` copied 27 files + generated `registry.ts`, `meta.ts`, `recipes.ts`, `web/local.ts`,
`index.ts`; after the printed `npm install`, `tsc --noEmit` passed, `remotion bundle` built, and `remotion still`
rendered all three compositions (aurora hero with the title, the browser-mockup launch scene, a 125 000 counter).

`src/opus-motion/` is gitignored here: re-run step 1 to regenerate it.
