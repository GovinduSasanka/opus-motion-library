import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {BlurFilter, areaK, hash01, isTransparent, wrap} from '../../core/environment-kit';
import {n2, rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Iridescent bubbles (video2 iridescent-bubble-cluster, video23 rising bubbles).
 * cluster: dozens of transparent soap bubbles (r 15-60 px) packed in a foam blob on a steel sink;
 *   each = near-invisible fill, thin bright rim, specular highlight and thin-film rainbow arcs
 *   (a conic gradient masked to the rim) rotating ~60°/s; bubbles jiggle ±2 px at 0.5-1 Hz,
 *   occasionally pop (scale 1 -> 1.15 -> 0 over 4 frames, with spray) and re-grow.
 * rising: bubbles of mixed sizes rise through deep water (~60 px/s, bigger = faster) with ±4 px wobble.
 */
type Props = {
  mode: 'cluster' | 'rising';
  background: string;
  backdrop: boolean;
  count: number;
  radiusRange: number[];
  hueSpeed: number;
  popRate: number;
  speed: number;
  foam: boolean;
  seed: number;
};

type B = {x: number; y: number; r: number; pop: number; regrow: number; ph: number};

const packCluster = (w: number, h: number, u: number, count: number, rMin: number, rMax: number, seed: number): B[] => {
  const r = rng(seed * 7919 + 13);
  const portrait = h > w;
  const cx = w * (portrait ? 0.5 : 0.44);
  const cy = h * (portrait ? 0.56 : 0.56);
  const ax = Math.min(w, h) * (portrait ? 0.44 : 0.62);
  const ay = Math.min(w, h) * (portrait ? 0.62 : 0.4);
  const out: B[] = [];
  const radii = Array.from({length: count}, () => (rMin + (rMax - rMin) * Math.pow(r(), 2.2)) * u).sort((p, q) => q - p);
  const inBlob = (x: number, y: number) => {
    const a = Math.atan2((y - cy) / ay, (x - cx) / ax);
    const lump = 1 + 0.16 * Math.sin(a * 3 + seed) + 0.1 * Math.sin(a * 5 + seed * 2);
    return Math.hypot((x - cx) / ax, (y - cy) / ay) <= lump;
  };
  for (const want of radii) {
    let best: [number, number] | null = null;
    let bestD = Infinity;
    for (let k = 0; k < 260; k++) {
      const x = cx + (r() * 2 - 1) * ax * 1.15;
      const y = cy + (r() * 2 - 1) * ay * 1.15;
      if (!inBlob(x, y)) continue;
      let ok = true;
      for (const b of out) {
        if (Math.hypot(b.x - x, b.y - y) < b.r + want - 3 * u) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      const d = Math.hypot((x - cx) / ax, (y - cy) / ay) + r() * 0.25;
      if (d < bestD) {
        bestD = d;
        best = [x, y];
      }
    }
    if (best) out.push({x: best[0], y: best[1], r: want, pop: 0, regrow: 0, ph: r()});
  }
  return out;
};

const Bubble: React.FC<{x: number; y: number; r: number; s: number; hue: number; u: number; opacity?: number; squash?: number}> = ({x, y, r, s, hue, u, opacity = 1, squash = 1}) => {
  if (s <= 0.01) return null;
  const rim = `conic-gradient(from ${hue.toFixed(1)}deg, rgba(255,255,255,0) 0deg, rgba(255,90,170,0.95) 30deg, rgba(255,190,70,0.95) 55deg, rgba(240,255,110,0.9) 75deg, rgba(90,255,170,0.9) 95deg, rgba(70,200,255,0.95) 118deg, rgba(150,110,255,0.9) 140deg, rgba(255,255,255,0) 165deg, rgba(255,255,255,0) 200deg, rgba(120,220,255,0.7) 220deg, rgba(255,120,200,0.75) 245deg, rgba(255,220,120,0.6) 265deg, rgba(255,255,255,0) 290deg)`;
  const mask = 'radial-gradient(closest-side, transparent 78%, #000 88%, #000 95%, transparent 100%)';
  return (
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: 2 * r,
        height: 2 * r,
        transform: `scale(${s.toFixed(3)}, ${(s * squash).toFixed(3)})`,
        opacity,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 58%, rgba(200,240,246,0.1) 40%, rgba(160,225,235,0.26) 75%, rgba(255,255,255,0.65) 95%, rgba(255,255,255,0) 100%)',
          boxShadow: `0 0 0 ${Math.max(0.8, 1.1 * u).toFixed(2)}px rgba(255,255,255,0.55), 0 ${(r * 0.06).toFixed(1)}px ${(r * 0.2).toFixed(1)}px rgba(40,70,90,0.18)`,
        }}
      />
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: rim, WebkitMaskImage: mask, maskImage: mask, opacity: 0.85}} />
      <div
        style={{
          position: 'absolute',
          left: '16%',
          top: '13%',
          width: '34%',
          height: '17%',
          borderRadius: '50%',
          transform: 'rotate(-38deg)',
          background: 'radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(255,255,255,0.35) 60%, rgba(255,255,255,0))',
        }}
      />
      <div style={{position: 'absolute', right: '22%', bottom: '18%', width: '9%', height: '9%', borderRadius: '50%', background: 'rgba(255,255,255,0.6)'}} />
    </div>
  );
};

const Sink: React.FC = () => {
  const {w, h, u} = useStage();
  const m = Math.min(w, h) * 0.05;
  const dx = w * (h > w ? 0.72 : 0.8);
  const dy = h * (h > w ? 0.14 : 0.2);
  const dr = Math.min(w, h) * 0.09;
  return (
    <g>
      <defs>
        <linearGradient id="bb-steel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E3E9EC" />
          <stop offset="0.5" stopColor="#CBD5DA" />
          <stop offset="1" stopColor="#AEBBC2" />
        </linearGradient>
        <radialGradient id="bb-drain">
          <stop offset="0" stopColor="#5E666C" />
          <stop offset="0.75" stopColor="#7C858B" />
          <stop offset="1" stopColor="#A4ADB3" />
        </radialGradient>
        <BlurFilter id="bb-in" std={14 * u} />
      </defs>
      <rect width={w} height={h} fill="#B7C3C9" />
      <rect x={m} y={m} width={w - 2 * m} height={h - 2 * m} rx={m * 2.2} fill="url(#bb-steel)" />
      <rect x={m} y={m} width={w - 2 * m} height={h - 2 * m} rx={m * 2.2} fill="none" stroke="#8F9DA5" strokeWidth={16 * u} opacity={0.35} filter="url(#bb-in)" />
      {[0.3, 0.55, 0.8].map((f, k) => (
        <path key={k} d={`M ${m} ${h * f} Q ${w * 0.5} ${h * (f - 0.18)} ${w - m} ${h * (f - 0.05)}`} stroke="#ffffff" strokeWidth={30 * u} opacity={0.12} fill="none" filter="url(#bb-in)" />
      ))}
      <circle cx={dx} cy={dy} r={dr * 1.25} fill="#9AA6AD" />
      <circle cx={dx} cy={dy} r={dr * 1.12} fill="#C9D2D7" />
      <circle cx={dx} cy={dy} r={dr} fill="url(#bb-drain)" />
      {Array.from({length: 16}, (_, k) => {
        const a = (k / 16) * Math.PI * 2;
        return <line key={k} x1={dx + Math.cos(a) * dr * 0.45} y1={dy + Math.sin(a) * dr * 0.45} x2={dx + Math.cos(a) * dr * 0.85} y2={dy + Math.sin(a) * dr * 0.85} stroke="#3C4348" strokeWidth={dr * 0.07} strokeLinecap="round" />;
      })}
      <circle cx={dx} cy={dy} r={dr * 0.25} fill="#8D979D" stroke="#4A5257" strokeWidth={2 * u} />
      {Array.from({length: 14}, (_, k) => (
        <ellipse key={k} cx={w * (0.08 + 0.84 * hash01(2, k, 1))} cy={h * (0.08 + 0.84 * hash01(2, k, 2))} rx={(3 + 5 * hash01(2, k, 3)) * u} ry={(2.4 + 4 * hash01(2, k, 3)) * u} fill="#ffffff" opacity={0.55} />
      ))}
    </g>
  );
};

const Bubbles: React.FC<Props> = ({mode, background, backdrop, count, radiusRange, hueSpeed, popRate, speed, foam, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames} = useStage();
  const t = frame / fps;
  const overlay = isTransparent(background);
  const scene = backdrop && !overlay;
  const [rMin, rMax] = [radiusRange[0] ?? 14, radiusRange[1] ?? 75];
  const cluster = mode === 'cluster';
  const bubbles = useMemo(() => {
    if (!cluster) return [] as B[];
    const bs = packCluster(w, h, u, count, rMin, rMax, seed);
    // schedule pops on smaller bubbles
    const nPop = Math.round((popRate * durationInFrames) / fps);
    const small = bs.map((b, i) => [b.r, i] as const).sort((a, b) => a[0] - b[0]).slice(0, Math.max(1, Math.floor(bs.length * 0.6)));
    for (let k = 0; k < nPop && small.length; k++) {
      const idx = small[Math.floor(hash01(seed, k, 1) * small.length)][1];
      const at = 24 + Math.floor(((k + hash01(seed, k, 2) * 0.8) / nPop) * (durationInFrames - 40));
      if (bs[idx].pop) continue;
      bs[idx].pop = at;
      bs[idx].regrow = at + 30 + Math.floor(hash01(seed, k, 3) * 30);
    }
    return bs;
  }, [cluster, w, h, u, count, rMin, rMax, seed, popRate, durationInFrames, fps]);

  const els: React.ReactNode[] = [];
  const spray: React.ReactNode[] = [];
  const foamEls: React.ReactNode[] = [];
  if (cluster) {
    const cx0 = w * (h > w ? 0.5 : 0.44);
    const cy0 = h * 0.56;
    bubbles.forEach((b, i) => {
      // staggered entrance from the cluster centre
      const dist = Math.hypot(b.x - cx0, b.y - cy0) / Math.max(w, h);
      const ent = ease.back(prog(frame, dist * 30, dist * 30 + 10, ease.linear));
      let s = ent;
      if (b.pop) {
        const f = frame - b.pop;
        if (f >= 0 && f < 2) s = 1 + 0.15 * (f / 2);
        else if (f >= 2 && f < 4) s = 1.15 * (1 - (f - 2) / 2);
        else if (f >= 4) s = ease.back(prog(frame, b.regrow, b.regrow + 9, ease.linear));
        if (f >= 3 && f < 10) {
          const p = (f - 3) / 7;
          for (let k = 0; k < 7; k++) {
            const a = (k / 7) * Math.PI * 2 + i;
            const d = b.r * (0.9 + 0.9 * p);
            spray.push(<circle key={`${i}-${k}`} cx={b.x + Math.cos(a) * d} cy={b.y + Math.sin(a) * d} r={(1 + 2 * (1 - p)) * u} fill="#fff" opacity={0.9 * (1 - p)} />);
          }
        }
      }
      const jx = 2 * u * n2('bjx' + seed, i * 0.37, t * (0.5 + 0.5 * b.ph) * 1.5);
      const jy = 2 * u * n2('bjy' + seed, i * 0.37, t * (0.5 + 0.5 * b.ph) * 1.5);
      els.push(<Bubble key={i} x={b.x + jx} y={b.y + jy} r={b.r} s={s} hue={b.ph * 360 + hueSpeed * t} u={u} />);
    });
    if (foam) {
      const nf = Math.round(170 * areaK(w, h));
      for (let k = 0; k < nf; k++) {
        const b = bubbles[Math.floor(hash01(seed, k, 31) * bubbles.length)];
        if (!b) break;
        const a = hash01(seed, k, 32) * Math.PI * 2;
        const d = b.r * (1.0 + 0.12 * hash01(seed, k, 33));
        const r = (1.5 + 4 * Math.pow(hash01(seed, k, 34), 2)) * u;
        const ent = prog(frame, 8 + hash01(seed, k, 35) * 20, 18 + hash01(seed, k, 35) * 20);
        foamEls.push(<circle key={k} cx={b.x + Math.cos(a) * d + n2('fj', k, t) * 1.5 * u} cy={b.y + Math.sin(a) * d} r={r * ent} fill="#ffffff" stroke="#9FB8C2" strokeWidth={0.6 * u} opacity={0.85} />);
      }
    }
  } else {
    const n = Math.round(count * areaK(w, h));
    for (let i = 0; i < n; i++) {
      const r = (3 + 25 * Math.pow(hash01(seed, i, 1), 2.6)) * u * (rMax / 75);
      const v = 60 * u * speed * (0.7 + (r / (20 * u)) * 0.6);
      const span = h + 80 * u;
      const y = wrap(hash01(seed, i, 2) * span - v * t, span) - 40 * u;
      const x = hash01(seed, i, 3) * w + 4 * u * (1 + r / (10 * u)) * Math.sin(t * 5 * (0.6 + hash01(seed, i, 4)) + i) + 20 * u * Math.sin(t * 0.3 + i);
      const sq = 1 - 0.06 * Math.sin(t * 9 + i);
      els.push(<Bubble key={i} x={x} y={y} r={r} s={1} hue={hash01(seed, i, 5) * 360 + hueSpeed * t} u={u} opacity={0.5 + 0.4 * Math.min(1, r / (14 * u))} squash={sq} />);
    }
  }

  return (
    <AbsoluteFill style={{background: overlay ? 'transparent' : background}}>
      {scene && cluster && (
        <Svg>
          <Sink />
        </Svg>
      )}
      {scene && !cluster && (
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% -10%, #3FA9C9 0%, #17698E 40%, #0A3654 80%, #061F33 100%)'}} />
      )}
      {cluster && (
        <Svg>
          {scene && (
            <g>
              <BlurFilter id="bb-shadow" std={40 * u} />
              <ellipse cx={w * (h > w ? 0.5 : 0.44)} cy={h * 0.6} rx={Math.min(w, h) * (h > w ? 0.42 : 0.6)} ry={Math.min(w, h) * (h > w ? 0.6 : 0.38)} fill="#6F818B" opacity={0.28} filter="url(#bb-shadow)" />
            </g>
          )}
          <g opacity={0.5}>{foamEls.filter((_, k) => k % 2 === 0)}</g>
        </Svg>
      )}
      <AbsoluteFill>{els}</AbsoluteFill>
      <Svg>
        {foamEls.filter((_, k) => k % 2 === 1)}
        {spray}
      </Svg>
    </AbsoluteFill>
  );
};

export const bubbles = defineMotion<Props>({
  id: 'bubbles',
  title: 'Iridescent bubbles',
  category: 'environment',
  description: 'A packed foam of soap bubbles on a steel sink: rotating rainbow thin-film rims, jiggle, occasional pops and re-growth; "rising" mode sends bubbles up through deep water. Overlay-capable.',
  source: ['video2 1.08-2.21', 'video23 bathysphere-idle-bob bubbles'],
  useFor: 'Clean / fresh / soap / fizz / bubbly-mood beats, underwater ambience; overlay bubbles on footage.',
  durationInFrames: 150,
  defaultProps: {
    mode: 'cluster',
    background: '#B7C3C9',
    backdrop: true,
    count: 95,
    radiusRange: [12, 72],
    hueSpeed: 60,
    popRate: 1.2,
    speed: 1,
    foam: true,
    seed: 1,
  },
  propDocs: {
    mode: '"cluster" (packed foam with pops) or "rising" (bubbles rising through water)',
    background: 'CSS background; "transparent" = overlay',
    backdrop: 'paint the steel sink (cluster) or deep-water gradient (rising)',
    count: 'number of bubbles (rising: per 1080p frame)',
    radiusRange: '[min, max] bubble radius in px at 1080p',
    hueSpeed: 'thin-film rainbow rotation in degrees per second',
    popRate: 'cluster pops per second',
    speed: 'rising speed multiplier',
    foam: 'tiny foam bubbles around the cluster',
    seed: 'random seed',
  },
  component: Bubbles,
  tags: ['bubbles', 'soap', 'foam', 'iridescent', 'underwater', 'overlay', 'particles'],
});
