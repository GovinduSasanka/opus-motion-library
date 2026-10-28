import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {FilmGrain, useStage, Vignette} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {mixHex5, pipLayout, PipCorner, rgba5} from '../../core/r2-pr5-kit';

/**
 * Talking-head PiP: the speaker's footage starts full-frame, then shrinks into a circular (or rounded) picture-in-picture
 * in a corner while B-roll cards (your images or procedural illustrations) fill the main frame and captions stay clear
 * of the window. With no `videoSrc` an original presenter silhouette with a speech-driven mouth stands in.
 */

type Scene = {title: string; image?: string; caption?: string};

type Props = {
  videoSrc: string;
  videoStartFrom: number;
  muted: boolean;
  scenes: Scene[];
  corner: PipCorner;
  shape: 'circle' | 'rounded';
  diameter: number;
  margin: number;
  shrinkAt: number;
  ring: number;
  ringColor: string;
  background: string;
  accent: string;
  ink: string;
  captions: boolean;
  speakerName: string;
};

const BROLL_PALETTES = [
  ['#1F2A6B', '#4F7BFF', '#9FD0FF'],
  ['#5B1F4E', '#E2559F', '#FFC4A8'],
  ['#0F4D45', '#2FBF9F', '#E5FFD1'],
  ['#4A2A0B', '#E98A2D', '#FFE9A8'],
];

/** procedural illustration card: layered gradient + shapes (used when no image is given) */
const Broll: React.FC<{scene: Scene; i: number; frame: number; u: number}> = ({scene, i, frame, u}) => {
  const pal = BROLL_PALETTES[i % BROLL_PALETTES.length];
  const drift = Math.sin(frame / 55 + i) * 14 * u;
  const kind = i % 3;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: `linear-gradient(155deg, ${pal[0]}, ${mixHex5(pal[0], pal[1], 0.55)})`}}>
      {scene.image ? <Img src={resolveSrc(scene.image)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.05 + 0.04 * Math.sin(frame / 90)})`}} /> : null}
      {!scene.image ? (
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', transform: `translateY(${drift}px)`}}>
          <circle cx={kind === 0 ? 70 : 32} cy={34} r={26} fill={pal[1]} opacity={0.9} />
          <circle cx={kind === 0 ? 70 : 32} cy={34} r={38} fill="none" stroke={pal[2]} strokeWidth={0.6} opacity={0.5} />
          {kind === 1 ? [...Array(7)].map((_, k) => <rect key={k} x={10 + k * 12} y={78 - (k % 4) * 9 - 6} width={7} height={(k % 4) * 9 + 6 + 22} rx={1.4} fill={pal[2]} opacity={0.35 + (k % 3) * 0.2} />) : null}
          {kind === 2 ? <path d="M0 74 C20 60 34 84 54 70 S86 58 100 70 V100 H0 Z" fill={pal[2]} opacity={0.5} /> : null}
          {kind === 0 ? <path d="M0 80 L26 52 L44 70 L66 40 L100 78 V100 H0 Z" fill={pal[2]} opacity={0.45} /> : null}
          <rect x={8} y={8} width={26} height={2.4} rx={1.2} fill="#fff" opacity={0.5} />
          <rect x={8} y={14} width={16} height={2.4} rx={1.2} fill="#fff" opacity={0.3} />
        </svg>
      ) : null}
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.5) 100%)'}} />
      <div style={{position: 'absolute', left: 54 * u, top: 54 * u, fontFamily: fonts.mono, fontSize: 18 * u, color: '#fff', opacity: 0.7, letterSpacing: 3 * u}}>{String(i + 1).padStart(2, '0')}</div>
      <div style={{position: 'absolute', left: 54 * u, right: 54 * u, top: '36%', fontFamily: fonts.grotesk, fontWeight: 700, fontSize: 82 * u, lineHeight: 1.02, color: '#fff', letterSpacing: -2 * u, textShadow: `0 ${6 * u}px ${30 * u}px rgba(0,0,0,0.35)`}}>
        {scene.title}
      </div>
    </div>
  );
};

/** original stand-in presenter: head, shoulders, speech-driven mouth, blink */
const Presenter: React.FC<{frame: number; accent: string; bg: string}> = ({frame, accent, bg}) => {
  const talk = Math.max(0, Math.sin(frame * 0.55) * 0.6 + Math.sin(frame * 0.23 + 1) * 0.5 + Math.sin(frame * 1.1) * 0.2);
  const mouth = Math.min(1, talk) * (Math.sin(frame / 37) > -0.9 ? 1 : 0.1);
  const blink = frame % 96 > 91 ? 0.1 : 1;
  const sway = Math.sin(frame / 41) * 1.2;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', background: `radial-gradient(circle at 50% 35%, ${mixHex5(bg, accent, 0.55)}, ${mixHex5(bg, '#000000', 0.25)})`}}>
      <g transform={`translate(${sway} 0)`}>
        <path d="M8 104 C10 78 28 70 50 70 C72 70 90 78 92 104 Z" fill="#2A3350" />
        <path d="M38 70 L50 84 L62 70 Z" fill="#F3F4F8" />
        <rect x={43} y={56} width={14} height={18} rx={6} fill="#E7B390" />
        <ellipse cx={50} cy={40} rx={19} ry={22} fill="#EFC09C" />
        <path d="M30 38 C28 16 48 10 58 14 C72 18 74 30 70 40 C66 28 58 24 46 26 C38 28 34 32 30 38 Z" fill="#3A2B28" />
        <ellipse cx={42.5} cy={41} rx={2.2} ry={2.6 * blink} fill="#2B2230" />
        <ellipse cx={57.5} cy={41} rx={2.2} ry={2.6 * blink} fill="#2B2230" />
        <path d="M38 35.5 Q42.5 33.6 46.5 35" stroke="#3A2B28" strokeWidth={1.2} fill="none" strokeLinecap="round" />
        <path d="M53.5 35 Q57.5 33.6 62 35.5" stroke="#3A2B28" strokeWidth={1.2} fill="none" strokeLinecap="round" />
        <ellipse cx={50} cy={52} rx={5 + mouth * 1.4} ry={0.9 + mouth * 3.4} fill="#7A2E3A" />
        <path d="M48.5 46 Q50 47.8 51.5 46" stroke="#C98D6C" strokeWidth={0.9} fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
};

const TalkingHeadPip: React.FC<Props> = ({videoSrc, videoStartFrom, muted, scenes, corner, shape, diameter, margin, shrinkAt, ring, ringColor, background, accent, ink, captions, speakerName}) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const pip = pipLayout(w, h, u, corner, diameter, margin);
  const shrink = prog(frame, shrinkAt, shrinkAt + 16, ease.expoInOut);

  // geometry: full frame -> PiP
  const x = lerp(0, pip.x, shrink);
  const y = lerp(0, pip.y, shrink);
  const bw = lerp(w, pip.d, shrink);
  const bh = lerp(h, pip.d, shrink);
  const radius = shape === 'circle' ? lerp(0, pip.d / 2, shrink) : lerp(0, pip.d * 0.2, shrink);
  const ringW = ring * u * shrink;

  // B-roll sequencing
  const roll = Math.max(0, frame - (shrinkAt + 4));
  const per = Math.max(40, (durationInFrames - shrinkAt - 20) / Math.max(1, scenes.length));
  const idx = Math.min(scenes.length - 1, Math.floor(roll / per));
  const local = roll - idx * per;
  const inE = prog(local, 0, 16, ease.out);
  const outE = idx < scenes.length - 1 ? prog(local, per - 10, per, ease.in) : 0;
  const mainIn = prog(frame, shrinkAt + 2, shrinkAt + 14, ease.out);
  const sc = scenes[idx] ?? {title: ''};
  const cap = sc.caption ?? '';

  return (
    <AbsoluteFill style={{background}}>
      {/* main frame B-roll */}
      <AbsoluteFill style={{opacity: mainIn, transform: `scale(${0.94 + 0.06 * mainIn})`}}>
        <AbsoluteFill style={{transform: `translateX(${(1 - inE) * 60 * u - outE * 60 * u}px)`, opacity: inE * (1 - outE)}}>
          <Broll scene={sc} i={idx} frame={frame} u={u} />
        </AbsoluteFill>
        {/* progress dashes */}
        <div style={{position: 'absolute', left: 54 * u, top: 20 * u, display: 'flex', gap: 8 * u}}>
          {scenes.map((_, k) => (
            <div key={k} style={{width: 46 * u, height: 5 * u, borderRadius: 3 * u, background: rgba5('#fff', k < idx ? 0.9 : k === idx ? 0.55 : 0.22), overflow: 'hidden'}}>
              {k === idx ? <div style={{width: `${clamp(local / per) * 100}%`, height: '100%', background: '#fff'}} /> : null}
            </div>
          ))}
        </div>
      </AbsoluteFill>

      {/* captions, kept clear of the PiP */}
      {captions && cap ? (
        <div style={{position: 'absolute', left: pip.capX, width: pip.capW, bottom: h - pip.capBottom, opacity: prog(local, 6, 16) * (1 - outE) * mainIn}}>
          <span style={{display: 'inline-block', fontFamily: fonts.sans, fontWeight: 800, fontSize: 44 * u, lineHeight: 1.16, color: ink, background: rgba5('#0B0B12', 0.72), padding: `${10 * u}px ${20 * u}px`, borderRadius: 14 * u, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>{cap}</span>
        </div>
      ) : null}

      {/* the speaker */}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: bw,
          height: bh,
          borderRadius: radius,
          overflow: 'hidden',
          boxShadow: `0 ${18 * u * shrink}px ${46 * u * shrink}px rgba(0,0,0,0.45), 0 0 0 ${ringW}px ${ringColor}`,
          transform: `scale(${1 + 0.035 * Math.sin(Math.max(0, frame - shrinkAt - 16) / 28) * shrink})`,
        }}
      >
        {videoSrc ? (
          <OffthreadVideo src={resolveSrc(videoSrc)} startFrom={videoStartFrom} muted={muted} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        ) : (
          <Presenter frame={frame} accent={accent} bg={background} />
        )}
      </div>
      {speakerName && shrink > 0.9 ? (
        <div style={{position: 'absolute', left: pip.x, width: pip.d, top: corner.startsWith('bottom') ? pip.y - 40 * u : pip.y + pip.d + 12 * u, textAlign: 'center', fontFamily: fonts.mono, fontSize: 17 * u, letterSpacing: 2 * u, color: ink, opacity: 0.75 * prog(frame, shrinkAt + 16, shrinkAt + 30)}}>
          {speakerName.toUpperCase()}
        </div>
      ) : null}
      <Vignette strength={0.3} />
      <FilmGrain opacity={0.035} />
    </AbsoluteFill>
  );
};

export const talkingHeadPip = defineMotion<Props>({
  id: 'talking-head-pip',
  title: 'Talking head PiP',
  category: 'ui',
  description:
    'The speaker (your video, or a built-in presenter stand-in) starts full-frame then shrinks into a circular or rounded picture-in-picture in a corner with an accent ring, while B-roll cards slide through the main frame and captions stay clear of the window.',
  source: ['prompt-corpus: awesome-opus5-5-videos (MIT) — talking-head + B-roll cases (5), original implementation'],
  useFor: 'Course videos, creator explainers, product walkthroughs with a host; pair with caption-style motions for subtitles.',
  durationInFrames: 270,
  defaultProps: {
    videoSrc: '',
    videoStartFrom: 0,
    muted: false,
    scenes: [
      {title: 'The big idea', caption: 'Start with one clear promise.'},
      {title: 'How it works', caption: 'Three steps, nothing more.'},
      {title: 'Why it matters', caption: 'Results you can measure.'},
    ],
    corner: 'bottom-right',
    shape: 'circle',
    diameter: 0.26,
    margin: 0.045,
    shrinkAt: 36,
    ring: 5,
    ringColor: '#FFC933',
    background: '#10131F',
    accent: '#3E6BFF',
    ink: '#FFFFFF',
    captions: true,
    speakerName: '',
  },
  propDocs: {
    videoSrc: 'speaker footage (public/ path or URL); empty = built-in presenter stand-in',
    videoStartFrom: 'frame to start the footage from',
    muted: 'mute the footage audio',
    scenes: '[{title, image?, caption?}] B-roll cards shown in turn (image = public/ path, else a procedural illustration)',
    corner: 'bottom-right | bottom-left | top-right | top-left',
    shape: 'circle | rounded',
    diameter: 'PiP size as a fraction of the short side (0.22-0.28)',
    margin: 'corner margin as a fraction of the short side',
    shrinkAt: 'frame the speaker starts shrinking into the corner',
    ring: 'accent ring width in px',
    ringColor: 'accent ring colour',
    background: 'background colour',
    accent: 'colour behind the stand-in presenter',
    ink: 'caption text colour',
    captions: 'show captions (kept clear of the PiP)',
    speakerName: 'optional small name tag by the PiP',
  },
  component: TalkingHeadPip,
  tags: ['picture in picture', 'pip', 'talking head', 'speaker', 'host', 'creator', 'course', 'b-roll', 'captions', 'circle', 'video', 'explainer', 'webcam', 'presenter', 'ui', 'safe zone'],
});
