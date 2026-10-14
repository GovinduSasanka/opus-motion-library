import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, onTwos} from '../../core/ease';
import {rng, range} from '../../core/random';
import {FilmGrain, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {GrassField, PaperCraneSide, Stars, circlesD, makeRidge, mix, ridgePath, tealRows} from '../../core/world-kit';

type Props = {
  mode: 'truck' | 'speedrun';
  palette: 'auto' | 'day' | 'savanna' | 'dusk';
  speed: number;
  peakSpeed: number;
  layerFactors: number[];
  rampIn: number;
  rampOut: number;
  hero: 'crane' | 'none';
  streaks: boolean;
  grain: number;
  seed: string;
};

type Pal = {
  sky: [string, string, string];
  far: string;
  near: string;
  fields: string[];
  hill: string;
  tree: string;
  treeDark: string;
  ground: string;
  fg: string;
  house: string[];
  cloud: string;
  night: boolean;
};

const PALETTES: Record<'day' | 'savanna' | 'dusk', Pal> = {
  day: {
    sky: ['#86abc8', '#a2c0d4', '#c9d9dc'],
    far: '#9db4b3',
    near: '#75938c',
    fields: ['#bfba79', '#8bad7d', '#a9b56c', '#79a958'],
    hill: '#79a958',
    tree: '#4f7f45',
    treeDark: '#3d6838',
    ground: '#6f9f52',
    fg: '#4f8240',
    house: ['#e8e1d0', '#8b5a4a', '#5e6278'],
    cloud: '#f2efe8',
    night: false,
  },
  savanna: {
    sky: ['#0c1820', '#0d1921', '#132028'],
    far: '#4a2a22',
    near: '#68382a',
    fields: ['#4a2a22', '#55301f'],
    hill: '#3a2420',
    tree: '#16262c',
    treeDark: '#0f1c21',
    ground: '#14232a',
    fg: '#253a43',
    house: ['#2a2a2a'],
    cloud: '#1b2a33',
    night: true,
  },
  dusk: {
    sky: ['#5d3f6e', '#bb727d', '#f0c49a'],
    far: '#8a6a86',
    near: '#65536e',
    fields: ['#6f5a72', '#5a4a63'],
    hill: '#50425e',
    tree: '#3a2f48',
    treeDark: '#2c2438',
    ground: '#50425e',
    fg: '#2c2438',
    house: ['#3a2f48'],
    cloud: '#f5d7c0',
    night: false,
  },
};

const ParallaxLandscape: React.FC<Props> = ({mode, palette, speed, peakSpeed, layerFactors, rampIn, rampOut, hero, streaks, grain, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: D, portrait} = useStage();
  const run = mode === 'speedrun';
  const pal = PALETTES[palette === 'auto' ? (run ? 'savanna' : 'day') : palette];
  const id = `parallax-landscape-${seed}`;

  // foreground velocity (px/frame) and its integral (camera x)
  const vel = (f: number) => {
    if (!run) return speed * u;
    const a = 10;
    const up = ease.in(clamp((f - a) / rampIn));
    const down = 1 - ease.out(clamp((f - (D - rampOut - 14)) / rampOut));
    return peakSpeed * u * up * down;
  };
  let X = 0;
  for (let f = 0; f < frame; f++) X += vel(f);
  const v = vel(frame);
  const vn = run ? v / (peakSpeed * u) : 0;
  const lf = layerFactors.length >= 7 ? layerFactors : run ? [0.08, 0.16, 0.2, 0.24, 0.32, 1, 1.6] : [0.06, 0.14, 0.3, 0.45, 0.7, 1, 1.6];
  const [fSky, fFar, fNear, fFields, fHill, fTree, fFg, fFront] = [0.03, ...lf];

  const Pl = Math.ceil(w * 1.3);
  const hz = h * (run ? 0.7 : portrait ? 0.5 : 0.55);

  /** a periodic layer: content(Pl) drawn twice, translated by camera*factor */
  const Layer: React.FC<{factor: number; blur?: number; children: React.ReactNode; lid: string}> = ({factor, blur = 0, children, lid}) => {
    const o = ((X * factor) % Pl + Pl) % Pl;
    const b = run ? blur * v * factor : 0;
    return (
      <g filter={b > 0.5 ? `url(#${id}-${lid}-bl)` : undefined}>
        {b > 0.5 && (
          <defs>
            <filter id={`${id}-${lid}-bl`} x="-20%" y="-5%" width="140%" height="110%">
              <feGaussianBlur stdDeviation={`${b.toFixed(1)} 0`} />
            </filter>
          </defs>
        )}
        <g transform={`translate(${-o},0)`}>
          <g>{children}</g>
          <g transform={`translate(${Pl},0)`}>{children}</g>
        </g>
      </g>
    );
  };

  const r = rng(`${seed}-items`);
  const farR = makeRidge(`${seed}-far`, Pl, [1, 2, 3, 5, 8, 13], 0.6);
  const nearR = makeRidge(`${seed}-near`, Pl, [2, 3, 5, 7, 11], 0.6);
  const hillR = makeRidge(`${seed}-hill`, Pl, [1, 2, 3, 5], 0.55);
  const fgR = makeRidge(`${seed}-fg`, Pl, [2, 3, 6], 0.5);
  const dup = <T extends {x: number}>(arr: T[], m: number) => [...arr, ...arr.filter((a) => a.x < m).map((a) => ({...a, x: a.x + Pl})), ...arr.filter((a) => a.x > Pl - m).map((a) => ({...a, x: a.x - Pl}))];

  // ---- items
  const clouds = Array.from({length: run ? 0 : 5}, (_, i) => ({x: (i / 5) * Pl + range(r, 0, Pl / 6), y: range(r, 0.08, 0.3) * h, s: range(r, 0.7, 1.3)}));
  const houses = dup(Array.from({length: 26}, () => ({x: r() * Pl, s: range(r, 0.7, 1.2), c: Math.floor(r() * 3)})), 30 * u);
  const hillY = hz + (run ? 0.02 : 0.1) * h;
  const treesHill = dup(Array.from({length: 18}, () => ({x: r() * Pl, s: range(r, 0.6, 1.1)})), 40 * u);
  const treeRowY = hz + (run ? 0.06 : 0.2) * h;
  const treeRow = dup(Array.from({length: run ? 5 : 11}, (_, i) => ({x: (i / (run ? 5 : 11)) * Pl + range(r, -30, 30) * u, s: range(r, 0.8, 1.25)})), 260 * u);
  const fgY = hz + (run ? 0.18 : 0.36) * h;
  const tufts = dup(Array.from({length: 40}, () => ({x: r() * Pl, y: range(r, 0.02, 0.5), s: range(r, 0.7, 1.4)})), 30 * u);
  const front = dup(Array.from({length: run ? 3 : 4}, (_, i) => ({x: (i / (run ? 3 : 4)) * Pl + range(r, 0, 200) * u, hh: range(r, 0.35, 0.6) * h})), 60 * u);

  const tree = (x: number, y: number, s: number, key: React.Key, c1: string, c2: string) =>
    run ? (
      // acacia: thin trunk + flat umbrella canopy
      <g key={key} transform={`translate(${x},${y}) scale(${s})`}>
        <path d={`M0 0L${-6 * u} ${-120 * u}M${-3 * u} ${-70 * u}L${40 * u} ${-125 * u}M${-4 * u} ${-90 * u}L${-50 * u} ${-128 * u}`} stroke={c1} strokeWidth={6 * u} strokeLinecap="round" />
        <ellipse cx={-6 * u} cy={-132 * u} rx={110 * u} ry={16 * u} fill={c1} />
        <ellipse cx={30 * u} cy={-142 * u} rx={60 * u} ry={11 * u} fill={c2} />
        <ellipse cx={-50 * u} cy={-140 * u} rx={52 * u} ry={10 * u} fill={c2} />
      </g>
    ) : (
      <g key={key} transform={`translate(${x},${y}) scale(${s})`}>
        <rect x={-4 * u} y={-46 * u} width={8 * u} height={46 * u} fill="#6b5240" />
        <ellipse cx={0} cy={-62 * u} rx={34 * u} ry={38 * u} fill={c1} />
        <ellipse cx={8 * u} cy={-56 * u} rx={22 * u} ry={28 * u} fill={c2} opacity={0.6} />
      </g>
    );

  // savanna sun (fixed far layer)
  const sunR = Math.min(w, h) * 0.4;
  const sunY = run ? hz - sunR * 0.55 : 0;
  const flap = 50 * Math.sin((onTwos(frame) / (run ? 12 : 18)) * Math.PI * 2);

  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${pal.sky[0]} 0%, ${pal.sky[1]} ${run ? 60 : 55}%, ${pal.sky[2]} 100%)`}}>
      <Svg>
        <defs>
          <radialGradient id={`${id}-sun`} cx="50%" cy="40%" r="62%">
            <stop offset="0%" stopColor="#fb8346" />
            <stop offset="100%" stopColor="#f1643e" />
          </radialGradient>
          <linearGradient id={`${id}-ray`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#c4573c" />
            <stop offset="100%" stopColor="#c4573c" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id={`${id}-fields`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.fields[0]} />
            <stop offset="100%" stopColor={pal.fields[pal.fields.length - 1]} />
          </linearGradient>
        </defs>
        {pal.night && <Stars w={w} h={h} u={u} frame={frame} count={70} seed={`${seed}-st`} opacity={0.6} maxY={0.6} />}
        {run && (
          <g>
            <g transform={`translate(${w / 2},${sunY})`}>
              {Array.from({length: 70}, (_, i) => (
                <g key={i} transform={`rotate(${(i / 70) * 360}) translate(0,${-(sunR + 4 * u)})`}>
                  <polygon points={`${-6 * u},0 ${6 * u},0 0,${-70 * u * (0.85 + 0.3 * ((i * 37) % 10) / 10)}`} fill={`url(#${id}-ray)`} />
                </g>
              ))}
            </g>
            <circle cx={w / 2} cy={sunY} r={sunR} fill={`url(#${id}-sun)`} />
          </g>
        )}
        {/* clouds (barely move) */}
        <Layer factor={fSky} lid="sky">
          {clouds.map((c, i) => {
            const cs = [0, 1, 2, 3, 4].map((k) => ({x: c.x + (k - 2) * 34 * u * c.s, y: c.y - (k % 2 ? 14 : 4) * u * c.s - (k === 2 ? 16 * u * c.s : 0), r: (k === 2 ? 36 : 25) * u * c.s}));
            return (
              <g key={i}>
                <defs>
                  <clipPath id={`${id}-cl${i}`}>
                    <rect x={c.x - 200 * u} y={c.y - 200 * u} width={400 * u} height={200 * u} />
                  </clipPath>
                </defs>
                <path d={circlesD(cs)} fill={pal.cloud} clipPath={`url(#${id}-cl${i})`} />
              </g>
            );
          })}
        </Layer>
        {/* far + near mountains */}
        <Layer factor={fFar} lid="far" blur={0.35}>
          <path d={ridgePath(farR, 0, Pl, hz - (run ? 0.02 : 0.1) * h, 0.08 * h, h, 10)} fill={pal.far} />
        </Layer>
        <Layer factor={fNear} lid="near" blur={0.35}>
          <path d={ridgePath(nearR, 0, Pl, hz - (run ? 0 : 0.04) * h, 0.05 * h, h, 10)} fill={pal.near} />
          {!run && <path d={ridgePath(nearR, 0, Pl, hz - 0.04 * h, 0.05 * h, h, 10)} fill={mix(pal.near, pal.sky[2], 0.35)} opacity={0.35} transform={`translate(0,${0.03 * h})`} />}
        </Layer>
        {/* distant fields + village */}
        <Layer factor={fFields} lid="fields" blur={0.35}>
          {!run && <rect x={0} y={hz} width={Pl} height={h - hz} fill={`url(#${id}-fields)`} />}
          {!run &&
            Array.from({length: 6}, (_, i) => <rect key={i} x={0} y={hz + (0.012 + i * i * 0.004) * h} width={Pl} height={(1 + i) * 1.5 * u} fill={pal.fields[(i + 1) % pal.fields.length]} opacity={0.6} />)}
          {!run &&
            houses.map((hs, i) => (
              <g key={i} transform={`translate(${hs.x},${hz + 0.035 * h}) scale(${hs.s})`}>
                <rect x={-8 * u} y={-10 * u} width={16 * u} height={10 * u} fill={pal.house[0]} />
                <polygon points={`${-10 * u},${-10 * u} ${10 * u},${-10 * u} ${6 * u},${-17 * u} ${-6 * u},${-17 * u}`} fill={pal.house[1 + (hs.c % 2)] ?? pal.house[0]} />
              </g>
            ))}
        </Layer>
        {/* rolling hill with small trees */}
        <Layer factor={fHill} lid="hill" blur={0.35}>
          <path d={ridgePath(hillR, 0, Pl, hillY, 0.04 * h, h, 10)} fill={pal.hill} />
          {!run && treesHill.map((t, i) => tree(t.x, hillY - 0.04 * h * hillR(t.x) + 4 * u, t.s * 0.5, i, pal.tree, pal.treeDark))}
        </Layer>
        {/* tree row (acacias in speed-run) */}
        <Layer factor={fTree} lid="tree" blur={0.35}>
          {treeRow.map((t, i) => tree(t.x, treeRowY + (run ? 0 : 0.02 * h * Math.sin(t.x)), t.s, i, pal.tree, pal.treeDark))}
        </Layer>
        {/* foreground ground */}
        <Layer factor={fFg} lid="fg" blur={0.35}>
          <path d={ridgePath(fgR, 0, Pl, fgY, 0.025 * h, h + 4, 10)} fill={pal.ground} />
          {!run &&
            tufts.map((t, i) => {
              const y = fgY + t.y * (h - fgY);
              const s = t.s * (0.6 + t.y);
              return <path key={i} d={`M${t.x - 10 * u * s} ${y}L${t.x - 4 * u * s} ${y - 16 * u * s}L${t.x} ${y}L${t.x + 5 * u * s} ${y - 20 * u * s}L${t.x + 10 * u * s} ${y}Z`} fill={pal.fg} opacity={0.8} />;
            })}
          {!run && (
            <GrassField
              id={`${id}-ggrass`}
              rows={tealRows(portrait ? 0.55 : 0.42).map((row, k) => ({...row, base: ['#355c30', '#3f6b37', '#4a7a3f'][k], tip: ['#6f9a52', '#86b062', '#9cc36e'][k]}))}
              baseY={h + 10 * u}
              x0={0}
              x1={Pl}
              u={u}
              w={w}
              frame={frame}
              seed={`${seed}-gg`}
              swayAmp={2}
              gust={5}
            />
          )}
          {run && (
            <GrassField id={`${id}-grass`} rows={tealRows(portrait ? 1.3 : 0.9)} baseY={h + 10 * u} x0={0} x1={Pl} u={u} w={w} frame={frame} seed={`${seed}-gr`} swayAmp={1.5} gust={3} bend={-18 * vn} />
          )}
        </Layer>
        {/* hero */}
        {hero === 'crane' && (
          <PaperCraneSide
            x={w * (run ? 0.42 : 0.4) + (run ? -0.02 * w * vn : 0)}
            y={h * (run ? 0.42 : portrait ? 0.3 : 0.27) + Math.sin(frame / 14) * 8 * u}
            size={(portrait ? 115 : 130) * u}
            flap={flap}
            u={u}
            rotate={-4 - 6 * vn}
            tint={run ? 0.15 : 0}
          />
        )}
        {/* light streaks at speed */}
        {run && streaks && vn > 0.05 && (
          <g opacity={vn}>
            {Array.from({length: 26}, (_, i) => {
              const rr = rng(`${seed}-streak${i}`);
              const len = range(rr, 200, 600) * u;
              const y = range(rr, 0.55, 1) * h;
              const x = w + len - (((X * 1.2 + rr() * 5000) % (w + 2 * len)) + w + 2 * len) % (w + 2 * len);
              return <line key={i} x1={x} y1={y} x2={x + len} y2={y} stroke="#3f7f86" strokeWidth={range(rr, 1.5, 4) * u} opacity={0.4} strokeLinecap="round" />;
            })}
          </g>
        )}
        {/* near-camera elements: leafy bushes (truck) / whizzing dark blades (speed-run, only at speed) */}
        <Layer factor={fFront} lid="front" blur={0.5}>
          {run
            ? front.map((t, i) => (
                <path key={i} d={`M${t.x - 26 * u} ${h + 4}Q${t.x - 6 * u} ${h - t.hh * 0.5} ${t.x + 14 * u} ${h - t.hh}Q${t.x + 6 * u} ${h - t.hh * 0.45} ${t.x + 26 * u} ${h + 4}Z`} fill="#0b1418" opacity={clamp(vn * 3)} />
              ))
            : front.map((t, i) => {
                const bs = [0, 1, 2, 3, 4, 5].map((k) => ({x: t.x + (k - 2.5) * 46 * u, y: h + 20 * u - (k % 3) * 22 * u - (k === 2 || k === 3 ? 40 * u : 0), r: (60 + (k % 2) * 18) * u}));
                return (
                  <g key={i}>
                    <path d={circlesD(bs)} fill="#2f5a2c" />
                    <path d={circlesD(bs.map((b) => ({x: b.x - b.r * 0.2, y: b.y - b.r * 0.25, r: b.r * 0.55})))} fill="#3d6f37" opacity={0.7} />
                  </g>
                );
              })}
        </Layer>
      </Svg>
      {grain > 0 && <FilmGrain opacity={grain} />}
    </AbsoluteFill>
  );
};

export const parallaxLandscape = defineMotion<Props>({
  id: 'parallax-landscape',
  title: 'Parallax landscape truck / speed-run',
  category: 'environment',
  description:
    'Layered flat-vector landscape (sky and clouds, two mountain ranges, distant fields with a village, a hill, a tree row, foreground and whizzing near blades) trucking sideways at depth-proportional speeds with a flapping paper crane; speed-run mode ramps to a gallop-speed rush over a savanna with a fixed giant sun, horizontal streak blur on the near layers and light streaks.',
  source: ['video1 0:15-0:18 parallax-landscape-truck', 'video15 0:13-0:20 parallax-speed-run'],
  useFor: 'Travel and progress beats, establishing shots, "moving fast" moments behind a hero character.',
  durationInFrames: 180,
  defaultProps: {
    mode: 'truck',
    palette: 'auto',
    speed: 3,
    peakSpeed: 123,
    layerFactors: [],
    rampIn: 48,
    rampOut: 33,
    hero: 'crane',
    streaks: true,
    grain: 0.06,
    seed: 'valley',
  },
  propDocs: {
    mode: '"truck" (slow camera truck) or "speedrun" (ramp up to a rush, blur streaks, ramp down)',
    palette: '"auto" (day for truck, savanna for speedrun) | "day" | "savanna" | "dusk"',
    speed: 'truck mode foreground speed in px per frame at 1080',
    peakSpeed: 'speed-run peak foreground speed in px per frame (123 = 3700 px/s)',
    layerFactors: 'speed factors for [far mtn, near mtn, fields, hill, trees, ground, front blades]; [] = auto per mode',
    rampIn: 'speed-run ease-in ramp length (frames)',
    rampOut: 'speed-run ease-out ramp length (frames)',
    hero: '"crane" flapping paper crane or "none"',
    streaks: 'horizontal light streaks at speed (speed-run)',
    grain: 'film grain opacity',
    seed: 'landscape seed',
  },
  component: ParallaxLandscape,
  tags: ['parallax', 'landscape', 'travel', 'speed', 'camera', 'truck'],
});
