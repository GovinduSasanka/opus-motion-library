import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {DraftPaper, ISO, IsoBox, IsoPart, ValuePill, cl, easeOutBack, fitCamera, isoBounds, isoPt, lin, mixHex, x58Fonts, type PartKind, type PartSignals} from '../../core/r2-x58-kit';
import {around} from '../../core/r2-s2-kit';

/**
 * x8 isometric actuators that come alive when "running": an LED glows on/off (1 s period), a DC-motor fan ramps its
 * PWM 0 → 255 in steps of 5 every 40 ms and its blades turn into a motion-blur disc at speed, a servo horn sweeps
 * 0 → 180° at 12 ms/° with a live degree pill, a traffic light switches green / yellow / red by a distance
 * (> 30 cm green, 15-30 yellow, < 15 red) and a toy car drives back and forth along an iso axis with its ground ring
 * following. All values come from one shared signal clock so labels and hardware agree.
 */
type Props = {
  kinds: string[];
  labels: string[];
  speed: number;
  values: boolean;
  background: string;
  accent: string;
  startAt: number;
  stagger: number;
  grid: boolean;
  columns: number;
};

const DEFAULT_LABELS: Record<string, string> = {led: 'LED · pin 13', motor: 'DC motor · PWM', servo: 'Servo · 0-180°', trafficLight: 'Traffic light', car: 'Toy car'};

const CELL = 7.4;
const TILE = 5.4;

const motorDuty = (t: number) => {
  const p = t % 4.4;
  if (p < 2.04) return Math.min(255, Math.floor(p / 0.04) * 5) / 255;
  if (p < 3.0) return 1;
  if (p < 3.8) return Math.max(0, 1 - (p - 3.0) / 0.8);
  return 0;
};
const fanDegPerFrame = (duty: number) => 38 * Math.min(1, duty / 0.6);
const servoAngle = (t: number) => {
  const p = (t % 4.4) / 2.2;
  return p < 1 ? 180 * p : 180 * (2 - p);
};
const distanceCm = (t: number) => 32.5 + 27.5 * Math.cos((2 * Math.PI * t) / 7);
const carS = (t: number) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 3);

const IsoActuators: React.FC<Props> = ({kinds, labels, speed, values, background, accent, startAt, stagger, grid, columns}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const k = 40 * u;
  const n = Math.max(1, kinds.length);
  const cols = Math.max(1, Math.min(n, columns > 0 ? columns : portrait ? 2 : 3));
  const rows = Math.ceil(n / cols);
  const cellPos = (i: number) => ({cx: (i % cols) * CELL, cy: Math.floor(i / cols) * CELL});
  // camera fit to all tiles
  const boxes = kinds.map((_, i) => {
    const p = cellPos(i);
    return {x: p.cx, y: p.cy, z: 0, w: TILE, d: TILE, hgt: 3.2};
  });
  const hdr = h * 0.08;
  const cam = fitCamera(isoBounds(boxes, k), w * 0.03, hdr, w * 0.94, h - hdr - h * 0.05, 0.05, 0.3, 2.4);
  const tt = (Math.max(0, frame - startAt) / fps) * speed;
  const running = frame >= startAt;
  const order = kinds.map((_, i) => i).sort((a, b) => {
    const pa = cellPos(a);
    const pb = cellPos(b);
    return pa.cx + pa.cy - (pb.cx + pb.cy);
  });
  // integrated fan angle (deterministic)
  let fan = 0;
  const fanF = Math.floor(Math.max(0, frame - startAt) * speed);
  for (let i = 0; i < fanF; i++) fan += fanDegPerFrame(motorDuty(i / fps));
  const pillSize = Math.max(12 * u, k * 0.3);
  const pillAt = (cx: number, cy: number, z: number, text: string) => {
    const [px, py] = isoPt(cx, cy, z, k);
    const wd = text.length * pillSize * 0.62 + pillSize * 1.1;
    return <ValuePill x={px - wd / 2} y={py} text={text} size={pillSize} />;
  };

  return (
    <AbsoluteFill style={{background}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        {grid ? <DraftPaper id="ia-paper" w={w} h={h} u={u} k={k * 1.1} ox={cam.tx} oy={cam.ty} /> : <rect width={w} height={h} fill={background} />}
        <g transform={`translate(${cam.tx} ${cam.ty}) scale(${cam.scale})`}>
          {order.map((i) => {
            const kind = kinds[i];
            const {cx, cy} = cellPos(i);
            const st = 4 + i * stagger;
            const e = easeOutBack(lin(frame, st, st + 9), 1.2);
            if (frame < st) return null;
            const mx = cx + TILE / 2;
            const my = cy + TILE / 2;
            const [bx, by] = isoPt(mx, my, 0, k);
            const sig: PartSignals = {};
            let part: React.ReactNode = null;
            let pill = '';
            let pillZ = 3;
            let ground: React.ReactNode = null;
            if (kind === 'led') {
              const ph = tt % 1;
              const on = running ? cl(Math.min(ph / 0.06, (0.5 - ph) / 0.06 + 1)) * (ph < 0.5 ? 1 : 0) : 0;
              sig.led = ph < 0.5 && running ? Math.min(1, ph / 0.08 + 0.001) : 0;
              void on;
              part = <IsoPart kind="led" k={k} u={u} frame={frame} sig={sig} fp={[mx - 0.5, my - 0.5, 1, 1, 1.5]} />;
              pill = sig.led && sig.led > 0 ? 'HIGH' : 'LOW';
              pillZ = 3;
            } else if (kind === 'motor') {
              const duty = running ? motorDuty(tt) : 0;
              sig.fan = fan;
              sig.fanSpeed = duty;
              part = <IsoPart kind="motor" k={k} u={u} frame={frame} sig={sig} fp={[mx - 1.2, my - 0.8, 2.4, 1.6, 1.3]} />;
              pill = `PWM ${Math.round(duty * 255)}`;
              pillZ = 3.4;
            } else if (kind === 'servo') {
              const a = running ? servoAngle(tt) : 90;
              sig.servo = a;
              part = <IsoPart kind="servo" k={k} u={u} frame={frame} sig={sig} fp={[mx - 1.0, my - 1.6, 2, 3.2, 1.6]} />;
              pill = `${Math.round(a)}°`;
              pillZ = 4.3;
            } else if (kind === 'trafficLight') {
              const d = running ? distanceCm(tt) : 60;
              sig.light = d > 30 ? 'green' : d > 15 ? 'yellow' : 'red';
              part = <IsoPart kind="light" k={k} u={u} frame={frame} sig={sig} fp={[mx - 0.5, my - 0.5, 1, 1, 2.6]} />;
              pill = `${Math.round(d)} cm`;
              pillZ = 4.3;
            } else if (kind === 'car') {
              const s = running ? carS(tt) : 0.5;
              const ox = -1.4 + 2.8 * s;
              part = <IsoPart kind="car" k={k} u={u} frame={frame} sig={sig} fp={[mx - 1.1 + ox, my - 0.6, 2.2, 1.2, 0.9]} />;
              const [gx, gy] = isoPt(mx + ox, my, 0.02, k);
              ground = (
                <g fill="none" stroke={accent}>
                  <ellipse cx={gx} cy={gy} rx={k * 1.9} ry={k * 0.95} strokeWidth={k * 0.06} opacity={0.75} />
                  <ellipse cx={gx} cy={gy} rx={k * 2.3} ry={k * 1.15} strokeWidth={k * 0.045} opacity={0.4} />
                </g>
              );
              pill = `x ${(ox >= 0 ? '+' : '-') + Math.abs(Math.round(ox * 12)).toString().padStart(2, '0')}`;
              pillZ = 2.6;
            } else {
              const def = kind as PartKind;
              part = <IsoPart kind={def} k={k} u={u} frame={frame} fp={[mx - 1, my - 0.8, 2, 1.6, 1.4]} />;
            }
            const node = (
              <g>
                <IsoBox x={cx} y={cy} z={0} w={TILE} d={TILE} hgt={0.14} k={k} color="#F2EAD8" top="#F8F2E4" right="#D9CDB4" sw={k * 0.04} />
                {ground}
                {part}
                {values && pill ? pillAt(mx, my, pillZ, pill) : null}
              </g>
            );
            const [lx, ly] = isoPt(cx + TILE * 0.5, cy + TILE * 0.93, 0.15, k);
            const label = labels[i] ?? DEFAULT_LABELS[kind] ?? kind;
            return (
              <g key={i}>
                {around(bx, by, Math.max(0.01, 0.15 + 0.85 * e), Math.min(1, e * 2), node)}
                <text x={lx} y={ly} textAnchor="middle" fontFamily={x58Fonts.barlowSC} fontWeight={700} fontSize={k * 0.42} letterSpacing={k * 0.04} fill={ISO.muted} opacity={Math.min(1, e)}>
                  {label.toUpperCase()}
                </text>
              </g>
            );
          })}
        </g>
        <g transform={`translate(${w * 0.03} ${h * 0.045})`}>
          <circle r={7 * u} cx={0} cy={0} fill={running ? mixHex('#E0352C', '#FF8A7A', 0.5 + 0.5 * Math.sin(frame * 0.35)) : '#9C9488'} />
          <text x={16 * u} y={6 * u} fontFamily={x58Fonts.mono} fontSize={16 * u} fill={ISO.text} letterSpacing={2 * u}>
            {running ? 'RUNNING' : 'READY'}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const isoActuators = defineMotion<Props>({
  id: 'iso-actuators',
  title: 'Iso actuators',
  category: 'ui',
  description:
    'Small isometric hardware tiles that come alive when running: an LED blinking with a glow, a DC-motor fan ramping its PWM until the blades blur into a disc, a servo horn sweeping with a live degree pill, a traffic light switching green / yellow / red by a distance reading, and a toy car driving back and forth with its ground ring following.',
  source: ['video x8 0:01.9-0:04.2, 0:20.75-0:29, 0:30.9-0:37.9, 0:38.7-0:53.7'],
  useFor: 'IoT / maker / robotics content, "the code drives the hardware" explanations, playful product UIs; pair with circuit-rebuild or code-run-sync.',
  durationInFrames: 180,
  defaultProps: {
    kinds: ['led', 'motor', 'servo', 'trafficLight', 'car'],
    labels: [],
    speed: 1,
    values: true,
    background: ISO.paper,
    accent: ISO.teal,
    startAt: 24,
    stagger: 5,
    grid: true,
    columns: 0,
  },
  propDocs: {
    kinds: "actuator tiles in order: 'led' | 'motor' | 'servo' | 'trafficLight' | 'car' (any other part kind just sits on a tile)",
    labels: 'optional tile label per kind (default per-kind captions)',
    speed: 'signal clock multiplier',
    values: 'show the live value pills (HIGH/LOW, PWM, degrees, cm, position)',
    background: 'paper colour',
    accent: 'ground ring / accent colour',
    startAt: 'frame the hardware starts running',
    stagger: 'frames between tiles popping in',
    grid: 'draw the isometric drafting-paper grid',
    columns: 'tile columns (0 = auto: 3 landscape, 2 portrait)',
  },
  component: IsoActuators,
  tags: ['isometric', 'iso', 'hardware', 'led', 'motor', 'fan', 'servo', 'traffic-light', 'car', 'iot', 'maker', 'robotics', 'arduino', 'actuator', 'pwm', 'live-values', 'drafting-paper', 'electronics'],
});
