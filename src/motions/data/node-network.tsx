import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {n2} from '../../core/random';
import {FilmGrain, Svg, useStage, Vignette} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {buildGraph, mixHex5, rgba5, shortestPath} from '../../core/r2-pr5-kit';

/**
 * Node network: a force-laid graph grows — nodes pop in, links draw between them, clusters brighten, and the
 * counters tick as connections grow faster than nodes (network effect). The layout is a seeded Fruchterman-Reingold
 * relaxation computed once per prop set; frames only reveal it. At the end a shortest path between two members
 * lights up hop by hop.
 */

type Props = {
  count: number;
  clusters: number;
  seed: number;
  growthCurve: 'linear' | 'quadratic' | 'exponential';
  highlightPath: boolean;
  nodesLabel: string;
  linksLabel: string;
  potentialLabel: string;
  title: string;
  background: string;
  ink: string;
  colors: string[];
  linkColor: string;
  accent: string;
  drift: number;
};

const curve = (t: number, kind: Props['growthCurve']) => (kind === 'linear' ? t : kind === 'exponential' ? (Math.pow(24, t) - 1) / 23 : t * t);

const NodeNetwork: React.FC<Props> = ({count, clusters, seed, growthCurve, highlightPath, nodesLabel, linksLabel, potentialLabel, title, background, ink, colors, linkColor, accent, drift}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames} = useStage();
  const mx = (portrait ? 0.1 : 0.1) * w;
  const top = (portrait ? 0.22 : 0.2) * h;
  const bw = w - mx * 2;
  const bh = h - top - (portrait ? 0.1 : 0.1) * h;
  const g = React.useMemo(() => buildGraph(count, clusters, seed, bw / bh), [count, clusters, seed, bw, bh]);
  const n = g.nodes.length;

  const growEnd = durationInFrames * (highlightPath ? 0.66 : 0.9);
  const tg = prog(frame, 6, growEnd, ease.sine);
  const shown = curve(tg, growthCurve) * n; // continuous node count
  const nShown = Math.floor(shown);
  const linkCount = g.links.reduce((s, [a, b]) => s + (Math.max(a, b) < shown ? 1 : 0), 0);
  const potential = Math.max(0, (nShown * (nShown - 1)) / 2);

  // slow camera breathing: zoom + tiny rotation
  const zoom = 1 + 0.05 * prog(frame, 0, durationInFrames, ease.linear);
  const camX = n2(`${seed}:cam`, frame * 0.01, 0) * 8 * u * drift;
  const camY = n2(`${seed}:cam`, 0, frame * 0.01) * 8 * u * drift;
  const px = (i: number) => w / 2 + camX + (g.nodes[i].x * bw) / 2 * zoom + n2(`${seed}:dx${i}`, frame * 0.012, 0) * 6 * u * drift;
  const py = (i: number) => top + bh / 2 + camY + (g.nodes[i].y * bh) / 2 * zoom + n2(`${seed}:dy${i}`, 0, frame * 0.012) * 6 * u * drift;

  // highlight path between the first node of cluster 0 and a late node of the last cluster
  const path = React.useMemo(() => {
    if (!highlightPath) return [] as number[];
    const last = g.nodes.map((nd, i) => ({nd, i})).filter(({nd}) => nd.cluster === (clusters > 1 ? clusters - 1 : 0));
    const to = last.length ? last[last.length - 1].i : n - 1;
    return shortestPath(n, g.links, 0, to === 0 ? n - 1 : to);
  }, [highlightPath, g, clusters, n]);
  const pathStart = growEnd + 6;
  const hop = 11;
  const pathLit = path.length > 1 ? clamp((frame - pathStart) / (hop * (path.length - 1))) : 0;
  const onPath = new Set(path);

  const nodeR = (i: number) => (0.0062 + Math.min(0.0075, g.nodes[i].deg * 0.0012)) * Math.min(w, h) * 1.4;

  return (
    <AbsoluteFill style={{background}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 60% at 50% 55%, ${rgba5(colors[0], 0.13)}, transparent 70%)`}} />
      <Svg>
        <defs>
          <filter id="nwk-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation={6 * u} />
          </filter>
        </defs>
        {/* links */}
        {g.links.map(([a, b], k) => {
          const born = Math.max(a, b);
          if (born > shown) return null;
          const draw = clamp((shown - born) / 1.4);
          const ca = colors[g.nodes[a].cluster % colors.length];
          const cb = colors[g.nodes[b].cluster % colors.length];
          const same = g.nodes[a].cluster === g.nodes[b].cluster;
          const x1 = px(b);
          const y1 = py(b);
          const x2 = px(a);
          const y2 = py(a);
          return <line key={k} x1={x1} y1={y1} x2={x1 + (x2 - x1) * ease.out(draw)} y2={y1 + (y2 - y1) * ease.out(draw)} stroke={same ? rgba5(mixHex5(ca, linkColor, 0.4), 0.5) : rgba5(mixHex5(ca, cb, 0.5), 0.3)} strokeWidth={(same ? 1.6 : 1.1) * u} strokeLinecap="round" />;
        })}
        {/* highlight path */}
        {path.length > 1
          ? path.slice(0, -1).map((a, k) => {
              const seg = clamp(pathLit * (path.length - 1) - k);
              if (seg <= 0) return null;
              const b = path[k + 1];
              const x2 = px(a) + (px(b) - px(a)) * seg;
              const y2 = py(a) + (py(b) - py(a)) * seg;
              return (
                <g key={`p${k}`}>
                  <line x1={px(a)} y1={py(a)} x2={x2} y2={y2} stroke={accent} strokeWidth={9 * u} opacity={0.35} filter="url(#nwk-glow)" strokeLinecap="round" />
                  <line x1={px(a)} y1={py(a)} x2={x2} y2={y2} stroke={accent} strokeWidth={3.4 * u} strokeLinecap="round" />
                </g>
              );
            })
          : null}
        {/* nodes */}
        {g.nodes.map((nd, i) => {
          if (i > shown) return null;
          const age = shown - i;
          const pop = clamp(age / 1.2);
          const sc = pop < 1 ? 0.2 + 0.8 * ease.back(pop) : 1;
          const flash = Math.max(0, 1 - age / 3.2); // newborn glow
          const c = colors[nd.cluster % colors.length];
          const pathHot = frame >= pathStart && onPath.has(i) && pathLit * (path.length - 1) >= path.indexOf(i) - 0.05;
          const r = nodeR(i) * sc;
          const core = pathHot ? accent : c;
          const bright = 0.7 + 0.3 * clamp(nd.deg / 6);
          return (
            <g key={i}>
              <circle cx={px(i)} cy={py(i)} r={r * (2.8 + flash * 2.4)} fill={core} opacity={(0.1 + 0.28 * flash + (pathHot ? 0.28 : 0)) * bright} filter="url(#nwk-glow)" />
              <circle cx={px(i)} cy={py(i)} r={r} fill={mixHex5(core, '#ffffff', 0.12 + 0.35 * flash)} />
            </g>
          );
        })}
      </Svg>

      {/* title + counters */}
      <div style={{position: 'absolute', left: mx, top: h * 0.055, color: ink, opacity: prog(frame, 0, 16)}}>
        <div style={{fontFamily: fonts.grotesk, fontWeight: 700, fontSize: (portrait ? 56 : 48) * u, letterSpacing: -1 * u, lineHeight: 1.05}}>{title}</div>
      </div>
      <div style={{position: 'absolute', right: mx, top: h * 0.06, display: 'flex', gap: (portrait ? 24 : 40) * u, flexDirection: portrait ? 'column' : 'row', textAlign: 'right', color: ink, opacity: prog(frame, 4, 20)}}>
        {[
          {label: nodesLabel, v: nShown, c: colors[0]},
          {label: linksLabel, v: linkCount, c: colors[1 % colors.length]},
          {label: potentialLabel, v: potential, c: accent},
        ].map((c, i) => (
          <div key={i} style={{minWidth: 110 * u}}>
            <div style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: (portrait ? 34 : 40) * u, color: c.c, fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>{c.v.toLocaleString('en-US')}</div>
            <div style={{fontFamily: fonts.mono, fontSize: 13 * u, letterSpacing: 2 * u, opacity: 0.55, marginTop: 6 * u}}>{c.label.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <Vignette strength={0.45} />
      <FilmGrain opacity={0.04} />
    </AbsoluteFill>
  );
};

export const nodeNetwork = defineMotion<Props>({
  id: 'node-network',
  title: 'Node network',
  category: 'data',
  description:
    'A force-laid community graph grows: nodes pop in and glow, links draw between them, clusters take their colours, and counters tick as connections outgrow members (network effect); a shortest path then lights up hop by hop.',
  source: ['prompt-corpus: awesome-opus5-5-videos (MIT) — network-effect / knowledge-graph cases (5), original implementation'],
  useFor: 'Network effects, communities, knowledge graphs, AI agents, social-proof and "everything connects" beats.',
  durationInFrames: 240,
  defaultProps: {
    count: 64,
    clusters: 4,
    seed: 11,
    growthCurve: 'quadratic',
    highlightPath: true,
    nodesLabel: 'members',
    linksLabel: 'connections',
    potentialLabel: 'possible links',
    title: 'The network effect',
    background: '#0A0F1E',
    ink: '#E3E9FF',
    colors: ['#4F8BFF', '#31D0C0', '#B07CFF', '#FF8FB1'],
    linkColor: '#8FA4D8',
    accent: '#FFD84D',
    drift: 1,
  },
  propDocs: {
    count: 'number of nodes (20-140)',
    clusters: 'number of communities (colours)',
    seed: 'seed for the graph and its layout',
    growthCurve: 'linear | quadratic | exponential — how quickly nodes arrive over time',
    highlightPath: 'light up a shortest path between two members at the end',
    nodesLabel: 'label under the node counter',
    linksLabel: 'label under the link counter',
    potentialLabel: 'label under the n(n-1)/2 counter',
    title: 'title text',
    background: 'background colour',
    ink: 'text colour',
    colors: 'cluster colours (cycled)',
    linkColor: 'tint of the links inside a cluster',
    accent: 'highlight-path and potential-links colour',
    drift: 'strength of the slow positional drift (0 = static)',
  },
  component: NodeNetwork,
  tags: ['network', 'graph', 'nodes', 'links', 'force layout', 'community', 'network effect', 'social', 'knowledge graph', 'agents', 'connections', 'clusters', 'counter', 'growth', 'viral', 'data'],
});
