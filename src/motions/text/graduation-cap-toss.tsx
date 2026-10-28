import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {Confetti, EventStage, Glow, backOut, fitFont, mixHex, sparkPath} from '../../core/r3-events-kit';
import {defineMotion} from '../../core/types';

/**
 * Mortarboard caps are thrown up from below the frame in a spread, tumble and swing their tassels, then fall away while
 * confetti pops; "Congratulations", the graduate's name, the class line and a tagline pop onto the frame. A second, smaller
 * toss lands the finale.
 */
type Props = {
  headline: string;
  name: string;
  classLabel: string;
  subtitle: string;
  caps: number;
  colors: string[];
  cap: string;
  tassel: string;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  seed: number;
  startAt: number;
};

/** a mortarboard centred on (0,0), board half-width ~92 */
const Cap: React.FC<{cap: string; tassel: string; flip: number; sway: number}> = ({cap, tassel, flip, sway}) => {
  const under = flip < 0; // seen from below
  const body = under ? mixHex(cap, '#ffffff', 0.12) : cap;
  const edge = mixHex(cap, '#000000', 0.45);
  const fy = Math.max(0.14, Math.abs(flip));
  return (
    <g>
      {/* skull part (behind the board when seen from above, in front when seen from below) */}
      {!under && <path d="M-46 6L-46 44Q0 70 46 44L46 6Z" fill={mixHex(cap, '#000000', 0.25)} />}
      <g transform={`scale(1 ${fy})`}>
        <path d="M-96 6L0 48L96 6L96 16L0 58L-96 16Z" fill={edge} />
        <path d="M-96 0L0 -46L96 0L0 46Z" fill={body} stroke={edge} strokeWidth={3} strokeLinejoin="round" />
        <path d="M-60 0L0 -29L60 0" fill="none" stroke="#fff" strokeWidth={4} opacity={0.14} strokeLinecap="round" />
        {!under && <circle cx={0} cy={0} r={8} fill={tassel} />}
        {!under && (
          <g>
            <path d="M0 0Q50 -10 84 3" fill="none" stroke={tassel} strokeWidth={4.5} strokeLinecap="round" />
            <g transform={`translate(84 3) rotate(${sway})`}>
              <path d="M0 0L0 58" stroke={tassel} strokeWidth={4} strokeLinecap="round" />
              <rect x={-7} y={30} width={14} height={14} rx={4} fill={mixHex(tassel, '#000000', 0.15)} />
              {[-9, -4.5, 0, 4.5, 9].map((dx, i) => (
                <path key={i} d={`M${dx * 0.4} 44L${dx * 1.1} ${74 - Math.abs(dx)}`} stroke={tassel} strokeWidth={3.4} strokeLinecap="round" />
              ))}
            </g>
          </g>
        )}
      </g>
      {under && <path d="M-46 6L-46 44Q0 70 46 44L46 6Z" fill={mixHex(cap, '#000000', 0.1)} opacity={0.9} />}
    </g>
  );
};

const GraduationCapToss: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - p.startAt);
  const n = Math.max(1, Math.min(16, Math.round(p.caps)));
  const cols = p.colors && p.colors.length ? p.colors : [p.accent];

  const caps = (wave: number) => {
    const r = rng(p.seed * 101 + wave * 17 + 3);
    const count = wave === 0 ? n : Math.max(3, Math.round(n * 0.6));
    return Array.from({length: count}, (_, i) => ({
      xf: (i + 0.5) / count + (r() - 0.5) * (0.6 / count),
      launch: (wave === 0 ? 4 : 128) + i * 1.6 + r() * 7,
      hf: 0.5 + r() * 0.32,
      a: 33 + r() * 9,
      rz0: (r() - 0.5) * 60,
      spin: (r() - 0.5) * 11,
      flipRate: 0.1 + r() * 0.14,
      flipPh: r() * 6.28,
      drift: (r() - 0.5) * 80,
      sz: 0.82 + r() * 0.32,
      id: wave * 100 + i,
    }));
  };
  const all = [...caps(0), ...caps(1)];

  return (
    <EventStage background={p.background}>
      {(L) => {
        const {W, H, kind} = L;
        const cx = W / 2;
        const capS = kind === 'wide' ? 1.0 : kind === 'tall' ? 0.9 : 0.85;
        const cyT = kind === 'tall' ? H * 0.46 : kind === 'wide' ? H * 0.46 : H * 0.46;
        const maxW = W * (kind === 'wide' ? 0.74 : 0.88);
        const hFs = fitFont(p.headline.toUpperCase(), kind === 'wide' ? 128 : 124, maxW, 0.7);
        const nFs = fitFont(p.name, kind === 'wide' ? 190 : 200, maxW, 0.42);
        const cFs = fitFont(p.classLabel.toUpperCase(), 44, maxW * 0.8, 0.9);
        const sFs = fitFont(p.subtitle, 42, maxW, 0.52);

        const yH = cyT - nFs * 0.5 - hFs * 0.25;
        const yN = cyT + nFs * 0.25;
        const yC = yN + 96;
        const yS = yC + 78;
        const rise = (a: number, b = a + 18) => ease.out(prog(f, a, b, ease.linear));
        const pill = rise(66);
        const pillW = fitFont(p.classLabel.toUpperCase(), 44, maxW * 0.8, 0.9) * 0.9 * [...p.classLabel].length * 0.9 + 90;

        return (
          <g>
            {/* soft spotlight */}
            <Glow id="gct-spot" x={cx} y={cyT} r={Math.min(W, H) * 0.75} color="#ffffff" opacity={0.22 * rise(0, 30)} />

            {/* caps */}
            {all.map((c) => {
              const t = f - c.launch;
              if (t < 0) return null;
              const h = H * c.hf;
              const g = (2 * h) / (c.a * c.a);
              const y0 = H + 110;
              const y = y0 - g * c.a * t + 0.5 * g * t * t;
              if (y > H + 220) return null;
              const x = W * (0.06 + 0.88 * c.xf) + c.drift * Math.sin(Math.min(1, t / (2 * c.a)) * Math.PI * 0.5) * (t / (2 * c.a));
              const rz = c.rz0 + c.spin * t * 0.9;
              const flip = Math.cos(c.flipPh + t * c.flipRate);
              const sway = Math.sin(t * 0.3 + c.id) * 26;
              return (
                <g key={c.id} transform={`translate(${x} ${y}) rotate(${rz}) scale(${c.sz * capS})`}>
                  <Cap cap={p.cap} tassel={p.tassel} flip={flip} sway={sway} />
                </g>
              );
            })}

            {/* text */}
            <g>
              <g transform={`translate(${cx} ${yH}) scale(${backOut(prog(f, 36, 54, ease.linear), 1.9)}) translate(${-cx} ${-yH})`} opacity={Math.min(1, rise(36, 46) * 1.5)}>
                <text x={cx + 5} y={yH + 6} textAnchor="middle" fontFamily={fonts.display} fontSize={hFs} fill="#000" opacity={0.15}>
                  {p.headline.toUpperCase()}
                </text>
                <text x={cx} y={yH} textAnchor="middle" fontFamily={fonts.display} fontSize={hFs} fill={p.ink}>
                  {p.headline.toUpperCase()}
                </text>
              </g>
              <g transform={`translate(${cx} ${yN}) scale(${backOut(prog(f, 48, 68, ease.linear), 2)}) translate(${-cx} ${-yN})`} opacity={Math.min(1, rise(48, 58) * 1.5)}>
                <text x={cx + 4} y={yN + 6} textAnchor="middle" fontFamily={fonts.hand} fontWeight={700} fontSize={nFs} fill="#000" opacity={0.15}>
                  {p.name}
                </text>
                <text x={cx} y={yN} textAnchor="middle" fontFamily={fonts.hand} fontWeight={700} fontSize={nFs} fill={p.accent2}>
                  {p.name}
                </text>
              </g>
              <g transform={`translate(${cx} ${yC - 15}) scale(${pill}) translate(${-cx} ${-(yC - 15)})`} opacity={pill}>
                <rect x={cx - pillW / 2} y={yC - 48} width={pillW} height={70} rx={35} fill={p.accent} />
                <text x={cx} y={yC - 2} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={cFs} letterSpacing={cFs * 0.2} fill={p.ink}>
                  {p.classLabel.toUpperCase()}
                </text>
              </g>
              <text x={cx} y={yS + (1 - rise(84)) * 16} textAnchor="middle" fontFamily={fonts.serif} fontWeight={700} fontSize={sFs * 1.1} fill={p.ink} opacity={0.85 * rise(84)}>
                {p.subtitle}
              </text>
              {[0, 1, 2].map((i) => {
                const ph0 = ((f - 90 - i * 16) % 64) / 64;
                if (f < 90 || ph0 < 0) return null;
                const xs = [-0.3, 0.32, 0.02][i] * maxW;
                const ys = [-0.62, -0.5, 0.52][i] * nFs + cyT;
                return <path key={i} d={sparkPath(cx + xs, ys, 24 * Math.sin(ph0 * Math.PI))} fill={p.accent} />;
              })}
            </g>

            {/* confetti pops from both sides at each toss */}
            {[0, 128].map((w, i) => (
              <g key={i}>
                <Confetti x={W * 0.04} y={H * 0.96} t={f - w - 6} seed={p.seed + i * 3} colors={cols} n={50} power={34} spread={0.7} dir={-Math.PI * 0.36} gravity={0.5} life={100} size={1.1} />
                <Confetti x={W * 0.96} y={H * 0.96} t={f - w - 6} seed={p.seed + i * 3 + 1} colors={cols} n={50} power={34} spread={0.7} dir={-Math.PI * 0.64} gravity={0.5} life={100} size={1.1} />
              </g>
            ))}
            <Confetti x={cx} y={-60} t={f - 100} seed={p.seed + 9} colors={cols} n={80} power={5} spread={1.3} gravity={0.28} dir={Math.PI / 2} wide={W} life={150} size={1} />
          </g>
        );
      }}
    </EventStage>
  );
};

export const graduationCapToss = defineMotion<Props>({
  id: 'graduation-cap-toss',
  title: 'Graduation caps tossed in the air',
  category: 'text',
  description: 'Mortarboard caps are thrown up from below the frame, tumble with swinging tassels and fall away while confetti pops from both corners; Congratulations, the graduate name, a class pill and a tagline pop onto the frame, with a second smaller toss as finale.',
  source: ['original (round 3, events & celebrations)'],
  useFor: 'Graduation and commencement videos, school or bootcamp class announcements, "congrats graduates" posts, certificate and course-completion celebrations, alumni and yearbook intros. Set the name (or "Graduates"), class line and colours.',
  durationInFrames: 270,
  defaultProps: {
    headline: 'Congratulations',
    name: 'Jordan Lee',
    classLabel: 'Class of 2027',
    subtitle: 'The future is yours',
    caps: 9,
    colors: ['#E0A82E', '#D9534F', '#3B82C4', '#4FB58A', '#FFFFFF'],
    cap: '#1E2A4A',
    tassel: '#E0A82E',
    background: '#F4EBDD',
    ink: '#1E2A4A',
    accent: '#F2C14E',
    accent2: '#D9534F',
    seed: 5,
    startAt: 0,
  },
  propDocs: {
    headline: 'big line (Congratulations / Well done / Graduates)',
    name: 'graduate or group name, shown in script',
    classLabel: 'text in the gold pill (Class of 2027, Batch 12...)',
    subtitle: 'tagline under the pill',
    caps: 'caps in the first toss (1-16); the second toss uses about 60%',
    colors: 'confetti colours (array of hex)',
    cap: 'cap colour (hex)',
    tassel: 'tassel and button colour (hex)',
    background: 'frame colour (hex), or "transparent" to overlay content',
    ink: 'headline and tagline colour (hex)',
    accent: 'class pill colour (hex)',
    accent2: 'name colour (hex)',
    seed: 'seed for toss spread and confetti',
    startAt: 'frame the sequence begins',
  },
  component: GraduationCapToss,
  tags: ['graduation', 'cap', 'toss', 'congratulations', 'class', 'commencement', 'school', 'celebration', 'confetti', 'name', 'certificate', 'event', 'tassel'],
});
