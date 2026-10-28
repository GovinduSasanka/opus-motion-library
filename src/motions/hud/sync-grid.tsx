// Idea after lemo-opuscar styles/visual-investigation demo sRun() / playhead() (MIT, LemoLab) — see THIRD_PARTY_NOTICES.md.
import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, Sequence, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {resolveSrc} from '../../core/asset';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Col = {tag: string; kind: 'text' | 'image' | 'video' | 'dashcam' | 'cctv'; src?: string; text?: string; startsAt: number};
type Props = {
  columns: Col[];
  clock: number[][];
  syncAt: number;
  syncColumn: number;
  syncWord: string;
  verdict: string;
  format: 'T+' | 'hh:mm:ss';
  startClock: string;
  background: string;
  ink: string;
  accent: string;
};

const lerpKeys = (frame: number, keys: number[][]) => {
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (frame <= keys[i][0]) {
      const f = (frame - keys[i - 1][0]) / Math.max(1e-6, keys[i][0] - keys[i - 1][0]);
      return keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * f;
    }
  }
  return keys[keys.length - 1][1];
};

const fmtClock = (sec: number, base: string) => {
  const [h0, m0, s0] = base.split(':').map((x) => parseInt(x, 10) || 0);
  const t = Math.floor(h0 * 3600 + m0 * 60 + s0 + sec);
  const f = (n: number) => String(n).padStart(2, '0');
  return `${f(Math.floor(t / 3600) % 24)}:${f(Math.floor(t / 60) % 60)}:${f(t % 60)}`;
};

const Panel: React.FC<{col: Col; local: number; span: number; frozen: boolean; u: number; ink: string; accent: string; fw: number; fh: number; portrait?: boolean}> = ({col, local, span, frozen, u, ink, accent, fw, fh, portrait}) => {
  const k = col.kind;
  if ((k === 'image' || k === 'dashcam') && col.src) return <Img src={resolveSrc(col.src)} style={{width: fw, height: fh, objectFit: 'cover'}} />;
  if (k === 'text') {
    const lines = (col.text || '').split('\n');
    return (
      <div style={{width: fw, height: fh, background: '#13151A', padding: 22 * u, boxSizing: 'border-box', fontFamily: fonts.mono, color: '#C9CCD3', fontSize: portrait ? Math.min(34 * u, fh / 9) : Math.min(26 * u, fh / 11), overflow: 'hidden'}}>
        {lines.map((ln, i) => {
          const at = i * 2.4;
          if (local < at) return null;
          const a = Math.min(1, (local - at) / 0.3);
          return (
            <div key={i} style={{opacity: a, marginBottom: 12 * u, lineHeight: 1.25}}>
              <span style={{color: accent}}>{`T+${at.toFixed(1).padStart(4, '0')}`}</span> {ln}
            </div>
          );
        })}
      </div>
    );
  }
  const f = Math.min(1, local / Math.max(1, span));
  if (k === 'image' || k === 'dashcam') {
    // procedural dashcam: road in perspective, lead car closing in
    const s = 0.28 + 0.72 * f * f;
    const dash = frozen ? 0 : (local * 1.6) % 1;
    return (
      <svg width={fw} height={fh} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`dc-sky${col.startsAt}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7d93ad" />
            <stop offset="1" stopColor="#c9d3da" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill={`url(#dc-sky${col.startsAt})`} />
        <rect y="120" width="400" height="180" fill="#3b4048" />
        <polygon points="190,120 210,120 330,300 70,300" fill="#2b2f36" />
        {[0, 1, 2, 3, 4].map((i) => {
          const t0 = (i + dash) / 5;
          const t1 = t0 + 0.09;
          const y0 = 120 + 180 * t0 * t0;
          const y1 = 120 + 180 * Math.min(1, t1) * Math.min(1, t1);
          return <polygon key={i} points={`${199 - 4 * t0},${y0} ${201 + 4 * t0},${y0} ${201 + 4 * Math.min(1, t1)},${y1} ${199 - 4 * Math.min(1, t1)},${y1}`} fill="#e9e6d6" opacity={0.85} />;
        })}
        <g transform={`translate(200 ${126 + 70 * s * s}) scale(${s})`}>
          <rect x={-46} y={-60} width={92} height={60} rx={8} fill="#a5adb6" />
          <rect x={-36} y={-52} width={72} height={20} rx={4} fill="#2b2f36" />
          <rect x={-42} y={-18} width={20} height={9} rx={2} fill={f > 0.8 ? '#ff3b2f' : '#7a1d18'} />
          <rect x={22} y={-18} width={20} height={9} rx={2} fill={f > 0.8 ? '#ff3b2f' : '#7a1d18'} />
        </g>
      </svg>
    );
  }
  // procedural CCTV: two vehicles converge on an intersection
  const a = Math.min(1, local / Math.max(1, span));
  return (
    <svg width={fw} height={fh} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill="#262a2b" />
      <rect x="170" width="60" height="300" fill="#3a3f40" />
      <rect y="120" width="400" height="60" fill="#3a3f40" />
      <line x1="200" y1="0" x2="200" y2="300" stroke="#8a8d83" strokeDasharray="10 10" strokeWidth="2" />
      <line x1="0" y1="150" x2="400" y2="150" stroke="#8a8d83" strokeDasharray="10 10" strokeWidth="2" />
      <rect x={186} y={-30 + a * 180} width={28} height={44} rx={6} fill="#6aa0d8" />
      <rect x={-50 + a * 200} y={136} width={44} height={28} rx={6} fill="#e3b341" />
      <rect width="400" height="300" fill="none" stroke="#000" opacity={0.25} />
      {Array.from({length: 30}, (_, i) => (
        <line key={i} x1="0" x2="400" y1={i * 10} y2={i * 10} stroke="#000" opacity={0.12} />
      ))}
      <text x="12" y="24" fontFamily={fonts.mono} fontSize="16" fill="#cfd6d0">
        CAM 02 ● REC
      </text>
    </svg>
  );
};

const SyncGrid: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames} = useStage();
  const keys = p.clock.length >= 2 ? p.clock : [[0, 0], [150, 30]];
  const rawEvent = lerpKeys(frame, keys);
  // first frame the clock reaches syncAt
  const syncFrame = React.useMemo(() => {
    for (let f = 0; f < durationInFrames; f++) if (lerpKeys(f, keys) >= p.syncAt) return f;
    return durationInFrames - 1;
  }, [keys, p.syncAt, durationInFrames]);
  const frozen = frame >= syncFrame;
  const ev = frozen ? p.syncAt : rawEvent;
  const appear = React.useMemo(() => p.columns.map((c) => {
    for (let f = 0; f < durationInFrames; f++) if (lerpKeys(f, keys) >= c.startsAt) return f;
    return durationInFrames;
  }), [p.columns, keys, durationInFrames]);

  const n = Math.max(1, p.columns.length);
  const mx = 60 * u;
  const gap = 22 * u;
  const gx0 = mx;
  const gy0 = portrait ? 70 * u : 92 * u;
  const gridW = w - mx * 2;
  const gridH = portrait ? h * 0.66 : h * 0.56;
  const cw = portrait ? gridW : (gridW - gap * (n - 1)) / n;
  const ch = portrait ? (gridH - gap * (n - 1)) / n : gridH;
  const posOf = (i: number) => ({x: portrait ? gx0 : gx0 + i * (cw + gap), y: portrait ? gy0 + i * (ch + gap) : gy0});

  const vIn = prog(frame, syncFrame, syncFrame + 8, ease.out);
  const verdictT = prog(frame, syncFrame + 14, syncFrame + 22, ease.out);
  const stopSize = (portrait ? 120 : 150) * u;
  const clockStr = p.format === 'hh:mm:ss' ? fmtClock(ev, p.startClock) : `T+${ev.toFixed(1).padStart(4, '0')}`;
  const sy = gy0 + gridH + (portrait ? 150 : 135) * u;

  return (
    <AbsoluteFill style={{background: p.background, color: p.ink}}>
      {p.columns.map((c, i) => {
        const {x, y} = posOf(i);
        const vis = frame >= appear[i];
        const sinceCut = frame - appear[i];
        const local = Math.max(0, ev - c.startsAt);
        const span = Math.max(1, p.syncAt - c.startsAt);
        const flash = vis ? Math.max(0, 1 - sinceCut / 6) : 0;
        const isSync = i === p.syncColumn;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: cw, height: ch}}>
            <div style={{position: 'absolute', left: 0, top: -34 * u, fontFamily: fonts.mono, fontSize: 18 * u, letterSpacing: 4 * u, color: p.ink, opacity: 0.7}}>
              {c.tag.toUpperCase()}
            </div>
            {vis ? (
              <div style={{width: cw, height: ch, overflow: 'hidden', position: 'relative', outline: frozen && isSync ? `${5 * u}px solid ${p.accent}` : `${1.5 * u}px solid rgba(255,255,255,0.16)`, outlineOffset: -1}}>
                {c.kind === 'video' && c.src ? (
                  <Sequence from={appear[i]} layout="none">
                    {frozen ? (
                      <Freeze frame={Math.max(0, syncFrame - appear[i])}>
                        <OffthreadVideo src={resolveSrc(c.src)} muted style={{width: cw, height: ch, objectFit: 'cover'}} />
                      </Freeze>
                    ) : (
                      <OffthreadVideo src={resolveSrc(c.src)} muted style={{width: cw, height: ch, objectFit: 'cover'}} />
                    )}
                  </Sequence>
                ) : (
                  <Panel col={c} local={local} span={span} frozen={frozen} u={u} ink={p.ink} accent={p.accent} fw={cw} fh={ch} portrait={portrait} />
                )}
                <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash * 0.85}} />
                {frozen && isSync ? (
                  <div style={{position: 'absolute', left: 14 * u, bottom: 12 * u, background: p.accent, color: '#fff', fontFamily: fonts.mono, fontWeight: 700, fontSize: 24 * u, letterSpacing: 4 * u, padding: `${4 * u}px ${12 * u}px`, opacity: vIn, transform: `translateY(${(1 - vIn) * 14 * u}px)`}}>
                    {p.syncWord.toUpperCase()}
                  </div>
                ) : null}
              </div>
            ) : (
              <div style={{width: cw, height: ch, border: `${1.5 * u}px dashed rgba(255,255,255,0.14)`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.mono, fontSize: 18 * u, color: 'rgba(255,255,255,0.28)', letterSpacing: 3 * u}}>
                T+{c.startsAt.toFixed(0)}
              </div>
            )}
          </div>
        );
      })}
      {frozen ? (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
          {portrait ? (
            <line x1={gx0 + cw * 0.5} x2={gx0 + cw * 0.5} y1={gy0} y2={gy0 + gridH} stroke={p.accent} strokeWidth={2.5 * u} strokeDasharray={`${12 * u} ${10 * u}`} strokeDashoffset={0} opacity={vIn} />
          ) : (
            <line x1={gx0} x2={gx0 + gridW * vIn} y1={gy0 + gridH / 2} y2={gy0 + gridH / 2} stroke={p.accent} strokeWidth={2.5 * u} strokeDasharray={`${12 * u} ${10 * u}`} />
          )}
        </svg>
      ) : null}
      <div style={{position: 'absolute', left: mx, top: sy - stopSize, fontFamily: fonts.mono, fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1}}>
        {verdictT > 0 ? (
          <div style={{color: p.accent, fontSize: stopSize * (1 + 0.13 * verdictT), transformOrigin: 'left bottom'}}>{p.verdict}</div>
        ) : (
          <div style={{fontSize: stopSize}}>
            {clockStr}
            <span style={{fontSize: stopSize * 0.35, opacity: 0.45}}>{p.format === 'T+' ? ' s' : ''}</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const syncGrid = defineMotion<Props>({
  id: 'sync-grid',
  title: 'Sync grid (evidence on one clock)',
  category: 'hud',
  description:
    'Three evidence columns (report log / dashcam / CCTV) side by side under one huge monospaced stopwatch; each column cuts in with a flash only when its source starts on the event clock, so the grid fills as time runs. At the sync point everything freezes, the key column gets a red border and a word, a red dashed line runs across the pictures and the stopwatch becomes a big red verdict.',
  source: ['lemo-opuscar styles/visual-investigation demo sRun() / playhead() (MIT, LemoLab) — idea, own build'],
  useFor: 'Dashcam + CCTV + log comparisons, "which happened first", sports replays, launch/telemetry reconstructions, A/B latency demos (three apps responding to one tap), product race comparisons.',
  durationInFrames: 270,
  defaultProps: {
    columns: [
      {tag: 'Incident log', kind: 'text', text: 'unit 4 dispatched\ncaller confirms location\nalarm silenced remotely\nsecond call received\nunit 4 on scene', startsAt: 0},
      {tag: 'Dashcam', kind: 'dashcam', startsAt: 8},
      {tag: 'Street camera', kind: 'cctv', startsAt: 16},
    ],
    clock: [
      [0, 0],
      [40, 6],
      [100, 20],
      [170, 32],
    ],
    syncAt: 32,
    syncColumn: 2,
    syncWord: 'Same moment',
    verdict: '32 s',
    format: 'T+',
    startClock: '14:02:10',
    background: '#0B0C0F',
    ink: '#ECEAE4',
    accent: '#FF3B2F',
  },
  propDocs: {
    columns: "[{tag, kind:'text'|'dashcam'|'cctv'|'image'|'video', src?, text? (lines), startsAt (event seconds)}]",
    clock: '[[frame, eventSeconds]] piecewise-linear event clock (can run faster than real time)',
    syncAt: 'event second at which everything freezes',
    syncColumn: 'index of the column that gets the red border and word',
    syncWord: 'word on the synced column',
    verdict: 'big red text that replaces the stopwatch',
    format: "'T+' counter or 'hh:mm:ss' wall clock",
    startClock: 'wall clock at event second 0 (format hh:mm:ss)',
    background: 'background colour',
    ink: 'text colour',
    accent: 'red/accent colour',
  },
  component: SyncGrid,
  tags: ['evidence', 'timeline', 'stopwatch', 'sync', 'dashcam', 'cctv', 'investigation', 'comparison', 'clock', 'grid', 'forensic'],
});
