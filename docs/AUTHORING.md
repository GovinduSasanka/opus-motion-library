# Authoring a motion

Every motion is one file in `src/motions/<family>/<id>.tsx` that exports a `defineMotion({...})`.
`node cli/gen-registry.mjs` finds it automatically, rebuilds `src/registry.ts` and `catalog.json`.

## Rules

1. **Deterministic.** Never use `Math.random()`, `Date`, or effects with timers. Use `rng(seed)`, `scatter()`,
   `n2/n3/fbm` from `src/core/random.ts`, or Remotion's `random('key')`. Everything is a pure function of `useCurrentFrame()`.
2. **Resolution independent.** Get `{w, h, u, cx, cy, portrait}` from `useStage()`. Size things in `u`
   (1u = 1 px on the short side of a 1080 frame) or as fractions of `w`/`h`. The motion must look right at
   1920×1080, 1080×1080 and 1080×1920.
3. **Timing in frames at 30 fps.** Source measurements in the analysis docs are often at 24 or 60 fps —
   convert to seconds then ×30. Use `ease.*`, `prog()`, `tween()`, `springAt()`, `envelope()` from `src/core/ease.ts`.
   Prefer the easing the analysis doc measured.
4. **Props are JSON.** Strings, numbers, booleans, arrays and plain objects only (they come from the CLI and
   compose specs). Expose the things a director would change: text, colours, counts, speed, seeds, image paths.
   Every prop has a default and a one-line `propDocs` entry.
5. **Looks finished with zero props and zero assets.** Defaults reproduce the source look. If a motion can show
   a picture (`src`, `images`), it must fall back to a procedural drawing or gradient when none is given.
   Images are `public/` paths loaded with `staticFile()` + `<Img>`.
6. **Self-contained scene.** A motion paints its own full-frame background (unless it is an overlay —
   then say so in the description and default `background` to `'transparent'`). Fill the default duration with
   meaningful motion: entrance, life, and (where it suits) a settle or exit. No dead frames.
7. **Shared building blocks** live in `src/core/` (`stage.tsx`: Svg, PaperTexture, FilmGrain, Vignette,
   Scanlines, Camera, useHandheld; `shapes.tsx`: GlossySphere, Sparkle, smoothClosed/smoothOpen, regular,
   drawOn; `fonts.ts`: font roles sans/display/mono/serif/comic/hand/grotesk). Use them; add a core helper only
   when two or more motions need it.
8. **SVG first.** Use SVG for vector looks. Use `<ThreeCanvas>` from `@remotion/three` only for real 3D
   (isometric extrusions, terrain meshes, lit objects). Canvas-heavy particle fields may use SVG circles
   (keep ≤ ~4000 elements) or a `<canvas>` drawn in `useLayoutEffect`-free render via a ref +
   `useCurrentFrame` (draw synchronously inside a `useMemo`-created canvas is NOT allowed; use
   SVG or three.js instead).
9. **Unique SVG ids.** `<defs>` ids must be unique per instance — include the motion id and an index.

## Template

```tsx
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {background: string; color: string; count: number};

const MyMotion: React.FC<Props> = ({background, color, count}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy} = useStage();
  const t = prog(frame, 0, 20, ease.out);
  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <circle cx={cx} cy={cy} r={120 * u * t} fill={color} />
      </Svg>
    </AbsoluteFill>
  );
};

export const myMotion = defineMotion<Props>({
  id: 'my-motion',
  title: 'My motion',
  category: 'shape',
  description: 'One sentence: what you see.',
  source: ['video4 0:01-0:03'],
  useFor: 'One sentence: what it is for in a new video.',
  durationInFrames: 120,
  defaultProps: {background: '#ECE4D7', color: '#3383CB', count: 3},
  propDocs: {color: 'stroke colour', count: 'how many rings'},
  component: MyMotion,
  tags: ['pulse'],
});
```

## Verify every motion

```bash
node cli/gen-registry.mjs            # registry + catalog
npx tsc --noEmit                     # types
node cli/mgl.mjs still <id> --frame 45 --out out/check/<id>-45.png
node cli/mgl.mjs still <id> --frame 45 --format portrait --out out/check/<id>-p.png
node cli/mgl.mjs render <id> --out out/check/<id>.mp4   # then tile frames with ffmpeg and look
```

Look at the stills (Read tool) and compare with the source frames in `analysis/frames/videoN/` or the sheets in
`analysis/sheets/videoN/`. Fix until it reads as the same motion.

## Pitfalls learned while building the library
- **SVG filter alpha:** `feComposite operator="arithmetic"` with `k1` multiplies the alpha channels too, so a
  multiply-blend of two opaque layers can come out semi-transparent (the frame turns dark). Re-assert alpha with
  `feComponentTransfer` → `feFuncA type="table" tableValues="1 1"` at the end of the chain.
- **Text width:** measure text with a canvas `measureText` inside render (never cache before web fonts load), or use
  per-font average widths.
- **Parallel bundling:** several processes bundling at once can corrupt the webpack cache (harmless warnings); render
  final videos from a single process.
