import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {useSafeId} from '../../core/image-kit';
import {EventStage, Glow, backOut, fitFont, heartPath, leafPath, mixHex, sparkPath, withAlpha} from '../../core/r3-events-kit';
import {wrapText} from '../../core/r3-social';
import {defineMotion} from '../../core/types';

/**
 * A greeting card slides in closed, swings open on its spine, and the greeting, message and signature write onto the inside page
 * while a seasonal motif (snow / leaves / lights / hearts) drifts around the card and decorates the cover and the left page.
 */
type Motif = 'snow' | 'leaves' | 'lights' | 'hearts';
type Props = {
  greeting: string;
  message: string;
  signature: string;
  coverText: string;
  motif: Motif | string;
  background: string;
  card: string;
  ink: string;
  accent: string;
  accent2: string;
  seed: number;
  startAt: number;
};

/** motif emblem centred on (0,0) with radius r */
const Emblem: React.FC<{motif: string; r: number; c1: string; c2: string; t: number; f: number; idp: string}> = ({motif, r, c1, c2, t, f, idp}) => {
  const k = backOut(t, 1.6);
  if (k <= 0) return null;
  if (motif === 'leaves') {
    return (
      <g transform={`scale(${k}) translate(0 ${r * 0.5})`}>
        {[-62, -31, 0, 31, 62].map((a, i) => (
          <g key={i} transform={`rotate(${a - 90 + 90})`}>
            <g transform={`rotate(-90) scale(${1 - Math.abs(a) / 220})`}>
              <path d={leafPath(r * 1.35, r * 0.34)} fill={i % 2 ? c1 : c2} stroke={c1} strokeWidth={r * 0.03} strokeLinejoin="round" />
              <path d={`M0 0L${r * 1.15} 0`} stroke={mixHex(c1, '#000000', 0.3)} strokeWidth={r * 0.03} opacity={0.6} />
            </g>
          </g>
        ))}
        <circle r={r * 0.08} fill={c1} />
      </g>
    );
  }
  if (motif === 'lights') {
    const cols = [c1, c2, '#FFC857', '#5BC8F5', '#FF8FB1'];
    const pts = [-0.9, -0.45, 0, 0.45, 0.9].map((x) => [x * r, -r * 0.05 + (1 - Math.abs(x) ** 2) * r * 0.28] as const);
    return (
      <g transform={`scale(${k})`}>
        <path d={`M${-r * 1.1} ${-r * 0.5}Q0 ${r * 0.3} ${r * 1.1} ${-r * 0.5}`} fill="none" stroke={mixHex(c1, '#000000', 0.35)} strokeWidth={r * 0.03} />
        {pts.map(([x, y], i) => {
          const on = 0.55 + 0.45 * Math.sin(f * 0.22 + i * 1.6);
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <Glow id={`${idp}-${i}`} x={0} y={r * 0.3} r={r * 0.42} color={cols[i % 5]} opacity={on * 0.6} />
              <rect x={-r * 0.05} y={-r * 0.0} width={r * 0.1} height={r * 0.1} fill="#555" />
              <path d={`M0 ${r * 0.08}C${r * 0.2} ${r * 0.1} ${r * 0.2} ${r * 0.5} 0 ${r * 0.52}C${-r * 0.2} ${r * 0.5} ${-r * 0.2} ${r * 0.1} 0 ${r * 0.08}Z`} fill={cols[i % 5]} opacity={0.5 + 0.5 * on} />
              <ellipse cx={-r * 0.06} cy={r * 0.25} rx={r * 0.03} ry={r * 0.07} fill="#fff" opacity={0.6} />
            </g>
          );
        })}
      </g>
    );
  }
  if (motif === 'hearts') {
    return (
      <g transform={`scale(${k * (1 + 0.04 * Math.sin(f * 0.18))})`}>
        <path d={heartPath(0, 0, r * 0.75)} fill={c1} />
        <path d={heartPath(-r * 0.7, -r * 0.55, r * 0.28)} fill={c2} transform={`rotate(-18 ${-r * 0.7} ${-r * 0.55})`} />
        <path d={heartPath(r * 0.72, -r * 0.45, r * 0.22)} fill={c2} opacity={0.85} transform={`rotate(16 ${r * 0.72} ${-r * 0.45})`} />
        <ellipse cx={-r * 0.35} cy={-r * 0.25} rx={r * 0.12} ry={r * 0.07} fill="#fff" opacity={0.4} transform={`rotate(-30 ${-r * 0.35} ${-r * 0.25})`} />
      </g>
    );
  }
  // snow
  return (
    <g transform={`scale(${k}) rotate(${f * 0.2})`} stroke={c1} strokeWidth={r * 0.05} strokeLinecap="round" fill="none">
      {Array.from({length: 6}, (_, i) => (
        <g key={i} transform={`rotate(${i * 60})`}>
          <path d={`M0 0L0 ${-r}`} />
          <path d={`M0 ${-r * 0.45}L${r * 0.22} ${-r * 0.68}M0 ${-r * 0.45}L${-r * 0.22} ${-r * 0.68}`} />
          <path d={`M0 ${-r * 0.72}L${r * 0.16} ${-r * 0.9}M0 ${-r * 0.72}L${-r * 0.16} ${-r * 0.9}`} />
          <circle cx={0} cy={-r * 1.04} r={r * 0.04} fill={c2} stroke="none" />
        </g>
      ))}
      <circle r={r * 0.12} fill={c2} stroke="none" />
    </g>
  );
};

const HolidayGreetingCard: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const uid = useSafeId('hgc');
  const f = Math.max(0, frame - p.startAt);
  const motif = ['snow', 'leaves', 'lights', 'hearts'].includes(p.motif) ? p.motif : 'snow';
  const bg = p.background === 'transparent' ? '#1F3B4D' : p.background;

  const R = rng(p.seed * 23 + 1);
  const parts = Array.from({length: 30}, () => ({x: R(), ph: R(), s: 10 + R() * 18, sp: 0.4 + R() * 0.8, sw: 20 + R() * 60, rot: R() * 360, k: R()}));
  const partCol = (k: number) => mixHex(p.card, p.background === 'transparent' ? '#1F3B4D' : bg, 0.2 + k * 0.25);
  const leafCols = [p.accent, '#E8963C', '#C9A227', p.accent2];

  return (
    <EventStage background={p.background}>
      {(L) => {
        const {W, H, kind} = L;
        const pw = kind === 'wide' ? 500 : kind === 'square' ? 420 : 410;
        const ph = kind === 'wide' ? 700 : kind === 'square' ? 620 : 860;
        const top = (H - ph) / 2 + (kind === 'tall' ? 20 : 20);
        const cx = W / 2;
        const enter = ease.out(prog(f, 0, 34, ease.linear));
        const open = ease.inOut(prog(f, 52, 118, ease.linear));
        const theta = open * Math.PI;
        const cs = Math.cos(theta);
        const spine = cx - (pw / 2) * (1 - open);
        const bob = (1 - enter) * 220 + Math.sin(f * 0.07) * 4 * (1 - open);
        const tiltIn = (1 - enter) * -6;
        const persp = 0.05 * Math.sin(theta);
        const front = theta < Math.PI / 2;
        const sx = front ? cs : -cs;
        const tx = spine;
        const ptxt = spine + pw / 2;
        const gx = ptxt;

        const gFs = fitFont(p.greeting, 92, pw - 70, 0.4);
        const msgSz = kind === 'wide' ? 33 : 30;
        const msgLines = wrapText(p.message, msgSz, pw - 100, 'sans', 5);
        const rise = (a: number, b = a + 20) => ease.out(prog(f, a, b, ease.linear));
        const sigFs = fitFont(p.signature, 58, pw - 100, 0.4);
        const cover = p.accent;
        const covInk = p.card;

        const emblemCover = (
          <Emblem motif={motif} r={pw * 0.28} c1={covInk} c2={mixHex(covInk, p.accent2, 0.5)} t={prog(f, 8, 40, ease.linear)} f={f} idp={`${uid}c`} />
        );

        return (
          <g>
            {/* ambient seasonal particles behind the card */}
            {parts.map((q, i) => {
              const t = ((f * 0.004 * q.sp + q.ph) % 1 + 1) % 1;
              const x = -40 + q.x * (W + 80) + Math.sin(t * 8 + i) * q.sw;
              const op = Math.sin(t * Math.PI) * 0.8 * ease.out(prog(f, 10, 40, ease.linear));
              if (motif === 'snow') {
                const y = -30 + t * (H + 60);
                return <circle key={i} cx={x} cy={y} r={q.s * 0.3} fill={partCol(q.k)} opacity={op} />;
              }
              if (motif === 'leaves') {
                const y = -30 + t * (H + 60);
                return (
                  <g key={i} transform={`translate(${x} ${y}) rotate(${q.rot + t * 520})`} opacity={op}>
                    <path d={leafPath(q.s * 2, q.s * 0.8)} fill={leafCols[Math.floor(q.k * 4) % 4]} opacity={0.85} />
                  </g>
                );
              }
              if (motif === 'hearts') {
                const y = H + 30 - t * (H + 60);
                return <path key={i} d={heartPath(x, y, q.s * 0.6)} fill={i % 3 ? p.accent : mixHex(p.accent, '#fff', 0.5)} opacity={op * 0.85} transform={`rotate(${Math.sin(t * 6 + i) * 18} ${x} ${y})`} />;
              }
              const y = 40 + q.k * (H - 80);
              const tw = 0.5 + 0.5 * Math.sin(f * 0.12 + i * 2);
              return <path key={i} d={sparkPath(x, y, q.s * 0.9 * tw)} fill="#FFD98A" opacity={0.85 * ease.out(prog(f, 10, 40, ease.linear))} />;
            })}

            {/* a string of lights across the top for the lights motif */}
            {motif === 'lights' && (
              <g opacity={ease.out(prog(f, 8, 40, ease.linear))}>
                <path d={`M-20 40Q${W * 0.25} 110 ${W * 0.5} 50T${W + 20} 40`} fill="none" stroke={mixHex(p.card, bg, 0.5)} strokeWidth={3} />
                {Array.from({length: 9}, (_, i) => {
                  const x = (i + 0.5) * (W / 9);
                  const y = 40 + Math.sin((x / W) * Math.PI * 4) * 25 + 40 * Math.sin((x / W) * Math.PI) ** 2 * 0.8;
                  const cols = [p.accent, '#FFC857', p.accent2, '#5BC8F5'];
                  const on = 0.55 + 0.45 * Math.sin(f * 0.14 + i * 1.3);
                  return (
                    <g key={i}>
                      <Glow id={`${uid}-bg${i}`} x={x} y={y + 20} r={52} color={cols[i % 4]} opacity={on * 0.55} />
                      <ellipse cx={x} cy={y + 18} rx={10} ry={16} fill={cols[i % 4]} opacity={0.5 + 0.5 * on} />
                    </g>
                  );
                })}
              </g>
            )}

            {/* shadow */}
            <ellipse cx={cx} cy={top + ph + 38 + bob * 0.2} rx={pw * (0.55 + 0.45 * open)} ry={18} fill="#000" opacity={0.28 * enter} />

            <g transform={`translate(0 ${bob}) rotate(${tiltIn} ${cx} ${top + ph / 2})`}>
              <defs>
                <linearGradient id={`${uid}-spine`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#000" stopOpacity={0.28} />
                  <stop offset="0.12" stopColor="#000" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`${uid}-spineL`} x1="1" y1="0" x2="0" y2="0">
                  <stop offset="0" stopColor="#000" stopOpacity={0.28} />
                  <stop offset="0.12" stopColor="#000" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* inside right page (text) */}
              <g>
                <rect x={spine} y={top} width={pw} height={ph} rx={6} fill={p.card} />
                <rect x={spine} y={top} width={pw} height={ph} rx={6} fill={`url(#${uid}-spine)`} />
                <rect x={spine + 22} y={top + 22} width={pw - 44} height={ph - 44} rx={4} fill="none" stroke={p.accent} strokeWidth={1.6} opacity={0.55 * rise(104)} />
                {open > 0.4 && (
                  <g>
                    <g transform={`translate(${gx} ${top + ph * 0.3}) scale(${backOut(prog(f, 108, 130, ease.linear), 2)})`} opacity={rise(106)}>
                      <text x={0} y={0} textAnchor="middle" fontFamily={fonts.hand} fontWeight={700} fontSize={gFs} fill={p.accent}>
                        {p.greeting}
                      </text>
                    </g>
                    <path d={`M${gx - 70} ${top + ph * 0.3 + 28}H${gx - 12}M${gx + 12} ${top + ph * 0.3 + 28}H${gx + 70}`} stroke={p.accent2} strokeWidth={2.4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - rise(124, 146)} />
                    <path d={sparkPath(gx, top + ph * 0.3 + 28, 11 * rise(128, 142))} fill={p.accent2} />
                    {msgLines.map((ln, i) => (
                      <text key={i} x={gx} y={top + ph * 0.3 + 86 + i * msgSz * 1.45 + (1 - rise(136 + i * 7)) * 12} textAnchor="middle" fontFamily={fonts.serif} fontWeight={500} fontSize={msgSz * 1.12} fill={p.ink} opacity={rise(136 + i * 7)}>
                        {ln}
                      </text>
                    ))}
                    <text x={gx} y={top + ph - 92} textAnchor="middle" fontFamily={fonts.hand} fontWeight={700} fontSize={sigFs} fill={p.accent2} opacity={rise(176)}>
                      {p.signature}
                    </text>
                    <path d={`M${gx - pw * 0.2} ${top + ph - 72}q${pw * 0.2} 14 ${pw * 0.4} 0`} fill="none" stroke={p.accent2} strokeWidth={3} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - rise(182, 204)} />
                    <path d={heartPath(gx, top + ph - 40, 10 * backOut(prog(f, 196, 212, ease.linear)))} fill={p.accent} />
                  </g>
                )}
              </g>

              {/* the swinging cover: front face, then the inside-left face */}
              {Math.abs(cs) > 0.004 && (
                <g transform={`translate(${tx} 0)`}>
                  {front ? (
                    <g transform={`translate(0 ${top + ph / 2}) scale(${sx} ${1}) translate(0 ${-(top + ph / 2)})`}>
                      <g transform={`translate(0 ${top + ph / 2}) scale(1 ${1 - persp}) translate(0 ${-(top + ph / 2)})`}>
                        <rect x={0} y={top} width={pw} height={ph} rx={6} fill={cover} />
                        <rect x={20} y={top + 20} width={pw - 40} height={ph - 40} rx={4} fill="none" stroke={covInk} strokeWidth={2.2} opacity={0.7} />
                        <rect x={30} y={top + 30} width={pw - 60} height={ph - 60} rx={3} fill="none" stroke={covInk} strokeWidth={1} opacity={0.4} />
                        <g transform={`translate(${pw / 2} ${top + ph * 0.42})`}>{emblemCover}</g>
                        <text x={pw / 2} y={top + ph * 0.78} textAnchor="middle" fontFamily={fonts.serif} fontWeight={700} fontSize={fitFont(p.coverText.toUpperCase(), 34, pw - 90, 0.98)} letterSpacing={7} fill={covInk}>
                          {p.coverText.toUpperCase()}
                        </text>
                        <path d={`M${pw / 2 - 40} ${top + ph * 0.78 + 26}H${pw / 2 + 40}`} stroke={covInk} strokeWidth={2} opacity={0.7} />
                        <rect x={0} y={top} width={pw} height={ph} rx={6} fill={`url(#${uid}-spine)`} />
                        <rect x={0} y={top} width={pw} height={ph} rx={6} fill="#000" opacity={0.28 * Math.sin(theta)} />
                      </g>
                    </g>
                  ) : (
                    <g transform={`translate(0 ${top + ph / 2}) scale(${sx} 1) translate(0 ${-(top + ph / 2)})`}>
                      <g transform={`translate(0 ${top + ph / 2}) scale(1 ${1 - persp}) translate(0 ${-(top + ph / 2)})`}>
                        <rect x={-pw} y={top} width={pw} height={ph} rx={6} fill={p.card} />
                        <rect x={-pw + 22} y={top + 22} width={pw - 44} height={ph - 44} rx={4} fill="none" stroke={p.accent} strokeWidth={1.6} opacity={0.55} />
                        <g transform={`translate(${-pw / 2} ${top + ph * 0.44})`}>
                          <Emblem motif={motif} r={pw * 0.3} c1={p.accent} c2={p.accent2} t={prog(f, 100, 140, ease.linear)} f={f} idp={`${uid}l`} />
                        </g>
                        {[0, 1, 2].map((i) => (
                          <path key={i} d={sparkPath(-pw / 2 + (i - 1) * pw * 0.28, top + ph * 0.82 + (i === 1 ? -14 : 0), (i === 1 ? 16 : 10) * rise(130 + i * 6))} fill={p.accent2} />
                        ))}
                        <rect x={-pw} y={top} width={pw} height={ph} rx={6} fill={`url(#${uid}-spineL)`} />
                        <rect x={-pw} y={top} width={pw} height={ph} rx={6} fill="#000" opacity={0.28 * Math.sin(theta)} />
                      </g>
                    </g>
                  )}
                </g>
              )}
            </g>

            {/* sparkles when it opens */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const ph0 = ((f - 90 - i * 7) % 60) / 60;
              if (f < 90 || ph0 < 0) return null;
              const a = (i / 6) * Math.PI * 2;
              return <path key={i} d={sparkPath(cx + Math.cos(a) * pw * 0.95, top + ph * 0.5 + Math.sin(a) * ph * 0.58, 20 * Math.sin(ph0 * Math.PI))} fill={mixHex(p.card, p.accent, 0.2)} opacity={0.9} />;
            })}
          </g>
        );
      }}
    </EventStage>
  );
};

export const holidayGreetingCard = defineMotion<Props>({
  id: 'holiday-greeting-card',
  title: 'Greeting card opens (seasonal motif)',
  category: 'text',
  description: 'A greeting card slides in closed, swings open on its spine to reveal a written greeting, message and signature, while a seasonal motif (snow, leaves, lights or hearts) drifts around and decorates the cover and left page.',
  source: ['original (round 3, events & celebrations)'],
  useFor: 'Holiday, Christmas, autumn, winter, Valentine, thank-you and season\'s-greetings e-cards, newsletters and social posts, company holiday wishes, customer thank-you videos. Choose the motif, replace the greeting text and colours.',
  durationInFrames: 270,
  defaultProps: {
    greeting: 'Happy Holidays',
    message: 'Wishing you warmth, joy and peace this season and a bright year ahead.',
    signature: 'With love, The Team',
    coverText: "Season's Greetings",
    motif: 'snow',
    background: '#1F3B4D',
    card: '#FBF5EA',
    ink: '#2B2A33',
    accent: '#C8453B',
    accent2: '#2F7D5B',
    seed: 2,
    startAt: 0,
  },
  propDocs: {
    greeting: 'big script greeting inside the card',
    message: 'message paragraph (wraps to five lines)',
    signature: 'sign-off written at the bottom',
    coverText: 'small caps line on the cover',
    motif: '"snow", "leaves", "lights" or "hearts" - drives the cover emblem, left page art and drifting particles',
    background: 'frame colour (hex), or "transparent" to overlay content',
    card: 'paper colour (hex)',
    ink: 'message text colour (hex)',
    accent: 'cover, greeting and frame colour (hex)',
    accent2: 'signature and ornament colour (hex)',
    seed: 'seed for the drifting particles',
    startAt: 'frame the sequence begins',
  },
  component: HolidayGreetingCard,
  tags: ['greeting', 'card', 'holiday', 'christmas', 'seasonal', 'snow', 'leaves', 'autumn', 'lights', 'hearts', 'valentine', 'thank-you', 'celebration', 'ecard', 'event'],
});
