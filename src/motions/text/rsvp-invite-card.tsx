import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {useSafeId} from '../../core/image-kit';
import {Confetti, EventStage, EvIcon, PointerArrow, backOut, fitFont, mixHex, sparkPath, starPath, withAlpha} from '../../core/r3-events-kit';
import {wrapText} from '../../core/r3-social';
import {defineMotion} from '../../core/types';

/**
 * A party / event invitation card rises into place, its title, host and detail rows (date, time, place, dress code) pop in with
 * icons, then a pointer glides to the RSVP button and presses it: the button ripples, turns into a confirmed state with a check,
 * and confetti pops with a "see you there" line.
 */
type Detail = {icon: string; label: string; value: string};
type Props = {
  eyebrow: string;
  title: string;
  host: string;
  details: Detail[];
  button: string;
  confirmLabel: string;
  thanks: string;
  replyBy: string;
  background: string;
  card: string;
  ink: string;
  accent: string;
  success: string;
  seed: number;
  startAt: number;
};

const RsvpInviteCard: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const uid = useSafeId('rsvp');
  const f = Math.max(0, frame - p.startAt);
  const details = (p.details || []).slice(0, 4);
  const R0 = rng(p.seed * 41 + 3);
  const deco = Array.from({length: 16}, () => ({x: R0(), y: R0(), s: 14 + R0() * 26, k: Math.floor(R0() * 4), r: R0() * 360, a: R0()}));
  const rise = (a: number, b = a + 20) => ease.out(prog(f, a, b, ease.linear));

  return (
    <EventStage background={p.background}>
      {(L) => {
        const {W, H, kind} = L;
        const wide = kind === 'wide';
        const tall = kind === 'tall';
        const cw = wide ? 1180 : tall ? 800 : 860;
        const ch = wide ? 740 : tall ? 1240 : 860;
        const x0 = (W - cw) / 2;
        const y0 = (H - ch) / 2;
        const pw = wide ? 540 : cw;
        const ph = wide ? ch : tall ? 520 : 320;
        const cx = x0 + cw / 2;
        const enter = ease.out(prog(f, 0, 36, ease.linear));
        const rot = (1 - enter) * -7;
        const oy = (1 - enter) * 260;
        const sc = 0.86 + 0.14 * enter;

        // regions
        const qx = wide ? x0 + pw : x0; // detail region origin
        const qy = wide ? y0 : y0 + ph;
        const qw = wide ? cw - pw : cw;
        const qh = wide ? ch : ch - ph;
        const rowPitch = wide ? 104 : tall ? 108 : 84;
        const rowsY0 = qy + (wide ? 118 : tall ? 70 : 52);
        const dx = wide ? qx + 64 : x0 + (cw - Math.min(cw - 140, 520)) / 2 + 10;
        const detW = wide ? qw - 128 : Math.min(cw - 140, 560);

        // title
        const tAlign = wide ? 'start' : 'middle';
        const tx = wide ? x0 + 64 : cx;
        const maxTW = wide ? pw - 110 : cw - 120;
        const tSz0 = wide ? 120 : tall ? 120 : 100;
        const tLines = wrapText(p.title.toUpperCase(), tSz0, maxTW, 'display', 3);
        const tSz = Math.min(tSz0, ...tLines.map((ln) => fitFont(ln, tSz0, maxTW, 0.7)));
        const tY0 = wide ? y0 + 296 - ((tLines.length - 1) * tSz * 0.52) : y0 + (tall ? 230 : 168);
        const hostY = tY0 + (tLines.length - 1) * tSz * 1.04 + (wide ? 70 : tall ? 80 : 62);

        // button
        const bw = wide ? 410 : 520;
        const bh = wide ? 92 : 100;
        const bx = wide ? qx + qw / 2 : cx;
        const by = y0 + ch - 196;
        const btnIn = backOut(prog(f, 104, 122, ease.linear), 2);
        const press = prog(f, 164, 170, ease.out) * (1 - prog(f, 170, 180, ease.out));
        const done = f >= 170;
        const hover = prog(f, 154, 162, ease.out) * (1 - prog(f, 172, 176, ease.in));
        const bScale = btnIn * (1 + 0.04 * hover - 0.08 * press) * (done ? 1 + 0.06 * Math.sin(clamp((f - 170) / 14) * Math.PI) : 1);
        const bCol = done ? mixHex(p.success, '#000000', 0.04) : p.accent;
        const labelFs = fitFont(p.button.toUpperCase(), 40, bw - 80, 0.68);
        const confirmFs = fitFont(p.confirmLabel, 38, bw - 130, 0.55);

        // cursor path
        const cT = ease.inOut(prog(f, 126, 160, ease.linear));
        const curX = lerp(bx + 380, bx + 56, cT) + Math.sin(cT * Math.PI) * 30;
        const curY = lerp(by + 330, by + 24, cT) - Math.sin(cT * Math.PI) * 40;
        const curOut = prog(f, 186, 214, ease.inOut);
        const curOp = Math.min(1, ease.out(prog(f, 122, 134, ease.linear))) * (1 - ease.in(prog(f, 196, 214, ease.linear)));

        const swapNote = ease.out(prog(f, 176, 198, ease.linear));
        const clipId = `${uid}-card`;
        const panelCol = p.accent;
        const panelInk = p.card;

        return (
          <g transform={`translate(${cx} ${y0 + ch / 2 + oy}) rotate(${rot}) scale(${sc}) translate(${-cx} ${-(y0 + ch / 2)})`}>
            <defs>
              <clipPath id={`${clipId}p`}>
                <rect x={x0} y={y0} width={pw} height={ph} />
              </clipPath>
              <clipPath id={clipId}>
                <rect x={x0} y={y0} width={cw} height={ch} rx={34} />
              </clipPath>
            </defs>
            <rect x={x0} y={y0 + 16} width={cw} height={ch} rx={34} fill="#000" opacity={0.2} />
            <rect x={x0} y={y0} width={cw} height={ch} rx={34} fill={p.card} />
            <g clipPath={`url(#${clipId})`}>
              <rect x={x0} y={y0} width={pw} height={ph} fill={panelCol} />
              <g clipPath={`url(#${clipId}p)`}>
              {/* decorations in the coloured panel */}
              <circle cx={x0 + pw * 0.92} cy={y0 + ph * 0.1} r={pw * 0.28} fill={mixHex(panelCol, '#ffffff', 0.12)} />
              <circle cx={x0 + pw * 0.05} cy={y0 + ph * 1.0} r={pw * 0.3} fill={mixHex(panelCol, '#000000', 0.12)} />
              {deco.map((d, i) => {
                const px = x0 + 30 + d.x * (pw - 60);
                const py = y0 + 30 + d.y * (ph - 60);
                const drift = Math.sin(f * 0.04 + i * 1.7) * 6;
                const col = i % 3 === 0 ? mixHex(panelCol, '#ffffff', 0.55) : i % 3 === 1 ? p.card : mixHex(panelCol, '#ffffff', 0.3);
                const op = 0.4 * ease.out(prog(f, 20 + i, 44 + i, ease.linear));
                return (
                  <g key={i} transform={`translate(${px} ${py + drift}) rotate(${d.r + f * (d.a - 0.5) * 1.2})`} opacity={op}>
                    {d.k === 0 ? <circle r={d.s * 0.3} fill={col} /> : d.k === 1 ? <rect x={-d.s * 0.4} y={-d.s * 0.15} width={d.s * 0.8} height={d.s * 0.3} rx={3} fill={col} /> : d.k === 2 ? <path d={`M0 ${-d.s * 0.4}L${d.s * 0.35} ${d.s * 0.3}L${-d.s * 0.35} ${d.s * 0.3}Z`} fill={col} /> : <path d={starPath(0, 0, d.s * 0.42)} fill={col} />}
                  </g>
                );
              })}
              </g>
            </g>

            {/* panel text */}
            <g>
              <text x={tx} y={wide ? y0 + 112 : y0 + (tall ? 110 : 86)} textAnchor={tAlign} fontFamily={fonts.sans} fontWeight={800} fontSize={fitFont(p.eyebrow.toUpperCase(), 30, maxTW, 0.85)} letterSpacing={8} fill={panelInk} opacity={0.9 * rise(24)} transform={`translate(0 ${(1 - rise(24)) * 14})`}>
                {p.eyebrow.toUpperCase()}
              </text>
              {tLines.map((ln, i) => {
                const k = backOut(prog(f, 34 + i * 9, 56 + i * 9, ease.linear), 1.8);
                const y = tY0 + i * tSz * 1.04;
                return (
                  <g key={i} transform={`translate(${tx} ${y}) scale(${k}) translate(${-tx} ${-y})`} opacity={Math.min(1, k * 1.6)}>
                    <text x={tx + 5} y={y + 6} textAnchor={tAlign} fontFamily={fonts.display} fontSize={tSz} fill="#000" opacity={0.18}>
                      {ln}
                    </text>
                    <text x={tx} y={y} textAnchor={tAlign} fontFamily={fonts.display} fontSize={tSz} fill={panelInk}>
                      {ln}
                    </text>
                  </g>
                );
              })}
              <text x={tx} y={hostY} textAnchor={tAlign} fontFamily={fonts.serif} fontWeight={700} fontSize={fitFont(p.host, wide ? 40 : 40, maxTW, 0.5)} fill={panelInk} opacity={0.92 * rise(70)} transform={`translate(0 ${(1 - rise(70)) * 12})`}>
                {p.host}
              </text>
              <path d={`M${wide ? tx : tx - 50} ${hostY + 26}h100`} stroke={panelInk} strokeWidth={4} strokeLinecap="round" opacity={0.7} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - rise(76, 100)} />
            </g>

            {/* detail rows */}
            {details.map((d, i) => {
              const k = rise(76 + i * 10, 96 + i * 10);
              const pop = backOut(prog(f, 76 + i * 10, 92 + i * 10, ease.linear), 2);
              const y = rowsY0 + i * rowPitch;
              return (
                <g key={i} opacity={k} transform={`translate(${(1 - k) * 40} 0)`}>
                  <g transform={`translate(${dx + 34} ${y + 14}) scale(${pop}) translate(${-(dx + 34)} ${-(y + 14)})`}>
                    <circle cx={dx + 34} cy={y + 14} r={36} fill={mixHex(p.accent, p.card, 0.86)} />
                    <EvIcon name={d.icon} x={dx + 34} y={y + 14} s={36} color={p.accent} sw={1.8} />
                  </g>
                  <text x={dx + 92} y={y - 2} fontFamily={fonts.sans} fontWeight={800} fontSize={22} letterSpacing={5} fill={p.accent}>
                    {d.label.toUpperCase()}
                  </text>
                  <text x={dx + 92} y={y + 40} fontFamily={fonts.grotesk} fontWeight={700} fontSize={fitFont(d.value, 42, detW - 100, 0.56)} fill={p.ink}>
                    {d.value}
                  </text>
                </g>
              );
            })}

            {/* reply-by / thanks line */}
            <text x={bx} y={by + bh + 52} textAnchor="middle" fontFamily={fonts.sans} fontWeight={600} fontSize={fitFont(p.replyBy, 26, bw + 120, 0.52)} fill={p.ink} opacity={0.6 * rise(112) * (1 - swapNote)}>
              {p.replyBy}
            </text>
            <text x={bx} y={by + bh + 58} textAnchor="middle" fontFamily={fonts.hand} fontWeight={700} fontSize={fitFont(p.thanks, 56, bw + 100, 0.4)} fill={p.success} opacity={swapNote} transform={`translate(0 ${(1 - swapNote) * 14})`}>
              {p.thanks}
            </text>

            {/* button */}
            <g transform={`translate(${bx} ${by + bh / 2}) scale(${bScale})`} opacity={Math.min(1, btnIn * 1.5)}>
              <rect x={-bw / 2} y={-bh / 2 + 8} width={bw} height={bh} rx={bh / 2} fill={mixHex(bCol, '#000000', 0.35)} opacity={0.9 - press * 0.7} />
              <rect x={-bw / 2} y={-bh / 2 + 8 * (press > 0 ? 1 - press : 1) * 0.4} width={bw} height={bh} rx={bh / 2} fill={bCol} />
              <rect x={-bw / 2 + 10} y={-bh / 2 + 7} width={bw - 20} height={bh * 0.32} rx={bh * 0.16} fill="#fff" opacity={0.16} />
              {!done && (
                <text x={0} y={labelFs * 0.35} textAnchor="middle" fontFamily={fonts.display} fontSize={labelFs} letterSpacing={labelFs * 0.12} fill={p.card}>
                  {p.button.toUpperCase()}
                </text>
              )}
              {done && (
                <g opacity={ease.out(prog(f, 170, 180, ease.linear))}>
                  <circle cx={-bw / 2 + 62} cy={0} r={28} fill={p.card} />
                  <path d="M-12 0L-3 10L14 -9" transform={`translate(${-bw / 2 + 62} 0)`} fill="none" stroke={p.success} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease.out(prog(f, 172, 190, ease.linear))} />
                  <text x={34} y={confirmFs * 0.35} textAnchor="middle" fontFamily={fonts.display} fontSize={confirmFs} fill={p.card}>
                    {p.confirmLabel}
                  </text>
                </g>
              )}
            </g>
            {/* ripple + confetti */}
            {f >= 166 && f < 200 && <circle cx={bx + 56} cy={by + bh / 2 + 24} r={(f - 166) * 9} fill="none" stroke={p.success} strokeWidth={8 * (1 - (f - 166) / 34)} opacity={1 - (f - 166) / 34} />}
            <Confetti x={bx} y={by + bh / 2} t={f - 170} seed={p.seed + 8} colors={[p.accent, p.success, '#FFC857', mixHex(p.accent, '#ffffff', 0.5)]} n={56} power={21} spread={Math.PI * 1.1} dir={-Math.PI / 2} life={100} size={0.95} />
            {f >= 172 && f < 220 && [0, 1, 2].map((i) => {
              const ph0 = (f - 172 - i * 8) / 36;
              if (ph0 < 0 || ph0 > 1) return null;
              return <path key={i} d={sparkPath(bx + (i - 1) * bw * 0.42, by - 26 - ph0 * 50, 20 * Math.sin(ph0 * Math.PI))} fill="#FFC857" />;
            })}

            {/* pointer */}
            <g opacity={curOp} transform={`translate(${(curOut > 0 ? curOut * 120 : 0) * 0} 0)`}>
              <PointerArrow x={curX + curOut * 140} y={curY + curOut * 110} press={press} />
            </g>
            {void withAlpha}
          </g>
        );
      }}
    </EventStage>
  );
};

export const rsvpInviteCard = defineMotion<Props>({
  id: 'rsvp-invite-card',
  title: 'RSVP invite card with button press',
  category: 'text',
  description: 'An invitation card rises into place, its title, host and icon rows (date, time, place, dress code) pop in, then a pointer glides to the RSVP button and presses it: ripple, a confirmed check state, confetti and a "see you there" line.',
  source: ['original (round 3, events & celebrations)'],
  useFor: 'Party, wedding, webinar, launch-event and meetup invitations, RSVP reminders, event sign-up promos, "reserve your spot" call-to-actions. Replace the title, host, details (icon: calendar, clock, pin, hanger, gift, star, heart, ticket, phone) and the colours.',
  durationInFrames: 270,
  defaultProps: {
    eyebrow: 'You are invited',
    title: 'Garden Party',
    host: 'Hosted by Sam & Jo',
    details: [
      {icon: 'calendar', label: 'Date', value: 'Saturday, 12 April'},
      {icon: 'clock', label: 'Time', value: '4:00 PM onwards'},
      {icon: 'pin', label: 'Place', value: '12 Orchard Lane'},
      {icon: 'hanger', label: 'Dress code', value: 'Smart casual'},
    ],
    button: 'RSVP',
    confirmLabel: "I'm going!",
    thanks: 'See you there!',
    replyBy: 'Please reply by 1 April',
    background: '#E7DFF7',
    card: '#FFFFFF',
    ink: '#2A2340',
    accent: '#7B5CE0',
    success: '#2FA37A',
    seed: 4,
    startAt: 0,
  },
  propDocs: {
    eyebrow: 'small line above the title',
    title: 'event name (wraps to up to three lines)',
    host: 'host / organiser line under the title',
    details: 'up to four {icon, label, value} rows (icons: calendar, clock, pin, hanger, gift, star, heart, ticket, phone)',
    button: 'button label before the press',
    confirmLabel: 'button label after the press',
    thanks: 'line that replaces the reply-by note after the press',
    replyBy: 'note shown under the button',
    background: 'frame colour (hex), or "transparent" to overlay content',
    card: 'card and button text colour (hex)',
    ink: 'detail text colour (hex)',
    accent: 'header panel, icon and button colour (hex)',
    success: 'confirmed-state colour (hex)',
    seed: 'seed for the panel decorations',
    startAt: 'frame the sequence begins',
  },
  component: RsvpInviteCard,
  tags: ['rsvp', 'invitation', 'invite', 'party', 'event', 'button', 'cursor', 'press', 'confirm', 'birthday', 'wedding', 'webinar', 'meetup', 'celebration'],
});
