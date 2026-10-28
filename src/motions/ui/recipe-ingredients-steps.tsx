import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {ease, lerp} from '../../core/ease';
import {resolveSrc} from '../../core/asset';
import {CheckMark, bgOf, onColor} from '../../core/commerce-kit';
import {fonts} from '../../core/fonts';
import {backOut, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {mmss} from '../../core/travel-food-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Recipe card: the ingredient checklist ticks off one by one, then the numbered method plays step by step with a live
 * countdown timer ring on the steps that have a time.
 */
type Step = {text: string; minutes?: number};
type Props = {
  title: string;
  subtitle: string;
  ingredientsTitle: string;
  stepsTitle: string;
  ingredients: string[];
  steps: Step[];
  stepFrames: number;
  src: string;
  background: string;
  card: string;
  ink: string;
  accent: string;
  startAt: number;
};

const Plate: React.FC<{size: number; accent: string; ink: string; src?: string}> = ({size, accent, ink, src}) => (
  <div style={{width: size, height: size, borderRadius: '50%', position: 'relative', flex: 'none', boxShadow: `0 ${size * 0.08}px ${size * 0.2}px ${withAlpha(ink, 0.25)}`, background: '#FFFFFF', overflow: 'hidden'}}>
    {src ? (
      <Img src={resolveSrc(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
    ) : (
      <svg viewBox="-100 -100 200 200" width={size} height={size} style={{position: 'absolute', inset: 0}}>
        <circle r={100} fill="#FFFFFF" />
        <circle r={86} fill="none" stroke={withAlpha(ink, 0.08)} strokeWidth={3} />
        <circle r={66} fill="#F4F1EA" />
        <ellipse cx={0} cy={20} rx={44} ry={13} fill={mixHex(accent, '#8A5A2B', 0.45)} />
        <ellipse cx={0} cy={9} rx={43} ry={13} fill={mixHex(accent, '#E3B26B', 0.55)} />
        <ellipse cx={0} cy={-2} rx={42} ry={13} fill={mixHex(accent, '#8A5A2B', 0.35)} />
        <ellipse cx={0} cy={-13} rx={41} ry={13} fill={mixHex(accent, '#E9BE79', 0.5)} />
        <ellipse cx={0} cy={-15} rx={22} ry={6} fill="#FFF3C9" opacity={0.85} />
        <circle cx={-14} cy={-27} r={6} fill="#B33A3A" />
        <circle cx={-4} cy={-31} r={5} fill="#C94646" />
        <path d="M18 -26 q6 -10 14 -4 q-4 9 -14 4z" fill="#4F9B5E" />
      </svg>
    )}
  </div>
);

const Ring: React.FC<{size: number; progress: number; color: string; track: string; label: string; ink: string; u: number}> = ({size, progress, color, track, label, ink, u}) => {
  const r = size / 2 - 6 * u;
  const c = 2 * Math.PI * r;
  return (
    <div style={{width: size, height: size, position: 'relative', flex: 'none'}}>
      <svg width={size} height={size} style={{position: 'absolute', inset: 0, transform: 'rotate(-90deg)'}}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={6 * u} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6 * u} strokeLinecap="round" strokeDasharray={`${c * (1 - progress)} ${c}`} />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.mono, fontWeight: 700, fontSize: size * 0.22, color: ink}}>{label}</div>
    </div>
  );
};

const RecipeIngredientsSteps: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame - p.startAt;
  const ings = p.ingredients.slice(0, 12);
  const steps = (p.steps.length ? p.steps : [{text: 'Enjoy'}]).slice(0, 6);
  const nI = ings.length;
  const nS = steps.length;
  const ingGap = nI > 8 ? 5 : 8;
  const ingStart = 26;
  const ingEnd = ingStart + nI * ingGap + 8;
  const stepF = Math.max(20, p.stepFrames);
  const stepStart = ingEnd + 10;
  const enter = ease.out(sseg(t, 0, 20));
  const onAcc = onColor(p.accent);

  const pad = (portrait ? 0.06 : 0.05) * w;
  const gapPx = 34 * u;
  // geometry
  const headH = portrait ? h * 0.15 : h * 0.2;
  const colTop = portrait ? pad + headH : h * 0.09;
  const leftX = pad;
  const leftW = portrait ? w - pad * 2 : w * 0.37;
  const rightX = portrait ? pad : pad + leftW + gapPx;
  const rightW = portrait ? w - pad * 2 : w - rightX - pad;
  const ingH = portrait ? h * 0.3 : h - colTop - h * 0.09 - h * 0.0;
  const stepsTop = portrait ? colTop + ingH + gapPx : colTop;
  const stepsH = portrait ? h - stepsTop - pad : h - colTop - h * 0.09;

  const cardStyle: React.CSSProperties = {position: 'absolute', background: p.card, borderRadius: 30 * u, boxShadow: `0 ${18 * u}px ${48 * u}px ${withAlpha(p.ink, 0.1)}`, opacity: enter, overflow: 'hidden'};
  const twoCol = portrait && nI > 5;
  const rowsI = twoCol ? Math.ceil(nI / 2) : nI;

  // landscape ingredient card sits under the title block, so shrink it
  const ingCardTop = portrait ? colTop : colTop + (leftW * 0.36 + 16 * u) * 0 + h * 0.2;
  const ingCardH = portrait ? ingH : h - ingCardTop - h * 0.09;
  const ingRowH = Math.min(portrait ? 62 * u : 66 * u, (ingCardH - 100 * u) / rowsI);

  return (
    <AbsoluteFill style={{background: bgOf(p.background), fontFamily: fonts.sans, color: p.ink, overflow: 'hidden'}}>
      {/* title block */}
      <div style={{position: 'absolute', left: leftX, top: portrait ? pad : h * 0.07, width: leftW, display: 'flex', alignItems: 'center', gap: 26 * u, opacity: enter, transform: `translateY(${(1 - enter) * -20 * u}px)`}}>
        <div style={{transform: `rotate(${(1 - enter) * -30}deg)`}}>
          <Plate size={(portrait ? 190 : 156) * u} accent={p.accent} ink={p.ink} src={p.src || undefined} />
        </div>
        <div style={{minWidth: 0}}>
          <div style={{fontFamily: fonts.serif, fontWeight: 700, fontSize: (portrait ? 84 : 66) * u, lineHeight: 1.02}}>{p.title}</div>
          <div style={{fontFamily: fonts.mono, fontSize: (portrait ? 26 : 21) * u, letterSpacing: 3 * u, color: withAlpha(p.ink, 0.55), marginTop: 10 * u, textTransform: 'uppercase'}}>{p.subtitle}</div>
        </div>
      </div>

      {/* ingredients */}
      <div style={{...cardStyle, left: leftX, top: ingCardTop, width: leftW, height: ingCardH, padding: `${28 * u}px ${34 * u}px`}}>
        <div style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: 22 * u, letterSpacing: 4 * u, color: p.accent, marginBottom: 14 * u, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between'}}>
          <span>{p.ingredientsTitle}</span>
          <span style={{color: withAlpha(p.ink, 0.45)}}>
            {Math.min(nI, Math.max(0, Math.floor((t - ingStart) / ingGap) + 1))}/{nI}
          </span>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: twoCol ? '1fr 1fr' : '1fr', gridAutoFlow: 'column', gridTemplateRows: `repeat(${rowsI}, ${ingRowH}px)`, columnGap: 28 * u}}>
          {ings.map((it, i) => {
            const at = ingStart + i * ingGap;
            const appear = ease.out(sseg(t, at - 10, at - 2));
            const ck = sseg(t, at, at + 8);
            const pop = backOut(ck, 2.2);
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 18 * u, opacity: lerp(0.0, 1, appear) * lerp(1, 0.62, ck), transform: `translateX(${(1 - appear) * -26 * u}px)`}}>
                <div style={{width: 38 * u, height: 38 * u, borderRadius: 11 * u, border: `${3 * u}px solid ${ck > 0.3 ? p.accent : withAlpha(p.ink, 0.3)}`, background: ck > 0.3 ? p.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${ck > 0 ? 0.85 + 0.15 * pop : 1})`, flex: 'none'}}>
                  {ck > 0 ? <CheckMark size={26 * u} color={onAcc} p={ck} sw={3.4} /> : null}
                </div>
                <div style={{fontSize: (portrait ? 33 : 31) * u, fontWeight: 600, textDecoration: ck > 0.8 ? 'none' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{it}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* steps */}
      <div style={{...cardStyle, left: rightX, top: stepsTop, width: rightW, height: stepsH, padding: `${28 * u}px ${34 * u}px`, display: 'flex', flexDirection: 'column'}}>
        <div style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: 22 * u, letterSpacing: 4 * u, color: p.accent, marginBottom: 12 * u, textTransform: 'uppercase'}}>{p.stepsTitle}</div>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 14 * u, minHeight: 0}}>
          {steps.map((s, j) => {
            const a = stepStart + j * stepF;
            const act = t >= a && t < a + stepF;
            const done = t >= a + stepF;
            const local = sseg(t, a, a + stepF);
            const hi = ease.out(sseg(t, a - 4, a + 6)) * (done ? 0 : 1);
            const mins = s.minutes ?? 0;
            const timerOn = mins > 0;
            const remain = mins * 60 * (1 - local);
            const ringS = Math.min(96 * u, stepsH / nS * 0.62);
            return (
              <div
                key={j}
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 22 * u,
                  padding: `0 ${22 * u}px`,
                  borderRadius: 22 * u,
                  background: hi > 0 ? mixHex(p.card, p.accent, 0.11 * hi) : 'transparent',
                  border: `${3 * u}px solid ${hi > 0 ? withAlpha(p.accent, 0.55 * hi) : 'transparent'}`,
                  opacity: t < stepStart - 10 ? lerp(0.4, 0.4, 1) : done ? 0.55 : act ? 1 : 0.5,
                }}
              >
                <div style={{width: 64 * u, height: 64 * u, borderRadius: '50%', flex: 'none', background: act || done ? p.accent : 'transparent', border: `${3.5 * u}px solid ${act || done ? p.accent : withAlpha(p.ink, 0.3)}`, color: act || done ? onAcc : withAlpha(p.ink, 0.6), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 30 * u, fontFamily: fonts.display}}>
                  {done ? <CheckMark size={34 * u} color={onAcc} p={1} sw={3.4} /> : j + 1}
                </div>
                <div style={{flex: 1, minWidth: 0, fontSize: (portrait ? 34 : 31) * u, lineHeight: 1.22, fontWeight: act ? 800 : 600}}>{s.text}</div>
                {timerOn ? (
                  <Ring size={ringS} progress={done ? 1 : act ? local : 0} color={p.accent} track={withAlpha(p.ink, 0.12)} label={done ? '00:00' : mmss(act ? remain : mins * 60)} ink={p.ink} u={u} />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const recipeIngredientsSteps = defineMotion<Props>({
  id: 'recipe-ingredients-steps',
  title: 'Recipe: ingredients then timed steps',
  category: 'ui',
  description:
    'A recipe card: the ingredient checklist ticks off item by item, then the numbered method runs step by step, highlighting the active step with a live countdown ring on timed steps and checking each one off.',
  source: ['original (round 3)'],
  useFor: 'Recipe and cooking reels, meal-kit and food-brand promos, how-to-make-it explainers, kitchen app demos — set the dish, ingredients, steps (with minutes) and a dish photo.',
  durationInFrames: 300,
  defaultProps: {
    title: 'Lemon pancakes',
    subtitle: 'Serves 4 · 25 min',
    ingredientsTitle: 'Ingredients',
    stepsTitle: 'Method',
    ingredients: ['200 g plain flour', '2 tbsp sugar', '2 tsp baking powder', '300 ml milk', '2 eggs', 'Zest of 1 lemon'],
    steps: [
      {text: 'Whisk the dry ingredients together'},
      {text: 'Mix in milk, eggs and zest', minutes: 2},
      {text: 'Rest the batter', minutes: 5},
      {text: 'Cook until golden on both sides', minutes: 4},
    ],
    stepFrames: 46,
    src: '',
    background: '#F6EFE2',
    card: '#FFFFFF',
    ink: '#2A2118',
    accent: '#E0872B',
    startAt: 0,
  },
  propDocs: {
    title: 'dish name',
    subtitle: 'small caps line (serves, time ...)',
    ingredientsTitle: 'label above the checklist',
    stepsTitle: 'label above the method',
    ingredients: 'checklist lines, up to 12',
    steps: 'method steps, up to 6: {text, minutes?} — minutes > 0 shows a countdown timer ring',
    stepFrames: 'frames each step stays active (the timer runs down over this time)',
    src: "dish photo (public/ path or https URL); '' draws a plate illustration",
    background: "page colour or 'transparent'",
    card: 'panel colour',
    ink: 'text colour',
    accent: 'checks, active step and timer colour',
    startAt: 'frame the scene starts',
  },
  component: RecipeIngredientsSteps,
  tags: ['recipe', 'cooking', 'food', 'ingredients', 'steps', 'method', 'timer', 'checklist', 'kitchen', 'meal', 'how to', 'ui'],
});
