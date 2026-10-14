import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {clamp, ease, prog, tween} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {GradientMapFilter, resolveSrc} from '../../core/image-kit';
import {fbm, rng} from '../../core/random';
import {Sparkle} from '../../core/shapes';
import {useStage} from '../../core/stage';
import {fitSize} from '../../core/text-kit';
import {defineMotion} from '../../core/types';
import {ArrowCursor} from '../../core/ui-kit';

/**
 * video9 browser-frame-mockup + video5 cinemagraph-hero-loop / gradient-headline.
 * A rounded, softly shadowed browser window floats on a blue-grey studio backdrop. Inside: a landing page
 * (nav, two-line gradient headline #14235B -> #63678F, subtitle, two CTAs, logo row) whose UI never moves —
 * only the hero illustration lives: an etched navy-ink lakeside scene with a sweeping lighthouse beam,
 * shimmering water, drifting clouds, flapping birds and a star glint on the lamp. A cursor glides to the CTA,
 * clicks, then the page scrolls to a feature row (scrollbar thumb follows).
 */
type Props = {
  brand: string;
  url: string;
  nav: string[];
  headline: string[];
  subtitle: string;
  ctas: string[];
  logos: string[];
  features: string[];
  heroSrc: string;
  heroTint: boolean;
  glint: number[];
  ink: string;
  paper: string;
  gradFrom: string;
  gradTo: string;
  backdrop: string[];
  chrome: boolean;
  cursor: boolean;
  scroll: number;
};

// ---------------------------------------------------------------------------------------------- hero art
const EtchedHero: React.FC<{W: number; H: number; frame: number; ink: string; paper: string; u: number; id: string}> = ({W, H, frame, ink, paper, u, id}) => {
  const t = frame / 30;
  const lx = W * 0.79;
  const geo = React.useMemo(() => {
    const r = rng(11);
    const lakeTop = H * 0.5;
    const step = 5 * u;
    const N = Math.ceil(W / step) + 2;
    const ridgePts = (name: string, scale: number, base: number, amp: number, dipAt = -1): [number, number][] =>
      Array.from({length: N}, (_, i) => {
        const x = i * step;
        const v = 0.5 + 0.5 * fbm(name, x / (W * scale), 0.3, 5);
        const dip = dipAt < 0 ? 0 : Math.exp(-Math.pow((x - W * dipAt) / (W * 0.14), 2));
        return [x, base - amp * (0.15 + 0.85 * v) * (1 - 0.6 * dip)];
      });
    const line = (pts: [number, number][], dy = 0) => 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${(y + dy).toFixed(1)}`).join('L');
    const far = ridgePts('bmfar', 0.16, lakeTop - 6 * u, H * 0.36);
    const mid = ridgePts('bmmid', 0.09, lakeTop + 2 * u, H * 0.2, 0.55);
    const contours = (pts: [number, number][], n: number, gap: number, seed: number) =>
      Array.from({length: n}, (_, k) => ({d: line(pts, (k + 1) * gap * (1 + k * 0.18)), o: 0.5 * (1 - k / n), dash: `${(30 + ((k * 37 + seed) % 60)) * u} ${(6 + ((k * 23 + seed) % 14)) * u}`}));
    const shore: [number, number][] = Array.from({length: Math.ceil((W * 0.5) / step) + 1}, (_, i) => {
      const x = i * step;
      return [x, H * 0.66 + (x / (W * 0.5)) * H * 0.07 + fbm('bmshore', x / (W * 0.08), 1, 3) * 6 * u];
    });
    const trees: {x: number; y: number; s: number}[] = [];
    for (let i = 0; i < 70; i++) {
      const k = r();
      const x = k * W * 0.47;
      const sy = H * 0.66 + (x / (W * 0.5)) * H * 0.07;
      const y = sy + r() * H * 0.06;
      trees.push({x, y, s: (20 + 34 * r()) * u * (1 - k * 0.45)});
    }
    trees.sort((a, b) => a.y - b.y);
    const cliffTop = H * 0.48;
    const cliff: [number, number][] = [];
    for (let x = W * 0.56; x <= W * 1.02; x += step) {
      const k = (x - W * 0.56) / (W * 0.46);
      const prof = k < 0.35 ? H * 0.78 - (H * 0.78 - cliffTop) * Math.pow(k / 0.35, 0.7) : cliffTop + (k - 0.35) * H * 0.18;
      cliff.push([x, prof + fbm('bmcliff', x / (W * 0.03), 2, 3) * 7 * u]);
    }
    const stipple = Array.from({length: 900}, () => {
      const x = r() * W;
      const y = H * 0.79 + Math.pow(r(), 0.6) * H * 0.21;
      return [x, y, (0.6 + r() * 1.3) * u] as const;
    });
    const waves = Array.from({length: 30}, (_, i) => {
      const y = lakeTop + 5 * u + i * ((H * 0.8 - lakeTop) / 30);
      const segs: [number, number][] = [];
      let x = -20 * u + r() * 20 * u;
      while (x < W) {
        const L = (16 + 80 * r()) * u;
        segs.push([x, L]);
        x += L + (6 + 34 * r()) * u;
      }
      return {y, segs, ph: r() * 6};
    });
    return {
      lakeTop,
      farD: line(far),
      farC: contours(far, 6, 7 * u, 3),
      midD: line(mid),
      midFill: `${line(mid)}L${W} ${lakeTop + 4 * u}L0 ${lakeTop + 4 * u}Z`,
      midC: contours(mid, 5, 6 * u, 9),
      shoreFill: `${line(shore)}L${W * 0.5} ${H}L0 ${H}Z`,
      shoreD: line(shore),
      trees,
      cliffFill: `${line(cliff)}L${W * 1.02} ${H}L${W * 0.56} ${H}Z`,
      cliffD: line(cliff),
      cliffC: contours(cliff, 9, 9 * u, 5),
      cliffAt: (x: number) => {
        const i = Math.round((x - W * 0.56) / step);
        return cliff[Math.max(0, Math.min(cliff.length - 1, i))][1];
      },
      stipple,
      waves,
    };
  }, [W, H, u]);

  const base = geo.cliffAt(lx);
  const towerH = H * 0.3;
  const tb = 26 * u;
  const tt = 16 * u;
  const lampY = base - towerH - 14 * u;
  const beamA = Math.sin(t * 0.9) * 20 - 166;
  const beamLen = W * 0.58;
  const birds = Array.from({length: 6}, (_, i) => {
    const bx = ((W * (0.1 + i * 0.06) + t * W * 0.022 * (1 + i * 0.12)) % (W * 1.1)) - W * 0.05;
    const by = H * (0.1 + ((i * 37) % 10) * 0.014) + Math.sin(t * 1.3 + i) * 4 * u;
    const flap = Math.sin(t * 9 + i * 1.7);
    const s = (7 + (i % 3) * 2) * u;
    return `M${bx - s} ${by - flap * s * 0.5} Q${bx - s * 0.4} ${by - s * 0.2} ${bx} ${by} Q${bx + s * 0.4} ${by - s * 0.2} ${bx + s} ${by - flap * s * 0.5}`;
  });
  const clouds = [0, 1, 2].map((i) => {
    const cx = ((W * (0.18 + i * 0.3) + t * 6 * u * (i + 1)) % (W * 1.2)) - W * 0.1;
    const cy = H * (0.12 + i * 0.06);
    const s = (40 + i * 14) * u;
    return `M${cx - s * 1.6} ${cy} a${s * 0.5} ${s * 0.35} 0 0 1 ${s * 0.8} -${s * 0.18} a${s * 0.55} ${s * 0.5} 0 0 1 ${s * 1.1} -${s * 0.12} a${s * 0.5} ${s * 0.35} 0 0 1 ${s * 1.1} ${s * 0.3} Z`;
  });
  const glintPulse = Math.max(0, Math.sin(clamp(((t % 2.6) / 2.6) / 0.35) * Math.PI));
  const sw = 1.3 * u;
  const pine = (x: number, y: number, s: number) => {
    const tiers = 4;
    let d = `M${x} ${y - s}`;
    for (let k = 0; k < tiers; k++) {
      const yy = y - s + ((k + 1) / tiers) * s * 0.92;
      const ww = s * (0.14 + 0.24 * ((k + 1) / tiers));
      d += ` L${x + ww} ${yy} L${x + ww * 0.45} ${yy - s * 0.04}`;
    }
    d += ` L${x + s * 0.05} ${y} L${x - s * 0.05} ${y}`;
    for (let k = tiers - 1; k >= 0; k--) {
      const yy = y - s + ((k + 1) / tiers) * s * 0.92;
      const ww = s * (0.14 + 0.24 * ((k + 1) / tiers));
      d += ` L${x - ww * 0.45} ${yy - s * 0.04} L${x - ww} ${yy}`;
    }
    return d + ' Z';
  };
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.95} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-fadeTop`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={paper} stopOpacity={1} />
          <stop offset="0.2" stopColor={paper} stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#9fb6ff" stopOpacity={0.9} />
          <stop offset="1" stopColor="#9fb6ff" stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-cliff`}>
          <path d={geo.cliffFill} />
        </clipPath>
      </defs>
      <g fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round">
        {Array.from({length: 16}, (_, i) => (
          <line key={i} x1={W * ((i * 0.137) % 1)} x2={W * ((i * 0.137) % 1) + (60 + (i % 4) * 30) * u} y1={H * (0.05 + i * 0.02)} y2={H * (0.05 + i * 0.02)} strokeWidth={0.8 * u} opacity={0.22} />
        ))}
        {clouds.map((d, i) => (
          <path key={i} d={d} strokeWidth={sw} opacity={0.55} fill={paper} />
        ))}
        {birds.map((d, i) => (
          <path key={i} d={d} strokeWidth={1.4 * u} opacity={0.8} />
        ))}
        {geo.farC.map((c, i) => (
          <path key={i} d={c.d} strokeWidth={0.8 * u} opacity={c.o} strokeDasharray={c.dash} />
        ))}
        <path d={geo.farD} strokeWidth={sw} opacity={0.7} />
        <path d={geo.midFill} fill={paper} stroke="none" />
        {geo.midC.map((c, i) => (
          <path key={i} d={c.d} strokeWidth={0.9 * u} opacity={c.o + 0.15} strokeDasharray={c.dash} />
        ))}
        <path d={geo.midD} strokeWidth={1.6 * u} />
        <rect x={0} y={geo.lakeTop + 4 * u} width={W} height={H} fill={paper} stroke="none" />
        <line x1={0} x2={W} y1={geo.lakeTop + 4 * u} y2={geo.lakeTop + 4 * u} strokeWidth={1.2 * u} opacity={0.7} />
        {geo.waves.map((wv, i) => (
          <g key={i} opacity={0.3 + 0.45 * (i / geo.waves.length)}>
            {wv.segs.map(([x, L], k) => {
              const off = Math.sin(t * 1.6 + wv.ph + k * 0.9) * 6 * u;
              const sh = 0.75 + 0.25 * Math.sin(t * 2.3 + k * 1.3 + i);
              return <line key={k} x1={x + off} x2={x + off + L * sh} y1={wv.y} y2={wv.y} strokeWidth={0.9 * u} />;
            })}
          </g>
        ))}
        {Array.from({length: 10}, (_, i) => (
          <line key={i} x1={lx - 10 * u + Math.sin(t * 2 + i) * 4 * u} x2={lx - 26 * u + Math.sin(t * 2 + i) * 4 * u} y1={geo.lakeTop + 14 * u + i * 8 * u} y2={geo.lakeTop + 14 * u + i * 8 * u} strokeWidth={2 * u} opacity={0.45 - i * 0.035} />
        ))}
        <path d={geo.shoreFill} fill={paper} stroke="none" />
        <path d={geo.shoreD} strokeWidth={1.4 * u} />
        {geo.trees.map((tr, i) => (
          <g key={i}>
            <path d={pine(tr.x, tr.y, tr.s)} fill={paper} strokeWidth={1.1 * u} />
            <path d={`M${tr.x + tr.s * 0.04} ${tr.y - tr.s * 0.85} L${tr.x + tr.s * 0.1} ${tr.y - tr.s * 0.08} M${tr.x + tr.s * 0.1} ${tr.y - tr.s * 0.55} l${tr.s * 0.14} ${tr.s * 0.18} M${tr.x + tr.s * 0.1} ${tr.y - tr.s * 0.3} l${tr.s * 0.2} ${tr.s * 0.2}`} strokeWidth={0.8 * u} opacity={0.75} />
          </g>
        ))}
        <path d={geo.cliffFill} fill={paper} stroke="none" />
        <g clipPath={`url(#${id}-cliff)`}>
          {geo.cliffC.map((c, i) => (
            <path key={i} d={c.d} strokeWidth={0.9 * u} opacity={0.25 + c.o} strokeDasharray={c.dash} />
          ))}
          {Array.from({length: 26}, (_, i) => {
            const x = W * 0.6 + (i * W * 0.42) / 26;
            const y = geo.cliffAt(x) + 6 * u;
            return <path key={i} d={`M${x} ${y} l${-5 * u} ${(18 + ((i * 17) % 26)) * u}`} strokeWidth={1 * u} opacity={0.7} />;
          })}
        </g>
        <path d={geo.cliffD} strokeWidth={1.8 * u} />
        <path d={`M${lx - tb} ${base + 4 * u} L${lx - tt} ${base - towerH} L${lx + tt} ${base - towerH} L${lx + tb} ${base + 4 * u} Z`} fill={paper} strokeWidth={1.6 * u} />
        {[0.12, 0.42, 0.72].map((k, i) => {
          const y0 = base - towerH * (k + 0.13);
          const y1 = base - towerH * k;
          const hw0 = tb - (tb - tt) * (k + 0.13);
          const hw1 = tb - (tb - tt) * k;
          return <path key={i} d={`M${lx - hw1} ${y1} L${lx - hw0} ${y0} L${lx + hw0} ${y0} L${lx + hw1} ${y1} Z`} fill={ink} stroke="none" opacity={0.88} />;
        })}
        {Array.from({length: 7}, (_, i) => (
          <line key={i} x1={lx + tt * 0.35 + i * 1.5 * u} y1={base - towerH + 4 * u} x2={lx + tb * 0.4 + i * 2 * u} y2={base} strokeWidth={0.7 * u} opacity={0.55} />
        ))}
        <rect x={lx - tt - 5 * u} y={base - towerH - 4 * u} width={(tt + 5 * u) * 2} height={5 * u} fill={ink} stroke="none" />
        <rect x={lx - 11 * u} y={lampY - 9 * u} width={22 * u} height={18 * u} fill="#ffffff" strokeWidth={1.4 * u} />
        <path d={`M${lx - 14 * u} ${lampY - 9 * u} L${lx} ${lampY - 22 * u} L${lx + 14 * u} ${lampY - 9 * u} Z`} fill={ink} stroke="none" />
        <rect x={lx - 56 * u} y={base - 26 * u} width={34 * u} height={28 * u} fill={paper} strokeWidth={1.3 * u} />
        <path d={`M${lx - 60 * u} ${base - 24 * u} L${lx - 39 * u} ${base - 42 * u} L${lx - 18 * u} ${base - 24 * u}`} fill={paper} strokeWidth={1.3 * u} />
        <rect x={lx - 46 * u} y={base - 16 * u} width={7 * u} height={8 * u} fill={ink} stroke="none" opacity={0.8} />
        <g stroke="none" fill={ink} opacity={0.55}>
          {geo.stipple.map(([x, y, rr], i) => (
            <circle key={i} cx={x} cy={y} r={rr} />
          ))}
        </g>
        {Array.from({length: 46}, (_, i) => {
          const x = (i / 46) * W + ((i * 53) % 17) * u;
          const y = H * (0.86 + ((i * 29) % 13) / 100);
          const sway = Math.sin(t * 1.5 + i) * 2 * u;
          return <path key={i} d={`M${x} ${y} q${sway} ${-8 * u} ${-3 * u + sway} ${-16 * u} M${x + 3 * u} ${y} q${sway} ${-6 * u} ${4 * u + sway} ${-13 * u}`} strokeWidth={1 * u} opacity={0.75} />;
        })}
      </g>
      <g transform={`rotate(${beamA} ${lx} ${lampY})`} opacity={0.9}>
        <path d={`M${lx} ${lampY - 4 * u} L${lx + beamLen} ${lampY - beamLen * 0.12} L${lx + beamLen} ${lampY + beamLen * 0.12} L${lx} ${lampY + 4 * u} Z`} fill={`url(#${id}-beam)`} />
        {[-0.08, -0.03, 0.02, 0.07].map((k, i) => (
          <line key={i} x1={lx + 20 * u} y1={lampY} x2={lx + beamLen * 0.8} y2={lampY + beamLen * 0.8 * k} stroke={ink} strokeWidth={0.6 * u} opacity={0.16} />
        ))}
      </g>
      <circle cx={lx} cy={lampY} r={(26 + 18 * glintPulse) * u} fill={`url(#${id}-glow)`} />
      <Sparkle x={lx} y={lampY} size={(10 + 26 * glintPulse) * u} color="#ffffff" rotate={glintPulse * 20} opacity={0.4 + 0.6 * glintPulse} />
      <rect x={0} y={0} width={W} height={H} fill={`url(#${id}-fadeTop)`} />
    </svg>
  );
};

/** image hero with cinemagraph life: slow breathing push, flowing displacement on the lower half, glint */
const ImageHero: React.FC<{src: string; W: number; H: number; frame: number; tint: boolean; ink: string; paper: string; glint: number[]; u: number; id: string}> = ({src, W, H, frame, tint, ink, paper, glint, u, id}) => {
  const t = frame / 30;
  const breathe = 1.02 + 0.012 * Math.sin(t * 0.8);
  const flt = tint ? `url(#${id}-map)` : 'none';
  const glintPulse = Math.max(0, Math.sin(clamp(((t % 2.6) / 2.6) / 0.35) * Math.PI));
  const im = (extra?: React.CSSProperties) => (
    <Img src={resolveSrc(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${breathe})`, transformOrigin: '50% 60%', ...extra}} />
  );
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          {tint && <GradientMapFilter id={`${id}-map`} colors={[ink, '#5a6aa8', paper]} contrast={1.1} />}
          <filter id={`${id}-flow`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.004 0.04" numOctaves={2} seed={3} result="n" />
            <feOffset in="n" dx={-frame * 1.6 * u} dy={0} result="m" />
            <feDisplacementMap in="SourceGraphic" in2="m" scale={10 * u} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div style={{position: 'absolute', inset: 0, filter: flt}}>
        {im()}
        <div style={{position: 'absolute', inset: 0, clipPath: 'inset(58% 0 0 0)', filter: `url(#${id}-flow)`}}>{im()}</div>
      </div>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <Sparkle x={W * glint[0]} y={H * glint[1]} size={(12 + 26 * glintPulse) * u} color="#ffffff" rotate={glintPulse * 20} opacity={0.3 + 0.7 * glintPulse} />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: '22%', background: `linear-gradient(${paper}, ${paper}00)`}} />
    </div>
  );
};

// ---------------------------------------------------------------------------------------------- page
const LogoMark: React.FC<{i: number; s: number; color: string}> = ({i, s, color}) => {
  const k = i % 6;
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{display: 'block'}}>
      {k === 0 && <path d="M10 2 L18 17 H2 Z" fill={color} />}
      {k === 1 && <path d="M11 1 L4 11 H9 L8 19 L16 8 H11 Z" fill={color} />}
      {k === 2 && <circle cx={10} cy={10} r={7} fill="none" stroke={color} strokeWidth={3} />}
      {k === 3 && <path d="M3 3 H17 L10 10 H17 L3 17 L10 10 H3 Z" fill={color} />}
      {k === 4 && <path d="M2 10 C2 5 6 3 10 7 C14 3 18 5 18 10 C18 15 14 17 10 13 C6 17 2 15 2 10 Z" fill={color} />}
      {k === 5 && <path d="M3 6 L10 2 L17 6 L10 10 Z M3 10 L10 14 L17 10 M3 14 L10 18 L17 14" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />}
    </svg>
  );
};

const BrowserMockup: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames: D} = useStage();
  const id = 'bmock';

  // window rect (inset 3.7 % / 4.6 %)
  const insX = w * (portrait ? 0.04 : 0.046);
  const insY = h * (portrait ? 0.03 : 0.037);
  const rad = h * 0.013 * (portrait ? 0.7 : 1);
  const barH = p.chrome ? 46 * u : 0;
  const Wn = w - insX * 2;
  const Hn = h - insY * 2;
  const W = Wn;
  const H = Hn - barH; // viewport
  const enter = prog(frame, 0, 22, ease.out);

  // scroll
  const scrollT = p.scroll > 0 ? prog(frame, 150, 205, ease.inOut) : 0;
  const pageH = H * (1 + Math.max(0, p.scroll));
  const sy = scrollT * (pageH - H);

  // page metrics
  const pad = portrait ? W * 0.07 : W * 0.045;
  const navH = portrait ? 90 * u : 74 * u;
  const hlSize = portrait ? fitSize(p.headline.reduce((a, b) => (a.length > b.length ? a : b), ''), 76 * u, W - pad * 2, 'sans') : fitSize(p.headline.reduce((a, b) => (a.length > b.length ? a : b), ''), W * 0.042, W * 0.46, 'sans');
  const heroTop = portrait ? H * 0.43 : H * 0.36;
  const heroBot = portrait ? H * 0.86 : H * 0.88;
  const heroH = heroBot - heroTop;

  // cursor path: glide to the primary CTA, press, then rest
  const ctaX = portrait ? pad + 110 * u : W * 0.63 + 40 * u;
  const ctaY = portrait ? navH + hlSize * 2.3 + 190 * u : navH + H * 0.1 + 78 * u;
  const cp = prog(frame, 50, 92, ease.inOut);
  const c0 = [W * 0.48, H * 0.73];
  const curX = c0[0] + (ctaX + 30 * u - c0[0]) * cp + Math.sin(cp * Math.PI) * 30 * u;
  const curY = c0[1] + (ctaY + 14 * u - c0[1]) * cp - Math.sin(cp * Math.PI) * 40 * u;
  const press = prog(frame, 100, 104, ease.out) * (1 - prog(frame, 106, 112, ease.out));
  const hover = prog(frame, 88, 96, ease.out);

  const grad = `linear-gradient(90deg, ${p.gradFrom} 0%, ${p.gradTo} 100%)`;
  const textGrad: React.CSSProperties = {backgroundImage: grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent'};

  const cta = (label: string, i: number) => {
    const primary = i === 0;
    const hv = primary ? hover : 0;
    return (
      <div
        key={i}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10 * u,
          padding: `${(portrait ? 16 : 12) * u}px ${(portrait ? 28 : 22) * u}px`,
          borderRadius: 40 * u,
          fontSize: (portrait ? 24 : 18) * u,
          fontWeight: 600,
          background: primary ? (hv > 0 ? `color-mix(in srgb, ${p.ink} ${100 - hv * 18}%, #4f63c9)` : p.ink) : 'transparent',
          color: primary ? '#fff' : p.ink,
          border: `${1.5 * u}px solid ${p.ink}`,
          transform: `scale(${1 - press * 0.05 * (primary ? 1 : 0) + hv * 0.03})`,
          boxShadow: primary ? `0 ${6 * u * hv}px ${18 * u * hv}px rgba(20,35,91,${0.3 * hv})` : 'none',
        }}
      >
        {label} <span style={{fontSize: '1.1em'}}>→</span>
      </div>
    );
  };

  const hero = p.heroSrc ? (
    <ImageHero src={p.heroSrc} W={W} H={heroH} frame={frame} tint={p.heroTint} ink={p.ink} paper={p.paper} glint={p.glint} u={u} id={id} />
  ) : (
    <EtchedHero W={W} H={heroH} frame={frame} ink={p.ink} paper={p.paper} u={u} id={id} />
  );

  const page = (
    <div style={{position: 'absolute', left: 0, top: -sy, width: W, height: pageH, background: p.paper, fontFamily: fonts.sans, color: p.ink}}>
      {/* hero */}
      <div style={{position: 'absolute', left: 0, top: heroTop, width: W, height: heroH, overflow: 'hidden'}}>{hero}</div>
      {/* nav */}
      <div style={{position: 'absolute', left: pad, right: pad, top: 0, height: navH, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10 * u, fontWeight: 600, fontSize: (portrait ? 28 : 21) * u}}>
          <svg width={30 * u} height={22 * u} viewBox="0 0 30 22">
            <path d="M2 20 V6 L8 2 L8 20 M12 20 V2 L18 6 V20 M22 20 V6 L28 2 V20" fill="none" stroke={p.ink} strokeWidth={2.4} strokeLinejoin="round" />
          </svg>
          {p.brand}
        </div>
        {portrait ? (
          <div style={{display: 'flex', flexDirection: 'column', gap: 6 * u}}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{width: 30 * u, height: 3 * u, background: p.ink, borderRadius: 2 * u}} />
            ))}
          </div>
        ) : (
          <div style={{display: 'flex', gap: 34 * u, fontSize: 15 * u, opacity: 0.85}}>
            {p.nav.map((n, i) => (
              <span key={i}>
                {n}
                {i < 2 ? ' ⌄' : ''}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* headline block */}
      <div style={{position: 'absolute', left: pad, top: navH + (portrait ? 40 * u : H * 0.09), width: portrait ? W - pad * 2 : W * 0.5}}>
        {p.headline.map((l, i) => (
          <div key={i} style={{fontSize: hlSize, fontWeight: 600, lineHeight: 1.04, letterSpacing: '-0.01em', ...textGrad, display: 'inline-block', paddingRight: 4 * u}}>
            {l}
          </div>
        ))}
      </div>
      <div
        style={
          portrait
            ? {position: 'absolute', left: pad, right: pad, top: navH + 40 * u + hlSize * 2.2 + 24 * u}
            : {position: 'absolute', left: W * 0.63, width: W * 0.32, top: navH + H * 0.1}
        }
      >
        <div style={{fontSize: (portrait ? 26 : 16.5) * u, lineHeight: 1.45, opacity: 0.85, marginBottom: (portrait ? 26 : 18) * u}}>{p.subtitle}</div>
        <div style={{display: 'flex', gap: 12 * u}}>{p.ctas.map(cta)}</div>
      </div>
      {/* logos */}
      <div
        style={{
          position: 'absolute',
          left: pad,
          right: pad,
          top: heroBot + (portrait ? 30 * u : 8 * u),
          height: portrait ? H * 0.11 : H - heroBot - 16 * u,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: (portrait ? 40 : 52) * u,
          rowGap: 16 * u,
          fontSize: (portrait ? 24 : 17) * u,
          fontWeight: 600,
          opacity: 0.85,
        }}
      >
        {p.logos.map((l, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 7 * u}}>
            <LogoMark i={i} s={(portrait ? 22 : 17) * u} color={p.ink} />
            {l}
          </div>
        ))}
      </div>
      {/* below the fold: features */}
      {p.scroll > 0 && (
        <div style={{position: 'absolute', left: pad, right: pad, top: H + (portrait ? 40 : 30) * u}}>
          <div style={{fontSize: (portrait ? 44 : 36) * u, fontWeight: 600, letterSpacing: '-0.01em', ...textGrad, display: 'inline-block'}}>Everything moves together</div>
          <div style={{display: 'flex', flexDirection: portrait ? 'column' : 'row', gap: 22 * u, marginTop: 28 * u}}>
            {p.features.map((f, i) => (
              <div key={i} style={{flex: 1, borderRadius: 16 * u, background: '#ffffff', boxShadow: `0 ${6 * u}px ${24 * u}px rgba(20,35,91,0.10)`, padding: 24 * u, border: `1px solid rgba(20,35,91,0.08)`}}>
                <div style={{width: 40 * u, height: 40 * u, borderRadius: 10 * u, background: grad, marginBottom: 16 * u, opacity: 0.9}} />
                <div style={{fontSize: (portrait ? 28 : 20) * u, fontWeight: 600, marginBottom: 8 * u}}>{f}</div>
                <div style={{fontSize: (portrait ? 20 : 14.5) * u, lineHeight: 1.5, opacity: 0.7}}>Ship faster with a workflow that keeps every frame, file and teammate in sync.</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // scrollbar thumb
  const thumbH = 40 * u;
  const thumbY = 8 * u + (H - thumbH - 16 * u) * scrollT;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 0% 0%, ${p.backdrop[0]} 0%, transparent 45%), linear-gradient(${p.backdrop[1]} 0%, ${p.backdrop[2]} 55%, ${p.backdrop[3]} 100%)`}}>
      <div
        style={{
          position: 'absolute',
          left: insX,
          top: insY,
          width: Wn,
          height: Hn,
          borderRadius: rad,
          overflow: 'hidden',
          boxShadow: `0 ${h * 0.022}px ${h * 0.055}px rgba(20,25,35,${0.35 * enter})`,
          transform: `translateY(${(1 - enter) * 40 * u}px) scale(${0.97 + 0.03 * enter})`,
          opacity: enter,
          background: p.paper,
        }}
      >
        {p.chrome && (
          <div style={{position: 'absolute', left: 0, top: 0, width: Wn, height: barH, background: '#f4f5f8', borderBottom: '1px solid rgba(20,35,91,0.1)', display: 'flex', alignItems: 'center'}}>
            {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
              <div key={i} style={{width: 13 * u, height: 13 * u, borderRadius: '50%', background: c, marginLeft: (i ? 8 : 20) * u}} />
            ))}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                width: Math.min(Wn * 0.42, 520 * u),
                height: 28 * u,
                borderRadius: 8 * u,
                background: '#e7e9ef',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8 * u,
                fontFamily: fonts.sans,
                fontSize: 14 * u,
                color: '#5b6178',
              }}
            >
              <svg width={11 * u} height={13 * u} viewBox="0 0 11 13">
                <rect x={1} y={5.5} width={9} height={7} rx={1.5} fill="#5b6178" />
                <path d="M3 5.5 V3.5 C3 1 8 1 8 3.5 V5.5" fill="none" stroke="#5b6178" strokeWidth={1.4} />
              </svg>
              {p.url}
            </div>
          </div>
        )}
        <div style={{position: 'absolute', left: 0, top: barH, width: W, height: H, overflow: 'hidden'}}>
          {page}
          <div style={{position: 'absolute', right: 4 * u, top: thumbY, width: 4 * u, height: thumbH, borderRadius: 2 * u, background: 'rgba(85,85,85,0.5)', opacity: p.scroll > 0 ? 1 : 0.6}} />
          {p.cursor && (
            <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
              <ArrowCursor x={curX} y={curY} size={(portrait ? 40 : 32) * u} press={press} />
            </svg>
          )}
        </div>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: tween(frame, [D - 8, D], [0, 0], ease.linear)}} />
    </AbsoluteFill>
  );
};

export const browserMockup = defineMotion<Props>({
  id: 'browser-mockup',
  title: 'Browser mockup with living hero',
  category: 'ui',
  description: 'Rounded, shadowed browser window on a blue-grey backdrop showing a landing page whose hero illustration is a living cinemagraph; cursor clicks the CTA, page scrolls.',
  source: ['video9 browser-frame-mockup', 'video5 cinemagraph-hero-loop', 'video5 gradient-headline'],
  useFor: 'Product / website showcases, "here is the site" beats, SaaS launch videos, portfolio pieces.',
  durationInFrames: 240,
  defaultProps: {
    brand: 'Lumen',
    url: 'lumen.studio',
    nav: ['Product', 'Resources', 'Pricing', 'Blog'],
    headline: ['A Thousand Lights', 'One Living Website'],
    subtitle: 'Turn still artwork into pages that breathe, so every visit feels like the first time.',
    ctas: ['Get started', 'Book a demo'],
    logos: ['Vertex', 'Northwind', 'Orbit', 'Halcyon', 'Kitebase', 'Stackly'],
    features: ['Living heroes', 'Pixel-perfect UI', 'Ships anywhere'],
    heroSrc: '',
    heroTint: true,
    glint: [0.27, 0.12],
    ink: '#14235B',
    paper: '#EDEFF7',
    gradFrom: '#14235B',
    gradTo: '#63678F',
    backdrop: ['#e2e7ee', '#aeb6c2', '#9da6b4', '#76808f'],
    chrome: true,
    cursor: true,
    scroll: 0.5,
  },
  propDocs: {
    brand: 'brand name in the nav',
    url: 'address-bar text (chrome: true)',
    headline: 'two-line headline (gradient filled)',
    ctas: 'button labels; the first is the filled primary the cursor clicks',
    logos: 'logo strip names',
    features: 'feature card titles shown after the scroll',
    heroSrc: 'public/ image for the hero (empty = procedural etched lighthouse scene)',
    heroTint: 'gradient-map the hero image to ink/paper so it matches the page',
    glint: '[x, y] fraction of the hero where the star glint sits (image hero only)',
    backdrop: '[highlight, top, mid, bottom] studio backdrop colours',
    chrome: 'show the browser top bar (traffic lights + URL)',
    scroll: 'how far the page scrolls (fraction of the viewport, 0 = no scroll)',
  },
  component: BrowserMockup,
  tags: ['browser', 'website', 'mockup', 'landing-page', 'cinemagraph', 'ui'],
});
