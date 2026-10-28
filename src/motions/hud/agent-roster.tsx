import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {AgentAvatar, CtrlIcon, PaintedField, easeOutCubic, isTransparentBg, lin, x58Fonts} from '../../core/r2-x58-kit';

/**
 * x6 agent-roster: a 2×2 block of agent status cards in the bottom-left — square portrait, mono name, points
 * "396PT", a coloured status chip ("THINKING...", "CRUSHING...", "ON STANDBY") and a token counter "1338470TK"
 * that ticks up continuously (≈ 45 k tokens/s), with a thin white progress bar under each card. Cards slide in
 * from the left (0.3 s easeOutCubic, 0.08 s stagger). Bottom-right: a row of line icons (settings, mute,
 * HUD toggle, about, pause). Overlay-capable.
 */
type Agent = {name: string; color: string; status: string; points: number; tokens: number; rate: number; src?: string};
type Props = {
  background: string;
  agents: Agent[];
  chipText: Record<string, string>;
  sponsor: string;
  controls: boolean;
  hudLabel: string;
  inAt: number;
  demoScene: boolean;
  seed: number;
};

const AgentRoster: React.FC<Props> = ({background, agents, chipText, sponsor, controls, hudLabel, inAt, demoScene, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const fs = 12 * u * (portrait ? 1.5 : 1);
  const cardW = (portrait ? 0.42 : 0.17) * w;
  const cardH = cardW * 0.42;
  const gapX = cardW * 0.08;
  const gapY = cardH * 0.34;
  const x0 = w * 0.022;
  const y0 = h - h * 0.035 - 2 * cardH - gapY;
  const pad = cardH * 0.12;
  const pic = cardH * 0.62;
  return (
    <AbsoluteFill style={{background: isTransparentBg(background) ? 'transparent' : background, overflow: 'hidden'}}>
      {demoScene ? (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, opacity: 0.9}}>
          <PaintedField id={`ar-${seed}`} w={w} h={h} u={u} seed={seed} frame={frame} />
        </svg>
      ) : null}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <text x={x0} y={y0 - fs * 1.1} fontFamily={x58Fonts.mono} fontSize={fs * 0.85} fill="#fff" opacity={0.7} letterSpacing={fs * 0.15}>
          {sponsor}
        </text>
        {agents.slice(0, 4).map((a, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const k = easeOutCubic(lin(frame, inAt + i * 2.5, inAt + i * 2.5 + 9));
          if (k <= 0) return null;
          const x = x0 + col * (cardW + gapX) - (1 - k) * cardW * 0.8;
          const y = y0 + row * (cardH + gapY);
          const tokens = Math.max(0, Math.floor(a.tokens + (frame / fps) * a.rate));
          const tokenStr = String(tokens).padStart(7, '0') + 'TK';
          const dots = '.'.repeat(1 + (Math.floor(frame / 10) % 3));
          const status = a.status.endsWith('...') ? a.status.slice(0, -3) + dots : a.status;
          const barK = 0.25 + 0.6 * Math.abs(Math.sin(frame * 0.02 + i * 2));
          return (
            <g key={i} opacity={k}>
              <rect x={x} y={y} width={cardW} height={cardH} fill="#0E1214" opacity={0.72} />
              <g transform={`translate(${x + pad} ${y + pad})`}>
                <AgentAvatar id={`ar-av-${seed}-${i}`} kind={i} x={0} y={0} s={pic} color={a.color} frame={frame} />
                <rect width={pic} height={pic} fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={1 * u} />
              </g>
              <text x={x + pad + pic + pad} y={y + pad + fs} fontFamily={x58Fonts.mono} fontSize={fs} fontWeight={600} fill="#fff">
                {a.name.toUpperCase()}
              </text>
              <text x={x + cardW - pad} y={y + pad + fs} textAnchor="end" fontFamily={x58Fonts.mono} fontSize={fs} fill="#fff">
                {a.points}PT
              </text>
              <rect x={x + pad + pic + pad} y={y + pad + fs * 1.45} width={status.length * fs * 0.62 + fs * 0.6} height={fs * 1.3} fill={a.color} />
              <text x={x + pad + pic + pad + fs * 0.3} y={y + pad + fs * 2.42} fontFamily={x58Fonts.mono} fontSize={fs * 0.85} fontWeight={600} fill={chipText[a.name] ?? '#10131A'}>
                {status}
              </text>
              <text x={x + pad + pic + pad} y={y + pad + fs * 3.9} fontFamily={x58Fonts.mono} fontSize={fs * 0.95} fill="#E8E8E8">
                {tokenStr}
              </text>
              <rect x={x} y={y + cardH + 4 * u} width={cardW} height={2 * u} fill="#fff" opacity={0.25} />
              <rect x={x} y={y + cardH + 4 * u} width={cardW * barK * k} height={2 * u} fill="#fff" opacity={0.8} />
            </g>
          );
        })}
        {controls
          ? (() => {
              const kinds = ['settings', 'mute', 'eye', 'info', 'pause'];
              const labels = ['SETTINGS', 'MUTE', hudLabel, 'ABOUT', 'PAUSE'];
              const s = fs * 1.5;
              const gap = s * (portrait ? 2.6 : 3.4);
              const cy = h - h * 0.05;
              const cx0 = w - w * 0.03 - gap * (kinds.length - 1);
              const k = easeOutCubic(lin(frame, inAt + 6, inAt + 16));
              return (
                <g opacity={k * 0.9}>
                  {kinds.map((kd, i) => (
                    <g key={kd}>
                      <CtrlIcon kind={kd} x={cx0 + i * gap} y={cy - fs * 1.2} s={s} color="#fff" sw={1.5 * u} />
                      <text x={cx0 + i * gap} y={cy + fs * 0.9} textAnchor="middle" fontFamily={x58Fonts.mono} fontSize={fs * 0.75} fill="#fff" letterSpacing={fs * 0.06}>
                        {labels[i]}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()
          : null}
      </svg>
    </AbsoluteFill>
  );
};

export const agentRoster = defineMotion<Props>({
  id: 'agent-roster',
  title: 'Agent roster',
  category: 'hud',
  description:
    'A 2×2 block of agent status cards (portrait, name, points, coloured status chip with animated dots, a 7-digit token counter ticking up, a thin progress bar) that slides in from the left, plus a bottom-right row of line-icon controls.',
  source: ['video x6 10.5-47 s (sponsor roster cards + control bar)'],
  useFor: 'Multi-agent dashboards, leaderboards and AI benchmark videos; overlay-capable with background "transparent".',
  durationInFrames: 180,
  defaultProps: {
    background: 'transparent',
    agents: [
      {name: 'Nova', color: '#E58682', status: 'CRUSHING...', points: 396, tokens: 1338470, rate: 45000},
      {name: 'Atlas', color: '#A9D9D0', status: 'ON STANDBY', points: 36, tokens: 345554, rate: 0},
      {name: 'Vega', color: '#CBB8F5', status: 'THINKING...', points: 480, tokens: 1052523, rate: 52000},
      {name: 'Onyx', color: '#141227', status: 'FIGHTING...', points: 108, tokens: 798606, rate: 38000},
    ],
    chipText: {Onyx: '#FFFFFF'},
    sponsor: '[ SPONSOR ]',
    controls: true,
    hudLabel: 'HUD ON',
    inAt: 4,
    demoScene: true,
    seed: 11,
  },
  propDocs: {
    background: "backdrop; 'transparent' (default) overlays the host content",
    agents: 'up to 4 agents {name, color, status, points, tokens, rate (tokens/s)}; status ending in "..." animates its dots',
    chipText: 'chip text colour per agent (default dark)',
    sponsor: 'small label above the block',
    controls: 'bottom-right line-icon control row',
    hudLabel: "label under the eye icon ('HUD ON' / 'HUD OFF')",
    inAt: 'frame the cards slide in',
    demoScene: 'paint the painterly battlefield behind (preview only; turn off as an overlay)',
    seed: 'scene seed',
  },
  component: AgentRoster,
  tags: ['agents', 'roster', 'status cards', 'dashboard', 'leaderboard', 'tokens', 'counter', 'hud', 'overlay', 'ai', 'multi-agent', 'benchmark', 'game ui'],
});
