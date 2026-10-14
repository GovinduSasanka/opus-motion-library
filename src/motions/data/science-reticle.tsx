import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {blinkOn, lin, outCubic, typedCount} from '../../core/ui-kit';

/**
 * video11 scientific HUD world: scientific-hud-reticle (concentric 1 px rings, 6 spoke segments, a dashed tick
 * ring of 6 px ticks every 3°, a −28° axis with minor ticks and open end circles, a scale bar "100 µm", leader
 * lines to typed corner labels), ring-sweep-build (a bright arc with a comet head sweeps clockwise from 10
 * o'clock and reveals the subject through a conic wedge while its radius grows, easeOutCubic; corona cells pop in
 * the swept sector), typewriter-mono-label (lower-case mono, ~3 chars/frame, block cursor blinking at 4 Hz) and
 * outline-comet-trace (a glowing comet laps a dim outline in ~0.25 s and leaves it at full brightness).
 * Subject is procedural: an egg cell (default) or a banded planet.
 */
type Props = {
  subject: 'cell' | 'planet';
  labels: string[];
  scaleLabel: string;
  axisAngle: number;
  spokes: number;
  color: string;
  accent: string;
  background: string;
  seed: number;
};

const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  return `M ${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r} A ${r} ${r} 0 ${large} 1 ${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r}`;
};
const wedge = (cx: number, cy: number, r: number, a0: number, sweep: number) => {
  if (sweep >= Math.PI * 2 - 1e-3) return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
  const a1 = a0 + sweep;
  return `M ${cx} ${cy} L ${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r} A ${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r} Z`;
};

const Comet: React.FC<{x: number; y: number; u: number; id: string; k?: number}> = ({x, y, u, id, k = 1}) => (
  <g>
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor="#ffffff" stopOpacity={0.9} />
        <stop offset="0.3" stopColor="#D8DAF5" stopOpacity={0.45} />
        <stop offset="1" stopColor="#D8DAF5" stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={30 * u * k} fill={`url(#${id})`} />
    <circle cx={x} cy={y} r={4.5 * u * k} fill="#F7FFFF" />
  </g>
);

const Label: React.FC<{x: number; y: number; text: string; start: number; frame: number; u: number; color: string; anchor?: 'start' | 'end'}> = ({x, y, text, start, frame, u, color, anchor = 'start'}) => {
  const n = Math.min(text.length, typedCount(frame, start, 1.5));
  if (n <= 0) return null;
  const done = start + text.length / 1.5;
  const showCursor = frame < done + 12 && (n < text.length || blinkOn(frame));
  const fs = 24 * u;
  const tw = n * fs * 0.6;
  const x0 = anchor === 'end' ? x - tw - (showCursor ? fs * 0.6 : 0) : x;
  return (
    <g>
      <text x={x0} y={y} fontFamily={fonts.mono} fontSize={fs} fill={color}>
        {text.slice(0, n)}
      </text>
      {showCursor && <rect x={x0 + tw + 2 * u} y={y - fs * 0.8} width={fs * 0.55} height={fs * 0.95} fill={color} opacity={0.55} />}
    </g>
  );
};

const ScienceReticle: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, portrait} = useStage();
  const cy = portrait ? h * 0.46 : h / 2;
  const S = Math.min(w, h);
  const R1 = S * 0.333;
  const R2 = S * 0.39;
  const R3 = S * 0.5;
  const line = p.color;
  const zoom = 1 + 0.06 * prog(frame, 30, 210, ease.sine);
  const t = frame / 30;

  const part = (i: number) => prog(frame, i * 4, i * 4 + 8, ease.out);
  // ring-sweep build
  const B0 = 28;
  const a0 = (-150 * Math.PI) / 180;
  const sweep = outCubic(lin(frame, B0, B0 + 10)) * Math.PI * 2;
  const rr = 230 * u * outCubic(lin(frame, B0, B0 + 6)) * (1 + 0.012 * Math.sin(t * 2.2));
  const head = a0 + sweep;
  const built = frame >= B0;
  // subject geometry
  const corona = React.useMemo(() => {
    const r = rng(p.seed + 11);
    return Array.from({length: 30}, (_, i) => ({a: (i / 30) * Math.PI * 2 + r() * 0.12, d: 1.14 + r() * 0.2, s: 0.07 + r() * 0.05}));
  }, [p.seed]);
  const hex = React.useMemo(() => {
    let d = '';
    const s = 22 * u;
    const hh = s * Math.sqrt(3);
    for (let row = -14; row <= 14; row++)
      for (let col = -10; col <= 10; col++) {
        const x = cx + col * s * 3 + (row % 2 ? s * 1.5 : 0);
        const y = cy + (row * hh) / 2;
        d += `M${x + s} ${y}`;
        for (let k = 1; k <= 6; k++) d += `L${x + Math.cos((k * Math.PI) / 3) * s} ${y + Math.sin((k * Math.PI) / 3) * s}`;
      }
    return d;
  }, [cx, cy, u]);
  // labels and leaders
  const L1 = p.labels[0] ?? '';
  const L2 = p.labels[1] ?? '';
  const lx1 = w - (portrait ? 60 : 110) * u;
  const ly1 = portrait ? cy - R3 - 90 * u : cy - R2 * 0.95;
  const lx2 = (portrait ? 60 : 110) * u;
  const ly2 = portrait ? cy + R3 + 120 * u : cy + R2 * 0.9;
  const tw1 = L1.length * 14.4 * u;
  const tw2 = L2.length * 14.4 * u;
  const lead1 = prog(frame, 50, 56, ease.out);
  const lead2 = prog(frame, 74, 80, ease.out);
  const e1: [number, number] = [cx + Math.cos(-0.7) * 240 * u, cy + Math.sin(-0.7) * 240 * u];
  const e2: [number, number] = [cx + Math.cos(2.5) * 236 * u, cy + Math.sin(2.5) * 236 * u];
  // comet laps
  const lap1 = lin(frame, 112, 120);
  const lap2 = lin(frame, 156, 164);
  const ax = (p.axisAngle * Math.PI) / 180;
  const axL = R3 * 1.15;
  // pronuclei / bands
  const pn = prog(frame, 84, 100, ease.out);
  const drift = prog(frame, 100, 205, ease.sine);
  const planet = p.subject === 'planet';
  const streaks = React.useMemo(() => {
    const r = rng(p.seed + 5);
    return Array.from({length: 22}, () => ({x: r() * w, y: r() * h, l: (20 + r() * 60) * u, v: 0.6 + r() * 1.4, o: 0.1 + r() * 0.2}));
  }, [w, h, u, p.seed]);
  const dust = React.useMemo(() => {
    const r = rng(p.seed + 6);
    return Array.from({length: 140}, () => [r() * w, r() * h, (0.5 + r() * 1.2) * u, r()] as const);
  }, [w, h, u, p.seed]);

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, #050717 0%, ${p.background} 60%, #01000F 100%)`}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="sr-cyto" cx="45%" cy="40%" r="60%">
            <stop offset="0" stopColor={planet ? '#E7C08A' : '#34387E'} />
            <stop offset="1" stopColor={planet ? '#8A5A3A' : '#1E204A'} />
          </radialGradient>
          <linearGradient id="sr-bands" x1="0" y1="0" x2="0" y2="1">
            {['#C98F5A', '#E8C48E', '#B8764A', '#F0D7A8', '#C98F5A', '#9A6440', '#E8C48E', '#B8764A'].map((c, i) => (
              <stop key={i} offset={i / 7} stopColor={c} />
            ))}
          </linearGradient>
          <clipPath id="sr-cell">
            <circle cx={cx} cy={cy} r={Math.max(0.1, rr)} />
          </clipPath>
          <mask id="sr-wedge">
            <path d={wedge(cx, cy, R3, a0, sweep)} fill="#fff" />
          </mask>
          <filter id="sr-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={6 * u} />
          </filter>
        </defs>
        {dust.map(([x, y, r, k], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#C8CBF5" opacity={0.12 + 0.25 * Math.abs(Math.sin(t * 0.8 + k * 9))} />
        ))}
        {streaks.map((s, i) => {
          const x = ((s.x + frame * s.v * 3 * u) % (w + 200 * u)) - 100 * u;
          const y = ((s.y + frame * s.v * 1.6 * u) % (h + 200 * u)) - 100 * u;
          return <line key={i} x1={x} y1={y} x2={x - s.l} y2={y - s.l * 0.53} stroke="#B9BCF0" strokeWidth={1 * u} opacity={s.o} />;
        })}
        <g transform={`translate(${cx} ${cy}) scale(${zoom}) translate(${-cx} ${-cy})`}>
          {/* reticle rings (draw on) */}
          {[R1, R2, R3].map((r, i) => {
            const k = part(i);
            const bright = i === 0 ? 0.4 + 0.6 * clamp(lap1 * 1.05) : 1;
            return <path key={i} d={arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.001, k) - 0.0001)} fill="none" stroke={line} strokeWidth={1.4 * u} opacity={0.9 * bright} />;
          })}
          {/* tick ring */}
          <g opacity={part(3)} transform={`rotate(${frame * 0.05} ${cx} ${cy})`}>
            {Array.from({length: 120}, (_, i) => {
              const a = (i * 3 * Math.PI) / 180;
              const r0 = R1 + 12 * u;
              const r1 = r0 + (i % 10 === 0 ? 12 : 6) * u;
              return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke={line} strokeWidth={1.2 * u} opacity={0.8} />;
            })}
          </g>
          {/* spokes */}
          <g opacity={part(4)}>
            {Array.from({length: p.spokes}, (_, i) => {
              const a = (i / p.spokes) * Math.PI * 2 + 0.3;
              return <line key={i} x1={cx + Math.cos(a) * R2} y1={cy + Math.sin(a) * R2} x2={cx + Math.cos(a) * R3} y2={cy + Math.sin(a) * R3} stroke={line} strokeWidth={1.2 * u} />;
            })}
          </g>
          {/* axis */}
          <g opacity={part(5)} stroke={line} strokeWidth={1.2 * u} fill="none">
            <line x1={cx - Math.cos(ax) * axL} y1={cy - Math.sin(ax) * axL} x2={cx + Math.cos(ax) * axL} y2={cy + Math.sin(ax) * axL} />
            {Array.from({length: Math.floor((axL * 2) / (30 * u))}, (_, i) => {
              const d = -axL + i * 30 * u;
              if (Math.abs(d) < 250 * u) return null;
              const px = cx + Math.cos(ax) * d;
              const py = cy + Math.sin(ax) * d;
              const nx = -Math.sin(ax) * 5 * u;
              const ny = Math.cos(ax) * 5 * u;
              return <line key={i} x1={px - nx} y1={py - ny} x2={px + nx} y2={py + ny} />;
            })}
            <circle cx={cx - Math.cos(ax) * axL} cy={cy - Math.sin(ax) * axL} r={8 * u} />
            <circle cx={cx + Math.cos(ax) * axL} cy={cy + Math.sin(ax) * axL} r={8 * u} />
          </g>
          {/* star glint before the build */}
          {frame >= 18 && frame < B0 + 4 &&
            (() => {
              const k = Math.sin(clamp((frame - 18) / 14) * Math.PI);
              return (
                <g opacity={k}>
                  {[0, 45, 90, 135].map((a) => (
                    <line key={a} x1={cx - Math.cos((a * Math.PI) / 180) * 70 * u * k} y1={cy - Math.sin((a * Math.PI) / 180) * 70 * u * k} x2={cx + Math.cos((a * Math.PI) / 180) * 70 * u * k} y2={cy + Math.sin((a * Math.PI) / 180) * 70 * u * k} stroke="#ffffff" strokeWidth={(a % 90 ? 1.5 : 3) * u} />
                  ))}
                  <circle cx={cx} cy={cy} r={8 * u} fill="#ffffff" />
                </g>
              );
            })()}
          {/* subject, revealed by the conic wedge */}
          {built && (
            <g mask="url(#sr-wedge)">
              {!planet &&
                corona.map((c, i) => {
                  const ca = c.a;
                  let rel = (ca - a0) % (Math.PI * 2);
                  if (rel < 0) rel += Math.PI * 2;
                  const shownAt = B0 + (rel / (Math.PI * 2)) * 10 + 2;
                  const pop = lerp(0.6, 1, outCubic(lin(frame, shownAt, shownAt + 4)));
                  if (frame < shownAt) return null;
                  const wob = Math.sin(t * 1.5 + i) * 4 * u;
                  const x = cx + Math.cos(ca + t * 0.02) * (rr * c.d + wob);
                  const y = cy + Math.sin(ca + t * 0.02) * (rr * c.d + wob);
                  return <circle key={i} cx={x} cy={y} r={rr * c.s * pop} fill="#40408E" stroke="#8683D8" strokeWidth={1.5 * u} opacity={0.85} />;
                })}
              {planet && (
                <ellipse cx={cx} cy={cy} rx={rr * 1.75} ry={rr * 0.36} fill="none" stroke="#E8D3B0" strokeWidth={10 * u} opacity={0.5} transform={`rotate(-14 ${cx} ${cy})`} />
              )}
              <circle cx={cx} cy={cy} r={Math.max(0.1, rr)} fill="url(#sr-cyto)" />
              <g clipPath="url(#sr-cell)">
                {planet ? (
                  <rect x={cx - rr} y={cy - rr + Math.sin(t * 0.5) * 4 * u} width={rr * 2} height={rr * 2} fill="url(#sr-bands)" opacity={0.75} transform={`rotate(-14 ${cx} ${cy})`} />
                ) : (
                  <path d={hex} fill="none" stroke="#5a5fb0" strokeWidth={1 * u} opacity={0.45} transform={`translate(${Math.sin(t * 0.3) * 6 * u} ${Math.cos(t * 0.25) * 6 * u})`} />
                )}
                <circle cx={cx + rr * 0.35} cy={cy + rr * 0.35} r={rr * 1.05} fill="#000" opacity={0.25} />
              </g>
              {!planet && pn > 0 && (
                <g opacity={pn}>
                  {[0, 1].map((k) => {
                    const d = lerp(70, 34, drift) * u * (k ? 1 : -1);
                    const c = k ? '#62CAD8' : '#C35CCB';
                    return (
                      <g key={k}>
                        <circle cx={cx + d} cy={cy - d * 0.3} r={34 * u * pn} fill={c} opacity={0.3} />
                        <circle cx={cx + d} cy={cy - d * 0.3} r={34 * u * pn} fill="none" stroke={c} strokeWidth={2.5 * u} />
                      </g>
                    );
                  })}
                </g>
              )}
              {/* membrane / limb */}
              <circle cx={cx} cy={cy} r={Math.max(0.1, rr)} fill="none" stroke={planet ? '#F6E2C0' : '#5FD6C8'} strokeWidth={12 * u} opacity={0.35} filter="url(#sr-glow)" />
              <circle cx={cx} cy={cy} r={Math.max(0.1, rr)} fill="none" stroke={planet ? '#FFF2DA' : '#A3EDE6'} strokeWidth={4 * u} opacity={0.4 + 0.6 * clamp(lap2 * 1.05 + (frame < 156 ? 1 : 0))} />
            </g>
          )}
          {/* sweep arc + comet head */}
          {built && sweep < Math.PI * 2 - 0.01 && (
            <>
              <path d={arc(cx, cy, rr, a0, head)} fill="none" stroke="#F7FFFF" strokeWidth={4 * u} />
              <Comet x={cx + Math.cos(head) * rr} y={cy + Math.sin(head) * rr} u={u} id="sr-c0" />
            </>
          )}
          {/* comet laps (outline-comet-trace) */}
          {lap1 > 0 && lap1 < 1 && (
            <>
              <path d={arc(cx, cy, R1, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lap1)} fill="none" stroke="#F7FFFF" strokeWidth={2.5 * u} />
              <Comet x={cx + Math.cos(-Math.PI / 2 + Math.PI * 2 * lap1) * R1} y={cy + Math.sin(-Math.PI / 2 + Math.PI * 2 * lap1) * R1} u={u} id="sr-c1" />
            </>
          )}
          {lap2 > 0 && lap2 < 1 && <Comet x={cx + Math.cos(a0 + Math.PI * 2 * lap2) * rr} y={cy + Math.sin(a0 + Math.PI * 2 * lap2) * rr} u={u} id="sr-c2" k={0.8} />}
          {/* scale bar */}
          <g opacity={part(7)} stroke="#898AA8" strokeWidth={1.4 * u}>
            {(() => {
              const by = cy + rr + (portrait ? 90 : 70) * u;
              const bw = 340 * u;
              return (
                <>
                  <line x1={cx - bw / 2} x2={cx + bw / 2} y1={by} y2={by} />
                  {Array.from({length: 21}, (_, i) => (
                    <line key={i} x1={cx - bw / 2 + i * 17 * u} x2={cx - bw / 2 + i * 17 * u} y1={by} y2={by - (i % 5 === 0 ? 12 : 6) * u} />
                  ))}
                  <text x={cx} y={by + 32 * u} textAnchor="middle" fontFamily={fonts.mono} fontSize={20 * u} fill="#A2A2C7" stroke="none">
                    {p.scaleLabel}
                  </text>
                </>
              );
            })()}
          </g>
        </g>
        {/* leaders + typed labels (not zoomed, like the source overlay labels) */}
        <g stroke={p.accent} strokeWidth={1.2 * u} fill="none">
          {lead1 > 0 && <polyline points={`${e1[0]},${e1[1]} ${lerp(e1[0], lx1 - tw1 - 14 * u, lead1)},${lerp(e1[1], ly1 - 8 * u, lead1)}`} />}
          {lead2 > 0 && <polyline points={`${e2[0]},${e2[1]} ${lerp(e2[0], lx2 + tw2 + 14 * u, lead2)},${lerp(e2[1], ly2 - 8 * u, lead2)}`} />}
        </g>
        <Label x={lx1} y={ly1} text={L1} start={56} frame={frame} u={u} color="#D8DAF5" anchor="end" />
        <Label x={lx2} y={ly2} text={L2} start={80} frame={frame} u={u} color="#D8DAF5" anchor="start" />
      </svg>
    </AbsoluteFill>
  );
};

export const scienceReticle = defineMotion<Props>({
  id: 'science-reticle',
  title: 'Science HUD reticle',
  category: 'data',
  description: 'Instrument overlay (rings, spokes, tick ring, axis, scale bar) builds around a procedural cell or planet that is drawn by a clockwise comet sweep; typed mono labels on leader lines, comet laps the outlines.',
  source: ['video11 1:79-5:20 scientific-hud-reticle, ring-sweep-build, typewriter-mono-label, outline-comet-trace'],
  useFor: 'Scientific / microscopic / astronomical subjects, "under the microscope" beats, measured close-ups.',
  durationInFrames: 210,
  defaultProps: {
    subject: 'cell',
    labels: ['day 0 · fertilisation', 'zona pellucida'],
    scaleLabel: '100 µm',
    axisAngle: -28,
    spokes: 6,
    color: '#5A5D8A',
    accent: '#8B8DB8',
    background: '#020414',
    seed: 3,
  },
  propDocs: {
    subject: "'cell' (egg with corona cells, honeycomb and pronuclei) or 'planet' (banded planet with a ring)",
    labels: '[upper label, lower label] typed on leader lines',
    scaleLabel: 'scale bar caption',
    axisAngle: 'angle of the long tick axis in degrees',
    spokes: 'number of spoke segments between the outer rings',
    color: 'reticle line colour',
    accent: 'leader line colour',
  },
  component: ScienceReticle,
  tags: ['hud', 'science', 'microscope', 'reticle', 'cell', 'planet', 'labels'],
});
