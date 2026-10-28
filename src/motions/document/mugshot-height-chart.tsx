// Adapted from lemo-opuscar/styles/halftone-dossier/demo/index.html S3 mugshot scene, halftone(), boil filter (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {DossierFilters, DossierPaper, HD, backOut, eo, halftoneD, htRadial, la2Fonts, measureA, seg, useIdA} from '../../core/r2-la2-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * "Meet the suspect": a subject stands front-on before height-chart lines with cm labels at both edges, inside a blue
 * halftone halo, holding a navy name plate (name, case no., charge with a yellow keyword). Two camera-flash frames make it
 * squint; a big stat sits on the left and a profile block on the right; the camera pushes in 1→1.05.
 */

type Props = {
  name: string;
  caseNo: string;
  charge: string;
  keyword: string;
  stat: string;
  statLabel: string;
  statKicker: string;
  profileTitle: string;
  profileLines: string[];
  profileKeyword: string;
  date: string;
  flashes: number[];
  bodyColor: string;
  haloColor: string;
  src: string;
  background: string;
  profileLabel?: string;
  photoLabel?: string;
  photoLabel2?: string;
};

/** original round hamster-ish suspect, centred on its body; open 0..1 eyes */
const Suspect: React.FC<{k: number; open: number; color: string; filter: string; t: number}> = ({k, open, color, filter, t}) => {
  const ink = HD.navy;
  const sw = 7;
  const earW = Math.sin(t * 3) * 2;
  return (
    <g transform={`scale(${k})`} filter={filter}>
      {/* ears */}
      <circle cx={-138} cy={-178 + earW} r={46} fill={color} stroke={ink} strokeWidth={sw} />
      <circle cx={-138} cy={-178 + earW} r={22} fill={HD.pink} />
      <circle cx={138} cy={-178 - earW} r={46} fill={color} stroke={ink} strokeWidth={sw} />
      <circle cx={138} cy={-178 - earW} r={22} fill={HD.pink} />
      {/* body */}
      <path d="M0 -205 C 150 -205 215 -95 215 30 C 215 165 125 230 0 230 C -125 230 -215 165 -215 30 C -215 -95 -150 -205 0 -205 Z" fill={color} stroke={ink} strokeWidth={sw} />
      <path d="M0 -30 C 95 -30 140 40 140 120 C 140 190 80 222 0 222 C -80 222 -140 190 -140 120 C -140 40 -95 -30 0 -30 Z" fill={HD.cream} />
      {/* stripes on the head */}
      {[-28, 0, 28].map((x) => (
        <path key={x} d={`M${x} -200 L${x * 0.8} -165`} stroke={HD.ored} strokeWidth={9} strokeLinecap="round" />
      ))}
      {/* eyes */}
      {open > 0.5 ? (
        <>
          <ellipse cx={-70} cy={-62} rx={24} ry={28 * open} fill={ink} />
          <ellipse cx={70} cy={-62} rx={24} ry={28 * open} fill={ink} />
          <circle cx={-62} cy={-72} r={8} fill="#fff" />
          <circle cx={78} cy={-72} r={8} fill="#fff" />
          <circle cx={-78} cy={-52} r={4} fill="#fff" />
          <circle cx={62} cy={-52} r={4} fill="#fff" />
        </>
      ) : (
        <>
          <path d="M-96 -60 L-70 -70 L-44 -60" fill="none" stroke={ink} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M44 -60 L70 -70 L96 -60" fill="none" stroke={ink} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {/* blush, nose, mouth, whiskers */}
      <ellipse cx={-110} cy={-18} rx={26} ry={14} fill={HD.pink} opacity={0.75} />
      <ellipse cx={110} cy={-18} rx={26} ry={14} fill={HD.pink} opacity={0.75} />
      <path d="M-10 -34 L10 -34 L0 -22 Z" fill={HD.pink} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M-18 -12 Q -9 0 0 -14 Q 9 0 18 -12" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
      {[-1, 1].map((sgn) => (
        <g key={sgn} stroke={ink} strokeWidth={4} strokeLinecap="round">
          <path d={`M${sgn * 150} -40 L${sgn * 205} -54`} />
          <path d={`M${sgn * 152} -24 L${sgn * 210} -22`} />
        </g>
      ))}
    </g>
  );
};

const MugshotHeightChart: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait, durationInFrames: D} = useStage();
  const id = useIdA('mhc');
  const t = frame / fps;
  // flashes: .95 → 0 over .3 s each; squint after each
  const flashA = p.flashes.reduce((m, f) => (frame >= f ? Math.max(m, 0.95 * (1 - seg(frame, f, f + 0.3 * fps))) : m), 0);
  const squint = p.flashes.some((f) => frame >= f && frame < f + 0.35 * fps);
  const blink = Math.floor(frame) % 75 > 71;
  const open = squint || blink ? 0.1 : 1;
  const push = 1 + 0.05 * eo(seg(frame, 0, D));
  // height chart lines
  const lineX0 = (portrait ? 104 : 150) * u;
  const lineX1 = w - lineX0;
  const gap = h * (portrait ? 0.075 : 0.085);
  const baseY = h * (portrait ? 0.86 : 0.85);
  const nLines = Math.floor((baseY - h * 0.1) / gap) + 1;
  // subject
  const k = u * (portrait ? 1.15 : 0.95);
  const scx = w / 2;
  const scy = h * (portrait ? 0.5 : 0.5);
  const ent = backOut(seg(t, 0.05, 0.5), 1.9);
  const subY = scy + (1 - ent) * h * 0.9 + Math.sin(t * 2.6) * 3 * u;
  const halo = halftoneD({x0: 0, y0: 0, w, h, step: 22 * u, angle: 30, maxK: 0.66, f: htRadial(scx, scy, Math.min(w, h) * (portrait ? 0.6 : 0.56), 0.9)});
  // plate
  const plateK = backOut(seg(t, 0.25, 0.65), 1.9);
  const pfs = (portrait ? 54 : 48) * u;
  const plateW = Math.max(measureA(p.name, pfs, la2Fonts.monoHeavy, 800, 0.62) + 80 * u, 460 * u);
  const plateH = pfs * 3.4;
  const plateY = scy + 205 * k + (1 - plateK) * h * 0.8;
  // side blocks
  const infoK = eo(seg(t, 0.5, 0.8));
  const infoLK = eo(seg(t, 0.6, 0.9));
  const statFs = (portrait ? 110 : 120) * u;
  const L = portrait ? {x: 70 * u, y: h * 0.13} : {x: w * 0.12, y: h * 0.3};
  const R = portrait ? {x: w * 0.55, y: h * 0.13} : {x: w * 0.69, y: h * 0.3};
  const recOn = Math.floor(t * 2) % 2 === 0;
  return (
    <AbsoluteFill style={{background: p.background}}>
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 52%'}}>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <DossierFilters id={id} frame={frame} />
          {/* height-chart lines + cm labels */}
          {Array.from({length: nLines}, (_, i) => {
            const y = baseY - i * gap;
            const major = i % 2 === 0;
            const lab = String(i * 10);
            return (
              <g key={i} opacity={eo(seg(frame, i * 1.2, i * 1.2 + 10))}>
                <line x1={lineX0} x2={lineX1} y1={y} y2={y} stroke={HD.navy} strokeWidth={(major ? 4 : 2) * u} opacity={0.45} />
                {major && (
                  <>
                    <text x={lineX0 - 14 * u} y={y + 9 * u} fontFamily={la2Fonts.monoHeavy} fontWeight={800} fontSize={(portrait ? 22 : 26) * u} fill={HD.navy} textAnchor="end" opacity={0.7}>
                      {lab}
                    </text>
                    <text x={lineX1 + 14 * u} y={y + 9 * u} fontFamily={la2Fonts.monoHeavy} fontWeight={800} fontSize={(portrait ? 22 : 26) * u} fill={HD.navy} opacity={0.7}>
                      {lab}
                    </text>
                  </>
                )}
              </g>
            );
          })}
          <text x={lineX1 + 14 * u} y={baseY - (nLines - 1) * gap - 30 * u} fontFamily={la2Fonts.monoHeavy} fontWeight={500} fontSize={22 * u} fill={HD.navy} opacity={0.6}>
            cm
          </text>
          {/* blue halftone halo (multiply) */}
          <path d={halo} fill={p.haloColor} opacity={eo(seg(t, 0.1, 0.5))} style={{mixBlendMode: 'multiply'}} />
          {/* subject */}
          {!p.src && (
            <g transform={`translate(${scx} ${subY})`}>
              <Suspect k={k} open={open} color={p.bodyColor} filter={`url(#${id}-boil)`} t={t} />
            </g>
          )}
          {/* name plate + paws */}
          <g transform={`translate(${scx} ${plateY}) rotate(-1.5)`}>
            <rect x={-plateW / 2} y={-plateH / 2} width={plateW} height={plateH} rx={10 * u} fill={HD.navy} />
            <text x={0} y={-plateH * 0.12} fontFamily={la2Fonts.monoHeavy} fontWeight={800} fontSize={pfs} fill={HD.cream} textAnchor="middle">
              {p.name}
            </text>
            <text x={0} y={plateH * 0.16} fontFamily={la2Fonts.monoHeavy} fontWeight={800} fontSize={pfs * 0.5} fill={HD.cream} textAnchor="middle" opacity={0.85}>
              {p.caseNo}
            </text>
            <text x={0} y={plateH * 0.4} fontFamily={la2Fonts.barlow} fontWeight={700} fontSize={pfs * 0.58} fill={HD.cream} textAnchor="middle">
              {p.charge} <tspan fill={HD.yellow}>{p.keyword}</tspan>
            </text>
            {!p.src && (
              <g filter={`url(#${id}-boil)`}>
                {[-1, 1].map((sg) => (
                  <g key={sg}>
                    <ellipse cx={sg * (plateW / 2 - 40 * u)} cy={-plateH / 2} rx={36 * u} ry={24 * u} fill={HD.cream} stroke={HD.navy} strokeWidth={7 * u} />
                    <path d={`M${sg * (plateW / 2 - 40 * u) - 10 * u} ${-plateH / 2 - 10 * u} l0 ${16 * u} M${sg * (plateW / 2 - 40 * u) + 10 * u} ${-plateH / 2 - 10 * u} l0 ${16 * u}`} stroke={HD.navy} strokeWidth={4 * u} strokeLinecap="round" />
                  </g>
                ))}
              </g>
            )}
          </g>
          {/* left stat block */}
          <g opacity={infoLK} transform={`translate(${-30 * u * (1 - infoLK)} 0)`}>
            <text x={L.x} y={L.y} fontFamily={la2Fonts.monoHeavy} fontWeight={800} fontSize={26 * u} fill={HD.pink}>
              {p.statKicker}
            </text>
            <text x={L.x} y={L.y + statFs * 0.95} fontFamily={la2Fonts.bagel} fontSize={statFs} fill={HD.navy}>
              {p.stat}
            </text>
            <text x={L.x + 4 * u} y={L.y + statFs * 0.95 + 52 * u} fontFamily={la2Fonts.barlow} fontWeight={700} fontSize={32 * u} fill={HD.navy}>
              {p.statLabel}
            </text>
          </g>
          {/* right profile block */}
          <g opacity={infoK} transform={`translate(${30 * u * (1 - infoK)} 0)`}>
            <text x={R.x} y={R.y} fontFamily={la2Fonts.monoHeavy} fontWeight={800} fontSize={24 * u} fill={HD.pink}>
              {p.profileLabel}
            </text>
            <text x={R.x} y={R.y + 66 * u} fontFamily={la2Fonts.slab} fontSize={(portrait ? 46 : 56) * u} fill={HD.navy}>
              {p.profileTitle}
            </text>
            {p.profileLines.map((ln, i) => (
              <text key={i} x={R.x} y={R.y + 122 * u + i * 48 * u} fontFamily={la2Fonts.barlow} fontWeight={700} fontSize={(portrait ? 30 : 34) * u} fill={HD.navy}>
                {ln}
                {i === p.profileLines.length - 1 && p.profileKeyword && <tspan fill={HD.pink}> {p.profileKeyword}</tspan>}
              </text>
            ))}
          </g>
          {/* case tag + date box */}
          <g>
            <text x={74 * u} y={74 * u} fontFamily={la2Fonts.monoHeavy} fontWeight={800} fontSize={24 * u} fill={HD.navy}>
              {p.caseNo}
            </text>
            <rect x={74 * u} y={90 * u} width={210 * u} height={40 * u} rx={6 * u} fill={HD.navy} />
            <text x={88 * u} y={118 * u} fontFamily={la2Fonts.monoHeavy} fontWeight={800} fontSize={22 * u} fill={HD.yellow}>
              {p.photoLabel} <tspan fill={HD.cream}>{p.photoLabel2}</tspan>
            </text>
            <rect x={w - 254 * u} y={52 * u} width={180 * u} height={52 * u} rx={8 * u} fill="none" stroke={HD.navy} strokeWidth={4 * u} />
            <circle cx={w - 228 * u} cy={78 * u} r={9 * u} fill={HD.red} opacity={recOn ? 1 : 0.25} />
            <text x={w - 210 * u} y={88 * u} fontFamily={la2Fonts.monoHeavy} fontWeight={800} fontSize={28 * u} fill={HD.navy}>
              {p.date}
            </text>
          </g>
        </svg>
        {p.src && (
          <div style={{position: 'absolute', left: scx - 210 * k, top: subY - 230 * k, width: 420 * k, height: 460 * k, borderRadius: 200 * k, overflow: 'hidden', border: `${7 * k}px solid ${HD.navy}`}}>
            <Img src={resolveSrc(p.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
        )}
      </AbsoluteFill>
      <DossierPaper w={w} h={h} frame={frame} u={u} />
      {flashA > 0.005 && <AbsoluteFill style={{background: '#FFFFFF', opacity: flashA}} />}
    </AbsoluteFill>
  );
};

export const mugshotHeightChart = defineMotion<Props>({
  id: 'mugshot-height-chart',
  title: 'Mugshot height chart',
  category: 'document',
  description:
    'A round kawaii suspect rises in front of a height chart with cm labels at both edges, inside a blue halftone halo, holding a navy name plate (name, case no., charge); two camera flashes make it squint, a big "99+" stat and a profile block slide in on the sides, on mottled archive paper with a slow push-in.',
  source: ['lemo-opuscar styles/halftone-dossier (MIT, LemoLab) — demo/index.html S3 mugshot, halftone(), boil filter; poster.jpg'],
  useFor: '"Meet the suspect" intros with humour — a new feature, a bug, a species, a product, a team member; pass `src` for a photo.',
  durationInFrames: 150,
  defaultProps: {
    name: 'NIBBLES, H.',
    caseNo: 'CASE No.2026-NW-001',
    charge: 'Charge:',
    keyword: 'snack theft',
    stat: '99+',
    statLabel: 'counts · no regrets',
    statKicker: 'PRIORS',
    profileTitle: 'Nibbles',
    profileLines: ['Golden · 140 g', 'Speciality:'],
    profileKeyword: 'cheek storage',
    date: '2026.10',
    flashes: [30, 60],
    bodyColor: HD.orange,
    haloColor: HD.blue,
    src: '',
    background: HD.paper,
    profileLabel: 'PROFILE',
    photoLabel: 'SUSPECT',
    photoLabel2: 'PHOTO',
  },
  propDocs: {
    name: 'name on the plate (mono caps)',
    caseNo: 'case number (plate + top-left)',
    charge: 'charge prefix on the plate',
    keyword: 'yellow charge keyword',
    stat: 'big stat on the left',
    statLabel: 'line under the stat',
    statKicker: 'pink kicker above the stat',
    profileTitle: 'profile name (right block)',
    profileLines: 'profile lines; the keyword is appended to the last one in pink',
    profileKeyword: 'pink keyword at the end of the profile',
    date: 'date in the REC box',
    flashes: 'frames of camera flashes (.95 → 0 over .3 s; the subject squints)',
    bodyColor: 'suspect body colour',
    haloColor: 'halftone halo ink',
    src: 'optional public/ photo shown in a rounded cut-out instead of the drawn suspect',
    background: 'paper colour',
    profileLabel: 'heading on the profile side plate',
    photoLabel: 'first (yellow) word of the front-plate caption',
    photoLabel2: 'second (cream) word of the front-plate caption',
  },
  component: MugshotHeightChart,
  tags: ['mugshot', 'suspect', 'height chart', 'police', 'lineup', 'dossier', 'case file', 'halftone', 'ben-day', 'print', 'kawaii', 'character', 'intro', 'profile', 'humour', 'flash', 'retro'],
});
