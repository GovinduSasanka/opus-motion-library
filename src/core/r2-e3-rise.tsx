import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, ease, lerp, prog} from './ease';
import {fonts} from './fonts';
import {useStage} from './stage';
import {Backdrop, BackdropKind, BlockCursor, cursorOn, eic, eoc, fitSize, tfonts, typed} from './text-kit';

/**
 * mask-rise-title round-2 variants (group E3): `water` (rise from a waterline), `numeral` (stepped numeral climbing
 * into a clip window), `vertical` (rotated lockup + side line), `breathing` (end card with a living accent dot).
 */
export type RiseVariantProps = {
  variant: 'water' | 'numeral' | 'vertical' | 'breathing';
  frame: number;
  text: string;
  eyebrow: string;
  subtitle: string;
  sideLine: string;
  dotColor: string;
  breathPeriod: number;
  steps: number;
  stepFrames: number;
  exitAt: number;
  startFrame: number;
  letterStagger: number;
  letterStepFrames: number;
  background: string;
  ink: string;
  accent: string;
  muted: string;
  backdrop: BackdropKind;
  src: string;
  font: 'display' | 'sans' | 'serif' | 'instrument' | 'rounded' | 'grotesk';
};

const FONT_OF = (f: RiseVariantProps['font']) => tfonts[f] ?? fonts.display;

/** damped overshoot: 0 -> ~1.06 -> 1 */
const springy = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.exp(-7 * t) * Math.cos(13 * t * 0.62));

/* ---------------------------------------------------------------- water */
const Water: React.FC<RiseVariantProps> = (p) => {
  const {w, h, u} = useStage();
  const chars = [...p.text];
  const size = fitSize(p.text, 118 * u, w * 0.86, p.font === 'instrument' ? 'instrument' : 'display', 0.14);
  const boxH = size * 1.2;
  const lineY = h * 0.52;
  const lineIn = prog(p.frame, 0, 10, ease.out);
  const per = (55 / 1000) * 30;
  const splashes: React.ReactNode[] = [];
  return (
    <AbsoluteFill>
      <Backdrop kind={p.backdrop} color={p.background} src={p.src || undefined} />
      <div style={{position: 'absolute', left: 0, right: 0, top: lineY - boxH, height: boxH + size * 0.3, display: 'flex', justifyContent: 'center'}}>
        <div style={{height: boxH, overflow: 'hidden', paddingTop: size * 0.3, marginTop: -size * 0.3, display: 'flex', alignItems: 'flex-end', whiteSpace: 'pre'}}>
          {chars.map((c, i) => {
            const t = clamp((p.frame - p.startFrame - i * per) / 20);
            const rise = springy(t);
            const out = p.exitAt > 0 ? eic((p.frame - p.exitAt - i * 0.8) / 8) : 0;
            return (
              <span key={i} style={{display: 'inline-block', fontFamily: FONT_OF(p.font), fontWeight: 600, fontSize: size, color: p.ink, letterSpacing: '0.14em', lineHeight: 1, transform: `translateY(${(1 - rise) * 115 + out * 115}%)`}}>
                {c}
              </span>
            );
          })}
        </div>
      </div>
      <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
        <line x1={w * 0.5 - w * 0.36 * lineIn} y1={lineY} x2={w * 0.5 + w * 0.36 * lineIn} y2={lineY} stroke={p.accent} strokeWidth={2.5 * u} strokeLinecap="round" />
        {chars.map((c, i) => {
          if (c === ' ') return null;
          const t0 = p.startFrame + i * per + 6;
          const a = (p.frame - t0) / 14;
          if (a < 0 || a > 1) return null;
          const x = w * 0.5 + (i - (chars.length - 1) / 2) * size * 0.74;
          const k = 1 - Math.pow(1 - a, 2);
          for (let d = 0; d < 2; d++) splashes.push(<circle key={`${i}-${d}`} cx={x + (d ? 1 : -1) * size * 0.14 * k} cy={lineY - size * 0.18 * Math.sin(k * Math.PI) * (d ? 0.8 : 1)} r={Math.max(0.5, size * 0.03 * (1 - a))} fill={p.accent} opacity={1 - a} />);
          return null;
        })}
        {splashes}
      </svg>
      {p.subtitle && (
        <div style={{position: 'absolute', left: 0, right: 0, top: lineY + size * 0.28, textAlign: 'center', fontFamily: fonts.sans, fontWeight: 300, fontSize: size * 0.2, letterSpacing: '0.3em', color: p.muted, opacity: prog(p.frame, p.startFrame + chars.length * per + 8, p.startFrame + chars.length * per + 22, ease.out) * (p.exitAt > 0 ? 1 - eic((p.frame - p.exitAt) / 8) : 1)}}>
          {p.subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- stepped numeral */
const Numeral: React.FC<RiseVariantProps> = (p) => {
  const {w, h, u, portrait} = useStage();
  const size = Math.min(h * 0.65, w * (portrait ? 0.7 : 0.4));
  const clipH = size * 1.02;
  const n = Math.max(1, p.steps);
  const t = clamp((p.frame - p.startFrame) / Math.max(1, p.stepFrames * n));
  // each quarter uses its own ease: (i + E(frac)) / n
  const i = Math.min(n - 1, Math.floor(t * n));
  const frac = t * n - i;
  const climb = t >= 1 ? 1 : (i + eoc(frac)) / n;
  const exit = p.exitAt > 0 ? eic((p.frame - p.exitAt) / 9) : 0;
  const x = w * (portrait ? 0.08 : 0.07);
  return (
    <AbsoluteFill>
      <Backdrop kind={p.backdrop} color={p.background} src={p.src || undefined} />
      <div style={{position: 'absolute', left: x, bottom: h * 0.08, height: clipH, overflow: 'hidden', display: 'flex', alignItems: 'flex-start'}}>
        <div style={{fontFamily: FONT_OF(p.font), fontStyle: p.font === 'instrument' ? 'italic' : 'normal', fontWeight: 700, fontSize: size, lineHeight: 1, color: p.ink, transform: `translateY(${(1 - climb) * 100 + exit * 100}%)`, marginLeft: -size * 0.04, whiteSpace: 'pre'}}>
          {p.text}
        </div>
      </div>
      <div style={{position: 'absolute', left: x, bottom: h * 0.04, width: lerp(0, w * 0.2, prog(p.frame, p.startFrame + 4, p.startFrame + p.stepFrames * n, ease.out)) * (1 - exit), height: 3 * u, background: p.accent}} />
      {p.subtitle && (
        <div style={{position: 'absolute', left: x + size * 0.62 * Math.max(1, [...p.text].length * 0.8), bottom: h * 0.1, fontFamily: fonts.mono, fontSize: 24 * u, letterSpacing: '0.08em', color: p.muted, opacity: prog(p.frame, p.startFrame + p.stepFrames * n, p.startFrame + p.stepFrames * n + 12, ease.out) * (1 - exit)}}>
          {p.subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- vertical lockup */
const Vertical: React.FC<RiseVariantProps> = (p) => {
  const {w, h, u, portrait} = useStage();
  const chars = [...p.text];
  const len = h * 0.78;
  const size = Math.min(w * (portrait ? 0.2 : 0.14), len / Math.max(3, chars.length * 0.68));
  const per = Math.max(1, p.letterStepFrames);
  const x0 = w * (portrait ? 0.14 : 0.1);
  const exit = p.exitAt > 0 ? eic((p.frame - p.exitAt) / 9) : 0;
  return (
    <AbsoluteFill>
      <Backdrop kind={p.backdrop} color={p.background} src={p.src || undefined} />
      <div style={{position: 'absolute', left: x0, top: h * 0.11, width: size * 1.2, height: len, writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'flex', alignItems: 'center', overflow: 'hidden', opacity: 1 - exit}}>
        {chars.map((c, i) => {
          const t = clamp((p.frame - p.startFrame - i * per) / 5);
          return (
            <span key={i} style={{display: 'inline-block', fontFamily: FONT_OF(p.font), fontWeight: 800, fontSize: size, lineHeight: 1, color: p.ink, opacity: t > 0 ? 1 : 0, transform: `translateY(${(1 - eoc(t)) * 40}%)`, whiteSpace: 'pre'}}>
              {c}
            </span>
          );
        })}
      </div>
      {p.sideLine && (
        <div style={{position: 'absolute', left: x0 + size * 1.35, top: h * 0.11, fontFamily: fonts.mono, fontWeight: 700, fontSize: 16 * u, letterSpacing: '0.28em', color: p.muted, writingMode: 'vertical-rl', opacity: prog(p.frame, p.startFrame + chars.length * per, p.startFrame + chars.length * per + 10, ease.out) * (1 - exit)}}>
          {p.sideLine.toUpperCase()}
        </div>
      )}
      <div style={{position: 'absolute', left: x0 + size * 1.2 + 6 * u, top: h * 0.11, width: 3 * u, height: len * prog(p.frame, p.startFrame, p.startFrame + chars.length * per + 6, ease.out) * (1 - exit), background: p.accent}} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- breathing end card */
const Breathing: React.FC<RiseVariantProps> = (p) => {
  const {w, h, u, fps} = useStage();
  const chars = [...p.text];
  const size = fitSize(p.text, 150 * u, w * 0.74, p.font === 'instrument' ? 'instrument' : 'display', 0.02);
  const cy = h * 0.46;
  const per = 2.5;
  const t0 = p.startFrame;
  const totalW = size * 0.62 * chars.length;
  const dotX = w / 2 + totalW / 2 + size * 0.28;
  const dotY = cy + size * 0.28;
  const drop = clamp((p.frame - t0) / 6);
  const landed = t0 + 6;
  const landT = (p.frame - landed) / 3;
  const dropY = lerp(-h * 0.1, dotY, drop * drop);
  const squash = landT >= 0 && landT < 1 ? 1 - 0.35 * Math.sin(landT * Math.PI) : 1;
  const T = p.breathPeriod * fps;
  const breathAt = landed + 24;
  const bt = p.frame - breathAt;
  const breath = bt < 0 ? 1 : 1 + 0.3 * (0.5 - 0.5 * Math.cos(((bt % T) / T) * Math.PI * 2));
  const ringK = bt < 0 ? -1 : (bt % T) / T;
  const baseR = size * 0.1;
  const riseStart = landed;
  const ruleP = prog(p.frame, riseStart + 8, riseStart + 22, ease.out);
  const eyebrowStart = riseStart + 10;
  const n = Math.min(p.eyebrow.length, typed(p.frame, eyebrowStart, 25));
  const typing = n < p.eyebrow.length;
  const subA = prog(p.frame, riseStart + 22, riseStart + 40, ease.out);
  return (
    <AbsoluteFill>
      <Backdrop kind={p.backdrop} color={p.background} src={p.src || undefined} />
      {p.eyebrow && (
        <div style={{position: 'absolute', left: 0, right: 0, top: cy - size * 1.05, textAlign: 'center', fontFamily: fonts.mono, fontSize: Math.max(14 * u, size * 0.1), letterSpacing: '0.16em', color: p.muted, whiteSpace: 'pre'}}>
          {p.eyebrow.slice(0, n)}
          {p.frame >= eyebrowStart && <BlockCursor visible={cursorOn(p.frame, typing, 2)} color={p.dotColor} w={8 * u} h={12 * u} />}
        </div>
      )}
      <div style={{position: 'absolute', left: 0, right: 0, top: cy - size * 0.58, height: size * 1.16, display: 'flex', justifyContent: 'center', alignItems: 'flex-end'}}>
        <div style={{height: size * 1.16, overflow: 'hidden', display: 'flex', alignItems: 'flex-end', whiteSpace: 'pre'}}>
          {chars.map((c, i) => {
            const t = clamp((p.frame - riseStart - i * per) / 8);
            return (
              <span key={i} style={{display: 'inline-block', fontFamily: FONT_OF(p.font), fontWeight: 800, fontSize: size, color: p.ink, lineHeight: 1.1, transform: `translateY(${(1 - eoc(t)) * 115}%)`}}>
                {c}
              </span>
            );
          })}
        </div>
      </div>
      <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
        <line x1={w / 2 - w * 0.2 * ruleP} y1={cy + size * 0.74} x2={w / 2 + w * 0.2 * ruleP} y2={cy + size * 0.74} stroke={p.ink} strokeWidth={1.6 * u} />
        <rect x={w / 2 - 3 * u} y={cy + size * 0.74 - 5 * u} width={6 * u} height={10 * u} fill={p.dotColor} opacity={ruleP} />
        {ringK >= 0 && <circle cx={dotX} cy={dotY} r={baseR * 0.6 + size * 0.45 * ringK} fill="none" stroke={p.dotColor} strokeWidth={1.5 * u} opacity={0.8 * (1 - ringK)} />}
        {p.frame >= t0 && <ellipse cx={dotX} cy={dotDropY(drop, dropY, dotY, baseR, squash)} rx={baseR * breath * (2 - squash)} ry={baseR * breath * squash} fill={p.dotColor} />}
      </svg>
      {p.subtitle && (
        <div style={{position: 'absolute', left: 0, right: 0, top: cy + size * 0.88, textAlign: 'center', fontFamily: fonts.sans, fontSize: size * 0.17, letterSpacing: '0.04em', color: p.muted, opacity: subA}}>
          {p.subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
const dotDropY = (drop: number, dropY: number, dotY: number, r: number, squash: number) => (drop >= 1 ? dotY + r * (1 - squash) : dropY);

const SAMPLE: Record<RiseVariantProps['variant'], {text: string; subtitle: string; eyebrow: string; sideLine: string}> = {
  water: {text: 'HARBOUR', subtitle: 'a calm start to the day', eyebrow: '', sideLine: ''},
  numeral: {text: '3', subtitle: 'ONE MODULE AT A TIME', eyebrow: '', sideLine: ''},
  vertical: {text: 'STUDIO', subtitle: '', eyebrow: '', sideLine: 'Issue 07 / Spring'},
  breathing: {text: 'Breathe', subtitle: 'Motion makes design breathe.', eyebrow: 'MOTION DESIGN REEL - 15 SECONDS', sideLine: ''},
};

export const RiseVariant: React.FC<RiseVariantProps> = (p0) => {
  const d = SAMPLE[p0.variant];
  const p = {...p0, text: p0.text || d.text, subtitle: p0.subtitle || d.subtitle, eyebrow: p0.eyebrow || d.eyebrow, sideLine: p0.sideLine || d.sideLine};
  return p.variant === 'water' ? <Water {...p} /> : p.variant === 'numeral' ? <Numeral {...p} /> : p.variant === 'vertical' ? <Vertical {...p} /> : <Breathing {...p} />;
};
