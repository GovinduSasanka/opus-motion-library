// Adapted from mg-styles-15/demos/05-cel-boil/js/scene.js drawDesk / drawThumb / RIFFLE / pullScale
// (MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {fonts} from '../../core/fonts';
import {
  CEL,
  CelPaper,
  FlameSpirit,
  FlameState,
  IP,
  InkBox,
  LightPool,
  P2,
  Twinkle,
  clamp01,
  dens,
  fillShape,
  hs,
  inkLoop,
  inkStroke,
  inv,
  mg1Fonts,
  mixHex,
  polyD,
  spline,
  springT,
} from '../../core/r2-mg1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  title: string;
  subtitle: string;
  tagline: string;
  countLabel: string;
  sceneLabel: string;
  src: string;
  paper: string;
  deskColor: string;
  plateColor: string;
  titleColor: string;
  ink: string;
  pencil: string;
  pegBar: boolean;
  riffleCount: number;
  showFlame: boolean;
  seed: number;
};

// the pull-back: 3 drawings on twos (100 -> 90 -> 86 -> 84 %)
const pullScale = (f: number) => (f < 40 ? 1 : f < 42 ? 0.9 : f < 44 ? 0.86 : 0.84);
const RIFFLE_AT = 92;

const FlipbookRiffleOutro: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const W = w / u;
  const H = h / u;
  const tall = H > W * 1.2;
  const cx = W / 2;
  const cy = H / 2;
  const id = frame < 40 ? Math.floor(frame / 2) : frame < 92 ? 20 + Math.floor((frame - 40) / 2) : frame < 100 ? 46 + (frame - 92) : 54 + Math.floor((frame - 100) / 3);
  const s = pullScale(frame);
  const nR = Math.max(2, Math.min(8, Math.round(p.riffleCount)));
  const riffleIdx = frame >= RIFFLE_AT && frame < RIFFLE_AT + nR ? frame - RIFFLE_AT : -1;
  const sheetKind = riffleIdx >= 0 ? riffleIdx : -1; // -1 = top sheet
  const countNum = parseInt(p.countLabel.replace(/\D/g, ''), 10) || 146;

  // ---------------------------------------------------------------------------- sheet contents
  const plateW = Math.min(W * (tall ? 0.86 : 0.62), 1180);
  const plateH = Math.min(H * 0.48, plateW * (tall ? 0.62 : 0.5));
  const plateY = cy - (tall ? 60 : 30);
  const titleSize = Math.min(plateH * 0.42, (plateW * 0.92) / Math.max(4, p.title.length * 0.62));
  const plate = () => {
    const pts: IP[] = [];
    const n = 120;
    const bumps = 16;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const b = Math.abs(Math.sin((a * bumps) / 2));
      const k = 1 + 0.07 * Math.sqrt(b);
      pts.push([cx + Math.cos(a) * (plateW / 2) * k, plateY + Math.sin(a) * (plateH / 2) * k]);
    }
    return spline(pts, true, 6);
  };
  const topSheet = (sd: number) => {
    const pl = plate();
    const flame: FlameState = {
      x: cx + plateW * 0.36,
      y: plateY - plateH * 0.36,
      H: 140,
      seed: sd + 3,
      face: frame >= 132 && frame < 141 ? {eyes: 'wink', mouth: 'grin', cheeks: true} : {eyes: 'open', mouth: 'smile', cheeks: true},
      arms: {L: {ang: -0.2, len: 0.42}, R: {ang: frame >= 120 ? 0.9 + 0.35 * Math.sin(Math.floor((frame - 120) / 3) * 1.6) : 0.9, len: 0.44}},
      drops: false,
    };
    return (
      <g>
        {p.src ? (
          <foreignObject x={cx - plateW / 2} y={plateY - plateH / 2} width={plateW} height={plateH}>
            <Img src={resolveSrc(p.src)} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 24}} />
          </foreignObject>
        ) : (
          <g>
            <path d={fillShape(pl, {seed: sd, amp: 2, dx: -6, dy: 5})} fill={p.plateColor} />
            {inkLoop(pl, {seed: sd + 1, w: 6, amp: 2, splits: 2}).map((d, i) => (
              <path key={i} d={d} fill={p.ink} />
            ))}
            <g fontFamily={mg1Fonts.rounded} fontWeight={700} textAnchor="middle">
              <text x={cx + 6} y={plateY + titleSize * 0.18 + 7} fontSize={titleSize} fill={p.ink}>
                {p.title}
              </text>
              <text x={cx} y={plateY + titleSize * 0.18} fontSize={titleSize} fill={p.titleColor} stroke={p.ink} strokeWidth={5} paintOrder="stroke" strokeLinejoin="round">
                {p.title}
              </text>
              <text x={cx} y={plateY + plateH * 0.34} fontSize={Math.min(64, titleSize * 0.42)} fill={CEL.hi} stroke={p.ink} strokeWidth={4} paintOrder="stroke" letterSpacing={3}>
                {p.subtitle}
              </text>
            </g>
          </g>
        )}
        <text x={cx} y={plateY + plateH / 2 + 110} textAnchor="middle" fontFamily={fonts.hand} fontWeight={700} fontSize={56} fill={p.ink} letterSpacing={4}>
          {p.tagline}
        </text>
        {[
          [-0.42, -0.42, 22],
          [0.5, 0.25, 28],
          [-0.45, 0.4, 18],
          [0.36, 0.55, 20],
        ].map(([dx, dy, r], i) => (
          <Twinkle key={i} x={cx + dx * plateW} y={plateY + dy * plateH} R={r * (0.85 + 0.25 * hs(sd, i))} seed={sd + 20 + i} />
        ))}
        {p.showFlame && <FlameSpirit s={flame} />}
      </g>
    );
  };
  // earlier drawings flashed by the riffle
  const oldSheet = (k: number, sd: number) => {
    const GY = cy + 150;
    const bw = Math.min(700, W * 0.6);
    const kinds = ['tada', 'hop', 'pancake', 'sketch', 'sleepy', 'box', 'spark', 'blank'];
    const kind = kinds[k % kinds.length];
    const base: FlameState = {x: cx, y: GY, H: 240, seed: sd};
    const st: FlameState =
      kind === 'tada'
        ? {...base, face: {eyes: 'happy', mouth: 'grin', cheeks: true}, arms: {L: {ang: 1.1, big: 1.15}, R: {ang: 1.1, big: 1.15}}}
        : kind === 'hop'
          ? {...base, x: cx - 120, y: GY - 150, sy: 1.15, sx: 0.92, r: -0.15, face: {eyes: 'open', mouth: 'o'}, arms: {L: {ang: 0.9}, R: {ang: 0.9}}}
          : kind === 'pancake'
            ? {...base, sy: 0.5, sx: 1.55, face: {eyes: 'squeeze', mouth: 'flat'}}
            : kind === 'sleepy'
              ? {...base, H: 120, face: {eyes: 'sleepy', mouth: 'flat'}}
              : {...base, H: 40, face: null};
    if (kind === 'sketch') {
      // blue col-erase construction sketch
      const blue = '#6F8FC9';
      return (
        <g opacity={0.9}>
          {[0, 1, 2].map((i) => (
            <path key={i} d={inkStroke(spline([[cx - 120, GY], [cx - 130, GY - 140], [cx - 20 + i * 8, GY - 260], [cx + 40, GY - 150], [cx + 120, GY - 60], [cx + 90, GY]], false, 6), {seed: sd + i, w: 2.4, amp: 3, dense: true, heavy: 0})} fill={blue} opacity={0.6} />
          ))}
          <ellipse cx={cx} cy={GY - 90} rx={110} ry={90} fill="none" stroke={blue} strokeWidth={2} opacity={0.5} />
          <path d={inkStroke([[cx - bw / 2, GY + 20], [cx + bw / 2, GY + 20]], {seed: sd + 9, w: 2.5, heavy: 0})} fill={blue} />
        </g>
      );
    }
    if (kind === 'blank') return null;
    return (
      <g>
        <LightPool x={cx} y={GY - 130} r={300} seed={sd} />
        {kind !== 'spark' && <InkBox x={cx - bw / 2} y={GY + 18} w={bw} h={170} depth={60} seed={sd + 4} />}
        {kind === 'spark' ? <Twinkle x={cx} y={GY - 120} R={90} seed={sd} /> : <FlameSpirit s={st} />}
      </g>
    );
  };

  // ---------------------------------------------------------------------------- pencil circle around the count
  const cntX = cx + W * 0.3;
  const cntY = cy + H * (tall ? 0.36 : 0.33);
  const circP = clamp01(inv(50, 64, frame));
  const writeP = clamp01(inv(60, 72, frame));
  const circle: IP[] = Array.from({length: 18}, (_, i): IP => {
    const a = -2.6 + (i / 17) * Math.PI * 2.15;
    return [cntX + Math.cos(a) * 175 * (1 + 0.03 * Math.sin(i)), cntY - 14 + Math.sin(a) * 62];
  });

  // ---------------------------------------------------------------------------- corner flap + thumb
  const flapT = frame < 78 ? 0 : frame < 90 ? E3(inv(78, 90, frame)) : frame < RIFFLE_AT + nR ? 1 : frame < RIFFLE_AT + nR + 8 ? 1 - E3(inv(RIFFLE_AT + nR, RIFFLE_AT + nR + 8, frame)) : 0;
  const thumbIn = frame < 72 ? 0 : frame < 84 ? springT((frame - 72) / 30, 2.4, 0.5) : frame < RIFFLE_AT + nR + 6 ? 1 : 1 - clamp01(inv(RIFFLE_AT + nR + 6, RIFFLE_AT + nR + 18, frame));
  const riffleWig = riffleIdx >= 0 ? (riffleIdx % 2 ? 0.75 : 1) : 1;
  const fl = 190 * flapT * riffleWig; // flap size
  const corner: P2 = [W, H];
  const sid = p.seed * 11 + id;

  const sheetBody = sheetKind >= 0 ? oldSheet(sheetKind, 300 + sheetKind * 13) : topSheet(sid);
  const shadow = mixHex(p.deskColor, '#000000', 0.45);
  return (
    <AbsoluteFill style={{background: p.deskColor}}>
      <Svg>
        <g transform={`scale(${u})`}>
          {/* desk */}
          <rect width={W} height={H} fill={p.deskColor} />
          <rect x={W * 0.03} y={H * 0.03} width={W * 0.94} height={H * 0.94} fill={mixHex(p.deskColor, '#ffffff', 0.18)} opacity={s < 1 ? 1 : 0} />
          <g transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
            {/* stack of earlier sheets */}
            {s < 1 &&
              [4, 3, 2, 1].map((k) => <rect key={k} x={k * 5} y={k * 6} width={W} height={H} fill={mixHex(p.paper, '#6b5e48', 0.08 + k * 0.05)} stroke={shadow} strokeWidth={1.5} />)}
            {s < 1 && <rect x={14} y={18} width={W} height={H} fill="#000" opacity={0.12} />}
            {/* the sheet (clipped by the lifted corner) */}
            <clipPath id="mg1-flip-sheet">
              <path d={polyD(fl > 1 ? [[0, 0], [W, 0], [W, H - fl], [W - fl, H], [0, H]] : [[0, 0], [W, 0], [W, H], [0, H]])} />
            </clipPath>
            <g clipPath="url(#mg1-flip-sheet)">
              <CelPaper w={W} h={H} color={p.paper} drawing={sheetKind >= 0 ? sheetKind + 7 : id} id="mg1-flip" />
              {sheetBody}
              <text x={60} y={84} fontFamily={fonts.hand} fontWeight={700} fontSize={32} fill={p.pencil} opacity={0.85}>
                {p.sceneLabel}
              </text>
              <text x={W - 60} y={H - 56} textAnchor="end" fontFamily={fonts.hand} fontWeight={700} fontSize={38} fill={p.pencil} opacity={sheetKind < 0 ? 1 - writeP : 1}>
                No. {String(sheetKind >= 0 ? Math.max(1, countNum - [4, 25, 38, 85, 116, 133, 140, 144][sheetKind % 8]) : countNum).padStart(3, '0')}
              </text>
              {/* red pencil count + circle (top sheet only) */}
              {sheetKind < 0 && writeP > 0 && (
                <g>
                  <clipPath id="mg1-flip-cnt">
                    <rect x={cntX - 160} y={cntY - 70} width={320 * writeP} height={110} />
                  </clipPath>
                  <text x={cntX} y={cntY} textAnchor="middle" fontFamily={fonts.hand} fontWeight={700} fontSize={66} fill={p.pencil} clipPath="url(#mg1-flip-cnt)" transform={`rotate(-4 ${cntX} ${cntY})`}>
                    {p.countLabel}
                  </text>
                </g>
              )}
              {sheetKind < 0 && circP > 0 && <path d={inkStroke(circle, {seed: 5, w: 3.6, amp: 1.2, heavy: 0, draw: circP, t0: 20, t1: 30})} fill={p.pencil} />}
            </g>
            {/* curled flap: the back of the lifted corner */}
            {fl > 1 && (
              <g>
                <path d={polyD([[W, H - fl], [W - fl, H], [W - fl * 0.98, H - fl * 0.98]])} fill="#000" opacity={0.18} transform="translate(8 6)" />
                <path d={fillShape(dens([[W, H - fl], [W - fl, H], [W - fl * 0.92, H - fl * 0.92]], 6), {seed: id, amp: 1.2})} fill={mixHex(p.paper, '#ffffff', 0.35)} />
                {inkLoop(dens([[W, H - fl], [W - fl, H], [W - fl * 0.92, H - fl * 0.92]], 6), {seed: id + 2, w: 3.5, amp: 1.2}).map((d, i) => (
                  <path key={i} d={d} fill={p.ink} />
                ))}
              </g>
            )}
            {/* peg bar + holes + tape */}
            {p.pegBar && s < 1 && (
              <g>
                <rect x={W * 0.1} y={-34} width={W * 0.8} height={22} rx={8} fill={mixHex(p.ink, p.deskColor, 0.2)} />
                {[0.25, 0.5, 0.75].map((x, i) =>
                  i === 1 ? (
                    <circle key={i} cx={W * x} cy={46} r={12} fill={p.ink} opacity={0.85} />
                  ) : (
                    <rect key={i} x={W * x - 60} y={36} width={120} height={22} rx={11} fill={p.ink} opacity={0.85} />
                  ),
                )}
                {[0.08, 0.92].map((x, i) => (
                  <rect key={'t' + i} x={W * x - 45} y={-30} width={90} height={56} fill="#F3EBD2" opacity={0.92} transform={`rotate(${i ? 4 : -4} ${W * x} 0)`} stroke={shadow} strokeWidth={1} />
                ))}
              </g>
            )}
            {p.pegBar && s === 1 && [0.25, 0.5, 0.75].map((x, i) => (i === 1 ? <circle key={i} cx={W * x} cy={46} r={12} fill={p.ink} opacity={0.85} /> : <rect key={i} x={W * x - 60} y={36} width={120} height={22} rx={11} fill={p.ink} opacity={0.85} />))}
          </g>
          {/* cartoon thumb (screen space, follows the flap corner) */}
          {thumbIn > 0 && (
            <Thumb x={cx + (W - fl * 0.55 - cx) * s + (1 - thumbIn) * 260} y={cy + (H - fl * 0.45 - cy) * s + (1 - thumbIn) * 200} seed={id} ink={p.ink} />
          )}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};
const E3 = (t: number) => 1 - Math.pow(1 - t, 3);

const Thumb: React.FC<{x: number; y: number; seed: number; ink: string}> = ({x, y, seed, ink}) => {
  const P: IP[] = [
    [-30, -18],
    [40, -60],
    [120, -95],
    [260, -110],
    [300, -40],
    [250, 40],
    [110, 60],
    [10, 45],
    [-40, 15],
  ].map(([a, b]) => [x + a, y + b]);
  const d = spline(P, true, 5);
  const nail: IP[] = [
    [-8, -10],
    [30, -34],
    [62, -30],
    [66, 4],
    [30, 22],
    [-4, 14],
  ].map(([a, b]) => [x + a, y + b]);
  const nd = spline(nail, true, 4);
  return (
    <g>
      <path d={fillShape(d, {seed, amp: 1.5, dx: -5, dy: 4})} fill="#FFF3DF" />
      {inkLoop(d, {seed: seed + 1, w: 5, amp: 1.5, splits: 2}).map((dd, i) => (
        <path key={i} d={dd} fill={ink} />
      ))}
      {inkLoop(nd, {seed: seed + 2, w: 3.5, amp: 1}).map((dd, i) => (
        <path key={'n' + i} d={dd} fill={ink} />
      ))}
      <path d={inkStroke([[x + 150, y - 70], [x + 160, y - 40], [x + 150, y - 10]], {seed: seed + 3, w: 3, heavy: 0})} fill={ink} opacity={0.7} />
    </g>
  );
};

export const flipbookRiffleOutro = defineMotion<Props>({
  id: 'flipbook-riffle-outro',
  title: 'Flipbook riffle outro',
  category: 'text',
  description:
    'A hand-drawn end card (scalloped red title plate, flame mascot, sparkles) pulls back in three drawings to become the top sheet of an animation-paper stack on a peg bar on a desk; a red pencil writes and circles the drawing count, a cartoon thumb lifts the corner and riffles back through earlier drawings on ones, then settles on the top sheet and the mascot winks.',
  source: ['mg-styles-15 05-cel-boil 9.0-9.7 s, scene.js drawDesk / drawThumb / RIFFLE (MIT, Vincentwei1021) — technique after mg-styles-15'],
  useFor: 'A memorable "it was all hand-made" signature ending for studio reels, behind-the-scenes, craft and handmade brands.',
  durationInFrames: 180,
  defaultProps: {
    title: 'Made by Hand',
    subtitle: 'FRAME BY FRAME',
    tagline: 'drawn one sheet at a time',
    countLabel: 'No. 146',
    sceneLabel: 'SC. 05',
    src: '',
    paper: '#F1E7CF',
    deskColor: '#57523F',
    plateColor: '#E04A33',
    titleColor: '#FFC425',
    ink: '#1C1613',
    pencil: '#D9573F',
    pegBar: true,
    riffleCount: 6,
    showFlame: true,
    seed: 1,
  },
  propDocs: {
    title: 'title on the scalloped plate',
    subtitle: 'small caps line inside the plate',
    tagline: 'hand-lettered line under the plate',
    countLabel: 'red-pencil drawing count that gets circled',
    sceneLabel: 'slate text top-left of every sheet',
    src: 'optional image (public/ path or URL) shown in place of the title plate',
    paper: 'animation paper colour',
    deskColor: 'desk colour around the sheet',
    plateColor: 'title plate colour',
    titleColor: 'title fill colour',
    ink: 'ink colour',
    pencil: 'red col-erase pencil colour',
    pegBar: 'draw the peg bar, peg holes and tape',
    riffleCount: 'earlier drawings flashed during the riffle (2–8, one per frame)',
    showFlame: 'flame mascot peeking over the plate',
    seed: 'variation seed',
  },
  component: FlipbookRiffleOutro,
  tags: ['outro', 'end card', 'flipbook', 'riffle', 'animation paper', 'peg bar', 'desk', 'pull back', 'behind the scenes', 'hand-made', 'cel', 'title', 'red pencil', 'thumb', 'craft', 'mg-styles-15', 'cel-boil'],
});
