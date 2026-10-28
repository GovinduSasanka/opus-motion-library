import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  Win,
  backOut,
  bgOf,
  blink,
  hash01,
  isDark,
  mixHex,
  monoFont,
  onFill,
  outCubic,
  sansFont,
  seg,
  typed,
  withAlpha,
} from '../../core/dev-explainer-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * An AI assistant chat: the prompt types into the input bar and is sent, a "thinking" indicator bounces, then
 * the answer streams in token by token (variable rhythm, soft fade per token, **bold** and `code` styling)
 * behind a blinking block cursor, ending with a token / time readout. Generic assistant — no product names.
 */
type Props = {
  userName: string;
  assistantName: string;
  prompt: string;
  answer: string;
  placeholder: string;
  tokensPerSecond: number;
  showStats: boolean;
  thinkingFrames: number;
  speed: number;
  startAt: number;
  background: string;
  panel: string;
  ink: string;
  accent: string;
  accent2: string;
  fontFamily: string;
};

type Tk = {text: string; style: 'plain' | 'bold' | 'code'};

const parse = (src: string): Tk[] => {
  const out: Tk[] = [];
  const parts = src.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter((s) => s !== '');
  parts.forEach((part) => {
    let style: Tk['style'] = 'plain';
    let txt = part;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      style = 'bold';
      txt = part.slice(2, -2);
    } else if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      style = 'code';
      txt = part.slice(1, -1);
    }
    const chunks = txt.match(/\n+|[^\s]+[ \t]*|[ \t]+/g) ?? [];
    chunks.forEach((c) => out.push({text: c, style}));
  });
  return out;
};

const AiChatStreaming: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = (frame - p.startAt) * Math.max(0.1, p.speed);
  const sans = sansFont(p.fontFamily);
  const mono = monoFont('');
  const dark = isDark(p.panel);

  const winW = portrait ? w * 0.94 : Math.min(w * 0.62, 1200 * u);
  const winH = portrait ? h * 0.82 : h * 0.86;
  const winX = (w - winW) / 2;
  const winY = (h - winH) / 2;
  const head = 62 * u;
  const inputH = (portrait ? 118 : 106) * u;
  const pad = (portrait ? 30 : 34) * u;

  // timeline
  const typeStart = 16;
  const typeCps = 36;
  const typeFrames = (p.prompt.length / typeCps) * 30;
  const sendAt = typeStart + typeFrames + 10;
  const thinkStart = sendAt + 12;
  const streamStart = thinkStart + Math.max(8, p.thinkingFrames);
  const tokens = parse(p.answer);
  const base = 30 / Math.max(2, p.tokensPerSecond);
  const times: number[] = [];
  let acc = 0;
  tokens.forEach((tk, i) => {
    times.push(acc);
    const weight = Math.max(0.5, Math.min(2.2, tk.text.trim().length / 4));
    acc += base * weight * (0.45 + hash01(i * 3 + 11) * 1.1);
    if (/[.!?:]\s*$/.test(tk.text)) acc += base * 2.5; // a breath at sentence ends
  });
  const doneAt = streamStart + acc;
  const revealed = tokens.filter((_, i) => t >= streamStart + times[i]).length;
  const streaming = t >= streamStart && revealed < tokens.length;
  const finished = revealed >= tokens.length && t >= streamStart;

  const winIn = outCubic(seg(t, 0, 16));
  const typedTxt = t < sendAt ? typed(p.prompt, t, typeStart, typeCps) : '';
  const sendK = seg(t, sendAt - 2, sendAt + 10);
  const bubbleK = backOut(seg(t, sendAt + 2, sendAt + 16), 1.5);
  const thinkK = outCubic(seg(t, thinkStart, thinkStart + 8)) * (1 - seg(t, streamStart - 2, streamStart + 2));
  const answerK = outCubic(seg(t, streamStart - 2, streamStart + 6));

  // font size from answer length so the text always fits the message area
  const innerW = winW - pad * 2;
  const avatar = (portrait ? 62 : 54) * u;
  const textW = innerW - avatar - 24 * u;
  const availH = winH - head - inputH - pad * 2 - (portrait ? 190 : 170) * u - 70 * u;
  const chars = Math.max(40, p.answer.replace(/\*\*|`/g, '').length + tokens.filter((x) => x.text.includes('\n')).length * 40);
  const fs = Math.max(19 * u, Math.min((portrait ? 46 : 40) * u, Math.sqrt((textW * availH) / (chars * 0.5 * 1.62))));
  const userFs = Math.min(fs * 1.0, (portrait ? 40 : 36) * u);
  const secs = Math.max(0.1, (doneAt - streamStart) / 30);

  const tokStyle = (tk: Tk): React.CSSProperties =>
    tk.style === 'bold'
      ? {fontWeight: 800}
      : tk.style === 'code'
        ? {fontFamily: mono, fontSize: '0.88em', background: withAlpha(p.accent, dark ? 0.2 : 0.14), color: dark ? mixHex(p.accent, '#FFFFFF', 0.4) : mixHex(p.accent, '#000000', 0.3), padding: `0 ${5 * u}px`, borderRadius: 6 * u}
        : {};

  const renderTok = (tk: Tk, i: number) => {
    const age = t - (streamStart + times[i]);
    const k = Math.min(1, Math.max(0, age / 5));
    return (
      <span key={i} style={{...tokStyle(tk), opacity: k, whiteSpace: 'pre-wrap'}}>
        {tk.text}
      </span>
    );
  };

  const cursor = (
    <span style={{display: 'inline-block', width: fs * 0.52, height: fs * 1.05, marginLeft: 2 * u, verticalAlign: '-0.14em', background: p.accent, opacity: streaming ? 1 : blink(frame, 18), borderRadius: 2 * u}} />
  );

  return (
    <AbsoluteFill style={{background: bgOf(p.background), overflow: 'hidden'}}>
      <Win x={winX} y={winY} w={winW} h={winH} u={u} title={p.assistantName} panel={p.panel} ink={p.ink} opacity={winIn} dy={(1 - winIn) * 30 * u} fontFamily={sans} headerRight={null}>
        {/* messages */}
        <div style={{position: 'absolute', left: pad, right: pad, top: pad, bottom: inputH + pad * 0.5, fontFamily: sans, color: p.ink}}>
          {/* user bubble */}
          {t >= sendAt ? (
            <div style={{display: 'flex', justifyContent: 'flex-end', opacity: Math.min(1, bubbleK), transform: `translateY(${(1 - bubbleK) * 70 * u}px) scale(${0.9 + 0.1 * bubbleK})`, transformOrigin: '100% 100%'}}>
              <div style={{maxWidth: '82%', padding: `${16 * u}px ${24 * u}px`, borderRadius: `${26 * u}px ${26 * u}px ${6 * u}px ${26 * u}px`, background: p.accent, color: onFill(p.accent), fontSize: userFs, fontWeight: 600, lineHeight: 1.4}}>{p.prompt}</div>
            </div>
          ) : null}
          {/* thinking */}
          {thinkK > 0.01 ? (
            <div style={{display: 'flex', alignItems: 'center', gap: 20 * u, marginTop: 30 * u, opacity: thinkK}}>
              <Avatar size={avatar} color={p.accent2} frame={frame} />
              <div style={{display: 'flex', gap: 9 * u, padding: `${16 * u}px ${22 * u}px`, borderRadius: 999, background: withAlpha(p.ink, dark ? 0.08 : 0.06)}}>
                {[0, 1, 2].map((d) => (
                  <div key={d} style={{width: 13 * u, height: 13 * u, borderRadius: '50%', background: withAlpha(p.ink, 0.55), transform: `translateY(${-Math.abs(Math.sin((frame - d * 4) * 0.21)) * 9 * u}px)`}} />
                ))}
              </div>
            </div>
          ) : null}
          {/* answer */}
          {answerK > 0.01 ? (
            <div style={{display: 'flex', gap: 24 * u, marginTop: 30 * u, opacity: answerK}}>
              <div style={{flex: '0 0 auto'}}>
                <Avatar size={avatar} color={p.accent2} frame={frame} />
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontSize: 21 * u, fontWeight: 700, color: withAlpha(p.ink, 0.55), marginBottom: 8 * u, letterSpacing: 0.4 * u}}>{p.assistantName}</div>
                <div style={{fontSize: fs, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                  {tokens.slice(0, revealed).map(renderTok)}
                  {!finished || t < doneAt + 40 ? cursor : null}
                  {tokens.slice(revealed).map((tk, i) => (
                    <span key={i} style={{...tokStyle(tk), opacity: 0, whiteSpace: 'pre-wrap'}}>
                      {tk.text}
                    </span>
                  ))}
                </div>
                {p.showStats && finished ? (
                  <div style={{marginTop: 18 * u, fontFamily: mono, fontSize: 21 * u, color: withAlpha(p.ink, 0.5), opacity: outCubic(seg(t, doneAt, doneAt + 10))}}>{`${revealed} tokens · ${secs.toFixed(1)} s`}</div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        {/* stop pill while streaming */}
        {streaming || thinkK > 0.5 ? (
          <div style={{position: 'absolute', left: 0, right: 0, bottom: inputH + 22 * u, display: 'flex', justifyContent: 'center', opacity: 0.9}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12 * u, padding: `${9 * u}px ${20 * u}px`, borderRadius: 999, border: `${1.5 * u}px solid ${withAlpha(p.ink, 0.25)}`, fontFamily: sans, fontSize: 22 * u, color: withAlpha(p.ink, 0.7), fontWeight: 600}}>
              <div style={{width: 14 * u, height: 14 * u, borderRadius: 3 * u, background: withAlpha(p.ink, 0.7)}} />
              Stop generating
            </div>
          </div>
        ) : null}
        {/* input bar */}
        <div style={{position: 'absolute', left: pad, right: pad, bottom: pad * 0.7, height: inputH * 0.72, borderRadius: inputH * 0.36, background: withAlpha(p.ink, dark ? 0.07 : 0.05), border: `${2 * u}px solid ${withAlpha(t < sendAt ? p.accent : p.ink, t < sendAt ? 0.7 : 0.14)}`, display: 'flex', alignItems: 'center', padding: `0 ${14 * u}px 0 ${28 * u}px`, fontFamily: sans}}>
          <div style={{flex: 1, fontSize: (portrait ? 28 : 26) * u, color: typedTxt ? p.ink : withAlpha(p.ink, 0.42), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'clip'}}>
            {typedTxt || (t < typeStart ? p.placeholder : t >= sendAt ? p.placeholder : '')}
            {t < sendAt && t >= typeStart - 4 ? <span style={{display: 'inline-block', width: 2.5 * u, height: 30 * u, background: p.accent, marginLeft: 2 * u, verticalAlign: '-0.2em', opacity: blink(frame, 16)}} /> : null}
          </div>
          <div style={{width: inputH * 0.5, height: inputH * 0.5, borderRadius: '50%', background: typedTxt || t >= sendAt ? p.accent : withAlpha(p.ink, 0.18), display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - 0.18 * Math.sin(sendK * Math.PI)})`}}>
            <svg width={inputH * 0.26} height={inputH * 0.26} viewBox="0 0 24 24"><path d="M12 19 V5 M6 11 L12 5 L18 11" fill="none" stroke={onFill(p.accent)} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
      </Win>
    </AbsoluteFill>
  );
};

/** generic assistant avatar: a rounded badge with a spark */
const Avatar: React.FC<{size: number; color: string; frame: number}> = ({size, color, frame}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.32, background: `linear-gradient(135deg, ${color}, ${mixHex(color, '#7B5CFF', 0.55)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 ${size * 0.4}px ${withAlpha(color, 0.35)}`}}>
    <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" style={{transform: `rotate(${Math.sin(frame * 0.05) * 8}deg)`}}>
      <path d="M12 2 C12.6 7.5 16.5 11.4 22 12 C16.5 12.6 12.6 16.5 12 22 C11.4 16.5 7.5 12.6 2 12 C7.5 11.4 11.4 7.5 12 2 Z" fill="#FFFFFF" />
    </svg>
  </div>
);

export const aiChatStreaming = defineMotion<Props>({
  id: 'ai-chat-streaming',
  title: 'AI chat streaming',
  category: 'ui',
  description:
    'A generic AI assistant chat: the prompt types into the input bar and sends as a bubble, a thinking indicator bounces, then the answer streams in token by token with a block cursor, **bold** and `code` styling, a stop pill and a token / time readout.',
  source: ['original (generic AI explainer)'],
  useFor: 'AI assistant / copilot / chatbot promos, "how LLMs generate text" explainers, prompt-and-response demos, support-bot and agent product videos. Swap prompt, answer and names for any product.',
  durationInFrames: 330,
  defaultProps: {
    userName: 'You',
    assistantName: 'Assistant',
    prompt: 'Explain how a hash table works in two sentences.',
    answer:
      'A hash table stores **key–value pairs** in an array of buckets. A hash function turns each key into an index, so the value can be found again in `O(1)` time on average.\n\nWhen two keys land in the same bucket, it resolves the collision by chaining or probing.',
    placeholder: 'Message the assistant…',
    tokensPerSecond: 24,
    showStats: true,
    thinkingFrames: 26,
    speed: 1,
    startAt: 0,
    background: '#0C0F16',
    panel: '#151A25',
    ink: '#EAEFF8',
    accent: '#4C8DFF',
    accent2: '#B07CFF',
    fontFamily: '',
  },
  propDocs: {
    userName: 'name of the person (reserved label)',
    assistantName: 'assistant name shown in the header and over the answer',
    prompt: 'the user message (typed into the input bar, then sent)',
    answer: 'the assistant reply; use **bold**, `code` and \\n for line breaks',
    placeholder: 'input bar placeholder text',
    tokensPerSecond: 'average streaming speed',
    showStats: 'show the token / time readout when the answer ends',
    thinkingFrames: 'frames of the thinking indicator before the first token',
    speed: 'timing multiplier',
    startAt: 'frame the chat starts',
    background: "page colour or 'transparent'",
    panel: 'chat window colour',
    ink: 'text colour',
    accent: 'user bubble / cursor colour',
    accent2: 'assistant avatar colour',
    fontFamily: 'text font override (empty = Inter)',
  },
  component: AiChatStreaming,
  tags: ['ai', 'chat', 'chatbot', 'assistant', 'llm', 'streaming', 'tokens', 'prompt', 'gpt', 'copilot', 'conversation', 'typing', 'generative', 'agent', 'ui'],
});
