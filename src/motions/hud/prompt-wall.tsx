import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {Brackets, KLEIN, h01, isTransparentBg, lin, scramble, wrap, x58Fonts} from '../../core/r2-x58-kit';

/**
 * x6 prompt-wall: the Klein-blue screen is filled with faint wireframe boxes holding fragments of prompt templates
 * ("// ORDERS – TURN 14", "{{agentName}}", "RECRUIT YOUR ARMY…") at 15–45 % opacity in three depth tiers. A new
 * box appears every ≈ 0.3 s, types its text in, lives 2–4 s and fades; a few foreground lines are brighter.
 * Optional centred title in pixel blackletter wrapped in [ ] that scramble-decodes in. Overlay-capable.
 */
type Props = {
  background: string;
  ink: string;
  frameColor: string;
  snippets: string[];
  density: number;
  every: number;
  title: string;
  titleColor: string;
  scanlines: boolean;
  seed: number;
};

const DEFAULT_SNIPPETS = [
  '// ORDERS – TURN 14|Hold the ridge, then flank east once the archers are in range.',
  '// PRIORITY – A|Keep your line spread out with room to maneuver. Place archers first.',
  'RECRUIT YOUR ARMY|Budget: {{budget}} points (must spend exactly). Unit costs & roles: Fighter (1pt) — balanced infantry.',
  '// COMM – BROADCAST|You are {{agentName}}, the general of an army of agents. Define how you represent yourself.',
  'THE STAKES|You are about to enter a {{battleType}} battle against {{opponents}}. Victory condition: most points after {{maxTurns}} turns.',
  '// THOUGHT – SQUAD 01|COMMUNICATION (Position {{position}}) — report enemy count and distance.',
  'VALIDATION RULES|Array length must equal the number of soldiers. Return JSON only.',
  'A. speak_general [name]|Open a one-to-one channel with a rival general.',
  'B. broadcast_generals|One-way announcement to every living rival general. Good for declarations and ultimatums.',
  '// FEED – STREAM|{{squadName}} reports: two cavalry units lost near the ford.',
  '// ORDERS – TURN 09|Paladin (2pt) — durable frontliner (30HP, speed 160).',
  'You are {{squadName}}|a {{role}} squad of {{factionTheme}} under General {{generalName}}.',
];

type Box = {x: number; y: number; w: number; h: number; tier: number; born: number; life: number; head: string; body: string};

const PromptWall: React.FC<Props> = ({background, ink, frameColor, snippets, density, every, title, titleColor, scanlines, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const list = snippets.length ? snippets : DEFAULT_SNIPPETS;
  const fs = 15 * u * (portrait ? 1.2 : 1);
  const lh = fs * 1.35;
  // boxes are spawned on a fixed schedule (one every `every` frames), including some born before frame 0
  const boxes: Box[] = [];
  const span = 140;
  const first = Math.floor((frame - span) / every);
  const last = Math.floor(frame / every);
  for (let k = first; k <= last; k++) {
    const r = (n: number) => h01(k, n, seed);
    const tier = r(1) < 0.45 ? 0 : r(1) < 0.85 ? 1 : 2;
    const bw = w * (portrait ? 0.38 : 0.16) * (0.8 + 0.6 * r(2));
    const bh = h * (portrait ? 0.1 : 0.17) * (0.7 + 0.8 * r(3));
    const snip = list[Math.floor(r(4) * list.length)];
    const [head, body] = snip.includes('|') ? snip.split('|') : ['', snip];
    for (let d = 0; d < density; d++) {
      if (d > 0 && h01(k, d, 77) > density - d) continue;
      boxes.push({
        x: (w - bw) * h01(k, d, 5) - w * 0.02,
        y: (h - bh) * h01(k, d, 6),
        w: bw,
        h: bh,
        tier,
        born: k * every,
        life: (3 + 2 * r(7)) * fps,
        head,
        body,
      });
    }
  }
  const tierOp = [0.45, 0.65, 0.95];
  const tierSc = [0.9, 1, 1.05];
  const titleText = title ? `[ ${title} ]` : '';
  const shown = scramble(titleText, frame, 10, Math.max(12, titleText.length * 0.6), seed);
  return (
    <AbsoluteFill style={{background: isTransparentBg(background) ? 'transparent' : background, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        {boxes.map((b, i) => {
          const age = frame - b.born;
          if (age < 0 || age > b.life) return null;
          const op = tierOp[b.tier] * Math.min(lin(age, 0, 6), 1 - lin(age, b.life - 12, b.life));
          const sc = tierSc[b.tier];
          const cps = 50;
          const typedChars = Math.floor((age / fps) * cps);
          const maxChars = Math.max(12, Math.floor(b.w / (fs * 0.6)) - 2);
          const lines = wrap(b.body, maxChars).slice(0, Math.max(1, Math.floor((b.h - lh * 2) / lh)));
          let left = typedChars;
          return (
            <g key={i} opacity={op} transform={`translate(${b.x + b.w / 2} ${b.y + b.h / 2}) scale(${sc}) translate(${-b.w / 2} ${-b.h / 2})`}>
              <rect width={b.w} height={b.h} fill="none" stroke={frameColor} strokeWidth={1.2 * u} />
              <Brackets x={-3 * u} y={-3 * u} w={b.w + 6 * u} h={b.h + 6 * u} len={8 * u} color={frameColor} sw={1.2 * u} />
              {b.head ? (
                <text x={fs * 0.8} y={lh * 1.1} fontFamily={x58Fonts.mono} fontSize={fs * 0.8} fill={ink} letterSpacing={fs * 0.05}>
                  {b.head}
                </text>
              ) : null}
              {lines.map((ln, j) => {
                const vis = ln.slice(0, Math.max(0, left));
                left -= ln.length + 1;
                return (
                  <text key={j} x={fs * 0.8} y={lh * (2.3 + j)} fontFamily={x58Fonts.mono} fontSize={fs} fill={ink}>
                    {vis}
                  </text>
                );
              })}
            </g>
          );
        })}
      </svg>
      {titleText ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            textAlign: 'center',
            fontFamily: x58Fonts.blackletter,
            fontSize: (portrait ? 88 : 104) * u,
            color: titleColor,
            whiteSpace: 'pre',
            textShadow: `${2 * u}px 0 rgba(255,42,109,0.35), ${-2 * u}px 0 rgba(0,220,255,0.35)`,
          }}
        >
          {shown}
        </div>
      ) : null}
      {scanlines ? (
        <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.08, backgroundImage: `repeating-linear-gradient(0deg, #000 0px, #000 ${1 * u}px, transparent ${1 * u}px, transparent ${3 * u}px)`}} />
      ) : null}
    </AbsoluteFill>
  );
};

export const promptWall = defineMotion<Props>({
  id: 'prompt-wall',
  title: 'Prompt wall',
  category: 'hud',
  description:
    'A saturated Klein-blue terminal backdrop filled with faint wireframe boxes of prompt-template fragments in three depth tiers that type in, live a few seconds and fade, with corner brackets, scanlines and an optional scramble-decoded blackletter title.',
  source: ['video x6 4.3-8.3 s (ghost prompt panels behind the roster)'],
  useFor: '"The AI is thinking / system prompt" backdrops behind titles, techy section backgrounds on websites, agent and simulation promos.',
  durationInFrames: 180,
  defaultProps: {
    background: KLEIN.bg,
    ink: KLEIN.ghost,
    frameColor: KLEIN.frame,
    snippets: [],
    density: 2,
    every: 9,
    title: '',
    titleColor: KLEIN.title,
    scanlines: true,
    seed: 82,
  },
  propDocs: {
    background: "screen colour ('transparent' for an overlay over another motion)",
    ink: 'ghost text colour',
    frameColor: 'wireframe box colour',
    snippets: "text fragments; 'HEADER|body' puts a small header line on top (empty = built-in neutral prompt templates)",
    density: 'boxes spawned per tick (1–3)',
    every: 'frames between new boxes (9 ≈ 0.3 s)',
    title: 'optional centred title, shown as [ TITLE ] in pixel blackletter, scramble-decoded in',
    titleColor: 'title colour',
    scanlines: 'faint CRT scanlines',
    seed: 'layout seed',
  },
  component: PromptWall,
  tags: ['terminal', 'prompt', 'ai', 'agent', 'klein blue', 'backdrop', 'background', 'wireframe', 'code', 'text', 'ghost text', 'system prompt', 'thinking', 'simulation', 'hud', 'overlay', 'monospace'],
});
