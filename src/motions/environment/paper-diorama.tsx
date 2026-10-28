import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {CritterPose, PaperScene, paperPalette, x58Fonts} from '../../core/r2-x58-kit';

/**
 * x5 paper-diorama: a storybook landscape built from 8 paper cut-out layers (sky, clouds, far range, near range +
 * lake, forest band, meadow with the hero on a stone bridge, stream + rocks, a blurred foreground of flowers).
 * Each layer has fibre texture, a light torn rim on its top edges and a soft drop shadow on the layer behind.
 * The stack breathes with a linear multiplane dolly (near ≈ 2 %/s, far ≈ 0.8 %/s about (0.42 W, 0.40 H)) plus
 * a lateral truck (foreground −27 px/s), the original paper critter walks in place, the stream flows, and a golden
 * guide star ignites at 1.53 s with a sparkle spray and a trail of 6 tiny stars.
 */
type Props = {
  palette: 'sunset' | 'moonlit' | 'dawn';
  heroAction: CritterPose;
  species: 'fox' | 'cat' | 'wolf' | 'hare';
  showHero: boolean;
  heroSrc: string;
  heroX: number;
  ambient: string[];
  guideStar: boolean;
  starAt: number;
  starX: number;
  starY: number;
  dolly: number;
  pan: number;
  dof: number;
  title: string;
  titleColor: string;
  seed: number;
};

const PaperDiorama: React.FC<Props> = ({palette, heroAction, species, showHero, heroSrc, heroX, ambient, guideStar, starAt, starX, starY, dolly, pan, dof, title, titleColor, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const pal = paperPalette(palette);
  const S = Math.min(h, w * 0.75);
  const heroNode = heroSrc ? (
    <foreignObject x={w * heroX - S * 0.16} y={h * 0.6 - S * 0.26} width={S * 0.32} height={S * 0.26}>
      <Img src={resolveSrc(heroSrc)} style={{width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom'}} />
    </foreignObject>
  ) : undefined;
  const titleIn = Math.min(1, Math.max(0, (frame - 20) / 24));
  return (
    <AbsoluteFill style={{background: pal.skyTop, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <PaperScene
          id={`paper-diorama-${seed}`}
          w={w}
          h={h}
          u={u}
          frame={frame}
          fps={fps}
          pal={pal}
          seed={seed}
          rate={dolly}
          pan={pan}
          focus={[0.42, 0.4]}
          hero={showHero}
          heroPose={heroAction}
          species={species}
          heroX={heroX}
          ambient={ambient}
          guideStar={guideStar}
          starIgnite={starAt}
          starX={starX}
          starY={starY}
          dof={dof}
          heroNode={heroNode}
        />
      </svg>
      {title ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: portrait ? h * 0.27 : h * 0.07,
            textAlign: portrait ? 'center' : 'left',
            paddingLeft: portrait ? 0 : w * 0.06,
            fontFamily: x58Fonts.fraunces,
            fontWeight: 600,
            fontSize: (portrait ? 92 : 84) * u,
            color: titleColor,
            letterSpacing: -0.5 * u,
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 20 * u}px)`,
            textShadow: `0 ${3 * u}px ${8 * u}px rgba(0,0,0,0.35)`,
          }}
        >
          {title}
        </div>
      ) : null}
      {/* soft vignette */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(20,10,30,0.28) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

export const paperDiorama = defineMotion<Props>({
  id: 'paper-diorama',
  title: 'Paper diorama',
  category: 'environment',
  description:
    'A pop-up-book landscape of 8 cut-paper layers with fibre texture, torn light rims and soft inter-layer shadows; a slow multiplane dolly, a walking paper critter on a stone bridge, a flowing stream and a golden guide star that ignites and leaves a trail.',
  source: ['video x5 0:00-0:06 (alpine sunset scene, measured dolly 6.5-11 s)', 'video x5 every scene (layer stack, palette)'],
  useFor: 'Storybook / brand-journey openers, children’s education, calm website hero loops and chapter backgrounds with a title in the sky band.',
  durationInFrames: 180,
  defaultProps: {
    palette: 'sunset',
    heroAction: 'walk',
    species: 'fox',
    showHero: true,
    heroSrc: '',
    heroX: 0.31,
    ambient: ['water'],
    guideStar: true,
    starAt: 46,
    starX: 0.65,
    starY: 0.075,
    dolly: 1.6,
    pan: 27,
    dof: 4,
    title: '',
    titleColor: '#FFF6E8',
    seed: 3,
  },
  propDocs: {
    palette: "'sunset' (warm dusk) | 'moonlit' (night, stars, moon) | 'dawn' (pale morning)",
    heroAction: "critter pose: 'walk' (in place) | 'sit' | 'stand' | 'look-up'",
    species: "critter recolour: 'fox' | 'cat' | 'wolf' | 'hare'",
    showHero: 'show the paper critter on the bridge',
    heroSrc: 'optional public/ image (transparent PNG) to stand on the bridge instead of the critter',
    heroX: 'hero x as a fraction of width (keep it on the left third, eye line to the star)',
    ambient: "ambient loops: any of 'water', 'stars', 'fireflies', 'rain'",
    guideStar: 'show the golden guide star',
    starAt: 'frame the guide star ignites (bloom + sparkle spray + trail)',
    starX: 'guide star x (fraction of width)',
    starY: 'guide star y (fraction of height)',
    dolly: 'push-in rate in %/s at depth 1 (far layers move 40 %)',
    pan: 'lateral truck in px/s at depth 1 (0 = pure push-in)',
    dof: 'blur (px at 1080p) on the nearest foreground layer',
    title: 'optional title set in the sky band (Fraunces)',
    titleColor: 'title colour',
    seed: 'layout seed (mountains, trees, flowers)',
  },
  component: PaperDiorama,
  tags: ['paper', 'paper-cut', 'diorama', 'pop-up book', 'storybook', 'layers', 'parallax', 'multiplane', 'landscape', 'mountains', 'fox', 'critter', 'guide star', 'craft', 'kids', 'journey', 'hero', 'background', 'sunset'],
});
