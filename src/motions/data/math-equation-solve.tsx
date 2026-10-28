import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {backOut, easeIO, easeOut3, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Burst, list} from '../../core/r3-edu-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Worked solution on a board: each step is a new line. Terms that survive from the line above fly down (across the
 * "=" when they change sides), terms that cancel are struck through, new terms pop in, and the final answer is boxed.
 * Steps are plain strings of space-separated tokens, e.g. "2x + 3 = 11".
 */
type Props = {
  steps: string[];
  notes: string[];
  title: string;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  cancelColor: string;
  fontFamily: string;
  stepFrames: number;
  startAt: number;
  speed: number;
};

const DEFAULT_STEPS = ['2x + 3 = 11', '2x + 3 - 3 = 11 - 3', '2x = 8', '2x / 2 = 8 / 2', 'x = 4'];
const DEFAULT_NOTES = ['Start with the equation', 'Subtract 3 from both sides', 'Simplify', 'Divide both sides by 2', 'x = 4. Solved!'];

const EM = 0.6; // mono advance in em
const GAP = 0.45; // token gap in em
const disp = (t: string) => t.replace(/-/g, '−').replace(/\*/g, '×').replace(/\//g, '÷');
const isOp = (t: string) => /^[=+\-−×÷*/^()<>]$/.test(t);

type Place = {x: number; w: number};
const layoutLine = (tokens: string[], cx: number, fs: number): Place[] => {
  const wOf = (t: string) => disp(t).length * EM * fs;
  const gap = GAP * fs;
  const eq = tokens.indexOf('=');
  const out: Place[] = new Array(tokens.length);
  if (eq >= 0) {
    const eqW = wOf('=');
    const eqL = cx - eqW / 2;
    out[eq] = {x: eqL, w: eqW};
    let x = eqL - gap;
    for (let i = eq - 1; i >= 0; i--) {
      x -= wOf(tokens[i]);
      out[i] = {x, w: wOf(tokens[i])};
      x -= gap;
    }
    x = eqL + eqW + gap;
    for (let i = eq + 1; i < tokens.length; i++) {
      out[i] = {x, w: wOf(tokens[i])};
      x += wOf(tokens[i]) + gap;
    }
  } else {
    const total = tokens.reduce((a, t) => a + wOf(t), 0) + gap * Math.max(0, tokens.length - 1);
    let x = cx - total / 2;
    tokens.forEach((t, i) => {
      out[i] = {x, w: wOf(t)};
      x += wOf(t) + gap;
    });
  }
  return out;
};

/** for each token of `next`, the index of the matching token in `prev` (or -1) */
const matchTokens = (prev: string[], next: string[]): number[] => {
  const used = new Array(prev.length).fill(false);
  const res = new Array(next.length).fill(-1);
  let last = -1;
  next.forEach((t, j) => {
    for (let k = last + 1; k < prev.length; k++) {
      if (!used[k] && prev[k] === t) {
        used[k] = true;
        res[j] = k;
        last = k;
        return;
      }
    }
    for (let k = 0; k < prev.length; k++) {
      if (!used[k] && prev[k] === t) {
        used[k] = true;
        res[j] = k;
        return;
      }
    }
  });
  return res;
};

const MathEquationSolve: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt) * (p.speed || 1);
  const font = p.fontFamily || fonts.mono;
  const showBg = p.background !== 'transparent';
  const steps = list<string>(p.steps, DEFAULT_STEPS).map((s) => String(s).trim().split(/\s+/).filter(Boolean));
  const n = steps.length;
  const notes = list<string>(p.notes, []);
  const hasNotes = notes.some((x) => String(x).trim());
  const S = Math.max(30, p.stepFrames || 58);
  const t0 = 16;
  const tk = (k: number) => t0 + k * S; // step k begins (k>=1: transition from k-1)
  const tFinal = tk(n - 1) + 46;

  // sizing
  const availW = w * (portrait ? 0.9 : 0.86);
  const lineEm = (tokens: string[]) => {
    const wEm = (ts: string[]) => ts.reduce((a, t) => a + disp(t).length * EM, 0) + GAP * ts.length;
    const eq = tokens.indexOf('=');
    if (eq < 0) return wEm(tokens);
    return 2 * Math.max(wEm(tokens.slice(0, eq)), wEm(tokens.slice(eq + 1))) + EM + GAP;
  };
  const maxEm = Math.max(...steps.map(lineEm), 4);
  const areaTop = h * (portrait ? 0.2 : 0.2);
  const areaH = h * (portrait ? 0.66 : 0.7);
  const noteRatio = hasNotes ? 0.42 : 0;
  const fs = Math.max(26 * u, Math.min((portrait ? 104 : 112) * u, availW / maxEm, areaH / (n * (1.4 + noteRatio))));
  const noteFs = Math.max(20 * u, Math.min(fs * 0.34, 38 * u));
  const lineStep = fs * 1.4 + (hasNotes ? noteFs * 1.5 : 0);
  const blockH = lineStep * n;
  const top = areaTop + Math.max(0, (areaH - blockH) / 2);
  const yOf = (k: number) => top + k * lineStep + fs * 0.65;
  const cx = w / 2;
  const places = steps.map((tokens) => layoutLine(tokens, cx, fs));

  const cur = Math.min(n - 1, Math.max(0, Math.floor((f - t0 - 0) / S)));
  const colorOf = (t: string) => (isOp(t) ? mixHex(p.ink, p.accent2, 0.45) : /[a-zA-Z]/.test(t) ? p.accent : p.ink);

  const titleIn = easeOut3(sseg(f, 0, 18));
  const els: React.ReactNode[] = [];

  for (let k = 0; k < n; k++) {
    const tokens = steps[k];
    const place = places[k];
    const y = yOf(k);
    // how dim is this line (older lines recede)
    const age = k < n - 1 || f < tFinal ? Math.max(0, cur - k) : 0;
    const nextStarted = k + 1 < n ? sseg(f, tk(k + 1) + 8, tk(k + 1) + 30) : 0;
    const lineAlpha = k === n - 1 ? 1 : 1 - 0.38 * nextStarted - (age >= 2 ? 0.12 * sseg(f, tk(k + 2) + 8, tk(k + 2) + 30) : 0);
    const match = k > 0 ? matchTokens(steps[k - 1], tokens) : [];
    const lineIn = k === 0 ? easeOut3(sseg(f, 8, 26)) : 1;
    const isFinalLine = k === n - 1 && n > 1;
    const finalPop = isFinalLine ? backOut(sseg(f, tFinal - 6, tFinal + 14)) : 0;

    // consumed (struck) tokens of this line, caused by step k+1
    const struck: boolean[] = new Array(tokens.length).fill(false);
    if (k + 1 < n) {
      const m = matchTokens(tokens, steps[k + 1]);
      const keep = new Array(tokens.length).fill(false);
      m.forEach((idx) => {
        if (idx >= 0) keep[idx] = true;
      });
      tokens.forEach((_, i) => {
        struck[i] = !keep[i];
      });
    }

    tokens.forEach((tok, i) => {
      const pl = place[i];
      let x = pl.x;
      let yy = y;
      let op = 1;
      let sc = 1;
      let flash = 0;
      if (k === 0) {
        const q = backOut(sseg(f, 12 + i * 3, 12 + i * 3 + 16), 1.8);
        op = Math.min(1, q * 1.5);
        sc = 0.6 + 0.4 * q;
      } else {
        const mi = match[i];
        if (mi >= 0) {
          const prevPl = places[k - 1][mi];
          const q = easeIO(sseg(f, tk(k) + 10, tk(k) + 36));
          if (f < tk(k) + 10) op = 0;
          x = prevPl.x + (pl.x - prevPl.x) * q;
          yy = yOf(k - 1) + (y - yOf(k - 1)) * q - Math.sin(q * Math.PI) * 10 * u;
          flash = Math.sin(q * Math.PI) > 0.2 ? 1 : 0;
        } else {
          const q = backOut(sseg(f, tk(k) + 30 + i * 2, tk(k) + 30 + i * 2 + 16), 1.9);
          op = Math.min(1, q * 1.5);
          sc = 0.5 + 0.5 * q;
          flash = q > 0 && q < 1 ? 1 : 0;
        }
      }
      if (op <= 0) return;
      const sk = struck[i] ? easeOut3(sseg(f, tk(k + 1) + i * 1.5, tk(k + 1) + 14 + i * 1.5)) : 0;
      const tokOp = op * lineIn * lineAlpha * (struck[i] ? 1 - 0.45 * sk : 1);
      const col = struck[i] && sk > 0.3 ? mixHex(colorOf(tok), p.cancelColor, sk) : flash ? p.accent2 : colorOf(tok);
      const pop = isFinalLine ? 1 + 0.06 * Math.sin(Math.min(1, finalPop) * Math.PI) : 1;
      els.push(
        <div key={`${k}-${i}`} style={{position: 'absolute', left: x, top: yy - fs * 0.65, width: pl.w, height: fs * 1.3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font, fontWeight: 700, fontSize: fs, color: col, opacity: tokOp, transform: `scale(${sc * pop})`, whiteSpace: 'pre'}}>
          {disp(tok)}
          {sk > 0 && <div style={{position: 'absolute', left: -fs * 0.08, width: (pl.w + fs * 0.16) * sk, top: '50%', height: Math.max(3, fs * 0.07), borderRadius: fs, background: p.cancelColor, transform: 'rotate(-6deg)'}} />}
        </div>,
      );
    });

    // note under the line
    const noteTxt = String(notes[k] ?? '').trim();
    if (noteTxt) {
      const nIn = easeOut3(sseg(f, k === 0 ? 26 : tk(k) + 26, k === 0 ? 46 : tk(k) + 46));
      els.push(
        <div key={`n${k}`} style={{position: 'absolute', left: 0, right: 0, top: yOf(k) + fs * 0.76, textAlign: 'center', fontFamily: fonts.sans, fontWeight: 600, fontSize: noteFs, color: p.accent2, opacity: nIn * (k === n - 1 ? 1 : 0.55 + 0.45 * (1 - nextStarted)), transform: `translateY(${(1 - nIn) * 10 * u}px)`}}>{noteTxt}</div>,
      );
    }
  }

  // final answer box
  const finalPlaces = places[n - 1];
  const fl = Math.min(...finalPlaces.map((q) => q.x));
  const fr = Math.max(...finalPlaces.map((q) => q.x + q.w));
  const boxQ = easeOut3(sseg(f, tFinal, tFinal + 22));
  const fy = yOf(n - 1);

  return (
    <AbsoluteFill style={{background: showBg ? p.background : undefined, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: h * (portrait ? 0.1 : 0.08), textAlign: 'center', fontFamily: fonts.sans, fontWeight: 800, fontSize: (portrait ? 54 : 48) * u, letterSpacing: 5 * u, textTransform: 'uppercase', color: withAlpha(p.ink, 0.6), opacity: titleIn, transform: `translateY(${(1 - titleIn) * -16 * u}px)`}}>{p.title}</div>
      {n > 1 && boxQ > 0 && (
        <div style={{position: 'absolute', left: fl - fs * 0.5 - (fr - fl) * (1 - boxQ) * 0, top: fy - fs * 0.7, width: fr - fl + fs, height: fs * 1.4, borderRadius: fs * 0.4, border: `${Math.max(3, 5 * u)}px solid ${p.accent2}`, background: withAlpha(p.accent2, 0.1), opacity: boxQ, transform: `scale(${0.9 + 0.1 * boxQ})`, boxSizing: 'border-box'}} />
      )}
      {els}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {n > 1 && <Burst x={(fl + fr) / 2} y={fy} t={sseg(f, tFinal + 4, tFinal + 46)} colors={[p.accent, p.accent2, '#FFD166', '#FFFFFF']} n={20} radius={(fr - fl) * 0.8 + fs} seed={11} size={12 * u} />}
      </svg>
    </AbsoluteFill>
  );
};

export const mathEquationSolve = defineMotion<Props>({
  id: 'math-equation-solve',
  title: 'Math equation solve',
  category: 'data',
  description: 'A worked algebra solution on a chalkboard: each step is a new line, surviving terms fly down (across the equals sign when they swap sides), cancelled terms are struck through, new terms pop in, notes explain each move and the answer is boxed with a burst.',
  source: ['original (round 3)'],
  useFor: 'Maths tutorials, homework-help shorts, algebra explainers, STEM course trailers and "solve it with me" reels — pass any list of equation steps as space-separated tokens and a note per step.',
  durationInFrames: 360,
  defaultProps: {
    steps: DEFAULT_STEPS,
    notes: DEFAULT_NOTES,
    title: 'Solve for x',
    background: '#17342D',
    ink: '#F4F1E8',
    accent: '#FFD166',
    accent2: '#7BDFF2',
    cancelColor: '#FF7A7A',
    fontFamily: '',
    stepFrames: 58,
    startAt: 0,
    speed: 1,
  },
  propDocs: {
    steps: 'equation lines, one string per step; tokens are separated by spaces, e.g. "2x + 3 = 11" (- * / are shown as − × ÷)',
    notes: 'optional one-line explanation per step (same order as steps; empty strings are skipped)',
    title: 'heading above the board',
    background: "backdrop colour or 'transparent'",
    ink: 'numbers and general text colour',
    accent: 'variable (letter) colour',
    accent2: 'moving-term flash, notes and answer box colour',
    cancelColor: 'strike-through colour for terms that cancel',
    fontFamily: 'optional CSS font-family for the equations (empty = monospace; keep it monospaced so columns line up)',
    stepFrames: 'frames per step',
    startAt: 'frame the board starts',
    speed: 'playback speed multiplier',
  },
  component: MathEquationSolve,
  tags: ['math', 'maths', 'algebra', 'equation', 'solve', 'steps', 'worked solution', 'chalkboard', 'school', 'education', 'tutorial', 'homework', 'stem', 'cancel', 'formula'],
});
