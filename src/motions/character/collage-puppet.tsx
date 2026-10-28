// Adapted from mg-styles-15/demos/06-collage/index.html (drawHead, MOUTH, LIDF, SPILL) and work/prep.py (MIT) — see THIRD_PARTY_NOTICES.md
// The drawn engraving-style head is an original design; pass faceSrc / revealSrc / spillSrcs to use your own cut-outs.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {defineMotion} from '../../core/types';
import {clamp, ease, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {FilmGrain, PaperTexture, Svg, Vignette, useStage} from '../../core/stage';
import {fonts} from '../../core/fonts';
import {resolveSrc} from '../../core/asset';
import {Scissors, boil, slap, stepFrame, tornRect} from '../../core/r2-mg2a-kit';

type Props = {
  faceSrc: string;
  revealSrc: string;
  spillSrcs: string[];
  talkAt: number;
  cutAt: number;
  openAt: number;
  endTalkAt: number;
  speech: string;
  bang: string;
  caption: string;
  seed: number;
  background: string;
  red: string;
  ink: string;
  paper: string;
};

const SIL =
  'M-150,-30 C-160,-170 -90,-250 0,-250 C90,-250 160,-170 150,-30 C148,70 122,150 72,212 Q0,262 -72,212 C-122,150 -148,70 -150,-30 Z';
const CUT_Y = -90;
const JAW_Y = 108;
const HINGE: [number, number] = [-148, CUT_Y];
const JAW_HINGE: [number, number] = [-142, 96];
const POSES = [
  {dy: 0, rot: 0},
  {dy: 16, rot: 2.5},
  {dy: 38, rot: 5.5},
];

const Head: React.FC<{faceSrc: string; ink: string; paper: string}> = ({faceSrc, ink, paper}) => {
  if (faceSrc) return <image href={resolveSrc(faceSrc)} x={-190} y={-270} width={380} height={540} preserveAspectRatio="xMidYMid meet" />;
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {/* ears */}
      <ellipse cx={-152} cy={-12} rx={18} ry={34} fill="#E3D4B8" stroke={ink} strokeWidth={4} />
      <ellipse cx={152} cy={-12} rx={18} ry={34} fill="#E3D4B8" stroke={ink} strokeWidth={4} />
      <path d={SIL} fill="#EADFC8" stroke={ink} strokeWidth={5} />
      {/* halftone shading (45 deg dots, denser on the shadow side) */}
      <path d={SIL} fill="url(#cp-ht)" mask="url(#cp-shade)" />
      {/* hair */}
      <path d="M-150,-30 C-170,-150 -100,-262 0,-262 C100,-262 172,-150 150,-30 C140,-110 110,-150 40,-158 C-20,-132 -96,-132 -150,-30 Z" fill={ink} />
      <path d="M-120,-150 C-70,-210 40,-228 110,-170" fill="none" stroke={paper} strokeWidth={3} opacity={0.7} />
      <path d="M-100,-170 C-50,-215 30,-225 80,-196" fill="none" stroke={paper} strokeWidth={2} opacity={0.5} />
      {/* brows */}
      <path d="M-104,-62 Q-66,-84 -26,-64" fill="none" stroke={ink} strokeWidth={11} />
      <path d="M26,-64 Q66,-84 104,-62" fill="none" stroke={ink} strokeWidth={11} />
      {/* eyes */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M${s * 30},-26 Q${s * 66},-52 ${s * 102},-26 Q${s * 66},-2 ${s * 30},-26 Z`} fill="#fff" stroke={ink} strokeWidth={4} />
          <circle cx={s * 62} cy={-26} r={11} fill={ink} />
          <circle cx={s * 59} cy={-30} r={3.4} fill="#fff" />
          <path d={`M${s * 28},-30 Q${s * 66},-56 ${s * 104},-30`} fill="none" stroke={ink} strokeWidth={5} />
          <path d={`M${s * 40},-2 Q${s * 66},12 ${s * 96},-2`} fill="none" stroke={ink} strokeWidth={2} opacity={0.5} />
        </g>
      ))}
      {/* nose */}
      <path d="M-4,-20 C-14,10 -26,36 -22,50 Q0,66 24,50 C22,40 10,20 6,-20" fill="none" stroke={ink} strokeWidth={4} />
      <path d="M-20,52 Q-12,58 -6,52 M8,52 Q14,58 22,52" fill="none" stroke={ink} strokeWidth={4} />
      {/* cheek hatching */}
      <g stroke={ink} strokeWidth={1.6} opacity={0.55}>
        {[0, 1, 2, 3, 4].map((i) => (
          <React.Fragment key={i}>
            <path d={`M${-120 + i * 5},${20 + i * 14} l22,-10`} />
            <path d={`M${120 - i * 5},${20 + i * 14} l-22,-10`} />
          </React.Fragment>
        ))}
      </g>
      {/* moustache */}
      <path d="M-84,80 C-60,52 -22,66 0,76 C22,66 60,52 84,80 C60,100 24,92 0,92 C-24,92 -60,100 -84,80 Z" fill={ink} />
      {/* mouth line + lower lip + chin */}
      <path d="M-56,110 Q0,124 56,110" fill="none" stroke={ink} strokeWidth={6} />
      <path d="M-40,132 Q0,146 40,132" fill="none" stroke={ink} strokeWidth={4} opacity={0.6} />
      <path d="M-30,186 Q0,200 30,186" fill="none" stroke={ink} strokeWidth={3} opacity={0.5} />
      <path d="M-100,160 Q-60,222 0,226 Q60,222 100,160" fill="none" stroke={ink} strokeWidth={2} opacity={0.35} />
    </g>
  );
};

/* ---- little spill items (origin at centre, ~120 units) */
const Item: React.FC<{kind: number; sf: number; red: string; ink: string; paper: string; src?: string}> = ({kind, sf, red, ink, paper, src}) => {
  if (src) return <image href={resolveSrc(src)} x={-70} y={-70} width={140} height={140} preserveAspectRatio="xMidYMid meet" />;
  const flick = Math.floor(sf / 2.5) % 2;
  const flap = Math.floor(sf / 3.5) % 2;
  const bfl = Math.floor(sf / 2.5) % 2;
  const sw = {stroke: ink, strokeWidth: 3.5, strokeLinejoin: 'round' as const};
  switch (kind) {
    case 0: // rocket
      return (
        <g>
          <path d={`M-14,52 Q0,${flick ? 112 : 92} 14,52 Z`} fill="#F2B31B" />
          <path d={`M-8,52 Q0,${flick ? 92 : 80} 8,52 Z`} fill="#fff" />
          <path d="M-26,30 L-48,64 L-22,52 Z M26,30 L48,64 L22,52 Z" fill={red} {...sw} />
          <path d="M0,-72 C30,-40 30,10 22,52 L-22,52 C-30,10 -30,-40 0,-72 Z" fill="#F4EFE4" {...sw} />
          <path d="M0,-72 C14,-60 22,-46 25,-34 L-25,-34 C-22,-46 -14,-60 0,-72 Z" fill={red} {...sw} />
          <circle cx={0} cy={-6} r={12} fill="#6aa9d8" {...sw} />
        </g>
      );
    case 1: // earth
      return (
        <g>
          <circle r={56} fill="#2E6FB6" {...sw} />
          <path d="M-30,-30 C-10,-44 6,-30 -4,-10 C-14,4 -36,0 -42,-12 Z M10,6 C30,-4 46,12 40,32 C30,44 16,36 12,22 Z M-24,22 C-14,16 -4,30 -14,40 Z" fill="#4C9B52" stroke={ink} strokeWidth={2.5} />
          <path d="M-56,0 A56,56 0 0 1 0,-56" fill="none" stroke="#fff" strokeWidth={5} opacity={0.45} />
        </g>
      );
    case 2: // bird
      return (
        <g>
          <path d="M-40,8 L-70,-6 L-62,16 L-72,30 L-38,24 Z" fill={ink} />
          <ellipse cx={0} cy={10} rx={44} ry={28} fill="#E7B23B" {...sw} />
          <circle cx={36} cy={-14} r={20} fill="#E7B23B" {...sw} />
          <path d="M52,-16 L74,-8 L52,-4 Z" fill={red} {...sw} />
          <circle cx={42} cy={-18} r={4} fill={ink} />
          <path d={flap ? 'M-18,4 C-30,-40 6,-60 36,-44 C20,-30 8,-10 4,8 Z' : 'M-18,12 C-34,42 4,64 36,50 C20,36 8,26 4,14 Z'} fill="#F4EFE4" {...sw} />
        </g>
      );
    case 3: // rose
      return (
        <g>
          <path d="M0,24 C-6,60 6,80 0,110" fill="none" stroke="#3b7d3f" strokeWidth={7} strokeLinecap="round" />
          <path d="M0,70 C-26,52 -40,62 -42,76 C-26,86 -10,82 0,70 Z" fill="#4C9B52" {...sw} />
          <circle cx={0} cy={-8} r={34} fill={red} {...sw} />
          <path d="M-18,-8 C-18,-30 18,-30 18,-6 C18,14 -10,16 -10,0 C-10,-12 8,-12 8,-2" fill="none" stroke={ink} strokeWidth={3.2} />
          <path d="M-30,-12 C-26,-34 -8,-42 10,-38" fill="none" stroke="#fff" strokeWidth={3} opacity={0.4} />
        </g>
      );
    default: // butterfly
      return (
        <g>
          <g transform={`scale(${bfl ? 1 : 0.42} 1)`}>
            <path d="M0,-4 C-20,-56 -70,-44 -62,-6 C-58,18 -20,16 0,2 Z M0,-4 C20,-56 70,-44 62,-6 C58,18 20,16 0,2 Z" fill="#E4572E" {...sw} />
            <path d="M0,6 C-18,22 -44,40 -30,56 C-14,60 -2,34 0,10 Z M0,6 C18,22 44,40 30,56 C14,60 2,34 0,10 Z" fill="#F2B31B" {...sw} />
            <circle cx={-34} cy={-16} r={6} fill="#fff" opacity={0.85} />
            <circle cx={34} cy={-16} r={6} fill="#fff" opacity={0.85} />
          </g>
          <rect x={-4} y={-24} width={8} height={62} rx={4} fill={ink} />
          <path d="M0,-24 L-12,-44 M0,-24 L12,-44" stroke={ink} strokeWidth={2.5} />
        </g>
      );
  }
};

const REST: {x: number; y: number; r: number; s: number}[] = [
  {x: -170, y: -405, r: -28, s: 1.0},
  {x: 262, y: -292, r: 8, s: 1.05},
  {x: -352, y: -80, r: -6, s: 1.05},
  {x: 352, y: -40, r: 18, s: 1.0},
  {x: 140, y: -405, r: 0, s: 1.0},
];

const CollagePuppet: React.FC<Props> = ({faceSrc, revealSrc, spillSrcs, talkAt, cutAt, openAt, endTalkAt, speech, bang, caption, seed, background, red, ink, paper}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const S = portrait ? (w / 1000) * 1.02 : (h / 1080) * 1.12;
  const hx = cx;
  const hy = cy + (portrait ? 170 : 70) * S;
  const sf = stepFrame(frame);

  // ---- timeline pieces
  const headSlap = slap(frame, 6);
  const discSlap = slap(frame, 0);
  const jawPose = (start: number) => {
    const n = Math.floor((sf - start) / 2.5);
    if (n < 0 || n >= 15) return 0;
    return [1, 2, 2, 1, 0][n % 5];
  };
  const pose = POSES[Math.max(jawPose(talkAt), jawPose(endTalkAt))];

  const cutStart = cutAt + 12;
  const snipLen = 6;
  const snips = 5;
  const cutEnd = cutStart + snips * snipLen;
  const ph = frame - cutStart;
  const k = Math.floor(ph / snipLen);
  const within = (ph % snipLen) / snipLen;
  const total = 290;
  const sPos = ph < 0 ? 0 : ph >= snips * snipLen ? total : (k / snips) * total + (total / snips) * clamp(within / 0.6);
  const openAmt = ph < 0 ? 0.3 : ph >= snips * snipLen ? 0 : within < 0.6 ? clamp(within / 0.6) : 1 - clamp((within - 0.6) / 0.12);
  const lineP = prog(frame, cutAt, cutAt + 12, ease.out);
  const scissorsOn = frame >= cutStart - 6 && frame < cutEnd + 14;
  const scExit = prog(frame, cutEnd + 2, cutEnd + 14, ease.in);

  const rattle = frame >= cutEnd + 6 && frame < openAt - 6 ? (Math.floor(frame / 2.5) % 2 ? 1 : -1) * 2.4 : 0;
  const stepsO = Math.floor((frame - openAt) / 2.5);
  const LID = [0, -34, -88, -126, -112];
  const lidAng = frame < openAt ? 0 : stepsO >= 4 ? -114 + Math.sin((frame - openAt) * 0.25) * 0 : LID[stepsO + 1];
  const opened = frame >= openAt;
  const lidShake = frame >= openAt && frame < openAt + 5 ? 3 : 0;
  const jb = boil(frame, 5, 1.1);

  // ---- spill items
  const items = REST.map((rest, i) => {
    const t0 = openAt + 5 + i * 8;
    if (frame < t0) return null;
    const p = ease.out(clamp((sf - t0) / 12));
    const x = (0 + (rest.x - 0) * p) * 1;
    const y = -170 + (rest.y + 170) * p - Math.sin(Math.PI * p) * 70;
    const s = slap(frame, t0 + 11);
    const sc = (frame < t0 + 11 ? 0.55 + 0.45 * p : s.scale) * rest.s;
    const b = boil(frame, 20 + i, 1.4);
    const bob = Math.sin(frame / 14 + i * 1.7) * 4;
    const rot = rest.r * p + (i === 4 ? Math.sin(frame / 9) * 8 : 0);
    return (
      <g key={i} transform={`translate(${x + b.x} ${y + b.y + (p >= 1 ? bob : 0)}) rotate(${rot}) scale(${sc})`} filter="url(#cp-cut)">
        <Item kind={i} sf={sf} red={red} ink={ink} paper={paper} src={spillSrcs[i]} />
      </g>
    );
  });

  // ---- confetti
  const conf = React.useMemo(() => {
    const r = rng(seed * 53 + 9);
    return Array.from({length: 34}, (_, i) => ({a: -Math.PI / 2 + (r() - 0.5) * 2.4, v: 5 + r() * 9, w: 10 + r() * 16, h: 8 + r() * 12, rot: r() * 360, vr: (r() - 0.5) * 30, c: i % 4}));
  }, [seed]);
  const confT = Math.max(0, (sf - openAt - 1) / 1);
  const confCols = [paper, red, ink, '#EFE8D8'];

  // ---- speech scrap
  const spS = slap(frame, talkAt + 3);
  const spOut = prog(frame, talkAt + 36, talkAt + 42, ease.in);
  const bangTiles = bang.toUpperCase().split('');
  const captionS = slap(frame, endTalkAt - 6);

  // ---- front-of-scene pieces
  const dust = (s: {dust: number}) => s.dust;
  void dust;
  const newsA = slap(frame, 14);
  const newsB = slap(frame, 20);

  const headG = (
    <g transform={`translate(${jb.x} ${jb.y}) translate(${lidShake ? (frame % 2 ? 3 : -3) : 0} 0)`}>
      {/* cavity (torn wedge of space) under the lid */}
      <g clipPath="url(#cp-sil)">
        <g clipPath="url(#cp-cavity)" opacity={opened ? 1 : 0}>
          {revealSrc ? <image href={resolveSrc(revealSrc)} x={-190} y={-290} width={380} height={210} preserveAspectRatio="xMidYMid slice" /> : <Nebula seed={seed} frame={frame} />}
        </g>
      </g>
      {/* mouth interior */}
      <g clipPath="url(#cp-sil)">
        <rect x={-90} y={JAW_Y - 22} width={180} height={pose.dy + 34} fill="#2a0d12" />
        <rect x={-62} y={JAW_Y - 22} width={124} height={12} fill="#F4EFE4" opacity={pose.dy > 0 ? 1 : 0} />
      </g>
      <g filter="url(#cp-cut)">
        {/* middle piece */}
        <g clipPath="url(#cp-mid)">
          <use href="#cp-piece" />
        </g>
        {/* jaw */}
        <g transform={`translate(0 ${pose.dy}) rotate(${pose.rot} ${JAW_HINGE[0]} ${JAW_HINGE[1]})`}>
          <g clipPath="url(#cp-jaw)">
            <use href="#cp-piece" />
          </g>
        </g>
        {/* lid */}
        <g transform={`translate(${rattle} 0) rotate(${lidAng} ${HINGE[0]} ${HINGE[1]})`}>
          <g clipPath="url(#cp-lid)">
            <use href="#cp-piece" />
          </g>
        </g>
      </g>
      {/* brass brad */}
      <g transform={`translate(${HINGE[0] + 6} ${HINGE[1] + 2})`} opacity={prog(frame, 14, 18, ease.out)}>
        <circle r={11} fill="#D6A945" stroke={ink} strokeWidth={3} />
        <circle r={4} fill="#f2d98a" />
      </g>
      {/* cut line + scissors */}
      {frame >= cutAt && frame < cutEnd + 24 && (
        <g>
          <line x1={-150} y1={CUT_Y} x2={-150 + 300 * lineP} y2={CUT_Y} stroke={ink} strokeWidth={3.2} strokeDasharray="10 7" />
          {frame >= cutStart && frame < cutEnd + 8 && <line x1={-148} y1={CUT_Y} x2={-148 + sPos} y2={CUT_Y} stroke="#2a0d12" strokeWidth={4} opacity={0.85} />}
        </g>
      )}
      {scissorsOn && (
        <g transform={`translate(${-150 + sPos + scExit * 260} ${CUT_Y - scExit * 120}) rotate(${scExit * -30})`} opacity={prog(frame, cutStart - 6, cutStart - 2, ease.out)}>
          <Scissors open={openAmt} size={130} />
        </g>
      )}
    </g>
  );

  return (
    <AbsoluteFill style={{background}}>
      <PaperTexture opacity={0.55} seed={8} tint="#8a7350" scale={0.7} />
      <Svg>
        <defs>
          <pattern id="cp-ht" width={6.5} height={6.5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <circle cx={3.25} cy={3.25} r={1.7} fill={ink} />
          </pattern>
          <linearGradient id="cp-shg" x1="-150" y1="0" x2="150" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#000" />
            <stop offset="55%" stopColor="#222" />
            <stop offset="100%" stopColor="#fff" />
          </linearGradient>
          <mask id="cp-shade" maskUnits="userSpaceOnUse" x={-200} y={-300} width={400} height={600}>
            <rect x={-200} y={-300} width={400} height={600} fill="url(#cp-shg)" />
          </mask>
          <clipPath id="cp-sil">
            <path d={SIL} />
          </clipPath>
          <clipPath id="cp-lid">
            <polygon points={`-240,-320 240,-320 240,${CUT_Y} ${Array.from({length: 13}, (_, i) => `${240 - i * 40},${CUT_Y + (((i * 37 + seed * 11) % 5) - 2)}`).join(' ')}`} />
          </clipPath>
          <clipPath id="cp-cavity">
            <polygon points={`-240,-320 240,-320 240,${CUT_Y + 2} ${Array.from({length: 17}, (_, i) => `${240 - i * 30},${CUT_Y + 2 + (((i * 53 + seed * 7) % 9) - 3) * 1.6}`).join(' ')}`} />
          </clipPath>
          <clipPath id="cp-mid">
            <rect x={-240} y={CUT_Y} width={480} height={JAW_Y - CUT_Y} />
          </clipPath>
          <clipPath id="cp-jaw">
            <rect x={-240} y={JAW_Y} width={480} height={200} />
          </clipPath>
          <g id="cp-piece">
            <path d={SIL} fill={paper} stroke={paper} strokeWidth={10} strokeLinejoin="round" />
            <Head faceSrc={faceSrc} ink={ink} paper={paper} />
          </g>
          <filter id="cp-cut" x="-30%" y="-30%" width="160%" height="160%">
            <feMorphology in="SourceAlpha" operator="dilate" radius={3.5} result="d" />
            <feFlood floodColor={paper} result="pc" />
            <feComposite in="pc" in2="d" operator="in" result="rim" />
            <feOffset in="d" dx={3} dy={5} result="o" />
            <feGaussianBlur in="o" stdDeviation={3.5} result="sh" />
            <feFlood floodColor="#22140a" floodOpacity="0.4" />
            <feComposite in2="sh" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="rim" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="cp-shadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx={3} dy={6} stdDeviation={4} floodColor="#22140a" floodOpacity="0.38" />
          </filter>
        </defs>

        {/* page red disc + newsprint scraps */}
        <g transform={`translate(${hx} ${hy}) scale(${S})`}>
          {discSlap.alpha > 0 && (
            <g transform={`scale(${discSlap.scale})`}>
              <circle cx={30} cy={-20} r={330} fill={red} filter="url(#cp-shadow)" />
              <circle cx={30} cy={-20} r={330} fill="url(#cp-ht)" opacity={0.18} />
            </g>
          )}
          {newsA.alpha > 0 && (
            <g transform={`translate(-300 150) rotate(-9) scale(${newsA.scale})`} filter="url(#cp-shadow)">
              <polygon points={tornRect(-110, -70, 220, 140, seed + 1, 3.5, 22)} fill="#F2ECDF" />
              {[-48, -30, -12, 6, 24, 42].map((yy, i) => (
                <rect key={i} x={-92} y={yy} width={150 + ((i * 37) % 40) - (i === 0 ? 60 : 0)} height={i === 0 ? 14 : 5} fill={ink} opacity={i === 0 ? 0.85 : 0.35} />
              ))}
            </g>
          )}
          {newsB.alpha > 0 && (
            <g transform={`translate(285 175) rotate(7) scale(${newsB.scale})`} filter="url(#cp-shadow)">
              <polygon points={tornRect(-100, -60, 200, 120, seed + 2, 3.5, 22)} fill="#EFE8D8" />
              {[-38, -20, -2, 16, 34].map((yy, i) => (
                <rect key={i} x={-82} y={yy} width={130 + ((i * 53) % 40)} height={i === 0 ? 12 : 5} fill={ink} opacity={i === 0 ? 0.8 : 0.32} />
              ))}
            </g>
          )}

          {/* the puppet */}
          {headSlap.alpha > 0 && <g transform={`scale(${headSlap.scale})`}>{headG}</g>}

          {/* spill items */}
          {items}

          {/* confetti */}
          {opened && sf - openAt < 45 && (
            <g>
              {conf.map((c, i) => {
                const t = confT;
                const x = Math.cos(c.a) * c.v * t * 1.9;
                const y = -190 + Math.sin(c.a) * c.v * t * 1.9 + 0.5 * 0.55 * t * t;
                return <rect key={i} x={x - c.w / 2} y={y - c.h / 2} width={c.w} height={c.h} fill={confCols[c.c]} stroke={ink} strokeWidth={1.2} opacity={1 - clamp((t - 22) / 14)} transform={`rotate(${c.rot + c.vr * t * 0.5} ${x} ${y})`} />;
              })}
            </g>
          )}

          {/* ransom bang chips */}
          {bangTiles.map((ch, i) => {
            const s = slap(frame, openAt + 2 + i * 2.5);
            if (s.alpha === 0) return null;
            const n = bangTiles.length;
            const x = (i - (n - 1) / 2) * 52;
            const rr = rng(seed + i * 13);
            const cols = [[red, paper], [ink, paper], [paper, ink], ['#EFE8D8', ink]][i % 4];
            return (
              <g key={i} transform={`translate(${x} -340) rotate(${(rr() - 0.5) * 16}) scale(${s.scale})`} filter="url(#cp-shadow)">
                <polygon points={tornRect(-24, -28, 48, 56, seed + i, 2.5, 48)} fill={cols[0]} />
                <text x={0} y={19} textAnchor="middle" fontFamily={i % 2 ? fonts.display : fonts.serif} fontWeight={800} fontSize={44} fill={cols[1]}>
                  {ch}
                </text>
              </g>
            );
          })}

          {/* speech scrap */}
          {speech && spS.alpha > 0 && spOut < 1 && (
            <g transform={`translate(250 -20) rotate(7) scale(${spS.scale * (1 - spOut)})`} filter="url(#cp-shadow)">
              <polygon points={tornRect(-95, -42, 190, 84, seed + 55, 3, 20)} fill={paper} />
              <polygon points="-50,38 -78,84 -8,40" fill={paper} />
              <text x={0} y={19} textAnchor="middle" fontFamily={fonts.comic} fontSize={62} fill={ink}>
                {speech.toUpperCase()}
              </text>
            </g>
          )}

          {/* caption band */}
          {caption && captionS.alpha > 0 && (
            <g transform={`translate(0 335) rotate(-6) scale(${captionS.scale})`} filter="url(#cp-shadow)">
              <rect x={-w / S} y={-46} width={(2 * w) / S} height={92} fill={ink} />
              <text x={0} y={24} textAnchor="middle" fontFamily={fonts.display} fontSize={66} letterSpacing={4} fill={paper}>
                {caption.toUpperCase()}
              </text>
            </g>
          )}
        </g>
      </Svg>
      <FilmGrain opacity={0.26} every={3} />
      <Vignette strength={0.3} color="34,20,8" />
    </AbsoluteFill>
  );
};

const Nebula: React.FC<{seed: number; frame: number}> = ({seed, frame}) => {
  const stars = React.useMemo(() => {
    const r = rng(seed * 7 + 1);
    return Array.from({length: 46}, () => ({x: -190 + r() * 380, y: -290 + r() * 210, s: 0.8 + r() * 2.2, p: r() * 6}));
  }, [seed]);
  return (
    <g>
      <rect x={-200} y={-300} width={400} height={230} fill="#12072d" />
      <ellipse cx={-50} cy={-170} rx={150} ry={90} fill="#6d28d9" opacity={0.6} />
      <ellipse cx={60} cy={-130} rx={140} ry={70} fill="#1d4ed8" opacity={0.55} />
      <ellipse cx={20} cy={-210} rx={110} ry={60} fill="#db2777" opacity={0.45} />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={0.5 + 0.5 * Math.sin(frame / 5 + s.p)} />
      ))}
      <rect x={-200} y={-300} width={400} height={230} fill="url(#cp-ht)" opacity={0.12} />
    </g>
  );
};

export const collagePuppet = defineMotion<Props>({
  id: 'collage-puppet',
  title: 'Collage puppet',
  category: 'character',
  description: 'A cut-out engraving portrait split into scalp lid, face and jaw: the jaw flaps between three stepped poses to "talk", dashed cut lines and scissors snip across the forehead, then the scalp flips open on a brass brad to reveal a torn wedge of space from which a rocket, planet, bird, rose and butterfly spill out one per beat, with ransom-letter chips and paper confetti. Animated on twos at 12 fps on kraft paper.',
  source: ['mg-styles-15 demos/06-collage/index.html (MIT; drawHead, MOUTH, LIDF, SPILL) + work/prep.py'],
  useFor: 'Monty-Python style comedy beats, music and street-culture promos, "mind blown" explainers. Pass faceSrc / revealSrc / spillSrcs to use your own cut-outs.',
  durationInFrames: 240,
  defaultProps: {
    faceSrc: '',
    revealSrc: '',
    spillSrcs: [],
    talkAt: 26,
    cutAt: 66,
    openAt: 132,
    endTalkAt: 182,
    speech: 'Ahem',
    bang: 'BANG!',
    caption: 'Mind blown',
    seed: 3,
    background: '#B89A72',
    red: '#D2261C',
    ink: '#16130F',
    paper: '#F4EFE4',
  },
  propDocs: {
    faceSrc: 'optional cut-out portrait (public/ path, transparent PNG ~380x540); default is a drawn engraving-style head',
    revealSrc: 'optional image revealed under the lid (default: a nebula)',
    spillSrcs: 'up to 5 optional cut-outs that spill out (default: rocket, planet, bird, rose, butterfly)',
    talkAt: 'frame the jaw starts flapping (3 flaps)',
    cutAt: 'frame the dashed cut line appears; scissors snip 5 times after it',
    openAt: 'frame the lid pops open',
    endTalkAt: 'frame of the closing jaw flaps (and the caption band)',
    speech: 'speech scrap beside the mouth during the first talk (empty to hide)',
    bang: 'ransom-letter chips that pop when the lid opens',
    caption: 'diagonal black band text at the end (empty to hide)',
    seed: 'jitter / confetti seed',
    background: 'kraft table colour',
    red: 'page red',
    ink: 'ink colour',
    paper: 'paper-white scissor rim colour',
  },
  component: CollagePuppet,
  tags: ['collage', 'cut-out', 'puppet', 'paper', 'monty python', 'portrait', 'jaw', 'talking', 'scissors', 'mind blown', 'ransom', 'confetti', 'stop-motion', 'on twos', 'kraft', 'comedy', 'engraving', 'surreal'],
});
