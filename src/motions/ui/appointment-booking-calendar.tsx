import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {clip, resolveFont, useChartBox} from '../../core/r3-chart-kit';
import {Check, MONTHS, WEEKDAYS, daysInMonth, firstWeekday, isClear, mixHex} from '../../core/r3-vertical-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  title: string;
  subtitle: string;
  year: number;
  month: number;
  weekStartsOn: number;
  selectedDay: number;
  unavailableDays: number[];
  disableWeekends: boolean;
  slots: string[];
  selectedSlot: number;
  bookedSlots: number[];
  serviceTitle: string;
  slotsTitle: string;
  confirmLabel: string;
  confirmedTitle: string;
  confirmedNote: string;
  showCursor: boolean;
  background: string;
  panel: string;
  ink: string;
  accent: string;
  fontFamily: string;
  startAt: number;
  speed: number;
};

const SLOTS = ['09:00', '09:30', '10:30', '11:00', '13:30', '14:00', '15:30', '16:00'];

const AppointmentBookingCalendar: React.FC<Props> = ({
  title,
  subtitle,
  year,
  month,
  weekStartsOn,
  selectedDay,
  unavailableDays,
  disableWeekends,
  slots,
  selectedSlot,
  bookedSlots,
  serviceTitle,
  slotsTitle,
  confirmLabel,
  confirmedTitle,
  confirmedNote,
  showCursor,
  background,
  panel,
  ink,
  accent,
  fontFamily,
  startAt,
  speed,
}) => {
  const frame = useCurrentFrame();
  const {u, portrait} = useStage();
  const box = useChartBox(title, subtitle);
  const font = resolveFont(fontFamily);
  const f = (frame - startAt) * speed;

  const dim = daysInMonth(year, month);
  const fw = firstWeekday(year, month);
  const ws = ((Math.round(weekStartsOn) % 7) + 7) % 7;
  const off = (fw - ws + 7) % 7;
  const rows = Math.ceil((off + dim) / 7);
  const sel = clamp(Math.round(selectedDay), 1, dim);
  const monthName = MONTHS[(((Math.round(month) - 1) % 12) + 12) % 12];
  const selWeekday = (fw + sel - 1) % 7;
  const sl = slots.slice(0, 12);
  const slotIdx = clamp(selectedSlot, 0, Math.max(0, sl.length - 1));
  const isOff = (d: number) => unavailableDays.includes(d) || (disableWeekends && [0, 6].includes((fw + d - 1) % 7));

  // layout
  const p = 34 * u;
  const P = {x: box.x, y: box.y, w: box.w, h: box.h};
  const inner = {x: P.x + p, y: P.y + p, w: P.w - p * 2, h: P.h - p * 2};
  const calRect = portrait ? {x: inner.x, y: inner.y, w: inner.w, h: inner.h * 0.5} : {x: inner.x, y: inner.y, w: inner.w * 0.56, h: inner.h};
  const slotRect = portrait ? {x: inner.x, y: inner.y + inner.h * 0.5 + 24 * u, w: inner.w, h: inner.h * 0.5 - 24 * u} : {x: inner.x + inner.w * 0.6, y: inner.y, w: inner.w * 0.4, h: inner.h};
  const hdrH = 70 * u;
  const wkH = 44 * u;
  const cell = Math.min(calRect.w / 7, (calRect.h - hdrH - wkH) / rows);
  const gridW = cell * 7;
  const gx = calRect.x + (calRect.w - gridW) / 2;
  const gy = calRect.y + hdrH + wkH;
  const cc = (d: number) => ({x: gx + ((off + d - 1) % 7) * cell + cell / 2, y: gy + Math.floor((off + d - 1) / 7) * cell + cell / 2});

  // slots layout
  const cols = portrait ? 3 : 2;
  const slotHead = 96 * u;
  const btnH = Math.min(86 * u, slotRect.h * 0.16);
  const chipH = Math.min(70 * u, (slotRect.h - slotHead - btnH - 40 * u) / Math.ceil(Math.max(1, sl.length) / cols) - 12 * u);
  const chipGap = 14 * u;
  const chipW = (slotRect.w - chipGap * (cols - 1)) / cols;
  const chipPos = (i: number) => ({x: slotRect.x + (i % cols) * (chipW + chipGap), y: slotRect.y + slotHead + Math.floor(i / cols) * (chipH + chipGap)});
  const btn = {x: slotRect.x, y: slotRect.y + slotRect.h - btnH, w: slotRect.w, h: btnH};

  // timeline (frames at speed 1)
  const tPanel = prog(f, 0, 22, ease.out);
  const tPick = 62;
  const tSlots = 74;
  const tSlotPick = 120;
  const tBtn = 152;
  const tConf = 164;
  const dayPicked = f >= tPick;
  const slotPicked = f >= tSlotPick;
  const confirmed = f >= tBtn + 2;

  // cursor
  const P1 = cc(sel);
  const cp = chipPos(slotIdx);
  const P2 = {x: cp.x + chipW * 0.6, y: cp.y + chipH * 0.6};
  const P3 = {x: btn.x + btn.w * 0.6, y: btn.y + btn.h * 0.55};
  const P0 = {x: P.x + P.w * 0.92, y: P.y + P.h * 0.98};
  const mv = (a: {x: number; y: number}, b: {x: number; y: number}, t: number) => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
  let cur = P0;
  if (f < tPick) cur = mv(P0, P1, prog(f, 22, tPick - 2, ease.inOut));
  else if (f < tSlotPick) cur = mv(P1, P2, prog(f, tSlots + 12, tSlotPick - 2, ease.inOut));
  else cur = mv(P2, P3, prog(f, tSlotPick + 8, tBtn - 2, ease.inOut));
  const press = (t: number) => 1 - 0.18 * Math.sin(clamp((f - t) / 8) * Math.PI);
  const curScale = Math.min(press(tPick), press(tSlotPick), press(tBtn));
  const curOp = prog(f, 22, 34) * (1 - prog(f, tConf + 12, tConf + 26));

  const clear = isClear(background);
  const onAccent = '#ffffff';
  const dateLabel = `${WEEKDAYS[selWeekday]}, ${monthName.slice(0, 3)} ${sel}`;
  const confT = prog(f, tConf, tConf + 18, ease.back);
  const modalW = Math.min(P.w * 0.8, (portrait ? 760 : 620) * u);
  const modalH = modalW * 0.78;

  const dayNodes: React.ReactNode[] = [];
  for (let d = 1; d <= dim; d++) {
    const c = cc(d);
    const t = prog(f, 4 + d * 0.7, 20 + d * 0.7, ease.out);
    const offDay = isOff(d);
    const isSel = d === sel && dayPicked;
    const selT = d === sel ? ease.back(prog(f, tPick, tPick + 12, ease.linear)) : 0;
    const ripple = d === sel ? prog(f, tPick, tPick + 24, ease.out) : 0;
    dayNodes.push(
      <g key={d} opacity={t}>
        {isSel && <circle cx={c.x} cy={c.y} r={cell * 0.42 * selT} fill={accent} />}
        {d === sel && ripple > 0 && ripple < 1 && <circle cx={c.x} cy={c.y} r={cell * (0.4 + 0.45 * ripple)} fill="none" stroke={accent} strokeOpacity={1 - ripple} strokeWidth={3 * u} />}
        <text x={c.x} y={c.y + cell * 0.13} textAnchor="middle" fontFamily={font} fontWeight={isSel ? 700 : 600} fontSize={cell * 0.34} fill={isSel ? onAccent : ink} fillOpacity={offDay && !isSel ? 0.28 : 1} style={{fontVariantNumeric: 'tabular-nums'}}>
          {d}
        </text>
        {!offDay && !isSel && <circle cx={c.x} cy={c.y + cell * 0.33} r={2.6 * u} fill={accent} opacity={0.8} />}
      </g>,
    );
  }

  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background}}>
      <Svg>
        <defs>
          <clipPath id="abc-clip">
            <rect x={P.x} y={P.y} width={P.w} height={P.h} rx={34 * u} />
          </clipPath>
        </defs>
        {(() => {
          // header
          const header = (
            <g>
              {box.titleLines.map((l, i) => (
                <text key={'t' + i} x={box.px} y={box.titleY + i * box.titleSize * 1.12} opacity={prog(f, 0, 18)} fontFamily={font} fontWeight={700} fontSize={box.titleSize} letterSpacing={-0.5 * u} fill={ink}>
                  {l}
                </text>
              ))}
              {box.subLines.map((l, i) => (
                <text key={'s' + i} x={box.px} y={box.subY + i * box.subSize * 1.35} opacity={prog(f, 5, 24) * 0.62} fontFamily={font} fontWeight={500} fontSize={box.subSize} fill={ink}>
                  {l}
                </text>
              ))}
            </g>
          );
          return header;
        })()}
        <g opacity={clamp(tPanel * 1.5)} transform={`translate(0 ${(1 - tPanel) * 36 * u})`}>
          <rect x={P.x} y={P.y} width={P.w} height={P.h} rx={34 * u} fill={panel} />
          {/* calendar header */}
          <text x={calRect.x + (calRect.w - gridW) / 2 + 6 * u} y={calRect.y + hdrH * 0.62} fontFamily={font} fontWeight={700} fontSize={hdrH * 0.46} fill={ink}>
            {monthName} {year}
          </text>
          <g stroke={ink} strokeOpacity={0.5} strokeWidth={4 * u} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={`M${gx + gridW - 74 * u},${calRect.y + hdrH * 0.4} l${-10 * u},${10 * u} l${10 * u},${10 * u}`} />
            <path d={`M${gx + gridW - 22 * u},${calRect.y + hdrH * 0.4} l${10 * u},${10 * u} l${-10 * u},${10 * u}`} />
          </g>
          {Array.from({length: 7}, (_, i) => (
            <text key={i} x={gx + i * cell + cell / 2} y={calRect.y + hdrH + wkH * 0.66} textAnchor="middle" fontFamily={font} fontWeight={600} fontSize={cell * 0.24} letterSpacing={cell * 0.02} fill={ink} fillOpacity={0.5}>
              {WEEKDAYS[(ws + i) % 7].toUpperCase()}
            </text>
          ))}
          {dayNodes}
          {/* slots column */}
          <g>
            <text x={slotRect.x} y={slotRect.y + 34 * u} fontFamily={font} fontWeight={700} fontSize={32 * u} fill={ink} opacity={prog(f, 16, 32)}>
              {dayPicked ? dateLabel : slotsTitle}
            </text>
            <text x={slotRect.x} y={slotRect.y + 74 * u} fontFamily={font} fontWeight={500} fontSize={24 * u} fill={ink} fillOpacity={0.55} opacity={prog(f, 20, 36)}>
              {clip(dayPicked ? slotsTitle : serviceTitle, slotRect.w, 24 * u)}
            </text>
            {sl.map((s, i) => {
              const pos = chipPos(i);
              const t = prog(f, tSlots + i * 3, tSlots + i * 3 + 14, ease.out);
              const booked = bookedSlots.includes(i);
              const isSel = i === slotIdx && slotPicked;
              const st = i === slotIdx ? ease.back(prog(f, tSlotPick, tSlotPick + 10, ease.linear)) : 0;
              return (
                <g key={i} opacity={t} transform={`translate(0 ${(1 - t) * 14 * u})`}>
                  <rect x={pos.x} y={pos.y} width={chipW} height={chipH} rx={chipH * 0.3} fill={isSel ? accent : 'none'} fillOpacity={st} stroke={isSel ? accent : ink} strokeOpacity={isSel ? 1 : booked ? 0.12 : 0.28} strokeWidth={2.5 * u} />
                  <text x={pos.x + chipW / 2} y={pos.y + chipH * 0.64} textAnchor="middle" fontFamily={font} fontWeight={600} fontSize={chipH * 0.38} fill={isSel ? onAccent : ink} fillOpacity={booked ? 0.28 : 1} style={{fontVariantNumeric: 'tabular-nums'}} textDecoration={booked ? 'line-through' : undefined}>
                    {s}
                  </text>
                </g>
              );
            })}
            {/* confirm button */}
            {(() => {
              const enabled = slotPicked;
              const t = prog(f, tSlots + 8, tSlots + 24);
              const pr = 1 - 0.05 * Math.sin(clamp((f - tBtn) / 8) * Math.PI);
              return (
                <g opacity={t} transform={`translate(${btn.x + btn.w / 2} ${btn.y + btn.h / 2}) scale(${pr}) translate(${-(btn.x + btn.w / 2)} ${-(btn.y + btn.h / 2)})`}>
                  <rect x={btn.x} y={btn.y} width={btn.w} height={btn.h} rx={btn.h * 0.3} fill={enabled ? accent : mixHex(ink, panel, 0.85)} />
                  <text x={btn.x + btn.w / 2} y={btn.y + btn.h * 0.63} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={btn.h * 0.34} fill={enabled ? onAccent : ink} fillOpacity={enabled ? 1 : 0.4}>
                    {clip(confirmLabel, btn.w * 0.9, btn.h * 0.34)}
                  </text>
                </g>
              );
            })()}
          </g>
          {/* confirmation */}
          {f >= tConf - 2 && (
            <g clipPath="url(#abc-clip)">
              <rect x={P.x} y={P.y} width={P.w} height={P.h} fill={panel} fillOpacity={0.82 * prog(f, tConf - 2, tConf + 10)} />
              {(() => {
                const mx = P.x + P.w / 2;
                const my = P.y + P.h / 2;
                const r = modalH * 0.15;
                const burst = prog(f, tConf + 6, tConf + 34, ease.out);
                return (
                  <g opacity={clamp(confT * 1.6)} transform={`translate(${mx} ${my}) scale(${0.85 + 0.15 * clamp(confT)}) translate(${-mx} ${-my})`}>
                    <rect x={mx - modalW / 2} y={my - modalH / 2} width={modalW} height={modalH} rx={30 * u} fill={mixHex(panel, '#ffffff', 0.08)} stroke={accent} strokeOpacity={0.5} strokeWidth={2.5 * u} />
                    <circle cx={mx} cy={my - modalH * 0.27} r={r} fill={accent} />
                    {burst > 0 && burst < 1 && <circle cx={mx} cy={my - modalH * 0.27} r={r * (1 + burst * 0.9)} fill="none" stroke={accent} strokeOpacity={1 - burst} strokeWidth={4 * u} />}
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
                      const a = (k / 8) * Math.PI * 2;
                      const d = r * (1.3 + burst * 0.9);
                      return burst > 0 && burst < 1 ? <circle key={k} cx={mx + Math.cos(a) * d} cy={my - modalH * 0.27 + Math.sin(a) * d} r={5 * u * (1 - burst)} fill={accent} /> : null;
                    })}
                    <Check x={mx} y={my - modalH * 0.27} s={r * 0.9} color={onAccent} width={r * 0.2} t={prog(f, tConf + 8, tConf + 24)} />
                    <text x={mx} y={my + modalH * 0.05} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={modalH * 0.1} fill={ink}>
                      {clip(confirmedTitle, modalW * 0.9, modalH * 0.1)}
                    </text>
                    <text x={mx} y={my + modalH * 0.18} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={modalH * 0.075} fill={accent}>
                      {clip(`${dateLabel}  ${'·'}  ${sl[slotIdx] ?? ''}`, modalW * 0.9, modalH * 0.075)}
                    </text>
                    <text x={mx} y={my + modalH * 0.29} textAnchor="middle" fontFamily={font} fontWeight={500} fontSize={modalH * 0.058} fill={ink} fillOpacity={0.6}>
                      {clip(serviceTitle, modalW * 0.9, modalH * 0.058)}
                    </text>
                    {confirmedNote ? (
                      <text x={mx} y={my + modalH * 0.4} textAnchor="middle" fontFamily={font} fontWeight={500} fontSize={modalH * 0.05} fill={ink} fillOpacity={0.45}>
                        {clip(confirmedNote, modalW * 0.9, modalH * 0.05)}
                      </text>
                    ) : null}
                  </g>
                );
              })()}
            </g>
          )}
        </g>
        {/* cursor */}
        {showCursor && curOp > 0 && (
          <g opacity={curOp} transform={`translate(${cur.x} ${cur.y}) scale(${u * 1.7 * curScale})`}>
            <path d="M0,0 L0,21 L5.5,16.4 L9.2,25 L13,23.3 L9.3,14.8 L16.5,14.8Z" fill="#fff" stroke="#12161C" strokeWidth={1.6} strokeLinejoin="round" />
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const appointmentBookingCalendar = defineMotion<Props>({
  id: 'appointment-booking-calendar',
  title: 'Appointment booking calendar',
  category: 'ui',
  description:
    'A booking widget plays itself: a month calendar fades in, a cursor picks a date (ripple, filled circle), time-slot chips appear for that day, the cursor picks a slot and presses a Confirm button, and a confirmation card with an animated check and the chosen date, time and service pops over the panel.',
  source: ['original round-3 vertical motion'],
  useFor:
    'Booking, scheduling and reservation products: clinics, salons, restaurants, consultants, tutors, coworking and event tools; "book in 3 clicks" promos and onboarding. Set the month / year, the day and slot to pick, the slot list, unavailable days and your own wording.',
  durationInFrames: 240,
  defaultProps: {
    title: 'Book in three clicks',
    subtitle: 'Pick a day, choose a time, done',
    year: 2026,
    month: 6,
    weekStartsOn: 0,
    selectedDay: 17,
    unavailableDays: [1, 2, 8, 9],
    disableWeekends: true,
    slots: SLOTS,
    selectedSlot: 2,
    bookedSlots: [1, 5],
    serviceTitle: 'Consultation - 30 min',
    slotsTitle: 'Available times',
    confirmLabel: 'Confirm booking',
    confirmedTitle: "You're booked!",
    confirmedNote: 'A confirmation was sent to your inbox',
    showCursor: true,
    background: '#EAF0F6',
    panel: '#FFFFFF',
    ink: '#15202B',
    accent: '#2F6FED',
    fontFamily: '',
    startAt: 4,
    speed: 1,
  },
  propDocs: {
    title: 'headline (empty = none)',
    subtitle: 'line under the headline (empty = none)',
    year: 'calendar year (leap years handled)',
    month: 'calendar month 1-12',
    weekStartsOn: 'first weekday column: 0 = Sunday, 1 = Monday',
    selectedDay: 'day of the month the cursor picks',
    unavailableDays: 'days of the month that are greyed out',
    disableWeekends: 'grey out Saturdays and Sundays too',
    slots: 'time-slot labels (up to 12)',
    selectedSlot: 'index of the slot the cursor picks',
    bookedSlots: 'indices of slots shown as already taken',
    serviceTitle: 'service / appointment name on the confirmation card',
    slotsTitle: 'caption over the slot grid',
    confirmLabel: 'text on the confirm button',
    confirmedTitle: 'headline on the confirmation card',
    confirmedNote: 'small line under the confirmation details (empty = none)',
    showCursor: 'draw the mouse cursor that drives the demo',
    background: 'page colour, or "transparent"',
    panel: 'widget card colour',
    ink: 'text colour',
    accent: 'selection, button and check colour',
    fontFamily: 'CSS font family (empty = Space Grotesk)',
    startAt: 'frame the widget starts entering',
    speed: 'animation speed multiplier',
  },
  component: AppointmentBookingCalendar,
  tags: ['booking', 'appointment', 'calendar', 'scheduling', 'reservation', 'time slots', 'date picker', 'confirmation', 'clinic', 'salon', 'saas', 'app demo', 'cursor', 'overlay'],
});
