import React from 'react';
import {Easing} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {FxRoot, isClear, useFx} from '../../core/fx-kit';
import {n2, rng, range} from '../../core/random';
import {Svg} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {EXTRA_EYES, EyeGlyph} from '../../core/r2-e1-eyes';

/**
 * video17 character-eyes: two black vertical ovals (~0.16 of the ball diameter tall) with a tiny white
 * catch-light; blink scaleY 1 -> 0.1 -> 1 over 5 f, saccade +-15 px in 3 f then hold, switch to happy
 * "^ ^" arcs, hop with anticipation squash.
 * video2 eye-look-blink: pupils jump between look targets (2-frame easeOutExpo saccade, 0.25-0.35 s
 * holds), lids close in 2 f / hold 1 / open in 3.
 * video21 watching-eyes-in-dark: pairs of glowing green almond eyes (#4CB040, #C8F0A0 core, dark slit
 * pupil) 40-110 px, fading in over 0.3 s staggered ~0.4 s apart, each blinking 1 -> 0.1 -> 1 over 4 f
 * occasionally, drifting slightly.
 */
type Look = {at: number; x: number; y: number};
type Props = {
  background: string;
  variant: 'character' | 'watching';
  x: number;
  y: number;
  delay: number;
  eyeStyle: 'oval' | 'sclera' | 'happy' | 'closed' | 'sleepy' | 'narrow' | 'angry' | 'determined' | 'sad' | 'teary' | 'cry' | 'heart' | 'x' | 'swirl' | 'spark' | 'shades' | 'scared' | 'dot';
  /** [left, right] eye styles for mismatched pairs (e.g. ['oval','x']); [] = both use eyeStyle */
  eyes: string[];
  size: number;
  spacing: number;
  color: string;
  blinks: number[];
  looks: Look[];
  maxOffset: number;
  happyAt: number;
  happyFor: number;
  hop: boolean;
  showSubject: boolean;
  subjectColor: string;
  count: number;
  stagger: number;
  region: number[];
  glowColor: string;
  coreColor: string;
  seed: number;
};

const expoOut = Easing.bezier(0.19, 1, 0.22, 1);

/** blink openness 1 -> 0.1 -> 1: close 2 f, hold 1, open 2 f */
const blinkAt = (f: number, times: number[]) => {
  let k = 1;
  for (const t of times) {
    const a = f - t;
    if (a < 0 || a > 5) continue;
    const v = a < 2 ? 1 - 0.45 * a : a < 3 ? 0.1 : 0.1 + 0.45 * (a - 3);
    k = Math.min(k, clamp(v, 0.1, 1));
  }
  return k;
};

const lookAt = (f: number, looks: Look[], sacc = 3) => {
  let x = 0;
  let y = 0;
  for (const l of [...looks].sort((a, b) => a.at - b.at)) {
    if (f < l.at) break;
    const t = expoOut(clamp((f - l.at) / sacc));
    x = x + (l.x - x) * t;
    y = y + (l.y - y) * t;
  }
  return {x, y};
};

const Character: React.FC<Props & {f: number; frame: number; u: number; px: number; py: number; clear: boolean}> = (p) => {
  const {f, frame, u, px, py, clear, eyeStyle, size, spacing, color, blinks, looks, maxOffset, happyAt, happyFor, hop, showSubject, subjectColor, seed, eyes: eyePair} = p;
  const R = 220 * u * size;
  const happy = f >= happyAt && f < happyAt + happyFor;
  // hop with squash around the happy moment
  const hf = f - happyAt;
  let lift = 0;
  let sx = 1;
  let sy = 1;
  if (hop && hf >= -5 && hf < 20) {
    if (hf < 0) {
      const c = prog(hf, -5, 0, ease.inOut);
      sx = 1 + 0.12 * c;
      sy = 1 - 0.14 * c;
    } else if (hf < 14) {
      const t = hf / 14;
      lift = Math.sin(t * Math.PI) * 90 * u * size;
      sx = 1 - 0.06 * Math.sin(t * Math.PI);
      sy = 1 + 0.08 * Math.sin(t * Math.PI);
    } else {
      const c = Math.sin(((hf - 14) / 6) * Math.PI);
      sx = 1 + 0.1 * c;
      sy = 1 - 0.1 * c;
    }
  }
  const idle = Math.sin(frame * 0.09) * 3 * u;
  const lk = lookAt(f, looks);
  const open = blinkAt(f, blinks);
  const off = maxOffset * u * size;
  const ew = 50 * u * size;
  const eh = 92 * u * size;
  const gap = 92 * u * size * spacing;
  const cy = py - lift + idle;
  const eyeY = cy - R * 0.08 + lk.y * off;
  const eyes = [-1, 1].map((sd) => {
    const ex = px + sd * gap + lk.x * off;
    // eyes squeeze slightly as they move toward the ball's edge (3D turn)
    const squeeze = 1 - 0.18 * Math.abs(lk.x) * (Math.sign(lk.x) === sd ? 1 : 0.4);
    if (happy) {
      return <path key={sd} d={`M${ex - ew * 0.75} ${eyeY + eh * 0.12} Q${ex} ${eyeY - eh * 0.55} ${ex + ew * 0.75} ${eyeY + eh * 0.12}`} fill="none" stroke={color} strokeWidth={13 * u * size} strokeLinecap="round" />;
    }
    const kind = eyePair.length ? eyePair[sd < 0 ? 0 : 1] ?? eyeStyle : eyeStyle;
    if (EXTRA_EYES.includes(kind)) {
      const blinkK = kind === 'sleepy' ? 1 : open;
      return (
        <g key={sd} transform={`translate(${ex} ${eyeY}) scale(${squeeze} ${blinkK})`}>
          <EyeGlyph kind={kind} ew={ew} eh={eh} k={u * size} color={color} open={open} sd={sd} id={`eb-${seed}-${sd}`} frame={frame} />
        </g>
      );
    }
    if (kind === 'sclera') {
      const sw = ew * 1.25;
      const shh = eh * 0.75;
      const lid = 1 - open;
      return (
        <g key={sd}>
          <clipPath id={`eb-cl-${seed}-${sd}`}>
            <ellipse cx={px + sd * gap} cy={cy - R * 0.08} rx={sw} ry={shh} />
          </clipPath>
          <ellipse cx={px + sd * gap} cy={cy - R * 0.08} rx={sw} ry={shh} fill="#fff" stroke={color} strokeWidth={5 * u * size} />
          <g clipPath={`url(#eb-cl-${seed}-${sd})`}>
            <circle cx={px + sd * gap + lk.x * sw * 0.45} cy={cy - R * 0.08 + lk.y * shh * 0.4} r={sw * 0.5} fill={color} />
            <circle cx={px + sd * gap + lk.x * sw * 0.45 + sw * 0.17} cy={cy - R * 0.08 + lk.y * shh * 0.4 - sw * 0.18} r={sw * 0.14} fill="#fff" />
            <rect x={px + sd * gap - sw * 1.2} y={cy - R * 0.08 - shh * 1.1} width={sw * 2.4} height={shh * 2.2 * lid} fill={clear ? '#e9d3b8' : subjectColor} />
          </g>
          {lid > 0.05 && <line x1={px + sd * gap - sw} x2={px + sd * gap + sw} y1={cy - R * 0.08 - shh + shh * 2 * lid} y2={cy - R * 0.08 - shh + shh * 2 * lid} stroke={color} strokeWidth={5 * u * size} strokeLinecap="round" />}
          <ellipse cx={px + sd * gap} cy={cy - R * 0.08} rx={sw} ry={shh} fill="none" stroke={color} strokeWidth={5 * u * size} />
        </g>
      );
    }
    return (
      <g key={sd} transform={`translate(${ex} ${eyeY}) scale(${squeeze} ${open})`}>
        <ellipse rx={ew / 2} ry={eh / 2} fill={color} />
        <circle cx={ew * 0.12} cy={-eh * 0.22} r={ew * 0.2} fill="#fff" />
      </g>
    );
  });
  return (
    <g>
      {showSubject && !clear && (
        <g>
          <ellipse cx={px} cy={py + R * 1.12} rx={R * 0.85 * (1 - lift / (400 * u))} ry={R * 0.1} fill="#0B0D0C" opacity={0.12} />
          <g transform={`translate(${px} ${py + R + idle - lift}) scale(${sx} ${sy}) translate(${-px} ${-(py + R)})`}>
            <circle cx={px} cy={py} r={R} fill={subjectColor} />
            {happy && [-1, 1].map((sd) => <ellipse key={sd} cx={px + sd * gap * 1.55} cy={py + R * 0.12} rx={R * 0.13} ry={R * 0.07} fill="#F7A7CC" opacity={0.7} />)}
          </g>
        </g>
      )}
      <g transform={`translate(${px} ${cy + R * 0.0}) scale(${sx} ${sy}) translate(${-px} ${-cy})`}>{eyes}</g>
    </g>
  );
};

const Watching: React.FC<Props & {f: number; frame: number; u: number; w: number; h: number; clear: boolean}> = (p) => {
  const {f, frame, u, w, h, clear, size, count, stagger, region, glowColor, coreColor, showSubject, seed} = p;
  const [x0, y0, x1, y1] = region.length === 4 ? region : [0.5, 0.1, 0.96, 0.9];
  const pairs = React.useMemo(() => {
    const r = rng(seed * 313 + 1);
    const out: {x: number; y: number; s: number; tilt: number; ph: number; bl: number}[] = [];
    let tries = 0;
    while (out.length < count && tries < 400) {
      tries++;
      const s = range(r, 40, 110) * u * size;
      const m = s * 1.9;
      const x = Math.min(w - m, Math.max(m, (x0 + (x1 - x0) * r()) * w));
      const y = (y0 + (y1 - y0) * r()) * h;
      const ok = out.every((o) => Math.abs(o.x - x) > (o.s + s) * 1.6 && Math.abs(o.y - y) > (o.s + s) * 0.5) || out.every((o) => Math.hypot(o.x - x, (o.y - y) * 2) > (o.s + s) * 2.2);
      if (!ok) continue;
      out.push({x, y, s, tilt: range(r, 4, 12), ph: r() * 6.28, bl: Math.floor(r() * 75)});
    }
    // bigger (nearer) eyes appear later
    return out.sort((a, b) => a.s - b.s);
  }, [seed, count, x0, x1, y0, y1, w, h, u, size]);
  const t = frame / 30;
  const glance = Math.sin(t * 0.9) * 0.7 + n2('wg' + seed, t * 0.5, 0) * 0.3;
  return (
    <g>
      <defs>
        <radialGradient id={`we-iris-${seed}`} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor={coreColor} />
          <stop offset="55%" stopColor={glowColor} />
          <stop offset="100%" stopColor="#1d5a18" />
        </radialGradient>
        <filter id={`we-glow-${seed}`} x="-100%" y="-200%" width="300%" height="500%">
          <feGaussianBlur stdDeviation={10 * u * size} />
        </filter>
        <radialGradient id={`we-fog-${seed}`} cx="30%" cy="80%" r="80%">
          <stop offset="0%" stopColor="#1b2a22" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#05070a" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`we-lamp-${seed}`}>
          <stop offset="0%" stopColor="#ffcf7a" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#ffcf7a" stopOpacity={0} />
        </radialGradient>
      </defs>
      {showSubject && !clear && (
        <g>
          <rect width={w} height={h} fill={`url(#we-fog-${seed})`} />
          {/* wind streaks */}
          {Array.from({length: 14}, (_, i) => {
            const r = rng(seed * 11 + i);
            const yy = r() * h;
            const sp = range(r, 300, 700) * u;
            const len = range(r, 60, 180) * u;
            const xx = ((r() * w + t * sp) % (w + len * 2)) - len;
            return <line key={i} x1={xx} y1={yy} x2={xx + len} y2={yy + len * 0.05} stroke="#cfe3d6" strokeWidth={2 * u} opacity={0.08 + r() * 0.08} strokeLinecap="round" />;
          })}
          {/* lone figure with a lantern, lower left */}
          <g transform={`translate(${w * 0.2} ${h * 0.86})`}>
            <circle cx={70 * u} cy={-120 * u} r={180 * u * (0.95 + 0.05 * Math.sin(frame * 0.7))} fill={`url(#we-lamp-${seed})`} />
            <path d={`M${-60 * u} 0 Q${-50 * u} ${-140 * u} ${-20 * u} ${-190 * u} Q0 ${-230 * u} ${20 * u} ${-190 * u} Q${50 * u} ${-140 * u} ${60 * u} 0 Z`} fill="#0a0d10" />
            <circle cx={0} cy={-205 * u} r={30 * u} fill="#0a0d10" />
            <line x1={40 * u} y1={-120 * u} x2={70 * u} y2={-120 * u} stroke="#0a0d10" strokeWidth={8 * u} />
            <rect x={60 * u} y={-136 * u} width={22 * u} height={30 * u} rx={4 * u} fill="#ffd690" />
          </g>
          <rect x={0} y={h * 0.86} width={w} height={h * 0.14} fill="#07090b" />
        </g>
      )}
      {pairs.map((pr, i) => {
        const tIn = i * stagger;
        const a = f - tIn;
        if (a < 0) return null;
        const op = prog(a, 0, 9, ease.out) * (0.85 + 0.15 * Math.sin(frame * 0.3 + pr.ph));
        const bk = (frame + pr.bl) % 75;
        const open = bk < 4 ? [0.55, 0.1, 0.1, 0.55][bk] : 1;
        const dx = Math.sin(t * 0.5 + pr.ph) * 6 * u;
        const dy = Math.cos(t * 0.4 + pr.ph) * 4 * u;
        const ew = pr.s;
        const ehh = ew * 0.42;
        const gap = ew * 1.25;
        const almond = `M${-ew / 2} 0 C${-ew / 4} ${-ehh * 1.25} ${ew / 4} ${-ehh * 1.25} ${ew / 2} 0 C${ew / 4} ${ehh * 1.05} ${-ew / 4} ${ehh * 1.05} ${-ew / 2} 0 Z`;
        return (
          <g key={i} opacity={op} transform={`translate(${pr.x + dx} ${pr.y + dy})`}>
            {[-1, 1].map((sd) => (
              <g key={sd} transform={`translate(${sd * gap} 0) rotate(${sd * pr.tilt}) scale(1 ${open})`}>
                <path d={almond} fill={glowColor} filter={`url(#we-glow-${seed})`} opacity={0.75} />
                <path d={almond} fill={`url(#we-iris-${seed})`} />
                <ellipse cx={glance * ew * 0.18} cy={0} rx={ew * 0.07} ry={ehh * 0.85} fill="#04120a" />
                <circle cx={glance * ew * 0.18 + ew * 0.14} cy={-ehh * 0.3} r={ew * 0.05} fill="#f4ffe8" opacity={0.85} />
              </g>
            ))}
          </g>
        );
      })}
    </g>
  );
};

const EyesBlink: React.FC<Props> = (p) => {
  const {x, y, delay, variant} = p;
  const background = p.background === 'auto' ? (variant === 'watching' ? '#05070a' : '#EEEBDE') : p.background;
  const {f, frame, u, w, h, px, py} = useFx(x, y, delay);
  const clear = isClear(background);
  return (
    <FxRoot background={background}>
      <Svg>
        {variant === 'watching' ? <Watching {...p} f={f} frame={frame} u={u} w={w} h={h} clear={clear} /> : <Character {...p} size={p.size * (h > w ? 1.7 : 1)} f={f} frame={frame} u={u} px={px} py={py} clear={clear} />}
      </Svg>
    </FxRoot>
  );
};

export const eyesBlink = defineMotion<Props>({
  id: 'eyes-blink',
  title: 'Eyes blink & look',
  category: 'fx',
  description:
    'A pair of cartoon eyes on a red ball blinks, darts between look targets and switches to happy ^ ^ arcs with a squash hop; watching variant fills dark negative space with staggered glowing green eye pairs. Overlay-ready: background "transparent".',
  source: ['video17 34.5-38.7 character-eyes', 'video2 eye-look-blink', 'video21 watching-eyes-in-dark'],
  useFor: 'Give any shape, logo or object a personality; suspense / "being watched" beats in dark scenes.',
  durationInFrames: 120,
  defaultProps: {
    background: 'auto',
    variant: 'character',
    x: 0.5,
    y: 0.47,
    delay: 0,
    eyeStyle: 'oval',
    eyes: [],
    size: 1,
    spacing: 1,
    color: '#0B0D0C',
    blinks: [12, 58, 104],
    looks: [
      {at: 22, x: -1, y: 0},
      {at: 36, x: 1, y: -0.3},
      {at: 66, x: 0, y: 0.4},
      {at: 74, x: 0, y: 0},
    ],
    maxOffset: 40,
    happyAt: 80,
    happyFor: 26,
    hop: true,
    showSubject: true,
    subjectColor: '#ED3821',
    count: 8,
    stagger: 12,
    region: [0.5, 0.1, 0.95, 0.8],
    glowColor: '#4CB040',
    coreColor: '#C8F0A0',
    seed: 8,
  },
  propDocs: {
    background: "'auto' = cream (character) or near-black (watching); any colour; 'transparent' = overlay",
    variant: 'character (one pair that blinks / looks / smiles) | watching (field of glowing eye pairs in the dark)',
    x: 'character: eye-pair centre x (0..1)',
    y: 'character: eye-pair centre y (0..1)',
    delay: 'frame offset for the whole timeline',
    eyeStyle: 'oval (v17 black ovals) | sclera (v2 white eyes with moving pupils and lids) | round-2 eye library: happy closed sleepy narrow angry determined sad teary cry heart x swirl spark shades scared dot',
    eyes: "[left, right] eye styles for mismatched pairs, e.g. ['oval','x'] or ['heart','heart']; [] = both use eyeStyle",
    size: 'size multiplier',
    spacing: 'distance between the two eyes multiplier',
    color: 'eye / ink colour',
    blinks: 'frames (after delay) at which the eyes blink',
    looks: 'saccade schedule [{at, x, y}] with x,y in -1..1 of maxOffset',
    maxOffset: 'look offset in u at x/y = 1',
    happyAt: 'frame the eyes switch to happy arcs (-1 = never)',
    happyFor: 'frames the happy arcs hold',
    hop: 'squash-and-stretch hop when happy (scene mode)',
    showSubject: 'draw the ball (character) or the fog, wind and lantern figure (watching) — scene mode only',
    subjectColor: 'ball colour (also lid colour for sclera eyes)',
    count: 'watching: number of eye pairs',
    stagger: 'watching: frames between pairs appearing (~0.4 s)',
    region: 'watching: [x0, y0, x1, y1] area (0..1) the pairs scatter in',
    glowColor: 'watching: eye glow colour',
    coreColor: 'watching: bright iris core colour',
    seed: 'random seed',
  },
  component: EyesBlink,
  tags: ['eyes', 'blink', 'look', 'character', 'cute', 'horror', 'watching', 'overlay', 'fx', 'eye library', 'expressions', 'emotion', 'angry', 'sad', 'tears', 'heart eyes', 'dizzy', 'sunglasses', 'sleepy', 'mismatched'],
});
