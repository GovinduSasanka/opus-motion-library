// Adapted from lemo-opuscar/styles/game-show/demo/main_v1.js punch() + main_b.js camera punch sum (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {CANDY, CandySet, Telop, backOut, hitSq, hopY, la2Fonts, mixHex, punchSum, seg, shadeHex, starPathN} from '../../core/r2-la2-kit';

/**
 * beat-punch-zoom — the whole frame "kicks" a few percent toward a point on every accent and relaxes in ~5 frames;
 * ticks, hits and slams at different amplitudes sum (capped) so the frame breathes with the music. Demo scene:
 * a candy stage where a big star gets slammed on the downbeats; or wrap any image via `src`.
 */
type Props = {
  bpm: number;
  pattern: string;
  tick: number;
  hit: number;
  slam: number;
  cap: number;
  originX: number;
  originY: number;
  src: string;
  overlayDemo: boolean;
  hue: string;
  word: string;
  background: string;
};

const BeatPunchZoom: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const beat = 60 / Math.max(1, p.bpm);
  // accent pattern: one char per eighth note — 't' tick, 'h' hit, 'S' slam, '.' rest; loops per bar
  const pat = p.pattern || 'S.t.h.t.';
  const eighth = beat / 2;
  const punches: [number, number][] = [];
  const total = Math.ceil((t + 1) / eighth) + 2;
  for (let i = 0; i < total; i++) {
    const c = pat[i % pat.length];
    const a = c === 'S' ? p.slam : c === 'h' ? p.hit : c === 't' ? p.tick : 0;
    if (a > 0) punches.push([i * eighth, a]);
  }
  const amt = punchSum(t, punches, 0.16, p.cap);
  const zoom = (1 + amt) * 1.06; // stage oversized ~6 % so edges never show
  const ox = w * p.originX;
  const oy = h * p.originY;
  // last slam time (for the star squash in the demo)
  let lastSlam = -10;
  for (const [t0, a] of punches) if (a >= p.slam - 1e-6 && t0 <= t) lastSlam = t0;
  const sq = hitSq(t, lastSlam, 0.22);
  const starR = Math.min(w, h) * 0.17;
  const wordSize = Math.min(120 * u, (w * 0.7) / Math.max(3, p.word.length * 0.6));
  const burstP = Math.min(1, Math.max(0, (t - lastSlam) / 0.3));
  const demo = !p.src && p.overlayDemo;
  return (
    <AbsoluteFill style={{background: p.src || demo ? '#000' : p.background}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `${ox}px ${oy}px`}}>
        {p.src ? (
          <Img src={resolveSrc(p.src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
        ) : demo ? (
          <Svg>
            <CandySet w={w} h={h} u={u} variant="rays" hue={p.hue} pattern={mixHex(p.hue, '#ffffff', 0.12)} tSec={t} rays={22} cy={h * 0.5} />
            <g transform={`translate(${w / 2} ${h * (portrait ? 0.42 : 0.47)})`}>
              <g transform={`scale(${(2 - sq) * (0.9 + 0.1 * backOut(seg(frame, 0, 12), 1.9))}, ${sq * (0.9 + 0.1 * backOut(seg(frame, 0, 12), 1.9))}) rotate(${Math.sin(t * 0.7) * 3})`}>
                <path d={starPathN(5, starR, starR * 0.48)} fill={CANDY.yellow} stroke={CANDY.ink} strokeWidth={10 * u} strokeLinejoin="round" />
                <circle cx={-starR * 0.18} cy={-starR * 0.05} r={9 * u} fill={CANDY.ink} />
                <circle cx={starR * 0.18} cy={-starR * 0.05} r={9 * u} fill={CANDY.ink} />
                <path d={`M${-14 * u} ${starR * 0.12} Q0 ${starR * 0.22 + (sq < 0.98 ? 8 * u : 0)} ${14 * u} ${starR * 0.12}`} fill="none" stroke={CANDY.ink} strokeWidth={6 * u} strokeLinecap="round" />
              </g>
              {burstP < 1 && burstP > 0 && (
                <g transform={`scale(${0.55 + 0.9 * (1 - (1 - burstP) * (1 - burstP))}) rotate(${burstP * 30})`} opacity={1 - burstP * burstP}>
                  <circle r={starR * 0.9 + starR * burstP} fill="none" stroke={CANDY.white} strokeWidth={10 * u * (1 - burstP)} />
                  {Array.from({length: 8}, (_, i) => {
                    const a = (i / 8) * Math.PI * 2 + 0.2;
                    return <line key={i} x1={Math.cos(a) * starR * 1.3} y1={Math.sin(a) * starR * 1.3} x2={Math.cos(a) * starR * 1.75} y2={Math.sin(a) * starR * 1.75} stroke={CANDY.ink} strokeWidth={7 * u} strokeLinecap="round" />;
                  })}
                </g>
              )}
            </g>
            <g transform={`translate(${w / 2} ${h * (portrait ? 0.75 : 0.8) + hopY(t, beat, 10 * u)})`}>
              <Telop x={0} y={0} size={wordSize} text={p.word} fill={CANDY.white} font={la2Fonts.fredoka} rotate={-3} />
            </g>
            <rect x={-w * 0.05} y={h * 0.92} width={w * 1.1} height={h * 0.14} fill={shadeHex(p.hue, -0.25)} />
            <rect x={-w * 0.05} y={h * 0.92 - 4 * u} width={w * 1.1} height={8 * u} fill={CANDY.ink} />
          </Svg>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const beatPunchZoom = defineMotion<Props>({
  id: 'beat-punch-zoom',
  title: 'Beat punch zoom',
  category: 'fx',
  description:
    'Music-synced camera kick: the whole frame punches a few percent toward a chosen point on every accent (ticks, hits, slams at different amplitudes, summed and capped) and relaxes in ~5 frames. Demo: a candy sunburst stage where a toy star squashes on each slam with a star-ring-lines burst; or feed any image with src.',
  source: ['lemo-opuscar styles/game-show (MIT, LemoLab) — demo/main_v1.js punch(), main_b.js camera; also used by halftone-dossier'],
  useFor: 'Universal music-energy layer for promos, recaps and social cuts; wrap any footage, image or composition in beat punches.',
  durationInFrames: 180,
  defaultProps: {
    bpm: 150,
    pattern: 'S.t.h.t.',
    tick: 0.008,
    hit: 0.02,
    slam: 0.045,
    cap: 0.06,
    originX: 0.5,
    originY: 0.5,
    src: '',
    overlayDemo: true,
    hue: CANDY.teal,
    word: 'Perfect!',
    background: '#26264A',
  },
  propDocs: {
    bpm: 'tempo of the accent grid',
    pattern: "one char per eighth note, looped: 'S' slam, 'h' hit, 't' tick, '.' rest",
    tick: 'tick punch amplitude',
    hit: 'hit punch amplitude',
    slam: 'slam punch amplitude',
    cap: 'cap on summed simultaneous punches (frame edges never show)',
    originX: 'punch origin x (0..1 of width)',
    originY: 'punch origin y (0..1 of height)',
    src: 'optional image (public/ path or URL) that receives the punches instead of the demo stage',
    overlayDemo: 'draw the candy demo stage when src is empty',
    hue: 'demo stage hue',
    word: 'demo judgement word',
    background: 'colour behind everything',
  },
  component: BeatPunchZoom,
  tags: ['beat', 'punch', 'zoom', 'camera', 'music', 'sync', 'rhythm', 'game-show', 'kick', 'energy', 'accent', 'bpm', 'social', 'promo'],
});
