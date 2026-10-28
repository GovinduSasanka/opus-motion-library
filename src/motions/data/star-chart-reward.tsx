import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {backOut, easeOut3, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Burst, list, roundStarPath, textEm} from '../../core/r3-edu-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Sticker / reward chart: a tasks x days grid where gold stars are stamped into the earned cells one after another
 * (slam, squash, ring and sparks), a progress bar and counter climb, a locked medal fills up with every star, and when the
 * last star lands the medal unlocks with confetti and a reward message.
 */
type Props = {
  title: string;
  tasks: string[];
  days: string[];
  pattern: string[];
  goal: number;
  rewardLabel: string;
  rewardLockedText: string;
  rewardTitle: string;
  rewardText: string;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  card: string;
  fontFamily: string;
  stamp: number;
  startAt: number;
  speed: number;
};

const DEFAULT_TASKS = ['Brush teeth', 'Read a book', 'Tidy my room', 'Help someone'];
const DEFAULT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DEFAULT_PATTERN = ['11111', '11101', '10111', '11011'];

const StarChartReward: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt) * (p.speed || 1);
  const font = p.fontFamily || fonts.display;
  const showBg = p.background !== 'transparent';
  const tasks = list<string>(p.tasks, DEFAULT_TASKS).slice(0, 8).map(String);
  const days = list<string>(p.days, DEFAULT_DAYS).slice(0, 10).map(String);
  const patt = list<string>(p.pattern, DEFAULT_PATTERN).map(String);
  const rows = tasks.length;
  const cols = days.length;
  const earned = (r: number, c: number) => (patt[r] ?? '')[c] === '1';
  const stars: {r: number; c: number}[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (earned(r, c)) stars.push({r, c});
  const total = Math.max(1, stars.length);
  const goal = p.goal > 0 ? Math.round(p.goal) : total;
  const stamp = p.stamp > 0 ? p.stamp : Math.max(7, Math.min(22, Math.round(230 / total)));
  const t0 = 44;
  const tEnd = t0 + (stars.length - 1) * stamp + 12;
  const starIndex = (r: number, c: number) => stars.findIndex((s) => s.r === r && s.c === c);
  const count = Math.max(0, Math.min(stars.length, Math.floor((f - t0 - 8) / stamp) + 1));

  // --- layout
  const chartW = portrait ? w * 0.9 : w * 0.64;
  const chartX = portrait ? w * 0.05 : w * 0.04;
  const pad = 36 * u;
  const labW = chartW * (portrait ? 0.3 : 0.3);
  const titleH = 120 * u;
  const headH = 64 * u;
  const maxCh = portrait ? h * 0.46 : h * 0.84;
  const cell = Math.min((chartW - labW - pad * 2) / cols, (maxCh - titleH - headH - pad * 2) / rows, 160 * u);
  const chartH = pad * 2 + titleH + headH + rows * cell;
  const chartY = portrait ? h * 0.07 : (h - chartH) / 2;
  const gridX = chartX + pad + labW;
  const gridY = chartY + pad + titleH + headH;
  const maxLabEm = Math.max(...tasks.map((t) => textEm(t)), 3);
  const labFs = Math.max(18 * u, Math.min(cell * 0.34, 40 * u, ((labW - 10 * u) / maxLabEm)));
  const cardIn = easeOut3(sseg(f, 0, 22));

  const panelX = portrait ? chartX : chartX + chartW + w * 0.03;
  const panelW = portrait ? chartW : w * 0.96 - panelX;
  const panelY = portrait ? chartY + chartH + 28 * u : chartY;
  const panelH = portrait ? h * 0.95 - panelY : chartH;

  // --- reward
  const prog = Math.min(1, count / goal);
  const unlockT = f >= t0 + (goal - 1) * stamp + 14 ? sseg(f, t0 + (goal - 1) * stamp + 14, t0 + (goal - 1) * stamp + 40) : 0;
  const unlocked = unlockT > 0;
  const medalS = Math.min(panelW * 0.62, panelH * 0.46) / 200;
  const medalPop = unlocked ? 1 + 0.14 * Math.sin(Math.min(1, unlockT * 1.4) * Math.PI) : 1;
  const medalCx = panelX + panelW / 2;
  const medalCy = panelY + panelH * 0.4;
  const starGold = p.accent;
  const lockCol = mixHex(p.ink, p.card, 0.84);
  const msgIn = easeOut3(sseg(f, t0 + (goal - 1) * stamp + 24, t0 + (goal - 1) * stamp + 48));
  const rTitleFs = Math.min((portrait ? 76 : 60) * u, (panelW * 0.9) / Math.max(4, textEm(p.rewardTitle, 0.62)));
  const msg = String(p.rewardText).replace('{n}', String(stars.length));
  const lockedMsg = String(p.rewardLockedText).replace('{goal}', String(goal));

  const barW = chartW - pad * 2;
  const barH = 20 * u;

  return (
    <AbsoluteFill style={{background: showBg ? p.background : undefined, overflow: 'hidden'}}>
      {/* chart card */}
      <div style={{position: 'absolute', left: chartX, top: chartY, width: chartW, height: chartH, borderRadius: 36 * u, background: p.card, boxShadow: `0 ${24 * u}px ${70 * u}px rgba(0,0,0,0.18)`, opacity: cardIn, transform: `translateY(${(1 - cardIn) * 36 * u}px)`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 18 * u, borderRadius: `${36 * u}px ${36 * u}px 0 0`, background: p.accent2}} />
        <div style={{position: 'absolute', left: pad, top: pad + 8 * u, fontFamily: font, fontSize: (portrait ? 56 : 52) * u, color: p.ink, lineHeight: 1}}>{p.title}</div>
        <div style={{position: 'absolute', right: pad, top: pad + 4 * u, display: 'flex', alignItems: 'center', gap: 12 * u, fontFamily: fonts.mono, fontWeight: 700, fontSize: 40 * u, color: p.ink}}>
          <svg width={44 * u} height={44 * u} viewBox="-26 -26 52 52"><path d={roundStarPath(0, 1, 24, 0.5, 5, 0.14)} fill={starGold} stroke={mixHex(starGold, p.ink, 0.4)} strokeWidth={3} strokeLinejoin="round" /></svg>
          {count}/{stars.length}
        </div>
        {/* progress bar */}
        <div style={{position: 'absolute', left: pad, top: pad + 8 * u + (portrait ? 70 : 66) * u, width: barW, height: barH, borderRadius: barH, background: withAlpha(p.ink, 0.1), overflow: 'hidden'}}>
          <div style={{width: `${(count / stars.length) * 100}%`, height: '100%', borderRadius: barH, background: `linear-gradient(90deg, ${p.accent2}, ${p.accent})`}} />
        </div>
      </div>

      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: cardIn}}>
        {/* day headers */}
        {days.map((d, c) => (
          <text key={`d${c}`} x={gridX + c * cell + cell / 2} y={gridY - headH * 0.3} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={Math.min(cell * 0.28, 34 * u)} letterSpacing={2 * u} fill={withAlpha(p.ink, 0.55)}>{d.toUpperCase()}</text>
        ))}
        {/* rows */}
        {tasks.map((t, r) => {
          const rowIn = easeOut3(sseg(f, 10 + r * 4, 30 + r * 4));
          const cy = gridY + r * cell + cell / 2;
          return (
            <g key={`r${r}`} opacity={rowIn}>
              {r % 2 === 0 && <rect x={chartX + pad * 0.5} y={gridY + r * cell} width={chartW - pad} height={cell} rx={cell * 0.2} fill={withAlpha(p.accent2, 0.07)} />}
              <text x={chartX + pad} y={cy + labFs * 0.35} fontFamily={fonts.sans} fontWeight={700} fontSize={labFs} fill={p.ink}>{t}</text>
              {days.map((_, c) => {
                const cx = gridX + c * cell + cell / 2;
                const isStar = earned(r, c);
                const si = isStar ? starIndex(r, c) : -1;
                const ti = t0 + si * stamp;
                const q = isStar ? sseg(f, ti, ti + 12) : 0;
                const impact = isStar ? f - (ti + 12) : -1;
                const sc = q <= 0 ? 0 : q < 1 ? 2.6 - 1.6 * q * q : 1 + (impact < 20 ? 0.16 * Math.exp(-impact * 0.28) * Math.cos(impact * 0.9) : 0);
                const rot = q < 1 ? (1 - q) * -35 : 0;
                const rr = cell * 0.37;
                return (
                  <g key={`c${r}-${c}`}>
                    <circle cx={cx} cy={cy} r={rr * 0.9} fill="none" stroke={withAlpha(p.ink, isStar ? 0.22 : 0.1)} strokeWidth={2.5 * u} strokeDasharray={`${7 * u} ${7 * u}`} opacity={Math.max(0, 1 - q * 1.2)} />
                    {!isStar && <circle cx={cx} cy={cy} r={rr * 0.16} fill={withAlpha(p.ink, 0.12)} />}
                    {q > 0 && (
                      <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${sc})`} opacity={Math.min(1, q * 4)}>
                        <path d={roundStarPath(0, 2, rr, 0.5, 5, 0.16)} fill={starGold} stroke={mixHex(starGold, p.ink, 0.45)} strokeWidth={Math.max(2.5, rr * 0.07)} strokeLinejoin="round" />
                        <path d={roundStarPath(-rr * 0.12, -rr * 0.06, rr * 0.5, 0.5, 5, 0.2)} fill="#fff" opacity="0.35" />
                      </g>
                    )}
                    {impact > 0 && impact < 22 && (
                      <>
                        <circle cx={cx} cy={cy} r={rr * (0.9 + impact * 0.05)} fill="none" stroke={starGold} strokeWidth={4 * u * (1 - impact / 22)} opacity={1 - impact / 22} />
                        <Burst x={cx} y={cy} t={impact / 22} colors={[starGold, p.accent2, '#FFFFFF']} n={7} radius={rr * 1.5} seed={si + 2} size={9 * u} />
                      </>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* reward panel */}
      <div style={{position: 'absolute', left: panelX, top: panelY, width: panelW, height: panelH, borderRadius: 36 * u, background: unlocked ? mixHex(p.card, p.accent, 0.12 * unlockT) : p.card, boxShadow: `0 ${24 * u}px ${70 * u}px rgba(0,0,0,0.18)`, opacity: cardIn, transform: `translateY(${(1 - cardIn) * 36 * u}px)`, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 18 * u, background: p.accent}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 44 * u, textAlign: 'center', fontFamily: fonts.sans, fontWeight: 800, fontSize: 28 * u, letterSpacing: 5 * u, textTransform: 'uppercase', color: withAlpha(p.ink, 0.5)}}>{p.rewardLabel}</div>
        {/* glow behind unlocked medal */}
        {unlocked && <div style={{position: 'absolute', left: medalCx - panelX - 200 * medalS, top: medalCy - panelY - 200 * medalS, width: 400 * medalS, height: 400 * medalS, borderRadius: '50%', background: `radial-gradient(circle, ${withAlpha(p.accent, 0.4 * unlockT)} 0%, transparent 65%)`}} />}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: panelH * 0.06, textAlign: 'center', padding: `0 ${24 * u}px`}}>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, fontFamily: fonts.sans, fontWeight: 700, fontSize: 30 * u, color: withAlpha(p.ink, 0.6), opacity: 1 - msgIn}}>{lockedMsg}</div>
          <div style={{opacity: msgIn, transform: `translateY(${(1 - msgIn) * 20 * u}px)`}}>
            <div style={{fontFamily: font, fontSize: rTitleFs, lineHeight: 1.05, color: p.ink}}>{p.rewardTitle}</div>
            <div style={{marginTop: 10 * u, fontFamily: fonts.sans, fontWeight: 600, fontSize: 32 * u, lineHeight: 1.25, color: withAlpha(p.ink, 0.72)}}>{msg}</div>
          </div>
        </div>
      </div>

      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: cardIn}}>
        <defs>
          <clipPath id="star-chart-reward-fill">
            <rect x="0" y={232 - prog * 164} width="200" height={prog * 164 + 2} />
          </clipPath>
          <clipPath id="star-chart-reward-disc">
            <circle cx="100" cy="150" r="82" />
          </clipPath>
        </defs>
        <g transform={`translate(${medalCx - 100 * medalS * medalPop} ${medalCy - 130 * medalS * medalPop}) scale(${medalS * medalPop})`}>
          {/* ribbons */}
          <g transform="translate(100 6)">
            <rect x="-52" y="0" width="36" height="120" rx="4" fill={unlocked ? p.accent2 : lockCol} transform="rotate(14 -34 0)" />
            <rect x="16" y="0" width="36" height="120" rx="4" fill={unlocked ? mixHex(p.accent2, p.ink, 0.25) : mixHex(lockCol, p.ink, 0.08)} transform="rotate(-14 34 0)" />
          </g>
          {/* disc: locked grey, gold fill rises with progress */}
          <circle cx="100" cy="150" r="82" fill={lockCol} />
          <g clipPath="url(#star-chart-reward-fill)">
            <circle cx="100" cy="150" r="82" fill={starGold} />
          </g>
          <circle cx="100" cy="150" r="82" fill="none" stroke={mixHex(unlocked ? starGold : lockCol, p.ink, 0.35)} strokeWidth="6" />
          <circle cx="100" cy="150" r="62" fill="none" stroke={withAlpha('#FFFFFF', 0.55)} strokeWidth="4" strokeDasharray="3 9" strokeLinecap="round" />
          <path d={roundStarPath(100, 152, 40, 0.5, 5, 0.14)} fill={unlocked ? '#FFFFFF' : withAlpha('#FFFFFF', 0.7)} stroke={mixHex(unlocked ? starGold : lockCol, p.ink, 0.35)} strokeWidth="4" strokeLinejoin="round" />
          {/* shine sweep on unlock */}
          {unlocked && unlockT < 1 && <rect x={-40 + unlockT * 300} y="60" width="26" height="200" fill="#fff" opacity="0.5" transform="rotate(20 100 150)" clipPath="url(#star-chart-reward-disc)" />}
        </g>
        <Burst x={medalCx} y={medalCy} t={unlocked ? sseg(f, t0 + (goal - 1) * stamp + 16, t0 + (goal - 1) * stamp + 70) : 0} colors={[starGold, p.accent2, '#FFFFFF', p.accent]} n={26} radius={Math.min(panelW, panelH) * 0.5} seed={9} size={14 * u} />
      </svg>
    </AbsoluteFill>
  );
};

export const starChartReward = defineMotion<Props>({
  id: 'star-chart-reward',
  title: 'Star chart reward',
  category: 'data',
  description: 'A kids\' reward chart: gold stars slam into a tasks-by-days grid one after another (squash, ring and sparks) while a progress bar and counter climb and a locked medal fills with gold; on the last star the medal unlocks with a shine, confetti and a reward message.',
  source: ['original (round 3)'],
  useFor: 'Kids\' habit and chore trackers, classroom behaviour and reading charts, parenting and school app promos, gamified learning progress and "you earned it" reward beats — pass your tasks, days, which cells earn stars and the reward text.',
  durationInFrames: 360,
  defaultProps: {
    title: 'My Star Chart',
    tasks: DEFAULT_TASKS,
    days: DEFAULT_DAYS,
    pattern: DEFAULT_PATTERN,
    goal: 0,
    rewardLabel: 'Reward',
    rewardLockedText: 'Collect {goal} stars',
    rewardTitle: 'Super Star!',
    rewardText: '{n} stars earned. Pizza night!',
    background: '#FFF1D6',
    ink: '#2B2A4C',
    accent: '#FFC21A',
    accent2: '#7C5CFF',
    card: '#FFFFFF',
    fontFamily: '',
    stamp: 0,
    startAt: 0,
    speed: 1,
  },
  propDocs: {
    title: 'chart heading',
    tasks: 'task names, one per row (max 8)',
    days: 'column headings, e.g. weekdays (max 10)',
    pattern: 'one string per task row, a character per day: 1 = star earned, 0 = no star (e.g. "11011")',
    goal: 'stars needed to unlock the reward (0 = every star in the pattern)',
    rewardLabel: 'small label above the medal',
    rewardLockedText: 'caption while locked; {goal} = stars needed',
    rewardTitle: 'headline when the reward unlocks',
    rewardText: 'message under the headline; {n} = stars earned',
    background: "backdrop colour or 'transparent'",
    ink: 'text colour',
    accent: 'star and medal gold',
    accent2: 'header stripe, progress bar and ribbon colour',
    card: 'chart and reward card colour',
    fontFamily: 'optional CSS font-family for the title and reward headline (empty = display)',
    stamp: 'frames between star stamps (0 = auto-fit)',
    startAt: 'frame the chart starts',
    speed: 'playback speed multiplier',
  },
  component: StarChartReward,
  tags: ['star chart', 'reward', 'sticker', 'chart', 'kids', 'children', 'chores', 'habit', 'tracker', 'school', 'classroom', 'medal', 'progress', 'gamification', 'achievement', 'education'],
});
