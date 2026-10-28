import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {FlatIcon, blinkOn, lin, mixC, typedCount} from '../../core/ui-kit';
import {ScopeMode, ThresholdMode} from '../../core/r2-e2-chart-kit';

/**
 * Live data traces.
 *  - trace   (video11 live-chart-trace): growth curve revealing a sample point every 0.25 s with a white glowing
 *    head dot and a pulsing open ring, a teal "synapses" curve that peaks early then prunes, and a magenta ECG
 *    sweeping/scrolling at ~160 px/s with a spike every 0.42 s over a faint 40 px grid. Navy HUD void.
 *  - sync    (video11 dual-heartbeat-sync): translucent rounded panel with magenta + yellow ECG traces and heart
 *    icons; the traces start out of phase, the offset lerps to 0 over 1.5 s, then "in sync" types on.
 *  - decline (video12 data-decline-chart): a "QUALITY" monitor shows a cyan sine wave; the line turns red
 *    (#E75855) and redraws as a falling wobbly line (0.8 s draw-on) while the "REASONING EFFORT" gauge needle
 *    swings from HIGH to MEDIUM with a damped overshoot.
 */
type Props = {
  mode: 'trace' | 'sync' | 'decline' | 'threshold' | 'scope';
  data: number[];
  declineValues: number[];
  title: string;
  xLabel: string;
  yLabel: string;
  readout: string;
  color: string;
  ecgColor: string;
  syncColors: string[];
  label: string;
  bpm: number;
  colorFrom: string;
  colorTo: string;
  gaugeLabels: string[];
  gaugeFrom: number;
  gaugeTo: number;
  background: string;
  series: number[];
  threshold: number;
  stamp: string;
  echoes: number;
  graticule: boolean;
};

const HUD = {text: '#A2A2C7', axis: '#A09FC2', ring: '#302F4E'};

/** ECG waveform, phase 0..1 -> -0.35..1 */
const ecg = (ph: number) => {
  const p = ((ph % 1) + 1) % 1;
  const g = (c: number, wd: number, a: number) => a * Math.exp(-Math.pow((p - c) / wd, 2));
  return g(0.12, 0.035, 0.12) + g(0.28, 0.012, -0.15) + g(0.31, 0.014, 1) + g(0.345, 0.014, -0.32) + g(0.56, 0.06, 0.22);
};

const Glow: React.FC<{x: number; y: number; r: number; color: string; id: string}> = ({x, y, r, color, id}) => (
  <g>
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor={color} stopOpacity={0.8} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r * 6} fill={`url(#${id})`} />
    <circle cx={x} cy={y} r={r} fill="#ffffff" />
  </g>
);

const ecgPath = (x0: number, x1: number, yb: number, amp: number, headX: number, scroll: number, periodPx: number, step: number, phaseOff = 0) => {
  let d = '';
  for (let x = x0; x <= Math.min(x1, headX); x += step) {
    const y = yb - amp * ecg((x - headX) / periodPx + scroll + phaseOff);
    d += `${d ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
};

// ------------------------------------------------------------------------------------------------ trace
const TraceMode: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const PT = portrait ? 1.6 : 1;
  // main chart box
  const M = portrait ? {x0: w * 0.14, x1: w * 0.9, y0: h * 0.12, y1: h * 0.42} : {x0: w * 0.1, x1: w * 0.58, y0: h * 0.16, y1: h * 0.66};
  const Sy = portrait ? {x0: w * 0.14, x1: w * 0.9, y0: h * 0.52, y1: h * 0.66} : {x0: w * 0.68, x1: w * 0.9, y0: h * 0.2, y1: h * 0.6};
  const E = portrait ? {x0: w * 0.08, x1: w * 0.92, y0: h * 0.74, y1: h * 0.86} : {x0: w * 0.1, x1: w * 0.9, y0: h * 0.76, y1: h * 0.9};
  const data = p.data;
  const n = data.length;
  const maxV = Math.max(...data) * 1.08;
  const ptEvery = 7.5;
  const start = 14;
  const prog1 = clamp((frame - start) / (ptEvery * (n - 1)));
  const fpos = prog1 * (n - 1);
  const px = (i: number) => lerp(M.x0, M.x1, i / (n - 1));
  const py = (v: number) => lerp(M.y1, M.y0, v / maxV);
  const shown = Math.floor(fpos);
  let d = '';
  for (let i = 0; i <= shown; i++) d += `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${py(data[i]).toFixed(1)}`;
  const fr = fpos - shown;
  const hx = shown < n - 1 ? lerp(px(shown), px(shown + 1), fr) : px(n - 1);
  const hy = shown < n - 1 ? lerp(py(data[shown]), py(data[shown + 1]), fr) : py(data[n - 1]);
  if (frame >= start) d += `L${hx.toFixed(1)} ${hy.toFixed(1)}`;
  const ringPulse = (frame % 20) / 20;
  const axesIn = prog(frame, 0, 12, ease.out);
  const val = lerp(data[0], data[n - 1], prog1);

  // synapses: fast rise to a peak at "2", then pruning decline
  const sx = [0, 2, 6, 12, 18, 25];
  const sCurve = (x: number) => (x < 2 ? Math.pow(x / 2, 0.7) : 1 - 0.55 * Math.pow((x - 2) / 23, 0.8));
  const sT = prog(frame, 30, 110, ease.inOut);
  let sd = '';
  const sh = sT * 25;
  for (let x = 0; x <= sh; x += 0.25) sd += `${sd ? 'L' : 'M'}${lerp(Sy.x0, Sy.x1, x / 25).toFixed(1)} ${lerp(Sy.y1, Sy.y0, sCurve(x) * 0.92).toFixed(1)}`;
  const shx = lerp(Sy.x0, Sy.x1, sh / 25);
  const shy = lerp(Sy.y1, Sy.y0, sCurve(sh) * 0.92);

  // ECG: sweep in, then scroll at ~160 px/s, spike every 0.42 s
  const periodPx = 160 * u * 0.42;
  const headX = lerp(E.x0, E.x1, prog(frame, 6, 60, ease.linear));
  const scroll = Math.max(0, frame - 60) / 30 / 0.42;
  const eD = ecgPath(E.x0, E.x1, (E.y0 + E.y1) / 2 + (E.y1 - E.y0) * 0.25, (E.y1 - E.y0) * 0.6, headX, scroll, periodPx, 2 * u);
  const eHy = (E.y0 + E.y1) / 2 + (E.y1 - E.y0) * 0.25 - (E.y1 - E.y0) * 0.6 * ecg(scroll);
  const t1 = p.readout;
  const tc = typedCount(frame, 20, 1);
  const mono = fonts.mono;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, #0a0d26 0%, ${p.background} 60%, #01000F 100%)`}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {/* star dust */}
        {Array.from({length: 90}, (_, i) => {
          const r = rng(i + 3);
          return <circle key={i} cx={r() * w} cy={r() * h} r={(0.6 + r() * 1.2) * u} fill="#C8CBF5" opacity={0.15 + 0.25 * Math.abs(Math.sin(frame * 0.05 + i))} />;
        })}
        <g opacity={axesIn} stroke={HUD.axis} strokeWidth={1.2 * u} fill="none">
          <path d={`M${M.x0} ${M.y0 - 10 * u} V${M.y1} H${M.x1 + 10 * u}`} />
          {data.map((_, i) => (
            <line key={i} x1={px(i)} x2={px(i)} y1={M.y1} y2={M.y1 + 7 * u} />
          ))}
          {[0.25, 0.5, 0.75, 1].map((k) => (
            <line key={k} x1={M.x0 - 7 * u} x2={M.x0} y1={lerp(M.y1, M.y0, k)} y2={lerp(M.y1, M.y0, k)} />
          ))}
          {[0.25, 0.5, 0.75, 1].map((k) => (
            <line key={`g${k}`} x1={M.x0} x2={M.x1} y1={lerp(M.y1, M.y0, k)} y2={lerp(M.y1, M.y0, k)} stroke={HUD.ring} strokeDasharray={`${2 * u} ${6 * u}`} />
          ))}
        </g>
        <g fontFamily={mono} fill={HUD.text} opacity={axesIn}>
          <text x={M.x0 - 14 * u} y={M.y0 - 20 * u} fontSize={20 * PT * u} textAnchor="end">
            {p.yLabel}
          </text>
          <text x={M.x1 + 18 * u} y={M.y1 + 6 * u} fontSize={20 * PT * u}>
            {p.xLabel}
          </text>
          <text x={M.x0} y={M.y0 - 50 * u} fontSize={28 * u} fill="#E6E6F7">
            {p.title}
          </text>
        </g>
        <path d={d} fill="none" stroke={p.color} strokeWidth={3 * u} strokeLinejoin="round" style={{filter: `drop-shadow(0 0 ${6 * u}px ${p.color})`}} />
        {data.slice(0, shown + 1).map((v, i) => (
          <circle key={i} cx={px(i)} cy={py(v)} r={4.5 * u} fill={p.color} stroke="#fff" strokeWidth={1.2 * u} />
        ))}
        {frame >= start && (
          <>
            <circle cx={hx} cy={hy} r={(16 + 10 * ringPulse) * u} fill="none" stroke="#ffffff" strokeWidth={1.6 * u} opacity={1 - ringPulse} />
            <Glow x={hx} y={hy} r={5 * u} color={p.color} id="lc-head" />
            <text x={hx + 22 * u} y={hy - 18 * u} fontFamily={mono} fontSize={22 * PT * u} fill="#ffffff">
              {val.toFixed(1)}
            </text>
          </>
        )}
        {/* synapse chart */}
        <g opacity={prog(frame, 22, 34, ease.out)}>
          <path d={`M${Sy.x0} ${Sy.y0} V${Sy.y1} H${Sy.x1}`} fill="none" stroke={HUD.axis} strokeWidth={1.2 * u} />
          {sx.map((v, i) => (
            <text key={i} x={lerp(Sy.x0, Sy.x1, v / 25)} y={Sy.y1 + 24 * u} fontFamily={mono} fontSize={15 * PT * u} fill={HUD.text} textAnchor="middle">
              {v}
            </text>
          ))}
          <text x={Sy.x0} y={Sy.y0 - 14 * u} fontFamily={mono} fontSize={17 * PT * u} fill={HUD.text}>
            synapses
          </text>
          <path d={sd} fill="none" stroke="#40868B" strokeWidth={2.6 * u} style={{filter: `drop-shadow(0 0 ${4 * u}px #40868B)`}} />
          {sT > 0 && <Glow x={shx} y={shy} r={4 * u} color="#5FD6C8" id="lc-shead" />}
        </g>
        {/* ECG strip */}
        <g>
          <g stroke={HUD.ring} strokeWidth={1 * u} opacity={0.8}>
            {Array.from({length: Math.floor((E.x1 - E.x0) / (40 * u)) + 1}, (_, i) => (
              <line key={i} x1={E.x0 + i * 40 * u} x2={E.x0 + i * 40 * u} y1={E.y0} y2={E.y1} />
            ))}
            <line x1={E.x0} x2={E.x1} y1={E.y1} y2={E.y1} />
          </g>
          <path d={eD} fill="none" stroke={p.ecgColor} strokeWidth={2.4 * u} strokeLinejoin="round" style={{filter: `drop-shadow(0 0 ${5 * u}px ${p.ecgColor})`}} />
          <Glow x={headX} y={eHy} r={4 * u} color={p.ecgColor} id="lc-ehead" />
          <text x={E.x0} y={E.y0 - 12 * u} fontFamily={mono} fontSize={17 * PT * u} fill={HUD.text}>
            {`♥ ${p.bpm} bpm`}
          </text>
        </g>
        <text x={portrait ? M.x0 : M.x0} y={portrait ? M.y1 + 70 * u : M.y1 + 64 * u} fontFamily={mono} fontSize={22 * PT * u} fill="#E6E6F7">
          {t1.slice(0, tc)}
          {tc < t1.length || blinkOn(frame) ? '▊' : ''}
        </text>
      </svg>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ sync
const SyncMode: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, portrait} = useStage();
  const pw = portrait ? w * 0.9 : w * 0.72;
  const ph = portrait ? 300 * u : 260 * u;
  const px0 = cx - pw / 2;
  const py0 = portrait ? h * 0.6 : h * 0.6;
  const enter = prog(frame, 0, 14, ease.out);
  const periodF = 1800 / p.bpm;
  const off = 0.38 * (1 - prog(frame, 60, 105, ease.inOut));
  const tx0 = px0 + 120 * u;
  const tx1 = px0 + pw - 40 * u;
  const periodPx = (tx1 - tx0) / 3.2;
  const scroll = frame / periodF;
  const lane = (k: number) => py0 + ph * (k === 0 ? 0.4 : 0.76);
  const amp = ph * 0.26;
  const tc = typedCount(frame, 112, 0.5);
  // big hearts above
  const beat = (ph0: number) => {
    const q = ((scroll + ph0) % 1 + 1) % 1;
    return 1 + 0.16 * Math.exp(-Math.pow((q - 0.31) / 0.05, 2));
  };
  const gap = lerp(portrait ? 300 : 360, portrait ? 150 : 170, prog(frame, 60, 120, ease.inOut)) * u;
  const hy = portrait ? h * 0.33 : h * 0.3;
  const synced = frame >= 105;
  const bokeh = React.useMemo(() => {
    const r = rng(17);
    return Array.from({length: 46}, (_, i) => {
      const t = i / 46;
      const row = i % 2;
      return {x: t * w * 1.1 - w * 0.05, y: h * (0.08 + row * 0.1) + Math.sin(t * Math.PI) * h * 0.08, r: (6 + r() * 10) * u, ph: r() * 6};
    });
  }, [w, h, u]);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, #5a3a52 0%, #2a1e3a 55%, #120c1c 100%)`}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {bokeh.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="#FFD98A" opacity={0.25 + 0.2 * Math.sin(frame * 0.08 + b.ph)} style={{filter: `blur(${2 * u}px)`}} />
        ))}
        {[0, 1].map((k) => {
          const s = beat(k === 0 ? 0 : off) * (portrait ? 1.6 : 1.4);
          return (
            <g key={k} opacity={enter} style={{filter: `drop-shadow(0 0 ${(synced ? 30 : 14) * u}px ${p.syncColors[k]})`}}>
              <FlatIcon kind="heart" x={cx + (k === 0 ? -gap / 2 : gap / 2)} y={hy} s={150 * u * s} ink="#2a1030" mono={p.syncColors[k]} />
            </g>
          );
        })}
        {synced &&
          frame < 125 &&
          (() => {
            const t = (frame - 105) / 20;
            return <circle cx={cx} cy={hy} r={lerp(20, 260, ease.out(t)) * u} fill="none" stroke="#ffffff" strokeWidth={4 * u * (1 - t)} opacity={1 - t} />;
          })()}
        {/* panel */}
        <g opacity={enter} transform={`translate(0 ${(1 - enter) * 30 * u})`}>
          <rect x={px0} y={py0} width={pw} height={ph} rx={14 * u} fill="#2A1E3A" fillOpacity={0.62} stroke="#ffffff" strokeOpacity={0.08} />
          {Array.from({length: Math.floor((pw - 40 * u) / (14 * u))}, (_, i) => (
            <circle key={i} cx={px0 + 20 * u + i * 14 * u} cy={py0 + 16 * u} r={1.6 * u} fill="#ffffff" opacity={0.18} />
          ))}
          {[0, 1].map((k) => {
            const yb = lane(k);
            const phase = k === 0 ? 0 : off;
            const dd = ecgPath(tx0, tx1, yb, amp, tx1, scroll, periodPx, 2 * u, phase);
            const hy2 = yb - amp * ecg(scroll + phase);
            return (
              <g key={k}>
                <FlatIcon kind="heart" x={px0 + 60 * u} y={yb - amp * 0.25} s={46 * u * beat(phase)} ink="#2a1030" mono={p.syncColors[k]} />
                <path d={dd} fill="none" stroke={p.syncColors[k]} strokeWidth={3 * u} strokeLinejoin="round" style={{filter: `drop-shadow(0 0 ${4 * u}px ${p.syncColors[k]})`}} />
                <Glow x={tx1} y={hy2} r={4 * u} color={p.syncColors[k]} id={`lc-sh${k}`} />
              </g>
            );
          })}
          <text x={px0 + pw - 24 * u} y={py0 + 52 * u} textAnchor="end" fontFamily={fonts.mono} fontSize={34 * u} fill="#F3E9FF">
            {p.label.slice(0, tc)}
            {tc > 0 && (tc < p.label.length || blinkOn(frame)) ? '▊' : ''}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ decline
const DeclineMode: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, fps, portrait} = useStage();
  const mw = portrait ? w * 0.86 : w * 0.5;
  const mh = mw * 0.58;
  const mx = portrait ? cx - mw / 2 : w * 0.08;
  const my = portrait ? h * 0.14 : h * 0.24;
  const enter = prog(frame, 0, 14, ease.out);
  const switchAt = 70;
  const drawT = prog(frame, switchAt + 2, switchAt + 26, ease.inOut);
  const red = frame >= switchAt;
  const sx0 = mx + 50 * u;
  const sx1 = mx + mw - 40 * u;
  const sy = my + mh * 0.5;
  const amp = mh * 0.12;
  // cyan sine (scrolling)
  let sine = '';
  for (let x = sx0; x <= sx1; x += 3 * u) sine += `${sine ? 'L' : 'M'}${x.toFixed(1)} ${(sy - amp * Math.sin((x - sx0) / (60 * u) - frame * 0.15)).toFixed(1)}`;
  // decline
  const vals = p.declineValues.length > 1 ? p.declineValues : [1, 0.9, 0.95, 0.7, 0.75, 0.5, 0.55, 0.3, 0.2];
  const vmax = Math.max(...vals);
  const vmin = Math.min(...vals);
  let dec = '';
  const N = 90;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const f = t * (vals.length - 1);
    const k = Math.min(vals.length - 2, Math.floor(f));
    const v = lerp(vals[k], vals[k + 1], f - k);
    const wob = Math.sin(t * 30 + frame * 0.05) * 0.03;
    const y = lerp(my + mh * 0.82, my + mh * 0.25, (v - vmin) / (vmax - vmin || 1)) + wob * mh;
    dec += `${i ? 'L' : 'M'}${lerp(sx0, sx1, t).toFixed(1)} ${y.toFixed(1)}`;
  }
  const lineC = red ? p.colorTo : p.colorFrom;
  // gauge
  const gr = portrait ? 230 * u : 220 * u;
  const gx = portrait ? cx : w * 0.78;
  const gy = portrait ? h * 0.78 : h * 0.62;
  const ang = (v: number) => Math.PI + v * Math.PI; // v 0..1 -> left..right (top arc)
  const sp = spring({frame: frame - 100, fps, config: {damping: 7, stiffness: 120, mass: 0.8}});
  const gv = frame < 100 ? p.gaugeFrom : lerp(p.gaugeFrom, p.gaugeTo, sp);
  const na = ang(gv);
  const seg = (a0: number, a1: number) => `M${gx + Math.cos(ang(a0)) * gr} ${gy + Math.sin(ang(a0)) * gr} A${gr} ${gr} 0 0 1 ${gx + Math.cos(ang(a1)) * gr} ${gy + Math.sin(ang(a1)) * gr}`;
  const pct = Math.round(lerp(0, -38, drawT));
  const warn = red && Math.floor(frame / 8) % 2 === 0;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #2b3d78 0%, #1b2550 60%, #0f1530 100%)'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="lc-tiles" width={80 * u} height={80 * u} patternUnits="userSpaceOnUse">
            <rect width={80 * u} height={80 * u} fill="none" stroke="#2a3a66" strokeWidth={2 * u} />
          </pattern>
          <linearGradient id="lc-scr" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a1d33" />
            <stop offset="1" stopColor="#0f1122" />
          </linearGradient>
        </defs>
        <rect width={w} height={h} fill="url(#lc-tiles)" opacity={0.6} />
        <rect y={h * 0.86} width={w} height={h * 0.14} fill="#141a33" opacity={0.7} />
        <rect y={h * 0.86} width={w} height={4 * u} fill="#5FE0F0" opacity={0.6} />
        {/* monitor */}
        <g opacity={enter} transform={`translate(0 ${(1 - enter) * 30 * u})`}>
          <rect x={mx + mw / 2 - 8 * u} y={my + mh} width={16 * u} height={portrait ? 60 * u : h * 0.86 - my - mh} fill="#2b2f45" />
          <rect x={mx - 18 * u} y={my - 18 * u} width={mw + 36 * u} height={mh + 36 * u} rx={20 * u} fill="#232637" />
          <rect x={mx} y={my} width={mw} height={mh} rx={8 * u} fill="url(#lc-scr)" />
          {[0.25, 0.5, 0.75].map((k) => (
            <line key={k} x1={sx0} x2={sx1} y1={my + mh * k} y2={my + mh * k} stroke="#ffffff" strokeOpacity={0.06} strokeWidth={1.5 * u} />
          ))}
          <text x={mx + 30 * u} y={my + 48 * u} fontFamily={fonts.sans} fontWeight={800} fontSize={26 * u} fill="#E8ECF8" letterSpacing={2 * u}>
            {p.title}
          </text>
          {red && (
            <text x={mx + mw - 30 * u} y={my + 48 * u} textAnchor="end" fontFamily={fonts.mono} fontWeight={700} fontSize={30 * u} fill={p.colorTo}>
              {pct}%
            </text>
          )}
          {!red ? (
            <path d={sine} fill="none" stroke={lineC} strokeWidth={4 * u} strokeLinecap="round" style={{filter: `drop-shadow(0 0 ${8 * u}px ${lineC})`}} />
          ) : (
            <path d={dec} fill="none" stroke={lineC} strokeWidth={4 * u} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - drawT} style={{filter: `drop-shadow(0 0 ${8 * u}px ${lineC})`}} />
          )}
          {warn && <FlatIcon kind="bolt" x={mx + mw - 50 * u} y={my + mh - 50 * u} s={44 * u} mono={p.colorTo} ink="#1a0f1a" />}
        </g>
        {/* gauge */}
        <g opacity={prog(frame, 6, 20, ease.out)}>
          <rect x={gx - gr - 40 * u} y={gy - gr - 90 * u} width={2 * gr + 80 * u} height={gr + 150 * u} rx={24 * u} fill="#1a1f38" stroke="#2f3a66" strokeWidth={3 * u} />
          <text x={gx} y={gy - gr - 44 * u} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={24 * u} fill="#E8ECF8" letterSpacing={2 * u}>
            {p.title === 'QUALITY' ? 'REASONING EFFORT' : 'EFFORT'}
          </text>
          {Array.from({length: 24}, (_, i) => {
            const a = i / 24;
            return <path key={i} d={seg(a, a + 1 / 24 + 0.002)} fill="none" stroke={a < 0.5 ? mixC('#E05050', '#F2C94C', a * 2) : mixC('#F2C94C', '#4FCB72', (a - 0.5) * 2)} strokeWidth={30 * u} />;
          })}
          {p.gaugeLabels.map((l, i) => {
            const a = ang(i / (p.gaugeLabels.length - 1));
            return (
              <text key={i} x={gx + Math.cos(a) * (gr - 50 * u)} y={gy + Math.sin(a) * (gr - 50 * u) + 8 * u} textAnchor="middle" fontFamily={fonts.sans} fontWeight={700} fontSize={18 * u} fill="#C9CFE6">
                {l}
              </text>
            );
          })}
          <line x1={gx} y1={gy} x2={gx + Math.cos(na) * (gr - 20 * u)} y2={gy + Math.sin(na) * (gr - 20 * u)} stroke="#F4F6FB" strokeWidth={8 * u} strokeLinecap="round" />
          <circle cx={gx} cy={gy} r={18 * u} fill="#F4F6FB" />
          <circle cx={gx} cy={gy} r={7 * u} fill="#232637" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const modeExtra = (p: Props) => ({
  series: p.series,
  threshold: p.threshold,
  stamp: p.stamp,
  readout: p.mode === 'scope' ? p.readout : p.readout.startsWith('wk 8') ? 'CLOSE 4,212.30  ·  PREV 4,556.90' : p.readout,
  color: p.mode === 'scope' && p.color === '#C8D0F5' ? '#6CFFA6' : p.color,
  background: p.mode === 'scope' && p.background === '#020414' ? '#010806' : p.mode === 'threshold' && p.background === '#020414' ? '#0B0E14' : p.background,
  bpm: p.bpm,
  echoes: p.echoes,
  graticule: p.graticule,
  title: p.mode === 'scope' ? (p.title === 'fetal growth' ? 'CH1 · 2 V/DIV' : p.title) : p.title === 'fetal growth' ? 'LIMIT' : p.title,
});

const LiveChart: React.FC<Props> = (p) => (p.mode === 'threshold' ? <ThresholdMode {...modeExtra(p)} /> : p.mode === 'scope' ? <ScopeMode {...modeExtra(p)} /> : p.mode === 'sync' ? <SyncMode {...p} /> : p.mode === 'decline' ? <DeclineMode {...p} /> : <TraceMode {...p} />);

export const liveChart = defineMotion<Props>({
  id: 'live-chart',
  title: 'Live chart / ECG traces',
  category: 'data',
  description: "Line charts that draw live with a glowing head dot: growth curve + synapse curve + scrolling ECG ('trace'), two heartbeats drifting into sync ('sync'), or a quality line turning red and falling while a gauge needle swings down ('decline').",
  source: ['video11 8:00-9:42 live-chart-trace', 'video11 20:00-21:96 dual-heartbeat-sync', 'video12 52:83-57:60 data-decline-chart'],
  useFor: 'Growth / vital-sign / metric beats, "in sync" relationship moments, "it got worse" data moments.',
  durationInFrames: 210,
  defaultProps: {
    mode: 'trace',
    data: [0.05, 0.12, 0.3, 0.6, 1.0, 1.5, 2.1, 2.7, 3.1, 3.4],
    declineValues: [1, 0.93, 0.97, 0.8, 0.84, 0.62, 0.66, 0.45, 0.32],
    title: 'fetal growth',
    xLabel: 'wk',
    yLabel: 'kg',
    readout: 'wk 8 → wk 40 · 3.4 kg',
    color: '#C8D0F5',
    ecgColor: '#E05DD5',
    syncColors: ['#E978D6', '#F4D96A'],
    label: 'in sync',
    bpm: 140,
    colorFrom: '#5FE0F0',
    colorTo: '#E75855',
    gaugeLabels: ['LOW', 'MEDIUM', 'HIGH'],
    gaugeFrom: 0.85,
    gaugeTo: 0.5,
    background: '#020414',
    series: [] as number[],
    threshold: 0.72,
    stamp: 'BREAK',
    echoes: 4,
    graticule: true,
  },
  propDocs: {
    mode: "'trace' (growth + synapses + ECG), 'sync' (dual heartbeat sync), 'decline' (quality chart + gauge), 'threshold' (line steps toward a dashed limit, final point breaks it with shake, ring, readout panel + stamp), 'scope' (phosphor oscilloscope: beat-repainted trace with echoes, graticule, CRT-off exit)",
    series: 'threshold: 0..1 values of the line ([] = built-in climb that breaks the limit on the last point)',
    threshold: 'threshold: height of the dashed limit line, 0..1',
    stamp: 'threshold: stamp text that lands on the readout panel',
    echoes: 'scope: number of fading previous sweeps kept on screen',
    graticule: 'scope: draw the glass graticule over the trace',
    data: 'trace: main curve values (one sample revealed per 0.25 s)',
    declineValues: 'decline: values of the falling red line',
    title: "trace: chart title; decline: monitor title ('QUALITY' also names the gauge REASONING EFFORT)",
    readout: 'trace: typed mono readout under the chart',
    color: 'trace: main curve colour',
    ecgColor: 'trace: ECG colour',
    syncColors: 'sync: [first, second] trace / heart colours',
    label: "sync: label typed when the traces align",
    bpm: 'ECG beats per minute (sync uses it for both hearts)',
    colorFrom: 'decline: starting line colour',
    colorTo: 'decline: colour after the switch',
    gaugeFrom: 'decline: needle start 0..1 (0 = LOW, 1 = HIGH)',
    gaugeTo: 'decline: needle end 0..1',
    background: 'background colour (trace / decline)',
  },
  component: LiveChart,
  tags: ['chart', 'ecg', 'heartbeat', 'line', 'data', 'gauge', 'hud', 'threshold', 'break', 'oscilloscope', 'scope', 'crt', 'news', 'stock', 'limit'],
});
