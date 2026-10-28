// Adapted from lemo-opuscar/styles/pixel-rpg/demo/ui.js + main.js (menus, battle UI timing) (MIT / CC BY 4.0, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {mixHex, s1f, sh, sseg, easeOut3} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Game systems as narration, drawn at native 320x180 (180x320 portrait) and scaled up with crisp edges: a command menu
 * (FIGHT / ITEM / MAGIC / RUN) with a bobbing hand cursor that freezes while it hesitates, a party status window whose HP
 * bars tick down (red when low) with a greyed-out member and a blinking KO, a level-up screen where stats roll up, a
 * save-file list (choosing NEW FILE rather than overwriting) and an item-get box. Windows slide in on integer pixels in
 * 0.3 s. Everything is a pure function of the frame; sound cues (cursor, select, error, tick, fanfare) can be shown as tags.
 */
type Screen = {type: 'battle' | 'levelup' | 'save' | 'item'; t0: number; dur: number};
type Props = {
  screens: Screen[];
  skin: 'blue' | 'night' | 'cream';
  party: {name: string; hp: number; hpTo: number; maxHp: number; dim?: boolean}[];
  item: string;
  accent: string;
  showCues: boolean;
  background: string;
};

const SKINS = {
  blue: {a: '#124E89', b: '#262B44', ink: '#0B0B1A', edge: '#FFFFFF', edge2: '#A9B4C8', text: '#FFFFFF', dim: '#7A8399'},
  night: {a: '#2A1E5C', b: '#120D2A', ink: '#05030F', edge: '#E8E0FF', edge2: '#8E80C8', text: '#F4EEFF', dim: '#74698F'},
  cream: {a: '#F4E8C8', b: '#C9B98C', ink: '#2A2013', edge: '#2A2013', edge2: '#7A6A44', text: '#2A2013', dim: '#8E8160'},
} as const;

const HAND = ['...OOO.......', '..OWWWOOOOOO.', 'OOOWWWWWWWWWO', 'OWWWWWWWWWWWO', 'OWWWWWWWWWWWO', 'OOOWWWWWWWWWO', '..OWWWOOOOOO.', '...OOO.......'];
const POTION = ['....OOOO....', '....OWWO....', '.....OO.....', '....OWWO....', '...OPPPPO...', '..OPPHPPPO..', '.OPPHPPPPPO.', '.OPPPPPPPPO.', '.OPPPPPPPPO.', '..OPPPPPPO..', '...OOOOOO...'];

const ease = easeOut3;
const Px: React.FC<{rows: string[]; x: number; y: number; map: Record<string, string>; s?: number}> = ({rows, x, y, map, s = 1}) => (
  <g>
    {rows.flatMap((r, j) =>
      [...r].map((c, i) => (map[c] ? <rect key={`${i}-${j}`} x={x + i * s} y={y + j * s} width={s} height={s} fill={map[c]} /> : null)),
    )}
  </g>
);

const RpgMenuUi: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, portrait} = useStage();
  const NW = portrait ? 180 : 320;
  const NH = portrait ? 320 : 180;
  const S = Math.min(w / NW, h / NH);
  const ox = (w - NW * S) / 2;
  const oy = (h - NH * S) / 2;
  const K = SKINS[p.skin] ?? SKINS.blue;
  const uid = 'rpg';
  const scr = p.screens.find((s) => frame >= s.t0 && frame < s.t0 + s.dur) ?? p.screens[p.screens.length - 1];
  const t = frame - scr.t0;
  const out = sseg(t, scr.dur - 7, scr.dur);
  const cues: string[] = [];

  const T = (x: number, y: number, s: string, c: string = K.text, shadow = true, anchor: 'start' | 'middle' | 'end' = 'start') => (
    <g>
      {shadow && p.skin !== 'cream' && (
        <text x={x + 1} y={y + 8} fontFamily={s1f.press} fontSize={8} fill={K.ink} textAnchor={anchor} style={{whiteSpace: 'pre'}}>
          {s}
        </text>
      )}
      <text x={x} y={y + 8} fontFamily={s1f.press} fontSize={8} fill={c} textAnchor={anchor} style={{whiteSpace: 'pre'}}>
        {s}
      </text>
    </g>
  );
  // window with a dithered vertical gradient and ink / white / silver edge
  const Win = ({id, x, y, w: ww, h: hh, from, dist = 40, delay = 0, children}: {id: string; x: number; y: number; w: number; h: number; from: 'left' | 'right' | 'bottom' | 'top' | 'none'; dist?: number; delay?: number; children?: React.ReactNode}) => {
    const k = ease(sseg(t - delay, 0, 9)) * (1 - ease(out));
    const off = Math.round((1 - k) * dist);
    const dx = from === 'left' ? -off : from === 'right' ? off : 0;
    const dy = from === 'bottom' ? off : from === 'top' ? -off : 0;
    const bands = Math.max(4, Math.floor(hh / 6));
    return (
      <g transform={`translate(${dx} ${dy})`} opacity={from === 'none' ? k : 1}>
        <defs>
          <clipPath id={`${uid}-${id}`}>
            <rect x={x} y={y} width={ww} height={hh} />
          </clipPath>
        </defs>
        <rect x={x - 3} y={y - 3} width={ww + 6} height={hh + 6} fill={K.ink} />
        <rect x={x - 2} y={y - 2} width={ww + 4} height={hh + 4} fill={K.edge} />
        <rect x={x - 1} y={y - 1} width={ww + 2} height={hh + 2} fill={K.edge2} />
        <g clipPath={`url(#${uid}-${id})`}>
          {Array.from({length: bands}, (_, i) => {
            const y0 = y + (i * hh) / bands;
            const c0 = mixHex(K.a, K.b, i / (bands - 1));
            const c1 = mixHex(K.a, K.b, Math.min(1, (i + 1) / (bands - 1)));
            return (
              <g key={i}>
                <rect x={x} y={y0} width={ww} height={hh / bands + 0.5} fill={c0} />
                {Array.from({length: Math.ceil(ww / 2)}, (_, j) => ((j + i) % 2 === 0 ? <rect key={j} x={x + j * 2} y={y0 + hh / bands - 1} width={1} height={1} fill={c1} /> : null))}
              </g>
            );
          })}
        </g>
        {children}
      </g>
    );
  };
  const Cursor: React.FC<{x: number; y: number; freeze?: boolean}> = ({x, y, freeze}) => {
    const bob = freeze ? 0 : Math.floor(frame / 7.5) % 2;
    return <Px rows={HAND} x={Math.round(x) + bob} y={Math.round(y)} map={{O: K.ink, W: p.skin === 'cream' ? '#FFFFFF' : '#FFFFFF'}} />;
  };

  let body: React.ReactNode = null;
  if (scr.type === 'battle') {
    const winC = portrait ? {x: 6, y: NH - 56, w: NW - 12, h: 44} : {x: 6, y: 114, w: 90, h: 62};
    const winS = portrait ? {x: 6, y: NH - 130, w: NW - 12, h: 66} : {x: 102, y: 114, w: 212, h: 62};
    const items = ['FIGHT', 'ITEM', 'MAGIC', 'RUN'];
    const pos = (i: number): [number, number] => (portrait ? [winC.x + 20 + (i % 2) * 70, winC.y + 8 + Math.floor(i / 2) * 18] : [winC.x + 22, winC.y + 8 + i * 13]);
    // cursor script: [t, idx]; hesitation spans freeze the bob
    const script: [number, number][] = [[10, 0], [22, 1], [30, 2], [44, 0]];
    let idx = 0;
    script.forEach(([tt, ii]) => {
      if (t >= tt) idx = ii;
    });
    const hes = (t >= 22 && t < 30) || (t >= 44 && t < 58);
    if (t === 22 || t === 30 || t === 44) cues.push('CURSOR');
    const sel = t >= 58 && t < 64;
    if (t === 58) cues.push('SELECT');
    const hit = t >= 66;
    const hk = sseg(t, 68, 83); // hp tick-down over 0.5 s
    if (t >= 68 && t < 83 && t % 3 === 0) cues.push('HP TICK');
    const [cxp, cyp] = pos(idx);
    const enemyY = portrait ? 78 : 48;
    const eFlash = t >= 62 && t < 70 && Math.floor((t - 62) / 2) % 2 === 0;
    const eBob = Math.floor(frame / 8) % 2;
    const rows = [6, 10, 14, 17, 19, 20, 20, 20, 18, 14];
    const slime = (
      <g transform={`translate(${Math.round(NW / 2 - 20)} ${enemyY + eBob})`}>
        {rows.map((rw, j) => (
          <rect key={j} x={Math.round(20 - rw)} y={j * 4} width={rw * 2} height={4} fill={eFlash ? '#FFFFFF' : j < 2 ? '#7DE0A8' : '#3FBF7F'} />
        ))}
        <rect x={12} y={14} width={4} height={6} fill="#0B1A12" />
        <rect x={24} y={14} width={4} height={6} fill="#0B1A12" />
        <rect x={10} y={8} width={6} height={2} fill="#C8F5DC" />
        <rect x={6} y={40} width={28} height={3} fill="rgba(0,0,0,0.3)" />
      </g>
    );
    body = (
      <g>
        {slime}
        {hit && t < 90 && <text x={NW / 2} y={enemyY - 4 - Math.min(8, (t - 66) / 2)} fontFamily={s1f.press} fontSize={8} textAnchor="middle" fill="#FFE27A" stroke={K.ink} strokeWidth={0.5}>{`-${36}`}</text>}
        <Win id="cmd" x={winC.x} y={winC.y} w={winC.w} h={winC.h} from={portrait ? 'bottom' : 'left'}>
          {items.map((it, i) => {
            const [x, y] = pos(i);
            return <React.Fragment key={it}>{T(x, y, it, sel && i === idx && Math.floor(t / 2) % 2 === 0 ? p.accent : K.text)}</React.Fragment>;
          })}
          {t > 9 && t < scr.dur - 8 && <Cursor x={cxp - 16} y={cyp - 1} freeze={hes} />}
        </Win>
        <Win id="st" x={winS.x} y={winS.y} w={winS.w} h={winS.h} from={portrait ? 'right' : 'right'} delay={3}>
          {p.party.slice(0, 3).map((m, i) => {
            const rowY = winS.y + 8 + i * (portrait ? 17 : 17);
            const hp = i === 0 ? Math.round(m.hp + (m.hpTo - m.hp) * (hit ? hk : 0)) : m.hp;
            const frac = m.maxHp ? hp / m.maxHp : 0;
            const low = frac < 0.25 && hp > 0;
            const ko = hp <= 0;
            const nameX = winS.x + 8;
            const barX = winS.x + (portrait ? 44 : 70);
            const barW = portrait ? 40 : 60;
            const numX = barX + barW + 6;
            const col = m.dim ? K.dim : K.text;
            return (
              <g key={i}>
                {T(nameX, rowY, m.name.toUpperCase().slice(0, 5), col)}
                {!ko && (
                  <g>
                    <rect x={barX} y={rowY + 2} width={barW} height={4} fill={K.ink} />
                    <rect x={barX} y={rowY + 2} width={Math.round(barW * frac)} height={4} fill={m.dim ? K.dim : low ? '#E43B44' : '#58D68D'} />
                    <rect x={barX} y={rowY + 2} width={Math.round(barW * frac)} height={1} fill="rgba(255,255,255,0.45)" />
                  </g>
                )}
                {ko ? (Math.floor(frame / 2.5) % 2 === 0 ? T(barX, rowY, 'KO', '#E43B44') : null) : T(numX, rowY, `${String(hp).padStart(3, '0')}/${m.maxHp}`, low ? '#E43B44' : col)}
              </g>
            );
          })}
        </Win>
      </g>
    );
  } else if (scr.type === 'levelup') {
    const ww = portrait ? NW - 20 : 170;
    const hh = portrait ? 120 : 110;
    const x = Math.round((NW - ww) / 2);
    const y = Math.round((NH - hh) / 2) - (portrait ? 20 : 4);
    const stats: [string, number, number][] = [['LEVEL', 7, 8], ['MAX HP', 150, 172], ['ATTACK', 24, 27], ['SPEED', 18, 19]];
    if (t === 14) cues.push('FANFARE');
    body = (
      <g>
        {T(NW / 2, y - 22, 'LEVEL UP!', Math.floor(frame / 3) % 2 ? '#FFE27A' : p.accent, true, 'middle')}
        <Win id="lv" x={x} y={y} w={ww} h={hh} from="none">
          {T(x + 10, y + 10, p.party[0]?.name.toUpperCase().slice(0, 6) ?? 'HERO')}
          {stats.map(([lab, a, b], i) => {
            const t1 = 12 + i * 10;
            const k = sseg(t, t1, t1 + 14);
            const v = Math.round(a + (b - a) * k);
            const rolling = k > 0 && k < 1;
            const ry = y + 28 + i * 20;
            const shown = rolling ? String(v).split('').map((ch, ci) => (sh(Math.floor(frame / 2), ci, i) < 0.5 ? ch : String((v + ci + 3) % 10))).join('') : String(v);
            return (
              <g key={lab} opacity={clamp(sseg(t, t1 - 4, t1))}>
                {T(x + 10, ry, lab)}
                {T(x + ww - 44, ry, shown.padStart(3, ' '), k >= 1 ? '#FFE27A' : K.text, true, 'end')}
                {k >= 1 && T(x + ww - 40, ry, `+${b - a}`, '#7DE0A8')}
              </g>
            );
          })}
        </Win>
        {Array.from({length: 8}, (_, i) => {
          const ph = (t * 0.9 + i * 11) % 40;
          const sx = x + 6 + ((i * 37) % (ww - 12));
          const sy = y + hh - ph * 2.4;
          return <rect key={i} x={Math.round(sx)} y={Math.round(sy)} width={2} height={2} fill="#FFE27A" opacity={t > 12 ? 0.9 - ph / 50 : 0} />;
        })}
      </g>
    );
  } else if (scr.type === 'save') {
    const ww = portrait ? NW - 16 : 220;
    const hh = 100;
    const x = Math.round((NW - ww) / 2);
    const y = Math.round((NH - hh) / 2) - (portrait ? 10 : 0);
    const script: [number, number][] = [[10, 0], [32, 1], [44, 2]];
    let idx = 0;
    script.forEach(([tt, ii]) => {
      if (t >= tt) idx = ii;
    });
    const hes = (t >= 14 && t < 32) || (t >= 46 && t < 58);
    if (t === 32 || t === 44) cues.push('CURSOR');
    const chosen = t >= 58;
    if (t === 58) cues.push('SELECT');
    const slots: [string, string][] = [['FILE 1', 'LV12 03:41'], ['FILE 2', 'LV05 00:58'], ['NEW FILE', '']];
    body = (
      <g>
        <Win id="sv" x={x} y={y} w={ww} h={hh} from="bottom">
          {T(x + 10, y + 8, 'SAVE', K.text)}
          {slots.map(([a, b], i) => {
            const ry = y + 24 + i * 22;
            const on = idx === i;
            const blink = chosen && on && Math.floor((t - 58) / 2) % 2 === 0;
            return (
              <g key={a}>
                {on && <rect x={x + 8} y={ry - 3} width={ww - 16} height={16} fill="none" stroke={blink ? '#FFFFFF' : p.accent} strokeWidth={1} />}
                {T(x + 34, ry, a, i === 2 ? '#7DE0A8' : K.text)}
                {b && T(x + ww - 12, ry, portrait ? b.slice(0, 4) : b, K.dim, true, 'end')}
              </g>
            );
          })}
          {t > 9 && <Cursor x={x + 14 - 4} y={y + 24 + idx * 22 - 1} freeze={hes} />}
        </Win>
        {chosen && t >= 64 && (
          <Win id="sv2" x={Math.round((NW - 100) / 2)} y={y + hh + 14} w={100} h={22} from="bottom" delay={64 - 0}>
            {T(NW / 2, y + hh + 14 + 7, 'NEW FILE SAVED', K.text, true, 'middle')}
          </Win>
        )}
      </g>
    );
  } else {
    const ww = portrait ? NW - 24 : 190;
    const hh = 52;
    const x = Math.round((NW - ww) / 2);
    const y = portrait ? 120 : 84;
    const chars = Math.min(p.item.length + 8, Math.floor(Math.max(0, t - 12) / 2));
    const line = `FOUND ${p.item.toUpperCase()}!`.slice(0, chars);
    if (t === 10) cues.push('ITEM GET');
    body = (
      <g>
        <Win id="it" x={x} y={y} w={ww} h={hh} from="bottom">
          <Px rows={POTION} x={x + 12} y={y + 14} s={2} map={{O: K.ink, W: '#FFFFFF', P: '#E43B8A', H: '#FF9ED0'}} />
          {T(x + 46, y + 14, line)}
          {T(x + 46, y + 30, 'IN BAG: 03', K.dim)}
        </Win>
        {[0, 1, 2, 3].map((i) => {
          const ph = (t * 0.7 + i * 7) % 18;
          return <rect key={i} x={x + 14 + i * 5 + Math.round(Math.sin(i * 2 + t * 0.2) * 3)} y={y + 10 - Math.round(ph)} width={2} height={2} fill="#FFE27A" opacity={1 - ph / 18} />;
        })}
      </g>
    );
  }

  // pixel backdrop: dithered sky bands, stepped hills, stars
  const sky = [
    ['#161A46', '#1D2358'], ['#232B6E', '#2B3585'], ['#3B3F9A', '#4C4DB0'], ['#7457B8', '#9362BE'], ['#C77DA6', '#E58F9A'],
  ];
  const backdrop = (
    <g>
      {sky.map(([a, b], i) => {
        const bh = Math.ceil(NH * 0.7 / sky.length);
        return (
          <g key={i}>
            <rect x={0} y={i * bh} width={NW} height={bh} fill={a} />
            {Array.from({length: Math.ceil(NW / 2)}, (_, j) => (j % 2 === 0 ? <rect key={j} x={j * 2} y={i * bh + bh - 2} width={1} height={1} fill={b} /> : <rect key={j} x={j * 2} y={i * bh + bh - 1} width={1} height={1} fill={b} />))}
          </g>
        );
      })}
      {Array.from({length: 18}, (_, i) => (
        <rect key={i} x={Math.floor(sh(i, 1) * NW)} y={Math.floor(sh(i, 2) * NH * 0.3)} width={1} height={1} fill="#FFFFFF" opacity={0.5 + 0.5 * Math.sin(frame * 0.15 + i)} />
      ))}
      {Array.from({length: Math.ceil(NW / 8)}, (_, i) => {
        const hv = 22 + Math.round(10 * Math.sin(i * 0.5) + 6 * Math.sin(i * 1.3));
        return <rect key={i} x={i * 8} y={NH * 0.72 - hv} width={8} height={hv + NH * 0.3} fill="#0F1630" />;
      })}
      <rect x={0} y={NH * 0.72} width={NW} height={NH} fill="#0A0F24" />
    </g>
  );
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <g transform={`translate(${ox} ${oy}) scale(${S})`} shapeRendering="crispEdges">
          <clipPath id={`${uid}-all`}>
            <rect width={NW} height={NH} />
          </clipPath>
          <g clipPath={`url(#${uid}-all)`}>
            {backdrop}
            {body}
            {p.showCues && cues.length > 0 && (
              <g>
                <rect x={NW - 74} y={4} width={70} height={11} fill={K.ink} opacity={0.8} />
                <text x={NW - 8} y={12} fontFamily={s1f.silk} fontSize={7} fill="#7DE0A8" textAnchor="end">{`SFX ${cues[0]}`}</text>
              </g>
            )}
          </g>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const rpgMenuUi = defineMotion<Props>({
  id: 'rpg-menu-ui',
  title: 'RPG menu UI',
  category: 'game',
  description:
    'Game systems as narration at native 320x180: FIGHT/ITEM/MAGIC/RUN with a bobbing hand cursor that hesitates, a party window with HP ticking down (red when low, greyed member, blinking KO), a level-up stat roll, a save-file list choosing NEW FILE and an item-get box, on a dithered blue window skin.',
  source: ['lemo-opuscar styles/pixel-rpg demo/ui.js + main.js + STYLE.md section 8 (MIT / CC BY 4.0, LemoLab)'],
  useFor: '"Level up" product or skill announcements, comparison as a stat screen, career or version histories as save files, playful UI for game studios and dev content.',
  durationInFrames: 300,
  defaultProps: {
    screens: [
      {type: 'battle', t0: 0, dur: 100},
      {type: 'levelup', t0: 100, dur: 88},
      {type: 'save', t0: 188, dur: 70},
      {type: 'item', t0: 258, dur: 42},
    ],
    skin: 'blue',
    party: [
      {name: 'Ada', hp: 120, hpTo: 34, maxHp: 150},
      {name: 'Bo', hp: 31, hpTo: 31, maxHp: 90},
      {name: 'Cyd', hp: 0, hpTo: 0, maxHp: 80, dim: true},
    ],
    item: 'Elixir',
    accent: '#FFD23F',
    showCues: false,
    background: '#05060F',
  },
  propDocs: {
    screens: 'sequence of {type: battle|levelup|save|item, t0 start frame, dur frames}',
    skin: 'window skin: blue | night | cream',
    party: 'battle party rows {name, hp, hpTo (hp after the hit, first member only), maxHp, dim}',
    item: 'name shown in the item-get box',
    accent: 'selection highlight colour',
    showCues: 'show tiny SFX cue tags (cursor, select, HP tick, fanfare, item get) for sound design',
    background: 'letterbox colour',
  },
  component: RpgMenuUi,
  tags: ['rpg', 'pixel', 'menu', 'game ui', 'level up', 'save file', 'battle', 'hp', 'cursor', '8-bit', 'jrpg', 'stat screen', 'retro', 'item get'],
});
