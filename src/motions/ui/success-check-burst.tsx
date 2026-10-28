import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {backOut, easeOut3, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {TAU, bgCss, fam} from '../../core/ui-loop-kit';

/**
 * Status badge: a circle pops, its ring draws, a checkmark (or a cross for `error`) draws on inside it, a shock ring
 * expands and a burst of particles flies out; the title and message rise in underneath, hold, and everything fades
 * back to the empty frame — so frame 0 and the last frame match and the clip loops. The `error` variant shakes
 * instead of bursting; `warning` draws an exclamation mark.
 */
type Variant = 'success' | 'error' | 'warning';
type Props = {
  variant: Variant;
  title: string;
  message: string;
  showText: boolean;
  particles: number;
  size: number;
  background: string;
  ink: string;
  accent: string;
  errorColor: string;
  warningColor: string;
  accent2: string;
  fontFamily: string;
};

const SuccessCheckBurst: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: T, portrait} = useStage();
  const v: Variant = P.variant === 'error' || P.variant === 'warning' ? P.variant : 'success';
  const color = v === 'error' ? P.errorColor : v === 'warning' ? P.warningColor : P.accent;
  const font = fam(P.fontFamily);
  const sz = Math.max(0.4, P.size || 1);
  const R = Math.min(w, h) * (portrait ? 0.17 : 0.15) * sz;
  const hasText = P.showText && (P.title || P.message);
  const cx = w / 2;
  const cy = h / 2 - (hasText ? R * 0.95 : 0);

  // timeline (frames, scaled to the loop length so a longer/shorter clip keeps the same shape)
  const k = T / 120;
  const t0 = 8 * k;
  const exit = sseg(frame, 100 * k, 116 * k);
  const out = 1 - easeOut3(exit);
  const pop = backOut(sseg(frame, t0, t0 + 14 * k), 2.2);
  const disc = sseg(frame, t0, t0 + 12 * k);
  const ringDraw = easeOut3(sseg(frame, t0 + 4 * k, t0 + 26 * k));
  const mark = easeOut3(sseg(frame, t0 + 20 * k, t0 + 38 * k));
  const shock = sseg(frame, t0 + 22 * k, t0 + 56 * k);
  const textIn = easeOut3(sseg(frame, t0 + 36 * k, t0 + 56 * k));
  const shake = v === 'error' ? Math.sin((frame - (t0 + 30 * k)) * 1.3) * Math.exp(-Math.max(0, frame - (t0 + 30 * k)) / (9 * k)) * (frame > t0 + 30 * k ? 1 : 0) * 16 * u * sz : 0;
  const scale = pop * (1 - 0.18 * (1 - out));

  // mark geometry (centred on the disc)
  const g = R * 0.5;
  const checkPath = `M${-g * 0.62} ${g * 0.06} L${-g * 0.14} ${g * 0.54} L${g * 0.7} ${-g * 0.5}`;
  const crossA = `M${-g * 0.5} ${-g * 0.5} L${g * 0.5} ${g * 0.5}`;
  const crossB = `M${g * 0.5} ${-g * 0.5} L${-g * 0.5} ${g * 0.5}`;
  const warnA = `M0 ${-g * 0.62} L0 ${g * 0.12}`;
  const mw = R * 0.15;

  const N = Math.max(0, Math.min(60, Math.round(P.particles)));
  const parts = React.useMemo(() => {
    const r = rng('scb');
    return Array.from({length: N}, (_, i) => {
      const a = (i / Math.max(1, N)) * TAU + (r() - 0.5) * 0.5;
      return {a, speed: 1.1 + r() * 1.3, size: 0.07 + r() * 0.09, kind: Math.floor(r() * 3), spin: (r() - 0.5) * 7, delay: r() * 0.12, col: i % 3, g: 0.25 + r() * 0.3};
    });
  }, [N]);
  const burst = v === 'success' || v === 'warning';
  const pcols = [color, P.accent2, mixHex(color, '#ffffff', 0.45)];

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      <Svg>
        <g transform={`translate(${cx + shake} ${cy})`}>
          {/* soft glow */}
          <circle r={R * 1.45} fill={withAlpha(color, 0.1 * disc * out)} />
          {/* shock rings */}
          {[0, 1].map((i) => {
            const s = sseg(shock, i * 0.18, 1);
            if (s <= 0 || s >= 1) return null;
            return <circle key={i} r={R * (1.05 + 0.6 * easeOut3(s))} fill="none" stroke={color} strokeWidth={R * 0.07 * (1 - s)} opacity={(1 - s) * 0.8 * out} />;
          })}
          {/* particles */}
          {burst &&
            parts.map((p, i) => {
              const s = sseg(shock, p.delay, 1);
              if (s <= 0 || s >= 1) return null;
              const d = R * (1.15 + p.speed * 1.1 * easeOut3(s));
              const x = Math.cos(p.a) * d;
              const y = Math.sin(p.a) * d + R * p.g * s * s;
              const sc = R * p.size * (1 - s * 0.7);
              const col = pcols[p.col];
              const op = (1 - s * s) * out;
              const rot = p.spin * s * 180;
              if (p.kind === 0) return <circle key={i} cx={x} cy={y} r={sc} fill={col} opacity={op} />;
              if (p.kind === 1) return <rect key={i} x={x - sc} y={y - sc * 0.5} width={sc * 2} height={sc} rx={sc * 0.25} fill={col} opacity={op} transform={`rotate(${rot} ${x} ${y})`} />;
              return <path key={i} d={`M${x} ${y - sc * 1.3} L${x + sc * 0.4} ${y - sc * 0.4} L${x + sc * 1.3} ${y} L${x + sc * 0.4} ${y + sc * 0.4} L${x} ${y + sc * 1.3} L${x - sc * 0.4} ${y + sc * 0.4} L${x - sc * 1.3} ${y} L${x - sc * 0.4} ${y - sc * 0.4}Z`} fill={col} opacity={op} transform={`rotate(${rot} ${x} ${y})`} />;
            })}
          {/* badge */}
          <g transform={`scale(${Math.max(0.0001, scale)})`} opacity={out}>
            <circle r={R} fill={withAlpha(color, 0.16)} opacity={disc} />
            <circle r={R * 0.86} fill={color} opacity={disc} />
            <circle r={R} fill="none" stroke={color} strokeWidth={R * 0.06} strokeLinecap="round" pathLength={1} strokeDasharray={`${ringDraw} 2`} opacity={ringDraw > 0 ? 1 : 0} transform="rotate(-90)" />
            {mark > 0 && v === 'success' && <path d={checkPath} fill="none" stroke="#ffffff" strokeWidth={mw} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${mark} 2`} />}
            {v === 'error' && (
              <>
                {mark > 0 && <path d={crossA} fill="none" stroke="#ffffff" strokeWidth={mw} strokeLinecap="round" pathLength={1} strokeDasharray={`${Math.min(1, mark * 2)} 2`} />}
                {mark > 0.5 && <path d={crossB} fill="none" stroke="#ffffff" strokeWidth={mw} strokeLinecap="round" pathLength={1} strokeDasharray={`${Math.min(1, (mark - 0.5) * 2)} 2`} />}
              </>
            )}
            {v === 'warning' && mark > 0 && (
              <>
                <path d={warnA} fill="none" stroke="#ffffff" strokeWidth={mw} strokeLinecap="round" pathLength={1} strokeDasharray={`${Math.min(1, mark * 1.5)} 2`} />
                <circle cx={0} cy={g * 0.52} r={mw * 0.62} fill="#ffffff" opacity={sseg(mark, 0.6, 1)} />
              </>
            )}
          </g>
        </g>
      </Svg>
      {hasText && (
        <div style={{position: 'absolute', left: 0, right: 0, top: cy + R * 1.95, textAlign: 'center', opacity: textIn * out, transform: `translateY(${(1 - textIn) * 26 * u}px)`, fontFamily: font, padding: `0 ${60 * u}px`}}>
          {P.title && <div style={{fontSize: Math.max(34 * u, R * 0.4), fontWeight: 800, color: P.ink, letterSpacing: -0.5 * u, lineHeight: 1.15}}>{P.title}</div>}
          {P.message && <div style={{marginTop: 12 * u, fontSize: Math.max(24 * u, R * 0.24), fontWeight: 400, color: withAlpha(P.ink, 0.62), lineHeight: 1.35}}>{P.message}</div>}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const successCheckBurst = defineMotion<Props>({
  id: 'success-check-burst',
  title: 'Success / error check burst',
  category: 'ui',
  description: 'A badge pops, its ring and a checkmark draw on, a shock ring and particles burst out and a message rises; `error` swaps in a shaking cross, `warning` an exclamation mark. Fades back to empty so it loops.',
  source: ['original'],
  useFor: 'Payment done, form submitted, upload finished, task failed — a confirmation state for apps, checkout flows, onboarding and product demos.',
  durationInFrames: 120,
  defaultProps: {
    variant: 'success',
    title: 'Payment successful',
    message: 'Your receipt is on its way to your inbox.',
    showText: true,
    particles: 22,
    size: 1,
    background: '#F7F8FB',
    ink: '#1B2233',
    accent: '#18B26B',
    errorColor: '#F0506E',
    warningColor: '#F5A524',
    accent2: '#FFC93C',
    fontFamily: 'auto',
  },
  propDocs: {
    variant: 'success | error | warning',
    title: 'headline under the badge',
    message: 'one supporting line',
    showText: 'show the title and message',
    particles: 'particles in the burst (0-60; success and warning only)',
    size: 'scale of the badge',
    background: 'frame colour, or "transparent" to overlay content',
    ink: 'text colour',
    accent: 'success colour',
    errorColor: 'error colour',
    warningColor: 'warning colour',
    accent2: 'second particle colour',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: SuccessCheckBurst,
  tags: ['success', 'check', 'checkmark', 'error', 'cross', 'warning', 'confirmation', 'done', 'ui', 'celebrate', 'burst', 'particles', 'status', 'loop', 'overlay', 'app', 'website'],
});
