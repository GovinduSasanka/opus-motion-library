// Adapted from ClaudeAnimationBase/src/clawd.js lunchbox() chomp idea (MIT, © 2026 John Heibel) — see THIRD_PARTY_NOTICES.md
// Original take for our ink-drop mascot "Nib": instead of a hinged box lid, the mouth stretches into a wide toothy D whose
// teeth are sized to the opening, snapping shut on every beat.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {NIB_COLORS, NIB_PROP_DOCS, Nib, NibBackdrop, NibLook, hashN, nibColorsFrom, nibPoseAt, nibUnit} from '../../core/r2-mascot-kit';

type Props = {
  items: string[];
  everyBeats: number;
  emotion: string;
  bpm: number;
  offsetSec: number;
  itemColor: string;
  size: number;
  bodyColor: string;
  inkColor: string;
  accent: string;
  look: NibLook;
  background: string;
};

const ChompLid: React.FC<Props> = ({items, everyBeats, emotion, bpm, offsetSec, itemColor, size, bodyColor, inkColor, accent, look, background}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const ru = nibUnit(size, w, h);
  const gx = w * (portrait ? 0.38 : 0.36);
  const gy = h * 0.8;
  const beatSec = 60 / bpm;
  const t = frame / fps;
  const bp = (t - offsetSec) / beatSec;
  const every = Math.max(1, Math.round(everyBeats));
  // chomp cycle: opens wide during the bar before each bite, snaps shut on the bite beat
  const cyc = ((bp % every) + every) % every;
  const k = cyc / every;
  const open = k < 0.08 ? 1 - k / 0.08 : Math.min(1, Math.pow((k - 0.08) / 0.7, 0.7));
  const bite = Math.floor(bp / every);
  const sinceBite = cyc * beatSec;
  const pose = nibPoseAt({frame, fps, bpm, offsetSec, emotion, seed: 3});
  pose.mouth = 'chomp';
  pose.chomp = 0.05 + 0.95 * open;
  pose.sq += 0.12 * Math.exp(-sinceBite * 14) - 0.05 * open;
  pose.dy -= 0.5 * open;
  pose.rot += 0.04 * open;
  pose.flip = false;
  pose.aL = -0.3 + 0.6 * open;
  pose.aR = -0.3 + 0.6 * open;
  const colors = nibColorsFrom({bodyColor, inkColor, accent});
  const ink = inkColor || NIB_COLORS.ink;
  // mouth position on screen (face is at body-local (0,-3.75) + dy)
  const mx = gx + ru * 0.2;
  const my = gy + (pose.dy - 3.5) * ru * (1 - pose.sq);
  const list = items.length ? items : ['DATA'];
  const fsz = ru * 0.95;
  return (
    <AbsoluteFill>
      <Svg>
        <NibBackdrop background={background} w={w} h={h} u={u} floorY={gy + ru * 0.12} id="chmp" />
        <Nib id="chmpnib" x={gx} y={gy} u={ru} pose={pose} colors={colors} look={look} fps={fps} />
        {/* the next two items in flight: launched from the right one cycle before their bite */}
        {[bite, bite + 1].map((b) => {
          const tBite = offsetSec + b * every * beatSec;
          const tLaunch = tBite - every * beatSec * 0.95;
          const kk = (t - tLaunch) / (tBite - tLaunch);
          if (kk < 0 || kk > 1) return null;
          const sx = w + ru * 3;
          const sy = gy - ru * (6 + 3 * hashN(b, 2));
          const e = kk;
          const x = sx + (mx - sx) * e;
          const y = sy + (my - sy) * e - ru * 5 * 4 * e * (1 - e);
          const label = list[((b % list.length) + list.length) % list.length];
          const bw = Math.max(fsz * 2.2, label.length * fsz * 0.68 + fsz * 0.8);
          const rot = (1 - e) * 140 * (hashN(b) - 0.5);
          return (
            <g key={b} transform={`translate(${x} ${y}) rotate(${rot}) scale(${0.65 + 0.35 * (1 - e)})`}>
              <rect x={-bw / 2} y={-fsz * 0.85} width={bw} height={fsz * 1.7} rx={fsz * 0.25} fill={itemColor} stroke={ink} strokeWidth={Math.max(1.2, ru * 0.1)} />
              <text y={fsz * 0.34} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={fsz} fill={ink}>
                {label}
              </text>
            </g>
          );
        })}
        {/* crumbs from the last bite */}
        {sinceBite < 0.6 && bp >= 0
          ? Array.from({length: 9}, (_, i) => {
              const a = sinceBite;
              const ang = -0.3 + (hashN(i, bite) - 0.5) * 2.2;
              const sp = ru * (4 + 5 * hashN(i, bite, 2));
              const cx = mx + Math.cos(ang) * sp * a * 2 + ru * 1.2;
              const cy = my + Math.sin(ang) * sp * a * 2 + ru * 9 * a * a;
              return <rect key={i} x={cx} y={cy} width={ru * 0.35} height={ru * 0.35} fill={i % 3 ? itemColor : ink} opacity={1 - a / 0.6} transform={`rotate(${i * 40 + a * 400} ${cx} ${cy})`} />;
            })
          : null}
      </Svg>
    </AbsoluteFill>
  );
};

export const chompLid = defineMotion<Props>({
  id: 'chomp-lid',
  title: 'Chomp on the beat (Nib muncher)',
  category: 'mascot',
  description:
    'Nib opens its mouth into a huge toothy D (teeth always sized to the gap) and snaps it shut on the beat, munching labelled blocks that arc in from the side one per bite, with a squash on each chomp and a spray of crumbs.',
  source: ['ClaudeAnimationBase src/clawd.js lunchbox() (MIT): teeth height min(.8u, .42·gap), dark interior + tongue; re-designed as a mouth chomp for Nib'],
  useFor: '“Eats your data / bugs / inbox” metaphors, rage or hunger beats, music-synced munching for promos.',
  durationInFrames: 180,
  defaultProps: {
    items: ['DATA', 'BUGS', 'TODO', 'SPAM', 'LOGS'],
    everyBeats: 2,
    emotion: 'determined',
    bpm: 120,
    offsetSec: 0.5,
    itemColor: '#F2B84B',
    size: 0.44,
    bodyColor: NIB_COLORS.body,
    inkColor: NIB_COLORS.ink,
    accent: NIB_COLORS.accent,
    look: 'ink-wash',
    background: 'paper',
  },
  propDocs: {
    items: 'labels on the blocks it eats (cycles)',
    everyBeats: 'beats per bite',
    emotion: 'eyes/brows/body mood while chomping (determined, furious, excited, mischief…)',
    itemColor: 'block colour',
    size: 'character height as a fraction of the frame height',
    background: "'paper', 'transparent' or any colour",
    ...NIB_PROP_DOCS,
  },
  component: ChompLid,
  tags: ['chomp', 'munch', 'eat', 'mouth', 'teeth', 'mascot', 'nib', 'character', 'beat', 'music', 'rage', 'hungry', 'data muncher', 'cartoon'],
});
