import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, lerp} from '../../core/ease';
import {alpha, eo3, estWidth, fitSize, lf, mixC, on, seg, settle, wrapText} from '../../core/r3-news-kit';
import {useSafeId} from '../../core/image-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Head-to-head poll result: two panels (option A / option B) count their percentages up, a proportional bar below
 * shows the split (with an "undecided" remainder), a hatched band marks the margin of error around the gap, and a
 * verdict chip says who leads - or that the race is inside the margin of error.
 */
type Props = {
  question: string;
  pollster: string;
  nameA: string;
  nameB: string;
  subA: string;
  subB: string;
  valueA: number;
  valueB: number;
  marginOfError: number;
  note: string;
  leadLabel: string;
  tieLabel: string;
  colorA: string;
  colorB: string;
  background: string;
  ink: string;
  speed: number;
  startAt: number;
};

const PollSplit: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = useSafeId('pollsplit');
  const f = (frame - p.startAt) * (p.speed || 1);

  const A = clamp(p.valueA, 0, 100);
  const B = clamp(p.valueB, 0, Math.max(0, 100 - A));
  const U = Math.max(0, 100 - A - B);
  const moe = Math.max(0, p.marginOfError);
  const gap = Math.abs(A - B);
  const tie = gap <= moe * 2 ? true : false; // gap is inside combined uncertainty
  const leader = A >= B ? p.nameA : p.nameB;

  // ---------------- timeline
  const head = eo3(seg(f, 0, 16));
  const panelIn = [eo3(seg(f, 8, 28)), eo3(seg(f, 14, 34))];
  const count = eo3(seg(f, 22, 86));
  const barK = eo3(seg(f, 70, 104));
  const moeK = eo3(seg(f, 104, 126));
  const verdictK = settle(seg(f, 128, 150) * 0.7, 6, 11);
  const verdictOpacity = clamp(seg(f, 128, 136));
  const noteK = eo3(seg(f, 142, 164));

  const pad = w * (portrait ? 0.07 : 0.06);
  const topY = h * (portrait ? 0.05 : 0.07);
  const qSize = portrait ? w * 0.056 : h * 0.052;
  const qLines = wrapText(p.question, qSize, w - pad * 2, 'sans', portrait ? 3 : 2);
  const qH = qLines.length * qSize * 1.18;
  const pollTagSize = (portrait ? w : h) * (portrait ? 0.026 : 0.026);

  // ---- vertical budget (bottom-up): note, verdict chip, gap, bar, MoE headroom, panels
  const verdictText = tie ? p.tieLabel : p.leadLabel.replace('{name}', leader).replace('{n}', String(Math.round(gap * 10) / 10).replace(/\.0$/, ''));
  const vs = (portrait ? w : h) * 0.035;
  const chipFs = fitSize(verdictText, vs, w - pad * 2 - vs * 2.4, 'sans', 0.02);
  const chipW = estWidth(verdictText, chipFs, 'sans', 0.02) + chipFs * 2.4;
  const chipH = chipFs * 2.1;
  const noteFs = (portrait ? w : h) * 0.024;
  const noteLines = on(p.note) ? wrapText(p.note, noteFs, w - pad * 2, 'sans', 2) : [];
  const noteH = noteLines.length * noteFs * 1.35;
  const noteY = h - h * (portrait ? 0.035 : 0.03) - noteH;
  const chipY = noteY - 18 * u - chipH;
  const barH = (portrait ? w : h) * (portrait ? 0.07 : 0.055);
  const by = chipY - h * (portrait ? 0.05 : 0.065) - barH;
  const panelsTop = topY + pollTagSize * 2.4 + qH + (portrait ? h * 0.025 : h * 0.03);
  const panelsBottom = by - barH * 0.95;
  const panelsH = Math.max(120 * u, panelsBottom - panelsTop);
  const panelGap = 14 * u;
  const pw = portrait ? w - pad * 2 : (w - pad * 2 - panelGap) / 2;
  const ph = portrait ? (panelsH - panelGap) / 2 : panelsH;

  const panels = [
    {name: p.nameA, sub: p.subA, val: A, color: p.colorA, x: pad, y: panelsTop},
    {name: p.nameB, sub: p.subB, val: B, color: p.colorB, x: portrait ? pad : pad + pw + panelGap, y: portrait ? panelsTop + ph + panelGap : panelsTop},
  ];

  // bar geometry
  const bx = pad;
  const bw = w - pad * 2;
  const aw = (bw * A) / 100;
  const uw = (bw * U) / 100;
  const bwid = (bw * B) / 100;
  // margin-of-error band centred on each side's edge of the undecided gap -> we draw it around the A|B boundary
  const edgeA = bx + aw; // right edge of A
  const edgeB = bx + aw + uw; // left edge of B
  const mid = (edgeA + edgeB) / 2;
  const moePx = (bw * moe) / 100;

  const chipColor = tie ? '#F2C230' : A >= B ? p.colorA : p.colorB;
  const chipInk = tie ? '#171309' : '#FFFFFF';

  return (
    <AbsoluteFill style={{background: p.background === 'transparent' ? 'transparent' : p.background, overflow: 'hidden'}}>
      {/* header */}
      <div style={{position: 'absolute', left: pad, top: topY, opacity: head, transform: `translateY(${(1 - head) * -14 * u}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: pollTagSize * 0.7}}>
          <div style={{background: '#F2C230', color: '#171309', fontFamily: lf.sans, fontWeight: 800, fontSize: pollTagSize, letterSpacing: pollTagSize * 0.12, padding: `${pollTagSize * 0.3}px ${pollTagSize * 0.7}px`}}>POLL</div>
          <div style={{fontFamily: lf.sans, fontWeight: 600, fontSize: pollTagSize, letterSpacing: pollTagSize * 0.08, color: p.ink, opacity: 0.7}}>{(p.pollster || '').toUpperCase()}</div>
        </div>
        <div style={{marginTop: pollTagSize * 0.9}}>
          {qLines.map((l, i) => (
            <div key={i} style={{fontFamily: lf.sans, fontWeight: 800, fontSize: qSize, lineHeight: 1.18, color: p.ink}}>
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* panels */}
      {panels.map((pn, i) => {
        const k = panelIn[i];
        const nameFs = fitSize(pn.name, (portrait ? w : h) * 0.05, pw - 44 * u, 'sans', 0.0);
        const bigFs = Math.min(ph * 0.52, pw * 0.34);
        const shown = Math.round(pn.val * count);
        const fromX = i === 0 ? -pw * 0.4 : pw * 0.4;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: pn.x,
              top: pn.y,
              width: pw,
              height: ph,
              opacity: clamp(k * 1.6),
              transform: portrait ? `translateY(${(1 - k) * (i === 0 ? -1 : 1) * 60 * u}px)` : `translateX(${(1 - k) * fromX}px)`,
              background: `linear-gradient(160deg, ${pn.color} 0%, ${mixC(pn.color, '#000000', 0.32)} 100%)`,
              boxShadow: `0 ${10 * u}px ${30 * u}px rgba(0,0,0,0.28)`,
              overflow: 'hidden',
            }}
          >
            <div style={{position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(120deg, rgba(255,255,255,0.06) 0 ${18 * u}px, rgba(255,255,255,0) ${18 * u}px ${36 * u}px)`}} />
            <div style={{position: 'absolute', left: 26 * u, top: 22 * u, right: 22 * u}}>
              <div style={{fontFamily: lf.sans, fontWeight: 800, fontSize: nameFs, color: '#FFFFFF', lineHeight: 1.1, whiteSpace: 'nowrap'}}>{pn.name}</div>
              {on(pn.sub) && <div style={{fontFamily: lf.sans, fontWeight: 600, fontSize: nameFs * 0.5, color: '#FFFFFF', opacity: 0.78, marginTop: nameFs * 0.2, letterSpacing: nameFs * 0.04}}>{pn.sub}</div>}
            </div>
            <div style={{position: 'absolute', left: 26 * u, bottom: ph * 0.04, display: 'flex', alignItems: 'baseline'}}>
              <span style={{fontFamily: lf.display, fontSize: bigFs, lineHeight: 0.95, color: '#FFFFFF', textShadow: `0 ${5 * u}px 0 rgba(0,0,0,0.2)`}}>{shown}</span>
              <span style={{fontFamily: lf.display, fontSize: bigFs * 0.45, color: '#FFFFFF', opacity: 0.85, marginLeft: bigFs * 0.04}}>%</span>
            </div>
          </div>
        );
      })}

      {/* proportional bar + margin of error */}
      <Svg>
        <defs>
          <pattern id={`${id}-hatch`} width={9 * u} height={9 * u} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={9 * u} height={9 * u} fill={alpha(p.ink, 0.14)} />
            <rect width={3.2 * u} height={9 * u} fill={alpha(p.ink, 0.8)} />
          </pattern>
          <clipPath id={`${id}-clip`}>
            <rect x={bx} y={by} width={bw * barK} height={barH} rx={barH * 0.18} />
          </clipPath>
        </defs>
        <rect x={bx} y={by} width={bw} height={barH} rx={barH * 0.18} fill="rgba(255,255,255,0.08)" />
        <g clipPath={`url(#${id}-clip)`}>
          <rect x={bx} y={by} width={aw} height={barH} fill={p.colorA} />
          <rect x={edgeA} y={by} width={uw} height={barH} fill="rgba(160,166,178,0.55)" />
          <rect x={edgeB} y={by} width={bwid} height={barH} fill={p.colorB} />
        </g>
        {/* edge ticks + value labels */}
        <text x={bx + 12 * u} y={by + barH * 0.66} fontFamily={lf.sans} fontWeight={800} fontSize={barH * 0.46} fill="#fff" opacity={barK > 0.6 ? 1 : 0}>
          {A}%
        </text>
        <text x={bx + bw - 12 * u} y={by + barH * 0.66} textAnchor="end" fontFamily={lf.sans} fontWeight={800} fontSize={barH * 0.46} fill="#fff" opacity={barK > 0.6 ? 1 : 0}>
          {B}%
        </text>
        {U > 0 && (
          <text x={mid} y={by + barH * 1.62} textAnchor="middle" fontFamily={lf.sans} fontWeight={600} fontSize={barH * 0.34} fill={p.ink} opacity={0.6 * barK}>
            {Math.round(U)}% undecided
          </text>
        )}
        {moe > 0 && (
          <g opacity={moeK}>
            <rect x={mid - moePx * moeK} y={by - barH * 0.22} width={moePx * 2 * moeK} height={barH * 1.44} fill={`url(#${id}-hatch)`} stroke={p.ink} strokeWidth={2 * u} rx={3 * u} />
            <line x1={mid} x2={mid} y1={by - barH * 0.5} y2={by + barH * 1.22} stroke={p.ink} strokeWidth={2.5 * u} />
            <text x={mid} y={by - barH * 0.62} textAnchor="middle" fontFamily={lf.plex} fontWeight={700} fontSize={barH * 0.36} fill={p.ink}>
              {`±${moe}`}
            </text>
          </g>
        )}
      </Svg>

      {/* verdict chip */}
      <div
        style={{
          position: 'absolute',
          left: (w - chipW) / 2,
          top: chipY,
          width: chipW,
          height: chipH,
          background: chipColor,
          color: chipInk,
          borderRadius: chipH / 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: lf.sans,
          fontWeight: 800,
          fontSize: chipFs,
          letterSpacing: chipFs * 0.02,
          opacity: verdictOpacity,
          transform: `scale(${lerp(0.7, 1, clamp(verdictK, 0, 1.2))})`,
          boxShadow: `0 ${6 * u}px ${20 * u}px ${alpha(chipColor, 0.45)}`,
          whiteSpace: 'nowrap',
        }}
      >
        {verdictText}
      </div>

      {/* method note */}
      {noteLines.length > 0 && (
        <div style={{position: 'absolute', left: pad, right: pad, top: noteY, textAlign: 'center', fontFamily: lf.sans, fontSize: noteFs, lineHeight: 1.35, color: p.ink, opacity: 0.6 * noteK}}>
          {noteLines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const pollNumbersSplit = defineMotion<Props>({
  id: 'poll-numbers-split',
  title: 'Poll numbers split',
  category: 'hud',
  description:
    'Head-to-head poll result: two colour panels count their percentages up, a proportional bar below shows the split with an undecided remainder, a hatched band marks the margin of error, and a verdict chip reads "X leads by N" - or "within the margin of error" when the gap is inside it.',
  source: ['library original (election / survey graphic pattern)'],
  useFor: 'Election and survey coverage, A/B test results, "which do you prefer" splits, two-option vote outcomes - anything with two shares and an honest margin of error.',
  durationInFrames: 210,
  defaultProps: {
    question: 'Which option do residents prefer for the new park?',
    pollster: 'Sample Research Poll',
    nameA: 'Option A',
    nameB: 'Option B',
    subA: 'Riverside site',
    subB: 'Hilltop site',
    valueA: 48,
    valueB: 44,
    marginOfError: 3,
    note: 'Sample of 1,200 adults · margin of error ±3 points · fieldwork 3-9 March',
    leadLabel: '{name} leads by {n} pts',
    tieLabel: 'Too close to call · within the margin of error',
    colorA: '#2F6FDB',
    colorB: '#E0663A',
    background: '#0F1320',
    ink: '#F4F2EC',
    speed: 1,
    startAt: 0,
  },
  propDocs: {
    question: 'the poll question (headline)',
    pollster: 'who ran the poll, shown next to the POLL tag',
    nameA: 'first candidate / option name',
    nameB: 'second candidate / option name',
    subA: 'small line under name A (party, site, version; empty = none)',
    subB: 'small line under name B',
    valueA: 'percentage for A (0-100)',
    valueB: 'percentage for B (A + B <= 100; the rest shows as undecided)',
    marginOfError: 'margin of error in percentage points (0 = hide the band)',
    note: 'method footnote (sample size, dates; empty = none)',
    leadLabel: 'verdict when one side leads; {name} and {n} are filled in',
    tieLabel: 'verdict when the gap is within twice the margin of error (each share is +/- the margin)',
    colorA: 'colour for A (panel + bar)',
    colorB: 'colour for B (panel + bar)',
    background: 'backdrop colour; "transparent" = overlay',
    ink: 'text colour',
    speed: 'timing multiplier',
    startAt: 'frame the graphic starts (shift the beat)',
  },
  component: PollSplit,
  tags: ['poll', 'election', 'survey', 'percentages', 'margin of error', 'head to head', 'versus', 'split', 'news', 'results', 'data', 'candidates', 'journalism'],
});
