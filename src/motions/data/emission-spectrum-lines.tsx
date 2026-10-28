import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {hexA, mixHex, useUid} from '../../core/r2-pr4-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Emission spectrum: a glowing gas-discharge tube, a slit and a prism; light fans out and a dark spectrum panel
 * draws its bright emission lines at element-specific wavelengths (H, He, Ne ...) as a scanner sweeps the nm axis.
 * Line colours are computed from the wavelength. Wavelengths are real visible-line values (rounded).
 */
type Gas = {symbol: string; name: string; tube: string; lines: number[]};
type Props = {
  title: string;
  subtitle: string;
  gases: Gas[];
  background: string;
  inkColor: string;
  minNm: number;
  maxNm: number;
  framesPer: number;
  startFrame: number;
  showLabels: boolean;
  seed: number;
};

const GASES: Gas[] = [
  {symbol: 'H', name: 'Hydrogen', tube: '#ff6fcf', lines: [410, 434, 486, 656]},
  {symbol: 'He', name: 'Helium', tube: '#ffcf7a', lines: [447, 471, 492, 502, 587, 668, 706]},
  {symbol: 'Ne', name: 'Neon', tube: '#ff7a35', lines: [585, 594, 607, 614, 640, 650, 692, 703]},
];

const hex2 = (v: number) => Math.round(clamp(v) * 255).toString(16).padStart(2, '0');
/** visible wavelength (nm) to a vivid hex colour */
const nmColor = (nm: number) => {
  let r = 0;
  let g = 0;
  let b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else { r = 1; }
  let f = 1;
  if (nm < 420) f = 0.55 + 0.45 * ((nm - 380) / 40);
  else if (nm > 700) f = 0.55 + 0.45 * ((780 - nm) / 80);
  const c = (x: number) => Math.pow(clamp(x * f), 0.8);
  return mixHex('#' + hex2(c(r)) + hex2(c(g)) + hex2(c(b)), '#ffffff', 0.12);
};

const EmissionSpectrumLines: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, portrait} = useStage();
  const PT = portrait ? 1.5 : 1;
  const uid = useUid('esl');
  const gases = p.gases.length ? p.gases : GASES;
  const n = gases.length;
  const F = Math.max(50, p.framesPer);
  const t0 = p.startFrame;
  const ink = p.inkColor;
  const tall = w < h * 1.3;

  const kRaw = Math.floor((frame - t0) / F);
  const k = clamp(kRaw, 0, n - 1);
  const f = frame - t0 - k * F;
  const live = frame >= t0;
  const g = gases[k];
  const prev = gases[Math.max(0, k - 1)];
  const tubeCol = k === 0 || f > 14 ? g.tube : mixHex(prev.tube, g.tube, prog(f, 0, 14, ease.inOut));
  const out = prog(f, F - 12, F, ease.in) * (k < n - 1 ? 1 : 0); // lines fade before the next gas
  const fadeAll = k === n - 1 ? prog(frame, t0 + n * F + 6, t0 + n * F + 22) : 0;
  const lineVis = 1 - Math.max(out, fadeAll * 0.0);

  // layout
  const y1 = h * (portrait ? 0.26 : tall ? 0.22 : 0.27);
  const beamY = y1 - 17 * u;
  const panelY = h * (portrait ? 0.5 : tall ? 0.46 : 0.5);
  const panelH = (portrait ? 330 : tall ? 190 : 190) * u;
  const px0 = w * 0.07;
  const px1 = w * 0.93;
  const xOf = (nm: number) => px0 + ((nm - p.minNm) / (p.maxNm - p.minNm)) * (px1 - px0);
  const tubeL = Math.min(330 * u, w * 0.27);
  const tubeX0 = w * 0.06;
  const tubeH = 64 * u;
  const tubeEnd = tubeX0 + tubeL;
  const prismCx = cx + (portrait ? 40 * u : 0);
  const slitX = (tubeEnd + prismCx - 90 * u) / 2 + 10 * u;
  const prismEntry: [number, number] = [prismCx - 45 * u, beamY];
  const O: [number, number] = [prismCx, y1 + 64 * u];

  const flick = 0.93 + 0.07 * Math.sin(frame * 0.9) * Math.sin(frame * 0.37);
  const tubeOn = live ? prog(f + (k > 0 ? 14 : 0), 0, 14, ease.out) : 0;
  const beamA = live ? prog(f + (k > 0 ? 10 : 0), 6, 16) : 0;

  // scan
  const scanP = prog(f, 16, 62, ease.inOut);
  const scanX = lerp(px0, px1, scanP);
  const scanning = f > 16 && f < 66 && live;

  // label stagger
  const sorted = g.lines.slice().sort((a, b) => a - b);
  const lifts = sorted.map((nm, i) => (i > 0 && xOf(nm) - xOf(sorted[i - 1]) < 44 * u ? 1 : 0));
  const lifted: number[] = [];
  sorted.forEach((nm, i) => {
    lifted.push(lifts[i] && !lifted[i - 1] ? 1 : 0);
  });

  const ticks: number[] = [];
  for (let nm = Math.ceil(p.minNm / 50) * 50; nm <= p.maxNm; nm += 50) ticks.push(nm);

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <linearGradient id={uid + 'rb'} x1="0" y1="0" x2="1" y2="0">
            {Array.from({length: 18}, (_, i) => {
              const nm = lerp(p.minNm, p.maxNm, i / 17);
              return <stop key={i} offset={i / 17} stopColor={nmColor(nm)} />;
            })}
          </linearGradient>
          <linearGradient id={uid + 'glass'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.04" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.22" />
          </linearGradient>
          <radialGradient id={uid + 'halo'}>
            <stop offset="0" stopColor={tubeCol} stopOpacity="0.55" />
            <stop offset="1" stopColor={tubeCol} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={uid + 'prism'} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#bfe0ff" stopOpacity="0.32" />
            <stop offset="1" stopColor="#7da8e0" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id={uid + 'tube'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={tubeCol} stopOpacity="0.85" />
            <stop offset="0.5" stopColor={mixHex(tubeCol, '#ffffff', 0.75)} />
            <stop offset="1" stopColor={tubeCol} stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id={uid + 'bg'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mixHex(p.background, '#000000', 0.2)} />
            <stop offset="1" stopColor={mixHex(p.background, '#1b2550', 0.35)} />
          </linearGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#${uid}bg)`} />

        {/* header */}
        <text x={px0} y={h * (portrait ? 0.07 : 0.095)} fontFamily={fonts.grotesk} fontWeight={700} fontSize={(portrait ? 46 : 48) * u} fill={ink} opacity={prog(frame, 0, 16)}>
          {p.title}
        </text>
        <text x={px0} y={h * (portrait ? 0.07 : 0.095) + 38 * u} fontFamily={fonts.mono} fontSize={21 * PT * u} fill={hexA(ink, 0.6)} opacity={prog(frame, 6, 22)}>
          {p.subtitle}
        </text>

        {/* tube */}
        <g opacity={prog(frame, 0, 12)}>
          <ellipse cx={tubeX0 + tubeL / 2} cy={beamY} rx={tubeL * 0.75} ry={tubeH * 1.7} fill={`url(#${uid}halo)`} opacity={tubeOn * flick} />
          <line x1={tubeX0 - 40 * u} y1={beamY} x2={tubeX0} y2={beamY} stroke="#6b7690" strokeWidth={5 * u} />
          <rect x={tubeX0 - 14 * u} y={beamY - tubeH * 0.62} width={30 * u} height={tubeH * 1.24} rx={8 * u} fill="#3b4558" />
          <rect x={tubeX0 + 10 * u} y={beamY - tubeH / 2} width={tubeL - 20 * u} height={tubeH} rx={tubeH / 2} fill={hexA('#9fb4d8', 0.14)} />
          <rect x={tubeX0 + 10 * u} y={beamY - tubeH / 2 + 5 * u} width={tubeL - 20 * u} height={tubeH - 10 * u} rx={tubeH / 2 - 5 * u} fill={`url(#${uid}tube)`} opacity={tubeOn * flick} />
          <rect x={tubeX0 + 10 * u} y={beamY - tubeH / 2} width={tubeL - 20 * u} height={tubeH} rx={tubeH / 2} fill={`url(#${uid}glass)`} stroke={hexA('#cfe0ff', 0.5)} strokeWidth={2 * u} />
          <rect x={tubeEnd - 16 * u} y={beamY - tubeH * 0.62} width={30 * u} height={tubeH * 1.24} rx={8 * u} fill="#3b4558" />
          <text x={tubeX0 + tubeL / 2} y={beamY + tubeH / 2 + 38 * u} textAnchor="middle" fontFamily={fonts.mono} fontSize={19 * PT * u} fill={hexA(ink, 0.6)}>
            {`GAS TUBE: ${g.name.toUpperCase()}`}
          </text>
        </g>

        {/* slit plates */}
        <g opacity={prog(frame, 4, 18)}>
          <rect x={slitX - 5 * u} y={beamY - 90 * u} width={10 * u} height={90 * u - 5 * u} rx={3 * u} fill="#3b4558" />
          <rect x={slitX - 5 * u} y={beamY + 5 * u} width={10 * u} height={90 * u} rx={3 * u} fill="#3b4558" />
        </g>

        {/* beam */}
        <g style={{mixBlendMode: 'screen'}} opacity={beamA * tubeOn * flick}>
          <line x1={tubeEnd} y1={beamY} x2={prismEntry[0]} y2={beamY} stroke={tubeCol} strokeWidth={22 * u} opacity={0.14} strokeLinecap="round" />
          <line x1={tubeEnd} y1={beamY} x2={prismEntry[0]} y2={beamY} stroke={mixHex(tubeCol, '#ffffff', 0.6)} strokeWidth={5 * u} strokeLinecap="round" />
        </g>

        {/* fan wedge + rays (drawn as the scanner reaches each line) */}
        <g style={{mixBlendMode: 'screen'}} opacity={lineVis}>
          {sorted.map((nm, i) => {
            const xi = xOf(nm);
            const a = clamp((scanX - xi) / (28 * u) + 0.0, 0, 1) * (live ? 1 : 0);
            const col = nmColor(nm);
            if (a <= 0) return null;
            return (
              <g key={i}>
                <line x1={O[0]} y1={O[1]} x2={xi} y2={panelY} stroke={col} strokeWidth={9 * u} opacity={0.1 * a} />
                <line x1={O[0]} y1={O[1]} x2={xi} y2={panelY} stroke={col} strokeWidth={2 * u} opacity={0.65 * a} />
              </g>
            );
          })}
        </g>

        {/* prism */}
        <g opacity={prog(frame, 4, 20)}>
          <polygon points={`${prismCx},${y1 - 95 * u} ${prismCx - 90 * u},${y1 + 60 * u} ${prismCx + 90 * u},${y1 + 60 * u}`} fill={`url(#${uid}prism)`} stroke={hexA('#d6e9ff', 0.75)} strokeWidth={2.5 * u} strokeLinejoin="round" />
          <line x1={prismCx - 40 * u} y1={y1 - 60 * u} x2={prismCx - 62 * u} y2={y1 - 10 * u} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={3 * u} strokeLinecap="round" />
          <circle cx={prismCx} cy={y1 + 20 * u} r={46 * u} fill={`url(#${uid}halo)`} opacity={beamA * tubeOn * 0.8} />
        </g>

        {/* spectrum panel */}
        <g opacity={prog(frame, 8, 26)}>
          <rect x={px0 - 14 * u} y={panelY - 14 * u} width={px1 - px0 + 28 * u} height={panelH + 28 * u} rx={22 * u} fill="#05070f" stroke={hexA(ink, 0.18)} strokeWidth={2 * u} />
          <rect x={px0} y={panelY} width={px1 - px0} height={panelH} rx={10 * u} fill="#020309" />
          <rect x={px0} y={panelY} width={px1 - px0} height={panelH} rx={10 * u} fill={`url(#${uid}rb)`} opacity={0.07} />
          <text x={px1 - 16 * u} y={panelY - 26 * u} textAnchor="end" fontFamily={fonts.mono} fontSize={18 * PT * u} fill={hexA(ink, 0.55)}>
            {`${g.name.toUpperCase()} EMISSION SPECTRUM`}
          </text>
          {/* lines */}
          <g opacity={lineVis} style={{mixBlendMode: 'screen'}}>
            {sorted.map((nm, i) => {
              const xi = xOf(nm);
              const a = live ? clamp((scanX - xi) / (28 * u), 0, 1) : 0;
              if (a <= 0) return null;
              const col = nmColor(nm);
              const hh = panelH * 0.7 * ease.out(a);
              const y = panelY + panelH * 0.08;
              const flash = 1 + (1 - a) * 0.8;
              return (
                <g key={i}>
                  <rect x={xi - 9 * u} y={y} width={18 * u} height={hh} rx={9 * u} fill={col} opacity={0.14 * flash} />
                  <rect x={xi - 4.5 * u} y={y} width={9 * u} height={hh} rx={4.5 * u} fill={col} opacity={0.32} />
                  <rect x={xi - 1.8 * u} y={y} width={3.6 * u} height={hh} rx={1.8 * u} fill={mixHex(col, '#ffffff', 0.5)} opacity={0.95} />
                </g>
              );
            })}
          </g>
          {/* nm labels */}
          {p.showLabels &&
            sorted.map((nm, i) => {
              const xi = xOf(nm);
              const a = live ? clamp((scanX - xi) / (28 * u) - 0.4, 0, 1) : 0;
              if (a <= 0) return null;
              return (
                <text key={i} x={xi} y={panelY + panelH - 12 * u - lifted[i] * 22 * u} textAnchor="middle" fontFamily={fonts.mono} fontSize={16 * PT * u} fill={nmColor(nm)} opacity={a * lineVis}>
                  {nm}
                </text>
              );
            })}
          {/* scanner */}
          {scanning && (
            <g>
              <rect x={scanX - 70 * u} y={panelY} width={70 * u} height={panelH} fill={hexA('#ffffff', 0.05)} />
              <rect x={scanX - 1 * u} y={panelY} width={2 * u} height={panelH} fill={hexA('#ffffff', 0.7)} />
            </g>
          )}
          {/* axis */}
          <line x1={px0} y1={panelY + panelH + 14 * u} x2={px1} y2={panelY + panelH + 14 * u} stroke={hexA(ink, 0.45)} strokeWidth={2 * u} />
          {ticks.map((nm) => (
            <g key={nm}>
              <line x1={xOf(nm)} y1={panelY + panelH + 14 * u} x2={xOf(nm)} y2={panelY + panelH + 26 * u} stroke={hexA(ink, 0.6)} strokeWidth={2 * u} />
              <text x={xOf(nm)} y={panelY + panelH + 54 * u} textAnchor="middle" fontFamily={fonts.mono} fontSize={19 * PT * u} fill={hexA(ink, 0.7)}>
                {nm}
              </text>
            </g>
          ))}
          <text x={px1} y={panelY + panelH + 86 * u} textAnchor="end" fontFamily={fonts.mono} fontSize={18 * PT * u} fill={hexA(ink, 0.5)}>
            wavelength (nm)
          </text>
        </g>

        {/* gas chips */}
        {(() => {
          const cw = 196 * u;
          const ch = 62 * u;
          const gap = 16 * u;
          const total = n * cw + (n - 1) * gap;
          const x0 = Math.max(px0, Math.min(cx - total / 2, w - px0 - total));
          const sx = total > px1 - px0 ? (px1 - px0) / total : 1;
          const yy = panelY + panelH + (portrait ? 200 : 150) * u;
          return (
            <g transform={`translate(${x0},${yy}) scale(${sx})`} opacity={prog(frame, 14, 30)}>
              {gases.map((gs, i) => {
                const act = i === k && live;
                return (
                  <g key={i} transform={`translate(${i * (cw + gap)},0)`}>
                    <rect width={cw} height={ch} rx={ch / 2} fill={act ? hexA(gs.tube, 0.18) : hexA('#ffffff', 0.04)} stroke={act ? gs.tube : hexA(ink, 0.2)} strokeWidth={2.5 * u} />
                    <circle cx={ch / 2} cy={ch / 2} r={ch * 0.3} fill={gs.tube} opacity={act ? 1 : 0.5} />
                    <text x={ch / 2} y={ch / 2 + 6 * u} textAnchor="middle" fontFamily={fonts.display} fontSize={ch * 0.28} fill="#0b1020">
                      {gs.symbol}
                    </text>
                    <text x={ch + 6 * u} y={ch / 2 + 8 * u} fontFamily={fonts.grotesk} fontWeight={700} fontSize={ch * 0.36} fill={act ? ink : hexA(ink, 0.55)}>
                      {gs.name}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })()}
      </Svg>
    </AbsoluteFill>
  );
};

export const emissionSpectrumLines = defineMotion<Props>({
  id: 'emission-spectrum-lines',
  title: 'Emission spectrum lines',
  category: 'data',
  description:
    'A glowing gas-discharge tube sends light through a slit and a prism; a dark spectrum panel with an nm axis draws bright emission lines at element-specific wavelengths (hydrogen, helium, neon) as a scanner sweeps across, then swaps to the next gas.',
  source: ['analysis/sheets/r3/v1 (krypton spectrum tube and spectrum panel)'],
  useFor: 'Physics and chemistry explainers on atomic spectra, "how we know what stars are made of", element fingerprints, astronomy intros.',
  durationInFrames: 340,
  defaultProps: {
    title: 'Atomic fingerprints',
    subtitle: 'Every element glows in its own lines',
    gases: GASES,
    background: '#0a1024',
    inkColor: '#e8eeff',
    minNm: 380,
    maxNm: 720,
    framesPer: 100,
    startFrame: 18,
    showLabels: true,
    seed: 1,
  },
  propDocs: {
    title: 'headline (top-left)',
    subtitle: 'mono sub-line',
    gases: 'gases [{symbol,name,tube (tube glow colour),lines: [wavelength nm, ...]}] one per step',
    background: 'backdrop colour',
    inkColor: 'text and axis colour',
    minNm: 'left end of the nm axis',
    maxNm: 'right end of the nm axis',
    framesPer: 'frames per gas (30 fps)',
    startFrame: 'frame the first gas lights',
    showLabels: 'print the wavelength under each line',
    seed: 'unused spare seed',
  },
  component: EmissionSpectrumLines,
  tags: ['spectrum', 'emission', 'prism', 'physics', 'chemistry', 'astronomy', 'wavelength', 'light', 'gas tube', 'hydrogen', 'neon', 'science', 'education', 'nm', 'axis'],
});
