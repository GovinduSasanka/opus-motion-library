import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {n2, rng} from '../../core/random';
import {FilmGrain, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video2 13.08-14.17 s `metaball-heatmap-blob` and video18 6.55-6.65 s `metaball-blobs`.
 *  - "heatmap": a spreading liquid splat (lobes, tendrils, satellite droplets) rendered as heat-map
 *    iso-bands maroon -> red -> orange -> yellow -> mint with a dark rim, on a starfield. The field is the
 *    blurred union of circles; feComponentTransfer "discrete" tables cut it into contour bands.
 *  - "goo": dark gooey blobs (blur + alpha threshold) drifting, merging and swelling on an orange ground,
 *    with an R/G channel-split rim.
 */
type Props = {
  style: 'heatmap' | 'goo';
  ballCount: number;
  colors: string[];
  background: string;
  blur: number;
  growth: number;
  rgbSplit: boolean;
  stars: boolean;
  seed: number;
};

const hex = (c: string) => {
  const n = parseInt(c.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

type Ball = {x: number; y: number; r: number; vx: number; vy: number; kind: 'core' | 'lobe' | 'tendril' | 'drop'; d: number};

const Heatmap: React.FC<Props> = ({ballCount, colors, background, blur, growth, stars, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy} = useStage();
  const S = Math.min(w, h) * 0.86;
  const bands = colors.length >= 5 ? colors : ['#9FE0B0', '#E9E36A', '#F08A3C', '#D4344A', '#6F0D28'];
  const rim = '#16241D';

  const balls = useMemo(() => {
    const r = rng(seed);
    const out: Ball[] = [];
    const n = Math.max(4, Math.round(ballCount));
    // core + lobes
    out.push({x: 0, y: 0, r: 0.15, vx: 0, vy: 0, kind: 'core', d: 0});
    out.push({x: 0.09, y: -0.05, r: 0.12, vx: 0, vy: 0, kind: 'core', d: 0});
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const d = 0.05 + r() * 0.15;
      out.push({x: Math.cos(a) * d, y: Math.sin(a) * d * 0.85, r: 0.07 + r() * 0.07, vx: Math.cos(a), vy: Math.sin(a), kind: 'lobe', d});
    }
    // tendrils: chains of shrinking circles
    const nt = Math.max(3, Math.round(n * 0.55));
    for (let t = 0; t < nt; t++) {
      const a = (t / nt) * Math.PI * 2 + (r() - 0.5) * 1.6;
      const len = 2 + Math.floor(r() * 5);
      for (let k = 0; k < len; k++) {
        const d = 0.15 + k * 0.04;
        const bend = (r() - 0.5) * 0.25 * k * 0.3;
        out.push({x: Math.cos(a + bend) * d, y: Math.sin(a + bend) * d, r: 0.06 * (1 - k / (len + 1)) + 0.022, vx: Math.cos(a + bend), vy: Math.sin(a + bend), kind: 'tendril', d});
      }
      // satellite droplets beyond the tendril tip
      const nd = 1 + Math.floor(r() * 2);
      for (let k = 0; k < nd; k++) {
        const d = 0.15 + len * 0.04 + 0.07 + k * 0.06 + r() * 0.03;
        const aa = a + (r() - 0.5) * 0.35;
        out.push({x: Math.cos(aa) * d, y: Math.sin(aa) * d, r: 0.026 + r() * 0.02, vx: Math.cos(aa), vy: Math.sin(aa), kind: 'drop', d});
      }
    }
    return out;
  }, [ballCount, seed]);

  const starList = useMemo(() => {
    const r = rng(seed + 7);
    return Array.from({length: 220}, () => ({x: r() * w, y: r() * h, s: (0.6 + r() * 1.6) * u, o: 0.25 + r() * 0.6, c: r() < 0.25 ? '#C1CB7F' : '#E8ECF2', p: r() * 7}));
  }, [w, h, u, seed]);

  const splat = prog(frame, 0, 52, ease.out);
  const t = frame / 30;
  const ooze = 1 + growth * t;

  // discrete band tables over the blurred alpha (32 steps)
  const N = 32;
  const edges = [0.2, 0.26, 0.37, 0.49, 0.63, 0.8];
  const bandAt = (v: number) => {
    if (v < edges[0]) return null;
    if (v < edges[1]) return rim;
    for (let i = 1; i < edges.length - 1; i++) if (v < edges[i + 1]) return bands[i - 1];
    return bands[4];
  };
  const tbl = Array.from({length: N}, (_, i) => bandAt((i + 0.5) / N));
  const tR = tbl.map((c) => (c ? hex(c)[0] : 0).toFixed(3)).join(' ');
  const tG = tbl.map((c) => (c ? hex(c)[1] : 0).toFixed(3)).join(' ');
  const tB = tbl.map((c) => (c ? hex(c)[2] : 0).toFixed(3)).join(' ');
  const tA = tbl.map((c) => (c ? 1 : 0)).join(' ');

  const bl = blur * u;
  return (
    <AbsoluteFill style={{background: background || '#0D1018'}}>
      <Svg>
        <defs>
          <filter id="mh-heat" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceAlpha" stdDeviation={bl} result="b" />
            <feTurbulence type="fractalNoise" baseFrequency={0.012 / u} numOctaves={2} seed={seed} result="n" />
            <feDisplacementMap in="b" in2="n" scale={26 * u} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feColorMatrix in="d" type="matrix" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 1 0" />
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues={tR} />
              <feFuncG type="discrete" tableValues={tG} />
              <feFuncB type="discrete" tableValues={tB} />
              <feFuncA type="discrete" tableValues={tA} />
            </feComponentTransfer>
          </filter>
        </defs>
        {stars &&
          starList.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s} fill={s.c} opacity={s.o * (0.7 + 0.3 * Math.sin(frame * 0.15 + s.p))} />)}
        <g filter="url(#mh-heat)">
          {balls.map((b, i) => {
            const k = b.kind === 'core' ? 0.3 : b.kind === 'lobe' ? 0.75 : 1;
            const spread = lerp(0.06, 1, splat) * (1 + (ooze - 1) * k * 1.6);
            const wob = n2('mh' + seed, i * 0.7, t * 0.4) * 0.012;
            const lx = b.x * spread * 1.22 + wob;
            const ly = b.y * spread * 0.92 + n2('mhy' + seed, i * 0.7, t * 0.4) * 0.012;
            const x = cx + (lx * 0.87 - ly * 0.5) * S;
            const y = cy + (lx * 0.5 + ly * 0.87) * S;
            const rr = b.r * S * lerp(0.5, 1, splat) * (b.kind === 'drop' ? clamp(splat * 1.4 - 0.3) : 1);
            if (rr < 0.5) return null;
            return <circle key={i} cx={x} cy={y} r={rr} fill="#fff" />;
          })}
        </g>
      </Svg>
      <FilmGrain opacity={0.07} />
    </AbsoluteFill>
  );
};

const Goo: React.FC<Props> = ({ballCount, colors, background, blur, rgbSplit, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy} = useStage();
  const blob = colors[0] ?? '#141414';
  const rimA = colors[1] ?? '#FF2D2D';
  const rimB = colors[2] ?? '#26E07A';
  const n = Math.max(6, Math.round(ballCount * 1.4));
  const balls = useMemo(() => {
    const r = rng(seed + 1);
    return Array.from({length: n}, (_, i) => ({
      ax: (r() - 0.5) * 0.62,
      ay: (r() - 0.5) * 0.5,
      r: 50 + r() * 95,
      f1: 0.35 + r() * 0.6,
      f2: 0.3 + r() * 0.5,
      p1: r() * 7,
      p2: r() * 7,
      amp: 0.06 + r() * 0.12,
      beat: Math.floor(r() * 3),
      i,
    }));
  }, [n, seed]);
  const t = frame / 30;
  const bl = (blur * 0.6) * u;
  const off = 8 * u;
  const intro = prog(frame, 0, 18, ease.back);
  return (
    <AbsoluteFill style={{background: background || '#F2823F'}}>
      <Svg>
        <defs>
          <filter id="mh-goo" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={bl} result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
            {rgbSplit && (
              <>
                <feFlood floodColor={rimA} result="fa" />
                <feComposite in="fa" in2="goo" operator="in" result="ga" />
                <feOffset in="ga" dx={-off} dy={-off * 0.8} result="oa" />
                <feFlood floodColor={rimB} result="fb" />
                <feComposite in="fb" in2="goo" operator="in" result="gb" />
                <feOffset in="gb" dx={off} dy={off * 0.8} result="ob" />
                <feGaussianBlur in="goo" stdDeviation={8 * u} result="glow" />
              </>
            )}
            <feMerge>
              {rgbSplit && <feMergeNode in="glow" />}
              {rgbSplit && <feMergeNode in="oa" />}
              {rgbSplit && <feMergeNode in="ob" />}
              <feMergeNode in="goo" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#mh-goo)">
          {balls.map((b) => {
            const beatPhase = ((frame + b.beat * 5) % 15) / 15;
            const swell = 1 + 0.3 * Math.max(0, 1 - beatPhase * 4) * (beatPhase < 0.27 ? 1 : 0);
            const x = cx + (b.ax + Math.sin(t * b.f1 + b.p1) * b.amp + n2('g' + seed, b.i, t * 0.3) * 0.04) * w;
            const y = cy + (b.ay + Math.cos(t * b.f2 + b.p2) * b.amp * 0.8) * h;
            return <circle key={b.i} cx={x} cy={y} r={b.r * u * swell * intro} fill={blob} />;
          })}
        </g>
      </Svg>
      <FilmGrain opacity={0.06} />
    </AbsoluteFill>
  );
};

const MetaballHeatmap: React.FC<Props> = (p) => (p.style === 'goo' ? <Goo {...p} /> : <Heatmap {...p} />);

export const metaballHeatmap = defineMotion<Props>({
  id: 'metaball-heatmap',
  title: 'Metaball heat-map / goo',
  category: 'shape',
  description: 'A liquid splat spreads and oozes, rendered as heat-map contour bands (maroon core to mint rim) on a starfield; or gooey dark blobs merge and swell with an RGB-split rim.',
  source: ['video2 0:13.08-0:14.17 (heatmap)', 'video18 0:06.55-0:06.65 (goo)'],
  useFor: 'Heat maps, spills, thermal / density imagery, organic growth, liquid transitions, "it spreads".',
  durationInFrames: 150,
  defaultProps: {
    style: 'heatmap',
    ballCount: 12,
    colors: [],
    background: '',
    blur: 34,
    growth: 0.045,
    rgbSplit: true,
    stars: true,
    seed: 2,
  },
  propDocs: {
    style: '"heatmap" (iso-contour bands) or "goo" (gooey blobs with RGB-split rim)',
    ballCount: 'number of metaball lobes (tendrils and droplets scale with it)',
    colors: 'heatmap: 5 bands rim->core; goo: [blob, rim A, rim B] ([] = source palette)',
    background: 'background colour ("" = starfield navy / orange)',
    blur: 'field softness in u (bigger = smoother, wider bands)',
    growth: 'heatmap ooze rate (fraction per second the splat keeps spreading)',
    rgbSplit: 'goo: red/green channel-split rim',
    stars: 'heatmap: starfield specks',
  },
  component: MetaballHeatmap,
  tags: ['metaball', 'heatmap', 'liquid', 'blob', 'organic', 'goo'],
});
