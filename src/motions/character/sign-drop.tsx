import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {mixHex} from '../../core/character-kit';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {FilmGrain, PaperTexture, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video12 sign-drop-swing (ATTENTION banner / LIMIT REACHED neon) + video13 pendulum-sway.
 * A sign drops in on ropes (spring y, damping 9 / stiffness 160), swings with a damped pendulum
 * (A·e^(−t/τ)·sin(2πt/0.6 s)), then idles with a gentle ±1.5° sway. Neon ignites with a flicker after landing.
 */
type Props = {
  text: string;
  subtext: string;
  style: 'neon' | 'banner' | 'wood';
  color: string;
  background: string;
  from: 'top' | 'topRight';
  dropFrame: number;
  swingAmp: number;
  restAngle: number;
  width: number;
  exit: boolean;
};

const STYLE_BG: Record<Props['style'], string> = {neon: '#1B1024', banner: '#ECE4D7', wood: '#CFE3D3'};
const STYLE_COL: Record<Props['style'], string> = {neon: '#FF5FA8', banner: '#FB8179', wood: '#4A2A14'};

const SignDrop: React.FC<Props> = ({text, subtext, style, color, background, from, dropFrame, swingAmp, restAngle, width, exit}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const {w, h, u, portrait} = useStage();
  const col = color || STYLE_COL[style];
  const bg = background || STYLE_BG[style];
  const SW = Math.min(w * (portrait ? 0.86 : width), 1400 * u);
  const SH = SW * (subtext ? 0.4 : 0.3);
  const restY = h * (portrait ? 0.42 : 0.42);
  const ropeTop = -20 * u;

  // drop spring + damped pendulum swing
  const t = frame - dropFrame;
  const sp = spring({frame: t, fps, config: {damping: 9, stiffness: 160, mass: 1}});
  const exitP = exit ? prog(frame, durationInFrames - 22, durationInFrames - 2, ease.in) : 0;
  const startY = -SH * 1.6;
  const cy = startY + (restY - startY) * sp - exitP * (restY + SH * 1.8);
  const fromX = from === 'topRight' ? w * 0.35 : 0;
  const cxs = w / 2 + fromX * (1 - sp);
  const ts = Math.max(0, t) / fps;
  const swing = swingAmp * Math.exp(-ts / 0.55) * Math.sin((2 * Math.PI * ts) / 0.6) * (t > 0 ? 1 : 0);
  const entryRot = from === 'topRight' ? -22 * (1 - sp) : 0;
  const idle = 1.5 * Math.sin((2 * Math.PI * frame) / 48) * clamp((ts - 0.6) / 0.8);
  const rot = restAngle + swing + entryRot + idle;
  const landed = t > 6;

  // neon ignite flicker (after landing) + rare micro flicker
  const r = rng(Math.floor(frame / 2) * 7 + 3);
  let on = 1;
  if (style === 'neon') {
    const it = t - 8;
    const pattern = [0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0.4, 1];
    on = it < 0 ? 0.05 : it < pattern.length * 2 ? pattern[Math.floor(it / 2)] : r() < 0.012 ? 0.55 : 1;
  }

  const hangX = SW * 0.36;
  const rad = (rot * Math.PI) / 180;
  const attach = (side: number): [number, number] => {
    const lx = side * hangX;
    const ly = -SH / 2;
    return [cxs + lx * Math.cos(rad) - ly * Math.sin(rad), cy + lx * Math.sin(rad) + ly * Math.cos(rad)];
  };
  const anchors = [-1, 1].map((s) => [w / 2 + s * hangX * 1.05 + fromX * (1 - sp) * 0.6, ropeTop] as [number, number]);
  const ropeCol = style === 'neon' ? '#5A5560' : style === 'banner' ? '#D9C49A' : '#B08A55';
  const ropeW = (style === 'neon' ? 3 : style === 'banner' ? 5 : 8) * u;

  const fontSize = Math.min(SH * (subtext ? 0.42 : 0.56), (SW * 0.84) / Math.max(4, text.length * (style === 'neon' ? 0.86 : style === 'wood' ? 0.8 : 0.6)));
  const subSize = Math.min(SH * 0.16, (SW * 0.8) / Math.max(6, subtext.length * 0.55));
  const textY = subtext ? -SH * 0.07 : SH * 0.02;

  const sign = (() => {
    if (style === 'neon') {
      const glow = (k: number) => (
        <filter id={`sd-glow${k}`} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation={k * u} />
        </filter>
      );
      const neonText = (txt: string, y: number, size: number, ff: string, wt: number, key: string) => (
        <g key={key} style={{fontFamily: ff, fontWeight: wt}} textAnchor="middle" dominantBaseline="middle" fontSize={size} letterSpacing={size * 0.08}>
          <text x={0} y={y} fill="none" stroke={col} strokeWidth={size * 0.12} filter="url(#sd-glow18)" opacity={0.9 * on}>
            {txt}
          </text>
          <text x={0} y={y} fill="none" stroke={col} strokeWidth={size * 0.07} filter="url(#sd-glow5)" opacity={on}>
            {txt}
          </text>
          <text x={0} y={y} fill="none" stroke={on > 0.5 ? mixHex(col, '#FFFFFF', 0.65) : mixHex(col, '#2A1A2A', 0.6)} strokeWidth={size * 0.04} strokeLinejoin="round">
            {txt}
          </text>
        </g>
      );
      return (
        <g>
          <defs>
            {glow(5)}
            {glow(18)}
            {glow(40)}
          </defs>
          <rect x={-SW / 2} y={-SH / 2} width={SW} height={SH} rx={SH * 0.1} fill="#45323E" stroke="#2A1D26" strokeWidth={6 * u} />
          <rect x={-SW / 2 + 14 * u} y={-SH / 2 + 14 * u} width={SW - 28 * u} height={SH - 28 * u} rx={SH * 0.07} fill="none" stroke={col} strokeWidth={4 * u} opacity={0.35 + 0.5 * on} filter="url(#sd-glow5)" />
          {[-1, 1].map((s) => [-1, 1].map((v) => <circle key={`${s}${v}`} cx={s * (SW / 2 - 26 * u)} cy={v * (SH / 2 - 26 * u)} r={6 * u} fill="#8A7A84" />))}
          {neonText(text.toUpperCase(), textY, fontSize, fonts.sans, 800, 't')}
          {subtext ? neonText(subtext, SH * 0.29, subSize, fonts.hand, 700, 's') : null}
        </g>
      );
    }
    if (style === 'banner') {
      const wave = (x: number) => Math.sin(x / SW * Math.PI * 3 + frame * 0.15) * SH * 0.025 * clamp(1 - ts / 3 + 0.3);
      const N = 24;
      const bottom = Array.from({length: N + 1}, (_, i) => {
        const x = SW / 2 - (SW * i) / N;
        return `L ${x.toFixed(1)} ${(SH / 2 + wave(x)).toFixed(1)}`;
      }).join(' ');
      const d = `M ${-SW / 2} ${-SH / 2} L ${SW / 2} ${-SH / 2} ${bottom} Z`;
      return (
        <g>
          <path d={d} fill="#16081C" transform={`translate(${12 * u},${12 * u})`} />
          <path d={d} fill="#440213" stroke="#16081C" strokeWidth={5 * u} strokeLinejoin="round" />
          <rect x={-SW / 2 + 16 * u} y={-SH / 2 + 16 * u} width={SW - 32 * u} height={SH - 32 * u} fill="none" stroke={col} strokeWidth={3 * u} strokeDasharray={`${14 * u} ${9 * u}`} opacity={0.6} />
          {[-1, 1].map((s) => (
            <circle key={s} cx={s * hangX} cy={-SH / 2 + 18 * u} r={9 * u} fill="#F1E3C8" stroke="#16081C" strokeWidth={3 * u} />
          ))}
          <text x={0} y={textY} textAnchor="middle" dominantBaseline="middle" fontFamily={fonts.comic} fontSize={fontSize * 1.08} fill={col} stroke="#16081C" strokeWidth={4 * u} paintOrder="stroke" letterSpacing={fontSize * 0.04}>
            {text.toUpperCase()}
          </text>
          {subtext && (
            <text x={0} y={SH * 0.28} textAnchor="middle" dominantBaseline="middle" fontFamily={fonts.comic} fontSize={subSize * 1.15} fill="#FEF4D7" letterSpacing={subSize * 0.1}>
              {subtext.toUpperCase()}
            </text>
          )}
        </g>
      );
    }
    // wood
    const planks = 3;
    const ph = SH / planks;
    const rr = rng(11);
    return (
      <g>
        <rect x={-SW / 2 + 10 * u} y={-SH / 2 + 14 * u} width={SW} height={SH} rx={10 * u} fill="#000" opacity={0.18} />
        {Array.from({length: planks}, (_, i) => {
          const y0 = -SH / 2 + i * ph;
          const base = ['#B9773E', '#A9682F', '#C1813F'][i % 3];
          return (
            <g key={i}>
              <rect x={-SW / 2} y={y0} width={SW} height={ph} rx={8 * u} fill={base} stroke="#5A3418" strokeWidth={4 * u} />
              {Array.from({length: 5}, (_, j) => {
                const yy = y0 + ph * (0.2 + 0.15 * j) + (rr() - 0.5) * 6 * u;
                const x0 = -SW / 2 + rr() * SW * 0.3;
                const x1 = x0 + SW * (0.3 + rr() * 0.5);
                return <path key={j} d={`M ${x0} ${yy} Q ${(x0 + x1) / 2} ${yy + (rr() - 0.5) * 10 * u} ${x1} ${yy}`} fill="none" stroke="#7A4720" strokeWidth={2 * u} opacity={0.45} />;
              })}
              <ellipse cx={-SW * 0.3 + rr() * SW * 0.6} cy={y0 + ph * 0.5} rx={10 * u} ry={5 * u} fill="none" stroke="#6A3C1A" strokeWidth={2 * u} opacity={0.5} />
              {[-1, 1].map((s) => (
                <circle key={s} cx={s * (SW / 2 - 20 * u)} cy={y0 + ph / 2} r={5 * u} fill="#3E3A36" />
              ))}
            </g>
          );
        })}
        <text x={0} y={textY + 3 * u} textAnchor="middle" dominantBaseline="middle" fontFamily={fonts.display} fontSize={fontSize} fill="#F3DDB4" opacity={0.55} letterSpacing={fontSize * 0.04}>
          {text.toUpperCase()}
        </text>
        <text x={0} y={textY} textAnchor="middle" dominantBaseline="middle" fontFamily={fonts.display} fontSize={fontSize} fill={col} letterSpacing={fontSize * 0.04}>
          {text.toUpperCase()}
        </text>
        {subtext && (
          <text x={0} y={SH * 0.3} textAnchor="middle" dominantBaseline="middle" fontFamily={fonts.hand} fontWeight={700} fontSize={subSize * 1.3} fill="#3A200C">
            {subtext}
          </text>
        )}
      </g>
    );
  })();

  return (
    <AbsoluteFill style={{background: bg}}>
      {style === 'wood' && <AbsoluteFill style={{background: 'linear-gradient(180deg, #A9CDE0 0%, #DCEBDD 70%, #BFD8A8 100%)'}} />}
      {style === 'banner' && <PaperTexture opacity={0.35} />}
      <Svg>
        {style === 'neon' && (
          <g>
            <defs>
              <pattern id="sd-brick" patternUnits="userSpaceOnUse" width={120 * u} height={60 * u}>
                <rect width={120 * u} height={60 * u} fill="#241630" />
                <path d={`M 0 ${30 * u} H ${120 * u} M 0 ${60 * u} H ${120 * u} M ${60 * u} 0 V ${30 * u} M 0 ${30 * u} V ${60 * u} M ${120 * u} ${30 * u} V ${60 * u}`} stroke="#140A1C" strokeWidth={4 * u} />
              </pattern>
              <radialGradient id="sd-wallglow">
                <stop offset="0%" stopColor={col} stopOpacity={0.4} />
                <stop offset="100%" stopColor={col} stopOpacity={0} />
              </radialGradient>
              <radialGradient id="sd-vig" cx="50%" cy="45%" r="75%">
                <stop offset="40%" stopColor="#000" stopOpacity={0} />
                <stop offset="100%" stopColor="#000" stopOpacity={0.65} />
              </radialGradient>
            </defs>
            <rect width={w} height={h} fill="url(#sd-brick)" />
            <ellipse cx={cxs} cy={cy + SH * 0.1} rx={SW * 0.85} ry={SH * 1.6} fill="url(#sd-wallglow)" opacity={landed ? on : 0} />
            <rect width={w} height={h} fill="url(#sd-vig)" />
          </g>
        )}
        {style === 'banner' && (
          <g>
            <defs>
              <pattern id="sd-ht" patternUnits="userSpaceOnUse" width={14 * u} height={14 * u} patternTransform="rotate(45)">
                <circle cx={7 * u} cy={7 * u} r={2.6 * u} fill="#D9C7A8" />
              </pattern>
              <radialGradient id="sd-htfade" cx="50%" cy="40%" r="70%">
                <stop offset="0%" stopColor="#fff" stopOpacity={0} />
                <stop offset="100%" stopColor="#fff" stopOpacity={1} />
              </radialGradient>
              <mask id="sd-htmask">
                <rect width={w} height={h} fill="url(#sd-htfade)" />
              </mask>
            </defs>
            {Array.from({length: 18}, (_, i) => {
              const a0 = (i / 18) * Math.PI * 2 + frame * 0.002;
              const a1 = a0 + Math.PI / 18;
              const R = Math.hypot(w, h);
              const ox = w / 2;
              const oy = restY;
              return <polygon key={i} points={`${ox},${oy} ${ox + Math.cos(a0) * R},${oy + Math.sin(a0) * R} ${ox + Math.cos(a1) * R},${oy + Math.sin(a1) * R}`} fill="#E3D5BC" opacity={0.6} />;
            })}
            <rect width={w} height={h} fill="url(#sd-ht)" mask="url(#sd-htmask)" opacity={0.8} />
          </g>
        )}
        {style === 'wood' && (
          <g>
            {[0.2, 0.55, 0.85].map((fx, i) => (
              <ellipse key={i} cx={w * fx} cy={h * 1.02} rx={w * 0.35} ry={h * 0.16} fill={['#8FBF7A', '#7DB06A', '#9CC985'][i]} />
            ))}
          </g>
        )}
        {/* ropes */}
        {[-1, 1].map((s, i) => {
          const a = anchors[i];
          const b = attach(s);
          const sag = 0;
          return (
            <g key={s}>
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1] + sag} stroke={mixHex(ropeCol, '#000', 0.35)} strokeWidth={ropeW + 2 * u} strokeLinecap="round" />
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={ropeCol} strokeWidth={ropeW} strokeLinecap="round" strokeDasharray={style === 'neon' ? `${8 * u} ${4 * u}` : `${10 * u} ${3 * u}`} />
            </g>
          );
        })}
        <g transform={`translate(${cxs},${cy}) rotate(${rot})`}>{sign}</g>
      </Svg>
      {style === 'neon' && <FilmGrain opacity={0.08} />}
    </AbsoluteFill>
  );
};

export const signDrop = defineMotion<Props>({
  id: 'sign-drop',
  title: 'Sign drop & swing',
  category: 'character',
  description: 'A neon, comic banner or wooden sign drops in on ropes with a springy bounce, swings on a damped pendulum and settles into a gentle sway; neon flickers on after landing.',
  source: ['video12 43:17 sign-drop-swing (ATTENTION banner), 60:67 LIMIT REACHED neon', 'video13 pendulum-sway'],
  useFor: 'Announcements, chapter cards, “now open / limit reached / reset” beats, shop or level names.',
  durationInFrames: 120,
  defaultProps: {
    text: 'Now Open',
    subtext: 'step right in',
    style: 'neon',
    color: '',
    background: '',
    from: 'top',
    dropFrame: 6,
    swingAmp: 8,
    restAngle: 0,
    width: 0.6,
    exit: false,
  },
  propDocs: {
    text: 'main sign text',
    subtext: "small second line ('' to hide)",
    style: "'neon' (dark plate, glowing tube) | 'banner' (v12 maroon comic banner) | 'wood' (planks on ropes)",
    color: "text / neon colour ('' = style default)",
    background: "scene colour ('' = style default)",
    from: "'top' drop or 'topRight' swing-in",
    dropFrame: 'frame the drop starts',
    swingAmp: 'initial swing amplitude in degrees',
    restAngle: 'resting tilt in degrees (v12 banner hangs at about -10)',
    width: 'sign width as a fraction of frame width (landscape)',
    exit: 'pull the sign back up at the end',
  },
  component: SignDrop,
  tags: ['sign', 'banner', 'neon', 'drop', 'swing', 'title'],
});
