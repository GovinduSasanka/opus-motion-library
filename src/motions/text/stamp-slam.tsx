import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, ease} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {Backdrop, BackdropKind, TFont, eoc, fitSize, tfonts} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Rubber-stamp label slam (video10 stamp-slam): a rotated vermilion card with a cream inner rule
 * drops from 1.30x / 25 % opacity / −8° to 1.0 / −4° in 5 frames with a tiny undershoot, multiply-
 * blended so the scene shows through, while the preceding serif title blurs away. Then a huge
 * keyword pops (video10 keyword-pop 1.15 → 1, back-ease; video19 hero-word-punch; video21 title-hard-pop).
 */

type Props = {
  lines: string[];
  preTitle: string;
  keyword: string;
  keywordStyle: 'plain' | 'box' | 'indicator';
  slamAt: number;
  keywordAt: number;
  rotation: number;
  x: number;
  y: number;
  keywordY: number;
  color: string;
  textColor: string;
  keywordColor: string;
  font: TFont;
  keywordFont: TFont;
  size: number;
  shake: boolean;
  push: number;
  backdrop: BackdropKind;
  src: string;
};

const StampSlam: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: D} = useStage();
  const ls = frame - p.slamAt;
  const sc = interpolate(ls, [0, 2, 3, 5], [1.3, 1.08, 0.98, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const op = interpolate(ls, [0, 2, 3], [0.25, 0.75, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rot = interpolate(ls, [0, 2, 3], [-8, -5, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) + (ls >= 3 ? p.rotation : p.rotation * (ls / 3));
  // camera: slow push, plus a 4-frame jolt on impact
  const zoom = 1 + p.push * (frame / D);
  const jolt = p.shake && ls >= 2 && ls < 8 ? Math.sin(ls * 2.6) * (8 - ls) * 1.6 * u : 0;
  const kJolt = p.shake && frame - p.keywordAt >= 1 && frame - p.keywordAt < 6 ? Math.sin((frame - p.keywordAt) * 3) * (6 - (frame - p.keywordAt)) * 1.2 * u : 0;
  // pre-title in (5 f blur-in) / out (3 f blur) at the slam
  const preIn = eoc((frame - 4) / 5);
  const preOut = clamp(ls / 3);
  const pre = preIn * (1 - preOut);
  const lines = p.lines.filter(Boolean);
  const maxW = w * 0.78;
  const fs = Math.min(...lines.map((l, i) => fitSize(l, (i === 0 ? p.size : p.size * 1.25) * u, maxW, p.font, 0.06) / (i === 0 ? 1 : 1.25)));
  // keyword pop
  const kl = frame - p.keywordAt;
  const kOp = clamp(kl / 2);
  const kSc = kl < 0 ? 1.15 : kl <= 2 ? 1.15 - 0.15 * (kl / 2) * 1.08 : 1 + (1 - ease.back(clamp((kl - 2) / 4))) * -0.012;
  const kfs = fitSize(p.keyword, 190 * u, w * 0.85, p.keywordFont, 0);
  const sid = 'stamp-print';
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${jolt + kJolt}px, ${jolt * 0.6}px) scale(${zoom})`}}>
        <Backdrop kind={p.backdrop} src={p.src || undefined} push={0} drift={0.4} />
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <filter id={sid}>
            <feTurbulence type="fractalNoise" baseFrequency={0.7 / u} numOctaves={2} seed={11} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.6 0 0 0 1.55" result="m" />
            <feComposite in="SourceGraphic" in2="m" operator="in" />
          </filter>
        </svg>
        {p.preTitle && pre > 0.001 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: h * p.y,
              transform: `translateY(-50%) scale(${1.02 - 0.02 * preIn})`,
              textAlign: 'center',
              fontFamily: fonts.serif,
              fontWeight: 500,
              fontSize: fitSize(p.preTitle, 92 * u, w * 0.86, 'serif'),
              color: '#efe8dc',
              textShadow: `0 ${4 * u}px ${14 * u}px rgba(0,0,0,.55)`,
              opacity: pre,
              filter: `blur(${(1 - preIn) * 6 * u + preOut * 8 * u}px)`,
            }}
          >
            {p.preTitle}
          </div>
        )}
        {ls >= 0 && (
          <div style={{position: 'absolute', left: w * p.x, top: h * p.y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${sc})`, opacity: op}}>
            <div
              style={{
                background: p.color,
                opacity: 0.94,
                padding: `${fs * 0.32}px ${fs * 0.55}px`,
                position: 'relative',
                filter: `url(#${sid})`,
                boxShadow: `0 ${3 * u}px ${10 * u}px rgba(0,0,0,0.25)`,
              }}
            >
              <div style={{position: 'absolute', inset: 7 * u, border: `${2 * u}px solid ${p.textColor}`, opacity: 0.85}} />
              {lines.map((l, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: tfonts[p.font],
                    fontWeight: 700,
                    fontSize: i === 0 ? fs : fs * 1.25,
                    color: p.textColor,
                    letterSpacing: '0.06em',
                    textAlign: 'center',
                    lineHeight: 1.05,
                    whiteSpace: 'pre',
                    paddingLeft: '0.06em',
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
          </div>
        )}
      </AbsoluteFill>
      {p.keyword && kl >= 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: h * p.keywordY, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateY(-50%)'}}>
          <div style={{position: 'relative', transform: `scale(${kSc})`, opacity: kOp}}>
            <div
              style={{
                fontFamily: tfonts[p.keywordFont],
                fontWeight: 800,
                fontSize: kfs,
                lineHeight: 1,
                color: p.keywordColor,
                WebkitTextStroke: `${3 * u}px #1d1a18`,
                paintOrder: 'stroke fill',
                textShadow: `0 ${6 * u}px ${14 * u}px rgba(0,0,0,.5)`,
                whiteSpace: 'pre',
                padding: p.keywordStyle === 'box' ? `${kfs * 0.08}px ${kfs * 0.22}px` : 0,
                outline: p.keywordStyle === 'box' ? `${4 * u}px solid ${p.keywordColor}` : undefined,
                outlineOffset: p.keywordStyle === 'box' ? `${-2 * u}px` : undefined,
                background: p.keywordStyle === 'box' ? 'rgba(20,16,14,0.55)' : undefined,
              }}
            >
              {p.keyword}
            </div>
          </div>
          {p.keywordStyle === 'indicator' && (
            <svg width={160 * u} height={40 * u} style={{marginTop: 18 * u, opacity: kOp}}>
              <line x1={20 * u} x2={140 * u} y1={20 * u} y2={20 * u} stroke="#efe8dc" strokeWidth={1.5 * u} strokeDasharray={120 * u} strokeDashoffset={120 * u * (1 - eoc((kl - 2) / 8))} />
              <circle cx={20 * u} cy={20 * u} r={8 * u} fill="none" stroke="#efe8dc" strokeWidth={1.5 * u} />
              <circle cx={140 * u} cy={20 * u} r={8 * u} fill="none" stroke="#efe8dc" strokeWidth={1.5 * u} />
              <circle cx={80 * u} cy={20 * u} r={10 * u * eoc((kl - 4) / 6)} fill="#4777D2" />
            </svg>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const stampSlam = defineMotion<Props>({
  id: 'stamp-slam',
  title: 'Stamp slam + keyword pop',
  category: 'text',
  description: 'A rotated vermilion label slams down from 1.3x like a rubber stamp over the scene (the serif title blurs away), then a huge keyword punches in.',
  source: ['video10 0:34.7-0:34.9', 'video10 0:17.0-0:17.2', 'video19 0:10-0:12', 'video21 0:26.7'],
  useFor: 'Hard facts, place/date stamps, verdicts and single-word emphasis beats.',
  durationInFrames: 150,
  defaultProps: {
    lines: ['LONDON', '1736'],
    preTitle: 'The hard way',
    keyword: 'GIN',
    keywordStyle: 'plain',
    slamAt: 36,
    keywordAt: 84,
    rotation: -4,
    x: 0.5,
    y: 0.22,
    keywordY: 0.64,
    color: '#c14d3c',
    textColor: '#f3ead8',
    keywordColor: '#cb4e3d',
    font: 'serif',
    keywordFont: 'sans',
    size: 64,
    shake: true,
    push: 0.06,
    backdrop: 'dusk',
    src: '',
  },
  propDocs: {
    lines: 'stamp lines; the 2nd+ lines render 1.25x (years / numbers)',
    preTitle: 'serif title shown first that blurs out as the stamp lands ("" = none)',
    keyword: 'big word that pops later ("" = none)',
    keywordStyle: 'plain | box (outlined plate) | indicator (video19 3-node slider under the word)',
    slamAt: 'frame the stamp hits (5-frame slam)',
    keywordAt: 'frame the keyword pops',
    rotation: 'final stamp rotation in degrees (−4…−6)',
    x: 'stamp centre x as a fraction of width',
    y: 'stamp centre y as a fraction of height (video10 ≈ 0.18–0.22)',
    keywordY: 'keyword centre y fraction (video10 ≈ 0.64)',
    color: 'stamp fill (multiply-blended)',
    font: 'stamp font role',
    keywordFont: 'keyword font role (sans = Inter heavy, display = Archivo Black)',
    size: 'stamp text size in px at 1080p',
    shake: 'camera jolt on impacts',
    push: 'slow scene push-in amount over the clip',
    backdrop: 'dusk | peaks | warm | comic | … procedural scene behind',
    src: 'optional public/ image as the scene',
  },
  component: StampSlam,
  tags: ['stamp', 'label', 'impact', 'keyword', 'emphasis'],
});
