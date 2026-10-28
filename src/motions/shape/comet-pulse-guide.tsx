// Adapted from lemo-opuscar/styles/glass-product/demo/product.js comet-pulse shader (onBeforeCompile, setPulses) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {BPt, isClear, la2Fonts, mixHex, ptsD, rgba, seg} from '../../core/r2-la2-kit';

/**
 * comet-pulse-guide — light pulses travel along a channel (spiral, ring, wave, circuit trace or any SVG path) as
 * comets: a narrow white-hot head, a long exponential tail, hue drifting from accent A to B with age; the idle
 * channel glows at almost nothing. Up to 8 pulses triggered on a beat list, optional wrap-around.
 */
type Props = {
  path: string;
  shape: 'spiral' | 'ring' | 'wave' | 'circuit' | 'path';
  colorA: string;
  colorB: string;
  background: string;
  pulses: number[];
  speed: number;
  width: number;
  wrap: boolean;
  idleGlow: number;
  bpm: number;
  loopBeats: number[];
  label: string;
  channelColor: string;
};

const buildShape = (shape: Props['shape'], w: number, h: number, u: number, portrait: boolean): BPt[] => {
  const cx = w / 2;
  const cy = h / 2;
  const m = Math.min(w, h);
  const pts: BPt[] = [];
  if (shape === 'spiral') {
    const turns = 3.2;
    for (let i = 0; i <= 480; i++) {
      const t = i / 480;
      const a = -Math.PI / 2 + t * turns * Math.PI * 2;
      const r = m * 0.06 + t * m * 0.36;
      pts.push([cx + Math.cos(a) * r * 1.12, cy + Math.sin(a) * r]);
    }
  } else if (shape === 'ring') {
    const r = m * 0.34;
    for (let i = 0; i <= 360; i++) {
      const a = -Math.PI / 2 + (i / 360) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * r * 1.12, cy + Math.sin(a) * r]);
    }
  } else if (shape === 'wave') {
    const span = portrait ? h : w;
    for (let i = 0; i <= 420; i++) {
      const t = i / 420;
      const s = -span * 0.08 + t * span * 1.16;
      const o = Math.sin(t * Math.PI * 3.2) * m * 0.16 + Math.sin(t * Math.PI * 8.3 + 1) * m * 0.04;
      pts.push(portrait ? [cx + o, s] : [s, cy + o]);
    }
  } else {
    // circuit trace: axis-aligned runs with 45° corners
    const grid = m * 0.08;
    const seq: BPt[] = portrait
      ? [
          [-1, -5], [-1, -2.5], [1, -0.5], [1, 1], [-2, 4], [-2, 5.5], [0, 7.5], [0, 9],
        ]
      : [
          [-7, 1.5], [-4.5, 1.5], [-3, 0], [-1, 0], [0.5, -1.5], [3, -1.5], [4.5, 0], [7, 0],
        ];
    for (let i = 0; i < seq.length - 1; i++) {
      const a: BPt = [cx + seq[i][0] * grid, cy + seq[i][1] * grid];
      const b: BPt = [cx + seq[i + 1][0] * grid, cy + seq[i + 1][1] * grid];
      const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (3 * u)));
      for (let k = i === 0 ? 0 : 1; k <= n; k++) pts.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
    }
  }
  return pts;
};
const parseSimple = (d: string, w: number, h: number): BPt[] => {
  // numbers are in a 0..100 box, scaled to the frame
  const nums = (d.match(/-?\d*\.?\d+/g) || []).map(Number);
  const pts: BPt[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([(nums[i] / 100) * w, (nums[i + 1] / 100) * h]);
  return pts;
};

const CometPulseGuide: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const overlay = isClear(p.background);
  const G = useMemo(() => {
    const pts = p.shape === 'path' && p.path ? parseSimple(p.path, w, h) : buildShape(p.shape, w, h, u, portrait);
    const L: number[] = [0];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      L.push(total);
    }
    return {pts, L, total};
  }, [p.shape, p.path, w, h, u, portrait]);
  const at = (s: number): BPt => {
    let x = p.wrap ? ((s % G.total) + G.total) % G.total : Math.min(G.total, Math.max(0, s));
    let lo = 0;
    let hi = G.L.length - 1;
    while (lo + 1 < hi) {
      const mid = (lo + hi) >> 1;
      if (G.L[mid] <= x) lo = mid;
      else hi = mid;
    }
    const d = G.L[hi] - G.L[lo] || 1;
    const k = (x - G.L[lo]) / d;
    return [G.pts[lo][0] + (G.pts[hi][0] - G.pts[lo][0]) * k, G.pts[lo][1] + (G.pts[hi][1] - G.pts[lo][1]) * k];
  };
  // pulse start times: explicit list, else from bpm + loopBeats repeated
  const starts: number[] = useMemo(() => {
    if (p.pulses.length) return p.pulses;
    const beat = 60 / Math.max(1, p.bpm);
    const bar = beat * 4;
    const out: number[] = [];
    for (let b = 0; b * bar < 20; b++) for (const q of p.loopBeats) out.push(b * bar + q * beat);
    return out;
  }, [p.pulses, p.bpm, p.loopBeats]);
  const W = p.width * u;
  const speed = p.speed * u;
  const chan = ptsD(G.pts);
  // active pulses (≤ 8 drawn)
  const act = starts.filter((s0) => t >= s0 && (p.wrap ? t - s0 < (G.total / speed) * 1.8 : (t - s0) * speed < G.total + 60 * W)).slice(-8);
  const segsPerPulse = 34;
  return (
    <AbsoluteFill style={{background: overlay ? 'transparent' : p.background}}>
      <Svg>
        <defs>
          <filter id="cpg-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation={3.2 * u} result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation={1.1 * u} result="b2" />
            <feMerge>
              <feMergeNode in="b1" />
              <feMergeNode in="b2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="cpg-glow2" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation={9 * u} />
          </filter>
        </defs>
        {/* idle channel */}
        <path d={chan} fill="none" stroke={rgba(p.channelColor || p.colorA, Math.max(0.02, p.idleGlow))} strokeWidth={Math.max(1, W * 0.5)} strokeLinecap="round" strokeLinejoin="round" />
        {act.map((s0, pi) => {
          const age = t - s0;
          const head = age * speed;
          const ageN = Math.min(1, age / 2.2);
          const tail = Math.min(G.total * 0.45, W * 34);
          const els: React.ReactNode[] = [];
          for (let k = 0; k < segsPerPulse; k++) {
            const f0 = k / segsPerPulse;
            const f1 = (k + 1) / segsPerPulse;
            const a0 = head - tail * f1;
            const a1 = head - tail * f0;
            if (a1 < 0 && !p.wrap) continue;
            if (p.wrap) {
              const m0 = ((a0 % G.total) + G.total) % G.total;
              const m1 = ((a1 % G.total) + G.total) % G.total;
              if (m1 < m0) continue; // segment crosses the wrap seam
            }
            const A = at(a0);
            const B = at(a1);
            const alpha = Math.exp((-(tail * (f0 + f1)) / 2 / (tail * 0.32))) * 0.8;
            if (alpha < 0.01) continue;
            const hue = mixHex(p.colorA, p.colorB, Math.min(1, ageN + f0 * 0.25));
            els.push(<line key={k} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={rgba(hue, alpha)} strokeWidth={W * (1 - f0 * 0.6)} strokeLinecap="round" />);
          }
          const H = at(head);
          const headCol = mixHex(p.colorA, p.colorB, ageN * 0.8);
          return (
            <g key={pi} filter="url(#cpg-glow)">
              {els}
              <circle cx={H[0]} cy={H[1]} r={W * 2.2} fill={rgba(headCol, 0.35)} filter="url(#cpg-glow2)" />
              <circle cx={H[0]} cy={H[1]} r={W * 0.75} fill="#FFFFFF" />
              <circle cx={H[0]} cy={H[1]} r={W * 1.15} fill="none" stroke={rgba('#FFFFFF', 0.5)} strokeWidth={W * 0.3} />
            </g>
          );
        })}
        {p.label && !overlay && (
          <text x={w / 2} y={h * (portrait ? 0.93 : 0.92)} textAnchor="middle" fontFamily={la2Fonts.tight} fontWeight={300} fontSize={22 * u} letterSpacing={9 * u} fill={rgba('#EAF2F8', 0.75 * seg(frame, 10, 34))}>
            {p.label.toUpperCase()}
          </text>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const cometPulseGuide = defineMotion<Props>({
  id: 'comet-pulse-guide',
  title: 'Comet pulse guide',
  category: 'shape',
  description:
    'Light pulses travel a dark channel (spiral, ring, wave, circuit trace or your own path) as comets — narrow white-hot head, long exponential tail, hue drifting from accent A to B with age; near-zero idle glow, pulses fired on a beat pattern, up to 8 alive, optional wrap. Overlay-capable with background: transparent.',
  source: ['lemo-opuscar styles/glass-product (MIT, LemoLab) — demo/product.js comet pulse shader'],
  useFor: 'Data or energy flowing: charging, network traffic, pipelines, audio-to-light; overlay pulses on UI diagrams and product shots.',
  durationInFrames: 180,
  defaultProps: {
    path: '',
    shape: 'spiral',
    colorA: '#62DCFF',
    colorB: '#A98BFF',
    background: '#010306',
    pulses: [],
    speed: 620,
    width: 7,
    wrap: true,
    idleGlow: 0.05,
    bpm: 120,
    loopBeats: [0, 0.75, 1, 1.5],
    label: 'hear the light',
    channelColor: '',
  },
  propDocs: {
    path: "own polyline as 'x y x y …' in a 0–100 box (used when shape = 'path')",
    shape: 'channel: spiral | ring | wave | circuit | path',
    colorA: 'young pulse colour',
    colorB: 'old pulse colour (hue drifts A→B with age)',
    background: "backdrop; 'transparent' = overlay on host content",
    pulses: 'explicit pulse start times in seconds (overrides bpm pattern)',
    speed: 'pulse speed in px@1080 per second',
    width: 'head width in px@1080',
    wrap: 'pulses wrap around the channel',
    idleGlow: 'brightness of the empty channel 0..1',
    bpm: 'tempo of the default pattern',
    loopBeats: 'beats inside each bar when a pulse fires (demo bass pattern)',
    label: 'small tracked caption (hidden when overlaying)',
    channelColor: 'idle channel colour (defaults to colorA)',
  },
  component: CometPulseGuide,
  tags: ['comet', 'pulse', 'light', 'glow', 'trail', 'spiral', 'ring', 'circuit', 'energy', 'data-flow', 'network', 'charging', 'overlay', 'dark', 'neon', 'beat', 'glass-product'],
});
