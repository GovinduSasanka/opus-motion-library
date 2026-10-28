import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {
  BOARD_PIN,
  Cable,
  DraftPaper,
  ISO,
  IsoPart,
  PART_DEFS,
  autoFrameAt,
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  fitCamera,
  isoBounds,
  isoPt,
  lin,
  type PartKind,
} from '../../core/r2-x58-kit';
import {IsoHeader, IsoInfoCard, around} from '../../core/r2-s2-kit';

/**
 * x8 isometric hardware tutorial: a technical assembly that rebuilds itself when the "step" changes. Outgoing parts
 * leave quickly (cables break and retract, parts pop off up/outward and shrink), the camera re-frames, then incoming
 * parts arrive in a fixed order: base pieces slide in, small parts drop from above with a tiny bounce, large props
 * grow from a floor tile, and cables grow last from the board pin to their target. Shadows travel with each part.
 * Steps are diffed by part id: parts in both steps tween, only-old parts exit, only-new parts enter.
 */
type PartSpec = {id: string; kind: string; fp?: number[]; z?: number};
type StepSpec = {title: string; text: string; parts: PartSpec[]};
type Props = {
  steps: StepSpec[];
  stepAt: number[];
  teardownFrames: number;
  stagger: number;
  cables: boolean;
  header: string;
  headerRight: string;
  card: boolean;
  background: string;
  grid: boolean;
  reframeFrames: number;
  margin: number;
};

const ON_BOARD: Record<string, number> = {led: 0.55, resistor: 0.55, button: 0.55, sensor: 0.55, motor: 0.55, servo: 0.55};
const rankOf = (kind: string) => (kind === 'board' || kind === 'breadboard' ? 0 : (PART_DEFS[kind as PartKind]?.enter ?? 'drop') === 'drop' ? 1 : (PART_DEFS[kind as PartKind]?.enter ?? 'slide') === 'slide' ? 2 : 3);
const fpOf = (p: PartSpec) => (p.fp ?? PART_DEFS[p.kind as PartKind]?.fp ?? [0, 0, 1, 1, 1]) as [number, number, number, number, number];
const zOf = (p: PartSpec) => p.z ?? ON_BOARD[p.kind] ?? 0;
const enterOf = (p: PartSpec) => (p.kind === 'board' ? 'slide' : PART_DEFS[p.kind as PartKind]?.enter ?? 'drop');

const CircuitRebuild: React.FC<Props> = ({steps, stepAt, teardownFrames: T, stagger, cables, header, headerRight, card, background, grid, reframeFrames, margin}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const nSteps = Math.max(1, steps.length);
  const k = 38 * u;
  const at = steps.map((_, i) => stepAt[i] ?? i * 70);
  const step = (() => {
    let s = 0;
    for (let i = 0; i < nSteps; i++) if (frame >= at[i]) s = i;
    return s;
  })();
  const S = at[step];
  const cur = steps[step] ?? steps[0];
  const prev = step > 0 ? steps[step - 1] : null;

  // viewport for the scene (UI never moves)
  const hh = portrait ? h * 1.25 : h;
  const hdr = Math.max(46 * u, hh * 0.065);
  const cardH = card ? (portrait ? h * 0.15 : h * 0.17) : 0;
  const vx = w * 0.02;
  const vy = hdr + h * 0.02;
  const vw = w * 0.96;
  const vh = h - vy - cardH - h * 0.04;
  const camFor = (si: number) => {
    const st = steps[Math.min(nSteps - 1, si)];
    const boxes = st.parts.map((p) => {
      const f = fpOf(p);
      return {x: f[0], y: f[1], z: zOf(p), w: f[2], d: f[3], hgt: f[4] + (p.kind === 'light' ? 0.8 : 0)};
    });
    return fitCamera(isoBounds(boxes, k), vx, vy, vw, vh, margin, 0.4, 2.2);
  };
  const {cam} = autoFrameAt(frame, at, camFor, reframeFrames, step > 0 ? T : 0);

  type Drawn = {key: string; sort: number; node: React.ReactNode};
  const drawn: Drawn[] = [];
  const cableNodes: React.ReactNode[] = [];
  const prevIds = new Set((prev?.parts ?? []).map((p) => p.id));
  const curIds = new Set(cur.parts.map((p) => p.id));

  // entering order
  const entering = cur.parts.filter((p) => step === 0 || !prevIds.has(p.id)).sort((a, b) => rankOf(a.kind) - rankOf(b.kind));
  const baseStart = S + (step > 0 ? T + 3 : 2);
  const startOf = new Map<string, number>();
  entering.forEach((p, j) => startOf.set(p.id, baseStart + j * stagger));
  const lastPartStart = entering.length ? baseStart + (entering.length - 1) * stagger : baseStart;

  const place = (p: PartSpec, ox: number, oy: number, oz: number, s: number, op: number, opts: {sig?: Record<string, number | string>} = {}) => {
    const f = fpOf(p);
    const [x0, y0, ww, dd, hh] = f;
    const z0 = zOf(p) + oz;
    const [bx, by] = isoPt(x0 + ox + ww / 2, y0 + oy + dd / 2, zOf(p), k);
    const node = (
      <IsoPart kind={p.kind as PartKind} k={k} u={u} dx={ox} dy={oy} dz={z0} fp={[x0, y0, ww, dd, hh]} frame={frame} sig={opts.sig as any} />
    );
    return {node: s === 1 && op === 1 ? node : around(bx, by, s, op, node), sort: x0 + ox + ww / 2 + (y0 + oy + dd / 2) + zOf(p) * 4 + (p.kind === 'board' ? -4 : 0)};
  };

  // parts present in this step
  for (const p of cur.parts) {
    const f = fpOf(p);
    const pf = prev?.parts.find((q) => q.id === p.id);
    let ox = 0;
    let oy = 0;
    let oz = 0;
    let s = 1;
    let op = 1;
    if (pf) {
      // persistent: tween from the previous footprint
      const pfp = fpOf(pf);
      const t = easeInOutCubic(lin(frame, S + T, S + T + 12));
      ox = (pfp[0] - f[0]) * (1 - t);
      oy = (pfp[1] - f[1]) * (1 - t);
    } else {
      const st = startOf.get(p.id) ?? S;
      const e = enterOf(p);
      if (frame < st) continue;
      if (e === 'slide') {
        const t = easeOutCubic(lin(frame, st, st + 10));
        ox = 2.6 * (1 - t);
        oy = -2.6 * (1 - t);
        op = Math.min(1, lin(frame, st, st + 4) * 1.4);
      } else if (e === 'drop') {
        const t = easeOutBack(lin(frame, st, st + 8), 1.3);
        oz = 4.5 * (1 - t);
        op = Math.min(1, lin(frame, st, st + 3) * 1.4);
      } else {
        const t = easeOutBack(lin(frame, st, st + 8), 1.2);
        s = 0.1 + 0.9 * t;
        op = Math.min(1, lin(frame, st, st + 3) * 1.4);
      }
    }
    const d = place(p, ox, oy, oz, s, op);
    drawn.push({key: p.id, sort: d.sort, node: d.node});
  }
  // parts of the previous step that leave
  if (prev && frame < S + T + 2) {
    for (const p of prev.parts) {
      if (curIds.has(p.id)) continue;
      const t = easeInCubic(lin(frame, S, S + T));
      const d = place(p, 1.6 * t, -1.6 * t, 2.2 * t, 1 - 0.7 * t, 1 - t);
      drawn.push({key: 'x' + p.id, sort: d.sort + 100, node: d.node});
    }
  }
  drawn.sort((a, b) => a.sort - b.sort);

  // cables: board pin -> part pin, grown last; old ones retract (broken into dashed pieces) at teardown
  if (cables) {
    const cablesFor = (st: StepSpec, si: number, mode: 'grow' | 'retract') => {
      let n = 0;
      st.parts.forEach((p) => {
        const def = PART_DEFS[p.kind as PartKind];
        if (!def?.pin || !def.cable) return;
        const f = fpOf(p);
        const dxp = f[0] - def.fp[0];
        const dyp = f[1] - def.fp[1];
        def.cable.forEach((col, ci) => {
          const a = isoPt(BOARD_PIN[0], BOARD_PIN[1] + ci * 0.42, BOARD_PIN[2], k);
          const b = isoPt(def.pin![0] + dxp, def.pin![1] + dyp + ci * 0.26, def.pin![2], k);
          let t: number;
          if (mode === 'grow') {
            const stt = lastPartStart + 8 + 2 + n * 3;
            t = easeOutCubic(lin(frame, stt, stt + 6));
            // persisting cable (target existed last step): keep full
            if (si > 0 && prevIds.has(p.id)) t = 1;
          } else {
            const tt = lin(frame, S, S + Math.max(3, T * 0.8));
            t = 1 - easeInCubic(tt);
            if (curIds.has(p.id)) return;
          }
          n++;
          if (t <= 0.001) return;
          const lift = k * (1.6 + 0.35 * ci);
          if (mode === 'retract') {
            // split into 3 pieces shrinking around their centres
            const pcs = [0, 1, 2].map((q) => {
              const q0 = q / 3;
              const q1 = (q + 1) / 3;
              const mid = (q0 + q1) / 2;
              const half = ((q1 - q0) / 2) * t;
              return [mid - half, mid + half] as [number, number];
            });
            const c1: [number, number] = [a[0] + (b[0] - a[0]) * 0.15, a[1] - lift];
            const c2: [number, number] = [a[0] + (b[0] - a[0]) * 0.85, b[1] - lift * 0.8];
            const d = `M${a[0]} ${a[1]} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${b[0]} ${b[1]}`;
            cableNodes.push(
              <g key={`r${si}-${p.id}-${ci}`} fill="none" strokeLinecap="round">
                {pcs.map(([s0, s1], qi) => (
                  <g key={qi}>
                    <path d={d} pathLength={1} strokeDasharray={`0 ${s0} ${Math.max(0.0001, s1 - s0)} 2`} stroke={ISO.ink} strokeWidth={k * 0.2} />
                    <path d={d} pathLength={1} strokeDasharray={`0 ${s0} ${Math.max(0.0001, s1 - s0)} 2`} stroke={col} strokeWidth={k * 0.14} />
                  </g>
                ))}
              </g>,
            );
          } else {
            cableNodes.push(<Cable key={`c${si}-${p.id}-${ci}`} a={a} b={b} lift={lift} color={col} width={k * 0.14} t={t} />);
          }
        });
      });
    };
    if (prev && frame < S + T + 3) cablesFor(prev, step - 1, 'retract');
    cablesFor(cur, step, 'grow');
  }

  const textFade = lin(frame, S + (step > 0 ? 0 : 0), S + 5);
  const bw = portrait ? w * 0.94 : w * 0.5;
  return (
    <AbsoluteFill style={{background}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        {grid ? <DraftPaper id="cr-paper" w={w} h={h} u={u} k={k * 1.1} ox={cam.tx} oy={cam.ty} /> : <rect width={w} height={h} fill={background} />}
        <g transform={`translate(${cam.tx} ${cam.ty}) scale(${cam.scale})`}>
          {drawn.map((d) => (
            <g key={d.key}>{d.node}</g>
          ))}
          {/* cables on top of parts */}
          {cableNodes}
        </g>
        <IsoHeader w={w} h={hh} u={u} title={header} index={step + 1} total={nSteps} right={headerRight} />
        {card ? <IsoInfoCard x={(w - bw) / 2} y={h - cardH - h * 0.025} w={bw} h={cardH} u={u} step={step + 1} title={cur.title} text={cur.text} fade={textFade} maxChars={portrait ? 40 : 54} /> : null}
      </svg>
    </AbsoluteFill>
  );
};

const STEPS: StepSpec[] = [
  {
    title: 'Blink an LED',
    text: 'Wire a resistor and an LED to the board, then switch the pin on and off.',
    parts: [
      {id: 'board', kind: 'board'},
      {id: 'bb', kind: 'breadboard'},
      {id: 'res', kind: 'resistor'},
      {id: 'led', kind: 'led'},
    ],
  },
  {
    title: 'Read a sensor',
    text: 'Swap the LED for a distance sensor and point it at the wall.',
    parts: [
      {id: 'board', kind: 'board'},
      {id: 'bb', kind: 'breadboard'},
      {id: 'sensor', kind: 'sensor'},
      {id: 'wall', kind: 'wall'},
    ],
  },
  {
    title: 'Move a servo',
    text: 'Remove the sensor, add a servo and a button, and sweep the horn.',
    parts: [
      {id: 'board', kind: 'board'},
      {id: 'bb', kind: 'breadboard'},
      {id: 'servo', kind: 'servo'},
      {id: 'btn', kind: 'button'},
    ],
  },
];

export const circuitRebuild = defineMotion<Props>({
  id: 'circuit-rebuild',
  title: 'Circuit rebuild',
  category: 'ui',
  description:
    'Isometric hardware assembly on drafting paper that rebuilds itself on every step: old parts and cables pop off and retract, the camera re-frames, then base pieces slide in, small parts drop with a tiny bounce, large props grow from a floor tile and cables grow last. Step card and header stay fixed.',
  source: ['video x8 0:00.9-0:01.9, 0:04.2-0:06.4, 0:08.2-0:08.9, 0:20.1-0:20.75, 0:29-0:30.9, 0:37.9-0:38.7, 0:53.7-0:54.75'],
  useFor: 'Step-by-step product / hardware / architecture explainers ("add a database, then a cache"), onboarding tours, kit unboxing, any "here is step N" sequence.',
  durationInFrames: 210,
  defaultProps: {
    steps: STEPS,
    stepAt: [0, 70, 140],
    teardownFrames: 5,
    stagger: 3,
    cables: true,
    header: 'Basics',
    headerRight: 'LAB 01',
    card: true,
    background: ISO.paper,
    grid: true,
    reframeFrames: 20,
    margin: 0.08,
  },
  propDocs: {
    steps: 'array of {title, text, parts:[{id, kind, fp?:[x,y,w,d,h], z?}]}; kinds: board breadboard resistor led button sensor wall motor servo light car ball. Parts are diffed by id between steps.',
    stepAt: 'start frame of each step',
    teardownFrames: 'frames the outgoing parts take to leave (0.12-0.2 s)',
    stagger: 'frames between incoming parts',
    cables: 'draw cables from the board pin to each part pin (grow last, retract on teardown)',
    header: 'dark top bar word',
    headerRight: 'small right-aligned label in the top bar',
    card: 'show the step info card at the bottom',
    background: 'paper colour',
    grid: 'draw the isometric drafting-paper grid',
    reframeFrames: 'frames of the camera re-frame (easeInOutCubic)',
    margin: 'auto-frame margin as a fraction of the viewport',
  },
  component: CircuitRebuild,
  tags: ['isometric', 'iso', 'hardware', 'tutorial', 'steps', 'step-by-step', 'rebuild', 'assembly', 'circuit', 'arduino', 'electronics', 'diagram', 'explainer', 'onboarding', 'cables', 'drafting-paper', 'auto-frame', 'maker', 'iot', 'architecture'],
});
