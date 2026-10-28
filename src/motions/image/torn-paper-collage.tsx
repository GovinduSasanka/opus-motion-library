import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {blobPoly, circlePoly, fitSize, hexA, mixHex, ptsPath, rectPoly, starPoly, tornOutline, useUid, type Pt} from '../../core/r2-pr4-kit';
import {rng} from '../../core/random';
import {PaperTexture, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Torn-paper collage: photos (or procedural scenes), shapes and label strips with torn white edges, tape strips and a
 * halftone screen slap onto a kraft board one after another — each lands with a one-frame overshoot, then boils on
 * twos with +-1.5 degree jitter. A black torn headline strip stamps on last.
 */
type Piece = {
  kind: 'photo' | 'circle' | 'star' | 'blob' | 'note';
  src?: string;
  scene?: number;
  x: number;
  y: number;
  px?: number;
  py?: number;
  w: number;
  h: number;
  rot: number;
  tape?: 'top' | 'corner' | 'both' | 'none';
  color?: string;
  label?: string;
  delay?: number;
};
type Props = {
  pieces: Piece[];
  headline: string;
  background: string;
  paperColor: string;
  inkColor: string;
  tapeColor: string;
  palette: string[];
  step: number;
  jitter: number;
  tear: number;
  halftone: number;
  stagger: number;
  seed: number;
};

const PIECES: Piece[] = [
  {kind: 'photo', scene: 0, x: 0.3, y: 0.42, px: 0.36, py: 0.2, w: 520, h: 390, rot: -4, tape: 'top'},
  {kind: 'photo', scene: 1, x: 0.6, y: 0.3, px: 0.68, py: 0.36, w: 400, h: 300, rot: 5, tape: 'corner'},
  {kind: 'photo', scene: 2, x: 0.73, y: 0.64, px: 0.34, py: 0.55, w: 440, h: 330, rot: -3, tape: 'top'},
  {kind: 'circle', x: 0.13, y: 0.75, px: 0.78, py: 0.68, w: 250, h: 250, rot: 0, color: '#ff5a47'},
  {kind: 'star', x: 0.9, y: 0.17, px: 0.86, py: 0.09, w: 210, h: 210, rot: 12, color: '#ffd23f'},
  {kind: 'note', x: 0.43, y: 0.69, px: 0.28, py: 0.76, w: 330, h: 100, rot: -2, label: 'Issue 04', tape: 'both'},
];

const SCENE_PAL = [
  ['#f9d9a0', '#f08a5d', '#3d5a80'],
  ['#bfe3f0', '#5aa9c9', '#22405a'],
  ['#ffd6e0', '#ef6f8f', '#5b2a55'],
  ['#d8eed0', '#6fb36b', '#2f5d3a'],
];

const Scene: React.FC<{w: number; h: number; v: number; u: number; uid: string}> = ({w, h, v, u, uid}) => {
  const pal = SCENE_PAL[v % SCENE_PAL.length];
  const x0 = -w / 2;
  const y0 = -h / 2;
  const kind = v % 3;
  return (
    <g>
      <defs>
        <linearGradient id={uid + 'sky'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={pal[0]} />
          <stop offset="1" stopColor={mixHex(pal[0], pal[1], 0.55)} />
        </linearGradient>
      </defs>
      <rect x={x0 - 6} y={y0 - 6} width={w + 12} height={h + 12} fill={`url(#${uid}sky)`} />
      <circle cx={x0 + w * 0.68} cy={y0 + h * 0.34} r={h * 0.15} fill="#fff7e0" opacity={0.92} />
      {kind === 0 && (
        <>
          <path d={`M${x0 - 6},${y0 + h * 0.72} Q${x0 + w * 0.25},${y0 + h * 0.46} ${x0 + w * 0.55},${y0 + h * 0.68} T${x0 + w + 6},${y0 + h * 0.6} L${x0 + w + 6},${y0 + h + 6} L${x0 - 6},${y0 + h + 6}Z`} fill={pal[1]} />
          <path d={`M${x0 - 6},${y0 + h * 0.86} Q${x0 + w * 0.4},${y0 + h * 0.64} ${x0 + w * 0.8},${y0 + h * 0.84} T${x0 + w + 6},${y0 + h * 0.8} L${x0 + w + 6},${y0 + h + 6} L${x0 - 6},${y0 + h + 6}Z`} fill={pal[2]} />
        </>
      )}
      {kind === 1 && (
        <>
          {Array.from({length: 9}, (_, i) => {
            const bw = w / 9;
            const bh = h * (0.28 + ((i * 37) % 11) / 22);
            return (
              <g key={i}>
                <rect x={x0 + i * bw + 3} y={y0 + h - bh} width={bw - 4} height={bh + 6} fill={i % 2 ? pal[2] : mixHex(pal[2], pal[1], 0.3)} />
                {Array.from({length: Math.floor(bh / (22 * u))}, (_, k) => (
                  <rect key={k} x={x0 + i * bw + bw * 0.25} y={y0 + h - bh + 10 * u + k * 22 * u} width={bw * 0.18} height={9 * u} fill="#ffe9a8" opacity={0.85} />
                ))}
              </g>
            );
          })}
        </>
      )}
      {kind === 2 && (
        <>
          <path d={`M${x0 - 6},${y0 + h * 0.8} L${x0 + w * 0.3},${y0 + h * 0.3} L${x0 + w * 0.5},${y0 + h * 0.6} L${x0 + w * 0.72},${y0 + h * 0.22} L${x0 + w + 6},${y0 + h * 0.7} L${x0 + w + 6},${y0 + h + 6} L${x0 - 6},${y0 + h + 6}Z`} fill={pal[1]} />
          <path d={`M${x0 - 6},${y0 + h * 0.9} L${x0 + w * 0.35},${y0 + h * 0.56} L${x0 + w * 0.62},${y0 + h * 0.82} L${x0 + w + 6},${y0 + h * 0.62} L${x0 + w + 6},${y0 + h + 6} L${x0 - 6},${y0 + h + 6}Z`} fill={pal[2]} />
        </>
      )}
    </g>
  );
};

const Collage: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames} = useStage();
  const uid = useUid('tpc');
  const pieces = p.pieces.length ? p.pieces : PIECES;
  const step = Math.max(1, Math.round(p.step));
  const f = Math.floor(frame / step) * step;
  const amp = p.tear * u;
  const rim = 11 * u;
  const k = portrait ? 1 : 1.22;

  const geo = React.useMemo(
    () =>
      pieces.map((pc, i) => {
        const W = pc.w * u * k;
        const H = pc.h * u * k;
        let base: Pt[];
        if (pc.kind === 'circle') base = circlePoly(W / 2, H / 2, 56);
        else if (pc.kind === 'star') base = starPoly(5, W / 2, W / 4.2);
        else if (pc.kind === 'blob') base = blobPoly(W / 2, p.seed + i);
        else base = rectPoly(W, H);
        const inner = tornOutline(base, p.seed * 13 + i * 3 + 1, amp * 0.75, 8 * u);
        const outer = tornOutline(base, p.seed * 13 + i * 3 + 2, amp * 0.9, 8 * u, rim);
        return {W, H, inner: ptsPath(inner), outer: ptsPath(outer)};
      }),
    [pieces, u, amp, rim, p.seed, k],
  );

  const t0 = (i: number) => 6 + i * p.stagger + (pieces[i].delay ?? 0);
  const drift = 1 + 0.035 * (frame / Math.max(1, durationInFrames));
  const hlStart = 6 + pieces.length * p.stagger + 6;

  // slap curve: 1-frame overshoot, then settle
  const slap = (age: number) => (age < 0 ? 0 : age === 0 ? 1.26 : age === 1 ? 1.09 : age === 2 ? 0.965 : 1);

  const tape = (kind: 'top' | 'corner', W: number, H: number, k: number) => {
    const tw = 120 * u;
    const th = 34 * u;
    const g = rng(p.seed + k * 11);
    const pts = `M${-tw / 2},${-th / 2} l${6 * u},${th * 0.25} l${-6 * u},${th * 0.25} l${6 * u},${th * 0.25} l${-6 * u},${th * 0.25} L${tw / 2},${th / 2} l${-6 * u},${-th * 0.25} l${6 * u},${-th * 0.25} l${-6 * u},${-th * 0.25} l${6 * u},${-th * 0.25}Z`;
    const x = kind === 'top' ? (g() - 0.5) * W * 0.3 : W / 2 - 22 * u;
    const y = kind === 'top' ? -H / 2 - 4 * u : -H / 2 + 4 * u;
    const r = kind === 'top' ? (g() - 0.5) * 8 : 38;
    return (
      <g transform={`translate(${x},${y}) rotate(${r})`}>
        <path d={pts} fill={hexA(p.tapeColor, 0.72)} stroke={hexA('#000', 0.08)} strokeWidth={1} />
        <path d={`M${-tw * 0.35},${-th * 0.2} h${tw * 0.5}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={2 * u} />
      </g>
    );
  };

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <pattern id={uid + 'bgdots'} width={14 * u} height={14 * u} patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
            <circle cx={7 * u} cy={7 * u} r={2.2 * u} fill={mixHex(p.background, '#000', 0.5)} opacity={0.14} />
          </pattern>
          <pattern id={uid + 'dots'} width={8 * u} height={8 * u} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <circle cx={4 * u} cy={4 * u} r={1.9 * u} fill="#1a1410" />
          </pattern>
          <filter id={uid + 'sh'} x="-20%" y="-20%" width="140%" height="150%">
            <feGaussianBlur stdDeviation={5 * u} />
          </filter>
        </defs>
        <rect width={w} height={h} fill={`url(#${uid}bgdots)`} />
        <g transform={`translate(${w / 2} ${h / 2}) scale(${drift}) translate(${-w / 2} ${-h / 2})`}>
          {pieces.map((pc, i) => {
            const age = f - t0(i);
            const sc = slap(age);
            if (sc === 0) return null;
            const g = geo[i];
            const fx = (portrait ? pc.px ?? pc.x : pc.x) * w;
            const fy = (portrait ? pc.py ?? pc.y : pc.y) * h;
            const jr = rng(Math.floor(frame / step) * 977 + i * 131 + p.seed);
            const jrot = (jr() * 2 - 1) * p.jitter;
            const jx = (jr() * 2 - 1) * 1.2 * u;
            const jy = (jr() * 2 - 1) * 1.2 * u;
            const slapY = age <= 1 ? -26 * u * (1 - age) : 0;
            const color = pc.color ?? '#ffd23f';
            const pid = uid + i;
            const tp = pc.tape ?? 'none';
            const small = pc.kind === 'note';
            return (
              <g key={i} transform={`translate(${fx + jx} ${fy + jy + slapY}) rotate(${pc.rot + jrot}) scale(${sc})`}>
                <path d={g.outer} transform={`translate(${6 * u} ${9 * u})`} fill="#000" opacity={0.32} filter={`url(#${uid}sh)`} />
                <path d={g.outer} fill={p.paperColor} />
                <clipPath id={pid + 'c'}>
                  <path d={g.inner} />
                </clipPath>
                <g clipPath={`url(#${pid}c)`}>
                  {pc.kind === 'photo' ? (
                    pc.src ? (
                      <image href={resolveSrc(pc.src)} x={-g.W / 2 - 4} y={-g.H / 2 - 4} width={g.W + 8} height={g.H + 8} preserveAspectRatio="xMidYMid slice" />
                    ) : (
                      <Scene w={g.W} h={g.H} v={pc.scene ?? i} u={u} uid={pid} />
                    )
                  ) : pc.kind === 'note' ? (
                    <rect x={-g.W / 2 - 4} y={-g.H / 2 - 4} width={g.W + 8} height={g.H + 8} fill={pc.color ?? '#fff4c2'} />
                  ) : (
                    <rect x={-g.W / 2 - 4} y={-g.H / 2 - 4} width={g.W + 8} height={g.H + 8} fill={color} />
                  )}
                  <mask id={pid + 'm'}>
                    <linearGradient id={pid + 'lg'} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#fff" stopOpacity={0.0} />
                      <stop offset="1" stopColor="#fff" stopOpacity={1} />
                    </linearGradient>
                    <rect x={-g.W / 2 - 4} y={-g.H / 2 - 4} width={g.W + 8} height={g.H + 8} fill={`url(#${pid}lg)`} />
                  </mask>
                  <rect x={-g.W / 2 - 4} y={-g.H / 2 - 4} width={g.W + 8} height={g.H + 8} fill={`url(#${uid}dots)`} opacity={p.halftone} mask={`url(#${pid}m)`} style={{mixBlendMode: 'multiply'}} />
                  {small && <rect x={-g.W / 2} y={-g.H / 2} width={g.W} height={g.H} fill="none" />}
                </g>
                {pc.kind === 'note' && pc.label && (
                  <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontFamily={fonts.hand} fontWeight={700} fontSize={fitSize(pc.label, fonts.hand, 66 * u, g.W * 0.8, 700)} fill={p.inkColor} transform="rotate(-1.5)">
                    {pc.label}
                  </text>
                )}
                {(tp === 'top' || tp === 'both') && tape('top', g.W, g.H, i)}
                {(tp === 'corner' || tp === 'both') && tape('corner', g.W, g.H, i + 5)}
              </g>
            );
          })}
        </g>
      </Svg>
      <PaperTexture opacity={0.5} seed={4} tint={mixHex(p.background, '#6b5530', 0.5)} scale={0.8} />

      {p.headline && frame >= hlStart && (() => {
        const age = Math.floor(frame / step) * step - hlStart;
        const sc = age <= 0 ? 1.4 : age <= 1 ? 1.12 : age === 2 ? 0.97 : 1;
        const fs = (portrait ? 118 : 108) * u;
        const maxW = portrait ? w * 0.82 : w * 0.56;
        const size = fitSize(p.headline.toUpperCase(), fonts.display, fs, maxW, 400);
        const hg = rng(Math.floor(frame / step) * 53 + p.seed);
        return (
          <div
            style={{
              position: 'absolute',
              left: w / 2,
              top: portrait ? h * 0.9 : h * 0.88,
              transform: `translate(-50%,-50%) rotate(${-2 + (hg() * 2 - 1) * p.jitter * 0.6}deg) scale(${sc})`,
              opacity: clamp(1 - Math.max(0, 1 - age) * 0.0),
            }}
          >
            <HeadlineStrip text={p.headline.toUpperCase()} size={size} ink={p.inkColor} paper={p.paperColor} u={u} seed={p.seed} amp={amp} uid={uid} />
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};

const HeadlineStrip: React.FC<{text: string; size: number; ink: string; paper: string; u: number; seed: number; amp: number; uid: string}> = ({text, size, ink, paper, u, seed, amp, uid}) => {
  const W = Math.max(200 * u, text.length * size * 0.62 + 90 * u);
  const H = size * 1.5;
  const path = React.useMemo(() => ptsPath(tornOutline(rectPoly(W, H), seed + 77, amp, 8 * u)), [W, H, seed, amp, u]);
  const pad = 30 * u;
  return (
    <svg width={W + pad * 2} height={H + pad * 2} viewBox={`${-W / 2 - pad} ${-H / 2 - pad} ${W + pad * 2} ${H + pad * 2}`} style={{overflow: 'visible', display: 'block'}}>
      <filter id={uid + 'hs'} x="-10%" y="-20%" width="120%" height="160%">
        <feGaussianBlur stdDeviation={5 * u} />
      </filter>
      <path d={path} transform={`translate(${6 * u} ${9 * u})`} fill="#000" opacity={0.35} filter={`url(#${uid}hs)`} />
      <path d={path} fill={ink} />
      <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontFamily={fonts.display} fontSize={size} letterSpacing={size * 0.03} fill={paper}>
        {text}
      </text>
    </svg>
  );
};

export const tornPaperCollage = defineMotion<Props>({
  id: 'torn-paper-collage',
  title: 'Torn-paper collage',
  category: 'image',
  description:
    'Photos (procedural scenes by default), a circle, a star and a label strip with torn white edges, taped corners and halftone slap onto a kraft dotted board one by one with a one-frame overshoot, boil on twos with a little jitter, then a black torn headline strip stamps on.',
  source: ['prompt-corpus: torn-paper-collage (10 cases, awesome-opus5-5-videos)'],
  useFor: 'Editorial explainers, music videos, zine-style social posts and recaps that show host photos: pass your images in pieces[].src and your words in headline.',
  durationInFrames: 150,
  defaultProps: {
    pieces: PIECES,
    headline: 'Paste it up',
    background: '#e6dcc8',
    paperColor: '#f7f2e8',
    inkColor: '#16130f',
    tapeColor: '#f3e29a',
    palette: [],
    step: 2,
    jitter: 1.5,
    tear: 11,
    halftone: 0.3,
    stagger: 7,
    seed: 3,
  },
  propDocs: {
    pieces: 'pieces [{kind:photo|circle|star|blob|note, src?(public path), scene?(procedural 0-3), x,y (0-1 landscape centre), px,py (portrait centre), w,h (px at 1080), rot, tape:top|corner|both|none, color?, label?(note), delay?}]',
    headline: 'black torn strip text ("" for none)',
    background: 'board colour',
    paperColor: 'torn paper rim colour',
    inkColor: 'strip + note ink',
    tapeColor: 'tape strip colour (drawn at 72 % alpha)',
    palette: 'reserved (scene colours are built in)',
    step: 'hold each drawing for N frames (2 = on twos)',
    jitter: 'max rotation jitter in degrees',
    tear: 'torn edge displacement in px at 1080 (6-12)',
    halftone: 'halftone dot screen strength 0-1',
    stagger: 'frames between pieces slapping on',
    seed: 'torn edges / jitter seed',
  },
  component: Collage,
  tags: ['collage', 'torn paper', 'paper', 'tape', 'halftone', 'photos', 'scrapbook', 'zine', 'editorial', 'on twos', 'stop motion', 'slap', 'sticker', 'music video', 'social', 'craft', 'kraft', 'recap', 'photo wall'],
});
