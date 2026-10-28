import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {Plate} from '../../core/image-kit';
import {alpha, eo3, fitSize, lf, on, seg, wrapText} from '../../core/r3-news-kit';
import {rng} from '../../core/random';
import {FilmGrain, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Archive photo with a slow Ken Burns move and a dated caption: either full-bleed with a lower-left caption block
 * (kicker + date, serif caption, credit) or as a white-bordered print with a handwritten caption in the margin.
 * Sepia / black-and-white / colour treatment, film grain, dust and a developing-print fade.
 */
type Props = {
  src: string;
  caption: string;
  date: string;
  kicker: string;
  credit: string;
  treatment: string;
  move: string;
  zoom: number;
  framed: boolean;
  grain: number;
  dust: boolean;
  accent: string;
  ink: string;
  background: string;
  captionAt: number;
  speed: number;
};

const FILTERS: Record<string, string> = {
  sepia: 'sepia(0.88) contrast(1.06) brightness(0.96) saturate(0.95)',
  bw: 'grayscale(1) contrast(1.12) brightness(0.98)',
  color: 'contrast(1.04) saturate(0.95)',
};

const ArchivePhoto: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = frame * (p.speed || 1);
  const filter = FILTERS[p.treatment] ?? FILTERS.sepia;

  // ---- ken burns parameters (scale + pan as fractions of the overscan)
  const z = clamp(p.zoom, 0, 0.6);
  const t = prog(f, 0, 190, ease.sine);
  const mv = p.move || 'push';
  let sc0 = 1.04;
  let sc1 = 1.04 + z;
  let px0 = 0;
  let px1 = 0;
  let py0 = 0;
  let py1 = 0;
  if (mv === 'pull') [sc0, sc1] = [1.04 + z, 1.04];
  else if (mv === 'pan-left') [sc0, sc1, px0, px1] = [1.04 + z * 0.6, 1.04 + z * 0.6, 0.5, -0.5];
  else if (mv === 'pan-right') [sc0, sc1, px0, px1] = [1.04 + z * 0.6, 1.04 + z * 0.6, -0.5, 0.5];
  else if (mv === 'tilt-up') [sc0, sc1, py0, py1] = [1.04 + z * 0.6, 1.04 + z * 0.6, 0.5, -0.5];
  else if (mv === 'tilt-down') [sc0, sc1, py0, py1] = [1.04 + z * 0.6, 1.04 + z * 0.6, -0.5, 0.5];
  const sc = lerp(sc0, sc1, t);
  const panX = lerp(px0, px1, t);
  const panY = lerp(py0, py1, t);

  const renderPhoto = (bw: number, bh: number) => {
    const overX = (bw * (sc - 1)) / 2;
    const overY = (bh * (sc - 1)) / 2;
    const dev = 1 - eo3(seg(f, 6, 44));
    const flick = 0.975 + 0.025 * Math.sin(Math.floor(f / 2) * 12.9898);
    return (
      <div style={{position: 'absolute', left: 0, top: 0, width: bw, height: bh, overflow: 'hidden', background: '#000'}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: bw, height: bh, transform: `translate(${panX * overX}px, ${panY * overY}px) scale(${sc})`, transformOrigin: '50% 50%', filter: `${filter} brightness(${flick + dev * 0.5})`}}>
          <Plate src={on(p.src) ? p.src : undefined} seed={14} palette="dusk" width={bw} height={bh} />
        </div>
        <div style={{position: 'absolute', inset: 0, background: '#F4ECD8', opacity: dev * 0.85}} />
      </div>
    );
  };

  // ---- dust + scratches
  const specks = React.useMemo(() => {
    const r = rng('archive-dust');
    return Array.from({length: 18}, () => ({x: r(), y: r(), s: 1 + r() * 3.2, ph: Math.floor(r() * 6), len: r() < 0.3 ? 8 + r() * 24 : 0, rot: r() * 180}));
  }, []);
  const dustLayer = p.dust && (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen', opacity: 0.7}}>
      {specks.map((s, i) => {
        const on2 = Math.floor(f / 3 + s.ph) % 5 < 2;
        if (!on2) return null;
        const jx = ((Math.floor(f / 3 + i) * 53) % 17) / 17;
        const x = ((s.x + jx * 0.25) % 1) * w;
        const y = s.y * h;
        return s.len ? (
          <line key={i} x1={x} y1={y} x2={x + Math.cos(s.rot) * s.len * u} y2={y + Math.sin(s.rot) * s.len * u} stroke="#F6EEDC" strokeWidth={1.1 * u} opacity={0.5} />
        ) : (
          <circle key={i} cx={x} cy={y} r={s.s * u * 0.6} fill="#F6EEDC" opacity={0.55} />
        );
      })}
    </svg>
  );

  const capK = (d: number) => eo3(seg(f, p.captionAt + d, p.captionAt + d + 16));

  // =========================================================== framed print layout
  if (p.framed) {
    const photoW = portrait ? w * 0.8 : Math.min(h * 0.62 * 1.34, w * 0.58);
    const photoH = portrait ? photoW * 1.2 : photoW / 1.34;
    const bd = 28 * u;
    const capFs = fitSize(p.caption, 46 * u, photoW - 20 * u, 'hand');
    const capLines = wrapText(p.caption, Math.max(capFs, 38 * u) * 0.73, photoW - 24 * u, 'sans', 2);
    const capSize = capLines.length > 1 ? Math.min(capFs, 40 * u) : Math.max(capFs, 32 * u);
    const metaFs = 21 * u;
    const bottom = 46 * u + capLines.length * capSize * 1.15 + metaFs * 2.1;
    const pw = photoW + bd * 2;
    const ph = photoH + bd + bottom;
    const inT = eo3(seg(f, 0, 26));
    const settleRot = lerp(-5, -1.3, eo3(seg(f, 0, 26))) + Math.sin(f * 0.02) * 0.15;
    return (
      <AbsoluteFill style={{background: p.background === 'transparent' ? 'transparent' : `radial-gradient(ellipse at 50% 40%, ${alpha('#FFFFFF', 0.07)} 0%, rgba(0,0,0,0) 65%), ${p.background}`, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: (w - pw) / 2, top: (h - ph) / 2 + (1 - inT) * 60 * u, width: pw, height: ph, opacity: clamp(inT * 2), transform: `rotate(${settleRot}deg) scale(${lerp(0.94, 1, inT)})`, background: '#F2EBDC', boxShadow: `0 ${24 * u}px ${60 * u}px rgba(0,0,0,0.55), inset 0 0 ${40 * u}px rgba(120,96,50,0.25)`}}>
          <div style={{position: 'absolute', left: bd, top: bd, width: photoW, height: photoH}}>
            {renderPhoto(photoW, photoH)}
            <AbsoluteFill style={{boxShadow: `inset 0 0 ${60 * u}px rgba(0,0,0,0.45)`}} />
          </div>
          {/* handwritten caption + meta in the margin */}
          <div style={{position: 'absolute', left: bd + 12 * u, top: bd + photoH + 18 * u, width: photoW - 24 * u}}>
            {capLines.map((l, i) => (
              <div key={i} style={{fontFamily: lf.hand, fontWeight: 700, fontSize: capSize, lineHeight: 1.15, color: '#2A2118', opacity: capK(i * 6), transform: `translateY(${(1 - capK(i * 6)) * 8 * u}px)`, whiteSpace: 'nowrap'}}>
                {l}
              </div>
            ))}
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 10 * u, fontFamily: lf.plex, fontSize: metaFs, color: '#6B5B43', opacity: capK(16), letterSpacing: metaFs * 0.06}}>
              <span>{(p.date || '').toUpperCase()}</span>
              <span>{p.credit}</span>
            </div>
          </div>
          {/* kicker tag */}
          {on(p.kicker) && (
            <div style={{position: 'absolute', left: -14 * u, top: -16 * u, transform: 'rotate(-4deg)', background: p.accent, color: '#17120A', fontFamily: lf.plex, fontWeight: 700, fontSize: 24 * u, letterSpacing: 4 * u, padding: `${7 * u}px ${18 * u}px`, opacity: capK(-10), boxShadow: `0 ${6 * u}px ${16 * u}px rgba(0,0,0,0.35)`}}>
              {p.kicker.toUpperCase()}
            </div>
          )}
          {/* tape */}
          {[0, 1].map((i) => (
            <div key={i} style={{position: 'absolute', [i ? 'right' : 'left']: -18 * u, top: -10 * u + (i ? 4 * u : 0), width: 96 * u, height: 30 * u, background: 'rgba(235,224,190,0.55)', transform: `rotate(${i ? 38 : -38}deg)`, display: on(p.kicker) && !i ? 'none' : 'block'}} />
          ))}
        </div>
        {dustLayer}
        <FilmGrain opacity={p.grain} />
        <Vignette strength={0.45} />
      </AbsoluteFill>
    );
  }

  // =========================================================== full-bleed layout
  const pad = w * (portrait ? 0.07 : 0.055);
  const capW = w * (portrait ? 0.86 : 0.6);
  const capFs0 = (portrait ? 54 : 50) * u;
  let capFs2 = capFs0;
  let lines = wrapText(p.caption, capFs2, capW, 'serif', 4);
  while (lines.length > 3 && capFs2 > 26 * u) {
    capFs2 *= 0.92;
    lines = wrapText(p.caption, capFs2, capW, 'serif', 4);
  }
  const dateTxt = [p.kicker, p.date].filter(on).join('  ·  ').toUpperCase();
  const dFs = 26 * u;
  const credFs = 22 * u;
  const bottom = h * (portrait ? 0.1 : 0.09);
  const ruleK = eo3(seg(f, p.captionAt - 4, p.captionAt + 18));
  return (
    <AbsoluteFill style={{background: p.background === 'transparent' ? '#000' : p.background, overflow: 'hidden'}}>
      {renderPhoto(w, h)}
      <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(8,6,3,0.82) 0%, rgba(8,6,3,0.45) 26%, rgba(8,6,3,0) 52%)'}} />
      {dustLayer}
      <FilmGrain opacity={p.grain} />
      <Vignette strength={0.5} />
      <div style={{position: 'absolute', left: pad, bottom, width: capW}}>
        {on(dateTxt) && (
          <div style={{display: 'flex', alignItems: 'center', gap: 16 * u, marginBottom: 16 * u, opacity: capK(0)}}>
            <div style={{width: 64 * u * ruleK, height: 4 * u, background: p.accent}} />
            <div style={{fontFamily: lf.plex, fontWeight: 700, fontSize: dFs, letterSpacing: dFs * 0.14, color: p.accent, transform: `translateX(${(1 - capK(0)) * -16 * u}px)`}}>{dateTxt}</div>
          </div>
        )}
        {lines.map((l, i) => (
          <div key={i} style={{overflow: 'hidden', height: capFs2 * 1.25}}>
            <div style={{fontFamily: lf.serif, fontWeight: 700, fontSize: capFs2 * 1.08, lineHeight: `${capFs2 * 1.25}px`, color: p.ink, whiteSpace: 'nowrap', transform: `translateY(${(1 - capK(6 + i * 5)) * 105}%)`, textShadow: '0 2px 16px rgba(0,0,0,0.6)'}}>{l}</div>
          </div>
        ))}
        {on(p.credit) && (
          <div style={{marginTop: 14 * u, fontFamily: lf.sans, fontWeight: 400, fontSize: credFs, letterSpacing: credFs * 0.05, color: p.ink, opacity: 0.7 * capK(18)}}>{p.credit}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const archivePhotoKenBurnsCaption = defineMotion<Props>({
  id: 'archive-photo-ken-burns-caption',
  title: 'Archive photo + caption',
  category: 'document',
  description:
    'An archive photograph with a slow Ken Burns move (push, pull, pan or tilt) and a dated caption - full-bleed with a lower-left caption block (kicker, date, serif caption, credit), or as a white-bordered print with a handwritten caption in the margin. Sepia / black-and-white / colour treatment, grain, dust specks and a developing-print fade-in.',
  source: ['library original (documentary archive-still pattern)'],
  useFor: 'Documentary and history videos, news background pieces, "this is what it looked like" photo beats, dated archive stills with a credit line.',
  durationInFrames: 190,
  defaultProps: {
    src: '',
    caption: 'The harbour district, looking east from the old bridge',
    date: 'March 1961',
    kicker: 'Archive',
    credit: 'Photo: Northwind City Archive',
    treatment: 'sepia',
    move: 'push',
    zoom: 0.16,
    framed: false,
    grain: 0.14,
    dust: true,
    accent: '#E8C66A',
    ink: '#F4EDDD',
    background: '#14110D',
    captionAt: 34,
    speed: 1,
  },
  propDocs: {
    src: 'the photo (public/ path or URL); empty = procedural placeholder scene',
    caption: 'caption text',
    date: 'date line, e.g. "March 1961" (empty = none)',
    kicker: 'small label before the date, e.g. "Archive", "File photo" (empty = none)',
    credit: 'credit line, e.g. "Photo: <collection>" (empty = none)',
    treatment: '"sepia" | "bw" | "color"',
    move: '"push" | "pull" | "pan-left" | "pan-right" | "tilt-up" | "tilt-down"',
    zoom: 'how far the push/pull travels (0-0.6)',
    framed: 'true = white-bordered print with handwritten caption; false = full-bleed',
    grain: 'film-grain strength (0 = none)',
    dust: 'dust specks and scratches',
    accent: 'date, rule and kicker colour',
    ink: 'caption colour (full-bleed layout)',
    background: 'backdrop behind a framed print; "transparent" = overlay',
    captionAt: 'frame the caption starts to appear',
    speed: 'timing multiplier',
  },
  component: ArchivePhoto,
  tags: ['archive', 'photo', 'ken burns', 'caption', 'documentary', 'history', 'sepia', 'old photo', 'credit', 'date', 'news', 'still', 'vintage', 'journalism'],
});
