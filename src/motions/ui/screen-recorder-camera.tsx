import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {cl, h1, lf, lerp, sstep} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Screen-Studio-style virtual camera inside a UI recording. A mock app window sits on a wallpaper; the camera eases in
 * to the cursor / caret (zoom 1 -> 1.6-2.4 over .6-1 s), drifts slowly at rest, and whip-pans between panes with
 * directional motion blur (sigma = min(36, max(0, |v px/frame| - 30) * .3) per axis). Zoom never goes below 1 and the
 * viewport stays inside the content. A cursor glides between the key points on arcs and clicks (ripple + dip); the app
 * reacts to the first three clicks (search types, chart tooltip, publish toast).
 */
type CamKey = {t: number; x: number; y: number; zoom: number; dur?: number; click?: boolean};
type Props = {
  keys: CamKey[];
  appName: string;
  query: string;
  windowTitle: string;
  sidebarItems: string[];
  sidebarActive: number;
  heading: string;
  searchPlaceholder: string;
  suggestions: string[];
  kpis: {label: string; value: string; delta: string; color?: string}[];
  chartTitle: string;
  tooltipLabel: string;
  tooltipValue: string;
  tableRows: string[][];
  inspectorTitle: string;
  inspectorNote: string;
  fields: string[][];
  publishLabel: string;
  publishingLabel: string;
  publishedLabel: string;
  toastText: string;
  accent: string;
  wallpaper: string[];
  cursor: boolean;
  blur: boolean;
  drift: number;
  seed: number;
};

const DW = 1500;
const DH = 940;
const eio = (q: number) => (q < 0.5 ? 16 * q ** 5 : 1 - (-2 * q + 2) ** 5 / 2);
const eoo = (q: number) => (q < 0.5 ? 4 * q ** 3 : 1 - (-2 * q + 2) ** 3 / 2);
const KN = 12;
const knotY = (i: number, seed: number) => 0.28 + 0.5 * (0.5 + 0.5 * Math.sin(i * 0.62 + seed)) * (0.55 + 0.45 * h1(i, seed)) + i * 0.018;

const ScreenCam: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const id = `scam-${p.seed}`;
  const keys = [...p.keys].sort((a, b) => a.t - b.t);
  const ws = Math.min((w * 0.92) / DW, (h * 0.9) / DH) * (h > w ? 1.02 : 1);
  const wx0 = (w - DW * ws) / 2;
  const wy0 = (h - DH * ws) / 2;

  // ---- camera state at a given frame -------------------------------------------------------------
  const cam = (f: number) => {
    const t = f / 30;
    let prev = {x: 0.5, y: 0.5, z: 1};
    let cur = prev;
    for (const k of keys) {
      if (t < k.t) break;
      const dur = k.dur ?? 0.8;
      const q = cl((t - k.t) / dur);
      const target = {x: k.x, y: k.y, z: Math.max(1, k.zoom)};
      const e = dur < 0.55 ? eio(q) : eoo(q);
      cur = {x: lerp(prev.x, target.x, e), y: lerp(prev.y, target.y, e), z: Math.exp(lerp(Math.log(prev.z), Math.log(target.z), e))};
      if (q < 1) break;
      prev = target;
    }
    const z0 = Math.max(1, cur.z);
    const z = h > w ? 1 + (z0 - 1) * 0.6 : z0;
    const dx = (Math.sin(t * 0.9) * 14 * p.drift) / DW;
    const dy = (Math.cos(t * 0.7 + 1) * 10 * p.drift) / DH;
    let sx = wx0 + (cur.x + dx) * DW * ws;
    let sy = wy0 + (cur.y + dy) * DH * ws;
    sx = cl(sx, w / (2 * z), w - w / (2 * z));
    sy = cl(sy, h / (2 * z), h - h / (2 * z));
    return {z, tx: w / 2 - z * sx, ty: h / 2 - z * sy};
  };
  const c1 = cam(frame);
  const c0 = cam(Math.max(0, frame - 1));
  const bx = p.blur ? Math.min(36, Math.max(0, Math.abs(c1.tx - c0.tx) - 30) * 0.3) : 0;
  const by = p.blur ? Math.min(36, Math.max(0, Math.abs(c1.ty - c0.ty) - 30) * 0.3) : 0;

  // ---- cursor ------------------------------------------------------------------------------------
  const t = frame / 30;
  const stops: {t0: number; t1: number; x: number; y: number; click: boolean}[] = [];
  keys.forEach((k) => stops.push({t0: k.t - 0.1, t1: k.t + (k.dur ?? 0.8) * 0.85, x: k.x, y: k.y, click: !!k.click}));
  let cp = {x: 0.42, y: 0.66};
  let from = cp;
  for (const s of stops) {
    if (t < s.t0) break;
    const q = cl((t - s.t0) / Math.max(0.2, s.t1 - s.t0));
    const e = eoo(q);
    const nx = -(s.y - from.y);
    const ny = s.x - from.x;
    const nl = Math.hypot(nx, ny) || 1;
    const arc = (40 / DW) * Math.sin(q * Math.PI);
    cp = {x: lerp(from.x, s.x, e) + (nx / nl) * arc, y: lerp(from.y, s.y, e) + (ny / nl) * arc * (DW / DH)};
    if (q < 1) break;
    from = {x: s.x, y: s.y};
    cp = from;
  }
  const clicks = stops.filter((s) => s.click).map((s) => s.t1 + 0.08);
  const lastClick = clicks.filter((c) => c <= t).slice(-1)[0];
  const clickAge = lastClick === undefined ? 99 : (t - lastClick) * 30;
  const curScale = clickAge < 3 ? 0.9 : 1;
  const curOpacity = sstep(0.1, 0.4, t);

  // ---- app reactions -----------------------------------------------------------------------------
  const [k0, k1, k2] = clicks;
  const typed = k0 !== undefined && t > k0 + 0.15 ? Math.min(p.query.length, Math.floor((t - k0 - 0.15) * 12)) : 0;
  const focused = k0 !== undefined && t >= k0;
  const tip = k1 !== undefined ? sstep(k1, k1 + 0.15, t) : 0;
  const pressed = k2 !== undefined && t >= k2 && t < k2 + 0.7;
  const published = k2 !== undefined && t >= k2 + 0.7;
  const toast = k2 !== undefined ? sstep(k2 + 0.7, k2 + 0.95, t) * (1 - sstep(k2 + 2.6, k2 + 2.9, t)) : 0;
  const draw = sstep(0.3, 2.0, t);
  const winIn = sstep(0, 0.4, t);

  // chart
  const CW = 860;
  const CH = 250;
  const samples = Array.from({length: 111}, (_, s) => {
    const x = (s / 110) * (KN - 1);
    const i = Math.floor(x);
    const f = x - i;
    const y = lerp(knotY(i, p.seed), knotY(Math.min(KN - 1, i + 1), p.seed), f * f * (3 - 2 * f));
    return [(s / 110) * CW, CH - y * CH * 1.1] as [number, number];
  });
  const line = 'M' + samples.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L');
  const area = line + `L${CW} ${CH}L0 ${CH}Z`;
  const kx = (8 / (KN - 1)) * CW;
  const ky = CH - knotY(8, p.seed) * CH * 1.1;

  const A = p.accent;
  const card = {background: '#fff', borderRadius: 14, boxShadow: '0 1px 2px rgba(20,24,60,0.06), 0 0 0 1px rgba(20,24,60,0.05)'} as React.CSSProperties;
  const mono = lf.jbm;
  const rows = p.tableRows;

  return (
    <AbsoluteFill style={{background: '#0f1020'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={`${id}-mb`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
        </filter>
      </svg>
      <div style={{position: 'absolute', inset: 0, filter: bx + by > 0.3 ? `url(#${id}-mb)` : undefined}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, transformOrigin: '0 0', transform: `translate(${c1.tx}px, ${c1.ty}px) scale(${c1.z})`, background: `linear-gradient(135deg, ${p.wallpaper[0]}, ${p.wallpaper[1] ?? p.wallpaper[0]})`}}>
          {/* soft wallpaper blobs */}
          <div style={{position: 'absolute', left: w * 0.62, top: -h * 0.2, width: w * 0.5, height: w * 0.5, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', filter: `blur(${60 * u}px)`}} />
          <div style={{position: 'absolute', left: -w * 0.1, top: h * 0.6, width: w * 0.45, height: w * 0.45, borderRadius: '50%', background: 'rgba(255,120,160,0.22)', filter: `blur(${80 * u}px)`}} />
          {/* window */}
          <div
            style={{
              position: 'absolute',
              left: wx0,
              top: wy0,
              width: DW,
              height: DH,
              transformOrigin: '0 0',
              transform: `scale(${ws * (0.965 + 0.035 * winIn)})`,
              opacity: winIn,
              borderRadius: 18,
              background: '#F4F5FA',
              boxShadow: '0 40px 100px rgba(10,10,40,0.45), 0 0 0 1px rgba(255,255,255,0.4)',
              overflow: 'hidden',
              fontFamily: lf.inter,
              color: '#1B1E3B',
            }}
          >
            {/* title bar */}
            <div style={{height: 44, display: 'flex', alignItems: 'center', gap: 9, paddingLeft: 18, background: '#ECEEF6', borderBottom: '1px solid rgba(20,24,60,0.07)'}}>
              {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
                <div key={c} style={{width: 13, height: 13, borderRadius: '50%', background: c}} />
              ))}
              <div style={{marginLeft: 16, fontSize: 14, color: '#6A7091', fontWeight: 500}}>{p.appName} - {p.windowTitle}</div>
            </div>
            <div style={{position: 'absolute', top: 44, left: 0, right: 0, bottom: 0, display: 'flex'}}>
              {/* sidebar */}
              <div style={{width: 230, background: '#fff', borderRight: '1px solid rgba(20,24,60,0.07)', padding: '22px 16px', boxSizing: 'border-box'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28}}>
                  <div style={{width: 30, height: 30, borderRadius: 9, background: A}} />
                  <div style={{fontWeight: 700, fontSize: 18}}>{p.appName}</div>
                </div>
                {p.sidebarItems.map((n, i) => (
                  <div key={`${n}${i}`} style={{padding: '11px 12px', borderRadius: 10, marginBottom: 4, fontSize: 15, fontWeight: i === p.sidebarActive ? 600 : 500, background: i === p.sidebarActive ? `${A}18` : 'transparent', color: i === p.sidebarActive ? A : '#5B6082'}}>
                    {n}
                  </div>
                ))}
              </div>
              {/* main */}
              <div style={{width: 940, padding: '24px 24px 0', boxSizing: 'border-box'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 44}}>
                  <div>
                    <div style={{fontSize: 28, fontWeight: 700, letterSpacing: -0.5}}>{p.heading}</div>
                  </div>
                  <div style={{width: 360, height: 44, borderRadius: 12, background: '#fff', boxShadow: focused ? `0 0 0 2.5px ${A}` : '0 0 0 1px rgba(20,24,60,0.12)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', boxSizing: 'border-box', position: 'relative'}}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#7A80A3" strokeWidth={2.2} strokeLinecap="round">
                      <circle cx={11} cy={11} r={7} />
                      <path d="M20 20l-3.5-3.5" />
                    </svg>
                    <div style={{fontSize: 16, color: typed ? '#1B1E3B' : '#9AA0BC', fontWeight: 500}}>
                      {typed ? p.query.slice(0, typed) : p.searchPlaceholder}
                      {focused && Math.floor(frame / 8) % 2 === 0 && <span style={{display: 'inline-block', width: 2, height: 18, background: A, marginLeft: 1, verticalAlign: -3}} />}
                    </div>
                    {typed >= 3 && (
                      <div style={{position: 'absolute', top: 52, left: 0, right: 0, ...card, padding: 8, zIndex: 3, opacity: sstep(0, 5, typed - 2)}}>
                        {p.suggestions.map((s, i) => (
                          <div key={`${s}${i}`} style={{padding: '9px 10px', fontSize: 14, borderRadius: 8, background: i === 0 ? `${A}14` : 'transparent', color: '#39406A', fontWeight: 500}}>
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{display: 'flex', gap: 16, marginTop: 22}}>
                  {p.kpis.map(({label: k, value: v, delta: d, color: c = '#1BA672'}, i) => (
                    <div key={`${k}${i}`} style={{...card, flex: 1, padding: '16px 18px'}}>
                      <div style={{fontSize: 13, color: '#7A80A3', fontWeight: 500}}>{k}</div>
                      <div style={{display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4}}>
                        <div style={{fontSize: 28, fontWeight: 700, letterSpacing: -0.5}}>{v}</div>
                        <div style={{fontSize: 13, fontWeight: 600, color: c}}>{d}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{...card, marginTop: 16, padding: '18px 20px', height: 322, boxSizing: 'border-box', position: 'relative'}}>
                  <div style={{fontSize: 15, fontWeight: 600}}>{p.chartTitle}</div>
                  <svg width={CW} height={CH} style={{position: 'absolute', left: 24, top: 56, overflow: 'visible'}}>
                    <defs>
                      <linearGradient id={`${id}-ar`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor={A} stopOpacity="0.22" />
                        <stop offset="1" stopColor={A} stopOpacity="0" />
                      </linearGradient>
                      <clipPath id={`${id}-cp`}>
                        <rect x={0} y={-10} width={CW * draw} height={CH + 20} />
                      </clipPath>
                    </defs>
                    {[0, 1, 2, 3].map((g) => (
                      <line key={g} x1={0} x2={CW} y1={(g / 3) * CH} y2={(g / 3) * CH} stroke="rgba(20,24,60,0.07)" />
                    ))}
                    <g clipPath={`url(#${id}-cp)`}>
                      <path d={area} fill={`url(#${id}-ar)`} />
                      <path d={line} fill="none" stroke={A} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
                    </g>
                    {tip > 0.01 && (
                      <g opacity={tip}>
                        <line x1={kx} x2={kx} y1={ky} y2={CH} stroke={A} strokeDasharray="4 4" strokeOpacity={0.6} />
                        <circle cx={kx} cy={ky} r={7} fill="#fff" stroke={A} strokeWidth={3.5} />
                        <g transform={`translate(${kx - 62} ${ky - 62 + (1 - tip) * 8})`}>
                          <rect width={124} height={46} rx={10} fill="#1B1E3B" />
                          <text x={14} y={20} fontFamily={lf.inter} fontSize={12} fill="#A6ACCB">{p.tooltipLabel}</text>
                          <text x={14} y={38} fontFamily={mono} fontSize={16} fontWeight={600} fill="#fff">{p.tooltipValue}</text>
                        </g>
                      </g>
                    )}
                  </svg>
                </div>
                <div style={{...card, marginTop: 16, padding: '6px 18px'}}>
                  {rows.map((r, i) => (
                    <div key={`${r[0]}${i}`} style={{display: 'flex', alignItems: 'center', height: 40, borderBottom: i < rows.length - 1 ? '1px solid rgba(20,24,60,0.06)' : 'none', fontSize: 14, fontWeight: 500}}>
                      <div style={{flex: 1}}>{r[0]}</div>
                      <div style={{width: 120}}>
                        <span style={{padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: r[1] === 'Paid' ? '#DDF5EA' : r[1] === 'Pending' ? '#FFF1D6' : '#FFE0E0', color: r[1] === 'Paid' ? '#12814F' : r[1] === 'Pending' ? '#A86A00' : '#B33A3A'}}>{r[1]}</span>
                      </div>
                      <div style={{width: 100, textAlign: 'right', fontFamily: mono}}>{r[2]}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* inspector */}
              <div style={{width: 330, borderLeft: '1px solid rgba(20,24,60,0.07)', background: '#fff', padding: '24px 22px', boxSizing: 'border-box', position: 'relative'}}>
                <div style={{fontSize: 18, fontWeight: 700}}>{p.inspectorTitle}</div>
                <div style={{fontSize: 13, color: '#7A80A3', marginTop: 4}}>{p.inspectorNote}</div>
                {p.fields.map((fl, i) => (
                  <div key={`${fl[0]}${i}`} style={{marginTop: 20}}>
                    <div style={{fontSize: 12, fontWeight: 600, color: '#7A80A3', marginBottom: 6}}>{fl[0].toUpperCase()}</div>
                    <div style={{height: 40, borderRadius: 10, background: '#F4F5FA', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 14, fontWeight: 500, color: '#39406A'}}>{fl[1]}</div>
                  </div>
                ))}
                <div style={{position: 'absolute', left: 22, right: 22, bottom: 24, height: 52, borderRadius: 13, background: published ? '#1BA672' : A, color: '#fff', fontSize: 17, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${pressed ? 0.96 : 1})`, boxShadow: `0 8px 20px ${published ? '#1BA67255' : A + '55'}`}}>
                  {published ? p.publishedLabel : pressed ? p.publishingLabel : p.publishLabel}
                </div>
                <div style={{position: 'absolute', left: 22, right: 22, bottom: 92 - (1 - toast) * 14, opacity: toast, ...card, padding: '12px 14px', fontSize: 13.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10}}>
                  <div style={{width: 22, height: 22, borderRadius: '50%', background: '#DDF5EA', color: '#12814F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13}}>✓</div>
                  {p.toastText}
                </div>
              </div>
            </div>
            {/* cursor (inside the window so it zooms with the camera) */}
            {p.cursor && (
              <div style={{position: 'absolute', left: cp.x * DW, top: cp.y * DH, opacity: curOpacity, pointerEvents: 'none', transform: `scale(${curScale * 1.15})`, transformOrigin: '0 0'}}>
                {clickAge < 14 && (
                  <div style={{position: 'absolute', left: -22 + 0, top: -22, width: 44, height: 44, borderRadius: '50%', border: `3px solid ${A}`, opacity: 1 - clickAge / 14, transform: `scale(${0.3 + (clickAge / 14) * 1.1})`}} />
                )}
                <svg width={30} height={36} viewBox="0 0 30 36" style={{filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))'}}>
                  <path d="M3 2 L3 27 L9.5 21.5 L14 31.5 L18.5 29.5 L14 19.8 L23 19.5 Z" fill="#111" stroke="#fff" strokeWidth={2.2} strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const screenRecorderCamera = defineMotion<Props>({
  id: 'screen-recorder-camera',
  title: 'Screen recorder camera',
  category: 'ui',
  description:
    'Screen-Studio-style camera inside a mock app recording: eased auto-zoom pushes in to the cursor and caret, a slow drift at rest, whip-pans between panes with directional motion blur, zoom never below 1 and the viewport clamped inside the content. A cursor glides on arcs and clicks (ripple + dip) while the app reacts: search types, a chart tooltip appears, a publish toast slides in.',
  source: ['lemo-opuscar styles/living-screencast demo/main.js l.30-36 (MIT, LemoLab) — blur sigma = min(36, max(0, |v px/frame| - 30)*.3), push-in 1 -> 1.6-2.4x, drift +-10-20 px'],
  useFor: 'Make any UI demo look like a premium product recording: SaaS walkthroughs, feature launches, tutorials; edit keys to aim the camera at your own panes.',
  durationInFrames: 270,
  defaultProps: {
    keys: [
      {t: 0.9, x: 0.644, y: 0.1, zoom: 2.3, dur: 0.9, click: true},
      {t: 3.4, x: 0.47, y: 0.5, zoom: 1.7, dur: 0.4, click: true},
      {t: 5.6, x: 0.89, y: 0.88, zoom: 2.1, dur: 0.4, click: true},
      {t: 7.7, x: 0.5, y: 0.5, zoom: 1, dur: 1.0},
    ],
    appName: 'Northwind',
    query: 'q3 revenue',
    windowTitle: 'Reports',
    sidebarItems: ['Overview', 'Reports', 'Customers', 'Invoices', 'Settings'],
    sidebarActive: 1,
    heading: 'Q3 revenue',
    searchPlaceholder: 'Search reports',
    suggestions: ['Q3 revenue by region', 'Q3 revenue forecast'],
    kpis: [
      {label: 'Revenue', value: '$48.2k', delta: '+12.4%'},
      {label: 'Orders', value: '1,284', delta: '+5.1%'},
      {label: 'Churn', value: '2.1%', delta: '-0.4%'},
    ],
    chartTitle: 'Revenue by week',
    tooltipLabel: 'Week 9',
    tooltipValue: '$48,210',
    tableRows: [
      ['Acme Retail', 'Paid', '$12,480'],
      ['Globex Labs', 'Pending', '$8,215'],
      ['Initech', 'Paid', '$6,930'],
      ['Umbrella Co', 'Paid', '$5,112'],
      ['Hooli', 'Overdue', '$3,870'],
    ],
    inspectorTitle: 'Publish',
    inspectorNote: 'Share this report with your team.',
    fields: [
      ['Visibility', 'Team only'],
      ['Schedule', 'Every Monday, 9:00'],
      ['Recipients', '4 people'],
    ],
    publishLabel: 'Publish report',
    publishingLabel: 'Publishing...',
    publishedLabel: 'Published ✓',
    toastText: 'Report shared with 4 people',
    accent: '#5B5FEF',
    wallpaper: ['#3B5BDB', '#C2255C'],
    cursor: true,
    blur: true,
    drift: 1,
    seed: 3,
  },
  propDocs: {
    keys: 'camera keyframes {t seconds the move starts, x, y focus on the window (0-1), zoom (>= 1), dur seconds, click: cursor clicks on arrival}; short dur = whip-pan with motion blur',
    appName: 'name shown in the mock app',
    query: 'text typed into the search field after the first click',
    windowTitle: 'title-bar suffix after the app name ("<appName> - <windowTitle>")',
    sidebarItems: 'sidebar menu labels',
    sidebarActive: 'index of the highlighted sidebar item',
    heading: 'page heading above the search field',
    searchPlaceholder: 'placeholder in the search field before typing',
    suggestions: 'dropdown suggestions that appear while the query types',
    kpis: 'KPI cards {label, value, delta, color? (delta colour)}',
    chartTitle: 'title of the chart card',
    tooltipLabel: 'small label in the chart tooltip',
    tooltipValue: 'value in the chart tooltip',
    tableRows: 'table rows [name, status, amount]; status "Paid" = green, "Pending" = amber, anything else = red',
    inspectorTitle: 'heading of the right-hand inspector',
    inspectorNote: 'grey line under the inspector heading',
    fields: 'inspector fields [label, value] (label is upper-cased)',
    publishLabel: 'primary button label at rest',
    publishingLabel: 'primary button label while pressed',
    publishedLabel: 'primary button label after the click completes',
    toastText: 'text of the toast that slides in after publishing',
    accent: 'app accent colour',
    wallpaper: 'two hex colours of the desktop wallpaper gradient',
    cursor: 'show the gliding cursor with click ripples',
    blur: 'directional motion blur on fast camera moves',
    drift: 'slow rest drift multiplier (0 = locked)',
    seed: 'chart data seed',
  },
  component: ScreenCam,
  tags: ['screen studio', 'screen recording', 'screencast', 'camera', 'zoom', 'auto zoom', 'cursor', 'whip pan', 'motion blur', 'ui demo', 'product demo', 'saas', 'mockup', 'dashboard', 'drift', 'living-screencast', 'tutorial', 'walkthrough'],
});
