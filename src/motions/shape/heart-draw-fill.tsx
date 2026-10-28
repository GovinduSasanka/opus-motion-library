import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {getLength, getPointAtLength} from '@remotion/paths';
import {clamp, ease, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {Sparkle} from '../../core/shapes';
import {DeckleFrame, PencilHatch, SK, SketchPaper} from '../../core/sketch-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video20 heart-draw-fill-glow (finale, 209.5-213 s). A pencil draws a red outline icon from its top (heart: from the
 * dip, left lobe first, around the point and up the right lobe) over 36 f ease-in-out-cubic; 0.2 s after it closes the
 * hatched fill fades in over 0.5 s, 4-point sparkles twinkle around it, a warm radial glow fades in and the icon
 * hovers with a soft glow pulse. Icons: heart, star, check, bolt.
 */
type Icon = 'heart' | 'star' | 'check' | 'bolt';
type Props = {
  icon: Icon;
  background: string;
  color: string;
  outlineColor: string;
  glowColor: string;
  size: number;
  drawDur: number;
  startAt: number;
  glow: boolean;
  pencil: boolean;
  sparkleCount: number;
  frame: boolean;
};

const ICONS: Record<Icon, {d: string; closed: boolean}> = {
  heart: {
    d: 'M 0 -0.42 C -0.12 -0.8 -0.74 -0.84 -0.88 -0.38 C -1 0.04 -0.56 0.42 0 0.88 C 0.56 0.42 1 0.04 0.88 -0.38 C 0.74 -0.84 0.12 -0.8 0 -0.42 Z',
    closed: true,
  },
  star: {
    d: (() => {
      const pts = Array.from({length: 10}, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 ? 0.42 : 1;
        return `${(Math.cos(a) * r).toFixed(3)} ${(Math.sin(a) * r + 0.08).toFixed(3)}`;
      });
      return `M ${pts[0]} ${pts.slice(1).map((p) => `L ${p}`).join(' ')} Z`;
    })(),
    closed: true,
  },
  check: {d: 'M -0.72 0.02 L -0.22 0.52 L 0.78 -0.56', closed: false},
  bolt: {d: 'M 0.22 -0.98 L -0.56 0.14 L -0.04 0.14 L -0.24 0.98 L 0.6 -0.2 L 0.08 -0.2 L 0.34 -0.98 Z', closed: true},
};

const scalePath = (d: string, s: number, ox: number, oy: number) =>
  d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g, (_, a: string, b: string) => `${(parseFloat(a) * s + ox).toFixed(2)} ${(parseFloat(b) * s + oy).toFixed(2)}`);

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const HeartDrawFill: React.FC<Props> = ({icon, background, color, outlineColor, glowColor, size, drawDur, startAt, glow, pencil, sparkleCount, frame: showFrame}) => {
  const frame = useCurrentFrame();
  const {u, cx, cy, w, h} = useStage();
  const spec = ICONS[icon] ?? ICONS.heart;
  const S = (Math.min(w, h) * size * (h > w ? 1.55 : 1)) / 2;
  const d = useMemo(() => scalePath(spec.d, S, 0, 0), [spec.d, S]);
  const L = useMemo(() => getLength(d), [d]);
  const t0 = startAt;
  const t1 = t0 + drawDur;
  const draw = easeInOutCubic(clamp((frame - t0) / drawDur));
  const fill = prog(frame, t1 + 6, t1 + 21, ease.sine);
  const glowIn = glow ? prog(frame, t1 + 8, t1 + 28, ease.sine) : 0;
  const hover = prog(frame, t1 + 20, t1 + 40, ease.sine);
  const bob = Math.sin(((frame - t1) / 50) * Math.PI * 2) * 7 * u * hover;
  const pulse = 1 + 0.05 * Math.sin(((frame - t1) / 40) * Math.PI * 2) * hover;
  const settle = 1 - 0.06 * prog(frame, t1 + 50, t1 + 80, ease.inOut);
  const yy = cy + bob;
  const head = draw > 0 && draw < 1 ? getPointAtLength(d, L * draw) : null;
  const lift = prog(frame, t1, t1 + 12, ease.in);
  const pencilPt = head ?? (frame >= t1 ? getPointAtLength(d, L * 0.999) : getPointAtLength(d, 0)) ?? {x: 0, y: 0};
  const pencilIn = prog(frame, t0 - 8, t0, ease.out) * (1 - lift);
  const sw = Math.max(2.5, S / 70) * u;
  const r = rng(icon.length * 7 + 3);
  const sparks = Array.from({length: sparkleCount}, (_, i) => {
    const a = -Math.PI * 0.85 + (i / Math.max(1, sparkleCount - 1)) * Math.PI * 1.7 + (r() - 0.5) * 0.4;
    const rad = S * (1.12 + r() * 0.3);
    return {x: Math.cos(a) * rad * 1.05, y: Math.sin(a) * rad * 0.95, at: t1 + 10 + i * 6 + r() * 4, size: (16 + r() * 12) * u * (S / (220 * u)), col: SK.sparkles[i % SK.sparkles.length], period: 34 + Math.floor(r() * 18)};
  });
  return (
    <AbsoluteFill>
      <SketchPaper color={background} seed={7} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(255,214,170,0.35) 0%, rgba(255,214,170,0) 55%, rgba(150,90,50,0.16) 100%)`}} />
      <Svg>
        <PencilHatch id="hdf-hatch" color={outlineColor} gap={5} opacity={0.35} seed={4} />
        <defs>
          <radialGradient id="hdf-glow">
            <stop offset="0" stopColor={glowColor} stopOpacity={0.9} />
            <stop offset="0.35" stopColor={glowColor} stopOpacity={0.55} />
            <stop offset="0.7" stopColor={glowColor} stopOpacity={0.18} />
            <stop offset="1" stopColor={glowColor} stopOpacity={0} />
          </radialGradient>
        </defs>
        {glowIn > 0 && <circle cx={cx} cy={yy} r={S * 1.8 * pulse} fill="url(#hdf-glow)" opacity={glowIn * (0.75 + 0.25 * Math.sin(((frame - t1) / 40) * Math.PI * 2))} />}
        <g transform={`translate(${cx} ${yy}) scale(${settle * (1 + (pulse - 1) * 0.4)})`}>
          {/* soft contact shadow */}
          <ellipse cx={0} cy={S * 1.25} rx={S * 0.55 * (1 - bob / (60 * u))} ry={S * 0.07} fill="#7A4A30" opacity={0.12 * hover} />
          {spec.closed ? (
            <g opacity={fill}>
              <path d={d} fill={color} opacity={0.85} />
              <path d={d} fill="url(#hdf-hatch)" />
              <path d={d} fill="#fff" opacity={0.12} transform={`translate(${-S * 0.08} ${-S * 0.1}) scale(0.72)`} />
            </g>
          ) : (
            <path d={d} fill="none" stroke={color} strokeWidth={S * 0.2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - fill} />
          )}
          <path d={d} fill="none" stroke={outlineColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={L} strokeDashoffset={L * (1 - draw)} />
          <path d={d} fill="none" stroke={outlineColor} strokeWidth={sw * 0.45} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={L} strokeDashoffset={L * (1 - clamp(draw * 1.02 - 0.02))} opacity={0.35} transform={`translate(${1.6 * u} ${1.2 * u}) rotate(0.8)`} />
          {sparks.map((s, i) => {
            if (frame < s.at) return null;
            const ph = ((frame - s.at) % s.period) / s.period;
            const tw = Math.sin(clamp(ph * 2.2) * Math.PI);
            if (tw <= 0.01) return null;
            return <Sparkle key={i} x={s.x} y={s.y} size={s.size * tw} color={s.col} rotate={(frame - s.at) * 2} />;
          })}
        </g>
        {pencil && pencilIn > 0 && (
          <g transform={`translate(${cx + pencilPt.x * settle} ${yy + pencilPt.y * settle - lift * 60 * u}) rotate(-36)`} opacity={clamp(pencilIn * 1.5)}>
            {/* tip at origin, body extends up-right */}
            <g transform={`scale(${S / (170 * u)})`}>
              <polygon points={`0,0 ${-9 * u},${-26 * u} ${9 * u},${-26 * u}`} fill="#E9C9A0" stroke={SK.ink} strokeWidth={1.5 * u} />
              <polygon points={`0,0 ${-3 * u},${-8 * u} ${3 * u},${-8 * u}`} fill={SK.ink} />
              <rect x={-9 * u} y={-176 * u} width={18 * u} height={150 * u} fill="#E8C25A" stroke={SK.ink} strokeWidth={1.5 * u} />
              <line x1={-3 * u} x2={-3 * u} y1={-176 * u} y2={-26 * u} stroke="#C99A30" strokeWidth={1.2 * u} />
              <rect x={-9.5 * u} y={-194 * u} width={19 * u} height={18 * u} fill="#B9B3A6" stroke={SK.ink} strokeWidth={1.5 * u} />
              <rect x={-9.5 * u} y={-214 * u} width={19 * u} height={20 * u} rx={5 * u} fill="#E59A9A" stroke={SK.ink} strokeWidth={1.5 * u} />
            </g>
          </g>
        )}
      </Svg>
      {showFrame && <DeckleFrame tint="#D29A70" margin="#E8D8C2" seed={4} />}
    </AbsoluteFill>
  );
};

export const heartDrawFill = defineMotion<Props>({
  id: 'heart-draw-fill',
  title: 'Icon draw, fill & glow (heart)',
  category: 'shape',
  description: 'On warm sketch paper a pencil draws a red heart outline (or star / check / bolt), the hatched fill fades in, 4-point sparkles twinkle around it and a soft warm glow pulses while it hovers.',
  source: ['video20 3:29.5-3:33 heart-draw-fill-glow', 'video20 3:36.5 fade-to-paper heart'],
  useFor: 'Love / thanks / success end beats, like-subscribe moments, a finished checkmark or a power-up icon.',
  durationInFrames: 120,
  defaultProps: {
    icon: 'heart',
    background: '#E9D3B6',
    color: SK.heart,
    outlineColor: SK.heartLine,
    glowColor: '#FFB070',
    size: 0.46,
    drawDur: 36,
    startAt: 8,
    glow: true,
    pencil: true,
    sparkleCount: 5,
    frame: true,
  },
  propDocs: {
    icon: "'heart' | 'star' | 'check' | 'bolt'",
    background: 'paper colour',
    color: 'fill colour (hatched)',
    outlineColor: 'pencil outline colour',
    glowColor: 'radial glow colour',
    size: 'icon width as a fraction of the short side',
    drawDur: 'frames for the outline draw-on (36 measured)',
    startAt: 'frame the outline starts drawing',
    glow: 'warm glow fades in after the fill',
    pencil: 'show the pencil that draws the outline',
    sparkleCount: 'twinkling 4-point sparkles around the icon',
    frame: 'draw the torn deckle paper frame',
  },
  component: HeartDrawFill,
  tags: ['heart', 'icon', 'draw-on', 'fill', 'glow', 'pencil', 'sketch', 'love', 'check'],
});
