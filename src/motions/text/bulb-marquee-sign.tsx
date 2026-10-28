// Adapted from lemo-opuscar/styles/art-deco/demo/engine/bulbs.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
// (bulb render + litSequence ported; letter skeletons come from our own single-stroke font instead of
// rasterising and thinning the text)
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {useSafeId} from '../../core/image-kit';
import {GOLD, GoldGradient, lf, mixC, resample, strokeGlyph} from '../../core/r2-la1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Theatre-marquee sign: any word becomes evenly spaced warm bulbs on gold channel letters. Letters ignite one
 * per beat with a 1.6× flash decaying over 0.18 s, then a chase runs across the sign (14 bulbs/s, period 5).
 */
type Props = {
  text: string;
  subtitle: string;
  beatFrames: number;
  startAt: number;
  chaseGap: number;
  spacing: number;
  bulbColor: string;
  channelColor: string;
  background: string;
  rays: boolean;
};

type Bulb = {x: number; y: number; letter: number; gi: number};

const BulbMarquee: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, fps} = useStage();
  const id = useSafeId('bulbs');
  const text = p.text.toUpperCase();
  // layout in glyph units
  const lay = useMemo(() => {
    const glyphs = [...text].map((c) => strokeGlyph(c));
    const gap = 1.7;
    let x = 0;
    const placed = glyphs.map((g) => {
      const at = x;
      x += g.width + gap;
      return {...g, x: at};
    });
    const total = Math.max(1, x - gap);
    return {placed, total};
  }, [text]);
  const unit = Math.min((w * (portrait ? 0.86 : 0.8)) / lay.total, (h * (portrait ? 0.15 : 0.34)) / 6);
  const ox = (w - lay.total * unit) / 2;
  const oy = h * (portrait ? 0.42 : 0.4) - 3 * unit;
  const sp = p.spacing;
  const {bulbs, paths, letterBox} = useMemo(() => {
    const bulbs: Bulb[] = [];
    const paths: string[] = [];
    const letterBox: [number, number, number][] = [];
    let gi = 0;
    lay.placed.forEach((g, li) => {
      const d: string[] = [];
      g.strokes.forEach((s) => {
        d.push('M' + s.map(([a, b]) => `${(ox + (g.x + a) * unit).toFixed(1)} ${(oy + b * unit).toFixed(1)}`).join(' L'));
        const pts = resample(s, sp);
        pts.forEach(([a, b]) => {
          const X = ox + (g.x + a) * unit;
          const Y = oy + b * unit;
          // weld: skip bulbs that land on an existing one of the same letter
          if (bulbs.some((q) => q.letter === li && Math.hypot(q.x - X, q.y - Y) < unit * sp * 0.6)) return;
          bulbs.push({x: X, y: Y, letter: li, gi: gi++});
        });
      });
      paths.push(d.join(' '));
      letterBox.push([ox + (g.x + g.width / 2) * unit, oy + 3 * unit, Math.max(g.width, 2) * unit]);
    });
    return {bulbs, paths, letterBox};
  }, [lay, ox, oy, unit, sp]);

  const n = lay.placed.length;
  const T = (i: number) => p.startAt + i * p.beatFrames;
  const chaseFrom = T(n - 1) + p.chaseGap;
  const tsec = frame / fps;
  const vOf = (b: Bulb) => {
    const t0 = T(b.letter);
    if (frame < t0) return 0;
    const dt = (frame - t0) / fps;
    let v = dt < 0.18 ? 1 + 0.6 * (1 - dt / 0.18) : 1;
    if (frame >= chaseFrom) {
      const ph = (((b.gi - (tsec - chaseFrom / fps) * 14) % 5) + 5) % 5;
      const target = ph < 1.5 ? 1.25 : 0.65;
      v = lerp(v, target, clamp((frame - chaseFrom) / 6));
    }
    return v;
  };
  const r = sp * unit * 0.3;
  const litLetter = (li: number) => clamp((frame - T(li)) / 3);
  const avgLit = bulbs.length ? bulbs.reduce((a, b) => a + Math.min(1, vOf(b)), 0) / bulbs.length : 0;
  const subIn = prog(frame, chaseFrom - 6, chaseFrom + 14, ease.out);
  const Z = lerp(1.06, 1, prog(frame, 0, 60, ease.out)) * lerp(1, 1.025, prog(frame, 60, 180, ease.sine));
  const sheen = lerp(-0.2, 1.2, prog(frame, chaseFrom - 4, chaseFrom + 22, ease.inOut));

  return (
    <AbsoluteFill style={{background: p.background}}>
      <AbsoluteFill style={{transform: `scale(${Z})`}}>
        <Svg>
          <defs>
            <radialGradient id={`${id}-bg`} cx="50%" cy="42%" r="70%">
              <stop offset="0" stopColor={mixC(p.background, '#3a2a12', 0.55)} />
              <stop offset="1" stopColor={p.background} />
            </radialGradient>
            <GoldGradient id={`${id}-gold`} sheen={sheen} x1={0} y1={0} x2={1} y2={0.4} />
            <radialGradient id={`${id}-halo`}>
              <stop offset="0" stopColor="rgb(255,196,92)" stopOpacity={0.55} />
              <stop offset="0.45" stopColor="rgb(255,196,92)" stopOpacity={0.16} />
              <stop offset="1" stopColor="rgb(255,196,92)" stopOpacity={0} />
            </radialGradient>
            <radialGradient id={`${id}-core`} cx="42%" cy="40%">
              <stop offset="0" stopColor="#fffaf0" />
              <stop offset="0.5" stopColor={p.bulbColor} />
              <stop offset="1" stopColor="#e09a3a" />
            </radialGradient>
            <radialGradient id={`${id}-off`} cx="40%" cy="38%">
              <stop offset="0" stopColor="#4a4034" />
              <stop offset="0.6" stopColor="#201a14" />
              <stop offset="1" stopColor="#0d0a07" />
            </radialGradient>
            <radialGradient id={`${id}-bloom`}>
              <stop offset="0" stopColor="rgb(255,190,90)" stopOpacity={0.5} />
              <stop offset="1" stopColor="rgb(255,190,90)" stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect width={w} height={h} fill={`url(#${id}-bg)`} />
          {p.rays &&
            Array.from({length: 36}, (_, i) => {
              const a0 = (i / 36) * Math.PI * 2;
              const a1 = a0 + Math.PI / 36;
              const R = Math.hypot(w, h);
              const cx = w / 2;
              const cy = oy + 3 * unit;
              return <path key={i} d={`M${cx} ${cy} L${cx + Math.cos(a0) * R} ${cy + Math.sin(a0) * R} L${cx + Math.cos(a1) * R} ${cy + Math.sin(a1) * R} Z`} fill={GOLD.base} opacity={0.035 + 0.03 * avgLit} />;
            })}
          {/* sign panel keylines */}
          <rect x={ox - 2.2 * unit} y={oy - 2.2 * unit} width={(lay.total + 4.4) * unit} height={10.4 * unit} fill="#0b0806" opacity={0.6} stroke={`url(#${id}-gold)`} strokeWidth={Math.max(2, unit * 0.12)} />
          <rect x={ox - 1.8 * unit} y={oy - 1.8 * unit} width={(lay.total + 3.6) * unit} height={9.6 * unit} fill="none" stroke={GOLD.shadow} strokeWidth={Math.max(1, unit * 0.05)} />
          {/* letter bloom */}
          {letterBox.map(([x, y, lw], i) => (
            <ellipse key={i} cx={x} cy={y} rx={lw * 1.1 + 2 * unit} ry={5 * unit} fill={`url(#${id}-bloom)`} opacity={0.5 * litLetter(i)} style={{mixBlendMode: 'screen'}} />
          ))}
          {/* channel letters: wide gold stroke + enamel that warms as the letter lights */}
          {paths.map((d, i) => (
            <g key={i} fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d={d} stroke={GOLD.shadow} strokeWidth={unit * 1.32} />
              <path d={d} stroke={`url(#${id}-gold)`} strokeWidth={unit * 1.18} />
              <path d={d} stroke={mixC(p.channelColor, '#5a2a14', litLetter(i))} strokeWidth={unit * 0.86} />
            </g>
          ))}
          {/* sockets + bulbs */}
          {bulbs.map((b, i) => {
            const v = vOf(b);
            return (
              <g key={i}>
                <circle cx={b.x} cy={b.y} r={r * 1.28} fill="#120d08" stroke={v > 0 ? GOLD.base : '#3a2e1c'} strokeWidth={r * 0.18} />
                {v > 0 ? <circle cx={b.x} cy={b.y} r={r} fill={`url(#${id}-core)`} opacity={clamp(0.55 + 0.45 * v)} /> : <circle cx={b.x} cy={b.y} r={r} fill={`url(#${id}-off)`} />}
                {v <= 0 && <circle cx={b.x - r * 0.3} cy={b.y - r * 0.35} r={r * 0.2} fill="#d8cdb8" opacity={0.55} />}
              </g>
            );
          })}
          <g style={{mixBlendMode: 'screen'}}>
            {bulbs.map((b, i) => {
              const v = vOf(b);
              if (v <= 0) return null;
              const R = r * (3.2 + 1.6 * Math.max(0, v - 1));
              return <circle key={i} cx={b.x} cy={b.y} r={R} fill={`url(#${id}-halo)`} opacity={clamp(v * 0.9, 0, 1.3)} />;
            })}
          </g>
          {p.subtitle && (
            <text
              x={w / 2}
              y={oy + 6 * unit + 2.2 * unit + (portrait ? 110 : 96) * u}
              textAnchor="middle"
              fontFamily={lf.josefin}
              fontWeight={600}
              fontSize={(portrait ? 44 : 40) * u}
              letterSpacing={(portrait ? 10 : 14) * u}
              fill={`url(#${id}-gold)`}
              opacity={subIn}
              transform={`translate(0 ${(1 - subIn) * 14 * u})`}
            >
              {p.subtitle}
            </text>
          )}
        </Svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const bulbMarqueeSign = defineMotion<Props>({
  id: 'bulb-marquee-sign',
  title: 'Bulb marquee sign',
  category: 'text',
  description:
    'Any word becomes a theatre marquee of evenly spaced warm bulbs on gold channel letters; letters ignite one per beat with a flash overshoot, then a chase runs across the sign and a tracked gold subtitle rises.',
  source: ['lemo-opuscar styles/art-deco demo/engine/bulbs.js bulb render + litSequence (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §2 bulb-marquee-sign'],
  useFor: 'Counted reveals (countdowns, launch names, award winners), premiere / Vegas / theatre titles, event openers.',
  durationInFrames: 150,
  defaultProps: {
    text: 'TONIGHT',
    subtitle: 'AT THE NORTHWIND THEATRE',
    beatFrames: 8,
    startAt: 12,
    chaseGap: 12,
    spacing: 0.62,
    bulbColor: '#ffe6a3',
    channelColor: '#2a1a10',
    background: '#0d0b09',
    rays: true,
  },
  propDocs: {
    text: 'word(s) to spell in bulbs (A–Z, 0–9, ! ? - . & and spaces; keep it short, ≤ 10 letters)',
    subtitle: 'tracked gold caps under the sign (empty = none)',
    beatFrames: 'frames between letters igniting',
    startAt: 'frame the first letter lights',
    chaseGap: 'frames after the last letter before the chase starts',
    spacing: 'bulb spacing along the strokes in cap-height/6 units (smaller = more bulbs)',
    bulbColor: 'lit bulb colour',
    channelColor: 'enamel colour inside the gold channel letters',
    background: 'warm lacquer black background',
    rays: 'faint gold sunburst behind the sign',
  },
  component: BulbMarquee,
  tags: ['marquee', 'bulbs', 'lights', 'sign', 'theatre', 'vegas', 'premiere', 'art deco', 'gold', 'title', 'chase', 'countdown', 'award', 'event', 'retro', 'text'],
});
