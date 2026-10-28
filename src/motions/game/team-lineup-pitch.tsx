import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FieldArt, SAMPLE_NAMES, SPORTS, asSport, backOut, bgCss, bodyFont, clampN, easeIO, easeOut3, fieldLayout, fitFont, headFont, mixHex, num, onColor, sseg, withAlpha, isDark} from '../../core/r3-sports-kit';
import {Svg, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Starting line-up on a pitch or court: the markings draw on, then every player drops onto his coordinates (keeper / back line first)
 * as a numbered disc with a name tag, thin lines join each line of the formation, and an optional player is spotlighted.
 * Landscape puts a title panel beside a horizontal pitch; portrait and square stack the header over a vertical (or horizontal) one.
 */
type Player = {name: string; number: number | string; x: number; y: number};
type Props = {
  sport: string;
  title: string;
  formation: string;
  subtitle: string;
  players: Player[];
  highlight: number | string;
  showNames: boolean;
  links: boolean;
  teamColor: string;
  numberColor: string;
  field: string;
  background: string;
  ink: string;
  accent: string;
  fontFamily: string;
};

/** built-in sample line-ups (x = 0 own goal .. 1 opposing goal, y = 0..1 across) */
const SAMPLE_FOOTBALL: Player[] = [
  {name: SAMPLE_NAMES[0], number: 1, x: 0.07, y: 0.5},
  {name: SAMPLE_NAMES[1], number: 2, x: 0.25, y: 0.14},
  {name: SAMPLE_NAMES[2], number: 5, x: 0.22, y: 0.38},
  {name: SAMPLE_NAMES[3], number: 4, x: 0.22, y: 0.62},
  {name: SAMPLE_NAMES[4], number: 3, x: 0.25, y: 0.86},
  {name: SAMPLE_NAMES[5], number: 6, x: 0.46, y: 0.3},
  {name: SAMPLE_NAMES[6], number: 8, x: 0.42, y: 0.5},
  {name: SAMPLE_NAMES[7], number: 10, x: 0.46, y: 0.7},
  {name: SAMPLE_NAMES[8], number: 7, x: 0.72, y: 0.16},
  {name: SAMPLE_NAMES[9], number: 9, x: 0.78, y: 0.5},
  {name: SAMPLE_NAMES[10], number: 11, x: 0.72, y: 0.84},
];
const SAMPLE_BASKETBALL: Player[] = [
  {name: SAMPLE_NAMES[0], number: 3, x: 0.3, y: 0.5},
  {name: SAMPLE_NAMES[1], number: 7, x: 0.5, y: 0.16},
  {name: SAMPLE_NAMES[2], number: 11, x: 0.5, y: 0.84},
  {name: SAMPLE_NAMES[3], number: 23, x: 0.72, y: 0.32},
  {name: SAMPLE_NAMES[4], number: 34, x: 0.74, y: 0.68},
];
const SAMPLE_PLAIN: Player[] = SAMPLE_FOOTBALL.slice(0, 9);

const TeamLineupPitch: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const head = headFont(P.fontFamily);
  const body = bodyFont(P.fontFamily);
  const sport = asSport(P.sport);
  const surface = !P.field || P.field === 'auto' ? SPORTS[sport].field : P.field;
  const list0 = Array.isArray(P.players) && P.players.length ? P.players : sport === 'basketball' ? SAMPLE_BASKETBALL : sport === 'plain' ? SAMPLE_PLAIN : SAMPLE_FOOTBALL;
  const players = list0.slice(0, 15).map((p, i) => ({
    name: String(p.name ?? ''),
    number: p.number ?? '',
    x: clampN(num(p.x, 0.5), 0.02, 0.98),
    y: clampN(num(p.y, 0.5), 0.04, 0.96),
    i,
  }));
  const order = [...players].sort((a, b) => a.x - b.x || a.y - b.y);
  const rankOf = new Map(order.map((p, k) => [p.i, k]));

  // ---- layout: side panel on wide frames, header on top otherwise
  const wide = w / h > 1.45;
  const pad = 56 * u;
  const headH = wide ? 0 : (portrait ? 330 : 230) * u;
  const panelW = wide ? Math.min(w * 0.3, 560 * u) : 0;
  const box = wide ? {x: pad + panelW + 24 * u, y: pad, w: w - pad * 2 - panelW - 24 * u, h: h - pad * 2} : {x: pad * 0.7, y: pad * 0.6 + headH, w: w - pad * 1.4, h: h - pad * 1.3 - headH};
  const vertical = !wide && portrait;
  const L0 = fieldLayout(sport, box, vertical);
  // wide frames: centre panel + field as one group
  const groupW = panelW + 40 * u + L0.w;
  const panelX = wide ? Math.max(pad, (w - groupW) / 2) : pad;
  const L = wide ? fieldLayout(sport, {x: panelX + panelW + 40 * u, y: box.y, w: L0.w, h: box.h}, vertical) : L0;
  const drawP = easeIO(sseg(frame, 4, 40));
  const fieldOpacity = easeOut3(sseg(frame, 0, 16));

  const mR = Math.min(L.w, L.h) * (vertical ? 0.05 : sport === 'basketball' ? 0.066 : 0.056);
  const r = clampN(mR, 18 * u, 56 * u);
  const hl = String(P.highlight ?? '').trim();

  // links: join players that share a line of the formation (similar x), ordered across the pitch
  const lines: {x: number; y: number}[][] = [];
  if (P.links) {
    const sorted = [...players].sort((a, b) => a.x - b.x);
    let cur: typeof players = [];
    for (const p of sorted) {
      if (cur.length && Math.abs(p.x - cur[0].x) > 0.07) {
        if (cur.length > 1) lines.push(cur.sort((a, b) => a.y - b.y).map((q) => L.pt(q.x, q.y)));
        cur = [];
      }
      cur.push(p);
    }
    if (cur.length > 1) lines.push(cur.sort((a, b) => a.y - b.y).map((q) => L.pt(q.x, q.y)));
  }
  const linkP = easeOut3(sseg(frame, 88, 124));

  const titleP = easeOut3(sseg(frame, 6, 34));
  const fmP = backOut(sseg(frame, 14, 40));
  const tFs = fitFont((P.title || '').toUpperCase(), (wide ? 74 : portrait ? 84 : 62) * u, (wide ? panelW : w - pad * 2) * 0.94);
  const fmFs = fitFont(P.formation || ' ', (wide ? 150 : portrait ? 130 : 96) * u, (wide ? panelW : w - pad * 2) * 0.96);

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      {bgCss(P.background) && (
        <>
          <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${withAlpha(P.teamColor, 0.16)}, transparent 75%)`}} />
          {isDark(P.background) && <Vignette strength={0.45} />}
        </>
      )}
      <div style={{position: 'absolute', inset: 0, opacity: fieldOpacity}}>
        <Svg>
          <g style={{filter: `drop-shadow(0 ${14 * u}px ${28 * u}px rgba(0,0,0,0.45))`}}>
            <FieldArt layout={L} surface={surface} line={withAlpha('#FFFFFF', 0.88)} draw={drawP} id="tlp" lineWidthPx={Math.max(2.4, 3 * u)} surfaceOpacity={0.96} />
          </g>
          {lines.map((ln, k) => (
            <polyline key={k} points={ln.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={withAlpha(P.numberColor, 0.4)} strokeWidth={Math.max(2, 3 * u)} strokeDasharray={`${10 * u} ${10 * u}`} strokeLinecap="round" pathLength={1} opacity={linkP} />
          ))}
        </Svg>
      </div>

      {/* header / side panel */}
      <div
        style={{
          position: 'absolute',
          left: panelX,
          top: wide ? h / 2 - 270 * u : pad * 0.9,
          width: wide ? panelW : w - pad * 2,
          textAlign: wide ? 'left' : 'center',
          opacity: titleP,
          transform: `translateY(${(1 - titleP) * -24 * u}px)`,
        }}
      >
        <div style={{fontFamily: body, fontWeight: 700, fontSize: 26 * u, letterSpacing: 8 * u, color: P.accent, textTransform: 'uppercase'}}>{P.subtitle}</div>
        <div style={{fontFamily: head, fontSize: tFs, lineHeight: 1.04, color: P.ink, marginTop: 10 * u, textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{P.title}</div>
        {P.formation && (
          <div style={{fontFamily: head, fontSize: fmFs, lineHeight: 1, marginTop: (wide ? 26 : 8) * u, color: P.teamColor, WebkitTextStroke: `${2 * u}px ${withAlpha(P.ink, 0.55)}`, transform: `scale(${0.7 + 0.3 * fmP})`, transformOrigin: wide ? 'left center' : 'center', opacity: fmP}}>
            {P.formation}
          </div>
        )}
        <div style={{width: (wide ? 150 : 220) * u * titleP, height: 6 * u, background: P.accent, marginTop: 20 * u, marginLeft: wide ? 0 : 'auto', marginRight: wide ? 0 : 'auto'}} />
      </div>

      {/* players */}
      {players.map((p) => {
        const k = rankOf.get(p.i) ?? 0;
        const t0 = 34 + k * 5.5;
        const pop = backOut(sseg(frame, t0, t0 + 20), 2.1);
        const o = sseg(frame, t0, t0 + 8);
        const pos = L.pt(p.x, p.y);
        const drop = (1 - easeOut3(sseg(frame, t0, t0 + 18))) * -90 * u;
        const ns = String(p.number);
        const isHl = hl !== '' && (hl === ns || hl.toLowerCase() === p.name.toLowerCase());
        const pulse = isHl ? 0.5 + 0.5 * Math.sin((frame - 120) * 0.2) : 0;
        const spot = isHl ? easeOut3(sseg(frame, 118, 136)) : 0;
        const nameFs = fitFont(p.name.toUpperCase(), r * (vertical ? 0.6 : 0.72), r * (vertical ? 3.5 : 4.1), 'sans', 0.04);
        const ring = r * (1.55 + 0.25 * pulse);
        return (
          <div key={p.i} style={{position: 'absolute', left: pos.x, top: pos.y, width: 0, height: 0, opacity: o, transform: `translateY(${drop}px)`}}>
            {isHl && <div style={{position: 'absolute', left: -ring, top: -ring, width: ring * 2, height: ring * 2, borderRadius: '50%', border: `${3 * u}px solid ${P.accent}`, opacity: spot * (0.9 - 0.4 * pulse), transform: `scale(${0.6 + 0.4 * spot})`}} />}
            <div style={{position: 'absolute', left: -r * 0.9, top: r * 0.55, width: r * 1.8, height: r * 0.5, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', filter: `blur(${r * 0.12}px)`}} />
            <div
              style={{
                position: 'absolute',
                left: -r,
                top: -r,
                width: r * 2,
                height: r * 2,
                borderRadius: '50%',
                transform: `scale(${pop * (1 + (isHl ? 0.14 * spot : 0))})`,
                background: `radial-gradient(circle at 35% 30%, ${mixHex(P.teamColor, '#ffffff', 0.28)}, ${P.teamColor} 55%, ${mixHex(P.teamColor, '#000000', 0.35)})`,
                border: `${Math.max(2.5, r * 0.09)}px solid ${isHl ? P.accent : 'rgba(255,255,255,0.95)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                fontFamily: head,
                fontSize: r * (ns.length > 1 ? 0.95 : 1.15),
                lineHeight: 1,
                color: P.numberColor || onColor(P.teamColor),
              }}
            >
              <span style={{marginTop: r * 0.05}}>{ns}</span>
            </div>
            {P.showNames && p.name && (
              <div
                style={{
                  position: 'absolute',
                  left: -r * 2.2,
                  top: r * 1.12,
                  width: r * 4.4,
                  display: 'flex',
                  justifyContent: 'center',
                  opacity: sseg(frame, t0 + 6, t0 + 16),
                  transform: `translateY(${(1 - sseg(frame, t0 + 6, t0 + 16)) * -6 * u}px)`,
                }}
              >
                <div style={{fontFamily: body, fontWeight: 700, fontSize: nameFs, letterSpacing: nameFs * 0.04, color: '#FFFFFF', background: 'rgba(8,12,24,0.78)', padding: `${nameFs * 0.2}px ${nameFs * 0.6}px`, borderRadius: nameFs * 0.5, whiteSpace: 'nowrap', lineHeight: 1.1}}>{p.name.toUpperCase()}</div>
              </div>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const teamLineupPitch = defineMotion<Props>({
  id: 'team-lineup-pitch',
  title: 'Team line-up on pitch',
  category: 'game',
  description: 'A pitch or court draws on, then each player drops onto his position as a numbered disc with a name tag; dashed links join each line of the formation and one player can be spotlighted. Title and formation label sit beside (wide) or above (square / tall).',
  source: ['original'],
  useFor: 'Starting-XI graphics, team sheets, tactics explainers, five-a-side or basketball starting fives, fantasy picks and match-day previews. Give the players as {name, number, x, y} (x = 0 own goal to 1 opposing goal, y = 0 to 1 across), your team colour and a title.',
  durationInFrames: 210,
  defaultProps: {
    sport: 'football',
    title: 'Starting XI',
    formation: '4-3-3',
    subtitle: 'Match day',
    players: [],
    highlight: '',
    showNames: true,
    links: true,
    teamColor: '#2F6BFF',
    numberColor: '#FFFFFF',
    field: 'auto',
    background: '#0B1220',
    ink: '#FFFFFF',
    accent: '#FFC933',
    fontFamily: 'auto',
  },
  propDocs: {
    sport: 'football | basketball | plain (generic rectangular field)',
    title: 'team or heading (e.g. "Northgate FC")',
    formation: 'big formation label (e.g. "4-3-3", "2-1-2"); empty hides it',
    subtitle: 'small line above the title',
    players: 'array of {name, number, x, y}: x 0..1 from own goal to the opposing goal, y 0..1 across the pitch (up to 15). Empty = built-in sample line-up for the sport',
    highlight: 'player number or name to spotlight (pulsing ring); empty = none',
    showNames: 'show the name tag under each disc',
    links: 'dashed lines joining the players of each line of the formation',
    teamColor: 'player disc colour',
    numberColor: 'shirt-number colour',
    field: 'surface colour, or "auto" for the sport default (green pitch / wood court)',
    background: 'frame colour, or "transparent" to overlay footage',
    ink: 'title colour',
    accent: 'subtitle, rule and spotlight colour',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: TeamLineupPitch,
  tags: ['football', 'soccer', 'basketball', 'lineup', 'line-up', 'formation', 'starting xi', 'team sheet', 'pitch', 'court', 'tactics', 'sports', 'players', 'squad', 'match day', 'fantasy'],
});
