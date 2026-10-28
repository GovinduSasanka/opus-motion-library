// Adapted from mg-styles-15/demos/22-hud/js/hud.js (brackets, acquire, banner) (MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {mg1Fonts, mixHex} from '../../core/r2-mg1-kit';
import {scramble, typedText} from '../../core/r2-x58-kit';
import {cl, mix} from '../../core/r2-mg1b-kit';
import {Scanlines, Svg, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Cand = {x: number; y: number; size: number; id: string; match: number};
type Props = {
  target: {x: number; y: number; size: number};
  candidates: Cand[];
  label: string;
  coords: string;
  src: string;
  background: string;
  accent: string;
  lockColor: string;
  firstCandidate: number;
  candidateEvery: number;
  lockAt: number;
};

const Crate: React.FC<{x: number; y: number; s: number; color: string}> = ({x, y, s, color}) => {
  const a = s * 0.5;
  const b = s * 0.25;
  const c = s * 0.55;
  const top = `M${x} ${y - c - b}L${x + a} ${y - c}L${x} ${y - c + b}L${x - a} ${y - c}Z`;
  const left = `M${x - a} ${y - c}L${x} ${y - c + b}L${x} ${y + b}L${x - a} ${y}Z`;
  const right = `M${x} ${y - c + b}L${x + a} ${y - c}L${x + a} ${y}L${x} ${y + b}Z`;
  return (
    <g>
      <ellipse cx={x} cy={y + b * 0.6} rx={a * 1.1} ry={b * 0.7} fill="#000" opacity={0.35} />
      <path d={left} fill={mixHex(color, '#000000', 0.45)} />
      <path d={right} fill={mixHex(color, '#000000', 0.25)} />
      <path d={top} fill={color} />
      <path d={`M${x} ${y - c + b}V${y + b}`} stroke="#000" strokeOpacity={0.25} strokeWidth={2} />
    </g>
  );
};

const TargetLock: React.FC<Props> = ({target, candidates, label, coords, src, background, accent, lockColor, firstCandidate, candidateEvery, lockAt}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx} = useStage();
  const tx = w * target.x;
  const ty = h * target.y;
  const hs = (target.size / 2) * u;
  const arm = Math.max(16 * u, hs * 0.45);

  // ---- brackets
  const t0 = lockAt - 13; // start flying
  const fly = prog(frame, t0, t0 + 8, ease.out);
  const snap = prog(frame, t0 + 8, t0 + 13, ease.expoOut);
  const locked = frame >= lockAt;
  const scale = frame < t0 ? 1.4 : fly < 1 ? 1.4 : mix(1.4, 1, snap);
  const breathe = locked ? 1 + 0.012 * Math.sin((frame - lockAt) * 0.3) : 1;
  const corners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  const farCorner = (sx: number, sy: number): [number, number] => [sx < 0 ? -hs * 1.4 - tx : w - tx + hs * 1.4, sy < 0 ? -hs * 1.4 - ty : h - ty + hs * 1.4];
  const brCol = locked ? lockColor : '#FFFFFF';
  const flash = frame >= lockAt && frame < lockAt + 3 ? 0.3 * (1 - (frame - lockAt) / 3) : 0;
  const brOpacity = prog(frame, t0, t0 + 3, ease.out);

  // ---- ratchet
  const R = hs * 1.38;
  const filled = locked ? Math.min(24, 3 * Math.floor((frame - lockAt) / 1.5 + 1)) : 0;

  // ---- candidates
  const candFade = 1 - prog(frame, t0 - 6, t0 + 4, ease.in);
  // ---- banner
  const bAt = lockAt + 11;
  const bOpen = prog(frame, bAt, bAt + 9, ease.expoOut);
  const bw = Math.min(w * 0.8, 640 * u);
  const bh = 66 * u;
  const by = Math.min(h - 150 * u, ty + hs + 84 * u);
  const labelTxt = scramble(label, frame, bAt + 3, 12, 5);
  const coordTxt = typedText(coords, frame, bAt + 10, 46);
  const showScene = background !== 'transparent';

  // ---- procedural scene
  const crates = [
    {x: 0.26, y: 0.46, s: 120, c: '#3A5BA8'},
    {x: 0.76, y: 0.4, s: 104, c: '#6A4BA8'},
    {x: 0.36, y: 0.72, s: 132, c: '#2E8C85'},
    {x: 0.74, y: 0.72, s: 116, c: '#A8553A'},
    {x: 0.16, y: 0.74, s: 96, c: '#3A5BA8'},
    {x: target.x, y: target.y + 0.04, s: target.size * 0.86, c: '#C9A23C'},
  ];
  const horizon = h * 0.32;
  const fan: React.ReactNode[] = [];
  for (let i = -14; i <= 14; i++) fan.push(<line key={'f' + i} x1={cx} y1={horizon} x2={cx + i * w * 0.16} y2={h} stroke={accent} strokeWidth={1 * u} opacity={0.1} />);
  for (let k = 1; k <= 12; k++) {
    const yy = horizon + (h - horizon) * Math.pow(k / 12, 2.1);
    fan.push(<line key={'h' + k} x1={0} x2={w} y1={yy} y2={yy} stroke={accent} strokeWidth={1 * u} opacity={0.1} />);
  }

  return (
    <AbsoluteFill style={{background: showScene ? `linear-gradient(180deg, #0A1220 0%, ${background} 100%)` : 'transparent'}}>
      {showScene && src && <Img src={resolveSrc(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />}
      <Svg>
        {showScene && !src && (
          <g>
            <g>{fan}</g>
            {crates.map((c, i) => (
              <Crate key={i} x={w * c.x} y={h * c.y} s={c.s * u} color={c.c} />
            ))}
          </g>
        )}
        {/* candidate boxes */}
        {candidates.map((c, i) => {
          const born = firstCandidate + i * candidateEvery;
          if (frame < born) return null;
          const p = prog(frame, born, born + 6, ease.out);
          const sz = (c.size / 2) * u;
          const x = w * c.x;
          const y = h * c.y;
          const pct = Math.round(c.match * ease.out(cl((frame - born) / 12)));
          const strong = c.match >= 90;
          const col = strong ? accent : '#6FB7C9';
          return (
            <g key={i} opacity={p * candFade} transform={`translate(${x} ${y}) scale(${mix(1.25, 1, p)}) translate(${-x} ${-y})`}>
              <rect x={x - sz} y={y - sz} width={sz * 2} height={sz * 2} fill="none" stroke={col} strokeWidth={2 * u} />
              <path d={`M${x - sz} ${y - sz + 12 * u}V${y - sz}H${x - sz + 12 * u}M${x + sz - 12 * u} ${y + sz}H${x + sz}V${y + sz - 12 * u}`} stroke={col} strokeWidth={4 * u} fill="none" />
              <rect x={x - sz} y={y - sz - 44 * u} width={Math.max(sz * 2, 150 * u)} height={40 * u} fill={col} opacity={0.18} />
              <text x={x - sz + 8 * u} y={y - sz - 28 * u} fontFamily={fonts.mono} fontWeight={700} fontSize={14 * u} letterSpacing={2 * u} fill={col}>
                {c.id}
              </text>
              <text x={x - sz + 8 * u} y={y - sz - 10 * u} fontFamily={fonts.mono} fontWeight={700} fontSize={15 * u} fill="#fff">
                MATCH {pct}%
              </text>
            </g>
          );
        })}
        {/* brackets */}
        <g opacity={brOpacity} transform={`translate(${tx} ${ty})`}>
          {corners.map(([sx, sy], i) => {
            const [fx, fy] = farCorner(sx, sy);
            const px = frame < t0 + 8 ? mix(fx, sx * hs * 1.4, fly) : sx * hs * scale * breathe;
            const py = frame < t0 + 8 ? mix(fy, sy * hs * 1.4, fly) : sy * hs * scale * breathe;
            return (
              <path
                key={i}
                d={`M${px - sx * arm} ${py}L${px} ${py}L${px} ${py - sy * arm}`}
                stroke={brCol}
                strokeWidth={3 * u}
                strokeLinecap="square"
                strokeLinejoin="miter"
                fill="none"
              />
            );
          })}
          {/* ratchet ring */}
          {locked &&
            Array.from({length: 24}).map((_, i) => {
              const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
              const on = i < filled;
              return (
                <line
                  key={i}
                  x1={Math.cos(a) * R}
                  y1={Math.sin(a) * R}
                  x2={Math.cos(a) * (R + (on ? 18 : 9) * u)}
                  y2={Math.sin(a) * (R + (on ? 18 : 9) * u)}
                  stroke={on ? lockColor : accent}
                  strokeWidth={(on ? 4 : 2) * u}
                  opacity={on ? 1 : 0.4}
                />
              );
            })}
          {locked && <circle r={5 * u} fill={lockColor} opacity={0.5 + 0.5 * Math.sin((frame - lockAt) * 0.5)} />}
        </g>
        {/* banner */}
        {frame >= bAt && (
          <g>
            <rect x={cx - (bw * bOpen) / 2} y={by - bh / 2} width={bw * bOpen} height={bh} fill={lockColor} opacity={0.92} />
            <rect x={cx - (bw * bOpen) / 2} y={by - bh / 2} width={bw * bOpen} height={bh} fill="none" stroke="#fff" strokeWidth={1.5 * u} opacity={0.6} />
            <text x={cx} y={by + 14 * u} textAnchor="middle" fontFamily={mg1Fonts.tech} fontWeight={700} fontSize={38 * u} letterSpacing={9 * u} fill="#10131c" opacity={bOpen > 0.6 ? 1 : 0}>
              {labelTxt}
            </text>
            <text x={cx} y={by + bh / 2 + 36 * u} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={22 * u} letterSpacing={3 * u} fill={lockColor}>
              {coordTxt}
              {Math.floor(frame / 8) % 2 === 0 ? '_' : ' '}
            </text>
          </g>
        )}
        <rect width={w} height={h} fill="#fff" opacity={flash} />
      </Svg>
      {showScene && <Scanlines gap={4} opacity={0.1} />}
      {showScene && <Vignette strength={0.5} />}
    </AbsoluteFill>
  );
};

export const targetLock = defineMotion<Props>({
  id: 'target-lock',
  title: 'Target lock',
  category: 'hud',
  description:
    'Candidate boxes with ids and rising MATCH % appear over a scene half a second apart; four L-brackets fly in from the frame corners, close in and snap onto the target (1.4 to 1.0 scale), a lock ratchet ring fills, then a "TARGET LOCKED" banner opens from the centre with coordinates typing below. Works over a built-in crate scene, your image, or transparent as an overlay.',
  source: ['mg-styles-15 demos/22-hud/js/hud.js brackets() / acquire() / banner() (MIT)'],
  useFor: 'Gaming edits, tech reviews ("found the bug") and product highlights on a screenshot, face or map; pairs with target-lock-box (different 45-degree style).',
  durationInFrames: 180,
  defaultProps: {
    target: {x: 0.56, y: 0.5, size: 220},
    candidates: [
      {x: 0.26, y: 0.4, size: 150, id: 'ID-0412', match: 38},
      {x: 0.76, y: 0.34, size: 130, id: 'ID-0587', match: 52},
      {x: 0.36, y: 0.66, size: 160, id: 'ID-0231', match: 27},
      {x: 0.74, y: 0.66, size: 140, id: 'ID-0875', match: 61},
      {x: 0.56, y: 0.5, size: 220, id: 'ID-0990', match: 97},
    ],
    label: 'TARGET LOCKED',
    coords: 'X 0.560 · Y 0.500 · CONF 97.4%',
    src: '',
    background: '#101A2C',
    accent: '#3CF2FF',
    lockColor: '#FFD23F',
    firstCandidate: 12,
    candidateEvery: 15,
    lockAt: 112,
  },
  propDocs: {
    target: 'lock target {x, y as fractions of the frame, size in px at 1080p}',
    candidates: 'candidate boxes [{x, y, size, id, match}] shown 0.5 s apart; match >= 90 uses the accent colour',
    label: 'banner text (scramble-decoded)',
    coords: 'line typed under the banner',
    src: 'optional image (public/ path) used as the backdrop instead of the crate scene',
    background: "scene colour; 'transparent' renders only the HUD for use as an overlay",
    accent: 'candidate / grid colour',
    lockColor: 'bracket-lock, ratchet and banner colour',
    firstCandidate: 'frame the first candidate appears',
    candidateEvery: 'frames between candidates (15 = 0.5 s)',
    lockAt: 'frame the brackets snap on (they start 13 frames earlier)',
  },
  component: TargetLock,
  tags: ['target lock', 'lock on', 'brackets', 'hud', 'acquire', 'match', 'candidates', 'sci-fi', 'tracking', 'overlay', 'gaming', 'highlight', 'banner'],
});
