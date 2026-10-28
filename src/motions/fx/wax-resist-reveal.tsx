// Adapted from lemo-opuscar/styles/crayon-book/demo/gl.js FS_WASH + crayon.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {fbm} from '../../core/random';
import {
  BPt,
  CRAYON,
  CrayonFill,
  CrayonFilter,
  CrayonLine,
  CrayonPaper,
  bRng,
  boilStep,
  eio,
  ellipsePts,
  la2Fonts,
  mixHex,
  ptsD,
  seg,
  shash,
  smoothPts,
} from '../../core/r2-la2-kit';

/**
 * wax-resist-reveal — a crayon picture-book page that looks almost finished but empty-skied; a broad watercolour
 * wash sweeps across with bristle streaks and a darker wet leading edge, and hundreds of white-wax stars plus a
 * hidden message appear exactly where it passes, because the wash cannot stick to wax. Each uncovered star glints.
 */
type Props = {
  message: string;
  stars: number;
  washColor: string;
  direction: 'right' | 'down';
  washStart: number;
  washDuration: number;
  paperColor: string;
  inkColor: string;
  hillColors: string[];
  scene: boolean;
  beam: boolean;
  seed: number;
};

const star5 = (cx: number, cy: number, r: number, rot: number): BPt[] =>
  Array.from({length: 10}, (_, i) => {
    const a = -Math.PI / 2 + rot + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as BPt;
  });

const WaxResistReveal: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const st = boilStep(frame);
  const id = 'wrr';
  // ---------------- scene geometry
  const G = useMemo(() => {
    const hill1: BPt[] = [];
    const hill2: BPt[] = [];
    const y1 = h * (portrait ? 0.8 : 0.78);
    for (let i = 0; i <= 24; i++) {
      const x = -40 * u + ((w + 80 * u) * i) / 24;
      hill1.push([x, y1 - Math.sin((i / 24) * Math.PI * 1.6 + 0.2) * h * 0.075 - Math.sin((i / 24) * Math.PI * 3.1) * h * 0.02 + Math.sin(i * 1.3) * 3 * u]);
      hill2.push([x, y1 + h * 0.1 - Math.sin((i / 24) * Math.PI * 1.3 + 2.2) * h * 0.06 + Math.cos(i * 1.7) * 3 * u]);
    }
    const hillPoly = (top: BPt[]): BPt[] => [...top, [w + 60 * u, h + 60 * u], [-60 * u, h + 60 * u]];
    // lighthouse on the right
    const lx = w * (portrait ? 0.74 : 0.8);
    const groundY = (() => {
      let best = hill1[0];
      for (const q of hill1) if (Math.abs(q[0] - lx) < Math.abs(best[0] - lx)) best = q;
      return best[1] + 10 * u;
    })();
    const th = h * (portrait ? 0.24 : 0.34);
    const bwid = th * 0.24;
    const twid = th * 0.15;
    const topY = groundY - th;
    const tower: BPt[] = [
      [lx - bwid / 2, groundY],
      [lx - twid / 2, topY],
      [lx + twid / 2, topY],
      [lx + bwid / 2, groundY],
    ];
    const band = (f0: number, f1: number): BPt[] => {
      const yA = groundY - th * f0;
      const yB = groundY - th * f1;
      const wA = bwid + (twid - bwid) * f0;
      const wB = bwid + (twid - bwid) * f1;
      return [
        [lx - wA / 2, yA],
        [lx - wB / 2, yB],
        [lx + wB / 2, yB],
        [lx + wA / 2, yA],
      ];
    };
    const lamp: BPt[] = [
      [lx - twid * 0.42, topY],
      [lx - twid * 0.42, topY - th * 0.13],
      [lx + twid * 0.42, topY - th * 0.13],
      [lx + twid * 0.42, topY],
    ];
    const roof: BPt[] = [
      [lx - twid * 0.62, topY - th * 0.13],
      [lx, topY - th * 0.25],
      [lx + twid * 0.62, topY - th * 0.13],
    ];
    const lampC: BPt = [lx, topY - th * 0.065];
    const bx = lx - w * (portrait ? 0.78 : 0.5);
    const beamPoly: BPt[] = [lampC, [bx, lampC[1] - th * 0.38], [bx, lampC[1] - th * 0.06]];
    // moon (crescent) top-left of the light
    const mr = Math.min(w, h) * 0.075;
    const mc: BPt = [w * (portrait ? 0.3 : 0.6), h * (portrait ? 0.14 : 0.17)];
    const moonOuter = ellipsePts(mc[0], mc[1], mr, mr, 40);
    const crescent: BPt[] = [];
    for (let i = 0; i <= 30; i++) {
      const a = -Math.PI / 2 + (i / 30) * Math.PI * 2 * 0.5 - Math.PI * 0.0;
      crescent.push([mc[0] + Math.cos(a + Math.PI) * mr, mc[1] + Math.sin(a + Math.PI) * mr]);
    }
    // crescent: left half circle + inner arc
    const cres: BPt[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI / 2 + (i / 24) * Math.PI;
      cres.push([mc[0] + Math.cos(a) * mr, mc[1] + Math.sin(a) * mr]);
    }
    for (let i = 24; i >= 0; i--) {
      const a = Math.PI / 2 + (i / 24) * Math.PI;
      cres.push([mc[0] + mr * 0.35 + Math.cos(a) * mr * 0.62, mc[1] + Math.sin(a) * mr * 0.95]);
    }
    // message box
    const msgSize = Math.min(150 * u, (w * 0.84) / Math.max(4, p.message.length * 0.46));
    const msgY = h * (portrait ? 0.36 : 0.6);
    const msgW = p.message.length * msgSize * 0.46;
    // stars in the sky, avoiding the message, moon and lighthouse
    const R = bRng(p.seed * 97 + 5);
    const starsArr: {x: number; y: number; r: number; rot: number; glint: boolean}[] = [];
    let tries = 0;
    while (starsArr.length < p.stars && tries++ < p.stars * 20) {
      const x = R() * w;
      const y = R() * h * 0.74;
      const r = (5 + R() * R() * 13) * u;
      if (Math.abs(x - w / 2) < msgW / 2 + 20 * u && Math.abs(y - (msgY - msgSize * 0.35)) < msgSize * 0.75) continue;
      if (Math.hypot(x - mc[0], y - mc[1]) < mr * 1.35) continue;
      if (Math.abs(x - lx) < bwid && y > topY - th * 0.3) continue;
      if (y > y1 - h * 0.08 && R() < 0.8) continue;
      if (starsArr.some((s) => Math.hypot(s.x - x, s.y - y) < (s.r + r) * 1.6)) continue;
      starsArr.push({x, y, r, rot: R() * 1.2, glint: R() < 0.3});
    }
    return {hill1, hill2, hillPoly, tower, band, lamp, roof, lampC, beamPoly, mc, mr, cres, moonOuter, msgSize, msgY, msgW, starsArr, lx, y1};
  }, [w, h, u, portrait, p.message, p.stars, p.seed]);

  // ---------------- wash front
  const ws = p.washStart;
  const wd = p.washDuration;
  const wp = eio(seg(frame, ws, ws + wd)) * 0.85 + seg(frame, ws, ws + wd) * 0.15;
  const down = p.direction === 'down';
  const span = down ? h : w;
  const F = -0.14 * span + wp * 1.3 * span;
  const frontPts: BPt[] = [];
  const along = down ? w : h;
  for (let k = 0; k <= 40; k++) {
    const s = (along * k) / 40;
    const n = fbm('wrr-edge', s / (180 * u), frame * 0.004, 3) * 70 * u + Math.sin(s / (37 * u)) * 9 * u;
    const c = F + n;
    frontPts.push(down ? [s, c] : [c, s]);
  }
  const maskD = down ? `M${-20} ${-20}L${w + 20} ${-20}L${frontPts[frontPts.length - 1][0]} ${frontPts[frontPts.length - 1][1]}${ptsD([...frontPts].reverse()).replace('M', 'L')}Z` : `M${-20} ${-20}${ptsD(frontPts).replace('M', 'L')}L${-20} ${h + 20}Z`;
  const washOn = frame >= ws;
  const wet = washOn && wp < 1 ? 1 : washOn ? Math.max(0, 1 - (frame - ws - wd) / 20) : 0;
  const darkWash = mixHex(p.washColor, '#000000', 0.35);
  // bristle streaks (along the brush direction)
  const streaks = useMemo(() => {
    const R = bRng(p.seed * 13 + 1);
    return Array.from({length: 46}, () => ({o: R(), wdt: (1 + R() * 4) * u, a: 0.05 + R() * 0.07}));
  }, [p.seed, u]);

  // ---------------- timeline of the drawing
  const hillLine = eio(seg(frame, 2, 22));
  const hillFill1 = seg(frame, 10, 52);
  const hillFill2 = seg(frame, 18, 58);
  const towerLine = eio(seg(frame, 18, 40));
  const towerFill = seg(frame, 36, 64);
  const moonLine = eio(seg(frame, 26, 44));
  const moonFill = seg(frame, 40, 70);
  const waxT = seg(frame, 56, 78);
  const beamT = p.beam ? seg(frame, ws + wd + 4, ws + wd + 34) : 0;
  const S = G.starsArr;
  const sweepPos = (x: number, y: number) => (down ? y : x);

  const drawing = (
    <g>
      {p.scene && (
        <>
          <CrayonFill poly={G.hillPoly(G.hill1)} color={p.hillColors[0] ?? CRAYON.green} step={st} seed={3} p={0.7} gap={12 * u} w={12.5 * u} over={7 * u} draw={hillFill1} ang={0.5} />
          <CrayonFill poly={G.hillPoly(G.hill2)} color={p.hillColors[1] ?? CRAYON.violet} step={st + 2} seed={8} p={0.72} gap={12 * u} w={12.5 * u} over={7 * u} draw={hillFill2} ang={0.7} />
          <CrayonLine pts={G.hill1} color={p.inkColor} step={st} seed={2} w={7 * u} p={0.7} draw={hillLine} />
          <CrayonLine pts={G.hill2} color={p.inkColor} step={st + 1} seed={4} w={7 * u} p={0.7} draw={hillLine} />
          {/* lighthouse */}
          <CrayonFill poly={G.band(0.18, 0.4)} color={CRAYON.red} step={st} seed={21} p={0.78} gap={7 * u} w={8 * u} over={3 * u} draw={towerFill} />
          <CrayonFill poly={G.band(0.62, 0.84)} color={CRAYON.red} step={st} seed={22} p={0.78} gap={7 * u} w={8 * u} over={3 * u} draw={towerFill} />
          <CrayonFill poly={G.roof} color={CRAYON.red} step={st} seed={23} p={0.8} gap={6 * u} w={7 * u} over={2 * u} draw={towerFill} />
          <CrayonFill poly={G.lamp} color={CRAYON.yellow} step={st} seed={24} p={0.85} gap={5 * u} w={7 * u} over={2 * u} draw={towerFill} />
          <CrayonLine pts={[...G.tower, G.tower[0]]} color={p.inkColor} step={st + 3} seed={6} w={6 * u} p={0.75} draw={towerLine} />
          <CrayonLine pts={[...G.lamp, G.lamp[0]]} color={p.inkColor} step={st + 4} seed={7} w={5 * u} p={0.75} draw={towerLine} />
          <CrayonLine pts={[...G.roof, G.roof[0]]} color={p.inkColor} step={st + 5} seed={9} w={5 * u} p={0.75} draw={towerLine} />
          {/* moon */}
          <CrayonFill poly={G.cres} color={CRAYON.yellow} step={st} seed={31} p={0.8} gap={8 * u} w={9 * u} over={4 * u} draw={moonFill} />
          <CrayonLine pts={smoothPts(G.cres.filter((_, i) => i % 3 === 0), 4)} color={CRAYON.orange} step={st + 6} seed={11} w={5.5 * u} p={0.6} draw={moonLine} />
          {beamT > 0 && <CrayonFill poly={G.beamPoly} color={CRAYON.yellow} step={st} seed={41} p={0.42} gap={14 * u} w={13 * u} over={2 * u} draw={beamT} ang={0.05} />}
        </>
      )}
    </g>
  );
  const wax = (opacity: number) => (
    <g opacity={opacity}>
      {S.map((s, i) => {
        const vis = seg(waxT * S.length * 1.15 - i, 0, 1);
        if (vis <= 0) return null;
        return <path key={i} d={ptsD(star5(s.x + (shash(st, i) - 0.5) * 0.8 * u, s.y, s.r, s.rot), true)} fill={CRAYON.white} fillOpacity={0.92} />;
      })}
      <text x={w / 2} y={G.msgY} textAnchor="middle" fontFamily={la2Fonts.gaegu} fontWeight={700} fontSize={G.msgSize} fill={CRAYON.white} fillOpacity={waxT > 0.5 ? 0.95 : 0} letterSpacing={G.msgSize * 0.02}>
        {p.message}
      </text>
    </g>
  );
  // knock-out: characters keep the paper white behind them
  const knock = p.scene ? (
    <g fill="black">
      <path d={ptsD(G.tower, true)} />
      <path d={ptsD(G.lamp, true)} />
      <path d={ptsD(G.roof, true)} />
      <path d={ptsD(G.cres, true)} />
    </g>
  ) : null;

  return (
    <AbsoluteFill style={{background: p.paperColor}}>
      <Svg>
        <defs>
          <CrayonFilter id={`${id}-cr`} scale={u} />
          <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
            <rect width={w} height={h} fill="black" />
            {washOn && <path d={maskD} fill="white" />}
            {knock}
          </mask>
          <mask id={`${id}-mw`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
            <rect width={w} height={h} fill="black" />
            {washOn && <path d={maskD} fill="white" />}
          </mask>
          <filter id={`${id}-dens`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={down ? `${0.012 / u} ${0.0018 / u}` : `${0.0018 / u} ${0.012 / u}`} numOctaves={3} seed={p.seed + 2} />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0.05  1.6 0 0 0 -0.6" />
          </filter>
          <filter id={`${id}-gran`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={0.55 / u} numOctaves={2} seed={p.seed + 9} />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0.08  3 0 0 0 -1.55" />
          </filter>
          <filter id={`${id}-blur`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={9 * u} />
          </filter>
        </defs>
        <CrayonPaper id={`${id}-p`} w={w} h={h} color={p.paperColor} scale={u} />
        {/* faint wax before the wash: barely visible white on white */}
        <g filter={`url(#${id}-cr)`}>{wax(0.22)}</g>
        {/* the wash */}
        {washOn && (
          <g mask={`url(#${id}-m)`} style={{mixBlendMode: 'multiply'}}>
            <rect width={w} height={h} fill={p.washColor} opacity={0.9} />
            <rect width={w} height={h} filter={`url(#${id}-dens)`} opacity={0.55} />
            <rect width={w} height={h} filter={`url(#${id}-gran)`} opacity={0.5} />
            <g>
              {streaks.map((s, i) => (down ? <rect key={i} x={s.o * w} y={0} width={s.wdt} height={h} fill={darkWash} opacity={s.a} /> : <rect key={i} x={0} y={s.o * h} width={w} height={s.wdt} fill={darkWash} opacity={s.a} />))}
            </g>
            {wet > 0 && <path d={ptsD(frontPts)} fill="none" stroke={darkWash} strokeWidth={38 * u} opacity={0.45 * wet} filter={`url(#${id}-blur)`} />}
          </g>
        )}
        {/* wax shows exactly where the wash has passed */}
        <g mask={`url(#${id}-mw)`}>
          <g filter={`url(#${id}-cr)`}>{wax(1)}</g>
        </g>
        <g filter={`url(#${id}-cr)`}>{drawing}</g>
        {/* glints as the wash uncovers stars, then gentle twinkles */}
        {S.map((s, i) => {
          if (!s.glint) return null;
          const pos = sweepPos(s.x, s.y);
          const d = (F - pos) / (90 * u);
          let g = washOn && d > 0 ? Math.exp(-((d - 0.6) * (d - 0.6)) * 3) : 0;
          if (frame > ws + wd) g = Math.max(g, Math.pow(Math.max(0, Math.sin(frame * 0.09 + i * 2.1)), 12));
          if (g < 0.02) return null;
          const L = s.r * 2.6 * g;
          return (
            <g key={`g${i}`} opacity={g}>
              <path d={`M${s.x} ${s.y - L}Q${s.x} ${s.y} ${s.x + L * 0.7} ${s.y}Q${s.x} ${s.y} ${s.x} ${s.y + L}Q${s.x} ${s.y} ${s.x - L * 0.7} ${s.y}Q${s.x} ${s.y} ${s.x} ${s.y - L}Z`} fill="#FFFDF4" />
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const waxResistReveal = defineMotion<Props>({
  id: 'wax-resist-reveal',
  title: 'Wax resist reveal',
  category: 'fx',
  description:
    'Crayon picture-book page (hills, lighthouse, moon) drawn on toothy paper; a broad ultramarine watercolour wash sweeps across with bristle streaks and a dark wet front, and hundreds of white-wax stars plus a hidden hand-lettered message appear exactly where it passes, each uncovered star glinting.',
  source: ['lemo-opuscar styles/crayon-book (MIT, LemoLab) — demo/gl.js FS_WASH wax resist, demo/crayon.js'],
  useFor: 'Reveal a hidden message, thank-you names or a feature: greeting cards, kids brands, bedtime stories, education.',
  durationInFrames: 240,
  defaultProps: {
    message: 'make a wish',
    stars: 150,
    washColor: '#2B3576',
    direction: 'right',
    washStart: 82,
    washDuration: 88,
    paperColor: CRAYON.paper,
    inkColor: CRAYON.ink,
    hillColors: [CRAYON.green, CRAYON.violet],
    scene: true,
    beam: true,
    seed: 3,
  },
  propDocs: {
    message: 'the hidden message written in white wax (short)',
    stars: 'number of white-wax stars',
    washColor: 'watercolour colour (ultramarine default; try rose #9B3B5A or sap green #2F5A3A)',
    direction: 'wash sweep direction: right or down',
    washStart: 'frame the brush enters',
    washDuration: 'frames for the sweep (2–3 s)',
    paperColor: 'paper colour',
    inkColor: 'outline crayon colour',
    hillColors: 'two crayon colours for the hills',
    scene: 'draw the picture-book scene (false = only paper, wax and wash)',
    beam: 'the lighthouse beam is coloured in after the wash',
    seed: 'star layout seed',
  },
  component: WaxResistReveal,
  tags: ['crayon', 'wax', 'resist', 'watercolour', 'wash', 'reveal', 'hidden-message', 'stars', 'night', 'picture-book', 'kids', 'greeting-card', 'hand-made', 'paper', 'glint'],
});
