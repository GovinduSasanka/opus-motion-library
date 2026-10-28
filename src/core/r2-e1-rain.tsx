import React from 'react';

/** Wet-ground reflections for rain (group E1): vertical neon streaks with ripple bands, or painterly dabs. Deterministic. */

const h01 = (seed: number, i: number, k: number) => {
  let x = (seed * 374761393 + i * 668265263 + k * 2147483647) | 0;
  x = (x ^ (x >>> 13)) * 1274126177;
  return (((x ^ (x >>> 16)) >>> 0) % 100000) / 100000;
};

export const GroundReflections: React.FC<{
  mode: 'streaks' | 'dabs';
  w: number;
  h: number;
  u: number;
  horizon: number;
  frame: number;
  seed: number;
  lights: {x: number; color: string}[];
  alpha: number;
}> = ({mode, w, h, u, horizon, frame, seed, lights, alpha}) => {
  const ground = h - horizon;
  const id = `rr-${seed}`;
  const twos = Math.floor(frame / 2);
  return (
    <g>
      <defs>
        <filter id={`${id}-b`} x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation={`${5 * u} ${1.5 * u}`} />
        </filter>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#02060b" stopOpacity={0.7} />
        </linearGradient>
        <pattern id={`${id}-bands`} width={6 * u} height={6 * u} patternUnits="userSpaceOnUse">
          <rect width={6 * u} height={6 * u} fill="#000" opacity={0} />
          <rect y={2 * u} width={6 * u} height={2 * u} fill="#02060b" opacity={0.3} />
        </pattern>
      </defs>
      {lights.map((l, li) => {
        if (mode === 'streaks') {
          return (
            <g key={li} filter={`url(#${id}-b)`}>
              {Array.from({length: 6}, (_, i) => {
                const wob = Math.sin(frame * 0.12 + li * 2 + i) * 2 * u;
                return <rect key={i} x={l.x - (7 + i * 1.5) * u + wob} y={horizon + i * 26 * u * 0.6} width={(14 + i * 3) * u} height={ground * 0.55} fill={l.color} opacity={alpha * 0.3 * (1 - i / 7)} />;
              })}
            </g>
          );
        }
        const n = 6 + Math.floor(h01(seed, li, 1) * 9);
        return (
          <g key={li}>
            {Array.from({length: n}, (_, i) => {
              const t = i / n;
              const y = horizon + 10 * u + t * ground * 0.82;
              const wd = (80 - 50 * t) * u * (0.6 + 0.8 * h01(seed, li * 31 + i, 2));
              if (h01(seed, li * 17 + i, 3) < 0.18) return null;
              const jit = ((h01(seed, li * 13 + i, 4) - 0.5) * 6 + ((twos + i) % 2 ? 3 : -3)) * u;
              const rot = (h01(seed, li * 7 + i, 5) - 0.5) * 3;
              return <rect key={i} x={l.x - wd / 2 + jit} y={y} width={wd} height={(7 + 3 * h01(seed, i, li)) * u} rx={2 * u} fill={l.color} opacity={alpha * (1 - 0.8 * t)} transform={`rotate(${rot} ${l.x} ${y})`} />;
            })}
          </g>
        );
      })}
      {mode === 'streaks' && (
        <>
          <rect x={0} y={horizon} width={w} height={ground} fill={`url(#${id}-bands)`} />
          <rect x={0} y={horizon} width={w} height={ground} fill={`url(#${id}-fade)`} />
        </>
      )}
    </g>
  );
};

export const reflectionLights = (w: number, lampX: number, lampColor: string, colors: string[], seed: number) => {
  const out = [{x: lampX, color: lampColor}];
  const n = Math.max(0, colors.length);
  for (let i = 0; i < n; i++) out.push({x: w * (0.08 + 0.84 * h01(seed, i, 9)), color: colors[i]});
  return out;
};
