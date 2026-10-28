import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, lerp} from '../../core/ease';
import {alpha, backOut, eo3, estWidth, fitSize, lf, mixC, on, seg, settle, wrapText} from '../../core/r3-news-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Fact-check meter: the claim appears in a quote card, a segmented true -> false gauge draws in, the needle
 * sweeps and wobbles to the score, the zone label lights up and a verdict stamp + one-line explanation land.
 */
type Props = {
  tag: string;
  claimLabel: string;
  claim: string;
  claimSource: string;
  verdict: string;
  score: number;
  scaleLabels: string[];
  explanation: string;
  trueColor: string;
  midColor: string;
  falseColor: string;
  accent: string;
  ink: string;
  background: string;
  sweepAt: number;
  speed: number;
};

const polar = (cx: number, cy: number, r: number, th: number) => [cx + r * Math.cos(th), cy - r * Math.sin(th)] as const;
const sector = (cx: number, cy: number, r0: number, r1: number, a: number, b: number) => {
  const [x0, y0] = polar(cx, cy, r1, a);
  const [x1, y1] = polar(cx, cy, r1, b);
  const [x2, y2] = polar(cx, cy, r0, b);
  const [x3, y3] = polar(cx, cy, r0, a);
  return `M${x0} ${y0} A${r1} ${r1} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 0 0 ${x3} ${y3}Z`;
};

const FactCheck: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = frame * (p.speed || 1);

  const score = clamp(p.score);
  const labels = p.scaleLabels && p.scaleLabels.length >= 2 ? p.scaleLabels : ['True', 'False'];
  const n = labels.length;
  const colorAt = (v: number) => (v < 0.5 ? mixC(p.trueColor, p.midColor, v * 2) : mixC(p.midColor, p.falseColor, (v - 0.5) * 2));

  // ---- layout
  const pad = w * (portrait ? 0.07 : 0.06);
  const topY = h * (portrait ? 0.06 : 0.1);
  const claimW = portrait ? w - pad * 2 : w * 0.43;
  const gcx = portrait ? w / 2 : w * 0.735;
  const R = portrait ? w * 0.4 : Math.min(w * 0.2, h * 0.33);
  const gcy = portrait ? h * 0.55 : h * 0.5;
  const r0 = R * 0.76;

  // claim text sizing
  let cfs = (portrait ? 56 : 58) * u;
  let cl = wrapText(`“${p.claim}”`, cfs, claimW - 70 * u, 'sans', 8);
  const maxLines = portrait ? 6 : 6;
  while (cl.length > maxLines && cfs > 24 * u) {
    cfs *= 0.92;
    cl = wrapText(`“${p.claim}”`, cfs, claimW - 70 * u, 'sans', 8);
  }
  const clLH = cfs * 1.22;
  const cardH = 58 * u + (on(p.claimLabel) ? 40 * u : 0) + cl.length * clLH + (on(p.claimSource) ? 18 * u + 36 * u : 0);
  const cardTop = portrait ? topY : Math.max(topY, (h - cardH) / 2 + 24 * u);

  // ---- timeline
  const tagK = eo3(seg(f, 0, 14));
  const claimK = eo3(seg(f, 6, 30));
  const arcStart = 26;
  const sweepT = (f - p.sweepAt) / 30;
  const sweepK = sweepT <= 0 ? 0 : Math.min(settle(sweepT * 0.85, 4.2, 9), 1.25);
  const v = clamp(score * sweepK, 0, 1);
  const needleDeg = (v - 0.5) * 180;
  const verdictAt = p.sweepAt + 62;
  const vT = seg(f, verdictAt, verdictAt + 16);
  const expK = eo3(seg(f, verdictAt + 14, verdictAt + 34));
  const zone = Math.min(n - 1, Math.floor(v * n));
  const final = colorAt(score);

  // verdict pill
  const vfs = (portrait ? 64 : 54) * u;
  const verdict = (p.verdict || '').toUpperCase();
  const vfit = fitSize(verdict, vfs, R * 2.1, 'sans', 0.04);
  const vW = estWidth(verdict, vfit, 'sans', 0.04) + vfit * 1.6;
  const vH = vfit * 1.75;
  const vY = gcy + 120 * u;

  const exLines = wrapText(p.explanation, (portrait ? 34 : 30) * u, R * 2.05, 'sans', 3);

  return (
    <AbsoluteFill style={{background: p.background === 'transparent' ? 'transparent' : p.background, overflow: 'hidden'}}>
      {p.background !== 'transparent' && (
        <AbsoluteFill style={{background: `radial-gradient(ellipse at ${portrait ? 50 : 74}% 55%, ${alpha(final, 0.18 * sweepK)} 0%, rgba(0,0,0,0) 55%)`}} />
      )}

      {/* tag */}
      {on(p.tag) && (
        <div style={{position: 'absolute', left: pad, top: cardTop - 64 * u, opacity: tagK, transform: `translateX(${(1 - tagK) * -30 * u}px)`}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 12 * u, background: p.accent, color: '#12100A', fontFamily: lf.sans, fontWeight: 800, fontSize: 28 * u, letterSpacing: 4 * u, padding: `${9 * u}px ${20 * u}px`}}>
            <svg width={30 * u} height={30 * u} viewBox="0 0 24 24">
              <circle cx={10.5} cy={10.5} r={6.5} fill="none" stroke="#12100A" strokeWidth={2.6} />
              <path d="M15.5 15.5 21 21" stroke="#12100A" strokeWidth={2.8} strokeLinecap="round" />
            </svg>
            {p.tag.toUpperCase()}
          </div>
        </div>
      )}

      {/* claim card */}
      <div style={{position: 'absolute', left: pad, top: cardTop, width: claimW, opacity: claimK, transform: `translateY(${(1 - claimK) * 30 * u}px)`}}>
        <div style={{background: 'rgba(255,255,255,0.06)', borderLeft: `${10 * u}px solid ${p.accent}`, padding: `${28 * u}px ${34 * u}px ${30 * u}px`}}>
          {on(p.claimLabel) && <div style={{fontFamily: lf.sans, fontWeight: 800, fontSize: 24 * u, letterSpacing: 5 * u, color: p.accent, marginBottom: 16 * u}}>{p.claimLabel.toUpperCase()}</div>}
          {cl.map((l, i) => {
            const k = eo3(seg(f, 14 + i * 5, 28 + i * 5));
            return (
              <div key={i} style={{fontFamily: lf.serif, fontWeight: 700, fontSize: cfs * 1.08, lineHeight: `${clLH}px`, height: clLH, color: p.ink, whiteSpace: 'nowrap', opacity: k, transform: `translateX(${(1 - k) * 24 * u}px)`}}>
                {l}
              </div>
            );
          })}
          {on(p.claimSource) && (
            <div style={{marginTop: 18 * u, fontFamily: lf.sans, fontWeight: 600, fontSize: 26 * u, color: p.ink, opacity: 0.62 * eo3(seg(f, 22 + cl.length * 5, 40 + cl.length * 5))}}>{p.claimSource}</div>
          )}
        </div>
      </div>

      {/* gauge */}
      <Svg>
        {Array.from({length: n}).map((_, i) => {
          const a = Math.PI * (1 - i / n) - 0.012;
          const b = Math.PI * (1 - (i + 1) / n) + 0.012;
          const k = eo3(seg(f, arcStart + i * 5, arcStart + 20 + i * 5));
          const col = colorAt((i + 0.5) / n);
          const active = i === zone && sweepK > 0.02;
          return <path key={i} d={sector(gcx, gcy, r0 - (active ? 5 * u : 0), R + (active ? 8 * u : 0), a, b)} fill={col} opacity={k * (sweepK > 0.02 ? (active ? 1 : 0.5) : 1)} transform={`translate(0 ${(1 - k) * 24 * u})`} />;
        })}
        {/* ticks */}
        {Array.from({length: 21}).map((_, i) => {
          const th = Math.PI * (1 - i / 20);
          const [x0, y0] = polar(gcx, gcy, r0 - 10 * u, th);
          const [x1, y1] = polar(gcx, gcy, r0 - (i % 5 === 0 ? 26 : 18) * u, th);
          return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={p.ink} strokeWidth={(i % 5 === 0 ? 3 : 1.8) * u} opacity={0.4 * eo3(seg(f, arcStart + 14, arcStart + 40))} />;
        })}
        {/* end labels */}
        <text x={polar(gcx, gcy, (R + r0) / 2, Math.PI)[0]} y={gcy + 44 * u} textAnchor="middle" fontFamily={lf.sans} fontWeight={800} fontSize={26 * u} letterSpacing={2 * u} fill={p.trueColor} opacity={eo3(seg(f, arcStart + 18, arcStart + 36))}>
          {labels[0].toUpperCase()}
        </text>
        <text x={polar(gcx, gcy, (R + r0) / 2, 0)[0]} y={gcy + 44 * u} textAnchor="middle" fontFamily={lf.sans} fontWeight={800} fontSize={26 * u} letterSpacing={2 * u} fill={p.falseColor} opacity={eo3(seg(f, arcStart + 18, arcStart + 36))}>
          {labels[n - 1].toUpperCase()}
        </text>
        {/* needle */}
        <g opacity={eo3(seg(f, arcStart + 10, arcStart + 30))} transform={`rotate(${needleDeg} ${gcx} ${gcy})`}>
          <path d={`M${gcx - 11 * u} ${gcy} L${gcx} ${gcy - R * 0.93} L${gcx + 11 * u} ${gcy}Z`} fill={p.ink} stroke={p.background === 'transparent' ? '#0F131B' : p.background} strokeWidth={3 * u} strokeLinejoin="round" />
        </g>
        <circle cx={gcx} cy={gcy} r={26 * u} fill={p.ink} stroke={p.background === 'transparent' ? '#0F131B' : p.background} strokeWidth={4 * u} opacity={eo3(seg(f, arcStart + 10, arcStart + 30))} />
        <circle cx={gcx} cy={gcy} r={10 * u} fill={final} opacity={eo3(seg(f, arcStart + 10, arcStart + 30))} />
      </Svg>

      {/* legend row */}
      <div style={{position: 'absolute', left: gcx - R, top: gcy + 86 * u, width: R * 2, display: 'flex', gap: 6 * u, opacity: eo3(seg(f, arcStart + 20, arcStart + 44))}}>
        {labels.map((l, i) => {
          const segW = (R * 2 - 6 * u * (n - 1)) / n;
          const fs = fitSize(l, 20 * u, segW - 6 * u, 'sans', 0.0);
          const active = i === zone && sweepK > 0.02;
          return (
            <div key={i} style={{width: segW, textAlign: 'center'}}>
              <div style={{height: 7 * u, background: colorAt((i + 0.5) / n), opacity: active ? 1 : 0.45, marginBottom: 8 * u}} />
              <div style={{fontFamily: lf.sans, fontWeight: active ? 800 : 600, fontSize: fs, color: p.ink, opacity: active ? 1 : 0.55, whiteSpace: 'nowrap'}}>{l}</div>
            </div>
          );
        })}
      </div>

      {/* verdict stamp */}
      {vT > 0 && (
        <div
          style={{
            position: 'absolute',
            left: gcx - vW / 2,
            top: vY + 40 * u,
            width: vW,
            height: vH,
            background: final,
            color: score > 0.28 && score < 0.72 ? '#16130A' : '#FFFFFF',
            fontFamily: lf.display,
            fontSize: vfit,
            letterSpacing: vfit * 0.04,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'nowrap',
            borderRadius: 8 * u,
            opacity: clamp(vT * 3),
            transform: `rotate(${lerp(-9, -2.5, eo3(vT))}deg) scale(${lerp(2.1, 1, clamp(backOut(vT, 1.2), 0, 1.1))})`,
            boxShadow: `0 ${10 * u}px ${30 * u}px ${alpha(final, 0.45)}`,
            border: `${4 * u}px solid ${alpha('#000000', 0.18)}`,
          }}
        >
          {verdict}
        </div>
      )}

      {/* explanation */}
      <div style={{position: 'absolute', left: gcx - R * 1.03, top: vY + 40 * u + vH + 28 * u, width: R * 2.06, textAlign: 'center', opacity: expK, transform: `translateY(${(1 - expK) * 14 * u}px)`}}>
        {exLines.map((l, i) => (
          <div key={i} style={{fontFamily: lf.sans, fontWeight: 400, fontSize: (portrait ? 34 : 30) * u, lineHeight: 1.35, color: p.ink, opacity: 0.85}}>
            {l}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const factCheckMeter = defineMotion<Props>({
  id: 'fact-check-meter',
  title: 'Fact-check meter',
  category: 'hud',
  description:
    'A fact-check graphic: the claim appears in a quote card, a segmented true-to-false gauge draws in, the needle sweeps and wobbles to the score while the matching zone label lights up, then a tilted verdict stamp and a one-line explanation land.',
  source: ['library original (fact-check rating-meter pattern)'],
  useFor: 'Rating a claim in news, explainers, debunk and myth-busting videos; any "how true is it" or 0-to-1 rating with a verdict.',
  durationInFrames: 210,
  defaultProps: {
    tag: 'Fact check',
    claimLabel: 'The claim',
    claim: 'Commute times in the city have been cut in half since 2020.',
    claimSource: 'Said by a local official · 3 March',
    verdict: 'Mostly false',
    score: 0.78,
    scaleLabels: ['True', 'Mostly true', 'Half true', 'Mostly false', 'False'],
    explanation: 'Transport figures show average commutes fell by about 9 percent, not 50.',
    trueColor: '#2FA866',
    midColor: '#F2C230',
    falseColor: '#E0463A',
    accent: '#F2B705',
    ink: '#F4F2EC',
    background: '#0F131B',
    sweepAt: 56,
    speed: 1,
  },
  propDocs: {
    tag: 'chip above the claim (empty = none)',
    claimLabel: 'small label on the claim card (empty = none)',
    claim: 'the statement being checked',
    claimSource: 'who said it / where / when (empty = none)',
    verdict: 'verdict stamp text',
    score: 'needle position 0 (true) to 1 (false)',
    scaleLabels: 'labels of the gauge zones from true to false (2-7 entries = that many segments)',
    explanation: 'one-line reason shown under the verdict',
    trueColor: 'colour at the true end',
    midColor: 'colour in the middle',
    falseColor: 'colour at the false end',
    accent: 'tag chip and claim bar colour',
    ink: 'text colour',
    background: 'backdrop colour; "transparent" = overlay',
    sweepAt: 'frame the needle starts to sweep',
    speed: 'timing multiplier',
  },
  component: FactCheck,
  tags: ['fact check', 'meter', 'gauge', 'verdict', 'true', 'false', 'rating', 'claim', 'needle', 'news', 'debunk', 'misinformation', 'journalism', 'truth'],
});

