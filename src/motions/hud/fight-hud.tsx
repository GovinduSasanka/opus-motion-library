import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {ARCADE, ArcadeStage, ExtrudeText, SlimeOrb, SparkCritter, SprayGrain, easeOutCubic, lin, shadeHex, tweenKeys, x58Fonts} from '../../core/r2-x58-kit';

/**
 * x7 fight-hud: a two-player fighting-game HUD overlay — long slanted health bars top-left (red) and top-right
 * (blue) with a 0.12 W centre gap for a crescent-moon emblem, italic caps names under the outer ends, bars that
 * drain with an easeOut front edge and a white "damage ghost" segment that catches up 8 frames later. Bars enter
 * in 2 frames then drift slightly. The default preview stages two original fighters on the neon arcade floor.
 */
type Player = {name: string; color: string; color2: string; hpKeys: number[][]};
type Props = {
  background: string;
  players: Player[];
  emblem: 'moon' | 'timer';
  timerFrom: number;
  skew: number;
  demoScene: boolean;
  grain: boolean;
  seed: number;
};

const FightHud: React.FC<Props> = ({background, players, emblem, timerFrom, skew, demoScene, grain, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const id = `fh-${seed}`;
  const topY = h * (portrait ? 0.045 : 0.06);
  const barH = h * 0.035 * (portrait ? 0.9 : 1);
  const gap = w * (portrait ? 0.16 : 0.12);
  const barW = (w - gap) / 2 - w * 0.035;
  const inK = easeOutCubic(lin(frame, 2, 4));
  const fsName = h * 0.028 * (portrait ? 0.85 : 1);
  const drift = Math.min(frame, 90) * 0.0001 * w;
  const bar = (p: Player, side: 'l' | 'r') => {
    const hp = tweenKeys(frame, p.hpKeys, 6);
    const ghost = tweenKeys(frame - 8, p.hpKeys, 12);
    const dir = side === 'l' ? 1 : -1;
    const x0 = side === 'l' ? w * 0.025 + (1 - inK) * -barW - drift : w - w * 0.025 - barW + (1 - inK) * barW + drift;
    const sk = side === 'l' ? -skew : skew;
    const frameC = '#0D2254';
    const grad = `${id}-g${side}`;
    const innerW = barW - 6 * u;
    return (
      <g transform={`translate(${x0} ${topY}) skewX(${sk})`}>
        <defs>
          <linearGradient id={grad} x1={side === 'l' ? '0' : '1'} y1="0" x2={side === 'l' ? '1' : '0'} y2="0">
            <stop offset="0%" stopColor={shadeHex(p.color, -0.25)} />
            <stop offset="100%" stopColor={p.color2} />
          </linearGradient>
        </defs>
        <rect x={-3 * u} y={-3 * u} width={barW + 6 * u} height={barH + 6 * u} fill={frameC} stroke="#060B24" strokeWidth={2 * u} />
        <rect x={0} y={0} width={innerW + 6 * u} height={barH} fill="#1A0F1E" />
        {/* ghost */}
        <rect x={side === 'l' ? 0 : innerW * (1 - ghost) + 6 * u} y={0} width={innerW * ghost} height={barH} fill="#F2E6E0" opacity={0.75} />
        {/* front */}
        <rect x={side === 'l' ? 0 : innerW * (1 - hp) + 6 * u} y={0} width={innerW * hp} height={barH} fill={`url(#${grad})`} />
        <rect x={side === 'l' ? 0 : innerW * (1 - hp) + 6 * u} y={barH * 0.1} width={innerW * hp} height={barH * 0.22} fill="#fff" opacity={0.35} />
      </g>
    );
  };
  const p0 = players[0];
  const p1 = players[1] ?? players[0];
  const floorY = h * 0.74;
  const hitP1 = p1.hpKeys.length > 1 ? p1.hpKeys[1][0] : 9999;
  const shake = frame >= hitP1 && frame < hitP1 + 3 ? (frame % 2 ? 4 : -4) * u : 0;
  return (
    <AbsoluteFill style={{background: demoScene ? ARCADE.bg : background, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        {demoScene ? (
          <g transform={`translate(${shake} 0)`}>
            <ArcadeStage id={`${id}-st`} w={w} h={h} u={u} frame={frame} floorY={floorY} />
            {(() => {
              // simple bout: critter dashes in and strikes, slime hops back
              const dashK = easeOutCubic(lin(frame, 20, 32));
              const hop = Math.max(0, Math.sin(Math.PI * lin(frame, 34, 52)));
              const sx = w * (0.32 + 0.18 * dashK);
              const slX = w * (0.68 + 0.08 * lin(frame, 34, 52));
              const sq = frame >= 52 && frame < 56 ? 1 : 0;
              return (
                <g>
                  <SparkCritter id={`${id}-cr`} x={sx} y={floorY} s={h * 0.2} color={p0.color2} shade={shadeHex(p0.color2, -0.35)} eyes="angry" lean={dashK * 8 - 4} facing={1} />
                  <SlimeOrb id={`${id}-sl`} x={slX} y={floorY - hop * h * 0.3} r={h * 0.105} sx={sq ? 1.45 : 1 - hop * 0.15} sy={sq ? 0.55 : 1 + hop * 0.2} color={p1.color2} shade={shadeHex(p1.color2, -0.3)} eyes={frame >= hitP1 ? 'ii' : 'oval'} look={-0.5} />
                  {dashK > 0 && dashK < 1
                    ? [0, 1, 2].map((i) => <circle key={i} cx={sx - w * 0.06 - i * w * 0.025} cy={floorY - h * 0.02} r={(10 - i * 2.5) * u} fill="#EDE8F2" opacity={0.5 - i * 0.13} />)
                    : null}
                </g>
              );
            })()}
          </g>
        ) : null}
        {bar(p0, 'l')}
        {bar(p1, 'r')}
        {/* emblem */}
        <g transform={`translate(${w / 2} ${topY + barH * 0.6}) scale(${easeOutCubic(lin(frame, 3, 8))})`}>
          <circle r={gap * 0.3} fill="#0A0A26" stroke="#F3D88A" strokeWidth={2 * u} />
          {emblem === 'moon' ? (
            <>
              <path d={`M${gap * 0.08} ${-gap * 0.26} A${gap * 0.26} ${gap * 0.26} 0 1 0 ${gap * 0.08} ${gap * 0.26} A${gap * 0.2} ${gap * 0.26} 0 1 1 ${gap * 0.08} ${-gap * 0.26}Z`} fill="#F3CE6E" />
              <circle cx={-gap * 0.05} cy={-gap * 0.03} r={gap * 0.018} fill="#0A0A26" />
              <circle cx={gap * 0.04} cy={-gap * 0.03} r={gap * 0.018} fill="#0A0A26" />
              <path d={`M${-gap * 0.03} ${gap * 0.05} q${gap * 0.03} ${gap * 0.025} ${gap * 0.06} 0`} stroke="#0A0A26" strokeWidth={2 * u} fill="none" />
            </>
          ) : (
            <text y={gap * 0.1} textAnchor="middle" fontFamily={x58Fonts.rajdhani} fontWeight={700} fontSize={gap * 0.3} fill="#F3CE6E">
              {Math.max(0, timerFrom - Math.floor(frame / fps))}
            </text>
          )}
        </g>
        {/* names */}
        <ExtrudeText x={w * 0.035} y={topY + barH + fsName * 1.5} size={fsName} text={p0.name.toUpperCase()} font={x58Fonts.lilita} anchor="start" fill="#FCFAE3" ink="#070224" depth={fsName * 0.08} />
        <ExtrudeText x={w * 0.965} y={topY + barH + fsName * 1.5} size={fsName} text={p1.name.toUpperCase()} font={x58Fonts.lilita} anchor="end" fill="#FCFAE3" ink="#070224" depth={fsName * 0.08} />
        {grain && demoScene ? <SprayGrain w={w} h={h} u={u} frame={frame} count={800} seed={seed} opacity={0.4} /> : null}
      </svg>
    </AbsoluteFill>
  );
};

export const fightHud = defineMotion<Props>({
  id: 'fight-hud',
  title: 'Fight HUD',
  category: 'hud',
  description:
    'A two-player fighting-game HUD: slanted red and blue health bars with a crescent-moon (or countdown) emblem between them and italic caps names, draining with a delayed white damage-ghost; the default preview stages two original fighters trading a hit on a neon arcade floor.',
  source: ['video x7 14.55-25.35 s (health bars, moon emblem, damage ghost) — original fighters'],
  useFor: 'Any head-to-head comparison staged as a game: benchmark battles, A/B tests, product duels; overlay-capable with background "transparent" and demoScene off.',
  durationInFrames: 120,
  defaultProps: {
    background: 'transparent',
    players: [
      {name: 'Ember', color: '#99322E', color2: '#CB665D', hpKeys: [[0, 1], [52, 0.72], [80, 0.55]]},
      {name: 'Splash', color: '#2567D2', color2: '#5AA1EC', hpKeys: [[0, 1], [56, 0.8], [90, 0.62]]},
    ],
    emblem: 'moon',
    timerFrom: 60,
    skew: 6,
    demoScene: true,
    grain: true,
    seed: 5,
  },
  propDocs: {
    background: "backdrop when demoScene is off ('transparent' = overlay)",
    players: 'two players {name, color, color2, hpKeys: [[frame, hp 0..1], …]} — hp eases 6 f, ghost follows 8 f later',
    emblem: "'moon' (crescent face) | 'timer' (counts down from timerFrom seconds)",
    timerFrom: 'timer start in seconds',
    skew: 'bar skew in degrees',
    demoScene: 'stage the neon floor and two original fighters behind the HUD (preview; turn off as an overlay)',
    grain: 'spray-grain speckle (demo scene only)',
    seed: 'grain seed',
  },
  component: FightHud,
  tags: ['fight', 'hud', 'health bars', 'arcade', 'fighting game', 'versus', 'overlay', 'game ui', 'timer', 'damage', 'duel', 'comparison'],
});
