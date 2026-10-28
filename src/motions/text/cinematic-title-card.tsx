import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {fonts} from '../../core/fonts';
import {textWidth} from '../../core/r2-mg2b-kit';
import {eio, eo3, eo5, mix, seg, withAlpha} from '../../core/r3-brand-kit';
import {Svg, Vignette, useStage} from '../../core/stage';
import {hash01} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Cinematic title card: letterbox bars slide in over a slowly pushing backdrop (your picture, or a dark graded gradient
 * with a drifting warm light leak), floating dust catches the light, a small kicker appears, the wide-tracked serif title
 * resolves out of a blur while its tracking tightens, a thin rule and the subtitle follow, and the card fades to black.
 */
type Props = {
  title: string;
  subtitle: string;
  kicker: string;
  src: string;
  background: string;
  ink: string;
  accent: string;
  ratio: number;
  dust: number;
  push: number;
  tracking: number;
  startAt: number;
  fadeOut: boolean;
  fontFamily: string;
};

const CinematicTitleCard: React.FC<Props> = ({title, subtitle, kicker, src, background, ink, accent, ratio, dust, push, tracking, startAt, fadeOut, fontFamily}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait, durationInFrames: D} = useStage();
  const f = Math.max(0, frame - startAt);
  const fam = fontFamily || fonts.serif;
  const transparent = background === 'transparent';

  const barH = Math.max(0, Math.min((h - w / Math.max(1.2, ratio)) / 2, h * 0.27));
  const barT = eio(seg(f, 0, 26));
  const kT = eo3(seg(f, 26, 46));
  const tT = eo5(seg(f, 34, 96));
  const ruleT = eio(seg(f, 70, 100));
  const sT = eo3(seg(f, 84, 112));
  const out = fadeOut ? eio(seg(frame, D - 20, D)) : 0;
  const scale = 1 + push * (frame / Math.max(1, D));

  // title fit
  const maxTrack = tracking + 0.12;
  const w100 = (txt: string, tr: number) => textWidth(txt, 100, fam, 500) / 100 + tr * [...txt].length;
  const titleFs = Math.min((portrait ? 120 : 136) * u, (w * (portrait ? 0.84 : 0.8)) / Math.max(1, w100(title, maxTrack)));
  const tr = mix(maxTrack, tracking, tT);
  const subFs = (portrait ? 34 : 30) * u;
  const kickFs = (portrait ? 24 : 22) * u;

  // dust (seeded)
  const n = Math.max(0, Math.min(160, Math.round(dust)));
  const motes = Array.from({length: n}, (_, i) => {
    const sp = 0.25 + hash01(i, 'ctc-s') * 0.7;
    const x0 = hash01(i, 'ctc-x') * w;
    const y0 = hash01(i, 'ctc-y') * h;
    const x = (((x0 + f * sp * 0.6 * u + Math.sin(f * 0.02 * sp + i) * 20 * u) % w) + w) % w;
    const y = (((y0 - f * sp * 0.9 * u) % h) + h) % h;
    const r = (0.8 + hash01(i, 'ctc-r') * 2.6) * u;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(f * 0.03 * (0.5 + sp) + i * 1.9));
    const near = hash01(i, 'ctc-n') > 0.8;
    return {x, y, r: near ? r * 1.9 : r, o: (near ? 0.18 : 0.5) * tw, blur: near};
  });

  const drift = f / 30;
  return (
    <AbsoluteFill style={{background: transparent ? undefined : '#000'}}>
      <AbsoluteFill style={{transform: `scale(${scale})`}}>
        {src ? (
          <>
            <Img src={resolveSrc(src)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.82) contrast(1.08) brightness(0.78)'}} />
            <AbsoluteFill style={{background: withAlpha(background === 'transparent' ? '#000000' : background, 0.38)}} />
          </>
        ) : (
          !transparent && (
            <>
              <AbsoluteFill style={{background: `radial-gradient(120% 90% at 50% 55%, ${withAlpha(accent, 0.18)} 0%, ${background} 62%)`}} />
              {/* drifting warm light leak */}
              <AbsoluteFill style={{background: `radial-gradient(40% 70% at ${mix(18, 34, Math.sin(drift * 0.5) * 0.5 + 0.5)}% 30%, ${withAlpha(accent, 0.28)} 0%, transparent 70%)`, mixBlendMode: 'screen'}} />
            </>
          )
        )}
      </AbsoluteFill>
      <Vignette strength={0.6} />
      <Svg>
        {motes.map((m, i) => (
          <circle key={i} cx={m.x} cy={m.y} r={m.r} fill={ink} opacity={m.o * (0.4 + 0.6 * eo3(seg(f, 8, 30)))} style={m.blur ? {filter: `blur(${2.4 * u}px)`} : undefined} />
        ))}
      </Svg>
      {/* letterbox bars */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: barH * barT, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: barH * barT, background: '#000'}} />
      {/* text block */}
      <div style={{position: 'absolute', left: 0, right: 0, top: cy, transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: ink, padding: `0 ${w * 0.05}px`}}>
        {kicker && (
          <div style={{fontFamily: fonts.sans, fontWeight: 600, fontSize: kickFs, letterSpacing: '0.5em', paddingLeft: '0.5em', textTransform: 'uppercase', opacity: kT * 0.75, transform: `translateY(${(1 - kT) * 10 * u}px)`, marginBottom: 34 * u}}>{kicker}</div>
        )}
        <div
          style={{
            fontFamily: fam,
            fontWeight: 500,
            fontSize: titleFs,
            letterSpacing: `${tr}em`,
            paddingLeft: `${tr}em`,
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            opacity: tT,
            filter: tT < 1 ? `blur(${(1 - tT) * 14 * u}px)` : undefined,
            textShadow: `0 ${4 * u}px ${28 * u}px rgba(0,0,0,.55)`,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </div>
        <div style={{width: Math.min(w * 0.3, 360 * u) * ruleT, height: 2 * u, background: accent, marginTop: 34 * u, opacity: 0.9}} />
        {subtitle && (
          <div style={{fontFamily: fam, fontStyle: 'normal', fontWeight: 500, fontSize: subFs, letterSpacing: '0.28em', paddingLeft: '0.28em', textTransform: 'uppercase', opacity: sT * 0.82, transform: `translateY(${(1 - sT) * 12 * u}px)`, marginTop: 30 * u}}>{subtitle}</div>
        )}
      </div>
      <AbsoluteFill style={{background: '#000', opacity: out}} />
    </AbsoluteFill>
  );
};

export const cinematicTitleCard = defineMotion<Props>({
  id: 'cinematic-title-card',
  title: 'Cinematic title card',
  category: 'text',
  description:
    'Letterbox bars slide in over a slowly pushing backdrop (your picture or a graded gradient with a drifting light leak); floating dust catches the light, a small kicker appears, a wide-tracked serif title resolves from blur as its tracking tightens, a thin rule and subtitle follow, and the card fades to black.',
  source: ['original (branding pass, round 3)'],
  useFor: 'Film and documentary titles, trailers, "a film by" cards, episode titles and any moody opening over a photo or colour.',
  durationInFrames: 180,
  defaultProps: {
    title: 'The Long Way Home',
    subtitle: 'a short documentary',
    kicker: 'a film by',
    src: '',
    background: '#0A0C12',
    ink: '#F1EBDD',
    accent: '#C89B5A',
    ratio: 2.39,
    dust: 70,
    push: 0.08,
    tracking: 0.3,
    startAt: 0,
    fadeOut: true,
    fontFamily: '',
  },
  propDocs: {
    title: 'main title (set in caps)',
    subtitle: 'line under the title ("" = none)',
    kicker: 'tiny tracked line above the title, e.g. "a film by" ("" = none)',
    src: 'backdrop picture (public/ path or URL); empty = graded gradient with light leak',
    background: 'base colour (the gradient shade / picture tint); "transparent" = bars and text only over your footage',
    ink: 'text and dust colour',
    accent: 'light leak and rule colour',
    ratio: 'letterbox aspect ratio (2.39 = scope, 1.85 = flat); bars are capped at 27 % of the height',
    dust: 'floating dust motes (0-160)',
    push: 'slow push-in over the whole card (0.08 = 8 %)',
    tracking: 'final letter spacing of the title in em',
    startAt: 'frame the bars start closing in',
    fadeOut: 'fade to black over the last 20 frames',
    fontFamily: 'optional CSS font-family for the title',
  },
  component: CinematicTitleCard,
  tags: ['title card', 'cinematic', 'title', 'letterbox', 'film', 'trailer', 'documentary', 'serif', 'dust', 'intro', 'credits', 'moody', 'bars', 'opening', 'kicker'],
});
