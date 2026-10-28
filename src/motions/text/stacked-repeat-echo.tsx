import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {useStage} from '../../core/stage';
import {Bg, fitBlock, mixCol} from '../../core/kinetic-type-kit';
import {tfonts, TFont} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Stacked repeat echo: the headline repeated again and again behind itself — offset outlines marching up or down,
 * a zooming tunnel, a diagonal trail or a fan — fading from the front word's colour to a second accent. The copies
 * peel off the front word one after another and then breathe slowly. The front word stays crisp and readable.
 */

type Props = {
  text: string;
  count: number;
  mode: 'stack' | 'tunnel' | 'diagonal' | 'fan';
  direction: 'up' | 'down' | 'both';
  echoStyle: 'outline' | 'alternate' | 'solid';
  spread: number;
  fade: number;
  float: number;
  font: TFont;
  size: number;
  weight: number;
  tracking: number;
  textCase: 'upper' | 'none';
  startAt: number;
  stagger: number;
  stroke: number;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
};

const Echo: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const n = Math.max(1, Math.round(p.count));
  const text = p.textCase === 'upper' ? p.text.toUpperCase() : p.text;
  const maxW = w * (w < h ? 0.88 : 0.82);
  const stackK = p.mode === 'stack' ? p.spread * n : p.mode === 'diagonal' ? p.spread * 0.6 * n : 0;
  const fit0 = fitBlock(text, p.size * u, maxW * 0.97, h * 0.5, p.font, 1.0, p.tracking);
  const cap = (h * 0.86) / (fit0.lines.length * 1.0 + stackK);
  const size = Math.min(fit0.size, cap);
  const {lines} = fitBlock(text, size, maxW * 0.97, h * 0.6, p.font, 1.0, p.tracking);
  const lh = size * 1.0;
  const blockH = lines.length * lh;
  const spread = p.spread * size;
  const t = frame / 30;
  const outFade = 1 - prog(frame, durationInFrames - 12, durationInFrames, ease.in);
  const strokePx = Math.max(1.5 * u, p.stroke * size);
  const frontIn = prog(frame, p.startAt, p.startAt + 18, ease.back);

  const dirOf = (i: number) => (p.direction === 'up' ? -1 : p.direction === 'down' ? 1 : i % 2 === 0 ? -1 : 1);
  const shift = p.direction === 'both' ? 0 : -dirOf(1) * (p.mode === 'stack' ? (n * spread) / 2 : 0);

  const layer = (i: number, front: boolean) => {
    const k = front ? 0 : i;
    const s0 = p.startAt + 6 + (i - 1) * p.stagger;
    const e = front ? 1 : prog(frame, s0, s0 + 34, ease.out);
    const breathe = 1 + p.float * 0.18 * Math.sin(2 * Math.PI * (t * 0.5 - i * 0.07));
    const dist = k * spread * e * breathe;
    let tf = '';
    if (p.mode === 'stack') tf = `translateY(${dirOf(i) * dist + shift}px)`;
    else if (p.mode === 'diagonal') tf = `translate(${dist * 0.55}px, ${-dist * 0.55}px)`;
    else if (p.mode === 'tunnel') tf = `scale(${1 + k * 0.1 * e * breathe})`;
    else tf = `rotate(${k * 4.5 * e * breathe * (i % 2 === 0 ? 1 : -1)}deg)`;
    const t01 = n > 1 ? (k - 1) / (n - 1) : 0;
    const col = front ? p.ink : mixCol(p.accent, p.accent2, t01);
    const alpha = front ? 1 : lerp(1, 0.12, Math.pow(t01, 0.8) * p.fade) * Math.min(1, e * 2);
    let style: React.CSSProperties;
    const solid = p.echoStyle === 'solid' || (p.echoStyle === 'alternate' && i % 2 === 0);
    if (front) style = {color: p.ink};
    else if (solid) style = {color: col};
    else style = {color: 'transparent', WebkitTextStroke: `${strokePx}px ${col}`};
    return (
      <div
        key={front ? 'front' : i}
        style={{
          position: 'absolute',
          left: 0,
          top: h / 2 - blockH / 2,
          width: w,
          textAlign: 'center',
          whiteSpace: 'pre',
          lineHeight: `${lh}px`,
          fontFamily: tfonts[p.font],
          fontSize: size,
          fontWeight: p.weight,
          letterSpacing: p.tracking * size,
          transform: `${tf}${front ? ` scale(${0.85 + 0.15 * frontIn})` : ''}`,
          transformOrigin: '50% 50%',
          opacity: alpha * (front ? Math.min(1, frontIn * 1.5) : 1),
          ...style,
        }}
      >
        {lines.join('\n')}
      </div>
    );
  };

  return (
    <Bg background={p.background} glow={p.accent} glowAmount={0.07}>
      <div style={{position: 'absolute', inset: 0, opacity: outFade}}>
        {Array.from({length: n}).map((_, j) => layer(n - j, false))}
        {layer(0, true)}
      </div>
    </Bg>
  );
};

export const stackedRepeatEcho = defineMotion<Props>({
  id: 'stacked-repeat-echo',
  title: 'Stacked repeat echo',
  category: 'text',
  description:
    'A headline repeated again and again behind itself: copies peel off the crisp front word one after another as offset outlines marching up or down (or alternating solid and hollow, a zooming tunnel, a diagonal trail or a fan), fading from one accent to a second, then breathing slowly.',
  source: ['original — generic kinetic-type effect (R3)'],
  useFor: 'Bold poster-style hero words, music / fashion / sport titles, repeating-text backdrops behind a subject, section openers; replace the text and colours.',
  durationInFrames: 150,
  defaultProps: {
    text: 'Echo',
    count: 7,
    mode: 'stack',
    direction: 'up',
    echoStyle: 'outline',
    spread: 0.5,
    fade: 1,
    float: 1,
    font: 'display',
    size: 260,
    weight: 400,
    tracking: 0.01,
    textCase: 'upper',
    startAt: 6,
    stagger: 3,
    stroke: 0.018,
    background: '#101014',
    ink: '#F6F1E6',
    accent: '#FF4F6D',
    accent2: '#5A6BFF',
  },
  propDocs: {
    text: 'the headline (\\n = forced break; wraps and shrinks to fit)',
    count: 'how many echoes behind the front word',
    mode: 'stack (offset copies) | tunnel (growing copies) | diagonal (trail) | fan (rotating copies)',
    direction: 'stack mode: up | down | both',
    echoStyle: 'outline | alternate (solid and hollow) | solid',
    spread: 'distance between echoes as a fraction of the font size',
    fade: '0..1 how much the echoes fade towards the back',
    float: '0..1 amount of slow breathing after the echoes settle',
    font: 'font role',
    size: 'max font size in u; shrinks so the stack fits',
    weight: 'font weight',
    tracking: 'letter spacing in em',
    textCase: 'upper | none',
    startAt: 'frame the front word appears',
    stagger: 'frames between successive echoes peeling off',
    stroke: 'outline weight as a fraction of the font size',
    background: 'background colour; "transparent" for an overlay',
    ink: 'front word colour',
    accent: 'colour of the nearest echo',
    accent2: 'colour of the farthest echo',
  },
  component: Echo,
  tags: ['text', 'echo', 'repeat', 'stack', 'outline', 'tunnel', 'trail', 'headline', 'title', 'poster', 'hero', 'typography', 'kinetic', 'music', 'fashion', 'overlay'],
});
