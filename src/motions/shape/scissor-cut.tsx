// Adapted from mg-styles-15/demos/06-collage/index.html (scissors(), CUT) (MIT) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {defineMotion} from '../../core/types';
import {clamp, ease, prog} from '../../core/ease';
import {PaperTexture, Svg, useStage} from '../../core/stage';
import {fonts} from '../../core/fonts';
import {resolveSrc} from '../../core/asset';
import {Scissors, boil, slap, smooth} from '../../core/r2-mg2a-kit';

type Props = {
  title: string;
  subtitle: string;
  revealText: string;
  src: string;
  path: [number, number][];
  snips: number;
  at: number;
  separate: 'lift' | 'flip' | 'fall';
  color: string;
  ink: string;
  background: string;
  paper: string;
  scissorSize: number;
  cutLabel: string;
};

const ScissorCut: React.FC<Props> = ({title, subtitle, revealText, src, path, snips, at, separate, color, ink, background, paper, scissorSize, cutLabel = 'CUT ALONG THE LINE'}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const W = portrait ? w * 0.84 : Math.min(w * 0.62, 1180 * u);
  const H = portrait ? Math.min(h * 0.46, W * 1.05) : h * 0.66;
  const x0 = cx - W / 2;
  const y0 = cy - H / 2;

  const pts = path.map(([a, b]) => [x0 + a * W, y0 + b * H] as [number, number]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[cum.length - 1];
  const at2 = (d: number) => {
    const dd = clamp(d, 0, total);
    let i = 1;
    while (i < pts.length - 1 && cum[i] < dd) i++;
    const seg = cum[i] - cum[i - 1] || 1;
    const f = (dd - cum[i - 1]) / seg;
    return {x: pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, y: pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f, ang: Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])};
  };
  const upTo = (d: number) => {
    const out = [at2(0)].map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    for (let i = 1; i < pts.length; i++) if (cum[i] < d) out.push(`${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)}`);
    const e = at2(d);
    out.push(`${e.x.toFixed(1)},${e.y.toFixed(1)}`);
    return out.join(' ');
  };

  // timeline
  const slapIn = slap(frame, at);
  const lineP = prog(frame, at + 12, at + 28, ease.out) * total;
  const cutStart = at + 30;
  const snipLen = 6;
  const cutEnd = cutStart + snips * snipLen;
  const ph = frame - cutStart;
  const k = Math.floor(ph / snipLen);
  const within = (ph % snipLen) / snipLen;
  const scissorsOn = frame >= cutStart - 6 && frame < cutEnd + 14;
  // advance during the open phase of each snip
  const adv = (kk: number) => (kk / snips) * total;
  const sPos = ph < 0 ? 0 : ph >= snips * snipLen ? total : adv(k) + (total / snips) * smooth(within / 0.6);
  const openAmt = ph < 0 ? prog(frame, cutStart - 6, cutStart, ease.out) * 0.5 : ph >= snips * snipLen ? 0 : within < 0.6 ? smooth(within / 0.6) : 1 - clamp((within - 0.6) / 0.12);
  const sc = at2(sPos);
  const exitP = prog(frame, cutEnd + 2, cutEnd + 16, ease.in);
  const sepT = prog(frame, cutEnd + 6, cutEnd + 52, ease.inOut);
  const sepB = Math.max(0, frame - (cutEnd + 6));

  // halves
  const top = `M${x0},${y0} H${x0 + W} V${pts[pts.length - 1][1]} ${pts
    .slice()
    .reverse()
    .map((p) => `L${p[0]},${p[1]}`)
    .join(' ')} Z`;
  const bot = `M${x0},${y0 + H} H${x0 + W} V${pts[pts.length - 1][1]} ${pts
    .slice()
    .reverse()
    .map((p) => `L${p[0]},${p[1]}`)
    .join(' ')} Z`;
  const cutY = pts.reduce((s, p) => s + p[1], 0) / pts.length;

  // fit title
  const words = title.toUpperCase().split(' ');
  const lines = words.length > 1 && title.length > 8 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [title.toUpperCase()];
  const maxLen = Math.max(...lines.map((l) => l.length));
  const fs = Math.min(H * 0.17, (W * 0.88) / (maxLen * 0.72));
  const idp = 'sc';

  const Poster: React.FC<{tint?: number}> = ({tint = 0}) => (
    <g>
      <rect x={x0} y={y0} width={W} height={H} fill={paper} />
      {src ? (
        <image href={resolveSrc(src)} x={x0} y={y0} width={W} height={H} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <>
          <rect x={x0} y={y0} width={W} height={H} fill={`url(#${idp}-halftone)`} />
          <circle cx={x0 + W * 0.84} cy={y0 + H * 0.28} r={H * 0.2} fill={color} />
          <rect x={x0 + W * 0.06} y={y0 + H * 0.06} width={W * 0.16} height={H * 0.03} fill={ink} />
          {lines.map((l, i) => (
            <text key={i} x={x0 + W * 0.06} y={y0 + H * 0.26 + i * fs * 1.02} fontFamily={fonts.display} fontSize={fs} fill={ink}>
              {l}
            </text>
          ))}
          <text x={x0 + W * 0.06} y={y0 + H * 0.82} fontFamily={fonts.mono} fontWeight={700} fontSize={fs * 0.19} letterSpacing={fs * 0.03} fill={color}>
            {subtitle.toUpperCase()}
          </text>
        </>
      )}
      <rect x={x0} y={y0} width={W} height={H} fill="#000" opacity={tint} />
    </g>
  );

  // moving half transforms
  let topT = '';
  let botT = '';
  let backShow = false;
  if (separate === 'lift') {
    topT = `translate(${sepT * W * 0.05} ${-sepT * (y0 + H * 0.8)}) rotate(${-sepT * 3.5} ${x0 + W / 2} ${cutY})`;
  } else if (separate === 'flip') {
    const th = sepT * Math.PI;
    const sy = Math.cos(th);
    backShow = sy < 0;
    topT = `translate(0 ${-sepT * H * 0.05}) translate(0 ${cutY}) scale(1 ${sy}) translate(0 ${-cutY})`;
  } else {
    botT = `translate(${sepB * 1.4 * u} ${sepB * sepB * 0.55 * u * (h > w ? 1.2 : 1)}) rotate(${sepB * 0.8} ${x0 + W / 2} ${cutY})`;
  }
  const gap = frame >= cutEnd + 6 ? 1 : 0;
  const jit = boil(frame, 3, 0.8);
  const revealP = prog(frame, cutEnd + 10, cutEnd + 30, ease.out);

  return (
    <AbsoluteFill style={{background}}>
      <PaperTexture opacity={0.45} seed={5} tint="#8a7350" />
      <Svg>
        <defs>
          <pattern id={`${idp}-halftone`} width={9 * u} height={9 * u} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <circle cx={4.5 * u} cy={4.5 * u} r={1.5 * u} fill={ink} opacity={0.18} />
          </pattern>
          <clipPath id={`${idp}-top`}>
            <path d={top} />
          </clipPath>
          <clipPath id={`${idp}-bot`}>
            <path d={bot} />
          </clipPath>
          <filter id={`${idp}-sh`} x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx={3 * u} dy={6 * u} stdDeviation={5 * u} floodColor="#22140a" floodOpacity="0.38" />
          </filter>
        </defs>
        <g transform={`translate(${jit.x} ${jit.y})`} opacity={slapIn.alpha}>
          <g transform={`translate(${cx} ${cy}) scale(${slapIn.scale}) translate(${-cx} ${-cy})`}>
            {/* revealed panel under the halves */}
            {gap > 0 && (
              <g opacity={revealP} clipPath={`url(#${idp}-top)`}>
                <rect x={x0} y={y0} width={W} height={H} fill={color} />
                <text x={cx} y={y0 + H * 0.36} textAnchor="middle" fontFamily={fonts.display} fontSize={Math.min(H * 0.34, (W * 0.8) / (Math.max(3, revealText.length) * 0.72))} fill={paper} transform={`rotate(-4 ${cx} ${y0 + H * 0.3})`}>
                  {revealText.toUpperCase()}
                </text>
                <rect x={x0} y={y0} width={W} height={H} fill={`url(#${idp}-halftone)`} opacity={0.6} />
              </g>
            )}
            {/* bottom half */}
            <g transform={botT} filter={separate === 'fall' ? `url(#${idp}-sh)` : undefined}>
              <g clipPath={`url(#${idp}-bot)`}>
                <Poster />
              </g>
            </g>
            {/* top half */}
            <g transform={topT} filter={`url(#${idp}-sh)`} opacity={1}>
              <g clipPath={`url(#${idp}-top)`}>{backShow ? <rect x={x0} y={y0} width={W} height={H} fill="#d8cfbb" /> : <Poster tint={separate === 'flip' ? sepT * 0.1 : 0} />}</g>
            </g>
            {/* cut gap */}
            {frame >= cutStart && gap === 0 && <polyline points={upTo(sPos)} fill="none" stroke={ink} strokeOpacity={0.7} strokeWidth={3.2 * u} strokeLinejoin="round" />}
            {/* dashed cut guide */}
            {frame < cutEnd + 8 && <polyline points={upTo(lineP)} fill="none" stroke={ink} strokeWidth={2.2 * u} strokeDasharray={`${10 * u} ${7 * u}`} strokeLinecap="butt" strokeLinejoin="round" opacity={frame >= cutStart ? 0.9 : 1} />}
          </g>
        </g>
        {/* tag */}
        {frame > at + 10 && frame < cutStart && (
          <g opacity={prog(frame, at + 14, at + 22, ease.out)} transform={`translate(${x0 + 12 * u} ${pts[0][1] - 26 * u})`}>
            <rect width={256 * u} height={34 * u} fill={ink} />
            <text x={14 * u} y={24 * u} fontFamily={fonts.mono} fontWeight={700} fontSize={18 * u} fill={paper}>
              {cutLabel}
            </text>
          </g>
        )}
        {/* scissors */}
        {scissorsOn && (
          <g transform={`translate(${sc.x + (1 - prog(frame, cutStart - 6, cutStart, ease.out)) * -60 * u + exitP * 260 * u} ${sc.y + exitP * -90 * u}) rotate(${(sc.ang * 180) / Math.PI})`}>
            <g transform={`scale(${(scissorSize * W) / 260 / 1})`}>
              <Scissors open={openAmt} size={260} />
            </g>
          </g>
        )}
        {sepB < 0 && null}
      </Svg>
    </AbsoluteFill>
  );
};

export const scissorCut = defineMotion<Props>({
  id: 'scissor-cut',
  title: 'Scissor cut',
  category: 'shape',
  description: 'A dashed "cut along the line" guide draws across an image, a pair of scissors travels it snipping five times, then the cut piece separates: it lifts away, flips over or falls, revealing a coloured panel beneath.',
  source: ['mg-styles-15 demos/06-collage/index.html (MIT, scissors() / CUT)'],
  useFor: 'Price-cut and coupon promos, "cut through the noise" reveals, before/after splits and paper-collage transitions into a reveal.',
  durationInFrames: 150,
  defaultProps: {
    title: 'Cut the noise',
    subtitle: 'Prices slashed this week',
    revealText: '50% off',
    src: '',
    path: [[0, 0.58], [0.2, 0.46], [0.42, 0.6], [0.64, 0.44], [0.82, 0.56], [1, 0.42]],
    snips: 5,
    at: 4,
    separate: 'lift',
    color: '#D2261C',
    ink: '#16130F',
    background: '#B89A72',
    paper: '#F2ECDF',
    scissorSize: 0.2,
    cutLabel: 'CUT ALONG THE LINE',
  },
  propDocs: {
    title: 'headline on the sheet',
    subtitle: 'small caps line under it',
    revealText: 'word revealed under the cut',
    src: 'optional image path (public/) used instead of the drawn sheet',
    path: 'cut line as [x,y] points in 0-1 sheet fractions, left edge to right edge',
    snips: 'number of snips (one per 6 frames)',
    at: 'start frame',
    separate: 'lift | flip | fall: what the cut piece does afterwards',
    color: 'accent / reveal colour',
    ink: 'line and type colour',
    background: 'table colour',
    paper: 'paper colour',
    scissorSize: 'scissors length as a fraction of sheet width',
    cutLabel: 'mono caption on the coupon strip',
  },
  component: ScissorCut,
  tags: ['scissors', 'cut', 'paper', 'collage', 'coupon', 'sale', 'reveal', 'split', 'dashed line', 'craft', 'price cut', 'transition', 'snip', 'kraft'],
});
