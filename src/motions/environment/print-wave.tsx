// Adapted from lemo-opuscar styles/ukiyoe/demo/wave.js + DEMO.md "Props → The wave" (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {n2, rng} from '../../core/random';
import {PaperFibreRect, cl, eio3, eo3, lerp, mixC, seg, stepFrame, taperPoly, useUid, type Pt} from '../../core/r2-lb3a-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  height: number;
  crestAt: number;
  clawDepth: number;
  spray: number;
  stepFps: number;
  border: boolean;
  seed: number;
  paper: string;
  ink: string;
  light: string;
  mid: string;
  deep: string;
  foam: string;
};

const bez = (a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt => {
  const m = 1 - t;
  return [m * m * m * a[0] + 3 * m * m * t * b[0] + 3 * m * t * t * c[0] + t * t * t * d[0], m * m * m * a[1] + 3 * m * m * t * b[1] + 3 * m * t * t * c[1] + t * t * t * d[1]];
};
const bezAng = (a: Pt, b: Pt, c: Pt, d: Pt, t: number) => {
  const p0 = bez(a, b, c, d, Math.max(0, t - 0.01));
  const p1 = bez(a, b, c, d, Math.min(1, t + 0.01));
  return Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
};
const dC = (a: Pt, b: Pt, c: Pt, d: Pt) => `C${b[0].toFixed(1)} ${b[1].toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)} ${d[0].toFixed(1)} ${d[1].toFixed(1)}`;
const f1 = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;

const PrintWave: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const uid = useUid('pwv');
  const fs = stepFrame(frame, p.stepFps);

  // design space
  const DW = portrait ? 620 : 1000;
  const DH = portrait ? 1000 : 620;
  const sc = portrait ? 0.62 : 1;
  const tx = 0;
  const ty = portrait ? DH * 0.5 - 310 * sc - 20 : 0;
  const mw = w * 0.045;
  const mh = h * 0.05;
  const fw = w - mw * 2;
  const fh = h - mh * 2;

  // animation
  const swell = eio3(seg(frame, 4, p.crestAt));
  const curl = lerp(0.18, 1.05, eio3(seg(frame, p.crestAt * 0.45, p.crestAt + 40))) + 0.18 * eio3(seg(frame, p.crestAt + 70, p.crestAt + 150));
  const hangJ = frame > p.crestAt ? 0.25 : 1;
  const jx = n2(`jx${p.seed}`, fs * 0.9, 0) * 4 * hangJ;
  const jy = n2(`jy${p.seed}`, fs * 0.9, 5) * 4 * hangJ;
  const BASE = 520;
  const crestY = BASE - 380 * p.height * (0.12 + 0.88 * swell);
  const T: Pt = [470 + curl * 6, crestY];
  const tip: Pt = [lerp(545, 700, cl(curl)), crestY + lerp(8, 150, cl(curl))];

  // wave outline pieces
  const A0: Pt = [-90, BASE + 6];
  const A1: Pt = [150, BASE - 14];
  const A2: Pt = [340, crestY + 110 + (1 - swell) * 60];
  const Q1: Pt = [T[0] + 80, crestY - 26 - curl * 10];
  const Q2: Pt = [tip[0] + 26, tip[1] - 92];
  const R1: Pt = [tip[0] - 8, tip[1] + 56];
  const R2: Pt = [tip[0] - 100, tip[1] + 92];
  const R3: Pt = [T[0] + 60, tip[1] + 66];
  const S1: Pt = [R3[0] - 40, R3[1] + 80];
  const S2: Pt = [R3[0] + 30, BASE - 60];
  const S3: Pt = [R3[0] + 130, BASE + 8];
  const body =
    `M${f1(A0)}${dC(A0, A1, A2, T)}${dC(T, Q1, Q2, tip)}${dC(tip, R1, R2, R3)}${dC(R3, S1, S2, S3)}L${S3[0]} ${BASE + 120}L${A0[0]} ${BASE + 120}Z`;
  const backSlope = `M${f1(A0)}${dC(A0, A1, A2, T)}`;
  const hollow = `M${f1(tip)}${dC(tip, R1, R2, R3)}${dC(R3, S1, S2, S3)}L${S3[0] - 140} ${BASE + 8}Q${R3[0] - 40} ${R3[1] + 30} ${tip[0] - 70} ${tip[1] + 30}Z`;

  // background sea rows
  const yH = ty + 380 * sc;
  const rowH = 28 * sc;
  const rows = Array.from({length: Math.max(9, Math.ceil((DH - yH) / rowH) + 1)}, (_, k) => k);
  const scal = (y: number, r: number, off: number, x0: number, x1: number) => {
    let d = '';
    for (let x = x0 + off; x < x1; x += r * 2) d += `M${x.toFixed(1)} ${y}a${r} ${r} 0 0 1 ${r * 2} 0`;
    return d;
  };

  // claws (recursive tapered fingers)
  const clawPolys: {d: string; hi: boolean}[] = [];
  const makeClaw = (root: Pt, ang: number, len: number, depth: number, w0: number, r: () => number, hook: number, lvl: number) => {
    const n = 12;
    const pts: Pt[] = [root];
    let a = ang;
    let cur: Pt = root;
    for (let i = 1; i <= n; i++) {
      a += hook / n;
      cur = [cur[0] + (Math.cos(a) * len) / n, cur[1] + (Math.sin(a) * len) / n];
      pts.push(cur);
    }
    const jit = 1 + (r() - 0.5) * 0.3;
    clawPolys.push({d: taperPoly(pts, (t) => w0 * jit * (0.18 + 0.82 * Math.pow(1 - t, 0.9))), hi: lvl === 0});
    if (depth > 0) {
      const base = pts[Math.floor(n * 0.62)];
      const na = a - hook * 0.25;
      for (let k = -1; k <= 1; k++) makeClaw(base, na + k * 0.55 + (r() - 0.5) * 0.2, len * 0.55, depth - 1, w0 * 0.55, r, hook * 1.1, lvl + 1);
    }
  };
  const rr = rng(p.seed * 17 + 5);
  const nClaw = 7;
  const foamPts: {x: number; y: number; r: number}[] = [];
  for (let i = 0; i < nClaw; i++) {
    const t = 0.12 + (i / (nClaw - 1)) * 0.88;
    const root = bez(T, Q1, Q2, tip, t);
    const ang = bezAng(T, Q1, Q2, tip, t);
    const grow = eo3(seg(curl, 0.25 + i * 0.03, 0.9 + i * 0.02));
    const len = (88 + rr() * 64) * (0.4 + 0.6 * grow) * lerp(0.8, 1.2, p.height / 1.2);
    const jit = n2(`cl${p.seed}`, i, fs * 0.3) * 0.12 * hangJ;
    makeClaw(root, ang + 0.55 + jit, len * grow, p.clawDepth - 1, 19 - i * 0.5, rr, 0.9 + rr() * 0.4, 0);
  }
  for (let i = 0; i < 30; i++) {
    const t = i / 29;
    const pt = bez(T, Q1, Q2, tip, t);
    foamPts.push({x: pt[0] + (rr() - 0.5) * 8, y: pt[1] + (rr() - 0.5) * 10, r: 9 + rr() * 9});
  }
  // crest foam on top of the back slope
  for (let i = 0; i < 12; i++) {
    const pt = bez(A0, A1, A2, T, 0.8 + (i / 11) * 0.2);
    foamPts.push({x: pt[0] + (rr() - 0.5) * 6, y: pt[1] - 2 + (rr() - 0.5) * 6, r: 7 + rr() * 8});
  }

  // spray clusters ahead of the lip
  const sprayDots: {x: number; y: number; r: number}[] = [];
  const sr = rng(p.seed * 29 + 1);
  const sp = eo3(seg(curl, 0.35, 1.0)) * p.spray;
  for (let c = 0; c < 4; c++) {
    const cx = tip[0] - 40 + c * 55 + sr() * 30;
    const cy = tip[1] - 70 - c * 20 - sr() * 40;
    const drift = (fs - 40) * 0.12;
    const mk = (r: number, spread: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = sr() * Math.PI * 2;
        const d = sr() * spread;
        sprayDots.push({x: cx + Math.cos(a) * d + drift * (1 + c * 0.3), y: cy + Math.sin(a) * d * 0.7 - drift * 0.5 + Math.sin(fs * 0.15 + i) * 1.5, r: r * (0.7 + sr() * 0.6)});
      }
    };
    mk(7, 8, 1);
    mk(4.2, 36, 4);
    mk(2.2, 56, 12);
  }

  const bands = [p.light, mixC(p.light, p.mid, 0.5), p.mid];
  const sheet = `translate(${tx + jx} ${ty + jy}) scale(${sc})`;
  const intro = seg(frame, 0, 12);

  return (
    <AbsoluteFill style={{background: p.paper, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mixC(p.light, '#BCD6E2', 0.6)} />
            <stop offset="0.7" stopColor={mixC('#BCD6E2', p.paper, 0.6)} />
            <stop offset="1" stopColor={p.paper} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-body`} gradientUnits="userSpaceOnUse" x1="0" y1={crestY} x2="0" y2={BASE + 60}>
            <stop offset="0" stopColor={p.light} />
            <stop offset="0.35" stopColor={mixC(p.light, p.mid, 0.55)} />
            <stop offset="0.7" stopColor={p.mid} />
            <stop offset="1" stopColor={p.deep} />
          </linearGradient>
          <linearGradient id={`${uid}-hol`} gradientUnits="userSpaceOnUse" x1="0" y1={tip[1]} x2="0" y2={BASE + 20}>
            <stop offset="0" stopColor={mixC(p.mid, p.deep, 0.4)} />
            <stop offset="1" stopColor={p.deep} />
          </linearGradient>
          <clipPath id={`${uid}-bodyclip`}>
            <path d={body} />
          </clipPath>
          <clipPath id={`${uid}-frame`}>
            <rect x={mw} y={mh} width={fw} height={fh} />
          </clipPath>
          <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.004 0.04" numOctaves={3} seed={p.seed} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.05  1.5 0 0 0 -0.68" />
            <feComposite in2="SourceAlpha" operator="in" />
          </filter>
        </defs>
        <PaperFibreRect id={uid} w={w} h={h} paper={p.paper} fibre={0.09} seed={p.seed + 1} />
        <g opacity={intro} clipPath={p.border ? `url(#${uid}-frame)` : undefined}>
          <svg x={p.border ? mw : 0} y={p.border ? mh : 0} width={p.border ? fw : w} height={p.border ? fh : h} viewBox={`0 0 ${DW} ${DH}`} preserveAspectRatio="xMidYMid slice" overflow="hidden">
            <rect x={-200} y={-200} width={DW + 400} height={DH * 0.62 + 200} fill={`url(#${uid}-sky)`} />
            {/* background sea: banded rows of curls */}
            <g>
              {rows.map((k) => {
                const y = yH + k * rowH;
                return (
                  <g key={k}>
                    <rect x={-200} y={y} width={DW + 400} height={rowH + 2} fill={mixC(mixC(p.light, p.paper, 0.2), p.mid, 0.12 + k * 0.08)} opacity={0.7} />
                    <path d={scal(y + rowH * 0.7, (15 + k * 1.2) * sc, ((k % 2) * 15 + (fs % 90) * 0.18 * (k % 2 ? 1 : -1)), -200, DW + 200)} fill="none" stroke={p.ink} strokeWidth={1.2} opacity={0.35} />
                  </g>
                );
              })}
            </g>
            <g transform={sheet}>
              <g>
                <path d={body} fill={`url(#${uid}-body)`} />
                <g clipPath={`url(#${uid}-bodyclip)`}>
                  {/* bands inward from the back slope */}
                  {bands.map((c, i) => (
                    <path key={i} d={backSlope} transform={`translate(${28 + i * 46} ${30 + i * 40})`} fill="none" stroke={c} strokeWidth={30 - i * 4} opacity={i === 0 ? 0.55 : 0.4} strokeLinecap="round" />
                  ))}
                  <path d={hollow} fill={`url(#${uid}-hol)`} />
                  {/* flow lines in groups of three following the slope */}
                  {[0, 1, 2, 3].map((g) => (
                    <g key={g} transform={`translate(${20 + g * 62} ${48 + g * 44})`}>
                      {[0, 1, 2].map((l) => (
                        <path key={l} d={backSlope} transform={`translate(${l * 7} ${l * 9})`} fill="none" stroke={mixC(p.paper, p.light, 0.3)} strokeWidth={2.2 - l * 0.4} strokeDasharray={`${70 + g * 18 + l * 10} ${34 + l * 12}`} strokeDashoffset={-((g * 41 + fs * 0.6) % 320)} opacity={0.5} strokeLinecap="round" />
                      ))}
                    </g>
                  ))}
                  <path d={body} filter={`url(#${uid}-grain)`} opacity={0.9} />
                </g>
                <path d={body} fill="none" stroke={p.ink} strokeWidth={3} strokeLinejoin="round" />
                <path d={`M${f1(tip)}${dC(tip, R1, R2, R3)}`} fill="none" stroke={p.ink} strokeWidth={2.4} />
                {/* foreground sea hides the base of the wave and flows past it */}
                {Array.from({length: portrait ? 14 : 4}, (_, k) => k).map((k) => (
                  <g key={'fs' + k}>
                    <rect x={-300} y={BASE + 6 + k * 34} width={1700} height={44} fill={mixC(p.mid, p.deep, Math.min(1, 0.2 + k * 0.25))} />
                    <path d={scal(BASE + 26 + k * 34, 16 + k * 3, (k % 2) * 16 + (fs % 90) * 0.2 * (k % 2 ? 1 : -1), -300, 1400)} fill="none" stroke={mixC(p.light, p.paper, 0.4)} strokeWidth={2} opacity={0.5} />
                  </g>
                ))}
                <path d={scal(BASE + 6, 14, (fs % 60) * 0.3, -300, 1400)} fill="none" stroke={p.ink} strokeWidth={2.2} />
                {/* back layer of pale claws then main claws */}
                <g transform="translate(6 7)" opacity={0.55}>
                  {clawPolys.map((c, i) => <path key={i} d={c.d} fill={mixC(p.light, p.paper, 0.4)} />)}
                </g>
                <g stroke={p.ink} strokeWidth={2.2} strokeLinejoin="round">
                  {clawPolys.map((c, i) => <path key={i} d={c.d} fill={p.foam} />)}
                </g>
                {/* foam rim: stroke every blob first, then fill — one union outline */}
                <g stroke={p.ink} strokeWidth={5}>
                  {foamPts.map((f, i) => <circle key={i} cx={f.x} cy={f.y} r={f.r} fill={p.foam} />)}
                </g>
                <g>
                  {foamPts.map((f, i) => <circle key={i} cx={f.x} cy={f.y} r={f.r} fill={p.foam} />)}
                </g>
                <g fill={p.foam} stroke={p.ink} strokeWidth={1.4} opacity={cl(sp)}>
                  {sprayDots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} />)}
                </g>
              </g>
            </g>
          </svg>
        </g>
        {p.border && (
          <g opacity={intro}>
            <rect x={mw} y={mh} width={fw} height={fh} fill="none" stroke={p.ink} strokeWidth={3.4 * u} />
            <rect x={mw - 9 * u} y={mh - 9 * u} width={fw + 18 * u} height={fh + 18 * u} fill="none" stroke={p.ink} strokeWidth={1 * u} />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

export const printWave = defineMotion<Props>({
  id: 'print-wave',
  title: 'Print wave',
  category: 'environment',
  description:
    'An original woodblock-style wave: a tall wall of water in bokashi blues (pale crest → Prussian → deep trough) with offset banding and grouped broken white flow lines along the back slope, a hollow shaded under the curling lip, a scalloped foam rim, fractal claws (each splits into three fingers that split again, tips hooking inward) over a pale back layer, spray in clusters, and a background sea of banded curls. It swells, curls and hangs with jitter ×0.25; nature steps at 8 fps. Paper, double border, ink outlines.',
  source: ['lemo-opuscar styles/ukiyoe/demo/wave.js + DEMO.md (MIT, LemoLab) — original composition, not the Great Wave'],
  useFor: 'Dramatic climax or backdrop for Japanese-themed content, "a wave of …" metaphors (sales surge, data flood, demand spike); pairs with frame-breakout.',
  durationInFrames: 210,
  defaultProps: {height: 1, crestAt: 90, clawDepth: 2, spray: 1, stepFps: 8, border: true, seed: 5, paper: '#EEE2C6', ink: '#231F1C', light: '#8DB0C6', mid: '#1D3A66', deep: '#0F2344', foam: '#F4EBD3'},
  propDocs: {
    height: 'wave height multiplier (0.6–1.2)', crestAt: 'frame the swell reaches its crest', clawDepth: 'claw recursion 1–3 (each level splits into 3 fingers)', spray: 'spray amount 0–1.5',
    stepFps: 'nature frame rate (8 = hold 3–4 frames)', border: 'draw the paper margin + double border (off for a full-bleed layer)', seed: 'claw / foam / texture seed',
    paper: 'paper colour', ink: 'key-line ink', light: 'pale blue (crest)', mid: 'Prussian blue', deep: 'deep trough blue', foam: 'foam / claw colour',
  },
  component: PrintWave,
  tags: ['wave', 'woodblock', 'ukiyo-e', 'japanese', 'ocean', 'sea', 'print', 'bokashi', 'foam', 'claws', 'surge', 'tsunami', 'water', 'environment', 'stylised'],
});
