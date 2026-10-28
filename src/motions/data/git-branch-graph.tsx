import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {backOut, bgOf, isDark, monoFont, mixHex, onFill, outCubic, seg, sansFont, withAlpha} from '../../core/dev-explainer-kit';
import {defineMotion} from '../../core/types';

/**
 * A git history graph built from `commits` data: commit dots appear in order along a time axis, branches get
 * their own coloured lane, edges draw on, a merge commit joins two lanes, tags flag a commit and a HEAD pill
 * travels to the newest commit while a caption shows its message. Horizontal on 16:9, vertical on 9:16.
 */
type Commit = {id: string; message: string; branch: string; parents?: string[]; tag?: string};
type Props = {
  commits: Commit[];
  colors: string[];
  title: string;
  headLabel: string;
  showMessages: boolean;
  every: number;
  speed: number;
  startAt: number;
  background: string;
  ink: string;
  accent: string;
  fontFamily: string;
};

const GitBranchGraph: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = (frame - p.startAt) * Math.max(0.1, p.speed);
  const mono = monoFont(p.fontFamily);
  const sans = sansFont('');
  const dark = isDark(p.background === 'transparent' ? '#101010' : p.background);
  const commits = p.commits.length ? p.commits : [{id: 'a1b2c3d', message: 'Initial commit', branch: 'main'}];
  const n = commits.length;
  const every = Math.max(4, p.every);
  const t0 = 14;
  const born = (i: number) => t0 + i * every;

  // lanes by first appearance
  const laneNames: string[] = [];
  commits.forEach((c) => {
    if (!laneNames.includes(c.branch)) laneNames.push(c.branch);
  });
  const L = laneNames.length;
  const palette = p.colors.length ? p.colors : [p.accent];
  const laneColor = (l: number) => palette[l % palette.length];

  // geometry (a = along time axis, c = across lanes)
  const a0 = portrait ? 350 * u : 330 * u;
  const a1 = portrait ? h - 360 * u : w - 110 * u;
  const cMin = portrait ? w * 0.16 : h * 0.3;
  const cMax = portrait ? w * 0.84 : h * 0.66;
  const laneGap = L > 1 ? Math.min((portrait ? 230 : 200) * u, (cMax - cMin) / (L - 1)) : 0;
  const cMid = (cMin + cMax) / 2;
  const laneC = (l: number) => cMid + (l - (L - 1) / 2) * laneGap;
  const sp = n > 1 ? (a1 - a0) / (n - 1) : 0;
  const along = (i: number) => (n > 1 ? a0 + sp * i : (a0 + a1) / 2);
  const pt = (a: number, c: number) => (portrait ? {x: c, y: a} : {x: a, y: c});
  const idIndex: Record<string, number> = {};
  commits.forEach((c, i) => (idIndex[c.id] = i));
  const laneOf = commits.map((c) => laneNames.indexOf(c.branch));

  // resolve parents
  const parents: number[][] = commits.map((c, i) => {
    if (c.parents && c.parents.length) return c.parents.map((id) => idIndex[id]).filter((k) => k !== undefined && k < i);
    for (let k = i - 1; k >= 0; k--) if (laneOf[k] === laneOf[i]) return [k];
    return i > 0 ? [i - 1] : [];
  });

  const edgePath = (from: number, to: number, first: boolean) => {
    const A = pt(along(from), laneC(laneOf[from]));
    const B = pt(along(to), laneC(laneOf[to]));
    const a1_ = along(to);
    const a0_ = along(from);
    const c0 = laneC(laneOf[from]);
    const c1 = laneC(laneOf[to]);
    const P = (a: number, c: number) => pt(a, c);
    if (laneOf[from] === laneOf[to]) return `M ${A.x} ${A.y} L ${B.x} ${B.y}`;
    const s = Math.max(sp, 40 * u);
    if (first) {
      // branch-off: curve straight after the parent, then run along the new lane
      const ea = Math.min(a1_, a0_ + s * 0.9);
      const p1 = P(a0_ + s * 0.5, c0);
      const p2 = P(a0_ + s * 0.4, c1);
      const e = P(ea, c1);
      return `M ${A.x} ${A.y} C ${p1.x} ${p1.y} ${p2.x} ${p2.y} ${e.x} ${e.y} L ${B.x} ${B.y}`;
    }
    // merge: run along the branch lane, then curve into the merge commit
    const sa = Math.max(a0_, a1_ - s * 0.9);
    const s0 = P(sa, c0);
    const p1 = P(a1_ - s * 0.5, c0);
    const p2 = P(a1_ - s * 0.4, c1);
    return `M ${A.x} ${A.y} L ${s0.x} ${s0.y} C ${p1.x} ${p1.y} ${p2.x} ${p2.y} ${B.x} ${B.y}`;
  };

  const R = (portrait ? 18 : 19) * u;
  const idFs = (portrait ? 21 : 19) * u;
  const labFs = (portrait ? 28 : 25) * u;
  const nBorn = commits.filter((_, i) => t >= born(i)).length;
  const cur = Math.max(0, nBorn - 1);

  // HEAD position: eases from previous commit to the newest one
  const headK = nBorn >= 1 ? outCubic(seg(t, born(cur) - 6, born(cur) + 4)) : 0;
  const prevI = Math.max(0, cur - 1);
  const headA = along(prevI) + (along(cur) - along(prevI)) * (cur === 0 ? 1 : headK);
  const headC = laneC(laneOf[prevI]) + (laneC(laneOf[cur]) - laneC(laneOf[prevI])) * (cur === 0 ? 1 : headK);
  const headP = pt(headA, headC);
  const headIn = outCubic(seg(t, born(0), born(0) + 10));

  const msgIdx = cur;
  const msgK = outCubic(seg(t, born(msgIdx) + 2, born(msgIdx) + 12));

  return (
    <AbsoluteFill style={{background: bgOf(p.background), overflow: 'hidden'}}>
      <Svg>
        {/* lane guides + names */}
        {laneNames.map((name, l) => {
          const first = commits.findIndex((c) => c.branch === name);
          const k = outCubic(seg(t, born(first) - 10, born(first) + 6));
          const a_s = pt(a0 - sp * 0.4, laneC(l));
          const a_e = pt(a1 + sp * 0.4, laneC(l));
          const col = laneColor(l);
          const lab = portrait ? pt(along(0) - 88 * u, laneC(l)) : pt(40 * u, laneC(l));
          const lw = Math.min(name.length * labFs * 0.6 + 40 * u, portrait ? laneGap - 16 * u : 280 * u);
          return (
            <g key={name}>
              <line x1={a_s.x} y1={a_s.y} x2={a_e.x} y2={a_e.y} stroke={withAlpha(p.ink, 0.08)} strokeWidth={2 * u} strokeDasharray={`${8 * u} ${10 * u}`} />
              <g opacity={k} transform={`translate(${lab.x + (portrait ? -lw / 2 : 0)} ${lab.y - 22 * u + (portrait ? 0 : 0)})`}>
                <rect width={lw} height={44 * u} rx={22 * u} fill={withAlpha(col, 0.18)} stroke={col} strokeWidth={2 * u} />
                <text x={lw / 2} y={29.5 * u} textAnchor="middle" fontFamily={mono} fontSize={Math.min(labFs * 0.82, (lw - 24 * u) / Math.max(1, name.length * 0.6))} fill={dark ? mixHex(col, '#FFFFFF', 0.4) : mixHex(col, '#000000', 0.35)} fontWeight={700}>
                  {name}
                </text>
              </g>
            </g>
          );
        })}
        {/* edges */}
        {commits.map((c, i) =>
          parents[i].map((pi, j) => {
            const k = outCubic(seg(t, born(i) - 8, born(i) + 3));
            if (k <= 0) return null;
            const first = j === 0;
            const colLane = first || laneOf[pi] === laneOf[i] ? laneOf[i] : laneOf[pi];
            return (
              <path key={`${i}-${j}`} d={edgePath(pi, i, first)} fill="none" stroke={laneColor(colLane)} strokeWidth={6 * u} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} />
            );
          }),
        )}
        {/* commits */}
        {commits.map((c, i) => {
          const k = backOut(seg(t, born(i) + 1, born(i) + 11), 2);
          if (k <= 0) return null;
          const pos = pt(along(i), laneC(laneOf[i]));
          const col = laneColor(laneOf[i]);
          const merge = parents[i].length > 1;
          const idK = outCubic(seg(t, born(i) + 6, born(i) + 16));
          const up = laneOf[i] === 0;
          const labelAt = portrait ? {x: pos.x + R + 16 * u, y: pos.y + idFs * 0.35, anchor: 'start' as const} : {x: pos.x, y: up ? pos.y - R - 18 * u : pos.y + R + 36 * u, anchor: 'middle' as const};
          const tagAt = portrait ? {x: labelAt.x, y: labelAt.y + 38 * u} : {x: pos.x, y: up ? labelAt.y - 44 * u : labelAt.y + 46 * u};
          const tagK = outCubic(seg(t, born(i) + 10, born(i) + 22));
          const tagW = c.tag ? c.tag.length * labFs * 0.6 + 34 * u : 0;
          return (
            <g key={c.id + i}>
              <g transform={`translate(${pos.x} ${pos.y}) scale(${k})`}>
                <circle r={R + 7 * u} fill={withAlpha(col, 0.22)} />
                <circle r={R} fill={merge ? p.background === 'transparent' ? '#101014' : p.background : col} stroke={col} strokeWidth={merge ? 5 * u : 0} />
                {merge ? <circle r={R * 0.38} fill={col} /> : null}
              </g>
              <text x={labelAt.x} y={labelAt.y} textAnchor={labelAt.anchor} fontFamily={mono} fontSize={idFs} fill={withAlpha(p.ink, 0.62)} opacity={idK} fontWeight={600}>
                {c.id}
              </text>
              {c.tag ? (
                <g opacity={tagK} transform={`translate(${tagAt.x + (portrait ? 0 : -tagW / 2)} ${tagAt.y - 20 * u}) scale(${0.85 + 0.15 * tagK})`}>
                  <rect width={tagW} height={36 * u} rx={8 * u} fill={p.accent} />
                  <text x={tagW / 2} y={25 * u} textAnchor="middle" fontFamily={mono} fontSize={labFs * 0.8} fontWeight={700} fill={onFill(p.accent)}>
                    {c.tag}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
        {/* HEAD pill */}
        {nBorn > 0 ? (() => {
          const below = !portrait && laneOf[cur] === 0;
          const hw = p.headLabel.length * labFs * 0.62 + 36 * u;
          const hx = portrait ? -hw : -hw / 2;
          const hy = portrait ? -18 * u : below ? 8 * u : -44 * u;
          const tx = headP.x + (portrait ? -R - 18 * u : 0);
          const ty = headP.y + (portrait ? 0 : below ? R + 18 * u : -R - 18 * u);
          return (
            <g opacity={headIn} transform={`translate(${tx} ${ty})`}>
              <rect x={hx} y={hy} width={hw} height={36 * u} rx={18 * u} fill={p.ink} />
              <text x={hx + hw / 2} y={hy + 25 * u} textAnchor="middle" fontFamily={mono} fontSize={labFs * 0.8} fontWeight={700} fill={isDark(p.ink) ? '#FFFFFF' : '#10131A'}>
                {p.headLabel}
              </text>
              {portrait ? (
                <path d={`M 0 ${-6 * u} L ${10 * u} 0 L 0 ${6 * u} Z`} fill={p.ink} />
              ) : below ? (
                <path d={`M ${-6 * u} ${hy + 1} L 0 ${hy - 10 * u} L ${6 * u} ${hy + 1} Z`} fill={p.ink} />
              ) : (
                <path d={`M ${-6 * u} ${hy + 36 * u} L 0 ${hy + 46 * u} L ${6 * u} ${hy + 36 * u} Z`} fill={p.ink} />
              )}
            </g>
          );
        })() : null}
      </Svg>
      {/* title */}
      {p.title ? (
        <div style={{position: 'absolute', left: portrait ? 0 : 60 * u, right: portrait ? 0 : undefined, top: (portrait ? 110 : 70) * u, textAlign: portrait ? 'center' : 'left', fontFamily: sans, fontWeight: 800, fontSize: (portrait ? 54 : 52) * u, color: p.ink, opacity: outCubic(seg(t, 0, 14))}}>
          {p.title}
        </div>
      ) : null}
      {/* latest commit message */}
      {p.showMessages ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: (portrait ? 170 : 110) * u,
            display: 'flex',
            justifyContent: 'center',
            opacity: msgK,
            transform: `translateY(${(1 - msgK) * 16 * u}px)`,
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 16 * u, padding: `${14 * u}px ${28 * u}px`, borderRadius: 18 * u, background: withAlpha(p.ink, dark ? 0.08 : 0.06), border: `${1.5 * u}px solid ${withAlpha(p.ink, 0.14)}`, maxWidth: w * 0.9}}>
            <span style={{width: 14 * u, height: 14 * u, borderRadius: '50%', background: laneColor(laneOf[msgIdx])}} />
            <span style={{fontFamily: mono, fontSize: 24 * u, color: withAlpha(p.ink, 0.55), fontWeight: 700}}>{commits[msgIdx].id}</span>
            <span style={{fontFamily: sans, fontSize: (portrait ? 32 : 30) * u, fontWeight: 600, color: p.ink}}>{commits[msgIdx].message}</span>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const gitBranchGraph = defineMotion<Props>({
  id: 'git-branch-graph',
  title: 'Git branch graph',
  category: 'data',
  description:
    'A git history graph from commit data: dots appear in order along a time axis, branches take coloured lanes, edges draw on, a merge commit joins two lanes, tags flag a commit, a HEAD pill travels to the newest commit and a caption shows its message.',
  source: ['original (generic developer explainer)'],
  useFor: 'Explaining branching and merging, release flow, pull-request workflows, version-control tutorials, "how our team ships" and developer-tool promos.',
  durationInFrames: 240,
  defaultProps: {
    commits: [
      {id: 'a1f3c9e', message: 'Initial commit', branch: 'main'},
      {id: 'b72d41a', message: 'Add project skeleton', branch: 'main'},
      {id: 'c09e5bd', message: 'Set up CI checks', branch: 'main'},
      {id: 'd4412f0', message: 'Start login page', branch: 'feature/login', parents: ['c09e5bd']},
      {id: 'e81aa73', message: 'Patch security header', branch: 'main', parents: ['c09e5bd']},
      {id: 'f2c7b19', message: 'Add login form', branch: 'feature/login'},
      {id: '19ab44c', message: 'Fix typo in README', branch: 'fix/typo', parents: ['e81aa73']},
      {id: '2ad5e60', message: 'Validate credentials', branch: 'feature/login'},
      {id: '3b7f812', message: 'Merge fix/typo', branch: 'main', parents: ['e81aa73', '19ab44c']},
      {id: '4c9a0d5', message: 'Add login tests', branch: 'feature/login'},
      {id: '5de2147', message: 'Merge feature/login', branch: 'main', parents: ['3b7f812', '4c9a0d5'], tag: 'v1.0'},
      {id: '6f03bb8', message: 'Bump version', branch: 'main'},
    ],
    colors: ['#4C8DFF', '#F5A524', '#2EC4A6', '#C77DFF', '#FF6B8B', '#8BD450'],
    title: 'Branch, build, merge',
    headLabel: 'HEAD',
    showMessages: true,
    every: 15,
    speed: 1,
    startAt: 0,
    background: '#0C0F16',
    ink: '#EAEFF8',
    accent: '#FF5C7A',
    fontFamily: '',
  },
  propDocs: {
    commits: "commits oldest → newest [{id, message, branch, parents?: ids (default: previous commit on the same branch; list 2 ids for a merge), tag?}]",
    colors: 'lane colours, one per branch in order of first appearance',
    title: 'heading (empty = none)',
    headLabel: 'text of the pointer on the newest commit',
    showMessages: 'show the newest commit message as a caption',
    every: 'frames between commits',
    speed: 'timing multiplier',
    startAt: 'frame the graph starts',
    background: "page colour or 'transparent'",
    ink: 'text / HEAD colour',
    accent: 'tag colour',
    fontFamily: 'monospace font override (empty = JetBrains Mono)',
  },
  component: GitBranchGraph,
  tags: ['git', 'branch', 'merge', 'commit', 'version control', 'github', 'developer', 'release', 'pull request', 'graph', 'software', 'devops', 'workflow', 'code'],
});
