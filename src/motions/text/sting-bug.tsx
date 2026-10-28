// Adapted from lemo-opuscar/styles/news-package/demo/main.js (shotSting, stingLogo, plate, bug, studioBg) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {NEWS, NewsStudioBg, P, back, clamp, eio, eo, fitW, lbf, lerp, pd, seg} from '../../core/r2-lb1-kit';

/**
 * 1.5-second news sting that becomes the channel bug: two lemon slashes zip across a dark studio at −8°, a sheared
 * lemon plate slams in with overshoot while its condensed letters drop in one by one, an ellipse ring expands and the
 * frame shakes, the wordmark and a mono dateline open from the centre, a white glint sweeps the plate, then the plate
 * flies to the top-right corner and stays as the bug.
 */

type Props = {
  name: string;
  wordmark: [string, string][];
  dateline: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  gold: string;
  ink: string;
  paper: string;
  bugCorner: 'tr' | 'tl';
  bugScale: number;
  holdBug: boolean;
  startFrame: number;
  backdrop: 'studio' | 'none';
  background: string;
};

const StingBug: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = 'sting-bug';
  const t = (frame - p.startFrame) / 30;
  // plate geometry
  const PW = Math.min(600 * u, w * 0.66);
  const PH = PW * (180 / 520);
  const k = 0.28 * PH;
  const cx = w / 2;
  const cy = h * (portrait ? 0.44 : 0.42);
  const plate: P[] = [
    [-PW / 2 + k / 2, -PH / 2],
    [PW / 2 + k / 2, -PH / 2],
    [PW / 2 - k / 2, PH / 2],
    [-PW / 2 - k / 2, PH / 2],
  ];
  const bar = (x0: number, bw: number): P[] => [
    [-PW / 2 + k / 2 + x0, -PH / 2],
    [-PW / 2 + k / 2 + x0 + bw, -PH / 2],
    [-PW / 2 - k / 2 + x0 + bw, PH / 2],
    [-PW / 2 - k / 2 + x0, PH / 2],
  ];
  // slam
  const sk = seg(t, 0.16, 0.42);
  const sScale = t < 0.16 ? 0 : back(sk, 2.2);
  const sRot = (1 - eo(sk)) * -0.12;
  // fly to the corner
  const fk = eio(seg(t, 1.12, 1.45));
  const bugS = p.bugScale * (portrait ? 1.25 : 1);
  const bx = p.bugCorner === 'tr' ? w - 52 * u - (PW * bugS) / 2 - (k * bugS) / 2 : 52 * u + (PW * bugS) / 2 + (k * bugS) / 2;
  const by = 52 * u + (PH * bugS) / 2 + (portrait ? 40 * u : 0);
  const fly = p.holdBug ? fk : 0;
  const px = lerp(cx, bx, fly);
  const py = lerp(cy, by, fly);
  const ps = lerp(sScale, bugS, fly);
  // shake
  const shk = seg(t, 0.42, 0.7);
  const shake = t > 0.42 && t < 0.7 ? Math.sin(90 * (t - 0.42)) * 14 * u * (1 - shk) : 0;
  // letters
  const letters = [...p.name.toUpperCase()];
  const drop = seg(t, 0.2, 0.5);
  const fs = fitW(p.name.toUpperCase(), PH * 0.66, PW * 0.68, 'barlow', 0.04);
  const adv = (PW * 0.68) / Math.max(1, letters.length);
  const lw = Math.min(adv, fs * 0.56);
  const totalW = lw * letters.length;
  // ring
  const rk = seg(t, 0.42, 0.8);
  // wordmark + dateline open from the centre
  const wk = eo(seg(t, 0.5, 0.8)) * (1 - seg(t, 1.05, 1.2));
  const wmText = p.wordmark.map((x) => x[0]).join('');
  const wmSize = fitW(wmText, 64 * u, w * 0.8, 'barlow', 0.08);
  const dlSize = 18 * u;
  // glint
  const gk = seg(t, 0.85, 1.12);
  // slashes
  const slash = (t0: number, hh: number, dir: number) => {
    const s = seg(t, t0, t0 + 0.26);
    if (s <= 0 || s >= 1) return null;
    const x = lerp(-1900, 1900, eio(s)) * u * dir;
    const len = 1300 * u;
    return <rect x={cx + x - len / 2} y={cy - hh / 2 + (dir > 0 ? -PH * 0.3 : PH * 0.35)} width={len} height={hh} fill={p.accent} transform={`rotate(-8 ${cx} ${cy})`} />;
  };
  const bugWm = p.holdBug ? eo(seg(t, 1.4, 1.6)) : 0;
  return (
    <AbsoluteFill style={{background: p.backdrop === 'studio' ? p.ink : p.background, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id={`${id}-pl`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.accentLight} />
            <stop offset="1" stopColor={p.accentDark} />
          </linearGradient>
          <clipPath id={`${id}-clip`}>
            <path d={pd(plate)} />
          </clipPath>
          <linearGradient id={`${id}-gl`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.5" stopColor="#fff" stopOpacity={0.6} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <g transform={`translate(${shake} 0)`}>
          {p.backdrop === 'studio' && <NewsStudioBg id={id} frame={frame} w={w} h={h} u={u} ink={p.ink} accent={p.accent} paper={p.paper} />}
          {slash(0.04, 22 * u, 1)}
          {slash(0.1, 8 * u, -1)}
          {rk > 0 && rk < 1 && (
            <ellipse cx={cx} cy={cy} rx={lerp(300, 1000, eo(rk)) * u * 0.5 * (PW / (520 * u))} ry={lerp(120, 420, eo(rk)) * u * 0.5 * (PW / (520 * u))} fill="none" stroke={p.accent} strokeWidth={lerp(7, 1, rk) * u} opacity={1 - rk * 0.7} />
          )}
          {wk > 0 && (
            <g>
              <defs>
                <clipPath id={`${id}-wm`}>
                  <rect x={cx - (w / 2) * wk} y={0} width={w * wk} height={h} />
                </clipPath>
              </defs>
              <g clipPath={`url(#${id}-wm)`}>
                <text x={cx} y={cy + PH * 0.5 + wmSize * 1.35} textAnchor="middle" fontFamily={lbf('barlow')} fontWeight={800} fontSize={wmSize} letterSpacing="0.08em">
                  {p.wordmark.map(([txt, col], i) => (
                    <tspan key={i} fill={col}>
                      {txt}
                    </tspan>
                  ))}
                </text>
                <rect x={cx - PW * 0.5} y={cy + PH * 0.5 + wmSize * 1.75} width={PW} height={1.5 * u} fill={p.gold} opacity={0.7} />
                <text x={cx} y={cy + PH * 0.5 + wmSize * 1.75 + dlSize * 1.9} textAnchor="middle" fontFamily={lbf('plex')} fontWeight={500} fontSize={dlSize} letterSpacing="0.3em" fill={p.gold}>
                  {p.dateline.toUpperCase()}
                </text>
              </g>
            </g>
          )}
          {ps > 0 && (
            <g transform={`translate(${px} ${py}) rotate(${(sRot * 180) / Math.PI * (1 - fly)}) scale(${ps})`}>
              <path d={pd(plate.map(([x, y]) => [x + 8 * u, y + 8 * u] as P))} fill="#000" opacity={0.35} />
              <path d={pd(plate)} fill={`url(#${id}-pl)`} />
              <path d={pd(bar(PW * 0.035, PW * 0.035))} fill={p.ink} />
              <path d={pd(bar(PW * 0.085, PW * 0.018))} fill={p.gold} />
              <g clipPath={`url(#${id}-clip)`}>
                {letters.map((c, i) => {
                  const lk = clamp(drop * (letters.length + 1) - i);
                  const y = (1 - eo(lk)) * -PH * 1.2;
                  return (
                    <text key={i} x={-totalW / 2 + lw * (i + 0.5) + PW * 0.05} y={PH * 0.24 + y} textAnchor="middle" fontFamily={lbf('barlow')} fontWeight={800} fontSize={fs} fill={p.ink} opacity={lk > 0 ? 1 : 0}>
                      {c}
                    </text>
                  );
                })}
                {gk > 0 && gk < 1 && <rect x={lerp(-PW, PW, gk) - 80 * u} y={-PH} width={160 * u} height={PH * 2} fill={`url(#${id}-gl)`} transform="skewX(-16)" />}
              </g>
            </g>
          )}
          {bugWm > 0 && (
            <text
              x={p.bugCorner === 'tr' ? bx - (PW * bugS) / 2 - 22 * u : bx + (PW * bugS) / 2 + 22 * u}
              y={by + 9 * u}
              textAnchor={p.bugCorner === 'tr' ? 'end' : 'start'}
              fontFamily={lbf('barlow')}
              fontWeight={800}
              fontSize={26 * u}
              letterSpacing="0.08em"
              opacity={bugWm}
            >
              {p.wordmark.map(([txt, col], i) => (
                <tspan key={i} fill={col}>
                  {txt}
                </tspan>
              ))}
            </text>
          )}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const stingBug = defineMotion<Props>({
  id: 'sting-bug',
  title: 'News sting → channel bug',
  category: 'text',
  description:
    'Broadcast sting: lemon slashes zip across a dark studio, a sheared lemon name plate slams in with overshoot as its letters drop in, an ellipse ring and a shake land the hit, the wordmark and mono dateline open from the centre, a glint sweeps, then the plate flies to the corner and stays as the channel bug.',
  source: ['lemo-opuscar styles/news-package (MIT code, CC BY 4.0 docs, LemoLab) — demo/main.js shotSting/stingLogo/plate/bug/studioBg'],
  useFor: 'Intros for weekly updates, newsletters-as-video, YouTube news channels — opening and persistent branding in one object.',
  durationInFrames: 90,
  defaultProps: {
    name: 'Lumen',
    wordmark: [
      ['DAILY ', NEWS.paper],
      ['BRIEF', NEWS.accent],
    ],
    dateline: 'Monday · 14 March',
    accent: NEWS.accent,
    accentLight: NEWS.accentLight,
    accentDark: NEWS.accentDark,
    gold: NEWS.gold,
    ink: NEWS.ink,
    paper: NEWS.paper,
    bugCorner: 'tr',
    bugScale: 0.327,
    holdBug: true,
    startFrame: 0,
    backdrop: 'studio',
    background: 'transparent',
  },
  propDocs: {
    name: 'plate letters (short brand name, 3–7 letters)',
    wordmark: 'wordmark segments [[text, colour], …] under the plate and beside the bug',
    dateline: 'mono dateline under the wordmark',
    accent: 'lemon accent (slashes, ring)',
    accentLight: 'plate gradient top',
    accentDark: 'plate gradient bottom',
    gold: 'gold bar / dateline colour',
    ink: 'ink (studio, letters)',
    paper: 'paper colour for light text',
    bugCorner: '"tr" or "tl" corner for the bug',
    bugScale: 'bug size relative to the plate',
    holdBug: 'fly to the corner and stay as the bug',
    startFrame: 'delay before the sting',
    backdrop: '"studio" or "none" (overlay)',
    background: 'background when backdrop is "none"',
  },
  component: StingBug,
  tags: ['sting', 'ident', 'logo', 'channel bug', 'news', 'broadcast', 'intro', 'slam', 'plate', 'branding', 'overlay', 'corner logo'],
});
