// Shared flat-map helpers for the round-3 map motions (pin-drop-cluster, flight-arcs, city-zoom-label, ...).
// Land comes from the baked Natural Earth coastline in r2-mg2a-land.ts (public domain).
import React from 'react';
import {deg, landRings} from './r2-mg2a-kit';

export type GeoView = {lon: number; lat: number; k: number; cx: number; cy: number};
export type LonLat = [number, number];

/** plate-carree with a constant cos(lat) squeeze for the view centre; k = px per degree of latitude */
export const project = (v: GeoView, lon: number, lat: number): [number, number] => {
  const cs = Math.cos(v.lat * deg);
  return [v.cx + (lon - v.lon) * v.k * cs, v.cy - (lat - v.lat) * v.k];
};

export const lerpView = (a: GeoView, b: GeoView, t: number, tz = t): GeoView => ({
  lon: a.lon + (b.lon - a.lon) * t,
  lat: a.lat + (b.lat - a.lat) * t,
  k: Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * tz),
  cx: a.cx + (b.cx - a.cx) * t,
  cy: a.cy + (b.cy - a.cy) * t,
});

export type Box = {x0: number; y0: number; x1: number; y1: number};

/** view that frames all points inside a pixel box (minSpan = smallest framed span in degrees) */
export const fitView = (pts: LonLat[], box: Box, minSpan = 10, maxK = 400): GeoView => {
  const list = pts.length ? pts : ([[0, 0]] as LonLat[]);
  let lo = 1e9, hi = -1e9, la0 = 1e9, la1 = -1e9;
  for (const [lon, lat] of list) {
    lo = Math.min(lo, lon); hi = Math.max(hi, lon);
    la0 = Math.min(la0, lat); la1 = Math.max(la1, lat);
  }
  const lat = (la0 + la1) / 2;
  const cs = Math.max(0.2, Math.cos(lat * deg));
  const spanLon = Math.max(minSpan, hi - lo);
  const spanLat = Math.max(minSpan * 0.6, la1 - la0);
  const k = Math.min(maxK, (box.x1 - box.x0) / (spanLon * cs), (box.y1 - box.y0) / spanLat);
  return {lon: (lo + hi) / 2, lat, k, cx: (box.x0 + box.x1) / 2, cy: (box.y0 + box.y1) / 2};
};

/** great-circle points between two lon/lat pairs; longitudes are unwrapped continuously from `a` */
export const greatCircle = (a: LonLat, b: LonLat, n = 64): LonLat[] => {
  const v = ([lon, lat]: LonLat): [number, number, number] => [Math.cos(lat * deg) * Math.cos(lon * deg), Math.cos(lat * deg) * Math.sin(lon * deg), Math.sin(lat * deg)];
  const A = v(a), B = v(b);
  const dot = Math.min(1, Math.max(-1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]));
  const om = Math.acos(dot);
  const out: LonLat[] = [];
  let prevLon = a[0];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    let p: [number, number, number];
    if (om < 1e-6) p = A;
    else {
      const s0 = Math.sin((1 - t) * om) / Math.sin(om), s1 = Math.sin(t * om) / Math.sin(om);
      p = [A[0] * s0 + B[0] * s1, A[1] * s0 + B[1] * s1, A[2] * s0 + B[2] * s1];
    }
    let lon = (Math.atan2(p[1], p[0]) / deg);
    while (lon - prevLon > 180) lon -= 360;
    while (lon - prevLon < -180) lon += 360;
    prevLon = lon;
    out.push([lon, Math.asin(Math.max(-1, Math.min(1, p[2]))) / deg]);
  }
  return out;
};

/** the land + graticule layer */
export const LandLayer: React.FC<{
  view: GeoView; w: number; h: number; u: number;
  fill: string; stroke: string; strokeWidth?: number;
  grid?: string; gridOpacity?: number; fillOpacity?: number;
}> = ({view, w, h, u, fill, stroke, strokeWidth = 1.2, grid, gridOpacity = 0.12, fillOpacity = 1}) => {
  const cs = Math.cos(view.lat * deg);
  const d = React.useMemo(() => {
    const parts: string[] = [];
    const m = 120;
    for (const ring of landRings()) {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      const pts: string[] = [];
      for (const [lon, lat] of ring) {
        const [x, y] = project(view, lon, lat);
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
      }
      if (x1 < -m || x0 > w + m || y1 < -m || y0 > h + m) continue;
      parts.push('M' + pts.join('L') + 'Z');
    }
    return parts.join('');
  }, [view.lon, view.lat, view.k, view.cx, view.cy, w, h]);
  // graticule
  const lines: React.ReactNode[] = [];
  if (grid) {
    const steps = [30, 15, 10, 5, 2, 1, 0.5, 0.25, 0.1];
    const step = steps.find((s) => s * view.k >= 70 * u) ?? 0.05;
    const lonMin = view.lon - view.cx / (view.k * cs), lonMax = view.lon + (w - view.cx) / (view.k * cs);
    const latMax = view.lat + view.cy / view.k, latMin = view.lat - (h - view.cy) / view.k;
    for (let lon = Math.ceil(Math.max(lonMin, -180) / step) * step, n = 0; lon <= Math.min(lonMax, 180) && n < 80; lon += step, n++) {
      const x = project(view, lon, 0)[0];
      lines.push(<line key={'m' + n} x1={x} x2={x} y1={0} y2={h} />);
    }
    for (let lat = Math.ceil(Math.max(latMin, -85) / step) * step, n = 0; lat <= Math.min(latMax, 85) && n < 80; lat += step, n++) {
      const y = project(view, 0, lat)[1];
      lines.push(<line key={'p' + n} x1={0} x2={w} y1={y} y2={y} />);
    }
  }
  return (
    <g>
      {grid ? <g stroke={grid} strokeOpacity={gridOpacity} strokeWidth={1 * u}>{lines}</g> : null}
      <path d={d} fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={strokeWidth * u} strokeLinejoin="round" />
    </g>
  );
};

/** map area below a title block (landscape: top band, portrait: taller band) */
export const mapBox = (w: number, h: number, u: number, portrait: boolean, top = 190): Box =>
  portrait ? {x0: 70 * u, y0: top * u * 1.9, x1: w - 70 * u, y1: h - 150 * u} : {x0: 90 * u, y0: top * u, x1: w - 90 * u, y1: h - 80 * u};
