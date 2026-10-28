import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {useSafeId} from '../../core/image-kit';
import {Confetti, EventStage, Firework, Glow, backOut, fitFont, mixHex, sparkPath, withAlpha} from '../../core/r3-events-kit';
import {defineMotion} from '../../core/types';

/**
 * A big 10 → 0 countdown inside a depleting ring (each number pops in and punches out), rockets start climbing for the last three
 * counts, and at zero a flash, a volley of fireworks and falling confetti reveal the year and a greeting.
 */
type Props = {
  from: number;
  tick: number;
  year: string;
  message: string;
  subtitle: string;
  caption: string;
  colors: string[];
  background: string;
  ink: string;
  accent: string;
  seed: number;
  startAt: number;
};

const BURSTS: [number, number, number][] = [
  [0, 0.5, 0.3],
  [7, 0.2, 0.34],
  [13, 0.8, 0.3],
  [24, 0.34, 0.2],
  [31, 0.68, 0.22],
  [44, 0.12, 0.52],
  [52, 0.9, 0.5],
  [66, 0.5, 0.16],
  [80, 0.28, 0.4],
  [92, 0.74, 0.42],
  [108, 0.5, 0.26],
  [124, 0.18, 0.24],
  [136, 0.84, 0.24],
];

const CountdownNewYear: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const uid = useSafeId('cny');
  const f = Math.max(0, frame - p.startAt);
  const bg = p.background === 'transparent' ? '#0A0E27' : p.background;
  const from = Math.max(1, Math.round(p.from));
  const tick = Math.max(10, Math.round(p.tick));
  const t0 = 14;
  const hit = t0 + from * tick;
  const since = f - hit;
  const cols = p.colors && p.colors.length ? p.colors : [p.accent];

  const R = rng(p.seed * 37 + 9);
  const stars = Array.from({length: 70}, () => ({x: R(), y: R() * 0.8, r: 1 + R() * 2.4, ph: R() * 6.28, sp: 0.04 + R() * 0.08}));

  return (
    <EventStage
      background={p.background}
      pre={(L) => (
        <g>
          {p.background !== 'transparent' && (
            <g>
              <defs>
                <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={mixHex(bg, '#000000', 0.3)} />
                  <stop offset="0.7" stopColor={bg} />
                  <stop offset="1" stopColor={mixHex(bg, cols[1 % cols.length], 0.28)} />
                </linearGradient>
              </defs>
              <rect width={L.w} height={L.h} fill={`url(#${uid}-sky)`} />
            </g>
          )}
          {stars.map((s, i) => (
            <circle key={i} cx={s.x * L.w} cy={s.y * L.h} r={s.r * L.S * 0.6} fill="#ffffff" opacity={ease.out(prog(f, 0, 30, ease.linear)) * (0.25 + 0.5 * (0.5 + 0.5 * Math.sin(f * s.sp + s.ph)))} />
          ))}
        </g>
      )}
    >
      {(L) => {
        const {W, H, kind} = L;
        const cx = W / 2;
        const cy = kind === 'tall' ? H * 0.44 : kind === 'wide' ? H * 0.5 : H * 0.5;
        const ringR = kind === 'wide' ? 330 : kind === 'tall' ? 360 : 330;
        const idx = Math.floor((f - t0) / tick); // 0-based count slot
        const num = from - idx;
        const local = f - t0 - idx * tick;
        const counting = f >= t0 && num >= 1;
        const intro = ease.out(prog(f, 0, 24, ease.linear));

        const shake = since >= 0 && since < 14 ? Math.sin(since * 2.6) * 10 * (1 - since / 14) : 0;
        const flash = since >= 0 ? 1 - prog(since, 0, 12, ease.out) : 0;

        // number punch
        const pop = backOut(prog(local, 0, 9, ease.linear), 2.2);
        const outK = prog(local, tick - 5, tick, ease.in);
        const numScale = (0.72 + 0.28 * pop) * (1 + 0.12 * outK);
        const numOp = Math.min(1, local / 3) * (1 - outK * 0.9);
        const numFs = kind === 'wide' ? 520 : kind === 'tall' ? 560 : 500;
        const fsFit = fitFont(String(num), numFs, ringR * 1.35, 0.7);

        // ring arc depletes in each count
        const circ = 2 * Math.PI * ringR;
        const arcFrac = counting ? 1 - local / tick : f < t0 ? 1 : 0;
        const lastThree = num <= 3 && num >= 1;
        const ringCol = lastThree ? cols[1 % cols.length] : p.accent;

        // year reveal
        const yearT = backOut(prog(since, 10, 30, ease.linear), 2.1);
        const yearFs = fitFont(p.year, kind === 'wide' ? 380 : 360, W * 0.86, 0.62);
        const yearY = cy + yearFs * 0.2;
        const msgFs = fitFont(p.message.toUpperCase(), kind === 'wide' ? 80 : 84, W * 0.86, 0.78);
        const subFs = fitFont(p.subtitle, 40, W * 0.84, 0.52);

        // zero
        const zeroT = prog(since, 0, 14, ease.out);

        return (
          <g transform={`translate(${shake} ${-shake * 0.5})`}>
            <Glow id={`${uid}-halo`} x={cx} y={cy} r={ringR * 2.3} color={ringCol} opacity={0.22 * intro + (since >= 0 ? 0.25 * (1 - prog(since, 0, 50, ease.linear)) : 0)} />

            {/* caption */}
            <text x={cx} y={cy - ringR - 56} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={fitFont(p.caption.toUpperCase(), 34, W * 0.86, 0.85)} letterSpacing={9} fill={p.ink} opacity={0.75 * intro * (1 - prog(since, 0, 8, ease.in))}>
              {p.caption.toUpperCase()}
            </text>

            {/* rings */}
            <g opacity={intro * (1 - prog(since, 0, 10, ease.in))}>
              {Array.from({length: 60}, (_, i) => {
                const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
                const big = i % 5 === 0;
                const r0 = ringR + 26;
                const r1 = r0 + (big ? 26 : 14);
                const on = i / 60 <= arcFrac + 0.0001;
                return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke={on ? ringCol : p.ink} strokeWidth={big ? 5 : 3} strokeLinecap="round" opacity={on ? 0.95 : 0.2} />;
              })}
              <circle cx={cx} cy={cy} r={ringR} fill="none" stroke={withAlpha(p.ink, 0.12)} strokeWidth={14} />
              <circle cx={cx} cy={cy} r={ringR} fill="none" stroke={ringCol} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${circ * Math.max(0.001, arcFrac)} ${circ}`} transform={`rotate(-90 ${cx} ${cy})`} />
            </g>

            {/* rockets for the finale */}
            {BURSTS.map(([d, bx, by], i) => {
              const launch = hit + d - 18 - (i === 0 ? 8 : 0);
              const tt = (f - launch) / (hit + d - launch);
              if (tt < 0 || tt > 1) return null;
              const x = bx * W + Math.sin(i * 3.1) * 14 * (1 - tt);
              const yEnd = by * H;
              const yy = H + 40 + (yEnd - H - 40) * ease.out(tt);
              const trailLen = 90;
              return (
                <g key={i} opacity={1 - tt * 0.3}>
                  <line x1={x} y1={yy} x2={x} y2={yy + trailLen * (1 - tt * 0.4)} stroke={cols[i % cols.length]} strokeWidth={4} strokeLinecap="round" opacity={0.7} />
                  <circle cx={x} cy={yy} r={6} fill="#fff" />
                </g>
              );
            })}

            {/* the number */}
            {counting && (
              <g transform={`translate(${cx} ${cy}) scale(${numScale}) translate(${-cx} ${-cy})`} opacity={numOp * intro}>
                <text x={cx + 8} y={cy + fsFit * 0.34 + 10} textAnchor="middle" fontFamily={fonts.display} fontSize={fsFit} fill="#000" opacity={0.28}>
                  {num}
                </text>
                <text x={cx} y={cy + fsFit * 0.34} textAnchor="middle" fontFamily={fonts.display} fontSize={fsFit} fill={lastThree ? mixHex(p.ink, ringCol, 0.55) : p.ink}>
                  {num}
                </text>
              </g>
            )}
            {since >= 0 && since < 18 && (
              <g transform={`translate(${cx} ${cy}) scale(${1 + zeroT * 1.6}) translate(${-cx} ${-cy})`} opacity={1 - zeroT}>
                <text x={cx} y={cy + fsFit * 0.34} textAnchor="middle" fontFamily={fonts.display} fontSize={fsFit} fill={p.accent}>
                  0
                </text>
              </g>
            )}

            {/* fireworks volley */}
            {BURSTS.map(([d, bx, by], i) => (
              <Firework key={i} x={bx * W} y={by * H} t={since - d} color={cols[i % cols.length]} color2={cols[(i + 1) % cols.length]} seed={p.seed + i * 3} size={kind === 'tall' ? 1.0 : 1.15} n={46} life={70} />
            ))}
            {/* ring burst on zero */}
            {since >= 0 && since < 30 && <circle cx={cx} cy={cy} r={ringR + since * 34} fill="none" stroke={p.accent} strokeWidth={14 * (1 - since / 30)} opacity={1 - since / 30} />}

            {/* year + message */}
            {since >= 10 && (
              <g>
                <defs>
                  <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={mixHex(p.accent, '#ffffff', 0.55)} />
                    <stop offset="0.55" stopColor={p.accent} />
                    <stop offset="1" stopColor={mixHex(p.accent, cols[1 % cols.length], 0.6)} />
                  </linearGradient>
                </defs>
                <g transform={`translate(${cx} ${yearY}) scale(${yearT}) translate(${-cx} ${-yearY})`} opacity={Math.min(1, yearT * 1.4)}>
                  <text x={cx + 8} y={yearY + 10} textAnchor="middle" fontFamily={fonts.display} fontSize={yearFs} fill="#000" opacity={0.3}>
                    {p.year}
                  </text>
                  <text x={cx} y={yearY} textAnchor="middle" fontFamily={fonts.display} fontSize={yearFs} fill={`url(#${uid}-gold)`}>
                    {p.year}
                  </text>
                </g>
                <g opacity={ease.out(prog(since, 30, 52, ease.linear))} transform={`translate(0 ${(1 - ease.out(prog(since, 30, 52, ease.linear))) * 30})`}>
                  <text x={cx} y={yearY + msgFs * 1.35 + yearFs * 0.1} textAnchor="middle" fontFamily={fonts.display} fontSize={msgFs} letterSpacing={msgFs * 0.06} fill={p.ink}>
                    {p.message.toUpperCase()}
                  </text>
                  <text x={cx} y={yearY + msgFs * 1.35 + yearFs * 0.1 + subFs * 2} textAnchor="middle" fontFamily={fonts.sans} fontWeight={600} fontSize={subFs} fill={p.ink} opacity={0.8}>
                    {p.subtitle}
                  </text>
                </g>
              </g>
            )}

            {/* sparkles around the year */}
            {since > 20 &&
              [0, 1, 2, 3, 4].map((i) => {
                const ph = ((since - 20 - i * 14) % 60) / 60;
                if (ph < 0) return null;
                const sx = cx + [-0.34, 0.36, -0.18, 0.2, 0.0][i] * W;
                const sy = cy + [-0.2, -0.12, 0.2, -0.26, 0.02][i] * H;
                return <path key={i} d={sparkPath(sx, sy, 26 * Math.sin(ph * Math.PI))} fill={mixHex(p.accent, '#ffffff', 0.5)} />;
              })}

            <Confetti x={cx} y={-150} t={since - 18} seed={p.seed + 5} colors={cols.concat([p.ink])} n={110} power={9} spread={1.2} gravity={0.3} dir={Math.PI / 2} wide={W} life={170} size={1.1} />
            {flash > 0 && <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="#ffffff" opacity={flash * 0.7} />}
            {/* intro scrim fade */}
            {clamp(f / 1) < 0 && null}
          </g>
        );
      }}
    </EventStage>
  );
};

export const countdownNewYear = defineMotion<Props>({
  id: 'countdown-new-year',
  title: 'New-year countdown with fireworks finale',
  category: 'text',
  description: 'A big 10 to 0 countdown inside a depleting tick ring (each number pops in and punches out); rockets climb for the last three counts, then a flash, a firework volley and falling confetti reveal the year and a greeting.',
  source: ['original (round 3, events & celebrations)'],
  useFor: 'New-year countdowns, product-launch and live-stream countdowns, sale starts, "going live in 10" intros, festival openers, midnight reveals. Set `year`, `message`, `from` (start number) and `tick` (frames per number).',
  durationInFrames: 400,
  defaultProps: {
    from: 10,
    tick: 22,
    year: '2027',
    message: 'Happy New Year',
    subtitle: 'Wishing you a bright start',
    caption: 'Counting down to midnight',
    colors: ['#FFC857', '#FF4F9A', '#5BD1FF', '#9CFF8A'],
    background: '#0A0E27',
    ink: '#FFFFFF',
    accent: '#FFC857',
    seed: 6,
    startAt: 0,
  },
  propDocs: {
    from: 'number the countdown starts from',
    tick: 'frames each number stays (30 = one second)',
    year: 'big text revealed at zero (a year, "GO!", "LIVE"…)',
    message: 'greeting under the year',
    subtitle: 'small line under the greeting',
    caption: 'small line above the ring while counting',
    colors: 'firework / confetti colours (array of hex)',
    background: 'night-sky base colour (hex), or "transparent" to overlay content',
    ink: 'text colour (hex)',
    accent: 'ring, zero and year colour (hex)',
    seed: 'seed for stars and firework patterns',
    startAt: 'frame the sequence begins',
  },
  component: CountdownNewYear,
  tags: ['countdown', 'new-year', 'fireworks', 'celebration', 'timer', 'midnight', 'launch', 'live', 'event', 'confetti', 'year', 'finale'],
});
