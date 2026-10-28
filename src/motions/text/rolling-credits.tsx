import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {eio, eo3, seg, withAlpha} from '../../core/r3-brand-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Rolling credits. `sections` ([{role, names[]}]) are laid out as a title block, one block per section and an optional closing
 * line. They either roll up at a steady speed so the closing line comes to rest in the middle exactly at the end, or (`bpm` > 0) glide up
 * block by block, landing each one on the beat so the roll can follow music. Roles and names are split in two columns on
 * landscape and stacked and centred on square / portrait frames.
 */
type Section = {role: string; names: string[]};
type Props = {
  title: string;
  sections: Section[];
  closing: string;
  layout: 'auto' | 'split' | 'stack';
  bpm: number;
  beatsPerStep: number;
  background: string;
  ink: string;
  accent: string;
  startAt: number;
  fontFamily: string;
};

type Block = {kind: 'title' | 'section' | 'closing'; y: number; h: number; sec?: Section};

const RollingCredits: React.FC<Props> = ({title, sections, closing, layout, bpm, beatsPerStep, background, ink, accent, startAt, fontFamily}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, portrait, durationInFrames: D} = useStage();
  const fam = fontFamily || fonts.sans;
  const split = layout === 'split' || (layout === 'auto' && !portrait && w / h > 1.3);
  const nameFs = (portrait ? 52 : split ? 46 : 48) * u;
  const nameLh = nameFs * 1.38;
  const roleFs = (portrait ? 30 : 26) * u;
  const roleLh = roleFs * 1.5;
  const titleFs = (portrait ? 96 : 88) * u;
  const gap = (portrait ? 150 : 120) * u;

  // layout (content coordinates, y downwards from 0)
  const blocks: Block[] = [];
  let y = 0;
  if (title) {
    const bh = titleFs * 1.3;
    blocks.push({kind: 'title', y, h: bh});
    y += bh + gap * 1.2;
  }
  for (const s of sections) {
    const n = Math.max(1, s.names.length);
    const bh = split ? Math.max(n * nameLh, roleLh) : roleLh + 14 * u + n * nameLh;
    blocks.push({kind: 'section', y, h: bh, sec: s});
    y += bh + gap;
  }
  if (closing) {
    const bh = nameFs * 1.5;
    blocks.push({kind: 'closing', y, h: bh});
    y += bh;
  }
  const total = Math.max(1, y);
  const centres = blocks.map((b) => b.y + b.h / 2);
  const tail = Math.min(40, Math.round(D * 0.1));
  const f0 = startAt;

  let offset: number; // content y that sits at the top edge of the frame
  if (bpm > 0 && blocks.length > 1) {
    const nb = blocks.length;
    const lead = 14;
    let step = (60 / bpm) * 30 * Math.max(0.25, beatsPerStep);
    step = Math.min(step, Math.max(8, (D - f0 - lead - tail) / (nb - 1)));
    const glide = Math.min(step * 0.62, 36);
    const target = (k: number) => centres[k] - h / 2;
    const t = frame - f0 - lead;
    const k = Math.max(0, Math.min(nb - 2, Math.floor(t / step)));
    const local = t - k * step - (step - glide);
    const e = t < 0 ? 0 : eio(local / glide);
    offset = target(k) + (target(k + 1) - target(k)) * Math.max(0, Math.min(1, e));
    if (t >= (nb - 1) * step) offset = target(nb - 1);
  } else {
    const startOff = -h * 0.92;
    const endOff = total - h * 0.5;
    const p = seg(frame, f0, D - tail);
    offset = startOff + (endOff - startOff) * p;
  }

  const intro = eo3(seg(frame, 0, 18));
  const bg = background === 'transparent' ? undefined : background;
  const mask = 'linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%)';
  const colGap = 44 * u;
  return (
    <AbsoluteFill style={{background: bg, fontFamily: fam}}>
      <AbsoluteFill style={{WebkitMaskImage: mask, maskImage: mask, opacity: intro}}>
        {blocks.map((b, i) => {
          const top = b.y - offset;
          if (top > h + 40 || top + b.h < -40) return null;
          // blocks away from the middle of the frame dim a little
          const mid = top + b.h / 2;
          const dim = 1 - 0.55 * Math.min(1, Math.abs(mid - h / 2) / (h * 0.62)) ** 2;
          if (b.kind === 'title') {
            return (
              <div key={i} style={{position: 'absolute', left: 0, right: 0, top, height: b.h, textAlign: 'center', color: ink, fontWeight: 800, fontSize: titleFs, letterSpacing: '-0.01em', lineHeight: `${b.h}px`, opacity: dim}}>
                {title}
              </div>
            );
          }
          if (b.kind === 'closing') {
            return (
              <div key={i} style={{position: 'absolute', left: 0, right: 0, top, height: b.h, textAlign: 'center', color: withAlpha(ink, 0.85), fontWeight: 600, fontSize: nameFs * 0.92, lineHeight: `${b.h}px`, letterSpacing: '0.02em', opacity: dim}}>
                {closing}
              </div>
            );
          }
          const s = b.sec as Section;
          if (split) {
            return (
              <div key={i} style={{position: 'absolute', left: 0, right: 0, top, height: b.h, opacity: dim}}>
                <div style={{position: 'absolute', right: cx + colGap / 2, top: 0, textAlign: 'right', color: accent, fontWeight: 800, fontSize: roleFs, letterSpacing: '0.18em', textTransform: 'uppercase', lineHeight: `${nameLh}px`, maxWidth: w * 0.42}}>
                  {s.role}
                </div>
                <div style={{position: 'absolute', left: cx + colGap / 2, top: 0, color: ink, fontWeight: 600, fontSize: nameFs, lineHeight: `${nameLh}px`, maxWidth: w * 0.42}}>
                  {s.names.map((n, k) => (
                    <div key={k}>{n}</div>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div key={i} style={{position: 'absolute', left: 0, right: 0, top, height: b.h, textAlign: 'center', opacity: dim, padding: `0 ${w * 0.06}px`}}>
              <div style={{color: accent, fontWeight: 800, fontSize: roleFs, letterSpacing: '0.2em', textTransform: 'uppercase', lineHeight: `${roleLh}px`, marginBottom: 14 * u}}>{s.role}</div>
              {s.names.map((n, k) => (
                <div key={k} style={{color: ink, fontWeight: 600, fontSize: nameFs, lineHeight: `${nameLh}px`}}>
                  {n}
                </div>
              ))}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const rollingCredits = defineMotion<Props>({
  id: 'rolling-credits',
  title: 'Rolling credits',
  category: 'text',
  description:
    'Credits that roll up from a list of {role, names[]} sections under a title: roles in small tracked accent caps beside (landscape) or above (portrait) the names, soft edge fade, a steady scroll that settles on the closing line at the end, or beat-locked glides (set a bpm) that land one section per bar for music.',
  source: ['original (branding pass, round 3)'],
  useFor: 'End credits for films, videos and podcasts, "made by" rolls, cast / crew / thanks lists; pass bpm to match the music.',
  durationInFrames: 480,
  defaultProps: {
    title: 'Credits',
    sections: [
      {role: 'Directed by', names: ['Alex Morgan']},
      {role: 'Written by', names: ['Sam Rivera', 'Jordan Lee']},
      {role: 'Cinematography', names: ['Casey Nguyen']},
      {role: 'Edited by', names: ['Robin Ellis']},
      {role: 'Music', names: ['Taylor Brooks', 'The Night Owls']},
      {role: 'Special thanks', names: ['Our supporters', 'Friends and family']},
    ],
    closing: 'Thank you for watching',
    layout: 'auto',
    bpm: 0,
    beatsPerStep: 4,
    background: '#0B0B0F',
    ink: '#F2EFE8',
    accent: '#E0A23B',
    startAt: 0,
    fontFamily: '',
  },
  propDocs: {
    title: 'heading that rolls first ("" = none)',
    sections: '[{role, names[]}] credit blocks, in order',
    closing: 'last centred line ("" = none)',
    layout: 'auto | split (role left, names right) | stack (role above names, centred)',
    bpm: '0 = steady scroll to the end; e.g. 96 = glide to a new block every `beatsPerStep` beats',
    beatsPerStep: 'beats between blocks when bpm is set (4 = one per bar)',
    background: 'backdrop colour, or "transparent" to roll over footage',
    ink: 'names colour',
    accent: 'role label colour',
    startAt: 'frame the roll starts',
    fontFamily: 'optional CSS font-family',
  },
  component: RollingCredits,
  tags: ['credits', 'rolling credits', 'end credits', 'scroll', 'outro', 'cast', 'crew', 'film', 'thanks', 'roll', 'music', 'beat', 'bpm', 'sections', 'names'],
});
