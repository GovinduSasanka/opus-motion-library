import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {useStage} from '../../core/stage';
import {Bg, fitBlock} from '../../core/kinetic-type-kit';
import {tfonts, TFont} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Outline to fill: a headline appears as hollow outlined letters, then each letter fills with solid colour in turn
 * (rising like liquid with a wavy surface, or wiping up / down / left / right), optionally draining back to an outline.
 * The outline stays visible under the fill so the shape never jumps. Long text wraps and shrinks to fit.
 */

type Props = {
  text: string;
  subtitle: string;
  font: TFont;
  size: number;
  weight: number;
  tracking: number;
  textCase: 'upper' | 'none';
  direction: 'up' | 'down' | 'left' | 'right';
  surface: 'wipe' | 'liquid';
  fillDelay: number;
  stagger: number;
  fillFrames: number;
  startAt: number;
  cycle: 'fill' | 'fill-unfill';
  holdFilled: number;
  stroke: number;
  background: string;
  outline: string;
  fill: string;
  fill2: string;
  subtitleColor: string;
};

const OutlineFill: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const text = p.textCase === 'upper' ? p.text.toUpperCase() : p.text;
  const maxW = w * (w < h ? 0.88 : 0.84);
  const {size, lines} = fitBlock(text, p.size * u, maxW * 0.97, h * (p.subtitle ? 0.6 : 0.7), p.font, 1.06, p.tracking);
  const lh = size * 1.06;
  const strokePx = Math.max(1.5 * u, p.stroke * size);

  const flat: {li: number; ch: string; g: number}[] = [];
  let g = 0;
  lines.forEach((l, li) => [...l].forEach((ch) => flat.push({li, ch, g: ch === ' ' ? -1 : g++})));
  const N = Math.max(1, g);
  const lastIn = p.startAt + p.fillDelay + (N - 1) * p.stagger + p.fillFrames;
  const unfillStart = lastIn + p.holdFilled;

  const subA = prog(frame, p.startAt + 6, p.startAt + 24, ease.out);
  const blockH = lines.length * lh;
  const subH = p.subtitle ? size * 0.34 * 2.2 : 0;
  const top = h / 2 - (blockH + subH) / 2;

  const fillStyleOf = (inT: number, outT: number): React.CSSProperties => {
    const m = (x: number) => -10 + 120 * x;
    const startI = m(outT);
    const farI = 110 - 120 * inT;
    let clip: string;
    if (p.direction === 'up') clip = `inset(${farI}% -10% ${startI}% -10%)`;
    else if (p.direction === 'down') clip = `inset(${startI}% -10% ${farI}% -10%)`;
    else if (p.direction === 'right') clip = `inset(-10% ${farI}% -10% ${startI}%)`;
    else clip = `inset(-10% ${startI}% -10% ${farI}%)`;
    return {clipPath: clip};
  };

  const liquidClip = (inT: number, outT: number, phase: number): string => {
    // wavy top surface rising from the bottom (direction ignored for liquid: always fills upward)
    const pts: string[] = [];
    const top = 110 - 120 * inT;
    const bot = 110 - 120 * outT;
    const amp = 7 * Math.sin(Math.PI * Math.min(1, inT * 1.2)) * (1 - outT);
    for (let k = 0; k <= 8; k++) {
      const x = -10 + (k / 8) * 120;
      pts.push(`${x}% ${top + amp * Math.sin(phase + k * 0.95)}%`);
    }
    pts.push(`110% ${bot}%`);
    pts.push(`-10% ${bot}%`);
    return `polygon(${pts.join(',')})`;
  };

  return (
    <Bg background={p.background} glow={p.fill} glowAmount={0.07}>
      {lines.map((line, li) => {
        const chars = flat.filter((f) => f.li === li);
        return (
          <div key={li} style={{position: 'absolute', left: 0, width: w, top: top + li * lh, height: lh, textAlign: 'center', whiteSpace: 'pre', lineHeight: `${lh}px`, fontFamily: tfonts[p.font], fontSize: size, fontWeight: p.weight, letterSpacing: p.tracking * size}}>
            {chars.map((c, ci) => {
              if (c.ch === ' ') return <span key={`s${ci}`}> </span>;
              const sIn = p.startAt + p.fillDelay + c.g * p.stagger;
              const inT = prog(frame, sIn, sIn + p.fillFrames, p.surface === 'liquid' ? ease.inOut : ease.expoOut);
              const sOut = unfillStart + c.g * p.stagger;
              const outT = p.cycle === 'fill-unfill' ? prog(frame, sOut, sOut + p.fillFrames, ease.inOut) : 0;
              const oIn = prog(frame, p.startAt + c.g * 0.9, p.startAt + c.g * 0.9 + 12, ease.out);
              const filling = inT > 0 && outT < 1;
              const clip = p.surface === 'liquid' ? {clipPath: liquidClip(inT, outT, frame * 0.35 + c.g)} : fillStyleOf(inT, outT);
              return (
                <span key={c.g} style={{position: 'relative', display: 'inline-block', opacity: oIn, transform: `translateY(${(1 - oIn) * size * 0.12}px)`}}>
                  <span style={{color: 'transparent', WebkitTextStroke: `${strokePx}px ${p.outline}`}}>{c.ch}</span>
                  {filling ? (
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        color: p.fill,
                        WebkitTextStroke: `${strokePx}px ${p.fill}`,
                        backgroundImage: p.fill2 ? `linear-gradient(180deg, ${p.fill} 0%, ${p.fill2} 100%)` : undefined,
                        WebkitBackgroundClip: p.fill2 ? 'text' : undefined,
                        backgroundClip: p.fill2 ? 'text' : undefined,
                        WebkitTextFillColor: p.fill2 ? 'transparent' : undefined,
                        ...clip,
                      }}
                    >
                      {c.ch}
                    </span>
                  ) : null}
                </span>
              );
            })}
          </div>
        );
      })}
      {p.subtitle ? (
        <div style={{position: 'absolute', left: 0, width: w, top: top + blockH + size * 0.18, textAlign: 'center', fontFamily: tfonts.sans, fontSize: size * 0.2, letterSpacing: size * 0.06, textTransform: 'uppercase', color: p.subtitleColor, opacity: subA * 0.9, transform: `translateY(${(1 - subA) * 10 * u}px)`}}>
          {p.subtitle}
        </div>
      ) : null}
    </Bg>
  );
};

export const outlineToFillText = defineMotion<Props>({
  id: 'outline-to-fill-text',
  title: 'Outline to fill text',
  category: 'text',
  description:
    'A headline appears as hollow outlined letters, then each letter floods with solid colour one after another — rising like liquid with a wavy surface or wiping up, down, left or right (optional top-to-bottom gradient) — and can drain back to an outline; long text wraps and shrinks to fit.',
  source: ['original — generic kinetic-type effect (R3)'],
  useFor: 'Bold website hero words, section titles, poster-style stat words, title cards and reel openers; works as a looping brand headline.',
  durationInFrames: 170,
  defaultProps: {
    text: 'Make it count',
    subtitle: '',
    font: 'display',
    size: 190,
    weight: 400,
    tracking: 0.01,
    textCase: 'upper',
    direction: 'up',
    surface: 'liquid',
    fillDelay: 14,
    stagger: 2.6,
    fillFrames: 24,
    startAt: 6,
    cycle: 'fill-unfill',
    holdFilled: 34,
    stroke: 0.03,
    background: '#0E0E12',
    outline: '#F4F0E6',
    fill: '#FF4D2E',
    fill2: '',
    subtitleColor: '#BDB8AA',
  },
  propDocs: {
    text: 'the headline (\\n = forced break; wraps and shrinks to fit)',
    subtitle: 'optional small line under the headline',
    font: 'font role (heavy display faces read best)',
    size: 'max font size in u; shrinks to fit',
    weight: 'font weight',
    tracking: 'letter spacing in em',
    textCase: 'upper | none',
    direction: 'wipe direction: up | down | left | right (liquid always rises)',
    surface: 'liquid (wavy rising surface) | wipe (hard straight edge)',
    fillDelay: 'frames after the outline appears before the first fill starts',
    stagger: 'frames between neighbouring letters starting to fill',
    fillFrames: 'frames one letter takes to fill',
    startAt: 'frame the outline starts appearing',
    cycle: 'fill (stay filled) | fill-unfill (drain back to outline at the end)',
    holdFilled: 'frames the filled text holds before it drains',
    stroke: 'outline weight as a fraction of the font size',
    background: 'background colour; "transparent" for an overlay',
    outline: 'outline colour',
    fill: 'fill colour',
    fill2: 'optional second colour: fill becomes a top-to-bottom gradient per letter ("" = solid)',
    subtitleColor: 'subtitle colour',
  },
  component: OutlineFill,
  tags: ['text', 'outline', 'fill', 'stroke', 'liquid', 'headline', 'title', 'hero', 'reveal', 'wipe', 'typography', 'kinetic', 'website', 'overlay', 'hollow'],
});
