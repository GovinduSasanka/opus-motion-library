// Adapted from lemo-opuscar/styles/*/demo/crt.js + core/post/crt.js (power on/off, VHS track/roll), mg-styles-15/demos/
// 10-synthwave + 20-pixel (PWR table) and pdoom-video/app/src/scenes/shoggoth.ts (CRT collapse) (MIT, © their authors) —
// see THIRD_PARTY_NOTICES.md
import React from 'react';
import {
  AbsoluteFill,
  BlurFilter,
  C,
  clamp01,
  E,
  hash01,
  Hidden,
  lerp,
  Masked,
  Overlay,
  Plain,
  seg,
  sstep,
  useFrameSize,
  useUid,
} from './kit';

// ---------------------------------------------------------------------------------------------
// crt — TV switch-off: the picture squashes vertically to a bright line (brightness boost), the line
// shrinks to a dot with a blue-white bloom and afterglow; then the new picture powers on from a dot ->
// line -> open. variants 'off' (collapse, dot holds, new scene cuts in) and 'on' (cut to black, power-on).

const CrtPicture: React.FC<{sx: number; sy: number; boost: number; cx: number; cy: number; children: React.ReactNode}> = ({sx, sy, boost, cx, cy, children}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <AbsoluteFill style={{transform: `scale(${Math.max(0.0001, sx)}, ${Math.max(0.0001, sy)})`, transformOrigin: `${cx}px ${cy}px`, filter: boost > 1.01 ? `brightness(${boost}) saturate(${1 / Math.sqrt(boost)})` : undefined}}>
      {children}
    </AbsoluteFill>
  </AbsoluteFill>
);

const CrtGlow: React.FC<{w: number; h: number; u: number; cx: number; cy: number; lw: number; lh: number; line: number; dot: number; bloom: number; color: string}> = ({w, h, u, cx, cy, lw, lh, line, dot, bloom, color}) => {
  const fid = useUid('crtf');
  const gid = useUid('crtg');
  if (line <= 0.01 && dot <= 0.01 && bloom <= 0.01) return null;
  return (
    <Overlay w={w} h={h} style={{mixBlendMode: 'screen'}}>
      <defs>
        <BlurFilter id={fid} sd={9 * u} w={w} h={h} />
        <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={1}>
          <stop offset="0" stopColor={color} stopOpacity={0.4} />
          <stop offset="0.5" stopColor={color} stopOpacity={0.12} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      {bloom > 0.01 && <circle cx={0} cy={0} r={1} fill={`url(#${gid})`} opacity={bloom} transform={`translate(${cx} ${cy}) scale(${Math.max(60 * u, lw * 0.6)} ${Math.max(60 * u, lw * 0.6) * 0.4})`} />}
      {line > 0.01 && (
        <>
          <rect x={cx - lw / 2} y={cy - 8 * u} width={lw} height={16 * u} fill={color} opacity={0.7 * line} filter={`url(#${fid})`} />
          <rect x={cx - lw / 2} y={cy - Math.min(3 * u, Math.max(1.5 * u, lh / 2))} width={lw} height={Math.min(6 * u, Math.max(3 * u, lh))} fill="#ffffff" opacity={line} />
        </>
      )}
      {dot > 0.01 && (
        <>
          <circle cx={cx} cy={cy} r={22 * u} fill={color} opacity={0.6 * dot} filter={`url(#${fid})`} />
          <circle cx={cx} cy={cy} r={5 * u} fill="#ffffff" opacity={dot} />
        </>
      )}
    </Overlay>
  );
};

/** off: 0..1 -> squash Y (inExpo-ish) then X; returns scale + glow amounts */
const offState = (q: number) => {
  const a = seg(q, 0, 0.6);
  const b = seg(q, 0.6, 0.9);
  const sy = lerp(1, 0.004, E.inCubic(a));
  const sx = lerp(1, 0.02, E.inCubic(b));
  const after = 1 - seg(q, 0.9, 1) * 0.35;
  return {sx, sy, boost: 1 + (1 - sy) * 1.6, line: sstep(0.45, 0.6, q) * (1 - seg(q, 0.85, 0.95)), dot: q >= 0.85 ? after : 0};
};
/** on: 0..1 -> stretch X from a dot, then open Y */
const onState = (q: number) => {
  const sx = lerp(0.02, 1, E.outCubic(seg(q, 0, 0.35)));
  const sy = lerp(0.004, 1, E.outCubic(seg(q, 0.35, 1)));
  return {sx, sy, boost: 1 + Math.pow(1 - sy, 3) * 1.4, line: (1 - sstep(0.35, 0.5, q)) * sstep(0, 0.08, q), dot: 1 - seg(q, 0, 0.2)};
};

export const Crt: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const cx = pp.x * w;
  const cy = pp.y * h;
  const v = pp.variant;
  const [offEnd, onStart] = v === 'off' ? [0.7, 0.92] : v === 'on' ? [0, 0.08] : [0.42, 0.55];
  const glow = (st: {sx: number; sy: number; line: number; dot: number}, fade = 1) => (
    <CrtGlow w={w} h={h} u={u} cx={cx} cy={cy} lw={w * st.sx} lh={h * st.sy} line={st.line * fade} dot={st.dot * fade} bloom={Math.max(st.line, st.dot) * 0.8 * fade} color={pp.color} />
  );
  if (presentationDirection === 'exiting') {
    if (v === 'on') return <AbsoluteFill style={{background: '#000'}} />;
    if (p >= onStart) return <AbsoluteFill style={{background: '#000'}} />;
    if (p < offEnd) {
      const st = offState(p / offEnd);
      return (
        <AbsoluteFill>
          <CrtPicture {...st} cx={cx} cy={cy}>
            {children}
          </CrtPicture>
          {glow(st)}
        </AbsoluteFill>
      );
    }
    // afterglow dot between the two halves
    const fade = 1 - seg(p, offEnd, onStart) * 0.75;
    return (
      <AbsoluteFill style={{background: '#000'}}>
        <Hidden>{children}</Hidden>
        {glow({sx: 0.02, sy: 0.004, line: 0, dot: 0.65}, fade)}
      </AbsoluteFill>
    );
  }
  if (p < onStart) return <Hidden>{children}</Hidden>;
  if (p >= 1) return <Plain>{children}</Plain>;
  if (v === 'off') return <AbsoluteFill style={{opacity: seg(p, onStart, 1)}}>{children}</AbsoluteFill>;
  const st = onState(seg(p, onStart, 1));
  return (
    <AbsoluteFill>
      <CrtPicture {...st} cx={cx} cy={cy}>
        {children}
      </CrtPicture>
      {glow(st)}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// tracking — VHS tracking tear: a rolling noise band (`size` of H) travels down the frame; inside it
// the rows are torn sideways (feTurbulence rows x a gaussian band -> feDisplacementMap), with static
// and chroma lines; the frame rolls a little; above the band the new scene has replaced the old one.

const TrackFilter: React.FC<{id: string; w: number; h: number; u: number; band: number; bh: number; step: number; amount: number}> = ({id, w, h, u, band, bh, step, amount}) => (
  <filter id={id} x={0} y={0} width={w} height={h} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency={`0 ${(0.045 / u).toFixed(4)}`} numOctaves={2} seed={step} result="n0" />
    <feColorMatrix in="n0" type="matrix" values="3.2 0 0 0 -1.1  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 1" result="n" />
    <feFlood floodColor="#000" x={0} y={0} width={w} height={h} result="black" />
    <feFlood floodColor="#fff" x={-10} y={band - bh / 2} width={w + 20} height={bh} result="bw" />
    <feGaussianBlur in="bw" stdDeviation={`0 ${(bh * 0.3).toFixed(1)}`} result="bb" />
    <feMerge result="g">
      <feMergeNode in="black" />
      <feMergeNode in="bb" />
    </feMerge>
    <feComposite in="n" in2="g" operator="arithmetic" k1={1} k2={0} k3={-0.5} k4={0.5} result="map" />
    <feDisplacementMap in="SourceGraphic" in2="map" scale={amount} xChannelSelector="R" yChannelSelector="G" />
  </filter>
);

export const Tracking: C = ({children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const fid = useUid('trk');
  const mid = useUid('trkm');
  const bid = useUid('trkb');
  const bh = (pp.size || 0.12) * h;
  const e = E.inOutQuad(clamp01(p));
  const band = lerp(-bh, h + bh, e);
  const f = Math.floor(p * D);
  const step = Math.floor((p * D) / 1.5) + pp.seed * 13;
  const amount = 0.16 * w * Math.pow(Math.sin(Math.PI * clamp01(p)), 0.4);
  const roll = Math.sin(Math.PI * clamp01(p)) * 0.025 * h * (hash01(Math.floor(f / 2) + pp.seed) > 0.5 ? 1 : -0.6);
  const torn = (
    <>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <TrackFilter id={fid} w={w} h={h} u={u} band={band} bh={bh} step={step} amount={amount} />
        </defs>
      </svg>
      <AbsoluteFill style={{filter: p > 0 && p < 1 ? `url(#${fid})` : undefined, transform: `translateY(${roll}px)`}}>{children}</AbsoluteFill>
    </>
  );
  if (presentationDirection === 'exiting') return <AbsoluteFill style={{background: '#000'}}>{torn}</AbsoluteFill>;
  if (p >= 1) return <Plain>{children}</Plain>;
  // static + chroma lines inside the band
  const r = (k: number) => hash01(step * 97 + k * 13.7 + pp.seed);
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < 90; i++) {
    const g = (r(i) + r(i + 200) + r(i + 400)) / 3 - 0.5; // ~gaussian
    const y = band + roll + g * bh * 1.6;
    const lw = (0.05 + 0.5 * r(i + 600)) * w;
    const x = r(i + 800) * w - lw * 0.3;
    const col = i % 7 === 0 ? '#ff3b6b' : i % 7 === 1 ? '#3bf2ff' : '#ffffff';
    lines.push(<rect key={i} x={x} y={y} width={lw} height={(1 + 3 * r(i + 1000)) * u} fill={col} opacity={0.25 + 0.6 * r(i + 1200)} />);
  }
  return (
    <AbsoluteFill>
      <Masked
        id={mid}
        w={w}
        h={h}
        defs={<BlurFilter id={bid} sd={bh * 0.12} w={w} h={h} />}
        mask={<rect x={-w} y={-h * 2} width={3 * w} height={h * 2 + band + roll} fill="white" filter={`url(#${bid})`} />}
      >
        <AbsoluteFill style={{background: '#000'}}>{torn}</AbsoluteFill>
      </Masked>
      <Overlay w={w} h={h}>
        <rect x={0} y={band + roll - bh * 0.6} width={w} height={bh * 1.2} fill="#fff" opacity={0.08} />
        {lines}
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// lights — house lights snap off like a relay (to 6 %), a dark beat, then a key light strikes on the
// new scene with a flicker (0.75 + 0.25·sin(90·Δt)) and the house lights come up slowly.

export const Lights: C = ({children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp}) => {
  const {w, h} = useFrameSize();
  const gid = useUid('lgt');
  const S = 0.3;
  if (presentationDirection === 'exiting') {
    if (p >= S) return <AbsoluteFill style={{background: '#000'}} />;
    // relay: off, a stutter back up, off again
    const off = p < 0.03 ? sstep(0, 0.03, p) : p < 0.05 ? 1 - 0.4 * sstep(0.03, 0.04, p) : 0.6 + 0.4 * sstep(0.05, 0.07, p);
    return (
      <AbsoluteFill>
        {children}
        <AbsoluteFill style={{background: '#000', opacity: 0.94 * off}} />
      </AbsoluteFill>
    );
  }
  if (p < S) return <Hidden>{children}</Hidden>;
  if (p >= 1) return <Plain>{children}</Plain>;
  const dt = ((p - S) * D) / 30; // seconds since the strike
  const ramp = clamp01(dt / 0.12);
  const flick = dt < 0.25 ? 0.75 + 0.25 * Math.sin(90 * dt) : 1;
  const key = ramp * flick;
  const house = 0.06 + 0.94 * E.inOutQuad(seg(p, 0.55, 1));
  const cx = pp.x * w;
  const cy = pp.y * h;
  const R = Math.max(w, h) * 0.42;
  const dark = (v: number) => clamp01(1 - v).toFixed(3);
  return (
    <AbsoluteFill>
      {children}
      <Overlay w={w} h={h}>
        <defs>
          <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={R}>
            <stop offset="0" stopColor="#000" stopOpacity={dark(Math.max(house, key))} />
            <stop offset="0.55" stopColor="#000" stopOpacity={dark(Math.max(house, key * 0.8))} />
            <stop offset="1" stopColor="#000" stopOpacity={dark(house)} />
          </radialGradient>
        </defs>
        <rect x={-2} y={-2} width={w + 4} height={h + 4} fill={`url(#${gid})`} />
        <circle cx={cx} cy={cy} r={R * 0.7} fill={pp.color} opacity={0.07 * key * (1 - house)} style={{mixBlendMode: 'screen'}} />
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// screen — x4 screen-portal-push: a monitor showing the next scene settles over the old one, then
// the camera pushes into its screen until the screen IS the frame (the bezel slides out past the
// edges, a warm glare fades). `x`,`y` = screen centre, `size` = screen width as a fraction of W.

export const ScreenPush: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const fid = useUid('scrf');
  const size = Math.min(0.9, Math.max(0.15, pp.size || 0.42));
  const C0 = [pp.x * w, pp.y * h];
  const M = [w / 2, h / 2];
  const a = E.outCubic(seg(p, 0, 0.24)); // device appears
  const appear = 0.88 + 0.12 * a;
  const e = E.inOutCubic(seg(p, 0.24, 1));
  const s = Math.exp(lerp(0, Math.log(1 / size), e));
  const Mt = [lerp(C0[0], M[0], e), lerp(C0[1], M[1], e)];
  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill style={{transform: `translate(${Mt[0] - s * C0[0]}px, ${Mt[1] - s * C0[1]}px) scale(${s})`, transformOrigin: '0 0', filter: `brightness(${1 - 0.3 * a}) blur(${2 * a * u}px)`}}>
        {children}
      </AbsoluteFill>
    );
  }
  if (p >= 1) return <Plain>{children}</Plain>;
  // world -> screen: P -> Mt + s * (C0 + appear*(P - C0) - C0)
  const k = s * size * appear;
  const tx = Mt[0] - k * M[0];
  const ty = Mt[1] - k * M[1];
  const sw = size * w;
  const sh = size * h;
  const bz = 0.035 * sw;
  const rad = 0.012 * sw;
  const camera = `translate(${Mt[0]} ${Mt[1]}) scale(${s * appear}) translate(${-C0[0]} ${-C0[1]})`;
  const x0 = C0[0] - sw / 2;
  const y0 = C0[1] - sh / 2;
  const glare = 1 - seg(p, 0.6, 0.95);
  return (
    <AbsoluteFill style={{opacity: a}}>
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={fid} sd={18 * u} w={w} h={h} />
        </defs>
        <g transform={camera}>
          <rect x={x0 - bz + 10 * u} y={y0 - bz + 22 * u} width={sw + 2 * bz} height={sh + 2 * bz + bz * 1.6} rx={rad * 2} fill="#000" opacity={0.45} filter={`url(#${fid})`} />
          <rect x={C0[0] - sw * 0.06} y={y0 + sh + bz * 2} width={sw * 0.12} height={sh * 0.16} fill="#2a2d33" />
          <rect x={C0[0] - sw * 0.2} y={y0 + sh + bz * 2 + sh * 0.15} width={sw * 0.4} height={bz * 0.8} rx={bz * 0.4} fill="#33363d" />
          <rect x={x0 - bz} y={y0 - bz} width={sw + 2 * bz} height={sh + 2 * bz + bz * 1.2} rx={rad * 2} fill={pp.color} />
          <rect x={x0 - bz} y={y0 - bz} width={sw + 2 * bz} height={sh + 2 * bz + bz * 1.2} rx={rad * 2} fill="none" stroke="#fff" strokeOpacity={0.12} strokeWidth={1.5 * u} />
          <circle cx={C0[0]} cy={y0 + sh + bz * 0.8} r={bz * 0.18} fill="#5a5f68" />
        </g>
      </Overlay>
      <AbsoluteFill style={{transform: `translate(${tx}px, ${ty}px) scale(${k})`, transformOrigin: '0 0', borderRadius: rad / size, overflow: 'hidden'}}>
        {children}
        {glare > 0 && (
          <AbsoluteFill style={{background: `linear-gradient(115deg, rgba(255,236,200,${0.22 * glare}) 0%, rgba(255,236,200,${0.06 * glare}) 38%, rgba(255,255,255,0) 60%)`}} />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// expand — x6 container-expand: a UI element (rect at x, y; `size` = width as a fraction of W) fills
// with `color` and grows (easeInQuad) into a full-screen panel, inside which the next screen fades up.
// variant 'collapse': the old screen shrinks to a small rectangle, then to a dot on black (TV switch-off,
// but rectangular); the dot holds, then the next screen fades in.

export const Expand: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const fid = useUid('expf');
  if (pp.variant === 'collapse') {
    if (presentationDirection === 'exiting') {
      if (p >= 0.6) return <AbsoluteFill style={{background: '#000'}} />;
      const q = seg(p, 0, 0.6);
      // full -> 0.88 -> 0.12 x 0.12 (square) -> 4 px dot
      const key = [
        [0, w, h],
        [0.25, 0.88 * w, 0.88 * h],
        [0.75, 0.12 * w, 0.12 * w],
        [1, 4 * u, 4 * u],
      ];
      let rw = w;
      let rh = h;
      for (let i = 0; i < key.length - 1; i++) {
        if (q >= key[i][0] && q <= key[i + 1][0]) {
          const t = E.inOutCubic((q - key[i][0]) / (key[i + 1][0] - key[i][0]));
          rw = lerp(key[i][1], key[i + 1][1], t);
          rh = lerp(key[i][2], key[i + 1][2], t);
        }
      }
      return (
        <AbsoluteFill style={{background: '#000'}}>
          <AbsoluteFill style={{transform: `scale(${rw / w}, ${rh / h})`, filter: `brightness(${1 + 0.6 * q})`, borderRadius: 18 * u * q}}>{children}</AbsoluteFill>
        </AbsoluteFill>
      );
    }
    if (p >= 1) return <Plain>{children}</Plain>;
    const dot = p >= 0.6 ? 1 - seg(p, 0.86, 0.94) : 0;
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{opacity: E.outCubic(seg(p, 0.84, 1))}}>{children}</AbsoluteFill>
        {dot > 0 && (
          <Overlay w={w} h={h}>
            <rect x={w / 2 - 2 * u} y={h / 2 - 2 * u} width={4 * u} height={4 * u} fill="#fff" opacity={dot} />
          </Overlay>
        )}
      </AbsoluteFill>
    );
  }
  if (presentationDirection === 'exiting') return <Plain>{children}</Plain>;
  if (p >= 1) return <Plain>{children}</Plain>;
  const e = E.inQuad(seg(p, 0, 0.72));
  const cx0 = pp.x * w;
  const cy0 = pp.y * h;
  const w0 = (pp.size || 0.27) * w;
  const h0 = (pp.size || 0.27) * 0.74 * h;
  const rw = lerp(w0, w + 4, e);
  const rh = lerp(h0, h + 4, e);
  const cx = lerp(cx0, w / 2, e);
  const cy = lerp(cy0, h / 2, e);
  const rr = lerp(Math.min(w0, h0) * 0.12, 0, e);
  const l = cx - rw / 2;
  const t = cy - rh / 2;
  const clip = `inset(${t}px ${w - (l + rw)}px ${h - (t + rh)}px ${l}px round ${rr}px)`;
  const pop = 1 + 0.04 * Math.sin(Math.PI * seg(p, 0, 0.12));
  return (
    <AbsoluteFill>
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={fid} sd={24 * u} w={w} h={h} />
        </defs>
        <rect x={l} y={t + 16 * u} width={rw} height={rh} rx={rr} fill="#000" opacity={0.35 * (1 - e)} filter={`url(#${fid})`} />
      </Overlay>
      <AbsoluteFill style={{clipPath: clip, transform: `scale(${pop})`, transformOrigin: `${cx}px ${cy}px`}}>
        <AbsoluteFill style={{background: pp.color}} />
        <AbsoluteFill style={{opacity: E.inOutQuad(seg(p, 0.6, 0.97))}}>{children}</AbsoluteFill>
      </AbsoluteFill>
      <Overlay w={w} h={h}>
        <circle cx={cx} cy={cy} r={2 * u} fill="#fff" opacity={0.9 * (1 - seg(p, 0.7, 0.9))} />
      </Overlay>
    </AbsoluteFill>
  );
};
