// Adapted from lemo-opuscar/styles/halftone-dossier/demo/index.html halftone(), radial(), charge-card scene, caption() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {DossierFilters, DossierPaper, HD, backOut, measureA, clamp01, eo, halftoneD, htRadial, la2Fonts, seg, squashA, useIdA} from '../../core/r2-la2-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Print-dossier exhibit card: a giant rounded numeral bleeds off the right edge, filled with a flat spot ink and overprinted
 * with a darker Ben-Day halftone clipped to the glyph; it rises in with a back-ease behind the exhibit (an evidence tag or
 * your `src` image), while a misregistered slab headline drops in letter by letter and a navy caption pill pops.
 */

type Props = {
  numeral: string;
  headline: string;
  caseLine: string;
  tag: string;
  caption: string;
  keyword: string;
  numeralColor: string;
  dotColor: string;
  shadowColor: string;
  src: string;
  background: string;
  exhibitLabel: string;
};

const HalftoneExhibitNumeral: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait, durationInFrames: D} = useStage();
  const id = useIdA('hen');
  const t = frame / fps;
  // numeral geometry (Bagel Fat One ≈ .62 em per digit)
  const nfs = Math.min(h * (portrait ? 0.46 : 0.7), (w * (portrait ? 0.98 : 0.6)) / (0.62 * Math.max(1, p.numeral.length)));
  const nx = w + nfs * 0.06;
  const nyBase = portrait ? h * 0.86 : h * 0.84;
  const ent = backOut(seg(t, 0.15, 0.6), 1.9);
  const ny = nyBase + (1 - ent) * h * 0.9;
  const breathe = 1 + 0.012 * Math.sin(t * 2.2);
  const top = nyBase - nfs * 0.78;
  const hd = halftoneD({x0: w - nfs * 0.68 * p.numeral.length - 40 * u, y0: top - 20 * u, w: nfs * 0.68 * p.numeral.length + 80 * u, h: nfs * 1.0, step: 21 * u, angle: 25, maxK: 0.7, f: (_x, y) => 0.25 + 0.75 * clamp01((y - top) / (nfs * 0.85))});
  const pinkDots = halftoneD({x0: 0, y0: h * 0.45, w: w * 0.5, h: h * 0.55, step: 22 * u, angle: 70, maxK: 0.6, f: htRadial(0, h, Math.min(w, h) * 0.5, 1.2)});
  // headline: letters fall 700 px in .2 s, one per 8th (.25 s at 120 BPM → use .08 s for a punchy card)
  const hfs0 = (portrait ? 120 : 132) * u;
  const hw0 = measureA(p.headline, hfs0, la2Fonts.slab, 400, 0.72);
  const hfs = Math.min(hfs0, (hfs0 * w * (portrait ? 0.86 : 0.52)) / Math.max(1, hw0));
  const hx = (portrait ? 70 : 120) * u;
  const hy = (portrait ? 0.24 : 0.36) * h;
  const letters = [...p.headline].map((ch, i) => {
    const t0 = 0.35 + i * 0.06;
    const k = seg(t, t0, t0 + 0.2);
    const yy = (1 - k * k) * -700 * u;
    const sq = squashA(t - (t0 + 0.2), 0.22);
    const op = t >= t0 ? 1 : 0;
    return {ch, yy, sq, op};
  });
  // exhibit (tag) pops in with squash
  const exA = backOut(seg(t, 0.75, 1.15), 1.9);
  const exSq = squashA(t - 1.15, 0.2);
  const ex = {x: portrait ? w * 0.42 : w * 0.66, y: portrait ? h * 0.64 : h * 0.56, s: u * (portrait ? 1.1 : 1.15)};
  const swing = Math.sin(t * 1.8) * 4;
  // caption pill
  const capK = seg(t, 1.3, 1.7);
  const capFs = (portrait ? 38 : 40) * u;
  const capText = p.caption.replace(p.keyword, '\u0000');
  const [capA, capB] = capText.split('\u0000');
  const capW = Math.min(w - 60 * u, measureA(p.caption, capFs, la2Fonts.barlow, 700, 0.52) + 2.4 * capFs);
  const capY = portrait ? h * 0.93 : h * 0.9;
  // case tag top-left
  const tagK = eo(seg(t, 0.1, 0.4));
  const push = 1 + 0.04 * (frame / D);
  const exit = 1 - seg(frame, D - 6, D);
  return (
    <AbsoluteFill style={{background: p.background}}>
      <AbsoluteFill style={{transform: `scale(${push})`, opacity: exit}}>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <DossierFilters id={id} frame={frame} />
          <defs>
            <clipPath id={`${id}num`}>
              <text x={nx} y={ny} fontFamily={la2Fonts.bagel} fontSize={nfs} textAnchor="end">
                {p.numeral}
              </text>
            </clipPath>
          </defs>
          {/* pink halftone corner (multiply) */}
          <path d={pinkDots} fill={HD.pink} opacity={0.85 * eo(seg(t, 0.2, 0.7))} style={{mixBlendMode: 'multiply'}} />
          {/* giant numeral: flat ink + clipped halftone */}
          <g transform={`translate(${nx} ${nyBase}) scale(${breathe}) translate(${-nx} ${-nyBase})`}>
            <text x={nx} y={ny} fontFamily={la2Fonts.bagel} fontSize={nfs} fill={p.numeralColor} textAnchor="end">
              {p.numeral}
            </text>
            <g clipPath={`url(#${id}num)`}>
              <path d={hd} fill={p.dotColor} transform={`translate(0 ${ny - nyBase})`} />
            </g>
          </g>
          {/* case tag */}
          <g opacity={tagK} transform={`translate(${(1 - tagK) * -30 * u} 0)`}>
            <text x={60 * u} y={62 * u} fontFamily={la2Fonts.monoHeavy} fontWeight={800} fontSize={24 * u} fill={HD.navy}>
              {p.caseLine}
            </text>
            <rect x={60 * u} y={78 * u} width={(p.tag.length * 0.62 + 1.2) * 24 * u} height={40 * u} rx={6 * u} fill={HD.navy} />
            <text x={74 * u} y={106 * u} fontFamily={la2Fonts.monoHeavy} fontWeight={800} fontSize={24 * u} fill={HD.yellow}>
              {p.tag}
            </text>
          </g>
          {/* misregistered headline */}
          <g>
            {(() => {
              let cx = hx;
              return letters.map((L, i) => {
                const x = hx + measureA(p.headline.slice(0, i), hfs, la2Fonts.slab, 400, 0.72);
                void cx;
                if (!L.op) return null;
                return (
                  <g key={i} transform={`translate(${x} ${hy + L.yy}) scale(${1 / L.sq} ${L.sq})`}>
                    <text x={8 * u} y={8 * u} fontFamily={la2Fonts.slab} fontSize={hfs} fill={p.shadowColor} style={{mixBlendMode: 'multiply'}}>
                      {L.ch}
                    </text>
                    <text x={0} y={0} fontFamily={la2Fonts.slab} fontSize={hfs} fill={HD.navy}>
                      {L.ch}
                    </text>
                  </g>
                );
              });
            })()}
          </g>
          {/* exhibit: evidence tag (or the src image) */}
          {exA > 0.01 && (
            <g transform={`translate(${ex.x} ${ex.y}) rotate(${-8 + swing}) scale(${exA / exSq} ${exA * exSq})`}>
              {p.src ? (
                <g filter={`url(#${id}-ink)`}>
                  <rect x={-170 * ex.s} y={-130 * ex.s} width={340 * ex.s} height={300 * ex.s} rx={10 * ex.s} fill={HD.cream} stroke={HD.navy} strokeWidth={7 * ex.s} />
                </g>
              ) : (
                <g filter={`url(#${id}-boil)`}>
                  <path
                    d={`M${-150 * ex.s} ${-80 * ex.s} L${90 * ex.s} ${-80 * ex.s} L${160 * ex.s} 0 L${90 * ex.s} ${80 * ex.s} L${-150 * ex.s} ${80 * ex.s} Z`}
                    fill={HD.cream}
                    stroke={HD.navy}
                    strokeWidth={7 * ex.s}
                    strokeLinejoin="round"
                  />
                  <circle cx={100 * ex.s} cy={0} r={16 * ex.s} fill={p.background} stroke={HD.navy} strokeWidth={6 * ex.s} />
                  <path d={`M${116 * ex.s} 0 C ${190 * ex.s} ${-40 * ex.s}, ${230 * ex.s} ${-120 * ex.s}, ${300 * ex.s} ${-150 * ex.s}`} fill="none" stroke={HD.navy} strokeWidth={5 * ex.s} strokeLinecap="round" />
                  <rect x={-130 * ex.s} y={-56 * ex.s} width={200 * ex.s} height={36 * ex.s} rx={5 * ex.s} fill={HD.blue} />
                  <text x={-118 * ex.s} y={-30 * ex.s} fontFamily={la2Fonts.monoHeavy} fontWeight={800} fontSize={24 * ex.s} fill={HD.cream}>
                    {p.exhibitLabel}
                  </text>
                  <text x={-128 * ex.s} y={50 * ex.s} fontFamily={la2Fonts.bagel} fontSize={66 * ex.s} fill={HD.navy}>
                    {p.numeral}
                  </text>
                </g>
              )}
            </g>
          )}
          {/* caption pill (navy with pink offset shadow, keyword in yellow) */}
          {capK > 0 && p.caption && (
            <g transform={`translate(${w / 2} ${capY + 40 * u * (1 - eo(capK))}) rotate(${-1.2 * (1 - capK) - 0.6}) scale(${0.8 + 0.2 * backOut(capK, 1.9)})`} opacity={Math.min(1, capK * 3)}>
              <rect x={-capW / 2 + 8 * u} y={-capFs * 0.85 + 8 * u} width={capW} height={capFs * 1.7} rx={14 * u} fill={HD.pink} style={{mixBlendMode: 'multiply'}} />
              <rect x={-capW / 2} y={-capFs * 0.85} width={capW} height={capFs * 1.7} rx={14 * u} fill={HD.navy} />
              <text x={0} y={capFs * 0.36} fontFamily={la2Fonts.barlow} fontWeight={700} fontSize={capFs} fill={HD.cream} textAnchor="middle">
                {capA}
                {capB !== undefined && <tspan fill={HD.yellow}>{p.keyword}</tspan>}
                {capB}
              </text>
            </g>
          )}
        </svg>
        {p.src && exA > 0.01 && (
          <div
            style={{
              position: 'absolute',
              left: ex.x - 150 * ex.s,
              top: ex.y - 110 * ex.s,
              width: 300 * ex.s,
              height: 260 * ex.s,
              overflow: 'hidden',
              transform: `rotate(${-8 + swing}deg) scale(${exA / exSq}, ${exA * exSq})`,
              transformOrigin: `${150 * ex.s}px ${110 * ex.s}px`,
            }}
          >
            <Img src={resolveSrc(p.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
        )}
      </AbsoluteFill>
      <DossierPaper w={w} h={h} frame={frame} u={u} />
    </AbsoluteFill>
  );
};

export const halftoneExhibitNumeral = defineMotion<Props>({
  id: 'halftone-exhibit-numeral',
  title: 'Halftone exhibit numeral',
  category: 'text',
  description:
    'A giant rounded numeral bleeds off the right edge in flat yellow overprinted with an orange Ben-Day halftone clipped to the glyph, rising in with a back-ease behind a boiling evidence tag, while a misregistered slab headline drops letter by letter and a navy caption pill pops — all on mottled archive paper.',
  source: ['lemo-opuscar styles/halftone-dossier (MIT, LemoLab) — demo/index.html halftone(), radial(), charge-card scene, caption, boil filter'],
  useFor: 'Numbered lists ("Reason 3"), step counters, chapter numbers and exhibit cards in print / editorial / true-crime-parody looks.',
  durationInFrames: 150,
  defaultProps: {
    numeral: '03',
    headline: 'Exhibit three',
    caseLine: 'CASE No.2026-NW-003',
    tag: 'CHARGE 03',
    caption: 'Left the oven on 17 times this year.',
    keyword: '17 times',
    numeralColor: HD.yellow,
    dotColor: HD.orange,
    shadowColor: HD.yellow,
    src: '',
    background: HD.paper,
    exhibitLabel: 'EXHIBIT',
  },
  propDocs: {
    numeral: 'the giant numeral (1–3 characters)',
    headline: 'slab headline with misregistered shadow (letters drop in)',
    caseLine: 'mono case number top-left',
    tag: 'navy pill under the case number',
    caption: 'caption pill text (empty = none)',
    keyword: 'part of the caption shown in yellow',
    numeralColor: 'flat spot ink of the numeral (yellow / pale pink)',
    dotColor: 'halftone overprint colour inside the numeral',
    shadowColor: 'misregistration shadow colour of the headline',
    src: 'optional public/ image shown as the exhibit (boiling evidence tag otherwise)',
    background: 'paper colour',
    exhibitLabel: 'small caps label above the numeral on the card',
  },
  component: HalftoneExhibitNumeral,
  tags: ['numeral', 'number', 'halftone', 'ben-day', 'print', 'dossier', 'exhibit', 'case file', 'list', 'step', 'chapter', 'editorial', 'retro', 'misregistration', 'slab', 'caption', 'paper'],
});
