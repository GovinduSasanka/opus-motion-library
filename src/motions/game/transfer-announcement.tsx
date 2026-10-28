import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {Crest, Silhouette, backOut, bgCss, bodyFont, clampN, easeIO, easeOut3, fitFont, headFont, mixHex, onColor, sseg, withAlpha} from '../../core/r3-sports-kit';
import {Svg, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Transfer / signing announcement: colour panels in the two club colours wipe in, the player's photo slides up on a slanted
 * panel, the name reveals line by line, then `FROM club -> TO club` colour crests with a travelling arrow, a fee and a date chip,
 * and an OFFICIAL stamp slams on. Wide frames put the photo on the right; square and tall frames stack photo over text.
 * Without a photo a neutral silhouette is drawn; crests are coloured tag badges unless you pass logos.
 */
type Props = {
  label: string;
  playerName: string;
  position: string;
  src: string;
  fromClub: string;
  toClub: string;
  fromTag: string;
  toTag: string;
  fromLogo: string;
  toLogo: string;
  fromColor: string;
  toColor: string;
  fee: string;
  feeLabel: string;
  date: string;
  dateLabel: string;
  note: string;
  stampText: string;
  background: string;
  ink: string;
  accent: string;
  fontFamily: string;
};

const TransferAnnouncement: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames: T} = useStage();
  const head = headFont(P.fontFamily);
  const body = bodyFont(P.fontFamily);
  const wide = w / h > 1.45;
  const dark = '#070B16';

  // ---- geometry
  const pad = (wide ? 90 : 56) * u;
  const photoBox = wide ? {x: w * 0.56, y: 0, w: w * 0.44, h: h} : {x: 0, y: 0, w, h: h * (portrait ? 0.42 : 0.4)};
  const slant = wide ? 120 * u : 70 * u;
  const contentX = pad;
  const contentW = wide ? w * 0.56 - pad * 1.3 : w - pad * 2;
  const contentTop = wide ? 0 : photoBox.h + 30 * u;
  const contentH = wide ? h : h - contentTop;

  // ---- animation beats
  const wipe1 = easeIO(sseg(frame, 0, 22));
  const wipe2 = easeIO(sseg(frame, 6, 30));
  const photoP = easeOut3(sseg(frame, 14, 50));
  const chipP = backOut(sseg(frame, 24, 44));
  const nameA = easeOut3(sseg(frame, 32, 56));
  const nameB = easeOut3(sseg(frame, 40, 64));
  const posP = easeOut3(sseg(frame, 52, 74));
  const fromP = backOut(sseg(frame, 64, 86), 1.9);
  const arrowP = easeIO(sseg(frame, 76, 102));
  const toP = backOut(sseg(frame, 96, 118), 1.9);
  const feeP = backOut(sseg(frame, 112, 134));
  const dateP = backOut(sseg(frame, 120, 142));
  const stampT = sseg(frame, 138, 152);
  const stampS = 1 + (1 - easeOut3(stampT)) * 1.1;
  const shake = frame >= 148 && frame < 158 ? Math.sin(frame * 3.1) * (158 - frame) * 0.5 * u : 0;
  const drift = (frame / T) * 24 * u;

  // name split: last word big, the rest as first line
  const parts = (P.playerName || '').trim().split(/\s+/);
  const last = parts.length > 1 ? parts[parts.length - 1] : parts[0] || '';
  const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
  const lastFs = fitFont(last.toUpperCase(), (wide ? 170 : portrait ? 150 : 120) * u, contentW, 'display');
  const firstFs = fitFont(first.toUpperCase(), (wide ? 66 : 56) * u, contentW, 'display');

  const crest = (wide ? 150 : portrait ? 150 : 120) * u;
  const clubFs = (c: string) => fitFont((c || '').toUpperCase(), 30 * u, crest * 1.9, 'sans', 0.05);
  const arrowW = clampN((contentW - crest * 2 - 40 * u) * 0.9, 90 * u, 300 * u);
  const photoClip = wide
    ? `polygon(${slant}px 0,100% 0,100% 100%,0 100%)`
    : `polygon(0 0,100% 0,100% calc(100% - ${slant}px),0 100%)`;

  const photoInner = (
    <div style={{position: 'absolute', inset: 0, transform: `translate(${wide ? (1 - photoP) * 220 * u : 0}px, ${wide ? 0 : (1 - photoP) * -160 * u}px) scale(${1.08 + (1 - photoP) * 0.1})`, opacity: easeOut3(sseg(frame, 14, 34))}}>
      {P.src ? (
        <Img src={resolveSrc(P.src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 18%'}} />
      ) : (
        <Silhouette width={photoBox.w} height={photoBox.h} color={P.toColor} seed={P.playerName} />
      )}
    </div>
  );

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      {bgCss(P.background) && (
        <>
          <AbsoluteFill style={{background: `linear-gradient(115deg, ${mixHex(P.background, P.fromColor, 0.18)} 0%, ${P.background} 55%, ${mixHex(P.background, P.toColor, 0.22)} 100%)`}} />
          {/* diagonal colour wipes */}
          <Svg>
            <polygon points={`${w * 0.5 + wipe2 * 0},0 ${w},0 ${w},${h} ${w * 0.5 - h * 0.15},${h}`} fill={withAlpha(P.toColor, 0.5)} transform={`translate(${(1 - wipe2) * w * 0.7} 0)`} />
            <polygon points={`0,0 ${w * 0.12},0 ${w * 0.02},${h} 0,${h}`} fill={P.fromColor} transform={`translate(${-(1 - wipe1) * w * 0.2} 0)`} />
          </Svg>
          <Vignette strength={0.4} />
        </>
      )}

      {/* photo panel */}
      <div style={{position: 'absolute', left: photoBox.x, top: photoBox.y, width: photoBox.w, height: photoBox.h, clipPath: photoClip, filter: `drop-shadow(0 ${10 * u}px ${24 * u}px rgba(0,0,0,0.5))`}}>
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${P.toColor}, ${mixHex(P.toColor, dark, 0.65)})`}} />
        <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
          <div style={{position: 'absolute', inset: 0, transform: `translate(${-drift * (wide ? 1 : 0)}px, 0)`}}>{photoInner}</div>
        </div>
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(${wide ? 90 : 180}deg, transparent 55%, ${withAlpha(dark, 0.55)})`}} />
        {/* big club tag watermark */}
        <div style={{position: 'absolute', right: 20 * u, bottom: 6 * u, fontFamily: head, fontSize: Math.min(photoBox.w, photoBox.h) * 0.4, lineHeight: 1, color: withAlpha('#ffffff', 0.1), opacity: photoP, whiteSpace: 'nowrap'}}>{(P.toTag || P.toClub || '').slice(0, 3).toUpperCase()}</div>
      </div>
      <div style={{position: 'absolute', left: wide ? photoBox.x : 0, top: wide ? 0 : photoBox.h - 10 * u, width: wide ? 10 * u : w, height: wide ? h : 10 * u, background: P.accent, opacity: 0}} />

      {/* content */}
      <div style={{position: 'absolute', left: contentX, top: contentTop, width: contentW, height: contentH, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: (wide ? 26 : 16) * u}}>
        {/* label chip */}
        <div style={{display: 'flex'}}>
          <div style={{background: P.accent, color: onColor(P.accent), fontFamily: body, fontWeight: 800, fontSize: 28 * u, letterSpacing: 8 * u, textTransform: 'uppercase', padding: `${10 * u}px ${26 * u}px`, clipPath: `polygon(${14 * u}px 0,100% 0,calc(100% - ${14 * u}px) 100%,0 100%)`, transform: `scale(${chipP})`, transformOrigin: 'left center'}}>{P.label}</div>
        </div>
        {/* name */}
        <div>
          {first && (
            <div style={{overflow: 'hidden', height: firstFs * 1.12}}>
              <div style={{fontFamily: head, fontSize: firstFs, lineHeight: 1.12, color: P.ink, textTransform: 'uppercase', whiteSpace: 'nowrap', transform: `translateY(${(1 - nameA) * 110}%)`}}>{first}</div>
            </div>
          )}
          <div style={{overflow: 'hidden', height: lastFs * 1.08}}>
            <div style={{fontFamily: head, fontSize: lastFs, lineHeight: 1.08, color: P.ink, textTransform: 'uppercase', whiteSpace: 'nowrap', transform: `translateY(${(1 - nameB) * 110}%)`, textShadow: `0 ${4 * u}px ${24 * u}px rgba(0,0,0,0.4)`}}>{last}</div>
          </div>
          <div style={{fontFamily: body, fontWeight: 700, fontSize: 30 * u, letterSpacing: 9 * u, color: withAlpha(P.ink, 0.75), textTransform: 'uppercase', marginTop: 10 * u, opacity: posP, transform: `translateX(${(1 - posP) * -30 * u}px)`}}>{P.position}</div>
        </div>
        {/* from -> to */}
        <div style={{display: 'flex', alignItems: 'center', gap: 20 * u, marginTop: (wide ? 10 : 2) * u}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 * u, opacity: Math.min(1, fromP), transform: `scale(${0.4 + 0.6 * fromP})`}}>
            <Crest size={crest} label={P.fromTag || P.fromClub} color={P.fromColor} src={P.fromLogo} shape="shield" font={head} />
            <div style={{fontFamily: body, fontWeight: 700, fontSize: clubFs(P.fromClub), letterSpacing: clubFs(P.fromClub) * 0.05, color: withAlpha(P.ink, 0.85), whiteSpace: 'nowrap'}}>{(P.fromClub || '').toUpperCase()}</div>
          </div>
          <div style={{width: arrowW, height: crest * 0.5, position: 'relative', marginBottom: 40 * u}}>
            <svg width={arrowW} height={crest * 0.5} viewBox={`0 0 ${arrowW} ${crest * 0.5}`} style={{overflow: 'visible'}}>
              <line x1={0} y1={crest * 0.25} x2={arrowW - 18 * u} y2={crest * 0.25} stroke={P.accent} strokeWidth={7 * u} strokeLinecap="round" strokeDasharray={`${arrowW} ${arrowW}`} strokeDashoffset={arrowW * (1 - arrowP)} />
              <path d={`M${arrowW - 34 * u} ${crest * 0.25 - 20 * u}L${arrowW - 8 * u} ${crest * 0.25}L${arrowW - 34 * u} ${crest * 0.25 + 20 * u}`} fill="none" stroke={P.accent} strokeWidth={7 * u} strokeLinecap="round" strokeLinejoin="round" opacity={sseg(frame, 92, 102)} />
              {frame > 90 && frame < 190 && <circle cx={((frame - 90) * 7 * u) % arrowW} cy={crest * 0.25} r={6 * u} fill="#fff" opacity={0.7 * (1 - sseg(frame, 160, 190))} />}
            </svg>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 * u, opacity: Math.min(1, toP), transform: `scale(${0.4 + 0.6 * toP})`}}>
            <div style={{position: 'relative'}}>
              <div style={{position: 'absolute', left: '50%', top: '50%', width: crest * 1.9, height: crest * 1.9, marginLeft: -crest * 0.95, marginTop: -crest * 0.95, borderRadius: '50%', border: `${4 * u}px solid ${P.toColor}`, opacity: (1 - sseg(frame, 100, 128)) * (frame > 98 ? 1 : 0), transform: `scale(${0.5 + sseg(frame, 100, 128)})`}} />
              <Crest size={crest} label={P.toTag || P.toClub} color={P.toColor} src={P.toLogo} shape="shield" font={head} />
            </div>
            <div style={{fontFamily: body, fontWeight: 800, fontSize: clubFs(P.toClub), letterSpacing: clubFs(P.toClub) * 0.05, color: P.ink, whiteSpace: 'nowrap'}}>{(P.toClub || '').toUpperCase()}</div>
          </div>
        </div>
        {/* fee + date */}
        <div style={{display: 'flex', gap: 18 * u, flexWrap: 'wrap', marginTop: 4 * u}}>
          {P.fee && (
            <div style={{background: 'rgba(255,255,255,0.08)', border: `${2 * u}px solid ${withAlpha(P.accent, 0.8)}`, borderRadius: 14 * u, padding: `${12 * u}px ${28 * u}px`, transform: `scale(${feeP})`, transformOrigin: 'left center'}}>
              <div style={{fontFamily: body, fontWeight: 700, fontSize: 20 * u, letterSpacing: 6 * u, color: withAlpha(P.ink, 0.7), textTransform: 'uppercase'}}>{P.feeLabel}</div>
              <div style={{fontFamily: head, fontSize: 64 * u, lineHeight: 1.05, color: P.accent}}>{P.fee}</div>
            </div>
          )}
          {P.date && (
            <div style={{background: 'rgba(255,255,255,0.08)', borderRadius: 14 * u, padding: `${12 * u}px ${28 * u}px`, transform: `scale(${dateP})`, transformOrigin: 'left center'}}>
              <div style={{fontFamily: body, fontWeight: 700, fontSize: 20 * u, letterSpacing: 6 * u, color: withAlpha(P.ink, 0.7), textTransform: 'uppercase'}}>{P.dateLabel}</div>
              <div style={{fontFamily: head, fontSize: 64 * u, lineHeight: 1.05, color: P.ink}}>{P.date}</div>
            </div>
          )}
        </div>
        {P.note && <div style={{fontFamily: body, fontWeight: 600, fontSize: 28 * u, color: withAlpha(P.ink, 0.8), opacity: dateP}}>{P.note}</div>}
      </div>

      {/* stamp */}
      {P.stampText && stampT > 0 && (
        <div style={{position: 'absolute', left: wide ? photoBox.x + photoBox.w * 0.5 : w * 0.5, top: wide ? h * 0.84 : photoBox.h - 60 * u, transform: `translate(-50%, -50%) translate(${shake}px, ${shake * 0.4}px) rotate(-9deg) scale(${stampS})`, opacity: Math.min(1, stampT * 3)}}>
          <div style={{fontFamily: head, fontSize: 64 * u, letterSpacing: 8 * u, color: P.accent, border: `${7 * u}px solid ${P.accent}`, borderRadius: 14 * u, padding: `${6 * u}px ${28 * u}px`, background: withAlpha(dark, 0.55), textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{P.stampText}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const transferAnnouncement = defineMotion<Props>({
  id: 'transfer-announcement',
  title: 'Transfer announcement',
  category: 'game',
  description: 'Club-colour panels wipe in, the player photo slides onto a slanted panel, the name reveals line by line, then FROM club to TO club crest chips with a travelling arrow, a fee and date chip, a contract note and an OFFICIAL stamp that slams on.',
  source: ['original'],
  useFor: 'Signing, transfer and trade announcements, new-hire or new-member reveals, "joins" and "moves to" news cards. Pass the player name, photo (src), the two clubs with colours and tags (or logos), the fee, the date and a note.',
  durationInFrames: 240,
  defaultProps: {
    label: 'Transfer news',
    playerName: 'Alder Kestrel',
    position: 'Striker',
    src: '',
    fromClub: 'Harbor City',
    toClub: 'Northgate',
    fromTag: 'HBC',
    toTag: 'NGT',
    fromLogo: '',
    toLogo: '',
    fromColor: '#E5484D',
    toColor: '#2F6BFF',
    fee: '€45M',
    feeLabel: 'Fee',
    date: '1 Sep',
    dateLabel: 'Signed',
    note: 'Five-year contract',
    stampText: 'Official',
    background: '#080C18',
    ink: '#FFFFFF',
    accent: '#FFC933',
    fontFamily: 'auto',
  },
  propDocs: {
    label: 'chip above the name (Transfer news, Here we go, Signed)',
    playerName: 'full name; the last word is shown large, the rest on a smaller line above',
    position: 'role line under the name',
    src: 'player photo (public/ path or URL); empty = neutral silhouette',
    fromClub: 'club left',
    toClub: 'club joined',
    fromTag: 'short tag on the from crest (3 letters)',
    toTag: 'short tag on the to crest',
    fromLogo: 'from-club logo image; empty = coloured tag badge',
    toLogo: 'to-club logo image; empty = coloured tag badge',
    fromColor: 'from-club colour',
    toColor: 'to-club colour (also the photo panel)',
    fee: 'fee text (any format); empty hides the chip',
    feeLabel: 'small label above the fee',
    date: 'date text; empty hides the chip',
    dateLabel: 'small label above the date',
    note: 'extra line under the chips (contract length, shirt number); empty hides it',
    stampText: 'text of the final stamp; empty hides it',
    background: 'frame colour, or "transparent" to overlay footage',
    ink: 'text colour',
    accent: 'chip, arrow and stamp colour',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: TransferAnnouncement,
  tags: ['transfer', 'signing', 'announcement', 'football', 'soccer', 'basketball', 'trade', 'joins', 'new signing', 'official', 'sports', 'news', 'player', 'from to', 'fee', 'contract'],
});
