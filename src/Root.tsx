import React from 'react';
import {Composition, Folder} from 'remotion';
import {motions, registry} from './registry';
import {Compose, ComposeSpec, specDuration} from './Compose';
import {Styled} from './Layers';
import type {StyleRef} from './styles';
import demo from '../specs/demo.json';

type MotionInput = {motion: string; props?: Record<string, unknown>; style?: StyleRef; width?: number; height?: number; fps?: number; frames?: number};

/** Renders one motion by id with user props (used by `mgl render`). */
const MotionHost: React.FC<MotionInput> = ({motion, props, style}) => {
  const def = registry[motion];
  if (!def) throw new Error(`unknown motion "${motion}"`);
  const C = def.component;
  return (
    <Styled style={style}>
      <C {...def.defaultProps} {...(props ?? {})} />
    </Styled>
  );
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Motion"
      component={MotionHost}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={150}
      defaultProps={{motion: motions[0]?.id ?? '', props: {}} as MotionInput}
      calculateMetadata={({props}) => {
        const def = registry[props.motion];
        return {
          width: props.width ?? 1920,
          height: props.height ?? 1080,
          fps: props.fps ?? 30,
          durationInFrames: props.frames ?? def?.durationInFrames ?? 150,
        };
      }}
    />
    <Composition
      id="Compose"
      component={Compose}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={300}
      defaultProps={{spec: demo as unknown as ComposeSpec}}
      calculateMetadata={({props}) => ({
        width: props.spec.width ?? 1920,
        height: props.spec.height ?? 1080,
        fps: props.spec.fps ?? 30,
        durationInFrames: Math.max(1, specDuration(props.spec)),
      })}
    />
    {(['landscape', 'square', 'portrait'] as const).map((fmt) => {
      const [w, h] = fmt === 'landscape' ? [1920, 1080] : fmt === 'square' ? [1080, 1080] : [1080, 1920];
      return (
        <Folder key={fmt} name={fmt}>
          {motions.map((m) => (
            <Composition key={m.id} id={`${fmt}-${m.id}`} component={m.component} width={w} height={h} fps={30} durationInFrames={m.durationInFrames} defaultProps={m.defaultProps} />
          ))}
        </Folder>
      );
    })}
  </>
);
