import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {clamp01} from '../../core/r2-pr1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Match cut demo: a shape in scene A (a record button) continues as the same shape in scene B (a sun) at the same
 * position and size, so the cut is hidden. The matched shape is held 3 frames across the cut (optionally scaled
 * 1 -> 1.6 first), then scene B is revealed through a clip-path that grows from that exact shape to the full frame while
 * the shape itself morphs from `from` to `to`. Works with any two scenes: use the same maths (clip-path from the shared
 * rect) in your own transition; here both scenes are procedural so it looks finished with zero assets.
 */

type Box = {x: number; y: number; w: number; h: number};
type Props = {
  shape: 'circle' | 'rounded' | 'rect';
  from: Box;
  to: Box;
  cutAt: number;
  holdFrames: number;
  expandFrames: number;
  scaleThrough: number;
  titleA: string;
  titleB: string;
  imageB: string;
  colorA: string;
  colorB: string;
  shapeA: string;
  shapeB: string;
};

const MatchCut: React.FC<Props> = ({shape, from, to, cutAt, holdFrames, expandFrames, scaleThrough, titleA, titleB, imageB, colorA, colorB, shapeA, shapeB}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const cx = (b: Box) => (b.x / 100) * w;
  const cy = (b: Box) => (b.y / 100) * h;
  const sz = (b: Box) => [b.w * u, b.h * u] as const;
  const radiusOf = (bw: number, bh: number) => (shape === 'circle' ? Math.min(bw, bh) / 2 : shape === 'rounded' ? Math.min(bw, bh) * 0.24 : 6 * u);

  // matched scale before / across the cut
  const ms = lerp(1, scaleThrough, prog(frame, cutAt - 14, cutAt + holdFrames, ease.inOut));
  const [fw0, fh0] = sz(from);
  const mw = fw0 * ms;
  const mh = fh0 * ms;
  const mcx = cx(from);
  const mcy = cy(from);

  const expandStart = cutAt + holdFrames;
  const pe = prog(frame, expandStart, expandStart + expandFrames, ease.expoInOut);
  const afterCut = frame >= cutAt;

  // clip rect growing from the matched shape to beyond the frame
  const farW = w * 1.5;
  const farH = h * 1.5;
  const clipW = lerp(mw, shape === 'circle' ? Math.hypot(w, h) * 1.05 : farW, pe);
  const clipH = lerp(mh, shape === 'circle' ? Math.hypot(w, h) * 1.05 : farH, pe);
  const clipR = lerp(radiusOf(mw, mh), shape === 'circle' ? Math.hypot(w, h) : 0, pe);
  const clipCx = lerp(mcx, w / 2, pe);
  const clipCy = lerp(mcy, h / 2, pe);
  const m0 = (v: number) => Math.max(0, v);
  const circleR = lerp(Math.min(mw, mh) / 2, (Math.hypot(w, h) / 2) * 1.03, pe);
  const clip =
    shape === 'circle'
      ? `circle(${circleR}px at ${clipCx}px ${clipCy}px)`
      : `inset(${m0(clipCy - clipH / 2)}px ${m0(w - (clipCx + clipW / 2))}px ${m0(h - (clipCy + clipH / 2))}px ${m0(clipCx - clipW / 2)}px round ${clipR}px)`;

  // B's shape morphs from the matched rect to `to`
  const pm = prog(frame, expandStart, expandStart + expandFrames + 14, ease.inOut);
  const [tw, th] = sz(to);
  const bw = lerp(mw, tw, pm);
  const bh = lerp(mh, th, pm);
  const bcx = lerp(mcx, cx(to), pm);
  const bcy = lerp(mcy, cy(to), pm);
  const r = radiusOf(bw, bh);

  // A: a calm app screen with the record button breathing
  const breathe = 1 + 0.025 * Math.sin(frame * 0.22) * (1 - prog(frame, cutAt - 14, cutAt - 4));
  const aw0 = mw * breathe;
  const ah0 = mh * breathe;
  const rowW = [0.5, 0.36, 0.44];

  const tIn = prog(frame, expandStart + expandFrames * 0.45, expandStart + expandFrames + 18, ease.out);

  return (
    <AbsoluteFill style={{background: colorA, overflow: 'hidden'}}>
      {/* ---------- scene A */}
      <AbsoluteFill>
        <Svg>
          <rect x={w * 0.07} y={h * 0.07} width={w * 0.86} height={h * 0.07} rx={14 * u} fill="#000" opacity={0.06} />
          <circle cx={w * 0.1} cy={h * 0.105} r={9 * u} fill="#000" opacity={0.18} />
          {rowW.map((f, i) => (
            <rect key={i} x={w * 0.07} y={h * (portrait ? 0.2 : 0.22) + i * 38 * u} width={w * (portrait ? 0.7 : f * 0.7)} height={16 * u} rx={8 * u} fill="#000" opacity={0.08} />
          ))}
          <rect x={mcx - aw0 / 2 - 22 * u} y={mcy - ah0 / 2 - 22 * u} width={aw0 + 44 * u} height={ah0 + 44 * u} rx={radiusOf(aw0, ah0) + 22 * u} fill="none" stroke={shapeA} strokeWidth={3 * u} opacity={0.18 * (1 - prog(frame, cutAt - 10, cutAt))} />
          <rect x={mcx - aw0 / 2} y={mcy - ah0 / 2} width={aw0} height={ah0} rx={radiusOf(aw0, ah0)} fill={shapeA} />
          {shape === 'circle' || shape === 'rounded' ? <path d={`M ${mcx - aw0 * 0.08} ${mcy - ah0 * 0.18} L ${mcx - aw0 * 0.08} ${mcy + ah0 * 0.18} L ${mcx + aw0 * 0.18} ${mcy} Z`} fill="#fff" /> : null}
        </Svg>
        <div style={{position: 'absolute', left: w * 0.07, top: h * (portrait ? 0.15 : 0.16), fontFamily: fonts.sans, fontWeight: 800, fontSize: 52 * u, letterSpacing: '-0.02em', color: '#1B1B1F', opacity: 1}}>{titleA}</div>
      </AbsoluteFill>

      {/* ---------- scene B (clipped by the matched shape, then the whole frame) */}
      {afterCut ? (
        <AbsoluteFill style={{clipPath: clip, WebkitClipPath: clip}}>
          <AbsoluteFill style={{background: `linear-gradient(180deg, ${colorB} 0%, #FF9A62 52%, #FFD3A0 100%)`}} />
          {imageB ? <img src={resolveSrc(imageB)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} /> : null}
          <Svg>
            {/* sea + horizon */}
            {!imageB ? (
              <>
                <rect x={0} y={h * 0.68} width={w} height={h * 0.32} fill="#2B3A6B" />
                {Array.from({length: 9}, (_, i) => (
                  <rect key={i} x={w * (0.5 + (i - 4) * 0.07) - (60 - i * 3) * u} y={h * 0.7 + i * h * 0.03} width={(120 - i * 6) * u * (0.6 + (i % 3) * 0.2)} height={5 * u} rx={2.5 * u} fill="#FFD3A0" opacity={0.2 + 0.05 * (i % 3)} />
                ))}
                <path d={`M 0 ${h * 0.68} Q ${w * 0.25} ${h * 0.6} ${w * 0.5} ${h * 0.68} T ${w} ${h * 0.66} V ${h * 0.68} Z`} fill="#3C2D55" opacity={0.8} />
              </>
            ) : null}
            {/* the matched shape, morphing to its rest position */}
            {shape === 'circle' ? <circle cx={bcx} cy={bcy} r={Math.max(bw, bh) / 2 * 1.5} fill={shapeB} opacity={0.18 * pm} /> : null}
            <rect x={bcx - bw / 2} y={bcy - bh / 2} width={bw} height={bh} rx={r} fill={shapeB} />
            {shape === 'circle' ? <circle cx={bcx} cy={bcy} r={Math.min(bw, bh) * 0.36} fill="#FFF6D8" opacity={0.65} /> : null}
          </Svg>
          <div style={{position: 'absolute', left: 0, right: 0, top: h * (portrait ? 0.7 : 0.78), textAlign: 'center', fontFamily: fonts.serif, fontWeight: 700, fontSize: 84 * u, color: '#FFF4E4', opacity: tIn, transform: `translateY(${(1 - tIn) * 24 * u}px)`, letterSpacing: '-0.01em'}}>{titleB}</div>
        </AbsoluteFill>
      ) : null}
      {/* hold marker: keep the matched shape drawn identically for the cut frames */}
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <Svg>
          {frame >= cutAt - 1 && frame <= cutAt + holdFrames ? <rect x={mcx - mw / 2} y={mcy - mh / 2} width={mw} height={mh} rx={radiusOf(mw, mh)} fill={frame >= cutAt ? shapeB : shapeA} /> : null}
        </Svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

void clamp01;
void lerp;

export const matchCut = defineMotion<Props>({
  id: 'match-cut',
  title: 'Match cut (shape continues)',
  category: 'transition',
  description:
    'A record button in an app screen becomes a sun in a sunrise scene at exactly the same position and size: the shape is held 3 frames across the cut (scaled 1 -> 1.6 first), then scene B opens through a clip-path that grows from that shape to the full frame while the sun drifts to its rest position.',
  source: ['prompt-corpus: match-cut (31 cases)', 'awesome-opus5-5-videos prompts (MIT) — technique only'],
  useFor: 'Premium launch films, showreels and one-shot explainers: copy the rect/clip-path maths into any scene change so a button, screen or circle continues as a shape in the next scene (pairs with cursor-driver and ui-shape-morph).',
  durationInFrames: 120,
  defaultProps: {
    shape: 'circle',
    from: {x: 50, y: 56, w: 300, h: 300},
    to: {x: 50, y: 40, w: 340, h: 340},
    cutAt: 46,
    holdFrames: 3,
    expandFrames: 26,
    scaleThrough: 1.6,
    titleA: 'Ready when you are',
    titleB: 'A new day',
    imageB: '',
    colorA: '#ECE9E3',
    colorB: '#FFB27A',
    shapeA: '#1B1B1F',
    shapeB: '#FFE3A8',
  },
  propDocs: {
    shape: "'circle' | 'rounded' | 'rect'",
    from: 'matched shape in scene A: {x,y in % of frame centre, w,h in u}',
    to: 'where the shape comes to rest in scene B',
    cutAt: 'frame of the hard cut',
    holdFrames: 'frames the matched shape is held across the cut (2-4)',
    expandFrames: 'frames for B to open to full frame',
    scaleThrough: 'scale of the matched shape just before the cut (1 = none)',
    titleA: 'headline in scene A',
    titleB: 'headline in scene B',
    imageB: 'optional public image path for scene B (replaces the procedural sunrise)',
    colorA: 'scene A background',
    colorB: 'scene B sky top colour',
    shapeA: 'matched shape colour in A',
    shapeB: 'matched shape colour in B',
  },
  component: MatchCut,
  tags: ['match cut', 'transition', 'shape', 'button', 'clip-path', 'iris', 'continuity', 'cut', 'reveal', 'showreel', 'launch', 'scene change', 'morph'],
});
