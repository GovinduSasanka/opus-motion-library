// Adapted from lemo-opuscar/styles/countdown/demo/index.html LAY, layoutAt(), render() merge branch, chip/syncBadge (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CD, CamChip, ClockBlock, SyncBadge, SyncKind, badgeWidth, chipWidth, clamp01, eio, eo, la2Fonts, lerpN, seg, useIdA} from '../../core/r2-la2-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {DEMO_IMAGES, Pic} from '../../core/ui-kit';

/**
 * Live countdown split-screen: one shot splits into 2, then 4, then a 3×3 wall of synced cameras around a big clock
 * (new cells pop one per count from dashed STANDBY placeholders, landing with an accent border flash); at zero every cell
 * slides to its tile of the full frame and they fuse into one full-screen picture with a warm flash while the clock inverts.
 */

type Cam = {code: string; name: string; sub: string; sync: SyncKind};
type Props = {
  images: string[];
  mergeSrc: string;
  cams: Cam[];
  zeroFrame: number;
  splitAt: number;
  quadAt: number;
  wallAt: number;
  popEvery: number;
  accent: string;
  header: string;
  background: string;
  standbyLabel: string;
  elapsedLabel: string;
};

type R = [number, number, number, number];
const lerpR = (a: R, b: R, k: number): R => [lerpN(a[0], b[0], k), lerpN(a[1], b[1], k), lerpN(a[2], b[2], k), lerpN(a[3], b[3], k)];

const SplitGridCountdown: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w: W, h: H, u, fps, portrait} = useStage();
  const id = useIdA('sgc');
  const M = 24 * u;
  const G = 9 * u;
  const IX = M;
  const IY = M;
  const IW = W - 2 * M;
  const IH = H - 2 * M;
  const grid = (c: number, r: number, cols: number, rows: number, cs = 1, rs = 1): R => {
    const cw = (IW - (cols - 1) * G) / cols;
    const ch = (IH - (rows - 1) * G) / rows;
    return [IX + c * (cw + G), IY + r * (ch + G), cs * cw + (cs - 1) * G, rs * ch + (rs - 1) * G];
  };
  const hudW = Math.min(640 * u, IW - 32 * u);
  const hudH = hudW * 0.4;
  const HUD: R = [IX + 16 * u, IY + IH - 16 * u - hudH, hudW, hudH];
  const n = p.images.length;
  const img = (i: number) => (n ? p.images[i % n] : undefined);
  const mergeSrc = p.mergeSrc || img(2);

  // layouts keyed by content id (cam ids c0..c7, 'clock')
  const wallSlots: [number, number][] = [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ];
  const L0: Record<string, R> = {c0: [IX, IY, IW, IH], clock: HUD};
  const L1: Record<string, R> = portrait ? {c0: grid(0, 0, 1, 2), c1: grid(0, 1, 1, 2), clock: HUD} : {c0: grid(0, 0, 2, 1), c1: grid(1, 0, 2, 1), clock: HUD};
  const L2: Record<string, R> = {c0: grid(0, 0, 2, 2), c1: grid(1, 0, 2, 2), c2: grid(0, 1, 2, 2), c3: grid(1, 1, 2, 2), clock: HUD};
  const L3: Record<string, R> = {clock: grid(1, 1, 3, 3)};
  wallSlots.forEach(([c, r], i) => (L3[`c${i}`] = grid(c, r, 3, 3)));
  const layouts = [
    {at: 0, cells: L0},
    {at: p.splitAt, cells: L1},
    {at: p.quadAt, cells: L2},
    {at: p.wallAt, cells: L3},
  ];
  const DUR = 0.34 * fps;
  const POP = 0.3 * fps;
  let li = 0;
  layouts.forEach((L, i) => {
    if (frame >= L.at) li = i;
  });
  const L = layouts[li];
  const Lp = layouts[Math.max(0, li - 1)];
  // cells new to the wall pop one by one (one per count)
  const newIds = Object.keys(L3).filter((k) => !(k in L2));
  const appear = (cid: string) => (newIds.includes(cid) ? p.wallAt + newIds.indexOf(cid) * p.popEvery : p.wallAt);
  const merging = frame >= p.zeroFrame;
  const km = eio(seg(frame, p.zeroFrame, p.zeroFrame + 0.42 * fps));
  const tileOf = (r: R): R => {
    const col = Math.min(2, Math.floor(((r[0] + r[2] / 2 - IX) / IW) * 3));
    const row = Math.min(2, Math.floor(((r[1] + r[3] / 2 - IY) / IH) * 3));
    return [(col * W) / 3, (row * H) / 3, W / 3 + 1, H / 3 + 1];
  };

  type Cell = {cid: string; r: R; isNew: boolean; landK: number; start: number};
  const cells: Cell[] = [];
  const ids = new Set([...Object.keys(L.cells), ...Object.keys(Lp.cells)]);
  ids.forEach((cid) => {
    const a = Lp.cells[cid];
    const b = L.cells[cid];
    const start = li === 3 ? appear(cid) : L.at;
    const dur = li === 3 && newIds.includes(cid) ? POP : DUR;
    const k = li === 0 ? 1 : eio(seg(frame, start, start + dur));
    let r: R | null = null;
    if (a && b) r = lerpR(a, b, k);
    else if (b) r = frame < start ? null : [b[0], b[1], b[2] * k, b[3]];
    else if (a && k < 1) r = [a[0], a[1], a[2] * (1 - k), a[3]];
    if (!r) return;
    if (merging) r = cid === 'clock' ? lerpR(r, HUD, km) : lerpR(r, tileOf(L3[cid] ?? r), km);
    cells.push({cid, r, isNew: !a && !!b && li > 0, landK: k, start: start + dur});
  });
  const camCells = cells.filter((c) => c.cid !== 'clock');
  const clockCell = cells.find((c) => c.cid === 'clock');
  const M0 = (frame - p.zeroFrame) / fps;
  const mergeA = merging ? eio(seg(frame, p.zeroFrame, p.zeroFrame + 0.34 * fps)) : 0;
  const chromeA = merging ? 1 - seg(frame, p.zeroFrame, p.zeroFrame + 0.2 * fps) : 1;
  const push = 1 + 0.05 * (frame / fps / 8);
  const grade = 'contrast(1.07) saturate(0.9) brightness(0.99)';
  // placeholders before cells connect
  const standby = li === 3 && !merging ? newIds.filter((cid) => frame < appear(cid) + POP * 0.5) : [];
  const flash = merging ? 0.7 * Math.exp(-M0 / 0.11) : 0;
  const fullChipK = eo(seg(frame, p.zeroFrame + 0.42 * fps, p.zeroFrame + 0.67 * fps));

  return (
    <AbsoluteFill style={{background: p.background}}>
      {mergeA > 0 && (
        <div style={{position: 'absolute', inset: 0, opacity: mergeA}}>
          <Pic id={`${id}mfull`} src={mergeSrc} seed={99} time={frame} imgStyle={{transform: `scale(${1.04 + 0.03 * clamp01(M0 / 2)})`, filter: grade}} />
        </div>
      )}
      {camCells.map(({cid, r}) => {
        const i = Number(cid.slice(1));
        return (
          <div key={cid} style={{position: 'absolute', left: r[0], top: r[1], width: Math.max(0, r[2]), height: Math.max(0, r[3]), overflow: 'hidden', background: '#000'}}>
            <Pic id={`${id}${cid}`} src={img(i)} seed={i * 13 + 5} time={frame} imgStyle={{transform: `scale(${push + 0.02 * (i % 3)})`, filter: grade}} />
            <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.36) 100%)', opacity: 1 - km}} />
            {mergeA > 0 && (
              <div style={{position: 'absolute', left: -r[0], top: -r[1], width: W, height: H, opacity: mergeA}}>
                <Pic id={`${id}m${cid}`} src={mergeSrc} seed={99} time={frame} imgStyle={{transform: `scale(${1.04 + 0.03 * clamp01(M0 / 2)})`, filter: grade}} />
              </div>
            )}
          </div>
        );
      })}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {standby.map((cid) => {
          const r = L3[cid];
          const a = eio(seg(frame, p.wallAt, p.wallAt + DUR));
          const s = u * Math.min(1, r[2] / (420 * u));
          return (
            <g key={cid} opacity={a}>
              <rect x={r[0]} y={r[1]} width={r[2]} height={r[3]} fill={CD.panel} />
              <rect x={r[0] + 0.5} y={r[1] + 0.5} width={r[2] - 1} height={r[3] - 1} fill="none" stroke={CD.line} strokeDasharray={`${6 * u} ${6 * u}`} />
              <circle cx={r[0] + r[2] / 2 - 58 * s} cy={r[1] + r[3] / 2 - 5 * s} r={6 * s} fill="none" stroke="rgba(124,135,141,0.5)" strokeWidth={2 * s} />
              <text x={r[0] + r[2] / 2 - 44 * s} y={r[1] + r[3] / 2} fontFamily={la2Fonts.plex} fontWeight={500} fontSize={15 * s} fill={CD.dim} letterSpacing={2 * s}>
                {p.standbyLabel}
              </text>
            </g>
          );
        })}
        {camCells.map(({cid, r, isNew, start}) => {
          const i = Number(cid.slice(1));
          const cam = p.cams[i % Math.max(1, p.cams.length)] ?? {code: `CAM ${i + 1}`, name: 'Feed', sub: '', sync: 'live' as SyncKind};
          if (r[2] < 160 * u || chromeA <= 0) return null;
          const s = u * Math.max(0.62, Math.min(1.05, r[2] / (620 * u)));
          const cw = chipWidth(cam.code, cam.name, cam.sub, s);
          const bw = badgeWidth(cam.sync, s);
          const fl = isNew ? 1 - seg(frame, start - POP * 0.4, start + 0.18 * fps) : 0;
          return (
            <g key={cid} opacity={chromeA}>
              <rect x={r[0] + 0.5} y={r[1] + 0.5} width={r[2] - 1} height={r[3] - 1} fill="none" stroke={CD.line} />
              <CamChip x={r[0] + 12 * s} y={r[1] + 12 * s} code={cam.code} name={cam.name} sub={cw + bw + 50 * s < r[2] ? cam.sub : ''} synced={cam.sync === 'live'} s={s} accent={p.accent} />
              {cw + bw + 40 * s < r[2] ? <SyncBadge x1={r[0] + r[2] - 12 * s} y={r[1] + 14 * s} kind={cam.sync} s={s} accent={p.accent} /> : <SyncBadge x1={r[0] + r[2] - 12 * s} y={r[1] + r[3] - 40 * s} kind={cam.sync} s={s} accent={p.accent} />}
              {fl > 0 && fl < 1 && <rect x={r[0] + 1.5 * u} y={r[1] + 1.5 * u} width={r[2] - 3 * u} height={r[3] - 3 * u} fill="none" stroke={p.accent} strokeWidth={3 * u} opacity={fl} />}
            </g>
          );
        })}
        {merging && fullChipK > 0 && (
          <g>
            <CamChip x={M} y={M} code={p.cams[0]?.code ?? 'CAM 1'} name={p.cams[0]?.name ?? ''} sub={p.cams[0]?.sub ?? ''} s={u * (portrait ? 1.1 : 1.15)} reveal={fullChipK} accent={p.accent} />
            <SyncBadge x1={W - M} y={M + 2 * u} kind="live" s={u * (portrait ? 1.1 : 1.15)} accent={p.accent} alpha={fullChipK} />
          </g>
        )}
        {clockCell && (
          <ClockBlock
            x={clockCell.r[0]}
            y={clockCell.r[1]}
            w={clockCell.r[2]}
            h={clockCell.r[3]}
            M={M0}
            s={u * Math.max(0.55, Math.min(1.25, clockCell.r[2] / (560 * u)))}
            header={[p.header, p.elapsedLabel]}
            accent={p.accent}
            fill={li < 3 || merging ? 'rgba(6,8,10,0.86)' : CD.panel}
          />
        )}
        {flash > 0.005 && <rect width={W} height={H} fill="#FFF8EC" opacity={flash} />}
      </svg>
    </AbsoluteFill>
  );
};

export const splitGridCountdown = defineMotion<Props>({
  id: 'split-grid-countdown',
  title: 'Split-grid countdown',
  category: 'image',
  description:
    'One shot splits into 2, then 4, then a 3×3 wall of synced cameras (chips + LIVE SYNC badges) around a big T− clock as zero approaches — new cells pop from dashed STANDBY slots — and at zero every cell slides to its tile and fuses into one full-screen picture with a warm flash.',
  source: ['lemo-opuscar styles/countdown (MIT, LemoLab) — demo/index.html LAY/layoutAt/render merge, chip, syncBadge, drawClock'],
  useFor: 'Launches, product drops, election / sports / score countdowns, multi-camera event recaps and "many sources agree" evidence beats; pass your own `images`.',
  durationInFrames: 240,
  defaultProps: {
    images: DEMO_IMAGES,
    mergeSrc: '',
    cams: [
      {code: 'CAM 1', name: 'Pad wide', sub: 'WIDE', sync: 'live'},
      {code: 'CAM 2', name: 'Tower', sub: 'FIXED', sync: 'live'},
      {code: 'CAM 3', name: 'Shoreline', sub: 'LONG LENS', sync: 'window'},
      {code: 'CAM 4', name: 'Control room', sub: 'ROOM 1', sync: 'live'},
      {code: 'CAM 5', name: 'Drone', sub: 'UAS', sync: 'live'},
      {code: 'CAM 6', name: 'Crowd', sub: 'PHONE', sync: 'window'},
      {code: 'CAM 7', name: 'Onboard', sub: 'VEHICLE', sync: 'live'},
      {code: 'CAM 8', name: 'Tracker', sub: 'RANGE', sync: 'retimed'},
    ],
    zeroFrame: 186,
    splitAt: 30,
    quadAt: 66,
    wallAt: 102,
    popEvery: 8,
    accent: CD.org,
    header: 'COUNTDOWN',
    background: CD.bg,
    standbyLabel: 'STANDBY',
    elapsedLabel: 'ELAPSED',
  },
  propDocs: {
    images: 'public/ image paths for the camera feeds (cycled; empty = procedural scenes)',
    mergeSrc: 'the full-screen shot everything fuses into at zero (default: the third image)',
    cams: '[{code, name, sub, sync: live|window|retimed}] chip + honest sync badge per feed',
    zeroFrame: 'frame of T−0: cells merge (0.42 s) and the clock inverts',
    splitAt: 'frame of the 1→2 split',
    quadAt: 'frame of the 2×2 layout',
    wallAt: 'frame of the 3×3 wall (clock moves to the centre cell)',
    popEvery: 'frames between new wall cells connecting',
    accent: 'accent colour (T−, synced dots, landing flash)',
    header: 'clock header text',
    background: 'ground colour',
    standbyLabel: 'text in a camera cell that has no feed yet',
    elapsedLabel: 'caption under the clock header',
  },
  component: SplitGridCountdown,
  tags: ['countdown', 'split screen', 'multicam', 'grid', 'wall', 'launch', 'live', 'sync', 'merge', 'many into one', 'clock', 't-minus', 'event', 'sports', 'election', 'cctv', 'orange', 'dark'],
});
