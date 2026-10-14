import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp} from '../../core/ease';
import {n2, rng, range} from '../../core/random';
import {FilmGrain, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {GrassField, Stars, circlesD, makeRidge, mix, ridgePath, tealRows} from '../../core/world-kit';

type Props = {
  kind: 'dragonfly' | 'firefly';
  count: number;
  fireflies: number;
  color: string;
  dartFrames: number;
  holdFrames: number;
  land: boolean;
  glowColor: string;
  scene: boolean;
  seed: string;
};

const expoOut = Easing.out(Easing.exp);

type Seg = {x0: number; y0: number; x1: number; y1: number; f0: number; dart: number; hold: number};

/** zig-zag waypoint chain: fast eased darts separated by short hovers (video1 insect-dart-land, video2 insect-zigzag-flight) */
const buildPath = (seed: string, D: number, bounds: [number, number, number, number], dart: [number, number], hold: [number, number], jump: number, start: [number, number], landAt?: [number, number], landFrame?: number) => {
  const r = rng(seed);
  const segs: Seg[] = [];
  let [x, y] = start;
  let f = 0;
  while (f < D) {
    const df = Math.round(range(r, dart[0], dart[1]));
    const hf = Math.round(range(r, hold[0], hold[1]));
    let nx: number;
    let ny: number;
    if (landAt && landFrame !== undefined && f + df >= landFrame - hold[1]) {
      [nx, ny] = landAt;
      segs.push({x0: x, y0: y, x1: nx, y1: ny, f0: f, dart: Math.max(df, 8), hold: D});
      break;
    }
    const a = r() * Math.PI * 2;
    const dist = jump * range(r, 0.6, 1.2);
    nx = clamp(x + Math.cos(a) * dist, bounds[0], bounds[2]);
    ny = clamp(y + Math.sin(a) * dist * 0.6, bounds[1], bounds[3]);
    segs.push({x0: x, y0: y, x1: nx, y1: ny, f0: f, dart: df, hold: hf});
    x = nx;
    y = ny;
    f += df + hf;
  }
  return segs;
};

const stateAt = (segs: Seg[], f: number) => {
  let s = segs[0];
  for (const g of segs) if (f >= g.f0) s = g;
  const p = clamp((f - s.f0) / s.dart);
  const e = expoOut(p);
  return {x: lerp(s.x0, s.x1, e), y: lerp(s.y0, s.y1, e), ang: Math.atan2(s.y1 - s.y0, s.x1 - s.x0), moving: p < 1, p, seg: s};
};

const Dragonfly: React.FC<{len: number; color: string; flick: number; u: number; folded: boolean}> = ({len: L, color, flick, u, folded}) => {
  const wingL = L * 0.62;
  const k = folded ? 0.35 : flick;
  const wing = (x: number, side: number, lenK: number) => (
    <ellipse cx={x} cy={side * wingL * 0.5 * k * lenK} rx={L * 0.09} ry={wingL * 0.5 * k * lenK} fill="#e9f3f6" opacity={0.5} stroke="#ffffff" strokeOpacity={0.6} strokeWidth={0.8 * u} transform={folded ? `rotate(${side * -35} ${x} 0)` : undefined} />
  );
  return (
    <g>
      {wing(L * 0.12, -1, 1)}
      {wing(L * 0.12, 1, 1)}
      {wing(-L * 0.04, -1, 0.92)}
      {wing(-L * 0.04, 1, 0.92)}
      {/* abdomen (segmented) */}
      <path d={`M${-L * 0.05} ${-L * 0.025}L${-L * 0.7} ${-L * 0.012}L${-L * 0.72} 0L${-L * 0.7} ${L * 0.012}L${-L * 0.05} ${L * 0.025}Z`} fill={color} />
      {Array.from({length: 7}, (_, i) => (
        <line key={i} x1={-L * (0.12 + i * 0.08)} y1={-L * 0.02} x2={-L * (0.12 + i * 0.08)} y2={L * 0.02} stroke={mix(color, '#000', 0.4)} strokeWidth={0.8 * u} />
      ))}
      {/* thorax + eyes */}
      <ellipse cx={L * 0.06} cy={0} rx={L * 0.1} ry={L * 0.05} fill={mix(color, '#000', 0.15)} />
      <circle cx={L * 0.17} cy={-L * 0.035} r={L * 0.04} fill={mix(color, '#000', 0.35)} />
      <circle cx={L * 0.17} cy={L * 0.035} r={L * 0.04} fill={mix(color, '#000', 0.35)} />
    </g>
  );
};

const InsectFlight: React.FC<Props> = ({kind, count: dragonflies, fireflies, color, dartFrames, holdFrames, land, glowColor, scene, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: D, portrait} = useStage();
  const id = `insect-flight-${seed}`;
  const fire = kind === 'firefly';
  const count = fire ? fireflies : dragonflies;
  const waterY = h * (portrait ? 0.42 : 0.38);

  // lotus bud the first dragonfly lands on
  const bud = {x: w * (portrait ? 0.62 : 0.66), y: h * (portrait ? 0.62 : 0.6)};

  const paths = useMemo(
    () =>
      Array.from({length: count}, (_, i) => {
        const r = rng(`${seed}-ins${i}`);
        const start: [number, number] = fire ? [range(r, 0.05, 0.95) * w, range(r, 0.3, 0.85) * h] : [i % 2 ? w * 1.1 : -w * 0.1, range(r, 0.2, 0.55) * h];
        return buildPath(
          `${seed}-p${i}`,
          D,
          fire ? [0.03 * w, 0.25 * h, 0.97 * w, 0.9 * h] : [0.08 * w, 0.12 * h, 0.92 * w, 0.7 * h],
          fire ? [dartFrames * 2.6, dartFrames * 4] : [dartFrames * 0.8, dartFrames * 1.3],
          fire ? [holdFrames * 2, holdFrames * 6] : [holdFrames * 0.7, holdFrames * 2.2],
          (fire ? 0.08 : 0.26) * w * (portrait ? 1.4 : 1),
          start,
          !fire && land && i === 0 ? [bud.x, bud.y - 34 * u] : undefined,
          !fire && land && i === 0 ? Math.round(D * 0.62) : undefined,
        );
      }),
    [count, seed, D, w, h, u, fire, dartFrames, holdFrames, land, portrait],
  );

  // ---------------- scenery
  const r = rng(`${seed}-scene`);
  const pads = Array.from({length: portrait ? 14 : 16}, () => {
    const yy = range(r, 0, 1);
    return {x: r() * w, y: waterY + 20 * u + Math.pow(yy, 1.3) * (h - waterY), s: 0.35 + Math.pow(yy, 1.3) * 1.5, rot: r() * 360};
  }).sort((a, b) => a.y - b.y);
  const willow = makeRidge(`${seed}-willow`, w, [3, 5, 8, 13, 21], 0.75);
  const meadow = makeRidge(`${seed}-meadow`, w, [1, 2, 4, 7], 0.6);
  const flowers = Array.from({length: 4}, (_, i) => ({x: (0.12 + i * 0.25 + range(r, -0.05, 0.05)) * w, y: waterY + range(r, 0.08, 0.3) * (h - waterY), s: range(r, 0.9, 1.4)}));

  const insects = paths.map((segs, i) => {
    const st = stateAt(segs, frame);
    const jit = st.moving ? 0 : 1;
    const jx = n2(`${seed}jx`, i * 3.3, frame * (fire ? 0.03 : 0.25)) * (fire ? 10 : 3) * u * jit;
    const jy = n2(`${seed}jy`, i * 3.3, frame * (fire ? 0.03 : 0.25)) * (fire ? 10 : 3) * u * jit;
    const landed = !fire && land && i === 0 && st.seg.hold >= D && !st.moving;
    return {...st, x: st.x + (landed ? 0 : jx), y: st.y + (landed ? 0 : jy), landed, i};
  });

  const night = fire;
  return (
    <AbsoluteFill style={{background: !scene ? 'transparent' : night ? 'linear-gradient(180deg, #0a1430 0%, #15223f 60%, #1f2d45 100%)' : 'linear-gradient(180deg, #efe4d2 0%, #e8ddcf 100%)'}}>
      <Svg>
        <defs>
          <radialGradient id={`${id}-glow`}>
            <stop offset="0%" stopColor={glowColor} stopOpacity={0.95} />
            <stop offset="25%" stopColor={glowColor} stopOpacity={0.45} />
            <stop offset="100%" stopColor={glowColor} stopOpacity={0} />
          </radialGradient>
        </defs>
        {scene && !night && (
          <g>
            {/* willow treeline and far shore */}
            <path d={ridgePath(willow, -10, w + 10, waterY - 0.08 * h, 0.06 * h, waterY + 4, 8)} fill="#91a570" />
            {Array.from({length: 60}, (_, i) => {
              const x = (i / 60) * w + 5 * u;
              const top = waterY - 0.08 * h - 0.06 * h * willow(x);
              return <line key={i} x1={x} y1={top + 10 * u} x2={x + Math.sin(frame * 0.03 + i) * 3 * u} y2={waterY - 4 * u} stroke="#7d9460" strokeWidth={2 * u} opacity={0.6} />;
            })}
            <rect x={0} y={waterY - 0.012 * h} width={w} height={0.012 * h} fill="#a7b48a" />
            {/* water */}
            <rect x={0} y={waterY} width={w} height={h - waterY} fill="#5e908f" />
            {Array.from({length: 26}, (_, i) => {
              const yy = waterY + Math.pow(i / 26, 1.5) * (h - waterY);
              const off = Math.sin(frame * 0.05 + i * 1.3) * 30 * u;
              return <line key={i} x1={((i * 173) % w) + off} y1={yy} x2={((i * 173) % w) + off + (60 + i * 8) * u} y2={yy} stroke="#86b3b0" strokeWidth={(1 + i * 0.08) * u} opacity={0.5} strokeLinecap="round" />;
            })}
            {/* lily pads */}
            {pads.map((p, i) => (
              <g key={i} transform={`translate(${p.x},${p.y}) scale(${p.s},${p.s * 0.42})`}>
                <path d={`M0 0L${70 * u * Math.cos(((p.rot - 14) * Math.PI) / 180)} ${70 * u * Math.sin(((p.rot - 14) * Math.PI) / 180)}A${70 * u} ${70 * u} 0 1 0 ${70 * u * Math.cos(((p.rot + 14) * Math.PI) / 180)} ${70 * u * Math.sin(((p.rot + 14) * Math.PI) / 180)}Z`} fill="#83a078" stroke="#5f7d58" strokeWidth={2 * u} />
              </g>
            ))}
            {/* lotus flowers + the landing bud */}
            {flowers.map((f, i) => (
              <g key={i} transform={`translate(${f.x},${f.y}) scale(${f.s})`}>
                <ellipse cx={0} cy={4 * u} rx={60 * u} ry={18 * u} fill="#83a078" />
                {[-2, -1, 0, 1, 2].map((k) => (
                  <ellipse key={k} cx={k * 11 * u} cy={-14 * u + Math.abs(k) * 4 * u} rx={11 * u} ry={26 * u} fill={k % 2 ? '#d8789e' : '#cf7396'} transform={`rotate(${k * 22} ${k * 11 * u} ${8 * u})`} />
                ))}
              </g>
            ))}
            <path d={`M${bud.x} ${h + 10}Q${bud.x - 20 * u} ${(bud.y + h) / 2} ${bud.x} ${bud.y}`} stroke="#5f7d58" strokeWidth={6 * u} fill="none" />
            <path d={`M${bud.x} ${bud.y - 36 * u}C${bud.x + 22 * u} ${bud.y - 18 * u} ${bud.x + 18 * u} ${bud.y + 6 * u} ${bud.x} ${bud.y + 8 * u}C${bud.x - 18 * u} ${bud.y + 6 * u} ${bud.x - 22 * u} ${bud.y - 18 * u} ${bud.x} ${bud.y - 36 * u}Z`} fill="#cf7396" />
            <path d={`M${bud.x} ${bud.y - 34 * u}C${bud.x + 8 * u} ${bud.y - 14 * u} ${bud.x + 6 * u} ${bud.y} ${bud.x} ${bud.y + 6 * u}`} stroke="#e7a3bf" strokeWidth={2 * u} fill="none" />
            {/* reeds */}
            {Array.from({length: 22}, (_, i) => {
              const x = i < 11 ? i * 14 * u : w - (i - 11) * 14 * u;
              const hh = (180 + ((i * 53) % 140)) * u;
              const sw = Math.sin(frame * 0.04 + i) * 6 * u;
              return <path key={i} d={`M${x} ${h + 4}Q${x + sw * 0.4} ${h - hh * 0.5} ${x + sw} ${h - hh}`} stroke={i % 3 ? '#6f8a55' : '#5b7547'} strokeWidth={4 * u} fill="none" strokeLinecap="round" />;
            })}
          </g>
        )}
        {scene && night && (
          <g>
            <Stars w={w} h={h} u={u} frame={frame} count={90} seed={`${seed}-st`} maxY={0.5} opacity={0.8} />
            <path d={ridgePath(meadow, -10, w + 10, h * 0.62, 0.05 * h, h + 4, 10)} fill="#101b2e" />
            {Array.from({length: 7}, (_, i) => {
              const x = (i + 0.5) * (w / 7) + Math.sin(i * 3.1) * 40 * u;
              const by = h * 0.62 - 0.05 * h * meadow(x);
              const s = (0.8 + Math.abs(Math.sin(i * 1.7)) * 0.6) * (portrait ? 1.2 : 1);
              return (
                <g key={i}>
                  <rect x={x - 5 * u * s} y={by - 120 * u * s} width={10 * u * s} height={120 * u * s} fill="#0b1424" />
                  <path d={circlesD([0, 1, 2, 3, 4].map((k) => ({x: x + (k - 2) * 30 * u * s, y: by - (130 + (k % 2) * 30 + (k === 2 ? 40 : 0)) * u * s, r: (44 + (k % 2) * 10) * u * s})))} fill="#0b1424" />
                </g>
              );
            })}
            <GrassField
              id={`${id}-grass`}
              rows={tealRows(portrait ? 1.2 : 0.8).map((row, k) => ({...row, base: ['#070d18', '#0a1220', '#0d1828'][k], tip: ['#13213a', '#172a44', '#1c3350'][k]}))}
              baseY={h + 10 * u}
              x0={-40 * u}
              x1={w + 40 * u}
              u={u}
              w={w}
              frame={frame}
              seed={`${seed}-g`}
              swayAmp={2}
              gust={3}
            />
          </g>
        )}
        {/* insects */}
        {insects.map((s) => {
          if (fire) {
            const rr = rng(`${seed}-blink${s.i}`);
            const per = range(rr, 40, 90);
            const ph = ((frame + rr() * per) % per) / per;
            const glow = 0.15 + 0.85 * Math.pow(Math.max(0, Math.sin(ph * Math.PI * 2)), 2);
            const R = range(rr, 16, 30) * u;
            return (
              <g key={s.i} style={{mixBlendMode: 'screen'}}>
                <circle cx={s.x} cy={s.y} r={R * (0.7 + 0.5 * glow)} fill={`url(#${id}-glow)`} opacity={glow} />
                <circle cx={s.x} cy={s.y} r={2.4 * u} fill="#fbffd6" opacity={0.4 + 0.6 * glow} />
              </g>
            );
          }
          const flick = Math.floor(frame / 1) % 2 ? 1 : 0.4; // wings alternate drawings every frame
          const L = (portrait ? 140 : 128) * u;
          const ang = s.landed ? -Math.PI / 2 + 0.25 : s.ang;
          return (
            <g key={s.i} transform={`translate(${s.x.toFixed(1)},${s.y.toFixed(1)}) rotate(${((ang * 180) / Math.PI).toFixed(1)})`}>
              <Dragonfly len={L} color={color} flick={s.moving ? 1 : flick} u={u} folded={s.landed && Math.floor(frame / 9) % 6 !== 0} />
            </g>
          );
        })}
      </Svg>
      <FilmGrain opacity={0.05} />
    </AbsoluteFill>
  );
};

export const insectFlight = defineMotion<Props>({
  id: 'insect-flight',
  title: 'Insect dart flight (dragonflies / fireflies)',
  category: 'environment',
  description:
    'Red dragonflies zig-zag over a sunny lotus pond in fast expo-eased darts separated by jittery hovers, their translucent wings flickering every frame, and one lands on a lotus bud and folds its wings; firefly mode fills a night meadow with glowing, blinking fireflies drifting between waypoints.',
  source: ['video1 0:42-0:46 insect-dart-land (dragonfly)', 'video2 insect-zigzag-flight'],
  useFor: 'Nature ambience, "a small idea arrives / lands" beats, summer or night atmosphere.',
  durationInFrames: 180,
  defaultProps: {
    kind: 'dragonfly',
    count: 3,
    fireflies: 40,
    color: '#c0392b',
    dartFrames: 5,
    holdFrames: 7,
    land: true,
    glowColor: '#e8ff8a',
    scene: true,
    seed: 'pond',
  },
  propDocs: {
    kind: '"dragonfly" (sunny pond) or "firefly" (night meadow)',
    count: 'number of dragonflies',
    fireflies: 'number of fireflies (firefly mode)',
    color: 'dragonfly body colour',
    dartFrames: 'frames per dart (dragonfly; fireflies are slower)',
    holdFrames: 'hover frames between darts',
    land: 'the first dragonfly lands on the lotus bud',
    glowColor: 'firefly glow colour',
    scene: 'paint the pond / meadow background (false = transparent overlay)',
    seed: 'random seed',
  },
  component: InsectFlight,
  tags: ['insects', 'dragonfly', 'firefly', 'nature', 'pond', 'night'],
});
