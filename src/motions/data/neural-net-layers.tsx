import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {Svg, useStage, Vignette} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {forward, makeWeights, mixHex5, ramp, rgba5} from '../../core/r2-pr5-kit';

/**
 * Neural net, forward pass: columns of neurons joined by weighted connections. Real (seeded) weights drive the
 * look — line width = |weight|, blue = positive / orange = negative — and an activation wave travels layer by
 * layer as glowing pulses; neurons ramp blue -> yellow with their activation and an output bar chart (softmax)
 * updates. The pass repeats with a new input every `cycle` frames.
 */

type Props = {
  layers: number[];
  inputs: number[];
  labels: string[];
  title: string;
  subtitle: string;
  cycle: number;
  travel: number;
  showWeights: boolean;
  seed: number;
  background: string;
  ink: string;
  ramp: string[];
  positive: string;
  negative: string;
};

const NeuralNetLayers: React.FC<Props> = ({layers, inputs, labels, title, subtitle, cycle, travel, showWeights, seed, background, ink, ramp: rampStops, positive, negative}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const PT = portrait ? 1.8 : 1;
  const sizes = React.useMemo(() => layers.map((n) => Math.max(1, Math.min(14, Math.round(n)))).slice(0, 7), [layers]);
  const L = sizes.length;
  const weights = React.useMemo(() => makeWeights(sizes, seed), [sizes, seed]);

  // pass index + local time within the pass
  const intro = 22;
  const f = Math.max(0, frame - intro);
  const pass = Math.floor(f / cycle);
  const lf = f - pass * cycle;
  const input = React.useMemo(() => {
    if (pass === 0 && inputs.length >= sizes[0]) return inputs;
    const r = rng(`${seed}:in:${pass}`);
    const base = inputs.length ? inputs : Array.from({length: sizes[0]}, () => 0);
    return Array.from({length: sizes[0]}, (_, i) => (pass === 0 && inputs.length ? base[i] : 0.12 + r() * 0.86));
  }, [pass, inputs, sizes, seed]);
  const res = React.useMemo(() => forward(sizes, weights, input), [sizes, weights, input]);
  const prev = React.useMemo(() => {
    if (pass === 0) return null;
    const r = rng(`${seed}:in:${pass - 1}`);
    return forward(sizes, weights, Array.from({length: sizes[0]}, () => 0.12 + r() * 0.86));
  }, [pass, sizes, weights, seed]);

  // layout: landscape flows left -> right, portrait top -> bottom
  const netBox = portrait ? {x0: w * 0.1, x1: w * 0.9, y0: h * 0.2, y1: h * 0.62} : {x0: w * 0.1, x1: w * 0.66, y0: h * 0.2, y1: h * 0.86};
  const pos = (l: number, i: number) => {
    const a = L === 1 ? 0.5 : l / (L - 1);
    const n = sizes[l];
    const b = n === 1 ? 0.5 : i / (n - 1);
    const span = 0.04 + 0.96 * (n - 1) / Math.max(1, Math.max(...sizes) - 1);
    const bb = 0.5 + (b - 0.5) * span;
    return portrait
      ? {x: netBox.x0 + (netBox.x1 - netBox.x0) * bb, y: netBox.y0 + (netBox.y1 - netBox.y0) * a}
      : {x: netBox.x0 + (netBox.x1 - netBox.x0) * a, y: netBox.y0 + (netBox.y1 - netBox.y0) * bb};
  };
  const maxN = Math.max(...sizes);
  const gap = (portrait ? netBox.x1 - netBox.x0 : netBox.y1 - netBox.y0) / Math.max(1, maxN - 1);
  const nodeR = Math.min(26 * u, gap * 0.36, 22 * u);

  // activation wave: layer l lights at lf = l*travel
  const waveAt = (l: number) => l * travel;
  const lit = (l: number) => prog(lf, waveAt(l), waveAt(l) + travel * 0.8, ease.out);
  const entrance = (l: number) => prog(frame, l * 3, l * 3 + 14, ease.out);

  const actOf = (l: number, i: number) => {
    const cur = res.acts[l][i];
    const old = prev ? prev.acts[l][i] : 0.12;
    const k = lit(l);
    return old * (1 - k) + cur * k;
  };

  const titleSize = (portrait ? 54 : 46) * u;
  const outLabels = Array.from({length: sizes[L - 1]}, (_, i) => labels[i] ?? `class ${String.fromCharCode(65 + i)}`);
  const winner = res.probs.indexOf(Math.max(...res.probs));
  // bar chart box
  const bars = portrait ? {x: w * 0.12, y: h * 0.7, w: w * 0.76, h: h * 0.18} : {x: w * 0.72, y: h * 0.3, w: w * 0.2, h: h * 0.46};
  const barK = lit(L - 1);
  const rowH = bars.h / outLabels.length;

  return (
    <AbsoluteFill style={{background}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 70% at 45% 50%, ${rgba5(rampStops[0], 0.1)}, transparent 70%)`}} />
      <Svg>
        <defs>
          <filter id="nnl-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={5 * u} />
          </filter>
        </defs>

        {/* connections */}
        {sizes.slice(0, -1).map((n, l) =>
          Array.from({length: n}, (_, i) =>
            Array.from({length: sizes[l + 1]}, (_, j) => {
              const wt = weights[l][i][j];
              const a = pos(l, i);
              const b = pos(l + 1, j);
              const e = entrance(l + 1);
              const src = actOf(l, i);
              const k = clamp((lf - waveAt(l + 1) + travel) / travel); // pulse progress along the edge
              const pulse = lf >= waveAt(l) && k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0;
              const strength = showWeights ? 0.2 + Math.abs(wt) * 0.8 : 0.5;
              const col = wt >= 0 ? positive : negative;
              const px = a.x + (b.x - a.x) * k;
              const py = a.y + (b.y - a.y) * k;
              return (
                <g key={`${l}-${i}-${j}`} opacity={e}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={rgba5(col, 0.1 + 0.34 * strength * (0.4 + 0.6 * src))} strokeWidth={(showWeights ? 0.4 + Math.abs(wt) * 2.8 : 1.2) * u} strokeLinecap="round" />
                  {pulse > 0.02 ? (
                    <>
                      <circle cx={px} cy={py} r={(3 + 5 * Math.abs(wt)) * u} fill={mixHex5(col, '#ffffff', 0.5)} opacity={Math.min(1, pulse * src * 1.8) * 0.9} filter="url(#nnl-glow)" />
                      <circle cx={px} cy={py} r={2 * u} fill="#fff" opacity={Math.min(1, pulse * src * 2)} />
                    </>
                  ) : null}
                </g>
              );
            }),
          ),
        )}

        {/* neurons */}
        {sizes.map((n, l) =>
          Array.from({length: n}, (_, i) => {
            const p = pos(l, i);
            const a = clamp(actOf(l, i));
            const e = entrance(l);
            const c = ramp(rampStops, a);
            const isIn = l === 0;
            const pop = 1 + 0.18 * Math.sin(clamp((lf - waveAt(l)) / (travel * 0.9)) * Math.PI) * (l === 0 ? 0 : 1);
            return (
              <g key={`${l}-${i}`} opacity={e} transform={`translate(${p.x} ${p.y}) scale(${(0.4 + 0.6 * e) * pop})`}>
                <circle r={nodeR * (1.5 + 0.7 * a)} fill={c} opacity={0.12 + 0.34 * a} filter="url(#nnl-glow)" />
                {isIn ? (
                  <rect x={-nodeR * 0.85} y={-nodeR * 0.85} width={nodeR * 1.7} height={nodeR * 1.7} rx={nodeR * 0.25} fill={c} stroke={rgba5(ink, 0.5)} strokeWidth={1.4 * u} />
                ) : (
                  <circle r={nodeR} fill={mixHex5(background, c, 0.18 + 0.82 * a)} stroke={mixHex5(rgba5(ink, 0.5), c, a)} strokeWidth={2 * u} />
                )}
              </g>
            );
          }),
        )}

        {/* layer captions */}
        {portrait
          ? null
          : sizes.map((_, l) => {
              const p0 = pos(l, 0);
              const name = l === 0 ? 'input' : l === L - 1 ? 'output' : `hidden ${l}`;
              return (
                <text key={l} x={p0.x} y={netBox.y1 + 54 * u} fontFamily={fonts.mono} fontSize={15 * PT * u} fill={ink} opacity={0.5 * entrance(l)} textAnchor="middle">
                  {name}
                </text>
              );
            })}

        {/* output bar chart */}
        <g opacity={prog(frame, L * 3, L * 3 + 16)}>
          <text x={bars.x} y={bars.y - 18 * u} fontFamily={fonts.mono} fontSize={15 * PT * u} fill={ink} opacity={0.55}>
            OUTPUT · SOFTMAX
          </text>
          {outLabels.map((lab, i) => {
            const pOld = prev ? prev.probs[i] : 0;
            const pv = pOld * (1 - barK) + res.probs[i] * barK;
            const y = bars.y + rowH * i;
            const isWin = i === winner && barK > 0.9;
            const full = bars.w - 90 * u;
            return (
              <g key={i}>
                <text x={bars.x} y={y + rowH * 0.62} fontFamily={fonts.mono} fontSize={Math.min((portrait ? 30 : 20) * u, rowH * 0.5)} fill={ink} opacity={isWin ? 1 : 0.65}>
                  {lab}
                </text>
                <rect x={bars.x + 70 * u} y={y + rowH * 0.18} width={full} height={rowH * 0.5} rx={4 * u} fill={rgba5(ink, 0.08)} />
                <rect x={bars.x + 70 * u} y={y + rowH * 0.18} width={Math.max(2 * u, full * pv)} height={rowH * 0.5} rx={4 * u} fill={isWin ? rampStops[rampStops.length - 1] : ramp(rampStops, 0.2 + pv * 0.6)} />
                <text x={bars.x + 70 * u + full + 10 * u} y={y + rowH * 0.62} fontFamily={fonts.mono} fontSize={Math.min((portrait ? 28 : 18) * u, rowH * 0.45)} fill={ink} opacity={0.7}>
                  {(pv * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}
        </g>
      </Svg>

      {/* title */}
      <div style={{position: 'absolute', left: portrait ? w * 0.1 : w * 0.1, top: h * 0.055, color: ink, opacity: prog(frame, 0, 16)}}>
        <div style={{fontFamily: fonts.grotesk, fontWeight: 700, fontSize: titleSize, letterSpacing: -1 * u, lineHeight: 1.05}}>{title}</div>
        <div style={{fontFamily: fonts.mono, fontSize: (portrait ? 28 : 17) * u, opacity: 0.55, marginTop: 8 * u}}>{subtitle}</div>
      </div>
      <Vignette strength={0.4} />
    </AbsoluteFill>
  );
};

export const neuralNetLayers = defineMotion<Props>({
  id: 'neural-net-layers',
  title: 'Neural net layers',
  category: 'data',
  description:
    'Columns of neuron circles joined by weighted connections: an activation wave flows layer by layer as glowing pulses (blue to yellow), line widths show the weights, and an output bar chart (softmax) updates; it repeats with fresh inputs.',
  source: ['prompt-corpus: awesome-opus5-5-videos (MIT) — neural network explainers (9 cases), original implementation'],
  useFor: 'AI / machine-learning explainers, ML courses, "how the model decides" beats, product AI-feature launch videos.',
  durationInFrames: 240,
  defaultProps: {
    layers: [5, 7, 7, 4],
    inputs: [],
    labels: ['cat', 'dog', 'bird', 'fish'],
    title: 'How a network decides',
    subtitle: 'forward pass · weights · activations',
    cycle: 80,
    travel: 12,
    showWeights: true,
    seed: 7,
    background: '#0B1020',
    ink: '#DCE4FF',
    ramp: ['#2B5BFF', '#2FD0E0', '#F7E15A'],
    positive: '#5C8DFF',
    negative: '#FF9A4A',
  },
  propDocs: {
    layers: 'neurons per layer, e.g. [5,7,7,4] (2-7 layers, up to 14 each); the last is the output',
    inputs: 'optional input values 0..1 for the first pass (empty = seeded)',
    labels: 'output class names (bar chart rows)',
    title: 'title text',
    subtitle: 'small mono caption under the title',
    cycle: 'frames per forward pass (a new input is fed each pass)',
    travel: 'frames the activation takes to cross one layer (8-12)',
    showWeights: 'line thickness + hue show each weight (false = uniform lines)',
    seed: 'seed for weights and inputs',
    background: 'background colour',
    ink: 'text / outline colour',
    ramp: 'activation colour ramp (low -> high), 2-4 colours',
    positive: 'positive-weight connection colour',
    negative: 'negative-weight connection colour',
  },
  component: NeuralNetLayers,
  tags: ['neural network', 'ai', 'machine learning', 'deep learning', 'layers', 'neurons', 'weights', 'activation', 'forward pass', 'explainer', 'data', 'softmax', 'bar chart', 'perceptron', 'llm', 'model', 'pulses', 'connections', 'synapse'],
});
