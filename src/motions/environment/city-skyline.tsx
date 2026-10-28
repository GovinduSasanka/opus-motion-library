import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {rng, range} from '../../core/random';
import {FilmGrain, PaperTexture, Svg, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {Moon, Stars, mix, polysD} from '../../core/world-kit';

type Props = {
  style: 'flat' | 'sketch';
  pullback: boolean;
  pullFrom: number;
  pullFrames: number;
  toNight: boolean;
  litRatio: number;
  stepFrames: number;
  windowColor: string;
  traffic: boolean;
  seed: string;
  /** round-2: 'sequence' = windows pop on one by one on a cadence, each with a bloom, until the whole place glows */
  lightsMode: 'flicker' | 'sequence';
  lightsStart: number;
  lightsSpan: number;
  cadence: number;
  glowColor: string;
};

type Bld = {x: number; bw: number; bh: number; row: number; setback: number; antenna: boolean; boxes: number; gable: boolean; side: number; tone: number; ww: number; wh: number; gx: number; gy: number; seed: number; tank: boolean};

const ROWS = 3;

const hash = (a: number, b: number) => {
  let x = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35);
  x ^= x >>> 15;
  x = Math.imul(x, 0x2c1b3c6d);
  x ^= x >>> 12;
  return (x >>> 0) / 4294967296;
};

const CitySkyline: React.FC<Props> = ({style, pullback, pullFrom, pullFrames, toNight, litRatio, stepFrames, windowColor, traffic, seed, lightsMode, lightsStart, lightsSpan, cadence, glowColor}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, durationInFrames: D, portrait} = useStage();
  const id = `city-skyline-${seed}`;
  const sketch = style === 'sketch';
  const gy = h * (portrait ? 0.8 : 0.84);

  const blds = useMemo(() => {
    const r = rng(`${seed}-city`);
    const out: Bld[] = [];
    for (let row = 0; row < ROWS; row++) {
      const k = row / (ROWS - 1); // 0 back .. 1 front
      let x = -60 * u - r() * 80 * u;
      while (x < w + 60 * u) {
        const bw = range(r, 90, 190) * u * (0.8 + 0.35 * k);
        const tall = Math.pow(r(), 1.6);
        const bh = (portrait ? h * 0.75 : h) * (0.16 + 0.42 * tall) * (1.15 - 0.35 * k) + range(r, 0, 40) * u;
        out.push({
          x,
          bw,
          bh,
          row,
          setback: r() < 0.35 ? range(r, 0.15, 0.3) : 0,
          antenna: tall > 0.55 && r() < 0.6,
          boxes: Math.floor(r() * 3),
          gable: k > 0.9 && bh < h * 0.22 && r() < 0.5,
          side: r() < 0.6 ? range(r, 0.1, 0.16) : 0,
          tone: r(),
          ww: (8 + 4 * k) * u,
          wh: (11 + 6 * k) * u,
          gx: (7 + 4 * k) * u,
          gy: (9 + 5 * k) * u,
          seed: Math.floor(r() * 1e6),
          tank: r() < 0.18,
        });
        x += bw + range(r, -0.15, 0.25) * bw * (1 - k * 0.5);
      }
    }
    return out;
  }, [seed, w, h, u, portrait]);

  // time of day
  const night = toNight ? prog(frame, D * 0.08, D * 0.7, ease.sine) : sketch ? 0 : 1;
  const sky = sketch
    ? ['#efe3cc', '#ead8bf', '#e8d6c0']
    : [mix('#5b4a7a', '#070b24', night), mix('#c97b7b', '#16204a', night), mix('#f2b98a', '#33396a', night)];
  const rowCol = (row: number, tone: number) => {
    if (sketch) return ['#e2c9b5', '#cdb8c4', '#c9cdb0', '#b9c3c9', '#e3b9a0'][Math.floor(tone * 5)];
    const dusk = ['#8d7393', '#6a5578', '#4a3b5c'][row];
    const nite = ['#2b3358', '#1c2344', '#121731'][row];
    return mix(mix(dusk, nite, night), '#000000', tone * 0.12);
  };
  const lit = clamp(litRatio * (sketch ? 0.6 : 0.35 + 0.65 * night));
  const step = Math.floor(frame / Math.max(1, stepFrames));
  const seq = lightsMode === 'sequence';
  const cadenceF = Math.max(1, cadence);

  // crane pull-back camera (video20: x12 distance, bezier .4,0,.2,1, slight yaw)
  const pb = pullback ? interpolate(frame, [pullFrom, pullFrom + pullFrames], [0, 1], {easing: Easing.bezier(0.4, 0, 0.2, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  const hero = blds.filter((b) => b.row === ROWS - 1).reduce((best, b) => (Math.abs(b.x + b.bw / 2 - w * 0.5) < Math.abs(best.x + best.bw / 2 - w * 0.5) ? b : best));
  const ax = hero.x + hero.bw * 0.5;
  const ay = gy - hero.bh * 0.55;
  const S = 1 + 2.6 * (1 - pb);
  const px = interpolate(pb, [0, 1], [cx, ax]);
  const py = interpolate(pb, [0, 1], [cy, ay]);
  const rot = -5 * (1 - pb);

  const ink = sketch ? '#2e2a26' : 'none';
  const sw = 1.6 * u;

  const rowsOut = Array.from({length: ROWS}, (_, row) => {
    const bs = blds.filter((b) => b.row === row);
    const k = row / (ROWS - 1);
    const lift = (1 - k) * 0.05 * h; // back rows sit a little higher (farther ground)
    const on: [number, number][][] = [];
    const flash: [number, number][][] = [];
    const off: [number, number][][] = [];
    const bodies: React.ReactNode[] = [];
    bs.forEach((b, bi) => {
      const top = gy - lift - b.bh;
      const base = gy - lift;
      const col = rowCol(row, b.tone);
      const sideCol = mix(col, '#000000', 0.22);
      const sb = b.setback * b.bw;
      const upperTop = top - (b.setback ? b.bh * 0.12 : 0);
      bodies.push(
        <g key={bi}>
          {b.side > 0 && <polygon points={`${b.x + b.bw},${top} ${b.x + b.bw * (1 + b.side)},${top + b.bw * b.side * 0.4} ${b.x + b.bw * (1 + b.side)},${base} ${b.x + b.bw},${base}`} fill={sideCol} stroke={ink} strokeWidth={sw} />}
          <rect x={b.x} y={top} width={b.bw} height={base - top} fill={col} stroke={ink} strokeWidth={sw} />
          {b.side > 0 && <rect x={b.x + b.bw} y={top} width={b.bw * b.side} height={base - top} fill={`url(#${id}-hatch)`} opacity={sketch ? 0.7 : 0.35} />}
          {sketch && <rect x={b.x} y={top} width={b.bw} height={base - top} fill={`url(#${id}-hatch2)`} opacity={0.45} />}
          {b.setback > 0 && <rect x={b.x + sb} y={upperTop} width={b.bw - 2 * sb} height={top - upperTop + 1} fill={col} stroke={ink} strokeWidth={sw} />}
          {b.gable && <polygon points={`${b.x - 4 * u},${top} ${b.x + b.bw / 2},${top - b.bw * 0.35} ${b.x + b.bw + 4 * u},${top}`} fill={mix(col, '#7a3f3a', sketch ? 0.35 : 0.25)} stroke={ink} strokeWidth={sw} />}
          {!b.gable &&
            Array.from({length: b.boxes}, (_, j) => {
              const bx = b.x + sb + (b.bw - 2 * sb) * (0.15 + j * 0.4);
              const bsz = (10 + (j % 2) * 8) * u;
              return <rect key={j} x={bx} y={upperTop - bsz} width={bsz * 1.4} height={bsz} fill={mix(col, '#000', 0.1)} stroke={ink} strokeWidth={sw * 0.8} />;
            })}
          {b.tank && !b.gable && (
            <g>
              <path d={`M${b.x + b.bw * 0.7} ${upperTop}L${b.x + b.bw * 0.7} ${upperTop - 14 * u}M${b.x + b.bw * 0.86} ${upperTop}L${b.x + b.bw * 0.86} ${upperTop - 14 * u}`} stroke={sketch ? ink : mix(col, '#000', 0.3)} strokeWidth={2 * u} />
              <rect x={b.x + b.bw * 0.66} y={upperTop - 40 * u} width={b.bw * 0.24} height={26 * u} rx={4 * u} fill={mix(col, '#000', 0.18)} stroke={ink} strokeWidth={sw * 0.8} />
              <polygon points={`${b.x + b.bw * 0.66},${upperTop - 40 * u} ${b.x + b.bw * 0.78},${upperTop - 52 * u} ${b.x + b.bw * 0.9},${upperTop - 40 * u}`} fill={mix(col, '#000', 0.25)} />
            </g>
          )}
          {b.antenna && (
            <g>
              <line x1={b.x + b.bw / 2} y1={upperTop} x2={b.x + b.bw / 2} y2={upperTop - b.bh * 0.18} stroke={sketch ? ink : mix(col, '#000', 0.2)} strokeWidth={2.4 * u} />
              {!sketch && <circle cx={b.x + b.bw / 2} cy={upperTop - b.bh * 0.18} r={3.5 * u} fill="#ff5a4a" opacity={0.4 + 0.6 * (Math.floor(frame / 15 + b.seed) % 2) * night} />}
            </g>
          )}
          {sketch && (
            // architect overshoot lines
            <path
              d={`M${b.x - 10 * u} ${top}L${b.x + b.bw + 10 * u} ${top}M${b.x} ${top - 10 * u}L${b.x} ${base}M${b.x + b.bw} ${top - 10 * u}L${b.x + b.bw} ${base}`}
              stroke={ink}
              strokeWidth={sw * 0.8}
              opacity={0.7}
            />
          )}
        </g>,
      );
      // window grid
      const cols = Math.floor((b.bw - 2 * b.gx) / (b.ww + b.gx));
      const rowsN = Math.floor((base - top - 2 * b.gy - 8 * u) / (b.wh + b.gy));
      if (cols < 1 || rowsN < 1) return;
      const ox = b.x + (b.bw - (cols * (b.ww + b.gx) - b.gx)) / 2;
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rowsN; j++) {
          const wi = i * 131 + j * 7 + b.seed;
          const hold = 6 + Math.floor(hash(wi, 3) * 34);
          const st = hash(wi, Math.floor((step + hash(wi, 9) * hold) / hold));
          const x0 = ox + i * (b.ww + b.gx);
          const y0 = top + b.gy + 6 * u + j * (b.wh + b.gy);
          const q: [number, number][] = [[x0, y0], [x0 + b.ww, y0], [x0 + b.ww, y0 + b.wh], [x0, y0 + b.wh]];
          if (seq) {
            const onAt = lightsStart + Math.floor((hash(wi, 21) * lightsSpan) / cadenceF) * cadenceF;
            if (frame >= onAt) {
              on.push(q);
              if (frame < onAt + 5) flash.push(q);
            } else off.push(q);
          } else (st < lit ? on : off).push(q);
        }
    });
    const winOff = sketch ? '#c6b9a7' : mix(mix(rowCol(row, 0.5), '#000', 0.35), '#3b3e42', 0.3);
    return (
      <g key={row} opacity={1}>
        {lift > 0 && <rect x={-w} y={gy - lift - 1} width={w * 3} height={lift + 2} fill={rowCol(row, 0.6)} />}
        {bodies}
        <path d={polysD(off)} fill={winOff} opacity={sketch ? 0.8 : 0.9} stroke={sketch ? ink : 'none'} strokeWidth={sw * 0.5} />
        {!sketch && <path d={polysD(on)} fill={seq ? glowColor || windowColor : windowColor} filter={`url(#${id}-glow)`} opacity={0.55 * (0.4 + 0.6 * night)} />}
        <path d={polysD(on)} fill={seq ? glowColor || windowColor : windowColor} opacity={sketch ? 0.95 : 0.6 + 0.4 * night} stroke={sketch ? ink : 'none'} strokeWidth={sw * 0.5} />
        {seq && flash.length > 0 && <path d={polysD(flash)} fill="#FFFFFF" opacity={0.85} filter={`url(#${id}-bloom)`} />}
        {/* atmospheric fade toward the sky colour for far rows */}
        {!sketch && row < ROWS - 1 && <rect x={-w} y={-h} width={w * 3} height={gy - lift + h} fill={sky[2]} opacity={(1 - k) * 0.28 * (1 - night * 0.5)} />}
        {sketch && row < ROWS - 1 && <rect x={-w} y={-h} width={w * 3} height={gy - lift + h} fill={sky[2]} opacity={(1 - k) * 0.4} />}
      </g>
    );
  });

  // traffic: little head/tail light pairs on the street
  const cars = traffic
    ? Array.from({length: 14}, (_, i) => {
        const r = rng(`${seed}-car${i}`);
        const dir = i % 2 ? 1 : -1;
        const sp = range(r, 4, 8) * u;
        const lane = gy + (dir > 0 ? 0.04 : 0.075) * h;
        const x = (((r() * w * 1.4 + dir * frame * sp) % (w * 1.4)) + w * 1.4) % (w * 1.4) - w * 0.2;
        return {x, y: lane, dir};
      })
    : [];

  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 55%, ${sky[2]} 100%)`}}>
      {sketch && <PaperTexture opacity={0.45} />}
      <Svg>
        <defs>
          <pattern id={`${id}-hatch`} patternUnits="userSpaceOnUse" width={6 * u} height={6 * u} patternTransform="rotate(62)">
            <line x1={0} y1={0} x2={0} y2={6 * u} stroke={sketch ? '#5a4a3a' : '#000'} strokeWidth={1.1 * u} opacity={0.7} />
          </pattern>
          <pattern id={`${id}-hatch2`} patternUnits="userSpaceOnUse" width={7 * u} height={7 * u} patternTransform="rotate(62)">
            <line x1={0} y1={0} x2={0} y2={7 * u} stroke="#7a6550" strokeWidth={0.9 * u} opacity={0.6} />
          </pattern>
          <filter id={`${id}-bloom`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={9 * u} />
          </filter>
          <filter id={`${id}-glow`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={5 * u} />
          </filter>
        </defs>
        {!sketch && <Stars w={w} h={h} u={u} frame={frame} count={120} seed={`${seed}-st`} opacity={night} maxY={0.55} />}
        {!sketch && <Moon id={`${id}-moon`} x={w * (portrait ? 0.74 : 0.84)} y={h * ((portrait ? 0.24 : 0.26) - 0.12 * night)} r={30 * u} opacity={night} />}
        <g transform={`translate(${px},${py}) rotate(${rot}) scale(${S}) translate(${-ax},${-ay})`}>
          {rowsOut}
          {/* street */}
          <rect x={-w} y={gy} width={w * 3} height={h} fill={sketch ? '#d9cfb8' : mix('#3a2f45', '#0b0e1d', night)} stroke={ink} strokeWidth={sw} />
          <rect x={-w} y={gy} width={w * 3} height={h} fill={`url(#${id}-hatch2)`} opacity={sketch ? 0.5 : 0} />
          <line x1={-w} y1={gy + 0.058 * h} x2={w * 2} y2={gy + 0.058 * h} stroke={sketch ? '#2e2a26' : '#e8d9a8'} strokeWidth={2 * u} strokeDasharray={`${30 * u} ${24 * u}`} opacity={0.45} />
          {cars.map((c, i) => (
            <g key={i}>
              <rect x={c.x} y={c.y - 9 * u} width={46 * u} height={14 * u} rx={5 * u} fill={sketch ? ['#cf8465', '#626d79', '#e5c88b'][i % 3] : mix('#3d3550', '#05060d', night)} stroke={ink} strokeWidth={sw * 0.8} />
              <circle cx={c.dir > 0 ? c.x + 46 * u : c.x} cy={c.y} r={3.5 * u} fill="#fff4c8" opacity={night} />
              <circle cx={c.dir > 0 ? c.x : c.x + 46 * u} cy={c.y} r={3 * u} fill="#ff4a3a" opacity={night} />
              {!sketch && <path d={`M${c.dir > 0 ? c.x + 46 * u : c.x} ${c.y}l${c.dir * 70 * u} ${-10 * u}l0 ${20 * u}Z`} fill="#fff4c8" opacity={0.15 * night} />}
            </g>
          ))}
        </g>
      </Svg>
      {sketch ? <Vignette strength={0.25} color="120,100,80" /> : <Vignette strength={0.35} />}
      <FilmGrain opacity={sketch ? 0.05 : 0.06} />
    </AbsoluteFill>
  );
};

export const citySkyline = defineMotion<Props>({
  id: 'city-skyline',
  title: 'City skyline (window flicker, dusk to night)',
  category: 'environment',
  description:
    'Seeded procedural city: three depth rows of buildings with setbacks, water tanks, antennas and window grids that flicker on and off; the sky goes from dusk to night as more windows light up, with traffic on the street and an optional aerial crane pull-back from one window to the whole skyline. Sketch style gives the hatched pencil-on-paper look.',
  source: ['video20 3:16-3:36 procedural-sketch-city + crane-pullback-reveal', 'video2 window-grid-flicker'],
  useFor: 'Urban establishing shots, "the city at night", time passing, ending pull-backs, backdrops behind titles.',
  durationInFrames: 210,
  defaultProps: {
    style: 'flat',
    pullback: true,
    pullFrom: 0,
    pullFrames: 105,
    toNight: true,
    litRatio: 0.55,
    stepFrames: 5,
    windowColor: '#f2d27a',
    traffic: true,
    seed: 'metro',
    lightsMode: 'flicker',
    lightsStart: 20,
    lightsSpan: 110,
    cadence: 3,
    glowColor: '',
  },
  propDocs: {
    style: '"flat" dusk/night silhouettes or "sketch" hatched pencil-on-paper (video20)',
    pullback: 'start close on one window and crane back to the whole city',
    pullFrom: 'frame the pull-back starts',
    pullFrames: 'pull-back length (bezier .4,0,.2,1)',
    toNight: 'sky grades from dusk to night while windows switch on (flat style)',
    litRatio: 'share of windows lit at full night',
    stepFrames: 'frames between window flicker steps (5 = 0.17 s)',
    windowColor: 'lit window colour',
    traffic: 'cars with head/tail lights on the street',
    seed: 'city seed',
    lightsMode: "'flicker' (default, windows toggle randomly) | 'sequence' (every window lights once, one by one on the cadence, with a white bloom pop, until the city glows)",
    lightsStart: 'sequence: first frame a window can light',
    lightsSpan: 'sequence: frames over which all windows have lit',
    cadence: 'sequence: lighting steps every N frames (2-4 = steady cadence; match the beat)',
    glowColor: 'sequence: lit window / glow colour (empty = windowColor)',
  },
  component: CitySkyline,
  tags: ['city', 'skyline', 'night', 'windows', 'urban', 'pullback', 'lights-on', 'electrification', 'network', 'growth', 'cadence'],
});
