import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, ease, lerp, prog} from './ease';
import {fonts} from './fonts';
import {rng} from './random';
import {Svg, useStage} from './stage';

/**
 * Round-2 group E2: live-chart modes 'threshold' (news-style break-the-line chart) and 'scope'
 * (triggered phosphor oscilloscope with echoes and a CRT-off exit).
 * Ideas from lemo-opuscar styles/news-package and pdoom-video scope-trace (MIT) — see THIRD_PARTY_NOTICES.md.
 */

export interface ChartExtraProps {
  series: number[];
  threshold: number;
  stamp: string;
  readout: string;
  color: string;
  background: string;
  bpm: number;
  echoes: number;
  graticule: boolean;
  title: string;
}

/** default series: slow climb with wobble, the last point breaks the threshold */
const defaultSeries = (n: number, threshold: number) => {
  const r = rng(11);
  return Array.from({length: n}, (_, i) => {
    if (i === n - 1) return threshold + 0.2;
    return 0.22 + (0.42 * i) / (n - 2) + Math.sin(i * 0.9) * 0.05 + (r() - 0.5) * 0.06;
  });
};

/* ------------------------------------------------------------------ threshold */

export const ThresholdMode: React.FC<ChartExtraProps> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const ser = p.series.length > 1 ? p.series : defaultSeries(22, p.threshold);
  const N = ser.length;
  const nEarly = Math.max(2, N - 8);
  // reveal start frame of every point
  const t: number[] = [];
  let acc = 6;
  for (let i = 0; i < N; i++) {
    t.push(acc);
    acc += i < nEarly ? 2.1 : i < N - 1 ? 9 : 4;
    if (i === N - 2) acc += 12; // one beat of silence before the break
  }
  const tLast = t[N - 1];
  const M = portrait ? {x0: w * 0.1, x1: w * 0.9, y0: h * 0.2, y1: h * 0.5} : {x0: w * 0.08, x1: w * 0.62, y0: h * 0.2, y1: h * 0.78};
  const X = (i: number) => lerp(M.x0, M.x1, i / (N - 1));
  const Y = (v: number) => lerp(M.y1, M.y0, clamp(v));
  // head position (fractional point index)
  let idx = 0;
  for (let i = 0; i < N; i++) if (frame >= t[i]) idx = i;
  const next = Math.min(N - 1, idx + 1);
  const dur = idx < nEarly ? 4 : idx < N - 2 ? 6 : 8;
  const f = idx === N - 1 ? 0 : clamp((frame - t[idx]) / dur);
  const head = frame < t[0] ? -1 : idx + (next > idx ? f : 0);
  const pts: [number, number][] = [];
  for (let i = 0; i <= Math.floor(head); i++) pts.push([X(i), Y(ser[i])]);
  if (head >= 0 && head < N - 1 && head % 1 > 0) {
    const i = Math.floor(head);
    const k = head - i;
    pts.push([lerp(X(i), X(i + 1), k), lerp(Y(ser[i]), Y(ser[i + 1]), k)]);
  }
  const lineD = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('');
  const lastIdx = Math.floor(head);
  // the final segment is drawn separately in lemon
  const breakStart = tLast;
  const broke = frame >= breakStart;
  const mainPts = broke ? pts.slice(0, N - 1) : pts;
  const mainD = mainPts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('');
  const lemon = '#F4E04D';
  const gold = '#D9B24A';
  const paper = '#ECE8DC';
  const areaD = mainPts.length > 1 ? `${mainD}L${mainPts[mainPts.length - 1][0]} ${M.y1}L${mainPts[0][0]} ${M.y1}Z` : '';
  const thrIn = prog(frame, 0, 15, ease.out);
  const ty = Y(p.threshold);
  // shake after break
  const sk = Math.max(0, 1 - (frame - breakStart) / 12);
  const shx = frame >= breakStart ? Math.sin((frame - breakStart) * 2.77) * 14 * u * sk : 0;
  const shy = frame >= breakStart ? Math.cos((frame - breakStart) * 2.37) * 10 * u * sk : 0;
  const ringT = prog(frame, breakStart + 4, breakStart + 22, ease.out);
  const day = Math.min(N, Math.max(1, lastIdx + 1));
  const blink = frame > tLast - 20 && frame < tLast && Math.floor(frame / 2) % 2 === 0;
  const panelIn = prog(frame, breakStart + 10, breakStart + 18, ease.out);
  const val = lerp(0, 7.57, prog(frame, breakStart + 14, breakStart + 26, ease.out));
  const stampT = prog(frame, breakStart + 22, breakStart + 27, ease.out);
  const push = 1 + 0.05 * clamp(frame / 200);
  const head2 = pts.length ? pts[pts.length - 1] : [M.x0, M.y1];
  const lastPt: [number, number] = [X(N - 1), Y(ser[N - 1])];
  const prevPt: [number, number] = [X(N - 2), Y(ser[N - 2])];
  const brk = prog(frame, breakStart, breakStart + 5, (x) => x);
  const brkEnd: [number, number] = [lerp(prevPt[0], lastPt[0], brk), lerp(prevPt[1], lastPt[1], brk)];
  const px = portrait ? w * 0.1 : w * 0.68;
  const py = portrait ? h * 0.56 : h * 0.22;
  const pw = portrait ? w * 0.8 : w * 0.26;
  const ph = portrait ? h * 0.3 : h * 0.46;
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <linearGradient id="lc-thr-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={lemon} stopOpacity={0.14} />
            <stop offset="1" stopColor={lemon} stopOpacity={0} />
          </linearGradient>
        </defs>
        <g transform={`translate(${shx} ${shy}) translate(${w / 2} ${h / 2}) scale(${push}) translate(${-w / 2} ${-h / 2})`}>
          {[0.25, 0.5, 0.75].map((k) => (
            <line key={k} x1={M.x0} x2={M.x1} y1={lerp(M.y1, M.y0, k)} y2={lerp(M.y1, M.y0, k)} stroke="#ffffff" strokeOpacity={0.07} strokeWidth={u * 1.5} />
          ))}
          <line x1={M.x0} x2={M.x0 + (M.x1 - M.x0) * thrIn} y1={ty} y2={ty} stroke={frame >= breakStart + 5 && frame < breakStart + 9 ? '#ffffff' : gold} strokeWidth={3 * u} strokeDasharray={`${14 * u} ${10 * u}`} />
          <text x={M.x0} y={ty - 14 * u} fontFamily={fonts.mono} fontWeight={700} fontSize={22 * u} fill={gold} opacity={thrIn}>
            {p.title}
          </text>
          {areaD && <path d={areaD} fill="url(#lc-thr-fill)" />}
          {mainD && <path d={mainD} fill="none" stroke={paper} strokeWidth={5 * u} strokeLinejoin="round" strokeLinecap="round" />}
          {broke && <line x1={prevPt[0]} y1={prevPt[1]} x2={brkEnd[0]} y2={brkEnd[1]} stroke={lemon} strokeWidth={7 * u} strokeLinecap="round" />}
          {!broke && head >= 0 && <circle cx={head2[0]} cy={head2[1]} r={9 * u} fill={blink ? 'transparent' : paper} stroke={paper} strokeWidth={2 * u} />}
          {broke && <circle cx={brkEnd[0]} cy={brkEnd[1]} r={9 * u} fill={lemon} />}
          {broke && ringT > 0 && ringT < 1 && <circle cx={lastPt[0]} cy={lastPt[1]} r={lerp(20, 280, ringT) * u * 0.7} fill="none" stroke={lemon} strokeWidth={4 * u * (1 - ringT)} opacity={1 - ringT} />}
        </g>
        {/* day counter */}
        <text x={M.x1} y={M.y0 - 24 * u} textAnchor="end" fontFamily={fonts.mono} fontWeight={700} fontSize={36 * u} fill={broke ? lemon : paper} opacity={head >= 0 ? 1 : 0} transform={`translate(0 ${-(1 - Math.min(1, ((frame - t[Math.max(0, lastIdx)]) / 2 + 0.4))) * 6 * u})`}>
          {`DAY ${day}`}
        </text>
        {/* readout panel */}
        <g transform={`translate(${(1 - panelIn) * w * 0.35} 0)`} opacity={panelIn}>
          <rect x={px} y={py} width={pw} height={ph} rx={14 * u} fill="#151a24" stroke="#2c3446" strokeWidth={2 * u} />
          <text x={px + pw / 2} y={py + ph * 0.46} textAnchor="middle" fontFamily={fonts.display} fontSize={Math.min(pw * 0.2, 110 * u)} fill={lemon}>
            {`-${val.toFixed(2)}%`}
          </text>
          <text x={px + pw / 2} y={py + ph * 0.7} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={24 * u} fill={paper} opacity={prog(frame, breakStart + 22, breakStart + 30)}>
            {p.readout}
          </text>
        </g>
        {/* stamp */}
        {stampT > 0 && (
          <g transform={`translate(${px + pw * 0.62} ${py + ph * 0.06}) rotate(-7) scale(${lerp(2, 1, stampT)})`} opacity={stampT}>
            <rect x={-pw * 0.26} y={-34 * u} width={pw * 0.52} height={68 * u} fill="none" stroke="#E5484D" strokeWidth={5 * u} rx={6 * u} />
            <text textAnchor="middle" y={14 * u} fontFamily={fonts.display} fontSize={40 * u} fill="#E5484D" letterSpacing={3 * u}>
              {p.stamp}
            </text>
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ scope */

const wave = (x: number, k: number) => {
  // a triggered, stable trace; every sweep drifts a little
  const a = 0.55 + 0.25 * Math.sin(k * 0.9);
  return a * Math.sin(x * 14 + k * 0.4) * (0.55 + 0.45 * Math.sin(x * 3.1 + k * 0.7)) + 0.18 * Math.sin(x * 39 + k) * Math.sin(x * 6);
};

export const ScopeMode: React.FC<ChartExtraProps> = (p) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const {w, h, u, portrait} = useStage();
  const beat = (30 * 60) / Math.max(30, p.bpm);
  const k0 = Math.floor(frame / beat);
  const head = clamp(((frame % beat) / beat) / 0.85);
  const B = portrait ? {x0: w * 0.08, x1: w * 0.92, y0: h * 0.3, y1: h * 0.7} : {x0: w * 0.1, x1: w * 0.9, y0: h * 0.14, y1: h * 0.86};
  const cx = (B.x0 + B.x1) / 2;
  const cy = (B.y0 + B.y1) / 2;
  const hh = (B.y1 - B.y0) / 2;
  const SAMPLES = 160;
  const trace = (k: number, upto: number) => {
    let d = '';
    const n = Math.floor(SAMPLES * upto);
    for (let i = 0; i <= n; i++) {
      const x = i / SAMPLES;
      d += `${i ? 'L' : 'M'}${(B.x0 + (B.x1 - B.x0) * x).toFixed(1)} ${(cy - wave(x, k) * hh * 0.7).toFixed(1)}`;
    }
    return d;
  };
  const exitStart = durationInFrames - 14;
  const ex = frame - exitStart;
  const sy = ex <= 0 ? 1 : ex < 8 ? Math.max(0.004, 1 - Math.pow(ex / 8, 3) * 0.996) : 0.004;
  const sx = ex < 8 ? 1 : Math.max(0, 1 - (ex - 8) / 4);
  const bright = ex > 0 ? 1 + Math.min(1, ex / 6) * 1.5 : 1;
  const dot = ex >= 12 ? 1 : 0;
  const col = p.color;
  const par = Math.sin(frame * 0.02) * 3 * u;
  const lines: React.ReactNode[] = [];
  const nEch = Math.max(0, Math.floor(p.echoes));
  for (let e = nEch; e >= 0; e--) {
    const k = k0 - e;
    if (k < 0) continue;
    const upto = e === 0 ? head : 1;
    const op = e === 0 ? 1 : Math.pow(1 - e / (nEch + 1), 1.6) * 0.5;
    lines.push(<path key={e} d={trace(k, upto)} fill="none" stroke={col} strokeWidth={(e === 0 ? 4 : 2.5) * u} strokeLinejoin="round" opacity={op} filter={e === 0 ? 'url(#lc-scope-glow)' : undefined} />);
  }
  const hx = B.x0 + (B.x1 - B.x0) * head;
  const hy = cy - wave(head, k0) * hh * 0.7;
  const grat = p.graticule;
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <filter id="lc-scope-glow" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation={6 * u} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="lc-scope-vig" cx="50%" cy="50%" r="70%">
            <stop offset="0.5" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.6} />
          </radialGradient>
        </defs>
        <g transform={`translate(${cx} ${cy}) scale(${sx} ${sy}) translate(${-cx} ${-cy})`} style={{filter: `brightness(${bright})`}}>
          <rect x={B.x0} y={B.y0} width={B.x1 - B.x0} height={B.y1 - B.y0} fill="#04100a" />
          {lines}
          {head > 0 && head < 1 && <circle cx={hx} cy={hy} r={7 * u} fill="#ffffff" opacity={0.9} />}
          {grat && (
            <g transform={`translate(${par} 0)`} opacity={0.55}>
              {Array.from({length: 11}, (_, i) => (
                <line key={'v' + i} x1={B.x0 + ((B.x1 - B.x0) * i) / 10} x2={B.x0 + ((B.x1 - B.x0) * i) / 10} y1={B.y0} y2={B.y1} stroke={col} strokeOpacity={i === 5 ? 0.5 : 0.2} strokeWidth={u * 1.5} />
              ))}
              {Array.from({length: 9}, (_, i) => (
                <line key={'h' + i} x1={B.x0} x2={B.x1} y1={B.y0 + ((B.y1 - B.y0) * i) / 8} y2={B.y0 + ((B.y1 - B.y0) * i) / 8} stroke={col} strokeOpacity={i === 4 ? 0.5 : 0.2} strokeWidth={u * 1.5} />
              ))}
              {Array.from({length: 51}, (_, i) => (
                <line key={'t' + i} x1={B.x0 + ((B.x1 - B.x0) * i) / 50} x2={B.x0 + ((B.x1 - B.x0) * i) / 50} y1={cy - 6 * u} y2={cy + 6 * u} stroke={col} strokeOpacity={0.45} strokeWidth={u} />
              ))}
            </g>
          )}
          <text x={B.x0 + 16 * u} y={B.y0 + 36 * u} fontFamily={fonts.mono} fontWeight={700} fontSize={22 * u} fill={col} opacity={0.8}>
            {p.title.toUpperCase()}
          </text>
          <rect x={B.x0} y={B.y0} width={B.x1 - B.x0} height={B.y1 - B.y0} fill="url(#lc-scope-vig)" />
        </g>
        {dot > 0 && <circle cx={cx} cy={cy} r={10 * u} fill="#ffffff" filter="url(#lc-scope-glow)" opacity={1 - clamp((ex - 12) / 2)} />}
      </Svg>
    </AbsoluteFill>
  );
};
