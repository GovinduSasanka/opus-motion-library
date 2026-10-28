import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {RARITY, fitSize, hexA, mixHex, useUid} from '../../core/r2-pr4-kit';
import {rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Loot reveal (mobile-game reward moment): a container (chest, sealed card or medallion) drops in and shakes in
 * escalating beats while rarity-coloured light leaks out, a 2-frame flash + shockwave + god rays + particles burst,
 * the item card rises out and flips (18 frames) to its face, stars pop in and the title banner stamps on.
 */
type Props = {
  title: string;
  image: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  container: 'chest' | 'card' | 'badge';
  foundLabel: string;
  rarityLabel: string;
  accent: string;
  background: string;
  shakeBeats: number;
  particles: number;
  seed: number;
};

const LootReveal: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const uid = useUid('loot');
  const R = RARITY[p.rarity] ?? RARITY.legendary;
  const col = p.accent || R.color;
  const light = mixHex(col, '#ffffff', 0.55);
  const deep = mixHex(col, '#000000', 0.55);

  // timeline
  const landF = 24;
  const shakeStart = 30;
  const beat = 14;
  const burst = shakeStart + p.shakeBeats * beat + 2;
  const flipStart = burst + 10;
  const flipEnd = flipStart + 18;
  const bannerAt = flipEnd + 6;
  const since = frame - burst;

  const C = {x: cx, y: cy - (portrait ? 20 : 30) * u};
  const cw = 300 * u;
  const ch = 400 * u;
  const cardY = -62 * u;

  // jolt (camera) on the burst and the banner stamp
  const jolt = (at: number, amp: number) => {
    const a = frame - at;
    if (a < 0 || a > 9) return [0, 0];
    const d = (1 - a / 9) * amp * u;
    return [Math.sin(a * 5.1) * d, Math.cos(a * 4.3) * d];
  };
  const [j1x, j1y] = jolt(burst, 10);
  const [j2x, j2y] = jolt(bannerAt, 6);
  const jx = j1x + j2x;
  const jy = j1y + j2y;

  // container drop + shake
  const dropT = prog(frame, 0, landF, ease.in);
  const bounce = frame < landF ? 0 : Math.exp(-(frame - landF) * 0.35) * Math.sin((frame - landF) * 0.9) * 14 * u;
  const dropY = (1 - dropT) * -(h * 0.5 + 200 * u) + bounce * -0.6;
  let shakeRot = 0;
  let shakeX = 0;
  let squash = 1;
  let charge = 0;
  for (let b = 0; b < p.shakeBeats; b++) {
    const s0 = shakeStart + b * beat;
    const k = frame - s0;
    if (k >= 0 && k < beat) {
      const amp = 3 + b * 5;
      const env = Math.sin((k / beat) * Math.PI);
      shakeRot += Math.sin(k * 1.9) * amp * env;
      shakeX += Math.sin(k * 1.9 + 1) * amp * 0.9 * env * u;
      squash += 0.03 * (b + 1) * env;
    }
  }
  charge = prog(frame, shakeStart, burst, ease.in);
  const opened = frame >= burst;

  // chest / sealed visual fade-out after the card is out
  const contGone = prog(frame, flipEnd - 6, flipEnd + 10, ease.in);

  // ---------------------------------------------------------------- particles
  const parts = React.useMemo(() => {
    const g = rng(p.seed * 91 + 5);
    return Array.from({length: p.particles}, (_, i) => {
      const a = -Math.PI / 2 + (g() - 0.5) * Math.PI * 1.55 + (g() < 0.12 ? Math.PI : 0);
      return {
        a,
        v: 380 + g() * 880,
        life: 28 + g() * 38,
        size: 5 + g() * 12,
        kind: g() < 0.45 ? 'conf' : g() < 0.5 ? 'star' : 'dot',
        c: Math.floor(g() * 4),
        spin: (g() - 0.5) * 0.5,
        rot0: g() * 6.28,
        delay: Math.floor(g() * 4),
        i,
      };
    });
  }, [p.particles, p.seed]);
  const pc = [col, '#ffffff', light, mixHex(col, '#fff3c0', 0.5)];

  // ---------------------------------------------------------------- rays
  const rayA = prog(frame, burst, burst + 5, ease.out) * lerp(0.85, 0.42, prog(frame, burst + 5, burst + 45, ease.out));
  const rayFade = clamp(rayA);
  const rayRot = (frame - burst) * 0.45;
  const rayLen = Math.max(w, h) * 1.2;
  const rays = Array.from({length: 14}, (_, i) => {
    const a0 = (i / 14) * Math.PI * 2;
    const half = 0.055;
    return `M0,0 L${(Math.cos(a0 - half) * rayLen).toFixed(1)},${(Math.sin(a0 - half) * rayLen).toFixed(1)} L${(Math.cos(a0 + half) * rayLen).toFixed(1)},${(Math.sin(a0 + half) * rayLen).toFixed(1)}Z`;
  }).join('');

  // ---------------------------------------------------------------- card pose
  const rise = prog(frame, burst + 2, burst + 20, ease.out);
  const isCardCont = p.container === 'card';
  const flipAng = Math.PI * (1 - prog(frame, flipStart, flipEnd, ease.inOut)); // PI -> 0
  const sx = Math.cos(flipAng);
  const showFront = sx >= 0;
  const cardVisible = isCardCont ? frame >= landF - 8 : frame >= burst + 2;
  const float = Math.sin(frame * 0.075) * 5 * u * prog(frame, flipEnd, flipEnd + 12);
  const cardScale = isCardCont ? 1 : lerp(0.35, 1, rise);
  const cardCy = isCardCont ? cardY + (1 - dropT) * -(h * 0.5 + 200 * u) + bounce * -0.6 : lerp(130 * u, cardY, rise) + float;
  const cardRot = isCardCont ? shakeRot * (frame < burst ? 1 : 0) : 0;
  const cardSX = isCardCont && frame < flipStart ? 1 : sx;
  const cardShowFront = isCardCont && frame < flipStart ? false : showFront;
  const cardShakeX = isCardCont && frame < burst ? shakeX : 0;
  const mouthY = 24 * u; // chest mouth line (card is clipped above it while rising)
  const clipCard = !isCardCont && frame < flipEnd - 4;
  const flipPop = 1 + 0.06 * Math.sin(prog(frame, flipStart, flipEnd) * Math.PI);

  const starsN = R.stars;

  // ---------------------------------------------------------------- pieces
  const Card = () => (
    <g transform={`translate(${cardShakeX} ${cardCy}) rotate(${cardRot}) scale(${cardSX * cardScale * flipPop} ${cardScale * flipPop})`}>
      <rect x={-cw / 2 - 12 * u} y={-ch / 2 - 12 * u} width={cw + 24 * u} height={ch + 24 * u} rx={34 * u} fill={col} opacity={0.22 * clamp(since / 8)} filter={`url(#${uid}blur)`} />
      {cardShowFront ? (
        <g>
          <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={26 * u} fill={`url(#${uid}rim)`} />
          <rect x={-cw / 2 + 9 * u} y={-ch / 2 + 9 * u} width={cw - 18 * u} height={ch - 18 * u} rx={19 * u} fill={`url(#${uid}face)`} />
          <clipPath id={uid + 'cc'}>
            <rect x={-cw / 2 + 9 * u} y={-ch / 2 + 9 * u} width={cw - 18 * u} height={ch - 18 * u} rx={19 * u} />
          </clipPath>
          <g clipPath={`url(#${uid}cc)`}>
            {p.image ? (
              <image href={resolveSrc(p.image)} x={-cw / 2 + 9 * u} y={-ch / 2 + 9 * u} width={cw - 18 * u} height={ch - 18 * u} preserveAspectRatio="xMidYMid slice" />
            ) : (
              <>
                {Array.from({length: 10}, (_, i) => (
                  <path key={i} d={`M0,${-20 * u} L${Math.cos((i / 10) * 6.283) * 400 * u},${-20 * u + Math.sin((i / 10) * 6.283) * 400 * u} L${Math.cos(((i + 0.5) / 10) * 6.283) * 400 * u},${-20 * u + Math.sin(((i + 0.5) / 10) * 6.283) * 400 * u}Z`} fill={light} opacity={0.1} />
                ))}
                <Gem u={u} col={col} y={-18 * u} t={frame} />
              </>
            )}
          </g>
          <path d={`M${-cw / 2 + 9 * u},${-ch / 2 + 62 * u} L${cw / 2 - 9 * u},${-ch / 2 + 62 * u}`} stroke="none" />
          <text x={0} y={-ch / 2 + 44 * u} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={17 * u} letterSpacing={5 * u} fill={light}>
            {(p.rarityLabel || R.label).toUpperCase()}
          </text>
          {/* stars */}
          {Array.from({length: starsN}, (_, i) => {
            const a = prog(frame, flipEnd + 2 + i * 4, flipEnd + 10 + i * 4, ease.back);
            const sxp = (i - (starsN - 1) / 2) * 44 * u;
            return <polygon key={i} transform={`translate(${sxp} ${ch / 2 - 40 * u}) scale(${a})`} points={star(15 * u, 6.5 * u)} fill={light} stroke={deep} strokeWidth={2 * u} />;
          })}
          {/* glass sheen sweep */}
          <g clipPath={`url(#${uid}cc)`}>
            <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} fill={`url(#${uid}sheen)`} opacity={0.9} transform={`translate(${lerp(-cw * 1.4, cw * 1.4, prog(frame, flipEnd + 4, flipEnd + 30, ease.inOut))} 0)`} />
          </g>
        </g>
      ) : (
        <g>
          <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={26 * u} fill={deep} stroke={col} strokeWidth={8 * u} />
          <rect x={-cw / 2 + 22 * u} y={-ch / 2 + 22 * u} width={cw - 44 * u} height={ch - 44 * u} rx={14 * u} fill="none" stroke={hexA(light, 0.4)} strokeWidth={2 * u} strokeDasharray={`${8 * u} ${7 * u}`} />
          <rect x={-cw / 2 + 22 * u} y={-ch / 2 + 22 * u} width={cw - 44 * u} height={ch - 44 * u} rx={14 * u} fill={`url(#${uid}back)`} />
          <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontFamily={fonts.display} fontSize={150 * u} fill={light} opacity={0.9} transform={isCardCont ? '' : 'scale(-1 1)'}>
            ?
          </text>
        </g>
      )}
    </g>
  );

  const chestW = 340 * u;
  const chestH = 170 * u;
  const lidOpen = prog(frame, burst, burst + 12, ease.back);
  const Chest = () => (
    <g transform={`translate(${shakeX} ${230 * u + (1 - dropT) * -(h * 0.5 + 200 * u) + bounce * -0.6 + contGone * 160 * u}) rotate(${shakeRot * 0.5}) scale(${1 / squash} ${squash})`} opacity={1 - contGone}>
      <ellipse cx={0} cy={4 * u} rx={chestW * 0.62} ry={22 * u} fill="#000" opacity={0.3} />
      {/* back / interior glow */}
      <rect x={-chestW / 2} y={-chestH} width={chestW} height={chestH} rx={14 * u} fill="#5b3716" />
      {/* leaking light before open */}
      <rect x={-chestW / 2 + 8 * u} y={-chestH - 5 * u} width={chestW - 16 * u} height={8 * u} fill={light} opacity={charge * 0.9} filter={`url(#${uid}blur)`} />
      {opened && <ellipse cx={0} cy={-chestH} rx={chestW * 0.42} ry={18 * u} fill={`url(#${uid}mouth)`} />}
      {/* lid (pops up and tilts back) */}
      <g transform={`translate(${-chestW / 2 * 0.15 * lidOpen} ${-chestH - 8 * u * lidOpen - 70 * u * lidOpen}) rotate(${-24 * lidOpen} ${-chestW / 2} ${0})`}>
        <path d={`M${-chestW / 2},${0} L${-chestW / 2},${-chestH * 0.25} Q${-chestW / 2},${-chestH * 0.75} 0,${-chestH * 0.75} Q${chestW / 2},${-chestH * 0.75} ${chestW / 2},${-chestH * 0.25} L${chestW / 2},${0}Z`} fill="#9a6431" />
        <path d={`M${-chestW / 2},${0} L${-chestW / 2},${-chestH * 0.25} Q${-chestW / 2},${-chestH * 0.75} 0,${-chestH * 0.75}`} fill="none" stroke="#c78a4a" strokeWidth={4 * u} opacity={0.7} />
        {[-0.28, 0.28].map((k) => (
          <rect key={k} x={chestW * k - 14 * u} y={-chestH * 0.75} width={28 * u} height={chestH * 0.78} fill={col} opacity={0.95} />
        ))}
        <rect x={-chestW / 2} y={-14 * u} width={chestW} height={16 * u} fill={col} />
      </g>
      {/* front */}
      <path d={`M${-chestW / 2},${-chestH + 2 * u} h${chestW} v${chestH - 12 * u} q0,${12 * u} ${-12 * u},${12 * u} h${-(chestW - 24 * u)} q${-12 * u},0 ${-12 * u},${-12 * u}Z`} fill="#8a5628" />
      {[0.2, 0.4, 0.6, 0.8].map((k) => (
        <line key={k} x1={-chestW / 2} y1={-chestH + chestH * k} x2={chestW / 2} y2={-chestH + chestH * k} stroke="#6a4019" strokeWidth={2 * u} opacity={0.7} />
      ))}
      {[-0.28, 0.28].map((k) => (
        <rect key={k} x={chestW * k - 14 * u} y={-chestH + 2 * u} width={28 * u} height={chestH - 6 * u} fill={col} opacity={0.95} />
      ))}
      <rect x={-chestW / 2} y={-chestH + 2 * u} width={chestW} height={16 * u} fill={col} />
      <rect x={-22 * u} y={-chestH + 22 * u} width={44 * u} height={56 * u} rx={9 * u} fill={light} stroke={deep} strokeWidth={3 * u} />
      <circle cx={0} cy={-chestH + 44 * u} r={7 * u} fill={deep} />
      <rect x={-3 * u} y={-chestH + 46 * u} width={6 * u} height={16 * u} rx={2 * u} fill={deep} />
    </g>
  );

  const Badge = () => {
    const gone = prog(frame, burst, burst + 18, ease.out);
    const off = gone * 110 * u;
    const rot = gone * 14;
    const rr = 150 * u;
    return (
      <g transform={`translate(${shakeX} ${60 * u + (1 - dropT) * -(h * 0.5 + 200 * u) + bounce * -0.6}) rotate(${shakeRot * 0.6}) scale(${1 / squash} ${squash})`} opacity={1 - clamp((gone - 0.55) / 0.45)}>
        {[-1, 1].map((sd) => (
          <g key={sd} transform={`translate(${sd * off} ${gone * 30 * u}) rotate(${sd * rot})`}>
            <clipPath id={`${uid}h${sd}`}>
              <rect x={sd < 0 ? -rr * 2 : 0} y={-rr * 2} width={rr * 2} height={rr * 4} />
            </clipPath>
            <g clipPath={`url(#${uid}h${sd})`}>
              <circle r={rr} fill={deep} stroke={col} strokeWidth={12 * u} />
              <circle r={rr * 0.72} fill="none" stroke={hexA(light, 0.55)} strokeWidth={3 * u} strokeDasharray={`${10 * u} ${8 * u}`} />
              <circle r={rr * 0.6} fill={`url(#${uid}back)`} />
              <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontFamily={fonts.display} fontSize={130 * u} fill={light}>
                ?
              </text>
            </g>
          </g>
        ))}
      </g>
    );
  };

  // banner
  const bAge = frame - bannerAt;
  const bScale = bAge < 0 ? 0 : lerp(1.9, 1, ease.back(clamp(bAge / 8)));
  const bw = Math.min(w * 0.86, 720 * u);
  const bh = 92 * u;
  const bannerY = C.y + (portrait ? 300 : 276) * u;
  const titleSize = fitSize(p.title.toUpperCase(), fonts.display, 52 * u, bw - 120 * u, 400);

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <radialGradient id={uid + 'bg'} cx="50%" cy="46%" r="75%">
            <stop offset="0" stopColor={mixHex(p.background, col, 0.28 + 0.2 * charge)} />
            <stop offset="1" stopColor={mixHex(p.background, '#000', 0.4)} />
          </radialGradient>
          <radialGradient id={uid + 'ray'} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={rayLen}>
            <stop offset="0" stopColor={light} stopOpacity="0.9" />
            <stop offset="0.6" stopColor={col} stopOpacity="0.28" />
            <stop offset="1" stopColor={col} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={uid + 'rim'} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={light} />
            <stop offset="0.5" stopColor={col} />
            <stop offset="1" stopColor={deep} />
          </linearGradient>
          <linearGradient id={uid + 'face'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mixHex(col, '#14121f', 0.62)} />
            <stop offset="1" stopColor={mixHex(col, '#0a0912', 0.82)} />
          </linearGradient>
          <linearGradient id={uid + 'sheen'} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={uid + 'back'} cx="50%" cy="50%" r="60%">
            <stop offset="0" stopColor={col} stopOpacity={0.35 + 0.4 * charge} />
            <stop offset="1" stopColor={col} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={uid + 'mouth'}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.5" stopColor={light} />
            <stop offset="1" stopColor={col} />
          </radialGradient>
          <filter id={uid + 'blur'} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={14 * u} />
          </filter>
        </defs>
        <rect width={w} height={h} fill={`url(#${uid}bg)`} />

        <g transform={`translate(${jx} ${jy})`}>
          {/* light charging behind the container */}
          <circle cx={C.x} cy={C.y + 100 * u} r={260 * u * (0.5 + charge)} fill={col} opacity={0.35 * charge * (opened ? 0 : 1)} filter={`url(#${uid}blur)`} />

          {/* rays */}
          {opened && (
            <g transform={`translate(${C.x} ${C.y - 20 * u}) rotate(${rayRot})`} opacity={rayFade}>
              <path d={rays} fill={`url(#${uid}ray)`} />
            </g>
          )}

          {/* container */}
          <g transform={`translate(${C.x} ${C.y})`}>
            {p.container === 'chest' && <Chest />}
            {p.container === 'badge' && !opened && <Badge />}
            {p.container === 'badge' && opened && frame < burst + 22 && <Badge />}
          </g>

          {/* card */}
          {cardVisible && (
            <g transform={`translate(${C.x} ${C.y})`}>
              {clipCard ? (
                <>
                  <clipPath id={uid + 'rise'}>
                    <rect x={-w} y={-h * 2} width={w * 2} height={h * 2 + mouthY + 150 * u} />
                  </clipPath>
                  <g clipPath={`url(#${uid}rise)`}>
                    <Card />
                  </g>
                </>
              ) : (
                <Card />
              )}
            </g>
          )}

          {/* shockwave + flash ring */}
          {since >= 0 && since < 16 && (
            <circle cx={C.x} cy={C.y - 20 * u} r={lerp(30, 720, ease.out(since / 16)) * u} fill="none" stroke="#fff" strokeWidth={lerp(26, 2, since / 16) * u} opacity={1 - since / 16} />
          )}

          {/* particles */}
          {since >= 0 &&
            parts.map((q) => {
              const t = (since - q.delay) / 30;
              if (t < 0) return null;
              const k = 1.6;
              const dr = (1 - Math.exp(-k * t)) / k;
              const x = Math.cos(q.a) * q.v * dr * u;
              const y = Math.sin(q.a) * q.v * dr * u + 0.5 * 1100 * u * t * t;
              const age = t * 30 / q.life;
              if (age > 1) return null;
              const al = age < 0.65 ? 1 : 1 - (age - 0.65) / 0.35;
              const px = C.x + x;
              const py = C.y - 40 * u + y;
              const rot = (q.rot0 + q.spin * t * 30) * 57.3;
              const s = q.size * u;
              const colr = pc[q.c];
              return q.kind === 'conf' ? (
                <rect key={q.i} x={-s / 2} y={-s * 0.3} width={s} height={s * 0.6} fill={colr} opacity={al} transform={`translate(${px} ${py}) rotate(${rot}) scale(1 ${Math.cos(t * 9 + q.i)})`} />
              ) : q.kind === 'star' ? (
                <polygon key={q.i} points={star(s * 1.3, s * 0.5)} fill={colr} opacity={al} transform={`translate(${px} ${py}) rotate(${rot})`} />
              ) : (
                <circle key={q.i} cx={px} cy={py} r={s * 0.4} fill={colr} opacity={al} />
              );
            })}

          {/* idle sparkles around the card */}
          {frame > flipEnd &&
            Array.from({length: 6}, (_, i) => {
              const ang = (i / 6) * 6.283 + 0.5;
              const rr = (230 + (i % 2) * 40) * u;
              const tw = Math.max(0, Math.sin(frame * 0.11 + i * 2.1));
              return <polygon key={i} points={star(14 * u, 3 * u)} fill="#fff" opacity={tw * 0.9} transform={`translate(${C.x + Math.cos(ang) * rr * 0.95} ${C.y + cardY + Math.sin(ang) * rr * 1.05}) scale(${0.5 + tw * 0.7})`} />;
            })}

          {/* banner */}
          {bAge >= 0 && (
            <g transform={`translate(${C.x} ${bannerY}) rotate(${-1.5 * (1 - clamp(bAge / 10))}) scale(${bScale})`}>
              <path d={`M${-bw / 2},${-bh / 2} h${bw} l${28 * u},${bh / 2} l${-28 * u},${bh / 2} h${-bw} l${28 * u},${-bh / 2}Z`} fill="#000" opacity={0.35} transform={`translate(${5 * u} ${8 * u})`} />
              <path d={`M${-bw / 2},${-bh / 2} h${bw} l${28 * u},${bh / 2} l${-28 * u},${bh / 2} h${-bw} l${28 * u},${-bh / 2}Z`} fill={`url(#${uid}rim)`} />
              <path d={`M${-bw / 2 + 6 * u},${-bh / 2 + 6 * u} h${bw - 12 * u} M${-bw / 2 + 6 * u},${bh / 2 - 6 * u} h${bw - 12 * u}`} stroke={hexA('#fff', 0.5)} strokeWidth={2 * u} />
              <text x={0} y={-bh / 2 - 14 * u} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={19 * u} letterSpacing={6 * u} fill={light}>
                {p.foundLabel.toUpperCase()}
              </text>
              <text x={0} y={4 * u} textAnchor="middle" dominantBaseline="central" fontFamily={fonts.display} fontSize={titleSize} letterSpacing={titleSize * 0.03} fill="#fff" stroke={deep} strokeWidth={titleSize * 0.06} paintOrder="stroke">
                {p.title.toUpperCase()}
              </text>
            </g>
          )}
        </g>

        {/* 2-frame flash */}
        {since >= 0 && since < 2 && <rect width={w} height={h} fill="#fff" opacity={since === 0 ? 0.95 : 0.5} />}
      </Svg>
    </AbsoluteFill>
  );
};

const star = (ro: number, ri: number) =>
  Array.from({length: 8}, (_, i) => {
    const a = -Math.PI / 2 + (i / 8) * Math.PI * 2;
    const r = i % 2 === 0 ? ro : ri;
    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');

/** faceted gem used when no image is supplied */
const Gem: React.FC<{u: number; col: string; y: number; t: number}> = ({u, col, y, t}) => {
  const g = 105 * u;
  const P = (x: number, yy: number) => `${(x * g).toFixed(1)},${(yy * g).toFixed(1)}`;
  const L = (a: number) => mixHex(col, a > 0 ? '#ffffff' : '#000000', Math.abs(a));
  const facets: [string, number][] = [
    [[P(-0.5, -0.55), P(0.5, -0.55), P(0.28, -0.12), P(-0.28, -0.12)].join(' '), 0.55],
    [[P(-0.5, -0.55), P(-0.28, -0.12), P(-0.95, -0.12)].join(' '), 0.2],
    [[P(0.5, -0.55), P(0.95, -0.12), P(0.28, -0.12)].join(' '), 0.32],
    [[P(-0.28, -0.12), P(0.28, -0.12), P(0, 0.95)].join(' '), -0.05],
    [[P(-0.95, -0.12), P(-0.28, -0.12), P(0, 0.95)].join(' '), -0.3],
    [[P(0.95, -0.12), P(0.28, -0.12), P(0, 0.95)].join(' '), -0.45],
    [[P(-0.5, -0.55), P(-0.95, -0.12), P(-0.5, -0.55)].join(' '), 0.1],
  ];
  const glint = Math.max(0, Math.sin(t * 0.09));
  return (
    <g transform={`translate(0 ${y})`}>
      <ellipse cx={0} cy={g * 1.05} rx={g * 0.7} ry={g * 0.1} fill="#000" opacity={0.3} />
      {facets.map(([pts, a], i) => (
        <polygon key={i} points={pts} fill={L(a)} stroke={mixHex(col, '#fff', 0.7)} strokeWidth={1.5 * u} strokeLinejoin="round" opacity={0.98} />
      ))}
      <polygon points={star(26 * u, 4 * u)} fill="#fff" opacity={glint} transform={`translate(${-g * 0.3} ${-g * 0.4}) scale(${0.6 + glint * 0.6})`} />
    </g>
  );
};

export const lootReveal = defineMotion<Props>({
  id: 'loot-reveal',
  title: 'Loot reveal',
  category: 'game',
  description:
    'Mobile-game reward moment: a wooden chest (or sealed card / medallion) drops in, shakes in three escalating beats while rarity-coloured light leaks out, bursts with a 2-frame flash, shockwave, god rays and particles, then an item card rises, flips to a faceted gem (or your image), stars pop in and a title banner stamps on.',
  source: ['prompt-corpus: loot-reveal (11 cases, awesome-opus5-5-videos)'],
  useFor: 'Achievements, onboarding rewards, "you unlocked X" moments in apps, giveaway reveals and promo hooks. Set rarity for the colour set, image for the item art and title for the banner.',
  durationInFrames: 150,
  defaultProps: {
    title: 'Aurora Gem',
    image: '',
    rarity: 'legendary',
    container: 'chest',
    foundLabel: 'You unlocked',
    rarityLabel: '',
    accent: '',
    background: '#0b0e1e',
    shakeBeats: 3,
    particles: 70,
    seed: 4,
  },
  propDocs: {
    title: 'item name on the banner',
    image: 'optional public/ path or URL for the item art (falls back to a faceted gem)',
    rarity: "'common' #9AA4B1 | 'rare' #3B82F6 | 'epic' #A855F7 | 'legendary' #F59E0B (also sets 1-4 stars)",
    container: "'chest' | 'card' (sealed card flips open) | 'badge' (medallion splits)",
    foundLabel: 'small line above the banner',
    rarityLabel: 'override the rarity word on the card ("" = from rarity)',
    accent: 'override the rarity colour (hex, "" = from rarity)',
    background: 'dark base colour (tinted by the rarity colour)',
    shakeBeats: 'number of escalating shake beats before the burst',
    particles: 'burst particle count',
    seed: 'particle seed',
  },
  component: LootReveal,
  tags: ['loot', 'loot box', 'chest', 'reward', 'unlock', 'achievement', 'rarity', 'legendary', 'card flip', 'god rays', 'burst', 'particles', 'gacha', 'game', 'mobile game', 'gamification', 'giveaway', 'reveal', 'banner', 'stars', 'treasure'],
});
