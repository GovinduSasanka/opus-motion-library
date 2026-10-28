import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {useSafeId} from '../../core/image-kit';
import {backOut, easeOut3, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A certificate: frame draws on, text lines settle in, the recipient name and the signature write on (left-to-right
 * reveal), then a gold seal stamps down with a shake and a shockwave ring.
 */
type Props = {
  title: string;
  subtitle: string;
  preamble: string;
  name: string;
  description: string;
  date: string;
  signer: string;
  signerTitle: string;
  sealText: string;
  paper: string;
  ink: string;
  accent: string;
  background: string;
  startAt: number;
};

const CertificateSeal: React.FC<Props> = (p) => {
  const frame = useCurrentFrame() - p.startAt;
  const {w, h, u, portrait} = useStage();
  const uid = useSafeId('cer');
  const cw = portrait ? w * 0.9 : Math.min(w * 0.86, h * 1.4 * 0.92);
  const ch = portrait ? Math.min(cw * 1.38, h * 0.82) : cw / 1.414;
  const cx = w / 2;
  const cy = h / 2;
  const X0 = cx - cw / 2;
  const Y0 = cy - ch / 2;
  const enter = easeOut3(sseg(frame, 0, 22));
  const frameDraw = easeOut3(sseg(frame, 8, 46));
  const m = cw * 0.04;
  const base = Math.min(cw, ch * 1.2);
  const line = (a: number) => easeOut3(sseg(frame, a, a + 16));
  const nameT = sseg(frame, 66, 96);
  const sigT = sseg(frame, 104, 132);
  const sealAt = 140;
  const sealP = sseg(frame, sealAt, sealAt + 9);
  const stamped = frame >= sealAt + 8;
  const sealScale = 1 + (1 - sealP * sealP) * 1.1;
  const shake = stamped ? Math.sin((frame - sealAt) * 3) * 5 * u * Math.exp(-(frame - sealAt - 8) * 0.25) : 0;
  const ring = sseg(frame, sealAt + 8, sealAt + 34);
  const settleSeal = backOut(sseg(frame, sealAt + 8, sealAt + 22), 2.4);
  const R = base * (portrait ? 0.13 : 0.105);
  const sx = X0 + cw * (portrait ? 0.76 : 0.82);
  const sy = Y0 + ch * (portrait ? 0.78 : 0.74);
  const star = (rOut: number, rIn: number, pts: number) => {
    let d = '';
    for (let i = 0; i < pts * 2; i++) {
      const a = (i * Math.PI) / pts - Math.PI / 2;
      const r = i % 2 ? rIn : rOut;
      d += `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
    }
    return d + 'Z';
  };
  const gold = p.accent;
  const goldHi = mixHex(gold, '#ffffff', 0.45);
  const goldLo = mixHex(gold, '#000000', 0.35);
  const nameFs = Math.min(base * 0.1, (cw * 0.8) / Math.max(1, p.name.length * 0.42));
  const L = (ys: number) => Y0 + ch * ys;
  const sigY = L(portrait ? 0.84 : 0.8);
  const sigX = X0 + cw * (portrait ? 0.3 : 0.27);
  const sigFs = base * 0.07;
  const sigW = Math.max(120 * u, p.signer.length * sigFs * 0.42);
  const bg = p.background === 'transparent' ? undefined : p.background;
  return (
    <AbsoluteFill style={{background: bg}}>
      <Svg>
        <defs>
          <radialGradient id={`${uid}-g`} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor={goldHi} />
            <stop offset="0.55" stopColor={gold} />
            <stop offset="1" stopColor={goldLo} />
          </radialGradient>
          <clipPath id={`${uid}-n`}>
            <rect x={cx - (cw * 0.5)} y={L(0.3)} width={cw * nameT} height={ch * 0.3} />
          </clipPath>
          <clipPath id={`${uid}-s`}>
            <rect x={sigX - sigW / 2 - 10 * u} y={sigY - sigFs * 1.6} width={(sigW + 20 * u) * sigT} height={sigFs * 2.6} />
          </clipPath>
        </defs>
        <g transform={`translate(${cx} ${cy}) scale(${0.92 + 0.08 * enter}) translate(${-cx} ${-cy})`} opacity={enter}>
          <rect x={X0 + 10 * u} y={Y0 + 18 * u} width={cw} height={ch} rx={6 * u} fill="#000" opacity={0.22} />
          <rect x={X0} y={Y0} width={cw} height={ch} rx={6 * u} fill={p.paper} />
          {/* borders */}
          <rect x={X0 + m} y={Y0 + m} width={cw - 2 * m} height={ch - 2 * m} fill="none" stroke={gold} strokeWidth={5 * u} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - frameDraw} />
          <rect x={X0 + m * 1.55} y={Y0 + m * 1.55} width={cw - 3.1 * m} height={ch - 3.1 * m} fill="none" stroke={withAlpha(p.ink, 0.55)} strokeWidth={1.6 * u} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - frameDraw} />
          {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b], i) => (
            <g key={i} transform={`translate(${X0 + m * 1.55 + a * (cw - 3.1 * m)} ${Y0 + m * 1.55 + b * (ch - 3.1 * m)}) rotate(${a ? (b ? 180 : 90) : b ? -90 : 0})`} opacity={frameDraw}>
              <path d={`M0 0L${m * 1.2} 0M0 0L0 ${m * 1.2}`} stroke={gold} strokeWidth={5 * u} strokeLinecap="round" />
              <circle cx={m * 0.5} cy={m * 0.5} r={m * 0.22} fill={gold} />
            </g>
          ))}
          {/* text */}
          <text x={cx} y={L(0.2)} textAnchor="middle" fontFamily={fonts.serif} fontWeight={700} fontSize={Math.min(base * 0.085, (cw * 0.8) / Math.max(1, p.title.length * 0.66))} letterSpacing={base * 0.012} fill={p.ink} opacity={line(26)} transform={`translate(0 ${(1 - line(26)) * 18 * u})`}>
            {p.title}
          </text>
          <text x={cx} y={L(0.275)} textAnchor="middle" fontFamily={fonts.sans} fontWeight={600} fontSize={base * 0.027} letterSpacing={base * 0.014} fill={gold} opacity={line(36)}>
            {p.subtitle}
          </text>
          <text x={cx} y={L(0.4)} textAnchor="middle" fontFamily={fonts.serif} fontWeight={500} fontSize={base * 0.034} fill={withAlpha(p.ink, 0.7)} opacity={line(48)}>
            {p.preamble}
          </text>
          <g clipPath={`url(#${uid}-n)`}>
            <text x={cx} y={L(0.54)} textAnchor="middle" fontFamily={fonts.hand} fontWeight={700} fontSize={nameFs} fill={p.ink}>
              {p.name}
            </text>
          </g>
          <line x1={cx - cw * 0.3} y1={L(0.575)} x2={cx - cw * 0.3 + cw * 0.6 * easeOut3(sseg(frame, 60, 90))} y2={L(0.575)} stroke={gold} strokeWidth={3 * u} />
          <text x={cx} y={L(0.665)} textAnchor="middle" fontFamily={fonts.serif} fontWeight={500} fontSize={base * 0.032} fill={withAlpha(p.ink, 0.72)} opacity={line(90)}>
            {p.description}
          </text>
          {/* signature */}
          <g opacity={sseg(frame, 100, 106)}>
            <g clipPath={`url(#${uid}-s)`}>
              <text x={sigX} y={sigY} textAnchor="middle" fontFamily={fonts.hand} fontWeight={700} fontSize={sigFs} fill={p.ink} transform={`rotate(-4 ${sigX} ${sigY})`}>
                {p.signer}
              </text>
            </g>
          </g>
          <line x1={sigX - cw * 0.14} y1={sigY + sigFs * 0.4} x2={sigX + cw * 0.14} y2={sigY + sigFs * 0.4} stroke={withAlpha(p.ink, 0.6)} strokeWidth={2 * u} opacity={line(100)} />
          <text x={sigX} y={sigY + sigFs * 1.1} textAnchor="middle" fontFamily={fonts.sans} fontSize={base * 0.02} letterSpacing={base * 0.003} fill={withAlpha(p.ink, 0.65)} opacity={line(112)}>
            {p.signerTitle}
          </text>
          <text x={cx} y={L(portrait ? 0.945 : 0.9)} textAnchor="middle" fontFamily={fonts.sans} fontWeight={600} fontSize={base * 0.02} letterSpacing={base * 0.004} fill={withAlpha(p.ink, 0.55)} opacity={line(120)}>
            {p.date}
          </text>
          {/* seal */}
          {frame >= sealAt ? (
            <g transform={`translate(${sx + shake} ${sy}) scale(${sealScale * (stamped ? 1 + 0.06 * (1 - settleSeal) : 1)})`} opacity={sealP}>
              <path d={`M${-R * 0.5} ${R * 0.6}L${-R * 0.75} ${R * 1.5}L${-R * 0.3} ${R * 1.3}L${R * 0.05} ${R * 1.55}L${R * 0.2} ${R * 0.7}Z`} fill={mixHex(gold, '#7A1F1F', 0.55)} />
              <path d={`M${R * 0.5} ${R * 0.6}L${R * 0.8} ${R * 1.45}L${R * 0.35} ${R * 1.3}L${-R * 0.05} ${R * 1.5}L${-R * 0.2} ${R * 0.7}Z`} fill={mixHex(gold, '#9A2A2A', 0.5)} />
              <circle r={R * 1.02} fill="#000" opacity={0.2} transform={`translate(${3 * u} ${6 * u})`} />
              <path d={star(R * 1.06, R * 0.9, 26)} fill={`url(#${uid}-g)`} />
              <circle r={R * 0.8} fill="none" stroke={goldLo} strokeWidth={2.5 * u} />
              <circle r={R * 0.72} fill="none" stroke={goldHi} strokeWidth={1.5 * u} opacity={0.8} />
              <path transform={`translate(0 ${p.sealText ? -R * 0.15 : 0})`} d={star(R * 0.42, R * 0.18, 5)} fill={goldHi} stroke={goldLo} strokeWidth={1.5 * u} strokeLinejoin="round" />
              {p.sealText ? (
                <text y={R * 0.5} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={R * 0.15} letterSpacing={R * 0.03} fill={goldLo}>
                  {p.sealText}
                </text>
              ) : null}
            </g>
          ) : null}
          {ring > 0 && ring < 1 ? <circle cx={sx} cy={sy} r={R * (1 + ring * 1.6)} fill="none" stroke={gold} strokeWidth={5 * u * (1 - ring)} opacity={0.7 * (1 - ring)} /> : null}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const certificateSeal = defineMotion<Props>({
  id: 'certificate-seal',
  title: 'Certificate with gold seal',
  category: 'document',
  description:
    'A certificate: double border draws on, title / recipient name / description settle in, the name and a signature write on left-to-right, then a gold wax-style seal with ribbons stamps down with a shake and a shockwave ring.',
  source: ['original (round 3)'],
  useFor: 'Course / award / completion certificates, achievements, "officially certified" beats, diploma and credential reveals.',
  durationInFrames: 210,
  defaultProps: {
    title: 'CERTIFICATE',
    subtitle: 'OF ACHIEVEMENT',
    preamble: 'This is proudly presented to',
    name: 'Alex Morgan',
    description: 'for outstanding dedication and craft',
    date: '12 March 2026',
    signer: 'Jordan Lee',
    signerTitle: 'Program Director',
    sealText: 'OFFICIAL',
    paper: '#FAF5E6',
    ink: '#2B2A33',
    accent: '#C9A24B',
    background: '#1B1D2A',
    startAt: 4,
  },
  propDocs: {
    title: 'big heading',
    subtitle: 'small caps line under the heading',
    preamble: 'line above the name',
    name: 'recipient name (handwritten style)',
    description: 'line below the name',
    date: 'date line at the bottom',
    signer: 'signature text (handwritten style)',
    signerTitle: 'caption under the signature line',
    sealText: 'text on the seal (empty hides it)',
    paper: 'paper colour',
    ink: 'text colour',
    accent: 'gold: border, seal, subtitle',
    background: "backdrop colour or 'transparent'",
    startAt: 'frame the certificate starts appearing',
  },
  component: CertificateSeal,
  tags: ['certificate', 'award', 'diploma', 'seal', 'stamp', 'achievement', 'signature', 'course', 'completion', 'document', 'gold'],
});
