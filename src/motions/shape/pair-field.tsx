import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, lerp, prog} from '../../core/ease';
import {n2, rng} from '../../core/random';
import {shade} from '../../core/shape-kit';
import {FilmGrain, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video4 24.0-26.0 s `pair-field-zoom-out`: a dark violet field of hundreds of cyan+pink dot pairs,
 * each pair pinging thin rings on its own phase; the hero pair in the centre pings bigger rings while the
 * camera pulls out 2.5x (easeOutQuad), revealing the whole population.
 */
type Props = {
  count: number;
  colors: string[];
  background: string[];
  zoomFrom: number;
  zoomTo: number;
  zoomFrames: number;
  pingPeriod: number;
  ringRadius: number;
  heroRingRadius: number;
  stars: boolean;
  seed: number;
};

const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

const PairField: React.FC<Props> = ({count, colors, background, zoomFrom, zoomTo, zoomFrames, pingPeriod, ringRadius, heroRingRadius, stars, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, durationInFrames} = useStage();
  const cyan = colors[0] ?? '#549BEA';
  const pink = colors[1] ?? '#E54FC0';

  const pairs = useMemo(() => {
    const r = rng(seed);
    const out: {x: number; y: number; a: number; sep: number; per: number; ph: number; rr: number; size: number; first: number; enc: boolean}[] = [];
    // stratified jitter so the field is even but organic
    const aspect = w / h;
    const rows = Math.max(1, Math.round(Math.sqrt(count / aspect)));
    const cols = Math.max(1, Math.round(count / rows));
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const x = lerp(-0.1 * w, 1.1 * w, (i + 0.15 + r() * 0.7) / cols);
        const y = lerp(-0.1 * h, 1.1 * h, (j + 0.15 + r() * 0.7) / rows);
        if (Math.hypot(x - cx, y - cy) < 70 * u) continue; // keep the hero clear
        out.push({
          x,
          y,
          a: r() * Math.PI * 2,
          sep: (17 + r() * 7) * u,
          per: Math.round(pingPeriod * (0.7 + r() * 0.8)),
          ph: Math.floor(r() * 200),
          rr: ringRadius * (0.6 + r() * 0.8) * u,
          size: (4.6 + r() * 1.6) * u,
          first: r() < 0.5 ? 0 : 1,
          enc: r() < 0.35,
        });
      }
    return out;
  }, [count, w, h, cx, cy, u, pingPeriod, ringRadius, seed]);

  const starList = useMemo(() => {
    const r = rng(seed + 99);
    return Array.from({length: 110}, () => ({x: lerp(-0.1, 1.1, r()) * w, y: lerp(-0.1, 1.1, r()) * h, s: (0.6 + r() * 1.3) * u, p: r() * 6}));
  }, [w, h, u, seed]);

  const zt = easeOutQuad(prog(frame, 0, zoomFrames, (t) => t));
  const tail = prog(frame, zoomFrames, durationInFrames, (t) => t);
  const z = lerp(zoomFrom, zoomTo, zt) * (1 - 0.07 * tail);
  const S = (x: number, y: number) => [cx + (x - cx) * z, cy + (y - cy) * z] as const;
  const t = frame / 30;

  const rings: React.ReactNode[] = [];
  const dots: React.ReactNode[] = [];
  pairs.forEach((p, i) => {
    const dx = n2('pfx' + seed, i * 0.31, t * 0.15) * 14 * u + Math.cos(p.a) * 10 * u * t;
    const dy = n2('pfy' + seed, i * 0.31, t * 0.15) * 14 * u + Math.sin(p.a) * 10 * u * t * 0.5;
    const ox = Math.cos(p.a + t * 0.4) * p.sep * 0.5;
    const oy = Math.sin(p.a + t * 0.4) * p.sep * 0.5;
    const [ax, ay] = S(p.x + dx - ox, p.y + dy - oy);
    const [bx, by] = S(p.x + dx + ox, p.y + dy + oy);
    const m = 60 * u * z;
    if (ax < -m || ax > w + m || ay < -m || ay > h + m) return;
    // pings
    const age = (frame + p.ph) % p.per;
    const life = 26;
    for (let k = 0; k < 2; k++) {
      const a2 = age - k * 7;
      if (a2 < 0 || a2 > life) continue;
      const tt = a2 / life;
      const fromA = (k + p.first) % 2 === 0;
      const rr = p.rr * easeOutQuad(tt) * z;
      rings.push(
        <circle key={`r${i}-${k}`} cx={fromA ? ax : bx} cy={fromA ? ay : by} r={Math.max(0.1, rr)} fill="none" stroke={fromA ? cyan : pink} strokeWidth={1.8 * u * Math.sqrt(z)} opacity={1 - tt * tt} />,
      );
    }
    if (p.enc) {
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const br = 0.5 + 0.5 * Math.sin((frame + p.ph) * 0.05);
      rings.push(<circle key={`e${i}`} cx={mx} cy={my} r={(p.sep * 1.1 + 4 * u * br) * z} fill="none" stroke={p.first ? pink : cyan} strokeWidth={1.4 * u * Math.sqrt(z)} opacity={0.55 + 0.35 * br} />);
    }
    const sz = p.size * Math.sqrt(z);
    dots.push(<circle key={`a${i}`} cx={ax} cy={ay} r={sz} fill="url(#pf-cy)" />, <circle key={`b${i}`} cx={bx} cy={by} r={sz} fill="url(#pf-pk)" />);
  });

  // hero pair
  const hs = 9 * u * Math.pow(z, 0.7);
  const hsep = 20 * u * Math.pow(z, 0.8);
  const ha = -0.5 + t * 0.3;
  const hA = [cx - Math.cos(ha) * hsep, cy - Math.sin(ha) * hsep] as const;
  const hB = [cx + Math.cos(ha) * hsep, cy + Math.sin(ha) * hsep] as const;
  const hero: React.ReactNode[] = [];
  for (let n = 0; n < 6; n++) {
    const start = n * 16;
    for (let k = 0; k < 2; k++) {
      const age = frame - start - k * 5;
      if (age < 0 || age > 34) continue;
      const tt = age / 34;
      const fromA = n % 2 === 0;
      const R = heroRingRadius * (k ? 0.65 : 1) * u * Math.pow(z, 0.8) * easeOutQuad(tt);
      hero.push(<circle key={`h${n}-${k}`} cx={fromA ? hA[0] : hB[0]} cy={fromA ? hA[1] : hB[1]} r={Math.max(0.1, R)} fill="none" stroke={fromA ? cyan : pink} strokeWidth={(2.6 - k) * u * Math.sqrt(z)} opacity={1 - tt} />);
    }
  }

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, ${background[0] ?? '#452F7A'} 0%, ${background[1] ?? '#19113E'} 100%)`}}>
      <Svg>
        <defs>
          <radialGradient id="pf-cy" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={shade(cyan, 0.55)} />
            <stop offset="50%" stopColor={cyan} />
            <stop offset="100%" stopColor={shade(cyan, -0.45)} />
          </radialGradient>
          <radialGradient id="pf-pk" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={shade(pink, 0.55)} />
            <stop offset="50%" stopColor={pink} />
            <stop offset="100%" stopColor={shade(pink, -0.45)} />
          </radialGradient>
        </defs>
        {stars &&
          starList.map((s, i) => {
            const [x, y] = S(s.x, s.y);
            return <circle key={i} cx={x} cy={y} r={s.s} fill="#E9E4FF" opacity={0.25 + 0.35 * (0.5 + 0.5 * Math.sin(frame * 0.12 + s.p))} />;
          })}
        {rings}
        {hero}
        {dots}
        <circle cx={hA[0]} cy={hA[1]} r={hs} fill="url(#pf-cy)" />
        <circle cx={hB[0]} cy={hB[1]} r={hs} fill="url(#pf-pk)" />
        <circle cx={cx} cy={cy} r={hsep + hs * 2.4} fill="none" stroke={cyan} strokeWidth={2 * u * Math.sqrt(z)} opacity={0.75 * clamp(1 - tail * 0.4)} />
      </Svg>
      <FilmGrain opacity={0.06} />
    </AbsoluteFill>
  );
};

export const pairField = defineMotion<Props>({
  id: 'pair-field',
  title: 'Pair field zoom-out',
  category: 'shape',
  description: 'Dark violet field of hundreds of cyan+pink dot pairs pinging small rings; the camera pulls out 2.5x from a hero pair.',
  source: ['video4 0:24.0-0:26.0'],
  useFor: '"This happens millions of times" — scale reveal of a population of connections, users, agents or conversations.',
  durationInFrames: 120,
  defaultProps: {
    count: 360,
    colors: ['#549BEA', '#E54FC0'],
    background: ['#452F7A', '#19113E'],
    zoomFrom: 2.5,
    zoomTo: 1,
    zoomFrames: 70,
    pingPeriod: 70,
    ringRadius: 42,
    heroRingRadius: 120,
    stars: true,
    seed: 4,
  },
  propDocs: {
    count: 'number of dot pairs in the field',
    colors: '[dot A, dot B] colours (rings match their dot)',
    background: '[centre, corner] of the radial background',
    zoomFrom: 'starting camera zoom',
    zoomTo: 'zoom after the pull-out (then a slow 7% drift further)',
    zoomFrames: 'length of the pull-out (easeOutQuad)',
    pingPeriod: 'average frames between pings of each pair',
    ringRadius: 'max ring radius of field pairs (u)',
    heroRingRadius: 'max ring radius of the hero pair (u)',
    stars: 'faint star specks in the background',
  },
  component: PairField,
  tags: ['population', 'network', 'zoom-out', 'pulse', 'scale'],
});
