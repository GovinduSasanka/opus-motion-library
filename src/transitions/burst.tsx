// Portal adapted from lemo-opuscar/styles/scifi-toon/demo/main.js (`wipe`, radius 1350·u^0.6, pale flash) (MIT, © LemoLab)
// — see THIRD_PARTY_NOTICES.md. Ball flood and core shockwave rebuilt from the x2 reference video.
import React from 'react';
import {AbsoluteFill, BlurFilter, C, clamp01, cornerR, E, hash01, Hidden, lerp, Masked, mix, Overlay, Plain, ptsStr, seg, useFrameSize, useUid} from './kit';

// ---------------------------------------------------------------------------------------------
// ball — x2 ball-zoom-flood: a ball leaves (x, y), flies at the camera (easeInExpo growth) towards the
// frame centre with a motion-blurred edge, until its flat colour floods the frame; the next scene
// then comes up out of that colour.

export const Ball: C = ({children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const fid = useUid('bal');
  const gid = useUid('balg');
  const A = 0.62;
  if (presentationDirection === 'exiting') return p >= A ? <Hidden>{children}</Hidden> : <Plain>{children}</Plain>;
  if (p >= 1) return <Plain>{children}</Plain>;
  const q = clamp01(p / A);
  const r0 = 56 * u;
  const rEnd = Math.hypot(w, h) * 0.62;
  const k = Math.log(rEnd / r0);
  const R = r0 * Math.exp(k * Math.pow(q, 1.6));
  const dq = 0.02;
  const Rn = r0 * Math.exp(k * Math.pow(Math.min(1, q + dq), 1.6));
  const speed = ((Rn - R) / dq) * (1 / Math.max(1, D * A)); // px per frame
  const mv = E.inCubic(q);
  const cx = lerp(pp.x * w, w / 2, mv);
  const cy = lerp(pp.y * h, h / 2, mv);
  const blur = Math.min(40 * u, speed * 0.18);
  const fade = E.inOutQuad(seg(p, A + 0.06, 1));
  return (
    <AbsoluteFill>
      {p >= A ? <Plain>{children}</Plain> : <Hidden>{children}</Hidden>}
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={fid} sd={Math.max(0.01, blur)} w={w} h={h} />
          <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={cx - R * 0.35} cy={cy - R * 0.4} r={R * 1.3}>
            <stop offset="0" stopColor={mix(pp.color, '#ffffff', 0.18)} />
            <stop offset="0.7" stopColor={pp.color} />
            <stop offset="1" stopColor={mix(pp.color, '#000000', 0.12)} />
          </radialGradient>
        </defs>
        {p < A ? (
          <>
            <ellipse cx={cx + R * 0.08} cy={cy + R * 0.22} rx={R * 0.95} ry={R * 0.5} fill="#000" opacity={0.18 * (1 - q)} filter={`url(#${fid})`} />
            <circle cx={cx} cy={cy} r={R} fill={q > 0.8 ? pp.color : `url(#${gid})`} filter={blur > 1 ? `url(#${fid})` : undefined} />
          </>
        ) : (
          <rect x={-2} y={-2} width={w + 4} height={h + 4} fill={pp.color} opacity={1 - fade} />
        )}
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// shockwave — x2 core-shockwave-reveal: a white-orange flash at (x, y), one flat grey beat, then a disc
// of the new scene expands from the core (easeOutCubic) with a soft chromatic fringe ring (`color`)
// and a fainter trailing ring, white streaks spraying radially inside it and a dark core that closes.

export const Shockwave: C = ({children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('shk');
  const fid = useUid('shkf');
  const gid = useUid('shkg');
  const cx = pp.x * w;
  const cy = pp.y * h;
  const F = 0.14;
  const G = 0.2;
  if (presentationDirection === 'exiting') {
    if (p >= F) return <AbsoluteFill style={{background: '#5A5A5A'}} />;
    const fl = E.inQuad(p / F);
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{filter: `brightness(${1 + 1.5 * fl})`}}>{children}</AbsoluteFill>
        <Overlay w={w} h={h} style={{mixBlendMode: 'screen'}}>
          <defs>
            <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={Math.max(w, h) * (0.2 + 0.8 * fl)}>
              <stop offset="0" stopColor="#fff" stopOpacity={1} />
              <stop offset="0.3" stopColor="#ffd9a0" stopOpacity={0.8} />
              <stop offset="1" stopColor="#ff9a40" stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect x={0} y={0} width={w} height={h} fill={`url(#${gid})`} opacity={fl} />
        </Overlay>
      </AbsoluteFill>
    );
  }
  if (p < G) return <Hidden>{children}</Hidden>;
  if (p >= 1) return <Plain>{children}</Plain>;
  const q = seg(p, G, 0.92);
  const Rmax = cornerR(cx, cy, w, h) + 0.06 * h;
  const R = lerp(0.25 * h, Rmax, E.outCubic(q));
  const q2 = seg(p, G + 0.1, 0.98);
  const R2 = lerp(0.12 * h, Rmax, E.outCubic(q2));
  const hole = 0.05 * h * (1 - E.inOutQuad(seg(p, G, 0.7)));
  const fr = 0.04 * h;
  const sp = 1 - E.outCubic(q); // remaining speed
  const streaks: React.ReactNode[] = [];
  for (let i = 0; i < 110; i++) {
    const a = hash01(i * 3.7 + pp.seed) * Math.PI * 2;
    const rr = R * (0.25 + 0.7 * hash01(i * 9.1 + pp.seed * 2));
    const len = (10 + 30 * hash01(i * 5.3)) * u * (0.3 + 2.2 * sp) * (rr / (0.5 * h));
    const op = (0.4 + 0.6 * hash01(i * 2.2)) * (1 - seg(p, 0.75, 1));
    streaks.push(<line key={i} x1={cx + Math.cos(a) * rr} y1={cy + Math.sin(a) * rr} x2={cx + Math.cos(a) * (rr + len)} y2={cy + Math.sin(a) * (rr + len)} stroke="#fff" strokeWidth={2.4 * u} strokeLinecap="round" opacity={op} />);
  }
  const f = p * D;
  return (
    <AbsoluteFill style={{background: '#5A5A5A'}}>
      <Masked
        id={id}
        w={w}
        h={h}
        mask={
          <>
            <circle cx={cx} cy={cy} r={R} fill="white" />
            {hole > 0.5 && <circle cx={cx} cy={cy} r={hole} fill="black" />}
          </>
        }
      >
        {children}
      </Masked>
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={fid} sd={fr * 0.35} w={w} h={h} />
        </defs>
        <g filter={`url(#${fid})`}>
          <circle cx={cx} cy={cy} r={R + fr * 0.2} fill="none" stroke={pp.color} strokeWidth={fr} opacity={0.9 * (1 - seg(p, 0.85, 1))} />
          <circle cx={cx} cy={cy} r={R - fr * 0.45} fill="none" stroke="#fff6a0" strokeWidth={fr * 0.35} opacity={0.6 * (1 - seg(p, 0.8, 1))} />
          <circle cx={cx} cy={cy} r={R2} fill="none" stroke={pp.color} strokeWidth={fr * 0.5} opacity={0.4 * (1 - seg(p, 0.8, 1))} />
        </g>
        {streaks}
        {hole > 0.5 && <circle cx={cx} cy={cy} r={hole * (1 + 0.05 * Math.sin(f))} fill="#0b0b10" />}
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// portal — scifi-toon portal wipe: a spinning swirl portal (log-spiral arms around a dark core) rushes
// from (x, y) to cover the frame (R = Rmax·u^0.6, fast growth / slow tail), flashes pale for a frame
// at full cover, and the next scene opens out of the same shrinking swirl.

export const Portal: C = ({children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const gid = useUid('ptl');
  const fid = useUid('ptlf');
  if (presentationDirection === 'exiting') return p >= 0.5 ? <Hidden>{children}</Hidden> : <Plain>{children}</Plain>;
  if (p >= 1) return <Plain>{children}</Plain>;
  const cols = pp.colors.length >= 4 ? pp.colors : ['#160B33', '#3B1F86', '#7B4DFF', '#36D6C3', '#DCFFA8'];
  const cx = pp.x * w;
  const cy = pp.y * h;
  const Rmax = cornerR(cx, cy, w, h) * 1.12;
  const uu = clamp01(1 - Math.abs(p - 0.5) / 0.5);
  const R = Rmax * Math.pow(uu, 0.6);
  const f = p * D;
  const spin = f * 0.22 * 2.2;
  const arms = 5;
  const armShapes: React.ReactNode[] = [];
  for (let a = 0; a < arms; a++) {
    const base = (a / arms) * Math.PI * 2 + spin;
    const inner: number[][] = [];
    const outer: number[][] = [];
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const r = R * (0.04 + 0.98 * t);
      const th = base + t * 3.2;
      const wdt = 0.55 * t * (1 - 0.35 * t);
      outer.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r]);
      inner.push([cx + Math.cos(th - wdt) * r * 0.97, cy + Math.sin(th - wdt) * r * 0.97]);
    }
    const col = cols[1 + (a % Math.max(1, cols.length - 2))];
    armShapes.push(<polygon key={`a${a}`} points={ptsStr([...outer, ...inner.reverse()])} fill={col} />);
    armShapes.push(<polyline key={`l${a}`} points={ptsStr(outer)} fill="none" stroke={cols[cols.length - 1]} strokeOpacity={0.7} strokeWidth={Math.max(1.5 * u, R * 0.012)} />);
  }
  const flash = Math.abs(p - 0.5) < 0.045 ? 0.7 * (1 - Math.abs(p - 0.5) / 0.045) : 0;
  return (
    <AbsoluteFill>
      {p >= 0.5 ? <Plain>{children}</Plain> : <Hidden>{children}</Hidden>}
      {R > 1 && (
        <Overlay w={w} h={h}>
          <defs>
            <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={R}>
              <stop offset="0" stopColor={cols[0]} />
              <stop offset="0.75" stopColor={mix(cols[0], cols[1], 0.6)} />
              <stop offset="1" stopColor={cols[1]} />
            </radialGradient>
            <BlurFilter id={fid} sd={Math.max(4 * u, R * 0.04)} w={w} h={h} />
          </defs>
          <circle cx={cx} cy={cy} r={R * 1.04} fill={cols[3]} opacity={0.55} filter={`url(#${fid})`} />
          <circle cx={cx} cy={cy} r={R} fill={`url(#${gid})`} />
          <g>{armShapes}</g>
          <circle cx={cx} cy={cy} r={R * 0.1} fill={cols[0]} />
          <circle cx={cx} cy={cy} r={R * 0.05} fill={cols[cols.length - 1]} opacity={0.8} />
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={cols[cols.length - 1]} strokeWidth={Math.max(2 * u, R * 0.01)} opacity={0.7} />
        </Overlay>
      )}
      {flash > 0 && <AbsoluteFill style={{background: pp.color, opacity: flash}} />}
    </AbsoluteFill>
  );
};
