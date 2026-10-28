// Adapted from lemo-opuscar/styles/engraving/demo/engine/{wash.js,burin.js,plate.js} (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {BPt, ENGRAVE, EngravedSheet, InkPaths, WashRegion, bboxOfPts, buildPearPlate, engravedReveal, la2Fonts, seg} from '../../core/r2-la2-kit';

/**
 * wash-bloom-colour — after a black line print, transparent watercolour is laid region by region, blooming out from
 * where the brush touched with a ragged wet front; it spills a few px past the engraved line, sits slightly off
 * register, pools into a darker tide-line, shows backruns and granulation — and the ink always stays on top.
 */
type Props = {
  title: string;
  latin: string;
  note: string;
  bodyColor: string;
  blushColor: string;
  leafColor: string;
  stemColor: string;
  printDuration: number;
  colourAt: number;
  regionDuration: number;
  stagger: number;
  ink: string;
  paper: string;
};

const WashBloomColour: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const plate = useMemo(() => {
    const figH = h * (portrait ? 0.44 : 0.66);
    const s = figH / 680;
    const cx = w / 2;
    const cy = h * (portrait ? 0.45 : 0.47);
    const tr = (q: BPt): BPt => [cx + (q[0] - 520) * s, cy + (q[1] - 480) * s];
    const P = buildPearPlate(tr, s, u);
    const T = p.printDuration;
    P.ink.schedule(['bol', 'lol', 'st'], 0.05, T * 0.35, 3);
    P.ink.schedule(['bh1', 'lh1'], T * 0.25, T * 0.75, 60);
    P.ink.schedule(['bh2', 'lh2', 'bh3', 'bst'], T * 0.55, T, 60);
    P.ink.schedule('sh', T * 0.7, T, 30);
    return P;
  }, [w, h, u, portrait, p.printDuration]);
  const r = plate.ink.render(t);
  const bb = plate.bbox;
  const regs: {key: string; poly: BPt[]; color: string; origin: BPt; alpha: number}[] = [
    {key: 'body', poly: plate.body, color: p.bodyColor, origin: [bb[0] + (bb[2] - bb[0]) * 0.38, bb[1] + (bb[3] - bb[1]) * 0.55], alpha: 0.62},
    {key: 'blush', poly: plate.blush, color: p.blushColor, origin: [bb[0] + (bb[2] - bb[0]) * 0.7, bb[1] + (bb[3] - bb[1]) * 0.68], alpha: 0.5},
    {key: 'leaf', poly: plate.leaf, color: p.leafColor, origin: plate.leaf[Math.floor(plate.leaf.length * 0.35)], alpha: 0.6},
    {key: 'stem', poly: plate.stemPoly, color: p.stemColor, origin: plate.stem[0], alpha: 0.62},
  ];
  // gentle breathing push during colour (≤ 2 %)
  const Z = 1 + 0.02 * seg(t, p.colourAt, p.colourAt + 4);
  const ox = (w / 2) * (1 - Z);
  const oy = (h * 0.47) * (1 - Z);
  const titleSize = Math.min(50 * u, (w * 0.84) / Math.max(6, p.title.length * 0.8));
  const ty = bb[3] + (portrait ? 160 : 92) * u;
  const titleP = seg(t, 0.4, 1.8);
  const g = [...p.title];
  const scriptP = seg(t, p.colourAt + 2.6, p.colourAt + 4);
  return (
    <AbsoluteFill style={{background: p.paper}}>
      <Svg>
        <g transform={`translate(${ox} ${oy}) scale(${Z})`}>
          <EngravedSheet id="wbc-sheet" w={w} h={h} u={u} paper={p.paper} />
          {regs.map((rg, i) => (
            <WashRegion key={rg.key} id={`wbc-${rg.key}`} poly={rg.poly} color={rg.color} p={seg(t, p.colourAt + i * p.stagger, p.colourAt + i * p.stagger + p.regionDuration)} origin={rg.origin} u={u} alpha={rg.alpha} seed={i * 5 + 2} />
          ))}
          <InkPaths paths={r.paths} color={p.ink} />
          <text x={w / 2} y={ty} textAnchor="middle" fontFamily={la2Fonts.bodoni} fontWeight={500} fontSize={titleSize} letterSpacing={titleSize * 0.16} fill={p.ink}>
            {g.map((c, i) => (
              <tspan key={i} opacity={Math.min(1, engravedReveal(titleP, g.length, i))}>
                {c}
              </tspan>
            ))}
          </text>
          <text x={w / 2} y={ty + titleSize * 0.95} textAnchor="middle" fontFamily={la2Fonts.bodoni} fontStyle="italic" fontSize={titleSize * 0.52} fill={p.ink} opacity={seg(t, 1.4, 2.2)}>
            {p.latin}
          </text>
          <clipPath id="wbc-script">
            <rect x={w * 0.1} y={0} width={w * 0.8 * scriptP} height={h} />
          </clipPath>
          <text x={w / 2} y={ty + titleSize * 2.1} textAnchor="middle" fontFamily={la2Fonts.pinyon} fontSize={titleSize * 0.82} fill={p.ink} clipPath="url(#wbc-script)">
            {p.note}
          </text>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const washBloomColour = defineMotion<Props>({
  id: 'wash-bloom-colour',
  title: 'Wash bloom colour',
  category: 'fx',
  description:
    'A copperplate print of a pear is cut in black line, then transparent watercolour blooms region by region from where the brush touched — ragged wet front, spill past the line, off-register, darker tide-line, backruns and granulation — multiplied under the ink, with an engraved title and a script note.',
  source: ['lemo-opuscar styles/engraving (MIT, LemoLab) — demo/engine/wash.js Wash, burin.js, plate.js'],
  useFor: '"Colour arrives" climax for line art: botanical / natural-history plates, maps, product sketches, heritage brands.',
  durationInFrames: 240,
  defaultProps: {
    title: 'PLATE VII · THE PEAR',
    latin: 'Pyrus communis',
    note: 'Coloured by hand, after the print.',
    bodyColor: '#D9962A',
    blushColor: '#C8674A',
    leafColor: '#7E9A52',
    stemColor: '#8A6242',
    printDuration: 2.2,
    colourAt: 2.6,
    regionDuration: 1.4,
    stagger: 0.42,
    ink: ENGRAVE.ink,
    paper: ENGRAVE.paper,
  },
  propDocs: {
    title: 'engraved roman caption',
    latin: 'italic line under it',
    note: 'copperplate script note, written left to right after the colour',
    bodyColor: 'wash colour of the fruit',
    blushColor: 'wash colour of the blush',
    leafColor: 'wash colour of the leaf',
    stemColor: 'wash colour of the stem',
    printDuration: 'seconds for the black line print to cut itself',
    colourAt: 'second the first region starts to bloom',
    regionDuration: 'seconds per region bloom (1.25–1.6)',
    stagger: 'seconds between regions',
    ink: 'ink colour',
    paper: 'paper colour',
  },
  component: WashBloomColour,
  tags: ['watercolour', 'wash', 'hand-colouring', 'bloom', 'engraving', 'botanical', 'natural-history', 'print', 'colour-reveal', 'tide-line', 'pear', 'vintage', 'plate', 'heritage'],
});
