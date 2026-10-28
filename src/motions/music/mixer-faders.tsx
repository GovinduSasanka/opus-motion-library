import React from 'react';
import {AbsoluteFill, Audio, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {mix, rgbaStr, useAudioReactive} from '../../core/r2-pr3-kit';
import {rng} from '../../core/random';

/**
 * Mixing desk: channel strips with a pan / EQ knob, a segmented level meter, a fader that slides to its `levels`
 * value (staggered, with a small overshoot), a mute button and a label, plus a wider master strip. After the faders
 * settle they ride gently (`ride`). Meters bounce to a synthetic beat, or to the real track when `audioSrc` is given.
 */
type Props = {
  title: string;
  caption: string;
  channels: string[];
  levels: number[];
  pans: number[];
  mutes: boolean[];
  masterLevel: number;
  showMaster: boolean;
  masterLabel: string;
  ride: number;
  colors: string[];
  audioSrc: string;
  playAudio: boolean;
  bpm: number;
  background: string;
  panel: string;
  ink: string;
  accent: string;
  hot: string;
  fontFamily: string;
  seed: number;
};

const SEG = 18;

const MixerFaders: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const clear = P.background === 'transparent';
  const chs = P.channels.length ? P.channels : ['CH 1'];
  const n = chs.length;
  const cols = P.colors.length ? P.colors : [P.accent];
  const au = useAudioReactive(P.audioSrc, frame, fps, {bins: Math.max(8, n + 2), smoothing: 0.7, peakHold: 6, bpm: P.bpm, seed: P.seed});
  const jit = React.useMemo(() => {
    const r = rng(P.seed * 53 + 2);
    return Array.from({length: n + 1}, () => ({f: 0.18 + r() * 0.22, ph: r() * 6.28, f2: 0.31 + r() * 0.3, ph2: r() * 6.28}));
  }, [n, P.seed]);

  // ---- layout -------------------------------------------------------------------------------------------------
  const stripsN = n + (P.showMaster ? 1.45 : 0);
  const panelW = Math.min(w * (portrait ? 0.94 : 0.9), 1700 * u);
  const panelH = portrait ? Math.min(h * 0.52, 1020 * u) : Math.min(h * 0.72, 800 * u);
  const panelX = (w - panelW) / 2;
  const panelY = (h - panelH) / 2 + (P.title ? 34 * u : 0);
  const sw = (panelW - 44 * u) / stripsN;
  const labelFs = Math.min(24 * u, sw * 0.17);
  const enter = prog(frame, 0, 20, ease.out);

  const T = {
    knobY: panelY + panelH * 0.14,
    faderTop: panelY + panelH * 0.27,
    faderBot: panelY + panelH * 0.8,
    muteY: panelY + panelH * 0.865,
    labelY: panelY + panelH * 0.945,
  };
  const travel = T.faderBot - T.faderTop;

  const strip = (i: number, master: boolean) => {
    const wMul = master ? 1.45 : 1;
    const x0 = panelX + 22 * u + (master ? n * sw : i * sw);
    const cw = sw * wMul;
    const cx = x0 + cw / 2;
    const d = i * 4;
    const settle = prog(frame, 8 + d, 44 + d, ease.back);
    const base = master ? P.masterLevel : P.levels[i] ?? 0.6;
    const j = jit[i] ?? jit[0];
    const rideAmt = P.ride * 0.07 * Math.sin(frame * 0.03 * (0.5 + j.f) + j.ph) * prog(frame, 60 + d, 100 + d);
    const muted = !master && !!P.mutes[i];
    const lv = clamp(base + rideAmt);
    const lvShown = lv * settle;
    const capH = Math.min(travel * 0.12, cw * 0.62);
    const capW = Math.min(cw * 0.5, 74 * u);
    const slotW = Math.max(5 * u, cw * 0.065);
    const fx = cx + (master ? cw * 0.16 : cw * 0.14);
    const capY = T.faderBot - lvShown * (travel - capH * 0.2) - capH / 2;
    const chCol = master ? P.accent : cols[i % cols.length];

    // meter value
    const beatP = ((frame / fps) * (P.bpm / 60) + i * 0.17) % 1;
    const pump = Math.pow(1 - beatP, 2.2);
    const synth = 0.38 + 0.4 * Math.abs(Math.sin(frame * j.f + j.ph)) * (0.5 + 0.5 * Math.sin(frame * j.f2 + j.ph2) ** 2) + 0.2 * pump * (i % 3 === 0 ? 1.3 : 0.7);
    const real = au.bands[Math.min(au.bands.length - 1, Math.floor(((i + 0.5) / (n + 1)) * au.bands.length))] * 1.25;
    const raw = au.real ? real : synth;
    const mv = muted ? 0 : clamp(raw * lv * 1.25) * enter;
    const lit = Math.round(mv * SEG);
    const mcols = master ? 2 : 1;
    const mW = master ? cw * 0.09 : cw * 0.13;
    const meterX = master ? cx - cw * 0.3 : cx - cw * 0.3;
    const mTop = T.faderTop - 4 * u;
    const mBot = T.faderBot + 4 * u;
    const sh = (mBot - mTop) / SEG;

    // knob
    const kR = Math.min(cw * 0.2, 46 * u);
    const kv = master ? 0.5 : clamp(((P.pans[i] ?? 0) + 1) / 2);
    const kAng = lerp(-135, -135 + 270 * kv, prog(frame, 6 + d, 36 + d, ease.out)) ;
    const ar = (kAng * Math.PI) / 180;
    const nodes: React.ReactNode[] = [];
    // slot + ticks
    nodes.push(<rect key="slot" x={fx - slotW / 2} y={T.faderTop} width={slotW} height={travel} rx={slotW / 2} fill="#07080d" stroke={rgbaStr('#ffffff', 0.08)} strokeWidth={1.2 * u} />);
    for (let t = 0; t <= 10; t++) {
      const ty = T.faderTop + (travel * t) / 10;
      const big = t % 5 === 0;
      nodes.push(<line key={`tk${t}`} x1={fx + slotW * 1.4} x2={fx + slotW * (big ? 3.4 : 2.5)} y1={ty} y2={ty} stroke={rgbaStr(P.ink, big ? 0.45 : 0.22)} strokeWidth={1.4 * u} />);
    }
    // meter LEDs
    for (let c = 0; c < mcols; c++) {
      for (let s = 0; s < SEG; s++) {
        const pos = s / (SEG - 1);
        const on = s < (c === 1 ? Math.max(0, lit - (Math.sin(frame * 0.7 + 1.3) > 0.5 ? 1 : 0)) : lit);
        const col = pos > 0.84 ? P.hot : pos > 0.62 ? '#FFC53D' : P.accent;
        nodes.push(<rect key={`m${c}-${s}`} x={meterX + c * (mW + 3 * u)} y={mBot - (s + 1) * sh + sh * 0.14} width={mW} height={sh * 0.72} rx={1.5 * u} fill={col} opacity={on ? 1 : 0.12} />);
      }
    }
    // knob
    nodes.push(
      <g key="knob">
        <circle cx={cx} cy={T.knobY} r={kR * 1.28} fill="none" stroke={rgbaStr(P.ink, 0.12)} strokeWidth={2 * u} strokeDasharray={`${kR * 0.12} ${kR * 0.34}`} />
        <circle cx={cx} cy={T.knobY} r={kR} fill="#262a3a" stroke={rgbaStr('#ffffff', 0.16)} strokeWidth={2 * u} />
        <circle cx={cx} cy={T.knobY} r={kR * 0.78} fill="#171a27" />
        <line x1={cx + Math.cos(ar + Math.PI / 2) * kR * 0.25} y1={T.knobY + Math.sin(ar + Math.PI / 2) * kR * 0.25} x2={cx + Math.cos(ar + Math.PI / 2) * kR * 0.88} y2={T.knobY + Math.sin(ar + Math.PI / 2) * kR * 0.88} stroke={chCol} strokeWidth={Math.max(3 * u, kR * 0.13)} strokeLinecap="round" />
      </g>,
    );
    // fader cap
    nodes.push(
      <g key="cap" opacity={muted ? 0.55 : 1}>
        <rect x={fx - capW / 2} y={capY} width={capW} height={capH} rx={capH * 0.2} fill="#323649" stroke={rgbaStr('#ffffff', 0.22)} strokeWidth={1.5 * u} />
        <rect x={fx - capW / 2 + 3 * u} y={capY + 3 * u} width={capW - 6 * u} height={capH * 0.22} rx={capH * 0.08} fill={rgbaStr('#ffffff', 0.1)} />
        <rect x={fx - capW / 2 + 5 * u} y={capY + capH / 2 - 2.5 * u} width={capW - 10 * u} height={5 * u} rx={2.5 * u} fill={chCol} />
      </g>,
    );
    // mute button + label
    if (!master) {
      nodes.push(<rect key="mute" x={cx - cw * 0.26} y={T.muteY - 13 * u} width={cw * 0.52} height={26 * u} rx={7 * u} fill={muted ? P.hot : '#262a3a'} stroke={rgbaStr('#ffffff', 0.12)} strokeWidth={1.4 * u} />);
      nodes.push(
        <text key="mt" x={cx} y={T.muteY + labelFs * 0.3} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={labelFs * 0.72} fill={muted ? '#fff' : rgbaStr(P.ink, 0.5)}>
          M
        </text>,
      );
    }
    nodes.push(
      <text key="lb" x={cx} y={T.labelY} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={labelFs} letterSpacing={labelFs * 0.1} fill={master ? P.accent : rgbaStr(P.ink, 0.85)}>
        {(master ? P.masterLabel : chs[i]).toUpperCase().slice(0, 7)}
      </text>,
    );
    return (
      <g key={`st${master ? 'm' : i}`} opacity={prog(frame, d, d + 16)}>
        {master && <rect x={x0 - 4 * u} y={panelY + 14 * u} width={cw + 4 * u} height={panelH - 28 * u} rx={14 * u} fill={rgbaStr('#ffffff', 0.035)} />}
        {nodes}
      </g>
    );
  };

  const strips: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    strips.push(strip(i, false));
    if (i < n - 1) strips.push(<line key={`dv${i}`} x1={panelX + 22 * u + (i + 1) * sw} x2={panelX + 22 * u + (i + 1) * sw} y1={panelY + 26 * u} y2={panelY + panelH - 26 * u} stroke={rgbaStr('#ffffff', 0.05)} strokeWidth={1.5 * u} />);
  }
  if (P.showMaster) strips.push(strip(n, true));

  const bg = clear ? undefined : `radial-gradient(ellipse at 50% 40%, ${mix(P.background, P.accent, 0.1)} 0%, ${P.background} 66%)`;
  const titleFs = (portrait ? 52 : 56) * u;

  return (
    <AbsoluteFill style={{background: bg}}>
      {P.audioSrc && P.playAudio && <Audio src={resolveSrc(P.audioSrc)} />}
      <Svg>
        <defs>
          <linearGradient id="mxf-panel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mix(P.panel, '#ffffff', 0.05)} />
            <stop offset="1" stopColor={mix(P.panel, '#000000', 0.25)} />
          </linearGradient>
          <filter id="mxf-shadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy={24 * u} stdDeviation={30 * u} floodColor="#000" floodOpacity="0.5" />
          </filter>
        </defs>
        {P.title && (
          <g opacity={prog(frame, 4, 24)}>
            <text x={panelX} y={panelY - 26 * u} fontFamily={P.fontFamily || fonts.grotesk} fontWeight={700} fontSize={titleFs} fill={P.ink}>
              {P.title}
            </text>
            <text x={panelX + panelW} y={panelY - 30 * u} textAnchor="end" fontFamily={fonts.mono} fontWeight={700} fontSize={22 * u} letterSpacing={4 * u} fill={P.accent}>
              {P.caption.toUpperCase()}
            </text>
          </g>
        )}
        <g opacity={enter} transform={`translate(0 ${(1 - enter) * 40 * u})`}>
          <rect x={panelX} y={panelY} width={panelW} height={panelH} rx={26 * u} fill="url(#mxf-panel)" stroke={rgbaStr('#ffffff', 0.1)} strokeWidth={2 * u} filter="url(#mxf-shadow)" />
          {[[16, 16], [panelW - 16, 16], [16, panelH - 16], [panelW - 16, panelH - 16]].map(([ox, oy], k) => (
            <g key={k}>
              <circle cx={panelX + ox * u} cy={panelY + oy * u} r={5.5 * u} fill="#10121b" stroke={rgbaStr('#ffffff', 0.18)} strokeWidth={1.2 * u} />
              <line x1={panelX + (ox - 3) * u} x2={panelX + (ox + 3) * u} y1={panelY + oy * u} y2={panelY + oy * u} stroke={rgbaStr('#ffffff', 0.25)} strokeWidth={1.2 * u} transform={`rotate(${k * 40 + 20} ${panelX + ox * u} ${panelY + oy * u})`} />
            </g>
          ))}
          {strips}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const mixerFaders = defineMotion<Props>({
  id: 'mixer-faders',
  title: 'Mixer faders (channel strips + meters)',
  category: 'music',
  description:
    'A mixing-desk panel: per-channel pan knobs that turn to position, segmented green / amber / red level meters that bounce, faders that slide to their level values with a staggered overshoot and then ride gently, mute buttons, labels and a wider stereo master strip. Fully driven by `channels`, `levels`, `pans` and `mutes` arrays.',
  source: ['original (mixing console pattern)'],
  useFor: 'Music production and mixing tutorials, DAW / plugin promos, "the mix" explainers (levels = relative loudness of instruments or any 0-1 data as faders), studio and podcast-editing intros, audio-gear ads.',
  durationInFrames: 240,
  defaultProps: {
    title: 'The Mix',
    caption: 'Session 04',
    channels: ['Kick', 'Bass', 'Synth', 'Vocal', 'FX', 'Perc'],
    levels: [0.74, 0.62, 0.5, 0.82, 0.34, 0.56],
    pans: [0, -0.1, -0.5, 0, 0.6, 0.35],
    mutes: [false, false, false, false, false, false],
    masterLevel: 0.78,
    showMaster: true,
    masterLabel: 'Master',
    ride: 1,
    colors: ['#FF6B6B', '#FFB13D', '#3DDC97', '#5B8CFF', '#B47BFF', '#FF6FB5'],
    audioSrc: '',
    playAudio: false,
    bpm: 118,
    background: '#0A0B12',
    panel: '#1C1F2E',
    ink: '#F4F5FB',
    accent: '#3DDC97',
    hot: '#FF4D5E',
    fontFamily: '',
    seed: 6,
  },
  propDocs: {
    title: 'heading above the desk, empty to hide',
    caption: 'small caps tag at the right of the heading',
    channels: 'channel labels (1-12 recommended, 7 characters shown)',
    levels: 'fader position per channel 0-1',
    pans: 'knob position per channel -1..1 (left to right)',
    mutes: 'true per channel to light its mute button and silence the meter',
    masterLevel: 'master fader 0-1',
    showMaster: 'show the wider master strip with a stereo meter',
    masterLabel: 'label of the master strip',
    ride: 'amount of gentle fader riding after they settle (0 = still)',
    colors: 'fader cap / knob indicator colours, cycled per channel',
    audioSrc: 'soundtrack path/URL; meters follow its spectrum bands. Empty = synthetic beat',
    playAudio: 'also play audioSrc in this layer (leave false if the composition already plays it)',
    bpm: 'tempo of the synthetic meter pump',
    background: "background colour, or 'transparent' to overlay on video",
    panel: 'desk panel colour',
    ink: 'text colour',
    accent: 'meter green, master label',
    hot: 'meter red and mute colour',
    fontFamily: 'optional CSS font-family for the heading',
    seed: 'meter jitter seed',
  },
  component: MixerFaders,
  tags: ['mixer', 'faders', 'mixing desk', 'console', 'levels', 'audio', 'music', 'studio', 'daw', 'production', 'meter', 'vu', 'knob', 'pan', 'channels', 'sliders', 'sound'],
});
