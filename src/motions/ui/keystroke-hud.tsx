import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {backOut, cl, h1, lf, lerp} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * KeyCastr-style keystroke HUD (living-screencast): frosted-glass key caps (shift, cmd, a letter, return ...) pop in at the
 * bottom as each shortcut is pressed (.12 s back-ease), the last key dips like a real press, the combo holds ~1 s, stacks
 * beside the next one and fades. Caps are drawn from vector icons so every modifier renders on any machine.
 * `backdrop: none` makes it a transparent overlay for a real screen recording.
 */
type KeyEv = {t: number; combo: string};
type Props = {
  keys: KeyEv[];
  hold: number;
  size: number;
  position: string;
  glass: string;
  ink: string;
  backdrop: string;
  accent: string;
  seed: number;
  fileName: string;
};

const ICON: Record<string, string> = {
  cmd: 'M9 9h6v6H9z M9 9V7a2 2 0 1 0-2 2 M15 9V7a2 2 0 1 1 2 2 M9 15v2a2 2 0 1 1-2-2 M15 15v2a2 2 0 1 0 2-2',
  shift: 'M12 4l8 9h-5v7H9v-7H4z',
  opt: 'M4 7h5l6 10h5 M14 7h6',
  ctrl: 'M6 15l6-7 6 7',
  enter: 'M19 6v6a2 2 0 0 1-2 2H6 M10 10l-4 4 4 4',
  del: 'M9 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-6-6z M12 10l4 4 M16 10l-4 4',
  tab: 'M4 12h13 M13 8l4 4-4 4 M20 6v12',
  up: 'M12 19V6 M6 11l6-6 6 6',
  down: 'M12 5v13 M6 13l6 6 6-6',
  left: 'M19 12H6 M11 6l-6 6 6 6',
  right: 'M5 12h13 M13 6l6 6-6 6',
};
const ALIAS: Record<string, string> = {
  '⌘': 'cmd', cmd: 'cmd', command: 'cmd', meta: 'cmd', win: 'cmd',
  '⇧': 'shift', shift: 'shift',
  '⌥': 'opt', opt: 'opt', option: 'opt', alt: 'opt',
  '⌃': 'ctrl', ctrl: 'ctrl', control: 'ctrl',
  '↵': 'enter', '⏎': 'enter', enter: 'enter', return: 'enter',
  '⌫': 'del', del: 'del', delete: 'del', backspace: 'del',
  '⇥': 'tab', tab: 'tab',
  '↑': 'up', up: 'up', '↓': 'down', down: 'down', '←': 'left', left: 'left', '→': 'right', right: 'right',
};

type Cap = {kind: 'icon'; icon: string} | {kind: 'text'; text: string};
const parse = (combo: string): Cap[] =>
  combo
    .split(/[\s+]+/)
    .filter(Boolean)
    .map((tk) => {
      const a = ALIAS[tk.toLowerCase()] ?? ALIAS[tk];
      if (a) return {kind: 'icon', icon: a} as Cap;
      return {kind: 'text', text: tk.length === 1 ? tk.toUpperCase() : tk.toLowerCase()} as Cap;
    });

const KeystrokeHud: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const H = 66 * u * p.size * (portrait ? 1.45 : 1);
  const pk = portrait ? 1.5 : 1;
  const gapCap = 8 * u * p.size;
  const gapCombo = 30 * u * p.size;
  const holdF = p.hold * 30;
  const inF = 3.6;
  const outF = 9;
  const capW = (c: Cap) => (c.kind === 'icon' ? H : c.text.length === 1 ? H : c.text === 'space' ? H * 2.8 : H * 0.55 + c.text.length * H * 0.27);

  const evs = (p.keys || [])
    .map((k, i) => ({...k, i, f0: k.t * 30, caps: parse(k.combo)}))
    .filter((e) => frame >= e.f0 && frame <= e.f0 + holdF + outF + 1)
    .map((e) => {
      const age = frame - e.f0;
      const fade = cl(1 - (age - holdF) / outF);
      const W = e.caps.reduce((s, c) => s + capW(c), 0) + gapCap * (e.caps.length - 1);
      return {...e, age, fade, W};
    });
  const total = evs.reduce((s, e) => s + e.fade * (e.W + gapCombo), 0) - (evs.length ? gapCombo : 0);
  let cursor = w / 2 - total / 2;
  const bottomY = h * (p.position === 'top' ? 0.1 : 0.9) - (p.position === 'top' ? 0 : H);
  const newest = evs.length ? Math.max(...evs.map((e) => e.f0)) : 0;

  const demo = p.backdrop !== 'none';
  const lineCount = Math.floor(frame / 3.2);
  const code = Array.from({length: 17}, (_, i) => ({
    ind: Math.floor(h1(i, p.seed, 1) * 3) * 2,
    len: 0.18 + h1(i, p.seed, 2) * 0.5,
    col: ['#7AA2F7', '#BB9AF7', '#9ECE6A', '#E0AF68', '#7DCFFF'][Math.floor(h1(i, p.seed, 3) * 5)],
    two: h1(i, p.seed, 4) > 0.5,
  }));

  return (
    <AbsoluteFill style={{background: demo ? 'linear-gradient(135deg,#3B5BDB 0%,#7048E8 55%,#C2255C 100%)' : 'transparent', fontFamily: lf.inter}}>
      {demo && (
        <div style={{position: 'absolute', left: w * (portrait ? 0.05 : 0.11), right: w * (portrait ? 0.05 : 0.11), top: h * 0.06, height: h * 0.8, borderRadius: 18 * u, background: '#1E2030', boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,0.35)`, overflow: 'hidden'}}>
          <div style={{height: 46 * u * pk, background: '#252A3F', display: 'flex', alignItems: 'center', gap: 10 * u, paddingLeft: 18 * u}}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
              <div key={c} style={{width: 14 * u, height: 14 * u, borderRadius: '50%', background: c}} />
            ))}
            <div style={{marginLeft: 20 * u, color: '#8A90B0', fontSize: 17 * u * pk, fontFamily: lf.jbm}}>{p.fileName}</div>
          </div>
          <div style={{padding: `${22 * u}px ${30 * u}px`}}>
            {code.map((l, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', height: 34 * u * pk, opacity: i < lineCount ? 1 : 0}}>
                <div style={{width: 40 * u * pk, color: '#4B5170', fontSize: 15 * u * pk, fontFamily: lf.jbm}}>{i + 1}</div>
                <div style={{width: l.ind * 18 * u * pk}} />
                <div style={{height: 12 * u * pk, width: l.len * (w * 0.4) * 0.5 * pk, borderRadius: 6 * u * pk, background: l.col, opacity: 0.85}} />
                {l.two && <div style={{marginLeft: 12 * u * pk, height: 12 * u * pk, width: l.len * w * 0.12 * pk, borderRadius: 6 * u * pk, background: '#6B7399'}} />}
                {i === lineCount - 1 && Math.floor(frame / 8) % 2 === 0 && <div style={{marginLeft: 8 * u, height: 22 * u, width: 3 * u, background: '#C0CAF5'}} />}
              </div>
            ))}
          </div>
        </div>
      )}
      {evs.map((e) => {
        const left = cursor;
        cursor += e.fade * (e.W + gapCombo);
        const stacked = e.f0 < newest ? 0.55 : 1;
        let x = left;
        // collapse toward the centre of its slot while it fades out
        const slotW = e.W;
        return (
          <div key={e.i} style={{position: 'absolute', left: x, top: bottomY, width: slotW, height: H, opacity: e.fade * stacked, transform: `translateY(${(1 - e.fade) * 10 * u}px) scale(${lerp(0.94, 1, e.fade)})`, transformOrigin: '50% 100%'}}>
            {(() => {
              let cx = 0;
              return e.caps.map((c, ci) => {
                const cw = capW(c);
                const left2 = cx;
                cx += cw + gapCap;
                const a = backOut(cl((e.age - ci * 2) / inF), 2.2);
                if (e.age - ci * 2 < 0) return null;
                const last = ci === e.caps.length - 1;
                const press = last ? cl(1 - Math.abs((e.age - ci * 2 - 6) / 4)) : e.caps.length > 1 ? 0.7 : 0;
                const sc = Math.max(0.01, a) * (1 - 0.06 * press);
                return (
                  <div
                    key={ci}
                    style={{
                      position: 'absolute',
                      left: left2,
                      top: 0,
                      width: cw,
                      height: H,
                      borderRadius: H * 0.2,
                      background: p.glass,
                      backdropFilter: `blur(${12 * u}px) saturate(1.4)`,
                      WebkitBackdropFilter: `blur(${12 * u}px) saturate(1.4)`,
                      border: `${Math.max(1, 1.4 * u)}px solid rgba(255,255,255,0.65)`,
                      boxShadow: `0 ${(7 - 4 * press) * u}px ${20 * u}px rgba(10,10,40,0.28), inset 0 ${2 * u}px 0 rgba(255,255,255,0.55)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: p.ink,
                      transform: `scale(${sc}) translateY(${press * 2 * u}px)`,
                      transformOrigin: '50% 100%',
                      filter: press > 0.3 && last ? `brightness(${1 - 0.06 * press})` : undefined,
                    }}
                  >
                    {c.kind === 'icon' ? (
                      <svg width={H * 0.5} height={H * 0.5} viewBox="0 0 24 24" fill="none" stroke={p.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        {ICON[c.icon].split(' M').map((seg, si) => (
                          <path key={si} d={(si ? 'M' : '') + seg} />
                        ))}
                      </svg>
                    ) : (
                      <span style={{fontSize: c.text.length === 1 ? H * 0.47 : H * 0.34, fontWeight: 600, letterSpacing: c.text.length === 1 ? 0 : H * 0.01}}>{c.text}</span>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const keystrokeHud = defineMotion<Props>({
  id: 'keystroke-hud',
  title: 'Keystroke HUD',
  category: 'ui',
  description:
    'KeyCastr-style frosted-glass key caps (shift, cmd, a letter, return, esc ...) pop in at the bottom as each shortcut is pressed, the last key dips like a real press, the combo holds about a second, stacks beside the next one and fades. Over a soft demo editor by default; backdrop none = transparent overlay.',
  source: ['lemo-opuscar styles/living-screencast STYLE.md §4 + demo/main.js HUD (MIT, LemoLab) — cap 4 % H, radius 8 px, rgba(255,255,255,.7) + blur 12, pop .12 s, hold ~1 s'],
  useFor: 'Tutorials, dev-tool and productivity-app demos, screen recordings that need the shortcuts shown; lay over a real recording with backdrop none.',
  durationInFrames: 240,
  defaultProps: {
    keys: [
      {t: 0.7, combo: '⌘ K'},
      {t: 2.2, combo: '⇧ ⌘ M'},
      {t: 3.8, combo: '⌘ C'},
      {t: 4.3, combo: '⌘ V'},
      {t: 5.6, combo: '⌘ ↵'},
      {t: 6.9, combo: 'esc'},
    ],
    hold: 1,
    size: 1.3,
    position: 'bottom',
    glass: 'rgba(255,255,255,0.7)',
    ink: '#1D1D26',
    backdrop: 'demo',
    accent: '#7048E8',
    seed: 4,
    fileName: 'main.ts',
  },
  propDocs: {
    keys: 'array of {t seconds, combo}: tokens separated by space or +, e.g. "⇧ ⌘ M", "cmd+shift+p", "ctrl alt delete", "esc"',
    hold: 'seconds a combo stays fully visible',
    size: 'key cap size multiplier',
    position: 'bottom | top',
    glass: 'cap fill (rgba) — frosted glass',
    ink: 'glyph colour',
    backdrop: 'demo = soft editor mock behind; none = transparent overlay',
    accent: 'reserved accent colour',
    seed: 'demo backdrop seed',
    fileName: 'file name shown beside the ghost code lines',
  },
  component: KeystrokeHud,
  tags: ['keystroke', 'keycastr', 'keyboard', 'shortcut', 'key caps', 'hotkey', 'tutorial', 'screencast', 'frosted glass', 'glass', 'hud', 'overlay', 'dev tools', 'productivity', 'macos', 'command', 'living-screencast'],
});
