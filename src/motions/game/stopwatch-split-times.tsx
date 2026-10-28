import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {backOut, bgCss, bodyFont, clampN, easeOut3, fitFont, fmtTime, headFont, mixHex, num, onColor, sseg, withAlpha, isDark} from '../../core/r3-sports-kit';
import {Svg, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Big stopwatch with a lap list: a dial whose sweep hand and lap-progress ring run while a digital readout counts up; every lap
 * freezes the readout on that lap's time for a beat and drops a row into the splits list (bar, time, +/- against the previous lap).
 * At the finish the best lap is tagged green, the slowest red, and the total locks in. Real time is compressed to fit the clip.
 */
type Props = {
  title: string;
  subtitle: string;
  laps: number[];
  lapLabel: string;
  totalLabel: string;
  showDial: boolean;
  background: string;
  surface: string;
  ink: string;
  accent: string;
  good: string;
  bad: string;
  fontFamily: string;
};

const StopwatchSplitTimes: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: T, portrait} = useStage();
  const head = headFont(P.fontFamily);
  const body = bodyFont(P.fontFamily);
  const mono = !P.fontFamily || P.fontFamily === 'auto' ? fonts.mono : P.fontFamily;

  const laps = (Array.isArray(P.laps) && P.laps.length ? P.laps : [27.4, 26.9, 27.8, 26.5, 27.1, 25.9]).slice(0, 12).map((x) => Math.max(0.01, num(x, 27)));
  const n = laps.length;
  const cum: number[] = [];
  laps.reduce((s, x, i) => (cum[i] = s + x), 0);
  const total = cum[n - 1];
  const best = laps.indexOf(Math.min(...laps));
  const worst = laps.indexOf(Math.max(...laps));
  const minL = Math.min(...laps);
  const maxL = Math.max(...laps);

  // timeline: the clock runs between rs and re (compressed), then locks
  const rs = 34;
  const re = Math.max(rs + 40, T - 78);
  const frameOfClock = (c: number) => rs + (c / total) * (re - rs);
  const lapFrames = cum.map(frameOfClock);
  const running = sseg(frame, rs, re);
  const clock = total * running;
  const done = frame >= re;
  // lap currently being timed and its progress
  let lapIdx = 0;
  while (lapIdx < n - 1 && clock >= cum[lapIdx] - 1e-6 && frame >= lapFrames[lapIdx]) lapIdx++;
  const lapStart = lapIdx === 0 ? 0 : cum[lapIdx - 1];
  const lapProg = done ? 1 : clampN((clock - lapStart) / laps[lapIdx], 0, 1);
  // readout freeze right after a lap closes
  let freeze = -1;
  for (let i = 0; i < n; i++) if (frame >= lapFrames[i] && frame < lapFrames[i] + 16 && i < n - 1) freeze = i;
  const shown = done ? total : freeze >= 0 ? laps[freeze] : clock;
  const shownLabel = done ? P.totalLabel : freeze >= 0 ? `${P.lapLabel} ${freeze + 1}` : `${P.lapLabel} ${lapIdx + 1}`;
  const flashAt = (i: number) => 1 - sseg(frame, lapFrames[i], lapFrames[i] + 14);
  const lastFlash = done ? 1 - sseg(frame, re, re + 18) : freeze >= 0 ? flashAt(freeze) : 0;

  // layout
  const wide = w / h > 1.4;
  const pad = 56 * u;
  const headH = (portrait ? 250 : 200) * u;
  const dialArea = wide ? {x: pad, y: headH * 0.85, w: w * 0.5 - pad * 1.5, h: h - headH * 0.85 - pad} : {x: pad, y: headH, w: w - pad * 2, h: portrait ? h * 0.42 : h * 0.4};
  const R = Math.min(dialArea.w / 2, dialArea.h / 2.3, 430 * u);
  const D = R * 2;
  const dcx = dialArea.x + dialArea.w / 2;
  const dcy = dialArea.y + dialArea.h / 2 + R * 0.1;
  const listBox = !P.showDial ? {x: wide ? w * 0.2 : pad, y: headH, w: wide ? w * 0.6 : w - pad * 2, h: h - headH - pad} : wide ? {x: w * 0.54, y: headH * 0.85, w: w - w * 0.54 - pad, h: h - headH * 0.85 - pad} : {x: pad, y: dialArea.y + dialArea.h + 24 * u, w: w - pad * 2, h: h - (dialArea.y + dialArea.h + 24 * u) - pad};
  const rowsN = n + 1; // + total row
  const rowH = Math.min((wide ? 96 : 100) * u, listBox.h / rowsN);
  const rowGap = rowH * 0.1;

  const appear = easeOut3(sseg(frame, 0, 22));
  const titleP = easeOut3(sseg(frame, 2, 26));
  const tFs = fitFont((P.title || '').toUpperCase(), (portrait ? 78 : 64) * u, (wide ? w * 0.9 : w - pad * 2) * 0.98);

  // dial geometry
  const ticks = Array.from({length: 60}, (_, i) => i);
  const handAng = ((clock % 60) / 60) * 360;
  const ringR = R * 0.9;
  const ringLen = 2 * Math.PI * ringR;
  const readFs = fitFont(fmtTime(total, 2, true), R * 0.2, R * 0.74, 'sans', 0.06);

  const readBg = mixHex(P.surface, '#000000', 0.82);
  const readInk = onColor(readBg);
  const dialStyle: React.CSSProperties = {opacity: appear, transform: `scale(${0.9 + 0.1 * appear})`, transformOrigin: `${dcx}px ${dcy}px`};

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      {bgCss(P.background) && (
        <>
          <AbsoluteFill style={{background: `radial-gradient(ellipse 50% 60% at ${(dcx / w) * 100}% ${(dcy / h) * 100}%, ${withAlpha(P.accent, 0.14)}, transparent 70%)`}} />
          {isDark(P.background) && <Vignette strength={0.5} />}
        </>
      )}
      {/* title */}
      <div style={{position: 'absolute', left: pad, top: pad * 0.8, width: wide ? w - pad * 2 : w - pad * 2, textAlign: wide ? 'left' : 'center', opacity: titleP, transform: `translateY(${(1 - titleP) * -24 * u}px)`}}>
        <div style={{fontFamily: body, fontWeight: 700, fontSize: 26 * u, letterSpacing: 8 * u, color: P.accent, textTransform: 'uppercase'}}>{P.subtitle}</div>
        <div style={{fontFamily: head, fontSize: tFs, color: P.ink, lineHeight: 1.05, marginTop: 8 * u, textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{P.title}</div>
      </div>

      {P.showDial && (
        <>
          <div style={{position: 'absolute', inset: 0, ...dialStyle}}>
            <Svg>
              <defs>
                <radialGradient id="sw-face" cx="50%" cy="40%" r="75%">
                  <stop offset="0" stopColor={mixHex(P.surface, '#ffffff', 0.08)} />
                  <stop offset="1" stopColor={mixHex(P.surface, '#000000', 0.35)} />
                </radialGradient>
              </defs>
              {/* crown + pusher */}
              <rect x={dcx - R * 0.07} y={dcy - R - R * 0.14} width={R * 0.14} height={R * 0.16} rx={R * 0.02} fill={mixHex(P.surface, '#ffffff', 0.35)} />
              <rect x={dcx - R * 0.11} y={dcy - R - R * 0.2} width={R * 0.22} height={R * 0.08} rx={R * 0.03} fill={mixHex(P.surface, '#ffffff', 0.5)} transform={`translate(0 ${lastFlash * R * 0.03})`} />
              {/* case */}
              <circle cx={dcx} cy={dcy} r={R} fill={mixHex(P.surface, '#ffffff', 0.2)} />
              <circle cx={dcx} cy={dcy} r={R * 0.975} fill="url(#sw-face)" />
              {/* lap progress ring */}
              <circle cx={dcx} cy={dcy} r={ringR} fill="none" stroke={withAlpha(P.ink, 0.1)} strokeWidth={R * 0.05} />
              <circle cx={dcx} cy={dcy} r={ringR} fill="none" stroke={P.accent} strokeWidth={R * 0.05} strokeLinecap="round" strokeDasharray={`${ringLen * lapProg} ${ringLen}`} transform={`rotate(-90 ${dcx} ${dcy})`} opacity={0.95} />
              {/* ticks + numbers */}
              {ticks.map((i) => {
                const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
                const major = i % 5 === 0;
                const r1 = R * (major ? 0.76 : 0.79);
                const r2 = R * 0.83;
                return <line key={i} x1={dcx + Math.cos(a) * r1} y1={dcy + Math.sin(a) * r1} x2={dcx + Math.cos(a) * r2} y2={dcy + Math.sin(a) * r2} stroke={withAlpha(P.ink, major ? 0.85 : 0.35)} strokeWidth={major ? R * 0.016 : R * 0.008} strokeLinecap="round" />;
              })}
              {Array.from({length: 4}, (_, i) => {
                const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
                return (
                  <text key={i} x={dcx + Math.cos(a) * R * 0.66} y={dcy + Math.sin(a) * R * 0.66 + R * 0.035} fontFamily={body} fontWeight={700} fontSize={R * 0.085} fill={withAlpha(P.ink, 0.6)} textAnchor="middle">
                    {i * 15}
                  </text>
                );
              })}
              {/* sweep hand */}
              <g transform={`rotate(${handAng} ${dcx} ${dcy})`}>
                <line x1={dcx} y1={dcy + R * 0.14} x2={dcx} y2={dcy - R * 0.8} stroke={P.accent} strokeWidth={R * 0.022} strokeLinecap="round" />
                <circle cx={dcx} cy={dcy} r={R * 0.045} fill={P.accent} />
              </g>
              <circle cx={dcx} cy={dcy} r={R * 0.018} fill={P.surface} />
            </Svg>
            {/* digital readout */}
            <div style={{position: 'absolute', left: dcx - R * 0.42, width: R * 0.84, top: dcy + R * 0.17, height: R * 0.38, borderRadius: R * 0.06, background: mixHex(P.surface, '#000000', 0.82), border: `${Math.max(2, R * 0.012)}px solid ${withAlpha(P.ink, 0.15)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: `inset 0 0 ${R * 0.1}px ${withAlpha(P.accent, 0.25 * lastFlash)}`}}>
              <div style={{fontFamily: body, fontWeight: 700, fontSize: R * 0.065, letterSpacing: R * 0.02, color: done ? P.good : P.accent, textTransform: 'uppercase'}}>{shownLabel}</div>
              <div style={{fontFamily: mono, fontWeight: 700, fontSize: readFs, lineHeight: 1.05, color: lastFlash > 0.2 ? mixHex(readInk, P.accent, lastFlash) : readInk, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>{fmtTime(shown, 2, true)}</div>
            </div>
          </div>
        </>
      )}

      {/* splits list */}
      <div style={{position: 'absolute', left: listBox.x, top: listBox.y + (wide ? Math.max(0, (listBox.h - rowsN * rowH) / 2) : 0), width: listBox.w, height: listBox.h}}>
        {laps.map((lt, i) => {
          const a = lapFrames[i];
          const p = easeOut3(sseg(frame, a, a + 18));
          if (p <= 0) return null;
          const prev = i > 0 ? laps[i - 1] : null;
          const dlt = prev === null ? null : lt - prev;
          const isBest = done && i === best && n > 1;
          const isWorst = done && i === worst && n > 1 && worst !== best;
          const barP = easeOut3(sseg(frame, a + 4, a + 26));
          const frac = clampN(0.35 + 0.65 * ((lt - minL * 0.9) / Math.max(0.001, maxL - minL * 0.9)), 0.2, 1);
          const hot = 1 - sseg(frame, a, a + 22);
          const col = isBest ? P.good : isWorst ? P.bad : P.ink;
          const bh = rowH - rowGap;
          return (
            <div key={i} style={{position: 'absolute', left: 0, right: 0, top: i * rowH, height: bh, opacity: p, transform: `translateX(${(1 - p) * 70 * u}px)`, background: mixHex(P.surface, '#ffffff', 0.04 + hot * 0.14), borderRadius: bh * 0.14, overflow: 'hidden', display: 'flex', alignItems: 'center'}}>
              <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${frac * barP * 100}%`, background: `linear-gradient(90deg, ${withAlpha(isBest ? P.good : isWorst ? P.bad : P.accent, 0.38)}, ${withAlpha(isBest ? P.good : isWorst ? P.bad : P.accent, 0.1)})`}} />
              <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 * u, background: isBest ? P.good : isWorst ? P.bad : P.accent}} />
              <div style={{position: 'relative', display: 'flex', alignItems: 'center', width: '100%', padding: `0 ${bh * 0.3}px 0 ${bh * 0.45}px`, gap: bh * 0.25}}>
                <div style={{fontFamily: body, fontWeight: 700, fontSize: bh * 0.3, letterSpacing: bh * 0.05, color: withAlpha(P.ink, 0.7), textTransform: 'uppercase', width: bh * 1.6, whiteSpace: 'nowrap'}}>
                  {P.lapLabel} {i + 1}
                </div>
                <div style={{fontFamily: mono, fontWeight: 700, fontSize: bh * 0.46, color: col, fontVariantNumeric: 'tabular-nums', flex: 1, whiteSpace: 'nowrap'}}>{fmtTime(lt, 2, true)}</div>
                <div style={{fontFamily: body, fontWeight: 700, fontSize: bh * 0.3, color: dlt === null ? 'transparent' : dlt <= 0 ? P.good : P.bad, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>{dlt === null ? '—' : `${dlt <= 0 ? '−' : '+'}${Math.abs(dlt).toFixed(2)}`}</div>
                {(isBest || isWorst) && (
                  <div style={{fontFamily: body, fontWeight: 800, fontSize: bh * 0.22, letterSpacing: bh * 0.04, padding: `${bh * 0.06}px ${bh * 0.16}px`, borderRadius: bh * 0.4, background: isBest ? P.good : P.bad, color: onColor(isBest ? P.good : P.bad), transform: `scale(${backOut(sseg(frame, re + 2, re + 18))})`}}>{isBest ? 'BEST' : 'SLOW'}</div>
                )}
              </div>
            </div>
          );
        })}
        {/* total */}
        {(() => {
          const p = easeOut3(sseg(frame, re, re + 20));
          const bh = rowH - rowGap;
          return (
            <div style={{position: 'absolute', left: 0, right: 0, top: n * rowH, height: bh, opacity: p, transform: `translateY(${(1 - p) * 20 * u}px)`, background: P.accent, color: onColor(P.accent), borderRadius: bh * 0.14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${bh * 0.45}px`}}>
              <div style={{fontFamily: body, fontWeight: 800, fontSize: bh * 0.32, letterSpacing: bh * 0.06, textTransform: 'uppercase'}}>{P.totalLabel}</div>
              <div style={{fontFamily: mono, fontWeight: 700, fontSize: bh * 0.52, fontVariantNumeric: 'tabular-nums'}}>{fmtTime(total, 2, true)}</div>
            </div>
          );
        })()}
      </div>
    </AbsoluteFill>
  );
};

export const stopwatchSplitTimes = defineMotion<Props>({
  id: 'stopwatch-split-times',
  title: 'Stopwatch with split times',
  category: 'game',
  description: 'A large stopwatch (sweep hand, lap-progress ring, digital readout) counts up while each lap freezes the readout and drops a row into a splits list with a bar, the time and the +/- against the previous lap; at the finish the best lap turns green, the slowest red and a total bar locks in.',
  source: ['original'],
  useFor: 'Lap and split reveals for running, swimming, cycling and motorsport, speed-run segments, workout intervals, cooking or study timers and any "how the time was made up" story. Pass the lap durations in seconds; real time is compressed to fit the clip.',
  durationInFrames: 300,
  defaultProps: {
    title: '400 m heat',
    subtitle: 'Lane 4 · splits',
    laps: [27.4, 26.9, 27.8, 26.5, 27.1, 25.9],
    lapLabel: 'Lap',
    totalLabel: 'Total',
    showDial: true,
    background: '#0A0F1C',
    surface: '#18213A',
    ink: '#FFFFFF',
    accent: '#FFC933',
    good: '#2DD4A0',
    bad: '#FF5D6C',
    fontFamily: 'auto',
  },
  propDocs: {
    title: 'heading',
    subtitle: 'small line above the heading',
    laps: 'lap / split durations in seconds, in order (up to 12); the total and the cumulative clock are worked out',
    lapLabel: 'word before the lap number (Lap, Split, Round, Set)',
    totalLabel: 'label of the final total',
    showDial: 'show the stopwatch dial (false = list only, bigger)',
    background: 'frame colour, or "transparent" to overlay footage',
    surface: 'dial and row colour',
    ink: 'text colour',
    accent: 'sweep hand, lap ring and total bar colour',
    good: 'colour of faster laps / best lap',
    bad: 'colour of slower laps / slowest lap',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: StopwatchSplitTimes,
  tags: ['stopwatch', 'timer', 'splits', 'lap times', 'laps', 'running', 'swimming', 'athletics', 'track', 'speedrun', 'interval', 'clock', 'sports', 'timing', 'race'],
});
