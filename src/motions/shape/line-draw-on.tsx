import React, {useMemo} from 'react';
import {noise2D} from '@remotion/noise';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {getBoundingBox, getLength, getPointAtLength} from '@remotion/paths';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {dash1} from '../../core/shape-kit';
import {HandTool, resamplePath, retractDash, taperPolygon, wobblePolyline} from '../../core/r2-e3-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Generic line-art construction (video1 crease-line-draw, video20 line-by-line-construct,
 * video10 stroke-draw-frames, video19 engrave-stroke-draw): an ordered list of SVG paths is stroked on
 * one by one with a stagger (easeInOutQuad), a pen nib rides each stroke tip with a "+" flash where it
 * starts, then groups of lines recolour to a highlight colour. Defaults to a blueprint elevation.
 */
type Props = {
  paths: string[];
  groups: number[];
  background: string;
  grid: boolean;
  strokeColor: string;
  strokeWidth: number;
  highlightColor: string;
  highlightGroups: number[];
  drawFrames: number;
  stagger: number;
  startFrame: number;
  pen: boolean;
  engrave: boolean;
  fillOpacity: number;
  caption: string;
  margin: number;
  /** round-2 extensions (all default to the original blueprint look) */
  medium: 'clean' | 'cable' | 'crayon' | 'fineliner';
  surface: 'blueprint' | 'whiteboard' | 'chalkboard' | 'paper';
  hand: 'none' | 'marker' | 'pen' | 'chalk';
  cables: {from: [number, number]; to: [number, number]; color?: string; lift?: number}[];
  wobble: number;
  boilFps: number;
  taper: number;
  overshoot: number;
  gapChance: number;
  seed: number;
  retractAt: number;
  retractFrames: number;
  retractPieces: number;
};

/** cable demo (x8 breadboard): a board with pin rows and four tactile cables of different colours */
const CABLE_DEMO = (() => {
  const out: {d: string; g: number; col?: string}[] = [];
  out.push({d: 'M 120 330 H 880 V 600 H 120 Z', g: 0});
  const cols = ['#E5483B', '#F2B632', '#35B36B', '#3E7BE0'];
  [
    [[190, 360], [470, 150], 0.2],
    [[302, 360], [640, 90], 0.14],
    [[582, 566], [820, 210], 0.18],
    [[750, 540], [900, 120], 0.12],
  ].forEach((c, i) => {
    const [a, b, lift] = c as [number[], number[], number];
    const lx = lift * 640;
    out.push({d: `M ${a[0]} ${a[1]} C ${a[0]} ${a[1] - lx} ${b[0]} ${b[1] + lx * 0.4} ${b[0]} ${b[1]}`, g: 1, col: cols[i]});
  });
  for (let i = 0; i < 12; i++) out.push({d: `M ${190 + i * 56} 360 v 26`, g: 0});
  for (let i = 0; i < 12; i++) out.push({d: `M ${190 + i * 56} 540 v 26`, g: 0});
  return out;
})();

const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;

/** default blueprint: two-building elevation, window grid, dimension lines (video20 172.5-175 s) */
const BLUEPRINT: {d: string; g: number}[] = (() => {
  const out: {d: string; g: number}[] = [];
  const L = (d: string, g = 0) => out.push({d, g});
  L('M 40 560 L 960 560'); // ground (overshoots like construction lines)
  L('M 200 578 L 200 238');
  L('M 560 578 L 560 238');
  L('M 182 250 L 578 250');
  L('M 160 280 L 380 104 L 600 280');
  L('M 640 578 L 640 142');
  L('M 624 160 L 876 160');
  L('M 860 578 L 860 142');
  L('M 380 196 m -30 0 a 30 30 0 1 0 60 0 a 30 30 0 1 0 -60 0', 1);
  L('M 345 560 L 345 432 L 415 432 L 415 560', 1);
  L(rect(236, 290, 74, 64), 1);
  L(rect(450, 290, 74, 64), 1);
  L(rect(236, 408, 74, 64), 1);
  L(rect(450, 408, 74, 64), 1);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) L(rect(668 + c * 60, 190 + r * 78, 44, 50), 1);
  L('M 640 500 L 860 500');
  L('M 200 604 L 560 604', 2);
  L('M 200 592 L 200 616', 2);
  L('M 560 592 L 560 616', 2);
  L('M 910 160 L 910 560', 2);
  L('M 898 160 L 922 160', 2);
  L('M 898 560 L 922 560', 2);
  L('M 96 96 m -36 0 a 36 36 0 1 0 72 0 a 36 36 0 1 0 -72 0', 2);
  L('M 96 46 L 96 146 M 46 96 L 146 96', 2);
  return out;
})();

const inOutQuad = Easing.inOut(Easing.quad);

const SURFACES = {
  whiteboard: {bg: '#F6F7F5', ink: '#1F2A44', hl: '#E5483B'},
  chalkboard: {bg: '#2F3B35', ink: '#ECECE4', hl: '#F2D16B'},
  paper: {bg: '#EFE9DC', ink: '#2B2520', hl: '#C8363A'},
} as const;

const LineDrawOn: React.FC<Props> = ({paths, groups, background: bgIn, grid: gridIn, strokeColor: inkIn, strokeWidth, highlightColor: hlIn, highlightGroups, drawFrames, stagger, startFrame, pen, engrave, fillOpacity, caption, margin, medium, surface, hand, cables, wobble, boilFps, taper, overshoot, gapChance, seed, retractAt, retractFrames, retractPieces}) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames, portrait, fps} = useStage();
  const mg = portrait ? margin * 0.45 : margin;
  const surf = surface !== 'blueprint' ? SURFACES[surface] : null;
  const background = surf ? surf.bg : bgIn;
  const strokeColor = surf ? surf.ink : inkIn;
  const highlightColor = surf ? surf.hl : hlIn;
  const grid = surf ? false : gridIn;
  const penDots = pen && hand === 'none' && medium !== 'cable';

  const items = useMemo(() => {
    const cableSrc = cables.length
      ? cables.map((c, i) => {
          const lx = (c.lift ?? 0.16) * 640;
          return {d: `M ${c.from[0]} ${c.from[1]} C ${c.from[0]} ${c.from[1] - lx} ${c.to[0]} ${c.to[1] + lx * 0.4} ${c.to[0]} ${c.to[1]}`, g: 1, col: c.color ?? ['#E5483B', '#F2B632', '#35B36B', '#3E7BE0'][i % 4]};
        })
      : null;
    const src: {d: string; g: number; col?: string}[] = paths.length ? paths.map((d, i) => ({d, g: groups[i] ?? 0})) : cableSrc ?? (medium === 'cable' ? CABLE_DEMO : BLUEPRINT);
    return src.map((p) => {
      let len = 1;
      try {
        len = getLength(p.d);
      } catch {
        len = 1;
      }
      return {...p, len};
    });
  }, [paths, groups, cables, medium]);

  const box = useMemo(() => {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const it of items) {
      try {
        const b = getBoundingBox(it.d);
        x0 = Math.min(x0, b.x1);
        y0 = Math.min(y0, b.y1);
        x1 = Math.max(x1, b.x2);
        y1 = Math.max(y1, b.y2);
      } catch {
        /* ignore malformed path */
      }
    }
    if (!isFinite(x0)) return {x0: 0, y0: 0, x1: 1000, y1: 640};
    return {x0, y0, x1, y1};
  }, [items]);

  const bw = box.x1 - box.x0 || 1;
  const bh = box.y1 - box.y0 || 1;
  const S = Math.min((w * (1 - 2 * mg)) / bw, (h * (1 - 2 * mg)) / bh);
  const push = 1 + 0.035 * prog(frame, 0, durationInFrames, ease.sine);
  const tx = w / 2 - ((box.x0 + box.x1) / 2) * S;
  const ty = h / 2 - ((box.y0 + box.y1) / 2) * S;

  // schedule: fit all strokes into ~60% of the duration
  const n = items.length;
  const st = n > 1 ? Math.max(0.6, Math.min(stagger, (durationInFrames * 0.6 - startFrame - drawFrames) / (n - 1))) : 0;
  const drawEnd = startFrame + (n - 1) * st + drawFrames;
  const groupIds = highlightGroups.filter((g) => items.some((it) => it.g === g));
  const hlStart = drawEnd + 8;
  const hlGap = Math.max(6, Math.min(14, (durationInFrames - 20 - hlStart) / Math.max(1, groupIds.length)));

  const sw = (strokeWidth * u) / S;
  const panelIn = prog(frame, 0, 10, ease.out);

  const strokes = items.map((it, i) => {
    const s0 = startFrame + i * st;
    const p = inOutQuad(clamp((frame - s0) / drawFrames));
    const gi = groupIds.indexOf(it.g);
    const hp = gi >= 0 ? inOutQuad(clamp((frame - hlStart - gi * hlGap - (i % 6) * 0.8) / 9)) : 0;
    const closed = /z\s*$/i.test(it.d.trim());
    const rp = retractAt > 0 ? inOutQuad(clamp((frame - retractAt - (i % 5) * 1.5) / Math.max(1, retractFrames))) : 0;
    return {it, i, p, hp, s0, closed, rp};
  });

  // hand-made media: wobbly resampled polylines, re-seeded every boil step
  const boilStep = medium === 'crayon' || medium === 'fineliner' ? Math.floor((frame * Math.max(1, boilFps)) / fps) : 0;
  const hand2 = medium === 'crayon' || medium === 'fineliner';
  const polys = useMemo(() => {
    if (!hand2) return [];
    return items.map((it, i) => {
      const step = Math.max(1.5, (medium === 'crayon' ? 3 : 1.6 * strokeWidth) * u) / S;
      return {base: resamplePath(it.d, step), i};
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, hand2, S, u, medium, strokeWidth]);
  const poly = (i: number, layer: number) => {
    const base = polys[i]?.base ?? [];
    if (!base.length) return base;
    let pts = base;
    if (medium === 'fineliner' && overshoot > 0) {
      const a = pts[0];
      const b = pts[1];
      const z = pts[pts.length - 1];
      const y = pts[pts.length - 2];
      const oa = (overshoot * u * 0.5) / S;
      const ob = (overshoot * u) / S;
      const ta = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
      const tb = Math.hypot(z[0] - y[0], z[1] - y[1]) || 1;
      pts = [[a[0] + ((a[0] - b[0]) / ta) * oa, a[1] + ((a[1] - b[1]) / ta) * oa], ...pts, [z[0] + ((z[0] - y[0]) / tb) * ob, z[1] + ((z[1] - y[1]) / tb) * ob]];
    }
    return wobblePolyline(pts, `ld${seed}-${i}-${layer}`, (wobble * u) / S, 0.018 * S / u, boilStep * 0.9 + layer * 3.1);
  };
  const gapOf = (i: number): [number, number] | null => {
    if (gapChance <= 0) return null;
    const r = noise2D(`gap${seed}`, i * 1.31, 0.5);
    if ((r + 1) / 2 > gapChance) return null;
    const c = 0.25 + 0.5 * ((noise2D(`gapc${seed}`, i * 0.77, 1.5) + 1) / 2);
    return [c, c + 0.035];
  };

  // the active stroke drives the hand sprite; it lifts and travels between strokes
  const handPos = (() => {
    if (hand === 'none' || !items.length) return null;
    const idx = Math.max(0, Math.min(n - 1, Math.floor((frame - startFrame) / Math.max(1, st))));
    const cur = strokes[idx];
    const prev = strokes[Math.max(0, idx - 1)];
    const live = clamp(cur.p, 0, 1);
    const pt = getPointAtLength(cur.it.d, cur.it.len * live);
    const pp = getPointAtLength(prev.it.d, prev.it.len);
    const travel = idx > 0 ? clamp((frame - cur.s0) / 4) : 1;
    const lift = idx > 0 ? Math.sin(Math.PI * clamp((frame - cur.s0) / 5)) * (travel < 1 ? 1 : 0.4) : 0;
    const x = lerp(pp?.x ?? 0, pt?.x ?? 0, travel);
    const y = lerp(pp?.y ?? 0, pt?.y ?? 0, travel);
    const done = frame > drawEnd + 6 ? clamp((frame - drawEnd - 6) / 12) : 0;
    return {x, y, lift: Math.max(lift, done), out: done};
  })();

  const nibs = penDots
    ? strokes
        .filter((s) => s.p > 0 && s.p < 1)
        .map((s) => {
          const pt = getPointAtLength(s.it.d, s.it.len * s.p);
          return {x: pt?.x ?? 0, y: pt?.y ?? 0, key: s.i};
        })
    : [];
  const flashes = penDots
    ? strokes
        .filter((s) => frame >= s.s0 && frame < s.s0 + 6)
        .map((s) => {
          const pt = getPointAtLength(s.it.d, 0);
          return {x: pt?.x ?? 0, y: pt?.y ?? 0, a: 1 - (frame - s.s0) / 6, key: s.i};
        })
    : [];

  const gridMinor = 24 * u;
  const capChars = Math.floor(clamp((frame - drawEnd + 4) / 1.2, 0, caption.length));

  return (
    <AbsoluteFill style={{background}}>
      {grid && (
        <AbsoluteFill
          style={{
            opacity: 0.9 * panelIn,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)`,
            backgroundSize: `${gridMinor * 5}px ${gridMinor * 5}px, ${gridMinor * 5}px ${gridMinor * 5}px, ${gridMinor}px ${gridMinor}px, ${gridMinor}px ${gridMinor}px`,
            backgroundPosition: `${w / 2}px ${h / 2}px`,
          }}
        />
      )}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.28) 100%)'}} />
      <Svg>
        <g transform={`translate(${w / 2} ${h / 2}) scale(${push}) translate(${-w / 2} ${-h / 2}) translate(${tx} ${ty}) scale(${S})`}>
          {fillOpacity > 0 &&
            strokes
              .filter((s) => s.closed && s.hp > 0)
              .map((s) => <path key={`f${s.i}`} d={s.it.d} fill={highlightColor} opacity={fillOpacity * s.hp} />)}
          {engrave &&
            strokes.map((s) => (
              <path key={`e${s.i}`} d={s.it.d} fill="none" stroke={strokeColor} strokeWidth={sw * 3.2} strokeLinecap="round" strokeLinejoin="round" {...dash1(s.p)} />
            ))}
          {medium === 'clean' &&
            strokes.map((s) => (
              <path
                key={`s${s.i}`}
                d={s.it.d}
                fill="none"
                stroke={engrave ? background : strokeColor}
                strokeWidth={engrave ? sw * 1.4 : sw}
                strokeLinecap="round"
                strokeLinejoin="round"
                {...(s.rp > 0 ? {...retractDash(s.it.len, retractPieces, s.rp, `rt${s.i}`), opacity: s.rp >= 1 ? 0 : 1} : dash1(s.p))}
              />
            ))}
          {medium === 'cable' &&
            strokes.map((s) => {
              const cc = (s.it as {col?: string}).col;
              const dashProps = s.rp > 0 ? {...retractDash(s.it.len, retractPieces, s.rp, `rt${s.i}`), opacity: s.rp >= 1 ? 0 : 1} : dash1(s.p);
              if (!cc) return <path key={`s${s.i}`} d={s.it.d} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...dashProps} />;
              const pop = prog(frame, s.s0, s.s0 + 2, ease.out) * (1 - s.rp);
              const st0 = getPointAtLength(s.it.d, 0);
              return (
                <g key={`s${s.i}`}>
                  <path d={s.it.d} fill="none" stroke="#1C253B" strokeWidth={sw * 4.4} strokeLinecap="round" strokeLinejoin="round" {...dashProps} />
                  <path d={s.it.d} fill="none" stroke={cc} strokeWidth={sw * 3} strokeLinecap="round" strokeLinejoin="round" {...dashProps} />
                  <path d={s.it.d} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={sw * 0.8} strokeLinecap="round" strokeLinejoin="round" transform={`translate(0 ${-sw * 0.8})`} {...dashProps} />
                  <circle cx={st0?.x ?? 0} cy={st0?.y ?? 0} r={sw * 3.2 * pop} fill={cc} stroke="#1C253B" strokeWidth={sw * 0.7} />
                </g>
              );
            })}
          {hand2 && (
            <g filter={medium === 'crayon' ? 'url(#ldCrayon)' : undefined}>
              {strokes.map((s) => {
                const gap = medium === 'fineliner' ? gapOf(s.i) : null;
                const w0 = sw * (medium === 'crayon' ? 1.7 : 1.15);
                const col = strokeColor;
                const layer = (k: number, wMul: number, op: number) => {
                  const pts = poly(s.i, k);
                  const eraseFrom = s.rp;
                  const d = taperPolygon(pts, w0 * wMul, s.p, eraseFrom, taper, medium === 'crayon' ? 0.3 : 0.2, `tp${seed}${s.i}${k}`);
                  if (!d) return null;
                  return <path key={k} d={d} fill={col} opacity={op} />;
                };
                return (
                  <g key={`m${s.i}`} opacity={gap && s.p > gap[0] ? 1 : 1}>
                    {layer(0, 1, medium === 'crayon' ? 0.88 : 1)}
                    {medium === 'crayon' && layer(1, 0.55, 0.45)}
                    {medium === 'crayon' && layer(2, 0.3, 0.3)}
                    {gap && s.p > gap[0] && (() => {
                      const pts = poly(s.i, 0);
                      const k = Math.min(pts.length - 1, Math.floor(((gap[0] + gap[1]) / 2) * (pts.length - 1)));
                      return <circle cx={pts[k][0]} cy={pts[k][1]} r={Math.max(sw * 0.8, ((gap[1] - gap[0]) * s.it.len) / 2)} fill={background} />;
                    })()}
                  </g>
                );
              })}
            </g>
          )}
          {strokes
            .filter((s) => s.hp > 0 && medium !== 'cable')
            .map((s) => (
              <path key={`h${s.i}`} d={s.it.d} fill="none" stroke={highlightColor} strokeWidth={sw * (engrave ? 3.2 : 1.25)} strokeLinecap="round" strokeLinejoin="round" {...dash1(s.hp)} />
            ))}
          {flashes.map((f) => (
            <g key={`x${f.key}`} opacity={f.a} stroke={strokeColor} strokeWidth={sw * 0.8} strokeLinecap="round">
              <line x1={f.x - (14 * u) / S} y1={f.y} x2={f.x + (14 * u) / S} y2={f.y} />
              <line x1={f.x} y1={f.y - (14 * u) / S} x2={f.x} y2={f.y + (14 * u) / S} />
            </g>
          ))}
          {nibs.map((nb) => (
            <g key={`n${nb.key}`}>
              <circle cx={nb.x} cy={nb.y} r={(12 * u) / S} fill={strokeColor} opacity={0.18} />
              <circle cx={nb.x} cy={nb.y} r={(4.5 * u) / S} fill="#FFFFFF" />
            </g>
          ))}
          {handPos && hand !== 'none' && handPos.out < 1 && (
            <g opacity={1 - handPos.out}>
              <HandTool x={handPos.x} y={handPos.y} scale={(1.7 * u) / S} tool={hand} color={highlightColor} lift={handPos.lift} />
            </g>
          )}
        </g>
        {medium === 'crayon' && (
          <defs>
            <filter id="ldCrayon" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed={(boilStep % 23) + 1 + seed} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={Math.max(1, wobble * 1.6 * u)} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        )}
      </Svg>
      {caption && (
        <div
          style={{
            position: 'absolute',
            left: 0.06 * w,
            bottom: 0.06 * h,
            fontFamily: fonts.mono,
            fontSize: 22 * u,
            letterSpacing: 3 * u,
            color: strokeColor,
            opacity: 0.85,
            borderTop: `${1.5 * u}px solid ${strokeColor}`,
            paddingTop: 8 * u,
            width: lerp(0, 360 * u, prog(frame, drawEnd - 10, drawEnd + 6, ease.out)),
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {caption.slice(0, capChars)}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const lineDrawOn = defineMotion<Props>({
  id: 'line-draw-on',
  title: 'Line-art draw-on',
  category: 'shape',
  description: 'Line art constructs itself stroke by stroke with a pen nib riding each tip, then groups of lines recolour to a highlight; defaults to a blueprint building elevation.',
  source: ['video20 2:52.5-2:55 (blueprint)', 'video1 1:03.1-1:04.6 (crease recolour)', 'video10 0:23.0-0:23.65', 'video19 engrave-stroke-draw'],
  useFor: 'Build any diagram, blueprint, wireframe, icon or logo line by line; highlight the part you are talking about.',
  durationInFrames: 180,
  defaultProps: {
    paths: [],
    groups: [],
    background: '#2E5E91',
    grid: true,
    strokeColor: '#F2F6FF',
    strokeWidth: 3,
    highlightColor: '#FFD36B',
    highlightGroups: [1],
    drawFrames: 10,
    stagger: 4,
    startFrame: 8,
    pen: true,
    engrave: false,
    fillOpacity: 0.28,
    caption: 'ELEVATION A  ·  1:100',
    margin: 0.1,
    medium: 'clean',
    surface: 'blueprint',
    hand: 'none',
    cables: [],
    wobble: 1.4,
    boilFps: 12,
    taper: 0.55,
    overshoot: 0,
    gapChance: 0,
    seed: 3,
    retractAt: 0,
    retractFrames: 14,
    retractPieces: 3,
  },
  propDocs: {
    paths: 'SVG path strings in any coordinate space (auto-fitted); empty = built-in blueprint drawing',
    groups: 'group index per path (for the highlight recolour)',
    strokeColor: 'line colour',
    strokeWidth: 'line width in u (screen space)',
    highlightColor: 'colour lines recolour to in the highlight pass',
    highlightGroups: 'which groups recolour, in order, after everything is drawn',
    drawFrames: 'frames each stroke takes (easeInOutQuad)',
    stagger: 'frames between stroke starts (auto-tightened to fit 60% of the duration)',
    pen: 'pen-nib dot on each stroke tip and a "+" flash where a stroke starts',
    engrave: 'draw strokes as outlined double lines (video19 engraving)',
    fillOpacity: 'highlighted closed shapes get a soft fill of the highlight colour',
    caption: 'small mono title block typed after the drawing ("" to hide)',
    grid: 'blueprint grid background',
    margin: 'margin around the drawing as a fraction of the frame',
    medium: "stroke style: clean (default) | cable (thick outlined round cables with highlight + connector-cap pop; draws a breadboard demo when no paths) | crayon (wobbly tapered wax lines that keep boiling at boilFps) | fineliner (tapered pen, overshoot + skips)",
    surface: 'blueprint (default) | whiteboard | chalkboard | paper — swaps background, ink and highlight colours, grid off',
    hand: "marker | pen | chalk — a hand holding the tool follows the active stroke tip and lifts between strokes (replaces the nib dot)",
    cables: 'medium cable: [{from:[x,y], to:[x,y], color?, lift?}] in a 1000x640 space (lift = arc height as a fraction of 640)',
    wobble: 'crayon / fineliner: line wobble in px',
    boilFps: 'crayon: re-seed rate of the wobble (12 = hand-drawn boil)',
    taper: 'crayon / fineliner: how much both stroke ends thin out (0..1)',
    overshoot: 'fineliner: px the pen overshoots each stroke end',
    gapChance: 'fineliner: 0..1 chance a stroke skips a small gap mid-way',
    seed: 'noise seed for wobble / gaps',
    retractAt: 'frame to start removing the drawing (0 = never): cables split into pieces that shrink to nothing; crayon / fineliner erase from the tail',
    retractFrames: 'frames each retract takes',
    retractPieces: 'cable pieces the stroke splits into when retracting',
  },
  component: LineDrawOn,
  tags: ['draw-on', 'blueprint', 'line-art', 'diagram', 'construct', 'cable', 'wire', 'crayon', 'fineliner', 'whiteboard', 'chalkboard', 'hand-drawn', 'marker', 'retract'],
});
