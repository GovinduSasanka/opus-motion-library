// Adapted from lemo-opuscar styles/ukiyoe/DEMO.md (climax beats) + STYLE.md §6 "tilt past the border", §8 "the frame is an object" (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {n2} from '../../core/random';
import {PaperFibreRect, cl, eio3, eo3, keys, lerp, mixC, seg, sm, stepFrame, TAU, useUid} from '../../core/r2-lb3a-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  src: string;
  breakEdge: 'top' | 'right';
  growAt: number;
  riseAt: number;
  hangAt: number;
  fallAt: number;
  foamAt: number;
  jitter: number;
  endWash: boolean;
  subjectColor: string;
  mount: string;
  paper: string;
  ink: string;
  sea: string;
  sun: string;
  seed: number;
};

const FPS = 30;

const FrameBreakout: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const uid = useUid('fbo');
  const f8 = stepFrame(frame, 8);

  // frame (the framed print) – centred
  const fh = portrait ? Math.min(h * 0.58, w * 0.82 * 1.3) : h * 0.7;
  const fw = portrait ? Math.min(w * 0.82, fh / 1.3) : fh * 0.78;
  const fx = (w - fw) / 2;
  const fy = (h - fh) / 2 + h * 0.03;
  const top = p.breakEdge === 'top';

  // phase progress
  const grow = eio3(seg(frame, p.growAt, p.riseAt));
  const rise = eio3(seg(frame, p.riseAt, p.hangAt));
  const fall = eio3(seg(frame, p.fallAt, p.foamAt));
  const hang = seg(frame, p.hangAt, p.fallAt);
  const dirx = top ? 0 : 1;
  const diry = top ? -1 : 0;
  const c0: [number, number] = top ? [fx + fw * 0.5, fy + fh * 0.8] : [fx + fw * 0.28, fy + fh * 0.62];
  const reach = top ? fh * 1.0 : fw * 0.95;
  // arc a little sideways so the leap reads as a curve
  const arcOff = Math.sin(rise * Math.PI) * (top ? fw * 0.08 : fh * 0.1);
  const lift = rise - fall * 0.55;
  let sx = c0[0] + dirx * reach * lift + (top ? arcOff : 0);
  let sy = c0[1] + diry * reach * lift + (top ? 0 : -arcOff);
  const jit = p.jitter * (hang > 0 && fall < 0.05 ? 0.25 : 1) * (1 - fall);
  sx += n2(`jx${p.seed}`, f8 * 0.7, 0) * 5 * u * jit;
  sy += n2(`jy${p.seed}`, f8 * 0.7, 3) * 5 * u * jit;
  const S = fh * 0.3 * lerp(0.5, 1, grow) * lerp(1, 1.5, fall) * (frame < p.growAt ? sm(frame / Math.max(1, p.growAt)) * 0.5 + 0.0 : 1);
  const baseRot = top ? 0 : 90;
  const rot = baseRot + rise * (top ? 12 : -14) + fall * (top ? 38 : 30) + Math.sin(f8 * 0.1) * 3 * (1 - rise);

  // camera: look-at point + zoom + roll, keyframed
  const rs = p.riseAt;
  const he = p.hangAt;
  const fa = p.fallAt;
  const fo = p.foamAt;
  const lookX = keys([[0, w / 2], [rs, w / 2], [he, top ? w / 2 : w * 0.62], [fa, top ? w / 2 : w * 0.62], [fo, sx]], frame);
  const lookY = keys([[0, h / 2], [rs, h / 2], [he, top ? h * 0.34 : h / 2], [fa, top ? h * 0.34 : h / 2], [fo, sy]], frame);
  const zoom = keys([[0, 1], [rs, 1.02], [he, top ? 0.8 : 0.84], [fa, top ? 0.8 : 0.84], [fo, 2.3]], frame);
  const roll = keys([[0, 0], [fa, 0], [fo, -3.5]], frame);
  const cam = `translate(${w / 2} ${h / 2}) rotate(${roll}) scale(${zoom}) translate(${-lookX} ${-lookY})`;

  // clips
  const big = Math.max(w, h) * 3;
  const clipSubj = top ? {x: fx, y: fy - big, width: fw, height: fh + big} : {x: fx, y: fy, width: fw + big, height: fh};

  const Koi = () => (
    <g>
      <defs>
        <clipPath id={`${uid}-body`}>
          <path d="M0-100C30-80 42-20 28 40C20 70 10 90 0 100C-10 90-20 70-28 40C-42-20-30-80 0-100Z" />
        </clipPath>
      </defs>
      <g stroke={p.ink} strokeWidth={3.2} strokeLinejoin="round" strokeLinecap="round">
        <path d="M0 90C40 104 70 150 34 184C16 164 6 150 0 140C-6 150-16 164-34 184C-70 150-40 104 0 90Z" fill={mixC(p.subjectColor, p.paper, 0.35)} transform={`rotate(${Math.sin(f8 * 0.35) * 7} 0 90)`} />
        <path d="M26-24C64-14 78 20 54 44C44 24 34 6 26-24Z" fill={mixC(p.subjectColor, p.paper, 0.35)} />
        <path d="M-26-24C-64-14-78 20-54 44C-44 24-34 6-26-24Z" fill={mixC(p.subjectColor, p.paper, 0.35)} />
        <path d="M0-100C30-80 42-20 28 40C20 70 10 90 0 100C-10 90-20 70-28 40C-42-20-30-80 0-100Z" fill={p.subjectColor} />
        <g clipPath={`url(#${uid}-body)`} stroke="none">
          <ellipse cx={-10} cy={-40} rx={26} ry={30} fill="#F6EAD3" />
          <ellipse cx={12} cy={30} rx={22} ry={26} fill="#F6EAD3" />
          <ellipse cx={-6} cy={-30} rx={13} ry={12} fill={mixC(p.subjectColor, '#7A1C0C', 0.4)} />
        </g>
        <g fill="none" strokeWidth={1.6} opacity={0.4} clipPath={`url(#${uid}-body)`}>
          {Array.from({length: 7}, (_, r) => Array.from({length: 4}, (_, c) => <path key={r * 4 + c} d={`M${-24 + c * 14 + (r % 2) * 7} ${-60 + r * 20}a8 8 0 0 0 14 0`} />))}
        </g>
        <path d="M0-98C4-60 4 20 0 98" fill="none" strokeWidth={1.8} opacity={0.5} />
        <circle cx={-12} cy={-72} r={4.2} fill={p.ink} stroke="none" />
        <circle cx={12} cy={-72} r={4.2} fill={p.ink} stroke="none" />
        <path d="M-13-94Q-24-98-29-108M13-94Q24-98 29-108" fill="none" strokeWidth={2.2} />
      </g>
    </g>
  );
  const SubjectEl = () =>
    p.src ? (
      <image href={resolveSrc(p.src)} x={-110} y={-110} width={220} height={220} preserveAspectRatio="xMidYMid meet" />
    ) : (
      <Koi />
    );
  const subjectTf = `translate(${sx} ${sy}) rotate(${rot}) scale(${S / 100})`;

  // inner print: sunrise sky + banded sea
  const seaY = fy + fh * 0.62;
  const scal = (y: number, r: number, off: number) => {
    let d = '';
    for (let x = fx - 40 + off; x < fx + fw + 40; x += r * 2) d += `M${x} ${y}a${r} ${r} 0 0 1 ${r * 2} 0`;
    return d;
  };
  const Print = () => (
    <g>
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mixC(p.sea, p.paper, 0.8)} />
          <stop offset="1" stopColor={mixC(p.sun, p.paper, 0.6)} />
        </linearGradient>
        <clipPath id={`${uid}-in`}>
          <rect x={fx} y={fy} width={fw} height={fh} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}-in)`}>
        <rect x={fx} y={fy} width={fw} height={fh} fill={p.paper} />
        <rect x={fx} y={fy} width={fw} height={seaY - fy} fill={`url(#${uid}-sky)`} />
        <circle cx={fx + fw * 0.72} cy={seaY - fh * 0.16} r={fh * 0.1} fill={p.sun} />
        {Array.from({length: 8}, (_, k) => {
          const y = seaY + (k * (fy + fh - seaY)) / 6.5;
          return (
            <g key={k}>
              <rect x={fx} y={y} width={fw} height={(fy + fh - seaY) / 6.5 + 1} fill={mixC(mixC(p.sea, p.paper, 0.45), p.sea, k / 7)} />
              <path d={scal(y + 14 * u, (12 + k * 2.4) * u, ((k % 2) * 12 + (f8 % 48) * 0.25 * (k % 2 ? 1 : -1)) * u)} fill="none" stroke={p.ink} strokeWidth={1.4 * u} opacity={0.65} />
            </g>
          );
        })}
      </g>
    </g>
  );

  // foam burst around the subject
  const foamP = seg(frame, p.foamAt - 6, p.foamAt + 24);
  const foam = foamP > 0 && (
    <g>
      {Array.from({length: 34}, (_, i) => {
        const a = (i / 34) * TAU + n2(`fa${p.seed}`, i, 0) * 0.4;
        const dist = (0.15 + (n2(`fd${p.seed}`, i, 1) * 0.5 + 0.5) * 0.85) * Math.max(w, h) * 0.9 * eo3(foamP);
        const r = (18 + (n2(`fr${p.seed}`, i, 2) * 0.5 + 0.5) * 70) * u * (0.5 + eo3(foamP) * 1.8);
        return <circle key={i} cx={sx + Math.cos(a) * dist} cy={sy + Math.sin(a) * dist} r={r} fill={mixC(p.paper, '#FFFFFF', 0.6)} stroke={p.ink} strokeWidth={2 * u} opacity={0.95} />;
      })}
      <circle cx={sx} cy={sy} r={Math.max(w, h) * 1.3 * eo3(foamP)} fill={mixC(p.paper, '#FFFFFF', 0.6)} />
    </g>
  );
  const wash = p.endWash ? seg(frame, p.foamAt + 14, p.foamAt + 30) : 0;

  const intro = seg(frame, 0, 14);
  return (
    <AbsoluteFill style={{background: p.mount, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <g transform={cam}>
          <g transform={`translate(${-big} ${-big})`}>
            <PaperFibreRect id={uid} w={big * 3} h={big * 3} paper={p.mount} fibre={0.07} seed={p.seed + 2} mottle={0.08} />
          </g>
          {/* print sheet + shadow */}
          <rect x={fx - 14 * u} y={fy - 14 * u} width={fw + 28 * u} height={fh + 28 * u} fill={p.paper} />
          <rect x={fx - 14 * u + 4 * u} y={fy - 14 * u + 8 * u} width={fw + 28 * u} height={fh + 28 * u} fill="#000" opacity={0.1} transform="translate(0 0)" />
          <rect x={fx - 14 * u} y={fy - 14 * u} width={fw + 28 * u} height={fh + 28 * u} fill={p.paper} opacity={intro} />
          <g opacity={intro}>
            <Print />
            <rect x={fx} y={fy} width={fw} height={fh} fill="none" stroke={p.ink} strokeWidth={3.4 * u} />
            <rect x={fx - 9 * u} y={fy - 9 * u} width={fw + 18 * u} height={fh + 18 * u} fill="none" stroke={p.ink} strokeWidth={1 * u} />
          </g>
          <defs>
            <clipPath id={`${uid}-subj`}>
              <rect {...clipSubj} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${uid}-subj)`} opacity={intro}>
            <g transform={`translate(${sx + 5 * u} ${sy + 8 * u}) rotate(${rot}) scale(${S / 100})`} opacity={0.18}>
              <ellipse cx={0} cy={0} rx={30} ry={100} fill="#000" />
            </g>
            <g transform={subjectTf}>
              <SubjectEl />
            </g>
          </g>
          {foam}
        </g>
        <rect width={w} height={h} fill={p.paper} opacity={wash} />
      </svg>
    </AbsoluteFill>
  );
};

export const frameBreakout = defineMotion<Props>({
  id: 'frame-breakout',
  title: 'Frame breakout',
  category: 'fx',
  description:
    'A framed woodblock-style print sits on a tan mount; the red koi inside grows, leaps and pushes out past the top border while the rest of the picture stays clipped to the frame — the camera tilts up into the mount and widens to follow, holds the almost-frozen crest outside the frame, then falls toward the lens with a camera push and small roll, bursts into foam that fills the screen and fades to bare paper. Clip is bound left/right/bottom but open on the break edge.',
  source: ['lemo-opuscar styles/ukiyoe/DEMO.md climax beats; STYLE.md §6 §8 (MIT, LemoLab) — original koi + print'],
  useFor: 'Thumbnail-style "pop out of the frame" moments for any framed media: a product leaving a phone screen, a character leaping from a comic panel, a chart line breaking its axis box; dramatic climaxes.',
  durationInFrames: 200,
  defaultProps: {
    src: '', breakEdge: 'top', growAt: 14, riseAt: 52, hangAt: 112, fallAt: 150, foamAt: 188, jitter: 1, endWash: true,
    subjectColor: '#E4572A', mount: '#C9B690', paper: '#EEE2C6', ink: '#231F1C', sea: '#1D3A66', sun: '#B8412F', seed: 3,
  },
  propDocs: {
    src: 'optional subject image in public/ (transparent PNG) instead of the built-in koi',
    breakEdge: 'which border the subject escapes: top or right',
    growAt: 'frame when the subject starts growing', riseAt: 'frame when it starts to rise and the camera tilts', hangAt: 'frame the crest hangs outside the frame (near frozen)', fallAt: 'frame it falls toward the lens', foamAt: 'frame the foam bursts',
    jitter: 'subject jitter amount (hang uses ×0.25)', endWash: 'fade the foam to bare paper at the end',
    subjectColor: 'koi body colour', mount: 'mount colour around the print', paper: 'paper colour', ink: 'outline ink', sea: 'sea blue', sun: 'sun colour', seed: 'texture seed',
  },
  component: FrameBreakout,
  tags: ['frame', 'breakout', 'pop out', 'leap', 'mount', 'print', 'koi', 'ukiyo-e', 'clip', 'camera tilt', 'foam', 'climax', 'thumbnail', 'jump out of the screen'],
});
