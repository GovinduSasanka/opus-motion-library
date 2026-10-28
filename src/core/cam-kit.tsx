import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {resolveSrc} from './asset';
import {rng} from './random';
import {useStage} from './stage';

/**
 * Shared bits for the camera motions (whip-pan, dolly-zoom, rack-focus, crash-zoom, orbit-parallax):
 * a procedural layered "plate" scene used whenever the host gives no image, so every motion looks finished with zero assets.
 */

const p2 = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** mix two #rrggbb colours, t = 0 -> a, 1 -> b */
export const mixHex = (a: string, b: string, t: number) => {
  if (!/^#[0-9a-fA-F]{6}$/.test(a) || !/^#[0-9a-fA-F]{6}$/.test(b)) return a;
  const A = p2(a);
  const B = p2(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
};

export const DEFAULT_SCENE_PALETTE = ['#ff7a59', '#6a4cff', '#14b8a6', '#ffd166'];

/** photo layer: cover-fit image */
export const Photo: React.FC<{src: string; fit?: 'cover' | 'contain'; style?: React.CSSProperties}> = ({src, fit = 'cover', style}) => (
  <Img src={resolveSrc(src)} style={{width: '100%', height: '100%', objectFit: fit, ...style}} />
);

type PlateProps = {i?: number; pal?: string[]};
const col = (pal: string[], i: number, k: number) => pal[(((i + k) % pal.length) + pal.length) % pal.length];

/** sky + sun + far ridge */
export const BackPlate: React.FC<PlateProps> = ({i = 0, pal = DEFAULT_SCENE_PALETTE}) => {
  const {w, h, u} = useStage();
  const r = rng(11 + i * 7);
  const top = mixHex(col(pal, i, 1), '#0a0a1a', 0.55);
  const bot = col(pal, i, 0);
  const sun = col(pal, i, 3);
  const sx = w * (0.28 + 0.44 * r());
  const ridge = [`M0 ${h}`];
  for (let k = 0; k <= 48; k++) {
    const x = (w * k) / 48;
    ridge.push(`L${x.toFixed(1)} ${(h * 0.66 + Math.sin(k * 0.37 + i * 2) * h * 0.035 + Math.sin(k * 0.91 + i) * h * 0.018).toFixed(1)}`);
  }
  ridge.push(`L${w} ${h}Z`);
  const gid = `cam-bp-${i}`;
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="0.75" stopColor={bot} />
          <stop offset="1" stopColor={mixHex(bot, sun, 0.5)} />
        </linearGradient>
        <radialGradient id={gid + 's'}>
          <stop offset="0" stopColor={sun} stopOpacity="0.95" />
          <stop offset="0.5" stopColor={sun} stopOpacity="0.9" />
          <stop offset="1" stopColor={sun} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${gid})`} />
      <circle cx={sx} cy={h * 0.5} r={Math.min(w, h) * 0.34} fill={`url(#${gid}s)`} opacity={0.45} />
      <circle cx={sx} cy={h * 0.5} r={118 * u} fill={sun} />
      {Array.from({length: 14}, (_, k) => (
        <circle key={k} cx={r() * w} cy={r() * h * 0.38} r={(1 + r() * 2) * u} fill="#fff" opacity={0.35 + r() * 0.4} />
      ))}
      <path d={ridge.join(' ')} fill={mixHex(bot, '#10101c', 0.55)} />
    </svg>
  );
};

/** mid ground: skyline or hills */
export const MidPlate: React.FC<PlateProps> = ({i = 0, pal = DEFAULT_SCENE_PALETTE}) => {
  const {w, h, u} = useStage();
  const r = rng(31 + i * 5);
  const fill = mixHex(col(pal, i, 0), '#0b0b16', 0.78);
  const win = col(pal, i, 3);
  const n = 26;
  const bw = w / n;
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      {Array.from({length: n}, (_, k) => {
        const bh = (0.1 + r() * 0.22) * h;
        const top = h * 0.8 - bh;
        return (
          <g key={k}>
            <rect x={k * bw} y={top} width={bw + 1} height={h - top} fill={fill} />
            {Array.from({length: 5}, (_, j) =>
              r() < 0.35 ? <rect key={j} x={k * bw + bw * 0.2 + (j % 2) * bw * 0.35} y={top + 14 * u + Math.floor(j / 2) * 26 * u} width={bw * 0.14} height={10 * u} fill={win} opacity={0.75} /> : null,
            )}
          </g>
        );
      })}
      <rect x={0} y={h * 0.8} width={w} height={h * 0.2} fill={fill} />
    </svg>
  );
};

/** a stylised standing figure / hero subject, centred, feet at ~90 % height */
export const SubjectPlate: React.FC<{i?: number; pal?: string[]; ink?: string; accent?: string; size?: number}> = ({i = 0, pal = DEFAULT_SCENE_PALETTE, ink, accent, size = 0.5}) => {
  const {w, h, u} = useStage();
  const H = h * size;
  const cx = w / 2;
  const foot = h * 0.92;
  const top = foot - H;
  const body = ink ?? mixHex(col(pal, i, 1), '#050510', 0.82);
  const scarf = accent ?? col(pal, i, 3);
  const hr = H * 0.1;
  const sw = H * 0.17;
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <ellipse cx={cx} cy={foot + 8 * u} rx={H * 0.28} ry={H * 0.035} fill="#000" opacity={0.35} />
      <path
        d={`M${cx - sw} ${top + H * 0.2} Q${cx} ${top + H * 0.15} ${cx + sw} ${top + H * 0.2} L${cx + sw * 1.25} ${top + H * 0.62} L${cx + sw * 0.9} ${foot} L${cx + sw * 0.1} ${foot} L${cx} ${top + H * 0.68} L${cx - sw * 0.1} ${foot} L${cx - sw * 0.9} ${foot} L${cx - sw * 1.25} ${top + H * 0.62}Z`}
        fill={body}
      />
      <circle cx={cx} cy={top + hr} r={hr} fill={body} />
      <path d={`M${cx - sw * 0.75} ${top + H * 0.2} Q${cx} ${top + H * 0.28} ${cx + sw * 0.75} ${top + H * 0.2} L${cx + sw * 1.1} ${top + H * 0.3} Q${cx} ${top + H * 0.34} ${cx - sw * 1.1} ${top + H * 0.3}Z`} fill={scarf} />
      <path d={`M${cx + sw * 0.7} ${top + H * 0.28} L${cx + sw * 1.4} ${top + H * 0.46} L${cx + sw * 1.05} ${top + H * 0.47}Z`} fill={scarf} />
    </svg>
  );
};

/** foreground blades / leaves along the bottom + top corner */
export const FrontPlate: React.FC<PlateProps> = ({i = 0, pal = DEFAULT_SCENE_PALETTE}) => {
  const {w, h} = useStage();
  const r = rng(77 + i);
  const fill = mixHex(col(pal, i, 1), '#020208', 0.9);
  const blades: string[] = [];
  for (let k = 0; k < 46; k++) {
    const x = (k / 45) * w * 1.1 - w * 0.05;
    const bh = h * (0.1 + r() * 0.3) * (0.4 + Math.abs(x / w - 0.5) * 1.6);
    const lean = (r() - 0.5) * w * 0.05;
    blades.push(`M${x - w * 0.012} ${h + 4} Q${x + lean * 0.3} ${h - bh * 0.6} ${x + lean} ${h - bh} Q${x + lean * 0.2 + w * 0.006} ${h - bh * 0.5} ${x + w * 0.014} ${h + 4}Z`);
  }
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      <path d={blades.join(' ')} fill={fill} />
    </svg>
  );
};

export const FullFrame: React.FC<{children?: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <AbsoluteFill style={style}>{children}</AbsoluteFill>
);

/** composed placeholder scene i (all layers) for motions that treat the frame as one picture */
export const SceneStill: React.FC<{i?: number; pal?: string[]; label?: string; font?: string; ink?: string; accent?: string}> = ({i = 0, pal, label, font, ink = '#fff', accent}) => {
  const {u, w, h} = useStage();
  return (
    <AbsoluteFill>
      <BackPlate i={i} pal={pal} />
      <MidPlate i={i} pal={pal} />
      <SubjectPlate i={i} pal={pal} accent={accent} />
      <FrontPlate i={i} pal={pal} />
      {label ? (
        <div style={{position: 'absolute', left: w * 0.06, top: h * 0.09, color: ink, fontFamily: font, fontWeight: 800, fontSize: 64 * u, letterSpacing: 1 * u, textShadow: '0 4px 30px rgba(0,0,0,.35)'}}>{label}</div>
      ) : null}
    </AbsoluteFill>
  );
};
