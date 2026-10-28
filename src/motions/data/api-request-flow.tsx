import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {
  backOut,
  bgOf,
  inOutCubic,
  isDark,
  mixHex,
  monoFont,
  onFill,
  outCubic,
  sansFont,
  seg,
  withAlpha,
} from '../../core/dev-explainer-kit';
import {defineMotion} from '../../core/types';

/**
 * An API round trip: nodes (client, server, database…) in a row; request packets carrying a label travel
 * between them, responses return in a second colour, each arrival pulses the node and pops an HTTP status
 * badge (green 2xx, red 4xx/5xx with a shake), and a call log fills in underneath.
 */
type NodeDef = {label: string; kind?: string; sub?: string};
type Step = {from: number; to: number; label: string; status?: number; statusText?: string; ms?: number; type?: 'request' | 'response'};
type Props = {
  nodes: NodeDef[];
  steps: Step[];
  title: string;
  showLog: boolean;
  stepFrames: number;
  speed: number;
  startAt: number;
  background: string;
  panel: string;
  ink: string;
  accent: string;
  accent2: string;
  okColor: string;
  errColor: string;
  fontFamily: string;
};

const Icon: React.FC<{kind: string; s: number; color: string; bg: string; tick: number}> = ({kind, s, color, bg, tick}) => {
  const sw = s * 0.06;
  const common = {fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  const k = kind.toLowerCase();
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" style={{display: 'block', overflow: 'visible'}}>
      {k === 'client' || k === 'browser' || k === 'app' ? (
        <g {...common} strokeWidth={5}>
          <rect x={12} y={18} width={76} height={50} rx={6} />
          <path d="M38 82 H62 M50 68 V82" />
          <path d="M24 34 H50 M24 46 H40" opacity={0.6} />
        </g>
      ) : k === 'database' || k === 'db' ? (
        <g {...common} strokeWidth={5}>
          <ellipse cx={50} cy={24} rx={32} ry={11} />
          <path d="M18 24 V74 C18 82 32 87 50 87 C68 87 82 82 82 74 V24" />
          <path d="M18 49 C18 57 32 62 50 62 C68 62 82 57 82 49" />
        </g>
      ) : k === 'cache' ? (
        <g {...common} strokeWidth={5}>
          <rect x={16} y={16} width={68} height={68} rx={10} />
          <path d="M54 26 L36 54 H50 L44 76 L66 44 H52 Z" fill={color} />
        </g>
      ) : k === 'queue' ? (
        <g {...common} strokeWidth={5}>
          <rect x={14} y={24} width={72} height={14} rx={4} />
          <rect x={14} y={43} width={50} height={14} rx={4} />
          <rect x={14} y={62} width={62} height={14} rx={4} />
          <path d="M74 50 H90 M84 44 L90 50 L84 56" />
        </g>
      ) : k === 'service' || k === 'api' || k === 'gateway' ? (
        <g {...common} strokeWidth={5}>
          <path d="M50 12 L84 31 V69 L50 88 L16 69 V31 Z" />
          <circle cx={50} cy={50} r={11} />
        </g>
      ) : (
        // server (default)
        <g {...common} strokeWidth={5}>
          <rect x={14} y={14} width={72} height={30} rx={6} />
          <rect x={14} y={54} width={72} height={30} rx={6} />
          <circle cx={30} cy={29} r={3.5} fill={color} />
          <circle cx={30} cy={69} r={3.5} fill={color} />
          <path d="M48 29 H74 M48 69 H74" opacity={0.6} />
          <circle cx={74} cy={29} r={3.5} fill={tick % 2 ? color : bg} stroke="none" />
        </g>
      )}
    </svg>
  );
};

const ApiRequestFlow: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = (frame - p.startAt) * Math.max(0.1, p.speed);
  const mono = monoFont(p.fontFamily);
  const sans = sansFont('');
  const dark = isDark(p.background === 'transparent' ? '#101010' : p.background);
  const nodes = p.nodes.length >= 2 ? p.nodes : [{label: 'Client', kind: 'client'}, {label: 'Server', kind: 'server'}];
  const N = nodes.length;
  const sf = Math.max(20, p.stepFrames);
  const T0 = 22;
  const stepStart = (i: number) => T0 + i * sf;
  const travelEnd = (i: number) => stepStart(i) + sf * 0.62;
  const steps = p.steps.filter((s) => s.from >= 0 && s.from < N && s.to >= 0 && s.to < N && s.from !== s.to);

  // geometry
  const nodeW = (portrait ? 420 : 310) * u;
  const nodeH = (portrait ? 240 : 260) * u;
  const logRows = Math.max(1, Math.min(portrait ? 6 : 4, p.steps.length));
  const logH = p.showLog ? logRows * (portrait ? 62 : 58) * u + 28 * u + 40 * u : 0;
  const titleH = p.title ? (portrait ? 190 : 150) * u : 0;
  const areaTop = titleH + (portrait ? 70 : 40) * u;
  const areaBot = h - logH - (portrait ? 60 : 40) * u;
  const nodePos = (i: number) => {
    if (portrait) {
      const y0 = areaTop + nodeH / 2;
      const y1 = areaBot - nodeH / 2;
      return {x: w / 2, y: N > 1 ? y0 + ((y1 - y0) * i) / (N - 1) : (y0 + y1) / 2};
    }
    const x0 = Math.max(w * 0.14, nodeW / 2 + 60 * u);
    const x1 = w - x0;
    const cyl = (areaTop + areaBot) / 2 - 10 * u;
    return {x: x0 + ((x1 - x0) * i) / (N - 1), y: cyl};
  };
  const edgeStart = (a: number, b: number) => {
    const A = nodePos(a);
    const B = nodePos(b);
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const len = Math.hypot(dx, dy) || 1;
    const off = portrait ? nodeH / 2 + 8 * u : nodeW / 2 + 8 * u;
    const ux = dx / len;
    const uy = dy / len;
    return {sx: A.x + ux * off, sy: A.y + uy * off, ex: B.x - ux * off, ey: B.y - uy * off};
  };

  // node state from steps
  const isErr = (s: Step) => (s.status ?? 0) >= 400;
  const nodeState = nodes.map((_, ni) => {
    let pulse = 0;
    let shake = 0;
    let err = false;
    steps.forEach((s, si) => {
      if (s.to !== ni) return;
      const k = seg(t, travelEnd(si), travelEnd(si) + 14);
      if (k > 0 && k < 1) pulse = Math.max(pulse, Math.sin(k * Math.PI));
      if (isErr(s)) {
        if (k > 0 && k < 1) shake = Math.max(shake, (1 - k) * Math.sin(k * 38));
        if (t >= travelEnd(si)) err = true;
      }
    });
    return {pulse, shake, err};
  });

  const arrowColor = (s: Step) => ((s.type ?? (s.from > s.to ? 'response' : 'request')) === 'response' ? p.accent2 : p.accent);

  const fs = (portrait ? 29 : 25) * u;
  const nIn = outCubic(seg(t, 0, 16));

  // log rows: completed steps (last 5)
  const done = steps.map((s, i) => ({s, i})).filter((x) => t >= travelEnd(x.i) + 2);
  const maxRows = portrait ? 6 : 4;
  const shown = done.slice(-maxRows);
  const rowH = (portrait ? 62 : 58) * u;

  const statusColor = (s: Step) => ((s.status ?? 200) >= 500 ? p.errColor : (s.status ?? 200) >= 400 ? '#F5A524' : p.okColor);

  return (
    <AbsoluteFill style={{background: bgOf(p.background), overflow: 'hidden'}}>
      {p.title ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: (portrait ? 110 : 64) * u, textAlign: 'center', fontFamily: sans, fontWeight: 800, fontSize: (portrait ? 56 : 52) * u, color: p.ink, opacity: nIn}}>{p.title}</div>
      ) : null}
      <Svg>
        {/* tracks */}
        {nodes.slice(0, -1).map((_, i) => {
          const e = edgeStart(i, i + 1);
          return <line key={i} x1={e.sx} y1={e.sy} x2={e.ex} y2={e.ey} stroke={withAlpha(p.ink, 0.16)} strokeWidth={3 * u} strokeDasharray={`${3 * u} ${12 * u}`} strokeLinecap="round" opacity={nIn} />;
        })}
      </Svg>
      {/* nodes */}
      {nodes.map((nd, i) => {
        const pos = nodePos(i);
        const st = nodeState[i];
        const inK = backOut(seg(t, 2 + i * 4, 14 + i * 4), 1.8);
        const col = st.err ? p.errColor : p.accent;
        const ring = st.pulse;
        // status badge: latest completed step arriving here with a status
        let badge: {s: Step; at: number} | null = null;
        steps.forEach((s, si) => {
          if (s.to === i && s.status && t >= travelEnd(si)) badge = {s, at: travelEnd(si)};
        });
        const b = badge as {s: Step; at: number} | null;
        const bk = b ? backOut(seg(t, b.at, b.at + 10), 2.4) : 0;
        return (
          <div key={i} style={{position: 'absolute', left: pos.x - nodeW / 2 + st.shake * 14 * u, top: pos.y - nodeH / 2, width: nodeW, height: nodeH, opacity: Math.min(1, inK), transform: `scale(${(0.8 + 0.2 * inK) * (1 + ring * 0.05)})`}}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 26 * u,
                background: p.panel,
                border: `${3 * u}px solid ${withAlpha(col, 0.35 + ring * 0.65)}`,
                boxShadow: `0 ${18 * u}px ${46 * u}px ${withAlpha('#000000', dark ? 0.4 : 0.13)}, 0 0 ${ring * 46 * u}px ${withAlpha(col, 0.5)}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10 * u,
              }}
            >
              <Icon kind={nd.kind ?? (i === 0 ? 'client' : i === N - 1 && N > 2 ? 'database' : 'server')} s={(portrait ? 112 : 108) * u} color={col} bg={p.panel} tick={Math.floor(frame / 10)} />
              <div style={{fontFamily: sans, fontWeight: 800, fontSize: (portrait ? 44 : 40) * u, color: p.ink}}>{nd.label}</div>
              {nd.sub ? <div style={{fontFamily: mono, fontSize: 23 * u, color: withAlpha(p.ink, 0.5), marginTop: -2 * u}}>{nd.sub}</div> : null}
            </div>
            {b ? (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: -34 * u,
                  transform: `translateX(-50%) scale(${bk})`,
                  padding: `${7 * u}px ${18 * u}px`,
                  borderRadius: 999,
                  background: statusColor(b.s),
                  color: onFill(statusColor(b.s)),
                  fontFamily: mono,
                  fontWeight: 700,
                  fontSize: 24 * u,
                  whiteSpace: 'nowrap',
                  boxShadow: `0 ${6 * u}px ${18 * u}px ${withAlpha(statusColor(b.s), 0.45)}`,
                }}
              >
                {`${b.s.status}${b.s.statusText ? ' ' + b.s.statusText : ''}`}
              </div>
            ) : null}
          </div>
        );
      })}
      <Svg>
        {/* packets */}
        {steps.map((s, si) => {
          const k = seg(t, stepStart(si), travelEnd(si));
          if (k <= 0 || t > travelEnd(si) + 6) return null;
          const e = edgeStart(s.from, s.to);
          const kk = inOutCubic(k);
          const x = e.sx + (e.ex - e.sx) * kk;
          const y = e.sy + (e.ey - e.sy) * kk;
          const col = arrowColor(s);
          const resp = col === p.accent2;
          const fade = 1 - seg(t, travelEnd(si), travelEnd(si) + 6);
          const label = s.label;
          const pw = label.length * fs * 0.6 + 56 * u;
          const ph = 52 * u;
          const grow = backOut(seg(t, stepStart(si), stepStart(si) + 8), 2);
          const textCol = resp ? mixHex(col, dark ? '#FFFFFF' : '#000000', dark ? 0.5 : 0.45) : onFill(col);
          const off = portrait ? 0 : -(ph / 2 + 26 * u);
          return (
            <g key={si} opacity={fade} transform={`translate(${x} ${y + off}) scale(${grow})`}>
              <rect x={-pw / 2} y={-ph / 2} width={pw} height={ph} rx={ph / 2} fill={resp ? withAlpha(col, 0.2) : col} stroke={col} strokeWidth={2.5 * u} />
              <text x={0} y={fs * 0.35} textAnchor="middle" fontFamily={mono} fontWeight={700} fontSize={fs} fill={textCol}>
                {label}
              </text>
              <path d={portrait ? '' : `M ${-8 * u} ${ph / 2 - 1} L 0 ${ph / 2 + 12 * u} L ${8 * u} ${ph / 2 - 1} Z`} fill={col} />
            </g>
          );
        })}
        {/* packet dots on the line */}
        {steps.map((s, si) => {
          const k = seg(t, stepStart(si), travelEnd(si));
          if (portrait || k <= 0 || t > travelEnd(si) + 4) return null;
          const e = edgeStart(s.from, s.to);
          const kk = inOutCubic(k);
          const col = arrowColor(s);
          return <circle key={si} cx={e.sx + (e.ex - e.sx) * kk} cy={e.sy + (e.ey - e.sy) * kk} r={11 * u} fill={col} stroke={withAlpha('#FFFFFF', 0.85)} strokeWidth={3 * u} opacity={1 - seg(t, travelEnd(si), travelEnd(si) + 4)} />;
        })}
      </Svg>
      {/* call log */}
      {p.showLog ? (
        <div
          style={{
            position: 'absolute',
            left: portrait ? w * 0.05 : (w - Math.min(w * 0.7, 1300 * u)) / 2,
            width: portrait ? w * 0.9 : Math.min(w * 0.7, 1300 * u),
            bottom: (portrait ? 70 : 44) * u,
            height: logH - 40 * u,
            borderRadius: 20 * u,
            background: withAlpha(p.ink, dark ? 0.06 : 0.05),
            border: `${1.5 * u}px solid ${withAlpha(p.ink, 0.12)}`,
            padding: `${14 * u}px ${24 * u}px`,
            fontFamily: mono,
            opacity: nIn,
            overflow: 'hidden',
          }}
        >
          {shown.map(({s, i}, idx) => {
            const k = outCubic(seg(t, travelEnd(i) + 2, travelEnd(i) + 12));
            const col = arrowColor(s);
            const hasStatus = s.status !== undefined;
            return (
              <div key={i} style={{height: rowH, display: 'flex', alignItems: 'center', gap: 16 * u, opacity: k * (idx === shown.length - 1 ? 1 : 0.85), transform: `translateY(${(1 - k) * 12 * u}px)`, fontSize: (portrait ? 28 : 28) * u, color: p.ink, whiteSpace: 'nowrap'}}>
                <span style={{color: col, fontWeight: 800, width: 28 * u}}>{col === p.accent2 ? '←' : '→'}</span>
                <span style={{color: withAlpha(p.ink, 0.5), minWidth: portrait ? 0 : 250 * u, display: portrait ? 'none' : 'inline-block'}}>{`${nodes[s.from].label} → ${nodes[s.to].label}`}</span>
                <span style={{fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', flex: 1}}>{s.label}</span>
                {hasStatus ? <span style={{color: statusColor(s), fontWeight: 700}}>{`${s.status}${s.statusText ? ' ' + s.statusText : ''}`}</span> : null}
                {s.ms !== undefined ? <span style={{color: withAlpha(p.ink, 0.5), width: 140 * u, textAlign: 'right'}}>{`${s.ms} ms`}</span> : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const apiRequestFlow = defineMotion<Props>({
  id: 'api-request-flow',
  title: 'API request flow',
  category: 'data',
  description:
    'A request / response round trip: client, server and database nodes in a row; labelled request packets travel between them, responses come back in a second colour, each arrival pulses the node and pops an HTTP status badge, and a call log fills in underneath.',
  source: ['original (generic developer explainer)'],
  useFor: 'Explaining how an API call works, backend architecture, REST / HTTP basics, error-handling stories (a 500 shakes the node), latency and developer-docs videos.',
  durationInFrames: 240,
  defaultProps: {
    nodes: [
      {label: 'Client', kind: 'client', sub: 'web app'},
      {label: 'API server', kind: 'server', sub: 'api.example.com'},
      {label: 'Database', kind: 'database', sub: 'orders'},
    ],
    steps: [
      {from: 0, to: 1, label: 'POST /orders'},
      {from: 1, to: 2, label: 'INSERT order'},
      {from: 2, to: 1, label: '1 row saved', ms: 12},
      {from: 1, to: 0, label: '{ "id": 4271 }', status: 201, statusText: 'Created', ms: 84},
    ],
    title: 'What happens on a request',
    showLog: true,
    stepFrames: 42,
    speed: 1,
    startAt: 0,
    background: '#0C0F16',
    panel: '#151A25',
    ink: '#EAEFF8',
    accent: '#4C8DFF',
    accent2: '#F5A524',
    okColor: '#2EC4A6',
    errColor: '#FF5C5C',
    fontFamily: '',
  },
  propDocs: {
    nodes: "boxes in order [{label, kind?: 'client' | 'server' | 'database' | 'cache' | 'queue' | 'service', sub?}] (2–5)",
    steps: "packets in order [{from, to (node indexes), label, status? (HTTP code, 4xx/5xx = red + shake), statusText?, ms?, type? ('request' | 'response'; default: response when going back toward node 0)}]",
    title: 'heading (empty = none)',
    showLog: 'show the call log under the diagram',
    stepFrames: 'frames per packet',
    speed: 'timing multiplier',
    startAt: 'frame the flow starts',
    background: "page colour or 'transparent'",
    panel: 'node / card colour',
    ink: 'text colour',
    accent: 'request colour',
    accent2: 'response colour',
    okColor: '2xx badge colour',
    errColor: '5xx badge / error colour',
    fontFamily: 'monospace font override (empty = JetBrains Mono)',
  },
  component: ApiRequestFlow,
  tags: ['api', 'request', 'response', 'http', 'rest', 'server', 'client', 'database', 'backend', 'architecture', 'developer', 'status code', 'network', 'software', 'diagram'],
});
