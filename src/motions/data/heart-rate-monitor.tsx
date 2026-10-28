import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {Header, clip, resolveFont, useChartBox} from '../../core/r3-chart-kit';
import {isClear, mixHex} from '../../core/r3-vertical-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Zone = {label: string; min: number; max: number; color?: string};
type Props = {
  title: string;
  subtitle: string;
  unit: string;
  bpmStart: number;
  bpmPeak: number;
  bpmEnd: number;
  zones: Zone[];
  zonesTitle: string;
  showGrid: boolean;
  background: string;
  panel: string;
  ink: string;
  accent: string;
  fontFamily: string;
  startAt: number;
  speed: number;
};

const ZONES: Zone[] = [
  {label: 'Rest', min: 0, max: 99, color: '#5AA9FF'},
  {label: 'Fat burn', min: 100, max: 129, color: '#3DDC97'},
  {label: 'Cardio', min: 130, max: 159, color: '#FFB020'},
  {label: 'Peak', min: 160, max: 220, color: '#FF4D5E'},
];

const g = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));
/** one PQRST complex, phase 0..1 -> -0.3..1 */
const ecg = (p: number) => 0.13 * g(p, 0.16, 0.035) - 0.14 * g(p, 0.285, 0.011) + 1.0 * g(p, 0.31, 0.011) - 0.26 * g(p, 0.335, 0.012) + 0.24 * g(p, 0.56, 0.055);

const HeartRateMonitor: React.FC<Props> = ({title, subtitle, unit, bpmStart, bpmPeak, bpmEnd, zones, zonesTitle, showGrid, background, panel, ink, accent, fontFamily, startAt, speed}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const {u, portrait} = useStage();
  const box = useChartBox(title, subtitle);
  const font = resolveFont(fontFamily);
  const zs = zones.length ? zones : ZONES;

  const bpmAt = (f: number) => {
    const s = f * speed;
    const up = ease.inOut(clamp((s - 40) / 100));
    const down = ease.inOut(clamp((s - 150) / 70));
    return bpmStart + (bpmPeak - bpmStart) * up + (bpmEnd - bpmPeak) * down;
  };
  // cumulative heart beats per frame (deterministic integral of bpm)
  const cum = useMemo(() => {
    const a: number[] = [0];
    for (let f = 1; f <= durationInFrames + 2; f++) a.push(a[f - 1] + bpmAt(f - 0.5) / 1800);
    return a;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpmStart, bpmPeak, bpmEnd, speed, durationInFrames]);
  const beats = (f: number) => {
    if (f <= 0) return (f * bpmAt(0)) / 1800;
    const i = Math.min(cum.length - 2, Math.floor(f));
    return cum[i] + (cum[i + 1] - cum[i]) * (f - i);
  };

  const bpm = bpmAt(frame);
  const zone = zs.find((z) => bpm >= z.min && bpm <= z.max) || zs[zs.length - 1];
  const zColor = zone.color || accent;
  const bp = beats(frame);
  const beatPhase = bp - Math.floor(bp);
  const pulse = 1 + 0.22 * Math.exp(-(((beatPhase - 0.31) / 0.07) ** 2));

  // layout
  const side = !portrait;
  const readW = side ? box.w * 0.34 : box.w;
  const plot = side ? {x: box.x, y: box.y, w: box.w - readW - 36 * u, h: box.h} : {x: box.x, y: box.y + box.h * 0.3, w: box.w, h: box.h * 0.4};
  const readRect = side ? {x: box.x + plot.w + 36 * u, y: box.y, w: readW, h: box.h} : {x: box.x, y: box.y, w: box.w, h: box.h * 0.27};
  const zonesRect = side ? null : {x: box.x, y: plot.y + plot.h + 30 * u, w: box.w, h: box.h - (plot.y - box.y) - plot.h - 30 * u};

  // trace
  const N = 720; // columns across the monitor
  const WIN = 200; // frames shown across the width
  const step = WIN / N;
  const head = (((frame * 1.0) % WIN) / WIN) * N; // sweep head in columns
  const pad = 22 * u;
  const tx0 = plot.x + pad;
  const tw2 = plot.w - pad * 2;
  const midY = plot.y + plot.h * 0.62;
  const amp = plot.h * 0.5;
  const yOf = (f: number) => midY - ecg(((beats(f) % 1) + 1) % 1) * amp;
  const xOf = (k: number) => tx0 + (k / (N - 1)) * tw2;
  const pts = (k0: number, k1: number) => {
    const out: string[] = [];
    for (let k = Math.ceil(k0); k <= Math.floor(k1); k++) {
      const age = ((head - k) % N + N) % N; // columns since this column was written
      const fr = frame - age * step;
      out.push(`${xOf(k).toFixed(1)},${yOf(fr).toFixed(1)}`);
    }
    return out.length > 1 ? 'M' + out.join('L') : '';
  };
  const gap = 34;
  const aStart = head + gap;
  const pathNew = pts(0, Math.min(N - 1, head));
  const pathOld = pts(aStart, N - 1);
  const headY = yOf(frame);
  const inT = prog(frame, startAt, startAt + 18);
  const bigSize = side ? Math.min(readRect.w * 0.29, readRect.h * 0.22) : Math.min(readRect.h * 0.5, readRect.w * 0.19);
  const bg = isClear(background) ? 'transparent' : background;

  // grid
  const gridStep = 28 * u;
  const gridLines: React.ReactNode[] = [];
  if (showGrid) {
    for (let x = 0; x <= plot.w; x += gridStep) gridLines.push(<line key={'v' + x} x1={plot.x + x} y1={plot.y} x2={plot.x + x} y2={plot.y + plot.h} stroke={ink} strokeOpacity={Math.round(x / gridStep) % 5 === 0 ? 0.1 : 0.04} strokeWidth={1.2 * u} />);
    for (let y = 0; y <= plot.h; y += gridStep) gridLines.push(<line key={'h' + y} x1={plot.x} y1={plot.y + y} x2={plot.x + plot.w} y2={plot.y + y} stroke={ink} strokeOpacity={Math.round(y / gridStep) % 5 === 0 ? 0.1 : 0.04} strokeWidth={1.2 * u} />);
  }

  const zoneRow = (z: Zone, i: number, x: number, y: number, w: number, h: number) => {
    const active = z === zone;
    const a = prog(frame, startAt + 14 + i * 5, startAt + 30 + i * 5);
    const col = z.color || accent;
    return (
      <g key={i} opacity={a} transform={`translate(${(1 - a) * 24 * u} 0)`}>
        <rect x={x} y={y + h * 0.08} width={w} height={h * 0.84} rx={h * 0.24} fill={active ? col : panel} fillOpacity={active ? 0.22 : 1} stroke={col} strokeOpacity={active ? 1 : 0} strokeWidth={2.5 * u} />
        <circle cx={x + h * 0.4} cy={y + h / 2} r={h * 0.13} fill={col} />
        <text x={x + h * 0.7} y={y + h / 2 + h * 0.13} fontFamily={font} fontWeight={active ? 700 : 600} fontSize={h * 0.34} fill={ink} fillOpacity={active ? 1 : 0.8}>
          {clip(z.label, w - h * 3, h * 0.34)}
        </text>
        <text x={x + w - h * 0.35} y={y + h / 2 + h * 0.12} textAnchor="end" fontFamily={font} fontWeight={600} fontSize={h * 0.3} fill={ink} fillOpacity={0.6} style={{fontVariantNumeric: 'tabular-nums'}}>
          {z.max >= 200 ? `${z.min}+` : `${z.min}-${z.max}`}
        </text>
      </g>
    );
  };

  // zone list geometry
  const zh = side ? Math.min(86 * u, (readRect.h * 0.44) / zs.length) : Math.min(80 * u, (zonesRect!.h - 40 * u) / Math.ceil(zs.length / 2));
  return (
    <AbsoluteFill style={{background: bg}}>
      <Svg>
        <Header box={box} ink={ink} fontFamily={font} frame={frame} startAt={startAt} />
        {/* monitor */}
        <g opacity={inT}>
          <rect x={plot.x} y={plot.y} width={plot.w} height={plot.h} rx={26 * u} fill={panel} />
          {gridLines}
          {pathOld && <path d={pathOld} fill="none" stroke={zColor} strokeOpacity={0.55} strokeWidth={4 * u} strokeLinejoin="round" strokeLinecap="round" />}
          {pathNew && <path d={pathNew} fill="none" stroke={zColor} strokeWidth={5 * u} strokeLinejoin="round" strokeLinecap="round" style={{filter: `drop-shadow(0 0 ${8 * u}px ${zColor})`}} />}
          <circle cx={xOf(head)} cy={headY} r={9 * u} fill={mixHex(zColor, '#ffffff', 0.6)} style={{filter: `drop-shadow(0 0 ${12 * u}px ${zColor})`}} />
        </g>
        {/* readout */}
        <g opacity={prog(frame, startAt + 6, startAt + 24)}>
          {(() => {
            const groupW = bigSize * 3.05;
            const gx0 = side ? readRect.x : readRect.x + (readRect.w - groupW) / 2;
            const cy = readRect.y + (side ? bigSize * 0.8 : readRect.h * 0.42);
            const S = bigSize * 0.4 * pulse;
            return (
              <>
                <g transform={`translate(${gx0 + bigSize * 0.58} ${cy - bigSize * 0.08}) scale(${S})`}>
                  <path d="M0,0.85 C-1.3,-0.05 -1,-0.95 -0.45,-0.95 C-0.15,-0.95 0,-0.7 0,-0.55 C0,-0.7 0.15,-0.95 0.45,-0.95 C1,-0.95 1.3,-0.05 0,0.85Z" fill={zColor} />
                </g>
                <text x={gx0 + bigSize * 1.3} y={cy + bigSize * 0.3} fontFamily={font} fontWeight={700} fontSize={bigSize} fill={ink} style={{fontVariantNumeric: 'tabular-nums'}}>
                  {Math.round(bpm)}
                </text>
                <text x={gx0 + (side ? 6 * u : 0)} y={cy + bigSize * 0.3 + bigSize * 0.36} fontFamily={font} fontWeight={700} fontSize={bigSize * 0.2} letterSpacing={bigSize * 0.03} fill={zColor}>
                  {unit} {'·'} {zone.label.toUpperCase()}
                </text>
              </>
            );
          })()}
        </g>
        {/* zones */}
        {side ? (
          <g>
            {zonesTitle ? (
              <text x={readRect.x + 4 * u} y={readRect.y + readRect.h * 0.5} fontFamily={font} fontWeight={600} fontSize={22 * u} letterSpacing={2 * u} fill={ink} fillOpacity={0.5} opacity={inT}>
                {zonesTitle.toUpperCase()}
              </text>
            ) : null}
            {zs.map((z, i) => zoneRow(z, i, readRect.x, readRect.y + readRect.h * 0.5 + 24 * u + i * zh, readRect.w, zh))}
          </g>
        ) : (
          <g>
            {zs.map((z, i) => {
              const cols = 2;
              const cw = (zonesRect!.w - 20 * u) / cols;
              return zoneRow(z, i, zonesRect!.x + (i % cols) * (cw + 20 * u), zonesRect!.y + 30 * u + Math.floor(i / cols) * zh, cw, zh);
            })}
            {zonesTitle ? (
              <text x={zonesRect!.x + 4 * u} y={zonesRect!.y + 8 * u} fontFamily={font} fontWeight={600} fontSize={22 * u} letterSpacing={2 * u} fill={ink} fillOpacity={0.5} opacity={inT}>
                {zonesTitle.toUpperCase()}
              </text>
            ) : null}
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const heartRateMonitor = defineMotion<Props>({
  id: 'heart-rate-monitor',
  title: 'Heart rate monitor',
  category: 'data',
  description:
    'A glowing ECG trace sweeps across a gridded monitor with the classic P-QRS-T beat while a large BPM number and a pulsing heart follow the rate as it climbs from rest to a peak and recovers; a zone list (rest / fat burn / cardio / peak) highlights the current zone and the trace colour follows it.',
  source: ['original round-3 vertical motion'],
  useFor:
    'Fitness trackers, smartwatch and health-app promos, workout recaps, medical or wellness explainers: show a live heart rate with training zones. Set the resting, peak and recovery BPM and your own zone names, ranges and colours.',
  durationInFrames: 240,
  defaultProps: {
    title: 'Live heart rate',
    subtitle: 'Warm-up to peak effort and recovery',
    unit: 'BPM',
    bpmStart: 68,
    bpmPeak: 168,
    bpmEnd: 104,
    zones: ZONES,
    zonesTitle: 'Heart rate zones',
    showGrid: true,
    background: '#0B1117',
    panel: '#131C25',
    ink: '#EAF1F7',
    accent: '#3DDC97',
    fontFamily: '',
    startAt: 4,
    speed: 1,
  },
  propDocs: {
    title: 'headline (empty = none)',
    subtitle: 'line under the headline (empty = none)',
    unit: 'unit text next to the zone name under the number',
    bpmStart: 'resting beats per minute at the start',
    bpmPeak: 'highest beats per minute (reached around the middle)',
    bpmEnd: 'beats per minute after recovery at the end',
    zones: 'zones [{label, min, max, color?}] low to high; the one containing the live BPM is highlighted and tints the trace',
    zonesTitle: 'small caption over the zone list (empty = none)',
    showGrid: 'draw the ECG-paper grid',
    background: 'page colour, or "transparent"',
    panel: 'monitor / zone chip colour',
    ink: 'text colour',
    accent: 'colour when a zone has none',
    fontFamily: 'CSS font family (empty = Space Grotesk)',
    startAt: 'frame the interface fades in',
    speed: 'speed multiplier for the BPM ramp',
  },
  component: HeartRateMonitor,
  tags: ['heart rate', 'ecg', 'ekg', 'bpm', 'pulse', 'heartbeat', 'monitor', 'health', 'fitness', 'wearable', 'smartwatch', 'zones', 'medical', 'vital signs', 'hud', 'overlay'],
});
