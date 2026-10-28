// Adapted from lemo-opuscar/styles/midcentury-toon/demo/engine/toon.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {TOON, ToonDefs, ToonShape, ToonText, back, eo, fitW, hash, lbf, pd, seg, sparklePts, starPts, toonIconPts, twosF} from '../../core/r2-lb1-kit';

/**
 * The mid-century "toon cel" primitive as a motion: every shape is an off-register flat fill that re-jitters on twos
 * (a hand-registered colour cel) under a broken, pressure-varying ink ribbon that writes itself on; dry-brush tooth
 * inside the fills; the title gets the same two-plate print. Icons pop with a 1.9 back-ease, ink draws on.
 */

type Item = {icon: string; color: string; label?: string};
type Props = {
  items: Item[];
  kicker: string;
  title: string;
  paper: string;
  ground: string;
  ink: string;
  plate: string;
  lineWidth: number;
  breaks: number;
  wob: number;
  jitter: number;
  tooth: number;
  drawFrames: number;
  stagger: number;
  startFrame: number;
  shadow: boolean;
  sparkles: boolean;
  seed: number;
  background: string;
};

const ToonCelShape: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = 'toon-cel-shape';
  const f = frame - p.startFrame;
  const tw = twosF(f);
  const items = p.items.length ? p.items : [{icon: 'star', color: TOON.mustard}];
  const n = items.length;
  const gap = Math.min((w * (portrait ? 0.97 : 0.72)) / n, 520 * u);
  const size = Math.min(gap / (portrait ? 2.75 : 3.0), 170 * u);
  const rowY = h * (portrait ? 0.38 : 0.4);
  const transparent = p.background === 'transparent';
  // background planes (mid-century: abstract colour planes, never a room)
  const planeIn = eo(seg(twosF(frame), 0, 12));
  const horizonY = h * (portrait ? 0.55 : 0.66);
  const kidney = toonIconPts('kidney', w * 0.2, h * 0.24, 260 * u, -0.2);
  const boomer = toonIconPts('boomerang', w * 0.84, h * (portrait ? 0.88 : 0.78), 220 * u, 0.4);
  // title
  const titleSize = fitW(p.title, (portrait ? 118 : 132) * u, w * 0.86, 'slab');
  const kickSize = 30 * u;
  const tIn = seg(tw, 44, 56);
  const kIn = seg(tw, 38, 48);
  const titleY = portrait ? h * 0.73 : h * 0.86;
  return (
    <AbsoluteFill style={{background: transparent ? 'transparent' : p.paper, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <ToonDefs id={id} u={u} />
        {!transparent && (
          <g opacity={planeIn}>
            <path d={`M0 0H${w}V${horizonY}H0Z`} fill={p.ground} />
            <ToonShape pts={kidney} frame={frame} u={u} defsId={id} fill={TOON.paperD} line={0} seed={11} tooth={0.25} off={[0, 0]} opacity={0.55} />
            <ToonShape pts={boomer} frame={frame} u={u} defsId={id} fill={TOON.paperDD} line={0} seed={12} tooth={0.25} off={[0, 0]} opacity={0.5} />
            <ToonShape
              pts={[
                [-20 * u, horizonY],
                [w + 20 * u, horizonY],
              ]}
              closed={false}
              frame={frame}
              u={u}
              defsId={id}
              line={3.2}
              lineColor={p.ink}
              breaks={0.35}
              seed={5}
              drawOn={eo(seg(frame, 2, 22))}
            />
          </g>
        )}
        {items.map((it, i) => {
          const s0 = 8 + i * p.stagger;
          const k = back(seg(f, s0, s0 + 8), 1.9);
          if (f < s0) return null;
          const draw = eo(seg(f, s0, s0 + p.drawFrames));
          const x = w / 2 + (i - (n - 1) / 2) * gap;
          const bob = Math.sin(tw * 0.16 + i * 1.7) * 4 * u;
          const rot = Math.sin(tw * 0.09 + i) * 0.05;
          const pts = toonIconPts(it.icon, x, rowY + bob, size * k, rot);
          const burst = starPts(x, rowY, size * 1.32 * k, 16, 0.78, tw * 0.004 + i);
          const lab = it.label ?? '';
          return (
            <g key={i}>
              <ToonShape pts={burst} frame={frame} u={u} defsId={id} fill={TOON.white} line={0} seed={30 + i} tooth={0.2} opacity={0.75} />
              <ToonShape
                pts={pts}
                frame={frame}
                u={u}
                defsId={id}
                fill={it.color}
                line={p.lineWidth}
                lineColor={p.ink}
                breaks={p.breaks}
                wob={p.wob}
                seed={40 + i * 7 + p.seed}
                regK={p.jitter}
                tooth={p.tooth}
                shadow={p.shadow ? 'rgba(80,55,30,0.22)' : null}
                drawOn={draw}
              />
              {lab && (
                <text
                  x={x}
                  y={rowY + size * 1.62}
                  textAnchor="middle"
                  fontFamily={lbf('jost')}
                  fontWeight={600}
                  fontSize={Math.min(24 * u, fitW(lab, 24 * u, gap * 0.9, 'jost', 0.35))}
                  letterSpacing="0.35em"
                  fill={p.ink}
                  opacity={seg(f, s0 + 10, s0 + 16)}
                >
                  {lab.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}
        {p.sparkles &&
          [0, 1, 2, 3].map((i) => {
            const sx = w * (portrait ? [0.14, 0.86, 0.2, 0.8][i] : [0.08, 0.92, 0.3, 0.9][i]);
            const sy = h * (portrait ? [0.25, 0.3, 0.58, 0.56][i] : [0.2, 0.26, 0.1, 0.6][i]);
            const tw2 = Math.floor(frame / 2);
            const sc = (0.75 + 0.35 * hash(tw2, i, 3)) * eo(seg(f, 20 + i * 6, 30 + i * 6));
            const col = [TOON.coral, TOON.white, p.ink, TOON.coral][i];
            return <path key={i} d={pd(sparklePts(sx, sy, 30 * u * sc, 0))} fill={col} />;
          })}
        {p.kicker && (
          <text x={w / 2 + (1 - eo(kIn)) * -60 * u} y={titleY - titleSize * 0.98} textAnchor="middle" fontFamily={lbf('jost')} fontWeight={600} fontSize={kickSize} letterSpacing="0.35em" fill={p.ink} opacity={kIn > 0 ? 1 : 0}>
            {p.kicker.toUpperCase()}
          </text>
        )}
        {p.title && tIn > 0 && (
          <ToonText text={p.title} x={w / 2 + (1 - eo(tIn)) * 120 * u} y={titleY} size={titleSize} frame={frame} u={u} font={lbf('slab')} ink={p.ink} plate={p.plate} anchor="middle" seed={p.seed + 3} regK={p.jitter} />
        )}
      </svg>
    </AbsoluteFill>
  );
};

export const toonCelShape = defineMotion<Props>({
  id: 'toon-cel-shape',
  title: 'Toon cel shapes (mid-century print)',
  category: 'shape',
  description:
    'Mid-century limited-animation card: flat icon fills printed off-register and re-jittering on twos, broken pressure-varying ink lines that write themselves on, dry-brush tooth, a starburst behind each icon and a two-plate slab title.',
  source: ['lemo-opuscar styles/midcentury-toon (MIT code, CC BY 4.0 docs, LemoLab) — engine/toon.js ink/shape/reg/text'],
  useFor: 'Warm 1950s educational-film icons, help-centre / onboarding steps, retro product explainers; the toon look for any icon set.',
  durationInFrames: 150,
  defaultProps: {
    items: [
      {icon: 'bulb', color: TOON.mustard, label: 'Idea'},
      {icon: 'heart', color: TOON.coral, label: 'Care'},
      {icon: 'house', color: TOON.teal, label: 'Home'},
    ],
    kicker: 'Chapter one',
    title: 'Good Ideas',
    paper: TOON.paper,
    ground: '#EBC66C',
    ink: TOON.ink,
    plate: TOON.coral,
    lineWidth: 4.5,
    breaks: 0.18,
    wob: 0.4,
    jitter: 1,
    tooth: 0.35,
    drawFrames: 20,
    stagger: 12,
    startFrame: 0,
    shadow: true,
    sparkles: true,
    seed: 0,
    background: 'paper',
  },
  propDocs: {
    items: 'icons [{icon: star|heart|kidney|boomerang|drop|cloud|house|circle|burst|bulb|leaf|blob, color, label?}]',
    kicker: 'small spaced caps line above the title ("" to hide)',
    title: 'slab title printed in two plates ("" to hide)',
    paper: 'paper colour (floor)',
    ground: 'one ground colour plane behind the icons',
    ink: 'ink line colour',
    plate: 'title colour plate (offset behind the ink text)',
    lineWidth: 'ink width in u (3–5)',
    breaks: 'share of gaps in the ink line 0..0.4',
    wob: 'line width breathing 0..0.8',
    jitter: 'register jitter multiplier (0 = locked register)',
    tooth: 'dry-brush tooth inside fills 0..0.6',
    drawFrames: 'frames for each ink line to write on',
    stagger: 'frames between icons',
    startFrame: 'delay before the first icon',
    shadow: 'flat drop shadow under each icon',
    sparkles: 'four-point atomic sparkles',
    seed: 'variation seed',
    background: '"paper" or "transparent" (overlay: icons + title only)',
  },
  component: ToonCelShape,
  tags: ['toon', 'midcentury', '1950s', 'cel', 'off-register', 'ink line', 'retro', 'icons', 'educational', 'print', 'limited animation', 'on twos', 'overlay'],
});
