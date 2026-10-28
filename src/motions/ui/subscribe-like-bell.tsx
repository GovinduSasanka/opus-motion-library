import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {Avatar, Bell, SANS, ThumbUp, bgOf, fmtInt, wrapText} from '../../core/r3-social';
import {backOut} from '../../core/r2-s1-kit';
import {rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {mixHex} from '../../core/text-kit';
import {ArrowCursor} from '../../core/ui-kit';

/**
 * Call-to-action trio, drawn from scratch (no platform marks): a channel card, then a cursor presses SUBSCRIBE (it flips to a
 * "Subscribed" state with a check), taps the bell (it rings and fills), and finally likes (thumb pops, counter ticks +1 with a
 * floating +1 and a burst). Every label, the channel name and the like count are props.
 */
type Props = {
  channelName: string;
  channelTagline: string;
  subscribeLabel: string;
  subscribedLabel: string;
  likeLabel: string;
  likeCount: number;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  bellColor: string;
  showCursor: boolean;
  speed: number;
  startAt: number;
};

const SubscribeLikeBell: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const dark = mixHex(p.background === 'transparent' ? '#ffffff' : p.background, '#000000', 0.5)[0] !== undefined;
  void dark;
  const sp = Math.max(0.25, p.speed);
  const f = Math.max(0, frame - p.startAt) * sp;

  // design space (units): a row 800 wide centred on (0,0)
  const k = Math.min(portrait ? 1.28 : 1.42, (w * 0.9) / 800) * (portrait ? 1 : Math.min(1, (h * 0.8) / 520)) * u * (portrait ? 1 : 1 / u);
  const kk = Math.min((w * 0.9) / 860, (h * 0.86) / (portrait ? 760 : 520), portrait ? 1.6 : 1.9);
  void k;

  // timeline (frames at 30fps, scaled by speed)
  const T = {enter: 0, subMove: 34, subPress: 56, bellMove: 78, bellPress: 98, likeMove: 124, likePress: 146, end: 230};
  const pop = (i: number) => backOut(prog(f, T.enter + i * 5, T.enter + i * 5 + 18, ease.linear), 1.5);

  // button geometry (design units)
  const SUB = {x: -400, y: -52, w: 346, h: 104};
  const BELL = {x: -26, y: -52, w: 104, h: 104};
  const LIKE = {x: 104, y: -52, w: 296, h: 104};
  const subC = {x: SUB.x + SUB.w / 2, y: 0};
  const bellC = {x: BELL.x + BELL.w / 2, y: 0};
  const likeC = {x: LIKE.x + LIKE.w * 0.4, y: 0};

  // cursor path
  const cs = [
    {t: 0, x: 520, y: 240},
    {t: T.subMove, x: 520, y: 240},
    {t: T.subPress - 4, x: subC.x + 40, y: 18},
    {t: T.bellMove, x: subC.x + 40, y: 18},
    {t: T.bellPress - 4, x: bellC.x + 8, y: 22},
    {t: T.likeMove, x: bellC.x + 8, y: 22},
    {t: T.likePress - 4, x: likeC.x + 6, y: 22},
    {t: T.end - 30, x: likeC.x + 6, y: 22},
    {t: T.end, x: 560, y: 300},
  ];
  let cx0 = cs[0].x;
  let cy0 = cs[0].y;
  for (let i = 0; i < cs.length - 1; i++) {
    if (f >= cs[i].t && f < cs[i + 1].t) {
      const e = ease.inOut((f - cs[i].t) / Math.max(1, cs[i + 1].t - cs[i].t));
      cx0 = lerp(cs[i].x, cs[i + 1].x, e);
      cy0 = lerp(cs[i].y, cs[i + 1].y, e);
    } else if (f >= cs[cs.length - 1].t) {
      cx0 = cs[cs.length - 1].x;
      cy0 = cs[cs.length - 1].y;
    }
  }
  const pressAt = (t0: number) => (f >= t0 && f < t0 + 10 ? Math.sin(((f - t0) / 10) * Math.PI) : 0);
  const pSub = pressAt(T.subPress);
  const pBell = pressAt(T.bellPress);
  const pLike = pressAt(T.likePress);

  // states
  const subbed = prog(f, T.subPress, T.subPress + 10, ease.out);
  const subScale = 1 - 0.07 * pSub;
  const ring = prog(f, T.bellPress, T.bellPress + 44, ease.linear);
  const bellOn = prog(f, T.bellPress, T.bellPress + 8, ease.out);
  const swing = f > T.bellPress ? Math.sin(ring * Math.PI * 7) * 26 * Math.pow(1 - ring, 1.4) : 0;
  const likeP = prog(f, T.likePress, T.likePress + 16, ease.linear);
  const likeOn = f >= T.likePress;
  const thumbS = f < T.likePress ? 1 : 1 + 0.55 * Math.sin(Math.min(1, likeP) * Math.PI) + (likeP >= 1 ? 0 : 0);
  const count = p.likeCount + (f >= T.likePress + 4 ? 1 : 0);
  const rollT = prog(f, T.likePress + 4, T.likePress + 16, ease.out);
  const countStr = fmtInt(count);
  const prevStr = fmtInt(p.likeCount);

  const colSubOff = mixHex(p.accent, p.ink, 0.0);
  void colSubOff;
  const subBg = mixHex(p.accent, mixHex(p.ink, p.background === 'transparent' ? '#ffffff' : p.background, 0.82), subbed);
  const subFg = mixHex('#ffffff', p.ink, subbed);

  // channel card
  const cardIn = backOut(prog(f, 0, 20, ease.linear), 1.2);
  const nameLines = wrapText(p.channelName, 54, 600, 'sans', 1);
  const tagLines = wrapText(p.channelTagline, 30, 600, 'sans', 1);

  // like burst
  const burst = rng(11);
  const parts = Array.from({length: 14}, (_, i) => {
    const a = (i / 14) * Math.PI * 2 + burst() * 0.4;
    return {a, d: 70 + burst() * 70, s: 6 + burst() * 7};
  });
  const bt = prog(f, T.likePress + 2, T.likePress + 34, ease.out);
  const plusT = prog(f, T.likePress + 6, T.likePress + 40, ease.out);

  const cardW = 800;
  const cardColor = mixHex(p.background === 'transparent' ? '#ffffff' : p.background, p.ink, 0.07);

  return (
    <AbsoluteFill style={{background: bgOf(p.background)}}>
      <Svg>
        <g transform={`translate(${w / 2} ${h / 2 + (portrait ? 0 : 10)}) scale(${kk})`}>
          {/* channel card */}
          <g opacity={cardIn} transform={`translate(0 ${(1 - cardIn) * 30})`}>
            <rect x={-cardW / 2} y={-250} width={cardW} height={150} rx={40} fill={cardColor} />
            <Avatar cx={-cardW / 2 + 90} cy={-175} r={48} name={p.channelName} color={p.accent2} />
            <text x={-cardW / 2 + 170} y={-168} fontFamily={SANS} fontWeight={800} fontSize={nameLines[0] && nameLines[0].length > 22 ? 42 : 50} fill={p.ink}>
              {nameLines[0]}
            </text>
            <text x={-cardW / 2 + 170} y={-128} fontFamily={SANS} fontWeight={400} fontSize={30} fill={p.ink} opacity={0.6}>
              {tagLines[0]}
            </text>
          </g>

          {/* subscribe button */}
          <g transform={`translate(${subC.x} 0) scale(${pop(1) * subScale}) translate(${-subC.x} 0)`} opacity={Math.min(1, pop(1) * 2)}>
            <rect x={SUB.x} y={SUB.y} width={SUB.w} height={SUB.h} rx={SUB.h / 2} fill={subBg} />
            {subbed > 0.5 ? (
              <g opacity={subbed}>
                <path d={`M${SUB.x + 46} ${0} l14 15 l28 -30`} fill="none" stroke={subFg} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
                <text x={SUB.x + 108} y={15} fontFamily={SANS} fontWeight={800} fontSize={44} fill={subFg}>
                  {p.subscribedLabel}
                </text>
              </g>
            ) : (
              <text x={subC.x} y={15} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44} fill={subFg} opacity={1 - subbed}>
                {p.subscribeLabel}
              </text>
            )}
            {pSub > 0 && <circle cx={subC.x + 40} cy={18} r={20 + (f - T.subPress) * 6} fill="none" stroke={p.accent} strokeWidth={5} opacity={Math.max(0, 1 - (f - T.subPress) / 10)} />}
          </g>

          {/* bell button */}
          <g transform={`translate(${bellC.x} 0) scale(${pop(2) * (1 - 0.08 * pBell)}) translate(${-bellC.x} 0)`} opacity={Math.min(1, pop(2) * 2)}>
            <circle cx={bellC.x} cy={0} r={BELL.w / 2} fill={mixHex(cardColor, p.bellColor, bellOn * 0.9)} />
            <Bell x={bellC.x - 34} y={-36} s={68} fill={mixHex('#00000000'.slice(0, 7), p.bellColor, 1) && (bellOn > 0.3 ? p.bellColor : 'none')} stroke={bellOn > 0.3 ? mixHex(p.bellColor, '#000000', 0.35) : p.ink} sw={1.8} swing={swing} />
            {f > T.bellPress && ring < 1 &&
              [-1, 1].map((sd) =>
                [0, 1].map((j) => {
                  const rr = 52 + j * 16 + ring * 18;
                  const a0 = sd * (0.7 + j * 0.0);
                  return (
                    <path
                      key={`${sd}${j}`}
                      d={`M${bellC.x + Math.sin(a0) * rr} ${-Math.cos(a0) * rr * 0.6 - 4} q${sd * 10} 12 0 26`}
                      fill="none"
                      stroke={p.bellColor}
                      strokeWidth={6}
                      strokeLinecap="round"
                      opacity={Math.sin(ring * Math.PI) * (j ? 0.5 : 1)}
                    />
                  );
                }),
              )}
          </g>

          {/* like pill */}
          <g transform={`translate(${LIKE.x + LIKE.w / 2} 0) scale(${pop(3) * (1 - 0.06 * pLike)}) translate(${-(LIKE.x + LIKE.w / 2)} 0)`} opacity={Math.min(1, pop(3) * 2)}>
            <rect x={LIKE.x} y={LIKE.y} width={LIKE.w} height={LIKE.h} rx={LIKE.h / 2} fill={likeOn ? mixHex(cardColor, p.accent2, 0.16) : cardColor} stroke={likeOn ? p.accent2 : 'none'} strokeWidth={4} />
            <g transform={`translate(${likeC.x} 0) scale(${thumbS}) translate(${-likeC.x} 0) rotate(${likeOn ? -14 * Math.sin(Math.min(1, likeP) * Math.PI) : 0} ${likeC.x} 0)`}>
              <ThumbUp x={likeC.x - 30} y={-32} s={64} fill={likeOn ? p.accent2 : 'none'} stroke={likeOn ? p.accent2 : p.ink} sw={1.8} />
            </g>
            {/* counter with a vertical roll */}
            <g clipPath={undefined}>
              <text x={LIKE.x + 118} y={-(rollT * 34) + 16} fontFamily={SANS} fontWeight={800} fontSize={42} fill={p.ink} opacity={1 - rollT}>
                {prevStr}
              </text>
              <text x={LIKE.x + 118} y={(1 - rollT) * 34 + 16} fontFamily={SANS} fontWeight={800} fontSize={42} fill={likeOn ? p.accent2 : p.ink} opacity={rollT}>
                {countStr}
              </text>
            </g>
            <text x={LIKE.x + LIKE.w / 2} y={LIKE.y + LIKE.h + 40} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={26} fill={p.ink} opacity={0.55 * pop(3)}>
              {p.likeLabel}
            </text>
            {likeOn && bt < 1 &&
              parts.map((q, i) => (
                <circle key={i} cx={likeC.x + Math.cos(q.a) * q.d * bt} cy={Math.sin(q.a) * q.d * bt} r={q.s * (1 - bt)} fill={i % 2 ? p.accent2 : p.bellColor} />
              ))}
            {likeOn && plusT > 0 && plusT < 1 && (
              <text x={likeC.x + 10} y={-70 - plusT * 60} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill={p.accent2} opacity={1 - plusT}>
                +1
              </text>
            )}
          </g>

          {p.showCursor && f > T.subMove - 4 && f < T.end && <ArrowCursor x={cx0} y={cy0} size={52} press={Math.max(pSub, pBell, pLike)} />}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const subscribeLikeBell = defineMotion<Props>({
  id: 'subscribe-like-bell',
  title: 'Subscribe, bell & like',
  category: 'ui',
  description:
    'A channel card and a row of three buttons: a cursor presses SUBSCRIBE (flips to Subscribed with a check), taps the bell (it rings and fills) and likes (thumb pops, counter rolls +1 with a burst). Original icons, no platform marks.',
  source: ['original (round 3, social & marketing)'],
  useFor: 'Call-to-action beats for video channels, creator promos, social explainers ("subscribe, ring the bell, like"), follow / join prompts and end screens.',
  durationInFrames: 230,
  defaultProps: {
    channelName: 'Your Channel',
    channelTagline: 'New videos every week',
    subscribeLabel: 'Subscribe',
    subscribedLabel: 'Subscribed',
    likeLabel: 'Like this video',
    likeCount: 1204,
    background: '#F4F1EA',
    ink: '#1D1B22',
    accent: '#EA4B3E',
    accent2: '#3E7BFA',
    bellColor: '#F5B63A',
    showCursor: true,
    speed: 1,
    startAt: 0,
  },
  propDocs: {
    channelName: 'name on the channel card (also drives the avatar initials)',
    channelTagline: 'small line under the channel name',
    subscribeLabel: 'label on the call-to-action button before the press',
    subscribedLabel: 'label after the press',
    likeLabel: 'caption under the like pill',
    likeCount: 'like counter value before the tap (it ticks +1)',
    background: 'frame colour, or "transparent" to overlay other content',
    ink: 'text / outline colour',
    accent: 'subscribe button colour',
    accent2: 'like colour',
    bellColor: 'bell fill colour',
    showCursor: 'show the animated pointer',
    speed: 'playback speed multiplier of the whole sequence',
    startAt: 'frame the sequence begins',
  },
  component: SubscribeLikeBell,
  tags: ['social', 'subscribe', 'like', 'bell', 'follow', 'cta', 'youtube-style', 'notification', 'channel', 'overlay', 'creator'],
});
