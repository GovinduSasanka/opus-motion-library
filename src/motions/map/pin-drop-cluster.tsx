import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {deg} from '../../core/r2-mg2a-kit';
import {GeoView, LandLayer, fitView, lerpView, mapBox, project} from '../../core/r3-geo';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Pt = {lat: number; lon: number; label?: string};
type Props = {
  points: Pt[];
  title: string;
  subtitle: string;
  unit: string;
  clusterSize: number;
  zoom: number;
  pinSize: number;
  speed: number;
  startAt: number;
  background: string;
  land: string;
  landStroke: string;
  ink: string;
  accent: string;
  accent2: string;
  onAccent: string;
  fontFamily: string;
};

type Item = {lon: number; lat: number; count: number; members: number[]};

const DEFAULT_POINTS: Pt[] = [
  {lat: 45.96, lon: -1.14}, {lat: 48.21, lon: 0.89}, {lat: 46.76, lon: -1.21}, {lat: 49.07, lon: -1.29}, {lat: 49.72, lon: 3.67}, {lat: 47.58, lon: 2.46}, {lat: 46.39, lon: 1.25}, {lat: 46.92, lon: -0.49}, {lat: 49.28, lon: 0.09}, {lat: 47.46, lon: 9.38}, {lat: 44.54, lon: 11.79}, {lat: 49.68, lon: 13.31}, {lat: 47, lon: 10.25}, {lat: 45.09, lon: 10.51}, {lat: 45.54, lon: 8.38}, {lat: 45.58, lon: 9.67}, {lat: 44.28, lon: 11.61}, {lat: 55.45, lon: 22.32}, {lat: 52.29, lon: 16.6}, {lat: 52.07, lon: 20}, {lat: 50.45, lon: 23.11}, {lat: 52.17, lon: 19.6}, {lat: 50.19, lon: 19.47}, {lat: 52.33, lon: 15.71}, {lat: 37.01, lon: -3.75}, {lat: 42.37, lon: 0.46}, {lat: 41.81, lon: 0.06}, {lat: 41.44, lon: -3.11}, {lat: 37.26, lon: 29.02}, {lat: 42.72, lon: 26.78}, {lat: 41.9, lon: 30.33}, {lat: 41.38, lon: 23.54},
];

/** greedy clustering in geo space; thr in degrees (cos-corrected) */
const cluster = (pts: Pt[], thr: number): Item[] => {
  const items: Item[] = [];
  pts.forEach((p, i) => {
    const cs = Math.cos(p.lat * deg);
    let hit: Item | null = null;
    if (thr > 0) {
      for (const it of items) {
        const dx = (it.lon - p.lon) * cs;
        const dy = it.lat - p.lat;
        if (Math.hypot(dx, dy) < thr) {
          hit = it;
          break;
        }
      }
    }
    if (hit) {
      const n = hit.count + 1;
      hit.lon = (hit.lon * hit.count + p.lon) / n;
      hit.lat = (hit.lat * hit.count + p.lat) / n;
      hit.count = n;
      hit.members.push(i);
    } else items.push({lon: p.lon, lat: p.lat, count: 1, members: [i]});
  });
  return items;
};

const parentOf = (set: Item[], member: number) => set.find((s) => s.members.includes(member)) ?? set[0];

const PinDropCluster: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, (frame - p.startAt) * p.speed);
  const pts = p.points.length ? p.points : DEFAULT_POINTS;
  const box = mapBox(w, h, u, portrait);
  const ptsKey = JSON.stringify(pts);
  const view0 = React.useMemo(() => fitView(pts.map((q) => [q.lon, q.lat] as [number, number]), box, 12, 300), [ptsKey, w, h]);
  const sets = React.useMemo(() => {
    const thr = (k: number) => (p.clusterSize * u) / k;
    const raw = cluster(pts, 0);
    const s0 = cluster(pts, thr(view0.k));
    const big = s0.reduce((a, b) => (b.count > a.count ? b : a), s0[0]);
    const view1: GeoView = {...view0, lon: big.lon, lat: big.lat, k: view0.k * p.zoom};
    const s1 = cluster(pts, thr(view1.k));
    return {raw, s0, s1, view1};
  }, [ptsKey, view0.k, p.zoom, p.clusterSize, u]);
  const {raw, s0, s1, view1} = sets;

  // timeline (frames at speed 1): drop 0-50, merge 62-84, zoom in/split 108-150, zoom out/merge 186-228, hold to end
  const aCam = prog(f, 108, 150, ease.inOut) - prog(f, 186, 228, ease.inOut);
  const view = lerpView(view0, view1, aCam, aCam);
  let stable: Item[] | null = null;
  let tr: {from: Item[]; to: Item[]; t: number} | null = null;
  const T: [number, number, Item[], Item[]][] = [
    [62, 84, raw, s0],
    [108, 150, s0, s1],
    [186, 228, s1, s0],
  ];
  for (const [a, b, A, B] of T) {
    if (f >= a && f <= b) tr = {from: A, to: B, t: (f - a) / (b - a)};
  }
  if (!tr) stable = f < 62 ? raw : f < 108 ? s0 : f < 186 ? s1 : s0;

  const bg = p.background === 'transparent' ? '#0B1220' : p.background;
  const pin = (key: string, x: number, y: number, s: number, drop: number, label?: string) => {
    const k = (p.pinSize * u * s) / 48;
    const air = Math.max(0, 1 - drop / (500 * u));
    return (
      <g key={key} transform={`translate(${x} ${y})`}>
        <ellipse cx={0} cy={0} rx={11 * k * (0.4 + 0.6 * air)} ry={4 * k * (0.4 + 0.6 * air)} fill="#000" opacity={0.35 * air} />
        <g transform={`translate(0 ${-drop}) scale(${k})`}>
          <path d="M0 0C-8 -11 -17 -20 -17 -31A17 17 0 1 1 17 -31C17 -20 8 -11 0 0Z" fill={p.accent} stroke={bg} strokeWidth={2.5} />
          <circle cx={0} cy={-31} r={6.5} fill={p.onAccent} />
        </g>
        {label && s > 0.6 ? (
          <text x={0} y={-k * 54 - drop} textAnchor="middle" fill={p.ink} fontFamily={p.fontFamily} fontSize={20 * u} fontWeight={600} opacity={s} paintOrder="stroke" stroke="#000" strokeOpacity={0.5} strokeWidth={4 * u}>
            {label}
          </text>
        ) : null}
      </g>
    );
  };
  const bubble = (key: string, x: number, y: number, s: number, n: number) => {
    const r = (26 + Math.min(18, Math.log2(n) * 6)) * u * s;
    const pulse = 1 + 0.06 * Math.sin(f * 0.18 + n);
    return (
      <g key={key} transform={`translate(${x} ${y})`}>
        <circle r={r * 1.5 * pulse} fill={p.accent2} opacity={0.18} />
        <circle r={r * 1.22} fill={p.accent2} opacity={0.35} />
        <circle r={r} fill={p.accent2} />
        <text y={r * 0.34} textAnchor="middle" fontFamily={p.fontFamily} fontWeight={800} fontSize={r * (n > 99 ? 0.7 : 0.95)} fill={p.onAccent}>
          {n}
        </text>
      </g>
    );
  };

  const renderItems = (items: Item[], mode: 'stable' | 'out' | 'in', t: number, other: Item[]) =>
    items.map((it, i) => {
      let lon = it.lon;
      let lat = it.lat;
      let s = 1;
      if (mode === 'out') {
        const finer = other.length > items.length;
        const par = parentOf(other, it.members[0]);
        const e = ease.inOut(Math.min(1, t * 1.15));
        if (!finer) {
          lon = lerp(it.lon, par.lon, e);
          lat = lerp(it.lat, par.lat, e);
        }
        s = 1 - prog(t, 0.45, 1, ease.in);
      } else if (mode === 'in') {
        const finer = items.length > other.length;
        const par = parentOf(other, it.members[0]);
        const e = ease.out(t);
        if (finer) {
          lon = lerp(par.lon, it.lon, e);
          lat = lerp(par.lat, it.lat, e);
        }
        s = prog(t, 0.3, 0.9, ease.back);
      }
      if (s <= 0.001) return null;
      const [x, y] = project(view, lon, lat);
      let drop = 0;
      let sc = s;
      if (stable === raw && mode === 'stable') {
        const ds = it.members[0] * (34 / Math.max(1, pts.length));
        const q = prog(f, ds, ds + 26, (v) => v);
        sc = q > 0 ? 1 : 0;
        drop = 620 * u * (1 - Easing.bounce(q));
      }
      if (sc <= 0.001) return null;
      if (it.count > 1) return bubble(`b${mode}${i}`, x, y, sc, it.count);
      return pin(`p${mode}${i}`, x, y, sc, drop, pts[it.members[0]].label);
    });

  const nShown = Math.min(pts.length, Math.round(pts.length * prog(f, 0, 40, ease.linear)));
  const clustersNow = stable ? stable.length : tr!.t < 0.5 ? tr!.from.length : tr!.to.length;
  const titleSize = (portrait ? 74 : 64) * u;
  const fade = prog(f, 4, 22, ease.out);
  const padX = (portrait ? 70 : 90) * u;
  const topY = (portrait ? 190 : 120) * u;
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <LandLayer view={view} w={w} h={h} u={u} fill={p.land} stroke={p.landStroke} grid={p.landStroke} gridOpacity={0.25} />
        {stable ? (
          renderItems(stable, 'stable', 0, stable)
        ) : (
          <>
            {renderItems(tr!.from, 'out', tr!.t, tr!.to)}
            {renderItems(tr!.to, 'in', tr!.t, tr!.from)}
          </>
        )}
        <g fontFamily={p.fontFamily} opacity={fade}>
          <text x={padX} y={topY} fontSize={titleSize} fontWeight={800} fill={p.ink} letterSpacing={-1 * u}>
            {p.title}
          </text>
          <text x={padX} y={topY + 44 * u} fontSize={26 * u} fill={p.ink} opacity={0.6}>
            {p.subtitle}
          </text>
          <g transform={`translate(${w - padX} ${topY})`} textAnchor="end">
            <text fontSize={74 * u} fontWeight={800} fill={p.accent}>
              {nShown}
            </text>
            <text y={34 * u} fontSize={22 * u} fill={p.ink} opacity={0.6} letterSpacing={2 * u}>
              {p.unit.toUpperCase()}
            </text>
            <text y={64 * u} fontSize={22 * u} fill={p.accent2} opacity={0.9} letterSpacing={2 * u}>
              {clustersNow} {clustersNow === 1 ? 'GROUP' : 'GROUPS'}
            </text>
          </g>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const pinDropCluster = defineMotion<Props>({
  id: 'pin-drop-cluster',
  title: 'Pin drop + clustering map',
  category: 'map',
  description: 'Map pins drop onto a map region, merge into numbered cluster bubbles, split into single pins as the camera zooms in, then merge again.',
  source: ['original (round 3)'],
  useFor: 'Store/user/event locators, "customers worldwide", coverage and density stories, any list of lat/lon points that needs to read as a map with counts.',
  durationInFrames: 270,
  defaultProps: {
    points: DEFAULT_POINTS,
    title: 'Locations',
    subtitle: 'Every point, grouped by density',
    unit: 'locations',
    clusterSize: 120,
    zoom: 2.2,
    pinSize: 58,
    speed: 1,
    startAt: 0,
    background: '#0B1220',
    land: '#17243C',
    landStroke: '#2F4468',
    ink: '#E8EEF9',
    accent: '#FF7A59',
    accent2: '#4CC9F0',
    onAccent: '#0B1220',
    fontFamily: fonts.sans,
  },
  propDocs: {
    points: 'array of {lat, lon, label?}; the camera auto-fits them (labels show when a pin is single and zoomed in)',
    title: 'headline, top left',
    subtitle: 'line under the headline',
    unit: 'noun for the big counter (locations, stores, users)',
    clusterSize: 'cluster radius in px (1080 scale): bigger merges more',
    zoom: 'camera zoom-in factor for the split beat',
    pinSize: 'pin height in px (1080 scale)',
    speed: 'timeline speed multiplier',
    startAt: 'frame to start at',
    background: 'map ocean colour, or "transparent"',
    land: 'land fill',
    landStroke: 'coastline + graticule colour',
    ink: 'text colour',
    accent: 'pin colour',
    accent2: 'cluster bubble colour',
    onAccent: 'text/dot colour drawn on accent shapes',
    fontFamily: 'CSS font-family',
  },
  component: PinDropCluster,
  tags: ['map', 'pins', 'cluster', 'locations', 'geo', 'lat-lon', 'markers', 'store locator', 'density', 'zoom'],
});
