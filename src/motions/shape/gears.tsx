import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {mix, shade} from '../../core/shape-kit';
import {PaperTexture, Svg, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video20 183.7-189 s `meshing-gears` (+ video19 13.35-14.4 s hatched background gears): procedural cog
 * wheels that mesh and counter-rotate at the exact tooth ratio (phase-locked so teeth interlock), with
 * spokes, hub and pencil hatching. "filled" = muted coloured-pencil gears on paper; "line" = white line-art
 * gears with grey hatching on near-black.
 */
type GearSpec = {teeth: number; parent: number; angle: number; color?: string};
type Props = {
  style: 'filled' | 'line';
  gears: GearSpec[];
  module: number;
  speed: number;
  colors: string[];
  background: string;
  inkColor: string;
  hatch: boolean;
  origin: number[];
};

const DEFAULT_GEARS: GearSpec[] = [
  {teeth: 24, parent: -1, angle: 0},
  {teeth: 12, parent: 0, angle: -30},
  {teeth: 20, parent: 1, angle: 20},
  {teeth: 14, parent: 2, angle: -70},
  {teeth: 28, parent: 0, angle: 160},
  {teeth: 10, parent: 0, angle: 245},
  {teeth: 16, parent: 2, angle: 85},
  {teeth: 12, parent: 4, angle: 280},
];

type Placed = GearSpec & {x: number; y: number; R: number; idx: number; depth: number};

const backOut = Easing.out(Easing.back(1.4));

const Gears: React.FC<Props> = ({style, gears, module, speed, colors, background, inkColor, hatch, origin}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait, durationInFrames} = useStage();
  const line = style === 'line';
  const bg = background || (line ? '#101318' : '#E1D7C5');
  const ink = inkColor || (line ? '#D9DCE3' : '#2E2A26');
  const palette = colors.length ? colors : line ? ['#2A2B30', '#2F3036', '#26272C'] : ['#CFB68C', '#B59A8F', '#D9CBB0', '#C9A877', '#BFA59A'];
  const spec = gears.length ? gears : DEFAULT_GEARS;
  const m = module * u;

  const placed = useMemo(() => {
    const out: Placed[] = [];
    const ox = (origin[0] ?? (portrait ? 0.4 : 0.4)) * w;
    const oy = (origin[1] ?? (portrait ? 0.47 : 0.55)) * h;
    spec.forEach((g, i) => {
      const R = (m * g.teeth) / 2;
      if (g.parent < 0 || !out[g.parent]) {
        out.push({...g, x: ox, y: oy, R, idx: i, depth: 0});
        return;
      }
      const p = out[g.parent];
      const a = ((g.angle + (portrait ? 90 : 0)) * Math.PI) / 180;
      const d = p.R + R;
      out.push({...g, x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, R, idx: i, depth: p.depth + 1});
    });
    return out;
  }, [spec, m, w, h, portrait, origin]);

  // rotation: root spins at `speed` deg/s with a soft spin-up; children phase-locked to their parent
  const T = 24;
  const tt = frame <= T ? (frame * frame) / (2 * T) : frame - T / 2;
  const rootRot = ((speed / 30) * tt * Math.PI) / 180;
  const rot: number[] = [];
  placed.forEach((g, i) => {
    if (g.parent < 0 || !placed[g.parent]) {
      rot[i] = rootRot + i * 0.3;
      return;
    }
    const p = placed[g.parent];
    const psi = Math.atan2(g.y - p.y, g.x - p.x);
    const q = ((psi - rot[g.parent]) * p.teeth) / (Math.PI * 2);
    rot[i] = psi + Math.PI - ((0.5 - q) * Math.PI * 2) / g.teeth;
  });

  const profile = (d: number) => {
    // d = distance from tooth centre in [0, 0.5] (in tooth periods)
    if (line) {
      if (d < 0.17) return 1;
      if (d < 0.31) return Math.cos(((d - 0.17) / 0.14) * Math.PI);
      return -1;
    }
    return Math.max(-1, Math.min(1, 1.5 * Math.cos(Math.PI * 2 * d) + 0.25));
  };

  const gearPath = (g: Placed, r0: number) => {
    const n = g.teeth * 14;
    const hh = m * 0.55;
    let d = '';
    for (let i = 0; i <= n; i++) {
      const th = (i / n) * Math.PI * 2;
      const f = (((th / (Math.PI * 2)) * g.teeth) % 1 + 1) % 1;
      const dd = Math.min(f, 1 - f);
      const rr = g.R + hh * profile(dd);
      const a = th + r0;
      d += `${i ? 'L' : 'M'} ${(g.x + Math.cos(a) * rr).toFixed(1)} ${(g.y + Math.sin(a) * rr).toFixed(1)} `;
    }
    return d + 'Z';
  };
  const circ = (x: number, y: number, r: number) => `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;

  const sw = (line ? 1.6 : 2.6) * u;
  const push = 1 + 0.04 * prog(frame, 0, durationInFrames, ease.sine);

  return (
    <AbsoluteFill style={{background: bg}}>
      {!line && <PaperTexture opacity={0.45} />}
      <Svg>
        <defs>
          <pattern id="gears-hatch" patternUnits="userSpaceOnUse" width={7 * u} height={7 * u} patternTransform="rotate(62)">
            <line x1={0} y1={0} x2={0} y2={7 * u} stroke={line ? '#5A5D68' : ink} strokeWidth={(line ? 1 : 1.3) * u} opacity={line ? 0.8 : 0.32} />
          </pattern>
          <pattern id="gears-hatch2" patternUnits="userSpaceOnUse" width={7 * u} height={7 * u} patternTransform="rotate(-28)">
            <line x1={0} y1={0} x2={0} y2={7 * u} stroke={line ? '#5A5D68' : ink} strokeWidth={1 * u} opacity={line ? 0.5 : 0.22} />
          </pattern>
        </defs>
        <g transform={`translate(${cx} ${cy}) scale(${push}) translate(${-cx} ${-cy})`}>
          {placed
            .slice()
            .sort((a, b) => a.depth - b.depth)
            .map((g) => {
              const i = g.idx;
              const col = g.color ?? palette[i % palette.length];
              const pop = backOut(Math.min(1, Math.max(0, (frame - 2 - g.depth * 6 - i * 2) / 14)));
              if (pop <= 0) return null;
              const r0 = rot[i];
              const rimR = g.R - m * 1.6;
              const hubR = Math.max(g.R * 0.2, m * 1.2);
              const spokes = g.teeth >= 16 ? 5 : 0;
              const light = line ? shade(col, 0.06) : mix(col, bg, 0.55);
              const spokeEls: string[] = [];
              for (let k = 0; k < spokes; k++) {
                const a = r0 + (k / spokes) * Math.PI * 2;
                const hw = g.R * 0.07;
                const px = -Math.sin(a) * hw;
                const py = Math.cos(a) * hw;
                const x0 = g.x + Math.cos(a) * hubR * 0.8;
                const y0 = g.y + Math.sin(a) * hubR * 0.8;
                const x1 = g.x + Math.cos(a) * (rimR + 2 * u);
                const y1 = g.y + Math.sin(a) * (rimR + 2 * u);
                spokeEls.push(`M ${x0 + px} ${y0 + py} L ${x1 + px * 1.4} ${y1 + py * 1.4} L ${x1 - px * 1.4} ${y1 - py * 1.4} L ${x0 - px} ${y0 - py} Z`);
              }
              const holes =
                spokes === 0
                  ? Array.from({length: 4}, (_, k) => {
                      const a = r0 + (k / 4) * Math.PI * 2 + Math.PI / 4;
                      const rr = (rimR + hubR) / 2;
                      return circ(g.x + Math.cos(a) * rr, g.y + Math.sin(a) * rr, (rimR - hubR) * 0.32);
                    }).join(' ')
                  : '';
              const body = gearPath(g, r0);
              return (
                <g key={i} transform={`translate(${g.x} ${g.y}) scale(${pop}) translate(${-g.x} ${-g.y})`} opacity={Math.min(1, pop * 1.5)}>
                  {!line && <path d={body} fill={shade(col, -0.35)} opacity={0.25} transform={`translate(${6 * u} ${8 * u})`} />}
                  <path d={body} fill={col} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
                  {hatch && <path d={body} fill="url(#gears-hatch)" />}
                  {spokes > 0 ? (
                    <>
                      <path d={circ(g.x, g.y, rimR)} fill={light} stroke={ink} strokeWidth={sw * 0.85} />
                      {hatch && <path d={circ(g.x, g.y, rimR)} fill="url(#gears-hatch2)" />}
                      <path d={spokeEls.join(' ')} fill={col} stroke={ink} strokeWidth={sw * 0.85} strokeLinejoin="round" />
                      {hatch && <path d={spokeEls.join(' ')} fill="url(#gears-hatch)" />}
                    </>
                  ) : (
                    <>
                      <path d={circ(g.x, g.y, rimR)} fill="none" stroke={ink} strokeWidth={sw * 0.6} opacity={0.7} />
                      <path d={holes} fill={light} stroke={ink} strokeWidth={sw * 0.8} />
                    </>
                  )}
                  <path d={circ(g.x, g.y, hubR)} fill={col} stroke={ink} strokeWidth={sw * 0.9} />
                  {hatch && <path d={circ(g.x, g.y, hubR)} fill="url(#gears-hatch2)" />}
                  <path d={circ(g.x, g.y, hubR * 0.38)} fill={line ? bg : shade(col, -0.55)} stroke={ink} strokeWidth={sw * 0.7} />
                  {line && <path d={circ(g.x, g.y, g.R - m * 0.95)} fill="none" stroke={ink} strokeWidth={sw * 0.5} opacity={0.45} strokeDasharray={`${2 * u} ${5 * u}`} />}
                </g>
              );
            })}
        </g>
      </Svg>
      {!line ? <Vignette strength={0.3} color="110,90,60" /> : <Vignette strength={0.5} />}
    </AbsoluteFill>
  );
};

export const gears = defineMotion<Props>({
  id: 'gears',
  title: 'Meshing gears',
  category: 'shape',
  description: 'Procedural hatched cog wheels pop in and mesh, counter-rotating at the correct tooth ratios; coloured-pencil gears on paper or white line-art gears on black.',
  source: ['video20 3:03.7-3:09', 'video19 0:13.35-0:14.4 (background gears)'],
  useFor: '"How it works" / process / mechanism sections, cause and effect, teamwork, machinery of an idea.',
  durationInFrames: 150,
  defaultProps: {
    style: 'filled',
    gears: [],
    module: 22,
    speed: 14,
    colors: [],
    background: '',
    inkColor: '',
    hatch: true,
    origin: [],
  },
  propDocs: {
    style: '"filled" (video20 coloured pencil on paper) or "line" (video19 white line art on black)',
    gears: 'list of {teeth, parent, angle(deg), color?}: each gear meshes with its parent at that angle; [] = built-in 8-gear train',
    module: 'tooth size in u (pitch radius = module x teeth / 2)',
    speed: 'root gear speed in degrees per second (children follow the tooth ratio)',
    colors: 'gear fill colours, cycled ([] = style palette)',
    background: 'background colour ("" = style default)',
    inkColor: 'outline colour ("" = style default)',
    hatch: 'pencil hatching on the faces',
    origin: '[x, y] of the root gear as fractions of the frame ([] = default)',
  },
  component: Gears,
  tags: ['gears', 'mechanism', 'process', 'machine', 'hatch'],
});
