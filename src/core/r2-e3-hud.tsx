import React from 'react';
import {noise2D} from '@remotion/noise';
import {clamp} from './ease';

/** hud-chrome variants for round-2 group E3: camcorder OSD, survey block, voiceprint subtitle, dev HUD, segmented bar. */

const pad2 = (n: number, l = 2) => String(Math.floor(Math.abs(n))).padStart(l, '0');

/** "11:58" + seconds elapsed -> "PM 11:58" (12 h clock, minute resolution) */
export const clockLabel = (startTime: string, secs: number) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(startTime) ?? ['', '11', '58'];
  let mins = (parseInt(m[1], 10) % 24) * 60 + parseInt(m[2], 10) + Math.floor(secs / 60);
  mins = ((mins % 1440) + 1440) % 1440;
  const hh = Math.floor(mins / 60);
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hh >= 12 ? 'PM' : 'AM'} ${h12}:${pad2(mins % 60)}`;
};

type TF = {w: number; h: number; u: number; frame: number; fps: number; mono: string};

/** chunky bitmap OSD: blinking REC, battery, clock + date, optional generator title (camcorder look) */
export const CamcorderOsd: React.FC<TF & {rec: boolean; battery: number; clock: string; date: string; titleText: string; jumps: {at: number; toTime: string}[]; ink: string}> = ({w, h, frame, fps, mono, rec, battery, clock, date, titleText, jumps, ink}) => {
  const fs = Math.min(h * 0.055, w * 0.07);
  const mx = w * (w > h ? 0.1 : 0.07);
  const my = h * (w > h ? 0.1 : 0.08);
  const common = {fontFamily: mono, fontWeight: 700, fontSize: fs, fill: ink, stroke: '#000', strokeWidth: fs * 0.14, paintOrder: 'stroke' as const, letterSpacing: fs * 0.08};
  // the clock jumps to `toTime` at each jump frame
  let base = clock;
  let baseF = 0;
  for (const j of jumps) {
    if (frame >= j.at) {
      base = j.toTime;
      baseF = j.at;
    }
  }
  const clk = clockLabel(base, (frame - baseF) / fps);
  const recOn = Math.floor((frame / fps) * 2) % 2 === 0;
  const bat = Math.max(0, Math.min(3, battery));
  const batBlink = bat === 0 ? Math.floor((frame / fps) * 2) % 2 === 0 : true;
  const tIn = titleText ? clamp((frame - 6) / 8) * (1 - clamp((frame - fps * 3.5) / 10)) : 0;
  return (
    <g>
      {rec && (
        <g>
          {recOn && <circle cx={mx + fs * 0.45} cy={my - fs * 0.32} r={fs * 0.38} fill="#E43A2B" stroke="#000" strokeWidth={fs * 0.1} />}
          <text x={mx + fs * 1.15} y={my} {...common}>
            REC
          </text>
        </g>
      )}
      <g opacity={batBlink ? 1 : 0.2} transform={`translate(${w - mx - fs * 2.6} ${my - fs * 0.78})`}>
        <rect x={0} y={0} width={fs * 2.2} height={fs * 0.95} fill="none" stroke="#000" strokeWidth={fs * 0.26} />
        <rect x={0} y={0} width={fs * 2.2} height={fs * 0.95} fill="none" stroke={ink} strokeWidth={fs * 0.1} />
        <rect x={fs * 2.2} y={fs * 0.28} width={fs * 0.2} height={fs * 0.4} fill={ink} stroke="#000" strokeWidth={fs * 0.06} />
        {[0, 1, 2].map((i) => (i < bat ? <rect key={i} x={fs * 0.14 + i * fs * 0.67} y={fs * 0.14} width={fs * 0.55} height={fs * 0.67} fill={ink} /> : null))}
      </g>
      <text x={mx} y={h - my - fs * 1.15} {...common}>
        {clk}
      </text>
      <text x={mx} y={h - my} {...common}>
        {date}
      </text>
      {titleText && (
        <text x={w / 2} y={h * 0.5} textAnchor="middle" {...common} fontSize={fs * 2} strokeWidth={fs * 0.28} opacity={tIn}>
          {titleText}
        </text>
      )}
    </g>
  );
};

/** quiet survey-instrument block: 3-4 mono lines, top-left, no frame (credibility chrome for maps / data films) */
export const SurveyBlock: React.FC<TF & {lines: string[]; ink: string}> = ({w, h, frame, mono, lines, ink}) => {
  const fs = Math.min(h * 0.026, w * 0.034);
  const x = w * (w > h ? 0.045 : 0.06);
  const y0 = h * (w > h ? 0.075 : 0.07);
  return (
    <g fontFamily={mono} fontSize={fs} fill={ink} letterSpacing={fs * 0.04}>
      {lines.map((ln, i) => {
        const a = clamp((frame - 6 - i * 5) / 12);
        return (
          <text key={i} x={x} y={y0 + i * fs * 1.55} opacity={0.66 * a} fontWeight={i === 0 ? 700 : 400}>
            {ln}
          </text>
        );
      })}
    </g>
  );
};

/** sci-fi subtitle plate with two diagonal brackets and voice bars bouncing with the speech envelope */
export const VoiceSubtitle: React.FC<TF & {text: string; bars: number; color: string; ink: string}> = ({w, h, u, frame, fps, mono, text, bars, color, ink}) => {
  const fs = Math.min(h * 0.04, w * 0.05, (w * 0.86) / (text.length * 0.54 + 3.6 + bars * 0.42));
  const tw = Math.min(w * 0.9, text.length * fs * 0.54 + fs * 3.6 + bars * fs * 0.42);
  const ph = fs * 2.5;
  const x0 = w / 2 - tw / 2;
  const y0 = h - h * 0.14 - ph;
  const a = clamp(frame / 8);
  const words = text.split(' ');
  const wordIdx = Math.floor((frame / fps) * 3.2);
  const gate = wordIdx < words.length + 1 ? 1 : 0;
  const barsEl = Array.from({length: bars}, (_, i) => {
    const env = (noise2D('voice', i * 1.7, frame * 0.35) + 1) / 2;
    const bh = fs * (0.25 + env * gate);
    return <rect key={i} x={x0 + fs * 0.9 + i * fs * 0.42} y={y0 + ph / 2 - bh / 2} width={fs * 0.22} height={bh} rx={fs * 0.08} fill={color} />;
  });
  const bk = fs * 0.9;
  return (
    <g opacity={a}>
      <rect x={x0} y={y0} width={tw} height={ph} fill="rgba(1,8,12,0.62)" />
      <path d={`M ${x0 - 6} ${y0 + bk} L ${x0 - 6} ${y0 - 6} L ${x0 + bk} ${y0 - 6}`} fill="none" stroke={color} strokeWidth={2.2 * u} />
      <path d={`M ${x0 + tw + 6} ${y0 + ph - bk} L ${x0 + tw + 6} ${y0 + ph + 6} L ${x0 + tw - bk} ${y0 + ph + 6}`} fill="none" stroke={color} strokeWidth={2.2 * u} />
      {barsEl}
      <text x={x0 + fs * 0.9 + bars * fs * 0.42 + fs * 0.4} y={y0 + ph / 2 + fs * 0.34} fontFamily={mono} fontSize={fs * 0.9} fill={ink} fontWeight={700} letterSpacing={fs * 0.03}>
        {text}
      </text>
    </g>
  );
};

/** top-left counter ("0817 / 1200 VOXELS") + top-right phase badge and frame counter (dev HUD) */
export const DevHud: React.FC<
  TF & {
    counter: {value: number; total: number; unit: string; pad: number; sub: string} | null;
    phases: {from: number; label: string; color?: string}[];
    frameCounter: boolean;
    total: number;
    ink: string;
    grey: string;
    accent: string;
  }
> = ({w, h, frame, mono, counter, phases, frameCounter, total, ink, grey, accent}) => {
  const fs = Math.min(h * 0.03, w * 0.04);
  const m = w * 0.04;
  let phase: {label: string; color?: string} | null = null;
  for (const p of phases) if (frame >= p.from) phase = p;
  const label = phase?.label ?? '';
  const bw = label.length * fs * 0.62 + fs * 1.4;
  return (
    <g fontFamily={mono} fontSize={fs} letterSpacing={fs * 0.06}>
      {counter && (
        <g>
          <text x={m} y={m + fs} fill={ink} fontWeight={700}>
            {`${pad2(counter.value, counter.pad)} / ${pad2(counter.total, counter.pad)} ${counter.unit}`}
          </text>
          {counter.sub && (
            <text x={m} y={m + fs * 2.4} fill={grey} fontSize={fs * 0.78}>
              {counter.sub}
            </text>
          )}
        </g>
      )}
      {phase && (
        <g>
          <rect x={w - m - bw} y={m} width={bw} height={fs * 1.7} rx={fs * 0.85} fill={phase.color ?? (label.toUpperCase() === 'READY' ? '#111111' : accent)} />
          <text x={w - m - bw / 2} y={m + fs * 1.18} textAnchor="middle" fill="#fff" fontWeight={700}>
            {label}
          </text>
        </g>
      )}
      {frameCounter && (
        <text x={w - m} y={m + fs * 3.3} textAnchor="end" fill={grey} fontSize={fs * 0.78}>
          {`${pad2(frame, 3)} / ${pad2(total, 3)}`}
        </text>
      )}
    </g>
  );
};

/** segmented progress bar (one segment per chapter, each fills as its chapter plays) */
export const SegmentBar: React.FC<{x: number; y: number; width: number; height: number; n: number; progress: number; ink: string; dim: string}> = ({x, y, width, height, n, progress, ink, dim}) => {
  const gap = height * 0.6;
  const sw = (width - gap * (n - 1)) / n;
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const f = clamp(progress * n - i);
        return (
          <g key={i}>
            <rect x={x + i * (sw + gap)} y={y} width={sw} height={height} fill={dim} />
            <rect x={x + i * (sw + gap)} y={y} width={sw * f} height={height} fill={ink} />
          </g>
        );
      })}
    </g>
  );
};
