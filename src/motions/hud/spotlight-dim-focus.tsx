import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Chip, DemoScreen, DemoTone, DEMO, Rect, textW, useNorm, tidy} from '../../core/r3-annot-kit';
import {Svg} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Tutorial overlay: the whole frame dims except a soft-edged cut-out (rounded rectangle, ellipse or circle) that
 * glides from region to region, holding on each with a caption chip, then opens back up. Transparent apart from the
 * dim layer, so it sits on any footage; regions are 0-1 rectangles (x, y = top-left).
 */
type Region = Rect & {
  shape?: 'rounded' | 'circle' | 'ellipse';
  label?: string;
  /** frames to hold on this region (default `hold`) */
  hold?: number;
};
type Props = {
  regions: Region[];
  dim: number;
  dimColor: string;
  feather: number;
  pad: number;
  radius: number;
  ring: boolean;
  ringColor: string;
  labelBg: string;
  labelInk: string;
  fontFamily: string;
  hold: number;
  move: number;
  startAt: number;
  speed: number;
  demoBackground: boolean;
  demoTone: DemoTone;
};

type S = {x: number; y: number; w: number; h: number; rx: number; ry: number};

const SpotlightDimFocus: React.FC<Props> = ({regions, dim, dimColor, feather, pad, radius, ring, ringColor, labelBg, labelInk, fontFamily, hold, move, startAt, speed, demoBackground, demoTone}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useNorm();
  const sp = Math.max(0.2, speed);
  const mv = Math.max(4, Math.round(move / sp));
  const hd = Math.max(4, Math.round(hold / sp));
  const uid = 'sdf';

  // pixel cut-out for each region
  const states: S[] = regions.map((r) => {
    const x = r.x * w - pad * u;
    const y = r.y * h - pad * u;
    const rw = r.w * w + pad * 2 * u;
    const rh = r.h * h + pad * 2 * u;
    const cx = x + rw / 2;
    const cy = y + rh / 2;
    if (r.shape === 'circle') {
      const d = Math.max(rw, rh);
      return {x: cx - d / 2, y: cy - d / 2, w: d, h: d, rx: d / 2, ry: d / 2};
    }
    if (r.shape === 'ellipse') {
      const ew = rw * 1.3;
      const eh = rh * 1.3;
      return {x: cx - ew / 2, y: cy - eh / 2, w: ew, h: eh, rx: ew / 2, ry: eh / 2};
    }
    const rr = Math.min(radius * u, rw / 2, rh / 2);
    return {x, y, w: rw, h: rh, rx: rr, ry: rr};
  });
  const full: S = {x: -w * 0.12, y: -h * 0.12, w: w * 1.24, h: h * 1.24, rx: 0, ry: 0};

  // timeline: [open -> r0] hold0 [r0 -> r1] hold1 ... holdN [rN -> open]
  const n = states.length;
  const f = frame - startAt;
  let cur: S = full;
  let label: string | undefined;
  let labelAlpha = 0;
  let dimA = 0;
  if (n > 0 && f >= 0) {
    let t0 = 0;
    const holds = regions.map((r) => Math.max(4, Math.round((r.hold ?? hold) / sp)));
    // intro
    if (f < mv) {
      const t = ease.inOut(f / mv);
      cur = lerpS(full, states[0], t);
      dimA = prog(f, 0, mv * 0.8, ease.out);
    } else {
      t0 = mv;
      dimA = 1;
      let done = false;
      for (let i = 0; i < n && !done; i++) {
        const hI = holds[i];
        if (f < t0 + hI) {
          // slow micro-drift while holding
          const q = (f - t0) / hI;
          cur = states[i];
          label = regions[i].label;
          labelAlpha = prog(f, t0 + 4, t0 + 12, ease.out) * (1 - prog(f, t0 + hI - 6, t0 + hI, ease.in) * (i < n - 1 ? 1 : 0));
          void q;
          done = true;
          break;
        }
        t0 += hI;
        if (i < n - 1) {
          if (f < t0 + mv) {
            cur = lerpS(states[i], states[i + 1], ease.inOut((f - t0) / mv));
            done = true;
            break;
          }
          t0 += mv;
        }
      }
      if (!done) {
        // outro: open back up
        const t = ease.inOut(clamp((f - t0) / mv));
        cur = lerpS(states[n - 1], full, t);
        dimA = 1 - prog(f, t0 + mv * 0.2, t0 + mv, ease.in);
        label = regions[n - 1].label;
        labelAlpha = 0;
      }
    }
  }
  const ringA = dimA * (f >= 0 && cur !== full ? 1 : 0);
  const fs = 30 * u;
  // caption chip placement: below the cut-out if there is room, otherwise above
  const below = cur.y + cur.h + 60 * u < h;
  const ly = below ? cur.y + cur.h + 36 * u : cur.y - 36 * u;
  const lw = label ? textW(label, fs, 0.58) + fs * 1.4 : 0;
  const lx = clamp(cur.x + cur.w / 2, lw / 2 + 16 * u, w - lw / 2 - 16 * u);

  return (
    <AbsoluteFill>
      <DemoScreen show={demoBackground} tone={demoTone} />
      <Svg>
        <defs>
          <filter id={`${uid}-f`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={Math.max(0.01, feather * u)} />
          </filter>
          <mask id={`${uid}-m`}>
            <rect x={0} y={0} width={w} height={h} fill="#fff" />
            <rect x={cur.x} y={cur.y} width={cur.w} height={cur.h} rx={cur.rx} ry={cur.ry} fill="#000" filter={`url(#${uid}-f)`} />
          </mask>
        </defs>
        <rect x={0} y={0} width={w} height={h} fill={dimColor} opacity={dim * dimA} mask={`url(#${uid}-m)`} />
        {ring && ringA > 0.01 && (
          <g opacity={ringA}>
            <rect x={cur.x} y={cur.y} width={cur.w} height={cur.h} rx={cur.rx} ry={cur.ry} fill="none" stroke={ringColor} strokeOpacity={0.3} strokeWidth={9 * u} filter={`url(#${uid}-f)`} />
            <rect x={cur.x} y={cur.y} width={cur.w} height={cur.h} rx={cur.rx} ry={cur.ry} fill="none" stroke={ringColor} strokeOpacity={0.9} strokeWidth={2.5 * u} />
          </g>
        )}
        {label && (
          <Chip x={lx} y={ly + (1 - labelAlpha) * (below ? 8 : -8) * u} text={label} fs={fs} bg={labelBg} ink={labelInk} font={fontFamily} anchor="middle" opacity={labelAlpha} scale={0.9 + 0.1 * labelAlpha} />
        )}
      </Svg>
    </AbsoluteFill>
  );
};

const lerpS = (a: S, b: S, t: number): S => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
  rx: lerp(a.rx, b.rx, t),
  ry: lerp(a.ry, b.ry, t),
});

export const spotlightDimFocus = defineMotion<Props>({
  id: 'spotlight-dim-focus',
  title: 'Spotlight dim focus',
  category: 'hud',
  description:
    'Tutorial overlay: the frame dims except a soft-edged cut-out (rounded rectangle, ellipse or circle) that closes in on a region, glides to the next one with a caption chip on each, then opens back up. Everything outside the cut-out is just a dark veil, so it sits on any footage.',
  source: ['screen-recording tutorial annotation'],
  useFor: 'Walk a viewer through parts of a screen recording one region at a time ("first the search bar, then the chart, then save"): pass `regions` (0-1 rects) with captions.',
  durationInFrames: 270,
  defaultProps: tidy({
    regions: [
      {x: DEMO.search.x, y: DEMO.search.y, w: DEMO.search.w, h: DEMO.search.h, shape: 'rounded', label: 'Start with a search'},
      {x: DEMO.chart.x, y: DEMO.chart.y, w: DEMO.chart.w, h: DEMO.chart.h, shape: 'rounded', label: 'Read the chart'},
      {x: DEMO.stat2.x + 0.02, y: DEMO.stat2.y + 0.05, w: 0.16, h: 0.1, shape: 'circle', label: 'Check this number'},
      {x: DEMO.save.x, y: DEMO.save.y, w: DEMO.save.w, h: DEMO.save.h, shape: 'rounded', label: 'Save your work'},
    ],
    dim: 0.7,
    dimColor: '#05070D',
    feather: 6,
    pad: 14,
    radius: 26,
    ring: true,
    ringColor: '#FFFFFF',
    labelBg: '#FFFFFF',
    labelInk: '#12151C',
    fontFamily: fonts.sans,
    hold: 38,
    move: 22,
    startAt: 6,
    speed: 1,
    demoBackground: false,
    demoTone: 'light',
  }),
  propDocs: {
    regions: 'array of {x, y, w, h (0-1, x/y = top-left), shape: rounded|circle|ellipse, label?, hold?}',
    dim: 'veil opacity outside the cut-out (0-1)',
    dimColor: 'veil colour',
    feather: 'edge softness of the cut-out in u',
    pad: 'extra margin around each region in u',
    radius: 'corner radius of rounded cut-outs in u',
    ring: 'draw a thin ring around the cut-out',
    ringColor: 'ring colour',
    labelBg: 'caption chip fill',
    labelInk: 'caption chip text colour',
    fontFamily: 'CSS font-family for captions',
    hold: 'frames to hold on each region',
    move: 'frames to glide between regions (also the open / close time)',
    startAt: 'frame the veil starts closing in',
    speed: 'timing multiplier (2 = twice as fast)',
    demoBackground: 'true paints a neutral mock screen behind (previews); false = transparent overlay (only the veil is drawn)',
    demoTone: 'light | dark mock screen',
  },
  component: SpotlightDimFocus,
  tags: ['spotlight', 'dim', 'focus', 'highlight region', 'vignette', 'annotation', 'tutorial', 'screen recording', 'overlay', 'cut-out', 'attention'],
});
