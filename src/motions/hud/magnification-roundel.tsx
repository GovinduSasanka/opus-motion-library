// Adapted from lemo-opuscar/styles/engraving/demo/engine/plate.js roundelFrame/leader + burin.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {BPt, ENGRAVE, EngravedSheet, InkPaths, bboxOfPts, buildPearPlate, engravedReveal, eio, eo, la2Fonts, seg} from '../../core/r2-la2-kit';

/**
 * magnification-roundel — a ring is scribed around a part of an engraved figure, the inside is re-drawn magnified,
 * then the roundel (double-ruled circle on a ruled-line ground) lifts off and flies on an eased arc to a margin
 * slot trailing a hairline leader back to a dot on the part; figure number and labels are cut on landing.
 */
type Props = {
  title: string;
  figures: {label: string; term: string; note: string}[];
  anchors: number[][];
  zooms: number[];
  radius: number;
  startAt: number;
  stagger: number;
  flight: number;
  ink: string;
  paper: string;
};

const MagnificationRoundel: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const plate = useMemo(() => {
    const figH = h * (portrait ? 0.34 : 0.56);
    const s = figH / 680;
    const cx = w / 2;
    const cy = h * (portrait ? 0.3 : 0.47);
    const tr = (q: BPt): BPt => [cx + (q[0] - 520) * s, cy + (q[1] - 480) * s];
    const P = buildPearPlate(tr, s, u, {spacing: 3.2});
    P.ink.schedule(['bol', 'lol', 'st'], 0.05, 0.8, 4);
    P.ink.schedule(['bh1', 'lh1'], 0.5, 1.6, 70);
    P.ink.schedule(['bh2', 'lh2', 'bh3', 'bst', 'sh'], 1.1, 2.2, 70);
    return P;
  }, [w, h, u, portrait]);
  const r = plate.ink.render(t);
  const bb = plate.bbox;
  const fw = bb[2] - bb[0];
  const fh = bb[3] - bb[1];
  const R = p.radius * u * (portrait ? 0.85 : 1);
  const slots: BPt[] = portrait
    ? [
        [w * 0.26, h * 0.68],
        [w * 0.74, h * 0.76],
        [w * 0.3, h * 0.88],
      ]
    : [
        [w * 0.155, h * 0.26],
        [w * 0.155, h * 0.78],
        [w * 0.845, h * 0.66],
      ];
  const n = Math.min(p.figures.length, p.anchors.length, slots.length);
  const titleSize = Math.min(52 * u, (w * 0.8) / Math.max(6, p.title.length * 0.78));
  const titleP = seg(t, 0.3, 1.6);
  const g = [...p.title];
  return (
    <AbsoluteFill style={{background: p.paper}}>
      <Svg>
        <EngravedSheet id="mr-sheet" w={w} h={h} u={u} paper={p.paper} />
        <InkPaths paths={r.paths} color={p.ink} />
        <text x={w / 2} y={h * (portrait ? 0.08 : 0.115)} textAnchor="middle" fontFamily={la2Fonts.bodoni} fontWeight={500} fontSize={titleSize} letterSpacing={titleSize * 0.14} fill={p.ink}>
          {g.map((c, i) => (
            <tspan key={i} opacity={Math.min(1, engravedReveal(titleP, g.length, i))}>
              {c}
            </tspan>
          ))}
        </text>
        {Array.from({length: n}, (_, i) => {
          const t0 = p.startAt + i * p.stagger;
          const anchor: BPt = [bb[0] + fw * p.anchors[i][0], bb[1] + fh * p.anchors[i][1]];
          const slot = slots[i];
          const zoom = p.zooms[i % p.zooms.length] ?? 3;
          const scribeP = eio(seg(t, t0, t0 + 0.7));
          const flyP = eio(seg(t, t0 + 0.9, t0 + 0.9 + p.flight));
          const landT = t0 + 0.9 + p.flight;
          const labelP = seg(t, landT, landT + 0.8);
          const noteP = seg(t, landT + 0.3, landT + 1.3);
          if (scribeP <= 0) return null;
          const r0 = R * 0.45;
          // quadratic arc with a 30 px lift mid-flight
          const mx = (anchor[0] + slot[0]) / 2;
          const my = Math.min(anchor[1], slot[1]) - 90 * u;
          const q = flyP;
          const cxp = (1 - q) * (1 - q) * anchor[0] + 2 * (1 - q) * q * mx + q * q * slot[0];
          const cyp = (1 - q) * (1 - q) * anchor[1] + 2 * (1 - q) * q * my + q * q * slot[1];
          // log-linear radius growth
          const rr = Math.exp(Math.log(r0) + (Math.log(R) - Math.log(r0)) * q);
          const mag = 1 + (zoom - 1) * q;
          const a0 = -Math.PI / 2 - 0.4;
          const sweep = scribeP * Math.PI * 2;
          const arc = (rad: number, pp: number) => {
            const a1 = a0 + Math.PI * 2 * Math.min(1, pp);
            if (pp >= 1) return null;
            const large = a1 - a0 > Math.PI ? 1 : 0;
            return `M${cxp + Math.cos(a0) * rad} ${cyp + Math.sin(a0) * rad}A${rad} ${rad} 0 ${large} 1 ${cxp + Math.cos(a1) * rad} ${cyp + Math.sin(a1) * rad}`;
          };
          // leader: anchor → waypoint → rim (recomputed each frame)
          const ang = Math.atan2(anchor[1] - cyp, anchor[0] - cxp);
          const rim: BPt = [cxp + Math.cos(ang) * rr, cyp + Math.sin(ang) * rr];
          const wayp: BPt = [anchor[0] * 0.45 + rim[0] * 0.55, (anchor[1] * 0.45 + rim[1] * 0.55) - 26 * u];
          const leadP = seg(t, t0 + 1, landT + 0.2);
          const fig = p.figures[i];
          const lblSize = 19 * u;
          const below = slot[1] < h * 0.5 ? 1 : -1;
          const ly = slot[1] + (R + 42 * u) * below + (below < 0 ? -lblSize * 3.4 : 0);
          return (
            <g key={i}>
              {leadP > 0 && flyP > 0.05 && (
                <g stroke={p.ink} strokeWidth={0.95 * u} fill="none" opacity={0.85}>
                  <path d={`M${anchor[0]} ${anchor[1]}L${anchor[0] + (wayp[0] - anchor[0]) * Math.min(1, leadP * 2)} ${anchor[1] + (wayp[1] - anchor[1]) * Math.min(1, leadP * 2)}`} />
                  {leadP > 0.5 && <path d={`M${wayp[0]} ${wayp[1]}L${wayp[0] + (rim[0] - wayp[0]) * Math.min(1, (leadP - 0.5) * 2)} ${wayp[1] + (rim[1] - wayp[1]) * Math.min(1, (leadP - 0.5) * 2)}`} />}
                </g>
              )}
              <circle cx={anchor[0]} cy={anchor[1]} r={2.2 * u} fill={p.ink} opacity={Math.min(1, scribeP * 2)} />
              <clipPath id={`mr-c${i}`}>
                <circle cx={cxp} cy={cyp} r={rr - 1.5 * u} />
              </clipPath>
              <g clipPath={`url(#mr-c${i})`}>
                <rect x={cxp - rr} y={cyp - rr} width={rr * 2} height={rr * 2} fill={p.paper} />
                {/* ruled-line ground */}
                <g stroke={p.ink} strokeWidth={0.45 * u} opacity={0.3}>
                  {Array.from({length: 19}, (_, k) => (
                    <line key={k} x1={cxp - rr} x2={cxp + rr} y1={cyp - rr + (k / 9) * rr} y2={cyp - rr + (k / 9) * rr} />
                  ))}
                </g>
                {/* magnified live copy of the figure around the anchor */}
                <g transform={`translate(${cxp} ${cyp}) scale(${mag}) translate(${-anchor[0]} ${-anchor[1]})`}>
                  <InkPaths paths={r.paths} color={p.ink} wScale={1 / Math.sqrt(mag)} />
                </g>
              </g>
              {/* double rule */}
              {scribeP < 1 ? (
                <g stroke={p.ink} fill="none" strokeLinecap="round">
                  <path d={arc(rr, scribeP) ?? ''} strokeWidth={2.2 * u} />
                  <path d={arc(rr - Math.max(3.5 * u, rr * 0.035), Math.max(0, scribeP * 1.1 - 0.1)) ?? ''} strokeWidth={0.84 * u} />
                </g>
              ) : (
                <g stroke={p.ink} fill="none">
                  <circle cx={cxp} cy={cyp} r={rr} strokeWidth={2.2 * u} />
                  <circle cx={cxp} cy={cyp} r={rr - Math.max(3.5 * u, rr * 0.035)} strokeWidth={0.84 * u} />
                </g>
              )}
              {/* fig number near the leader root */}
              <text x={anchor[0] + 14 * u} y={anchor[1] - 8 * u} fontFamily={la2Fonts.bodoni} fontStyle="italic" fontSize={16 * u} fill={p.ink} opacity={leadP > 0.2 ? 1 : 0}>
                {i + 1}
              </text>
              {/* labels on landing */}
              <g textAnchor="middle" fill={p.ink} opacity={labelP > 0 ? 1 : 0}>
                <text x={slot[0]} y={ly} fontFamily={la2Fonts.bodoni} fontWeight={500} fontSize={lblSize} letterSpacing={lblSize * 0.14}>
                  {[...`FIG. ${i + 1} · ${fig.label.toUpperCase()}`].map((c, k, arr) => (
                    <tspan key={k} opacity={Math.min(1, engravedReveal(labelP, arr.length, k))}>
                      {c}
                    </tspan>
                  ))}
                </text>
                <text x={slot[0]} y={ly + lblSize * 1.2} fontFamily={la2Fonts.bodoni} fontStyle="italic" fontSize={lblSize * 0.85} opacity={seg(t, landT + 0.3, landT + 0.8)}>
                  {fig.term}
                </text>
                <g opacity={noteP}>
                  <clipPath id={`mr-n${i}`}>
                    <rect x={slot[0] - R * 1.7} y={ly + lblSize * 1.5} width={R * 3.4 * noteP} height={lblSize * 3} />
                  </clipPath>
                  <text x={slot[0]} y={ly + lblSize * 2.6} fontFamily={la2Fonts.pinyon} fontSize={lblSize * 1.3} clipPath={`url(#mr-n${i})`}>
                    {fig.note}
                  </text>
                </g>
              </g>
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const magnificationRoundel = defineMotion<Props>({
  id: 'magnification-roundel',
  title: 'Magnification roundel',
  category: 'hud',
  description:
    'Over an engraved figure, a double-ruled ring is scribed around a detail, the inside re-draws magnified on a ruled-line ground, then the roundel flies on an eased arc to a margin slot trailing a hairline leader back to a dot on the part; FIG numbers, italic terms and script notes are cut on landing.',
  source: ['lemo-opuscar styles/engraving (MIT, LemoLab) — demo/engine/plate.js roundelFrame, leader; burin.js'],
  useFor: 'Detail insets for any explainer: product feature zooms, anatomy, map insets, museum plates; style-agnostic loupe callouts.',
  durationInFrames: 240,
  defaultProps: {
    title: 'THE PEAR, EXAMINED.',
    figures: [
      {label: 'The stem', term: 'pedunculus', note: 'Woody, set in a shallow basin.'},
      {label: 'The leaf', term: 'folium', note: 'Finely veined, glossy above.'},
      {label: 'The blush', term: 'rubor', note: 'Where the sun has touched it.'},
    ],
    anchors: [
      [0.52, 0.04],
      [0.78, -0.12],
      [0.73, 0.5],
    ],
    zooms: [3.2, 2.6, 2.2],
    radius: 120,
    startAt: 2.4,
    stagger: 1.7,
    flight: 1.1,
    ink: ENGRAVE.ink,
    paper: ENGRAVE.paper,
  },
  propDocs: {
    title: 'engraved plate title',
    figures: 'per roundel: {label (roman caps), term (italic), note (script)}',
    anchors: 'per roundel [x, y] on the figure, as fractions of its bounding box',
    zooms: 'magnification per roundel',
    radius: 'landed roundel radius in px@1080',
    startAt: 'second the first ring is scribed',
    stagger: 'seconds between roundels',
    flight: 'seconds of the arc flight to the margin',
    ink: 'ink colour',
    paper: 'paper colour',
  },
  component: MagnificationRoundel,
  tags: ['engraving', 'roundel', 'magnify', 'loupe', 'detail', 'inset', 'callout', 'leader-line', 'figure', 'natural-history', 'museum', 'zoom', 'annotation', 'plate', 'heritage'],
});
