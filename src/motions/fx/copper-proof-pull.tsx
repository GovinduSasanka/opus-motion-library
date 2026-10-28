// Adapted from lemo-opuscar/styles/engraving/demo/engine/{copper.js,burin.js,plate.js} (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {BPt, ENGRAVE, EngravedSheet, InkPaths, buildPearPlate, engravedReveal, eio, la2Fonts, seg, vnoise1} from '../../core/r2-la2-kit';

/**
 * copper-proof-pull — an extreme close-up of polished warm copper: a burin cuts glinting grooves (dark trough, bright
 * burr toward the light) with a curling copper swarf ribbon ahead of the point, while the camera pulls back over the
 * mirrored plate; then a paper sheet sweeps across with a curled edge and the image is revealed printed true on paper.
 */
type Props = {
  title: string;
  subtitle: string;
  cutDuration: number;
  peelAt: number;
  peelDuration: number;
  push: number;
  ink: string;
  paper: string;
  copperA: string;
  copperB: string;
  copperC: string;
};

const CopperProofPull: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const plate = useMemo(() => {
    const figH = h * (portrait ? 0.42 : 0.62);
    const s = figH / 680;
    const cx = w / 2;
    const cy = h * (portrait ? 0.44 : 0.46);
    const tr = (q: BPt): BPt => [cx + (q[0] - 520) * s, cy + (q[1] - 480) * s];
    const P = buildPearPlate(tr, s, u);
    const T = p.cutDuration;
    P.ink.schedule(['bol', 'lol', 'st'], 0.1, T * 0.45, 2);
    P.ink.schedule(['bh1', 'lh1'], T * 0.35, T * 0.8, 50);
    P.ink.schedule(['bh2', 'lh2', 'bh3', 'bst', 'sh'], T * 0.65, T, 60);
    return P;
  }, [w, h, u, portrait, p.cutDuration]);
  const r = plate.ink.render(t);
  const bb = plate.bbox;
  const cx = w / 2;
  // camera: loupe on the first cuts → full plate
  const pull = eio(seg(t, 0, p.cutDuration * 0.85));
  const Z = 1 + p.push * (1 - pull);
  const fx0 = 2 * cx - (bb[0] + (bb[2] - bb[0]) * 0.3); // mirrored focus
  const fy0 = bb[1] + (bb[3] - bb[1]) * 0.2;
  const camX = cx + (fx0 - cx) * (1 - pull);
  const camY = h / 2 + (fy0 - h / 2) * (1 - pull);
  const tx = w / 2 - camX * Z;
  const ty = h / 2 - camY * Z;
  // main burin tip = the longest-running active stroke (first tip)
  const focusU: BPt = [bb[0] + (bb[2] - bb[0]) * 0.3, bb[1] + (bb[3] - bb[1]) * 0.2];
  const tip = r.tips.length ? r.tips.reduce((a, b) => (Math.hypot(b[0] - focusU[0], b[1] - focusU[1]) < Math.hypot(a[0] - focusU[0], a[1] - focusU[1]) ? b : a)) : null;
  const light: BPt = [-0.6, -0.8];
  const px = 1;
  const mirror = `translate(${2 * cx} 0) scale(-1 1)`;
  // peel: paper sweeps across from the left with a curled leading edge
  const pp = eio(seg(t, p.peelAt, p.peelAt + p.peelDuration));
  const slope = 0.28;
  const F = -0.25 * w + pp * 1.6 * w;
  const foldX = (y: number) => F + (y - h / 2) * slope;
  const curlW = 70 * u * Math.sin(Math.PI * Math.min(1, pp * 1.05));
  const paperPoly = `M-10 -10L${foldX(-10)} -10L${foldX(h + 10)} ${h + 10}L-10 ${h + 10}Z`;
  const curlPoly = `M${foldX(-10)} -10L${foldX(-10) + curlW} -10L${foldX(h + 10) + curlW} ${h + 10}L${foldX(h + 10)} ${h + 10}Z`;
  const shadowPoly = `M${foldX(-10)} -10L${foldX(-10) + curlW + 70 * u} -10L${foldX(h + 10) + curlW + 70 * u} ${h + 10}L${foldX(h + 10)} ${h + 10}Z`;
  const titleSize = Math.min(50 * u, (w * 0.84) / Math.max(6, p.title.length * 0.8));
  const titleP = seg(t, p.peelAt + p.peelDuration + 0.2, p.peelAt + p.peelDuration + 1.4);
  const g = [...p.title];
  const tyT = bb[3] + (portrait ? 150 : 86) * u;
  // swarf coil ahead of the tip
  const swarf = (() => {
    if (!tip) return null;
    const dx = tip[3];
    const dy = tip[4];
    const nx = -dy;
    const ny = dx;
    const L = Math.min(1, (t * 120) / 520);
    const pts: string[] = [];
    const N = 70;
    let a = 0;
    for (let i = 0; i <= N; i++) {
      const uu = i / N;
      a += ((0.6 + 2.6 * L) * Math.PI * 2) / N * (0.75 + 0.5 * vnoise1(uu * 6 + 3, 3));
      const rr = u * (3 + 16 * Math.pow(uu, 0.8) * (0.55 + 0.45 * L));
      const ax = u * (4 + 18 * uu * L);
      const x = tip[0] + dx * (ax + rr * Math.sin(a)) + nx * (-rr * (1 - Math.cos(a)) * 0.9);
      const y = tip[1] + dy * (ax + rr * Math.sin(a)) + ny * (-rr * (1 - Math.cos(a)) * 0.9) - rr * 0.3 * (1 - Math.cos(a));
      pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return 'M' + pts.join('L');
  })();
  // burin (steel shaft + wooden mushroom handle) trailing the tip
  const burin = (() => {
    if (!tip) return null;
    const sk = 0.22;
    const ca = Math.cos(sk);
    const sa = Math.sin(sk);
    const dx = tip[3] * ca - tip[4] * sa;
    const dy = tip[3] * sa + tip[4] * ca;
    const nx = -dy;
    const ny = dx;
    const L = 400 * u;
    const wd = 24 * u;
    const P = (d: number, o = 0): string => `${(tip[0] - dx * d + nx * o).toFixed(1)} ${(tip[1] - dy * d + ny * o).toFixed(1)}`;
    const hc: BPt = [tip[0] - dx * (L + 110 * u), tip[1] - dy * (L + 110 * u)];
    const ang = (Math.atan2(-dy, -dx) * 180) / Math.PI;
    return (
      <g>
        <path d={`M${P(4)}L${P(L, wd * 0.7)}L${P(L + 150 * u, wd * 3.2)}L${P(L + 150 * u, -wd * 3.2)}L${P(L, -wd * 0.7)}Z`} fill="rgba(30,8,2,0.45)" transform={`translate(${10 * u} ${14 * u})`} filter="url(#cpp-sh)" />
        <path d={`M${P(0)}L${P(30 * u, wd * 0.5)}L${P(L, wd * 0.5)}L${P(L, 0)}L${P(30 * u * 1.18, 0)}Z`} fill="#CDD5DC" />
        <path d={`M${P(0)}L${P(30 * u * 1.18, 0)}L${P(L, 0)}L${P(L, -wd * 0.5)}L${P(30 * u, -wd * 0.5)}Z`} fill="#2C3237" />
        <path d={`M${P(30 * u * 1.18, 0)}L${P(L, 0)}`} stroke="#fff" strokeWidth={1.4 * u} opacity={0.85} />
        <path d={`M${P(L - 3 * u, wd * 0.9)}L${P(L + 18 * u, wd * 0.95)}L${P(L + 18 * u, -wd * 0.95)}L${P(L - 3 * u, -wd * 0.9)}Z`} fill="#D9B86A" />
        <g transform={`translate(${hc[0]} ${hc[1]}) rotate(${ang})`}>
          <path d={`M${-95 * u} ${-16 * u}C${-70 * u} ${-20 * u} ${-50 * u} ${-78 * u} ${10 * u} ${-80 * u}C${75 * u} ${-80 * u} ${100 * u} ${-40 * u} ${100 * u} 0C${100 * u} ${40 * u} ${75 * u} ${80 * u} ${10 * u} ${80 * u}C${-50 * u} ${78 * u} ${-70 * u} ${20 * u} ${-95 * u} ${16 * u}Z`} fill="url(#cpp-wood)" />
          <ellipse cx={-22 * u} cy={-24 * u} rx={28 * u} ry={12 * u} fill="#FFDDB8" opacity={0.25} transform={`rotate(-20 ${-22 * u} ${-24 * u})`} />
        </g>
      </g>
    );
  })();
  return (
    <AbsoluteFill style={{background: '#2a1006'}}>
      <Svg>
        <defs>
          <linearGradient id="cpp-cu" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={p.copperA} />
            <stop offset="0.4" stopColor={p.copperB} />
            <stop offset="0.7" stopColor="#86441F" />
            <stop offset="1" stopColor={p.copperC} />
          </linearGradient>
          <radialGradient id="cpp-room" cx="0.46" cy="0.4" r="0.75">
            <stop offset="0.2" stopColor="#FFFAF5" />
            <stop offset="1" stopColor="#2A0F05" />
          </radialGradient>
          <radialGradient id="cpp-wood" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#C98A4E" />
            <stop offset="0.5" stopColor="#8A4F24" />
            <stop offset="1" stopColor="#3E1F0C" />
          </radialGradient>
          <filter id="cpp-scr" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={`${0.003 / u} ${0.35 / u}`} numOctaves={2} seed={21} />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.9  0 0 0 0 0.8  2.4 0 0 0 -1.15" />
          </filter>
          <filter id="cpp-win" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={14 * u} />
          </filter>
          <filter id="cpp-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={90 * u} />
          </filter>
          <filter id="cpp-sh" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={8 * u} />
          </filter>
          <clipPath id="cpp-paper">
            <path d={paperPoly} />
          </clipPath>
        </defs>
        <g transform={`translate(${tx} ${ty}) scale(${Z})`}>
          {/* the copper plate */}
          <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="url(#cpp-cu)" />
          <g transform={`rotate(-8 ${cx} ${h / 2})`} opacity={0.35} style={{mixBlendMode: 'overlay'}}>
            <rect x={-w} y={-h} width={w * 3} height={h * 3} filter="url(#cpp-scr)" />
          </g>
          <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="url(#cpp-room)" style={{mixBlendMode: 'multiply'}} />
          <g style={{mixBlendMode: 'screen'}} transform={`translate(${w * 0.5 + (camX - cx) * -0.15} ${h * 0.46}) rotate(-12.6)`}>
            <rect x={-700 * u} y={-380 * u} width={1400 * u} height={760 * u} fill="rgba(255,170,110,0.22)" filter="url(#cpp-glow)" />
            <g filter="url(#cpp-win)">
              {[
                [-330, -210],
                [-10, -210],
                [-330, 2],
                [-10, 2],
              ].map(([x, y], i) => (
                <rect key={i} x={x * u} y={y * u} width={300 * u} height={190 * u} fill="rgba(255,214,176,0.3)" />
              ))}
            </g>
          </g>
          {/* grooves on the mirrored plate */}
          <g transform={mirror}>
            <InkPaths paths={r.paths} color="rgba(50,16,4,0.45)" wScale={1.9} dx={-light[0] * px * 2.5 * u} dy={-light[1] * px * 2.5 * u} />
            <InkPaths paths={r.paths} color="rgba(255,226,186,0.95)" wScale={1.35} dx={light[0] * px * 2.2 * u} dy={light[1] * px * 2.2 * u} />
            <InkPaths paths={r.paths} color="#240C05" />
            <InkPaths paths={r.paths} color="rgba(214,128,78,0.7)" wScale={0.25} dx={-light[0] * 1.2 * u} dy={-light[1] * 1.2 * u} />
            {tip && t < p.cutDuration + 0.1 && (
              <g>
                {swarf && (
                  <g>
                    <path d={swarf} fill="none" stroke="rgba(30,8,2,0.4)" strokeWidth={4 * u} transform={`translate(${6 * u} ${9 * u})`} filter="url(#cpp-sh)" />
                    <path d={swarf} fill="none" stroke="#C4703C" strokeWidth={4.2 * u} strokeLinecap="round" />
                    <path d={swarf} fill="none" stroke="#FFE2BA" strokeWidth={1.3 * u} strokeLinecap="round" opacity={0.9} />
                  </g>
                )}
                {burin}
                <circle cx={tip[0]} cy={tip[1]} r={5 * u} fill="#FFF6E0" opacity={0.85} filter="url(#cpp-sh)" />
              </g>
            )}
          </g>
        </g>
        {/* the proof: paper sweeping across, printed true */}
        {pp > 0 && (
          <g>
            <path d={shadowPoly} fill="rgba(20,6,2,0.35)" filter="url(#cpp-sh)" />
            <g clipPath="url(#cpp-paper)">
              <EngravedSheet id="cpp-sheet" w={w} h={h} u={u} paper={p.paper} />
              <InkPaths paths={plate.ink.render(1e9).paths} color={p.ink} />
              <text x={w / 2} y={tyT} textAnchor="middle" fontFamily={la2Fonts.bodoni} fontWeight={500} fontSize={titleSize} letterSpacing={titleSize * 0.16} fill={p.ink}>
                {g.map((c, i) => (
                  <tspan key={i} opacity={Math.min(1, engravedReveal(titleP, g.length, i))}>
                    {c}
                  </tspan>
                ))}
              </text>
              <text x={w / 2} y={tyT + titleSize * 0.95} textAnchor="middle" fontFamily={la2Fonts.bodoni} fontStyle="italic" fontSize={titleSize * 0.52} fill={p.ink} opacity={seg(t, p.peelAt + p.peelDuration + 1, p.peelAt + p.peelDuration + 1.8)}>
                {p.subtitle}
              </text>
            </g>
            {curlW > 1 && (
              <g>
                <defs>
                  <linearGradient id="cpp-curl" x1="0" y1="0" x2="1" y2="0" gradientTransform={`rotate(${Math.atan(slope) * (180 / Math.PI)} 0.5 0.5)`}>
                    <stop offset="0" stopColor="#B9AE95" />
                    <stop offset="0.45" stopColor="#FBF6EA" />
                    <stop offset="1" stopColor="#D8CCB0" />
                  </linearGradient>
                </defs>
                <path d={curlPoly} fill="url(#cpp-curl)" />
              </g>
            )}
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const copperProofPull = defineMotion<Props>({
  id: 'copper-proof-pull',
  title: 'Copper proof pull',
  category: 'fx',
  description:
    'ECU of polished warm copper with hairline scratches and a blurred four-pane window reflection: a burin cuts glinting grooves (dark trough, bright burr) with a curling swarf ribbon while the camera pulls back over the mirrored plate; then a paper sheet sweeps across with a curled edge and the image is revealed printed true, with an engraved title.',
  source: ['lemo-opuscar styles/engraving (MIT, LemoLab) — demo/engine/copper.js drawCopper, copperLight, drawGrooves, drawBurin, drawSwarf'],
  useFor: '"The secret comes out / draft becomes final / die and strike" reveals: stamps, coins, certificates, heritage brands, craft stories.',
  durationInFrames: 210,
  defaultProps: {
    title: 'PROOF · FIRST STATE',
    subtitle: 'pulled from the copper',
    cutDuration: 3.4,
    peelAt: 3.6,
    peelDuration: 0.9,
    push: 1.4,
    ink: ENGRAVE.ink,
    paper: ENGRAVE.paper,
    copperA: '#5E2A12',
    copperB: '#94502C',
    copperC: '#4E220E',
  },
  propDocs: {
    title: 'roman caption cut on the proof',
    subtitle: 'italic line under it',
    cutDuration: 'seconds of burin cutting on the copper',
    peelAt: 'second the paper starts to sweep across',
    peelDuration: 'seconds of the sweep (~0.7–1)',
    push: 'extra loupe zoom at the start',
    ink: 'printing ink colour',
    paper: 'paper colour',
    copperA: 'copper gradient start',
    copperB: 'copper gradient middle',
    copperC: 'copper gradient end',
  },
  component: CopperProofPull,
  tags: ['copper', 'engraving', 'burin', 'proof', 'print', 'intaglio', 'reveal', 'metal', 'groove', 'swarf', 'craft', 'heritage', 'peel', 'mirror', 'press'],
});
