import React from 'react';
import {clamp, ease, prog} from '../../core/ease';
import {BoxBot, FxRoot, boil, boltPoints, doodleBlob, doodleLoop, isClear, useFx, portraitFit} from '../../core/fx-kit';
import {rng, range} from '../../core/random';
import {smoothOpen} from '../../core/shapes';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video20 scribble-frustration-ball: 6-10 overlapping elliptical ink loops (aspect ~2.2:1, width ~1.3x
 * head width) float above an upset character, linked to the head by a thin red "steam" squiggle; the
 * whole tangle is regenerated every unique frame (line boil) — centre jitter +-6 %, radius +-15 %,
 * rotation +-8 deg, drifting start angle, each loop open (330-380 deg). Fades in/out over 0.2 s.
 * video2 line-boil: every stroke re-drawn with 1-2 px offsets every 1-2 frames.
 * Storm variant: a boiling doodle storm-cloud with a flickering lightning scribble and rain dashes.
 */
type Props = {
  background: string;
  x: number;
  y: number;
  delay: number;
  variant: 'tangle' | 'storm';
  loops: number;
  size: number;
  boilEvery: number;
  color: string;
  steamColor: string;
  cloudColor: string;
  boltColor: string;
  steam: boolean;
  fade: number;
  showSubject: boolean;
  seed: number;
};

const ScribbleBall: React.FC<Props> = (p) => {
  const {background, x, y, delay, variant, loops, size: size0, boilEvery, color, steamColor, cloudColor, boltColor, steam, fade, showSubject, seed} = p;
  const {f, frame, u, px, py: py0, durationInFrames} = useFx(x, y, delay);
  const clear = isClear(background);
  const {portrait: fitPortrait, h: fitH} = useStage();
  const fit = portraitFit(fitPortrait, showSubject && !clear, fitH);
  const size = size0 * fit.k;
  const py = py0 + fit.dy;
  const b = boil(frame, boilEvery);
  const W = 430 * u * size;
  const H = W / 2.2;
  const endF = durationInFrames - delay;
  const vis = f < 0 ? 0 : Math.min(prog(f, 0, fade, ease.out), 1 - prog(f, endF - fade, endF, ease.in));
  const pop = 0.82 + 0.18 * prog(f, 0, fade + 2, ease.back);
  const bob = Math.sin(frame * 0.16) * 5 * u;
  const cy = py + bob;
  const out: React.ReactNode[] = [];

  if (variant === 'tangle') {
    const r = rng(seed * 1009 + b * 31);
    let d = '';
    for (let k = 0; k < loops; k++) {
      const ox = (r() - 0.5) * 0.12 * W;
      const oy = (r() - 0.5) * 0.12 * H;
      const rx = (W / 2) * range(r, 0.62, 0.92) * (1 + (r() - 0.5) * 0.3);
      const ry = (H / 2) * range(r, 0.62, 0.95) * (1 + (r() - 0.5) * 0.3);
      const rot = ((r() - 0.5) * 16 * Math.PI) / 180;
      const a0 = k * 1.3 + b * 0.45 + r() * 0.6;
      const sweep = ((330 + r() * 50) * Math.PI) / 180;
      d += doodleLoop(px + ox, cy + oy, rx, ry, rot, a0, sweep, `sb${seed}-${b}-${k}`, 0.08, 22) + ' ';
    }
    // a couple of tight inner knots
    for (let k = 0; k < 2; k++) {
      const rx = W * range(r, 0.12, 0.2);
      d += doodleLoop(px + (r() - 0.5) * W * 0.3, cy + (r() - 0.5) * H * 0.3, rx, rx * 0.6, r() * 6, r() * 6, 5.5, `sbk${b}${k}`, 0.12, 14) + ' ';
    }
    out.push(<path key="tangle" d={d} fill="none" stroke={color} strokeWidth={3.2 * u * Math.max(0.7, size)} strokeLinecap="round" strokeLinejoin="round" />);
  } else {
    // storm cloud
    const cw = W * 0.62;
    const blobs: [number, number, number][] = [
      [0, 0, 1],
      [-0.62, 0.12, 0.66],
      [0.64, 0.14, 0.7],
      [0.15, -0.38, 0.7],
    ];
    const flash = (b * 7 + seed) % 9 < 2;
    out.push(
      <g key="cloud">
        {blobs.map(([bx, by, br], k) => (
          <path key={k} d={doodleBlob(px + bx * cw, cy + by * cw * 0.6, br * cw * 0.62, `sc${seed}-${b}-${k}`, 6, 0.14)} fill={flash ? '#a3a7ad' : cloudColor} stroke={color} strokeWidth={2.6 * u * size} />
        ))}
        {Array.from({length: 3}, (_, k) => {
          const r = rng(b * 17 + k + seed);
          return <path key={`s${k}`} d={doodleLoop(px + (r() - 0.5) * cw * 1.2, cy + (r() - 0.3) * cw * 0.3, cw * 0.18, cw * 0.1, r() * 6, r() * 6, 5.4, `scs${b}${k}`, 0.12, 14)} fill="none" stroke={color} strokeWidth={1.8 * u * size} opacity={0.75} />;
        })}
      </g>,
    );
    // lightning scribble (re-randomised, visible most frames, flicker)
    const r = rng(seed * 77 + b);
    const on = (b + seed) % 5 !== 3;
    if (on && vis > 0.3) {
      const top = cy + cw * 0.3;
      const pts = boltPoints(px + (r() - 0.5) * cw * 0.6, top, px + (r() - 0.5) * cw * 0.5, top + W * 0.5, r, 3, 0.32);
      // thick zig-zag bolt shape
      const half = 9 * u * size;
      const n = pts.length - 1;
      const wd = (i: number) => half * (1 - (i / n) * 0.85);
      const left = pts.map(([X, Y], i) => `${(X - wd(i)).toFixed(1)} ${Y.toFixed(1)}`);
      const right = pts.map(([X, Y], i) => `${(X + wd(i)).toFixed(1)} ${Y.toFixed(1)}`).reverse();
      out.push(<path key="bolt" d={`M${left.join(' L')} L${right.join(' L')} Z`} fill={boltColor} stroke={color} strokeWidth={2.2 * u * size} strokeLinejoin="round" />);
    }
    // rain dashes
    for (let k = 0; k < 12; k++) {
      const rr = rng(seed * 3 + k);
      const xx = px + (rr() - 0.5) * cw * 2;
      const ph = ((frame * 0.09 + rr()) % 1);
      const yy = cy + cw * 0.35 + ph * W * 0.55;
      out.push(<line key={`rn${k}`} x1={xx} y1={yy} x2={xx - 8 * u} y2={yy + 26 * u * size} stroke={color} strokeWidth={2 * u} strokeLinecap="round" opacity={(1 - ph) * 0.8} />);
    }
  }

  // red steam squiggle linking the ball to the head
  const headTop = py + H * 0.5 + 120 * u * size;
  if (steam && variant === 'tangle') {
    const r = rng(seed * 5 + b);
    const pts: [number, number][] = [];
    const y0 = cy + H * 0.42;
    const y1 = headTop - 14 * u;
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push([px + (i % 2 ? 1 : -1) * (6 + r() * 6) * u * size, y0 + (y1 - y0) * t]);
    }
    out.push(<path key="steam" d={smoothOpen(pts)} fill="none" stroke={steamColor} strokeWidth={2.8 * u * Math.max(0.7, size)} strokeLinecap="round" />);
  }

  const botS = 370 * u * size;
  const tremble = f >= 0 && f < endF ? Math.sin(frame * 2.3) * 2.5 * u : 0;
  const blinkF = (frame + 23) % 64;
  const blink = blinkF < 2 ? blinkF / 2 : blinkF < 3 ? 1 : blinkF < 6 ? 1 - (blinkF - 3) / 3 : 0;

  return (
    <FxRoot background={background} paper={!clear} paperTint="#8a7350">
      <Svg>
        {showSubject && !clear && (
          <BoxBot x={px - botS * 0.16 + tremble} y={headTop + botS * 0.2 + botS * 0.39} s={botS} face={variant === 'storm' ? 'worried' : 'angry'} blink={blink} frame={frame} id={`sbb${seed}`} />
        )}
        <g opacity={clamp(vis)} transform={`translate(${px} ${cy}) scale(${pop}) translate(${-px} ${-cy})`}>
          {out}
        </g>
      </Svg>
    </FxRoot>
  );
};

export const scribbleBall = defineMotion<Props>({
  id: 'scribble-ball',
  title: 'Scribble ball',
  category: 'fx',
  description:
    'A boiling tangle of open ink loops, regenerated every 2 frames, floats over an upset box-bot linked by a red steam squiggle; storm variant swaps in a boiling doodle cloud with a lightning scribble and rain. Overlay-ready: background "transparent".',
  source: ['video20 scribble-frustration-ball', 'video2 line-boil'],
  useFor: 'Frustration, confusion, overthinking, "problem" states, bad moods.',
  durationInFrames: 90,
  defaultProps: {
    background: '#E1D7C5',
    x: 0.5,
    y: 0.27,
    delay: 6,
    variant: 'tangle',
    loops: 8,
    size: 1,
    boilEvery: 2,
    color: '#2e2a26',
    steamColor: '#C8424F',
    cloudColor: '#c3c6cb',
    boltColor: '#F2C94C',
    steam: true,
    fade: 6,
    showSubject: true,
    seed: 5,
  },
  propDocs: {
    background: "scene paper colour; 'transparent' = overlay (no bot, no paper)",
    x: 'scribble centre x (0..1)',
    y: 'scribble centre y (0..1)',
    delay: 'frame the scribble fades in (it fades out at the end of the clip)',
    variant: 'tangle (v20 frustration ball) | storm (doodle storm cloud with lightning scribble)',
    loops: 'number of ink loops (6-10)',
    size: 'size multiplier (1 = 430 u wide tangle)',
    boilEvery: 'regenerate the drawing every N frames (1-2 = line boil)',
    color: 'ink colour',
    steamColor: 'colour of the steam squiggle to the head',
    cloudColor: 'storm cloud fill',
    boltColor: 'lightning fill',
    steam: 'draw the red steam squiggle (tangle variant)',
    fade: 'fade in/out frames (0.2 s)',
    showSubject: 'draw the upset box-bot underneath (scene mode only)',
    seed: 'random seed',
  },
  component: ScribbleBall,
  tags: ['scribble', 'frustration', 'boil', 'doodle', 'storm', 'emote', 'overlay', 'fx'],
});
