import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from './asset';
import {clamp, ease, lerp, prog} from './ease';
import {fonts} from './fonts';
import {n2, rng} from './random';
import {Svg, useStage} from './stage';

/**
 * Round-2 group E2: map-route style 'range' — a ticked measuring line grows from A to B over imagery with a
 * reticle and a rolling value at its tip; the camera chases the tip then pulls back; a lit corridor along the line.
 * Idea from lemo-opuscar styles/satellite-briefing "range line" (MIT, LemoLab) — see THIRD_PARTY_NOTICES.md.
 */

export interface RangeProps {
  from: [number, number];
  to: [number, number];
  distanceKm: number;
  unit: string;
  src: string;
  corridor: boolean;
  chase: boolean;
  labelA: string;
  labelB: string;
  seed: number;
  trailColor: string;
}

/** procedural satellite-ish ground: dark land, lighter fields, a coast */
const Ground: React.FC<{w: number; h: number; seed: number}> = ({w, h, seed}) => {
  const r = rng(seed);
  const blobs = Array.from({length: 46}, () => ({x: -w * 0.4 + r() * w * 1.8, y: -h * 0.4 + r() * h * 1.8, rx: w * (0.03 + r() * 0.09), ry: h * (0.03 + r() * 0.08), a: r() * 180, c: r()}));
  const coast: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const x = -w * 0.4 + (w * 1.8 * i) / 40;
    coast.push(`${i ? 'L' : 'M'}${x.toFixed(0)} ${(h * 0.88 + n2('coast' + seed, i * 0.31, 0.5) * h * 0.14).toFixed(0)}`);
  }
  return (
    <g>
      <rect x={-w * 0.5} y={-h * 0.5} width={w * 2} height={h * 2} fill="#27302A" />
      {blobs.map((b, i) => (
        <ellipse key={i} cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} transform={`rotate(${b.a} ${b.x} ${b.y})`} fill={b.c < 0.35 ? '#3B4A38' : b.c < 0.7 ? '#4A5640' : '#2F3A2F'} opacity={0.85} />
      ))}
      <path d={`${coast.join('')}L${w * 1.4} ${h * 1.5}L${-w * 0.4} ${h * 1.5}Z`} fill="#1B3340" />
      <path d={coast.join('')} fill="none" stroke="#7FA6A8" strokeOpacity={0.5} strokeWidth={4} />
    </g>
  );
};

export const RangeMode: React.FC<RangeProps> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const A: [number, number] = [p.from[0] * w, p.from[1] * h];
  const B: [number, number] = [p.to[0] * w, p.to[1] * h];
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  const len = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);
  const ux = dx / len;
  const uy = dy / len;
  const grow = prog(frame, 22, 22 + 58, ease.inOut);
  const tip: [number, number] = [A[0] + dx * grow, A[1] + dy * grow];
  const pull = prog(frame, 84, 84 + 30, ease.inOut);
  const chaseOn = p.chase;
  const zoomS = chaseOn ? lerp(2.1, 1, pull) : 1;
  // camera centre: follows the tip while growing, then returns to the frame centre
  const mid: [number, number] = [w / 2, h / 2];
  const cam: [number, number] = chaseOn ? [lerp(tip[0], mid[0], pull), lerp(tip[1], mid[1], pull)] : mid;
  const intro = prog(frame, 0, 14, ease.out);
  const value = p.distanceKm * grow;
  const readIn = prog(frame, 96, 104, ease.out);
  const pop = 1 + 0.06 * Math.sin(Math.PI * clamp((frame - 96) / 10)) * (frame >= 96 ? 1 : 0);
  const sw = (4 * u) / zoomS;
  const corridorW = Math.min(w, h) * 0.16;
  const dimOn = p.corridor ? prog(frame, 14, 30, ease.out) * 0.45 : 0;
  const nMinor = 20;
  const ticks = Array.from({length: nMinor + 1}, (_, i) => i);
  const col = '#F4F6FA';
  const accent = p.trailColor;
  const nx = -uy;
  const ny = ux;
  return (
    <AbsoluteFill style={{background: '#0F1512'}}>
      <Svg>
        <defs>
          <mask id="mr-range-corr" maskUnits="userSpaceOnUse" x={-w} y={-h} width={w * 3} height={h * 3}>
            <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="#fff" />
            <g transform={`translate(${A[0]} ${A[1]}) rotate(${(ang * 180) / Math.PI})`}>
              <rect x={-corridorW * 0.5} y={-corridorW / 2} width={len * grow + corridorW * 0.5} height={corridorW} fill="#000" />
            </g>
          </mask>
        </defs>
        <g transform={`translate(${w / 2} ${h / 2}) scale(${zoomS}) translate(${-cam[0]} ${-cam[1]})`}>
          {p.src ? <image href={resolveSrc(p.src)} x={0} y={0} width={w} height={h} preserveAspectRatio="xMidYMid slice" /> : <Ground w={w} h={h} seed={p.seed} />}
          {dimOn > 0 && <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="#000" opacity={dimOn} mask="url(#mr-range-corr)" />}
          {/* start marker */}
          <circle cx={A[0]} cy={A[1]} r={(12 * u) / zoomS} fill="none" stroke={col} strokeWidth={sw} opacity={intro} />
          <circle cx={A[0]} cy={A[1]} r={(4 * u) / zoomS} fill={col} opacity={intro} />
          <text x={A[0] + (22 * u) / zoomS} y={A[1] + (34 * u) / zoomS} fontFamily={fonts.mono} fontWeight={700} fontSize={(22 * u) / zoomS} fill={col} opacity={intro}>
            {p.labelA}
          </text>
          {/* line + halo */}
          <line x1={A[0]} y1={A[1]} x2={tip[0]} y2={tip[1]} stroke="#000" strokeOpacity={0.35} strokeWidth={sw * 2.6} strokeLinecap="round" />
          <line x1={A[0]} y1={A[1]} x2={tip[0]} y2={tip[1]} stroke={col} strokeWidth={sw} strokeLinecap="round" />
          {ticks.map((i) => {
            const k = i / nMinor;
            if (k > grow + 0.001) return null;
            const major = i % 5 === 0;
            const tl = ((major ? 22 : 11) * u) / zoomS;
            const tx = A[0] + dx * k;
            const ty = A[1] + dy * k;
            return (
              <g key={i}>
                <line x1={tx - nx * tl} y1={ty - ny * tl} x2={tx + nx * tl} y2={ty + ny * tl} stroke={col} strokeWidth={sw * (major ? 0.7 : 0.45)} />
                {major && i > 0 && (
                  <text x={tx + nx * tl * 1.9} y={ty + ny * tl * 1.9 + (6 * u) / zoomS} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={(17 * u) / zoomS} fill={col} opacity={0.9}>
                    {Math.round(k * p.distanceKm)}
                  </text>
                )}
              </g>
            );
          })}
          {/* tip reticle + rolling value */}
          {grow > 0 && (
            <g transform={`translate(${tip[0]} ${tip[1]})`}>
              {[0, 90, 180, 270].map((a) => (
                <path key={a} d={`M${(-16 * u) / zoomS} ${(-6 * u) / zoomS} L${(-16 * u) / zoomS} ${(-16 * u) / zoomS} L${(-6 * u) / zoomS} ${(-16 * u) / zoomS}`} fill="none" stroke={col} strokeWidth={sw * 0.6} transform={`rotate(${a})`} />
              ))}
              <circle r={(3 * u) / zoomS} fill={accent} />
              <g transform={`translate(${(30 * u) / zoomS} ${(-30 * u) / zoomS})`}>
                <rect x={0} y={(-30 * u) / zoomS} width={(150 * u) / zoomS} height={(40 * u) / zoomS} rx={(6 * u) / zoomS} fill="#0b0f0d" opacity={0.78} />
                <text x={(12 * u) / zoomS} y={(-2 * u) / zoomS} fontFamily={fonts.mono} fontWeight={700} fontSize={(26 * u) / zoomS} fill={col}>
                  {value.toFixed(1)}
                  <tspan fontSize={(17 * u) / zoomS} fill="#9BB0A4">{` ${p.unit}`}</tspan>
                </text>
              </g>
            </g>
          )}
          {grow >= 0.999 && (
            <>
              <circle cx={B[0]} cy={B[1]} r={(12 * u) / zoomS} fill="none" stroke={col} strokeWidth={sw} />
              <text x={B[0] - (22 * u) / zoomS} y={B[1] - (22 * u) / zoomS} textAnchor="end" fontFamily={fonts.mono} fontWeight={700} fontSize={(22 * u) / zoomS} fill={col}>
                {p.labelB}
              </text>
            </>
          )}
        </g>
        {/* reading lands */}
        <g transform={`translate(${w / 2} ${h * 0.16}) scale(${pop})`} opacity={readIn}>
          <rect x={-w * 0.17} y={-52 * u} width={w * 0.34} height={104 * u} rx={10 * u} fill="#0b0f0d" opacity={0.8} />
          <text textAnchor="middle" y={14 * u} fontFamily={fonts.mono} fontWeight={700} fontSize={Math.min(w * 0.09, 70 * u)} fill={col}>
            {p.distanceKm.toFixed(1)}
            <tspan fontSize={Math.min(w * 0.04, 30 * u)} fill="#9BB0A4">{` ${p.unit}`}</tspan>
          </text>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};
