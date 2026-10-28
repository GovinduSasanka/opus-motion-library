// Adapted from lemo-opuscar styles/telestrator/demo/index.html (marker, ring, comet, trail) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  backOut, catmull, cl, eo3, lerp, polyAt, polyLen, polyPart, polyTable, ptsD, seg, stepFrame, TAU, useUid, type Pt,
} from '../../core/r2-lb3a-kit';
import {nz} from '../../core/r2-lb3a-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Item = {
  type: 'arrow' | 'ring' | 'comet' | 'area';
  pts?: [number, number][];
  x?: number;
  y?: number;
  r?: number;
  color?: string;
  at?: number;
  dur?: number;
  dash?: boolean;
  wobble?: number;
};

type Props = {
  items: Item[];
  palette: {did: string; plan: string; alert: string; focus: string};
  weight: number;
  scene: 'pitch' | 'grid' | 'none';
  background: string;
  ringSquash: number;
  trail: number;
  boil: boolean;
};

const FPS = 30;

const MarkerRingArrow: React.FC<Props> = ({items, palette, weight, scene, background, ringSquash, trail, boil}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const uid = useUid('mra');
  const t = frame / FPS;
  const bf = boil ? stepFrame(frame, 12) : 0;
  const px = (p: Pt): Pt => [p[0] * w, p[1] * h];
  const roleOf = (c?: string) => (c && (palette as Record<string, string>)[c]) || c || palette.did;

  const wob = (pts: Pt[], amp: number, seed: string): Pt[] =>
    amp <= 0 ? pts : pts.map((p, i) => [p[0] + nz(seed + 'x', i * 0.7, bf * 0.31) * amp * u, p[1] + nz(seed + 'y', i * 0.7 + 9, bf * 0.31) * amp * u]);

  /** four stacked strokes: dark outline, glow, colour core, white highlight */
  const Marker: React.FC<{pts: Pt[]; color: string; wpx: number; dash?: string; off?: number; closed?: boolean; fillOpacity?: number}> = ({pts, color, wpx, dash, off = 0, closed, fillOpacity = 0}) => {
    const d = ptsD(pts, closed);
    const common = {fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeDasharray: dash, strokeDashoffset: off};
    return (
      <g>
        {fillOpacity > 0 && <path d={d} fill={color} fillOpacity={fillOpacity} stroke="none" />}
        <path d={d} {...common} stroke="#000" strokeOpacity={0.55} strokeWidth={wpx + 6 * u} />
        <path d={d} {...common} stroke={color} strokeWidth={wpx * 1.4} filter={`url(#${uid}-glow)`} opacity={0.9} />
        <path d={d} {...common} stroke={color} strokeWidth={wpx} />
        <path d={d} {...common} stroke="#fff" strokeOpacity={0.55} strokeWidth={wpx * 0.28} />
      </g>
    );
  };

  const Head: React.FC<{tip: Pt; ang: number; size: number; color: string; k: number}> = ({tip, ang, size, color, k}) => {
    if (k <= 0) return null;
    const s = size * k;
    const c = Math.cos(ang);
    const sn = Math.sin(ang);
    const P = (a: number, b: number): Pt => [tip[0] + a * c - b * sn, tip[1] + a * sn + b * c];
    const poly = [P(s * 0.55, 0), P(-s * 0.45, -s * 0.55), P(-s * 0.15, 0), P(-s * 0.45, s * 0.55)];
    const d = ptsD(poly, true);
    return (
      <g>
        <path d={d} fill="#000" fillOpacity={0.55} stroke="#000" strokeOpacity={0.55} strokeWidth={6 * u} strokeLinejoin="round" />
        <path d={d} fill={color} filter={`url(#${uid}-glow)`} opacity={0.85} />
        <path d={d} fill={color} stroke={color} strokeWidth={2 * u} strokeLinejoin="round" />
        <path d={ptsD([poly[0], poly[1], poly[2]], true)} fill="#fff" fillOpacity={0.32} />
      </g>
    );
  };

  const nodes = items.map((it, idx) => {
    const at = (it.at ?? 0) * FPS;
    const dur = Math.max(4, (it.dur ?? 1) * FPS);
    const col = roleOf(it.color);
    const wpx = weight * u;
    const seed = `${uid}${idx}`;
    const exit = 1 - seg(frame, at + dur + 110, at + dur + 135); // slow fade near the end of life
    if (frame < at) return null;
    const p = seg(frame, at, at + dur);

    if (it.type === 'arrow' && it.pts && it.pts.length >= 2) {
      const base = wob(catmull(it.pts.map(px), 10), it.wobble ?? 2.5, seed);
      const tab = polyTable(base);
      const L = tab[tab.length - 1];
      const e = eo3(p);
      const part = polyPart(base, tab, e);
      const dashOn = it.dash ? `${wpx * 2.3} ${wpx * 1.7}` : undefined;
      const tip = polyAt(base, tab, e);
      const headK = it.dash ? 0 : backOut(seg(p, 0.88, 1));
      // dashed (intended) arrows get an open chevron head instead of a solid one
      return (
        <g key={idx} opacity={exit}>
          <Marker pts={part} color={col} wpx={wpx} dash={dashOn} />
          {!it.dash && <Head tip={[tip.x, tip.y]} ang={tip.a} size={wpx * 3.2} color={col} k={headK} />}
          {it.dash && p > 0.9 && (
            <Marker
              pts={[[tip.x - Math.cos(tip.a - 0.5) * wpx * 3, tip.y - Math.sin(tip.a - 0.5) * wpx * 3], [tip.x, tip.y], [tip.x - Math.cos(tip.a + 0.5) * wpx * 3, tip.y - Math.sin(tip.a + 0.5) * wpx * 3]]}
              color={col}
              wpx={wpx * 0.9}
            />
          )}
        </g>
      );
    }

    if (it.type === 'ring') {
      const cx = (it.x ?? 0.5) * w;
      const cy = (it.y ?? 0.5) * h;
      const r = (it.r ?? 0.07) * Math.min(w, h);
      const pulse = 1 + 0.035 * Math.sin((frame - at) * 0.21);
      const ring: Pt[] = Array.from({length: 73}, (_, i) => {
        const a = -Math.PI / 2 + (i / 72) * TAU;
        return [cx + Math.cos(a) * r * pulse, cy + Math.sin(a) * r * ringSquash * pulse] as Pt;
      });
      const tab = polyTable(ring);
      const e = eo3(p);
      const part = polyPart(ring, tab, e);
      const L = polyLen(ring);
      const dash = `${L * 0.085} ${L * 0.045}`;
      const off = -(frame - at) * 2.2 * u;
      return (
        <g key={idx} opacity={exit}>
          <ellipse cx={cx} cy={cy} rx={r} ry={r * ringSquash} fill={col} fillOpacity={0.14 * e} />
          <Marker pts={part} color={col} wpx={wpx * 0.85} dash={dash} off={off} />
        </g>
      );
    }

    if (it.type === 'comet' && it.pts && it.pts.length >= 2) {
      const base = catmull(it.pts.map(px), 12);
      const tab = polyTable(base);
      const sOf = (fr: number) => eo3(seg(fr, at, at + dur));
      const N = 22;
      const winF = Math.min(0.6, trail) * FPS;
      const segs: React.ReactNode[] = [];
      for (let k = N - 1; k >= 0; k--) {
        const a = polyAt(base, tab, sOf(frame - (k * winF) / N));
        const b = polyAt(base, tab, sOf(frame - ((k + 1) * winF) / N));
        const f = 1 - k / N;
        segs.push(
          <line key={k} x1={b.x} y1={b.y} x2={a.x} y2={a.y} stroke={col} strokeOpacity={Math.pow(f, 1.4) * 0.95} strokeWidth={lerp(4, 18, f) * u} strokeLinecap="round" />,
        );
      }
      const head = polyAt(base, tab, sOf(frame));
      const arrived = seg(frame, at + dur, at + dur + 20);
      const ex = 1 - seg(frame, at + dur + 20, at + dur + 55);
      return (
        <g key={idx} opacity={exit * ex}>
          <g filter={`url(#${uid}-glow)`}>{segs}</g>
          <g>{segs}</g>
          <circle cx={head.x} cy={head.y} r={(11 + arrived * 4) * u} fill="#000" fillOpacity={0.5} />
          <circle cx={head.x} cy={head.y} r={9 * u} fill={col} />
          <circle cx={head.x - 2 * u} cy={head.y - 2 * u} r={3.4 * u} fill="#fff" fillOpacity={0.7} />
        </g>
      );
    }

    if (it.type === 'area' && it.pts && it.pts.length >= 3) {
      const poly = it.pts.map(px);
      const closed: Pt[] = [...poly, poly[0]];
      const tab = polyTable(closed);
      const e = eo3(p);
      const part = polyPart(closed, tab, e);
      return (
        <g key={idx} opacity={exit}>
          <path d={ptsD(poly, true)} fill={col} fillOpacity={0.2 * seg(p, 0.5, 1)} />
          <Marker pts={part} color={col} wpx={wpx * 0.75} dash={`${wpx * 2} ${wpx * 1.5}`} off={-(frame - at) * 1.2 * u} />
        </g>
      );
    }
    return null;
  });

  const Backdrop = () => {
    if (scene === 'none') return null;
    const line = 'rgba(255,255,255,0.28)';
    if (scene === 'grid') {
      const step = 90 * u;
      return (
        <g stroke={line} strokeWidth={1.2 * u} opacity={0.6}>
          {Array.from({length: Math.ceil(w / step) + 1}, (_, i) => <line key={'v' + i} x1={i * step} y1={0} x2={i * step} y2={h} />)}
          {Array.from({length: Math.ceil(h / step) + 1}, (_, i) => <line key={'h' + i} x1={0} y1={i * step} x2={w} y2={i * step} />)}
        </g>
      );
    }
    const m = 0.06;
    const px0 = w * m;
    const py0 = h * m;
    const pw = w * (1 - 2 * m);
    const ph = h * (1 - 2 * m);
    const stripes = 10;
    const dots: {x: number; y: number; c: string}[] = [
      ...[[0.2, 0.7], [0.32, 0.45], [0.4, 0.62], [0.52, 0.3], [0.5, 0.75], [0.66, 0.55], [0.72, 0.3], [0.8, 0.7], [0.88, 0.5]].map((p) => ({x: p[0], y: p[1], c: '#E8E4D8'})),
      ...[[0.28, 0.35], [0.44, 0.5], [0.58, 0.68], [0.64, 0.4], [0.76, 0.5], [0.84, 0.3], [0.7, 0.78], [0.34, 0.8]].map((p) => ({x: p[0], y: p[1], c: '#5B7FA8'})),
    ];
    return (
      <g>
        {Array.from({length: stripes}, (_, i) => (
          <rect key={i} x={px0 + (pw / stripes) * i} y={py0} width={pw / stripes} height={ph} fill={i % 2 ? '#1B3A2B' : '#1F4231'} />
        ))}
        <g fill="none" stroke={line} strokeWidth={2 * u}>
          <rect x={px0} y={py0} width={pw} height={ph} />
          <line x1={w / 2} y1={py0} x2={w / 2} y2={py0 + ph} />
          <circle cx={w / 2} cy={h / 2} r={ph * 0.14} />
          <rect x={px0} y={h / 2 - ph * 0.22} width={pw * 0.15} height={ph * 0.44} />
          <rect x={px0 + pw * 0.85} y={h / 2 - ph * 0.22} width={pw * 0.15} height={ph * 0.44} />
        </g>
        {dots.map((d, i) => (
          <circle key={i} cx={d.x * w + nz('d' + i, t * 0.5) * 3 * u} cy={d.y * h + nz('e' + i, t * 0.5) * 3 * u} r={8 * u} fill={d.c} opacity={0.5} />
        ))}
      </g>
    );
  };

  return (
    <AbsoluteFill style={{background}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={7 * u} />
          </filter>
        </defs>
        <Backdrop />
        {nodes}
      </svg>
    </AbsoluteFill>
  );
};

export const markerRingArrow = defineMotion<Props>({
  id: 'marker-ring-arrow',
  title: 'Marker ring and arrow',
  category: 'fx',
  description:
    'Broadcast-telestrator annotations drawn live without a freeze: glowing fluorescent marker arrows (solid for what happened, dashed with an open chevron for what was intended), a perspective ring with rotating dashes, a translucent dashed area, and a comet with a fading tapered trail behind a moving point — every stroke has a dark outline, colour glow, colour core and white highlight. Overlay-capable: set background to transparent and scene to none.',
  source: ['lemo-opuscar styles/telestrator/demo/index.html — marker, partial, ring, comet, trail (MIT, LemoLab)'],
  useFor: 'Annotating any video, map, chart or UI capture; sports analysis, "what happened vs what should have", callouts and pointers; a punchy alternative to pencil / blueprint annotation looks.',
  durationInFrames: 180,
  defaultProps: {
    items: [
      {type: 'ring', x: 0.46, y: 0.5, r: 0.075, color: 'did', at: 0.2, dur: 0.8},
      {type: 'arrow', pts: [[0.16, 0.74], [0.3, 0.63], [0.44, 0.52]], color: 'did', at: 0.9, dur: 1.0},
      {type: 'arrow', pts: [[0.5, 0.47], [0.63, 0.39], [0.82, 0.33]], color: 'plan', at: 2.0, dur: 1.0, dash: true},
      {type: 'comet', pts: [[0.18, 0.3], [0.4, 0.22], [0.62, 0.34], [0.78, 0.6]], color: 'alert', at: 2.6, dur: 1.3},
      {type: 'area', pts: [[0.64, 0.64], [0.84, 0.62], [0.86, 0.84], [0.62, 0.84]], color: 'plan', at: 3.5, dur: 0.9},
    ],
    palette: {did: '#FFD400', plan: '#2BE3FF', alert: '#FF3B7A', focus: '#B8FF3B'},
    weight: 8,
    scene: 'pitch',
    background: '#142A20',
    ringSquash: 0.42,
    trail: 0.6,
    boil: true,
  },
  propDocs: {
    items: 'annotations: {type:"arrow"|"ring"|"comet"|"area", pts:[[x,y]…] (0-1 of the frame) or x,y,r, color (role name or hex), at (s), dur (s), dash, wobble}',
    palette: 'colour roles: did = what happened, plan = intended (dashed), alert, focus',
    weight: 'marker core width in px at 1080p (6-9)',
    scene: 'demo backdrop: pitch, grid or none (use none + transparent background to overlay)',
    background: 'backdrop colour, or "transparent" for a pure overlay',
    ringSquash: 'ring height / width — lower = flatter perspective ring',
    trail: 'comet trail window in seconds (≤ 0.6)',
    boil: 'wobble re-seeds at 12 fps (hand-drawn feel)',
  },
  component: MarkerRingArrow,
  tags: ['telestrator', 'annotation', 'arrow', 'ring', 'marker', 'comet', 'trail', 'sports', 'analysis', 'callout', 'overlay', 'highlight', 'broadcast', 'pointer', 'glow'],
});
