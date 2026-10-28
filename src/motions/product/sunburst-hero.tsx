// Adapted from lemo-opuscar/styles/midcentury-toon/demo/film.js (sceneHook) and engine/toon.js (rays, sparkle) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {P, TOON, ToonDefs, ToonShape, ToonText, back, ellipsePts, eo, fitW, hash, lbf, mix, pd, raysD, rrectPts, seg, sparklePts, twosF} from '../../core/r2-lb1-kit';

/**
 * Mid-century product reveal: ~30 translucent wedge rays spin slowly out to the frame edge while a cream disc opens
 * behind the subject with a back-ease, atomic 4-point sparkles twinkle on twos, a broken horizon line sits on the
 * colour-plane ground, and a script "Meet …" title prints in two plates. Overlay-capable behind any subject.
 */

type Props = {
  title: string;
  subtitle: string;
  src: string;
  productColor: string;
  rays: number;
  rayColor: string;
  rayAlpha: number;
  ground: string;
  floor: string;
  discColor: string;
  discR: number;
  sparkles: number;
  sparkleColors: string[];
  ink: string;
  plate: string;
  startFrame: number;
  spin: number;
  background: string;
};

/** generic toon gadget (a puck seen from slightly above), centred at (cx, cy) width W */
const Puck: React.FC<{cx: number; cy: number; W: number; color: string; ink: string; frame: number; u: number; defsId: string}> = ({cx, cy, W, color, ink, frame, u, defsId}) => {
  const rx = W / 2;
  const ry = W * 0.17;
  const bodyH = W * 0.2;
  const top = ellipsePts(cx, cy - bodyH / 2, rx, ry, 64);
  const body: P[] = [...ellipsePts(cx, cy + bodyH / 2, rx, ry, 32, 0, Math.PI), ...ellipsePts(cx, cy - bodyH / 2, rx, ry, 32, Math.PI, Math.PI * 2).slice(0)];
  const band = ellipsePts(cx, cy - bodyH / 2, rx * 0.82, ry * 0.8, 64);
  const btn = ellipsePts(cx, cy - bodyH / 2, rx * 0.12, ry * 0.18, 24);
  return (
    <g>
      <ellipse cx={cx + 10 * u} cy={cy + bodyH / 2 + ry * 0.6} rx={rx * 1.02} ry={ry * 0.7} fill="rgba(60,40,20,0.22)" />
      <ToonShape pts={body} frame={frame} u={u} defsId={defsId} fill={TOON.white} line={4} lineColor={ink} seed={21} breaks={0.1} />
      <ToonShape pts={top} frame={frame} u={u} defsId={defsId} fill={color} line={4} lineColor={ink} seed={22} breaks={0.12} />
      <ToonShape pts={band} frame={frame} u={u} defsId={defsId} fill={mix(color, '#000000', 0.18)} line={2.6} lineColor={ink} seed={23} breaks={0.3} />
      <ToonShape pts={btn} frame={frame} u={u} defsId={defsId} fill={TOON.white} line={2.4} lineColor={ink} seed={24} breaks={0} />
      <circle cx={cx + rx * 0.62} cy={cy + bodyH * 0.25} r={W * 0.022} fill={TOON.coral} stroke={ink} strokeWidth={2 * u} />
      <path d={pd(rrectPts(cx - rx * 0.98, cy + bodyH * 0.05, rx * 1.96, W * 0.018, W * 0.009, 3))} fill={mix(TOON.white, '#000000', 0.12)} opacity={0.6} />
    </g>
  );
};

const SunburstHero: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, cx: fcx} = useStage();
  const id = 'sunburst-hero';
  const f = frame - p.startFrame;
  const tw = twosF(f);
  const transparent = p.background === 'transparent';
  const dX = portrait ? fcx : w * 0.6;
  const dY = portrait ? h * 0.6 : h * 0.52;
  const R = p.discR * u * (portrait ? 1.05 : 1);
  const rayK = back(seg(f, 2, 13), 1.6);
  const discK = back(seg(f, 4, 15), 1.6);
  const subjK = back(seg(f, 12, 22), 1.9);
  const diag = Math.hypot(w, h);
  const rot = (f / 30) * p.spin;
  const horizonY = portrait ? h * 0.72 : h * 0.74;
  // title block
  const tSize = fitW(p.title, (portrait ? 128 : 150) * u, portrait ? w * 0.86 : w * 0.42, 'script');
  const sSize = fitW(p.subtitle, (portrait ? 58 : 54) * u, portrait ? w * 0.86 : w * 0.38, 'slab');
  const tx = portrait ? w / 2 : w * 0.06;
  const ty = portrait ? h * 0.16 : h * 0.3;
  const anchor = portrait ? 'middle' : 'start';
  const tIn = seg(tw, 18, 24);
  const sIn = seg(tw, 26, 32);
  // subtitle may wrap into two lines on landscape
  const words = p.subtitle.split(' ');
  const half = Math.ceil(words.length / 2);
  const subLines = portrait || words.length < 3 ? [p.subtitle] : [words.slice(0, half).join(' '), words.slice(half).join(' ')];
  const sSize2 = portrait ? sSize : Math.min(...subLines.map((l) => fitW(l, 74 * u, w * 0.4, 'slab')));
  const sparks = Array.from({length: p.sparkles}, (_, i) => {
    const a = hash(i, 3, 9) * Math.PI * 2;
    const rr = R * (1.05 + hash(i, 4, 9) * 0.35);
    return {x: dX + Math.cos(a) * rr, y: dY + Math.sin(a) * rr * 0.9, s: (28 + hash(i, 5, 9) * 12) * u, c: p.sparkleColors[i % p.sparkleColors.length], d: 18 + i * 4};
  });
  return (
    <AbsoluteFill style={{background: transparent ? 'transparent' : p.ground, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <ToonDefs id={id} u={u} />
        {rayK > 0 && <path d={raysD(dX, dY, p.rays, diag * rayK, rot, 0.5, R * 0.4)} fill={p.rayColor} opacity={p.rayAlpha} />}
        {!transparent && (
          <>
            <rect x={0} y={horizonY} width={w} height={h - horizonY} fill={p.floor} />
            <ToonShape
              pts={[
                [-10 * u, horizonY],
                [w + 10 * u, horizonY],
              ]}
              closed={false}
              frame={frame}
              u={u}
              defsId={id}
              line={3}
              lineColor={p.ink}
              breaks={0.4}
              seed={4}
            />
          </>
        )}
        {discK > 0 && (
          <>
            <ToonShape pts={ellipsePts(dX, dY, R * discK, R * discK, 72)} frame={frame} u={u} defsId={id} fill={p.discColor} line={0} seed={8} tooth={0.2} />
            <ToonShape pts={ellipsePts(dX, dY, R * discK * 1.06, R * discK * 1.06, 90)} frame={frame} u={u} defsId={id} line={3.2} lineColor={p.ink} breaks={0.3} seed={9} />
          </>
        )}
        {subjK > 0 &&
          (p.src ? (
            <foreignObject x={dX - R * 0.85} y={dY - R * 0.85} width={R * 1.7} height={R * 1.7}>
              <Img src={resolveSrc(p.src)} style={{width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${subjK})`}} />
            </foreignObject>
          ) : (
            <g transform={`translate(${dX} ${dY + R * 0.3}) scale(${subjK}) translate(${-dX} ${-(dY + R * 0.3)})`}>
              <Puck cx={dX} cy={dY + R * 0.3 + Math.sin(tw * 0.12) * 3 * u} W={R * 1.25} color={p.productColor} ink={p.ink} frame={frame} u={u} defsId={id} />
            </g>
          ))}
        {sparks.map((s, i) => {
          const k = eo(seg(f, s.d, s.d + 6)) * (0.7 + 0.45 * hash(Math.floor(frame / 2), i, 2));
          return k > 0 ? <path key={i} d={pd(sparklePts(s.x, s.y, s.s * k, 0))} fill={s.c} /> : null;
        })}
        {p.title && tIn > 0 && (
          <ToonText text={p.title} x={tx + (portrait ? 0 : (1 - eo(tIn)) * -80 * u)} y={ty} size={tSize} frame={frame} u={u} font={lbf('script')} weight={700} ink={p.ink} plate={TOON.white} anchor={anchor} seed={31} />
        )}
        {p.subtitle &&
          sIn > 0 &&
          subLines.map((l, i) => (
            <ToonText key={i} text={l} x={tx + (portrait ? 0 : (1 - eo(sIn)) * -60 * u)} y={ty + tSize * 0.62 + sSize2 * (1.15 + i * 1.05)} size={sSize2} frame={frame} u={u} font={lbf('slab')} ink={p.plate} plate={p.ink} anchor={anchor} seed={33 + i} />
          ))}
      </svg>
    </AbsoluteFill>
  );
};

export const sunburstHero = defineMotion<Props>({
  id: 'sunburst-hero',
  title: 'Sunburst hero (mid-century reveal)',
  category: 'product',
  description:
    'Retro product reveal: translucent wedge rays spin out to the frame edge, a cream disc opens behind the product with a back-ease and a broken ink rim, atomic sparkles twinkle on twos, and a two-plate "Meet …" script title with a slab subtitle prints beside it.',
  source: ['lemo-opuscar styles/midcentury-toon (MIT code, CC BY 4.0 docs, LemoLab) — demo/film.js sceneHook, engine/toon.js rays/sparkle'],
  useFor: '"Meet X." product intros, CTA / QR end frames, award moments and retro brand films; behind any subject as an overlay.',
  durationInFrames: 120,
  defaultProps: {
    title: 'Meet Lumen.',
    subtitle: 'Your new home helper',
    src: '',
    productColor: TOON.teal,
    rays: 30,
    rayColor: '#F3D37F',
    rayAlpha: 0.55,
    ground: '#E8B43A',
    floor: '#EFD9A4',
    discColor: '#FBF1DC',
    discR: 300,
    sparkles: 4,
    sparkleColors: [TOON.coral, '#FFFFFF', TOON.ink, TOON.coral],
    ink: TOON.ink,
    plate: TOON.coral,
    startFrame: 0,
    spin: 0.06,
    background: 'ground',
  },
  propDocs: {
    title: 'script title (two plates)',
    subtitle: 'slab subtitle (wraps to two lines in landscape)',
    src: 'optional product image (transparent PNG) shown in the disc; default draws a toon gadget',
    productColor: 'colour of the default gadget',
    rays: 'number of ray wedges',
    rayColor: 'ray tint',
    rayAlpha: 'ray opacity',
    ground: 'ground colour plane',
    floor: 'floor colour under the horizon',
    discColor: 'disc behind the subject',
    discR: 'disc radius in u',
    sparkles: 'number of 4-point sparkles',
    sparkleColors: 'sparkle colours (cycled)',
    ink: 'ink colour',
    plate: 'subtitle colour (ink plate behind it)',
    startFrame: 'delay before the reveal',
    spin: 'ray rotation speed (rad/s)',
    background: '"ground" or "transparent" (overlay: rays + disc + sparkles + subject + titles)',
  },
  component: SunburstHero,
  tags: ['sunburst', 'rays', 'product reveal', 'hero', 'midcentury', 'retro', '1950s', 'meet', 'sparkle', 'toon', 'end card', 'cta', 'overlay'],
});
