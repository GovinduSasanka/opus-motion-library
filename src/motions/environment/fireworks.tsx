import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {clamp, ease} from '../../core/ease';
import {rng, range} from '../../core/random';
import {FilmGrain, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {Stars, circlesD, makeRidge, mix} from '../../core/world-kit';

type Props = {
  count: number;
  every: number;
  firstAt: number;
  sparkCount: number;
  radius: number;
  colors: string[];
  launchFrames: number;
  flashFrames: number;
  expandFrames: number;
  fadeFrames: number;
  lightPulse: number;
  tint: string;
  scene: boolean;
  seed: string;
};

const cubicOut = Easing.out(Easing.cubic);

const Fireworks: React.FC<Props> = ({count, every, firstAt, sparkCount, radius, colors, launchFrames, flashFrames, expandFrames, fadeFrames, lightPulse, tint, scene, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = `fireworks-${seed}`;
  const life = expandFrames + fadeFrames + 14;

  const shells = useMemo(() => {
    const r = rng(`${seed}-shells`);
    return Array.from({length: count}, (_, k) => {
      const burst = firstAt + launchFrames + k * every + Math.round(range(r, -5, 5));
      const x = (k % 2 ? range(r, 0.52, 0.82) : range(r, 0.18, 0.48)) * w;
      const y = range(r, portrait ? 0.12 : 0.16, portrait ? 0.55 : 0.42) * h;
      const R = radius * u * range(r, 0.8, 1.2) * (portrait ? 1.15 : 1);
      const sparks = Array.from({length: sparkCount}, () => {
        // uniform direction on a sphere, projected -> dense core like a real peony
        const z = range(r, -1, 1);
        const a = r() * Math.PI * 2;
        const rr = Math.sqrt(1 - z * z);
        return {dx: Math.cos(a) * rr, dy: Math.sin(a) * rr, sp: range(r, 0.85, 1.05), tw: r() * 100, fade: range(r, 0.85, 1.15)};
      });
      return {burst, x, y, R, col: colors[k % colors.length], sparks, launchX: x + range(r, -0.04, 0.04) * w};
    });
  }, [count, every, firstAt, sparkCount, radius, colors, launchFrames, w, h, u, portrait, seed]);

  const g = (0.07 * h) / Math.pow(life, 2); // gravity: ~3.5 % H droop over the life

  // global light pulse (video13 scene-light-flash): +31 luma in 1 frame, exp decay tau ~0.3 s
  const pulse = shells.reduce((acc, s) => {
    const t = frame - s.burst;
    return t < 0 ? acc : acc + Math.exp(-t / 7);
  }, 0);
  const light = clamp(pulse) * lightPulse;

  const hill = makeRidge(`${seed}-hill`, w, [2, 3, 5, 9], 0.6);
  const cityTop = h * 0.9;
  const hillY = (x: number) => {
    const k = clamp((x - w * 0.38) / (w * 0.4));
    return h * 0.97 - (portrait ? 0.1 : 0.15) * h * (k * k * (3 - 2 * k)) - 0.012 * h * hill(x);
  };
  const {city, skyline, hillD, canopy} = useMemo(() => {
    const r = rng(`${seed}-city`);
    let sk = `M0 ${h}`;
    const lights: {x: number; y: number; s: number; c: number}[] = [];
    for (let x = 0; x < w; ) {
      const bw = range(r, 24, 70) * u;
      const top = cityTop - range(r, 8, portrait ? 90 : 70) * u;
      sk += `L${x.toFixed(1)} ${top.toFixed(1)}L${(x + bw).toFixed(1)} ${top.toFixed(1)}`;
      for (let k = 0; k < Math.floor((bw * (h - top)) / (1100 * u * u)); k++) lights.push({x: x + r() * bw, y: top + 6 * u + r() * (h - top), s: range(r, 1.5, 3) * u, c: r()});
      x += bw;
    }
    sk += `L${w} ${h}Z`;
    let hd = `M${w * 0.3} ${h + 4}`;
    for (let x = w * 0.3; x <= w + 10; x += 10) hd += `L${x.toFixed(1)} ${hillY(x).toFixed(1)}`;
    hd += `L${w + 10} ${h + 4}Z`;
    const cn: {x: number; y: number; r: number}[] = [];
    for (let x = w * 0.5; x < w + 40 * u; x += range(r, 40, 70) * u) cn.push({x, y: hillY(x) + 10 * u, r: range(r, 34, 62) * u * (portrait ? 1.2 : 1)});
    return {city: lights, skyline: sk, hillD: hd, canopy: cn};
  }, [seed, w, h, u, portrait]);

  return (
    <AbsoluteFill style={{background: scene ? 'linear-gradient(180deg, #17133a 0%, #2a2352 50%, #4a3566 82%, #5c4270 100%)' : 'transparent'}}>
      <Svg>
        <defs>
          <radialGradient id={`${id}-flash`}>
            <stop offset="0%" stopColor="#FFF6E0" stopOpacity={1} />
            <stop offset="18%" stopColor="#FFF6E0" stopOpacity={0.9} />
            <stop offset="45%" stopColor="#FFC48A" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#FFC48A" stopOpacity={0} />
          </radialGradient>
          <filter id={`${id}-blur`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={5 * u} />
          </filter>
        </defs>
        {scene && <Stars w={w} h={h} u={u} frame={frame} count={110} seed={`${seed}-st`} maxY={0.7} opacity={0.8} />}
        {scene && (
          <g opacity={0.5}>
            {[0.18, 0.3].map((yy, i) => (
              <path key={i} d={circlesD([0, 1, 2, 3].map((k) => ({x: w * (0.15 + i * 0.5) + k * 50 * u - ((frame * 0.3 * u) % w), y: h * yy - (k % 2) * 16 * u, r: (34 + (k % 2) * 12) * u})))} fill={mix('#3a3168', '#8a76b0', light)} />
            ))}
          </g>
        )}
        {/* shells */}
        {shells.map((s, k) => {
          const t = frame - s.burst;
          const lt = frame - (s.burst - launchFrames);
          if (lt < 0 || t > life) return null;
          // launch streak
          if (t < 0) {
            const p = ease.out(clamp(lt / launchFrames));
            const y0 = h * 0.95;
            const yy = y0 + (s.y - y0) * p;
            const xx = s.launchX + (s.x - s.launchX) * p;
            return (
              <g key={k}>
                <line x1={xx} y1={yy} x2={xx + (s.launchX - s.x) * 0.1} y2={yy + 80 * u * (1 - p * 0.5)} stroke="#ffe8b8" strokeWidth={3 * u} strokeLinecap="round" opacity={0.85} />
                <line x1={xx} y1={yy} x2={xx} y2={Math.min(y0, yy + 260 * u)} stroke="#ffe8b8" strokeWidth={1.2 * u} opacity={0.25} />
                <circle cx={xx} cy={yy} r={3.5 * u} fill="#fff6e0" />
              </g>
            );
          }
          // flash ball holds a few frames then hands over to the peony
          const flash = t < flashFrames ? 1 : Math.max(0, 1 - (t - flashFrames) / 8);
          const e = cubicOut(clamp(t / expandFrames));
          const hot = clamp(1 - t / 10);
          const pts: {x: number; y: number; px: number; py: number; o: number; r: number}[] = [];
          for (const sp of s.sparks) {
            const rad = s.R * e * sp.sp;
            const rPrev = s.R * cubicOut(clamp((t - 3) / expandFrames)) * sp.sp;
            const drop = 0.5 * g * t * t;
            const dropPrev = 0.5 * g * Math.max(0, t - 3) * Math.max(0, t - 3);
            const x = s.x + sp.dx * rad;
            const y = s.y + sp.dy * rad + drop;
            // sparks fade from the core outward, then twinkle out
            const core = Math.hypot(sp.dx, sp.dy);
            const tt = t / (life * sp.fade);
            const fadeStart = 0.35 + 0.25 * core;
            let o = 1 - clamp((tt - fadeStart) / (1 - fadeStart));
            if (tt > 0.5) o *= (Math.floor(frame + sp.tw) % 3 === 0 ? 0.35 : 1);
            if (o <= 0.02 || t < 1) continue;
            pts.push({x, y, px: s.x + sp.dx * rPrev, py: s.y + sp.dy * rPrev + dropPrev, o, r: (1.6 + 1.6 * (1 - tt)) * u});
          }
          const col = mix(s.col, '#ffffff', hot * 0.7);
          const trails = pts.map((p) => `M${p.px.toFixed(1)} ${p.py.toFixed(1)}L${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('');
          const avgO = pts.length ? pts.reduce((a, p) => a + p.o, 0) / pts.length : 0;
          return (
            <g key={k} style={{mixBlendMode: 'screen'}}>
              {flash > 0 && <circle cx={s.x} cy={s.y} r={150 * u * (0.7 + 0.3 * flash) * (1 + 0.4 * clamp(t / 6))} fill={`url(#${id}-flash)`} opacity={flash} />}
              <g filter={`url(#${id}-blur)`} opacity={0.8 * avgO}>
                <path d={trails} stroke={col} strokeWidth={4 * u} strokeLinecap="round" />
              </g>
              <path d={trails} stroke={col} strokeWidth={1.4 * u} strokeLinecap="round" opacity={0.55 * avgO} />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={mix(col, '#ffffff', 0.4)} opacity={p.o} />
              ))}
            </g>
          );
        })}
        {/* silhouettes brighten with the flash */}
        {scene && (
          <g>
            {/* distant city skyline with lit windows */}
            <path d={skyline} fill={mix('#1a1736', '#3a3060', light)} />
            <rect x={0} y={cityTop} width={w} height={h - cityTop} fill={mix('#1a1736', '#3a3060', light)} />
            {city.map((c, i) => (
              <rect key={i} x={c.x} y={c.y} width={c.s} height={c.s} fill={c.c > 0.3 ? '#ffd88a' : '#9fc1ff'} opacity={0.45 + 0.4 * Math.sin(frame * 0.05 + i)} />
            ))}
            {/* tree-covered hill on the right */}
            <path d={hillD} fill={mix('#1e2b2c', '#4a6a4a', light * 1.6)} />
            <path d={circlesD(canopy)} fill={mix('#223232', '#557a55', light * 1.6)} />
            <path d={circlesD(canopy.map((c) => ({x: c.x - c.r * 0.25, y: c.y - c.r * 0.3, r: c.r * 0.5})))} fill={mix('#2a3c3a', '#6a8f62', light * 1.6)} opacity={0.6} />
          </g>
        )}
      </Svg>
      {light > 0.001 && <AbsoluteFill style={{background: tint, mixBlendMode: 'screen', opacity: light, pointerEvents: 'none'}} />}
      {scene && <FilmGrain opacity={0.05} />}
    </AbsoluteFill>
  );
};

export const fireworks = defineMotion<Props>({
  id: 'fireworks',
  title: 'Fireworks',
  category: 'environment',
  description:
    'Staggered fireworks over a night city: a faint launch streak climbs, a white flash ball holds for a few frames, then a peony of sparks expands with an ease-out-cubic, droops under gravity, fades from the core out and twinkles away, while a warm global light pulse briefly lifts the whole scene.',
  source: ['video13 1:02-1:04 firework-burst', 'video13 1:05 scene-light-flash'],
  useFor: 'Celebrations, launches, milestones, "it worked!" beats, festive end cards.',
  durationInFrames: 210,
  defaultProps: {
    count: 6,
    every: 30,
    firstAt: 4,
    sparkCount: 170,
    radius: 195,
    colors: ['#ffcf73', '#ff7aa8', '#8fd3ff', '#ffd27a', '#b6ff8f', '#ff9a5a'],
    launchFrames: 12,
    flashFrames: 3,
    expandFrames: 27,
    fadeFrames: 30,
    lightPulse: 0.3,
    tint: '#FFC48A',
    scene: true,
    seed: 'festival',
  },
  propDocs: {
    count: 'number of shells',
    every: 'frames between launches',
    firstAt: 'frame of the first launch',
    sparkCount: 'sparks per burst',
    radius: 'burst radius in u (195 = 18 % of a 1080 frame)',
    colors: 'spark colours, one per shell (cycled)',
    launchFrames: 'launch streak duration',
    flashFrames: 'frames the white flash ball holds',
    expandFrames: 'burst expansion (ease-out cubic)',
    fadeFrames: 'extra frames for the sparks to fade and twinkle out',
    lightPulse: 'peak opacity of the warm global light pulse',
    tint: 'light pulse colour (screen blend)',
    scene: 'paint the night sky + city (false = transparent overlay)',
    seed: 'random seed',
  },
  component: Fireworks,
  tags: ['fireworks', 'celebration', 'night', 'burst', 'party', 'flash'],
});
