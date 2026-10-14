import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {getBoundingBox, getLength, getPointAtLength} from '@remotion/paths';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {dash1} from '../../core/shape-kit';
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
};

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

const LineDrawOn: React.FC<Props> = ({paths, groups, background, grid, strokeColor, strokeWidth, highlightColor, highlightGroups, drawFrames, stagger, startFrame, pen, engrave, fillOpacity, caption, margin}) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames, portrait} = useStage();
  const mg = portrait ? margin * 0.45 : margin;

  const items = useMemo(() => {
    const src = paths.length ? paths.map((d, i) => ({d, g: groups[i] ?? 0})) : BLUEPRINT;
    return src.map((p) => {
      let len = 1;
      try {
        len = getLength(p.d);
      } catch {
        len = 1;
      }
      return {...p, len};
    });
  }, [paths, groups]);

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
    return {it, i, p, hp, s0, closed};
  });

  const nibs = pen
    ? strokes
        .filter((s) => s.p > 0 && s.p < 1)
        .map((s) => {
          const pt = getPointAtLength(s.it.d, s.it.len * s.p);
          return {x: pt?.x ?? 0, y: pt?.y ?? 0, key: s.i};
        })
    : [];
  const flashes = pen
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
          {strokes.map((s) => (
            <path
              key={`s${s.i}`}
              d={s.it.d}
              fill="none"
              stroke={engrave ? background : strokeColor}
              strokeWidth={engrave ? sw * 1.4 : sw}
              strokeLinecap="round"
              strokeLinejoin="round"
              {...dash1(s.p)}
            />
          ))}
          {strokes
            .filter((s) => s.hp > 0)
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
        </g>
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
  },
  component: LineDrawOn,
  tags: ['draw-on', 'blueprint', 'line-art', 'diagram', 'construct'],
});
