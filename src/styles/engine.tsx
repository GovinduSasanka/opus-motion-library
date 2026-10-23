import React from 'react';
import {AbsoluteFill, Freeze, useCurrentFrame} from 'remotion';
import {useStage} from '../core/stage';

/**
 * Style engine. A style is a visual language (woodcut, risograph, ink wash, blueprint, pixel…) that can be applied
 * to ANY motion: the scene is rendered normally, then passed through one SVG filter chain (`steps`), finished with
 * HTML overlays (paper, grain, scanlines, vignette, letterbox, deckle frame), and optionally re-timed ("on twos").
 * Because the filter works on pixels, one style restyles all motions with no per-motion code.
 */
export type FilterStep =
  | {type: 'saturate'; value: number}
  | {type: 'contrast'; value: number; mid?: number}
  | {type: 'brightness'; value: number}
  | {type: 'posterize'; levels: number}
  | {type: 'gradientMap'; ramp: string[]; discrete?: boolean}
  | {type: 'threshold'; at: number; ink: string; paper: string}
  | {type: 'pixelate'; size: number}
  | {type: 'blur'; radius: number}
  | {type: 'edges'; color: string; strength?: number; width?: number}
  | {type: 'halftone'; size: number; angle?: number; ink: string; paper?: string}
  | {type: 'lines'; gap: number; angle?: number; ink: string; paper?: string}
  | {type: 'misregister'; dx: number; dy: number; color: string; opacity?: number}
  | {type: 'wobble'; scale: number; frequency?: number; boil?: number}
  | {type: 'bleed'; radius: number; strength?: number}
  | {type: 'grain'; amount: number; size?: number}
  | {type: 'tint'; color: string; mode?: 'multiply' | 'screen'; amount?: number}
  | {type: 'glow'; radius: number; amount?: number};

export interface StyleOverlays {
  /** paper / canvas colour multiplied over the frame (0..1 strength) */
  paper?: {color: string; amount: number; fiber?: number};
  vignette?: {amount: number; color?: string};
  scanlines?: {gap: number; opacity: number};
  letterbox?: {aspect: number; color?: string};
  /** ragged printed / torn border */
  deckle?: {color: string; size: number};
  /** thin inset frame line */
  frameLine?: {color: string; inset: number; width?: number};
  /** animated film grain (re-seeded every 2 frames) */
  filmGrain?: number;
  /** soft light leak / sheen */
  leak?: {color: string; amount: number};
}

export interface StyleDef {
  id: string;
  name: string;
  family: 'print' | 'paint' | 'drawing' | 'screen' | 'photo' | 'craft' | 'graphic' | 'retro' | 'technical';
  description: string;
  /** what it suits, for agents */
  useFor: string;
  palette: {bg: string; paper: string; ink: string; accent: string; accent2?: string; swatches: string[]};
  steps: FilterStep[];
  overlays?: StyleOverlays;
  /** hold every drawing N frames (2 = "on twos", 12 fps feel at 24 fps) */
  step?: number;
  fonts?: {display: string; body: string};
  tags: string[];
  /** where the idea comes from (repo/path + licence, or "original") */
  source?: string;
}

const LUMA = '0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0';
const hex = (s: string): [number, number, number] => {
  const h = s.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  return [parseInt(f.slice(0, 2), 16) / 255, parseInt(f.slice(2, 4), 16) / 255, parseInt(f.slice(4, 6), 16) / 255];
};
const table = (ramp: string[], ch: 0 | 1 | 2) => ramp.map((c) => hex(c)[ch].toFixed(4)).join(' ');

/** builds the <filter> primitives for a step list; each step reads `prev` and writes a new result */
const buildSteps = (steps: FilterStep[], u: number, frame: number): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  let prev = 'SourceGraphic';
  steps.forEach((s, i) => {
    const r = `s${i}`;
    const k = (n: string) => `${r}${n}`;
    switch (s.type) {
      case 'saturate':
        out.push(<feColorMatrix key={r} in={prev} type="saturate" values={String(s.value)} result={r} />);
        break;
      case 'contrast': {
        const m = s.mid ?? 0.5;
        const sl = s.value;
        out.push(
          <feComponentTransfer key={r} in={prev} result={r}>
            <feFuncR type="linear" slope={sl} intercept={m - m * sl} />
            <feFuncG type="linear" slope={sl} intercept={m - m * sl} />
            <feFuncB type="linear" slope={sl} intercept={m - m * sl} />
          </feComponentTransfer>,
        );
        break;
      }
      case 'brightness':
        out.push(
          <feComponentTransfer key={r} in={prev} result={r}>
            <feFuncR type="linear" slope={s.value} />
            <feFuncG type="linear" slope={s.value} />
            <feFuncB type="linear" slope={s.value} />
          </feComponentTransfer>,
        );
        break;
      case 'posterize': {
        const n = Math.max(2, s.levels);
        const t = Array.from({length: n}, (_, j) => (j / (n - 1)).toFixed(3)).join(' ');
        out.push(
          <feComponentTransfer key={r} in={prev} result={r}>
            <feFuncR type="discrete" tableValues={t} />
            <feFuncG type="discrete" tableValues={t} />
            <feFuncB type="discrete" tableValues={t} />
          </feComponentTransfer>,
        );
        break;
      }
      case 'gradientMap': {
        const type = s.discrete ? 'discrete' : 'table';
        out.push(<feColorMatrix key={k('l')} in={prev} type="matrix" values={LUMA} result={k('l')} />);
        out.push(
          <feComponentTransfer key={r} in={k('l')} result={r}>
            <feFuncR type={type} tableValues={table(s.ramp, 0)} />
            <feFuncG type={type} tableValues={table(s.ramp, 1)} />
            <feFuncB type={type} tableValues={table(s.ramp, 2)} />
          </feComponentTransfer>,
        );
        break;
      }
      case 'threshold': {
        const steps2 = 40;
        const cut = Math.round(s.at * steps2);
        const col = (c: string, ch: 0 | 1 | 2) => hex(c)[ch].toFixed(4);
        const tv = (ch: 0 | 1 | 2) => Array.from({length: steps2}, (_, j) => (j < cut ? col(s.ink, ch) : col(s.paper, ch))).join(' ');
        out.push(<feColorMatrix key={k('l')} in={prev} type="matrix" values={LUMA} result={k('l')} />);
        out.push(
          <feComponentTransfer key={r} in={k('l')} result={r}>
            <feFuncR type="discrete" tableValues={tv(0)} />
            <feFuncG type="discrete" tableValues={tv(1)} />
            <feFuncB type="discrete" tableValues={tv(2)} />
          </feComponentTransfer>,
        );
        break;
      }
      case 'pixelate': {
        const size = Math.max(2, Math.round(s.size * u));
        const half = Math.floor(size / 2);
        out.push(<feFlood key={k('d')} x={half} y={half} width="1" height="1" floodColor="#000" result={k('d')} />);
        out.push(<feComposite key={k('c')} in={k('d')} in2={k('d')} width={size} height={size} x="0" y="0" result={k('c')} />);
        out.push(<feTile key={k('t')} in={k('c')} result={k('t')} />);
        out.push(<feComposite key={k('s')} in={prev} in2={k('t')} operator="in" result={k('s')} />);
        out.push(<feMorphology key={r} in={k('s')} operator="dilate" radius={half} result={r} />);
        break;
      }
      case 'blur':
        out.push(<feGaussianBlur key={r} in={prev} stdDeviation={s.radius * u} result={r} />);
        break;
      case 'edges': {
        const w = s.width ?? 1;
        const [R, G, B] = hex(s.color);
        const st = s.strength ?? 6;
        out.push(<feColorMatrix key={k('l')} in={prev} type="matrix" values={LUMA} result={k('l')} />);
        if (w > 1) out.push(<feGaussianBlur key={k('b')} in={k('l')} stdDeviation={(w - 1) * 0.6 * u} result={k('b')} />);
        out.push(<feConvolveMatrix key={k('e')} in={w > 1 ? k('b') : k('l')} order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result={k('e')} />);
        // edge magnitude -> alpha of an ink layer
        out.push(<feColorMatrix key={k('a')} in={k('e')} type="matrix" values={`0 0 0 0 ${R}  0 0 0 0 ${G}  0 0 0 0 ${B}  ${st} 0 0 0 0`} result={k('a')} />);
        out.push(<feComposite key={r} in={k('a')} in2={prev} operator="over" result={r} />);
        break;
      }
      case 'halftone':
      case 'lines': {
        const size = Math.max(3, Math.round((s.type === 'halftone' ? s.size : s.gap) * u));
        const ang = s.angle ?? 45;
        // screen cell built from flood primitives (feImage data URIs are unreliable inside CSS filters)
        const n = Math.min(12, size);
        const px = size / n;
        const floods: React.ReactNode[] = [];
        for (let yy = 0; yy < n; yy++)
          for (let xx = 0; xx < (s.type === 'halftone' ? n : 1); xx++) {
            const cx = (xx + 0.5) / n - 0.5;
            const cy = (yy + 0.5) / n - 0.5;
            const v = s.type === 'halftone' ? Math.max(0, 1 - Math.hypot(cx, cy) / 0.7071) : 1 - Math.abs(cy) * 2;
            const g = Math.round(v * 255);
            floods.push(<feFlood key={k(`f${yy}_${xx}`)} x={xx * px} y={yy * px} width={s.type === 'halftone' ? px + 0.5 : size} height={px + 0.5} floodColor={`rgb(${g},${g},${g})`} result={k(`f${yy}_${xx}`)} />);
          }
        out.push(...floods);
        out.push(
          <feMerge key={k('m0')} x="0" y="0" width={size} height={size} result={k('i')}>
            {floods.map((f) => (
              <feMergeNode key={(f as React.ReactElement<{result: string}>).props.result} in={(f as React.ReactElement<{result: string}>).props.result} />
            ))}
          </feMerge>,
        );
        out.push(<feTile key={k('t')} in={k('i')} result={k('t')} />);
        void ang;
        // compare in the alpha channel (arithmetic composites also act on alpha):
        // a = 0.5 + screen - luma  ->  > 0.5 means ink
        out.push(<feColorMatrix key={k('la')} in={prev} type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.2126 0.7152 0.0722 0 0" result={k('la')} />);
        out.push(<feColorMatrix key={k('ta')} in={k('t')} type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result={k('ta')} />);
        out.push(<feComposite key={k('da')} in={k('la')} in2={k('ta')} operator="arithmetic" k1="0" k2="-1" k3="1" k4="0.5" result={k('da')} />);
        out.push(<feColorMatrix key={k('d')} in={k('da')} type="matrix" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1" result={k('d')} />);
        const ink = hex(s.ink);
        const paper = hex(s.paper ?? '#ffffff');
        out.push(
          <feComponentTransfer key={k('m')} in={k('d')} result={k('m')}>
            <feFuncR type="discrete" tableValues={`${paper[0]} ${ink[0]}`} />
            <feFuncG type="discrete" tableValues={`${paper[1]} ${ink[1]}`} />
            <feFuncB type="discrete" tableValues={`${paper[2]} ${ink[2]}`} />
            <feFuncA type="table" tableValues="1 1" />
          </feComponentTransfer>,
        );
        out.push(<feComposite key={r} in={k('m')} in2={prev} operator="in" result={r} />);
        break;
      }
      case 'misregister': {
        const [R, G, B] = hex(s.color);
        out.push(<feOffset key={k('o')} in={prev} dx={s.dx * u} dy={s.dy * u} result={k('o')} />);
        out.push(<feColorMatrix key={k('c')} in={k('o')} type="matrix" values={`0 0 0 0 ${R}  0 0 0 0 ${G}  0 0 0 0 ${B}  -0.33 -0.33 -0.33 1 0`} result={k('c')} />);
        out.push(<feComponentTransfer key={k('a')} in={k('c')} result={k('a')}><feFuncA type="linear" slope={s.opacity ?? 0.5} /></feComponentTransfer>);
        out.push(<feBlend key={r} in={k('a')} in2={prev} mode="multiply" result={r} />);
        break;
      }
      case 'wobble': {
        const seed = s.boil ? Math.floor(frame / s.boil) % 50 : 3;
        out.push(<feTurbulence key={k('n')} type="fractalNoise" baseFrequency={(s.frequency ?? 0.02) / Math.max(0.5, u)} numOctaves={2} seed={seed} result={k('n')} />);
        out.push(<feDisplacementMap key={r} in={prev} in2={k('n')} scale={s.scale * u} xChannelSelector="R" yChannelSelector="G" result={r} />);
        break;
      }
      case 'bleed': {
        // watercolour edge darkening: source darkened where it differs from a blurred copy
        out.push(<feGaussianBlur key={k('b')} in={prev} stdDeviation={s.radius * u} result={k('b')} />);
        const st = s.strength ?? 0.6;
        out.push(<feComposite key={k('d')} in={prev} in2={k('b')} operator="arithmetic" k1="0" k2={1 + st} k3={-st} k4="0" result={k('d')} />);
        out.push(<feBlend key={r} in={k('d')} in2={k('b')} mode="multiply" result={r} />);
        break;
      }
      case 'grain': {
        const seed = Math.floor(frame / 2) % 60;
        out.push(<feTurbulence key={k('n')} type="fractalNoise" baseFrequency={(s.size ?? 0.9) / Math.max(0.5, u)} numOctaves={1} seed={seed} result={k('n')} />);
        out.push(<feColorMatrix key={k('g')} in={k('n')} type="matrix" values={LUMA} result={k('g')} />);
        out.push(<feComposite key={r} in={prev} in2={k('g')} operator="arithmetic" k1="0" k2="1" k3={s.amount} k4={-s.amount / 2} result={r} />);
        break;
      }
      case 'tint':
        out.push(<feFlood key={k('f')} floodColor={s.color} floodOpacity={s.amount ?? 1} result={k('f')} />);
        out.push(<feBlend key={r} in={k('f')} in2={prev} mode={s.mode ?? 'multiply'} result={r} />);
        break;
      case 'glow':
        out.push(<feGaussianBlur key={k('b')} in={prev} stdDeviation={s.radius * u} result={k('b')} />);
        out.push(<feComposite key={r} in={prev} in2={k('b')} operator="arithmetic" k1="0" k2="1" k3={s.amount ?? 0.6} k4="0" result={r} />);
        break;
    }
    prev = r;
  });
  // re-assert opaque alpha so arithmetic steps never leave the frame translucent
  out.push(
    <feComponentTransfer key="alpha" in={prev}>
      <feFuncA type="table" tableValues="1 1" />
    </feComponentTransfer>,
  );
  return out;
};

const Overlays: React.FC<{o: StyleOverlays}> = ({o}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const lb = o.letterbox ? Math.max(0, (h - w / o.letterbox.aspect) / 2) : 0;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {o.paper && (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: o.paper.amount}}>
          <filter id={`pf${id}`}>
            <feTurbulence type="fractalNoise" baseFrequency={0.8} numOctaves={3} seed={5} />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues={`0 ${o.paper.fiber ?? 0.35}`} />
            </feComponentTransfer>
          </filter>
          <rect width={w} height={h} fill={o.paper.color} />
          <rect width={w} height={h} filter={`url(#pf${id})`} />
        </svg>
      )}
      {o.leak && <AbsoluteFill style={{background: `radial-gradient(ellipse at 85% 10%, ${o.leak.color} 0%, transparent 55%)`, opacity: o.leak.amount * (0.8 + 0.2 * Math.sin(frame / 23)), mixBlendMode: 'screen'}} />}
      {o.scanlines && (
        <AbsoluteFill style={{opacity: o.scanlines.opacity, backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.9) 0px, rgba(0,0,0,0.9) ${Math.max(1, u)}px, transparent ${Math.max(1, u)}px, transparent ${o.scanlines.gap * u}px)`}} />
      )}
      {o.filmGrain ? (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: o.filmGrain, mixBlendMode: 'overlay'}}>
          <filter id={`fg${id}`}>
            <feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={2} seed={Math.floor(frame / 2) % 97} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width={w} height={h} filter={`url(#fg${id})`} />
        </svg>
      ) : null}
      {o.vignette && <AbsoluteFill style={{background: `radial-gradient(ellipse at center, transparent 50%, ${o.vignette.color ?? 'rgba(0,0,0,1)'} 135%)`, opacity: o.vignette.amount}} />}
      {o.frameLine && <div style={{position: 'absolute', inset: o.frameLine.inset * u, border: `${(o.frameLine.width ?? 1.5) * u}px solid ${o.frameLine.color}`}} />}
      {o.deckle && (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <filter id={`dk${id}`}>
            <feTurbulence type="fractalNoise" baseFrequency={0.04} numOctaves={3} seed={9} />
            <feDisplacementMap in="SourceGraphic" scale={o.deckle.size * 0.8 * u} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <path
            d={`M0 0 H${w} V${h} H0 Z M${o.deckle.size * u} ${o.deckle.size * u} V${h - o.deckle.size * u} H${w - o.deckle.size * u} V${o.deckle.size * u} Z`}
            fill={o.deckle.color}
            fillRule="evenodd"
            filter={`url(#dk${id})`}
          />
        </svg>
      )}
      {lb > 0 && (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: lb, background: o.letterbox!.color ?? '#000'}} />
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: lb, background: o.letterbox!.color ?? '#000'}} />
        </>
      )}
    </AbsoluteFill>
  );
};

/** Wraps any scene: re-times it (on twos), filters it through the style's chain, then lays the overlays on top. */
export const StyleFrame: React.FC<{style: StyleDef; children: React.ReactNode; strength?: number}> = ({style, children, strength = 1}) => {
  const frame = useCurrentFrame();
  const {u, w, h} = useStage();
  const id = 'st' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const step = style.step ?? 1;
  const f = step > 1 ? Math.floor(frame / step) * step : frame;
  const inner = step > 1 ? <Freeze frame={f}>{children}</Freeze> : children;
  const filtered = (
    <AbsoluteFill style={{background: style.palette.bg, filter: style.steps.length ? `url(#${id})` : undefined}}>
      {inner}
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={id} x="0" y="0" width={w} height={h} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          {buildSteps(style.steps, u, f)}
        </filter>
      </svg>
      {strength < 1 ? (
        <AbsoluteFill>
          <AbsoluteFill>{inner}</AbsoluteFill>
          <AbsoluteFill style={{opacity: strength}}>{filtered}</AbsoluteFill>
        </AbsoluteFill>
      ) : (
        filtered
      )}
      {style.overlays && <Overlays o={style.overlays} />}
    </AbsoluteFill>
  );
};
