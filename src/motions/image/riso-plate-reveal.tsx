import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {ease, clamp} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {PaperTexture, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Riso plates as narrative: a print inked one colour at a time. At first only the blue plate exists (a complete
 * silhouette world); at a turning point a roller sweeps across and the yellow plate inks in left → right with a
 * slightly heavier band at its edge (objects that were blank paper, like a scarf, light up first); later the pink
 * plate arrives and every overprint colour appears. Plates multiply over paper, each with registration offset and a
 * small kick on arrival. Works on a built-in procedural poster or on any image (`src`) split into three plates.
 */
type Arrival = {plate: number; at: number; sweepFrames: number; from: string};
type Props = {
  inks: string[];
  arrivals: Arrival[];
  paper: string;
  surround: string;
  src: string;
  title: string;
  registration: number;
  kick: number;
  band: number;
  grain: boolean;
  thresholds: number[];
};

const W = 1000;
const H = 1250;

const star = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z`;

const pine = (x: number, y: number, s: number) => `M${x} ${y - 110 * s} L${x + 32 * s} ${y - 50 * s} L${x + 18 * s} ${y - 50 * s} L${x + 44 * s} ${y} L${x + 6 * s} ${y} L${x + 6 * s} ${y + 22 * s} L${x - 6 * s} ${y + 22 * s} L${x - 6 * s} ${y} L${x - 44 * s} ${y} L${x - 18 * s} ${y - 50 * s} L${x - 32 * s} ${y - 50 * s}Z`;

/** procedural poster: one plate's artwork (0 blue silhouettes, 1 yellow lights, 2 pink flourishes) */
const PlateArt: React.FC<{plate: number; ink: string; title: string; pid: string}> = ({plate, ink, title, pid}) => {
  const dotsA = `${pid}-dotsA${plate}`;
  const dotsB = `${pid}-dotsB${plate}`;
  if (plate === 0) {
    return (
      <g fill={ink}>
        <rect x={0} y={0} width={W} height={760} fill={`url(#${dotsA})`} opacity={0.85} mask={`url(#${pid}-skyfade)`} />
        <path d="M0 720 L120 570 L230 660 L290 700 L470 700 L520 680 L700 540 L850 650 L1000 590 L1000 790 L0 790Z" opacity={0.5} />
        <path d="M0 780 Q250 650 500 730 T1000 710 L1000 1250 L0 1250Z" opacity={0.78} />
        {[90, 160, 215, 800, 870, 930].map((x, i) => (
          <path key={i} d={pine(x, 800 + (i % 3) * 18, 0.9 + (i % 3) * 0.18)} opacity={0.95} />
        ))}
        <path d="M640 790 L640 730 L700 690 L760 730 L760 790Z" />
        {/* walker: head, coat (neck gap left blank for the scarf), legs */}
        <circle cx={330} cy={640} r={27} />
        <path d="M297 678 L363 678 L380 790 L280 790Z" />
        <path d="M312 790 L304 850 M348 790 L356 850" stroke={ink} strokeWidth={14} strokeLinecap="round" fill="none" />
        <path d="M0 960 H1000" stroke={ink} strokeWidth={0} />
      </g>
    );
  }
  if (plate === 1) {
    return (
      <g fill={ink}>
        <circle cx={700} cy={470} r={140} />
        {[[120, 140, 22], [260, 80, 15], [430, 170, 18], [900, 120, 24], [820, 300, 14], [560, 90, 16], [170, 330, 14]].map(([x, y, r], i) => (
          <path key={i} d={star(x, y, r)} />
        ))}
        {/* scarf: blank paper in the blue plate, lights up in yellow */}
        <path d="M303 668 Q330 692 360 668 Q420 648 480 692 Q425 704 372 692 Q340 708 303 668Z" />
        <rect x={668} y={742} width={22} height={22} />
        <rect x={712} y={742} width={22} height={22} />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={560 + i * 18} y={900 + i * 26} width={160 - i * 24} height={8} rx={4} opacity={0.9} />
        ))}
      </g>
    );
  }
  return (
    <g fill={ink}>
      <ellipse cx={700} cy={560} rx={420} ry={240} fill={`url(#${dotsB})`} opacity={0.9} />
      {Array.from({length: 13}, (_, i) => {
        const x = 40 + i * 76 + (i % 2) * 18;
        const y = 1060 + ((i * 37) % 90);
        return (
          <g key={i}>
            <path d={`M${x} ${y + 30} L${x} ${y + 110}`} stroke={ink} strokeWidth={7} strokeLinecap="round" fill="none" />
            {[0, 1, 2, 3, 4].map((k) => (
              <circle key={k} cx={x + Math.cos((k / 5) * 6.283) * 20} cy={y + Math.sin((k / 5) * 6.283) * 20} r={14} />
            ))}
          </g>
        );
      })}
      {title ? (
        <text x={W / 2} y={190} textAnchor="middle" fontFamily={fonts.display} fontSize={118} letterSpacing={6} textLength={820} lengthAdjust="spacingAndGlyphs">
          {title.toUpperCase()}
        </text>
      ) : null}
      <path d={`M430 880 q40 -50 80 0 q-40 40 -80 0Z`} />
    </g>
  );
};

const RisoPlateReveal: React.FC<Props> = ({inks, arrivals, paper, surround, src, title, registration, kick, band, grain, thresholds}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const ph = portrait ? Math.min(h * 0.92, (w * 0.92 * H) / W) : h * 0.92;
  const pw = (ph * W) / H;
  const px = (w - pw) / 2;
  const py = (h - ph) / 2;
  const pid = 'rpr';
  const plates = Math.min(3, inks.length);
  const regs: [number, number][] = [[0, 0], [3, -2], [-3, 3]];

  const arrOf = (i: number) => arrivals.find((a) => a.plate === i) ?? {plate: i, at: i * 60, sweepFrames: i === 0 ? 0 : 20, from: 'left'};
  const layers = Array.from({length: plates}, (_, i) => {
    const a = arrOf(i);
    const since = frame - a.at;
    if (since < 0) return null;
    const sweeping = a.sweepFrames > 0 && since < a.sweepFrames;
    const t = a.sweepFrames > 0 ? clamp(since / a.sweepFrames) : 0;
    const e = ease.inOut(t);
    const x = -60 + (W + 260) * e; // roller position in poster units
    const fromRight = a.from === 'right';
    const sx = fromRight ? W - x : x;
    const fadeIn = a.sweepFrames > 0 ? 1 : clamp(since / 12);
    const kickK = since >= 0 && since < 9 ? Math.exp(-since / 3) * (since < 1 ? 0.6 : 1) : 0;
    const dir = i % 2 ? 1 : -1;
    const ox = (regs[i][0] * registration + dir * kick * kickK) * u;
    const oy = (regs[i][1] * registration - dir * kick * kickK * 0.5) * u;
    return {i, a, sweeping, sx, fromRight, fadeIn, ox, oy};
  });

  const content = (i: number) =>
    src ? (
      <image href={resolveSrc(src)} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" filter={`url(#${pid}-f${i})`} />
    ) : (
      <PlateArt plate={i} ink={inks[i]} title={title} pid={pid} />
    );

  return (
    <AbsoluteFill style={{background: surround}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={`${pid}-shadow`} x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx={0} dy={10 * u} stdDeviation={14 * u} floodColor="#000" floodOpacity={0.22} />
          </filter>
        </defs>
        <rect x={px} y={py} width={pw} height={ph} fill={paper} filter={`url(#${pid}-shadow)`} />
        <svg x={px} y={py} width={pw} height={ph} viewBox={`0 0 ${W} ${H}`} style={{isolation: 'isolate', overflow: 'hidden'}}>
          <defs>
            {[0, 1, 2].map((i) => (
              <React.Fragment key={i}>
            <pattern id={`${pid}-dotsA${i}`} width={16} height={16} patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
              <circle cx={8} cy={8} r={3.4} fill={inks[i]} />
            </pattern>
            <pattern id={`${pid}-dotsB${i}`} width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <circle cx={7} cy={7} r={4.4} fill={inks[i]} />
            </pattern>
              </React.Fragment>
            ))}
            <linearGradient id={`${pid}-sf`} x1={0} y1={0} x2={0} y2={1}>
              <stop offset="0" stopColor="#fff" stopOpacity={0.35} />
              <stop offset="1" stopColor="#fff" stopOpacity={1} />
            </linearGradient>
            <mask id={`${pid}-skyfade`}>
              <rect width={W} height={800} fill={`url(#${pid}-sf)`} />
            </mask>
            {Array.from({length: plates}, (_, i) => {
              const th = thresholds[i] ?? [0.58, 0.95, 0.74][i];
              const s = 3.2;
              return (
                <filter key={i} id={`${pid}-f${i}`} colorInterpolationFilters="sRGB">
                  <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.3 -0.59 -0.11 0 1" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope={s} intercept={s * (th - 1)} />
                  </feComponentTransfer>
                  <feFlood floodColor={inks[i]} result="ink" />
                  <feComposite in="ink" in2="SourceGraphic" operator="in" />
                </filter>
              );
            })}
            {layers.map((L) => {
              if (!L || !L.sweeping) return null;
              const x0 = L.fromRight ? L.sx + 6 : L.sx - 6;
              const x1 = L.fromRight ? L.sx - 6 : L.sx + 6;
              return (
                <React.Fragment key={L.i}>
                  <linearGradient id={`${pid}-g${L.i}`} gradientUnits="userSpaceOnUse" x1={x0} y1={0} x2={x1} y2={0}>
                    <stop offset="0" stopColor="#fff" />
                    <stop offset="1" stopColor="#000" />
                  </linearGradient>
                  <mask id={`${pid}-m${L.i}`}>
                    <rect width={W} height={H} fill={`url(#${pid}-g${L.i})`} />
                  </mask>
                  <linearGradient id={`${pid}-bg${L.i}`} gradientUnits="userSpaceOnUse" x1={L.sx - 70} y1={0} x2={L.sx + 70} y2={0}>
                    <stop offset="0" stopColor="#000" />
                    <stop offset="0.5" stopColor="#fff" />
                    <stop offset="1" stopColor="#000" />
                  </linearGradient>
                  <mask id={`${pid}-bm${L.i}`}>
                    <rect width={W} height={H} fill={`url(#${pid}-bg${L.i})`} />
                  </mask>
                </React.Fragment>
              );
            })}
          </defs>
          <rect width={W} height={H} fill={paper} />
          {layers.map((L) =>
            L ? (
              <g key={L.i} style={{mixBlendMode: 'multiply'}} opacity={L.fadeIn} transform={`translate(${L.ox} ${L.oy})`}>
                <g mask={L.sweeping ? `url(#${pid}-m${L.i})` : undefined}>{content(L.i)}</g>
                {L.sweeping && band > 0 ? (
                  <g mask={`url(#${pid}-bm${L.i})`} opacity={band}>
                    {content(L.i)}
                  </g>
                ) : null}
              </g>
            ) : null,
          )}
        </svg>
      </svg>
      {grain ? <PaperTexture opacity={0.22} tint={paper} /> : null}
    </AbsoluteFill>
  );
};

export const risoPlateReveal = defineMotion<Props>({
  id: 'riso-plate-reveal',
  title: 'Riso plate reveal',
  category: 'image',
  description:
    'A risograph print inked one colour at a time: first only the blue plate exists; then a roller sweeps across and the yellow plate inks in left to right with a heavier band at its edge (the blank-paper scarf lights up); later the pink plate arrives and the overprint colours appear. Registration offsets and a kick on each arrival.',
  source: ['lemo-opuscar styles/risograph demo/riso.js (uGate, uSweep, band), STYLE.md §8 "Plates as narrative" (MIT / CC BY 4.0, LemoLab); original implementation'],
  useFor: 'Brand / product reveals where a new colour is a new feature, history timelines (one ink per era), "colour returning" recoveries, zine and indie title intros. Pass `src` to print any image in three plates.',
  durationInFrames: 240,
  defaultProps: {
    inks: ['#0078BF', '#FFE800', '#FF48B0'],
    arrivals: [
      {plate: 0, at: 0, sweepFrames: 0, from: 'left'},
      {plate: 1, at: 66, sweepFrames: 20, from: 'left'},
      {plate: 2, at: 150, sweepFrames: 20, from: 'left'},
    ],
    paper: '#F3EEDF',
    surround: '#DDD6C4',
    src: '',
    title: 'Night walk',
    registration: 1,
    kick: 5,
    band: 0.45,
    grain: true,
    thresholds: [],
  },
  propDocs: {
    inks: 'plate colours in print order (up to 3)',
    arrivals: "[{plate, at, sweepFrames, from:'left'|'right'}] frame each plate arrives and how long the roller sweep takes (0 = fades in)",
    paper: 'paper colour (blank-paper areas keep it)',
    surround: 'colour around the sheet',
    src: 'optional image (public path) to print in three plates instead of the built-in poster',
    title: 'title printed in the third plate of the built-in poster',
    registration: 'plate mis-registration in px (0 = perfect)',
    kick: 'px kick of a plate on arrival',
    band: 'extra ink density of the roller edge band (0..1)',
    grain: 'paper grain texture',
    thresholds: 'image mode: per-plate darkness thresholds (0..1; defaults 0.58 / 0.95 / 0.74 for blue / yellow / pink)',
  },
  component: RisoPlateReveal,
  tags: ['risograph', 'riso', 'print', 'plates', 'overprint', 'reveal', 'roller', 'zine', 'ink', 'multiply', 'registration', 'halftone', 'poster', 'brand-reveal', 'timeline', 'image-look', 'retro', 'duotone', 'tritone'],
});
