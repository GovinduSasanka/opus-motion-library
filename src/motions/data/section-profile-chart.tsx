// Adapted from lemo-opuscar/styles/lidar-survey/demo/film.js drawSection + STYLE.md §8 "The section" (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {backOut, cl, eio3, h1, lerp, lf, seg} from '../../core/r2-la3-kit';
import {drape, makeReliefH, ReliefMesh, reliefQuads, RelCam, RELIEF_PAL, relP} from '../../core/r2-la3b-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  profile: number[][];
  units: string;
  reading: string;
  anchor3d: number[];
  accent: string;
  title: string;
  startAt: number;
  size: number;
  seed: number;
  background: string;
  surface: string;
};

const SectionProfileChart: React.FC<Props> = ({profile, units, reading, anchor3d, accent, title, startAt, size, seed, background, surface}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame / 30;
  const half = size / 2;
  const ay = anchor3d[1] ?? 0;
  const H = React.useMemo(() => makeReliefH(seed, [{x: (anchor3d[0] ?? 0) * 0.3, y: ay, r: size * 0.12, h: 8.5}, {x: -size * 0.3, y: size * 0.28, r: size * 0.18, h: 3}], 1.6), [seed, size, ay]);

  // section line across the feature (plan x from -L..+L at y = ay); data = given profile or the surface itself
  const L = size * 0.3;
  const prof: [number, number][] = React.useMemo(
    () => (profile.length >= 3 ? profile.map((p) => [p[0], p[1]] as [number, number]) : Array.from({length: 61}, (_, i) => {
      const x = -L + (i / 60) * 2 * L;
      return [x, H(x, ay)] as [number, number];
    })),
    [profile, size, seed, ay],
  );
  const xs = prof.map((p) => p[0]);
  const zs = prof.map((p) => p[1]);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const zEnds = (zs[0] + zs[zs.length - 1]) / 2;
  const zPeak = Math.max(...zs);
  const zMin = Math.min(...zs, zEnds);
  const height = zPeak - zEnds;
  const peakI = zs.indexOf(zPeak);
  const thr = zEnds + height * 0.2;
  const iL = zs.findIndex((z) => z > thr);
  const iR = zs.length - 1 - [...zs].reverse().findIndex((z) => z > thr);
  const widthM = xs[Math.max(iR, iL)] - xs[Math.min(iL, iR)];
  const readText = reading || `${height.toFixed(1)}`;

  // camera: oblique raking view, terrain pushed to the left of centre on landscape
  const yaw = 0.62 + t * 0.02;
  const el = (portrait ? 46 : 40) * (Math.PI / 180);
  const k = Math.min((w * (portrait ? 0.96 : 0.62)) / (size * 1.3), (h * (portrait ? 0.4 : 0.9)) / (size * 0.66 * Math.sin(el) + 20 * Math.cos(el)));
  const cam: RelCam = {yaw, el, k, cx: portrait ? w / 2 : w * 0.34, cy: h * (portrait ? 0.32 : 0.56)};
  const quads = reliefQuads(H, size, 44, cam, {az: (315 * Math.PI) / 180, el: (28 * Math.PI) / 180}, {...RELIEF_PAL, lo: surface, hi: '#C9C2AE', zmax: 18, ambient: 0.2, interval: 2});

  // the vertical section plane sweeps in across the feature
  const sweep = eio3(seg(frame, startAt, startAt + 34));
  const nP = Math.max(2, Math.round(sweep * 60) + 1);
  const line = Array.from({length: nP}, (_, i) => {
    const x = -L + (i / 60) * 2 * L;
    return [x, ay] as [number, number];
  });
  const sp = drape(H, cam, line, 0.3);
  const lineD = 'M' + sp.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L');
  const top = line.map(([x, y]) => relP(cam, x, y, H(x, y) + 11 * Math.min(1, sweep * 2)));
  const planePts = [...sp.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`), ...[...top].reverse().map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`)].join(' ');
  const peakP = relP(cam, -L + (peakI / (prof.length - 1)) * 2 * L, ay, zPeak + 0.3);

  // chart panel (right third on landscape, bottom third on portrait)
  const pw = portrait ? w * 0.86 : w * 0.315;
  const ph = portrait ? h * 0.23 : h * 0.34;
  const px0 = portrait ? w * 0.07 : w * 0.655;
  const py0 = portrait ? h * 0.69 : h * 0.3;
  const pad = {l: 62 * u, r: 28 * u, t: 54 * u, b: 56 * u};
  const cw = pw - pad.l - pad.r;
  const chh = ph - pad.t - pad.b;
  const zLo = Math.floor(zMin - 1);
  const zHi = Math.ceil(zPeak + 1.5);
  const X = (x: number) => px0 + pad.l + ((x - xMin) / (xMax - xMin)) * cw;
  const Z = (z: number) => py0 + pad.t + chh - ((z - zLo) / (zHi - zLo)) * chh;
  const chartIn = backOut(seg(frame, startAt + 22, startAt + 40), 1.2);
  const ptsK = seg(frame, startAt + 30, startAt + 70);
  const fitK = eio3(seg(frame, startAt + 62, startAt + 92));
  const dimK = eio3(seg(frame, startAt + 84, startAt + 104));
  const readK = backOut(seg(frame, startAt + 100, startAt + 114), 2.2);
  const nFit = Math.max(2, Math.round(fitK * (prof.length - 1)) + 1);
  const fitD = 'M' + prof.slice(0, nFit).map((p) => `${X(p[0]).toFixed(1)} ${Z(p[1]).toFixed(1)}`).join('L');
  const nPts = 110;
  const scatter = Array.from({length: nPts}, (_, i) => {
    const x = lerp(xMin, xMax, h1(i, seed, 4));
    const j = cl(((x - xMin) / (xMax - xMin)) * (prof.length - 1), 0, prof.length - 1);
    const a = Math.floor(j);
    const b = Math.min(prof.length - 1, a + 1);
    const z = lerp(prof[a][1], prof[b][1], j - a) + (h1(i, seed, 9) - 0.5) * 0.9;
    return {x, z, a: seg(ptsK, i / nPts, i / nPts + 0.1)};
  });
  const tick = 2 * u;
  const fs = 17 * u;

  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="spc-glow" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation={4 * u} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="spc-vig" cx="40%" cy="55%" r="75%">
            <stop offset="55%" stopColor={background} stopOpacity="0" />
            <stop offset="100%" stopColor={background} stopOpacity="0.85" />
          </radialGradient>
        </defs>
        <g opacity={eio3(seg(frame, 0, 16))}>
          <ReliefMesh quads={quads} />
        </g>
        {sweep > 0 && (
          <g>
            <polygon points={planePts} fill={accent} fillOpacity="0.1" stroke={accent} strokeOpacity="0.4" strokeWidth={1 * u} />
            <path d={lineD} fill="none" stroke={accent} strokeOpacity="0.5" strokeWidth={9 * u} strokeLinejoin="round" filter="url(#spc-glow)" />
            <path d={lineD} fill="none" stroke="#FFF1D6" strokeWidth={Math.max(1.4, 2 * u)} strokeLinejoin="round" />
          </g>
        )}
        <rect width={w} height={h} fill="url(#spc-vig)" />

        {/* leader from the section's peak to the chart */}
        {dimK > 0 && (
          <path
            d={`M${peakP[0]} ${peakP[1]}L${portrait ? peakP[0] : px0 - 24 * u} ${portrait ? py0 - 18 * u : peakP[1]}${portrait ? '' : `L${px0} ${py0 + ph * 0.4}`}`}
            fill="none"
            stroke={accent}
            strokeOpacity={0.7 * dimK}
            strokeWidth={1.2 * u}
            strokeDasharray={`${5 * u} ${5 * u}`}
          />
        )}
        <circle cx={peakP[0]} cy={peakP[1]} r={4 * u} fill={accent} opacity={dimK} />

        <g opacity={chartIn} transform={`translate(0 ${(1 - chartIn) * 16 * u})`}>
          <rect x={px0} y={py0} width={pw} height={ph} fill="#0B0E11" fillOpacity="0.72" stroke="#FFFFFF" strokeOpacity="0.16" strokeWidth={1.2 * u} />
          <text x={px0 + 16 * u} y={py0 + 30 * u} fill="#FFFFFF" fillOpacity="0.7" fontFamily={lf.plex} fontSize={fs} style={{letterSpacing: 2 * u}}>
            {title.toUpperCase()}
          </text>
          {[zLo, Math.round((zLo + zHi) / 2), zHi].map((z, i) => (
            <g key={i}>
              <path d={`M${px0 + pad.l} ${Z(z)}H${px0 + pw - pad.r}`} stroke="#FFFFFF" strokeOpacity="0.09" strokeWidth={1 * u} />
              <text x={px0 + pad.l - 10 * u} y={Z(z) + 6 * u} fill="#FFFFFF" fillOpacity="0.5" fontFamily={lf.plex} fontSize={fs * 0.85} textAnchor="end">
                {z}
              </text>
            </g>
          ))}
          <text x={px0 + pw - pad.r} y={py0 + ph - 18 * u} fill="#FFFFFF" fillOpacity="0.45" fontFamily={lf.plex} fontSize={fs * 0.85} textAnchor="end">
            distance ({units})
          </text>
          {/* returns */}
          {scatter.map((p, i) => (
            <circle key={i} cx={X(p.x)} cy={Z(p.z)} r={2.2 * u} fill="#CFE6DA" opacity={0.75 * p.a} />
          ))}
          {/* fitted profile */}
          <path d={fitD} fill="none" stroke={accent} strokeWidth={2.4 * u} strokeLinejoin="round" strokeLinecap="round" />
          {/* dimensions */}
          <g opacity={dimK} stroke="#FFFFFF" strokeOpacity="0.85" strokeWidth={tick} fill="none">
            <path d={`M${X(xs[peakI])} ${Z(zPeak)}H${X(xMax) - 4 * u}M${X(xMax) - 22 * u} ${Z(zEnds)}H${X(xMax) - 4 * u}M${X(xMax) - 14 * u} ${Z(zPeak)}V${Z(zEnds)}`} strokeDasharray={`${3 * u} ${3 * u}`} strokeWidth={1.2 * u} />
            <path d={`M${X(xMax) - 14 * u - 6 * u} ${Z(zPeak)}h${12 * u}M${X(xMax) - 14 * u - 6 * u} ${Z(zEnds)}h${12 * u}`} />
            <path d={`M${X(xs[Math.min(iL, iR)])} ${Z(zLo) - 8 * u}v${-4 * u}M${X(xs[Math.max(iL, iR)])} ${Z(zLo) - 8 * u}v${-4 * u}M${X(xs[Math.min(iL, iR)])} ${Z(zLo) - 10 * u}H${X(xs[Math.max(iL, iR)])}`} />
          </g>
          <text x={(X(xs[Math.min(iL, iR)]) + X(xs[Math.max(iL, iR)])) / 2} y={Z(zLo) - 16 * u} fill="#FFFFFF" fillOpacity={0.8 * dimK} fontFamily={lf.plex} fontSize={fs} textAnchor="middle">
            {widthM.toFixed(0)} {units}
          </text>
          {/* the reading pops in accent */}
          <g transform={`translate(${px0 + 22 * u} ${py0 + pad.t + 48 * u}) scale(${readK})`} opacity={cl(readK)}>
            <text x="0" y="0" fill={accent} fontFamily={lf.barlowC} fontWeight={300} fontSize={(portrait ? 64 : 82) * u} style={{letterSpacing: 1 * u}}>
              {readText}
              <tspan fontSize={(portrait ? 28 : 34) * u} dx={8 * u} fill="#FFFFFF" fillOpacity="0.8">
                {reading ? '' : units}
              </tspan>
            </text>
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const sectionProfileChart = defineMotion<Props>({
  id: 'section-profile-chart',
  title: 'Section profile chart',
  category: 'data',
  description:
    'A vertical plane slices one feature of a raking-lit survey surface; its profile glows on the ground while a dimensioned 2D chart of the real returns (scattered points, a fitted line, height and width dimension lines) appears in the right third, joined by a dashed leader, and the measured reading pops in the accent colour.',
  source: ['lemo-opuscar styles/lidar-survey/demo/film.js drawSection, STYLE.md §8 (MIT, LemoLab)', 'lemo-styles-a lidar-survey: section-profile-chart'],
  useFor: 'Engineering clearances, product dimensions, terrain cross-sections and evidence-style explainers.',
  durationInFrames: 180,
  defaultProps: {profile: [], units: 'm', reading: '', anchor3d: [0, 0], accent: '#FFB347', title: 'Section A-A', startAt: 18, size: 200, seed: 8, background: '#07090B', surface: '#2A2D2F'},
  propDocs: {
    profile: 'optional measured profile as [[x, z], …] in metres (default: sampled from the surface)',
    units: 'unit label',
    reading: 'text of the popped reading (default: measured height + units)',
    anchor3d: 'plan position [x, y] of the section and its feature',
    accent: 'glow, fit line and reading colour',
    title: 'chart heading',
    startAt: 'frame the plane starts sweeping',
    size: 'terrain size in metres',
    seed: 'terrain seed',
    background: 'backdrop colour',
    surface: 'low-ground colour of the lit surface',
  },
  component: SectionProfileChart,
  tags: ['section', 'profile', 'cross section', 'chart', 'dimension', 'measurement', 'survey', 'terrain', 'lidar', 'engineering', 'height', 'evidence', 'explainer'],
});
