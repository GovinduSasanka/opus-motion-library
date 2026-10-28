// Adapted from lemo-opuscar/styles/living-screencast/demo/film.js (Actor jump arc, squash, blink) + clawd.js sprite-grid idea (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
// The mascot sprite here is an original character, not the one from the source demo.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {backOut, cl, eio3, h1, lerp, lf, mixC, seg, textW} from '../../core/r2-la3-kit';
import {PixelSprite, spritePaths} from '../../core/r2-la3b-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Step = {to: string; x: number; at: number};
type Props = {
  steps: Step[];
  sprite: string[];
  spritePalette: Record<string, string>;
  title: string;
  doneTitle: string;
  inputText: string;
  placeholder: string;
  rows: string[];
  button: string;
  doneButton: string;
  accent: string;
  wallpaper: string[];
  bpm: number;
  spritePx: number;
  windowTitle: string;
};

const SPRITE = ['..a......a..', '.aa......aa.', '.bbbbbbbbbb.', 'bbbbbbbbbbbb', 'bbeebbbbeebb', 'bbeebbbbeebb', 'bcbbbbbbbbcb', 'bbbbbbbbbbbb', '.bsssssssss.', '..ll....ll..'];
const PENCIL = ['.....pp', '....pyp', '...pyp.', '..pyp..', '.pyp...', 'typ....', 'tt.....'];
const HEART = ['.hh.hh.', 'hhhhhhh', 'hhhhhhh', '.hhhhh.', '..hhh..', '...h...'];

const mod = (a: number, n: number) => ((a % n) + n) % n;

const PixelMascotOnUi: React.FC<Props> = ({steps, sprite, spritePalette, title, doneTitle, inputText, placeholder, rows, button, doneButton, accent, wallpaper, bpm, spritePx, windowTitle = 'Tasks'}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame / 30;

  // ------------------------------------------------------------------ design space (UI is crisp; mascot is chunky)
  const DW = portrait ? 640 : 1100;
  const DH = portrait ? 900 : 640;
  const mx = portrait ? 46 : 70;
  const iy = portrait ? 300 : 236;
  const ry0 = portrait ? 392 : 326;
  const rstep = portrait ? 76 : 62;
  const rh = portrait ? 60 : 50;
  const by = DH - (portrait ? 150 : 80);
  const bw = 156;
  const headW = textW(title.length > doneTitle.length ? title : doneTitle, 56, 0.5);
  const anchors: Record<string, {x0: number; x1: number; y: number}> = {
    heading: {x0: mx, x1: mx + headW, y: iy - 84},
    input: {x0: mx, x1: DW - mx, y: iy},
    button: {x0: DW - mx - bw, x1: DW - mx, y: by},
  };
  rows.forEach((_, i) => (anchors['row' + i] = {x0: mx, x1: DW - mx, y: ry0 + i * rstep}));
  const SP = spritePx;
  const place = (st: Step) => {
    const a = anchors[st.to] ?? anchors.input;
    return {x: lerp(a.x0 + 6 * SP, a.x1 - 6 * SP, cl(st.x)), y: a.y, name: st.to};
  };

  // ------------------------------------------------------------------ actor timeline from the steps
  const ordered = [...steps].sort((a, b) => a.at - b.at);
  const places = ordered.map(place);
  let si = 0;
  ordered.forEach((s, i) => {
    if (frame >= s.at) si = i;
  });
  const cur = places[si];
  const prev = places[Math.max(0, si - 1)];
  const curAt = ordered[si].at;
  const local = frame - curAt;
  const isJump = si > 0 && (Math.abs(cur.y - prev.y) > 4 || cur.name !== prev.name);
  const dist = Math.hypot(cur.x - prev.x, cur.y - prev.y);
  const WIND = 4;
  const jumpDur = cl(10 + dist / 45, 14, 24);
  const walkDur = Math.max(6, Math.abs(cur.x - prev.x) / (170 / 30));
  const landT = (i: number) => {
    if (i === 0) return ordered[0].at;
    const p0 = places[i - 1];
    const p1 = places[i];
    const jmp = Math.abs(p1.y - p0.y) > 4 || p1.name !== p0.name;
    const d = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    return ordered[i].at + (jmp ? WIND + cl(10 + d / 45, 14, 24) : Math.max(6, Math.abs(p1.x - p0.x) / (170 / 30)));
  };
  let fx = cur.x;
  let fy = cur.y;
  let sq = 0;
  let mode: 'stand' | 'walk' | 'air' = 'stand';
  let dir = 1;
  if (si > 0) dir = cur.x >= prev.x ? 1 : -1;
  if (si > 0 && isJump) {
    if (local < WIND) {
      fx = prev.x;
      fy = prev.y;
      sq = 0.28 * eio3(local / WIND);
    } else if (local < WIND + jumpDur) {
      const k = (local - WIND) / jumpDur;
      const apex = Math.min(prev.y, cur.y) - 74;
      const cy = 2 * apex - (prev.y + cur.y) / 2;
      fx = lerp(prev.x, cur.x, eio3(k));
      fy = (1 - k) * (1 - k) * prev.y + 2 * (1 - k) * k * cy + k * k * cur.y;
      sq = lerp(-0.22, -0.12, k);
      mode = 'air';
    } else {
      const kk = cl((local - WIND - jumpDur) / 6.6);
      sq = kk < 1 ? 0.34 * (1 - kk) * Math.cos(7 * kk) : 0;
    }
  } else if (si > 0) {
    const k = cl(local / walkDur);
    fx = lerp(prev.x, cur.x, k);
    if (k < 1) mode = 'walk';
  }
  // idle breath on each beat, blink every ~2.9 s with hashed jitter
  const beatF = 1800 / bpm;
  if (mode === 'stand') sq += 0.07 * Math.exp(-mod(frame, beatF) / 2.2) * (sq === 0 ? 1 : 0.3);
  const bucket = Math.floor(t / 2.9);
  const bt = bucket * 2.9 + h1(bucket, 5) * 1.3;
  const blink = t >= bt && t < bt + 0.14;
  fx = Math.round(fx / (SP / 2)) * (SP / 2);

  const baseRows = sprite.length ? sprite : SPRITE;
  const legsA = '..ll....ll..';
  const legsB = '.ll......ll.';
  const rowsNow = baseRows.map((r, i) => {
    if (i === baseRows.length - 1) return mode === 'air' ? '.'.repeat(r.length) : mode === 'walk' ? (Math.floor(t * 9) % 2 ? legsB : legsA) : r;
    if (blink && i === 4) return r.replace(/e/g, 'b');
    return r;
  });
  const pal = spritePalette;
  const paths = spritePaths(rowsNow, pal, {outline: false, flip: dir < 0});

  // ------------------------------------------------------------------ UI state driven by the mascot's actions
  const inputIdx = ordered.findIndex((s) => s.to === 'input');
  const typeStart = inputIdx >= 0 ? landT(inputIdx) + 3 : 9999;
  const typed = Math.max(0, Math.min(inputText.length, Math.floor((frame - typeStart) / 2.4)));
  const typing = frame >= typeStart && typed < inputText.length;
  const rowTick = rows.map((_, i) => {
    const idx = ordered.findIndex((s) => s.to === 'row' + i);
    return idx >= 0 ? landT(idx) + 2 : 9999;
  });
  const btnIdx = ordered.findIndex((s) => s.to === 'button');
  const btnT = btnIdx >= 0 ? landT(btnIdx) + 2 : 9999;
  const pressed = frame >= btnT;
  const press = frame >= btnT && frame < btnT + 8 ? 1 - Math.abs((frame - btnT - 4) / 4) * 0.5 : 0;
  const titleNow = pressed && frame >= btnT + 6 ? doneTitle : title;
  const titlePop = pressed ? backOut(seg(frame, btnT + 6, btnT + 18), 2.4) : 1;

  // camera: slow push-in that leans toward the mascot
  const zoom = lerp(1, 1.06, eio3(seg(frame, 0, 300)));
  const fit = Math.min(w / DW, h / DH) * (portrait ? 0.88 : 0.9);
  const camX = lerp(DW / 2, fx, 0.1);
  const camY = lerp(DH / 2, fy, 0.1);

  const ink = '#1F1E1C';
  const sub = '#8A8782';
  const landings = ordered.map((_, i) => landT(i)).slice(1);
  // dust puffs at each landing
  const dust: React.ReactNode[] = [];
  landings.forEach((lt, i) => {
    const k = (frame - lt) / 10;
    if (k < 0 || k > 1) return;
    const p = places[i + 1];
    for (let n = 0; n < 6; n++) {
      const sd = n < 3 ? -1 : 1;
      dust.push(<rect key={`${i}-${n}`} x={p.x + sd * (6 * SP * 0.5 + k * (22 + n * 5)) - 3} y={p.y - 4 - k * (10 + n * 3)} width={6 - k * 3} height={6 - k * 3} fill="#FFFFFF" opacity={0.85 * (1 - k)} />);
    }
  });

  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, ${wallpaper[0] ?? '#F1D9C8'}, ${wallpaper[1] ?? '#D5BFAB'})`, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="pmu-shadow" x="-20%" y="-20%" width="140%" height="150%">
            <feGaussianBlur stdDeviation="26" />
          </filter>
        </defs>
        <g transform={`translate(${w / 2} ${h / 2}) scale(${fit * zoom}) translate(${-camX} ${-camY})`}>
          <rect x="6" y="26" width={DW} height={DH} rx="20" fill="#3B2A20" opacity="0.28" filter="url(#pmu-shadow)" />
          {/* window */}
          <rect width={DW} height={DH} rx="20" fill="#F9F8F4" />
          <path d={`M0 20a20 20 0 0 1 20 -20H${DW - 20}a20 20 0 0 1 20 20V46H0Z`} fill="#E9DFCF" />
          {['#E5705A', '#E8B94A', '#7DC27A'].map((c, i) => (
            <circle key={i} cx={28 + i * 22} cy="23" r="6.5" fill={c} />
          ))}
          <text x={DW / 2} y="29" textAnchor="middle" fill="#7F7D79" fontFamily={lf.inter} fontSize="14" fontWeight={500}>
            {windowTitle}
          </text>
          {/* heading */}
          <text x={mx} y={iy - 42} fill={ink} fontFamily={lf.newsreader} fontSize={56 * (0.9 + 0.1 * titlePop)} letterSpacing="-1.2" style={{opacity: cl(titlePop, 0.4, 1)}}>
            {titleNow}
          </text>
          <text x={mx} y={iy - 14} fill={sub} fontFamily={lf.inter} fontSize="15">
            {pressed ? 'Everything is checked off' : 'Three things to finish'}
          </text>
          {/* input */}
          <rect x={mx} y={iy} width={DW - mx * 2} height="58" rx="13" fill="#FFFFFF" stroke={typing || typed > 0 ? accent : '#DAD6CE'} strokeWidth={typing ? 2 : 1.5} />
          <text x={mx + 22} y={iy + 36} fill={typed > 0 ? ink : '#A3A19D'} fontFamily={lf.inter} fontSize="19">
            {typed > 0 ? inputText.slice(0, typed) : placeholder}
          </text>
          {typing && Math.floor(t * 2.4) % 2 === 0 && <rect x={mx + 22 + textW(inputText.slice(0, typed), 19, 0.5)} y={iy + 18} width="2" height="24" fill={accent} />}
          {/* rows */}
          {rows.map((label, i) => {
            const y = ry0 + i * rstep;
            const k = backOut(seg(frame, rowTick[i], rowTick[i] + 9), 2);
            const done = frame >= rowTick[i];
            return (
              <g key={i}>
                <rect x={mx} y={y} width={DW - mx * 2} height={rh} rx="12" fill={done ? mixC('#FFFFFF', accent, 0.06) : '#FFFFFF'} stroke="#E6E2DA" strokeWidth="1.5" />
                <rect x={mx + 18} y={y + rh / 2 - 12} width="24" height="24" rx="7" fill={done ? accent : '#FFFFFF'} stroke={done ? accent : '#C9C5BC'} strokeWidth="2" />
                {done && <path d={`M${mx + 24} ${y + rh / 2}l5 6 9 -11`} fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" strokeDashoffset={30 * (1 - cl(k))} />}
                <text x={mx + 58} y={y + rh / 2 + 6} fill={done ? '#9A968E' : ink} fontFamily={lf.inter} fontSize="18" fontWeight={500} textDecoration={done ? 'line-through' : undefined}>
                  {label}
                </text>
              </g>
            );
          })}
          {/* button */}
          <g transform={`translate(${DW - mx - bw / 2} ${by + 25}) scale(${1 - press * 0.08}) translate(${-bw / 2} -25)`}>
            <rect width={bw} height="50" rx="13" fill={pressed ? '#3FA172' : accent} />
            <text x={bw / 2} y="32" textAnchor="middle" fill="#FFFFFF" fontFamily={lf.inter} fontSize="18" fontWeight={600}>
              {pressed ? doneButton : button}
            </text>
          </g>
          {/* sparkles when a row is checked */}
          {rowTick.map((rt, i) => {
            const k = (frame - rt) / 14;
            if (k < 0 || k > 1) return null;
            const cx = mx + 30;
            const cy = ry0 + i * rstep + rh / 2;
            return [0, 1, 2, 3].map((n) => {
              const a = (n / 4) * Math.PI * 2 + 0.6;
              return <rect key={`${i}-${n}`} x={cx + Math.cos(a) * (14 + k * 26) - 3} y={cy + Math.sin(a) * (14 + k * 26) - 3} width="6" height="6" fill="#F2C14E" opacity={1 - k} />;
            });
          })}
          {/* hearts burst on the button */}
          {[0, 1, 2, 3].map((n) => {
            const k = (frame - btnT - n * 4) / 40;
            if (k < 0 || k > 1) return null;
            const p = places[btnIdx] ?? cur;
            const hp = spritePaths(HEART, {h: '#E0543A'}, {});
            return <PixelSprite key={n} paths={hp} x={p.x + (n - 1.5) * 26} y={p.y - 90 - k * 90} px={5} opacity={1 - k * k} originX={3.5} />;
          })}
          {dust}
          {/* the mascot: x snapped to half sprite-pixels, squash about the feet */}
          <g transform={`translate(${fx} ${fy}) scale(${1 + sq * 0.6} ${1 - sq})`}>
            <PixelSprite paths={paths} x={0} y={-baseRows.length * SP} px={SP} originX={baseRows[0].length / 2} />
            {typing && (
              <g transform={`translate(${SP * 5.5} ${-SP * 5 + Math.sin(frame * 1.2) * 3})`}>
                <PixelSprite paths={spritePaths(PENCIL, {p: '#C9892E', y: '#F2C14E', t: '#3B2A20'}, {})} x={0} y={0} px={SP * 0.55} />
              </g>
            )}
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const pixelMascotOnUi = defineMotion<Props>({
  id: 'pixel-mascot-on-ui',
  title: 'Pixel mascot on UI',
  category: 'mascot',
  description:
    'A chunky pixel-art mascot lives inside a crisp redrawn task-app window: it hops onto the top edges of the heading, input box, list rows and button with wind-up squash, parabolic arc, air stretch and damped landing squash plus dust, walks with a 9 Hz leg swap, blinks, breathes on the beat, and every action changes the real UI (typing with a pencil, checkboxes tick with sparkles, the button presses and hearts float). Original sprite, editable as character rows.',
  source: ['lemo-opuscar styles/living-screencast/demo/film.js Actor, clawd.js (MIT, LemoLab) — mechanics only; the sprite is original'],
  useFor: 'Product walkthroughs, app-store previews and onboarding videos with a brand mascot; pairs with box-bot.',
  durationInFrames: 300,
  defaultProps: {
    steps: [
      {to: 'heading', x: 0.12, at: 0},
      {to: 'input', x: 0.6, at: 30},
      {to: 'input', x: 0.88, at: 90},
      {to: 'row0', x: 0.62, at: 110},
      {to: 'row1', x: 0.82, at: 142},
      {to: 'row2', x: 0.6, at: 174},
      {to: 'row2', x: 0.88, at: 204},
      {to: 'button', x: 0.5, at: 226},
    ],
    sprite: SPRITE,
    spritePalette: {a: '#3FA88C', b: '#5FD0B0', e: '#23323A', c: '#F59DB0', s: '#47B898', l: '#3FA88C'},
    title: 'Today',
    doneTitle: 'All done',
    inputText: 'Plan the launch',
    placeholder: 'Add a task...',
    rows: ['Draft the announcement', 'Review the numbers', 'Send the invites'],
    button: 'Finish',
    doneButton: 'Saved',
    accent: '#5B6CE0',
    wallpaper: ['#F1D9C8', '#D5BFAB'],
    bpm: 96,
    spritePx: 8,
    windowTitle: 'Tasks',
  },
  propDocs: {
    steps: 'mascot route: [{to: heading|input|row0|row1|row2|button, x: 0..1 along the top edge, at: frame}] — a jump if the surface changes, a walk along the same edge',
    sprite: 'sprite rows of characters (12 wide; last row = legs)',
    spritePalette: 'character → colour map for the sprite rows',
    title: 'heading text',
    doneTitle: 'heading after the button press',
    inputText: 'text typed into the input',
    placeholder: 'input placeholder',
    rows: 'list row labels (up to 3)',
    button: 'button label',
    doneButton: 'button label after the press',
    accent: 'UI accent colour (keep it different from the mascot hue)',
    wallpaper: 'desktop gradient [top-left, bottom-right]',
    bpm: 'beat the mascot breathes on',
    spritePx: 'design-space size of one sprite pixel (6–12)',
    windowTitle: 'title in the app window title bar',
  },
  component: PixelMascotOnUi,
  tags: ['mascot', 'pixel art', 'ui', 'walkthrough', 'onboarding', 'app demo', 'jump', 'squash and stretch', 'product tour', 'task list', 'character', 'screencast', 'cursor-free'],
});
