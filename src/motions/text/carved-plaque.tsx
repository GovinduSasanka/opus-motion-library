// Adapted from lemo-opuscar/styles/shadow-puppet/demo/stage.js (plaque), DEMO.md "Title plaque" (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {Lb2Font, LampCloth, carve, fx, lf, measure, mixHex, pressLift, seg, tremor, useUid} from '../../core/r2-lb2-kit';

/**
 * A dark hide plaque with the title cut out so the letters glow with the light behind it; carved border with a meander
 * band, cloud-scroll corner roundels and a small vermilion seal with a cut glyph; carried on two thin rods, pressed
 * on to enter and lifted off to exit.
 */
type Line = {text: string; font?: Lb2Font; size?: number; weight?: number};
type Props = {
  lines: Line[];
  plaqueColor: string;
  borderColor: string;
  sealColor: string;
  seal: string;
  rods: boolean;
  enterAt: number;
  exitAt: number;
  tremor: number;
  backdrop: 'lamp' | 'color';
  backdropColor: string;
  seed: number;
};

const PW = 1180;
const PH = 380;

const CarvedPlaque: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const id = useUid('cpq');
  const k = Math.min(u * 1.3, (w * 0.9) / PW);
  const tr = tremor(frame, p.seed, p.tremor);
  const pl = pressLift(frame, p.enterAt, 17, p.exitAt >= 0 ? p.exitAt : null, 27);
  const lit = Math.min(1, seg(frame, 0, 14));

  // text block layout inside the carved border (centred, auto-fit to 860)
  const maxW = 860;
  const sized = p.lines.map((l) => {
    const fam = lf(l.font ?? 'cormorant');
    let size = l.size ?? 80;
    const wt = l.weight ?? 700;
    const mw = measure(l.text, fam, size, wt);
    if (mw > maxW) size *= maxW / mw;
    return {...l, fam, size, wt};
  });
  const totalH = sized.reduce((s, l) => s + l.size * 1.12, 0);
  let yy = PH / 2 - totalH / 2;
  const placed = sized.map((l) => {
    const y = yy + l.size * 0.86;
    yy += l.size * 1.12;
    return {...l, y};
  });

  // border carving
  const mid = PW / 2;
  const roundels = [
    [58, 58, 1],
    [PW - 58, 58, -1],
    [58, PH - 58, -1],
    [PW - 58, PH - 58, 1],
  ] as [number, number, number][];
  const sealX = PW - 120;
  const sealY = PH - 112;
  const sealS = 92;
  const sealFont = lf('mashan');

  return (
    <AbsoluteFill style={{background: p.backdropColor}}>
      <Svg>
        {p.backdrop === 'lamp' && (
          <LampCloth
            w={w}
            h={h}
            u={u}
            lamps={[
              {x: w * 0.32, y: h * 0.5},
              {x: w * 0.68, y: h * 0.5},
            ]}
            level={[lit, lit]}
            frame={frame}
            id={`${id}c`}
            weave={1}
          />
        )}
        <g transform={`translate(${fx(tr.x * u)},${fx(tr.y * u)}) rotate(${fx(tr.r, 3)} ${fx(w / 2)} ${fx(h / 2)})`}>
          <g
            opacity={pl.op}
            style={{filter: pl.blur > 0.2 ? `blur(${fx(pl.blur * u)}px)` : undefined}}
            transform={`translate(${fx(w / 2)},${fx(h / 2)}) scale(${fx(pl.scale * k, 4)}) translate(${fx(-PW / 2)},${fx(-PH / 2)})`}
          >
            <defs>
              <mask id={`${id}m`} maskUnits="userSpaceOnUse" x={-10} y={-10} width={PW + 20} height={PH + 20}>
                <rect x={-10} y={-10} width={PW + 20} height={PH + 20} fill="#fff" />
                <g fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round">
                  <rect x={22} y={22} width={PW - 44} height={PH - 44} rx={8} strokeWidth={5} />
                  <rect x={34} y={34} width={PW - 68} height={PH - 68} rx={4} strokeWidth={2} />
                  <path d={carve.meander(120, 46, PW - 120, 6)} strokeWidth={2.6} />
                  <path d={carve.meander(120, PH - 46, PW - 120, 6)} strokeWidth={2.6} />
                  {roundels.map(([x, y, d], i) => (
                    <g key={i}>
                      <circle cx={x} cy={y} r={30} strokeWidth={3.5} />
                      <path d={carve.cloud(x, y, 22, d)} strokeWidth={4} />
                    </g>
                  ))}
                  <path d={`M${mid - 60},${PH - 24} h120`} strokeWidth={2.6} />
                </g>
                {placed.map((l, i) => (
                  <text key={i} x={mid} y={l.y} textAnchor="middle" fontFamily={l.fam} fontWeight={l.wt} fontSize={l.size} letterSpacing={l.size * 0.04} fill="#000">
                    {l.text}
                  </text>
                ))}
              </mask>
              <filter id={`${id}h`} x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.035 0.05" numOctaves={3} seed={p.seed + 7} />
                <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 1.1 -0.35" />
              </filter>
            </defs>
            {/* rods carried off-screen */}
            {p.rods &&
              [PW * 0.24, PW * 0.76].map((x, i) => <rect key={i} x={x - 1.1} y={-PH * 6} width={2.2} height={PH * 6 + 14} fill="#555" opacity={0.7} />)}
            <g mask={`url(#${id}m)`}>
              <rect x={0} y={0} width={PW} height={PH} rx={16} fill={p.plaqueColor} />
              <rect x={0} y={0} width={PW} height={PH} rx={16} filter={`url(#${id}h)`} style={{mixBlendMode: 'screen'}} opacity={0.5} />
              <rect x={5} y={5} width={PW - 10} height={PH - 10} rx={12} fill="none" stroke={mixHex(p.plaqueColor, p.borderColor, 0.55)} strokeWidth={3} opacity={0.8} />
            </g>
            {/* little rod sockets */}
            {p.rods && [PW * 0.24, PW * 0.76].map((x, i) => <rect key={i} x={x - 9} y={-3} width={18} height={14} rx={3} fill={mixHex(p.plaqueColor, '#000', 0.3)} />)}
            {/* vermilion seal with a cut glyph */}
            <g transform={`rotate(-4 ${sealX} ${sealY})`}>
              <mask id={`${id}s`} maskUnits="userSpaceOnUse" x={sealX - sealS} y={sealY - sealS} width={sealS * 2} height={sealS * 2}>
                <rect x={sealX - sealS} y={sealY - sealS} width={sealS * 2} height={sealS * 2} fill="#fff" />
                <text x={sealX} y={sealY + sealS * 0.3} textAnchor="middle" fontFamily={sealFont} fontSize={sealS * 0.82} fill="#000">
                  {p.seal}
                </text>
              </mask>
              <g mask={`url(#${id}s)`}>
                <rect x={sealX - sealS / 2} y={sealY - sealS / 2} width={sealS} height={sealS} rx={9} fill={p.sealColor} />
                <rect x={sealX - sealS / 2 + 5} y={sealY - sealS / 2 + 5} width={sealS - 10} height={sealS - 10} rx={6} fill="none" stroke={mixHex(p.sealColor, '#000', 0.35)} strokeWidth={2.4} />
              </g>
            </g>
          </g>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const carvedPlaque = defineMotion<Props>({
  id: 'carved-plaque',
  title: 'Carved plaque (shadow-theatre title)',
  category: 'text',
  description:
    'A dark hide plaque with the title cut out so the letters glow with the lamp light behind; carved border with a meander band and cloud-scroll corner roundels, a vermilion seal with a cut glyph, carried on two thin rods, pressed on to enter and lifted off to exit.',
  source: ['lemo-opuscar styles/shadow-puppet demo/stage.js (plaque), DEMO.md "Title plaque" (MIT, LemoLab)'],
  useFor: 'Titles, end cards and chapter cards for heritage, myths and festivals (Lunar New Year, Diwali shadow plays), "a tale of ..." openers; works over lamp-screen or any bright backdrop.',
  durationInFrames: 150,
  defaultProps: {
    lines: [
      {text: 'A TALE OF LANTERNS', font: 'cormorant', size: 96, weight: 700},
      {text: 'a shadow play in three acts', font: 'cormorant', size: 46, weight: 600},
    ],
    plaqueColor: '#1a100a',
    borderColor: '#5a3a1c',
    sealColor: '#b3261b',
    seal: '影',
    rods: true,
    enterAt: 14,
    exitAt: 118,
    tremor: 1,
    backdrop: 'lamp',
    backdropColor: '#120805',
    seed: 6,
  },
  propDocs: {
    lines: 'title lines [{text, font (cormorant|playfair|bungee|oldItalic|gothic|...), size, weight}]',
    plaqueColor: 'hide colour',
    borderColor: 'plaque edge highlight',
    sealColor: 'seal colour (vermilion)',
    seal: 'single glyph cut into the seal',
    rods: 'show the carrying rods',
    enterAt: 'frame the plaque presses on',
    exitAt: 'frame the plaque lifts off (-1 = stays)',
    tremor: 'hand tremor strength',
    backdrop: "'lamp' (lit cloth behind) or 'color'",
    backdropColor: 'colour when backdrop = color',
    seed: 'tremor seed',
  },
  component: CarvedPlaque,
  tags: ['title', 'plaque', 'shadow puppet', 'carved', 'cut out', 'backlit', 'heritage', 'festival', 'seal', 'meander', 'chapter card', 'end card', 'lantern', 'myth'],
});
