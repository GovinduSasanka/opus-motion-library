// Adapted from mg-styles-15/demos/06-collage/index.html (drawBang, speechScrap, chip, tornStrip, band) (MIT) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {defineMotion} from '../../core/types';
import {ease, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {PaperTexture, Svg, Vignette, useStage} from '../../core/stage';
import {fonts} from '../../core/fonts';
import {boil, slap, tornRect} from '../../core/r2-mg2a-kit';

type Props = {
  text: string;
  tiles: string[];
  band: string;
  masthead: string;
  speech: string;
  at: number;
  stepFrames: number;
  seed: number;
  background: string;
  red: string;
  ink: string;
  paper: string;
};

const FACES = [fonts.display, fonts.serif, fonts.comic, fonts.mono, fonts.sans, fonts.grotesk];

const RansomNoteType: React.FC<Props> = ({text, tiles, band, masthead, speech, at, stepFrames, seed, background, red, ink, paper}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();

  const maxPer = portrait ? 6 : 11;
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let curL = '';
  for (const wd of words) {
    if (curL && (curL + ' ' + wd).length > maxPer) {
      lines.push(curL);
      curL = wd;
    } else curL = curL ? curL + ' ' + wd : wd;
  }
  if (curL) lines.push(curL);
  const maxChars = Math.max(...lines.map((l) => l.length), 1);
  const ts = Math.min(200 * u, (w * 0.9) / (maxChars * 0.98), (h * 0.5) / (lines.length * 1.12));
  const lineH = ts * 1.12;
  const blockH = lineH * lines.length;
  const top = cy - blockH / 2 - (band ? ts * 0.25 : 0);

  const fill = (kind: string): {bg: string; fg: string} =>
    kind === 'red' ? {bg: red, fg: paper} : kind === 'black' ? {bg: ink, fg: paper} : kind === 'news' ? {bg: '#EFE8D8', fg: ink} : {bg: paper, fg: ink};

  let idx = 0;
  const tileEls: React.ReactNode[] = [];
  lines.forEach((line, li) => {
    const chars = line.split('');
    const widths = chars.map((c) => (c === ' ' ? ts * 0.45 : ts * (c === 'I' || c === '!' ? 0.62 : 0.92)));
    const total = widths.reduce((a, b) => a + b, 0) + chars.length * ts * 0.04;
    let x = cx - total / 2;
    chars.forEach((ch, ci) => {
      const wd = widths[ci];
      if (ch === ' ') {
        x += wd + ts * 0.04;
        return;
      }
      const i = idx++;
      const r = rng(seed * 131 + i * 17 + 3);
      const kind = tiles[(i + Math.floor(r() * 2)) % tiles.length];
      const {bg, fg} = fill(kind);
      const face = FACES[Math.floor(r() * FACES.length)];
      const rot = (r() - 0.5) * 12;
      const sj = 1 + (r() - 0.5) * 0.16;
      const t0 = at + 6 + i * stepFrames;
      const s = slap(frame, t0);
      if (s.alpha === 0) {
        x += wd + ts * 0.04;
        return;
      }
      const b = boil(frame, i + 1, 1.1 * u);
      const px = x + wd / 2 + b.x;
      const py = top + li * lineH + lineH / 2 + b.y + (r() - 0.5) * ts * 0.1;
      const bw = wd * sj;
      const bh = ts * 0.98 * sj;
      const poly = tornRect(-bw / 2, -bh / 2, bw, bh, seed * 7 + i, ts * 0.035, ts, 'all');
      const isNews = kind === 'news';
      tileEls.push(
        <g key={i} transform={`translate(${px} ${py}) rotate(${rot + b.a}) scale(${s.scale})`} filter="url(#rn-shadow)">
          <polygon points={poly} fill={bg} />
          {isNews && (
            <g opacity={0.35} stroke={ink} strokeWidth={1.1 * u}>
              {[0.28, 0.36, 0.44].map((yy, q) => (
                <line key={q} x1={-bw * 0.42} x2={bw * (0.1 + 0.3 * r())} y1={-bh / 2 + bh * (0.06 + 0.05 * q)} y2={-bh / 2 + bh * (0.06 + 0.05 * q)} />
              ))}
            </g>
          )}
          <text x={0} y={ts * 0.3 * (face === fonts.mono ? 0.95 : 1)} textAnchor="middle" fontFamily={face} fontWeight={800} fontSize={ts * (face === fonts.comic ? 0.9 : face === fonts.display ? 0.66 : 0.78)} fill={fg}>
            {ch}
          </text>
          {s.dust > 0 && (
            <g fill="#e8dcc2" opacity={s.dust * 0.7}>
              {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dy], q) => (
                <circle key={q} cx={dx * (bw / 2 + (1 - s.dust) * 16 * u)} cy={dy * (bh / 2 + (1 - s.dust) * 16 * u)} r={(5 + q) * u * s.dust} />
              ))}
            </g>
          )}
        </g>,
      );
      x += wd + ts * 0.04;
    });
  });
  const endF = at + 6 + idx * stepFrames;

  // diagonal band
  const bandS = slap(frame, endF + 6);
  const bandH = Math.min(h * 0.12, ts * 0.75);
  const bandY = top + blockH + bandH * 0.9;
  const bandFs = bandH * 0.68;
  const bandChars = band.length;
  const bandTextW = Math.min(w * 1.1, bandFs * 0.55 * bandChars + bandChars * bandFs * 0.06);
  // masthead
  const mS = slap(frame, at);
  const mW = Math.min(w * 0.7, 640 * u);
  const mH = Math.min(h * 0.075, 82 * u);
  // speech scrap
  const spS = slap(frame, endF + 16);
  const spW = Math.min(w * 0.34, 330 * u);
  const spH = spW * 0.5;
  const spx = portrait ? w - spW * 0.62 : cx + (total_w(lines, ts) / 2) * 0.82 + spW * 0.3;
  const spy = top - spH * 0.7;

  return (
    <AbsoluteFill style={{background}}>
      <PaperTexture opacity={0.5} seed={7} tint="#8a7350" />
      <Svg>
        <defs>
          <filter id="rn-shadow" x="-30%" y="-30%" width="170%" height="170%">
            <feDropShadow dx={2.5 * u} dy={4 * u} stdDeviation={3 * u} floodColor="#22140a" floodOpacity="0.36" />
          </filter>
        </defs>
        {/* masthead strip */}
        {mS.alpha > 0 && (
          <g transform={`translate(${cx} ${Math.max(mH * 0.9, h * 0.08)}) rotate(-1.6) scale(${mS.scale})`} filter="url(#rn-shadow)">
            <polygon points={tornRect(-mW / 2, -mH / 2, mW, mH, seed + 41, 3.4 * u, 22 * u, 'ends')} fill="#F2ECDF" />
            <text x={0} y={mH * 0.3} textAnchor="middle" fontFamily={fonts.serif} fontWeight={700} fontSize={mH * 0.78} letterSpacing={mH * 0.12} fill={ink}>
              {masthead.toUpperCase()}
            </text>
          </g>
        )}
        {tileEls}
        {/* diagonal band */}
        {band && bandS.alpha > 0 && (
          <g transform={`translate(${cx} ${bandY}) rotate(-6) scale(${bandS.scale})`} filter="url(#rn-shadow)">
            <rect x={-w * 0.75} y={-bandH / 2} width={w * 1.5} height={bandH} fill={ink} />
            <text x={0} y={bandFs * 0.34} textAnchor="middle" fontFamily={fonts.display} fontSize={bandFs} letterSpacing={bandFs * 0.06} fill={paper} transform={`scale(${Math.min(1, (w * 0.86) / bandTextW) * 0.88} 1)`}>
              {band.toUpperCase()}
            </text>
          </g>
        )}
        {/* speech scrap */}
        {speech && spS.alpha > 0 && (
          <g transform={`translate(${spx} ${spy}) rotate(6) scale(${spS.scale})`} filter="url(#rn-shadow)">
            <polygon points={`${tornRect(-spW / 2, -spH / 2, spW, spH, seed + 77, 3 * u, 18 * u)}`} fill={paper} />
            <polygon points={`${-spW * 0.2},${spH * 0.45} ${-spW * 0.34},${spH * 0.98} ${spW * 0.04},${spH * 0.45}`} fill={paper} />
            <text x={0} y={spH * 0.16} textAnchor="middle" fontFamily={fonts.comic} fontSize={spH * 0.62} fill={ink}>
              {speech.toUpperCase()}
            </text>
          </g>
        )}
      </Svg>
      <Vignette strength={0.3} color="34,20,8" />
    </AbsoluteFill>
  );
};

function total_w(lines: string[], ts: number) {
  return Math.max(...lines.map((l) => l.length * ts * 0.92));
}

export const ransomNoteType = defineMotion<Props>({
  id: 'ransom-note-type',
  title: 'Ransom-note type',
  category: 'text',
  description: 'Each letter sits on its own scrap of paper (newsprint, red, black, white) with a different typeface, slightly rotated and jittered, slapped onto kraft one by one; then a diagonal black band with condensed caps, a torn masthead strip and a speech scrap slap in.',
  source: ['mg-styles-15 demos/06-collage/index.html (MIT, drawBang / speechScrap / chip / tornStrip / band)'],
  useFor: 'Punk and editorial titles, music promos, meme captions and zine-style hero words. Distinct from comic-burst and stamp-slam.',
  durationInFrames: 150,
  defaultProps: {
    text: 'Make some noise',
    tiles: ['red', 'black', 'paper', 'news'],
    band: 'Special edition',
    masthead: 'The Paper',
    speech: 'Hey!',
    at: 6,
    stepFrames: 5,
    seed: 4,
    background: '#B89A72',
    red: '#D2261C',
    ink: '#16130F',
    paper: '#F4EFE4',
  },
  propDocs: {
    text: 'the headline; every letter gets its own scrap',
    tiles: 'scrap styles cycled over letters: red | black | paper | news',
    band: 'text of the diagonal band (empty to hide)',
    masthead: 'torn strip masthead (shown at the top)',
    speech: 'speech scrap text (empty to hide)',
    at: 'start frame',
    stepFrames: 'frames between letters (5 = one per 16th at 90 bpm)',
    seed: 'jitter seed',
    background: 'kraft table colour',
    red: 'red scrap colour',
    ink: 'black scrap / type colour',
    paper: 'white scrap colour',
  },
  component: RansomNoteType,
  tags: ['ransom note', 'collage', 'typography', 'paper', 'cut-out', 'punk', 'zine', 'editorial', 'title', 'slap', 'newspaper', 'letters', 'kinetic', 'music promo', 'meme', 'torn'],
});
