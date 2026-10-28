import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from './ease';
import {fonts} from './fonts';
import {Plate} from './image-kit';
import {Svg, useStage} from './stage';
import {back} from './r2-e2-kit';

/**
 * Round-2 group E2: split-compare layout 'ledger' — a divider drops in, the bad half desaturates with a red tint,
 * two counters race, a stamp lands on the divider once both settle. Idea from lemo-opuscar (MIT) ledger split —
 * see THIRD_PARTY_NOTICES.md.
 */

export interface LedgerCounter {
  label: string;
  value: number;
  unit?: string;
  prefix?: string;
  bad?: boolean;
  decimals?: number;
}

export const LedgerSplit: React.FC<{counters: LedgerCounter[]; stamp: string; seed: number; image: string; headline: string; dividerColor: string; dividerDrop: number; stampColor: string; badTint: string}> = ({counters, stamp, seed, image, headline, dividerColor, dividerDrop, stampColor, badTint}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const drop = prog(frame, 2, 2 + Math.max(2, dividerDrop), ease.out);
  const cs = [counters[0], counters[1]];
  // counters race: both start at the same time, the good one settles first (lower duration), the bad one overshoots
  const race = (c: LedgerCounter, i: number) => {
    const dur = c.bad ? 54 : 40;
    const t = clamp((frame - 22) / dur);
    const e = ease.out(t);
    const over = c.bad && t < 1 ? 1 + 0.08 * Math.sin(t * Math.PI) : 1;
    return c.value * e * over;
  };
  const settleAt = 22 + 54;
  const stampT = prog(frame, settleAt + 6, settleAt + 12, (x) => x);
  const filterBad = (bad: boolean) => (bad ? `grayscale(${0.85 * drop}) brightness(${1 - 0.18 * drop}) contrast(1.05)` : 'none');
  const halves = portrait
    ? [
        {x: 0, y: 0, w, h: h / 2},
        {x: 0, y: h / 2, w, h: h / 2},
      ]
    : [
        {x: 0, y: 0, w: w / 2, h},
        {x: w / 2, y: 0, w: w / 2, h},
      ];
  const fsNum = Math.min(halves[0].w * 0.26, 190 * u);
  return (
    <AbsoluteFill style={{background: '#0a0c10'}}>
      {halves.map((b, i) => {
        const c = cs[i];
        const open = i === 0 ? drop : drop;
        const clip = portrait ? (i === 0 ? `inset(0 0 ${(1 - open) * 100}% 0)` : `inset(${(1 - open) * 100}% 0 0 0)`) : i === 0 ? `inset(0 ${(1 - open) * 100}% 0 0)` : `inset(0 0 0 ${(1 - open) * 100}%)`;
        return (
          <div key={i} style={{position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, overflow: 'hidden', clipPath: clip}}>
            <div style={{position: 'absolute', inset: 0, filter: filterBad(!!c.bad)}}>
              <Plate src={image || undefined} seed={seed + (image ? 0 : i * 3)} width={b.w} height={b.h} />
            </div>
            {c.bad && <div style={{position: 'absolute', inset: 0, background: badTint, opacity: 0.38 * drop, mixBlendMode: 'multiply'}} />}
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.55))'}} />
            <div style={{position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', textAlign: 'center', fontFamily: fonts.mono, color: '#F5F2EC'}}>
              <div style={{fontSize: fsNum * 0.2, fontWeight: 700, letterSpacing: '0.2em', opacity: 0.85, marginBottom: fsNum * 0.1, textTransform: 'uppercase'}}>{c.label}</div>
              <div style={{fontSize: fsNum, fontWeight: 700, lineHeight: 1, textShadow: `0 ${4 * u}px ${24 * u}px rgba(0,0,0,0.6)`, color: c.bad ? '#FFB4A8' : '#F5F2EC'}}>
                {c.prefix ?? ''}
                {race(c, i).toFixed(c.decimals ?? 0)}
                <span style={{fontSize: fsNum * 0.3, opacity: 0.8}}>{c.unit ? ` ${c.unit}` : ''}</span>
              </div>
            </div>
          </div>
        );
      })}
      {headline && (
        <div style={{position: 'absolute', left: 0, right: 0, top: h * 0.07, textAlign: 'center', fontFamily: fonts.sans, fontWeight: 800, fontSize: 44 * u, color: '#fff', textShadow: `0 ${3 * u}px ${16 * u}px rgba(0,0,0,0.6)`, opacity: prog(frame, 4, 16, ease.out)}}>{headline}</div>
      )}
      <Svg>
        {portrait ? (
          <rect x={0} y={h / 2 - 1.5 * u} width={w * drop} height={3 * u} fill={dividerColor} />
        ) : (
          <rect x={w / 2 - 1.5 * u} y={0} width={3 * u} height={h * drop} fill={dividerColor} />
        )}
        {stampT > 0 && (
          <g transform={`translate(${w / 2} ${h / 2}) rotate(-8) scale(${lerp(2.2, 1, back(stampT, 1.3))})`} opacity={clamp(stampT * 2)}>
            <rect x={-Math.max(150 * u, stamp.length * 30 * u)} y={-48 * u} width={Math.max(300 * u, stamp.length * 60 * u)} height={96 * u} rx={8 * u} fill="rgba(10,12,16,0.78)" stroke={stampColor} strokeWidth={7 * u} />
            <text textAnchor="middle" y={26 * u} fontFamily={fonts.display} fontSize={66 * u} fill={stampColor} letterSpacing={4 * u}>
              {stamp}
            </text>
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};
