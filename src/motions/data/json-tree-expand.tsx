import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  Win,
  bgOf,
  fitMono,
  inOutCubic,
  isDark,
  monoFont,
  outCubic,
  seg,
  syntaxPalette,
  withAlpha,
} from '../../core/dev-explainer-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A JSON viewer: the `data` prop is flattened and expands node by node — each object / array row gets a caret
 * that rotates open with a child-count badge, children slide in under it with indent guides, syntax colours
 * (keys, strings, numbers, booleans, null), a highlighted newest row, auto-scroll for long documents and a
 * path breadcrumb (`$.profile.address.city`) along the bottom.
 */
type Props = {
  data: unknown;
  title: string;
  collapseDepth: number;
  showBreadcrumb: boolean;
  showLineNumbers: boolean;
  every: number;
  speed: number;
  startAt: number;
  background: string;
  panel: string;
  ink: string;
  accent: string;
  fontFamily: string;
};

type Row = {
  depth: number;
  key?: string;
  kind: 'open' | 'close' | 'leaf' | 'collapsed';
  open?: string; // '{' | '['
  value?: unknown;
  comma: boolean;
  count?: number;
  path: string;
};

const flatten = (data: unknown, collapseDepth: number): Row[] => {
  const rows: Row[] = [];
  const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
  const walk = (v: unknown, depth: number, key: string | undefined, comma: boolean, path: string) => {
    if (Array.isArray(v) || isObj(v)) {
      const arr = Array.isArray(v);
      const entries: [string | undefined, unknown, string][] = arr
        ? (v as unknown[]).map((x, i) => [undefined, x, `${path}[${i}]`])
        : Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, x, /^[A-Za-z_]\w*$/.test(k) ? `${path}.${k}` : `${path}["${k}"]`]);
      const open = arr ? '[' : '{';
      if (entries.length === 0) {
        rows.push({depth, key, kind: 'leaf', value: arr ? '[]' : '{}', comma, path, count: 0});
        return;
      }
      if (depth >= collapseDepth) {
        rows.push({depth, key, kind: 'collapsed', open, comma, count: entries.length, path});
        return;
      }
      rows.push({depth, key, kind: 'open', open, comma: false, count: entries.length, path});
      entries.forEach(([k, x, pth], i) => walk(x, depth + 1, k, i < entries.length - 1, pth));
      rows.push({depth, kind: 'close', open, comma, path});
    } else {
      rows.push({depth, key, kind: 'leaf', value: v, comma, path});
    }
  };
  walk(data, 0, undefined, false, '$');
  return rows;
};

const JsonTreeExpand: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = (frame - p.startAt) * Math.max(0.1, p.speed);
  const mono = monoFont(p.fontFamily);
  const dark = isDark(p.panel);
  const pal = syntaxPalette(dark);
  const rows = flatten(p.data, Math.max(1, p.collapseDepth));
  const R = rows.length;
  const every = Math.max(2, p.every);
  const t0 = 18;
  const born = (i: number) => t0 + i * every;

  // geometry
  const winW = portrait ? w * 0.94 : Math.min(w * 0.6, 1180 * u);
  const maxH = h * (portrait ? 0.8 : 0.9);
  const head = 62 * u;
  const pad = 24 * u;
  const crumbH = p.showBreadcrumb ? 66 * u : 0;
  const gutter = p.showLineNumbers ? 4 : 0;
  const indentCh = 2;
  const maxChars = Math.max(
    24,
    ...rows.map((r) => {
      const v = r.kind === 'leaf' ? String(typeof r.value === 'string' ? `"${r.value}"` : r.value) : '{…}';
      return gutter + r.depth * indentCh + 3 + (r.key ? r.key.length + 4 : 0) + v.length + 12;
    }),
  );
  const fs = fitMono(winW - pad * 2, maxH - head - pad * 2 - crumbH, maxChars, Math.min(R, 20) + 0.3, portrait ? 38 * u : 36 * u, 19 * u, 1.5);
  const lh = fs * 1.5;
  const capRows = Math.max(3, Math.floor((maxH - head - pad * 2 - crumbH) / lh));
  const bodyRows = Math.min(R, capRows);
  const winH = Math.min(maxH, head + pad * 2 + bodyRows * lh + crumbH);
  const winX = (w - winW) / 2;
  const winY = (h - winH) / 2;
  const viewH = winH - head - pad * 2 - crumbH;
  const winIn = outCubic(seg(t, 0, 16));

  // live row + scroll
  const live = Math.min(R - 1, Math.max(-1, Math.floor((t - t0) / every)));
  const scrollFor = (i: number) => Math.max(0, (i + 1) * lh - viewH);
  const prev = scrollFor(Math.max(-1, live - 1));
  const cur = scrollFor(live);
  const sk = live >= 0 ? outCubic(seg(t, born(live), born(live) + Math.max(6, every))) : 1;
  const scroll = R * lh > viewH + 1 ? prev + (cur - prev) * sk : 0;

  const numW = gutter * fs * 0.6;
  const indentW = indentCh * fs * 0.6;

  const fmtVal = (v: unknown) => {
    if (typeof v === 'string') return {text: v === '{}' || v === '[]' ? v : `"${v}"`, color: v === '{}' || v === '[]' ? pal.punct : pal.str};
    if (typeof v === 'number') return {text: String(v), color: pal.num};
    if (typeof v === 'boolean') return {text: String(v), color: pal.kw};
    if (v === null) return {text: 'null', color: pal.kw};
    return {text: String(v), color: pal.plain};
  };

  const liveRow = live >= 0 ? rows[live] : undefined;
  const crumb = liveRow ? liveRow.path : '$';
  const crumbParts = crumb.match(/\$|\.[\w$]+|\[[^\]]+\]/g) ?? ['$'];

  return (
    <AbsoluteFill style={{background: bgOf(p.background), overflow: 'hidden'}}>
      <Win x={winX} y={winY} w={winW} h={winH} u={u} title={p.title} panel={p.panel} ink={p.ink} opacity={winIn} dy={(1 - winIn) * 30 * u} fontFamily={mono} headerRight={<span style={{opacity: 0.8}}>{`${Math.max(0, live + 1)}/${R}`}</span>}>
        <div style={{position: 'absolute', left: 0, right: 0, top: pad, height: viewH, overflow: 'hidden'}}>
          <div style={{transform: `translateY(${-scroll}px)`}}>
            {rows.map((r, i) => {
              const b = born(i);
              if (t < b) return <div key={i} style={{height: lh}} />;
              const k = outCubic(seg(t, b, b + 7));
              const isLive = i === live;
              const hl = isLive ? 1 - 0.35 * seg(t, b + every, b + every * 3) : Math.max(0, 1 - seg(t, b, b + every * 4)) * 0;
              // caret for open rows rotates from collapsed (-90deg) to open (0deg)
              const caretK = r.kind === 'open' ? inOutCubic(seg(t, b + 3, b + 3 + Math.max(6, every))) : r.kind === 'collapsed' ? 0 : 1;
              const badge = r.kind === 'open' ? outCubic(seg(t, b + 2, b + 8)) * (1 - seg(t, b + every * 2.5, b + every * 2.5 + 10)) : r.kind === 'collapsed' ? outCubic(seg(t, b + 2, b + 8)) * 0.9 : 0;
              const v = r.kind === 'leaf' ? fmtVal(r.value) : null;
              const closing = r.kind === 'close' ? (r.open === '[' ? ']' : '}') : '';
              return (
                <div key={i} style={{position: 'relative', height: lh, display: 'flex', alignItems: 'center', fontFamily: mono, fontSize: fs, opacity: k, transform: `translateX(${(1 - k) * -18 * u}px)`}}>
                  {isLive ? <div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, background: withAlpha(p.accent, 0.13 * hl)}} /> : null}
                  {isLive ? <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 * u, background: p.accent}} /> : null}
                  <div style={{width: pad, flex: '0 0 auto'}} />
                  {p.showLineNumbers ? <div style={{width: numW, flex: '0 0 auto', textAlign: 'right', paddingRight: fs * 0.7, color: withAlpha(p.ink, isLive ? 0.8 : 0.32), fontSize: fs * 0.82}}>{i + 1}</div> : null}
                  <div style={{position: 'relative', display: 'flex', alignItems: 'center', paddingLeft: r.depth * indentW, whiteSpace: 'pre'}}>
                    {/* indent guides */}
                    {Array.from({length: r.depth}, (_, d) => (
                      <div key={d} style={{position: 'absolute', left: d * indentW + indentW * 0.25, top: 0, bottom: 0, width: 1.5 * u, background: withAlpha(p.ink, 0.1)}} />
                    ))}
                    <div style={{width: fs * 1.05, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      {r.kind === 'open' || r.kind === 'collapsed' ? (
                        <svg width={fs * 0.62} height={fs * 0.62} viewBox="0 0 10 10" style={{transform: `rotate(${(caretK - 1) * 90}deg)`}}>
                          <path d="M2 3 L5 7 L8 3 Z" fill={withAlpha(p.ink, 0.65)} />
                        </svg>
                      ) : null}
                    </div>
                    {r.key !== undefined ? (
                      <>
                        <span style={{color: pal.key}}>{`"${r.key}"`}</span>
                        <span style={{color: pal.punct}}>{': '}</span>
                      </>
                    ) : null}
                    {r.kind === 'open' ? <span style={{color: pal.punct}}>{r.open}</span> : null}
                    {r.kind === 'collapsed' ? <span style={{color: pal.punct}}>{`${r.open}…${r.open === '[' ? ']' : '}'}`}</span> : null}
                    {r.kind === 'close' ? <span style={{color: pal.punct}}>{closing}</span> : null}
                    {v ? <span style={{color: v.color}}>{v.text}</span> : null}
                    {r.comma ? <span style={{color: pal.punct}}>,</span> : null}
                    {badge > 0.01 && r.count !== undefined ? (
                      <span style={{marginLeft: fs * 0.9, fontSize: fs * 0.74, color: withAlpha(p.accent, 0.95), background: withAlpha(p.accent, 0.14), padding: `0 ${fs * 0.4}px`, borderRadius: fs * 0.3, opacity: badge}}>
                        {`${r.count} ${r.open === '[' ? (r.count === 1 ? 'item' : 'items') : r.count === 1 ? 'key' : 'keys'}`}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {p.showBreadcrumb ? (
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: crumbH, borderTop: `${1.5 * u}px solid ${withAlpha(p.ink, 0.12)}`, background: withAlpha(p.ink, dark ? 0.04 : 0.03), display: 'flex', alignItems: 'center', padding: `0 ${pad}px`, fontFamily: mono, fontSize: Math.min(fs * 0.85, 27 * u), whiteSpace: 'nowrap', overflow: 'hidden'}}>
            <span style={{color: withAlpha(p.ink, 0.45), marginRight: 14 * u}}>path</span>
            {crumbParts.map((c, i) => (
              <span key={i} style={{color: i === crumbParts.length - 1 ? p.accent : withAlpha(p.ink, 0.75), fontWeight: i === crumbParts.length - 1 ? 700 : 400}}>
                {c}
              </span>
            ))}
          </div>
        ) : null}
      </Win>
    </AbsoluteFill>
  );
};

export const jsonTreeExpand = defineMotion<Props>({
  id: 'json-tree-expand',
  title: 'JSON tree expand',
  category: 'data',
  description:
    'A JSON viewer built from a data prop: objects and arrays expand node by node with a rotating caret and child-count badge, indent guides, syntax-coloured keys and values, a highlighted newest row, auto-scroll, and a path breadcrumb along the bottom.',
  source: ['original (generic developer explainer)'],
  useFor: 'API-response explainers, "what the data looks like" beats, structured-output / schema stories for AI, developer docs and tutorials, config-file walkthroughs.',
  durationInFrames: 240,
  defaultProps: {
    data: {
      id: 1042,
      name: 'Ada Example',
      active: true,
      roles: ['admin', 'editor'],
      profile: {
        email: 'ada@example.com',
        address: {city: 'Springfield', geo: {lat: 12.34, lng: 56.78}},
      },
      plan: {tier: 'pro', trial: null},
    },
    title: 'response.json',
    collapseDepth: 3,
    showBreadcrumb: true,
    showLineNumbers: true,
    every: 7,
    speed: 1,
    startAt: 0,
    background: '#0B0E14',
    panel: '#12161F',
    ink: '#E6EAF2',
    accent: '#79B8FF',
    fontFamily: '',
  },
  propDocs: {
    data: 'any JSON value (object / array) to expand',
    title: 'file name in the window header',
    collapseDepth: 'nesting depth from which objects stay collapsed as {…} (3 = three levels expand)',
    showBreadcrumb: 'show the $.path breadcrumb of the newest row',
    showLineNumbers: 'show line numbers',
    every: 'frames between rows',
    speed: 'timing multiplier',
    startAt: 'frame the viewer starts',
    background: "page colour or 'transparent'",
    panel: 'window colour (dark or light — syntax colours adapt)',
    ink: 'text colour',
    accent: 'highlight / breadcrumb colour',
    fontFamily: 'monospace font override (empty = JetBrains Mono)',
  },
  component: JsonTreeExpand,
  tags: ['json', 'tree', 'data', 'api', 'response', 'schema', 'structured output', 'viewer', 'developer', 'config', 'syntax', 'expand', 'code', 'software', 'ui'],
});
