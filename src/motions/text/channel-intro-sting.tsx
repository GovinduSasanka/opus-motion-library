import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {fonts} from '../../core/fonts';
import {backOut, eio, eo3, eo5, ei3, logoBox, mix, seg} from '../../core/r3-brand-kit';
import {textWidth} from '../../core/r2-mg2b-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Three-second channel bumper: five flat shapes snap onto the frame on the beat, spin together and collapse into one point, a
 * colour band shoots across and the channel name slams in letter by letter on it, a tagline slides under it, and everything
 * wipes out. Name, tagline, an optional logo picture and the palette are props.
 */
type Props = {
  name: string;
  tagline: string;
  src: string;
  background: string;
  accent: string;
  accent2: string;
  ink: string;
  startAt: number;
  speed: number;
  fontFamily: string;
};

const ChannelIntroSting: React.FC<Props> = ({name, tagline, src, background, accent, accent2, ink, startAt, speed, fontFamily}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const f = Math.max(0, (frame - startAt) * speed);
  const fam = fontFamily || fonts.display;
  const S = Math.min(w, h);
  const bg = background === 'transparent' ? undefined : background;

  // --- shapes: snap in on offbeat frames, spin, collapse
  const snap = (i: number) => eo5(seg(f, 1 + i * 3, 9 + i * 3));
  const collapse = eio(seg(f, 22, 34));
  const spin = eio(seg(f, 12, 32)) * 200;
  const R = S * (portrait ? 0.26 : 0.27);
  const shapes: {x: number; y: number; ang: number; col: string; kind: string; size: number}[] = [
    {x: -0.9, y: -0.2, ang: 0, col: accent, kind: 'circle', size: 0.34},
    {x: 0.8, y: -0.55, ang: 20, col: accent2, kind: 'square', size: 0.3},
    {x: 0.1, y: 0.85, ang: 0, col: '#ffffff', kind: 'tri', size: 0.34},
    {x: -0.45, y: -0.95, ang: 0, col: accent2, kind: 'ring', size: 0.3},
    {x: 0.95, y: 0.45, ang: 0, col: accent, kind: 'bars', size: 0.3},
  ];
  const shapeEls = shapes.map((s, i) => {
    const t = snap(i);
    const px = s.x * R * (1 - collapse);
    const py = s.y * R * (1 - collapse);
    const off = (1 - t) * (i % 2 ? 1 : -1) * w * 0.35;
    const sc = t * (1 - collapse * 0.95) * (1 + 0.12 * Math.sin(Math.PI * Math.min(1, t)));
    const a = spin * (i % 2 ? -1 : 1) + s.ang;
    const r = R * s.size;
    let body: React.ReactNode;
    if (s.kind === 'circle') body = <circle r={r} fill={s.col} />;
    else if (s.kind === 'square') body = <rect x={-r} y={-r} width={2 * r} height={2 * r} rx={r * 0.12} fill={s.col} />;
    else if (s.kind === 'tri') body = <path d={`M 0 ${-r * 1.1} L ${r * 1.05} ${r * 0.8} L ${-r * 1.05} ${r * 0.8} Z`} fill={s.col} />;
    else if (s.kind === 'ring') body = <circle r={r * 0.85} fill="none" stroke={s.col} strokeWidth={r * 0.28} />;
    else body = [-1, 0, 1].map((k) => <rect key={k} x={-r} y={k * r * 0.72 - r * 0.17} width={2 * r} height={r * 0.34} rx={r * 0.17} fill={s.col} />);
    return (
      <g key={i} transform={`translate(${cx + px + off} ${cy + py}) rotate(${a}) scale(${sc})`}>
        {body}
      </g>
    );
  });
  const flash = eo3(seg(f, 30, 33)) * (1 - eo3(seg(f, 33, 42)));

  // --- band + name
  const bandH = S * (portrait ? 0.2 : 0.22);
  const bandT = eo5(seg(f, 30, 42));
  const outT = ei3(seg(f, 76, 88));
  const chars = [...name];
  const fam2 = fam;
  const widest = Math.max(1, textWidth(name, 100, fam2, 400) / 100 + 0.02 * chars.length);
  const maxW = w * (portrait ? 0.86 : 0.66);
  const nameFs = Math.min(bandH * 0.62, maxW / widest);
  const lh = nameFs;
  const tagT = eo3(seg(f, 56, 72));
  const lbox = logoBox(w, h, u, portrait, 0.55);
  const logoT = backOut(seg(f, 34, 46), 2.4);
  const bandY = cy;
  const showLogo = !!src;

  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <Svg style={{opacity: 1 - outT * 0.0}}>{shapeEls}</Svg>
      {/* flash ring where the shapes collapse */}
      <AbsoluteFill style={{background: '#ffffff', opacity: flash * 0.22}} />
      {/* band */}
      <div
        style={{
          position: 'absolute',
          left: -w * 0.1,
          width: w * 1.2,
          top: bandY - (bandH / 2) * (1 - outT),
          height: bandH * (1 - outT),
          background: accent,
          transform: `scaleX(${bandT}) skewX(-8deg)`,
          transformOrigin: outT > 0 ? '100% 50%' : '0% 50%',
        }}
      />
      <div style={{position: 'absolute', left: 0, right: 0, top: bandY - lh * 0.62, height: lh * 1.24, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 1 - outT}}>
        <div style={{display: 'flex', fontFamily: fam2, fontSize: nameFs, lineHeight: 1, letterSpacing: '0.02em', color: ink, whiteSpace: 'pre'}}>
          {chars.map((c, i) => {
            const t = seg(f, 36 + i * 1.5, 46 + i * 1.5);
            const e = backOut(t, 2.2);
            return (
              <span key={i} style={{display: 'inline-block', opacity: t > 0 ? 1 : 0, transform: `translateY(${(1 - e) * -lh * 0.9}px) rotate(${(1 - e) * (i % 2 ? 14 : -14)}deg) scale(${mix(1.5, 1, e)})`}}>
                {c}
              </span>
            );
          })}
        </div>
      </div>
      {showLogo && (
        <div style={{position: 'absolute', left: cx - lbox.bw / 2, top: bandY - bandH / 2 - lbox.bh - 24 * u, width: lbox.bw, height: lbox.bh, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', transform: `scale(${logoT * (1 - outT)})`, transformOrigin: '50% 100%'}}>
          <Img src={resolveSrc(src)} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
        </div>
      )}
      {tagline && (
        <div style={{position: 'absolute', left: 0, right: 0, top: bandY + bandH / 2 + 30 * u, display: 'flex', justifyContent: 'center', opacity: 1 - outT}}>
          <div style={{overflow: 'hidden', padding: `${6 * u}px ${24 * u}px`, borderRadius: 999, background: accent2, color: '#fff', fontFamily: fonts.sans, fontWeight: 800, fontSize: (portrait ? 34 : 30) * u, letterSpacing: '0.18em', textTransform: 'uppercase', transform: `translateX(${(1 - eo5(tagT)) * w * 0.4}px)`, opacity: tagT > 0 ? 1 : 0}}>
            {tagline}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const channelIntroSting = defineMotion<Props>({
  id: 'channel-intro-sting',
  title: 'Channel intro sting (3 s)',
  category: 'text',
  description:
    'A 3-second bumper: five flat shapes snap in on the beat, spin and collapse to a point with a flash; a colour band shoots across and the channel name slams in letter by letter, a tagline pill slides in under it, then everything wipes out.',
  source: ['original (branding pass, round 3)'],
  useFor: 'Channel / show intro bumpers, section stingers and "from the makers of" openers; optional logo picture above the name.',
  durationInFrames: 90,
  defaultProps: {
    name: 'STUDIO NINE',
    tagline: 'new episodes weekly',
    src: '',
    background: '#101114',
    accent: '#FFD23F',
    accent2: '#FF4D6D',
    ink: '#101114',
    startAt: 0,
    speed: 1,
    fontFamily: '',
  },
  propDocs: {
    name: 'channel / show name that slams in',
    tagline: 'small pill under the name ("" = none)',
    src: 'optional logo picture shown above the name (public/ path or URL)',
    background: 'backdrop colour, or "transparent" to sit over footage',
    accent: 'band colour and shapes',
    accent2: 'second brand colour (shapes, tagline pill)',
    ink: 'name colour (must read on the accent band)',
    startAt: 'frame the sting starts',
    speed: 'timing multiplier (1.3 = faster, hits a shorter beat)',
    fontFamily: 'optional CSS font-family for the name',
  },
  component: ChannelIntroSting,
  tags: ['intro', 'sting', 'bumper', 'channel', 'ident', 'logo', 'youtube', 'shapes', 'snap', 'name', 'tagline', 'opener', 'branding', 'stinger', '3 second'],
});
