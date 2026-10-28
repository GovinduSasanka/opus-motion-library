// Adapted from lemo-opuscar/styles/news-package/demo/main.js (strap, cornerTag, credit) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {NEWS, NewsStudioBg, eio, eo, estW, fitW, lbf, seg} from '../../core/r2-lb1-kit';

/**
 * Broadcast lower third that holds for the whole programme: a lemon category tab on a paper strap with a lemon
 * left bar, an ink headline + one caps sub-line in olive, an ink end block carrying the channel name, an offset drop
 * shadow and a right-aligned mono source line. Content changes flip vertically (new words up from below, old up and
 * out, 0.32 s) and the tab flashes white on a category change. Optional ILLUSTRATION corner tag.
 */

type Item = {at: number; tab: string; tab2?: string; headline: string; sub: string; source?: string; tag?: string};
type Props = {
  items: Item[];
  channel: string;
  accent: string;
  paper: string;
  ink: string;
  olive: string;
  gold: string;
  inAt: number;
  outAt: number;
  changeMode: 'flip' | 'cut';
  backdrop: 'studio' | 'none';
  background: string;
  disclaimer: string;
};

const NewsStrap: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames} = useStage();
  const id = 'news-strap';
  const items = [...p.items].sort((a, b) => a.at - b.at);
  let cur = 0;
  items.forEach((it, i) => {
    if (frame >= it.at) cur = i;
  });
  const it = items[cur] ?? {at: 0, tab: '', headline: '', sub: ''};
  const prev = cur > 0 ? items[cur - 1] : null;
  const flipF = 10;
  const pf = prev && p.changeMode === 'flip' ? eio(seg(frame, it.at, it.at + flipF)) : 1;
  // geometry (1080-ref units, scaled)
  const mX = (portrait ? 40 : 96) * u;
  const SH = 104 * u;
  const endW = 120 * u;
  const SW = Math.min(1250 * u, w - 2 * mX);
  const sY = portrait ? h - 300 * u : h - 72 * u - SH;
  const tabH = 48 * u;
  const tabY = sY - tabH;
  // in / out
  const out = p.outAt > 0 ? p.outAt : durationInFrames + 100;
  const inK = eo(seg(frame, p.inAt, p.inAt + 9)) * (1 - eio(seg(frame, out, out + 9)));
  const tabK = eo(seg(frame, p.inAt + 5, p.inAt + 13)) * (1 - eio(seg(frame, out - 4, out + 4)));
  const textX = mX + 14 * u + 26 * u;
  const textW = SW - 14 * u - endW - 52 * u;
  const hlSize = (it2: Item) => fitW(it2.headline, 50 * u, textW, 'barlow');
  const subSize = (it2: Item) => fitW(it2.sub.toUpperCase(), 27 * u, textW, 'barlow', 0.04);
  const tabText = (it2: Item) => (it2.tab2 ? `${it2.tab.toUpperCase()}  ${it2.tab2}` : it2.tab.toUpperCase());
  const tabFs = 28 * u;
  const tabW = (t: Item) => Math.min(SW * 0.6, estW(tabText(t), tabFs, 'barlow', 0.06) + 40 * u);
  const tw0 = prev ? tabW(prev) : tabW(it);
  const tW = tw0 + (tabW(it) - tw0) * pf;
  const flash = prev && prev.tab !== it.tab ? Math.max(0, 1 - Math.abs(frame - it.at - 3) / 4) : 0;
  const block = (it2: Item, dy: number, op: number) => (
    <g transform={`translate(0 ${dy})`} opacity={op}>
      <text x={textX} y={sY + SH * 0.5} fontFamily={lbf('barlow')} fontWeight={800} fontSize={hlSize(it2)} fill={p.ink}>
        {it2.headline}
      </text>
      <text x={textX} y={sY + SH * 0.83} fontFamily={lbf('barlow')} fontWeight={600} fontSize={subSize(it2)} letterSpacing="0.04em" fill={p.olive}>
        {it2.sub.toUpperCase()}
      </text>
    </g>
  );
  const srcBlock = (it2: Item, dy: number) =>
    it2.source ? (
      <g transform={`translate(0 ${dy})`}>
        <text
          x={portrait ? mX + SW : w - 84 * u}
          y={portrait ? sY + SH + 44 * u : sY + 46 * u}
          textAnchor="end"
          fontFamily={lbf('plex')}
          fontWeight={500}
          fontSize={15 * u}
          letterSpacing="0.12em"
          fill={p.paper}
          opacity={0.75}
        >
          {it2.source.toUpperCase()}
        </text>
      </g>
    ) : null;
  const showSrcRight = !portrait && w - 84 * u - (mX + SW) > 220 * u;
  const tag = it.tag;
  const tagK = tag ? eo(seg(frame, Math.max(p.inAt, it.at), Math.max(p.inAt, it.at) + 6)) : 0;
  return (
    <AbsoluteFill style={{background: p.backdrop === 'studio' ? p.ink : p.background, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {p.backdrop === 'studio' && <NewsStudioBg id={id} frame={frame} w={w} h={h} u={u} ink={p.ink} accent={p.accent} paper={p.paper} />}
        <defs>
          <clipPath id={`${id}-in`}>
            <rect x={mX - 20 * u} y={tabY - 20 * u} width={(SW + 40 * u) * inK} height={SH + tabH + 60 * u} />
          </clipPath>
          <clipPath id={`${id}-txt`}>
            <rect x={textX - 4 * u} y={sY + 6 * u} width={textW + 8 * u} height={SH - 10 * u} />
          </clipPath>
          <clipPath id={`${id}-tab`}>
            <rect x={mX} y={tabY - 2 * u} width={SW} height={tabH + 2 * u} />
          </clipPath>
          <clipPath id={`${id}-src`}>
            <rect x={0} y={portrait ? sY + SH + 18 * u : sY + 18 * u} width={w} height={40 * u} />
          </clipPath>
        </defs>
        {/* tab (pushes up out of the strap) */}
        <g clipPath={`url(#${id}-tab)`}>
          <g transform={`translate(0 ${(1 - tabK) * tabH})`}>
            <rect x={mX} y={tabY} width={tW} height={tabH} fill={p.accent} />
            <rect x={mX} y={tabY} width={tW} height={tabH} fill="#FFFFFF" opacity={flash * 0.9} />
            <g clipPath={`url(#${id}-tab)`}>
              {prev && pf < 1 && (
                <text x={mX + 20 * u} y={tabY + tabH * 0.7 - pf * tabH} fontFamily={lbf('barlow')} fontWeight={800} fontSize={tabFs} letterSpacing="0.06em" fill={p.ink}>
                  {tabText(prev)}
                </text>
              )}
              <text x={mX + 20 * u} y={tabY + tabH * 0.7 + (1 - pf) * tabH} fontFamily={lbf('barlow')} fontWeight={800} fontSize={tabFs} letterSpacing="0.06em" fill={p.ink}>
                {tabText(it)}
              </text>
            </g>
          </g>
        </g>
        {/* strap */}
        <g clipPath={`url(#${id}-in)`}>
          <rect x={mX + 8 * u} y={sY + 8 * u} width={SW} height={SH} fill="#000" opacity={0.3} />
          <rect x={mX} y={sY} width={SW} height={SH} fill={p.paper} />
          <rect x={mX} y={sY} width={14 * u} height={SH} fill={p.accent} />
          <rect x={mX + SW - endW} y={sY} width={endW} height={SH} fill={p.ink} />
          <rect x={mX + SW - endW} y={sY} width={endW} height={6 * u} fill={p.accent} />
          <text
            x={mX + SW - endW / 2}
            y={sY + SH * 0.64}
            textAnchor="middle"
            fontFamily={lbf('barlow')}
            fontWeight={800}
            fontSize={fitW(p.channel.toUpperCase(), 34 * u, endW * 0.82, 'barlow', 0.04)}
            letterSpacing="0.04em"
            fill={p.accent}
          >
            {p.channel.toUpperCase()}
          </text>
          <g clipPath={`url(#${id}-txt)`}>
            {prev && pf < 1 && block(prev, -pf * SH, 1)}
            {block(it, (1 - pf) * SH, 1)}
          </g>
        </g>
        {(showSrcRight || portrait) && inK > 0.6 && (
          <g clipPath={`url(#${id}-src)`}>
            {prev && pf < 1 && srcBlock(prev, -pf * 40 * u)}
            {srcBlock(it, (1 - pf) * 40 * u)}
          </g>
        )}
        {tag && tagK > 0 && (
          <g transform={`translate(${mX} ${56 * u}) scale(1 ${tagK})`}>
            <rect width={330 * u} height={64 * u} fill={p.ink} opacity={0.82} />
            <rect width={8 * u} height={64 * u} fill={p.gold} />
            <text x={26 * u} y={28 * u} fontFamily={lbf('plex')} fontWeight={600} fontSize={17 * u} letterSpacing="0.2em" fill={p.gold}>
              {tag.toUpperCase()}
            </text>
            <text x={26 * u} y={50 * u} fontFamily={lbf('plex')} fontWeight={500} fontSize={13 * u} letterSpacing="0.08em" fill="#FFFFFF" opacity={0.8}>
              {p.disclaimer}
            </text>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

export const newsStrap = defineMotion<Props>({
  id: 'news-strap',
  title: 'News strap (broadcast lower third)',
  category: 'text',
  description:
    'Persistent broadcast lower third: lemon category tab on a paper strap with a lemon left bar, ink headline + olive caps sub-line, ink end block with the channel name, offset drop shadow and a mono source line; content changes flip vertically and the tab flashes on a new category. Overlay-capable (backdrop "none").',
  source: ['lemo-opuscar styles/news-package (MIT code, CC BY 4.0 docs, LemoLab) — demo/main.js strap/cornerTag/credit'],
  useFor: 'News / market / update videos, podcast name straps (PROFILE tab), changelog bulletins — one strap that holds the headline for the whole programme.',
  durationInFrames: 240,
  defaultProps: {
    items: [
      {at: 0, tab: 'Markets', headline: 'Northwind shares climb 4.2% after earnings', sub: 'Second-quarter results beat forecasts', source: 'Source · Northwind investor relations'},
      {at: 100, tab: 'Tech', headline: 'Lumen opens its first research lab', sub: 'New site will hire 300 engineers', source: 'Source · Lumen press office'},
      {at: 170, tab: 'Profile', headline: 'Ada Moreno', sub: 'Chief economist, Northwind Bank', source: 'Interview · 14 March'},
    ],
    channel: 'Lumen',
    accent: NEWS.accent,
    paper: NEWS.paper,
    ink: NEWS.ink,
    olive: NEWS.olive,
    gold: NEWS.gold,
    inAt: 6,
    outAt: 0,
    changeMode: 'flip',
    backdrop: 'studio',
    background: 'transparent',
    disclaimer: 'NOT ACTUAL FOOTAGE',
  },
  propDocs: {
    items: 'strap states [{at (frame), tab, tab2?, headline, sub, source?, tag?}] — tag shows the top-left ILLUSTRATION-style corner tag',
    channel: 'channel name in the end block',
    accent: 'lemon accent (tab, bars, channel name)',
    paper: 'strap paper colour',
    ink: 'ink / end block colour',
    olive: 'sub-line colour',
    gold: 'corner-tag accent',
    inAt: 'frame the strap wipes in',
    outAt: 'frame it wipes out (0 = never; straps hold for the programme)',
    changeMode: '"flip" (vertical flip) or "cut"',
    backdrop: '"studio" (ink studio with glow, fins and dot grid) or "none" (overlay)',
    background: 'background when backdrop is "none" (default transparent)',
    disclaimer: 'small caps disclaimer under the strap',
  },
  component: NewsStrap,
  tags: ['lower third', 'news', 'strap', 'broadcast', 'headline', 'name strap', 'chyron', 'bulletin', 'overlay', 'flip', 'category tab', 'source line'],
});
