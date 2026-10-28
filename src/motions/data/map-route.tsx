import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {fbm, rng} from '../../core/random';
import {smoothClosed, smoothOpen} from '../../core/shapes';
import {shade} from '../../core/hud-kit';
import {FilmGrain, PaperTexture, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {RangeMode} from '../../core/r2-e2-map-kit';

/**
 * video6 map-flight-path + waggle-dance-diagram, video22 hop-move-dotted-trail.
 * A top-down illustrated paper map (jittered field patches with crop-row hatching, a river,
 * scalloped tree canopies, blossom patches, a hive). A marker (bee / pin / dot) follows a smooth
 * Catmull-Rom route leaving a dotted, dashed or solid trail; a red bearing vector draws from the
 * hive with an angle arc against north and distance ticks (waggle-dance ruler), a dashed orange
 * line ties the marker to the sun. The camera follows the marker (~central third).
 * style "hop": the marker hops waypoint to waypoint on straight legs, dots pop in behind it
 * (3 f each) and a ring fades in round each landing.
 */
type Waypoint = {x: number; y: number; label: string};
type Props = {
  waypoints: Waypoint[];
  style: 'flight' | 'hop' | 'range';
  trail: 'dots' | 'dash' | 'line';
  marker: 'bee' | 'pin' | 'dot';
  showBearing: boolean;
  showSun: boolean;
  distanceKm: number;
  seed: number;
  paper: string;
  trailColor: string;
  vectorColor: string;
  sunColor: string;
  zoom: number;
  from: [number, number];
  to: [number, number];
  unit: string;
  src: string;
  corridor: boolean;
  chase: boolean;
  labelA: string;
  labelB: string;
};

type Pt = [number, number];

const catmull = (pts: Pt[], steps = 40): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

const polyline = (pts: Pt[]) => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = cum[cum.length - 1] || 1;
  const at = (s: number): [number, number, number] => {
    const d = clamp(s) * L;
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < d) lo = mid;
      else hi = mid;
    }
    const seg = cum[hi] - cum[lo] || 1;
    const k = (d - cum[lo]) / seg;
    const a = pts[lo];
    const b = pts[hi];
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[1] - a[1], b[0] - a[0])];
  };
  return {L, at, cum};
};

const MapRoute: React.FC<Props> = ({waypoints, style, trail, marker, showBearing, showSun, distanceKm, seed, paper, trailColor, vectorColor, sunColor, zoom}) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: D, portrait} = useStage();
  const S = Math.min(w, h);
  const M = S * (portrait ? 1.35 : 1.25);
  const wps = waypoints.length >= 2 ? waypoints : [{x: -0.6, y: 0.5, label: 'HIVE'}, {x: 0.5, y: -0.4, label: 'FIELD'}];
  const pts: Pt[] = wps.map((p) => [p.x * M * 0.8, p.y * M * 0.8]);

  // ---------- procedural map (world coords centred on 0,0) ----------
  const map = React.useMemo(() => {
    const r = rng(seed);
    const G = 7;
    const cell = (2.4 * M) / G;
    const V: Pt[][] = [];
    for (let i = 0; i <= G; i++) {
      V.push([]);
      for (let j = 0; j <= G; j++) {
        const edge = i === 0 || j === 0 || i === G || j === G;
        V[i].push([-1.2 * M + i * cell + (edge ? 0 : (r() - 0.5) * cell * 0.55), -1.2 * M + j * cell + (edge ? 0 : (r() - 0.5) * cell * 0.55)]);
      }
    }
    const fills = ['#BFD186', '#C9D895', '#B1C474', '#D3DCA0', '#A9BE6C', '#C4D08A'];
    const fields: {pts: Pt[]; fill: string; hatch: number | null}[] = [];
    for (let i = 0; i < G; i++)
      for (let j = 0; j < G; j++) {
        const q = [V[i][j], V[i + 1][j], V[i + 1][j + 1], V[i][j + 1]] as Pt[];
        fields.push({pts: q, fill: fills[Math.floor(r() * fills.length)], hatch: r() < 0.45 ? r() * 180 : null});
      }
    // river
    const river: Pt[] = [];
    for (let k = 0; k <= 16; k++) {
      const x = -1.3 * M + (k / 16) * 2.6 * M;
      river.push([x, M * (0.05 + 0.32 * fbm(`river${seed}`, k * 0.22, 0.5, 3)) + Math.sin(k * 0.9) * M * 0.08]);
    }
    // trees
    const trees: {x: number; y: number; r: number; d: string; sd: string}[] = [];
    const nT = 16;
    for (let k = 0; k < nT; k++) {
      const big = k === 0;
      const tx = big ? M * 0.15 : (r() * 2 - 1) * 1.1 * M;
      const ty = big ? -M * 0.05 : (r() * 2 - 1) * 1.1 * M;
      const tr = big ? S * 0.13 : S * (0.03 + r() * 0.045);
      const n = big ? 14 : 9;
      const ring: Pt[] = [];
      for (let q = 0; q < n * 2; q++) {
        const a = (q / (n * 2)) * Math.PI * 2;
        const rr = tr * (q % 2 ? 0.88 : 1.04) * (0.94 + r() * 0.12);
        ring.push([tx + Math.cos(a) * rr, ty + Math.sin(a) * rr]);
      }
      trees.push({x: tx, y: ty, r: tr, d: smoothClosed(ring), sd: smoothClosed(ring.map(([x, y]) => [x + tr * 0.18, y + tr * 0.2]))});
    }
    // blossom patches near waypoints (not the first) + a few random
    const blossoms: {x: number; y: number; r: number; c: string}[] = [];
    const centres: Pt[] = [...pts.slice(1), ...Array.from({length: 4}, () => [(r() * 2 - 1) * M, (r() * 2 - 1) * M] as Pt)];
    centres.forEach(([cx, cy]) => {
      const n = 22 + Math.floor(r() * 16);
      for (let k = 0; k < n; k++) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * S * 0.07;
        blossoms.push({x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, r: S * (0.004 + r() * 0.004), c: ['#FBF3F0', '#F4C9D6', '#F2E27A', '#FFFFFF', '#E6A6B8'][Math.floor(r() * 5)]});
      }
    });
    const speck = Array.from({length: 260}, () => ({x: (r() * 2 - 1) * 1.2 * M, y: (r() * 2 - 1) * 1.2 * M, c: r() < 0.5 ? '#E9F0C8' : '#93A85C'}));
    return {fields, river, trees, blossoms, speck};
  }, [seed, M, S, pts.map((p) => p.join(',')).join(';')]);

  // ---------- route ----------
  const t0 = 18;
  const t1 = D - 36;
  const nSeg = pts.length - 1;
  const curve = React.useMemo(() => polyline(style === 'hop' ? pts : catmull(pts)), [style, pts.map((p) => p.join(',')).join(';')]);
  let pos: Pt;
  let heading: number;
  let routeS: number;
  let lift = 0;
  let landSquash = 1;
  let segIdx = 0;
  const segArr: number[] = [];
  if (style === 'hop') {
    const segDur = (t1 - t0) / nSeg;
    const k = Math.min(nSeg - 1, Math.max(0, Math.floor((frame - t0) / segDur)));
    const within = (frame - t0 - k * segDur) / segDur;
    const pHop = frame < t0 ? 0 : frame > t1 ? 1 : clamp(within / 0.62);
    const e = ease.inOut(pHop);
    const a = pts[k];
    const b = pts[k + 1];
    pos = frame > t1 ? pts[nSeg] : [lerp(a[0], b[0], e), lerp(a[1], b[1], e)];
    heading = Math.atan2(b[1] - a[1], b[0] - a[0]);
    lift = frame > t1 || frame < t0 ? 0 : Math.sin(Math.PI * pHop) * S * 0.035;
    const land = (within - 0.62) * segDur;
    landSquash = land >= 0 && land < 6 ? 1 - 0.14 * Math.sin((land / 6) * Math.PI) : 1;
    segIdx = k;
    let acc = 0;
    for (let i = 0; i < nSeg; i++) {
      segArr.push(acc);
      acc += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    }
    const done = segArr[k] + Math.hypot(b[0] - a[0], b[1] - a[1]) * e;
    routeS = frame > t1 ? 1 : done / curve.L;
  } else {
    routeS = prog(frame, t0, t1, ease.sine);
    const [x, y, a] = curve.at(routeS);
    pos = [x, y];
    heading = a;
    segIdx = Math.min(nSeg - 1, Math.floor(routeS * nSeg));
  }

  // camera: follow marker (smoothed), clamp to map
  const zoomNow = zoom * lerp(0.68, 0.84, prog(frame, 0, 40, ease.inOut));
  const camAt = (f: number): Pt => {
    if (style === 'hop') return pos;
    const [x, y] = curve.at(prog(f, t0, t1, ease.sine));
    return [x, y];
  };
  let cxW = 0;
  let cyW = 0;
  for (let k = 0; k < 8; k++) {
    const c = style === 'hop' ? pos : camAt(frame - k * 3);
    cxW += c[0] / 8;
    cyW += c[1] / 8;
  }
  if (style === 'hop') {
    // hop: ease the camera between landing spots
    const a = pts[segIdx];
    const b = pts[Math.min(nSeg, segIdx + 1)];
    const segDur = (t1 - t0) / nSeg;
    const within = clamp((frame - t0 - segIdx * segDur) / segDur);
    const e = ease.inOut(clamp(within / 0.9));
    cxW = lerp(a[0], b[0], e);
    cyW = lerp(a[1], b[1], e);
  }
  const halfW = w / 2 / zoomNow;
  const halfH = h / 2 / zoomNow;
  cxW = clamp(cxW, -1.2 * M + halfW, 1.2 * M - halfW);
  cyW = clamp(cyW, -1.2 * M + halfH, 1.2 * M - halfH);
  const toS = (x: number, y: number): Pt => [(x - cxW) * zoomNow + w / 2, (y - cyW) * zoomNow + h / 2];
  const camT = `translate(${w / 2},${h / 2}) scale(${zoomNow}) translate(${-cxW},${-cyW})`;

  // trail elements (world space)
  const trailEls: React.ReactNode[] = [];
  const dotGap = S * 0.026;
  if (style === 'hop') {
    for (let i = 0; i <= segIdx; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const n = Math.floor(len / dotGap);
      const segDur = (t1 - t0) / nSeg;
      const startF = t0 + i * segDur;
      for (let k = 1; k < n; k++) {
        const fk = startF + (k / n) * segDur * 0.62 * 0.95;
        if (frame < fk) break;
        const sc = ease.back(clamp((frame - fk) / 3));
        trailEls.push(<circle key={`d${i}-${k}`} cx={lerp(a[0], b[0], k / n)} cy={lerp(a[1], b[1], k / n)} r={S * 0.0055 * sc} fill={trailColor} />);
      }
    }
  } else {
    const drawn = routeS * curve.L;
    if (trail === 'dots') {
      for (let d = dotGap; d < drawn - dotGap * 0.6; d += dotGap) {
        const [x, y] = curve.at(d / curve.L);
        const sc = clamp((drawn - d) / (dotGap * 0.8));
        trailEls.push(<circle key={`t${Math.round(d)}`} cx={x} cy={y} r={S * 0.0045 * sc} fill={trailColor} />);
      }
    } else {
      const N = Math.max(2, Math.ceil(routeS * 400));
      const ptsT: Pt[] = Array.from({length: N + 1}, (_, k) => {
        const [x, y] = curve.at((k / N) * routeS);
        return [x, y];
      });
      trailEls.push(
        <path key="tl" d={smoothOpen(ptsT)} fill="none" stroke={trailColor} strokeWidth={(trail === 'dash' ? 2.6 : 1.8) * u} strokeLinecap="round" strokeDasharray={trail === 'dash' ? `${10 * u} ${8 * u}` : undefined} strokeDashoffset={trail === 'dash' ? frame * 1.2 * u : undefined} />,
      );
    }
  }

  // bearing vector from start to the final waypoint
  const A = pts[0];
  const Z = pts[pts.length - 1];
  const bearingRad = Math.atan2(Z[0] - A[0], -(Z[1] - A[1]));
  const bearingDeg = ((bearingRad * 180) / Math.PI + 360) % 360;
  const vecLen = Math.hypot(Z[0] - A[0], Z[1] - A[1]);
  const vecT = prog(frame, 8, 40, ease.inOut);
  const tickGap = S * 0.065;

  // waypoint landing frames
  const catmullIndex = (i: number) => (curve.cum[Math.min(i * 40, curve.cum.length - 1)] ?? 0) / curve.L;
  const reachFrame = (i: number) => {
    if (style === 'hop') return t0 + ((t1 - t0) / nSeg) * (i - 1) + ((t1 - t0) / nSeg) * 0.62;
    const target = catmullIndex(i);
    for (let f = t0; f <= t1; f++) if (prog(f, t0, t1, ease.sine) >= target - 0.002) return f;
    return t1;
  };

  const ink = '#2B2A22';
  const fsL = 16 * u;
  const distNow = distanceKm * routeS;

  // marker drawing (screen space)
  const [mx, my] = toS(pos[0], pos[1]);
  const ms = S * 0.034 * zoomNow;
  const flap = Math.sin(frame * 2.6);
  const markerEl =
    marker === 'bee' ? (
      <g transform={`translate(${mx},${my - lift * zoomNow}) rotate(${(heading * 180) / Math.PI + 90}) scale(${1 + lift / (S * 0.2)}, ${landSquash * (1 + lift / (S * 0.2))})`}>
        <ellipse cx={-ms * 0.55} cy={-ms * 0.05} rx={ms * 0.55} ry={ms * (0.28 + 0.06 * flap)} fill="#FFFFFF" opacity={0.55} transform={`rotate(${-25 + flap * 8})`} />
        <ellipse cx={ms * 0.55} cy={-ms * 0.05} rx={ms * 0.55} ry={ms * (0.28 + 0.06 * flap)} fill="#FFFFFF" opacity={0.55} transform={`rotate(${25 - flap * 8})`} />
        <ellipse cx={0} cy={ms * 0.35} rx={ms * 0.32} ry={ms * 0.55} fill="#C88838" stroke="#3A2414" strokeWidth={1.2 * u} />
        {[0.15, 0.4, 0.65].map((k) => (
          <rect key={k} x={-ms * 0.3} y={ms * k} width={ms * 0.6} height={ms * 0.1} fill="#3A2414" />
        ))}
        <ellipse cx={0} cy={-ms * 0.12} rx={ms * 0.24} ry={ms * 0.24} fill="#B98E52" stroke="#3A2414" strokeWidth={1.2 * u} />
        <circle cx={0} cy={-ms * 0.48} r={ms * 0.17} fill="#2A2421" />
      </g>
    ) : marker === 'pin' ? (
      <g transform={`translate(${mx},${my - lift * zoomNow}) scale(${1 / landSquash > 1 ? 1.06 : 1}, ${landSquash})`}>
        <path d={`M0 0 C${-ms * 0.2} ${-ms * 0.6} ${-ms * 0.75} ${-ms * 0.9} ${-ms * 0.75} ${-ms * 1.45} A${ms * 0.75} ${ms * 0.75} 0 1 1 ${ms * 0.75} ${-ms * 1.45} C${ms * 0.75} ${-ms * 0.9} ${ms * 0.2} ${-ms * 0.6} 0 0 Z`} fill={vectorColor} stroke={shade(vectorColor, -0.35)} strokeWidth={1.5 * u} />
        <circle cx={0} cy={-ms * 1.45} r={ms * 0.3} fill="#FBF3F0" />
      </g>
    ) : (
      <g>
        <circle cx={mx} cy={my - lift * zoomNow} r={ms * 0.9} fill={vectorColor} opacity={0.18 + 0.1 * Math.sin(frame * 0.3)} />
        <circle cx={mx} cy={my - lift * zoomNow} r={ms * 0.38} fill={vectorColor} stroke="#FFF" strokeWidth={2 * u} />
      </g>
    );

  const sunX = portrait ? w * 0.72 : w * 0.62;
  const sunY = 70 * u;

  return (
    <AbsoluteFill style={{background: paper}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          {map.fields.map((f, i) =>
            f.hatch !== null ? (
              <clipPath key={i} id={`mr-f${seed}-${i}`}>
                <polygon points={f.pts.map((p) => p.join(',')).join(' ')} />
              </clipPath>
            ) : null,
          )}
          <pattern id={`mr-hatch${seed}`} patternUnits="userSpaceOnUse" width={6 * u} height={6 * u} patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={6 * u} stroke="#2E4A22" strokeWidth={1.6 * u} strokeOpacity={0.55} />
          </pattern>
        </defs>
        <g transform={camT}>
          {map.fields.map((f, i) => (
            <g key={i}>
              <polygon points={f.pts.map((p) => p.join(',')).join(' ')} fill={f.fill} stroke="#93A862" strokeWidth={2.5 * u} strokeLinejoin="round" />
              {f.hatch !== null && (
                <g clipPath={`url(#mr-f${seed}-${i})`}>
                  {Array.from({length: 26}, (_, k) => {
                    const cxF = (f.pts[0][0] + f.pts[2][0]) / 2;
                    const cyF = (f.pts[0][1] + f.pts[2][1]) / 2;
                    const a = ((f.hatch as number) * Math.PI) / 180;
                    const off = (k - 13) * S * 0.018;
                    const L = S * 0.5;
                    const nx = -Math.sin(a);
                    const ny = Math.cos(a);
                    return <line key={k} x1={cxF + nx * off - Math.cos(a) * L} y1={cyF + ny * off - Math.sin(a) * L} x2={cxF + nx * off + Math.cos(a) * L} y2={cyF + ny * off + Math.sin(a) * L} stroke={shade(f.fill, -0.18)} strokeWidth={1.4 * u} strokeOpacity={0.7} />;
                  })}
                </g>
              )}
            </g>
          ))}
          {map.speck.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={1.6 * u} fill={s.c} opacity={0.7} />
          ))}
          <path d={smoothOpen(map.river)} fill="none" stroke="#6F98A8" strokeWidth={S * 0.034} strokeLinecap="round" />
          <path d={smoothOpen(map.river)} fill="none" stroke="#92BCCE" strokeWidth={S * 0.026} strokeLinecap="round" />
          <path d={smoothOpen(map.river)} fill="none" stroke="#C3DCE4" strokeWidth={1.6 * u} strokeDasharray={`${18 * u} ${26 * u}`} strokeDashoffset={-frame * 0.8 * u} strokeLinecap="round" />
          {map.trees.map((t, i) => (
            <g key={i}>
              <path d={t.sd} fill="#4E6B3A" opacity={0.5} />
              <path d={t.sd} fill={`url(#mr-hatch${seed})`} opacity={0.6} />
              <path d={t.d} fill={i === 0 ? '#6E8F4E' : '#7A9A55'} stroke="#3F5A2E" strokeWidth={1.5 * u} />
              <path d={t.d} fill="none" stroke="#9DBB72" strokeWidth={1.2 * u} strokeOpacity={0.6} transform={`translate(${-t.r * 0.08},${-t.r * 0.08}) scale(1)`} />
            </g>
          ))}
          {map.blossoms.map((b, i) => (
            <g key={i}>
              <circle cx={b.x} cy={b.y} r={b.r} fill={b.c} stroke="#B98A9A" strokeWidth={0.6 * u} />
              <circle cx={b.x} cy={b.y} r={b.r * 0.35} fill="#E8B04A" />
            </g>
          ))}
          {/* hive at the first waypoint */}
          <g transform={`translate(${A[0]},${A[1]})`}>
            <ellipse cx={0} cy={S * 0.012} rx={S * 0.034} ry={S * 0.012} fill="#000" opacity={0.18} />
            {[0, 1, 2, 3].map((k) => (
              <ellipse key={k} cx={0} cy={-k * S * 0.012} rx={S * (0.03 - k * 0.006)} ry={S * 0.009} fill={k % 2 ? '#E1A949' : '#C88838'} stroke="#7A4E1E" strokeWidth={u} />
            ))}
            <circle cx={0} cy={-S * 0.004} r={S * 0.004} fill="#3A2414" />
          </g>
          {/* bearing vector + ruler ticks + angle arc */}
          {showBearing && vecT > 0 && (
            <g>
              <line x1={A[0]} y1={A[1]} x2={A[0]} y2={A[1] - vecLen * 0.7 * vecT} stroke={vectorColor} strokeWidth={1.8 * u} strokeDasharray={`${6 * u} ${6 * u}`} strokeOpacity={0.8} />
              <line x1={A[0]} y1={A[1]} x2={A[0] + (Z[0] - A[0]) * vecT} y2={A[1] + (Z[1] - A[1]) * vecT} stroke={vectorColor} strokeWidth={2.4 * u} />
              {Array.from({length: Math.floor((vecLen * vecT) / tickGap)}, (_, k) => {
                const d = (k + 1) * tickGap;
                const ux = (Z[0] - A[0]) / vecLen;
                const uy = (Z[1] - A[1]) / vecLen;
                const tx = A[0] + ux * d;
                const ty = A[1] + uy * d;
                const big = (k + 1) % 4 === 0;
                const tl = (big ? 14 : 8) * u;
                return (
                  <g key={k}>
                    <line x1={tx - uy * tl} y1={ty + ux * tl} x2={tx + uy * tl} y2={ty - ux * tl} stroke={vectorColor} strokeWidth={1.6 * u} />
                    {big && (
                      <text x={tx + uy * 26 * u} y={ty - ux * 26 * u + 5 * u} textAnchor="middle" fill={vectorColor} fontFamily={fonts.mono} fontWeight={700} fontSize={13 * u}>
                        {`${((distanceKm * d) / vecLen).toFixed(1)}`}
                      </text>
                    )}
                  </g>
                );
              })}
              {(() => {
                const ra = S * 0.08;
                const a0 = -Math.PI / 2;
                const a1 = a0 + bearingRad * prog(frame, 20, 44, ease.out);
                const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
                const sweep = a1 > a0 ? 1 : 0;
                const am = (a0 + a1) / 2;
                return (
                  <g opacity={prog(frame, 20, 30)}>
                    <path d={`M${A[0] + Math.cos(a0) * ra} ${A[1] + Math.sin(a0) * ra} A${ra} ${ra} 0 ${large} ${sweep} ${A[0] + Math.cos(a1) * ra} ${A[1] + Math.sin(a1) * ra}`} fill="none" stroke={vectorColor} strokeWidth={2 * u} />
                    <text x={A[0] + Math.cos(am) * ra * 1.45} y={A[1] + Math.sin(am) * ra * 1.45 + 5 * u} textAnchor="middle" fill={vectorColor} fontFamily={fonts.mono} fontWeight={700} fontSize={15 * u}>
                      {`${Math.round(bearingDeg * prog(frame, 20, 44, ease.out))}°`}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
          {/* landing rings (hop) / waypoint rings */}
          {pts.slice(1).map((p, i) => {
            const rf = reachFrame(i + 1);
            const o = prog(frame, rf, rf + 8);
            if (o <= 0) return null;
            return <circle key={i} cx={p[0]} cy={p[1]} r={S * 0.03 * (1.3 - 0.3 * o)} fill="none" stroke={style === 'hop' ? '#C04040' : '#B19551'} strokeWidth={2.2 * u} opacity={o} />;
          })}
          {trailEls}
        </g>
        {/* sun + dashed tie line (screen space) */}
        {showSun && (
          <g opacity={prog(frame, 4, 16)}>
            <line x1={mx} y1={my} x2={sunX} y2={sunY} stroke={sunColor} strokeWidth={2 * u} strokeDasharray={`${4 * u} ${6 * u}`} />
            <circle cx={sunX} cy={sunY} r={16 * u} fill="#F3D27A" stroke={sunColor} strokeWidth={2 * u} />
            {Array.from({length: 8}, (_, k) => {
              const a = (k / 8) * Math.PI * 2 + frame * 0.01;
              return <line key={k} x1={sunX + Math.cos(a) * 22 * u} y1={sunY + Math.sin(a) * 22 * u} x2={sunX + Math.cos(a) * 32 * u} y2={sunY + Math.sin(a) * 32 * u} stroke={sunColor} strokeWidth={2.4 * u} strokeLinecap="round" />;
            })}
          </g>
        )}
        {/* marker shadow + marker */}
        <ellipse cx={mx + 4 * u} cy={my + 6 * u} rx={ms * 0.55 * (1 - lift / (S * 0.08))} ry={ms * 0.3 * (1 - lift / (S * 0.08))} fill="#000" opacity={0.18} />
        {markerEl}
        {/* waypoint labels */}
        {wps.map((p, i) => {
          const rf = i === 0 ? 10 : reachFrame(i);
          const o = prog(frame, rf, rf + 6);
          if (o <= 0 || !p.label) return null;
          const [sx, sy] = toS(pts[i][0], pts[i][1]);
          const right = sx < w * 0.7;
          const lx = sx + (right ? 1 : -1) * 46 * u;
          const ly = sy - 40 * u;
          const tw = p.label.length * fsL * 0.62 * 1.18 + 20 * u;
          return (
            <g key={i} opacity={o}>
              <circle cx={sx} cy={sy} r={4 * u} fill={ink} />
              <line x1={sx} y1={sy} x2={lx} y2={ly + 6 * u} stroke={ink} strokeWidth={1.2 * u} />
              <rect x={right ? lx : lx - tw} y={ly - fsL * 1.1} width={tw} height={fsL * 1.7} fill="#F6F1E4" fillOpacity={0.92} stroke={ink} strokeWidth={1 * u} />
              <text x={right ? lx + 10 * u : lx - tw + 10 * u} y={ly + fsL * 0.12} fill={ink} fontFamily={fonts.mono} fontWeight={700} fontSize={fsL} letterSpacing={fsL * 0.18}>
                {p.label.toUpperCase().slice(0, Math.ceil(p.label.length * clamp((frame - rf) / 10)))}
              </text>
            </g>
          );
        })}
        {/* data readout */}
        <g opacity={prog(frame, 6, 16)} fontFamily={fonts.mono}>
          <rect x={36 * u} y={h - 112 * u} width={250 * u} height={76 * u} fill="#F6F1E4" fillOpacity={0.9} stroke={ink} strokeWidth={u} />
          <text x={52 * u} y={h - 84 * u} fill={ink} fontSize={14 * u} letterSpacing={14 * u * 0.2} opacity={0.7}>
            {`BRG ${String(Math.round(bearingDeg)).padStart(3, '0')}°`}
          </text>
          <text x={52 * u} y={h - 52 * u} fill={ink} fontSize={22 * u} fontWeight={700} letterSpacing={22 * u * 0.06}>
            {`${distNow.toFixed(2)} km`}
          </text>
        </g>
      </svg>
      <PaperTexture opacity={0.32} />
      <FilmGrain opacity={0.06} />
    </AbsoluteFill>
  );
};

const MapRouteRoot: React.FC<Props> = (p) => (p.style === 'range' ? <RangeMode from={p.from} to={p.to} distanceKm={p.distanceKm} unit={p.unit} src={p.src} corridor={p.corridor} chase={p.chase} labelA={p.labelA} labelB={p.labelB} seed={p.seed} trailColor={p.trailColor === '#24221C' ? '#E8A93A' : p.trailColor} /> : <MapRoute {...p} />);

export const mapRoute = defineMotion<Props>({
  id: 'map-route',
  title: 'Map route',
  category: 'data',
  description: 'Top-down illustrated paper map (fields, river, trees, blossoms) with a marker flying a curved dotted route, a red bearing vector with angle arc and distance ticks, a dashed line to the sun; hop style hops leg by leg leaving popping dots.',
  source: ['video6 32-40 s (map-flight-path, waggle-dance-diagram)', 'video22 (hop-move-dotted-trail)'],
  useFor: 'Journeys, routes, foraging / delivery paths, travel distances, "from A to B" explainers.',
  durationInFrames: 270,
  defaultProps: {
    waypoints: [
      {x: -0.62, y: 0.55, label: 'Hive'},
      {x: -0.18, y: 0.12, label: 'Clover'},
      {x: 0.32, y: 0.32, label: 'Orchard'},
      {x: 0.6, y: -0.25, label: 'Lavender'},
      {x: 0.12, y: -0.62, label: 'Meadow'},
    ],
    style: 'flight',
    trail: 'dots',
    marker: 'bee',
    showBearing: true,
    showSun: true,
    distanceKm: 2.4,
    seed: 6,
    paper: '#C0D288',
    trailColor: '#24221C',
    vectorColor: '#C83230',
    sunColor: '#E8A93A',
    zoom: 1,
    from: [0.2, 0.68] as [number, number],
    to: [0.8, 0.32] as [number, number],
    unit: 'km',
    src: '',
    corridor: true,
    chase: true,
    labelA: 'A',
    labelB: 'B',
  },
  propDocs: {
    waypoints: 'route stops {x, y, label} in map space -1..1 (first = start, last = bearing target)',
    style: 'flight = smooth curve; hop = straight legs with hop arcs, popping dots and landing rings; range = ticked measuring line A to B over imagery (camera chases the tip, pulls back, reading lands)',
    from: 'range: start point as frame fractions [x, y]',
    to: 'range: end point as frame fractions [x, y]',
    unit: 'range: unit shown after the rolling value',
    src: 'range: public/ image used as the ground (empty = procedural satellite-style ground)',
    corridor: 'range: light a corridor along the line and dim the rest',
    chase: 'range: camera follows the line tip then pulls back',
    labelA: 'range: label of the start marker',
    labelB: 'range: label of the end marker',
    trail: 'dots | dash (marching) | line',
    marker: 'bee | pin | dot',
    showBearing: 'red bearing vector, angle arc and distance ticks from the start',
    showSun: 'sun icon with dashed tie line to the marker',
    distanceKm: 'distance shown at the end of the route',
    seed: 'map layout seed',
    paper: 'map base colour',
    zoom: 'camera zoom',
  },
  component: MapRouteRoot,
  tags: ['map', 'route', 'journey', 'path', 'distance', 'travel', 'range line', 'measure', 'how far', 'satellite', 'ruler'],
});
