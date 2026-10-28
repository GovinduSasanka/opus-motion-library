import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog, springAt} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {hexA, mixHex, useUid} from '../../core/r2-pr4-kit';
import {rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Atom builder: a nucleus of protons and neutrons grows one proton per beat while a counter and an element
 * symbol/name card update (H, He, Li ...). Each new electron is a seeded swarm of glowing particles that spreads
 * out into its shell, so the electron cloud expands shell by shell. Schematic (not to scale).
 */
type El = {symbol: string; name: string; z?: number; neutrons?: number};
type Props = {
  title: string;
  caption: string;
  elements: El[];
  background: string;
  protonColor: string;
  neutronColor: string;
  electronColor: string;
  inkColor: string;
  accent: string;
  beatFrames: number;
  startFrame: number;
  particles: number;
  stars: number;
  seed: number;
  protonsLabel?: string;
  neutronsLabel?: string;
  electronsLabel?: string;
  protonNote?: string;
};

const ELEMENTS: El[] = [
  {symbol: 'H', name: 'Hydrogen', neutrons: 0},
  {symbol: 'He', name: 'Helium', neutrons: 2},
  {symbol: 'Li', name: 'Lithium', neutrons: 4},
  {symbol: 'Be', name: 'Beryllium', neutrons: 5},
  {symbol: 'B', name: 'Boron', neutrons: 6},
  {symbol: 'C', name: 'Carbon', neutrons: 6},
  {symbol: 'N', name: 'Nitrogen', neutrons: 7},
  {symbol: 'O', name: 'Oxygen', neutrons: 8},
  {symbol: 'F', name: 'Fluorine', neutrons: 10},
  {symbol: 'Ne', name: 'Neon', neutrons: 10},
];
const CAP = [2, 8, 18, 32, 32];
const shellOf = (e: number) => {
  let k = e;
  for (let s = 0; s < CAP.length; s++) {
    if (k < CAP[s]) return s;
    k -= CAP[s];
  }
  return CAP.length - 1;
};
const SHELL_F = [0.3, 0.55, 0.78, 0.93, 1.0];

const AtomElectronCloud: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, portrait, fps} = useStage();
  const uid = useUid('aec');
  const els = (p.elements.length ? p.elements : ELEMENTS).map((e, i) => ({
    ...e,
    z: e.z ?? i + 1,
    n: e.neutrons ?? Math.round((e.z ?? i + 1) * 1.05),
  }));
  const beat = Math.max(8, p.beatFrames);
  const tk = (k: number) => p.startFrame + k * beat;
  const kNow = clamp(Math.floor((frame - p.startFrame) / beat), -1, els.length - 1);
  const cur = kNow >= 0 ? els[kNow] : null;
  const tall = w < h * 1.3;

  // layout
  const ax = tall ? cx : w * 0.63;
  const ay = tall ? h * (portrait ? 0.62 : 0.64) : h * 0.5;
  const Rmax = tall ? Math.min(w * 0.46, h * (portrait ? 0.27 : 0.33)) : Math.min(h * 0.47, w * 0.3);

  // nucleon slots (centre-out fibonacci packing) and births
  const maxZ = Math.max(...els.map((e) => e.z));
  const nucleons = React.useMemo(() => {
    const list: {type: 'p' | 'n'; birth: number}[] = [];
    let pz = 0;
    let pn = 0;
    els.forEach((e, k) => {
      const dp = Math.max(0, e.z - pz);
      const dn = Math.max(0, e.n - pn);
      for (let i = 0; i < dp; i++) list.push({type: 'p', birth: tk(k) + list.length * 0 + i * 2});
      for (let i = 0; i < dn; i++) list.push({type: 'n', birth: tk(k) + 4 + (dp + i) * 2});
      pz = Math.max(pz, e.z);
      pn = Math.max(pn, e.n);
    });
    const M = list.length;
    const g = rng(p.seed + 11);
    return list.map((l, i) => {
      const y = 1 - (2 * (i + 0.5)) / Math.max(1, M);
      const rr = Math.sqrt(Math.max(0, 1 - y * y));
      const th = i * 2.399963 + g() * 0.3;
      const rad = Math.cbrt((i + 0.5) / Math.max(1, M)) * (0.85 + g() * 0.3);
      return {...l, x: Math.cos(th) * rr * rad, y: y * rad, z: Math.sin(th) * rr * rad, ph: g() * 6.28};
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(els), p.startFrame, beat, p.seed]);
  const M = nucleons.length;
  const nr = 21 * u;
  const nucR = 21 * u * Math.cbrt(Math.max(1, M));

  // electron swarms
  const swarm = React.useMemo(() => {
    const g = rng(p.seed * 7 + 5);
    return Array.from({length: maxZ}, (_, e) => ({
      shell: shellOf(e),
      pts: Array.from({length: p.particles}, () => ({
        c: g() * 2 - 1,
        th: g() * 6.283,
        w: (0.012 + g() * 0.03) * (g() < 0.5 ? -1 : 1),
        rj: 1 + (g() + g() + g() - 1.5) * 0.16,
        s: 0.7 + g() * 1.4,
        ph: g() * 6.28,
      })),
    }));
  }, [maxZ, p.particles, p.seed]);
  const electronBirth = (e: number) => {
    for (let k = 0; k < els.length; k++) if (els[k].z >= e + 1) return tk(k) + 6;
    return 1e9;
  };
  const shellBirth = (s: number) => {
    const e0 = CAP.slice(0, s).reduce((a, b) => a + b, 0);
    return electronBirth(e0);
  };
  const nShells = shellOf(maxZ - 1) + 1;

  const stars = React.useMemo(() => {
    const g = rng(p.seed + 41);
    return Array.from({length: p.stars}, () => ({x: g(), y: g(), r: 0.5 + g() * 1.3, t: g() * 6.28, s: 0.4 + g() * 1.2}));
  }, [p.stars, p.seed]);

  const ink = p.inkColor;
  const mono = fonts.mono;
  const pulse = (k: number) => (k >= 0 ? springAt(frame, fps, tk(k), 'pop') : 0);
  const sinceBeat = kNow >= 0 ? frame - tk(kNow) : 99;

  // text panel metrics
  const cardS = (tall ? 150 : 210) * u;
  const px = tall ? w * 0.06 : w * 0.07;
  const cardY = tall ? h * (portrait ? 0.125 : 0.12) : h * 0.34;
  const titleY = tall ? h * (portrait ? 0.05 : 0.07) : h * 0.2;

  const stat = (label: string, val: number, x: number, y: number, col: string, size: number) => (
    <g transform={`translate(${x},${y})`}>
      <text fontFamily={mono} fontSize={size * 0.42} fill={hexA(ink, 0.55)} letterSpacing={size * 0.05}>
        {label}
      </text>
      <text y={size * 0.95} fontFamily={fonts.grotesk} fontWeight={700} fontSize={size} fill={col}>
        {val}
      </text>
    </g>
  );

  // nucleus rotation + depth sort
  const rot = frame * 0.012;
  const nuc = nucleons
    .map((n, i) => {
      const a = prog(frame, n.birth, n.birth + 20, ease.expoOut);
      const s = springAt(frame, fps, n.birth, 'pop');
      const X = n.x * Math.cos(rot) + n.z * Math.sin(rot);
      const Z = -n.x * Math.sin(rot) + n.z * Math.cos(rot);
      const fly = (1 - a) * 260 * u;
      const dx = (X * nucR) / 1 + (X >= 0 ? 1 : -1) * fly * Math.abs(X) * 0.8;
      return {i, n, a, s, x: ax + dx, y: ay + n.y * nucR + (1 - a) * -90 * u, z: Z};
    })
    .filter((o) => frame >= o.n.birth)
    .sort((a, b) => a.z - b.z);

  const haloK = prog(frame, 0, 30, ease.out);

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <radialGradient id={uid + 'bg'} cx="50%" cy="50%" r="75%">
            <stop offset="0" stopColor={mixHex(p.background, '#2a5ea8', 0.35)} />
            <stop offset="1" stopColor={p.background} />
          </radialGradient>
          <radialGradient id={uid + 'halo'}>
            <stop offset="0" stopColor={p.electronColor} stopOpacity="0.28" />
            <stop offset="0.5" stopColor={p.electronColor} stopOpacity="0.07" />
            <stop offset="1" stopColor={p.electronColor} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={uid + 'p'} cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor={mixHex(p.protonColor, '#ffffff', 0.6)} />
            <stop offset="0.5" stopColor={p.protonColor} />
            <stop offset="1" stopColor={mixHex(p.protonColor, '#300018', 0.55)} />
          </radialGradient>
          <radialGradient id={uid + 'n'} cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor={mixHex(p.neutronColor, '#ffffff', 0.6)} />
            <stop offset="0.5" stopColor={p.neutronColor} />
            <stop offset="1" stopColor={mixHex(p.neutronColor, '#0a1430', 0.6)} />
          </radialGradient>
          <radialGradient id={uid + 'nuc'}>
            <stop offset="0" stopColor={p.protonColor} stopOpacity="0.5" />
            <stop offset="1" stopColor={p.protonColor} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#${uid}bg)`} />
        {stars.map((s, i) => (
          <circle key={i} cx={s.x * w} cy={s.y * h} r={s.r * u} fill="#cfe0ff" opacity={0.25 + 0.3 * (0.5 + 0.5 * Math.sin(frame * 0.05 * s.s + s.t))} />
        ))}

        {/* atom halo + shell rings */}
        <circle cx={ax} cy={ay} r={Rmax * 1.25} fill={`url(#${uid}halo)`} opacity={haloK} />
        {Array.from({length: nShells}, (_, s) => {
          const b = shellBirth(s);
          const k = prog(frame, b, b + 34, ease.expoOut);
          if (k <= 0) return null;
          const r = Rmax * SHELL_F[s] * (0.3 + 0.7 * k);
          return (
            <circle key={s} cx={ax} cy={ay} r={r} fill="none" stroke={hexA(p.electronColor, 0.22 * k)} strokeWidth={1.4 * u} strokeDasharray={`${2 * u} ${9 * u}`} strokeLinecap="round" />
          );
        })}

        {/* electron swarms */}
        {swarm.map((sw, e) => {
          const b = electronBirth(e);
          if (frame < b) return null;
          const k = prog(frame, b, b + 36, ease.expoOut);
          const al = prog(frame, b, b + 10, ease.out);
          const R = Rmax * SHELL_F[sw.shell] * (0.3 + 0.7 * k);
          const flat = sw.shell === 0 ? 1 : sw.shell === 1 ? 0.8 : 0.65;
          const col = mixHex(p.electronColor, '#ffffff', 0.15 + sw.shell * 0.04);
          return (
            <g key={e} opacity={al}>
              {sw.pts.map((pt, j) => {
                const th = pt.th + frame * pt.w;
                const rr = Math.sqrt(1 - pt.c * pt.c);
                const X = rr * Math.cos(th);
                const Z = rr * Math.sin(th);
                const Y = pt.c * flat;
                const rad = R * pt.rj * (1 + 0.025 * Math.sin(frame * 0.08 + pt.ph));
                const persp = 1 / (1 - Z * 0.22);
                const x = ax + X * rad * persp;
                const y = ay + Y * rad * persp;
                const depth = 0.3 + 0.7 * (Z + 1) * 0.5;
                const tw = 0.75 + 0.25 * Math.sin(frame * 0.2 + pt.ph);
                return <circle key={j} cx={x} cy={y} r={pt.s * 1.9 * u * persp * (0.6 + 0.4 * depth)} fill={col} opacity={Math.min(1, depth * tw * 1.15)} />;
              })}
            </g>
          );
        })}

        {/* nucleus */}
        {M > 0 && <circle cx={ax} cy={ay} r={nucR * 2.3} fill={`url(#${uid}nuc)`} opacity={0.6} />}
        {nuc.map((o) => {
          const sc = clamp(o.s, 0, 1.25) * (0.88 + 0.12 * ((o.z + 1) / 2));
          return (
            <circle
              key={o.i}
              cx={o.x}
              cy={o.y}
              r={nr * sc}
              fill={`url(#${uid}${o.n.type})`}
              opacity={o.a}
              stroke={o.n.type === 'p' ? hexA('#ffffff', 0.35) : hexA('#ffffff', 0.2)}
              strokeWidth={0.8 * u}
            />
          );
        })}
        {/* new-proton flash */}
        {kNow >= 0 && sinceBeat < 18 && (
          <circle cx={ax} cy={ay} r={nucR * (1.2 + sinceBeat * 0.2)} fill="none" stroke={hexA(p.protonColor, 0.8 * (1 - sinceBeat / 18))} strokeWidth={3 * u} />
        )}

        {/* header */}
        <text x={px} y={titleY} fontFamily={fonts.grotesk} fontWeight={700} fontSize={(portrait ? 54 : tall ? 40 : 46) * u} fill={ink} opacity={prog(frame, 0, 18)}>
          {p.title}
        </text>
        <text x={px} y={titleY + (portrait ? 52 : tall ? 36 : 44) * u} fontFamily={mono} fontSize={(portrait ? 28 : tall ? 19 : 22) * u} fill={hexA(ink, 0.6)} opacity={prog(frame, 6, 24)}>
          {p.caption}
        </text>

        {/* element card */}
        {cur && (
          <g transform={`translate(${px},${cardY})`}>
            <g transform={`translate(${cardS / 2},${cardS / 2}) scale(${0.85 + 0.15 * clamp(pulse(kNow), 0, 1.2)}) translate(${-cardS / 2},${-cardS / 2})`}>
              <rect width={cardS} height={cardS} rx={cardS * 0.14} fill={hexA(mixHex(p.background, '#ffffff', 0.08), 0.9)} stroke={p.accent} strokeWidth={2.5 * u} />
              <text x={cardS * 0.1} y={cardS * 0.22} fontFamily={mono} fontSize={cardS * 0.13} fill={hexA(ink, 0.7)}>
                {cur.z}
              </text>
              <text x={cardS / 2} y={cardS * 0.67} textAnchor="middle" fontFamily={fonts.display} fontSize={cardS * (cur.symbol.length > 1 ? 0.46 : 0.55)} fill={ink}>
                {cur.symbol}
              </text>
              <text x={cardS / 2} y={cardS * 0.88} textAnchor="middle" fontFamily={fonts.sans} fontWeight={600} fontSize={cardS * 0.12} fill={hexA(ink, 0.75)}>
                {cur.name}
              </text>
            </g>
            {/* +1 proton chip */}
            {sinceBeat < 26 && (
              <g transform={`translate(${cardS + 24 * u},${(portrait ? -cardS * 0.06 : cardS * 0.2) - sinceBeat * 1.2 * u})`} opacity={1 - prog(frame, tk(kNow) + 10, tk(kNow) + 26, ease.in)}>
                <text fontFamily={fonts.grotesk} fontWeight={700} fontSize={(portrait ? 34 : tall ? 24 : 30) * u} fill={p.protonColor}>
                  {p.protonNote}
                </text>
              </g>
            )}
            {/* stats */}
            {(() => {
              const s = (portrait ? 70 : tall ? 54 : 64) * u;
              const x0 = tall ? cardS + 44 * u : 0;
              const y0 = tall ? cardS * 0.32 : cardS + 40 * u;
              const gap = portrait ? 142 * u : tall ? 100 * u : 150 * u;
              return (
                <>
                  {stat(p.protonsLabel ?? 'PROTONS', cur.z, x0, y0, p.protonColor, s)}
                  {stat(p.neutronsLabel ?? 'NEUTRONS', cur.n, x0 + gap * 1.35, y0, p.neutronColor, s)}
                  {stat(p.electronsLabel ?? 'ELECTRONS', cur.z, x0 + gap * 2.95, y0, p.electronColor, s)}
                </>
              );
            })()}
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const atomElectronCloud = defineMotion<Props>({
  id: 'atom-electron-cloud',
  title: 'Atom electron cloud builder',
  category: 'data',
  description:
    'Dark blue space: a nucleus of protons and neutrons grows one proton per beat with a counter and an element symbol/name card updating (H, He, Li ...) while each new electron is a seeded particle swarm that spreads into its shell, expanding the electron cloud.',
  source: ['analysis/sheets/r3/v1 (3D periodic table: click adds a proton, electron cloud)'],
  useFor: 'Chemistry and physics explainers, "how elements are built" lessons, periodic-table intros, science channel hero shots.',
  durationInFrames: 300,
  defaultProps: {
    title: 'Build an atom',
    caption: 'Each click adds a proton.',
    elements: ELEMENTS,
    background: '#050f26',
    protonColor: '#ff6b8c',
    neutronColor: '#a9b9d8',
    electronColor: '#6fd0ff',
    inkColor: '#e8f0ff',
    accent: '#6fd0ff',
    beatFrames: 26,
    startFrame: 22,
    particles: 110,
    stars: 90,
    seed: 4,
    protonsLabel: 'PROTONS',
    neutronsLabel: 'NEUTRONS',
    electronsLabel: 'ELECTRONS',
    protonNote: '+1 proton',
  },
  propDocs: {
    title: 'headline (top-left)',
    caption: 'mono sub-line',
    elements: 'steps [{symbol,name,z? (default index+1),neutrons? (default ~z)}], one per beat',
    background: 'space colour',
    protonColor: 'proton colour',
    neutronColor: 'neutron colour',
    electronColor: 'electron cloud / shell colour',
    inkColor: 'text colour',
    accent: 'element-card outline',
    beatFrames: 'frames between steps (30 fps)',
    startFrame: 'frame of the first step',
    particles: 'particles per electron (more = denser cloud)',
    stars: 'background star count',
    seed: 'nucleus layout / particle seed',
    protonsLabel: 'label of the proton counter',
    neutronsLabel: 'label of the neutron counter',
    electronsLabel: 'label of the electron counter',
    protonNote: 'floating note when a proton is added',
  },
  component: AtomElectronCloud,
  tags: ['atom', 'electron', 'proton', 'neutron', 'periodic table', 'chemistry', 'physics', 'element', 'particles', 'counter', 'science', 'education', 'dark', 'nucleus', 'shells'],
});
