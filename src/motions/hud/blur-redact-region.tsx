import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {DemoScreen, DemoTone, DEMO, Rect, textW, useExit, useNorm} from '../../core/r3-annot-kit';
import {rng} from '../../core/random';
import {Svg} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Tutorial overlay: privacy boxes over regions of the footage. `blur` frosts whatever is underneath (CSS backdrop blur),
 * `pixelate` lays a mosaic of blocks that pop in scattered, `bar` is a solid censor bar. Each region has a lock badge
 * with a label and can drift to a new position to follow a moving element. Positions are 0-1 rectangles
 * (x, y = top-left).
 *
 * Note: blur frosts the layers composited beneath it (a mix, a web page, the demo screen). A transparent alpha export
 * has nothing underneath, so there it shows the frosted tint and mosaic only.
 */
type Region = Rect & {
  mode?: 'blur' | 'pixelate' | 'bar';
  label?: string;
  /** end position (0-1 top-left) the region drifts to over the clip, to follow a moving element */
  toX?: number;
  toY?: number;
  at?: number;
};
type Props = {
  regions: Region[];
  blurPx: number;
  pixelSize: number;
  tint: string;
  tintOpacity: number;
  radius: number;
  outline: string;
  showLabels: boolean;
  labelBg: string;
  labelInk: string;
  fontFamily: string;
  startAt: number;
  stagger: number;
  speed: number;
  exitAt: number;
  seed: number;
  demoBackground: boolean;
  demoTone: DemoTone;
};

const hexRgb = (hex: string): [number, number, number] => {
  const m = hex.replace('#', '');
  const v = m.length === 3 ? m.split('').map((c) => c + c).join('') : m.padEnd(6, '0').slice(0, 6);
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
};

const BlurRedactRegion: React.FC<Props> = ({regions, blurPx, pixelSize, tint, tintOpacity, radius, outline, showLabels, labelBg, labelInk, fontFamily, startAt, stagger, speed, exitAt, seed, demoBackground, demoTone}) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useNorm();
  const out = useExit(frame, exitAt);
  const sp = Math.max(0.2, speed);
  const [tr, tg, tb] = hexRgb(tint);
  const rad = radius * u;

  const items = regions.map((r, i) => {
    const at = r.at ?? startAt + i * stagger;
    const f = (frame - at) * sp;
    const tIn = prog(f, 0, 16, ease.out);
    const drift = r.toX !== undefined || r.toY !== undefined ? ease.sine(clamp((frame - at) / Math.max(30, (exitAt > 0 ? exitAt : durationInFrames - 14) - at))) : 0;
    const x = lerp(r.x, r.toX ?? r.x, drift) * w;
    const y = lerp(r.y, r.toY ?? r.y, drift) * h;
    return {r, i, f, tIn, x, y, rw: r.w * w, rh: r.h * h};
  });

  return (
    <AbsoluteFill>
      <DemoScreen show={demoBackground} tone={demoTone} />
      {/* frosted layers (html: backdrop-filter) */}
      {items.map(({r, i, tIn, x, y, rw, rh}) => {
        if (tIn <= 0.001) return null;
        const mode = r.mode ?? 'blur';
        const a = tIn * out;
        const bl = mode === 'bar' ? 0 : blurPx * u * a * (mode === 'pixelate' ? 0.55 : 1);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: rw,
              height: rh,
              borderRadius: rad,
              overflow: 'hidden',
              backdropFilter: bl > 0.1 ? `blur(${bl}px)` : undefined,
              WebkitBackdropFilter: bl > 0.1 ? `blur(${bl}px)` : undefined,
              background: mode === 'bar' ? `rgba(${tr},${tg},${tb},${Math.min(1, 0.96) * a})` : `rgba(${tr},${tg},${tb},${tintOpacity * a * (mode === 'pixelate' ? 0.5 : 1)})`,
              clipPath: mode === 'bar' ? `inset(0 ${(1 - ease.out(tIn)) * 100}% 0 0 round ${rad}px)` : undefined,
            }}
          />
        );
      })}
      <Svg>
        {items.map(({r, i, tIn, f, x, y, rw, rh}) => {
          if (tIn <= 0.001) return null;
          const mode = r.mode ?? 'blur';
          const a = out;
          const cells: React.ReactNode[] = [];
          if (mode === 'pixelate') {
            const cs = Math.max(6 * u, pixelSize * u);
            const nx = Math.ceil(rw / cs);
            const ny = Math.ceil(rh / cs);
            const rnd = rng(`${seed}-${i}`);
            for (let cy = 0; cy < ny; cy++) {
              for (let cx = 0; cx < nx; cx++) {
                const rr = rnd();
                const rs = rnd();
                const show = ease.out(clamp((tIn * 1.5 - rr * 0.5)));
                if (show <= 0.01) continue;
                const cw = Math.min(cs, rw - cx * cs);
                const chh = Math.min(cs, rh - cy * cs);
                const light = 0.55 + rs * 0.45;
                // mosaic block: tint with per-block brightness variation
                const mix = (c: number) => Math.round(clamp((c * light + (rs > 0.5 ? 255 : 0) * (1 - light) * 0.5) / 255) * 255);
                cells.push(<rect key={`${cx}-${cy}`} x={x + cx * cs} y={y + cy * cs} width={cw + 0.6} height={chh + 0.6} fill={`rgb(${mix(tr)},${mix(tg)},${mix(tb)})`} fillOpacity={(0.55 + rs * 0.35) * show * a} />);
              }
            }
          }
          const mc = Math.round(10 * u);
          const lab = r.label;
          const fs = 22 * u;
          const lw = lab ? textW(lab, fs, 0.58) + fs * 2.6 : fs * 2.2;
          const tl = prog(f, 8, 20, ease.back);
          const above = y > 54 * u;
          const ly = above ? y - 20 * u : y + rh + 20 * u;
          const lx = clamp(x, 10 * u, w - lw - 10 * u);
          return (
            <g key={i}>
              <defs>
                <clipPath id={`brr-c${i}`}>
                  <rect x={x} y={y} width={rw} height={rh} rx={rad} />
                </clipPath>
              </defs>
              <g clipPath={`url(#brr-c${i})`}>{cells}</g>
              {mode === 'bar' && (
                <g clipPath={`url(#brr-c${i})`} opacity={a * clamp(tIn * 2)}>
                  {Array.from({length: Math.ceil((rw + rh) / (18 * u))}, (_, k) => (
                    <line key={k} x1={x + k * 18 * u - rh} y1={y + rh} x2={x + k * 18 * u} y2={y} stroke="#fff" strokeOpacity={0.07} strokeWidth={6 * u} />
                  ))}
                </g>
              )}
              {/* corner ticks + outline */}
              <rect x={x} y={y} width={rw} height={rh} rx={rad} fill="none" stroke={outline} strokeOpacity={0.55 * a * tIn} strokeWidth={2 * u} strokeDasharray={`${10 * u} ${7 * u}`} />
              {[[x, y, 1, 1], [x + rw, y, -1, 1], [x + rw, y + rh, -1, -1], [x, y + rh, 1, -1]].map(([cx, cy, sx, sy], k) => (
                <path key={k} d={`M${cx + sx * mc * 2} ${cy} L${cx} ${cy} L${cx} ${cy + sy * mc * 2}`} fill="none" stroke={outline} strokeWidth={3.5 * u} strokeLinecap="round" opacity={a * clamp(tIn * 2)} />
              ))}
              {showLabels && lab && tl > 0 && (
                <g transform={`translate(${lx} ${ly}) scale(${tl})`} opacity={a * clamp(tl)}>
                  <rect x={0} y={-fs * 0.95} width={lw} height={fs * 1.9} rx={fs * 0.55} fill={labelBg} />
                  {/* lock icon */}
                  <g transform={`translate(${fs * 0.75} ${-fs * 0.5}) scale(${fs / 24})`}>
                    <rect x={2} y={8} width={16} height={11} rx={2.5} fill={labelInk} />
                    <path d="M5.5 8 V6 A4.5 4.5 0 0 1 14.5 6 V8" fill="none" stroke={labelInk} strokeWidth={2.2} strokeLinecap="round" />
                  </g>
                  <text x={fs * 2.1} y={fs * 0.32} fill={labelInk} fontFamily={fontFamily} fontWeight={700} fontSize={fs}>
                    {lab}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const blurRedactRegion = defineMotion<Props>({
  id: 'blur-redact-region',
  title: 'Blur / pixelate redact region',
  category: 'hud',
  description:
    'Tutorial / privacy overlay: boxes over regions of the footage frost what is underneath (backdrop blur), pop in a scattered pixel mosaic or slide a solid censor bar across, each with corner ticks and a lock badge label; a region can drift to follow a moving element.',
  source: ['screen-recording tutorial annotation'],
  useFor: 'Hide names, emails, keys or faces in a screen recording or screenshot walkthrough: pass `regions` (0-1 rects) with a `mode` and a label like "Hidden".',
  durationInFrames: 180,
  defaultProps: {
    regions: [
      {x: DEMO.search.x + 0.02, y: DEMO.search.y + 0.012, w: 0.2, h: 0.028, mode: 'blur', label: 'Blurred'},
      {x: DEMO.stat1.x + 0.02, y: DEMO.stat1.y + 0.07, w: 0.12, h: 0.05, mode: 'pixelate', label: 'Pixelated'},
      {x: DEMO.list.x + 0.05, y: DEMO.list.y + 0.07, w: 0.26, h: 0.05, mode: 'bar', label: 'Hidden'},
    ],
    blurPx: 16,
    pixelSize: 15,
    tint: '#9AA3B5',
    tintOpacity: 0.45,
    radius: 10,
    outline: '#FFFFFF',
    showLabels: true,
    labelBg: '#12151C',
    labelInk: '#FFFFFF',
    fontFamily: fonts.sans,
    startAt: 10,
    stagger: 34,
    speed: 1,
    exitAt: 0,
    seed: 7,
    demoBackground: false,
    demoTone: 'light',
  },
  propDocs: {
    regions: 'array of {x, y, w, h (0-1, x/y = top-left), mode?: blur|pixelate|bar, label?, toX?, toY? (drift to this top-left), at?}',
    blurPx: 'backdrop blur radius in u (blur and pixelate modes)',
    pixelSize: 'mosaic block size in u',
    tint: 'frost / mosaic / bar colour',
    tintOpacity: 'frost tint opacity (0-1)',
    radius: 'corner radius in u',
    outline: 'dashed outline and corner tick colour',
    showLabels: 'show the lock badge label above each region',
    labelBg: 'badge fill',
    labelInk: 'badge text and lock colour',
    fontFamily: 'CSS font-family for badges',
    startAt: 'frame of the first region',
    stagger: 'frames between regions',
    speed: 'animation speed multiplier',
    exitAt: 'frame everything fades at (0 = just before the end)',
    seed: 'mosaic pattern seed',
    demoBackground: 'true paints a neutral mock screen behind (previews); false = transparent overlay',
    demoTone: 'light | dark mock screen',
  },
  component: BlurRedactRegion,
  tags: ['blur', 'pixelate', 'redact', 'censor', 'privacy', 'hide', 'mosaic', 'annotation', 'tutorial', 'screen recording', 'overlay', 'lock'],
});
