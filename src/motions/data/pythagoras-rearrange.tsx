import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {rgbaStr} from '../../core/r2-pr3-kit';

/**
 * Pythagoras proof by rearrangement: a square of side a+b holds four identical right triangles around a tilted
 * c-square; three of the triangles slide (pure translations) into two a x b rectangles, leaving the a-square and
 * the b-square uncovered. Same big square, same four triangles, so a^2 + b^2 = c^2.
 */
type Props = {
  a: number;
  b: number;
  title: string;
  showLabels: boolean;
  background: string;
  ink: string;
  triangleColor: string;
  cColor: string;
  aColor: string;
  bColor: string;
};

type Tri = {r0: [number, number]; r1: [number, number]; xl: number; yl: number; t0: number};

const PythagorasRearrange: React.FC<Props> = ({a: aIn, b: bIn, title, showLabels, background, ink, triangleColor, cColor, aColor, bColor}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, portrait} = useStage();
  const a = Math.max(0.2, aIn);
  const b = Math.max(0.2, bIn);
  const s = a + b;
  const S = Math.min(w * 0.78, h * (portrait ? 0.5 : 0.58));
  const k = S / s;
  const X0 = cx - S / 2;
  const Y0 = portrait ? h * 0.3 : h * 0.2;
  const P = (x: number, y: number) => `${(X0 + x * k).toFixed(1)},${(Y0 + y * k).toFixed(1)}`;

  // four triangles: right-angle corner r0 (config c^2) -> r1 (config a^2 + b^2), signed legs along x and y
  const tris: Tri[] = [
    {r0: [0, 0], r1: [0, a], xl: a, yl: b, t0: 84},
    {r0: [s, 0], r1: [s, 0], xl: -b, yl: a, t0: 0},
    {r0: [s, s], r1: [a, s], xl: -a, yl: -b, t0: 102},
    {r0: [0, s], r1: [a, a], xl: b, yl: -a, t0: 120},
  ];

  const boxT = prog(frame, 0, 22, ease.inOut);
  const titleIn = prog(frame, 6, 30, ease.out);
  const cIn = prog(frame, 40, 58, ease.out);
  const moveStart = 84;
  const cOut = prog(frame, moveStart, moveStart + 16, ease.inOut);
  const abIn = prog(frame, 146, 166, ease.out);
  const legLab = prog(frame, 50, 64, ease.out) * (1 - prog(frame, 78, 88, ease.inOut));
  const eqT = (i: number) => prog(frame, 160 + i * 9, 176 + i * 9, ease.out);
  const sw = 3 * u;
  const fsLab = Math.max(30, S * 0.075);

  const perim = 4 * S;
  const tiltPts = [P(a, 0), P(s, a), P(b, s), P(0, b)].join(' ');

  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        {/* title */}
        <text
          x={cx}
          y={Y0 - (portrait ? 90 : 62) * u}
          textAnchor="middle"
          fontSize={(portrait ? 56 : 50) * u}
          fontFamily={fonts.serif}
          fontWeight={700}
          fill={ink}
          opacity={titleIn}
          transform={`translate(0 ${(1 - titleIn) * 14 * u})`}
        >
          {title}
        </text>

        {/* c^2 region (tilted square) */}
        <polygon points={tiltPts} fill={rgbaStr(cColor, 0.85 * cIn * (1 - cOut))} />
        {/* a^2 and b^2 regions */}
        <rect x={X0} y={Y0} width={a * k} height={a * k} fill={rgbaStr(aColor, 0.85 * abIn)} />
        <rect x={X0 + a * k} y={Y0 + a * k} width={b * k} height={b * k} fill={rgbaStr(bColor, 0.85 * abIn)} />

        {/* triangles */}
        {tris.map((t, i) => {
          const pop = prog(frame, 16 + i * 6, 34 + i * 6, ease.back);
          const mv = t.t0 > 0 ? prog(frame, t.t0, t.t0 + 26, ease.inOut) : 0;
          const rx = lerp(t.r0[0], t.r1[0], mv);
          const ry = lerp(t.r0[1], t.r1[1], mv);
          const lift = Math.sin(mv * Math.PI) * 10 * u;
          const gx = X0 + (rx + t.xl / 3) * k;
          const gy = Y0 + (ry + t.yl / 3) * k;
          const pts = [P(rx, ry), P(rx + t.xl, ry), P(rx, ry + t.yl)].join(' ');
          const sq = 0.12 * Math.min(a, b);
          const sx = Math.sign(t.xl) * sq;
          const sy = Math.sign(t.yl) * sq;
          return (
            <g key={i} transform={`translate(${gx} ${gy - lift}) scale(${pop}) translate(${-gx} ${-gy})`} opacity={Math.min(1, pop * 1.5)}>
              {lift > 0.5 && <polygon points={pts} fill={rgbaStr(ink, 0.18)} transform={`translate(${lift * 0.6} ${lift * 1.2})`} />}
              <polygon points={pts} fill={triangleColor} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
              <polyline points={[P(rx + sx, ry), P(rx + sx, ry + sy), P(rx, ry + sy)].join(' ')} fill="none" stroke={rgbaStr(ink, 0.6)} strokeWidth={sw * 0.7} />
            </g>
          );
        })}

        {/* big square outline draws on */}
        <rect x={X0} y={Y0} width={S} height={S} fill="none" stroke={ink} strokeWidth={sw * 1.4} strokeDasharray={`${perim * boxT} ${perim}`} strokeLinejoin="round" />

        {/* labels */}
        {showLabels && (
          <g fontFamily={fonts.serif} fontStyle="italic" fill={ink}>
            <g opacity={legLab} fontSize={fsLab * 0.75} textAnchor="middle">
              <text x={X0 + (a / 2) * k} y={Y0 - 14 * u}>a</text>
              <text x={X0 - 22 * u} y={Y0 + (b / 2) * k + fsLab * 0.25}>b</text>
              <text x={X0 + (a / 2) * k + 18 * u} y={Y0 + (b / 2) * k + 10 * u} textAnchor="start">c</text>
            </g>
            <text x={X0 + (s / 2) * k} y={Y0 + (s / 2) * k + fsLab * 0.35} textAnchor="middle" fontSize={fsLab * 1.1} fontWeight={700} opacity={cIn * (1 - cOut)}>
              c²
            </text>
            <text x={X0 + (a / 2) * k} y={Y0 + (a / 2) * k + fsLab * 0.33} textAnchor="middle" fontSize={fsLab} fontWeight={700} opacity={abIn}>
              a²
            </text>
            <text x={X0 + (a + b / 2) * k} y={Y0 + (a + b / 2) * k + fsLab * 0.35} textAnchor="middle" fontSize={fsLab * 1.1} fontWeight={700} opacity={abIn}>
              b²
            </text>
          </g>
        )}

        {/* equation */}
        <text x={cx} y={Y0 + S + (portrait ? 150 : 100) * u} textAnchor="middle" fontSize={(portrait ? 76 : 64) * u} fontFamily={fonts.serif} fontStyle="italic" fontWeight={700}>
          <tspan fill={aColor} opacity={eqT(0)}>a²</tspan>
          <tspan fill={ink} opacity={eqT(1)}> + </tspan>
          <tspan fill={bColor} opacity={eqT(1)}>b²</tspan>
          <tspan fill={ink} opacity={eqT(2)}> = </tspan>
          <tspan fill={cColor} opacity={eqT(3)}>c²</tspan>
        </text>
      </Svg>
    </AbsoluteFill>
  );
};

export const pythagorasRearrange = defineMotion<Props>({
  id: 'pythagoras-rearrange',
  title: 'Pythagoras proof by rearrangement',
  category: 'data',
  description:
    'A square of side a+b draws on; four right triangles pop in around a tilted c-square, then three of them slide into two rectangles, uncovering the a-square and the b-square, and a² + b² = c² writes itself below.',
  source: ['original design: classic rearrangement proof of the Pythagorean theorem'],
  useFor: 'Maths lessons, geometry explainers, "the proof in 7 seconds" shorts, and any "same pieces, new arrangement" idea.',
  durationInFrames: 220,
  defaultProps: {
    a: 3,
    b: 4,
    title: 'Why a² + b² = c²',
    showLabels: true,
    background: '#F4EFE6',
    ink: '#1F2A44',
    triangleColor: '#F2B33D',
    cColor: '#5B8DEF',
    aColor: '#E2584D',
    bColor: '#43A57A',
  },
  propDocs: {
    a: 'short leg length (relative)',
    b: 'long leg length (relative)',
    title: 'caption above the square',
    showLabels: 'side and area labels (a, b, c, a², b², c²)',
    background: 'background colour',
    ink: 'outline and text colour',
    triangleColor: 'fill of the four right triangles',
    cColor: 'c² square / equation colour',
    aColor: 'a² square / equation colour',
    bColor: 'b² square / equation colour',
  },
  component: PythagorasRearrange,
  tags: ['math', 'maths', 'geometry', 'pythagoras', 'pythagorean theorem', 'proof', 'triangle', 'square', 'education', 'explainer', 'rearrange', 'area', 'teaching'],
});
