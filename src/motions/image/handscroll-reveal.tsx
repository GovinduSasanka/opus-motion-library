// Adapted from lemo-opuscar/styles/ink-wash (STYLE.md §6/§8 handscroll, DEMO.md "Ending") (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {brushStroke, eio3, fbm2, h1, INK, InkPoint, InkRange, lerp, lf, RicePaper, seg} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  images: string[];
  panels: number;
  title: string;
  sealGlyph: string;
  direction: number;
  panSpeed: number;
  pullbackAt: number;
  mountColor: string;
  silkColor: string;
  tableColor: string;
  seed: number;
};

/** one procedural ink-landscape panel (seeded): mountains, water, boat, pines */
const InkPanel: React.FC<{w: number; h: number; seed: number; id: string}> = ({w, h, seed, id}) => {
  const boatX = w * (0.25 + h1(seed, 2) * 0.5);
  const boatY = h * 0.72;
  const bankY = h * (0.78 + h1(seed, 5) * 0.06);
  const pineX = w * (0.12 + h1(seed, 3) * 0.2);
  const pineY = bankY + h * 0.01;
  const pine = brushStroke({path: [[pineX, pineY], [pineX + w * 0.012, pineY - h * 0.2]], width: h * 0.014, dry: 0.35, tone: 0.9, seed: seed * 3 + 1, profile: 'even', samples: 24});
  const branches: InkPoint[][] = Array.from({length: 4}, (_, i) => {
    const by = pineY - h * 0.06 - i * h * 0.045;
    const dir = i % 2 ? 1 : -1;
    return [
      [pineX + w * 0.002, by],
      [pineX + dir * w * (0.03 + 0.012 * (3 - i)), by - h * 0.012],
    ];
  });
  return (
    <g>
      {/* near bank: a few loaded strokes */}
      {(() => {
        const y0 = bankY;
        const bank = brushStroke({path: [[w * 0.02, y0 + h * 0.03], [w * 0.3, y0], [w * 0.6, y0 + h * 0.015], [w * 0.95, y0 - h * 0.01]], width: h * 0.05, dry: 0.5, tone: 0.55, seed: seed * 7 + 2, profile: 'brush', darkSide: 1, samples: 48});
        return (
          <g>
            <path d={bank.body} fill={INK.ink} opacity={0.22} />
            {bank.bristles.map((b, j) => (
              <path key={j} d={b.d} stroke={INK.ink} strokeWidth={b.w} fill="none" strokeLinecap="round" opacity={b.o * 0.8} />
            ))}
          </g>
        );
      })()}
      {/* pine */}
      <g opacity={0.9}>
        {pine.bristles.map((b, j) => (
          <path key={j} d={b.d} stroke={INK.ink} strokeWidth={b.w} fill="none" strokeLinecap="round" opacity={b.o} />
        ))}
        {branches.map((br, j) => (
          <path key={'b' + j} d={`M${br[0][0]} ${br[0][1]}L${br[1][0]} ${br[1][1]}`} stroke={INK.ink} strokeWidth={h * 0.006} opacity={0.75} />
        ))}
        {branches.map((br, j) => (
          <ellipse key={'n' + j} cx={br[1][0]} cy={br[1][1] - h * 0.004} rx={w * 0.02} ry={h * 0.008} fill={INK.ink} opacity={0.5 + 0.2 * h1(j, seed)} />
        ))}
      </g>
      {/* boat: hull + figure + pole, open water = blank paper + faint streaks */}
      <g opacity={0.85}>
        <path d={`M${boatX - w * 0.035} ${boatY}Q${boatX} ${boatY + h * 0.02} ${boatX + w * 0.035} ${boatY}L${boatX + w * 0.028} ${boatY - h * 0.008}L${boatX - w * 0.028} ${boatY - h * 0.008}Z`} fill={INK.ink} opacity={0.82} />
        <path d={`M${boatX} ${boatY - h * 0.008}L${boatX} ${boatY - h * 0.034}M${boatX - w * 0.006} ${boatY - h * 0.028}a${w * 0.007} ${w * 0.007} 0 1 1 ${w * 0.012} 0`} stroke={INK.ink} strokeWidth={h * 0.005} fill="none" />
        <path d={`M${boatX + w * 0.004} ${boatY - h * 0.03}L${boatX + w * 0.012} ${boatY + h * 0.012}`} stroke={INK.ink} strokeWidth={h * 0.003} />
      </g>
      {Array.from({length: 5}, (_, i) => {
        const yy = h * (0.84 + i * 0.025);
        const x0 = w * (0.1 + h1(i, seed + 9) * 0.5);
        const len = w * (0.08 + h1(i, seed + 11) * 0.14);
        return <path key={'w' + i} d={`M${x0} ${yy}h${len}`} stroke={INK.ink} strokeWidth={h * 0.003} opacity={0.12 + 0.06 * fbm2(i, seed, 1)} />;
      })}
    </g>
  );
};

const HandscrollReveal: React.FC<Props> = ({images, panels, title, sealGlyph, direction, panSpeed, pullbackAt, mountColor, silkColor, tableColor, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames: D} = useStage();
  const n = Math.max(2, panels);
  // painting band
  const bandH = portrait ? h * 0.44 : h * 0.84;
  const bandY = portrait ? (h - bandH) / 2 : h * 0.08;
  const panelW = portrait ? w * 1.5 : w * 0.92;
  const totalW = panelW * n;
  const dir = direction >= 0 ? 1 : -1;

  // pan then pull back to the mounted scroll
  const panT = Math.min(frame, pullbackAt);
  const panX = panT * panSpeed * 0.0105 * panelW * 0.1 * dir; // ≈ panSpeed panel-widths / 10 s
  const maxPan = totalW - panelW;
  const px = Math.min(panX, maxPan);
  const pk = eio3(seg(frame, pullbackAt, pullbackAt + 100));
  const rollerW = 26 * u;
  const silk = 30 * u;
  const fitK = Math.min((w * 0.82) / (totalW + (silk + rollerW) * 2), (h * 0.5) / bandH);
  const S = lerp(1, fitK, pk);
  // during pan the band's left edge sits at (w-panelW)/2 - px ; pulled back it centres the whole scroll
  const panLeft = (w - panelW) / 2 - px;
  const endLeft = (w - totalW * fitK) / 2;
  const left = lerp(panLeft, endLeft, pk);
  const top = lerp(bandY, h / 2 - (bandH * fitK) / 2, pk);
  const sealT = seg(frame, pullbackAt + 104, pullbackAt + 110);
  const sealS = sealT <= 0 ? 0 : lerp(1.6, 1, eio3(sealT));
  const titleIn = eio3(seg(frame, 8, 26));

  return (
    <AbsoluteFill style={{background: tableColor, overflow: 'hidden'}}>
      {/* dark table with soft sheen */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 70% at 50% 42%, ${mountColor}22 0%, transparent 70%)`, opacity: pk}} />
      <div style={{position: 'absolute', left: left - (silk + rollerW) * S, top: top - silk * S * 0.6, width: (totalW + (silk + rollerW) * 2) * S, height: (bandH + silk * 1.2) * S, background: silkColor, boxShadow: pk > 0.02 ? `0 ${20 * u}px ${60 * u}px rgba(0,0,0,0.5)` : 'none'}}>
        {/* rollers */}
        <div style={{position: 'absolute', left: 0, top: -bandH * S * 0.02, width: rollerW * S, height: '104%', background: `linear-gradient(90deg, #2a1c12, #6b4a2c 45%, #2a1c12)`, borderRadius: rollerW * S}} />
        <div style={{position: 'absolute', right: 0, top: -bandH * S * 0.02, width: rollerW * S, height: '104%', background: `linear-gradient(90deg, #2a1c12, #6b4a2c 45%, #2a1c12)`, borderRadius: rollerW * S}} />
      </div>
      {/* the painting strip */}
      <div style={{position: 'absolute', left, top, width: totalW * S, height: bandH * S, overflow: 'hidden', background: INK.paper}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: totalW, height: bandH, transform: `scale(${S})`, transformOrigin: '0 0'}}>
          <RicePaper w={totalW} h={bandH} id="hsr-paper" seed={seed} />
          <svg width={totalW} height={bandH} style={{position: 'absolute', inset: 0}}>
            <InkRange w={totalW} h={bandH} y={bandH * 0.52} amp={bandH * 0.34} tone={0.15} seed={seed} id="hsr-r1" mist={0.5} />
            <InkRange w={totalW} h={bandH} y={bandH * 0.62} amp={bandH * 0.38} tone={0.3} seed={seed + 5} id="hsr-r2" mist={0.45} />
            {Array.from({length: n}, (_, i) => (
              <g key={i} transform={`translate(${i * panelW} 0)`}>
                {images[i] ? null : <InkPanel w={panelW} h={bandH} seed={seed + i * 17} id={`hsr-p${i}`} />}
              </g>
            ))}
          </svg>
          {images.slice(0, n).map((src, i) =>
            src ? (
              <div key={i} style={{position: 'absolute', left: i * panelW, top: 0, width: panelW, height: bandH, overflow: 'hidden'}}>
                <Img src={resolveSrc(src)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.9) sepia(0.14) contrast(0.96)', mixBlendMode: 'multiply', opacity: 0.92}} />
              </div>
            ) : null,
          )}
          {/* vertical title column on the first panel */}
          {title && (
            <div style={{position: 'absolute', left: panelW * 0.06, top: bandH * 0.1, writingMode: 'vertical-rl', fontFamily: lf.cormorantSC, fontWeight: 600, fontSize: Math.min(54 * u, bandH * 0.055), letterSpacing: 10 * u, color: INK.ink, opacity: titleIn * 0.92}}>
              {title}
            </div>
          )}
        </div>
      </div>
      {/* seal stamped on the end */}
      {sealT > 0 && (
        <div
          style={{
            position: 'absolute',
            left: left + totalW * S - 90 * u * fitK - 60 * u,
            top: top + bandH * S * 0.12,
            transform: `scale(${sealS})`,
            width: 64 * u,
            height: 64 * u,
            background: INK.vermilion,
            borderRadius: 4 * u,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: INK.paper,
            fontFamily: lf.cormorantSC,
            fontWeight: 600,
            fontSize: 34 * u,
            boxShadow: `0 0 ${3 * u}px rgba(176,46,34,0.6)`,
          }}
        >
          {sealGlyph}
        </div>
      )}
      <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at center, rgba(20,14,8,0) 55%, rgba(20,14,8,0.4) 100%)'}} />
      {frame > D - 8 && <AbsoluteFill style={{background: tableColor, opacity: (frame - (D - 8)) / 8}} />}
    </AbsoluteFill>
  );
};

export const handscrollReveal = defineMotion<Props>({
  id: 'handscroll-reveal',
  title: 'Handscroll reveal',
  category: 'image',
  description:
    'A long ink-wash landscape pans right-to-left like an unrolling Chinese handscroll (procedural mountains, pines, a lone boat — or your images printed on the paper), then the camera pulls back to the whole scroll mounted on silk with wooden rollers on a dark table, and a vermilion seal stamps the end.',
  source: ['lemo-opuscar styles/ink-wash (MIT, LemoLab) — STYLE.md §6/§8, DEMO.md ending'],
  useFor: 'Timelines, histories, journeys, supply chains — any linear story shown as one continuous artwork.',
  durationInFrames: 330,
  defaultProps: {
    images: [],
    panels: 4,
    title: 'RIVER OF HOURS',
    sealGlyph: '印',
    direction: 1,
    panSpeed: 7,
    pullbackAt: 190,
    mountColor: '#C9A86333',
    silkColor: '#8A6D3B',
    tableColor: '#17120C',
    seed: 5,
  },
  propDocs: {
    images: 'optional public/ images, one per panel (printed into the scroll); empty slots paint procedural ink landscapes',
    panels: 'number of panels in the scroll',
    title: 'vertical title column on the first panel',
    sealGlyph: 'character inside the vermilion seal',
    direction: '1 = pan right-to-left (classic), -1 = left-to-right',
    panSpeed: 'pan speed (≈ panel-widths per 10 s)',
    pullbackAt: 'frame the pull-back to the mounted scroll starts',
    mountColor: 'sheen colour behind the mounted scroll',
    silkColor: 'silk mount colour',
    tableColor: 'table / background colour',
    seed: 'landscape seed',
  },
  component: HandscrollReveal,
  tags: ['scroll', 'handscroll', 'ink', 'ink-wash', 'chinese', 'landscape', 'pan', 'timeline', 'history', 'journey', 'seal', 'paper', 'mountains', 'reveal', 'east-asian'],
});
