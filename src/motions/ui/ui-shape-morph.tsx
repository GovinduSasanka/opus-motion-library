import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {CursorGlyph, clamp01, springSum} from '../../core/r2-pr1-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * One rounded rectangle that never cuts: it grows from a button into a loader, a check, a pill, a player, a slider, a
 * toggle, tabs, a chart, a search box and a toast, then back to the button, one state per beat (120 BPM = 15 f). Every
 * animated value (edges, radius, colour, camera) is the SUM of closed-form critically-damped spring step responses, one
 * per target change, so overlapping changes blend; leading edges use a stiffer spring (220) than trailing edges (160) so
 * the shape stretches. Content cross-blurs inside (7 f), the camera keeps the active state ~60 % of the frame, and the
 * last frame equals the first so it loops.
 */

type St = {kind: 'button' | 'loader' | 'check' | 'pill' | 'player' | 'slider' | 'toggle' | 'tabs' | 'chart' | 'search' | 'toast'; label: string; width: number; height: number; radius: number; color: string; content?: string; action?: string};
type Props = {
  states: St[];
  accent: string;
  background: string;
  ink: string;
  fontFamily: string;
  beatFrames: number;
  startFrame: number;
  frameFill: number;
  cursor: boolean;
};

const hex = (c: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  const v = m ? parseInt(m[1], 16) : 0x888888;
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const LEAD = {damping: 28, stiffness: 220, mass: 1};
const TRAIL = {damping: 24, stiffness: 160, mass: 1};
const SOFT = {damping: 26, stiffness: 150, mass: 1};
const DARK_KINDS = new Set(['pill', 'player', 'toast', 'button', 'loader', 'check', 'toggle']);

type CProps = {st: St; a: number; u: number; accent: string; ink: string; font: string};
const Content: React.FC<CProps> = ({st, a, u, accent, ink, font}) => {
  const W = st.width * u;
  const H = st.height * u;
  const fs = (n: number) => n * u;
  const box: React.CSSProperties = {position: 'absolute', left: -W / 2, top: -H / 2, width: W, height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font, color: DARK_KINDS.has(st.kind) ? '#fff' : ink};
  const lab = st.label;
  switch (st.kind) {
    case 'button':
      return <div style={{...box, fontWeight: 700, fontSize: fs(34), letterSpacing: '-0.01em'}}>{lab}</div>;
    case 'loader':
      return (
        <div style={box}>
          <svg width={fs(52)} height={fs(52)} viewBox="0 0 52 52" style={{transform: `rotate(${a * 14}deg)`}}>
            <circle cx={26} cy={26} r={20} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={6} />
            <circle cx={26} cy={26} r={20} fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeDasharray="38 90" />
          </svg>
        </div>
      );
    case 'check': {
      const p = prog(a, 3, 15, ease.out);
      return (
        <div style={box}>
          <svg width={fs(52)} height={fs(52)} viewBox="0 0 52 52">
            <path d="M12 27 L22 37 L41 15" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
          </svg>
        </div>
      );
    }
    case 'pill':
      return (
        <div style={{...box, gap: fs(14), fontWeight: 600, fontSize: fs(30)}}>
          <div style={{width: fs(16), height: fs(16), borderRadius: fs(8), background: '#4ADE80', boxShadow: `0 0 ${fs(10)}px #4ADE80`}} />
          {lab}
        </div>
      );
    case 'player': {
      const pr = lerp(0.3, 0.62, ease.sine(clamp01(a / 30)));
      return (
        <div style={{...box, padding: `0 ${fs(30)}px`, justifyContent: 'flex-start', gap: fs(24)}}>
          <div style={{width: fs(70), height: fs(70), borderRadius: fs(35), background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
            <svg width={fs(28)} height={fs(28)} viewBox="0 0 24 24" fill="#17171B">
              {a < 6 ? <path d="M7 4 L20 12 L7 20Z" /> : <path d="M6 4h4v16H6zM14 4h4v16h-4z" />}
            </svg>
          </div>
          <div style={{flex: 1}}>
            <div style={{fontWeight: 600, fontSize: fs(24), marginBottom: fs(12)}}>{lab}</div>
            <div style={{height: fs(8), borderRadius: fs(4), background: 'rgba(255,255,255,0.2)', position: 'relative'}}>
              <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pr * 100}%`, borderRadius: fs(4), background: '#fff'}} />
            </div>
          </div>
          <div style={{fontFamily: fonts.mono, fontSize: fs(20), opacity: 0.65}}>1:{String(Math.round(pr * 60)).padStart(2, '0')}</div>
        </div>
      );
    }
    case 'slider': {
      const v = lerp(0.22, 0.8, ease.out(clamp01((a - 2) / 18)));
      const tw = W - fs(150);
      return (
        <div style={{...box, justifyContent: 'flex-start', padding: `0 ${fs(36)}px`}}>
          <div style={{width: tw, height: fs(10), borderRadius: fs(5), background: 'rgba(0,0,0,0.12)', position: 'relative'}}>
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: tw * v, borderRadius: fs(5), background: accent}} />
            <div style={{position: 'absolute', left: tw * v - fs(20), top: -fs(15), width: fs(40), height: fs(40), borderRadius: fs(20), background: '#fff', border: `${fs(5)}px solid ${accent}`, boxShadow: '0 4px 10px rgba(0,0,0,0.18)', boxSizing: 'border-box'}} />
          </div>
          <div style={{marginLeft: fs(26), fontFamily: fonts.mono, fontWeight: 700, fontSize: fs(28)}}>{Math.round(v * 100)}</div>
        </div>
      );
    }
    case 'toggle': {
      const k = 72 * u;
      const pad = 12 * u;
      const fr = (cfg: typeof LEAD, s: number) => springSum(a, 30, [1], [0, s], cfg);
      const lo = pad;
      const hi = W - pad - k;
      const L = lo + fr(TRAIL, hi - lo);
      const R = lo + k + fr(LEAD, hi - lo);
      return (
        <div style={box}>
          <div style={{position: 'absolute', left: L, top: (H - k) / 2, width: R - L, height: k, borderRadius: k / 2, background: '#fff', boxShadow: '0 3px 8px rgba(0,0,0,0.22)'}} />
        </div>
      );
    }
    case 'tabs': {
      const names = (st.content || 'Overview|Activity|Settings').split('|');
      const tw = (W - fs(16)) / names.length;
      const fr = (cfg: typeof LEAD, s: number) => springSum(a, 30, [2], [0, s], cfg);
      const L = fs(8) + fr(TRAIL, tw * 2);
      const R = fs(8) + tw + fr(LEAD, tw * 2);
      const idx = Math.min(names.length - 1, Math.max(0, Math.floor((L + R) / 2 / tw)));
      return (
        <div style={box}>
          <div style={{position: 'absolute', left: L, top: fs(8), width: R - L, height: H - fs(16), borderRadius: (H - fs(16)) / 2, background: '#fff', boxShadow: '0 3px 8px rgba(0,0,0,0.12)'}} />
          {names.map((n, i) => (
            <div key={i} style={{position: 'absolute', left: fs(8) + i * tw, width: tw, top: 0, height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: fs(26), opacity: i === idx ? 1 : 0.5}}>
              {n}
            </div>
          ))}
        </div>
      );
    }
    case 'chart': {
      const vals = [0.45, 0.7, 0.55, 0.92, 0.74];
      return (
        <div style={{...box, flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', padding: fs(34)}}>
          <div style={{fontWeight: 800, fontSize: fs(30), letterSpacing: '-0.01em'}}>{lab}</div>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: fs(20), flex: 1, marginTop: fs(14)}}>
            {vals.map((v, i) => {
              const p = ease.out(clamp01((a - 2 - i * 2) / 14));
              return <div key={i} style={{flex: 1, height: `${v * 100 * p}%`, borderRadius: fs(10), background: i === 3 ? accent : 'rgba(0,0,0,0.12)'}} />;
            })}
          </div>
        </div>
      );
    }
    case 'search': {
      const txt = (st.content || 'northwind').slice(0, Math.max(0, Math.floor((a - 4) / 2)));
      return (
        <div style={{...box, justifyContent: 'flex-start', padding: `0 ${fs(34)}px`, gap: fs(18), fontSize: fs(30)}}>
          <svg width={fs(32)} height={fs(32)} viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth={2.2} strokeLinecap="round" style={{opacity: 0.6}}>
            <circle cx={10.5} cy={10.5} r={6.5} />
            <path d="m15.5 15.5 5 5" />
          </svg>
          <span>
            {txt || <span style={{opacity: 0.38}}>{lab}</span>}
            <span style={{color: accent, opacity: Math.floor(a / 5) % 2 ? 0 : 1}}>|</span>
          </span>
        </div>
      );
    }
    default:
      return (
        <div style={{...box, justifyContent: 'flex-start', padding: `0 ${fs(28)}px`, gap: fs(20)}}>
          <div style={{width: fs(52), height: fs(52), borderRadius: fs(26), background: '#22A06B', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
            <svg width={fs(26)} height={fs(26)} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.500 4.500L19 7.500" /></svg>
          </div>
          <div style={{flex: 1, fontWeight: 600, fontSize: fs(27)}}>{lab}</div>
          <div style={{fontWeight: 700, fontSize: fs(24), color: '#9FB0FF'}}>{st.action ?? 'Undo'}</div>
        </div>
      );
  }
};

// cursor target per kind, relative to the shape centre (u)
const curTarget = (s: St): [number, number] => {
  switch (s.kind) {
    case 'button': return [30, 14];
    case 'slider': return [s.width * 0.2, 4];
    case 'toggle': return [24, 10];
    case 'tabs': return [s.width * 0.3, 8];
    case 'player': return [-s.width * 0.36, 8];
    case 'chart': return [s.width * 0.18, -10];
    case 'search': return [-s.width * 0.1, 10];
    case 'toast': return [s.width * 0.36, 10];
    default: return [26, 26];
  }
};

const UiShapeMorph: React.FC<Props> = ({states, accent, background, ink, fontFamily, beatFrames, startFrame, frameFill, cursor}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps} = useStage();
  const font = fontFamily || fonts.sans;
  const list = states.length ? states : [{kind: 'button', label: 'Start', width: 300, height: 96, radius: 48, color: accent} as St];
  const times = list.slice(1).map((_, i) => startFrame + i * beatFrames);

  const edge = (vals: number[], sign: 1 | -1) => springSum(frame, fps, times, vals, (_i, d) => (d * sign > 0 ? LEAD : TRAIL));
  const Lw = edge(list.map((s) => -s.width / 2), -1);
  const Rw = edge(list.map((s) => s.width / 2), 1);
  const Tw = edge(list.map((s) => -s.height / 2), -1);
  const Bw = edge(list.map((s) => s.height / 2), 1);
  const rad = Math.min(springSum(frame, fps, times, list.map((s) => s.radius), SOFT), Math.min(Rw - Lw, Bw - Tw) / 2);
  const rgb = [0, 1, 2].map((c) => springSum(frame, fps, times, list.map((s) => hex(s.color)[c]), SOFT));
  const col = `rgb(${rgb.map((v) => Math.round(clamp01(v / 255) * 255)).join(',')})`;

  // camera: active state fills frameFill of the frame (capped)
  const camTarget = list.map((s) => Math.min(h > w ? 5 : 3.2, Math.max(0.75, (frameFill * (h > w ? 1.3 : 1) * Math.min(w / (s.width * u), h / (s.height * u))))));
  const cam = springSum(frame, fps, times, camTarget, {damping: 26, stiffness: 110, mass: 1});

  // active state + age
  let idx = 0;
  times.forEach((t, i) => {
    if (frame >= t) idx = i + 1;
  });
  const age = idx === 0 ? 999 : frame - times[idx - 1];
  const swap = prog(age, 0, 7, ease.inOut);
  const prev = idx > 0 ? list[idx - 1] : null;

  // cursor
  const ct = list.map(curTarget);
  const cx = springSum(frame, fps, times, ct.map((c) => c[0]), {damping: 22, stiffness: 120, mass: 1});
  const cy = springSum(frame, fps, times, ct.map((c) => c[1]), {damping: 22, stiffness: 120, mass: 1});
  const press = idx > 0 && age >= 6 && age < 12 ? Math.sin(((age - 6) / 6) * Math.PI) : 0;

  const dark = ink === '#EDEBE7';
  void dark;
  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 65%)'}} />
      <div style={{position: 'absolute', left: w / 2, top: h / 2, width: 0, height: 0, transform: `scale(${cam})`}}>
        <div
          style={{
            position: 'absolute',
            left: Lw * u,
            top: Tw * u,
            width: (Rw - Lw) * u,
            height: (Bw - Tw) * u,
            borderRadius: rad * u,
            background: col,
            boxShadow: `0 ${18 * u}px ${48 * u}px rgba(30,25,15,0.16), 0 ${3 * u}px ${8 * u}px rgba(30,25,15,0.08)`,
            overflow: 'hidden',
          }}
        >
          <div style={{position: 'absolute', left: -Lw * u, top: -Tw * u, width: 0, height: 0}}>
            {prev && age < 8 ? (
              <div style={{opacity: 1 - swap, filter: `blur(${swap * 8 * u}px)`}}>
                <Content st={prev} a={999} u={u} accent={accent} ink={ink} font={font} />
              </div>
            ) : null}
            <div style={{opacity: idx === 0 ? 1 : clamp01((age - 3) / 8), filter: idx === 0 ? undefined : `blur(${(1 - clamp01((age - 3) / 8)) * 8 * u}px)`, position: 'absolute', left: 0, top: 0}}>
              <Content st={list[idx]} a={idx === 0 ? 999 : Math.max(0, age - 3)} u={u} accent={accent} ink={ink} font={font} />
            </div>
          </div>
        </div>
        {cursor ? (
          <div style={{position: 'absolute', left: (cx + 0) * u, top: cy * u, width: 0, height: 0}}>
            <svg width={50 * u} height={50 * u} viewBox="-8 -8 50 50" style={{position: 'absolute', left: -2 * u, top: -2 * u, overflow: 'visible', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))'}}>
              <CursorGlyph style="arrow" size={30} color="#111" press={press} rippleColor={accent} />
            </svg>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const mk = (kind: St['kind'], label: string, width: number, height: number, radius: number, color: string, content?: string): St => ({kind, label, width, height, radius, color, content});
const ACC = '#4F5BD5';

export const uiShapeMorph = defineMotion<Props>({
  id: 'ui-shape-morph',
  title: 'UI shape morph (one shape, many states)',
  category: 'ui',
  description:
    'One rounded rectangle never cuts: it grows from a button into a loader, a check, a pill, a player, a slider, a toggle, tabs, a chart, a search box and a toast and back, one change per beat on spring physics (leading edges stiffer than trailing edges so it stretches), content cross-blurring inside while the camera keeps the active state framed; the last frame equals the first.',
  source: ['prompt-corpus: ui-shape-morph (22 cases)', 'awesome-opus5-5-videos prompts (MIT) — technique only'],
  useFor: 'Product promos, app-store previews, onboarding heroes and "what our app does" loops: edit the `states` table (kind, label, size, radius, colour), set `accent` and `beatFrames` to your music; pairs with cursor-driver.',
  durationInFrames: 10 + 11 * 15 + 30,
  defaultProps: {
    states: [
      mk('button', 'Get started', 300, 96, 48, ACC),
      mk('loader', '', 96, 96, 48, ACC),
      mk('check', '', 96, 96, 48, '#22A06B'),
      mk('pill', 'Order confirmed', 360, 80, 40, '#17171B'),
      mk('player', 'Northwind Radio', 580, 132, 38, '#17171B'),
      mk('slider', '', 540, 96, 48, '#FFFFFF'),
      mk('toggle', '', 180, 96, 48, ACC),
      mk('tabs', '', 560, 96, 48, '#DDD9D0', 'Overview|Activity|Settings'),
      mk('chart', 'This week', 520, 320, 40, '#FFFFFF'),
      mk('search', 'Search anything', 600, 96, 48, '#FFFFFF', 'northwind'),
      mk('toast', 'Saved to your library', 580, 112, 30, '#17171B'),
      mk('button', 'Get started', 300, 96, 48, ACC),
    ],
    accent: ACC,
    background: '#EDEBE7',
    ink: '#17171B',
    fontFamily: '',
    beatFrames: 15,
    startFrame: 10,
    frameFill: 0.6,
    cursor: true,
  },
  propDocs: {
    states: "[{kind:'button'|'loader'|'check'|'pill'|'player'|'slider'|'toggle'|'tabs'|'chart'|'search'|'toast', label, width, height, radius (u), color, content?, action? (toast button word, default 'Undo')}] — end with a copy of the first state to loop",
    accent: 'accent used inside sliders, charts, search caret',
    background: 'canvas colour (warm grey or near-black)',
    ink: 'text colour on light states',
    fontFamily: 'UI font family (empty = Inter)',
    beatFrames: 'frames per state change (15 = 120 BPM)',
    startFrame: 'frame of the first change',
    frameFill: 'fraction of the frame the active state fills (0.6)',
    cursor: 'show a small cursor that operates each state',
  },
  component: UiShapeMorph,
  tags: ['ui', 'morph', 'shape morph', 'button', 'loader', 'toggle', 'slider', 'tabs', 'toast', 'player', 'search', 'chart', 'app', 'product promo', 'app store', 'onboarding', 'spring', 'loop', 'interface'],
});
