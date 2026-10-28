// Adapted from lemo-opuscar/styles/briefing-board/demo/kit/board.js arrive 'drop' / 'snap' (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {useSafeId} from '../../core/image-kit';
import {Pic} from '../../core/ui-kit';
import {Whiteboard, bease, lf, seg, settle} from '../../core/r2-la1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Engineering briefing board: cut-out photo prints are lowered onto a whiteboard from the camera side — the
 * height z falls quadratically and lands at 55 %, then a 3.5 % bounce and a 2° spin settle while the soft
 * shadow tightens (offset LIGHT·z, blur ∝ z, alpha .36 → .1); two magnets clack on 0.15 s after landing; marker
 * captions write themselves; the camera breathes with slight parallax.
 */
type Print = {src?: string; seed?: number; x: number; y: number; w: number; rot: number; at: number; label: string};
type Props = {
  prints: Print[];
  dropFrames: number;
  light: number[];
  magnetColors: string[];
  ink: string;
  accent: string;
  title: string;
  background: string;
};

const BoardPrintDrop: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const id = useSafeId('bprint');
  const prints = p.prints;
  // camera breath + slight push
  const Z = lerp(1.05, 1, bease(clamp(frame / 60), 1.6, 3)) * lerp(1, 1.03, prog(frame, 60, 200, ease.sine));
  const camX = Math.sin(frame / 70) * 8 * u;
  const camY = Math.cos(frame / 90) * 5 * u;
  const titleK = clamp((frame - 4) / 26);

  return (
    <AbsoluteFill style={{background: p.background}}>
      <AbsoluteFill style={{transform: `translate(${camX}px, ${camY}px) scale(${Z})`}}>
        <Svg>
          <Whiteboard id={id} w={w} h={h} u={u} sheen={Math.sin(frame / 80) * 0.5} />
          {/* tray at the bottom edge */}
          <rect x={0} y={h - 26 * u} width={w} height={26 * u} fill="#B9BCBF" />
          <rect x={0} y={h - 26 * u} width={w} height={4 * u} fill="#ffffff" opacity={0.6} />
          {p.title && (
            <g>
              <defs>
                <clipPath id={`${id}-tc`}>
                  <rect x={0} y={0} width={(70 * u + p.title.length * 30 * u) * titleK} height={h} />
                </clipPath>
              </defs>
              <text x={70 * u} y={(portrait ? 150 : 120) * u} clipPath={`url(#${id}-tc)`} fontFamily={lf.hand} fontWeight={700} fontSize={(portrait ? 76 : 70) * u} fill={p.ink} style={{mixBlendMode: 'multiply'}}>
                {p.title}
              </text>
            </g>
          )}
        </Svg>
        {prints.map((pr, i) => {
          const t = (frame - pr.at) / p.dropFrames;
          if (t < 0) return null;
          const Z0 = 140;
          let z: number;
          if (t < 0.55) z = Z0 * (1 - Math.pow(t / 0.55, 2));
          else z = Z0 * 0.035 * Math.sin(Math.PI * clamp((t - 0.55) / 0.45)) * Math.max(0, 1 - (t - 0.55) * 1.2);
          const spin = pr.rot + 2 * (1 - clamp(t / 1.1)) * Math.cos(t * 7);
          const sc = 1 + z / 420;
          const pw = pr.w * w;
          const ph = pw * 0.72;
          const px = pr.x * w - pw / 2;
          const py = pr.y * h - ph / 2;
          const sAlpha = clamp(0.36 - (z - 10) * 0.0018, 0.1, 0.36);
          const sx = p.light[0] * z * u * 0.7 + 4 * u;
          const sy = p.light[1] * z * u * 0.7 + 6 * u;
          const blur = (3 + z * 0.16) * u;
          const op = clamp(t * 6);
          const landF = pr.at + p.dropFrames * 0.55;
          const mags = [0, 1].map((m) => {
            const tm = (frame - landF - 0.15 * fps - m * 3) / fps;
            return tm < 0 ? 0 : tm;
          });
          const labelK = clamp((frame - landF - 10) / 22);
          return (
            <React.Fragment key={i}>
              {/* height shadow */}
              <div
                style={{
                  position: 'absolute',
                  left: px + sx,
                  top: py + sy,
                  width: pw,
                  height: ph,
                  background: 'rgb(30,26,20)',
                  opacity: sAlpha * op,
                  filter: `blur(${blur}px)`,
                  transform: `rotate(${spin}deg) scale(${sc})`,
                }}
              />
              {/* the print: white border cut-out */}
              <div
                style={{
                  position: 'absolute',
                  left: px,
                  top: py,
                  width: pw,
                  height: ph,
                  background: '#FBFAF6',
                  padding: 9 * u,
                  boxSizing: 'border-box',
                  opacity: op,
                  transform: `rotate(${spin}deg) scale(${sc})`,
                }}
              >
                <div style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden'}}>
                  <Pic id={`${id}-pic${i}`} src={pr.src} seed={pr.seed ?? i + 3} imgStyle={{filter: 'saturate(0.85) sepia(0.08) contrast(0.96) brightness(1.04)'}} />
                </div>
              </div>
              {/* magnets */}
              {mags.map((tm, m) => {
                if (tm <= 0) return null;
                const k = settle(tm, 9, 22);
                const r = 17 * u;
                const mx = px + pw * (m === 0 ? 0.12 : 0.88);
                const my = py + 8 * u;
                const s2 = lerp(1.7, 1, k);
                return (
                  <svg key={m} style={{position: 'absolute', left: mx - r * 2, top: my - r * 2, width: r * 4, height: r * 4, overflow: 'visible', transform: `scale(${s2})`}}>
                    <circle cx={r * 2 + 3 * u * s2} cy={r * 2 + 5 * u * s2} r={r} fill="rgb(30,26,20)" opacity={0.3} />
                    <circle cx={r * 2} cy={r * 2} r={r} fill={p.magnetColors[(i + m) % p.magnetColors.length]} />
                    <circle cx={r * 2 - r * 0.32} cy={r * 2 - r * 0.36} r={r * 0.32} fill="#fff" opacity={0.45} />
                  </svg>
                );
              })}
              {/* marker caption */}
              {pr.label && labelK > 0 && (
                <svg style={{position: 'absolute', left: px, top: py + ph * sc + 16 * u, width: pw * 1.4, height: 70 * u, overflow: 'visible'}}>
                  <defs>
                    <clipPath id={`${id}-lc${i}`}>
                      <rect x={0} y={-20 * u} width={pw * 1.4 * labelK} height={110 * u} />
                    </clipPath>
                  </defs>
                  <text x={6 * u} y={44 * u} clipPath={`url(#${id}-lc${i})`} fontFamily={lf.hand} fontWeight={700} fontSize={(portrait ? 46 : 42) * u} fill={i === prints.length - 1 ? p.accent : p.ink} transform={`rotate(${-1 + (i % 2) * 1.5})`} style={{mixBlendMode: 'multiply'}}>
                    {pr.label}
                  </text>
                </svg>
              )}
            </React.Fragment>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const boardPrintDrop = defineMotion<Props>({
  id: 'board-print-drop',
  title: 'Board print drop',
  category: 'ui',
  description:
    'Cut-out photo prints are lowered onto an enamel whiteboard from the camera side, land with a tiny bounce and spin settle while their soft shadows tighten, get pinned by two clacking magnets, and marker captions write themselves under each.',
  source: ['lemo-opuscar styles/briefing-board demo/kit/board.js arrive drop / snap, height shadows (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §7 board-print-drop'],
  useFor: 'Evidence boards, mood boards, case studies, "here\'s what we tested" product comparisons — physical and premium.',
  durationInFrames: 165,
  defaultProps: {
    prints: [
      {x: 0.22, y: 0.5, w: 0.24, rot: -2.5, at: 14, label: 'Beam · 330 m', seed: 3},
      {x: 0.5, y: 0.46, w: 0.24, rot: 1.8, at: 34, label: 'Arch · 600 m', seed: 5},
      {x: 0.78, y: 0.52, w: 0.24, rot: -1.2, at: 54, label: 'Cable-stayed · 1,208 m', seed: 7},
    ],
    dropFrames: 18,
    light: [0.45, 0.8],
    magnetColors: ['#1F4FC8', '#D33A21', '#23272E'],
    ink: '#23272E',
    accent: '#D33A21',
    title: 'Which span fits?',
    background: '#8F8B83',
  },
  propDocs: {
    prints: '[{src?, seed?, x, y, w, rot, at, label}] centre x/y (0..1), width as a fraction of frame width, rotation in degrees, landing start frame and marker caption; no src = procedural scene',
    dropFrames: 'frames for one drop (0.6 s in the source)',
    light: 'light vector [x, y] for the height shadows',
    magnetColors: 'magnet colours',
    ink: 'graphite marker colour',
    accent: 'red marker colour (last caption — the decision)',
    title: 'marker headline top-left (empty = none)',
    background: 'wall colour behind the board',
  },
  component: BoardPrintDrop,
  tags: ['whiteboard', 'evidence board', 'mood board', 'photos', 'prints', 'drop', 'magnets', 'briefing', 'case study', 'comparison', 'marker', 'physical', 'collage', 'investigation'],
});
