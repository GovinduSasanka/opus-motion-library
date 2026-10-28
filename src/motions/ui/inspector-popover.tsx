import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {DraftPaper, ISO, IsoBox, IsoPart, IsoShadow, cl, easeInOutCubic, easeOutBack, isoPt, lin, rgba, wrap, x58Fonts, type PartKind} from '../../core/r2-x58-kit';

/**
 * x8 inspector popover: a small floating property card next to the selected object: title + close ×, a one-line
 * description, a segmented chip group with the active chip filled navy, a teal slider with its live value, a toggle
 * and a "+ ZOOM TO IT" button with a teal hint. It fades/scales in when the object is clicked (0.15 s, 0.96 → 1) and
 * fades out on step change (0.12 s). The slider knob moves in sync with the object; a chip switch is a 1-frame swap.
 */
type Props = {
  title: string;
  description: string;
  chips: string[];
  activeChip: number;
  switchChipTo: number;
  switchAt: number;
  sliderLabel: string;
  sliderFrom: number;
  sliderTo: number;
  sliderMin: number;
  sliderMax: number;
  unit: string;
  sliderAt: number;
  toggle: string;
  toggleAt: number;
  button: string;
  hint: string;
  openAt: number;
  closeAt: number;
  accent: string;
  navy: string;
  background: string;
  scene: boolean;
};

const CHIP_KIND: Record<string, string> = {car: 'car', box: 'box', ball: 'ball', wall: 'wall', sensor: 'sensor', servo: 'servo', led: 'led', motor: 'motor'};

const InspectorPopover: React.FC<Props> = ({title, description, chips, activeChip, switchChipTo, switchAt, sliderLabel, sliderFrom, sliderTo, sliderMin, sliderMax, unit, sliderAt, toggle, toggleAt, button, hint, openAt, closeAt, accent, navy, background, scene}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const chip = frame >= switchAt && switchChipTo >= 0 ? switchChipTo : activeChip;
  const kind = CHIP_KIND[(chips[chip] ?? 'car').toLowerCase()] ?? 'car';
  const sv = sliderFrom + (sliderTo - sliderFrom) * easeInOutCubic(lin(frame, sliderAt, sliderAt + 27));
  const sFrac = cl((sv - sliderMin) / Math.max(1e-6, sliderMax - sliderMin));
  const on = frame >= toggleAt;
  const drive = on ? Math.sin(((frame - toggleAt) / 30) * Math.PI * 0.9) * 1.1 : 0;

  // layout
  const k = (portrait ? 50 : 58) * u;
  const ox = portrait ? w * 0.5 : w * 0.3;
  const oy = portrait ? h * 0.3 : h * 0.52;
  const objX = (sFrac - 0.5) * 3 + drive;
  const cw = portrait ? w * 0.8 : Math.min(w * 0.34, 640 * u);
  const fs = cw * 0.047;
  const cx0 = portrait ? (w - cw) / 2 : Math.min(w - cw - w * 0.04, ox + k * 6.5);
  const rowH = fs * 2.7;

  // popover animation
  const tIn = lin(frame, openAt, openAt + 5);
  const tOut = lin(frame, closeAt, closeAt + 4);
  const pop = tIn <= 0 ? 0 : (0.96 + 0.04 * easeOutBack(tIn, 1.2)) * 1;
  const alpha = tIn * (1 - tOut);

  const descLines = wrap(description, Math.max(14, Math.floor((cw * 0.88) / (fs * 0.55))));
  const cardH = fs * 3.6 + descLines.length * fs * 1.35 + fs * 0.6 + rowH * 2.1 + rowH * 1.3 + fs * 3.2;
  const cy0 = portrait ? h * 0.47 : Math.max(h * 0.06, Math.min(h - cardH - h * 0.06, oy - cardH * 0.55));

  // iso object
  const objectNode = (() => {
    const bx = objX;
    if (kind === 'box') {
      return (
        <g>
          <IsoShadow x={-1.2 + bx} y={-1.2} w={2.4} d={2.4} k={k} u={u} opacity={0.4} />
          <IsoBox x={-1.2 + bx} y={-1.2} z={0} w={2.4} d={2.4} hgt={1.8} k={k} color="#D9A760" top="#E6BC7C" right="#B98641" sw={k * 0.05} />
        </g>
      );
    }
    const fp = (PART_DEFS_FP as any)[kind] as number[];
    return <IsoPart kind={kind as PartKind} k={k} u={u} frame={frame} fp={[bx - fp[2] / 2, -fp[3] / 2, fp[2], fp[3], fp[4]]} />;
  })();
  const [gx, gy] = isoPt(objX, 0, 0.02, k);
  const selT = lin(frame, openAt - 2, openAt + 6);
  const objIn = easeOutBack(lin(frame, 2, 12), 1.2);

  // popover content geometry
  const pad = fs * 1.1;
  let yy = pad + fs * 1.3;
  const titleY = yy;
  yy += fs * 0.9;
  const descY = yy + fs * 0.9;
  yy = descY + descLines.length * fs * 1.35 + fs * 0.4;
  const chipY = yy;
  const chipH = fs * 2.1;
  yy += chipH + fs * 1.5;
  const sliderY = yy;
  yy += fs * 3.0;
  const toggleY = yy;
  yy += fs * 2.5;
  const btnY = yy;
  const btnH = fs * 2.3;
  const trackX0 = pad;
  const trackX1 = cw - pad;

  return (
    <AbsoluteFill style={{background}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        {scene ? <DraftPaper id="ip-paper" w={w} h={h} u={u} k={k * 1.1} ox={ox} oy={oy} /> : null}
        {scene ? (
          <g transform={`translate(${ox} ${oy}) scale(${Math.max(0.01, 0.2 + 0.8 * objIn)})`} opacity={Math.min(1, objIn * 2)}>
            {/* selection rings on the floor */}
            <g fill="none" stroke={accent} opacity={selT}>
              <ellipse cx={gx} cy={gy} rx={k * 2.4} ry={k * 1.2} strokeWidth={k * 0.07} opacity={0.75} />
              <ellipse cx={gx} cy={gy} rx={k * 2.9} ry={k * 1.45} strokeWidth={k * 0.05} opacity={0.4} />
            </g>
            {objectNode}
            {/* drag handle on the object */}
            <circle cx={isoPt(objX, 0, 1.2, k)[0]} cy={isoPt(objX, 0, 1.2, k)[1]} r={k * 0.2} fill="#fff" stroke={accent} strokeWidth={k * 0.07} opacity={selT} />
          </g>
        ) : null}
        {/* popover */}
        {alpha > 0.001 ? (
          <g transform={`translate(${cx0 + cw / 2} ${cy0 + cardH / 2}) scale(${pop}) translate(${-cw / 2} ${-cardH / 2})`} opacity={alpha}>
            <rect x={fs * 0.1} y={fs * 0.45} width={cw} height={cardH} rx={cw * 0.04} fill="#7A6A50" opacity={0.18} />
            <rect width={cw} height={cardH} rx={cw * 0.04} fill="#F7F2E8" stroke={ISO.border} strokeWidth={1.2 * u} />
            {/* title */}
            <text x={pad} y={titleY} fontFamily={x58Fonts.barlowSC} fontWeight={700} fontSize={fs * 1.25} letterSpacing={fs * 0.1} fill={ISO.text}>
              {title}
            </text>
            <text x={cw - pad} y={titleY} textAnchor="end" fontFamily={x58Fonts.barlow} fontSize={fs * 1.5} fill={ISO.muted}>
              ×
            </text>
            {descLines.map((ln, i) => (
              <text key={i} x={pad} y={descY + i * fs * 1.35} fontFamily={x58Fonts.barlow} fontSize={fs} fill={ISO.muted}>
                {ln}
              </text>
            ))}
            {/* chips */}
            <g transform={`translate(${pad} ${chipY})`}>
              <rect width={cw - pad * 2} height={chipH} rx={chipH / 2} fill="#EDE5D3" stroke={ISO.border} strokeWidth={1 * u} />
              {chips.map((c, i) => {
                const cwid = (cw - pad * 2) / chips.length;
                const act = i === chip;
                return (
                  <g key={i}>
                    {act ? <rect x={i * cwid + chipH * 0.08} y={chipH * 0.08} width={cwid - chipH * 0.16} height={chipH * 0.84} rx={chipH * 0.42} fill={navy} /> : null}
                    <text x={i * cwid + cwid / 2} y={chipH * 0.64} textAnchor="middle" fontFamily={x58Fonts.barlowSC} fontWeight={act ? 700 : 500} fontSize={fs * 0.98} fill={act ? '#fff' : ISO.text}>
                      {c}
                    </text>
                  </g>
                );
              })}
            </g>
            {/* slider */}
            <g transform={`translate(0 ${sliderY})`}>
              <text x={pad} y={0} fontFamily={x58Fonts.barlowSC} fontWeight={600} fontSize={fs} letterSpacing={fs * 0.06} fill={ISO.muted}>
                {sliderLabel.toUpperCase()}
              </text>
              <text x={cw - pad} y={0} textAnchor="end" fontFamily={x58Fonts.mono} fontWeight={600} fontSize={fs * 1.05} fill={accent}>
                {Math.round(sv)} {unit}
              </text>
              <line x1={trackX0} y1={fs * 1.3} x2={trackX1} y2={fs * 1.3} stroke="#DCD2BD" strokeWidth={fs * 0.28} strokeLinecap="round" />
              <line x1={trackX0} y1={fs * 1.3} x2={trackX0 + (trackX1 - trackX0) * sFrac} y2={fs * 1.3} stroke={accent} strokeWidth={fs * 0.28} strokeLinecap="round" />
              <circle cx={trackX0 + (trackX1 - trackX0) * sFrac} cy={fs * 1.3} r={fs * 0.62} fill="#fff" stroke={accent} strokeWidth={fs * 0.2} />
            </g>
            {/* toggle */}
            <g transform={`translate(${pad} ${toggleY})`}>
              <rect y={-fs * 0.75} width={fs * 2.4} height={fs * 1.5} rx={fs * 0.75} fill={on ? accent : '#CFC5B0'} />
              <circle cx={on ? fs * 1.65 : fs * 0.75} cy={0} r={fs * 0.6} fill="#fff" />
              <text x={fs * 3.1} y={fs * 0.35} fontFamily={x58Fonts.barlow} fontSize={fs} fill={ISO.text}>
                {toggle}
              </text>
            </g>
            {/* button + hint */}
            <g transform={`translate(${pad} ${btnY})`}>
              <rect width={fs * 9.4} height={btnH} rx={fs * 0.5} fill={rgba(accent, 0.12)} stroke={accent} strokeWidth={1.2 * u} />
              <text x={fs * 4.7} y={btnH * 0.64} textAnchor="middle" fontFamily={x58Fonts.barlowSC} fontWeight={700} fontSize={fs} letterSpacing={fs * 0.08} fill={accent}>
                {button.toUpperCase()}
              </text>
              <text x={fs * 10.2} y={btnH * 0.64} fontFamily={x58Fonts.barlow} fontSize={fs * 0.88} fill={accent}>
                {hint}
              </text>
            </g>
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};

const PART_DEFS_FP: Record<string, number[]> = {
  car: [0, 0, 2.2, 1.2, 0.9],
  ball: [0, 0, 1.4, 1.4, 1.4],
  wall: [0, 0, 3.2, 0.6, 2.0],
  sensor: [0, 0, 3.2, 0.5, 1.5],
  servo: [0, 0, 1.6, 2.6, 1.6],
  led: [0, 0, 0.6, 0.6, 1.1],
  motor: [0, 0, 1.8, 1.2, 1.1],
};

export const inspectorPopover = defineMotion<Props>({
  id: 'inspector-popover',
  title: 'Inspector popover',
  category: 'ui',
  description:
    'A floating property card next to a selected isometric object: title with close ×, one-line description, segmented chips (active chip navy), a teal slider whose knob and value move with the dragged object, a toggle, and a "+ ZOOM TO IT" button with a hint. It scales/fades in on click, swaps chips in one frame and fades out on step change.',
  source: ['video x8 0:15.5-0:20.2, 0:44-0:53.8'],
  useFor: 'Product UI demos, design-tool and configurator promos, "tweak a parameter" explainers.',
  durationInFrames: 170,
  defaultProps: {
    title: 'DISTANCE TARGET',
    description: 'Pick what the sensor sees and slide it closer or further away.',
    chips: ['Car', 'Box', 'Ball', 'Wall'],
    activeChip: 0,
    switchChipTo: 2,
    switchAt: 92,
    sliderLabel: 'Distance',
    sliderFrom: 17,
    sliderTo: 50,
    sliderMin: 5,
    sliderMax: 60,
    unit: 'cm',
    sliderAt: 36,
    toggle: 'Drive back and forth while running',
    toggleAt: 112,
    button: '+ Zoom to it',
    hint: 'or drag it in the scene',
    openAt: 16,
    closeAt: 154,
    accent: ISO.teal,
    navy: '#181B30',
    background: ISO.paper,
    scene: true,
  },
  propDocs: {
    title: 'card title',
    description: 'one-line description',
    chips: 'segmented chip labels (car, box, ball, wall, sensor, servo, led, motor pick the scene object)',
    activeChip: 'initially active chip index',
    switchChipTo: 'chip index to switch to at switchAt (-1 = never)',
    switchAt: 'frame of the 1-frame chip swap',
    sliderLabel: 'slider caption',
    sliderFrom: 'slider value at the start of the drag',
    sliderTo: 'slider value after the drag',
    sliderMin: 'slider minimum',
    sliderMax: 'slider maximum',
    unit: 'value unit',
    sliderAt: 'frame the drag starts (0.9 s long)',
    toggle: 'toggle label',
    toggleAt: 'frame the toggle switches on',
    button: 'button label',
    hint: 'teal hint next to the button',
    openAt: 'frame the object is clicked and the card opens',
    closeAt: 'frame the card fades out (step change)',
    accent: 'teal accent',
    navy: 'active chip colour',
    background: 'paper colour',
    scene: 'draw the iso scene with the selected object (off = card only)',
  },
  component: InspectorPopover,
  tags: ['popover', 'inspector', 'properties', 'panel', 'card', 'slider', 'chips', 'toggle', 'configurator', 'selected-object', 'tooltip', 'ui', 'product-ui', 'isometric', 'design-tool', 'tweak'],
});
