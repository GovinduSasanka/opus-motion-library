// Adapted from lemo-opuscar/styles/crayon-book/demo/gl.js (TOOTH + layer shader + final composite) and crayon.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {resolveSrc} from '../../core/asset';
import {BPt, CRAYON, CrayonFill, CrayonFilter, CrayonLine, CrayonPaper, boilStep, ellipsePts, eio, la2Fonts, seg, shash, smoothPts, xfPts} from '../../core/r2-la2-kit';

/**
 * crayon-wax-shader — the crayon-book wax-on-paper look as a reusable layer: every drawn mark becomes wax caught
 * on toothy paper (speckled at light pressure, near-solid when pressed hard, embossed tooth, fibre grooves).
 * Demo: a picture-book garden is drawn, coloured lightly, then coloured over hard. With `src`, any picture is
 * coloured in by big zig-zag strokes and rendered through the same wax-adhesion filter.
 */
type Props = {
  src: string;
  caption: string;
  pressure: number;
  heavyPressure: number;
  toothScale: number;
  emboss: number;
  paperColor: string;
  inkColor: string;
  boil: boolean;
  colors: string[];
};

const CrayonWaxShader: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const st = p.boil ? boilStep(frame) : 0;
  const sc = p.toothScale * u;
  const [cSun, cPetal, cLeaf, cCentre, cSky] = [0, 1, 2, 3, 4].map((i) => p.colors[i] ?? [CRAYON.yellow, CRAYON.pink, CRAYON.green, CRAYON.orange, CRAYON.sky][i]);
  const m = Math.min(w, h);
  // ---------------- scene geometry (picture book garden)
  const sunC: BPt = [w * (portrait ? 0.28 : 0.22), h * (portrait ? 0.17 : 0.27)];
  const sunR = m * 0.11;
  const sun = ellipsePts(sunC[0], sunC[1], sunR, sunR, 36);
  const rays = Array.from({length: 10}, (_, i) => {
    const a = (i / 10) * Math.PI * 2 + 0.2;
    return [
      [sunC[0] + Math.cos(a) * sunR * 1.3, sunC[1] + Math.sin(a) * sunR * 1.3],
      [sunC[0] + Math.cos(a) * sunR * 1.75, sunC[1] + Math.sin(a) * sunR * 1.75],
    ] as BPt[];
  });
  const groundY = h * (portrait ? 0.8 : 0.82);
  const grassTop: BPt[] = Array.from({length: 17}, (_, i) => [-30 * u + ((w + 60 * u) * i) / 16, groundY + Math.sin(i * 1.7) * 9 * u + Math.sin(i * 0.6) * 14 * u] as BPt);
  const grass: BPt[] = [...grassTop, [w + 40 * u, h + 40 * u], [-40 * u, h + 40 * u]];
  const flowers = (portrait
    ? [
        {x: 0.62, top: 0.42, r: 0.075},
        {x: 0.3, top: 0.58, r: 0.055},
        {x: 0.82, top: 0.64, r: 0.045},
      ]
    : [
        {x: 0.6, top: 0.36, r: 0.085},
        {x: 0.8, top: 0.52, r: 0.06},
        {x: 0.38, top: 0.6, r: 0.05},
      ]
  ).map((f, k) => {
    const hx = w * f.x;
    const hy = h * f.top;
    const pr = m * f.r;
    const petals = Array.from({length: 6}, (_, i) => {
      const a = (i / 6) * Math.PI * 2 + k * 0.4;
      return ellipsePts(hx + Math.cos(a) * pr * 0.95, hy + Math.sin(a) * pr * 0.95, pr * 0.62, pr * 0.42, 22, a);
    });
    const centre = ellipsePts(hx, hy, pr * 0.5, pr * 0.5, 24);
    const stem: BPt[] = [
      [hx, hy + pr * 0.5],
      [hx + pr * 0.15, hy + pr * 2],
      [hx - pr * 0.1, groundY - pr * 0.6],
      [hx, groundY + 10 * u],
    ];
    const leafBase: BPt[] = smoothPts(
      [
        [0, 0],
        [pr * 0.6, -pr * 0.38],
        [pr * 1.3, -pr * 0.2],
        [pr * 0.65, pr * 0.18],
      ],
      6,
    );
    const ly = hy + (groundY - hy) * 0.55;
    const leafL = xfPts(leafBase, hx, ly, 1, Math.PI + 0.35);
    const leafR = xfPts(leafBase, hx, ly + pr * 0.4, 1, -0.35);
    return {petals, centre, stem: smoothPts(stem, 6, false), leafL, leafR};
  });
  const cloud = smoothPts(
    [
      [-1, 0],
      [-0.7, -0.45],
      [-0.2, -0.55],
      [0.15, -0.85],
      [0.6, -0.55],
      [1, -0.2],
      [0.8, 0.15],
      [-0.6, 0.15],
    ].map(([x, y]) => [w * (portrait ? 0.68 : 0.8) + x * m * 0.13, h * (portrait ? 0.2 : 0.2) + y * m * 0.1] as BPt),
    6,
  );
  // ---------------- timeline
  const line = (a: number) => eio(seg(frame, a, a + 18));
  const light = (a: number, d = 30) => seg(frame, a, a + d);
  const heavy = (a: number, d = 30) => seg(frame, a, a + d);
  const capT = seg(frame, 150, 185);
  const capSize = Math.min(64 * u, (w * 0.84) / Math.max(8, p.caption.length * 0.42));
  const fid = 'cws-f';
  const lp = p.pressure;
  const hp = p.heavyPressure;

  if (p.src) {
    // picture mode: the picture is coloured in by large zig-zag wax strokes
    const reveal = seg(frame, 6, 120);
    const box: BPt[] = [
      [-20 * u, -20 * u],
      [w + 20 * u, -20 * u],
      [w + 20 * u, h + 20 * u],
      [-20 * u, h + 20 * u],
    ];
    return (
      <AbsoluteFill style={{background: p.paperColor}}>
        <Svg>
          <defs>
            <filter id={`${fid}-img`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
              <feComponentTransfer in="SourceGraphic" result="post">
                <feFuncR type="discrete" tableValues="0.1 0.3 0.5 0.7 0.9" />
                <feFuncG type="discrete" tableValues="0.1 0.3 0.5 0.7 0.9" />
                <feFuncB type="discrete" tableValues="0.1 0.3 0.5 0.7 0.9" />
              </feComponentTransfer>
              <feColorMatrix in="post" type="matrix" values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  ${-0.25 * lp} ${-0.6 * lp} ${-0.08 * lp} 0 ${0.35 + 0.9 * lp}`} result="pres" />
              <feTurbulence type="fractalNoise" baseFrequency={0.42 / sc} numOctaves={3} seed={7} result="n1" />
              <feTurbulence type="fractalNoise" baseFrequency={`${0.05 / sc} ${0.42 / sc}`} numOctaves={2} seed={11} result="n2" />
              <feComposite in="n1" in2="n2" operator="arithmetic" k2={0.78} k3={0.32} k4={-0.04} result="tooth" />
              <feColorMatrix in="tooth" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.25 0 0 0 -0.12" result="toothA" />
              <feComposite in="toothA" in2="pres" operator="arithmetic" k2={3.6} k3={4.4} k4={-3.1} result="cover" />
              <feColorMatrix in="pres" type="matrix" values="0.92 0 0 0 0  0 0.92 0 0 0  0 0 0.92 0 0  0 0 0 9 0" result="solid" />
              <feComposite in="solid" in2="cover" operator="in" />
            </filter>
            <mask id={`${fid}-m`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
              <rect width={w} height={h} fill="black" />
              <g style={{filter: 'brightness(3)'}}>
                <CrayonFill poly={box} color="#ffffff" step={st} seed={5} p={1} gap={34 * u} w={46 * u} over={0} draw={reveal} ang={0.62} />
              </g>
            </mask>
          </defs>
          <CrayonPaper id={`${fid}-p`} w={w} h={h} color={p.paperColor} scale={sc} emboss={p.emboss} />
          <g mask={`url(#${fid}-m)`}>
            <image href={resolveSrc(p.src)} x={0} y={0} width={w} height={h} preserveAspectRatio="xMidYMid slice" filter={`url(#${fid}-img)`} />
          </g>
          {p.caption && (
            <g filter={`url(#${fid})`}>
              <defs>
                <CrayonFilter id={fid} scale={sc} />
              </defs>
              <rect x={w / 2 - capSize * p.caption.length * 0.26} y={h * 0.86 - capSize * 0.95} width={capSize * p.caption.length * 0.52 * capT} height={capSize * 1.35} fill={p.paperColor} fillOpacity={0.95} />
              <text x={w / 2} y={h * 0.86} textAnchor="middle" fontFamily={la2Fonts.patrick} fontSize={capSize} fill={p.inkColor} opacity={capT > 0 ? 1 : 0}>
                {p.caption.slice(0, Math.ceil(capT * p.caption.length))}
              </text>
            </g>
          )}
        </Svg>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{background: p.paperColor}}>
      <Svg>
        <defs>
          <CrayonFilter id={fid} scale={sc} />
        </defs>
        <CrayonPaper id={`${fid}-p`} w={w} h={h} color={p.paperColor} scale={sc} emboss={p.emboss} />
        <g filter={`url(#${fid})`}>
          {/* light colouring first: wax only catches the tops of the tooth */}
          <CrayonFill poly={cloud} color={cSky} step={st} seed={61} p={lp * 0.9} gap={11 * u} w={12 * u} over={6 * u} draw={light(40)} ang={0.1} />
          <CrayonFill poly={grass} color={cLeaf} step={st} seed={3} p={lp} gap={12 * u} w={12 * u} over={7 * u} draw={light(28, 40)} ang={0.4} />
          <CrayonFill poly={sun} color={cSun} step={st} seed={7} p={lp} gap={10 * u} w={11 * u} over={7 * u} draw={light(34)} />
          {flowers.map((f, k) => (
            <g key={k}>
              {f.petals.map((pt, i) => (
                <CrayonFill key={i} poly={pt} color={cPetal} step={st + i} seed={20 + i + k * 9} p={lp} gap={8 * u} w={9 * u} over={5 * u} draw={light(44 + k * 8 + i * 3, 16)} />
              ))}
              <CrayonFill poly={f.leafL} color={cLeaf} step={st} seed={41 + k} p={lp} gap={8 * u} w={9 * u} over={4 * u} draw={light(50 + k * 8, 18)} />
              <CrayonFill poly={f.leafR} color={cLeaf} step={st} seed={45 + k} p={lp} gap={8 * u} w={9 * u} over={4 * u} draw={light(54 + k * 8, 18)} />
            </g>
          ))}
          {/* then pressed hard: the same shapes coloured over until the wax fills the pits */}
          <CrayonFill poly={grass} color={cLeaf} step={st} seed={4} p={hp * 0.85} gap={11 * u} w={12 * u} over={6 * u} draw={heavy(132, 36)} ang={-0.3} />
          <CrayonFill poly={sun} color={cSun} step={st} seed={8} p={hp} gap={9 * u} w={11 * u} over={6 * u} draw={heavy(96, 26)} ang={-0.5} />
          {flowers.map((f, k) => (
            <g key={`h${k}`}>
              {f.petals.map((pt, i) => (
                <CrayonFill key={i} poly={pt} color={cPetal} step={st + i} seed={70 + i + k * 9} p={hp} gap={7 * u} w={9 * u} over={4 * u} draw={heavy(108 + k * 10 + i * 3, 14)} ang={-0.4} />
              ))}
              <CrayonFill poly={f.centre} color={cCentre} step={st} seed={90 + k} p={hp} gap={6 * u} w={8 * u} over={3 * u} draw={heavy(122 + k * 8, 14)} />
            </g>
          ))}
          {/* outlines (indigo, never black) */}
          <CrayonLine pts={[...sun, sun[1]]} color={CRAYON.orange} step={st} seed={1} w={6 * u} p={0.7} draw={line(4)} closed={false} />
          {rays.map((r, i) => (
            <CrayonLine key={i} pts={r} color={CRAYON.orange} step={st + i} seed={30 + i} w={7 * u} p={0.75} draw={line(14 + i * 2)} />
          ))}
          <CrayonLine pts={[...cloud]} color={p.inkColor} step={st} seed={9} w={5 * u} p={0.6} draw={line(18)} />
          <CrayonLine pts={grassTop} color={p.inkColor} step={st} seed={2} w={6 * u} p={0.7} draw={line(8)} />
          {flowers.map((f, k) => (
            <g key={`o${k}`}>
              <CrayonLine pts={f.stem} color={CRAYON.green} step={st} seed={50 + k} w={9 * u} p={0.85} draw={line(12 + k * 6)} />
              {f.petals.map((pt, i) => (
                <CrayonLine key={i} pts={pt} color={p.inkColor} step={st + i} seed={60 + i + k * 7} w={4.5 * u} p={0.65} draw={line(20 + k * 6 + i * 2)} />
              ))}
              <CrayonLine pts={f.centre} color={p.inkColor} step={st} seed={80 + k} w={4.5 * u} p={0.65} draw={line(26 + k * 6)} />
              <CrayonLine pts={[...f.leafL, f.leafL[0]]} color={p.inkColor} step={st} seed={84 + k} w={4.5 * u} p={0.6} draw={line(30 + k * 6)} />
              <CrayonLine pts={[...f.leafR, f.leafR[0]]} color={p.inkColor} step={st} seed={88 + k} w={4.5 * u} p={0.6} draw={line(32 + k * 6)} />
            </g>
          ))}
          {p.caption && (
            <g>
              <path
                opacity={Math.min(1, capT * 4)}
                fill={p.paperColor}
                d={(() => {
                  const cw = capSize * p.caption.length * 0.27 + 30 * u;
                  const cy0 = h * (portrait ? 0.93 : 0.94) - capSize * 0.38;
                  const pts: BPt[] = [];
                  for (let i = 0; i <= 20; i++) pts.push([w / 2 - cw + (2 * cw * i) / 20, cy0 - capSize * 0.72 + (shash(i, 7) - 0.5) * 10 * u]);
                  for (let i = 20; i >= 0; i--) pts.push([w / 2 - cw + (2 * cw * i) / 20, cy0 + capSize * 0.72 + (shash(i, 9) - 0.5) * 10 * u]);
                  return 'M' + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L') + 'Z';
                })()}
              />
              <clipPath id={`${fid}-cap`}>
                <rect x={w / 2 - capSize * p.caption.length * 0.24} y={h * 0.8} width={capSize * p.caption.length * 0.48 * capT} height={h * 0.2} />
              </clipPath>
              <text
                x={w / 2 + (p.boil ? (shash(st, 1) - 0.5) * 1.6 * u : 0)}
                y={h * (portrait ? 0.93 : 0.94) + (p.boil ? (shash(st, 2) - 0.5) * 1.6 * u : 0)}
                textAnchor="middle"
                fontFamily={la2Fonts.patrick}
                fontSize={capSize}
                fill={p.inkColor}
                fillOpacity={0.95}
                clipPath={`url(#${fid}-cap)`}
              >
                {p.caption}
              </text>
            </g>
          )}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const crayonWaxShader = defineMotion<Props>({
  id: 'crayon-wax-shader',
  title: 'Crayon wax shader',
  category: 'fx',
  description:
    'Wax-crayon-on-toothy-paper look as a layer: a picture-book garden (sun, cloud, flowers, grass) is outlined, coloured lightly so the wax only catches the paper tooth, then coloured over hard until near-solid; embossed paper, fibre grooves, 12 fps boil. With src, any picture is coloured in by big zig-zag strokes through the same filter.',
  source: ['lemo-opuscar styles/crayon-book (MIT, LemoLab) — demo/gl.js tooth / wax adhesion / emboss, demo/crayon.js'],
  useFor: 'A hand-made crayon style layer for kids content, picture books, greeting cards; turn a photo into a crayon drawing.',
  durationInFrames: 210,
  defaultProps: {
    src: '',
    caption: 'colour outside the lines',
    pressure: 0.42,
    heavyPressure: 0.95,
    toothScale: 1,
    emboss: 0.6,
    paperColor: CRAYON.paper,
    inkColor: CRAYON.ink,
    boil: true,
    colors: [CRAYON.yellow, CRAYON.pink, CRAYON.green, CRAYON.orange, CRAYON.sky],
  },
  propDocs: {
    src: 'optional picture (public/ path or URL) rendered as wax crayon; empty = the procedural garden',
    caption: 'printed words, written letter by letter at the bottom',
    pressure: 'first, light colouring pressure 0..1 (speckled)',
    heavyPressure: 'second, pressed-hard pressure 0..1 (near-solid)',
    toothScale: 'paper tooth size multiplier',
    emboss: 'paper emboss strength 0..1',
    paperColor: 'drawing paper colour',
    inkColor: 'outline crayon colour',
    boil: 'lines re-jitter 12 times a second',
    colors: '[sun, petals, leaves, flower centre, cloud] crayon colours',
  },
  component: CrayonWaxShader,
  tags: ['crayon', 'wax', 'paper', 'tooth', 'texture', 'style', 'filter', 'picture-book', 'kids', 'hand-made', 'emboss', 'boil', 'flowers', 'garden', 'photo-to-drawing'],
});
