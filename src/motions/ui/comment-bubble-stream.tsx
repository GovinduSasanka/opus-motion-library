import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {Avatar, SANS, avatarColor, backOut, bgOf, fmtInt, mixHex, heartPath, withAlpha, wrapText} from '../../core/r3-social';
import {useSafeId} from '../../core/image-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A comment section streaming up: each comment (avatar with initials, name, speech bubble, optional like count) pops in at the
 * bottom of a column and pushes the older ones up, fading out under a header. Text comes from the `comments` prop.
 */
type Comment = {name: string; text: string; likes?: number};
type Props = {
  comments: Comment[];
  title: string;
  totalCount: number;
  stagger: number;
  startAt: number;
  background: string;
  ink: string;
  accent: string;
  bubbleColor: string;
  showHeader: boolean;
};

const CommentBubbleStream: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const uid = useSafeId('cbs');
  const list = (p.comments && p.comments.length ? p.comments : [{name: 'Someone', text: 'Add comments through the comments prop.'}]).slice(0, 24);
  const bg = p.background === 'transparent' ? '#ffffff' : p.background;

  // column geometry (px)
  const colW = portrait ? w * 0.9 : Math.min(w * 0.58, 1000 * u);
  const left = (w - colW) / 2;
  const S = portrait ? 1.3 * u : 1.32 * u; // inner scale
  const av = 30 * S; // avatar radius
  const fs = 31 * S;
  const nameFs = 24 * S;
  const lh = fs * 1.3;
  const padX = 24 * S;
  const padY = 18 * S;
  const textMaxW = colW - av * 2 - 16 * S - padX * 2 - 24 * S;
  const gap = 24 * S;
  const topY = p.showHeader ? h * (portrait ? 0.15 : 0.19) : h * 0.06;
  const yBottom = h * (portrait ? 0.93 : 0.94);

  type Laid = {name: string; lines: string[]; likes?: number; hgt: number; bw: number; at: number};
  const laid: Laid[] = list.map((c, i) => {
    const lines = wrapText(c.text, fs, textMaxW, 'sans', 4);
    const bw = Math.min(textMaxW + padX * 2, Math.max(...lines.map((l) => l.length * fs * 0.54), 60 * S) + padX * 2 + (c.likes != null ? 0 : 0));
    return {name: c.name, lines, likes: c.likes, hgt: nameFs * 1.5 + lines.length * lh + padY * 2, bw, at: p.startAt + 10 + i * Math.max(6, p.stagger)};
  });
  const slide = 16;
  let content = 0;
  const ys: number[] = [];
  laid.forEach((c) => {
    ys.push(content);
    content += c.hgt + gap;
  });
  const scrolled = laid.reduce((a, c) => a + (c.hgt + gap) * ease.out(prog(frame, c.at, c.at + slide, ease.linear)), 0);

  // header count-up
  const cnt = Math.round(p.totalCount * ease.out(prog(frame, p.startAt, p.startAt + 60, ease.linear)));
  const hdrIn = prog(frame, p.startAt, p.startAt + 14, ease.out);

  return (
    <AbsoluteFill style={{background: bgOf(p.background)}}>
      <Svg>
        <defs>
          <linearGradient id={`${uid}-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.16" stopColor="#fff" stopOpacity={1} />
            <stop offset="1" stopColor="#fff" stopOpacity={1} />
          </linearGradient>
          <mask id={`${uid}-m`} maskUnits="userSpaceOnUse" x={0} y={topY - 20 * S} width={w} height={yBottom - topY + 80 * S}>
            <rect x={0} y={topY - 20 * S} width={w} height={yBottom - topY + 80 * S} fill={`url(#${uid}-fade)`} />
          </mask>
        </defs>

        {p.showHeader && (
          <g opacity={hdrIn} transform={`translate(0 ${(1 - hdrIn) * -16})`}>
            <text x={left} y={h * (portrait ? 0.1 : 0.115)} fontFamily={SANS} fontWeight={800} fontSize={46 * S} fill={p.ink}>
              {p.title}
            </text>
            <g transform={`translate(${left + colW} 0)`}>
              <rect x={-150 * S} y={h * (portrait ? 0.1 : 0.115) - 42 * S} width={150 * S} height={56 * S} rx={28 * S} fill={withAlpha(p.ink, 0.08)} />
              <text x={-75 * S} y={h * (portrait ? 0.1 : 0.115) - 3 * S} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30 * S} fill={p.ink}>
                {fmtInt(cnt)}
              </text>
            </g>
            <rect x={left} y={h * (portrait ? 0.1 : 0.115) + 26 * S} width={colW} height={3 * S} fill={withAlpha(p.ink, 0.12)} />
          </g>
        )}

        <g mask={`url(#${uid}-m)`}>
          {laid.map((c, i) => {
            const t = prog(frame, c.at, c.at + slide, ease.linear);
            if (t <= 0) return null;
            const e = ease.out(t);
            const top = yBottom - scrolled + ys[i];
            const sc = 0.88 + 0.12 * backOut(t, 1.4);
            const cx0 = left + av;
            const bx = left + av * 2 + 16 * S;
            const bubbleTop = top + nameFs * 1.5;
            const bh = c.lines.length * lh + padY * 2;
            const likeT = prog(frame, c.at + 14, c.at + 36, ease.out);
            const col = avatarColor(c.name, i);
            return (
              <g key={i} opacity={Math.min(1, e * 1.4)} transform={`translate(${left + av} ${top + c.hgt / 2}) scale(${sc}) translate(${-(left + av)} ${-(top + c.hgt / 2)})`}>
                <Avatar cx={cx0} cy={top + nameFs * 0.9 + av * 0.6} r={av} name={c.name} color={col} />
                <text x={bx + 4 * S} y={top + nameFs * 0.95} fontFamily={SANS} fontWeight={800} fontSize={nameFs} fill={p.ink} opacity={0.7}>
                  {c.name}
                </text>
                <path
                  d={`M${bx + 6 * S} ${bubbleTop} H${bx + c.bw - 16 * S} a${16 * S} ${16 * S} 0 0 1 ${16 * S} ${16 * S} V${bubbleTop + bh - 16 * S} a${16 * S} ${16 * S} 0 0 1 ${-16 * S} ${16 * S} H${bx + 16 * S} a${16 * S} ${16 * S} 0 0 1 ${-16 * S} ${-16 * S} V${bubbleTop + 6 * S} a${6 * S} ${6 * S} 0 0 1 ${6 * S} ${-6 * S}Z`}
                  fill={p.bubbleColor === 'auto' ? mixHex(bg, p.ink, 0.08) : p.bubbleColor}
                />
                {c.lines.map((ln, j) => (
                  <text key={j} x={bx + padX} y={bubbleTop + padY + lh * (j + 0.78)} fontFamily={SANS} fontWeight={400} fontSize={fs} fill={p.ink}>
                    {ln}
                  </text>
                ))}
                {c.likes != null && (
                  <g opacity={likeT} transform={`translate(${bx + c.bw - 6 * S} ${bubbleTop + bh + 2 * S})`}>
                    <rect x={-112 * S} y={-14 * S} width={116 * S} height={40 * S} rx={20 * S} fill={bg} stroke={withAlpha(p.ink, 0.12)} strokeWidth={2 * S} />
                    <path d={heartPath(-88 * S, 5 * S, 11 * S)} fill={p.accent} />
                    <text x={-66 * S} y={13 * S} fontFamily={SANS} fontWeight={800} fontSize={24 * S} fill={p.ink}>
                      {fmtInt(Math.round(c.likes * likeT))}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const commentBubbleStream = defineMotion<Props>({
  id: 'comment-bubble-stream',
  title: 'Comment bubble stream',
  category: 'ui',
  description: 'A comment section streaming up: avatars with initials, names and speech bubbles pop in one after another at the bottom and push older comments up under a fade, with a counting header and optional like badges.',
  source: ['original (round 3, social & marketing)'],
  useFor: 'Social proof, "what people are saying", reaction / reply montages, community and live-chat moments, comment-section explainers and ad reaction walls.',
  durationInFrames: 270,
  defaultProps: {
    comments: [
      {name: 'Maya Rivers', text: 'Okay this is exactly what I needed today, thank you!', likes: 128},
      {name: 'Dev Patel', text: 'Saved. Sending this to my whole team right now.', likes: 54},
      {name: 'Lena Ortiz', text: 'The ending got me. Watched it three times already.', likes: 301},
      {name: 'Sam Okafor', text: 'Can you do a follow-up on the second step?', likes: 17},
      {name: 'Ana Costa', text: 'Clear, short and actually useful. Subscribed.', likes: 89},
      {name: 'Jin Park', text: 'Best explanation I have seen all year.', likes: 212},
      {name: 'Noor Haddad', text: 'Tried it today and it worked first time.', likes: 40},
      {name: 'Tom Becker', text: 'More of this please!', likes: 9},
    ],
    title: 'Comments',
    totalCount: 1284,
    stagger: 24,
    startAt: 0,
    background: '#F5F3EE',
    ink: '#1E1C24',
    accent: '#F0506E',
    bubbleColor: 'auto',
    showHeader: true,
  },
  propDocs: {
    comments: 'array of {name, text, likes?} — name drives the avatar initials and colour',
    title: 'header title',
    totalCount: 'header comment counter (counts up)',
    stagger: 'frames between comments',
    startAt: 'frame the first comment begins',
    background: 'frame colour, or "transparent" to overlay content',
    ink: 'text colour',
    accent: 'like badge heart colour',
    bubbleColor: 'speech bubble fill, or "auto" to tint the background with ink',
    showHeader: 'show the title + counter header',
  },
  component: CommentBubbleStream,
  tags: ['social', 'comments', 'chat', 'reactions', 'feed', 'testimonials', 'community', 'overlay', 'avatars'],
});
