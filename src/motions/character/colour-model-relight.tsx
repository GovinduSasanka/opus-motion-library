// Adapted from lemo-opuscar/styles/cel-anime-80s/demo/pal.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {useSafeId} from '../../core/image-kit';
import {CelShape, LIGHT_SETS, mixSet, relight, type LightSet} from '../../core/r2-la1-kit';
import {mixHex, s1f, sseg, smooth01} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Colour-model relight: one cel character re-lit for day / dawn / night / backlit / silhouette by multiplying each paint
 * role separately (fills by `lit`, shadow fills by `shade`, lines by `line`, skin overridden by hand) — faces stay right and
 * lines darken with their fills. In compare mode the left panel shows the lazy alternative, one multiply over the whole frame
 * (what a grade filter does): skin goes muddy and lines turn to mush. The painted backdrop is separate and swaps per set.
 */
type Props = {
  sets: string[];
  jacket: string;
  scarf: string;
  hair: string;
  skin: string;
  compare: boolean;
  swatches: boolean;
  background: string;
};

const SKY: Record<string, [string, string]> = {
  day: ['#7EB8F2', '#FFE9B8'],
  dawn: ['#5C5FA8', '#FFB490'],
  night: ['#130D1F', '#3A2F4D'],
  backlit: ['#E8704A', '#FFE0A0'],
  silhouette: ['#FF9A62', '#FFE9A8'],
};

const JACKET = 'M-175 230L-152 92Q-122 40 -52 30L52 30Q122 40 152 92L175 230Z';
const NECK = 'M-34 24L-34 -34Q0 -8 34 -34L34 24Z';
const HEAD = 'M-72 -84Q-80 -196 0 -206Q80 -196 72 -84Q62 -8 0 4Q-62 -8 -72 -84Z';
const HAIR = 'M-88 -92Q-108 -238 0 -240Q108 -238 88 -92Q76 -156 34 -164Q14 -132 -26 -154Q-62 -146 -72 -92Z';
const SCARF = 'M-64 22Q0 66 64 22L76 62Q0 108 -76 62Z';
const TAIL = 'M26 58L66 150L24 158L2 76Z';

const Panel: React.FC<{
  uid: string;
  set: LightSet;
  skyA: string;
  skyB: string;
  pal: Record<string, string>;
  mode: 'relight' | 'frame';
  lit: LightSet;
  label: string;
  size: number;
  frame: number;
}> = ({uid, set, skyA, skyB, pal, mode, lit, label, size, frame}) => {
  // relight: per-role vectors; frame: one lit multiplier over everything (day palette, then the filter)
  const P =
    mode === 'relight'
      ? relight(pal, set, {
          jacketSh: 'shade',
          jacketLn: 'line',
          scarfSh: 'shade',
          scarfLn: 'line',
          skin: 'skin',
          skinSh: 'skinShade',
          skinLn: 'line',
          hairSh: 'shade',
          hairLn: 'line',
          eye: 'line',
        })
      : pal;
  const L: [number, number] = [-0.6, -0.8];
  const sc = size / 520;
  const sway = Math.sin(frame * 0.05) * 3;
  const filt = mode === 'frame' ? `url(#${uid}-f)` : undefined;
  return (
    <g>
      <g filter={filt}>
      <defs>
        <filter id={`${uid}-f`} colorInterpolationFilters="sRGB" x="-10%" y="-10%" width="120%" height="120%">
          <feColorMatrix type="matrix" values={`${lit.lit[0]} 0 0 0 0  0 ${lit.lit[1]} 0 0 0  0 0 ${lit.lit[2]} 0 0  0 0 0 1 0`} />
        </filter>
        <linearGradient id={`${uid}-sk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyA} />
          <stop offset="1" stopColor={skyB} />
        </linearGradient>
        <clipPath id={`${uid}-cp`}>
          <rect x={-size * 0.5} y={-size * 0.5} width={size} height={size} rx={size * 0.04} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}-cp)`}>
        <rect x={-size * 0.5} y={-size * 0.5} width={size} height={size} fill={`url(#${uid}-sk)`} />
        {/* painted backdrop: windows glow, a moon/sun disc */}
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={-size * 0.5 + (i * 0.23 + 0.02) * size} y={size * (0.12 + (i % 2) * 0.06)} width={size * 0.14} height={size * (0.28 - (i % 2) * 0.04)} fill={mixHex(skyA, '#000', 0.5)} opacity={0.35} />
        ))}
        <g transform={`translate(0 ${size * 0.08}) scale(${sc}) translate(${sway * 0.3} 0)`}>
          <CelShape id={`${uid}-ja`} d={JACKET} fill={P.jacket} shade={P.jacketSh} hi={mixHex(P.jacket, '#ffffff', 0.35)} rim={mode === 'relight' ? '#FF3FA4' : undefined} line={P.jacketLn} light={L} shadeOff={16} hiOff={6} rimOff={4} lineW={3.2} />
          <path d={NECK} fill={P.skinSh} stroke={P.skinLn} strokeWidth={3} strokeLinejoin="round" />
          <CelShape id={`${uid}-tl`} d={TAIL} fill={P.scarf} shade={P.scarfSh} hi={mixHex(P.scarf, '#ffffff', 0.3)} line={P.scarfLn} light={L} shadeOff={9} hiOff={4} rimOff={0} lineW={3} />
          <CelShape id={`${uid}-hd`} d={HEAD} fill={P.skin} shade={P.skinSh} hi={mixHex(P.skin, '#ffffff', 0.3)} line={P.skinLn} light={L} shadeOff={13} hiOff={5} rimOff={0} lineW={3} />
          {/* eyes + mouth (flat line colour) */}
          <g fill={P.eye} stroke="none">
            <path d="M-46 -90Q-30 -102 -12 -88Q-28 -80 -46 -90Z" />
            <path d="M12 -88Q30 -102 46 -90Q28 -80 12 -88Z" />
          </g>
          <path d="M-14 -40Q0 -32 14 -40" fill="none" stroke={P.skinLn} strokeWidth={4} strokeLinecap="round" />
          <CelShape id={`${uid}-hr`} d={HAIR} fill={P.hair} shade={P.hairSh} hi={mixHex(P.hair, '#ffffff', 0.25)} rim={mode === 'relight' ? '#35E7FF' : undefined} line={P.hairLn} light={L} shadeOff={12} hiOff={5} rimOff={3.5} lineW={3} />
          <CelShape id={`${uid}-sf`} d={SCARF} fill={P.scarf} shade={P.scarfSh} hi={mixHex(P.scarf, '#ffffff', 0.3)} line={P.scarfLn} light={L} shadeOff={9} hiOff={4} rimOff={0} lineW={3} />
        </g>
      </g>
      <rect x={-size * 0.5} y={-size * 0.5} width={size} height={size} rx={size * 0.04} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={2} />
      </g>
      <text y={size * 0.5 + size * 0.1} textAnchor="middle" fontFamily={s1f.barlow} fontWeight={600} fontSize={size * 0.062} letterSpacing={size * 0.012} fill="#cfc6e4">
        {label}
      </text>
      {/* the live matrix, shown as three role vectors */}
      <g transform={`translate(0 ${size * 0.5 + size * 0.17})`} opacity={0.95}>
        {(['lit', 'shade', 'line'] as const).map((k, i) => (
          <g key={k} transform={`translate(${(i - 1) * size * 0.3} 0)`}>
            <rect x={-size * 0.12} y={-size * 0.03} width={size * 0.24} height={size * 0.06} rx={size * 0.012} fill={`rgb(${Math.round(clamp(lit[k][0] * 200, 0, 255))},${Math.round(clamp(lit[k][1] * 200, 0, 255))},${Math.round(clamp(lit[k][2] * 200, 0, 255))})`} />
            <text y={size * 0.1} textAnchor="middle" fontFamily={s1f.barlow} fontWeight={600} fontSize={size * 0.036} letterSpacing={size * 0.005} fill="#8F86AE">
              {k.toUpperCase()}
            </text>
          </g>
        ))}
      </g>
    </g>
  );
};

const ColourModelRelight: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const uid = useSafeId('cmr');
  const seg = 30;
  const names = p.sets.length ? p.sets : ['day'];
  const idx = Math.min(names.length - 1, Math.floor(frame / seg));
  const prev = names[Math.max(0, idx - 1)];
  const cur = names[idx];
  const tr = idx === 0 ? 1 : smooth01(sseg(frame - idx * seg, 0, 9));
  const A = LIGHT_SETS[prev] ?? LIGHT_SETS.day;
  const B = LIGHT_SETS[cur] ?? LIGHT_SETS.day;
  const set = mixSet(A, B, tr);
  const skyP = SKY[prev] ?? SKY.day;
  const skyC = SKY[cur] ?? SKY.day;
  const skyA = mixHex(skyP[0], skyC[0], tr);
  const skyB = mixHex(skyP[1], skyC[1], tr);
  const base = {
    jacket: p.jacket,
    jacketSh: mixHex(p.jacket, '#2a1840', 0.42),
    jacketLn: mixHex(p.jacket, '#1a0c24', 0.66),
    scarf: p.scarf,
    scarfSh: mixHex(p.scarf, '#4a1030', 0.4),
    scarfLn: mixHex(p.scarf, '#2a0a1c', 0.62),
    skin: p.skin,
    skinSh: mixHex(p.skin, '#9B82B4', 0.6),
    skinLn: '#5A2E2E',
    hair: p.hair,
    hairSh: mixHex(p.hair, '#10082a', 0.45),
    hairLn: '#2E1850',
    eye: '#2E1850',
  };
  const compare = p.compare;
  const size = compare ? (portrait ? Math.min(w * 0.62, h * 0.33) : Math.min(w * 0.36, h * 0.6)) : portrait ? Math.min(w * 0.8, h * 0.5) : Math.min(w * 0.5, h * 0.66);
  const day = LIGHT_SETS.day;
  void day;
  const frameSet = set; // the naive grade multiplies everything by the lit vector
    const label = set.label;
  const pos: [number, number][] = compare ? (portrait ? [[w / 2, h * 0.27], [w / 2, h * 0.7]] : [[w * 0.27, h * 0.44], [w * 0.73, h * 0.44]]) : [[w / 2, h * 0.44]];
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <rect width={w} height={h} fill={p.background} />
        <text x={w / 2} y={h * (portrait ? 0.07 : 0.1)} textAnchor="middle" fontFamily={s1f.dela} fontSize={Math.min(w * 0.06, 64 * u * (portrait ? 1.1 : 1))} fill="#FFF0A0" letterSpacing={6 * u}>
          {label}
        </text>
        {compare ? (
          <>
            <g transform={`translate(${pos[0][0]} ${pos[0][1]})`}>
              <Panel uid={`${uid}a`} set={set} skyA={skyA} skyB={skyB} pal={base} mode="frame" lit={frameSet} label="ONE FILTER OVER THE FRAME" size={size} frame={frame} />
            </g>
            <g transform={`translate(${pos[1][0]} ${pos[1][1]})`}>
              <Panel uid={`${uid}b`} set={set} skyA={skyA} skyB={skyB} pal={base} mode="relight" lit={set} label="RELIGHT PER PAINT ROLE" size={size} frame={frame} />
            </g>
          </>
        ) : (
          <g transform={`translate(${pos[0][0]} ${pos[0][1]})`}>
            <Panel uid={`${uid}b`} set={set} skyA={skyA} skyB={skyB} pal={base} mode="relight" lit={set} label="RELIGHT PER PAINT ROLE" size={size} frame={frame} />
          </g>
        )}
        {p.swatches && (
          <g transform={`translate(${w / 2} ${h * (portrait ? 0.955 : 0.94)})`}>
            {names.map((n, i) => {
              const gap = Math.min(w * 0.17, 180 * u);
              const x = (i - (names.length - 1) / 2) * gap;
              const on = names[idx] === n;
              return (
                <g key={n} transform={`translate(${x} 0)`}>
                  <rect x={-gap * 0.44} y={-16 * u} width={gap * 0.88} height={32 * u} rx={16 * u} fill={on ? '#FFF0A0' : 'rgba(255,255,255,0.08)'} />
                  <text textAnchor="middle" y={6 * u} fontFamily={s1f.barlow} fontWeight={600} fontSize={Math.min(20 * u, gap * 0.15)} letterSpacing={2 * u} fill={on ? '#1a1020' : '#cfc6e4'}>
                    {n.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const colourModelRelight = defineMotion<Props>({
  id: 'colour-model-relight',
  title: 'Colour-model relight',
  category: 'character',
  description:
    'One cel character re-lit through day, dawn, night, backlit and silhouette by multiplying each paint role separately (fills, shadows, lines, hand-set skin), beside the muddy result of a single filter over the whole frame.',
  source: ['lemo-opuscar styles/cel-anime-80s/demo/pal.js (MIT, LemoLab)'],
  useFor:
    'Reuse the same character or asset across times of day and moods without a frame filter; copy relight(palette, set) from r2-la1-kit into your own character motions as a timeOfDay prop.',
  durationInFrames: 160,
  defaultProps: {
    sets: ['day', 'dawn', 'night', 'backlit', 'silhouette'],
    jacket: '#2F6FE2',
    scarf: '#FF6B6B',
    hair: '#5B3A9E',
    skin: '#F0C7A8',
    compare: true,
    swatches: true,
    background: '#0E0A18',
  },
  propDocs: {
    sets: 'sequence of light sets: day | dawn | night | backlit | silhouette (30 frames each, blended)',
    jacket: 'jacket fill colour (shade and line colours are derived)',
    scarf: 'hero accent colour — stays readable in every set',
    hair: 'hair fill colour',
    skin: 'daylight skin colour (each set overrides it by hand)',
    compare: 'true = left panel shows one filter over the whole frame, right panel the per-role relight',
    swatches: 'show the set chips at the bottom',
    background: 'page colour behind the panels',
  },
  component: ColourModelRelight,
  tags: ['relight', 'time of day', 'palette', 'cel', 'anime', 'night', 'dawn', 'backlit', 'silhouette', 'colour model', 'character', 'utility', 'compare'],
});
