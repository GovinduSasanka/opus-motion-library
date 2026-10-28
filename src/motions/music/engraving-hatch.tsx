// Adapted from pdoom-video/app/src/engine/glsl/common.ts hatch()/engrave() + ilya-glsl.ts moiré-free notes (MIT, © 2026 Giacomo Magnanini) — see THIRD_PARTY_NOTICES.md
// Re-expressed in SVG: contour lines whose width follows the light (white-line engraving), band-limited spacing.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {E, TREATISE, TreatiseFinish, clamp01, lerpN, noise1, plexMono} from '../../core/r2-music-kit';

type Props = {
  subject: 'sphere' | 'terrain';
  lines: number;
  lightSpeed: number;
  spin: number;
  engraveSec: number;
  background: string;
  ink: string;
  rim: string;
  caption: string;
  labels: boolean;
};

type P2 = [number, number];
/** ribbon polygon from a centreline with per-point half-widths */
const ribbon = (pts: P2[], hw: number[]) => {
  if (pts.length < 2) return '';
  const L: P2[] = [];
  const R: P2[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l;
    const ny = dx / l;
    L.push([pts[i][0] + nx * hw[i], pts[i][1] + ny * hw[i]]);
    R.push([pts[i][0] - nx * hw[i], pts[i][1] - ny * hw[i]]);
  }
  const all = [...L, ...R.reverse()];
  return 'M' + all.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L') + ' Z';
};

const EngravingHatch: React.FC<Props> = ({subject, lines, lightSpeed, spin, engraveSec, background, ink, rim, caption, labels}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const clear = background === 'transparent';
  // light orbits slowly; rim light comes from behind-right
  const la = -0.9 + t * lightSpeed;
  const Lx = Math.cos(la) * 0.75;
  const Ly = -0.45;
  const Lz = Math.sin(la) * 0.4 + 0.55;
  const Ll = Math.hypot(Lx, Ly, Lz);
  const L = [Lx / Ll, Ly / Ll, Lz / Ll];
  const mono = 13 * u * (portrait ? 1.25 : 1);
  const paths: React.ReactNode[] = [];
  const rims: React.ReactNode[] = [];
  const engrave = (i: number, n: number) => clamp01((t + 0.15 - (i / n) * engraveSec * 0.6) / (engraveSec * 0.3));
  const minGap = 2.2 * u; // band-limit: lines never closer than ~2 px at 1080
  if (subject === 'sphere') {
    const R = Math.min(w, h) * (portrait ? 0.3 : 0.3);
    const cx = w / 2;
    const cy = h * (portrait ? 0.44 : 0.46);
    const n = Math.max(12, Math.min(Math.round(lines), Math.floor((2 * R) / minGap / 2)));
    const tilt = 0.42 + 0.18 * Math.sin(t * spin * 2);
    const rot = 0;
    // ground: horizontal lines with a cast shadow ellipse where lines thin out
    const gy0 = cy + R * 0.95;
    const shx = cx - L[0] * R * 1.1;
    const gl = Math.floor((h - gy0) / (minGap * 4));
    for (let k = 0; k < gl; k++) {
      const y = gy0 + k * minGap * 4 * (1 + k * 0.05);
      if (y > h) break;
      const pts: P2[] = [];
      const hw: number[] = [];
      for (let s = 0; s <= 60; s++) {
        const x = (s / 60) * w;
        const dx = (x - shx) / (R * 1.3);
        const dy = (y - (gy0 + R * 0.12)) / (R * 0.28);
        const inShadow = clamp01(1.2 - Math.hypot(dx, dy));
        pts.push([x, y]);
        hw.push(Math.max(0.15, (0.75 - 0.6 * inShadow) * u * (1 - k / gl) * 0.9));
      }
      paths.push(<path key={'g' + k} d={ribbon(pts, hw)} fill={ink} opacity={0.55 * engrave(k, gl)} />);
    }
    // latitude contour lines on a tilted, spinning sphere (orthographic), width = lit-ness
    for (let i = 0; i < n; i++) {
      const lat = lerpN(-Math.PI / 2 + 0.06, Math.PI / 2 - 0.06, (i + 0.5) / n);
      const runs: {pts: P2[]; hw: number[]}[] = [];
      let cur: {pts: P2[]; hw: number[]} | null = null;
      const prog = engrave(i, n);
      const steps = 90;
      const vis = Math.floor(steps * E.outCubic(prog));
      for (let s = 0; s <= vis; s++) {
        const lon = (s / steps) * Math.PI * 2 + rot;
        // sphere point
        let x = Math.cos(lat) * Math.cos(lon);
        let y = Math.sin(lat);
        let z = Math.cos(lat) * Math.sin(lon);
        // tilt about x
        const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
        const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
        y = y2;
        z = z2;
        if (z <= 0.02) {
          if (cur) runs.push(cur);
          cur = null;
          continue;
        }
        const lit = Math.max(0, x * L[0] + -y * L[1] + z * L[2]);
        const b = Math.pow(lit, 0.85);
        if (!cur) cur = {pts: [], hw: []};
        cur.pts.push([cx + x * R, cy - y * R]);
        // white-line: lit areas get thick bright lines; foreshortening near the limb thins them
        cur.hw.push((0.12 + 1.35 * b) * u * (0.45 + 0.55 * Math.sqrt(z)));
        x = x;
      }
      if (cur) runs.push(cur);
      runs.forEach((r, k) => paths.push(<path key={`s${i}-${k}`} d={ribbon(r.pts, r.hw)} fill={ink} />));
    }
    // hot rim light on the silhouette facing the back light
    const rimDir = Math.atan2(-0.35, 0.94);
    for (let s = 0; s < 72; s++) {
      const a = (s / 72) * Math.PI * 2;
      const facing = Math.cos(a - rimDir);
      if (facing < 0.15) continue;
      const a2 = a + (Math.PI * 2) / 72;
      const k = Math.pow(facing, 2) * clamp01((t - engraveSec * 0.6) / 0.6);
      rims.push(<path key={'r' + s} d={`M${cx + Math.cos(a) * R} ${cy + Math.sin(a) * R} A${R} ${R} 0 0 1 ${cx + Math.cos(a2) * R} ${cy + Math.sin(a2) * R}`} fill="none" stroke={rim} strokeWidth={Math.max(1, 3.5 * u * k)} strokeLinecap="round" opacity={k} />);
    }
  } else {
    // terrain: horizontal profile lines displaced by height; width by slope facing the light
    const n = Math.max(12, Math.min(Math.round(lines), Math.floor((h * 0.7) / (minGap * 3))));
    const top = h * 0.2;
    const bottom = h * 0.9;
    const H = (x: number, z: number) => {
      const ridge = Math.exp(-Math.pow((x - 0.5) / 0.22, 2)) * 0.9;
      return (ridge * (0.55 + 0.45 * noise1(x * 6 + z * 3 + 4, 3)) + 0.18 * noise1(x * 17 + z * 9, 5)) * (0.35 + 0.65 * z);
    };
    for (let i = 0; i < n; i++) {
      const z = i / (n - 1);
      const y0 = lerpN(top, bottom, z);
      const amp = h * 0.16 * (0.4 + 0.6 * z);
      const prog = engrave(i, n);
      const steps = 120;
      const vis = Math.floor(steps * E.outCubic(prog));
      const pts: P2[] = [];
      const hw: number[] = [];
      for (let s = 0; s <= vis; s++) {
        const xx = s / steps;
        const hgt = H(xx, z) + 0.05 * Math.sin(t * 0.8 + xx * 6);
        const slope = (H(xx + 0.01, z) - H(xx - 0.01, z)) / 0.02;
        const lit = clamp01(0.5 - slope * L[0] * 0.6 + hgt * 0.4);
        pts.push([w * 0.04 + xx * w * 0.92, y0 - hgt * amp]);
        hw.push((0.15 + 1.3 * Math.pow(lit, 1.2)) * u * (0.5 + 0.5 * z));
      }
      paths.push(<path key={'t' + i} d={ribbon(pts, hw)} fill={ink} />);
      if (i % 4 === 0 && pts.length > 10 && labels) {
        const [lx, ly] = pts[Math.min(pts.length - 1, 8)];
        paths.push(
          <text key={'tl' + i} x={lx} y={ly - 6 * u} fontFamily={plexMono} fontSize={mono * 0.8} fill={ink} opacity={0.5 * prog}>
            {`1e-${i / 4 + 3}`}
          </text>,
        );
      }
    }
    // the orange path of the spark: the one thing that glows
    const sk = clamp01((t - engraveSec * 0.7) / 3);
    const sp: P2[] = [];
    for (let s = 0; s <= 80 * sk; s++) {
      const z = s / 80;
      const xx = 0.5 + 0.12 * Math.sin(z * 5);
      sp.push([w * 0.04 + xx * w * 0.92, lerpN(top, bottom, z) - H(xx, z) * h * 0.16 * (0.4 + 0.6 * z)]);
    }
    if (sp.length > 1) rims.push(<path key="spark" d={'M' + sp.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')} fill="none" stroke={rim} strokeWidth={Math.max(1.5, 2.5 * u)} strokeLinecap="round" />);
    if (sp.length > 1) {
      const [hx, hy] = sp[sp.length - 1];
      rims.push(<circle key="sh" cx={hx} cy={hy} r={6 * u} fill={TREATISE.hot} />);
      rims.push(<circle key="sh2" cx={hx} cy={hy} r={18 * u} fill={rim} opacity={0.25} />);
    }
  }
  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <g>{paths}</g>
        <g>{rims}</g>
        {labels ? (
          <g fontFamily={plexMono} fontSize={mono} fill={ink} opacity={0.65} letterSpacing={2}>
            <text x={w * 0.05} y={h * 0.08}>{caption}</text>
            <text x={w * 0.95} y={h * 0.08} textAnchor="end">{`LIGHT ${Math.round((((la * 180) / Math.PI) % 360 + 360) % 360)}°`}</text>
            <text x={w * 0.05} y={h * 0.95} opacity={0.7}>{`${Math.round(lines)} LINES · WIDTH ∝ LIGHT · MIN GAP ${minGap.toFixed(1)}PX`}</text>
          </g>
        ) : null}
      </svg>
      {!clear ? <TreatiseFinish grain={0.07} vignette={0.4} /> : null}
    </AbsoluteFill>
  );
};

export const engravingHatch = defineMotion<Props>({
  id: 'engraving-hatch',
  title: 'Engraving hatch (white-line plate)',
  category: 'music',
  description:
    'A white-line scratchboard engraving cuts itself on near-black: contour lines follow the form of a slowly turning sphere (or a ridge terrain), each line swelling where the light hits and thinning to a hair in shadow, a ground plate with a cast shadow, a hot orange rim light (or spark path) as the only glowing thing, deadpan figure labels.',
  source: ['pdoom-video app/src/engine/glsl/common.ts hatch()/engrave(), ilya-glsl.ts band-limited spacing (MIT); SVG re-expression'],
  useFor: 'Treatise / banknote / scientific-plate looks, “engraved” product or concept renders, premium editorial backdrops behind lyrics or titles.',
  durationInFrames: 240,
  defaultProps: {
    subject: 'sphere',
    lines: 64,
    lightSpeed: 0.35,
    spin: 0.18,
    engraveSec: 3,
    background: TREATISE.ink,
    ink: TREATISE.bone,
    rim: TREATISE.signal,
    caption: 'FIG. 3 — ENGRAVED SPHERE',
    labels: true,
  },
  propDocs: {
    subject: "'sphere' (contour latitudes, rim light) or 'terrain' (ridge profile lines + orange spark path)",
    lines: 'number of engraved lines (auto-limited so they never get closer than ~2 px — no moiré)',
    lightSpeed: 'how fast the light orbits (rad/s)',
    spin: 'how fast the sphere nods on its tilt axis',
    engraveSec: 'seconds for the plate to cut itself in',
    background: "plate colour or 'transparent'",
    ink: 'line colour (bone on ink = white-line engraving)',
    rim: 'rim light / spark colour',
    caption: 'figure caption',
    labels: 'mono figure labels',
  },
  component: EngravingHatch,
  tags: ['engraving', 'hatching', 'scratchboard', 'white line', 'line art', 'sphere', 'terrain', 'contour', 'banknote', 'treatise', 'scientific plate', 'rim light', 'editorial', 'backdrop'],
});
