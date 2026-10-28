import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {useSafeId} from '../../core/image-kit';
import {Mark, backOut, eio, eo3, eo5, mix, seg, withAlpha} from '../../core/r3-brand-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Sponsor slate: a "presented by" label flanked by drawing rules, a rounded panel that scales up carrying the sponsor's logo
 * (picture or wordmark) with a sheen pass, an optional offer pill, and a small disclaimer line at the bottom; fades out at the end.
 */
type Props = {
  label: string;
  name: string;
  src: string;
  offer: string;
  disclaimer: string;
  background: string;
  ink: string;
  accent: string;
  panelColor: string;
  panelInk: string;
  startAt: number;
  fadeOut: boolean;
  fontFamily: string;
};

const SponsorSlate: React.FC<Props> = ({label, name, src, offer, disclaimer, background, ink, accent, panelColor, panelInk, startAt, fadeOut, fontFamily}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait, durationInFrames: D} = useStage();
  const uid = useSafeId('spn');
  const f = Math.max(0, frame - startAt);
  const fam = fontFamily || fonts.sans;
  const bg = background === 'transparent' ? undefined : background;

  const pw = portrait ? w * 0.78 : Math.min(w * 0.4, h * 0.78);
  const ph = portrait ? Math.min(h * 0.2, pw * 0.62) : Math.min(h * 0.3, pw * 0.56);
  const pad = 0.14;
  const panelY = cy - (offer ? 24 : 0) * u;
  const labelY = panelY - ph / 2 - 62 * u;
  const lineT = eo5(seg(f, 0, 26));
  const labT = eo3(seg(f, 4, 26));
  const panT = backOut(seg(f, 12, 36), 1.5);
  const panOp = eo3(seg(f, 12, 26));
  const logoT = eo5(seg(f, 26, 50));
  const sheen = eio(seg(f, 50, 74));
  const offT = eo5(seg(f, 62, 82));
  const disT = eo3(seg(f, 74, 96));
  const out = fadeOut ? eio(seg(frame, D - 16, D)) : 0;
  const lineLen = Math.min(w * 0.16, 200 * u) * lineT;
  const labFs = (portrait ? 28 : 24) * u;
  const labW = label.length * labFs * 1.12;

  const sx = mix(-0.3, 1.3, sheen);
  return (
    <AbsoluteFill style={{background: bg, opacity: 1 - out, fontFamily: fam}}>
      <Svg>
        <line x1={cx - labW / 2 - 30 * u} x2={cx - labW / 2 - 30 * u - lineLen} y1={labelY} y2={labelY} stroke={accent} strokeWidth={2.4 * u} strokeLinecap="round" />
        <line x1={cx + labW / 2 + 30 * u} x2={cx + labW / 2 + 30 * u + lineLen} y1={labelY} y2={labelY} stroke={accent} strokeWidth={2.4 * u} strokeLinecap="round" />
      </Svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: labelY, transform: 'translateY(-50%)', textAlign: 'center', color: ink, fontWeight: 700, fontSize: labFs, letterSpacing: '0.4em', paddingLeft: '0.4em', textTransform: 'uppercase', opacity: labT * 0.85}}>{label}</div>
      {/* panel */}
      <div
        style={{
          position: 'absolute',
          left: cx - pw / 2,
          top: panelY - ph / 2,
          width: pw,
          height: ph,
          borderRadius: 26 * u,
          background: panelColor,
          boxShadow: `0 ${18 * u}px ${60 * u}px rgba(0,0,0,0.38), 0 0 0 ${2 * u}px ${withAlpha(accent, 0.55)}`,
          opacity: panOp,
          transform: `scale(${mix(0.86, 1, panT)})`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{opacity: logoT, transform: `translateY(${(1 - logoT) * 18 * u}px)`}}>
          <Mark src={src || undefined} text={name} bw={pw * (1 - pad * 2)} bh={ph * (1 - pad * 2)} color={panelInk} font="grotesk" weight={700} tracking={0.01} style={fontFamily ? {fontFamily} : undefined} />
        </div>
        {sheen > 0 && sheen < 1 && (
          <svg width={pw} height={ph} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
            <defs>
              <linearGradient id={uid} x1="0" x2="1" y1="0" y2="0" gradientTransform="rotate(18)">
                <stop offset="0" stopColor="#fff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#fff" stopOpacity="0.7" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x={pw * sx - pw * 0.18} y={-ph * 0.2} width={pw * 0.36} height={ph * 1.4} fill={`url(#${uid})`} />
          </svg>
        )}
      </div>
      {offer && (
        <div style={{position: 'absolute', left: 0, right: 0, top: panelY + ph / 2 + 36 * u, display: 'flex', justifyContent: 'center'}}>
          <div style={{background: accent, color: '#fff', fontWeight: 800, fontSize: (portrait ? 32 : 28) * u, padding: `${10 * u}px ${28 * u}px`, borderRadius: 999, letterSpacing: '0.04em', opacity: offT, transform: `scale(${mix(0.7, 1, offT)}) translateY(${(1 - offT) * 14 * u}px)`}}>{offer}</div>
        </div>
      )}
      {disclaimer && (
        <div style={{position: 'absolute', left: w * 0.08, right: w * 0.08, bottom: h * (portrait ? 0.07 : 0.08), textAlign: 'center', color: withAlpha(ink, 0.55), fontWeight: 500, fontSize: (portrait ? 26 : 22) * u, lineHeight: 1.45, letterSpacing: '0.03em', opacity: disT, transform: `translateY(${(1 - disT) * 10 * u}px)`}}>{disclaimer}</div>
      )}
    </AbsoluteFill>
  );
};

export const sponsorSlate = defineMotion<Props>({
  id: 'sponsor-slate',
  title: 'Sponsor slate',
  category: 'text',
  description:
    'A "presented by" label flanked by drawing rules, a rounded panel that scales up carrying the sponsor logo (picture or wordmark) with a sheen pass, an optional offer pill and a small disclaimer line, then a fade out.',
  source: ['original (branding pass, round 3)'],
  useFor: 'Sponsor reads and "this video is brought to you by" slates, partner credits, event sponsor cards and disclosure lines.',
  durationInFrames: 150,
  defaultProps: {
    label: 'presented by',
    name: 'Brightline',
    src: '',
    offer: '',
    disclaimer: 'This video is sponsored. All opinions are our own.',
    background: '#12151B',
    ink: '#F3F0EA',
    accent: '#5B8CFF',
    panelColor: '#FFFFFF',
    panelInk: '#12151B',
    startAt: 0,
    fadeOut: true,
    fontFamily: '',
  },
  propDocs: {
    label: 'small tracked label above the panel (e.g. "presented by", "in partnership with")',
    name: 'sponsor wordmark shown when no src is given',
    src: 'sponsor logo picture (public/ path or URL, transparent PNG/SVG best)',
    offer: 'optional pill under the panel, e.g. "Code SAVE10 for 10% off" ("" = none)',
    disclaimer: 'small disclosure line at the bottom ("" = none)',
    background: 'backdrop colour, or "transparent" to sit over footage',
    ink: 'label and disclaimer colour',
    accent: 'rules, panel outline and offer pill colour',
    panelColor: 'logo panel fill (pick one the logo reads on)',
    panelInk: 'wordmark colour on the panel',
    startAt: 'frame the slate starts',
    fadeOut: 'fade out over the last 16 frames',
    fontFamily: 'optional CSS font-family',
  },
  component: SponsorSlate,
  tags: ['sponsor', 'slate', 'presented by', 'brought to you by', 'partner', 'logo', 'disclaimer', 'branding', 'ad read', 'credit', 'offer', 'promo code', 'outro'],
});
