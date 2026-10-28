import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Chip, DemoScreen, DemoSvg, DemoTone, DEMO, Pt, Stroke, lineD, useExit, useNorm, tidy} from '../../core/r3-annot-kit';
import {Svg} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Tutorial overlay: a dashed box marks a small region of the footage, two connector lines run out of its corners and a
 * magnified inset (a crop of the same picture, with a zoom badge) grows out of the box to a free spot of the frame.
 * Give it the same still as the footage in `src` (a screenshot or a frame grab); without one it magnifies the built-in
 * mock screen. Everything is positioned in 0-1 fractions.
 */
type Zoom = {
  /** source region to magnify (0-1, x/y = top-left) */
  region: {x: number; y: number; w: number; h: number};
  /** where the inset lands: x/y = top-left (0-1), w = width as a fraction of the frame (height follows the region's aspect) */
  inset: {x: number; y: number; w: number};
  label?: string;
  at?: number;
};
type Props = {
  zooms: Zoom[];
  src: string;
  color: string;
  borderColor: string;
  labelBg: string;
  labelInk: string;
  fontFamily: string;
  showZoomLabel: boolean;
  startAt: number;
  stagger: number;
  speed: number;
  exitAt: number;
  demoBackground: boolean;
  demoTone: DemoTone;
};

const ZoomInsetBox: React.FC<Props> = ({zooms, src, color, borderColor, labelBg, labelInk, fontFamily, showZoomLabel, startAt, stagger, speed, exitAt, demoBackground, demoTone}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useNorm();
  const out = useExit(frame, exitAt);
  const sp = Math.max(0.2, speed);

  return (
    <AbsoluteFill>
      <DemoScreen show={demoBackground} tone={demoTone} />
      {/* insets (html, clipped) */}
      {zooms.map((z, i) => {
        const at = z.at ?? startAt + i * stagger;
        const f = (frame - at) * sp;
        const tGrow = prog(f, 16, 38, ease.out);
        if (tGrow <= 0.001) return null;
        const rg = z.region;
        const rx = rg.x * w;
        const ry = rg.y * h;
        const rw = rg.w * w;
        const rh = rg.h * h;
        const iw = z.inset.w * w;
        const ih = iw * (rh / rw);
        const ix = z.inset.x * w;
        const iy = z.inset.y * h;
        // inset rect grows out of the region box
        const bx = lerp(rx, ix, tGrow);
        const by = lerp(ry, iy, tGrow);
        const bw = lerp(rw, iw, tGrow);
        const bh = lerp(rh, ih, tGrow);
        const s = bw / rw; // content scale
        const cw = w * s;
        const ch = h * s;
        const cl = -rg.x * cw;
        const ct = -rg.y * ch;
        const rad = lerp(4, 16, tGrow) * u;
        return (
          <div key={i} style={{position: 'absolute', left: bx, top: by, width: bw, height: bh, opacity: out, filter: 'drop-shadow(0 12px 22px rgba(0,0,0,0.38))'}}>
            <div style={{position: 'absolute', inset: 0, borderRadius: rad, overflow: 'hidden', background: '#fff'}}>
              {src ? (
                <Img src={resolveSrc(src)} style={{position: 'absolute', left: cl, top: ct, width: cw, height: ch, objectFit: 'cover'}} />
              ) : (
                <div style={{position: 'absolute', left: cl, top: ct, width: cw, height: ch}}>
                  <DemoSvg w={cw} h={ch} u={u * s} tone={demoTone} />
                </div>
              )}
            </div>
            <div style={{position: 'absolute', inset: 0, borderRadius: rad, border: `${3 * u}px solid ${borderColor}`, boxSizing: 'border-box'}} />
          </div>
        );
      })}
      <Svg>
        {zooms.map((z, i) => {
          const at = z.at ?? startAt + i * stagger;
          const f = (frame - at) * sp;
          if (f < 0) return null;
          const rg = z.region;
          const rx = rg.x * w;
          const ry = rg.y * h;
          const rw = rg.w * w;
          const rh = rg.h * h;
          const iw = z.inset.w * w;
          const ih = iw * (rh / rw);
          const ix = z.inset.x * w;
          const iy = z.inset.y * h;
          const tBox = prog(f, 0, 14, ease.out);
          const tLines = prog(f, 8, 24, ease.out);
          const tGrow = prog(f, 16, 38, ease.out);
          const tLabel = prog(f, 34, 46, ease.back);
          // region corners (TL, TR, BR, BL) and inset corners
          const rc: Pt[] = [[rx, ry], [rx + rw, ry], [rx + rw, ry + rh], [rx, ry + rh]];
          const ic: Pt[] = [[ix, iy], [ix + iw, iy], [ix + iw, iy + ih], [ix, iy + ih]];
          const rcen: Pt = [rx + rw / 2, ry + rh / 2];
          const icen: Pt = [ix + iw / 2, iy + ih / 2];
          const dx = icen[0] - rcen[0];
          const dy = icen[1] - rcen[1];
          const L = Math.hypot(dx, dy) || 1;
          const nx = -dy / L;
          const ny = dx / L;
          const sc = rc.map((c) => (c[0] - rcen[0]) * nx + (c[1] - rcen[1]) * ny);
          let a = 0;
          let b = 0;
          sc.forEach((v, k) => {
            if (v > sc[a]) a = k;
            if (v < sc[b]) b = k;
          });
          const boxD = lineD([...rc, rc[0]]);
          const label = z.label ?? `${(iw / rw).toFixed(1).replace(/\.0$/, '')}×`;
          const fs = 28 * u;
          return (
            <g key={i} opacity={out}>
              <Stroke d={boxD} color={color} width={3.2 * u} t={tBox} opacity={tBox} dash={`${12 * u} ${8 * u}`} halo={0.3} cap="butt" />
              {[a, b].map((k, q) => (
                <Stroke key={q} d={lineD([rc[k], ic[k]])} color={color} width={2.4 * u} t={tLines * (1 - 0.0 * tGrow)} halo={0.3} opacity={0.9} />
              ))}
              {showZoomLabel && tLabel > 0 && (
                <Chip x={ix + 14 * u} y={iy + ih + 28 * u * tGrow} text={label} fs={fs} bg={labelBg} ink={labelInk} font={fontFamily} scale={tLabel} opacity={clamp(tLabel)} />
              )}
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const zoomInsetBox = defineMotion<Props>({
  id: 'zoom-inset-box',
  title: 'Zoom inset box',
  category: 'hud',
  description:
    'Tutorial overlay: a dashed box marks a small region, connector lines run from its corners and a magnified inset (a crop of the same picture) grows out of it into a free corner with a zoom badge. Pass the footage frame as `src`; without one it magnifies a built-in mock screen.',
  source: ['screen-recording tutorial annotation'],
  useFor: 'Show tiny UI detail legibly in a screen recording (a menu item, a number, a toggle): set `zooms` with the source region, the inset position and a still of the footage in `src`.',
  durationInFrames: 180,
  defaultProps: tidy({
    zooms: [
      {region: {x: 0.43, y: 0.2, w: 0.14, h: 0.2}, inset: {x: 0.66, y: 0.15, w: 0.27}},
    ],
    src: '',
    color: '#FFD60A',
    borderColor: '#FFFFFF',
    labelBg: '#FFD60A',
    labelInk: '#15171C',
    fontFamily: fonts.sans,
    showZoomLabel: true,
    startAt: 10,
    stagger: 60,
    speed: 1,
    exitAt: 0,
    demoBackground: false,
    demoTone: 'light',
  }),
  propDocs: {
    zooms: 'array of {region:{x,y,w,h}, inset:{x,y,w}, label?, at?}: region = source box (0-1, x/y = top-left), inset = landing spot (x/y top-left, w = width fraction), label overrides the auto "2.5x"',
    src: 'public/ path or URL of the frame to magnify (same picture as the footage); empty = mock screen',
    color: 'region box and connector colour',
    borderColor: 'inset border colour',
    labelBg: 'zoom badge fill',
    labelInk: 'zoom badge text colour',
    fontFamily: 'CSS font-family for the badge',
    showZoomLabel: 'show the zoom-factor badge under the inset',
    startAt: 'frame of the first zoom',
    stagger: 'frames between zooms',
    speed: 'animation speed multiplier',
    exitAt: 'frame everything fades at (0 = just before the end)',
    demoBackground: 'true paints a neutral mock screen behind (previews); false = transparent overlay (the inset still shows its crop)',
    demoTone: 'light | dark mock screen',
  },
  component: ZoomInsetBox,
  tags: ['zoom', 'inset', 'magnify', 'crop', 'detail', 'annotation', 'tutorial', 'screen recording', 'overlay', 'picture in picture', 'connector'],
});
