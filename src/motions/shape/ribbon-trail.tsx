import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Ball, Mono, P17, PrinciplesHud, serifItalic} from '../../core/principles-kit';
import {Sparkle} from '../../core/shapes';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {DabRibbon} from '../../core/r2-e2-fx-kit';

/**
 * video17 ribbon-follow-through (+ video11 motion-trail-ribbons as style 'neon').
 * ribbons: a red ball swoops along a curve trailing 5 soft ribbons that lag behind; at STOP the ball halts and the
 *   ribbons keep travelling, whip past the ball and settle hanging down with a damped swing (period ~0.35 s, ζ 0.3).
 * neon: two dots orbit each other on looping trochoids, each leaving a never-fading neon tube trail with beads,
 *   then spiral in and meet in a white starburst.
 */
type Props = {
  style: 'ribbons' | 'neon' | 'dabs';
  background: string;
  ballColor: string;
  colors: string[];
  neonColors: string[];
  label: string;
  ribbonLength: number;
  ribbonWidth: number;
  stopAt: number;
  period: number;
  damping: number;
  path: [number, number][];
  hud: boolean;
  numeral: string;
  title: string;
  subtitle: string;
  code: string;
  bezier: number[][];
  dabs: number;
  dabLife: number;
  dabCols: string[];
  drip: number;
  dabWidth: number[];
  seed: number;
  stopLabel: string;
  ballLabel: string;
  settleLabel: string;
  strandLabel: string;
};

type V = [number, number];

/** Catmull-Rom position along waypoints, param p in [0,1] (uniform per segment), extrapolated linearly outside */
const spline = (pts: V[], p: number): V => {
  const n = pts.length - 1;
  if (p <= 0) {
    const d: V = [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]];
    return [pts[0][0] + d[0] * p * n, pts[0][1] + d[1] * p * n];
  }
  if (p >= 1) return pts[n];
  const x = p * n;
  const i = Math.min(n - 1, Math.floor(x));
  const t = x - i;
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p3 = pts[Math.min(n, i + 2)];
  const c = (a: number, b: number, cc: number, d: number) =>
    0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t * t + (-a + 3 * b - 3 * cc + d) * t * t * t);
  return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])];
};

const wrap = (a: number) => {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x <= -Math.PI) x += Math.PI * 2;
  return x;
};

const RibbonScene: React.FC<Props> = ({ballColor, colors, ribbonLength, ribbonWidth, stopAt, period, damping, path, stopLabel = 'STOP', ballLabel = 'BALL', settleLabel = 'FRAMES AFTER STOP · SETTLE', strandLabel = 'STRAND'}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const pts: V[] = path.map(([a, b]) => [a * w, b * h]);
  const r = (portrait ? 50 : 56) * u;
  const S = stopAt;
  const T0 = 4;
  // ball param: gentle ease-in, constant cruise, hard stop at S
  const pAt = (f: number) => {
    const t = (f - T0) / (S - T0);
    if (t >= 1) return 1;
    if (t <= 0) return t * 0.9;
    return t < 0.15 ? (t * t) / 0.3 : t - 0.075 + 0.075 * ((t - 0.15) / 0.85);
  };
  const posAt = (f: number) => spline(pts, pAt(Math.min(f, S)));
  const ball = posAt(frame);
  const n = Math.max(1, colors.length);
  const L = ribbonLength * u;
  const N = 26;
  const seg = L / N;
  const gap = (ribbonWidth + 4) * u;
  // resample history behind time f by arc length, with a per-ribbon delay
  const historyChain = (f: number, delay: number, lateral: number): V[] => {
    const out: V[] = [];
    let prev = posAt(f - delay);
    let need = 0;
    let acc = 0;
    let tt = f - delay;
    const head = prev;
    // direction at head for lateral offset
    const ahead = posAt(f - delay + 0.5);
    let dx = ahead[0] - head[0];
    let dy = ahead[1] - head[1];
    const dl = Math.hypot(dx, dy) || 1;
    dx /= dl;
    dy /= dl;
    out.push([head[0] - dy * lateral, head[1] + dx * lateral]);
    need = seg;
    for (let k = 0; k < 1200 && out.length <= N; k++) {
      tt -= 0.25;
      const p = posAt(tt);
      const d = Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      acc += d;
      if (acc >= need) {
        out.push([p[0] - dy * lateral, p[1] + dx * lateral]);
        need += seg;
      }
      prev = p;
    }
    while (out.length <= N) {
      const a = out[out.length - 1];
      const b = out[out.length - 2] ?? [a[0] + 1, a[1]];
      const ddx = a[0] - b[0];
      const ddy = a[1] - b[1];
      const ll = Math.hypot(ddx, ddy) || 1;
      out.push([a[0] + (ddx / ll) * seg, a[1] + (ddy / ll) * seg]);
    }
    return out;
  };
  const omega = (2 * Math.PI) / period;
  const zeta = damping;
  const D = (tau: number) => (tau < 0 ? 1 : Math.exp(-zeta * omega * tau) * Math.cos(omega * Math.sqrt(1 - zeta * zeta) * tau));
  const ribbons = Array.from({length: n}, (_, i) => {
    const lateral = (i - (n - 1) / 2) * gap;
    const delay = i * 0.75;
    if (frame < S) return historyChain(frame, delay, lateral);
    // after stop: rope of fixed segments swinging toward hanging (+y), whip travels down the ribbon
    const base = historyChain(S, delay, lateral);
    const s = frame - S;
    const anchor: V = [ball[0] + lateral * 0.9, ball[1] + r * 0.2];
    const out: V[] = [anchor];
    const hang = Math.PI / 2 + Math.sin((frame + i * 9) * 0.07) * 0.06 * prog(frame, S + 30, S + 60);
    let cur = anchor;
    for (let k = 0; k < N; k++) {
      const a0 = Math.atan2(base[k + 1][1] - base[k][1], base[k + 1][0] - base[k][0]);
      const rel = wrap(a0 - Math.PI / 2);
      const a = hang + rel * D(s - k * 0.42 - i * 0.6);
      cur = [cur[0] + Math.cos(a) * seg, cur[1] + Math.sin(a) * seg];
      out.push(cur);
    }
    // blend the first frames so the anchor snaps smoothly to the ball
    const bl = prog(frame, S, S + 3, ease.out);
    return out.map((p, k) => [base[k][0] + (p[0] - base[k][0]) * bl, base[k][1] + (p[1] - base[k][1]) * bl] as V);
  });
  // dotted path trail behind the ball
  const trail = [];
  for (let k = 3; k < 70; k += 3) {
    const f = Math.min(frame, S) - k;
    if (f < T0) break;
    const p = posAt(f);
    trail.push(<circle key={k} cx={p[0]} cy={p[1]} r={2 * u} fill="#fff" opacity={0.45 * (1 - k / 70)} />);
  }
  const stopIn = prog(frame, S, S + 6, ease.back);
  const settleF = (i: number) => 14 + i * 5;
  const panelX = portrait ? w - 60 * u : w - 110 * u;
  const panelY = portrait ? 200 * u : 130 * u;
  const squashS = frame >= S && frame < S + 3 ? 1 - 0.1 * (1 - (frame - S) / 3) : 1;
  return (
    <>
      <Svg>
        {trail}
        <g style={{filter: `blur(${1.1 * u}px)`}}>
          {ribbons.map((pl, i) => (
            <g key={i}>
              {pl.slice(0, -1).map((p, k) => {
                const q = pl[k + 1];
                const t = k / (pl.length - 1);
                return <line key={k} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={colors[i % colors.length]} strokeWidth={ribbonWidth * u * (1 - 0.55 * t)} strokeLinecap={k === 0 ? 'round' : 'butt'} opacity={1 - t * 0.92} />;
              })}
            </g>
          ))}
        </g>
        <Ball x={ball[0]} y={ball[1]} r={r} sx={1 / squashS} sy={squashS} color={ballColor} />
        {stopIn > 0 && (
          <g opacity={clamp(stopIn)} stroke="#fff" strokeWidth={1.2 * u} fill="none">
            <path d={`M ${ball[0] - r * 0.7} ${ball[1] - r * 0.7} L ${ball[0] - r - 70 * u} ${ball[1] - r - 90 * u} L ${ball[0] - r - 190 * u} ${ball[1] - r - 90 * u}`} />
          </g>
        )}
      </Svg>
      {stopIn > 0 && (
        <div style={{position: 'absolute', left: ball[0] - r - 200 * u, top: ball[1] - r - 168 * u, transform: `scale(${stopIn})`, transformOrigin: '100% 100%'}}>
          <div style={{fontFamily: fonts.display, fontSize: 64 * u, color: '#fff', lineHeight: 1}}>{stopLabel}</div>
          <div style={{fontFamily: fonts.mono, fontSize: 11 * u, letterSpacing: '0.15em', color: '#fff', opacity: 0.7, marginTop: 4 * u}}>{`${ballLabel} · t = ${(S / 30).toFixed(2)} s`}</div>
        </div>
      )}
      <Mono x={panelX} y={panelY - 30 * u} size={11} color="#fff" anchor="right" opacity={prog(frame, S, S + 8)}>
        {settleLabel}
      </Mono>
      {colors.map((c, i) => {
        const s = Math.max(0, frame - S);
        const sf = settleF(i);
        const v = Math.min(s, sf);
        const op = prog(frame, S + i * 2, S + i * 2 + 6);
        const bw = 150 * u;
        return (
          <div key={i} style={{position: 'absolute', left: panelX - bw - 120 * u, top: panelY + i * 22 * u, opacity: op, display: 'flex', alignItems: 'center', gap: 12 * u}}>
            <div style={{fontFamily: fonts.mono, fontSize: 11 * u, color: '#fff', letterSpacing: '0.12em', width: 100 * u, textAlign: 'right'}}>{`${strandLabel} ${i + 1}`}</div>
            <div style={{width: bw, height: 4 * u, background: 'rgba(255,255,255,0.18)'}}>
              <div style={{width: bw * (v / 40), height: 4 * u, background: c}} />
            </div>
            <div style={{fontFamily: serifItalic, fontStyle: 'italic', fontSize: 20 * u, color: '#fff', width: 40 * u}}>{`${String(v).padStart(2, '0')}F`}</div>
          </div>
        );
      })}
    </>
  );
};

/* ---------------------------------------------------------------- neon (video11) */
const NeonScene: React.FC<Props> = ({neonColors: colors, ribbonWidth, label}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, w, h, u, cx, cy, portrait} = useStage();
  const R0 = (portrait ? 300 : 330) * u;
  const meet = durationInFrames - 34;
  const pos = (f: number, who: 0 | 1): V => {
    const t = Math.max(0, f) / 30;
    const shrink = 1 - prog(f, meet - 40, meet, ease.inOut);
    const th = t * 1.9 + (who ? Math.PI : 0);
    const R = R0 * shrink;
    const rc = 95 * u * shrink;
    const k = 3.3;
    const ox = Math.sin(t * 0.7) * 60 * u * shrink;
    return [cx + ox + Math.cos(th) * R + Math.cos(th * k) * rc, cy + Math.sin(th) * R * (portrait ? 1.3 : 0.8) + Math.sin(th * k) * rc];
  };
  const cols = [colors[0] ?? '#E978D6', colors[1] ?? '#F4D96A'];
  const fEnd = Math.min(frame, meet);
  const flash = prog(frame, meet, meet + 4, ease.out) * (1 - prog(frame, meet + 6, meet + 26, ease.in));
  return (
    <Svg>
      {/* plaza rings + string lights */}
      <circle cx={cx} cy={cy} r={Math.min(w, h) * 0.46} fill="none" stroke="#2A1E3A" strokeOpacity={0.25} strokeWidth={2 * u} />
      {Array.from({length: 46}, (_, i) => {
        const a = (i / 46) * Math.PI * 2;
        const rr = Math.min(w, h) * 0.46;
        const on = 0.55 + 0.45 * Math.sin(frame * 0.2 + i * 1.7);
        return <circle key={i} cx={cx + Math.cos(a) * rr * (portrait ? 1 : 1.55)} cy={cy + Math.sin(a) * rr * (portrait ? 1.6 : 1)} r={4 * u} fill="#FFE9B0" opacity={on} style={{filter: `drop-shadow(0 0 ${6 * u}px #FFD27A)`}} />;
      })}
      {([0, 1] as const).map((who) => {
        const pl: V[] = [];
        for (let f = 0; f <= fEnd; f += 0.5) pl.push(pos(f, who));
        const d = pl.map((p, k) => `${k ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
        // beads every 70u of arc length
        const beads: V[] = [];
        let acc = 0;
        for (let k = 1; k < pl.length; k++) {
          acc += Math.hypot(pl[k][0] - pl[k - 1][0], pl[k][1] - pl[k - 1][1]);
          if (acc >= 70 * u) {
            beads.push(pl[k]);
            acc = 0;
          }
        }
        const head = pos(fEnd, who);
        return (
          <g key={who}>
            <path d={d} fill="none" stroke={cols[who]} strokeWidth={ribbonWidth * 1.15 * u} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
            <path d={d} fill="none" stroke="#2A1E3A" strokeWidth={2 * u} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
            {beads.map((b, k) => (
              <circle key={k} cx={b[0]} cy={b[1]} r={5 * u} fill="#2A1E3A" />
            ))}
            <circle cx={head[0]} cy={head[1]} r={70 * u * (1 - flash)} fill="none" stroke={cols[who]} strokeWidth={3 * u} opacity={0.9 * (1 - prog(frame, meet - 6, meet))} />
            <circle cx={head[0]} cy={head[1]} r={22 * u} fill={cols[who]} stroke="#2A1E3A" strokeWidth={3 * u} opacity={1 - flash} />
          </g>
        );
      })}
      {label && (
        <foreignObject x={0} y={h - 170 * u} width={w} height={60 * u}>
          <div style={{textAlign: 'center', fontFamily: fonts.mono, fontSize: 28 * u, color: '#1E2A4A', letterSpacing: '0.02em'}}>
            {label.slice(0, Math.max(0, Math.floor((frame - meet) * 0.9)))}
            {frame >= meet && <span style={{opacity: Math.floor(frame / 6) % 2 ? 0 : 1}}>▊</span>}
          </div>
        </foreignObject>
      )}
      {flash > 0 && (
        <g>
          <circle cx={cx + Math.sin(((meet / 30) * 0.7)) * 0} cy={cy} r={160 * u * flash} fill="#fff" opacity={0.25 * flash} />
          <Sparkle x={pos(meet, 0)[0]} y={pos(meet, 0)[1]} size={120 * u * flash} color="#FFFFFF" rotate={frame * 2} />
        </g>
      )}
    </Svg>
  );
};

const RibbonTrail: React.FC<Props> = (props) => {
  const {style, background, hud} = props;
  if (style === 'dabs') {
    return (
      <AbsoluteFill style={{background: background || '#1C2330'}}>
        <DabRibbon bezier={props.bezier} dabs={props.dabs} dabLife={props.dabLife} dabCols={props.dabCols} drip={props.drip} dabWidth={props.dabWidth} startAt={10} flyFrames={Math.max(20, props.stopAt - 20)} seed={props.seed} />
      </AbsoluteFill>
    );
  }
  const neon = style === 'neon';
  const bg = background || (neon ? '#CC856F' : P17.blue);
  return (
    <AbsoluteFill style={{background: bg}}>
      {neon ? <NeonScene {...props} /> : <RibbonScene {...props} />}
      {hud && !neon && (
        <PrinciplesHud
          bg={bg}
          numeral={props.numeral}
          title={props.title}
          subtitle={props.subtitle}
          code={props.code}
        />
      )}
    </AbsoluteFill>
  );
};

export const ribbonTrail = defineMotion<Props>({
  id: 'ribbon-trail',
  title: 'Ribbon follow-through trail',
  category: 'shape',
  description: 'A red ball swoops across a blue field trailing five lagging pastel ribbons; when it stops the ribbons whip past and settle hanging with a damped swing (or, style neon, two orbiting dots draw looping neon tube trails).',
  source: ['video17 0:11-0:15 ribbon-follow-through', 'video11 0:20-0:22 motion-trail-ribbons'],
  useFor: 'Follow-through / overlapping-action explainers, energetic logo or cursor trails, dance / orbit paths, "two things meet" moments.',
  durationInFrames: 150,
  defaultProps: {
    style: 'ribbons',
    background: '',
    ballColor: P17.red,
    colors: ['#FFFFFF', '#C9B6F2', '#F7A7CC', '#F5CA1E', '#FFFFFF'],
    neonColors: ['#E978D6', '#F4D96A'],
    label: 'two paths · in sync',
    ribbonLength: 330,
    ribbonWidth: 12,
    stopAt: 84,
    period: 10.5,
    damping: 0.3,
    path: [
      [-0.08, 0.82],
      [0.2, 0.36],
      [0.42, 0.66],
      [0.66, 0.3],
      [0.8, 0.58],
      [0.6, 0.47],
    ],
    hud: true,
    numeral: '05',
    title: 'FOLLOW THROUGH\n& OVERLAPPING ACTION',
    subtitle: 'Nothing stops all at once.',
    code: 'strand[i].pos = ball.pos(t - i·Δ) // drag & settle',
    bezier: [[0.12, 0.72], [0.3, 0.12], [0.7, 0.95], [0.88, 0.3]],
    dabs: 26,
    dabLife: 90,
    dabCols: ['#F8C850', '#F0A030', '#FFDF80', '#E88A28'],
    drip: 0.7,
    dabWidth: [20, 64],
    seed: 4,
    stopLabel: 'STOP',
    ballLabel: 'BALL',
    settleLabel: 'FRAMES AFTER STOP · SETTLE',
    strandLabel: 'STRAND',
  },
  propDocs: {
    style: "'ribbons' (video17 ball + lagging ribbons) | 'neon' (video11 orbiting neon tube trails with beads) | 'dabs' (ribbon of impasto knife dabs flying along a Bezier, dripping and fading)",
    background: "background colour ('' = blue for ribbons, plaza terracotta for neon)",
    colors: 'ribbon colours (one ribbon each)',
    neonColors: 'neon style: the two trail colours',
    label: 'neon style: mono label typed when the two dots meet',
    ribbonLength: 'ribbon length in u',
    ribbonWidth: 'ribbon width in u',
    stopAt: 'frame the ball halts (ribbons overshoot and settle after it)',
    period: 'settle swing period in frames (~0.35 s)',
    damping: 'settle damping ratio ζ',
    path: 'ball waypoints as [x,y] fractions of the frame (smooth curve through them; ends at the last one)',
    hud: 'show HUD chrome + chapter title',
    bezier: "dabs: cubic Bezier [[x,y]x4] as frame fractions (source -> target)",
    dabs: 'dabs: number of knife dabs in the ribbon (16-30)',
    dabLife: 'dabs: frames a dab stays before it washes away',
    dabCols: 'dabs: colour ramp the dabs blend through (gold by default)',
    drip: 'dabs: share of dabs that drip (0..1)',
    dabWidth: 'dabs: [min, max] dab width in u (envelope peaks mid-ribbon)',
    seed: 'dabs: random seed',
    stopLabel: 'big word that pops when the ball stops',
    ballLabel: 'word before the stop time under the big word',
    settleLabel: 'caption above the settle table',
    strandLabel: 'word before the strand number in the settle table',
  },
  component: RibbonTrail,
  tags: ['trail', 'ribbon', 'follow-through', 'physics', 'ball', 'neon', 'dabs', 'paint', 'impasto', 'bezier', 'signal travelling', 'brush'],
});
