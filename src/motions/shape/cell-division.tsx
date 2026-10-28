import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {dash1, mix} from '../../core/shape-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video6 3.15-4.6 s `cell-division-doubling` + `binary-tree-grow`: inside a cream egg outline with a faint
 * hex texture, glossy gold nuclei bud and split, doubling every few frames (1 -> 2 -> ... -> 256), relaxing
 * to fill the container, joined by lavender spindle lines while they separate; a dendrogram in the corner
 * grows one level per doubling; at the end the nuclei flatten to cream dots.
 */
type Props = {
  background: string;
  outlineColor: string;
  nucleusColors: string[];
  lineColor: string;
  dotColor: string;
  generations: number;
  framesPerDoubling: number;
  start: number;
  tree: boolean;
  showCount: boolean;
  seed: number;
};

const CellDivision: React.FC<Props> = ({background, outlineColor, nucleusColors, lineColor, dotColor, generations, framesPerDoubling, start, tree, showCount, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames} = useStage();
  const G = Math.max(1, Math.min(10, Math.round(generations)));
  const P = framesPerDoubling;

  // container: tilted egg / bullet
  const tilt = ((portrait ? -68 : -30) * Math.PI) / 180;
  const A = portrait ? 0.68 * w : 0.31 * w;
  const B = A * 0.35;
  const ecx = portrait ? 0.5 * w : 0.45 * w;
  const ecy = portrait ? 0.6 * h : 0.54 * h;
  const eggR = (t: number) => {
    // local egg radius scale: blunt at +x (anterior), narrower toward -x
    return 1 - 0.16 * Math.cos(t) * -1 * 0.5;
  };
  const eggPts = Array.from({length: 120}, (_, i) => {
    const t = (i / 120) * Math.PI * 2;
    const x = A * Math.cos(t);
    const y = B * Math.sin(t) * (1 + 0.14 * Math.cos(t)) * eggR(t);
    return [ecx + x * Math.cos(tilt) - y * Math.sin(tilt), ecy + x * Math.sin(tilt) + y * Math.cos(tilt)] as const;
  });
  const eggD = 'M ' + eggPts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ') + ' Z';
  const toScreen = (x: number, y: number) => [ecx + x * Math.cos(tilt) - y * Math.sin(tilt), ecy + x * Math.sin(tilt) + y * Math.cos(tilt)] as const;

  const area = Math.PI * A * B * 0.86;
  const rOf = (g: number) => Math.min(46 * u, 0.3 * Math.sqrt(area / Math.pow(2, g)));

  // precomputed generations (local, unrotated coords)
  const gens = useMemo(() => {
    const r = rng(seed);
    const out: [number, number][][] = [[[0, 0]]];
    const dirs: number[][] = [];
    for (let g = 1; g <= G; g++) {
      const prev = out[g - 1];
      const n = prev.length * 2;
      const s = Math.sqrt(area / n) * 1.1;
      const pts: [number, number][] = [];
      const dg: number[] = [];
      prev.forEach(([px, py]) => {
        const a = r() * Math.PI;
        dg.push(a);
        const dx = Math.cos(a) * s * 0.5;
        const dy = Math.sin(a) * s * 0.5;
        pts.push([px - dx, py - dy], [px + dx, py + dy]);
      });
      const rg = rOf(g);
      for (let it = 0; it < 32; it++) {
        for (let i = 0; i < n; i++)
          for (let j = i + 1; j < n; j++) {
            const dx = pts[j][0] - pts[i][0];
            const dy = pts[j][1] - pts[i][1];
            const d = Math.hypot(dx, dy) || 0.01;
            if (d < s) {
              const push = ((s - d) / d) * 0.25;
              pts[i][0] -= dx * push;
              pts[i][1] -= dy * push;
              pts[j][0] += dx * push;
              pts[j][1] += dy * push;
            }
          }
        for (const p of pts) {
          const ma = A - rg * 1.5;
          const mb = B - rg * 1.5;
          const k = Math.hypot(p[0] / ma, p[1] / mb);
          if (k > 1) {
            p[0] /= k;
            p[1] /= k;
          }
        }
      }
      out.push(pts);
      dirs.push(dg);
    }
    return out;
  }, [G, seed, A, B, area, u]);

  const k = (frame - start) / P;
  const g = clamp(Math.floor(k), 0, G);
  const split = g >= G ? 0 : clamp(k - g);
  const eSplit = split < 0.5 ? 0.25 * ease.inOut(split * 2) : 0.25 + 0.75 * ease.out((split - 0.5) * 2);
  const flat = prog(frame, start + G * P + 2, start + G * P + 12, ease.out);
  const born = prog(frame, start - 10, start - 2, ease.back);
  const outlineP = prog(frame, 0, 16, ease.inOut);
  const breathe = 1 - 0.05 * prog(frame, start + G * P + 6, durationInFrames, ease.sine);

  const nuclei: {x: number; y: number; r: number; sib?: readonly [number, number]}[] = [];
  if (frame >= start - 10) {
    const cur = gens[g];
    if (g < G && split > 0) {
      const nxt = gens[g + 1];
      const r0 = rOf(g);
      const r1 = rOf(g + 1);
      cur.forEach(([px, py], i) => {
        const c0 = nxt[i * 2];
        const c1 = nxt[i * 2 + 1];
        const a = [lerp(px, c0[0], eSplit), lerp(py, c0[1], eSplit)] as const;
        const b = [lerp(px, c1[0], eSplit), lerp(py, c1[1], eSplit)] as const;
        const rr = lerp(r0, r1, ease.out(split));
        nuclei.push({x: a[0], y: a[1], r: rr, sib: b}, {x: b[0], y: b[1], r: rr});
      });
    } else {
      cur.forEach(([x, y]) => nuclei.push({x, y, r: rOf(g) * (g === 0 ? born : 1)}));
    }
  }

  const c0 = nucleusColors[0] ?? '#F6C886';
  const c1 = nucleusColors[1] ?? '#E7B96B';
  const c2 = nucleusColors[2] ?? '#B8863F';
  const spindle = Math.sin(Math.PI * split);
  const count = g < G && split > 0.5 ? Math.pow(2, g + 1) : Math.pow(2, g);

  // binary tree (top-right)
  const tw = (portrait ? 0.4 : 0.19) * w;
  const tx0 = w - tw - 0.04 * w;
  const ty0 = 0.05 * h;
  const tdy = (portrait ? 26 : 24) * u * (8 / Math.max(G, 6));
  const treeLines: React.ReactNode[] = [];
  if (tree) {
    for (let L = 1; L <= G; L++) {
      const t0 = start + (L - 1) * P;
      const p = prog(frame, t0, t0 + P * 0.7, ease.out);
      if (p <= 0) continue;
      const nPar = Math.pow(2, L - 1);
      const yTop = ty0 + (L - 1) * tdy + 6 * u;
      const yBar = yTop + tdy * 0.45;
      const yBot = yTop + tdy;
      let d = '';
      for (let i = 0; i < nPar; i++) {
        const px = tx0 + ((i + 0.5) / nPar) * tw;
        const ax = tx0 + ((2 * i + 0.5) / (2 * nPar)) * tw;
        const bx = tx0 + ((2 * i + 1.5) / (2 * nPar)) * tw;
        d += `M ${px} ${yTop} L ${px} ${yBar} M ${ax} ${yBot} L ${ax} ${yBar} L ${bx} ${yBar} L ${bx} ${yBot} `;
      }
      treeLines.push(<path key={L} d={d} fill="none" stroke={L >= 6 ? mix(lineColor, '#4A5A9A', 0.6) : lineColor} strokeWidth={(L >= 6 ? 1 : 1.3) * u} opacity={p} />);
    }
  }

  return (
    <AbsoluteFill style={{background}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 45% 55%, rgba(233,224,213,0.06) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)'}} />
      <Svg>
        <defs>
          <clipPath id="cd-egg">
            <path d={eggD} />
          </clipPath>
          <pattern id="cd-hex" patternUnits="userSpaceOnUse" width={36 * u} height={62.35 * u} patternTransform={`rotate(${(tilt * 180) / Math.PI})`}>
            <path
              d={`M ${18 * u} 0 L ${36 * u} ${10.39 * u} L ${36 * u} ${31.18 * u} L ${18 * u} ${41.57 * u} L 0 ${31.18 * u} L 0 ${10.39 * u} Z M ${18 * u} ${41.57 * u} L ${18 * u} ${62.35 * u}`}
              fill="none"
              stroke={outlineColor}
              strokeWidth={1 * u}
              opacity={0.16}
            />
          </pattern>
          <radialGradient id="cd-nuc" cx="38%" cy="34%" r="70%">
            <stop offset="0%" stopColor={c0} />
            <stop offset="55%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </radialGradient>
        </defs>
        <g transform={`translate(${ecx} ${ecy}) scale(${breathe}) translate(${-ecx} ${-ecy})`}>
          <g clipPath="url(#cd-egg)" opacity={outlineP}>
            <path d={eggD} fill="rgba(233,224,213,0.035)" />
            <rect x={0} y={0} width={w} height={h} fill="url(#cd-hex)" />
            {(() => {
              const [x0, y0] = toScreen(-A * 0.92, 0);
              const [x1, y1] = toScreen(A * 0.92, 0);
              return <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={outlineColor} strokeWidth={1.2 * u} opacity={0.18} />;
            })()}
          </g>
          <path d={eggD} fill="none" stroke={outlineColor} strokeWidth={9 * u} strokeOpacity={0.08} {...dash1(outlineP)} />
          <path d={eggD} fill="none" stroke={outlineColor} strokeWidth={3.2 * u} strokeLinejoin="round" {...dash1(outlineP)} />
          {spindle > 0.02 &&
            nuclei.map((n, i) => {
              if (!n.sib) return null;
              const [ax, ay] = toScreen(n.x, n.y);
              const [bx, by] = toScreen(n.sib[0], n.sib[1]);
              const mx = (ax + bx) / 2;
              const my = (ay + by) / 2;
              const dx = bx - ax;
              const dy = by - ay;
              const bow = 0.35;
              return (
                <g key={`s${i}`} opacity={spindle * 0.8} stroke={lineColor} strokeWidth={1.1 * u} fill="none">
                  <path d={`M ${ax} ${ay} Q ${mx - dy * bow} ${my + dx * bow} ${bx} ${by}`} />
                  <path d={`M ${ax} ${ay} Q ${mx + dy * bow} ${my - dx * bow} ${bx} ${by}`} />
                  <line x1={ax} y1={ay} x2={bx} y2={by} opacity={0.6} />
                </g>
              );
            })}
          {nuclei.map((n, i) => {
            const [x, y] = toScreen(n.x, n.y);
            const r = n.r * lerp(1, 0.55, flat);
            const big = r > 14 * u;
            return (
              <g key={i}>
                {big &&
                  Array.from({length: 12}, (_, k2) => {
                    const a = (k2 / 12) * Math.PI * 2 + i;
                    return <line key={k2} x1={x + Math.cos(a) * r * 1.12} y1={y + Math.sin(a) * r * 1.12} x2={x + Math.cos(a) * r * 1.32} y2={y + Math.sin(a) * r * 1.32} stroke={lineColor} strokeWidth={1 * u} opacity={0.55} />;
                  })}
                <circle cx={x} cy={y} r={r} fill="url(#cd-nuc)" stroke="#5a3d17" strokeWidth={1 * u} strokeOpacity={0.6} opacity={1 - flat} />
                {flat > 0 && <circle cx={x} cy={y} r={r} fill={dotColor} opacity={flat} />}
                {big && <circle cx={x - r * 0.35} cy={y - r * 0.38} r={r * 0.17} fill="#FFFFFF" opacity={0.85 * (1 - flat)} />}
              </g>
            );
          })}
        </g>
        {tree && frame >= start && (
          <g>
            <circle cx={tx0 + tw / 2} cy={ty0 + 2 * u} r={3.5 * u} fill="none" stroke={lineColor} strokeWidth={1.3 * u} />
            {treeLines}
          </g>
        )}
      </Svg>
      {showCount && frame >= start - 8 && (
        <div
          style={{
            position: 'absolute',
            right: 0.04 * w,
            top: ty0 + G * tdy + (portrait ? 36 : 26) * u,
            width: tw,
            textAlign: 'center',
            fontFamily: fonts.mono,
            fontSize: (portrait ? 46 : 30) * u,
            letterSpacing: 2 * u,
            color: outlineColor,
            opacity: 0.85,
          }}
        >
          {count.toLocaleString('en-US')} <span style={{opacity: 0.55, fontSize: (portrait ? 30 : 20) * u}}>CELLS</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const cellDivision = defineMotion<Props>({
  id: 'cell-division',
  title: 'Cell division doubling',
  category: 'shape',
  description: 'Glossy gold nuclei bud and split inside an egg outline, doubling every few frames up to 256, while a corner binary tree grows one level per doubling.',
  source: ['video6 0:03.15-0:04.6'],
  useFor: 'Exponential growth, doubling, compounding, replication, "one becomes many".',
  durationInFrames: 120,
  defaultProps: {
    background: '#180F0B',
    outlineColor: '#E9E0D5',
    nucleusColors: ['#F6C886', '#E7B96B', '#B8863F'],
    lineColor: '#7589CB',
    dotColor: '#EFE6D2',
    generations: 8,
    framesPerDoubling: 8,
    start: 20,
    tree: true,
    showCount: true,
    seed: 6,
  },
  propDocs: {
    outlineColor: 'egg outline / count text colour',
    nucleusColors: '[highlight, base, rim] of the gold nuclei',
    lineColor: 'spindle lines and binary tree',
    dotColor: 'colour the nuclei flatten to at the end',
    generations: 'number of doublings (8 = 256 nuclei, max 10)',
    framesPerDoubling: 'frames per doubling (source: 5 at 30 fps)',
    start: 'frame of the first split',
    tree: 'grow the binary-tree diagram in the top-right corner',
    showCount: 'show the running count under the tree',
  },
  component: CellDivision,
  tags: ['growth', 'exponential', 'doubling', 'biology', 'tree'],
});
