// Adapted from mg-styles-15/demos/19-paperclip/index.html (cam, camBlur) and cues.json `cam` (MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {View, bez, cl, mix, zoomInterp} from '../../core/r2-mg1b-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Key = {t: number; dur: number; x: number; y: number; w: number; move: 'drift' | 'fly' | 'pull'};
type Card = {title: string; body: string; color: string};
type Stat = {value: string; label: string};
type Props = {
  keys: Key[];
  frameStyle: 'phone' | 'none';
  background: string;
  accent: string;
  ink: string;
  heading: string[];
  badge: string;
  tagline?: string[];
  sectionLabel?: string;
  cards: Card[];
  stats: Stat[];
  cta: string;
  blur: boolean;
};

const W = 1200;
const H = 2600;

const World: React.FC<Props> = ({accent, ink, heading, badge, tagline = [], sectionLabel, cards, stats, cta}) => {
  const f = fonts.grotesk;
  const s = fonts.sans;
  return (
    <g>
      {/* hero */}
      <rect x={110} y={140} width={badge.length * 22 + 70} height={64} rx={32} fill={accent} opacity={0.14} />
      <text x={145} y={183} fontFamily={fonts.mono} fontWeight={700} fontSize={30} letterSpacing={3} fill={accent}>
        {badge}
      </text>
      {heading.map((l, i) => (
        <text key={i} x={100} y={350 + i * 140} fontFamily={f} fontWeight={700} fontSize={128} letterSpacing={-3} fill={ink}>
          {l}
        </text>
      ))}
      {tagline.map((l, i) => (
        <text key={i} x={104} y={350 + heading.length * 140 + 20 + i * 56} fontFamily={s} fontSize={40} fill={ink} opacity={0.55}>
          {l}
        </text>
      ))}
      <circle cx={1010} cy={640} r={90} fill={accent} opacity={0.9} />
      <circle cx={1010} cy={640} r={42} fill="#fff" opacity={0.9} />
      {/* cards */}
      <text x={100} y={930} fontFamily={fonts.mono} fontWeight={700} fontSize={30} letterSpacing={6} fill={accent}>
        {sectionLabel}
      </text>
      {cards.map((c, i) => (
        <g key={i} transform={`translate(100 ${980 + i * 250})`}>
          <rect width={1000} height={210} rx={36} fill="#fff" />
          <rect width={1000} height={210} rx={36} fill="none" stroke={ink} strokeOpacity={0.08} strokeWidth={3} />
          <circle cx={105} cy={105} r={54} fill={c.color} />
          <path d={i === 0 ? 'M82 105L100 124L132 86' : i === 1 ? 'M82 124V92L105 78L128 92V124Z' : 'M80 105H130M105 80V130'} stroke="#fff" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <text x={200} y={96} fontFamily={f} fontWeight={700} fontSize={54} fill={ink}>
            {c.title}
          </text>
          <text x={200} y={150} fontFamily={s} fontSize={34} fill={ink} opacity={0.55}>
            {c.body}
          </text>
        </g>
      ))}
      {/* stats */}
      <rect x={0} y={1790} width={W} height={560} fill={ink} />
      {stats.map((st, i) => (
        <g key={i} transform={`translate(${100 + i * 520} ${1990})`}>
          <text fontFamily={f} fontWeight={700} fontSize={210} letterSpacing={-6} fill={i === 0 ? '#fff' : accent}>
            {st.value}
          </text>
          <text y={90} fontFamily={fonts.mono} fontWeight={700} fontSize={32} letterSpacing={5} fill="#fff" opacity={0.6}>
            {st.label}
          </text>
        </g>
      ))}
      {/* cta */}
      <rect x={100} y={2400} width={1000} height={130} rx={65} fill={accent} />
      <text x={W / 2} y={2487} textAnchor="middle" fontFamily={f} fontWeight={700} fontSize={56} fill="#fff">
        {cta}
      </text>
    </g>
  );
};

const CanvasFlythrough: React.FC<Props> = (props) => {
  const {keys, frameStyle, background, blur} = props;
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const fitW = (H * 1.22) * (w / h);
  const aspect = Math.max(1, w / h);
  const vis = (k: Key): View => [k.x, k.y, k.w > 0 ? Math.min(k.w * aspect, Math.max(k.w, W * 1.15)) : Math.max(fitW, W * 1.5)];
  const viewAt = (fr: number): View => {
    let cur = vis(keys[0]);
    for (let i = 1; i < keys.length; i++) {
      const k = keys[i];
      const prev = vis(keys[i - 1]);
      const next = vis(k);
      const t0 = k.t - k.dur;
      if (fr < t0) return cur;
      if (fr >= k.t) {
        cur = next;
        continue;
      }
      const lin = cl((fr - t0) / Math.max(1, k.dur));
      if (k.move === 'drift') {
        const e = bez(0.37, 0, 0.63, 1)(lin);
        return [mix(prev[0], next[0], e), mix(prev[1], next[1], e), Math.exp(mix(Math.log(prev[2]), Math.log(next[2]), e))];
      }
      const e = k.move === 'pull' ? bez(0.5, 0, 0.08, 1)(lin) : bez(0.62, 0, 0.22, 1)(lin);
      return zoomInterp(prev, next, k.move === 'pull' ? 1.25 : 0.85)(e);
    }
    return cur;
  };
  const v = viewAt(frame);
  const idle = Math.sin(frame * 0.045) * 5;
  const scale = w / v[2];
  const camX = v[0] + idle;
  const camY0 = v[1] + Math.cos(frame * 0.037) * 4;
  // portrait: keep the view inside the canvas (no empty void below the last section)
  const visHh = h / scale;
  const yLo = visHh / 2 - 120;
  const yHi = H + 120 - visHh / 2;
  const camY = portrait && yLo <= yHi ? Math.min(yHi, Math.max(yLo, camY0)) : camY0;
  // camera blur from screen-space velocity
  const vp = viewAt(frame - 1);
  const dxs = (v[0] - vp[0]) * scale;
  const dys = (v[1] - vp[1]) * scale;
  const dz = Math.abs(Math.log(v[2] / vp[2])) * w * 0.5;
  const speed = Math.hypot(dxs, dys) + dz;
  const on = blur && speed > 1.2;
  const sx = on ? Math.min(6 * u, (Math.abs(dxs) + dz * 0.5) * 0.28) : 0;
  const sy = on ? Math.min(6 * u, (Math.abs(dys) + dz * 0.5) * 0.28) : 0;
  const phone = frameStyle === 'phone';
  const intro = cl(frame / 8);
  return (
    <AbsoluteFill style={{background: phone ? `radial-gradient(ellipse at 50% 40%, #2b2f44 0%, #12131c 100%)` : background, opacity: intro}}>
      <Svg>
        <defs>
          <clipPath id="cft-screen">
            <rect x={0} y={0} width={W} height={H} rx={78} />
          </clipPath>
          <filter id="cft-blur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={`${sx} ${sy}`} />
          </filter>
          <filter id="cft-shadow" x="-30%" y="-10%" width="160%" height="120%">
            <feGaussianBlur stdDeviation={60} />
          </filter>
        </defs>
        <g filter={on ? 'url(#cft-blur)' : undefined}>
          <g transform={`translate(${cx - camX * scale} ${cy - camY * scale}) scale(${scale})`}>
            {phone && <rect x={-40} y={40} width={W + 80} height={H + 80} rx={120} fill="#000" opacity={0.45} filter="url(#cft-shadow)" />}
            <g clipPath="url(#cft-screen)">
              <rect x={0} y={0} width={W} height={H} fill={background} />
              <World {...props} />
            </g>
            {phone && (
              <g>
                <path d={`M-62 -62H${W + 62}V${H + 62}H-62Z`} fill="none" />
                <path
                  fillRule="evenodd"
                  fill="#0b0c12"
                  d={`M${-62 + 130} -62H${W + 62 - 130}A130 130 0 0 1 ${W + 62} ${-62 + 130}V${H + 62 - 130}A130 130 0 0 1 ${W + 62 - 130} ${H + 62}H${-62 + 130}A130 130 0 0 1 -62 ${H + 62 - 130}V${-62 + 130}A130 130 0 0 1 ${-62 + 130} -62Z
                  M78 0H${W - 78}A78 78 0 0 1 ${W} 78V${H - 78}A78 78 0 0 1 ${W - 78} ${H}H78A78 78 0 0 1 0 ${H - 78}V78A78 78 0 0 1 78 0Z`}
                />
                <rect x={W / 2 - 120} y={26} width={240} height={62} rx={31} fill="#0b0c12" />
                <rect x={W + 62} y={520} width={10} height={220} rx={5} fill="#1a1c26" />
                <rect x={-72} y={440} width={10} height={140} rx={5} fill="#1a1c26" />
                <rect x={-72} y={640} width={10} height={140} rx={5} fill="#1a1c26" />
                <rect x={W / 2 - 170} y={H - 28} width={340} height={10} rx={5} fill="#fff" opacity={0.5} />
              </g>
            )}
          </g>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const canvasFlythrough = defineMotion<Props>({
  id: 'canvas-flythrough',
  title: 'Canvas flythrough',
  category: 'camera',
  description:
    'One tall layout holding every section; a virtual camera flies between stations with a van Wijk smooth zoom (zooming out slightly while travelling, settling on a long ease, speed-proportional camera blur) and at the end pulls all the way out to reveal the whole canvas was a phone screen.',
  source: ['mg-styles-15 demos/19-paperclip cam() / camBlur() + cues.json cam (MIT)'],
  useFor: 'Explainers, product tours and pitch one-shot infographics: lay out sections as one canvas, list the stations, and let the camera do the storytelling.',
  durationInFrames: 270,
  defaultProps: {
    keys: [
      {t: 0, dur: 0, x: 600, y: 360, w: 1050, move: 'drift'},
      {t: 56, dur: 26, x: 600, y: 1090, w: 1150, move: 'fly'},
      {t: 104, dur: 40, x: 600, y: 1470, w: 1150, move: 'drift'},
      {t: 150, dur: 30, x: 600, y: 2060, w: 1250, move: 'fly'},
      {t: 196, dur: 28, x: 600, y: 2465, w: 1150, move: 'fly'},
      {t: 262, dur: 56, x: 600, y: 1300, w: 0, move: 'pull'},
    ],
    frameStyle: 'phone',
    background: '#FAF7F2',
    accent: '#F2542D',
    ink: '#1B1B2F',
    heading: ['Work that', 'moves at', 'your speed.'],
    badge: 'NEW · VERSION 2',
    tagline: ['One canvas. Every section a station', 'the camera flies to.'],
    sectionLabel: 'WHAT YOU GET',
    cards: [
      {title: 'Plan', body: 'Everything in one clear view', color: '#F2542D'},
      {title: 'Build', body: 'Ship the first draft today', color: '#2E7BFF'},
      {title: 'Grow', body: 'Learn from every release', color: '#1FB58F'},
    ],
    stats: [
      {value: '98%', label: 'FASTER SETUP'},
      {value: '12k', label: 'TEAMS ONBOARD'},
    ],
    cta: 'Start free today',
    blur: true,
  },
  propDocs: {
    keys: "camera stations [{t: arrival frame, dur: travel frames before arrival, x,y: world centre (canvas is 1200x2600), w: visible world width in portrait (widened to at most 1.15x the canvas in landscape; 0 = fit whole canvas), move: 'drift'|'fly'|'pull'}]",
    frameStyle: "'phone' wraps the canvas in a device bezel for the final pull-out reveal, 'none' leaves it flat",
    background: 'canvas colour',
    accent: 'brand accent',
    ink: 'text colour',
    heading: 'hero headline lines (3)',
    badge: 'small pill above the headline',
    tagline: 'grey sub-lines under the headline (one entry per line)',
    sectionLabel: 'small caps label above the cards',
    cards: 'feature cards [{title, body, color}] (3)',
    stats: 'two big stats [{value, label}]',
    cta: 'button text at the bottom',
    blur: 'speed-proportional camera blur while flying',
  },
  component: CanvasFlythrough,
  tags: ['camera', 'flythrough', 'zoom', 'pan', 'canvas', 'infographic', 'product tour', 'pull out', 'phone', 'one-shot', 'explainer'],
});
