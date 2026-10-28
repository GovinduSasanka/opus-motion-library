import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog, springAt} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {lighten, mix, rgbaStr} from '../../core/r2-pr3-kit';

/**
 * Atom / molecule model. kind 'bohr': nucleus of shaded protons + neutrons, electron shells on tilted orbit rings
 * (60 / 0 / -60 deg) with trails, rotating in true 3D so rings pass behind and in front of the nucleus.
 * kind 'molecule': rotating ball-and-stick molecule (water, methane, CO2, ammonia, benzene) with CPK colours.
 */
type Atom = {el: string; x: number; y: number; z: number};
type Props = {
  kind: 'bohr' | 'molecule';
  element: string;
  shells: number[];
  molecule: string;
  atoms: Atom[];
  bonds: [number, number][];
  title: string;
  caption: string;
  rotation: number;
  electronPeriod: number;
  protonColor: string;
  neutronColor: string;
  electronColor: string;
  orbitColor: string;
  background: string;
  glow: number;
};

const ELEMENTS: Record<string, {name: string; p: number; n: number; shells: number[]}> = {
  H: {name: 'Hydrogen', p: 1, n: 0, shells: [1]},
  He: {name: 'Helium', p: 2, n: 2, shells: [2]},
  Li: {name: 'Lithium', p: 3, n: 4, shells: [2, 1]},
  C: {name: 'Carbon', p: 6, n: 6, shells: [2, 4]},
  N: {name: 'Nitrogen', p: 7, n: 7, shells: [2, 5]},
  O: {name: 'Oxygen', p: 8, n: 8, shells: [2, 6]},
  Ne: {name: 'Neon', p: 10, n: 10, shells: [2, 8]},
  Na: {name: 'Sodium', p: 11, n: 12, shells: [2, 8, 1]},
  Si: {name: 'Silicon', p: 14, n: 14, shells: [2, 8, 4]},
  Cl: {name: 'Chlorine', p: 17, n: 18, shells: [2, 8, 7]},
  Fe: {name: 'Iron', p: 26, n: 30, shells: [2, 8, 14, 2]},
};

const CPK: Record<string, {c: string; r: number}> = {
  H: {c: '#F2F2F2', r: 0.55},
  C: {c: '#4A4F5A', r: 0.85},
  N: {c: '#4A6CF0', r: 0.8},
  O: {c: '#EE4B3F', r: 0.8},
  S: {c: '#F2C94C', r: 0.95},
  Cl: {c: '#4FCB7A', r: 0.95},
};

const benzene = (): {atoms: Atom[]; bonds: [number, number][]} => {
  const atoms: Atom[] = [];
  const bonds: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    atoms.push({el: 'C', x: Math.cos(a) * 1.4, y: 0, z: Math.sin(a) * 1.4});
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    atoms.push({el: 'H', x: Math.cos(a) * 2.45, y: 0, z: Math.sin(a) * 2.45});
    bonds.push([i, (i + 1) % 6], [i, 6 + i]);
  }
  return {atoms, bonds};
};
const MOLS: Record<string, {name: string; atoms: Atom[]; bonds: [number, number][]}> = {
  water: {name: 'Water  H2O', atoms: [{el: 'O', x: 0, y: -0.3, z: 0}, {el: 'H', x: -1.5, y: 0.5, z: 0}, {el: 'H', x: 1.5, y: 0.5, z: 0}], bonds: [[0, 1], [0, 2]]},
  methane: {
    name: 'Methane  CH4',
    atoms: [{el: 'C', x: 0, y: 0, z: 0}, {el: 'H', x: 1.3, y: 1.3, z: 1.3}, {el: 'H', x: -1.3, y: -1.3, z: 1.3}, {el: 'H', x: -1.3, y: 1.3, z: -1.3}, {el: 'H', x: 1.3, y: -1.3, z: -1.3}],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
  },
  co2: {name: 'Carbon dioxide  CO2', atoms: [{el: 'C', x: 0, y: 0, z: 0}, {el: 'O', x: -2.3, y: 0, z: 0}, {el: 'O', x: 2.3, y: 0, z: 0}], bonds: [[0, 1], [0, 2]]},
  ammonia: {
    name: 'Ammonia  NH3',
    atoms: [{el: 'N', x: 0, y: -0.5, z: 0}, {el: 'H', x: 1.6, y: 0.7, z: 0}, {el: 'H', x: -0.8, y: 0.7, z: 1.4}, {el: 'H', x: -0.8, y: 0.7, z: -1.4}],
    bonds: [[0, 1], [0, 2], [0, 3]],
  },
  benzene: {name: 'Benzene  C6H6', ...benzene()},
};

type V = [number, number, number];
const rotY = (p: V, a: number): V => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
const rotX = (p: V, a: number): V => [p[0], p[1] * Math.cos(a) - p[2] * Math.sin(a), p[1] * Math.sin(a) + p[2] * Math.cos(a)];
const rotZ = (p: V, a: number): V => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a), p[2]];

const AtomModel: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, cx, cy, portrait} = useStage();
  const {kind, background} = P;
  const base = Math.min(w, h) * (portrait ? 0.5 : 0.6);
  const rot = ((frame / fps) * P.rotation * Math.PI) / 180;
  const sceneIn = prog(frame, 0, 20, ease.out);
  const persp = (p: V, f: number): [number, number, number] => {
    const k = 1 + p[2] * 0.0009 * (1000 / f);
    return [cx + p[0] * k, cy + p[1] * k, k];
  };
  const body: React.ReactNode[] = [];
  let name = '';
  let sub = '';

  if (kind === 'bohr') {
    const el = ELEMENTS[P.element] ?? ELEMENTS.C;
    name = el.name;
    const shells = P.shells && P.shells.length ? P.shells : el.shells;
    sub = `${el.p} protons · ${el.n} neutrons · ${shells.reduce((a, b) => a + b, 0)} electrons`;
    // nucleus: Fibonacci cluster of nucleons
    const nuc = Math.min(el.p + el.n, 22);
    const nr = base * 0.075 * (nuc > 12 ? 0.8 : 1);
    const cluster = Array.from({length: nuc}, (_, i) => {
      const ph = Math.acos(1 - (2 * (i + 0.5)) / nuc);
      const th = Math.PI * (1 + Math.sqrt(5)) * i;
      const rr = nuc <= 1 ? 0 : base * 0.07 * Math.cbrt(nuc) * 0.62;
      const jit = Math.sin(frame * 0.35 + i * 2.1) * 1.6 * u;
      const p: V = [rr * Math.sin(ph) * Math.cos(th) + jit, rr * Math.sin(ph) * Math.sin(th) + jit * 0.6, rr * Math.cos(ph)];
      const q = rotY(rotX(p, 0.4), rot * 1.5);
      return {q, proton: i % 2 === 0 ? el.p >= el.n || i / 2 < el.p : i / 2 < el.n};
    });
    // proton / neutron assignment: alternate
    const nucDraw = [...cluster].sort((a, b) => a.q[2] - b.q[2]);
    const nucleonEl = (n: (typeof cluster)[number], i: number) => {
      const isP = (cluster.indexOf(n) * 7) % 2 === 0;
      const c = isP ? P.protonColor : P.neutronColor;
      const pop = springAt(frame, fps, 6 + (i % 7), 'pop');
      const [x, y] = [cx + n.q[0], cy + n.q[1]];
      const r = nr * (1 + n.q[2] / (base * 2.4)) * pop;
      return (
        <g key={`n${i}`}>
          <circle cx={x} cy={y} r={r} fill={`url(#atom-g-${isP ? 'p' : 'n'})`} />
          <circle cx={x - r * 0.3} cy={y - r * 0.32} r={r * 0.28} fill="#fff" opacity={0.55} />
        </g>
      );
    };
    // electron rings
    const ringsBack: React.ReactNode[] = [];
    const ringsFront: React.ReactNode[] = [];
    const eBack: React.ReactNode[] = [];
    const eFront: React.ReactNode[] = [];
    shells.forEach((count, si) => {
      const R = base * (0.4 + si * 0.24);
      const tilt = ((si % 3) - 1) * (Math.PI / 3) + (si % 3 === 1 ? 0 : 0);
      const orient = (p: V): V => rotY(rotX(rotZ(p, tilt), 1.0 - si * 0.12), rot * (0.7 + si * 0.15));
      const ringIn = prog(frame, 8 + si * 6, 34 + si * 6, ease.out);
      // ring polyline split in front/back
      const seg = 72;
      let dB = '';
      let dF = '';
      let prevFront: boolean | null = null;
      for (let i = 0; i <= seg; i++) {
        if (i / seg > ringIn) break;
        const a = (i / seg) * Math.PI * 2;
        const p = orient([Math.cos(a) * R, Math.sin(a) * R, 0]);
        const [x, y] = persp(p, 1000);
        const front = p[2] >= 0;
        if (front !== prevFront) {
          const cmd = `M${x.toFixed(1)} ${y.toFixed(1)}`;
          if (front) dF += cmd;
          else dB += cmd;
          prevFront = front;
        } else {
          const cmd = `L${x.toFixed(1)} ${y.toFixed(1)}`;
          if (front) dF += cmd;
          else dB += cmd;
        }
        // keep the other path contiguous at the seam
        if (i < seg) {
          const a2 = ((i + 1) / seg) * Math.PI * 2;
          const p2 = orient([Math.cos(a2) * R, Math.sin(a2) * R, 0]);
          const f2 = p2[2] >= 0;
          if (f2 !== front) {
            const [x2, y2] = persp(p2, 1000);
            if (front) dF += `L${x2.toFixed(1)} ${y2.toFixed(1)}`;
            else dB += `L${x2.toFixed(1)} ${y2.toFixed(1)}`;
          }
        }
      }
      ringsBack.push(<path key={`rb${si}`} d={dB} fill="none" stroke={rgbaStr(P.orbitColor, 0.28)} strokeWidth={2 * u} />);
      ringsFront.push(<path key={`rf${si}`} d={dF} fill="none" stroke={rgbaStr(P.orbitColor, 0.7)} strokeWidth={2.6 * u} />);
      // electrons
      const period = P.electronPeriod * (1 + si * 0.45);
      for (let e = 0; e < count; e++) {
        const appear = springAt(frame, fps, 24 + si * 6 + e, 'pop');
        const ang = (frame / period) * Math.PI * 2 + (e / count) * Math.PI * 2 + si;
        // trail
        for (let k = 5; k >= 0; k--) {
          const a = ang - k * 0.11;
          const p = orient([Math.cos(a) * R, Math.sin(a) * R, 0]);
          const [x, y, kk] = persp(p, 1000);
          const rr = base * 0.032 * kk * (1 - k * 0.12) * appear;
          const node = (
            <circle key={`e${si}-${e}-${k}`} cx={x} cy={y} r={Math.max(0, rr)} fill={k === 0 ? '#fff' : P.electronColor} opacity={k === 0 ? 1 : 0.5 - k * 0.07} />
          );
          const halo =
            k === 0 ? <circle key={`eh${si}-${e}`} cx={x} cy={y} r={rr * 3.2} fill={`url(#atom-g-e)`} opacity={0.9 * appear * P.glow} /> : null;
          (p[2] >= 0 ? eFront : eBack).push(halo, node);
        }
      }
    });
    body.push(
      <g key="b" opacity={sceneIn}>
        {ringsBack}
        {eBack}
        <circle cx={cx} cy={cy} r={base * 0.28} fill="url(#atom-g-core)" opacity={0.9 * P.glow} />
        {nucDraw.map(nucleonEl)}
        {ringsFront}
        {eFront}
      </g>,
    );
  } else {
    const preset = MOLS[P.molecule] ?? MOLS.water;
    const atoms = P.atoms && P.atoms.length ? P.atoms : preset.atoms;
    const bonds = P.atoms && P.atoms.length ? P.bonds : preset.bonds;
    name = P.atoms && P.atoms.length ? 'Molecule' : preset.name;
    sub = `${atoms.length} atoms · ${bonds.length} bonds`;
    const span = Math.max(...atoms.map((a) => Math.hypot(a.x, a.y, a.z)), 1);
    const S = (base * 0.9) / span;
    const spin = rot + 0.5;
    const pts = atoms.map((a) => {
      const q = rotX(rotY([a.x * S, a.y * S, a.z * S], spin), 0.38);
      return q;
    });
    const items: {z: number; node: React.ReactNode}[] = [];
    bonds.forEach(([i, j], bi) => {
      const grow = prog(frame, 20 + bi * 4, 40 + bi * 4, ease.out);
      const a = pts[i];
      const b = pts[j];
      const [x1, y1, k1] = persp(a, 1000);
      const [x2, y2] = persp(b, 1000);
      const mx = x1 + (x2 - x1) * grow;
      const my = y1 + (y2 - y1) * grow;
      const thick = base * 0.045 * k1;
      items.push({
        z: (a[2] + b[2]) / 2 - 1,
        node: (
          <g key={`bond${bi}`}>
            <line x1={x1} y1={y1} x2={mx} y2={my} stroke={rgbaStr('#000000', 0.35)} strokeWidth={thick * 1.3} strokeLinecap="round" />
            <line x1={x1} y1={y1} x2={mx} y2={my} stroke="#CFD5E4" strokeWidth={thick} strokeLinecap="round" />
            <line x1={x1} y1={y1 - thick * 0.22} x2={mx} y2={my - thick * 0.22} stroke="#fff" strokeOpacity={0.5} strokeWidth={thick * 0.28} strokeLinecap="round" />
          </g>
        ),
      });
    });
    atoms.forEach((a, i) => {
      const c = CPK[a.el] ?? {c: '#B07CF0', r: 0.9};
      const [x, y, k] = persp(pts[i], 1000);
      const pop = springAt(frame, fps, 4 + i * 4, 'pop');
      const r = base * 0.13 * c.r * k * pop;
      items.push({
        z: pts[i][2],
        node: (
          <g key={`atom${i}`}>
            <ellipse cx={x + r * 0.2} cy={y + r * 1.15} rx={r * 0.9} ry={r * 0.22} fill="#000" opacity={0.22 * pop} />
            <circle cx={x} cy={y} r={r} fill={mix(c.c, '#000000', 0.25)} />
            <circle cx={x - r * 0.12} cy={y - r * 0.14} r={r * 0.9} fill={c.c} />
            <circle cx={x - r * 0.34} cy={y - r * 0.38} r={r * 0.32} fill={lighten(c.c, 0.75)} opacity={0.75} />
          </g>
        ),
      });
    });
    items.sort((a, b) => a.z - b.z);
    body.push(<g key="m" opacity={sceneIn}>{items.map((it) => it.node)}</g>);
  }

  const labelIn = prog(frame, 30, 54, ease.out);
  const titleText = P.title || name;
  const subText = P.caption || sub;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, ${mix(background, '#ffffff', 0.08)} 0%, ${background} 60%, ${mix(background, '#000000', 0.45)} 100%)`}}>
      <Svg>
        <defs>
          <radialGradient id="atom-g-p" cx="35%" cy="32%" r="75%">
            <stop offset="0" stopColor={lighten(P.protonColor, 0.55)} />
            <stop offset="0.5" stopColor={P.protonColor} />
            <stop offset="1" stopColor={mix(P.protonColor, '#000000', 0.5)} />
          </radialGradient>
          <radialGradient id="atom-g-n" cx="35%" cy="32%" r="75%">
            <stop offset="0" stopColor={lighten(P.neutronColor, 0.55)} />
            <stop offset="0.5" stopColor={P.neutronColor} />
            <stop offset="1" stopColor={mix(P.neutronColor, '#000000', 0.5)} />
          </radialGradient>
          <radialGradient id="atom-g-e">
            <stop offset="0" stopColor={P.electronColor} stopOpacity="0.9" />
            <stop offset="1" stopColor={P.electronColor} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="atom-g-core">
            <stop offset="0" stopColor={P.protonColor} stopOpacity="0.55" />
            <stop offset="1" stopColor={P.protonColor} stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform={`translate(0 ${-h * 0.05})`}>{body}</g>
        <g opacity={labelIn} transform={`translate(0 ${(1 - labelIn) * 14 * u})`}>
          <text x={cx} y={h - (portrait ? 0.12 : 0.11) * h} textAnchor="middle" fontSize={(portrait ? 52 : 56) * u} fontFamily={fonts.serif} fontWeight={700} fill="#F2F4FA">
            {titleText}
          </text>
          <text x={cx} y={h - (portrait ? 0.12 : 0.11) * h + 44 * u} textAnchor="middle" fontSize={26 * u} fontFamily={fonts.mono} fill={rgbaStr('#F2F4FA', 0.6)} letterSpacing={2 * u}>
            {subText}
          </text>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const atomModel = defineMotion<Props>({
  id: 'atom-model',
  title: 'Atom / molecule model',
  category: 'shape',
  description:
    'Bohr atom with a jiggling nucleus of shaded protons and neutrons and electron shells on tilted 3D orbit rings (60 / 0 / -60 deg) that pass behind and in front, electrons with glowing trails; or a rotating ball-and-stick molecule (water, methane, CO2, ammonia, benzene) with CPK colours.',
  source: ['prompt-corpus research: atom-model (21 cases, ideas only; original implementation)'],
  useFor: 'Chemistry / physics explainers, end stage of a scale-dive, science and materials brands.',
  durationInFrames: 180,
  defaultProps: {
    kind: 'bohr',
    element: 'C',
    shells: [],
    molecule: 'water',
    atoms: [],
    bonds: [],
    title: '',
    caption: '',
    rotation: 22,
    electronPeriod: 48,
    protonColor: '#F0506E',
    neutronColor: '#5B8CFF',
    electronColor: '#5CE1E6',
    orbitColor: '#9FB4E8',
    background: '#0B1226',
    glow: 1,
  },
  propDocs: {
    kind: "'bohr' (nucleus + orbits) | 'molecule' (ball and stick)",
    element: 'bohr: H He Li C N O Ne Na Si Cl Fe (sets nucleus + shells)',
    shells: 'bohr: electrons per shell, overrides the element, e.g. [2,8,1]',
    molecule: 'molecule preset: water | methane | co2 | ammonia | benzene',
    atoms: 'custom molecule atoms [{el,x,y,z}] (units ~ bond lengths)',
    bonds: 'custom molecule bonds [[i,j],...]',
    title: 'caption title (default: element / molecule name)',
    caption: 'caption line (default: particle counts)',
    rotation: 'scene rotation in deg / s',
    electronPeriod: 'frames per orbit of the innermost shell (30-60)',
    protonColor: 'proton colour (also the nucleus glow)',
    neutronColor: 'neutron colour',
    electronColor: 'electron + trail colour',
    orbitColor: 'orbit ring colour',
    background: 'background colour',
    glow: 'electron / nucleus glow strength 0-1.5',
  },
  component: AtomModel,
  tags: ['atom', 'bohr', 'electron', 'nucleus', 'proton', 'neutron', 'orbit', 'molecule', 'chemistry', 'physics', 'science', 'ball and stick', 'water', 'methane', 'education', 'explainer', 'quantum'],
});
