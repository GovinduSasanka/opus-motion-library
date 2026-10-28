// Adapted from lemo-opuscar/styles/hologram-hud/demo/engine/hud.js (target box) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {
  buildDrone,
  cl,
  eio3,
  eo3,
  HoloCam,
  HoloChrome,
  HoloGlowDef,
  HoloPad,
  holoPaths,
  HoloStage,
  holoTheme,
  HoloWire,
  lerp,
  lf,
  seg,
} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Target = {label: string; part?: string; rect?: number[]; at: number};
type Props = {
  targets: Target[];
  subject: 'holo' | 'image' | 'none';
  src: string;
  background: string;
  hue: number;
  accent: number;
  showChrome: boolean;
  title: string;
  whip: number;
};

const LOCK_IN = 7; // .22 s at 30 fps

const TargetLockBox: React.FC<Props> = ({targets, subject, src, background, hue, accent, showChrome, title, whip}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const th = holoTheme(hue, accent);
  const holo = subject === 'holo';
  const showImg = subject === 'image' && !!src;
  const sorted = [...targets].sort((a, b) => a.at - b.at);

  // ---- camera: slow orbit; whip-follow toward the current target (starts before the next lock)
  const yaw = lerp(-0.75, 0.2, frame / 180);
  const pitch = 0.42 + 0.04 * Math.sin(frame / 50);
  const baseCam: HoloCam = {yaw, pitch, dist: 6.2, f: Math.min(w, h) * (portrait ? 1.45 : 1.4), cx: w / 2, cy: h * (portrait ? 0.5 : 0.53)};
  const propAng = frame * 0.9;
  const parts = holo ? buildDrone(propAng) : [];
  const raw = holo ? holoPaths(parts, {cam: baseCam}) : null;
  const centreOf = (tg: Target | undefined): [number, number] => {
    if (!tg) return [w / 2, h / 2];
    if (tg.rect && tg.rect.length === 4) return [(tg.rect[0] + tg.rect[2] / 2) * w, (tg.rect[1] + tg.rect[3] / 2) * h];
    const b = raw?.bbox[tg.part ?? ''];
    return b && isFinite(b[0]) ? [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2] : [w / 2, h / 2];
  };
  const offAt = (f: number): [number, number] => {
    // which target is "current" for whip purposes: switch 12 frames before its lock
    let ox = 0;
    let oy = 0;
    for (let i = 0; i < sorted.length; i++) {
      const tg = sorted[i];
      const k = eio3(seg(f, tg.at - LOCK_IN - 12, tg.at - LOCK_IN + 2));
      if (k <= 0) break;
      const c = centreOf(tg);
      const tx = (w / 2 - c[0]) * whip;
      const ty = (h / 2 - c[1]) * whip * 0.6;
      ox = lerp(ox, tx, k);
      oy = lerp(oy, ty, k);
    }
    return [ox, oy];
  };
  const [ox, oy] = holo ? offAt(frame) : [0, 0];
  const [pox] = holo ? offAt(frame - 1) : [0, 0];
  const vx = ox - pox;
  const cam: HoloCam = {...baseCam, cx: baseCam.cx + ox, cy: baseCam.cy + oy};

  // scan build-in for the holo subject
  const scanY = lerp(-0.7, 0.9, eo3(seg(frame, 0, 26)));
  const active = sorted.findIndex((tg, i) => frame >= tg.at - LOCK_IN && (i === sorted.length - 1 || frame < sorted[i + 1].at - LOCK_IN));
  const hotPart = active >= 0 && frame - sorted[active].at < 18 && frame >= sorted[active].at ? [sorted[active].part ?? ''] : [];
  const paths = holo ? holoPaths(parts, {cam, scanY: frame < 26 ? scanY : Infinity, hotParts: hotPart}) : null;
  const blurX = Math.min(14 * u, Math.max(0, Math.abs(vx) - 2 * u) * 0.45);

  const boxOf = (tg: Target): [number, number, number, number] | null => {
    if (tg.rect && tg.rect.length === 4) return [tg.rect[0] * w + ox, tg.rect[1] * h + oy, (tg.rect[0] + tg.rect[2]) * w + ox, (tg.rect[1] + tg.rect[3]) * h + oy];
    const b = paths?.bbox[tg.part ?? ''];
    if (!b || !isFinite(b[0])) return null;
    const pad = 14 * u;
    return [b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad];
  };

  const fs = 20 * u;
  return (
    <AbsoluteFill style={{background: background === 'transparent' ? 'transparent' : background, overflow: 'hidden'}}>
      {background !== 'transparent' && holo && <HoloStage theme={th} w={w} h={h} u={u} px={ox} py={oy} id="tlb-dots" />}
      {showImg && (
        <AbsoluteFill style={{transform: `translate(${ox}px, ${oy}px) scale(1.06)`}}>
          <Img src={resolveSrc(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
      )}
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <HoloGlowDef id="tlb-glow" u={u} />
          <filter id="tlb-mb" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={`${blurX.toFixed(2)} 0`} />
          </filter>
        </defs>
        {holo && paths && (
          <g filter={blurX > 0.5 ? 'url(#tlb-mb)' : undefined}>
            <HoloPad cam={cam} y={-0.45} r={2.1} theme={th} u={u} rot={frame * 0.004} />
            <HoloWire paths={paths} theme={th} u={u} glowId="tlb-glow" />
          </g>
        )}
        {/* target boxes */}
        {sorted.map((tg, i) => {
          const b = boxOf(tg);
          if (!b) return null;
          const lt = frame - (tg.at - LOCK_IN);
          if (lt < 0) return null;
          const isActive = i === active;
          const k = eo3(lt / LOCK_IN); // .22 s cubic ease-out
          const bw = b[2] - b[0];
          const bh = b[3] - b[1];
          const side = Math.max(bw, bh);
          // starts as an oversized square, rotated 45°, 30 % alpha; snaps onto the bbox
          const sw = lerp(side * 1.9, bw, k);
          const sh = lerp(side * 1.9, bh, k);
          const rot = lerp(45, 0, k);
          const cxB = (b[0] + b[2]) / 2;
          const cyB = (b[1] + b[3]) / 2;
          const alpha = isActive ? lerp(0.3, 1, k) : 0.42;
          const flash = frame >= tg.at && frame < tg.at + 3;
          const col = flash ? '#ffffff' : isActive ? th.line : th.dim;
          const arm = Math.min(sw, sh) * 0.22;
          const x0 = -sw / 2;
          const y0 = -sh / 2;
          const brackets = `M${x0} ${y0 + arm}V${y0}H${x0 + arm}M${-x0 - arm} ${y0}H${-x0}V${y0 + arm}M${-x0} ${-y0 - arm}V${-y0}H${-x0 - arm}M${x0 + arm} ${-y0}H${x0}V${-y0 - arm}`;
          const locked = frame >= tg.at;
          const tagIn = eo3(seg(frame, tg.at, tg.at + 6));
          const num = String(i + 1).padStart(2, '0');
          const tagTxt = isActive ? `TGT ${num} · LOCK · ${tg.label.toUpperCase()}`.slice(0, 30) : num;
          const tagW = tagTxt.length * (fs * 0.56 + 1.5 * u) + fs * 0.9;
          const ring = 9 * u + (flash ? 4 * u : 0);
          return (
            <g key={i} opacity={alpha}>
              <g transform={`translate(${cxB} ${cyB}) rotate(${rot})`}>
                {!locked && <rect x={x0} y={y0} width={sw} height={sh} fill="none" stroke={col} strokeOpacity={0.35} strokeWidth={1 * u} />}
                <path d={brackets} stroke={col} strokeWidth={(isActive ? 2.4 : 1.6) * u} fill="none" />
                {flash && <rect x={x0} y={y0} width={sw} height={sh} fill="#ffffff" opacity={0.12} />}
              </g>
              {/* anchor ring on the part body */}
              {locked && (
                <g opacity={isActive ? 1 : 0.6}>
                  <circle cx={cxB} cy={cyB} r={ring} fill="none" stroke={flash ? '#fff' : th.line} strokeWidth={1.6 * u} />
                  <circle cx={cxB} cy={cyB} r={2.4 * u} fill={th.hot} />
                  <path d={`M${cxB - ring - 7 * u} ${cyB}H${cxB - ring + 2 * u}M${cxB + ring - 2 * u} ${cyB}H${cxB + ring + 7 * u}`} stroke={th.line} strokeWidth={1.2 * u} />
                </g>
              )}
              {/* tag: TGT 0N · LOCK + part label */}
              {locked && (
                <g opacity={tagIn} transform={`translate(${b[0]} ${b[1] - 10 * u - (1 - tagIn) * 8 * u})`}>
                  <rect x={0} y={-fs * 1.45} width={tagW} height={fs * 1.45} fill="rgba(1,8,12,0.78)" stroke={isActive ? th.line : th.dim} strokeOpacity={0.5} strokeWidth={1 * u} />
                  <text x={fs * 0.45} y={-fs * 0.42} fontFamily={lf.techMono} fontSize={fs} fill={flash ? '#fff' : isActive ? th.line : th.dim} letterSpacing={1.5 * u}>
                    {tagTxt}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {showChrome && background !== 'transparent' && <HoloChrome w={w} h={h} u={u} theme={th} tl={`${title} // TARGET`} tr={`LOCKS ${String(Math.max(0, sorted.filter((t) => frame >= t.at).length)).padStart(2, '0')} / ${String(sorted.length).padStart(2, '0')}`} bl={`YAW ${(yaw * 57.3).toFixed(1)}°`} br={`F ${String(frame).padStart(4, '0')}`} on={cl(frame / 12)} />}
    </AbsoluteFill>
  );
};

export const targetLockBox = defineMotion<Props>({
  id: 'target-lock-box',
  title: 'Target lock box',
  category: 'hud',
  description:
    'Sci-fi target lock: an oversized faint square rotated 45° snaps onto a part in .22 s, flashes white for 3 frames, drops an anchor ring and a "TGT 01 · LOCK" mono tag; the camera whips to the next target. Default subject is a cyan hologram drone wireframe on a projector pad; works over images or as a transparent overlay.',
  source: ['lemo-opuscar styles/hologram-hud (MIT, LemoLab) — hud.js target box, DEMO.md motion numbers'],
  useFor: '"Look here now" pointers for product features, UI walkthroughs, sports/video analysis and spec explainers.',
  durationInFrames: 170,
  defaultProps: {
    targets: [
      {label: 'Rotor guard', part: 'rotorFR', at: 36},
      {label: 'Gimbal cam', part: 'camera', at: 82},
      {label: 'Battery', part: 'battery', at: 128},
    ],
    subject: 'holo',
    src: '',
    background: '#020709',
    hue: 188,
    accent: 38,
    showChrome: true,
    title: 'LUMEN D1',
    whip: 0.32,
  },
  propDocs: {
    targets: 'locks in order: {label, part (holo part: body|battery|camera|rotorFL|rotorFR|rotorBL|rotorBR) or rect [x,y,w,h] in 0..1 frame fractions, at (lock frame)}',
    subject: "'holo' = built-in hologram drone wireframe, 'image' = show src, 'none' = boxes only (use rect targets)",
    src: "image in public/ for subject 'image' (targets then need rect)",
    background: 'stage colour, or "transparent" to overlay the boxes on your own footage',
    hue: 'hologram line hue (188 = cyan)',
    accent: 'accent hue (38 = amber)',
    showChrome: 'corner brackets and mono readouts',
    title: 'product name in the HUD header',
    whip: '0..0.6 how far the camera whips toward each target',
  },
  component: TargetLockBox,
  tags: ['hud', 'target', 'lock-on', 'reticle', 'brackets', 'hologram', 'sci-fi', 'callout', 'pointer', 'overlay', 'product', 'spec', 'wireframe', 'drone', 'cyan'],
});
