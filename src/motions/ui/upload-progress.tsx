import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {backOut, easeIO, easeOut3, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {fitSize} from '../../core/text-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {bgCss, fam, isDark, surface} from '../../core/ui-loop-kit';

/**
 * A file-upload card: a document icon with an extension badge, the file name, "x of y MB" and a live percentage while a
 * progress bar fills with natural stop-and-go speed; at 100% the bar turns green, a check pops and the card reads
 * "complete". The card enters at the start and leaves at the end, so the clip loops cleanly.
 */
type Props = {
  fileName: string;
  fileSize: number;
  sizeUnit: string;
  statusLabel: string;
  doneLabel: string;
  speedLabel: string;
  showCancel: boolean;
  background: string;
  cardColor: string;
  ink: string;
  accent: string;
  doneColor: string;
  fontFamily: string;
};

/** upload progress 0..1: eased, with a stall around 40% and a quick finish — monotone and ends exactly at 1 */
const curve = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  const a = easeIO(x);
  const stall = 0.05 * Math.sin(x * Math.PI * 3) * (1 - x);
  return Math.min(1, Math.max(0, a * 0.92 + x * 0.08 + stall * 0.5));
};

const fmt = (v: number) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2));

const UploadProgress: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: T, portrait} = useStage();
  const k = T / 180;
  const font = fam(P.fontFamily);
  const dark = isDark(surface(P.background, '#ffffff'));
  const card = P.cardColor === 'auto' ? (dark ? '#1B2130' : '#FFFFFF') : P.cardColor;
  const S = (portrait ? 1.45 : 1.3) * u;
  const cw = Math.min(w * 0.92, portrait ? w * 0.92 : 780 * S);
  const ch = 292 * S;
  const x0 = (w - cw) / 2;
  const y0 = (h - ch) / 2;

  // timeline
  const tIn = 4 * k;
  const up0 = 22 * k;
  const up1 = 118 * k;
  const doneAt = up1;
  const tOut = 152 * k;
  const enter = easeOut3(sseg(frame, tIn, tIn + 16 * k));
  const leave = easeIO(sseg(frame, tOut, tOut + 16 * k));
  const vis = enter * (1 - leave);
  const p = curve(sseg(frame, up0, up1));
  const done = sseg(frame, doneAt, doneAt + 10 * k);
  const check = backOut(sseg(frame, doneAt + 2 * k, doneAt + 14 * k), 2.4);
  const total = Math.max(0.01, P.fileSize || 1);
  const sent = total * p;
  const pct = Math.floor(p * 100 + 1e-6);

  const bar = mixHex(P.accent, P.doneColor, done);
  const ext = ((P.fileName.split('.').pop() || 'FILE').slice(0, 4) || 'FILE').toUpperCase();
  const iconS = 92 * S;
  const textX = x0 + 34 * S + iconS + 26 * S;
  const textW = cw - (textX - x0) - 150 * S;
  const nameFs = fitSize(P.fileName, 31 * S, textW, 'sans');
  const subFs = 22 * S;
  const sub = withAlpha(P.ink, 0.58);
  const trackY = y0 + ch - 86 * S;
  const trackX = x0 + 34 * S;
  const trackW = cw - 68 * S;
  const trackH = 14 * S;
  const sheen = ((frame * 0.018) % 1) * (1 - done);

  const status = done > 0.5 ? P.doneLabel : P.statusLabel;
  const rightText = done > 0.5 ? '' : `${pct}%`;

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      <div
        style={{
          position: 'absolute',
          left: x0,
          top: y0 + (1 - enter) * 40 * S + leave * 24 * S,
          width: cw,
          height: ch,
          opacity: vis,
          transform: `scale(${0.96 + 0.04 * enter - 0.02 * leave})`,
          borderRadius: 30 * S,
          background: card,
          boxShadow: dark ? `0 ${22 * S}px ${60 * S}px rgba(0,0,0,0.5), 0 0 0 ${1.5 * u}px rgba(255,255,255,0.07)` : `0 ${20 * S}px ${56 * S}px rgba(24,32,60,0.14), 0 0 0 ${1.5 * u}px rgba(24,32,60,0.05)`,
          fontFamily: font,
        }}
      />
      <Svg style={{opacity: vis}}>
        <g transform={`translate(0 ${(1 - enter) * 40 * S + leave * 24 * S})`}>
          {/* file icon */}
          <g transform={`translate(${x0 + 34 * S} ${y0 + 36 * S})`}>
            <path d={`M0 ${10 * S} Q0 0 ${10 * S} 0 L${iconS * 0.62} 0 L${iconS * 0.9} ${iconS * 0.28} L${iconS * 0.9} ${iconS * 1.04} Q${iconS * 0.9} ${iconS * 1.14} ${iconS * 0.8} ${iconS * 1.14} L${10 * S} ${iconS * 1.14} Q0 ${iconS * 1.14} 0 ${iconS * 1.04} Z`} fill={withAlpha(P.accent, 0.12)} stroke={P.accent} strokeWidth={3 * S} strokeLinejoin="round" />
            <path d={`M${iconS * 0.62} 0 L${iconS * 0.62} ${iconS * 0.2} Q${iconS * 0.62} ${iconS * 0.28} ${iconS * 0.7} ${iconS * 0.28} L${iconS * 0.9} ${iconS * 0.28}`} fill={withAlpha(P.accent, 0.3)} stroke={P.accent} strokeWidth={3 * S} strokeLinejoin="round" />
            <rect x={-8 * S} y={iconS * 0.66} width={iconS * 0.72} height={30 * S} rx={8 * S} fill={bar} />
            <text x={-8 * S + iconS * 0.36} y={iconS * 0.66 + 21.5 * S} textAnchor="middle" fontFamily={font} fontWeight={800} fontSize={Math.min(19 * S, (iconS * 0.64) / Math.max(2, ext.length * 0.62))} fill="#ffffff">
              {ext}
            </text>
          </g>
          {/* track + fill */}
          <rect x={trackX} y={trackY} width={trackW} height={trackH} rx={trackH / 2} fill={withAlpha(P.ink, dark ? 0.12 : 0.08)} />
          {p > 0 && (
            <>
              <rect x={trackX} y={trackY} width={Math.max(trackH, trackW * p)} height={trackH} rx={trackH / 2} fill={bar} />
              {done < 1 && <rect x={trackX + Math.max(0, trackW * p - trackW * 0.2) * sheen} y={trackY} width={Math.min(trackW * 0.2, trackW * p)} height={trackH} rx={trackH / 2} fill="#ffffff" opacity={0.18} />}
              {done < 1 && <circle cx={trackX + Math.max(trackH, trackW * p) - trackH / 2} cy={trackY + trackH / 2} r={trackH * (1.3 + 0.2 * Math.sin(frame * 0.4))} fill={withAlpha(bar, 0.2)} />}
            </>
          )}
          {/* done check */}
          <g transform={`translate(${x0 + cw - 34 * S - 28 * S} ${y0 + 36 * S + 30 * S}) scale(${Math.max(0.0001, check)})`}>
            <circle r={28 * S} fill={P.doneColor} />
            <path d={`M${-11 * S} ${1 * S} L${-3 * S} ${10 * S} L${12 * S} ${-8 * S}`} fill="none" stroke="#fff" strokeWidth={5 * S} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      </Svg>
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, opacity: vis, fontFamily: font, transform: `translateY(${(1 - enter) * 40 * S + leave * 24 * S}px)`}}>
        <div style={{position: 'absolute', left: textX, top: y0 + 40 * S, width: textW, fontSize: nameFs, fontWeight: 800, color: P.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: -0.3 * u}}>{P.fileName}</div>
        <div style={{position: 'absolute', left: textX, top: y0 + 40 * S + nameFs * 1.35, fontSize: subFs, fontWeight: 400, color: sub, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>
          {done > 0.5 ? `${fmt(total)} ${P.sizeUnit}` : `${fmt(sent)} of ${fmt(total)} ${P.sizeUnit}`}
        </div>
        <div style={{position: 'absolute', left: textX, top: y0 + 40 * S + nameFs * 1.35 + subFs * 1.5, fontSize: subFs * 0.92, fontWeight: 600, color: done > 0.5 ? P.doneColor : P.accent, whiteSpace: 'nowrap'}}>
          {status}
          {done <= 0.5 && P.speedLabel ? <span style={{color: sub, fontWeight: 400}}>{`  ·  ${P.speedLabel}`}</span> : null}
        </div>
        <div style={{position: 'absolute', right: x0 + 34 * S, top: y0 + 40 * S, fontSize: 44 * S, fontWeight: 800, color: P.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: -1 * u, opacity: 1 - done}}>{rightText}</div>
        {P.showCancel && (
          <div style={{position: 'absolute', left: trackX, top: trackY + 28 * S, fontSize: subFs * 0.9, fontWeight: 600, color: sub, opacity: 1 - done}}>Cancel</div>
        )}
        <div style={{position: 'absolute', right: x0 + 34 * S, top: trackY + 28 * S, fontSize: subFs * 0.9, fontWeight: 600, color: P.doneColor, opacity: done}}>100%</div>
      </div>
    </AbsoluteFill>
  );
};

export const uploadProgress = defineMotion<Props>({
  id: 'upload-progress',
  title: 'Upload progress card',
  category: 'ui',
  description: 'A file card with an extension badge, file name and size: the progress bar fills with stop-and-go speed and a live percentage, then turns green with a check at 100%. Enters and leaves so it loops.',
  source: ['original'],
  useFor: 'Upload / download / export states, file-sharing and cloud-storage product demos, "your file is being processed" beats, app-store style screenshots.',
  durationInFrames: 180,
  defaultProps: {
    fileName: 'brand-guidelines.pdf',
    fileSize: 24.6,
    sizeUnit: 'MB',
    statusLabel: 'Uploading…',
    doneLabel: 'Upload complete',
    speedLabel: '3.2 MB/s',
    showCancel: true,
    background: '#EEF1F7',
    cardColor: 'auto',
    ink: '#1B2233',
    accent: '#4F6BFF',
    doneColor: '#18B26B',
    fontFamily: 'auto',
  },
  propDocs: {
    fileName: 'file name (its extension becomes the badge)',
    fileSize: 'total size as a number (shown as "x of y")',
    sizeUnit: 'unit label after the size (MB, KB, GB)',
    statusLabel: 'status text while uploading',
    doneLabel: 'status text when finished',
    speedLabel: 'optional speed text next to the status (empty to hide)',
    showCancel: 'show a small "Cancel" link while uploading',
    background: 'frame colour, or "transparent" to overlay content',
    cardColor: 'card colour, or "auto"',
    ink: 'text colour',
    accent: 'progress colour',
    doneColor: 'colour of the finished state',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: UploadProgress,
  tags: ['upload', 'progress', 'progress-bar', 'file', 'download', 'ui', 'app', 'website', 'loading', 'done', 'loop', 'storage', 'cloud', 'overlay'],
});
