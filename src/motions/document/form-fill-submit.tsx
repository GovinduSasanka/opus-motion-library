import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {backOut, easeIO, easeOut3, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A form fills itself: each field gains focus and types its value (caret blinking), a checkbox ticks, a cursor glides to
 * the button and clicks, the button spins, then the card swaps to a success state. All text is props.
 */
type Field = {label: string; value: string};
type Props = {
  title: string;
  fields: Field[];
  checkboxLabel: string;
  buttonLabel: string;
  successTitle: string;
  successText: string;
  background: string;
  card: string;
  ink: string;
  accent: string;
  speed: number;
  startAt: number;
};

const CW = 720;
const FormFillSubmit: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const fields = (p.fields || []).slice(0, 6);
  const nf = fields.length;
  const FH = 122;
  const hasCheck = !!p.checkboxLabel;
  const CH = 150 + nf * FH + (hasCheck ? 74 : 0) + 120;
  const sc = Math.min((w * 0.9) / CW, (h * 0.9) / CH, portrait ? 1.5 : 1.2);
  const enter = backOut(sseg(frame, 0, 20), 1.4);

  // timeline
  const chars = fields.reduce((a, f) => a + f.value.length, 0);
  const cpf = Math.max(0.45 * p.speed, chars / 130);
  let t = p.startAt + 20;
  const spans = fields.map((f) => {
    const a = t;
    const b = a + f.value.length / cpf;
    t = b + 10;
    return {a, b};
  });
  const checkAt = t + 4;
  t = checkAt + (hasCheck ? 22 : 0);
  const moveA = t;
  const moveB = moveA + 26;
  const clickAt = moveB + 4;
  const spinA = clickAt + 8;
  const spinB = spinA + 26;
  const succ = easeOut3(sseg(frame, spinB, spinB + 18));
  const formOpacity = 1 - sseg(frame, spinB, spinB + 10);

  const fx = 40;
  const fw = CW - 80;
  const btnY = 150 + nf * FH + (hasCheck ? 74 : 0);
  const btnH = 70;
  const btnPress = sseg(frame, clickAt, clickAt + 3) * (1 - sseg(frame, clickAt + 3, clickAt + 9));
  const btnX = CW / 2;
  const btnCY = btnY + btnH / 2;
  const maxCh = Math.floor((fw - 40) / (28 * 0.58));

  // cursor path: from below right of card to button centre
  const mv = easeIO(sseg(frame, moveA, moveB));
  const curStart = {x: CW * 0.85, y: CH * 0.95};
  const curX = curStart.x + (btnX + 60 - curStart.x) * mv;
  const curY = curStart.y + (btnCY + 14 - curStart.y) * mv;
  const curOpacity = sseg(frame, moveA - 4, moveA + 4) * (1 - sseg(frame, spinA + 6, spinA + 14));
  const bg = p.background === 'transparent' ? undefined : p.background;
  const fieldFill = mixHex(p.card, p.ink, 0.05);

  return (
    <AbsoluteFill style={{background: bg}}>
      <Svg>
        <g transform={`translate(${w / 2} ${h / 2}) scale(${sc * Math.max(0.001, enter)}) translate(${-CW / 2} ${-CH / 2})`} opacity={Math.min(1, enter)}>
          <rect x={10} y={22} width={CW} height={CH} rx={30} fill="#000" opacity={0.18} />
          <rect width={CW} height={CH} rx={30} fill={p.card} stroke={withAlpha(p.ink, 0.1)} strokeWidth={2} />
          {/* form */}
          <g opacity={formOpacity}>
            <text x={fx} y={92} fontFamily={fonts.grotesk} fontWeight={700} fontSize={50} fill={p.ink}>
              {p.title}
            </text>
            {fields.map((fd, i) => {
              const y = 130 + i * FH;
              const sp = spans[i];
              const typed = Math.max(0, Math.min(fd.value.length, Math.floor((frame - sp.a) * cpf)));
              const focused = frame >= sp.a - 4 && frame < spans[i].b + 8 && i === Math.max(0, spans.findIndex((s2) => frame < s2.b + 8));
              const shown = fd.value.slice(0, typed);
              const vis = shown.length > maxCh ? shown.slice(shown.length - maxCh) : shown;
              const caretOn = focused && Math.floor(frame / 8) % 2 === 0;
              const tw = vis.length * 28 * 0.5;
              return (
                <g key={i}>
                  <text x={fx + 4} y={y + 18} fontFamily={fonts.sans} fontWeight={600} fontSize={22} letterSpacing={1} fill={withAlpha(p.ink, 0.6)}>
                    {fd.label}
                  </text>
                  <rect x={fx} y={y + 30} width={fw} height={62} rx={14} fill={fieldFill} stroke={focused ? p.accent : withAlpha(p.ink, 0.15)} strokeWidth={focused ? 3.5 : 2} />
                  <text x={fx + 20} y={y + 72} fontFamily={fonts.sans} fontWeight={400} fontSize={28} fill={p.ink}>
                    {vis}
                  </text>
                  {caretOn ? <rect x={fx + 22 + tw} y={y + 46} width={3} height={32} fill={p.accent} /> : null}
                </g>
              );
            })}
            {hasCheck ? (
              <g transform={`translate(${fx} ${130 + nf * FH + 14})`}>
                <rect width={40} height={40} rx={10} fill={sseg(frame, checkAt, checkAt + 6) > 0 ? p.accent : 'none'} stroke={sseg(frame, checkAt, checkAt + 6) > 0 ? p.accent : withAlpha(p.ink, 0.35)} strokeWidth={3} />
                <path d="M9 21L17 29L32 12" fill="none" stroke={p.card} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - easeOut3(sseg(frame, checkAt, checkAt + 14))} />
                <text x={58} y={29} fontFamily={fonts.sans} fontSize={25} fill={withAlpha(p.ink, 0.8)}>
                  {p.checkboxLabel}
                </text>
              </g>
            ) : null}
            {/* button */}
            <g transform={`translate(${btnX} ${btnCY}) scale(${1 - 0.04 * btnPress})`}>
              <rect x={-fw / 2} y={-btnH / 2} width={fw} height={btnH} rx={18} fill={p.accent} />
              {frame < spinA ? (
                <text y={11} textAnchor="middle" fontFamily={fonts.grotesk} fontWeight={700} fontSize={30} letterSpacing={2} fill={p.card}>
                  {p.buttonLabel}
                </text>
              ) : (
                <g transform={`rotate(${(frame - spinA) * 24})`}>
                  <circle r={17} fill="none" stroke={withAlpha(p.card, 0.35)} strokeWidth={5} />
                  <path d="M0 -17A17 17 0 0 1 17 0" fill="none" stroke={p.card} strokeWidth={5} strokeLinecap="round" />
                </g>
              )}
            </g>
          </g>
          {/* success */}
          {succ > 0 ? (
            <g opacity={succ} transform={`translate(${CW / 2} ${CH / 2}) scale(${0.85 + 0.15 * backOut(succ, 2)})`}>
              <circle cy={-60} r={86 * backOut(succ, 2.2)} fill={withAlpha(p.accent, 0.15)} />
              <circle cy={-60} r={62} fill={p.accent} />
              <path d="M-26 -58L-8 -38L28 -80" fill="none" stroke={p.card} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - easeOut3(sseg(frame, spinB + 6, spinB + 24))} />
              <text y={82} textAnchor="middle" fontFamily={fonts.grotesk} fontWeight={700} fontSize={54} fill={p.ink}>
                {p.successTitle}
              </text>
              <text y={132} textAnchor="middle" fontFamily={fonts.sans} fontSize={27} fill={withAlpha(p.ink, 0.65)}>
                {p.successText}
              </text>
            </g>
          ) : null}
          {/* cursor */}
          <g transform={`translate(${curX} ${curY}) scale(${1 - 0.1 * btnPress})`} opacity={curOpacity}>
            <path d="M0 0L0 34L9 26L15 40L22 37L16 24L28 24Z" fill="#111" stroke="#fff" strokeWidth={2.5} strokeLinejoin="round" />
          </g>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const formFillSubmit = defineMotion<Props>({
  id: 'form-fill-submit',
  title: 'Form fill and submit',
  category: 'document',
  description:
    'A form card fills itself: fields take focus and type their values with a blinking caret, a checkbox ticks, a cursor glides to the button and clicks, the button spins and the card becomes a success state.',
  source: ['original (round 3)'],
  useFor: 'Sign-up / contact / booking flow demos, "it only takes seconds" beats, SaaS onboarding and landing-page explainers.',
  durationInFrames: 300,
  defaultProps: {
    title: 'Get in touch',
    fields: [
      {label: 'FULL NAME', value: 'Alex Morgan'},
      {label: 'EMAIL', value: 'alex@example.com'},
      {label: 'MESSAGE', value: 'I would love a quick demo.'},
    ],
    checkboxLabel: 'I agree to the terms',
    buttonLabel: 'SUBMIT',
    successTitle: 'Thank you!',
    successText: 'We will be in touch shortly.',
    background: '#EAE6DD',
    card: '#FFFFFF',
    ink: '#1D1C25',
    accent: '#3B5BFF',
    speed: 1,
    startAt: 6,
  },
  propDocs: {
    title: 'form heading',
    fields: 'array of {label, value}; each value is typed in (up to 6 fields)',
    checkboxLabel: 'checkbox text (empty removes the checkbox)',
    buttonLabel: 'button text',
    successTitle: 'heading of the success state',
    successText: 'line under the success heading',
    background: "backdrop colour or 'transparent'",
    card: 'form card colour',
    ink: 'text colour',
    accent: 'focus ring, checkbox, button and success colour',
    speed: 'typing speed multiplier (long text speeds up automatically to stay in about 4 s)',
    startAt: 'frame the first field starts',
  },
  component: FormFillSubmit,
  tags: ['form', 'signup', 'submit', 'typing', 'input', 'checkbox', 'cursor', 'success', 'onboarding', 'ui', 'booking', 'contact'],
});
