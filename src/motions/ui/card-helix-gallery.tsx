import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {clamp, ease} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Gallery helix: preview cards float on a slowly turning 3D ring over a soft pastel aurora of blurred blobs. A huge faint
 * serif rank text ("Top 10") sits behind. Each beat the ring turns one step, the front card swells forward and an info
 * panel (serif title, handle, big stats counting up, Save / Open pills) slides in beside it. CSS 3D, deterministic.
 */

type Item = {title: string; handle?: string; tag?: string; color?: string; src?: string; stats?: number[]};

type Props = {
  items: Item[];
  rankLabel: string;
  statLabels: string[];
  holdFrames: number;
  turnFrames: number;
  radius: number;
  cardAspect: number;
  background: string;
  blobs: string[];
  ink: string;
  accent: string;
  rankColor: string;
};

const SAMPLE: Item[] = [
  {title: 'Neon pour typography reel', handle: '@studio.north', tag: 'MOTION', color: '#9B8CFF', stats: [12700, 326500, 763]},
  {title: 'Paper fold product teaser', handle: '@fold.club', tag: 'PRODUCT', color: '#FF9EC0', stats: [8400, 91200, 412]},
  {title: 'Glass dashboard walkthrough', handle: '@pixelhaus', tag: 'UI', color: '#7FD8E8', stats: [15200, 204800, 1190]},
  {title: 'Liquid logo sting', handle: '@wave.lab', tag: 'BRAND', color: '#FFC98A', stats: [6100, 58300, 305]},
  {title: 'Orbit data explainer', handle: '@datadrift', tag: 'DATA', color: '#A5E6B0', stats: [9900, 133400, 640]},
  {title: 'Soft 3D icon loop', handle: '@iconfarm', tag: '3D', color: '#C4A8FF', stats: [11300, 177000, 880]},
  {title: 'Kinetic poster series', handle: '@type.room', tag: 'TYPE', color: '#FF8E8E', stats: [7200, 70500, 350]},
  {title: 'Ambient scroll hero', handle: '@hero.works', tag: 'WEB', color: '#8EB4FF', stats: [5400, 49800, 260]},
];

const fmtBig = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n)));

const CardFace: React.FC<{it: Item; u: number; i: number}> = ({it, u, i}) => {
  const c = it.color ?? '#9B8CFF';
  return (
    <div style={{position: 'absolute', inset: 0, borderRadius: 18 * u, overflow: 'hidden', background: `linear-gradient(155deg, #ffffff 0%, ${c}66 100%)`, boxShadow: `0 ${18 * u}px ${40 * u}px rgba(90,70,160,0.22), inset 0 0 0 ${1.5 * u}px rgba(255,255,255,0.8)`}}>
      {it.src ? (
        <Img src={resolveSrc(it.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      ) : (
        <>
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
            <circle cx={30 + (i % 3) * 18} cy={38} r={20} fill={c} opacity={0.55} />
            <rect x={14} y={66} width={46 + (i % 4) * 8} height={7} rx={3.5} fill="#2a2440" opacity={0.7} />
            <rect x={14} y={78} width={30} height={5} rx={2.5} fill="#2a2440" opacity={0.28} />
          </svg>
          <div style={{position: 'absolute', left: 12 * u, top: 12 * u, padding: `${3 * u}px ${8 * u}px`, borderRadius: 99, background: 'rgba(255,255,255,0.8)', fontFamily: fonts.mono, fontSize: 13 * u, color: '#5b4bb0', letterSpacing: 1 * u}}>
            {it.tag ?? 'WORK'}
          </div>
        </>
      )}
    </div>
  );
};

const CardHelixGallery: React.FC<Props> = ({items, rankLabel, statLabels, holdFrames, turnFrames, radius, cardAspect, background, blobs, ink, accent, rankColor}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const list = items.length ? items : SAMPLE;
  const n = list.length;
  const step = (Math.PI * 2) / n;
  const seg = holdFrames + turnFrames;
  const k = Math.floor(frame / seg);
  const local = frame - k * seg;
  const turnP = ease.inOut(clamp((local - holdFrames) / Math.max(1, turnFrames), 0, 1));
  const pos = k + turnP;
  const ang = -pos * step;
  const focusIdx = Math.round(pos);
  const focus = focusIdx % n;
  const arrive = focusIdx * seg - turnFrames * 0.5; // frame the focus item became front
  const R = (portrait ? Math.min(radius, 470) : Math.min(radius, 780)) * u;
  const cw = (portrait ? 330 : 330) * u;
  const q = portrait ? 1.35 : 1.2;
  const ch = cw / cardAspect;
  const ringCx = portrait ? w / 2 : w * 0.35;
  const ringCy = portrait ? h * 0.32 : h * 0.5;
  const it = list[focus];
  const panelIn = ease.out(clamp((frame - arrive) / 22, 0, 1));
  const panelOut = 1 - ease.inOut(clamp((local - holdFrames) / Math.max(1, turnFrames * 0.45), 0, 1));
  const panelA = Math.min(panelIn, panelOut);
  const cnt = ease.out(clamp((frame - arrive) / 36, 0, 1));
  const panelW = portrait ? w - 100 * u : 560 * u;
  const panelX = portrait ? 50 * u : w * 0.62;
  const panelY = portrait ? h * 0.6 : h * 0.5 - 260 * u;

  return (
    <AbsoluteFill style={{background, overflow: 'hidden', fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1'}}>
      {blobs.map((c, i) => {
        const a = (frame / 150) * Math.PI * 2 + i * 1.7;
        const bx = [0.15, 0.85, 0.5, 0.3, 0.9][i % 5] * w + Math.sin(a) * 60 * u;
        const by = [0.2, 0.3, 0.9, 0.8, 0.85][i % 5] * h + Math.cos(a * 0.8) * 50 * u;
        const bs = (portrait ? 700 : 640) * u * (0.9 + (i % 3) * 0.2);
        return <div key={i} style={{position: 'absolute', left: bx - bs / 2, top: by - bs / 2, width: bs, height: bs, borderRadius: '50%', background: c, opacity: 0.55, filter: `blur(${120 * u}px)`}} />;
      })}
      <div style={{position: 'absolute', left: ringCx - 700 * u, width: 1400 * u, top: ringCy - 260 * u, textAlign: 'center', fontFamily: fonts.serif, fontSize: (portrait ? 330 : 460) * u, lineHeight: 1, color: rankColor, opacity: 0.45, letterSpacing: -8 * u, fontStyle: 'italic', whiteSpace: 'nowrap'}}>
        {rankLabel}
      </div>
      <div style={{position: 'absolute', left: ringCx, top: ringCy, width: 0, height: 0, perspective: 1500 * u, perspectiveOrigin: '50% 50%'}}>
        <div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', transform: `translateZ(${-R}px) rotateX(-7deg) rotateY(${(ang * 180) / Math.PI}deg)`}}>
          {list.map((c, i) => {
            const rel = Math.atan2(Math.sin(i * step + ang), Math.cos(i * step + ang));
            const close = Math.pow(Math.max(0, Math.cos(rel)), 6);
            const dim = 0.35 + 0.65 * Math.max(0, (Math.cos(rel) + 0.4) / 1.4);
            return (
              <div key={i} style={{position: 'absolute', left: -cw / 2, top: -ch / 2, width: cw, height: ch, transformStyle: 'preserve-3d', opacity: dim, transform: `rotateY(${(i * step * 180) / Math.PI}deg) translateZ(${R + close * 120 * u}px) scale(${1 + close * 0.28})`, backfaceVisibility: 'hidden'}}>
                <CardFace it={c} u={u} i={i} />
              </div>
            );
          })}
        </div>
      </div>
      <div style={{position: 'absolute', left: panelX + (1 - panelIn) * 60 * u, top: panelY, width: panelW, opacity: panelA, padding: 34 * q * u, borderRadius: 26 * u, background: 'rgba(255,255,255,0.62)', boxShadow: `0 ${24 * u}px ${60 * u}px rgba(110,90,190,0.18), inset 0 0 0 ${1.5 * u}px rgba(255,255,255,0.9)`}}>
        <div style={{display: 'flex', gap: 10 * u, alignItems: 'center', fontFamily: fonts.mono, fontSize: 14 * q * u, letterSpacing: 2 * u, color: accent}}>
          <span>{'#' + (focus + 1)}</span>
          <span style={{opacity: 0.4}}>{'/ ' + n}</span>
          <span style={{marginLeft: 8 * u, padding: `${3 * u}px ${10 * u}px`, borderRadius: 99, background: `${accent}22`}}>{it.tag ?? 'WORK'}</span>
        </div>
        <div style={{fontFamily: fonts.serif, fontSize: (portrait ? 40 : 46) * q * u, lineHeight: 1.08, color: ink, marginTop: 14 * q * u}}>{it.title}</div>
        <div style={{fontFamily: fonts.sans, fontSize: 18 * q * u, color: ink, opacity: 0.55, marginTop: 8 * u}}>{it.handle ?? '@creator'}</div>
        <div style={{display: 'flex', gap: 36 * q * u, marginTop: 26 * q * u}}>
          {(it.stats ?? [0, 0, 0]).slice(0, 3).map((s, j) => (
            <div key={j}>
              <div style={{fontFamily: fonts.serif, fontSize: 44 * q * u, color: ink, lineHeight: 1}}>{fmtBig(s * cnt)}</div>
              <div style={{fontFamily: fonts.mono, fontSize: 12 * q * u, letterSpacing: 2 * u, color: ink, opacity: 0.45, marginTop: 6 * u}}>{(statLabels[j] ?? '').toUpperCase()}</div>
            </div>
          ))}
        </div>
        <div style={{display: 'flex', gap: 14 * u, marginTop: 28 * q * u}}>
          <div style={{padding: `${11 * q * u}px ${24 * q * u}px`, borderRadius: 99, background: 'rgba(255,255,255,0.9)', boxShadow: `inset 0 0 0 ${1.5 * u}px rgba(0,0,0,0.08)`, fontFamily: fonts.sans, fontSize: 17 * q * u, color: ink}}>Save</div>
          <div style={{padding: `${11 * q * u}px ${28 * q * u}px`, borderRadius: 99, background: ink, fontFamily: fonts.sans, fontSize: 17 * q * u, color: '#fff'}}>Open</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const cardHelixGallery = defineMotion<Props>({
  id: 'card-helix-gallery',
  title: 'Card helix gallery',
  category: 'ui',
  description: 'Preview cards float on a rotating 3D ring over a pastel aurora with a giant serif rank text behind; the front card swells and an info panel with counting stats slides in each beat.',
  source: ['analysis/sheets/r3/v5.jpg'],
  useFor: 'Showcasing a top-N list of works, templates or products in a gallery or app promo.',
  durationInFrames: 240,
  defaultProps: {
    items: SAMPLE,
    rankLabel: 'Top 10',
    statLabels: ['Likes', 'Views', 'Saves'],
    holdFrames: 44,
    turnFrames: 26,
    radius: 820,
    cardAspect: 1.3,
    background: '#F4F0FA',
    blobs: ['#B9C6FF', '#FFC1DC', '#D6C4FF', '#FFE2B8', '#BFEFE0'],
    ink: '#2A2440',
    accent: '#6A57D6',
    rankColor: '#E3B6EA',
  },
  propDocs: {
    items: 'cards: title, handle, tag, color, optional src image, stats [a,b,c]',
    rankLabel: 'giant serif text behind the ring',
    statLabels: 'three stat captions',
    holdFrames: 'frames the focused card rests',
    turnFrames: 'frames of each ring turn',
    radius: 'ring radius in u',
    cardAspect: 'card width / height',
    background: 'base colour',
    blobs: 'aurora blob colours',
    ink: 'text colour',
    accent: 'tag / index colour',
    rankColor: 'colour of the giant rank text',
  },
  component: CardHelixGallery,
  tags: ['gallery', 'carousel', '3d', 'ranking', 'pastel'],
});
