import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, onTwos, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {mix, ramp, rgbaStr, vn1} from '../../core/r2-pr3-kit';

/**
 * Explosion burst. 'real': 2-frame white flash, fireball that swells in 12 frames then rolls (turbulent displaced
 * lobes cooling yellow -> red -> soot), dark smoke puffs rising, a shockwave ring that outruns the frame in ~10
 * frames, ballistic debris with streaks and drifting embers, camera shake. 'cartoon': spiky star flash, scalloped
 * ink-outlined fire clouds, thick ring, chunky debris, drawn on twos, optional comic text.
 */
type Props = {
  style: 'real' | 'cartoon';
  palette: 'fire' | 'plasma' | 'toxic';
  at: number;
  originX: number;
  originY: number;
  scale: number;
  debris: number;
  smoke: boolean;
  shake: number;
  text: string;
  seed: number;
  background: string;
};

const PAL = {
  fire: {core: '#FFF4C2', hot: '#FFC53D', mid: '#FF7A1A', cool: '#D63A12', soot: '#2A1410', glow: '#FF8A2B', ring: '#FFE2B0'},
  plasma: {core: '#F2FDFF', hot: '#7FE9FF', mid: '#3D8BFF', cool: '#7A3DFF', soot: '#120C2B', glow: '#4D9BFF', ring: '#BFEFFF'},
  toxic: {core: '#F6FFC8', hot: '#C8FF3D', mid: '#4FD13A', cool: '#1E8F4A', soot: '#0E1F12', glow: '#6BFF4D', ring: '#DFFFB0'},
} as const;

const blob = (cx: number, cy: number, r: number, bumps: number, amp: number, rot: number, spike = false) => {
  const n = bumps * (spike ? 2 : 8);
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rot;
    const k = spike ? (i % 2 === 0 ? 1 + amp : 1 - amp * 0.5) : 1 + amp * Math.abs(Math.sin((i / n) * bumps * Math.PI));
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * r * k).toFixed(1)} ${(cy + Math.sin(a) * r * k).toFixed(1)}`;
  }
  return d + 'Z';
};

const ExplosionBurst: React.FC<Props> = ({style, palette, at, originX, originY, scale, debris, smoke, shake, text, seed, background}) => {
  const rawFrame = useCurrentFrame();
  const cartoon = style === 'cartoon';
  const frame = cartoon ? onTwos(rawFrame, 2) : rawFrame;
  const {w, h, u} = useStage();
  const pal = PAL[palette] ?? PAL.fire;
  const ox = w * originX;
  const oy = h * originY;
  const S = Math.min(w, h) * 0.34 * scale;
  const diag = Math.hypot(w, h);
  const t = frame - at;
  const live = t >= 0;

  const lobes = useMemo(() => {
    const r = rng(seed);
    return Array.from({length: 15}, (_, i) => {
      const a = (i / 15) * Math.PI * 2 + r() * 0.4;
      return {a, d: 0.25 + r() * 0.55, s: 0.38 + r() * 0.3, ph: r() * 10, roll: (r() - 0.5) * 2, bumps: 5 + Math.floor(r() * 4)};
    });
  }, [seed]);
  const puffs = useMemo(() => {
    const r = rng(seed + 7);
    return Array.from({length: 22}, () => ({a: r() * Math.PI * 2, d: 0.15 + r() * 0.8, s: 0.28 + r() * 0.35, delay: r() * 14, rise: 0.4 + r() * 0.9, shade: r()}));
  }, [seed]);
  const parts = useMemo(() => {
    const r = rng(seed + 13);
    return Array.from({length: debris}, () => {
      const a = r() * Math.PI * 2;
      const sp = 0.9 + r() * 1.9;
      return {vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.7, size: 0.012 + r() * 0.03, spin: (r() - 0.5) * 0.7, kind: Math.floor(r() * 3), life: 40 + r() * 70, hot: r()};
    });
  }, [seed, debris]);
  const embers = useMemo(() => {
    const r = rng(seed + 29);
    return Array.from({length: 40}, () => ({a: r() * Math.PI * 2, d: r() * 0.9, vy: 0.2 + r() * 0.5, ph: r() * 9, s: 0.004 + r() * 0.007, delay: 10 + r() * 20}));
  }, [seed]);

  // camera shake
  const shakeAmt = live ? Math.exp(-t / 9) * shake * 22 * u : 0;
  const shx = shakeAmt * vn1(frame * 1.7, seed);
  const shy = shakeAmt * vn1(frame * 1.7 + 50, seed + 1);

  const flash = live ? Math.max(0, 1 - t / (cartoon ? 4 : 2.2)) : 0;
  const swell = prog(t, 0, 12, ease.expoOut);
  const roll = prog(t, 12, 72, ease.out);
  const cool = prog(t, 4, 80, ease.sine);
  const fade = 1 - prog(t, 56, 105, ease.in);
  const ringT = prog(t, 0, cartoon ? 12 : 10, ease.expoOut);
  const turbSeed = Math.floor(t / (cartoon ? 4 : 3)) + seed;
  const uid = 'xplo';

  const fireColor = (k: number) => ramp([[0, pal.core], [0.18, pal.hot], [0.5, pal.mid], [0.8, pal.cool], [1, pal.soot]], clampN(k));

  const smokeEls = smoke
    ? puffs.map((p, i) => {
        const tt = t - 6 - p.delay;
        if (tt < 0) return null;
        const gr = prog(tt, 0, 50, ease.out);
        const x = ox + Math.cos(p.a) * p.d * S * (0.7 + gr * 0.9);
        const y = oy + Math.sin(p.a) * p.d * S * 0.7 * (0.7 + gr * 0.6) - gr * p.rise * S * 0.75;
        const r = S * p.s * (0.5 + gr * 1.1);
        const a = prog(tt, 0, 10, ease.out) * (1 - prog(tt, 40, 100, ease.in)) * (cartoon ? 0.95 : 0.78);
        const col = cartoon ? mix('#6C6C78', '#B9B9C4', p.shade) : mix(pal.soot, '#4A4450', p.shade * 0.6);
        return cartoon ? (
          <path key={i} d={blob(x, y, r, 6, 0.12, p.a)} fill={col} stroke="#1B1A22" strokeWidth={4 * u} strokeLinejoin="round" opacity={a} />
        ) : (
          <circle key={i} cx={x} cy={y} r={r} fill={col} opacity={a} />
        );
      })
    : null;

  const fireEls = live
    ? lobes.map((l, i) => {
        const rolling = roll * 0.55;
        const dist = l.d * S * (0.35 + swell * 0.75 + rolling * 0.5);
        const wob = vn1(t * 0.12 + l.ph, seed + i) * S * 0.07;
        const x = ox + Math.cos(l.a + l.roll * roll * 0.5) * dist + wob;
        const y = oy + Math.sin(l.a + l.roll * roll * 0.5) * dist * 0.85 - roll * S * 0.28 * (0.4 + l.d);
        const r = S * l.s * (0.15 + swell * 0.95) * (1 - roll * 0.25 * (1 - l.d));
        const k = clampN(cool * 0.9 + l.d * 0.3 + (1 - swell) * -0.2);
        const col = fireColor(k);
        const a = fade * (1 - roll * 0.15);
        if (cartoon) {
          return (
            <path key={i} d={blob(x, y, r, l.bumps, 0.16, l.ph)} fill={fireColor(clampN(k * 0.75))} stroke="#2A1410" strokeWidth={5 * u} strokeLinejoin="round" opacity={a} />
          );
        }
        return <circle key={i} cx={x} cy={y} r={r} fill={`url(#${uid}-lobe-${Math.min(3, Math.floor(k * 4))})`} opacity={a} />;
      })
    : null;

  const coreR = S * (0.25 + swell * 0.45) * (1 - prog(t, 14, 50, ease.in));
  const debrisEls = live
    ? parts.map((p, i) => {
        if (t > p.life) return null;
        const tt = t / 30;
        const x = ox + p.vx * S * 1.6 * tt * (1 - tt * 0.1);
        const y = oy + p.vy * S * 1.6 * tt + 0.5 * 2.6 * S * tt * tt;
        const ang = p.spin * t;
        const a = 1 - prog(t, p.life * 0.55, p.life, ease.in);
        const sz = p.size * Math.min(w, h) * (cartoon ? 1.7 : 1);
        const hot = clampN(1 - t / (p.life * 0.7)) * (1 - p.hot * 0.3);
        const col = cartoon ? mix(pal.mid, '#3A2C26', p.hot) : mix('#3A2C26', pal.hot, hot);
        const px = x - p.vx * S * 0.05;
        const py = y - (p.vy * S * 0.05 + 2.6 * S * tt * 0.025);
        return (
          <g key={i} opacity={a}>
            {!cartoon && hot > 0.1 && <line x1={px} y1={py} x2={x} y2={y} stroke={pal.hot} strokeWidth={sz * 0.3} strokeLinecap="round" opacity={hot * 0.7} />}
            <g transform={`translate(${x} ${y}) rotate(${(ang * 180) / Math.PI})`}>
              {p.kind === 0 && <rect x={-sz / 2} y={-sz * 0.35} width={sz} height={sz * 0.7} fill={col} stroke={cartoon ? '#2A1410' : 'none'} strokeWidth={3 * u} />}
              {p.kind === 1 && <path d={`M0 ${-sz * 0.6}L${sz * 0.55} ${sz * 0.4}L${-sz * 0.55} ${sz * 0.4}Z`} fill={col} stroke={cartoon ? '#2A1410' : 'none'} strokeWidth={3 * u} strokeLinejoin="round" />}
              {p.kind === 2 && <circle r={sz * 0.4} fill={col} stroke={cartoon ? '#2A1410' : 'none'} strokeWidth={3 * u} />}
            </g>
          </g>
        );
      })
    : null;

  const emberEls = live
    ? embers.map((e, i) => {
        const tt = t - e.delay;
        if (tt < 0) return null;
        const x = ox + Math.cos(e.a) * e.d * S * (0.8 + tt * 0.015) + vn1(tt * 0.08 + e.ph, i) * S * 0.12;
        const y = oy + Math.sin(e.a) * e.d * S * 0.5 - tt * e.vy * S * 0.03 - S * 0.1;
        const a = prog(tt, 0, 6, ease.out) * (1 - prog(tt, 30, 90, ease.in)) * (0.6 + 0.4 * Math.sin(tt * 0.5 + e.ph));
        return <circle key={i} cx={x} cy={y} r={Math.max(1, e.s * Math.min(w, h))} fill={pal.hot} opacity={a} />;
      })
    : null;

  const ringR = ringT * diag * 0.62;
  const ringA = (1 - ringT) * (live ? 1 : 0);
  const textIn = prog(t, 4, 14, ease.back) * (1 - prog(t, 70, 95, ease.in));

  return (
    <AbsoluteFill style={{background}}>
      <Svg style={{transform: `translate(${shx}px, ${shy}px)`}}>
        <defs>
          {[0, 1, 2, 3].map((k) => (
            <radialGradient key={k} id={`${uid}-lobe-${k}`}>
              <stop offset="0" stopColor={fireColor(k * 0.25)} stopOpacity="1" />
              <stop offset="0.55" stopColor={fireColor(k * 0.25 + 0.18)} stopOpacity="0.85" />
              <stop offset="1" stopColor={fireColor(k * 0.25 + 0.4)} stopOpacity="0" />
            </radialGradient>
          ))}
          <radialGradient id={`${uid}-glow`}>
            <stop offset="0" stopColor={pal.glow} stopOpacity="0.9" />
            <stop offset="0.5" stopColor={pal.glow} stopOpacity="0.25" />
            <stop offset="1" stopColor={pal.glow} stopOpacity="0" />
          </radialGradient>
          <filter id={`${uid}-turb`} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.011 0.014" numOctaves="3" seed={turbSeed} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={S * 0.28} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={`${uid}-soft`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={cartoon ? 0 : S * 0.075} />
          </filter>
        </defs>

        {live && !cartoon && (
          <circle cx={ox} cy={oy} r={S * (1.4 + swell * 1.6)} fill={`url(#${uid}-glow)`} opacity={(1 - prog(t, 10, 100, ease.sine)) * 0.9} />
        )}
        {live && cartoon && <circle cx={ox} cy={oy} r={S * 1.6} fill={rgbaStr(pal.glow, 0.22)} opacity={1 - prog(t, 6, 60, ease.in)} />}

        <g filter={cartoon ? undefined : `url(#${uid}-soft)`}>{smokeEls}</g>
        <g filter={cartoon ? undefined : `url(#${uid}-turb)`} style={{mixBlendMode: cartoon ? 'normal' : 'screen'}}>{fireEls}</g>

        {live && !cartoon && coreR > 1 && <circle cx={ox} cy={oy} r={coreR} fill={`url(#${uid}-lobe-0)`} style={{mixBlendMode: 'screen'}} />}
        {live && cartoon && (
          <>
            <path d={blob(ox, oy, S * 0.95 * (0.3 + swell * 0.75), 9, 0.4, 0.2, true)} fill={pal.hot} stroke="#2A1410" strokeWidth={6 * u} strokeLinejoin="round" opacity={1 - prog(t, 8, 40, ease.in)} />
            <path d={blob(ox, oy, S * 0.55 * (0.3 + swell * 0.75), 9, 0.4, 0.5, true)} fill={pal.core} stroke="#2A1410" strokeWidth={5 * u} strokeLinejoin="round" opacity={1 - prog(t, 6, 30, ease.in)} />
          </>
        )}

        {/* shockwave */}
        {live && ringA > 0.01 && (
          <>
            <circle cx={ox} cy={oy} r={ringR} fill="none" stroke={cartoon ? '#2A1410' : pal.ring} strokeWidth={(cartoon ? 16 : 9) * u * (1 - ringT * 0.7) + 2 * u} opacity={ringA * (cartoon ? 1 : 0.85)} />
            {cartoon && <circle cx={ox} cy={oy} r={ringR} fill="none" stroke="#fff" strokeWidth={8 * u * (1 - ringT * 0.7)} opacity={ringA} />}
            {!cartoon && <circle cx={ox} cy={oy} r={ringR * 0.82} fill="none" stroke={pal.ring} strokeWidth={3 * u} opacity={ringA * 0.35} />}
          </>
        )}

        {debrisEls}
        {emberEls}

        {cartoon && text && (
          <text
            x={ox}
            y={oy - S * 0.9}
            textAnchor="middle"
            fontFamily={fonts.comic}
            fontSize={S * 0.62}
            fill={pal.core}
            stroke="#2A1410"
            strokeWidth={7 * u}
            paintOrder="stroke"
            strokeLinejoin="round"
            opacity={textIn}
            transform={`rotate(-6 ${ox} ${oy}) scale(${0.6 + textIn * 0.4})`}
            style={{transformOrigin: `${ox}px ${oy - S * 0.9}px`}}
          >
            {text}
          </text>
        )}
      </Svg>
      {/* white flash (full frame) */}
      {flash > 0 && <AbsoluteFill style={{background: cartoon ? '#fff' : mix('#ffffff', pal.core, 0.4), opacity: flash * (cartoon ? 0.95 : 0.9)}} />}
    </AbsoluteFill>
  );
};

const clampN = (v: number) => Math.min(1, Math.max(0, v));

export const explosionBurst = defineMotion<Props>({
  id: 'explosion-burst',
  title: 'Explosion burst',
  category: 'fx',
  description:
    'Two-frame flash, a fireball that swells in 12 frames and then rolls while cooling yellow to red to soot with turbulent edges, rising smoke puffs, a shockwave ring that outruns the frame in about 10 frames, glowing debris with streaks, drifting embers and a decaying camera shake; or a cartoon version with a spiky flash, scalloped ink-outlined clouds, chunky debris on twos and optional comic text.',
  source: ['prompt-corpus research: explosion-burst (21 cases, ideas only; original implementation)'],
  useFor: 'Game trailers, dramatic reveals, comedy beats, history / battle stories, "blow up the old way" transitions.',
  durationInFrames: 120,
  defaultProps: {style: 'real', palette: 'fire', at: 8, originX: 0.5, originY: 0.58, scale: 1, debris: 56, smoke: true, shake: 1, text: '', seed: 7, background: '#0B0807'},
  propDocs: {
    style: "'real' (turbulent fireball) | 'cartoon' (spiky flat shapes on twos)",
    palette: "'fire' | 'plasma' | 'toxic'",
    at: 'detonation frame',
    originX: 'blast centre x (0-1 of width)',
    originY: 'blast centre y (0-1 of height)',
    scale: 'blast size multiplier',
    debris: 'number of debris pieces',
    smoke: 'rolling smoke puffs',
    shake: 'camera shake strength (0 = none)',
    text: 'cartoon only: comic word above the blast (e.g. a sound effect)',
    seed: 'randomness seed',
    background: 'scene colour behind the blast; use a dark base or composite with screen blending',
  },
  component: ExplosionBurst,
  tags: ['explosion', 'fireball', 'blast', 'shockwave', 'debris', 'smoke', 'embers', 'impact', 'boom', 'detonation', 'fx', 'game trailer', 'cartoon', 'comic', 'plasma', 'destruction', 'camera shake'],
});
