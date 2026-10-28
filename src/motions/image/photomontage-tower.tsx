// Adapted from lemo-opuscar/styles/kino-montage (STYLE.md §6 "Photomontage tower", DEMO.md shot 14) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {ARCHIVE_KINDS, ArchivePhoto, eio3, eo3, KINO, lerp, lf, PaperFibre, PrintGradeDef, seg, slamShake} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Anchor = {floor: number; label: string; caption: string};
type Props = {
  floors: number;
  images: string[];
  anchors: Anchor[];
  counterLabel: string;
  title: string;
  bpm: number;
  crown: boolean;
  red: string;
  ink: string;
  paper: string;
};

// original cut-out figure silhouettes (standing worker, arms-up, carrying a beam)
const FIGS = [
  'M0 -1 C.09 -1 .13 -.93 .13 -.86 C.13 -.79 .08 -.74 .03 -.73 L.17 -.66 L.2 -.38 L.13 -.38 L.12 -.55 L.1 -.32 L.12 0 L.04 0 L0 -.26 L-.04 0 L-.12 0 L-.1 -.32 L-.12 -.55 L-.13 -.38 L-.2 -.38 L-.17 -.66 L-.03 -.73 C-.08 -.74 -.13 -.79 -.13 -.86 C-.13 -.93 -.09 -1 0 -1Z',
  'M0 -.92 C.08 -.92 .12 -.86 .12 -.8 C.12 -.74 .08 -.69 .04 -.68 L.14 -.64 L.3 -.98 L.36 -.95 L.21 -.55 L.12 -.5 L.1 -.3 L.13 0 L.05 0 L0 -.25 L-.05 0 L-.13 0 L-.1 -.3 L-.12 -.5 L-.21 -.55 L-.36 -.95 L-.3 -.98 L-.14 -.64 L-.04 -.68 C-.08 -.69 -.12 -.74 -.12 -.8 C-.12 -.86 -.08 -.92 0 -.92Z',
  'M-.5 -.82 L.5 -.82 L.5 -.76 L.1 -.76 L.12 -.7 L.18 -.42 L.12 -.4 L.1 -.3 L.12 0 L.04 0 L0 -.26 L-.04 0 L-.12 0 L-.1 -.3 L-.12 -.4 L-.18 -.42 L-.12 -.7 L-.1 -.76 L-.5 -.76Z M0 -.98 C.07 -.98 .1 -.93 .1 -.88 C.1 -.84 .06 -.82 0 -.82 C-.06 -.82 -.1 -.84 -.1 -.88 C-.1 -.93 -.07 -.98 0 -.98Z',
];

const PhotomontageTower: React.FC<Props> = ({floors, images, anchors, counterLabel, title, bpm, crown, red, ink, paper}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames: D} = useStage();
  const sixteenth = (60 / bpm) * 30 / 4;
  const eighth = sixteenth * 2;
  const N = Math.max(4, floors);

  // ---- schedule: first 10 floors on 16ths, then 8ths; rests on anchors
  const times: number[] = [];
  let t = 10;
  for (let i = 0; i < N; i++) {
    times.push(t);
    t += i < 10 ? sixteenth : eighth;
    const an = anchors.find((a) => a.floor === i + 1);
    if (an) t += 42;
  }
  const tCrown = t + 4;
  const tPull = tCrown + 14;

  // ---- geometry (world = unscaled screen space)
  const fh = (portrait ? 0.062 : 0.085) * h;
  const gy = 0.94 * h;
  const tx = portrait ? 0.5 * w : 0.6 * w;
  const W0 = portrait ? 0.78 * w : 0.42 * w;
  const widthOf = (i: number) => W0 * (1 - 0.5 * Math.floor((i / N) * 4) / 4) * (1 - 0.06 * ((i % 6) / 6));
  const built = times.filter((x) => frame >= x).length;
  // camera climbs: eased count of floors built
  const easedBuilt = times.reduce((s, x) => s + eo3(seg(frame, x, x + 8)), 0);
  const camTarget = portrait ? 0.48 * h : 0.42 * h;
  const camY = Math.max(0, camTarget - (gy - easedBuilt * fh));
  const crownH = fh * 3.2;
  const totalH = N * fh + crownH;
  const sFit = Math.min(1, (0.8 * h) / totalH);
  const pk = eio3(seg(frame, tPull, tPull + 40));
  const S = lerp(1, sFit, pk);
  const ty = lerp(camY, 0.95 * h - gy * sFit, pk);
  const txx = lerp(0, tx * (1 - sFit), pk);

  const shakes = times.map((x, i) => slamShake(frame, x + 2, 4 * u, i));
  const sx = shakes.reduce((s, k) => s + k[0], 0);
  const sy = shakes.reduce((s, k) => s + k[1], 0);

  // only draw floors on screen
  const visible = (i: number) => {
    const top = (gy - (i + 1) * fh) * S + ty;
    return top < h + fh && top + fh * S > -fh * 2;
  };

  const activeAnchor = anchors.find((a) => {
    const i = a.floor - 1;
    return i < N && frame >= times[i] + 4 && frame < times[i] + 42;
  });

  const counterFs = (portrait ? 150 : 210) * u;
  const counter = String(built).padStart(2, '0');
  const crownIn = eo3(seg(frame, tCrown, tCrown + 6));

  return (
    <AbsoluteFill style={{background: paper, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <defs>
            <PrintGradeDef id="pmt-grade" ink={ink} paper={paper} s={0.32} />
          </defs>
          <g transform={`translate(${txx} ${ty}) scale(${S})`}>
            {/* ground beam */}
            <rect x={tx - W0 * 0.7} y={gy} width={W0 * 1.4} height={14 * u} fill={ink} />
            {times.map((t0, i) => {
              if (frame < t0 || !visible(i)) return null;
              const fw = widthOf(i);
              const side = i % 2 === 0 ? -1 : 1;
              const k = eo3(seg(frame, t0, t0 + 3));
              const x = tx - fw / 2 + side * (1 - k) * w * 1.1;
              const y = gy - (i + 1) * fh;
              const img = images.length ? images[i % images.length] : '';
              const kind = ARCHIVE_KINDS[(i * 3 + 1) % ARCHIVE_KINDS.length];
              const ph = fh * 3.2;
              return (
                <g key={i}>
                  <svg x={x} y={y} width={fw} height={fh - 8 * u} viewBox={`0 ${(ph - fh) / 2} ${fw} ${fh}`} preserveAspectRatio="none" overflow="hidden">
                    <g filter="url(#pmt-grade)">
                      {img ? <image href={resolveSrc(img)} width={fw} height={ph} preserveAspectRatio="xMidYMid slice" /> : <ArchivePhoto kind={kind} w={fw} h={ph} id={`pmt-ph${i}`} seed={i + 2} t={(frame - t0) / 30} />}
                    </g>
                  </svg>
                  {/* ink beam under each floor */}
                  <rect x={x - 10 * u} y={y + fh - 9 * u} width={fw + 20 * u} height={9 * u} fill={ink} />
                </g>
              );
            })}
            {/* cut-out figures land on every other floor */}
            {times.map((t0, i) => {
              if (i % 2 === 1 || !visible(i)) return null;
              const tl = t0 + sixteenth * 1.5;
              if (frame < tl) return null;
              const k = eo3(seg(frame, tl, tl + 4));
              const fw = widthOf(i);
              const fy = gy - (i + 1) * fh - 8 * u;
              const sz = fh * 1.05;
              const fx = tx + (i % 4 === 0 ? -1 : 1) * fw * 0.32;
              return (
                <g key={'f' + i} transform={`translate(${fx} ${fy - (1 - k) * 80 * u}) scale(${sz})`}>
                  <path d={FIGS[(i / 2) % FIGS.length]} fill={ink} stroke={paper} strokeWidth={(7 * u) / sz} strokeLinejoin="round" paintOrder="stroke" />
                </g>
              );
            })}
            {/* crown: stepped deco spire + a red flag */}
            {crown && frame >= tCrown && (
              <g transform={`translate(${tx} ${gy - N * fh + (1 - crownIn) * -h * 0.5})`}>
                {[0.36, 0.24, 0.14].map((k, j) => (
                  <rect key={j} x={-W0 * k * 0.5} y={-(j + 1) * fh * 0.7} width={W0 * k} height={fh * 0.7 + 2} fill={j % 2 ? red : ink} />
                ))}
                <rect x={-3 * u} y={-crownH} width={6 * u} height={crownH - fh * 2.1} fill={ink} />
                <path d={`M${3 * u} ${-crownH}l${fh * 0.9} ${fh * 0.25}l${-fh * 0.9} ${fh * 0.25}z`} fill={red} />
              </g>
            )}
          </g>
        </svg>
        {/* counter (rests on anchors while the caption is up) */}
        <div style={{position: 'absolute', left: 0.05 * w, top: portrait ? 0.05 * h : 0.08 * h}}>
          <div style={{display: 'inline-block', background: ink, color: paper, fontFamily: lf.spaceMono, fontWeight: 700, fontSize: 20 * u, padding: `${5 * u}px ${10 * u}px`, letterSpacing: 2 * u}}>{counterLabel.toUpperCase()}</div>
          <div style={{fontFamily: lf.oswald, fontWeight: 700, fontSize: counterFs, lineHeight: 0.95, color: activeAnchor ? red : ink, fontVariantNumeric: 'tabular-nums'}}>{counter}</div>
          <div style={{fontFamily: lf.oswald, fontWeight: 600, fontSize: 34 * u, color: ink, letterSpacing: 2 * u, maxWidth: portrait ? 0.5 * w : 0.3 * w, opacity: eo3(seg(frame, 4, 14))}}>{title.toUpperCase()}</div>
        </div>
        {activeAnchor && (
          <div style={{position: 'absolute', left: 0.05 * w, bottom: 0.07 * h, display: 'flex', alignItems: 'stretch', maxWidth: 0.9 * w}}>
            <div style={{width: 10 * u, background: red}} />
            <div style={{background: 'rgba(20,18,16,0.9)', padding: `${12 * u}px ${20 * u}px`}}>
              <div style={{fontFamily: lf.oswald, fontWeight: 700, fontSize: 40 * u, color: paper, whiteSpace: 'nowrap'}}>{activeAnchor.label}</div>
              <div style={{fontFamily: lf.oswald, fontWeight: 500, fontSize: 27 * u, color: paper, opacity: 0.85, whiteSpace: 'nowrap'}}>{activeAnchor.caption}</div>
            </div>
          </div>
        )}
      </AbsoluteFill>
      <PaperFibre w={w} h={h} id="pmt-fibre" opacity={0.45} />
      <AbsoluteFill style={{background: paper, opacity: frame > D - 6 ? (frame - (D - 6)) / 6 : 0}} />
    </AbsoluteFill>
  );
};

export const photomontageTower = defineMotion<Props>({
  id: 'photomontage-tower',
  title: 'Photomontage tower',
  category: 'image',
  description:
    'Constructivist photomontage: print-graded photo strips slam in from alternate sides on 16th notes as the floors of a tower, an ink beam under each, paper-bordered cut-out figures land on every other floor; the camera climbs, a big floor counter runs and turns red while it rests on dated anchors with captions, a deco crown tops it, then the camera pulls back to the whole tower.',
  source: ['lemo-opuscar styles/kino-montage (MIT, LemoLab) — STYLE.md §6 photomontage tower, DEMO.md shot 14'],
  useFor: '"People built this" — company growth, team milestones, user photos stacked into a product, building or logo.',
  durationInFrames: 330,
  defaultProps: {
    floors: 24,
    images: [],
    anchors: [
      {floor: 10, label: 'Week 4', caption: 'The frame passes the old water tower'},
      {floor: 18, label: 'Week 7', caption: 'Steel tops out at the setback'},
    ],
    counterLabel: 'Floor',
    title: 'Northwind Tower',
    bpm: 120,
    crown: true,
    red: KINO.red,
    ink: KINO.ink,
    paper: KINO.paper,
  },
  propDocs: {
    floors: 'number of floors (strips) in the tower',
    images: 'optional photos in public/ used for the strips in turn (print-graded); empty = procedural archive scenes',
    anchors: 'counter rests: {floor, label, caption} — building pauses while the caption is up',
    counterLabel: 'ink tab over the counter',
    title: 'caps line under the counter',
    bpm: 'beat grid (floors on 16ths, then 8ths)',
    crown: 'deco crown and red flag on top',
    red: 'the one red',
    ink: 'ink colour',
    paper: 'paper colour',
  },
  component: PhotomontageTower,
  tags: ['photomontage', 'collage', 'tower', 'stack', 'build', 'growth', 'counter', 'milestones', 'constructivist', 'kino', 'archive', 'photos', 'cut-out', 'documentary', 'print', 'paper'],
});
