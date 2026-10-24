// Adapted from lemo-opuscar/styles/art-deco/demo/film.js (splitOpen, revolve) and
// lemo-opuscar/styles/paper-lantern/demo/src/shots/s17_sushi.js (cloudCurtain) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {
  AbsoluteFill,
  at,
  axisFor,
  bandPoly,
  BlurFilter,
  C,
  E,
  hash01,
  Hidden,
  lerp,
  Masked,
  mix,
  Overlay,
  Plain,
  ptsStr,
  region,
  seg,
  straight,
  useFrameSize,
  useUid,
} from './kit';

// ---------------------------------------------------------------------------------------------
// door — art-deco splitOpen: the outgoing frame splits on the centre seam into two leaves hinged at
// the outer edges that swing open toward the camera (true perspective), darkening as they turn,
// with gold glowing free edges and a warm seam flash; the new scene is in the opening between them.

/** screen x of a leaf's free edge (hinge at x = 0, eye at the frame centre) */
const swingX = (half: number, th: number, d: number) => half + (half * Math.cos(th) - half) * (d / (d - half * Math.sin(th)));

const DoorSplit: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const gid = useUid('dsg');
  const fid = useUid('dsf');
  const e = E.inOutCubic(seg(p, 0.12, 1));
  const th = e * (Math.PI / 2);
  const d = w * 1.6;
  const half = w / 2;
  const X = Math.max(0, swingX(half, th, d));
  if (presentationDirection === 'exiting') {
    if (p >= 1) return <Hidden>{children}</Hidden>;
    const leaf = (side: -1 | 1) => (
      <AbsoluteFill
        style={{
          clipPath: side < 0 ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)',
          transformOrigin: side < 0 ? '0px 50%' : `${w}px 50%`,
          transform: `rotateY(${side < 0 ? -th : th}rad)`,
        }}
      >
        {children}
        <AbsoluteFill
          style={{
            background:
              side < 0
                ? `linear-gradient(90deg, rgba(0,0,0,${0.08 * e}) 0%, rgba(0,0,0,${0.55 * e}) 50%, transparent 50%)`
                : `linear-gradient(270deg, rgba(0,0,0,${0.08 * e}) 0%, rgba(0,0,0,${0.55 * e}) 50%, transparent 50%)`,
          }}
        />
      </AbsoluteFill>
    );
    return (
      <AbsoluteFill style={{perspective: d, perspectiveOrigin: '50% 50%'}}>
        {leaf(-1)}
        {leaf(1)}
      </AbsoluteFill>
    );
  }
  if (p >= 1) return <Plain>{children}</Plain>;
  const seamGlow = 1 - seg(p, 0, 0.35);
  const Z = half * Math.sin(th);
  const mag = d / (d - Z);
  const y0 = h / 2 - (h / 2) * mag;
  const y1 = h / 2 + (h / 2) * mag;
  const edgeOp = 1 - seg(p, 0.85, 1);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: `inset(0px ${X}px 0px ${X}px)`}}>
        <AbsoluteFill style={{transform: `scale(${1.06 - 0.06 * e})`}}>{children}</AbsoluteFill>
        <AbsoluteFill style={{boxShadow: `inset 0 0 ${140 * u}px rgba(0,0,0,${0.55 * (1 - e)})`}} />
      </AbsoluteFill>
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={fid} sd={7 * u} w={w} h={h} />
          <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={w / 2} cy={h / 2} r={700 * u}>
            <stop offset="0" stopColor="#ffd8a0" stopOpacity={0.45 * seamGlow} />
            <stop offset="0.45" stopColor="#ffb860" stopOpacity={0.16 * seamGlow} />
            <stop offset="1" stopColor="#ffb860" stopOpacity={0} />
          </radialGradient>
        </defs>
        {seamGlow > 0 && <rect x={0} y={0} width={w} height={h} fill={`url(#${gid})`} style={{mixBlendMode: 'screen'}} />}
        {X > 1 &&
          [X, w - X].map((x, i) => (
            <g key={i} opacity={edgeOp}>
              <line x1={x} y1={y0} x2={x} y2={y1} stroke={pp.color} strokeWidth={10 * u} opacity={0.8} filter={`url(#${fid})`} />
              <line x1={x} y1={y0} x2={x} y2={y1} stroke={pp.color} strokeWidth={3 * u} />
              <line x1={x} y1={y0} x2={x} y2={y1} stroke="#fff6dc" strokeWidth={1 * u} opacity={0.8} />
            </g>
          ))}
        {seamGlow > 0 && X >= half - 2 && (
          <g opacity={seamGlow}>
            <line x1={w / 2} y1={0} x2={w / 2} y2={h} stroke={pp.color} strokeWidth={12 * u} filter={`url(#${fid})`} />
            <line x1={w / 2} y1={0} x2={w / 2} y2={h} stroke="#fff6dc" strokeWidth={3 * u} />
          </g>
        )}
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// door 'revolve' — art-deco revolve(): a translucent glass wing with gold mullions sweeps across
// (default right -> left), revealing the new scene behind its leading edge; a fainter wing follows.

const Revolve: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('rev');
  const gid = useUid('revg');
  const fid = useUid('revf');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const ax = axisFor(pp.angle, w, h);
  const pw = 0.115 * ax.L;
  const edge = straight(ax, 40);
  const pos = (k: number) => lerp(ax.smin - pw * 0.6, ax.smax + pw * 0.6, k);
  const S1 = pos(E.inOutCubic(seg(p, 0, 0.82)));
  const k2 = seg(p, 0.3, 1);
  const S2 = pos(E.inOutCubic(k2));
  const [gx1, gy1] = at(ax, -pw / 2, 0);
  const [gx2, gy2] = at(ax, pw / 2, 0);
  const panel = (S: number, a: number, key: string) => {
    if (a <= 0) return null;
    const mull = [0.333, 0.352, 0.648, 0.667].map((f) => ax.tmin + f * ax.M);
    return (
      <g key={key} opacity={a}>
        <g transform={`translate(${at(ax, S, 0).join(' ')})`}>
          <polygon points={bandPoly(ax, -pw / 2, edge, pw / 2, edge)} fill={`url(#${gid})`} />
        </g>
        <polygon points={bandPoly(ax, S + pw * 0.08, edge, S + pw * 0.16, edge)} fill="#fff" opacity={0.2} />
        <polyline points={ptsStr(edge.map(([t]) => at(ax, S + pw / 2, t)))} stroke={pp.color} strokeWidth={10 * u} opacity={0.55} filter={`url(#${fid})`} fill="none" />
        <polyline points={ptsStr(edge.map(([t]) => at(ax, S + pw / 2, t)))} stroke={pp.color} strokeWidth={4 * u} fill="none" />
        <polyline points={ptsStr(edge.map(([t]) => at(ax, S - pw / 2, t)))} stroke={pp.color} strokeWidth={2.5 * u} fill="none" />
        {mull.map((t, i) => (
          <polyline key={i} points={ptsStr([at(ax, S - pw / 2, t), at(ax, S + pw / 2, t)])} stroke={pp.color} strokeWidth={1.6 * u} fill="none" />
        ))}
      </g>
    );
  };
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} mask={<polygon points={region(ax, S1 + pw / 2, edge)} fill="white" />}>
        {children}
      </Masked>
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={fid} sd={5 * u} w={w} h={h} />
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={gx1} y1={gy1} x2={gx2} y2={gy2}>
            <stop offset="0" stopColor="#ffdca0" stopOpacity={0.1} />
            <stop offset="0.35" stopColor="#fff2d8" stopOpacity={0.42} />
            <stop offset="0.5" stopColor="#ffecc8" stopOpacity={0.22} />
            <stop offset="1" stopColor="#ffdca0" stopOpacity={0.08} />
          </linearGradient>
        </defs>
        {panel(S1, 1, 'a')}
        {k2 > 0 && k2 < 1 && panel(S2, 0.7, 'b')}
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// door 'saloon' — x4 swing-doors-reveal: a pair of Z-braced plank doors swings shut over the old
// scene, then bursts open toward the camera (overshoot + damped rocking) on the new one.

const Saloon: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const fid = useUid('sal');
  if (presentationDirection === 'exiting') return <Plain>{children}</Plain>;
  if (p >= 1) return <Plain>{children}</Plain>;
  const SW = 0.46;
  const half = w / 2;
  const d = w * 1.5;
  let th: number;
  if (p < 0.4) {
    // shut: from edge-on to closed with a small bounce
    const q = seg(p, 0, 0.4);
    const c1 = 1.9;
    const back = 1 + (c1 + 1) * Math.pow(q - 1, 3) + c1 * Math.pow(q - 1, 2);
    th = (Math.PI / 2) * (1 - back);
  } else if (p < SW) th = 0;
  else {
    const t = seg(p, SW, 1);
    th = (Math.PI / 2) * (1 - Math.exp(-3 * t) * Math.cos(8 * t));
  }
  th = Math.max(-0.12, Math.min(Math.PI / 2, th));
  const proj = (side: -1 | 1, uu: number, v: number): [number, number] => {
    const X3 = side < 0 ? uu * Math.cos(th) : w - uu * Math.cos(th);
    const Z = uu * Math.sin(th);
    const k = d / (d - Z);
    return [w / 2 + (X3 - w / 2) * k, h / 2 + (v - h / 2) * k];
  };
  const quad = (side: -1 | 1, u0: number, u1: number, v0: number, v1: number) => ptsStr([proj(side, u0, v0), proj(side, u1, v0), proj(side, u1, v1), proj(side, u0, v1)]);
  const wood = pp.color;
  const shade = 1 - 0.45 * Math.abs(Math.sin(th));
  const planks = 6;
  const leaf = (side: -1 | 1) => {
    const out: React.ReactNode[] = [<polygon key="back" points={quad(side, 0, half, -4, h + 4)} fill={mix('#000000', wood, 0.35 * shade)} />];
    const pwid = half / planks;
    for (let i = 0; i < planks; i++) {
      const u0 = i * pwid + 1.5 * u;
      const u1 = (i + 1) * pwid - 1.5 * u;
      const tint = 0.82 + 0.3 * hash01(i * 3.1 + (side > 0 ? 9 : 0));
      out.push(<polygon key={`p${i}`} points={quad(side, u0, u1, -4, h + 4)} fill={mix('#000000', wood, tint * shade)} />);
      for (let g = 0; g < 3; g++) {
        const ug = u0 + (u1 - u0) * (0.22 + 0.28 * g + 0.08 * hash01(i * 7 + g));
        out.push(<polyline key={`g${i}-${g}`} points={ptsStr(Array.from({length: 7}, (_, k) => proj(side, ug + Math.sin(k * 1.3 + i + g) * 2 * u, (k / 6) * h)))} fill="none" stroke="#000" strokeOpacity={0.16} strokeWidth={1.4 * u} />);
      }
    }
    // Z brace: two rails and a diagonal
    const railH = 0.07 * h;
    const railC = mix('#000000', wood, 1.12 * shade);
    out.push(<polygon key="r1" points={quad(side, 4 * u, half - 4 * u, 0.16 * h, 0.16 * h + railH)} fill={railC} stroke="#000" strokeOpacity={0.35} strokeWidth={1.5 * u} />);
    out.push(<polygon key="r2" points={quad(side, 4 * u, half - 4 * u, 0.77 * h, 0.77 * h + railH)} fill={railC} stroke="#000" strokeOpacity={0.35} strokeWidth={1.5 * u} />);
    const dg = ptsStr([proj(side, half - 30 * u, 0.16 * h + railH), proj(side, half - 4 * u, 0.16 * h + railH), proj(side, 30 * u, 0.77 * h), proj(side, 4 * u, 0.77 * h)]);
    out.push(<polygon key="dg" points={dg} fill={railC} stroke="#000" strokeOpacity={0.35} strokeWidth={1.5 * u} />);
    // iron hinges + bolts
    for (const hv of [0.16 * h + railH / 2, 0.77 * h + railH / 2]) {
      out.push(<polygon key={`h${hv}`} points={quad(side, 0, 0.22 * half, hv - 0.018 * h, hv + 0.018 * h)} fill="#2a2522" />);
      for (let b = 0; b < 3; b++) {
        const [bx, by] = proj(side, (0.04 + 0.07 * b) * half, hv);
        out.push(<circle key={`b${hv}${b}`} cx={bx} cy={by} r={3.2 * u} fill="#8d857b" />);
      }
    }
    // free-edge highlight
    out.push(<polyline key="edge" points={ptsStr([proj(side, half - 1, 0), proj(side, half - 1, h)])} stroke="#ffe2b8" strokeOpacity={0.35} strokeWidth={2 * u} fill="none" />);
    return out;
  };
  const closed = 1 - Math.min(1, Math.abs(th) / 0.4);
  return (
    <AbsoluteFill>
      {p >= SW ? <Plain>{children}</Plain> : <Hidden>{children}</Hidden>}
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={fid} sd={22 * u} w={w} h={h} />
        </defs>
        {p >= SW && <rect x={0} y={0} width={w} height={h} fill="#000" opacity={0.25 * (1 - seg(p, SW, 0.8))} />}
        <g>{leaf(-1)}</g>
        <g>{leaf(1)}</g>
        {closed > 0 && <rect x={w / 2 - 2 * u} y={0} width={4 * u} height={h} fill="#000" opacity={0.7 * closed} />}
      </Overlay>
    </AbsoluteFill>
  );
};

export const Door: C = (props) => {
  const v = props.passedProps.variant;
  if (v === 'revolve') return <Revolve {...props} />;
  if (v === 'saloon') return <Saloon {...props} />;
  return <DoorSplit {...props} />;
};

// ---------------------------------------------------------------------------------------------
// curtain — paper-lantern cloudCurtain: two out-of-focus paper curtains whose leading edges are a
// column of scalloped cloud heads (each with a carved spiral slit) close from left and right, meet at
// the centre, the scenes swap behind them, and they part again. variant 'velvet': stage velvet.

const Curtain: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const mid = useUid('cut');
  const fid = useUid('cutf');
  const sid = useUid('cuts');
  const gid = useUid('cutg');
  if (presentationDirection === 'exiting') return <Plain>{children}</Plain>;
  if (p >= 1) return <Plain>{children}</Plain>;
  const velvet = pp.variant === 'velvet';
  const close = E.inOutCubic(seg(p, 0, 0.44));
  const open = E.inOutCubic(seg(p, 0.56, 1));
  const k = close * (1 - open); // 1 = closed
  const unit = Math.min(w, h) / 0.3; // source units (frame 0.4 tall), sized on the short side so heads read at 16:9 and 9:16
  const n = Math.ceil(h / (0.036 * unit)) + 2;
  const pitch = h / (n - 2);
  const heads = Array.from({length: n}, (_, i) => ({y: (i - 0.5) * pitch, r: (0.024 + 0.01 * hash01(i * 5.3 + pp.seed)) * unit}));
  const rMax = 0.034 * unit;
  const shadowOff = 14 * u;
  const half = (side: -1 | 1) => {
    // leading edge x: closed -> the heads of both sides overlap at the centre; open -> fully off-frame
    const lead = side < 0 ? lerp(-rMax * 1.2, w / 2 + rMax * 0.35, k) : lerp(w + rMax * 1.2, w / 2 - rMax * 0.35, k);
    const body = side < 0 ? `M ${-w} -10 L ${lead} -10 L ${lead} ${h + 10} L ${-w} ${h + 10} Z` : `M ${lead} -10 L ${2 * w} -10 L ${2 * w} ${h + 10} L ${lead} ${h + 10} Z`;
    return {lead, body};
  };
  const sides: (-1 | 1)[] = [-1, 1];
  if (velvet) {
    const folds = 9;
    return (
      <AbsoluteFill>
        {p >= 0.5 ? <Plain>{children}</Plain> : <Hidden>{children}</Hidden>}
        <Overlay w={w} h={h}>
          <defs>
            <BlurFilter id={fid} sd={18 * u} w={w} h={h} />
            {sides.map((side) => {
              const {lead} = half(side);
              const x0 = side < 0 ? lead - w / 2 : lead;
              return (
                <linearGradient key={side} id={`${gid}${side < 0 ? 'l' : 'r'}`} gradientUnits="userSpaceOnUse" x1={x0} y1={0} x2={x0 + w / 2} y2={0}>
                  {Array.from({length: folds * 2 + 1}, (_, i) => (
                    <stop key={i} offset={i / (folds * 2)} stopColor={i % 2 ? mix(pp.color, '#ffffff', 0.18) : mix(pp.color, '#000000', 0.45)} />
                  ))}
                </linearGradient>
              );
            })}
          </defs>
          {sides.map((side) => {
            const {lead} = half(side);
            const wv = (y: number) => Math.sin(y / (0.12 * h) + side) * 10 * u;
            const pts: [number, number][] = [];
            for (let y = -10; y <= h + 10; y += 20 * u) pts.push([lead + wv(y), y]);
            const far = side < 0 ? -w : 2 * w;
            const d = `M ${far} -10 ` + pts.map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + ` L ${far} ${h + 10} Z`;
            return (
              <g key={side}>
                <path d={d} fill="#000" opacity={0.5} transform={`translate(${-side * 24 * u} 0)`} filter={`url(#${fid})`} />
                <path d={d} fill={`url(#${gid}${side < 0 ? 'l' : 'r'})`} />
                <path d={d} fill="none" stroke={mix(pp.color, '#000000', 0.6)} strokeWidth={6 * u} />
                <rect x={side < 0 ? -w : lead} y={h - 26 * u} width={side < 0 ? w + lead : w * 2} height={10 * u} fill="#C9A24A" opacity={0.85} />
              </g>
            );
          })}
        </Overlay>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      {p >= 0.5 ? <Plain>{children}</Plain> : <Hidden>{children}</Hidden>}
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={fid} sd={4 * u} w={w} h={h} />
          <BlurFilter id={sid} sd={20 * u} w={w} h={h} />
          <mask id={mid} maskUnits="userSpaceOnUse" x={-w} y={-h} width={3 * w} height={3 * h}>
            <rect x={-w} y={-h} width={3 * w} height={3 * h} fill="white" />
            {sides.map((side) => {
              const {lead} = half(side);
              return heads.map((hd, i) => {
                const cx = lead - side * 0.004 * unit;
                const pts: string[] = [];
                for (let s = 0; s <= 30; s++) {
                  const q = s / 30;
                  const a = -side * q * 1.7 * Math.PI * 2 + 1 + i;
                  const rr = hd.r * 0.68 * (0.15 + 0.6 * q);
                  pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(hd.y + Math.sin(a) * rr).toFixed(1)}`);
                }
                return <polyline key={`${side}${i}`} points={pts.join(' ')} fill="none" stroke="black" strokeWidth={0.0017 * unit} strokeLinecap="round" />;
              });
            })}
          </mask>
          {sides.map((side) => {
            const {lead} = half(side);
            return (
              <linearGradient key={side} id={`${gid}${side < 0 ? 'l' : 'r'}`} gradientUnits="userSpaceOnUse" x1={lead - side * w * 0.5} y1={0} x2={lead + side * rMax} y2={0}>
                <stop offset="0" stopColor={mix(pp.color, '#000000', 0.18)} />
                <stop offset="0.8" stopColor={pp.color} />
                <stop offset="1" stopColor={mix(pp.color, '#ffffff', 0.25)} />
              </linearGradient>
            );
          })}
        </defs>
        {sides.map((side) => {
          const {lead, body} = half(side);
          const shape = (
            <>
              <path d={body} />
              {heads.map((hd, i) => (
                <circle key={i} cx={lead - side * 0.004 * unit} cy={hd.y} r={hd.r} />
              ))}
            </>
          );
          return (
            <g key={side}>
              <g fill="#1a1426" opacity={0.45 * Math.min(1, k * 3 + 0.2)} transform={`translate(${-side * shadowOff} ${shadowOff})`} filter={`url(#${sid})`}>
                {shape}
              </g>
              <g mask={`url(#${mid})`} filter={`url(#${fid})`}>
                <g fill={`url(#${gid}${side < 0 ? 'l' : 'r'})`}>{shape}</g>
                <g fill="none" stroke={mix(pp.color, '#ffffff', 0.45)} strokeOpacity={0.5} strokeWidth={2 * u}>
                  {heads.map((hd, i) => (
                    <path
                      key={i}
                      d={`M ${lead - side * 0.004 * unit + Math.cos(-2.2) * hd.r * 0.96} ${hd.y + Math.sin(-2.2) * hd.r * 0.96} A ${hd.r * 0.96} ${hd.r * 0.96} 0 0 1 ${lead - side * 0.004 * unit + Math.cos(-0.9) * hd.r * 0.96} ${hd.y + Math.sin(-0.9) * hd.r * 0.96}`}
                    />
                  ))}
                </g>
              </g>
            </g>
          );
        })}
      </Overlay>
    </AbsoluteFill>
  );
};

export {Curtain};
