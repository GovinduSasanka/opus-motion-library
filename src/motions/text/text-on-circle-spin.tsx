import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {Svg, useStage} from '../../core/stage';
import {Bg, fitBlock, mixCol, useTextWidths} from '../../core/kinetic-type-kit';
import {estWidth, tfonts, TFont} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Text on a circle, spinning: any number of concentric rings of text that wrap a circle exactly (the phrase repeats
 * with a separator and the spacing is adjusted so the seam closes), each spinning at its own speed and direction,
 * solid or outlined, reading outward or inward, around a centre word. Rings spin in on a stagger.
 */

type Ring = {
  text: string;
  separator?: string;
  radius: number;
  size: number;
  speed: number;
  color: string;
  style?: 'solid' | 'outline';
  inward?: boolean;
  weight?: number;
  font?: TFont;
};

type Props = {
  rings: Ring[];
  centerText: string;
  centerFont: TFont;
  centerSize: number;
  centerWeight: number;
  centerColor: string;
  disc: string;
  guides: boolean;
  startAngle: number;
  enterStagger: number;
  startAt: number;
  tracking: number;
  textCase: 'upper' | 'none';
  background: string;
  ink: string;
  accent: string;
};

const nb = (s: string) => s.replace(/ /g, ' ');

const RingLayer: React.FC<{ring: Ring; idx: number; R: number; props: Props; frame: number; cx: number; cy: number; u: number; uid: string}> = ({ring, idx, R, props, frame, cx, cy, u, uid}) => {
  const font = ring.font ?? 'display';
  const fs = ring.size * u;
  const weight = ring.weight ?? 700;
  const sep = ring.separator ?? '  •  ';
  const unitRaw = (props.textCase === 'upper' ? ring.text.toUpperCase() : ring.text) + sep;
  const unit = nb(unitRaw);
  const inward = !!ring.inward;
  const rBase = Math.max(fs, ring.radius * R - (inward ? 0 : fs * 0.74));
  const circ = 2 * Math.PI * rBase;
  const {widths, probes} = useTextWidths([unit], tfonts[font], fs, weight, props.tracking * fs);
  const unitW = widths && widths[0] ? widths[0] : estWidth(unitRaw, fs, font, props.tracking);
  const reps = Math.max(1, Math.round(circ / Math.max(1, unitW)));
  const full = unit.repeat(reps);
  const nChars = [...full].length;
  const natural = unitW * reps;
  const spacing = (circ - natural) / nChars + props.tracking * fs;

  const e = prog(frame, props.startAt + idx * props.enterStagger, props.startAt + idx * props.enterStagger + 34, ease.out);
  const dir = Math.sign(ring.speed) || 1;
  const angle = props.startAngle + (frame / 30) * ring.speed - (1 - e) * 140 * dir;
  const scale = 0.55 + 0.45 * e;
  const id = `${uid}-r${idx}`;
  const d = inward
    ? `M ${cx} ${cy - rBase} A ${rBase} ${rBase} 0 1 0 ${cx} ${cy + rBase} A ${rBase} ${rBase} 0 1 0 ${cx} ${cy - rBase}`
    : `M ${cx} ${cy - rBase} A ${rBase} ${rBase} 0 1 1 ${cx} ${cy + rBase} A ${rBase} ${rBase} 0 1 1 ${cx} ${cy - rBase}`;
  const outline = ring.style === 'outline';
  return (
    <>
      {probes}
      <Svg>
        <defs>
          <path id={id} d={d} />
        </defs>
        <g opacity={e} transform={`translate(${cx} ${cy}) scale(${scale}) rotate(${angle}) translate(${-cx} ${-cy})`}>
          {props.guides ? <circle cx={cx} cy={cy} r={inward ? rBase - fs * 1.1 : rBase + fs * 0.9} fill="none" stroke={ring.color} strokeOpacity={0.3} strokeWidth={Math.max(1, 1.5 * u)} /> : null}
          <text
            style={{fontFamily: tfonts[font], fontSize: fs, fontWeight: weight, letterSpacing: spacing, whiteSpace: 'pre'}}
            fill={outline ? 'none' : ring.color}
            stroke={outline ? ring.color : 'none'}
            strokeWidth={outline ? Math.max(1.5 * u, fs * 0.045) : 0}
            strokeLinejoin="round"
          >
            <textPath href={`#${id}`} startOffset="0">
              {full}
            </textPath>
          </text>
        </g>
      </Svg>
    </>
  );
};

const CircleText: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy} = useStage();
  const R = Math.min(w, h) * 0.5 * 0.96;
  // inner free radius = smallest ring's inner edge
  const inner = Math.min(
    R,
    ...p.rings.map((r) => {
      const fs = r.size * u;
      const base = Math.max(fs, r.radius * R - (r.inward ? 0 : fs * 0.74));
      return r.inward ? base - fs * 0.95 : base - fs * 0.05;
    }),
  );
  const centerSize = Math.min(p.centerSize * u, 1e9);
  const cT = p.textCase === 'upper' ? p.centerText.toUpperCase() : p.centerText;
  const fit = cT ? fitBlock(cT, centerSize, inner * 1.55, inner * 1.3, p.centerFont, 1.0) : {size: centerSize, lines: [] as string[]};
  const ce = prog(frame, p.startAt + p.rings.length * p.enterStagger + 6, p.startAt + p.rings.length * p.enterStagger + 30, ease.back);
  const discE = prog(frame, p.startAt, p.startAt + 24, ease.out);
  const uid = 'tocs';
  return (
    <Bg background={p.background} glow={p.accent} glowAmount={0.08}>
      {p.disc ? (
        <Svg>
          <circle cx={cx} cy={cy} r={Math.max(0, inner * 0.98) * discE} fill={p.disc} />
        </Svg>
      ) : null}
      {p.rings.map((ring, i) => (
        <RingLayer key={i} ring={ring} idx={i} R={R} props={p} frame={frame} cx={cx} cy={cy} u={u} uid={uid} />
      ))}
      {fit.lines.length ? (
        <div style={{position: 'absolute', left: cx - inner, top: cy - inner, width: inner * 2, height: inner * 2, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', transform: `scale(${ce})`, opacity: Math.min(1, ce * 1.5)}}>
          <div style={{fontFamily: tfonts[p.centerFont], fontSize: fit.size, lineHeight: 1.0, fontWeight: p.centerWeight, color: p.centerColor, whiteSpace: 'pre', letterSpacing: p.tracking * fit.size}}>{fit.lines.join('\n')}</div>
        </div>
      ) : null}
    </Bg>
  );
};

void mixCol;

export const textOnCircleSpin = defineMotion<Props>({
  id: 'text-on-circle-spin',
  title: 'Text on a circle, spinning',
  category: 'text',
  description:
    'Concentric rings of text that wrap a circle exactly — a phrase repeating with a separator, seam closed by adjusting the letter spacing — each spinning at its own speed and direction, solid or outlined, reading outward or inward, around a centre word that pops in; rings spin up on a stagger.',
  source: ['original — generic kinetic-type effect (R3)'],
  useFor: 'Badge / seal / stamp logos, rotating "coming soon" or "limited edition" rings, music and podcast discs, circular text backdrops, loaders, website decorations; set rings[] and centerText.',
  durationInFrames: 180,
  defaultProps: {
    rings: [
      {text: 'Round and round we go', separator: '  ✦  ', radius: 0.98, size: 76, speed: 24, color: '#F7F2E7', style: 'solid', weight: 800, font: 'display'},
      {text: 'Your words here', separator: '  •  ', radius: 0.68, size: 54, speed: -36, color: '#FF6B3D', style: 'solid', weight: 800, font: 'display'},
    ],
    centerText: 'Hello',
    centerFont: 'display',
    centerSize: 150,
    centerWeight: 400,
    centerColor: '#F7F2E7',
    disc: '',
    guides: true,
    startAngle: -90,
    enterStagger: 8,
    startAt: 4,
    tracking: 0.02,
    textCase: 'upper',
    background: '#16223A',
    ink: '#F7F2E7',
    accent: '#FF6B3D',
  },
  propDocs: {
    rings: '[{text, separator?, radius(outer edge, 0..1 of the circle), size(u), speed(deg/s, negative = anticlockwise), color, style?(solid|outline), inward?(read from the inside), weight?, font?}]',
    centerText: 'word(s) in the middle ("" for none); wraps and shrinks to fit',
    centerFont: 'font role of the centre word',
    centerSize: 'max centre font size in u',
    centerWeight: 'centre font weight',
    centerColor: 'centre colour',
    disc: 'colour of a disc behind the centre ("" = none)',
    guides: 'thin circle next to each ring',
    startAngle: 'initial rotation in degrees',
    enterStagger: 'frames between rings spinning in',
    startAt: 'frame the first ring enters',
    tracking: 'extra letter spacing in em',
    textCase: 'upper | none',
    background: 'background colour; "transparent" for an overlay',
    ink: 'general light colour (for presets)',
    accent: 'accent colour (glow)',
  },
  component: CircleText,
  tags: ['text', 'circle', 'circular', 'ring', 'spin', 'rotate', 'badge', 'seal', 'stamp', 'logo', 'typography', 'kinetic', 'textpath', 'loader', 'podcast', 'overlay'],
});
