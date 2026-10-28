import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  CheckDot,
  Spinner,
  Win,
  bgOf,
  blink,
  fitMono,
  inOutCubic,
  isDark,
  mixHex,
  monoFont,
  outCubic,
  seg,
  typed,
  withAlpha,
} from '../../core/dev-explainer-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A terminal window: a command types in, Enter runs it, then progress rows appear one by one — spinner,
 * label, filling bar, percentage and size / speed readout, each ending in a green check — followed by the
 * success lines and a fresh prompt with a blinking cursor. Everything shown is a prop.
 */
type Step = {label: string; size?: number; unit?: string; detail?: string};
type Props = {
  title: string;
  cwd: string;
  prompt: string;
  command: string;
  steps: Step[];
  successLines: string[];
  stepFrames: number;
  typeSpeed: number;
  speed: number;
  startAt: number;
  background: string;
  panel: string;
  ink: string;
  accent: string;
  okColor: string;
  fontFamily: string;
};

const TerminalInstallProgress: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = (frame - p.startAt) * Math.max(0.1, p.speed);
  const mono = monoFont(p.fontFamily);
  const dark = isDark(p.panel);
  const steps = p.steps;
  const sf = Math.max(14, p.stepFrames);
  const ok = p.okColor;

  const typeStart = 18;
  const typeEnd = typeStart + (p.command.length / Math.max(4, p.typeSpeed)) * 30;
  const runAt = typeEnd + 12;
  const stepStart = (j: number) => runAt + 6 + j * (sf + 4);
  const stepsEnd = steps.length ? stepStart(steps.length - 1) + sf : runAt;
  const lineAt = (k: number) => stepsEnd + 12 + k * 11;
  const promptAt = lineAt(p.successLines.length) + 8;

  // geometry + type size
  const winW = portrait ? w * 0.94 : Math.min(w * 0.76, 1480 * u);
  const head = 62 * u;
  const pad = (portrait ? 30 : 38) * u;
  const rowsPerStep = portrait ? 2 : 1;
  const nRows = 1.6 + steps.length * rowsPerStep + (steps.length ? 0.5 : 0) + p.successLines.length + 1.6;
  const cols = portrait ? 40 : 78;
  const maxH = h * (portrait ? 0.74 : 0.82);
  const fs = fitMono(winW - pad * 2, maxH - head - pad * 2, Math.max(cols, p.command.length + p.cwd.length + 6), nRows, portrait ? 36 * u : 36 * u, 16 * u, 1.7);
  const lh = fs * 1.7;
  const winH = Math.min(maxH, head + pad * 2 + lh * nRows);
  const winX = (w - winW) / 2;
  const winY = (h - winH) / 2;
  const winIn = outCubic(seg(t, 0, 16));

  const cmdTyped = typed(p.command, t, typeStart, p.typeSpeed);
  const promptCol = p.accent;
  const dim = withAlpha(p.ink, 0.55);

  const fmt = (v: number) => (v >= 100 ? v.toFixed(0) : v.toFixed(1));

  return (
    <AbsoluteFill style={{background: bgOf(p.background), overflow: 'hidden'}}>
      <Win x={winX} y={winY} w={winW} h={winH} u={u} title={p.title} panel={p.panel} ink={p.ink} opacity={winIn} dy={(1 - winIn) * 30 * u} fontFamily={mono}>
        <div style={{position: 'absolute', left: pad, right: pad, top: pad, fontFamily: mono, fontSize: fs, color: p.ink, lineHeight: `${lh}px`}}>
          {/* command */}
          <div style={{whiteSpace: 'pre', height: lh}}>
            <span style={{color: dim}}>{p.cwd} </span>
            <span style={{color: promptCol, fontWeight: 700}}>{p.prompt} </span>
            <span>{cmdTyped}</span>
            {t < runAt ? <span style={{display: 'inline-block', width: fs * 0.55, height: fs * 1.1, background: p.ink, opacity: blink(frame, 16) * 0.85, verticalAlign: '-0.16em', marginLeft: 1 * u}} /> : null}
          </div>
          <div style={{height: lh * 0.6}} />
          {/* progress rows */}
          {steps.map((s, j) => {
            const st = stepStart(j);
            if (t < st) return <div key={j} style={{height: lh * rowsPerStep}} />;
            const kRaw = seg(t, st, st + sf);
            const k = inOutCubic(kRaw) * 0.82 + kRaw * 0.18;
            const done = kRaw >= 1;
            const inK = outCubic(seg(t, st, st + 8));
            const pct = Math.round(k * 100);
            const col = done ? ok : p.accent;
            const detail = s.size ? `${fmt(s.size * k)}/${fmt(s.size)} ${s.unit ?? 'MB'}` : s.detail ?? '';
            const icon = fs * 1.05;
            const label = (
              <div style={{display: 'flex', alignItems: 'center', gap: fs * 0.7, minWidth: 0}}>
                <div style={{width: icon, height: icon, flex: '0 0 auto'}}>
                  {done ? <CheckDot size={icon} color={ok} k={seg(t, st + sf, st + sf + 10)} filled={false} /> : <Spinner size={icon} color={p.accent} frame={frame} stroke={icon * 0.13} speed={16} />}
                </div>
                <span style={{whiteSpace: 'nowrap', color: done ? p.ink : p.ink, minWidth: portrait ? 0 : fs * 0.6 * 24}}>{s.label}</span>
              </div>
            );
            const bar = (
              <div style={{flex: 1, minWidth: fs * 4, height: fs * 0.62, borderRadius: fs * 0.31, background: withAlpha(p.ink, 0.14), overflow: 'hidden'}}>
                <div style={{width: `${(done ? 1 : k) * 100}%`, height: '100%', borderRadius: fs * 0.31, background: col}} />
              </div>
            );
            const meta = (
              <div style={{display: 'flex', gap: fs * 0.9, whiteSpace: 'nowrap', color: dim, fontSize: fs * 0.92}}>
                <span style={{color: done ? ok : p.ink, fontWeight: 700, minWidth: fs * 0.6 * 4, textAlign: 'right'}}>{pct}%</span>
                {detail ? <span>{detail}</span> : null}
              </div>
            );
            return portrait ? (
              <div key={j} style={{height: lh * 2, opacity: inK, transform: `translateY(${(1 - inK) * 8 * u}px)`}}>
                <div style={{height: lh, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  {label}
                  {meta}
                </div>
                <div style={{height: lh, display: 'flex', alignItems: 'center', paddingLeft: fs * 1.75}}>{bar}</div>
              </div>
            ) : (
              <div key={j} style={{height: lh, display: 'flex', alignItems: 'center', gap: fs * 1.1, opacity: inK, transform: `translateY(${(1 - inK) * 8 * u}px)`}}>
                {label}
                {bar}
                {meta}
              </div>
            );
          })}
          {steps.length ? <div style={{height: lh * 0.5}} /> : null}
          {/* success lines */}
          {p.successLines.map((ln, k) => {
            const a = lineAt(k);
            if (t < a) return <div key={k} style={{height: lh}} />;
            const kk = outCubic(seg(t, a, a + 8));
            const m = ln.match(/^([^`]*)(`[^`]+`)?(.*)$/);
            return (
              <div key={k} style={{height: lh, display: 'flex', alignItems: 'center', gap: fs * 0.7, opacity: kk, transform: `translateX(${(1 - kk) * -14 * u}px)`}}>
                <svg width={fs} height={fs} viewBox="0 0 24 24" style={{flex: '0 0 auto'}}>
                  <path d="M4 12.5 L9.5 18 L20 6.5" fill="none" stroke={ok} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{whiteSpace: 'pre'}}>
                  {m ? (
                    <>
                      {m[1]}
                      {m[2] ? <span style={{color: mixHex(p.accent, dark ? '#FFFFFF' : '#000000', 0.25), background: withAlpha(p.accent, 0.16), padding: `0 ${5 * u}px`, borderRadius: 5 * u}}>{m[2].slice(1, -1)}</span> : null}
                      {m[3]}
                    </>
                  ) : (
                    ln
                  )}
                </span>
              </div>
            );
          })}
          {/* fresh prompt */}
          {t >= promptAt ? (
            <div style={{whiteSpace: 'pre', height: lh, marginTop: lh * 0.4}}>
              <span style={{color: dim}}>{p.cwd} </span>
              <span style={{color: promptCol, fontWeight: 700}}>{p.prompt} </span>
              <span style={{display: 'inline-block', width: fs * 0.55, height: fs * 1.1, background: p.ink, opacity: blink(frame, 16) * 0.85, verticalAlign: '-0.16em'}} />
            </div>
          ) : null}
        </div>
      </Win>
    </AbsoluteFill>
  );
};

export const terminalInstallProgress = defineMotion<Props>({
  id: 'terminal-install-progress',
  title: 'Terminal install progress',
  category: 'ui',
  description:
    'A terminal window: a command types in and runs, progress rows appear one by one (spinner, label, filling bar, percentage and size readout, each ending in a green check), then success lines and a fresh blinking prompt.',
  source: ['original (generic developer explainer)'],
  useFor: 'Install / setup / "get started in one command" beats, CLI and package-manager promos, developer onboarding, build or deploy output, release trailers.',
  durationInFrames: 300,
  defaultProps: {
    title: 'zsh — 96×28',
    cwd: '~/project',
    prompt: '$',
    command: 'pkg install awesome-toolkit',
    steps: [
      {label: 'Resolving dependencies', detail: '142 packages'},
      {label: 'Downloading packages', size: 84, unit: 'MB'},
      {label: 'Linking modules', detail: 'cached'},
      {label: 'Building native bindings', detail: '4 targets'},
    ],
    successLines: ['Installed 142 packages in 6.4s', 'Run `awesome --help` to get started'],
    stepFrames: 32,
    typeSpeed: 26,
    speed: 1,
    startAt: 0,
    background: '#0B0E14',
    panel: '#12161F',
    ink: '#E6EAF2',
    accent: '#79B8FF',
    okColor: '#3FD68F',
    fontFamily: '',
  },
  propDocs: {
    title: 'window title',
    cwd: 'working-directory text before the prompt',
    prompt: 'prompt symbol',
    command: 'the command that is typed and run',
    steps: 'progress rows [{label, size? (total, counts up), unit? (default MB), detail? (text instead of size)}]',
    successLines: 'lines printed after the steps (wrap `code` in backticks to highlight it)',
    stepFrames: 'frames each progress bar takes',
    typeSpeed: 'command typing speed in chars/s',
    speed: 'timing multiplier',
    startAt: 'frame the terminal starts',
    background: "page colour or 'transparent'",
    panel: 'window colour (dark or light)',
    ink: 'text colour',
    accent: 'prompt / progress colour',
    okColor: 'success colour',
    fontFamily: 'monospace font override (empty = JetBrains Mono)',
  },
  component: TerminalInstallProgress,
  tags: ['terminal', 'cli', 'install', 'npm', 'command line', 'progress', 'bash', 'shell', 'developer', 'setup', 'package', 'download', 'loading', 'build', 'software', 'overlay'],
});
