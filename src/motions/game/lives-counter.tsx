// Adapted from lemo-opuscar/styles/microgame/demo/hud.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {TOON, ToonPart, ToonStage, ToonText, toonStar} from '../../core/r2-la3c-kit';
import {TAU, cl, h1, lf, lerp, mixC, popCurve, sstep} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * microgame lives board: a dark rounded panel (ink outline, hard shadow) with hero-head icons. On a loss one icon
 * cracks over 5 frames (ink crack line + shards), shakes and greys; the last remaining life blinks at 2 Hz under an
 * optional "top spot" light; a gain re-lights an icon with a pop. Slam captions announce every event.
 */
type Ev = {t: number; delta: number};
type Props = {
  lives: number;
  max: number;
  icon: string;
  events: Ev[];
  spotlight: boolean;
  stage: boolean;
  label: string;
  lossText: string;
  lastText: string;
  gainText: string;
  panel: string;
  seed: number;
  background: string;
  rayColor: string;
  ink: string;
  textColor: string;
  tabColor: string;
  iconColor: string;
  lossColor: string;
  lastColor: string;
  gainColor: string;
};

const CIRCLE = (r: number) => `M${-r} 0 A${r} ${r} 0 1 0 ${r} 0 A${r} ${r} 0 1 0 ${-r} 0 Z`;
const rr = (x: number, y: number, w: number, h: number, r: number) => `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const CRACK: [number, number][] = [
  [10, -48],
  [-3, -26],
  [12, -10],
  [-8, 8],
  [5, 26],
  [-10, 48],
];
const GREY = '#8A86A0';

const Head: React.FC<{kind: string; id: string; grey: number; dead: boolean; crack: number; hot: number; tint?: string; ink?: string}> = ({kind, id, grey, dead, crack, hot, tint, ink = TOON.ink}) => {
  const t = (c: string) => mixC(c, GREY, grey);
  const nC = crack * (CRACK.length - 1);
  const fullC = Math.floor(nC);
  const crackPts: [number, number][] = CRACK.slice(0, fullC + 1);
  if (fullC < CRACK.length - 1) crackPts.push([lerp(CRACK[fullC][0], CRACK[fullC + 1][0], nC - fullC), lerp(CRACK[fullC][1], CRACK[fullC + 1][1], nC - fullC)]);
  const crackD = crackPts.length > 1 ? 'M' + crackPts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L') : '';
  return (
    <g>
      {kind === 'heart' ? (
        <ToonPart id={`${id}-b`} d="M0 44 C-64 -2 -44 -54 0 -26 C44 -54 64 -2 0 44 Z" fill={t(tint || TOON.red)} shade={t(tint ? mixC(tint, '#000000', 0.3) : '#B5163C')} sh={7} sw={5} />
      ) : kind === 'star' ? (
        <ToonPart
          id={`${id}-b`}
          d={'M' + Array.from({length: 10}, (_, i) => {
            const a = (i / 10) * TAU - Math.PI / 2;
            const r = i % 2 ? 24 : 54;
            return `${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r + 4).toFixed(1)}`;
          }).join('L') + 'Z'}
          fill={t(tint || TOON.gold)}
          shade={t(tint ? mixC(tint, '#000000', 0.3) : '#D99A12')}
          sh={7}
          sw={5}
        />
      ) : (
        <g>
          <line x1={0} y1={-44} x2={0} y2={-60} stroke={ink} strokeWidth={5} strokeLinecap="round" />
          <circle cx={0} cy={-64} r={9} fill={t(TOON.magenta)} stroke={TOON.ink} strokeWidth={4.5} />
          <circle cx={-47} cy={6} r={10} fill={t(TOON.gold)} stroke={TOON.ink} strokeWidth={4.5} />
          <circle cx={47} cy={6} r={10} fill={t(TOON.gold)} stroke={TOON.ink} strokeWidth={4.5} />
          <ToonPart id={`${id}-b`} d={CIRCLE(46)} fill={t(tint || TOON.cream)} shade={t(tint ? mixC(tint, '#000000', 0.2) : '#BDB2D6')} sh={7} sw={5} />
          <ToonPart id={`${id}-v`} d="M-33 4 Q-33 -21 0 -21 Q33 -21 33 4 Q33 29 0 29 Q-33 29 -33 4 Z" fill={t('#2A4FA3')} shade={t('#1B2F6E')} sh={5} sw={4.5} />
          <path d="M-24 -6 Q-18 -15 -6 -16" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.85 - grey * 0.4} />
          {dead ? (
            <g stroke="#fff" strokeWidth={4} strokeLinecap="round">
              <path d="M-19 -2 L-9 8 M-9 -2 L-19 8 M9 -2 L19 8 M19 -2 L9 8" />
            </g>
          ) : (
            <g>
              <circle cx={-13} cy={4} r={4.6} fill="#fff" />
              <circle cx={13} cy={4} r={4.6} fill="#fff" />
              <path d="M-7 16 Q0 22 7 16" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" />
            </g>
          )}
        </g>
      )}
      {hot > 0 && <circle r={58} fill="none" stroke={TOON.gold} strokeWidth={5} opacity={hot} />}
      {crack > 0 && crackD && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={crackD} stroke={ink} strokeWidth={7} />
          <path d={crackD} stroke="#fff" strokeWidth={2.4} transform="translate(-2 -2)" opacity={0.85} />
        </g>
      )}
    </g>
  );
};

const LivesCounter: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = `lives-${p.seed}`;
  const max = Math.max(1, Math.round(p.max));
  const evs = [...(p.events || [])].sort((a, b) => a.t - b.t);

  // replay the events: per icon, when did it last change and what is it now
  let L = Math.min(max, p.lives);
  const since: number[] = Array.from({length: max}, () => -999);
  const alive: boolean[] = Array.from({length: max}, (_, i) => i < L);
  let lastEv: {f: number; delta: number; lives: number} | null = null;
  evs.forEach((e) => {
    const f = e.t * 30;
    if (f > frame) return;
    const L1 = cl(L + e.delta, 0, max);
    for (let i = Math.min(L, L1); i < Math.max(L, L1); i++) {
      alive[i] = e.delta > 0;
      since[i] = f;
    }
    if (L1 !== L) lastEv = {f, delta: L1 - L, lives: L1};
    L = L1;
  });

  const k = Math.min(0.2 * Math.min(w, h), (w * 0.78) / (max * 1.38)) / 100;
  const gap = 138 * k;
  const pw = max * gap + 54 * k;
  const ph = 190 * k;
  const cx = w / 2;
  const cy = h * (portrait ? 0.4 : 0.4);
  const px = cx - pw / 2;
  const py = cy - ph / 2;
  const enter = popCurve((frame - 2) / 30);
  const lastAlive = L === 1 ? alive.findIndex((a) => a) : -1;
  const blink = L === 1 && frame > 12 ? (Math.floor(frame / 7.5) % 2 === 0 ? 1 : 0) : 0;
  const spot = p.spotlight && L === 1 ? sstep(0, 14, frame - ((lastEv as any)?.f ?? 0)) : 0;

  // slam caption
  const ev = lastEv as {f: number; delta: number; lives: number} | null;
  const capAge = ev ? frame - ev.f : 999;
  const capText = ev ? (ev.delta > 0 ? p.gainText : ev.lives === 1 ? p.lastText : p.lossText) : '';
  const capCol = ev && ev.delta > 0 ? p.gainColor : ev && ev.lives === 1 ? p.lastColor : p.lossColor;
  const capK = capAge < 0 ? 0 : capAge < 3 ? lerp(1.7, 0.95, capAge / 3) : capAge < 8 ? lerp(0.95, 1, (capAge - 3) / 5) : 1;
  const capFade = capAge < 40 ? 1 : cl(1 - (capAge - 40) / 10);
  const rot = -5;

  return (
    <AbsoluteFill style={{background: p.stage ? p.background : 'transparent'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {p.stage && <ToonStage w={w} h={h} frame={frame} id={id} ground={p.background} ray={p.rayColor} />}
        {/* panel */}
        <g transform={`translate(${cx} ${cy}) scale(${Math.max(0.01, enter)}) translate(${-cx} ${-cy})`}>
          <ToonPart id={`${id}-panel`} d={rr(px, py, pw, ph, 28 * k)} fill={p.panel} shade="#0D0424" sh={8 * k} sw={7 * Math.max(0.8, u)} drop={11 * Math.max(0.8, u)} />
          <ToonPart id={`${id}-tab`} d={rr(px + 22 * k, py - 28 * k, 150 * k, 44 * k, 14 * k)} fill={p.tabColor} sh={4 * k} sw={5.5 * Math.max(0.8, u)} />
          <text x={px + 22 * k + 75 * k} y={py - 28 * k + 33 * k} textAnchor="middle" fontFamily={lf.lilita} fontSize={32 * k} fill={p.ink} letterSpacing={2 * k}>
            {p.label}
          </text>
          {/* top spot */}
          {spot > 0.01 && lastAlive >= 0 && (
            <g opacity={0.9 * spot}>
              <polygon points={`${px + 27 * k + (lastAlive + 0.5) * gap - 16 * k},${py - 80 * k} ${px + 27 * k + (lastAlive + 0.5) * gap + 16 * k},${py - 80 * k} ${px + 27 * k + (lastAlive + 0.5) * gap + 72 * k},${py + ph - 10 * k} ${px + 27 * k + (lastAlive + 0.5) * gap - 72 * k},${py + ph - 10 * k}`} fill="#FFF3B8" opacity={0.2} />
            </g>
          )}
          {Array.from({length: max}, (_, i) => {
            const ix = px + 27 * k + (i + 0.5) * gap;
            const iy = py + ph * 0.56;
            const sn = frame - since[i];
            const isAlive = alive[i];
            const introK = popCurve((frame - 6 - i * 5) / 30);
            let scale = Math.max(0.01, introK);
            let dy = 0;
            let dx = 0;
            let grey = isAlive ? 0 : 1;
            let crack = 0;
            if (!isAlive && sn >= 0 && sn < 999) {
              crack = cl(sn / 5);
              grey = sstep(4, 9, sn);
              if (sn < 18) dx = Math.sin(sn * 2.4) * 6 * k * (1 - sn / 18);
              dy = sstep(4, 14, sn) * 6 * k;
              scale *= 1 - 0.1 * sstep(4, 14, sn);
              if (sn < 5) scale *= 1 + 0.12 * (sn / 5);
            } else if (!isAlive) {
              crack = 1;
              dy = 6 * k;
              scale *= 0.9;
            }
            if (isAlive && sn >= 0 && sn < 40) scale *= 1 + (popCurve(sn / 30) - 1) * 0.9 + 0.0;
            const isLast = i === lastAlive;
            const blinkK = isLast ? blink : 0;
            if (isLast) scale *= 1 + 0.07 * blinkK;
            const shards = !isAlive && sn >= 3 && sn < 14 ? Array.from({length: 6}, (_, s) => ({a: h1(i, s, p.seed) * TAU, v: (30 + h1(s, i, 3) * 40) * k, s})) : [];
            return (
              <g key={i} transform={`translate(${ix + dx} ${iy + dy}) scale(${k * scale})`}>
                <Head kind={p.icon} id={`${id}-h${i}`} grey={grey} dead={!isAlive && grey > 0.5} crack={crack} hot={isLast ? 0.2 + 0.8 * blinkK : 0} tint={p.iconColor || undefined} ink={p.ink} />
                {shards.map((s) => {
                  const q = (sn - 3) / 11;
                  return <path key={s.s} d={toonStar(7, 0.3)} transform={`translate(${(Math.cos(s.a) * s.v * q * 3.4) / k} ${(Math.sin(s.a) * s.v * q * 3.4) / k + 30 * q * q}) rotate(${q * 200})`} fill="#fff" opacity={1 - q} />;
                })}
              </g>
            );
          })}
        </g>
        {/* slam caption */}
        {ev && capAge >= 0 && capFade > 0.01 && (
          <ToonText x={cx} y={py + ph + 100 * k} size={Math.min(72 * k, (w * 0.84) / (capText.length * 0.5))} text={capText} font={lf.titan} fill={p.textColor} ink={p.ink} drop={capCol} dropOff={9 * Math.max(0.8, u)} sw={16 * Math.max(0.8, u)} rotate={rot} scale={capK} opacity={capFade} />
        )}
      </svg>
    </AbsoluteFill>
  );
};

export const livesCounter = defineMotion<Props>({
  id: 'lives-counter',
  title: 'Lives counter',
  category: 'game',
  description:
    'A dark rounded toon panel (ink outline, hard shadow) with hero-head icons: on a loss one icon cracks in five frames, shards fly, it shakes and greys while a slam caption announces it; the last life blinks at 2 Hz under a top-spot light; a gain re-lights an icon with a pop.',
  source: ['lemo-opuscar styles/microgame STYLE.md "Lives as UI" + demo/hud.js (MIT, LemoLab)'],
  useFor: 'Battery / retries / chances metaphors, gamified explainers, quiz shows, "you only get three tries" beats.',
  durationInFrames: 240,
  defaultProps: {
    lives: 3,
    max: 3,
    icon: 'pilot',
    events: [
      {t: 1.4, delta: -1},
      {t: 3.4, delta: -1},
      {t: 6.0, delta: 1},
    ],
    spotlight: true,
    stage: true,
    label: 'LIVES',
    lossText: 'OUCH!',
    lastText: 'LAST LIFE!',
    gainText: '+1 LIFE',
    panel: '#1B0B45',
    seed: 2,
    background: TOON.ground,
    rayColor: '#3A1A78',
    ink: TOON.ink,
    textColor: '#ffffff',
    tabColor: TOON.gold,
    iconColor: '',
    lossColor: TOON.red,
    lastColor: TOON.orange,
    gainColor: TOON.green,
  },
  propDocs: {
    lives: 'lives at frame 0',
    max: 'number of icons',
    icon: 'pilot | heart | star',
    events: 'array of {t seconds, delta} (-1 = lose a life, +1 = gain one)',
    spotlight: 'top-spot light on the last remaining life',
    stage: 'paint the violet sunburst stage; false = transparent overlay',
    label: 'tab label on the panel',
    lossText: 'slam caption on a loss',
    lastText: 'slam caption when one life remains',
    gainText: 'slam caption on a gain',
    panel: 'panel fill colour',
    seed: 'shard seed',
    background: 'stage ground colour (stage=true)',
    rayColor: 'stage sunburst ray colour',
    ink: 'outline colour of the panel, icons, tab label',
    textColor: 'slam caption fill colour',
    tabColor: 'label tab colour',
    iconColor: "icon body colour ('' = the icon's own colour: heart red, star gold, pilot cream)",
    lossColor: 'caption hard-shadow colour on a loss',
    lastColor: 'caption hard-shadow colour when one life remains',
    gainColor: 'caption hard-shadow colour on a gain',
  },
  component: LivesCounter,
  tags: ['lives', 'life counter', 'hearts', 'game', 'hud', 'microgame', 'quiz', 'retries', 'chances', 'battery', 'crack', 'toon', 'hard shadow', 'blink', 'gamified', 'game show'],
});
