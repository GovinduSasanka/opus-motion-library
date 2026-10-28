import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {backOut, easeIO, easeOut3, sseg, withAlpha} from '../../core/r2-s1-kit';
import {avatarColor, initials, wrapText} from '../../core/r3-social';
import {estWidth} from '../../core/text-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {bgCss, fam, isDark, surface, TAU} from '../../core/ui-loop-kit';

/**
 * A chat window where replies arrive with a bouncing typing indicator: for each incoming message the three dots
 * appear in a bubble, bounce for `typingFrames`, then morph into the message with a small pop; your own messages
 * slide in from the right. The thread scrolls when it fills the window and the whole conversation clears at the end
 * of the loop so the clip repeats seamlessly. Works for support bots, AI assistants and messaging demos.
 */
type Msg = {text: string; from: 'them' | 'me'};
type Props = {
  messages: Msg[];
  contact: string;
  status: string;
  typingFrames: number;
  gap: number;
  showHeader: boolean;
  showTyping: boolean;
  background: string;
  windowColor: string;
  bubbleColor: string;
  ink: string;
  accent: string;
  fontFamily: string;
};

const DEFAULT_MSGS: Msg[] = [
  {from: 'me', text: 'Hi! Can you help me change my delivery address?'},
  {from: 'them', text: 'Of course! Which order is it for?'},
  {from: 'me', text: 'Order #4821, it ships tomorrow.'},
  {from: 'them', text: 'Done, it will now arrive at your new address. Anything else?'},
];

const ChatTypingLoop: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: T, portrait} = useStage();
  const msgs = (P.messages && P.messages.length ? P.messages : DEFAULT_MSGS).slice(0, 8);
  const font = fam(P.fontFamily);
  const dark = isDark(surface(P.background, '#ffffff'));
  const winCol = P.windowColor === 'auto' ? (dark ? '#151A28' : '#FFFFFF') : P.windowColor;
  const themCol = P.bubbleColor === 'auto' ? (dark ? '#262D42' : '#EDEFF5') : P.bubbleColor;
  const S = (portrait ? 1.5 : 1.15) * u;
  const ww = portrait ? w * 0.92 : Math.min(w * 0.55, 860 * S);
  const wh = portrait ? h * 0.8 : h * 0.88;
  const x0 = (w - ww) / 2;
  const y0 = (h - wh) / 2;
  const headH = P.showHeader ? 92 * S : 0;
  const padX = 28 * S;
  const fs = 30 * S;
  const lineH = 1.32;
  const bPadX = 24 * S;
  const bPadY = 17 * S;
  const maxBubW = ww * 0.68;
  const gapY = 16 * S;
  const bodyTop = y0 + headH + 18 * S;
  const bodyH = wh - headH - 36 * S;

  // timeline: when does each message (and its typing phase) happen?
  const k = T / 270;
  const typeF = Math.max(8, P.typingFrames) * k;
  const gapF = Math.max(4, P.gap) * k;
  const startAt = 20 * k;
  const endAt = T - 40 * k; // conversation clears from here
  type Slot = {typeFrom: number; shownAt: number; m: Msg; lines: string[]; bw: number; bh: number};
  let t = startAt;
  const raw = msgs.map((m) => {
    const lines = wrapText(m.text, fs, maxBubW - bPadX * 2, 'sans', 6);
    const bw = Math.min(maxBubW, Math.max(...lines.map((l) => estWidth(l, fs, 'sans')), 60 * S) * 1.04 + bPadX * 2);
    const bh = lines.length * fs * lineH + bPadY * 2;
    const theirs = m.from === 'them';
    const typeFrom = t;
    const shownAt = theirs && P.showTyping ? t + typeF : t + 6 * k;
    t = shownAt + gapF;
    return {typeFrom, shownAt, m, lines, bw, bh};
  });
  const span = t - gapF + 36 * k; // last message + hold
  const comp = span > endAt ? (endAt - startAt) / (span - startAt) : 1;
  const slots: Slot[] = raw.map((s) => ({...s, typeFrom: startAt + (s.typeFrom - startAt) * comp, shownAt: startAt + (s.shownAt - startAt) * comp}));

  const typingH = 56 * S;
  const typingW = 110 * S;
  // heights and y positions (content flow), with typing slot morphing to the final size
  let yy = 0;
  const layout = slots.map((s, i) => {
    const theirs = s.m.from === 'them';
    const hasTyping = theirs && P.showTyping;
    const typingOn = hasTyping && frame >= s.typeFrom - 2;
    const grow = hasTyping ? easeOut3(sseg(frame, s.shownAt - 2 * k, s.shownAt + 8 * k)) : 1;
    const born = hasTyping ? sseg(frame, s.typeFrom, s.typeFrom + 8 * k) : sseg(frame, s.shownAt - 6 * k, s.shownAt + 6 * k);
    const present = hasTyping ? typingOn : frame >= s.shownAt - 6 * k;
    const bh = hasTyping ? typingH + (s.bh - typingH) * grow : s.bh;
    const bw = hasTyping ? typingW + (s.bw - typingW) * grow : s.bw;
    const y = yy;
    if (present) yy += (bh + gapY) * easeOut3(Math.max(born, 0.001));
    return {s, i, theirs, hasTyping, present, bh, bw, y, grow, born};
  });
  const contentH = yy;
  const scroll = Math.max(0, contentH - bodyH);
  const clear = easeIO(sseg(frame, endAt, endAt + 22 * k));

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      <div
        style={{
          position: 'absolute',
          left: x0,
          top: y0,
          width: ww,
          height: wh,
          borderRadius: 34 * S,
          background: winCol,
          boxShadow: dark ? `0 ${24 * S}px ${70 * S}px rgba(0,0,0,0.5), 0 0 0 ${1.5 * u}px rgba(255,255,255,0.07)` : `0 ${22 * S}px ${64 * S}px rgba(24,32,60,0.15), 0 0 0 ${1.5 * u}px rgba(24,32,60,0.05)`,
          overflow: 'hidden',
          fontFamily: font,
        }}
      >
        {P.showHeader && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: headH, borderBottom: `${1.5 * u}px solid ${withAlpha(P.ink, 0.08)}`, display: 'flex', alignItems: 'center', padding: `0 ${padX}px`, gap: 16 * S, background: winCol, zIndex: 5}}>
            <div style={{width: 52 * S, height: 52 * S, borderRadius: '50%', background: avatarColor(P.contact), color: '#fff', fontWeight: 800, fontSize: 21 * S, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
              {initials(P.contact)}
              <div style={{position: 'absolute', right: -1 * S, bottom: -1 * S, width: 15 * S, height: 15 * S, borderRadius: '50%', background: '#2FC273', border: `${3 * S}px solid ${winCol}`}} />
            </div>
            <div>
              <div style={{fontSize: 27 * S, fontWeight: 800, color: P.ink, lineHeight: 1.1}}>{P.contact}</div>
              <div style={{fontSize: 19 * S, color: withAlpha(P.ink, 0.55), marginTop: 3 * S}}>{P.status}</div>
            </div>
          </div>
        )}
      </div>
      <div style={{position: 'absolute', left: x0, top: bodyTop, width: ww, height: bodyH, overflow: 'hidden', fontFamily: font}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: ww, transform: `translateY(${-scroll}px)`, opacity: 1 - clear}}>
          {layout.map(({s, i, theirs, hasTyping, present, bh, bw, y, grow, born}) => {
            if (!present) return null;
            const showText = !hasTyping || grow > 0.35;
            const showDots = hasTyping && grow < 0.65;
            const enter = easeOut3(born);
            const pop = hasTyping ? 1 + 0.05 * Math.sin(Math.PI * sseg(grow, 0, 1)) : backOut(sseg(frame, s.shownAt - 6 * k, s.shownAt + 8 * k), 1.6);
            const bx = theirs ? padX : ww - padX - bw;
            const col = theirs ? themCol : P.accent;
            const fg = theirs ? P.ink : '#ffffff';
            const rad = 26 * S;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: bx,
                  top: y,
                  width: bw,
                  height: bh,
                  background: col,
                  color: fg,
                  borderRadius: rad,
                  borderBottomLeftRadius: theirs ? 8 * S : rad,
                  borderBottomRightRadius: theirs ? rad : 8 * S,
                  opacity: enter,
                  transform: `translate(${theirs ? (1 - enter) * -30 * S : (1 - enter) * 40 * S}px, ${(1 - enter) * 20 * S}px) scale(${pop})`,
                  transformOrigin: theirs ? 'left bottom' : 'right bottom',
                  fontSize: fs,
                  lineHeight: lineH,
                  fontWeight: 400,
                }}
              >
                {showDots && (
                  <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 * S, opacity: 1 - sseg(grow, 0.3, 0.65)}}>
                    {[0, 1, 2].map((d) => {
                      const ph = (frame - s.typeFrom) / (24 * k) - d * 0.16;
                      const bounce = Math.max(0, Math.sin(ph * TAU)); // hop, then rest
                      return <div key={d} style={{width: 12 * S, height: 12 * S, borderRadius: '50%', background: withAlpha(P.ink, 0.28 + 0.4 * bounce), transform: `translateY(${-9 * S * bounce}px)`}} />;
                    })}
                  </div>
                )}
                {showText && (
                  <div style={{position: 'absolute', left: bPadX, top: bPadY, right: bPadX, opacity: hasTyping ? sseg(grow, 0.35, 0.85) : 1, whiteSpace: 'nowrap'}}>
                    {s.lines.map((l, li) => (
                      <div key={li}>{l}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const typingIndicatorChat = defineMotion<Props>({
  id: 'typing-indicator-chat',
  title: 'Chat with typing indicator',
  category: 'ui',
  description: 'A chat window: replies appear as bouncing typing dots that morph into the message, your messages slide in, the thread scrolls and clears at the end — a seamless loop. Messages are a prop.',
  source: ['original'],
  useFor: 'Support-bot, AI-assistant and messaging product demos, "talk to us" website sections, onboarding conversations, any "someone is typing…" beat.',
  durationInFrames: 270,
  defaultProps: {
    messages: DEFAULT_MSGS,
    contact: 'Support',
    status: 'Online',
    typingFrames: 40,
    gap: 16,
    showHeader: true,
    showTyping: true,
    background: '#E9EDF6',
    windowColor: 'auto',
    bubbleColor: 'auto',
    ink: '#1B2233',
    accent: '#4F6BFF',
    fontFamily: 'auto',
  },
  propDocs: {
    messages: 'array of {from: "me" | "them", text} (up to 8); "them" messages get a typing indicator first',
    contact: 'name in the chat header (also colours the avatar)',
    status: 'small line under the name ("Online", "typing…")',
    typingFrames: 'frames the typing dots bounce before each reply',
    gap: 'frames of pause between messages',
    showHeader: 'show the contact header',
    showTyping: 'show the typing indicator before incoming messages',
    background: 'frame colour, or "transparent" to overlay content',
    windowColor: 'chat window colour, or "auto"',
    bubbleColor: 'incoming bubble colour, or "auto"',
    ink: 'text colour',
    accent: 'your bubble colour',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: ChatTypingLoop,
  tags: ['chat', 'typing', 'typing-indicator', 'messages', 'bubbles', 'chatbot', 'support', 'assistant', 'ui', 'app', 'website', 'loop', 'messenger', 'conversation'],
});
