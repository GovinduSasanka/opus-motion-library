import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BlurFilter, CloudPuff, TAU, areaK, hash01, isTransparent, mixHex, ridgePath, wrap} from '../../core/environment-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Falling petals / leaves / papers (video6 petal-fall-particles, video14 falling-papers).
 * petals: pink & white petals drift down 40-80 px/s, sway sideways in a sine (20 px, 1.2 s),
 *   spin 90-180°/s and flip in 3D (scaleX = cos φ, back side shaded), 3 depth layers.
 * leaves: same physics with autumn leaves.
 * papers: cream sheets fall 60-100 px/s, rotateZ oscillates ±25° (1.5 s), scaleX flip fakes tumble.
 */
type Props = {
  mode: 'petals' | 'leaves' | 'papers';
  background: string;
  backdrop: boolean;
  colors: string[];
  count: number;
  speed: number;
  sway: number;
  size: number;
  wind: number;
  branch: boolean;
  seed: number;
};

const PALETTES = {
  petals: ['#F4B9CB', '#FFFFFF', '#F7CAD8', '#F2A9C0'],
  leaves: ['#D9733F', '#E8A33D', '#B5502E', '#C9A23A', '#9E3B22'],
  papers: ['#F3ECDD', '#EDE3CF', '#FBF6EC'],
};
const COUNTS = {petals: 46, leaves: 30, papers: 10};

/** depth layers: far (small, slow, soft), mid, near (big, fast, blurred) */
const LAYERS = [
  {share: 0.45, scale: 0.55, speed: 0.75, blur: 0.8, opacity: 0.85},
  {share: 0.4, scale: 1, speed: 1, blur: 0, opacity: 1},
  {share: 0.15, scale: 1.7, speed: 1.35, blur: 2.4, opacity: 1},
];

const petalPath = (L: number, W: number) =>
  `M 0 ${L / 2} C ${W * 0.62} ${L * 0.28} ${W * 0.58} ${-L * 0.42} ${W * 0.2} ${-L / 2} L 0 ${-L * 0.4} L ${-W * 0.2} ${-L / 2} C ${-W * 0.58} ${-L * 0.42} ${-W * 0.62} ${L * 0.28} 0 ${L / 2} Z`;
const leafPath = (L: number, W: number) => `M 0 ${L / 2} C ${W * 0.75} ${L * 0.2} ${W * 0.55} ${-L * 0.3} 0 ${-L / 2} C ${-W * 0.55} ${-L * 0.3} ${-W * 0.75} ${L * 0.2} 0 ${L / 2} Z`;

const Blossom: React.FC<{x: number; y: number; r: number; rot: number}> = ({x, y, r, rot}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    {[0, 1, 2, 3, 4].map((k) => (
      <path key={k} d={petalPath(r * 1.1, r * 0.95)} transform={`rotate(${k * 72}) translate(0 ${-r * 0.55})`} fill={k % 2 ? '#FBE9EE' : '#FFFFFF'} stroke="#E7A9BC" strokeWidth={r * 0.04} />
    ))}
    <circle r={r * 0.22} fill="#CFE08A" />
    {[0, 1, 2, 3, 4, 5, 6].map((k) => (
      <circle key={k} cx={Math.cos((k / 7) * TAU) * r * 0.28} cy={Math.sin((k / 7) * TAU) * r * 0.28} r={r * 0.05} fill="#E6B93A" />
    ))}
  </g>
);

const Meadow: React.FC<{mode: Props['mode']; branch: boolean; t: number}> = ({mode, branch, t}) => {
  const {w, h, u, portrait} = useStage();
  const autumn = mode === 'leaves';
  const hz = h * (portrait ? 0.78 : 0.74);
  const sky = autumn ? ['#8FB0C8', '#E7D9BF'] : ['#8EBFDB', '#E2EEEA'];
  const s = Math.min(w, h);
  const bx = (f: number) => -0.05 * w + f * (portrait ? 0.9 : 0.62) * w;
  const by = (f: number) => -0.04 * h + f * (portrait ? 0.24 : 0.36) * h - Math.sin(f * Math.PI) * 0.06 * h;
  const sway = Math.sin(t * 0.9) * 0.6;
  const blossoms: React.ReactNode[] = [];
  if (branch) {
    for (let i = 0; i < 12; i++) {
      const f = 0.08 + i * 0.077;
      const side = i % 2 ? 1 : -1;
      const x = bx(f) + side * 10 * u;
      const y = by(f) + side * 34 * u + hash01(3, i) * 20 * u;
      const r = (34 + 20 * hash01(4, i)) * u;
      blossoms.push(
        autumn ? (
          <path key={i} d={leafPath(r * 2.4, r * 1.3)} transform={`translate(${x} ${y}) rotate(${side * 40 + 160 + sway * 6})`} fill={PALETTES.leaves[i % 5]} stroke="#7A3A1E" strokeWidth={1.2 * u} />
        ) : (
          <Blossom key={i} x={x} y={y} r={r} rot={i * 37 + sway * 4} />
        ),
      );
    }
  }
  return (
    <g>
      <defs>
        <linearGradient id="fp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill="url(#fp-sky)" />
      <CloudPuff x={wrap(w * 0.22 + t * 8 * u, w * 1.3) - w * 0.1} y={h * 0.2} s={110 * u} seed={1} shade="#E3ECF0" />
      <CloudPuff x={wrap(w * 0.78 + t * 5 * u, w * 1.3) - w * 0.1} y={h * 0.34} s={70 * u} seed={2} shade="#E3ECF0" />
      <CloudPuff x={wrap(w * 1.08 + t * 6 * u, w * 1.3) - w * 0.1} y={h * 0.12} s={55 * u} seed={3} shade="#E3ECF0" opacity={0.9} />
      <path d={ridgePath('fp-hill', -10, w + 10, hz - 30 * u, 26 * u, 520 * u, h, {octaves: 2, step: 10 * u})} fill={autumn ? '#B9A57A' : '#B5CDA2'} />
      {Array.from({length: Math.ceil(w / (70 * u))}, (_, i) => {
        const x = i * 70 * u + hash01(7, i) * 30 * u;
        const r = (16 + 14 * hash01(8, i)) * u;
        const y = hz - 22 * u + hash01(9, i) * 10 * u;
        return (
          <g key={i}>
            <rect x={x - 2 * u} y={y} width={4 * u} height={r * 0.9} fill="#6E6A55" />
            <ellipse cx={x} cy={y - r * 0.3} rx={r} ry={r * 0.8} fill={autumn ? ['#C98A3E', '#B5672F', '#D7A64A'][i % 3] : ['#8FB487', '#9CC092', '#84A97D'][i % 3]} />
          </g>
        );
      })}
      <rect y={hz} width={w} height={h - hz} fill={autumn ? '#D2C08E' : '#D5E3B4'} />
      <rect y={hz} width={w} height={3 * u} fill={autumn ? '#BFA977' : '#C3D6A0'} />
      {branch && (
        <g>
          <path d={`M ${bx(0)} ${by(0) - 16 * u} Q ${bx(0.5)} ${by(0.5) - 52 * u} ${bx(1.02)} ${by(1.02)} Q ${bx(0.5)} ${by(0.5) - 28 * u} ${bx(0)} ${by(0) + 18 * u} Z`} fill="#5B4636" />
          <path d={`M ${bx(0.45)} ${by(0.45) - 10 * u} q ${60 * u} ${-70 * u} ${150 * u} ${-90 * u}`} stroke="#5B4636" strokeWidth={10 * u} fill="none" strokeLinecap="round" />
          <path d={`M ${bx(0.7)} ${by(0.7)} q ${30 * u} ${60 * u} ${110 * u} ${80 * u}`} stroke="#5B4636" strokeWidth={8 * u} fill="none" strokeLinecap="round" />
          {blossoms}
        </g>
      )}
    </g>
  );
};

const FallingPetals: React.FC<Props> = ({mode, background, backdrop, colors, count, speed, sway, size, wind, branch, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps} = useStage();
  const t = frame / fps;
  const overlay = isTransparent(background);
  const scene = backdrop && !overlay;
  const pal = colors && colors.length ? colors : PALETTES[mode];
  const total = Math.round((count > 0 ? count : COUNTS[mode]) * Math.max(0.6, areaK(w, h)));
  const papers = mode === 'papers';
  const leaves = mode === 'leaves';

  const layers = LAYERS.map((L, li) => {
    const n = Math.max(1, Math.round(total * L.share));
    const items: React.ReactNode[] = [];
    for (let i = 0; i < n; i++) {
      const hs = (k: number) => hash01(seed, li, i, k);
      const base = papers ? (60 + 40 * hs(1)) : 40 + 40 * hs(1);
      const v = base * u * speed * L.speed * (papers ? 1.2 : 2.2);
      const margin = 90 * u * L.scale * size;
      const spanY = h + 2 * margin;
      const y = wrap(hs(2) * spanY + v * t, spanY) - margin;
      const period = papers ? 1.5 : 1.2 * (0.8 + 0.5 * hs(3));
      const ph = hs(4) * TAU;
      const swayA = (papers ? 40 : 20) * u * sway * L.scale * 1.6;
      const sx = Math.sin((TAU * t) / period + ph);
      const spanX = w + 2 * margin;
      const x = wrap(hs(5) * spanX + wind * 40 * u * L.speed * t + swayA * sx, spanX) - margin;
      const spin = papers ? 0 : (90 + 90 * hs(6)) * (hs(7) < 0.5 ? -1 : 1);
      const rot = papers ? 25 * Math.cos((TAU * t) / period + ph) + (hs(8) - 0.5) * 40 : hs(8) * 360 + spin * t + 18 * Math.cos((TAU * t) / period + ph);
      const flipF = papers ? 0.55 + 0.4 * hs(9) : 0.5 + 0.9 * hs(9);
      const flip = Math.cos(TAU * flipF * t + hs(10) * TAU);
      const fx = Math.sign(flip || 1) * Math.max(0.06, Math.abs(flip));
      const col = pal[Math.floor(hs(11) * pal.length) % pal.length];
      const back = flip < 0;
      const k = L.scale * size;
      let shape: React.ReactNode;
      if (papers) {
        const W = 40 * u * k * 2;
        const H = 55 * u * k * 2;
        const fill = back ? mixHex(col, '#9C8F7A', 0.25) : col;
        shape = (
          <g>
            <rect x={-W / 2} y={-H / 2} width={W} height={H} fill={fill} stroke="#B9AD96" strokeWidth={0.8 * u} />
            {!back &&
              [0, 1, 2, 3, 4].map((r) => (
                <line key={r} x1={-W * 0.34} x2={W * (r === 4 ? 0.05 : 0.34)} y1={-H * 0.3 + r * H * 0.13} y2={-H * 0.3 + r * H * 0.13} stroke="#8C8273" strokeWidth={1.2 * u} opacity={0.55} />
              ))}
            <path d={`M ${W / 2 - W * 0.22} ${-H / 2} L ${W / 2} ${-H / 2 + W * 0.22} L ${W / 2 - W * 0.22} ${-H / 2 + W * 0.22} Z`} fill={mixHex(col, '#7E735F', 0.3)} opacity={0.6} />
          </g>
        );
      } else if (leaves) {
        const Lh = 58 * u * k;
        const fill = back ? mixHex(col, '#5A2A14', 0.3) : col;
        shape = (
          <g>
            <path d={leafPath(Lh, Lh * 0.6)} fill={fill} />
            <path d={`M 0 ${Lh * 0.62} L 0 ${-Lh * 0.42}`} stroke={mixHex(col, '#5A2A14', 0.5)} strokeWidth={1.2 * u * k} />
            {[-1, 1].map((sd) => (
              <path key={sd} d={`M 0 ${Lh * 0.05} l ${sd * Lh * 0.16} ${-Lh * 0.14} M 0 ${Lh * 0.22} l ${sd * Lh * 0.16} ${-Lh * 0.12}`} stroke={mixHex(col, '#5A2A14', 0.4)} strokeWidth={0.8 * u * k} />
            ))}
          </g>
        );
      } else {
        const Lh = 40 * u * k;
        const fill = back ? mixHex(col, '#D98BA4', 0.35) : col;
        shape = (
          <g>
            <path d={petalPath(Lh, Lh * 0.7)} fill={fill} stroke={mixHex(col, '#E39AB2', 0.6)} strokeWidth={0.6 * u * k} />
            <path d={`M 0 ${Lh * 0.45} Q ${Lh * 0.05} 0 0 ${-Lh * 0.3}`} stroke="#E8A3B8" strokeWidth={0.6 * u * k} fill="none" opacity={0.6} />
            <ellipse cx={0} cy={Lh * 0.36} rx={Lh * 0.12} ry={Lh * 0.1} fill="#F0A6BC" opacity={0.55} />
          </g>
        );
      }
      items.push(
        <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${fx.toFixed(3)} 1)`}>
          {papers && <rect x={-20 * u * k * 2 + 4 * u} y={-27 * u * k * 2 + 6 * u} width={40 * u * k * 2} height={55 * u * k * 2} fill="#000" opacity={0.08} />}
          {shape}
        </g>,
      );
    }
    return (
      <g key={li} opacity={L.opacity} filter={L.blur ? `url(#fp-blur${li})` : undefined}>
        {L.blur ? <BlurFilter id={`fp-blur${li}`} std={L.blur * u} /> : null}
        {items}
      </g>
    );
  });

  return (
    <AbsoluteFill style={{background: overlay ? 'transparent' : background}}>
      {scene && (
        <Svg>
          <Meadow mode={mode} branch={branch && !papers} t={t} />
        </Svg>
      )}
      <Svg>{layers}</Svg>
    </AbsoluteFill>
  );
};

export const fallingPetals = defineMotion<Props>({
  id: 'falling-petals',
  title: 'Falling petals / leaves / papers',
  category: 'environment',
  description: 'Petals (or autumn leaves, or paper sheets) sway, spin and flip in 3D as they fall in three depth layers past a blossom branch over a soft meadow. Overlay-capable.',
  source: ['video6 21.33-39.30', 'video14 era ambience (falling-papers)'],
  useFor: 'Spring / romance / seasons / time passing; papers for office chaos, letters, bureaucracy; overlay on any scene.',
  durationInFrames: 180,
  defaultProps: {
    mode: 'petals',
    background: '#A9CDE0',
    backdrop: true,
    colors: [],
    count: 0,
    speed: 1,
    sway: 1,
    size: 1,
    wind: 0.6,
    branch: true,
    seed: 1,
  },
  propDocs: {
    mode: '"petals", "leaves" or "papers"',
    background: 'CSS background; "transparent" = overlay (no painted meadow)',
    backdrop: 'paint the procedural sky / meadow / branch',
    colors: 'fill colours; empty = mode palette',
    count: 'items per 1080p frame; 0 = mode default (30 / 22 / 8)',
    speed: 'fall speed multiplier',
    sway: 'sideways sway amplitude multiplier',
    size: 'item size multiplier',
    wind: 'constant sideways drift (positive = right)',
    branch: 'draw the blossom (or autumn) branch in the top-left',
    seed: 'random seed',
  },
  component: FallingPetals,
  tags: ['particles', 'petals', 'leaves', 'paper', 'spring', 'autumn', 'overlay', 'ambience'],
});
