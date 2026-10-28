import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {SANS, avatarColor, backOut, bgOf, initials, mixHex, withAlpha, wrapText} from '../../core/r3-social';
import {Pic} from '../../core/ui-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A vertical "story" player: a rounded phone-ratio frame with segmented progress bars on top that fill one after another, a
 * handle header, tap-through between frames (a tap ripple on the right edge, a quick slide + zoom change) and a caption pill per
 * frame. Frames are `images` (public/ paths) or procedural scenes when empty. Original UI, no platform marks.
 */
type Props = {
  images: string[];
  captions: string[];
  frameCount: number;
  holdFrames: number;
  handle: string;
  timeAgo: string;
  replyLabel: string;
  background: string;
  ink: string;
  accent: string;
  captionColor: string;
  captionInk: string;
  showReplyBar: boolean;
  startAt: number;
};

const StoryProgressFrames: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const imgs = p.images || [];
  const n = Math.max(1, imgs.length || p.frameCount);
  const hold = Math.max(20, p.holdFrames);
  const f = Math.max(0, frame - p.startAt);
  const bg = p.background === 'transparent' ? '#101018' : p.background;

  const intro = 14;
  const g = Math.max(0, f - intro); // time since the story started
  const cur = Math.min(n - 1, Math.floor(g / hold));
  const inFrame = g - cur * hold; // frames into the current story frame
  const trans = 9;
  const prev = cur - 1;
  const tIn = cur > 0 ? ease.inOut(prog(inFrame, 0, trans, ease.linear)) : 1;

  // phone box
  const phH = portrait ? Math.min(h * 0.96, (w * 0.96) * (16 / 9)) : h * 0.92;
  const phW = phH * (9 / 16);
  const phX = (w - phW) / 2;
  const phY = (h - phH) / 2;
  const ps = phH / 1920; // inner scale (design space 1080x1920)
  const enter = backOut(prog(f, 0, intro, ease.linear), 1.2);

  const frameImg = (i: number) => (imgs.length ? imgs[i % imgs.length] : undefined);

  const caption = (i: number) => (p.captions && p.captions.length ? p.captions[i % p.captions.length] : '');
  const capSize = 56 * ps;
  const capLines = (i: number) => wrapText(caption(i), capSize, phW * 0.76, 'sans', 3);

  const pic = (i: number, k: number, zoomP: number, dx: number, op: number, key: string) => (
    <div key={key} style={{position: 'absolute', inset: 0, transform: `translateX(${dx * phW}px)`, opacity: op}}>
      <Pic src={frameImg(i)} seed={7 + i * 13} palette={i * 3 + 1} id={`spf${i}${key}`} imgStyle={{transform: `scale(${1 + 0.07 * zoomP})`}} />
    </div>
  );

  const zoomCur = Math.min(1, inFrame / hold);
  const tapT = prog(inFrame, 0, 16, ease.out);
  const showTap = cur > 0 && inFrame < 16;

  return (
    <AbsoluteFill style={{background: bgOf(p.background)}}>
      {/* blurred wash behind the phone (landscape / square) */}
      {!portrait && p.background !== 'transparent' && (
        <div style={{position: 'absolute', inset: -80, filter: 'blur(60px) saturate(1.2)', opacity: 0.55, transform: 'scale(1.3)'}}>
          <Pic src={frameImg(cur)} seed={7 + cur * 13} palette={cur * 3 + 1} id="spfbg" />
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          left: phX,
          top: phY + (1 - enter) * 40,
          width: phW,
          height: phH,
          borderRadius: 78 * ps,
          overflow: 'hidden',
          background: bg,
          opacity: Math.min(1, enter * 1.6),
          boxShadow: `0 ${30 * ps}px ${90 * ps}px rgba(0,0,0,0.45), 0 0 0 ${5 * ps}px ${withAlpha(p.ink, 0.18)}`,
          fontFamily: SANS,
        }}
      >
        {/* frames */}
        <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
          {cur > 0 && tIn < 1 && pic(prev, 1, 1, -0.32 * tIn, 1 - tIn * 0.6, 'p')}
          {pic(cur, 1, zoomCur, cur > 0 ? (1 - tIn) * 1.0 : 0, 1, 'c')}
        </div>
        {/* scrims */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: '24%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0))'}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: '34%', background: 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))'}} />

        {/* progress segments */}
        <div style={{position: 'absolute', left: 36 * ps, right: 36 * ps, top: 38 * ps, display: 'flex', gap: 10 * ps}}>
          {Array.from({length: n}, (_, i) => {
            const fillT = i < cur ? 1 : i === cur ? Math.min(1, inFrame / hold) : 0;
            return (
              <div key={i} style={{flex: 1, height: 9 * ps, borderRadius: 9 * ps, background: 'rgba(255,255,255,0.35)', overflow: 'hidden'}}>
                <div style={{width: `${fillT * 100}%`, height: '100%', background: p.accent === 'auto' ? '#ffffff' : p.accent, borderRadius: 9 * ps}} />
              </div>
            );
          })}
        </div>

        {/* header */}
        <div style={{position: 'absolute', left: 40 * ps, right: 40 * ps, top: 86 * ps, display: 'flex', alignItems: 'center', gap: 22 * ps}}>
          <div
            style={{
              width: 100 * ps,
              height: 100 * ps,
              borderRadius: '50%',
              background: avatarColor(p.handle),
              border: `${5 * ps}px solid #ffffff`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 40 * ps,
            }}
          >
            {initials(p.handle.replace('@', ''))}
          </div>
          <div style={{color: '#fff', fontWeight: 800, fontSize: 44 * ps, textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>{p.handle}</div>
          <div style={{color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: 38 * ps}}>{p.timeAgo}</div>
          <div style={{marginLeft: 'auto', display: 'flex', gap: 10 * ps}}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{width: 11 * ps, height: 11 * ps, borderRadius: '50%', background: '#fff', opacity: 0.85}} />
            ))}
          </div>
        </div>

        {/* caption pill */}
        {(() => {
          const ln = capLines(cur);
          if (!ln.length) return null;
          const capIn = ease.out(prog(inFrame, 6, 22, ease.linear));
          const out = cur < n - 1 ? 1 - ease.in(prog(inFrame, hold - 8, hold, ease.linear)) : 1;
          return (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                bottom: (p.showReplyBar ? 360 : 230) * ps,
                transform: `translateX(-50%) translateY(${(1 - capIn) * 30 * ps}px) scale(${lerp(0.92, 1, capIn)})`,
                opacity: capIn * out,
                background: p.captionColor,
                color: p.captionInk,
                borderRadius: 38 * ps,
                padding: `${26 * ps}px ${40 * ps}px`,
                fontWeight: 800,
                fontSize: capSize,
                lineHeight: 1.22,
                textAlign: 'center',
                maxWidth: phW * 0.84,
                boxShadow: `0 ${12 * ps}px ${36 * ps}px rgba(0,0,0,0.3)`,
              }}
            >
              {ln.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          );
        })()}

        {/* reply bar */}
        {p.showReplyBar && (
          <div style={{position: 'absolute', left: 40 * ps, right: 40 * ps, bottom: 70 * ps, display: 'flex', alignItems: 'center', gap: 28 * ps}}>
            <div style={{flex: 1, height: 130 * ps, borderRadius: 65 * ps, border: `${4 * ps}px solid rgba(255,255,255,0.8)`, display: 'flex', alignItems: 'center', paddingLeft: 48 * ps, color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: 46 * ps}}>
              {p.replyLabel}
            </div>
            <svg width={96 * ps} height={96 * ps} viewBox="0 0 24 24">
              <path d="M12 20.5 C4 15 2.6 10.6 4.6 7.4 C6.4 4.6 10.4 5 12 8.2 C13.6 5 17.6 4.6 19.4 7.4 C21.4 10.6 20 15 12 20.5Z" fill="none" stroke="#fff" strokeWidth={1.7} strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* tap ripple on the right edge */}
        {showTap && (
          <div
            style={{
              position: 'absolute',
              right: 90 * ps,
              top: '50%',
              width: 190 * ps,
              height: 190 * ps,
              marginTop: -95 * ps,
              borderRadius: '50%',
              border: `${8 * ps}px solid rgba(255,255,255,0.9)`,
              background: 'rgba(255,255,255,0.18)',
              transform: `scale(${lerp(0.35, 1.25, tapT)})`,
              opacity: 1 - tapT,
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};

export const storyProgressFrames = defineMotion<Props>({
  id: 'story-progress-frames',
  title: 'Story progress frames',
  category: 'ui',
  description: 'A vertical story player in a rounded 9:16 frame: segmented progress bars fill one by one, a handle header, tap-through between frames with a tap ripple and a slide, and a caption pill per frame. Uses your images or procedural scenes.',
  source: ['original (round 3, social & marketing)'],
  useFor: 'Story / reel mockups, "swipe through" product tours, social recaps, vertical slideshow promos and app-store style feature walk-throughs.',
  durationInFrames: 300,
  defaultProps: {
    images: [],
    captions: ['Chapter one: the idea', 'Chapter two: the build', 'Chapter three: the launch', 'Thanks for watching'],
    frameCount: 4,
    holdFrames: 68,
    handle: '@yourhandle',
    timeAgo: '2h',
    replyLabel: 'Send a message',
    background: '#101018',
    ink: '#ffffff',
    accent: 'auto',
    captionColor: '#ffffff',
    captionInk: '#14141C',
    showReplyBar: true,
    startAt: 0,
  },
  propDocs: {
    images: 'public/ image paths, one per frame (empty = procedural scenes; then frameCount applies)',
    captions: 'one caption pill per frame (cycles)',
    frameCount: 'number of frames when no images are given',
    holdFrames: 'frames each story frame is shown (the progress bar fills over this)',
    handle: 'account handle in the header (drives the avatar initials)',
    timeAgo: 'small age label next to the handle',
    replyLabel: 'text in the reply bar',
    background: 'frame colour behind the phone, or "transparent"',
    ink: 'outline tone around the phone',
    accent: 'progress fill colour or "auto" (white)',
    captionColor: 'caption pill fill',
    captionInk: 'caption text colour',
    showReplyBar: 'show the bottom reply bar',
    startAt: 'frame the sequence begins',
  },
  component: StoryProgressFrames,
  tags: ['social', 'story', 'stories', 'reel', 'vertical', 'progress', 'slideshow', 'phone', 'tap', 'captions', 'swipe'],
});
