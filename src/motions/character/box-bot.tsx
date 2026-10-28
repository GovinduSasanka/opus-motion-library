import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {onTwos} from '../../core/ease';
import {BOT_PALETTES, BotAction, BoxBot, CharStyle, DeckleFrame, Emote, SoftShadow, SpeedLines, buildBotSegments, evalBotScript, mixHex} from '../../core/character-kit';
import {rng} from '../../core/random';
import {PaperTexture, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * The orange cube mascot (video20 box-bot-character, video13 cube-mascot-rig / eye-expression-swap / hop-cycle,
 * video12 character-hop-squash). A real 2.5D cuboid rig driven by a `script` of actions, animated on twos.
 */
type Props = {
  style: CharStyle;
  script: BotAction[];
  startX: number;
  size: number;
  bodyColor: string;
  shadeColor: string;
  eyeColor: string;
  legs: 'quad' | 'row';
  snout: boolean;
  flower: boolean;
  onTwos: boolean;
  background: string;
  floorY: number;
  hat: 'none' | 'party' | 'wizard' | 'crown' | 'helmet' | 'cap' | 'tophat' | 'beanie';
  hatColor: string;
  mood: 'none' | 'fear' | 'anger' | 'sad' | 'love' | 'disgust' | 'pride';
  tint: string;
  tintK: number;
  gloom: number;
  blush: number;
};

/** body-colour mood tints (clawd-style): pale fear, red anger, blue sadness, pink love, green disgust, gold pride */
const MOODS: Record<string, string> = {fear: '#D9E3C8', anger: '#E0382B', sad: '#5B7FD6', love: '#F08AB4', disgust: '#7DBB4C', pride: '#F2BE2D'};

const Hat: React.FC<{kind: Props['hat']; x: number; y: number; W: number; color: string; ink: string; sq: number}> = ({kind, x, y, W, color, ink, sq}) => {
  const k = W / 100;
  const sw = 2 * k;
  const g = (children: React.ReactNode) => (
    <g transform={`translate(${x} ${y}) scale(1 ${sq})`} stroke={ink} strokeWidth={sw} strokeLinejoin="round">
      {children}
    </g>
  );
  switch (kind) {
    case 'party':
      return g(<><path d={`M ${-22 * k} 0 L 0 ${-62 * k} L ${22 * k} 0 Z`} fill={color || '#FF5CB0'} /><circle cx={0} cy={-64 * k} r={7 * k} fill="#FFD84D" /><path d={`M ${-12 * k} ${-26 * k} L ${12 * k} ${-26 * k} M ${-17 * k} ${-12 * k} L ${17 * k} ${-12 * k}`} stroke="#fff" fill="none" /></>);
    case 'wizard':
      return g(<><path d={`M ${-24 * k} 0 L ${-4 * k} ${-72 * k} Q ${8 * k} ${-76 * k} ${18 * k} ${-58 * k} L ${24 * k} 0 Z`} fill={color || '#5B4BB8'} /><ellipse cx={0} cy={0} rx={42 * k} ry={7 * k} fill={color || '#5B4BB8'} /><circle cx={4 * k} cy={-30 * k} r={4 * k} fill="#FFD84D" stroke="none" /></>);
    case 'crown':
      return g(<path d={`M ${-26 * k} 0 L ${-30 * k} ${-34 * k} L ${-14 * k} ${-18 * k} L 0 ${-40 * k} L ${14 * k} ${-18 * k} L ${30 * k} ${-34 * k} L ${26 * k} 0 Z`} fill={color || '#FFC83D'} />);
    case 'helmet':
      return g(<><path d={`M ${-34 * k} 0 A ${34 * k} ${34 * k} 0 0 1 ${34 * k} 0 Z`} fill={color || '#FFB020'} /><rect x={-38 * k} y={-2 * k} width={76 * k} height={7 * k} rx={3 * k} fill={color || '#FFB020'} /></>);
    case 'cap':
      return g(<><path d={`M ${-30 * k} 0 A ${30 * k} ${28 * k} 0 0 1 ${30 * k} 0 Z`} fill={color || '#3C7BE0'} /><path d={`M ${6 * k} 0 L ${46 * k} 0 L ${40 * k} ${-6 * k} L ${6 * k} ${-6 * k} Z`} fill={color || '#3C7BE0'} /></>);
    case 'tophat':
      return g(<><rect x={-22 * k} y={-54 * k} width={44 * k} height={52 * k} rx={3 * k} fill={color || '#2B2630'} /><ellipse cx={0} cy={0} rx={38 * k} ry={6 * k} fill={color || '#2B2630'} /><rect x={-22 * k} y={-16 * k} width={44 * k} height={8 * k} fill="#D14B4B" stroke="none" /></>);
    case 'beanie':
      return g(<><path d={`M ${-32 * k} 0 A ${32 * k} ${34 * k} 0 0 1 ${32 * k} 0 Z`} fill={color || '#E0584A'} /><rect x={-34 * k} y={-6 * k} width={68 * k} height={11 * k} rx={4 * k} fill={color || '#E0584A'} /><circle cx={0} cy={-36 * k} r={6 * k} fill="#fff" /></>);
    default:
      return null;
  }
};

const SCENE: Record<CharStyle, {bg: string; floor: string; floor2: string; ink: string}> = {
  sketch: {bg: '#DFD6C5', floor: '#D6C8AF', floor2: '#CDBEA4', ink: '#2E2A26'},
  clean: {bg: '#8FB3EC', floor: '#F4C982', floor2: '#E6B46A', ink: '#7A3420'},
  toon: {bg: '#5B0B98', floor: '#270778', floor2: '#1A0558', ink: '#16081C'},
};

const Floor: React.FC<{style: CharStyle; w: number; h: number; u: number; fy: number; frame: number}> = ({style, w, h, u, fy, frame}) => {
  const S = SCENE[style];
  const back = fy - Math.min(h * 0.2, 230 * u);
  if (style === 'sketch') {
    const k = u;
    const L = w * 0.06;
    const R = w * 0.94;
    const lines: [number, number, number, number][] = [
      [L - 10 * k, back, R + 12 * k, back - 4 * k],
      [L, back, -w * 0.05, h * 1.02],
      [R, back - 4 * k, w * 1.05, h * 0.98],
    ];
    return (
      <g>
        <defs>
          <pattern id="bb-floorhatch" patternUnits="userSpaceOnUse" width={7 * k} height={7 * k} patternTransform="rotate(-62)">
            <line x1={0} y1={0} x2={0} y2={7 * k} stroke={S.ink} strokeWidth={1.1 * k} opacity={0.12} strokeDasharray={`${60 * k} ${8 * k}`} />
          </pattern>
        </defs>
        <polygon points={`${L},${back} ${R},${back - 4 * k} ${w * 1.05},${h * 0.98} ${-w * 0.05},${h * 1.02}`} fill={S.floor} opacity={0.75} />
        <polygon points={`${L},${back} ${R},${back - 4 * k} ${w * 1.05},${h * 0.98} ${-w * 0.05},${h * 1.02}`} fill="url(#bb-floorhatch)" />
        {lines.map(([a, b, c, d], i) => (
          <line key={i} x1={a} y1={b} x2={c} y2={d} stroke={S.ink} strokeWidth={1.8 * k} strokeLinecap="round" opacity={0.85} />
        ))}
        {/* faint construction lines on the back wall */}
        <line x1={w * 0.18} y1={back - h * 0.42} x2={w * 0.18} y2={back + 6 * k} stroke={S.ink} strokeWidth={1.1 * k} opacity={0.35} />
        <line x1={w * 0.12} y1={back - h * 0.3} x2={w * 0.3} y2={back - h * 0.3} stroke={S.ink} strokeWidth={1 * k} opacity={0.25} />
        <path d={`M ${w * 0.72} ${back} A ${70 * k} ${70 * k} 0 0 1 ${w * 0.72 + 140 * k} ${back}`} fill="none" stroke={S.ink} strokeWidth={1.1 * k} opacity={0.3} />
      </g>
    );
  }
  if (style === 'clean') {
    // v13 sunny balcony: deck planks
    const planks = 7;
    return (
      <g>
        <defs>
          <linearGradient id="bb-deck" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E9B66B" />
            <stop offset="100%" stopColor="#FFD58A" />
          </linearGradient>
          <radialGradient id="bb-sun" cx="78%" cy="18%" r="60%">
            <stop offset="0%" stopColor="#FFFBEF" stopOpacity={0.95} />
            <stop offset="30%" stopColor="#FFF4D6" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#FFF4D6" stopOpacity={0} />
          </radialGradient>
        </defs>
        {[0, 1, 2].map((i) => {
          const r = rng(i + 3);
          const cx = ((r() * 1.4 + frame * 0.0008 * (i + 1)) % 1.4) * w - w * 0.2;
          const cy = h * (0.12 + 0.12 * i);
          const s = (90 + 60 * r()) * u;
          return (
            <g key={i} opacity={0.9}>
              {[0, 1, 2, 3].map((j) => (
                <circle key={j} cx={cx + (j - 1.5) * s * 0.7} cy={cy - (j === 1 || j === 2 ? s * 0.35 : 0)} r={s * (j === 1 || j === 2 ? 0.6 : 0.42)} fill="#F4F2F1" />
              ))}
              <rect x={cx - s * 1.5} y={cy} width={s * 3} height={s * 0.4} fill="#F4F2F1" />
              <rect x={cx - s * 1.5} y={cy + s * 0.25} width={s * 3} height={s * 0.15} fill="#C9CEE8" />
            </g>
          );
        })}
        <rect x={0} y={0} width={w} height={h} fill="url(#bb-sun)" />
        <rect x={0} y={back} width={w} height={h - back} fill="url(#bb-deck)" />
        <rect x={0} y={back - 16 * u} width={w} height={16 * u} fill="#C98A4B" />
        {Array.from({length: planks}, (_, i) => {
          const t = (i + 1) / (planks + 1);
          const yy = back + (h - back) * t * t * 1.1;
          return <line key={i} x1={0} y1={yy} x2={w} y2={yy} stroke="#C98F4E" strokeWidth={(1 + 2 * t) * u} opacity={0.5} />;
        })}
      </g>
    );
  }
  // toon: v12 synthwave cyberspace
  const vpX = w / 2;
  return (
    <g>
      <defs>
        <linearGradient id="bb-tsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A0790" />
          <stop offset="70%" stopColor="#880A99" />
          <stop offset="100%" stopColor="#E22289" />
        </linearGradient>
        <pattern id="bb-dots" patternUnits="userSpaceOnUse" width={10 * u} height={10 * u} patternTransform="rotate(45)">
          <circle cx={5 * u} cy={5 * u} r={1.6 * u} fill="#FFFFFF" opacity={0.12} />
        </pattern>
      </defs>
      <rect x={0} y={0} width={w} height={back} fill="url(#bb-tsky)" />
      <rect x={0} y={0} width={w} height={back} fill="url(#bb-dots)" />
      <rect x={0} y={back} width={w} height={h - back} fill={SCENE.toon.floor} />
      <rect x={0} y={back - 3 * u} width={w} height={6 * u} fill="#FF5CB0" opacity={0.9} />
      {Array.from({length: 9}, (_, i) => {
        const t = (((i + (frame * 0.02) % 1) / 9) ** 2);
        const yy = back + (h - back) * t;
        return <line key={i} x1={0} y1={yy} x2={w} y2={yy} stroke="#37C5D7" strokeWidth={(1 + 2.5 * t) * u} opacity={0.75} />;
      })}
      {Array.from({length: 21}, (_, i) => {
        const xx = (i - 10) * w * 0.16;
        return <line key={`v${i}`} x1={vpX + xx * 0.12} y1={back} x2={vpX + xx * 1.6} y2={h} stroke="#37C5D7" strokeWidth={1.5 * u} opacity={0.6} />;
      })}
    </g>
  );
};

const BoxBotMotion: React.FC<Props> = ({style, script, startX, size, bodyColor, shadeColor, eyeColor, legs, snout, flower, onTwos: twos, background, floorY, hat, hatColor, mood, tint, tintK, gloom, blush}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const cf = twos ? onTwos(frame) : frame;
  const S = SCENE[style];
  const W = size * Math.min(w, h) * (portrait ? 1.6 : 1);
  const fy = (floorY > 0 ? floorY : portrait ? 0.66 : 0.76) * h;
  const segs = React.useMemo(() => buildBotSegments(script.map((a) => ((a.action as string) === 'hop-spin' ? ({...a, action: 'hop'} as BotAction) : a)), startX), [script, startX]);
  const st = evalBotScript(segs, cf);
  // hop-spin: a full turn about the vertical axis during the hop
  const spinIdx = script.findIndex((a, i) => (a.action as string) === 'hop-spin' && segs[i] && cf >= segs[i].start && cf < segs[i].end);
  if (spinIdx >= 0) {
    const sg = segs[spinIdx];
    const t = (cf - sg.start) / Math.max(1, sg.end - sg.start);
    st.pose.yaw = (st.pose.yaw ?? 0) + 360 * (t * t * (3 - 2 * t));
  }
  const bx = st.x * w;
  const by = fy - st.lift * W;
  const tintCol = tint || MOODS[mood] || '';
  const tk = tintCol ? (tint ? tintK : tintK || 0.5) : 0;
  const baseBody = bodyColor || (tk > 0 ? BOT_PALETTES[style].body : '');
  const pal = {
    ...BOT_PALETTES[style],
    ...(baseBody
      ? (() => {
          const bc = tk > 0 ? mixHex(baseBody, tintCol, tk) : baseBody;
          return {body: bc, top: mixHex(bc, '#FFFFFF', 0.22), leg: mixHex(bc, shadeColor || BOT_PALETTES[style].shade, 0.25), ...(tk > 0 && !shadeColor ? {shade: mixHex(BOT_PALETTES[style].shade, tintCol, tk * 0.9)} : {})};
        })()
      : {}),
    ...(shadeColor ? {shade: shadeColor} : {}),
    ...(eyeColor ? {eye: eyeColor} : {}),
  };
  const shadowR = W * 0.72 * st.shadowK;
  return (
    <AbsoluteFill style={{background: background || S.bg}}>
      {style === 'sketch' && <PaperTexture opacity={0.45} tint="#8a7350" />}
      <Svg>
        <Floor style={style} w={w} h={h} u={u} fy={fy} frame={frame} />
        {style === 'sketch' ? (
          <g>
            <defs>
              <pattern id="bb-shhatch" patternUnits="userSpaceOnUse" width={4 * u} height={4 * u} patternTransform="rotate(-62)">
                <line x1={0} y1={0} x2={0} y2={4 * u} stroke={S.ink} strokeWidth={1.2 * u} opacity={0.5} />
              </pattern>
            </defs>
            <ellipse cx={bx + W * 0.08} cy={fy + W * 0.02} rx={shadowR} ry={shadowR * 0.2} fill="url(#bb-shhatch)" opacity={0.6 * st.shadowK} />
          </g>
        ) : (
          <SoftShadow id="bb-shadow" x={bx} y={fy + W * 0.02} rx={shadowR} ry={shadowR * 0.2} color={style === 'toon' ? '#0A0230' : '#7A4A20'} opacity={(style === 'toon' ? 0.7 : 0.45) * st.shadowK} />
        )}
        <SpeedLines x={bx} y={by - W * 0.62} size={W} dir={st.dir} amount={st.speed} frame={frame} color={style === 'toon' ? '#FFFFFF' : S.ink} />
        <BoxBot id="bb-hero" x={bx} y={by} size={W} style={style} palette={pal} pose={st.pose} expression={st.expression} legs={legs} snout={snout} flower={flower} />
        {(hat !== 'none' || gloom > 0 || blush > 0) && (() => {
          const hy = by - W * 0.93 + (st.pose.sy !== undefined ? (1 - st.pose.sy) * W * 0.9 : 0);
          const hx = bx + Math.sin(((st.pose.yaw ?? 0) * Math.PI) / 180) * W * 0.12;
          return (
            <g>
              {blush > 0 && [-1, 1].map((sd) => <ellipse key={sd} cx={hx + sd * W * 0.2 + Math.sin(((st.pose.yaw ?? 0) * Math.PI) / 180) * W * 0.2} cy={by - W * 0.5} rx={W * 0.06} ry={W * 0.03} fill="#FF7A9A" opacity={0.55 * blush} />)}
              {gloom > 0 && Array.from({length: 7}, (_, i) => <line key={i} x1={hx + (i - 3) * W * 0.07} y1={by - W * 0.88} x2={hx + (i - 3) * W * 0.07} y2={by - W * (0.88 - 0.16 * gloom)} stroke="#3A3A7A" strokeWidth={1.6 * u} opacity={0.6 * gloom} />)}
              <Hat kind={hat} x={hx} y={hy} W={W} color={hatColor} ink={style === 'toon' ? '#16081C' : S.ink} sq={st.pose.sy ?? 1} />
            </g>
          );
        })()}
        {st.landing >= 0 && st.landing < 8 && (
          <g opacity={1 - st.landing / 8}>
            {[-1, 1].map((s) =>
              [0, 1, 2].map((k) => {
                const a = ((-20 - k * 22) * Math.PI) / 180;
                const r0 = W * (0.62 + 0.05 * st.landing);
                return (
                  <line
                    key={`${s}${k}`}
                    x1={bx + s * Math.cos(a) * r0}
                    y1={fy + Math.sin(a) * r0 * 0.4}
                    x2={bx + s * Math.cos(a) * (r0 + W * 0.14)}
                    y2={fy + Math.sin(a) * (r0 + W * 0.14) * 0.4}
                    stroke={style === 'toon' ? '#FFFFFF' : S.ink}
                    strokeWidth={2.5 * u}
                    strokeLinecap="round"
                  />
                );
              }),
            )}
          </g>
        )}
        {st.emote && (
          <Emote
            id="bb-emote"
            type={st.emote.type}
            x={bx + st.dir * W * 0.05}
            y={by - W * 1.22}
            size={W * 0.5}
            t={st.emote.t}
            dur={st.emote.dur}
            ink={style === 'toon' ? '#FFFFFF' : S.ink}
            frame={frame}
          />
        )}
        {style === 'sketch' && <DeckleFrame id="bb-deckle" w={w} h={h} u={u} />}
      </Svg>
    </AbsoluteFill>
  );
};

export const boxBot = defineMotion<Props>({
  id: 'box-bot',
  title: 'Box-bot mascot',
  category: 'character',
  description: 'Orange cube mascot with dark rectangular eyes, little arms and four stubby legs acting out a script: walk on twos, look around, emote, hop with squash and landing, wave, run off.',
  source: ['video20 box-bot-character + emote-icon-pop', 'video13 cube-mascot-rig, eye-expression-swap, hop-cycle', 'video12 character-hop-squash'],
  useFor: 'A friendly guide/mascot that walks in, reacts (? ! idea, hearts) and leaves; explainer beats that need a character.',
  durationInFrames: 240,
  defaultProps: {
    style: 'sketch',
    script: [
      {action: 'walk', to: 0.5, frames: 54},
      {action: 'look', dir: -1, frames: 18},
      {action: 'look', dir: 1, frames: 18},
      {action: 'emote', icon: '?', frames: 30},
      {action: 'hop', frames: 26},
      {action: 'emote', icon: 'bulb', frames: 30},
      {action: 'wave', frames: 36},
      {action: 'run', to: 1.3, frames: 28},
    ],
    startX: 0.16,
    size: 0.26,
    bodyColor: '',
    shadeColor: '',
    eyeColor: '',
    legs: 'quad',
    snout: false,
    flower: false,
    onTwos: true,
    background: '',
    floorY: 0,
    hat: 'none',
    hatColor: '',
    mood: 'none',
    tint: '',
    tintK: 0.5,
    gloom: 0,
    blush: 0,
  },
  propDocs: {
    style: "'sketch' (v20 pencil on paper) | 'clean' (v13 sunny toon) | 'toon' (v12 comic synthwave)",
    script:
      "sequence of actions: {action:'walk'|'run', to?|dx?, frames} {action:'hop', dx?, height?, frames} {action:'look', dir:-1|1} {action:'emote', icon:'?'|'!'|'heart'|'bulb'|'sweat'|'scribble'|'sparkle'|'zzz'} {action:'wave'} {action:'turn', yaw} {action:'blink'} {action:'idle'|'expression', expression?} {action:'hop-spin', dx?, height?, frames} (hop with a full 360 degree turn)",
    startX: 'start position as a fraction of frame width',
    size: 'body width as a fraction of the short side',
    bodyColor: "override body colour ('' = style default)",
    shadeColor: "override shade-face colour ('' = style default)",
    eyeColor: "override eye colour ('' = style default)",
    legs: "'quad' (v20 four corner legs) | 'row' (v13 four legs in a row)",
    snout: 'pig-snout variant',
    flower: 'pink flower on the head (v20 later acts)',
    onTwos: 'step the character every 2nd frame (12/15 fps hand-animated feel)',
    background: "override background colour ('' = style default)",
    floorY: 'ground line as a fraction of height (0 = auto)',
    hat: 'wardrobe: none | party | wizard | crown | helmet | cap | tophat | beanie (follows the body)',
    hatColor: "hat colour ('' = hat default)",
    mood: 'body-colour mood tint: none | fear (pale) | anger (red) | sad (blue) | love (pink) | disgust (green) | pride (gold)',
    tint: 'custom tint colour mixed into the body (overrides mood)',
    tintK: 'tint mix amount 0..1 (0.5)',
    gloom: 'indigo gloom lines hanging from the forehead 0..1',
    blush: 'blush cheeks 0..1',
  },
  component: BoxBotMotion,
  tags: ['mascot', 'robot', 'walk', 'hop', 'emote', 'cute', 'hat', 'wardrobe', 'mood', 'tint', 'hop-spin', 'spin', 'blush'],
});
