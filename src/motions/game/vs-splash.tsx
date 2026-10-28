import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {ARCADE, ExtrudeText, HalftoneDef, SlimeOrb, SparkCritter, SprayGrain, easeOutCubic, h01, lin, pop, shadeHex, star4, x58Fonts} from '../../core/r2-x58-kit';

/**
 * x7 vs-splash: a fighting-game versus card. The frame splits along a steep (≈ 70°) diagonal into a blue-striped
 * left panel and red-striped right panel that slide in from their sides in 4 frames closing a white divider; a
 * round dark VS badge with a gold crescent pops in the centre with a spring, a brush word pops above, two tiny
 * judge mascots wobble below, fighter portraits and big italic names sit per panel; the whole card pushes 1 %/s.
 * At `slamAt`, "FIGHT!" slams in (scale 1.4 → 1, −6°) over radial speed lines while the panels dim 40 %.
 */
type Side = {name: string; color: string; color2: string; src?: string};
type Props = {
  left: Side;
  right: Side;
  badgeText: string;
  topText: string;
  slamText: string;
  slamAt: number;
  diagonalDeg: number;
  grain: boolean;
  seed: number;
};

const VsSplash: React.FC<Props> = ({left, right, badgeText, topText, slamText, slamAt, diagonalDeg, grain, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const S = Math.min(w, h);
  const slope = Math.tan(((90 - diagonalDeg) * Math.PI) / 180) * h; // x offset of the diagonal top vs bottom
  const topX = cx + slope / 2;
  const botX = cx - slope / 2;
  const inL = easeOutCubic(lin(frame, 0, 4));
  const inR = easeOutCubic(lin(frame, 1, 5));
  const slam = slamAt > 0 && frame >= slamAt;
  const slamK = lin(frame, slamAt, slamAt + 3);
  const dim = slam ? 0.6 : 1;
  const push = 1 + 0.01 * (frame / 30);
  const badgeK = pop(frame, 8, 6, 1.12);
  const topK = pop(frame, 14, 5, 1.15);
  const judgeK = pop(frame, 18, 6, 1.2);
  const nameFs = S * 0.105;
  const stripe = w * 0.015;
  const id = `vs-${seed}`;
  const panel = (side: 'l' | 'r') => {
    const sd = side === 'l' ? left : right;
    const off = side === 'l' ? -(1 - inL) * w * 0.6 : (1 - inR) * w * 0.6;
    const pts = side === 'l' ? `0,0 ${topX},0 ${botX},${h} 0,${h}` : `${topX},0 ${w},0 ${w},${h} ${botX},${h}`;
    return (
      <g transform={`translate(${off} 0)`}>
        <defs>
          <pattern id={`${id}-st${side}`} width={stripe * 2} height={stripe * 2} patternUnits="userSpaceOnUse" patternTransform={`rotate(${diagonalDeg - 90})`}>
            <rect width={stripe * 2} height={stripe * 2} fill={sd.color} />
            <rect width={stripe} height={stripe * 2} fill={sd.color2} />
          </pattern>
          <clipPath id={`${id}-cl${side}`}>
            <polygon points={pts} />
          </clipPath>
        </defs>
        <polygon points={pts} fill={`url(#${id}-st${side})`} />
        <g clipPath={`url(#${id}-cl${side})`}>
          {/* speckle */}
          {Array.from({length: 180}, (_, i) => (
            <circle key={i} cx={h01(i, seed, side === 'l' ? 1 : 2) * w} cy={h01(i, seed, 3) * h} r={(0.8 + h01(i, 4) * 1.4) * u} fill="#fff" opacity={0.1 + 0.12 * h01(i, 5)} />
          ))}
          {/* fighter */}
          {(() => {
            const fx = side === 'l' ? w * (portrait ? 0.5 : 0.22) : w * (portrait ? 0.5 : 0.79);
            const fy = portrait ? (side === 'l' ? h * 0.27 : h * 0.76) : h * 0.56;
            const fs = S * 0.34;
            if (sd.src)
              return (
                <foreignObject x={fx - fs / 2} y={fy - fs} width={fs} height={fs}>
                  <Img src={resolveSrc(sd.src)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
                </foreignObject>
              );
            return side === 'l' ? (
              <SparkCritter id={`${id}-cr`} x={fx} y={fy} s={fs * 0.62} color={left.color2 === ARCADE.red ? left.color : '#E66154'} shade="#9E2C36" eyes="angry" facing={1} />
            ) : (
              <SlimeOrb id={`${id}-sl`} x={fx} y={fy} r={fs * 0.42} eyes="oval" look={-0.4} />
            );
          })()}
        </g>
      </g>
    );
  };
  const namePlateY = portrait ? 0 : h * 0.88;
  return (
    <AbsoluteFill style={{background: ARCADE.ink, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${cx} ${cy}) scale(${push}) translate(${-cx} ${-cy})`} opacity={1}>
          {panel('l')}
          {panel('r')}
          <g opacity={dim < 1 ? 0.4 : 0}>
            <rect width={w} height={h} fill={ARCADE.ink} opacity={slam ? 0.4 : 0} />
          </g>
          {/* divider */}
          <line x1={topX} y1={0} x2={botX} y2={h} stroke="#fff" strokeWidth={0.004 * w} opacity={Math.min(inL, inR)} />
          {/* names */}
          {inL > 0.9 ? (
            <ExtrudeText x={portrait ? cx : w * 0.22} y={portrait ? h * 0.345 : namePlateY} size={nameFs} text={left.name.toUpperCase()} font={x58Fonts.lilita} fill="#F0EBD3" ink="#131031" depth={nameFs * 0.08} />
          ) : null}
          {inR > 0.9 ? (
            <ExtrudeText x={portrait ? cx : w * 0.79} y={portrait ? h * 0.875 : namePlateY} size={nameFs} text={right.name.toUpperCase()} font={x58Fonts.lilita} fill="#F0EBD3" ink="#2E0B1E" depth={nameFs * 0.08} />
          ) : null}
          {/* VS badge */}
          {badgeK > 0 ? (
            <g transform={`translate(${cx} ${cy}) scale(${badgeK})`}>
              <defs>
                <HalftoneDef id={`${id}-bht`} size={8 * u} color="#2A2A50" r={0.3} />
              </defs>
              <circle r={S * 0.135} fill="#03011B" stroke="#F3D88A" strokeWidth={2 * u} />
              <circle r={S * 0.135} fill={`url(#${id}-bht)`} opacity={0.5} />
              <path d={`M${S * 0.02} ${-S * 0.125} A${S * 0.125} ${S * 0.125} 0 1 0 ${S * 0.02} ${S * 0.125} A${S * 0.1} ${S * 0.125} 0 1 1 ${S * 0.02} ${-S * 0.125}Z`} fill="#F3CE6E" opacity={0.95} />
              <ExtrudeText x={0} y={S * 0.055} size={S * 0.15} text={badgeText} font={x58Fonts.lilita} gradient={['#F9EBA0', '#F8CF6B', '#F1A64F']} id={`${id}-vsg`} ink="#1A1430" depth={S * 0.012} skew={-10} />
            </g>
          ) : null}
          {/* top word */}
          {topText && topK > 0 ? (
            <g transform={`translate(${cx + S * 0.01} ${portrait ? h * 0.08 : h * 0.17}) scale(${topK})`}>
              <ExtrudeText x={0} y={0} size={S * 0.1} text={topText} font={x58Fonts.bangers} fill="#FCFAE3" ink="#070224" depth={S * 0.009} skew={-4} letterSpacing={2 * u} />
            </g>
          ) : null}
          {/* judges: tiny star + sun below the badge */}
          {judgeK > 0 ? (
            <g transform={`translate(${cx} ${portrait ? cy + S * 0.16 : h * 0.86}) scale(${judgeK}) rotate(${Math.sin(frame * 0.2) * 6})`}>
              <path d={star4(S * 0.022, 0.35)} transform={`translate(${-S * 0.032} 0) rotate(${Math.sin(frame * 0.25) * 10})`} fill="#EDEAF5" stroke="#1A1430" strokeWidth={1.5 * u} />
              <g transform={`translate(${S * 0.032} 0) rotate(${Math.cos(frame * 0.22) * 10})`}>
                <circle r={S * 0.016} fill="#F6CE4F" stroke="#1A1430" strokeWidth={1.5 * u} />
                {Array.from({length: 8}, (_, i) => (
                  <line key={i} x1={0} y1={-S * 0.02} x2={0} y2={-S * 0.028} stroke="#F6CE4F" strokeWidth={2 * u} transform={`rotate(${i * 45})`} />
                ))}
                <circle cx={-S * 0.005} cy={-S * 0.003} r={S * 0.0025} fill="#1A1430" />
                <circle cx={S * 0.005} cy={-S * 0.003} r={S * 0.0025} fill="#1A1430" />
              </g>
            </g>
          ) : null}
          {/* FIGHT! slam */}
          {slam ? (
            <g>
              <g opacity={0.35}>
                {Array.from({length: 54}, (_, i) => {
                  const a = (i / 54) * Math.PI * 2;
                  const r0 = S * (0.24 + 0.1 * h01(i, 3, seed));
                  const r1 = Math.max(w, h) * 0.8;
                  return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke="#fff" strokeWidth={(1 + 2.5 * h01(i, 7)) * u} />;
                })}
              </g>
              <g transform={`translate(${cx} ${cy + S * 0.03}) scale(${1.4 - 0.4 * easeOutCubic(slamK)}) rotate(-6)`}>
                <ExtrudeText x={0} y={0} size={S * 0.24} text={slamText} font={x58Fonts.bangers} gradient={['#FCFAE3', '#F8CF6B', '#F1A64F']} id={`${id}-fg`} ink="#070224" depth={S * 0.018} skew={0} letterSpacing={3 * u} />
              </g>
            </g>
          ) : null}
        </g>
        {grain ? <SprayGrain w={w} h={h} u={u} frame={frame} count={700} seed={seed} opacity={0.35} /> : null}
      </svg>
    </AbsoluteFill>
  );
};

export const vsSplash = defineMotion<Props>({
  id: 'vs-splash',
  title: 'VS splash',
  category: 'game',
  description:
    'A fighting-game versus card: blue and red striped panels slam shut along a steep diagonal with a white divider, a dark VS badge with a gold crescent springs in, a brush word pops above, judge mascots wobble below, and "FIGHT!" slams in over radial speed lines while the card dims.',
  source: ['video x7 12.47-14.55 s (VS card + FIGHT! slam) — original fighters'],
  useFor: 'Any A-vs-B comparison (products, models, plans, teams), sports / esports promos and battle intros.',
  durationInFrames: 90,
  defaultProps: {
    left: {name: 'Ember', color: '#D21851', color2: '#AE1549'},
    right: {name: 'Splash', color: '#152FA2', color2: '#2349CC'},
    badgeText: 'VS',
    topText: 'SHOWDOWN',
    slamText: 'FIGHT!',
    slamAt: 52,
    diagonalDeg: 70,
    grain: true,
    seed: 7,
  },
  propDocs: {
    left: 'left fighter {name, color, color2 (stripe tones), src? (portrait image; default an original critter)}',
    right: 'right fighter (default an original slime orb)',
    badgeText: 'text in the round centre badge',
    topText: 'word above the badge ("" = none)',
    slamText: 'word slammed over everything at slamAt ("" with slamAt 0 = never)',
    slamAt: 'frame of the slam (0 = none)',
    diagonalDeg: 'split angle from horizontal',
    grain: 'spray-grain speckle over everything',
    seed: 'speckle seed',
  },
  component: VsSplash,
  tags: ['versus', 'vs', 'fight', 'splash', 'arcade', 'fighting game', 'comparison', 'stripes', 'badge', 'slam', 'speed lines', 'game', 'halftone', 'comic'],
});
