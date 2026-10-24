// Adapted from lemo-opuscar/styles/newsreel/demo/index.html ('blinds'), mg-styles-15/demos/09-bauhaus/film.js (tile
// flips) and lemo-opuscar/styles/pixel-rpg/demo/px.js (mosaic) (MIT, © their authors) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {PixelDitherFilter} from '../core/image-kit';
import {
  AbsoluteFill,
  axisFor,
  BlurFilter,
  C,
  clamp01,
  E,
  FullRect,
  Hidden,
  lerp,
  Masked,
  Overlay,
  Plain,
  ptsStr,
  seg,
  sstep,
  useDecoded,
  useFrameSize,
  useUid,
} from './kit';

// ---------------------------------------------------------------------------------------------
// blinds — newsreel 'blinds': N slats each turn over (height |cos πv|) from the old picture to the
// new one, top slat first, black showing between half-turned slats.
//   variant 'vertical' — columns (paper-popup sky slats)
//   variant 'open'     — x2 field-blinds-wipe: the old picture's slats shrink to thin lines and vanish

type Slat = {a: number; b: number; v: number};

const slatsAt = (n: number, p: number, len: number, dur: number, ease: (t: number) => number): Slat[] => {
  const st = n > 1 ? (1 - dur) / (n - 1) : 0;
  return Array.from({length: n}, (_, i) => {
    const v = ease(seg(p, i * st, i * st + dur));
    return {a: (i / n) * len, b: ((i + 1) / n) * len, v};
  });
};

export const Blinds: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('bln');
  const vert = pp.variant === 'vertical';
  const open = pp.variant === 'open';
  const n = Math.max(2, Math.round(pp.bands));
  const len = vert ? w : h;
  const slats = slatsAt(n, p, len, open ? 0.7 : 0.64, open ? E.inCubic : E.inOutQuad);
  const rect = (a: number, b: number, key: React.Key, fill = 'white') =>
    vert ? <rect key={key} x={a} y={-2} width={Math.max(0, b - a)} height={h + 4} fill={fill} /> : <rect key={key} x={-2} y={a} width={w + 4} height={Math.max(0, b - a)} fill={fill} />;
  if (open) {
    if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
    // new scene everywhere except the shrinking slats of the old one
    return (
      <Masked
        id={id}
        w={w}
        h={h}
        mask={
          <>
            <FullRect w={w} h={h} />
            {slats.map((s, i) => {
              const k = 1 - s.v;
              const c = (s.a + s.b) / 2;
              const half = ((s.b - s.a) / 2) * k;
              return k > 0.001 ? rect(c - half, c + half, i, 'black') : null;
            })}
          </>
        }
      >
        {children}
      </Masked>
    );
  }
  const band = (s: Slat) => {
    const k = Math.abs(Math.cos(Math.PI * s.v));
    const c = (s.a + s.b) / 2;
    const half = ((s.b - s.a) / 2) * k + 0.4;
    return [c - half, c + half, k] as const;
  };
  const mine = slats.filter((s) => (presentationDirection === 'exiting' ? s.v < 0.5 : s.v >= 0.5));
  const mask = mine.map((s, i) => {
    const [a, b] = band(s);
    return rect(a, b, i);
  });
  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill style={{background: pp.color}}>
        <Masked id={id} w={w} h={h} mask={mask}>
          {children}
        </Masked>
      </AbsoluteFill>
    );
  }
  if (p >= 1) return <Plain>{children}</Plain>;
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} mask={mask}>
        {children}
      </Masked>
      <Overlay w={w} h={h}>
        {slats.map((s, i) => {
          if (s.v <= 0 || s.v >= 1) return null;
          const [a, b, k] = band(s);
          const lit = s.v < 0.5 ? a : b;
          return (
            <g key={i}>
              {rect(a, b, 'd', `rgba(0,0,0,${(0.62 * (1 - k)).toFixed(3)})`)}
              {vert ? (
                <rect x={lit - 1.5 * u} y={0} width={3 * u} height={h} fill="#fff" opacity={0.35 * (1 - k)} />
              ) : (
                <rect x={0} y={lit - 1.5 * u} width={w} height={3 * u} fill="#fff" opacity={0.35 * (1 - k)} />
              )}
            </g>
          );
        })}
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// tiles — bauhaus tile cascade: the frame is diced into cards that flip over (foreshortened, the
// far edge narrower, shaded) in a diagonal wave from the top-left; a black bed shows behind
// turning cards. variant 'radial': the wave spreads from (x, y).

export const Tiles: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h} = useFrameSize();
  const id = useUid('til');
  const md = Math.min(w, h);
  const cols = Math.max(2, Math.round(w / ((pp.size || 0.12) * md)));
  const rows = Math.max(2, Math.round(h / ((pp.size || 0.12) * md)));
  const tw = w / cols;
  const th = h / rows;
  const radial = pp.variant === 'radial';
  const ox = pp.x * w;
  const oy = pp.y * h;
  const maxD = Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy));
  const span = 0.55;
  const dur = 1 - span;
  const tiles: {pts: number[][]; v: number; sh: number}[] = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const cx = (i + 0.5) * tw;
      const cy = (j + 0.5) * th;
      const d = radial ? Math.hypot(cx - ox, cy - oy) / maxD : (i / Math.max(1, cols - 1) + j / Math.max(1, rows - 1)) / 2;
      const v = E.inOutQuad(seg(p, d * span, d * span + dur));
      const k = Math.abs(Math.cos(Math.PI * v));
      const sn = Math.abs(Math.sin(Math.PI * v));
      const hh = (th / 2) * k + 0.4;
      const far = (tw / 2) * (1 - 0.22 * sn) + 0.4;
      const near = tw / 2 + 0.4;
      // first half: the top edge tips away; second half: the bottom edge is the far one
      const top = v < 0.5 ? far : near;
      const bot = v < 0.5 ? near : far;
      tiles.push({
        pts: [
          [cx - top, cy - hh],
          [cx + top, cy - hh],
          [cx + bot, cy + hh],
          [cx - bot, cy + hh],
        ],
        v,
        sh: sn,
      });
    }
  }
  const mine = tiles.filter((t) => (presentationDirection === 'exiting' ? t.v < 0.5 : t.v >= 0.5));
  const mask = mine.map((t, i) => <polygon key={i} points={ptsStr(t.pts)} fill="white" />);
  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill style={{background: pp.color}}>
        <Masked id={id} w={w} h={h} mask={mask}>
          {children}
        </Masked>
      </AbsoluteFill>
    );
  }
  if (p >= 1) return <Plain>{children}</Plain>;
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} mask={mask}>
        {children}
      </Masked>
      <Overlay w={w} h={h}>
        {tiles.map((t, i) =>
          t.v > 0 && t.v < 1 ? <polygon key={i} points={ptsStr(t.pts)} fill="#000" opacity={0.42 * t.sh} stroke="#fff" strokeOpacity={0.18 * t.sh} strokeWidth={1.2} /> : null,
        )}
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// mosaic — pixel-rpg mosaic: the frame pixelates to big blocks, the scenes swap at the peak, the
// blocks shrink back into the new scene.

const PixelScene: React.FC<{block: number; children: React.ReactNode; style?: React.CSSProperties}> = ({block, children, style}) => {
  const id = useUid('mos');
  const b = Math.round(block);
  if (b < 2) return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill style={style}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <PixelDitherFilter id={id} size={b} palette={[]} dither={0} />
        </defs>
      </svg>
      <AbsoluteFill style={{filter: `url(#${id})`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

const Mosaic: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {u} = useFrameSize();
  const maxB = Math.max(4, (pp.size || 0.06) * 1080 * u);
  const m = E.inQuad(1 - Math.abs(2 * clamp01(p) - 1));
  // blocks grow in steps (1, 2, 4, 8 … like the source's integer block sizes)
  const block = Math.max(1, Math.pow(2, Math.round(Math.log2(1 + (maxB - 1) * m) * 2) / 2));
  if (presentationDirection === 'exiting') return p >= 0.56 ? <Hidden>{children}</Hidden> : <PixelScene block={block}>{children}</PixelScene>;
  if (p >= 1) return <Plain>{children}</Plain>;
  return (
    <PixelScene block={block} style={{opacity: sstep(0.44, 0.56, p)}}>
      {children}
    </PixelScene>
  );
};

// ---------------------------------------------------------------------------------------------
// mosaic 'swirl' — pixel-rpg encounter swirl: the old image twists around (x, y), sinks inward while
// pixelating, then dissolves to white through a 4x4 Bayer pattern; the new scene comes back out of
// the white through the reverse dither. The twist is an SVG feDisplacementMap fed by a per-frame
// displacement image (canvas, generated from the frame number only, so it is deterministic).

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const swirlMaps = new Map<string, {url: string; scale: number}>();

const swirlMap = (w: number, h: number, cx: number, cy: number, s: number, twist: number) => {
  const key = `${w}x${h}:${cx.toFixed(1)},${cy.toFixed(1)}:${s.toFixed(4)}:${twist}`;
  const hit = swirlMaps.get(key);
  if (hit) return hit;
  const W = 240;
  const H = Math.max(2, Math.round((W * h) / w));
  const sx = w / W;
  const sy = h / H;
  const R0 = Math.min(w, h) * 0.59;
  const sink = 1 + 0.55 * s;
  const dx = new Float32Array(W * H);
  const dy = new Float32Array(W * H);
  let maxD = 1;
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const x = (i + 0.5) * sx - cx;
      const y = (j + 0.5) * sy - cy;
      const r = Math.hypot(x, y);
      const a = Math.atan2(y, x) - s * twist * Math.max(0, 1.2 - r / R0);
      const rr = r * sink;
      const ddx = Math.cos(a) * rr - x;
      const ddy = Math.sin(a) * rr - y;
      dx[j * W + i] = ddx;
      dy[j * W + i] = ddy;
      maxD = Math.max(maxD, Math.abs(ddx), Math.abs(ddy));
    }
  }
  const scale = maxD * 2.02;
  let url = '';
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    if (g) {
      const img = g.createImageData(W, H);
      for (let k = 0; k < W * H; k++) {
        img.data[k * 4] = Math.round(clamp01(0.5 + dx[k] / scale) * 255);
        img.data[k * 4 + 1] = Math.round(clamp01(0.5 + dy[k] / scale) * 255);
        img.data[k * 4 + 2] = 0;
        img.data[k * 4 + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      url = c.toDataURL('image/png');
    }
  }
  const out = {url, scale};
  if (swirlMaps.size > 400) swirlMaps.clear();
  swirlMaps.set(key, out);
  return out;
};

const BayerWhite: React.FC<{w: number; h: number; cell: number; level: number; color: string}> = ({w, h, cell, level, color}) => {
  const id = useUid('bay');
  if (level <= 0) return null;
  if (level >= 1) return <AbsoluteFill style={{background: color}} />;
  const on = BAYER4.map((b, i) => [b, i] as const).filter(([b]) => b < level * 16);
  return (
    <Overlay w={w} h={h}>
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" width={cell * 4} height={cell * 4}>
          {on.map(([, i]) => (
            <rect key={i} x={(i % 4) * cell} y={Math.floor(i / 4) * cell} width={cell + 0.3} height={cell + 0.3} fill={color} />
          ))}
        </pattern>
      </defs>
      <rect x={0} y={0} width={w} height={h} fill={`url(#${id})`} />
    </Overlay>
  );
};

const Swirl: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const fid = useUid('swl');
  const A = 0.62; // end of the swirl, white from ~0.5
  const cell = Math.max(4, Math.round(10 * u));
  const t = clamp01(p / A);
  const s = Math.pow(t, 1.6);
  const {url, scale} = presentationDirection === 'exiting' && p < A ? swirlMap(w, h, pp.x * w, pp.y * h, s, 7) : {url: '', scale: 0};
  useDecoded(url);
  if (presentationDirection === 'exiting') {
    if (p >= A) return <Hidden>{children}</Hidden>;
    const block = 1 + Math.round(6 * s) * u * 2.2;
    const white = seg(t, 0.72, 1);
    return (
      <AbsoluteFill style={{background: '#000'}}>
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <defs>
            <filter id={fid} x="0" y="0" width={w} height={h} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feImage href={url} x={0} y={0} width={w} height={h} preserveAspectRatio="none" result="map" />
              <feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
        <PixelScene block={block}>
          <AbsoluteFill style={{filter: url ? `url(#${fid})` : undefined}}>{children}</AbsoluteFill>
        </PixelScene>
        <BayerWhite w={w} h={h} cell={cell} level={white} color={pp.color} />
      </AbsoluteFill>
    );
  }
  if (p < A) return <Hidden>{children}</Hidden>;
  if (p >= 1) return <Plain>{children}</Plain>;
  const q = seg(p, A + 0.04, 1);
  const block = 1 + Math.round(5 * (1 - q)) * u * 2.2;
  return (
    <AbsoluteFill>
      <PixelScene block={block} style={{transform: `scale(${1.08 - 0.08 * E.outCubic(q)})`}}>
        {children}
      </PixelScene>
      <BayerWhite w={w} h={h} cell={cell} level={1 - E.inOutQuad(q)} color={pp.color} />
    </AbsoluteFill>
  );
};

export const MosaicT: C = (props) => (props.passedProps.variant === 'swirl' ? <Swirl {...props} /> : <Mosaic {...props} />);

// ---------------------------------------------------------------------------------------------
// diagonal 'stepped' — x2 stepped-diagonal-wipe: a broad lime band with pixel-staircase edges
// sweeps across at ~30° (top leads), carrying the new scene behind it; faint smear on its lead edge.

export const SteppedDiagonal: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('sdg');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const ax = axisFor(pp.angle, w, h);
  const rowsMode = Math.abs(ax.dx) >= Math.abs(ax.dy);
  const n = Math.max(4, Math.round(pp.bands || 22));
  const cross = rowsMode ? h : w;
  const step = cross / n;
  const bw = (pp.size || 0.25) * (rowsMode ? w : h);
  const slack = (rowsMode ? Math.abs(ax.dy / ax.dx) : Math.abs(ax.dx / ax.dy)) * cross + step * 2;
  const along = rowsMode ? w : h;
  const dirSign = rowsMode ? Math.sign(ax.dx) : Math.sign(ax.dy);
  const prog = E.inOutCubic(p);
  // leading-edge position at the cross-axis centre, in the travel coordinate (0 = start side)
  const F = lerp(-slack / 2 - 2, along + bw + slack / 2 + 2, prog);
  // edge position (in the travel coordinate) for a row/column centre c
  const slope = rowsMode ? ax.dy / ax.dx : ax.dx / ax.dy;
  const edgeAt = (S: number, c: number) => S - dirSign * slope * (c - cross / 2);
  const toXY = (sAlong: number) => (dirSign > 0 ? sAlong : along - sAlong);
  const rectFor = (k: number, s0: number, s1: number, key: React.Key, fill: string, op = 1) => {
    const a = Math.min(toXY(s0), toXY(s1));
    const b = Math.max(toXY(s0), toXY(s1));
    const c0 = k * step;
    return rowsMode ? (
      <rect key={key} x={a} y={c0 - 0.3} width={Math.max(0, b - a)} height={step + 0.6} fill={fill} opacity={op} />
    ) : (
      <rect key={key} x={c0 - 0.3} y={a} width={step + 0.6} height={Math.max(0, b - a)} fill={fill} opacity={op} />
    );
  };
  const rows = Array.from({length: n}, (_, k) => {
    const c = (k + 0.5) * step;
    const f = edgeAt(F, c);
    return {k, f, t: f - bw};
  });
  const smear = 0.04 * along * Math.sin(Math.PI * prog);
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} mask={rows.map((r) => rectFor(r.k, -along, r.t, r.k, 'white'))}>
        {children}
      </Masked>
      <Overlay w={w} h={h}>
        {rows.map((r) => rectFor(r.k, r.t, r.f, `b${r.k}`, pp.color))}
        {smear > 1 && rows.map((r) => rectFor(r.k, r.f, r.f + smear * (0.4 + 0.6 * ((r.k * 7) % 5) / 4), `s${r.k}`, pp.color, 0.28))}
        {rows.map((r) => rectFor(r.k, r.t - 3 * u, r.t, `e${r.k}`, '#000', 0.12))}
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// bands 'line' — x2 line-open-wipe: a dot appears at (x, y), a thin line shoots out of it to both
// frame edges (easeOutExpo), then the line opens vertically into a band of the new scene with
// feathered, motion-blurred edges; the dot stays on top until the end.

export const LineOpen: C = ({children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('lno');
  const fid = useUid('lnof');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const cx = pp.x * w;
  const cy = pp.y * h;
  const A = 0.26;
  const lineK = 1 - Math.pow(2, -10 * seg(p, 0.04, A));
  const q = seg(p, A, 1);
  const e = E.inOutCubic(q);
  const half = lerp(1.5 * u, Math.max(cy, h - cy) + 30 * u, e);
  const speed = Math.abs(E.inOutCubic(Math.min(1, q + 0.02)) - E.inOutCubic(Math.max(0, q - 0.02))) / 0.04;
  const feather = Math.min(26 * u, 2 * u + (speed * Math.max(cy, h - cy)) / Math.max(1, D * (1 - A)) * 0.9);
  const dotR = 9 * u;
  const dotCol = pp.colors[0] ?? '#F6481E';
  const dotOp = 1 - sstep(0.86, 1, p);
  return (
    <AbsoluteFill>
      {q > 0 && (
        <Masked id={id} w={w} h={h} defs={<BlurFilter id={fid} sd={feather} w={w} h={h} />} mask={<rect x={-w} y={cy - half} width={3 * w} height={2 * half} fill="white" filter={`url(#${fid})`} />}>
          {children}
        </Masked>
      )}
      <Overlay w={w} h={h}>
        {lineK > 0 && (
          <>
            <rect x={cx - cx * lineK} y={cy - half - 1.5 * u} width={w * lineK} height={3 * u} fill={pp.color} opacity={1 - sstep(0.55, 0.85, p)} />
            {q > 0 && <rect x={0} y={cy + half - 1.5 * u} width={w} height={3 * u} fill={pp.color} opacity={1 - sstep(0.55, 0.85, p)} />}
          </>
        )}
        <circle cx={cx} cy={cy} r={dotR * (0.4 + 0.6 * E.outCubic(seg(p, 0, 0.08)))} fill={dotCol} opacity={dotOp} />
      </Overlay>
    </AbsoluteFill>
  );
};
