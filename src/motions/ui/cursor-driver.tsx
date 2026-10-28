import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {CursorGlyph, CursorKey, RippleRing, clamp01, cursorAt, cursorEvents} from '../../core/r2-pr1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A macOS-style pointer (or hand / touch dot) that is OPERATED rather than animated: it glides along gently bowed
 * cubic-bezier hops (0.45,0,0.2,1, ~18 f), presses with a 0.88x squash plus a 48 px ripple ring, drags a slider and
 * types into a field. Use it as an overlay (`demo:false`, `background:'transparent'`) over any UI motion with your own
 * `keys`, or leave the demo UI on: a small settings card that reacts to the cursor (field text, slider, toggle, button).
 * Host motions can read the same keys with `cursorEvents(keys)` / `useCursorEvents()` from src/core/r2-pr1-kit.tsx.
 */

type Props = {
  keys: CursorKey[];
  style: 'arrow' | 'hand' | 'touch';
  color: string;
  size: number;
  rippleColor: string;
  demo: boolean;
  demoText: string;
  cardTitle?: string;
  cardSubtitle?: string;
  fieldPlaceholder?: string;
  sliderLabel?: string;
  sliderUnit?: string;
  sliderMin?: number;
  sliderMax?: number;
  toggleLabel?: string;
  buttonLabel?: string;
  savedLabel?: string;
  accent: string;
  background: string;
  dark: boolean;
};

const CursorDriver: React.FC<Props> = ({keys, style, color, size, rippleColor, demo, demoText, cardTitle, cardSubtitle, fieldPlaceholder, sliderLabel, sliderUnit, sliderMin = 1, sliderMax = 30, toggleLabel, buttonLabel, savedLabel, accent, background, dark}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();

  // ---- demo card geometry (px)
  const cw = portrait ? w * 0.86 : 900 * u;
  const ch = portrait ? 780 * u : 640 * u;
  const cx = w / 2;
  const cy = h / 2;
  const left = cx - cw / 2;
  const top = cy - ch / 2;
  const pad = 56 * u;
  const fieldY = top + 190 * u;
  const sliderY = top + 330 * u;
  const toggleY = top + 440 * u;
  const btnY = top + ch - 86 * u;
  const sx0 = left + pad + 4 * u;
  const sx1 = left + cw - pad - 4 * u;
  const pctX = (x: number) => (x / w) * 100;
  const pctY = (y: number) => (y / h) * 100;
  const knobAt = (v: number) => lerp(sx0, sx1, v);
  const toggleX = left + cw - pad - 40 * u;

  const autoKeys: CursorKey[] = [
    {frame: 0, x: pctX(left + cw * 0.96), y: pctY(top + ch * 1.04), action: 'move'},
    {frame: 30, x: pctX(left + cw * 0.5), y: pctY(fieldY), action: 'click', target: 'field'},
    {frame: 52, x: pctX(left + cw * 0.5), y: pctY(fieldY), action: 'type', text: demoText, target: 'field'},
    {frame: 126, x: pctX(knobAt(0.25)), y: pctY(sliderY), action: 'move', target: 'slider'},
    {frame: 168, x: pctX(knobAt(0.78)), y: pctY(sliderY), action: 'drag', target: 'slider'},
    {frame: 202, x: pctX(toggleX), y: pctY(toggleY), action: 'click', target: 'toggle'},
    {frame: 238, x: pctX(cx), y: pctY(btnY), action: 'click', target: 'button'},
    {frame: 274, x: pctX(cx + cw * 0.2), y: pctY(btnY + 120 * u), action: 'move'},
  ];
  const ks = keys.length ? keys : demo ? autoKeys : [];
  const st = cursorAt(ks, frame, w, h);
  const evs = cursorEvents(ks);

  // ---- demo reactions
  const tFrame = (target: string, kind: string) => evs.find((e) => e.target === target && e.kind === kind);
  const dragEv = tFrame('slider', 'drag');
  let sliderV = 0.25;
  if (dragEv) {
    const vEnd = clamp01((dragEv.x / 100 * w - sx0) / (sx1 - sx0));
    if (frame >= dragEv.end) sliderV = vEnd;
    else if (st.drag) sliderV = clamp01((st.x - sx0) / (sx1 - sx0));
    else if (frame > dragEv.frame) sliderV = vEnd;
  }
  const typeEv = tFrame('field', 'type');
  const typedText = st.typing?.target === 'field' ? st.typing.text : typeEv && frame > typeEv.end ? typeEv.text ?? '' : '';
  const togEv = tFrame('toggle', 'click');
  const tog = togEv ? prog(frame, togEv.frame + 2, togEv.frame + 12, ease.out) : 0;
  const btnEv = tFrame('button', 'click');
  const btnDone = btnEv ? prog(frame, btnEv.frame + 2, btnEv.frame + 12, ease.out) : 0;
  const btnPress = btnEv && frame >= btnEv.frame && frame < btnEv.frame + 8 ? 0.96 : 1;
  const fieldFocus = typeEv || tFrame('field', 'click') ? prog(frame, 28, 36) * (1 - prog(frame, 128, 140)) : 0;

  const bg = background === 'transparent' ? 'transparent' : background;
  const ink = dark ? '#F2F0EA' : '#1B1B1F';
  const card = dark ? '#1C1D22' : '#FFFFFF';
  const line = dark ? 'rgba(255,255,255,0.14)' : 'rgba(20,20,30,0.14)';
  const drift = st.moving ? 0 : 1;
  const px = st.x + Math.sin(frame * 0.11) * 1.6 * u * drift;
  const py = st.y + Math.cos(frame * 0.09) * 1.4 * u * drift;
  const enter = clamp01(prog(frame, 0, 8));

  return (
    <AbsoluteFill style={{background: bg}}>
      {demo ? (
        <>
          <div
            style={{
              position: 'absolute',
              left,
              top,
              width: cw,
              height: ch,
              borderRadius: 34 * u,
              background: card,
              boxShadow: dark ? '0 30px 80px rgba(0,0,0,0.5)' : '0 30px 70px rgba(40,35,25,0.14), 0 3px 10px rgba(40,35,25,0.06)',
              fontFamily: fonts.sans,
              color: ink,
              opacity: prog(frame, 0, 12),
            }}
          >
            <div style={{position: 'absolute', left: pad, top: 56 * u, fontSize: 38 * u, fontWeight: 800, letterSpacing: '-0.02em'}}>{cardTitle}</div>
            <div style={{position: 'absolute', left: pad, top: 112 * u, fontSize: 21 * u, opacity: 0.5}}>{cardSubtitle}</div>
            {/* field */}
            <div
              style={{
                position: 'absolute',
                left: pad,
                width: cw - pad * 2,
                top: fieldY - top - 38 * u,
                height: 76 * u,
                borderRadius: 18 * u,
                border: `${2.5 * u}px solid ${fieldFocus > 0.5 ? accent : line}`,
                boxShadow: fieldFocus > 0.5 ? `0 0 0 ${6 * u}px ${accent}33` : 'none',
                display: 'flex',
                alignItems: 'center',
                padding: `0 ${24 * u}px`,
                fontSize: 27 * u,
                fontFamily: fonts.sans,
              }}
            >
              {typedText ? (
                <span>
                  {typedText}
                  <span style={{opacity: Math.floor(frame / 8) % 2 ? 0 : 1, color: accent}}>|</span>
                </span>
              ) : (
                <span style={{opacity: 0.35}}>
                  {fieldPlaceholder}
                  {fieldFocus > 0.5 ? <span style={{opacity: Math.floor(frame / 8) % 2 ? 0 : 1, color: accent}}>|</span> : null}
                </span>
              )}
            </div>
            {/* slider */}
            <div style={{position: 'absolute', left: sx0 - left, width: sx1 - sx0, top: sliderY - top - 4 * u, height: 8 * u, borderRadius: 4 * u, background: line}} />
            <div style={{position: 'absolute', left: sx0 - left, width: (sx1 - sx0) * sliderV, top: sliderY - top - 4 * u, height: 8 * u, borderRadius: 4 * u, background: accent}} />
            <div
              style={{
                position: 'absolute',
                left: knobAt(sliderV) - left - 18 * u,
                top: sliderY - top - 18 * u,
                width: 36 * u,
                height: 36 * u,
                borderRadius: 18 * u,
                background: '#fff',
                border: `${3 * u}px solid ${accent}`,
                boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
                transform: `scale(${st.drag ? 1.18 : 1})`,
              }}
            />
            <div style={{position: 'absolute', left: pad, top: sliderY - top - 56 * u, fontSize: 21 * u, opacity: 0.55}}>{sliderLabel} · {Math.round(lerp(sliderMin, sliderMax, sliderV))} {sliderUnit}</div>
            {/* toggle */}
            <div style={{position: 'absolute', left: pad, top: toggleY - top - 16 * u, fontSize: 27 * u}}>{toggleLabel}</div>
            <div style={{position: 'absolute', left: toggleX - left - 40 * u, top: toggleY - top - 22 * u, width: 80 * u, height: 44 * u, borderRadius: 22 * u, background: tog > 0.5 ? accent : line, transition: 'none', opacity: 1}} />
            <div style={{position: 'absolute', left: toggleX - left - 40 * u + lerp(4, 40, tog) * u, top: toggleY - top - 18 * u, width: 36 * u, height: 36 * u, borderRadius: 18 * u, background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.25)'}} />
            {/* button */}
            <div
              style={{
                position: 'absolute',
                left: cw / 2 - 150 * u,
                top: btnY - top - 38 * u,
                width: 300 * u,
                height: 76 * u,
                borderRadius: 38 * u,
                background: btnDone > 0.5 ? '#1F9D6B' : accent,
                color: '#fff',
                fontSize: 27 * u,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${btnPress})`,
              }}
            >
              {btnDone > 0.5 ? savedLabel : buttonLabel}
            </div>
          </div>
        </>
      ) : null}
      {/* cursor overlay */}
      {ks.length ? (
        <Svg>
          {st.ripples.map((r, i) => (
            <RippleRing key={i} x={r.x} y={r.y} age={r.age} u={u} color={rippleColor} />
          ))}
          <g transform={`translate(${px} ${py})`} opacity={enter} style={{filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))'}}>
            <CursorGlyph style={style} size={size * u} color={color} press={st.press} rippleColor={rippleColor} />
          </g>
        </Svg>
      ) : null}
    </AbsoluteFill>
  );
};

export const cursorDriver = defineMotion<Props>({
  id: 'cursor-driver',
  title: 'Cursor driver (operated UI)',
  category: 'ui',
  description:
    'A pointer glides on bowed ease-in-out hops, presses with a 0.88x squash and a ripple ring, drags a slider and types into a field, so UI demos look operated. With the demo card on, the settings UI reacts to it (field text, slider, toggle, save button); with `demo:false` and a transparent background it is a pure overlay for your own keys.',
  source: ['prompt-corpus: cursor-driver (36 cases)', 'awesome-opus5-5-videos prompts (MIT) — technique only'],
  useFor: 'Every UI demo, SaaS launch, tutorial and app preview: lay it over browser-mockup / device-mockup / ui-shape-morph with keys in % of the frame; key host reactions off `cursorEvents(keys)`.',
  durationInFrames: 300,
  defaultProps: {
    keys: [],
    style: 'arrow',
    color: '#111111',
    size: 34,
    rippleColor: '#4F5BD5',
    demo: true,
    demoText: 'hello@northwind.co',
    cardTitle: 'Notification settings',
    cardSubtitle: 'Where should we send your weekly summary?',
    fieldPlaceholder: 'you@company.com',
    sliderLabel: 'Frequency',
    sliderUnit: 'days',
    sliderMin: 1,
    sliderMax: 30,
    toggleLabel: 'Product updates',
    buttonLabel: 'Save changes',
    savedLabel: 'Saved ✓',
    accent: '#4F5BD5',
    background: '#EDEBE7',
    dark: false,
  },
  propDocs: {
    keys: "[{frame (arrival), x, y (% of frame), action:'move'|'click'|'drag'|'type', text?, target?}] — empty = the built-in demo track",
    style: "'arrow' | 'hand' | 'touch'",
    color: 'cursor fill colour',
    size: 'cursor height in u',
    rippleColor: 'click ripple colour',
    demo: 'draw the reactive demo settings card under the cursor',
    demoText: 'text typed into the demo field',
    cardTitle: 'demo card heading',
    cardSubtitle: 'demo card sub line',
    fieldPlaceholder: 'grey placeholder in the demo field before typing',
    sliderLabel: 'label of the demo slider ("<label> · N <unit>")',
    sliderUnit: 'unit word after the slider value',
    sliderMin: 'slider value at the left end',
    sliderMax: 'slider value at the right end',
    toggleLabel: 'label of the demo toggle',
    buttonLabel: 'demo button label before the click',
    savedLabel: 'demo button label after the click',
    accent: 'demo UI accent',
    background: "canvas colour; 'transparent' for overlay use",
    dark: 'dark demo card',
  },
  component: CursorDriver,
  tags: ['cursor', 'pointer', 'mouse', 'click', 'drag', 'type', 'typing', 'ripple', 'ui demo', 'saas', 'tutorial', 'app preview', 'walkthrough', 'overlay', 'screen recording', 'hand', 'touch'],
});
