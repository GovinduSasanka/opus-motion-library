import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {AgentAvatar, Brackets, KLEIN, easeOutBack, lin, scramble, typedText, wrap, x58Fonts} from '../../core/r2-x58-kit';
import {promptWall} from '../hud/prompt-wall';

/**
 * x6 versus-roster: on the Klein-blue terminal screen a row of square portrait cards separated by small "vs",
 * each framed with white L-corner brackets and a tiny uppercase name above. Cards appear as black squares, the
 * portraits cut in 10 frames later; then each card in turn scales 1.0 → 1.3 (easeOutBack 1.2, 0.2 s) for ≈ 0.8 s
 * while a short mono bio types in below it at ≈ 60 chars/s. Header "#82  THE BATTLE FOR ASCENDANCY" and a pixel
 * blackletter "[ Enter the Simulation ]" scramble-decode in. Ghost prompt panels behind. 2×2 grid at 9:16.
 */
type Card = {name: string; bio: string; src?: string};
type Props = {
  background: string;
  cards: Card[];
  images: string[];
  colors: string[];
  header: string;
  cta: string;
  brand: string;
  corner: string;
  separator: string;
  bracketColor: string;
  hoverStart: number;
  hoverEvery: number;
  ghost: boolean;
};

const VersusRoster: React.FC<Props> = ({background, cards, images, colors, header, cta, brand, corner, separator, bracketColor, hoverStart, hoverEvery, ghost}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const n = Math.max(1, cards.length);
  const cols = portrait ? 2 : n;
  const rows = Math.ceil(n / cols);
  const card = portrait ? w * 0.3 : Math.min(w * 0.11, (w * 0.7) / (n * 1.55));
  const gap = portrait ? w * 0.12 : card * 0.55;
  const gridW = cols * card + (cols - 1) * gap;
  const gridH = rows * card + (rows - 1) * card * 0.55;
  const x0 = (w - gridW) / 2;
  const y0 = portrait ? h * 0.3 : h * 0.45 - card / 2;
  const hoverIdx = frame >= hoverStart ? Math.floor((frame - hoverStart) / hoverEvery) : -1;
  const active = hoverIdx >= 0 && hoverIdx < n ? hoverIdx : -1;
  const fs = 13 * u * (portrait ? 1.6 : 1);
  const headerTxt = scramble(header, frame, 4, 20, 3);
  const ctaTxt = scramble(`[ ${cta} ]`, frame, 4, 20, 5);
  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      {ghost ? <promptWall.component {...promptWall.defaultProps} background="transparent" density={1} scanlines={false} /> : null}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <text x={w / 2} y={y0 - card * (portrait ? 0.75 : 0.95)} textAnchor="middle" fontFamily={x58Fonts.mono} fontSize={fs * 1.15} fill="#fff" letterSpacing={fs * 0.12}>
          {headerTxt}
        </text>
        {cards.map((c, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const cx = x0 + col * (card + gap) + card / 2;
          const cy = y0 + row * card * 1.55 + card / 2;
          const appear = frame >= i * 2 + 4;
          if (!appear) return null;
          const isOn = i === active;
          const tOn = isOn ? lin(frame, hoverStart + i * hoverEvery, hoverStart + i * hoverEvery + 6) : 0;
          const tOff = !isOn && hoverIdx > i && hoverIdx - 1 === i ? 1 - lin(frame, hoverStart + (i + 1) * hoverEvery, hoverStart + (i + 1) * hoverEvery + 5) : 0;
          const sc = 1 + 0.3 * (isOn ? easeOutBack(tOn, 1.2) : tOff);
          const sz = card * sc;
          const showPic = frame >= 14 + i;
          const src = c.src || images[i];
          const color = colors[i % colors.length] ?? '#fff';
          return (
            <g key={i}>
              <text x={cx} y={cy - sz / 2 - 12 * u} textAnchor="middle" fontFamily={x58Fonts.mono} fontSize={fs * 0.82} fill={isOn ? color : '#fff'} letterSpacing={fs * 0.08} fontWeight={500}>
                {c.name.toUpperCase()}
              </text>
              <g transform={`translate(${cx - sz / 2} ${cy - sz / 2})`}>
                <rect width={sz} height={sz} fill="#000" />
                {showPic ? (
                  src ? (
                    <foreignObject width={sz} height={sz}>
                      <Img src={resolveSrc(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    </foreignObject>
                  ) : (
                    <AgentAvatar id={`vr-av-${i}`} kind={i} x={0} y={0} s={sz} color={color} frame={frame} />
                  )
                ) : null}
                <rect width={sz} height={sz} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={1 * u} />
                <Brackets x={-5 * u} y={-5 * u} w={sz + 10 * u} h={sz + 10 * u} len={12 * u} color={bracketColor} sw={2 * u} />
              </g>
              {i < n - 1 && col < cols - 1 ? (
                <text x={cx + card / 2 + gap / 2} y={cy + fs * 0.35} textAnchor="middle" fontFamily={x58Fonts.mono} fontSize={fs} fill="#fff" opacity={0.85}>
                  {separator}
                </text>
              ) : null}
              {isOn
                ? (() => {
                    const typed = typedText(c.bio, frame, hoverStart + i * hoverEvery + 3, 60, fps);
                    const lines = wrap(typed, portrait ? 34 : 24);
                    const bx = portrait ? w / 2 : cx - sz / 2;
                    const by = portrait ? y0 + gridH + card * 0.35 : cy + sz / 2 + 22 * u;
                    return lines.map((ln, j) => (
                      <text key={j} x={bx} y={by + j * fs * 1.45} textAnchor={portrait ? 'middle' : 'start'} fontFamily={x58Fonts.mono} fontSize={fs} fill="#fff">
                        {ln}
                      </text>
                    ));
                  })()
                : null}
            </g>
          );
        })}
      </svg>
      <div style={{position: 'absolute', left: w * 0.03, top: h * 0.04, fontFamily: x58Fonts.blackletter, fontSize: (portrait ? 54 : 40) * u, color: KLEIN.title}}>[ {brand} ]</div>
      <div style={{position: 'absolute', right: w * 0.03, top: h * 0.055, fontFamily: x58Fonts.mono, fontSize: fs, color: '#fff', letterSpacing: fs * 0.1}}>{corner}</div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: portrait ? h * 0.78 : h * 0.73,
          textAlign: 'center',
          fontFamily: x58Fonts.blackletter,
          fontSize: (portrait ? 76 : 62) * u,
          color: KLEIN.title,
          whiteSpace: 'pre',
          textShadow: `${2 * u}px 0 rgba(255,42,109,0.3), ${-2 * u}px 0 rgba(0,220,255,0.3)`,
        }}
      >
        {ctaTxt}
      </div>
      <div style={{position: 'absolute', left: w * 0.03, bottom: h * 0.03, fontFamily: x58Fonts.blackletter, fontSize: 26 * u, color: '#fff'}}>[ contact ]</div>
      <div style={{position: 'absolute', right: w * 0.03, bottom: h * 0.03, fontFamily: x58Fonts.blackletter, fontSize: 26 * u, color: '#fff'}}>[ rules ]</div>
      <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.07, backgroundImage: `repeating-linear-gradient(0deg, #000 0px, #000 ${1 * u}px, transparent ${1 * u}px, transparent ${3 * u}px)`}} />
    </AbsoluteFill>
  );
};

export const versusRoster = defineMotion<Props>({
  id: 'versus-roster',
  title: 'Versus roster',
  category: 'ui',
  description:
    'A row of square contender portraits separated by "vs", each in white corner brackets with a small name above; cards cut in from black, then each one in turn scales up while a mono bio types in below it, on a Klein-blue terminal screen with a scramble-decoded header and blackletter call to action.',
  source: ['video x6 4.6-8.1 s (four generals "vs" roster, hover bios)'],
  useFor: '"Four contenders" intros for comparisons, tournaments, model or product line-ups and team introductions.',
  durationInFrames: 130,
  defaultProps: {
    background: KLEIN.bg,
    cards: [
      {name: 'General Onyx', bio: 'Cold, fast and blunt. I strike first and explain myself after the dust settles.'},
      {name: 'General Atlas', bio: 'Patient strategist. I map every ridge and river before a single soldier moves.'},
      {name: 'General Vega', bio: 'I see the whole board at once and play three turns ahead of everyone else.'},
      {name: 'General Nova', bio: 'Warm voice, iron will. I win by keeping my army alive longer than yours.'},
    ],
    images: [],
    colors: ['#8D8AB8', '#A9D9D0', '#CBB8F5', '#E58682'],
    header: '#82   THE BATTLE FOR ASCENDANCY',
    cta: 'Enter the Simulation',
    brand: 'Project Lumen',
    corner: 'SIMULATION 82',
    separator: 'vs',
    bracketColor: '#FFFFFF',
    hoverStart: 26,
    hoverEvery: 24,
    ghost: true,
  },
  propDocs: {
    background: 'screen colour (Klein blue)',
    cards: 'contenders: {name, bio, src?} (src = public/ image path; otherwise an abstract generated portrait)',
    images: 'portrait images by index (alternative to cards[].src)',
    colors: 'accent colour per contender (name highlight while hovered, avatar tint)',
    header: 'mono header above the row (scramble-decodes in)',
    cta: 'blackletter call to action, shown as [ … ]',
    brand: 'top-left blackletter brand, shown as [ … ]',
    corner: 'top-right mono label',
    separator: 'text between cards',
    bracketColor: 'corner bracket colour',
    hoverStart: 'frame the first card enlarges',
    hoverEvery: 'frames each card stays enlarged',
    ghost: 'faint prompt-template panels behind',
  },
  component: VersusRoster,
  tags: ['versus', 'vs', 'roster', 'contenders', 'cards', 'portraits', 'line-up', 'comparison', 'tournament', 'ai agents', 'terminal', 'klein blue', 'blackletter', 'bio', 'hover', 'ui', 'game'],
});
