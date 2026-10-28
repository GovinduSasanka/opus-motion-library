import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rgba, shade, typeSchedule, visibleChars} from '../../core/r2-pr2-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A search / prompt bar grows from a dot, a caret types the query (2-3 frames per character with jitter), matching
 * suggestions stagger in and filter as you type, Enter presses the bar (scale 0.97 + glow), the list collapses and a
 * result card streams its answer in.
 */
type Props = {
  placeholder: string;
  query: string;
  suggestions: string[];
  resultTitle: string;
  resultBody: string;
  resultTags: string[];
  resultImage: string;
  theme: string;
  accent: string;
  background: string;
  typeStart: number;
  charFrames: number;
  enterGap: number;
};

const norm = (s: string) => s.toLowerCase();
const matches = (title: string, q: string) => {
  const t = norm(title);
  const toks = norm(q).split(/\s+/).filter(Boolean);
  return toks.every((k) => t.includes(k));
};

const Highlight: React.FC<{text: string; q: string; color: string}> = ({text, q, color}) => {
  const toks = norm(q).split(/\s+/).filter(Boolean);
  if (!toks.length) return <>{text}</>;
  const lower = norm(text);
  const mark = new Array(text.length).fill(false);
  toks.forEach((k) => {
    const i = lower.indexOf(k);
    if (i >= 0) for (let j = i; j < i + k.length; j++) mark[j] = true;
  });
  const out: React.ReactNode[] = [];
  let run = '';
  let cur = false;
  const flush = (key: number) => {
    if (run) out.push(cur ? <span key={key} style={{color, fontWeight: 700}}>{run}</span> : <span key={key}>{run}</span>);
    run = '';
  };
  for (let i = 0; i < text.length; i++) {
    if (mark[i] !== cur) {
      flush(i);
      cur = mark[i];
    }
    run += text[i];
  }
  flush(text.length);
  return <>{out}</>;
};

const Glyph: React.FC<{kind: 'search' | 'doc' | 'spark'; size: number; color: string}> = ({kind, size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {kind === 'search' && (
      <>
        <circle cx={11} cy={11} r={6.5} />
        <path d="M16 16l4.5 4.5" />
      </>
    )}
    {kind === 'doc' && (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M9 12h6M9 16h6" />
      </>
    )}
    {kind === 'spark' && <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z" />}
  </svg>
);

const CommandPalette: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u: u0, portrait} = useStage();
  const u = u0 * 1.2;
  const dark = P.theme !== 'light';
  const ink = dark ? '#f1f3fb' : '#141a2e';
  const dim = dark ? 'rgba(241,243,251,0.5)' : 'rgba(20,26,46,0.48)';
  const barBg = dark ? 'rgba(27,30,42,0.94)' : 'rgba(255,255,255,0.97)';
  const line = dark ? 'rgba(255,255,255,0.1)' : 'rgba(20,26,60,0.1)';
  const pageBg = P.background || (dark ? '#0a0c14' : '#eceff8');

  const barW = portrait ? w * 0.88 : Math.min(w * 0.62, 980 * u);
  const barH = 92 * u;
  const barX = (w - barW) / 2;
  const barY = portrait ? h * 0.24 : h * 0.24;

  const sched = typeSchedule(P.query, P.typeStart, P.charFrames, 1, 3);
  const typedEnd = sched.length ? sched[sched.length - 1] : P.typeStart;
  const enterAt = typedEnd + P.enterGap;
  const n = visibleChars(sched, frame);
  const typed = P.query.slice(0, n);

  // bar growth: dot -> pill
  const grow = ease.out(prog(frame, 4, 26, (t) => t));
  const dotIn = ease.back(prog(frame, 0, 8, (t) => t));
  const curW = 18 * u + (barW - 18 * u) * grow;
  const curH = 18 * u + (barH - 18 * u) * ease.out(prog(frame, 6, 24, (t) => t));
  const phA = ease.out(prog(frame, 22, 34, (t) => t));
  // enter press
  const ep = frame - enterAt;
  const press = ep >= 0 && ep < 6 ? (ep < 2 ? 1 - 0.03 * (ep / 2) : 0.97 + 0.03 * ((ep - 2) / 4)) : 1;
  const glow = ep >= 0 ? Math.exp(-ep / 16) : 0;
  const breathe = 0.5 + 0.5 * Math.sin(frame / 22);

  // suggestions
  const listStart = (sched[0] ?? P.typeStart) + 1;
  const collapse = ease.inOut(prog(frame, enterAt + 1, enterAt + 12, (t) => t));
  const rowH = 62 * u;
  const items = P.suggestions.slice(0, 6).map((title, i) => {
    let failAt = Infinity;
    for (let c = 1; c <= P.query.length; c++) {
      if (!matches(title, P.query.slice(0, c))) {
        failAt = sched[c - 1];
        break;
      }
    }
    const inP = ease.out(prog(frame, listStart + i * 3, listStart + i * 3 + 9, (t) => t));
    const outP = ease.inOut(prog(frame, failAt, failAt + 8, (t) => t));
    const k = inP * (1 - outP) * (1 - collapse);
    return {title, k, matched: failAt === Infinity};
  });
  const firstMatch = items.findIndex((it) => it.matched);
  const showList = frame >= listStart && collapse < 1;

  // result card
  const resAt = enterAt + 10;
  const resIn = ease.out(prog(frame, resAt, resAt + 16, (t) => t));
  const bodySched = typeSchedule(P.resultBody, resAt + 14, 0.9, 0.4, 7);
  const bs0 = resAt + 14;
  const bn = visibleChars(bodySched, bs0 + (frame - bs0) * 2.4);
  const bodyEnd = bs0 + ((bodySched[bodySched.length - 1] ?? bs0) - bs0) / 2.4;
  const tagsA = (i: number) => ease.out(prog(frame, bodyEnd - 8 + i * 4, bodyEnd + i * 4, (t) => t));
  const caretOn = Math.floor(frame / 8) % 2 === 0;
  const typing = n < P.query.length;
  const fs = 34 * u;
  const listH = items.reduce((a, it) => a + rowH * it.k, 0);
  const cardTop = barY + barH + 22 * u;

  return (
    <AbsoluteFill style={{background: dark ? `radial-gradient(90% 80% at 50% 25%, ${shade(pageBg, 0.1)}, ${pageBg} 70%)` : `radial-gradient(90% 80% at 50% 25%, #ffffff, ${pageBg} 75%)`, fontFamily: fonts.sans}}>
      {/* bar */}
      <div
        style={{
          position: 'absolute',
          left: barX + (barW - curW) / 2,
          top: barY + (barH - curH) / 2,
          width: curW,
          height: curH,
          transform: `scale(${press * dotIn})`,
          borderRadius: curH / 2,
          background: grow < 0.05 ? P.accent : barBg,
          border: `${1.4 * u}px solid ${line}`,
          boxShadow: `0 ${28 * u}px ${70 * u}px rgba(0,0,0,${dark ? 0.5 : 0.16}), 0 0 ${(26 + 60 * glow) * u}px ${rgba(P.accent, 0.12 + 0.5 * glow + 0.06 * breathe * (frame > enterAt + 30 ? 1 : 0))}`,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          opacity: Math.min(1, frame / 3),
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 16 * u, padding: `0 ${30 * u}px`, width: barW, flex: 'none', marginLeft: (curW - barW) / 2 * 0, opacity: phA}}>
          <Glyph kind="search" size={34 * u} color={dim} />
          <div style={{flex: 1, fontSize: fs, color: ink, whiteSpace: 'nowrap', letterSpacing: -0.2 * u, display: 'flex', alignItems: 'center'}}>
            {n === 0 && caretOn && frame > 30 && <span style={{display: 'inline-block', width: 3 * u, height: fs * 1.05, marginRight: 4 * u, background: P.accent, borderRadius: 2 * u}} />}
            {n === 0 ? <span style={{color: dim}}>{P.placeholder}</span> : <span>{typed}</span>}
            {n > 0 && (typing || frame < enterAt + 30) && caretOn && <span style={{display: 'inline-block', width: 3 * u, height: fs * 1.05, marginLeft: 2 * u, background: P.accent, borderRadius: 2 * u}} />}
          </div>
          <div style={{opacity: ease.out(prog(frame, listStart, listStart + 8, (t) => t)), fontSize: 22 * u, color: dim, border: `${1.5 * u}px solid ${line}`, borderRadius: 10 * u, padding: `${5 * u}px ${12 * u}px`, transform: `scale(${ep >= 0 && ep < 5 ? 0.88 : 1})`, background: ep >= 0 && ep < 9 ? rgba(P.accent, 0.35) : 'transparent'}}>↵</div>
        </div>
      </div>
      {/* suggestions */}
      {showList && (
        <div style={{position: 'absolute', left: barX, top: barY + barH + 14 * u, width: barW, height: listH + 24 * u, borderRadius: 26 * u, background: barBg, border: `${1.4 * u}px solid ${line}`, boxShadow: `0 ${24 * u}px ${60 * u}px rgba(0,0,0,${dark ? 0.45 : 0.12})`, overflow: 'hidden', opacity: 1 - collapse * 0.5, padding: `${12 * u}px 0`}}>
          {items.map((it, i) =>
            it.k > 0.003 ? (
              <div key={it.title} style={{height: rowH * it.k, overflow: 'hidden', opacity: clamp(it.k * 1.4), transform: `translateY(${(1 - it.k) * 8 * u}px)`}}>
                <div style={{height: rowH, display: 'flex', alignItems: 'center', gap: 18 * u, padding: `0 ${28 * u}px`, margin: `0 ${12 * u}px`, borderRadius: 16 * u, background: i === firstMatch ? rgba(P.accent, dark ? 0.18 : 0.12) : 'transparent', fontSize: 28 * u, color: ink}}>
                  <Glyph kind={i % 3 === 0 ? 'spark' : 'doc'} size={28 * u} color={i === firstMatch ? P.accent : dim} />
                  <span style={{flex: 1, whiteSpace: 'nowrap'}}>
                    <Highlight text={it.title} q={typed} color={P.accent} />
                  </span>
                  {i === firstMatch && <span style={{fontSize: 20 * u, color: dim}}>↵</span>}
                </div>
              </div>
            ) : null,
          )}
        </div>
      )}
      {/* result */}
      {resIn > 0 && (
        <div style={{position: 'absolute', left: barX, top: cardTop + (1 - resIn) * 40 * u, width: barW, opacity: resIn, transform: `scale(${0.97 + 0.03 * resIn})`, transformOrigin: '50% 0', borderRadius: 30 * u, background: barBg, border: `${1.4 * u}px solid ${line}`, boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,${dark ? 0.5 : 0.14})`, padding: `${34 * u}px ${38 * u}px`, display: 'flex', gap: 28 * u}}>
          {P.resultImage ? (
            <div style={{width: 190 * u, height: 190 * u, flex: 'none', borderRadius: 20 * u, backgroundImage: `url(${resolveSrc(P.resultImage)})`, backgroundSize: 'cover', backgroundPosition: 'center'}} />
          ) : (
            <div style={{width: 74 * u, height: 74 * u, flex: 'none', borderRadius: 22 * u, background: `linear-gradient(135deg, ${P.accent}, ${shade(P.accent, -0.4)})`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Glyph kind="spark" size={38 * u} color="#fff" />
            </div>
          )}
          <div style={{flex: 1, minWidth: 0}}>
            <div style={{fontSize: 36 * u, fontWeight: 800, color: ink, letterSpacing: -0.5 * u}}>{P.resultTitle}</div>
            <div style={{fontSize: 27 * u, lineHeight: 1.45, color: dark ? 'rgba(241,243,251,0.82)' : 'rgba(20,26,46,0.78)', marginTop: 12 * u, minHeight: 27 * u * 1.45 * 3}}>
              {P.resultBody.slice(0, bn)}
              {bn < P.resultBody.length && caretOn && <span style={{display: 'inline-block', width: 3 * u, height: 26 * u, background: P.accent, marginLeft: 2 * u, verticalAlign: 'middle'}} />}
            </div>
            <div style={{display: 'flex', gap: 10 * u, marginTop: 16 * u, flexWrap: 'wrap'}}>
              {P.resultTags.map((t, i) => (
                <span key={t} style={{opacity: tagsA(i), transform: `translateY(${(1 - tagsA(i)) * 8 * u}px)`, fontSize: 21 * u, padding: `${6 * u}px ${16 * u}px`, borderRadius: 99, background: rgba(P.accent, dark ? 0.2 : 0.12), color: dark ? shade(P.accent, 0.35) : shade(P.accent, -0.2), fontWeight: 600}}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const commandPaletteType = defineMotion<Props>({
  id: 'command-palette-type',
  title: 'Command palette typing',
  category: 'ui',
  description:
    'A dot grows into a search / prompt bar, a caret types the query with jittered keystrokes while matching suggestions stagger in and filter themselves, Enter presses the bar (scale 0.97 plus an accent glow), the list collapses and a result card slides in and streams its answer with tag chips.',
  source: ['prompt corpus x18 (prompt bar types, suggestions filter, enter -> result card)'],
  useFor: 'AI products, search tools and SaaS demos: the "user types a prompt and gets an answer" shot. Pairs with cursor-driver and ui-shape-morph.',
  durationInFrames: 270,
  defaultProps: {
    placeholder: 'Search or ask anything',
    query: 'summarize the q3 roadmap',
    suggestions: ['Summarize the Q3 roadmap', 'Summarize the meeting notes', 'Summarize this week in review', 'Share the Q3 roadmap', 'Search the team docs', 'Schedule a roadmap review'],
    resultTitle: 'Q3 roadmap, summarized',
    resultBody: 'Three themes shape the quarter: faster onboarding, a calmer dashboard and an API that scales. Launch is tracked for week 9 and two risks are still open.',
    resultTags: ['Roadmap', 'Q3', 'Draft'],
    resultImage: '',
    theme: 'dark',
    accent: '#7c8cff',
    background: '',
    typeStart: 40,
    charFrames: 2.5,
    enterGap: 16,
  },
  propDocs: {
    placeholder: 'placeholder text shown in the empty bar',
    query: 'the typed text',
    suggestions: 'suggestion rows; rows that stop matching the typed words collapse away',
    resultTitle: 'result card title',
    resultBody: 'result text, streamed in',
    resultTags: 'chips under the result',
    resultImage: 'optional thumbnail for the result (public/ path or URL)',
    theme: "'dark' | 'light'",
    accent: 'caret / highlight / glow colour',
    background: 'page colour (empty = theme default)',
    typeStart: 'frame typing begins',
    charFrames: 'frames per character (2-3 feels human)',
    enterGap: 'frames between the last character and Enter',
  },
  component: CommandPalette,
  tags: ['command palette', 'search', 'prompt', 'typing', 'caret', 'autocomplete', 'suggestions', 'spotlight', 'ai', 'chat', 'saas', 'demo', 'result card', 'streaming', 'ui', 'ask'],
});
