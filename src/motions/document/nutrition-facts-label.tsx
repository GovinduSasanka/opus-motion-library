import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp} from '../../core/ease';
import {bgOf, onColor} from '../../core/commerce-kit';
import {fonts} from '../../core/fonts';
import {sseg, withAlpha} from '../../core/r2-s1-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A nutrition-facts style label: rules draw on, then calories, nutrient amounts and daily-value percentages count up from
 * zero to your numbers. In wide frames a macro donut sits beside the label. Every figure and word is a prop.
 */
type Nutrient = {label: string; value: number; unit: string; daily?: number; indent?: boolean; bold?: boolean};
type Macro = {label: string; value: number; color: string};
type Props = {
  title: string;
  servings: string;
  servingLabel: string;
  servingSize: string;
  caloriesLabel: string;
  calories: number;
  amountLabel: string;
  dailyLabel: string;
  nutrients: Nutrient[];
  footnote: string;
  highlight: string;
  macros: Macro[];
  panelTitle: string;
  countFrames: number;
  background: string;
  paper: string;
  ink: string;
  accent: string;
  startAt: number;
};

const fmt = (v: number, dec: number) => (dec > 0 ? v.toFixed(dec) : String(Math.round(v)));
const decOf = (v: number) => (Math.abs(v - Math.round(v)) > 0.001 ? 1 : 0);

const Rule: React.FC<{h: number; ink: string; k: number}> = ({h, ink, k}) => (
  <div style={{height: h, background: ink, width: `${k * 100}%`, flex: 'none'}} />
);

const NutritionFactsLabel: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame - p.startAt;
  const rows = p.nutrients.slice(0, 14);
  const n = rows.length;
  const wide = w / h > 1.4;
  const cnt = Math.max(8, p.countFrames);

  const DW = 640;
  const ROW = 46;
  const DH = 428 + n * ROW;
  const showPanel = wide && p.macros.length > 0;
  const sc = Math.min((h * (portrait ? 0.9 : 0.9)) / DH, ((showPanel ? w * 0.4 : w * 0.88)) / DW);
  const lx = showPanel ? w * 0.08 : (w - DW * sc) / 2;
  const ly = (h - DH * sc) / 2;

  const panelInk = p.background === 'transparent' ? p.ink : onColor(p.background, '#111111', '#F5F5F5');
  const reveal = ease.out(sseg(t, 0, 26));
  const rule = (a: number, b: number) => ease.out(sseg(t, a, b));
  const num = (target: number, start: number, dec = decOf(target)) => fmt(target * ease.out(sseg(t, start, start + cnt)), dec);

  const tCal = 34;
  const rowStart = (i: number) => 52 + i * 6;
  const endAll = rowStart(n - 1) + cnt;
  const hiPulse = ease.out(sseg(t, endAll, endAll + 14)) * (0.8 + 0.2 * Math.sin((t - endAll) * 0.2));

  // macro donut
  const macros = p.macros.filter((m) => m.value > 0);
  const msum = macros.reduce((a, m) => a + m.value, 0) || 1;
  const dR = Math.min(w * 0.17, h * 0.26);
  const dW = dR * 0.34;
  const dcx = w * 0.74;
  const dcy = h * 0.42;
  const circ = 2 * Math.PI * (dR - dW / 2);
  const sweep = ease.out(sseg(t, 30, 30 + cnt + 20));

  let acc = 0;
  const arcs = macros.map((m, i) => {
    const frac = m.value / msum;
    const start = acc;
    acc += frac;
    const vis = Math.max(0, Math.min(frac, sweep - start));
    return (
      <circle key={i} cx={dcx} cy={dcy} r={dR - dW / 2} fill="none" stroke={m.color} strokeWidth={dW} strokeDasharray={`${circ * vis} ${circ}`} transform={`rotate(${-90 + start * 360} ${dcx} ${dcy})`} />
    );
  });

  return (
    <AbsoluteFill style={{background: bgOf(p.background), fontFamily: fonts.sans, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: lx, top: ly, width: DW, height: DH, transform: `scale(${sc})`, transformOrigin: '0 0', opacity: Math.min(1, reveal * 3)}}>
        <div style={{position: 'absolute', inset: 0, background: p.paper, border: `3px solid ${p.ink}`, borderRadius: 6, boxShadow: `0 ${30}px ${70}px ${withAlpha('#000000', 0.22)}`, clipPath: `inset(0 0 ${(1 - reveal) * 100}% 0)`}} />
        <div style={{position: 'absolute', inset: 0, padding: '14px 22px 12px', color: p.ink, display: 'flex', flexDirection: 'column'}}>
          <div style={{fontWeight: 800, fontSize: 74, lineHeight: 1, letterSpacing: -2, opacity: ease.out(sseg(t, 4, 18)), transform: `translateY(${(1 - ease.out(sseg(t, 4, 18))) * 16}px)`}}>{p.title}</div>
          <Rule h={2} ink={p.ink} k={rule(10, 22)} />
          <div style={{fontSize: 22, padding: '4px 0 0', opacity: ease.out(sseg(t, 14, 26))}}>{p.servings}</div>
          <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 28, lineHeight: 1.25, opacity: ease.out(sseg(t, 16, 28))}}>
            <span>{p.servingLabel}</span>
            <span>{p.servingSize}</span>
          </div>
          <div style={{height: 6}} />
          <Rule h={14} ink={p.ink} k={rule(18, 32)} />
          <div style={{fontWeight: 800, fontSize: 19, padding: '4px 0 0', opacity: ease.out(sseg(t, 24, 36))}}>{p.amountLabel}</div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', lineHeight: 1}}>
            <span style={{fontWeight: 800, fontSize: 48}}>{p.caloriesLabel}</span>
            <span style={{fontWeight: 800, fontSize: 80, letterSpacing: -2}}>{num(p.calories, tCal, 0)}</span>
          </div>
          <div style={{height: 4}} />
          <Rule h={8} ink={p.ink} k={rule(30, 44)} />
          <div style={{textAlign: 'right', fontWeight: 800, fontSize: 19, padding: '3px 0', opacity: ease.out(sseg(t, 36, 48))}}>{p.dailyLabel}</div>
          <Rule h={2} ink={p.ink} k={rule(34, 46)} />
          {rows.map((r, i) => {
            const a = rowStart(i);
            const op = ease.out(sseg(t, a - 4, a + 6));
            const isHi = !!p.highlight && r.label.toLowerCase() === p.highlight.toLowerCase();
            const bold = r.bold ?? !r.indent;
            return (
              <div key={i} style={{height: ROW, flex: 'none', position: 'relative', opacity: op, transform: `translateX(${(1 - op) * -14}px)`}}>
                {isHi ? <div style={{position: 'absolute', left: -8, right: -8, top: 2, bottom: 2, background: withAlpha(p.accent, 0.28 * hiPulse), borderRadius: 6, borderLeft: `${6 * hiPulse}px solid ${p.accent}`}} /> : null}
                <div style={{position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: ROW - 2, paddingLeft: r.indent ? 26 : 0, fontSize: 26}}>
                  <span>
                    <span style={{fontWeight: bold ? 800 : 500}}>{r.label}</span>{' '}
                    <span style={{fontWeight: 500}}>
                      {num(r.value, a)}
                      {r.unit}
                    </span>
                  </span>
                  {r.daily !== undefined ? <span style={{fontWeight: 800}}>{num(r.daily, a, 0)}%</span> : null}
                </div>
                <div style={{position: 'absolute', left: 0, bottom: 0, height: 1.5, width: `${ease.out(sseg(t, a, a + 10)) * 100}%`, background: withAlpha(p.ink, 0.55)}} />
              </div>
            );
          })}
          <Rule h={8} ink={p.ink} k={rule(rowStart(n - 1), rowStart(n - 1) + 14)} />
          <div style={{fontSize: 16.5, lineHeight: 1.3, paddingTop: 6, opacity: ease.out(sseg(t, endAll - 10, endAll + 6)), color: withAlpha(p.ink, 0.85)}}>{p.footnote}</div>
        </div>
      </div>

      {showPanel ? (
        <>
          <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
            <circle cx={dcx} cy={dcy} r={dR - dW / 2} fill="none" stroke={withAlpha(panelInk, 0.12)} strokeWidth={dW} />
            {arcs}
          </svg>
          <div style={{position: 'absolute', left: dcx - dR, top: dcy - 70 * u, width: dR * 2, textAlign: 'center', color: panelInk, opacity: ease.out(sseg(t, 36, 52))}}>
            <div style={{fontWeight: 800, fontSize: 84 * u, lineHeight: 1, fontFamily: fonts.display}}>{num(p.calories, tCal, 0)}</div>
            <div style={{fontFamily: fonts.mono, fontSize: 22 * u, letterSpacing: 4 * u, color: withAlpha(panelInk, 0.6), marginTop: 6 * u, textTransform: 'uppercase'}}>{p.caloriesLabel}</div>
          </div>
          <div style={{position: 'absolute', left: w * 0.55, width: w * 0.38, top: dcy + dR + 40 * u, color: panelInk}}>
            <div style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: 21 * u, letterSpacing: 4 * u, color: withAlpha(panelInk, 0.6), textTransform: 'uppercase', marginBottom: 14 * u, textAlign: 'center', opacity: ease.out(sseg(t, 40, 56))}}>{p.panelTitle}</div>
            <div style={{display: 'flex', justifyContent: 'center', gap: 34 * u, flexWrap: 'wrap'}}>
              {macros.map((m, i) => {
                const a = 46 + i * 8;
                const op = ease.out(sseg(t, a, a + 10));
                return (
                  <div key={i} style={{display: 'flex', alignItems: 'center', gap: 12 * u, opacity: op, transform: `translateY(${(1 - op) * 12 * u}px)`}}>
                    <div style={{width: 22 * u, height: 22 * u, borderRadius: 6 * u, background: m.color}} />
                    <div style={{fontSize: 28 * u, fontWeight: 700}}>
                      {m.label} <span style={{fontWeight: 500, color: withAlpha(panelInk, 0.7)}}>{Math.round(((m.value * lerp(0, 1, op)) / msum) * 100 * 1) || 0}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

export const nutritionFactsLabel = defineMotion<Props>({
  id: 'nutrition-facts-label',
  title: 'Nutrition facts label (count-up)',
  category: 'document',
  description:
    'A printed-style nutrition label: heavy rules draw on, then calories, nutrient amounts and daily-value percentages count up from zero in sequence, one row highlighted; wide frames add a macro donut that sweeps in beside it.',
  source: ['original (round 3)'],
  useFor: 'Food and drink product promos, packaged-goods ads, health / diet explainers, recipe cards, menu nutrition callouts — set the calories, nutrient rows, serving info and colours.',
  durationInFrames: 240,
  defaultProps: {
    title: 'Nutrition Facts',
    servings: '8 servings per container',
    servingLabel: 'Serving size',
    servingSize: '2/3 cup (55 g)',
    caloriesLabel: 'Calories',
    calories: 230,
    amountLabel: 'Amount per serving',
    dailyLabel: '% Daily Value*',
    nutrients: [
      {label: 'Total Fat', value: 8, unit: 'g', daily: 10},
      {label: 'Saturated Fat', value: 1, unit: 'g', daily: 5, indent: true},
      {label: 'Cholesterol', value: 0, unit: 'mg', daily: 0},
      {label: 'Sodium', value: 160, unit: 'mg', daily: 7},
      {label: 'Total Carbohydrate', value: 37, unit: 'g', daily: 13},
      {label: 'Dietary Fiber', value: 4, unit: 'g', daily: 14, indent: true},
      {label: 'Total Sugars', value: 12, unit: 'g', indent: true},
      {label: 'Protein', value: 3, unit: 'g'},
      {label: 'Calcium', value: 260, unit: 'mg', daily: 20},
    ],
    footnote: '* The % Daily Value tells you how much a nutrient in a serving contributes to a daily diet.',
    highlight: 'Total Sugars',
    macros: [
      {label: 'Carbs', value: 37, color: '#F2B134'},
      {label: 'Fat', value: 8, color: '#E4572E'},
      {label: 'Protein', value: 3, color: '#2E86AB'},
    ],
    panelTitle: 'Where the energy comes from',
    countFrames: 22,
    background: '#E9EFE4',
    paper: '#FFFFFF',
    ink: '#111111',
    accent: '#F2B134',
    startAt: 0,
  },
  propDocs: {
    title: 'label heading',
    servings: 'servings-per-container line',
    servingLabel: 'left text of the serving-size line',
    servingSize: 'right text of the serving-size line',
    caloriesLabel: 'word next to the big calorie number',
    calories: 'calories (counts up from 0)',
    amountLabel: 'small line above the calories',
    dailyLabel: 'column header over the percentages',
    nutrients: 'rows, up to 14: {label, value, unit, daily? (%), indent?, bold?} — value and daily count up',
    footnote: 'small print under the label',
    highlight: 'label of a row to highlight (case-insensitive; empty for none)',
    macros: 'donut segments in wide frames: {label, value, color} — shares are value / sum',
    panelTitle: 'caption above the macro legend',
    countFrames: 'frames each number takes to count up',
    background: "page colour or 'transparent'",
    paper: 'label colour',
    ink: 'text and rule colour',
    accent: 'highlighted row colour',
    startAt: 'frame the scene starts',
  },
  component: NutritionFactsLabel,
  tags: ['nutrition', 'food', 'label', 'calories', 'health', 'diet', 'ingredients', 'packaging', 'count up', 'macros', 'product', 'document'],
});
