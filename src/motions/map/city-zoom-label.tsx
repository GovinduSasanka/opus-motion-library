import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {GeoView, LandLayer, fitView, lerpView, project} from '../../core/r3-geo';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  lat: number;
  lon: number;
  label: string;
  subtitle: string;
  tag: string;
  zoom: number;
  showCoords: boolean;
  speed: number;
  startAt: number;
  background: string;
  land: string;
  landStroke: string;
  ink: string;
  accent: string;
  onAccent: string;
  fontFamily: string;
  monoFamily: string;
};

const coord = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(3)}°${v >= 0 ? pos : neg}`;

const CityZoomLabel: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, (frame - p.startAt) * p.speed);

  // world view -> city view; the target sits off-centre so the label card has room
  const world: GeoView = React.useMemo(
    () => ({...fitView([[-170, -58], [175, 78]], {x0: 40 * u, y0: 40 * u, x1: w - 40 * u, y1: h - 40 * u}, 10, 300), lon: 0, lat: 12, cx: w / 2, cy: h / 2}),
    [w, h, u],
  );
  const pinX = portrait ? w / 2 : w * 0.36;
  const pinY = portrait ? h * 0.36 : h * 0.55;
  const city: GeoView = {lon: p.lon, lat: p.lat, k: p.zoom * u, cx: pinX, cy: pinY};
  const zt = prog(f, 16, 118, ease.expoInOut);
  const pt = prog(f, 16, 104, ease.inOut);
  const view = lerpView(world, city, pt, zt);
  // pull the pan slightly ahead of the zoom
  const [px, py] = project(view, p.lon, p.lat);

  const bg = p.background === 'transparent' ? '#0B1220' : p.background;
  const intro = prog(f, 0, 18, ease.out);
  const arrived = prog(f, 100, 124, ease.out);
  const card = prog(f, 112, 140, ease.out);
  const wordAppear = Math.min(1, prog(f, 118, 150, ease.out));
  const typed = Math.round(p.label.length * wordAppear);

  const cardW = (portrait ? w - 140 * u : 560 * u);
  const cardH = 214 * u;
  const cardX = portrait ? 70 * u : pinX + 110 * u;
  const cardY = portrait ? pinY + 170 * u : pinY - 250 * u;
  const rings = [0, 1, 2].map((i) => {
    const t = ((f * 0.9 + i * 24) % 72) / 72;
    return <circle key={i} cx={px} cy={py} r={(10 + 90 * t) * u} fill="none" stroke={p.accent} strokeWidth={3 * u} opacity={(1 - t) * 0.8 * prog(f, 10, 30)} />;
  });
  const elbow = `M${px + 14 * u} ${py - 14 * u}L${px + 60 * u} ${py - 60 * u}L${portrait ? px + 60 * u : cardX} ${portrait ? cardY : py - 60 * u}`;
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <g opacity={intro}>
          <LandLayer view={view} w={w} h={h} u={u} fill={p.land} stroke={p.landStroke} strokeWidth={1.4} grid={p.landStroke} gridOpacity={0.3} />
        </g>
        {rings}
        <circle cx={px} cy={py} r={(7 + 5 * arrived) * u} fill={p.accent} stroke={bg} strokeWidth={2.5 * u} />
        <circle cx={px} cy={py} r={(2.5 + 2 * arrived) * u} fill={p.onAccent} />
        {/* leader + card */}
        {!portrait ? (
          <path d={elbow} fill="none" stroke={p.accent} strokeWidth={2.5 * u} strokeDasharray={1000} strokeDashoffset={1000 * (1 - card)} opacity={card > 0 ? 1 : 0} />
        ) : null}
        <g transform={`translate(${cardX} ${cardY + (1 - card) * 30 * u})`} opacity={card} fontFamily={p.fontFamily}>
          <rect width={cardW} height={cardH} rx={20 * u} fill={bg} fillOpacity={0.88} stroke={p.landStroke} strokeWidth={2 * u} />
          <rect width={8 * u} height={cardH} rx={4 * u} fill={p.accent} />
          <text x={36 * u} y={50 * u} fontSize={20 * u} fontWeight={700} fill={p.accent} letterSpacing={3 * u}>
            {p.tag.toUpperCase()}
          </text>
          <text x={36 * u} y={118 * u} fontSize={(portrait ? 70 : 66) * u} fontWeight={800} fill={p.ink} letterSpacing={-1 * u}>
            {p.label.slice(0, typed)}
          </text>
          <text x={36 * u} y={158 * u} fontSize={26 * u} fill={p.ink} opacity={0.65}>
            {p.subtitle}
          </text>
          {p.showCoords ? (
            <text x={36 * u} y={193 * u} fontSize={20 * u} fontFamily={p.monoFamily} fill={p.ink} opacity={0.5} letterSpacing={1 * u}>
              {coord(p.lat, 'N', 'S')}   {coord(p.lon, 'E', 'W')}
            </text>
          ) : null}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const cityZoomLabel = defineMotion<Props>({
  id: 'city-zoom-label',
  title: 'City zoom + label card',
  category: 'map',
  description: 'A world map zooms (expo ease, graticule re-scaling) down to a lat/lon, a pin pings, and a label card with name, subtitle and coordinates slides in.',
  source: ['original (round 3)'],
  useFor: '"We are here" / location reveals, store or event locators, travel and news establishing shots, any beat that goes from the world to one place. Set `lat`, `lon`, `label`.',
  durationInFrames: 180,
  defaultProps: {
    lat: 45.0,
    lon: 9.0,
    label: 'Your City',
    subtitle: 'Add a one-line description here',
    tag: 'Location',
    zoom: 110,
    showCoords: true,
    speed: 1,
    startAt: 0,
    background: '#0B1220',
    land: '#17243C',
    landStroke: '#2F4468',
    ink: '#E8EEF9',
    accent: '#FF7A59',
    onAccent: '#0B1220',
    fontFamily: fonts.sans,
    monoFamily: fonts.mono,
  },
  propDocs: {
    lat: 'target latitude (degrees, N positive)',
    lon: 'target longitude (degrees, E positive)',
    label: 'place name on the card',
    subtitle: 'line under the name',
    tag: 'small caps line above the name',
    zoom: 'final zoom in px per degree at 1080 scale (world view is ~5; 110 = a region; the baked coastline is simplified, so above ~250 it looks faceted)',
    showCoords: 'print the lat/lon on the card',
    speed: 'timeline speed multiplier',
    startAt: 'frame to start at',
    background: 'ocean colour or "transparent"',
    land: 'land fill',
    landStroke: 'coastline, grid and card border colour',
    ink: 'text colour',
    accent: 'pin / leader colour',
    onAccent: 'dot colour inside the pin',
    fontFamily: 'CSS font-family',
    monoFamily: 'CSS font-family for the coordinates line',
  },
  component: CityZoomLabel,
  tags: ['map', 'zoom', 'location', 'pin', 'label', 'coordinates', 'lat-lon', 'establishing', 'world', 'city'],
});
