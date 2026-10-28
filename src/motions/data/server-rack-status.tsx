import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  backOut,
  bgOf,
  hash01,
  isDark,
  mixHex,
  monoFont,
  onFill,
  outCubic,
  sansFont,
  seg,
  smoothNoise,
  withAlpha,
} from '../../core/dev-explainer-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A server rack: units slide into the cabinet, status LEDs blink, drive bays flicker and each unit's load
 * meter wobbles; summary tiles update live. At `alertAt` one unit's load spikes, its LED goes red, the unit
 * shakes and pulses, and an alert card connects to it.
 */
type Server = {name: string; load: number; sub?: string};
type Props = {
  servers: Server[];
  title: string;
  subtitle: string;
  alertIndex: number;
  alertLoad: number;
  alertText: string;
  alertLabel: string;
  alertAt: number;
  speed: number;
  startAt: number;
  background: string;
  panel: string;
  ink: string;
  accent: string;
  warnColor: string;
  errColor: string;
  fontFamily: string;
};

const ServerRackStatus: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = (frame - p.startAt) * Math.max(0.1, p.speed);
  const mono = monoFont(p.fontFamily);
  const sans = sansFont('');
  const dark = isDark(p.background === 'transparent' ? '#101010' : p.background);
  const servers = p.servers.length ? p.servers : [{name: 'node-01', load: 40}];
  const N = servers.length;
  const aIdx = p.alertIndex >= 0 && p.alertIndex < N ? p.alertIndex : -1;
  const aAt = p.alertAt;

  // geometry
  const rackW = portrait ? w * 0.9 : Math.min(w * 0.36, 720 * u);
  const rackTop = portrait ? 400 * u : h * 0.06;
  const rackH = portrait ? h - rackTop - 500 * u : h * 0.88;
  const rackX = portrait ? (w - rackW) / 2 : w * 0.29;
  const rail = 34 * u;
  const inset = 26 * u;
  const uh = Math.min(118 * u, (rackH - inset * 2) / N);
  const unitW = rackW - rail * 2;
  const gapU = uh * 0.1;
  const rackShown = outCubic(seg(t, 0, 14));

  // live values
  const loadOf = (i: number) => {
    const s = servers[i];
    let v = s.load + (smoothNoise(t / 14 + i * 5.3, i + 1) - 0.5) * 12;
    if (i === aIdx) {
      const k = outCubic(seg(t, aAt - 36, aAt));
      v = v + (p.alertLoad - v) * k + (t >= aAt ? (smoothNoise(t / 3, 9) - 0.5) * 3 : 0);
    }
    return Math.max(3, Math.min(100, v));
  };
  const loads = servers.map((_, i) => loadOf(i));
  const alertOn = aIdx >= 0 && t >= aAt;
  const avg = loads.reduce((a, b) => a + b, 0) / N;
  const alerts = alertOn ? 1 : 0;

  const meterColor = (v: number) => (v >= 90 ? p.errColor : v >= 70 ? p.warnColor : p.accent);
  const aName = aIdx >= 0 ? servers[aIdx].name : '';
  const aText = p.alertText || (aIdx >= 0 ? `${aName} · load ${Math.round(p.alertLoad)}% · above threshold` : '');
  const unitY = (i: number) => rackTop + inset + i * uh;

  // tiles
  const tiles = [
    {k: 'Healthy', v: `${N - alerts}/${N}`, c: alerts ? p.warnColor : p.accent},
    {k: 'Avg load', v: `${Math.round(avg)}%`, c: meterColor(avg)},
    {k: 'Alerts', v: String(alerts), c: alerts ? p.errColor : withAlpha(p.ink, 0.5)},
  ];
  const tileFs = (portrait ? 56 : 62) * u;
  const hIn = outCubic(seg(t, 2, 16));

  const aK = backOut(seg(t, aAt + 4, aAt + 20), 1.7);
  const pulse = alertOn ? 0.5 + 0.5 * Math.sin((t - aAt) * 0.55) : 0;
  const rowCenterY = aIdx >= 0 ? unitY(aIdx) + uh / 2 : 0;

  // alert card geometry
  const cardW = portrait ? w * 0.9 : Math.min(w * 0.27, 520 * u);
  const cardX = portrait ? (w - cardW) / 2 : rackX + rackW + w * 0.035;
  const cardH = (portrait ? 240 : 270) * u;
  const cardY = portrait ? h - 110 * u - cardH : Math.max(h * 0.1, Math.min(h * 0.9 - cardH, rowCenterY - cardH / 2));

  return (
    <AbsoluteFill style={{background: bgOf(p.background), overflow: 'hidden'}}>
      {/* title + tiles */}
      <div style={{position: 'absolute', left: portrait ? 0 : w * 0.06, right: portrait ? 0 : undefined, width: portrait ? w : w * 0.215, top: (portrait ? 96 : h * 0.12), textAlign: portrait ? 'center' : 'left', opacity: hIn, transform: `translateY(${(1 - hIn) * -14 * u}px)`}}>
        <div style={{fontFamily: sans, fontWeight: 800, fontSize: (portrait ? 58 : 56) * u, color: p.ink, lineHeight: 1.08}}>{p.title}</div>
        {p.subtitle ? <div style={{fontFamily: mono, fontSize: 25 * u, color: withAlpha(p.ink, 0.55), marginTop: 12 * u}}>{p.subtitle}</div> : null}
      </div>
      <div style={{position: 'absolute', display: 'flex', flexDirection: portrait ? 'row' : 'column', gap: 18 * u, left: portrait ? w * 0.05 : w * 0.06, width: portrait ? w * 0.9 : w * 0.215, top: portrait ? 240 * u : h * 0.12 + 190 * u, opacity: hIn}}>
        {tiles.map((tl, i) => {
          const kk = backOut(seg(t, 8 + i * 4, 22 + i * 4), 1.6);
          return (
            <div key={tl.k} style={{flex: 1, padding: `${18 * u}px ${24 * u}px`, borderRadius: 20 * u, background: withAlpha(p.ink, dark ? 0.06 : 0.05), border: `${2 * u}px solid ${withAlpha(i === 2 && alerts ? p.errColor : p.ink, i === 2 && alerts ? 0.7 : 0.12)}`, transform: `scale(${0.85 + 0.15 * kk})`, opacity: Math.min(1, kk), boxShadow: i === 2 && alerts ? `0 0 ${pulse * 30 * u}px ${withAlpha(p.errColor, 0.5)}` : 'none'}}>
              <div style={{fontFamily: sans, fontSize: 22 * u, fontWeight: 600, color: withAlpha(p.ink, 0.55), letterSpacing: 0.5 * u}}>{tl.k}</div>
              <div style={{fontFamily: mono, fontWeight: 700, fontSize: tileFs, color: tl.c, marginTop: 4 * u}}>{tl.v}</div>
            </div>
          );
        })}
      </div>
      {/* cabinet */}
      <div style={{position: 'absolute', left: rackX, top: rackTop, width: rackW, height: rackH, opacity: rackShown, transform: `translateY(${(1 - rackShown) * 30 * u}px)`}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 22 * u, background: mixHex(dark ? '#05070B' : '#C9CFDA', p.ink, dark ? 0.04 : 0), border: `${5 * u}px solid ${mixHex(p.panel, p.ink, 0.22)}`, boxShadow: `0 ${24 * u}px ${70 * u}px ${withAlpha('#000000', dark ? 0.5 : 0.18)}`}} />
        {/* rails with mounting holes */}
        {[0, 1].map((s) => (
          <div key={s} style={{position: 'absolute', top: inset * 0.5, bottom: inset * 0.5, [s ? 'right' : 'left']: 8 * u, width: rail - 14 * u, background: withAlpha(p.ink, 0.07), borderRadius: 6 * u}}>
            {Array.from({length: N * 3}, (_, k) => (
              <div key={k} style={{position: 'absolute', left: '50%', top: (inset * 0.5) + k * (uh / 3) - inset * 0.5 + uh * 0.18 + 8 * u, width: 8 * u, height: 8 * u, marginLeft: -4 * u, borderRadius: '50%', background: withAlpha(p.ink, 0.28)}} />
            ))}
          </div>
        ))}
      </div>
      {/* units */}
      {servers.map((s, i) => {
        const inK = outCubic(seg(t, 6 + i * 3, 24 + i * 3));
        const isA = i === aIdx && alertOn;
        const v = loads[i];
        const mc = isA ? p.errColor : meterColor(v);
        const shake = isA ? Math.max(0, 1 - seg(t, aAt, aAt + 16)) * Math.sin((t - aAt) * 2.4) * 7 * u : 0;
        const x = rackX + rail + (1 - inK) * -w * 0.35 + shake;
        const y = unitY(i);
        const fsN = Math.min(uh * 0.3, 27 * u);
        const ledR = Math.min(uh * 0.085, 7.5 * u);
        const blinkA = hash01(Math.floor(frame / 3) * 17 + i * 31) > 0.45;
        const blinkB = hash01(Math.floor(frame / 4) * 23 + i * 13 + 5) > 0.5;
        const ledBad = isA && Math.floor(frame / 4) % 2 === 0;
        const meterW = unitW * (portrait ? 0.34 : 0.3);
        return (
          <div
            key={s.name + i}
            style={{
              position: 'absolute',
              left: x,
              top: y + gapU / 2,
              width: unitW,
              height: uh - gapU,
              opacity: Math.min(1, inK * 1.4),
              borderRadius: 9 * u,
              background: isA ? mixHex(p.panel, p.errColor, 0.14 + pulse * 0.1) : p.panel,
              border: `${2.5 * u}px solid ${isA ? withAlpha(p.errColor, 0.6 + pulse * 0.4) : withAlpha(p.ink, 0.16)}`,
              boxShadow: isA ? `0 0 ${(14 + pulse * 26) * u}px ${withAlpha(p.errColor, 0.55)}` : `0 ${4 * u}px ${10 * u}px ${withAlpha('#000000', 0.25)}`,
              display: 'flex',
              alignItems: 'center',
              padding: `0 ${18 * u}px`,
              gap: 16 * u,
              boxSizing: 'border-box',
              color: p.ink,
            }}
          >
            {/* LEDs */}
            <div style={{display: 'flex', flexDirection: 'column', gap: ledR * 0.9, flex: '0 0 auto'}}>
              <Led r={ledR} on color="#3FD68F" />
              <Led r={ledR} on={isA ? ledBad : blinkA} color={isA ? p.errColor : '#3FD68F'} />
              <Led r={ledR} on={isA ? true : blinkB && v > 55} color={isA ? p.errColor : p.warnColor} />
            </div>
            <div style={{flex: '0 0 auto', minWidth: portrait ? w * 0.2 : unitW * 0.24}}>
              <div style={{fontFamily: mono, fontWeight: 700, fontSize: fsN, whiteSpace: 'nowrap'}}>{s.name}</div>
              {s.sub ? <div style={{fontFamily: mono, fontSize: fsN * 0.66, color: withAlpha(p.ink, 0.5), whiteSpace: 'nowrap'}}>{s.sub}</div> : null}
            </div>
            {/* drive bays */}
            <div style={{display: 'flex', gap: 5 * u, flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              {Array.from({length: portrait ? 4 : 5}, (_, d) => {
                const act = hash01(Math.floor(frame / 3) * 7 + i * 19 + d * 5) > 0.72 && v > 25;
                return <div key={d} style={{width: 15 * u, height: Math.min(uh * 0.42, 34 * u), borderRadius: 3 * u, background: act ? withAlpha(p.accent, 0.9) : withAlpha(p.ink, 0.12), border: `${1.5 * u}px solid ${withAlpha(p.ink, 0.16)}`}} />;
              })}
            </div>
            {/* load meter */}
            <div style={{display: 'flex', alignItems: 'center', gap: 12 * u, flex: '0 0 auto'}}>
              <div style={{width: meterW, height: Math.min(uh * 0.26, 22 * u), borderRadius: 999, background: withAlpha(p.ink, 0.12), overflow: 'hidden'}}>
                <div style={{width: `${v * seg(t, 10 + i * 3, 30 + i * 3)}%`, height: '100%', borderRadius: 999, background: mc}} />
              </div>
              <div style={{fontFamily: mono, fontWeight: 700, fontSize: fsN * 0.92, color: mc, width: fsN * 0.6 * 4, textAlign: 'right'}}>{Math.round(v)}%</div>
            </div>
          </div>
        );
      })}
      {/* alert connector + card */}
      {aIdx >= 0 && alertOn ? (
        <>
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
            {portrait ? (
              <path d={`M ${w / 2} ${cardY} V ${unitY(aIdx) + uh} `} stroke="none" />
            ) : (
              <path d={`M ${rackX + rackW - 6 * u} ${rowCenterY} L ${cardX + (cardX - (rackX + rackW)) * 0} ${cardY + cardH / 2}`} stroke={p.errColor} strokeWidth={3.5 * u} fill="none" strokeDasharray={`${10 * u} ${8 * u}`} opacity={aK} />
            )}
            {portrait ? null : <circle cx={rackX + rackW - 6 * u} cy={rowCenterY} r={8 * u} fill={p.errColor} opacity={aK} />}
          </svg>
          <div
            style={{
              position: 'absolute',
              left: cardX,
              top: cardY,
              width: cardW,
              height: cardH,
              boxSizing: 'border-box',
              opacity: Math.min(1, aK),
              transform: `scale(${0.85 + 0.15 * aK})`,
              borderRadius: 22 * u,
              background: p.panel,
              border: `${3 * u}px solid ${p.errColor}`,
              boxShadow: `0 ${16 * u}px ${46 * u}px ${withAlpha(p.errColor, 0.38)}`,
              padding: `${22 * u}px ${28 * u}px`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 12 * u,
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 16 * u}}>
              <div style={{width: 52 * u, height: 52 * u, borderRadius: '50%', background: p.errColor, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + pulse * 0.08})`}}>
                <svg width={30 * u} height={30 * u} viewBox="0 0 24 24"><path d="M12 4 L22 20 H2 Z" fill="none" stroke={onFill(p.errColor)} strokeWidth={2.4} strokeLinejoin="round" /><path d="M12 10 V14.5" stroke={onFill(p.errColor)} strokeWidth={2.4} strokeLinecap="round" /><circle cx={12} cy={17.3} r={1.2} fill={onFill(p.errColor)} /></svg>
              </div>
              <div style={{fontFamily: sans, fontWeight: 800, fontSize: 34 * u, color: p.errColor, letterSpacing: 1.5 * u}}>{p.alertLabel}</div>
            </div>
            <div style={{fontFamily: mono, fontWeight: 700, fontSize: (portrait ? 30 : 26) * u, color: p.ink, lineHeight: 1.35}}>{aText}</div>
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

const Led: React.FC<{r: number; on: boolean; color: string}> = ({r, on, color}) => (
  <div style={{width: r * 2, height: r * 2, borderRadius: '50%', background: on ? color : withAlpha(color, 0.18), boxShadow: on ? `0 0 ${r * 1.8}px ${color}` : 'none'}} />
);

export const serverRackStatus = defineMotion<Props>({
  id: 'server-rack-status',
  title: 'Server rack status',
  category: 'data',
  description:
    'A server rack cabinet: units slide in, status LEDs blink, drive bays flicker and each load meter wobbles while summary tiles update; at a set moment one unit spikes, its LED goes red, it shakes and pulses and an alert card connects to it.',
  source: ['original (generic developer explainer)'],
  useFor: 'Infrastructure, hosting, cloud, uptime-monitoring and incident stories; "your servers, at a glance" product beats; DevOps explainers.',
  durationInFrames: 240,
  defaultProps: {
    servers: [
      {name: 'web-01', sub: '10.0.1.11', load: 38},
      {name: 'web-02', sub: '10.0.1.12', load: 46},
      {name: 'web-03', sub: '10.0.1.13', load: 41},
      {name: 'api-01', sub: '10.0.2.21', load: 57},
      {name: 'api-02', sub: '10.0.2.22', load: 52},
      {name: 'db-01', sub: '10.0.3.31', load: 63},
      {name: 'cache-01', sub: '10.0.4.41', load: 29},
      {name: 'queue-01', sub: '10.0.5.51', load: 34},
    ],
    title: 'Cluster status',
    subtitle: 'eu-west · 8 nodes',
    alertIndex: 5,
    alertLoad: 97,
    alertText: '',
    alertLabel: 'ALERT',
    alertAt: 120,
    speed: 1,
    startAt: 0,
    background: '#0C0F16',
    panel: '#171C28',
    ink: '#EAEFF8',
    accent: '#4C8DFF',
    warnColor: '#F5A524',
    errColor: '#FF5C5C',
    fontFamily: '',
  },
  propDocs: {
    servers: 'rack units top → bottom [{name, load (baseline %), sub? (small text under the name)}] (1–12)',
    title: 'heading',
    subtitle: 'small line under the heading (empty = none)',
    alertIndex: 'which unit raises the alert (-1 = none)',
    alertLoad: 'load % the alerting unit spikes to',
    alertText: 'alert message (empty = built from the unit name and load)',
    alertLabel: 'alert card heading',
    alertAt: 'frame the alert fires',
    speed: 'timing multiplier',
    startAt: 'frame the scene starts',
    background: "page colour or 'transparent'",
    panel: 'unit / card colour',
    ink: 'text colour',
    accent: 'healthy meter colour',
    warnColor: 'warning (70–90 %) colour',
    errColor: 'alert colour',
    fontFamily: 'monospace font override (empty = JetBrains Mono)',
  },
  component: ServerRackStatus,
  tags: ['server', 'rack', 'datacenter', 'infrastructure', 'monitoring', 'uptime', 'cloud', 'hosting', 'devops', 'alert', 'incident', 'load', 'led', 'hardware', 'status'],
});
