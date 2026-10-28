import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {impactAt, luma, rgba} from '../../core/r2-pr2-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Hit feedback for a beat: on each impact one inverted frame, one white frame, a decaying camera shake, a 1.06 -> 1
 * zoom punch, a chromatic split and a burst of speed lines. With `scene` on it slams a word per hit on a colour that
 * changes per hit; with `scene: false` and `background: "transparent"` only the flash + lines remain as an overlay.
 */
type Props = {
  scene: boolean;
  at: number[];
  words: string[];
  colors: string[];
  inkColor: string;
  accent: string;
  strength: number;
  ramp: number;
  flash: string;
  lines: boolean;
  chroma: boolean;
  background: string;
};

const ImpactFrame: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const m = Math.min(w, h);
  const s = impactAt(frame, P.at, P.strength, P.ramp, P.flash as 'invert' | 'white' | 'both' | 'none');
  const idx = Math.max(0, s.index);
  const bg = P.colors[idx % P.colors.length];
  const dark = luma(bg) < 0.45;
  const ink = dark ? '#ffffff' : P.inkColor;
  const word = s.index >= 0 ? P.words[s.index % P.words.length] : '';
  const age = s.age;
  const showScene = P.scene;

  // word slam
  const slam = age < 999 ? ease.out(prog(age, 0, 7, (t) => t)) : 0;
  const wScale = 1 + 0.42 * (1 - slam) + Math.min(0.03, age / 1500);
  const wRot = (1 - slam) * (idx % 2 ? 3.5 : -3.5);
  const fsz = Math.min((w * 0.86) / Math.max(3.2, word.length * 0.86), h * (portrait ? 0.3 : 0.5));
  // anticipation ring before the next hit
  const nextAt = P.at.find((a) => a > frame);
  const charge = nextAt !== undefined ? prog(frame, nextAt - 12, nextAt, (t) => t) : 0;
  const ringR = m * 0.5 * (1 - ease.in(charge)) + m * 0.05;
  // lines
  const lineA = age < 7 ? Math.pow(1 - age / 7, 1.4) : 0;
  const nLines = 34;
  const lines = Array.from({length: nLines}, (_, i) => {
    const a = (i / nLines) * Math.PI * 2 + ((idx * 0.37) % 1);
    const jitter = 0.6 + 0.8 * Math.abs(Math.sin(i * 12.9898 + idx * 4.1));
    const r0 = m * (0.16 + 0.1 * jitter + 0.03 * age);
    const r1 = Math.hypot(w, h) * 0.75;
    const half = (0.012 + 0.012 * jitter) * (1 - age / 9);
    const p = (r: number, da: number) => `${(w / 2 + Math.cos(a + da) * r).toFixed(1)},${(h / 2 + Math.sin(a + da) * r).toFixed(1)}`;
    return `M${p(r0, -half * 0.3)} L${p(r1, -half)} L${p(r1, half)} L${p(r0, half * 0.3)}Z`;
  });
  const chromaPx = s.chroma * m;
  const useChroma = P.chroma && chromaPx > 0.4;
  const shakeX = s.dx * m;
  const shakeY = s.dy * m;
  const idle = s.index >= 0 ? 0 : 0;

  return (
    <AbsoluteFill style={{background: showScene ? bg : P.background === 'transparent' ? undefined : P.background, overflow: 'hidden'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="impact-chroma" x="-4%" y="-4%" width="108%" height="108%" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feOffset in="r" dx={chromaPx} dy={0} result="ro" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
            <feOffset in="b" dx={-chromaPx} dy={0} result="bo" />
            <feBlend in="ro" in2="g" mode="screen" result="rg" />
            <feBlend in="rg" in2="bo" mode="screen" />
          </filter>
        </defs>
      </svg>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${shakeX + idle}px, ${shakeY}px) rotate(${s.rot}deg) scale(${s.scale})`, filter: useChroma ? 'url(#impact-chroma)' : undefined}}>
        {showScene && (
          <>
            <Svg>
              {/* faint grid */}
              {Array.from({length: 9}, (_, i) => (
                <line key={i} x1={(i / 8) * w} y1={0} x2={(i / 8) * w} y2={h} stroke={rgba(ink, 0.07)} strokeWidth={2 * u} />
              ))}
              {nextAt !== undefined && charge > 0 && <circle cx={w / 2} cy={h / 2} r={ringR} fill="none" stroke={P.accent} strokeWidth={(3 + 6 * charge) * u} opacity={0.35 + 0.65 * charge} />}
              {s.index < 0 && <circle cx={w / 2} cy={h / 2} r={(8 + 3 * Math.sin(frame / 4)) * u} fill={P.accent} opacity={0.9} />}
              {P.lines && lineA > 0 && <path d={lines.join(' ')} fill={dark ? '#fff' : P.accent} opacity={lineA * 0.9} />}
              {age < 12 && <circle cx={w / 2} cy={h / 2} r={m * 0.12 + age * m * 0.07} fill="none" stroke={ink} strokeWidth={Math.max(0, 14 - age * 1.3) * u} opacity={1 - age / 12} />}
            </Svg>
            {word && (
              <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{fontFamily: fonts.display, fontSize: fsz, color: ink, letterSpacing: -fsz * 0.02, lineHeight: 1, transform: `scale(${wScale}) rotate(${wRot}deg)`, WebkitTextStroke: `${fsz * 0.03}px ${ink}`, textShadow: dark ? 'none' : `${fsz * 0.05}px ${fsz * 0.05}px 0 ${rgba(P.accent, 0.9)}`}}>{word}</div>
              </div>
            )}
          </>
        )}
        {!showScene && P.lines && lineA > 0 && (
          <Svg>
            <path d={lines.join(' ')} fill={P.accent} opacity={lineA * 0.85} />
          </Svg>
        )}
      </div>
      {/* inverted frame: a white layer in difference mode flips every colour underneath */}
      {s.invert && <div style={{position: 'absolute', inset: 0, background: '#fff', mixBlendMode: 'difference'}} />}
      {s.white > 0 && <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: s.white}} />}
    </AbsoluteFill>
  );
};

export const impactFrame = defineMotion<Props>({
  id: 'impact-frame',
  title: 'Impact frame (flash, shake, punch)',
  category: 'fx',
  description:
    'On each hit: one inverted frame, one white frame, a decaying camera shake, a 1.06 to 1 zoom punch, a chromatic RGB split and a burst of speed lines with a shock ring; the default scene slams one giant word per hit (READY / SET / GO) on a new colour with an anticipation ring closing before every beat.',
  source: ['prompt corpus x18 (hit: inverted/white frames, decaying shake, zoom punch, chroma split)'],
  useFor: 'Beat drops, fight and comedy shorts, stat slams, game trailers. Set `scene: false` and `background: "transparent"` to lay the flash + speed lines over other layers; pairs with comic-burst and speed-lines.',
  durationInFrames: 140,
  defaultProps: {
    scene: true,
    at: [30, 66, 102],
    words: ['READY', 'SET', 'GO!'],
    colors: ['#f4efe4', '#ffd23f', '#15151c'],
    inkColor: '#15151c',
    accent: '#ff3b30',
    strength: 1,
    ramp: 0.35,
    flash: 'both',
    lines: true,
    chroma: true,
    background: 'transparent',
  },
  propDocs: {
    scene: 'draw the built-in word scene (false = effect layers only, for overlaying)',
    at: 'frames of the impacts',
    words: 'one giant word per impact',
    colors: 'background colour per impact (cycled)',
    inkColor: 'word colour on light backgrounds',
    accent: 'speed-line / ring / shadow colour',
    strength: 'overall hit strength (1 = shake 2% of the frame, flash, 1.06 punch)',
    ramp: 'extra strength added per successive hit',
    flash: "'invert' | 'white' | 'both' | 'none'",
    lines: 'draw the speed-line burst',
    chroma: 'chromatic RGB split on the hit',
    background: 'backdrop when `scene` is off ("transparent" to overlay)',
  },
  component: ImpactFrame,
  tags: ['impact', 'hit', 'shake', 'flash', 'invert', 'punch', 'zoom', 'chromatic', 'beat', 'drop', 'slam', 'comic', 'fight', 'trailer', 'speed lines', 'overlay', 'camera shake', 'countdown'],
});
