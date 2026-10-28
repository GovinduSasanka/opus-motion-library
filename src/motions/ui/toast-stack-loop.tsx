import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {backOut, easeIO, easeOut3, sseg, withAlpha} from '../../core/r2-s1-kit';
import {wrapText} from '../../core/r3-social';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {bgCss, fam} from '../../core/ui-loop-kit';

/**
 * App toasts that slide in one after another, stack, count down their auto-dismiss bar and slide out — all inside one
 * loop (the screen is empty at the first and last frame). Each toast has a type (success / error / warning / info) that
 * sets its icon and colour. Corner or centre, light or dark, over a faint app wireframe (or fully transparent as an overlay).
 */
type Kind = 'success' | 'error' | 'warning' | 'info';
type Toast = {type: Kind; title: string; message?: string};
type Props = {
  toasts: Toast[];
  position: 'bottom-right' | 'top-right' | 'bottom-center' | 'top-center';
  theme: 'light' | 'dark';
  life: number;
  stagger: number;
  showPage: boolean;
  background: string;
  surfaceColor: string;
  ink: string;
  accent: string;
  errorColor: string;
  warningColor: string;
  infoColor: string;
  fontFamily: string;
};

const DEFAULT_TOASTS: Toast[] = [
  {type: 'success', title: 'Changes saved', message: 'Your profile was updated.'},
  {type: 'info', title: 'New version available', message: 'Refresh to get the latest features.'},
  {type: 'warning', title: 'Storage almost full', message: '92% of your plan is used.'},
  {type: 'error', title: 'Payment failed', message: 'Check your card details and try again.'},
];

const Glyph: React.FC<{kind: Kind; s: number}> = ({kind, s}) => {
  const sw = s * 0.16;
  const common = {fill: 'none', stroke: '#ffffff', strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  if (kind === 'success') return <path d={`M${-s * 0.34} ${s * 0.02} L${-s * 0.08} ${s * 0.28} L${s * 0.36} ${-s * 0.24}`} {...common} />;
  if (kind === 'error') return <path d={`M${-s * 0.26} ${-s * 0.26} L${s * 0.26} ${s * 0.26} M${s * 0.26} ${-s * 0.26} L${-s * 0.26} ${s * 0.26}`} {...common} />;
  if (kind === 'warning')
    return (
      <>
        <path d={`M0 ${-s * 0.32} L0 ${s * 0.06}`} {...common} />
        <circle cy={s * 0.3} r={sw * 0.62} fill="#ffffff" />
      </>
    );
  return (
    <>
      <path d={`M0 ${-s * 0.02} L0 ${s * 0.34}`} {...common} />
      <circle cy={-s * 0.32} r={sw * 0.62} fill="#ffffff" />
    </>
  );
};

const ToastStackLoop: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: T, portrait} = useStage();
  const toasts = (P.toasts && P.toasts.length ? P.toasts : DEFAULT_TOASTS).slice(0, 6);
  const n = toasts.length;
  const font = fam(P.fontFamily);
  const dark = P.theme === 'dark';
  const sc = P.surfaceColor === 'auto' ? (dark ? '#1C2030' : '#FFFFFF') : P.surfaceColor;
  const sub = withAlpha(P.ink, 0.62);
  const kindColor: Record<Kind, string> = {success: P.accent, error: P.errorColor, warning: P.warningColor, info: P.infoColor};

  // schedule: toast i enters at `st[i]`, auto-dismisses `life` frames later; compressed so the last exit ends before the loop does
  const enter = 14;
  const leave = 14;
  let step = P.stagger;
  let life = P.life;
  const need = (n - 1) * step + life + enter + leave + 12;
  const room = T - 12;
  if (need > room) {
    const f = room / need;
    step *= f;
    life *= f;
  }
  const st = toasts.map((_, i) => 8 + i * step);

  // geometry
  const S = (portrait ? 1.5 : 1.3) * u;
  const tw = portrait ? w * 0.9 : Math.min(w * 0.46, 640 * S);
  const pad = 22 * S;
  const lineH = 1.3;
  const tFs = 25 * S;
  const mFs = 21 * S;
  const textW = tw - pad * 2 - 56 * S - 40 * S;
  const heights = toasts.map((t) => {
    const lines = t.message ? wrapText(t.message, mFs, textW, 'sans', 2).length : 0;
    return pad * 2 + tFs * lineH + lines * mFs * lineH + (lines ? 6 * S : 0) + 8 * S;
  });
  const gap = 16 * S;
  const bottom = P.position.startsWith('bottom');
  const centered = P.position.endsWith('center');
  const margin = Math.max(36 * u, w * 0.03);
  const x0 = centered ? (w - tw) / 2 : w - tw - margin;
  const edge = margin + (portrait ? 40 * u : 0);

  const slide = (portrait ? 0.35 : 0.5) * tw;

  const dir = bottom ? -1 : 1; // direction new toasts push older ones
  const cards = toasts.map((t, i) => {
    const inP = sseg(frame, st[i], st[i] + enter);
    const outP = sseg(frame, st[i] + enter + life, st[i] + enter + life + leave);
    if (inP <= 0 || outP >= 1) return null;
    let pushed = 0;
    for (let j = i + 1; j < n; j++) pushed += easeIO(sseg(frame, st[j], st[j] + enter)) * (heights[j] + gap);
    const baseY = bottom ? h - edge - heights[i] : edge;
    const y = baseY + dir * pushed;
    const xoff = centered ? 0 : (1 - easeOut3(inP)) * slide + easeIO(outP) * slide;
    const yoff = centered ? (1 - easeOut3(inP)) * 60 * S * (bottom ? 1 : -1) + easeIO(outP) * 40 * S * (bottom ? 1 : -1) : 0;
    const alpha = Math.min(sseg(frame, st[i], st[i] + enter * 0.6), 1 - outP);
    const col = kindColor[t.type] || P.infoColor;
    const timer = 1 - sseg(frame, st[i] + enter, st[i] + enter + life);
    const iconS = 56 * S;
    const msgLines = t.message ? wrapText(t.message, mFs, textW, 'sans', 2) : [];
    const pop = backOut(sseg(frame, st[i] + 4, st[i] + enter + 6), 2.4);
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x0,
          top: y,
          width: tw,
          height: heights[i],
          opacity: alpha,
          transform: `translate(${xoff}px, ${yoff}px) scale(${0.96 + 0.04 * easeOut3(inP)})`,
          background: sc,
          borderRadius: 22 * S,
          boxShadow: dark ? `0 ${18 * S}px ${40 * S}px rgba(0,0,0,0.45), 0 0 0 ${1.5 * u}px rgba(255,255,255,0.07)` : `0 ${16 * S}px ${40 * S}px rgba(24,32,60,0.16), 0 0 0 ${1.5 * u}px rgba(24,32,60,0.05)`,
          overflow: 'hidden',
          fontFamily: font,
        }}
      >
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 * S, background: col}} />
        <svg width={iconS} height={iconS} viewBox={`${-iconS / 2} ${-iconS / 2} ${iconS} ${iconS}`} style={{position: 'absolute', left: pad + 6 * S, top: pad}}>
          <circle r={iconS * 0.5 * pop} fill={col} />
          <g transform={`scale(${pop})`}>
            <Glyph kind={t.type} s={iconS * 0.9} />
          </g>
        </svg>
        <div style={{position: 'absolute', left: pad + 6 * S + iconS + 18 * S, top: pad - 2 * S, right: pad + 30 * S}}>
          <div style={{fontSize: tFs, fontWeight: 800, color: P.ink, lineHeight: lineH, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{t.title}</div>
          {msgLines.length > 0 && (
            <div style={{marginTop: 6 * S, fontSize: mFs, fontWeight: 400, color: sub, lineHeight: lineH}}>
              {msgLines.map((l, k) => (
                <div key={k}>{l}</div>
              ))}
            </div>
          )}
        </div>
        <svg width={22 * S} height={22 * S} viewBox="-11 -11 22 22" style={{position: 'absolute', right: pad * 0.8, top: pad * 0.8}}>
          <path d="M-5 -5L5 5M5 -5L-5 5" stroke={withAlpha(P.ink, 0.35)} strokeWidth={2} strokeLinecap="round" />
        </svg>
        <div style={{position: 'absolute', left: 0, bottom: 0, height: 5 * S, width: `${timer * 100}%`, background: withAlpha(col, 0.85)}} />
      </div>
    );
  });

  // faint wireframe page so the toasts read as sitting on top of an app
  const ink = P.ink;
  const wf = withAlpha(ink, dark ? 0.08 : 0.06);
  const pw = w * 0.74;
  const px = (w - pw) / 2 - (centered ? 0 : w * 0.06);

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      {P.showPage && (
        <Svg>
          <rect x={0} y={0} width={w} height={64 * S} fill={withAlpha(ink, dark ? 0.05 : 0.04)} />
          <circle cx={42 * S} cy={32 * S} r={14 * S} fill={wf} />
          <rect x={72 * S} y={25 * S} width={120 * S} height={14 * S} rx={7 * S} fill={wf} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={w - (i + 1) * 100 * S - 30 * S} y={25 * S} width={70 * S} height={14 * S} rx={7 * S} fill={wf} />
          ))}
          <rect x={px} y={120 * S} width={pw * 0.5} height={34 * S} rx={10 * S} fill={wf} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={px} y={190 * S + i * 36 * S} width={pw * (i === 3 ? 0.35 : 0.8)} height={16 * S} rx={8 * S} fill={withAlpha(ink, dark ? 0.06 : 0.045)} />
          ))}
          {[0, 1, 2].map((i) => {
            const cw = (pw - 2 * 30 * S) / 3;
            return <rect key={i} x={px + i * (cw + 30 * S)} y={400 * S} width={cw} height={Math.min(260 * S, h - 520 * S)} rx={20 * S} fill={withAlpha(ink, dark ? 0.05 : 0.04)} />;
          })}
        </Svg>
      )}
      {cards}
    </AbsoluteFill>
  );
};

export const toastStackLoop = defineMotion<Props>({
  id: 'toast-stack-loop',
  title: 'Toast stack loop',
  category: 'ui',
  description: 'App toast notifications slide in one by one, stack with success / error / warning / info icons, count down their dismiss bar and slide out again — a seamless loop over a faint app wireframe.',
  source: ['original'],
  useFor: 'Product demos of feedback and notifications, a UX-patterns explainer, loading/err states for websites, or an overlay that makes a screenshot feel alive.',
  durationInFrames: 240,
  defaultProps: {
    toasts: DEFAULT_TOASTS,
    position: 'bottom-right',
    theme: 'light',
    life: 84,
    stagger: 34,
    showPage: true,
    background: '#EEF1F7',
    surfaceColor: 'auto',
    ink: '#1B2233',
    accent: '#18B26B',
    errorColor: '#F0506E',
    warningColor: '#F5A524',
    infoColor: '#4F6BFF',
    fontFamily: 'auto',
  },
  propDocs: {
    toasts: 'array of {type: success|error|warning|info, title, message?} (up to 6)',
    position: 'bottom-right | top-right | bottom-center | top-center',
    theme: 'light | dark toast cards',
    life: 'frames each toast stays before auto-dismiss (shrinks automatically to fit the loop)',
    stagger: 'frames between toast arrivals',
    showPage: 'draw a faint app wireframe behind the toasts',
    background: 'frame colour, or "transparent" to overlay content',
    surfaceColor: 'toast card colour, or "auto"',
    ink: 'text colour',
    accent: 'success colour',
    errorColor: 'error colour',
    warningColor: 'warning colour',
    infoColor: 'info colour',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: ToastStackLoop,
  tags: ['toast', 'notification', 'snackbar', 'alert', 'ui', 'app', 'website', 'stack', 'feedback', 'loop', 'overlay', 'success', 'error', 'popup'],
});
