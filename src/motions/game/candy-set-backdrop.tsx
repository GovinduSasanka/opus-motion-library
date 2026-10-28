// Adapted from lemo-opuscar/styles/game-show/demo/main_v1.js stripes()/dots()/raysEl() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {CANDY, CandySet, CandyVariant, Telop, backOut, hopY, isClear, la2Fonts, mixHex, punchSum, seg, shadeHex, starPathN} from '../../core/r2-la2-kit';

/**
 * candy-set-backdrop — a full-bleed game-show set: one saturated hue with a same-hue lighter pattern
 * (slowly scrolling diagonal stripes, offset polka dots or a rotating sunburst), an optional darker floor band
 * with an 8 px ink line, a hard-cut hue change per section with a white flash, and a beat-punch camera.
 */
type Props = {
  variant: CandyVariant;
  hues: string[];
  sections: number;
  bpm: number;
  floor: boolean;
  tag: string;
  showTag: boolean;
  punch: boolean;
  scrollSpeed: number;
  rays: number;
  patternLift: number;
  background: string;
};

const CandySetBackdrop: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const beat = 60 / p.bpm;
  const bar = beat * 4;
  const overlay = isClear(p.background);
  // section = 2 bars; hard cut + white flash on the bar line
  const secLen = 2 * bar;
  const sec = Math.floor(t / secLen);
  const hue = p.hues[sec % p.hues.length] ?? CANDY.purple;
  const pattern = mixHex(hue, '#FFFFFF', p.patternLift);
  const tSec = t % secLen;
  const flash = sec > 0 ? Math.max(0, 1 - (t - sec * secLen) / 0.08) * 0.9 : 0;
  // beat punch camera
  const punches: [number, number][] = [];
  if (p.punch) {
    for (let b = 0; b * beat < secLen + 1; b++) punches.push([b * beat, b % 4 === 0 ? 0.03 : 0.012]);
  }
  const z = 1.06 + (p.punch ? -punchSum(tSec, punches) * 0 + punchSum(tSec, punches) : 0) * 0; // stage oversized 6 %
  const zoom = 1.06 + (p.punch ? punchSum(tSec, punches) : 0);
  void z;
  const floorY = h * (portrait ? 0.86 : 0.815);
  const tagIn = backOut(seg(frame, 6, 16), 1.9);
  const tagHop = hopY(t, beat, 6 * u);
  const tagSize = Math.min(64 * u, (w * 0.5) / Math.max(4, p.tag.length * 0.62));
  // idle bursts on downbeats near the floor (little star pops to keep life)
  const burstT = tSec % bar;
  const bi = Math.floor(tSec / bar);
  const bx = w * (0.18 + 0.64 * (((sec * 3 + bi * 7) % 5) / 4));
  const bp = burstT / 0.3;
  return (
    <AbsoluteFill style={{background: overlay ? 'transparent' : p.background}}>
      <Svg>
        <g transform={`translate(${w / 2} ${h / 2}) scale(${zoom}) translate(${-w / 2} ${-h / 2})`}>
          <CandySet w={w} h={h} u={u} variant={p.variant} hue={hue} pattern={pattern} tSec={tSec * p.scrollSpeed + sec * 1.7} rays={p.rays} />
          {p.floor && (
            <g>
              <rect x={-w * 0.05} y={floorY} width={w * 1.1} height={h - floorY + h * 0.08} fill={shadeHex(hue, -0.25)} />
              <rect x={-w * 0.05} y={floorY - 4 * u} width={w * 1.1} height={8 * u} fill={CANDY.ink} />
            </g>
          )}
          {bp < 1 && bp > 0 && p.punch && (
            <g transform={`translate(${bx} ${floorY - 60 * u}) scale(${(0.55 + 0.7 * (1 - (1 - bp) * (1 - bp))) * u}) rotate(${bp * 30})`} opacity={1 - bp * bp}>
              <path d={starPathN(8, 70, 28)} fill={CANDY.yellow} stroke={CANDY.ink} strokeWidth={6} strokeLinejoin="round" />
              <circle r={50 + 60 * bp} fill="none" stroke={CANDY.white} strokeWidth={10 * (1 - bp)} />
            </g>
          )}
          {p.showTag && (
            <g transform={`translate(${w / 2} ${h * (portrait ? 0.16 : 0.2) + tagHop}) scale(${tagIn}) rotate(-4)`}>
              <rect x={-tagSize * p.tag.length * 0.36 - 30 * u + 10 * u} y={-tagSize * 0.85 + 14 * u} width={tagSize * p.tag.length * 0.72 + 60 * u} height={tagSize * 1.7} rx={tagSize * 0.5} fill={CANDY.ink} />
              <rect x={-tagSize * p.tag.length * 0.36 - 30 * u} y={-tagSize * 0.85} width={tagSize * p.tag.length * 0.72 + 60 * u} height={tagSize * 1.7} rx={tagSize * 0.5} fill={CANDY.cream} stroke={CANDY.ink} strokeWidth={7 * u} />
              <Telop x={0} y={tagSize * 0.36} size={tagSize} text={p.tag} fill={shadeHex(hue, -0.2)} font={la2Fonts.fredoka} strokeRatio={0} ink="none" />
            </g>
          )}
        </g>
        {flash > 0 && <rect width={w} height={h} fill="#fff" opacity={flash} />}
      </Svg>
    </AbsoluteFill>
  );
};

export const candySetBackdrop = defineMotion<Props>({
  id: 'candy-set-backdrop',
  title: 'Candy set backdrop',
  category: 'game',
  description:
    'Full-bleed game-show set: one saturated candy hue with a same-hue lighter pattern — slowly scrolling diagonal stripes, offset polka dots or a rotating sunburst — plus a darker floor band with an ink line, a hopping "GAME 1" pill, star bursts and beat punches; the hue hard-cuts with a white flash every two bars.',
  source: ['lemo-opuscar styles/game-show (MIT, LemoLab) — demo/main_v1.js stripes, dots, raysEl, punch, burst'],
  useFor: 'Instant loud backdrop for quizzes, kids content, sales promos, chapter cards; pairs with kinetic-captions, comic-burst and bean mascots.',
  durationInFrames: 240,
  defaultProps: {
    variant: 'rays',
    hues: [CANDY.purple, CANDY.teal, CANDY.red, CANDY.blue],
    sections: 4,
    bpm: 150,
    floor: true,
    tag: 'GAME 1',
    showTag: true,
    punch: true,
    scrollSpeed: 1,
    rays: 20,
    patternLift: 0.12,
    background: '#000',
  },
  propDocs: {
    variant: 'pattern: stripes | dots | rays',
    hues: 'one hue per section (hard cut every 2 bars)',
    sections: 'how many hue sections the duration is cut into (informational)',
    bpm: 'tempo for scroll, hops and punches (150 = source)',
    floor: 'darker floor band with the 8 px ink line',
    tag: 'text in the cream pill',
    showTag: 'show the pill',
    punch: 'beat-punch camera + star bursts on downbeats',
    scrollSpeed: 'pattern scroll/rotate speed multiplier',
    rays: 'ray count for the sunburst variant',
    patternLift: 'how much lighter the pattern is than the hue (0..1)',
    background: 'behind the set (visible only if the set were transparent)',
  },
  component: CandySetBackdrop,
  tags: ['game-show', 'candy', 'backdrop', 'stripes', 'polka-dots', 'sunburst', 'rays', 'flat', 'vector', 'kids', 'quiz', 'variety', 'beat', 'punch', 'set', 'background', 'loud'],
});
