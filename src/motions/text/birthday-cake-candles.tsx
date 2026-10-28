import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {useSafeId} from '../../core/image-kit';
import {Confetti, EventStage, Glow, backOut, fitFont, mixHex, sparkPath, withAlpha} from '../../core/r3-events-kit';
import {defineMotion} from '../../core/types';

/**
 * A tiered birthday cake drops in, candles pop up and are lit one by one (warm glow grows), a wish line holds, then a puff of
 * breath blows them out in a wave (flames lean, smoke wisps curl up) and confetti bursts as the name is revealed.
 */
type Props = {
  title: string;
  name: string;
  wish: string;
  message: string;
  candles: number;
  hold: number;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  cake: string;
  flame: string;
  seed: number;
  startAt: number;
};

const BirthdayCakeCandles: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const uid = useSafeId('bcc');
  const f = Math.max(0, frame - p.startAt);
  const bg = p.background === 'transparent' ? '#2A1738' : p.background;
  const n = Math.max(1, Math.min(12, Math.round(p.candles)));

  const lightStart = 52;
  const lightGap = Math.max(3, Math.round(34 / n) + 2);
  const allLit = lightStart + n * lightGap + 8;
  const blowAt = allLit + Math.max(20, p.hold);
  const since = f - blowAt;

  const R = rng(p.seed * 71 + 5);
  const sprinkleSet = Array.from({length: 34}, () => ({u: R(), v: R(), a: R() * 180, c: R()}));
  const drips = (wd: number, seedK: number) => {
    const r = rng(p.seed * 13 + seedK);
    const k = Math.max(5, Math.round(wd / 56));
    return Array.from({length: k}, () => 20 + r() * 38);
  };

  return (
    <EventStage background={p.background}>
      {(L) => {
        const wide = L.kind === 'wide';
        const tall = L.kind === 'tall';
        const cs = tall ? 1.28 : L.kind === "square" ? 0.98 : 1.2;
        const cakeX = wide ? L.W * 0.3 : L.W / 2;
        const baseY = wide ? L.H * 0.86 : tall ? L.H * 0.86 : L.H * 0.92;
        const tx = wide ? L.W * 0.69 : L.W / 2;
        const maxW = wide ? 700 : L.W * 0.88;
        const ty = wide ? L.H * 0.4 : tall ? L.H * 0.27 : L.H * 0.2;

        // cake entrance
        const drop = prog(f, 0, 24, ease.out);
        const bounce = f < 24 ? 0 : Math.max(0, 1 - (f - 24) / 14) * Math.sin((f - 24) * 0.9);
        const cakeDy = -(1 - drop) * 560 * cs;
        const sqY = 1 - 0.07 * bounce;
        const sqX = 1 + 0.05 * bounce;

        // geometry (cake local, y up negative)
        const bw = 520;
        const bh = 150;
        const tw = 380;
        const th = 118;
        const topY = -(bh + th);
        const candleH = 112;

        const lit = (i: number) => lightStart + i * lightGap;
        const glowOn = n > 0 ? clamp((f - lightStart) / (allLit - lightStart)) : 0;
        const glowOff = 1 - prog(since, -6, 10, ease.in);
        const glowAmt = glowOn * glowOff;

        const frostC = p.accent;
        const frostD = mixHex(p.accent, '#000000', 0.18);
        const cakeD = mixHex(p.cake, '#000000', 0.2);
        const plateC = mixHex(p.ink, bg, 0.7);

        const tier = (wd: number, ht: number, yTop: number, key: number) => {
          const half = wd / 2;
          const d = drips(wd, key);
          const seg = wd / d.length;
          let path = `M${-half} ${yTop + 2}`;
          d.forEach((len, i) => {
            const x0 = -half + i * seg;
            path += `L${x0} ${yTop + 6}C${x0} ${yTop + 6 + len * 1.25} ${x0 + seg} ${yTop + 6 + len * 1.25} ${x0 + seg} ${yTop + 6}`;
          });
          path += `L${half} ${yTop + 2}Z`;
          return (
            <g>
              <path d={`M${-half} ${yTop}V${yTop + ht - 14}A${half} 26 0 0 0 ${half} ${yTop + ht - 14}V${yTop}Z`} fill={p.cake} />
              <path d={`M${half} ${yTop}V${yTop + ht - 14}A${half} 26 0 0 1 ${half - wd * 0.26} ${yTop + ht + 10}Q${half - wd * 0.1} ${yTop + ht} ${half} ${yTop + ht - 14}Z`} fill={cakeD} opacity={0.45} />
              <path d={path} fill={frostC} />
              <ellipse cx={0} cy={yTop} rx={half} ry={24} fill={mixHex(frostC, '#ffffff', 0.28)} />
              <ellipse cx={0} cy={yTop} rx={half - 10} ry={19} fill={frostC} />
              {/* piped dots along the base */}
              {Array.from({length: Math.round(wd / 38)}, (_, i) => {
                const a = Math.PI * (0.06 + (i / (Math.round(wd / 38) - 1)) * 0.88);
                return <circle key={i} cx={Math.cos(a) * -(half - 14)} cy={yTop + ht - 14 + Math.sin(a) * 22 - 4} r={8} fill={mixHex(frostC, '#ffffff', 0.4)} />;
              })}
            </g>
          );
        };

        // candle layout
        const span = Math.min(300, 50 * (n - 1) + 0);
        const cx_i = (i: number) => (n === 1 ? 0 : -span / 2 + (i * span) / (n - 1));
        const candleBaseY = topY + 4;
        const sparkleSeed = rng(p.seed * 3 + 1);

        // title / name
        const popT = backOut(prog(since, 10, 28, ease.linear), 1.9);
        const name = p.name;
        const nameFs = fitFont(name, wide ? 168 : 190, maxW, 0.62);
        const titleFs = fitFont(p.title, wide ? 84 : 92, maxW, 0.4);
        const wishOp = ease.out(prog(f, 62, 84, ease.linear)) * (1 - prog(since, -22, -6, ease.in));
        const msgOp = ease.out(prog(since, 34, 56, ease.linear));
        const chars = [...name];

        return (
          <g>
            {/* warm room glow */}
            <Glow id={`${uid}-g1`} x={cakeX} y={baseY + cakeDy - 330 * cs} r={620 * cs} color={p.flame} opacity={0.5 * glowAmt} />
            <Glow id={`${uid}-g2`} x={cakeX} y={baseY - 300 * cs} r={900 * cs} color={mixHex(p.flame, p.accent, 0.5)} opacity={0.18 * glowAmt} />

            {/* floating sparkles before the blow-out */}
            {Array.from({length: 10}, (_, i) => {
              const r = sparkleSeed();
              const r2 = sparkleSeed();
              const ph = (f * 0.012 + r) % 1;
              const x = cakeX + (r2 - 0.5) * 560 * cs;
              const y = baseY - 380 * cs - ph * 220 * cs;
              return <path key={i} d={sparkPath(x, y, 10 + 8 * r)} fill={p.flame} opacity={glowAmt * Math.sin(ph * Math.PI) * 0.8} />;
            })}

            {/* cake */}
            <g transform={`translate(${cakeX} ${baseY + cakeDy}) scale(${cs * sqX} ${cs * sqY})`}>
              <ellipse cx={0} cy={6} rx={bw / 2 + 80} ry={34} fill={plateC} />
              <ellipse cx={0} cy={0} rx={bw / 2 + 80} ry={30} fill={mixHex(plateC, '#ffffff', 0.22)} />
              {tier(bw, bh, -bh, 1)}
              {tier(tw, th, topY, 2)}
              {sprinkleSet.map((s, i) => {
                const onTop = i % 2 === 0;
                const wd = onTop ? tw : bw;
                const x = (s.u - 0.5) * (wd - 50);
                const y = onTop ? topY - 6 + (s.v - 0.5) * 20 : -bh + 4 + s.v * 24;
                const col = [p.accent2, p.flame, '#ffffff', p.ink][Math.floor(s.c * 4) % 4];
                return <rect key={i} x={x - 7} y={y - 2} width={14} height={4.5} rx={2} fill={col} transform={`rotate(${s.a} ${x} ${y})`} />;
              })}

              {/* candles */}
              {Array.from({length: n}, (_, i) => {
                const x = cx_i(i);
                const pop = backOut(prog(f, 20 + i * 3, 36 + i * 3, ease.linear), 1.7);
                if (pop <= 0) return null;
                const col = mixHex(p.accent2, '#ffffff', (i % 2) * 0.3);
                const hgt = candleH * pop;
                const ig = lit(i);
                const kIgn = backOut(prog(f, ig, ig + 9, ease.linear), 1.8);
                const out = blowAt + i * 2.2;
                const lean = prog(f, out - 6, out + 5, ease.out);
                const gone = prog(f, out + 4, out + 11, ease.in);
                const flick = 1 + 0.09 * Math.sin(f * 0.8 + i * 1.7) + 0.05 * Math.sin(f * 1.9 + i);
                const sway = 3 * Math.sin(f * 0.37 + i * 2) * (1 - lean);
                const fs = kIgn * (1 - gone);
                const wickY = candleBaseY - hgt;
                const smokeT = prog(f, out + 5, out + 55, ease.linear);
                return (
                  <g key={i}>
                    <rect x={x - 8} y={candleBaseY - hgt} width={16} height={hgt + 6} rx={3} fill={col} />
                    <rect x={x - 8} y={candleBaseY - hgt} width={5} height={hgt + 6} rx={2} fill="#ffffff" opacity={0.28} />
                    {[0.2, 0.42, 0.64, 0.86].map((k, j) => (
                      <path key={j} d={`M${x - 8} ${candleBaseY - hgt * k + 4}L${x + 8} ${candleBaseY - hgt * k - 6}`} stroke="#ffffff" strokeWidth={4} opacity={0.35} />
                    ))}
                    <path d={`M${x} ${wickY}L${x + 1.5} ${wickY - 8}`} stroke={mixHex(p.ink, '#000000', 0.5)} strokeWidth={2.4} strokeLinecap="round" />
                    {fs > 0.02 && (
                      <g transform={`translate(${x + 1.5} ${wickY - 6}) translate(${sway + lean * 8} 0) skewX(${-lean * 55}) scale(${fs * flick * (1 - lean * 0.2)} ${fs * flick * (1 + 0.12 * Math.sin(f * 0.5 + i))})`}>
                        <path d="M0 0C14 -14 15 -38 0 -68C-15 -38 -14 -14 0 0Z" fill={p.flame} />
                        <path d="M0 0C8 -8 8 -22 0 -40C-8 -22 -8 -8 0 0Z" fill={mixHex(p.flame, '#FFF6C8', 0.8)} />
                        <circle cx={0} cy={-6} r={5} fill="#FFFFFF" opacity={0.85} />
                      </g>
                    )}
                    {smokeT > 0 && smokeT < 1 && (() => {
                      const pts = Array.from({length: 14}, (_, k) => {
                        const s = k / 13;
                        const rise = s * 120 * Math.min(1, smokeT * 1.5);
                        return `${x + 3 + Math.sin(s * 7 + i * 1.3 + smokeT * 4) * (6 + s * 16) * smokeT} ${wickY - 8 - rise}`;
                      });
                      return <path d={`M${pts.join('L')}`} fill="none" stroke={mixHex(p.ink, bg, 0.35)} strokeWidth={5 - smokeT * 2.5} strokeLinecap="round" opacity={0.5 * (1 - smokeT)} />;
                    })()}
                  </g>
                );
              })}
            </g>

            {/* breath puff: three whoosh lines + a soft cloud travelling right across the candles */}
            {(() => {
              const t = prog(f, blowAt - 18, blowAt + 8, ease.out);
              const op = Math.sin(clamp((f - (blowAt - 18)) / 30) * Math.PI);
              if (op <= 0) return null;
              const yy = baseY - (bh + th + candleH + 30) * cs;
              const x0 = cakeX - 520 * cs;
              const x1 = cakeX + 40 * cs;
              const xx = x0 + (x1 - x0) * t;
              return (
                <g opacity={op * 0.9}>
                  {[-34, 0, 34].map((dy, k) => (
                    <path key={k} d={`M${xx - 200 * cs - k * 20} ${yy + dy * cs}q${40 * cs} ${-16 * cs} ${80 * cs} 0t${80 * cs} 0t${80 * cs} 0`} fill="none" stroke={mixHex(p.ink, bg, 0.15)} strokeWidth={6 * cs} strokeLinecap="round" opacity={0.7 - k * 0.15} />
                  ))}
                  {[0, 1, 2, 3].map((k) => (
                    <circle key={k} cx={xx + 10 * k * cs} cy={yy + (k % 2 ? 14 : -12) * cs} r={(26 + k * 9) * cs * (0.5 + t)} fill={withAlpha(p.ink, 0.12)} />
                  ))}
                </g>
              );
            })()}

            {/* after the blow: sparkle ring + confetti from both shoulders */}
            {since > 0 && (
              <g>
                <Confetti x={cakeX - 150 * cs} y={baseY - 330 * cs} t={since - 4} seed={p.seed + 1} colors={[p.accent, p.accent2, p.flame, p.ink]} n={46} power={21} spread={Math.PI * 0.8} dir={-Math.PI * 0.62} />
                <Confetti x={cakeX + 150 * cs} y={baseY - 330 * cs} t={since - 4} seed={p.seed + 2} colors={[p.accent, p.accent2, p.flame, p.ink]} n={46} power={21} spread={Math.PI * 0.8} dir={-Math.PI * 0.38} />
                {since < 30 && <circle cx={cakeX} cy={baseY - 330 * cs} r={(60 + since * 22) * cs} fill="none" stroke={p.flame} strokeWidth={8 * (1 - since / 30)} opacity={1 - since / 30} />}
              </g>
            )}

            {/* text: wish line while lit, then title + name */}
            <text x={tx} y={ty + 30} textAnchor="middle" fontFamily={fonts.hand} fontWeight={700} fontSize={fitFont(p.wish, wide ? 96 : 100, maxW, 0.4)} fill={p.ink} opacity={wishOp}>
              {p.wish}
            </text>
            {since > 8 && (
              <g transform={`translate(${tx} ${ty}) scale(${popT}) translate(${-tx} ${-ty})`} opacity={Math.min(1, popT * 1.5)}>
                <text x={tx} y={ty - nameFs * 0.62} textAnchor="middle" fontFamily={fonts.hand} fontWeight={700} fontSize={titleFs} fill={p.flame}>
                  {p.title}
                </text>
                <text x={tx + 5} y={ty + nameFs * 0.32 + 7} textAnchor="middle" fontFamily={fonts.display} fontSize={nameFs} fill="#000000" opacity={0.25} style={{whiteSpace: 'pre'}}>
                  {name}
                </text>
                <text x={tx} y={ty + nameFs * 0.32} textAnchor="middle" fontFamily={fonts.display} fontSize={nameFs} fill={p.ink} style={{whiteSpace: 'pre'}}>
                  {chars.map((c, i) => (
                    <tspan key={i} fillOpacity={ease.out(prog(since, 10 + i * 2, 20 + i * 2, ease.linear))} fill={i % 2 ? p.ink : mixHex(p.ink, p.accent, 0.35)}>
                      {c}
                    </tspan>
                  ))}
                </text>
                <path d={`M${tx - 150} ${ty + nameFs * 0.32 + 34}q150 22 300 0`} fill="none" stroke={p.accent} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease.out(prog(since, 26, 46, ease.linear))} />
              </g>
            )}
            <text x={tx} y={ty + nameFs * 0.32 + 104} textAnchor="middle" fontFamily={fonts.sans} fontWeight={600} fontSize={fitFont(p.message, 40, maxW, 0.52)} fill={p.ink} opacity={0.85 * msgOp}>
              {p.message}
            </text>
          </g>
        );
      }}
    </EventStage>
  );
};

export const birthdayCakeCandles = defineMotion<Props>({
  id: 'birthday-cake-candles',
  title: 'Birthday cake, candles & blow-out',
  category: 'text',
  description: 'A tiered cake drops in, candles are lit one by one with a warm glow and a wish line, then a puff of breath blows them out (leaning flames, smoke wisps) and confetti bursts as the name is revealed.',
  source: ['original (round 3, events & celebrations)'],
  useFor: 'Birthday greetings and reels, party invites, "happy birthday" posts, team-member birthdays, kids party intros, any "make a wish" reveal. Replace the name, title and colours; set the candle count to the age (up to 12).',
  durationInFrames: 300,
  defaultProps: {
    title: 'Happy Birthday',
    name: 'Alex',
    wish: 'Make a wish…',
    message: 'Wishing you a day full of joy',
    candles: 5,
    hold: 42,
    background: '#2A1738',
    ink: '#FFF4E6',
    accent: '#FF7AA8',
    accent2: '#7A8BFF',
    cake: '#F2C48D',
    flame: '#FFB52E',
    seed: 4,
    startAt: 0,
  },
  propDocs: {
    title: 'greeting line shown in script above the name',
    name: 'big name revealed after the candles go out',
    wish: 'line shown while the candles burn',
    message: 'small line under the name',
    candles: 'number of candles (1-12)',
    hold: 'frames the lit candles glow before the blow-out',
    background: 'frame colour (hex), or "transparent" to overlay content',
    ink: 'text colour (hex)',
    accent: 'frosting and underline colour (hex)',
    accent2: 'candle and sprinkle colour (hex)',
    cake: 'sponge colour (hex)',
    flame: 'flame and glow colour (hex)',
    seed: 'seed for drips, sprinkles and confetti',
    startAt: 'frame the sequence begins',
  },
  component: BirthdayCakeCandles,
  tags: ['birthday', 'cake', 'candles', 'celebration', 'party', 'greeting', 'wish', 'confetti', 'name', 'event', 'happy-birthday'],
});
