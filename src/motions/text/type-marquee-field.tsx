import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {FilmGrain, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {measureTextPx, ReelHud, SWISS, SwissField} from '../../core/r2-x14-kit';

/**
 * x2 chapter 04 "TYPE": a heavy grotesk word rises letter by letter out of a baseline mask with a red dot standing
 * in for one letter; rows of the same word then fill the frame above and below it — alternating outline and solid,
 * each marquee-scrolling in the opposite direction — while the whole field rolls to ≈ −8° and pushes in, so the
 * word turns into a texture. Measured at 60 fps, converted to 30.
 */

type Props = {
  word: string;
  dotLetter: string;
  font: 'display' | 'sans' | 'grotesk';
  background: string;
  vignette: string;
  ink: string;
  dotColor: string;
  outlineEvery: number;
  speed: number;
  roll: number;
  push: number;
  rowsAt: number;
  hud: boolean;
  label: string;
};

const CAP = 0.72; // cap height / em for the heavy grotesks used here

const TypeMarqueeField: React.FC<Props> = ({word, dotLetter, font, background, vignette, ink, dotColor, outlineEvery, speed, roll, push, rowsAt, hud, label}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, fps} = useStage();
  const family = fonts[font];
  const weight = font === 'display' ? 400 : font === 'sans' ? 800 : 700;
  const text = (word || 'MOTION').toUpperCase();
  const css = (px: number) => `${weight} ${px}px ${family}`;

  // size: cap height ≈ 0.13 H (landscape), word never wider than 78 % W
  const probe = 100;
  const wordW100 = Math.max(1, measureTextPx(text, css(probe)));
  const fs = Math.min((0.13 * h) / CAP, (0.78 * w * probe) / wordW100);
  const capH = fs * CAP;
  const wordW = (wordW100 * fs) / probe;
  const pitch = fs * 0.95; // row pitch ≈ 0.17 H
  const baseY = cy + capH / 2;
  const x0 = cx - wordW / 2;

  // ---- hero word: letters rise out of the baseline mask ----
  const dotIdx = dotLetter ? text.indexOf(dotLetter.toUpperCase()) : -1;
  const letters = [...text].map((ch, i) => {
    const left = (measureTextPx(text.slice(0, i), css(probe)) * fs) / probe;
    const adv = (measureTextPx(ch, css(probe)) * fs) / probe;
    return {ch, left, adv, i};
  });
  const LSTART = 4;
  const STAGGER = 2;
  const RISE = 9;
  const dotPop = prog(frame, 0, 9, ease.back);

  // ---- rows ----
  const diag = Math.hypot(w, h) / Math.min(push, 1) + pitch * 2;
  const K = Math.ceil(diag / 2 / pitch) + 1;
  const unit = Math.max(1, (measureTextPx(text + ' ', css(probe)) * fs) / probe);
  const reps = Math.ceil((diag * 1.6) / unit) + 3;
  const rowText = Array.from({length: reps}, () => text).join(' ');
  const vPx = (speed * w) / fps; // px per frame
  const outlineIn = prog(frame, rowsAt, rowsAt + 10, ease.out);
  const solidIn = prog(frame, rowsAt + 6, rowsAt + 16, ease.out);

  // ---- roll + push (easeInOutQuad), then a slow continuing drift so the field never freezes ----
  const rp = prog(frame, rowsAt + 14, rowsAt + 60, (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2));
  const drift = clamp((frame - (rowsAt + 60)) / 90, 0, 2);
  const rot = roll * rp + roll * 0.18 * drift;
  const scl = 1 + (push - 1) * rp + (push - 1) * 0.35 * drift;

  const clipId = `tmf-clip-${Math.round(w)}x${Math.round(h)}`;
  const strokeW = 2 * u;

  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      <SwissField color={background} edge={vignette} />
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id={clipId}>
            <rect x={-w} y={-h} width={w * 3} height={baseY + h + capH * 0.02} />
          </clipPath>
        </defs>
        <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${scl}) translate(${-cx} ${-cy})`}>
          {Array.from({length: 2 * K + 1}, (_, j) => j - K)
            .filter((k) => k !== 0)
            .map((k) => {
              const outline = outlineEvery > 0 && (Math.abs(k) - 1) % outlineEvery === 0;
              const dir = k % 2 === 0 ? 1 : -1;
              const rowOff = ((Math.abs(k) * 0.37) % 1) * unit;
              const shift = ((((dir * frame * vPx + rowOff) % unit) + unit) % unit) - unit;
              const op = outline ? outlineIn : solidIn;
              if (op <= 0) return null;
              const y = baseY + k * pitch;
              return (
                <text
                  key={k}
                  x={cx - (reps * unit) / 2 + shift}
                  y={y}
                  style={{font: css(fs), whiteSpace: 'pre'}}
                  fill={outline ? 'none' : ink}
                  stroke={outline ? ink : 'none'}
                  strokeWidth={outline ? strokeW : 0}
                  strokeOpacity={0.8}
                  opacity={op}
                  transform={`translate(${(1 - op) * dir * 40 * u} 0)`}
                >
                  {rowText}
                </text>
              );
            })}
          <g clipPath={`url(#${clipId})`}>
            {letters.map(({ch, left, adv, i}) => {
              if (i === dotIdx) return null;
              const p = prog(frame, LSTART + i * STAGGER, LSTART + i * STAGGER + RISE, (t) => 1 - Math.pow(1 - t, 3));
              const dy = (1 - p) * capH * 1.05;
              return (
                <text key={i} x={x0 + left} y={baseY + dy} style={{font: css(fs)}} fill={ink}>
                  {ch}
                </text>
              );
            })}
          </g>
          {dotIdx >= 0 ? (
            <circle cx={x0 + letters[dotIdx].left + letters[dotIdx].adv / 2} cy={baseY - capH / 2} r={(capH / 2) * dotPop} fill={dotColor} />
          ) : null}
        </g>
      </svg>
      <FilmGrain opacity={0.05} />
      {hud ? <ReelHud ink={ink} label={label} footer={`MOTION REEL / ${w}×${h} / ${fps} FPS`} active={3} progress={frame / 150} beat={frame < LSTART + text.length * STAGGER + RISE} /> : null}
    </AbsoluteFill>
  );
};

export const typeMarqueeField = defineMotion<Props>({
  id: 'type-marquee-field',
  title: 'Type marquee field',
  category: 'text',
  description:
    'A heavy grotesk word rises letter by letter from a baseline mask (a red dot replaces one letter), then outline and solid rows of the word fill the frame, marquee-scrolling in alternating directions while the whole field rolls ≈ −8° and pushes in.',
  source: ['video x2 0:05.95-0:07.05 (chapter 04 TYPE)'],
  useFor: 'Kinetic-type backgrounds for a brand word, poster-style title cards, a "type" chapter in a principles reel.',
  durationInFrames: 150,
  defaultProps: {
    word: 'MOTION',
    dotLetter: 'O',
    font: 'display',
    background: SWISS.paper,
    vignette: SWISS.paperEdge,
    ink: SWISS.ink,
    dotColor: SWISS.red,
    outlineEvery: 2,
    speed: 0.15,
    roll: -8,
    push: 1.12,
    rowsAt: 20,
    hud: true,
    label: '04 — TYPE',
  },
  propDocs: {
    word: 'the hero word (repeated in every row)',
    dotLetter: 'letter replaced by the accent dot (first occurrence; empty = none)',
    font: 'display (Archivo Black) | sans (Inter ExtraBold) | grotesk (Space Grotesk Bold)',
    background: 'paper colour (centre)',
    vignette: 'vignette colour at the corners',
    ink: 'type / HUD ink',
    dotColor: 'accent dot colour',
    outlineEvery: 'rows alternate outline/solid with this period (1 = all outline, 0 = all solid)',
    speed: 'marquee speed in frame widths per second (alternating direction per row)',
    roll: 'final roll of the field in degrees',
    push: 'final push-in scale',
    rowsAt: 'frame the rows start fading in (roll/push follow)',
    hud: 'show the reel HUD (crop marks, label, timecode, segment bar)',
    label: 'HUD chapter label',
  },
  component: TypeMarqueeField,
  tags: ['kinetic type', 'marquee', 'typography', 'outline text', 'swiss', 'poster', 'text texture', 'brand word', 'mask rise', 'roll', 'push in', 'motion reel', 'grotesk', 'x2'],
});
