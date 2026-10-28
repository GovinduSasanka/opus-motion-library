import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {Cable, DraftPaper, ISO, IsoBox, IsoShadow, ValuePill, autoFrameAt, easeOutBack, easeOutCubic, fitCamera, isoBounds, isoPt, lin, shadeHex, x58Fonts} from '../../core/r2-x58-kit';
import {IsoHeader, around} from '../../core/r2-s2-kit';

/**
 * x8 auto-frame camera: as parts are added or removed the whole scene pans and zooms smoothly so the current
 * assembly fills the scene area with a constant margin, while the UI never moves. Re-frame 0.7 s easeInOutCubic
 * starting at the step change; margin ≈ 8 %; zoom is largest on the bare scene and smallest on the full project.
 * The demo builds a small system diagram step by step; dashed guides show the margin box and the content bounds.
 */
type Block = {id: string; label: string; x: number; y: number; w?: number; d?: number; h?: number; color?: string};
type Link = {from: string; to: string; color?: string};
type StepSpec = {title: string; blocks: Block[]; links: Link[]};
type Props = {
  steps: StepSpec[];
  stepAt: number[];
  margin: number;
  frames: number;
  minScale: number;
  maxScale: number;
  guides: boolean;
  zoomReadout: boolean;
  header: string;
  background: string;
  palette: string[];
  zoomLabel?: string;
  marginLabel?: string;
  boundsLabel?: string;
};

const bk = (id: string, label: string, x: number, y: number, h = 1.6): Block => ({id, label, x, y, w: 3, d: 3, h});

const STEPS: StepSpec[] = (() => {
  const client = bk('client', 'Client', 0, 0);
  const api = bk('api', 'API', 6, 0, 2.2);
  const db = bk('db', 'Database', 12, -3.4, 1.4);
  const cache = bk('cache', 'Cache', 12, 3.4, 1.0);
  const w1 = bk('w1', 'Worker A', 19, -6.6, 1.2);
  const w2 = bk('w2', 'Worker B', 19, 0, 1.2);
  const w3 = bk('w3', 'Worker C', 19, 6.6, 1.2);
  return [
    {title: 'One client', blocks: [client], links: []},
    {title: 'Add an API', blocks: [client, api], links: [{from: 'client', to: 'api'}]},
    {title: 'Add storage', blocks: [client, api, db, cache], links: [{from: 'client', to: 'api'}, {from: 'api', to: 'db'}, {from: 'api', to: 'cache'}]},
    {
      title: 'Scale out',
      blocks: [client, api, db, cache, w1, w2, w3],
      links: [{from: 'client', to: 'api'}, {from: 'api', to: 'db'}, {from: 'api', to: 'cache'}, {from: 'api', to: 'w1'}, {from: 'api', to: 'w2'}, {from: 'api', to: 'w3'}],
    },
  ];
})();

const AutoFrameCamera: React.FC<Props> = ({steps, stepAt, margin, frames, minScale, maxScale, guides, zoomReadout, header, background, palette, zoomLabel = 'ZOOM', marginLabel = 'margin box', boundsLabel = 'content bounds'}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const k = 34 * u;
  const n = Math.max(1, steps.length);
  const at = steps.map((_, i) => stepAt[i] ?? i * 55);
  const hdr = Math.max(46 * u, h * 0.065);
  const foot = h * 0.1;
  const vx = w * 0.03;
  const vy = hdr + h * 0.03;
  const vw = w * 0.94;
  const vh = h - vy - foot;
  const boxOf = (b: Block) => ({x: b.x, y: b.y, z: 0, w: b.w ?? 3, d: b.d ?? 3, hgt: (b.h ?? 1.6) + 0.9});
  const camFor = (si: number) => fitCamera(isoBounds(steps[Math.min(n - 1, si)].blocks.map(boxOf), k), vx, vy, vw, vh, margin, minScale, maxScale);
  const {cam, step} = autoFrameAt(frame, at, camFor, frames, 0);
  const S = at[step];
  const cur = steps[step];
  const prevIds = new Set(step > 0 ? steps[step - 1].blocks.map((b) => b.id) : []);
  const entering = cur.blocks.filter((b) => !prevIds.has(b.id));
  const startOf = new Map<string, number>();
  entering.forEach((b, j) => startOf.set(b.id, S + 6 + j * 4));
  const lastStart = S + 6 + Math.max(0, entering.length - 1) * 4;
  const byId = new Map(cur.blocks.map((b) => [b.id, b]));
  const sorted = [...cur.blocks].sort((a, b) => a.x + a.y - (b.x + b.y));

  // guide rectangles (screen space)
  const pad = Math.min(vw, vh) * margin;
  const bnds = isoBounds(cur.blocks.map(boxOf), k);
  const gx0 = bnds.x0 * cam.scale + cam.tx;
  const gx1 = bnds.x1 * cam.scale + cam.tx;
  const gy0 = bnds.y0 * cam.scale + cam.ty;
  const gy1 = bnds.y1 * cam.scale + cam.ty;
  const fs = k * (portrait ? 0.85 : 0.5);
  const zoom = cam.scale;

  return (
    <AbsoluteFill style={{background}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <DraftPaper id="afc-paper" w={w} h={h} u={u} k={k * 1.1} ox={cam.tx} oy={cam.ty} ornaments={false} />
        <g transform={`translate(${cam.tx} ${cam.ty}) scale(${cam.scale})`}>
          {sorted.map((b, i) => {
            const st = startOf.get(b.id);
            const t = st === undefined ? 1 : easeOutBack(lin(frame, st, st + 9), 1.25);
            if (st !== undefined && frame < st) return null;
            const col = b.color ?? palette[cur.blocks.findIndex((q) => q.id === b.id) % palette.length];
            const bw = b.w ?? 3;
            const bd = b.d ?? 3;
            const bh = b.h ?? 1.6;
            const [bx, by] = isoPt(b.x + bw / 2, b.y + bd / 2, 0, k);
            const [lx, ly] = isoPt(b.x + bw / 2, b.y + bd / 2, bh + 0.9, k);
            const node = (
              <g>
                <IsoShadow x={b.x} y={b.y} w={bw} d={bd} k={k} u={u} opacity={0.4} />
                <IsoBox x={b.x} y={b.y} z={0} w={bw} d={bd} hgt={bh} k={k} color={col} top={shadeHex(col, 0.22)} right={shadeHex(col, -0.22)} sw={k * 0.05} />
                <text x={lx} y={ly} textAnchor="middle" fontFamily={x58Fonts.barlowSC} fontWeight={700} fontSize={fs} letterSpacing={fs * 0.08} fill={ISO.text}>
                  {b.label.toUpperCase()}
                </text>
              </g>
            );
            return <g key={b.id}>{around(bx, by, Math.max(0.01, 0.1 + 0.9 * t), Math.min(1, t * 2), node)}</g>;
          })}
          {cur.links.map((l, i) => {
            const a = byId.get(l.from);
            const b = byId.get(l.to);
            if (!a || !b) return null;
            const isNew = startOf.has(l.to) || startOf.has(l.from);
            const st = isNew ? lastStart + 10 + i * 2 : 0;
            const t = isNew ? easeOutCubic(lin(frame, st, st + 8)) : 1;
            if (t <= 0) return null;
            const pa = isoPt(a.x + (a.w ?? 3) / 2, a.y + (a.d ?? 3) / 2, (a.h ?? 1.6) * 0.5, k);
            const pb = isoPt(b.x + (b.w ?? 3) / 2, b.y + (b.d ?? 3) / 2, (b.h ?? 1.6) * 0.5, k);
            return <Cable key={`${l.from}-${l.to}`} a={pa} b={pb} lift={k * 0.9} color={l.color ?? ISO.teal} width={k * 0.14} t={t} />;
          })}
        </g>
        {guides ? (
          <g fill="none" strokeDasharray={`${6 * u} ${5 * u}`}>
            <rect x={vx + pad} y={vy + pad} width={vw - pad * 2} height={vh - pad * 2} stroke={ISO.orange} strokeWidth={1.5 * u} opacity={0.9} rx={6 * u} />
            <rect x={gx0} y={gy0} width={gx1 - gx0} height={gy1 - gy0} stroke={ISO.teal} strokeWidth={1.5 * u} opacity={0.85} />
          </g>
        ) : null}
        <IsoHeader w={w} h={h} u={u} title={header} index={step + 1} total={n} right={cur.title.toUpperCase()} />
        {zoomReadout ? <ValuePill x={w * 0.03} y={h - foot * 0.48} text={`${zoomLabel} ${zoom.toFixed(2)}x`} size={Math.max(13 * u, h * 0.017)} /> : null}
        {guides ? (
          <g fontFamily={x58Fonts.mono} fontSize={Math.max(14 * u, h * 0.017)}>
            <text x={w * 0.97} y={h - foot * 0.62} textAnchor="end" fill={ISO.orange}>
              {`- - ${marginLabel}`}
            </text>
            <text x={w * 0.97} y={h - foot * 0.3} textAnchor="end" fill={ISO.teal}>
              {`- - ${boundsLabel}`}
            </text>
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};

export const autoFrameCamera = defineMotion<Props>({
  id: 'auto-frame-camera',
  title: 'Auto-frame camera',
  category: 'camera',
  description:
    'Self-framing camera for build-up diagrams: as blocks are added the isometric scene pans and zooms (0.7 s easeInOutCubic) so the current assembly always fills the viewport with a constant margin, while the header and readouts never move. Dashed guides show the margin box and the content bounds.',
  source: ['video x8 0:01.0-0:01.8, 0:54.3-0:54.75'],
  useFor: 'Keeps any multi-step build-up diagram readable without hand-keyed cameras; the same `fitCamera` / `autoFrameAt` helpers (src/core/r2-x58-kit.tsx) drive any step-based motion.',
  durationInFrames: 240,
  defaultProps: {
    steps: STEPS,
    stepAt: [0, 55, 110, 170],
    margin: 0.08,
    frames: 21,
    minScale: 0.4,
    maxScale: 3,
    guides: true,
    zoomReadout: true,
    header: 'Auto frame',
    background: ISO.paper,
    palette: ['#4D588A', '#21A69A', '#E5A24C', '#C56E60', '#3F64B5', '#7A8FC6', '#6FB36F'],
    zoomLabel: 'ZOOM',
    marginLabel: 'margin box',
    boundsLabel: 'content bounds',
  },
  propDocs: {
    steps: 'array of {title, blocks:[{id,label,x,y,w,d,h,color}], links:[{from,to}]}; blocks are diffed by id between steps',
    stepAt: 'start frame of each step (the camera starts moving here)',
    margin: 'margin around the content as a fraction of the viewport',
    frames: 're-frame duration in frames (0.6-0.8 s)',
    minScale: 'smallest zoom',
    maxScale: 'largest zoom',
    guides: 'show the dashed margin box and content bounds',
    zoomReadout: 'show the live zoom pill',
    header: 'top bar word',
    background: 'paper colour',
    palette: 'block colours',
    zoomLabel: 'word before the zoom value in the readout pill',
    marginLabel: 'legend text for the orange margin guide ("- - " is prefixed)',
    boundsLabel: 'legend text for the teal content-bounds guide ("- - " is prefixed)',
  },
  component: AutoFrameCamera,
  tags: ['camera', 'auto-frame', 'framing', 'zoom', 'pan', 'isometric', 'diagram', 'build-up', 'architecture', 'steps', 'bounding-box', 'margin', 'explainer', 'helper'],
});
