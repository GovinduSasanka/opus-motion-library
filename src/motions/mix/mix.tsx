import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Layers, LayerSpec} from '../../Layers';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {background: string; layers: LayerSpec[]};

/** Mix several motions in one frame: each layer is a motion id with its own props, timing, opacity and blend. */
const Mix: React.FC<Props> = ({background, layers}) => {
  const {durationInFrames} = useStage();
  return (
    <AbsoluteFill style={{background}}>
      <Layers layers={layers} length={durationInFrames} />
    </AbsoluteFill>
  );
};

export const mix = defineMotion<Props>({
  id: 'mix',
  title: 'Mix (layer motions together)',
  category: 'fx',
  description: 'Stacks any motions in one frame: backdrop + subject + text + accent, each with its own timing, opacity and blend mode.',
  source: ['library'],
  useFor: 'Building a richer shot out of several motions at once (e.g. aurora sky + neon sign + embers, or a photo look + callouts + captions).',
  durationInFrames: 180,
  defaultProps: {
    background: '#05070d',
    layers: [
      {motion: 'aurora', props: {pixelSize: 0}},
      {motion: 'blur-in-title', from: 24, props: {title: 'NORTHERN LIGHTS', subtitle: 'a mix of three motions', swapTo: null, backdrop: 'none', background: 'transparent', layout: 'upper'}},
      {motion: 'embers', props: {mode: 'motes', background: 'transparent'}, blend: 'screen'},
    ],
  },
  propDocs: {
    background: 'colour under all layers',
    layers: '[{motion, props?, from?, duration?, offset?, opacity?, blend?, scale?, x?, y?}] bottom to top',
  },
  component: Mix,
  tags: ['mix', 'layers', 'combine', 'composite'],
});
