import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {fitSize, hexA, mixHex, useUid} from '../../core/r2-pr4-kit';
import {rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Liquid pour fill: ingredients pour into a glass one after another as a stream (10-20 frames), each layer rising
 * with an eased level and a decaying sine meniscus (~2.5 Hz), with a live amount counter, a step counter and a final
 * title. Glasses: highball, rocks, coupe, jar. Pure SVG (clip path + layered surfaces).
 */
type Ingredient = {name: string; amount: number; unit: string; color: string};
type Props = {
  ingredients: Ingredient[];
  glass: 'highball' | 'rocks' | 'coupe' | 'jar';
  stepLabel: string;
  finalTitle: string;
  finalSubtitle: string;
  background: string;
  inkColor: string;
  accent: string;
  pourFrames: number;
  ice: number;
  bubbles: boolean;
  fill: number;
  seed: number;
};

const ING: Ingredient[] = [
  {name: 'Grenadine', amount: 15, unit: 'ml', color: '#d4263b'},
  {name: 'Orange juice', amount: 90, unit: 'ml', color: '#f6a01a'},
  {name: 'Pineapple juice', amount: 60, unit: 'ml', color: '#f9d949'},
  {name: 'Sparkling water', amount: 45, unit: 'ml', color: '#a9e6f2'},
];

type GlassDef = {W: number; H: number; outline: string; inner: string; bot: number; top: number; open: string; extra?: 'lid' | 'stem'};
const GLASS: Record<string, GlassDef> = {
  highball: {
    W: 210,
    H: 470,
    outline: 'M-105,-470 L-93,-14 Q-92,0 -78,0 L78,0 Q92,0 93,-14 L105,-470Z',
    open: 'M-105,-470 L-93,-14 Q-92,0 -78,0 L78,0 Q92,0 93,-14 L105,-470',
    inner: 'M-97,-470 L-85,-26 Q-84,-14 -72,-14 L72,-14 Q84,-14 85,-26 L97,-470Z',
    bot: -14,
    top: -405,
  },
  rocks: {
    W: 320,
    H: 260,
    outline: 'M-160,-260 L-135,-18 Q-133,0 -115,0 L115,0 Q133,0 135,-18 L160,-260Z',
    open: 'M-160,-260 L-135,-18 Q-133,0 -115,0 L115,0 Q133,0 135,-18 L160,-260',
    inner: 'M-151,-260 L-126,-46 Q-124,-34 -110,-34 L110,-34 Q124,-34 126,-46 L151,-260Z',
    bot: -34,
    top: -222,
  },
  jar: {
    W: 290,
    H: 370,
    outline: 'M-125,-370 L125,-370 Q145,-360 145,-330 L145,-30 Q145,0 115,0 L-115,0 Q-145,0 -145,-30 L-145,-330 Q-145,-360 -125,-370Z',
    open: 'M-125,-370 Q-145,-360 -145,-330 L-145,-30 Q-145,0 -115,0 L115,0 Q145,0 145,-30 L145,-330 Q145,-360 125,-370',
    inner: 'M-134,-352 L134,-352 L134,-40 Q134,-12 106,-12 L-106,-12 Q-134,-12 -134,-40Z',
    bot: -12,
    top: -318,
    extra: 'lid',
  },
  coupe: {
    W: 360,
    H: 372,
    outline: 'M-180,-372 C-180,-262 -112,-190 -9,-184 L-9,-24 Q-9,-16 -40,-14 Q-84,-12 -84,-6 L-84,0 L84,0 L84,-6 Q84,-12 40,-14 Q9,-16 9,-24 L9,-184 C112,-190 180,-262 180,-372Z',
    open: 'M-180,-372 C-180,-262 -112,-190 -9,-184 L-9,-24 Q-9,-16 -40,-14 Q-84,-12 -84,-6 L-84,0 L84,0 L84,-6 Q84,-12 40,-14 Q9,-16 9,-24 L9,-184 C112,-190 180,-262 180,-372',
    inner: 'M-172,-372 C-172,-266 -108,-196 0,-192 C108,-196 172,-266 172,-372Z',
    bot: -192,
    top: -340,
    extra: 'stem',
  },
};

const LiquidPourFill: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const uid = useUid('pour');
  const ings = p.ingredients.length ? p.ingredients : ING;
  const n = ings.length;
  const G = GLASS[p.glass] ?? GLASS.highball;
  const ink = p.inkColor;
  const P = Math.max(34, p.pourFrames);
  const intro = 22;
  const total = ings.reduce((a, b) => a + Math.max(0.0001, b.amount), 0);
  const doneAt = intro + n * P + 4;

  // glass layout
  const budgetH = portrait ? h * 0.46 : h * 0.66;
  const budgetW = portrait ? w * 0.6 : w * 0.3;
  const gs = Math.min(budgetH / G.H, budgetW / G.W);
  const gx = portrait ? cx : w * 0.34;
  const gTop = portrait ? h * 0.1 : cy - (G.H * gs) / 2;
  const gBottom = gTop + G.H * gs;
  const enter = prog(frame, 0, intro, ease.out);
  const Y = (y: number) => gBottom + y * gs; // local -> screen y
  const X = (x: number) => gx + x * gs;

  // per-ingredient timeline
  const tl = ings.map((ing, i) => {
    const s = intro + i * P;
    const fillS = s + 8;
    const fillE = fillS + 22;
    return {s, fillS, fillE, head: prog(frame, s, s + 8, ease.in), tail: prog(frame, fillE - 4, fillE + 4, ease.in), rise: prog(frame, fillS, fillE, ease.inOut), ing};
  });
  const cum = ings.map((_, i) => ings.slice(0, i + 1).reduce((a, b) => a + b.amount, 0) / total);
  const levelOf = (i: number) => {
    const lo = i === 0 ? 0 : cum[i - 1];
    return lerp(lo, cum[i], tl[i].rise) * p.fill;
  };
  const yOfFrac = (f: number) => G.bot + (G.top - G.bot) * f;

  // surfaces
  const span = G.W + 30;
  const NPT = 28;
  const wobble = (i: number, x: number, surfY: number) => {
    const t = frame - tl[i].fillE;
    const active = frame >= tl[i].s + 8 && frame < tl[i].fillE;
    let amp = 0;
    if (frame < tl[i].fillS) amp = 0;
    else if (active) amp = 3.6 + 2.4 * (1 - tl[i].tail);
    else amp = 6 * Math.exp(-t * 0.085);
    const nextPouring = i < n - 1 && frame >= tl[i + 1].s;
    const stand = Math.cos((x / span) * Math.PI * 2) * Math.sin((2 * Math.PI * frame) / 12); // 2.5 Hz at 30 fps
    const trav = Math.sin(x * 0.045 + frame * 0.5) * 0.45;
    return surfY + (stand + trav) * amp * (nextPouring ? 0.5 : 1);
  };
  const surfacePts = (i: number) => {
    const lvl = levelOf(i);
    const y0 = yOfFrac(lvl);
    const pts: [number, number][] = [];
    for (let k = 0; k <= NPT; k++) {
      const x = -span / 2 + (span * k) / NPT;
      pts.push([x, wobble(i, x, y0)]);
    }
    return {y0, pts, lvl};
  };
  const surf = ings.map((_, i) => surfacePts(i));
  const toPath = (pts: [number, number][]) => pts.map((q, k) => `${k ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('');
  const lastIdx = tl.reduce((a, t, i) => (frame >= t.fillS ? i : a), -1);
  const topSurf = lastIdx >= 0 ? surf[lastIdx] : null;

  // ice
  const iceN = Math.max(0, Math.round(p.ice));
  const iceCubes = React.useMemo(() => {
    const g = rng(p.seed * 7 + 3);
    return Array.from({length: iceN}, (_, i) => ({x: (g() - 0.5) * (G.W * 0.38), rot: (g() - 0.5) * 40, s: 46 + g() * 14, row: i % 2, bob: g() * 6.28}));
  }, [iceN, p.seed, G.W]);

  // bubbles
  const bub = React.useMemo(() => {
    const g = rng(p.seed * 13 + 1);
    return Array.from({length: 16}, () => ({x: (g() - 0.5) * G.W * 0.62, ph: g(), sp: 0.5 + g() * 0.8, r: 2 + g() * 3.5}));
  }, [p.seed, G.W]);

  const streamX = X(0);
  const activeI = tl.findIndex((t) => frame >= t.s && frame < t.s + P);
  const current = activeI >= 0 ? activeI : frame >= doneAt ? n - 1 : 0;
  const finished = frame >= doneAt;

  // right panel
  const panelX = portrait ? w * 0.09 : w * 0.58;
  const pk = portrait ? 1 : 1.32;
  const panelW = (portrait ? w * 0.82 : w * 0.34) / pk;
  const rowH = 72 * u;
  const headH = 150 * u;
  const panelH = headH + n * rowH;
  const panelY = portrait ? h * 0.63 : cy - (panelH * pk) / 2;
  const rowFs = fitSize(ings.reduce((a, b) => (b.name.length > a.length ? b.name : a), ''), fonts.grotesk, 32 * u, panelW * 0.6, 600);

  const bigText = finished ? p.finalTitle : ings[current].name;
  const swapA = finished ? prog(frame, doneAt, doneAt + 12, ease.out) : 1;

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <radialGradient id={uid + 'bg'} cx="35%" cy="45%" r="80%">
            <stop offset="0" stopColor={mixHex(p.background, '#ffffff', 0.09)} />
            <stop offset="1" stopColor={mixHex(p.background, '#000000', 0.35)} />
          </radialGradient>
          {ings.map((ing, i) => (
            <linearGradient key={i} id={uid + 'l' + i} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={mixHex(ing.color, '#ffffff', 0.18)} />
              <stop offset="1" stopColor={mixHex(ing.color, '#000000', 0.12)} />
            </linearGradient>
          ))}
          <clipPath id={uid + 'in'}>
            <path d={G.inner} />
          </clipPath>
          <filter id={uid + 'sh'} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={10 * u} />
          </filter>
        </defs>
        <rect width={w} height={h} fill={`url(#${uid}bg)`} />
        {/* table shadow */}
        <ellipse cx={gx} cy={gBottom + 6 * u} rx={G.W * gs * 0.62} ry={16 * u} fill="#000" opacity={0.45 * enter} filter={`url(#${uid}sh)`} />

        <g transform={`translate(${gx} ${gBottom + (1 - enter) * 24 * u}) scale(${gs})`} opacity={enter}>
          {/* glass body */}
          <path d={G.outline} fill="rgba(255,255,255,0.07)" />
          {/* liquid */}
          <g clipPath={`url(#${uid}in)`}>
            {ings
              .map((_, i) => i)
              .reverse()
              .map((i) => {
                if (frame < tl[i].fillS) return null;
                const s = surf[i];
                const d = `${toPath(s.pts)}L${span / 2},${G.bot + 40}L${-span / 2},${G.bot + 40}Z`;
                return <path key={i} d={d} fill={`url(#${uid}l${i})`} opacity={ings[i].color === ings[i].color ? 0.94 : 1} />;
              })}
            {/* meniscus highlight on the top layer */}
            {topSurf && <path d={toPath(topSurf.pts)} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={3.2} strokeLinecap="round" />}
            {/* bubbles */}
            {p.bubbles &&
              topSurf &&
              bub.map((b, i) => {
                const ph = (b.ph + frame * 0.012 * b.sp) % 1;
                const by = lerp(G.bot - 6, topSurf.y0 + 8, ph);
                if (by < topSurf.y0 + 6) return null;
                return <circle key={i} cx={b.x + Math.sin(frame * 0.1 + i) * 3} cy={by} r={b.r} fill="none" stroke="#fff" strokeOpacity={0.5 * clamp(topSurf.lvl * 4)} strokeWidth={1.4} />;
              })}
            {/* ice */}
            {iceCubes.map((c, i) => {
              const dropS = 10 + i * 3;
              const k = prog(frame, dropS, dropS + 12, ease.in);
              const rest = G.bot - c.s / 2 - c.row * c.s * 0.92 - 2;
              const topY = topSurf ? topSurf.y0 : G.bot;
              const float = Math.min(rest, topY + c.s * 0.18 + Math.sin(frame * 0.07 + c.bob) * 3 - c.row * c.s * 0.1);
              const y = lerp(-G.H - 60, rest, k) * (k < 1 ? 1 : 0) + (k < 1 ? 0 : float);
              if (frame < dropS) return null;
              return (
                <g key={i} transform={`translate(${c.x} ${y}) rotate(${c.rot + Math.sin(frame * 0.05 + c.bob) * 3})`}>
                  <rect x={-c.s / 2} y={-c.s / 2} width={c.s} height={c.s} rx={9} fill="rgba(235,248,255,0.33)" stroke="rgba(255,255,255,0.8)" strokeWidth={2.4} />
                  <path d={`M${-c.s * 0.3},${-c.s * 0.3} l${c.s * 0.25},0 M${-c.s * 0.3},${-c.s * 0.3} l0,${c.s * 0.25}`} stroke="#fff" strokeOpacity={0.8} strokeWidth={3} strokeLinecap="round" />
                </g>
              );
            })}
          </g>
          {/* outline, highlights */}
          <path d={G.open} fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
          {G.extra === 'lid' && (
            <>
              <rect x={-136} y={-398} width={272} height={34} rx={9} fill="#c9ced6" stroke="rgba(255,255,255,0.8)" strokeWidth={3} />
              <path d="M-120,-386 H120" stroke="#fff" strokeOpacity={0.6} strokeWidth={4} strokeLinecap="round" />
            </>
          )}
          {p.glass === 'highball' && <path d="M-72,-430 L-62,-60" stroke="#fff" strokeOpacity={0.26} strokeWidth={9} strokeLinecap="round" fill="none" />}
          {p.glass === 'rocks' && <path d="M-118,-226 L-104,-70" stroke="#fff" strokeOpacity={0.26} strokeWidth={9} strokeLinecap="round" fill="none" />}
          {p.glass === 'jar' && <path d="M-108,-320 L-108,-60" stroke="#fff" strokeOpacity={0.26} strokeWidth={9} strokeLinecap="round" fill="none" />}
          {p.glass === 'coupe' && <path d="M-148,-340 C-146,-280 -120,-238 -84,-216" stroke="#fff" strokeOpacity={0.3} strokeWidth={8} strokeLinecap="round" fill="none" />}
        </g>

        {/* streams */}
        {tl.map((t, i) => {
          if (frame < t.s || t.tail >= 1) return null;
          const surfY = Y(yOfFrac(levelOf(i))) ;
          const top = -40 * u;
          const yHead = lerp(top, surfY, t.head);
          const yTail = lerp(top, surfY, t.tail);
          if (yHead - yTail < 1) return null;
          const wTop = 17 * u * (1 - 0.35 * t.tail);
          const wBot = wTop * 0.72;
          const steps = 10;
          const pts: string[] = [];
          const pts2: string[] = [];
          for (let k = 0; k <= steps; k++) {
            const y = lerp(yTail, yHead, k / steps);
            const kk = (y - top) / Math.max(1, surfY - top);
            const wd = lerp(wTop, wBot, clamp(kk));
            const xo = Math.sin(y * 0.018 + frame * 0.45) * 1.6 * u;
            pts.push(`${(streamX + xo - wd / 2).toFixed(1)},${y.toFixed(1)}`);
            pts2.unshift(`${(streamX + xo + wd / 2).toFixed(1)},${y.toFixed(1)}`);
          }
          const col = tl[i].ing.color;
          const hit = t.head >= 1 && t.tail < 0.6;
          const g = rng(frame * 31 + i);
          return (
            <g key={i}>
              <polygon points={[...pts, ...pts2].join(' ')} fill={col} opacity={0.95} />
              <polyline points={pts.map((q) => q.replace(/^([\d.-]+)/, (m) => String(parseFloat(m) + 2.5 * u))).join(' ')} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={2.4 * u} strokeLinecap="round" />
              {hit && (
                <>
                  <ellipse cx={streamX} cy={surfY} rx={22 * u} ry={5.5 * u} fill={mixHex(col, '#ffffff', 0.35)} opacity={0.85} />
                  {[0, 1, 2].map((k) => {
                    const a = g() * Math.PI;
                    const r = (14 + g() * 22) * u;
                    return <circle key={k} cx={streamX + Math.cos(a) * r * (k % 2 ? -1 : 1)} cy={surfY - Math.sin(a) * r * 0.9} r={(2.2 + g() * 2) * u} fill={col} opacity={0.9} />;
                  })}
                </>
              )}
            </g>
          );
        })}
      </Svg>

      {/* panel */}
      <div style={{position: 'absolute', left: panelX, top: panelY, width: panelW, opacity: enter, transform: `scale(${pk})`, transformOrigin: 'top left'}}>
        <div style={{height: headH}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14 * u, fontFamily: fonts.mono, fontWeight: 700, fontSize: 19 * u, letterSpacing: 4 * u, color: p.accent}}>
            <span>{finished ? 'DONE' : `${p.stepLabel} ${String(current + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`}</span>
            <span style={{display: 'flex', gap: 7 * u}}>
              {ings.map((_, i) => (
                <span key={i} style={{width: 22 * u, height: 5 * u, borderRadius: 3 * u, background: i <= (finished ? n : current) ? p.accent : hexA(ink, 0.2)}} />
              ))}
            </span>
          </div>
          <div style={{marginTop: 14 * u, fontFamily: fonts.grotesk, fontWeight: 700, fontSize: fitSize(bigText, fonts.grotesk, 62 * u, panelW, 700), color: ink, lineHeight: 1.05, letterSpacing: -1 * u, opacity: swapA, transform: `translateY(${(1 - swapA) * 10 * u}px)`}}>{bigText}</div>
          {finished && (
            <div style={{marginTop: 10 * u, fontFamily: fonts.mono, fontSize: 17 * u, letterSpacing: 3 * u, color: hexA(ink, 0.62), opacity: swapA}}>
              {(p.finalSubtitle || `${Math.round(total)} ${ings[0].unit} total`).toUpperCase()}
            </div>
          )}
        </div>
        {ings.map((ing, i) => {
          const a = prog(frame, tl[i].s, tl[i].s + 10, ease.out);
          const val = Math.round(ing.amount * tl[i].rise);
          const act = i === current && !finished;
          return (
            <div key={i} style={{height: rowH, display: 'flex', alignItems: 'center', gap: 18 * u, borderBottom: `1px solid ${hexA(ink, 0.14)}`, opacity: a * (act || finished ? 1 : 0.6), transform: `translateX(${(1 - a) * 26 * u}px)`}}>
              <span style={{width: 26 * u, height: 26 * u, borderRadius: '50%', background: ing.color, boxShadow: act ? `0 0 ${16 * u}px ${ing.color}` : 'none', flex: 'none'}} />
              <span style={{flex: 1, fontFamily: fonts.grotesk, fontWeight: 600, fontSize: rowFs, color: ink}}>{ing.name}</span>
              <span style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: 30 * u, color: ink}}>
                {val}
                <span style={{fontSize: 18 * u, color: hexA(ink, 0.6), marginLeft: 6 * u}}>{ing.unit}</span>
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const liquidPourFill = defineMotion<Props>({
  id: 'liquid-pour-fill',
  title: 'Liquid pour fill',
  category: 'product',
  description:
    'Four ingredients pour into a tall glass one after another as a stream with a splash, each layer rising with an eased level and a decaying sine meniscus while a panel counts every amount up in ml, shows STEP 01 / 04 and ends on the finished-drink title.',
  source: ['prompt-corpus: liquid-pour-fill (9 cases, awesome-opus5-5-videos)'],
  useFor: 'Recipe and cooking explainers, product composition ("what is inside"), and "mix of factors" metaphors. Choose the glass (highball, rocks, coupe, jar) and list your own ingredients.',
  durationInFrames: 240,
  defaultProps: {
    ingredients: ING,
    glass: 'highball',
    stepLabel: 'STEP',
    finalTitle: 'Sunrise cooler',
    finalSubtitle: '',
    background: '#10151f',
    inkColor: '#f2eee6',
    accent: '#ffb347',
    pourFrames: 42,
    ice: 0,
    bubbles: true,
    fill: 0.96,
    seed: 3,
  },
  propDocs: {
    ingredients: 'ingredients [{name, amount, unit, color}] in pour order (densest first layers best)',
    glass: "'highball' | 'rocks' | 'coupe' | 'jar'",
    stepLabel: 'word before the step counter',
    finalTitle: 'title shown when the glass is full',
    finalSubtitle: 'sub-line under the final title ("" = total volume)',
    background: 'backdrop colour',
    inkColor: 'panel text colour',
    accent: 'step counter / progress colour',
    pourFrames: 'frames per ingredient (min 34): stream in 8, rise 22, stream out',
    ice: 'number of ice cubes dropped in first (0-4)',
    bubbles: 'rising bubbles in the liquid',
    fill: 'how full the glass ends up 0-1',
    seed: 'ice / bubble seed',
  },
  component: LiquidPourFill,
  tags: ['liquid', 'pour', 'fill', 'drink', 'cocktail', 'recipe', 'cooking', 'ingredients', 'glass', 'layers', 'meniscus', 'ml', 'step counter', 'beverage', 'composition', 'what is inside', 'infographic', 'food', 'coffee', 'mix'],
});
