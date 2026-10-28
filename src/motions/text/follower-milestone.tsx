import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {SANS, backOut, bgOf, fmtCompact, fmtInt, mixHex, starPath, withAlpha} from '../../core/r3-social';
import {rng} from '../../core/random';
import {useSafeId} from '../../core/image-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {estWidth, fitSize} from '../../core/text-kit';

/**
 * A milestone celebration: a counter climbs to the target (progress bar fills beneath it), lands with a shockwave, rays and a
 * confetti burst, then a thank-you line pops in word by word. Little "+" hearts float up while it climbs.
 */
type Props = {
  value: number;
  fromValue: number;
  label: string;
  caption: string;
  thankYou: string;
  subtitle: string;
  format: 'full' | 'compact';
  climbFrames: number;
  floaters: boolean;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  seed: number;
  startAt: number;
};

const FollowerMilestone: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const uid = useSafeId('fm');
  const f = Math.max(0, frame - p.startAt);
  const bg = p.background === 'transparent' ? '#0F1226' : p.background;
  const S = portrait ? u * 1.15 : Math.min(u, w / 1500) * 1.1;
  const cx = w / 2;
  const cy = h * (portrait ? 0.34 : 0.34);

  const climb = Math.max(30, p.climbFrames);
  const t0 = 14;
  const hit = t0 + climb; // frame the counter lands
  const e = prog(f, t0, hit, ease.inOut);
  const eased = Math.pow(e, 1.0);
  const v = lerp(p.fromValue, p.value, eased);
  const landed = f >= hit;
  const text = p.format === 'compact' ? (landed ? fmtCompact(p.value, 2) : fmtCompact(v, 1)) : fmtInt(landed ? p.value : v);

  const maxW = (portrait ? w * 0.86 : w * 0.7) * 1;
  const bigFs0 = (portrait ? 330 : 340) * S;
  const fs = fitSize(fmtInt(p.value), bigFs0, maxW / 1.15, 'display');
  const fsN = p.format === 'compact' ? Math.min(bigFs0, fitSize(fmtCompact(p.value, 2), bigFs0, maxW / 1.15, 'display')) : fs;

  // impact
  const since = f - hit;
  const slam = since < 0 ? 0 : Math.max(0, 1 - since / 16);
  const sc = 1 + 0.18 * Math.sin(Math.min(1, Math.max(0, since / 14)) * Math.PI) * (since < 14 ? 1 : 0) + (since < 0 ? 0.02 * Math.sin(f * 0.8) * e : 0);
  const shake = since >= 0 && since < 10 ? Math.sin(since * 3) * 6 * S * (1 - since / 10) : 0;

  // intro
  const eLab = ease.out(prog(f, 0, 18, ease.linear));
  const eNum = ease.out(prog(f, 2, 20, ease.linear));

  // progress bar
  const barW = Math.min(portrait ? w * 0.76 : w * 0.5, 900 * S);
  const barH = 22 * S;
  const barY = cy + fsN * 0.36 + 84 * S + 62 * S;
  const barX = cx - barW / 2;

  // burst particles (analytic ballistic motion)
  const R = rng(p.seed * 997 + 13);
  const N = 76;
  const parts = Array.from({length: N}, (_, i) => {
    const a = R() * Math.PI * 2;
    const sp = (portrait ? 14 : 17) * (0.35 + R() * 0.95) * S;
    return {
      a,
      sp,
      kind: Math.floor(R() * 3),
      col: [p.accent, p.accent2, p.ink, mixHex(p.accent, '#ffffff', 0.4)][Math.floor(R() * 4)],
      s: (8 + R() * 14) * S,
      spin: (R() - 0.5) * 0.5,
      drag: 0.93 + R() * 0.03,
      i,
    };
  });
  const rays = 22;

  // thank-you words
  const DW = (t: string, size: number) => estWidth(t, size, 'display') * 1.2;
  const tyFs = Math.min((portrait ? 150 : 138) * S, ((portrait ? w * 0.9 : w * 0.8) * 1) / Math.max(1, DW(p.thankYou, 1) + 0.3 * Math.max(0, p.thankYou.split(/\s+/).length - 1)));
  const words = p.thankYou.split(/\s+/).filter(Boolean);
    const totalW = DW(p.thankYou, tyFs) * 0.9;
  const tyY = barY + 175 * S;
  const subAt = hit + 12 + words.length * 5;

  const floaters = p.floaters
    ? Array.from({length: 16}, (_, i) => {
        const r = rng(p.seed * 31 + i * 7 + 5);
        const born = t0 + i * (climb / 16) * 0.9 + r() * 4;
        const life = 46;
        const x = cx + (r() - 0.5) * Math.min(w * 0.8, 1200 * S);
        const t = (f - born) / life;
        return {x, t, s: (22 + r() * 14) * S, drift: (r() - 0.5) * 60 * S, kind: i % 2, col: i % 2 ? p.accent2 : p.accent};
      })
    : [];

  return (
    <AbsoluteFill style={{background: bgOf(p.background)}}>
      <Svg>
        {/* soft radial glow behind the number that blooms on impact */}
        <defs>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={p.accent} stopOpacity={0.5} />
            <stop offset="1" stopColor={p.accent} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={(landed ? 640 : 380) * S * (landed ? 0.8 + 0.4 * ease.out(prog(since, 0, 20, ease.linear)) : 0.7 + 0.3 * e)} fill={`url(#${uid}-glow)`} opacity={0.35 + (landed ? 0.35 * slam : 0) + 0.2 * e} />

        {/* floating "+" hearts while climbing */}
        {floaters.map((q, i) => {
          if (q.t < 0 || q.t > 1) return null;
          const y = cy + 120 * S - q.t * 360 * S;
          return (
            <g key={i} transform={`translate(${q.x + q.drift * q.t} ${y}) scale(${backOut(Math.min(1, q.t * 5), 1.8)})`} opacity={Math.sin(Math.min(1, q.t) * Math.PI)}>
              {q.kind ? (
                <path d={`M0 ${q.s * 0.9} C${-q.s * 1.4} ${-q.s * 0.1} ${-q.s * 0.6} ${-q.s * 0.9} 0 ${-q.s * 0.3} C${q.s * 0.6} ${-q.s * 0.9} ${q.s * 1.4} ${-q.s * 0.1} 0 ${q.s * 0.9}Z`} fill={q.col} />
              ) : (
                <path d={`M${-q.s * 0.7} 0H${q.s * 0.7}M0 ${-q.s * 0.7}V${q.s * 0.7}`} stroke={q.col} strokeWidth={q.s * 0.36} strokeLinecap="round" />
              )}
            </g>
          );
        })}

        {/* label above */}
        <text x={cx} y={cy - fsN * 0.86 - 10 * S} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40 * S} letterSpacing={9 * S} fill={p.ink} opacity={0.7 * eLab}>
          {p.caption.toUpperCase()}
        </text>

        {/* rays + shockwave */}
        {landed && since < 40 &&
          Array.from({length: rays}, (_, i) => {
            const a = (i / rays) * Math.PI * 2 + 0.1;
            const t = ease.out(prog(since, 0, 26, ease.linear));
            const r0 = (180 + t * 420) * S;
            const r1 = r0 + (90 + (i % 3) * 40) * S * (1 - t * 0.5);
            return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0 * 0.9} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1 * 0.9} stroke={i % 2 ? p.accent : p.accent2} strokeWidth={9 * S * (1 - t)} strokeLinecap="round" opacity={1 - t} />;
          })}
        {landed && since < 30 && [0, 6].map((d) => {
          const t = prog(since, d, d + 22, ease.out);
          return <circle key={d} cx={cx} cy={cy} r={(120 + t * 620) * S} fill="none" stroke={d ? p.accent2 : p.accent} strokeWidth={(16 - t * 14) * S} opacity={(1 - t) * 0.9} />;
        })}

        {/* the counter */}
        <g transform={`translate(${cx + shake} ${cy}) scale(${sc * (0.9 + 0.1 * eNum)}) translate(${-cx} ${-cy})`} opacity={eNum}>
          <text x={cx + 7 * S} y={cy + fsN * 0.36 + 9 * S} textAnchor="middle" fontFamily={fonts.display} fontSize={fsN} fill="#000" opacity={0.3}>
            {text}
          </text>
          <text x={cx} y={cy + fsN * 0.36} textAnchor="middle" fontFamily={fonts.display} fontSize={fsN} fill={landed ? mixHex(p.ink, p.accent, 0.5 + 0.5 * slam) : p.ink}>
            {text}
          </text>
          <text x={cx} y={cy + fsN * 0.36 + 84 * S} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={46 * S} letterSpacing={6 * S} fill={p.accent2}>
            {p.label.toUpperCase()}
          </text>
        </g>

        {/* progress bar */}
        <g opacity={ease.out(prog(f, 6, 22, ease.linear))}>
          <rect x={barX} y={barY} width={barW} height={barH} rx={barH / 2} fill={withAlpha(p.ink, 0.14)} />
          <rect x={barX} y={barY} width={Math.max(barH, barW * e)} height={barH} rx={barH / 2} fill={p.accent} />
          <path d={starPath(barX + barW, barY + barH / 2, 26 * S * (1 + (landed ? 0.5 * slam : 0)))} fill={landed ? p.accent2 : withAlpha(p.ink, 0.5)} />
        </g>

        {/* confetti burst */}
        {landed &&
          parts.map((q) => {
            const t = since;
            if (t > 110) return null;
            // damped travel: distance = sp * (1 - drag^t) / (1 - drag)
            const dist = (q.sp * (1 - Math.pow(q.drag, t))) / (1 - q.drag);
            const x = cx + Math.cos(q.a) * dist;
            const y = cy + Math.sin(q.a) * dist * 0.9 + 0.5 * 0.5 * t * t * S * 0.5 * (portrait ? 1.3 : 1);
            const op = 1 - prog(t, 60, 110, ease.in);
            const rot = q.spin * t * 20;
            return (
              <g key={q.i} transform={`translate(${x} ${y}) rotate(${rot})`} opacity={op}>
                {q.kind === 0 ? <rect x={-q.s / 2} y={-q.s / 3} width={q.s} height={q.s * 0.66} fill={q.col} /> : q.kind === 1 ? <circle r={q.s * 0.45} fill={q.col} /> : <path d={starPath(0, 0, q.s * 0.7)} fill={q.col} />}
              </g>
            );
          })}

        {/* thank you */}
        <g>
          {(() => {
            const pop = backOut(prog(f, hit + 8, hit + 24, ease.linear), 2);
            const spans = (shadow: boolean) =>
              words.map((wd, i) => {
                const t = ease.out(prog(f, hit + 10 + i * 6, hit + 22 + i * 6, ease.linear));
                return (
                  <tspan key={i} fillOpacity={t} fill={shadow ? '#000' : i === 0 ? p.accent : p.ink}>
                    {wd}
                    {i < words.length - 1 ? ' ' : ''}
                  </tspan>
                );
              });
            return (
              <g transform={`translate(${cx} ${tyY}) scale(${pop}) translate(${-cx} ${-tyY})`} opacity={Math.min(1, pop * 2)}>
                <text x={cx + 5 * S} y={tyY + 6 * S} textAnchor="middle" fontFamily={fonts.display} fontSize={tyFs} opacity={0.28} style={{whiteSpace: 'pre'}}>
                  {spans(true)}
                </text>
                <text x={cx} y={tyY} textAnchor="middle" fontFamily={fonts.display} fontSize={tyFs} style={{whiteSpace: 'pre'}}>
                  {spans(false)}
                </text>
              </g>
            );
          })()}
          <path
            d={`M${cx - totalW * 0.3} ${tyY + 30 * S} q${totalW * 0.3} ${16 * S} ${totalW * 0.6} 0`}
            fill="none"
            stroke={p.accent2}
            strokeWidth={9 * S}
            strokeLinecap="round"
            strokeDasharray={totalW * 0.7}
            strokeDashoffset={totalW * 0.7 * (1 - ease.out(prog(f, hit + 14 + words.length * 5, hit + 34 + words.length * 5, ease.linear)))}
          />
          <text x={cx} y={tyY + 100 * S} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={40 * S} fill={p.ink} opacity={0.8 * ease.out(prog(f, subAt, subAt + 18, ease.linear))}>
            {p.subtitle}
          </text>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const followerMilestone = defineMotion<Props>({
  id: 'follower-milestone',
  title: 'Follower milestone',
  category: 'text',
  description: 'A counter climbs to a milestone while a progress bar fills and little hearts float up; it lands with a shockwave, rays and a confetti burst, then a thank-you line pops in word by word.',
  source: ['original (round 3, social & marketing)'],
  useFor: 'Follower / subscriber / download / sales milestones, community thank-you posts, anniversary and goal-reached celebrations, "we hit 100K" announcements.',
  durationInFrames: 240,
  defaultProps: {
    value: 100000,
    fromValue: 0,
    label: 'followers',
    caption: 'New milestone',
    thankYou: 'Thank you!',
    subtitle: 'We could not have done it without you',
    format: 'full',
    climbFrames: 90,
    floaters: true,
    background: '#0F1226',
    ink: '#FFFFFF',
    accent: '#FFB63D',
    accent2: '#FF5C8A',
    seed: 3,
    startAt: 0,
  },
  propDocs: {
    value: 'the milestone the counter climbs to',
    fromValue: 'where the counter starts',
    label: 'unit under the number (followers, subscribers, users…)',
    caption: 'small line above the number',
    thankYou: 'big thank-you line that pops in after the burst',
    subtitle: 'smaller line under the thank-you',
    format: '"full" (100,000) or "compact" (100K)',
    climbFrames: 'frames the counter takes to climb',
    floaters: 'floating hearts / plus marks during the climb',
    background: 'frame colour, or "transparent" to overlay content',
    ink: 'text colour',
    accent: 'number glow, bar and burst colour',
    accent2: 'label, shockwave and underline colour',
    seed: 'seed for the burst pattern',
    startAt: 'frame the sequence begins',
  },
  component: FollowerMilestone,
  tags: ['social', 'milestone', 'followers', 'subscribers', 'counter', 'celebration', 'confetti', 'burst', 'thank-you', 'marketing', 'goal', 'overlay'],
});
