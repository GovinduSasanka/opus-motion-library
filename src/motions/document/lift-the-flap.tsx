import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {INK3, x14Fonts} from '../../core/r2-x14-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * x3 "lift the flap": on a textbook page a PREDICT question gets its answer ticked, a cursor taps the cream
 * paper flap ("Lift the flap to see the answer" + a hand-drawn "lift here" arrow), the corner peeks, then the
 * flap flips up about its top edge toward the viewer in ≈ 0.15 s (0 → 160°, real CSS 3D perspective, darker
 * underside, growing shadow), folds away into a small tab and reveals the answer printed underneath; a marker
 * sweep highlights the key sentence and a handwritten margin note pops in.
 */

type Props = {
  header: string;
  eyebrow: string;
  question: string;
  options: string[];
  tick: number;
  flapEyebrow: string;
  flapTitle: string;
  flapSub: string;
  hint: string;
  answer: string;
  highlight: string;
  note: string;
  openAt: number;
  frames: number;
  cursor: boolean;
  background: string;
  flapColor: string;
  undersideColor: string;
  ink: string;
  accent: string;
  markerColor: string;
};

const ARROW_D = 'M0 0 L0 22 L5.5 17 L9.5 26 L13 24.4 L9 15.6 L16 15.6 Z';

const LiftTheFlap: React.FC<Props> = ({
  header,
  eyebrow,
  question,
  options,
  tick,
  flapEyebrow,
  flapTitle,
  flapSub,
  hint,
  answer,
  highlight,
  note,
  openAt,
  frames,
  cursor,
  background,
  flapColor,
  undersideColor,
  ink,
  accent,
  markerColor,
}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const serif = x14Fonts.bookSerif;
  const serifI = x14Fonts.bookSerifItalic;
  const cw = Math.min(1320 * u, w - (portrait ? 110 : 160) * u);
  const left = (w - cw) / 2;
  const push = lerp(1.05, 1, prog(frame, 0, 24, ease.out)) + 0.015 * prog(frame, 24, 400, ease.linear);

  // flap angle: peek (anticipation) -> flip -> settle -> fold away
  const peek = prog(frame, openAt - 12, openAt - 6, ease.inOut) * (1 - prog(frame, openAt - 6, openAt - 2, ease.inOut));
  const flip = prog(frame, openAt, openAt + frames, ease.inOut);
  const sway = Math.sin(clamp((frame - openAt - frames) / 10) * Math.PI) * -6;
  const foldStart = openAt + frames + 12;
  const fold = prog(frame, foldStart, foldStart + 10, ease.inOut);
  const theta = (peek * 8 + flip * 160 + sway + fold * 20);
  const flapScale = 1 - fold * 0.9;
  const flapGone = fold >= 1;
  const tabP = prog(frame, foldStart + 6, foldStart + 12, ease.back);
  const shadow = Math.sin((Math.min(theta, 180) / 180) * Math.PI) * (1 - fold);

  // answer life
  const revealAt = openAt + frames;
  const mark = prog(frame, revealAt + 18, revealAt + 34, ease.inOut);
  const noteP = prog(frame, revealAt + 36, revealAt + 46, ease.back);
  const hiIdx = highlight ? answer.indexOf(highlight) : -1;

  // question block life
  const optP = (i: number) => prog(frame, 6 + i * 4, 16 + i * 4, ease.out);
  const tickP = prog(frame, 22, 32, ease.inOut);

  // cursor path: in from the lower right, to the "lift here" corner, click, then away
  const cIn = prog(frame, openAt - 34, openAt - 10, ease.inOut);
  const cOut = prog(frame, revealAt + 10, revealAt + 34, ease.inOut);
  const press = frame >= openAt - 3 && frame < openAt + 2 ? 0.86 : 1;

  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${push})`}}>
        {/* page fibre + gutter shade + soft vignette */}
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <filter id="ltf-fib">
            <feTurbulence type="fractalNoise" baseFrequency={0.7 / Math.max(0.5, u)} numOctaves={2} seed={5} />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.08" />
            </feComponentTransfer>
          </filter>
          <rect width={w} height={h} filter="url(#ltf-fib)" />
        </svg>
        <AbsoluteFill style={{background: portrait ? 'none' : 'linear-gradient(90deg, rgba(0,0,0,0) 80%, rgba(0,0,0,0.09) 100%)'}} />
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 45% 40%, rgba(0,0,0,0) 55%, rgba(60,50,30,0.12) 100%)'}} />

        {header ? (
          <div style={{position: 'absolute', left, top: h * 0.07, fontFamily: serif, fontSize: 20 * u, letterSpacing: '0.2em', color: '#9A958C', opacity: prog(frame, 0, 12)}}>{header}</div>
        ) : null}
        {header ? (
          <div style={{position: 'absolute', left, width: cw, bottom: h * 0.06, fontFamily: serif, fontSize: 20 * u, color: '#9A958C', borderTop: `${1 * u}px solid #D6D1C6`, paddingTop: 12 * u, opacity: prog(frame, 0, 12)}}>4</div>
        ) : null}
        <div style={{position: 'absolute', left, width: cw, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: serif, color: INK3.body}}>
          {/* PREDICT block */}
          <div style={{fontSize: 24 * u, letterSpacing: '0.18em', fontWeight: 600, color: accent, textTransform: 'uppercase'}}>{eyebrow}</div>
          <div style={{fontSize: 54 * u, lineHeight: 1.3, color: ink, marginTop: 10 * u, maxWidth: cw * 0.92}}>{question}</div>
          <div style={{marginTop: 16 * u, marginBottom: 44 * u}}>
            {options.map((o, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16 * u, fontSize: 40 * u, lineHeight: 1.55, fontFamily: serifI, fontStyle: 'italic', opacity: optP(i), transform: `translateX(${(1 - optP(i)) * 10 * u}px)`}}>
                <svg width={32 * u} height={32 * u} viewBox="0 0 26 26" style={{flex: 'none', overflow: 'visible'}}>
                  <rect x={1} y={1} width={24} height={24} rx={2} fill="none" stroke="#6E6A62" strokeWidth={1.8} />
                  {i === tick ? (
                    <path d="M4 13 L11 21 L30 -4" fill="none" stroke={ink} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tickP} />
                  ) : null}
                </svg>
                <span>{o}</span>
              </div>
            ))}
          </div>

          {/* WHY box: answer printed underneath, flap on top */}
          <div style={{position: 'relative', marginLeft: portrait ? 0 : 0.06 * cw, perspective: 2600 * u, perspectiveOrigin: '50% 0%'}}>
            <div style={{background: '#F6F3EC', border: `${1.5 * u}px solid #CFC7B7`, padding: `${34 * u}px ${44 * u}px ${40 * u}px`}}>
              <div style={{fontSize: 24 * u, letterSpacing: '0.16em', fontWeight: 600, color: '#B0372C', textTransform: 'uppercase', marginBottom: 10 * u}}>{flapEyebrow}</div>
              <div style={{fontSize: 40 * u, lineHeight: 1.5, color: ink}}>
                {hiIdx >= 0 ? (
                  <>
                    {answer.slice(0, hiIdx)}
                    <span style={{position: 'relative', zIndex: 0, fontWeight: 600}}>
                      <span
                        style={{
                          position: 'absolute',
                          left: -4 * u,
                          right: -4 * u,
                          top: '18%',
                          bottom: '6%',
                          background: markerColor,
                          opacity: 0.6,
                          borderRadius: 3 * u,
                          transformOrigin: '0% 50%',
                          transform: `scaleX(${mark}) skewX(-8deg)`,
                          zIndex: -1,
                        }}
                      />
                      <span style={{position: 'relative'}}>{highlight}</span>
                    </span>
                    {answer.slice(hiIdx + highlight.length)}
                  </>
                ) : (
                  answer
                )}
              </div>
              {note ? (
                <div
                  style={{
                    position: 'absolute',
                    right: 18 * u,
                    bottom: -42 * u,
                    fontFamily: fonts.hand,
                    fontSize: 46 * u,
                    color: '#B0372C',
                    transform: `rotate(-4deg) scale(${noteP})`,
                    opacity: clamp(noteP * 1.5),
                    transformOrigin: '100% 50%',
                  }}
                >
                  {note}
                </div>
              ) : null}
            </div>
            {/* shadow the lifting flap casts on the answer */}
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(40,30,20,0.35), rgba(40,30,20,0) 70%)', opacity: shadow * 0.8, pointerEvents: 'none'}} />
            {/* the small tab that remains */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: -2 * u,
                width: 120 * u,
                height: 22 * u,
                marginLeft: -60 * u,
                background: `linear-gradient(180deg, ${undersideColor}, ${flapColor})`,
                border: `${1.2 * u}px solid #CDC5B5`,
                borderTop: 'none',
                borderRadius: `0 0 ${6 * u}px ${6 * u}px`,
                transform: `scaleY(${tabP})`,
                transformOrigin: '50% 0%',
                boxShadow: `0 ${2 * u}px ${4 * u}px rgba(0,0,0,0.12)`,
              }}
            />
            {!flapGone ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  transformStyle: 'preserve-3d',
                  transformOrigin: '50% 0%',
                  transform: `scaleY(${flapScale}) rotateX(${theta}deg)`,
                }}
              >
                {/* front */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    background: flapColor,
                    border: `${1.5 * u}px solid #CDC5B5`,
                    boxShadow: `0 ${2 * u + theta * 0.4 * u}px ${4 * u + theta * 0.6 * u}px rgba(0,0,0,${0.1 + 0.15 * Math.min(1, theta / 40)})`,
                    padding: `${34 * u}px ${44 * u}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{fontSize: 24 * u, letterSpacing: '0.16em', fontWeight: 600, color: '#B0372C', textTransform: 'uppercase', marginBottom: 8 * u}}>{flapEyebrow}</div>
                  <div style={{fontSize: 58 * u, fontWeight: 600, color: ink, lineHeight: 1.2, maxWidth: cw * 0.7}}>{flapTitle}</div>
                  <div style={{fontSize: 38 * u, fontFamily: serifI, fontStyle: 'italic', color: '#6A665E', marginTop: 8 * u}}>{flapSub}</div>
                  <div style={{position: 'absolute', right: 44 * u, top: 26 * u, fontFamily: fonts.hand, fontSize: 46 * u, color: ink}}>{hint}</div>
                  <svg width={84 * u} height={84 * u} viewBox="0 0 70 70" style={{position: 'absolute', right: 40 * u, top: 80 * u, overflow: 'visible'}}>
                    <path
                      d="M8 6 C 22 22, 40 40, 60 58 M60 58 l-18 -2 M60 58 l-2 -18"
                      stroke={ink}
                      strokeWidth={2.6}
                      fill="none"
                      strokeLinecap="round"
                      transform={`translate(${Math.sin(frame * 0.35) * 2 * (frame < openAt ? 1 : 0)} ${Math.sin(frame * 0.35) * 2 * (frame < openAt ? 1 : 0)})`}
                    />
                  </svg>
                </div>
                {/* underside (darker paper, faint show-through) */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateX(180deg)',
                    background: `linear-gradient(180deg, ${undersideColor} 0%, rgba(0,0,0,0) 100%), ${undersideColor}`,
                    border: `${1.5 * u}px solid #BDB4A2`,
                    boxShadow: `inset 0 ${-30 * u}px ${40 * u}px rgba(0,0,0,0.12)`,
                  }}
                />
              </div>
            ) : null}
            {cursor && cIn > 0 && cOut < 1 ? (
              <svg
                width={30 * u}
                height={44 * u}
                viewBox="0 0 18 28"
                style={{
                  position: 'absolute',
                  overflow: 'visible',
                  zIndex: 5,
                  right: 70 * u - (1 - cIn) * 420 * u - cOut * 300 * u,
                  top: 96 * u + (1 - cIn) * 520 * u + cOut * 260 * u,
                  opacity: 1 - cOut,
                  transform: `scale(${press})`,
                  transformOrigin: '0 0',
                }}
              >
                <path d={ARROW_D} fill="#fff" stroke="#111" strokeWidth={1.3} strokeLinejoin="round" />
              </svg>
            ) : null}
          </div>
        </div>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};

export const liftTheFlap = defineMotion<Props>({
  id: 'lift-the-flap',
  title: 'Lift the flap',
  category: 'document',
  description:
    'Textbook page: a PREDICT question gets its answer ticked, a cursor taps a cream paper flap ("Lift the flap to see the answer", hand-drawn "lift here" arrow), the corner peeks, then the flap flips up about its top edge toward the viewer in ≈ 0.15 s with a darker underside and a growing shadow, folds away into a small tab and reveals the printed answer; a marker sweep highlights the key phrase and a handwritten note pops in.',
  source: ['video x3 19.55-19.80 (lift-the-flap)', 'video x3 13.5-22.0 (predict / why cards)'],
  useFor: 'Quiz and answer reveals, "before you guess…" moments, myth-vs-fact beats and interactive-feeling explainers.',
  durationInFrames: 150,
  defaultProps: {
    header: 'ENERGY · LESSON 1',
    eyebrow: 'Predict',
    question: 'A book slides off the shelf and lands on the floor. Where is its energy now?',
    options: ['It has been used up', 'In the thermal stores around it', 'Still in its gravitational store'],
    tick: 1,
    flapEyebrow: 'Why?',
    flapTitle: 'Lift the flap to see the answer',
    flapSub: '…after you have made your prediction.',
    hint: 'lift here',
    answer:
      'Nothing is used up. As the book falls, its gravitational store empties into its kinetic store; when it lands, that energy spreads into the thermal stores of the floor and the air, and a little leaves as sound.',
    highlight: 'Nothing is used up.',
    note: 'you were right!',
    openAt: 60,
    frames: 5,
    cursor: true,
    background: INK3.paper,
    flapColor: INK3.flap,
    undersideColor: INK3.flapUnder,
    ink: INK3.heading,
    accent: INK3.eyebrow,
    markerColor: '#F2D57E',
  },
  propDocs: {
    header: 'faint running head at the top of the page ("" hides it and the page rule)',
    eyebrow: 'small caps label above the question ("" hides it)',
    question: 'the question asked before the reveal',
    options: 'answer choices with checkboxes ([] hides them)',
    tick: 'index of the option that gets ticked (-1 = none)',
    flapEyebrow: 'small caps label on the flap and above the answer',
    flapTitle: 'big line printed on the flap',
    flapSub: 'italic line under it',
    hint: 'handwritten hint next to the arrow',
    answer: 'answer paragraph printed under the flap',
    highlight: 'part of the answer that gets a marker sweep ("" = none)',
    note: 'handwritten margin note after the reveal ("" = none)',
    openAt: 'frame the flap flips up',
    frames: 'flip duration in frames (5 ≈ 0.15 s, the source)',
    cursor: 'show the pointer that taps the flap',
    background: 'page paper colour',
    flapColor: 'flap paper colour',
    undersideColor: 'flap underside colour',
    ink: 'text ink colour',
    accent: 'eyebrow colour',
    markerColor: 'highlighter colour',
  },
  component: LiftTheFlap,
  tags: ['flap', 'reveal', 'quiz', 'answer', 'paper', 'flip', '3d', 'textbook', 'education', 'predict', 'question', 'interactive', 'highlight', 'handwritten', 'cursor', 'myth vs fact'],
});
