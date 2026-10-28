// Adapted from lemo-opuscar/styles/game-show/DEMO.md "Remix" + main_b.js item() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {resolveSrc} from '../../core/asset';
import {useSafeId} from '../../core/image-kit';
import {backOut, easeIO, easeOut3, mixHex, s1f, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Year-in-review shelf: every finished bit plays centre stage, then shrinks (x0.27) into the next slot of a shelf along the
 * bottom while a month ribbon across the top marks the current item; at the climax all thumbnails bounce together.
 * Each thumbnail is the item's scene re-rendered from its own local time frozen at the end of its hold — recomputed
 * from the frame every time, never cached.
 */
type Item = {label: string; month: number; color: string; kind: 'bars' | 'ring' | 'line' | 'badge' | 'grid'; value?: string; src?: string};
type Props = {
  items: Item[];
  title: string;
  hold: number;
  shrink: number;
  months: string[];
  accent: string;
  background: string;
};

const ItemScene: React.FC<{it: Item; tl: number; cw: number; ch: number; id: string}> = ({it, tl, cw, ch, id}) => {
  const e = easeOut3(sseg(tl, 4, 22));
  const c = it.color;
  const light = mixHex(c, '#ffffff', 0.35);
  const dark = mixHex(c, '#10132e', 0.55);
  const gx = -cw / 2;
  const gy = -ch / 2;
  const pw = cw * 0.84;
  const ph = ch * 0.44;
  const px = -pw / 2;
  const py = -ch * 0.2;
  let art: React.ReactNode = null;
  if (it.kind === 'bars') {
    const heights = [0.35, 0.55, 0.45, 0.78, 0.62, 0.95];
    art = heights.map((hv, i) => {
      const bw = pw / (heights.length * 1.5);
      const k = easeOut3(sseg(tl, 6 + i * 2.5, 22 + i * 2.5));
      return <rect key={i} x={px + i * bw * 1.5 + bw * 0.25} y={py + ph - ph * hv * k} width={bw} height={ph * hv * k} rx={bw * 0.18} fill={i === heights.length - 1 ? '#FFF0A0' : light} />;
    });
  } else if (it.kind === 'ring') {
    const r = Math.min(pw, ph) * 0.46;
    const k = easeOut3(sseg(tl, 6, 24)) * 0.78;
    const cL = 2 * Math.PI * r;
    art = (
      <g transform={`translate(0 ${py + ph / 2})`}>
        <circle r={r} fill="none" stroke={withAlpha('#ffffff', 0.18)} strokeWidth={r * 0.2} />
        <circle r={r} fill="none" stroke="#FFF0A0" strokeWidth={r * 0.2} strokeLinecap="round" strokeDasharray={`${cL * k} ${cL}`} transform="rotate(-90)" />
        <text textAnchor="middle" y={r * 0.2} fontFamily={s1f.dela} fontSize={r * 0.6} fill="#fff">{Math.round(k * 100)}%</text>
      </g>
    );
  } else if (it.kind === 'line') {
    const pts = [0.1, 0.25, 0.2, 0.45, 0.4, 0.62, 0.58, 0.9];
    const total = pts.length - 1;
    const k = easeOut3(sseg(tl, 5, 26)) * total;
    let d = '';
    pts.forEach((v, i) => {
      if (i > k + 0.0001 && i - 1 > k) return;
      const x = px + (i / total) * pw;
      const y = py + ph - v * ph;
      if (i <= k) d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      else {
        const f = k - (i - 1);
        const xp = px + ((i - 1) / total) * pw;
        const yp = py + ph - pts[i - 1] * ph;
        d += `L${(xp + (x - xp) * f).toFixed(1)} ${(yp + (y - yp) * f).toFixed(1)}`;
      }
    });
    art = <path d={d} fill="none" stroke="#FFF0A0" strokeWidth={ch * 0.03} strokeLinecap="round" strokeLinejoin="round" />;
  } else if (it.kind === 'badge') {
    const k = backOut(sseg(tl, 6, 20), 2);
    const r = Math.min(pw, ph) * 0.4;
    const spikes = Array.from({length: 24}, (_, i) => {
      const a = (i / 24) * Math.PI * 2;
      const rr = i % 2 ? r * 0.82 : r;
      return `${i ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
    }).join('') + 'Z';
    art = (
      <g transform={`translate(0 ${py + ph / 2}) scale(${k}) rotate(${(1 - k) * -40})`}>
        <path d={spikes} fill="#FFF0A0" />
        <circle r={r * 0.66} fill={dark} />
        <path d={`M${-r * 0.3} 0L${-r * 0.06} ${r * 0.24}L${r * 0.34} ${-r * 0.24}`} fill="none" stroke="#fff" strokeWidth={r * 0.14} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  } else {
    const cols = 12;
    const rows = 4;
    art = Array.from({length: cols * rows}, (_, i) => {
      const cx = i % cols;
      const cy = Math.floor(i / cols);
      const on = sseg(tl, 4 + ((cx * 7 + cy * 13) % 17), 8 + ((cx * 7 + cy * 13) % 17));
      const s = Math.min(pw / cols, ph / rows);
      return <circle key={i} cx={px + (cx + 0.5) * (pw / cols)} cy={py + (cy + 0.5) * (ph / rows)} r={s * 0.34 * (0.4 + 0.6 * on)} fill={on > 0.5 ? '#FFF0A0' : withAlpha('#ffffff', 0.3)} />;
    });
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mixHex(c, '#ffffff', 0.08)} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <clipPath id={`${id}-cl`}>
          <rect x={gx} y={gy} width={cw} height={ch} rx={ch * 0.07} />
        </clipPath>
      </defs>
      <rect x={gx} y={gy} width={cw} height={ch} rx={ch * 0.07} fill={`url(#${id}-bg)`} />
      {it.src ? (
        <g clipPath={`url(#${id}-cl)`}>
          <image href={resolveSrc(it.src)} x={gx} y={gy} width={cw} height={ch} preserveAspectRatio="xMidYMid slice" />
          <rect x={gx} y={gy + ch * 0.55} width={cw} height={ch * 0.45} fill="rgba(0,0,0,0.35)" />
        </g>
      ) : (
        <g opacity={e}>{art}</g>
      )}
      <text x={gx + cw * 0.06} y={gy + ch * 0.2} fontFamily={s1f.dela} fontSize={ch * 0.13} fill="#fff" opacity={easeOut3(sseg(tl, 0, 14))}>
        {it.label}
      </text>
      {it.value && (
        <text x={gx + cw * 0.06} y={gy + ch * 0.9} fontFamily={s1f.barlow} fontWeight={600} fontSize={ch * 0.09} letterSpacing={ch * 0.012} fill="#FFF0A0" opacity={easeOut3(sseg(tl, 8, 20))}>
          {it.value}
        </text>
      )}
      <rect x={gx} y={gy} width={cw} height={ch} rx={ch * 0.07} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={ch * 0.012} />
    </g>
  );
};

const RemixThumbnailShelf: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const uid = useSafeId('rts');
  const n = Math.max(1, p.items.length);
  const t0 = 12;
  const per = p.hold + p.shrink;
  const climax = t0 + n * per + 4;
  const cw = portrait ? w * 0.84 : Math.min(w * 0.5, h * 0.6 * 1.6);
  const ch = portrait ? cw * 0.72 : cw * 0.6;
  const cxm = w / 2;
  const cym = portrait ? h * 0.4 : h * 0.43;
  const shelfY = portrait ? h * 0.84 : h * 0.835;
  const pitch = w / (n + 1);
  const s = Math.min(0.27, (pitch * 0.86) / cw);
  // shared hop at the climax: one jump per beat (15 frames)
  const hp = frame >= climax ? (frame - climax) / 15 : -1;
  const hopY = hp >= 0 && hp < 3 ? -Math.abs(Math.sin(Math.PI * hp)) * 34 * u : 0;
  const landSquash = hp >= 0 && hp < 3 ? 1 - 0.1 * Math.max(0, 1 - Math.abs(Math.sin(Math.PI * hp)) * 6) : 1;
  const cur = clamp(Math.floor((frame - t0) / per), 0, n - 1);
  const inClimax = frame >= climax;
  // ribbon
  const rh = 64 * u;
  const rx0 = w * 0.07;
  const rx1 = w * 0.93;
  const mx = (m: number) => rx0 + ((m + 0.5) / 12) * (rx1 - rx0);
  const curMonth = p.items[cur]?.month ?? 0;
  const rt = easeOut3(sseg(frame, 0, 14));
  // marker travels between months
  const prevMonth = p.items[Math.max(0, cur - 1)]?.month ?? curMonth;
  const mk = frame < t0 ? mx(curMonth) : mx(prevMonth + (curMonth - prevMonth) * easeIO(sseg(frame - t0 - cur * per, 0, 8)));
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mixHex(p.background, '#2A2F6B', 0.55)} />
            <stop offset="1" stopColor={p.background} />
          </linearGradient>
          <radialGradient id={`${uid}-sp`} cx="50%" cy="38%" r="55%">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.16} />
            <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#${uid}-bg)`} />
        <rect width={w} height={h} fill={`url(#${uid}-sp)`} />
        {/* month ribbon */}
        <g opacity={rt} transform={`translate(0 ${(1 - rt) * -20 * u})`}>
          <rect x={rx0 - 20 * u} y={30 * u} width={rx1 - rx0 + 40 * u} height={rh} rx={rh / 2} fill="rgba(255,255,255,0.07)" />
          {p.months.slice(0, 12).map((m, i) => {
            const done = p.items.some((it, k) => it.month === i && frame >= t0 + k * per + p.hold * 0.4);
            return (
              <g key={i} transform={`translate(${mx(i)} ${30 * u + rh / 2})`}>
                <circle r={5 * u} fill={done ? p.accent : 'rgba(255,255,255,0.25)'} />
                <text y={-14 * u} textAnchor="middle" fontFamily={s1f.barlow} fontWeight={600} fontSize={Math.min(15 * u, (rx1 - rx0) / 12 * 0.34)} letterSpacing={u} fill={done ? '#fff' : '#8C93C4'} dy={26 * u}>
                  {m}
                </text>
              </g>
            );
          })}
          <g transform={`translate(${mk} ${30 * u + rh / 2})`}>
            <circle r={13 * u} fill="none" stroke={p.accent} strokeWidth={3 * u} />
          </g>
        </g>
        {/* shelf */}
        <g opacity={easeOut3(sseg(frame, 4, 20))}>
          <rect x={w * 0.04} y={shelfY + (ch * s) / 2 + 8 * u} width={w * 0.92} height={14 * u} rx={7 * u} fill="rgba(255,255,255,0.12)" />
          <rect x={w * 0.04} y={shelfY + (ch * s) / 2 + 8 * u} width={w * 0.92} height={3 * u} rx={1.5 * u} fill="rgba(255,255,255,0.35)" />
        </g>
        {/* items */}
        {p.items.map((it, i) => {
          const st = t0 + i * per;
          if (frame < st) return null;
          const f = frame - st;
          const tl = Math.min(f, p.hold - 0.01); // frozen at hold end
          const shr = easeIO(sseg(f, p.hold, p.hold + p.shrink));
          const pop = backOut(sseg(f, 0, 9), 1.7);
          const sx = (i + 1) * pitch;
          const x = cxm + (sx - cxm) * shr;
          const y = cym + (shelfY - cym) * shr + (shr >= 1 ? hopY : 0);
          const sc = (0.55 + 0.45 * pop) * (1 + (s / 1 - 1) * shr) * (shr >= 1 ? 1 : 1);
          const settle = shr >= 1 ? 1 + 0.06 * Math.exp(-(f - p.hold - p.shrink) / 4) * Math.cos((f - p.hold - p.shrink) * 0.9) : 1;
          const sq = shr >= 1 ? landSquash : 1;
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${sc * settle * (1 / sq)} ${sc * settle * sq})`} opacity={clamp(f / 4)}>
              {shr > 0 && <ellipse cy={ch * 0.5 + 6} rx={cw * 0.42} ry={ch * 0.05} fill="rgba(0,0,0,0.35)" />}
              <ItemScene it={it} tl={tl} cw={cw} ch={ch} id={`${uid}i${i}`} />
            </g>
          );
        })}
        {inClimax && (
          <text x={w / 2} y={cym} textAnchor="middle" fontFamily={s1f.dela} fontSize={Math.min(w * 0.09, 120 * u, (w * 0.9) / (Math.max(6, [...p.title].length) * 0.86))} fill="#FFF0A0" stroke="#10132e" strokeWidth={10 * u} paintOrder="stroke" strokeLinejoin="round" opacity={easeOut3(sseg(frame, climax, climax + 10))} transform={`translate(0 ${-Math.abs(hopY) * 0.4}) rotate(-3 ${w / 2} ${cym})`}>
            {p.title}
          </text>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const remixThumbnailShelf = defineMotion<Props>({
  id: 'remix-thumbnail-shelf',
  title: 'Remix thumbnail shelf',
  category: 'ui',
  description:
    'Each finished item plays centre stage then shrinks to x0.27 into the next slot of a shelf along the bottom while a month ribbon on top tracks it; at the end the title lands and all thumbnails bounce together on the beat.',
  source: ['lemo-opuscar styles/game-show DEMO.md Remix + main_b.js item() (MIT, LemoLab)'],
  useFor: 'Year-in-review, release recaps, "everything we shipped" montages and portfolio roundups.',
  durationInFrames: 270,
  defaultProps: {
    items: [
      {label: 'Search', month: 0, color: '#E8486B', kind: 'bars', value: '+38% FASTER'},
      {label: 'Sync', month: 2, color: '#2F7BE8', kind: 'ring', value: '99.9% UPTIME'},
      {label: 'Mobile', month: 5, color: '#16A085', kind: 'line', value: '2.4M INSTALLS'},
      {label: 'Teams', month: 8, color: '#8A4FE0', kind: 'badge', value: 'NEW IN SEPTEMBER'},
      {label: 'Insights', month: 10, color: '#E08A1F', kind: 'grid', value: '12 NEW REPORTS'},
    ],
    title: 'THE YEAR SO FAR',
    hold: 26,
    shrink: 12,
    months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
    accent: '#FFD23F',
    background: '#0B0E24',
  },
  propDocs: {
    items: 'list of {label, month (0-11), color, kind: bars|ring|line|badge|grid, value (caption), src (optional image)}',
    title: 'text that lands at the climax while all thumbnails bounce',
    hold: 'frames each item plays centre stage',
    shrink: 'frames the shrink into its shelf slot takes (ease in-out)',
    months: 'twelve ribbon labels',
    accent: 'ribbon marker / completed dot colour',
    background: 'stage colour',
  },
  component: RemixThumbnailShelf,
  tags: ['recap', 'year in review', 'shelf', 'thumbnails', 'montage', 'timeline', 'ribbon', 'game show', 'release notes', 'shrink', 'bounce', 'portfolio'],
});
