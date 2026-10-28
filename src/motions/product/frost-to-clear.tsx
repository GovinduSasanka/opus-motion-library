// Adapted from lemo-opuscar/styles/glass-product STYLE.md section 8 (frost-to-clear material tween) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {resolveSrc} from '../../core/asset';
import {useSafeId} from '../../core/image-kit';
import {easeIO, easeOut3, mixHex, s1f, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A frosted shell clears: roughness 0.4 -> 0.015 and transmission 0.85 -> 1 over ~1.2 s (ease in-out). 2D rendition of the
 * material tween: the inner layer sits behind a blurred, white-tinted, grained copy that cross-fades to sharp behind a glass
 * outline, so the mechanism inside goes from a soft ghost to crisp. Readouts show the live material values.
 */
type Props = {
  title: string;
  innerLabel: string;
  src: string;
  roughFrom: number;
  roughTo: number;
  transFrom: number;
  clearAt: number;
  clearFrames: number;
  inner: string;
  accent: string;
  background: string;
};

const gearPath = (teeth: number, ro: number, ri: number, hole: number) => {
  let d = '';
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts: [number, number][] = [
      [a - step * 0.28, ri],
      [a - step * 0.16, ro],
      [a + step * 0.16, ro],
      [a + step * 0.28, ri],
    ];
    pts.forEach(([ang, r], k) => {
      d += `${i === 0 && k === 0 ? 'M' : 'L'}${(Math.cos(ang) * r).toFixed(2)} ${(Math.sin(ang) * r).toFixed(2)}`;
    });
  }
  d += 'Z';
  d += `M${hole} 0A${hole} ${hole} 0 1 0 ${-hole} 0A${hole} ${hole} 0 1 0 ${hole} 0Z`;
  return d;
};

const FrostToClear: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const uid = useSafeId('ftc');
  const k = easeIO(sseg(frame, p.clearAt, p.clearAt + p.clearFrames));
  const rough = p.roughFrom + (p.roughTo - p.roughFrom) * k;
  const trans = p.transFrom + (1 - p.transFrom) * k;
  const fr = clamp((rough - p.roughTo) / Math.max(1e-6, p.roughFrom - p.roughTo)); // 1 frosted .. 0 clear
  const cw = portrait ? w * 0.8 : Math.min(w * 0.46, h * 0.82);
  const ch = portrait ? cw * 0.82 : cw * 0.74;
  const cx = w / 2;
  const cy = portrait ? h * 0.42 : h * 0.47;
  const rad = ch * 0.1;
  const blur = 30 * u * fr * (cw / (460 * u)) * 0.5;
  const enter = easeOut3(sseg(frame, 0, 16));
  const rot = frame * 1.4;
  const g1 = gearPath(14, ch * 0.2, ch * 0.165, ch * 0.05);
  const g2 = gearPath(9, ch * 0.13, ch * 0.105, ch * 0.035);
  const g3 = gearPath(11, ch * 0.15, ch * 0.12, ch * 0.04);
  const bokeh = React.useMemo(
    () => [
      [0.12, 0.2, 0.2, '#3FD0C9'], [0.88, 0.25, 0.26, '#6A7BFF'], [0.2, 0.85, 0.24, '#FF8A5C'], [0.8, 0.8, 0.2, '#C57BFF'], [0.5, 0.1, 0.16, '#FFD76A'], [0.62, 0.92, 0.14, '#3FD0C9'],
    ] as [number, number, number, string][],
    [],
  );
  const sheen = sseg(frame, p.clearAt + p.clearFrames - 4, p.clearAt + p.clearFrames + 26);
  const innerG = (
    <g>
      <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} fill={mixHex(p.background, '#0b1626', 0.4)} />
      {p.src ? (
        <image href={resolveSrc(p.src)} x={-cw / 2} y={-ch / 2} width={cw} height={ch} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <g>
          <g transform={`translate(${-ch * 0.17} ${-ch * 0.04}) rotate(${rot})`}>
            <path d={g1} fill="#E8EDF7" fillRule="evenodd" stroke="#8FA0C0" strokeWidth={2 * u} />
            <circle r={ch * 0.012} fill={p.accent} />
          </g>
          <g transform={`translate(${ch * 0.086} ${-ch * 0.1}) rotate(${-rot * (14 / 9) + 10})`}>
            <path d={g2} fill="#F2B84B" fillRule="evenodd" stroke="#B07F1E" strokeWidth={2 * u} />
          </g>
          <g transform={`translate(${ch * 0.1} ${ch * 0.13}) rotate(${-rot * (14 / 11) + 4})`}>
            <path d={g3} fill="#7DD3C8" fillRule="evenodd" stroke="#3A8F86" strokeWidth={2 * u} />
          </g>
          <circle cx={ch * 0.3} cy={-ch * 0.02} r={ch * 0.06} fill="none" stroke={p.accent} strokeWidth={3 * u} opacity={0.9} />
          <circle cx={ch * 0.3} cy={-ch * 0.02} r={ch * 0.024 * (1 + 0.15 * Math.sin(frame * 0.2))} fill={p.accent} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={-cw * 0.4 + i * cw * 0.045} y={ch * 0.3 - (0.04 + 0.05 * ((i * 7) % 4)) * ch} width={cw * 0.03} height={(0.04 + 0.05 * ((i * 7) % 4)) * ch} rx={u * 2} fill={withAlpha('#ffffff', 0.55)} />
          ))}
          <text x={-cw * 0.4} y={ch * 0.42} fontFamily={s1f.barlow} fontWeight={600} fontSize={ch * 0.062} letterSpacing={ch * 0.01} fill="#BFD2F0">
            {p.innerLabel}
          </text>
        </g>
      )}
    </g>
  );
  const bg = (
    <g>
      {bokeh.map(([bx, by, br, c], i) => (
        <circle key={i} cx={(bx - 0.5) * w * 1.2} cy={(by - 0.5) * h * 1.1} r={br * Math.min(w, h) * 0.5} fill={c} opacity={0.28} />
      ))}
    </g>
  );
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={mixHex(p.background, '#2B3A66', 0.6)} />
            <stop offset="1" stopColor={p.background} />
          </linearGradient>
          <clipPath id={`${uid}-cl`}>
            <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={rad} />
          </clipPath>
          <filter id={`${uid}-bl`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={Math.max(0.01, blur)} />
          </filter>
          <filter id={`${uid}-bb`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={Math.max(0.01, blur * 0.7 + 3 * u)} />
          </filter>
          <filter id={`${uid}-gr`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2.4 -0.9" />
          </filter>
          <linearGradient id={`${uid}-sp`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={0.5} />
            <stop offset="0.5" stopColor="#fff" stopOpacity={0.05} />
            <stop offset="1" stopColor="#fff" stopOpacity={0.18} />
          </linearGradient>
          <linearGradient id={`${uid}-sw`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.5" stopColor="#fff" stopOpacity={0.7} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#${uid}-bg)`} />
        <g transform={`translate(${cx} ${cy})`}>
          <g transform={`translate(0 ${-h * 0.01})`}>{bg}</g>
        </g>
        <g transform={`translate(${cx} ${cy}) scale(${0.94 + 0.06 * enter})`} opacity={enter}>
          {/* shadow */}
          <rect x={-cw / 2 + 6 * u} y={-ch / 2 + 26 * u} width={cw} height={ch} rx={rad} fill="rgba(0,0,0,0.35)" opacity={0.5} />
          <g clipPath={`url(#${uid}-cl)`}>
            {/* what is behind the glass */}
            <g transform={`translate(0 ${-h * 0.01})`}>{bg}</g>
            {/* inner layer: blurred while frosted */}
            <g filter={blur > 0.2 ? `url(#${uid}-bl)` : undefined}>{innerG}</g>
            {/* frost: blurred backdrop copy + white tint + grain, fading with roughness */}
            <g opacity={fr}>
              <g filter={`url(#${uid}-bb)`} opacity={0.7}>
                {bg}
              </g>
              <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} fill="#EAF2FF" opacity={0.42} />
              <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} filter={`url(#${uid}-gr)`} opacity={0.45} />
            </g>
            <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} fill={`url(#${uid}-sp)`} opacity={0.45 + 0.4 * (1 - fr)} />
            {sheen > 0 && sheen < 1 && (
              <g transform={`translate(${-cw * 0.7 + cw * 1.5 * easeIO(sheen)} 0) skewX(-18)`}>
                <rect x={0} y={-ch} width={cw * 0.16} height={ch * 2} fill={`url(#${uid}-sw)`} />
              </g>
            )}
          </g>
          {/* glass outline */}
          <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={rad} fill="none" stroke={withAlpha('#ffffff', 0.55 + 0.35 * (1 - fr))} strokeWidth={(2.5 + 1.2 * (1 - fr)) * u} />
          <rect x={-cw / 2 + 5 * u} y={-ch / 2 + 5 * u} width={cw - 10 * u} height={ch - 10 * u} rx={rad - 4 * u} fill="none" stroke={withAlpha('#ffffff', 0.14)} strokeWidth={u} />
        </g>
        {/* readouts */}
        <g transform={`translate(${cx} ${cy + ch / 2 + (portrait ? 0.07 : 0.1) * h})`} opacity={enter}>
          <text textAnchor="middle" y={0} fontFamily={s1f.dela} fontSize={Math.min(46 * u, w * 0.06)} letterSpacing={4 * u} fill="#fff">
            {p.title}
          </text>
          {[
            ['ROUGHNESS', rough.toFixed(3), fr],
            ['TRANSMISSION', trans.toFixed(2), 1 - (1 - trans) / Math.max(1e-6, 1 - p.transFrom)],
          ].map(([lab, val, t], i) => {
            const bw = Math.min(cw * 0.42, 300 * u);
            const x = (i ? 1 : -1) * (bw / 2 + 16 * u);
            return (
              <g key={String(lab)} transform={`translate(${x} ${42 * u})`}>
                <text x={-bw / 2} fontFamily={s1f.barlow} fontWeight={600} fontSize={20 * u} letterSpacing={3 * u} fill="#9FB2D8">
                  {lab}
                </text>
                <text x={bw / 2} textAnchor="end" fontFamily={s1f.barlow} fontWeight={600} fontSize={20 * u} letterSpacing={2 * u} fill="#fff">
                  {val}
                </text>
                <rect x={-bw / 2} y={12 * u} width={bw} height={6 * u} rx={3 * u} fill="rgba(255,255,255,0.12)" />
                <rect x={-bw / 2} y={12 * u} width={bw * (i ? Number(t) : Number(t))} height={6 * u} rx={3 * u} fill={p.accent} />
              </g>
            );
          })}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const frostToClear = defineMotion<Props>({
  id: 'frost-to-clear',
  title: 'Frost to clear',
  category: 'product',
  description:
    'A frosted glass shell clears: roughness drops 0.4 to 0.015 and transmission rises to 1 over about 1.2 s, the blurred white-tinted ghost of the mechanism inside sharpens into crisp gears, with live material readouts.',
  source: ['lemo-opuscar styles/glass-product STYLE.md section 8 (MIT, LemoLab)'],
  useFor: 'Privacy / transparency features, "honest breakdown" reveals, glass-material product films.',
  durationInFrames: 150,
  defaultProps: {
    title: 'NOTHING TO HIDE',
    innerLabel: 'OPEN BY DESIGN',
    src: '',
    roughFrom: 0.4,
    roughTo: 0.015,
    transFrom: 0.85,
    clearAt: 26,
    clearFrames: 36,
    inner: 'gears',
    accent: '#FF6B4A',
    background: '#0C1424',
  },
  propDocs: {
    title: 'headline under the card',
    innerLabel: 'caption inside the shell',
    src: 'optional image (public/) shown inside the shell instead of the gears',
    roughFrom: 'starting roughness (frosted)',
    roughTo: 'final roughness (clear)',
    transFrom: 'starting transmission',
    clearAt: 'frame the clearing starts',
    clearFrames: 'frames the ease in-out takes (36 = 1.2 s)',
    inner: 'inner layer kind (gears)',
    accent: 'accent colour',
    background: 'backdrop colour',
  },
  component: FrostToClear,
  tags: ['frost', 'glass', 'clear', 'transparency', 'privacy', 'reveal', 'blur', 'roughness', 'transmission', 'product', 'material', 'gears', 'honest'],
});
