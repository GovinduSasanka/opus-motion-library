// Adapted from lemo-opuscar/styles/engraving/demo/engine/{burin.js,index.js,plate.js} (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {
  BPt,
  ENGRAVE,
  EngravedSheet,
  Ink,
  InkPaths,
  bboxOfPts,
  ellipsePts,
  engraveHatch,
  engraveShape,
  engravedReveal,
  eio,
  la2Fonts,
  parsePathD,
  seg,
} from '../../core/r2-la2-kit';

/**
 * burin-engrave-hatch — any SVG shape becomes a copperplate engraving that cuts itself in the engraver's order:
 * swelling outline runs, a sweep of parallel hatch lines whose width follows a modelled tone (distance-field pillow
 * lit from the top-left), a crossing family in the half-tones, a third lozenge family in the darks, a hatched cast
 * shadow — tone purely from line density. Then roman capitals are cut glyph by glyph under it.
 */
type Props = {
  path: string;
  title: string;
  subtitle: string;
  kicker: string;
  spacing: number;
  wMax: number;
  angle: number;
  lightX: number;
  lightY: number;
  passes: number;
  shadow: boolean;
  duration: number;
  ink: string;
  paper: string;
  push: number;
};

export const AMPHORA_D =
  'M440 110 L560 110 L556 140 C548 150 540 160 538 200 C536 260 560 290 620 330 C720 400 760 480 750 580 C740 690 660 780 580 830 L572 868 L612 900 L388 900 L428 868 L420 830 C340 780 260 690 250 580 C240 480 280 400 380 330 C440 290 464 260 462 200 C460 160 452 150 444 140 Z ' +
  'M548 196 C640 180 700 236 664 336 L644 326 C668 252 630 220 552 228 Z ' +
  'M452 196 C360 180 300 236 336 336 L356 326 C332 252 370 220 448 228 Z ' +
  'M286 470 C400 506 600 506 714 470 M272 640 C400 676 600 676 728 640 M476 128 L524 128';

const BurinEngraveHatch: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const D = Math.max(2, p.duration);
  const built = useMemo(() => {
    const subs = parsePathD(p.path || AMPHORA_D, 2);
    const all = subs.map((s) => s.pts);
    const bb = bboxOfPts(all);
    const figH = h * (portrait ? 0.46 : 0.62);
    const figW = w * 0.8;
    const s = Math.min(figH / (bb[3] - bb[1]), figW / (bb[2] - bb[0]));
    const cx = w / 2;
    const cy = h * (portrait ? 0.45 : 0.47);
    const ox = cx - ((bb[0] + bb[2]) / 2) * s;
    const oy = cy - ((bb[1] + bb[3]) / 2) * s;
    const tr = (q: BPt): BPt => [ox + q[0] * s, oy + q[1] * s];
    const polys = subs.filter((x) => x.closed).map((x) => x.pts.map(tr));
    const lines = subs.filter((x) => !x.closed).map((x) => x.pts.map(tr));
    const ink = new Ink();
    const light: BPt = [p.lightX, p.lightY];
    const sp = p.spacing * u;
    // each closed ring is modelled on its own (bodies, handles, parts)
    polys.forEach((poly, i) => {
      engraveShape(ink, [poly], i === 0 ? lines : [], {g: 'p', light, spacing: sp, wMax: p.wMax * u, outlineW: 2.0 * u, angle: p.angle, seed: 3 + i * 17, passes: p.passes, bend: 0.00025 / u});
    });
    // cast shadow on the ground, away from the light
    const fb = bboxOfPts(polys);
    let shadowPoly: BPt[] = [];
    if (p.shadow) {
      const sw = (fb[2] - fb[0]) * 0.62;
      shadowPoly = ellipsePts((fb[0] + fb[2]) / 2 + sw * 0.28, fb[3] + 4 * u, sw, sw * 0.13, 64);
      shadowPoly.pop();
      ink.group('sh');
      const scx = (fb[0] + fb[2]) / 2;
      engraveHatch(ink, [shadowPoly], {
        angle: 0,
        spacing: sp * 1.15,
        tone: (x, y) => 0.75 - Math.min(0.6, Math.hypot((x - scx - sw * 0.1) / (sw * 1.1), (y - fb[3]) / (sw * 0.15)) * 0.6),
        thr: 0.1,
        wMax: p.wMax * 0.8 * u,
        seed: 91,
        excl: polys,
      });
    }
    // schedule (seconds) — outline first with a couple of burins, then the hatch families sweep across
    ink.schedule('pol', 0.15, D * 0.24, 2);
    ink.schedule('ph1', D * 0.2, D * 0.55, 40);
    ink.schedule('ph2', D * 0.48, D * 0.72, 40);
    ink.schedule('ph3', D * 0.66, D * 0.85, 30);
    ink.schedule('sh', D * 0.7, D * 0.92, 20);
    return {ink, fb};
  }, [p.path, p.spacing, p.wMax, p.angle, p.lightX, p.lightY, p.passes, p.shadow, w, h, u, portrait, D]);
  const r = built.ink.render(t);
  // camera: starts as a loupe on the first cuts, eases out to the plate
  const zk = 1 + p.push * (1 - eio(seg(t, 0, D * 0.55)));
  const fb = built.fb;
  const fx0 = fb[0] + (fb[2] - fb[0]) * 0.32;
  const fy0 = fb[1] + (fb[3] - fb[1]) * 0.25;
  const camX = w / 2 + (fx0 - w / 2) * (1 - eio(seg(t, 0, D * 0.55)));
  const camY = h / 2 + (fy0 - h / 2) * (1 - eio(seg(t, 0, D * 0.55)));
  const breathe = 1 + 0.012 * seg(t, D, D + 3);
  const Z = zk * breathe;
  const tx = w / 2 - camX * Z;
  const ty = h / 2 - camY * Z;
  // lettering
  const titleSize = Math.min(54 * u, (w * 0.82) / Math.max(6, p.title.length * 0.78));
  const titleP = seg(t, D * 0.9, D * 0.9 + 1.2);
  const subP = seg(t, D * 0.9 + 0.8, D * 0.9 + 1.8);
  const kickP = seg(t, 0.2, 1.4);
  const ty0 = fb[3] + (portrait ? 150 : 90) * u;
  const glyphs = [...p.title];
  return (
    <AbsoluteFill style={{background: p.paper}}>
      <Svg>
        <g transform={`translate(${tx} ${ty}) scale(${Z})`}>
          <EngravedSheet id="beh-sheet" w={w} h={h} u={u} paper={p.paper} />
          <InkPaths paths={r.paths} color={p.ink} />
          {/* the burin's bright cut at every growing line */}
          {r.tips.slice(0, 40).map((q, i) => (
            <circle key={i} cx={q[0]} cy={q[1]} r={Math.max(1.2, q[2] * 0.9) * u} fill={p.ink} />
          ))}
          <text x={w / 2} y={ty0} textAnchor="middle" fontFamily={la2Fonts.bodoni} fontWeight={500} fontSize={titleSize} letterSpacing={titleSize * 0.16} fill={p.ink}>
            {glyphs.map((c, i) => (
              <tspan key={i} opacity={Math.min(1, engravedReveal(titleP, glyphs.length, i))}>
                {c}
              </tspan>
            ))}
          </text>
          <text x={w / 2} y={ty0 + titleSize * 0.95} textAnchor="middle" fontFamily={la2Fonts.bodoni} fontStyle="italic" fontSize={titleSize * 0.5} fill={p.ink} opacity={subP}>
            {p.subtitle}
          </text>
          <text x={w * 0.5} y={h * (portrait ? 0.09 : 0.105)} textAnchor="middle" fontFamily={la2Fonts.bodoni} fontWeight={500} fontSize={15 * u} letterSpacing={15 * u * 0.3} fill={p.ink} opacity={kickP}>
            {p.kicker}
          </text>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const burinEngraveHatch = defineMotion<Props>({
  id: 'burin-engrave-hatch',
  title: 'Burin engrave hatch',
  category: 'shape',
  description:
    'Any SVG shape becomes a copperplate engraving that cuts itself in order on laid paper: swelling outline runs, then parallel hatch lines whose width follows a lit distance-field tone, a crossing family in the half-tones, a lozenge family in the darks and a hatched cast shadow; roman capitals are cut glyph by glyph below.',
  source: ['lemo-opuscar styles/engraving (MIT, LemoLab) — demo/engine/burin.js hatch/outline/formTone, index.js engraveShape, plate.js'],
  useFor: 'Heritage logo or product reveals, museum labels, banknote / certificate looks, editorial illustration from any SVG path.',
  durationInFrames: 210,
  defaultProps: {
    path: AMPHORA_D,
    title: 'PLATE IV · THE AMPHORA',
    subtitle: 'a storage jar, after the antique',
    kicker: 'CABINET OF OBJECTS · VESSELS',
    spacing: 3.6,
    wMax: 1.7,
    angle: -0.6,
    lightX: -0.6,
    lightY: -0.7,
    passes: 3,
    shadow: true,
    duration: 5,
    ink: ENGRAVE.ink,
    paper: ENGRAVE.paper,
    push: 0.9,
  },
  propDocs: {
    path: 'SVG path d of the subject (closed subpaths are hatched, open ones become outline strokes); auto-fitted',
    title: 'roman-capital caption cut glyph by glyph',
    subtitle: 'italic line under the caption',
    kicker: 'small tracked caps line at the top',
    spacing: 'hatch spacing in px@1080 (≈ figure height / 180)',
    wMax: 'widest burin line in px@1080',
    angle: 'first hatch family angle (radians)',
    lightX: 'light direction x (toward the light, screen space)',
    lightY: 'light direction y',
    passes: '1–3 hatch families (3 = hatch + cross + lozenge)',
    shadow: 'hatched cast shadow on the ground',
    duration: 'seconds for the whole cut',
    ink: 'ink colour',
    paper: 'paper colour',
    push: 'extra loupe zoom at the start (0 = locked plate)',
  },
  component: BurinEngraveHatch,
  tags: ['engraving', 'copperplate', 'burin', 'hatching', 'cross-hatch', 'etching', 'intaglio', 'heritage', 'vintage', 'line-art', 'logo-reveal', 'banknote', 'museum', 'print', 'svg-path', 'draw-on'],
});
