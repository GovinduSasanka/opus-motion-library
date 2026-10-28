// Adapted from lemo-opuscar/styles/shadow-puppet/demo/main.js (sun pieces: scale .95·(1+1.6·lift), blur 34·lift), STYLE.md §5 (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {LampCloth, lf, mixHex, pressLift, seg, useUid} from '../../core/r2-lb2-kit';

/**
 * Entrance / exit preset for any layer: an arrival comes in large and blurry (as if held near the lamp, off the cloth)
 * and snaps sharp onto the screen with a small thud; an exit grows, blurs and fades into light, like lifting a puppet
 * away. Shown on three paper tags over a lamp-lit cloth; the same maths (pressLift) drives any layer.
 */
type Props = {
  items: string[];
  images: string[];
  pressFrames: number;
  liftFrames: number;
  fromScale: number;
  toScale: number;
  maxBlur: number;
  firstInAt: number;
  stagger: number;
  liftAt: number;
  liftStagger: number;
  thud: boolean;
  background: string;
  colors: string[];
  paper: string;
  ink: string;
};

const PressLift: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = useUid('prl');
  const n = p.items.length;
  const cw = portrait ? Math.min(w * 0.78, 640 * u) : Math.min(w * 0.3, 620 * u);
  const ch = cw * 0.5;
  const gap = 36 * u;
  const posOf = (i: number) => ({
    x: portrait ? w / 2 - cw / 2 : w / 2 - (n * cw + (n - 1) * gap) / 2 + i * (cw + gap),
    y: portrait ? h / 2 - (n * ch + (n - 1) * gap) / 2 + i * (ch + gap) : h / 2 - ch / 2,
  });
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <LampCloth w={w} h={h} u={u} lamps={[{x: w * 0.5, y: h * 0.48}]} level={[Math.min(1, seg(frame, 0, 10))]} frame={frame} id={`${id}c`} weave={0.8} />
      </Svg>
      {p.items.map((text, i) => {
        const inAt = p.firstInAt + i * p.stagger;
        const outAt = p.liftAt + i * p.liftStagger;
        const s = pressLift(frame, inAt, p.pressFrames, outAt, p.liftFrames, p.fromScale, p.toScale, p.maxBlur);
        if (frame < inAt) return null;
        const {x, y} = posOf(i);
        // thud: a short squash right after the snap
        const landF = inAt + p.pressFrames;
        const th = p.thud && frame >= landF && frame < landF + 8 ? Math.sin(((frame - landF) / 8) * Math.PI) : 0;
        const sc = s.scale * (1 - 0.035 * th);
        const col = p.colors[i % p.colors.length];
        const img = p.images[i];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: cw,
              height: ch,
              transform: `scale(${sc}) translateY(${th * 5 * u}px)`,
              filter: s.blur > 0.2 ? `blur(${s.blur * u}px)` : undefined,
              opacity: s.op,
              background: p.paper,
              borderRadius: 10 * u,
              boxShadow: `0 ${10 * u}px ${28 * u}px rgba(30,10,0,.45)`,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div style={{width: 14 * u, alignSelf: 'stretch', background: col}} />
            {img && <img src={resolveSrc(img)} style={{height: '100%', width: ch, objectFit: 'cover'}} />}
            <div style={{fontFamily: lf('outfit'), fontWeight: 700, fontSize: cw * 0.098, lineHeight: 1.1, color: p.ink, padding: `0 ${22 * u}px`, letterSpacing: -0.5 * u}}>
              <div style={{fontFamily: lf('plex'), fontWeight: 500, fontSize: cw * 0.044, letterSpacing: 4 * u, color: mixHex(col, '#000000', 0.2), marginBottom: 6 * u}}>
                {String(i + 1).padStart(2, '0')}
              </div>
              {text}
            </div>
          </div>
        );
      })}
      {/* ring at each snap */}
      {p.thud && (
        <Svg>
          {p.items.map((_, i) => {
            const landF = p.firstInAt + i * p.stagger + p.pressFrames;
            const t = (frame - landF) / 14;
            if (t < 0 || t > 1) return null;
            const {x, y} = posOf(i);
            return <ellipse key={i} cx={x + cw / 2} cy={y + ch / 2} rx={cw * (0.55 + 0.25 * t)} ry={ch * (0.62 + 0.25 * t)} fill="none" stroke="#ffe2b0" strokeWidth={3 * u} opacity={0.5 * (1 - t)} />;
          })}
        </Svg>
      )}
    </AbsoluteFill>
  );
};

export const pressLiftMotion = defineMotion<Props>({
  id: 'press-lift',
  title: 'Press and lift (entrance / exit preset)',
  category: 'image',
  description:
    'Arrivals come in large and blurry, as if held near the lamp, then snap sharp onto the screen with a thud; exits grow, blur and fade into light like lifting a puppet away. Shown on three paper tags over a lamp-lit cloth.',
  source: ['lemo-opuscar styles/shadow-puppet demo/main.js (sun pieces), STYLE.md §5 (MIT, LemoLab)'],
  useFor: 'A universal comes-into-focus / fades-into-memory entrance for any layer: a rumour growing, a deadline pressing in, forgotten items lifting away. Copy the numbers (scale 2.6 -> 1, blur 34 -> 0, 0.55 s; lift 1 -> 1.9, 0.9 s) onto any wrapper.',
  durationInFrames: 150,
  defaultProps: {
    items: ['A rumour grows', 'The deadline presses in', 'Old plans lift away'],
    images: [],
    pressFrames: 17,
    liftFrames: 27,
    fromScale: 2.6,
    toScale: 1.9,
    maxBlur: 34,
    firstInAt: 8,
    stagger: 16,
    liftAt: 92,
    liftStagger: 12,
    thud: true,
    background: '#120805',
    colors: ['#b3261b', '#d9a441', '#2a7f78'],
    paper: '#f1e3c3',
    ink: '#2a1209',
  },
  propDocs: {
    items: 'tag texts (one tag per item)',
    images: 'optional image per tag (public path or URL)',
    pressFrames: 'press-on frames (0.55 s = 17)',
    liftFrames: 'lift-off frames (0.9 s = 27)',
    fromScale: 'press-on start scale',
    toScale: 'lift-off end scale',
    maxBlur: 'blur in u at the far end',
    firstInAt: 'frame the first tag starts to press on',
    stagger: 'frames between tags pressing on',
    liftAt: 'frame the first tag starts to lift off',
    liftStagger: 'frames between tags lifting off',
    thud: 'small squash and ring at the snap',
    background: 'backdrop colour',
    colors: 'tag accent colours',
    paper: 'tag paper colour',
    ink: 'tag text colour',
  },
  component: PressLift,
  tags: ['entrance', 'exit', 'preset', 'blur in', 'focus', 'fade out', 'lift', 'press', 'puppet', 'shadow theatre', 'transition in', 'scale blur', 'memory', 'tags'],
});
