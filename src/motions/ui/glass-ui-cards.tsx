// Adapted from mg-styles-15/demos/12-aurora-glass (shaders.js FS_CARD, main.js cards/riseA) (MIT) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {defineMotion} from '../../core/types';
import {ease, prog} from '../../core/ease';
import {useStage} from '../../core/stage';
import {MeshBlobs, ChatBubble, StreamedReply, VoiceWave, Orb, Toggle, Slider, Chip} from '../../core/r2-mg2a-kit';

type CardSpec = {kind: 'chat' | 'voice' | 'controls'; x: number; y: number; z: number; tilt: number; w: number; h: number};
type Props = {
  cards: CardSpec[];
  userText: string;
  replyText: string;
  frost: number;
  tint: number;
  lightDir: number;
  accent: string;
  colors: string[];
  base: string;
  orbitDeg: number;
  seed: number;
  chatTitle: string;
  voiceTitle: string;
  controlsTitle: string;
  toggleLabel: string;
  sliderLabel: string;
  chips: string[];
};

const GlassCard: React.FC<{spec: CardSpec; i: number; frost: number; tint: number; lightDir: number; u: number; children: React.ReactNode; rise: number; accent: string}> = ({spec, i, frost, tint, lightDir, u, children, rise, accent}) => {
  const frame = useCurrentFrame();
  const W = spec.w * u;
  const H = spec.h * u;
  const bob = Math.sin(frame / 38 + i * 2) * 6 * u;
  const ang = lightDir * (Math.PI / 180);
  const lx = Math.cos(ang);
  const ly = Math.sin(ang);
  const sweep = ((frame * 0.006 + i * 0.3) % 1.6) - 0.3;
  const catchAng = (frame * 1.4 + i * 90) % 360;
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: W,
        height: H,
        marginLeft: -W / 2 + spec.x * u,
        marginTop: -H / 2 + spec.y * u + bob + (1 - rise) * 70 * u,
        transform: `translateZ(${spec.z * u}px) rotateZ(${spec.tilt}deg)`,
        transformStyle: 'preserve-3d',
        opacity: rise,
        borderRadius: 34 * u,
      }}
    >
      {/* soft shadow projected on the background */}
      <div style={{position: 'absolute', inset: 0, borderRadius: 34 * u, boxShadow: `0 ${34 * u}px ${80 * u}px rgba(4,2,30,.45)`}} />
      {/* frosted body */}
      <div style={{position: 'absolute', inset: 0, borderRadius: 34 * u, backdropFilter: `blur(${frost * u}px) saturate(1.4)`, WebkitBackdropFilter: `blur(${frost * u}px) saturate(1.4)`, background: `rgba(255,255,255,${tint})`, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.14), inset 0 0 26px rgba(255,255,255,.10)', overflow: 'hidden'}}>
        {/* broad diagonal sheen */}
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent ${sweep * 100 - 22}%, rgba(255,255,255,.17) ${sweep * 100}%, transparent ${sweep * 100 + 22}%)`}} />
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(${lightDir + 90}deg, rgba(255,255,255,.16), rgba(255,255,255,0) 45%)`}} />
        <div style={{position: 'absolute', inset: 0, padding: 34 * u, display: 'flex', flexDirection: 'column', gap: 18 * u}}>{children}</div>
      </div>
      {/* 1px rim brighter on the edge facing the light + a catch-light running round */}
      <div style={{position: 'absolute', inset: 0, borderRadius: 34 * u, padding: Math.max(1, 1.2 * u), background: `conic-gradient(from ${catchAng}deg, rgba(255,255,255,.95) 0deg, rgba(255,255,255,.12) 38deg, rgba(255,255,255,.14) 300deg, rgba(255,255,255,.95) 360deg), linear-gradient(${lightDir + 180}deg, rgba(255,255,255,${0.35 + 0.35 * Math.max(0, lx * 0.6 + ly * 0.8)}), rgba(255,255,255,.12))`, backgroundBlendMode: 'overlay', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude'}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: 34 * u, boxShadow: `0 0 ${24 * u}px ${accent}22`}} />
    </div>
  );
};

const GlassUiCards: React.FC<Props> = ({cards, userText, replyText, frost, tint, lightDir, accent, colors, base, orbitDeg, seed, chatTitle = 'ASSISTANT', voiceTitle = 'LISTENING', controlsTitle = 'SETTINGS', toggleLabel = 'Smart replies', sliderLabel = 'Creativity', chips = ['Concise', 'Friendly', 'Formal']}) => {
  const frame = useCurrentFrame();
  const {u, w, h} = useStage();
  const cam = prog(frame, 0, 200, ease.sine);
  const ry = Math.sin(cam * Math.PI) * orbitDeg;
  const rx = Math.cos(cam * Math.PI) * orbitDeg * 0.45;
  const portrait = h > w;
  const renderBody = (c: CardSpec, i: number) => {
    const at = 14 + i * 12;
    if (c.kind === 'chat')
      return (
        <>
          <div style={{fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,.6)', fontSize: 19 * u, fontWeight: 600, letterSpacing: 2 * u}}>{chatTitle}</div>
          <ChatBubble text={userText} side="r" at={at + 8} u={u} accent={accent} />
          <StreamedReply text={replyText} at={at + 34} u={u} />
        </>
      );
    if (c.kind === 'voice')
      return (
        <>
          <div style={{fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,.6)', fontSize: 19 * u, fontWeight: 600, letterSpacing: 2 * u}}>{voiceTitle}</div>
          <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Orb u={u} size={Math.min(c.w, c.h) * 0.46 * u} at={at + 6} c1={accent} c2="#6d28d9" />
          </div>
          <VoiceWave u={u} width={(c.w - 68) * u} at={at + 10} accent={accent} />
        </>
      );
    const on = prog(frame, at + 30, at + 38, ease.out);
    const sv = 0.25 + 0.5 * prog(frame, at + 20, at + 80, ease.inOut);
    return (
      <>
        <div style={{fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,.6)', fontSize: 19 * u, fontWeight: 600, letterSpacing: 2 * u}}>{controlsTitle}</div>
        <Toggle u={u} on={on} accent={accent} label={toggleLabel} />
        <Slider u={u} value={sv} accent={accent} label={sliderLabel} />
        <div style={{display: 'flex', gap: 10 * u, flexWrap: 'wrap'}}>
          {chips.map((ch, ci) => (
            <Chip key={ci} u={u} text={ch} accent={accent} active={ci === 0} p={prog(frame, at + 12 + ci * 4, at + 22 + ci * 4, ease.back)} />
          ))}
        </div>
      </>
    );
  };
  // portrait: stack the cards vertically in a narrow column
  const place = (c: CardSpec, i: number): CardSpec => {
    if (!portrait) return c;
    const k = Math.min(1, (w / u - 80) / 600);
    const ys = [-560, -20, 420];
    return {...c, x: (i - 1) * 30, y: ys[i % 3] * 1, w: Math.min(c.w, 640) * k + 20, h: c.h * 0.9};
  };
  return (
    <AbsoluteFill style={{background: base}}>
      <MeshBlobs colors={colors} base={base} count={7} speed={2} warp={90} rippleAt={-1} grain={0.12} motes={14} seed={seed} frameOffset={50} />
      <AbsoluteFill style={{perspective: 1400 * u, perspectiveOrigin: '50% 48%'}}>
        <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${ry}deg) rotateX(${rx}deg)`}}>
          {cards.map((c0, i) => {
            const c = place(c0, i);
            return (
              <GlassCard key={i} spec={c} i={i} frost={frost} tint={tint} lightDir={lightDir} u={u} accent={accent} rise={prog(frame, 6 + i * 12, 34 + i * 12, ease.out)}>
                {renderBody(c, i)}
              </GlassCard>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const glassUiCards = defineMotion<Props>({
  id: 'glass-ui-cards',
  title: 'Glass UI cards',
  category: 'ui',
  description: 'Frosted glass cards float in 3D with parallax over a drifting mesh-gradient: blurred saturated backdrop, faint white fill, 1px rim highlight, a broad diagonal sheen and a catch-light circling the edge; inside, a chat with a streamed reply, a voice waveform with a glowing orb, and toggle / slider / chips.',
  source: ['mg-styles-15 demos/12-aurora-glass (MIT, FS_CARD, cards/riseA)'],
  useFor: 'AI-assistant demos, app feature films and website heroes that want a translucent, premium UI look.',
  durationInFrames: 210,
  defaultProps: {
    cards: [
      {kind: 'chat', x: -270, y: -40, z: 40, tilt: -2.5, w: 560, h: 520},
      {kind: 'voice', x: 330, y: -150, z: -20, tilt: 2, w: 440, h: 390},
      {kind: 'controls', x: 310, y: 190, z: 90, tilt: -1.5, w: 470, h: 330},
    ],
    userText: 'Plan my launch week',
    replyText: 'Sure. I drafted a five day plan, booked the review on Tuesday and queued the announcement for Thursday morning.',
    frost: 30,
    tint: 0.085,
    lightDir: 125,
    accent: '#8b5cf6',
    colors: ['#6d28d9', '#2563eb', '#06b6d4', '#c026d3'],
    base: '#07061c',
    orbitDeg: 6,
    seed: 11,
    chatTitle: 'ASSISTANT',
    voiceTitle: 'LISTENING',
    controlsTitle: 'SETTINGS',
    toggleLabel: 'Smart replies',
    sliderLabel: 'Creativity',
    chips: ['Concise', 'Friendly', 'Formal'],
  },
  propDocs: {
    cards: 'cards: kind chat|voice|controls, x/y offsets (px at 1080), z depth, tilt degrees, w/h size (portrait re-stacks them vertically)',
    userText: 'user message bubble',
    replyText: 'assistant reply streamed word by word',
    frost: 'backdrop blur in px (30)',
    tint: 'white fill opacity (0.085)',
    lightDir: 'light direction in degrees (rim highlight faces it)',
    accent: 'accent colour for bubbles, toggles, orb',
    colors: 'backdrop pool colours',
    base: 'backdrop base colour',
    orbitDeg: 'camera parallax swing in degrees',
    seed: 'backdrop seed',
    chatTitle: 'small caps heading of the chat card',
    voiceTitle: 'small caps heading of the voice card',
    controlsTitle: 'small caps heading of the controls card',
    toggleLabel: 'label of the toggle in the controls card',
    sliderLabel: 'label of the slider in the controls card',
    chips: 'chip labels in the controls card (the first is active)',
  },
  component: GlassUiCards,
  tags: ['glass', 'glassmorphism', 'frosted', 'ui', 'cards', 'ai assistant', 'chat', 'voice', 'waveform', 'parallax', '3d', 'app demo', 'hero', 'translucent', 'backdrop-blur', 'toggle', 'slider'],
});
