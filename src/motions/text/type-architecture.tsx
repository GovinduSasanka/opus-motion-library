// Adapted from lemo-opuscar/styles/spy-titles/demo/scenes.js (train / colonnade / rooftop sets) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {CutFigure, eio3, fx, gothicAdvance, h1, lerp, lf, mixHex, rigPose, seg, useUid} from '../../core/r2-lb2b-kit';

/**
 * One line of credits becomes a set: letters are pillars, words are train carriages on wheels (or colonnade bays),
 * all black re-cut paper on a flat red ground. A silhouette agent runs the rooftops, leaps the word gaps and ducks behind
 * the line; the camera opens wide on the whole line, trucks with the action, then pulls back to the finished title.
 */
type Props = {
  line: string;
  mode: 'train' | 'colonnade' | 'ledge' | 'plain';
  figure: boolean;
  ground: string;
  ink: string;
  paper: string;
  accent: string;
  openWideFrames: number;
  speed: number;
  seed: number;
};

const TypeArchitecture: React.FC<Props> = ({line, mode, figure, ground, ink, paper, accent, openWideFrames, speed, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: dur, portrait} = useStage();
  const uid = useUid('tarch');
  const fam = lf('gothic');
  const cap = 0.27 * Math.min(h, w * 0.75);
  const fs = cap / 0.72;
  const text = line.toUpperCase();
  const words = text.split(/\s+/).filter(Boolean);
  const track = cap * 0.035;
  const wordGap = cap * 0.62;
  // layout
  type L = {ch: string; x: number; wd: number};
  const wl: {x0: number; x1: number; letters: L[]}[] = [];
  let x = 0;
  words.forEach((wd) => {
    const letters: L[] = [];
    const x0 = x;
    for (const ch of wd) {
      const wdt = gothicAdvance(ch) * fs;
      letters.push({ch, x, wd: wdt});
      x += wdt + track;
    }
    wl.push({x0, x1: x - track, letters});
    x += wordGap - track;
  });
  const worldW = Math.max(1, x - wordGap + track);
  const sWide = Math.min(1, (w * 0.9) / worldW);
  const roofY = -cap - cap * 0.045;
  const figH = cap * 0.5;
  const startX = -cap * 1.6;
  const last = wl[wl.length - 1];
  const hideX = last ? (last.x0 + last.x1) / 2 - cap * 0.1 : worldW / 2;
  const hideAt = dur - 64;
  const runK = seg(frame, 22, hideAt);
  const runX = lerp(startX, hideX, speed === 1 ? runK : Math.min(1, runK * speed));
  // roof height + leap
  let leapY = 0;
  let air = false;
  for (let i = 0; i < wl.length - 1; i++) {
    const a = wl[i].x1 - cap * 0.3;
    const b = wl[i + 1].x0 + cap * 0.3;
    if (runX > a && runX < b) {
      const s = (runX - a) / (b - a);
      leapY = -Math.sin(Math.PI * s) * cap * 0.42;
      air = true;
    }
  }
  const hide = seg(frame, hideAt, hideAt + 10);
  const pose = hide > 0 ? rigPose('look', frame) : air ? rigPose('leap', frame) : rigPose('run', frame, 0, true, 14);
  // camera
  const e = eio3(seg(frame, openWideFrames, openWideFrames + 40));
  const back = eio3(seg(frame, hideAt + 14, hideAt + 50));
  const kz = e * (1 - back);
  const s = lerp(sWide, portrait ? sWide : 1, kz);
  const followX = runX + (w * 0.2) / Math.max(0.2, s);
  const camX = portrait ? worldW / 2 : lerp(worldW / 2, Math.max(0, Math.min(worldW, followX)), kz);
  const camY = -cap * 0.62;
  const baseY = h * 0.56;
  const worldT = `translate(${fx(w / 2)},${fx(baseY)}) scale(${fx(s)}) translate(${fx(-camX)},${fx(-camY)})`;
  const farCamX = lerp(worldW / 2, camX, 0.55);
  const farT = `translate(${fx(w / 2)},${fx(baseY)}) scale(${fx(s * 0.8)}) translate(${fx(-farCamX)},${fx(-camY)})`;
  const dark = mixHex(ground, '#000000', 0.3);
  // entrance: letters pop up row by row
  const entry = (i: number) => seg(frame, 2 + i * 1.2, 12 + i * 1.2);
  let li = 0;
  const letterEls: React.ReactNode[] = [];
  const props: React.ReactNode[] = [];
  wl.forEach((wd, wi) => {
    const wp = entry(wi * 3);
    if (mode === 'train') {
      const cx0 = wd.x0 - cap * 0.12;
      const cx1 = wd.x1 + cap * 0.12;
      props.push(<rect key={`ch${wi}`} x={cx0} y={0} width={cx1 - cx0} height={cap * 0.07} fill={ink} />);
      const nw = Math.max(2, Math.round((cx1 - cx0) / (cap * 1.4)));
      for (let k = 0; k < nw; k++) {
        const wxx = lerp(cx0 + cap * 0.35, cx1 - cap * 0.35, nw === 1 ? 0.5 : k / (nw - 1));
        const wr = cap * 0.1;
        props.push(
          <g key={`wh${wi}-${k}`} transform={`translate(${fx(wxx)},${fx(cap * 0.14)}) rotate(${fx(-(runX * 0.3) % 360)})`}>
            <circle r={wr} fill={ink} />
            <circle r={wr * 0.55} fill={ground} />
            <circle r={wr * 0.2} fill={paper} />
            <line x1={-wr * 0.5} y1={0} x2={wr * 0.5} y2={0} stroke={ink} strokeWidth={wr * 0.16} />
          </g>,
        );
      }
      if (wi < wl.length - 1) props.push(<rect key={`cp${wi}`} x={cx1} y={cap * 0.02} width={wordGap - cap * 0.24} height={cap * 0.04} fill={ink} />);
    }
    if (mode === 'colonnade') {
      wd.letters.forEach((lt, k) => {
        props.push(<rect key={`pl${wi}-${k}`} x={lt.x - cap * 0.03} y={0} width={lt.wd + cap * 0.06} height={cap * 0.06} fill={ink} />);
        props.push(<rect key={`cap${wi}-${k}`} x={lt.x - cap * 0.03} y={-cap - cap * 0.008} width={lt.wd + cap * 0.06} height={cap * 0.03} fill={ink} />);
      });
    }
    if (mode === 'ledge') props.push(<rect key={`le${wi}`} x={wd.x0 - cap * 0.2} y={0} width={wd.x1 - wd.x0 + cap * 0.4} height={cap * 0.07} fill={ink} />);
    // roof beam
    if (mode !== 'ledge' || true) props.push(<rect key={`rf${wi}`} x={wd.x0 - cap * 0.08} y={roofY} width={wd.x1 - wd.x0 + cap * 0.16} height={cap * 0.045} fill={ink} transform={`translate(0 ${fx((1 - wp) * -cap * 0.3)})`} opacity={wp} />);
    wd.letters.forEach((lt) => {
      const p = entry(li);
      const rot = (h1(li, seed) - 0.5) * 1.6;
      const dy = (h1(li + 20, seed) - 0.5) * 3;
      letterEls.push(
        <text
          key={li}
          x={lt.x + lt.wd / 2}
          textAnchor="middle"
          y={dy + (1 - p) * cap * 0.4}
          opacity={p}
          fontFamily={fam}
          fontSize={fs}
          fill={ink}
          transform={`rotate(${fx(rot)} ${fx(lt.x + lt.wd / 2)} ${fx(-cap / 2)})`}
        >
          {lt.ch}
        </text>,
      );
      li++;
    });
  });
  // far background: poles + wires
  const poleStep = cap * 2.6;
  const poles: React.ReactNode[] = [];
  for (let k = -3; k < Math.ceil(worldW / poleStep) + 4; k++) {
    const px = k * poleStep;
    poles.push(<rect key={`p${k}`} x={px - cap * 0.02} y={-cap * 2.1} width={cap * 0.04} height={cap * 2.1} fill={dark} />);
    poles.push(<rect key={`a${k}`} x={px - cap * 0.18} y={-cap * 2.05} width={cap * 0.36} height={cap * 0.03} fill={dark} />);
    for (const wy of [-2.0, -1.88]) {
      poles.push(<path key={`w${k}${wy}`} d={`M${fx(px)},${fx(wy * cap)} Q${fx(px + poleStep / 2)},${fx(wy * cap + cap * 0.3)} ${fx(px + poleStep)},${fx(wy * cap)}`} stroke={paper} strokeWidth={cap * 0.008} fill="none" opacity={0.65} />);
    }
  }
  const figX = runX;
  const figY = roofY + leapY + hide * figH * 1.05;
  const showFig = figure && frame >= 20;
  return (
    <AbsoluteFill style={{background: ground}}>
      <Svg>
        <defs>
          <filter id={`${uid}cut`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={seed} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={fx(cap * 0.012)} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <clipPath id={`${uid}roof`}>
            <rect x={-cap * 4} y={-cap * 6} width={worldW + cap * 8} height={cap * 6 + roofY + cap * 0.01} />
          </clipPath>
        </defs>
        <g transform={farT}>{poles}</g>
        <g transform={worldT}>
          {/* ground line / rails */}
          <rect x={-cap * 6} y={cap * (mode === 'train' ? 0.26 : 0.07)} width={worldW + cap * 12} height={cap * 0.02} fill={paper} opacity={0.9} />
          <rect x={-cap * 6} y={cap * (mode === 'train' ? 0.3 : 0.11)} width={worldW + cap * 12} height={h} fill={dark} />
          <g filter={`url(#${uid}cut)`}>
            {props}
            {letterEls}
          </g>
          {showFig && (
            <g clipPath={hide > 0 ? `url(#${uid}roof)` : undefined}>
              <g transform={`translate(${fx(figX)},${fx(figY)})`}>
                <CutFigure kind="agent" pose={pose} H={figH} ink={ink} accent={accent} ground={ground} object={paper} frame={frame} running={hide === 0} />
              </g>
            </g>
          )}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const typeArchitecture = defineMotion<Props>({
  id: 'type-architecture',
  title: 'Type architecture (credits as a set)',
  category: 'text',
  description:
    'One line of credits fills the frame as a set: letters stand as black cut-paper pillars, words ride as train carriages on wheels (or colonnade bays) on a flat red ground with telegraph wires behind, while a silhouette agent runs the rooftops, leaps the word gaps and ducks behind the line; the camera opens wide, trucks with the chase and pulls back.',
  source: ['lemo-opuscar styles/spy-titles demo/scenes.js, glyph.js (MIT, LemoLab)'],
  useFor: 'Conference programmes, team rosters, festival line-ups, feature lists: "credits as a set" for any short named list; a very distinctive opener.',
  durationInFrames: 210,
  defaultProps: {
    line: 'Northwind Express',
    mode: 'train',
    figure: true,
    ground: '#c8321e',
    ink: '#1b1714',
    paper: '#efe4c9',
    accent: '#e2a52a',
    openWideFrames: 24,
    speed: 1,
    seed: 3,
  },
  propDocs: {
    line: 'the line of text (short; 2-3 words works best)',
    mode: "'train' carriages + wheels, 'colonnade' plinths + capitals, 'ledge' ground slab, 'plain'",
    figure: 'show the running silhouette agent',
    ground: 'flat ground colour',
    ink: 'cut-paper black',
    paper: 'cream for rails, wires and hubs',
    accent: "the agent's tie",
    openWideFrames: 'frame the camera starts moving in from the wide establishing view',
    speed: 'runner speed multiplier',
    seed: 'letter re-cut seed',
  },
  component: TypeArchitecture,
  tags: ['credits', 'title', 'cut paper', 'spy', 'train', 'colonnade', 'letters', 'roster', 'line-up', 'opener', 'silhouette', 'saul bass', 'programme', 'set design'],
});
