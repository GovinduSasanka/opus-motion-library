// Adapted from lemo-opuscar/styles/caption-news/demo/main.js bug() / sourceTag() / credit() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {Plate} from '../../core/image-kit';
import {eo3, lf, seg} from '../../core/r2-la1-kit';
import {useStage} from '../../core/stage';
import {estWidth} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Attribution overlay: top-left channel bug (accent square + channel name + topic), a "SOURCE · publisher ·
 * date" chip that slides in under it when a figure appears, and a small "Video: author · licence" credit chip
 * top-right. Overlay-capable: set backdrop to "transparent".
 */
type Props = {
  channel: string;
  topic: string;
  source: string;
  credit: string;
  accent: string;
  sourceAt: number;
  sourceOutAt: number;
  backdrop: string;
};

const NewsBug: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const H = h * 0.043 * (portrait ? 0.62 : 1);
  const bx = w * 0.05;
  const by = h * (portrait ? 0.045 : 0.048);
  const bugIn = eo3(seg(frame, 2, 10));
  const srcK = eo3(seg(frame, p.sourceAt, p.sourceAt + 6)) * (1 - eo3(seg(frame, p.sourceOutAt, p.sourceOutAt + 6)));
  const credIn = eo3(seg(frame, 8, 16));
  const fs = H * 0.5;
  const tagH = H * 0.78;
  const chW = estWidth(p.channel.toUpperCase(), fs, 'sans', 0.06) + 20 * u;
  return (
    <AbsoluteFill style={{background: p.backdrop === 'footage' ? '#0E0E0C' : p.backdrop}}>
      {p.backdrop === 'footage' && (
        <AbsoluteFill style={{filter: 'contrast(1.07) saturate(0.92) brightness(0.98)', transform: `scale(${1 + frame * 0.0003})`}}>
          <Plate seed={9} palette="dusk" />
          <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(14,14,12,0.55) 0%, rgba(14,14,12,0) 18%)'}} />
        </AbsoluteFill>
      )}
      {/* channel bug */}
      <div style={{position: 'absolute', left: bx, top: by, height: H, display: 'flex', alignItems: 'center', opacity: bugIn, transform: `translateX(${(1 - bugIn) * -20 * u}px)`}}>
        <div style={{width: H, height: H, background: p.accent, marginRight: H * 0.3}} />
        <div style={{fontFamily: lf.sans, fontWeight: 800, fontSize: fs * 1.1, color: '#F7F5EF', letterSpacing: fs * 0.06, textShadow: '0 1px 6px rgba(0,0,0,0.45)', whiteSpace: 'nowrap', width: chW}}>{p.channel.toUpperCase()}</div>
        <div style={{width: 2 * u, height: H * 0.6, background: 'rgba(247,245,239,0.5)', margin: `0 ${H * 0.35}px`}} />
        <div style={{fontFamily: lf.sans, fontWeight: 600, fontSize: fs, color: '#F7F5EF', opacity: 0.9, whiteSpace: 'nowrap', textShadow: '0 1px 6px rgba(0,0,0,0.45)'}}>{p.topic}</div>
      </div>
      {/* source tag */}
      {srcK > 0 && (
        <div
          style={{
            position: 'absolute',
            left: bx,
            top: by + H + 14 * u,
            height: tagH,
            display: 'flex',
            alignItems: 'center',
            opacity: clamp(srcK * 1.5),
            transform: `translateX(${(1 - srcK) * -40 * u}px)`,
            background: 'rgba(14,14,12,0.72)',
            paddingRight: 14 * u,
          }}
        >
          <div style={{height: '100%', padding: `0 ${10 * u}px`, display: 'flex', alignItems: 'center', background: p.accent, color: '#0E0E0C', fontFamily: lf.sans, fontWeight: 800, fontSize: tagH * 0.46, letterSpacing: 2 * u}}>SOURCE</div>
          <div style={{marginLeft: 12 * u, fontFamily: lf.sans, fontWeight: 600, fontSize: tagH * 0.46, color: '#F7F5EF', whiteSpace: 'nowrap'}}>{p.source}</div>
        </div>
      )}
      {/* credit chip */}
      {p.credit && (
        <div
          style={{
            position: 'absolute',
            right: w * 0.04,
            top: by,
            opacity: credIn,
            background: 'rgba(0,0,0,0.5)',
            color: '#F7F5EF',
            fontFamily: lf.sans,
            fontSize: (portrait ? 22 : 19) * u,
            padding: `${5 * u}px ${10 * u}px`,
            whiteSpace: 'nowrap',
          }}
        >
          {p.credit}
        </div>
      )}
      <AbsoluteFill style={{pointerEvents: 'none', opacity: prog(frame, 0, 1, ease.linear) * 0}} />
    </AbsoluteFill>
  );
};

export const newsBugSourceTag = defineMotion<Props>({
  id: 'news-bug-source-tag',
  title: 'News bug + source tag',
  category: 'hud',
  description:
    'Attribution overlay: a top-left channel bug (accent square, channel, topic), a "SOURCE · publisher · date" chip that slides in under it while a figure is on screen, and a small "Video: author · licence" credit chip top-right. Set backdrop to "transparent" to layer it over any motion.',
  source: ['lemo-opuscar styles/caption-news demo/main.js bug(), sourceTag(), credit() (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §8 news-bug-source-tag'],
  useFor: 'Attribution agents can always attach — data sources, CC BY credits, channel branding — over news, explainer and documentary shots.',
  durationInFrames: 120,
  defaultProps: {
    channel: 'Northwind News',
    topic: 'Housing',
    source: 'Regional Statistics Office · 14 Mar 2026',
    credit: 'Video: A. Moreno · CC BY 4.0',
    accent: '#FFC21A',
    sourceAt: 24,
    sourceOutAt: 104,
    backdrop: 'footage',
  },
  propDocs: {
    channel: 'channel name in the bug',
    topic: 'topic after the divider',
    source: 'publisher · date shown in the SOURCE chip',
    credit: 'credit chip text top-right (empty = none)',
    accent: 'bug square + SOURCE block colour',
    sourceAt: 'frame the source chip slides in (0.2 s)',
    sourceOutAt: 'frame it slides out',
    backdrop: '"footage" = procedural preview plate, "transparent" = overlay, or any CSS colour',
  },
  component: NewsBug,
  tags: ['overlay', 'news', 'bug', 'source', 'credit', 'attribution', 'lower third', 'channel', 'cc by', 'citation', 'broadcast', 'hud', 'compliance'],
});
