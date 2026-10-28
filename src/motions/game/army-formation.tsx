import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {AGENTS, ARMY_CENTERS, Brackets, Emblem, Faction, KLEIN, PaintedField, UnitSprite, armyBlock, easeOutBack, easeOutCubic, iso2, lin, mixHex, shadeHex, x58Fonts} from '../../core/r2-x58-kit';

/**
 * x6 army-formation: a painterly isometric valley with four blocks of tiny unit sprites (infantry blocks, cloaked
 * archer cones, cavalry) at the top, right, bottom and left, each grouped around a tall banner shield with an
 * abstract faction emblem. Spawn: units pop in as white placeholders, then flood with the faction colour
 * (0.5 s cross-fade, 0.1 s stagger per block); units bob ±1 px at 1.5 Hz; blocks march slowly inwards with per-row
 * lag; volleys of white chevron arrows arc between blocks (0.75 s flights). A selection ring with a leader label
 * circles one army, and an "initialised" title in red corner brackets reveals centre-out. Slow camera push.
 */
type Props = {
  factions: Faction[];
  unitsPerArmy: number;
  spawnAt: number;
  march: number;
  volleys: boolean;
  select: number;
  selectLabel: string;
  title: string;
  subtitle: string;
  titleAt: number;
  push: number;
  grass: string;
  seed: number;
};

const ArmyFormation: React.FC<Props> = ({factions, unitsPerArmy, spawnAt, march, volleys, select, selectLabel, title, subtitle, titleAt, push, grass, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const k = portrait ? w * 0.05 : w * 0.032;
  const ox = w / 2;
  const oy = h * (portrait ? 0.5 : 0.48);
  const hh = k * 0.36;
  const fs = factions.slice(0, 4);
  type Item = {d: number; node: React.ReactNode};
  const items: Item[] = [];
  const blockPos = (fi: number) => {
    const [cx, cy] = ARMY_CENTERS[fi % 4];
    const len = Math.hypot(cx, cy);
    const adv = Math.min(1.6, march * Math.max(0, t - 1.5));
    return {gx: cx - (cx / len) * adv, gy: cy - (cy / len) * adv};
  };
  fs.forEach((f, fi) => {
    const units = armyBlock(seed * 13 + fi, unitsPerArmy, 12);
    const bp = blockPos(fi);
    const colorK = easeOutCubic(lin(frame, spawnAt + 15 + fi * 3, spawnAt + 30 + fi * 3));
    const unitCol = mixHex('#F4F4F2', f.unit, colorK);
    const dark = mixHex('#C9C9C6', shadeHex(f.unit, -0.45), colorK);
    units.forEach((un, ui) => {
      const pop = easeOutBack(lin(frame, spawnAt + un.row * 1.2 + fi * 2, spawnAt + un.row * 1.2 + fi * 2 + 6), 1.4);
      if (pop <= 0) return;
      const lag = un.row * 0.08;
      const [sx, sy] = iso2(bp.gx + un.gx, bp.gy + un.gy - lag * march * 0.2, 0, k, ox, oy);
      const bob = Math.sin(t * Math.PI * 2 * 1.5 + un.ph) * 1 * u;
      items.push({
        d: bp.gx + un.gx + bp.gy + un.gy,
        node: (
          <g key={`u${fi}-${ui}`} transform={`translate(${sx} ${sy + bob}) scale(${pop})`}>
            <ellipse cx={0} cy={0} rx={hh * 0.35} ry={hh * 0.12} fill="#0E1A12" opacity={0.35} />
            <UnitSprite x={0} y={0} hh={hh} type={un.type} color={unitCol} dark={dark} />
          </g>
        ),
      });
    });
    // banner
    const [bx, by] = iso2(bp.gx - 0.2, bp.gy - 0.6, 0, k, ox, oy);
    const bannerK = easeOutBack(lin(frame, spawnAt + 10 + fi * 3, spawnAt + 22 + fi * 3), 1.3);
    if (bannerK > 0) {
      const bw = k * 0.9;
      const bh = k * 1.55;
      const tilt = Math.sin(t * 1.3 + fi) * 2 - 4;
      items.push({
        d: bp.gx + bp.gy - 0.8,
        node: (
          <g key={`b${fi}`} transform={`translate(${bx} ${by}) rotate(${tilt}) scale(${bannerK})`}>
            <line x1={0} y1={0} x2={0} y2={-bh * 1.5} stroke="#3A332C" strokeWidth={2.5 * u} />
            <path d={`M${-bw / 2} ${-bh * 1.5} H${bw / 2} V${-bh * 0.75} L0 ${-bh * 0.45} L${-bw / 2} ${-bh * 0.75}Z`} fill={mixHex('#FFFFFF', f.color, 0.35)} stroke="#fff" strokeWidth={1.5 * u} opacity={0.95} />
            <g transform={`translate(0 ${-bh * 1.08})`}>
              <Emblem kind={f.glyph} r={bw * 0.28} color={shadeHex(f.color, -0.45)} sw={2 * u} />
            </g>
          </g>
        ),
      });
    }
  });
  items.sort((a, b) => a.d - b.d);
  // volleys: chevrons arcing between neighbouring blocks
  const arrows: React.ReactNode[] = [];
  if (volleys && fs.length > 1) {
    const period = 36;
    const startV = spawnAt + 45;
    for (let v = 0; v < 8; v++) {
      const vs = startV + v * period * 0.5;
      const a = v % fs.length;
      const b = (a + 1 + (v % 2)) % fs.length;
      if (b === a) continue;
      const A = blockPos(a);
      const B = blockPos(b);
      for (let i = 0; i < 12; i++) {
        const st = vs + i * 0.6;
        const p = lin(frame, st, st + 0.75 * fps);
        if (p <= 0 || p >= 1) continue;
        const jx = ((i * 37) % 11) / 11 - 0.5;
        const jy = ((i * 53) % 7) / 7 - 0.5;
        const gx = A.gx + jx + (B.gx - A.gx) * p;
        const gy = A.gy + jy + (B.gy - A.gy) * p;
        const z = Math.sin(Math.PI * p) * 3.2;
        const [x, y] = iso2(gx, gy, z, k, ox, oy);
        const [x2, y2] = iso2(A.gx + jx + (B.gx - A.gx) * (p + 0.02), A.gy + jy + (B.gy - A.gy) * (p + 0.02), Math.sin(Math.PI * (p + 0.02)) * 3.2, k, ox, oy);
        const ang = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
        arrows.push(
          <g key={`a${v}-${i}`} transform={`translate(${x} ${y}) rotate(${ang})`} opacity={0.9}>
            <path d={`M${-7 * u} ${-4 * u} L0 0 L${-7 * u} ${4 * u} M${-12 * u} ${-4 * u} L${-5 * u} 0 L${-12 * u} ${4 * u}`} stroke="#fff" strokeWidth={1.6 * u} fill="none" />
          </g>,
        );
      }
    }
  }
  // selection ring
  const sel = select >= 0 && select < fs.length ? select : -1;
  const ringK = sel >= 0 ? easeOutCubic(lin(frame, spawnAt + 32, spawnAt + 44)) : 0;
  const push1 = 1 + (push / 100) * t;
  const titleK = title ? lin(frame, titleAt, titleAt + 10) : 0;
  const titleOut = title ? 1 - lin(frame, titleAt + 60, titleAt + 70) : 0;
  const tfs = (portrait ? 64 : 58) * u;
  return (
    <AbsoluteFill style={{background: '#1C2928', overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${w / 2} ${h / 2}) scale(${push1}) translate(${-w / 2} ${-h / 2})`}>
          <PaintedField id={`af-${seed}`} w={w} h={h} u={u} seed={seed} frame={frame} grass={grass} />
          {sel >= 0 && ringK > 0
            ? (() => {
                const bp = blockPos(sel);
                const [rx, ry] = iso2(bp.gx, bp.gy, 0, k, ox, oy);
                const R = k * 3.6 * (0.8 + 0.2 * ringK);
                return (
                  <g opacity={ringK * 0.8}>
                    <ellipse cx={rx} cy={ry} rx={R} ry={R * 0.5} fill="none" stroke="#BFE6F0" strokeWidth={1.5 * u} />
                    {Array.from({length: 24}, (_, i) => {
                      const a = (i / 24) * Math.PI * 2 + t * 0.4;
                      return <line key={i} x1={rx + Math.cos(a) * R} y1={ry + Math.sin(a) * R * 0.5} x2={rx + Math.cos(a) * R * 1.05} y2={ry + Math.sin(a) * R * 0.525} stroke="#BFE6F0" strokeWidth={1.2 * u} />;
                    })}
                  </g>
                );
              })()
            : null}
          {items.map((it) => it.node)}
          {arrows}
          {sel >= 0 && ringK > 0
            ? (() => {
                const bp = blockPos(sel);
                const [rx, ry] = iso2(bp.gx, bp.gy, 0, k, ox, oy);
                const lx = rx + (rx > w / 2 ? -1 : 1) * k * 0.5;
                const ly = ry - k * 1.6;
                const lw = k * 3.4;
                return (
                  <g opacity={ringK}>
                    <line x1={rx} y1={ry - k * 0.6} x2={lx} y2={ly} stroke="#fff" strokeWidth={1.2 * u} />
                    <rect x={lx} y={ly - 14 * u} width={lw * ringK} height={2 * u} fill="#fff" />
                    <text x={lx} y={ly - 20 * u} fontFamily={x58Fonts.mono} fontSize={12 * u} fill="#fff" letterSpacing={1 * u}>
                      {selectLabel}
                    </text>
                    <text x={lx + lw * 0.78} y={ly - 20 * u} fontFamily={x58Fonts.mono} fontSize={10 * u} fill="#BFE6F0">
                      IDLE
                    </text>
                  </g>
                );
              })()
            : null}
        </g>
        {title && titleK > 0 && titleOut > 0
          ? (() => {
              const bw = Math.min(w * 0.8, tfs * Math.max(title.length, subtitle.length * 0.55) * 0.62 + 80 * u);
              const bh = tfs * 2.4;
              const bx = w / 2 - bw / 2;
              const by = h / 2 - bh / 2;
              const m = easeOutCubic(titleK);
              return (
                <g opacity={titleOut}>
                  <Brackets x={bx} y={by} w={bw} h={bh} len={18 * u} color={KLEIN.red} sw={2 * u} />
                  <clipPath id={`af-clip-${seed}`}>
                    <rect x={w / 2 - (bw / 2) * m} y={by} width={bw * m} height={bh} />
                  </clipPath>
                  <g clipPath={`url(#af-clip-${seed})`}>
                    <text x={w / 2} y={by + tfs * 1.15} textAnchor="middle" fontFamily={x58Fonts.rajdhani} fontWeight={500} fontSize={tfs} fill="#fff" style={{textShadow: '0 0 12px rgba(0,0,0,0.5)'}}>
                      {title}
                    </text>
                    <text x={w / 2} y={by + tfs * 2.05} textAnchor="middle" fontFamily={x58Fonts.rajdhani} fontWeight={500} fontSize={tfs * 0.5} fill="#fff" letterSpacing={tfs * 0.04}>
                      {subtitle}
                    </text>
                  </g>
                </g>
              );
            })()
          : null}
      </svg>
      <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
    </AbsoluteFill>
  );
};

export const armyFormation = defineMotion<Props>({
  id: 'army-formation',
  title: 'Army formation',
  category: 'game',
  description:
    'A painterly isometric battlefield with four faction armies of tiny unit sprites around banner shields: they spawn as white placeholders, flood with faction colour, bob, march inwards and trade arcing arrow volleys, with a selection ring on one army and a centre-out "initialised" title in red brackets.',
  source: ['video x6 9.3-13.8 s (spawn, colour flood, selection ring, title)', 'video x6 13.8-46.9 s (marching armies, volleys)'],
  useFor: '"AI models / teams / products compete" stories, strategy explainers, market-share battles, game trailers.',
  durationInFrames: 180,
  defaultProps: {
    factions: AGENTS,
    unitsPerArmy: 96,
    spawnAt: 8,
    march: 0.25,
    volleys: true,
    select: 1,
    selectLabel: 'ATLAS BASTION',
    title: 'SIMULATION ONLINE',
    subtitle: 'BATTLE BEGIN   CONQUER',
    titleAt: 66,
    push: 2,
    grass: '#7FA35A',
    seed: 6,
  },
  propDocs: {
    factions: 'up to 4 armies {name, color, unit, chip, glyph}: unit = sprite colour, color = banner tint, glyph = star | ring | diamond | bolt',
    unitsPerArmy: 'units per army block (rows of 12)',
    spawnAt: 'frame the units pop in as white placeholders (colour floods ~15 frames later)',
    march: 'ground units per second the blocks advance towards the centre',
    volleys: 'arcing arrow volleys between armies',
    select: 'index of the army that gets the selection ring (-1 = none)',
    selectLabel: 'label on the selection leader line',
    title: 'centre title in red corner brackets ("" = none)',
    subtitle: 'second line under the title',
    titleAt: 'frame the title reveals centre-out (holds ~2 s)',
    push: 'camera push-in in %/s',
    grass: 'plateau grass colour',
    seed: 'layout seed',
  },
  component: ArmyFormation,
  tags: ['army', 'battle', 'strategy', 'isometric', 'rts', 'game', 'factions', 'units', 'spawn', 'march', 'arrows', 'volley', 'ai agents', 'competition', 'map', 'painterly', 'simulation'],
});
