import React from 'react';
import {Easing, Img, staticFile} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {FxRoot, isClear, useFx} from '../../core/fx-kit';
import {n2, rng, range} from '../../core/random';
import {Svg} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video23 giant-eye-reveal: in near-black a huge reptilian eye (~68 % W x 57 % H) opens from a thin
 * cyan slit; the almond lid mask opens over 1.3 s (39 f, easeOutCubic), a cyan glow halo ramps with
 * it, the slit pupil slowly contracts (scaleX 1 -> 0.85) and the iris sparkles at ~0.5 Hz.
 * video15 eye-zoom-match-cut: exponential push into the pupil — scale = exp(ln(max) * easeInCubic),
 * until the pupil fills the frame.
 * video17 eyelid-iris-close: the lids squash the lens shape to a sliver with easeInCubic (0.3 s).
 */
type Props = {
  background: string;
  x: number;
  y: number;
  delay: number;
  size: number;
  openFrames: number;
  holdFrames: number;
  ending: 'push' | 'close' | 'hold';
  pushFrames: number;
  maxScale: number;
  closeFrames: number;
  irisColor: string;
  glowColor: string;
  pupil: 'slit' | 'round';
  endColor: string;
  src: string;
  scales: boolean;
  seed: number;
};

const cubicOut = Easing.out(Easing.cubic);
const cubicIn = Easing.in(Easing.cubic);

/** almond (lens) path centred on 0,0, half-width a, upper / lower half-heights */
const almond = (a: number, up: number, lo: number) => {
  const ku = up / 0.75;
  const kl = lo / 0.75;
  return `M${-a} 0 C${-a * 0.45} ${-ku} ${a * 0.45} ${-ku} ${a} 0 C${a * 0.45} ${kl} ${-a * 0.45} ${kl} ${-a} 0 Z`;
};

const GiantEyeReveal: React.FC<Props> = (p) => {
  const {background, x, y, delay, size, openFrames, holdFrames, ending, pushFrames, maxScale, closeFrames, irisColor, glowColor, pupil, endColor, src, scales, seed} = p;
  const {f, frame, u, w, h, px, py} = useFx(x, y, delay);
  const clear = isClear(background);
  const EW = (h > w ? w * 0.94 : Math.min(w * 0.72, h * 1.2)) * size;
  const EH = EW * 0.477;
  const a = EW / 2;
  const id = `ge${seed}`;

  // --- timeline ---
  const endStart = openFrames + holdFrames;
  let open = f < 0 ? 0 : 0.02 + 0.98 * cubicOut(clamp(f / Math.max(1, openFrames)));
  let glowK = f < 0 ? 0 : 0.25 + 0.75 * cubicOut(clamp(f / Math.max(1, openFrames)));
  let zoom = 1;
  let dilate = 1;
  let blackout = 0;
  if (ending === 'close') {
    const c = cubicIn(clamp((f - endStart) / Math.max(1, closeFrames)));
    open *= 1 - c;
    glowK *= 1 - 0.85 * c;
  } else if (ending === 'push') {
    const t = cubicIn(clamp((f - endStart) / Math.max(1, pushFrames)));
    zoom = Math.exp(Math.log(Math.max(1.01, maxScale)) * t);
    dilate = 1 + 2.2 * t;
    blackout = prog(f, endStart + pushFrames - 3, endStart + pushFrames, ease.in);
  }
  const contract = 1 - 0.15 * ease.sine(prog(f, openFrames * 0.6, openFrames + holdFrames * 0.9, ease.linear));
  const t = frame / 30;
  const up = (EH / 2) * open;
  const lo = (EH / 2) * open * 0.86;
  const IR = EH * 0.6;
  const irisX = n2(id + 'ix', t * 0.25, 0) * IR * 0.03;
  const irisY = n2(id + 'iy', t * 0.25, 0) * IR * 0.02 + IR * 0.02;
  const breathe = 1 + 0.004 * Math.sin(t * 1.3);
  const sparkle = 0.6 + 0.4 * Math.sin(t * Math.PI * 2 * 0.5);

  const iris = React.useMemo(() => {
    const r = rng(seed * 4099 + 3);
    const fibres = Array.from({length: 170}, (_, i) => {
      const ang = (i / 170) * Math.PI * 2 + (r() - 0.5) * 0.04;
      return {ang, r0: range(r, 0.15, 0.24), r1: range(r, 0.72, 0.97), light: r() < 0.55, wd: range(r, 0.6, 1.6), op: range(r, 0.25, 0.6)};
    });
    const dots = [0.34, 0.5, 0.66, 0.8].flatMap((rr, k) =>
      Array.from({length: 46 + k * 10}, (_, i) => ({rr: rr + (r() - 0.5) * 0.04, ang: (i / (46 + k * 10)) * Math.PI * 2 + r() * 0.1, s: range(r, 0.5, 1.4), ph: r() * 6.28})),
    );
    const scl = Array.from({length: 140}, () => {
      const ang = r() * Math.PI * 2;
      const band = range(r, 1.08, 1.75);
      return {ang, band, s: range(r, 0.018, 0.04), op: range(r, 0.12, 0.38), rot: range(r, -20, 20)};
    });
    return {fibres, dots, scl};
  }, [seed]);

  const pupilW = IR * 0.2 * contract * dilate;
  const pupilH = IR * 0.9 * Math.min(1.12, 0.92 + 0.08 * dilate);
  const pupilPath =
    pupil === 'round'
      ? null
      : `M0 ${-pupilH} C${pupilW * 1.2} ${-pupilH * 0.45} ${pupilW * 1.2} ${pupilH * 0.45} 0 ${pupilH} C${-pupilW * 1.2} ${pupilH * 0.45} ${-pupilW * 1.2} ${-pupilH * 0.45} 0 ${-pupilH} Z`;

  // pupil centre in screen space (zoom target)
  const zx = px + irisX;
  const zy = py + irisY;

  const visible = f >= 0 && open > 0.001;

  return (
    <FxRoot background={background}>
      <Svg>
        <defs>
          <radialGradient id={`${id}-iris`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d9fbff" />
            <stop offset="20%" stopColor="#7fe6ff" />
            <stop offset="45%" stopColor={irisColor} />
            <stop offset="74%" stopColor="#0b5f80" />
            <stop offset="90%" stopColor="#06364a" />
            <stop offset="100%" stopColor="#021018" />
          </radialGradient>
          <radialGradient id={`${id}-scl`} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0f3445" />
            <stop offset="100%" stopColor="#02090d" />
          </radialGradient>
          <radialGradient id={`${id}-shade`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000" stopOpacity={0} />
            <stop offset="62%" stopColor="#000" stopOpacity={0.05} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.9} />
          </radialGradient>
          <linearGradient id={`${id}-lid`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" stopOpacity={0.75} />
            <stop offset="34%" stopColor="#000" stopOpacity={0} />
            <stop offset="88%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.5} />
          </linearGradient>
          <radialGradient id={`${id}-amb`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glowColor} stopOpacity={0.22} />
            <stop offset="100%" stopColor={glowColor} stopOpacity={0} />
          </radialGradient>
          <filter id={`${id}-halo`} x="-50%" y="-200%" width="200%" height="500%">
            <feGaussianBlur stdDeviation={40 * u * size} />
          </filter>
          <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={3 * u * size} />
          </filter>
          <clipPath id={`${id}-clip`}>
            <path d={almond(a, Math.max(0.5, up), Math.max(0.5, lo))} transform={`translate(${px} ${py})`} />
          </clipPath>
        </defs>
        {visible && (
          <g transform={`translate(${zx} ${zy}) scale(${zoom * breathe}) translate(${-zx} ${-zy})`}>
            {/* frame-wide ambient glow (frame brightness rises with the eye) */}
            {!clear && <ellipse cx={px} cy={py} rx={EW * 1.1} ry={EH * 1.6} fill={`url(#${id}-amb)`} opacity={glowK} />}
            {/* halo */}
            <ellipse cx={px} cy={py} rx={a * 1.05} ry={Math.max(EH * 0.05, up) * 1.35} fill={glowColor} opacity={0.42 * glowK} filter={`url(#${id}-halo)`} />
            {/* skin: lid folds and scales lit by the glow */}
            <g opacity={glowK}>
              {[1, 2, 3, 4].map((k) => (
                <path
                  key={k}
                  d={almond(a * (1 + 0.05 * k), up * (1 + 0.1 * k) + EH * 0.055 * k, lo * (1 + 0.08 * k) + EH * 0.045 * k)}
                  transform={`translate(${px} ${py + k * EH * 0.01})`}
                  fill="none"
                  stroke={k === 1 ? '#3fa9d0' : '#1b5470'}
                  strokeWidth={(k === 1 ? 7 : 10 - k) * u * size}
                  opacity={k === 1 ? 0.75 : 0.5 - k * 0.08}
                  filter={`url(#${id}-soft)`}
                />
              ))}
              {scales &&
                iris.scl.map((s, i) => {
                  const ex = px + Math.cos(s.ang) * a * (0.95 + (s.band - 1) * 0.55);
                  const ey = py + Math.sin(s.ang) * (Math.max(up, EH * 0.18) + EH * (s.band - 1) * 0.9);
                  const ss = s.s * EW;
                  return <path key={i} d={`M${ex - ss} ${ey} Q${ex} ${ey - ss * 0.9} ${ex + ss} ${ey}`} fill="none" stroke="#3a8fb2" strokeWidth={2 * u * size} opacity={s.op * (2 - s.band) * 1.4} transform={`rotate(${s.rot} ${ex} ${ey})`} />;
                })}
            </g>
            {/* the eye inside the almond lids */}
            <g clipPath={`url(#${id}-clip)`}>
              <rect x={px - a} y={py - EH / 2} width={EW} height={EH} fill={`url(#${id}-scl)`} />
              {src ? (
                <foreignObject x={px - a} y={py - EH / 2} width={EW} height={EH}>
                  <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                </foreignObject>
              ) : (
                <g transform={`translate(${px + irisX} ${py + irisY})`}>
                  <circle r={IR} fill={`url(#${id}-iris)`} />
                  {iris.fibres.map((fb, i) => (
                    <line
                      key={i}
                      x1={Math.cos(fb.ang) * fb.r0 * IR}
                      y1={Math.sin(fb.ang) * fb.r0 * IR}
                      x2={Math.cos(fb.ang) * fb.r1 * IR}
                      y2={Math.sin(fb.ang) * fb.r1 * IR}
                      stroke={fb.light ? '#aef3ff' : '#02202c'}
                      strokeWidth={fb.wd * 2 * u * size}
                      opacity={fb.op}
                    />
                  ))}
                  {iris.dots.map((d, i) => (
                    <circle key={i} cx={Math.cos(d.ang) * d.rr * IR} cy={Math.sin(d.ang) * d.rr * IR} r={d.s * 2.6 * u * size} fill="#d8fbff" opacity={(0.35 + 0.5 * Math.max(0, Math.sin(t * Math.PI + d.ph))) * sparkle} />
                  ))}
                  <circle r={IR * 0.965} fill="none" stroke="#010a10" strokeWidth={IR * 0.07} opacity={0.85} />
                  {pupilPath ? (
                    <g>
                      <path d={pupilPath} fill="none" stroke={glowColor} strokeWidth={6 * u * size} opacity={0.55} filter={`url(#${id}-soft)`} />
                      <path d={pupilPath} fill="#010406" />
                    </g>
                  ) : (
                    <circle r={IR * 0.3 * contract * Math.min(3.5, dilate)} fill="#010406" stroke={glowColor} strokeWidth={4 * u * size} strokeOpacity={0.4} />
                  )}
                  <ellipse cx={-IR * 0.36} cy={-IR * 0.42} rx={IR * 0.12} ry={IR * 0.065} fill="#fff" opacity={0.8} transform={`rotate(-25 ${-IR * 0.36} ${-IR * 0.42})`} />
                  <circle cx={-IR * 0.2} cy={-IR * 0.5} r={IR * 0.025} fill="#fff" opacity={0.7} />
                </g>
              )}
              <rect x={px - a} y={py - EH / 2} width={EW} height={EH} fill={`url(#${id}-shade)`} />
              <rect x={px - a} y={py - up} width={EW} height={up + lo} fill={`url(#${id}-lid)`} />
            </g>
            {/* lid rims */}
            <path d={almond(a, up, lo)} transform={`translate(${px} ${py})`} fill="none" stroke="#071820" strokeWidth={8 * u * size} />
            <path d={almond(a, up, lo)} transform={`translate(${px} ${py})`} fill="none" stroke="#5fd2f2" strokeWidth={2 * u * size} opacity={0.5 * glowK} />
            {/* bright slit line at the very start */}
            {open < 0.25 && <line x1={px - a * 0.9} x2={px + a * 0.9} y1={py} y2={py} stroke="#bff6ff" strokeWidth={3 * u * size} opacity={(1 - open / 0.25) * prog(f, 0, 3, ease.out)} filter={`url(#${id}-soft)`} />}
          </g>
        )}
        {blackout > 0 && <rect width={w} height={h} fill={endColor} opacity={blackout} />}
      </Svg>
    </FxRoot>
  );
};

export const giantEyeReveal = defineMotion<Props>({
  id: 'giant-eye-reveal',
  title: 'Giant eye reveal',
  category: 'fx',
  description:
    'In darkness a huge reptilian eye opens from a cyan slit through an almond lid mask, with a glowing fibrous iris, contracting slit pupil and lit scales; ends with an exponential push into the pupil (or an eyelid close). Overlay-ready: background "transparent".',
  source: ['video23 87.1-90.5 giant-eye-reveal', 'video15 24.6-25.55 eye-zoom-match-cut', 'video17 eyelid-iris-close'],
  useFor: 'Creature reveals, "you are being watched" twists, dramatic awakenings, zoom-through-the-pupil transitions.',
  durationInFrames: 128,
  defaultProps: {
    background: '#020406',
    x: 0.5,
    y: 0.48,
    delay: 8,
    size: 1,
    openFrames: 39,
    holdFrames: 52,
    ending: 'push',
    pushFrames: 28,
    maxScale: 60,
    closeFrames: 9,
    irisColor: '#38C8F0',
    glowColor: '#38C8F0',
    pupil: 'slit',
    endColor: '#010406',
    src: '',
    scales: true,
    seed: 9,
  },
  propDocs: {
    background: "scene colour (near-black); 'transparent' = overlay",
    x: 'eye centre x (0..1)',
    y: 'eye centre y (0..1)',
    delay: 'frame the slit appears',
    size: 'eye size multiplier (1 = ~72 % of frame width in landscape)',
    openFrames: 'lid opening frames (39 = 1.3 s, easeOutCubic)',
    holdFrames: 'frames the open eye holds (pupil contracts, iris sparkles)',
    ending: 'push (exponential zoom into the pupil -> endColor) | close (lids squash shut) | hold',
    pushFrames: 'push duration (0.95 s = 28)',
    maxScale: 'final zoom of the push',
    closeFrames: 'close duration (0.3 s = 9)',
    irisColor: 'iris mid colour',
    glowColor: 'glow / halo colour',
    pupil: 'slit (reptile) | round',
    endColor: 'colour the push lands on (match-cut into the next scene)',
    src: 'optional public/ image shown inside the lids instead of the procedural iris',
    scales: 'draw lit scales around the eye',
    seed: 'random seed',
  },
  component: GiantEyeReveal,
  tags: ['eye', 'reveal', 'creature', 'horror', 'zoom', 'match-cut', 'glow', 'overlay', 'fx'],
});
