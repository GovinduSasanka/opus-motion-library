import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {ease, prog, springAt} from '../../core/ease';
import {defineMotion} from '../../core/types';

export interface CaptionCue {
  text: string;
  from: number;
  to: number;
  /** words to highlight; wrap in *asterisks* inside text works too */
  highlight?: string[];
}

type Style = {
  position?: 'bottom' | 'center' | 'top';
  color?: string;
  highlightColor?: string;
  highlightText?: string;
  size?: number;
  font?: keyof typeof fonts;
  /** reveal words one at a time across the cue (video10) */
  wordByWord?: boolean;
};

/**
 * Word-pop captions with highlight boxes (video10 "People *bent* double").
 * Each word pops with a 0.18 s back-ease scale from 0.82; highlighted words sit on a solid box.
 */
const CaptionLine: React.FC<{cue: CaptionCue} & Style> = ({cue, position = 'bottom', color = '#ffffff', highlightColor = '#d23a2c', highlightText = '#ffffff', size = 46, font = 'sans', wordByWord = true}) => {
  const frame = useCurrentFrame();
  const {u, fps, h} = useStage();
  const words = cue.text.split(/\s+/).filter(Boolean);
  const dur = cue.to - cue.from;
  const per = Math.max(3, Math.min(9, (dur * 0.6) / words.length));
  const exit = prog(frame, cue.to - 5, cue.to, ease.in);
  const top = position === 'bottom' ? h * 0.78 : position === 'top' ? h * 0.1 : h * 0.47;
  return (
    <div
      style={{
        position: 'absolute',
        left: '7%',
        right: '7%',
        top,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: `${size * 0.18 * u}px ${size * 0.28 * u}px`,
        fontFamily: fonts[font],
        fontWeight: 800,
        fontSize: size * u,
        lineHeight: 1.15,
        opacity: 1 - exit,
      }}
    >
      {words.map((raw, i) => {
        const starred = /^\*.*\*[.,!?]*$/.test(raw);
        const w = raw.replace(/\*/g, '');
        const hl = starred || (cue.highlight ?? []).some((x) => w.toLowerCase().replace(/[^a-z0-9]/g, '') === x.toLowerCase());
        const start = cue.from + (wordByWord ? i * per : 0);
        const s = frame < start ? 0 : springAt(frame, fps, start, 'pop');
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              transform: `scale(${0.82 + 0.18 * s}) translateY(${(1 - s) * 10 * u}px)`,
              opacity: frame < start ? 0 : Math.min(1, s * 1.4),
              color: hl ? highlightText : color,
              background: hl ? highlightColor : 'transparent',
              padding: hl ? `0 ${size * 0.14 * u}px` : 0,
              borderRadius: 3 * u,
              textShadow: hl ? 'none' : `0 ${2 * u}px ${8 * u}px rgba(0,0,0,0.85), 0 0 ${2 * u}px rgba(0,0,0,0.9)`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const CaptionTrack: React.FC<{cues: CaptionCue[]} & Style> = ({cues, ...style}) => {
  const frame = useCurrentFrame();
  const cue = cues.find((c) => frame >= c.from && frame < c.to);
  return <AbsoluteFill style={{pointerEvents: 'none'}}>{cue && <CaptionLine cue={cue} {...style} />}</AbsoluteFill>;
};

const Demo: React.FC<{lines: string[]; framesPerLine: number; background: string} & Style> = ({lines, framesPerLine, background, ...style}) => {
  const cues = lines.map((text, i) => ({text, from: i * framesPerLine, to: (i + 1) * framesPerLine}));
  return (
    <AbsoluteFill style={{background}}>
      <CaptionTrack cues={cues} {...style} />
    </AbsoluteFill>
  );
};

export const kineticCaptions = defineMotion({
  id: 'kinetic-captions',
  title: 'Kinetic word captions',
  category: 'text',
  description: 'Word-by-word pop-in captions; *starred* words sit on a solid highlight box.',
  source: ['video10 0:04-0:42'],
  useFor: 'Narrated shorts: subtitles that pace with the voice and punch key words.',
  durationInFrames: 150,
  defaultProps: {
    lines: ['People *bent* double', 'on the *sidewalk.*', 'It *isn\'t* new.'],
    framesPerLine: 50,
    background: '#1c2433',
    position: 'center' as const,
    highlightColor: '#d23a2c',
    size: 64,
  },
  propDocs: {
    lines: 'caption lines; wrap a word in *stars* to highlight it',
    framesPerLine: 'frames each line stays on screen',
    position: 'bottom | center | top',
    highlightColor: 'box colour behind highlighted words',
  },
  component: Demo,
});
