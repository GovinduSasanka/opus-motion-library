import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {mixHex, withAlpha} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {TAU, bgCss, cycles, fam, fract, loopPhase, tri} from '../../core/ui-loop-kit';

/**
 * A set of six seamless loading indicators — ring, dots, bars, orbit, pulse and morph — chosen with `variant`
 * (or `all` for a 3x2 sheet). One loop = `speed` whole turns, so the last frame joins the first with no jump.
 * Drop it behind a "Loading…" label, a splash screen, an app shell or a generating-state; set background to
 * "transparent" to overlay it on other content.
 */
type Variant = 'ring' | 'dots' | 'bars' | 'orbit' | 'pulse' | 'morph';
type Props = {
  variant: Variant | 'all';
  label: string;
  showLabel: boolean;
  speed: number;
  size: number;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  fontFamily: string;
};

const VARIANTS: Variant[] = ['ring', 'dots', 'bars', 'orbit', 'pulse', 'morph'];

type DrawArgs = {v: Variant; ph: number; n: number; R: number; ink: string; accent: string; accent2: string; id: string};

/** one indicator centred on (0,0) inside a circle of radius R */
const Indicator: React.FC<DrawArgs> = ({v, ph, n, R, ink, accent, accent2, id}) => {
  const p = ph * n;
  if (v === 'ring') {
    const C = 2 * Math.PI * R * 0.82;
    const r = R * 0.82;
    const len = (0.12 + 0.5 * tri(p)) * C;
    const rot = fract(p) * 360 * 2; // two turns per cycle: head chases the tail
    return (
      <g>
        <circle r={r} fill="none" stroke={withAlpha(ink, 0.12)} strokeWidth={R * 0.16} />
        <g transform={`rotate(${rot - 90})`}>
          <circle r={r} fill="none" stroke={accent} strokeWidth={R * 0.16} strokeLinecap="round" strokeDasharray={`${len} ${C}`} />
        </g>
      </g>
    );
  }
  if (v === 'dots') {
    const N = 10;
    return (
      <g>
        {Array.from({length: N}, (_, i) => {
          const a = (i / N) * TAU - Math.PI / 2;
          const k = fract(p - i / N); // 0 = brightest
          const s = 0.35 + 0.65 * (1 - k);
          return <circle key={i} cx={Math.cos(a) * R * 0.78} cy={Math.sin(a) * R * 0.78} r={R * 0.12 * s + R * 0.02} fill={mixHex(accent, accent2, i / N)} opacity={0.18 + 0.82 * (1 - k) * (1 - k)} />;
        })}
      </g>
    );
  }
  if (v === 'bars') {
    const N = 5;
    const bw = R * 0.26;
    const gap = R * 0.18;
    const total = N * bw + (N - 1) * gap;
    return (
      <g>
        {Array.from({length: N}, (_, i) => {
          const s = 0.3 + 0.7 * tri(p - i * 0.09);
          const bh = R * 1.5 * s;
          return <rect key={i} x={-total / 2 + i * (bw + gap)} y={-bh / 2} width={bw} height={bh} rx={bw / 2} fill={mixHex(accent, accent2, i / (N - 1))} />;
        })}
      </g>
    );
  }
  if (v === 'orbit') {
    return (
      <g>
        <circle r={R * 0.86} fill="none" stroke={withAlpha(ink, 0.1)} strokeWidth={R * 0.03} />
        <circle r={R * 0.5} fill="none" stroke={withAlpha(ink, 0.1)} strokeWidth={R * 0.03} />
        <circle r={R * 0.2 * (1 + 0.1 * Math.sin(TAU * p))} fill={accent} />
        {[0, 1, 2].map((i) => {
          const a = TAU * p * (i === 0 ? 1 : i === 1 ? -2 : 3) + (i * TAU) / 3;
          const rad = i === 1 ? R * 0.5 : R * 0.86;
          const rr = R * (i === 1 ? 0.1 : 0.12);
          return <circle key={i} cx={Math.cos(a) * rad} cy={Math.sin(a) * rad} r={rr} fill={i === 1 ? ink : accent2} />;
        })}
      </g>
    );
  }
  if (v === 'pulse') {
    return (
      <g>
        {[0, 1, 2].map((i) => {
          const k = fract(p + i / 3);
          return <circle key={i} r={R * (0.2 + 0.8 * k)} fill="none" stroke={mixHex(accent, accent2, k)} strokeWidth={R * 0.1 * (1 - k * 0.6)} opacity={(1 - k) * (1 - k) * 1.1} />;
        })}
        <circle r={R * 0.2 * (1 + 0.15 * Math.sin(TAU * p * 3))} fill={accent} />
      </g>
    );
  }
  // morph: a rounded square that turns into a circle and back while it rotates, colour sliding accent -> accent2
  const k = tri(p);
  const side = R * (1.1 - 0.25 * k);
  const rot = fract(p) * 180;
  const col = mixHex(accent, accent2, k);
  return (
    <g>
      <rect x={-side / 2 - R * 0.06} y={-side / 2 + R * 0.12} width={side} height={side} rx={side * (0.12 + 0.38 * k)} fill={withAlpha(ink, 0.1)} transform={`rotate(${rot})`} />
      <rect x={-side / 2} y={-side / 2} width={side} height={side} rx={side * (0.12 + 0.38 * k)} fill={col} transform={`rotate(${rot})`} />
      <circle r={R * 0.1} fill={withAlpha('#ffffff', 0.9)} id={`${id}-core`} />
    </g>
  );
};

const LoaderSpinnerSet: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames, portrait} = useStage();
  const ph = loopPhase(frame, durationInFrames);
  const n = cycles(P.speed);
  const font = fam(P.fontFamily);
  const bg = bgCss(P.background);
  const all = P.variant === 'all';
  const sz = Math.max(0.3, P.size || 1);
  const label = (P.label || '').trim();
  const dotsOn = Math.floor(fract(ph * n) * 4); // "Loading" + 0..3 dots, wraps with the loop

  const labelEl = (cxx: number, cyy: number, fs: number, text: string, animate: boolean) => (
    <div style={{position: 'absolute', left: cxx - 600 * u, top: cyy, width: 1200 * u, textAlign: 'center', fontFamily: font, fontWeight: 600, fontSize: fs, color: P.ink, letterSpacing: fs * 0.01, whiteSpace: 'nowrap'}}>
      {text}
      {animate && (
        <span>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{opacity: dotsOn > i ? 1 : 0}}>
              .
            </span>
          ))}
        </span>
      )}
    </div>
  );

  if (all) {
    const cols = portrait ? 2 : 3;
    const rows = portrait ? 3 : 2;
    const cw = w / cols;
    const ch = h / rows;
    const R = Math.min(cw, ch) * 0.2 * sz;
    return (
      <AbsoluteFill style={{background: bg}}>
        <Svg>
          {VARIANTS.map((v, i) => {
            const c = i % cols;
            const r = Math.floor(i / cols);
            const cxx = cw * (c + 0.5);
            const cyy = ch * (r + 0.5) - R * 0.25;
            return (
              <g key={v} transform={`translate(${cxx} ${cyy})`}>
                <Indicator v={v} ph={ph} n={n} R={R} ink={P.ink} accent={P.accent} accent2={P.accent2} id={`lss-${v}`} />
              </g>
            );
          })}
        </Svg>
        {VARIANTS.map((v, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          return <React.Fragment key={v}>{labelEl(cw * (c + 0.5), ch * (r + 0.5) + R * 1.15, 26 * u, v, false)}</React.Fragment>;
        })}
      </AbsoluteFill>
    );
  }

  const R = Math.min(w, h) * (portrait ? 0.2 : 0.17) * sz;
  const cyy = h / 2 - (P.showLabel && label ? R * 0.22 : 0);
  return (
    <AbsoluteFill style={{background: bg}}>
      <Svg>
        <g transform={`translate(${w / 2} ${cyy})`}>
          <Indicator v={P.variant as Variant} ph={ph} n={n} R={R} ink={P.ink} accent={P.accent} accent2={P.accent2} id="lss" />
        </g>
      </Svg>
      {P.showLabel && label ? labelEl(w / 2, cyy + R * 1.3, Math.max(24 * u, R * 0.24), label, true) : null}
    </AbsoluteFill>
  );
};

export const loaderSpinnerSet = defineMotion<Props>({
  id: 'loader-spinner-set',
  title: 'Loader / spinner set',
  category: 'ui',
  description: 'Six seamless loading indicators — spinning ring, chasing dots, equaliser bars, orbit, sonar pulse and a morphing shape — with an optional "Loading…" label.',
  source: ['original'],
  useFor: 'Loading, buffering, "generating…" and splash screens for apps and websites; pick the variant that matches the brand, or show all six as a sheet.',
  durationInFrames: 120,
  defaultProps: {
    variant: 'ring',
    label: 'Loading',
    showLabel: true,
    speed: 2,
    size: 1,
    background: '#F6F7FB',
    ink: '#1E2433',
    accent: '#4F6BFF',
    accent2: '#B26BFF',
    fontFamily: 'auto',
  },
  propDocs: {
    variant: 'ring | dots | bars | orbit | pulse | morph | all (all = a sheet of the six)',
    label: 'text under the loader ("Loading", "Generating", …); animated dots are appended',
    showLabel: 'show the label',
    speed: 'whole cycles per 4 s loop (integer, 1 = slow, 3 = brisk) — keeps the loop seamless',
    size: 'scale of the indicator',
    background: 'frame colour, or "transparent" to overlay content',
    ink: 'label / track colour',
    accent: 'main indicator colour',
    accent2: 'secondary colour (gradient / satellites)',
    fontFamily: 'CSS font family for the label, or "auto"',
  },
  component: LoaderSpinnerSet,
  tags: ['loader', 'spinner', 'loading', 'ui', 'progress', 'waiting', 'buffering', 'loop', 'website', 'app', 'splash', 'overlay', 'dots', 'ring', 'pulse'],
});
