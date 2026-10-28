import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {fonts} from '../../core/fonts';
import {backOut, easeOut3, mixHex, smooth01, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Burst, roundStarPath} from '../../core/r3-edu-kit';
import {ROW, Poly, fullPath, glyphStrokes, hasDescender, isLowerGlyph, pointAt, samplePath, slicePath} from '../../core/r3-edu-glyphs';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Handwriting lesson: a ruled-paper board shows a dotted letter track, numbered start dots with arrows give the stroke
 * order, a pen dot traces each stroke in turn, the letter pops, then the board slides aside for a drawn picture and the
 * example word ("A is for Apple").
 */
type Props = {
  letter: string;
  exampleWord: string;
  exampleLead: string;
  picture: string;
  imageSrc: string;
  prompt: string;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  board: string;
  fontFamily: string;
  showPicture: boolean;
  traceFrames: number;
  startAt: number;
  speed: number;
};

const PICTURES = ['apple', 'ball', 'cat', 'sun', 'fish', 'star', 'house', 'tree'];

/** original flat illustrations in a 200 x 200 box */
const Picture: React.FC<{kind: string; ink: string; accent: string; accent2: string}> = ({kind, ink, accent, accent2}) => {
  const sw = {stroke: ink, strokeWidth: 5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};
  switch (kind) {
    case 'ball': {
      const cols = [accent, '#FFFFFF', accent2, '#FFFFFF', '#4DB6E8', '#FFFFFF'];
      return (
        <g>
          {cols.map((c, i) => {
            const a0 = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const a1 = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2;
            return <path key={i} d={`M100 104 L${100 + Math.cos(a0) * 74} ${104 + Math.sin(a0) * 74} A74 74 0 0 1 ${100 + Math.cos(a1) * 74} ${104 + Math.sin(a1) * 74}Z`} fill={c} />;
          })}
          <circle cx="100" cy="104" r="74" fill="none" {...sw} />
          <circle cx="100" cy="104" r="10" fill={ink} />
          <ellipse cx="70" cy="68" rx="14" ry="8" fill="#fff" opacity="0.7" transform="rotate(-35 70 68)" />
        </g>
      );
    }
    case 'cat':
      return (
        <g>
          <path d="M40 90 L44 28 L88 62Z M160 90 L156 28 L112 62Z" fill="#F4A259" {...sw} />
          <path d="M52 76 L52 46 L76 64Z M148 76 L148 46 L124 64Z" fill="#F7B8B8" />
          <ellipse cx="100" cy="116" rx="68" ry="58" fill="#F4A259" {...sw} />
          <path d="M84 68 L100 78 L116 68 M70 80 L84 88 M130 80 L116 88" stroke="#C97B2E" strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx="76" cy="108" r="9" fill={ink} />
          <circle cx="124" cy="108" r="9" fill={ink} />
          <circle cx="79" cy="105" r="3" fill="#fff" />
          <circle cx="127" cy="105" r="3" fill="#fff" />
          <path d="M92 126 L108 126 L100 136Z" fill="#E56B8A" />
          <path d="M100 136 L100 142 M100 142 C92 152 84 150 82 146 M100 142 C108 152 116 150 118 146" stroke={ink} strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M60 130 L30 124 M60 138 L32 144 M140 130 L170 124 M140 138 L168 144" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      );
    case 'sun':
      return (
        <g>
          {Array.from({length: 12}, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={100 + Math.cos(a) * 66} y1={100 + Math.sin(a) * 66} x2={100 + Math.cos(a) * (i % 2 ? 84 : 92)} y2={100 + Math.sin(a) * (i % 2 ? 84 : 92)} stroke={accent2} strokeWidth="11" strokeLinecap="round" />;
          })}
          <circle cx="100" cy="100" r="52" fill="#FFD23F" {...sw} />
          <circle cx="82" cy="92" r="6" fill={ink} />
          <circle cx="118" cy="92" r="6" fill={ink} />
          <path d="M80 112 C90 128 110 128 120 112" fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round" />
          <circle cx="68" cy="110" r="7" fill="#FF8FA3" opacity="0.7" />
          <circle cx="132" cy="110" r="7" fill="#FF8FA3" opacity="0.7" />
        </g>
      );
    case 'fish':
      return (
        <g>
          <path d="M150 100 L188 68 L188 132Z" fill={accent2} {...sw} />
          <ellipse cx="94" cy="100" rx="70" ry="48" fill="#4DB6E8" {...sw} />
          <path d="M80 54 C90 30 112 30 120 56Z" fill={accent2} {...sw} />
          <path d="M96 78 C106 90 106 110 96 122 M116 82 C124 92 124 108 116 118" fill="none" stroke="#2A87B8" strokeWidth="4" strokeLinecap="round" />
          <circle cx="52" cy="90" r="11" fill="#fff" stroke={ink} strokeWidth="4" />
          <circle cx="50" cy="90" r="5" fill={ink} />
          <path d="M34 114 C42 122 52 122 58 116" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" />
          <circle cx="22" cy="60" r="7" fill="none" stroke={ink} strokeWidth="3" />
          <circle cx="34" cy="38" r="5" fill="none" stroke={ink} strokeWidth="3" />
        </g>
      );
    case 'star':
      return (
        <g>
          <path d={roundStarPath(100, 104, 86, 0.5, 5, 0.14)} fill="#FFD23F" {...sw} />
          <circle cx="82" cy="104" r="6" fill={ink} />
          <circle cx="118" cy="104" r="6" fill={ink} />
          <path d="M84 122 C92 134 108 134 116 122" fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round" />
          <circle cx="68" cy="120" r="7" fill="#FF8FA3" opacity="0.7" />
          <circle cx="132" cy="120" r="7" fill="#FF8FA3" opacity="0.7" />
        </g>
      );
    case 'house':
      return (
        <g>
          <rect x="132" y="38" width="20" height="40" fill={accent2} {...sw} />
          <rect x="38" y="92" width="124" height="86" fill="#FFE8B8" {...sw} />
          <path d="M26 98 L100 34 L174 98Z" fill={accent} {...sw} />
          <rect x="84" y="126" width="32" height="52" rx="4" fill="#8B5A2B" {...sw} />
          <circle cx="108" cy="154" r="3.5" fill="#FFD23F" />
          <rect x="48" y="112" width="26" height="26" fill="#BFE6FF" {...sw} />
          <rect x="126" y="112" width="26" height="26" fill="#BFE6FF" {...sw} />
          <circle cx="100" cy="76" r="9" fill="#fff" {...sw} />
        </g>
      );
    case 'tree':
      return (
        <g>
          <rect x="88" y="120" width="24" height="66" rx="4" fill="#8B5A2B" {...sw} />
          <circle cx="66" cy="102" r="38" fill="#4CAF50" {...sw} />
          <circle cx="134" cy="102" r="38" fill="#4CAF50" {...sw} />
          <circle cx="100" cy="64" r="46" fill="#5CC15F" {...sw} />
          <circle cx="86" cy="62" r="7" fill={accent} />
          <circle cx="118" cy="84" r="7" fill={accent} />
          <circle cx="62" cy="108" r="7" fill={accent} />
          <circle cx="138" cy="106" r="7" fill={accent} />
        </g>
      );
    case 'apple':
    default:
      return (
        <g>
          <path d="M100 66 C70 42 26 64 30 114 C34 162 70 188 100 174 C130 188 166 162 170 114 C174 64 130 42 100 66Z" fill="#E5484D" {...sw} />
          <path d="M100 66 C100 48 104 36 112 28" fill="none" stroke="#7A4B2A" strokeWidth="8" strokeLinecap="round" />
          <path d="M108 42 C122 18 150 18 158 32 C146 50 122 54 108 42Z" fill="#3FA34D" {...sw} />
          <ellipse cx="62" cy="96" rx="11" ry="20" fill="#fff" opacity="0.4" transform="rotate(20 62 96)" />
        </g>
      );
  }
};

const AlphabetLetterTrace: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt) * (p.speed || 1);
  const font = p.fontFamily || fonts.display;
  const showBg = p.background !== 'transparent';
  const chars = Array.from(String(p.letter || 'Aa')).slice(0, 3);

  // --- glyph strokes in board units
  const GAP = 36;
  const strokes: {poly: Poly; ci: number; ni: number}[] = [];
  chars.forEach((ch, ci) => {
    glyphStrokes(ch).forEach((d, ni) => strokes.push({poly: samplePath(d, ci * (100 + GAP)), ci, ni}));
  });
  const anyLower = chars.some(isLowerGlyph);
  const anyDesc = chars.some(hasDescender);
  const vbW = chars.length * 100 + (chars.length - 1) * GAP;
  const vbY0 = -10;
  const vbY1 = anyDesc ? 192 : 148;
  const vbH = vbY1 - vbY0;

  // --- timeline
  const traceStart = 26;
  const gaps = 9;
  const weights = strokes.map((s) => 16 + Math.min(70, s.poly.len * 0.24));
  const sumW = weights.reduce((a, b) => a + b, 0);
  const span = Math.max(60, (p.traceFrames || 230) - gaps * strokes.length);
  const k = Math.min(1.6, span / sumW);
  const starts: number[] = [];
  const durs: number[] = [];
  let tcur = traceStart;
  strokes.forEach((_, i) => {
    starts.push(tcur);
    durs.push(weights[i] * k);
    tcur += weights[i] * k + gaps;
  });
  const traceEnd = tcur;
  const popAt = traceEnd + 4;
  const revealAt = traceEnd + 46;
  const r = easeOut3(sseg(f, revealAt, revealAt + 26));
  const showPic = p.showPicture !== false;

  // --- layout
  const boardW = portrait ? w * 0.9 : w * 0.52;
  const pad = 40 * u;
  const headH = 70 * u;
  const s = Math.min((boardW - pad * 2) / (vbW + 24), ((portrait ? h * 0.36 : h * 0.62) - 0) / vbH);
  const boardH = vbH * s + pad + headH + 18 * u;
  const boardCx = showPic ? (portrait ? w / 2 : w / 2 + (w * 0.29 - w / 2) * r) : w / 2;
  const boardCy = showPic ? (portrait ? h / 2 + (h * 0.3 - h / 2) * r : h / 2) : h / 2;
  const bx = boardCx - boardW / 2;
  const by = boardCy - boardH / 2;
  const gx = boardCx - (vbW * s) / 2;
  const gy = by + headH - vbY0 * s;
  const boardIn = easeOut3(sseg(f, 0, 20));

  const track = mixHex(p.accent, p.board, 0.82);
  const guide = mixHex(p.ink, p.board, 0.82);
  const lw = 15;

  // glyph complete pop
  const pop = smooth01(sseg(f, popAt, popAt + 10)) * (1 - smooth01(sseg(f, popAt + 10, popAt + 24)));
  const gScale = 1 + 0.05 * pop;
  const done = f >= traceEnd;
  const burstT = sseg(f, popAt, popAt + 40);

  // example panel
  const panelCx = portrait ? w / 2 : w * 0.77;
  const picD = portrait ? Math.min(w * 0.36, h * 0.26) : Math.min(w * 0.28, h * 0.44);
  const picCy = portrait ? h * 0.66 : h * 0.4;
  const picIn = backOut(sseg(f, revealAt + 8, revealAt + 34));
  const wordIn = easeOut3(sseg(f, revealAt + 26, revealAt + 50));
  const word = p.exampleWord;
  const first = word.slice(0, 1);
  const wordFs = Math.min((portrait ? 130 : 128) * u, ((portrait ? w * 0.86 : w * 0.38) / Math.max(1, word.length * 0.6)));

  return (
    <AbsoluteFill style={{background: showBg ? p.background : undefined, overflow: 'hidden'}}>
      {/* board */}
      <div style={{position: 'absolute', left: bx, top: by, width: boardW, height: boardH, borderRadius: 36 * u, background: p.board, boxShadow: `0 ${24 * u}px ${70 * u}px rgba(0,0,0,0.22)`, opacity: boardIn, transform: `translateY(${(1 - boardIn) * 40 * u}px)`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 14 * u, borderRadius: `${36 * u}px ${36 * u}px 0 0`, background: p.accent}} />
        <div style={{position: 'absolute', left: pad, top: 34 * u, fontFamily: fonts.sans, fontWeight: 800, fontSize: 26 * u, letterSpacing: 3 * u, textTransform: 'uppercase', color: withAlpha(p.ink, 0.55)}}>{p.prompt}</div>
      </div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: boardIn}}>
        <g transform={`translate(${gx} ${gy}) scale(${s})`}>
          {/* ruled rows */}
          {[ROW.top, ROW.base].map((y) => (
            <line key={y} x1={-12} x2={vbW + 12} y1={y} y2={y} stroke={mixHex(p.accent, p.board, 0.55)} strokeWidth={2.2} />
          ))}
          {anyLower && <line x1={-12} x2={vbW + 12} y1={ROW.mid} y2={ROW.mid} stroke={guide} strokeWidth={2} strokeDasharray="7 7" />}
          {anyDesc && <line x1={-12} x2={vbW + 12} y1={ROW.desc} y2={ROW.desc} stroke={guide} strokeWidth={2} strokeDasharray="7 7" />}

          <g transform={`translate(${vbW / 2} ${(ROW.top + ROW.base) / 2}) scale(${gScale}) translate(${-vbW / 2} ${-(ROW.top + ROW.base) / 2})`}>
            {/* dotted track */}
            {strokes.map((st, i) => (
              <g key={`t${i}`} opacity={easeOut3(sseg(f, 8 + i * 2, 24 + i * 2))}>
                <path d={fullPath(st.poly)} fill="none" stroke={track} strokeWidth={lw + 6} strokeLinecap="round" strokeLinejoin="round" />
                <path d={fullPath(st.poly)} fill="none" stroke={p.board} strokeWidth={2.6} strokeLinecap="round" strokeDasharray="0.1 8" />
              </g>
            ))}
            {/* drawn ink */}
            {strokes.map((st, i) => {
              const q = smooth01(sseg(f, starts[i], starts[i] + durs[i]));
              if (q <= 0) return null;
              return <path key={`d${i}`} d={slicePath(st.poly, q * st.poly.len)} fill="none" stroke={p.accent} strokeWidth={lw} strokeLinecap="round" strokeLinejoin="round" />;
            })}
            {/* start badges + arrows */}
            {(() => {
              const placed: [number, number][] = [];
              return strokes.map((st, i) => {
                const a0 = st.poly.pts[0];
                const a1 = pointAt(st.poly, Math.min(22, st.poly.len * 0.4));
                const dl = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) || 1;
                const ux = (a1[0] - a0[0]) / dl;
                const uy = (a1[1] - a0[1]) / dl;
                // badge sits behind the start; nudge it sideways if another badge is already there
                const cands: [number, number][] = [
                  [a0[0] - ux * 16, a0[1] - uy * 16],
                  [a0[0] - ux * 6 - uy * 24, a0[1] - uy * 6 + ux * 24],
                  [a0[0] - ux * 6 + uy * 24, a0[1] - uy * 6 - ux * 24],
                ];
                const bp = cands.find((c) => placed.every((o) => Math.hypot(o[0] - c[0], o[1] - c[1]) > 24)) ?? cands[0];
                placed.push(bp);
                const appear = backOut(sseg(f, starts[i] - 14, starts[i] - 2));
                const goneArrow = 1 - sseg(f, starts[i] + 2, starts[i] + 12);
                const q = sseg(f, starts[i], starts[i] + durs[i]);
                if (appear <= 0) return null;
                const hx = a0[0] + ux * 30;
                const hy = a0[1] + uy * 30;
                return (
                  <g key={`b${i}`}>
                    <g opacity={goneArrow} transform={`translate(${a0[0]} ${a0[1]}) scale(${appear}) translate(${-a0[0]} ${-a0[1]})`}>
                      <line x1={a0[0] + ux * 4} y1={a0[1] + uy * 4} x2={hx} y2={hy} stroke={p.accent2} strokeWidth={5} strokeLinecap="round" />
                      <path d={`M${hx + ux * 9} ${hy + uy * 9} L${hx - uy * 8} ${hy + ux * 8} L${hx + uy * 8} ${hy - ux * 8}Z`} fill={p.accent2} stroke={p.accent2} strokeWidth={2} strokeLinejoin="round" />
                    </g>
                    <g transform={`translate(${bp[0]} ${bp[1]}) scale(${appear})`} opacity={q >= 1 ? 0.8 : 1}>
                      <circle r={11} fill={p.accent2} stroke={p.board} strokeWidth={2.5} />
                      <text y={5.5} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={15} fill="#fff">{st.ni + 1}</text>
                    </g>
                  </g>
                );
              });
            })()}
            {/* pen dot */}
            {strokes.map((st, i) => {
              const q = sseg(f, starts[i], starts[i] + durs[i]);
              if (q <= 0 || q >= 1) return null;
              const pt = pointAt(st.poly, smooth01(q) * st.poly.len);
              return (
                <g key={`p${i}`}>
                  <circle cx={pt[0]} cy={pt[1]} r={17} fill={withAlpha(p.accent2, 0.3)} />
                  <circle cx={pt[0]} cy={pt[1]} r={9} fill={p.accent2} stroke="#fff" strokeWidth={3} />
                </g>
              );
            })}
          </g>
          <Burst x={vbW / 2} y={(ROW.top + ROW.base) / 2} t={done ? burstT : 0} colors={[p.accent, p.accent2, '#FFD23F', '#4DB6E8']} n={18} radius={vbW * 0.62} seed={5} size={9} />
        </g>
      </svg>

      {/* example panel */}
      {showPic && r > 0 && (
        <>
          <div style={{position: 'absolute', left: panelCx - picD / 2, top: picCy - picD / 2, width: picD, height: picD, transform: `scale(${picIn})`, opacity: Math.min(1, picIn * 1.5)}}>
            <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: withAlpha(p.accent2, 0.22)}} />
            {p.imageSrc ? (
              <Img src={resolveSrc(p.imageSrc)} style={{position: 'absolute', inset: '8%', width: '84%', height: '84%', objectFit: 'contain'}} />
            ) : (
              <svg viewBox="0 0 200 200" width={picD} height={picD} style={{position: 'absolute', inset: 0, transform: `rotate(${Math.sin(f * 0.07) * 2}deg)`}}>
                <g transform="translate(18 18) scale(0.82)">
                  <Picture kind={PICTURES.includes(p.picture) ? p.picture : 'apple'} ink={p.ink} accent={p.accent} accent2={p.accent2} />
                </g>
              </svg>
            )}
          </div>
          <div style={{position: 'absolute', left: panelCx - (portrait ? w * 0.45 : w * 0.19), width: portrait ? w * 0.9 : w * 0.38, top: picCy + picD / 2 + 26 * u, textAlign: 'center', opacity: wordIn, transform: `translateY(${(1 - wordIn) * 24 * u}px)`}}>
            <div style={{fontFamily: fonts.sans, fontWeight: 700, fontSize: 36 * u, color: withAlpha(p.ink, 0.6)}}>{p.exampleLead}</div>
            <div style={{fontFamily: font, fontSize: wordFs, lineHeight: 1.1, color: p.ink, whiteSpace: 'nowrap'}}>
              <span style={{color: p.accent}}>{first}</span>
              {word.slice(1)}
            </div>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

export const alphabetLetterTrace = defineMotion<Props>({
  id: 'alphabet-letter-trace',
  title: 'Alphabet letter trace',
  category: 'text',
  description: 'A handwriting lesson on ruled paper: a dotted letter track, numbered stroke-order dots with arrows, a pen dot tracing each stroke, a pop and sparkle, then a drawn picture and "A is for Apple" example word slide in.',
  source: ['original (round 3)'],
  useFor: 'Kids\' phonics and handwriting videos, alphabet series, ESL letter lessons, number-writing practice and educational app promos. Works for A-Z, a-z and 0-9 (up to 3 characters at once, e.g. "Aa"); pass a built-in picture or your own image.',
  durationInFrames: 420,
  defaultProps: {
    letter: 'Aa',
    exampleWord: 'Apple',
    exampleLead: 'A is for',
    picture: 'apple',
    imageSrc: '',
    prompt: 'Trace the letter',
    background: '#FFF4DC',
    ink: '#2B2A4C',
    accent: '#FF6B6B',
    accent2: '#2EA8FF',
    board: '#FFFFFF',
    fontFamily: '',
    showPicture: true,
    traceFrames: 230,
    startAt: 0,
    speed: 1,
  },
  propDocs: {
    letter: 'the letter(s) to trace — up to 3 characters from A-Z, a-z, 0-9 (e.g. "Aa", "B", "7")',
    exampleWord: 'example word shown after tracing (its first letter is highlighted)',
    exampleLead: 'small line above the word, e.g. "B is for"',
    picture: 'built-in drawing: apple | ball | cat | sun | fish | star | house | tree',
    imageSrc: 'optional public/ path or URL of your own picture (replaces the built-in drawing)',
    prompt: 'small instruction on the board header',
    background: "backdrop colour or 'transparent'",
    ink: 'text and outline colour',
    accent: 'drawn stroke colour and first-letter highlight',
    accent2: 'start dots, arrows and pen colour',
    board: 'writing-board paper colour',
    fontFamily: 'optional CSS font-family for the example word (empty = display)',
    showPicture: 'false keeps the board centred and skips the picture + word',
    traceFrames: 'frames the whole tracing takes (spread across the strokes)',
    startAt: 'frame the lesson starts',
    speed: 'playback speed multiplier',
  },
  component: AlphabetLetterTrace,
  tags: ['alphabet', 'letter', 'trace', 'handwriting', 'phonics', 'kids', 'children', 'school', 'stroke order', 'abc', 'numbers', 'education', 'preschool', 'learning', 'writing'],
});
