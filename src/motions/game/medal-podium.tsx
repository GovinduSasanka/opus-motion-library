import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Crest, backOut, bgCss, bodyFont, clampN, easeOut3, fitFont, headFont, mixHex, onColor, sseg, withAlpha, isDark} from '../../core/r3-sports-kit';
import {Svg, Vignette, useStage} from '../../core/stage';
import {rng} from '../../core/random';
import {defineMotion} from '../../core/types';

/**
 * Medal ceremony: a 2-1-3 podium whose blocks rise one after another (bronze, silver, gold), then each athlete or team lands on
 * top with a photo / initials badge, name, a flag-style colour chip and a result line; a spotlight, a sheen across the gold block
 * and a burst of confetti finish the beat. Colour chips stand in for flags, so nothing real is shown unless you pass your own picture.
 */
type Winner = {name: string; detail?: string; colors?: string[]; src?: string};
type Props = {
  title: string;
  subtitle: string;
  winners: Winner[];
  medalLabels: string[];
  gold: string;
  silver: string;
  bronze: string;
  confetti: boolean;
  background: string;
  ink: string;
  accent: string;
  fontFamily: string;
};

const DEFAULT_WINNERS: Winner[] = [
  {name: 'Kestrel Moon', detail: '1:46.20', colors: ['#7A4DFF', '#FFFFFF', '#18B37E']},
  {name: 'Alder Reyes', detail: '1:46.85', colors: ['#19B6D6', '#F5A524']},
  {name: 'Marlow Chen', detail: '1:47.31', colors: ['#F5A524', '#1E2A44', '#F5A524']},
];

const Flag: React.FC<{colors: string[]; w: number; h: number}> = ({colors, w, h}) => {
  const cs = colors.length ? colors : ['#8892A6'];
  return (
    <div style={{width: w, height: h, borderRadius: h * 0.16, overflow: 'hidden', display: 'flex', boxShadow: `0 0 0 ${Math.max(1.5, h * 0.05)}px rgba(255,255,255,0.7), 0 4px 10px rgba(0,0,0,0.35)`, flex: 'none'}}>
      {cs.map((c, i) => (
        <div key={i} style={{flex: 1, background: c}} />
      ))}
    </div>
  );
};

const MedalPodium: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const head = headFont(P.fontFamily);
  const body = bodyFont(P.fontFamily);
  const winners = (Array.isArray(P.winners) && P.winners.length ? P.winners : DEFAULT_WINNERS).slice(0, 3);
  const medal = [P.gold, P.silver, P.bronze];
  const labels = Array.isArray(P.medalLabels) && P.medalLabels.length ? P.medalLabels : ['Gold', 'Silver', 'Bronze'];

  // geometry (display order 2nd, 1st, 3rd)
  const PW = portrait ? w * 0.94 : Math.min(w * 0.86, 1440 * u);
  const gap = 16 * u;
  const bw = (PW - gap * 2) / 3;
  const x0 = (w - PW) / 2;
  const yb = portrait ? h * 0.84 : h - 96 * u;
  const H1 = clampN(h * (portrait ? 0.38 : 0.3), 200 * u, (portrait ? 760 : 560) * u);
  const heights = [H1, H1 * 0.74, H1 * 0.54];
  const slot = [1, 0, 2]; // column -> rank index
  const av = clampN(bw * 0.58, 90 * u, 200 * u);

  const titleP = easeOut3(sseg(frame, 0, 24));
  const tFs = fitFont((P.title || '').toUpperCase(), (portrait ? 92 : 80) * u, w * 0.9);
  const riseStart = [40, 24, 8]; // rank index -> start frame (gold rises last)
  riseStart[0] = 44;
  riseStart[1] = 26;
  riseStart[2] = 8;
  const goldTop = yb - heights[0];

  // spotlight on the winner
  const spot = easeOut3(sseg(frame, 70, 100));
  const gx = x0 + bw + gap + bw / 2;

  // confetti
  const burst = 92;
  const particles = React.useMemo(() => {
    const r = rng('medal-podium-confetti');
    const pal = [P.gold, P.accent, '#FFFFFF', ...winners.flatMap((x) => x.colors || [])].filter(Boolean);
    return Array.from({length: 70}, (_, i) => ({
      vx: (r() - 0.5) * 24,
      vy: -14 - r() * 18,
      sz: 8 + r() * 12,
      rot: r() * 360,
      vr: (r() - 0.5) * 24,
      col: pal[i % pal.length],
      delay: Math.floor(r() * 8),
      round: r() > 0.7,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [P.gold, P.accent, JSON.stringify(winners.map((x) => x.colors))]);

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      {bgCss(P.background) && (
        <>
          <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 55% at 50% 80%, ${withAlpha(P.gold, 0.12)}, transparent 70%)`}} />
          {isDark(P.background) && <Vignette strength={0.55} />}
        </>
      )}
      {/* spotlight cone */}
      <Svg>
        <defs>
          <linearGradient id="mp-beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={P.gold} stopOpacity={0.3 * spot} />
            <stop offset="1" stopColor={P.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points={`${gx - 36 * u},0 ${gx + 36 * u},0 ${gx + bw * 0.95},${yb} ${gx - bw * 0.95},${yb}`} fill="url(#mp-beam)" />
      </Svg>

      {/* title */}
      <div style={{position: 'absolute', left: 0, right: 0, top: (portrait ? 150 : 56) * u, textAlign: 'center', opacity: titleP, transform: `translateY(${(1 - titleP) * -30 * u}px)`}}>
        <div style={{fontFamily: body, fontWeight: 700, fontSize: 26 * u, letterSpacing: 10 * u, color: P.accent, textTransform: 'uppercase'}}>{P.subtitle}</div>
        <div style={{fontFamily: head, fontSize: tFs, color: P.ink, lineHeight: 1.05, marginTop: 8 * u, textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{P.title}</div>
      </div>

      {/* podium blocks + athletes */}
      {slot.map((rk, col) => {
        const x = x0 + col * (bw + gap);
        const rise = backOut(sseg(frame, riseStart[rk], riseStart[rk] + 30), 1.2);
        const Hh = heights[rk] * rise;
        const c = medal[rk];
        const wn = winners[rk];
        const land = riseStart[rk] + 22;
        const drop = backOut(sseg(frame, land, land + 22), 1.9);
        const topY = yb - Hh;
        const nameFs = wn ? fitFont((wn.name || '').toUpperCase(), 40 * u, bw * 0.96, 'sans', 0.04) : 0;
        const sheen = rk === 0 ? sseg(frame, 96, 126) : 0;
        const label = labels[rk] || '';
        return (
          <React.Fragment key={rk}>
            {wn && (
              <div style={{position: 'absolute', left: x, width: bw, bottom: h - topY + 18 * u, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: sseg(frame, land, land + 10), transform: `translateY(${(1 - drop) * -140 * u}px)`}}>
                <div style={{transform: `scale(${rk === 0 ? 1.12 : 1})`, transformOrigin: 'bottom center', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <div style={{position: 'relative'}}>
                    <Crest size={av} label={wn.name.slice(0, 2)} color={(wn.colors && wn.colors[0]) || c} src={wn.src} shape="circle" ring={c} font={head} />
                  </div>
                  <div style={{fontFamily: body, fontWeight: 800, fontSize: nameFs, letterSpacing: nameFs * 0.04, color: P.ink, marginTop: 12 * u, whiteSpace: 'nowrap', textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>{(wn.name || '').toUpperCase()}</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 12 * u, marginTop: 8 * u}}>
                    <Flag colors={wn.colors || []} w={50 * u} h={34 * u} />
                    <div style={{fontFamily: body, fontWeight: 700, fontSize: 32 * u, color: rk === 0 ? c : withAlpha(P.ink, 0.88), fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>{wn.detail}</div>
                  </div>
                </div>
              </div>
            )}
            <div style={{position: 'absolute', left: x, top: topY, width: bw, height: Hh, overflow: 'hidden', borderRadius: `${14 * u}px ${14 * u}px 0 0`, background: `linear-gradient(180deg, ${mixHex(c, '#ffffff', 0.12)}, ${mixHex(c, '#000000', 0.5)})`, boxShadow: `0 ${10 * u}px ${30 * u}px rgba(0,0,0,0.45)`}}>
              <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 8 * u, background: mixHex(c, '#ffffff', 0.45)}} />
              <div style={{position: 'absolute', left: '50%', top: 22 * u, transform: 'translateX(-50%)', textAlign: 'center', color: onColor(c, '#1A1508', '#FFFFFF'), whiteSpace: 'nowrap'}}>
                <div style={{fontFamily: head, fontSize: Math.min(heights[rk] * 0.5, 170 * u), lineHeight: 1}}>{rk + 1}</div>
                <div style={{fontFamily: body, fontWeight: 700, fontSize: 24 * u, letterSpacing: 8 * u, textTransform: 'uppercase', opacity: 0.85, marginTop: 2 * u}}>{label}</div>
              </div>
              {rk === 0 && <div style={{position: 'absolute', top: 0, bottom: 0, width: '30%', left: `${-40 + sheen * 190}%`, background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.45), transparent)', opacity: sheen > 0 && sheen < 1 ? 1 : 0}} />}
            </div>
          </React.Fragment>
        );
      })}
      <div style={{position: 'absolute', left: x0 - 20 * u, width: PW + 40 * u, top: yb, height: 6 * u, background: withAlpha(P.ink, 0.25)}} />

      {/* confetti */}
      {P.confetti && frame >= burst && (
        <Svg>
          {particles.map((p, i) => {
            const t = frame - burst - p.delay;
            if (t < 0) return null;
            const g = 0.7;
            const px = gx + p.vx * t * u * 0.9;
            const py = goldTop - 60 * u + (p.vy * t + 0.5 * g * t * t) * u;
            const op = clampN(1 - (t - 60) / 40, 0, 1);
            const flip = Math.abs(Math.cos((p.rot + p.vr * t) * 0.05));
            return p.round ? (
              <circle key={i} cx={px} cy={py} r={p.sz * 0.5 * u} fill={p.col} opacity={op} />
            ) : (
              <rect key={i} x={-p.sz * 0.5 * u} y={-p.sz * 0.3 * u * flip} width={p.sz * u} height={p.sz * 0.6 * u * flip} fill={p.col} opacity={op} transform={`translate(${px} ${py}) rotate(${p.rot + p.vr * t})`} />
            );
          })}
        </Svg>
      )}
    </AbsoluteFill>
  );
};

export const medalPodium = defineMotion<Props>({
  id: 'medal-podium',
  title: 'Medal podium',
  category: 'game',
  description: 'A 2-1-3 podium whose blocks rise in turn (bronze, silver, gold); each winner drops on top with a photo or initials badge, name, a flag-style colour chip and a result line, then a spotlight, a sheen on the gold block and a confetti burst.',
  source: ['original'],
  useFor: 'Results and winners reveals: Olympic-style medal ceremonies, tournament top three, race and contest podiums, quiz or sales leaderboards, "top 3 of the year" slides. Give the winners as {name, detail, colors[], src}, in order 1st, 2nd, 3rd.',
  durationInFrames: 240,
  defaultProps: {
    title: 'Final results',
    subtitle: "Men's 200m freestyle",
    winners: DEFAULT_WINNERS,
    medalLabels: ['Gold', 'Silver', 'Bronze'],
    gold: '#F5C542',
    silver: '#C3CAD6',
    bronze: '#CF8A4A',
    confetti: true,
    background: '#0A1022',
    ink: '#FFFFFF',
    accent: '#FFC933',
    fontFamily: 'auto',
  },
  propDocs: {
    title: 'heading (e.g. event name)',
    subtitle: 'small line above the heading (e.g. category)',
    winners: 'up to 3 entries in order 1st, 2nd, 3rd: {name, detail (time / score), colors[] (flag-style colour chip: 1-4 stripes), src (optional photo, public/ path or URL)}',
    medalLabels: 'words on the blocks, e.g. ["Gold","Silver","Bronze"] or ["1st","2nd","3rd"]',
    gold: 'first-place colour',
    silver: 'second-place colour',
    bronze: 'third-place colour',
    confetti: 'confetti burst when the winner lands',
    background: 'frame colour, or "transparent" to overlay footage',
    ink: 'text colour',
    accent: 'subtitle colour',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: MedalPodium,
  tags: ['podium', 'medal', 'winners', 'top 3', 'ceremony', 'olympics', 'results', 'gold', 'silver', 'bronze', 'ranking', 'leaderboard', 'tournament', 'sports', 'awards', 'confetti'],
});
