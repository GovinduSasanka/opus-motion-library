import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {clamp, onTwos} from '../../core/ease';
import {DeckleFrame, InkSoldier, MiniBot, PaperDoll, mixHex} from '../../core/character-kit';
import {rng} from '../../core/random';
import {PaperTexture, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {BeanStage} from '../../core/r2-e2-char-kit';

/**
 * Massed crowd on a perspective ground plane.
 *  - stomp: video5 crowd-stomp-hop — whole formation hops in sync, 22 f period, snap up / heavy landing,
 *    amplitude falling off with depth, hero excluded.
 *  - cheer: video20 crowd-cheer-bob — arms-up V bobbing at 2.5 Hz with random phases, hearts floating up.
 *  - crane: video12 clone-army-crane-reveal — camera rises ~8x and tilts down (easeInOutCubic, ~2.1 s).
 */
type Props = {
  character: 'boxbot' | 'soldier' | 'doll';
  mode: 'stomp' | 'cheer' | 'beans';
  crane: boolean;
  craneStart: number;
  craneFrames: number;
  rows: number;
  cols: number;
  periodFrames: number;
  amplitude: number;
  depthFalloff: number;
  stompStart: number;
  hearts: boolean;
  heroExcluded: boolean;
  seed: number;
  background: string;
  beans: number;
  bpm: number;
  names: string[];
  hop: number;
  shoutEvery: number;
};

type Person = {X: number; Z: number; row: number; col: number; phase: number; variant: number; hero: boolean};

const BOT_VARIANTS = [
  {body: '#E57016', shade: '#8E4326'},
  {body: '#E57016', shade: '#8E4326'},
  {body: '#E57016', shade: '#8E4326'},
  {body: '#EE7A22', shade: '#9A4A28'},
  {body: '#E57016', shade: '#8E4326'},
  {body: '#E57016', shade: '#8E4326'},
  {body: '#F07C26', shade: '#8E4326'},
  {body: '#E57016', shade: '#8E4326'},
  {body: '#E57016', shade: '#8E4326'},
  {body: '#3FC6D8', shade: '#1E6F86'},
  {body: '#E9E5F2', shade: '#9C93B8'},
  {body: '#F2C230', shade: '#A67A16'},
  {body: '#9A7BE0', shade: '#56408F'},
  {body: '#E57016', shade: '#8E4326'},
];
const DOLL_SHIRTS = ['#E5C88B', '#4FA598', '#D37064', '#5A8AD0', '#E59A9A', '#9070C0', '#7CBF6A'];

// v5 hop profile (frames from takeoff, px at the front row / 16)
const HOP_F = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const HOP_V = [2, 3, 0, -4, -10, -16, -12, -7, -7, -3, 0, 1, 0];

const CrowdBob: React.FC<Props> = ({character, mode, crane, craneStart, craneFrames, rows, cols, periodFrames, amplitude, depthFalloff, stompStart, hearts, heroExcluded, seed, background}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const cf = character === 'boxbot' ? onTwos(frame) : frame;
  const R = Math.max(2, Math.round(rows));
  const C = Math.max(3, Math.round(cols));
  const sx = 1.35;
  const sz = 1.45;

  const people = React.useMemo(() => {
    const r = rng(seed);
    const out: Person[] = [];
    for (let row = 0; row < R; row++) {
      for (let col = 0; col < C; col++) {
        const X = (col - (C - 1) / 2) * sx + (row % 2 ? sx / 2 : 0) + (r() - 0.5) * 0.25;
        const Z = row * sz + (r() - 0.5) * 0.3;
        const hero = row === 0 && col === Math.floor(C / 2);
        out.push({X: hero ? 0 : X, Z: hero ? -0.6 : Z, row, col, phase: r() * Math.PI * 2, variant: Math.floor(r() * 1000), hero});
      }
    }
    return out;
  }, [R, C, seed]);

  // camera crane
  const cq = crane ? interpolate(frame, [craneStart, craneStart + craneFrames], [0, 1], {easing: Easing.bezier(0.65, 0, 0.35, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  const camY = interpolate(cq, [0, 1], [0.95, portrait ? 8 : 6.8]);
  const camZ = interpolate(cq, [0, 1], [-2.6, portrait ? -4 : -7.5]);
  const pitch = (interpolate(cq, [0, 1], [3, portrait ? 34 : 22]) * Math.PI) / 180;
  const drift = frame * 0.004;
  const F = Math.min(w, h) * (portrait ? 1.25 : 1.15);
  const cx = w / 2;
  const cy = h * 0.5;
  const sp = Math.sin(pitch);
  const cp = Math.cos(pitch);
  const project = (X: number, Y: number, Z: number) => {
    const dy = Y - camY;
    const dz = Z - (camZ - drift);
    const zc = -dy * sp + dz * cp;
    const yc = dy * cp + dz * sp;
    return {x: cx + (F * X) / zc, y: cy - (F * yc) / zc, k: F / zc, zc};
  };
  const horizonY = cy - F * Math.tan(pitch);

  // ------------------------------------------------ theme
  const theme = character === 'boxbot' ? 'cyber' : character === 'soldier' ? 'ink' : 'paper';
  const bg = background || (theme === 'cyber' ? '#270778' : theme === 'ink' ? '#C5CCDF' : '#DFD6C5');

  const sky = (() => {
    if (theme === 'cyber') {
      return (
        <g>
          <defs>
            <linearGradient id="cb-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4A0790" />
              <stop offset="75%" stopColor="#880A99" />
              <stop offset="100%" stopColor="#E22289" />
            </linearGradient>
          </defs>
          <rect x={0} y={Math.min(0, horizonY - h)} width={w} height={Math.max(0, horizonY - Math.min(0, horizonY - h))} fill="url(#cb-sky)" />
          <rect x={0} y={horizonY - 4 * u} width={w} height={8 * u} fill="#FF5CB0" />
        </g>
      );
    }
    if (theme === 'ink') {
      const ridge = Array.from({length: 33}, (_, i) => {
        const x = (i / 32) * w;
        const r = rng(i * 3 + 7);
        return `L ${x.toFixed(1)} ${(horizonY - (20 + 70 * Math.abs(Math.sin(i * 0.7)) * (0.6 + 0.4 * r())) * u).toFixed(1)}`;
      }).join(' ');
      return (
        <g>
          <defs>
            <linearGradient id="cb-isky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BBC2D9" />
              <stop offset="100%" stopColor="#D2D7E8" />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={w} height={Math.max(0, horizonY)} fill="url(#cb-isky)" />
          <path d={`M 0 ${horizonY} ${ridge} L ${w} ${horizonY} Z`} fill="#8C94BC" opacity={0.7} />
        </g>
      );
    }
    return <line x1={0} y1={horizonY} x2={w} y2={horizonY} stroke="#2E2A26" strokeWidth={1.5 * u} opacity={0.6} />;
  })();

  const ground = (() => {
    const g = theme === 'cyber' ? '#270778' : theme === 'ink' ? '#E3E6F1' : '#D6C8AF';
    const lines: React.ReactNode[] = [];
    if (theme === 'cyber') {
      for (let i = -14; i <= 14; i++) {
        const X = i * sx;
        const a = project(X, 0, camZ - drift + 0.6);
        const b = project(X, 0, 120);
        lines.push(<line key={`x${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#37C5D7" strokeWidth={1.4 * u} opacity={0.55} />);
      }
      for (let j = -2; j < 60; j++) {
        const Z = j * sz - 0.6;
        if (Z < camZ - drift + 0.6) continue;
        const a = project(-40, 0, Z);
        const b = project(40, 0, Z);
        lines.push(<line key={`z${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#37C5D7" strokeWidth={Math.max(0.6, 2.2 * u * clamp(a.k / (F * 0.3)))} opacity={0.55} />);
      }
    } else {
      const r = rng(5);
      for (let j = 0; j < 70; j++) {
        const X = (r() - 0.5) * 40;
        const Z = camZ - drift + 1 + r() * 40;
        const p = project(X, 0, Z);
        const len = p.k * (0.4 + r() * 0.8);
        lines.push(<line key={j} x1={p.x - len} y1={p.y} x2={p.x + len} y2={p.y + len * 0.05} stroke={theme === 'ink' ? '#6A74A2' : '#2E2A26'} strokeWidth={Math.max(0.6, p.k * 0.02)} opacity={0.35} />);
      }
    }
    return (
      <g>
        <rect x={0} y={horizonY} width={w} height={Math.max(0, h - horizonY)} fill={g} />
        {lines}
      </g>
    );
  })();

  // ------------------------------------------------ per-person motion
  const P = Math.max(8, periodFrames);
  const stompY = (p: Person) => {
    if (mode !== 'stomp' || (p.hero && heroExcluded) || cf < stompStart) return {dy: 0, air: 0};
    const ph = (cf - stompStart) % P;
    const v = interpolate(ph, HOP_F, HOP_V, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const fall = Math.pow(clamp(1 - p.row / (R * 0.9)), depthFalloff);
    return {dy: (-v / 16) * amplitude * fall, air: clamp(-v / 10)};
  };
  const cheer = (p: Person) => {
    if (mode !== 'cheer') return {bob: 0, arm: 0};
    const t = frame / 30;
    const s = Math.sin(2 * Math.PI * 2.5 * t + p.phase);
    return {bob: (0.5 + 0.5 * s) * 0.06, arm: 15 * s};
  };

  const visible = people
    .map((p) => ({p, pr: project(p.X, 0, p.Z)}))
    .filter(({pr}) => pr.zc > 0.4 && pr.k > 2.5 && pr.x > -pr.k * 2 && pr.x < w + pr.k * 2 && pr.y > -pr.k * 0.5 && pr.y < h + pr.k * 2.2)
    .sort((a, b) => b.pr.zc - a.pr.zc);

  const heartsEls: React.ReactNode[] = [];
  const drawn = visible.map(({p, pr}) => {
    const st = stompY(p);
    const ch = cheer(p);
    const lift = st.dy + ch.bob;
    const base = project(p.X, lift, p.Z);
    const k = pr.k;
    const elev = Math.atan2(camY - 0.5, Math.max(0.1, p.Z - camZ));
    const key = `${p.row}-${p.col}`;
    if (character === 'boxbot') {
      const v = BOT_VARIANTS[p.variant % BOT_VARIANTS.length];
      const vv = p.hero ? {body: '#E57016', shade: '#8E4326'} : v;
      const blink = (frame + p.variant) % 97 < 3;
      const arms = mode === 'cheer' ? 120 + ch.arm : 15 + 70 * st.air;
      return (
        <g key={key}>
          <ellipse cx={pr.x} cy={pr.y} rx={k * 0.5 * (1 - 0.3 * st.air)} ry={k * 0.12} fill="#0A0230" opacity={0.45} />
          <MiniBot x={base.x} y={base.y} size={k * 0.85} body={vv.body} shade={vv.shade} eye="#16081C" arms={arms} blink={blink || st.air > 0.6} outline={k > 14} topK={clamp(Math.sin(elev) * 0.9, 0.08, 0.6)} />
        </g>
      );
    }
    if (character === 'soldier') {
      return (
        <g key={key}>
          <ellipse cx={pr.x} cy={pr.y} rx={k * 0.4} ry={k * 0.08} fill="#2D3A6F" opacity={0.25} />
          <InkSoldier x={base.x} y={base.y} h={k * 1.05} detail={k > 30} />
        </g>
      );
    }
    const shirt = DOLL_SHIRTS[p.variant % DOLL_SHIRTS.length];
    if (mode === 'cheer' && hearts) {
      // hearts from a random subset every 9 f
      const slot = Math.floor(frame / 9);
      for (let s = slot - 3; s <= slot; s++) {
        if (s < 0) continue;
        const rr = rng(s * 131 + p.variant);
        if (rr() > 0.06) continue;
        const ht = frame - s * 9 + rr() * 3;
        if (ht < 0 || ht > 30) continue;
        const hp = project(p.X, 1.25 + ht * 0.03, p.Z);
        const hs = k * 0.22;
        heartsEls.push(
          <path
            key={`h${key}-${s}`}
            d={`M 0 ${hs * 0.35} C ${-hs} ${-hs * 0.25}, ${-hs * 0.5} ${-hs * 0.98}, 0 ${-hs * 0.45} C ${hs * 0.5} ${-hs * 0.98}, ${hs} ${-hs * 0.25}, 0 ${hs * 0.35} Z`}
            fill="#E38C76"
            stroke="#C0403E"
            strokeWidth={Math.max(0.8, hs * 0.1)}
            transform={`translate(${hp.x},${hp.y}) rotate(${(rr() - 0.5) * 20})`}
            opacity={clamp(ht / 3) * clamp((30 - ht) / 10)}
          />,
        );
      }
    }
    return (
      <g key={key}>
        <ellipse cx={pr.x} cy={pr.y} rx={k * 0.3} ry={k * 0.07} fill="#2E2A26" opacity={0.2} />
        <PaperDoll
          x={base.x}
          y={base.y}
          h={k}
          shirt={shirt}
          pants={p.variant % 3 ? '#626D79' : '#8A7A6A'}
          skin={p.variant % 4 === 1 ? '#B88A66' : '#DBC1A4'}
          hair={['#685B54', '#2E2A26', '#A0703A', '#C9A27A'][p.variant % 4]}
          arm={mode === 'cheer' ? 145 + ch.arm : 15 + 140 * st.air}
        />
      </g>
    );
  });

  // cheer hearts for bots/soldiers too
  if (mode === 'cheer' && hearts && character !== 'doll') {
    visible.forEach(({p}) => {
      const slot = Math.floor(frame / 9);
      for (let s = slot - 3; s <= slot; s++) {
        if (s < 0) continue;
        const rr = rng(s * 131 + p.variant);
        if (rr() > 0.05) continue;
        const ht = frame - s * 9;
        if (ht > 30) continue;
        const hp = project(p.X, 1.3 + ht * 0.03, p.Z);
        const hs = hp.k * 0.22;
        heartsEls.push(
          <path
            key={`h${p.row}-${p.col}-${s}`}
            d={`M 0 ${hs * 0.35} C ${-hs} ${-hs * 0.25}, ${-hs * 0.5} ${-hs * 0.98}, 0 ${-hs * 0.45} C ${hs * 0.5} ${-hs * 0.98}, ${hs} ${-hs * 0.25}, 0 ${hs * 0.35} Z`}
            fill={character === 'boxbot' ? '#FF3C8A' : '#6A74A2'}
            stroke={character === 'boxbot' ? '#FFFFFF' : '#2D3A6F'}
            strokeWidth={Math.max(0.8, hs * 0.1)}
            transform={`translate(${hp.x},${hp.y}) rotate(${(rr() - 0.5) * 20})`}
            opacity={clamp(ht / 3) * clamp((30 - ht) / 10)}
          />,
        );
      }
    });
  }

  // floating comic dots (v12 confetti dot variant) for the cyber theme
  const dots =
    theme === 'cyber'
      ? Array.from({length: 26}, (_, i) => {
          const r = rng(i * 17 + 1);
          const x = ((r() * w + frame * (0.3 + r()) * u) % (w + 40 * u)) - 20 * u;
          const y = (r() * h * 0.9 - frame * (0.6 + r() * 0.8) * u + h * 2) % h;
          return <circle key={i} cx={x} cy={y} r={(3 + r() * 5) * u} fill={['#1DD1D9', '#FA3D8C', '#16081C'][i % 3]} opacity={0.8} />;
        })
      : null;

  return (
    <AbsoluteFill style={{background: bg}}>
      {theme === 'paper' && <PaperTexture opacity={0.45} />}
      <Svg>
        {sky}
        {ground}
        {drawn}
        {heartsEls}
        {dots}
        {theme === 'ink' && (
          <g>
            <defs>
              <pattern id="cb-hatch" patternUnits="userSpaceOnUse" width={5 * u} height={5 * u} patternTransform="rotate(45)">
                <line x1={0} y1={0} x2={0} y2={5 * u} stroke="#2D3A6F" strokeWidth={0.8 * u} opacity={0.12} />
              </pattern>
            </defs>
            <rect width={w} height={h} fill="url(#cb-hatch)" />
          </g>
        )}
        {theme === 'cyber' && (
          <g>
            <defs>
              <pattern id="cb-ht" patternUnits="userSpaceOnUse" width={6 * u} height={6 * u} patternTransform="rotate(45)">
                <circle cx={3 * u} cy={3 * u} r={1.1 * u} fill="#16081C" opacity={0.18} />
              </pattern>
              <radialGradient id="cb-vig" cx="50%" cy="50%" r="72%">
                <stop offset="55%" stopColor="#000" stopOpacity={0} />
                <stop offset="100%" stopColor="#10002A" stopOpacity={0.55} />
              </radialGradient>
            </defs>
            <rect width={w} height={h} fill="url(#cb-ht)" />
            <rect width={w} height={h} fill="url(#cb-vig)" />
          </g>
        )}
        {theme === 'paper' && <DeckleFrame id="cb-deckle" w={w} h={h} u={u} margin={mixHex('#E3DAC9', '#FFFFFF', 0.1)} />}
      </Svg>
    </AbsoluteFill>
  );
};

const CrowdRoot: React.FC<Props> = (p) =>
  p.mode === 'beans' ? <BeanStage count={p.beans} bpm={p.bpm} startAt={p.stompStart === 30 ? 12 : p.stompStart} names={p.names} background={p.background} hop={p.hop} shoutEvery={p.shoutEvery} seed={p.seed} /> : <CrowdBob {...p} />;

export const crowdBob = defineMotion<Props>({
  id: 'crowd-bob',
  title: 'Crowd stomp / cheer',
  category: 'character',
  description: 'A massed perspective crowd of box-bots, ink-etched soldiers or paper dolls; the camera cranes up to reveal its size while everyone stomp-hops in sync (or cheer-bobs with hearts).',
  source: ['video5 crowd-stomp-hop (0:02.6-0:10)', 'video20 crowd-cheer-bob (3:22-3:25)', 'video12 clone-army-crane-reveal (0:36.5-0:38.6)'],
  useFor: 'Scale beats (“thousands of users / sessions / agents”), community and celebration moments, armies of AI.',
  durationInFrames: 180,
  defaultProps: {
    character: 'boxbot',
    mode: 'stomp',
    crane: true,
    craneStart: 14,
    craneFrames: 66,
    rows: 30,
    cols: 27,
    periodFrames: 22,
    amplitude: 0.45,
    depthFalloff: 1.4,
    stompStart: 30,
    hearts: true,
    heroExcluded: true,
    seed: 7,
    background: '',
    beans: 10,
    bpm: 120,
    names: [] as string[],
    hop: 1,
    shoutEvery: 4,
  },
  propDocs: {
    character: "'boxbot' (v12 synthwave clones) | 'soldier' (v5 blue ink etching) | 'doll' (v20 paper sketch)",
    mode: "'stomp' synchronised hop (v5) | 'cheer' random-phase arms-up bob with hearts (v20) | 'beans' (toy bean contestants drop from the sky one per half-beat, hop on the beat, shout on accents)",
    beans: 'beans: number of contestants (2-24)',
    bpm: 'beans: tempo for the drops and hops',
    names: 'beans: name-tag texts in order ([] = built-in names)',
    hop: 'beans: hop height multiplier',
    shoutEvery: 'beans: every Nth beat is an accent where all beans shout (0 = never)',
    crane: 'camera cranes up and tilts down to reveal the crowd',
    craneFrames: 'length of the crane move (easeInOutCubic)',
    rows: 'rows in the formation',
    cols: 'columns in the formation',
    periodFrames: 'stomp period (v5: 22 f = 80 BPM)',
    amplitude: 'hop height in character heights at the front row',
    depthFalloff: 'exponent of the amplitude falloff toward the back rows',
    stompStart: 'frame of the first stomp',
    hearts: 'float hearts in cheer mode',
    heroExcluded: 'front-centre hero stays still (v5)',
  },
  component: CrowdRoot,
  tags: ['crowd', 'army', 'clones', 'cheer', 'stomp', 'crane', 'beans', 'contestants', 'game show', 'team intro', 'everyone joins', 'name tags'],
});
