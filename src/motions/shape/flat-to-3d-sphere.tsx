import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {P17, PrinciplesHud, typed} from '../../core/principles-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video17 flat-to-3d-sphere + callout-leader-labels + render-flatten (principle 11 "Solid Drawing").
 * A flat red disc gains a white rim + wireframe (meridians, parallels, crosshair) drawn on in sequence, a perspective
 * floor grid fades in with a small camera tilt, gradient 3D shading / specular / cast shadow crossfade in over a warm
 * studio gradient, leader-line callouts type in one by one, then everything flattens back to the flat disc.
 */
type Callout = {label: string; sub: string; anchor: [number, number]; side: number};
type Props = {
  background: string;
  studio: [string, string];
  color: string;
  highlight: string;
  shadowCore: string;
  callouts: Callout[];
  flattenAt: number;
  hud: boolean;
  numeral: string;
  title: string;
  subtitle: string;
  code: string;
};

const FlatTo3dSphere: React.FC<Props> = ({background, studio, color, highlight, shadowCore, callouts, flattenAt, hud, numeral, title, subtitle, code}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const R = (portrait ? 150 : 165) * u;
  const F = flattenAt;
  const pop = prog(frame, 0, 8, ease.back);
  const wireT = (i: number) => prog(frame, 8 + i * 2.4, 8 + i * 2.4 + 4.5, ease.out);
  const shade = prog(frame, 26, 46, ease.sine) * (1 - prog(frame, F, F + 12, ease.sine));
  const wireOut = 1 - prog(frame, 40, 54, ease.sine);
  const grid = prog(frame, 16, 32, ease.out) * (1 - prog(frame, F + 4, F + 16, ease.sine));
  const tilt = prog(frame, 26, 56, ease.inOut) * (1 - prog(frame, F, F + 14, ease.inOut));
  const floatY = Math.sin(((frame - 50) / 45) * Math.PI * 2) * 10 * u * prog(frame, 50, 64) * (1 - prog(frame, F - 6, F + 4));
  const x = cx;
  const by = cy - (portrait ? 60 : 30) * u + floatY;
  const contact = cy - (portrait ? 60 : 30) * u + R;
  const horizon = contact - R * 1.2 - 80 * u * tilt;
  const orbit = 0.18 * tilt; // parallels rotate a little with the implied camera orbit
  const id = 'f3d';
  const bgShade = shade;
  // floor grid
  const gridLines = [];
  if (grid > 0) {
    const gc = '#A9A396';
    for (let k = -12; k <= 12; k++) {
      const xb = x + k * 170 * u;
      gridLines.push(<line key={`v${k}`} x1={x + k * 12 * u} y1={horizon} x2={x + (xb - x) * 3} y2={horizon + (h - horizon) * 3} stroke={gc} strokeWidth={1 * u} />);
    }
    for (let z = 1; z <= 14; z++) {
      const y = horizon + (R * 2.2) / (1 + (14 - z) * 0.55);
      gridLines.push(<line key={`h${z}`} x1={0} x2={w} y1={y} y2={y} stroke={gc} strokeWidth={1 * u} />);
    }
  }
  const ell = (rx: number, ry: number, rot = 0) => ({rx, ry, transform: `rotate(${rot} ${x} ${by})`});
  const wire = [
    {kind: 'c'},
    {kind: 'm', rx: R * 0.42},
    {kind: 'm', rx: R * 0.8},
    {kind: 'p', dy: -0.45},
    {kind: 'p', dy: 0.4},
  ];
  const callIn = (i: number) => 58 + i * 11;
  const out = 1 - prog(frame, F - 10, F, ease.in);
  const shadowScale = shade * (1 - floatY / (60 * u));
  return (
    <AbsoluteFill style={{background}}>
      <AbsoluteFill style={{opacity: bgShade, background: `radial-gradient(ellipse at 50% ${(by / h) * 100}%, ${studio[0]} 0%, ${studio[0]} 25%, ${studio[1]} 100%)`}} />
      <Svg>
        <defs>
          <radialGradient id={`${id}-body`} cx="36%" cy="30%" r="78%">
            <stop offset="0" stopColor={highlight} />
            <stop offset="0.32" stopColor={color} />
            <stop offset="0.72" stopColor={interpolateColors(0.5, [0, 1], [color, shadowCore])} />
            <stop offset="1" stopColor={shadowCore} />
          </radialGradient>
          <radialGradient id={`${id}-refl`} cx="62%" cy="96%" r="45%">
            <stop offset="0" stopColor="#FF7A5C" stopOpacity={0.55} />
            <stop offset="1" stopColor="#FF7A5C" stopOpacity={0} />
          </radialGradient>
          <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={18 * u} />
          </filter>
          <filter id={`${id}-spec`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={3 * u} />
          </filter>
          <clipPath id={`${id}-clip`}>
            <circle cx={x} cy={by} r={R} />
          </clipPath>
          <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="1" stopColor="#fff" stopOpacity={1} />
          </linearGradient>
          <mask id={`${id}-gridmask`}>
            <rect x={0} y={horizon} width={w} height={h - horizon} fill={`url(#${id}-fade)`} />
          </mask>
        </defs>
        <g opacity={grid * 0.9} mask={`url(#${id}-gridmask)`}>
          {gridLines}
        </g>
        {/* cast shadow */}
        <ellipse cx={x + R * 0.38} cy={contact + R * 0.04} rx={R * 1.15 * shadowScale} ry={R * 0.26 * shadowScale} fill="#000" opacity={0.28 * shade} filter={`url(#${id}-blur)`} />
        <ellipse cx={x + R * 0.05} cy={contact - R * 0.02} rx={R * 0.5 * shade} ry={R * 0.06 * shade} fill="#2A0804" opacity={0.22 * shade} filter={`url(#${id}-blur)`} />
        {/* flat disc */}
        <g transform={`translate(${x} ${by}) scale(${pop}) translate(${-x} ${-by})`}>
          <circle cx={x} cy={by} r={R} fill={color} />
          <g opacity={shade}>
            <circle cx={x} cy={by} r={R} fill={`url(#${id}-body)`} />
            <g clipPath={`url(#${id}-clip)`}>
              <circle cx={x} cy={by} r={R} fill={`url(#${id}-refl)`} />
            </g>
            <rect
              x={x - R * 0.56}
              y={by - R * 0.56}
              width={R * 0.3}
              height={R * 0.17}
              rx={R * 0.085}
              fill="#fff"
              opacity={0.92}
              filter={`url(#${id}-spec)`}
              transform={`rotate(-38 ${x - R * 0.41} ${by - R * 0.47})`}
            />
          </g>
          {/* wireframe */}
          <g fill="none" stroke="#fff" strokeWidth={2 * u} opacity={wireOut * (1 - 0.0 * shade)}>
            {wire.map((wd, i) => {
              const t = wireT(i);
              if (t <= 0) return null;
              const dash = {pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - t};
              if (wd.kind === 'c') return <circle key={i} cx={x} cy={by} r={R} {...dash} transform={`rotate(-90 ${x} ${by})`} />;
              if (wd.kind === 'm') return <ellipse key={i} cx={x} cy={by} {...ell(wd.rx!, R, 0)} {...dash} strokeWidth={1.4 * u} opacity={0.85} />;
              const dy = wd.dy! * R;
              const rx = Math.sqrt(R * R - dy * dy);
              return <ellipse key={i} cx={x} cy={by + dy - orbit * R * 0.3} rx={rx} ry={rx * (0.16 + orbit)} {...dash} strokeWidth={1.4 * u} opacity={0.85} />;
            })}
            {wireT(5) > 0 && (
              <g strokeWidth={1.2 * u} opacity={0.8}>
                <line x1={x - R * wireT(5)} x2={x + R * wireT(5)} y1={by} y2={by} />
                <line x1={x} x2={x} y1={by - R * wireT(5)} y2={by + R * wireT(5)} />
              </g>
            )}
          </g>
        </g>
        {/* callouts */}
        {callouts.map((c, i) => {
          const t0 = callIn(i);
          const dot = prog(frame, t0, t0 + 3, ease.back) * out;
          const line = prog(frame, t0 + 3, t0 + 9, (k) => 1 - Math.pow(1 - k, 3));
          if (dot <= 0) return null;
          const ax = x + c.anchor[0] * R;
          const ay = (c.anchor[1] > 1.05 ? contact + (c.anchor[1] - 1) * R : by + c.anchor[1] * R);
          const diag = (portrait ? 46 : 70) * u;
          const shelf = (portrait ? 70 : 120) * u;
          const ex = ax + c.side * diag;
          const ey = ay - (c.anchor[1] < 0 ? diag * 0.8 : -diag * 0.5);
          const sx = ex + c.side * shelf;
          const L = Math.hypot(ex - ax, ey - ay) + shelf;
          return (
            <g key={i} opacity={out}>
              <circle cx={ax} cy={ay} r={4.5 * u * dot} fill={P17.ink} stroke="#fff" strokeWidth={1.2 * u} />
              <path d={`M ${ax} ${ay} L ${ex} ${ey} L ${sx} ${ey}`} fill="none" stroke={P17.ink} strokeWidth={1 * u} strokeDasharray={L} strokeDashoffset={L * (1 - line)} />
            </g>
          );
        })}
      </Svg>
      {callouts.map((c, i) => {
        const t0 = callIn(i) + 9;
        if (frame < t0) return null;
        const ax = x + c.anchor[0] * R;
        const ay = c.anchor[1] > 1.05 ? contact + (c.anchor[1] - 1) * R : by + c.anchor[1] * R;
        const diag = (portrait ? 46 : 70) * u;
        const shelf = (portrait ? 70 : 120) * u;
        const ex = ax + c.side * diag;
        const ey = ay - (c.anchor[1] < 0 ? diag * 0.8 : -diag * 0.5);
        const sx = ex + c.side * shelf;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: sx + c.side * 8 * u,
              top: ey - 15 * u,
              transform: c.side < 0 ? 'translateX(-100%)' : undefined,
              textAlign: c.side < 0 ? 'right' : 'left',
              opacity: out,
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: 12 * u, letterSpacing: '0.15em', color: P17.ink}}>{typed(c.label, frame, t0, 25)}</div>
            <div style={{fontFamily: fonts.mono, fontSize: 10 * u, letterSpacing: '0.08em', color: '#77736A', marginTop: 3 * u}}>{typed(c.sub, frame, t0 + 4, 30)}</div>
          </div>
        );
      })}
      {hud && <PrinciplesHud bg={background} numeral={numeral} title={title} subtitle={subtitle} code={code} />}
    </AbsoluteFill>
  );
};

export const flatTo3dSphere = defineMotion<Props>({
  id: 'flat-to-3d-sphere',
  title: 'Flat disc to 3D sphere',
  category: 'shape',
  description: 'A flat red disc gains a wireframe, a perspective floor grid and gradient 3D shading with specular and cast shadow, leader-line callouts (highlight, terminator, core shadow…) type in, then it renders back flat.',
  source: ['video17 0:30-0:34.5 flat-to-3d-sphere + callout-leader-labels', 'video17 0:38.3-0:38.7 render-flatten'],
  useFor: 'Explaining form / lighting / "2D vs 3D", product feature callouts on a hero object, before-after render reveals.',
  durationInFrames: 180,
  defaultProps: {
    background: P17.paper,
    studio: ['#FBF3E6', '#C2BDB1'],
    color: P17.red,
    highlight: '#FF6A50',
    shadowCore: '#5D100A',
    callouts: [
      {label: 'HIGHLIGHT', sub: 'where the light lands', anchor: [-0.4, -0.46], side: -1},
      {label: 'TERMINATOR', sub: 'light turns to shadow', anchor: [0.62, -0.3], side: 1},
      {label: 'CORE SHADOW', sub: 'darkest band', anchor: [0.6, 0.42], side: 1},
      {label: 'REFLECTED LIGHT', sub: 'bounce from the floor', anchor: [-0.25, 0.9], side: -1},
      {label: 'CAST SHADOW', sub: 'contact + falloff', anchor: [1.25, 1.08], side: 1},
    ],
    flattenAt: 150,
    hud: true,
    numeral: '11',
    title: 'SOLID DRAWING',
    subtitle: 'Think in volume, light and weight.',
    code: 'L = albedo·max(n·l, 0) + spec // light it like an object',
  },
  propDocs: {
    background: 'flat background (also the HUD colour reference)',
    studio: 'studio gradient [centre, vignette] shown while the ball is 3D',
    color: 'ball base colour',
    highlight: 'lit-side colour of the 3D shading',
    shadowCore: 'core-shadow colour',
    callouts: 'leader labels: anchor = [x, y] in ball radii from the centre (y > 1.05 = on the floor), side = -1 left / 1 right',
    flattenAt: 'frame the render flattens back to the flat disc',
    hud: 'show HUD chrome + chapter title',
  },
  component: FlatTo3dSphere,
  tags: ['sphere', '3d', 'shading', 'callout', 'wireframe', 'explainer', 'ball'],
});
