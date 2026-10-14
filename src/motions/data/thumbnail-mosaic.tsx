import React from 'react';
import {AbsoluteFill, Img, spring, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {GradientMapFilter, resolveSrc} from '../../core/image-kit';
import {rng} from '../../core/random';
import {GlossySphere, Sparkle} from '../../core/shapes';
import {PaperTexture, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {DEMO_IMAGES, SceneContent, inBack, lin, outBack} from '../../core/ui-kit';

/**
 * Many thumbnails at once, three layouts:
 *  - disc  (video4 thumbnail-disc-collapse + staggered-pop-out): circular thumbnails in rings of 1/6/12/16/20 on a
 *    tilted (0.82) glowing yellow plate with dotted orbit rings and pink sparkles; a thick pink ring expands and
 *    breaks into dashes; the set goes blue duotone, then every thumb shrinks away (easeInBack, outer rings first,
 *    shadows lag a frame) until only the blue centre dot is left, which pings.
 *  - grid  (video2 mosaic-grid-finale): zoom out of one tile into a gapless wall of hundreds, shimmer, pop-out to a dot.
 *  - recap (video14 monitor-push-thumbnail-recap): desk monitor powers on, 23 thumbnails spring into a 5-column grid
 *    (2 f stagger, 0.3→1.08→1), camera pushes into the screen, then the grid pops out to a dot.
 */
type Props = {
  layout: 'disc' | 'grid' | 'recap';
  images: string[];
  procedural: number;
  seed: number;
  rings: number[];
  tilt: number;
  tileSize: number;
  background: string;
  plateColor: string;
  accent: string;
  dotColor: string;
  duotone: string[];
};

type Tile = {src?: string; seed: number; pos: string; zoom: number};

const useTiles = (n: number, images: string[], procedural: number, seed: number): Tile[] =>
  React.useMemo(() => {
    const r = rng(seed * 101 + 7);
    return Array.from({length: n}, (_, i) => {
      const useImg = images.length > 0 && r() >= procedural;
      return {
        src: useImg ? images[i % images.length] : undefined,
        seed: seed * 1000 + i,
        pos: `${Math.round(15 + 70 * r())}% ${Math.round(15 + 70 * r())}%`,
        zoom: i < images.length ? 1 : 1.2 + r() * 1.1,
      };
    });
  }, [n, images, procedural, seed]);

const TileFill: React.FC<{t: Tile; id: string; frame?: number}> = ({t, id, frame}) =>
  t.src ? (
    <Img src={resolveSrc(t.src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: t.pos, transform: `scale(${t.zoom})`, transformOrigin: t.pos}} />
  ) : (
    <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <SceneContent seed={t.seed} id={id} time={frame} />
    </svg>
  );

/** sonar ping from the final dot */
const DotPing: React.FC<{x: number; y: number; r: number; color: string; start: number; frame: number; u: number; id: string}> = ({x, y, r, color, start, frame, u, id}) => {
  const pop = frame < start ? 1 : 1 + 0.25 * Math.max(0, Math.sin(((frame - start) / 8) * Math.PI)) * (frame - start < 8 ? 1 : 0);
  return (
    <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}}>
      {[0, 1, 2].map((k) => {
        const l = frame - start - k * 5;
        if (l < 0 || l > 22) return null;
        const t = l / 22;
        return <circle key={k} cx={x} cy={y} r={r + (1 - (1 - t) * (1 - t)) * 260 * u} fill="none" stroke={color} strokeWidth={(10 * (1 - t) + 1.5) * u} opacity={1 - t} />;
      })}
      <GlossySphere cx={x} cy={y} r={r * pop} color={color} light="#ABCFFF" dark="#2B4681" id={id} />
    </svg>
  );
};

// ------------------------------------------------------------------------------------------------ disc
const Disc: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy} = useStage();
  const R = Math.min(w, h) * 0.475;
  const ry = p.tilt;
  const rings = p.rings.slice(1);
  const total = rings.reduce((a, b) => a + b, 0);
  const tiles = useTiles(total, p.images, p.procedural, p.seed);
  const items = React.useMemo(() => {
    const out: {x0: number; ring: number; ang: number; rad: number; size: number; idx: number; delay: number; outAt: number}[] = [];
    const r = rng(p.seed + 3);
    let idx = 0;
    rings.forEach((n, k) => {
      const rad = (R * 0.9 * (k + 1)) / rings.length;
      const spacing = (2 * Math.PI * rad) / n;
      const size = Math.min(spacing * 0.8, ((R * 0.9) / rings.length) * 0.86) * lerp(1, 0.78, k / Math.max(1, rings.length - 1));
      const off = r() * Math.PI * 2;
      for (let j = 0; j < n; j++) {
        out.push({x0: 0, ring: k, ang: off + (j / n) * Math.PI * 2, rad, size, idx, delay: 3 + k * 5 + j * 0.35, outAt: 128 + (0.6 * r() + 0.4 * (1 - k / Math.max(1, rings.length - 1))) * 11});
        idx++;
      }
    });
    return out;
  }, [R, rings.join(','), p.seed]);
  const glowFade = 1 - prog(frame, 108, 116, ease.linear);
  const duo = frame >= 117;
  const flash = frame >= 116 && frame < 120 ? 0.35 * (1 - (frame - 116) / 4) : 0;
  const plateOut = prog(frame, 120, 132, ease.inOut);
  const pinkT = lin(frame, 6, 20);
  const plateIn = prog(frame, 0, 8, ease.out);
  const sparkles = React.useMemo(() => {
    const r = rng(p.seed + 9);
    return Array.from({length: 18}, () => ({a: r() * Math.PI * 2, d: 0.55 + r() * 0.5, s: 6 + r() * 8, ph: r() * 6}));
  }, [p.seed]);
  const pos = (it: (typeof items)[number], f: number) => {
    const dir = it.ring % 2 ? -1 : 1;
    const a = it.ang + dir * f * 0.0035;
    return [cx + Math.cos(a) * it.rad, cy + Math.sin(a) * it.rad * ry] as const;
  };
  return (
    <AbsoluteFill style={{background: p.background}}>
      <PaperTexture opacity={0.35} />
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <GradientMapFilter id="tm-duo" colors={p.duotone} />
        </defs>
      </svg>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="tm-plate">
            <stop offset="0" stopColor={p.plateColor} stopOpacity={1} />
            <stop offset="0.8" stopColor={p.plateColor} stopOpacity={0.92} />
            <stop offset="1" stopColor={p.plateColor} stopOpacity={0.55} />
          </radialGradient>
          <radialGradient id="tm-glow">
            <stop offset="0.7" stopColor="#FFE9A0" stopOpacity={0.7} />
            <stop offset="1" stopColor="#FFE9A0" stopOpacity={0} />
          </radialGradient>
        </defs>
        <g opacity={plateIn * (1 - plateOut)} transform={`translate(${cx} ${cy}) scale(${lerp(0.94, 1, plateIn)}) translate(${-cx} ${-cy})`}>
          <ellipse cx={cx} cy={cy} rx={R * 1.12} ry={R * 1.12 * ry} fill="url(#tm-glow)" opacity={glowFade} />
          <ellipse cx={cx} cy={cy} rx={R} ry={R * ry} fill="url(#tm-plate)" />
          {rings.map((_, k) => {
            const rad = (R * 0.9 * (k + 1)) / rings.length + (R * 0.45) / rings.length;
            return <ellipse key={k} cx={cx} cy={cy} rx={rad} ry={rad * ry} fill="none" stroke="#C9922E" strokeWidth={2 * u} strokeDasharray={`${1.5 * u} ${7 * u}`} strokeLinecap="round" opacity={0.6} />;
          })}
          <ellipse cx={cx} cy={cy} rx={R * 0.98} ry={R * 0.98 * ry} fill="none" stroke="#C9922E" strokeWidth={1.5 * u} opacity={0.5} />
          {sparkles.map((s, i) => (
            <Sparkle key={i} x={cx + Math.cos(s.a) * R * s.d * 1.05} y={cy + Math.sin(s.a) * R * s.d * 1.05 * ry} size={s.s * u * (0.7 + 0.3 * Math.sin(frame * 0.2 + s.ph))} color={p.accent} opacity={0.85} />
          ))}
        </g>
        {pinkT > 0 && pinkT < 1 && (
          <ellipse
            cx={cx}
            cy={cy}
            rx={R * lerp(0.95, 1.15, ease.out(pinkT))}
            ry={R * lerp(0.95, 1.15, ease.out(pinkT)) * ry}
            fill="none"
            stroke={p.accent}
            strokeWidth={14 * u * (1 - 0.5 * pinkT)}
            strokeDasharray={pinkT > 0.35 ? `${lerp(400, 30, (pinkT - 0.35) / 0.65) * u} ${lerp(0, 40, (pinkT - 0.35) / 0.65) * u}` : undefined}
            opacity={1 - Math.max(0, pinkT - 0.6) / 0.4}
          />
        )}
        {pinkT >= 1 && frame < 108 && <ellipse cx={cx} cy={cy} rx={R * 1.02} ry={R * 1.02 * ry} fill="none" stroke={p.accent} strokeWidth={10 * u} opacity={0.9 * plateIn} />}
      </svg>
      {/* shadows (lag one frame on the way out) */}
      {items.map((it) => {
        const sIn = outBack(lin(frame, it.delay, it.delay + 6), 1.6);
        const sOut = 1 - inBack(lin(frame - 1, it.outAt, it.outAt + 4), 1.5);
        const s = Math.max(0, Math.min(sIn, sOut));
        if (s <= 0.001) return null;
        const [x, y] = pos(it, frame - 1);
        const d = it.size * s;
        return <div key={it.idx} style={{position: 'absolute', left: x - d / 2 + 12 * u, top: y - d / 2 + 18 * u, width: d, height: d, borderRadius: '50%', background: duo ? 'rgba(80,90,150,0.28)' : 'rgba(150,120,190,0.42)', filter: `blur(${6 * u}px)`}} />;
      })}
      <div style={{position: 'absolute', inset: 0, filter: duo ? 'url(#tm-duo)' : undefined}}>
        {items.map((it) => {
          const sIn = outBack(lin(frame, it.delay, it.delay + 6), 1.6);
          const sOut = 1 - inBack(lin(frame, it.outAt, it.outAt + 4), 1.5);
          const s = Math.max(0, Math.min(sIn, sOut));
          if (s <= 0.001) return null;
          const [x, y] = pos(it, frame);
          const d = it.size * s;
          return (
            <div key={it.idx} style={{position: 'absolute', left: x - d / 2, top: y - d / 2, width: d, height: d, borderRadius: '50%', overflow: 'hidden', boxShadow: `0 0 0 ${2 * u}px rgba(255,255,255,0.65)`}}>
              <TileFill t={tiles[it.idx]} id={`tmd${it.idx}`} />
            </div>
          );
        })}
      </div>
      <DotPing x={cx} y={cy} r={20 * u} color={p.dotColor} start={146} frame={frame} u={u} id="tm-dot" />
      {flash > 0 && <AbsoluteFill style={{background: '#fff', opacity: flash}} />}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ grid
const Grid: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy} = useStage();
  const T = p.tileSize * u;
  const cols = Math.ceil(w / T) + (Math.ceil(w / T) % 2 === 0 ? 1 : 0);
  const rows = Math.ceil(h / T) + (Math.ceil(h / T) % 2 === 0 ? 1 : 0);
  const n = cols * rows;
  const tiles = useTiles(n, p.images, p.procedural, p.seed);
  const ox = cx - (cols * T) / 2;
  const oy = cy - (rows * T) / 2;
  const centre = Math.floor(rows / 2) * cols + Math.floor(cols / 2);
  // hero tile = first image, so the zoom starts on a real picture
  const tileAt = (i: number) => (i === centre && p.images.length ? {...tiles[i], src: p.images[0], zoom: 1, pos: '50% 50%'} : tiles[i]);
  const outs = React.useMemo(() => {
    const r = rng(p.seed + 21);
    return Array.from({length: n}, (_, i) => {
      const c = i % cols;
      const rr = Math.floor(i / cols);
      const dist = Math.hypot(c - (cols - 1) / 2, (rr - (rows - 1) / 2) * 1.2) / Math.hypot(cols / 2, rows / 2);
      return 126 + (0.55 * r() + 0.45 * (1 - dist)) * 26;
    });
  }, [n, cols, rows, p.seed]);
  // zoom out from the centre tile (log-space)
  const S0 = Math.max(w, h) / T * 1.02;
  const zt = prog(frame, 4, 52, ease.inOut);
  const zoom = Math.exp(Math.log(S0) * (1 - zt));
  const lastIn = 158;
  const centreOut = 1 - inBack(lin(frame, lastIn, lastIn + 6), 1.4);
  return (
    <AbsoluteFill style={{background: p.background}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: `${cx}px ${cy}px`}}>
        {Array.from({length: n}, (_, i) => {
          const isC = i === centre;
          const s = isC ? centreOut : 1 - inBack(lin(frame, outs[i], outs[i] + 4), 1.5);
          if (s <= 0.001) return null;
          const c = i % cols;
          const r = Math.floor(i / cols);
          const tw = 1 + 0.06 * Math.sin(frame * 0.5 + i * 1.7) * (frame % 2 ? 1 : 0.4);
          const d = T * s;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: ox + c * T + (T - d) / 2,
                top: oy + r * T + (T - d) / 2,
                width: d,
                height: d,
                overflow: 'hidden',
                borderRadius: s < 1 ? `${(1 - s) * 50}%` : 0,
                filter: `brightness(${tw})`,
              }}
            >
              <TileFill t={tileAt(i)} id={`tmg${i}`} />
            </div>
          );
        })}
      </div>
      {frame >= lastIn + 3 && <DotPing x={cx} y={cy} r={20 * u} color={p.dotColor} start={lastIn + 5} frame={frame} u={u} id="tm-gdot" />}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ recap
const Recap: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, fps, portrait} = useStage();
  const N = 23;
  const COLS = 5;
  const tiles = useTiles(N, p.images, p.procedural * 0.6, p.seed);
  const sw = portrait ? 740 * u : 820 * u;
  const sh = sw * 0.6;
  const scx = cx;
  const scy = portrait ? cy - 60 * u : cy - 40 * u;
  const bez = 22 * u;
  // camera
  const push1 = 1 + 0.15 * prog(frame, 0, 18, ease.inOut);
  const fill = Math.min(w / (sw + 2 * bez), h / (sh + 2 * bez)) * 1.04;
  const push2 = Math.exp(Math.log(fill / 1.15) * prog(frame, 84, 116, ease.inOut));
  const cam = push1 * push2;
  // power on
  const pw = lin(frame, 16, 23);
  const seq = ['#1b1d38', '#5a5c6e', '#9a9aa2', '#cfcdca', '#ebe7e2', '#fdf9f0', '#ffffff'];
  const scr = seq[Math.min(seq.length - 1, Math.floor(pw * (seq.length - 1)))];
  const g0 = 26;
  const rowsN = Math.ceil(N / COLS);
  const pad = 26 * u;
  const cw = (sw - pad * 2) / COLS;
  const ch = (sh - pad * 2) / rowsN;
  const outStart = 140;
  const outs = React.useMemo(() => {
    const r = rng(p.seed + 5);
    return Array.from({length: N}, () => outStart + r() * 12);
  }, [p.seed]);
  const dotIn = frame >= outStart + 14;
  return (
    <AbsoluteFill style={{background: p.background}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${cam})`, transformOrigin: `${scx}px ${scy}px`}}>
        <PaperTexture opacity={0.25} />
        {/* speckled pink circle */}
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <circle cx={scx} cy={scy - 20 * u} r={sw * 0.62} fill="#F6D2CB" />
          {Array.from({length: 260}, (_, i) => {
            const a = (i * 2.399) % (Math.PI * 2);
            const d = Math.sqrt(((i * 0.618) % 1)) * sw * 0.6;
            return <circle key={i} cx={scx + Math.cos(a) * d} cy={scy - 20 * u + Math.sin(a) * d} r={(1 + (i % 3)) * u} fill={i % 4 ? '#E9A99C' : '#ffffff'} opacity={0.7} />;
          })}
          {/* desk */}
          <rect x={scx - sw * 0.85} y={scy + sh / 2 + 120 * u} width={sw * 1.7} height={16 * u} rx={8 * u} fill="#E8B67A" />
          <rect x={scx - sw * 0.75} y={scy + sh / 2 + 136 * u} width={14 * u} height={180 * u} fill="#C9935A" />
          <rect x={scx + sw * 0.75 - 14 * u} y={scy + sh / 2 + 136 * u} width={14 * u} height={180 * u} fill="#C9935A" />
          {/* stand */}
          <rect x={scx - 22 * u} y={scy + sh / 2 + bez} width={44 * u} height={100 * u} fill="#3a3d55" />
          <rect x={scx - 110 * u} y={scy + sh / 2 + 108 * u} width={220 * u} height={14 * u} rx={7 * u} fill="#3a3d55" />
          {/* plant */}
          <path d={`M${scx - sw * 0.62} ${scy + sh / 2 + 120 * u} l${-8 * u} ${-70 * u} h${76 * u} l${-8 * u} ${70 * u} Z`} fill="#E07A5F" />
          {[-50, -20, 10, 35, 60].map((a, k) => (
            <ellipse key={k} cx={scx - sw * 0.62 + 30 * u + Math.sin((a * Math.PI) / 180) * 70 * u} cy={scy + sh / 2 + 40 * u - Math.cos((a * Math.PI) / 180) * 80 * u} rx={22 * u} ry={46 * u} transform={`rotate(${a} ${scx - sw * 0.62 + 30 * u + Math.sin((a * Math.PI) / 180) * 70 * u} ${scy + sh / 2 + 40 * u - Math.cos((a * Math.PI) / 180) * 80 * u})`} fill={k % 2 ? '#3E9A6B' : '#56B07E'} />
          ))}
          {/* mug */}
          <rect x={scx + sw * 0.52} y={scy + sh / 2 + 60 * u} width={56 * u} height={62 * u} rx={8 * u} fill="#E0574F" />
          <path d={`M${scx + sw * 0.52 + 56 * u} ${scy + sh / 2 + 74 * u} q${24 * u} ${4 * u} ${0} ${30 * u}`} fill="none" stroke="#E0574F" strokeWidth={8 * u} />
          {/* bezel + screen */}
          <rect x={scx - sw / 2 - bez} y={scy - sh / 2 - bez} width={sw + 2 * bez} height={sh + 2 * bez} rx={18 * u} fill="#2B2D42" />
          <rect x={scx - sw / 2} y={scy - sh / 2} width={sw} height={sh} rx={4 * u} fill={scr} />
          {frame >= 16 && frame < 26 &&
            [0, 1, 2].map((k) => (
              <line key={k} x1={scx + sw / 2 + bez + 10 * u} y1={scy - sh / 2 - 10 * u + k * 16 * u} x2={scx + sw / 2 + bez + 34 * u} y2={scy - sh / 2 - 26 * u + k * 22 * u} stroke="#F2C230" strokeWidth={5 * u} strokeLinecap="round" />
            ))}
        </svg>
        {Array.from({length: N}, (_, i) => {
          const sp = spring({frame: frame - (g0 + i * 2), fps, config: {stiffness: 300, damping: 18}});
          const so = 1 - inBack(lin(frame, outs[i], outs[i] + 4), 1.5);
          const s = (frame < g0 + i * 2 ? 0 : 0.3 + 0.7 * sp) * so;
          if (s <= 0.001) return null;
          const c = i % COLS;
          const r = Math.floor(i / COLS);
          const x = scx - sw / 2 + pad + c * cw + cw / 2;
          const y = scy - sh / 2 + pad + r * ch + ch / 2;
          const tw = cw - 8 * u;
          const th = ch - 8 * u;
          return (
            <div key={i} style={{position: 'absolute', left: x - tw / 2, top: y - th / 2, width: tw, height: th, transform: `scale(${s})`, overflow: 'hidden', border: `${2 * u}px solid #2B2D42`, borderRadius: 3 * u}}>
              <TileFill t={tiles[i]} id={`tmr${i}`} />
            </div>
          );
        })}
      </div>
      {dotIn && <DotPing x={cx} y={scy + (cy - scy) * 0} r={20 * u} color={p.dotColor} start={outStart + 16} frame={frame} u={u} id="tm-rdot" />}
    </AbsoluteFill>
  );
};

const ThumbnailMosaic: React.FC<Props> = (p) => (p.layout === 'grid' ? <Grid {...p} /> : p.layout === 'recap' ? <Recap {...p} /> : <Disc {...p} />);

export const thumbnailMosaic = defineMotion<Props>({
  id: 'thumbnail-mosaic',
  title: 'Thumbnail mosaic (disc / grid / recap)',
  category: 'data',
  description: 'Dozens of thumbnails as a tilted glowing disc of rings, a gapless wall you zoom out into, or a recap grid springing onto a monitor; all end in a staggered pop-out to a single dot.',
  source: ['video4 16:00-17:75 thumbnail-disc-collapse + staggered-pop-out', 'video2 mosaic-grid-finale', 'video14 121-127 monitor-push-thumbnail-recap'],
  useFor: '"…and hundreds more" endings, recaps of everything shown, portfolio walls, collapsing many items into one idea.',
  durationInFrames: 180,
  defaultProps: {
    layout: 'disc',
    images: DEMO_IMAGES,
    procedural: 0.45,
    seed: 4,
    rings: [1, 6, 12, 16, 20],
    tilt: 0.82,
    tileSize: 72,
    background: '#ECE4D7',
    plateColor: '#F4D76E',
    accent: '#E546AA',
    dotColor: '#3780E7',
    duotone: ['#1F4FA0', '#E8EEF8'],
  },
  propDocs: {
    layout: "'disc' (video4 ring disc), 'grid' (video2 mosaic wall), 'recap' (video14 monitor grid)",
    images: 'public/ image paths cycled through the thumbnails (empty = all procedural scenes)',
    procedural: '0..1 share of thumbnails drawn as procedural mini scenes instead of images',
    rings: 'disc: items per ring, first = centre dot',
    tilt: 'disc: vertical squash of the plate (0.82 = slight tilt)',
    tileSize: 'grid: tile size in px at 1080p',
    plateColor: 'disc plate colour',
    accent: 'disc pink ring / sparkle colour',
    dotColor: 'final centre dot colour',
    duotone: 'disc: [shadow, highlight] of the duotone recolour before the pop-out',
  },
  component: ThumbnailMosaic,
  tags: ['thumbnails', 'mosaic', 'grid', 'recap', 'collage', 'pop-out'],
});
