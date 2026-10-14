import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {clamp, ease} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {Backdrop, BackdropKind, eic, eioc, estWidth, fitSize} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Chapter / stage headers.
 * - stage (video8 stage-title-block): top-left "01 / 08" counter, big tracked title that drops 20 px
 *   through a mask in 5 f (ease-out) after a hard 1–2 f blank, subtitle fades in 4 f later, 9-dash
 *   progress bar lights the current stage.
 * - era (video14 era-badge-crossfade): top-right translucent card with a bold year and subtitle;
 *   text crossfades in 0.3 s while the card width eases to fit.
 * - location (video10 vertical-location-label): tall vermilion tag on the right edge, letters
 *   stacked vertically, era line below; drops in from above in 6 f with a slight overshoot.
 */

type Stage = {title: string; subtitle?: string};
type Props = {
  variant: 'stage' | 'era' | 'location';
  stages: Stage[];
  stageFrames: number;
  startFrame: number;
  startIndex: number;
  total: number;
  scale: number;
  color: string;
  accent: string;
  backdrop: BackdropKind | 'auto';
  src: string;
};

const SAMPLES: Record<Props['variant'], Stage[]> = {
  stage: [
    {title: 'NOISE', subtitle: 'one octave of noise.'},
    {title: 'FRACTAL', subtitle: 'six octaves, summed.'},
    {title: 'EROSION', subtitle: 'water carves the ridges.'},
  ],
  era: [
    {title: '1642', subtitle: 'Rembrandt · Chiaroscuro'},
    {title: '1831', subtitle: 'Hokusai · The Great Wave'},
    {title: '1889', subtitle: 'Van Gogh · Starry Night'},
  ],
  location: [
    {title: 'ROME', subtitle: 'C. 100 AD'},
    {title: 'LONDON', subtitle: '1730S'},
    {title: 'PARIS', subtitle: '1880S'},
  ],
};

const dropEase = Easing.bezier(0.2, 0.9, 0.3, 1.05);

const ChapterHeader: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const stages = p.stages.length ? p.stages : SAMPLES[p.variant];
  const rel = frame - p.startFrame;
  const idx = clamp(Math.floor(rel / p.stageFrames), 0, stages.length - 1);
  const local = rel - idx * p.stageFrames;
  const st = stages[idx];
  const S = p.scale * u;
  const backdrop: BackdropKind = p.backdrop === 'auto' ? (p.variant === 'stage' ? 'dunes' : p.variant === 'era' ? 'warm' : 'dusk') : p.backdrop;

  let body: React.ReactNode = null;

  if (p.variant === 'stage') {
    const n = p.startIndex + idx;
    const blank = idx > 0 && local < 2;
    const tIn = ease.out(clamp((local - 2) / 5));
    const tFirst = idx === 0 ? ease.out(clamp(local / 5)) : tIn;
    const sub = clamp((local - (idx === 0 ? 4 : 6)) / 4) * 0.85;
    const left = (portrait ? 56 : 72) * u;
    const titleFs = fitSize(st.title, 78 * S, w - left * 2, 'sans', 0.12);
    body = rel < 0 ? null : (
      <div style={{position: 'absolute', left, top: (portrait ? 140 : 80) * u, color: p.color}}>
        <div style={{fontFamily: fonts.mono, fontSize: 24 * S, opacity: 0.7, letterSpacing: '0.12em'}}>
          {String(n).padStart(2, '0')} / {String(p.total).padStart(2, '0')}
        </div>
        <div style={{overflow: 'hidden', paddingBottom: 6 * S, marginTop: 4 * S}}>
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: titleFs,
              letterSpacing: '0.12em',
              lineHeight: 1.15,
              textShadow: `0 ${3 * u}px ${12 * u}px rgba(0,0,0,.35)`,
              opacity: blank ? 0 : tFirst,
              transform: `translateY(${(1 - tFirst) * -30 * S}px)`,
            }}
          >
            {st.title}
          </div>
        </div>
        <div style={{fontFamily: fonts.sans, fontWeight: 400, fontSize: 36 * S, opacity: blank ? 0 : sub, textShadow: `0 ${2 * u}px ${8 * u}px rgba(0,0,0,.3)`}}>{st.subtitle}</div>
        <div style={{display: 'flex', gap: 6 * S, marginTop: 18 * S}}>
          {Array.from({length: p.total + 1}, (_, i) => (
            <div key={i} style={{width: 40 * S, height: 4 * S, borderRadius: 2 * S, background: i <= n ? p.color : 'rgba(160,163,172,0.45)'}} />
          ))}
        </div>
      </div>
    );
  }

  if (p.variant === 'era') {
    const prev = stages[Math.max(0, idx - 1)];
    const x = idx === 0 ? 1 : eioc(local / 9);
    const enter = idx === 0 ? ease.out(clamp(rel / 10)) : 1;
    const yearFs = 64 * S;
    const subFs = 32 * S;
    const pad = 30 * S;
    const wOf = (s: Stage) => Math.max(estWidth(s.title, yearFs, 'sans') * 1.05, estWidth(s.subtitle ?? '', subFs, 'sans') * 1.12);
    const cw = Math.min(w * 0.86, interpolate(x, [0, 1], [wOf(prev), wOf(st)]) + pad * 2);
    const Face: React.FC<{s: Stage; o: number}> = ({s, o}) => (
      <div style={{position: 'absolute', right: pad, top: pad * 0.7, textAlign: 'right', opacity: o, whiteSpace: 'nowrap'}}>
        <div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: yearFs, color: '#1f2018', lineHeight: 1.1}}>{s.title}</div>
        <div style={{fontFamily: fonts.sans, fontWeight: 600, fontSize: subFs, color: '#3a372e', marginTop: 8 * S}}>{s.subtitle}</div>
      </div>
    );
    body = rel < 0 ? null : (
      <div
        style={{
          position: 'absolute',
          right: (portrait ? 44 : 60) * u,
          top: (portrait ? 120 : 56) * u,
          width: cw,
          height: yearFs * 1.1 + subFs * 1.3 + 8 * S + pad * 1.4,
          borderRadius: 18 * S,
          background: 'rgba(250,246,238,0.86)',
          boxShadow: `0 ${8 * u}px ${30 * u}px rgba(0,0,0,0.35)`,
          opacity: enter,
          transform: `translateY(${(1 - enter) * -16 * u}px)`,
          overflow: 'hidden',
        }}
      >
        {idx > 0 && x < 1 && <Face s={prev} o={1 - x} />}
        <Face s={st} o={x} />
      </div>
    );
  }

  if (p.variant === 'location') {
    const letterFs = 66 * S;
    const pitch = 76 * S;
    const tag = (s: Stage, ty: number, key: string) => {
      const letters = [...s.title];
      const tw = Math.max(letterFs * 1.75, estWidth(s.subtitle ?? '', 24 * S, 'sans', 0.04) * 1.1 + 44 * S);
      const th = letters.length * pitch + 110 * S;
      return (
        <div
          key={key}
          style={{
            position: 'absolute',
            right: (portrait ? 48 : 72) * u,
            top: (portrait ? 150 : 70) * u,
            width: tw,
            height: Math.min(th, h * 0.8),
            background: p.accent,
            transform: `translateY(${ty}%)`,
            boxShadow: `0 ${6 * u}px ${20 * u}px rgba(0,0,0,0.35)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 34 * S,
          }}
        >
          <div style={{position: 'absolute', inset: 8 * S, border: `${2.5 * S}px solid ${p.color}`, opacity: 0.9}} />
          {letters.map((c, i) => (
            <div key={i} style={{fontFamily: fonts.serif, fontWeight: 500, fontSize: letterFs, color: p.color, height: pitch, lineHeight: `${pitch}px`}}>
              {c}
            </div>
          ))}
          <div style={{fontFamily: fonts.sans, fontWeight: 700, fontSize: 24 * S, color: p.color, marginTop: 10 * S, letterSpacing: '0.04em', whiteSpace: 'nowrap'}}>{s.subtitle}</div>
        </div>
      );
    };
    const outT = idx < stages.length - 1 ? eic((local - (p.stageFrames - 6)) / 5) : 0;
    const inT = interpolate(local, [0, 6], [0, 1], {easing: dropEase, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const ty = rel < 0 ? -130 : -130 * (1 - inT) - 130 * outT;
    body = <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>{tag(st, ty, `t${idx}`)}</div>;
  }

  // gentle push to keep the scene alive; stage changes add a small camera kick like a cut
  const kick = idx > 0 && local < 8 ? (1 - local / 8) * 0.012 : 0;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${1.02 + frame * 0.0002 + kick})`}}>
        <Backdrop kind={backdrop} src={p.src || undefined} drift={p.variant === 'stage' ? 1 + idx * 0.6 : 0.5} />
      </AbsoluteFill>
      {body}
    </AbsoluteFill>
  );
};

export const chapterHeader = defineMotion<Props>({
  id: 'chapter-header',
  title: 'Chapter header',
  category: 'text',
  description: 'Numbered chapter/stage header that steps through titles: tracked title + segmented progress bar, era badge card, or vertical location tag.',
  source: ['video8 0:00-0:36', 'video17 0:00-0:39', 'video14 0:00-2:06', 'video10 0:14.5-0:16.4'],
  useFor: 'Step-by-step explainers, timelines, era/location markers and chapter breaks.',
  durationInFrames: 180,
  defaultProps: {
    variant: 'stage',
    stages: [],
    stageFrames: 56,
    startFrame: 8,
    startIndex: 1,
    total: 8,
    scale: 1.25,
    color: '#f0f4f6',
    accent: '#c14d3c',
    backdrop: 'auto',
    src: '',
  },
  propDocs: {
    variant: 'stage (video8 top-left block) | era (video14 top-right year card) | location (video10 vertical tag)',
    stages: '[{title, subtitle}] stepped through in order; [] = built-in sample for the variant',
    stageFrames: 'frames per stage',
    startFrame: 'frame the first stage appears',
    startIndex: 'stage: number shown for the first stage',
    total: 'stage: total count shown after the slash (progress dashes = total + 1)',
    scale: 'overall size multiplier (1 = source size at 1080p)',
    color: 'text colour (stage) / letter + border colour (location)',
    accent: 'location tag fill',
    backdrop: 'auto (dunes / warm / dusk per variant) | any backdrop kind',
    src: 'optional public/ image behind the header',
  },
  component: ChapterHeader,
  tags: ['chapter', 'title', 'progress', 'badge', 'label', 'timeline'],
});
