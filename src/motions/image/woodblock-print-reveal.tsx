// Adapted from lemo-opuscar styles/ukiyoe/demo/print.js (buildTextures reveal masks, stampLayer, inkify) + STYLE.md §5/§8 (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {fonts} from '../../core/fonts';
import {n2} from '../../core/random';
import {backOut, cl, eo3, lerp, mixC, PaperFibreRect, seg, sm, stepFrame, useUid} from '../../core/r2-lb3a-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  src: string;
  title: string;
  subtitle: string;
  sealText: string;
  start: number;
  speed: number;
  grain: number;
  speck: number;
  baren: number;
  misregister: number;
  push: number;
  paper: string;
  ink: string;
  prussian: string;
  light: string;
  beni: string;
  ochre: string;
  green: string;
  seed: number;
};

const FPS = 30;
const DW = 1000;
const DH = 620;
const CELL = 20;
const COLS = Math.ceil((DW + 240) / CELL);
const ROWS = Math.ceil((DH + 240) / CELL);

type Block = {key: string; reg: [number, number]; at: number; dur: number; el: React.ReactNode};

const WoodblockReveal: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const uid = useUid('wpr');
  const f8 = stepFrame(frame, 8);
  const peach = mixC(p.beni, p.paper, 0.62);
  const pale = mixC(p.light, p.paper, 0.45);

  // frame placement
  const fw = portrait ? w * 0.88 : w * 0.82;
  const fh = portrait ? Math.min(h * 0.62, fw * 1.05) : h * 0.8;
  const fx = (w - fw) / 2;
  const fy = (h - fh) / 2 - (portrait ? h * 0.03 : 0);

  /* ───── the default print: a harbour at first light ───── */
  const bob = Math.sin(f8 * 0.11) * 3;
  const sway = Math.sin(f8 * 0.09) * 2.5;
  const scallops = (y: number, r: number, off: number, x0 = -120, x1 = DW + 120) => {
    let d = '';
    for (let x = x0 + off; x < x1; x += r * 2) d += `M${x} ${y}a${r} ${r} 0 0 1 ${r * 2} 0`;
    return d;
  };
  const sea = (k: number) => 372 + k * 30;
  const boat = (layer: 'key' | 'ochre' | 'red' | 'sail') => {
    const tx = `translate(${560 + sway * 0.6} ${446 + bob})`;
    const hull = 'M-88 0Q-60 34 4 36Q70 34 98 -8L74 -5Q6 10-78 -6Z';
    if (layer === 'ochre') return <g transform={tx}><path d={hull} fill={p.ochre} /><path d="M-70 4Q0 22 86 -2L80 6Q4 30-62 12Z" fill={mixC(p.ochre, '#7A4A22', 0.35)} /></g>;
    if (layer === 'red') return <g transform={tx}><path d="M4 -128l34 10-34 12Z" fill={p.beni} /><path d="M-26 -88L40 -92 36 -64-22 -62Z" fill={p.beni} opacity={0.9} /></g>;
    return (
      <g transform={tx} fill="none" stroke={p.ink} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round">
        <path d={hull} />
        <path d="M4 -4V-132" strokeWidth={3} />
        <path d="M-52 -14L-32 -112Q6 -126 38 -108L58 -12Z" />
        {[-18, 6, 28].map((x, i) => <path key={i} d={`M${x} ${-118 + i * 2}L${x + 8} -14`} strokeWidth={1.4} />)}
        <path d="M4 -132L38 -122 4 -112" strokeWidth={1.6} />
        <path d="M-96 8Q-60 18-30 14" strokeWidth={1.4} opacity={0.7} />
      </g>
    );
  };
  const pine = (layer: 'key' | 'green') => {
    const pads: [number, number, number][] = [[170, 212, 62], [215, 178, 48], [140, 160, 40], [190, 140, 34]];
    if (layer === 'green') {
      return (
        <g>
          <path d="M-40 360Q60 300 150 306Q260 296 330 358L330 380-40 380Z" fill={p.green} />
          {pads.map(([x, y, r], i) => <ellipse key={i} cx={x + sway * 0.4} cy={y} rx={r * 1.25} ry={r * 0.52} fill={i % 2 ? mixC(p.green, '#ffffff', 0.12) : mixC(p.green, '#1f3a1f', 0.25)} />)}
        </g>
      );
    }
    return (
      <g fill="none" stroke={p.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M-40 360Q60 300 150 306Q260 296 330 358" />
        <path d="M176 306Q170 260 184 226Q196 192 186 150" strokeWidth={5} />
        {pads.map(([x, y, r], i) => <ellipse key={'e' + i} cx={x + sway * 0.4} cy={y} rx={r * 1.25} ry={r * 0.52} strokeWidth={2.2} />)}
        {Array.from({length: 7}, (_, i) => <path key={'r' + i} d={`M${60 + i * 38} ${334 - (i % 3) * 6}l12 ${14 + (i % 2) * 6}`} strokeWidth={1.4} opacity={0.8} />)}
      </g>
    );
  };
  const birds = (layer: 'key') =>
    layer === 'key' && (
      <g fill="none" stroke={p.ink} strokeWidth={2.4} strokeLinecap="round">
        {[[420, 150], [455, 126], [492, 160]].map(([x, y], i) => {
          const fl = Math.sin(f8 * 0.22 + i * 1.7) * 7;
          return <path key={i} d={`M${x - 16} ${y + fl}Q${x - 5} ${y - 6} ${x} ${y}Q${x + 5} ${y - 6} ${x + 16} ${y + fl}`} />;
        })}
      </g>
    );

  const defaultBlocks = (): Block[] => {
    const T = [0.33, 0.93, 1.4, 1.83, 2.2, 2.5].map((s) => (s / p.speed + p.start) * FPS);
    const Dd = [0.46, 0.4, 0.36, 0.33, 0.3, 0.3].map((s) => (s / p.speed) * FPS);
    const m = p.misregister;
    const key = (
      <g>
        {birds('key')}
        <path d="M-60 336Q70 316 160 322T330 332Q420 318 520 330T760 320Q870 310 1100 330" fill="none" stroke={p.ink} strokeWidth={2.2} />
        <path d="M600 330Q690 262 770 258Q850 262 940 330" fill="none" stroke={p.ink} strokeWidth={2.6} />
        <path d="M-60 372H1100" stroke={p.ink} strokeWidth={2.4} />
        {Array.from({length: 7}, (_, k) => (
          <path key={k} d={scallops(sea(k) + 22, 14 + k * 1.4, (k % 2) * 14 + (f8 % 60) * 0.14 * (k % 2 ? 1 : -1))} fill="none" stroke={p.ink} strokeWidth={1.5 + k * 0.12} opacity={0.85} />
        ))}
        {boat('key')}
        {pine('key')}
      </g>
    );
    const skyHills = (
      <g>
        <defs>
          <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.light} stopOpacity="0.95" />
            <stop offset="1" stopColor={p.light} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x={-120} y={-120} width={DW + 240} height={460} fill={`url(#${uid}-sky)`} />
        <path d="M600 332Q690 262 770 258Q850 262 940 332Z" fill={mixC(p.light, p.prussian, 0.2)} />
        <path d="M-60 338Q70 316 160 322T330 334L330 372-60 372Z" fill={mixC(p.prussian, p.light, 0.35)} />
        <path d="M330 334Q420 318 520 330T760 322Q870 310 1100 332V372H330Z" fill={pale} />
      </g>
    );
    const seaBlue = (
      <g>
        {Array.from({length: 8}, (_, k) => (
          <rect key={k} x={-120} y={sea(k) - 2} width={DW + 240} height={32} fill={mixC(p.light, p.prussian, 0.15 + k * 0.12)} opacity={k % 2 ? 0.95 : 0.78} />
        ))}
        {Array.from({length: 7}, (_, k) => (
          <path key={'w' + k} d={scallops(sea(k) + 22, 14 + k * 1.4, (k % 2) * 14 + (f8 % 60) * 0.14 * (k % 2 ? 1 : -1))} fill="none" stroke={mixC(p.prussian, '#000', 0.25)} strokeWidth={4 + k * 0.5} opacity={0.55} />
        ))}
      </g>
    );
    const greens = <g>{pine('green')}</g>;
    const ochres = <g>{boat('ochre')}<path d="M300 372H620V380Q480 390 300 380Z" fill={p.ochre} opacity={0.55} /></g>;
    const reds = (
      <g>
        <defs>
          <linearGradient id={`${uid}-dawn`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={peach} stopOpacity="0" />
            <stop offset="1" stopColor={peach} stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <rect x={-120} y={180} width={DW + 240} height={150} fill={`url(#${uid}-dawn)`} />
        <circle cx={740} cy={214} r={74} fill={mixC(p.beni, p.paper, 0.55)} opacity={0.8} />
        <circle cx={740} cy={214} r={56} fill={p.beni} />
        {boat('red')}
        <rect x={706} y={382} width={68} height={7} rx={3} fill={p.beni} opacity={0.55} />
        <rect x={714} y={402} width={48} height={6} rx={3} fill={p.beni} opacity={0.4} />
      </g>
    );
    return [
      {key: 'key', reg: [0, 0], at: T[0], dur: Dd[0], el: key},
      {key: 'sky', reg: [2.2 * m, -1.3 * m], at: T[1], dur: Dd[1], el: skyHills},
      {key: 'sea', reg: [1.8 * m, -1.0 * m], at: T[2], dur: Dd[2], el: seaBlue},
      {key: 'green', reg: [-1.8 * m, 1.9 * m], at: T[3], dur: Dd[3], el: greens},
      {key: 'ochre', reg: [1.0 * m, 1.5 * m], at: T[4], dur: Dd[4], el: ochres},
      {key: 'red', reg: [1.5 * m, 2.2 * m], at: T[5], dur: Dd[5], el: reds},
    ];
  };

  /** auto mode: posterise a photo into luminance bands printed as blocks */
  const autoBlocks = (): Block[] => {
    const T = [0.33, 0.93, 1.5, 2.05, 2.5].map((s) => (s / p.speed + p.start) * FPS);
    const Dd = [0.46, 0.4, 0.36, 0.33, 0.3].map((s) => (s / p.speed) * FPS);
    const bands: {name: string; lo: number; hi: number; col: string}[] = [
      {name: 'key', lo: 0, hi: 2, col: p.ink},
      {name: 'b1', lo: 2, hi: 4, col: p.prussian},
      {name: 'b2', lo: 4, hi: 6, col: p.light},
      {name: 'b3', lo: 6, hi: 8, col: p.ochre},
      {name: 'b4', lo: 8, hi: 9, col: peach},
    ];
    return bands.map((b, i) => {
      const c = b.col.replace('#', '');
      const [r, g, bl] = [0, 2, 4].map((o) => parseInt(c.slice(o, o + 2), 16) / 255);
      const table = Array.from({length: 10}, (_, k) => (k >= b.lo && k < b.hi ? 1 : 0)).join(' ');
      return {
        key: b.name, reg: [[0, 0], [2.2, -1.3], [-1.8, 1.9], [1.0, 1.5], [1.5, 2.2]][i].map((v) => v * p.misregister) as [number, number], at: T[i], dur: Dd[i],
        el: (
          <g>
            <filter id={`${uid}-band${i}`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values={`0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${bl}  0.3 0.59 0.11 0 0`} />
              <feComponentTransfer><feFuncA type="discrete" tableValues={table} /></feComponentTransfer>
            </filter>
            <image href={resolveSrc(p.src)} x={0} y={0} width={DW} height={DH} preserveAspectRatio="xMidYMid slice" filter={`url(#${uid}-band${i})`} />
          </g>
        ),
      };
    });
  };

  const blocks = p.src ? autoBlocks() : defaultBlocks();

  // per-block ragged-diagonal reveal thresholds (computed once)
  const thresholds = React.useMemo(
    () =>
      blocks.map((_, bi) => {
        const arr = new Float32Array(COLS * ROWS);
        for (let r = 0; r < ROWS; r++)
          for (let c = 0; c < COLS; c++) {
            const x = (c * CELL - 120) / DW;
            const y = (r * CELL - 120) / DH;
            const diag = cl(((x * 0.75 + y * 0.25) + 0.15) / 1.15);
            const nn = 0.5 + 0.5 * (n2(`wb${p.seed}-${bi}`, c * 0.21, r * 0.21) * 0.65 + n2(`wc${p.seed}-${bi}`, c * 0.55, r * 0.55) * 0.35);
            arr[r * COLS + c] = diag * 0.62 + nn * 0.38;
          }
        return arr;
      }),
    [blocks.length, p.seed], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const maskPath = (bi: number, level: number) => {
    const th = thresholds[bi];
    let d = '';
    for (let r = 0; r < ROWS; r++) {
      let c = 0;
      while (c < COLS) {
        if (th[r * COLS + c] < level) {
          let e = c;
          while (e < COLS && th[r * COLS + e] < level) e++;
          d += `M${c * CELL - 120} ${r * CELL - 120}h${(e - c) * CELL}v${CELL}h${-(e - c) * CELL}z`;
          c = e;
        } else c++;
      }
    }
    return d;
  };

  const blockEls = blocks.map((b, bi) => {
    const rev = seg(frame, b.at, b.at + b.dur);
    if (rev <= 0) return null;
    const q = Math.floor(rev * 12.999) / 12; // 12 quantised levels
    const lvl = rev >= 1 ? 2 : q * 1.12;
    const slide = 1 - sm(Math.min(1, rev * 1.6));
    const tx = b.reg[0] + 5 * slide;
    const ty = b.reg[1] - 4 * slide;
    return (
      <g key={b.key}>
        {rev < 1 && (
          <mask id={`${uid}-rm${bi}`} maskUnits="userSpaceOnUse" x={-120} y={-120} width={DW + 240} height={DH + 240}>
            <g filter={`url(#${uid}-goo)`}>
              <path d={maskPath(bi, lvl)} fill="#fff" />
            </g>
          </mask>
        )}
        <g mask={rev < 1 ? `url(#${uid}-rm${bi})` : undefined}>
          <g transform={`translate(${tx} ${ty})`}>{b.el}</g>
        </g>
      </g>
    );
  });

  // cartouche + seal
  const cartIn = eo3(seg(frame, 108 / p.speed + p.start * FPS, 122 / p.speed + p.start * FPS));
  const sealT = (frame - (128 / p.speed + p.start * FPS)) / 6;
  const sealK = sealT < 0 ? 0 : lerp(1.35, 1, eo3(sealT));
  const cartW = Math.min(fw * 0.62, Math.max(p.title.length * 17 * u + 110 * u, 300 * u));
  const cartH = 78 * u;
  const cartX = fx + 22 * u;
  const cartY = fy + 22 * u;
  const seal = 66 * u;
  const camS = lerp(1, 1 + p.push, sm(frame / 210));

  return (
    <AbsoluteFill style={{background: p.paper, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={`${uid}-goo`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={8} />
            <feComponentTransfer><feFuncA type="linear" slope={14} intercept={-6.2} /></feComponentTransfer>
          </filter>
          <filter id={`${uid}-tex`} filterUnits="userSpaceOnUse" x={-120} y={-120} width={DW + 240} height={DH + 240} colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.004 0.05" numOctaves={3} seed={p.seed + 2} result="gn" />
            <feColorMatrix in="gn" type="matrix" values={`0 0 0 0 0.12  0 0 0 0 0.07  0 0 0 0 0.04  ${1.25 * p.grain} 0 0 0 ${-0.62 * p.grain}`} result="gr" />
            <feComposite in="gr" in2="SourceAlpha" operator="in" result="grain" />
            <feTurbulence type="fractalNoise" baseFrequency="0.006 0.02" numOctaves={2} seed={p.seed + 9} result="bn" />
            <feColorMatrix in="bn" type="matrix" values={`0 0 0 0 0.96  0 0 0 0 0.92  0 0 0 0 0.82  ${1.2 * p.baren} 0 0 0 ${-0.56 * p.baren}`} result="br" />
            <feComposite in="br" in2="SourceAlpha" operator="in" result="baren" />
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={1} seed={p.seed + 4} result="sn" />
            <feColorMatrix in="sn" type="matrix" values={`0 0 0 0 0.93  0 0 0 0 0.88  0 0 0 0 0.77  ${16 * p.speck} 0 0 0 ${-10.6 * p.speck}`} result="sp" />
            <feComposite in="sp" in2="SourceAlpha" operator="in" result="speck" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="grain" />
              <feMergeNode in="baren" />
              <feMergeNode in="speck" />
            </feMerge>
          </filter>
          <filter id={`${uid}-chip`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves={2} seed={3} result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale={4 * u} />
          </filter>
          <clipPath id={`${uid}-frame`}>
            <rect x={fx} y={fy} width={fw} height={fh} />
          </clipPath>
        </defs>
        <PaperFibreRect id={uid} w={w} h={h} paper={p.paper} fibre={0.09} seed={p.seed + 1} />
        <g transform={`translate(${w / 2} ${h / 2}) scale(${camS}) translate(${-w / 2} ${-h / 2})`}>
          <g clipPath={`url(#${uid}-frame)`}>
            <svg x={fx} y={fy} width={fw} height={fh} viewBox={`0 0 ${DW} ${DH}`} preserveAspectRatio="xMidYMid slice" overflow="hidden">
              <g filter={`url(#${uid}-tex)`}>{blockEls}</g>
            </svg>
          </g>
          {/* double border: thick + thin outside */}
          <rect x={fx} y={fy} width={fw} height={fh} fill="none" stroke={p.ink} strokeWidth={3.4 * u} opacity={seg(frame, 6, 14)} />
          <rect x={fx - 9 * u} y={fy - 9 * u} width={fw + 18 * u} height={fh + 18 * u} fill="none" stroke={p.ink} strokeWidth={1 * u} opacity={seg(frame, 6, 14)} />
          {cartIn > 0 && (
            <g opacity={cartIn} transform={`translate(0 ${(1 - cartIn) * -14 * u})`}>
              <rect x={cartX} y={cartY} width={cartW} height={cartH} fill="#F3E7C6" stroke={p.ink} strokeWidth={2.6 * u} />
              <rect x={cartX + 5 * u} y={cartY + 5 * u} width={cartW - 10 * u} height={cartH - 10 * u} fill="none" stroke={p.ink} strokeWidth={1 * u} />
              <text x={cartX + 24 * u} y={cartY + cartH * 0.5} fontFamily={fonts.serif} fontWeight={700} fontSize={Math.min(26 * u, ((cartW - 48 * u) / Math.max(8, p.title.length)) * 1.65)} fill={p.ink} letterSpacing={2 * u}>
                {p.title.toUpperCase()}
              </text>
              <text x={cartX + 24 * u} y={cartY + cartH * 0.8} fontFamily={fonts.serif} fontSize={15 * u} fill={mixC(p.ink, p.paper, 0.2)} letterSpacing={3 * u}>
                {p.subtitle.toUpperCase()}
              </text>
            </g>
          )}
          {sealK > 0 && (
            <g transform={`translate(${fx + fw - seal - 26 * u} ${fy + fh - seal - 26 * u}) translate(${seal / 2} ${seal / 2}) scale(${sealK}) translate(${-seal / 2} ${-seal / 2})`} opacity={cl(sealT * 2)}>
              <g filter={`url(#${uid}-chip)`}>
                <rect width={seal} height={seal} fill={p.beni} />
                <rect x={5 * u} y={5 * u} width={seal - 10 * u} height={seal - 10 * u} fill="none" stroke={p.paper} strokeWidth={2.4 * u} opacity={0.9} />
                <text x={seal / 2} y={seal * 0.66} textAnchor="middle" fontFamily={fonts.serif} fontWeight={700} fontSize={seal * (p.sealText.length > 2 ? 0.34 : 0.5)} fill={p.paper}>
                  {p.sealText}
                </text>
              </g>
            </g>
          )}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const woodblockPrintReveal = defineMotion<Props>({
  id: 'woodblock-print-reveal',
  title: 'Woodblock print reveal',
  category: 'image',
  description:
    'On a blank washi sheet an original ukiyo-e harbour print is "printed": the black key-line block lands first, then each colour block (blues, sea bands, green, ochre, vermilion) is revealed by a ragged diagonal baren-sweep in 12 quantised steps, sliding a few pixels into slightly imperfect register, with woodgrain, baren unevenness and goma-zuri specks in every block; a double border draws, the title cartouche drops in and a chipped red seal stamps. Nature moves on eights. With src the photo is posterised into luminance blocks and printed the same way.',
  source: ['lemo-opuscar styles/ukiyoe/demo/print.js, STYLE.md §5 §8 (MIT, LemoLab) — original composition, not a famous print'],
  useFor: '"Printing" a logo, illustration, map or product shot into existence; heritage / craft / Japanese-themed openers; any multi-layer reveal (riso, screen-print).',
  durationInFrames: 210,
  defaultProps: {
    src: '', title: 'Harbour at first light', subtitle: 'a woodblock study', sealText: 'MG', start: 0.2, speed: 1,
    grain: 0.7, speck: 1, baren: 0.8, misregister: 1, push: 0.04, paper: '#EEE2C6', ink: '#231F1C', prussian: '#1D3A66', light: '#8DB0C6', beni: '#B8412F', ochre: '#CF9F4A', green: '#7A9650', seed: 4,
  },
  propDocs: {
    src: 'optional image in public/ — posterised into 5 luminance blocks and printed instead of the built-in harbour',
    title: 'cartouche title', subtitle: 'cartouche second line', sealText: '1–3 characters on the red seal',
    start: 'seconds before the first block prints', speed: 'print pace multiplier (1 = ~0.35 s per block)',
    grain: 'woodgrain strength 0–2', speck: 'goma-zuri speck strength 0–2', baren: 'baren-rub unevenness 0–2', misregister: 'block registration offset multiplier (0 = perfect register)',
    push: 'slow camera push over the clip (0.04 = 4 %)', paper: 'washi colour', ink: 'key-block ink', prussian: 'deep blue', light: 'pale blue', beni: 'vermilion', ochre: 'ochre / straw', green: 'green', seed: 'texture + reveal-noise seed',
  },
  component: WoodblockReveal,
  tags: ['woodblock', 'ukiyo-e', 'print', 'japanese', 'reveal', 'baren', 'washi', 'seal', 'cartouche', 'heritage', 'craft', 'screen print', 'riso', 'misregister', 'opener', 'image'],
});
