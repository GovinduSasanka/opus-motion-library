import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {AGENTS, ARMY_CENTERS, Faction, PaintedField, UnitSprite, armyBlock, h01, iso2, mixHex, shadeHex} from '../../core/r2-x58-kit';

/**
 * x6 data-view-flash: on the beat (every 0.6–0.67 s ≈ 92 BPM) the shot cuts for 1–5 frames to its "data" version —
 * the same army rendered as flat glyphs in one faction colour on near-black luminance noise, sometimes with a
 * ±8 px RGB-split frame — then cuts straight back. The default demo alternates faction close-ups of a painterly
 * battle (camera pushes per shot) and hides every faction change inside a flash, exactly like the source.
 */
type Props = {
  bpm: number;
  flashFrames: number[];
  rgbSplit: boolean;
  background: string;
  factions: Faction[];
  unitsPerArmy: number;
  push: number;
  seed: number;
};

const DataViewFlash: React.FC<Props> = ({bpm, flashFrames, rgbSplit, background, factions, unitsPerArmy, push, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const beatLen = (fps * 60) / Math.max(30, bpm);
  const beat = Math.floor(frame / beatLen);
  const inBeat = frame - beat * beatLen;
  const flashLen = flashFrames[beat % flashFrames.length];
  const flashing = inBeat < flashLen && beat > 0;
  const splitFrame = rgbSplit && flashing && inBeat === 1;
  const fs = factions.slice(0, 4);
  // shot = which faction we are close on; changes on flashes (every 4 beats)
  const shot = Math.floor(beat / 4) % fs.length;
  const f = fs[shot];
  const k = (portrait ? w * 0.115 : w * 0.062) * (1 + (push / 100) * (t % ((beatLen * 4) / fps)));
  const [cgx, cgy] = ARMY_CENTERS[shot % 4];
  const ox = w / 2 - iso2(cgx, cgy, 0, k, 0, 0)[0];
  const oy = h * 0.55 - iso2(cgx, cgy, 0, k, 0, 0)[1];
  const units = armyBlock(seed * 13 + shot, unitsPerArmy, 12);
  const col = f.chip === '#141227' ? '#8D8AB8' : f.chip;
  const unitNodes = (data: boolean, dx = 0) =>
    units.map((un, ui) => {
      const bob = Math.sin(t * Math.PI * 2 * 1.5 + un.ph) * 1.2 * u;
      const [sx, sy] = iso2(cgx + un.gx, cgy + un.gy, 0, k, ox, oy);
      if (data) {
        const r = k * (0.09 + 0.05 * h01(ui, shot, 3));
        if (un.type === 1) return <path key={ui} d={`M${sx + dx} ${sy - r * 1.3} L${sx + dx + r} ${sy + r} L${sx + dx - r} ${sy + r}Z`} fill={col} opacity={0.85} />;
        if (un.type === 2) return <rect key={ui} x={sx + dx - r} y={sy - r} width={r * 2} height={r * 2} transform={`rotate(45 ${sx + dx} ${sy})`} fill={col} opacity={0.85} />;
        return <circle key={ui} cx={sx + dx} cy={sy} r={r} fill={col} opacity={0.85} />;
      }
      const hh = k * 0.4;
      return (
        <g key={ui} transform={`translate(${sx} ${sy + bob})`}>
          <ellipse rx={hh * 0.35} ry={hh * 0.12} fill="#0E1A12" opacity={0.35} />
          <UnitSprite x={0} y={0} hh={hh} type={un.type} color={f.unit} dark={shadeHex(f.unit, -0.45)} />
        </g>
      );
    });
  return (
    <AbsoluteFill style={{background: flashing ? background : '#1C2928', overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        {flashing ? (
          <g>
            <filter id={`dvf-n-${seed}`}>
              <feTurbulence type="fractalNoise" baseFrequency={0.8} numOctaves={2} seed={seed + beat} />
              <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.06 0" />
            </filter>
            <rect width={w} height={h} filter={`url(#dvf-n-${seed})`} />
            {splitFrame ? (
              <>
                <g style={{mixBlendMode: 'screen'}} opacity={0.8}>
                  <g fill="#FF2A3C">{unitNodes(true, -8 * u)}</g>
                </g>
                <g style={{mixBlendMode: 'screen'}} opacity={0.8}>
                  <g fill="#2AC4FF">{unitNodes(true, 8 * u)}</g>
                </g>
              </>
            ) : null}
            {unitNodes(true)}
          </g>
        ) : (
          <g>
            <PaintedField id={`dvf-${seed}`} w={w * 2.4} h={h * 2.4} u={u * 2.2} seed={seed} frame={frame} grass={mixHex('#7FA35A', f.color, 0.08)} />
            {unitNodes(false)}
          </g>
        )}
      </svg>
      <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.4) 100%)'}} />
    </AbsoluteFill>
  );
};

export const dataViewFlash = defineMotion<Props>({
  id: 'data-view-flash',
  title: 'Data view flash',
  category: 'fx',
  description:
    'Beat-synced 1–5-frame "data" flashes: the painterly army close-up cuts to the same units as flat glyphs on near-black noise (with an occasional RGB-split frame) and straight back, hiding each faction change inside a flash.',
  source: ['video x6 13.8-26.4 s (12 flashes at ≈ 92 BPM, 1-5 frames each)'],
  useFor: 'Rhythmic "under the hood / what the AI sees" accents; hiding hard cuts on music beats.',
  durationInFrames: 160,
  defaultProps: {
    bpm: 92,
    flashFrames: [2, 1, 3, 1, 5, 1, 2, 1],
    rgbSplit: true,
    background: '#0C0C10',
    factions: AGENTS,
    unitsPerArmy: 84,
    push: 3.5,
    seed: 6,
  },
  propDocs: {
    bpm: 'flash tempo (one flash per beat)',
    flashFrames: 'flash lengths in frames, cycled per beat (1–5)',
    rgbSplit: 'add a ±8 px red/blue split on the second flash frame',
    background: 'data-view background',
    factions: 'armies to cut between (shot changes every 4 beats, hidden in a flash)',
    unitsPerArmy: 'units per close-up',
    push: 'camera push during each 4-beat shot in %/s',
    seed: 'layout seed (match army-formation / tactical-map)',
  },
  component: DataViewFlash,
  tags: ['flash', 'beat', 'glitch', 'data view', 'glyphs', 'cut', 'rhythm', 'music', 'rgb split', 'simulation', 'strategy', 'game', 'edit'],
});
