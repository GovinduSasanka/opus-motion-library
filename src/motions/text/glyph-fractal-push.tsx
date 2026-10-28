// Adapted from lemo-opuscar/styles/ascii-crt/demo/main.js fractal push (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {useSafeId} from '../../core/image-kit';
import {CrtGlass, lf, strokeGlyph} from '../../core/r2-la1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A big word on a phosphor terminal; the camera holds while the whole word reads, then pushes on an
 * exponential curve into one glyph until you see it is made of lines of smaller text (names, logs,
 * headlines). Inside the target glyph the text is 100 %, inside its neighbours 20 %, outside ~5 %.
 */
type Props = {
  word: string;
  target: number;
  innerText: string[];
  holdFrames: number;
  pushFrames: number;
  zoomTo: number;
  phosphor: string;
  phosphorHi: string;
  background: string;
};

const NAMES = [
  'ADA MORENO', 'KAI OKAFOR', 'LENA VOSS', 'RAVI MENON', 'SOFIA LIND', 'TOMAS REYES', 'MEI TANAKA', 'OMAR HADDAD', 'NORA BLAKE',
  'IVAN PETROV', 'ZARA KHAN', 'LUCAS SILVA', 'AMARA OBI', 'FINN CARTER', 'YUKI ARAI', 'ELENA ROSSI', 'SAMIR DAS', 'HANNA BERG',
  'DIEGO RUIZ', 'PRIYA RAO', 'JONAS WEBER', 'LILA HART', 'NOAH KIM', 'ESME LAURENT',
];

const GlyphFractalPush: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = useSafeId('gfrac');
  const word = p.word.toUpperCase();
  const glyphs = useMemo(() => [...word].map((c) => strokeGlyph(c)), [word]);
  const gap = 2.4;
  const totalU = glyphs.reduce((a, g) => a + g.width, 0) + gap * (glyphs.length - 1) + 1.6;
  const unit = Math.min((w * (portrait ? 0.84 : 0.78)) / totalU, (h * (portrait ? 0.3 : 0.62)) / 7.6);
  const sw = unit * 1.55; // stroke weight of the big letters
  const ox = (w - (totalU - 1.6) * unit) / 2;
  const oy = h / 2 - 3 * unit;
  const ti = Math.min(glyphs.length - 1, Math.max(0, p.target));
  let acc = 0;
  const placed = glyphs.map((g) => {
    const x = acc;
    acc += g.width + gap;
    return {...g, x};
  });
  const dOf = (k: number) =>
    placed[k].strokes.map((s) => 'M' + s.map(([a, b]) => `${(ox + (placed[k].x + a) * unit).toFixed(1)} ${(oy + b * unit).toFixed(1)}`).join(' L')).join(' ');
  // focus = midpoint of the target glyph's longest stroke
  const focus = useMemo(() => {
    let best: [number, number] = [0, 0];
    let bl = -1;
    placed[ti].strokes.forEach((s) => {
      let L = 0;
      for (let i = 1; i < s.length; i++) L += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]);
      if (L > bl) {
        bl = L;
        best = s[Math.floor(s.length / 2)];
      }
    });
    return [ox + (placed[ti].x + best[0]) * unit, oy + best[1] * unit] as [number, number];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, ti, unit, ox, oy]);
  // camera: exponential push after the hold
  const k = prog(frame, p.holdFrames, p.holdFrames + p.pushFrames, ease.inOut);
  const Z = Math.pow(p.zoomTo, k);
  const cxp = focus[0] + (w / 2 - focus[0]) * (1 - k) * 0;
  const camX = w / 2 + (focus[0] - w / 2) * k;
  const camY = h / 2 + (focus[1] - h / 2) * k;
  void cxp;
  const T = `translate(${w / 2} ${h / 2}) scale(${Z}) translate(${-camX} ${-camY})`;
  // text field: lines at base size so the end size reads ≈ 30 px
  const fs = (30 * u) / p.zoomTo;
  const lh = fs * 1.3;
  const adv = fs * 0.4;
  const pool = (p.innerText.length ? p.innerText : NAMES).join('  ·  ') + '  ·  ';
  const vx0 = camX - w / 2 / Z;
  const vx1 = camX + w / 2 / Z;
  const vy0 = camY - h / 2 / Z;
  const vy1 = camY + h / 2 / Z;
  const lines: React.ReactNode[] = [];
  const top = oy - 1.5 * unit;
  const bottom = oy + 7.5 * unit;
  const left = ox - 1.5 * unit;
  const right = ox + (totalU - 0.2) * unit;
  const nLines = Math.floor((bottom - top) / lh);
  for (let i = 0; i < nLines; i++) {
    const y = top + (i + 1) * lh;
    if (y < vy0 - lh || y > vy1 + lh) continue;
    const c0 = Math.max(0, Math.floor((Math.max(left, vx0) - left) / adv) - 1);
    const c1 = Math.min(Math.floor((right - left) / adv), Math.ceil((Math.min(right, vx1) - left) / adv) + 1);
    if (c1 <= c0) continue;
    const off = (i * 37) % pool.length;
    let s = '';
    for (let c = c0; c < c1; c++) s += pool[(off + c) % pool.length];
    lines.push(
      <text key={i} x={left + c0 * adv} y={y} textLength={(c1 - c0) * adv} lengthAdjust="spacingAndGlyphs">
        {s}
      </text>,
    );
  }
  const powerOn = prog(frame, 0, 14, ease.out);
  const outline = 1 - prog(frame, p.holdFrames, p.holdFrames + p.pushFrames * 0.4, ease.out);

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-w * 4} y={-h * 4} width={w * 9} height={h * 9}>
            <rect x={-w * 4} y={-h * 4} width={w * 9} height={h * 9} fill="#0d0d0d" />
            {placed.map((_, kk) => (
              <path key={kk} d={dOf(kk)} fill="none" stroke={kk === ti ? '#ffffff' : '#383838'} strokeWidth={sw} strokeLinecap="square" strokeLinejoin="miter" />
            ))}
          </mask>
          <filter id={`${id}-glow`} x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation={2.5 * u} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform={T} opacity={powerOn}>
          <g mask={`url(#${id}-m)`} fontFamily={lf.vt} fontSize={fs} fill={p.phosphorHi}>
            {lines}
          </g>
          {/* faint beam edge on the big letters while they still read as letters */}
          {outline > 0.01 &&
            placed.map((_, kk) => (
              <path key={kk} d={dOf(kk)} fill="none" stroke={p.phosphor} strokeOpacity={(kk === ti ? 0.28 : 0.12) * outline} strokeWidth={sw} strokeLinecap="square" />
            ))}
        </g>
        <CrtGlass id={id} w={w} h={h} u={u} tint={p.phosphor} frame={frame} />
      </Svg>
    </AbsoluteFill>
  );
};

export const glyphFractalPush = defineMotion<Props>({
  id: 'glyph-fractal-push',
  title: 'Glyph fractal push',
  category: 'text',
  description:
    'A big word on a phosphor terminal holds, then the camera pushes on an exponential curve into one glyph until you see it is made of lines of smaller text (names, logs, headlines); outside the glyph the text is barely visible.',
  source: ['lemo-opuscar styles/ascii-crt demo/main.js fractal section, term.js thin bitmaps (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §3 glyph-fractal-push'],
  useFor: 'Scale reveals for text-heavy stories: "a company made of its people", "a year made of headlines", "a model made of a million lines".',
  durationInFrames: 180,
  defaultProps: {
    word: 'TEAM',
    target: 1,
    innerText: [],
    holdFrames: 34,
    pushFrames: 110,
    zoomTo: 7,
    phosphor: '#FFB000',
    phosphorHi: '#FFE2A0',
    background: '#090604',
  },
  propDocs: {
    word: 'the big word (A–Z, 0–9; 2–6 letters reads best)',
    target: 'index of the letter the camera pushes into',
    innerText: 'strings that make up the small text (names, log lines, headlines); empty = 24 neutral placeholder names',
    holdFrames: 'frames the whole word holds before the push',
    pushFrames: 'push duration',
    zoomTo: 'final zoom (the small text reads at ≈ 30 px at the end)',
    phosphor: 'phosphor colour (beam edges / glow)',
    phosphorHi: 'small-text colour',
    background: 'unlit glass colour',
  },
  component: GlyphFractalPush,
  tags: ['typography', 'zoom', 'push in', 'fractal', 'names', 'text made of text', 'scale reveal', 'terminal', 'crt', 'phosphor', 'ascii', 'credits', 'community', 'team', 'headlines'],
});
