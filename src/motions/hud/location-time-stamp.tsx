import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {NewsBackdrop, clock, cursorOn, eio3, eo3, estWidth, fitSize, lf, on, parseClock, seg, typed} from '../../core/r3-news-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Lower-left location / date / time chyron. An accent bar grows up, the place strip opens and the place name types
 * on with a block cursor, then a dark strip types region | date | time (optionally a running clock).
 * Overlay-capable: backdrop "transparent".
 */
type Props = {
  place: string;
  region: string;
  date: string;
  time: string;
  timezone: string;
  tag: string;
  ticking: boolean;
  typeSpeed: number;
  startAt: number;
  outAt: number;
  accent: string;
  placeColor: string;
  placeInk: string;
  subColor: string;
  subInk: string;
  backdrop: string;
  align: string;
};

const LocationTime: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = frame - p.startAt;
  const right = p.align === 'right';

  const place = (p.place || '').toUpperCase();
  const hA = 84 * u;
  const hB = 54 * u;
  const barW = 12 * u;
  const maxW = w * (portrait ? 0.86 : 0.7);
  const fsA = fitSize(place, hA * 0.56, maxW - 60 * u, 'sans', 0.03);
  const fsB = hB * 0.52;
  const fsC = hA * 0.3;

  // running clock
  const baseSec = parseClock(p.time);
  const hasSecs = /^\d{1,2}:\d{2}:\d{2}/.test((p.time || '').trim());
  const tick = p.ticking ? Math.max(0, f) / 30 : 0;
  const timeStr = on(p.time) ? clock(baseSec + tick, p.ticking || hasSecs) : '';
  const timePart = [timeStr, (p.timezone || '').toUpperCase()].filter(Boolean).join(' ');

  const segs = [
    {text: (p.region || '').toUpperCase(), font: lf.sans, wgt: 700, color: p.subInk},
    {text: (p.date || '').toUpperCase(), font: lf.sans, wgt: 600, color: p.subInk},
    {text: timePart, font: lf.plex, wgt: 700, color: p.accent},
  ].filter((s) => s.text.length);
  const sepW = 28 * u;
  const widths = segs.map((s) => estWidth(s.text.replace(/\d/g, '0'), fsB, s.font === lf.plex ? 'plex' : 'sans', s.font === lf.plex ? 0 : 0.04));
  const subW = widths.reduce((a, b) => a + b, 0) + sepW * Math.max(0, segs.length - 1) + 40 * u;
  const aW = estWidth(place, fsA, 'sans', 0.03) + 60 * u;

  // ---- timeline
  const barK = eo3(seg(f, 0, 10));
  const aK = eio3(seg(f, 6, 22));
  const bK = eio3(seg(f, 20, 34));
  const cps = Math.max(4, p.typeSpeed);
  const aN = typed(f, 14, cps);
  const aDone = aN >= place.length;
  const typingA = f >= 14 && !aDone;
  const subStart = 14 + Math.ceil((place.length * 30) / cps) + 4;
  const totalSub = segs.reduce((a, s) => a + s.text.length, 0);
  const bN = typed(f, Math.max(subStart, 24), cps * 1.25);
  const typingB = f >= subStart && bN < totalSub;
  const tagK = eo3(seg(f, 30, 44));
  const out = eio3(seg(f, p.outAt, p.outAt + 14));

  const stackW = Math.max(aW, subW);
  const x0 = right ? w - w * (portrait ? 0.06 : 0.05) - stackW - barW : w * (portrait ? 0.06 : 0.05);
  const bottom = h * (portrait ? 0.17 : 0.12);
  const totalH = hA + hB;
  const slide = out * (right ? 1 : -1) * (stackW * 0.25);

  let consumed = 0;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <NewsBackdrop backdrop={p.backdrop} seed={21} palette="dawn" />
      {f >= 0 && (
        <div style={{position: 'absolute', left: x0, bottom, height: totalH, width: stackW + barW, opacity: 1 - out, transform: `translateX(${slide}px)`}}>
          {/* tag chip above */}
          {on(p.tag) && (
            <div style={{position: 'absolute', left: barW, bottom: totalH + 10 * u, opacity: tagK, transform: `translateY(${(1 - tagK) * 10 * u}px)`, display: 'flex', alignItems: 'center', gap: 8 * u, background: p.accent, color: '#0E1116', fontFamily: lf.sans, fontWeight: 800, fontSize: fsC, letterSpacing: fsC * 0.14, padding: `${fsC * 0.28}px ${fsC * 0.7}px`}}>
              <div style={{width: fsC * 0.42, height: fsC * 0.42, borderRadius: '50%', background: '#0E1116', opacity: 0.55 + 0.45 * Math.abs(Math.sin(f * 0.12))}} />
              {p.tag.toUpperCase()}
            </div>
          )}
          {/* accent bar */}
          <div style={{position: 'absolute', left: 0, bottom: 0, width: barW, height: totalH * barK, background: p.accent}} />
          {/* place strip */}
          <div style={{position: 'absolute', left: barW, bottom: hB, width: aW * aK, height: hA, background: p.placeColor, overflow: 'hidden', boxShadow: `0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.35)`}}>
            <div style={{position: 'absolute', left: 30 * u, top: 0, height: '100%', display: 'flex', alignItems: 'center', fontFamily: lf.sans, fontWeight: 800, fontSize: fsA, letterSpacing: fsA * 0.03, color: p.placeInk, whiteSpace: 'nowrap'}}>
              {place.slice(0, aN)}
              {cursorOn(f, typingA, 1.6) && f >= 14 && !aDone && <span style={{display: 'inline-block', width: fsA * 0.34, height: fsA * 0.78, marginLeft: fsA * 0.06, background: p.accent}} />}
            </div>
          </div>
          {/* sub strip */}
          <div style={{position: 'absolute', left: barW, bottom: 0, width: subW * bK, height: hB, background: p.subColor, overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: 20 * u, top: 0, height: '100%', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap'}}>
              {segs.map((s, i) => {
                const startIdx = consumed;
                consumed += s.text.length;
                const n = clamp(bN - startIdx, 0, s.text.length);
                const shown = s.text.slice(0, n);
                const isLastTyping = typingB && n > 0 && n < s.text.length;
                return (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{display: 'inline-block', width: sepW, textAlign: 'center', color: p.subInk, opacity: n > 0 ? 0.45 : 0, fontSize: fsB, fontFamily: lf.sans}}>|</span>}
                    <span style={{fontFamily: s.font, fontWeight: s.wgt, fontSize: fsB, letterSpacing: s.font === lf.plex ? 0 : fsB * 0.04, color: s.color}}>
                      {shown}
                      {isLastTyping && <span style={{display: 'inline-block', width: fsB * 0.3, height: fsB * 0.8, marginLeft: 2 * u, background: p.accent, verticalAlign: 'middle'}} />}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const locationTimeStamp = defineMotion<Props>({
  id: 'location-time-stamp',
  title: 'Location + time chyron',
  category: 'hud',
  description:
    'A lower-left location chyron: an accent bar grows, the place strip opens and the place name types on with a block cursor, then a dark strip types region | date | time with an optional running clock and a LIVE / FILE tag chip above. Set backdrop to "transparent" to lay it over footage.',
  source: ['library original (news location-and-time chyron pattern)'],
  useFor: 'Establishing where and when a shot was filmed: news reports, documentaries, travel and true-crime videos, field recordings, dated archive clips.',
  durationInFrames: 150,
  defaultProps: {
    place: 'Harbour District',
    region: 'Northwind',
    date: '14 March 2026',
    time: '09:41',
    timezone: 'Local',
    tag: 'Live',
    ticking: true,
    typeSpeed: 24,
    startAt: 0,
    outAt: 134,
    accent: '#F2B705',
    placeColor: '#F4F1E8',
    placeInk: '#101318',
    subColor: '#0F1218',
    subInk: '#F6F4EC',
    backdrop: 'footage',
    align: 'left',
  },
  propDocs: {
    place: 'place name (types on)',
    region: 'city / region / country shown first on the dark strip (empty = skip)',
    date: 'date text',
    time: 'clock time "HH:MM" or "HH:MM:SS" (empty = none)',
    timezone: 'short zone label after the time (e.g. "GMT", "local"; empty = none)',
    tag: 'chip above the strip, e.g. "Live", "File footage", "Recorded" (empty = none)',
    ticking: 'run the clock forward in real time (shows seconds)',
    typeSpeed: 'characters per second for the place name',
    startAt: 'frame the chyron starts',
    outAt: 'frame the chyron slides out',
    accent: 'bar, cursor, tag and time colour',
    placeColor: 'place strip fill',
    placeInk: 'place text colour',
    subColor: 'date/time strip fill',
    subInk: 'date/time text colour',
    backdrop: '"footage" = procedural plate, "transparent" = overlay, or any CSS colour',
    align: '"left" or "right" corner',
  },
  component: LocationTime,
  tags: ['overlay', 'chyron', 'location', 'lower third', 'time', 'date', 'clock', 'place', 'news', 'documentary', 'establishing', 'typewriter', 'timestamp', 'journalism', 'live'],
});
