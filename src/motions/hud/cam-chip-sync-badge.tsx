// Adapted from lemo-opuscar/styles/countdown/demo/index.html chip()/syncBadge() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CD, CamChip, SyncBadge, SyncKind, badgeWidth, chipWidth, eio, eo, isClear, la2Fonts, seg, useIdA} from '../../core/r2-la2-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {DEMO_IMAGES, Pic} from '../../core/ui-kit';

/**
 * Honest multi-source labelling: every feed gets a chip top-left (square sync dot, CAM code, name, small mono sub) and a
 * badge top-right — ● LIVE SYNC, ○ SAME WINDOW (hatched grey, not frame-synced) or RETIMED — plus a running timecode.
 * Chips wipe in from the left one after another; mid-way a feed re-syncs (dot and badge turn accent with a border flash).
 */

type Cam = {code: string; name: string; sub: string; sync: SyncKind};
type Props = {
  cams: Cam[];
  layout: 'grid' | 'single';
  images: string[];
  background: string;
  resyncIndex: number;
  resyncAt: number;
  timecode: boolean;
  startTime: string;
  accent: string;
};

const tc = (start: string, frame: number, fps: number) => {
  const [hh, mm, ss] = start.split(':').map((x) => Number(x) || 0);
  const tot = hh * 3600 + mm * 60 + ss + Math.floor(frame / fps);
  const ff = frame % fps;
  const p2 = (v: number) => String(v).padStart(2, '0');
  return `${p2(Math.floor(tot / 3600) % 24)}:${p2(Math.floor(tot / 60) % 60)}:${p2(tot % 60)}:${p2(ff)}`;
};

const CamChipSyncBadge: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w: W, h: H, u, fps, portrait, durationInFrames: D} = useStage();
  const id = useIdA('ccsb');
  const clear = isClear(p.background);
  const demo = p.background === 'demo';
  const M = 24 * u;
  const G = 9 * u;
  const cams = p.cams.length ? p.cams : [{code: 'CAM 1', name: 'Feed', sub: '', sync: 'live' as SyncKind}];
  const single = p.layout === 'single';
  const n = single ? 1 : Math.min(4, cams.length);
  const cols = single ? 1 : n <= 1 ? 1 : portrait ? 1 : 2;
  const rows = Math.ceil(n / cols);
  const cw = (W - 2 * M - (cols - 1) * G) / cols;
  const ch = (H - 2 * M - (rows - 1) * G) / rows;
  const rects = Array.from({length: n}, (_, i) => [M + (i % cols) * (cw + G), M + Math.floor(i / cols) * (ch + G), cw, ch] as const);
  const exit = 1 - eio(seg(frame, D - 12, D - 2));
  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : demo ? CD.bg : p.background}}>
      {demo &&
        rects.map((r, i) => (
          <div key={i} style={{position: 'absolute', left: r[0], top: r[1], width: r[2], height: r[3], overflow: 'hidden'}}>
            <Pic id={`${id}p${i}`} src={p.images.length ? p.images[(i + 3) % p.images.length] : undefined} seed={i * 7 + 2} time={frame} imgStyle={{transform: `scale(${1.04 + (0.04 * frame) / D})`, filter: 'contrast(1.07) saturate(0.9) brightness(0.96)'}} />
            <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.38) 100%)'}} />
          </div>
        ))}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {rects.map((r, i) => {
          const cam = cams[i];
          const t0 = 8 + i * 5;
          const resynced = i === p.resyncIndex && frame >= p.resyncAt;
          const kind: SyncKind = resynced ? 'live' : cam.sync;
          const s = u * (single ? (portrait ? 1.35 : 1.6) : Math.max(0.7, Math.min(1.15, r[2] / (640 * u))));
          const cwid = chipWidth(cam.code, cam.name, cam.sub, s);
          const bw = badgeWidth(kind, s);
          const fits = cwid + bw + 40 * s < r[2];
          const chipK = eo(seg(frame, t0, t0 + 0.25 * fps)) * exit;
          const badgeK = eo(seg(frame, t0 + 4, t0 + 4 + 0.2 * fps)) * exit;
          const fl = i === p.resyncIndex ? Math.max(0, 1 - Math.abs(frame - p.resyncAt - 4) / 9) : 0;
          const tcA = eo(seg(frame, t0 + 8, t0 + 16)) * exit;
          const by = fits ? r[1] + 14 * s : r[1] + r[3] - 40 * s;
          return (
            <g key={i}>
              {!single && <rect x={r[0] + 0.5} y={r[1] + 0.5} width={r[2] - 1} height={r[3] - 1} fill="none" stroke={CD.line} opacity={exit} />}
              <CamChip x={r[0] + 12 * s} y={r[1] + 12 * s} code={cam.code} name={cam.name} sub={cam.sub} synced={kind === 'live'} s={s} reveal={chipK} accent={p.accent} />
              <g transform={`translate(${r[0] + r[2] - 12 * s} ${by + 14 * s}) scale(${0.85 + 0.15 * badgeK}) translate(${-(r[0] + r[2] - 12 * s)} ${-(by + 14 * s)})`}>
                <SyncBadge x1={r[0] + r[2] - 12 * s} y={by} kind={kind} s={s} accent={p.accent} alpha={badgeK} />
              </g>
              {p.timecode && (
                <g opacity={tcA}>
                  <rect x={r[0] + 12 * s} y={r[1] + r[3] - 40 * s} width={150 * s} height={26 * s} fill={CD.plate} />
                  <circle cx={r[0] + 25 * s} cy={r[1] + r[3] - 27 * s} r={4 * s} fill={CD.live} opacity={Math.floor(frame / 15) % 2 ? 1 : 0.25} />
                  <text x={r[0] + 36 * s} y={r[1] + r[3] - 22 * s} fontFamily={la2Fonts.plex} fontWeight={500} fontSize={13 * s} fill={CD.ink}>
                    {tc(p.startTime, frame + i * 3, fps)}
                  </text>
                </g>
              )}
              {fl > 0 && <rect x={r[0] + 1.5 * u} y={r[1] + 1.5 * u} width={r[2] - 3 * u} height={r[3] - 3 * u} fill="none" stroke={p.accent} strokeWidth={3 * u} opacity={fl} />}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const camChipSyncBadge = defineMotion<Props>({
  id: 'cam-chip-sync-badge',
  title: 'Cam chip + sync badge',
  category: 'hud',
  description:
    'Per-feed labelling for split screens: a chip top-left (square sync dot, CAM code, name, mono sub) wipes in, a badge top-right pops — ● LIVE SYNC, ○ SAME WINDOW (hatched grey) or RETIMED — with a running timecode; mid-way one feed re-syncs and flashes. Transparent background = overlay.',
  source: ['lemo-opuscar styles/countdown (MIT, LemoLab) — demo/index.html chip, syncBadge, STYLE.md §8'],
  useFor: 'Honest multi-source footage labelling over any split screen, multicam recap, surveillance / CCTV look or UGC wall.',
  durationInFrames: 180,
  defaultProps: {
    cams: [
      {code: 'CAM 1', name: 'Harbour', sub: 'WIDE', sync: 'live'},
      {code: 'CAM 2', name: 'North gate', sub: 'FIXED', sync: 'live'},
      {code: 'CAM 3', name: 'Visitor phone', sub: 'UGC', sync: 'window'},
      {code: 'CAM 4', name: 'Drone', sub: 'UAS', sync: 'retimed'},
    ],
    layout: 'grid',
    images: DEMO_IMAGES,
    background: 'demo',
    resyncIndex: 2,
    resyncAt: 100,
    timecode: true,
    startTime: '14:02:00',
    accent: CD.org,
  },
  propDocs: {
    cams: '[{code, name, sub, sync: live|window|retimed}] one per feed (up to 4 in the grid)',
    layout: "'grid' = up to 4 cells, 'single' = one big chip + badge for a full-frame shot",
    images: 'demo feed images (only with background "demo")',
    background: "'demo' = procedural/demo feeds under the chrome, 'transparent' = overlay only, or a colour",
    resyncIndex: 'which feed re-syncs mid-way (-1 = none)',
    resyncAt: 'frame of the re-sync (dot + badge turn accent, border flash)',
    timecode: 'show a running timecode with a REC dot per feed',
    startTime: 'timecode start hh:mm:ss',
    accent: 'accent colour (synced dot, LIVE badge)',
  },
  component: CamChipSyncBadge,
  tags: ['chip', 'badge', 'label', 'camera', 'multicam', 'sync', 'live', 'cctv', 'surveillance', 'split screen', 'overlay', 'timecode', 'hud', 'honest', 'ugc', 'orange', 'dark'],
});
