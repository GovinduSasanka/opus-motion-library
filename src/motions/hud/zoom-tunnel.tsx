import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {BP, GlowDot, ScanlineBg, sstep} from '../../core/hud-kit';
import {Svg, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video19 7.3-8.9 zoom-through-tunnel: a top-down radar target (concentric guide circles, 8 blue
 * spokes) with a tunnel of outlined capsules in its centre. After a small anticipation pull
 * (x0.91) the camera accelerates into the tunnel (per 0.1 s x1.24 -> x1.5), rings of capsules rush
 * past and spin, then a hero word punches in (scale 0.6 -> 1.15 -> 1, opacity flicker) as the tunnel
 * slows to a cruise; an optional subtitle types along an arc above it.
 */
type Props = {
  background: string;
  word: string;
  subtitle: string;
  rings: number;
  perRing: number;
  spin: number;
  speed: number;
  popFrame: number;
  shape: 'capsule' | 'line' | 'square';
  accent: string;
  line: string;
};

const ZoomTunnel: React.FC<Props> = ({background, word, subtitle, rings, perRing, spin, speed, popFrame, shape, accent, line}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const S = Math.min(w, h);
  const diag = Math.hypot(w, h) / 2;
  const accStart = Math.max(14, popFrame - 72);

  // camera speed profile, integrated per frame (deterministic)
  const vel = (f: number) => {
    if (f < accStart - 8) return 0.004;
    if (f < accStart) return -0.018;
    if (f < popFrame) return 0.005 + 0.75 * speed * Math.pow((f - accStart) / (popFrame - accStart), 1.7);
    const k = ease.out(clamp((f - popFrame) / 26));
    return lerp(0.755 * speed, 0.05, k);
  };
  let Z = 0;
  for (let f = 0; f < frame; f++) Z += vel(f);
  const v = vel(frame);

  const F = 0.58;
  const dPlane = 1.4;
  const dMin = 0.18;
  const dMax = rings + dPlane + 1;
  const R = (d: number) => (S * (portrait ? 1.55 : 1) * F) / d; // portrait: bigger tunnel to use the tall frame

  const caps = React.useMemo(() => {
    const r = rng(1907);
    return Array.from({length: 64}, () =>
      Array.from({length: perRing}, () => ({len: 0.5 + r() * 1.1, jitter: (r() - 0.5) * 0.18, radial: r() < 0.15, blue: r() < 0.09, skip: r() < 0.12, rr: 0.92 + r() * 0.16})),
    );
  }, [perRing]);

  // visible rings: ring k sits at depth dPlane + k (k >= 1)
  const kFirst = Math.max(1, Math.ceil(Z + dMin - dPlane));
  const ringEls: React.ReactNode[] = [];
  for (let k = kFirst + rings; k >= kFirst; k--) {
    const d = dPlane + k - Z;
    if (d <= dMin || d > dMax) continue;
    const Rr = R(d);
    const fadeFar = 1 - sstep(dMax - 2.5, dMax, d);
    const fadeNear = 1 - sstep(diag * 0.55, diag * 1.05, Rr);
    const o = fadeFar * fadeNear;
    if (o <= 0.01) continue;
    const set = caps[((k % 64) + 64) % 64];
    const base = k * 0.37 + (spin * frame) / 30 + Z * 0.05;
    const stretch = 1 + Math.min(2.5, v * 3.5);
    const sw = Math.min(3, 1 + Rr / (S * 0.6)) * 1.3 * u;
    ringEls.push(
      <g key={k} opacity={o}>
        {set.map((c, j) => {
          if (c.skip) return null;
          const a = base + (j / perRing) * Math.PI * 2 + c.jitter;
          const rr = Rr * c.rr;
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr;
          const L = Rr * 0.13 * c.len * (c.radial ? stretch : 1);
          const T = Math.max(2 * u, L * (shape === 'line' ? 0.02 : shape === 'square' ? 0.6 : 0.26));
          const rot = (a * 180) / Math.PI + (c.radial ? 0 : 90);
          return (
            <rect
              key={j}
              x={x - L / 2}
              y={y - T / 2}
              width={L}
              height={T}
              rx={shape === 'capsule' ? T / 2 : 0}
              transform={`rotate(${rot},${x},${y})`}
              fill="none"
              stroke={c.blue ? accent : line}
              strokeOpacity={c.blue ? 1 : 0.78}
              strokeWidth={c.blue ? sw * 1.4 : sw}
            />
          );
        })}
      </g>,
    );
  }

  // radar plane at depth dPlane (blows past the camera)
  const dp = dPlane - Z;
  const Rp = dp > 0.05 ? R(dp) : 1e9;
  const planeO = (1 - sstep(diag * 0.9, diag * 2.2, Rp)) * prog(frame, 0, 10);

  // hero word pop
  const fsWord = Math.min(150 * u, (w * 0.82) / Math.max(3, word.length * 0.62));
  const popS = frame < popFrame ? 0 : frame < popFrame + 3 ? lerp(0.6, 1.15, ease.out((frame - popFrame) / 3)) : lerp(1.15, 1, ease.out(clamp((frame - popFrame - 3) / 5)));
  const flicker = frame === popFrame + 1 ? 0.6 : 1;
  const flash = frame >= popFrame ? Math.max(0, 1 - (frame - popFrame) / 4) : 0;

  // subtitle along an arc above the word
  const subStart = popFrame + 16;
  const fsSub = 44 * u;
  const Ra = Math.max(word.length * fsWord * 0.31 + 70 * u, S * 0.27);
  const stepA = (fsSub * 0.62 * 1.3) / Ra;

  return (
    <AbsoluteFill style={{background}}>
      <ScanlineBg opacity={0.8} />
      <Svg>
        {planeO > 0.01 && (
          <g opacity={planeO}>
            {Array.from({length: 10}, (_, i) => (
              <circle key={i} cx={cx} cy={cy} r={Rp * (0.3 + i * 0.12)} fill="none" stroke={i % 3 === 2 ? BP.steel : line} strokeOpacity={i % 3 === 2 ? 0.6 : 0.16} strokeWidth={1 * u} strokeDasharray={i % 2 ? `${3 * u} ${5 * u}` : undefined} />
            ))}
            {Array.from({length: 8}, (_, i) => {
              const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
              return <line key={i} x1={cx + Math.cos(a) * Rp * 0.32} y1={cy + Math.sin(a) * Rp * 0.32} x2={cx + Math.cos(a) * Rp * 1.6} y2={cy + Math.sin(a) * Rp * 1.6} stroke={accent} strokeWidth={2 * u} strokeOpacity={0.85} />;
            })}
            <line x1={cx - Rp * 1.6} y1={cy} x2={cx + Rp * 1.6} y2={cy} stroke={accent} strokeOpacity={0.5} strokeWidth={1 * u} />
            <line x1={cx} y1={cy - Rp * 1.6} x2={cx} y2={cy + Rp * 1.6} stroke={accent} strokeOpacity={0.5} strokeWidth={1 * u} />
          </g>
        )}
        {/* fixed thin guide circles that keep the frame structured after the plane passes */}
        <g opacity={0.55 * prog(frame, popFrame - 20, popFrame + 10)}>
          {[0.18, 0.3, 0.44, 0.6, 0.8].map((k, i) => (
            <circle key={i} cx={cx} cy={cy} r={S * k} fill="none" stroke={BP.steel} strokeOpacity={0.35} strokeWidth={u} strokeDasharray={i % 2 ? `${2 * u} ${6 * u}` : undefined} />
          ))}
          <line x1={0} y1={cy} x2={w} y2={cy} stroke={accent} strokeOpacity={0.35} strokeWidth={u} />
          <line x1={cx} y1={0} x2={cx} y2={h} stroke={accent} strokeOpacity={0.25} strokeWidth={u} />
        </g>
        {ringEls}
        <GlowDot id="zt-dot" x={cx} y={cy} r={5 * u} boost={1 + 0.4 * Math.sin(frame * 0.3)} />
        {frame >= popFrame && (
          <g>
            <defs>
              <radialGradient id="zt-shade">
                <stop offset="0%" stopColor={background} stopOpacity={0.85} />
                <stop offset="100%" stopColor={background} stopOpacity={0} />
              </radialGradient>
            </defs>
            <ellipse cx={cx} cy={cy} rx={word.length * fsWord * 0.45} ry={fsWord * 1.1} fill="url(#zt-shade)" />
            <g transform={`translate(${cx},${cy}) scale(${popS})`} opacity={flicker}>
              <text x={3 * u} y={fsWord * 0.36 + 3 * u} textAnchor="middle" fill="#000" fillOpacity={0.6} fontFamily={fonts.mono} fontWeight={700} fontSize={fsWord}>
                {word}
              </text>
              <text x={0} y={fsWord * 0.36} textAnchor="middle" fill={BP.line} fontFamily={fonts.mono} fontWeight={700} fontSize={fsWord}>
                {word}
              </text>
            </g>
          </g>
        )}
        {subtitle &&
          subtitle.split('').map((ch, i) => {
            const t0 = subStart + i * 1.2;
            if (frame < t0) return null;
            const p = prog(frame, t0, t0 + 4);
            const a = -Math.PI / 2 + (i - (subtitle.length - 1) / 2) * stepA;
            const rr = Ra + (1 - p) * 4 * u;
            const x = cx + Math.cos(a) * rr;
            const y = cy + Math.sin(a) * rr;
            return (
              <text key={i} x={x} y={y} transform={`rotate(${(a * 180) / Math.PI + 90},${x},${y})`} textAnchor="middle" fill={BP.line} opacity={p} fontFamily={fonts.mono} fontWeight={700} fontSize={fsSub}>
                {ch}
              </text>
            );
          })}
      </Svg>
      {flash > 0 && <AbsoluteFill style={{background: '#DADDE5', opacity: flash * 0.18}} />}
      <Vignette strength={0.65} />
    </AbsoluteFill>
  );
};

export const zoomTunnel = defineMotion<Props>({
  id: 'zoom-tunnel',
  title: 'Zoom-through tunnel',
  category: 'hud',
  description: 'Blueprint radar target opens into a tunnel of outlined capsule rings; the camera accelerates through it and a hero word punches in as the tunnel slows, with an optional arc subtitle.',
  source: ['video19 7.30-8.90 (zoom-through-tunnel, arc-text-type, hero-word-punch)'],
  useFor: '"Entering the system" / hyperspace beats that land on a single key word.',
  durationInFrames: 150,
  defaultProps: {
    background: BP.bg,
    word: 'MEMORY',
    subtitle: 'RETRIEVE',
    rings: 16,
    perRing: 34,
    spin: 0.35,
    speed: 1,
    popFrame: 92,
    shape: 'capsule',
    accent: BP.blue,
    line: BP.line,
  },
  propDocs: {
    word: 'hero word that punches in at the end',
    subtitle: 'text typed along an arc above the word ("" to hide)',
    rings: 'number of capsule rings in depth',
    perRing: 'capsules per ring',
    spin: 'tunnel spin in radians per second',
    speed: 'peak travel speed multiplier',
    popFrame: 'frame where the word pops (the zoom accelerates for ~2.4 s before it)',
    shape: 'capsule | line | square',
  },
  component: ZoomTunnel,
  tags: ['tunnel', 'zoom', 'hyperspace', 'hero word', 'blueprint'],
});
