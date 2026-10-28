import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {PaintedField, easeOutCubic, h01, isTransparentBg, lin, x58Fonts} from '../../core/r2-x58-kit';

/**
 * x6 event-feed: a top-right stack of one-line event chips — "[NOVA] archer destroyed by [VEGA]" — each actor name
 * in its coloured chip, the verb in white mono. The newest line pushes in at the top with a 1-frame dim flash then
 * a 0.15 s fade; older lines spring down 0.2 s easeOutCubic and fade out after ttl. Max 6 lines. Overlay-capable.
 */
type Ev = {t: number; a: string; verb: string; b: string};
type Props = {
  background: string;
  events: Ev[];
  colors: Record<string, string>;
  chipText: Record<string, string>;
  maxLines: number;
  ttlFrames: number;
  align: 'right' | 'left';
  every: number;
  demoScene: boolean;
  seed: number;
};

const UNITS = ['archer', 'fighter', 'cavalry', 'paladin', 'scout'];
const VERBS = ['destroyed by', 'routed by', 'captured by', 'flanked by'];

const EventFeed: React.FC<Props> = ({background, events, colors, chipText, maxLines, ttlFrames, align, every, demoScene, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const names = Object.keys(colors);
  const list: Ev[] =
    events.length > 0
      ? events
      : Array.from({length: 40}, (_, i) => ({
          t: 8 + i * every,
          a: names[Math.floor(h01(i, 1, seed) * names.length)],
          verb: `${UNITS[Math.floor(h01(i, 2, seed) * UNITS.length)]} ${VERBS[Math.floor(h01(i, 3, seed) * VERBS.length)]}`,
          b: names[Math.floor(h01(i, 4, seed) * names.length)],
        }));
  const live = list.filter((e) => frame >= e.t && frame < e.t + ttlFrames).slice(-maxLines);
  const fs = 13 * u * (portrait ? 1.35 : 1);
  const lineH = fs * 2.0;
  const m = (portrait ? 0.05 : 0.025) * w;
  const chipW = (s: string) => s.length * fs * 0.62 + fs * 1.1;
  return (
    <AbsoluteFill style={{background: isTransparentBg(background) ? 'transparent' : background, overflow: 'hidden'}}>
      {demoScene && isTransparentBg(background) === false ? null : null}
      {demoScene ? (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, opacity: 0.9}}>
          <PaintedField id={`ef-${seed}`} w={w} h={h} u={u} seed={seed} frame={frame} />
        </svg>
      ) : null}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        {live.map((e, idx) => {
          // index from the top: newest (latest t) at 0
          const i = live.length - 1 - idx;
          const born = frame - e.t;
          const inK = easeOutCubic(lin(born, 0, 6));
          const flash = born < 1 ? 0.4 : 1;
          const out = 1 - lin(born, ttlFrames - 10, ttlFrames);
          // springs down as newer lines arrive: approximate with eased y per index
          const y = (portrait ? h * 0.06 : h * 0.045) + i * lineH + (1 - inK) * -lineH * 0.6;
          const aW = chipW(e.a);
          const bW = chipW(e.b);
          const verbW = e.verb.length * fs * 0.6 + fs;
          const total = aW + verbW + bW + fs * 1.2;
          const x = align === 'right' ? w - m - total : m;
          const chip = (name: string, cx: number) => (
            <g>
              <rect x={cx} y={y} width={chipW(name)} height={fs * 1.5} fill={colors[name] ?? '#888'} />
              <text x={cx + chipW(name) / 2} y={y + fs * 1.08} textAnchor="middle" fontFamily={x58Fonts.mono} fontSize={fs * 0.92} fontWeight={600} fill={chipText[name] ?? '#10131A'}>
                {name.toUpperCase()}
              </text>
            </g>
          );
          return (
            <g key={`${e.t}-${idx}`} opacity={inK * out * flash}>
              {chip(e.a, x)}
              <text x={x + aW + fs * 0.6} y={y + fs * 1.08} fontFamily={x58Fonts.mono} fontSize={fs * 0.92} fill="#fff">
                {e.verb}
              </text>
              {chip(e.b, x + aW + verbW + fs * 1.2)}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const eventFeed = defineMotion<Props>({
  id: 'event-feed',
  title: 'Event feed',
  category: 'hud',
  description:
    'A kill-feed style stack of one-line event chips in a corner: each actor name sits in its coloured chip with the verb in white mono; new lines flash in at the top, older ones slide down and fade out after a few seconds.',
  source: ['video x6 33-47 s (kill feed, top right)'],
  useFor: 'Live-event tickers (deploys, sales, alerts, game kills) over dashboards, gameplay or product demos; overlay-capable with background "transparent".',
  durationInFrames: 180,
  defaultProps: {
    background: 'transparent',
    events: [],
    colors: {Nova: '#E58682', Atlas: '#A9D9D0', Vega: '#CBB8F5', Onyx: '#141227'},
    chipText: {Onyx: '#FFFFFF'},
    maxLines: 6,
    ttlFrames: 90,
    align: 'right',
    every: 14,
    demoScene: true,
    seed: 9,
  },
  propDocs: {
    background: "backdrop colour; 'transparent' (default) overlays the host content",
    events: 'explicit events [{t: frame, a, verb, b}] (empty = a generated demo feed)',
    colors: 'chip colour per actor name',
    chipText: 'chip text colour per actor (default dark)',
    maxLines: 'maximum visible lines',
    ttlFrames: 'frames a line lives before fading',
    align: "'right' | 'left' corner",
    every: 'frames between generated demo events',
    demoScene: 'paint the painterly battlefield behind (preview only; turn off as an overlay)',
    seed: 'demo feed seed',
  },
  component: EventFeed,
  tags: ['feed', 'ticker', 'kill feed', 'events', 'chips', 'hud', 'overlay', 'live', 'log', 'game', 'notifications', 'stream'],
});
