// Adapted from lemo-opuscar/styles/iso-infographic (DEMO.md "Cutaway timing"; engine.js cutLine, hatch) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {backOut, cl, eo3, ISO, IsoCtx, isoBox, isoP, isoPoly, IsoPolys, isoRoof, isoTri, lerp, lf, seg} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Floor = {label: string; value: string; color: string};
type Props = {
  title: string;
  floors: Floor[];
  wallColor: string;
  roofColor: string;
  cutAt: number;
  background: string;
  accent: string;
};

const IsoCutaway: React.FC<Props> = ({title, floors, wallColor, roofColor, cutAt, background, accent}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const nF = Math.max(1, floors.length);
  const W = 44;
  const Dp = 34;
  const FH = 18;
  const H = nF * FH;
  const totalH = H + 10;
  const k = Math.min((w * (portrait ? 0.52 : 0.4)) / ((W + Dp) * 0.866), (h * (portrait ? 0.6 : 0.7)) / ((W + Dp) / 2 + totalH));
  const ctx: IsoCtx = {k, cx: portrait ? w * 0.36 : w * 0.42, cy: (portrait ? h * 0.46 : h * 0.53) + (totalH * k) / 2, polys: []};
  const x0 = -W / 2;
  const x1 = W / 2;
  const y0 = -Dp / 2;
  const y1 = Dp / 2;

  // ---- timeline: build-in, cut line .3 s, skin slides .35 s (alpha 1→0 between 10–75 %), rims fade last 40 %
  const buildK = eo3(seg(frame, 2, 18));
  const tCut1 = cutAt;
  const tSlide1 = tCut1 + 9;
  const tCut2 = tSlide1 + 14;
  const tSlide2 = tCut2 + 9;
  const tRoof = tSlide2 + 6;
  const slideK = (t0: number) => eo3(seg(frame, t0, t0 + 11));
  const s1 = slideK(tSlide1);
  const s2 = slideK(tSlide2);
  const sr = slideK(tRoof);
  const alphaOf = (s: number) => 1 - seg(s, 0.1, 0.75);
  const rimOf = (s: number) => seg(s, 0.6, 1);

  // plinth
  isoBox(ctx, x0 - 8, y0 - 8, -3, x1 + 8, y1 + 8, 0, '#EFE3CB', {bias: -500});
  const rise = (1 - buildK) * 30;

  // back walls (always), floors slabs, interiors
  const wallT = isoTri(wallColor);
  isoPoly(ctx, [[x0, y0, 0 + rise], [x1, y0, 0 + rise], [x1, y0, H + rise], [x0, y0, H + rise]], wallT.right, {bias: -300});
  isoPoly(ctx, [[x0, y0, 0 + rise], [x0, y1, 0 + rise], [x0, y1, H + rise], [x0, y0, H + rise]], wallT.left, {bias: -300});
  for (let f = 0; f < nF; f++) {
    const z = f * FH + rise;
    const fl = floors[f];
    // slab
    isoBox(ctx, x0, y0, z, x1, y1, z + 1.2, '#E9DCC2', {bias: -200 + f * 40});
    // interior furniture per floor: machines / desks in the floor colour
    const base = -195 + f * 40;
    const show = backOut(seg(frame, tSlide1 - 4 + f * 3, tSlide1 + 8 + f * 3), 2.2);
    if (show > 0.01) {
      const sc = show;
      const kit = (bx: number, by: number, bw: number, bd: number, bh: number, c: string, j: number) => isoBox(ctx, bx, by, z + 1.2, bx + bw, by + bd, z + 1.2 + bh * sc, c, {bias: base + 2 + j * 0.5});
      kit(x0 + 4, y0 + 4, 10, 7, 6, '#D7C7A8', 0);
      kit(x0 + 18, y0 + 14, 10, 8, 8, fl.color, 1);
      kit(x0 + 32, y0 + 8, 8, 7, 10, mixLight(fl.color), 2);
      kit(x0 + 30, y0 + 23, 10, 7, 5, fl.color, 3);
      kit(x0 + 6, y0 + 22, 8, 8, 3.5, '#D7C7A8', 4);
      // little people
      for (let p = 0; p < 2; p++) {
        const px = x0 + 14 + p * 14 + Math.sin(frame / 14 + f + p) * 1.5;
        const py = y0 + 26 - p * 3;
        isoBox(ctx, px, py, z + 1.2, px + 1.6, py + 1.6, z + 1.2 + 4.4 * sc, ISO.ink, {bias: base + 3});
        isoBox(ctx, px + 0.1, py + 0.1, z + 1.2 + 4.4 * sc, px + 1.5, py + 1.5, z + 1.2 + 5.8 * sc, '#F2C9A0', {bias: base + 3.2});
      }
    }
  }
  // roof slab + roof
  const roofLift = sr * 18;
  const roofA = alphaOf(sr);
  if (roofA > 0.01) {
    isoBox(ctx, x0 - 1, y0 - 1, H + rise + roofLift, x1 + 1, y1 + 1, H + 1.5 + rise + roofLift, '#E9DCC2', {bias: 400});
    isoRoof(ctx, x0 - 1, y0 - 1, H + 1.5 + rise + roofLift, x1 + 1, y1 + 1, 8, roofColor, {bias: 401});
    if (roofA < 1) ctx.polys.slice(-5).forEach((p) => (p.alpha = roofA));
  }
  // front skins: +x wall (right) then +y wall (left) slide out along their normals
  const skin = (which: 'x' | 'y', s: number) => {
    const off = s * 14;
    const a = alphaOf(s);
    if (a <= 0.01) return;
    const n0 = ctx.polys.length;
    if (which === 'x') {
      const xx = x1 + off;
      isoPoly(ctx, [[xx, y0, rise], [xx, y1, rise], [xx, y1, H + rise], [xx, y0, H + rise]], wallT.right, {bias: 300});
      for (let f = 0; f < nF; f++)
        for (let wi = 0; wi < 4; wi++) {
          const wy = y0 + 3 + wi * 8;
          const wz = f * FH + 4 + rise;
          isoPoly(ctx, [[xx + 0.01, wy, wz + 6], [xx + 0.01, wy + 5, wz + 6], [xx + 0.01, wy + 5, wz], [xx + 0.01, wy, wz]], '#8FB4CF', {bias: 301});
        }
    } else {
      const yy = y1 + off;
      isoPoly(ctx, [[x0, yy, rise], [x1, yy, rise], [x1, yy, H + rise], [x0, yy, H + rise]], wallT.left, {bias: 300});
      for (let f = 0; f < nF; f++)
        for (let wi = 0; wi < 5; wi++) {
          const wx = x0 + 3 + wi * 8.4;
          const wz = f * FH + 4 + rise;
          isoPoly(ctx, [[wx, yy + 0.01, wz + 6], [wx + 5, yy + 0.01, wz + 6], [wx + 5, yy + 0.01, wz], [wx, yy + 0.01, wz]], '#A9C6DA', {bias: 301});
        }
      if (f0Door) isoPoly(ctx, [[x0 + 18, yy + 0.02, rise + 8], [x0 + 24, yy + 0.02, rise + 8], [x0 + 24, yy + 0.02, rise], [x0 + 18, yy + 0.02, rise]], ISO.soil[2], {bias: 302});
    }
    for (let i = n0; i < ctx.polys.length; i++) ctx.polys[i].alpha = a;
  };
  const f0Door = true;
  skin('x', s1);
  skin('y', s2);

  // hatched section rims where the skins were cut (thin strips on the cut edges)
  const rim1 = rimOf(s1);
  const rim2 = rimOf(s2);
  const rims: React.ReactNode[] = [];
  const strip = (pts: [number, number, number][], key: string, a: number) => {
    const P = pts.map((p) => isoP(ctx, p[0], p[1], p[2]).map((v) => v.toFixed(1)).join(',')).join(' ');
    rims.push(<polygon key={key} points={P} fill="url(#ica-hatch)" stroke={ISO.ink} strokeWidth={1.4 * u} opacity={a} />);
  };
  if (rim1 > 0) {
    strip([[x1, y0, rise], [x1, y0, H + rise], [x1 - 1.4, y0, H + rise], [x1 - 1.4, y0, rise]], 'r1', rim1);
    for (let f = 1; f <= nF; f++) strip([[x1, y0, f * FH + rise - (f === nF ? 0 : 0)], [x1, y1, f * FH + rise], [x1, y1, f * FH + rise - 1.2], [x1, y0, f * FH + rise - 1.2]], 'rs' + f, rim1);
  }
  if (rim2 > 0) {
    strip([[x0, y1, rise], [x0, y1, H + rise], [x0, y1 - 1.4, H + rise], [x0, y1 - 1.4, rise]], 'r2', rim2);
    for (let f = 1; f <= nF; f++) strip([[x0, y1, f * FH + rise], [x1, y1, f * FH + rise], [x1, y1, f * FH + rise - 1.2], [x0, y1, f * FH + rise - 1.2]], 'rt' + f, rim2);
  }

  // dashed cut lines (.3 s) before each slide
  const cutLine = (t0: number, which: 'x' | 'y') => {
    const kk = seg(frame, t0, t0 + 9);
    const fade = 1 - seg(frame, t0 + 9, t0 + 16);
    if (kk <= 0 || fade <= 0) return null;
    const pts: [number, number, number][] =
      which === 'x'
        ? [[x1, y0, rise], [x1, y0, H + rise], [x1, y1, H + rise], [x1, y1, rise]]
        : [[x0, y1, rise], [x0, y1, H + rise], [x1, y1, H + rise], [x1, y1, rise]];
    const P = pts.map((p) => isoP(ctx, p[0] + (which === 'x' ? 0.6 : 0), p[1] + (which === 'y' ? 0.6 : 0), p[2]));
    const segs = P.slice(1).map((p, i) => Math.hypot(p[0] - P[i][0], p[1] - P[i][1]));
    const len = segs.reduce((x, y) => x + y, 0);
    let rem = len * kk;
    const out: [number, number][] = [P[0]];
    for (let i = 0; i < segs.length && rem > 0; i++) {
      const t = Math.min(1, rem / segs[i]);
      out.push([lerp(P[i][0], P[i + 1][0], t), lerp(P[i][1], P[i + 1][1], t)]);
      rem -= segs[i];
    }
    return <path d={'M' + out.map((p) => p.join(' ')).join('L')} fill="none" stroke={accent} strokeWidth={3 * u} strokeDasharray={`${12 * u} ${8 * u}`} opacity={fade} strokeLinecap="round" />;
  };

  // floor callouts (right side)
  const labels = floors.map((fl, f) => {
    const t0 = tRoof + 8 + f * 6;
    const kk = eo3(seg(frame, t0, t0 + 8));
    if (kk <= 0) return null;
    const [ax, ay] = isoP(ctx, x1 - 4, y0 + 11.5, f * FH + 9 + rise);
    const lx = portrait ? Math.max(ax + 50 * u, w * 0.67) : Math.max(ax + 160 * u, w * 0.72);
    const ex = lerp(ax, lx, kk);
    const fs = (portrait ? 36 : 28) * u;
    return (
      <g key={'lb' + f} opacity={kk}>
        <circle cx={ax} cy={ay} r={5 * u} fill={ISO.ink} stroke={ISO.boardTop} strokeWidth={2 * u} />
        <path d={`M${ax} ${ay}L${ex} ${ay}`} stroke={ISO.ink} strokeWidth={2 * u} />
        {kk > 0.6 && (
          <g transform={`translate(${lx + 10 * u} ${ay})`} opacity={seg(kk, 0.6, 1)}>
            <text x={0} y={-4 * u} textAnchor="start" fontFamily={lf.jost} fontWeight={600} fontSize={fs} fill={ISO.ink} letterSpacing={fs * 0.12} stroke={background} strokeWidth={7 * u} paintOrder="stroke">
              {fl.label.toUpperCase()}
            </text>
            <text x={0} y={fs * 1.1} textAnchor="start" fontFamily={lf.jost} fontWeight={400} fontSize={fs * 1.05} fill={ISO.ink} stroke={background} strokeWidth={7 * u} paintOrder="stroke">
              {fl.value}
            </text>
          </g>
        )}
      </g>
    );
  });

  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="ica-hatch" width={7 * u} height={7 * u} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={7 * u} height={7 * u} fill={ISO.boardTop} />
            <rect width={1.8 * u} height={7 * u} fill={ISO.ink} />
          </pattern>
        </defs>
        <ellipse cx={ctx.cx} cy={isoP(ctx, 0, 0, 0)[1] + 10 * u} rx={(W + Dp) * k * 0.62} ry={(W + Dp) * k * 0.3} fill={ISO.ink} opacity={0.1} style={{filter: `blur(${16 * u}px)`}} />
        <IsoPolys ctx={ctx} />
        {rims}
        {cutLine(tCut1, 'x')}
        {cutLine(tCut2, 'y')}
        {labels}
      </svg>
      <div style={{position: 'absolute', left: w * 0.05, top: h * 0.06, opacity: eo3(seg(frame, 4, 16))}}>
        <div style={{fontFamily: lf.jost, fontWeight: 700, fontSize: (portrait ? 50 : 56) * u, color: ISO.ink}}>{title.toUpperCase()}</div>
        <div style={{width: 64 * u, height: 5 * u, background: accent, marginTop: 8 * u}} />
      </div>
    </AbsoluteFill>
  );
};

const mixLight = (c: string) => isoTri(c).top;
void cl;

export const isoCutaway = defineMotion<Props>({
  id: 'iso-cutaway',
  title: 'Iso cutaway',
  category: 'product',
  description:
    'A flat isometric building: a dashed cut line draws across its near wall, the skin slides out along its normal and fades, then the second wall and the roof follow; hatched cream/ink section rims stay on the cut edges and the floors inside (machines, desks, little people) pop up, each with a leader callout.',
  source: ['lemo-opuscar styles/iso-infographic (MIT, LemoLab) — DEMO.md cutaway timing, engine.js cutLine/hatch'],
  useFor: 'Show what is inside a product, server, building, factory or package — floor-by-floor explainers.',
  durationInFrames: 210,
  defaultProps: {
    title: 'Inside the roastery',
    floors: [
      {label: 'Green beans', value: '12 t stored', color: '#7BA75F'},
      {label: 'Roasting', value: '220 °C · 14 min', color: '#CF5140'},
      {label: 'Packing', value: '3,000 bags / day', color: '#E9BE5C'},
    ],
    wallColor: '#E4D6BC',
    roofColor: '#3C7FB1',
    cutAt: 30,
    background: ISO.ground,
    accent: ISO.subject[0],
  },
  propDocs: {
    title: 'title top-left',
    floors: 'floors bottom-up: {label, value, color (machines)}',
    wallColor: 'wall base colour (three tones derived)',
    roofColor: 'roof colour',
    cutAt: 'frame the first cut line starts',
    background: 'ground colour',
    accent: 'cut line + title rule colour',
  },
  component: IsoCutaway,
  tags: ['isometric', 'iso', 'cutaway', 'cross-section', 'inside', 'building', 'factory', 'product', 'explainer', 'hatch', 'infographic', 'floors', 'reveal'],
});
