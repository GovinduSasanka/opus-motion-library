import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {mixHex, rgb} from '../../core/r2-pr2-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Layered drifting clouds or ground fog: feTurbulence noise thresholded into soft cloud shapes, lit like real cumulus
 * (feDiffuseLighting) or left flat for fog and mist, in three parallax layers drifting at 1 : 2 : 4. The noise lives in
 * the element's own space, so translating a layer drifts the pattern. Overlay-capable (`background: "transparent"`).
 */
type Props = {
  style: string;
  colors: string[];
  speed: number;
  density: number;
  opacity: number;
  blur: number;
  layers: number;
  sun: boolean;
  sunColor: string;
  sunPos: number[];
  background: string;
  ridge: boolean;
  seed: number;
};

const SKY: Record<string, [string, string]> = {
  cumulus: ['#4f98e6', '#d4e9fb'],
  fog: ['#7f8ea0', '#d8dee5'],
  mist: ['#a7b4c4', '#eef1f4'],
};

const ch = (hex: string) => rgb(hex).map((v) => v / 255);

const FogClouds: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const style = P.style === 'fog' || P.style === 'mist' ? P.style : 'cumulus';
  const light = P.colors[0] ?? '#ffffff';
  const shadeC = P.colors[1] ?? '#93a6cc';
  const fadeIn = ease.out(prog(frame, 0, 24, (t) => t));
  const n = Math.max(1, Math.min(4, Math.round(P.layers)));
  const thr = 0.66 - 0.28 * clamp(P.density);
  const slope = style === 'cumulus' ? 5.6 : style === 'fog' ? 2.8 : 2.0;
  const [sky1, sky2] = SKY[style];
  const bgCss = P.background === 'transparent' ? undefined : P.background === 'auto' ? `linear-gradient(180deg, ${sky1} 0%, ${sky2} 100%)` : P.background;
  const sunX = (P.sunPos[0] ?? 0.78) * w;
  const sunY = (P.sunPos[1] ?? 0.2) * h;
  const lr = ch(light);
  const sr = ch(shadeC);
  const mr = ch(mixHex(shadeC, light, 0.45));

  const layerEls = Array.from({length: n}, (_, k) => {
    const depth = n === 1 ? 1 : k / (n - 1); // 0 back .. 1 front
    const spd = P.speed * Math.pow(2, k) * u; // px / s : 1 : 2 : 4
    const drift = (spd * frame) / 30;
    const maxDrift = (spd * durationInFrames) / 30;
    const feat = (style === 'cumulus' ? 0.0062 : style === 'fog' ? 0.0042 : 0.0032) * (1 - depth * 0.5) / u;
    const bf = style === 'cumulus' ? `${feat} ${feat * 1.5}` : style === 'fog' ? `${feat * 0.6} ${feat * 2.6}` : `${feat * 0.7} ${feat * 1.6}`;
    const op = P.opacity * (style === 'cumulus' ? [0.62, 0.8, 0.5][Math.min(2, k)] : [0.5, 0.62, 0.4][Math.min(2, k)]) * (n === 1 ? 1.1 : 1);
    const blurPx = P.blur * (0.35 + 0.65 * depth) * u * 0.28;
    const bandY = style === 'cumulus' ? h * (0.08 + 0.15 * k) : style === 'fog' ? h * (0.46 + 0.07 * k) : h * (0.05 + 0.04 * k);
    const bandH = style === 'cumulus' ? h * (0.4 + 0.15 * depth) : style === 'fog' ? h * 0.55 : h * 0.95;
    const id = `fogc-${k}`;
    const x0 = -w * 0.1;
    const rw = w * 1.3 + maxDrift;
    const maskGrad = style === 'fog' ? (
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity={0} />
        <stop offset="0.55" stopColor="#fff" stopOpacity={0.9} />
        <stop offset="1" stopColor="#fff" stopOpacity={1} />
      </linearGradient>
    ) : (
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity={0} />
        <stop offset="0.3" stopColor="#fff" stopOpacity={1} />
        <stop offset="0.7" stopColor="#fff" stopOpacity={1} />
        <stop offset="1" stopColor="#fff" stopOpacity={0} />
      </linearGradient>
    );
    return (
      <g key={k}>
        <defs>
          {maskGrad}
          <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={0} y={bandY} width={w} height={bandH}>
            <rect x={0} y={bandY} width={w} height={bandH} fill={`url(#${id}-g)`} />
          </mask>
          <filter id={`${id}-f`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency={bf} numOctaves={style === 'cumulus' ? 5 : 4} seed={P.seed + k * 13 + 3} result="n0" />
            <feOffset in="n0" dx={-drift} dy={0} result="n" />
            <feColorMatrix in="n" type="matrix" values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  ${slope} 0 0 0 ${(-thr * slope).toFixed(3)}`} result="a" />
            <feGaussianBlur in="a" stdDeviation={Math.max(0.5, blurPx)} result="shape" />
            {style === 'cumulus' ? (
              <>
                <feDiffuseLighting in="shape" surfaceScale={7 * u} diffuseConstant={1.05} lightingColor="#ffffff" result="lit">
                  <feDistantLight azimuth={235} elevation={48} />
                </feDiffuseLighting>
                <feComponentTransfer in="lit" result="tint">
                  <feFuncR type="table" tableValues={`${sr[0]} ${sr[0]} ${mr[0]} ${lr[0]} ${lr[0]}`} />
                  <feFuncG type="table" tableValues={`${sr[1]} ${sr[1]} ${mr[1]} ${lr[1]} ${lr[1]}`} />
                  <feFuncB type="table" tableValues={`${sr[2]} ${sr[2]} ${mr[2]} ${lr[2]} ${lr[2]}`} />
                </feComponentTransfer>
                <feComposite in="tint" in2="shape" operator="in" />
              </>
            ) : (
              <>
                <feFlood floodColor={light} result="fl" />
                <feComposite in="fl" in2="shape" operator="in" />
              </>
            )}
          </filter>
        </defs>
        <g mask={`url(#${id}-m)`} opacity={op * fadeIn}>
          <rect x={x0} y={bandY} width={rw} height={bandH} fill="#000" filter={`url(#${id}-f)`} />
        </g>
      </g>
    );
  });

  const ridgePath = (base: number, amp: number, seed: number, f: number) => {
    let d = `M0,${h}`;
    for (let i = 0; i <= 48; i++) {
      const x = (i / 48) * w;
      const y = base + Math.sin(i * f + seed) * amp + Math.sin(i * f * 2.7 + seed * 2) * amp * 0.5;
      d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return d + ` L${w},${h}Z`;
  };

  return (
    <AbsoluteFill style={{background: bgCss}}>
      {P.sun && P.background !== 'transparent' && (
        <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at ${sunX}px ${sunY}px, ${P.sunColor} 0%, rgba(255,255,255,0) ${Math.min(w, h) * 0.5}px)`, opacity: 0.75}} />
      )}
      <Svg>
        {P.ridge && P.background !== 'transparent' && style !== 'cumulus' && (
          <>
            <path d={ridgePath(h * 0.62, h * 0.05, 2, 0.4)} fill={mixHex('#2f3c4c', sky2, 0.55)} />
            <path d={ridgePath(h * 0.74, h * 0.06, 5, 0.55)} fill={mixHex('#1f2a38', sky2, 0.25)} />
          </>
        )}
        {layerEls[0]}
        {layerEls.slice(1, 2)}
        {style !== 'cumulus' && P.ridge && P.background !== 'transparent' && <path d={ridgePath(h * 0.9, h * 0.04, 9, 0.8)} fill="#141b26" />}
        {layerEls.slice(2)}
      </Svg>
      {P.sun && (
        <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at ${sunX}px ${sunY}px, ${P.sunColor} 0%, rgba(255,255,255,0) ${Math.min(w, h) * 0.42}px)`, mixBlendMode: 'screen', opacity: 0.38 * fadeIn}} />
      )}
    </AbsoluteFill>
  );
};

export const fogClouds = defineMotion<Props>({
  id: 'fog-clouds',
  title: 'Fog and clouds (parallax)',
  category: 'environment',
  description:
    'Three parallax layers of drifting noise-built clouds (lit white cumulus with soft grey undersides), low ground fog over dark ridges, or a wide soft mist; layer speeds run 1 : 2 : 4, blur grows toward the front and a screen-blended sun glow scatters through them.',
  source: ['prompt corpus x23 (layered drifting clouds / ground fog, parallax, light scattering)'],
  useFor: 'Skies for heroes, passing through clouds, mood and ambience; overlay-capable (`background: "transparent"`) over any scene or website hero.',
  durationInFrames: 240,
  defaultProps: {
    style: 'cumulus',
    colors: ['#ffffff', '#93a6cc'],
    speed: 22,
    density: 0.5,
    opacity: 1,
    blur: 20,
    layers: 3,
    sun: true,
    sunColor: '#fff0c2',
    sunPos: [0.78, 0.2],
    background: 'auto',
    ridge: true,
    seed: 5,
  },
  propDocs: {
    style: "'cumulus' | 'fog' | 'mist'",
    colors: '[light, shade] cloud colours (fog / mist use the light colour only)',
    speed: 'back-layer drift in px per second at 1080p (mid layer x2, front x4)',
    density: 'cloud coverage 0..1',
    opacity: 'overall layer opacity multiplier',
    blur: 'edge softness in px (grows toward the front layer)',
    layers: 'number of parallax layers (1-4)',
    sun: 'screen-blended sun scatter glow',
    sunColor: 'sun glow colour',
    sunPos: '[x, y] of the sun as fractions of the frame',
    background: "'auto' (sky gradient for the style) | 'transparent' | any CSS background",
    ridge: 'dark ridge silhouettes behind fog / mist (auto background only)',
    seed: 'noise seed',
  },
  component: FogClouds,
  tags: ['clouds', 'cumulus', 'fog', 'mist', 'sky', 'parallax', 'atmosphere', 'ambience', 'weather', 'drift', 'overlay', 'hero background', 'feTurbulence', 'light scattering', 'ground fog', 'haze'],
});
