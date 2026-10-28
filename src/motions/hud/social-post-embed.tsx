import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {clamp, lerp} from '../../core/ease';
import {resolveSrc} from '../../core/asset';
import {Plate} from '../../core/image-kit';
import {alpha, avatarColor, backOut, eo3, estWidth, fmtCompact, initials, lf, on, seg, splitEm} from '../../core/r3-news-kit';
import {heartPath} from '../../core/r3-social';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A generic social-post card (avatar initials, name, handle, text with highlighted words, time, counts) that pops in,
 * reveals its text word by word, counts its numbers up and "likes" itself. No real platform branding.
 */
type Props = {
  name: string;
  handle: string;
  avatarSrc: string;
  verified: boolean;
  text: string;
  time: string;
  replies: number;
  reposts: number;
  likes: number;
  media: boolean;
  imageSrc: string;
  likeAt: number;
  wordsPerSecond: number;
  cardColor: string;
  ink: string;
  muted: string;
  accent: string;
  likeColor: string;
  background: string;
};

const CW = 860; // card width in design units
const PAD = 40;
const FS = 40;
const LH = 58;

type Word = {t: string; em: boolean; glue: boolean};

const wrapWords = (text: string, maxW: number): Word[][] => {
  const words: Word[] = [];
  let prevEndsSpace = true;
  for (const part of splitEm(text)) {
    const toks = part.t.split(/\s+/).filter(Boolean);
    toks.forEach((t, i) => {
      const startsSpace = /^\s/.test(part.t);
      words.push({t, em: part.em, glue: i === 0 && !prevEndsSpace && !startsSpace});
    });
    prevEndsSpace = /\s$/.test(part.t);
  }
  const lines: Word[][] = [];
  let cur: Word[] = [];
  let curW = 0;
  const sp = estWidth(' ', FS, 'sans');
  for (const wd of words) {
    const ww = estWidth(wd.t, FS, 'sans') * 1.02;
    const add = (cur.length && !wd.glue ? sp : 0) + ww;
    if (cur.length && curW + add > maxW && !wd.glue) {
      lines.push(cur);
      cur = [];
      curW = 0;
    }
    cur.push(wd);
    curW += (cur.length > 1 && !wd.glue ? sp : 0) + ww;
  }
  if (cur.length) lines.push(cur);
  return lines;
};

const Glyph: React.FC<{kind: 'reply' | 'repost' | 'heart' | 'share'; color: string; fill?: string; size: number; sw?: number}> = ({kind, color, fill = 'none', size, sw = 1.8}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', overflow: 'visible'}}>
    {kind === 'reply' && <path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1h-8.5L6.5 21v-4H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />}
    {kind === 'repost' && <path d="M7 8h10a3 3 0 0 1 3 3v1M17 4.5 20.5 8 17 11.5M17 16H7a3 3 0 0 1-3-3v-1M7 19.5 3.5 16 7 12.5" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}
    {kind === 'heart' && <path d={heartPath(12, 11.6, 7.3)} fill={fill} stroke={color} strokeWidth={sw} strokeLinejoin="round" />}
    {kind === 'share' && <path d="M12 15.5V4M8 8l4-4 4 4M5 12.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6.5" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
);

const SocialPost: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();

  // ---- layout in design units (card width CW)
  const lines = React.useMemo(() => wrapWords(p.text || '', CW - PAD * 2), [p.text]);
  const nWords = lines.reduce((a, l) => a + l.length, 0);
  const headH = 96;
  const textH = lines.length * LH;
  const mediaH = p.media ? (portrait ? 400 : 340) : 0;
  const mediaGap = p.media ? 26 : 0;
  const timeH = 44;
  const statsH = 84;
  const H1 = PAD + headH + 24 + textH + mediaGap + mediaH + 26 + timeH + 22 + 2 + statsH + 6;
  const s = Math.min((w * (portrait ? 0.9 : w > h * 1.2 ? 0.52 : 0.8)) / CW, (h * 0.9) / H1);
  const cw = CW * s;
  const ch = H1 * s;
  const left = (w - cw) / 2;
  const top = (h - ch) / 2;

  // ---- timeline
  const popT = seg(frame, 0, 22);
  const pop = backOut(popT, 1.15);
  const wps = Math.max(1, p.wordsPerSecond);
  const textStart = 18;
  const wordFrames = 30 / wps;
  const textEnd = textStart + nWords * wordFrames;
  const metaK = eo3(seg(frame, textEnd + 4, textEnd + 20));
  const countK = eo3(seg(frame, textEnd + 10, textEnd + 52));
  const likeT = frame - p.likeAt;
  const liked = likeT >= 0;
  const likePop = liked ? Math.sin(Math.min(1, likeT / 14) * Math.PI) : 0;
  const ring = liked ? seg(frame, p.likeAt, p.likeAt + 22) : 0;
  const push = 1 + 0.03 * seg(frame, 0, 180);

  const kk = push * lerp(0.9, 1, clamp(pop, 0, 1.15));
  const avatarR = 34;
  let wi = 0;
  const bigLike = p.likes + (liked ? 1 : 0);

  const num = (n: number) => fmtCompact(Math.round(n * countK), 1);

  return (
    <AbsoluteFill style={{background: p.background === 'transparent' ? 'transparent' : p.background, overflow: 'hidden'}}>
      {p.background !== 'transparent' && <AbsoluteFill style={{background: `radial-gradient(ellipse at 30% 20%, ${alpha('#FFFFFF', 0.07)} 0%, rgba(0,0,0,0) 55%), radial-gradient(ellipse at 80% 90%, ${alpha(p.accent, 0.16)} 0%, rgba(0,0,0,0) 55%)`}} />}
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: CW,
          height: H1,
          transformOrigin: '0 0',
          transform: `translate(${(1 - kk) * (cw / 2)}px, ${(1 - kk) * (ch / 2) + (1 - clamp(pop, 0, 1.1)) * 50 * u}px) scale(${s * kk})`,
          opacity: clamp(popT * 2.4),
          background: p.cardColor,
          borderRadius: 30,
          boxShadow: '0 24px 70px rgba(0,0,0,0.35), 0 2px 0 rgba(255,255,255,0.5) inset',
          fontFamily: lf.sans,
        }}
      >
        {/* header */}
        <div style={{position: 'absolute', left: PAD, top: PAD, right: PAD, height: headH, display: 'flex', alignItems: 'center'}}>
          <div style={{width: avatarR * 2, height: avatarR * 2, borderRadius: '50%', overflow: 'hidden', background: avatarColor(p.name), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto'}}>
            {on(p.avatarSrc) ? <Img src={resolveSrc(p.avatarSrc)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <span style={{color: '#fff', fontWeight: 800, fontSize: 30}}>{initials(p.name)}</span>}
          </div>
          <div style={{marginLeft: 20, minWidth: 0}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
              <span style={{fontWeight: 800, fontSize: 34, color: p.ink, whiteSpace: 'nowrap'}}>{p.name}</span>
              {p.verified && (
                <svg width={28} height={28} viewBox="0 0 24 24" style={{display: 'block'}}>
                  <circle cx={12} cy={12} r={11} fill={p.accent} />
                  <path d="M6.8 12.4l3.5 3.4 6.9-7.2" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div style={{fontWeight: 400, fontSize: 28, color: p.muted, marginTop: 2}}>{p.handle}</div>
          </div>
        </div>

        {/* text */}
        <div style={{position: 'absolute', left: PAD, top: PAD + headH + 24, width: CW - PAD * 2}}>
          {lines.map((l, li) => (
            <div key={li} style={{height: LH, lineHeight: `${LH}px`, fontSize: FS, whiteSpace: 'nowrap', color: p.ink}}>
              {l.map((wd, k) => {
                const idx = wi++;
                const a = seg(frame, textStart + idx * wordFrames, textStart + idx * wordFrames + 7);
                return (
                  <span key={k} style={{opacity: eo3(a), display: 'inline-block', transform: `translateY(${(1 - eo3(a)) * 8}px)`, color: wd.em ? p.accent : p.ink, fontWeight: wd.em ? 800 : 400, marginRight: k < l.length - 1 && !l[k + 1].glue ? estWidth(' ', FS, 'sans') : 0}}>
                    {wd.t}
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        {/* media */}
        {p.media && (
          <div style={{position: 'absolute', left: PAD, top: PAD + headH + 24 + textH + mediaGap, width: CW - PAD * 2, height: mediaH, borderRadius: 22, overflow: 'hidden', opacity: metaK}}>
            <Plate src={on(p.imageSrc) ? p.imageSrc : undefined} seed={5} palette="dawn" width={(CW - PAD * 2) * 1.5} height={mediaH * 1.5} style={{transform: 'scale(0.6667)', transformOrigin: '0 0'}} />
          </div>
        )}

        {/* time */}
        <div style={{position: 'absolute', left: PAD, top: PAD + headH + 24 + textH + mediaGap + mediaH + 26, fontSize: 28, color: p.muted, opacity: metaK}}>{p.time}</div>

        {/* divider + stats */}
        <div style={{position: 'absolute', left: PAD, right: PAD, top: PAD + headH + 24 + textH + mediaGap + mediaH + 26 + timeH + 22, height: 2, background: alpha(p.muted, 0.25), opacity: metaK}} />
        <div style={{position: 'absolute', left: PAD, right: PAD, top: PAD + headH + 24 + textH + mediaGap + mediaH + 26 + timeH + 26, height: statsH, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: metaK}}>
          {(
            [
              ['reply', p.replies],
              ['repost', p.reposts],
              ['heart', bigLike],
            ] as const
          ).map(([kind, n]) => {
            const isLike = kind === 'heart';
            return (
              <div key={kind} style={{display: 'flex', alignItems: 'center', gap: 12, color: isLike && liked ? p.likeColor : p.muted, fontWeight: 600, fontSize: 30, position: 'relative'}}>
                <div style={{position: 'relative', width: 40, height: 40, transform: isLike ? `scale(${1 + likePop * 0.45})` : undefined}}>
                  {isLike && liked && (
                    <div style={{position: 'absolute', left: '50%', top: '50%', width: 40 + ring * 40, height: 40 + ring * 40, marginLeft: -(20 + ring * 20), marginTop: -(20 + ring * 20), borderRadius: '50%', border: `3px solid ${p.likeColor}`, opacity: (1 - ring) * 0.8}} />
                  )}
                  <Glyph kind={kind} color={isLike && liked ? p.likeColor : p.muted} fill={isLike && liked ? p.likeColor : 'none'} size={40} />
                </div>
                <span>{num(n)}</span>
              </div>
            );
          })}
          <Glyph kind="share" color={p.muted} size={38} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const socialPostEmbed = defineMotion<Props>({
  id: 'social-post-embed',
  title: 'Social post embed',
  category: 'hud',
  description:
    'A generic social-post card - avatar (initials or image), name, verified tick, handle, text with *highlighted* words, optional picture, time and reply / repost / like counts. It pops in, reveals its words one by one, counts the numbers up and "likes" itself with a heart pop. No real platform branding.',
  source: ['library original (embedded-post pattern)'],
  useFor: 'Showing what someone posted in a news piece, explainer or reaction video: a quote, a viral claim, a customer comment, a screenshot-style callout.',
  durationInFrames: 180,
  defaultProps: {
    name: 'Maya Ortiz',
    handle: '@maya.ortiz',
    avatarSrc: '',
    verified: true,
    text: 'Just walked across the *new bridge* at sunrise. Twelve years of planning and it is finally open to everyone.',
    time: '7:42 AM · 12 Mar 2026',
    replies: 128,
    reposts: 2431,
    likes: 15800,
    media: false,
    imageSrc: '',
    likeAt: 118,
    wordsPerSecond: 9,
    cardColor: '#FFFFFF',
    ink: '#0F1419',
    muted: '#667085',
    accent: '#2F6FDB',
    likeColor: '#E0245E',
    background: '#10141C',
  },
  propDocs: {
    name: 'display name',
    handle: 'handle shown under the name',
    avatarSrc: 'avatar image (public/ path or URL); empty = coloured circle with initials',
    verified: 'show the round tick next to the name',
    text: 'post text; wrap words in *asterisks* to colour and embolden them',
    time: 'timestamp line',
    replies: 'reply count (counts up; 12480 shows as 12.5K)',
    reposts: 'repost / share count',
    likes: 'like count (the heart pop adds one)',
    media: 'show a picture block under the text',
    imageSrc: 'picture for the block (public/ path or URL); empty = procedural placeholder',
    likeAt: 'frame the heart pops',
    wordsPerSecond: 'text reveal speed',
    cardColor: 'card fill',
    ink: 'text colour',
    muted: 'handle, time and icon colour',
    accent: 'highlight words, tick and glow colour',
    likeColor: 'liked-heart colour',
    background: 'backdrop colour; "transparent" = overlay',
  },
  component: SocialPost,
  tags: ['social', 'post', 'tweet', 'comment', 'card', 'quote', 'embed', 'testimonial', 'news', 'viral', 'reaction', 'avatar', 'likes', 'journalism', 'overlay'],
});
