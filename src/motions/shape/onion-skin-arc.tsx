import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {n2} from '../../core/random';
import {Mono, P17, PrinciplesHud, serifItalic} from '../../core/principles-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video17 onion-skin-trail (principle 04) and split-compare-drop (principle 09).
 * compare: two panels. Left (cream) "straight ahead": a new outlined ghost circle is drawn every 2 frames along a
 *   wandering path, with a drawing counter. Right (dark) "pose to pose": KEY 1 / KEY 2 ellipses, a breakdown at the
 *   apex, then eased in-betweens fill the arc (closer near the keys, opacity ramp), with a keyframe timeline below.
 * drop: the ball splits into a bowling ball, the ball and a balloon; all fall the same height in different frame
 *   counts (heavy easeIn, gravity, slow linear sway), frame counters roll; the balloon finally floats away.
 */
type Props = {
  mode: 'compare' | 'drop';
  background: string;
  color: string;
  inbetweens: number;
  dropFrames: number[];
  dropLabels: string[];
  hud: boolean;
  numeral: string;
  title: string;
  subtitle: string;
  code: string;
};

type Box = {x: number; y: number; w: number; h: number};

const StraightAhead: React.FC<{b: Box; color: string}> = ({b, color}) => {
  const frame = useCurrentFrame();
  const {u} = useStage();
  const r = Math.min(b.w, b.h) * 0.085;
  // wandering path drawn "straight ahead": arc with hand drift
  const path = (k: number) => {
    const t = k / 46;
    const x = b.x + b.w * (0.16 + 0.62 * t) + n2('sa-x', t * 2.2, 0.3) * b.w * 0.07;
    const y = b.y + b.h * (0.62 - 0.42 * Math.sin(Math.PI * Math.min(1, t * 1.05))) + n2('sa-y', t * 2.6, 1.7) * b.h * 0.08;
    return [x, y];
  };
  const drawn = Math.min(46, Math.max(0, Math.floor((frame - 10) / 2)));
  const ghosts = [];
  for (let k = 0; k < drawn; k++) {
    const [x, y] = path(k);
    ghosts.push(<circle key={k} cx={x} cy={y} r={r * (1 + n2('sa-r', k * 0.4, 0) * 0.08)} fill="none" stroke={P17.ink} strokeWidth={1.5 * u} opacity={0.7} />);
  }
  const [hx, hy] = path(Math.max(0, drawn - 1 + ((frame - 10) % 2) / 2));
  const total = Math.max(drawn, 0);
  const pop = drawn > 0 ? prog((frame - 10) % 2, 0, 1) : 0;
  return (
    <g>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={4 * u} fill={P17.paper} />
      <line x1={b.x + b.w * 0.06} x2={b.x + b.w * 0.94} y1={b.y + b.h * 0.8} y2={b.y + b.h * 0.8} stroke={P17.ink} strokeWidth={1 * u} opacity={0.4} />
      {ghosts}
      {drawn > 0 && <circle cx={hx} cy={hy} r={r * (0.95 + 0.05 * pop)} fill={color} />}
      <text x={b.x + b.w - 22 * u} y={b.y + b.h - 22 * u} textAnchor="end" fontFamily={serifItalic} fontStyle="italic" fontSize={64 * u} fill={P17.ink}>
        {String(total).padStart(2, '0')}
      </text>
      <text x={b.x + 22 * u} y={b.y + b.h - 26 * u} fontFamily={fonts.mono} fontSize={11 * u} letterSpacing={1.6 * u} fill={P17.grey}>
        {`DRAWINGS ${String(total).padStart(2, '0')} · TOTAL 46`}
      </text>
    </g>
  );
};

const PoseToPose: React.FC<{b: Box; color: string; n: number}> = ({b, color, n}) => {
  const frame = useCurrentFrame();
  const {u} = useStage();
  const r = Math.min(b.w, b.h) * 0.085;
  const k1 = [b.x + b.w * 0.16, b.y + b.h * 0.6];
  const k2 = [b.x + b.w * 0.84, b.y + b.h * 0.6];
  const apex = b.y + b.h * 0.2;
  const arc = (t: number) => [lerp(k1[0], k2[0], t), lerp(k1[1], k2[1], t) - (k1[1] - apex) * 4 * t * (1 - t)];
  const key1In = prog(frame, 12, 18, ease.back);
  const key2In = prog(frame, 22, 28, ease.back);
  const bdIn = prog(frame, 34, 40, ease.back);
  const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const tl = {x0: b.x + b.w * 0.08, x1: b.x + b.w * 0.92, y: b.y + b.h * 0.88};
  const inb = Array.from({length: n}, (_, i) => {
    const t = easeIO((i + 1) / (n + 1));
    const at = 46 + i * 4;
    const s = prog(frame, at, at + 5, ease.back);
    const op = 0.25 + 0.75 * (i / Math.max(1, n - 1));
    return {t, s, op, at};
  });
  // playback after everything is in: red ball runs the arc with the ease
  const play = frame - (50 + n * 4 + 6);
  const pt = play > 0 ? easeIO(((play % 34) / 30) > 1 ? 1 : (play % 34) / 30) : 0;
  const [bx, by] = arc(pt);
  const chip = (x: number, y: number, label: string, s: number, red = false) => (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={clamp(s)}>
      <rect x={-34 * u} y={-11 * u} width={68 * u} height={22 * u} rx={3 * u} fill={red ? P17.red : '#2A2C2B'} />
      <text x={0} y={4 * u} textAnchor="middle" fontFamily={fonts.mono} fontSize={10 * u} letterSpacing={1.4 * u} fontWeight={700} fill={P17.paper}>
        {label}
      </text>
    </g>
  );
  return (
    <g>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={4 * u} fill="#141615" stroke={P17.hudDim} strokeWidth={1.5 * u} />
      <path d={`M ${k1[0]} ${k1[1]} Q ${(k1[0] + k2[0]) / 2} ${apex - (k1[1] - apex)} ${k2[0]} ${k2[1]}`} fill="none" stroke={P17.hudDim} strokeWidth={1.2 * u} strokeDasharray={`${2 * u} ${6 * u}`} opacity={prog(frame, 28, 34)} />
      <ellipse cx={k1[0]} cy={k1[1]} rx={r * 1.15 * key1In} ry={r * 0.85 * key1In} fill="none" stroke={P17.paper} strokeWidth={2 * u} />
      <ellipse cx={k2[0]} cy={k2[1]} rx={r * 1.15 * key2In} ry={r * 0.85 * key2In} fill="none" stroke={P17.paper} strokeWidth={2 * u} />
      <circle cx={arc(0.5)[0]} cy={arc(0.5)[1]} r={r * bdIn} fill="none" stroke={P17.paper} strokeWidth={1.5 * u} strokeDasharray={`${4 * u} ${4 * u}`} />
      {inb.map((q, i) => {
        if (q.s <= 0) return null;
        const [x, y] = arc(q.t);
        const col = interpolateColors(i / Math.max(1, n - 1), [0, 1], ['#7A1C10', color]);
        return <circle key={i} cx={x} cy={y} r={r * q.s * 0.92} fill={col} opacity={q.op} />;
      })}
      {play > 0 && <circle cx={bx} cy={by} r={r} fill={color} />}
      {chip(k1[0], k1[1] + r + 24 * u, 'KEY 1', key1In)}
      {chip(k2[0], k2[1] + r + 24 * u, 'KEY 2', key2In)}
      {chip(arc(0.5)[0], apex - r - 22 * u, 'BREAKDOWN', bdIn, true)}
      {/* keyframe timeline */}
      <line x1={tl.x0} x2={tl.x1} y1={tl.y} y2={tl.y} stroke={P17.hudDim} strokeWidth={1.5 * u} />
      {[0, 1].map((k) => {
        const s = k ? key2In : key1In;
        const x = lerp(tl.x0, tl.x1, k);
        return <rect key={k} x={-6 * u} y={-6 * u} width={12 * u} height={12 * u} fill={P17.paper} transform={`translate(${x} ${tl.y}) rotate(45) scale(${s})`} />;
      })}
      <rect x={-5 * u} y={-5 * u} width={10 * u} height={10 * u} fill={P17.red} transform={`translate(${lerp(tl.x0, tl.x1, 0.5)} ${tl.y}) rotate(45) scale(${bdIn})`} />
      {inb.map((q, i) => (q.s > 0 ? <line key={i} x1={lerp(tl.x0, tl.x1, q.t)} x2={lerp(tl.x0, tl.x1, q.t)} y1={tl.y - 7 * u * q.s} y2={tl.y + 7 * u * q.s} stroke={color} strokeWidth={1.5 * u} opacity={q.op} /> : null))}
      {play > 0 && <line x1={lerp(tl.x0, tl.x1, (play % 34) / 30 > 1 ? 1 : (play % 34) / 30)} x2={lerp(tl.x0, tl.x1, (play % 34) / 30 > 1 ? 1 : (play % 34) / 30)} y1={tl.y - 14 * u} y2={tl.y + 14 * u} stroke={P17.red} strokeWidth={2 * u} />}
    </g>
  );
};

const CompareScene: React.FC<Props> = ({color, inbetweens}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const open = prog(frame, 0, 10, ease.out);
  let A: Box;
  let B: Box;
  if (portrait) {
    const bw = w * 0.86;
    const bh = h * 0.3;
    A = {x: (w - bw) / 2, y: h * 0.1, w: bw, h: bh};
    B = {x: (w - bw) / 2, y: h * 0.1 + bh + 90 * u, w: bw, h: bh};
  } else {
    const bw = w * 0.415;
    const bh = h * 0.56;
    A = {x: w / 2 - 30 * u - bw, y: h * 0.12, w: bw, h: bh};
    B = {x: w / 2 + 30 * u, y: h * 0.12, w: bw, h: bh};
  }
  const sc = (b: Box) => `translate(${b.x + b.w / 2} ${b.y + b.h / 2}) scale(${0.3 + 0.7 * open} ${0.02 + 0.98 * open}) translate(${-b.x - b.w / 2} ${-b.y - b.h / 2})`;
  return (
    <>
      <Svg>
        <g transform={sc(A)} opacity={clamp(open * 2)}>
          <StraightAhead b={A} color={color} />
        </g>
        <g transform={sc(B)} opacity={clamp(open * 2)}>
          <PoseToPose b={B} color={color} n={Math.max(1, Math.round(inbetweens))} />
        </g>
      </Svg>
      {[
        [A, 'STRAIGHT AHEAD', 'draw every frame, in order', P17.ink],
        [B, 'POSE TO POSE', 'key the poses, fill the gaps', P17.paper],
      ].map(([b, t, s, c], i) => {
        const bb = b as Box;
        return (
          <div key={i} style={{position: 'absolute', left: bb.x + 22 * u, top: bb.y + 20 * u, opacity: prog(frame, 6, 14)}}>
            <div style={{fontFamily: fonts.display, fontSize: 24 * u, color: c as string, lineHeight: 1}}>{t as string}</div>
            <div style={{fontFamily: fonts.mono, fontSize: 11 * u, color: P17.grey, marginTop: 6 * u, letterSpacing: '0.08em'}}>{s as string}</div>
          </div>
        );
      })}
      {!portrait && inbetweens > 0 && (
        <Mono x={B.x + B.w - 22 * u} y={B.y + 22 * u} size={10} color={P17.hudGrey} anchor="right" opacity={prog(frame, 44, 52)}>
          {`IN-BETWEENS ${inbetweens} · EASED`}
        </Mono>
      )}
    </>
  );
};

/* --------------------------------------------------------------- drop */
const DropScene: React.FC<Props> = ({color, dropFrames, dropLabels}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, portrait} = useStage();
  const r = (portrait ? 54 : 50) * u;
  const topY = h * (portrait ? 0.3 : 0.3);
  const floorY = h * (portrait ? 0.62 : 0.72);
  const spread = portrait ? w * 0.3 : Math.min(480 * u, w * 0.25);
  const split = prog(frame, 6, 14, (t) => 1 - Math.pow(1 - t, 3));
  const lift = prog(frame, 0, 6, ease.out);
  const D0 = 22;
  const cols = [-1, 0, 1];
  const easings = [(t: number) => t * t, (t: number) => t * t, (t: number) => t];
  const counterIn = prog(frame, 14, 20);
  const fl = h - floorY;
  return (
    <>
      <Svg>
        <line x1={44 * u} x2={w - 44 * u} y1={floorY + r} y2={floorY + r} stroke={P17.hudGrey} strokeWidth={1.5 * u} />
        {cols.map((c, i) => {
          const x0 = cx + c * spread * split;
          const nF = dropFrames[i] ?? 12;
          const t = clamp((frame - D0) / nF);
          let y = lerp(lerp(h * 0.5, topY, lift), floorY, frame < D0 ? 0 : easings[i](t));
          let x = x0;
          let sx = 1;
          let sy = 1;
          const landed = frame >= D0 + nF;
          if (i === 2) {
            x += Math.sin(((frame - D0) / 36) * Math.PI * 2) * 10 * u * (frame >= D0 && !landed ? 1 : 0);
            // float away later
            const fa = prog(frame, 92, 122, (k) => k * k * k);
            y = lerp(y, -h * 0.25, fa);
          }
          if (i === 1 && landed) {
            const tt = (frame - D0 - nF) / 30;
            const b = Math.max(0, Math.sin(tt * 9) * Math.exp(-tt * 6)) * 60 * u;
            y = floorY - b;
            if (frame - D0 - nF < 1) {
              sy = 0.6;
              sx = 1 / sy;
            }
          }
          if (i === 0 && landed && frame - D0 - nF < 2) {
            sy = 0.86;
            sx = 1.1;
          }
          const vis = i === 1 ? 1 : split;
          const guideOp = prog(frame, 14, 22) * 0.6;
          return (
            <g key={i}>
              <line x1={x0} x2={x0} y1={topY - r - 30 * u} y2={floorY + r} stroke={P17.hudGrey} strokeWidth={1 * u} strokeDasharray={`${3 * u} ${6 * u}`} opacity={guideOp} />
              {i === 2 && (
                <path d={`M ${x} ${y + r * 1.1} q ${-14 * u} ${30 * u} ${4 * u} ${60 * u} t ${-6 * u} ${70 * u}`} fill="none" stroke={P17.paper} strokeWidth={1.4 * u} opacity={vis} />
              )}
              <g transform={`translate(${x} ${y + r}) scale(${sx * (0.6 + 0.4 * vis)} ${sy * (0.6 + 0.4 * vis)}) translate(${-x} ${-y - r})`} opacity={vis}>
                {i === 0 && (
                  <g>
                    <circle cx={x} cy={y} r={r * 0.92} fill="#2B2D2C" stroke={P17.paper} strokeWidth={2 * u} />
                    <circle cx={x - r * 0.3} cy={y - r * 0.28} r={r * 0.11} fill={P17.ink} stroke={P17.paper} strokeWidth={1.2 * u} />
                    <circle cx={x - r * 0.02} cy={y - r * 0.38} r={r * 0.11} fill={P17.ink} stroke={P17.paper} strokeWidth={1.2 * u} />
                    <circle cx={x - r * 0.16} cy={y - r * 0.05} r={r * 0.13} fill={P17.ink} stroke={P17.paper} strokeWidth={1.2 * u} />
                  </g>
                )}
                {i === 1 && <circle cx={x} cy={y} r={r} fill={color} />}
                {i === 2 && (
                  <g>
                    <ellipse cx={x} cy={y} rx={r * 0.92} ry={r * 1.08} fill={P17.pink} />
                    <path d={`M ${x - 7 * u} ${y + r * 1.12} L ${x + 7 * u} ${y + r * 1.12} L ${x} ${y + r * 1.02} Z`} fill={P17.pink} />
                    <ellipse cx={x - r * 0.35} cy={y - r * 0.4} rx={r * 0.16} ry={r * 0.26} fill="#fff" opacity={0.6} transform={`rotate(25 ${x - r * 0.35} ${y - r * 0.4})`} />
                  </g>
                )}
              </g>
              {i === 0 && landed && frame - D0 - nF < 12 && (
                <g opacity={1 - (frame - D0 - nF) / 12} stroke={P17.hudGrey} strokeWidth={1.5 * u}>
                  {[-1, 1].map((s) => (
                    <line key={s} x1={x + s * r * 1.1} x2={x + s * (r * 1.1 + (frame - D0 - nF) * 5 * u)} y1={floorY + r - 4 * u} y2={floorY + r - 10 * u - (frame - D0 - nF) * 1.5 * u} />
                  ))}
                </g>
              )}
            </g>
          );
        })}
        {/* height bracket */}
        <g opacity={prog(frame, 16, 24)} stroke={P17.hudGrey} strokeWidth={1 * u}>
          <line x1={cx + spread + r * 2.6} x2={cx + spread + r * 2.6} y1={topY} y2={floorY} />
          <line x1={cx + spread + r * 2.3} x2={cx + spread + r * 2.9} y1={topY} y2={topY} />
          <line x1={cx + spread + r * 2.3} x2={cx + spread + r * 2.9} y1={floorY} y2={floorY} />
        </g>
      </Svg>
      {!portrait && (
        <Mono x={cx + spread + r * 2.6 + 14 * u} y={(topY + floorY) / 2 - 8 * u} size={11} color={P17.hudGrey} opacity={prog(frame, 16, 24)}>
          {`h = ${Math.round((floorY - topY) / u)} px`}
        </Mono>
      )}
      {cols.map((c, i) => {
        const nF = dropFrames[i] ?? 12;
        const n = Math.round(clamp((frame - D0) / nF) * nF);
        const x0 = cx + c * spread * split;
        return (
          <div key={i} style={{position: 'absolute', left: x0, top: topY - r - 150 * u, transform: 'translateX(-50%)', textAlign: 'center', opacity: counterIn}}>
            <div style={{fontFamily: fonts.mono, fontSize: 11 * u, letterSpacing: '0.15em', color: P17.hudGrey}}>{dropLabels[i] ?? ''}</div>
            <div style={{fontFamily: serifItalic, fontStyle: 'italic', fontSize: 64 * u, lineHeight: 1.1, color: i === 1 ? P17.red : P17.paper, fontVariantNumeric: 'tabular-nums'}}>
              {String(n).padStart(2, '0')}
              <span style={{fontSize: 26 * u}}>F</span>
            </div>
          </div>
        );
      })}
    </>
  );
};

const AUTO = {
  compare: {numeral: '04', title: 'STRAIGHT AHEAD\n& POSE TO POSE', subtitle: 'Draw every frame, or key the poses and fill the gaps.', code: 'x = lerp(key1, key2, ease(i / n)) // in-betweens'},
  drop: {numeral: '09', title: 'TIMING', subtitle: 'Same fall. Different frames. Different weight.', code: 't = √(2h/g) // same h: 5f heavy · 12f · 26f light'},
};

const OnionSkinArc: React.FC<Props> = (props) => {
  const {mode, background, hud} = props;
  const auto = AUTO[mode] ?? AUTO.compare;
  return (
    <AbsoluteFill style={{background}}>
      {mode === 'drop' ? <DropScene {...props} /> : <CompareScene {...props} />}
      {hud && <PrinciplesHud bg={background} numeral={props.numeral || auto.numeral} title={props.title || auto.title} subtitle={props.subtitle || auto.subtitle} code={props.code || auto.code} />}
    </AbsoluteFill>
  );
};

export const onionSkinArc = defineMotion<Props>({
  id: 'onion-skin-arc',
  title: 'Onion-skin arc (straight ahead vs pose to pose)',
  category: 'shape',
  description: 'Two panels compare animation methods: ghost circles drawn frame by frame along a wandering path vs keys, a breakdown and eased in-betweens filling an arc; or (mode drop) a bowling ball, ball and balloon fall the same height in different frame counts.',
  source: ['video17 0:09-0:11.6 onion-skin-trail', 'video17 0:24-0:27 split-compare-drop'],
  useFor: 'Explaining process vs planning, keyframes and in-betweens, timing and weight, any "same task, different approach" comparison.',
  durationInFrames: 150,
  defaultProps: {
    mode: 'compare',
    background: P17.ink,
    color: P17.red,
    inbetweens: 8,
    dropFrames: [5, 12, 26],
    dropLabels: ['HEAVY', 'BALL', 'LIGHT'],
    hud: true,
    numeral: '',
    title: '',
    subtitle: '',
    code: '',
  },
  propDocs: {
    mode: "'compare' (straight-ahead vs pose-to-pose panels) | 'drop' (three objects, same height, different timing)",
    color: 'hero ball colour',
    inbetweens: 'number of eased in-between circles on the pose-to-pose arc',
    dropFrames: 'drop mode: frames each object takes to fall (heavy, ball, light)',
    dropLabels: 'drop mode: labels above the three columns',
    numeral: "chapter numeral ('' = mode default)",
    title: "chapter title ('' = mode default)",
    hud: 'show HUD chrome + chapter title',
  },
  component: OnionSkinArc,
  tags: ['onion-skin', 'keyframes', 'inbetween', 'timing', 'explainer', 'ball', 'compare'],
});
