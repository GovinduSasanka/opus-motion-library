import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {resolveSrc} from '../../core/asset';
import {fonts} from '../../core/fonts';
import {PaperTexture, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {HATCH3, mixHex, x14Fonts} from '../../core/r2-x14-kit';

/**
 * x3 opening: a closed cloth hardback lies on a felt desk mat (pale wood desk, fixed window-light gobo) seen from a
 * high 3/4 view. The front cover swings open round the spine (easeInOutCubic, passes vertical at ≈ 60 %), two leaves
 * turn over — each bending as it turns, the free edge lagging the spine — and the book settles open on a lesson
 * spread while the camera pushes in and levels out (elevation 50° → 62°). Afterwards the figure on the right page
 * draws itself in ink and the camera keeps a slow drift. Real CSS 3D (perspective + preserve-3d), so pages carry
 * live type.
 */

type Props = {
  coverColor: string;
  coverTitle: string;
  coverSubtitle: string;
  coverArt: string;
  lessonEyebrow: string;
  lessonTitle: string;
  lessonBody: string;
  equation: string;
  figureCaption: string;
  figureSrc: string;
  contents: string[];
  turns: number;
  openAt: number;
  speed: number;
  matColor: string;
  deskColor: string;
  paper: string;
  ink: string;
  ribbon: boolean;
};

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// ------------------------------------------------------------------------------------------------
// page contents (HTML, sized BW x BH in px)
// ------------------------------------------------------------------------------------------------
type PageKind = 'endpaper' | 'title' | 'contents' | 'preface' | 'lessonL' | 'lessonR' | 'blank';
type PageCtx = Props & {BW: number; BH: number; u: number; frame: number; drawAt: number};

const STORE_COLORS = [HATCH3.purple, HATCH3.blue, HATCH3.orange, HATCH3.pink, HATCH3.green, HATCH3.red, HATCH3.yellow, HATCH3.teal];

const InkFigure: React.FC<{c: PageCtx; w: number; h: number}> = ({c, w, h}) => {
  // a flat ink drawing of a jar rack (what later pops up), drawn on with pathLength
  const d = clamp((c.frame - c.drawAt) / 40);
  const dash = {pathLength: 1, strokeDasharray: `${easeOutCubic(d)} 1`};
  const jars = Array.from({length: 4}, (_, i) => 0.17 + i * 0.2);
  const sw = Math.max(1, 1.7 * c.u);
  return (
    <svg width={w} height={h} viewBox="0 0 100 70" preserveAspectRatio="none" style={{display: 'block'}}>
      <g fill="none" stroke={c.ink} strokeWidth={sw / (w / 100)} strokeLinejoin="round" strokeLinecap="round">
        {/* rack: two shelves + uprights */}
        <path d="M6,62 L94,62 L94,58 L6,58 Z M6,36 L94,36 L94,33 L6,33 Z M6,62 L6,8 M10,62 L10,8 M90,62 L90,8 M94,62 L94,8" {...dash} />
        {[0, 1].map((row) =>
          jars.map((jx, i) => {
            const x = jx * 100;
            const yb = row ? 58 : 33;
            const yt = yb - 20;
            return (
              <g key={`${row}${i}`}>
                <ellipse cx={x} cy={yt} rx={6.5} ry={2} {...dash} />
                <path d={`M${x - 6.5},${yt} L${x - 6.5},${yb} M${x + 6.5},${yt} L${x + 6.5},${yb}`} {...dash} />
                <path d={`M${x - 6.5},${yb} A6.5,2 0 0 0 ${x + 6.5},${yb}`} {...dash} />
                <rect x={x - 5.5} y={yb - 6} width={11} height={5} strokeWidth={sw / (w / 100) * 0.7} {...dash} />
              </g>
            );
          }),
        )}
      </g>
      <g opacity={0.0}>
        <rect width={100} height={70} />
      </g>
    </svg>
  );
};

const Page: React.FC<{kind: PageKind; c: PageCtx; side: 'L' | 'R'}> = ({kind, c, side}) => {
  const {BW, BH, u, ink, paper} = c;
  const pad = BW * 0.1;
  const serif = x14Fonts.bookSerif;
  const base: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: BW,
    height: BH,
    background: `linear-gradient(${side === 'R' ? 90 : 270}deg, ${mixHex(paper, '#8f8b85', 0.22)} 0%, ${paper} 9%, ${paper} 100%)`,
    color: ink,
    fontFamily: serif,
    overflow: 'hidden',
    boxSizing: 'border-box',
    padding: pad,
  };
  const fsB = BW * 0.034;
  const lines = (n: number, wid = 0.8, op = 0.28, gap = 1.9) =>
    Array.from({length: n}, (_, i) => <div key={i} style={{height: fsB * 0.42, width: `${(wid - ((i * 37) % 23) / 100) * 100}%`, background: ink, opacity: op, borderRadius: 2, marginBottom: fsB * (gap - 0.42)}} />);
  if (kind === 'endpaper')
    return (
      <div style={{...base, background: `radial-gradient(circle at 30% 30%, ${mixHex(paper, '#d8cbb0', 0.4)} 0 ${BW * 0.012}px, transparent ${BW * 0.013}px) 0 0 / ${BW * 0.08}px ${BW * 0.08}px, ${mixHex(paper, '#e6dcc6', 0.6)}`}} />
    );
  if (kind === 'blank') return <div style={base} />;
  if (kind === 'title')
    return (
      <div style={{...base, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start'}}>
        <div style={{fontSize: BW * 0.085, fontWeight: 600, lineHeight: 1.05}}>{c.coverTitle}</div>
        <div style={{fontSize: BW * 0.034, fontStyle: 'italic', opacity: 0.8, marginTop: BW * 0.02}}>{c.coverSubtitle}</div>
        <div style={{width: BW * 0.28, height: BW * 0.22, marginTop: BW * 0.06, border: `${1.2 * u}px solid ${ink}`, position: 'relative', background: '#fff8'}}>
          <div style={{position: 'absolute', left: '18%', bottom: '14%', width: '26%', height: '52%', border: `${1.2 * u}px solid ${ink}`, borderTop: 'none', background: `linear-gradient(0deg, ${HATCH3.purple} 0 60%, transparent 60%)`}} />
          <div style={{position: 'absolute', right: '16%', bottom: '14%', width: '28%', height: '24%', background: HATCH3.orange, border: `${1.2 * u}px solid ${ink}`}} />
        </div>
        <div style={{marginTop: 'auto', fontSize: fsB * 0.8, letterSpacing: '0.18em', textTransform: 'uppercase', color: HATCH3.eyebrow}}>First edition</div>
      </div>
    );
  if (kind === 'contents')
    return (
      <div style={base}>
        <div style={{fontSize: BW * 0.06, fontWeight: 600, marginBottom: BW * 0.05}}>Contents</div>
        {c.contents.map((t, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', fontSize: fsB * 1.05, marginBottom: fsB * 1.05}}>
            <div style={{width: fsB * 0.9, height: fsB * 0.9, background: STORE_COLORS[i % STORE_COLORS.length], marginRight: fsB * 0.8, border: `${u}px solid ${ink}`}} />
            <div style={{flex: 1}}>
              {i + 1}&nbsp;&nbsp;{t}
            </div>
            <div style={{opacity: 0.6}}>{4 + i * 6}</div>
          </div>
        ))}
      </div>
    );
  if (kind === 'preface')
    return (
      <div style={base}>
        <div style={{fontSize: fsB * 0.8, letterSpacing: '0.16em', textTransform: 'uppercase', color: HATCH3.eyebrow, marginBottom: fsB}}>How to use this book</div>
        <div style={{fontSize: BW * 0.05, fontStyle: 'italic', fontWeight: 600, marginBottom: fsB * 1.2}}>Look, guess, then check</div>
        {lines(14)}
      </div>
    );
  if (kind === 'lessonL')
    return (
      <div style={base}>
        <div style={{fontSize: fsB * 0.75, letterSpacing: '0.16em', textTransform: 'uppercase', color: HATCH3.eyebrow, marginBottom: fsB * 0.6}}>{c.lessonEyebrow}</div>
        <div style={{fontSize: BW * 0.066, fontStyle: 'italic', fontWeight: 600, lineHeight: 1.05, marginBottom: fsB * 0.9}}>{c.lessonTitle}</div>
        <div style={{fontSize: fsB, lineHeight: 1.45, marginBottom: fsB}}>{c.lessonBody}</div>
        <div style={{fontSize: fsB * 1.6, fontStyle: 'italic', padding: `${fsB * 0.5}px ${fsB}px`, border: `${u}px solid ${mixHex(ink, paper, 0.7)}`, display: 'inline-block', marginBottom: fsB}}>{c.equation}</div>
        {lines(5, 0.85, 0.22)}
        <div style={{marginTop: fsB * 0.6, padding: fsB * 0.8, background: '#efe6d2', border: `${u}px solid ${mixHex(ink, paper, 0.6)}`, transform: 'rotate(-1deg)'}}>
          <div style={{fontSize: fsB * 0.7, letterSpacing: '0.14em', color: HATCH3.eyebrow, textTransform: 'uppercase'}}>Why?</div>
          <div style={{fontSize: fsB * 1.15, fontWeight: 600}}>Lift the flap after you guess</div>
          <div style={{fontFamily: fonts.hand, fontSize: fsB * 1.1, textAlign: 'right', opacity: 0.8}}>lift here ↘</div>
        </div>
      </div>
    );
  // lessonR: the figure page
  return (
    <div style={{...base, display: 'flex', flexDirection: 'column'}}>
      <div style={{fontSize: fsB * 0.6, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.45, textAlign: 'right', marginBottom: fsB}}>{c.lessonTitle}</div>
      <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {c.figureSrc ? (
          <Img src={resolveSrc(c.figureSrc)} style={{width: '100%', height: '80%', objectFit: 'contain'}} />
        ) : (
          <InkFigure c={c} w={BW - pad * 2} h={(BW - pad * 2) * 0.72} />
        )}
      </div>
      <div style={{fontSize: fsB * 0.85, fontStyle: 'italic', opacity: 0.85}}>{c.figureCaption}</div>
      <div style={{fontSize: fsB * 0.7, textAlign: 'right', opacity: 0.5, marginTop: fsB}}>5</div>
    </div>
  );
};

/** cover front: cloth with a foil border, debossed title and an inset picture */
const CoverFront: React.FC<{c: PageCtx; W: number; H: number}> = ({c, W, H}) => {
  const {u} = c;
  const cloth = c.coverColor;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: W,
        height: H,
        background: `repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 ${1.2 * u}px, rgba(0,0,0,0.035) ${1.2 * u}px ${2.6 * u}px), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 ${1.4 * u}px, rgba(0,0,0,0.03) ${1.4 * u}px ${2.8 * u}px), linear-gradient(135deg, ${mixHex(cloth, '#fff', 0.08)}, ${cloth} 55%, ${mixHex(cloth, '#000', 0.08)})`,
        boxShadow: `inset ${4 * u}px 0 ${8 * u}px rgba(0,0,0,0.18)`,
        fontFamily: x14Fonts.bookSerif,
        overflow: 'hidden',
      }}
    >
      <div style={{position: 'absolute', inset: W * 0.05, border: `${1.4 * u}px solid ${HATCH3.foil}`, opacity: 0.8}} />
      <div style={{position: 'absolute', left: W * 0.1, top: H * 0.08, right: W * 0.1, textAlign: 'center', color: HATCH3.foil, textShadow: `0 ${u}px 0 rgba(255,255,255,0.25), 0 ${-u}px 0 rgba(0,0,0,0.25)`}}>
        <div style={{fontSize: W * 0.1, fontWeight: 600, lineHeight: 1.0}}>{c.coverTitle}</div>
        <div style={{fontSize: W * 0.036, fontStyle: 'italic', marginTop: W * 0.02}}>{c.coverSubtitle}</div>
      </div>
      <div style={{position: 'absolute', left: W * 0.27, top: H * 0.38, width: W * 0.46, height: W * 0.46, background: '#F4EEDF', boxShadow: `inset 0 0 ${3 * u}px rgba(0,0,0,0.3)`, overflow: 'hidden'}}>
        {c.coverArt ? (
          <Img src={resolveSrc(c.coverArt)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        ) : (
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <g fill="none" stroke={c.ink} strokeWidth={1.4}>
              <path d="M18,78 L82,78 M22,78 L22,40 M78,78 L78,40" />
              <ellipse cx={40} cy={42} rx={11} ry={3.5} />
              <path d="M29,42 L29,76 A11,3.5 0 0 0 51,76 L51,42" fill={HATCH3.purple} fillOpacity={0.0} />
              <path d="M30,56 L30,76 A10,3 0 0 0 50,76 L50,56 Z" fill={HATCH3.purple} stroke="none" />
              <path d="M29,42 L29,76 A11,3.5 0 0 0 51,76 L51,42" />
              <rect x={57} y={60} width={16} height={16} fill={HATCH3.orange} />
              <rect x={57} y={60} width={16} height={16} />
              <path d="M62,52 L66,46 M70,54 L76,50" stroke={HATCH3.blue} strokeWidth={2} />
            </g>
          </svg>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------------------------
const BookOpen3D: React.FC<Props> = (props) => {
  const {coverColor, turns, openAt, speed, matColor, deskColor, paper, ink, ribbon} = props;
  const frame0 = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames} = useStage();
  const sp = Math.max(0.2, speed);
  const frame = openAt + (frame0 - openAt) * (frame0 > openAt ? sp : 1);

  // book dims (world px)
  const BW = 520 * u;
  const BH = 660 * u;
  const T = 30 * u; // page block thickness
  const C = 5 * u; // board thickness
  const O = 10 * u; // board overhang
  const nT = Math.max(0, Math.min(2, Math.round(turns)));

  // ---- timeline (30 fps; source 0.40-0.75 s cover, 0.65-1.0 / 0.9-1.25 s leaves, push 0.4-1.6 s) ----
  const cov = easeInOutCubic(clamp((frame - openAt) / 11));
  const leafP = Array.from({length: nT}, (_, k) => easeInOutCubic(clamp((frame - (openAt + 8 + k * 7)) / 10)));
  const turned = leafP.filter((p) => p >= 1).length;
  const camT = easeOutCubic(clamp((frame - openAt) / 36));
  const drift = clamp((frame - (openAt + 36)) / Math.max(1, durationInFrames - openAt - 36));
  const drawAt = openAt + 24;

  // ---- camera ----
  const elev = lerp(50, 62, camT);
  const tilt = 90 - elev;
  const yaw = lerp(-24, -3, camT) + 3 * ease.sine(drift);
  const spreadW = 2 * (BW + O);
  const closedFit = Math.min((w * 0.5) / (BW + O), (h * 0.62) / (BH + 2 * O));
  const openFit = portrait ? Math.min((w * 0.78) / (1.12 * BW + O), (h * 0.62) / (BH + 2 * O)) : Math.min((w * 0.95) / spreadW, (h * 0.86) / (BH + 2 * O));
  const zoom = lerp(closedFit, openFit, camT) * (1 + 0.06 * ease.sine(drift));
  const fx = portrait ? lerp(BW * 0.5, (0.88 * BW + O) / 2, camT) : lerp(BW * 0.5, 0, camT);
  const fy = lerp(BH * 0.06, BH * 0.03, camT) - 0.02 * BH * drift;

  const ctx: PageCtx = {...props, BW, BH, u, frame, drawAt};
  const pres: React.CSSProperties = {position: 'absolute', transformStyle: 'preserve-3d'};
  const DESK = 5200 * u;
  const GOBO = `linear-gradient(118deg, rgba(255,250,236,0.0) 0%, rgba(255,250,236,0.0) 38%, rgba(255,248,230,0.32) 44%, rgba(255,248,230,0.28) 52%, rgba(40,30,20,0.0) 53%, rgba(40,30,20,0.0) 54.5%, rgba(255,248,230,0.26) 55.5%, rgba(255,248,230,0.22) 63%, rgba(20,15,10,0.0) 66%), linear-gradient(118deg, rgba(30,22,15,0.0) 0%, rgba(30,22,15,0.0) 64%, rgba(30,22,15,0.28) 70%, rgba(30,22,15,0.32) 100%)`;
  // gobo overlay aligned to world coords for a flat surface whose top-left is at (x0, y0)
  const gobo = (x0: number, y0: number, W: number, H: number, z: number, key: string) => (
    <div
      key={key}
      style={{
        position: 'absolute',
        left: x0,
        top: y0,
        width: W,
        height: H,
        transform: `translateZ(${z}px)`,
        backgroundImage: GOBO,
        backgroundSize: `${DESK}px ${DESK}px`,
        backgroundPosition: `${-(x0 + DESK / 2)}px ${-(y0 + DESK / 2)}px`,
        pointerEvents: 'none',
      }}
    />
  );
  const flat = (x0: number, y0: number, W: number, H: number, z: number, style: React.CSSProperties, key: string, children?: React.ReactNode) => (
    <div key={key} style={{position: 'absolute', left: x0, top: y0, width: W, height: H, transform: `translateZ(${z}px)`, ...style}}>
      {children}
    </div>
  );

  // heights
  const zR = C + T; // top of the right block
  const zL = C + 1 * u; // left stack top when landed

  // a turning sheet (cover or leaf) built from bent strips
  const Sheet = (key: string, theta: number, zStart: number, zLand: number, W: number, H: number, y0: number, front: React.ReactNode, back: React.ReactNode, NS: number, bend: number, backFrontOffset = 0) => {
    const zh = (zStart + zLand) / 2;
    const sw = W / NS;
    const lag = bend * Math.sin((Math.PI * theta) / 180);
    const ang = (k: number) => theta - lag * Math.pow(k / NS, 1.2);
    const strip = (k: number): React.ReactNode => {
      if (k >= NS) return null;
      const rel = k === 0 ? ang(0) : ang(k) - ang(k - 1);
      const shadeF = 0.22 * Math.sin((Math.PI * ang(k)) / 180);
      return (
        <div key={k} style={{...pres, left: k === 0 ? 0 : sw, top: 0, width: sw, height: H, transformOrigin: '0 50% 0', transform: `rotateY(${-rel}deg)`}}>
          <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: -k * sw, top: 0, width: W, height: H}}>{front}</div>
            <div style={{position: 'absolute', inset: 0, background: '#000', opacity: shadeF}} />
          </div>
          <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', overflow: 'hidden', transform: 'rotateY(180deg)'}}>
            <div style={{position: 'absolute', left: -(W - (k + 1) * sw) - backFrontOffset, top: 0, width: W, height: H}}>{back}</div>
            <div style={{position: 'absolute', inset: 0, background: '#000', opacity: 0.18 * Math.max(0, Math.cos((Math.PI * ang(k)) / 180)) + 0.05}} />
          </div>
          {strip(k + 1)}
        </div>
      );
    };
    return (
      <div key={key} style={{...pres, left: 0, top: y0, width: 0, height: H, transform: `translateZ(${zh}px)`}}>
        <div style={{...pres, left: 0, top: 0, width: W, height: H, transform: `translateZ(${zStart - zh}px)`}}>{strip(0)}</div>
      </div>
    );
  };

  // ---- which flat pages are showing ----
  const rightKinds: PageKind[] = nT === 0 ? ['lessonR'] : nT === 1 ? ['contents', 'lessonR'] : ['contents', 'preface', 'lessonR'];
  // backs of leaves: leaf0 back = title (or lessonL if only 1 turn), leaf1 back = lessonL
  const leafFront = (k: number): PageKind => rightKinds[k];
  const leafBack = (k: number): PageKind => (nT === 1 ? 'lessonL' : k === 0 ? 'title' : 'lessonL');
  const started = leafP.filter((p) => p > 0).length;
  const rightNow: PageKind = rightKinds[Math.min(started, rightKinds.length - 1)];
  const leftNow: PageKind | 'endpaper' = turned === 0 ? (nT === 0 ? 'lessonL' : 'endpaper') : leafBack(turned - 1);
  const coverOpen = cov >= 1;
  const coverClosed = cov <= 0;

  const pageEdge = `repeating-linear-gradient(0deg, ${mixHex(HATCH3.paper, '#c9b98f', 0.25)} 0 ${0.9 * u}px, ${mixHex(HATCH3.paper, '#8a7a55', 0.25)} ${0.9 * u}px ${1.8 * u}px)`;
  const clothSide = mixHex(coverColor, '#000', 0.12);

  // cast shadow of the lifting cover onto the right page (light from upper-left window -> falls right)
  const covSin = Math.sin(Math.PI * cov);
  const shadowW = BW * clamp(0.15 + 0.85 * Math.cos((Math.PI * cov) / 1) * 0 + (cov < 0.5 ? 1 - cov * 2 : 0) * 0.9 + 0.2 * covSin);

  return (
    <AbsoluteFill style={{background: deskColor, overflow: 'hidden', perspective: `${2600 * u}px`, perspectiveOrigin: '50% 40%'}}>
      <div style={{...pres, left: w / 2, top: h * (portrait ? 0.5 : 0.52), width: 0, height: 0, transform: `scale3d(${zoom},${zoom},${zoom}) rotateX(${tilt}deg) rotateZ(${yaw}deg) translate3d(${-fx}px, ${-fy}px, 0px)`}}>
        {/* desk */}
        {flat(-DESK / 2, -DESK / 2, DESK, DESK, 0, {
          background: `repeating-linear-gradient(90deg, rgba(255,255,255,0.0) 0 ${18 * u}px, rgba(120,100,80,0.06) ${18 * u}px ${19 * u}px, rgba(255,255,255,0.03) ${19 * u}px ${44 * u}px, rgba(100,80,60,0.05) ${44 * u}px ${46 * u}px), linear-gradient(90deg, ${deskColor}, ${mixHex(deskColor, '#fff', 0.1)} 40%, ${deskColor})`,
        }, 'desk')}
        {/* felt mat */}
        {flat(-1350 * u, -520 * u, 2700 * u, 1300 * u, 0.5 * u, {
          background: `radial-gradient(ellipse at 40% 40%, ${mixHex(matColor, '#fff', 0.06)}, ${matColor} 60%, ${mixHex(matColor, '#000', 0.1)})`,
          borderRadius: 14 * u,
          boxShadow: `0 ${3 * u}px ${6 * u}px rgba(0,0,0,0.18)`,
        }, 'mat')}
        {gobo(-DESK / 2, -DESK / 2, DESK, DESK, 1 * u, 'gdesk')}
        {/* book contact shadow */}
        {flat(-(BW + O) * clamp((cov - 0.5) * 2), -BH / 2 - O, BW + O + (BW + O) * clamp((cov - 0.5) * 2), BH + 2 * O, 1.5 * u, {
          background: 'rgba(30,25,18,0.5)',
          filter: `blur(${18 * u}px)`,
          transform: `translateZ(${1.5 * u}px) translate(${26 * u}px, ${30 * u}px)`,
        }, 'bshadow')}
        {/* ribbon on the desk */}
        {ribbon ? flat(BW * 0.18, BH / 2 - 10 * u, 16 * u, 120 * u, 2 * u, {background: `linear-gradient(90deg, ${HATCH3.ribbon}, ${mixHex(HATCH3.ribbon, '#fff', 0.15)}, ${HATCH3.ribbon})`, transform: `translateZ(${2 * u}px) rotateZ(-14deg)`, transformOrigin: '50% 0', borderRadius: `0 0 ${2 * u}px ${2 * u}px`}, 'ribbon') : null}

        {/* back board under the right block */}
        {flat(0, -BH / 2 - O, BW + O, BH + 2 * O, 2 * u, {background: coverColor, boxShadow: `inset 0 0 ${6 * u}px rgba(0,0,0,0.15)`}, 'board')}
        {/* board front edge */}
        <div style={{position: 'absolute', left: 0, top: BH / 2 + O, width: BW + O, height: C, background: clothSide, transformOrigin: '50% 0', transform: `translateZ(${C}px) rotateX(-90deg)`}} />
        <div style={{position: 'absolute', left: BW + O, top: -BH / 2 - O, width: C, height: BH + 2 * O, background: mixHex(clothSide, '#000', 0.1), transformOrigin: '0 50%', transform: `translateZ(${C}px) rotateY(90deg)`}} />
        {/* right page block: sides */}
        <div style={{position: 'absolute', left: 0, top: BH / 2, width: BW, height: T, background: pageEdge, transformOrigin: '50% 0', transform: `translateZ(${zR}px) rotateX(-90deg)`}} />
        <div style={{position: 'absolute', left: BW, top: -BH / 2, width: T, height: BH, background: pageEdge.replace('0deg', '90deg'), filter: 'brightness(0.9)', transformOrigin: '0 50%', transform: `translateZ(${zR}px) rotateY(90deg)`}} />
        {/* right page top */}
        {flat(0, -BH / 2, BW, BH, zR, {overflow: 'hidden'}, 'rtop', <Page kind={rightNow} c={ctx} side="R" />)}
        {gobo(0, -BH / 2, BW, BH, zR + 0.4 * u, 'grtop')}
        {/* shadow of the lifting cover on the right page */}
        {cov > 0 && cov < 1
          ? flat(0, -BH / 2, BW, BH, zR + 0.6 * u, {background: `linear-gradient(90deg, rgba(20,15,10,${0.35 * covSin}) 0%, rgba(20,15,10,${0.12 * covSin}) ${clamp(shadowW / BW) * 100}%, rgba(20,15,10,0) ${clamp(shadowW / BW + 0.15) * 100}%)`}, 'cshadow')
          : null}
        {/* spine gutter shading on the open spread */}
        {coverOpen ? flat(-60 * u, -BH / 2, 120 * u, BH, zR + 0.8 * u, {background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(40,30,20,0.16) 45%, rgba(40,30,20,0.28) 50%, rgba(40,30,20,0.1) 56%, rgba(0,0,0,0) 100%)'}, 'gutter') : null}

        {/* left side once the cover has landed: board + stack + page */}
        {cov > 0.6 ? (
          <>
            {flat(-BW - O, -BH / 2 - O, BW + O, BH + 2 * O, 1.6 * u, {background: coverColor, boxShadow: `inset 0 0 ${6 * u}px rgba(0,0,0,0.15)`, opacity: clamp((cov - 0.6) / 0.3)}, 'lboard')}
            <div style={{position: 'absolute', left: -BW - O, top: BH / 2 + O, width: BW + O, height: C, background: clothSide, opacity: clamp((cov - 0.6) / 0.3), transformOrigin: '50% 0', transform: `translateZ(${C}px) rotateX(-90deg)`}} />
            {/* left stack rises to meet the right block so the spread reads as mid-book */}
            <div style={{position: 'absolute', left: -BW, top: BH / 2, width: BW, height: zR - zL, background: pageEdge, opacity: clamp((cov - 0.7) / 0.3), transformOrigin: '50% 0', transform: `translateZ(${zR}px) rotateX(-90deg)`}} />
          </>
        ) : null}
        {coverOpen ? (
          <>
            {flat(-BW, -BH / 2, BW, BH, zR, {overflow: 'hidden'}, 'ltop', <Page kind={leftNow as PageKind} c={ctx} side="L" />)}
            {gobo(-BW, -BH / 2, BW, BH, zR + 0.4 * u, 'gltop')}
          </>
        ) : null}

        {/* turning leaves */}
        {leafP.map((p, k) =>
          p > 0 && p < 1 ? Sheet(`leaf${k}`, 180 * p, zR + 0.5 * u, zR + 0.5 * u, BW, BH, -BH / 2, <Page kind={leafFront(k)} c={ctx} side="R" />, <Page kind={leafBack(k)} c={ctx} side="L" />, 8, 15) : null,
        )}
        {/* the front cover: closed, or swinging round the spine */}
        {coverClosed ? (
          <>
            {flat(0, -BH / 2 - O, BW + O, BH + 2 * O, zR + C, {overflow: 'hidden'}, 'cover', <CoverFront c={ctx} W={BW + O} H={BH + 2 * O} />)}
            <div style={{position: 'absolute', left: 0, top: BH / 2 + O, width: BW + O, height: C, background: clothSide, transformOrigin: '50% 0', transform: `translateZ(${zR + C}px) rotateX(-90deg)`}} />
            <div style={{position: 'absolute', left: BW + O, top: -BH / 2 - O, width: C, height: BH + 2 * O, background: mixHex(clothSide, '#000', 0.1), transformOrigin: '0 50%', transform: `translateZ(${zR + C}px) rotateY(90deg)`}} />
            {gobo(0, -BH / 2 - O, BW + O, BH + 2 * O, zR + C + 0.4 * u, 'gcover')}
          </>
        ) : !coverOpen ? (
          Sheet('coverS', 180 * cov, zR + C, zR + 0.2 * u, BW + O, BH + 2 * O, -BH / 2 - O, <CoverFront c={ctx} W={BW + O} H={BH + 2 * O} />, <Page kind="endpaper" c={{...ctx, BW: BW + O, BH: BH + 2 * O}} side="L" />, 1, 0)
        ) : null}
      </div>
      {/* screen-space finish: warm vignette + paper tooth */}
      <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at 45% 45%, rgba(0,0,0,0) 55%, rgba(40,30,20,0.22) 100%)'}} />
      <PaperTexture opacity={0.12} seed={7} />
    </AbsoluteFill>
  );
};

export const bookOpen3d = defineMotion<Props>({
  id: 'book-open-3d',
  title: 'Book open 3D',
  category: '3d',
  description:
    'A closed cloth hardback on a felt desk mat swings its cover open round the spine, two leaves turn over with a bend, and the camera pushes in and levels out onto a lesson spread whose figure then draws itself in ink.',
  source: ['video x3 0.30-1.60 s (cover open, page turns, camera push)'],
  useFor: 'Textbook, storybook or "chapter 1" openers; education products; any brand story told as a book.',
  durationInFrames: 150,
  defaultProps: {
    coverColor: HATCH3.cloth,
    coverTitle: 'Small Physics',
    coverSubtitle: 'a pocket book about energy',
    coverArt: '',
    lessonEyebrow: 'Lesson 1',
    lessonTitle: 'Energy stores',
    lessonBody: 'Energy is never made or lost. It sits in stores and moves between them whenever something happens: a fall, a push, a spark.',
    equation: 'E = m g h',
    figureCaption: 'Fig. 1  Eight things, each with a store of its own.',
    figureSrc: '',
    contents: ['Energy stores', 'Moving energy', 'Heat and light', 'Springs', 'Batteries', 'Forces'],
    turns: 2,
    openAt: 12,
    speed: 1,
    matColor: HATCH3.mat,
    deskColor: HATCH3.desk,
    paper: HATCH3.paper,
    ink: HATCH3.ink,
    ribbon: true,
  },
  propDocs: {
    coverColor: 'cloth cover colour',
    coverTitle: 'title on the cover and the title page',
    coverSubtitle: 'italic subtitle under the title',
    coverArt: 'optional image for the cover inset (public/ path or URL); procedural ink jar drawing if empty',
    lessonEyebrow: 'small caps eyebrow on the left page',
    lessonTitle: 'heading of the lesson spread',
    lessonBody: 'body paragraph on the left page',
    equation: 'boxed italic equation on the left page ("" hides)',
    figureCaption: 'italic caption under the right-page figure',
    figureSrc: 'optional image for the right-page figure; procedural ink rack drawing (drawn on) if empty',
    contents: 'chapter titles on the contents leaf',
    turns: 'leaves that turn after the cover (0-2)',
    openAt: 'frame the cover starts to open (source 0.40 s)',
    speed: 'timing multiplier for everything after openAt (1 = source)',
    matColor: 'felt desk mat colour',
    deskColor: 'wooden desk colour',
    paper: 'page paper colour',
    ink: 'page ink colour',
    ribbon: 'show the bookmark ribbon',
  },
  component: BookOpen3D,
  tags: ['book', 'open', 'cover', 'page turn', 'hardback', '3d', 'css 3d', 'desk', 'textbook', 'storybook', 'chapter', 'education', 'opener', 'camera push', 'ink-hatch-3d', 'pop-up book', 'gobo'],
});
