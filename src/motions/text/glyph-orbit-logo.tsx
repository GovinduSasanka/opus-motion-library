import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, lerp} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {useStage} from '../../core/stage';
import {Backdrop, BackdropKind, eic, eioc, eoc, tfonts, typed} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Logotype assembly (video19 glyph-orbit-assemble + arc-text-type + framed-tagline-build).
 * A radar grid collapses, a white ring draws on, ~16 monoline glyphs fly in from off-screen and orbit
 * at 8°/s. The ring then erases clockwise from 9 o'clock while the logotype types in from the left —
 * each letter is a 3-frame jumble of line fragments before it resolves, and nearby glyphs get sucked
 * into the typing point. The blue focus dot becomes the tittle of the first "i". The logo slides up, a
 * thin frame draws around it and two tagline lines type underneath, then a double-ruled pill label.
 */

type Props = {
  logo: string;
  tagline: string[];
  pill: string;
  glyphCount: number;
  orbitRadius: number;
  framesPerChar: number;
  typeStart: number;
  color: string;
  dim: string;
  accent: string;
  backdrop: BackdropKind;
  src: string;
  seed: number;
  variant: 'orbit' | 'fly';
  travel: number;
  paletteDashes: string[];
  dotColor: string;
};

/** monoline glyph alphabet in a unit cell (x −0.5..0.5, y −0.6..0.6) */
const GLYPHS = [
  'M-0.3,-0.5 V0.5 M0.3,-0.5 L-0.3,0 L0.3,0.5',
  'M0,-0.42 A0.42,0.42 0 1 1 -0.001,-0.42 Z',
  'M0,-0.45 L0.42,0.4 L-0.42,0.4 Z',
  'M0,-0.42 A0.42,0.42 0 1 1 -0.001,-0.42 Z M-0.42,0 H0.42',
  'M-0.35,-0.4 H0.35 M-0.25,0 H0.25 M-0.35,0.4 H0.35',
  'M-0.3,-0.4 H0.3 L-0.2,0.15 Q0.05,0.5 0.32,0.36',
  'M0,-0.42 A0.42,0.42 0 1 1 -0.001,-0.42 Z M-0.32,0.32 L0.32,-0.32',
  'M-0.55,-0.16 H0.55 V0.16 H-0.55 Z M-0.35,-0.16 V0.16 M0.35,-0.16 V0.16',
  'M-0.35,0.45 L0,-0.45 L0.35,0.45',
  'M-0.4,-0.1 Q-0.2,-0.45 0,-0.1 T0.4,-0.1',
];

const GlyphOrbitLogo: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const chars = [...p.logo];
  const n = chars.length;
  const fs = Math.min(116 * u, (w * (portrait ? 0.88 : 0.54)) / (0.6 * Math.max(1, n)));
  const cw = fs * 0.6;
  const textLeft = cx - (cw * n) / 2;
  const R = p.orbitRadius * u;
  const ringR = R * 0.65;
  const fpc = p.framesPerChar;
  const t0 = p.typeStart;
  const typeEnd = t0 + n * fpc;
  // slide up + frame + tagline timings
  const slideAt = typeEnd + 8;
  const slide = eioc((frame - slideAt) / 12);
  const lift = fs * 0.78 * slide;
  const logoY = cy - lift;
  const baseline = logoY + fs * 0.36;
  const frameAt = slideAt + 6;
  const tagAt = frameAt + 10;
  const tagFs1 = Math.min(26 * u, (w * 0.8) / (Math.max(1, (p.tagline[0] ?? '').length) * 0.6 * 1.35));
  const tagFs2 = Math.min(fs * 0.5, (w * 0.86) / (Math.max(1, (p.tagline[1] ?? '').length) * 0.6));
  const line1Y = cy + fs * 0.32;
  const line2Y = line1Y + tagFs1 * 0.9 + tagFs2 * 0.9;
  const t1 = tagAt;
  const n1 = typed(frame, t1, 35);
  const t2 = t1 + ((p.tagline[0] ?? '').length * 30) / 35 + 4;
  const n2 = typed(frame, t2, 35);
  const pillAt = t2 + ((p.tagline[1] ?? '').length * 30) / 35 + 14;
  const np = typed(frame, pillAt, 30);

  // ring: draw on, then erase clockwise from 9 o'clock while typing
  const ringDraw = eoc((frame - 6) / 12);
  const ringErase = clamp((frame - t0) / (n * fpc));
  const circ = 2 * Math.PI * ringR;
  // radar collapse at the start
  const collapse = eic(frame / 9);

  // glyph orbit
  const glyphs = React.useMemo(() => {
    const r = rng(`orbit${p.seed}`);
    return Array.from({length: p.glyphCount}, (_, i) => ({
      a0: (i / p.glyphCount) * Math.PI * 2 + r() * 0.2,
      shape: GLYPHS[(i * 7 + p.seed) % GLYPHS.length],
      rot: r() * 360,
      from: 2.6 + r() * 1.2,
      rr: 1 + (r() - 0.5) * 0.16,
      big: r() > 0.75,
    }));
  }, [p.glyphCount, p.seed]);
  const orbitAng = (f: number) => (f / 30) * ((8 * Math.PI) / 180);

  // dot target: tittle of first lowercase i
  const iIdx = chars.findIndex((c) => c === 'i' || c === 'j');
  const dotFromX = cx;
  const dotFromY = cy;
  const dotT = iIdx >= 0 ? eioc((frame - (t0 + iIdx * fpc + 1)) / 8) : 0;
  const dotX = iIdx >= 0 ? lerp(dotFromX, textLeft + (iIdx + 0.5) * cw, dotT) : cx;
  const dotY = iIdx >= 0 ? lerp(dotFromY, baseline - fs * 0.735, dotT) : cy - lift;

  const boxW = Math.min(w - 36 * u, Math.max(cw * n, (p.tagline[1] ?? '').length * tagFs2 * 0.6, (p.tagline[0] ?? '').length * tagFs1 * 0.6 * 1.35) + 110 * u);
  const boxTop = cy - fs * 0.78 - fs * 0.75;
  const boxBot = (p.tagline.length > 1 ? line2Y + tagFs2 * 0.65 : line1Y + tagFs1 * 0.8) + 10 * u;
  const boxH = boxBot - boxTop;
  const fd = eoc((frame - frameAt) / 10);
  const pillFs = Math.min(30 * u, (w * 0.8) / (Math.max(1, p.pill.length) * 0.6 * 1.3));
  const pillW = p.pill.length * pillFs * 0.6 * 1.3 + 90 * u;
  const pillH = pillFs * 2.6;
  const pillY = portrait ? h * 0.78 : h * 0.86;

  return (
    <AbsoluteFill>
      <Backdrop kind={p.backdrop} src={p.src || undefined} />
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="gol-dot" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#9cc2ff" />
            <stop offset="0.35" stopColor={p.accent} stopOpacity={0.9} />
            <stop offset="1" stopColor={p.accent} stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* radar grid that collapses into the centre */}
        {collapse < 1 && (
          <g opacity={1 - collapse} stroke={p.dim} fill="none" strokeWidth={1.2 * u}>
            {[1, 0.75, 0.5, 0.25].map((k, i) => (
              <circle key={i} cx={cx} cy={cy} r={R * 1.6 * k * (1 - collapse * 0.8)} />
            ))}
            {Array.from({length: 12}, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const r1 = R * 1.6 * (1 - collapse);
              return <line key={i} x1={cx + Math.cos(a) * r1 * collapse} y1={cy + Math.sin(a) * r1 * collapse} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} />;
            })}
          </g>
        )}
        {/* faint blueprint rings once the logo has formed */}
        <g opacity={0.22 * slide} fill="none" stroke={p.dim} strokeWidth={1 * u} transform={`rotate(${frame * 0.05} ${cx} ${cy})`}>
          {[1.9, 2.5, 3.3, 4.3].map((k, i) => (
            <circle key={i} cx={cx} cy={cy} r={R * k} strokeDasharray={i % 2 ? `${2 * u} ${10 * u}` : undefined} />
          ))}
        </g>
        {/* ring */}
        {ringErase < 1 && (
          <circle
            cx={cx}
            cy={cy}
            r={ringR}
            fill="none"
            stroke={p.color}
            strokeWidth={2.4 * u}
            transform={`rotate(180 ${cx} ${cy})`}
            strokeDasharray={`${circ * ringDraw * (1 - ringErase)} ${circ}`}
            strokeDashoffset={-circ * ringErase}
            opacity={0.9}
          />
        )}
        {/* orbiting glyphs */}
        {glyphs.map((g, i) => {
          const inAt = 12 + i;
          const fin = eoc((frame - inAt) / 9);
          if (fin <= 0) return null;
          const ang = g.a0 + orbitAng(frame);
          const rad = R * g.rr * lerp(g.from, 1, fin);
          let x = cx + Math.cos(ang) * rad;
          let y = cy + Math.sin(ang) * rad;
          // absorption into the typing point
          const gx0 = cx + Math.cos(g.a0 + orbitAng(t0)) * R * g.rr;
          const absorbAt = t0 + clamp((gx0 - textLeft) / cw, 0, n) * fpc + 2;
          const ab = eic((frame - absorbAt) / 6);
          if (ab >= 1) return null;
          const tx = textLeft + clamp((absorbAt - t0) / fpc, 0, n) * cw;
          x = lerp(x, tx, ab);
          y = lerp(y, logoY, ab);
          const s = (g.big ? 46 : 34) * u * (1 - ab);
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${g.shape.startsWith('M-0.55') ? g.rot : 0}) scale(${s})`} opacity={fin * (1 - ab * 0.5)}>
              <path d={g.shape} fill="none" stroke={p.color} strokeWidth={(2.6 * u) / s} strokeLinecap="round" strokeLinejoin="round" opacity={g.shape.startsWith('M-0.55') ? 0.55 : 0.9} />
            </g>
          );
        })}
        {/* logotype */}
        <g fontFamily={fonts.mono} fontWeight={700} fontSize={fs}>
          {chars.map((c, i) => {
            const at = t0 + i * fpc;
            if (frame < at || c === ' ') return null;
            const x = textLeft + (i + 0.5) * cw;
            if (p.variant === 'fly') {
              // letters fly out from the hero point one after another, motion-blurred, and settle into the wordmark
              const lt = clamp((frame - at) / Math.max(1, p.travel));
              const e = lt >= 1 ? 1 : 1 - Math.pow(2, -10 * lt);
              const fx = lerp(cx, x, e);
              const fy = lerp(cy, baseline, e);
              const sm = (1 - e) * (x - cx);
              return (
                <g key={i} opacity={clamp(lt * 6)}>
                  {[3, 2, 1].map((k) => (
                    <text key={k} x={fx - sm * 0.09 * k} y={fy - (cy - baseline) * 0.0} textAnchor="middle" fill={p.color} opacity={0.22 * (1 - e)}>
                      {c}
                    </text>
                  ))}
                  <text x={fx + 2.5 * u} y={fy + 2.5 * u} textAnchor="middle" fill="#000" opacity={0.6 * e}>
                    {c}
                  </text>
                  <text x={fx} y={fy} textAnchor="middle" fill={p.color}>
                    {c}
                  </text>
                </g>
              );
            }
            if (frame < at + 3) {
              const r = rng(`frag${i}-${frame}`);
              return (
                <g key={i} stroke={p.color} strokeWidth={2.4 * u} strokeLinecap="round">
                  {Array.from({length: 6}, (_, k) => {
                    const fx = x + (r() - 0.5) * cw * 0.9;
                    const fy = baseline - r() * fs * 0.75;
                    const a = r() * Math.PI;
                    const l = (0.12 + r() * 0.25) * fs;
                    return <line key={k} x1={fx} y1={fy} x2={fx + Math.cos(a) * l} y2={fy + Math.sin(a) * l} opacity={0.6 + r() * 0.4} />;
                  })}
                </g>
              );
            }
            return (
              <g key={i}>
                <text x={x + 2.5 * u} y={baseline + 2.5 * u} textAnchor="middle" fill="#000" opacity={0.7}>
                  {c}
                </text>
                <text x={x} y={baseline} textAnchor="middle" fill={p.color}>
                  {c}
                </text>
              </g>
            );
          })}
        </g>
        {p.paletteDashes.length > 0 && (
          <g>
            {p.paletteDashes.map((c, i) => {
              const m = p.paletteDashes.length;
              const dt = clamp((frame - (typeEnd + 2 + i * 3)) / 14);
              const e = 1 - Math.pow(1 - dt, 3);
              const dw = Math.min(cw * 1.1, (cw * n) / (m * 1.5));
              const tx = cx + (i - (m - 1) / 2) * dw * 1.4;
              const sx = cx + (i - (m - 1) / 2) * dw * 6;
              return <rect key={i} x={lerp(sx, tx, e) - dw / 2} y={baseline + fs * 0.32 - lift * 0} width={dw} height={Math.max(3 * u, fs * 0.05)} rx={fs * 0.025} fill={c} opacity={e} />;
            })}
          </g>
        )}
        {/* focus dot */}
        <circle cx={dotX} cy={dotY} r={fs * 0.42} fill="url(#gol-dot)" opacity={0.55} />
        <circle cx={dotX} cy={dotY} r={Math.max(7 * u, fs * 0.085)} fill={p.dotColor || p.accent} />
        {/* frame around the lock-up */}
        {fd > 0 && (
          <g stroke={p.color} strokeWidth={1.3 * u} fill="none" opacity={0.35}>
            <line x1={cx - (boxW / 2) * fd} x2={cx + (boxW / 2) * fd} y1={boxTop} y2={boxTop} />
            <line x1={cx - boxW / 2} x2={cx - boxW / 2} y1={boxTop} y2={boxTop + boxH * clamp(fd * 1.4 - 0.3)} />
            <line x1={cx + boxW / 2} x2={cx + boxW / 2} y1={boxTop} y2={boxTop + boxH * clamp(fd * 1.4 - 0.3)} />
            <line x1={cx - (boxW / 2) * clamp(fd * 2 - 1)} x2={cx + (boxW / 2) * clamp(fd * 2 - 1)} y1={boxBot} y2={boxBot} />
          </g>
        )}
        {fd >= 1 &&
          [
            [-1, 0],
            [1, 0],
            [-1, 1],
            [1, 1],
          ].map(([sx, sy], i) => <circle key={i} cx={cx + (sx * boxW) / 2} cy={sy ? boxBot : boxTop} r={2.5 * u} fill={p.color} opacity={0.6} />)}
        {/* tagline */}
        {p.tagline[0] && (
          <text x={cx} y={line1Y} textAnchor="middle" fontFamily={tfonts.plex} fontWeight={500} fontSize={tagFs1} letterSpacing={tagFs1 * 0.35} fill={p.dim} dominantBaseline="middle">
            {p.tagline[0].slice(0, n1)}
          </text>
        )}
        {p.tagline[1] && (
          <g fontFamily={fonts.mono} fontWeight={700} fontSize={tagFs2}>
            <text x={cx + 2 * u} y={line2Y + 2 * u} textAnchor="middle" dominantBaseline="middle" fill="#000" opacity={0.6}>
              {p.tagline[1].slice(0, n2)}
            </text>
            <text x={cx} y={line2Y} textAnchor="middle" dominantBaseline="middle" fill={p.color}>
              {p.tagline[1].slice(0, n2)}
            </text>
          </g>
        )}
        {p.pill && frame >= pillAt && (
          <g opacity={eoc((frame - pillAt) / 6)}>
            <rect x={cx - pillW / 2} y={pillY - pillH / 2} width={pillW} height={pillH} fill="#0b0c11" stroke={p.color} strokeOpacity={0.45} strokeWidth={1.5 * u} />
            <rect x={cx - pillW / 2 + 6 * u} y={pillY - pillH / 2 + 6 * u} width={pillW - 12 * u} height={pillH - 12 * u} fill="none" stroke={p.color} strokeOpacity={0.25} strokeWidth={1.2 * u} />
            <text x={cx} y={pillY} textAnchor="middle" dominantBaseline="middle" fontFamily={tfonts.plex} fontWeight={700} fontSize={pillFs} letterSpacing={pillFs * 0.3} fill={p.color}>
              {p.pill.slice(0, np)}
            </text>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

export const glyphOrbitLogo = defineMotion<Props>({
  id: 'glyph-orbit-logo',
  title: 'Glyph-orbit logo build',
  category: 'text',
  description: 'Glyphs fly in and orbit a ring, then resolve into a typed mono logotype (scrambled letter fragments, blue dot becomes the i tittle); a frame draws around it and tagline lines type below.',
  source: ['video19 0:15.4-0:20.0'],
  useFor: 'Logo reveals, brand end cards, product names and title lock-ups.',
  durationInFrames: 220,
  defaultProps: {
    logo: 'Ideas in Motion',
    tagline: ['KNOWLEDGE WAS ALWAYS', 'THE TECHNOLOGY.'],
    pill: 'BUILT IN THE OPEN.',
    glyphCount: 16,
    orbitRadius: 230,
    framesPerChar: 3,
    typeStart: 44,
    color: '#DADDE5',
    dim: '#8A8C93',
    accent: '#5086FE',
    backdrop: 'ink',
    src: '',
    seed: 2,
    variant: 'orbit',
    travel: 12,
    paletteDashes: [],
    dotColor: '',
  },
  propDocs: {
    variant: "orbit (typed with jumble) | fly (wordmark-fly-assemble: letters fly out of the hero point one after another, motion-blurred, and settle into the wordmark)",
    travel: 'fly: frames each letter takes to travel (0.42 s = 12)',
    paletteDashes: "fly: colours of short dashes that line up under the logo as a palette signature (e.g. ['#FF5A4A','#FFC24A','#3FB6C8'])",
    dotColor: "colour of the focus / tittle dot ('' = accent)",
    logo: 'logotype text (monospaced; the first lowercase i/j gets the blue dot)',
    tagline: 'up to two lines typed under the logo: [small tracked line, bold line]',
    pill: 'double-ruled label typed at the bottom ("" = none)',
    glyphCount: 'number of orbiting glyphs',
    orbitRadius: 'glyph orbit radius in px at 1080p',
    framesPerChar: 'logotype typing speed (frames per letter; each letter scrambles for 3 frames)',
    typeStart: 'frame the logotype starts typing',
    accent: 'focus dot colour',
    backdrop: 'ink (blueprint black) | any backdrop kind',
  },
  component: GlyphOrbitLogo,
  tags: ['logo', 'brand', 'typewriter', 'glyphs', 'endcard', 'blueprint', 'wordmark', 'fly in', 'assemble', 'palette', 'logo reveal'],
});
