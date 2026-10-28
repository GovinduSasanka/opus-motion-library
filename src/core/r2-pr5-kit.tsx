/**
 * r2-pr5-kit — shared helpers for the PR-5 batch (prompt-corpus techniques): neural-net-layers, node-network,
 * stickman-rig, talking-head-pip, carousel-3d, rocket-launch, marquee-ticker, ocean-surface-3d.
 * Everything is a pure function of the frame / seeds (no timers, no Math.random, no requestAnimationFrame).
 *
 *  - colour helpers (hex mix / rgba / ramp)
 *  - seeded force-directed layout + preferential-attachment graph + BFS shortest path   (node-network)
 *  - forward pass with seeded weights + activation colour ramp                            (neural-net-layers)
 *  - stickman skeleton: pose library (joint angles) + 2-bone IK for the legs + pose blending (stickman-rig)
 *  - caption safe-zone helper keeping captions clear of a PiP window                      (talking-head-pip)
 */
import {clamp} from './ease';
import {rng} from './random';

// =================================================================================================================
// colour
// =================================================================================================================
export const hex3 = (hex: string): [number, number, number] => {
  let h = (hex || '#808080').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [128, 128, 128];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mixHex5 = (a: string, b: string, t: number) => {
  const A = hex3(a);
  const B = hex3(b);
  const k = clamp(t);
  const c = (i: number) => Math.round(A[i] + (B[i] - A[i]) * k);
  return `rgb(${c(0)},${c(1)},${c(2)})`;
};
export const rgba5 = (hex: string, alpha: number) => {
  const [r, g, b] = hex3(hex);
  return `rgba(${r},${g},${b},${clamp(alpha)})`;
};
/** multi-stop colour ramp, t in 0..1 */
export const ramp = (stops: string[], t: number) => {
  if (stops.length === 1) return stops[0];
  const s = clamp(t) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(s));
  return mixHex5(stops[i], stops[i + 1], s - i);
};

// =================================================================================================================
// graph layout (node-network)
// =================================================================================================================
export type GNode = {x: number; y: number; cluster: number; deg: number};
export type GLink = [number, number];

/**
 * Deterministic graph: `count` nodes in `clusters` communities, preferential attachment (rich-get-richer), a few
 * cross-community bridges. Returns nodes in arrival order (node i only links to earlier nodes), so revealing nodes by
 * index reads as organic growth.
 */
export const buildGraph = (count: number, clusters: number, seed: number | string, aspect: number, iterations = 260) => {
  const r = rng(`${seed}:graph`);
  const n = Math.max(2, Math.round(count));
  const k = Math.max(1, Math.round(clusters));
  const nodes: GNode[] = [];
  const links: GLink[] = [];
  const deg = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const cluster = i < k ? i : Math.floor(r() * k);
    nodes.push({x: 0, y: 0, cluster, deg: 0});
    if (i === 0) continue;
    // pick 1..2 earlier targets weighted by degree (+1) and by sharing the cluster
    const m = i < 3 ? 1 : r() < 0.38 ? 2 : 1;
    const chosen = new Set<number>();
    for (let tries = 0; chosen.size < m && tries < 12; tries++) {
      let total = 0;
      const w: number[] = [];
      for (let j = 0; j < i; j++) {
        const wt = (deg[j] + 1) * (nodes[j].cluster === cluster ? 3.2 : 0.35);
        w.push(wt);
        total += wt;
      }
      let x = r() * total;
      let pick = 0;
      for (let j = 0; j < i; j++) {
        x -= w[j];
        if (x <= 0) {
          pick = j;
          break;
        }
      }
      chosen.add(pick);
    }
    chosen.forEach((j) => {
      links.push([i, j]);
      deg[i]++;
      deg[j]++;
    });
  }
  nodes.forEach((nd, i) => (nd.deg = deg[i]));

  // initial positions: cluster centres on a ring, jittered
  const ccx = (c: number) => Math.cos((c / k) * Math.PI * 2 + 0.5) * 0.55 * Math.min(1, aspect);
  const ccy = (c: number) => Math.sin((c / k) * Math.PI * 2 + 0.5) * 0.55 * Math.min(1, 1 / aspect);
  nodes.forEach((nd) => {
    nd.x = ccx(nd.cluster) * (k === 1 ? 0 : 1) + (r() - 0.5) * 0.5;
    nd.y = ccy(nd.cluster) * (k === 1 ? 0 : 1) + (r() - 0.5) * 0.5;
  });
  // relaxation (Fruchterman–Reingold-ish): repulsion everywhere, springs on links, gravity to cluster centre
  const rest = 0.9 / Math.sqrt(n);
  for (let it = 0; it < iterations; it++) {
    const cool = 1 - it / iterations;
    const fx = new Array(n).fill(0);
    const fy = new Array(n).fill(0);
    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) {
        let dx = nodes[a].x - nodes[b].x;
        let dy = nodes[a].y - nodes[b].y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1e-6) {
          dx = (r() - 0.5) * 0.01;
          dy = (r() - 0.5) * 0.01;
          d2 = dx * dx + dy * dy + 1e-6;
        }
        const d = Math.sqrt(d2);
        const f = (rest * rest * 0.9) / d2;
        fx[a] += (dx / d) * f;
        fy[a] += (dy / d) * f;
        fx[b] -= (dx / d) * f;
        fy[b] -= (dy / d) * f;
      }
    }
    for (const [a, b] of links) {
      const dx = nodes[b].x - nodes[a].x;
      const dy = nodes[b].y - nodes[a].y;
      const d = Math.sqrt(dx * dx + dy * dy) + 1e-6;
      const f = ((d - rest * 0.8) * 0.9) / d;
      fx[a] += dx * f * 0.5;
      fy[a] += dy * f * 0.5;
      fx[b] -= dx * f * 0.5;
      fy[b] -= dy * f * 0.5;
    }
    nodes.forEach((nd, i) => {
      fx[i] += (ccx(nd.cluster) * (k === 1 ? 0 : 1) - nd.x) * 0.16;
      fy[i] += (ccy(nd.cluster) * (k === 1 ? 0 : 1) - nd.y) * 0.16;
      const mag = Math.sqrt(fx[i] * fx[i] + fy[i] * fy[i]) + 1e-9;
      const step = Math.min(mag, 0.07 * cool + 0.004);
      nd.x += (fx[i] / mag) * step;
      nd.y += (fy[i] / mag) * step;
    });
  }
  // fit into [-1,1] (separately per axis, so the graph fills the frame's aspect)
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  nodes.forEach((nd) => {
    x0 = Math.min(x0, nd.x);
    x1 = Math.max(x1, nd.x);
    y0 = Math.min(y0, nd.y);
    y1 = Math.max(y1, nd.y);
  });
  const sx = 2 / Math.max(1e-6, x1 - x0);
  const sy = 2 / Math.max(1e-6, y1 - y0);
  nodes.forEach((nd) => {
    nd.x = (nd.x - (x0 + x1) / 2) * sx;
    nd.y = (nd.y - (y0 + y1) / 2) * sy;
  });
  return {nodes, links};
};

export const shortestPath = (n: number, links: GLink[], from: number, to: number): number[] => {
  const adj: number[][] = Array.from({length: n}, () => []);
  links.forEach(([a, b]) => {
    adj[a].push(b);
    adj[b].push(a);
  });
  const prev = new Array(n).fill(-2);
  prev[from] = -1;
  const q = [from];
  for (let qi = 0; qi < q.length; qi++) {
    const v = q[qi];
    if (v === to) break;
    for (const w of adj[v]) {
      if (prev[w] === -2) {
        prev[w] = v;
        q.push(w);
      }
    }
  }
  if (prev[to] === -2) return [from];
  const path: number[] = [];
  for (let v = to; v !== -1; v = prev[v]) path.push(v);
  return path.reverse();
};

// =================================================================================================================
// neural net (neural-net-layers)
// =================================================================================================================
export type NetPass = {acts: number[][]; probs: number[]};
export const makeWeights = (sizes: number[], seed: number | string) => {
  const r = rng(`${seed}:w`);
  return sizes.slice(1).map((n, l) => Array.from({length: sizes[l]}, () => Array.from({length: n}, () => (r() * 2 - 1) * (0.55 + r() * 0.45))));
};
/** real forward pass (tanh-ish hidden layers, softmax output) normalised to 0..1 per layer so every layer glows */
export const forward = (sizes: number[], w: number[][][], input: number[]): NetPass => {
  const acts: number[][] = [input.slice(0, sizes[0])];
  while (acts[0].length < sizes[0]) acts[0].push(0.2);
  for (let l = 1; l < sizes.length; l++) {
    const prev = acts[l - 1];
    const z = Array.from({length: sizes[l]}, (_, j) => prev.reduce((s, a, i) => s + (a - 0.45) * w[l - 1][i][j], 0));
    if (l === sizes.length - 1) {
      const mx = Math.max(...z);
      const e = z.map((v) => Math.exp((v - mx) * 3.2));
      const sum = e.reduce((s, v) => s + v, 0);
      acts.push(e.map((v) => v / sum));
    } else {
      acts.push(z.map((v) => 0.5 + 0.5 * Math.tanh(v * 1.6)));
    }
  }
  return {acts, probs: acts[acts.length - 1]};
};

// =================================================================================================================
// stickman (stickman-rig)
// =================================================================================================================
export type PoseName = 'idle' | 'walk' | 'run' | 'punch' | 'kick' | 'fall' | 'cheer' | 'moonwalk' | 'wave' | 'dance' | 'think' | 'getup';
export const POSE_NAMES: PoseName[] = ['idle', 'walk', 'run', 'punch', 'kick', 'fall', 'cheer', 'moonwalk', 'wave', 'dance', 'think', 'getup'];

/** figure-local pose, facing +x, y up, units = figure heights. Limb angles are measured from straight down, + = forward. */
export type StickPose = {
  hipX: number; // relative to the actor x
  hipY: number; // hip height above ground
  lean: number; // torso lean from vertical (rad, + = forward)
  head: number; // head tilt relative to the torso (rad)
  armF: [number, number]; // front arm: [shoulder angle, elbow bend]
  armB: [number, number]; // back arm
  footF: [number, number]; // foot target [x rel hip, y above ground]
  footB: [number, number];
  rot: number; // whole-body rotation around the ground contact (rad, for falls)
};
const lerpPose = (a: StickPose, b: StickPose, t: number): StickPose => {
  const L = (x: number, y: number) => x + (y - x) * t;
  const L2 = (x: [number, number], y: [number, number]): [number, number] => [L(x[0], y[0]), L(x[1], y[1])];
  return {hipX: L(a.hipX, b.hipX), hipY: L(a.hipY, b.hipY), lean: L(a.lean, b.lean), head: L(a.head, b.head), armF: L2(a.armF, b.armF), armB: L2(a.armB, b.armB), footF: L2(a.footF, b.footF), footB: L2(a.footB, b.footB), rot: L(a.rot, b.rot)};
};
export const blendPose = lerpPose;

export const LIM = {head: 0.095, neck: 0.04, torso: 0.3, upperArm: 0.17, foreArm: 0.16, thigh: 0.205, shin: 0.205};
export const STAND_HIP = LIM.thigh + LIM.shin - 0.012;

const S = Math.sin;
const TAU = Math.PI * 2;
const sm = (t: number) => t * t * (3 - 2 * t);
const kf = (t: number, keys: [number, number][]) => {
  // piecewise smooth interpolation through [time, value] keys
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      return v0 + (v1 - v0) * sm((t - t0) / Math.max(1e-6, t1 - t0));
    }
  }
  return keys[keys.length - 1][1];
};

const base = (): StickPose => ({hipX: 0, hipY: STAND_HIP, lean: 0, head: 0, armF: [0.08, 0.15], armB: [-0.08, 0.15], footF: [0.05, 0], footB: [-0.05, 0], rot: 0});

/** pose at local frame `f` (frames since the pose started), `speed` scales cycle rate. Cycle lengths follow the brief (walk ~20f, run ~14f). */
export const poseAt = (name: PoseName, f: number, speed = 1): StickPose => {
  const p = base();
  const ff = f * speed;
  switch (name) {
    case 'idle': {
      const b = S((ff / 54) * TAU);
      p.hipY += b * 0.006;
      p.armF = [0.06 + b * 0.03, 0.2];
      p.armB = [-0.06 - b * 0.03, 0.2];
      p.head = b * 0.02;
      return p;
    }
    case 'walk':
    case 'run':
    case 'moonwalk': {
      const run = name === 'run';
      const moon = name === 'moonwalk';
      const period = run ? 14 : moon ? 26 : 20;
      const ph = (ff / period) % 1;
      const stride = run ? 0.28 : moon ? 0.17 : 0.17;
      const lift = run ? 0.17 : moon ? 0.05 : 0.07;
      const dir = moon ? -1 : 1;
      const leg = (q: number): [number, number] => {
        const k = ((q % 1) + 1) % 1;
        if (k < 0.5) {
          // stance: foot slides back under the body
          return [stride * (1 - (k / 0.5) * 2) * dir, moon ? 0.012 : 0];
        }
        const s = (k - 0.5) / 0.5; // swing
        return [stride * (-1 + 2 * sm(s)) * dir, S(s * Math.PI) * lift + (moon ? 0.01 : 0)];
      };
      p.footF = leg(ph);
      p.footB = leg(ph + 0.5);
      const bob = Math.abs(S(ph * Math.PI * 2)) * (run ? 0.03 : moon ? 0.004 : 0.018);
      p.hipY = STAND_HIP - (run ? 0.045 : moon ? 0.012 : 0.01) + bob;
      p.lean = run ? 0.22 : moon ? -0.05 : 0.05;
      const sw = S(ph * TAU);
      if (run) {
        p.armF = [-0.7 * sw + 0.2, 1.5];
        p.armB = [0.7 * sw + 0.2, 1.5];
      } else if (moon) {
        p.armF = [0.4 + 0.15 * sw, 0.9];
        p.armB = [-0.3 - 0.15 * sw, 0.5];
        p.head = -0.05;
      } else {
        p.armF = [-0.5 * sw, 0.28];
        p.armB = [0.5 * sw, 0.28];
      }
      return p;
    }
    case 'punch': {
      // 20-frame one-shot: wind-up 0-6, strike 6-9 (hit at 8), hold, recover
      const t = ff;
      const ext = kf(t, [[0, 0], [6, -0.25], [9, 1], [13, 1], [20, 0]]);
      p.lean = kf(t, [[0, 0], [6, -0.12], [9, 0.3], [14, 0.25], [20, 0]]);
      p.armF = [kf(t, [[0, 0.1], [6, -0.7], [9, 1.55], [13, 1.5], [20, 0.1]]), kf(t, [[0, 0.2], [6, 2.0], [9, 0.0], [13, 0.0], [20, 0.2]])];
      p.armB = [kf(t, [[0, -0.08], [6, 0.9], [20, 0.1]]), 1.6];
      p.footF = [0.2 + ext * 0.1, 0];
      p.footB = [-0.2 - ext * 0.05, 0];
      p.hipY = STAND_HIP - 0.035;
      p.hipX = ext * 0.05;
      return p;
    }
    case 'kick': {
      const t = ff;
      const raise = kf(t, [[0, 0], [7, 0.35], [10, 1], [15, 1], [22, 0]]);
      p.lean = kf(t, [[0, 0], [7, -0.2], [10, -0.28], [15, -0.25], [22, 0]]);
      p.footF = [0.1 + raise * 0.42, raise * 0.45];
      p.footB = [-0.08, 0];
      p.armF = [0.5 + raise * 0.4, 1.0];
      p.armB = [-0.9 * raise - 0.1, 0.5];
      p.hipY = STAND_HIP - 0.01 - raise * 0.01;
      return p;
    }
    case 'fall': {
      // 30-frame one-shot: stagger back, topple, lie flat (rot to ~ -pi/2) with a small bounce
      const t = ff;
      const rot = kf(t, [[0, 0], [8, -0.25], [20, -1.45], [23, -1.62], [27, -1.5], [32, -1.57]]);
      p.rot = rot;
      p.hipY = kf(t, [[0, STAND_HIP], [8, STAND_HIP - 0.01], [20, 0.04], [32, 0.03]]);
      p.armF = [kf(t, [[0, 0.1], [10, 1.6], [24, 2.3]]), 0.2];
      p.armB = [kf(t, [[0, -0.1], [10, 1.2], [24, 2.0]]), 0.3];
      p.footF = [kf(t, [[0, 0.05], [10, 0.25]]), kf(t, [[0, 0], [10, 0.1], [24, 0.02]])];
      p.footB = [kf(t, [[0, -0.05], [10, -0.12]]), 0];
      p.head = kf(t, [[0, 0], [20, 0.35]]);
      return p;
    }
    case 'getup': {
      const t = ff;
      const k = kf(t, [[0, 1], [16, 0.35], [26, 0]]);
      p.rot = -1.57 * k;
      p.hipY = STAND_HIP * (1 - k) + 0.03 * k;
      p.armF = [1.8 * k + 0.08, 0.3];
      p.armB = [1.6 * k - 0.08, 0.3];
      return p;
    }
    case 'cheer': {
      const hop = Math.abs(S((ff / 26) * Math.PI));
      p.hipY = STAND_HIP + hop * 0.07;
      p.armF = [2.7 + S((ff / 13) * Math.PI) * 0.25, 0.25];
      p.armB = [-2.5 - S((ff / 13) * Math.PI) * 0.25, 0.25];
      p.footF = [0.1, hop * 0.07 + 0.0];
      p.footB = [-0.1, hop * 0.07];
      p.head = -0.12;
      return p;
    }
    case 'wave': {
      p.armF = [2.55 + S((ff / 7) * Math.PI) * 0.12, 0.8 + S((ff / 7) * Math.PI) * 0.7];
      p.armB = [-0.07, 0.2];
      p.hipY += S((ff / 54) * TAU) * 0.004;
      p.head = 0.05;
      return p;
    }
    case 'dance': {
      const ph = (ff / 24) % 1;
      const a = S(ph * TAU);
      const b = S(ph * TAU * 2);
      p.hipX = a * 0.05;
      p.hipY = STAND_HIP - 0.02 + Math.abs(b) * 0.03;
      p.lean = a * 0.12;
      p.armF = [1.5 + a * 1.1, 0.6 + b * 0.4];
      p.armB = [-1.5 + a * 1.1, 0.6 - b * 0.4];
      p.footF = [0.14 + a * 0.1, Math.max(0, S(ph * TAU + 1)) * 0.07];
      p.footB = [-0.14 + a * 0.1, Math.max(0, S(ph * TAU + 4)) * 0.07];
      p.head = a * 0.15;
      return p;
    }
    case 'think': {
      p.armF = [1.2, 2.2];
      p.armB = [-0.05, 0.3];
      p.head = 0.12 + S((ff / 40) * TAU) * 0.03;
      p.lean = 0.04;
      p.hipY += S((ff / 54) * TAU) * 0.004;
      return p;
    }
  }
};

export type Joint = [number, number];
export type StickJoints = {hip: Joint; neck: Joint; headC: Joint; shF: Joint; elF: Joint; haF: Joint; shB: Joint; elB: Joint; haB: Joint; kneeF: Joint; footF: Joint; kneeB: Joint; footB: Joint};

/** 2-bone IK: hip -> knee -> foot. Knee bends toward +bend (forward). Returns the knee. */
export const ik2 = (a: Joint, target: Joint, l1: number, l2: number, bend: 1 | -1 = 1): {mid: Joint; end: Joint} => {
  let dx = target[0] - a[0];
  let dy = target[1] - a[1];
  let d = Math.sqrt(dx * dx + dy * dy);
  const reach = l1 + l2 - 1e-4;
  if (d > reach) {
    dx *= reach / d;
    dy *= reach / d;
    d = reach;
  }
  if (d < 1e-4) d = 1e-4;
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  const ux = dx / d;
  const uy = dy / d;
  // counter-clockwise perpendicular: for a leg pointing down it points forward (+x), which is where knees bend
  const sgn = bend;
  const mid: Joint = [a[0] + ux * along - uy * h * sgn, a[1] + uy * along + ux * h * sgn];
  const pickMid = mid;
  return {mid: pickMid, end: [a[0] + dx, a[1] + dy]};
};

/** solve the skeleton in figure-local space (y up, units = figure heights, ground y=0, rot about the origin ground point) */
export const solveStick = (pose: StickPose): StickJoints => {
  const hip: Joint = [pose.hipX, pose.hipY];
  const lx = Math.sin(pose.lean);
  const ly = Math.cos(pose.lean);
  const neck: Joint = [hip[0] + lx * LIM.torso, hip[1] + ly * LIM.torso];
  const ha = pose.lean + pose.head;
  const headC: Joint = [neck[0] + Math.sin(ha) * (LIM.neck + LIM.head), neck[1] + Math.cos(ha) * (LIM.neck + LIM.head)];
  const shoulder: Joint = [neck[0] - lx * 0.02, neck[1] - ly * 0.02];
  const arm = (sh: Joint, [a, b]: [number, number]) => {
    const el: Joint = [sh[0] + Math.sin(a) * LIM.upperArm, sh[1] - Math.cos(a) * LIM.upperArm];
    const hand: Joint = [el[0] + Math.sin(a + b) * LIM.foreArm, el[1] - Math.cos(a + b) * LIM.foreArm];
    return {el, hand};
  };
  const aF = arm(shoulder, pose.armF);
  const aB = arm(shoulder, pose.armB);
  const lf = ik2(hip, [hip[0] + pose.footF[0], pose.footF[1]], LIM.thigh, LIM.shin, 1);
  const lb = ik2(hip, [hip[0] + pose.footB[0], pose.footB[1]], LIM.thigh, LIM.shin, 1);
  const rot = (j: Joint): Joint => {
    if (!pose.rot) return j;
    const c = Math.cos(pose.rot);
    const s = Math.sin(pose.rot);
    // rotate around the ground point under the original feet (origin x = 0)
    return [j[0] * c - j[1] * s, j[0] * s + j[1] * c];
  };
  return {
    hip: rot(hip),
    neck: rot(neck),
    headC: rot(headC),
    shF: rot(shoulder),
    elF: rot(aF.el),
    haF: rot(aF.hand),
    shB: rot(shoulder),
    elB: rot(aB.el),
    haB: rot(aB.hand),
    kneeF: rot(lf.mid),
    footF: rot(lf.end),
    kneeB: rot(lb.mid),
    footB: rot(lb.end),
  };
};

// =================================================================================================================
// captions vs. picture-in-picture (talking-head-pip)
// =================================================================================================================
export type PipCorner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
/** where the PiP sits (px) and a caption rectangle that never overlaps it */
export const pipLayout = (w: number, h: number, u: number, corner: PipCorner, diameter: number, margin: number) => {
  const d = diameter * Math.min(w, h);
  const m = margin * Math.min(w, h);
  const right = corner.endsWith('right');
  const bottom = corner.startsWith('bottom');
  const x = right ? w - m - d : m;
  const y = bottom ? h - m - d : m;
  const portrait = h > w;
  const capW = portrait ? w - 2 * m : w - 2 * m - (d + m);
  let capX = m;
  let capBottom: number;
  if (portrait) {
    capBottom = bottom ? y - 28 * u : h - m - 90 * u;
  } else {
    capX = right ? m : m + d + m;
    capBottom = h - m - 20 * u;
  }
  return {x, y, d, capX, capW: Math.max(200 * u, capW), capBottom};
};
