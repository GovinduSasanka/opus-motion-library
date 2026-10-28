import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {useStage} from '../../core/stage';
import {Bg, fitBlock, mixCol} from '../../core/kinetic-type-kit';
import {tfonts, TFont} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Per-letter wave: every letter of the text rides a travelling wave — it lifts, scales, rocks or all three — so a
 * crest runs through the words. Wave shapes: smooth sine, bouncing hops, a single travelling ripple or a swing.
 * Crest letters can shift colour. Words stay readable (the wave is a function of letter index, not of position),
 * wrap and shrink to fit, and with the default speed the clip loops seamlessly.
 */

type Props = {
  text: string;
  shape: 'sine' | 'bounce' | 'ripple' | 'swing';
  effect: 'lift' | 'scale' | 'rotate' | 'lift-scale';
  amplitude: number;
  wavelength: number;
  speed: number;
  colorWave: boolean;
  entrance: 'pop' | 'rise' | 'none';
  enterStagger: number;
  startAt: number;
  font: TFont;
  size: number;
  weight: number;
  tracking: number;
  textCase: 'upper' | 'none';
  background: string;
  ink: string;
  accent: string;
  shadow: boolean;
};

const Wave: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const text = p.textCase === 'upper' ? p.text.toUpperCase() : p.text;
  const maxW = w * (w < h ? 0.88 : 0.84);
  const {size, lines} = fitBlock(text, p.size * u, maxW * 0.97, h * 0.55, p.font, 1.12, p.tracking);
  const lh = size * 1.12;
  const amp = p.amplitude * size;
  const t = frame / 30;

  const flat: {li: number; ch: string; g: number}[] = [];
  let g = 0;
  lines.forEach((l, li) => [...l].forEach((ch) => flat.push({li, ch, g: ch === ' ' ? -1 : g++})));
  const N = Math.max(1, g);
  const wl = Math.max(2, p.wavelength);
  const ramp = prog(frame, p.startAt, p.startAt + 24, ease.out);
  const outFade = 1 - prog(frame, durationInFrames - 12, durationInFrames, ease.in);

  const waveV = (gi: number) => {
    const ph = 2 * Math.PI * (p.speed * t - gi / wl);
    switch (p.shape) {
      case 'bounce':
        return Math.max(0, Math.sin(ph)) * 2 - 0.35;
      case 'ripple': {
        const span = N + wl;
        const pos = (((p.speed * t * wl) % span) + span) % span - wl / 2;
        const d = (gi - pos) / (wl / 3.2);
        return Math.exp(-d * d) * 2 - 0.3;
      }
      case 'swing':
        return Math.sin(ph) * Math.cos(ph * 0.5);
      default:
        return Math.sin(ph);
    }
  };

  const blockH = lines.length * lh;
  const top = h / 2 - blockH / 2;
  const colAmt = (v: number) => Math.min(1, Math.max(0, (v + 0.3) / 1.6));

  return (
    <Bg background={p.background} glow={p.accent} glowAmount={0.08}>
      <div style={{position: 'absolute', inset: 0, opacity: outFade}}>
        {lines.map((line, li) => {
          const chars = flat.filter((f) => f.li === li);
          return (
            <div key={li} style={{position: 'absolute', left: 0, width: w, top: top + li * lh, height: lh, textAlign: 'center', whiteSpace: 'pre', lineHeight: `${lh}px`, fontFamily: tfonts[p.font], fontSize: size, fontWeight: p.weight, letterSpacing: p.tracking * size}}>
              {chars.map((c, ci) => {
                if (c.ch === ' ') return <span key={`s${ci}`}> </span>;
                const sIn = p.startAt + c.g * p.enterStagger;
                const inT = p.entrance === 'none' ? 1 : prog(frame, sIn, sIn + 16, p.entrance === 'pop' ? ease.back : ease.out);
                const v = waveV(c.g) * ramp;
                const lift = p.effect === 'lift' || p.effect === 'lift-scale' ? -v * amp : 0;
                const sc = p.effect === 'scale' || p.effect === 'lift-scale' ? 1 + v * (p.effect === 'scale' ? 0.2 : 0.12) : 1;
                const rot = p.effect === 'rotate' ? v * 13 : 0;
                const enterY = p.entrance === 'rise' ? (1 - inT) * size * 0.6 : 0;
                const enterS = p.entrance === 'pop' ? 0.2 + 0.8 * inT : 1;
                const color = p.colorWave ? mixCol(p.ink, p.accent, colAmt(v)) : p.ink;
                return (
                  <span
                    key={c.g}
                    style={{
                      display: 'inline-block',
                      color,
                      opacity: Math.min(1, inT * 1.6),
                      transform: `translateY(${lift + enterY}px) rotate(${rot}deg) scale(${sc * enterS})`,
                      transformOrigin: '50% 80%',
                      textShadow: p.shadow ? `0 ${size * 0.06 + Math.max(0, v) * size * 0.05}px ${size * 0.12}px rgba(0,0,0,0.35)` : undefined,
                    }}
                  >
                    {c.ch}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </Bg>
  );
};

export const perLetterWave = defineMotion<Props>({
  id: 'per-letter-wave',
  title: 'Per-letter wave',
  category: 'text',
  description:
    'Every letter rides a travelling wave: it lifts, scales, rocks or all three, so a crest runs through the words — smooth sine, bouncing hops, a single ripple or a swing — with crest letters shifting to the accent colour; letters pop in on a stagger, long text wraps, and the clip loops seamlessly.',
  source: ['original — generic kinetic-type effect (R3)'],
  useFor: 'Playful titles, loading and waiting states, "hello" greetings, party / music / kids content, website hero words, looping caption accents; replace the text.',
  durationInFrames: 150,
  defaultProps: {
    text: 'Let it flow',
    shape: 'sine',
    effect: 'lift-scale',
    amplitude: 0.16,
    wavelength: 9,
    speed: 1,
    colorWave: true,
    entrance: 'pop',
    enterStagger: 1.8,
    startAt: 4,
    font: 'display',
    size: 200,
    weight: 400,
    tracking: 0.03,
    textCase: 'upper',
    background: '#FFF4E0',
    ink: '#1D1B3A',
    accent: '#FF3D7F',
    shadow: false,
  },
  propDocs: {
    text: 'the text (\\n = forced break; wraps and shrinks to fit)',
    shape: 'sine | bounce | ripple | swing — wave profile',
    effect: 'lift | scale | rotate | lift-scale — what the wave moves',
    amplitude: 'wave height as a fraction of the font size',
    wavelength: 'letters per wave (bigger = broader crest)',
    speed: 'wave cycles per second (integer values loop seamlessly on the default 5 s)',
    colorWave: 'letters shift towards the accent colour on the crest',
    entrance: 'pop | rise | none — how letters first appear',
    enterStagger: 'frames between letters entering',
    startAt: 'frame the first letter enters',
    font: 'font role',
    size: 'max font size in u; shrinks to fit',
    weight: 'font weight',
    tracking: 'letter spacing in em',
    textCase: 'upper | none',
    background: 'background colour; "transparent" for an overlay',
    ink: 'base letter colour',
    accent: 'crest colour',
    shadow: 'soft drop shadow that follows each letter',
  },
  component: Wave,
  tags: ['text', 'wave', 'letters', 'per-letter', 'bounce', 'playful', 'hello', 'title', 'loop', 'typography', 'kinetic', 'website', 'loader', 'ripple', 'overlay'],
});
