// Adapted from mg-styles-15/demos/22-hud/js/holo.js (MIT, © mg-styles-15 authors); land data Natural Earth 50m (public domain)
// — see THIRD_PARTY_NOTICES.md. Rewritten as a deterministic SVG orthographic globe + regional map dive.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {defineMotion} from '../../core/types';
import {clamp, ease, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {fonts} from '../../core/fonts';
import {deg, hermite, isLand, landRings, mixN} from '../../core/r2-mg2a-kit';

type Props = {
  background: string;
  color: string;
  targetLat: number;
  targetLon: number;
  label: string;
  turnAt: number;
  diveAt: number;
  dots: number;
  graticule: boolean;
  scanPeriod: number;
  cities: number;
  tracks: number;
  transparent: boolean;
  seed: number;
};

const FIB = (n: number) => {
  const out: [number, number][] = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    out.push([Math.asin(y) / deg, ((i * ga) / deg) % 360 - 180 + (((i * ga) / deg) % 360 < 180 ? 0 : 0)]);
  }
  return out.map(([la, lo]) => [la, ((lo + 540) % 360) - 180] as [number, number]);
};

const HoloGlobe: React.FC<Props> = ({background, color, targetLat, targetLon, label, turnAt, diveAt, dots, graticule, scanPeriod, cities, tracks, transparent, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const R0 = portrait ? Math.min(w * 0.38, 420 * u) : 430 * u;
  const rings = React.useMemo(() => landRings(), []);
  const pts = React.useMemo(() => FIB(dots).filter(([la, lo]) => isLand(la, lo)), [dots]);

  // --- camera: idle spin -> hermite turn onto the target -> dive
  const spin0 = -70 + frame * 0.55;
  const turn = hermite((frame - turnAt) / 32);
  const lon0 = mixN(spin0 + 0, targetLon, turn);
  const lat0 = mixN(18, targetLat * 0.6 + 8, turn);
  const dive = prog(frame, diveAt, diveAt + 44, ease.expoInOut);
  const mapIn = prog(frame, diveAt + 26, diveAt + 52, ease.out);
  const globeA = 1 - prog(frame, diveAt + 20, diveAt + 40, ease.in);
  const zoom = 1 + dive * 7.5;
  const R = R0 * zoom;
  const intro = prog(frame, 0, 24, ease.out);

  const sl = Math.sin(lat0 * deg);
  const cl = Math.cos(lat0 * deg);
  const proj = (lat: number, lon: number, rad = 1): [number, number, number] => {
    const la = lat * deg;
    const dl = (lon - lon0) * deg;
    const x = Math.cos(la) * Math.sin(dl);
    const y = cl * Math.sin(la) - sl * Math.cos(la) * Math.cos(dl);
    const z = sl * Math.sin(la) + cl * Math.cos(la) * Math.cos(dl);
    return [x * rad, -y * rad, z * rad];
  };
  // focus: keep the target screen position at centre when diving
  const [tx, ty] = proj(targetLat, targetLon);
  const ox = cx - tx * R * dive;
  const oy = cy - ty * R * dive;
  const P = (lat: number, lon: number, rad = 1): [number, number, number] => {
    const [x, y, z] = proj(lat, lon, rad);
    return [ox + x * R, oy + y * R, z];
  };

  const polyFront = (line: [number, number][], step = 1, rad = 1) => {
    // split a lat/lon polyline into visible runs
    const runs: string[] = [];
    let cur: string[] = [];
    for (let i = 0; i < line.length; i += step) {
      const [x, y, z] = P(line[i][1], line[i][0], rad);
      if (z > 0.02) cur.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      else {
        if (cur.length > 1) runs.push(cur.join(' '));
        cur = [];
      }
    }
    if (cur.length > 1) runs.push(cur.join(' '));
    return runs;
  };

  const grat = React.useMemo(() => {
    const g: [number, number][][] = [];
    for (let lo = -180; lo < 180; lo += 10) {
      const l: [number, number][] = [];
      for (let la = -88; la <= 88; la += 4) l.push([lo, la]);
      g.push(l);
    }
    for (let la = -80; la <= 80; la += 10) {
      const l: [number, number][] = [];
      for (let lo = -180; lo <= 180; lo += 4) l.push([lo, la]);
      g.push(l);
    }
    return g;
  }, []);

  const scanY = ((frame % scanPeriod) / scanPeriod) * 2.2 - 1.1;
  const targetOn = prog(frame, turnAt + 28, turnAt + 40, ease.out);
  const [tpx, tpy, tpz] = P(targetLat, targetLon);
  const [bx, by] = P(targetLat, targetLon, 1.55);
  const ringsOn = [0, 1, 2].map((k) => {
    const a = ((frame - (turnAt + 32) - k * 14) % 42) / 42;
    return frame < turnAt + 32 ? -1 : a < 0 ? a + 1 : a;
  });
  const surfaceRing = (ang: number) => {
    const out: string[] = [];
    for (let i = 0; i <= 48; i++) {
      const b = (i / 48) * Math.PI * 2;
      const la = Math.asin(Math.sin(targetLat * deg) * Math.cos(ang) + Math.cos(targetLat * deg) * Math.sin(ang) * Math.cos(b)) / deg;
      const lo = targetLon + (Math.atan2(Math.sin(b) * Math.sin(ang) * Math.cos(targetLat * deg), Math.cos(ang) - Math.sin(targetLat * deg) * Math.sin(la * deg))) / deg;
      const [x, y, z] = P(la, lo);
      if (z > 0) out.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return out.join(' ');
  };

  // --- regional map
  const span = 22;
  const mpx = Math.min(w, h) / (portrait ? 21 : 31);
  const mapXY = (lat: number, lon: number): [number, number] => [cx + (lon - targetLon) * mpx * Math.cos(targetLat * deg) * 1.0, cy - (lat - targetLat) * mpx];
  const mapDrift = (frame - diveAt) * 0.12;
  const rc = React.useMemo(() => rng(seed), [seed]);
  const cityList = React.useMemo(() => {
    const r = rng(seed + 5);
    const out: {la: number; lo: number; s: number}[] = [];
    let tries = 0;
    while (out.length < cities && tries++ < 400) {
      const la = targetLat + (r() - 0.5) * span * 1.5;
      const lo = targetLon + (r() - 0.5) * span * 2.2;
      if (isLand(la, lo)) out.push({la, lo, s: 1 + r() * 2.2});
    }
    return out;
  }, [cities, seed, targetLat, targetLon]);
  const trackList = React.useMemo(() => {
    const r = rng(seed + 9);
    const out: {a: [number, number]; b: [number, number]; c: [number, number]; sp: number; ph: number}[] = [];
    let tries = 0;
    while (out.length < tracks && tries++ < 600) {
      const a: [number, number] = [targetLat + (r() - 0.5) * span * 1.7, targetLon + (r() - 0.5) * span * 2.4];
      const b: [number, number] = [targetLat + (r() - 0.5) * span * 1.7, targetLon + (r() - 0.5) * span * 2.4];
      const c: [number, number] = [(a[0] + b[0]) / 2 + (r() - 0.5) * 6, (a[1] + b[1]) / 2 + (r() - 0.5) * 6];
      if (isLand(...a) || isLand(...b) || isLand(...c)) continue;
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 5) continue;
      out.push({a, b, c, sp: 0.5 + r() * 0.6, ph: r()});
    }
    return out;
  }, [tracks, seed, targetLat, targetLon]);
  void rc;

  const atmoId = 'hgatmo';
  const scanClip = 'hgclip';
  const colA = (a: number) => a;
  const mono = fonts.mono;
  const tilt = -22 + (frame * 0.05);
  return (
    <AbsoluteFill style={{background: transparent ? 'transparent' : background}}>
      {!transparent && <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 45%, ${color}14 0%, transparent 62%)`}} />}
      <Svg>
        <defs>
          <radialGradient id={atmoId} cx="50%" cy="50%" r="50%">
            <stop offset="83%" stopColor={color} stopOpacity="0" />
            <stop offset="91%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="hgfill" cx="42%" cy="38%" r="70%">
            <stop offset="0%" stopColor={color} stopOpacity="0.10" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </radialGradient>
          <linearGradient id="hgscan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="100%" stopColor={color} stopOpacity="0.22" />
          </linearGradient>
          <clipPath id={scanClip}>
            <circle cx={ox} cy={oy} r={R} />
          </clipPath>
        </defs>

        {/* ---------- globe ---------- */}
        <g opacity={intro * globeA}>
          {/* orbit rings (back half dim, front bright) */}
          {[0, 1].map((k) => {
            const rx = R0 * zoom * (1.28 + k * 0.14);
            const ry = rx * (0.2 + k * 0.08);
            const rot = tilt * (k ? -0.7 : 1) + k * 40;
            return (
              <g key={k} transform={`translate(${ox} ${oy}) rotate(${rot})`} opacity={0.5 - k * 0.15}>
                <ellipse rx={rx} ry={ry} fill="none" stroke={color} strokeWidth={1.2 * u} strokeDasharray={`${k ? 3 : 10} ${k ? 9 : 6}`} strokeDashoffset={-frame * (k ? -0.8 : 1.2)} />
                {(() => {
                  const a = (frame * (k ? -0.03 : 0.045) + k * 2) % (Math.PI * 2);
                  return <circle cx={Math.cos(a) * rx} cy={Math.sin(a) * ry} r={4 * u} fill={color} />;
                })()}
              </g>
            );
          })}
          <circle cx={ox} cy={oy} r={R * 1.18} fill={`url(#${atmoId})`} />
          <circle cx={ox} cy={oy} r={R} fill="url(#hgfill)" stroke={color} strokeOpacity={0.55} strokeWidth={1.6 * u} />

          {/* graticule */}
          {graticule && (
            <g fill="none" stroke={color} strokeOpacity={0.16} strokeWidth={0.8 * u}>
              {grat.map((l, i) => polyFront(l).map((p, j) => <polyline key={`${i}-${j}`} points={p} />))}
            </g>
          )}

          {/* fibonacci land dots */}
          <g fill={color}>
            {pts.map(([la, lo], i) => {
              const [x, y, z] = P(la, lo);
              if (z < 0.05) return null;
              const grow = clamp((frame - 6 - (i % 40) * 0.5) / 16);
              return <circle key={i} cx={x} cy={y} r={(1.15 + 0.9 * z) * u * Math.min(1.4, 0.7 + zoom * 0.12)} opacity={(0.2 + 0.5 * z) * grow} />;
            })}
          </g>

          {/* coastlines draw on */}
          <g fill="none" stroke={color} strokeWidth={1.5 * u} strokeLinejoin="round" strokeLinecap="round" opacity={0.95}>
            {rings.map((ring, i) => {
              const start = 4 + ((i * 7) % 26);
              const p = clamp((frame - start) / 34);
              if (p <= 0) return null;
              const n = Math.max(2, Math.floor(ring.length * p));
              return polyFront(ring.slice(0, n)).map((s, j) => <polyline key={`${i}-${j}`} points={s} />);
            })}
          </g>

          {/* scan band */}
          <g clipPath={`url(#${scanClip})`}>
            <rect x={ox - R} y={oy + scanY * R - R * 0.16} width={R * 2} height={R * 0.16} fill="url(#hgscan)" opacity={0.9 * (1 - Math.abs(scanY) * 0.4)} />
            <rect x={ox - R} y={oy + scanY * R - 1.2 * u} width={R * 2} height={2.4 * u} fill={color} opacity={0.5} />
          </g>

          {/* target: surface rings, beam, marker */}
          <g opacity={targetOn}>
            {ringsOn.map((a, k) => a >= 0 && <polyline key={k} points={surfaceRing(a * 0.22 + 0.01)} fill="none" stroke={color} strokeWidth={1.8 * u} opacity={1 - a} />)}
            {tpz > 0 && (
              <>
                <line x1={tpx} y1={tpy} x2={bx} y2={by} stroke={color} strokeWidth={2.4 * u} opacity={0.9} />
                <line x1={tpx} y1={tpy} x2={bx} y2={by} stroke="#fff" strokeWidth={0.9 * u} opacity={0.9} />
                <circle cx={tpx} cy={tpy} r={4.5 * u * (1 + 0.3 * Math.sin(frame * 0.4))} fill="#fff" />
                <g fontFamily={mono} fontSize={19 * u} fill={color} textAnchor="start">
                  <text x={bx + 12 * u} y={by - 4 * u}>{label}</text>
                  <text x={bx + 12 * u} y={by + 20 * u} opacity={0.7} fontSize={14 * u}>{`${targetLat.toFixed(1)}N ${targetLon.toFixed(1)}E`}</text>
                </g>
              </>
            )}
          </g>
        </g>

        {/* ---------- regional map ---------- */}
        {mapIn > 0 && (
          <g opacity={mapIn}>
            <rect x={0} y={0} width={w} height={h} fill={transparent ? 'none' : background} opacity={0.0} />
            <g stroke={color} strokeOpacity={0.14} strokeWidth={0.8 * u}>
              {Array.from({length: 31}, (_, i) => {
                const lo = Math.floor(targetLon - 18) + i;
                const [x] = mapXY(targetLat, lo);
                return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={h} />;
              })}
              {Array.from({length: 31}, (_, i) => {
                const la = Math.floor(targetLat - 15) + i;
                const [, y] = mapXY(la, targetLon);
                return <line key={`h${i}`} x1={0} y1={y} x2={w} y2={y} />;
              })}
            </g>
            <g fill={color} fillOpacity={0.07} stroke={color} strokeWidth={1.7 * u} strokeLinejoin="round">
              {rings.map((ring, i) => {
                const mid = ring[Math.floor(ring.length / 2)];
                if (Math.abs(mid[0] - targetLon) > 40 || Math.abs(mid[1] - targetLat) > 30) return null;
                const d = ring.map(([lo, la]) => mapXY(la, lo).map((v) => v.toFixed(1)).join(',')).join(' ');
                return <polygon key={i} points={d} />;
              })}
            </g>
            {/* sea tracks */}
            {trackList.map((t, i) => {
              const A = mapXY(...t.a);
              const B = mapXY(...t.b);
              const C = mapXY(...t.c);
              const path = `M${A[0]},${A[1]} Q${C[0] * 2 - (A[0] + B[0]) / 2},${C[1] * 2 - (A[1] + B[1]) / 2} ${B[0]},${B[1]}`;
              const f = (((frame - diveAt) * 0.006 * t.sp + t.ph) % 1 + 1) % 1;
              const qx = (1 - f) * (1 - f) * A[0] + 2 * (1 - f) * f * (C[0] * 2 - (A[0] + B[0]) / 2) + f * f * B[0];
              const qy = (1 - f) * (1 - f) * A[1] + 2 * (1 - f) * f * (C[1] * 2 - (A[1] + B[1]) / 2) + f * f * B[1];
              return (
                <g key={i}>
                  <path d={path} fill="none" stroke={color} strokeWidth={1.4 * u} strokeDasharray={`${3 * u} ${9 * u}`} strokeDashoffset={-mapDrift * 8 * u} opacity={0.6} />
                  <circle cx={qx} cy={qy} r={4.2 * u} fill="#fff" />
                  <circle cx={qx} cy={qy} r={11 * u} fill="none" stroke={color} strokeWidth={1.2 * u} opacity={0.6} />
                </g>
              );
            })}
            {/* cities */}
            {cityList.map((c, i) => {
              const [x, y] = mapXY(c.la, c.lo);
              const on = clamp((frame - diveAt - 40 - i * 1.2) / 8);
              const tw = 0.6 + 0.4 * Math.sin(frame * 0.2 + i * 1.7);
              return (
                <g key={i} opacity={on}>
                  <circle cx={x} cy={y} r={c.s * 3.2 * u} fill={color} opacity={tw} />
                  <circle cx={x} cy={y} r={c.s * 7 * u} fill="none" stroke={color} strokeWidth={1 * u} opacity={0.35} />
                </g>
              );
            })}
            {/* target on the map */}
            {(() => {
              const [x, y] = mapXY(targetLat, targetLon);
              const pulse = ((frame - diveAt) % 36) / 36;
              return (
                <g>
                  <circle cx={x} cy={y} r={(14 + pulse * 70) * u} fill="none" stroke={color} strokeWidth={2 * u} opacity={1 - pulse} />
                  <circle cx={x} cy={y} r={6 * u} fill="#fff" />
                  <path d={`M${x - 30 * u},${y} H${x - 12 * u} M${x + 12 * u},${y} H${x + 30 * u} M${x},${y - 30 * u} V${y - 12 * u} M${x},${y + 12 * u} V${y + 30 * u}`} stroke={color} strokeWidth={2 * u} />
                  <text x={x + 36 * u} y={y - 22 * u} fontFamily={mono} fontSize={20 * u} fill={color}>{label}</text>
                </g>
              );
            })()}
            <text x={40 * u} y={h - 44 * u} fontFamily={mono} fontSize={16 * u} fill={color} opacity={0.7}>{`REGION VIEW  /  ${colA(targetLat).toFixed(2)}N ${targetLon.toFixed(2)}E  /  SCALE 1:${Math.round(40 + mapIn * 0)}M`}</text>
          </g>
        )}
        {/* HUD corner marks */}
        <g stroke={color} strokeWidth={2 * u} opacity={0.5 * intro} fill="none">
          {[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sy], i) => {
            const x = sx > 0 ? 36 * u : w - 36 * u;
            const y = sy > 0 ? 36 * u : h - 36 * u;
            return <path key={i} d={`M${x},${y + sy * 30 * u} V${y} H${x + sx * 30 * u}`} />;
          })}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const holoGlobe = defineMotion<Props>({
  id: 'holo-globe',
  title: 'Holographic globe',
  category: '3d',
  description: 'A wireframe Earth in cyan: coastlines draw on, a 10 degree graticule, fibonacci-dotted land, fresnel atmosphere, tilted orbit rings and a scan band; it turns onto a target, a beam and surface rings mark it, then the camera dives to a regional map with city dots and moving sea tracks.',
  source: ['mg-styles-15 demos/22-hud/js/holo.js (MIT)', 'Natural Earth 50m land (public domain)'],
  useFor: 'Geo explainers, news intros, cyber / defence and logistics films. Pairs with target-lock and supply-route-map. transparent=true for an overlay.',
  durationInFrames: 210,
  defaultProps: {
    background: '#020b12',
    color: '#00E5FF',
    targetLat: 1.4,
    targetLon: 104,
    label: 'TARGET 01',
    turnAt: 22,
    diveAt: 120,
    dots: 1900,
    graticule: true,
    scanPeriod: 60,
    cities: 34,
    tracks: 9,
    transparent: false,
    seed: 3,
  },
  propDocs: {
    background: 'backdrop colour',
    color: 'hologram colour (additive look)',
    targetLat: 'target latitude, degrees north',
    targetLon: 'target longitude, degrees east',
    label: 'target label text',
    turnAt: 'frame the globe starts turning onto the target (1 s hermite)',
    diveAt: 'frame of the dive into the regional map',
    dots: 'fibonacci sample count for the dotted land',
    graticule: '10 degree lat/lon grid',
    scanPeriod: 'frames per scan-band sweep (60 = 2 s)',
    cities: 'city dots on the regional map',
    tracks: 'moving sea tracks on the regional map',
    transparent: 'overlay mode (no background)',
    seed: 'seed for cities and tracks',
  },
  component: HoloGlobe,
  tags: ['globe', 'earth', 'hologram', 'wireframe', 'map', 'geo', 'hud', 'cyber', 'news', 'logistics', 'coastline', 'graticule', 'scan', 'dive', 'target', 'cyan', 'overlay', 'world', 'shipping'],
});
