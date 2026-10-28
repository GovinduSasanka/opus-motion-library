// Adapted from lemo-opuscar styles/visual-investigation/demo/index.html five-source section — badge(), wave(), schematic() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {n2, rng} from '../../core/random';
import {cl, eo3, lerp, seg, useUid} from '../../core/r2-lb3a-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Source = {
  kind: 'doc' | 'photo' | 'video' | 'audio' | 'quote';
  tag?: string;
  quote?: string;
  highlight?: number;
  ring?: [number, number, number];
  peaks?: number[];
};

type Props = {
  sources: Source[];
  target: {cols: number; rows: number; zone: {x: number; y: number; w: number; h: number}; label: string; numbers: boolean};
  layout: 'board5' | 'grid2x2' | 'row';
  title: string;
  tileAt: number;
  linkStart: number;
  badgeStart: number;
  accent: string;
  ground: string;
  text: string;
  seed: number;
};

type R = {x: number; y: number; w: number; h: number};

const EvidenceBoard: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const uid = useUid('evb');
  const n = Math.min(5, p.sources.length);
  const dim = '#8A9099';
  const tileBg = '#1D2127';
  const line = '#3A3F46';
  const mono = fonts.mono;

  /* layout */
  let schem: R;
  let slots: R[] = [];
  if (p.layout === 'row') {
    const tw = (w * 0.92 - (n - 1) * 16 * u) / n;
    const th = portrait ? h * 0.18 : h * 0.3;
    schem = {x: w * (portrait ? 0.08 : 0.2), y: h * 0.1 + th + 40 * u, w: w * (portrait ? 0.84 : 0.6), h: h * (portrait ? 0.4 : 0.42)};
    slots = Array.from({length: n}, (_, i) => ({x: w * 0.04 + i * (tw + 16 * u), y: h * 0.1, w: tw, h: th}));
  } else if (portrait) {
    schem = {x: w * 0.08, y: h * 0.1, w: w * 0.84, h: h * 0.27};
    const cw = (w * 0.84 - 16 * u) / 2;
    const ch = h * 0.19;
    slots = [
      {x: w * 0.08, y: h * 0.42, w: cw, h: ch}, {x: w * 0.08 + cw + 16 * u, y: h * 0.42, w: cw, h: ch},
      {x: w * 0.08, y: h * 0.42 + ch + 16 * u, w: cw, h: ch}, {x: w * 0.08 + cw + 16 * u, y: h * 0.42 + ch + 16 * u, w: cw, h: ch},
      {x: w * 0.08, y: h * 0.42 + (ch + 16 * u) * 2, w: w * 0.84, h: h * 0.1},
    ];
  } else {
    schem = {x: w * 0.31, y: h * 0.17, w: w * 0.38, h: h * 0.6};
    const cw = w * 0.235;
    const ch = h * 0.34;
    slots = [
      {x: w * 0.04, y: h * 0.14, w: cw, h: ch}, {x: w * 0.04, y: h * 0.14 + ch + 20 * u, w: cw, h: ch},
      {x: w * 0.96 - cw, y: h * 0.14, w: cw, h: ch}, {x: w * 0.96 - cw, y: h * 0.14 + ch + 20 * u, w: cw, h: ch},
      {x: w * 0.31, y: h * 0.82, w: w * 0.38, h: h * 0.13},
    ];
  }
  if (p.layout === 'grid2x2' && !portrait) slots = slots.slice(0, 4);

  const T = p.target;
  const cw = schem.w / T.cols;
  const chh = schem.h / T.rows;
  const zone = {x: schem.x + T.zone.x * cw, y: schem.y + T.zone.y * chh, w: T.zone.w * cw, h: T.zone.h * chh};
  const zc: [number, number] = [zone.x + zone.w / 2, zone.y + zone.h / 2];

  const tileF = (i: number) => p.tileAt + i * 9;
  const linkF = (i: number) => p.linkStart + i * 16;
  const linkD = 22;
  const firstArrive = linkF(0) + linkD;
  const zoneA = eo3(seg(frame, firstArrive, firstArrive + 14)) * (0.5 + 0.1 * Math.sin(frame * 0.1));
  const zoneColor = '#85291E';

  const wrap = (s: string, maxChars: number) => {
    const words = s.split(' ');
    const lines: string[] = [];
    let cur = '';
    words.forEach((wd) => {
      if ((cur + ' ' + wd).trim().length > maxChars) {
        lines.push(cur.trim());
        cur = wd;
      } else cur += ' ' + wd;
    });
    if (cur.trim()) lines.push(cur.trim());
    return lines;
  };

  const Tile: React.FC<{s: Source; r: R; i: number}> = ({s, r, i}) => {
    const tf = tileF(i);
    const k = seg(frame, tf, tf + 7);
    if (frame < tf) return null;
    const flash = 1 - seg(frame, tf, tf + 9);
    const sc = lerp(0.94, 1, eo3(k));
    const rnd = rng(p.seed * 13 + i);
    const pad = 12 * u;
    const tag = s.tag ?? s.kind.toUpperCase();
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const inner: R = {x: r.x + pad, y: r.y + pad + 20 * u, w: r.w - pad * 2, h: r.h - pad * 2 - 20 * u};
    let body: React.ReactNode = null;
    const ring = s.ring ?? [0.62, 0.5, 0.16];

    if (s.kind === 'doc') {
      const rows = Math.max(5, Math.floor(inner.h / (14 * u)));
      const hl = s.highlight ?? 3;
      body = (
        <g>
          <rect x={inner.x + inner.w * 0.08} y={inner.y - 2 * u} width={inner.w * 0.84} height={inner.h + 2 * u} fill="#ECE8DC" />
          {Array.from({length: rows}, (_, j) => {
            const y = inner.y + 10 * u + j * ((inner.h - 14 * u) / rows);
            const lw = inner.w * 0.84 * (0.55 + 0.4 * rnd());
            const on = j === hl;
            const hp = seg(frame, tf + 14, tf + 30);
            return (
              <g key={j}>
                {on && <rect x={inner.x + inner.w * 0.11} y={y - 4 * u} width={lw * hp} height={10 * u} fill="#FFD23F" opacity={0.85} />}
                <rect x={inner.x + inner.w * 0.11} y={y} width={lw - inner.w * 0.06} height={3.2 * u} rx={1.5 * u} fill={on ? '#2B2B2B' : '#7C7A72'} />
              </g>
            );
          })}
        </g>
      );
    } else if (s.kind === 'photo' || s.kind === 'video') {
      const dark = s.kind === 'video';
      const sky = dark ? ['#0E2A2E', '#1C4A4A'] : ['#9DB6C9', '#D8D2C2'];
      const gy = inner.y + inner.h * 0.62;
      body = (
        <g>
          <defs>
            <linearGradient id={`${uid}-ph${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky[0]} /><stop offset="1" stopColor={sky[1]} /></linearGradient>
            <clipPath id={`${uid}-pc${i}`}><rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} /></clipPath>
          </defs>
          <g clipPath={`url(#${uid}-pc${i})`}>
            <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} fill={`url(#${uid}-ph${i})`} />
            <rect x={inner.x} y={gy} width={inner.w} height={inner.y + inner.h - gy} fill={dark ? '#0A1A1C' : '#8D8A80'} />
            <rect x={inner.x + inner.w * 0.1} y={inner.y + inner.h * 0.18} width={inner.w * 0.3} height={gy - inner.y - inner.h * 0.18} fill={dark ? '#14383B' : '#B7AFA0'} />
            {Array.from({length: 12}, (_, j) => <rect key={j} x={inner.x + inner.w * (0.13 + (j % 4) * 0.065)} y={inner.y + inner.h * (0.24 + Math.floor(j / 4) * 0.12)} width={inner.w * 0.035} height={inner.h * 0.07} fill={dark ? '#4FB6A8' : '#6E7F8C'} opacity={0.7} />)}
            <rect x={inner.x + inner.w * 0.5} y={gy - inner.h * 0.14} width={inner.w * 0.3} height={inner.h * 0.14} rx={4 * u} fill={dark ? '#1F5C58' : '#C9C4B5'} />
            <circle cx={inner.x + inner.w * 0.56} cy={gy} r={inner.h * 0.045} fill="#111" />
            <circle cx={inner.x + inner.w * 0.74} cy={gy} r={inner.h * 0.045} fill="#111" />
            <rect x={inner.x + inner.w * 0.86} y={gy - inner.h * 0.2} width={inner.w * 0.03} height={inner.h * 0.2} fill="#111" opacity={0.6} />
            {dark && <rect x={inner.x} y={inner.y + ((frame * 1.4) % inner.h)} width={inner.w} height={2 * u} fill="#7FE8D8" opacity={0.12} />}
          </g>
          {dark && (
            <g stroke="#ECEAE4" strokeWidth={2 * u} fill="none">
              {[[0, 0, 1, 1], [1, 0, -1, 1], [0, 1, 1, -1], [1, 1, -1, -1]].map(([a, b, dx, dy], j) => (
                <path key={j} d={`M${inner.x + a * inner.w + dx * 14 * u} ${inner.y + b * inner.h + dy * 3 * u}H${inner.x + a * inner.w + dx * 3 * u}V${inner.y + b * inner.h + dy * 14 * u}`} />
              ))}
            </g>
          )}
          {(() => {
            const rx = inner.x + inner.w * ring[0];
            const ry = inner.y + inner.h * ring[1];
            const rr = Math.min(inner.w, inner.h) * ring[2] * (1 + 0.04 * Math.sin(frame * 0.2));
            const pr = seg(frame, tf + 14, tf + 30);
            return (
              <g opacity={pr}>
                <circle cx={rx} cy={ry} r={rr * (1.6 - 0.6 * pr)} fill="none" stroke={p.accent} strokeWidth={2.6 * u} />
                {dark && (
                  <g>
                    <line x1={rx + rr * 0.7} y1={ry + rr * 0.7} x2={rx + rr * 1.5} y2={ry + rr * 1.5} stroke={p.text} strokeWidth={3 * u} strokeLinecap="round" />
                    <circle cx={rx} cy={ry} r={rr * 0.6} fill="none" stroke={p.text} strokeWidth={1.2 * u} opacity={0.7} />
                  </g>
                )}
              </g>
            );
          })()}
          {dark && <text x={inner.x + 6 * u} y={inner.y + inner.h - 6 * u} fontFamily={mono} fontSize={11 * u} fill="#ECEAE4" opacity={0.85}>REC ● 14:02:{String(11 + Math.floor(frame / 30)).padStart(2, '0')}</text>}
        </g>
      );
    } else if (s.kind === 'audio') {
      const peaks = s.peaks && s.peaks.length ? s.peaks : Array.from({length: 54}, (_, j) => 0.25 + 0.75 * Math.abs(n2(`pk${p.seed}`, j * 0.4, 1)) * (0.6 + 0.4 * Math.sin(j * 0.23)));
      const wave = {x: inner.x, y: inner.y, w: inner.w * (r.w > r.h * 3 ? 0.55 : 1), h: inner.h * (r.w > r.h * 3 ? 1 : 0.55)};
      const play = cl((frame - tf - 10) / 140);
      const bw = wave.w / peaks.length;
      const q = s.quote ?? '“We moved the shipment before noon.”';
      body = (
        <g>
          {peaks.map((pk, j) => {
            const hh = Math.max(3 * u, pk * wave.h * 0.9);
            const played = j / peaks.length < play;
            return <rect key={j} x={wave.x + j * bw + bw * 0.2} y={wave.y + wave.h / 2 - hh / 2} width={bw * 0.6} height={hh} rx={bw * 0.3} fill={played ? '#ECEAE4' : '#4A4F57'} />;
          })}
          <rect x={wave.x + play * wave.w - 1 * u} y={wave.y + wave.h / 2 - wave.h / 2 - 6 * u} width={2 * u} height={wave.h + 12 * u} fill={p.accent} />
          {wrap(q, Math.max(14, Math.floor((r.w > r.h * 3 ? inner.w * 0.4 : inner.w) / (8.6 * u)))).slice(0, 3).map((ln, j) => (
            <text key={j} x={r.w > r.h * 3 ? inner.x + inner.w * 0.6 : inner.x} y={(r.w > r.h * 3 ? inner.y + inner.h * 0.3 : inner.y + inner.h * 0.72) + j * 16 * u} fontFamily={fonts.serif} fontSize={14 * u} fill={p.text}>{ln}</text>
          ))}
        </g>
      );
    } else {
      const q = s.quote ?? 'Findings are consistent with the stated cause.';
      body = (
        <g>
          <text x={inner.x} y={inner.y + 34 * u} fontFamily={fonts.serif} fontSize={54 * u} fill={p.accent} opacity={0.9}>“</text>
          {wrap(q, Math.max(12, Math.floor(inner.w / (9.2 * u)))).slice(0, 5).map((ln, j) => (
            <text key={j} x={inner.x + 4 * u} y={inner.y + 54 * u + j * 18 * u} fontFamily={fonts.serif} fontSize={15 * u} fill={p.text}>{ln}</text>
          ))}
        </g>
      );
    }
    return (
      <g transform={`translate(${cx} ${cy}) scale(${sc}) translate(${-cx} ${-cy})`} opacity={cl(k * 2)}>
        <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={tileBg} stroke={line} strokeWidth={1.4 * u} rx={3 * u} />
        <text x={r.x + pad} y={r.y + 20 * u} fontFamily={mono} fontSize={11.5 * u} letterSpacing={1.6 * u} fill={dim}>{tag.toUpperCase()}</text>
        {body}
        <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#fff" opacity={flash * 0.45} rx={3 * u} />
      </g>
    );
  };

  /* links */
  const linkPaths = slots.slice(0, n).map((r, i) => {
    const tcx = r.x + r.w / 2;
    const tcy = r.y + r.h / 2;
    // nearest edge midpoint toward the zone centre
    const dx = zc[0] - tcx;
    const dy = zc[1] - tcy;
    const horiz = Math.abs(dx) / (r.w / 2) > Math.abs(dy) / (r.h / 2);
    const a: [number, number] = horiz ? [dx > 0 ? r.x + r.w : r.x, tcy] : [tcx, dy > 0 ? r.y + r.h : r.y];
    const mid: [number, number] = horiz ? [lerp(a[0], zc[0], 0.55), a[1]] : [a[0], lerp(a[1], zc[1], 0.55)];
    const d = `M${a[0]} ${a[1]}Q${mid[0]} ${mid[1]} ${zc[0] + (i - 2) * 4 * u} ${zc[1] + (i % 2 ? 3 : -3) * u}`;
    return {d, a};
  });

  const badgeK = (i: number) => {
    const t0 = p.badgeStart + i * 4;
    const f = seg(frame, t0, t0 + 2);
    const s = frame < t0 ? 0 : lerp(1.3, 1, eo3(seg(frame, t0, t0 + 5.5)));
    return {o: f, s};
  };

  return (
    <AbsoluteFill style={{background: p.ground, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          {linkPaths.map((l, i) => (
            <mask key={i} id={`${uid}-lm${i}`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
              <path d={l.d} fill="none" stroke="#fff" strokeWidth={6 * u} pathLength={1000} strokeDasharray={1000} strokeDashoffset={1000 * (1 - eo3(seg(frame, linkF(i), linkF(i) + linkD)))} />
            </mask>
          ))}
        </defs>
        <text x={w * 0.04} y={h * 0.075} fontFamily={mono} fontSize={15 * u} letterSpacing={3 * u} fill={dim} opacity={seg(frame, 0, 12)}>{p.title.toUpperCase()}</text>
        {/* schematic */}
        <g opacity={seg(frame, 0, 14)}>
          <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} fill={zoneColor} opacity={zoneA / 0.5 * 0.5} />
          <g stroke={line} strokeWidth={1 * u}>
            {Array.from({length: T.cols - 1}, (_, i) => <line key={'c' + i} x1={schem.x + (i + 1) * cw} y1={schem.y} x2={schem.x + (i + 1) * cw} y2={schem.y + schem.h} />)}
            {Array.from({length: T.rows - 1}, (_, i) => <line key={'r' + i} x1={schem.x} y1={schem.y + (i + 1) * chh} x2={schem.x + schem.w} y2={schem.y + (i + 1) * chh} />)}
          </g>
          <rect x={schem.x} y={schem.y} width={schem.w} height={schem.h} fill="none" stroke={p.text} strokeWidth={1.6 * u} />
          {T.numbers &&
            Array.from({length: T.cols * T.rows}, (_, i) => {
              const cx2 = i % T.cols;
              const cy2 = Math.floor(i / T.cols);
              const inZ = cx2 >= T.zone.x && cx2 < T.zone.x + T.zone.w && cy2 >= T.zone.y && cy2 < T.zone.y + T.zone.h;
              return <text key={i} x={schem.x + cx2 * cw + 6 * u} y={schem.y + cy2 * chh + 14 * u} fontFamily={mono} fontSize={10.5 * u} fill={inZ ? p.text : '#5B616A'}>{String(i + 1).padStart(2, '0')}</text>;
            })}
          <g fill="none" stroke={p.text} strokeWidth={1.2 * u} opacity={0.6}>
            <path d={`M${schem.x + cw * 2} ${schem.y + schem.h}a${cw * 0.4} ${cw * 0.4} 0 0 1 ${cw * 0.4} ${-cw * 0.4}`} />
            <path d={`M${schem.x + schem.w} ${schem.y + chh * 1.5}a${cw * 0.4} ${cw * 0.4} 0 0 0 ${-cw * 0.4} ${cw * 0.4}`} />
          </g>
          <text x={schem.x} y={schem.y - 12 * u} fontFamily={mono} fontSize={12 * u} letterSpacing={2 * u} fill={dim}>{T.label.toUpperCase()}</text>
        </g>
        {/* links */}
        {linkPaths.map((l, i) => (
          <g key={i} mask={`url(#${uid}-lm${i})`}>
            <path d={l.d} fill="none" stroke={p.accent} strokeOpacity={0.85} strokeWidth={2 * u} strokeDasharray={`${5 * u} ${4 * u}`} strokeDashoffset={-frame * 0.5 * u} />
          </g>
        ))}
        {linkPaths.map((l, i) => frame > linkF(i) + linkD - 2 && <circle key={'d' + i} cx={zc[0]} cy={zc[1]} r={3 * u} fill={p.accent} opacity={0.8} />)}
        {slots.slice(0, n).map((r, i) => <Tile key={i} s={p.sources[i]} r={r} i={i} />)}
        {/* badges */}
        {slots.slice(0, n).map((r, i) => {
          const b = badgeK(i);
          if (b.o <= 0) return null;
          const bx = r.x + r.w - 20 * u;
          const by = r.y + 20 * u;
          return (
            <g key={'b' + i} transform={`translate(${bx} ${by}) scale(${b.s})`} opacity={b.o}>
              <rect x={-15 * u} y={-15 * u} width={30 * u} height={30 * u} fill={p.ground} fillOpacity={0.85} stroke={p.accent} strokeWidth={2 * u} />
              <path d={`M${-8 * u} 0L${-2 * u} ${7 * u}L${9 * u} ${-7 * u}`} fill="none" stroke={p.accent} strokeWidth={3 * u} strokeLinecap="square" />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const evidenceBoard = defineMotion<Props>({
  id: 'evidence-board',
  title: 'Evidence board',
  category: 'document',
  description:
    'Five evidence tiles cut in one by one with a flash — a document strip with a highlighted line, a freeze frame with corner brackets, ring and loupe, a photo with a ring, a waveform tile with a quote and a play-line, a report quote — then each sends a thin red dashed link to the same zone of a line-drawn schematic, the zone fills red, and ✓ badges land on each tile a beat apart.',
  source: ['lemo-opuscar styles/visual-investigation five-source section, badge(), wave(), schematic() (MIT, LemoLab)'],
  useFor: '"N sources agree" moments: fact-checks, incident reports, product teardowns ("reviews, benchmarks and the spec sheet all point to the battery"), investigative explainers, legal / compliance stories.',
  durationInFrames: 240,
  defaultProps: {
    sources: [
      {kind: 'doc', tag: 'REPORT · P.14', highlight: 3},
      {kind: 'video', tag: 'CAM 2 · FREEZE FRAME', ring: [0.58, 0.62, 0.17]},
      {kind: 'photo', tag: 'SITE PHOTO', ring: [0.3, 0.45, 0.16]},
      {kind: 'quote', tag: 'INSPECTOR NOTE', quote: 'Wear pattern is consistent with the stated failure point.'},
      {kind: 'audio', tag: 'CALL · 00:41', quote: '“We moved the shipment before noon.”'},
    ],
    target: {cols: 8, rows: 5, zone: {x: 5, y: 1, w: 2, h: 2}, label: 'Floor 2 · East wing', numbers: true},
    layout: 'board5', title: 'Five sources · one location', tileAt: 12, linkStart: 70, badgeStart: 176, accent: '#E5484D', ground: '#14171B', text: '#ECEAE4', seed: 3,
  },
  propDocs: {
    sources: 'up to 5 tiles: {kind: doc|photo|video|audio|quote, tag, quote, highlight (doc line), ring [x,y,r] fractions, peaks[]}',
    target: 'schematic: cols, rows, zone {x,y,w,h in cells}, label, numbers',
    layout: 'board5 (tiles around the schematic), grid2x2, or row',
    title: 'small caption top-left', tileAt: 'frame the first tile cuts in (others follow 9 frames apart)', linkStart: 'frame the first link starts drawing (16 frames apart)', badgeStart: 'frame the first ✓ badge lands (4 frames apart)',
    accent: 'link / ring / badge colour', ground: 'board background', text: 'main text / line colour', seed: 'waveform + document seed',
  },
  component: EvidenceBoard,
  tags: ['evidence', 'investigation', 'fact check', 'sources', 'links', 'badges', 'checkmark', 'schematic', 'floor plan', 'waveform', 'document', 'freeze frame', 'teardown', 'case file', 'verification'],
});
