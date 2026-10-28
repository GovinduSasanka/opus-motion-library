// Adapted from lemo-opuscar/styles/caption-news/demo/main.js shotHalf() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {Plate, PlatePaletteName} from '../../core/image-kit';
import {backOut, eo3, lf, seg} from '../../core/r2-la1-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Caption-news proportion sweep: a bright accent bar sweeps across live footage to X % of the width;
 * everything it has passed turns grey and dark (grayscale · brightness .26 · contrast 1.1); the percentage
 * slams in on the dark side, then the caption chunk with a keyword block.
 */
type Props = {
  src: string;
  seed: number;
  palette: PlatePaletteName;
  percent: number;
  direction: 'fromRight' | 'fromLeft';
  accent: string;
  label: string;
  caption: string;
  keyword: string;
  sweepAt: number;
  darkFilter: string;
};

const ProportionSweep: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const sw = eo3(seg(frame, p.sweepAt, p.sweepAt + 13)); // 0.42 s
  const pct = clamp(p.percent / 100);
  const fromRight = p.direction === 'fromRight';
  const x = fromRight ? lerp(w, w * (1 - pct), sw) : lerp(0, w * pct, sw);
  const clip = fromRight ? `inset(0 0 0 ${x}px)` : `inset(0 ${w - x}px 0 0)`;
  const push = lerp(1, 1.04, prog(frame, 0, 150, ease.linear));
  const slam = seg(frame, p.sweepAt + 11, p.sweepAt + 15);
  const numScale = lerp(1.3, 1, backOut(slam, 1.6));
  const numOp = clamp(slam * 3);
  const shown = Math.round(p.percent * clamp(seg(frame, p.sweepAt + 11, p.sweepAt + 26) * 1.0));
  const darkW = w * pct;
  const big = Math.min((portrait ? 230 : 200) * u, darkW * 0.42);
  const cx = fromRight ? w - darkW / 2 : darkW / 2;
  const capK = seg(frame, p.sweepAt + 26, p.sweepAt + 30);
  const kwK = eo3(seg(frame, p.sweepAt + 28, p.sweepAt + 32));
  const capSize = (portrait ? 70 : 76) * u;
  const capY = h * (portrait ? 0.86 : 0.878);
  const parts = p.caption.split(p.keyword);

  const footage = (
    <AbsoluteFill style={{transform: `scale(${push})`}}>
      <Plate src={p.src || undefined} seed={p.seed} palette={p.palette} />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{background: '#0E0E0C'}}>
      <AbsoluteFill style={{filter: 'contrast(1.07) saturate(0.92) brightness(0.98)'}}>{footage}</AbsoluteFill>
      <AbsoluteFill style={{background: 'rgba(255,170,70,0.06)', mixBlendMode: 'soft-light'}} />
      {sw > 0 && <AbsoluteFill style={{clipPath: clip, filter: p.darkFilter}}>{footage}</AbsoluteFill>}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(14,14,12,0) 52%, rgba(14,14,12,0.84) 100%)'}} />
      {sw > 0 && sw < 1.01 && <div style={{position: 'absolute', left: x - 4 * u, top: 0, width: 8 * u, height: h, background: p.accent, boxShadow: `0 0 ${24 * u}px ${p.accent}`}} />}
      {sw >= 1 && <div style={{position: 'absolute', left: x - 4 * u, top: 0, width: 8 * u, height: h, background: p.accent}} />}
      {numOp > 0 && (
        <div style={{position: 'absolute', left: cx, top: h * (portrait ? 0.36 : 0.32), transform: `translate(-50%, -50%) scale(${numScale})`, opacity: numOp, textAlign: 'center'}}>
          <div style={{fontFamily: lf.sans, fontWeight: 800, fontSize: big, color: '#F7F5EF', lineHeight: 1, letterSpacing: -0.02 * big, fontVariantNumeric: 'tabular-nums'}}>
            {shown}
            <span style={{fontSize: big * 0.5, color: p.accent}}>%</span>
          </div>
          <div style={{fontFamily: lf.sans, fontWeight: 600, fontSize: (portrait ? 34 : 30) * u, color: '#8D8B83', letterSpacing: 3 * u, marginTop: 12 * u}}>{p.label}</div>
        </div>
      )}
      {capK > 0 && (
        <div style={{position: 'absolute', left: w * 0.0625, right: w * 0.0625, top: capY - capSize, transform: `scale(${lerp(1.3, 1, backOut(capK, 1.6))})`, transformOrigin: 'left center', opacity: clamp(capK * 3), fontFamily: lf.sans, fontWeight: 800, fontSize: capSize, color: '#F7F5EF', lineHeight: 1.05}}>
          {parts[0]}
          {parts.length > 1 && (
            <span style={{position: 'relative', display: 'inline-block', color: '#0E0E0C', padding: `0 ${12 * u}px`}}>
              <span style={{position: 'absolute', left: 0, top: '4%', height: '100%', width: `${kwK * 100}%`, background: p.accent}} />
              <span style={{position: 'relative', color: kwK > 0.5 ? '#0E0E0C' : '#F7F5EF'}}>{p.keyword}</span>
            </span>
          )}
          {parts.slice(1).join(p.keyword)}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const proportionSweep = defineMotion<Props>({
  id: 'proportion-sweep',
  title: 'Proportion sweep',
  category: 'image',
  description:
    'A bright honey bar sweeps across live footage to X % of the width; everything it has passed turns grey and dark, the percentage slams in on the dark side, then a caption chunk lands with its keyword on a yellow block.',
  source: ['lemo-opuscar styles/caption-news demo/main.js shotHalf() (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §8 proportion-sweep'],
  useFor: 'Any "X % of …" statistic over a photo or video — share lost, churn, coverage — instantly readable with the sound off.',
  durationInFrames: 120,
  defaultProps: {
    src: '',
    seed: 6,
    palette: 'dusk',
    percent: 38,
    direction: 'fromRight',
    accent: '#FFC21A',
    label: 'OF HOMES STILL OFFLINE',
    caption: 'Two in five homes are still dark',
    keyword: 'still dark',
    sweepAt: 14,
    darkFilter: 'grayscale(1) brightness(0.26) contrast(1.1)',
  },
  propDocs: {
    src: 'public/ photo (empty = procedural footage plate)',
    seed: 'procedural plate seed',
    palette: 'procedural plate palette',
    percent: 'share of the width that goes dark (0–100)',
    direction: 'fromRight = the bar sweeps in from the right edge, fromLeft = from the left',
    accent: 'bar + keyword block colour (honey)',
    label: 'caps label under the number',
    caption: 'caption line slammed in after the number',
    keyword: 'substring of the caption shown on the accent block',
    sweepAt: 'frame the sweep starts',
    darkFilter: 'CSS filter for the passed side',
  },
  component: ProportionSweep,
  tags: ['percentage', 'statistic', 'proportion', 'sweep', 'news', 'caption', 'social', 'sound off', 'data', 'photo', 'share', 'split', 'documentary'],
});
