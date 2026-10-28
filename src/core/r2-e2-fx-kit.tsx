import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from './ease';
import {rng} from './random';
import {Svg, useStage} from './stage';

/**
 * Round-2 group E2 fx helpers: branch-grow 'explosion' layout (1 -> 2 -> 4 ... branches, a split every
 * eighth / sixteenth note, shockwave rings on hits). Idea from pdoom-video scenes/room.ts (MIT) — see THIRD_PARTY_NOTICES.md.
 */

export interface BranchBeatProps {
  maxDepth: number;
  splitOn: 'beat' | 'eighth' | 'sixteenth';
  bpm: number;
  angleSpread: number;
  lengthDecay: number;
  startAt: number;
  color: string;
  tipColor: string;
  seed: number;
  rings: number[];
}

type Node = {x: number; y: number; ang: number; len: number; k: number};

export const BranchExplosion: React.FC<BranchBeatProps> = ({maxDepth, splitOn, bpm, angleSpread, lengthDecay, startAt, color, tipColor, seed, rings}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, portrait} = useStage();
  const beatF = (30 * 60) / Math.max(40, bpm);
  const D = Math.max(2, Math.min(10, Math.round(maxDepth)));
  const dur = (k: number) => {
    const base = splitOn === 'beat' ? beatF : splitOn === 'eighth' ? beatF / 2 : beatF / 4;
    // "then every sixteenth": the cascade accelerates after the first half of the levels
    return splitOn === 'eighth' && k >= Math.floor(D / 2) ? beatF / 4 : base;
  };
  const times = useMemo(() => {
    const t: number[] = [];
    let a = startAt;
    for (let k = 0; k < D; k++) {
      t.push(a);
      a += dur(k);
    }
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [D, splitOn, bpm, startAt]);
  const tree = useMemo(() => {
    const r = rng(seed);
    const x0 = cx;
    const y0 = portrait ? h * 0.9 : h * 0.9;
    const L0 = h * (portrait ? 0.15 : 0.19);
    const levels: Node[][] = [[{x: x0, y: y0, ang: -Math.PI / 2, len: L0, k: 0}]];
    for (let k = 1; k < D; k++) {
      const next: Node[] = [];
      for (const n of levels[k - 1]) {
        const ex = n.x + Math.cos(n.ang) * n.len;
        const ey = n.y + Math.sin(n.ang) * n.len;
        for (const side of [-1, 1]) {
          const a = n.ang + side * ((angleSpread * (0.75 + r() * 0.5) * Math.PI) / 180);
          next.push({x: ex, y: ey, ang: a, len: n.len * lengthDecay * (0.88 + r() * 0.24), k});
        }
      }
      levels.push(next);
    }
    return levels;
  }, [D, angleSpread, lengthDecay, seed, cx, h, portrait]);
  const mix = (k: number) => {
    const t = k / Math.max(1, D - 1);
    const a = parseInt(color.slice(1), 16);
    const b = parseInt(tipColor.slice(1), 16);
    const c = (sh: number) => Math.round(((a >> sh) & 255) * (1 - t) + ((b >> sh) & 255) * t);
    return `rgb(${c(16)},${c(8)},${c(0)})`;
  };
  const els: React.ReactNode[] = [];
  tree.forEach((lvl, k) => {
    const p = prog(frame, times[k], times[k] + dur(k) * 1.25, ease.out);
    if (p <= 0) return;
    let d = '';
    for (const n of lvl) {
      const ex = n.x + Math.cos(n.ang) * n.len * p;
      const ey = n.y + Math.sin(n.ang) * n.len * p;
      d += `M${n.x.toFixed(1)} ${n.y.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`;
    }
    els.push(<path key={k} d={d} stroke={mix(k)} strokeWidth={Math.max(1.2, 7 * Math.pow(0.78, k)) * u} strokeLinecap="round" fill="none" />);
  });
  // shockwave rings on the listed frames (relative to startAt) and on the final level
  const hits = [startAt, ...rings.map((r) => startAt + r), times[D - 1]];
  return (
    <AbsoluteFill>
      <Svg>
        {els}
        {hits.map((hf, i) => {
          const t = prog(frame, hf, hf + 16, ease.out);
          if (t <= 0 || t >= 1) return null;
          return <circle key={i} cx={cx} cy={h * 0.9} r={t * Math.max(w, h) * 0.55} fill="none" stroke={tipColor} strokeWidth={5 * u * (1 - t)} opacity={0.7 * (1 - t)} />;
        })}
        {frame >= times[D - 1] &&
          tree[D - 1].map((n, i) => {
            const ex = n.x + Math.cos(n.ang) * n.len;
            const ey = n.y + Math.sin(n.ang) * n.len;
            const pop = clamp((frame - times[D - 1] - (i % 8) * 0.5) / 6);
            return <circle key={i} cx={ex} cy={ey} r={2.6 * u * pop} fill={tipColor} />;
          })}
      </Svg>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ ribbon-trail 'dabs' (paint-note ribbon) */

export interface DabRibbonProps {
  bezier: number[][];
  dabs: number;
  dabLife: number;
  dabCols: string[];
  drip: number;
  dabWidth: number[];
  startAt: number;
  flyFrames: number;
  seed: number;
}

const bez = (b: number[][], t: number): [number, number] => {
  const m = 1 - t;
  const f = (i: number) => m * m * m * b[0][i] + 3 * m * m * t * b[1][i] + 3 * m * t * t * b[2][i] + t * t * t * b[3][i];
  return [f(0), f(1)];
};

/** a ribbon of knife dabs carries colour along a cubic Bezier; dabs drip and fade */
export const DabRibbon: React.FC<DabRibbonProps> = ({bezier, dabs, dabLife, dabCols, drip, dabWidth, startAt, flyFrames, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const B = bezier.map((q) => [q[0] * w, q[1] * h]);
  const r = rng(seed);
  const n = Math.max(4, dabs);
  const items = Array.from({length: n}, (_, i) => {
    const uu = i / (n - 1);
    const spawn = startAt + (flyFrames * ease.inOut(uu)) ;
    const p0 = bez(B, Math.max(0, uu - 0.01));
    const p1 = bez(B, Math.min(1, uu + 0.01));
    const ang = (Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * 180) / Math.PI;
    const [x, y] = bez(B, uu);
    const wd = (dabWidth[0] + (dabWidth[1] - dabWidth[0]) * Math.sin(Math.PI * uu) * (0.7 + 0.6 * r())) * u;
    return {x, y, ang: ang + (r() - 0.5) * 24, spawn, wd, c: Math.floor(r() * dabCols.length), c2: Math.floor(r() * dabCols.length), dr: r() < drip ? 1 : 0, dl: 0.8 + r() * 1.6};
  });
  const gid = 'dab-ribbon';
  return (
    <AbsoluteFill>
      <Svg>
        <defs>
          {dabCols.map((c, i) => (
            <linearGradient key={i} id={`${gid}-g${i}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={c} />
              <stop offset="1" stopColor={dabCols[(i + 1) % dabCols.length]} />
            </linearGradient>
          ))}
        </defs>
        {items.map((it, i) => {
          const a = frame - it.spawn;
          if (a < 0) return null;
          const pop = prog(a, 0, 5, ease.out);
          const fade = 1 - prog(a, dabLife - 14, dabLife, ease.in);
          if (fade <= 0) return null;
          const dl = it.dr ? it.wd * 2.4 * it.dl * prog(a, 6, dabLife, ease.in) : 0;
          return (
            <g key={i} opacity={fade}>
              {it.dr ? <line x1={it.x} y1={it.y} x2={it.x} y2={it.y + dl} stroke={dabCols[it.c]} strokeWidth={Math.max(2 * u, it.wd * 0.12)} strokeLinecap="round" opacity={0.85} /> : null}
              <g transform={`translate(${it.x} ${it.y}) rotate(${it.ang}) scale(${pop})`}>
                <rect x={-it.wd / 2} y={-it.wd * 0.35} width={it.wd} height={it.wd * 0.7} rx={it.wd * 0.25} fill={`url(#${gid}-g${it.c})`} />
                <rect x={-it.wd * 0.4} y={-it.wd * 0.14} width={it.wd * 0.5} height={it.wd * 0.1} rx={it.wd * 0.05} fill="#fff" opacity={0.25} />
              </g>
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};
