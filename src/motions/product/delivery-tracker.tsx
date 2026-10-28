import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {CheckMark, bgOf, onColor, pad2} from '../../core/commerce-kit';
import {fonts} from '../../core/fonts';
import {backOut, mixHex, sh, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Order tracking: a stylised map with a street grid and a route (shop → home), a delivery van driving along it with a
 * growing trail, plus a status timeline (placed / packed / out for delivery / delivered) and a live ETA countdown.
 */
type Props = {
  title: string;
  doneTitle: string;
  orderLabel: string;
  stages: string[];
  times: string[];
  etaLabel: string;
  etaMinutes: number;
  etaUnit: string;
  doneLabel: string;
  travelFrames: number;
  background: string;
  card: string;
  ink: string;
  accent: string;
  startAt: number;
};

type Pt = [number, number];

/** polyline through waypoints with rounded corners → dense point list + cumulative length */
const roundedRoute = (pts: Pt[], r: number) => {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[i];
    if (i === 0 || i === pts.length - 1) {
      out.push(p0);
      continue;
    }
    const a = pts[i - 1];
    const b = pts[i + 1];
    const la = Math.hypot(p0[0] - a[0], p0[1] - a[1]);
    const lb = Math.hypot(b[0] - p0[0], b[1] - p0[1]);
    const rr = Math.min(r, la / 2, lb / 2);
    const pa: Pt = [p0[0] + ((a[0] - p0[0]) / la) * rr, p0[1] + ((a[1] - p0[1]) / la) * rr];
    const pb: Pt = [p0[0] + ((b[0] - p0[0]) / lb) * rr, p0[1] + ((b[1] - p0[1]) / lb) * rr];
    for (let s = 0; s <= 8; s++) {
      const q = s / 8;
      out.push([(1 - q) * (1 - q) * pa[0] + 2 * (1 - q) * q * p0[0] + q * q * pb[0], (1 - q) * (1 - q) * pa[1] + 2 * (1 - q) * q * p0[1] + q * q * pb[1]]);
    }
  }
  const cum = [0];
  for (let i = 1; i < out.length; i++) cum.push(cum[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  return {pts: out, cum, len: cum[cum.length - 1]};
};

const at = (route: ReturnType<typeof roundedRoute>, f: number) => {
  const d = f * route.len;
  let i = 1;
  while (i < route.cum.length - 1 && route.cum[i] < d) i++;
  const seg = Math.max(1e-6, route.cum[i] - route.cum[i - 1]);
  const q = Math.min(1, Math.max(0, (d - route.cum[i - 1]) / seg));
  const a = route.pts[i - 1];
  const b = route.pts[i];
  return {x: lerp(a[0], b[0], q), y: lerp(a[1], b[1], q), dx: b[0] - a[0], dy: b[1] - a[1], i, q};
};

const cut = (route: ReturnType<typeof roundedRoute>, f: number) => {
  const s = at(route, f);
  const pts = route.pts.slice(0, s.i);
  pts.push([s.x, s.y]);
  return pts.map((q, k) => `${k ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('');
};

const DeliveryTracker: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame - p.startAt;
  const stages = p.stages.length >= 2 ? p.stages : ['Placed', 'Delivered'];
  const n = stages.length;

  // timeline timing: the first n-2 stages tick on in sequence, the van runs between stage n-2 and n-1
  const pre = (i: number) => 14 + i * 26;
  const travelStart = pre(n - 2) + 4;
  const travel = Math.max(30, p.travelFrames);
  const arrive = travelStart + travel;
  const stageAt = (i: number) => (i <= n - 2 ? pre(i) : arrive);
  const reached = (i: number) => (t >= stageAt(i) ? 1 : 0);
  const done = t >= arrive;
  const move = prog(t, travelStart, arrive, ease.sine);

  // layout
  const mapW = portrait ? w * 0.9 : w * 0.54;
  const mapH = portrait ? h * 0.38 : h * 0.78;
  const mapX = portrait ? (w - mapW) / 2 : w * 0.06;
  const mapY = portrait ? h * 0.06 : (h - mapH) / 2;
  const panX = portrait ? mapX : mapX + mapW + w * 0.04;
  const panW = portrait ? mapW : w - panX - w * 0.06;
  const panY = portrait ? mapY + mapH + 36 * u : mapY;
  const panH = portrait ? h - panY - h * 0.05 : mapH;
  const enter = ease.out(sseg(t, 0, 20));

  // route (normalised waypoints -> map pixels, rounded corners)
  const way: Pt[] = portrait
    ? [[0.14, 0.82], [0.14, 0.58], [0.46, 0.58], [0.46, 0.34], [0.84, 0.34], [0.84, 0.2]]
    : [[0.1, 0.8], [0.34, 0.8], [0.34, 0.52], [0.62, 0.52], [0.62, 0.26], [0.88, 0.26]];
  const RS = roundedRoute(way.map((q): Pt => [q[0] * mapW, q[1] * mapH]), Math.min(mapW, mapH) * 0.07);
  const van = at(RS, move);
  const trail = cut(RS, Math.max(0.0005, move));
  const full = cut(RS, 0.9999);
  const start = RS.pts[0];
  const end = RS.pts[RS.pts.length - 1];
  const dir = 1;
  const vanAng = 0;
  const vs = Math.min(mapW, mapH) * 0.13;
  const bob = Math.sin(frame * 0.9) * 1.2 * u * (move > 0 && move < 1 ? 1 : 0);

  // street grid
  const streets: React.ReactNode[] = [];
  const cols = 9;
  const rows = 7;
  for (let i = 1; i < cols; i++) streets.push(<line key={'v' + i} x1={(i / cols) * mapW} y1={0} x2={(i / cols) * mapW} y2={mapH} stroke={withAlpha(p.ink, 0.07)} strokeWidth={(i % 3 === 0 ? 9 : 5) * u} />);
  for (let j = 1; j < rows; j++) streets.push(<line key={'h' + j} x1={0} y1={(j / rows) * mapH} x2={mapW} y2={(j / rows) * mapH} stroke={withAlpha(p.ink, 0.07)} strokeWidth={(j % 3 === 0 ? 9 : 5) * u} />);
  const blocks: React.ReactNode[] = [];
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const hsh = sh(i + 1, j + 7, 3);
      if (hsh < 0.55) continue;
      blocks.push(<rect key={`b${i}-${j}`} x={((i + 0.12) / cols) * mapW} y={((j + 0.14) / rows) * mapH} width={(0.76 / cols) * mapW} height={(0.72 / rows) * mapH} rx={6 * u} fill={hsh > 0.85 ? withAlpha('#4FAF7B', 0.2) : withAlpha(p.ink, 0.04)} />);
    }

  // ETA
  const minsLeft = Math.max(0, Math.ceil(p.etaMinutes * (1 - move)));
  const etaIn = ease.out(sseg(t, 12, 28));
  const arriveBurst = sseg(t, arrive, arrive + 14);

  // timeline
  const tlItemH = Math.min(portrait ? 128 * u : 104 * u, (panH - (portrait ? 330 : 300) * u) / n);

  return (
    <AbsoluteFill style={{background: bgOf(p.background), fontFamily: fonts.sans, color: p.ink}}>
      {/* map */}
      <div style={{position: 'absolute', left: mapX, top: mapY + (1 - enter) * 30 * u, width: mapW, height: mapH, opacity: enter, borderRadius: 30 * u, overflow: 'hidden', background: mixHex(p.card, p.ink, 0.035), boxShadow: `0 ${20 * u}px ${60 * u}px ${withAlpha(p.ink, 0.14)}`}}>
        <Svg>
          {streets}
          {blocks}
          <path d={full} fill="none" stroke={withAlpha(p.ink, 0.16)} strokeWidth={14 * u} strokeLinecap="round" strokeLinejoin="round" />
          <path d={full} fill="none" stroke={p.card} strokeWidth={10 * u} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${16 * u} ${14 * u}`} opacity={0.9} />
          <path d={trail} fill="none" stroke={p.accent} strokeWidth={11 * u} strokeLinecap="round" strokeLinejoin="round" />
          {/* shop pin */}
          <g transform={`translate(${start[0]} ${start[1]})`}>
            <circle r={26 * u} fill={p.ink} />
            <rect x={-12 * u} y={-4 * u} width={24 * u} height={16 * u} fill={p.card} />
            <path d={`M${-15 * u} ${-4 * u} L${-10 * u} ${-14 * u} H${10 * u} L${15 * u} ${-4 * u} Z`} fill={p.accent} />
          </g>
          {/* home pin */}
          <g transform={`translate(${end[0]} ${end[1]}) scale(${1 + 0.35 * Math.sin(Math.PI * arriveBurst)})`}>
            <circle r={(44 + (done ? 0 : 6 * Math.sin(frame * 0.2))) * u} fill={withAlpha(p.accent, 0.18)} />
            <circle r={26 * u} fill={p.accent} />
            <path d={`M${-13 * u} ${2 * u} L0 ${-11 * u} L${13 * u} ${2 * u} V${13 * u} H${-13 * u} Z`} fill={onColor(p.accent)} />
          </g>
          {/* van */}
          <g transform={`translate(${van.x} ${van.y + bob}) rotate(${vanAng}) scale(${dir * vs / 100} ${vs / 100})`} opacity={sseg(t, travelStart - 6, travelStart)}>
            <ellipse cx={0} cy={26} rx={44} ry={7} fill="#000" opacity={0.18} />
            <rect x={-44} y={-26} width={62} height={46} rx={7} fill={p.card} stroke={p.ink} strokeWidth={4} />
            <path d="M18 -14 H34 L46 2 V20 H18 Z" fill={p.accent} stroke={p.ink} strokeWidth={4} strokeLinejoin="round" />
            <path d="M23 -8 H31 L38 2 H23 Z" fill={withAlpha('#ffffff', 0.85)} />
            <rect x={-34} y={-14} width={34} height={12} rx={3} fill={p.accent} opacity={0.9} />
            <circle cx={-24} cy={22} r={9} fill={p.ink} />
            <circle cx={-24} cy={22} r={3.5} fill={p.card} />
            <circle cx={30} cy={22} r={9} fill={p.ink} />
            <circle cx={30} cy={22} r={3.5} fill={p.card} />
          </g>
        </Svg>
      </div>

      {/* panel */}
      <div style={{position: 'absolute', left: panX, top: panY + (1 - enter) * 30 * u, width: panW, height: panH, opacity: enter, borderRadius: 30 * u, background: p.card, boxShadow: `0 ${20 * u}px ${60 * u}px ${withAlpha(p.ink, 0.14)}`, padding: 38 * u, boxSizing: 'border-box'}}>
        <div style={{fontSize: 21 * u, fontWeight: 700, letterSpacing: 2 * u, opacity: 0.5, textTransform: 'uppercase'}}>{p.orderLabel}</div>
        <div style={{fontFamily: fonts.display, fontSize: (portrait ? 44 : 40) * u, marginTop: 8 * u, lineHeight: 1.1}}>{done ? p.doneTitle : p.title}</div>

        {/* ETA */}
        <div style={{display: 'flex', alignItems: 'center', gap: 22 * u, marginTop: 24 * u, padding: `${18 * u}px ${24 * u}px`, borderRadius: 22 * u, background: done ? mixHex(p.card, '#18B26B', 0.14) : withAlpha(p.accent, 0.1), opacity: etaIn}}>
          {done ? (
            <div style={{width: 64 * u, height: 64 * u, borderRadius: '50%', background: '#18B26B', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${backOut(arriveBurst, 2)})`}}>
              <CheckMark size={36 * u} color="#fff" p={sseg(t, arrive + 3, arrive + 16)} sw={3.4} />
            </div>
          ) : (
            <div style={{fontFamily: fonts.display, fontSize: 60 * u, color: p.accent, lineHeight: 1, minWidth: 90 * u}}>{pad2(minsLeft)}</div>
          )}
          <div>
            <div style={{fontSize: 24 * u, fontWeight: 800}}>{done ? p.doneLabel : p.etaLabel}</div>
            <div style={{fontSize: 21 * u, fontWeight: 600, opacity: 0.55, marginTop: 2 * u}}>{done ? p.times[n - 1] ?? '' : p.etaUnit}</div>
          </div>
        </div>

        {/* timeline */}
        <div style={{position: 'relative', marginTop: 26 * u}}>
          {stages.map((s, i) => {
            const rch = reached(i);
            const lt = t - stageAt(i);
            const pop = rch ? backOut(sseg(lt, 0, 12), 2.4) : 0;
            const isCur = rch && (i === n - 1 || t < stageAt(i + 1));
            const lineFill = i < n - 1 ? (i === n - 2 ? move : sseg(t, stageAt(i + 1) - 14, stageAt(i + 1))) : 0;
            return (
              <div key={i} style={{position: 'relative', height: tlItemH, display: 'flex', alignItems: 'flex-start', gap: 22 * u}}>
                <div style={{position: 'relative', width: 34 * u, height: tlItemH}}>
                  {i < n - 1 ? (
                    <>
                      <div style={{position: 'absolute', left: 14 * u, top: 34 * u, width: 6 * u, height: tlItemH - 34 * u, background: withAlpha(p.ink, 0.12), borderRadius: 3 * u}} />
                      <div style={{position: 'absolute', left: 14 * u, top: 34 * u, width: 6 * u, height: (tlItemH - 34 * u) * lineFill, background: p.accent, borderRadius: 3 * u}} />
                    </>
                  ) : null}
                  <div style={{position: 'absolute', left: 0, top: 0, width: 34 * u, height: 34 * u, borderRadius: '50%', background: rch ? p.accent : withAlpha(p.ink, 0.12), transform: `scale(${rch ? 0.7 + 0.3 * pop : 1})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isCur && !done ? `0 0 0 ${(6 + 3 * Math.sin(frame * 0.25)) * u}px ${withAlpha(p.accent, 0.22)}` : 'none'}}>
                    {rch ? <CheckMark size={20 * u} color={onColor(p.accent)} p={sseg(lt, 2, 12)} sw={3.6} /> : null}
                  </div>
                </div>
                <div style={{flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', opacity: lerp(0.4, 1, rch), paddingTop: 2 * u}}>
                  <div style={{fontSize: 27 * u, fontWeight: isCur ? 800 : 600}}>{s}</div>
                  <div style={{fontSize: 22 * u, fontWeight: 600, opacity: 0.6, fontFamily: fonts.mono}}>{p.times[i] ?? ''}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const deliveryTracker = defineMotion<Props>({
  id: 'delivery-tracker',
  title: 'Delivery tracker (timeline + van on a route)',
  category: 'product',
  description:
    'A map with a street grid and a route from shop to home, a delivery van driving along it with a growing trail, a status timeline that ticks through the stages and an ETA countdown that ends in a Delivered check.',
  source: ['original (round 3)'],
  useFor: 'Delivery / logistics / food-delivery explainers, order-tracking UI demos, shipping-notification beats — set the stages, times, ETA and colours.',
  durationInFrames: 210,
  defaultProps: {
    title: 'Your order is on the way',
    doneTitle: 'Your order has arrived',
    orderLabel: 'Order tracking',
    stages: ['Order placed', 'Packed', 'Out for delivery', 'Delivered'],
    times: ['10:02', '10:20', '11:05', '11:40'],
    etaLabel: 'Arriving in',
    etaMinutes: 18,
    etaUnit: 'minutes',
    doneLabel: 'Delivered',
    travelFrames: 96,
    background: '#EEF1F5',
    card: '#FFFFFF',
    ink: '#18202E',
    accent: '#FF6B2C',
    startAt: 0,
  },
  propDocs: {
    title: 'headline while the van is driving',
    doneTitle: 'headline after arrival',
    orderLabel: 'small caps line above the headline (e.g. an order number)',
    stages: 'timeline stage names (2-6); the van drives between the second-to-last and last',
    times: 'clock times per stage (same order, optional)',
    etaLabel: 'text next to the countdown',
    etaMinutes: 'countdown start (minutes); reaches 0 when the van arrives',
    etaUnit: 'unit line under the ETA label',
    doneLabel: 'text in the ETA box once delivered',
    travelFrames: 'frames the van takes to drive the route',
    background: "page colour or 'transparent'",
    card: 'map / panel colour',
    ink: 'text and street colour',
    accent: 'route trail, van and highlight colour',
    startAt: 'frame the scene starts',
  },
  component: DeliveryTracker,
  tags: ['delivery', 'tracking', 'order', 'shipping', 'logistics', 'van', 'map', 'route', 'timeline', 'eta', 'ecommerce', 'ui', 'food delivery'],
});
