// Adapted from lemo-opuscar/styles/scifi-toon/demo/main.js (titleArt) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {fx, h1, lf, measure, mixHex, useUid} from '../../core/r2-lb2-kit';
import {star4} from '../../core/r2-lb2a-kit';

/**
 * A 1950s atomic-age TV title: fat block caps in cream with a thick ink outline and a hard magenta offset shadow,
 * wrapped by a tilted cyan orbit ellipse that passes behind the top of the letters and in front of the bottom, a small
 * object flying round it, and a few four-point stars twinkling. Pops in on twos with a 0 -> 1.08 -> 1 overshoot.
 */
type Props = {
  title: string;
  subtitle: string;
  fill: string;
  inkColor: string;
  shadowColor: string;
  ringColor: string;
  ringTilt: number;
  orbitIcon: string;
  orbitSeconds: number;
  stars: number;
  popAt: number;
  boil: boolean;
  background: string;
  fontSize: number;
  seed: number;
};

const POP = [0, 0.7, 1.08, 1];

const AtomicOrbitTitle: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const id = useUid('aot');
  const fam = lf('bungee');
  const sub = lf('baloo');

  // fit the title: one line if it fits, else two lines split near the middle
  const maxW = w * (portrait ? 0.86 : 0.7);
  let size = p.fontSize * u;
  let lines = [p.title.toUpperCase()];
  const widthOf = (s: string, sz: number) => measure(s, fam, sz, 400);
  if (widthOf(lines[0], size) > maxW) {
    const words = p.title.toUpperCase().split(/\s+/);
    if (words.length > 1) {
      let best = 1;
      let bestD = 1e9;
      for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i).join(' ');
        const b = words.slice(i).join(' ');
        const d = Math.abs(widthOf(a, 100) - widthOf(b, 100));
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')];
    }
  }
  const wMax = Math.max(...lines.map((l) => widthOf(l, size)));
  if (wMax > maxW) size *= maxW / wMax;
  const lineH = size * 1.0;
  const blockW = Math.max(...lines.map((l) => widthOf(l, size)));
  const blockH = lineH * lines.length;
  const subSize = size * 0.3;

  // entrance on twos
  const q = Math.floor((frame - p.popAt) / 2);
  const pop = q < 0 ? 0 : POP[Math.min(POP.length - 1, q)];
  const cx = w / 2;
  const cy = h * (portrait ? 0.45 : 0.46);
  const ink = p.inkColor;
  const ow = 22 * u * (size / (150 * u));
  const sh = 12 * u * (size / (150 * u));
  const rx = blockW * 0.65;
  const ry = Math.max(blockH * 0.34, 36 * u);
  const orbitT = (frame / fps / p.orbitSeconds) * Math.PI * 2 + 0.8;
  const ox = Math.cos(orbitT) * rx;
  const oy = Math.sin(orbitT) * ry;
  const frontObj = Math.sin(orbitT) > 0;
  const seedIdx = (Math.floor(frame / 2) % 3) + 1;
  const textY0 = -blockH / 2 + size * 0.82;

  const textLines = (dx: number, dy: number, props: React.SVGProps<SVGTextElement>) => (
    <text x={dx} y={dy + textY0} textAnchor="middle" fontFamily={fam} fontSize={size} fontWeight={400} strokeLinejoin="round" {...props}>
      {lines.map((l, i) => (
        <tspan key={i} x={dx} dy={i === 0 ? 0 : lineH}>
          {l}
        </tspan>
      ))}
    </text>
  );

  const icon = (() => {
    const s = size * 0.2;
    if (p.orbitIcon === 'planet' || !p.orbitIcon) {
      return (
        <g>
          <circle r={s} fill="#ffb347" stroke={ink} strokeWidth={5 * u} />
          <path d={`M${fx(-s * 0.9)},${fx(-s * 0.15)} Q0,${fx(s * 0.2)} ${fx(s * 0.9)},${fx(-s * 0.35)}`} fill="none" stroke={mixHex('#ffb347', '#c0392b', 0.5)} strokeWidth={s * 0.22} />
          <ellipse rx={s * 1.7} ry={s * 0.42} transform="rotate(-18)" fill="none" stroke={ink} strokeWidth={9 * u} opacity={0.0} />
          <ellipse rx={s * 1.7} ry={s * 0.42} transform="rotate(-18)" fill="none" stroke="#fff3d6" strokeWidth={4 * u} />
          <circle cx={-s * 0.3} cy={-s * 0.35} r={s * 0.18} fill="#fff" opacity={0.7} />
        </g>
      );
    }
    if (/\.(png|jpe?g|svg|webp)$/i.test(p.orbitIcon)) return <image href={resolveSrc(p.orbitIcon)} x={-s * 1.2} y={-s * 1.2} width={s * 2.4} height={s * 2.4} />;
    return (
      <text textAnchor="middle" dominantBaseline="central" fontSize={s * 2.1}>
        {p.orbitIcon}
      </text>
    );
  })();

  const starPos = Array.from({length: p.stars}, (_, i) => {
    const a = (i / Math.max(1, p.stars)) * Math.PI * 2 + 0.5 + h1(i, p.seed) * 0.6;
    const d = 1 + h1(i + 3, p.seed) * 0.12;
    return {x: Math.cos(a) * rx * d * 1.08, y: Math.sin(a) * (blockH * 0.85 + 10 * u) * d, ph: h1(i + 9, p.seed) * 6.28, r: (22 + h1(i + 5, p.seed) * 18) * u};
  });

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <filter id={`${id}b`} x="-10%" y="-20%" width="120%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency={`${0.014 / u}`} numOctaves={2} seed={seedIdx + p.seed} />
            <feDisplacementMap in="SourceGraphic" scale={p.boil ? 5 * u : 0} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <radialGradient id={`${id}bg`} cx="50%" cy="46%" r="75%">
            <stop offset="0" stopColor={mixHex(p.background, '#ffffff', 0.12)} />
            <stop offset="1" stopColor={mixHex(p.background, '#000000', 0.35)} />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#${id}bg)`} />
        {/* slow sunburst */}
        <g transform={`translate(${fx(cx)},${fx(cy)}) rotate(${fx(frame * 0.12)})`} opacity={0.12}>
          {Array.from({length: 18}, (_, i) => {
            const a0 = (i / 18) * Math.PI * 2;
            const a1 = a0 + Math.PI / 18;
            const R = Math.hypot(w, h);
            return <path key={i} d={`M0,0 L${fx(Math.cos(a0) * R)},${fx(Math.sin(a0) * R)} L${fx(Math.cos(a1) * R)},${fx(Math.sin(a1) * R)} Z`} fill="#fff" />;
          })}
        </g>
        {pop > 0 && (
          <g transform={`translate(${fx(cx)},${fx(cy)}) scale(${fx(pop, 3)})`} filter={`url(#${id}b)`}>
            <g transform={`rotate(${p.ringTilt})`}>
              {/* back half of the orbit + object when behind */}
              <path d={`M${fx(-rx)},0 A${fx(rx)},${fx(ry)} 0 0 1 ${fx(rx)},0`} fill="none" stroke={ink} strokeWidth={17 * u} strokeLinecap="round" />
              <path d={`M${fx(-rx)},0 A${fx(rx)},${fx(ry)} 0 0 1 ${fx(rx)},0`} fill="none" stroke={p.ringColor} strokeWidth={9 * u} strokeLinecap="round" />
              {!frontObj && <g transform={`translate(${fx(ox)},${fx(oy)})`}>{icon}</g>}
              {/* text sits between the halves (un-tilted) */}
              <g transform={`rotate(${-p.ringTilt})`}>
                {textLines(sh, sh, {fill: p.shadowColor, stroke: p.shadowColor, strokeWidth: ow})}
                {textLines(0, 0, {fill: p.fill, stroke: ink, strokeWidth: ow, paintOrder: 'stroke'})}
                {p.subtitle && (
                  <g transform={`translate(0,${fx(blockH / 2 + subSize * 1.05)})`}>
                    <text textAnchor="middle" x={sh * 0.5} y={sh * 0.5} fontFamily={sub} fontWeight={800} fontSize={subSize} letterSpacing={subSize * 0.1} fill={p.shadowColor} stroke={p.shadowColor} strokeWidth={ow * 0.45} strokeLinejoin="round">
                      {p.subtitle.toUpperCase()}
                    </text>
                    <text textAnchor="middle" fontFamily={sub} fontWeight={800} fontSize={subSize} letterSpacing={subSize * 0.1} fill={p.ringColor} stroke={ink} strokeWidth={ow * 0.45} strokeLinejoin="round" paintOrder="stroke">
                      {p.subtitle.toUpperCase()}
                    </text>
                  </g>
                )}
              </g>
              {/* front half */}
              <path d={`M${fx(rx)},0 A${fx(rx)},${fx(ry)} 0 0 1 ${fx(-rx)},0`} fill="none" stroke={ink} strokeWidth={17 * u} strokeLinecap="round" />
              <path d={`M${fx(rx)},0 A${fx(rx)},${fx(ry)} 0 0 1 ${fx(-rx)},0`} fill="none" stroke={p.ringColor} strokeWidth={9 * u} strokeLinecap="round" />
              {frontObj && <g transform={`translate(${fx(ox)},${fx(oy)})`}>{icon}</g>}
            </g>
            {starPos.map((s, i) => {
              const k = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(frame * 0.18 + s.ph));
              return (
                <g key={i} transform={`translate(${fx(s.x)},${fx(s.y)}) scale(${fx(k, 3)}) rotate(${i % 2 ? 0 : 12})`}>
                  <path d={star4(s.r)} fill="#fff3d6" stroke={ink} strokeWidth={4 * u} strokeLinejoin="round" />
                </g>
              );
            })}
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const atomicOrbitTitle = defineMotion<Props>({
  id: 'atomic-orbit-title',
  title: 'Atomic orbit title (retro toon)',
  category: 'text',
  description:
    'A 1950s atomic-age TV title in fat cream block caps with a thick ink outline and a hard magenta offset shadow, wrapped by a tilted cyan orbit that threads behind the top of the letters and in front of the bottom, a small object flying round it and twinkling four-point stars; pops in on twos.',
  source: ['lemo-opuscar styles/scifi-toon demo/main.js (titleArt), DEMO.md "Titles & end card" (MIT, LemoLab)'],
  useFor: 'Playful show or episode titles, product names for tech and comedy brands, YouTube intros; complements stamp-slam and blur-in-title.',
  durationInFrames: 120,
  defaultProps: {
    title: 'Orbit Tonight',
    subtitle: 'A very small space opera',
    fill: '#fff1cf',
    inkColor: '#1b1422',
    shadowColor: '#ff4fa3',
    ringColor: '#33d6e8',
    ringTilt: -6,
    orbitIcon: 'planet',
    orbitSeconds: 2,
    stars: 4,
    popAt: 8,
    boil: true,
    background: '#2a1f6b',
    fontSize: 150,
    seed: 2,
  },
  propDocs: {
    title: 'title text (auto-fits; two lines when too wide)',
    subtitle: 'line under the title (empty = none)',
    fill: 'letter colour',
    inkColor: 'outline colour',
    shadowColor: 'hard offset shadow colour',
    ringColor: 'orbit ring colour',
    ringTilt: 'ring tilt in degrees',
    orbitIcon: "'planet', an emoji, or an image path/URL",
    orbitSeconds: 'seconds per orbit',
    stars: 'twinkling stars',
    popAt: 'frame of the pop-in',
    boil: 'wobble outlines on threes',
    background: 'backdrop colour',
    fontSize: 'title size in u at one line',
    seed: 'star layout seed',
  },
  component: AtomicOrbitTitle,
  tags: ['title', 'retro', 'atomic age', '1950s', 'orbit', 'toon', 'sci-fi', 'bungee', 'ring', 'planet', 'stars', 'intro', 'playful', 'outline', 'offset shadow'],
});
