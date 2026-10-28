import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  heading: string;
  formula: string;
  bodyLines: string[];
  caption: string;
  labels: string[];
  liquidColors: string[];
  desk: string;
  paper: string;
  ink: string;
  accent: string;
  releaseFrame: number;
  speed: number;
  friction: number;
  startAt: number;
  formulaNote?: string;
  figLabel?: string;
};

// ---- track geometry in apparatus-local units (480 x 430)
const X0 = 50;
const X1 = 430;
const trackY = (x: number) => {
  const s = (x - X0) / (X1 - X0);
  return 190 + 180 * (1 - (2 * s - 1) ** 2) + 30 * s;
};
const dY = (x: number) => trackY(x + 0.5) - trackY(x - 0.5);
const Y_MAX = 400;
const N_STEPS = 900;

const simulate = (startAt: number, speed: number, friction: number) => {
  const out: {x: number; v: number}[] = [];
  let x = X0 + (X1 - X0) * startAt;
  let v = 0;
  const G = 1.1;
  const sub = 6;
  const dt = speed / sub;
  for (let i = 0; i < N_STEPS; i++) {
    out.push({x, v});
    for (let k = 0; k < sub; k++) {
      const d = dY(x);
      const a = (G * d) / (1 + d * d) - friction * v;
      v += a * dt;
      x += v * dt;
      if (x < X0) {
        x = X0;
        v = Math.abs(v) * 0.3;
      }
      if (x > X1) {
        x = X1;
        v = -Math.abs(v) * 0.3;
      }
    }
  }
  return {states: out, G};
};

const TextbookEnergyLab: React.FC<Props> = ({heading, formula, bodyLines, caption, labels, liquidColors, desk, paper, ink, accent, releaseFrame, speed, friction, startAt, formulaNote = 'E = PE + KE + heat', figLabel = 'Fig. 1'}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const sim = useMemo(() => simulate(startAt, speed, friction), [startAt, speed, friction]);
  const idx = Math.max(0, Math.min(N_STEPS - 1, frame - releaseFrame));
  const st = sim.states[idx];
  const prev = sim.states[Math.max(0, idx - 1)];
  const d = dY(st.x);
  const hStart = Y_MAX - trackY(X0 + (X1 - X0) * startAt);
  const heightFrac = (x: number) => Math.max(0, Math.min(1, (Y_MAX - trackY(x)) / hStart));
  const grav = heightFrac(st.x);
  const ke = Math.max(0, (0.5 * st.v * st.v * (1 + d * d)) / (sim.G * hStart));
  const kin = Math.max(0, Math.min(1 - grav, ke));
  const therm = Math.max(0, 1 - grav - kin);
  const transfer = grav - heightFrac(prev.x); // negative when potential -> kinetic
  const fillIn = prog(frame, 40, 85, ease.out);
  const levels = [grav * fillIn, kin * fillIn, therm * fillIn];

  const vw = portrait ? 620 : 1000;
  const vh = portrait ? 1000 : 640;
  const pageW = portrait ? 560 : 470;
  const pageH = portrait ? 470 : 580;
  const lp = portrait ? {x: 30, y: 20} : {x: 25, y: 30};
  const rp = portrait ? {x: 30, y: 510} : {x: 505, y: 30};
  const bookIn = prog(frame, 0, 22, ease.out);
  const stand = prog(frame, 18, 56, ease.back);
  const draw = prog(frame, 14, 50, ease.inOut);
  const as = Math.min(pageW / 480, pageH / 440) * 0.97;
  const ax = rp.x + (pageW - 480 * as) / 2;
  const ay = rp.y + (pageH - 440 * as) / 2 + 8;
  const tx = 48;
  const ty = 66;
  const textIn = (i: number) => prog(frame, 8 + i * 4, 22 + i * 4, ease.out);

  const trackPts: string[] = [];
  const trackPtsB: string[] = [];
  for (let x = X0; x <= X1; x += 6) {
    trackPts.push(`${x},${trackY(x)}`);
    trackPtsB.push(`${x},${trackY(x) + 14}`);
  }
  const trackPath = 'M' + trackPts.join(' L');
  const trackPathB = 'M' + trackPtsB.join(' L');
  const trackBand = trackPath + ' L' + [...trackPtsB].reverse().join(' L') + ' Z';
  const legs = [90, 170, 250, 330, 410];
  const beakerX = [130, 240, 350];
  const drift = Math.sin(frame / 90) * 6;
  const id = 'tel';

  const arcPath = (i: number) => {
    const a = beakerX[i];
    const b = beakerX[i + 1];
    return `M${a} 30 Q${(a + b) / 2} -26 ${b} 30`;
  };
  const arcStrength = [Math.min(1, Math.abs(transfer) * 22 + 0.18), Math.min(1, kin * 0.9 + 0.15)];

  const ballX = st.x;
  const ballY = trackY(st.x) - 12;
  const rot = st.x * 0.09;
  const bookW = portrait ? pageW + 28 : pageW * 2 + 60;
  const bookH = portrait ? pageH * 2 + 56 : pageH + 30;

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 40% 30%, ${desk}, #6f8579 120%)`}}>
      <AbsoluteFill style={{transform: 'perspective(2200px) rotateX(16deg) scale(0.96)', transformOrigin: '50% 60%', opacity: bookIn}}>
        <svg width={w} height={h} viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet" style={{position: 'absolute', inset: 0}}>
          <defs>
            <filter id={`${id}-sh`} x="-10%" y="-10%" width="120%" height="130%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
            <linearGradient id={`${id}-pl`} x1="0" x2="1">
              <stop offset="0" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.16" />
            </linearGradient>
            <linearGradient id={`${id}-pr`} x1="0" x2="1">
              <stop offset="0" stopColor="#000" stopOpacity="0.2" />
              <stop offset="0.12" stopColor="#000" stopOpacity="0" />
            </linearGradient>
            <radialGradient id={`${id}-ball`} cx="0.35" cy="0.3" r="0.8">
              <stop offset="0" stopColor="#fff" />
              <stop offset="0.6" stopColor="#d9d6d0" />
              <stop offset="1" stopColor="#8d8a85" />
            </radialGradient>
            {liquidColors.map((c, i) => (
              <linearGradient key={i} id={`${id}-liq${i}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={c} stopOpacity="0.85" />
                <stop offset="1" stopColor={c} />
              </linearGradient>
            ))}
            {beakerX.map((bx, i) => (
              <clipPath key={i} id={`${id}-clip${i}`}>
                <rect x={bx - 26} y={36} width={52} height={78} rx={5} />
              </clipPath>
            ))}
            <linearGradient id={`${id}-arc`} x1="0" x2="1">
              <stop offset="0" stopColor={liquidColors[0]} />
              <stop offset="1" stopColor={liquidColors[1]} />
            </linearGradient>
          </defs>
          {/* cover + page block */}
          <rect x={lp.x - 14} y={lp.y - 12} width={bookW} height={bookH} rx="10" fill="#6a5430" filter={`url(#${id}-sh)`} opacity="0.55" transform="translate(10 14)" />
          <rect x={lp.x - 14} y={lp.y - 12} width={bookW} height={bookH} rx="8" fill="#d9ad45" />
          {/* pages */}
          {[lp, rp].map((p, k) => (
            <g key={k}>
              <rect x={p.x} y={p.y} width={pageW} height={pageH} rx="3" fill={paper} />
              {!portrait && <rect x={p.x} y={p.y} width={pageW} height={pageH} fill={`url(#${id}-${k === 0 ? 'pl' : 'pr'})`} />}
            </g>
          ))}
          {/* left page text */}
          <g transform={`translate(${lp.x + tx} ${lp.y + ty})`} fill={ink}>
            <text y="0" fontFamily={fonts.serif} fontWeight={700} fontSize={portrait ? 34 : 30} opacity={textIn(0)}>
              {heading}
            </text>
            <line x1="0" x2={pageW - tx * 2} y1="14" y2="14" stroke={ink} strokeOpacity="0.25" opacity={textIn(1)} />
            <text y={portrait ? 80 : 84} fontFamily={fonts.serif} fontSize={portrait ? 40 : 38} fontStyle="italic" opacity={textIn(2)}>
              {formula}
            </text>
            {bodyLines.map((ln, i) => (
              <text key={i} y={(portrait ? 124 : 134) + i * (portrait ? 28 : 32)} fontFamily={fonts.serif} fontSize={portrait ? 18 : 19} fontWeight={500} fill={ink} fillOpacity={0.88} opacity={textIn(3 + i * 0.5)}>
                {ln}
              </text>
            ))}
            <g opacity={textIn(6)} transform={`translate(0 ${pageH - ty - 100})`}>
              <rect width={pageW - tx * 2} height="44" rx="4" fill="#efe3c9" stroke={ink} strokeOpacity="0.2" />
              <text x="12" y="27" fontFamily={fonts.hand} fontSize="17" fill={accent}>
                {caption}
              </text>
            </g>
          </g>
          {/* right page apparatus */}
          <g transform={`translate(${ax} ${ay}) scale(${as})`}>
            <g transform={`translate(0 ${Y_MAX}) scale(1 ${0.04 + 0.96 * stand}) translate(0 ${-Y_MAX})`} opacity={Math.min(1, draw * 2)}>
              <ellipse cx="240" cy="410" rx="210" ry="14" fill="#000" opacity="0.1" filter={`url(#${id}-sh)`} />
              {/* rack */}
              <rect x="70" y="112" width="360" height="20" rx="3" fill={paper} stroke={ink} strokeWidth="1.6" />
              {beakerX.map((bx, i) => (
                <text key={i} x={bx} y="126" textAnchor="middle" fontFamily={fonts.mono} fontSize="12" fill={ink} fillOpacity="0.85">
                  {labels[i] ?? ''}
                </text>
              ))}
              {beakerX.map((bx, i) => {
                const lv = Math.max(0, Math.min(1, levels[i]));
                const top = 114 - 78 * lv;
                return (
                  <g key={i}>
                    <g clipPath={`url(#${id}-clip${i})`}>
                      <rect x={bx - 26} y={top} width="52" height="80" fill={`url(#${id}-liq${i})`} />
                      <ellipse cx={bx} cy={top} rx="26" ry="3" fill="#fff" fillOpacity="0.45" transform={`translate(0 ${Math.sin(frame / 7 + i * 2) * 0.8})`} />
                    </g>
                    <path d={`M${bx - 27} 30 V108 Q${bx - 27} 116 ${bx - 19} 116 H${bx + 19} Q${bx + 27} 116 ${bx + 27} 108 V30`} fill="none" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
                    <ellipse cx={bx} cy="30" rx="27" ry="4" fill="none" stroke={ink} strokeWidth="1.2" />
                    <text x={bx} y="150" textAnchor="middle" fontFamily={fonts.mono} fontSize="13" fontWeight={700} fill={liquidColors[i]} opacity={fillIn}>
                      {Math.round(lv * 100)}%
                    </text>
                  </g>
                );
              })}
              {/* transfer arcs */}
              {[0, 1].map((i) => (
                <g key={i} opacity={Math.min(1, fillIn * 1.4)}>
                  <path d={arcPath(i)} fill="none" stroke={ink} strokeOpacity="0.15" strokeWidth="2" />
                  <path d={arcPath(i)} fill="none" stroke={`url(#${id}-arc)`} strokeWidth={2 + 4 * arcStrength[i]} strokeLinecap="round" strokeDasharray="7 7" strokeDashoffset={-(frame * (transfer <= 0 ? 1 : -1) * 0.8)} opacity={0.35 + 0.65 * arcStrength[i]} />
                </g>
              ))}
              {/* track legs */}
              {legs.map((lx) => (
                <line key={lx} x1={lx} y1={trackY(lx) + 14} x2={lx} y2={Y_MAX + 6} stroke={ink} strokeOpacity="0.6" strokeWidth="1.2" />
              ))}
              <line x1="40" x2="440" y1={Y_MAX + 6} y2={Y_MAX + 6} stroke={ink} strokeWidth="1.8" />
              <path d={trackBand} fill={paper} fillOpacity="0.92" stroke="none" />
              {Array.from({length: 40}, (_, i) => {
                const x = X0 + 4 + i * ((X1 - X0 - 8) / 39);
                return <line key={i} x1={x} x2={x} y1={trackY(x)} y2={trackY(x) + 14} stroke={ink} strokeOpacity="0.2" />;
              })}
              <path d={trackPath} fill="none" stroke={ink} strokeWidth="1.8" />
              <path d={trackPathB} fill="none" stroke={ink} strokeWidth="1.8" />
              {/* ball */}
              <g opacity={prog(frame, 36, 54)}>
                <ellipse cx={ballX} cy={trackY(ballX) + 22} rx="12" ry="3" fill="#000" opacity="0.18" />
                <circle cx={ballX} cy={ballY} r="12" fill={`url(#${id}-ball)`} stroke={ink} strokeWidth="1.4" />
                <path d={`M${ballX} ${ballY} l${Math.cos(rot) * 9} ${Math.sin(rot) * 9}`} stroke={ink} strokeOpacity="0.45" strokeWidth="1.2" />
              </g>
              <text x="240" y="428" textAnchor="middle" fontFamily={fonts.hand} fontSize="14" fill={ink} fillOpacity="0.65">
                {formulaNote}
              </text>
            </g>
          </g>
          <text x={rp.x + pageW - 20} y={rp.y + pageH - 14} textAnchor="end" fontFamily={fonts.serif} fontSize="14" fill={ink} fillOpacity="0.55">
            {figLabel}
          </text>
        </svg>
      </AbsoluteFill>
      {/* window light shadow bars */}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', pointerEvents: 'none'}}>
        <defs>
          <filter id={`${id}-wb`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={18 * u} />
          </filter>
        </defs>
        <g filter={`url(#${id}-wb)`} fill="#2b3a35" opacity="0.28" transform={`translate(${drift * u} ${drift * 0.4 * u})`}>
          <polygon points={`0,0 ${w * 0.16},0 ${w * 0.04},${h * 0.5} ${-w * 0.02},${h * 0.5}`} />
          <polygon points={`${w * 0.3},0 ${w * 0.4},0 ${w * 0.22},${h * 0.75} ${w * 0.14},${h * 0.75}`} />
          <polygon points={`${w * 0.7},${h * 0.55} ${w * 0.82},${h * 0.55} ${w * 0.72},${h} ${w * 0.6},${h}`} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const textbookEnergyLab = defineMotion<Props>({
  id: 'textbook-energy-lab',
  title: 'Textbook energy lab',
  category: 'document',
  description: 'An open physics textbook on a sage desk under window-light shadows. The right-page pencil apparatus stands up: a ball rolls a U-track while three beakers (gravitational, kinetic, thermal) trade liquid levels, joined by glowing transfer arcs.',
  source: ['analysis/sheets/r3/v4.jpg'],
  useFor: 'Explaining energy conservation, or any interactive-textbook look: a lesson page with a live diagram beside the formula.',
  durationInFrames: 300,
  defaultProps: {
    heading: 'Up and down',
    formula: 'E = m g h',
    bodyLines: [
      'A ball high on a track stores energy',
      'in its height. Let it go, and that store',
      'drains into motion at the bottom.',
      'Climbing again, motion refills the store.',
      'A little is always lost as heat.',
    ],
    caption: 'Lift the flap to see the answer.',
    labels: ['GRAVITY', 'MOTION', 'HEAT'],
    liquidColors: ['#8a4fe0', '#3f8cf0', '#f08a3a'],
    desk: '#9db3a6',
    paper: '#f7f4ec',
    ink: '#3a3a40',
    accent: '#6b4fb0',
    releaseFrame: 70,
    speed: 1,
    friction: 0.0012,
    startAt: 0.06,
    formulaNote: 'E = PE + KE + heat',
    figLabel: 'Fig. 1',
  },
  propDocs: {
    heading: 'left-page title',
    formula: 'formula line under the heading',
    bodyLines: 'lines of body text on the left page',
    caption: 'handwritten note in the answer box',
    labels: 'three beaker labels (potential, kinetic, thermal)',
    liquidColors: 'three liquid colours',
    desk: 'desk colour',
    paper: 'page colour',
    ink: 'pencil line colour',
    accent: 'handwriting colour',
    releaseFrame: 'frame the ball is released',
    speed: 'rolling speed multiplier',
    friction: 'energy lost to heat per frame (0 = none)',
    startAt: 'start position along the track, 0..1',
    formulaNote: 'handwritten note under the pendulum diagram',
    figLabel: 'figure label in the bottom corner of the right page',
  },
  component: TextbookEnergyLab,
  tags: ['physics', 'book', 'education', 'energy', 'diagram'],
});
