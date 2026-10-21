import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {clamp, ease} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {Backdrop, BackdropKind, eic, eoc, typed} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Narrative captions.
 * - box (video21 subtitle-box): black box with a 2 px grey outer line and a 1 px inner rule at the
 *   bottom of a letterboxed shot; white gothic text, left-padded; captions swap on hard cuts, typed
 *   RPG-style (or instant / fade) with a blinking ▼ when complete.
 * - plate (video12 time labels): yellow comic plate with an ink border and hard offset shadow, bold
 *   italic time ("7:00 AM") + caps label ("RISE AND SHINE"); springs in from the left, kicks out on change.
 */

type Item = {text: string; tag?: string};
type Props = {
  variant: 'box' | 'plate';
  items: Item[];
  framesPerItem: number;
  startFrame: number;
  reveal: 'type' | 'instant' | 'fade';
  charsPerSecond: number;
  letterbox: boolean;
  textColor: string;
  boxColor: string;
  borderColor: string;
  plateColor: string;
  inkColor: string;
  size: number;
  backdrop: BackdropKind | 'auto';
  src: string;
};

const SAMPLES: Record<Props['variant'], Item[]> = {
  box: [
    {text: 'The ship threaded south between the drifting ice.'},
    {text: 'No one aboard had seen the sun in eleven days.'},
    {text: 'And then, without a sound, the sky began to move.'},
  ],
  plate: [
    {tag: '7:00 AM', text: 'RISE AND SHINE'},
    {tag: '7:30 AM', text: 'BREAKFAST'},
    {tag: '8:15 AM', text: 'CASTRO STATION'},
  ],
};

const StoryCaptionBox: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const items = p.items.length ? p.items : SAMPLES[p.variant];
  const rel = frame - p.startFrame;
  const idx = clamp(Math.floor(rel / p.framesPerItem), 0, items.length - 1);
  const local = rel - idx * p.framesPerItem;
  const it = items[idx];
  const backdrop: BackdropKind = p.backdrop === 'auto' ? (p.variant === 'box' ? 'aurora' : 'comic') : p.backdrop;
  const S = (p.size / 34) * u;

  let body: React.ReactNode = null;
  if (p.variant === 'box' && rel >= 0) {
    const n = p.reveal === 'type' ? Math.min(it.text.length, typed(local, -1, p.charsPerSecond)) : it.text.length;
    const done = n >= it.text.length;
    const op = p.reveal === 'fade' ? eoc(local / 8) : 1;
    const boxW = portrait ? w * 0.9 : Math.max(w * 0.52, Math.min(w * 0.8, it.text.length * p.size * 0.55 * u + 120 * u));
    const bar = p.letterbox ? h * (portrait ? 0.06 : 0.12) : 0;
    body = (
      <div
        style={{
          position: 'absolute',
          left: (w - boxW) / 2,
          width: boxW,
          bottom: Math.max(h * 0.035, bar * 0.3),
          minHeight: 112 * S,
          background: p.boxColor,
          border: `${2 * u}px solid ${p.borderColor}`,
          boxSizing: 'border-box',
          padding: 6 * u,
        }}
      >
        <div style={{border: `${1 * u}px solid ${p.borderColor}`, minHeight: 112 * S - 16 * u, boxSizing: 'border-box', display: 'flex', alignItems: 'center', padding: `${20 * S}px ${40 * S}px`, position: 'relative'}}>
          <div style={{fontFamily: fonts.sans, fontWeight: 400, fontSize: p.size * u, color: p.textColor, lineHeight: 1.4, letterSpacing: '0.04em', opacity: op}}>
            <span>{it.text.slice(0, n)}</span>
            <span style={{opacity: 0}}>{it.text.slice(n)}</span>
          </div>
          {done && p.reveal === 'type' && (
            <div style={{position: 'absolute', right: 18 * S, bottom: 10 * S, fontSize: 18 * S, color: p.textColor, opacity: Math.floor(local / 12) % 2 ? 0.2 : 0.9, transform: `translateY(${Math.floor(local / 12) % 2 ? 2 * u : 0}px)`}}>▼</div>
          )}
        </div>
      </div>
    );
  }

  if (p.variant === 'plate' && rel >= 0) {
    const S = (p.size / 34) * u * 1.35;
    const sIn = spring({frame: local, fps, config: {damping: 13, stiffness: 220, mass: 0.6}});
    const out = idx < items.length - 1 ? eic((local - (p.framesPerItem - 6)) / 6) : 0;
    const x0 = (portrait ? 48 : 80) * u;
    const tx = -(1 - sIn) * 420 * S - out * 600 * S;
    const rot = (1 - sIn) * -6 + out * -4;
    body = (
      <div style={{position: 'absolute', left: x0, bottom: (portrait ? 200 : 76) * u, transform: `translateX(${tx}px) rotate(${rot}deg) skewX(-6deg)`, transformOrigin: 'left bottom'}}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22 * S,
            padding: `${10 * S}px ${30 * S}px ${10 * S}px ${24 * S}px`,
            background: p.plateColor,
            border: `${4 * S}px solid ${p.inkColor}`,
            boxShadow: `${8 * S}px ${8 * S}px 0 ${p.inkColor}, ${-3 * S}px ${-3 * S}px 0 #ff4f9a`,
            backgroundImage: `radial-gradient(${p.inkColor}22 ${1.6 * S}px, transparent ${1.8 * S}px)`,
            backgroundSize: `${8 * S}px ${8 * S}px`,
          }}
        >
          <span style={{fontFamily: fonts.comic, fontSize: 56 * S, color: p.inkColor, letterSpacing: '0.02em', whiteSpace: 'nowrap', transform: 'skewX(-8deg)', display: 'inline-block'}}>{it.tag}</span>
          <span style={{fontFamily: fonts.sans, fontWeight: 600, fontSize: 30 * S, color: p.inkColor, letterSpacing: '0.06em', whiteSpace: 'nowrap'}}>{it.text}</span>
        </div>
      </div>
    );
  }

  const bar = p.variant === 'box' && p.letterbox ? h * (portrait ? 0.06 : 0.12) : 0;
  const cutKick = local < 1 && idx > 0 ? 1.01 : 1;
  return (
    <AbsoluteFill style={{background: backdrop === 'none' && !p.src ? 'transparent' : '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${(1.02 + frame * 0.0002) * cutKick}) translateX(${-frame * 0.1 * u}px)`}}>
        <Backdrop kind={backdrop} src={p.src || undefined} drift={p.variant === 'box' ? 1 : 0.4} />
      </AbsoluteFill>
      {bar > 0 && (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: bar, background: '#000'}} />
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: bar, background: '#000'}} />
        </>
      )}
      {body}
    </AbsoluteFill>
  );
};

export const storyCaptionBox = defineMotion<Props>({
  id: 'story-caption-box',
  title: 'Story caption box',
  category: 'text',
  description: 'Double-ruled black narrative caption box under a letterboxed scene (RPG-style typing), or a yellow comic time-stamp plate ("7:00 AM  RISE AND SHINE").',
  source: ['video21 0:17.2-0:18.2', 'video12 0:02-1:30'],
  useFor: 'Story narration, game cutscene text, timeline time-stamps and location/time chyrons.',
  durationInFrames: 210,
  defaultProps: {
    variant: 'box',
    items: [],
    framesPerItem: 66,
    startFrame: 8,
    reveal: 'type',
    charsPerSecond: 36,
    letterbox: true,
    textColor: '#ffffff',
    boxColor: '#000000',
    borderColor: '#8a8a8a',
    plateColor: '#ffd93a',
    inkColor: '#1b1030',
    size: 34,
    backdrop: 'auto',
    src: '',
  },
  propDocs: {
    variant: 'box (video21 narrative box) | plate (video12 time-stamp plate)',
    items: '[{text, tag?}] shown in order; plate uses tag as the time and text as the label; [] = built-in sample',
    framesPerItem: 'frames each caption stays',
    startFrame: 'frame the first caption appears',
    reveal: 'box: type (RPG typing + ▼) | instant (video21) | fade',
    charsPerSecond: 'typing speed for reveal = type',
    letterbox: 'box: black cinema bars top and bottom',
    borderColor: 'box outline + inner rule colour (video21 #616161 on 1080p)',
    plateColor: 'plate fill',
    inkColor: 'plate border / shadow / text colour',
    size: 'caption text size in px at 1080p (plate scales with it)',
    backdrop: 'auto (aurora pixel night for box, comic room for plate) | any backdrop kind',
    src: 'optional public/ image as the scene',
  },
  component: StoryCaptionBox,
  tags: ['caption', 'subtitle', 'story', 'chyron', 'timestamp', 'comic'],
});
