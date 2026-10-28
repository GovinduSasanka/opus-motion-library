// Adapted from lemo-opuscar/styles/shadow-puppet/demo/gl.js + main.js (lamp compositor, exposure) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {LampCloth, Pt, back, carve, fx, h1, mixHex, pressLift, seg, tremor, useUid} from '../../core/r2-lb2-kit';

/**
 * A warm cotton screen in a lacquered stage frame (optional blurred audience heads) lit from behind by flickering oil
 * lamps; the subject layer is shown as transmitted light: dyes glow, holes shine, overlaps darken. More lamps bleach
 * the frame, snuffing steps it back to gold.
 */
type Lamp = {x: number; y: number};
type Props = {
  lamps: Lamp[];
  igniteAt: number[];
  snuffAt: number[];
  subject: 'temple' | 'lanterns' | 'none';
  src: string;
  subjectAt: number;
  stage: boolean;
  audience: boolean;
  frameColor: string;
  goldColor: string;
  dyeColor: string;
  inkColor: string;
  weave: number;
  tremor: number;
  seed: number;
};

/** pierced piece: coloured shape with holes cut out (holes = path data) */
const Piece: React.FC<{id: string; d: string; holes?: string; fill: string; ink: string; sw: number; box: {x: number; y: number; w: number; h: number}}> = ({id, d, holes, fill, ink, sw, box}) => (
  <g>
    {holes && (
      <mask id={id} maskUnits="userSpaceOnUse" x={box.x} y={box.y} width={box.w} height={box.h}>
        <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="#fff" />
        <path d={holes} fill="#000" fillRule="evenodd" />
      </mask>
    )}
    <g mask={holes ? `url(#${id})` : undefined}>
      <path d={d} fill={fill} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
    </g>
  </g>
);

const roof = (cx: number, y: number, hw: number, hh: number) =>
  `M${fx(cx - hw - 22)},${fx(y - 26)} Q${fx(cx - hw + 20)},${fx(y + 6)} ${fx(cx - hw * 0.55)},${fx(y - hh * 0.2)} L${fx(cx - hw * 0.16)},${fx(y - hh)} L${fx(cx + hw * 0.16)},${fx(y - hh)} L${fx(cx + hw * 0.55)},${fx(y - hh * 0.2)} Q${fx(cx + hw - 20)},${fx(y + 6)} ${fx(cx + hw + 22)},${fx(y - 26)} Q${fx(cx + hw)},${fx(y + hh * 0.3)} ${fx(cx + hw * 0.7)},${fx(y + hh * 0.3)} L${fx(cx - hw * 0.7)},${fx(y + hh * 0.3)} Q${fx(cx - hw)},${fx(y + hh * 0.3)} ${fx(cx - hw - 22)},${fx(y - 26)} Z`;

const LampScreen: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const id = useUid('lmp');
  const lampsPx = p.lamps.map((l) => ({x: l.x * w, y: l.y * h}));
  // per-lamp ignition level: flare overshoot on ignite, 0.35 s gutter on snuff
  const level = p.lamps.map((_, i) => {
    const ig = p.igniteAt[i] ?? 0;
    const sn = p.snuffAt[i] ?? -1;
    let lv = frame < ig ? 0 : back(seg(frame, ig, ig + 9), 3.2);
    if (sn >= 0 && frame >= sn) {
      const s = seg(frame, sn, sn + Math.round(0.35 * fps));
      const gut = 0.72 + 0.28 * (Math.sin((2 * Math.PI * 20 * (frame - sn)) / fps) > 0 ? 1 : 0.2);
      lv *= (1 - s) * (s > 0 && s < 1 ? gut : 1);
    }
    return lv;
  });

  // subject geometry in a 1000 x 640 design box, fitted into the cloth
  const bw = 1000;
  const bh = 640;
  const k = Math.min((w * (portrait ? 0.8 : 0.62)) / bw, (h * 0.58) / bh);
  const ox = w / 2 - (bw * k) / 2;
  const oy = h * 0.5 - (bh * k) / 2 + h * 0.04;
  const tr = tremor(frame, p.seed, p.tremor);
  const pl = pressLift(frame, p.subjectAt, 14, null, 20);
  const ink = p.inkColor;
  const dye = p.dyeColor;
  const sw = 2.2 / k;
  const box = {x: -40, y: -80, w: bw + 80, h: bh + 160};

  const subject = (() => {
    if (p.src) return <image href={resolveSrc(p.src)} x={0} y={0} width={bw} height={bh} preserveAspectRatio="xMidYMid meet" />;
    if (p.subject === 'none') return null;
    if (p.subject === 'lanterns') {
      return (
        <g>
          <path d={`M-40,70 Q500,20 1040,80`} fill="none" stroke={ink} strokeWidth={5} />
          {[0, 1, 2, 3, 4].map((i) => {
            const x = 110 + i * 195;
            const y = 90 + Math.sin(i * 1.7) * 20 + Math.sin(frame * 0.05 + i) * 4;
            const rr = 70 + (i % 2) * 14;
            const body = `M${x - rr},${y + 130} Q${x - rr * 1.15},${y + 190} ${x},${y + 260} Q${x + rr * 1.15},${y + 190} ${x + rr},${y + 130} Q${x + rr * 0.7},${y + 90} ${x},${y + 85} Q${x - rr * 0.7},${y + 90} ${x - rr},${y + 130} Z`;
            const centres: Pt[] = [[x, y + 175]];
            const holes = carve.coins(centres, 20) + carve.lattice(x - rr * 0.62, y + 108, rr * 1.24, 38, 14);
            return (
              <g key={i}>
                <path d={`M${x},${y + 20} V${y + 86}`} stroke={ink} strokeWidth={3} />
                <rect x={x - 26} y={y + 72} width={52} height={16} fill={ink} />
                <Piece id={`${id}l${i}`} d={body} holes={holes} fill={i % 2 ? dye : mixHex(dye, '#d98a1f', 0.55)} ink={ink} sw={sw} box={box} />
                <rect x={x - 22} y={y + 254} width={44} height={14} fill={ink} />
                <path d={`M${x},${y + 268} v${40 + (i % 3) * 18}`} stroke={ink} strokeWidth={3} />
              </g>
            );
          })}
          <Piece id={`${id}moon`} d={`M830,360 a60,60 0 1 0 0.1,0 Z`} holes={carve.scales(780, 330, 100, 70, 8)} fill={mixHex(dye, '#e8b34a', 0.5)} ink={ink} sw={sw} box={box} />
        </g>
      );
    }
    // temple: three tiers of pierced body + curved roofs, base steps, a moon and cloud slits
    const tiers = [
      {cx: 500, y: 470, hw: 270, bodyH: 130},
      {cx: 500, y: 330, hw: 200, bodyH: 110},
      {cx: 500, y: 205, hw: 135, bodyH: 90},
    ];
    return (
      <g>
        <Piece id={`${id}mn`} d={`M168,150 a70,70 0 1 0 0.1,0 Z`} holes={carve.scales(110, 100, 120, 90, 9)} fill={mixHex(dye, '#e8b34a', 0.55)} ink={ink} sw={sw} box={box} />
        {[[780, 120], [860, 190]].map(([cx, cy], i) => (
          <path key={i} d={carve.cloud(cx, cy, 36, i ? -1 : 1)} fill="none" stroke={mixHex(ink, dye, 0.35)} strokeWidth={9} strokeLinecap="round" />
        ))}
        <Piece id={`${id}bs`} d={`M140,640 L140,600 L200,600 L200,575 L800,575 L800,600 L860,600 L860,640 Z`} holes={carve.coins([[300, 610], [400, 610], [500, 610], [600, 610], [700, 610]], 12)} fill={ink} ink={ink} sw={sw} box={box} />
        {tiers.map((t, i) => (
          <g key={i}>
            <Piece id={`${id}b${i}`} d={`M${t.cx - t.hw * 0.78},${t.y} H${t.cx + t.hw * 0.78} V${t.y + t.bodyH} H${t.cx - t.hw * 0.78} Z`} holes={carve.lattice(t.cx - t.hw * 0.72, t.y + 14, t.hw * 1.44, t.bodyH - 28, 15)} fill={ink} ink={ink} sw={sw} box={box} />
            <Piece id={`${id}r${i}`} d={roof(t.cx, t.y, t.hw, 70 - i * 10)} holes={carve.scales(t.cx - t.hw * 0.6, t.y - 52 + i * 8, t.hw * 1.2, 38, 6.5)} fill={dye} ink={ink} sw={sw} box={box} />
          </g>
        ))}
        <path d={`M500,${60 - 8} V150`} stroke={ink} strokeWidth={6} />
        <path d={`M500,40 l9,30 l-9,-8 l-9,8 Z`} fill={ink} />
      </g>
    );
  })();

  // snuff smoke wisps
  const wisps = p.lamps.map((l, i) => {
    const sn = p.snuffAt[i] ?? -1;
    if (sn < 0 || frame < sn || frame > sn + 26) return null;
    const s = (frame - sn) / 26;
    const x = l.x * w + Math.sin(s * 6 + i) * 18 * u;
    const y = l.y * h - s * 150 * u;
    return <ellipse key={i} cx={x} cy={y} rx={(14 + 26 * s) * u} ry={(26 + 30 * s) * u} fill="#1a0a04" opacity={0.4 * (1 - s)} />;
  });

  const lint = h * 0.11;
  const pillar = w * (w > h ? 0.075 : 0.07);
  const fc = p.frameColor;
  const fd = mixHex(fc, '#000', 0.25);

  return (
    <AbsoluteFill style={{background: '#120805'}}>
      <Svg>
        <LampCloth w={w} h={h} u={u} lamps={lampsPx} level={level} frame={frame} id={`${id}c`} weave={p.weave} />
        {wisps}
        <g transform={`translate(${fx(tr.x * u)},${fx(tr.y * u)}) rotate(${fx(tr.r, 3)} ${fx(w / 2)} ${fx(h / 2)})`}>
          <g
            style={{mixBlendMode: 'multiply', filter: pl.blur > 0.2 ? `blur(${fx(pl.blur * u)}px)` : undefined}}
            opacity={pl.op}
            transform={`translate(${fx(w / 2)},${fx(h / 2)}) scale(${fx(pl.scale, 4)}) translate(${fx(-w / 2)},${fx(-h / 2)})`}
          >
            <g transform={`translate(${fx(ox)},${fx(oy)}) scale(${fx(k, 4)})`}>{subject}</g>
          </g>
        </g>
        {p.audience && (
          <g filter={`url(#${id}bl)`} opacity={0.9}>
            <defs>
              <filter id={`${id}bl`} x="-5%" y="-20%" width="110%" height="140%">
                <feGaussianBlur stdDeviation={7 * u} />
              </filter>
            </defs>
            {Array.from({length: 11}, (_, i) => {
              const x = (i + 0.5 + (h1(i, p.seed) - 0.5) * 0.5) * (w / 11);
              const y = h * (0.93 + h1(i + 3, p.seed) * 0.04) + Math.sin(frame * 0.04 + i * 2) * 2 * u;
              return (
                <g key={i}>
                  <ellipse cx={x} cy={y} rx={(34 + h1(i + 9, p.seed) * 14) * u} ry={(42 + h1(i + 4, p.seed) * 10) * u} fill="#050202" />
                  <ellipse cx={x} cy={y + 62 * u} rx={64 * u} ry={46 * u} fill="#050202" />
                </g>
              );
            })}
          </g>
        )}
        {p.stage && (
          <g>
            <rect x={0} y={0} width={w} height={lint} fill={fc} />
            <rect x={0} y={lint - 10 * u} width={w} height={10 * u} fill={fd} />
            <rect x={0} y={0} width={pillar} height={h} fill={fd} />
            <rect x={w - pillar} y={0} width={pillar} height={h} fill={fd} />
            <rect x={pillar - 6 * u} y={lint} width={6 * u} height={h} fill={p.goldColor} opacity={0.7} />
            <rect x={w - pillar} y={lint} width={6 * u} height={h} fill={p.goldColor} opacity={0.7} />
            <rect x={0} y={lint - 14 * u} width={w} height={3 * u} fill={p.goldColor} opacity={0.8} />
            {/* gold cloud curls along the lintel and pillars */}
            {Array.from({length: Math.round(w / (150 * u))}, (_, i) => {
              const cx = (i + 0.5) * 150 * u;
              return <path key={i} d={carve.cloud(cx, lint * 0.46, 26 * u, i % 2 ? 1 : -1)} fill="none" stroke={p.goldColor} strokeWidth={4 * u} strokeLinecap="round" opacity={0.85} />;
            })}
            {[0, 1, 2, 3].map((i) => (
              <React.Fragment key={i}>
                <path d={carve.cloud(pillar * 0.5, lint + (h - lint) * (0.14 + i * 0.22), 18 * u, 1)} fill="none" stroke={p.goldColor} strokeWidth={3 * u} opacity={0.7} />
                <path d={carve.cloud(w - pillar * 0.5, lint + (h - lint) * (0.14 + i * 0.22), 18 * u, -1)} fill="none" stroke={p.goldColor} strokeWidth={3 * u} opacity={0.7} />
              </React.Fragment>
            ))}
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const lampScreen = defineMotion<Props>({
  id: 'lamp-screen',
  title: 'Lamp screen (shadow-theatre cloth)',
  category: 'environment',
  description:
    'A warm cotton shadow-theatre screen in a lacquered stage frame (optional blurred audience heads) lit from behind by flickering oil lamps; the pierced subject is transmitted light: dyes glow, holes shine, overlaps darken. More lamps bleach the cloth, snuffing steps it back to gold.',
  source: ['lemo-opuscar styles/shadow-puppet demo/gl.js, demo/main.js (lamps, exposure), DEMO.md "Rendering constants" (MIT, LemoLab)'],
  useFor: 'The light is the world: lights switching on one by one (servers, city, a fever), folklore and heritage explainers, festival openers; turns any silhouette or icon set into a warm theatre scene.',
  durationInFrames: 150,
  defaultProps: {
    lamps: [
      {x: 0.3, y: 0.46},
      {x: 0.7, y: 0.46},
      {x: 0.5, y: 0.62},
    ],
    igniteAt: [8, 40, 66],
    snuffAt: [-1, 124, 110],
    subject: 'temple',
    src: '',
    subjectAt: 22,
    stage: true,
    audience: true,
    frameColor: '#52200e',
    goldColor: '#d9a441',
    dyeColor: '#b3261b',
    inkColor: '#2a1209',
    weave: 1,
    tremor: 1,
    seed: 3,
  },
  propDocs: {
    lamps: 'lamp positions [{x,y}] as fractions of the frame',
    igniteAt: 'frame each lamp ignites (flare overshoot)',
    snuffAt: 'frame each lamp is snuffed (-1 = never; 0.35 s gutter + smoke)',
    subject: "built-in transmission layer: 'temple', 'lanterns' or 'none'",
    src: 'optional image used as the transmission layer (dark = shadow)',
    subjectAt: 'frame the subject is pressed onto the cloth',
    stage: 'lacquered lintel, pillars and gold cloud curls',
    audience: 'blurred audience heads along the bottom',
    frameColor: 'lacquer colour',
    goldColor: 'gold curls colour',
    dyeColor: 'transparent dye colour (glows when lit)',
    inkColor: 'opaque hide colour',
    weave: 'cloth weave and blotch strength',
    tremor: 'hand tremor strength',
    seed: 'tremor / audience seed',
  },
  component: LampScreen,
  tags: ['shadow puppet', 'shadow theatre', 'lamp', 'screen', 'backlit', 'cotton cloth', 'warm', 'heritage', 'folklore', 'lights on', 'stage', 'silhouette', 'transmitted light', 'festival'],
});
