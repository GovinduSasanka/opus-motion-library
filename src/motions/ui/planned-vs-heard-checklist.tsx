// Adapted from lemo-opuscar/styles/countdown/demo/index.html drawCheck() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CD, ClockBlock, cdW, eo, isClear, la2Fonts, seg, useIdA} from '../../core/r2-la2-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Planned vs reality: a list of milestones with planned clock times; each ticks with an accent check (box fills left→right,
 * ink tick pops) as the shared clock passes it — and when the audio actually says it, a red "heard −32.1" tag with a tiny
 * waveform pops on the right. A small T− clock runs above the list.
 */

type Item = {label: string; sub: string; planned: number; heard?: number};
type Props = {
  items: Item[];
  startSeconds: number;
  title: string;
  subtitle: string;
  footnote: string;
  heardWord: string;
  accent: string;
  alert: string;
  background: string;
  clock: boolean;
};

const fmtT = (m: number) => (m < 0 ? `T−${Math.abs(m) % 1 ? Math.abs(m).toFixed(2).replace(/0+$/, '').replace(/\.$/, '') : Math.abs(m)}` : m === 0 ? 'T−0' : `T+${m}`);

const PlannedVsHeardChecklist: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w: W, h: H, u, fps, portrait, durationInFrames: D} = useStage();
  const id = useIdA('pvh');
  const M = frame / fps + p.startSeconds;
  const s = u * (portrait ? 1.08 : 1.25);
  const pw = Math.min(W - 48 * u, (portrait ? 980 : 900) * s);
  const items = p.items;
  const rh = Math.min(72 * s, (H * 0.62) / Math.max(1, items.length));
  const clockH = p.clock ? 150 * s : 0;
  const headH = 64 * s;
  const ph = headH + clockH + items.length * rh + 58 * s;
  const px = (W - pw) / 2;
  const py = (H - ph) / 2;
  const open = eo(seg(frame, 2, 2 + 0.34 * fps));
  const exit = 1 - seg(frame, D - 8, D);
  return (
    <AbsoluteFill style={{background: isClear(p.background) ? 'transparent' : p.background}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}} opacity={exit}>
        <defs>
          <clipPath id={`${id}o`}>
            <rect x={px} y={py} width={pw * open} height={ph} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}o)`}>
          <rect x={px} y={py} width={pw} height={ph} fill={CD.panel} />
          <rect x={px + 0.5} y={py + 0.5} width={pw - 1} height={ph - 1} fill="none" stroke={CD.line} />
          <rect x={px + 22 * s} y={py + 26 * s} width={8 * s} height={8 * s} fill={p.accent} />
          <text x={px + 40 * s} y={py + 35 * s} fontFamily={la2Fonts.barlow} fontWeight={700} fontSize={20 * s} fill={CD.ink}>
            {p.title}
          </text>
          <text x={px + 48 * s + cdW(p.title, 20 * s, 'sans')} y={py + 34 * s} fontFamily={la2Fonts.plex} fontWeight={500} fontSize={13 * s} fill={CD.dim} letterSpacing={1.5 * s}>
            {p.subtitle}
          </text>
          {p.clock && <ClockBlock x={px + 18 * s} y={py + headH} w={pw - 36 * s} h={clockH - 14 * s} M={M} s={s * 0.6} accent={p.accent} fill="#0E1116" />}
          {items.map((it, i) => {
            const ry = py + headH + clockH + i * rh;
            const passed = M >= it.planned;
            const pk = eo(seg(M, it.planned, it.planned + 0.25));
            const rowIn = eo(seg(frame, 6 + i * 3, 6 + i * 3 + 8));
            const heard = it.heard !== undefined && M >= it.heard;
            const hk = it.heard !== undefined ? eo(seg(M, it.heard, it.heard + 0.3)) : 0;
            const lab = it.heard !== undefined ? `${p.heardWord} ${it.heard < 0 ? '−' : '+'}${Math.abs(it.heard).toFixed(1)}` : '';
            const lw = cdW(lab, 14 * s, 'sans') + 40 * s;
            const box = 20 * s;
            return (
              <g key={i} opacity={rowIn} transform={`translate(${(1 - rowIn) * -14 * s} 0)`}>
                <rect x={px + 22 * s} y={ry + rh / 2 - box / 2} width={box} height={box} fill="none" stroke={passed ? p.accent : 'rgba(124,135,141,0.6)'} strokeWidth={2 * s} />
                {passed && (
                  <>
                    <rect x={px + 22 * s} y={ry + rh / 2 - box / 2} width={box * pk} height={box} fill={p.accent} />
                    <path d={`M${px + 26 * s} ${ry + rh / 2} l${5 * s} ${5 * s} l${8 * s} ${-11 * s}`} fill="none" stroke={CD.dark} strokeWidth={3 * s} opacity={pk} />
                  </>
                )}
                <text x={px + 56 * s} y={ry + rh / 2 + 7 * s} fontFamily={la2Fonts.barlowCond} fontWeight={600} fontSize={22 * s} fill={passed ? CD.ink : CD.dim}>
                  {fmtT(it.planned)}
                </text>
                <text x={px + 132 * s} y={ry + rh / 2 + 7 * s} fontFamily={la2Fonts.barlow} fontWeight={700} fontSize={20 * s} fill={passed ? CD.ink : CD.dim}>
                  {it.label}
                </text>
                <text x={px + 142 * s + cdW(it.label, 20 * s, 'sans')} y={ry + rh / 2 + 6 * s} fontFamily={la2Fonts.plex} fontWeight={500} fontSize={12 * s} fill={passed ? 'rgba(242,245,247,0.6)' : 'rgba(124,135,141,0.7)'}>
                  {it.sub}
                </text>
                {heard && (
                  <g opacity={hk}>
                    <rect x={px + pw - lw - 16 * s} y={ry + rh / 2 - 12 * s} width={lw} height={24 * s} fill="rgba(255,59,48,0.16)" />
                    {[6, 12, 8, 14].map((bh, b) => (
                      <rect key={b} x={px + pw - lw - 8 * s + b * 4 * s} y={ry + rh / 2 - (bh * s) / 2} width={2 * s} height={bh * s} fill={p.alert} />
                    ))}
                    <text x={px + pw - lw + 12 * s} y={ry + rh / 2 + 5 * s} fontFamily={la2Fonts.barlow} fontWeight={500} fontSize={14 * s} fill={CD.ink}>
                      {lab}
                    </text>
                  </g>
                )}
                <rect x={px + 18 * s} y={ry + rh - 1} width={pw - 36 * s} height={1} fill="rgba(222,232,238,0.07)" />
              </g>
            );
          })}
          <text x={px + 22 * s} y={py + ph - 18 * s} fontFamily={la2Fonts.plex} fontWeight={500} fontSize={12 * s} fill="rgba(124,135,141,0.85)">
            {p.footnote}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const plannedVsHeardChecklist = defineMotion<Props>({
  id: 'planned-vs-heard-checklist',
  title: 'Planned vs heard checklist',
  category: 'ui',
  description:
    'A dark milestone checklist with planned T− times: each row ticks with an accent check as the running clock passes it, and a red "heard −32.1" tag with a tiny waveform pops when the call is actually heard — schedule vs reality in one box.',
  source: ['lemo-opuscar styles/countdown (MIT, LemoLab) — demo/index.html drawCheck, CHECK table'],
  useFor: 'Launch checklists, project timelines, run-of-show vs reality, onboarding steps, release-day minute-by-minute; overlay-capable (background transparent).',
  durationInFrames: 210,
  defaultProps: {
    items: [
      {label: 'Hand-over to auto sequence', sub: 'GO FOR AUTO', planned: -33, heard: -32.1},
      {label: 'Core computer takes over', sub: 'CORE → AUTO', planned: -30},
      {label: 'Igniters armed', sub: 'BURN-OFF IGNITERS', planned: -12},
      {label: 'Engine start command', sub: 'ENGINE START CMD', planned: -10},
      {label: 'Main engines lit', sub: 'STARTUP', planned: -6.36, heard: -6.0},
      {label: 'Ignition · lift-off', sub: 'BOOSTER IGNITION', planned: 0, heard: 0.2},
    ],
    startSeconds: -36,
    title: 'Countdown milestones',
    subtitle: 'CHECKLIST',
    footnote: 'PLANNED TIMES AS PUBLISHED · RED TAG = ACTUALLY CALLED OUT',
    heardWord: 'heard',
    accent: CD.org,
    alert: CD.live,
    background: CD.bg,
    clock: true,
  },
  propDocs: {
    items: '[{label, sub, planned, heard?}] planned/heard in seconds relative to zero',
    startSeconds: 'clock value at frame 0 (seconds, negative = before zero)',
    title: 'panel title',
    subtitle: 'small mono tag after the title',
    footnote: 'honesty line at the bottom',
    heardWord: 'word on the red tag',
    accent: 'check / clock accent',
    alert: 'heard-tag colour',
    background: "page colour or 'transparent'",
    clock: 'show the running T− clock above the list',
  },
  component: PlannedVsHeardChecklist,
  tags: ['checklist', 'milestones', 'countdown', 'schedule', 'timeline', 'launch', 'todo', 'ticks', 'heard', 'transcript', 'run of show', 'ui', 'panel', 'dark', 'orange'],
});
