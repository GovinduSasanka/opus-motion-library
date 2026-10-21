import React, {useMemo} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng, range} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {Fish, Jellyfish, ramp} from '../../core/world-kit';

type Landmark = {depth: number; label: string; note?: string};

type Props = {
  landmarks: Landmark[];
  maxDepth: number;
  surfaceTitle: string;
  surfaceNote: string;
  descentStart: number;
  holdFrames: number;
  scrollSpeed: number;
  unit: string;
  labels: string[];
  ticks: number[];
  heroSrc: string;
  hud: boolean;
  ruler: boolean;
  seed: string;
};

// water colour by depth (video23 depth-descent-scroll table), [top, bottom]
const WATER_D = [0, 100, 300, 800, 1500, 3000, 4500, 6000];
const WATER_TOP = ['#6BB6C6', '#3B9AB0', '#2D92AF', '#005070', '#002844', '#021629', '#000A1A', '#000105'];
const WATER_BOT = ['#2E8AA0', '#136983', '#004969', '#002641', '#001125', '#000209', '#000000', '#000000'];

const tempAt = (d: number) => {
  const T: [number, number][] = [
    [0, 19],
    [300, 11],
    [850, 5.8],
    [11000, 2.2],
  ];
  const x = Math.log10(d + 20);
  for (let i = 0; i < T.length - 1; i++) {
    const a = Math.log10(T[i][0] + 20);
    const b = Math.log10(T[i + 1][0] + 20);
    if (x <= b) return lerp(T[i][1], T[i + 1][1], clamp((x - a) / (b - a)));
  }
  return T[T.length - 1][1];
};

const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** procedural brass bathysphere (centre 0,0, radius R) */
const Bathysphere: React.FC<{R: number; u: number; frame: number; lamp: number; id: string}> = ({R, u, frame, lamp, id}) => {
  const prop = Math.cos(frame * 0.12);
  const flick = 1 + 0.05 * Math.sin(frame * 0.21) * Math.sin(frame * 0.07 + 1);
  const lx = R * 0.72;
  const ly = -R * 0.62;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-brass`} cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#e2bd74" />
          <stop offset="35%" stopColor="#a8783a" />
          <stop offset="75%" stopColor="#5a3c1c" />
          <stop offset="100%" stopColor="#24170b" />
        </radialGradient>
        <radialGradient id={`${id}-glass`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#7fb6c0" />
          <stop offset="55%" stopColor="#1d4450" />
          <stop offset="100%" stopColor="#081a22" />
        </radialGradient>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0%" stopColor="#F4E2B0" stopOpacity={0.9} />
          <stop offset="40%" stopColor="#F4E2B0" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#F4E2B0" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-dark`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6d4b24" />
          <stop offset="100%" stopColor="#2a1b0c" />
        </linearGradient>
      </defs>
      {/* propeller at the back */}
      <rect x={-R * 1.18} y={-R * 0.08} width={R * 0.3} height={R * 0.16} rx={R * 0.05} fill={`url(#${id}-dark)`} />
      <g transform={`translate(${-R * 1.2},0)`}>
        <ellipse cx={0} cy={-R * 0.22 * prop} rx={R * 0.07} ry={R * 0.24 * Math.abs(prop) + R * 0.02} fill="#4b331a" />
        <ellipse cx={0} cy={R * 0.22 * prop} rx={R * 0.07} ry={R * 0.24 * Math.abs(prop) + R * 0.02} fill="#5e4222" />
        <circle r={R * 0.07} fill="#8a6430" />
      </g>
      {/* top hatch + hook */}
      <rect x={-R * 0.22} y={-R * 1.12} width={R * 0.44} height={R * 0.2} rx={R * 0.04} fill={`url(#${id}-dark)`} />
      <ellipse cx={0} cy={-R * 1.12} rx={R * 0.22} ry={R * 0.06} fill="#9a6e34" />
      <path d={`M0 ${-R * 1.12}L0 ${-R * 1.3}`} stroke="#3a2814" strokeWidth={R * 0.06} />
      <circle cx={0} cy={-R * 1.34} r={R * 0.06} fill="none" stroke="#7a5428" strokeWidth={R * 0.03} />
      {/* skids */}
      <path d={`M${-R * 0.5} ${R * 0.85}L${-R * 0.62} ${R * 1.1}L${R * 0.62} ${R * 1.1}L${R * 0.5} ${R * 0.85}`} fill="none" stroke="#3a2814" strokeWidth={R * 0.06} strokeLinejoin="round" />
      {/* body */}
      <circle r={R} fill={`url(#${id}-brass)`} />
      <ellipse cx={0} cy={R * 0.05} rx={R * 0.995} ry={R * 0.22} fill="none" stroke="#3f2a12" strokeWidth={R * 0.07} />
      <ellipse cx={0} cy={R * 0.05} rx={R * 0.995} ry={R * 0.22} fill="none" stroke="#c8994e" strokeWidth={R * 0.015} transform={`translate(0,${-R * 0.03})`} opacity={0.7} />
      {Array.from({length: 18}, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        const x = Math.cos(a) * R * 0.97;
        const y = R * 0.05 + Math.sin(a) * R * 0.21;
        return Math.sin(a) > -0.2 ? <circle key={i} cx={x} cy={y} r={R * 0.022} fill="#e0b56a" opacity={0.8} /> : null;
      })}
      <path d={`M0 ${-R}C${R * 0.3} ${-R * 0.5} ${R * 0.3} ${R * 0.5} 0 ${R}`} fill="none" stroke="#3f2a12" strokeWidth={R * 0.03} opacity={0.6} />
      {/* porthole */}
      <g transform={`translate(${R * 0.36},${-R * 0.12})`}>
        <circle r={R * 0.42} fill="#3a2814" />
        <circle r={R * 0.38} fill="none" stroke="#c39553" strokeWidth={R * 0.07} />
        {Array.from({length: 10}, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return <circle key={i} cx={Math.cos(a) * R * 0.38} cy={Math.sin(a) * R * 0.38} r={R * 0.02} fill="#f0cf8a" />;
        })}
        <circle r={R * 0.32} fill={`url(#${id}-glass)`} />
        <circle r={R * 0.32} fill="#f0b860" opacity={0.12 + 0.12 * lamp} />
        <path d={`M${-R * 0.2} ${-R * 0.12}A${R * 0.24} ${R * 0.24} 0 0 1 ${R * 0.08} ${-R * 0.24}`} stroke="#ffffff" strokeWidth={R * 0.035} fill="none" opacity={0.55} strokeLinecap="round" />
      </g>
      {/* lamp */}
      <circle cx={lx} cy={ly} r={R * 0.7 * flick} fill={`url(#${id}-halo)`} opacity={lamp} />
      <rect x={lx - R * 0.14} y={ly - R * 0.11} width={R * 0.2} height={R * 0.22} rx={R * 0.04} fill="#5a3c1c" />
      <circle cx={lx + R * 0.06} cy={ly} r={R * 0.1} fill={lamp > 0.05 ? '#fff4d6' : '#8a7a5a'} opacity={0.6 + 0.4 * lamp} />
    </g>
  );
};

const DepthDescent: React.FC<Props> = ({landmarks, maxDepth, surfaceTitle, surfaceNote, descentStart, holdFrames, scrollSpeed, unit, labels, ticks, heroSrc, hud, ruler, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cy, durationInFrames: D, portrait} = useStage();
  const id = `depth-descent-${seed}`;
  const end = Math.max(descentStart + 30, D - holdFrames);
  const lmarks = useMemo(() => [...landmarks].sort((a, b) => a.depth - b.depth), [landmarks]);

  // numeric depth: equal screen time per landmark segment, log interpolation inside a segment and a
  // partial ease so the counter dwells near each landmark (video23: speed drops to ~15 % near hero landmarks)
  const knots = useMemo(() => {
    const k = [0, ...lmarks.map((l) => l.depth).filter((d) => d > 0 && d < maxDepth), maxDepth];
    return k;
  }, [lmarks, maxDepth]);
  const depthAt = (f: number) => {
    const t = prog(f, descentStart, end, ease.linear);
    const n = knots.length - 1;
    const seg = Math.min(n - 1, Math.floor(t * n));
    const lt = clamp(t * n - seg);
    const e = lerp(lt, ease.sine(lt), seg === n - 1 ? 0.9 : 0.6);
    return Math.max(0, Math.pow(10, lerp(Math.log10(knots[seg] + 20), Math.log10(knots[seg + 1] + 20), e)) - 20);
  };
  const depth = depthAt(frame);

  // world scroll (constant speed with soft ramps) -> px
  const scrollAt = useMemo(() => {
    const arr = [0];
    for (let f = 1; f <= D; f++) {
      const v = scrollSpeed * u * Math.min(clamp((f - descentStart + 6) / 20), clamp((end + 20 - f) / 30));
      arr.push(arr[f - 1] + Math.max(0, v));
    }
    return arr;
  }, [D, scrollSpeed, u, descentStart, end]);
  const scroll = scrollAt[Math.min(D, Math.max(0, frame))];

  // zone crossings (frame where each landmark depth is passed)
  const zones = useMemo(() => {
    const out: {f: number; title: string; note: string; depth: number}[] = [{f: Math.max(0, descentStart - 30), title: surfaceTitle, note: surfaceNote, depth: 0}];
    // a zone title arrives a little before its depth is reached (video23: ~2 s ahead)
    const n = knots.length - 1;
    for (const lm of lmarks) {
      const ki = knots.indexOf(Math.min(lm.depth, maxDepth));
      if (ki < 1 || lm.depth > maxDepth) continue;
      const f = Math.round(descentStart + ((ki - 0.45) / n) * (end - descentStart));
      out.push({f, title: lm.label, note: `${fmt(lm.depth)} ${unit}${lm.note ? ' · ' + lm.note : ''}`, depth: lm.depth});
    }
    return out;
  }, [lmarks, knots, descentStart, end, maxDepth, unit, surfaceTitle, surfaceNote]);

  const lightPct = 100 * Math.exp(-depth / 14);
  const lamp = clamp((depth - 80) / 350);
  const beam = clamp((depth - 150) / 500);

  // layout
  const R = (portrait ? 128 : 150) * u;
  const t = frame / 30;
  const hx = w * (portrait ? 0.34 : 0.25) + 6 * u * Math.sin((2 * Math.PI * t) / 7.5 + Math.PI / 2);
  const hy = (portrait ? h * 0.42 : h * 0.46) + 9 * u * Math.sin((2 * Math.PI * t) / 7.5);
  const lampX = hx + R * 0.72 + R * 0.08;
  const lampY = hy - R * 0.62;
  const beamAng = ((18 + 7 * clamp((depth - 828) / 3000)) * Math.PI) / 180;
  const beamLen = (portrait ? 900 : 1100) * u;

  const r = rng(`${seed}-world`);
  // marine snow, 3 parallax layers
  const snow = useMemo(() => {
    const rr = rng(`${seed}-snow`);
    return Array.from({length: 220}, (_, i) => ({x: rr() * w, y: rr() * h, layer: i % 3, ph: rr() * 6.28, a: range(rr, 0.2, 0.6)}));
  }, [seed, w, h]);
  const snowVis = clamp((depth - 30) / 300);

  // fish school near the surface, jellies in the midnight zone
  const fishes = Array.from({length: 26}, (_, i) => ({ox: range(r, -160, 160) * u, oy: range(r, -70, 70) * u, s: range(r, 0.7, 1.2), ph: r() * 6.28, i}));
  const fishY = h * 0.95; // world Y of the school
  const jelFrames = (() => {
    const zs = zones.filter((z) => z.depth >= 600 && z.depth <= 4000);
    const f0 = zs.length ? zs[0].f - 40 : descentStart + (end - descentStart) * 0.45;
    const f1 = zs.length ? zs[zs.length - 1].f + 20 : descentStart + (end - descentStart) * 0.75;
    return {f0, f1};
  })();
  const jellies = Array.from({length: 9}, (_, i) => {
    const fj = lerp(jelFrames.f0, jelFrames.f1, (i + r() * 0.6) / 9);
    return {Y: scrollAt[Math.max(0, Math.min(D, Math.round(fj)))] + h * range(r, 0.55, 1.05), x: range(r, portrait ? 0.15 : 0.42, portrait ? 0.85 : 0.88) * w, r: range(r, 22, 46) * u, ph: r() * 6.28, per: range(r, 48, 66)};
  });
  // trench walls in the hadal zone, seafloor at the end
  const hadal = zones.find((z) => z.depth >= 6000);
  const wallY0 = hadal ? scrollAt[Math.min(D, hadal.f)] + h * 0.7 : Infinity;
  const floorY = scrollAt[D] + h * 0.8;
  const wallPts = (() => {
    const rr = rng(`${seed}-wall`);
    const pts: [number, number][] = [];
    for (let k = 0; k <= 40; k++) pts.push([w * (0.8 + range(rr, -0.05, 0.06)), wallY0 + k * 70 * u]);
    return pts;
  })();

  // bubbles leaving the top of the sphere every ~1.4 s
  const bubbles = Array.from({length: 8}, (_, i) => {
    const per = 42;
    const age = (frame + i * (per / 2.7)) % (per * 3);
    const born = frame - age;
    const sp = 2 * u;
    const y = hy - R * 1.1 - age * sp - (scroll - scrollAt[Math.max(0, Math.min(D, Math.round(born)))]) * 0.6;
    return {x: hx + R * 0.1 * Math.sin(i * 2.1) + 4 * u * Math.sin(age * 0.25 + i), y, r: (2 + (i % 4)) * u, o: 0.55 * clamp(1 - age / (per * 3))};
  });

  // ----- HUD
  const titleFor = (zi: number) => {
    const z = zones[zi];
    const next = zones[zi + 1];
    const inStart = z.f + (zi === 0 ? 0 : 16);
    const outStart = next ? next.f : Infinity;
    return {z, inStart, outStart};
  };
  let zi = 0;
  for (let i = 0; i < zones.length; i++) if (frame >= zones[i].f) zi = i;
  const shown = [zi - 1, zi].filter((i) => i >= 0).map(titleFor);

  const K = (portrait ? 700 : 600) * u;
  const rx = w - 84 * u;
  const yOf = (d: number) => cy + K * (Math.log10(d + 20) - Math.log10(depth + 20));
  const tickList = [...ticks.map((d) => ({depth: d, name: ''})), ...lmarks.map((l) => ({depth: l.depth, name: l.label}))].sort((a, b) => a.depth - b.depth);
  const nearest = tickList.reduce((b, tk) => (Math.abs(yOf(tk.depth) - cy) < Math.abs(yOf(b.depth) - cy) ? tk : b), tickList[0]);

  const fadeIn = prog(frame, 0, 24, ease.out);
  const hudIn = prog(frame, 20, 30, ease.out);

  const waterTop = ramp(depth, WATER_D, WATER_TOP);
  const waterBot = ramp(depth, WATER_D, WATER_BOT);
  const surfY = h * 0.1 - scroll; // water surface line in screen space

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${waterTop} 0%, ${waterBot} 100%)`, opacity: fadeIn}}>
        <Svg>
          <defs>
            <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cfeef2" />
              <stop offset="100%" stopColor="#8fd0dc" />
            </linearGradient>
            <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(240,215,160)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="rgb(240,215,160)" stopOpacity={0} />
            </linearGradient>
            <filter id={`${id}-bblur`} x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation={12 * u} />
            </filter>
            <radialGradient id={`${id}-vig`} cx="50%" cy="50%" r="72%">
              <stop offset="45%" stopColor="#000" stopOpacity={0} />
              <stop offset="100%" stopColor="#000" stopOpacity={0.92} />
            </radialGradient>
            <radialGradient id={`${id}-spot`}>
              <stop offset="0%" stopColor="#f0d7a0" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f0d7a0" stopOpacity={0} />
            </radialGradient>
          </defs>
          {/* surface + god rays near the top */}
          {surfY > -40 * u && (
            <g>
              <path
                d={`M0 ${surfY - 200 * u}L${w} ${surfY - 200 * u}L${w} ${surfY}` + Array.from({length: 33}, (_, k) => `L${w - (k / 32) * w} ${surfY + 6 * u * Math.sin(k * 0.9 + frame * 0.15)}`).join('') + 'Z'}
                fill={`url(#${id}-sky)`}
                opacity={0.8}
              />
            </g>
          )}
          <g style={{mixBlendMode: 'screen'}} opacity={clamp(1 - depth / 160) * 0.9}>
            {Array.from({length: 8}, (_, k) => {
              const x0 = w * (0.15 + k * 0.1) + Math.sin(frame * 0.02 + k) * 30 * u;
              const sw = (30 + (k % 3) * 25) * u;
              return <polygon key={k} points={`${x0},${surfY} ${x0 + sw},${surfY} ${x0 + sw * 2.4 + 300 * u},${h} ${x0 + 260 * u},${h}`} fill="#d9f6fb" opacity={0.06 + 0.06 * (0.5 + 0.5 * Math.sin(frame * 0.05 + k * 1.7))} />;
            })}
          </g>
          {/* fish school near the surface */}
          {fishY - scroll > -200 * u && (
            <g>
              {fishes.map((f) => {
                const sx = ((w * 0.35 + frame * 3 * u + f.ox) % (w * 1.4)) - w * 0.1;
                const sy = fishY - scroll + f.oy + Math.sin(frame * 0.05 + f.ph) * 12 * u;
                return (
                  <g key={f.i} transform={`translate(${sx},${sy}) scale(${f.s})`} opacity={0.85}>
                    <Fish id={`${id}-fish${f.i}`} len={38 * u} wiggle={14 * Math.sin(frame * 0.5 + f.ph)} body="#2d6c84" belly="#a9d4dc" />
                  </g>
                );
              })}
            </g>
          )}
          {/* jellyfish */}
          {jellies.map((j, i) => {
            const y = j.Y - scroll;
            if (y < -200 * u || y > h + 200 * u) return null;
            const ph = ((frame + j.ph * 10) % j.per) / j.per;
            const pulse = Math.pow(Math.sin(ph * Math.PI), 2);
            const rise = Math.floor((frame + j.ph * 10) / j.per) * 12 * u + ease.out(ph) * 12 * u;
            return (
              <g key={i} transform={`translate(${j.x + Math.sin(frame * 0.02 + i) * 20 * u},${y - rise})`}>
                <Jellyfish id={`${id}-jel${i}`} r={j.r} pulse={pulse} lag={Math.sin(ph * Math.PI * 2)} frame={frame} seed={i} />
              </g>
            );
          })}
          {/* trench wall */}
          {wallY0 - scroll < h + 100 * u && (
            <polygon points={[[w + 10, wallY0 - scroll], ...wallPts.map(([x, y]) => [x, y - scroll] as [number, number]), [w + 10, wallY0 - scroll + 40 * 70 * u]].map(([x, y]) => `${x},${y}`).join(' ')} fill="#0b1418" stroke="#1d2c33" strokeWidth={2 * u} />
          )}
          {/* seafloor */}
          {floorY - scroll < h + 50 * u && (
            <path
              d={`M0 ${h + 10}` + Array.from({length: 25}, (_, k) => `L${(k / 24) * w} ${floorY - scroll - 60 * u * Math.sin(k * 0.7) - 40 * u * Math.sin(k * 1.9 + 1) - (k > 14 ? (k - 14) * 18 * u : 0)}`).join('') + `L${w} ${h + 10}Z`}
              fill="#0e1517"
            />
          )}
          {/* marine snow */}
          <g opacity={snowVis}>
            {snow.map((s, i) => {
              const f = [0.6, 1, 1.3][s.layer];
              const y = (((s.y - scroll * f) % h) + h) % h;
              const x = s.x + Math.sin(frame * 0.017 + s.ph) * 6 * u;
              return <circle key={i} cx={x} cy={y} r={(1 + s.layer) * u} fill="#8FB8C8" opacity={s.a} />;
            })}
          </g>
          {/* headlamp beam */}
          {beam > 0 && (
            <g style={{mixBlendMode: 'screen'}} opacity={beam}>
              <g transform={`translate(${lampX},${lampY}) rotate(${(beamAng * 180) / Math.PI})`} filter={`url(#${id}-bblur)`}>
                <polygon points={`0,${-6 * u} ${beamLen},${-beamLen * Math.tan((8 * Math.PI) / 180)} ${beamLen},${beamLen * Math.tan((8 * Math.PI) / 180)} 0,${6 * u}`} fill={`url(#${id}-beam)`} />
                <polygon points={`0,${-3 * u} ${beamLen * 0.7},${-beamLen * 0.7 * Math.tan((3 * Math.PI) / 180)} ${beamLen * 0.7},${beamLen * 0.7 * Math.tan((3 * Math.PI) / 180)} 0,${3 * u}`} fill={`url(#${id}-beam)`} opacity={0.8} />
              </g>
              {Array.from({length: 16}, (_, k) => {
                const rr = rng(`${seed}-mote${k}`);
                const d = ((rr() * beamLen + frame * 1.5 * u) % beamLen) * 0.9 + 40 * u;
                const off = range(rr, -0.6, 0.6) * d * Math.tan((7 * Math.PI) / 180);
                const mx = lampX + Math.cos(beamAng) * d - Math.sin(beamAng) * off;
                const my = lampY + Math.sin(beamAng) * d + Math.cos(beamAng) * off;
                return <circle key={k} cx={mx} cy={my} r={range(rr, 1.5, 3) * u} fill="#fff1cf" opacity={0.6 * (1 - d / beamLen)} />;
              })}
              {floorY - scroll < h + 50 * u && <ellipse cx={lampX + Math.cos(beamAng) * beamLen * 0.6} cy={Math.min(h * 0.92, floorY - scroll)} rx={260 * u} ry={70 * u} fill={`url(#${id}-spot)`} />}
            </g>
          )}
          {/* cable + hero */}
          <line x1={hx} y1={-10} x2={hx} y2={hy - R * 1.3} stroke="#1c140c" strokeWidth={4 * u} opacity={0.85} />
          {bubbles.map((b, i) => (b.o > 0 && b.y > -20 ? <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="none" stroke="#cfeff5" strokeWidth={1.2 * u} opacity={b.o} /> : null))}
          {!heroSrc && (
            <g transform={`translate(${hx},${hy})`}>
              <Bathysphere R={R} u={u} frame={frame} lamp={lamp} id={`${id}-sphere`} />
            </g>
          )}
          <rect x={0} y={0} width={w} height={h} fill={`url(#${id}-vig)`} />
        </Svg>
        {heroSrc && <Img src={resolveSrc(heroSrc)} style={{position: 'absolute', left: hx - R * 1.3, top: hy - R * 1.3, width: R * 2.6, height: R * 2.6, objectFit: 'contain'}} />}
      </AbsoluteFill>

      {/* ---- HUD: depth counter top-left */}
      {hud && (
        <div style={{position: 'absolute', left: 72 * u, top: 60 * u, opacity: hudIn, fontFamily: fonts.mono, color: '#97CEE8'}}>
          <div style={{fontSize: 14 * u, letterSpacing: '0.35em', color: '#51758B'}}>{labels[0] ?? 'DEPTH'}</div>
          <div style={{fontSize: 104 * u, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', fontWeight: 400}}>
            {fmt(depth)}
            <span style={{fontSize: 32 * u, marginLeft: 10 * u, color: '#77B9D8'}}>{unit}</span>
          </div>
          <div style={{display: 'flex', gap: 38 * u, marginTop: 10 * u}}>
            {[
              [labels[1] ?? 'PRESSURE', `×${fmt(1 + depth / 10)}`],
              [labels[2] ?? 'LIGHT', `${lightPct >= 1 ? Math.round(lightPct) : lightPct.toFixed(2)} %`],
              [labels[3] ?? 'TEMP.', `${tempAt(depth).toFixed(1)} °C`],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{fontSize: 11 * u, letterSpacing: '0.3em', color: '#51758B'}}>{k}</div>
                <div style={{fontSize: 20 * u, color: '#77B9D8', fontVariantNumeric: 'tabular-nums'}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- log depth ruler on the right */}
      {ruler && (
        <AbsoluteFill style={{opacity: hudIn}}>
          <Svg>
            <line x1={rx} y1={0} x2={rx} y2={h} stroke="#2A7191" strokeWidth={1.2 * u} />
            {tickList.map((tk, i) => {
              const y = yOf(tk.depth);
              if (y < -20 * u || y > h + 20 * u) return null;
              const edge = clamp(Math.min(y, h - y) / (120 * u));
              const active = tk === nearest;
              return (
                <g key={i} opacity={edge * (active ? 1 : 0.5)}>
                  <line x1={rx - (tk.name ? 18 : 12) * u} y1={y} x2={rx} y2={y} stroke={active ? '#61ACCC' : '#2A7191'} strokeWidth={1.2 * u} />
                  <text x={rx - 30 * u} y={y + 6 * u} textAnchor="end" fontFamily={fonts.mono} fontSize={17 * u} fill={active ? '#61ACCC' : '#2A7191'}>
                    {fmt(tk.depth)} {unit}
                    {tk.name && (
                      <tspan fontFamily={fonts.serif} fontStyle="italic" fontSize={19 * u} dx={8 * u}>
                        {tk.name}
                      </tspan>
                    )}
                  </text>
                </g>
              );
            })}
            <line x1={rx - 45 * u} y1={cy} x2={rx} y2={cy} stroke="#97CEE8" strokeWidth={1.2 * u} />
            <circle cx={rx} cy={cy} r={4 * u} fill="#97CEE8" />
          </Svg>
        </AbsoluteFill>
      )}

      {/* ---- zone title, letters blur in left to right */}
      {hud &&
        shown.map(({z, inStart, outStart}, k) => {
          const out = frame >= outStart;
          const subA = out ? 1 - prog(frame, outStart, outStart + 8, ease.out) : prog(frame, inStart + z.title.length * 1.35 + 3, inStart + z.title.length * 1.35 + 12, ease.out);
          const outP = out ? prog(frame, outStart + 6, outStart + 16, ease.in) : 0;
          const rule = out ? 1 - outP : prog(frame, inStart + z.title.length * 1.35, inStart + z.title.length * 1.35 + 12, ease.out);
          if (out && outP >= 1) return null;
          return (
            <div key={`${z.title}-${k}`} style={{position: 'absolute', left: 74 * u, bottom: (portrait ? 150 : 96) * u, color: '#DDEBF1'}}>
              <div style={{fontFamily: fonts.serif, fontWeight: 500, fontSize: Math.min(70 * u, (w - 160 * u) / (z.title.length * 0.92)), letterSpacing: '0.25em', lineHeight: 1, whiteSpace: 'nowrap', textTransform: 'uppercase'}}>
                {z.title.split('').map((ch, i) => {
                  const p = out ? 1 - outP : clamp((frame - inStart - i * 1.35) / 10.5);
                  const blur = out ? outP * 8 : (1 - p) * 10;
                  return (
                    <span key={i} style={{opacity: p, filter: `blur(${(blur * u).toFixed(2)}px)`}}>
                      {ch}
                    </span>
                  );
                })}
              </div>
              <div style={{fontFamily: fonts.mono, fontSize: 18 * u, color: '#9DC3D8', marginTop: 16 * u, opacity: subA, letterSpacing: '0.04em'}}>{z.note}</div>
              <div style={{marginTop: 12 * u, height: 1.2 * u, width: 400 * u * rule, background: 'linear-gradient(90deg, #6FA5BC, rgba(111,165,188,0))'}} />
            </div>
          );
        })}
    </AbsoluteFill>
  );
};

export const depthDescent = defineMotion<Props>({
  id: 'depth-descent',
  title: 'Deep-sea depth descent',
  category: 'environment',
  description:
    'Underwater descent infographic: a bobbing brass bathysphere hangs on its cable while the world scrolls up past it — surface god-rays, a fish school, glowing jellyfish, a trench wall and the seafloor — the water darkens with depth, marine snow drifts, the headlamp beam rises as light falls, a depth counter with pressure/light/temperature counts top-left, a log-scale depth ruler with landmark ticks scrolls on the right and zone titles blur in letter by letter.',
  source: ['video23 0:00-1:30 depth-descent-scroll, depth-counter-hud, log-depth-ruler, bathysphere-idle-bob, headlamp-beam, marine-snow-particles, zone-title-blur-swap'],
  useFor: 'Scale explainers ("how deep / how far / how big"), descending through levels or eras, any ranked list read as depth.',
  durationInFrames: 480,
  defaultProps: {
    landmarks: [
      {depth: 93, label: 'Statue of Liberty', note: 'pressure ×10'},
      {depth: 330, label: 'Eiffel Tower', note: 'deepest scuba dive 332 m'},
      {depth: 828, label: 'Burj Khalifa', note: 'last light'},
      {depth: 1000, label: 'Midnight Zone', note: '90 % of species make light'},
      {depth: 3803, label: 'Titanic', note: 'marine snow'},
      {depth: 6000, label: 'Hadal Zone', note: 'pressure ×600'},
      {depth: 10935, label: 'Challenger Deep', note: '1 100 kg on every cm²'},
    ],
    maxDepth: 10935,
    surfaceTitle: 'Surface',
    surfaceNote: '11 km below your feet',
    descentStart: 40,
    holdFrames: 40,
    scrollSpeed: 7,
    unit: 'm',
    labels: ['DEPTH', 'PRESSURE', 'LIGHT', 'TEMP.'],
    ticks: [10, 20, 60, 150, 500, 1500, 3000, 5000],
    heroSrc: '',
    hud: true,
    ruler: true,
    seed: 'abyss',
  },
  propDocs: {
    landmarks: 'ruler ticks + zone titles: [{depth, label, note}] (depth in metres)',
    maxDepth: 'depth reached at the end (counter stops here)',
    surfaceTitle: 'first zone title',
    surfaceNote: 'first zone subtitle',
    descentStart: 'frame the counter starts counting',
    holdFrames: 'frames held at the bottom at the end',
    scrollSpeed: 'world scroll speed in px per frame at 1080 (constant, decoupled from the counter)',
    unit: 'unit after numbers',
    labels: 'HUD labels [depth, pressure, light, temperature]',
    ticks: 'extra plain round-depth ruler ticks',
    heroSrc: 'optional public/ image to replace the procedural bathysphere',
    hud: 'show the counter and zone titles',
    ruler: 'show the log depth ruler',
    seed: 'random seed',
  },
  component: DepthDescent,
  tags: ['ocean', 'underwater', 'depth', 'infographic', 'hud', 'scale', 'descent'],
});
