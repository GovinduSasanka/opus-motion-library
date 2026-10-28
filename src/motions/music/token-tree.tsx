// Adapted from pdoom-video/app/src/scenes/loom-tree.ts (token path + dim alternative branches, beat-step pull-back) (MIT, © 2026 Giacomo Magnanini) — see THIRD_PARTY_NOTICES.md
// Sentence and alternatives are original placeholder copy.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {BeatsProp, E, MUSIC_PROP_DOCS, TREATISE, TreatiseFinish, clamp01, garamondItalic, hash, lerpN, plexMono, springStep, useGrid} from '../../core/r2-music-kit';

type Step = {token: string; p: number; alts: [string, number][]};
type Props = {
  path: Step[];
  bpm: number;
  offsetSec: number;
  beats: BeatsProp;
  beatsPerToken: number;
  depth: number;
  background: string;
  ink: string;
  dim: string;
  accent: string;
  serifToken: boolean;
  seed: number;
};

const SUB = ['and', 'so', 'of', 'then', 'like', 'not', 'into', 'with', 'all', 'just', 'still', 'more'];

const TokenTree: React.FC<Props> = ({path, bpm, offsetSec, beats, beatsPerToken, depth, background, ink, dim, accent, serifToken, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames, portrait} = useStage();
  const g = useGrid(beats, bpm, offsetSec);
  const t = frame / fps;
  const steps = path.length ? path : [];
  const n = steps.length;
  const per = Math.max(0.25, beatsPerToken);
  const tokT = (i: number) => g.timeOfBeat(1 + i * per);
  const shown = steps.filter((_, i) => t >= tokT(i)).length;
  // world layout (unit = px at zoom 1)
  const fs = 30 * u * (portrait ? 1.6 : 1);
  const dx = Math.max(150 * u, fs * 5.2);
  const dy = fs * 1.9;
  const node = (i: number) => ({x: i * dx, y: 0});
  type Br = {x0: number; y0: number; x1: number; y1: number; text: string; p: number; at: number; lvl: number; key: string};
  const branches: Br[] = [];
  steps.forEach((st, i) => {
    const at = tokT(i);
    const base = node(i);
    st.alts.forEach(([tx, p], k) => {
      const side = k % 2 ? 1 : -1;
      const rank = Math.floor(k / 2) + 1;
      const y1 = side * rank * dy * (1 + 0.15 * hash(i, k, seed));
      const x1 = base.x + dx * 0.95;
      branches.push({x0: base.x, y0: 0, x1, y1, text: tx, p, at: at + 0.06 * k, lvl: 1, key: `${i}-${k}`});
      // keep branching into the dark
      if (depth >= 2) {
        for (let m = 0; m < 2; m++) {
          const yy = y1 + (m ? 1 : -1) * dy * 0.48 * (1 + 0.2 * hash(i, k, m));
          const txt = SUB[Math.floor(hash(i, k, m, seed) * SUB.length)];
          branches.push({x0: x1 + fs * 0.6 * tx.length, y0: y1, x1: x1 + fs * 0.6 * tx.length + dx * 0.7, y1: yy, text: txt, p: p * (0.2 + 0.5 * hash(i, k, m, 9)), at: at + 0.25 + 0.08 * m, lvl: 2, key: `${i}-${k}-${m}`});
          if (depth >= 3) {
            const x2 = x1 + fs * 0.6 * tx.length + dx * 0.7 + fs * 0.6 * txt.length;
            branches.push({x0: x2, y0: yy, x1: x2 + dx * 0.55, y1: yy + (m ? 1 : -1) * dy * 0.3, text: '…', p: 0.01, at: at + 0.5, lvl: 3, key: `${i}-${k}-${m}-x`});
          }
        }
      }
    });
  });
  // bounds for the final pull-back
  let minY = 0;
  let maxY = 0;
  let maxX = (n - 1) * dx + dx;
  for (const b of branches) {
    minY = Math.min(minY, b.y1);
    maxY = Math.max(maxY, b.y1);
    maxX = Math.max(maxX, b.x1 + fs * 2);
  }
  const fit = Math.min((w * 0.9) / (maxX + fs * 4), (h * 0.8) / (maxY - minY + fs * 3));
  // camera: ride the tip (zoom ~1.7) while generating, then pull back in beat steps
  const lastT = n ? tokT(n - 1) : 0;
  const tipI = Math.max(0, shown - 1);
  const kTip = n ? springStep(t - tokT(tipI), 2.6, 0.55) : 1;
  const tipX = lerpN(node(Math.max(0, tipI - 1)).x, node(tipI).x, shown > 1 ? kTip : 1);
  const followZoom = Math.max(fit, Math.min(1.7, (w * 0.5) / (dx * 2.2)));
  const pb = Math.max(0, g.beatAt(t) - g.beatAt(lastT + g.period));
  const pStep = Math.min(4, Math.floor(pb));
  const pk = clamp01((pStep + springStep((pb - pStep) * g.period, 3, 0.5)) / 4);
  const zoom = lerpN(followZoom, fit, t > lastT ? pk : 0);
  const camX = lerpN(tipX + dx * (portrait ? 0.9 : 0.4), (maxX + fs * 4) / 2 - fs * 2, t > lastT ? pk : 0);
  const camY = lerpN(0, (minY + maxY) / 2, t > lastT ? pk : 0);
  const tx = w * (portrait ? 0.5 : 0.5) - camX * zoom;
  const ty = h * 0.5 - camY * zoom;
  const intro = clamp01(frame / 10);
  const clear = background === 'transparent';
  const mono = 13 * u * (portrait ? 2 : 1);
  const sentence = steps.slice(0, shown).map((s) => s.token).join(' ');
  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: intro}}>
        <g transform={`translate(${tx} ${ty}) scale(${zoom})`}>
          {branches.map((b) => {
            const k = E.outCubic(clamp01((t - b.at) / 0.35));
            if (k <= 0) return null;
            const ex = lerpN(b.x0, b.x1, k);
            const ey = lerpN(b.y0, b.y1, k);
            const op = b.lvl === 1 ? 0.55 : b.lvl === 2 ? 0.3 : 0.18;
            return (
              <g key={b.key} opacity={op}>
                <path d={`M${b.x0} ${b.y0} C${b.x0 + (ex - b.x0) * 0.5} ${b.y0} ${b.x0 + (ex - b.x0) * 0.5} ${ey} ${ex} ${ey}`} fill="none" stroke={dim} strokeWidth={Math.max(0.8, (b.lvl === 1 ? 1.4 : 1) * u) / zoom} />
                {k > 0.6 ? (
                  <text x={b.x1 + 6 * u} y={b.y1 + fs * 0.3 * (b.lvl === 1 ? 1 : 0.75)} fontFamily={plexMono} fontSize={fs * (b.lvl === 1 ? 0.85 : 0.62)} fill={ink}>
                    {b.text}
                    {b.lvl === 1 ? <tspan fill={dim} fontSize={fs * 0.5}>{`  ${(b.p * 100).toFixed(b.p < 0.1 ? 1 : 0)}%`}</tspan> : null}
                  </text>
                ) : null}
              </g>
            );
          })}
          {/* the chosen path */}
          {steps.map((st, i) => {
            if (t < tokT(i)) return null;
            const a = node(i);
            const k = E.outExpo(clamp01((t - tokT(i)) / 0.25));
            const last = i === n - 1;
            const serif = last && serifToken;
            const prev = i > 0 ? node(i - 1) : null;
            return (
              <g key={i}>
                {prev ? <line x1={prev.x + fs * 0.62 * steps[i - 1].token.length + 10 * u} y1={0} x2={lerpN(prev.x + fs * 0.62 * steps[i - 1].token.length + 10 * u, a.x - 8 * u, k)} y2={0} stroke={accent} strokeWidth={Math.max(1.5, 2.4 * u) / Math.max(0.6, zoom)} /> : null}
                <circle cx={a.x - 8 * u} cy={0} r={4 * u} fill={accent} />
                <text x={a.x} y={fs * 0.36} fontFamily={serif ? garamondItalic : plexMono} fontStyle={serif ? 'italic' : undefined} fontWeight={serif ? 700 : 500} fontSize={fs * (serif ? 1.45 : 1)} fill={i === shown - 1 ? accent : ink} opacity={k}>
                  {st.token}
                </text>
                <text x={a.x} y={-fs * 0.85} fontFamily={plexMono} fontSize={fs * 0.42} fill={dim} opacity={k}>
                  {`p ${st.p.toFixed(2)}`}
                </text>
              </g>
            );
          })}
        </g>
        {/* readout */}
        <text x={w * 0.05} y={h * 0.08} fontFamily={plexMono} fontSize={mono} fill={ink} opacity={0.6} letterSpacing={2}>
          {`SAMPLED ${shown}/${n} · BRANCHES ${branches.filter((b) => t >= b.at).length}`}
        </text>
        <text x={w * 0.05} y={h * 0.93} fontFamily={plexMono} fontSize={mono * 1.15} fill={ink} opacity={0.85}>
          {sentence}
          <tspan fill={accent}>{Math.floor(t * 2.4) % 2 ? '▍' : ' '}</tspan>
        </text>
      </svg>
      {!clear ? <TreatiseFinish grain={0.06} vignette={0.4} /> : null}
    </AbsoluteFill>
  );
};

export const tokenTree = defineMotion<Props>({
  id: 'token-tree',
  title: 'Token tree (what the model could have said)',
  category: 'music',
  description:
    'A sentence is generated token by token on the beat along a bright chosen path while every node sprouts dim alternative branches with their tokens and probabilities that keep branching into the dark; the camera rides the tip, then pulls back in beat steps until the whole tree is in frame, the last token set in italic serif.',
  source: ['pdoom-video app/src/scenes/loom-tree.ts (MIT); original sentence and alternatives'],
  useFor: 'LLM explainers (“what the model could have said”), decision trees, branching-story or A/B moments; pairs with token-sampler-prompt.',
  durationInFrames: 300,
  defaultProps: {
    path: [
      {token: 'The', p: 0.62, alts: [['A', 0.21], ['Our', 0.07], ['This', 0.05]]},
      {token: 'night', p: 0.34, alts: [['city', 0.28], ['room', 0.12], ['song', 0.09]]},
      {token: 'was', p: 0.71, alts: [['felt', 0.12], ['went', 0.06]]},
      {token: 'quiet', p: 0.27, alts: [['loud', 0.24], ['long', 0.17], ['blue', 0.04]]},
      {token: 'until', p: 0.48, alts: [['and', 0.22], ['so', 0.11]]},
      {token: 'the', p: 0.81, alts: [['a', 0.09], ['our', 0.04]]},
      {token: 'music', p: 0.19, alts: [['rain', 0.23], ['lights', 0.16], ['phone', 0.08]]},
      {token: 'started', p: 0.44, alts: [['stopped', 0.31], ['answered', 0.06]]},
    ],
    bpm: 120,
    offsetSec: 0.3,
    beats: {},
    beatsPerToken: 1,
    depth: 3,
    background: TREATISE.ink,
    ink: TREATISE.bone,
    dim: TREATISE.dim,
    accent: TREATISE.signal,
    serifToken: true,
    seed: 4,
  },
  propDocs: {
    path: 'the chosen tokens in order [{token, p, alts: [[alternative, p], …]}]',
    ...MUSIC_PROP_DOCS,
    beatsPerToken: 'beats between tokens',
    depth: 'how deep the dim alternatives keep branching (1–3)',
    background: "frame colour or 'transparent'",
    ink: 'token text colour',
    dim: 'branch / probability colour',
    accent: 'chosen path colour',
    serifToken: 'set the final token in italic serif',
    seed: 'sub-branch variety',
  },
  component: TokenTree,
  tags: ['llm', 'token', 'tree', 'branching', 'probability', 'sampling', 'ai', 'decision tree', 'explainer', 'beam search', 'beat', 'camera pull back', 'treatise'],
});
