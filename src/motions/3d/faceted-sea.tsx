// Adapted from lemo-opuscar/styles/lowpoly-island/demo/sea.js + post.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  Boat,
  FacetSea,
  HexTile,
  LpLights,
  LpRig,
  LpSky,
  LpStage,
  Pine,
  cl,
  eo3,
  hexDisc,
  hexDist,
  hexXZ,
  lerp,
  lpFrustum,
  lpRise,
  lpView,
  popCurve,
  todMix,
} from '../../core/r2-la3c-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * lowpoly-island sea: an endless faceted ocean seen through an orthographic camera. 4 summed sines displace a
 * non-indexed plane, every triangle is lit and glints on its own, a turquoise shallow rim and foam ring hug any land
 * and the far water dissolves into a horizonless pastel sky gradient (depth haze in screen space). A tiny hex islet
 * rises, a boat bobs on the CPU copy of the wave function, and the light drifts from `timeStart` to `timeEnd`.
 */
type Props = {
  timeStart: string;
  timeEnd: string;
  azimuthStart: number;
  azimuthEnd: number;
  elevation: number;
  zoom: number;
  amplitude: number;
  sparkle: number;
  glint: number;
  foam: number;
  islet: boolean;
  boat: boolean;
  speed: number;
  seed: number;
  skyColor: string;
  horizonColor: string;
  waterColor: string;
  shallowColor: string;
  grassColor: string;
  sandColor: string;
  sandSideColor: string;
  grassSideColor: string;
  treeColor: string;
  tree2Color: string;
  treeTipColor: string;
  boatColor: string;
  sailColor: string;
};

const FacetedSea: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const k = cl(frame / Math.max(1, durationInFrames - 1));
  const t = (frame / 30) * p.speed;
  const tod0 = todMix(p.timeStart, p.timeEnd, k * k * (3 - 2 * k));
  // optional brand overrides of the time-of-day palette ('' = keep the time-of-day colour)
  const tod = {
    ...tod0,
    zenith: p.skyColor || tod0.zenith,
    horizon: p.horizonColor || tod0.horizon,
    deep: p.waterColor || tod0.deep,
    shallow: p.shallowColor || tod0.shallow,
  };
  const az = lerp(p.azimuthStart, p.azimuthEnd, k);
  const el = p.elevation;
  const fh = lpFrustum(p.zoom * (h > w ? 0.45 : 1), w / h);
  const V = lpView(az, el);
  const s2 = Math.sin((el * Math.PI) / 180) ** 2;
  const shift = (fh * 0.17) / Math.max(0.1, s2);
  const target: [number, number, number] = [V.up[0] * shift, 0, V.up[2] * shift];
  const sizeSea = Math.hypot((fh * (w / h)) / 2, fh / (2 * Math.sin((el * Math.PI) / 180))) * 2.15;
  const amp = p.amplitude * (0.3 + 0.7 * eo3(frame / 50));

  const cells = React.useMemo(() => hexDisc(1).map(([q, r]) => ({q, r, d: hexDist(q, r), xz: hexXZ(q, r)})), []);
  const rise = cells.map((c, i) => lpRise(t - (0.35 + i * 0.13)));
  const land: number[] = [];
  if (p.islet) cells.forEach((c, i) => rise[i].k > 0.35 && land.push(c.xz[0], c.xz[1]));

  const boatAng = 0.9 + t * 0.32;
  const R = 4.6;
  const bx = Math.cos(boatAng) * R;
  const bz = Math.sin(boatAng) * R * 0.8;
  const heading = Math.atan2(Math.cos(boatAng) * R * 0.8, -Math.sin(boatAng) * R);
  const boatK = popCurve(t - 1.6);

  return (
    <AbsoluteFill>
      <LpSky tod={tod} frame={frame} w={w} h={h} u={u} seed={p.seed} band={0.34} />
      <LpStage>
        <LpRig target={target} az={az} el={el} fh={fh} />
        <LpLights tod={tod} extent={8} />
        <FacetSea
          opts={{t, size: sizeSea, seg: 100, tod, az, el, fh, target, land, amp, sparkle: p.sparkle, glint: p.glint, foam: p.foam, beam: null, haze: [-0.2, 0.5], band: 0.34, seed: p.seed}}
        />
        {p.islet &&
          cells.map((c, i) => {
            const topH = c.d === 0 ? 0.62 : 0.34;
            const top = lerp(-1.4, topH, rise[i].k) + rise[i].over;
            const topColor = c.d === 0 ? p.grassColor : p.sandColor;
            const side = c.d === 0 ? p.grassSideColor : p.sandSideColor;
            return rise[i].k > 0 ? <HexTile key={i} x={c.xz[0]} z={c.xz[1]} top={top} topColor={topColor} sideColor={side} /> : null;
          })}
        {p.islet && <Pine x={0} y={0.62} z={0} s={1.25} pop={popCurve(t - 1.7)} c1={p.treeColor} c2={p.tree2Color} />}
        {p.islet && <Pine x={hexXZ(1, 0)[0] * 0.55} y={0.34} z={hexXZ(1, 0)[1] * 0.55 + 0.2} s={0.8} pop={popCurve(t - 2.0)} c1={p.tree2Color} c2={p.treeTipColor} />}
        {p.boat && boatK > 0.01 && <Boat x={bx} z={bz} t={t} amp={amp} heading={heading} s={boatK * 1.5} hull={p.boatColor} sail={p.sailColor} />}
      </LpStage>
    </AbsoluteFill>
  );
};

export const facetedSea = defineMotion<Props>({
  id: 'faceted-sea',
  title: 'Faceted sea',
  category: '3d',
  description:
    'An endless low-poly ocean in orthographic view: every triangle glints on its own, a turquoise shallow rim and foam ring wrap a tiny hex islet that rises from the water, a boat bobs on the wave function, and the far water dissolves into a horizonless pastel sky while the light drifts from day to dusk.',
  source: ['lemo-opuscar styles/lowpoly-island demo/sea.js + post.js (MIT, LemoLab) — wave function, shallow rim, depth haze, time-of-day keys'],
  useFor: 'Calm 3D backdrop for island / travel / logistics / calm-brand heroes and diorama scenes; a looping website hero; put title words in HTML over it.',
  durationInFrames: 240,
  defaultProps: {timeStart: 'day', timeEnd: 'dusk', azimuthStart: 38, azimuthEnd: 58, elevation: 32, zoom: 13, amplitude: 1, sparkle: 1, glint: 0.5, foam: 1, islet: true, boat: true, speed: 1, seed: 3, skyColor: '', horizonColor: '', waterColor: '', shallowColor: '', grassColor: '#93C96C', sandColor: '#F3DFAB', sandSideColor: '#E2C68E', grassSideColor: '#C99C6E', treeColor: '#3F8A5A', tree2Color: '#4F9C63', treeTipColor: '#7FC36A', boatColor: '#D9644A', sailColor: '#FBF3E6'},
  propDocs: {
    timeStart: 'time of day at the start: dawn | day | dusk | night',
    timeEnd: 'time of day at the end (the light eases from start to end)',
    azimuthStart: 'camera azimuth at the start (degrees)',
    azimuthEnd: 'camera azimuth at the end (slow turntable)',
    elevation: 'camera elevation in degrees (25-35 day, 20-25 night, 50 map-like)',
    zoom: 'orthographic frustum height in world units (12-16 = island scale)',
    amplitude: 'wave height multiplier',
    sparkle: 'per-facet glint strength',
    glint: 'sun specular strength on the facets (too high = white flashes)',
    foam: 'foam ring around land (0 = none)',
    islet: 'show the small hex islet (drives the shallow rim and foam)',
    boat: 'a small boat circling the islet',
    speed: 'wave speed multiplier',
    seed: 'facet jitter / star seed',
    skyColor: "sky zenith colour, '' = from the time of day (overrides the whole clip)",
    horizonColor: "sky / haze colour at the horizon, '' = from the time of day",
    waterColor: "deep water colour, '' = from the time of day",
    shallowColor: "shallow rim water colour, '' = from the time of day",
    grassColor: 'islet centre tile top colour',
    sandColor: 'islet ring tile top colour',
    sandSideColor: 'islet ring tile side colour',
    grassSideColor: 'islet centre tile side colour',
    treeColor: 'big pine lower foliage colour',
    tree2Color: 'big pine upper cone / small pine lower foliage colour',
    treeTipColor: 'small pine upper cone colour',
    boatColor: 'boat hull colour',
    sailColor: 'boat sail colour',
  },
  component: FacetedSea,
  tags: ['low-poly', 'lowpoly', 'sea', 'ocean', 'water', 'waves', 'faceted', 'flat-shaded', 'isometric', 'orthographic', 'island', 'backdrop', 'pastel', 'three.js', '3d', 'diorama', 'time of day', 'travel', 'calm', 'loop', 'background', 'lowpoly-island'],
});
