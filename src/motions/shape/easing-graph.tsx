import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Mono, P17, PrinciplesHud} from '../../core/principles-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video17 ease-compare-tracks + graph-editor-curve. Two tracks: black ball A moves linearly, red ball B with an
 * ease; per-frame spacing ticks under each show even vs bunched spacing. A dark "GRAPH EDITOR · EASE" panel plots
 * the value curve; its bezier handles drag out from linear to the S-curve while the cubic-bezier(...) label updates.
 */
type Props = {
  background: string;
  easing: [number, number, number, number];
  traverse: number;
  tickCount: number;
  colorA: string;
  colorB: string;
  labelA: string;
  labelB: string;
  zones: string[];
  hud: boolean;
  numeral: string;
  title: string;
  subtitle: string;
  code: string;
  /** lane race (EXTENDS r2): replaces the two A/B tracks with N labelled lanes: linear | ease-out | bezier | spring | back | steps; [] = classic A/B tracks */
  lanes: string[];
  editorLabel: string;
  axisLabel: string;
  idleLabelB: string;
};

const LANE_FN: Record<string, (x: number, bez: (x: number) => number) => number> = {
  linear: (x) => x,
  'ease-out': (x) => 1 - Math.pow(1 - x, 3),
  'ease-in': (x) => x * x * x,
  bezier: (x, bez) => bez(x),
  spring: (x) => 1 - Math.exp(-6.5 * x) * Math.cos(x * Math.PI * 3.2),
  back: (x) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2),
  steps: (x) => Math.floor(x * 6) / 6 + (x >= 1 ? 1 - 1 : 0),
};

const LIN: [number, number, number, number] = [0.33, 0.33, 0.67, 0.67];

const EasingGraph: React.FC<Props> = ({background, easing, traverse, tickCount, colorA, colorB, labelA, labelB, zones, hud, numeral, title, subtitle, code, lanes, editorLabel = 'GRAPH EDITOR · EASE', axisLabel = 'VALUE / TIME', idleLabelB = 'B · LINEAR'}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const ink = P17.ink;
  // schedule
  const TR = traverse;
  const t1 = 12;
  const m0 = t1 + TR + 4;
  const m1 = m0 + 18;
  const t2 = m1 + 4;
  const t3 = t2 + TR + 6;
  const morph = prog(frame, m0, m1, ease.inOut);
  const cur = LIN.map((v, i) => lerp(v, easing[i], morph)) as [number, number, number, number];
  const curveAt = (c: number[]) => Easing.bezier(clamp(c[0]), c[1], clamp(c[2]), c[3]);
  const fB = curveAt(cur);
  // which traverse is active
  const legs = [
    {s: t1, dir: 1},
    {s: t2, dir: -1},
    {s: t3, dir: 1},
  ];
  let leg = legs[0];
  for (const l of legs) if (frame >= l.s) leg = l;
  const uRaw = clamp((frame - leg.s) / TR);
  const eased = frame >= m0 ? fB : (x: number) => x;
  const pos = (v: number) => (leg.dir > 0 ? v : 1 - v);
  // layout
  const tx0 = portrait ? w * 0.12 : w * 0.1;
  const tx1 = portrait ? w * 0.88 : w * 0.55;
  const yA = portrait ? h * 0.15 : h * 0.29;
  const yB = portrait ? h * 0.27 : h * 0.52;
  const rA = 30 * u;
  const rB = 44 * u;
  const draw = prog(frame, 0, 12, ease.out);
  const xA = lerp(tx0, tx1, pos(uRaw));
  const xB = lerp(tx0, tx1, pos(clamp(eased(uRaw))));
  const N = tickCount;
  const shown = Math.floor(uRaw * (N - 1) + 1e-6);
  const ticks = (y: number, f: (x: number) => number, col: string, key: string) =>
    Array.from({length: N}, (_, k) => {
      if (k > shown) return null;
      const x = lerp(tx0, tx1, pos(clamp(f(k / (N - 1)))));
      return <line key={key + k} x1={x} x2={x} y1={y} y2={y + 18 * u} stroke={col} strokeWidth={1.6 * u} />;
    });
  // graph panel
  const S = portrait ? w * 0.72 : Math.min(w * 0.3, h * 0.56);
  const gx = portrait ? (w - S) / 2 : w * 0.63;
  const gy = portrait ? h * 0.385 : h * 0.17;
  const pad = 54 * u;
  const px0 = gx + pad;
  const py0 = gy + S - pad;
  const pw = S - pad * 2;
  const P = (x: number, y: number) => [px0 + x * pw, py0 - y * pw] as [number, number];
  const panelIn = prog(frame, 4, 16, ease.out);
  const curvePath = (c: number[]) => {
    const [a, b] = [P(0, 0), P(1, 1)];
    const c1 = P(c[0], c[1]);
    const c2 = P(c[2], c[3]);
    return `M ${a[0]} ${a[1]} C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${b[0]} ${b[1]}`;
  };
  const ghosts = frame > m0 && frame < m1 + 3 ? [3, 2, 1].map((k) => LIN.map((v, i) => lerp(v, easing[i], prog(frame - k * 1.5, m0, m1, ease.inOut)))) : [];
  const h1 = P(cur[0], cur[1]);
  const h2 = P(cur[2], cur[3]);
  const playing = frame >= leg.s && frame <= leg.s + TR;
  const gu = uRaw;
  const gv = clamp(eased(uRaw));
  const head = P(gu, gv);
  const fmt = (v: number) => v.toFixed(2);
  const changed = (i: number) => Math.abs(cur[i] - LIN[i]) > 0.005 && morph < 1;
  const zonesIn = prog(frame, t2 + 4, t2 + 14);
  const cursorOn = frame >= m0 - 4 && frame < m1 + 8;
  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        {/* tracks */}
        {!lanes.length && [yA, yB].map((y, i) => (
          <g key={i}>
            <line x1={tx0} x2={lerp(tx0, tx1, draw)} y1={y} y2={y} stroke={ink} strokeWidth={1.5 * u} opacity={0.6} />
            <circle cx={tx0} cy={y} r={4 * u} fill={ink} />
            <circle cx={tx1} cy={y} r={4 * u} fill={ink} opacity={draw} />
            <line x1={tx0} x2={tx1} y1={y + rB + 30 * u} y2={y + rB + 30 * u} stroke={ink} strokeWidth={0.8 * u} opacity={0.15 * draw} />
          </g>
        ))}
        {!lanes.length && (
          <>
            <g transform={`translate(0 ${rB + 22 * u})`}>
              {ticks(yA, (x) => x, colorA, 'a')}
              {ticks(yB, eased, colorB, 'b')}
            </g>
            <circle cx={xA} cy={yA} r={rA * draw} fill={colorA} />
            <circle cx={xB} cy={yB} r={rB * draw} fill={colorB} />
          </>
        )}
        {lanes.map((ln, li) => {
          const y = lerp(portrait ? h * 0.1 : h * 0.18, portrait ? h * 0.34 : h * 0.74, lanes.length > 1 ? li / (lanes.length - 1) : 0.5);
          const fn = LANE_FN[ln] ?? LANE_FN.linear;
          const colr = li % 2 ? colorB : colorA;
          return (
            <g key={ln + li} opacity={draw}>
              <line x1={tx0} x2={tx1} y1={y} y2={y} stroke={ink} strokeWidth={1.5 * u} opacity={0.5} />
              {Array.from({length: N}, (_, k) => {
                if (k > shown) return null;
                const x = lerp(tx0, tx1, pos(clamp(fn(k / (N - 1), fB))));
                return <line key={k} x1={x} x2={x} y1={y + 16 * u} y2={y + 34 * u} stroke={colr} strokeWidth={1.6 * u} />;
              })}
              <circle cx={lerp(tx0, tx1, pos(fn(uRaw, fB)))} cy={y} r={(li === 2 ? 22 : 18) * u * draw} fill={li === 2 ? '#fff' : colr} stroke={li === 2 ? ink : 'none'} strokeWidth={4 * u} />
            </g>
          );
        })}
        {/* graph editor */}
        <g opacity={panelIn} transform={`translate(${gx + S / 2} ${gy + S / 2}) scale(${0.94 + 0.06 * panelIn}) translate(${-gx - S / 2} ${-gy - S / 2})`}>
          <rect x={gx} y={gy} width={S} height={S} rx={4 * u} fill={ink} />
          {Array.from({length: 5}, (_, i) => (
            <g key={i}>
              <line x1={px0 + (pw * i) / 4} x2={px0 + (pw * i) / 4} y1={py0} y2={py0 - pw} stroke="#fff" strokeOpacity={0.06} strokeWidth={1 * u} />
              <line x1={px0} x2={px0 + pw} y1={py0 - (pw * i) / 4} y2={py0 - (pw * i) / 4} stroke="#fff" strokeOpacity={0.06} strokeWidth={1 * u} />
            </g>
          ))}
          <line x1={px0} x2={px0 + pw} y1={py0} y2={py0} stroke={P17.hudGrey} strokeWidth={1.2 * u} />
          <line x1={px0} x2={px0} y1={py0} y2={py0 - pw} stroke={P17.hudGrey} strokeWidth={1.2 * u} />
          <line x1={px0} y1={py0} x2={px0 + pw} y2={py0 - pw} stroke={P17.hudGrey} strokeWidth={1 * u} strokeDasharray={`${2 * u} ${6 * u}`} opacity={0.6} />
          {ghosts.map((c, i) => (
            <path key={i} d={curvePath(c)} fill="none" stroke={P17.red} strokeWidth={3 * u} opacity={0.12 + i * 0.08} />
          ))}
          <line x1={P(0, 0)[0]} y1={P(0, 0)[1]} x2={h1[0]} y2={h1[1]} stroke={P17.hudGrey} strokeWidth={1.2 * u} />
          <line x1={P(1, 1)[0]} y1={P(1, 1)[1]} x2={h2[0]} y2={h2[1]} stroke={P17.hudGrey} strokeWidth={1.2 * u} />
          <path d={curvePath(cur)} fill="none" stroke={P17.red} strokeWidth={3 * u} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog(frame, 8, 22, ease.inOut)} />
          <rect x={h1[0] - 6 * u} y={h1[1] - 6 * u} width={12 * u} height={12 * u} fill={ink} stroke="#fff" strokeWidth={1.5 * u} />
          <rect x={h2[0] - 6 * u} y={h2[1] - 6 * u} width={12 * u} height={12 * u} fill={ink} stroke="#fff" strokeWidth={1.5 * u} />
          <circle cx={P(0, 0)[0]} cy={P(0, 0)[1]} r={5 * u} fill="#fff" />
          <circle cx={P(1, 1)[0]} cy={P(1, 1)[1]} r={5 * u} fill="#fff" />
          {playing && (
            <g>
              <line x1={head[0]} x2={head[0]} y1={py0} y2={head[1]} stroke={P17.red} strokeWidth={1 * u} opacity={0.5} />
              <line x1={px0} x2={head[0]} y1={head[1]} y2={head[1]} stroke={P17.red} strokeWidth={1 * u} opacity={0.5} />
              <circle cx={head[0]} cy={head[1]} r={7 * u} fill={P17.red} stroke="#fff" strokeWidth={2 * u} />
            </g>
          )}
          {cursorOn && (
            <path
              d={`M ${h1[0] + 4 * u} ${h1[1] + 4 * u} l 0 ${22 * u} l ${6 * u} ${-6 * u} l ${5 * u} ${10 * u} l ${4 * u} ${-2 * u} l ${-5 * u} ${-10 * u} l ${8 * u} 0 Z`}
              fill="#fff"
              stroke={ink}
              strokeWidth={1.2 * u}
            />
          )}
        </g>
      </Svg>
      <div style={{opacity: panelIn}}>
        <Mono x={gx + 18 * u} y={gy + 16 * u} size={11} color={P17.paper}>
          {editorLabel}
        </Mono>
        <Mono x={gx + S - 18 * u} y={gy + 16 * u} size={10} color={P17.hudGrey} anchor="right">
          {axisLabel}
        </Mono>
        <div style={{position: 'absolute', left: gx + 18 * u, top: gy + S - 34 * u, fontFamily: fonts.mono, fontSize: 15 * u, color: P17.paper, whiteSpace: 'pre'}}>
          {'cubic-bezier('}
          {cur.map((v, i) => (
            <span key={i} style={{color: changed(i) || (morph >= 1 && frame < m1 + 12) ? P17.red : P17.paper}}>
              {fmt(v)}
              {i < 3 ? <span style={{color: P17.paper}}>, </span> : null}
            </span>
          ))}
          {')'}
        </div>
      </div>
      {lanes.map((ln, li) => (
        <Mono key={ln + li} x={tx0} y={lerp(portrait ? h * 0.1 : h * 0.18, portrait ? h * 0.34 : h * 0.74, lanes.length > 1 ? li / (lanes.length - 1) : 0.5) - 34 * u} size={12} color={li % 2 ? colorB : ink} opacity={draw}>
          {ln.toUpperCase()}
        </Mono>
      ))}
      {!lanes.length && (
        <Mono x={tx0} y={yA - rB - 34 * u} size={12} color={ink} opacity={draw}>
          {labelA}
        </Mono>
      )}
      {!lanes.length && (
        <Mono x={tx0 + 200 * u} y={yA - rB - 34 * u} size={11} color={P17.grey} opacity={draw}>
          {`Δx ${(((tx1 - tx0) / u / (N - 1)) * 1).toFixed(1)} px/f · constant`}
        </Mono>
      )}
      {!lanes.length && (
        <Mono x={tx0} y={yB - rB - 34 * u} size={12} color={colorB} opacity={draw}>
          {frame >= m0 ? labelB : idleLabelB}
        </Mono>
      )}
      {!lanes.length && zones.length >= 3 &&
        [0, 0.5, 1].map((p, i) => (
          <Mono key={i} x={lerp(tx0, tx1, p)} y={yB + rB + 50 * u} size={10} color={colorB} anchor={i === 0 ? 'left' : i === 1 ? 'center' : 'right'} opacity={zonesIn}>
            {zones[leg.dir > 0 ? i : 2 - i]}
          </Mono>
        ))}
      {hud && <PrinciplesHud bg={background} numeral={numeral} title={title} subtitle={subtitle} code={code} />}
    </AbsoluteFill>
  );
};

export const easingGraph = defineMotion<Props>({
  id: 'easing-graph',
  title: 'Easing graph + compare tracks',
  category: 'shape',
  description: 'A linear black ball and an eased red ball race along two tracks with per-frame spacing ticks, while a dark graph-editor panel drags its bezier handles from linear to an S-curve and prints cubic-bezier(...).',
  source: ['video17 0:14.75-0:17.75 ease-compare-tracks + graph-editor-curve'],
  useFor: 'Explaining easing / timing, UI motion specs, "slow in, slow out" lessons, any linear-vs-curved comparison.',
  durationInFrames: 150,
  defaultProps: {
    background: P17.paper,
    easing: [0.7, 0, 0.3, 1],
    traverse: 30,
    tickCount: 16,
    colorA: P17.ink,
    colorB: P17.red,
    labelA: 'A · LINEAR',
    labelB: 'B · EASE IN · EASE OUT',
    zones: ['SLOW OUT', 'FAST', 'SLOW IN'],
    hud: true,
    numeral: '06',
    title: 'SLOW IN & SLOW OUT',
    subtitle: 'Ease into every pose. Ease out of it.',
    code: 'x = x0 + Δx·ease(u) // same frames, different spacing',
    lanes: [],
    editorLabel: 'GRAPH EDITOR · EASE',
    axisLabel: 'VALUE / TIME',
    idleLabelB: 'B · LINEAR',
  },
  propDocs: {
    easing: 'target cubic-bezier [x1, y1, x2, y2] the graph handles drag to',
    traverse: 'frames per track traverse (30 = 1.0 s)',
    tickCount: 'spacing ticks per track (one per sampled frame)',
    colorA: 'linear ball / tick colour',
    colorB: 'eased ball / tick colour',
    zones: 'three labels under the eased track (start, middle, end)',
    hud: 'show HUD chrome + chapter title',
    lanes: "lane race instead of the two tracks: any of 'linear','ease-out','ease-in','bezier' (uses easing),'spring','back','steps', e.g. ['linear','ease-out','bezier','spring']; [] = classic A/B",
    editorLabel: 'caption at the top-left of the graph panel',
    axisLabel: 'caption at the top-right of the graph panel',
    idleLabelB: 'label of track B before it starts moving (then labelB)',
  },
  component: EasingGraph,
  tags: ['easing', 'graph', 'bezier', 'timing', 'explainer', 'ball', 'lanes', 'spring', 'easing comparison', 'cubic-bezier', 'api docs', 'dev tool'],
});
