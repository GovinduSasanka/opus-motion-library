import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {PaintedField, easeOutCubic, isTransparentBg, lin, typedText, wrap, x58Fonts} from '../../core/r2-x58-kit';

/**
 * x6 agent-log-panel: a dark translucent panel with a 1 px white frame on the left, header
 * "TURN: 18/31  ACTION  MANUAL ▷", scrolling a conversation log — coloured name chips ("General Nova:"),
 * mono messages with @mentions highlighted, "N replies  View conversation" rows, collapsible "Army Reports"
 * rows and "---- COMMUNICATION PHASE ----" dividers. New messages type in at 50 chars/s and the log springs up.
 */
type Msg = {author: string; text: string; replies?: number; report?: boolean; divider?: boolean};
type Props = {
  background: string;
  messages: Msg[];
  colors: Record<string, string>;
  chipText: Record<string, string>;
  header: string;
  headerRight: string;
  typeSpeed: number;
  every: number;
  width: number;
  demoScene: boolean;
  seed: number;
  repliesLabel: string;
  viewLabel: string;
};

const AgentLogPanel: React.FC<Props> = ({background, messages, colors, chipText, header, headerRight, typeSpeed, every, width, demoScene, seed, repliesLabel = 'replies', viewLabel = 'View conversation'}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const fs = 12.5 * u * (portrait ? 1.9 : 1);
  const lh = fs * 1.5;
  const pw = (portrait ? 0.92 : width) * w;
  const ph = h * (portrait ? 0.6 : 0.78);
  const px = portrait ? w * 0.04 : w * 0.022;
  const py = portrait ? h * 0.3 : h * 0.05;
  const pad = fs * 1.2;
  const inK = easeOutCubic(lin(frame, 2, 12));
  const maxChars = Math.floor((pw - pad * 2) / (fs * 0.62));
  // layout every message, measure heights
  type Block = {y: number; hgt: number; m: Msg; born: number; lines: string[]};
  const blocks: Block[] = [];
  let y = 0;
  messages.forEach((m, i) => {
    const born = 10 + i * every;
    const shown = frame >= born ? typedText(m.text, frame, born + 4, typeSpeed, fps) : '';
    const lines = m.divider || m.report ? [] : wrap(shown, maxChars);
    const full = m.divider || m.report ? 1 : wrap(m.text, maxChars).length;
    const hgt = m.divider ? lh * 1.6 : m.report ? lh * 1.5 : lh * (1.4 + full) + (m.replies ? lh : 0) + lh * 0.5;
    blocks.push({y, hgt, m, born, lines});
    y += hgt;
  });
  // scroll so the newest visible block's bottom sits near the panel bottom
  const liveIdx = blocks.filter((b) => frame >= b.born).length - 1;
  let target = 0;
  if (liveIdx >= 0) {
    const b = blocks[liveIdx];
    target = Math.max(0, b.y + b.hgt - (ph - lh * 4));
  }
  const prev = liveIdx > 0 ? Math.max(0, blocks[liveIdx - 1].y + blocks[liveIdx - 1].hgt - (ph - lh * 4)) : 0;
  const scrollK = liveIdx >= 0 ? easeOutCubic(lin(frame, blocks[liveIdx].born, blocks[liveIdx].born + 9)) : 0;
  const scroll = prev + (target - prev) * scrollK;
  const headerH = lh * 2;
  const renderText = (txt: string, bx: number, by: number, key: string) => {
    // highlight @mentions
    const parts = txt.split(/(@\w+)/g);
    let x = bx;
    return (
      <text key={key} y={by} fontFamily={x58Fonts.mono} fontSize={fs} fill="#E8E8E8">
        {parts.map((p, i) => {
          const el = (
            <tspan key={i} x={i === 0 ? x : undefined} fill={p.startsWith('@') ? '#FFD27A' : '#E8E8E8'}>
              {p}
            </tspan>
          );
          x += p.length * fs * 0.62;
          return el;
        })}
      </text>
    );
  };
  return (
    <AbsoluteFill style={{background: isTransparentBg(background) ? 'transparent' : background, overflow: 'hidden'}}>
      {demoScene ? (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, opacity: 0.9}}>
          <PaintedField id={`alp-${seed}`} w={w} h={h} u={u} seed={seed} frame={frame} />
        </svg>
      ) : null}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${px - (1 - inK) * pw * 0.6} ${py})`} opacity={inK}>
          <rect width={pw} height={ph} fill="#0E1214" opacity={0.72} stroke="#FFFFFF" strokeWidth={1 * u} />
          {/* header */}
          <text x={pad} y={lh * 1.2} fontFamily={x58Fonts.mono} fontSize={fs} fill="#fff" fontWeight={600} letterSpacing={fs * 0.06}>
            {header}
          </text>
          <text x={pw - pad} y={lh * 1.2} textAnchor="end" fontFamily={x58Fonts.mono} fontSize={fs} fill="#AFC3C9">
            {headerRight}
          </text>
          <line x1={0} y1={headerH} x2={pw} y2={headerH} stroke="#fff" strokeOpacity={0.3} strokeWidth={1 * u} />
          <clipPath id={`alp-clip-${seed}`}>
            <rect x={0} y={headerH} width={pw} height={ph - headerH - lh * 0.5} />
          </clipPath>
          <g clipPath={`url(#alp-clip-${seed})`}>
            <g transform={`translate(0 ${headerH + lh - scroll})`}>
              {blocks.map((b, i) => {
                if (frame < b.born) return null;
                const m = b.m;
                if (m.divider) {
                  return (
                    <text key={i} x={pw / 2} y={b.y + lh} textAnchor="middle" fontFamily={x58Fonts.mono} fontSize={fs * 0.9} fill="#9FB0B6">
                      {'------ '}
                      {m.text}
                      {' ------'}
                    </text>
                  );
                }
                const col = colors[m.author] ?? '#8FA3AA';
                if (m.report) {
                  return (
                    <g key={i}>
                      <rect x={pad} y={b.y + lh * 0.2} width={m.author.length * fs * 0.62 + fs} height={lh} fill={col} />
                      <text x={pad + fs * 0.5} y={b.y + lh * 0.95} fontFamily={x58Fonts.mono} fontSize={fs * 0.92} fontWeight={600} fill={chipText[m.author] ?? '#10131A'}>
                        {m.author}
                      </text>
                      {renderText(`  ${m.text} ▾`, pad + m.author.length * fs * 0.62 + fs * 1.4, b.y + lh * 0.95, `rt${i}`)}
                    </g>
                  );
                }
                const av = lh * 0.9;
                return (
                  <g key={i}>
                    <circle cx={pad + av / 2} cy={b.y + lh * 0.7} r={av / 2} fill={col} opacity={0.9} />
                    <rect x={pad + av + fs * 0.5} y={b.y + lh * 0.2} width={(m.author.length + 1) * fs * 0.64 + fs} height={lh} fill={col} />
                    <text x={pad + av + fs} y={b.y + lh * 0.95} fontFamily={x58Fonts.mono} fontSize={fs * 0.95} fontWeight={600} fill={chipText[m.author] ?? '#10131A'}>
                      {m.author}:
                    </text>
                    {b.lines.map((ln, j) => renderText(ln, pad, b.y + lh * (2.15 + j), `t${i}-${j}`))}
                    {m.replies ? (
                      <text x={pad} y={b.y + lh * (2.3 + b.lines.length)} fontFamily={x58Fonts.mono} fontSize={fs * 0.9} fill="#9FB0B6">
                        {m.replies} {repliesLabel}  <tspan fill="#CFE6EC" textDecoration="underline">{viewLabel}</tspan> ▾
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </g>
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const agentLogPanel = defineMotion<Props>({
  id: 'agent-log-panel',
  title: 'Agent log panel',
  category: 'ui',
  description:
    'A dark translucent side panel with a white hairline frame and a turn header, scrolling an agent conversation log: avatar dots, coloured name chips, typed mono messages with highlighted @mentions, reply rows, collapsible report rows and communication-phase dividers.',
  source: ['video x6 29-47 s (left conversation log)'],
  useFor: 'Showing agent reasoning or chat history next to the action; multi-agent demos, customer-support and simulation promos; overlay-capable.',
  durationInFrames: 210,
  defaultProps: {
    background: 'transparent',
    messages: [
      {author: 'General Nova', text: '@SOLDIERS All archers focus one target at a time: V2, then A5. Fighters guard archers. Hurt, stay back.'},
      {author: 'Nova Army Reports', text: '4 reports', report: true},
      {author: 'Archon Vega', text: '@SOLDIERS Protocol: enemy archers are at X=160..195. ALL ray-archers advance east to X=-20 NOW and purge!'},
      {author: 'COMMUNICATION PHASE', text: 'COMMUNICATION PHASE', divider: true},
      {author: 'General Atlas', text: '@General Nova Turn 9 ledger: we both approach zero mass. Extend our truce to turn 15 while we purge the north.', replies: 5},
      {author: 'Onyx Vanguard', text: "@SOLDIERS Cavalry's gone. Pull off that line. Erase their archers, then Vega. No scraps while a faction lives."},
      {author: 'Vega Army Reports', text: '1 report', report: true},
      {author: 'General Nova', text: '@SOLDIERS Kill P1(3hp), P5(4hp), then P3(37hp). Kite ray archers from max range, east side. Bulwark, stay back.'},
    ],
    colors: {'General Nova': '#E58682', 'Archon Vega': '#CBB8F5', 'General Atlas': '#A9D9D0', 'Onyx Vanguard': '#8D8AB8', 'Nova Army Reports': '#E58682', 'Vega Army Reports': '#CBB8F5'},
    chipText: {},
    header: 'TURN: 18/31   ACTION',
    headerRight: 'MANUAL ▷   ⛶',
    typeSpeed: 50,
    every: 24,
    width: 0.25,
    demoScene: true,
    seed: 12,
    repliesLabel: 'replies',
    viewLabel: 'View conversation',
  },
  propDocs: {
    background: "backdrop; 'transparent' (default) overlays the host content",
    messages: 'log entries {author, text, replies?, report? (collapsible row), divider? (phase divider)}',
    colors: 'chip colour per author',
    chipText: 'chip text colour per author (default dark)',
    header: 'panel header left text',
    headerRight: 'panel header right text',
    typeSpeed: 'typing speed in chars/s',
    every: 'frames between messages',
    width: 'panel width as a fraction of frame width (landscape)',
    demoScene: 'paint the painterly battlefield behind (preview only; turn off as an overlay)',
    seed: 'scene seed',
    repliesLabel: 'word after the reply count under a message',
    viewLabel: 'underlined link text under a message',
  },
  component: AgentLogPanel,
  tags: ['log', 'chat', 'panel', 'conversation', 'agents', 'messages', 'typing', 'scroll', 'hud', 'ui', 'overlay', 'multi-agent', 'reasoning', 'terminal'],
});
