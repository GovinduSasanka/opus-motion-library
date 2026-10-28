import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {Plate, PlatePaletteName, useSafeId} from '../../core/image-kit';
import {LeadedGlass} from '../../core/r2-e2-glass-kit';

/**
 * video2 refraction-pane-grid (Mondrian / stained-glass lens): a black-leaded grid of irregular
 * rectangles (10–12 px bars) in front of an image. Each pane shows the image with its own translate
 * (±3–6 % W), slight scale (0.95–1.1) and multiply tint (red #c06b45, blue #677489, yellow #c0ad70, clear);
 * offsets ease in (easeInQuad over ≈2 s) and keep drifting, like moving behind textured glass.
 */
type Props = {
  src: string;
  seed: number;
  palette: PlatePaletteName;
  gridSeed: number;
  depth: number;
  barWidth: number;
  barColor: string;
  maxOffset: number;
  tints: string[];
  tintOpacity: number;
  driftDuration: number;
  start: number;
  sheen: number;
  mode: 'panes' | 'leaded';
  cellSize: number;
  lead: number;
  leadColor: string;
  jewels: string[];
  backlight: number;
  bandAt: number;
};

type Pane = {x: number; y: number; w: number; h: number; ox: number; oy: number; s: number; tint: string; dx: number; dy: number; delay: number};

const makePanes = (W: number, H: number, seed: number, depth: number, tints: string[], maxOff: number): Pane[] => {
  const r = rng(seed * 31 + 7);
  const out: Pane[] = [];
  const minS = Math.min(W, H) * 0.1;
  const split = (x: number, y: number, w: number, h: number, d: number) => {
    const canV = w > minS * 2;
    const canH = h > minS * 2;
    if (d <= 0 || (!canV && !canH) || (d < depth - 1 && r() < 0.12)) {
      const t = tints[Math.floor(r() * tints.length) % tints.length];
      out.push({
        x,
        y,
        w,
        h,
        ox: (r() < 0.5 ? -1 : 1) * (0.5 + 0.5 * r()) * maxOff * W,
        oy: (r() - 0.5) * maxOff * H * 0.8,
        s: 0.95 + 0.15 * r(),
        tint: t,
        dx: (r() - 0.5) * 0.012 * W,
        dy: (r() - 0.5) * 0.008 * H,
        delay: r() * 10,
      });
      return;
    }
    const vertical = canV && (!canH || w / h > 1.15 ? true : w / h < 0.85 ? false : r() < 0.5);
    const k = 0.3 + 0.4 * r();
    if (vertical) {
      const a = Math.round(w * k);
      split(x, y, a, h, d - 1);
      split(x + a, y, w - a, h, d - 1);
    } else {
      const a = Math.round(h * k);
      split(x, y, w, a, d - 1);
      split(x, y + a, w, h - a, d - 1);
    }
  };
  split(0, 0, W, H, depth);
  return out;
};

const GlassPaneGrid: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps} = useStage();
  const id = useSafeId('gpg');
  const panes = useMemo(() => makePanes(w, h, p.gridSeed, p.depth, p.tints, p.maxOffset), [w, h, p.gridSeed, p.depth, p.tints, p.maxOffset]);
  const bw = p.barWidth * u;
  // over-scan so offset panes never expose the plate edge
  const M = Math.round(p.maxOffset * w * 1.25 + 0.03 * w);

  // bars draw on over 14 f from p.start; refraction eases in (easeInQuad) over driftDuration
  const barT = prog(frame, p.start, p.start + 14, ease.out);
  const zoom = 1 + 0.012 * (frame / fps);

  return (
    <AbsoluteFill style={{background: p.barColor, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        {panes.map((pn, i) => {
          const t0 = p.start + 8 + pn.delay;
          const e = interpolate(frame, [t0, t0 + p.driftDuration], [0, 1], {easing: Easing.in(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const after = Math.max(0, frame - t0 - p.driftDuration) / fps;
          const ox = pn.ox * e + pn.dx * after;
          const oy = pn.oy * e + pn.dy * after;
          const s = 1 + (pn.s - 1) * e;
          const clear = pn.tint === 'clear' || pn.tint === '';
          return (
            <div key={i} style={{position: 'absolute', left: pn.x, top: pn.y, width: pn.w, height: pn.h, overflow: 'hidden'}}>
              <div style={{position: 'absolute', left: -pn.x - M, top: -pn.y - M, width: w + 2 * M, height: h + 2 * M, transform: `translate(${ox}px, ${oy}px) scale(${s})`, transformOrigin: `${pn.x + M + pn.w / 2}px ${pn.y + M + pn.h / 2}px`}}>
                <Plate src={p.src} seed={p.seed} palette={p.palette} width={w + 2 * M} height={h + 2 * M} />
              </div>
              {!clear && (
                <>
                  <div style={{position: 'absolute', inset: 0, background: pn.tint, mixBlendMode: 'color', opacity: p.tintOpacity * Math.min(1, barT * 1.5)}} />
                  <div style={{position: 'absolute', inset: 0, background: pn.tint, mixBlendMode: 'multiply', opacity: 0.45 * p.tintOpacity * Math.min(1, barT * 1.5)}} />
                </>
              )}
              {/* textured-glass sheen */}
              <div style={{position: 'absolute', inset: 0, background: `linear-gradient(${125 + i * 17}deg, rgba(255,255,255,${0.16 * p.sheen * barT}) 0%, rgba(255,255,255,0) 45%, rgba(255,255,255,${0.06 * p.sheen * barT}) 80%, rgba(255,255,255,0) 100%)`, mixBlendMode: 'screen'}} />
            </div>
          );
        })}
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <defs>
            <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx={0} dy={2 * u} stdDeviation={3 * u} floodColor="#000" floodOpacity={0.45} />
            </filter>
          </defs>
          <g filter={`url(#${id})`}>
            {panes.map((pn, i) => {
              const per = 2 * (pn.w + pn.h);
              return (
                <rect
                  key={i}
                  x={pn.x}
                  y={pn.y}
                  width={pn.w}
                  height={pn.h}
                  fill="none"
                  stroke={p.barColor}
                  strokeWidth={bw}
                  strokeDasharray={barT >= 1 ? undefined : `${per * barT} ${per * (1 - barT) + 0.01}`}
                  strokeDashoffset={-((i * 0.37) % 1) * per}
                />
              );
            })}
            <rect x={0} y={0} width={w} height={h} fill="none" stroke={p.barColor} strokeWidth={bw * 2 * barT} />
          </g>
          {/* thin highlight on the leading */}
          {panes.map((pn, i) => (
            <rect key={i} x={pn.x + bw * 0.5 + u} y={pn.y + bw * 0.5 + u} width={Math.max(0, pn.w - bw - 2 * u)} height={Math.max(0, pn.h - bw - 2 * u)} fill="none" stroke="#fff" strokeOpacity={0.12 * barT * p.sheen} strokeWidth={1.2 * u} />
          ))}
        </svg>
      </AbsoluteFill>
      <Vignette strength={0.25} />
    </AbsoluteFill>
  );
};

const GlassRoot: React.FC<Props> = (p) =>
  p.mode === 'leaded' ? (
    <LeadedGlass src={p.src} seed={p.seed} palette={p.palette} gridSeed={p.gridSeed} cellSize={p.cellSize} lead={p.lead} leadColor={p.leadColor} jewels={p.jewels} backlight={p.backlight} bandAt={p.bandAt} start={p.start} tintOpacity={Math.max(p.tintOpacity, 0.75)} />
  ) : (
    <GlassPaneGrid {...p} />
  );

export const glassPaneGrid = defineMotion<Props>({
  id: 'glass-pane-grid',
  title: 'Mondrian glass pane grid',
  category: 'image',
  description: 'A black-leaded Mondrian grid draws on over an image; each glass pane offsets, scales and tints its piece of the picture and keeps drifting, like looking through stained glass.',
  source: ['video2 0:16-0:18 refraction-pane-grid'],
  useFor: 'Fractured / multiple-perspective beats, art-history or design references, stylish holds on a hero image.',
  durationInFrames: 150,
  defaultProps: {
    src: '',
    seed: 1,
    palette: 'dusk',
    gridSeed: 4,
    depth: 5,
    barWidth: 14,
    barColor: '#0b0b0d',
    maxOffset: 0.055,
    tints: ['#c06b45', '#677489', '#c0ad70', 'clear', 'clear', '#c06b45', '#677489'],
    tintOpacity: 0.6,
    driftDuration: 60,
    start: 10,
    sheen: 1,
    mode: 'panes',
    cellSize: 56,
    lead: 6,
    leadColor: '#0c0a0c',
    jewels: ['#1f4fa8', '#a8202c', '#d6a323', '#2e7d4f', '#6b3a8c', '#2a8c9c'],
    backlight: 0.6,
    bandAt: -1,
  },
  propDocs: {
    src: 'public/ image path; empty = procedural plate',
    seed: 'procedural plate seed',
    palette: 'procedural plate palette: dusk | night | dawn',
    gridSeed: 'seed of the Mondrian subdivision',
    depth: 'subdivision depth (3 = few big panes, 5 = many)',
    barWidth: 'leading bar width in px at 1080p (10–12 measured at 720p, ≈14 at 1080p)',
    barColor: 'leading colour',
    maxOffset: 'max pane offset as a fraction of the frame width (0.03–0.06)',
    tints: 'pane tint colours (multiply); "clear" = untinted',
    tintOpacity: 'tint strength 0..1',
    driftDuration: 'frames for the refraction offsets to ease in (easeInQuad), then a slow drift continues',
    start: 'frame the leading starts drawing on',
    sheen: 'glass sheen / bevel highlight strength',
    mode: "'panes' (Mondrian refraction grid) | 'leaded' (stained-glass panel: lozenge lattice of jewel pieces, dark lead with solder blobs, streaky glass, backlight band)",
    cellSize: 'leaded: piece size in px at 1080p (30-80)',
    lead: 'leaded: lead came width in px at 1080p',
    leadColor: 'leaded: lead colour',
    jewels: 'leaded: jewel colour palette the pieces cycle through',
    backlight: 'leaded: strength of the backlight band sweeping across',
    bandAt: 'leaded: frame the backlight band starts (-1 = start + 30)',
  },
  component: GlassRoot,
  tags: ['image', 'glass', 'mondrian', 'refraction', 'stained-glass', 'grid', 'fracture', 'leaded', 'heritage window', 'backlit', 'jewel'],
});
