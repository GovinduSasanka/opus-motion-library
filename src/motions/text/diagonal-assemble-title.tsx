// Adapted from lemo-opuscar/styles/spy-titles/demo/{film.js (sShatter), title.js} (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {diag, eo3, ei3, fx, gothicAdvance, h1, lf, seg, useUid} from '../../core/r2-lb2b-kit';

/**
 * The previous scene slices into long strips parallel to a 30-degree cut line that slide off alternately along the
 * diagonal; the title's letters then fly in along the same diagonal from alternating sides, spinning, one landing per
 * sixteenth note; the title sits split in two halves along the cut and the halves close with a click.
 */
type Props = {
  title: string[];
  cutAngle: number;
  strips: number;
  stripWidth: number;
  landFrom: number;
  landEvery: number;
  splitGap: number;
  closeAt: number;
  scene: boolean;
  sceneGround: string;
  sceneInk: string;
  sceneAccent: string;
  paper: string;
  titleInk: string;
  seed: number;
};

const DiagonalAssembleTitle: React.FC<Props> = ({title, cutAngle, strips, stripWidth, landFrom, landEvery, splitGap, closeAt, scene, sceneGround, sceneInk, sceneAccent, paper, titleInk, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy} = useStage();
  const uid = useUid('dat');
  const fam = lf('gothic');
  const {d} = diag(cutAngle);
  const L = Math.hypot(w, h) * 1.2;
  const SW = stripWidth * u;
  const half = Math.floor(strips / 2);

  // ---------------------------------------------------------------- outgoing scene (flat red rooftops under a paper moon)
  const Scene = () => (
    <g>
      <rect x={-L} y={-L} width={w + 2 * L} height={h + 2 * L} fill={sceneGround} />
      <circle cx={w * 0.7} cy={h * 0.34} r={Math.min(w, h) * 0.2} fill={paper} />
      {Array.from({length: 11}, (_, i) => {
        const bw = (w / 9) * (0.8 + h1(i, seed) * 0.7);
        const bx = i * (w / 9.5) - bw * 0.2;
        const bh = h * (0.18 + h1(i + 7, seed) * 0.3);
        return (
          <g key={i}>
            <rect x={bx} y={h - bh} width={bw} height={bh + 4} fill={sceneInk} />
            {Array.from({length: 6}, (_, k) => (
              <rect key={k} x={bx + bw * 0.15 + (k % 2) * bw * 0.4} y={h - bh + bh * 0.12 + Math.floor(k / 2) * bh * 0.22} width={bw * 0.2} height={bh * 0.1} fill={h1(i * 9 + k, seed) < 0.45 ? sceneAccent : sceneGround} opacity={0.9} />
            ))}
          </g>
        );
      })}
    </g>
  );

  // ---------------------------------------------------------------- title layout
  const adv = (t: string) => t.split('').reduce((a, c) => a + gothicAdvance(c), 0);
  const maxLine = Math.max(...title.map((t) => adv(t.toUpperCase()) * 100), 1);
  const fs = Math.min(((w * 0.82) / maxLine) * 100, h * 0.3);
  const lineH = fs * 0.86;
  type G = {ch: string; x: number; y: number; wd: number; i: number};
  const glyphs: G[] = [];
  let gi = 0;
  title.forEach((t, li) => {
    const T = t.toUpperCase();
    const tw = adv(T) * fs * 1.0 + T.length * fs * 0.03;
    let x = cx - tw / 2;
    const y = cy + (li - (title.length - 1) / 2) * lineH + fs * 0.3;
    for (const ch of T) {
      const wd = gothicAdvance(ch) * fs + fs * 0.03;
      if (ch !== ' ') glyphs.push({ch, x, y, wd, i: gi++});
      x += wd;
    }
  });
  const landT = (i: number) => landFrom + i * landEvery;
  const glyphEls = (
    <g fill={titleInk} fontFamily={fam} fontSize={fs}>
      {glyphs.map((g) => {
        const p = eo3(seg(frame, landT(g.i) - 13, landT(g.i)));
        if (p <= 0) return null;
        const side = g.i % 2 ? 1 : -1;
        const dist = 1500 * u * (1 - p);
        const rot = (1 - p) * side * 1.2 * (180 / Math.PI);
        const pop = 1 + 0.05 * Math.sin(Math.PI * seg(frame, landT(g.i), landT(g.i) + 5));
        return (
          <text key={g.i} x={0} y={0} transform={`translate(${fx(g.x + g.wd / 2 + side * d[0] * dist)},${fx(g.y + side * d[1] * dist)}) rotate(${fx(rot)}) scale(${fx(pop)}) `} textAnchor="middle">
            {g.ch}
          </text>
        );
      })}
    </g>
  );

  // ---------------------------------------------------------------- split halves and the click
  const gap = splitGap * u * (1 - eo3(seg(frame, closeAt, closeAt + 2.5)));
  const click = seg(frame, closeAt, closeAt + 7);
  const punch = 1 + 0.018 * Math.sin(Math.PI * Math.min(1, click * 2)) * (frame >= closeAt ? 1 : 0);
  const rotT = `translate(${fx(cx)},${fx(cy)}) rotate(${fx(-cutAngle)})`;
  const unrot = `rotate(${fx(cutAngle)}) translate(${fx(-cx)},${fx(-cy)})`;
  const halves = [-1, 1].map((sd) => (
    <g key={sd} transform={`${rotT} translate(${fx(sd * gap * 0.5)},0)`} clipPath={`url(#${uid}h${sd})`}>
      <g transform={unrot}>{glyphEls}</g>
    </g>
  ));

  // ---------------------------------------------------------------- strips
  const sliding = frame < landFrom + 6 && scene;
  const stripEls: React.ReactNode[] = [];
  if (sliding) {
    for (let k = -half; k <= half; k++) {
      const delay = 8 + 0.6 * Math.abs(k);
      const p = ei3(seg(frame, delay, delay + 22));
      if (p >= 1) continue;
      const dy = p * 2600 * u * (k % 2 === 0 ? 1 : -1);
      stripEls.push(
        <g key={k} transform={`translate(${fx(cx)},${fx(cy)}) rotate(${fx(-cutAngle)}) translate(0,${fx(dy)})`} clipPath={`url(#${uid}s${k})`}>
          <g transform={`rotate(${fx(cutAngle)}) translate(${fx(-cx)},${fx(-cy)})`}>
            <Scene />
          </g>
        </g>,
      );
    }
  }
  return (
    <AbsoluteFill style={{background: paper}}>
      <Svg>
        <defs>
          {Array.from({length: half * 2 + 1}, (_, j) => {
            const k = j - half;
            return (
              <clipPath key={k} id={`${uid}s${k}`}>
                <rect x={k * SW - SW / 2 - 0.6} y={-L} width={SW + 1.2} height={2 * L} />
              </clipPath>
            );
          })}
          <clipPath id={`${uid}h-1`}>
            <rect x={-L} y={-L} width={L} height={2 * L} />
          </clipPath>
          <clipPath id={`${uid}h1`}>
            <rect x={0} y={-L} width={L} height={2 * L} />
          </clipPath>
        </defs>
        <rect width={w} height={h} fill={paper} />
        <g transform={`translate(${fx(cx)},${fx(cy)}) scale(${fx(punch)}) translate(${fx(-cx)},${fx(-cy)})`}>{halves}</g>
        {stripEls}
        {/* the click: a hairline flash along the cut */}
        {frame >= closeAt && click < 1 && (
          <g transform={`${rotT}`} opacity={1 - click}>
            <rect x={-1.5 * u} y={-L} width={3 * u} height={2 * L} fill={sceneAccent} />
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const diagonalAssembleTitle = defineMotion<Props>({
  id: 'diagonal-assemble-title',
  title: 'Diagonal assemble title (shatter into title)',
  category: 'text',
  description:
    'The previous scene slices into 23 strips along a 30-degree cut that slide off alternately; the title letters then fly in along the same diagonal from alternating sides, spinning and landing one per sixteenth note, the title sitting split along the cut until the halves close with a click.',
  source: ['lemo-opuscar styles/spy-titles demo/film.js (sShatter), title.js (MIT, LemoLab)'],
  useFor: 'Logo and name reveals ("the chase ends at the brand"), event openers, trailers: an assemble-the-title finale with real graphic punch.',
  durationInFrames: 150,
  defaultProps: {
    title: ['Northwind', 'Station'],
    cutAngle: 30,
    strips: 23,
    stripWidth: 260,
    landFrom: 28,
    landEvery: 3,
    splitGap: 40,
    closeAt: 92,
    scene: true,
    sceneGround: '#c8321e',
    sceneInk: '#1b1714',
    sceneAccent: '#e2a52a',
    paper: '#efe4c9',
    titleInk: '#1b1714',
    seed: 3,
  },
  propDocs: {
    title: 'title lines (one or two short lines)',
    cutAngle: 'cut line angle from vertical, degrees',
    strips: 'number of strips the outgoing scene is cut into',
    stripWidth: 'strip width in u',
    landFrom: 'frame the first letter lands',
    landEvery: 'frames between letter landings',
    splitGap: 'gap between the two title halves in u',
    closeAt: 'frame the halves close with a click',
    scene: 'show the outgoing scene (false = start straight on the title)',
    sceneGround: 'outgoing scene sky/ground colour',
    sceneInk: 'outgoing scene skyline colour',
    sceneAccent: 'window / click accent colour',
    paper: 'background behind the title',
    titleInk: 'title letter colour',
    seed: 'skyline seed',
  },
  component: DiagonalAssembleTitle,
  tags: ['title', 'logo reveal', 'shatter', 'strips', 'diagonal', 'assemble', 'cut paper', 'opener', 'trailer', 'transition', 'letters fly in', 'split', 'click'],
});
