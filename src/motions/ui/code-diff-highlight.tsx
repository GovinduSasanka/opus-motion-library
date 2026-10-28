import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  Win,
  backOut,
  bgOf,
  fitMono,
  inOutCubic,
  isDark,
  mixHex,
  monoFont,
  outCubic,
  seg,
  syntaxPalette,
  tokenize,
  withAlpha,
} from '../../core/dev-explainer-kit';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A code review window showing a diff: removed lines (red) and added lines (green) animate in one by one
 * with old/new line-number gutters, a +/- sign column, light syntax colouring, a file name header and a
 * "+N -M" summary badge. Unchanged context lines dim at the end so the change is the hero.
 */
type DiffLine = {type: 'add' | 'del' | 'ctx'; text: string};
type Props = {
  fileName: string;
  hunkHeader: string;
  lines: DiffLine[];
  startLine: number;
  caption: string;
  every: number;
  speed: number;
  startAt: number;
  background: string;
  panel: string;
  ink: string;
  addColor: string;
  delColor: string;
  accent: string;
  fontFamily: string;
};

const CodeDiffHighlight: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = (frame - p.startAt) * Math.max(0.1, p.speed);
  const dark = isDark(p.panel);
  const pal = syntaxPalette(dark);
  const mono = monoFont(p.fontFamily);
  const lines = p.lines.length ? p.lines : [{type: 'ctx' as const, text: '// no changes'}];

  // old / new line numbers + stats
  let o = p.startLine;
  let n = p.startLine;
  let adds = 0;
  let dels = 0;
  const rows = lines.map((l) => {
    const row = {...l, old: l.type === 'add' ? 0 : o, nw: l.type === 'del' ? 0 : n};
    if (l.type !== 'add') o++;
    if (l.type !== 'del') n++;
    if (l.type === 'add') adds++;
    if (l.type === 'del') dels++;
    return row;
  });
  const hunk = p.hunkHeader || `@@ -${p.startLine},${o - p.startLine} +${p.startLine},${n - p.startLine} @@`;

  // geometry
  const winW = portrait ? w * 0.94 : Math.min(w * 0.74, 1500 * u);
  const capH = p.caption ? 92 * u : 0;
  const maxWinH = (portrait ? h * 0.72 : h * 0.8) - capH;
  const head = 62 * u;
  const pad = 22 * u;
  const maxChars = Math.max(...rows.map((r) => r.text.length), hunk.length, 10) + 11; // gutters + sign
  const fs = fitMono(winW - pad * 2, maxWinH - head - pad * 2, maxChars, rows.length + 1.2, portrait ? 38 * u : 40 * u, 15 * u);
  const lh = fs * 1.62;
  const winH = Math.min(maxWinH, head + pad * 2 + lh * (rows.length + 1.2));
  const winX = (w - winW) / 2;
  const winY = (h - (winH + capH)) / 2;
  const numW = fs * 0.6 * 3.4;

  const winIn = outCubic(seg(t, 0, 16));
  const allIn = 16 + rows.length * p.every;
  const focus = inOutCubic(seg(t, allIn + 16, allIn + 34));
  const badge = backOut(seg(t, allIn + 4, allIn + 20), 2.2);
  const hunkIn = outCubic(seg(t, 8, 20));

  const bgFor = (type: string, k: number) =>
    type === 'add' ? withAlpha(p.addColor, 0.17 * k) : type === 'del' ? withAlpha(p.delColor, 0.17 * k) : 'transparent';
  const gutFor = (type: string, k: number) =>
    type === 'add' ? withAlpha(p.addColor, 0.3 * k) : type === 'del' ? withAlpha(p.delColor, 0.3 * k) : 'transparent';

  return (
    <AbsoluteFill style={{background: bgOf(p.background), overflow: 'hidden'}}>
      <Win
        x={winX}
        y={winY}
        w={winW}
        h={winH}
        u={u}
        title={p.fileName}
        panel={p.panel}
        ink={p.ink}
        opacity={winIn}
        dy={(1 - winIn) * 30 * u}
        fontFamily={mono}
        headerRight={
          <span style={{opacity: badge, display: 'inline-block', transform: `scale(${0.7 + 0.3 * badge})`}}>
            <span style={{color: p.addColor, fontWeight: 700}}>{`+${adds}`}</span> <span style={{color: p.delColor, fontWeight: 700}}>{`−${dels}`}</span>
          </span>
        }
      >
        <div style={{position: 'absolute', left: 0, right: 0, top: pad * 0.6, padding: `0 0`}}>
          <div style={{height: lh * 1.2, display: 'flex', alignItems: 'center', paddingLeft: numW * 2 + fs * 2.4, fontFamily: mono, fontSize: fs * 0.82, color: withAlpha(p.accent, 0.95), opacity: hunkIn}}>{hunk}</div>
          {rows.map((r, i) => {
            const st = 16 + i * p.every;
            const k = outCubic(seg(t, st, st + 10));
            const sweep = outCubic(seg(t, st + 2, st + 14));
            if (k <= 0) return <div key={i} style={{height: lh}} />;
            const dim = r.type === 'ctx' ? 1 - 0.5 * focus : 1;
            const toks = tokenize(r.text);
            const sign = r.type === 'add' ? '+' : r.type === 'del' ? '−' : ' ';
            const signCol = r.type === 'add' ? p.addColor : r.type === 'del' ? p.delColor : withAlpha(p.ink, 0.4);
            return (
              <div key={i} style={{position: 'relative', height: lh, display: 'flex', alignItems: 'center', opacity: k * dim, transform: `translateX(${(1 - k) * -26 * u}px)`, fontFamily: mono, fontSize: fs}}>
                <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', background: bgFor(r.type, 1), transformOrigin: '0 50%', transform: `scaleX(${r.type === 'ctx' ? 1 : sweep})`}} />
                {r.type !== 'ctx' ? <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 * u, background: signCol}} /> : null}
                <div style={{position: 'relative', width: numW, textAlign: 'right', paddingRight: fs * 0.5, color: withAlpha(p.ink, 0.38), background: gutFor(r.type, sweep), alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'flex-end'}}>{r.old || ''}</div>
                <div style={{position: 'relative', width: numW, textAlign: 'right', paddingRight: fs * 0.5, color: withAlpha(p.ink, 0.38), background: gutFor(r.type, sweep), alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'flex-end'}}>{r.nw || ''}</div>
                <div style={{position: 'relative', width: fs * 1.6, textAlign: 'center', color: signCol, fontWeight: 700}}>{sign}</div>
                <div style={{position: 'relative', whiteSpace: 'pre', color: pal.plain, textDecoration: r.type === 'del' && focus > 0.5 ? `line-through ${withAlpha(p.delColor, 0.7)}` : 'none'}}>
                  {toks.map((tk, j) => (
                    <span key={j} style={{color: pal[tk.kind]}}>{tk.text}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Win>
      {p.caption ? (
        <div
          style={{
            position: 'absolute',
            left: winX,
            width: winW,
            top: winY + winH + 26 * u,
            textAlign: 'center',
            fontFamily: fonts.sans,
            fontWeight: 600,
            fontSize: (portrait ? 40 : 34) * u,
            color: mixHex(p.panel, p.ink, 0.85),
            opacity: outCubic(seg(t, allIn + 10, allIn + 26)),
            transform: `translateY(${(1 - outCubic(seg(t, allIn + 10, allIn + 26))) * 14 * u}px)`,
          }}
        >
          {p.caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const codeDiffHighlight = defineMotion<Props>({
  id: 'code-diff-highlight',
  title: 'Code diff highlight',
  category: 'ui',
  description:
    'A code-review window with a file-name header: removed lines in red and added lines in green sweep in one by one with old/new line-number gutters, a +/- column and light syntax colouring, then a +N/−M badge pops and unchanged context dims.',
  source: ['original (generic developer explainer)'],
  useFor: 'Pull-request and code-review explainers, "what changed" beats, refactor / bug-fix walkthroughs, changelog and developer-tool promos, AI-coding demos.',
  durationInFrames: 210,
  defaultProps: {
    fileName: 'src/auth/session.ts',
    hunkHeader: '',
    lines: [
      {type: 'ctx', text: 'export function isValid(session: Session) {'},
      {type: 'del', text: '  return session.token !== null;'},
      {type: 'add', text: '  if (!session.token) return false;'},
      {type: 'add', text: '  const expired = Date.now() > session.expiresAt;'},
      {type: 'add', text: '  return !expired;'},
      {type: 'ctx', text: '}'},
      {type: 'ctx', text: ''},
      {type: 'del', text: 'const TTL = 60 * 60;'},
      {type: 'add', text: 'const TTL = 15 * 60; // shorter sessions'},
    ],
    startLine: 12,
    caption: 'Reject expired sessions',
    every: 9,
    speed: 1,
    startAt: 0,
    background: '#0B0E14',
    panel: '#12161F',
    ink: '#E6EAF2',
    addColor: '#2EA043',
    delColor: '#F85149',
    accent: '#79B8FF',
    fontFamily: '',
  },
  propDocs: {
    fileName: 'file path shown in the window header',
    hunkHeader: "hunk line above the code, e.g. '@@ -12,7 +12,9 @@' (empty = computed from the lines)",
    lines: "diff lines [{type: 'add' | 'del' | 'ctx', text}] — text is plain code, no +/- prefix",
    startLine: 'first line number in the gutters',
    caption: 'one-line takeaway under the window (empty = none)',
    every: 'frames between lines',
    speed: 'timing multiplier',
    startAt: 'frame the window starts',
    background: "page colour or 'transparent'",
    panel: 'window colour (dark or light — syntax colours adapt)',
    ink: 'text colour',
    addColor: 'added-line colour',
    delColor: 'removed-line colour',
    accent: 'hunk-header colour',
    fontFamily: 'monospace font override (empty = JetBrains Mono)',
  },
  component: CodeDiffHighlight,
  tags: ['diff', 'code', 'git', 'pull request', 'review', 'developer', 'changelog', 'refactor', 'software', 'programming', 'commit', 'patch', 'ui', 'overlay'],
});
