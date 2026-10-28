import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {NewsBackdrop, alpha, eio3, eo3, estWidth, fitSize, lf, on, seg} from '../../core/r3-news-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Interview name super (lower third): two lines - name and title - in four layouts:
 * "bar" (accent bar + dark panel), "tag" (solid name block over an offset title strip), "rule" (a thin line draws
 * over bare type on a soft scrim) and "center" (centred serif name with a diamond divider). Overlay-capable.
 */
type Props = {
  name: string;
  title: string;
  kicker: string;
  layout: string;
  position: string;
  accent: string;
  panelColor: string;
  ink: string;
  scrim: boolean;
  startAt: number;
  outAt: number;
  backdrop: string;
};

const Super: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = frame - p.startAt;
  const layout = ['bar', 'tag', 'rule', 'center'].includes(p.layout) ? p.layout : 'bar';
  const pos = layout === 'center' ? 'center' : p.position === 'right' ? 'right' : p.position === 'center' ? 'center' : 'left';

  const maxW = w * (portrait ? 0.88 : 0.72);
  const nameFont = layout === 'center' ? 'serif' : 'sans';
  const nameFs0 = (layout === 'center' ? 70 : layout === 'tag' ? 50 : 54) * u;
  const nameStr = layout === 'rule' || layout === 'tag' ? p.name : p.name;
  const nameFs = fitSize(layout === 'rule' ? nameStr.toUpperCase() : nameStr, nameFs0, maxW - 80 * u, nameFont, layout === 'rule' ? 0.05 : 0.0);
  const titleFs = Math.min(34 * u, nameFs * 0.62);
  const kickFs = Math.min(24 * u, nameFs * 0.46);
  const title = layout === 'center' || layout === 'rule' ? (p.title || '').toUpperCase() : p.title;
  const nameW = estWidth(layout === 'rule' ? nameStr.toUpperCase() : nameStr, nameFs, nameFont, layout === 'rule' ? 0.05 : 0);
  const titleW = estWidth(title, titleFs, 'sans', layout === 'center' || layout === 'rule' ? 0.12 : 0.0);
  const contentW = Math.max(nameW, titleW) * 1.02;

  const pad = w * (portrait ? 0.06 : 0.05);
  const bottom = h * (portrait ? 0.17 : 0.12);
  const out = eio3(seg(f, p.outAt, p.outAt + 14));
  const vis = 1 - out;

  const anchor = (bw: number) => (pos === 'left' ? pad : pos === 'right' ? w - pad - bw : (w - bw) / 2);
  const dir = pos === 'right' ? 1 : -1;

  let content: React.ReactNode = null;

  if (layout === 'bar') {
    const padX = 34 * u;
    const padY = 22 * u;
    const barW = 12 * u;
    const kick = on(p.kicker);
    const lineGap = 8 * u;
    const bh = padY * 2 + nameFs * 1.15 + lineGap + titleFs * 1.2 + (kick ? kickFs * 1.5 : 0);
    const bw = contentW + padX * 2 + barW;
    const x = anchor(bw);
    const barK = eo3(seg(f, 0, 10));
    const panK = eio3(seg(f, 6, 24));
    const t1 = eo3(seg(f, 12, 26));
    const t2 = eo3(seg(f, 18, 32));
    content = (
      <div style={{position: 'absolute', left: x, bottom, width: bw, height: bh, transform: `translateX(${out * dir * 60 * u}px)`}}>
        <div style={{position: 'absolute', left: pos === 'right' ? bw - barW : 0, bottom: 0, width: barW, height: bh * barK, background: p.accent}} />
        <div style={{position: 'absolute', left: pos === 'right' ? bw - barW - (bw - barW) * panK : barW, bottom: 0, width: (bw - barW) * panK, height: bh, background: alpha(p.panelColor, 0.9), overflow: 'hidden', boxShadow: `0 ${10 * u}px ${28 * u}px rgba(0,0,0,0.35)`}}>
          <div style={{position: 'absolute', left: padX, [pos === 'right' ? 'right' : 'left']: padX, top: padY, width: contentW, textAlign: pos === 'right' ? 'right' : 'left'}}>
            {kick && <div style={{fontFamily: lf.sans, fontWeight: 800, fontSize: kickFs, letterSpacing: kickFs * 0.18, color: p.accent, opacity: t1, marginBottom: kickFs * 0.4}}>{p.kicker.toUpperCase()}</div>}
            <div style={{fontFamily: lf.sans, fontWeight: 800, fontSize: nameFs, lineHeight: 1.15, color: p.ink, whiteSpace: 'nowrap', opacity: t1, transform: `translateX(${(1 - t1) * 30 * dir * -1 * u}px)`}}>{p.name}</div>
            <div style={{marginTop: lineGap, fontFamily: lf.sans, fontWeight: 400, fontSize: titleFs, lineHeight: 1.2, color: p.ink, opacity: 0.82 * t2, whiteSpace: 'nowrap', transform: `translateX(${(1 - t2) * 30 * dir * -1 * u}px)`}}>{p.title}</div>
          </div>
        </div>
      </div>
    );
  } else if (layout === 'tag') {
    const nh = nameFs * 1.15 + 28 * u;
    const th = titleFs * 1.2 + 20 * u;
    const nw = nameW + 56 * u;
    const tw = titleW + 48 * u;
    const off = 30 * u;
    const bw = Math.max(nw, tw + off);
    const x = anchor(bw);
    const a = eio3(seg(f, 0, 14));
    const b = eio3(seg(f, 8, 22));
    const kick = on(p.kicker);
    content = (
      <div style={{position: 'absolute', left: x, bottom, width: bw, height: nh + th, transform: `translateX(${out * dir * 60 * u}px)`}}>
        <div style={{position: 'absolute', [pos === 'right' ? 'right' : 'left']: 0, top: 0, width: nw, height: nh, overflow: 'hidden', clipPath: `inset(0 ${(1 - a) * 100}% 0 0)`}}>
          <div style={{position: 'absolute', inset: 0, background: p.accent, boxShadow: `0 ${8 * u}px ${22 * u}px rgba(0,0,0,0.3)`}} />
          <div style={{position: 'absolute', left: 28 * u, top: 0, height: '100%', display: 'flex', alignItems: 'center', fontFamily: lf.sans, fontWeight: 800, fontSize: nameFs, color: '#0E1116', whiteSpace: 'nowrap'}}>{p.name}</div>
        </div>
        <div style={{position: 'absolute', [pos === 'right' ? 'right' : 'left']: off, top: nh, width: tw, height: th, overflow: 'hidden', clipPath: `inset(0 ${(1 - b) * 100}% 0 0)`}}>
          <div style={{position: 'absolute', inset: 0, background: alpha(p.panelColor, 0.95)}} />
          <div style={{position: 'absolute', left: 24 * u, top: 0, height: '100%', display: 'flex', alignItems: 'center', gap: 14 * u, fontFamily: lf.sans, fontWeight: 600, fontSize: titleFs, color: p.ink, whiteSpace: 'nowrap'}}>
            {kick && <span style={{fontWeight: 800, fontSize: kickFs, letterSpacing: kickFs * 0.16, color: p.accent}}>{p.kicker.toUpperCase()}</span>}
            {p.title}
          </div>
        </div>
      </div>
    );
  } else if (layout === 'rule') {
    const bw = contentW + 12 * u;
    const x = anchor(bw);
    const line = eio3(seg(f, 0, 18));
    const t1 = eo3(seg(f, 8, 24));
    const t2 = eo3(seg(f, 14, 30));
    const kick = on(p.kicker);
    content = (
      <div style={{position: 'absolute', left: x, bottom, width: bw, transform: `translateY(${out * 14 * u}px)`}}>
        <div style={{position: 'absolute', [pos === 'right' ? 'right' : 'left']: 0, top: -22 * u, width: bw * line, height: 4 * u, background: p.accent}} />
        {kick && <div style={{fontFamily: lf.sans, fontWeight: 800, fontSize: kickFs, letterSpacing: kickFs * 0.2, color: p.accent, opacity: t1, marginBottom: kickFs * 0.3, textAlign: pos === 'right' ? 'right' : 'left'}}>{p.kicker.toUpperCase()}</div>}
        <div style={{overflow: 'hidden', height: nameFs * 1.2, textAlign: pos === 'right' ? 'right' : 'left'}}>
          <div style={{fontFamily: lf.sans, fontWeight: 800, fontSize: nameFs, letterSpacing: nameFs * 0.05, lineHeight: 1.2, color: p.ink, whiteSpace: 'nowrap', transform: `translateY(${(1 - t1) * 105}%)`, textShadow: '0 2px 14px rgba(0,0,0,0.5)'}}>{p.name.toUpperCase()}</div>
        </div>
        <div style={{overflow: 'hidden', height: titleFs * 1.5, marginTop: 6 * u, textAlign: pos === 'right' ? 'right' : 'left'}}>
          <div style={{fontFamily: lf.sans, fontWeight: 600, fontSize: titleFs, letterSpacing: titleFs * 0.12, lineHeight: 1.5, color: p.ink, opacity: 0.88, whiteSpace: 'nowrap', transform: `translateY(${(1 - t2) * 105}%)`, textShadow: '0 2px 12px rgba(0,0,0,0.5)'}}>{title}</div>
        </div>
      </div>
    );
  } else {
    const bw = contentW + 20 * u;
    const x = (w - bw) / 2;
    const t1 = eo3(seg(f, 4, 24));
    const dv = eio3(seg(f, 12, 32));
    const t2 = eo3(seg(f, 20, 38));
    const kick = on(p.kicker);
    const lineW = Math.min(bw * 0.5, 260 * u) * dv;
    content = (
      <div style={{position: 'absolute', left: x, bottom: bottom - 10 * u, width: bw, textAlign: 'center', transform: `translateY(${out * 12 * u}px)`}}>
        {kick && <div style={{fontFamily: lf.sans, fontWeight: 800, fontSize: kickFs, letterSpacing: kickFs * 0.3, color: p.accent, opacity: t1, marginBottom: kickFs * 0.5}}>{p.kicker.toUpperCase()}</div>}
        <div style={{fontFamily: lf.serif, fontWeight: 700, fontSize: nameFs, lineHeight: 1.1, color: p.ink, whiteSpace: 'nowrap', opacity: t1, transform: `translateY(${(1 - t1) * 18 * u}px)`, textShadow: '0 2px 18px rgba(0,0,0,0.55)'}}>{p.name}</div>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 * u, margin: `${14 * u}px 0`}}>
          <div style={{width: lineW, height: 2 * u, background: p.accent}} />
          <div style={{width: 12 * u * dv, height: 12 * u * dv, background: p.accent, transform: 'rotate(45deg)'}} />
          <div style={{width: lineW, height: 2 * u, background: p.accent}} />
        </div>
        <div style={{fontFamily: lf.sans, fontWeight: 600, fontSize: titleFs, letterSpacing: titleFs * 0.16, color: p.ink, opacity: 0.9 * t2, whiteSpace: 'nowrap', transform: `translateY(${(1 - t2) * 10 * u}px)`, textShadow: '0 2px 12px rgba(0,0,0,0.5)'}}>{title}</div>
      </div>
    );
  }

  const scrimK = layout === 'rule' || layout === 'center' ? eo3(seg(f, 0, 20)) * vis : 0;

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <NewsBackdrop backdrop={p.backdrop} seed={34} palette="night" />
      {p.scrim && scrimK > 0 && <AbsoluteFill style={{background: `linear-gradient(0deg, rgba(5,6,9,${0.72 * scrimK}) 0%, rgba(5,6,9,0) 42%)`}} />}
      {f >= 0 && <div style={{opacity: clamp(vis * 1.0)}}>{content}</div>}
    </AbsoluteFill>
  );
};

export const interviewNameSuper = defineMotion<Props>({
  id: 'interview-name-super',
  title: 'Interview name super',
  category: 'hud',
  description:
    'A two-line interview super - name and title - in four layouts: "bar" (accent bar + dark panel), "tag" (solid name block over an offset title strip), "rule" (a thin accent line draws over bare type on a soft scrim) and "center" (centred serif name with a diamond divider). Left, right or centre; set backdrop to "transparent" to lay it over footage.',
  source: ['library original (interview lower-third / name super patterns)'],
  useFor: 'Naming and titling anyone on screen: interviewees, speakers, experts, hosts, witnesses - in news, documentary, podcast, webinar and corporate video.',
  durationInFrames: 150,
  defaultProps: {
    name: 'Dr. Amara Okoye',
    title: 'Senior Research Fellow, Northwind Institute',
    kicker: '',
    layout: 'bar',
    position: 'left',
    accent: '#F2B705',
    panelColor: '#10141B',
    ink: '#F7F5EE',
    scrim: true,
    startAt: 0,
    outAt: 132,
    backdrop: 'footage',
  },
  propDocs: {
    name: 'person name (line 1)',
    title: 'role / organisation (line 2)',
    kicker: 'small label above or beside the name, e.g. "Interview", "Witness" (empty = none)',
    layout: '"bar" | "tag" | "rule" | "center"',
    position: '"left" | "right" | "center" (the "center" layout is always centred)',
    accent: 'bar / name block / rule / divider colour',
    panelColor: 'panel fill ("bar" and "tag" layouts)',
    ink: 'text colour',
    scrim: 'soft bottom gradient behind "rule" and "center" layouts so bare type stays legible',
    startAt: 'frame the super starts',
    outAt: 'frame the super exits',
    backdrop: '"footage" = procedural plate, "transparent" = overlay, or any CSS colour',
  },
  component: Super,
  tags: ['overlay', 'lower third', 'name', 'title', 'interview', 'super', 'speaker', 'caption', 'news', 'documentary', 'broadcast', 'chyron', 'journalism', 'podcast'],
});
