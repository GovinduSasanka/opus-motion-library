// Adapted from lemo-opuscar/styles/newsreel/demo/index.html (sceneLogo, globe, sunburst, beams, silverText, decoTitle) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FilmGrain, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {OldFilm, P, SilverDefs, back, clamp, eo, fitW, lbf, lerp, pd, raysD, seg, ss} from '../../core/r2-lb1-kit';

/**
 * 1920s newsreel ident: two searchlight beams snap on with a white flash from the bottom corners and sweep; a
 * 36-wedge sunburst rotates slowly; a shaded wireframe globe (meridians + parallels, back lines hidden) grows and
 * turns; the title lands in Art-Deco silver lettering with a big overshoot; a spaced subtitle; an iris closes at
 * the end. Pure SVG — the globe is projected lat/lon polylines with z-culling, no three.js.
 */

type Props = {
  title: string;
  subtitle: string;
  tagline: string;
  beamsAt: number;
  globe: boolean;
  globeSpin: number;
  irisOut: boolean;
  gate: number;
  damage: number;
  silver: string[];
  background: string;
};

const NewsreelIdent: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames} = useStage();
  const id = 'newsreel-ident';
  const t = frame / 30;
  const cx = w / 2;
  const gcy = h * (portrait ? 0.4 : 0.42);
  // globe
  const gR = ss(seg(t, 0.1, 0.9)) * (portrait ? 230 : 200) * u;
  const tilt = 0.38;
  const spin = t * p.globeSpin;
  const project = (lat: number, lon: number): [number, number, number] => {
    const x0 = Math.cos(lat) * Math.cos(lon + spin);
    const y0 = Math.sin(lat);
    const z0 = Math.cos(lat) * Math.sin(lon + spin);
    const y1 = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
    const z1 = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);
    return [cx + x0 * gR, gcy - y1 * gR, z1];
  };
  const globeLines: string[] = [];
  if (p.globe && gR > 1) {
    for (let m = 0; m < 12; m++) {
      const lon = (m / 12) * Math.PI * 2;
      let dStr = '';
      let pen = false;
      for (let i = 0; i <= 60; i++) {
        const lat = -Math.PI / 2 + (i / 60) * Math.PI;
        const [x, y, z] = project(lat, lon);
        if (z <= 0.02) {
          dStr += `${pen ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
          pen = true;
        } else pen = false;
      }
      if (dStr) globeLines.push(dStr);
    }
    for (let q = 1; q <= 5; q++) {
      const lat = -Math.PI / 2 + (q / 6) * Math.PI;
      let dStr = '';
      let pen = false;
      for (let i = 0; i <= 90; i++) {
        const lon = (i / 90) * Math.PI * 2;
        const [x, y, z] = project(lat, lon);
        if (z <= 0.02) {
          dStr += `${pen ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
          pen = true;
        } else pen = false;
      }
      if (dStr) globeLines.push(dStr);
    }
  }
  // beams
  const beam = (side: -1 | 1) => {
    const t0 = p.beamsAt / 30;
    const dT = t - t0 - (side > 0 ? 0 : 0.08);
    if (dT < 0) return null;
    const on = 1 - 0.6 * Math.exp(-9 * dT);
    const flash = 0.5 * Math.exp(-7 * dT);
    const ox = cx + side * (portrait ? 420 : 640) * u;
    const oy = h + 60 * u;
    const sway = (side > 0 ? -1 : 1) * (0.42 + 0.22 * Math.sin(1.9 * t + (side > 0 ? 0 : 1.3))) - Math.PI / 2;
    const half = 0.085;
    const len = 1900 * u;
    const a0 = sway - side * 0.2;
    const pts: P[] = [
      [ox, oy],
      [ox + Math.cos(a0 - half) * len, oy + Math.sin(a0 - half) * len],
      [ox + Math.cos(a0 + half) * len, oy + Math.sin(a0 + half) * len],
    ];
    return (
      <g key={side} style={{mixBlendMode: 'screen'}}>
        <path d={pd(pts)} fill={`url(#${id}-beam)`} opacity={on} />
        <circle cx={ox} cy={oy} r={120 * u} fill="#fff" opacity={flash} />
      </g>
    );
  };
  // title
  const tIn = t - 1.0;
  const tK = tIn < 0 ? 0 : back(clamp(tIn / 0.5), 1.3);
  const tScale = tK <= 0 ? 2.4 : lerp(2.4, 1, tK);
  const tSize = fitW(p.title.toUpperCase(), (portrait ? 116 : 118) * u, w * 0.86, 'deco', 0.04);
  const titleY = gcy + gR + (portrait ? 170 : 130) * u;
  const sIn = eo(seg(t, 1.4, 1.7));
  const tagIn = eo(seg(t, 0.3, 0.7));
  // iris
  const irisK = p.irisOut ? ss(seg(frame, durationInFrames - 20, durationInFrames - 2)) : 0;
  const irisR = lerp(Math.hypot(w, h) * 0.6, 0, irisK);
  return (
    <AbsoluteFill style={{background: p.background, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id={`${id}-beam`} cx="0" cy="0" r="1">
            <stop offset="0" stopColor="#F3EEE1" stopOpacity={0.55} />
            <stop offset="0.5" stopColor="#E8E2D2" stopOpacity={0.16} />
            <stop offset="1" stopColor="#E8E2D2" stopOpacity={0} />
          </radialGradient>
          <radialGradient id={`${id}-gshade`} cx="0.38" cy="0.32" r="0.9">
            <stop offset="0" stopColor="#F4F1EA" />
            <stop offset="0.55" stopColor="#A9A49A" />
            <stop offset="1" stopColor="#34312C" />
          </radialGradient>
          <SilverDefs id={`${id}-silver`} y0={titleY - tSize} y1={titleY} stops={p.silver} />
          {irisK > 0 && (
            <mask id={`${id}-iris`}>
              <rect width={w} height={h} fill="#000" />
              <circle cx={cx} cy={gcy} r={irisR} fill="#fff" />
            </mask>
          )}
        </defs>
        <g mask={irisK > 0 ? `url(#${id}-iris)` : undefined}>
          <rect width={w} height={h} fill="#121110" />
          <path d={raysD(cx, gcy, 36, Math.hypot(w, h) * 0.75, t * 0.12, 0.5)} fill="#2A2723" />
          <rect width={w} height={h} fill="#1B1916" opacity={0.25} />
          {beam(-1)}
          {beam(1)}
          {p.globe && gR > 1 && (
            <g>
              <circle cx={cx} cy={gcy} r={gR} fill={`url(#${id}-gshade)`} />
              {globeLines.map((dStr, i) => (
                <path key={i} d={dStr} fill="none" stroke="#2A2723" strokeOpacity={0.75} strokeWidth={Math.max(1, gR * 0.012)} />
              ))}
              <circle cx={cx} cy={gcy} r={gR} fill="none" stroke="#0C0B0A" strokeWidth={Math.max(1.5, gR * 0.02)} />
            </g>
          )}
          {p.tagline && (
            <text x={cx} y={gcy - gR - 60 * u} textAnchor="middle" fontFamily={lbf('oswald')} fontWeight={600} fontSize={26 * u} letterSpacing="0.5em" fill="#D6CFC0" opacity={tagIn * 0.9}>
              {p.tagline.toUpperCase()}
            </text>
          )}
          {tK > 0 && (
            <g transform={`translate(${cx} ${titleY}) scale(${tScale}) translate(${-cx} ${-titleY})`}>
              <text x={cx} y={titleY} textAnchor="middle" fontFamily={lbf('deco')} fontSize={tSize} letterSpacing="0.04em" fill={`url(#${id}-silver)`} stroke="#0C0B0A" strokeWidth={tSize * 0.1} style={{paintOrder: 'stroke'}}>
                {p.title.toUpperCase()}
              </text>
            </g>
          )}
          {p.subtitle && sIn > 0 && (
            <text x={cx} y={titleY + 64 * u} textAnchor="middle" fontFamily={lbf('oswald')} fontWeight={400} fontSize={fitW(p.subtitle.toUpperCase(), 29 * u, w * 0.8, 'oswald', 0.3)} letterSpacing="0.3em" fill="#D6CFC0" opacity={sIn}>
              {p.subtitle.toUpperCase()}
            </text>
          )}
        </g>
        {irisK > 0 && <circle cx={cx} cy={gcy} r={Math.max(1, irisR + 7 * u)} fill="none" stroke="#000" strokeWidth={14 * u} />}
      </svg>
      <OldFilm id={id} frame={frame} w={w} h={h} u={u} gate={p.gate} flicker={0.035 * p.damage} scratches={Math.round(3 * p.damage)} dust={Math.round(4 * p.damage)} hair={false} vignette={0.5 * p.damage + 0.1} />
      <FilmGrain opacity={0.07 * p.damage} />
    </AbsoluteFill>
  );
};

export const newsreelIdent = defineMotion<Props>({
  id: 'newsreel-ident',
  title: 'Newsreel ident (searchlights & globe)',
  category: 'text',
  description:
    'Late-1920s newsreel opener: searchlight beams snap on with a flash and sweep from the bottom corners, a 36-wedge sunburst turns slowly, a shaded wireframe globe grows and spins, the channel name lands in Art-Deco silver lettering with a big overshoot over a spaced subtitle, and an iris closes on the globe.',
  source: ['lemo-opuscar styles/newsreel (MIT code, CC BY 4.0 docs, LemoLab) — demo/index.html sceneLogo/globe/sunburst/beams/silverText'],
  useFor: 'Vintage intros and outros for history channels, anniversaries, retro launches, "this week in…" shows; reprise it as the end card.',
  durationInFrames: 120,
  defaultProps: {
    title: 'World in Review',
    subtitle: 'Sound news of the week',
    tagline: 'Presenting',
    beamsAt: 5,
    globe: true,
    globeSpin: 1.4,
    irisOut: true,
    gate: 1.37,
    damage: 1,
    silver: ['#FFFFFF', '#D9D4CA', '#9E978A', '#EFEBE2'],
    background: '#000000',
  },
  propDocs: {
    title: 'Art-Deco silver title',
    subtitle: 'spaced caps line under the title',
    tagline: 'small line above the globe ("" to hide)',
    beamsAt: 'frame the searchlights snap on',
    globe: 'show the wireframe globe',
    globeSpin: 'globe spin speed (rad/s)',
    irisOut: 'iris to black at the end',
    gate: 'pillarbox gate aspect (0 = none)',
    damage: 'projector damage 0..1 (flicker, scratches, dust, grain)',
    silver: 'four stops of the silver lettering gradient',
    background: 'outside-gate colour',
  },
  component: NewsreelIdent,
  tags: ['newsreel', 'ident', 'intro', 'searchlight', 'globe', 'art deco', '1920s', 'vintage', 'silver', 'sunburst', 'iris', 'logo', 'history'],
});
