import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {TAU, hash01, isTransparent} from '../../core/environment-kit';
import {n3} from '../../core/random';
import {PaperTexture, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Curl-flow swirl (video2 curl-flow-swirl).
 * Hundreds of tapered coloured ribbons (magenta, teal, gold, black, sky) advect through a
 * curl-noise velocity field v = curl(simplex3(x·s, y·s, t·0.2)) plus a tangential vortex term,
 * so they swirl turbulently around a dark spiky "pupil" (not a rigid rotation). Each ribbon is a
 * particle integrated from its seeded birth point (deterministic), drawn as its last ~14 positions
 * (20-60 px tail). Optionally clipped inside a red magnifier lens on cream paper, with boiling
 * sketch arcs around it.
 */
type Props = {
  background: string;
  backdrop: boolean;
  lens: boolean;
  lensColor: string;
  pupil: boolean;
  palette: string[];
  particleCount: number;
  vortexStrength: number;
  noiseScale: number;
  flowSpeed: number;
  ribbonWidth: number;
  seed: number;
};

type P = [number, number];

const CurlFlow: React.FC<Props> = ({background, backdrop, lens, lensColor, pupil, palette, particleCount, vortexStrength, noiseScale, flowSpeed, ribbonWidth, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, cx, cy} = useStage();
  const overlay = isTransparent(background);
  const scene = backdrop && !overlay;
  const lx = cx;
  const ly = lens ? cy * 0.96 : cy;
  const R = lens ? Math.min(w, h) * 0.38 : Math.hypot(w, h) / 2;
  const pR = Math.min(w, h) * 0.38 * 0.16;
  const s = (noiseScale * 2.2) / (Math.min(w, h) * 0.38);
  const sd = String(seed);
  const enter = prog(frame, 0, 14, ease.out);

  const vel = (x: number, y: number, f: number): P => {
    const tt = (f / fps) * 0.2 * 3;
    const e = 2 * u;
    const ps = (xx: number, yy: number) => n3('curl' + sd, xx * s, yy * s, tt);
    const dpy = (ps(x, y + e) - ps(x, y - e)) / (2 * e);
    const dpx = (ps(x + e, y) - ps(x - e, y)) / (2 * e);
    const cxv = dpy / s;
    const cyv = -dpx / s;
    const dx = x - lx;
    const dy = y - ly;
    const r = Math.hypot(dx, dy) || 1;
    const tang = vortexStrength * (0.75 + 0.5 * Math.min(1, (pR * 2.2) / r));
    return [(cxv * 2.4 * flowSpeed + (-dy / r) * tang) * u * 2.2, (cyv * 2.4 * flowSpeed + (dx / r) * tang) * u * 2.2];
  };

  const T = 22;
  const ribbons: React.ReactNode[] = [];
  const pal = palette.length ? palette : ['#D6317A'];
  for (let i = 0; i < particleCount; i++) {
    const L = 40 + Math.floor(40 * hash01(seed, i, 1));
    const off = Math.floor(hash01(seed, i, 2) * L);
    const c = Math.floor((frame + off) / L);
    const age = (frame + off) % L;
    const birth = frame - age;
    // birth point: uniform over the lens annulus (or whole frame)
    let x: number;
    let y: number;
    if (lens || pupil) {
      const rr = Math.sqrt((pR * 1.25) ** 2 / R ** 2 + (1 - (pR * 1.25) ** 2 / R ** 2) * hash01(seed, i, c, 3)) * R * (lens ? 0.97 : 1);
      const a = hash01(seed, i, c, 4) * TAU;
      x = lx + Math.cos(a) * rr;
      y = ly + Math.sin(a) * rr;
    } else {
      x = hash01(seed, i, c, 3) * w;
      y = hash01(seed, i, c, 4) * h;
    }
    const pts: P[] = [[x, y]];
    let dead = false;
    for (let k = 0; k < age; k++) {
      const v = vel(x, y, birth + k);
      x += v[0];
      y += v[1];
      const r = Math.hypot(x - lx, y - ly);
      if ((pupil && r < pR * 1.05) || (lens && r > R * 1.02)) {
        dead = true;
        break;
      }
      pts.push([x, y]);
      if (pts.length > T + 1) pts.shift();
    }
    if (dead || pts.length < 3) continue;
    const life = age / L;
    const env = Math.min(1, age / 8) * Math.min(1, (L - age) / 8);
    const w0 = (4 + 9 * Math.pow(hash01(seed, i, 5), 1.3)) * u * ribbonWidth * env * enter;
    if (w0 < 0.3 * u) continue;
    const left: string[] = [];
    const right: string[] = [];
    const n = pts.length;
    for (let k = 0; k < n; k++) {
      const a = pts[Math.max(0, k - 1)];
      const b = pts[Math.min(n - 1, k + 1)];
      let nx = -(b[1] - a[1]);
      let ny = b[0] - a[0];
      const nl = Math.hypot(nx, ny) || 1;
      nx /= nl;
      ny /= nl;
      const f = k / (n - 1);
      const ww = (w0 / 2) * Math.pow(f, 0.7) * (k === n - 1 ? 0.6 : 1);
      left.push(`${(pts[k][0] + nx * ww).toFixed(1)} ${(pts[k][1] + ny * ww).toFixed(1)}`);
      right.push(`${(pts[k][0] - nx * ww).toFixed(1)} ${(pts[k][1] - ny * ww).toFixed(1)}`);
    }
    const col = pal[Math.floor(hash01(seed, i, 6) * pal.length) % pal.length];
    ribbons.push(<path key={i} d={`M${left.join('L')}L${right.reverse().join('L')}Z`} fill={col} stroke={col} strokeWidth={0.6 * u} strokeLinejoin="round" opacity={0.92 - 0.2 * life} />);
  }

  // pupil: dark core with boiling spikes
  const boil = Math.floor(frame / 2);
  let spikes = '';
  if (pupil) {
    const ns = 110;
    for (let k = 0; k < ns; k++) {
      const a = (k / ns) * TAU;
      const ro = pR * (1.05 + 0.45 * hash01(seed, k, boil, 7));
      const ri = pR * 0.82;
      const a2 = a + (0.5 / ns) * TAU;
      spikes += `${k ? 'L' : 'M'}${(lx + Math.cos(a) * ro).toFixed(1)} ${(ly + Math.sin(a) * ro).toFixed(1)}L${(lx + Math.cos(a2) * ri).toFixed(1)} ${(ly + Math.sin(a2) * ri).toFixed(1)}`;
    }
    spikes += 'Z';
  }
  let iris = '';
  for (let k = 0; k < 90; k++) {
    const a = hash01(seed, k, 8) * TAU;
    const r0 = pR * (1.3 + 0.5 * hash01(seed, k, 9));
    const r1 = R * (0.45 + 0.5 * hash01(seed, k, 10));
    iris += `M${(lx + Math.cos(a) * r0).toFixed(1)} ${(ly + Math.sin(a) * r0).toFixed(1)}L${(lx + Math.cos(a + 0.15) * r1).toFixed(1)} ${(ly + Math.sin(a + 0.15) * r1).toFixed(1)}`;
  }
  // boiling sketch arcs outside the lens
  const arcs: React.ReactNode[] = [];
  if (lens && scene) {
    for (let k = 0; k < 12; k++) {
      const rr = R * (1.12 + 0.18 * hash01(seed, k, 11)) + (hash01(seed, k, boil, 12) - 0.5) * 5 * u;
      const a0 = hash01(seed, k, 13) * TAU + (hash01(seed, k, boil, 14) - 0.5) * 0.04;
      const span = (0.3 + 0.7 * hash01(seed, k, 15)) * 0.9;
      const a1 = a0 + span;
      arcs.push(<path key={k} d={`M ${lx + Math.cos(a0) * rr} ${ly + Math.sin(a0) * rr} A ${rr} ${rr} 0 0 1 ${lx + Math.cos(a1) * rr} ${ly + Math.sin(a1) * rr}`} stroke="#5E4E40" strokeWidth={(1.2 + 1.2 * hash01(seed, k, 16)) * u} fill="none" strokeDasharray={k % 3 ? undefined : `${18 * u} ${10 * u}`} opacity={0.55} strokeLinecap="round" />);
    }
  }
  const ringW = R * 0.075;
  const ha = (135 * Math.PI) / 180;
  const hx0 = lx + Math.cos(ha) * (R + ringW * 0.4);
  const hy0 = ly + Math.sin(ha) * (R + ringW * 0.4);
  const hl = R * 1.1;
  const lensScale = lens ? 0.94 + 0.06 * enter : 1;

  return (
    <AbsoluteFill style={{background: overlay ? 'transparent' : background}}>
      {scene && <PaperTexture opacity={0.35} />}
      <Svg>
        <defs>
          <radialGradient id="cf-lensbg" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#F7F0E2" />
            <stop offset="0.8" stopColor="#EFE4CF" />
            <stop offset="1" stopColor="#E2D2B6" />
          </radialGradient>
          <clipPath id="cf-clip">
            <circle cx={lx} cy={ly} r={R} />
          </clipPath>
          <linearGradient id="cf-handle" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={lensColor} />
            <stop offset="0.5" stopColor="#C4475C" />
            <stop offset="1" stopColor="#6E1A2A" />
          </linearGradient>
        </defs>
        <g transform={`translate(${lx} ${ly}) scale(${lensScale}) translate(${-lx} ${-ly})`} opacity={lens ? enter : 1}>
          {arcs}
          {lens && scene && (
            <g transform={`rotate(${(ha * 180) / Math.PI - 90} ${hx0} ${hy0})`}>
              <rect x={hx0 - R * 0.085} y={hy0} width={R * 0.17} height={hl} rx={R * 0.06} fill="url(#cf-handle)" />
              <rect x={hx0 - R * 0.11} y={hy0 - R * 0.02} width={R * 0.22} height={R * 0.12} rx={R * 0.03} fill="#6E1A2A" />
            </g>
          )}
          <g clipPath={lens ? 'url(#cf-clip)' : undefined}>
            {lens && <circle cx={lx} cy={ly} r={R} fill="url(#cf-lensbg)" />}
            {lens && <path d={iris} stroke="#9C7A5A" strokeWidth={0.8 * u} opacity={0.25} />}
            {ribbons}
            {pupil && (
              <g>
                <path d={spikes} fill="#1E1616" />
                <circle cx={lx} cy={ly} r={pR * 0.85} fill="#120D0D" />
                <circle cx={lx - pR * 0.3} cy={ly - pR * 0.3} r={pR * 0.12} fill="#fff" opacity={0.25} />
              </g>
            )}
          </g>
          {lens && (
            <g>
              <circle cx={lx} cy={ly} r={R + ringW / 2} fill="none" stroke={lensColor} strokeWidth={ringW} />
              <circle cx={lx} cy={ly} r={R + ringW} fill="none" stroke="#5E1422" strokeWidth={1.6 * u} opacity={0.8} />
              <circle cx={lx} cy={ly} r={R} fill="none" stroke="#5E1422" strokeWidth={1.4 * u} opacity={0.8} />
              <path d={`M ${lx + Math.cos(-2.4) * (R + ringW * 0.5)} ${ly + Math.sin(-2.4) * (R + ringW * 0.5)} A ${R + ringW * 0.5} ${R + ringW * 0.5} 0 0 1 ${lx + Math.cos(-1.5) * (R + ringW * 0.5)} ${ly + Math.sin(-1.5) * (R + ringW * 0.5)}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={ringW * 0.25} fill="none" strokeLinecap="round" />
              <circle cx={lx} cy={ly} r={R} fill="#ffffff" opacity={0.06} />
            </g>
          )}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const curlFlow = defineMotion<Props>({
  id: 'curl-flow',
  title: 'Curl-flow swirl',
  category: 'environment',
  description: 'Hundreds of coloured ribbons stream through a turbulent curl-noise vortex around a dark spiky pupil, inside a red magnifier lens on cream paper (or full-frame). Overlay-capable.',
  source: ['video2 18.54-20.71'],
  useFor: 'Inspection / insight / chaos-under-the-lens beats, psychedelic or hypnotic transitions, "looking closer" moments.',
  durationInFrames: 150,
  defaultProps: {
    background: '#E7DDC7',
    backdrop: true,
    lens: true,
    lensColor: '#B8323F',
    pupil: true,
    palette: ['#D6317A', '#22B0C4', '#E3A72F', '#161616', '#5FC3E4', '#E35D3A', '#22B0C4', '#D6317A'],
    particleCount: 760,
    vortexStrength: 1.5,
    noiseScale: 0.65,
    flowSpeed: 1,
    ribbonWidth: 1,
    seed: 1,
  },
  propDocs: {
    background: 'CSS background; "transparent" = overlay',
    backdrop: 'paper texture, iris lines, magnifier handle and boiling sketch arcs',
    lens: 'clip the flow inside a magnifier lens circle; false = full frame',
    lensColor: 'magnifier rim colour',
    pupil: 'dark spiky pupil at the vortex centre',
    palette: 'ribbon colours',
    particleCount: 'number of ribbons',
    vortexStrength: 'tangential swirl strength',
    noiseScale: 'curl-noise feature frequency (higher = smaller eddies)',
    flowSpeed: 'curl-noise advection speed',
    ribbonWidth: 'ribbon width multiplier',
    seed: 'random seed',
  },
  component: CurlFlow,
  tags: ['flow', 'swirl', 'vortex', 'psychedelic', 'lens', 'particles', 'overlay'],
});
