import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {ARCADE, ExtrudeText, HalftoneDef, SlimeOrb, easeInQuad, easeOutCubic, easeOutQuad, h01, lin, pop, star4, x58Fonts} from '../../core/r2-x58-kit';

/**
 * x7 rocket-to-moon: part 1 — the hero shoots straight up out of a lantern-lit stage on a bright light trail
 * (easeIn). A 1-frame grey flash cuts to space: Earth top-left, a big halftoned crescent moon; the hero streaks
 * diagonally from lower-left to the moon (easeOutQuad, thin glowing trail), plants as a four-spike flare that
 * shrinks to a glowing dot while the moon's dark side lights up blue; the product name pops in at the lower left,
 * then a small tracked "NOW LAUNCHED".
 */
type Props = {
  title: string;
  subtitle: string;
  color: string;
  src: string;
  cutAt: number;
  moonGlow: string;
  seed: number;
};

const RocketToMoon: React.FC<Props> = ({title, subtitle, color, src, cutAt, moonGlow, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const S = Math.min(w, h);
  const id = `rtm-${seed}`;
  const space = frame >= cutAt;
  const f2 = frame - cutAt;
  // moon
  const mR = portrait ? w * 0.42 : w * 0.275;
  const mx = portrait ? w * 0.55 : w * 0.62;
  const my = portrait ? h * 0.4 : h * 0.5;
  const ex = portrait ? w * 0.16 : w * 0.15;
  const ey = portrait ? h * 0.12 : h * 0.18;
  const streak = lin(f2, 10, 25);
  const sk = easeOutQuad(streak);
  const sx0 = -w * 0.05;
  const sy0 = h * 1.05;
  const tx = mx - mR * 0.25;
  const ty = my - mR * 0.05;
  const hx = sx0 + (tx - sx0) * sk;
  const hy = sy0 + (ty - sy0) * sk;
  const flareT = lin(f2, 26, 41);
  const glowK = easeOutCubic(lin(f2, 26, 56));
  const titleK = pop(f2, 15, 3, 1.1);
  const subK = easeOutCubic(lin(f2, 27, 33));
  return (
    <AbsoluteFill style={{background: space ? '#05061A' : ARCADE.bg, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <HalftoneDef id={`${id}-ht`} size={10 * u} color="#2A2E66" r={0.32} />
          <radialGradient id={`${id}-mg`} cx="40%" cy="45%" r="65%">
            <stop offset="0%" stopColor={moonGlow} stopOpacity={0.9} />
            <stop offset="100%" stopColor="#0E1240" stopOpacity={0.3} />
          </radialGradient>
          <linearGradient id={`${id}-tr`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity={0} />
            <stop offset="100%" stopColor="#fff" />
          </linearGradient>
          <filter id={`${id}-bl`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={6 * u} />
          </filter>
          <clipPath id={`${id}-mc`}>
            <circle cx={mx} cy={my} r={mR} />
          </clipPath>
        </defs>
        {!space ? (
          <g>
            {/* stage at low angle: light cones, lanterns, the hero launching */}
            {[0.15, 0.35, 0.65, 0.85].map((x, i) => (
              <path key={i} d={`M${w * x} 0 L${w * x - w * 0.08} ${h} L${w * x + w * 0.08} ${h}Z`} fill={i % 2 ? '#55C5F9' : '#E54B8E'} opacity={0.12} />
            ))}
            {Array.from({length: 7}, (_, i) => {
              const lx = w * (0.08 + i * 0.14);
              const ly = h * (0.12 + 0.08 * Math.sin(i * 1.7));
              return (
                <g key={i}>
                  <line x1={lx} y1={0} x2={lx} y2={ly - 18 * u} stroke="#6B5A7A" strokeWidth={1.5 * u} />
                  <ellipse cx={lx} cy={ly} rx={16 * u} ry={20 * u} fill="#D23A3A" />
                  <ellipse cx={lx} cy={ly} rx={16 * u} ry={20 * u} fill="#FFB36B" opacity={0.25} />
                </g>
              );
            })}
            {Array.from({length: 120}, (_, i) => (
              <circle key={i} cx={h01(i, 1) * w} cy={h01(i, 2) * h} r={1.2 * u} fill="#fff" opacity={0.3 * h01(i, 3)} />
            ))}
            {(() => {
              const lk = easeInQuad(lin(frame, 4, cutAt));
              const y = h * 0.82 - lk * h * 1.1;
              const trailH = h * 0.82 - y + h * 0.2;
              return (
                <g>
                  <rect x={w / 2 - w * 0.015} y={y} width={w * 0.03} height={trailH} fill={`url(#${id}-tr)`} />
                  <rect x={w / 2 - w * 0.04} y={y} width={w * 0.08} height={trailH} fill={color} opacity={0.25} filter={`url(#${id}-bl)`} />
                  {src ? (
                    <foreignObject x={w / 2 - S * 0.07} y={y - S * 0.14} width={S * 0.14} height={S * 0.14}>
                      <Img src={resolveSrc(src)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
                    </foreignObject>
                  ) : (
                    <SlimeOrb id={`${id}-h`} x={w / 2} y={y} r={S * 0.06} sx={0.8} sy={1.3} color={color} eyes="closed" />
                  )}
                  {[0, 1, 2, 3].map((i) => (
                    <circle key={i} cx={w / 2 + (i - 1.5) * S * 0.05} cy={h * 0.86} r={S * (0.03 + 0.03 * lk)} fill="#E9E4F2" opacity={0.6 * (1 - lk * 0.5)} />
                  ))}
                </g>
              );
            })()}
          </g>
        ) : (
          <g>
            {Array.from({length: 150}, (_, i) => (
              <circle key={i} cx={h01(i, seed, 1) * w} cy={h01(i, seed, 2) * h} r={(0.6 + 1.2 * h01(i, 3)) * u} fill="#fff" opacity={0.25 + 0.5 * h01(i, 4)} />
            ))}
            {/* earth */}
            <g transform={`translate(${ex} ${ey})`}>
              <circle r={S * 0.055} fill="#2B6FD0" />
              <path d={`M${-S * 0.04} ${-S * 0.02} q${S * 0.03} ${-S * 0.03} ${S * 0.05} 0 q${S * 0.02} ${S * 0.03} ${-S * 0.01} ${S * 0.05} q${-S * 0.04} 0 ${-S * 0.04} ${-S * 0.05}Z`} fill="#3EBE5A" />
              <circle r={S * 0.055} fill="none" stroke="#9FE3FF" strokeWidth={2 * u} opacity={0.6} />
            </g>
            {/* moon */}
            <circle cx={mx} cy={my} r={mR} fill="#141A52" />
            <g clipPath={`url(#${id}-mc)`}>
              <circle cx={mx} cy={my} r={mR} fill="#C9C3D4" />
              <circle cx={mx - mR * 0.16} cy={my} r={mR * 0.99} fill="#141A52" />
              <circle cx={mx - mR * 0.16} cy={my} r={mR * 0.99} fill={`url(#${id}-mg)`} opacity={0.6 * glowK} />
              <rect x={mx - mR} y={my - mR} width={mR * 2} height={mR * 2} fill={`url(#${id}-ht)`} opacity={0.35} />
              {Array.from({length: 7}, (_, i) => (
                <circle key={i} cx={mx + (h01(i, 21) - 0.5) * mR * 1.4} cy={my + (h01(i, 22) - 0.5) * mR * 1.4} r={mR * (0.04 + 0.06 * h01(i, 23))} fill="#0E1240" opacity={0.35} />
              ))}
            </g>
            {/* streak */}
            {streak > 0 && flareT < 1 ? (
              <g>
                <line x1={sx0 + (tx - sx0) * Math.max(0, sk - 0.35)} y1={sy0 + (ty - sy0) * Math.max(0, sk - 0.35)} x2={hx} y2={hy} stroke="#BFE6FF" strokeWidth={3 * u} strokeLinecap="round" opacity={1 - flareT} />
                {streak < 1 ? <circle cx={hx} cy={hy} r={S * 0.025} fill={color} stroke="#fff" strokeWidth={2 * u} /> : null}
              </g>
            ) : null}
            {flareT > 0 ? (
              <g transform={`translate(${tx} ${ty})`}>
                <circle r={S * 0.05} fill="#BFE6FF" opacity={0.6} filter={`url(#${id}-bl)`} />
                <path d={star4(Math.max(S * 0.018, w * 0.15 * (1 - easeOutCubic(flareT))), 0.05)} fill="#fff" />
                <circle r={S * 0.012} fill="#DDF3FF" />
              </g>
            ) : null}
          </g>
        )}
      </svg>
      {space && titleK > 0 ? (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
          <g transform={`translate(${w * (portrait ? 0.06 : 0.03)} ${h * (portrait ? 0.78 : 0.83)}) scale(${titleK})`}>
            <ExtrudeText x={0} y={0} size={h * (portrait ? 0.05 : 0.085)} text={title.toUpperCase()} font={x58Fonts.lilita} anchor="start" gradient={['#FFFFFF', '#CFE6FF', '#7FB6F2']} id={`${id}-tg`} ink="#0A0F3A" depth={h * 0.007} />
          </g>
          {subK > 0 ? (
            <text x={w * (portrait ? 0.08 : 0.07)} y={h * (portrait ? 0.82 : 0.9)} fontFamily={x58Fonts.rajdhani} fontWeight={700} fontSize={h * (portrait ? 0.016 : 0.026)} fill="#F3D88A" letterSpacing={h * 0.007} opacity={subK}>
              {subtitle.toUpperCase()}
            </text>
          ) : null}
        </svg>
      ) : null}
      {f2 === 0 ? <AbsoluteFill style={{background: '#9AA0B8', opacity: 0.85}} /> : null}
    </AbsoluteFill>
  );
};

export const rocketToMoon = defineMotion<Props>({
  id: 'rocket-to-moon',
  title: 'Rocket to moon',
  category: 'game',
  description:
    'A launch end card: the hero shoots up off a lantern-lit stage on a light trail, a one-frame flash cuts to space, it streaks to a big halftoned crescent moon and plants as a shrinking four-spike flare while the moon glows blue and the product name and "NOW LAUNCHED" pop in.',
  source: ['video x7 28.70-32.10 s (launch, space streak, moon flare, title) — original hero and copy'],
  useFor: '"Launched / shipped / now live" end cards for product launches and release videos.',
  durationInFrames: 105,
  defaultProps: {
    title: 'Lumen 3 Pro',
    subtitle: 'Now launched',
    color: '#3598F6',
    src: '',
    cutAt: 27,
    moonGlow: '#1D3FA8',
    seed: 4,
  },
  propDocs: {
    title: 'product name that pops in at the lower left',
    subtitle: 'small tracked line under the title',
    color: 'hero / trail colour',
    src: 'optional public/ image for the hero (default an original slime orb)',
    cutAt: 'frame of the cut from the stage to space',
    moonGlow: "colour the moon's dark side lights up with",
    seed: 'star seed',
  },
  component: RocketToMoon,
  tags: ['launch', 'rocket', 'moon', 'space', 'end card', 'product launch', 'release', 'now live', 'streak', 'flare', 'title', 'arcade', 'halftone'],
});
