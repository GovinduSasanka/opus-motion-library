import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {hash01, rgba, shade} from '../../core/r2-pr2-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Video-game overlay: health / mana / xp bars that drain in steps with a lagging white damage ghost, a score that
 * counts up, a combo counter that slams (scale 1.4 -> 1 with shake), a radar minimap, a kill feed and a level-up
 * banner. Three skins: arcade, modern, pixel. Set `background: "transparent"` to overlay it on gameplay footage.
 */
type Bar = {label: string; color: string; from: number; to: number; steps: number[]};
type Props = {
  bars: Bar[];
  score: number;
  comboAt: number[];
  feed: string[];
  feedAt: number;
  levelUp: string;
  levelAt: number;
  level: number;
  minimap: boolean;
  theme: string;
  accent: string;
  background: string;
  scoreLabel: string;
};

const fmt = (n: number) => String(Math.round(n)).padStart(7, '0');

const GameHud: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const th = P.theme === 'modern' || P.theme === 'pixel' ? P.theme : 'arcade';
  const font = th === 'arcade' ? fonts.display : th === 'pixel' ? fonts.mono : fonts.sans;
  const edge = (th === 'pixel' ? 4 : 3) * u;
  const pad = w * (portrait ? 0.06 : 0.04);
  const barW = portrait ? w * 0.4 : Math.min(w * 0.3, 520 * u);
  const barH = (th === 'modern' ? 18 : 30) * u;
  const strokeTxt = th === 'arcade' ? {WebkitTextStroke: `${2.5 * u}px #0a0a14`, paintOrder: 'stroke fill' as const} : {};

  // ---- bar state ----
  const barState = P.bars.map((b) => {
    const steps = b.steps.length ? b.steps : [60];
    const gain = b.to > b.from;
    const d = (b.to - b.from) / steps.length;
    let val = b.from;
    let ghost = b.from;
    let lastHit = -999;
    steps.forEach((s) => {
      val += d * ease.out(prog(frame, s, s + 10, (t) => t));
      ghost += d * ease.inOut(prog(frame, s + 9, s + 26, (t) => t));
      if (frame >= s) lastHit = Math.max(lastHit, s);
    });
    return {b, val, ghost: gain ? val : ghost, age: frame - lastHit, gain};
  });
  const hpHit = barState[0] && !barState[0].gain ? barState[0].age : 999;

  // ---- combo + score ----
  const ticks = P.comboAt.filter((t) => frame >= t);
  const nCombo = ticks.length;
  const lastTick = ticks.length ? ticks[ticks.length - 1] : -999;
  const cAge = frame - lastTick;
  const comboFade = 1 - ease.in(prog(frame, (P.comboAt[P.comboAt.length - 1] ?? 0) + 34, (P.comboAt[P.comboAt.length - 1] ?? 0) + 48, (t) => t));
  const cScale = 1 + 0.4 * Math.exp(-cAge / 2.8) * (cAge < 12 ? 1 : 0);
  const cShake = cAge < 10 ? (hash01(cAge, nCombo, 4) * 2 - 1) * 8 * u * Math.exp(-cAge / 3) : 0;
  const weights = P.comboAt.map((_, i) => i + 1);
  const wsum = weights.reduce((a, b) => a + b, 0) || 1;
  let score = 0;
  P.comboAt.forEach((t, i) => {
    score += P.score * (weights[i] / wsum) * ease.out(prog(frame, t + 2, t + 14, (x) => x));
  });
  const lastScoreTick = Math.max(-999, ...P.comboAt.filter((t) => frame >= t));
  const scorePop = 1 + 0.12 * Math.exp(-(frame - lastScoreTick) / 4) * (frame >= lastScoreTick ? 1 : 0);

  // ---- level up ----
  const lvP = ease.back(prog(frame, P.levelAt, P.levelAt + 14, (t) => t));
  const lvOut = ease.in(prog(frame, P.levelAt + 70, P.levelAt + 84, (t) => t));
  const lvShow = P.levelUp && lvP > 0 && lvOut < 1;
  const levelNow = P.level + (frame >= P.levelAt ? 1 : 0);
  const badgePop = 1 + 0.35 * Math.exp(-(frame - P.levelAt) / 5) * (frame >= P.levelAt ? 1 : 0);

  // ---- feed ----
  const feedItems = P.feed.map((t, i) => {
    const s = P.feedAt + i * 26;
    return {t, i, s, inP: ease.out(prog(frame, s, s + 9, (x) => x)), outP: ease.in(prog(frame, s + 84, s + 96, (x) => x))};
  }).filter((f) => f.inP > 0 && f.outP < 1);
  const visFeed = feedItems.slice(-4);

  // ---- minimap ----
  const mmR = (portrait ? 120 : 112) * u;
  const mmCx = pad + mmR;
  const mmCy = h - pad - mmR;
  const sweep = (frame * 5) % 360;
  const blips = Array.from({length: 7}, (_, i) => {
    const r = 0.28 + hash01(i, 1) * 0.6;
    const a = hash01(i, 2) * Math.PI * 2 + frame * (0.004 + 0.006 * hash01(i, 3)) * (i % 2 ? 1 : -1);
    const ang = ((a * 180) / Math.PI) % 360;
    const pass = (((sweep - ang) % 360) + 360) % 360;
    return {x: mmCx + Math.cos(a) * r * mmR * 0.92, y: mmCy + Math.sin(a) * r * mmR * 0.92, glow: Math.max(0, 1 - pass / 120), ally: i === 5};
  });

  const dark = th !== 'modern';
  const panel = th === 'modern' ? 'rgba(255,255,255,0.1)' : 'rgba(8,10,24,0.72)';
  const border = th === 'arcade' ? '#0a0a14' : th === 'pixel' ? '#fff' : 'rgba(255,255,255,0.22)';
  const cornerR = th === 'pixel' ? 0 : th === 'arcade' ? 8 * u : 16 * u;

  const barEl = (s: (typeof barState)[0], i: number) => {
    const {b, val, ghost, age} = s;
    const shake = age >= 0 && age < 9 && !s.gain ? (hash01(age, i, 6) * 2 - 1) * 5 * u * Math.exp(-age / 3) : 0;
    const segs = th === 'pixel' ? `repeating-linear-gradient(90deg, #000 0 ${3 * u}px, transparent ${3 * u}px ${barH * 0.62}px)` : undefined;
    const flash = age >= 0 && age < 4 && !s.gain ? 0.55 : 0;
    return (
      <div key={b.label} style={{marginBottom: (th === 'modern' ? 20 : 16) * u, transform: `translateX(${shake}px)`}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: font, fontSize: (th === 'pixel' ? 18 : 20) * u, fontWeight: 700, letterSpacing: 2 * u, color: '#fff', marginBottom: 5 * u, ...strokeTxt}}>
          <span>{b.label}</span>
          <span style={{opacity: 0.85}}>{Math.round(val * 100)}</span>
        </div>
        <div style={{position: 'relative', width: barW, height: barH, background: 'rgba(0,0,0,0.62)', border: th === 'modern' ? 'none' : `${edge}px solid ${border}`, borderRadius: th === 'modern' ? 99 : cornerR * 0.5, transform: th === 'arcade' ? 'skewX(-14deg)' : undefined, overflow: 'hidden', boxShadow: th === 'arcade' ? `${3 * u}px ${4 * u}px 0 rgba(0,0,0,0.5)` : th === 'pixel' ? `${4 * u}px ${4 * u}px 0 #000` : `0 ${6 * u}px ${18 * u}px rgba(0,0,0,0.3)`}}>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${clamp(ghost) * 100}%`, background: '#fff', opacity: 0.92}} />
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${clamp(val) * 100}%`, background: th === 'modern' ? `linear-gradient(90deg, ${shade(b.color, -0.15)}, ${shade(b.color, 0.25)})` : b.color, boxShadow: th === 'arcade' ? `0 0 ${14 * u}px ${rgba(b.color, 0.8)}` : undefined}} />
          {th === 'arcade' && <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: '38%', background: 'rgba(255,255,255,0.32)'}} />}
          {segs && <div style={{position: 'absolute', inset: 0, background: segs, opacity: 0.55}} />}
          {flash > 0 && <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash}} />}
        </div>
      </div>
    );
  };

  const hpFlash = hpHit < 10 ? 0.32 * Math.exp(-hpHit / 4) : 0;
  // backdrop
  const horizon = h * 0.55;
  return (
    <AbsoluteFill style={{background: P.background === 'transparent' ? undefined : `linear-gradient(180deg, #0c1030 0%, #231046 55%, #2d1250 ${(horizon / h) * 100}%, #0a0b1c 100%)`, fontFamily: font, overflow: 'hidden'}}>
      {P.background !== 'transparent' && (
        <Svg>
          <circle cx={w * 0.5} cy={horizon} r={Math.min(w, h) * 0.22} fill="#ff5fa8" opacity={0.28} />
          <rect x={0} y={horizon} width={w} height={h - horizon} fill="#0a0b1c" />
          {Array.from({length: 11}, (_, i) => {
            const t = (((i + (frame * 0.05) % 1) / 11));
            const y = horizon + (h - horizon) * t * t;
            return <line key={i} x1={0} x2={w} y1={y} y2={y} stroke="#6a4bff" strokeOpacity={0.15 + 0.5 * t} strokeWidth={(1 + 3 * t) * u} />;
          })}
          {Array.from({length: 17}, (_, i) => {
            const k = (i - 8) / 8;
            return <line key={i} x1={w / 2 + k * w * 0.06} y1={horizon} x2={w / 2 + k * w * 1.2} y2={h} stroke="#6a4bff" strokeOpacity={0.35} strokeWidth={2 * u} />;
          })}
          {Array.from({length: 40}, (_, i) => (
            <circle key={i} cx={hash01(i, 8) * w} cy={((hash01(i, 9) * h * 0.55 - frame * (0.3 + hash01(i, 4)) + h) % (h * 0.55))} r={(1 + hash01(i, 5) * 2) * u} fill="#fff" opacity={0.25 + 0.4 * hash01(i, 7)} />
          ))}
        </Svg>
      )}
      {hpFlash > 0 && <div style={{position: 'absolute', inset: 0, background: `radial-gradient(70% 70% at 50% 50%, rgba(255,0,40,0) 40%, rgba(255,20,50,${hpFlash * 2}) 100%)`}} />}

      {/* bars + level badge */}
      <div style={{position: 'absolute', left: pad, top: pad, display: 'flex', gap: 22 * u, alignItems: 'flex-start'}}>
        <div style={{width: 84 * u, height: 84 * u, flex: 'none', borderRadius: th === 'pixel' ? 0 : '50%', background: `linear-gradient(135deg, ${P.accent}, ${shade(P.accent, -0.45)})`, border: `${edge}px solid ${th === 'modern' ? 'rgba(255,255,255,0.5)' : border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: font, fontWeight: 800, transform: `scale(${badgePop})`, boxShadow: th === 'pixel' ? `${4 * u}px ${4 * u}px 0 #000` : `0 ${6 * u}px ${16 * u}px rgba(0,0,0,0.4)`, ...strokeTxt}}>
          <span style={{fontSize: 14 * u, letterSpacing: 2 * u, lineHeight: 1}}>LV</span>
          <span style={{fontSize: 38 * u, lineHeight: 1}}>{levelNow}</span>
        </div>
        <div style={{paddingTop: 4 * u}}>{barState.map(barEl)}</div>
      </div>

      {/* score */}
      <div style={{position: 'absolute', right: pad, top: pad, textAlign: 'right', fontFamily: font, color: '#fff'}}>
        <div style={{fontSize: 20 * u, letterSpacing: 4 * u, fontWeight: 700, opacity: 0.8, ...strokeTxt}}>{P.scoreLabel}</div>
        <div style={{fontSize: (portrait ? 46 : 64) * u, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: 2 * u, transform: `scale(${scorePop})`, transformOrigin: '100% 50%', color: th === 'modern' ? '#fff' : '#ffe27a', textShadow: th === 'pixel' ? `${4 * u}px ${4 * u}px 0 #000` : th === 'arcade' ? `0 ${4 * u}px 0 #7a3b00` : 'none', ...strokeTxt}}>{fmt(score)}</div>
      </div>

      {/* kill feed */}
      <div style={{position: 'absolute', right: pad, top: pad + (portrait ? 140 : 150) * u, width: w * (portrait ? 0.6 : 0.3), display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 * u}}>
        {visFeed.map((f) => (
          <div key={f.i} style={{transform: `translateX(${(1 - f.inP) * 60 * u + f.outP * 80 * u}px)`, opacity: f.inP * (1 - f.outP), background: panel, border: th === 'modern' ? `${1.5 * u}px solid ${border}` : `${edge * 0.7}px solid ${border}`, borderRadius: cornerR * 0.6, padding: `${8 * u}px ${16 * u}px`, fontFamily: font, fontWeight: 700, fontSize: 22 * u, color: '#fff', letterSpacing: u, backdropFilter: th === 'modern' ? 'blur(6px)' : undefined, whiteSpace: 'nowrap'}}>
            <span style={{color: P.accent}}>{f.t.split('>')[0]}</span>
            {f.t.includes('>') && <span style={{opacity: 0.6}}>{'  ▸  '}</span>}
            <span>{f.t.split('>').slice(1).join('>')}</span>
          </div>
        ))}
      </div>

      {/* combo */}
      {nCombo >= 2 && comboFade > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: h * (portrait ? 0.42 : 0.4), textAlign: 'center', opacity: comboFade, transform: `translateX(${cShake}px) scale(${cScale}) rotate(${-4 + (cAge < 6 ? (hash01(cAge, 2, 1) - 0.5) * 3 : 0)}deg)`, fontFamily: font, color: th === 'modern' ? '#fff' : '#fff3a8'}}>
          <div style={{fontSize: (portrait ? 150 : 160) * u, fontWeight: 800, lineHeight: 0.95, letterSpacing: 2 * u, textShadow: th === 'pixel' ? `${6 * u}px ${6 * u}px 0 #000` : th === 'arcade' ? `0 ${8 * u}px 0 #a3360a, 0 0 ${30 * u}px ${rgba(P.accent, 0.8)}` : `0 0 ${40 * u}px ${rgba(P.accent, 0.9)}`, ...strokeTxt}}>
            {nCombo}x
          </div>
          <div style={{fontSize: 50 * u, fontWeight: 800, letterSpacing: 10 * u, color: P.accent, ...strokeTxt}}>COMBO</div>
        </div>
      )}

      {/* level up banner */}
      {lvShow && (
        <div style={{position: 'absolute', left: 0, right: 0, top: h * 0.2, height: 150 * u, transform: `translateY(${(1 - lvP) * -120 * u - lvOut * 160 * u}px)`, opacity: 1 - lvOut, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(90deg, rgba(0,0,0,0), ${rgba(P.accent, 0.92)} 22%, ${rgba(shade(P.accent, -0.3), 0.92)} 78%, rgba(0,0,0,0))`}}>
          <div style={{textAlign: 'center', fontFamily: font, color: '#fff'}}>
            <div style={{fontSize: (portrait ? 84 : 92) * u, fontWeight: 800, letterSpacing: 8 * u, lineHeight: 1, ...strokeTxt, textShadow: th === 'pixel' ? `${5 * u}px ${5 * u}px 0 #000` : `0 ${5 * u}px 0 rgba(0,0,0,0.35)`}}>{P.levelUp}</div>
            <div style={{fontSize: 28 * u, letterSpacing: 6 * u, marginTop: 6 * u, opacity: 0.95, fontWeight: 700}}>{`LEVEL ${levelNow}`}</div>
          </div>
        </div>
      )}

      {/* minimap */}
      {P.minimap && (
        <Svg>
          <defs>
            <clipPath id="gamehud-mm">
              <circle cx={mmCx} cy={mmCy} r={mmR} />
            </clipPath>
          </defs>
          <circle cx={mmCx} cy={mmCy} r={mmR} fill={th === 'modern' ? 'rgba(255,255,255,0.12)' : 'rgba(6,16,18,0.78)'} />
          <g clipPath="url(#gamehud-mm)">
            {[0.33, 0.66, 1].map((k) => (
              <circle key={k} cx={mmCx} cy={mmCy} r={mmR * k} fill="none" stroke="#5cf2b0" strokeOpacity={0.25} strokeWidth={1.5 * u} />
            ))}
            <line x1={mmCx - mmR} x2={mmCx + mmR} y1={mmCy} y2={mmCy} stroke="#5cf2b0" strokeOpacity={0.2} strokeWidth={1.5 * u} />
            <line y1={mmCy - mmR} y2={mmCy + mmR} x1={mmCx} x2={mmCx} stroke="#5cf2b0" strokeOpacity={0.2} strokeWidth={1.5 * u} />
            <path d={`M${mmCx},${mmCy} L${mmCx + Math.cos(((sweep - 40) * Math.PI) / 180) * mmR},${mmCy + Math.sin(((sweep - 40) * Math.PI) / 180) * mmR} A${mmR},${mmR} 0 0 1 ${mmCx + Math.cos((sweep * Math.PI) / 180) * mmR},${mmCy + Math.sin((sweep * Math.PI) / 180) * mmR} Z`} fill="#5cf2b0" opacity={0.22} />
            {blips.map((b, i) => (
              <circle key={i} cx={b.x} cy={b.y} r={(b.ally ? 5 : 5.5) * u * (1 + b.glow * 0.5)} fill={b.ally ? '#5cb8ff' : '#ff4d5e'} opacity={0.35 + 0.65 * b.glow} />
            ))}
          </g>
          <path d={`M${mmCx},${mmCy - 9 * u} L${mmCx + 7 * u},${mmCy + 8 * u} L${mmCx},${mmCy + 4 * u} L${mmCx - 7 * u},${mmCy + 8 * u}Z`} fill="#fff" />
          <circle cx={mmCx} cy={mmCy} r={mmR} fill="none" stroke={border} strokeWidth={edge} />
        </Svg>
      )}
    </AbsoluteFill>
  );
};

export const gameHud = defineMotion<Props>({
  id: 'game-hud',
  title: 'Game HUD (bars, score, combo, minimap)',
  category: 'hud',
  description:
    'A video-game overlay: health, mana and xp bars that drain in eased steps with a lagging white damage ghost and a red screen pulse, a level badge, a score that counts up in pops, a combo counter that slams from 1.4x with shake, a sweeping radar minimap with blips, a kill feed that slides in and out and a LEVEL UP banner; three skins (arcade, modern, pixel).',
  source: ['prompt corpus x24 (health bar drain with ghost, combo slam, minimap, kill feed, level-up)'],
  useFor: 'Game trailers, gamified product demos and esports-style highlights; `background: "transparent"` overlays it on footage. Rename the labels and feed text for your own story.',
  durationInFrames: 210,
  defaultProps: {
    bars: [
      {label: 'HP', color: '#ff4a5a', from: 1, to: 0.36, steps: [46, 96, 140]},
      {label: 'MP', color: '#3fa9ff', from: 1, to: 0.5, steps: [70, 118]},
      {label: 'XP', color: '#ffd23f', from: 0.15, to: 1, steps: [52, 84, 116, 146]},
    ],
    score: 128450,
    comboAt: [46, 62, 78, 94, 110, 126],
    feed: ['You>Drone 04', 'You>Brute 11', 'Mira>Sentry 02', 'You>Warden'],
    feedAt: 56,
    levelUp: 'LEVEL UP!',
    levelAt: 150,
    level: 7,
    minimap: true,
    theme: 'arcade',
    accent: '#ff5a3c',
    background: '#0c1030',
    scoreLabel: 'SCORE',
  },
  propDocs: {
    bars: '[{label, color, from, to, steps:[frames]}] each step moves the bar an equal share from `from` to `to` (drain = white ghost lags behind)',
    score: 'final score (counts up on every combo tick)',
    comboAt: 'frames of the combo ticks (the counter shows from the 2nd)',
    feed: "kill-feed lines, 'Actor>Target'",
    feedAt: 'frame the first feed line appears (26 frames between lines)',
    levelUp: 'banner text ("" = no banner)',
    levelAt: 'frame of the level-up banner',
    level: 'level shown on the badge before the level-up',
    minimap: 'show the radar minimap',
    theme: "'arcade' | 'modern' | 'pixel'",
    accent: 'badge / combo / feed accent colour',
    background: 'backdrop colour ("transparent" to overlay on footage)',
    scoreLabel: 'label above the score',
  },
  component: GameHud,
  tags: ['game', 'hud', 'health bar', 'mana', 'score', 'combo', 'minimap', 'radar', 'kill feed', 'level up', 'overlay', 'arcade', 'pixel', 'esports', 'trailer', 'gamified', 'ui', 'damage'],
});
