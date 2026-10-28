// Adapted from lemo-opuscar/styles/archive-lighttable/demo/film.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {resolveSrc} from '../../core/asset';
import {useSafeId} from '../../core/image-kit';
import {DOC_DEFAULT, DocText, LightTable, docLayout, eo3, lf, seg, spanBox} from '../../core/r2-la1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Archive light table: a black-rimmed loupe with a machined bevel and a clear acrylic skirt drops onto a
 * document (scale 1.35 → 1 while its contact shadow tightens), reads one line, lifts and glides to the key
 * figure, then the camera pushes *through* the lens until the rim leaves frame. Inside: 2.5× with lateral
 * colour fringe (R/G/B magnified at ±1 % different scales).
 */
type Props = {
  src: string;
  org: string;
  title: string;
  meta: string;
  lines: string[];
  keyLine: number;
  keyNumber: string;
  focus: number[][];
  magnify: number;
  fringe: number;
  landAt: number;
  glideAt: number;
  pushAt: number;
  pushThrough: boolean;
  accent: string;
  table: string;
  desk: string;
};

const Loupe: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = useSafeId('loupe');
  const L = docLayout(p.lines);
  // page placement (page units → screen)
  const pageH = portrait ? Math.min(h * 0.72, (w * 0.9 * L.H) / L.W) : h * 0.9;
  const k = pageH / L.H;
  const pageW = L.W * k;
  const px = (w - pageW) / 2;
  const py = (h - pageH) / 2 + (portrait ? h * 0.07 : h * 0.01);
  const tilt = -0.7;
  const toS = (x: number, y: number): [number, number] => [px + x * k, py + y * k];

  // focus points (page-normalised); defaults: meta line, then the key number
  const key = L.lines[Math.min(L.lines.length - 1, Math.max(0, p.keyLine))];
  const kb = spanBox(key, p.keyNumber);
  const defFocus = [
    [(L.margin + 230) / L.W, (L.head.meta - 40) / L.H],
    [(kb.x0 + kb.x1) / 2 / L.W, (kb.y0 + kb.y1) / 2 / L.H],
  ];
  const F = (p.focus && p.focus.length ? p.focus : defFocus).map(([x, y]) => toS(x * L.W, y * L.H));
  const f1 = F[0];
  const f2 = F[Math.min(1, F.length - 1)];

  // loupe timeline
  const R0 = (portrait ? 0.33 * w : 0.27 * h) * 1;
  const land = eo3(seg(frame, p.landAt, p.landAt + 12));
  const lift = Math.sin(Math.PI * seg(frame, p.glideAt, p.glideAt + 26));
  const glide = ease.inOut(seg(frame, p.glideAt, p.glideAt + 26));
  const lc = [lerp(f1[0], f2[0], glide), lerp(f1[1], f2[1], glide)];
  const s = lerp(1.35, 1, land) + lift * 0.07;
  const R = R0 * s;
  const vis = clamp((frame - p.landAt) / 3);
  const height = 1 - land + lift * 0.35; // 0 = resting
  // camera: slow settle, then push through the lens
  const push = p.pushThrough ? prog(frame, p.pushAt, p.pushAt + 39, ease.expoInOut) : 0;
  const Z = lerp(lerp(1.04, 1, prog(frame, 0, 40, ease.out)), 3.4, push);
  const cam = `translate(${lc[0]} ${lc[1]}) scale(${Z}) translate(${-lc[0]} ${-lc[1]})`;
  const mag = p.magnify;
  const magT = (m: number) => `translate(${lc[0]} ${lc[1]}) scale(${m}) translate(${-lc[0]} ${-lc[1]})`;

  // ink marks: underline under the key line after the glide lands, ring around the number
  const ul = eo3(seg(frame, p.glideAt + 30, p.glideAt + 44));
  const ring = eo3(seg(frame, p.glideAt + 36, p.glideAt + 50));
  const ink = '#15171A';
  const fr = (p.fringe * 0.011) / Z;

  return (
    <AbsoluteFill style={{background: p.desk}}>
      <Svg>
        <defs>
          <filter id={`${id}-sh`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={(6 + 26 * height) * u} />
          </filter>
          <filter id={`${id}-ps`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={10 * u} />
          </filter>
          {(['r', 'g', 'b'] as const).map((c) => (
            <filter key={c} id={`${id}-${c}`} colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values={c === 'r' ? '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0' : c === 'g' ? '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0' : '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0'} />
            </filter>
          ))}
          <clipPath id={`${id}-disc`}>
            <circle cx={lc[0]} cy={lc[1]} r={R} />
          </clipPath>
          <clipPath id={`${id}-skirt`}>
            <path d={`M${lc[0] - R * 1.3} ${lc[1]} a${R * 1.3} ${R * 1.3} 0 1 0 ${R * 2.6} 0 a${R * 1.3} ${R * 1.3} 0 1 0 ${-R * 2.6} 0 Z M${lc[0] - R} ${lc[1]} a${R} ${R} 0 1 1 ${R * 2} 0 a${R} ${R} 0 1 1 ${-R * 2} 0 Z`} clipRule="evenodd" />
          </clipPath>
          <linearGradient id={`${id}-bev`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.85} />
            <stop offset="0.22" stopColor="#ffffff" stopOpacity={0.1} />
            <stop offset="0.6" stopColor="#ffffff" stopOpacity={0} />
            <stop offset="0.86" stopColor="#ffffff" stopOpacity={0.35} />
            <stop offset="1" stopColor="#ffffff" stopOpacity={0.05} />
          </linearGradient>
          <radialGradient id={`${id}-sk`} cx={lc[0]} cy={lc[1]} r={R * 1.3} gradientUnits="userSpaceOnUse">
            <stop offset={1 / 1.3} stopColor="#000" stopOpacity={0.25} />
            <stop offset={0.8} stopColor="#ffffff" stopOpacity={0.3} />
            <stop offset={0.83} stopColor="#000" stopOpacity={0.04} />
            <stop offset={0.93} stopColor="#ffffff" stopOpacity={0.55} />
            <stop offset={0.965} stopColor="#ffffff" stopOpacity={0.05} />
            <stop offset={1} stopColor="#9aa3ab" stopOpacity={0.3} />
          </radialGradient>
          <radialGradient id={`${id}-in`} cx={lc[0]} cy={lc[1]} r={R} gradientUnits="userSpaceOnUse">
            <stop offset="0.82" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.22} />
          </radialGradient>
          {/* the document (or photo print) in screen space — referenced 5× */}
          <g id={`${id}-doc`}>
            <g transform={`rotate(${tilt} ${w / 2} ${h / 2})`}>
              <rect x={px + 14 * u} y={py + 22 * u} width={pageW} height={pageH} fill="#000" opacity={0.18} filter={`url(#${id}-ps)`} />
              {p.src ? (
                <>
                  <rect x={px - 18 * u} y={py - 18 * u} width={pageW + 36 * u} height={pageH + 36 * u} fill="#fbfaf6" />
                  <image href={resolveSrc(p.src)} x={px} y={py} width={pageW} height={pageH} preserveAspectRatio="xMidYMid slice" />
                </>
              ) : (
                <>
                  <rect x={px} y={py} width={pageW} height={pageH} fill="#fbfaf4" />
                  <g transform={`translate(${px} ${py}) scale(${k})`}>
                    <DocText L={L} org={p.org} title={p.title} meta={p.meta} />
                    {ul > 0 && <rect x={key.x} y={key.y + 9} width={key.w * ul} height={4} fill={p.accent} />}
                    {ring > 0 && (
                      <ellipse
                        cx={(kb.x0 + kb.x1) / 2}
                        cy={(kb.y0 + kb.y1) / 2 - 2}
                        rx={(kb.x1 - kb.x0) / 2 + 22}
                        ry={30}
                        fill="none"
                        stroke={p.accent}
                        strokeWidth={4}
                        pathLength={1}
                        strokeDasharray={`${ring} 2`}
                        transform={`rotate(-3 ${(kb.x0 + kb.x1) / 2} ${kb.y0})`}
                      />
                    )}
                    {/* faint reading pencil tick by the key line */}
                    <text x={L.margin - 40} y={key.y} fontFamily={lf.plex} fontSize={22} fill={p.accent} opacity={ul}>
                      ›
                    </text>
                  </g>
                </>
              )}
            </g>
          </g>
        </defs>
        <g transform={cam}>
          <LightTable id={id} w={w} h={h} u={u} table={p.table} desk={p.desk} />
          <use href={`#${id}-doc`} />
          {vis > 0 && (
            <g opacity={vis}>
              {/* contact shadow, offset down-right with lift */}
              <circle cx={lc[0] + (10 + 70 * height) * u} cy={lc[1] + (16 + 90 * height) * u} r={R * 1.3} fill="#000" opacity={0.32 - 0.14 * height} filter={`url(#${id}-sh)`} />
              {/* acrylic skirt: table re-sampled with slight refraction */}
              <g clipPath={`url(#${id}-skirt)`}>
                <rect x={lc[0] - R * 1.4} y={lc[1] - R * 1.4} width={R * 2.8} height={R * 2.8} fill={p.table} />
                <g transform={magT(0.982)}>
                  <use href={`#${id}-doc`} />
                </g>
                <circle cx={lc[0]} cy={lc[1]} r={R * 1.3} fill={`url(#${id}-sk)`} />
              </g>
              <circle cx={lc[0]} cy={lc[1]} r={R * 1.3} fill="none" stroke="#7d868e" strokeOpacity={0.5} strokeWidth={1.2 * u} />
              {/* lens interior: R/G/B magnified at slightly different scales → colour fringe at the rim */}
              <g clipPath={`url(#${id}-disc)`}>
                <rect x={lc[0] - R} y={lc[1] - R} width={R * 2} height={R * 2} fill="#000" />
                <g style={{isolation: 'isolate'}}>
                  {(['r', 'g', 'b'] as const).map((c, i) => (
                    <g key={c} transform={magT(mag * (1 + (i - 1) * fr))} filter={`url(#${id}-${c})`} style={{mixBlendMode: 'screen'}}>
                      <rect x={0} y={0} width={w} height={h} fill={p.table} />
                      <use href={`#${id}-doc`} />
                    </g>
                  ))}
                </g>
                <circle cx={lc[0]} cy={lc[1]} r={R} fill={`url(#${id}-in)`} />
              </g>
              {/* machined black rim with bevel highlight */}
              <circle cx={lc[0]} cy={lc[1]} r={R * 1.032} fill="none" stroke="#0b0c0d" strokeWidth={R * 0.065} />
              <circle cx={lc[0]} cy={lc[1]} r={R * 1.032} fill="none" stroke={`url(#${id}-bev)`} strokeWidth={R * 0.022} />
              <circle cx={lc[0]} cy={lc[1]} r={R * 1.062} fill="none" stroke="#2a2d30" strokeWidth={1.5 * u} />
            </g>
          )}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const loupeMagnify = defineMotion<Props>({
  id: 'loupe-magnify',
  title: 'Loupe magnify (light table)',
  category: 'fx',
  description:
    'A black-rimmed magnifier with a bevel highlight and clear acrylic skirt drops onto a document on a backlit light table, reads a line at 2.5× with colour fringing at the rim, glides to the key figure (underlined and ringed in the signal colour), then the camera pushes through the lens.',
  source: ['lemo-opuscar styles/archive-lighttable demo/film.js lens branch (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §1 loupe-magnify'],
  useFor: 'The "look closer" beat in an explainer or evidence film: a contract clause, a receipt, a product detail, a screenshot or a map.',
  durationInFrames: 165,
  defaultProps: {
    src: '',
    org: DOC_DEFAULT.org,
    title: DOC_DEFAULT.title,
    meta: DOC_DEFAULT.meta,
    lines: DOC_DEFAULT.lines,
    keyLine: DOC_DEFAULT.keyLine,
    keyNumber: DOC_DEFAULT.keyNumber,
    focus: [],
    magnify: 2.5,
    fringe: 1,
    landAt: 10,
    glideAt: 62,
    pushAt: 118,
    pushThrough: true,
    accent: '#FF5A1F',
    table: '#F7F9FB',
    desk: '#0E0F11',
  },
  propDocs: {
    src: 'optional public/ image to inspect instead of the procedural document (fills the page area)',
    org: 'document letterhead (small caps line)',
    title: 'document title',
    meta: 'reference / date line under the title',
    lines: 'body lines of the document (one string per printed line)',
    keyLine: 'index of the line that holds the key figure (underlined after the glide)',
    keyNumber: 'text inside the key line that gets ringed (e.g. "1,208")',
    focus: 'lens stops as [[x,y],[x,y]] in 0..1 page coordinates; empty = meta line then the key figure',
    magnify: 'lens magnification (2.5 in the source)',
    fringe: 'lateral colour fringe strength (0 = none, 1 = ±1.1 % per channel)',
    landAt: 'frame the loupe lands (0.4 s drop, scale 1.35 → 1)',
    glideAt: 'frame it lifts and glides to the second stop',
    pushAt: 'frame the camera starts pushing through the lens',
    pushThrough: 'end by pushing through the lens until the rim leaves frame',
    accent: 'signal colour for the underline and ring (use sparingly)',
    table: 'light-table diffuser colour',
    desk: 'dark desk colour',
  },
  component: Loupe,
  tags: ['loupe', 'magnifier', 'magnify', 'lens', 'zoom', 'look closer', 'document', 'evidence', 'archive', 'light table', 'chromatic aberration', 'push through', 'detail', 'explainer', 'contract', 'receipt', 'investigation'],
});
