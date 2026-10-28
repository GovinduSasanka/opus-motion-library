import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog, springAt} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {hexA, mixHex, useUid} from '../../core/r2-pr4-kit';
import {rng} from '../../core/random';
import {smoothOpen} from '../../core/shapes';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Body vessel glow: a friendly flat-vector kid in a hoodie standing in a night landscape. The camera eases in, the
 * hoodie turns see-through and a glowing pink vessel network draws on from the heart through the body (head, arms,
 * legs, seeded capillary twigs) with light pulses travelling along it; then a small element chip ("Fe") pops out of
 * the chest and floats up. Original character design; coordinates are local (feet at 0, ~444 tall).
 */
type Props = {
  background: string;
  hoodieColor: string;
  skinColor: string;
  hairColor: string;
  pantsColor: string;
  vesselColor: string;
  moonColor: string;
  chipText: string;
  chipSub: string;
  chipColor: string;
  zoom: number;
  seed: number;
};

type Pt = [number, number];
const mirror = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [-x, y]);
const HEART: Pt = [0, -262];

const MAIN: {pts: Pt[]; delay: number; w: number}[] = [
  {pts: [HEART, [2, -292], [1, -322], [0, -346]], delay: 0, w: 2.6},
  {pts: [HEART, [-24, -285], [-52, -300], [-70, -270], [-80, -225], [-86, -172], [-88, -150]], delay: 6, w: 2.4},
  {pts: mirror([HEART, [-24, -285], [-52, -300], [-70, -270], [-80, -225], [-86, -172], [-88, -150]]), delay: 8, w: 2.4},
  {pts: [HEART, [-2, -225], [-6, -190], [-22, -150], [-28, -100], [-30, -50], [-30, -22]], delay: 10, w: 2.6},
  {pts: [HEART, [2, -225], [6, -190], [22, -150], [28, -100], [30, -50], [30, -22]], delay: 12, w: 2.6},
  {pts: [HEART, [-22, -250], [-40, -228], [-46, -205]], delay: 16, w: 1.8},
  {pts: [HEART, [22, -250], [40, -228], [46, -205]], delay: 18, w: 1.8},
  {pts: [HEART, [-16, -285], [-32, -312]], delay: 20, w: 1.6},
  {pts: [HEART, [16, -285], [32, -312]], delay: 22, w: 1.6},
];

const BodyVesselGlow: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, portrait, fps} = useStage();
  const uid = useUid('bvg');

  // vessel network (main + seeded twigs)
  const vessels = React.useMemo(() => {
    const g = rng(p.seed + 9);
    const list: {d: string; delay: number; w: number; main: boolean}[] = [];
    MAIN.forEach((m, mi) => {
      list.push({d: smoothOpen(m.pts), delay: m.delay, w: m.w, main: true});
      if (m.pts.length < 5) return;
      for (let i = 2; i < m.pts.length - 1; i++) {
        const a = m.pts[i];
        const b = m.pts[i + 1];
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const L = Math.hypot(dx, dy) || 1;
        const nx = -dy / L;
        const ny = dx / L;
        for (let side = -1; side <= 1; side += 2) {
          if (g() < 0.25) continue;
          const len = 9 + g() * 12;
          const t = 0.2 + g() * 0.5;
          const sx = a[0] + dx * t;
          const sy = a[1] + dy * t;
          const mid: Pt = [sx + nx * side * len * 0.5 + dx * 0.15, sy + ny * side * len * 0.5 + dy * 0.15];
          const end: Pt = [sx + nx * side * len + dx * 0.35, sy + ny * side * len + dy * 0.35];
          list.push({d: smoothOpen([[sx, sy], mid, end]), delay: 28 + mi * 3 + i * 3 + g() * 8, w: 1.0, main: false});
        }
      }
    });
    return list;
  }, [p.seed]);

  const stars = React.useMemo(() => {
    const g = rng(p.seed + 77);
    return Array.from({length: 70}, () => ({x: g(), y: g() * 0.62, r: 0.6 + g() * 1.6, t: g() * 6.28, s: 0.5 + g()}));
  }, [p.seed]);
  const tufts = React.useMemo(() => {
    const g = rng(p.seed + 5);
    return Array.from({length: 26}, () => ({x: g(), s: 0.6 + g() * 0.9}));
  }, [p.seed]);

  // camera
  const S = portrait ? Math.min((h * 0.5) / 444, (w * 0.5) / 200) : (h * 0.68) / 444;
  const feetY = h * (portrait ? 0.8 : 0.9);
  const chestY = feetY - 262 * S;
  const e = prog(frame, 34, 92, ease.inOut);
  const Z = lerp(1, p.zoom, e);
  const anchorY = lerp(chestY, h * (portrait ? 0.46 : 0.5), e);
  const breathe = Math.sin(frame * 0.07) * 1.2;
  const fadeIn = prog(frame, 0, 20);
  const xray = prog(frame, 50, 86, ease.inOut);

  const beat = (() => {
    const ph = ((frame - 56) % 24) / 24;
    return frame < 56 ? 0 : Math.pow(Math.max(0, Math.sin(ph * Math.PI * 2 * 1.0 + 0.3)), 6);
  })();
  const heartIn = clamp(springAt(frame, fps, 56, 'pop'), 0, 1.3);
  const vcol = p.vesselColor;
  const core = mixHex(vcol, '#ffffff', 0.72);

  // chip
  const chipT = 118;
  const chipK = prog(frame, chipT, chipT + 30, ease.back);
  const chipFly = prog(frame, chipT, chipT + 30, ease.out);
  const chipPos: Pt = [lerp(0, 92, chipFly), lerp(-262, -318, chipFly) + Math.sin(frame * 0.09) * 2.5 * chipFly];
  const chipS = clamp(springAt(frame, fps, chipT, 'pop'), 0, 1.25);

  const skin = p.skinColor;
  const hood = p.hoodieColor;
  const hoodDark = mixHex(hood, '#0a1030', 0.4);

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <linearGradient id={uid + 'sky'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mixHex(p.background, '#000000', 0.25)} />
            <stop offset="0.7" stopColor={mixHex(p.background, '#2a45a0', 0.35)} />
            <stop offset="1" stopColor={mixHex(p.background, '#3d6fc0', 0.3)} />
          </linearGradient>
          <radialGradient id={uid + 'moon'}>
            <stop offset="0" stopColor={p.moonColor} stopOpacity="0.45" />
            <stop offset="1" stopColor={p.moonColor} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={uid + 'heart'}>
            <stop offset="0" stopColor={vcol} stopOpacity="0.85" />
            <stop offset="1" stopColor={vcol} stopOpacity="0" />
          </radialGradient>
          <filter id={uid + 'blur'} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={3} />
          </filter>
        </defs>

        {/* sky, moon, hills (slight parallax with zoom) */}
        <g opacity={fadeIn} transform={`translate(${cx},${h / 2}) scale(${1 + 0.06 * e}) translate(${-cx},${-h / 2})`}>
          <rect width={w} height={h} fill={`url(#${uid}sky)`} />
          {stars.map((s, i) => (
            <circle key={i} cx={s.x * w} cy={s.y * h} r={s.r * u} fill="#dce8ff" opacity={0.3 + 0.45 * (0.5 + 0.5 * Math.sin(frame * 0.05 * s.s + s.t))} />
          ))}
          <circle cx={w * (portrait ? 0.2 : 0.17)} cy={h * (portrait ? 0.13 : 0.2)} r={Math.min(w, h) * 0.2} fill={`url(#${uid}moon)`} />
          <circle cx={w * (portrait ? 0.2 : 0.17)} cy={h * (portrait ? 0.13 : 0.2)} r={Math.min(w, h) * 0.075} fill={p.moonColor} opacity={0.9} />
          <circle cx={w * (portrait ? 0.2 : 0.17) - 20 * u} cy={h * (portrait ? 0.13 : 0.2) - 16 * u} r={Math.min(w, h) * 0.045} fill="#ffffff" opacity={0.18} />
          <path d={`M0,${h * 0.74} C${w * 0.2},${h * 0.62} ${w * 0.4},${h * 0.8} ${w * 0.62},${h * 0.7} S${w * 0.9},${h * 0.62} ${w},${h * 0.7} L${w},${h} L0,${h}Z`} fill="#16406a" />
          <path d={`M0,${h * 0.82} C${w * 0.25},${h * 0.74} ${w * 0.5},${h * 0.86} ${w * 0.75},${h * 0.78} S${w * 0.95},${h * 0.78} ${w},${h * 0.8} L${w},${h} L0,${h}Z`} fill="#0f3050" />
          <rect x={0} y={feetY - 6 * u} width={w} height={h - feetY + 6 * u} fill="#0b2a3e" />
          {tufts.map((t, i) => (
            <path key={i} d={`M${t.x * w - 8 * u},${feetY + 30 * u} q ${4 * u},${-26 * u * t.s} ${8 * u},0 q ${4 * u},${-20 * u * t.s} ${8 * u},0`} fill="none" stroke="#124a55" strokeWidth={3 * u} strokeLinecap="round" />
          ))}
          {[0.06, 0.93].map((x, i) => (
            <ellipse key={i} cx={w * x} cy={feetY + 4 * u} rx={80 * u} ry={46 * u} fill="#08202f" />
          ))}
        </g>

        {/* character */}
        <g opacity={fadeIn} transform={`translate(${cx},${anchorY + breathe * 0}) scale(${S * Z}) translate(0,262)`}>
          <ellipse cx={0} cy={0} rx={92} ry={14} fill="#000000" opacity={0.3} />
          <g transform={`translate(0,${breathe * 0.4})`}>
            {/* body layers fade to see-through */}
            <g opacity={1 - 0.52 * xray}>
              {/* hood back */}
              <ellipse cx={0} cy={-344} rx={64} ry={30} fill={hoodDark} />
              {/* legs */}
              <rect x={-50} y={-182} width={46} height={158} rx={12} fill={p.pantsColor} />
              <rect x={4} y={-182} width={46} height={158} rx={12} fill={p.pantsColor} />
              <ellipse cx={-30} cy={-22} rx={32} ry={14} fill="#e9eefc" />
              <ellipse cx={30} cy={-22} rx={32} ry={14} fill="#e9eefc" />
              <rect x={-62} y={-30} width={0} height={0} />
              {/* sleeves */}
              <line x1={-58} y1={-318} x2={-84} y2={-176} stroke={hood} strokeWidth={42} strokeLinecap="round" />
              <line x1={58} y1={-318} x2={84} y2={-176} stroke={hood} strokeWidth={42} strokeLinecap="round" />
              <line x1={-82} y1={-186} x2={-84} y2={-170} stroke={hoodDark} strokeWidth={44} />
              <line x1={82} y1={-186} x2={84} y2={-170} stroke={hoodDark} strokeWidth={44} />
              {/* torso */}
              <path d="M-60,-326 Q-62,-338 -48,-340 L48,-340 Q62,-338 60,-326 L64,-190 Q64,-170 46,-170 L-46,-170 Q-64,-170 -64,-190Z" fill={hood} />
              <rect x={-38} y={-226} width={76} height={42} rx={14} fill={hoodDark} opacity={0.55} />
              <path d="M-12,-338 L-14,-290 M12,-338 L14,-290" stroke="#eaf1ff" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.8} />
            </g>
            {/* hands */}
            <circle cx={-86} cy={-150} r={16} fill={skin} />
            <circle cx={86} cy={-150} r={16} fill={skin} />
            {/* neck + head */}
            <rect x={-14} y={-352} width={28} height={26} fill={mixHex(skin, '#000000', 0.12)} />
            <ellipse cx={0} cy={-338} rx={46} ry={13} fill={hoodDark} opacity={1 - 0.52 * xray} />
            <circle cx={0} cy={-396} r={52} fill={skin} />
            <circle cx={-52} cy={-392} r={9} fill={skin} />
            <circle cx={52} cy={-392} r={9} fill={skin} />
            <path d="M-55,-398 C-60,-456 60,-456 55,-398 C42,-424 12,-418 -4,-432 C-20,-420 -40,-420 -55,-398Z" fill={p.hairColor} />
            <circle cx={-18} cy={-388} r={5.5} fill="#1a1d3a" />
            <circle cx={18} cy={-388} r={5.5} fill="#1a1d3a" />
            <circle cx={-16.5} cy={-390} r={1.8} fill="#fff" />
            <circle cx={19.5} cy={-390} r={1.8} fill="#fff" />
            <circle cx={-30} cy={-372} r={7} fill="#ff8a8a" opacity={0.35} />
            <circle cx={30} cy={-372} r={7} fill="#ff8a8a" opacity={0.35} />
            <path d="M-9,-370 Q0,-361 9,-370" stroke="#8a3a3a" strokeWidth={3} strokeLinecap="round" fill="none" />
          </g>

          {/* vessels */}
          <g transform={`translate(0,${breathe * 0.4})`}>
            {vessels.map((v, i) => {
              const t = prog(frame, 62 + v.delay, 62 + v.delay + (v.main ? 36 : 22), ease.inOut);
              if (t <= 0) return null;
              const pulse = 0.75 + 0.25 * beat;
              return (
                <g key={i} fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d={v.d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} stroke={vcol} strokeWidth={v.w * 4.2} opacity={0.2 * pulse} filter={`url(#${uid}blur)`} />
                  <path d={v.d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} stroke={vcol} strokeWidth={v.w * 1.9} opacity={0.75} />
                  <path d={v.d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} stroke={core} strokeWidth={v.w * 0.8} opacity={0.95} />
                  {v.main && t >= 1 && (
                    <path d={v.d} pathLength={1} strokeDasharray="0.05 0.95" strokeDashoffset={1 - ((frame * 0.017 + i * 0.173) % 1)} stroke="#ffffff" strokeWidth={v.w * 2.6} opacity={0.9} />
                  )}
                </g>
              );
            })}
            {/* heart */}
            {frame >= 56 && (
              <g transform={`translate(${HEART[0]},${HEART[1] + 2}) scale(${heartIn * (1 + 0.2 * beat)})`}>
                <circle r={34} fill={`url(#${uid}heart)`} opacity={0.55 + 0.4 * beat} />
                <path d="M0,10 C-17,-3 -14,-15 -6,-15 C-2,-15 0,-12 0,-10 C0,-12 2,-15 6,-15 C14,-15 17,-3 0,10Z" fill={vcol} stroke={core} strokeWidth={1.5} />
                <circle cx={-5} cy={-9} r={2.2} fill="#fff" opacity={0.8} />
              </g>
            )}
          </g>

          {/* element chip */}
          {frame >= chipT && (
            <g transform={`translate(${chipPos[0]},${chipPos[1]}) scale(${chipS * 1.0})`} opacity={chipK}>
              <circle r={30} fill={p.chipColor} opacity={0.1} />
              <rect x={-26} y={-18} width={52} height={36} rx={18} fill="#0b1030" stroke={p.chipColor} strokeWidth={2.5} />
              <text x={0} y={p.chipSub ? 3 : 9} textAnchor="middle" fontFamily={fonts.grotesk} fontWeight={700} fontSize={20} fill="#fff">
                {p.chipText}
              </text>
              {p.chipSub ? (
                <text x={0} y={14} textAnchor="middle" fontFamily={fonts.mono} fontSize={8.5} fill={hexA('#ffffff', 0.7)}>
                  {p.chipSub}
                </text>
              ) : null}
            </g>
          )}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const bodyVesselGlow = defineMotion<Props>({
  id: 'body-vessel-glow',
  title: 'Body vessel glow character',
  category: 'character',
  description:
    'A friendly flat-vector kid in a hoodie in a night landscape: the camera eases in, the hoodie turns see-through and a glowing pink vessel network draws on from the heart through head, arms and legs with light pulses, then a small element chip ("Fe") pops out of the chest.',
  source: ['analysis/sheets/r3/v3 (flat-vector "iron in your blood came from a star")'],
  useFor: 'Biology and health explainers, "what is in your body" reveals, nutrition and iron/mineral stories, science-for-kids channels, origin-of-elements intros.',
  durationInFrames: 240,
  defaultProps: {
    background: '#0a1033',
    hoodieColor: '#3a7be0',
    skinColor: '#f3b48b',
    hairColor: '#1c2040',
    pantsColor: '#222a58',
    vesselColor: '#ff4f9a',
    moonColor: '#7fe3d2',
    chipText: 'Fe',
    chipSub: '4 g',
    chipColor: '#ffb347',
    zoom: 1.55,
    seed: 3,
  },
  propDocs: {
    background: 'night sky base colour',
    hoodieColor: 'hoodie colour',
    skinColor: 'skin colour',
    hairColor: 'hair colour',
    pantsColor: 'trousers colour',
    vesselColor: 'glowing vessel colour',
    moonColor: 'moon colour',
    chipText: 'element symbol on the chip ("" hides the chip text)',
    chipSub: 'small line under the symbol (e.g. amount; "" for none)',
    chipColor: 'chip outline / glow colour',
    zoom: 'camera zoom into the torso (1 = none)',
    seed: 'capillary twigs / star field seed',
  },
  component: BodyVesselGlow,
  tags: ['character', 'body', 'blood', 'vessels', 'heart', 'hoodie', 'night', 'biology', 'iron', 'element', 'glow', 'flat vector', 'science', 'education', 'moon', 'kid'],
});
