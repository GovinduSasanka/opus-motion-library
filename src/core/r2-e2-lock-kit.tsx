import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from './ease';
import {fonts} from './fonts';
import {Plate} from './image-kit';
import {Svg, useStage} from './stage';

/**
 * Round-2 group E2: science-reticle mode 'lock' — four thin corner brackets wander across an image, snap onto a
 * target with a small overshoot and a ping, a label with a leader attaches, later the brackets open out to frame a
 * title. Idea from lemo-opuscar styles/satellite-briefing overlay.js (MIT) — see THIRD_PARTY_NOTICES.md.
 */

export interface LockProps {
  src: string;
  target: number[];
  searchFrames: number;
  lockAt: number;
  overshoot: number;
  label: string;
  openTo: number[];
  openAt: number;
  openTitle: string;
  color: string;
  seed: number;
}

export const LockOn: React.FC<LockProps> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const T: [number, number] = [p.target[0] * w, p.target[1] * h];
  const size0 = Math.min(w, h) * 0.2;
  // wandering search: slow Lissajous around the frame centre
  const search = (f: number): [number, number] => [w * (0.5 + 0.26 * Math.sin(f * 0.11 + p.seed)), h * (0.5 + 0.2 * Math.sin(f * 0.083 + 1.7 + p.seed))];
  const lock = p.lockAt;
  const s0 = search(lock);
  let pos: [number, number];
  let size = size0 * 1.6;
  if (frame < lock) {
    pos = search(frame);
    size = size0 * lerp(1.9, 1.6, clamp(frame / Math.max(1, lock)));
  } else {
    const s = (frame - lock) / 30;
    // damped spring toward the target, overshoot controlled by p.overshoot
    const k = Math.exp(-9 * s) * Math.cos(16 * s) * (1 + p.overshoot * 4 * Math.min(1, s * 8));
    pos = [T[0] + (s0[0] - T[0]) * k, T[1] + (s0[1] - T[1]) * k];
    size = lerp(size0 * 1.6, size0, ease.out(clamp((frame - lock) / 8)));
  }
  // open-to-frame: brackets expand to a rect that hosts the title
  const oT = p.openAt >= 0 ? prog(frame, p.openAt, p.openAt + 15, ease.out) : 0;
  const R = {x: p.openTo[0] * w, y: p.openTo[1] * h, w: p.openTo[2] * w, h: p.openTo[3] * h};
  const bx = lerp(pos[0] - size / 2, R.x, oT);
  const by = lerp(pos[1] - size / 2, R.y, oT);
  const bw = lerp(size, R.w, oT);
  const bh = lerp(size, R.h, oT);
  const L = Math.min(bw, bh) * 0.3 + 8 * u;
  const col = p.color;
  const pingT = prog(frame, lock + 2, lock + 20, ease.out);
  const lockedT = prog(frame, lock + 6, lock + 18, ease.out);
  const sw = 4 * u;
  const corner = (x: number, y: number, dx: number, dy: number, i: number) => (
    <g key={i}>
      <polyline points={`${x + dx * L},${y} ${x},${y} ${x},${y + dy * L}`} fill="none" stroke="#000" strokeOpacity={0.45} strokeWidth={sw * 2.2} strokeLinecap="square" />
      <polyline points={`${x + dx * L},${y} ${x},${y} ${x},${y + dy * L}`} fill="none" stroke={col} strokeWidth={sw * 0.7} strokeLinecap="square" />
    </g>
  );
  const lx = T[0] + size0 * 0.9;
  const ly = T[1] - size0 * 0.8;
  return (
    <AbsoluteFill style={{background: '#020414'}}>
      <Plate src={p.src || undefined} seed={p.seed} palette="dusk" />
      <AbsoluteFill style={{background: 'rgba(2,4,20,0.25)'}} />
      <Svg>
        {corner(bx, by, 1, 1, 0)}
        {corner(bx + bw, by, -1, 1, 1)}
        {corner(bx, by + bh, 1, -1, 2)}
        {corner(bx + bw, by + bh, -1, -1, 3)}
        {frame >= lock && frame < lock + 24 && <circle cx={T[0]} cy={T[1]} r={lerp(size0 * 0.4, size0 * 1.4, pingT)} fill="none" stroke={col} strokeWidth={2 * u} opacity={1 - pingT} />}
        {frame >= lock && oT < 0.5 && <circle cx={T[0]} cy={T[1]} r={3.5 * u} fill={col} opacity={lockedT} />}
        {p.label && lockedT > 0 && oT < 1 && (
          <g opacity={lockedT * (1 - oT)}>
            <polyline points={`${T[0] + size0 * 0.5},${T[1] - size0 * 0.5} ${lx},${ly} ${lx + 150 * u},${ly}`} fill="none" stroke={col} strokeWidth={1.6 * u} />
            <text x={lx + 8 * u} y={ly - 10 * u} fontFamily={fonts.mono} fontWeight={700} fontSize={24 * u} fill={col} letterSpacing={1.5 * u}>
              {p.label}
            </text>
          </g>
        )}
        {p.openTitle && oT > 0.6 && (
          <text x={R.x + R.w / 2} y={R.y + R.h / 2 + 14 * u} textAnchor="middle" fontFamily={fonts.serif} fontWeight={700} fontSize={Math.min(R.h * 0.3, 90 * u)} fill="#ffffff" opacity={prog(oT, 0.6, 1, (x) => x)}>
            {p.openTitle}
          </text>
        )}
      </Svg>
    </AbsoluteFill>
  );
};
