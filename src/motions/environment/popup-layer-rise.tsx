import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {CritterPose, PAPER_LAYERS, PaperScene, easeInCubic, easeOutCubic, lin, paperPalette, x58Fonts} from '../../core/r2-x58-kit';

/**
 * x5 popup-layer-rise: the scene assembles like a pop-up book. The sky is already there; every paper layer slides
 * up from below into place, far layers first, the nearest last and from furthest down (rise = riseBase·H +
 * risePerDepth·H·depth, easeOutCubic, no overshoot, ≈ 0.15 s stagger back to front; measured far 95 px over
 * 0–0.6 s, foreground 200 px over 0.33–1.2 s at 1080p). Optional reverse exit at `exitAt`: layers drop out
 * near-first with easeInCubic and vertical motion blur until only the sky is left.
 */
type Props = {
  palette: 'sunset' | 'moonlit' | 'dawn';
  direction: 'up' | 'down';
  stagger: number;
  duration: number;
  riseBase: number;
  risePerDepth: number;
  exitAt: number;
  exitFrames: number;
  heroAction: CritterPose;
  species: 'fox' | 'cat' | 'wolf' | 'hare';
  showHero: boolean;
  ambient: string[];
  guideStar: boolean;
  title: string;
  titleColor: string;
  dolly: number;
  seed: number;
};

const PopupLayerRise: React.FC<Props> = ({palette, direction, stagger, duration, riseBase, risePerDepth, exitAt, exitFrames, heroAction, species, showHero, ambient, guideStar, title, titleColor, dolly, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const pal = paperPalette(palette);
  const n = PAPER_LAYERS.length;
  const dir = direction === 'down' ? -1 : 1;
  const offset = (i: number, depth: number) => {
    if (i === 0) return {dy: 0};
    const rise = (riseBase + risePerDepth * depth) * h;
    // far first: layer 1 starts at 0, nearest last; the foreground travels furthest
    const st = (i - 1) * stagger;
    const k = easeOutCubic(lin(frame, st, st + duration));
    let dy = dir * rise * (1 - k);
    let blur = 0;
    if (exitAt > 0 && frame >= exitAt) {
      // exit near-first: nearest layer index n-1 leaves first
      const order = n - 1 - i;
      const es = exitAt + order * Math.max(1, stagger * 0.5);
      const p = lin(frame, es, es + exitFrames);
      const drop = (0.3 + 0.3 * depth) * h;
      dy += dir * drop * easeInCubic(p);
      const v = 3 * Math.pow(Math.min(1, p), 2) * (p < 1 ? 1 : 0);
      blur = v * 10 * u;
    }
    const enterBlur = (1 - easeOutCubic(lin(frame, st, st + duration))) * 8 * u * (frame >= st ? 1 : 0);
    return {dy, blur: Math.max(blur, enterBlur * 0.6)};
  };
  const tIn = lin(frame, 30, 50);
  const tOut = exitAt > 0 ? lin(frame, exitAt, exitAt + 8) : 0;
  return (
    <AbsoluteFill style={{background: pal.skyTop, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <PaperScene
          id={`popup-layer-rise-${seed}`}
          w={w}
          h={h}
          u={u}
          frame={frame}
          fps={fps}
          pal={pal}
          seed={seed}
          offset={offset}
          rate={dolly}
          pan={0}
          focus={[0.42, 0.4]}
          hero={showHero}
          heroPose={heroAction}
          species={species}
          heroX={0.31}
          ambient={ambient}
          guideStar={guideStar}
          starIgnite={40}
          starX={0.65}
          starY={0.075}
          dof={4}
        />
      </svg>
      {title ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: portrait ? h * 0.27 : h * 0.08,
            textAlign: 'center',
            fontFamily: x58Fonts.fraunces,
            fontWeight: 600,
            fontSize: (portrait ? 92 : 84) * u,
            color: titleColor,
            opacity: tIn * (1 - tOut),
            transform: `translateY(${(1 - tIn) * 24 * u}px)`,
            textShadow: `0 ${3 * u}px ${8 * u}px rgba(0,0,0,0.35)`,
          }}
        >
          {title}
        </div>
      ) : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(20,10,30,0.28) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

export const popupLayerRise = defineMotion<Props>({
  id: 'popup-layer-rise',
  title: 'Pop-up layer rise',
  category: 'environment',
  description:
    'A cut-paper landscape assembles like a pop-up book: over the existing sky each paper layer slides up into place, far layers first and the nearest last from furthest down (easeOutCubic, no overshoot), then holds with a slow dolly and drops back out near-first with motion blur.',
  source: ['video x5 0:00-0:01.2 (phase-correlated layer rise)', 'video x5 47.6-48.3 s (reversed inside the layer swap)'],
  useFor: '"Opening the book" intros for any layered illustration, chapter openers, exploded-view build-ins and slide build-ins.',
  durationInFrames: 150,
  defaultProps: {
    palette: 'sunset',
    direction: 'up',
    stagger: 4,
    duration: 22,
    riseBase: 0.09,
    risePerDepth: 0.1,
    exitAt: 118,
    exitFrames: 12,
    heroAction: 'look-up',
    species: 'fox',
    showHero: true,
    ambient: ['water'],
    guideStar: true,
    title: '',
    titleColor: '#FFF6E8',
    dolly: 1.2,
    seed: 5,
  },
  propDocs: {
    palette: "'sunset' | 'moonlit' | 'dawn'",
    direction: "'up' = layers rise from below (pop-up book) | 'down' = layers drop in from above",
    stagger: 'frames between layers (back to front)',
    duration: 'frames each layer takes to land (easeOutCubic)',
    riseBase: 'travel of the farthest layer as a fraction of height',
    risePerDepth: 'extra travel per unit depth (the nearest layer travels riseBase + risePerDepth)',
    exitAt: 'frame the layers drop back out near-first (0 = no exit)',
    exitFrames: 'frames each layer takes to drop out (easeInCubic)',
    heroAction: "critter pose: 'walk' | 'sit' | 'stand' | 'look-up'",
    species: "critter recolour: 'fox' | 'cat' | 'wolf' | 'hare'",
    showHero: 'show the paper critter',
    ambient: "any of 'water', 'stars', 'fireflies', 'rain'",
    guideStar: 'golden guide star ignites once the scene has landed',
    title: 'optional title in the sky band (fades in after the build)',
    titleColor: 'title colour',
    dolly: 'push-in rate %/s once assembled',
    seed: 'layout seed',
  },
  component: PopupLayerRise,
  tags: ['paper', 'pop-up book', 'build-in', 'layers', 'rise', 'stagger', 'assemble', 'intro', 'storybook', 'diorama', 'parallax', 'opening', 'craft', 'reveal'],
});
