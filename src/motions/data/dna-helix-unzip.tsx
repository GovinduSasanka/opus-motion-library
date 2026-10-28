import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * DNA helix unzip: a rotating double helix draws on, base-pair rungs (A-T, G-C) fill in coloured by base, then a
 * zipper point runs along the axis and the two strands peel apart, leaving half-rungs with letter tags.
 * Horizontal axis in landscape / square, vertical axis in portrait.
 */
type Props = {
  title: string;
  caption: string;
  sequence: string;
  background: string;
  strandA: string;
  strandB: string;
  inkColor: string;
  baseColors: {A: string; T: string; G: string; C: string};
  pairs: number;
  turns: number;
  spin: number;
  unzipAt: number;
  unzipFrames: number;
  letters: boolean;
  seed: number;
};

const COMP: Record<string, string> = {A: 'T', T: 'A', G: 'C', C: 'G'};

const DnaHelixUnzip: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const n = Math.max(6, Math.round(p.pairs));

  const seq = React.useMemo(() => {
    const clean = p.sequence.toUpperCase().replace(/[^ATGC]/g, '');
    const g = rng(p.seed * 31 + 7);
    return Array.from({length: n}, (_, i) => clean[i % Math.max(1, clean.length)] ?? 'ATGC'[Math.floor(g() * 4)]);
  }, [p.sequence, p.seed, n]);

  // axis geometry
  const L = portrait ? h * 0.66 : w * 0.8;
  const R = portrait ? Math.min(w * 0.17, 170 * u) : Math.min(h * 0.19, 190 * u);
  const axisC = portrait ? {x: cx, y: cy + h * 0.04} : {x: cx, y: cy + h * 0.05};
  const maxSep = portrait ? w * 0.24 : h * 0.2;
  const toXY = (s: number, off: number): [number, number] =>
    portrait ? [axisC.x + off, axisC.y - L / 2 + s * L] : [axisC.x - L / 2 + s * L, axisC.y + off];

  const k = p.turns * Math.PI * 2;
  const phase = frame * 0.045 * p.spin;
  const draw = prog(frame, 4, 40, ease.out);
  const rungIn = (i: number) => prog(frame, 22 + i * 1.6, 34 + i * 1.6, ease.back);
  const zip = prog(frame, p.unzipAt, p.unzipAt + p.unzipFrames, ease.inOut);
  const zipS = lerp(-0.08, 1.12, zip);
  const ramp = 0.16;
  const sepAt = (s: number) => {
    const t = clamp((zipS - s) / ramp);
    return t * t * (3 - 2 * t);
  };

  const strand = (sign: 1 | -1) => {
    const N = 160;
    const front: string[] = [];
    const pts: {x: number; y: number; z: number}[] = [];
    for (let j = 0; j <= N; j++) {
      const s = (j / N) * draw;
      const a = k * s + phase + (sign < 0 ? Math.PI : 0);
      const sep = sepAt(s);
      const off = R * Math.sin(a) * (1 - sep * 0.55) + sign * sep * maxSep;
      const [x, y] = toXY(s, off);
      pts.push({x, y, z: Math.cos(a)});
    }
    // split into segments by depth so back halves are dimmer
    const segs: {d: string; z: number}[] = [];
    for (let j = 0; j < pts.length - 1; j += 4) {
      const chunk = pts.slice(j, Math.min(pts.length, j + 5));
      const z = chunk.reduce((m, q) => m + q.z, 0) / chunk.length;
      segs.push({d: chunk.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(''), z});
    }
    void front;
    return segs;
  };

  const segA = strand(1);
  const segB = strand(-1);

  const rungs = seq.map((b, i) => {
    const s = (i + 0.5) / n;
    const a = k * s + phase;
    const sep = sepAt(s);
    const offA = R * Math.sin(a) * (1 - sep * 0.55) + sep * maxSep;
    const offB = R * Math.sin(a + Math.PI) * (1 - sep * 0.55) - sep * maxSep;
    return {b, c: COMP[b], s, a, sep, offA, offB, z: Math.cos(a), vis: rungIn(i) * (s <= draw + 0.01 ? 1 : 0)};
  });

  const titleIn = prog(frame, 8, 30, ease.out);
  const capIn = prog(frame, p.unzipAt + p.unzipFrames * 0.6, p.unzipAt + p.unzipFrames * 0.6 + 20, ease.out);
  const sw = 12 * u;
  const rungW = 9 * u;
  const tag = 26 * u;

  const strandEl = (segs: {d: string; z: number}[], color: string, key: string) =>
    segs.map((sg, i) => (
      <path
        key={key + i}
        d={sg.d}
        fill="none"
        stroke={color}
        strokeWidth={sw * (0.75 + 0.25 * (sg.z + 1) / 2)}
        strokeLinecap="round"
        opacity={0.45 + 0.55 * (sg.z + 1) / 2}
      />
    ));

  const titleSize = (portrait ? 72 : 64) * u;
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        {/* faint axis grid */}
        {Array.from({length: 11}, (_, i) => {
          const [x1, y1] = toXY(i / 10, -maxSep - R * 1.1);
          const [x2, y2] = toXY(i / 10, maxSep + R * 1.1);
          return <line key={'g' + i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={p.inkColor} strokeOpacity={0.06 * draw} strokeWidth={1.5 * u} />;
        })}
        {/* back strands */}
        {strandEl(segA.filter((s) => s.z < 0), p.strandA, 'ab')}
        {strandEl(segB.filter((s) => s.z >= 0), p.strandB, 'bb')}
        {/* rungs */}
        {rungs.map((r, i) => {
          if (r.vis <= 0) return null;
          const [ax, ay] = toXY(r.s, r.offA);
          const [bx, by] = toXY(r.s, r.offB);
          const mx = lerp(ax, bx, 0.5);
          const my = lerp(ay, by, 0.5);
          const half = 1 - r.sep; // closed: halves meet in the middle; open: halves shrink to stubs
          const reach = lerp(0.5, 0.0, r.sep) + 0.0;
          const stub = R * 0.6;
          const dirA = portrait ? [-1, 0] : [0, -1];
          const endA: [number, number] =
            r.sep < 1 ? [lerp(ax, mx, 1) * half + (ax + -dirA[0] * stub * 0 + dirA[0] * stub) * (1 - half), lerp(ay, my, 1) * half + (ay + dirA[1] * stub) * (1 - half)] : [ax + dirA[0] * stub, ay + dirA[1] * stub];
          const endB: [number, number] =
            r.sep < 1 ? [mx * half + (bx - dirA[0] * stub) * (1 - half), my * half + (by - dirA[1] * stub) * (1 - half)] : [bx - dirA[0] * stub, by - dirA[1] * stub];
          void reach;
          const op = (0.5 + 0.5 * Math.abs(r.z)) * r.vis;
          const gap = r.sep > 0.05 ? 0 : 2 * u;
          const showTag = p.letters && r.sep > 0.6;
          return (
            <g key={'r' + i} opacity={op}>
              <line x1={ax} y1={ay} x2={endA[0] + (gap ? 0 : 0)} y2={endA[1]} stroke={p.baseColors[r.b as 'A']} strokeWidth={rungW} strokeLinecap="round" />
              <line x1={bx} y1={by} x2={endB[0]} y2={endB[1]} stroke={p.baseColors[r.c as 'A']} strokeWidth={rungW} strokeLinecap="round" />
              {showTag && (
                <>
                  <text x={endA[0] + dirA[0] * tag * 0.9} y={endA[1] + dirA[1] * tag * 0.9 + tag * 0.35} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={tag} fill={p.baseColors[r.b as 'A']} opacity={(r.sep - 0.6) / 0.4}>
                    {r.b}
                  </text>
                  <text x={endB[0] - dirA[0] * tag * 0.9} y={endB[1] - dirA[1] * tag * 0.9 + tag * 0.35} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={tag} fill={p.baseColors[r.c as 'A']} opacity={(r.sep - 0.6) / 0.4}>
                    {r.c}
                  </text>
                </>
              )}
            </g>
          );
        })}
        {/* front strands */}
        {strandEl(segA.filter((s) => s.z >= 0), p.strandA, 'af')}
        {strandEl(segB.filter((s) => s.z < 0), p.strandB, 'bf')}
        {/* zipper marker */}
        {zip > 0 && zip < 1 && (() => {
          const [zx, zy] = toXY(clamp(zipS - ramp * 0.15, 0, 1), 0);
          return <circle cx={zx} cy={zy} r={14 * u} fill="none" stroke={p.inkColor} strokeOpacity={0.7} strokeWidth={3 * u} />;
        })()}
      </Svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: portrait ? h * 0.06 : h * 0.07,
          textAlign: 'center',
          fontFamily: fonts.grotesk,
          fontWeight: 700,
          fontSize: titleSize,
          letterSpacing: '0.02em',
          color: p.inkColor,
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 20 * u}px)`,
        }}
      >
        {p.title}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: portrait ? h * 0.06 : h * 0.06,
          textAlign: 'center',
          fontFamily: fonts.mono,
          fontSize: 28 * u,
          letterSpacing: '0.12em',
          color: p.inkColor,
          opacity: capIn * 0.75,
        }}
      >
        {p.caption}
      </div>
    </AbsoluteFill>
  );
};

export const dnaHelixUnzip = defineMotion<Props>({
  id: 'dna-helix-unzip',
  title: 'DNA helix unzip',
  category: 'data',
  description:
    'A rotating DNA double helix draws on, coloured A-T / G-C base-pair rungs fill in, then a zipper point runs along the axis and the two strands peel apart into half-rungs with letter tags.',
  source: ['original'],
  useFor: 'Biology / genetics explainers, "copying the code" or "unlocking" metaphors, biotech and health intros.',
  durationInFrames: 180,
  defaultProps: {
    title: 'REPLICATION',
    caption: 'EACH STRAND BECOMES A TEMPLATE',
    sequence: 'ATGCGTACCGATTAGC',
    background: '#0E1726',
    strandA: '#4FC3F7',
    strandB: '#F48FB1',
    inkColor: '#E8EEF6',
    baseColors: {A: '#FFB74D', T: '#81C784', G: '#BA68C8', C: '#FFF176'},
    pairs: 16,
    turns: 2,
    spin: 1,
    unzipAt: 70,
    unzipFrames: 80,
    letters: true,
    seed: 3,
  },
  propDocs: {
    title: 'heading above the helix',
    caption: 'line shown once the strands have separated',
    sequence: 'bases for strand A (A/T/G/C); complements are derived; repeats if shorter than pairs',
    background: 'scene background colour',
    strandA: 'colour of the first backbone',
    strandB: 'colour of the second backbone',
    inkColor: 'text and guide colour',
    baseColors: 'colour per base {A,T,G,C}',
    pairs: 'number of base-pair rungs',
    turns: 'helix turns along the axis',
    spin: 'rotation speed multiplier (0 = still)',
    unzipAt: 'frame the unzip starts',
    unzipFrames: 'length of the unzip in frames',
    letters: 'show base letters on the separated half-rungs',
    seed: 'seed for bases when sequence is empty',
  },
  component: DnaHelixUnzip,
  tags: ['science', 'biology', 'dna', 'helix', 'genetics', 'unzip'],
});
