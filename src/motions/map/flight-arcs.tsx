import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {deg} from '../../core/r2-mg2a-kit';
import {GeoView, LandLayer, LonLat, fitView, greatCircle, mapBox, project} from '../../core/r3-geo';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Place = {lat: number; lon: number; label?: string};
type Route = {from: Place; to: Place};
type Props = {
  routes: Route[];
  title: string;
  subtitle: string;
  unit: string;
  marker: 'plane' | 'dot';
  lift: number;
  trail: number;
  stagger: number;
  travel: number;
  speed: number;
  startAt: number;
  showLabels: boolean;
  background: string;
  land: string;
  landStroke: string;
  ink: string;
  accent: string;
  accent2: string;
  fontFamily: string;
};

const H = (code: string, lat: number, lon: number): Place => ({label: code, lat, lon});
const DEFAULT_ROUTES: Route[] = [
  {from: H('HUB A', 40.5, -74), to: H('HUB B', 51, 0)},
  {from: H('HUB B', 51, 0), to: H('HUB C', 25, 55)},
  {from: H('HUB C', 25, 55), to: H('HUB D', 1.3, 104)},
  {from: H('HUB D', 1.3, 104), to: H('HUB E', 35.5, 139.5)},
  {from: H('HUB B', 51, 0), to: H('HUB F', -26, 28)},
  {from: H('HUB A', 40.5, -74), to: H('HUB G', -23.5, -46.5)},
];

const haversine = (a: Place, b: Place) => {
  const dLat = (b.lat - a.lat) * deg, dLon = (b.lon - a.lon) * deg;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * deg) * Math.cos(b.lat * deg) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(s));
};

const PLANE = 'M14 0L3 -3L-3 -13L-6.5 -13L-4 -2.5L-9.5 -2.5L-11.5 -6L-14 -6L-12 0L-14 6L-11.5 6L-9.5 2.5L-4 2.5L-6.5 13L-3 13L3 3Z';

const FlightArcs: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, (frame - p.startAt) * p.speed);
  const routes = p.routes.length ? p.routes : DEFAULT_ROUTES;
  const rKey = JSON.stringify(routes);
  const box = mapBox(w, h, u, portrait, 200);
  const {view, curves, total} = React.useMemo(() => {
    const curves = routes.map((r) => greatCircle([r.from.lon, r.from.lat], [r.to.lon, r.to.lat], 72));
    const all: LonLat[] = [];
    curves.forEach((c) => all.push(...c));
    const view: GeoView = fitView(all, box, 25, 300);
    return {view, curves, total: routes.reduce((s, r) => s + haversine(r.from, r.to), 0)};
  }, [rKey, w, h]);

  const bg = p.background;
  const fade = prog(f, 0, 20, ease.out);
  const cities = new Map<string, {place: Place; at: number}>();
  routes.forEach((r, i) => {
    const d = i * p.stagger;
    const put = (pl: Place, at: number) => {
      const key = `${pl.lat},${pl.lon}`;
      const cur = cities.get(key);
      if (!cur || at < cur.at) cities.set(key, {place: pl, at});
    };
    put(r.from, d);
    put(r.to, d + p.travel);
  });

  let shown = 0;
  let dist = 0;
  const arcEls: React.ReactNode[] = [];
  const planeEls: React.ReactNode[] = [];
  routes.forEach((r, i) => {
    const d = 18 + i * p.stagger;
    const t = prog(f, d, d + p.travel, ease.inOut);
    if (t > 0) shown++;
    dist += haversine(r.from, r.to) * t;
    const c0 = project(view, curves[i][0][0], curves[i][0][1]);
    const c1 = project(view, curves[i][curves[i].length - 1][0], curves[i][curves[i].length - 1][1]);
    const cd = Math.hypot(c1[0] - c0[0], c1[1] - c0[1]);
    const cur = curves[i].map(([lon, lat], j, arr) => {
      const s = j / (arr.length - 1);
      const [x, y] = project(view, lon, lat);
      return [x, y - p.lift * cd * Math.sin(Math.PI * s)] as [number, number];
    });
    const n = cur.length - 1;
    const head = t * n;
    const hi = Math.min(n - 1, Math.floor(head));
    const hf = head - hi;
    const hx = lerp(cur[hi][0], cur[hi + 1][0], hf);
    const hy = lerp(cur[hi][1], cur[hi + 1][1], hf);
    const ang = Math.atan2(cur[hi + 1][1] - cur[hi][1], cur[hi + 1][0] - cur[hi][0]);
    const pts = cur.slice(0, hi + 1).concat([[hx, hy]]);
    const full = cur.map((q) => q.map((v) => v.toFixed(1)).join(' ')).join('L');
    const tail = Math.max(0, hi - Math.round(p.trail * n));
    const lit = pts.slice(tail).map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L');
    const done = prog(f, d + p.travel, d + p.travel + 30, ease.out);
    if (t > 0) {
      arcEls.push(
        <g key={'a' + i}>
          <path d={'M' + full} fill="none" stroke={p.accent2} strokeWidth={1.6 * u} strokeDasharray={`${3 * u} ${7 * u}`} opacity={0.22 + 0.1 * done} />
          <path d={'M' + pts.map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L')} fill="none" stroke={p.accent2} strokeWidth={2.2 * u} opacity={0.85 - 0.25 * done} strokeLinecap="round" />
          <path d={'M' + lit} fill="none" stroke={p.accent} strokeWidth={4 * u} strokeLinecap="round" strokeLinejoin="round" opacity={0.95 * (1 - done)} />
        </g>,
      );
      if (t < 1) {
        planeEls.push(
          p.marker === 'plane' ? (
            <g key={'p' + i} transform={`translate(${hx} ${hy}) rotate(${(ang * 180) / Math.PI}) scale(${1.25 * u})`}>
              <path d={PLANE} fill="#000" opacity={0.3} transform="translate(2 5)" />
              <path d={PLANE} fill={p.ink} stroke={bg === 'transparent' ? '#0B1220' : bg} strokeWidth={1} />
            </g>
          ) : (
            <g key={'p' + i}>
              <circle cx={hx} cy={hy} r={13 * u} fill={p.accent} opacity={0.3} />
              <circle cx={hx} cy={hy} r={6.5 * u} fill={p.ink} />
            </g>
          ),
        );
      }
    }
  });

  const cityEls = [...cities.values()].map(({place, at}, i) => {
    const q = prog(f, 18 + at, 18 + at + 14, ease.back);
    if (q <= 0) return null;
    const [x, y] = project(view, place.lon, place.lat);
    const ping = ((f - at) % 60) / 60;
    return (
      <g key={'c' + i} transform={`translate(${x} ${y})`}>
        <circle r={(8 + 26 * ping) * u * q} fill="none" stroke={p.accent} strokeWidth={2 * u} opacity={(1 - ping) * 0.7} />
        <circle r={7 * u * q} fill={p.accent} stroke={bg === 'transparent' ? '#0B1220' : bg} strokeWidth={2 * u} />
        {p.showLabels && place.label ? (
          <text y={-16 * u} textAnchor="middle" fontFamily={p.fontFamily} fontSize={20 * u} fontWeight={700} fill={p.ink} opacity={q} letterSpacing={1.5 * u} paintOrder="stroke" stroke="#000" strokeOpacity={0.55} strokeWidth={4 * u}>
            {place.label}
          </text>
        ) : null}
      </g>
    );
  });

  const padX = (portrait ? 70 : 90) * u;
  const topY = (portrait ? 190 : 120) * u;
  return (
    <AbsoluteFill style={{background: bg}}>
      <Svg>
        <LandLayer view={view} w={w} h={h} u={u} fill={p.land} stroke={p.landStroke} grid={p.landStroke} gridOpacity={0.2} />
        {arcEls}
        {cityEls}
        {planeEls}
        <g fontFamily={p.fontFamily} opacity={fade}>
          <text x={padX} y={topY} fontSize={(portrait ? 74 : 64) * u} fontWeight={800} fill={p.ink} letterSpacing={-1 * u}>
            {p.title}
          </text>
          <text x={padX} y={topY + 44 * u} fontSize={26 * u} fill={p.ink} opacity={0.6}>
            {p.subtitle}
          </text>
          <g transform={`translate(${w - padX} ${topY})`} textAnchor="end">
            <text fontSize={74 * u} fontWeight={800} fill={p.accent}>
              {Math.round(dist).toLocaleString('en-US')}
            </text>
            <text y={34 * u} fontSize={22 * u} fill={p.ink} opacity={0.6} letterSpacing={2 * u}>
              {p.unit.toUpperCase()}
            </text>
            <text y={64 * u} fontSize={22 * u} fill={p.accent2} letterSpacing={2 * u}>
              {shown}/{routes.length} ROUTES
            </text>
          </g>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const flightArcs = defineMotion<Props>({
  id: 'flight-arcs',
  title: 'Flight arcs (great-circle routes)',
  category: 'map',
  description: 'Great-circle arcs fly between lat/lon cities on a flat map: planes (or dots) travel with a glowing trail, cities ping on arrival, a distance counter adds up.',
  source: ['original (round 3)'],
  useFor: 'Global reach, shipping and travel routes, network/hub-and-spoke stories, "from here to there" beats; swap `routes` for any lat/lon pairs.',
  durationInFrames: 240,
  defaultProps: {
    routes: DEFAULT_ROUTES,
    title: 'Routes',
    subtitle: 'Hub to hub, around the map',
    unit: 'km flown',
    marker: 'plane',
    lift: 0.16,
    trail: 0.35,
    stagger: 18,
    travel: 72,
    speed: 1,
    startAt: 0,
    showLabels: true,
    background: '#0B1220',
    land: '#17243C',
    landStroke: '#2F4468',
    ink: '#E8EEF9',
    accent: '#FFB454',
    accent2: '#4CC9F0',
    fontFamily: fonts.sans,
  },
  propDocs: {
    routes: 'array of {from:{lat,lon,label?}, to:{lat,lon,label?}}; the camera fits them all',
    title: 'headline, top left',
    subtitle: 'line under the headline',
    unit: 'label under the distance counter',
    marker: '"plane" or "dot" travelling marker',
    lift: 'arc height as a fraction of the route length on screen (0 = flat)',
    trail: 'glowing trail length as a fraction of the route',
    stagger: 'frames between route departures',
    travel: 'frames each flight takes',
    speed: 'timeline speed multiplier',
    startAt: 'frame to start at',
    showLabels: 'show city labels',
    background: 'ocean colour or "transparent"',
    land: 'land fill',
    landStroke: 'coastline + graticule colour',
    ink: 'text / plane colour',
    accent: 'trail + city colour',
    accent2: 'arc colour',
    fontFamily: 'CSS font-family',
  },
  component: FlightArcs,
  tags: ['map', 'flight', 'routes', 'arcs', 'great circle', 'travel', 'logistics', 'network', 'airline', 'shipping'],
});
