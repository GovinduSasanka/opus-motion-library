import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {BP, GlowDot, ScanlineBg} from '../../core/hud-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {FlatIcon, bez, inOutCubic, lin, outBack, rgba} from '../../core/ui-kit';

/**
 * mode 'hand' — video21 card-hand-deal-and-play + hit-flash-damage-pop: five cards deal from the draw pile
 * into a fanned hand (−6°…+6°, 20 px arc, 0.08 s stagger, cubic-bezier(.2,.9,.3,1.2)), hover lifts a card
 * 40 px ×1.15 with a tooltip, the chosen card flies to centre, an orange burn line runs along its base and it
 * dissolves upward; the enemy flashes to a white silhouette, a slash streak crosses it, the damage number pops
 * 1.6→1 and floats up, a pink status rises and the HP bar drains with a white ghost segment. A new card is drawn.
 * mode 'connect' — video19 card-fan-connect: three glass cards fly out of capsules (easeOutBack), fan at
 * −8° / +6° / −2°, thin blue lines link matching icons while a glowing dot hops along them ("CONNECT"), then
 * the cards collapse into one icon bar with the centre icon lit ("REASON").
 */
type Card = {title: string; cost: number; icon: string; text: string; color: string};
type Props = {
  mode: 'hand' | 'connect';
  cards: Card[];
  playIndex: number;
  damage: number;
  status: string;
  energy: number;
  enemyHp: number[];
  fanAngle: number;
  dealStagger: number;
  background: string;
  labels: string[];
  accent: string;
};

const dealEase = bez(0.2, 0.9, 0.3, 1.2);

// ------------------------------------------------------------------------------------------- hand mode
const CardFace: React.FC<{c: Card; cw: number; ch: number; u: number; id: string; back?: boolean}> = ({c, cw, ch, u, id, back}) => {
  const r = 12 * u;
  if (back)
    return (
      <g>
        <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={r} fill="#1d2142" stroke="#c9a25a" strokeWidth={3 * u} />
        <rect x={-cw / 2 + 10 * u} y={-ch / 2 + 10 * u} width={cw - 20 * u} height={ch - 20 * u} rx={r * 0.6} fill="none" stroke="#c9a25a" strokeWidth={1.2 * u} opacity={0.7} />
        <path d={`M0 ${-ch * 0.22} L${cw * 0.22} 0 L0 ${ch * 0.22} L${-cw * 0.22} 0 Z`} fill="none" stroke="#c9a25a" strokeWidth={2 * u} />
        <circle r={cw * 0.07} fill="#c9a25a" />
      </g>
    );
  const artY = -ch / 2 + 46 * u;
  const artH = ch * 0.4;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-art`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.color} stopOpacity={0.95} />
          <stop offset="1" stopColor="#15111f" />
        </linearGradient>
      </defs>
      <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={r} fill="#2a2236" stroke="#c9a25a" strokeWidth={3 * u} />
      <rect x={-cw / 2 + 7 * u} y={-ch / 2 + 7 * u} width={cw - 14 * u} height={ch - 14 * u} rx={r * 0.7} fill="none" stroke="#6b5737" strokeWidth={1.2 * u} />
      <text x={6 * u} y={-ch / 2 + 32 * u} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={15 * u} fill="#f3e6c8">
        {c.title}
      </text>
      <rect x={-cw / 2 + 13 * u} y={artY} width={cw - 26 * u} height={artH} rx={6 * u} fill={`url(#${id}-art)`} stroke="#6b5737" strokeWidth={1.5 * u} />
      <FlatIcon kind={c.icon} x={0} y={artY + artH / 2} s={artH * 0.72} ink="#1a1426" />
      {wrap(c.text, 20).map((ln, i) => (
        <text key={i} x={0} y={artY + artH + 30 * u + i * 19 * u} textAnchor="middle" fontFamily={fonts.sans} fontWeight={600} fontSize={13.5 * u} fill="#e6dcc8">
          {ln}
        </text>
      ))}
      <circle cx={-cw / 2 + 8 * u} cy={-ch / 2 + 8 * u} r={18 * u} fill="#3b6fd0" stroke="#e8d29a" strokeWidth={2.5 * u} />
      <text x={-cw / 2 + 8 * u} y={-ch / 2 + 15 * u} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={20 * u} fill="#fff">
        {c.cost}
      </text>
    </g>
  );
};

const wrap = (s: string, n: number) => {
  const out: string[] = [];
  let line = '';
  for (const word of s.split(' ')) {
    if ((line + ' ' + word).trim().length > n && line) {
      out.push(line);
      line = word;
    } else line = (line + ' ' + word).trim();
  }
  if (line) out.push(line);
  return out.slice(0, 3);
};

const Enemy: React.FC<{x: number; y: number; s: number; frame: number; white: number; id: string}> = ({x, y, s, frame, white, id}) => {
  const t = frame / 30;
  const bob = Math.sin(t * 2) * 6 * (s / 260);
  const body = '#5b3f86';
  const shade = '#3b2760';
  const fill = (c: string) => (white > 0 ? '#ffffff' : c);
  const tent = Array.from({length: 6}, (_, i) => {
    const bx = x + (i - 2.5) * s * 0.11;
    const by = y + s * 0.12 + bob;
    const sw = Math.sin(t * 3 + i * 1.1) * s * 0.06;
    return `M${bx - s * 0.035} ${by} C${bx - s * 0.04 + sw} ${by + s * 0.16} ${bx + sw * 1.6} ${by + s * 0.26} ${bx + sw * 2 + s * 0.04} ${by + s * 0.34} C${bx + sw + s * 0.02} ${by + s * 0.24} ${bx + s * 0.04} ${by + s * 0.12} ${bx + s * 0.035} ${by} Z`;
  });
  return (
    <g opacity={white > 0 ? 0.92 : 1}>
      <defs>
        <radialGradient id={`${id}-sh`}>
          <stop offset="0" stopColor="#000" stopOpacity={0.5} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y + s * 0.5} rx={s * 0.42} ry={s * 0.07} fill={`url(#${id}-sh)`} />
      {tent.map((d, i) => (
        <path key={i} d={d} fill={fill(i % 2 ? shade : body)} />
      ))}
      <path d={`M${x - s * 0.33} ${y + s * 0.14 + bob} C${x - s * 0.38} ${y - s * 0.35 + bob} ${x + s * 0.38} ${y - s * 0.35 + bob} ${x + s * 0.33} ${y + s * 0.14 + bob} Z`} fill={fill(body)} />
      {white <= 0 && (
        <>
          <ellipse cx={x - s * 0.1} cy={y - s * 0.12 + bob} rx={s * 0.12} ry={s * 0.06} fill={shade} opacity={0.5} />
          {[-1, 1].map((k) => (
            <g key={k}>
              <ellipse cx={x + k * s * 0.11} cy={y - s * 0.02 + bob} rx={s * 0.06} ry={s * 0.075} fill="#f6e7a3" />
              <ellipse cx={x + k * s * 0.11 + s * 0.012} cy={y + bob} rx={s * 0.025} ry={s * 0.045} fill="#1a0f26" />
            </g>
          ))}
        </>
      )}
    </g>
  );
};

const HandMode: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, portrait} = useStage();
  const n = p.cards.length;
  const cs = portrait ? 1.3 : 1.2;
  const cw = 175 * u * cs;
  const ch = 250 * u * cs;
  const pi = Math.min(n - 1, Math.max(0, p.playIndex));
  const spacing = portrait ? Math.min(230 * u, (w - 160 * u) / n) : 190 * u * cs;
  const baseY = h - ch * 0.5 - (portrait ? 90 : 40) * u;
  const pile = portrait ? {x: 110 * u, y: h - ch - 330 * u} : {x: 150 * u, y: h - 120 * u};
  const enemy = portrait ? {x: cx, y: h * 0.27, s: 440 * u} : {x: cx + w * 0.17, y: h * 0.33, s: 360 * u};
  const play = portrait ? {x: cx, y: h * 0.53} : {x: cx - w * 0.14, y: h * 0.38};
  const orb = portrait ? {x: w - 110 * u, y: h - ch - 330 * u} : {x: w - 150 * u, y: h - 320 * u};

  // timeline
  const T = {deal: 10, hover1: 44, hover2: 60, play: 86, burn: 96, dissolve: 104, hit: 112, draw: 150};
  const st = Math.max(1, p.dealStagger * 30);
  const played = frame >= T.play;
  const closeT = prog(frame, T.play + 2, T.play + 10, ease.out);
  const drawT = prog(frame, T.draw, T.draw + 11, dealEase);
  // fan slot positions for k cards
  const slot = (i: number, k: number) => {
    const m = (k - 1) / 2;
    const nn = k > 1 ? (i - m) / m : 0;
    return {x: cx + (i - m) * spacing, y: baseY + 20 * u * nn * nn, r: p.fanAngle * nn};
  };
  // which index (in the remaining hand) does card i occupy
  const remain = p.cards.map((_, i) => i).filter((i) => i !== pi);
  const hoverIdx = frame >= T.hover1 && frame < T.hover2 ? (pi + 1) % n : frame >= T.hover2 && frame < T.play ? pi : -1;
  const shake = frame >= T.hit && frame < T.hit + 6 ? Math.sin(frame * 3.1) * 6 * u * (1 - (frame - T.hit) / 6) : 0;

  const cards = p.cards.map((c, i) => {
    const t0 = T.deal + i * st;
    const d = lin(frame, t0, t0 + 11);
    const e = dealEase(d);
    const full = slot(i, n);
    let x = lerp(pile.x, full.x, e);
    let y = lerp(pile.y, full.y, e) - Math.sin(Math.PI * d) * 60 * u;
    let r = lerp(-24, full.r, e);
    let sc = lerp(0.7, 1, e);
    let op = frame >= t0 ? 1 : 0;
    const flip = Math.abs(Math.cos(Math.PI * clamp(d * 1.4)));
    const back = d < 0.36;
    let blur = 0;
    if (i === pi && played) {
      const m = prog(frame, T.play, T.play + 9, ease.out);
      x = lerp(full.x, play.x, m);
      y = lerp(full.y - 40 * u, play.y, m);
      r = lerp(full.r, 0, m);
      sc = lerp(1.15, 1.1, m);
      const dis = prog(frame, T.dissolve, T.dissolve + 12, ease.in);
      y -= dis * 70 * u;
      op = 1 - dis;
      blur = dis * 8 * u;
    } else if (played) {
      const k = remain.indexOf(i);
      const after = slot(k, n - 1);
      const back5 = slot(k, n);
      const a = {x: lerp(full.x, after.x, closeT), y: lerp(full.y, after.y, closeT), r: lerp(full.r, after.r, closeT)};
      // new card drawn: re-fan to n
      x = lerp(a.x, back5.x, drawT);
      y = lerp(a.y, back5.y, drawT);
      r = lerp(a.r, back5.r, drawT);
    }
    const hv = i === hoverIdx ? prog(frame, i === pi ? T.hover2 : T.hover1, (i === pi ? T.hover2 : T.hover1) + 5, ease.out) : 0;
    const hvOut = i === (pi + 1) % n ? 1 - prog(frame, T.hover2, T.hover2 + 5, ease.out) : 1;
    const lift = (i === pi && played ? 0 : hv * hvOut) as number;
    y -= lift * 40 * u;
    sc *= 1 + 0.15 * lift;
    const rr = r * (1 - lift);
    return {i, c, x, y, r: rr, sc, op, back, flipX: back ? flip : flip, blur, lift, z: i === pi && played ? 100 : lift > 0 ? 50 : i};
  });
  // newly drawn card (repeat of the played one, from the pile)
  const newCard = frame >= T.draw ? (() => {
    const d = lin(frame, T.draw, T.draw + 11);
    const e = dealEase(d);
    const k = n - 1;
    const s5 = slot(k, n);
    return {x: lerp(pile.x, s5.x, e), y: lerp(pile.y, s5.y, e) - Math.sin(Math.PI * d) * 60 * u, r: lerp(-24, s5.r, e), sc: lerp(0.7, 1, e), back: d < 0.36, flip: Math.abs(Math.cos(Math.PI * clamp(d * 1.4)))};
  })() : null;
  // note: when the new card arrives the remaining cards occupy slots 0..n-2 of n
  const sorted = [...cards].sort((a, b) => a.z - b.z);

  // hit reaction
  const hitF = frame - T.hit;
  const white = hitF >= 0 && hitF < 3 ? 1 : 0;
  const slashT = clamp(hitF / 3);
  const numPop = hitF >= 0 ? lerp(1.6, 1, clamp(hitF / 4)) : 0;
  const numRise = clamp((hitF - 4) / 24);
  const statusF = hitF - 9;
  const [hp0, hpMax] = p.enemyHp;
  const hp1 = Math.max(0, hp0 - p.damage);
  const hpT = prog(frame, T.hit, T.hit + 9, ease.out);
  const ghostT = prog(frame, T.hit + 6, T.hit + 15, ease.out);
  const hpNow = lerp(hp0, hp1, hpT);
  const hpGhost = lerp(hp0, hp1, ghostT);
  const barW = 220 * u;
  const barX = enemy.x - barW / 2;
  const barY = enemy.y + enemy.s * 0.62;
  const energyNow = frame >= T.play + 6 ? Math.max(0, p.energy - p.cards[pi].cost) : p.energy;
  const orbPop = frame >= T.play + 6 && frame < T.play + 12 ? 1 + 0.15 * Math.sin(((frame - T.play - 6) / 6) * Math.PI) : 1;
  const burnT = prog(frame, T.burn, T.burn + 8, ease.out);
  const pc = cards[pi];
  const enter = prog(frame, 0, 10, ease.out);

  return (
    <AbsoluteFill style={{background: p.background}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 35%, #3d2d63 0%, #1d1534 45%, #0b0815 100%)`, opacity: enter}} />
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {/* motes */}
        {Array.from({length: 40}, (_, i) => {
          const x = ((i * 137.5) % 100) / 100 * w + Math.sin(frame * 0.02 + i) * 20 * u;
          const y = (((i * 71.3) % 100) / 100) * h * 0.8 - ((frame * (0.4 + (i % 5) * 0.15) * u) % (h * 0.8));
          return <circle key={i} cx={x} cy={(y + h * 0.8) % (h * 0.8)} r={(1 + (i % 3)) * u} fill="#c9b6ff" opacity={0.25 + 0.2 * Math.sin(frame * 0.1 + i)} />;
        })}
        <g transform={`translate(${shake} ${shake * 0.4})`}>
          <Enemy x={enemy.x} y={enemy.y} s={enemy.s} frame={frame} white={white} id="cf-enemy" />
          {/* HP bar */}
          <rect x={barX} y={barY} width={barW} height={14 * u} rx={7 * u} fill="#1a1222" stroke="#000" strokeWidth={2 * u} />
          <rect x={barX + 2 * u} y={barY + 2 * u} width={(barW - 4 * u) * (hpGhost / hpMax)} height={10 * u} rx={5 * u} fill="#ffffff" opacity={0.85} />
          <rect x={barX + 2 * u} y={barY + 2 * u} width={(barW - 4 * u) * (hpNow / hpMax)} height={10 * u} rx={5 * u} fill="#c8343e" />
          <text x={enemy.x} y={barY + 38 * u} textAnchor="middle" fontFamily={fonts.sans} fontWeight={700} fontSize={18 * u} fill="#e9dff5">
            {Math.round(hpNow)}/{hpMax}
          </text>
          {/* slash */}
          {hitF >= 0 && hitF < 8 && (
            <g transform={`rotate(-25 ${enemy.x} ${enemy.y})`} opacity={1 - clamp((hitF - 3) / 5)}>
              <path d={`M${enemy.x - 150 * u} ${enemy.y} Q${enemy.x} ${enemy.y - 10 * u} ${enemy.x + 150 * u} ${enemy.y}`} fill="none" stroke="#ffffff" strokeWidth={9 * u} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - slashT} style={{filter: `drop-shadow(0 0 ${8 * u}px #ffffff)`}} />
            </g>
          )}
        </g>
        {/* draw pile */}
        {[3, 2, 1, 0].map((k) => (
          <g key={k} transform={`translate(${pile.x + k * 3 * u} ${pile.y - k * 3 * u}) rotate(-12) scale(0.62)`}>
            <CardFace c={p.cards[0]} cw={cw} ch={ch} u={u} id={`cf-pile${k}`} back />
          </g>
        ))}
        <circle cx={pile.x + 50 * u} cy={pile.y + 55 * u} r={18 * u} fill="#141020" stroke="#c9a25a" strokeWidth={2 * u} />
        <text x={pile.x + 50 * u} y={pile.y + 62 * u} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={18 * u} fill="#f3e6c8">
          {Math.max(0, 12 - cards.filter((c) => c.op > 0).length - (newCard ? 1 : 0))}
        </text>
        {/* energy orb */}
        <defs>
          <radialGradient id="cf-orb" cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#FFF1C4" />
            <stop offset="0.45" stopColor="#EDCE93" />
            <stop offset="1" stopColor="#B07020" />
          </radialGradient>
        </defs>
        <g transform={`translate(${orb.x} ${orb.y}) scale(${orbPop})`}>
          <circle r={46 * u} fill="#f2b24a" opacity={0.18} />
          <circle r={38 * u} fill="url(#cf-orb)" stroke="#5a3a10" strokeWidth={3 * u} />
          <text y={14 * u} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={40 * u} fill="#3a2408">
            {energyNow}
          </text>
        </g>
        {/* hand */}
        {sorted.map((k) =>
          k.op <= 0.001 ? null : (
            <g key={k.i} transform={`translate(${k.x} ${k.y}) rotate(${k.r}) scale(${k.sc * Math.max(0.04, k.flipX)} ${k.sc})`} opacity={k.op} style={k.blur ? {filter: `blur(${k.blur}px)`} : undefined}>
              {k.lift > 0.01 && <rect x={-cw / 2 - 6 * u} y={-ch / 2 - 6 * u} width={cw + 12 * u} height={ch + 12 * u} rx={16 * u} fill="none" stroke="#ffe7a8" strokeWidth={3 * u} opacity={k.lift * 0.8} style={{filter: `drop-shadow(0 0 ${10 * u}px #ffcf6a)`}} />}
              <CardFace c={k.c} cw={cw} ch={ch} u={u} id={`cf-c${k.i}`} back={k.back} />
              {k.i === pi && burnT > 0 && (
                <rect x={-cw / 2} y={ch / 2 - 3 * u} width={cw * burnT} height={6 * u} rx={3 * u} fill="#F2A54A" style={{filter: `drop-shadow(0 0 ${10 * u}px #F2A54A) drop-shadow(0 0 ${4 * u}px #ffd28a)`}} />
              )}
            </g>
          ),
        )}
        {newCard && (
          <g transform={`translate(${newCard.x} ${newCard.y}) rotate(${newCard.r}) scale(${newCard.sc * Math.max(0.04, newCard.flip)} ${newCard.sc})`}>
            <CardFace c={pc.c} cw={cw} ch={ch} u={u} id="cf-new" back={newCard.back} />
          </g>
        )}
        {/* tooltip next to hovered card */}
        {hoverIdx >= 0 &&
          (() => {
            const k = cards[hoverIdx];
            const a = prog(frame, hoverIdx === pi ? T.hover2 + 2 : T.hover1 + 2, (hoverIdx === pi ? T.hover2 : T.hover1) + 7, ease.out);
            const tx = Math.min(k.x + cw * 0.62, w - 250 * u);
            const ty = k.y - ch * 0.62;
            return (
              <g opacity={a}>
                <rect x={tx} y={ty} width={230 * u} height={70 * u} rx={8 * u} fill="#141020" stroke="#c9a25a" strokeWidth={1.5 * u} opacity={0.94} />
                <text x={tx + 14 * u} y={ty + 28 * u} fontFamily={fonts.sans} fontWeight={800} fontSize={16 * u} fill="#f3d28a">
                  {k.c.title}
                </text>
                <text x={tx + 14 * u} y={ty + 52 * u} fontFamily={fonts.sans} fontWeight={500} fontSize={13 * u} fill="#e6dcc8">
                  {wrap(k.c.text, 30)[0]}
                </text>
              </g>
            );
          })()}
        {/* damage + status */}
        {hitF >= 0 && numRise < 1 && (
          <g transform={`translate(${enemy.x + 10 * u} ${enemy.y - 10 * u - numRise * 40 * u}) scale(${numPop})`} opacity={1 - Math.max(0, numRise - 0.5) * 2}>
            <text textAnchor="middle" fontFamily={fonts.display} fontSize={78 * u} fill="#ffffff" stroke="#1a0f26" strokeWidth={8 * u} paintOrder="stroke">
              {p.damage}
            </text>
          </g>
        )}
        {statusF >= 0 && statusF < 30 && (
          <text x={enemy.x + 70 * u} y={enemy.y + 30 * u - (statusF / 30) * 50 * u} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={30 * u} fill="#E07A8A" stroke="#1a0f26" strokeWidth={5 * u} paintOrder="stroke" opacity={1 - clamp((statusF - 18) / 12)}>
            {p.status}
          </text>
        )}
      </svg>
      {white > 0 && <AbsoluteFill style={{background: '#fff', opacity: 0.08}} />}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------- connect mode
type Icon = {k: 'circle' | 'tri' | 'square' | 'minus' | 'menu' | 'box'; x: number; y: number; label?: string};

const IconGlyph: React.FC<{ic: Icon; s: number; color: string; lit?: number}> = ({ic, s, color, lit = 0}) => {
  const sw = s * 0.12;
  const f = lit > 0 ? rgba('#4777D2', 0.5 * lit) : 'none';
  switch (ic.k) {
    case 'circle':
      return <circle cx={ic.x} cy={ic.y} r={s * 0.45} fill={f} stroke={color} strokeWidth={sw} />;
    case 'tri':
      return <path d={`M${ic.x} ${ic.y - s * 0.5} L${ic.x + s * 0.48} ${ic.y + s * 0.38} L${ic.x - s * 0.48} ${ic.y + s * 0.38} Z`} fill={f} stroke={color} strokeWidth={sw} strokeLinejoin="round" />;
    case 'square':
      return <rect x={ic.x - s * 0.4} y={ic.y - s * 0.4} width={s * 0.8} height={s * 0.8} fill={f} stroke={color} strokeWidth={sw} />;
    case 'minus':
      return (
        <g>
          <circle cx={ic.x} cy={ic.y} r={s * 0.45} fill={f} stroke={color} strokeWidth={sw} />
          <line x1={ic.x - s * 0.25} x2={ic.x + s * 0.25} y1={ic.y} y2={ic.y} stroke={color} strokeWidth={sw} />
        </g>
      );
    case 'menu':
      return (
        <g stroke={color} strokeWidth={sw}>
          {[-0.3, 0, 0.3].map((k) => (
            <line key={k} x1={ic.x - s * 0.4} x2={ic.x + s * 0.4} y1={ic.y + k * s} y2={ic.y + k * s} />
          ))}
        </g>
      );
    case 'box':
      return (
        <g>
          <rect x={ic.x - s * 0.7} y={ic.y - s * 0.45} width={s * 1.4} height={s * 0.9} fill={f} stroke={color} strokeWidth={sw * 0.8} />
          <text x={ic.x} y={ic.y + s * 0.22} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={s * 0.6} fill={color}>
            {ic.label}
          </text>
        </g>
      );
  }
};

const ConnectMode: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const k = portrait ? 0.95 : 1.05;
  const CW = 450 * u * k;
  const CH = 290 * u * k;
  const line = BP.line;
  const accent = p.accent;
  // card layout (centre offsets in u, rotation)
  const targets = portrait
    ? [
        {x: -40, y: -300, r: -8},
        {x: 50, y: -40, r: 6},
        {x: 0, y: 230, r: -2},
      ]
    : [
        {x: -190, y: -70, r: -8},
        {x: 170, y: -40, r: 6},
        {x: -10, y: 120, r: -2},
      ];
  const pills = portrait
    ? [
        {x: -260, y: -520, r: -20},
        {x: 280, y: -150, r: 22},
        {x: 0, y: 520, r: 0},
      ]
    : [
        {x: -520, y: 20, r: -20},
        {x: 520, y: -80, r: 22},
        {x: 0, y: 360, r: 0},
      ];
  // card-local icons (in card px before scale)
  const icons: Icon[][] = [
    [
      {k: 'circle', x: -150, y: 70},
      {k: 'tri', x: 70, y: -70},
      {k: 'square', x: 130, y: 60},
    ],
    [
      {k: 'tri', x: -150, y: 80},
      {k: 'box', x: 20, y: 70, label: '42'},
      {k: 'box', x: 130, y: -70, label: '17'},
    ],
    [
      {k: 'minus', x: -135, y: 70},
      {k: 'tri', x: -45, y: 70},
      {k: 'circle', x: 45, y: 70},
      {k: 'menu', x: 135, y: 70},
    ],
  ];
  const links: [number, number, number, number][] = [
    [0, 0, 2, 2],
    [0, 1, 1, 0],
    [1, 0, 2, 1],
    [1, 1, 2, 3],
  ];
  // timeline
  const pillIn = (i: number) => outBack(lin(frame, 2 + i * 3, 12 + i * 3), 1.4);
  const flyT = (i: number) => outBack(lin(frame, 16 + i * 4, 25 + i * 4), 1.2);
  const linkT = (j: number) => inOutCubic(lin(frame, 44 + j * 12, 50 + j * 12));
  const collapse = inOutCubic(lin(frame, 120, 128));
  const shrink = inOutCubic(lin(frame, 128, 140));
  const lit = prog(frame, 140, 148, ease.out);

  const S = u * k;
  const cards = targets.map((t, i) => {
    const f = flyT(i);
    const P = pills[i];
    const tx = cx + t.x * u;
    const ty = cy + t.y * u;
    const base = {x: cx + P.x * u, y: cy + P.y * u};
    let x = lerp(base.x, tx, f);
    let y = lerp(base.y, ty, f);
    let r = lerp(P.r, t.r, f);
    let sc = lerp(0.12, 1, clamp(f));
    let op = clamp(f * 3);
    if (i < 2) {
      const C = targets[2];
      x = lerp(x, cx + C.x * u, collapse);
      y = lerp(y, cy + C.y * u, collapse);
      r = lerp(r, C.r, collapse);
      op *= 1 - collapse;
    } else {
      x = lerp(x, cx, shrink);
      y = lerp(y, cy, shrink);
      r = lerp(r, 0, shrink);
    }
    return {x, y, r, sc, op};
  });
  const world = (ci: number, ic: Icon) => {
    const c = cards[ci];
    const a = (c.r * Math.PI) / 180;
    const lx = ic.x * S * c.sc;
    const ly = ic.y * S * c.sc;
    return [c.x + lx * Math.cos(a) - ly * Math.sin(a), c.y + lx * Math.sin(a) + ly * Math.cos(a)] as [number, number];
  };
  // dot hops along links
  const hop = lin(frame, 46, 46 + links.length * 12);
  const hj = Math.min(links.length - 1, Math.floor(hop * links.length));
  const hl = outBack(clamp(hop * links.length - hj), 0.6);
  const L = links[hj];
  const pa = world(L[0], icons[L[0]][L[1]]);
  const pb = world(L[2], icons[L[2]][L[3]]);
  const dot = [lerp(pa[0], pb[0], hl), lerp(pa[1], pb[1], hl)];
  const label1 = p.labels[0] ?? 'CONNECT';
  const label2 = p.labels[1] ?? 'REASON';
  const typed1 = label1.slice(0, Math.max(0, Math.floor((frame - 40) / 1.5)));
  const typed2 = label2.slice(0, Math.max(0, Math.floor((frame - 146) / 1.5)));
  const c3 = cards[2];
  const barH = lerp(CH, 90 * S, shrink);
  const barW = lerp(CW, 420 * S, shrink);
  const contentFade = 1 - shrink;
  const octR = Math.min(w, h) * 0.47;

  const cardBody = (i: number) => {
    const isLast = i === 2;
    const cw = isLast ? barW : CW;
    const chh = isLast ? barH : CH;
    return (
      <g>
        <rect x={-cw / 2} y={-chh / 2} width={cw} height={chh} rx={6 * S} fill="rgba(12,18,38,0.78)" stroke={rgba('#ffffff', 0.8)} strokeWidth={1.5 * u} />
        <rect x={-cw / 2 - 2 * S} y={-chh / 2 + 10 * S} width={4 * S} height={chh - 20 * S} fill={accent} />
        <rect x={cw / 2 - 2 * S} y={-chh / 2 + 10 * S} width={4 * S} height={chh - 20 * S} fill={accent} />
        <g opacity={isLast ? contentFade : 1}>
          {i === 0 && (
            <g stroke={line} fill="none" strokeWidth={1.2 * u}>
              {Array.from({length: 7}, (_, k) => (
                <line key={k} x1={-200 * S} x2={200 * S} y1={(-110 + k * 36) * S} y2={(-110 + k * 36) * S} opacity={0.18} />
              ))}
              {Array.from({length: 11}, (_, k) => (
                <line key={k} y1={-120 * S} y2={120 * S} x1={(-200 + k * 40) * S} x2={(-200 + k * 40) * S} opacity={0.18} />
              ))}
              <path d={`M${-200 * S} ${-20 * S} C${-120 * S} ${-90 * S} ${-60 * S} ${40 * S} ${20 * S} ${-10 * S} S${140 * S} ${-60 * S} ${200 * S} ${10 * S}`} strokeWidth={2 * u} opacity={0.8} />
              <path d={`M${-180 * S} ${100 * S} L${-60 * S} ${20 * S} L${70 * S} ${-70 * S}`} strokeDasharray={`${6 * S} ${5 * S}`} opacity={0.6} />
            </g>
          )}
          {i === 1 && (
            <g fontFamily={fonts.mono} fontSize={17 * S} fill={line}>
              {['2.718', '377', '3.424', '144', '610', '3.162', '55', '89', '4.669', '1.414', '21', '8.693'].map((v, k) => (
                <text key={k} x={(-160 + (k % 4) * 95) * S} y={(-95 + Math.floor(k / 4) * 38) * S} opacity={0.75}>
                  {v}
                </text>
              ))}
              <rect x={-190 * S} y={-118 * S} width={380 * S} height={1 * u} fill={line} opacity={0.3} />
            </g>
          )}
          {i === 2 && (
            <g>
              <rect x={-185 * S} y={-110 * S} width={370 * S} height={22 * S} rx={3 * S} fill="none" stroke={line} strokeWidth={1.2 * u} opacity={0.5} />
              {Array.from({length: 4}, (_, k) => (
                <rect key={k} x={-185 * S} y={(-70 + k * 22) * S} width={(120 + ((k * 83) % 200)) * S} height={8 * S} rx={4 * S} fill={line} opacity={0.25} />
              ))}
            </g>
          )}
        </g>
        {icons[i].map((ic, k) => {
          const sc = ic.k === 'box' ? 40 * S : 34 * S;
          const yy = isLast ? lerp(ic.y * S, 0, shrink) : ic.y * S;
          const xx = isLast ? lerp(ic.x * S, ic.x * S * 0.85, shrink) : ic.x * S;
          const centre = isLast && k === 2;
          return <IconGlyph key={k} ic={{...ic, x: xx, y: yy}} s={sc} color={centre && lit > 0 ? mixLine(lit) : line} lit={centre ? lit : 0} />;
        })}
      </g>
    );
  };
  const mixLine = (t: number) => (t > 0.5 ? '#9FC0FF' : line);

  return (
    <AbsoluteFill style={{background: BP.bg}}>
      <ScanlineBg />
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <g fill="none" stroke={BP.line25} strokeWidth={1.5 * u}>
          <polygon points={Array.from({length: 8}, (_, i) => `${cx + Math.cos((i / 8) * Math.PI * 2 + Math.PI / 8) * octR},${cy + Math.sin((i / 8) * Math.PI * 2 + Math.PI / 8) * octR}`).join(' ')} />
          <polygon points={Array.from({length: 8}, (_, i) => `${cx + Math.cos((i / 8) * Math.PI * 2 + Math.PI / 8) * octR * 0.9},${cy + Math.sin((i / 8) * Math.PI * 2 + Math.PI / 8) * octR * 0.9}`).join(' ')} />
          <circle cx={cx} cy={cy} r={octR * 0.78} />
          <circle cx={cx} cy={cy} r={octR * 0.42} />
          <polygon points={[0, 1, 2].map((i) => `${cx + Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / 3) * octR * 0.78},${cy + Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / 3) * octR * 0.78}`).join(' ')} />
        </g>
        {/* capsules */}
        {pills.map((P, i) => {
          const a = pillIn(i) * (1 - clamp(flyT(i) * 1.5));
          return (
            <g key={i} transform={`translate(${cx + P.x * u} ${cy + P.y * u}) rotate(${P.r}) scale(${Math.max(0, a)})`}>
              <rect x={-14 * u} y={-42 * u} width={28 * u} height={84 * u} rx={14 * u} fill="rgba(71,119,210,0.15)" stroke={accent} strokeWidth={2.5 * u} />
              <line x1={0} x2={0} y1={-26 * u} y2={26 * u} stroke={accent} strokeWidth={2 * u} opacity={0.7} />
            </g>
          );
        })}
        {cards.map((c, i) =>
          c.op <= 0.001 ? null : (
            <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.r}) scale(${c.sc})`} opacity={c.op}>
              {cardBody(i)}
            </g>
          ),
        )}
        {/* links */}
        {links.map((l, j) => {
          const t = linkT(j) * (1 - collapse);
          if (t <= 0) return null;
          const a = world(l[0], icons[l[0]][l[1]]);
          const b = world(l[2], icons[l[2]][l[3]]);
          return <line key={j} x1={a[0]} y1={a[1]} x2={lerp(a[0], b[0], t)} y2={lerp(a[1], b[1], t)} stroke="#7FA8F0" strokeWidth={2.4 * u} opacity={0.95} style={{filter: `drop-shadow(0 0 ${4 * u}px #3477FC)`}} />;
        })}
        {frame >= 46 && frame < 122 && <GlowDot x={dot[0]} y={dot[1]} r={6 * u} id="cf-dot" boost={1.2} />}
        {lit > 0 && <GlowDot x={c3.x + 45 * S * 0.85} y={c3.y} r={6 * u * lit} id="cf-dot2" boost={0.8 + 0.4 * Math.sin(frame * 0.25)} />}
        <text x={portrait ? 70 * u : 110 * u} y={portrait ? 230 * u : 200 * u} fontFamily={fonts.mono} fontWeight={700} fontSize={64 * u} fill="#E9ECF2" letterSpacing={4 * u}>
          {typed1}
        </text>
        <text x={portrait ? w - 70 * u : w - 110 * u} y={portrait ? h - 200 * u : h - 160 * u} textAnchor="end" fontFamily={fonts.mono} fontWeight={700} fontSize={64 * u} fill="#E9ECF2" letterSpacing={4 * u}>
          {typed2}
        </text>
      </svg>
    </AbsoluteFill>
  );
};

const CardFan: React.FC<Props> = (p) => (p.mode === 'connect' ? <ConnectMode {...p} /> : <HandMode {...p} />);

export const cardFan = defineMotion<Props>({
  id: 'card-fan',
  title: 'Card fan: deal & play / connect',
  category: 'ui',
  description: "Cards deal from a pile into a fanned hand, one is hovered, played to centre and hits an enemy (white flash, slash, damage pop, HP drain); 'connect' mode links three glass cards' icons and merges them.",
  source: ['video21 7:20-15:10 card-hand-deal-and-play, hit-flash-damage-pop', 'video19 9:00-10:30 card-fan-connect'],
  useFor: 'Game / deck-builder reels, feature cards, "these pieces connect" data stories, choosing an option.',
  durationInFrames: 210,
  defaultProps: {
    mode: 'hand',
    cards: [
      {title: 'Ember Strike', cost: 1, icon: 'flame', text: 'Deal 10 damage.', color: '#d8673a'},
      {title: 'Frost Ward', cost: 1, icon: 'shield', text: 'Gain 8 Block.', color: '#4f7fd6'},
      {title: 'Spark Lance', cost: 2, icon: 'bolt', text: 'Deal 25 damage. Apply 3 Vulnerable.', color: '#c9a23a'},
      {title: 'Second Wind', cost: 1, icon: 'leaf', text: 'Draw 2 cards.', color: '#4fa86a'},
      {title: 'Iron Edge', cost: 2, icon: 'sword', text: 'Deal 13 damage.', color: '#8a6fd0'},
    ],
    playIndex: 2,
    damage: 25,
    status: 'Vulnerable +3',
    energy: 3,
    enemyHp: [38, 62],
    fanAngle: 6,
    dealStagger: 0.08,
    background: '#0b0815',
    labels: ['CONNECT', 'REASON'],
    accent: '#4777D2',
  },
  propDocs: {
    mode: "'hand' (deal, hover, play, hit) or 'connect' (three glass cards linked then merged)",
    cards: 'hand cards {title, cost, icon, text, color}; icon = alarm|train|toast|flask|button|moon|sun|coffee|bolt|heart|star|gear|chat|leaf|check|flame|shield|sword',
    playIndex: 'which card is played',
    damage: 'damage number shown on the hit',
    status: 'status text that rises after the damage',
    energy: 'energy orb value before playing (drops by the card cost)',
    enemyHp: '[current, max] enemy HP',
    fanAngle: 'outer card rotation in degrees',
    dealStagger: 'seconds between dealt cards',
    labels: "connect mode: [first label, final label]",
    accent: 'connect mode rail / capsule colour',
  },
  component: CardFan,
  tags: ['cards', 'game', 'ui', 'deal', 'hit', 'connect'],
});
