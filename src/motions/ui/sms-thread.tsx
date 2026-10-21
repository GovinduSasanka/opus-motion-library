import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog, springAt} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {FilmGrain, useStage} from '../../core/stage';
import {estWidth, fitSize} from '../../core/text-kit';
import {defineMotion} from '../../core/types';
import {resolveSrc} from '../../core/image-kit';

/**
 * A phone text thread for product explainers: the phone rises in beside a headline, a system alert
 * ("Missed call"), typing dots and SMS bubbles pop in one by one and the thread scrolls like a real chat;
 * small "Day 2" style notes divide the thread, and a verdict badge ("Booked: Thu 9am") springs in under
 * the headline. Phone on the right in landscape, centred under the headline in portrait / square.
 */
type Msg = {text: string; from: 'us' | 'them' | 'note' | 'alert'; at?: number; tag?: string};
type Props = {
  messages: Msg[];
  start: number;
  stagger: number;
  typing: number;
  contact: string;
  contactSub: string;
  kicker: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeAt: number;
  background: string;
  paper: string;
  screen: string;
  ink: string;
  accent: string;
  mint: string;
  src: string;
  dim: number;
  phoneHeight: number;
  grain: number;
};

type Item = {kind: 'us' | 'them' | 'note' | 'alert' | 'typing-us' | 'typing-them'; lines: string[]; at: number; end: number; h: number; tag?: string};

const wrap = (text: string, fs: number, maxW: number) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && estWidth(next, fs, 'sans') * 0.97 > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
};

const SmsThread: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait, square} = useStage();
  const stacked = portrait || square;

  // ---- layout ---------------------------------------------------------------------------------------------
  const PH = h * (stacked ? (portrait ? 0.52 : 0.6) : p.phoneHeight);
  const PW = PH * 0.48;
  const phoneX = stacked ? w / 2 - PW / 2 : w * 0.72 - PW / 2;
  const phoneY0 = stacked ? h * (portrait ? 0.245 : 0.33) : h * 0.035;
  const rise = prog(frame, 0, 20, ease.out);
  const phoneY = phoneY0 + (1 - rise) * h * 0.25 + Math.sin(frame / 38) * 3 * u;
  const bez = PW * 0.035;
  const SW = PW - bez * 2;
  const SH = PH - bez * 2;
  const fs = SW * 0.063;
  const lh = fs * 1.32;
  const pad = fs * 0.62;
  const gap = fs * 0.55;
  const headerH = SH * 0.13;
  const inputH = SH * 0.085;
  const areaTop = headerH;
  const areaBottom = SH - inputH - gap;

  // ---- thread items ---------------------------------------------------------------------------------------
  const items: Item[] = [];
  let t = p.start;
  p.messages.forEach((m, i) => {
    const at = m.at ?? (i === 0 ? p.start : t + p.stagger);
    t = at;
    if ((m.from === 'us' || m.from === 'them') && p.typing > 0) {
      items.push({kind: m.from === 'us' ? 'typing-us' : 'typing-them', lines: [''], at: Math.max(0, at - p.typing), end: at, h: fs * 2.2});
    }
    if (m.from === 'note') items.push({kind: 'note', lines: [m.text], at, end: 1e9, h: fs * 1.9});
    else if (m.from === 'alert') items.push({kind: 'alert', lines: [m.text], at, end: 1e9, h: fs * 2.5});
    else {
      const lines = wrap(m.text, fs, SW * 0.7 - pad * 2);
      items.push({kind: m.from, lines, at, end: 1e9, h: lines.length * lh + pad * 1.5 + (m.tag ? fs * 1.15 : 0), tag: m.tag});
    }
  });
  const lastAt = items.reduce((a, it) => Math.max(a, it.at), 0);
  const eff = (it: Item) => {
    const inn = prog(frame, it.at, it.at + 7, ease.out);
    const out = it.end < 1e9 ? prog(frame, it.end - 1, it.end + 4, ease.inOut) : 0;
    return (it.h + gap) * inn * (1 - out);
  };
  const effs = items.map(eff);
  let acc = 0;
  const bottoms: number[] = new Array(items.length);
  for (let i = items.length - 1; i >= 0; i--) {
    bottoms[i] = areaBottom - acc;
    acc += effs[i];
  }

  const renderItem = (it: Item, i: number) => {
    if (effs[i] <= 0.01 && frame < it.at) return null;
    if (it.end < 1e9 && frame > it.end + 4) return null;
    const pop = frame < it.at ? 0 : springAt(frame, fps, it.at, 'pop');
    const fade = it.end < 1e9 ? 1 - prog(frame, it.end - 1, it.end + 3) : 1;
    const bottom = bottoms[i];
    const right = it.kind === 'us' || it.kind === 'typing-us';
    const base: React.CSSProperties = {position: 'absolute', top: bottom - it.h, opacity: Math.min(1, pop * 1.5) * fade};
    if (it.kind === 'note' || it.kind === 'alert') {
      const alert = it.kind === 'alert';
      return (
        <div key={i} style={{...base, left: 0, right: 0, height: it.h, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.85 + 0.15 * pop})`}}>
          <div
            style={{
              fontFamily: alert ? fonts.sans : fonts.mono,
              fontWeight: alert ? 600 : 400,
              fontSize: alert ? fs * 0.86 : fs * 0.7,
              letterSpacing: alert ? '0.01em' : '0.12em',
              textTransform: alert ? 'none' : 'uppercase',
              color: alert ? p.accent : 'rgba(14,38,33,0.55)',
              background: alert ? 'rgba(255,90,31,0.12)' : 'transparent',
              border: alert ? `${1.5 * u}px solid rgba(255,90,31,0.45)` : 'none',
              borderRadius: 999,
              padding: alert ? `${fs * 0.35}px ${fs * 0.9}px` : 0,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: fs * 0.4,
            }}
          >
            {alert && (
              <svg width={fs * 0.9} height={fs * 0.9} viewBox="0 0 24 24">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" fill={p.accent} />
                <path d="M15 3l6 6M21 3l-6 6" stroke={p.accent} strokeWidth={2.4} strokeLinecap="round" />
              </svg>
            )}
            {it.lines[0]}
          </div>
        </div>
      );
    }
    const typing = it.kind === 'typing-us' || it.kind === 'typing-them';
    const bg = right ? p.ink : '#FFFFFF';
    const fg = right ? p.paper : p.ink;
    const r = fs * 0.95;
    return (
      <div
        key={i}
        style={{
          ...base,
          [right ? 'right' : 'left']: fs * 0.7,
          display: 'flex',
          flexDirection: 'column',
          alignItems: right ? 'flex-end' : 'flex-start',
          transform: `scale(${0.6 + 0.4 * pop})`,
          transformOrigin: right ? '100% 100%' : '0% 100%',
        }}
      >
        <div
          style={{
            background: bg,
            color: fg,
            fontFamily: fonts.sans,
            fontWeight: 400,
            fontSize: fs,
            lineHeight: `${lh}px`,
            padding: `${pad * 0.75}px ${pad}px`,
            borderRadius: r,
            [right ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: fs * 0.25,
            boxShadow: right ? 'none' : `0 ${1 * u}px ${3 * u}px rgba(14,38,33,0.12), 0 0 0 ${1 * u}px rgba(14,38,33,0.08)`,
            whiteSpace: 'nowrap',
          }}
        >
          {typing ? (
            <div style={{display: 'flex', gap: fs * 0.3, height: lh, alignItems: 'center', padding: `0 ${fs * 0.1}px`}}>
              {[0, 1, 2].map((d) => (
                <div key={d} style={{width: fs * 0.42, height: fs * 0.42, borderRadius: 999, background: fg, opacity: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((frame - d * 4) / 3))}} />
              ))}
            </div>
          ) : (
            it.lines.map((l, k) => <div key={k}>{l}</div>)
          )}
        </div>
        {it.tag && !typing && (
          <div style={{fontFamily: fonts.mono, fontSize: fs * 0.58, letterSpacing: '0.08em', color: '#13784C', marginTop: fs * 0.3, textTransform: 'uppercase', whiteSpace: 'nowrap', fontWeight: 700}}>{it.tag}</div>
        )}
      </div>
    );
  };

  // ---- headline block -------------------------------------------------------------------------------------
  const colW = stacked ? w * 0.86 : phoneX - w * 0.08 - w * 0.06;
  const colX = stacked ? (w - colW) / 2 : w * 0.08;
  const titleLines = p.title.split('\n');
  const titleFs = Math.min(...titleLines.map((l) => fitSize(l, (stacked ? 84 : 120) * u, colW, 'sans')));
  const reveal = (d: number) => prog(frame, 6 + d, 22 + d, ease.out);
  const badgeAt = p.badgeAt >= 0 ? p.badgeAt : lastAt + 24;
  const bs = frame < badgeAt ? 0 : springAt(frame, fps, badgeAt, 'pop');
  const textBlock = (
    <div
      style={{
        position: 'absolute',
        left: colX,
        width: colW,
        top: stacked ? h * (portrait ? 0.055 : 0.04) : h * 0.4,
        transform: stacked ? undefined : 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: stacked ? 'center' : 'flex-start',
        textAlign: stacked ? 'center' : 'left',
      }}
    >
      {p.kicker && (
        <div style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: (stacked ? 26 : 24) * u, letterSpacing: '0.24em', color: p.accent, opacity: reveal(0), transform: `translateY(${(1 - reveal(0)) * 16 * u}px)`, marginBottom: 18 * u}}>
          {p.kicker}
        </div>
      )}
      {titleLines.map((l, i) => (
        <div key={i} style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: titleFs, lineHeight: 1.06, letterSpacing: '-0.02em', color: p.paper, whiteSpace: 'nowrap', opacity: reveal(4 + i * 4), transform: `translateY(${(1 - reveal(4 + i * 4)) * 26 * u}px)`}}>
          {l}
        </div>
      ))}
      {p.subtitle && (
        <div style={{fontFamily: fonts.sans, fontWeight: 400, fontSize: (stacked ? 34 : 32) * u, lineHeight: 1.35, color: p.paper, opacity: 0.72 * reveal(14), marginTop: 22 * u, maxWidth: colW}}>
          {p.subtitle}
        </div>
      )}
      {p.badge && (
        <div
          style={{
            marginTop: (stacked ? 22 : 34) * u,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14 * u,
            background: p.mint,
            color: '#062019',
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: (stacked ? 38 : 36) * u,
            padding: `${14 * u}px ${28 * u}px ${14 * u}px ${20 * u}px`,
            borderRadius: 999,
            whiteSpace: 'nowrap',
            opacity: clamp(bs * 2),
            transform: `scale(${lerp(0.4, 1, bs)})`,
            transformOrigin: stacked ? '50% 50%' : '0% 50%',
            boxShadow: `0 ${10 * u}px ${30 * u}px rgba(34,181,115,0.35)`,
          }}
        >
          <svg width={40 * u} height={40 * u} viewBox="0 0 24 24">
            <circle cx={12} cy={12} r={11} fill="#062019" />
            <path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke={p.mint} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {p.badge}
        </div>
      )}
    </div>
  );

  const initial = (p.contact.trim()[0] ?? '?').toUpperCase();
  return (
    <AbsoluteFill style={{background: p.background, overflow: 'hidden'}}>
      {p.src ? (
        <AbsoluteFill>
          <Img src={resolveSrc(p.src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.08 + frame * 0.0004})`, filter: `blur(${6 * u}px)`}} />
          <AbsoluteFill style={{background: p.background, opacity: p.dim}} />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{background: `radial-gradient(ellipse at ${stacked ? '50% 62%' : '74% 45%'}, rgba(34,181,115,0.22) 0%, rgba(14,38,33,0) 55%), radial-gradient(ellipse at 10% 100%, rgba(255,90,31,0.10) 0%, rgba(14,38,33,0) 45%)`}} />
      )}
      {textBlock}
      {/* phone */}
      <div style={{position: 'absolute', left: phoneX, top: phoneY, width: PW, height: PH, borderRadius: PW * 0.15, background: '#07140F', boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,0.45), inset 0 0 0 ${2 * u}px rgba(245,241,232,0.14)`}}>
        <div style={{position: 'absolute', left: bez, top: bez, width: SW, height: SH, borderRadius: PW * 0.12, background: p.screen, overflow: 'hidden'}}>
          {/* header */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: headerH, borderBottom: `${1 * u}px solid rgba(14,38,33,0.1)`, display: 'flex', alignItems: 'center', gap: fs * 0.6, padding: `${headerH * 0.28}px ${fs * 0.9}px 0`, background: 'rgba(255,255,255,0.55)'}}>
            <div style={{width: fs * 2, height: fs * 2, borderRadius: 999, background: p.accent, color: '#fff', fontFamily: fonts.sans, fontWeight: 800, fontSize: fs * 0.95, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{initial}</div>
            <div style={{display: 'flex', flexDirection: 'column', minWidth: 0}}>
              <div style={{fontFamily: fonts.sans, fontWeight: 600, fontSize: fs * 0.95, color: p.ink, whiteSpace: 'nowrap'}}>{p.contact}</div>
              <div style={{fontFamily: fonts.sans, fontWeight: 400, fontSize: fs * 0.7, color: 'rgba(14,38,33,0.55)', whiteSpace: 'nowrap', marginTop: fs * 0.1}}>{p.contactSub}</div>
            </div>
          </div>
          {/* notch */}
          <div style={{position: 'absolute', left: SW / 2 - SW * 0.15, top: SH * 0.012, width: SW * 0.3, height: SH * 0.028, borderRadius: 999, background: '#07140F'}} />
          {/* thread */}
          <div style={{position: 'absolute', left: 0, right: 0, top: areaTop, height: SH - areaTop, overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: -areaTop, height: SH}}>{items.map(renderItem)}</div>
          </div>
          {/* input bar */}
          <div style={{position: 'absolute', left: fs * 0.7, right: fs * 0.7, bottom: fs * 0.8, height: inputH * 0.72, borderRadius: 999, border: `${1.2 * u}px solid rgba(14,38,33,0.18)`, background: '#fff', display: 'flex', alignItems: 'center', paddingLeft: fs * 0.8, fontFamily: fonts.sans, fontSize: fs * 0.8, color: 'rgba(14,38,33,0.35)'}}>
            Text message
          </div>
        </div>
      </div>
      {p.grain > 0 && <FilmGrain opacity={p.grain} />}
    </AbsoluteFill>
  );
};

export const smsThread = defineMotion<Props>({
  id: 'sms-thread',
  title: 'SMS thread on a phone',
  category: 'ui',
  description: 'A phone rises in beside a headline; a missed-call alert, typing dots and SMS bubbles pop in one by one and the thread scrolls like a real chat, with day notes and a verdict badge springing in under the headline.',
  source: ['original (Leadlatch explainer); bubble pop timing after video12 chat-bubble-pop'],
  useFor: 'Product explainers that show an automated text conversation, follow-up sequences ("Day 2 / Day 5"), booking confirmations.',
  durationInFrames: 210,
  defaultProps: {
    messages: [
      {text: 'Missed call · 2:14 pm', from: 'alert'},
      {text: 'Sorry we missed you! What do you need help with?', from: 'us', tag: 'Sent automatically'},
      {text: "Boiler's leaking, can you come Thursday?", from: 'them'},
      {text: 'Booked: Thu 9am. See you then!', from: 'us'},
    ],
    start: 14,
    stagger: 34,
    typing: 14,
    contact: 'New enquiry',
    contactSub: 'Mobile · just now',
    kicker: 'MISSED CALL TEXT-BACK',
    title: 'Texts back\nin seconds',
    subtitle: '',
    badge: 'Booked: Thu 9am',
    badgeAt: -1,
    background: '#0E2621',
    paper: '#F5F1E8',
    screen: '#F5F1E8',
    ink: '#0E2621',
    accent: '#FF5A1F',
    mint: '#22B573',
    src: '',
    dim: 0.78,
    phoneHeight: 0.72,
    grain: 0.05,
  },
  propDocs: {
    messages: '[{text, from, at?, tag?}] from = us (right, ink bubble) | them (left, white bubble) | note (small centred "DAY 2" divider) | alert (orange missed-call pill); tag = small mint line under a bubble',
    start: 'frame of the first message',
    stagger: 'frames between messages when `at` is not given',
    typing: 'frames of typing dots before each us/them bubble (0 = none)',
    contact: 'name in the thread header (its first letter fills the avatar)',
    contactSub: 'small line under the contact name',
    kicker: 'small tracked mono line above the headline ("" = none)',
    title: 'headline beside / above the phone; \\n splits lines',
    subtitle: 'body line under the headline ("" = none)',
    badge: 'mint verdict pill that springs in under the headline ("" = none)',
    badgeAt: 'frame of the badge (-1 = 24 frames after the last message)',
    background: 'scene colour',
    paper: 'headline colour and text colour in "us" bubbles',
    screen: 'phone screen colour',
    ink: '"us" bubble colour and dark text',
    accent: 'kicker, avatar and alert colour',
    mint: 'badge and tag colour',
    src: 'optional public/ image shown blurred and dimmed behind',
    dim: 'how strongly the background colour covers `src` (0..1)',
    phoneHeight: 'landscape phone height as a fraction of frame height',
    grain: 'film grain opacity',
  },
  component: SmsThread,
  tags: ['sms', 'chat', 'phone', 'messages', 'ui', 'product', 'explainer'],
});
