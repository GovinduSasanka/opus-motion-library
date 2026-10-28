import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {BP, GlowDot, RadialPlan, ScanlineBg, circlePath, gearPath, sstep, tickRing} from '../../core/hud-kit';
import {Svg, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video19 11.05-11.75 powers-of-ten-pullback (+ snap-zoom-reveal): one continuous camera move
 * through nested line drawings. Each level is a separate drawing sitting exactly in the centre
 * hole of the next one (scale ratio per level). Camera log-scale is interpolated, layers are
 * culled below 2 px / above the frame and their fine detail fades in past ~300 px (LOD).
 * mode "snap" holds on each level and snaps between them with easeOutExpo.
 */
type Kind = 'word' | 'badge' | 'radar' | 'plan' | 'dial' | 'network';
type Level = {label: string; kind?: Kind};
type Props = {
  background: string;
  levels: Level[];
  direction: 'out' | 'in';
  mode: 'continuous' | 'snap';
  ratio: number;
  accent: string;
  line: string;
  hud: boolean;
  /** continuous-mode easing of the log-scale move (EXTENDS r2): sine (default) | linear | inOut | expo */
  easing: 'sine' | 'linear' | 'inOut' | 'expo';
  /** total camera roll in degrees over the move (orbit-dive look); 0 = none */
  camRoll: number;
  /** frame range fraction kept at the start as a still hold (0..0.4) */
  holdStart: number;
  scaleLabel: string;
};

const DEFAULT_KINDS: Kind[] = ['word', 'badge', 'radar', 'plan', 'dial', 'network'];

const LevelArt: React.FC<{kind: Kind; label: string; x: number; y: number; R: number; hole: number; detail: number; frame: number; u: number; i: number; accent: string; line: string; bg: string}> = ({kind, label, x, y, R, hole, detail, frame, u, i, accent, line, bg}) => {
  const rot = ((i % 2 ? -1 : 1) * frame * 3) / 30;
  const sw = 1.3 * u;
  const capFs = R * 0.055;
  const caption =
    kind !== 'word' && capFs > 7 * u ? (
      <g opacity={sstep(7 * u, 14 * u, capFs) * (1 - sstep(60 * u, 140 * u, capFs))}>
        <rect x={x - label.length * capFs * 0.45 - capFs} y={y + R * 1.09 - capFs * 1.1} width={label.length * capFs * 0.9 + capFs * 2} height={capFs * 1.6} fill={bg} stroke={line} strokeOpacity={0.4} strokeWidth={sw} />
        <text x={x + capFs * 0.15} y={y + R * 1.09 + capFs * 0.3} textAnchor="middle" fill={line} fontFamily={fonts.mono} fontSize={capFs} letterSpacing={capFs * 0.3}>
          {label.toUpperCase()}
        </text>
      </g>
    ) : null;
  switch (kind) {
    case 'word': {
      const fs = Math.min(R * 0.55, (R * 1.7) / Math.max(2, label.length * 0.62));
      return (
        <g>
          <text x={x + 2 * u} y={y + fs * 0.36 + 2 * u} textAnchor="middle" fill="#000" fillOpacity={0.6} fontFamily={fonts.mono} fontWeight={700} fontSize={fs}>
            {label}
          </text>
          <text x={x} y={y + fs * 0.36} textAnchor="middle" fill={BP.line} fontFamily={fonts.mono} fontWeight={700} fontSize={fs}>
            {label}
          </text>
          <g opacity={detail}>
            <line x1={x - R * 0.3} y1={y + R * 0.5} x2={x + R * 0.3} y2={y + R * 0.5} stroke={line} strokeOpacity={0.6} strokeWidth={sw} />
            <circle cx={x - R * 0.3} cy={y + R * 0.5} r={R * 0.035} fill={bg} stroke={line} strokeWidth={sw} />
            <circle cx={x + R * 0.3} cy={y + R * 0.5} r={R * 0.035} fill={bg} stroke={line} strokeWidth={sw} />
            <circle cx={x} cy={y + R * 0.5} r={R * 0.045} fill={accent} />
          </g>
        </g>
      );
    }
    case 'badge':
      return (
        <g>
          <g transform={`translate(${x},${y}) rotate(${rot})`}>
            <path d={circlePath(R)} fill={bg} stroke={line} strokeWidth={sw * 1.6} />
            <path d={circlePath(R * 0.93)} fill="none" stroke={line} strokeOpacity={0.6} strokeWidth={sw} />
            <path d={tickRing(90, R * 0.84, R * 0.9, 5, R * 0.03)} stroke={line} strokeOpacity={0.5 * detail} strokeWidth={sw * 0.8} />
            <path d={circlePath(R * 0.72)} fill="none" stroke={line} strokeOpacity={0.4} strokeWidth={sw} strokeDasharray={`${3 * u} ${5 * u}`} />
            {[0, 1, 2, 3].map((k) => {
              const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
              return <circle key={k} cx={Math.cos(a) * R * 0.78} cy={Math.sin(a) * R * 0.78} r={R * 0.025} fill={k === 0 ? accent : line} />;
            })}
            <path d={circlePath(hole * 1.05)} fill="none" stroke={accent} strokeWidth={sw * 1.5} />
          </g>
          {caption}
        </g>
      );
    case 'radar':
      return (
        <g>
          <g transform={`translate(${x},${y}) rotate(${rot})`}>
            {[0.4, 0.55, 0.7, 0.85, 1].map((k, j) => (
              <path key={j} d={circlePath(R * k)} fill="none" stroke={j === 4 ? accent : BP.steel} strokeOpacity={j === 4 ? 1 : 0.8} strokeWidth={j === 4 ? sw * 2.2 : sw} />
            ))}
            {Array.from({length: 12}, (_, k) => {
              const a = (k / 12) * Math.PI * 2;
              const blue = k % 3 === 0;
              return <line key={k} x1={Math.cos(a) * hole * 1.05} y1={Math.sin(a) * hole * 1.05} x2={Math.cos(a) * R} y2={Math.sin(a) * R} stroke={blue ? accent : BP.steel} strokeOpacity={blue ? 1 : 0.6} strokeWidth={blue ? sw * 2 : sw} />;
            })}
            <path d={tickRing(120, R * 0.97, R, 10, R * 0.02)} stroke={line} strokeOpacity={0.4 * detail} strokeWidth={sw * 0.8} />
            {Array.from({length: 10}, (_, k) => {
              const a = (k / 10) * Math.PI * 2 + 0.4;
              const rr = R * (0.45 + ((k * 37) % 50) / 100);
              return <circle key={k} cx={Math.cos(a) * rr} cy={Math.sin(a) * rr} r={R * 0.012} fill={line} opacity={detail} />;
            })}
          </g>
          {caption}
        </g>
      );
    case 'plan':
      return (
        <g>
          <RadialPlan id={`p10-plan${i}`} cx={x} cy={y} r={R} seed={7 + i} rings={4} hub={0} detail={detail} rotate={rot} flow={frame} line={line} blue={accent} u={u} />
          <path d={`M${x} ${y}m${-hole * 1.05} 0a${hole * 1.05} ${hole * 1.05} 0 1 0 ${hole * 2.1} 0a${hole * 1.05} ${hole * 1.05} 0 1 0 ${-hole * 2.1} 0`} fill="none" stroke={accent} strokeWidth={sw * 2} />
          {caption}
        </g>
      );
    case 'dial':
      return (
        <g>
          <g transform={`translate(${x},${y}) rotate(${rot})`}>
            <path d={gearPath(R * 0.95, 120, R * 0.045)} fill="none" stroke={line} strokeOpacity={0.85} strokeWidth={sw} />
            <path d={circlePath(R * 0.94)} fill={bg} stroke={line} strokeWidth={sw * 1.6} />
            <path d={circlePath(R * 0.86)} fill="none" stroke={line} strokeOpacity={0.6} strokeWidth={sw} />
            <path d={tickRing(72, R * 0.86, R * 0.92, 6, 0)} stroke={line} strokeOpacity={0.45 * detail} strokeWidth={sw * 0.8} />
            {['K', 'Δ', 'Ξ', 'Θ', 'O', 'Δ', 'K', 'Ξ'].map((g, k) => {
              const a = (k / 8) * Math.PI * 2 + 0.3;
              const rr = R * 0.75;
              return (
                <text key={k} x={Math.cos(a) * rr} y={Math.sin(a) * rr} textAnchor="middle" dominantBaseline="central" fill={line} opacity={detail} fontFamily={fonts.mono} fontSize={R * 0.06} transform={`rotate(${(a * 180) / Math.PI + 90},${Math.cos(a) * rr},${Math.sin(a) * rr})`}>
                  {g}
                </text>
              );
            })}
            <path d={circlePath(R * 0.62)} fill="none" stroke={line} strokeOpacity={0.5} strokeWidth={sw} />
            <path d={circlePath(hole * 1.05)} fill="none" stroke={accent} strokeWidth={sw * 1.6} />
          </g>
          {caption}
        </g>
      );
    case 'network':
    default:
      return (
        <g>
          <g transform={`translate(${x},${y}) rotate(${rot})`}>
            {[0.35, 0.5, 0.65, 0.82, 1].map((k, j) => (
              <path key={j} d={circlePath(R * k)} fill="none" stroke={line} strokeOpacity={0.3} strokeWidth={sw} />
            ))}
            {Array.from({length: 8}, (_, k) => {
              const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
              return (
                <g key={k}>
                  <line x1={Math.cos(a) * hole * 1.05} y1={Math.sin(a) * hole * 1.05} x2={Math.cos(a) * R} y2={Math.sin(a) * R} stroke={accent} strokeWidth={sw * 1.6} />
                  {[0, 1, 2].map((m) => {
                    const span = R - hole * 1.05;
                    const rr = hole * 1.05 + (((frame * 0.006 + m / 3 + k * 0.11) % 1) * span);
                    return <circle key={m} cx={Math.cos(a) * rr} cy={Math.sin(a) * rr} r={R * 0.014} fill={accent} />;
                  })}
                </g>
              );
            })}
            {[0, 1, 2, 3].map((k) => {
              const a = (k / 4) * Math.PI * 2;
              const bx = Math.cos(a) * R * 0.66;
              const by = Math.sin(a) * R * 0.66;
              return (
                <g key={k} opacity={detail}>
                  <circle cx={bx} cy={by} r={R * 0.07} fill={bg} stroke={line} strokeWidth={sw} />
                  <circle cx={bx} cy={by} r={R * 0.05} fill="none" stroke={line} strokeOpacity={0.6} strokeWidth={sw} strokeDasharray={`${2 * u} ${3 * u}`} />
                </g>
              );
            })}
          </g>
          {caption}
        </g>
      );
  }
};

const PowersOfTen: React.FC<Props> = ({background, levels, direction, mode, ratio, accent, line, hud, easing, camRoll, holdStart, scaleLabel = 'SCALE'}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, durationInFrames: D, portrait} = useStage();
  const S = Math.min(w, h);
  const L = Math.max(1, levels.length);
  const rr = Math.max(1.5, ratio);
  // camera level c (0 = innermost fills frame)
  let c: number;
  if (mode === 'snap') {
    const hold = (D - 24) / L;
    const k = Math.floor(clamp((frame - 12) / hold, 0, L - 1));
    const within = frame - 12 - k * hold;
    const snap = within > hold - 16 ? prog(within, hold - 16, hold - 2, ease.expoOut) : 0;
    c = Math.min(L - 1, k + (k < L - 1 ? snap : 0));
  } else {
    c = (L - 1) * prog(frame, 12 + Math.round(holdStart * D), D - 14, easing === 'linear' ? ease.linear : easing === 'inOut' ? ease.inOut : easing === 'expo' ? ease.expoInOut : ease.sine);
  }
  if (direction === 'in') c = L - 1 - c;
  const R0 = S * (portrait ? 0.4 : 0.4);
  const hq = portrait ? 1.7 : 1; // portrait: bigger HUD text
  const levelR = (k: number) => R0 * Math.pow(rr, k - c);
  const diag = Math.hypot(w, h) / 2;
  const enter = prog(frame, 0, 12);
  const current = Math.round(c);
  const scale = Math.pow(rr, c);
  const rowH = 34 * u * (portrait ? 1.5 : 1);
  const listY = portrait ? 100 * u + ((L - 1) / 2) * rowH : h / 2;

  return (
    <AbsoluteFill style={{background}}>
      <ScanlineBg />
      <Svg>
        <g opacity={enter} transform={camRoll ? `rotate(${(camRoll * c) / Math.max(1, L - 1) * (direction === 'in' ? -1 : 1)} ${cx} ${cy})` : undefined}>
          {/* outermost first so inner drawings sit on top of the holes */}
          {levels
            .map((lv, k) => ({lv, k}))
            .reverse()
            .map(({lv, k}) => {
              const R = levelR(k);
              const hole = R / rr;
              if (R < 2 * u || hole > diag * 1.3) return null;
              const kind = lv.kind ?? DEFAULT_KINDS[k % DEFAULT_KINDS.length];
              const detail = sstep(80 * u, 300 * u, R);
              const o = sstep(2 * u, 40 * u, R) * (1 - sstep(diag * 0.9, diag * 1.3, hole));
              return (
                <g key={k} opacity={o}>
                  {k > 0 && <circle cx={cx} cy={cy} r={hole * 0.98} fill={background} />}
                  <LevelArt kind={kind} label={lv.label} x={cx} y={cy} R={R} hole={hole} detail={detail} frame={frame} u={u} i={k} accent={accent} line={line} bg={background} />
                </g>
              );
            })}
          <GlowDot id="p10-dot" x={cx} y={cy + (levels[0] && (levels[0].kind ?? 'word') === 'word' ? levelR(0) * 0.5 : 0)} r={Math.max(3 * u, Math.min(7 * u, levelR(0) * 0.03))} boost={0.9} />
        </g>
        {hud && (
          <g opacity={prog(frame, 6, 18)} fontFamily={fonts.mono}>
            <text x={48 * u} y={h - 52 * u * hq} fill={line} fillOpacity={0.55} fontSize={15 * u * hq} letterSpacing={15 * u * hq * 0.25}>
              {scaleLabel}
            </text>
            <text x={48 * u} y={h - 24 * u * (portrait ? 1.8 : 1)} fill={line} fontSize={24 * u * hq} fontWeight={700} letterSpacing={24 * u * hq * 0.08}>
              {`×${scale < 10 ? scale.toFixed(2) : scale.toFixed(1)}`}
            </text>
            {levels.map((lv, k) => {
              const on = k === current;
              const y = listY + (k - (L - 1) / 2) * rowH;
              const x = w - 48 * u;
              return (
                <g key={k}>
                  <text x={x - 24 * u} y={y + 5 * u * hq} textAnchor="end" fill={on ? accent : line} fillOpacity={on ? 1 : 0.4} fontSize={14 * u * hq} letterSpacing={14 * u * hq * 0.25} fontWeight={on ? 700 : 400}>
                    {`${String(k + 1).padStart(2, '0')} ${lv.label.toUpperCase()}`}
                  </text>
                  <rect x={x - 12 * u} y={y - 1 * u} width={on ? 22 * u : 10 * u} height={2 * u} fill={on ? accent : line} opacity={on ? 1 : 0.4} />
                </g>
              );
            })}
            <line x1={w - 36 * u} y1={listY - ((L - 1) / 2) * rowH - 20 * u} x2={w - 36 * u} y2={listY + ((L - 1) / 2) * rowH + 20 * u} stroke={line} strokeOpacity={0.3} strokeWidth={u} />
          </g>
        )}
      </Svg>
      <Vignette strength={0.6} />
    </AbsoluteFill>
  );
};

export const powersOfTen = defineMotion<Props>({
  id: 'powers-of-ten',
  title: 'Powers-of-ten zoom',
  category: 'hud',
  description: 'Continuous exponential pull-back (or push-in) through nested blueprint drawings — word, badge, radar, library plan, dial, network — with level-of-detail fading and a scale readout; snap mode jumps level to level.',
  source: ['video19 11.05-11.75 (powers-of-ten-pullback)', 'video19 0.5-0.9, 2.3-2.7, 17.6-18.0 (snap-zoom-reveal)'],
  useFor: 'Show how a small thing sits inside ever bigger systems (or dive the other way), in one continuous move.',
  durationInFrames: 240,
  defaultProps: {
    background: BP.bg,
    levels: [{label: 'CLEAR.'}, {label: 'Idea'}, {label: 'Signal'}, {label: 'Library'}, {label: 'Archive'}, {label: 'Network'}],
    direction: 'out',
    mode: 'continuous',
    ratio: 3.2,
    accent: BP.blue,
    line: BP.line,
    hud: true,
    easing: 'sine',
    camRoll: 0,
    holdStart: 0,
    scaleLabel: 'SCALE',
  },
  propDocs: {
    levels: 'innermost first: {label, kind?}; kind word|badge|radar|plan|dial|network (defaults cycle in that order; level 1 shows its label as a big word)',
    direction: 'out = pull back from the first level, in = dive from the last',
    mode: 'continuous log-scale move, or snap (hold, then easeOutExpo snap per level)',
    ratio: 'scale ratio between neighbouring levels',
    hud: 'scale readout and level list',
    easing: 'continuous mode move curve: sine | linear (constant log-zoom, orbit-dive) | inOut | expo',
    camRoll: 'degrees the whole camera rolls while zooming (e.g. 90 for an orbit dive, 0 = none)',
    holdStart: 'fraction of the clip (0..0.4) the first level holds before the move starts',
    scaleLabel: 'small caps label before the scale readout (hud: true)',
  },
  component: PowersOfTen,
  tags: ['zoom', 'scale', 'nested', 'pull-back', 'blueprint', 'camera', 'scale-dive', 'orbit-dive', 'log-zoom', 'camera roll', 'droste'],
});
