import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {GradientMapFilter} from '../../core/image-kit';
import {rng} from '../../core/random';
import {GlossySphere} from '../../core/shapes';
import {PaperTexture, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {DEMO_IMAGES, Pic} from '../../core/ui-kit';

/**
 * video4 accelerating-montage + sonar-ring-overlay, video2 beat-hardcut-montage, video18 beat-style-shuffler.
 * Hard-cut montage whose cut length halves block by block (12 f -> 6 f -> 3 f), with short paper "ping" beats
 * between blocks. A glossy blue dot stays fixed at the centre over every shot (the glue), each shot gets a 3 %
 * micro push, the fastest block carries two breathing white double-line sonar rings re-emitted on every beat,
 * and on beats some shots are restyled (duotone / LED dot / invert). Ends on paper with the dot pinging.
 */
type Props = {
  images: string[];
  steps: number[];
  counts: number[];
  bpm: number;
  shuffle: number;
  styles: string[];
  rings: 'fast' | 'always' | 'off';
  pingBeats: boolean;
  dotColor: string;
  paper: string;
  ringColor: string;
  seed: number;
};

type Seg = {kind: 'shot' | 'ping' | 'end'; start: number; len: number; img: number; style: string; block: number};

const DUO = [
  ['#1F4FA0', '#E8EEF8'],
  ['#3b0d3f', '#ffb3a7'],
  ['#0e3b2e', '#e8f5c8'],
];

const Rings: React.FC<{cx: number; cy: number; h: number; u: number; frame: number; period: number; color: string; start: number}> = ({cx, cy, h, u, frame, period, color, start}) => {
  const ph = (((frame - start) % period) + period) % period / period;
  return (
    <>
      {[0.22, 0.45].map((k, i) => {
        const r = h * k * (1 + 0.3 * ph);
        const op = 0.85 * (1 - Math.pow(ph, 3));
        return (
          <g key={i} opacity={op}>
            <circle cx={cx} cy={cy} r={r + 3 * u} fill="none" stroke={color} strokeWidth={2 * u} />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff" strokeWidth={4 * u} />
          </g>
        );
      })}
    </>
  );
};

const BeatMontage: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, durationInFrames: D} = useStage();
  const beat = 1800 / Math.max(30, p.bpm);
  const segs = React.useMemo(() => {
    const r = rng(p.seed * 31 + 5);
    const out: Seg[] = [];
    let t = 0;
    let img = 0;
    let acc = 0;
    p.steps.forEach((len, b) => {
      const n = p.counts[b] ?? 4;
      for (let i = 0; i < n; i++) {
        // accumulate fractional lengths so cuts stay on the frame grid
        acc += len;
        const L = Math.max(1, Math.round(acc) - Math.round(acc - len));
        const style = b > 0 && r() < p.shuffle ? p.styles[Math.floor(r() * p.styles.length) % p.styles.length] : 'none';
        out.push({kind: 'shot', start: t, len: L, img: img++, style, block: b});
        t += L;
      }
      if (p.pingBeats && b < p.steps.length - 1) {
        out.push({kind: 'ping', start: t, len: 6, img: -1, style: 'none', block: b});
        t += 6;
      }
    });
    out.push({kind: 'end', start: t, len: Math.max(1, D - t), img: -1, style: 'none', block: p.steps.length});
    return out;
  }, [p.steps.join(','), p.counts.join(','), p.shuffle, p.styles.join(','), p.pingBeats, p.seed, D]);
  const seg = segs.find((s) => frame >= s.start && frame < s.start + s.len) ?? segs[segs.length - 1];
  const local = frame - seg.start;
  const lastBlock = p.steps.length - 1;
  const fastStart = segs.find((s) => s.kind === 'shot' && s.block === lastBlock)?.start ?? 0;
  const showRings = p.rings === 'always' ? seg.kind === 'shot' : p.rings === 'fast' ? seg.kind === 'shot' && seg.block === lastBlock : false;
  const dotR = 22 * u;

  let content: React.ReactNode;
  if (seg.kind === 'shot') {
    const src = p.images.length ? p.images[seg.img % p.images.length] : undefined;
    const sc = 1 + 0.03 * clamp(local / seg.len);
    const ox = seg.img % 2 ? '45% 50%' : '55% 50%';
    const duo = DUO[seg.img % DUO.length];
    const fid = `bm-duo-${seg.img % DUO.length}`;
    const filter = seg.style === 'duotone' ? `url(#${fid})` : seg.style === 'invert' ? 'invert(1) hue-rotate(180deg) contrast(1.1)' : seg.style === 'dot' ? 'saturate(1.5) contrast(1.15) brightness(1.15)' : undefined;
    const dot = 14 * u;
    content = (
      <AbsoluteFill style={{background: '#000'}}>
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <defs>
            <GradientMapFilter id={fid} colors={duo} />
          </defs>
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${sc})`,
            transformOrigin: ox,
            filter,
            ...(seg.style === 'dot'
              ? {WebkitMaskImage: `radial-gradient(circle, #000 52%, transparent 60%)`, WebkitMaskSize: `${dot}px ${dot}px`, maskImage: `radial-gradient(circle, #000 52%, transparent 60%)`, maskSize: `${dot}px ${dot}px`}
              : {}),
          }}
        >
          <Pic src={src} seed={p.seed * 100 + seg.img} id={`bm-pic`} position={ox} />
        </div>
      </AbsoluteFill>
    );
  } else {
    // paper ping beat / end card
    const pingStart = seg.start + (seg.kind === 'end' ? 4 : 0);
    content = (
      <AbsoluteFill style={{background: p.paper}}>
        <PaperTexture opacity={0.35} />
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          {[0, 1, 2].flatMap((k) =>
            (seg.kind === 'end' ? [0, 18] : [0]).map((off) => {
              const l = frame - pingStart - off - k * 4;
              const life = 18;
              if (l < 0 || l > life) return null;
              const t = l / life;
              const R = Math.min(w, h) * 0.8;
              return <circle key={`${k}-${off}`} cx={cx} cy={cy} r={R * (1 - (1 - t) * (1 - t))} fill="none" stroke={p.dotColor} strokeWidth={(18 * Math.pow(0.7, k) * (1 - t) + 2) * u} opacity={1 - clamp((t - 0.7) / 0.3)} />;
            }),
          )}
        </svg>
      </AbsoluteFill>
    );
  }
  const pulse = 1 + 0.18 * Math.max(0, 1 - ((((frame - fastStart) % beat) + beat) % beat) / 4) * (showRings ? 1 : 0);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {content}
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {showRings && <Rings cx={cx} cy={cy} h={Math.min(w, h)} u={u} frame={frame} period={beat} color={p.ringColor} start={fastStart} />}
        <GlossySphere cx={cx} cy={cy} r={dotR * pulse} color={p.dotColor} id="bm-dot" shadowOpacity={seg.kind === 'shot' ? 0.35 : 0.6} />
      </svg>
    </AbsoluteFill>
  );
};

export const beatMontage = defineMotion<Props>({
  id: 'beat-montage',
  title: 'Accelerating beat montage',
  category: 'data',
  description: 'Hard-cut image montage whose cuts accelerate 12 f -> 6 f -> 3 f, a persistent centre dot, breathing sonar rings on the beat, per-shot micro push and beat-synced style swaps.',
  source: ['video4 4:50-16:00 accelerating-montage + sonar-ring-overlay', 'video2 beat-hardcut-montage', 'video18 beat-style-shuffler'],
  useFor: 'Recaps, "so many examples" sequences, showreels, building energy before a reveal.',
  durationInFrames: 240,
  defaultProps: {
    images: DEMO_IMAGES,
    steps: [12, 6, 3],
    counts: [6, 8, 24],
    bpm: 150,
    shuffle: 0.35,
    styles: ['duotone', 'dot', 'invert'],
    rings: 'fast',
    pingBeats: true,
    dotColor: '#3780E7',
    paper: '#ECE4D7',
    ringColor: '#7AA8E0',
    seed: 2,
  },
  propDocs: {
    images: 'public/ image paths cycled through the shots (empty = procedural scenes)',
    steps: 'frames per cut for each block (accelerating)',
    counts: 'number of shots in each block',
    bpm: 'beat tempo: sets the sonar ring period and the dot pulse (150 bpm = 12 f)',
    shuffle: '0..1 chance that a shot after the first block is restyled',
    styles: 'styles to shuffle between: duotone | dot | invert',
    rings: "sonar ring overlay: 'fast' (last block), 'always' or 'off'",
    pingBeats: 'insert 6-frame paper ping beats between blocks',
  },
  component: BeatMontage,
  tags: ['montage', 'edit', 'beat', 'cuts', 'showreel', 'rhythm'],
});
