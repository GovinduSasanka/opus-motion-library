import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {mix, rgbaStr} from '../../core/r2-pr3-kit';
import {rng} from '../../core/random';
import {ArtBox, wrapText} from '../../core/music-kit';

/**
 * Vinyl record spinning on a platter: grooves, fixed light sheen, scratches, a centre label (your art in `labelSrc`
 * or a procedural label with side letter + text) and a tonearm that swings in and drops onto the groove, then
 * slowly tracks inward. Title / artist / caption sit beside (landscape) or below (square, portrait).
 */
type Props = {
  title: string;
  artist: string;
  caption: string;
  side: string;
  labelText: string;
  labelSrc: string;
  rpm: number;
  tonearm: boolean;
  dropAt: number;
  recordColor: string;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  fontFamily: string;
  seed: number;
};

const NAME = 'vsl';

const VinylSpinLabel: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames} = useStage();
  const stacked = w / h < 1.3;
  const clear = P.background === 'transparent';
  const heading = P.fontFamily || fonts.grotesk;
  const body = P.fontFamily || fonts.sans;

  // ---- layout -------------------------------------------------------------------------------------------------
  const R = stacked ? Math.min(w * 0.34, h * (w < h ? 0.3 : 0.27)) : Math.min(h * 0.4, w * 0.21);
  const cx = stacked ? w / 2 : w * 0.34;
  const cy = stacked ? (w < h ? h * 0.42 : h * 0.37) : h * 0.5;
  const Rl = R * 0.37;

  // ---- spin ---------------------------------------------------------------------------------------------------
  const degPerFrame = (P.rpm * 360) / 60 / fps;
  const spinF = frame < 24 ? (frame * frame) / 48 : frame - 12;
  const angle = spinF * degPerFrame;
  const appear = prog(frame, 0, 22, ease.out);
  const rec = React.useMemo(() => {
    const r = rng(P.seed * 31 + 5);
    const grooves = Array.from({length: 34}, (_, i) => ({
      rr: lerp(Rl * 1.18, R * 0.975, i / 33),
      o: 0.035 + r() * 0.07,
    }));
    const gaps = [0.46, 0.63, 0.8].map((k) => R * k + (r() - 0.5) * R * 0.03);
    const scratches = Array.from({length: 6}, () => ({a0: r() * 360, len: 12 + r() * 40, rr: lerp(Rl * 1.3, R * 0.95, r()), o: 0.06 + r() * 0.1}));
    return {grooves, gaps, scratches};
  }, [P.seed, R, Rl]);

  // ---- tonearm ------------------------------------------------------------------------------------------------
  const pivot = {x: cx + R * 1.17, y: cy - R * 0.72};
  const L = R * 1.3;
  const phi0 = (Math.atan2(cy - pivot.y, cx - pivot.x) * 180) / Math.PI;
  const headAt = (a: number) => {
    const r = (a * Math.PI) / 180;
    return {x: pivot.x + Math.cos(r) * L, y: pivot.y + Math.sin(r) * L};
  };
  const solve = (target: number) => {
    let lo = phi0 - 55;
    let hi = phi0;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      const hd = headAt(m);
      const d = Math.hypot(hd.x - cx, hd.y - cy);
      if (d > target) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  };
  const aRest = phi0 - 44;
  const aStart = solve(R * 0.93);
  const aEnd = solve(Rl * 1.25);
  const dropEnd = P.dropAt + 34;
  const swing = prog(frame, P.dropAt, dropEnd, ease.inOut);
  const track = prog(frame, dropEnd, durationInFrames, ease.linear) * 0.55;
  const armA = P.tonearm ? (frame < dropEnd ? lerp(aRest, aStart, swing) : lerp(aStart, aEnd, track)) : aRest;
  const lift = P.tonearm ? (frame < dropEnd ? (1 - prog(frame, dropEnd - 10, dropEnd, ease.in)) : 0) : 1;
  const hd = headAt(armA);
  const armIn = prog(frame, 6, 26, ease.out);
  const needleBounce = frame >= dropEnd && frame < dropEnd + 10 ? Math.sin(((frame - dropEnd) / 10) * Math.PI) * 1.2 : 0;

  // ---- text ---------------------------------------------------------------------------------------------------
  const titleFs = (stacked ? (w < h ? 78 : 62) : 96) * u;
  const textX = stacked ? w / 2 : w * 0.62;
  const textW = stacked ? w * 0.86 : w - textX - w * 0.07;
  const anchor = stacked ? 'middle' : 'start';
  const tLines = wrapText(P.title, Math.max(6, Math.floor(textW / (titleFs * 0.56))), 3);
  const tY0 = stacked ? cy + R * 1.3 + titleFs * 0.95 : cy - ((tLines.length - 1) * titleFs * 1.08) / 2 - 20 * u;
  const tIn = (d: number) => prog(frame, d, d + 22, ease.out);

  const labelCol = P.accent;
  const nodesLabel = (
    <g transform={`rotate(${angle} ${cx} ${cy})`}>
      {!P.labelSrc && (
        <>
          <circle cx={cx} cy={cy} r={Rl} fill={labelCol} />
          <circle cx={cx} cy={cy} r={Rl * 0.94} fill="none" stroke={rgbaStr('#ffffff', 0.35)} strokeWidth={1.5 * u} />
          <circle cx={cx} cy={cy} r={Rl * 0.66} fill="none" stroke={rgbaStr('#000000', 0.18)} strokeWidth={1.5 * u} />
          <path d={`M ${cx - Rl} ${cy} A ${Rl} ${Rl} 0 0 1 ${cx + Rl} ${cy} L ${cx + Rl * 0.6} ${cy} A ${Rl * 0.6} ${Rl * 0.6} 0 0 0 ${cx - Rl * 0.6} ${cy} Z`} fill={rgbaStr(P.accent2, 0.55)} />
          <text x={cx} y={cy + Rl * 0.56} textAnchor="middle" fontFamily={heading} fontWeight={700} fontSize={Rl * 0.52} fill={rgbaStr('#000000', 0.8)}>
            {P.side}
          </text>
          <text x={cx} y={cy - Rl * 0.55} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={Rl * 0.105} letterSpacing={Rl * 0.03} fill={rgbaStr('#ffffff', 0.92)}>
            {P.labelText.toUpperCase()}
          </text>
          <text x={cx} y={cy - Rl * 0.3} textAnchor="middle" fontFamily={fonts.mono} fontSize={Rl * 0.1} letterSpacing={Rl * 0.02} fill={rgbaStr('#ffffff', 0.7)}>
            {`${Math.round(P.rpm)} RPM · STEREO`}
          </text>
        </>
      )}
    </g>
  );

  const bg = clear ? undefined : `radial-gradient(ellipse at ${stacked ? '50% 35%' : '34% 50%'}, ${mix(P.background, P.accent2, 0.2)} 0%, ${P.background} 66%, ${mix(P.background, '#000000', 0.4)} 100%)`;
  const sheenA = (deg: number, op: number) => {
    const a0 = ((deg - 16) * Math.PI) / 180;
    const a1 = ((deg + 16) * Math.PI) / 180;
    const rr = R * 0.99;
    return (
      <path
        d={`M ${cx} ${cy} L ${cx + Math.cos(a0) * rr} ${cy + Math.sin(a0) * rr} A ${rr} ${rr} 0 0 1 ${cx + Math.cos(a1) * rr} ${cy + Math.sin(a1) * rr} Z`}
        fill={`url(#${NAME}-sheen)`}
        opacity={op}
      />
    );
  };

  const armW = R * 0.032;
  const sh = lift * R * 0.05;

  return (
    <AbsoluteFill style={{background: bg}}>
      <Svg>
        <defs>
          <radialGradient id={`${NAME}-sheen`} cx={cx} cy={cy} r={R} gradientUnits="userSpaceOnUse">
            <stop offset="0.2" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.65" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
          </radialGradient>
          <radialGradient id={`${NAME}-rec`} cx={cx} cy={cy} r={R} gradientUnits="userSpaceOnUse">
            <stop offset="0.3" stopColor={mix(P.recordColor, '#ffffff', 0.04)} />
            <stop offset="1" stopColor={mix(P.recordColor, '#000000', 0.25)} />
          </radialGradient>
          <filter id={`${NAME}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy={14 * u} stdDeviation={22 * u} floodColor="#000" floodOpacity="0.55" />
          </filter>
          <filter id={`${NAME}-blur`}>
            <feGaussianBlur stdDeviation={5 * u} />
          </filter>
        </defs>
        <g opacity={appear} transform={`translate(${cx} ${cy}) scale(${0.9 + 0.1 * appear}) translate(${-cx} ${-cy})`}>
          <circle cx={cx} cy={cy} r={R * 1.07} fill={mix(P.recordColor, '#000000', 0.6)} filter={`url(#${NAME}-shadow)`} />
          <circle cx={cx} cy={cy} r={R} fill={`url(#${NAME}-rec)`} />
          <g transform={`rotate(${angle} ${cx} ${cy})`}>
            {rec.grooves.map((g, i) => (
              <circle key={i} cx={cx} cy={cy} r={g.rr} fill="none" stroke="#ffffff" strokeOpacity={g.o} strokeWidth={Math.max(1, 1.2 * u)} />
            ))}
            {rec.gaps.map((g, i) => (
              <circle key={`g${i}`} cx={cx} cy={cy} r={g} fill="none" stroke="#000000" strokeOpacity={0.55} strokeWidth={3 * u} />
            ))}
            {rec.scratches.map((s, i) => {
              const a0 = (s.a0 * Math.PI) / 180;
              const a1 = ((s.a0 + s.len) * Math.PI) / 180;
              return <path key={`s${i}`} d={`M ${cx + Math.cos(a0) * s.rr} ${cy + Math.sin(a0) * s.rr} A ${s.rr} ${s.rr} 0 0 1 ${cx + Math.cos(a1) * s.rr} ${cy + Math.sin(a1) * s.rr}`} fill="none" stroke="#fff" strokeOpacity={s.o} strokeWidth={1.4 * u} strokeLinecap="round" />;
            })}
          </g>
          {sheenA(-38, 0.16)}
          {sheenA(142, 0.16)}
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={rgbaStr('#ffffff', 0.12)} strokeWidth={2 * u} />
        </g>
      </Svg>
      {P.labelSrc && (
        <ArtBox uid={NAME} x={cx - Rl} y={cy - Rl} size={Rl * 2} src={P.labelSrc} accent={P.accent} accent2={P.accent2} round rotate={angle} opacity={appear} scale={0.9 + 0.1 * appear} />
      )}
      <Svg>
        <g opacity={appear} transform={`translate(${cx} ${cy}) scale(${0.9 + 0.1 * appear}) translate(${-cx} ${-cy})`}>
          {nodesLabel}
          <circle cx={cx} cy={cy} r={R * 0.03} fill={P.background === 'transparent' ? '#0b0b10' : mix(P.background, '#000000', 0.4)} />
          <circle cx={cx} cy={cy} r={R * 0.012} fill={rgbaStr('#ffffff', 0.5)} />
        </g>
        {P.tonearm && (
          <g opacity={armIn}>
            {/* arm shadow (grows when lifted) */}
            <g transform={`translate(${sh * 0.6} ${sh})`} opacity={0.32} filter={`url(#${NAME}-blur)`}>
              <line x1={pivot.x} y1={pivot.y} x2={hd.x} y2={hd.y} stroke="#000" strokeWidth={armW * 1.2} strokeLinecap="round" />
            </g>
            {/* counterweight stub */}
            <line
              x1={pivot.x}
              y1={pivot.y}
              x2={pivot.x - Math.cos((armA * Math.PI) / 180) * R * 0.3}
              y2={pivot.y - Math.sin((armA * Math.PI) / 180) * R * 0.3}
              stroke="#8b8fa0"
              strokeWidth={armW * 2.6}
              strokeLinecap="round"
            />
            <line x1={pivot.x} y1={pivot.y} x2={hd.x} y2={hd.y} stroke="#cfd2dc" strokeWidth={armW} strokeLinecap="round" />
            <line x1={pivot.x} y1={pivot.y} x2={hd.x} y2={hd.y} stroke="#ffffff" strokeOpacity={0.5} strokeWidth={armW * 0.3} strokeLinecap="round" transform={`translate(${-armW * 0.2} ${-armW * 0.2})`} />
            {/* headshell */}
            <g transform={`translate(${hd.x + sh * 0.25} ${hd.y + sh * 0.5 + needleBounce}) rotate(${armA - 12})`}>
              <rect x={-R * 0.02} y={-R * 0.045} width={R * 0.17} height={R * 0.09} rx={R * 0.02} fill="#2a2c36" stroke="#cfd2dc" strokeWidth={1.4 * u} />
              <rect x={R * 0.06} y={-R * 0.028} width={R * 0.07} height={R * 0.056} rx={R * 0.01} fill={P.accent} />
            </g>
            {/* pivot base */}
            <circle cx={pivot.x} cy={pivot.y} r={R * 0.115} fill="#2a2c36" stroke="#9ea2b3" strokeWidth={2.5 * u} />
            <circle cx={pivot.x} cy={pivot.y} r={R * 0.06} fill="#cfd2dc" />
            <circle cx={pivot.x} cy={pivot.y} r={R * 0.02} fill="#2a2c36" />
          </g>
        )}
        {/* text */}
        <g>
          <text x={textX} y={tY0 - titleFs * 1.18 - (stacked ? 0 : 6 * u)} textAnchor={anchor} fontFamily={fonts.mono} fontWeight={700} fontSize={(stacked ? 26 : 26) * u} letterSpacing={5 * u} fill={P.accent} opacity={tIn(24)} display={stacked ? 'none' : undefined}>
            {`SIDE ${P.side.toUpperCase()}`}
          </text>
          {tLines.map((ln, i) => (
            <text
              key={i}
              x={textX}
              y={tY0 + i * titleFs * 1.08 + (1 - tIn(28 + i * 4)) * 22 * u}
              textAnchor={anchor}
              fontFamily={heading}
              fontWeight={700}
              fontSize={titleFs}
              fill={P.ink}
              opacity={tIn(28 + i * 4)}
            >
              {ln}
            </text>
          ))}
          <text x={textX} y={tY0 + tLines.length * titleFs * 1.08 + 16 * u} textAnchor={anchor} fontFamily={body} fontWeight={600} fontSize={(stacked ? 38 : 44) * u} fill={rgbaStr(P.ink, 0.85)} opacity={tIn(40)}>
            {P.artist}
          </text>
          <text x={textX} y={tY0 + tLines.length * titleFs * 1.08 + 16 * u + (stacked ? 52 : 60) * u} textAnchor={anchor} fontFamily={fonts.mono} fontSize={(stacked ? 24 : 26) * u} letterSpacing={4 * u} fill={rgbaStr(P.ink, 0.5)} opacity={tIn(48)}>
            {P.caption.toUpperCase()}
          </text>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const vinylSpinLabel = defineMotion<Props>({
  id: 'vinyl-spin-label',
  title: 'Vinyl record spin with label + tonearm drop',
  category: 'music',
  description:
    'A vinyl record on a platter: grooves, track gaps, scratches and two fixed light sheens while it spins up to 33 rpm; the centre label shows your art (or a procedural side-A label), and a metal tonearm swings in, drops onto the groove and slowly tracks inward. Title, artist and caption sit beside it on landscape and below it on square / portrait.',
  source: ['original (turntable pattern)'],
  useFor: 'Album / single / playlist announcements, "now spinning" stream overlays, vinyl-drop and record-store promos, retro music intros, podcast bumpers. Swap labelSrc for the release art.',
  durationInFrames: 240,
  defaultProps: {
    title: 'Midnight Static',
    artist: 'Sample Artist',
    caption: 'Out now on vinyl',
    side: 'A',
    labelText: 'Sample Records',
    labelSrc: '',
    rpm: 33.3,
    tonearm: true,
    dropAt: 30,
    recordColor: '#101015',
    background: '#17161f',
    ink: '#F5F3EE',
    accent: '#F2A33A',
    accent2: '#C2410C',
    fontFamily: '',
    seed: 4,
  },
  propDocs: {
    title: 'release / track title (wraps to 3 lines)',
    artist: 'artist name',
    caption: 'small caps line under the artist',
    side: 'side letter on the procedural label and the SIDE tag',
    labelText: 'small text on the procedural label (label / brand)',
    labelSrc: 'picture for the record label (public/ path or URL); empty = procedural label',
    rpm: 'revolutions per minute (33.3, 45, 78)',
    tonearm: 'show the tonearm (false = bare spinning record)',
    dropAt: 'frame the tonearm starts swinging in',
    recordColor: 'vinyl colour (dark for black wax, any colour for coloured vinyl)',
    background: "background colour, or 'transparent' to overlay on video",
    ink: 'text colour',
    accent: 'label colour and tonearm cartridge',
    accent2: 'label stripe and background tint',
    fontFamily: 'optional CSS font-family for all text (default: Space Grotesk + Inter)',
    seed: 'groove / scratch seed',
  },
  component: VinylSpinLabel,
  tags: ['vinyl', 'record', 'turntable', 'music', 'album', 'spin', 'tonearm', 'dj', 'retro', 'lp', 'now playing', 'label', 'analog', 'release', 'single', 'overlay'],
});
