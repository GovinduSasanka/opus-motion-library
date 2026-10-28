import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FieldArt, SPORTS, asSport, backOut, bgCss, bodyFont, clampN, easeIO, easeOut3, fieldLayout, fitFont, headFont, mixHex, num, onColor, rampColor, sseg, withAlpha} from '../../core/r3-sports-kit';
import {rng} from '../../core/random';
import {Svg, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Shot map with a heat layer: a half pitch (or half court) draws on, then the shots land one by one — goals / made shots as bold
 * discs with a ring, saved shots as white hollow dots, misses as small crosses — while a smooth heat map of where the shots came
 * from builds underneath. A side panel counts shots, goals and conversion. The heat ramp, dot colours and sport are props.
 */
type Shot = {x: number; y: number; result?: string; value?: number};
type Props = {
  sport: string;
  title: string;
  subtitle: string;
  shots: Shot[];
  half: boolean;
  showHeat: boolean;
  showTrails: boolean;
  goalLabel: string;
  shotLabel: string;
  rateLabel: string;
  heatColors: string[];
  field: string;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  fontFamily: string;
};

/** deterministic sample: shots cluster in front of goal, goals are more likely close in */
const makeSample = (): Shot[] => {
  const r = rng('shot-map-heat');
  const out: Shot[] = [];
  for (let i = 0; i < 34; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.pow(r(), 0.8) * 0.5;
    const x = clampN(0.93 - Math.abs(Math.cos(a)) * d * 1.1, 0.12, 0.99);
    const y = clampN(0.5 + Math.sin(a) * d * 0.95, 0.06, 0.94);
    const dist = Math.hypot(1 - x, (y - 0.5) * 0.9);
    const q = clampN(0.6 - dist * 1.1, 0.04, 0.6);
    const p = r();
    out.push({x: +x.toFixed(3), y: +y.toFixed(3), result: p < q * 0.85 ? 'goal' : p < q + 0.28 ? 'saved' : 'miss', value: +q.toFixed(2)});
  }
  return out;
};
const SAMPLE_SHOTS = makeSample();

const kind = (r?: string): 'goal' | 'saved' | 'miss' => {
  const s = (r || '').toLowerCase();
  if (s === 'goal' || s === 'made' || s === 'score' || s === 'scored' || s === 'hit') return 'goal';
  if (s === 'miss' || s === 'missed' || s === 'off' || s === 'blocked' || s === 'wide') return 'miss';
  return 'saved';
};

const ShotMapHeat: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: T, portrait} = useStage();
  const head = headFont(P.fontFamily);
  const body = bodyFont(P.fontFamily);
  const sport = asSport(P.sport);
  const surface = !P.field || P.field === 'auto' ? SPORTS[sport].field : P.field;
  const list = (Array.isArray(P.shots) && P.shots.length ? P.shots : SAMPLE_SHOTS).slice(0, 80).map((s, i) => ({
    x: clampN(num(s.x, 0.8), 0, 1),
    y: clampN(num(s.y, 0.5), 0, 1),
    k: kind(s.result),
    v: clampN(num(s.value, 0.3), 0.05, 1),
    i,
  }));
  const N = list.length;
  const goals = list.filter((s) => s.k === 'goal').length;

  // layout: side panel on wide frames, header above otherwise
  const wide = w / h > 1.45;
  const pad = 56 * u;
  const headH = wide ? 0 : (portrait ? 300 : 210) * u;
  const panelW = wide ? Math.min(w * 0.28, 520 * u) : 0;
  const box = wide ? {x: pad + panelW + 24 * u, y: pad, w: w - pad * 2 - panelW - 24 * u, h: h - pad * 2} : {x: pad * 0.7, y: pad * 0.5 + headH, w: w - pad * 1.4, h: h - pad * 1.2 - headH};
  const crop: [number, number] = P.half ? [0.5, 1] : [0, 1];
  const vertical = !wide && portrait;
  const L = fieldLayout(sport, box, vertical, crop);
  const drawP = easeIO(sseg(frame, 2, 34));
  const fieldO = easeOut3(sseg(frame, 0, 14));

  // shots arrive evenly between frame 40 and T-50
  const t0 = 40;
  const span = Math.max(30, T - t0 - 70);
  const at = (i: number) => t0 + (i / Math.max(1, N)) * span;
  const arrived = list.filter((s) => frame >= at(s.i)).length;
  const arrGoals = list.filter((s) => s.k === 'goal' && frame >= at(s.i)).length;

  // heat grid over the field window: gaussian kernels per shot, normalised to the final map so the scale does not jump
  const gx = 46;
  const gy = Math.max(10, Math.round((gx * L.h) / L.w));
  const cellW = L.w / gx;
  const cellH = L.h / gy;
  const spanM = (L.crop[1] - L.crop[0]) * L.L;
  const sig = Math.max(spanM, L.W) * 0.1;
  const cells = React.useMemo(() => {
    const out: {gi: number; gj: number; nx: number; ny: number}[] = [];
    for (let gj = 0; gj < gy; gj++)
      for (let gi = 0; gi < gx; gi++) {
        const q = L.inv(L.x + (gi + 0.5) * cellW, L.y + (gj + 0.5) * cellH);
        if (q.nx < -0.02 || q.nx > 1.02 || q.ny < -0.02 || q.ny > 1.02) continue;
        out.push({gi, gj, nx: q.nx, ny: q.ny});
      }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport, P.half, vertical, wide, w, h]);
  const kernels = React.useMemo(
    () =>
      list.map((s) => {
        const out = new Float32Array(cells.length);
        const wgt = 0.5 + s.v;
        for (let c = 0; c < cells.length; c++) {
          const dx = (cells[c].nx - s.x) * spanM;
          const dy = (cells[c].ny - s.y) * L.W;
          out[c] = wgt * Math.exp(-(dx * dx + dy * dy) / (2 * sig * sig));
        }
        return out;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(list), cells],
  );
  const maxFinal = React.useMemo(() => {
    let m = 0.0001;
    for (let c = 0; c < cells.length; c++) {
      let v = 0;
      for (const k of kernels) v += k[c];
      if (v > m) m = v;
    }
    return m;
  }, [kernels, cells]);
  const ramp = Array.isArray(P.heatColors) && P.heatColors.length >= 2 ? P.heatColors : ['#1B2B6B', '#1FB5C9', '#FFD23F', '#FF4A3D'];
  const heatOn = P.showHeat ? easeOut3(sseg(frame, 34, 60)) : 0;

  const r0 = clampN(Math.min(L.w, L.h) * 0.028, 7 * u, 22 * u);
  const goalPt = L.pt(1, 0.5);
  const counter = (n: number, lab: string, col: string, delay: number) => {
    const p = easeOut3(sseg(frame, delay, delay + 24));
    return (
      <div style={{opacity: p, transform: `translateY(${(1 - p) * 20 * u}px)`}}>
        <div style={{fontFamily: head, fontSize: (wide ? 120 : 80) * u, lineHeight: 1, color: col, fontVariantNumeric: 'tabular-nums'}}>{n}</div>
        <div style={{fontFamily: body, fontWeight: 700, fontSize: 22 * u, letterSpacing: 6 * u, color: withAlpha(P.ink, 0.7), textTransform: 'uppercase', marginTop: 4 * u}}>{lab}</div>
      </div>
    );
  };
  const rate = arrived ? Math.round((arrGoals / arrived) * 100) : 0;
  const titleP = easeOut3(sseg(frame, 6, 34));
  const tFs = fitFont((P.title || '').toUpperCase(), (wide ? 64 : portrait ? 78 : 58) * u, (wide ? panelW : w - pad * 2) * 0.98);

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      {bgCss(P.background) && (
        <>
          <AbsoluteFill style={{background: `radial-gradient(ellipse 65% 60% at 60% 50%, ${withAlpha(P.accent2, 0.14)}, transparent 75%)`}} />
          <Vignette strength={0.45} />
        </>
      )}
      <div style={{position: 'absolute', inset: 0, opacity: fieldO}}>
        <Svg>
          <g style={{filter: `drop-shadow(0 ${12 * u}px ${24 * u}px rgba(0,0,0,0.45))`}}>
            <FieldArt layout={L} surface={mixHex(surface, '#0A1020', 0.35)} line={withAlpha('#FFFFFF', 0.8)} draw={drawP} id="smh" lineWidthPx={Math.max(2.2, 2.8 * u)} />
          </g>
          {/* heat layer */}
          {heatOn > 0.001 && (
            <g opacity={heatOn * 0.86} style={{mixBlendMode: 'screen'}} clipPath="url(#smh-heatclip)">
              <defs>
                <clipPath id="smh-heatclip">
                  <rect x={L.x} y={L.y} width={L.w} height={L.h} />
                </clipPath>
                <filter id="smh-soft" x="-5%" y="-5%" width="110%" height="110%">
                  <feGaussianBlur stdDeviation={cellW * 0.55} />
                </filter>
              </defs>
              <g filter="url(#smh-soft)">
                {cells.map((cell, c) => {
                  let v = 0;
                  for (let k = 0; k < kernels.length; k++) {
                    const a = at(k);
                    const grow = easeOut3(sseg(frame, a, a + 26));
                    if (grow > 0) v += kernels[k][c] * grow;
                  }
                  const t = clampN(v / maxFinal, 0, 1);
                  if (t < 0.06) return null;
                  return <rect key={c} x={L.x + cell.gi * cellW} y={L.y + cell.gj * cellH} width={cellW + 0.6} height={cellH + 0.6} fill={rampColor(ramp, t)} opacity={clampN(t * 1.6, 0, 1)} />;
                })}
              </g>
            </g>
          )}
          {/* shots */}
          {list.map((s) => {
            const a = at(s.i);
            const p = backOut(sseg(frame, a, a + 14), 2.2);
            if (p <= 0.001) return null;
            const pt = L.pt(s.x, s.y);
            const trail = P.showTrails ? easeOut3(sseg(frame, a, a + 12)) : 0;
            const fade = 1 - sseg(frame, a + 14, a + 40) * 0.0;
            const size = r0 * (0.8 + s.v * 0.9) * (s.k === 'goal' ? 1.2 : 1);
            const ring = (1 - sseg(frame, a, a + 22)) * size * 2.4;
            if (s.k === 'goal') {
              return (
                <g key={s.i} opacity={fade}>
                  {trail > 0 && <line x1={pt.x} y1={pt.y} x2={pt.x + (goalPt.x - pt.x) * trail} y2={pt.y + (goalPt.y - pt.y) * trail} stroke={withAlpha(P.accent, 0.55)} strokeWidth={Math.max(2, 2.5 * u)} strokeDasharray={`${6 * u} ${6 * u}`} />}
                  <circle cx={pt.x} cy={pt.y} r={size * 2 * 0.5 + ring} fill="none" stroke={P.accent} strokeWidth={Math.max(2, 3 * u)} opacity={ring > 0.5 ? 0.7 : 0} />
                  <circle cx={pt.x} cy={pt.y} r={size * p} fill={P.accent} stroke="#FFFFFF" strokeWidth={Math.max(2, 3 * u)} />
                </g>
              );
            }
            if (s.k === 'saved') {
              return (
                <g key={s.i} opacity={fade}>
                  {trail > 0 && <line x1={pt.x} y1={pt.y} x2={pt.x + (goalPt.x - pt.x) * trail} y2={pt.y + (goalPt.y - pt.y) * trail} stroke="rgba(255,255,255,0.28)" strokeWidth={Math.max(1.5, 2 * u)} strokeDasharray={`${5 * u} ${7 * u}`} />}
                  <circle cx={pt.x} cy={pt.y} r={size * 0.8 * p} fill="rgba(10,16,32,0.55)" stroke="#FFFFFF" strokeWidth={Math.max(2, 2.8 * u)} />
                </g>
              );
            }
            const q = size * 0.6 * p;
            return (
              <g key={s.i} opacity={fade * 0.9} stroke={withAlpha('#FFFFFF', 0.85)} strokeWidth={Math.max(2.2, 3.2 * u)} strokeLinecap="round">
                <line x1={pt.x - q} y1={pt.y - q} x2={pt.x + q} y2={pt.y + q} />
                <line x1={pt.x - q} y1={pt.y + q} x2={pt.x + q} y2={pt.y - q} />
              </g>
            );
          })}
        </Svg>
      </div>

      {/* panel / header */}
      <div
        style={{
          position: 'absolute',
          left: pad,
          top: wide ? h / 2 - 330 * u : pad * 0.8,
          width: wide ? panelW : w - pad * 2,
          textAlign: wide ? 'left' : 'center',
          opacity: titleP,
          transform: `translateY(${(1 - titleP) * -22 * u}px)`,
        }}
      >
        <div style={{fontFamily: body, fontWeight: 700, fontSize: 26 * u, letterSpacing: 8 * u, color: P.accent, textTransform: 'uppercase'}}>{P.subtitle}</div>
        <div style={{fontFamily: head, fontSize: tFs, lineHeight: 1.04, color: P.ink, marginTop: 10 * u, textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{P.title}</div>
        <div style={{width: (wide ? 150 : 220) * u * titleP, height: 6 * u, background: P.accent, marginTop: 20 * u, marginLeft: wide ? 0 : 'auto', marginRight: wide ? 0 : 'auto'}} />
        <div style={{display: 'flex', flexDirection: wide ? 'column' : 'row', gap: (wide ? 28 : 56) * u, marginTop: (wide ? 40 : 22) * u, justifyContent: 'center', alignItems: wide ? 'flex-start' : 'flex-end'}}>
          {counter(arrived, P.shotLabel, P.ink, 24)}
          {counter(arrGoals, P.goalLabel, P.accent, 32)}
          <div style={{opacity: easeOut3(sseg(frame, 40, 64))}}>
            <div style={{fontFamily: head, fontSize: (wide ? 120 : 80) * u, lineHeight: 1, color: P.accent2, fontVariantNumeric: 'tabular-nums'}}>
              {rate}
              <span style={{fontSize: (wide ? 56 : 38) * u}}>%</span>
            </div>
            <div style={{fontFamily: body, fontWeight: 700, fontSize: 22 * u, letterSpacing: 6 * u, color: withAlpha(P.ink, 0.7), textTransform: 'uppercase', marginTop: 4 * u}}>{P.rateLabel}</div>
          </div>
        </div>
      </div>
      {/* legend, bottom of the pitch */}
      <div style={{position: 'absolute', left: L.x, width: L.w, top: L.y + L.h + 12 * u, display: wide || h - (L.y + L.h) < 70 * u ? 'none' : 'flex', justifyContent: 'center', gap: 36 * u, fontFamily: body, fontWeight: 600, fontSize: 22 * u, color: withAlpha(P.ink, 0.75), opacity: easeOut3(sseg(frame, 60, 80))}}>
        <span style={{display: 'flex', alignItems: 'center', gap: 10 * u}}>
          <span style={{width: 18 * u, height: 18 * u, borderRadius: '50%', background: P.accent, border: '2px solid #fff', display: 'inline-block'}} />
          {P.goalLabel}
        </span>
        <span style={{display: 'flex', alignItems: 'center', gap: 10 * u}}>
          <span style={{width: 18 * u, height: 18 * u, borderRadius: '50%', border: '2px solid #fff', display: 'inline-block'}} />
          On target
        </span>
        <span style={{display: 'flex', alignItems: 'center', gap: 10 * u}}>
          <span style={{color: '#fff', fontWeight: 800}}>×</span> Off target
        </span>
      </div>
      <div style={{position: 'absolute', left: pad, bottom: pad * 0.8, display: wide ? 'flex' : 'none', gap: 22 * u, fontFamily: body, fontWeight: 600, fontSize: 21 * u, color: withAlpha(P.ink, 0.75), opacity: easeOut3(sseg(frame, 60, 80)), alignItems: 'center', flexWrap: 'wrap', width: panelW}}>
        <span style={{display: 'flex', alignItems: 'center', gap: 8 * u}}>
          <span style={{width: 16 * u, height: 16 * u, borderRadius: '50%', background: P.accent, border: '2px solid #fff', display: 'inline-block'}} />
          {P.goalLabel}
        </span>
        <span style={{display: 'flex', alignItems: 'center', gap: 8 * u}}>
          <span style={{width: 16 * u, height: 16 * u, borderRadius: '50%', border: '2px solid #fff', display: 'inline-block'}} />
          On target
        </span>
        <span style={{display: 'flex', alignItems: 'center', gap: 8 * u}}>
          <span style={{color: '#fff', fontWeight: 800}}>×</span> Off
        </span>
        <span style={{width: 120 * u, height: 12 * u, borderRadius: 6 * u, background: `linear-gradient(90deg, ${ramp.join(',')})`}} />
      </div>
    </AbsoluteFill>
  );
};

export const shotMapHeat = defineMotion<Props>({
  id: 'shot-map-heat',
  title: 'Shot map with heat',
  category: 'game',
  description: 'A half pitch or half court draws on and shots land one by one (goals as bold discs, saves as hollow dots, misses as crosses) while a smooth heat map of shot locations builds underneath; counters for shots, goals and conversion run in a side panel or header.',
  source: ['original'],
  useFor: 'Match and player shot maps, xG explainers, basketball shot charts, scouting reports and "where do they score from" stories. Give the shots as {x, y, result, value} (x 0 = far edge .. 1 = goal line, y 0..1 across, result goal | saved | miss).',
  durationInFrames: 240,
  defaultProps: {
    sport: 'football',
    title: 'Shot map',
    subtitle: 'Season to date',
    shots: SAMPLE_SHOTS,
    half: true,
    showHeat: true,
    showTrails: true,
    goalLabel: 'Goals',
    shotLabel: 'Shots',
    rateLabel: 'Conversion',
    heatColors: ['#1B2B6B', '#1FB5C9', '#FFD23F', '#FF4A3D'],
    field: 'auto',
    background: '#0A1020',
    ink: '#FFFFFF',
    accent: '#FFC933',
    accent2: '#2FD4C0',
    fontFamily: 'auto',
  },
  propDocs: {
    sport: 'football | basketball | plain',
    title: 'heading',
    subtitle: 'small line above the heading',
    shots: 'array of {x, y, result, value}: x 0..1 across the drawn area (1 = goal / basket line), y 0..1 across the width, result goal|made | saved|hit | miss, value 0..1 shot quality (sizes the dot and the heat). Empty = built-in sample',
    half: 'true = attacking half only (bigger), false = whole pitch / court (x then runs along the whole length)',
    showHeat: 'show the heat map underneath',
    showTrails: 'draw a short dashed line from each shot towards goal',
    goalLabel: 'name for scored shots (Goals, Baskets, Made)',
    shotLabel: 'name for all attempts (Shots, Attempts)',
    rateLabel: 'name of the percentage (Conversion, FG%)',
    heatColors: 'heat ramp from cold to hot, 2-5 hex colours',
    field: 'surface colour, or "auto" for the sport default (darkened)',
    background: 'frame colour, or "transparent" to overlay footage',
    ink: 'text colour',
    accent: 'goal dot and heading highlight colour',
    accent2: 'percentage colour',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: ShotMapHeat,
  tags: ['shot map', 'heatmap', 'heat map', 'shot chart', 'xg', 'football', 'soccer', 'basketball', 'pitch', 'court', 'goals', 'scouting', 'analytics', 'sports', 'stats', 'data'],
});
