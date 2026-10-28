import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {mixHex, withAlpha} from '../../core/r2-s1-kit';
import {fitSize} from '../../core/text-kit';
import {wrapText} from '../../core/r3-social';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {TAU, bgCss, fam, fract, isDark, loopPhase, surface, tri} from '../../core/ui-loop-kit';

/**
 * An "empty state": a friendly, original line illustration (an empty `box`, a `search` that found nothing, or an empty
 * `inbox` tray with a paper plane) that floats and twinkles, with a title, a one-line explanation and a call-to-action
 * button with a soft pulsing ring. Everything is periodic, so the loop is seamless. Landscape lays the
 * illustration beside the text; square and portrait stack them.
 */
type Variant = 'box' | 'search' | 'inbox';
type Props = {
  variant: Variant;
  title: string;
  subtitle: string;
  cta: string;
  showCta: boolean;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  fontFamily: string;
};

const Sparkle: React.FC<{x: number; y: number; r: number; ph: number; color: string}> = ({x, y, r, ph, color}) => {
  const s = tri(ph);
  const rr = r * (0.25 + 0.75 * s);
  return <path d={`M${x} ${y - rr} Q${x} ${y} ${x + rr} ${y} Q${x} ${y} ${x} ${y + rr} Q${x} ${y} ${x - rr} ${y} Q${x} ${y} ${x} ${y - rr}Z`} fill={color} opacity={0.35 + 0.65 * s} transform={`rotate(${s * 30} ${x} ${y})`} />;
};

/** illustration in a ~420 x 420 local box centred on (0,0) */
const Art: React.FC<{v: Variant; ph: number; ink: string; accent: string; accent2: string; paper: string}> = ({v, ph, ink, accent, accent2, paper}) => {
  const sw = 7;
  const line = {fill: 'none', stroke: ink, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  const bob = Math.sin(TAU * ph) * 9;
  const tint = withAlpha(accent, 0.18);
  const tint2 = withAlpha(accent2, 0.35);
  const shadowK = 1 - 0.08 * Math.sin(TAU * ph);

  const sparkles = (
    <>
      <Sparkle x={-150} y={-120} r={20} ph={ph} color={accent2} />
      <Sparkle x={150} y={-90} r={26} ph={ph + 0.33} color={accent} />
      <Sparkle x={-120} y={70} r={14} ph={ph + 0.66} color={accent} />
      <Sparkle x={140} y={80} r={12} ph={ph + 0.15} color={accent2} />
    </>
  );

  if (v === 'box') {
    return (
      <g>
        <ellipse cx={0} cy={178} rx={130 * shadowK} ry={14} fill={withAlpha(ink, 0.1)} />
        {sparkles}
        <g transform={`translate(0 ${bob})`}>
          {/* back flaps */}
          <path d="M-100 -38 L-128 -108 L-34 -116 L-30 -38Z" fill={tint2} {...{stroke: ink, strokeWidth: sw, strokeLinejoin: 'round' as const}} />
          <path d="M100 -38 L128 -108 L34 -116 L30 -38Z" fill={tint2} {...{stroke: ink, strokeWidth: sw, strokeLinejoin: 'round' as const}} />
          {/* opening */}
          <path d="M-120 -8 L-100 -40 L100 -40 L120 -8Z" fill={mixHex(accent, '#000000', 0.25)} fillOpacity={0.55} {...{stroke: ink, strokeWidth: sw, strokeLinejoin: 'round' as const}} />
          {/* body */}
          <path d="M-120 -8 L120 -8 L104 146 Q103 156 93 156 L-93 156 Q-103 156 -104 146Z" fill={paper} {...{stroke: ink, strokeWidth: sw, strokeLinejoin: 'round' as const}} />
          <path d="M-114 30 L114 30" {...line} strokeWidth={5} opacity={0.5} />
          {/* side flaps */}
          <path d="M-120 -8 L-176 -30 L-160 18 L-114 30Z" fill={tint} {...{stroke: ink, strokeWidth: sw, strokeLinejoin: 'round' as const}} />
          <path d="M120 -8 L176 -30 L160 18 L114 30Z" fill={tint} {...{stroke: ink, strokeWidth: sw, strokeLinejoin: 'round' as const}} />
          {/* label */}
          <rect x={-46} y={64} width={92} height={56} rx={10} fill={tint} stroke={ink} strokeWidth={5} />
          <path d="M-28 84 L28 84 M-28 100 L10 100" {...line} strokeWidth={5} />
          {/* tiny dust puff from inside */}
          {[0, 1, 2].map((i) => {
            const k = fract(ph * 1 + i / 3);
            return <circle key={i} cx={-30 + i * 30 + Math.sin(TAU * (ph + i / 3)) * 8} cy={-50 - k * 90} r={8 * (1 - k) + 2} fill="none" stroke={ink} strokeWidth={4} opacity={Math.sin(Math.PI * k) * 0.55} />;
          })}
        </g>
      </g>
    );
  }
  if (v === 'search') {
    const mx = Math.sin(TAU * ph) * 34;
    const my = Math.sin(TAU * ph * 2) * 16;
    return (
      <g>
        <ellipse cx={0} cy={186} rx={120 * shadowK} ry={13} fill={withAlpha(ink, 0.1)} />
        {sparkles}
        <g transform={`translate(0 ${bob * 0.5})`}>
          <rect x={-118} y={-150} width={236} height={310} rx={26} fill={paper} stroke={ink} strokeWidth={sw} />
          <rect x={-84} y={-112} width={90} height={16} rx={8} fill={tint2} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={-84} y={-70 + i * 38} width={i === 3 ? 90 : 168} height={14} rx={7} fill={withAlpha(ink, 0.14)} />
          ))}
          <g transform={`translate(${mx + 30} ${my + 30})`}>
            <line x1={50} y1={50} x2={108} y2={108} stroke={ink} strokeWidth={22} strokeLinecap="round" />
            <line x1={50} y1={50} x2={108} y2={108} stroke={accent} strokeWidth={9} strokeLinecap="round" />
            <circle r={66} fill={withAlpha('#ffffff', 0.55)} stroke={ink} strokeWidth={sw} />
            <circle r={66} fill={tint} />
            <path d="M-44 -30 Q-28 -52 0 -52" {...line} strokeWidth={6} opacity={0.5} />
            <text x={0} y={22} textAnchor="middle" fontSize={78} fontWeight={800} fill={ink} fontFamily="sans-serif" transform={`rotate(${Math.sin(TAU * ph) * 6})`}>
              ?
            </text>
          </g>
        </g>
      </g>
    );
  }
  // inbox
  const planeRot = Math.sin(TAU * ph) * 7 - 8;
  const px = Math.sin(TAU * ph) * 16;
  return (
    <g>
      <ellipse cx={0} cy={178} rx={140 * shadowK} ry={14} fill={withAlpha(ink, 0.1)} />
      {sparkles}
      {/* paper plane */}
      <g transform={`translate(${px - 10} ${-96 + bob * 1.2}) rotate(${planeRot})`}>
        <path d="M-70 8 Q-110 40 -150 36" fill="none" stroke={accent} strokeWidth={5} strokeLinecap="round" strokeDasharray="2 14" />
        <path d="M-56 -4 L78 -44 L16 52 L2 14Z" fill={paper} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
        <path d="M-56 -4 L2 14 L78 -44" fill={tint} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
        <path d="M2 14 L16 52" {...line} strokeWidth={5} />
      </g>
      {/* tray */}
      <g transform="translate(0 20)">
        <path d="M-160 20 L-112 -48 Q-106 -56 -96 -56 L96 -56 Q106 -56 112 -48 L160 20 L160 112 Q160 138 134 138 L-134 138 Q-160 138 -160 112Z" fill={paper} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
        <path d="M-160 20 L-62 20 Q-52 64 0 64 Q52 64 62 20 L160 20" fill={tint} stroke={ink} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
        <path d="M-70 -18 L70 -18" {...line} strokeWidth={5} opacity={0.4} />
      </g>
    </g>
  );
};

const EmptyStateIllustration: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: T, portrait, square} = useStage();
  const ph = loopPhase(frame, T);
  const font = fam(P.fontFamily);
  const base = surface(P.background, '#ffffff');
  const dark = isDark(base);
  const paper = dark ? mixHex(base, '#ffffff', 0.08) : '#FFFFFF';
  const side = !portrait && !square;
  const S = (portrait ? 1.35 : 1.05) * u;
  const v: Variant = P.variant === 'search' || P.variant === 'inbox' ? P.variant : 'box';

  // layout
  const artSize = side ? Math.min(h * 0.62, w * 0.34) : Math.min(w * 0.62, h * 0.36);
  const sc = artSize / 420;
  const textW = side ? Math.min(w * 0.38, 760 * S) : Math.min(w * 0.86, 800 * S);
  const tFs = fitSize(P.title, (side ? 66 : 62) * S, textW, 'sans');
  const subFs = (side ? 28 : 28) * S;
  const subLines = wrapText(P.subtitle || '', subFs, textW, 'sans', 4);
  const btnH = 70 * S;
  const btnFs = 27 * S;
  const btnW = Math.max(220 * S, (P.cta || '').length * btnFs * 0.6 + 80 * S);
  const textH = tFs * 1.15 + (subLines.length ? 20 * S + subLines.length * subFs * 1.4 : 0) + (P.showCta ? 40 * S + btnH : 0);

  let artX: number;
  let artY: number;
  let textX: number;
  let textY: number;
  let align: 'left' | 'center';
  if (side) {
    const gapX = 120 * S;
    const total = artSize + gapX + textW;
    const left = (w - total) / 2;
    artX = left + artSize / 2;
    artY = h / 2;
    textX = left + artSize + gapX;
    textY = (h - textH) / 2;
    align = 'left';
  } else {
    const total = artSize + 80 * S + textH;
    const top = (h - total) / 2;
    artX = w / 2;
    artY = top + artSize * 0.5;
    textX = (w - textW) / 2;
    textY = top + artSize + 80 * S;
    align = 'center';
  }
  const ringK = fract(ph * 2);
  const shine = fract(ph * 2 + 0.2);
  const btnX = align === 'left' ? textX : textX + (textW - btnW) / 2;
  const btnY = textY + tFs * 1.15 + (subLines.length ? 20 * S + subLines.length * subFs * 1.4 : 0) + 40 * S;
  const press = 1 - 0.035 * Math.max(0, Math.sin(TAU * ph * 2 - 0.5)) ** 8;

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      <Svg>
        {/* soft backdrop blob */}
        <circle cx={artX} cy={artY} r={artSize * 0.62} fill={withAlpha(P.accent, dark ? 0.1 : 0.08)} />
        <circle cx={artX} cy={artY} r={artSize * (0.68 + 0.015 * Math.sin(TAU * ph))} fill="none" stroke={withAlpha(P.accent, 0.22)} strokeWidth={2.5 * u} strokeDasharray={`${8 * u} ${14 * u}`} transform={`rotate(${ph * 360} ${artX} ${artY})`} />
        <g transform={`translate(${artX} ${artY}) scale(${sc})`}>
          <Art v={v} ph={ph} ink={dark ? '#E9ECF5' : P.ink} accent={P.accent} accent2={P.accent2} paper={paper} />
        </g>
        {P.showCta && P.cta && (
          <g>
            <rect x={btnX - 14 * S * ringK} y={btnY - 14 * S * ringK} width={btnW + 28 * S * ringK} height={btnH + 28 * S * ringK} rx={(btnH + 28 * S * ringK) / 2} fill="none" stroke={P.accent} strokeWidth={3 * u} opacity={(1 - ringK) * 0.5} />
          </g>
        )}
      </Svg>
      <div style={{position: 'absolute', left: textX, top: textY, width: textW, textAlign: align, fontFamily: font}}>
        <div style={{fontSize: tFs, fontWeight: 800, color: P.ink, lineHeight: 1.15, letterSpacing: -1 * u, whiteSpace: 'nowrap', overflow: 'visible'}}>{P.title}</div>
        {subLines.length > 0 && (
          <div style={{marginTop: 20 * S, fontSize: subFs, color: withAlpha(P.ink, 0.62), lineHeight: 1.4}}>
            {subLines.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        )}
      </div>
      {P.showCta && P.cta && (
        <div
          style={{
            position: 'absolute',
            left: btnX,
            top: btnY,
            width: btnW,
            height: btnH,
            borderRadius: btnH / 2,
            background: P.accent,
            color: '#ffffff',
            fontFamily: font,
            fontWeight: 700,
            fontSize: btnFs,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${press})`,
            boxShadow: `0 ${10 * S}px ${28 * S}px ${withAlpha(P.accent, 0.35)}`,
            overflow: 'hidden',
          }}
        >
          <div style={{position: 'absolute', top: 0, bottom: 0, width: btnW * 0.3, left: -btnW * 0.3 + shine * btnW * 1.6, background: 'linear-gradient(100deg, rgba(255,255,255,0), rgba(255,255,255,0.28), rgba(255,255,255,0))', transform: 'skewX(-18deg)'}} />
          <span style={{position: 'relative'}}>{P.cta}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const emptyStateIllustration = defineMotion<Props>({
  id: 'empty-state-illustration',
  title: 'Empty state illustration',
  category: 'ui',
  description: 'An original friendly line illustration (empty box, search with no results, or empty inbox with a paper plane) that floats and twinkles, with a title, explanation and a pulsing call-to-action button. Seamless loop.',
  source: ['original'],
  useFor: '"Nothing here yet" screens, no-results and empty-inbox states, onboarding prompts, 404-style pages, and app demos that need a calm, friendly beat.',
  durationInFrames: 150,
  defaultProps: {
    variant: 'box',
    title: 'Nothing here yet',
    subtitle: 'When you add your first item it will show up right here. It only takes a minute.',
    cta: 'Add your first item',
    showCta: true,
    background: '#F4F6FB',
    ink: '#1E2433',
    accent: '#4F6BFF',
    accent2: '#FFB84D',
    fontFamily: 'auto',
  },
  propDocs: {
    variant: 'box | search | inbox',
    title: 'headline',
    subtitle: 'one or two explanatory lines',
    cta: 'button label',
    showCta: 'show the call-to-action button',
    background: 'frame colour, or "transparent" to overlay content',
    ink: 'line and text colour',
    accent: 'button, highlights and illustration tint',
    accent2: 'secondary sparkle / flap colour',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: EmptyStateIllustration,
  tags: ['empty-state', 'illustration', 'no-results', 'inbox', 'search', 'onboarding', 'ui', 'app', 'website', 'loop', 'line-art', 'cta', 'friendly', '404'],
});
