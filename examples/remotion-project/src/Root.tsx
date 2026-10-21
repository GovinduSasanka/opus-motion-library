import React from 'react';
import {Composition} from 'remotion';
import {heroAuroraNightRecipe, productLaunchRecipe, numberCounter} from './opus-motion';

// an existing Remotion project using motions copied with `mgl add`
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="hero" component={heroAuroraNightRecipe.component} width={1920} height={1080} fps={30} durationInFrames={heroAuroraNightRecipe.durationInFrames} />
    <Composition id="launch" component={productLaunchRecipe.component} width={1920} height={1080} fps={30} durationInFrames={productLaunchRecipe.durationInFrames} />
    <Composition
      id="counter"
      component={numberCounter.component}
      defaultProps={{...numberCounter.defaultProps, label: 'DOWNLOADS', unit: '', keyframes: [[0, 0], [90, 125000], [150, 125000]], backdrop: 'ink', readouts: []}}
      width={1080}
      height={1080}
      fps={30}
      durationInFrames={150}
    />
  </>
);
