// Ideas from lemo-opuscar/styles/hd-2d STYLE.md §5/§8 + DEMO.md (brazier taper -> lantern) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {backOut, cl, mixC, seg} from '../../core/r2-la3-kit';
import {shadowPoints} from '../../core/r2-la3b-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  switchAt: number;
  source: string;
  warm: string;
  cold: string;
  strength: number;
  figures: number;
  floorColor: string;
  wallColor: string;
};

const SOURCES: Record<string, {color: string; label: string}> = {
  lantern: {color: '#FFAE4A', label: 'lantern'},
  lamp: {color: '#FFCB7A', label: 'lamp'},
  screen: {color: '#9ED6FF', label: 'screen'},
};

const flick = (t: number) => 1 + 0.2 * (0.5 * Math.sin(13 * t) + 0.3 * Math.sin(7.1 * t) + 0.2 * Math.sin(23 * t));

type Fig = {x: number; scale: number; coat: string; pants: string; skin: string; hair: string; scarf: string; face: number};

const PracticalLightShadowJump: React.FC<Props> = ({switchAt, source, warm, cold, strength, figures, floorColor, wallColor}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame / 30;
  const src = SOURCES[source] ?? SOURCES.lantern;
  const lightCol = source === 'screen' ? src.color : warm || src.color;

  // ignition: 0 -> 1 over ~.3 s with a flicker overshoot, then settles
  const x = seg(frame, switchAt, switchAt + 9);
  const lvlRaw = frame < switchAt ? 0 : backOut(x, 2.6);
  const level = cl(lvlRaw, 0, 1.25);
  const settle = frame > switchAt + 9 && source !== 'screen' ? flick(t) : 1;
  const inten = Math.pow(cl(level, 0, 1.3), 1.3) * strength * settle;
  const lvl01 = cl(level);

  const floorY = h * (portrait ? 0.74 : 0.7);
  const horizon = floorY - (portrait ? h * 0.22 : h * 0.3);
  const lx = w * 0.5 + Math.sin(t * 2.1) * 1.5 * u * (frame > switchAt ? 1 : 0);
  const ly = floorY + 18 * u;
  const lightZ = 62 * u;
  const lightH = 900 * u + (300 * u - 900 * u) * lvl01; // light "drops" into place so shadows swing out from the feet
  const S = u * (portrait ? 1.05 : 1.4);
  const gap = (portrait ? 185 : 300) * u;

  const figs: Fig[] = [
    {x: lx - gap, scale: 1, coat: '#5B6FA8', pants: '#33395E', skin: '#E9B994', hair: '#3A2A22', scarf: '#E26B4F', face: 1},
    {x: lx + gap * 0.95, scale: 1.12, coat: '#8E5A74', pants: '#2F2D48', skin: '#C58E69', hair: '#1D1822', scarf: '#F2C14E', face: -1},
  ].slice(0, Math.max(1, Math.min(2, figures)));

  const prof: [number, number][] = [[12, 0.5], [12, 72], [22, 74], [22, 150], [15, 152], [15, 188], [6, 200]];
  const bgDark = mixC(wallColor, cold, 0.4);
  const alphaDark = 0.8 - 0.35 * lvl01;
  const glow = cl(inten, 0, 1.2);

  return (
    <AbsoluteFill style={{background: bgDark, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="pls-dark" gradientUnits="userSpaceOnUse" cx={lx} cy={ly - lightZ} r={Math.max(w, h) * 0.8}>
            <stop offset="0" stopColor={cold} stopOpacity={cl(alphaDark * (1 - lvl01 * 0.95), 0, 1)} />
            <stop offset="0.35" stopColor={cold} stopOpacity={cl(alphaDark * (1 - lvl01 * 0.55), 0, 1)} />
            <stop offset="1" stopColor={cold} stopOpacity={alphaDark} />
          </radialGradient>
          <radialGradient id="pls-glow" gradientUnits="userSpaceOnUse" cx={lx} cy={ly - lightZ} r={(portrait ? 520 : 620) * u}>
            <stop offset="0" stopColor={lightCol} stopOpacity={cl(0.85 * glow, 0, 1)} />
            <stop offset="0.3" stopColor={lightCol} stopOpacity={cl(0.38 * glow, 0, 1)} />
            <stop offset="1" stopColor={lightCol} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="pls-halo" gradientUnits="userSpaceOnUse" cx={lx} cy={ly - lightZ} r={70 * u * (0.6 + glow * 0.6)}>
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={cl(0.95 * glow, 0, 1)} />
            <stop offset="1" stopColor={lightCol} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pls-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mixC(floorColor, '#000', 0.2)} />
            <stop offset="1" stopColor={floorColor} />
          </linearGradient>
          <pattern id="pls-planks" width={140 * u} height={50 * u} patternUnits="userSpaceOnUse">
            <path d={`M0 0H${140 * u}M${70 * u} 0V${50 * u}`} stroke="#000" strokeOpacity="0.28" strokeWidth={2.4 * u} />
          </pattern>
          <pattern id="pls-paper" width={60 * u} height={60 * u} patternUnits="userSpaceOnUse">
            <path d={`M${30 * u} ${8 * u}l${8 * u} ${14 * u}h${-16 * u}z`} fill="#000" fillOpacity="0.07" />
            <path d={`M0 ${38 * u}l${8 * u} ${14 * u}h${-16 * u}zM${60 * u} ${38 * u}l${8 * u} ${14 * u}h${-16 * u}z`} fill="#000" fillOpacity="0.07" />
          </pattern>
        </defs>

        {/* room */}
        <rect width={w} height={horizon} fill={wallColor} />
        <rect width={w} height={horizon} fill="url(#pls-paper)" />
        <rect y={horizon - 12 * u} width={w} height={14 * u} fill={mixC(wallColor, '#000', 0.35)} />
        <rect y={horizon} width={w} height={h - horizon} fill="url(#pls-floor)" />
        <rect y={horizon} width={w} height={h - horizon} fill="url(#pls-planks)" />
        {/* moonlit window (the cold source) */}
        <g opacity={0.9 - 0.4 * lvl01}>
          <rect x={w * (portrait ? 0.1 : 0.14)} y={horizon * 0.22} width={110 * u} height={150 * u} fill="#9DB7E6" />
          <path d={`M${w * (portrait ? 0.1 : 0.14) + 55 * u} ${horizon * 0.22}V${horizon * 0.22 + 150 * u}M${w * (portrait ? 0.1 : 0.14)} ${horizon * 0.22 + 75 * u}h${110 * u}`} stroke={wallColor} strokeWidth={7 * u} />
        </g>
        <g>
          <rect x={w * (portrait ? 0.68 : 0.74)} y={horizon * 0.3} width={120 * u} height={92 * u} fill={mixC(wallColor, '#F2C14E', 0.35)} stroke={mixC(wallColor, '#000', 0.4)} strokeWidth={6 * u} />
          <circle cx={w * (portrait ? 0.68 : 0.74) + 60 * u} cy={horizon * 0.3 + 46 * u} r={22 * u} fill={mixC(wallColor, '#E26B4F', 0.5)} />
        </g>

        {/* shadows on the floor (they swing out from the feet as the light drops in) */}
        {figs.map((f, i) => (
          <polygon
            key={i}
            points={shadowPoints({x: lx, y: ly, h: lightH}, {x: f.x, y: floorY + (i === 0 ? 70 : -6) * u}, prof.map(([a, z]) => [a * S * f.scale, z * S * f.scale] as [number, number]), 0.5, 16 * S)}
            fill="#0B0618"
            opacity={cl(0.62 * lvl01 * (0.6 + 0.4 * glow))}
          />
        ))}
        <ellipse cx={lx} cy={ly + 24 * u} rx={92 * u} ry={20 * u} fill="#0B0618" opacity={0.4 * lvl01} />

        {/* crate + fixture */}
        <g>
          <rect x={lx - 60 * u} y={ly - 6 * u} width={120 * u} height={60 * u} fill="#6E4B32" />
          <rect x={lx - 60 * u} y={ly - 6 * u} width={120 * u} height={12 * u} fill="#8A6040" />
          <path d={`M${lx - 60 * u} ${ly + 22 * u}H${lx + 60 * u}M${lx} ${ly + 6 * u}V${ly + 54 * u}`} stroke="#3F2A1C" strokeWidth={4 * u} />
          {source === 'screen' ? (
            <g>
              <rect x={lx - 52 * u} y={ly - 82 * u} width={104 * u} height={74 * u} rx={5 * u} fill="#1A1F2B" />
              <rect x={lx - 46 * u} y={ly - 76 * u} width={92 * u} height={62 * u} fill={mixC('#202838', src.color, cl(inten))} />
              <rect x={lx - 8 * u} y={ly - 8 * u} width={16 * u} height={6 * u} fill="#1A1F2B" />
            </g>
          ) : source === 'lamp' ? (
            <g>
              <rect x={lx - 5 * u} y={ly - 40 * u} width={10 * u} height={36 * u} fill="#3A2C2C" />
              <path d={`M${lx - 36 * u} ${ly - 36 * u}L${lx - 20 * u} ${ly - 80 * u}H${lx + 20 * u}L${lx + 36 * u} ${ly - 36 * u}Z`} fill={mixC('#8A7A6A', lightCol, cl(inten))} stroke="#2B2024" strokeWidth={3 * u} />
            </g>
          ) : (
            <g>
              <path d={`M${lx - 14 * u} ${ly - 6 * u}h${28 * u}v${-4 * u}h${-28 * u}z`} fill="#2A2228" />
              <rect x={lx - 12 * u} y={ly - 50 * u} width={24 * u} height={40 * u} fill={mixC('#3C3A3E', '#FFE2A8', cl(inten))} stroke="#2A2228" strokeWidth={3 * u} />
              <path d={`M${lx - 16 * u} ${ly - 50 * u}h${32 * u}l${-6 * u} ${-10 * u}h${-20 * u}z`} fill="#2A2228" />
              <path d={`M${lx - 7 * u} ${ly - 56 * u}a${7 * u} ${7 * u} 0 0 1 ${14 * u} 0`} fill="none" stroke="#2A2228" strokeWidth={3 * u} />
              <ellipse cx={lx} cy={ly - 28 * u} rx={5 * u * (0.5 + glow * 0.6)} ry={11 * u * (0.5 + glow * 0.7 * (settle > 0 ? settle : 1))} fill="#FFF6D8" opacity={cl(glow)} />
            </g>
          )}
        </g>

        {/* figures */}
        {figs.map((f, i) => {
          const fy = floorY + (i === 0 ? 70 : -6) * u;
          const sc = S * f.scale;
          const breathe = Math.sin(t * 2.2 + i * 1.7) * 1.6 * sc;
          const look = lvl01 > 0.1 ? f.face : 0; // they turn toward the light once it is on
          const hx = look * 6 * sc;
          return (
            <g key={i} transform={`translate(${f.x} ${fy})`}>
              <ellipse cx={0} cy={2 * sc} rx={30 * sc} ry={8 * sc} fill="#0B0618" opacity={0.35 * (1 - lvl01 * 0.5)} />
              <rect x={-17 * sc} y={-72 * sc} width={13 * sc} height={72 * sc} rx={5 * sc} fill={f.pants} />
              <rect x={4 * sc} y={-72 * sc} width={13 * sc} height={72 * sc} rx={5 * sc} fill={f.pants} />
              <rect x={-20 * sc} y={-6 * sc} width={18 * sc} height={8 * sc} rx={3 * sc} fill="#1C1620" />
              <rect x={2 * sc} y={-6 * sc} width={18 * sc} height={8 * sc} rx={3 * sc} fill="#1C1620" />
              <g transform={`translate(0 ${breathe})`}>
                <rect x={-24 * sc} y={-152 * sc} width={48 * sc} height={84 * sc} rx={16 * sc} fill={f.coat} />
                <rect x={-30 * sc} y={-148 * sc} width={12 * sc} height={64 * sc} rx={6 * sc} fill={f.coat} />
                <rect x={18 * sc} y={-148 * sc} width={12 * sc} height={64 * sc} rx={6 * sc} fill={f.coat} />
                <circle cx={-24 * sc} cy={-82 * sc} r={6 * sc} fill={f.skin} />
                <circle cx={24 * sc} cy={-82 * sc} r={6 * sc} fill={f.skin} />
                <rect x={-20 * sc} y={-160 * sc} width={40 * sc} height={12 * sc} rx={6 * sc} fill={f.scarf} />
                <circle cx={hx} cy={-176 * sc} r={17 * sc} fill={f.skin} />
                <path d={`M${hx - 18 * sc} ${-178 * sc}a${18 * sc} ${18 * sc} 0 0 1 ${36 * sc} 0z`} fill={f.hair} />
                {look !== 0 && <circle cx={hx + look * 7 * sc} cy={-174 * sc} r={2 * sc} fill="#1E1A26" />}
                {look === 0 && (
                  <>
                    <circle cx={hx - 6 * sc} cy={-174 * sc} r={2 * sc} fill="#1E1A26" />
                    <circle cx={hx + 6 * sc} cy={-174 * sc} r={2 * sc} fill="#1E1A26" />
                  </>
                )}
              </g>
            </g>
          );
        })}

        {/* mood: cold darkness lifts, warm glow blooms */}
        <rect width={w} height={h} fill="url(#pls-dark)" style={{mixBlendMode: 'multiply'}} />
        <rect width={w} height={h} fill="url(#pls-glow)" style={{mixBlendMode: 'screen'}} />
        <circle cx={lx} cy={ly - lightZ} r={70 * u * (0.6 + glow * 0.6)} fill="url(#pls-halo)" style={{mixBlendMode: 'screen'}} />
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 60%, rgba(4,3,14,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

export const practicalLightShadowJump = defineMotion<Props>({
  id: 'practical-light-shadow-jump',
  title: 'Practical light shadow jump',
  category: 'fx',
  description:
    'A cold, dim room with two figures beside an unlit lantern. On the switch-on beat the light ignites (0 to 1 in ~.3 s with a flicker overshoot), the glow blooms, the figures turn toward it and their shadows swing out across the floor from their feet while the mood flips from cold blue to warm. Source can be lantern, lamp or screen.',
  source: ['lemo-opuscar styles/hd-2d STYLE.md §5/§8, DEMO.md (MIT, LemoLab)', 'lemo-styles-a hd-2d: practical-light-shadow-jump'],
  useFor: '"Switching on" moments: product power-on, store opening, an idea lighting up, a story turning from dark to hopeful.',
  durationInFrames: 150,
  defaultProps: {switchAt: 42, source: 'lantern', warm: '#FFAE4A', cold: '#1B2552', strength: 1, figures: 2, floorColor: '#5A4A56', wallColor: '#6E6288'},
  propDocs: {
    switchAt: 'frame the light ignites',
    source: 'lantern | lamp | screen',
    warm: 'light colour (ignored for screen, which is cool white-blue)',
    cold: 'colour of the unlit room darkness',
    strength: 'overall light intensity 0.6–1.3',
    figures: 'one or two characters',
    floorColor: 'floor colour',
    wallColor: 'wall colour',
  },
  component: PracticalLightShadowJump,
  tags: ['light switch', 'power on', 'lantern', 'shadows', 'glow', 'mood', 'cold to warm', 'ignite', 'lamp', 'screen', 'night', 'reveal', 'idea', 'opening'],
});
