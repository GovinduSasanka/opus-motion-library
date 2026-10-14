import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {BP, GlowDot, HatchGear, IconKind, LineIcon, RadialPlan, ScanlineBg, circlePath, draw, gearPath, tickRing} from '../../core/hud-kit';
import {Svg, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video19 13.35-14.40 era-dial-counter: a gear-ringed dial (120 saw teeth, tick band, glyph markers,
 * orbiting knob) snaps in from its window, then for every era the dial turns a notch
 * (easeInOutCubic 0.25 s), the date plate rolls (old value up, new from below, 0.15 s) and the
 * centre illustration swaps. Hatched grey gears turn slowly behind (+-6 deg/s).
 */
type Era = {label: string; year: string; icon?: IconKind};
type Props = {
  background: string;
  eras: Era[];
  stepFrames: number;
  stepAngle: number;
  accent: string;
  line: string;
  gears: boolean;
  showLabels: boolean;
};

const DEFAULT_ICONS: IconKind[] = ['plan', 'press', 'book', 'computer', 'monitor', 'network'];
const GLYPHS = ['K', 'Δ', 'Ξ', 'Θ', 'O', 'K', '▽', 'Ξ', 'Δ', 'ϴ', '◁', 'Ξ'];
const easeCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const EraDial: React.FC<Props> = ({background, eras, stepFrames, stepAngle, accent, line, gears, showLabels}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const n = Math.max(1, eras.length);
  const Rd = Math.min(w, h) * (portrait ? 0.43 : 0.43);
  const Rw = Rd * 0.55;
  const t0 = 26;
  const stepAt = (k: number) => t0 + k * stepFrames;
  // current era index + step progress
  let idx = 0;
  for (let k = 1; k < n; k++) if (frame >= stepAt(k)) idx = k;
  const stepT = idx > 0 ? clamp((frame - stepAt(idx)) / 8) : 1;
  let rot = 0;
  for (let k = 1; k < n; k++) rot += stepAngle * easeCubic(clamp((frame - stepAt(k)) / 8));
  rot += Math.sin(frame * 0.05) * 0.4;

  // entrance: snap zoom-out from the window
  const enter = prog(frame, 0, 16, ease.expoOut);
  const zoom = 1 + (Rd / Rw - 1) * (1 - enter) * 0.85;
  const drawT = prog(frame, 2, 24, ease.out);
  const flash = idx > 0 ? Math.max(0, 1 - (frame - stepAt(idx)) / 10) : Math.max(0, 1 - frame / 14);

  const era = eras[idx] ?? {label: '', year: ''};
  const prev = idx > 0 ? eras[idx - 1] : undefined;
  const icon = (i: number): IconKind => eras[i]?.icon ?? DEFAULT_ICONS[i % DEFAULT_ICONS.length];

  const renderIcon = (k: IconKind, id: string) =>
    k === 'plan' ? (
      <RadialPlan id={id} cx={cx} cy={cy} r={Rw * 0.93} seed={11} rings={3} rotate={frame * 0.1} flow={frame} line={line} blue={accent} u={u * 0.8} />
    ) : (
      <LineIcon kind={k} id={id} x={cx} y={cy} s={Rw * 0.7} sw={1.6 * u} line={line} accent={accent} t={frame} />
    );

  const plateW = Math.max(150, Math.max(...eras.map((e) => e.year.length)) * 22 + 50) * u;
  const plateH = 48 * u;
  const plateY = cy + Rd * 0.64;
  const roll = idx > 0 ? ease.out(clamp((frame - stepAt(idx)) / 5)) : 1;
  const fs = 30 * u;

  const gearSet = portrait
    ? [
        [0.08, 0.1, 0.22, 1],
        [0.95, 0.16, 0.18, -1],
        [0.0, 0.86, 0.25, -1],
        [0.92, 0.92, 0.24, 1],
        [0.55, -0.02, 0.12, -1],
      ]
    : [
        [0.15, 0.22, 0.17, 1],
        [0.87, 0.2, 0.15, -1],
        [0.08, 0.98, 0.24, -1],
        [0.88, 0.85, 0.2, 1],
        [0.99, 0.0, 0.12, -1],
      ];

  return (
    <AbsoluteFill style={{background}}>
      <ScanlineBg />
      <Svg>
        {gears &&
          gearSet.map(([gx, gy, gr, dir], i) => (
            <g key={i} opacity={0.85 * prog(frame, 0, 18)}>
              <HatchGear id={`era-g${i}`} cx={gx * w} cy={gy * h} R={gr * Math.min(w, h) * 1.6} teeth={22 + i * 6} rotate={(dir * frame * 6) / 30 + i * 13} u={u} color="#3E3F46" />
            </g>
          ))}
        <g transform={`translate(${cx},${cy}) scale(${zoom}) translate(${-cx},${-cy})`}>
          {/* dark disc so gears do not show through */}
          <circle cx={cx} cy={cy} r={Rd * 1.04} fill={background} />
          {/* rotating dial */}
          <g transform={`translate(${cx},${cy}) rotate(${rot})`}>
            <path d={gearPath(Rd * 1.0, 120, 20 * u * Math.min(1, Rd / (430 * u)))} fill="none" stroke={line} strokeOpacity={0.85} strokeWidth={1.3 * u} opacity={drawT} />
            <path d={circlePath(Rd * 0.985)} fill="none" stroke={line} strokeWidth={2.2 * u} {...draw(drawT)} />
            <path d={circlePath(Rd * 0.95)} fill="none" stroke={line} strokeOpacity={0.9} strokeWidth={1.5 * u} {...draw(drawT)} />
            <path d={circlePath(Rd * 0.905)} fill="none" stroke={line} strokeOpacity={0.6} strokeWidth={1.2 * u} {...draw(drawT)} />
            <path d={tickRing(72, Rd * 0.905, Rd * 0.95, 6, 0)} stroke={line} strokeOpacity={0.45} strokeWidth={1 * u} opacity={drawT} />
            {Array.from({length: 12}, (_, i) => {
              const a = (i / 12) * Math.PI * 2 + 0.2;
              return <line key={i} x1={Math.cos(a) * Rd * 0.905} y1={Math.sin(a) * Rd * 0.905} x2={Math.cos(a) * Rd * 0.985} y2={Math.sin(a) * Rd * 0.985} stroke={line} strokeWidth={2.4 * u} opacity={drawT} />;
            })}
            {GLYPHS.map((g, i) => {
              const a = (i / GLYPHS.length) * Math.PI * 2 + 0.26;
              const rr = Rd * 0.81;
              return (
                <text key={i} x={Math.cos(a) * rr} y={Math.sin(a) * rr} transform={`rotate(${(a * 180) / Math.PI + 90},${Math.cos(a) * rr},${Math.sin(a) * rr})`} textAnchor="middle" dominantBaseline="central" fill={line} fontFamily={fonts.mono} fontSize={26 * u} opacity={0.85 * prog(frame, 8 + i, 14 + i)}>
                  {g}
                </text>
              );
            })}
            <path d={circlePath(Rd * 0.7)} fill="none" stroke={line} strokeOpacity={0.55} strokeWidth={1.2 * u} {...draw(drawT)} />
            <path d={tickRing(120, Rd * 0.67, Rd * 0.7, 10, 6 * u)} stroke={line} strokeOpacity={0.4} strokeWidth={1 * u} opacity={drawT} />
            {Array.from({length: 16}, (_, i) => {
              const a = (i / 16) * Math.PI * 2;
              return <line key={i} x1={Math.cos(a) * Rw * 1.02} y1={Math.sin(a) * Rw * 1.02} x2={Math.cos(a) * Rd * 0.67} y2={Math.sin(a) * Rd * 0.67} stroke={line} strokeOpacity={0.12} strokeWidth={1 * u} />;
            })}
          </g>
          {/* orbiting knob */}
          {(() => {
            const a = ((-130 + rot * 1.4 + frame * 0.6) * Math.PI) / 180;
            const kx = cx + Math.cos(a) * Rd * 0.8;
            const ky = cy + Math.sin(a) * Rd * 0.8;
            return (
              <g opacity={drawT}>
                <line x1={cx + Math.cos(a) * Rd * 0.94} y1={cy + Math.sin(a) * Rd * 0.94} x2={cx + Math.cos(a) * Rw * 1.05} y2={cy + Math.sin(a) * Rw * 1.05} stroke={line} strokeOpacity={0.7} strokeWidth={1.2 * u} />
                <circle cx={kx} cy={ky} r={17 * u} fill={background} stroke={line} strokeWidth={1.5 * u} />
                <circle cx={kx} cy={ky} r={11 * u} fill="none" stroke={line} strokeOpacity={0.6} strokeWidth={u} strokeDasharray={`${2 * u} ${2 * u}`} />
                <circle cx={kx} cy={ky} r={3 * u} fill={line} />
              </g>
            );
          })()}
          {/* fixed index pointer */}
          <path d={`M${cx - 11 * u} ${cy - Rd * 1.09} L${cx + 11 * u} ${cy - Rd * 1.09} L${cx} ${cy - Rd * 1.035} Z`} fill={accent} opacity={drawT} />
          {/* window */}
          <circle cx={cx} cy={cy} r={Rw} fill={background} stroke={line} strokeWidth={2 * u} />
          <circle cx={cx} cy={cy} r={Rw * 1.04} fill="none" stroke={accent} strokeWidth={(2 + 4 * flash) * u} strokeOpacity={0.35 + 0.65 * flash} />
          <circle cx={cx} cy={cy} r={Rw * 1.04} fill="none" stroke={accent} strokeWidth={14 * u} strokeOpacity={0.18 * flash} />
          <defs>
            <clipPath id="era-win">
              <circle cx={cx} cy={cy} r={Rw * 0.985} />
            </clipPath>
          </defs>
          <g clipPath="url(#era-win)">
            {prev && stepT < 1 && (
              <g opacity={1 - stepT} transform={`translate(${cx},${cy}) scale(${1 + 0.25 * stepT}) translate(${-cx},${-cy})`}>
                {renderIcon(icon(idx - 1), 'era-ip')}
              </g>
            )}
            <g opacity={idx > 0 ? clamp(stepT * 1.4) : prog(frame, 6, 18)} transform={`translate(${cx},${cy}) scale(${0.82 + 0.18 * ease.out(stepT)}) translate(${-cx},${-cy})`}>
              {renderIcon(icon(idx), 'era-ic')}
            </g>
          </g>
          {/* era label inside the band */}
          {showLabels && (
            <text x={cx + 0.15 * 17 * u} y={cy - Rw - 28 * u} textAnchor="middle" fill={line} fillOpacity={0.75 * (idx > 0 ? clamp(stepT * 2) : prog(frame, 14, 22))} fontFamily={fonts.mono} fontSize={17 * u} letterSpacing={17 * u * 0.3}>
              {era.label.toUpperCase()}
            </text>
          )}
          {/* date plate with rolling counter */}
          <g opacity={prog(frame, 10, 20)}>
            <defs>
              <clipPath id="era-plate">
                <rect x={cx - plateW / 2} y={plateY - plateH / 2} width={plateW} height={plateH} rx={6 * u} />
              </clipPath>
            </defs>
            <rect x={cx - plateW / 2} y={plateY - plateH / 2} width={plateW} height={plateH} rx={6 * u} fill={background} stroke={line} strokeWidth={1.6 * u} />
            <rect x={cx - plateW / 2 + 5 * u} y={plateY - plateH / 2 + 5 * u} width={plateW - 10 * u} height={plateH - 10 * u} rx={3 * u} fill="none" stroke={line} strokeOpacity={0.35} strokeWidth={u} />
            <g clipPath="url(#era-plate)">
              {prev && roll < 1 && (
                <text x={cx} y={plateY + fs * 0.36 - roll * plateH} textAnchor="middle" fill={line} opacity={1 - roll} fontFamily={fonts.mono} fontWeight={700} fontSize={fs} letterSpacing={fs * 0.12}>
                  {prev.year}
                </text>
              )}
              <text x={cx} y={plateY + fs * 0.36 + (1 - roll) * plateH} textAnchor="middle" fill={line} fontFamily={fonts.mono} fontWeight={700} fontSize={fs} letterSpacing={fs * 0.12}>
                {era.year}
              </text>
            </g>
          </g>
          <GlowDot id="era-dot" x={cx} y={cy + Rw * 0.86} r={5 * u} boost={0.8 + flash} />
        </g>
        {/* era progress pips under the dial */}
        <g opacity={prog(frame, 14, 24)}>
          {eras.map((_, i) => {
            const px = cx + (i - (n - 1) / 2) * 26 * u;
            const py = Math.min(h - 40 * u, cy + Rd * 1.0 + (portrait ? 90 : 0) * u + (portrait ? 0 : 40 * u));
            return <rect key={i} x={px - 5 * u} y={py - 5 * u} width={10 * u} height={10 * u} fill={i <= idx ? accent : 'none'} stroke={i <= idx ? accent : line} strokeOpacity={i <= idx ? 1 : 0.5} strokeWidth={1.2 * u} />;
          })}
        </g>
      </Svg>
      <Vignette strength={0.6} />
    </AbsoluteFill>
  );
};

export const eraDial = defineMotion<Props>({
  id: 'era-dial',
  title: 'Era dial counter',
  category: 'hud',
  description: 'Gear-ringed blueprint dial that turns a notch per era while the date plate rolls and the centre line-art illustration swaps (plan, press, book, computer, monitor, network).',
  source: ['video19 13.35-14.40 (era-dial-counter)'],
  useFor: 'History / timeline beats: step through years or versions with a mechanical, technical feel.',
  durationInFrames: 240,
  defaultProps: {
    background: BP.bg,
    eras: [
      {label: 'Library', year: '300 BC'},
      {label: 'Printing press', year: '1450'},
      {label: 'Public library', year: '1650'},
      {label: 'ENIAC', year: '1946'},
      {label: 'Personal screen', year: '2007'},
      {label: 'Network', year: 'TODAY'},
    ],
    stepFrames: 34,
    stepAngle: -30,
    accent: BP.blue,
    line: BP.line,
    gears: true,
    showLabels: true,
  },
  propDocs: {
    eras: 'list of {label, year, icon?}; icon one of plan|press|book|computer|monitor|network|scroll|build|inspect|ask|teach (defaults cycle)',
    stepFrames: 'frames between era steps',
    stepAngle: 'degrees the dial turns per step',
    gears: 'hatched background gears',
    showLabels: 'show the era label above the window',
  },
  component: EraDial,
  tags: ['timeline', 'dial', 'history', 'counter', 'blueprint', 'years'],
});
