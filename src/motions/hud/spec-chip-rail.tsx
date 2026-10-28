// Adapted from lemo-opuscar/styles/hologram-hud/demo/engine/hud.js (rollText, chip, spec card) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  buildDrone,
  cl,
  eio3,
  eo3,
  HoloCam,
  HoloChrome,
  HoloGlowDef,
  HoloPad,
  holoPaths,
  HoloPlate,
  HoloStage,
  holoTheme,
  HoloWire,
  lerp,
  lf,
  rollText,
  seg,
} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Item = {label: string; value: string; unit: string; detail: string; part?: string};
type Props = {
  title: string;
  subtitle: string;
  items: Item[];
  start: number;
  every: number;
  lockup: {label1: string; value1: string; unit1: string; label2: string; value2: string; unit2: string; cta: string};
  showModel: boolean;
  background: string;
  hue: number;
  accent: number;
};

type R = {x: number; y: number; w: number; h: number};
const lerpR = (a: R, b: R, t: number): R => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t)});

const SpecChipRail: React.FC<Props> = ({title, subtitle, items, start, every, lockup, showModel, background, hue, accent}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames: D} = useStage();
  const th = holoTheme(hue, accent);
  const clear = background === 'transparent';
  const n = items.length;

  // ---------------- layout
  const m = 0.05 * Math.min(w, h) + 40 * u;
  const chipH = 108 * u;
  const gap = 14 * u;
  let rail: R;
  let card: R;
  let model: {cx: number; cy: number; f: number};
  let titleBox: {x: number; y: number; size: number};
  if (portrait) {
    titleBox = {x: m, y: 0.07 * h, size: 150 * u};
    model = {cx: w / 2, cy: 0.33 * h, f: w * 1.2};
    card = {x: m, y: 0.47 * h, w: w - 2 * m, h: 300 * u};
    rail = {x: m, y: 0.47 * h + 322 * u, w: w - 2 * m, h: chipH};
  } else {
    const railW = Math.max(0.25 * w, 450 * u);
    const cardW = Math.max(0.26 * w, 430 * u);
    titleBox = {x: m, y: 0.09 * h, size: 150 * u};
    rail = {x: m, y: 0.4 * h, w: railW, h: chipH};
    card = {x: w - m - cardW, y: 0.36 * h, w: cardW, h: 280 * u};
    model = {cx: (rail.x + rail.w + card.x) / 2 + 20 * u, cy: 0.55 * h, f: Math.min(w, h) * (w / h > 1.4 ? 1.08 : 0.8)};
  }
  const slot = (i: number): R => ({x: rail.x, y: rail.y + i * (chipH + gap), w: rail.w, h: chipH});

  // ---------------- timing per item: appear, roll, lock, hold, dock
  const T = items.map((_, i) => {
    const a = start + i * every;
    return {appear: a, roll0: a + 8, roll1: a + 8 + 24, dock0: a + every - 16, dock1: a + every - 2};
  });
  const lockT = start + n * every + 4;

  // ---------------- model
  const yaw = -0.6 + frame * 0.006;
  const cam: HoloCam = {yaw, pitch: 0.4, dist: 6.4, f: model.f, cx: model.cx, cy: model.cy};
  const cur = T.findIndex((t) => frame >= t.appear && frame < t.dock1);
  const hotPart = cur >= 0 && items[cur].part && frame >= T[cur].roll1 && frame < T[cur].dock0 ? [items[cur].part!] : [];
  const parts = showModel ? buildDrone(frame * 0.9) : [];
  const scan = lerp(-0.7, 0.9, eo3(seg(frame, 0, 30)));
  const paths = showModel ? holoPaths(parts, {cam, scanY: frame < 30 ? scan : Infinity, hotParts: hotPart}) : null;

  const titleIn = eo3(seg(frame, 2, 22));
  const fsLabel = 24 * u;
  const fsMono = 19 * u;

  const renderPlate = (it: Item, i: number, r: R, t: number, kRoll: number, locked: boolean, flash: boolean, op: number) => {
    // t = 0 big card, 1 docked chip
    const big = 1 - cl(t * 2.2);
    const chip = cl((t - 0.45) * 2.2);
    const val = rollText(it.value, kRoll, frame, i * 7 + 3);
    const valCol = flash ? '#ffffff' : locked ? th.accent : th.line;
    const idx = String(i + 1).padStart(2, '0');
    const pad = 22 * u;
    return (
      <div key={i} style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, opacity: op}}>
        <svg width={r.w + 2} height={r.h + 2} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <HoloPlate x={0} y={0} w={r.w} h={r.h} theme={th} u={u} />
          <rect x={pad} y={10 * u} width={22 * u} height={3 * u} fill={th.line} opacity={0.8} />
        </svg>
        {/* big card content */}
        {big > 0.01 && (
          <div style={{position: 'absolute', left: pad, top: pad, right: pad, opacity: big}}>
            <div style={{fontFamily: lf.techMono, fontSize: fsMono, color: th.dim, letterSpacing: 2 * u}}>SPEC {idx} / {String(n).padStart(2, '0')}</div>
            <div style={{fontFamily: lf.rajdhani, fontWeight: 600, fontSize: fsLabel * 1.15, color: th.line, letterSpacing: 3 * u, marginTop: 8 * u, whiteSpace: 'nowrap'}}>{it.label.toUpperCase()}</div>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 10 * u, marginTop: 2 * u}}>
              <span style={{fontFamily: lf.rajdhani, fontWeight: 300, fontSize: 112 * u, lineHeight: 1, color: valCol, fontVariantNumeric: 'tabular-nums'}}>{val}</span>
              <span style={{fontFamily: lf.rajdhani, fontWeight: 500, fontSize: 34 * u, color: locked ? th.accent : th.dim}}>{it.unit}</span>
            </div>
            <div style={{height: 3 * u, background: 'rgba(255,255,255,0.08)', marginTop: 12 * u}}>
              <div style={{height: '100%', width: `${kRoll * 100}%`, background: locked ? th.accent : th.line}} />
            </div>
            <div style={{fontFamily: lf.rajdhani, fontWeight: 500, fontSize: 25 * u, color: '#c9d6d8', marginTop: 12 * u, opacity: locked ? 1 : 0.4, whiteSpace: 'nowrap'}}>{it.detail}</div>
          </div>
        )}
        {/* chip content */}
        {chip > 0.01 && (
          <div style={{position: 'absolute', left: pad, right: pad, top: 0, bottom: 0, opacity: chip, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
            <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 * u}}>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 16 * u, minWidth: 0}}>
                <span style={{fontFamily: lf.techMono, fontSize: fsMono, color: th.dim}}>{idx}</span>
                <span style={{fontFamily: lf.rajdhani, fontWeight: 600, fontSize: fsLabel, color: th.line, letterSpacing: 3 * u, whiteSpace: 'nowrap', overflow: 'hidden'}}>{it.label.toUpperCase()}</span>
              </div>
              <span style={{whiteSpace: 'nowrap'}}>
                <span style={{fontFamily: lf.rajdhani, fontWeight: 300, fontSize: 46 * u, color: th.accent}}>{it.value}</span>
                <span style={{fontFamily: lf.rajdhani, fontWeight: 500, fontSize: 21 * u, color: th.accent, marginLeft: 6 * u}}>{it.unit}</span>
              </span>
            </div>
            <div style={{fontFamily: lf.rajdhani, fontWeight: 500, fontSize: 21 * u, color: '#b9c7c9', marginLeft: 36 * u, marginTop: 2 * u, whiteSpace: 'nowrap', overflow: 'hidden'}}>{it.detail}</div>
          </div>
        )}
      </div>
    );
  };

  // ---------------- leader from the part to the open card
  let leader: React.ReactNode = null;
  if (paths && cur >= 0 && items[cur].part && !portrait) {
    const b = paths.bbox[items[cur].part!];
    const t = T[cur];
    const k = eo3(seg(frame, t.appear + 4, t.appear + 19)) * (1 - seg(frame, t.dock0 - 6, t.dock0));
    if (b && isFinite(b[0]) && k > 0) {
      const ax = (b[0] + b[2]) / 2;
      const ay = (b[1] + b[3]) / 2;
      const ex = card.x - 8 * u;
      const ey = card.y + 40 * u;
      const mx = lerp(ax, ex - 60 * u, 0.5);
      const pts: [number, number][] = [
        [ax, ay],
        [mx, ey],
        [ex, ey],
      ];
      const len = Math.hypot(mx - ax, ey - ay) + Math.abs(ex - mx);
      leader = (
        <g opacity={k}>
          <circle cx={ax} cy={ay} r={10 * u} fill="none" stroke={th.line} strokeWidth={1.6 * u} />
          <path d={`M${pts.map((p) => p.join(' ')).join('L')}`} fill="none" stroke={th.line} strokeWidth={1.4 * u} strokeDasharray={len} strokeDashoffset={len * (1 - k)} />
        </g>
      );
    }
  }

  // ---------------- final lockup
  const lk = eo3(seg(frame, lockT, lockT + 14));
  const lkRoll = seg(frame, lockT + 4, lockT + 30);
  const lockR: R = portrait ? {x: m, y: card.y, w: card.w, h: 300 * u} : {x: card.x, y: card.y, w: card.w, h: 0.42 * h};
  const out = 1 - seg(frame, D - 8, D);

  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background, overflow: 'hidden', opacity: out}}>
      {!clear && <HoloStage theme={th} w={w} h={h} u={u} px={frame * 0.4} id="scr-dots" />}
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <HoloGlowDef id="scr-glow" u={u} />
        </defs>
        {paths && (
          <g opacity={0.85}>
            <HoloPad cam={cam} y={-0.45} r={2.1} theme={th} u={u} rot={frame * 0.004} />
            <HoloWire paths={paths} theme={th} u={u} glowId="scr-glow" />
          </g>
        )}
        {leader}
      </svg>
      {/* title block */}
      <div style={{position: 'absolute', left: titleBox.x, top: titleBox.y, opacity: titleIn, transform: `translateY(${(1 - titleIn) * 14 * u}px)`}}>
        <div style={{fontFamily: lf.rajdhani, fontWeight: 300, fontSize: titleBox.size, lineHeight: 0.95, color: '#d8e6e8', letterSpacing: 22 * u}}>{title}</div>
        <div style={{width: Math.min(560 * u, w - 2 * m), height: 2 * u, background: th.line, opacity: 0.6, margin: `${16 * u}px 0 ${14 * u}px`}} />
        <div style={{fontFamily: lf.techMono, fontSize: 24 * u, color: th.line, letterSpacing: 4 * u}}>{subtitle}</div>
      </div>
      {/* chips / cards */}
      {items.map((it, i) => {
        const t = T[i];
        if (frame < t.appear) return null;
        const appear = eo3(seg(frame, t.appear, t.appear + 8));
        const dk = eio3(seg(frame, t.dock0, t.dock1));
        const kRoll = seg(frame, t.roll0, t.roll1);
        const locked = frame >= t.roll1;
        const flash = frame === t.roll1;
        // portrait: earlier chips scroll so the newest docks under the card area
        const r = lerpR(card, slot(i), dk);
        const scaleIn = lerp(0.92, 1, appear);
        const rr: R = dk > 0 ? r : {x: r.x + (r.w * (1 - scaleIn)) / 2, y: r.y + (r.h * (1 - scaleIn)) / 2, w: r.w * scaleIn, h: r.h * scaleIn};
        // hide big card while lockup takes the card area in portrait
        return renderPlate(it, i, rr, dk, kRoll, locked, flash, appear);
      })}
      {/* lockup: weight / price block + CTA */}
      {lk > 0 && (
        <div style={{position: 'absolute', left: lockR.x, top: lockR.y, width: lockR.w, opacity: lk, transform: `translateX(${(1 - lk) * 30 * u}px)`}}>
          <svg width={lockR.w} height={lockR.h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <HoloPlate x={0} y={0} w={lockR.w} h={lockR.h} theme={th} u={u} />
          </svg>
          <div style={{position: 'relative', padding: 24 * u, display: 'flex', flexDirection: portrait ? 'row' : 'column', gap: 18 * u, justifyContent: 'space-between'}}>
            {[
              [lockup.label1, lockup.value1, lockup.unit1],
              [lockup.label2, lockup.value2, lockup.unit2],
            ].map(([lb, v, un], j) => (
              <div key={j}>
                <div style={{fontFamily: lf.rajdhani, fontWeight: 600, fontSize: 24 * u, color: th.line, letterSpacing: 3 * u}}>{lb.toUpperCase()}</div>
                <div style={{whiteSpace: 'nowrap'}}>
                  <span style={{fontFamily: lf.rajdhani, fontWeight: 300, fontSize: (portrait ? 84 : 104) * u, lineHeight: 1.05, color: th.accent}}>{rollText(v, cl(lkRoll * 1.3 - j * 0.3), frame, 40 + j)}</span>
                  <span style={{fontFamily: lf.rajdhani, fontWeight: 500, fontSize: 30 * u, color: th.accent, marginLeft: 8 * u}}>{un}</span>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              position: 'relative',
              margin: `0 ${24 * u}px`,
              border: `${1.5 * u}px solid ${th.accent}`,
              padding: `${12 * u}px ${16 * u}px`,
              fontFamily: lf.rajdhani,
              fontWeight: 700,
              fontSize: 21 * u,
              letterSpacing: 3 * u,
              color: th.accent,
              opacity: seg(frame, lockT + 20, lockT + 30),
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            {lockup.cta.toUpperCase()}
          </div>
        </div>
      )}
      {!clear && <HoloChrome w={w} h={h} u={u} theme={th} tl={`${title} // SPEC SHEET`} tr={frame >= lockT ? 'READY' : `SPEC ${String(Math.max(1, cur + 1)).padStart(2, '0')}`} bl={`HOLO.${String(792 + frame).padStart(4, '0')}`} br={`${(yaw * 57.3).toFixed(1)}°`} on={cl(frame / 12)} />}
    </AbsoluteFill>
  );
};

export const specChipRail = defineMotion<Props>({
  id: 'spec-chip-rail',
  title: 'Spec chip rail',
  category: 'hud',
  description:
    'Hologram spec sheet: each value rolls from garbage glyphs into the real number on a big card (locks right-to-left, turns amber with a 1-frame flash), then the card shrinks into a compact chip that slides into a side rail and stays; chips accumulate, then a weight/price block and CTA box lock up. A cyan drone wireframe turns on a projector pad behind.',
  source: ['lemo-opuscar styles/hologram-hud (MIT, LemoLab) — hud.js chip/rollText, DEMO.md structure, poster'],
  useFor: 'Spec sheets, feature checklists, pricing summaries — keeps every fact on screen long enough to read.',
  durationInFrames: 330,
  defaultProps: {
    title: 'LUMEN',
    subtitle: 'D1 · COMPACT DRONE',
    items: [
      {label: 'Flight time', value: '42', unit: 'min', detail: '5,200 mAh · swappable pack', part: 'battery'},
      {label: 'Gimbal camera', value: '4.8', unit: 'K', detail: '3-axis · 60 fps HDR', part: 'camera'},
      {label: 'Top speed', value: '68', unit: 'km/h', detail: 'Ducted rotors · quiet mode', part: 'rotorFR'},
    ],
    start: 26,
    every: 72,
    lockup: {label1: 'Weight', value1: '0.89', unit1: 'kg', label2: 'From', value2: '1,290', unit2: 'EUR', cta: 'Pre-order · ships spring'},
    showModel: true,
    background: '#020709',
    hue: 188,
    accent: 38,
  },
  propDocs: {
    title: 'product name (big light caps)',
    subtitle: 'mono line under the title',
    items: 'specs in order: {label, value, unit, detail, part?} — part highlights the holo drone part (battery|camera|body|rotorFL|rotorFR|rotorBL|rotorBR)',
    start: 'frame the first card appears',
    every: 'frames per spec (card in, roll, hold, dock)',
    lockup: 'final block: two label/value/unit pairs and a CTA line',
    showModel: 'show the hologram drone wireframe behind',
    background: 'stage colour, or "transparent" for an overlay',
    hue: 'line hue (188 cyan)',
    accent: 'value hue (38 amber)',
  },
  component: SpecChipRail,
  tags: ['hud', 'spec', 'specs', 'chips', 'rail', 'price', 'kpi', 'rolling numbers', 'scramble', 'hologram', 'sci-fi', 'product', 'feature list', 'cta', 'cyan', 'amber'],
});
