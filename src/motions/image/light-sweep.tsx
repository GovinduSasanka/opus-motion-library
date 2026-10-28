import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {n2, rng} from '../../core/random';
import {FilmGrain, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {Plate, PlatePaletteName, rainPath, useSafeId} from '../../core/image-kit';

/**
 * Night lighting events (video16):
 *  - headlight: through a rain-streaked window, a 20° headlight wedge grows from the left edge
 *    (0 -> peak in 0.4 s), its apex travels ≈1400 px in 0.8 s and blows out a horizontal band; the car
 *    body passes, beams leave, red tail-lights trail. A second car returns the other way.
 *  - streetlamp: sodium lamps (#F0904F @55 % -> 0, blur 12, screen) switch on with a flicker, cast
 *    triangular cones through 3-layer rain (streaks +30 % inside the cones) and vertical puddle reflections.
 *  - door: a corridor door swings open; warm light (#FFE6B8 @60 %) floods down the floor as a perspective
 *    trapezoid, the doorway blooms and a figure steps in, casting a long shadow toward camera.
 * The view outside (window / street / doorway) is `src` or the procedural night/dawn plate.
 */
type Props = {
  src: string;
  seed: number;
  mode: 'headlight' | 'streetlamp' | 'door' | 'reveal' | 'neon';
  color: string;
  beamSpread: number;
  rain: number;
  lamps: number;
  lampColor: string;
  lightColor: string;
  figure: boolean;
  push: number;
  grain: number;
  sweepStart: number;
  sweepFrames: number;
  base: number;
  soft: number;
  angle: number;
  glint: number;
  keep: boolean;
  bands: string[];
  bandDir: 'ltr' | 'rtl';
  bandFrames: number;
  bandWidth: number;
  palette: PlatePaletteName;
};

/** a soft diagonal band of light passes and leaves the (dim) picture fully lit, a faint glint riding the front */
const RevealSweep: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {fps} = useStage();
  const zoom = 1 + (p.push / 100) * (frame / fps);
  const k = prog(frame, p.sweepStart, p.sweepStart + p.sweepFrames, ease.inOut);
  const soft = Math.max(1, p.soft * 100);
  const front = -soft + k * (100 + soft * 2);
  const deg = 90 + (p.angle * 180) / Math.PI;
  const lit = p.keep ? `linear-gradient(${deg}deg, #000 0%, #000 ${front - soft}%, transparent ${front}%)` : `linear-gradient(${deg}deg, transparent ${front - soft * 2}%, #000 ${front - soft}%, #000 ${front - soft * 0.4}%, transparent ${front}%)`;
  const gl = `linear-gradient(${deg}deg, transparent ${front - soft * 0.5}%, rgba(255,255,255,${p.glint}) ${front - soft * 0.12}%, transparent ${front + soft * 0.1}%)`;
  const scene = (
    <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '60% 55%'}}>
      <Plate src={p.src} seed={p.seed} palette={p.palette} />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{filter: `brightness(${p.base})`}}>{scene}</AbsoluteFill>
      <AbsoluteFill style={{WebkitMaskImage: lit, maskImage: lit}}>{scene}</AbsoluteFill>
      {p.glint > 0 && k > 0 && k < 1 && <AbsoluteFill style={{background: gl, mixBlendMode: 'plus-lighter'}} />}
      {p.grain > 0 && <FilmGrain opacity={p.grain} every={1} />}
    </AbsoluteFill>
  );
};

/** bands of colour light slide across a held picture (screen blend) */
const NeonBands: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, fps} = useStage();
  const zoom = 1 + (p.push / 100) * (frame / fps);
  const dir = p.bandDir === 'rtl' ? -1 : 1;
  const span = Math.hypot(w, h);
  const bw = p.bandWidth * span;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '60% 55%'}}>
        <Plate src={p.src} seed={p.seed} palette={p.palette} />
      </AbsoluteFill>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}}>
        <defs>
          {p.bands.map((c, i) => (
            <linearGradient key={i} id={`nb${i}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor={c} stopOpacity={0} />
              <stop offset="0.5" stopColor={c} stopOpacity={0.75} />
              <stop offset="1" stopColor={c} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {p.bands.map((c, i) => {
          const t = ((frame - 6 - i * (p.bandFrames * 0.18)) / p.bandFrames);
          if (t < 0 || t > 1) return null;
          const e = ease.inOut(t);
          const x = dir > 0 ? -bw + e * (w + bw * 2) : w + bw - e * (w + bw * 2);
          return <rect key={i} x={x - bw / 2} y={-span * 0.3} width={bw} height={span * 1.6} fill={`url(#nb${i})`} transform={`rotate(14 ${x} ${h / 2})`} />;
        })}
      </svg>
      <Vignette strength={0.35} />
      {p.grain > 0 && <FilmGrain opacity={p.grain} every={1} />}
    </AbsoluteFill>
  );
};

const carPath = (x: number, y: number, L: number, H: number, dir: number) => {
  // side profile, front at +dir; y = ground line
  const f = (k: number) => x + dir * k * L;
  const pts: [number, number][] = [
    [f(0), y - H * 0.18],
    [f(0.02), y - H * 0.52],
    [f(0.2), y - H * 0.6],
    [f(0.33), y - H * 0.98],
    [f(0.66), y - H * 1.0],
    [f(0.8), y - H * 0.62],
    [f(0.98), y - H * 0.55],
    [f(1), y - H * 0.2],
    [f(0.98), y],
    [f(0.02), y],
  ];
  return 'M' + pts.map(([a, b]) => `${a.toFixed(1)} ${b.toFixed(1)}`).join('L') + 'Z';
};

const Headlight: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames: D} = useStage();
  const id = useSafeId('hl');
  const S = Math.min(w, h);
  // window geometry
  const wx0 = 0.07 * w;
  const wx1 = 0.93 * w;
  const wy0 = 0.09 * h;
  const wy1 = 0.84 * h;
  const ft = 20 * u;
  const road = 0.7 * h;
  const zoom = 1.04 + (p.push / 100) * (frame / fps);

  const cars = [
    {t0: Math.round(D * 0.12), dir: 1, k: 1},
    {t0: Math.round(D * 0.6), dir: -1, k: 0.8},
  ];
  const speed = (1400 / 1920) * w / (0.8 * fps); // px per frame
  const spreadR = ((p.beamSpread / 2) * Math.PI) / 180;
  let blow = 0;
  let wallLight = 0;
  const beams: React.ReactNode[] = [];
  const carsN: React.ReactNode[] = [];
  const clipPolys: string[] = [];
  cars.forEach((c, i) => {
    const lf = frame - c.t0;
    if (lf < -2) return;
    const L = 0.62 * w;
    const H = 0.12 * S * 1.4;
    const startX = c.dir > 0 ? -0.25 * w : 1.25 * w;
    const front = startX + c.dir * lf * speed;
    const rear = front - c.dir * L;
    const ramp = prog(lf, 0, 12, ease.out) * c.k;
    const past = c.dir > 0 ? front - 1.15 * w : -0.15 * w - front;
    const leave = 1 - prog(past, 0, 0.45 * w, ease.out);
    const I = ramp * clamp(leave);
    const hy = road - H * 0.36;
    if (I > 0.01) {
      const len = 1.35 * w;
      const x2 = front + c.dir * len;
      const dy = Math.tan(spreadR) * len;
      const poly = `${front},${hy - 6 * u} ${x2},${hy - dy - 40 * u} ${x2},${hy + dy * 0.7} ${front},${hy + 6 * u}`;
      clipPolys.push(poly);
      const cxn = clamp(1 - Math.abs(front + c.dir * 0.35 * w - w / 2) / (0.6 * w));
      blow = Math.max(blow, I * cxn);
      wallLight = Math.max(wallLight, I * (0.4 + 0.6 * cxn));
      beams.push(
        <g key={`b${i}`} opacity={I}>
          <defs>
            <linearGradient id={`${id}g${i}`} gradientUnits="userSpaceOnUse" x1={front} y1={hy} x2={x2} y2={hy}>
              <stop offset="0" stopColor="#ffffff" stopOpacity={0.9} />
              <stop offset="0.35" stopColor={p.color} stopOpacity={0.45} />
              <stop offset="1" stopColor={p.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points={poly} fill={`url(#${id}g${i})`} filter={`url(#${id}blur30)`} />
          {/* twin headlight blobs */}
          {[0, 1].map((k) => (
            <circle key={k} cx={front - c.dir * k * 0.12 * L} cy={hy + k * 4 * u} r={60 * u} fill={`url(#${id}hb)`} />
          ))}
        </g>,
      );
    }
    // car body + tail lights (behind the glass)
    if (Math.min(front, rear) < w * 1.1 && Math.max(front, rear) > -0.1 * w) {
      const tl = rear + c.dir * 0.015 * L;
      carsN.push(
        <g key={`c${i}`}>
          <path d={carPath(rear, road + 6 * u, L, H, c.dir)} fill="#020306" />
          <path d={carPath(rear, road + 6 * u, L, H, c.dir)} fill="none" stroke="#5d6f96" strokeOpacity={0.35} strokeWidth={2 * u} />
          <rect x={Math.min(tl, tl - c.dir * 0.45 * w)} y={road - H * 0.45} width={0.45 * w} height={10 * u} fill={`url(#${id}tt${c.dir > 0 ? 'l' : 'r'})`} filter={`url(#${id}blur8)`} />
          <ellipse cx={tl} cy={road - H * 0.42} rx={16 * u} ry={7 * u} fill="#ff2a2a" filter={`url(#${id}blur8)`} />
          <ellipse cx={tl} cy={road - H * 0.42} rx={7 * u} ry={3.5 * u} fill="#ffb0a0" />
        </g>,
      );
    }
  });

  // glass droplets + trickles
  const r = rng(p.seed * 41 + 3);
  const drops = Array.from({length: 90}, () => ({x: wx0 + r() * (wx1 - wx0), y: wy0 + r() * (wy1 - wy0), rx: (3 + 6 * r()) * u, ry: (4 + 8 * r()) * u}));
  const trick = Array.from({length: 9}, (_, i) => {
    const x = wx0 + r() * (wx1 - wx0);
    const v = (20 + 40 * r()) * u;
    const y0 = wy0 + r() * (wy1 - wy0) * 0.6;
    const y = y0 + ((frame / fps) * v) % ((wy1 - y0) * 0.9);
    let d = `M${x} ${y0}`;
    for (let k = 1; k <= 12; k++) {
      const yy = y0 + ((y - y0) * k) / 12;
      d += `L${x + n2('tr' + i, yy / (60 * u), 0) * 5 * u} ${yy}`;
    }
    return {d, x: x + n2('tr' + i, y / (60 * u), 0) * 5 * u, y};
  });

  const rain = [2, 1, 0].map((li) => rainPath(frame, w, h, u, li, {density: p.rain, angle: 8, seed: p.seed, fps}));

  return (
    <AbsoluteFill style={{background: '#05060a', overflow: 'hidden'}}>
      {/* outside: dark night plate */}
      <AbsoluteFill style={{transform: `scale(${zoom})`, filter: 'brightness(0.42) saturate(0.8) blur(1.5px)'}}>
        <Plate src={p.src} seed={p.seed} palette="night" />
      </AbsoluteFill>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={`${id}blur30`} x="-30%" y="-80%" width="160%" height="260%">
            <feGaussianBlur stdDeviation={30 * u} />
          </filter>
          <filter id={`${id}blur8`} x="-50%" y="-200%" width="200%" height="500%">
            <feGaussianBlur stdDeviation={6 * u} />
          </filter>
          <radialGradient id={`${id}hb`}>
            <stop offset="0" stopColor="#ffffff" stopOpacity={1} />
            <stop offset="0.35" stopColor="#BFE6FF" stopOpacity={0.6} />
            <stop offset="1" stopColor="#BFE6FF" stopOpacity={0} />
          </radialGradient>
          <linearGradient id={`${id}ttl`} x1="1" x2="0" y1="0" y2="0">
            <stop offset="0" stopColor="#ff2a2a" stopOpacity={0.7} />
            <stop offset="1" stopColor="#ff2a2a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`${id}ttr`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#ff2a2a" stopOpacity={0.7} />
            <stop offset="1" stopColor="#ff2a2a" stopOpacity={0} />
          </linearGradient>
          <clipPath id={`${id}beam`}>
            {clipPolys.map((pp, i) => (
              <polygon key={i} points={pp} />
            ))}
          </clipPath>
          <radialGradient id={`${id}band`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.85} />
            <stop offset="0.5" stopColor={p.color} stopOpacity={0.35} />
            <stop offset="1" stopColor={p.color} stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* rain outside, dim; brighter inside the beams */}
        {rain.map((rp, i) => (
          <path key={i} d={rp.d} stroke="#c9d3e6" strokeOpacity={rp.op * 0.45} strokeWidth={rp.width} fill="none" />
        ))}
        {carsN}
        <g style={{mixBlendMode: 'screen'}}>{beams}</g>
        {clipPolys.length > 0 && (
          <g clipPath={`url(#${id}beam)`} style={{mixBlendMode: 'screen'}}>
            {rain.map((rp, i) => (
              <path key={i} d={rp.d} stroke="#ffffff" strokeOpacity={Math.min(1, rp.op * 2.4)} strokeWidth={rp.width * 1.3} fill="none" />
            ))}
          </g>
        )}
        {/* horizontal blow-out band */}
        {blow > 0.01 && <ellipse cx={w / 2} cy={road - 0.06 * S} rx={w * 0.75} ry={0.16 * S} fill={`url(#${id}band)`} opacity={blow * 0.9} style={{mixBlendMode: 'screen'}} />}
        {/* droplets on the glass, catching the light */}
        <g>
          {drops.map((d, i) => (
            <g key={i}>
              <ellipse cx={d.x} cy={d.y} rx={d.rx} ry={d.ry} fill="#0a0d14" opacity={0.35} />
              <circle cx={d.x - d.rx * 0.3} cy={d.y - d.ry * 0.35} r={Math.max(1, d.rx * 0.35)} fill="#e8f2ff" opacity={0.25 + 0.6 * wallLight} />
            </g>
          ))}
          {trick.map((t, i) => (
            <g key={i}>
              <path d={t.d} stroke="#cfe0ff" strokeOpacity={0.18 + 0.4 * wallLight} strokeWidth={2.2 * u} fill="none" />
              <ellipse cx={t.x} cy={t.y} rx={4 * u} ry={6 * u} fill="#dfeaff" opacity={0.35 + 0.5 * wallLight} />
            </g>
          ))}
        </g>
        {/* interior wall + window frame (silhouette), rim-lit by the beam */}
        <path d={`M0 0H${w}V${h}H0Z M${wx0} ${wy0}V${wy1}H${wx1}V${wy0}Z`} fill="#06070b" fillRule="evenodd" />
        <g fill="#0b0d13" stroke={`rgba(190,220,255,${0.08 + 0.5 * wallLight})`} strokeWidth={1.5 * u}>
          <rect x={wx0 - ft} y={wy0 - ft} width={wx1 - wx0 + 2 * ft} height={ft} />
          <rect x={wx0 - ft} y={wy1} width={wx1 - wx0 + 2 * ft} height={ft * 1.6} />
          <rect x={wx0 - ft} y={wy0} width={ft} height={wy1 - wy0} />
          <rect x={wx1} y={wy0} width={ft} height={wy1 - wy0} />
          <rect x={(wx0 + wx1) / 2 - ft * 0.35} y={wy0} width={ft * 0.7} height={wy1 - wy0} />
          <rect x={wx0} y={wy0 + (wy1 - wy0) * 0.42 - ft * 0.35} width={wx1 - wx0} height={ft * 0.7} />
        </g>
        {/* light spill on the sill / wall */}
        <rect x={wx0 - ft} y={wy1 + ft * 1.6} width={wx1 - wx0 + 2 * ft} height={h - wy1} fill={`url(#${id}band)`} opacity={wallLight * 0.35} />
      </svg>
      <Vignette strength={0.55} />
      {p.grain > 0 && <FilmGrain opacity={p.grain} every={1} />}
    </AbsoluteFill>
  );
};

const Streetlamp: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps} = useStage();
  const id = useSafeId('sl');
  const S = Math.min(w, h);
  const horizon = 0.62 * h;
  const zoom = 1 + (p.push / 100) * (frame / fps);
  const n = Math.max(1, p.lamps);
  const lamps = Array.from({length: n}, (_, i) => {
    const x = n === 1 ? w * 0.5 : w * (0.16 + (0.68 * i) / (n - 1));
    const depth = 1 - 0.25 * Math.abs(i - (n - 1) / 2) / Math.max(1, (n - 1) / 2);
    const top = horizon - (0.42 * h) * depth * (h > w ? 0.7 : 1);
    const on0 = 8 + i * 12;
    // switch-on flicker: on 2 f, off 3 f, on 1 f, off 2 f, then steady (with a faint buzz)
    const lf = frame - on0;
    const pattern = [1, 1, 0, 0, 0, 1, 0, 0];
    const on = lf < 0 ? 0 : lf < pattern.length ? pattern[lf] * 0.8 : 0.93 + 0.07 * Math.sin(frame * 1.7 + i * 3) * (random(`bz${i}${Math.floor(frame / 3)}`) > 0.85 ? 1 : 0.2);
    return {x, top, ground: h * 0.96, on, arm: (i % 2 ? -1 : 1) * 46 * u * depth, s: depth};
  });

  const rain = [2, 1, 0].map((li) => rainPath(frame, w, h, u, li, {density: p.rain, angle: 8, seed: p.seed, fps}));
  const lc = p.lampColor;

  return (
    <AbsoluteFill style={{background: '#04050a', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 60%'}}>
        <AbsoluteFill style={{filter: 'brightness(0.5) saturate(0.85)'}}>
          <Plate src={p.src} seed={p.seed} palette="night" />
        </AbsoluteFill>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id={`${id}road`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0b0d16" stopOpacity={0.85} />
              <stop offset="1" stopColor="#05060b" stopOpacity={1} />
            </linearGradient>
            <filter id={`${id}b12`} x="-50%" y="-20%" width="200%" height="140%">
              <feGaussianBlur stdDeviation={12 * u} />
            </filter>
            <filter id={`${id}b20`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation={18 * u} />
            </filter>
            {lamps.map((l, i) => (
              <linearGradient key={i} id={`${id}cone${i}`} gradientUnits="userSpaceOnUse" x1={0} y1={l.top} x2={0} y2={l.ground}>
                <stop offset="0" stopColor={lc} stopOpacity={0.55} />
                <stop offset="1" stopColor={lc} stopOpacity={0} />
              </linearGradient>
            ))}
            <radialGradient id={`${id}head`}>
              <stop offset="0" stopColor="#fff4dc" stopOpacity={1} />
              <stop offset="0.25" stopColor={lc} stopOpacity={0.7} />
              <stop offset="1" stopColor={lc} stopOpacity={0} />
            </radialGradient>
            <clipPath id={`${id}cones`}>
              {lamps.map((l, i) => {
                const hx = l.x + l.arm;
                const sp = 0.36 * (l.ground - l.top);
                return <polygon key={i} points={`${hx - 8 * u},${l.top + 10 * u} ${hx + 8 * u},${l.top + 10 * u} ${hx + sp},${l.ground} ${hx - sp},${l.ground}`} />;
              })}
            </clipPath>
          </defs>
          {/* wet road / pavement */}
          <rect x={0} y={horizon + 0.12 * h} width={w} height={h} fill={`url(#${id}road)`} />
          <rect x={0} y={horizon + 0.12 * h} width={w} height={2 * u} fill="#2a3150" opacity={0.6} />
          {/* puddle reflections: vertically stretched lamp glows */}
          {lamps.map((l, i) => (
            <ellipse key={`r${i}`} cx={l.x + l.arm} cy={l.ground - 0.08 * h} rx={26 * u * l.s} ry={0.14 * h} fill={lc} opacity={0.4 * l.on} filter={`url(#${id}b20)`} style={{mixBlendMode: 'screen'}} />
          ))}
          {/* dim rain everywhere */}
          {rain.map((rp, i) => (
            <path key={i} d={rp.d} stroke="#9aa6c2" strokeOpacity={rp.op * 0.5} strokeWidth={rp.width} fill="none" />
          ))}
          {/* cones */}
          <g style={{mixBlendMode: 'screen'}}>
            {lamps.map((l, i) => {
              const hx = l.x + l.arm;
              const sp = 0.36 * (l.ground - l.top);
              return (
                <g key={i} opacity={l.on}>
                  <polygon points={`${hx - 8 * u},${l.top + 10 * u} ${hx + 8 * u},${l.top + 10 * u} ${hx + sp},${l.ground} ${hx - sp},${l.ground}`} fill={`url(#${id}cone${i})`} filter={`url(#${id}b12)`} />
                  <ellipse cx={hx} cy={l.ground} rx={sp * 0.9} ry={0.035 * h} fill={lc} opacity={0.22} filter={`url(#${id}b12)`} />
                </g>
              );
            })}
          </g>
          {/* rain streaks lit inside the cones (+30 %) */}
          <g clipPath={`url(#${id}cones)`} style={{mixBlendMode: 'screen'}} opacity={Math.max(...lamps.map((l) => l.on))}>
            {rain.map((rp, i) => (
              <path key={i} d={rp.d} stroke="#ffd2a8" strokeOpacity={Math.min(1, rp.op * 1.9)} strokeWidth={rp.width * 1.2} fill="none" />
            ))}
          </g>
          {/* posts + heads */}
          {lamps.map((l, i) => {
            const hx = l.x + l.arm;
            return (
              <g key={`p${i}`}>
                <rect x={l.x - 4 * u * l.s} y={l.top - 6 * u} width={8 * u * l.s} height={l.ground - l.top + 6 * u} fill="#020205" />
                <path d={`M${l.x} ${l.top}Q${l.x} ${l.top - 22 * u} ${hx} ${l.top - 6 * u}`} stroke="#020205" strokeWidth={7 * u * l.s} fill="none" />
                <path d={`M${hx - 18 * u} ${l.top + 4 * u}L${hx + 18 * u} ${l.top + 4 * u}L${hx + 10 * u} ${l.top - 8 * u}L${hx - 10 * u} ${l.top - 8 * u}Z`} fill="#050507" />
                <circle cx={hx} cy={l.top + 8 * u} r={70 * u} fill={`url(#${id}head)`} opacity={l.on} style={{mixBlendMode: 'screen'}} />
                <rect x={hx - 12 * u} y={l.top + 3 * u} width={24 * u} height={5 * u} rx={2 * u} fill="#fff1d6" opacity={0.15 + 0.85 * l.on} />
              </g>
            );
          })}
        </svg>
      </AbsoluteFill>
      <Vignette strength={0.5} />
      {p.grain > 0 && <FilmGrain opacity={p.grain} every={1} />}
    </AbsoluteFill>
  );
};

const Door: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, cx, cy} = useStage();
  const id = useSafeId('dr');
  const S = Math.min(w, h);
  const vpx = cx;
  const vpy = cy - 0.02 * h;
  // end wall + door
  const dw = 0.17 * S;
  const dh = 0.4 * S;
  const dx0 = cx - dw / 2;
  const dx1 = cx + dw / 2;
  const dyb = cy + 0.16 * S;
  const dyt = dyb - dh;
  const ew = 0.25 * S;
  const ex0 = cx - ew;
  const ex1 = cx + ew;
  const ey0 = dyt - 0.07 * S;
  const ey1 = dyb;
  const zoom = 1 + (p.push / 100) * (frame / fps);

  // door swing 0 -> 80° (ease-in-out, ≈0.5 s), light grows with the angle
  const openT = interpolate(frame, [18, 34], [0, 1], {easing: ease.inOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ang = (80 * Math.PI) / 180 * openT;
  // hinge on the left jamb, the leaf swings toward camera / the left wall
  const freeX = dx0 + dw * Math.cos(ang) - dw * 0.38 * Math.sin(ang);
  const grow = 1 + 0.45 * Math.sin(ang);
  const leaf = `${dx0},${dyt} ${freeX},${dyt - dh * (grow - 1) * 0.5} ${freeX},${dyb + dh * (grow - 1) * 0.5} ${dx0},${dyb}`;
  const openFrac = clamp((dx1 - Math.max(dx0, freeX)) / dw);
  const light = prog(frame, 20, 44, ease.out);

  // floor projection through the vanishing point
  const toBottom = (x: number, y: number) => vpx + (x - vpx) * ((h - vpy) / (y - vpy));
  const lx1 = dx1;
  const lx0 = dx1 - dw * Math.min(1, openFrac * 1.05);
  const floorLight = `${lx0},${dyb} ${lx1},${dyb} ${toBottom(lx1, dyb) + 0.06 * w},${h} ${toBottom(lx0, dyb) - 0.04 * w},${h}`;

  // figure steps into the doorway from the right (frames 58-84) and then holds
  const fIn = interpolate(frame, [58, 84], [0, 1], {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fx = cx + dw * 0.75 * (1 - fIn) - dw * 0.05;
  const fh = dh * 0.82;
  const fwid = fh * 0.23;
  const figOn = p.figure && fIn > 0;
  const bob = Math.sin(frame * 0.5) * 2 * u * (1 - fIn);
  const fig = (x: number) => {
    const yb = dyb + bob;
    const hr = fh * 0.075;
    return `M${x - fwid * 0.28} ${yb}L${x - fwid * 0.22} ${yb - fh * 0.46}L${x - fwid * 0.5} ${yb - fh * 0.5}L${x - fwid * 0.46} ${yb - fh * 0.8}Q${x} ${yb - fh * 0.87} ${x + fwid * 0.46} ${yb - fh * 0.8}L${x + fwid * 0.5} ${yb - fh * 0.5}L${x + fwid * 0.22} ${yb - fh * 0.46}L${x + fwid * 0.28} ${yb}L${x + fwid * 0.05} ${yb}L${x} ${yb - fh * 0.4}L${x - fwid * 0.05} ${yb}Z M${x + hr} ${yb - fh * 0.9}a${hr} ${hr * 1.15} 0 1 0 ${-2 * hr} 0a${hr} ${hr * 1.15} 0 1 0 ${2 * hr} 0Z`;
  };
  const sw = fwid * 0.32;
  const shadow = `${fx - sw},${dyb} ${fx + sw},${dyb} ${toBottom(fx + sw * 2.4, dyb) + 0.05 * w},${h} ${toBottom(fx - sw * 2.4, dyb) - 0.0 * w},${h}`;

  const r = rng(p.seed * 17 + 2);
  const motes = Array.from({length: 40}, (_, i) => {
    const t = r();
    const yy = dyb + (h - dyb) * (0.1 + 0.8 * r()) - 0.25 * h * r();
    const xx = toBottom(lx0 + (lx1 - lx0) * t, dyb) * 0 + (lx0 + (lx1 - lx0) * t) + (yy - dyb) * (t - 0.4) * 0.9;
    return {x: xx + Math.sin(frame * 0.03 + i) * 10 * u, y: yy - ((frame * (0.3 + 0.5 * r())) % 60) * u, r: (1 + 2 * r()) * u, a: 0.3 + 0.5 * r()};
  });

  const lightC = p.lightColor;
  return (
    <AbsoluteFill style={{background: '#030305', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `50% 52%`}}>
        {/* bright exterior visible through the door opening */}
        <AbsoluteFill style={{clipPath: `polygon(${dx0}px ${dyt}px, ${dx1}px ${dyt}px, ${dx1}px ${dyb}px, ${dx0}px ${dyb}px)`, filter: `brightness(${1.1 + 0.5 * (1 - light)})`}}>
          <div style={{position: 'absolute', left: dx0 - dw * 1.5, top: dyt - dh * 0.4, width: dw * 4, height: dh * 1.6}}>
            <Plate src={p.src} seed={p.seed} palette="dawn" width={dw * 4} height={dh * 1.6} />
          </div>
        </AbsoluteFill>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id={`${id}fl`} gradientUnits="userSpaceOnUse" x1={0} y1={dyb} x2={0} y2={h}>
              <stop offset="0" stopColor={lightC} stopOpacity={0.75} />
              <stop offset="0.6" stopColor={lightC} stopOpacity={0.4} />
              <stop offset="1" stopColor={lightC} stopOpacity={0.12} />
            </linearGradient>
            <radialGradient id={`${id}bl`}>
              <stop offset="0" stopColor="#ffffff" stopOpacity={0.9} />
              <stop offset="0.35" stopColor={lightC} stopOpacity={0.45} />
              <stop offset="1" stopColor={lightC} stopOpacity={0} />
            </radialGradient>
            <linearGradient id={`${id}wl`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#0a090d" />
              <stop offset="1" stopColor="#1b1820" />
            </linearGradient>
            <linearGradient id={`${id}wr`} x1="1" x2="0" y1="0" y2="0">
              <stop offset="0" stopColor="#0a090d" />
              <stop offset="1" stopColor="#1b1820" />
            </linearGradient>
            <filter id={`${id}b`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={6 * u} />
            </filter>
            <clipPath id={`${id}flc`}>
              <polygon points={floorLight} />
            </clipPath>
          </defs>
          {/* corridor: ceiling, floor, side walls, end wall with the door hole */}
          <polygon points={`0,0 ${w},0 ${ex1},${ey0} ${ex0},${ey0}`} fill="#0c0b10" />
          <polygon points={`0,${h} ${w},${h} ${ex1},${ey1} ${ex0},${ey1}`} fill="#100e13" />
          <polygon points={`0,0 ${ex0},${ey0} ${ex0},${ey1} 0,${h}`} fill={`url(#${id}wl)`} />
          <polygon points={`${w},0 ${ex1},${ey0} ${ex1},${ey1} ${w},${h}`} fill={`url(#${id}wr)`} />
          <path d={`M${ex0} ${ey0}H${ex1}V${ey1}H${ex0}Z M${dx0} ${dyt}V${dyb}H${dx1}V${dyt}Z`} fill="#1f1c25" fillRule="evenodd" />
          {/* floorboards + baseboards converging to the vanishing point */}
          <g stroke="#1d1a22" strokeWidth={1.5 * u}>
            {Array.from({length: 9}, (_, i) => {
              const x = ex0 + ((ex1 - ex0) * (i + 0.5)) / 9;
              return <line key={i} x1={x} y1={ey1} x2={toBottom(x, ey1)} y2={h} />;
            })}
            <line x1={ex0} y1={ey1 - 8 * u} x2={0} y2={h - 0.2 * h} />
            <line x1={ex1} y1={ey1 - 8 * u} x2={w} y2={h - 0.2 * h} />
          </g>
          {/* framed pictures on the side walls */}
          <polygon points={`${0.12 * w},${0.28 * h} ${0.24 * w},${0.34 * h} ${0.24 * w},${0.5 * h} ${0.12 * w},${0.55 * h}`} fill="#15131a" stroke="#221f28" strokeWidth={3 * u} />
          <polygon points={`${0.88 * w},${0.3 * h} ${0.78 * w},${0.35 * h} ${0.78 * w},${0.48 * h} ${0.88 * w},${0.52 * h}`} fill="#15131a" stroke="#221f28" strokeWidth={3 * u} />
          {/* floor light flood + long cast shadow */}
          <g opacity={light} style={{mixBlendMode: 'screen'}}>
            <polygon points={floorLight} fill={`url(#${id}fl)`} filter={`url(#${id}b)`} />
          </g>
          {figOn && (
            <g clipPath={`url(#${id}flc)`} opacity={light * fIn}>
              <polygon points={shadow} fill="#07060a" opacity={0.85} filter={`url(#${id}b)`} />
            </g>
          )}
          {/* door leaf swinging into the corridor */}
          <polygon points={leaf} fill="#0d0b10" stroke="#2a2630" strokeWidth={1.5 * u} />
          <polygon points={leaf} fill={lightC} opacity={0.06 * light} />
          {/* doorway bloom */}
          <ellipse cx={cx} cy={(dyt + dyb) / 2} rx={dw * 1.8 * (0.4 + 0.6 * light)} ry={dh * 1.0 * (0.4 + 0.6 * light)} fill={`url(#${id}bl)`} opacity={light * 0.85} style={{mixBlendMode: 'screen'}} />
          {/* figure silhouette in the doorway */}
          {figOn && <path d={fig(fx)} fill="#040306" fillRule="nonzero" />}
          {/* dust motes in the shaft */}
          <g opacity={light}>
            {motes.map((m, i) => (
              <circle key={i} cx={m.x} cy={m.y} r={m.r} fill="#fff3da" opacity={m.a} />
            ))}
          </g>
        </svg>
      </AbsoluteFill>
      <Vignette strength={0.55} />
      {p.grain > 0 && <FilmGrain opacity={p.grain} every={1} />}
    </AbsoluteFill>
  );
};

const LightSweep: React.FC<Props> = (p) => (p.mode === 'reveal' ? <RevealSweep {...p} /> : p.mode === 'neon' ? <NeonBands {...p} /> : p.mode === 'streetlamp' ? <Streetlamp {...p} /> : p.mode === 'door' ? <Door {...p} /> : <Headlight {...p} />);

export const lightSweep = defineMotion<Props>({
  id: 'light-sweep',
  title: 'Night light sweep',
  category: 'image',
  description: 'Cinematic night lighting: headlights sweep across a rain-streaked window, sodium street lamps flicker on with volumetric cones through rain, or a door opens and floods a corridor floor with light and a long shadow.',
  source: ['video16 0:56.5-0:57.6 headlight-sweep', 'video16 light-cone-volumetric + rain-overlay', 'video16 door-light-flood'],
  useFor: 'Mood beats in night scenes: a car passing, arriving somewhere at night, a reveal of someone at the door.',
  durationInFrames: 150,
  defaultProps: {
    src: '',
    seed: 1,
    mode: 'headlight',
    color: '#E8F4FF',
    beamSpread: 20,
    rain: 0.8,
    lamps: 3,
    lampColor: '#F0904F',
    lightColor: '#FFE6B8',
    figure: true,
    push: 1,
    grain: 0.08,
    sweepStart: 10,
    sweepFrames: 39,
    base: 0.07,
    soft: 0.26,
    angle: 0.62,
    glint: 0.2,
    keep: true,
    bands: ['#FF3DB4', '#2FE6FF', '#FFC93D'],
    bandDir: 'ltr',
    bandFrames: 24,
    bandWidth: 0.16,
    palette: 'night',
  },
  propDocs: {
    src: 'public/ image for the outside view (window / street / doorway); empty = procedural night (dawn for door)',
    seed: 'procedural plate / rain / droplet seed',
    mode: 'headlight | streetlamp | door | reveal (dim picture lit by a passing soft diagonal band of light) | neon (bands of coloured light slide across a held picture)',
    sweepStart: 'reveal: frame the sweep starts',
    sweepFrames: 'reveal: frames the sweep takes (~1.3 s = 39)',
    base: 'reveal: brightness of the unlit picture (0.07)',
    soft: 'reveal: band softness as a fraction of the sweep (0.26)',
    angle: 'reveal: band tilt in radians (0.62)',
    glint: 'reveal: glint riding the front, 0 = none (<= 0.2)',
    keep: 'reveal: stay lit after the band passes (false = the band lights only what it covers)',
    bands: 'neon: band colours (magenta / cyan / gold)',
    bandDir: 'neon: ltr | rtl',
    bandFrames: 'neon: frames one band takes to cross',
    bandWidth: 'neon: band width as a fraction of the frame diagonal',
    palette: 'procedural plate palette when no src (dusk | night | dawn)',
    color: 'headlight beam colour',
    beamSpread: 'headlight wedge spread in degrees (20)',
    rain: 'rain density multiplier (0 = dry)',
    lamps: 'streetlamp: number of lamps',
    lampColor: 'streetlamp: sodium colour (#F0904F)',
    lightColor: 'door: light colour (#FFE6B8)',
    figure: 'door: a figure steps into the doorway and casts a long shadow',
    push: 'slow push-in in %/s',
    grain: 'film grain amount',
  },
  component: LightSweep,
  tags: ['image', 'light', 'night', 'headlight', 'street-lamp', 'volumetric', 'rain', 'door', 'shadow', 'cinematic', 'reveal', 'light reveal', 'neon', 'band sweep', 'glint', 'hero reveal', 'dashboard reveal'],
});
