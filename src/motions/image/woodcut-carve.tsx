// Technique after lemo-opuscar styles/woodcut demo/engine (filter.js woodcutFilter, hatch.js, knife.js, print.js) (MIT, LemoLab)
// — see THIRD_PARTY_NOTICES.md. Own deterministic SVG implementation: structure-tensor orientation, evenly spaced
// streamlines, V-gouge knife cuts carved in live (highlights first), printed on paper with a ragged block edge.
import React from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {ease, prog} from '../../core/ease';
import {n2} from '../../core/random';
import {Cut, buildCuts, clamp01, cutPath, orientationField} from '../../core/r2-lb3b-kit';
import {PaperTexture, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  src: string;
  sp: number;
  black: number;
  white: number;
  gamma: number;
  a0: number;
  reveal: 'light' | 'radial' | 'down';
  startFrame: number;
  durationFrames: number;
  ink: string;
  paper: string;
  plateColor: string;
  plateAbove: number;
  plateFrames: number[];
  seed: number;
  margin: number;
  maxCuts: number;
};

/** procedural "moonlit hills" tone field used when no image is supplied (aspect-aware, in units of frame height) */
const demoTone = (x: number, y: number, h: number, aspect: number, portrait: boolean, sd: string) => {
  const X = x / h;
  const Y = y / h;
  const mcx = aspect * (portrait ? 0.5 : 0.68);
  const mcy = portrait ? 0.3 : 0.34;
  const mr = Math.min(0.21, aspect * 0.3);
  const d = Math.hypot(X - mcx, Y - mcy);
  let t = 0.34 + 0.26 * (1 - Y) + 0.34 * Math.exp(-Math.pow(d / (mr * 1.9), 2));
  if (d < mr) {
    const nz = Math.sqrt(Math.max(0, 1 - (d / mr) ** 2));
    const lx = (X - mcx) / mr;
    const ly = (Y - mcy) / mr;
    const light = Math.max(0, -0.45 * lx - 0.5 * ly + 0.75 * nz);
    t = 0.7 + 0.32 * Math.min(1, light) + 0.1 * n2(sd, X * 9, Y * 9) - 0.05;
  }
  const hill1 = (portrait ? 0.66 : 0.62) + 0.045 * Math.sin(X * (portrait ? 7 : 4.6) + 1) + 0.025 * Math.sin(X * 11 + 2);
  const hill2 = (portrait ? 0.82 : 0.8) + 0.035 * Math.sin(X * (portrait ? 5 : 3.1) + 2.4);
  if (Y > hill1) t = 0.2 + 0.22 * Math.max(0, 1 - (Y - hill1) / 0.07) + 0.03 * n2(sd, X * 14, Y * 14);
  if (Y > hill2) t = 0.05 + 0.04 * n2(sd, X * 10, Y * 10);
  return Math.min(1, Math.max(0, t));
};

const WoodcutCarve: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const m = p.margin * Math.min(w, h);
  const bw = Math.round(w - 2 * m);
  const bh = Math.round(h - 2 * m);
  const cell = Math.max(4, Math.round(6 * u));
  const AW = Math.ceil(bw / cell);
  const AH = Math.ceil(bh / cell);
  const sp = p.sp * u;
  const sd = `wc${p.seed}`;

  // tone grid: from an image (decoded once, delayRender) or the procedural demo
  const [imgTone, setImgTone] = React.useState<Float32Array | null>(null);
  React.useEffect(() => {
    if (!p.src) return;
    const handle = delayRender(`woodcut src ${p.src}`);
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = AW;
        c.height = AH;
        const g = c.getContext('2d');
        if (!g) throw new Error('no 2d context');
        const s = Math.max(AW / im.naturalWidth, AH / im.naturalHeight);
        g.drawImage(im, (AW - im.naturalWidth * s) / 2, (AH - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
        const d = g.getImageData(0, 0, AW, AH).data;
        const out = new Float32Array(AW * AH);
        for (let i = 0; i < AW * AH; i++) out[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;
        setImgTone(out);
        continueRender(handle);
      } catch (e) {
        cancelRender(e as Error);
      }
    };
    im.onerror = () => cancelRender(new Error(`woodcut-carve: cannot load ${p.src}`));
    im.src = resolveSrc(p.src);
  }, [p.src, AW, AH]);

  const cuts: Cut[] = React.useMemo(() => {
    let raw: Float32Array;
    if (p.src) {
      if (!imgTone) return [];
      raw = imgTone;
    } else {
      raw = new Float32Array(AW * AH);
      for (let j = 0; j < AH; j++) for (let i = 0; i < AW; i++) raw[j * AW + i] = demoTone((i + 0.5) * cell, (j + 0.5) * cell, bh, bw / bh, portrait, sd);
    }
    const tone = new Float32Array(AW * AH);
    for (let i = 0; i < tone.length; i++) tone[i] = Math.pow(clamp01((raw[i] - 0.08) / (0.85 - 0.08)), p.gamma);
    const ang = orientationField(tone, AW, AH, p.a0, 4);
    // cuts use the levelled tone (dark -> no cut); lo/hi were already applied so map 0..1 directly
    return buildCuts(tone, ang, AW, AH, bw, bh, {sp, cell, lo: p.black, hi: Math.max(p.black + 0.05, p.white), seed: p.seed, maxCuts: p.maxCuts});
  }, [p.src, imgTone, AW, AH, cell, bw, bh, sp, p.black, p.white, p.gamma, p.a0, p.seed, p.maxCuts, portrait, sd]);

  // reveal keys
  const keys = React.useMemo(() => {
    const raw = cuts.map((c, i) => {
      const jit = (((Math.sin(i * 12.9898 + p.seed) * 43758.5453) % 1) + 1) % 1;
      const j = (jit - 0.5) * 0.12;
      if (p.reveal === 'radial') return Math.hypot(c.px[0] / bw - 0.5, c.cy - 0.5) + j * 0.2;
      if (p.reveal === 'down') return c.cy + j * 0.3;
      return (1 - c.tone) * 0.85 + 0.15 * c.cy + j;
    });
    const lo = Math.min(...raw, 0);
    const hi = Math.max(...raw, 1e-6);
    return raw.map((v) => (v - lo) / Math.max(1e-6, hi - lo));
  }, [cuts, p.reveal, p.seed, bw]);

  const plateP = prog(frame, p.plateFrames[0] ?? 150, p.plateFrames[1] ?? 205, ease.inOut);
  const speedFrames = (len: number) => Math.max(2, (len / (1200 * u)) * 30);

  let whiteFull = '';
  let plateFull = '';
  const partial: {d: string; plate: boolean}[] = [];
  cuts.forEach((c, i) => {
    const start = p.startFrame + keys[i] * Math.max(1, p.durationFrames - 8);
    const dur = speedFrames(c.len);
    const f = clamp01((frame - start) / dur);
    if (f <= 0) return;
    const isPlate = !!p.plateColor && c.tone >= p.plateAbove;
    if (f >= 1) {
      if (isPlate) plateFull += c.d;
      else whiteFull += c.d;
    } else {
      const mm = Math.max(2, Math.ceil(f * (c.px.length - 1)) + 1);
      partial.push({d: cutPath(c.px, c.py, c.nx, c.ny, c.wid, Math.min(mm, c.px.length)), plate: isPlate});
    }
  });
  const whitePartial = partial.filter((q) => !q.plate).map((q) => q.d).join('');
  const platePartial = partial.filter((q) => q.plate).map((q) => q.d).join('');

  // ragged block edge
  const edge = React.useMemo(() => {
    const pts: string[] = [];
    const j = (a: number, b: number) => n2(sd + 'e', a * 0.07, b) * 3.2 * u;
    for (let x = 0; x <= bw; x += 12) pts.push(`${x} ${j(x, 1)}`);
    for (let y = 0; y <= bh; y += 12) pts.push(`${bw + j(y, 2)} ${y}`);
    for (let x = bw; x >= 0; x -= 12) pts.push(`${x} ${bh + j(x, 3)}`);
    for (let y = bh; y >= 0; y -= 12) pts.push(`${j(y, 4)} ${y}`);
    return 'M' + pts.join('L') + 'Z';
  }, [bw, bh, u, sd]);

  const plateCol = p.plateColor || '#E0702B';
  const hasPlate = !!p.plateColor;
  const reg = 3 * u;

  return (
    <AbsoluteFill style={{background: p.paper}}>
      <PaperTexture opacity={0.55} tint="#8a7350" seed={p.seed} />
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id="wc-block">
            <path d={edge} />
          </clipPath>
          <filter id="wc-rough" x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves={2} seed={p.seed} result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale={2.4 * u} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="wc-speckle" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={2} seed={p.seed + 5} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -9 4.6" />
          </filter>
        </defs>
        <g transform={`translate(${m} ${m})`}>
          <g clipPath="url(#wc-block)">
            <rect width={bw} height={bh} fill={p.ink} />
            <rect width={bw} height={bh} fill={p.paper} filter="url(#wc-speckle)" opacity={0.28} />
            {/* carved paper-white cuts */}
            <g filter="url(#wc-rough)">
              <path d={whiteFull + whitePartial} fill={p.paper} />
              {hasPlate ? <path d={plateFull + platePartial} fill={p.paper} /> : null}
            </g>
            {/* colour plate printed in the carved white, slightly out of register */}
            {hasPlate ? (
              <g filter="url(#wc-rough)" opacity={plateP} style={{mixBlendMode: 'multiply'}} transform={`translate(${reg} ${reg * 0.67})`}>
                <path d={plateFull + platePartial} fill={plateCol} />
              </g>
            ) : null}
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const woodcutCarve = defineMotion<Props>({
  id: 'woodcut-carve',
  title: 'Woodcut carve (form-following knife cuts)',
  category: 'image',
  description:
    'A picture turns into a white-line woodcut: thousands of separate knife cuts that wrap around forms (along the isophotes), wide where the image is bright and absent where it is dark, carved in live from highlights to shadows, then printed on paper with a ragged block edge, ink speckle and an optional copper colour plate glowing out of the brightest cuts. Default is a procedural moonlit-hills picture; pass `src` for any image.',
  source: ['lemo-opuscar styles/woodcut demo/engine filter.js, hatch.js, knife.js, print.js (MIT, LemoLab) — own SVG implementation'],
  useFor: 'A very crafted treatment for book trailers, folk / heritage brands, history explainers and editorial portraits: give it any still and it carves it live. Pairs with ken-burns for a push.',
  durationInFrames: 240,
  defaultProps: {
    src: '',
    sp: 7.5,
    black: 0.12,
    white: 1,
    gamma: 1,
    a0: 0.45,
    reveal: 'light',
    startFrame: 14,
    durationFrames: 150,
    ink: '#0F0E0D',
    paper: '#EFE8D8',
    plateColor: '#E0702B',
    plateAbove: 0.8,
    plateFrames: [150, 205],
    seed: 3,
    margin: 0.05,
    maxCuts: 4200,
  },
  propDocs: {
    src: 'image path (public/ or URL); empty = built-in moonlit-hills picture',
    sp: 'spacing between cuts in px at 1080 (5 = fine, 10 = bold)',
    black: 'tone below which nothing is cut (0-1)',
    white: 'tone at which cuts reach full width (0-1)',
    gamma: 'tone curve before cutting',
    a0: 'fallback cut angle in radians where the picture has no direction',
    reveal: "carve order: 'light' (highlights first) | 'radial' | 'down'",
    startFrame: 'frame carving starts',
    durationFrames: 'frames carving takes',
    ink: 'block ink colour',
    paper: 'paper colour (also the colour of the cuts)',
    plateColor: 'colour plate printed in the brightest cuts ("" = none)',
    plateAbove: 'tone above which cuts take the colour plate (0-1)',
    plateFrames: '[from, to] frames the colour plate fades in',
    seed: 'randomness seed',
    margin: 'paper margin as a fraction of the short side',
    maxCuts: 'cap on the number of cuts (performance)',
  },
  component: WoodcutCarve,
  tags: ['woodcut', 'engraving', 'print', 'linocut', 'carve', 'knife', 'image filter', 'relief', 'folk', 'heritage', 'black and white', 'paper', 'photo effect'],
});
