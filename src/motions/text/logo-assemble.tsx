import React, {useMemo} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {clamp, ease, prog} from '../../core/ease';
import {fonts, type FontRole} from '../../core/fonts';
import {rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {h01, lighten, mix, rgbaStr, useInkGrid} from '../../core/r2-pr3-kit';

/**
 * Logo assemble: the logo first appears as a wireframe of its triangle mesh (accent hairlines drawing on), then
 * faceted shards fly in from depth (or scatter) with a stagger, overshoot ~2 % and lock into place; a soft thud
 * (camera punch + shock ring) and a diagonal light sweep follow, then the tagline. Shards are a jittered triangle
 * mesh clipped to the logo ink (text via a coverage grid; or an image/SVG at `src`).
 */
type Props = {
  text: string;
  src: string;
  logoAspect: number;
  fontRole: FontRole;
  weight: number;
  tagline: string;
  color: string;
  accent: string;
  background: string;
  shardCount: number;
  origin: 'depth' | 'scatter';
  wireframe: boolean;
  sweep: boolean;
  seed: number;
};

type Shard = {pts: [number, number][]; g: [number, number]; rank: number; tint: number; rot: number; z: number; ox: number; oy: number};

const LogoAssemble: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const family = fonts[P.fontRole] ?? fonts.display;
  const ink = useInkGrid(P.src ? '' : P.text, family, P.weight);
  const centerY = cy - (P.tagline ? h * 0.04 : 0);

  const box = useMemo(() => {
    if (P.src) {
      const bh = Math.min(h * 0.42, (w * (portrait ? 0.7 : 0.4)) / P.logoAspect);
      const bw = bh * P.logoAspect;
      return {bx: cx - bw / 2, by: centerY - bh / 2, bw, bh, fs: 0, ox: 0, oy: 0};
    }
    if (!ink) return null;
    const iw = ink.x1 - ink.x0;
    const ihh = ink.y1 - ink.y0;
    const fs = Math.min((w * (portrait ? 0.8 : 0.54)) / iw, (h * 0.3) / ihh);
    const bw = iw * fs;
    const bh = ihh * fs;
    const bx = cx - bw / 2;
    const by = centerY - bh / 2;
    return {bx, by, bw, bh, fs, ox: bx - ink.x0 * fs, oy: by - ink.y0 * fs};
  }, [P.src, P.logoAspect, ink, w, h, cx, centerY, portrait]);

  const shards = useMemo<Shard[]>(() => {
    if (!box) return [];
    const r = rng(P.seed);
    const cov = P.src ? 1 : 0.5;
    let s = Math.sqrt((2 * box.bw * box.bh * cov) / Math.max(10, P.shardCount));
    s = Math.min(s, box.bh / 3);
    const cols = Math.max(2, Math.round(box.bw / s));
    const rows = Math.max(2, Math.round(box.bh / s));
    const cw = box.bw / cols;
    const ch = box.bh / rows;
    const P2: [number, number][][] = [];
    for (let j = 0; j <= rows; j++) {
      const row: [number, number][] = [];
      for (let i = 0; i <= cols; i++) {
        const jx = i === 0 || i === cols ? 0 : (r() - 0.5) * cw * 0.7;
        const jy = j === 0 || j === rows ? 0 : (r() - 0.5) * ch * 0.7;
        row.push([box.bx + i * cw + jx, box.by + j * ch + jy]);
      }
      P2.push(row);
    }
    const covered = (x: number, y: number) => P.src || (ink ? ink.has((x - box.ox) / box.fs, (y - box.oy) / box.fs) : true);
    const tris: [number, number][][] = [];
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const a = P2[j][i];
        const b = P2[j][i + 1];
        const c = P2[j + 1][i + 1];
        const d = P2[j + 1][i];
        if ((i + j) % 2 === 0) tris.push([a, b, c], [a, c, d]);
        else tris.push([a, b, d], [b, c, d]);
      }
    const keep = tris.filter((t) => {
      const gx = (t[0][0] + t[1][0] + t[2][0]) / 3;
      const gy = (t[0][1] + t[1][1] + t[2][1]) / 3;
      const samples: [number, number][] = [[gx, gy], ...t.map((p) => [p[0] * 0.6 + gx * 0.4, p[1] * 0.6 + gy * 0.4] as [number, number])];
      for (let k = 0; k < 3; k++) {
        const p = t[k];
        const q = t[(k + 1) % 3];
        samples.push([(p[0] + q[0]) / 2 * 0.7 + gx * 0.3, (p[1] + q[1]) / 2 * 0.7 + gy * 0.3]);
      }
      return samples.some(([x, y]) => covered(x, y));
    });
    const order = keep.map((_, i) => i).sort((a, b) => h01(a, P.seed) - h01(b, P.seed));
    const rankOf: number[] = [];
    order.forEach((idx, rank) => (rankOf[idx] = rank));
    return keep.map((t, i) => {
      const gx = (t[0][0] + t[1][0] + t[2][0]) / 3;
      const gy = (t[0][1] + t[1][1] + t[2][1]) / 3;
      const a = r() * Math.PI * 2;
      return {pts: t, g: [gx, gy] as [number, number], rank: rankOf[i], tint: (r() - 0.5) * 0.5, rot: (r() - 0.5) * 160, z: 1.8 + r() * 1.6, ox: Math.cos(a), oy: Math.sin(a)};
    });
  }, [box, ink, P.src, P.shardCount, P.seed]);

  if (!box) return <AbsoluteFill style={{background: P.background}} />;

  const n = shards.length;
  const flyStart = 26;
  const stagger = Math.min(1.6, 60 / Math.max(1, n));
  const flyDur = 28;
  const lockAt = flyStart + (n - 1) * stagger + flyDur;
  const uid = 'lasm';
  const thudT = frame - lockAt;
  const punch = thudT >= 0 ? Math.exp(-thudT / 5) * Math.sin(Math.min(1, thudT / 2) * Math.PI * 0.5) * 0.028 : 0;
  const glowIn = prog(frame, lockAt - 10, lockAt + 14, ease.out);
  const sweepT = prog(frame, lockAt + 4, lockAt + 26, ease.inOut);
  const sweep2 = prog(frame, lockAt + 86, lockAt + 108, ease.inOut);
  const wireA = P.wireframe ? prog(frame, 0, 8, ease.out) * (1 - prog(frame, flyStart + 10, flyStart + 50, ease.in)) : 0;
  const tagIn = prog(frame, lockAt + 6, lockAt + 30, ease.out);

  const glyph = (fill: string, key?: string) =>
    P.src ? (
      <Img key={key} src={resolveSrc(P.src)} style={{position: 'absolute'}} />
    ) : (
      <text key={key} x={box.ox} y={box.oy} fontFamily={family} fontWeight={P.weight} fontSize={box.fs} fill={fill}>
        {P.text}
      </text>
    );
  const glyphSvg = (fill: string, key?: string) =>
    P.src ? (
      <image key={key} href={resolveSrc(P.src)} x={box.bx} y={box.by} width={box.bw} height={box.bh} preserveAspectRatio="xMidYMid meet" />
    ) : (
      glyph(fill, key)
    );

  const shardEls = shards.map((s, i) => {
    const d0 = flyStart + s.rank * stagger;
    const p = prog(frame, d0, d0 + flyDur, ease.linear);
    if (frame < d0 - 1) return null;
    const q = 1 - Math.pow(1 - p, 3);
    const bump = Math.sin(clamp((p - 0.72) / 0.28) * Math.PI) * 0.02;
    const alpha = prog(p, 0, 0.3, ease.out);
    let tf: string;
    if (P.origin === 'depth') {
      const S = 1 + (s.z - 1) * (1 - q);
      tf = `translate(${cx} ${cy}) scale(${(S * (1 + bump)).toFixed(4)}) translate(${-cx} ${-cy}) rotate(${(s.rot * (1 - q)).toFixed(2)} ${s.g[0].toFixed(1)} ${s.g[1].toFixed(1)})`;
    } else {
      const R = Math.max(w, h) * 0.75 * (1 - q);
      tf = `translate(${(s.ox * R).toFixed(1)} ${(s.oy * R).toFixed(1)}) translate(${s.g[0].toFixed(1)} ${s.g[1].toFixed(1)}) scale(${((0.5 + 0.5 * q) * (1 + bump)).toFixed(4)}) rotate(${(s.rot * 2 * (1 - q)).toFixed(2)}) translate(${(-s.g[0]).toFixed(1)} ${(-s.g[1]).toFixed(1)})`;
    }
    const face = mix(lighten(P.color, s.tint * 0.6), P.accent, (1 - q) * 0.7);
    const pts = s.pts.map((pt) => `${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(' ');
    return (
      <g key={i} transform={tf} opacity={alpha}>
        <g clipPath={`url(#${uid}-c${i})`}>
          {glyphSvg(face)}
          {P.src && <polygon points={pts} fill={s.tint > 0 ? '#fff' : '#000'} opacity={Math.abs(s.tint) * 0.5} />}
          <polygon points={pts} fill="none" stroke={rgbaStr('#ffffff', 0.22)} strokeWidth={1.4 * u} />
        </g>
      </g>
    );
  });

  const wire = wireA > 0.01 && (
    <g opacity={wireA}>
      {shards.map((s, i) => {
        const dp = prog(frame, 2 + (s.rank / Math.max(1, n)) * 18, 20 + (s.rank / Math.max(1, n)) * 18, ease.out);
        const pts = s.pts.map((pt) => `${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(' ');
        const len = 600;
        return <polygon key={i} points={pts} fill={rgbaStr(P.accent, 0.05 * dp)} stroke={P.accent} strokeWidth={1.6 * u} strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - dp)} opacity={0.85} />;
      })}
    </g>
  );

  const bandW = box.bw * 0.16;
  const bandAt = (t: number) => box.bx - bandW * 2 + (box.bw + bandW * 4) * t;
  const tagFs = (portrait ? 30 : 30) * u;

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, ${mix(P.background, P.accent, 0.12)} 0%, ${P.background} 62%, ${mix(P.background, '#000000', 0.5)} 100%)`}}>
      <Svg>
        <defs>
          {shards.map((s, i) => (
            <clipPath key={i} id={`${uid}-c${i}`}>
              <polygon points={s.pts.map((pt) => `${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(' ')} />
            </clipPath>
          ))}
          <mask id={`${uid}-mask`}>
            {glyphSvg('#fff', 'm')}
          </mask>
          <linearGradient id={`${uid}-band`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`${uid}-glow`}>
            <stop offset="0" stopColor={P.accent} stopOpacity="0.5" />
            <stop offset="1" stopColor={P.accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform={`translate(${cx} ${cy}) scale(${1 + punch}) translate(${-cx} ${-cy})`}>
          <ellipse cx={cx} cy={centerY} rx={box.bw * 0.75} ry={box.bh * 1.4} fill={`url(#${uid}-glow)`} opacity={glowIn * 0.6 + (thudT >= 0 ? Math.exp(-thudT / 8) * 0.4 : 0)} />
          {wire}
          {shardEls}
          {P.sweep && frame >= lockAt && (
            <g mask={`url(#${uid}-mask)`}>
              {[sweepT, sweep2].map((t, k) =>
                t > 0 && t < 1 ? (
                  <rect key={k} x={bandAt(t) - bandW / 2} y={box.by - box.bh * 0.5} width={bandW} height={box.bh * 2} fill={`url(#${uid}-band)`} opacity={k === 0 ? 0.9 : 0.5} transform={`rotate(18 ${bandAt(t)} ${centerY})`} />
                ) : null,
              )}
            </g>
          )}
          {thudT >= 0 && thudT < 16 && <ellipse cx={cx} cy={centerY} rx={box.bw * (0.5 + thudT * 0.05)} ry={box.bh * (0.8 + thudT * 0.1)} fill="none" stroke={P.accent} strokeWidth={2 * u} opacity={(1 - thudT / 16) * 0.5} />}
        </g>
        {P.tagline && (
          <text x={cx} y={box.by + box.bh + (portrait ? 80 : 78) * u} textAnchor="middle" fontFamily={fonts.sans} fontWeight={600} fontSize={tagFs} letterSpacing={tagFs * 0.28} fill={rgbaStr(P.color, 0.72)} opacity={tagIn} transform={`translate(0 ${(1 - tagIn) * 10 * u})`}>
            {P.tagline}
          </text>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const logoAssemble = defineMotion<Props>({
  id: 'logo-assemble',
  title: 'Logo assemble (wireframe, shards lock in)',
  category: 'text',
  description:
    'The logo draws on as a triangle wireframe, then faceted shards fly in from depth (or scatter) with a stagger, overshoot about 2 % and lock into place; a soft thud (camera punch, glow and ring) and a diagonal light sweep follow, then a tracked tagline. Works from a word or from an image / SVG logo.',
  source: ['prompt-corpus research: logo-assemble (12 cases, ideas only; original implementation)'],
  useFor: 'Logo stings, brand intros and end cards; set text to the brand name or src to a logo file.',
  durationInFrames: 210,
  defaultProps: {
    text: 'Northwind',
    src: '',
    logoAspect: 1,
    fontRole: 'display',
    weight: 400,
    tagline: 'BUILT PIECE BY PIECE',
    color: '#F2F5FF',
    accent: '#5B8CFF',
    background: '#0B0F1C',
    shardCount: 90,
    origin: 'depth',
    wireframe: true,
    sweep: true,
    seed: 4,
  },
  propDocs: {
    text: 'brand name (used when src is empty)',
    src: 'public/ path or URL of a logo image / SVG (overrides text)',
    logoAspect: 'width / height of the src logo',
    fontRole: 'font role for the text logo: sans | display | grotesk | serif | mono',
    weight: 'font weight for the text logo',
    tagline: 'tracked line under the logo ("" = none)',
    color: 'logo colour',
    accent: 'wireframe / glow / in-flight tint colour',
    background: 'background colour',
    shardCount: 'approximate number of shards (40-200)',
    origin: "'depth' (fly from the camera side) | 'scatter' (fly in from all around)",
    wireframe: 'show the wireframe stage first',
    sweep: 'light sweep after the lock',
    seed: 'randomness seed',
  },
  component: LogoAssemble,
  tags: ['logo', 'reveal', 'sting', 'intro', 'brand', 'shards', 'triangles', 'low poly', 'wireframe', 'assemble', 'fly in', 'light sweep', 'end card', 'facets', 'text', 'overlay', 'thud'],
});
