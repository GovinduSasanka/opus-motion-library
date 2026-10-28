import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {bgOf, onColor} from '../../core/commerce-kit';
import {fonts} from '../../core/fonts';
import {backOut, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {Photo} from '../../core/travel-food-kit';
import {defineMotion} from '../../core/types';

/**
 * Day-by-day trip itinerary: a dotted route draws across the frame, a traveller marker rides it and each stop pops in as a
 * photo circle (your `src`, or a procedural scene) with a day badge, place name and short note.
 */
type Stop = {label: string; day: string; note: string; src?: string};
type Props = {
  title: string;
  subtitle: string;
  stops: Stop[];
  travelFrames: number;
  background: string;
  ink: string;
  accent: string;
  routeColor: string;
  startAt: number;
};

type Pt = [number, number];

const catmull = (pts: Pt[], per: number) => {
  const out: Pt[] = [];
  const P = (i: number) => pts[Math.min(pts.length - 1, Math.max(0, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = P(i - 1);
    const p1 = P(i);
    const p2 = P(i + 1);
    const p3 = P(i + 2);
    for (let s = 0; s < per; s++) {
      const q = s / per;
      const q2 = q * q;
      const q3 = q2 * q;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * q + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * q2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * q3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * q + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * q2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * q3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

const ItineraryRouteStops: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame - p.startAt;
  const stops = p.stops.length >= 2 ? p.stops.slice(0, 8) : [{label: 'Start', day: 'Day 1', note: ''}, {label: 'Finish', day: 'Day 2', note: ''}];
  const n = stops.length;
  const onAcc = onColor(p.accent);

  // layout
  const pts: Pt[] = [];
  let R: number;
  if (portrait) {
    const y0 = h * 0.24;
    const y1 = h * 0.9;
    const sp = (y1 - y0) / (n - 1);
    R = Math.min(118 * u, sp * 0.38);
    for (let i = 0; i < n; i++) pts.push([w * (i % 2 ? 0.7 : 0.3), y0 + sp * i]);
  } else {
    const x0 = w * 0.11;
    const x1 = w * 0.89;
    const sp = (x1 - x0) / (n - 1);
    R = Math.min(132 * u, sp * 0.4);
    const amp = h * (w / h > 1.5 ? 0.145 : 0.2);
    for (let i = 0; i < n; i++) pts.push([x0 + sp * i, h * 0.575 + (i % 2 ? amp : -amp)]);
  }
  const PER = 24;
  const poly = catmull(pts, PER);
  const cum = [0];
  for (let i = 1; i < poly.length; i++) cum.push(cum[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  const total = cum[cum.length - 1];
  const stopFrac = (i: number) => cum[Math.min(cum.length - 1, i * PER)] / total;
  const pointAt = (d: number): Pt => {
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < d) lo = mid;
      else hi = mid;
    }
    const seg = Math.max(1e-6, cum[hi] - cum[lo]);
    const q = Math.min(1, Math.max(0, (d - cum[lo]) / seg));
    return [poly[lo][0] + (poly[hi][0] - poly[lo][0]) * q, poly[lo][1] + (poly[hi][1] - poly[lo][1]) * q];
  };

  // timing
  const travel = Math.max(40, p.travelFrames);
  const t0 = 26;
  const move = prog(t, t0, t0 + travel, ease.sine);
  const headD = move * total;
  const reachF = (i: number) => {
    // frame when the marker reaches stop i (invert the sine ease numerically)
    const target = stopFrac(i);
    if (i === 0) return 14;
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 14; k++) {
      const mid = (lo + hi) / 2;
      if (ease.sine(mid) < target) lo = mid;
      else hi = mid;
    }
    return t0 + lo * travel;
  };

  // dotted route
  const dots: React.ReactNode[] = [];
  const gap = 22 * u;
  const nDots = Math.floor(headD / gap);
  for (let k = 0; k <= nDots; k++) {
    const q = pointAt(k * gap);
    dots.push(<circle key={k} cx={q[0]} cy={q[1]} r={4.2 * u} fill={p.routeColor} />);
  }
  const head = pointAt(headD);
  const titleIn = ease.out(sseg(t, 0, 20));

  // faint map grid
  const grid: React.ReactNode[] = [];
  const gs = 120 * u;
  for (let x = gs / 2; x < w; x += gs) grid.push(<line key={'gx' + x} x1={x} y1={0} x2={x} y2={h} stroke={withAlpha(p.ink, 0.05)} strokeWidth={2 * u} />);
  for (let y = gs / 2; y < h; y += gs) grid.push(<line key={'gy' + y} x1={0} y1={y} x2={w} y2={y} stroke={withAlpha(p.ink, 0.05)} strokeWidth={2 * u} />);

  return (
    <AbsoluteFill style={{background: bgOf(p.background), fontFamily: fonts.sans, color: p.ink, overflow: 'hidden'}}>
      <Svg>
        {grid}
        {dots}
        {move > 0 && move < 1 ? (
          <g transform={`translate(${head[0]} ${head[1]})`}>
            <circle r={20 * u} fill={withAlpha(p.accent, 0.22)} />
            <circle r={11 * u} fill={p.accent} stroke={mixHex(p.background === 'transparent' ? '#ffffff' : p.background, '#ffffff', 0.3)} strokeWidth={4 * u} />
          </g>
        ) : null}
      </Svg>

      {/* title */}
      <div style={{position: 'absolute', left: 0, right: 0, top: h * (portrait ? 0.05 : 0.045), textAlign: 'center', opacity: titleIn, transform: `translateY(${(1 - titleIn) * -24 * u}px)`}}>
        <div style={{fontFamily: fonts.display, fontSize: (portrait ? 70 : 64) * u, lineHeight: 1.05}}>{p.title}</div>
        <div style={{fontFamily: fonts.mono, fontSize: 24 * u, letterSpacing: 5 * u, color: withAlpha(p.ink, 0.55), marginTop: 12 * u, textTransform: 'uppercase'}}>{p.subtitle}</div>
      </div>

      {/* stops */}
      {stops.map((s, i) => {
        const tr = reachF(i);
        const pop = backOut(sseg(t, tr - 4, tr + 12), 1.9);
        const show = sseg(t, tr - 4, tr + 6);
        const [x, y] = pts[i];
        const above = !portrait && y < h * 0.575;
        const left = portrait && i % 2 === 1;
        const zoom = 1.04 + 0.08 * sseg(t, tr, tr + 80);
        const labW = portrait ? (left ? x - R - 30 * u - w * 0.04 : w - (x + R + 30 * u) - w * 0.04) : Math.min(w * 0.22, 360 * u);
        const fsName = (portrait ? 40 : 34) * u;
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: x - R, top: y - R, width: R * 2, height: R * 2, transform: `scale(${pop})`, opacity: show}}>
              <div style={{position: 'absolute', inset: -8 * u, borderRadius: '50%', background: '#FFFFFF', boxShadow: `0 ${14 * u}px ${34 * u}px ${withAlpha(p.ink, 0.22)}`}} />
              <Photo w={R * 2} h={R * 2} radius="50%" src={s.src} kind={i} seed={i} zoom={zoom} idKey={`itin${i}`} />
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: -16 * u,
                  transform: 'translateX(-50%)',
                  background: p.accent,
                  color: onAcc,
                  fontFamily: fonts.mono,
                  fontWeight: 700,
                  fontSize: 20 * u,
                  letterSpacing: 2 * u,
                  padding: `${5 * u}px ${16 * u}px`,
                  borderRadius: 999,
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                  boxShadow: `0 ${4 * u}px ${12 * u}px ${withAlpha(p.accent, 0.4)}`,
                }}
              >
                {s.day}
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                width: labW,
                left: portrait ? (left ? x - R - 30 * u - labW : x + R + 30 * u) : x - labW / 2,
                top: portrait ? y - 56 * u : above ? undefined : y + R + 36 * u,
                bottom: !portrait && above ? h - (y - R - 30 * u) : undefined,
                textAlign: portrait ? (left ? 'right' : 'left') : 'center',
                opacity: sseg(t, tr + 2, tr + 14),
                transform: `translateY(${(1 - sseg(t, tr + 2, tr + 16)) * 14 * u}px)`,
              }}
            >
              <div style={{fontWeight: 800, fontSize: fsName, lineHeight: 1.1}}>{s.label}</div>
              <div style={{fontSize: (portrait ? 27 : 24) * u, lineHeight: 1.3, color: withAlpha(p.ink, 0.62), marginTop: 6 * u}}>{s.note}</div>
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

export const itineraryRouteStops = defineMotion<Props>({
  id: 'itinerary-route-stops',
  title: 'Itinerary route with photo stops',
  category: 'ui',
  description:
    'A dotted route draws across the frame while a marker travels it; each stop pops into a photo circle with a day badge, place name and note — day-by-day trip plans.',
  source: ['original (round 3)'],
  useFor: 'Trip itineraries, tour and holiday packages, road-trip recaps, day-by-day plans, customer-journey stops — set stops (label, day, note, photo src).',
  durationInFrames: 240,
  defaultProps: {
    title: 'Five days, five stops',
    subtitle: 'Your trip at a glance',
    stops: [
      {label: 'Harbour Town', day: 'Day 1', note: 'Arrive, sunset walk on the pier'},
      {label: 'Old Quarter', day: 'Day 2', note: 'Markets and street food tour'},
      {label: 'Mountain Pass', day: 'Day 3', note: 'Scenic drive and a long hike'},
      {label: 'Lakeside', day: 'Day 4', note: 'Boat ride and a slow lunch'},
      {label: 'Capital City', day: 'Day 5', note: 'Museums, then the night train'},
    ],
    travelFrames: 150,
    background: '#F4EFE6',
    ink: '#1D2B36',
    accent: '#E2552D',
    routeColor: '#1D2B36',
    startAt: 0,
  },
  propDocs: {
    title: 'headline',
    subtitle: 'small caps line under the headline',
    stops: 'stops in order, 2-8: {label, day, note, src?} — src is a public/ path or https URL for the photo (procedural scene if omitted)',
    travelFrames: 'frames the marker takes to ride the whole route',
    background: "page colour or 'transparent'",
    ink: 'text colour',
    accent: 'marker and day-badge colour',
    routeColor: 'colour of the dotted route',
    startAt: 'frame the scene starts',
  },
  component: ItineraryRouteStops,
  tags: ['itinerary', 'travel', 'trip', 'route', 'stops', 'journey', 'tour', 'holiday', 'vacation', 'map', 'days', 'plan', 'photos', 'ui'],
});
