import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {FilmGrain, useStage} from '../../core/stage';
import {fitSize} from '../../core/text-kit';
import {defineMotion} from '../../core/types';
import {Pic, inExpo, inOutQuad, inQuad, lin, outCubic} from '../../core/ui-kit';

/**
 * video10 explainer interstitial: navy-grid-backdrop (radial #2c3546 -> #0b1018, faint 90 px grid, grain) with a
 * serif title; three stacked panel outlines (red #ad3f32, gold #cfa44d, steel #8ca7c5) draw on clockwise from their
 * top-left corners (10 f easeInOutQuad, 5 f apart); pictures slide into each frame with the reveal (8 f
 * easeOutCubic) carrying a numbered label strip; on the impact beat the panels slam together (3 f easeInExpo,
 * gaps 20 -> -4 px) and every outline doubles into a print-misregistered ghost (+4,+4 @ 60 %), with a 2 f shake;
 * finally iron prison bars drop in a ragged front (easeInQuad, random 0-6 f delays, 2 % overshoot).
 */
type Panel = {src: string; label: string; color: string};
type Props = {
  title: string;
  panels: Panel[];
  caption: string;
  highlight: string;
  bars: boolean;
  barCount: number;
  collideAt: number;
  background: string;
  gridSize: number;
  seed: number;
};

const PanelTriptych: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, portrait} = useStage();
  const panels = p.panels.slice(0, 3);
  const n = panels.length;
  // layout
  const px = portrait ? 56 * u : w * 0.055;
  const pw = w - px * 2;
  const ph = portrait ? 400 * u : 232 * u;
  const gap0 = portrait ? 26 * u : 20 * u;
  const titleY = portrait ? 230 * u : 70 * u;
  const blockTop = portrait ? 340 * u : 128 * u;
  // collide
  const C = p.collideAt;
  const ct = inExpo(lin(frame, C, C + 3));
  const gap = gap0 + (-4 * u - gap0) * ct;
  const total0 = n * ph + (n - 1) * gap0;
  const total = n * ph + (n - 1) * gap;
  const top = blockTop + (total0 - total) / 2;
  const shake = frame >= C + 3 && frame < C + 7 ? (frame % 2 ? 1 : -1) * 6 * u * (1 - (frame - C - 3) / 4) : 0;
  const ghost = frame >= C + 3;
  const push = 1 + 0.04 * prog(frame, C + 4, 210, ease.sine);

  const draw = (i: number) => inOutQuad(lin(frame, 12 + i * 5, 22 + i * 5));
  const fillT = (i: number) => outCubic(lin(frame, 34 + i * 18, 42 + i * 18));

  const words = p.caption.split(' ');
  const capSize = fitSize(p.caption, (portrait ? 64 : 54) * u, w - 120 * u, 'sans', 0.08);
  const capY = portrait ? blockTop + total0 + 120 * u : blockTop + total0 + 74 * u;

  // bars
  const barsStart = 150;
  const bars = React.useMemo(() => {
    const r = rng(p.seed + 77);
    return Array.from({length: p.barCount}, () => r() * 6);
  }, [p.barCount, p.seed]);
  const pitch = w / p.barCount;
  const bw = Math.max(10 * u, w * 0.017 * (portrait ? 1.6 : 1));

  return (
    <AbsoluteFill style={{background: p.background}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #2c3546 0%, #232b3a 55%, #0b1018 100%)'}} />
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="pt-grid" width={p.gridSize * u} height={p.gridSize * u} patternUnits="userSpaceOnUse" x={cx % (p.gridSize * u)}>
            <path d={`M ${p.gridSize * u} 0 L 0 0 0 ${p.gridSize * u}`} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1.2 * u} />
          </pattern>
        </defs>
        <rect width={w} height={h} fill="url(#pt-grid)" />
      </svg>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${shake}px, ${shake * 0.5}px) scale(${push})`, transformOrigin: `${cx}px ${blockTop + total0 / 2}px`}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: titleY - 30 * u,
            textAlign: 'center',
            fontFamily: fonts.serif,
            fontWeight: 500,
            fontSize: fitSize(p.title, (portrait ? 60 : 50) * u, w - 100 * u, 'serif'),
            color: '#d8d2c4',
            letterSpacing: '0.02em',
            opacity: prog(frame, 0, 12, ease.out),
          }}
        >
          {p.title}
        </div>
        {panels.map((pan, i) => {
          const y = top + i * (ph + gap);
          const f = fillT(i);
          const lab = Math.round(ph * (portrait ? 0.13 : 0.17));
          return (
            <div key={i} style={{position: 'absolute', left: px, top: y, width: pw, height: ph, overflow: 'hidden'}}>
              <div style={{position: 'absolute', inset: 0, transform: `translateX(${(f - 1) * 100}%)`, opacity: frame >= 34 + i * 18 ? 1 : 0}}>
                <Pic src={pan.src} seed={p.seed * 10 + i} id={`pt-pic${i}`} />
                <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: lab * 2.6, background: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.78))'}} />
                <div style={{position: 'absolute', left: lab * 0.7, bottom: lab * 0.45, display: 'flex', alignItems: 'baseline', gap: lab * 0.55, fontFamily: fonts.sans, fontWeight: 800, color: '#fff', fontSize: lab * 0.82, letterSpacing: '0.06em', whiteSpace: 'nowrap'}}>
                  <span style={{color: pan.color, fontSize: lab * 1.05}}>{i + 1}</span>
                  <span>{pan.label.toUpperCase()}</span>
                </div>
              </div>
            </div>
          );
        })}
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          {panels.map((pan, i) => {
            const y = top + i * (ph + gap);
            const d = `M ${px} ${y} H ${px + pw} V ${y + ph} H ${px} Z`;
            const t = draw(i);
            return (
              <g key={i}>
                {ghost && <path d={d} transform={`translate(${4 * u} ${4 * u})`} fill="none" stroke={pan.color} strokeWidth={3 * u} opacity={0.6} />}
                <path d={d} fill="none" stroke={pan.color} strokeWidth={3 * u} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} strokeLinejoin="miter" />
              </g>
            );
          })}
        </svg>
        {/* kinetic caption */}
        <div style={{position: 'absolute', left: 0, right: 0, top: capY, display: 'flex', justifyContent: 'center', gap: capSize * 0.38, fontFamily: fonts.sans, fontWeight: 800, fontSize: capSize, color: '#f2efe8', letterSpacing: '0.08em'}}>
          {words.map((wd, i) => {
            const a = 18 + i * 6;
            const on = frame >= a;
            const hl = wd.replace(/[.,!?]/g, '') === p.highlight.replace(/[.,!?]/g, '');
            const pop = on ? 1 + 0.12 * (1 - clamp((frame - a) / 4)) : 0;
            return (
              <span key={i} style={{opacity: on ? 1 : 0, transform: `scale(${pop})`, display: 'inline-block', padding: hl ? `0 ${capSize * 0.18}px` : 0, background: hl ? '#c9473b' : 'transparent', borderRadius: 4 * u, lineHeight: 1.15}}>
                {wd}
              </span>
            );
          })}
        </div>
      </div>
      {/* prison bars */}
      {p.bars && frame >= barsStart && (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="pt-bar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#3a3d44" />
              <stop offset="0.18" stopColor="#3a3d44" />
              <stop offset="0.22" stopColor="#141519" />
              <stop offset="1" stopColor="#0c0d10" />
            </linearGradient>
          </defs>
          <rect width={w} height={h} fill="#05070b" opacity={0.25 * prog(frame, barsStart, barsStart + 12, ease.out)} />
          {bars.map((dl, i) => {
            const t0 = barsStart + dl;
            const fall = inQuad(lin(frame, t0, t0 + 7));
            const settle = frame >= t0 + 7 && frame < t0 + 9 ? 0.02 * h * (1 - (frame - t0 - 7) / 2) : 0;
            const y = (fall - 1) * h + settle;
            const x = pitch * (i + 0.5) - bw / 2;
            return <rect key={i} x={x} y={y} width={bw} height={h} fill="url(#pt-bar)" />;
          })}
        </svg>
      )}
      <FilmGrain opacity={0.06} />
    </AbsoluteFill>
  );
};

export const panelTriptych = defineMotion<Props>({
  id: 'panel-triptych',
  title: 'Panel triptych collide',
  category: 'data',
  description: 'Navy grid backdrop; three coloured panel outlines draw on clockwise, pictures slide into them with numbered labels, the panels slam together with doubled misprint outlines, then prison bars drop.',
  source: ['video10 23:00-37:80 navy-grid-backdrop, stroke-draw-frames, mask-slide-image-fill, panel-collide, prison-bars-drop'],
  useFor: '"Three things came together" explainers, numbered causes/factors, list reveals that end in a consequence.',
  durationInFrames: 210,
  defaultProps: {
    title: 'Every time, three things collided',
    panels: [
      {src: 'demo/lantern.jpg', label: 'A light left burning', color: '#ad3f32'},
      {src: 'demo/city.jpg', label: 'A town that never slept', color: '#cfa44d'},
      {src: 'demo/lighthouse.jpg', label: 'Nobody on watch', color: '#8ca7c5'},
    ],
    caption: 'three things collided.',
    highlight: 'collided',
    bars: true,
    barCount: 12,
    collideAt: 104,
    background: '#0b1018',
    gridSize: 90,
    seed: 3,
  },
  propDocs: {
    title: 'serif title above the panels',
    panels: '{src, label, color} for each of the three panels (src empty = procedural scene)',
    caption: 'kinetic caption under the panels (words pop on one by one)',
    highlight: 'caption word that gets the red highlight box',
    bars: 'drop prison bars at the end',
    barCount: 'number of bars across the frame',
    collideAt: 'frame of the panel slam',
    gridSize: 'backdrop grid spacing in px at 1080p',
  },
  component: PanelTriptych,
  tags: ['panels', 'triptych', 'list', 'explainer', 'collide', 'bars'],
});
