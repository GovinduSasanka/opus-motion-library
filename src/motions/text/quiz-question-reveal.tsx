import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {backOut, easeOut3, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Icon, fitText, inkOn} from '../../core/r3-explain';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Quiz beat: a QUIZ label and the question fade in, lettered option cards deal in, a timer ring drains with a
 * countdown number, then the correct option lights up (others dim) with a tick and a pulse ring.
 */
type Props = {
  label: string;
  question: string;
  options: string[];
  correct: number;
  timerSeconds: number;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  card: string;
  fontFamily: string;
  startAt: number;
  speed: number;
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const QuizQuestionReveal: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt) * (p.speed || 1);
  const font = p.fontFamily || fonts.grotesk;
  const opts = (p.options || []).slice(0, 6);
  const n = Math.max(1, opts.length);
  const correct = Math.min(Math.max(0, Math.round(p.correct)), n - 1);
  const cols = portrait ? 1 : n > 4 ? 3 : 2;
  const rowsN = Math.ceil(n / cols);
  const mx = portrait ? w * 0.07 : w * 0.08;
  const gridW = w - mx * 2;
  const gap = 24 * u;
  const optW = (gridW - gap * (cols - 1)) / cols;
  const optH = portrait ? Math.min(h * 0.1, 180 * u) : Math.min(h * 0.17, 190 * u);
  const gridH = rowsN * optH + (rowsN - 1) * gap;
  const timerR = (portrait ? 70 : 64) * u;
  const topY = portrait ? h * 0.06 : h * 0.07;
  const qBoxW = portrait ? gridW : gridW - timerR * 2 - 50 * u;
  const qBoxH = portrait ? h * 0.2 : h * 0.26;
  const qFit = fitText(p.question, qBoxW, qBoxH, (portrait ? 70 : 76) * u, 28 * u);
  const qY = portrait ? topY + timerR * 2 + 40 * u : topY + 70 * u;
  const gridY = portrait ? h - gridH - h * 0.07 : h - gridH - h * 0.09;

  const timerStart = 62 + n * 7;
  const timerFrames = Math.max(30, p.timerSeconds * 30);
  const revealAt = timerStart + timerFrames;
  const tp = sseg(f, timerStart, revealAt);
  const secsLeft = Math.max(0, Math.ceil(p.timerSeconds * (1 - tp)));
  const urgent = tp > 0.66 && tp < 1;
  const timerCol = urgent ? p.accent2 : p.ink;
  const timerX = portrait ? w - mx - timerR : w - mx - timerR;
  const timerY = portrait ? topY + timerR : topY + timerR + 10 * u;
  const circ = 2 * Math.PI * timerR;
  const intro = easeOut3(sseg(f, 0, 22));
  const timerIn = easeOut3(sseg(f, timerStart - 14, timerStart));
  const rev = easeOut3(sseg(f, revealAt, revealAt + 14));
  const pulse = sseg(f, revealAt, revealAt + 26);
  const showBg = p.background !== 'transparent';
  const throb = urgent ? 1 + 0.05 * Math.sin(f * 0.9) : 1;
  const labelW = p.label.length * 26 * u * 0.78 + 44 * u;

  return (
    <AbsoluteFill style={{background: showBg ? p.background : undefined}}>
      <Svg>
        <g opacity={intro}>
          <rect x={mx} y={topY} width={labelW} height={44 * u} rx={22 * u} fill={p.accent} />
          <text x={mx + 22 * u} y={topY + 31 * u} fontFamily={fonts.display} fontSize={26 * u} letterSpacing={4 * u} fill={inkOn(p.accent)}>
            {p.label}
          </text>
          <text fontFamily={font} fontWeight={700} fontSize={qFit.fs} fill={p.ink} transform={`translate(0 ${(1 - intro) * 20 * u})`}>
            {qFit.lines.map((l, i) => (
              <tspan key={i} x={mx} y={qY + qFit.fs * (i + 0.9) * qFit.lh}>
                {l}
              </tspan>
            ))}
          </text>
        </g>
        {/* timer */}
        <g transform={`translate(${timerX} ${timerY}) scale(${throb})`} opacity={timerIn}>
          <circle r={timerR} fill="none" stroke={withAlpha(p.ink, 0.14)} strokeWidth={12 * u} />
          <circle r={timerR} fill="none" stroke={rev > 0 ? p.accent : timerCol} strokeWidth={12 * u} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (rev > 0 ? 0 : tp)} transform="rotate(-90)" />
          {rev > 0 ? (
            <Icon name="check" x={0} y={0} size={timerR * 0.9} color={p.accent} sw={3.4} progress={rev} />
          ) : (
            <text textAnchor="middle" y={timerR * 0.34} fontFamily={fonts.display} fontSize={timerR * 0.95} fill={timerCol}>
              {secsLeft}
            </text>
          )}
        </g>
        {/* options */}
        {opts.map((o, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const x = mx + c * (optW + gap);
          const y = gridY + r * (optH + gap);
          const t0 = 26 + i * 7;
          const k = easeOut3(sseg(f, t0, t0 + 18));
          const isC = i === correct;
          const lit = isC ? rev : 0;
          const dim = isC ? 0 : rev * 0.58;
          const fill = mixHex(p.card, p.accent, lit);
          const txt = lit > 0.5 ? inkOn(p.accent) : p.ink;
          const fs = Math.min(optH * 0.34, (optW - optH * 1.5) / Math.max(1, o.length * 0.56));
          const wobble = isC ? 1 + 0.035 * Math.sin(Math.PI * pulse) : 1;
          return (
            <g key={i} opacity={k * (1 - dim)} transform={`translate(${x + optW / 2} ${y + optH / 2 + (1 - k) * 34 * u}) scale(${wobble})`}>
              <rect x={-optW / 2} y={-optH / 2} width={optW} height={optH} rx={optH * 0.28} fill={fill} stroke={isC && lit > 0 ? p.accent : withAlpha(p.ink, 0.16)} strokeWidth={3 * u} />
              <circle cx={-optW / 2 + optH * 0.5} cy={0} r={optH * 0.27} fill={lit > 0.5 ? withAlpha('#ffffff', 0.92) : withAlpha(p.accent, 0.18)} />
              <text x={-optW / 2 + optH * 0.5} y={optH * 0.1} textAnchor="middle" fontFamily={fonts.display} fontSize={optH * 0.3} fill={lit > 0.5 ? mixHex(p.accent, '#000000', 0.25) : p.accent}>
                {LETTERS[i]}
              </text>
              <text x={-optW / 2 + optH * 0.98} y={optH * 0.13} fontFamily={font} fontWeight={600} fontSize={Math.max(14 * u, fs)} fill={txt}>
                {o}
              </text>
              {isC && lit > 0 ? (
                <g transform={`translate(${optW / 2 - optH * 0.5} 0) scale(${Math.max(0.001, backOut(sseg(f, revealAt + 4, revealAt + 20), 2.4))})`}>
                  <circle r={optH * 0.24} fill="#ffffff" />
                  <Icon name="check" x={0} y={0} size={optH * 0.3} color={mixHex(p.accent, '#000000', 0.25)} sw={3.6} />
                </g>
              ) : null}
              {isC && pulse > 0 && pulse < 1 ? (
                <rect x={-optW / 2 - pulse * 26 * u} y={-optH / 2 - pulse * 26 * u} width={optW + pulse * 52 * u} height={optH + pulse * 52 * u} rx={optH * 0.28 + pulse * 26 * u} fill="none" stroke={p.accent} strokeWidth={4 * u} opacity={1 - pulse} />
              ) : null}
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const quizQuestionReveal = defineMotion<Props>({
  id: 'quiz-question-reveal',
  title: 'Quiz question reveal',
  category: 'text',
  description: 'A QUIZ tag and question, lettered option cards dealing in, a draining timer ring with a countdown, then the correct option lights up with a tick and a pulse while the rest dim.',
  source: ['original (round 3)'],
  useFor: 'Quiz shorts, "can you guess" engagement beats, classroom / course videos, trivia — pass the question, options and the correct index.',
  durationInFrames: 270,
  defaultProps: {
    label: 'QUIZ',
    question: 'Which planet in our solar system has the most moons?',
    options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
    correct: 1,
    timerSeconds: 5,
    background: '#101A33',
    ink: '#F3F5FB',
    accent: '#2EC4B6',
    accent2: '#FF6B4A',
    card: '#1C2B52',
    fontFamily: '',
    startAt: 0,
    speed: 1,
  },
  propDocs: {
    label: 'tag above the question',
    question: 'the question text',
    options: 'answer options (2-6)',
    correct: 'zero-based index of the correct option',
    timerSeconds: 'length of the countdown ring in seconds',
    background: "backdrop colour or 'transparent'",
    ink: 'question and option text colour',
    accent: 'correct-answer, tag and letter colour',
    accent2: 'colour of the timer in its last third',
    card: 'option card fill',
    fontFamily: 'optional CSS font-family (empty = grotesk)',
    startAt: 'frame the intro starts',
    speed: 'playback speed multiplier',
  },
  component: QuizQuestionReveal,
  tags: ['quiz', 'question', 'trivia', 'timer', 'countdown', 'options', 'answer', 'multiple-choice', 'education', 'engagement', 'reveal'],
});
