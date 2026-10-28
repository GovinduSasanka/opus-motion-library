import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {bgOf, onColor} from '../../core/commerce-kit';
import {fonts} from '../../core/fonts';
import {mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {Barcode} from '../../core/travel-food-kit';
import {defineMotion} from '../../core/types';

/**
 * A boarding pass printing out of a slot: stepped, printer-style feed, then a barcode scan sweep and a seat highlight.
 * Everything on the pass is a prop (airline name, codes, cities, times, gate, seat, passenger).
 */
type Props = {
  airline: string;
  fromCode: string;
  fromCity: string;
  toCode: string;
  toCity: string;
  departTime: string;
  arriveTime: string;
  date: string;
  flight: string;
  gate: string;
  seat: string;
  boardingTime: string;
  passenger: string;
  travelClass: string;
  headerLabel: string;
  printFrames: number;
  background: string;
  paper: string;
  ink: string;
  accent: string;
  startAt: number;
};

const sum = (s: string) => s.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

/** feed that moves in printer-style steps (eased within each step) */
const stepped = (x: number, n: number) => {
  const v = Math.min(1, Math.max(0, x)) * n;
  const i = Math.min(n - 1, Math.floor(v));
  return (i + ease.out(v - i)) / n;
};

const Field: React.FC<{label: string; value: string; ink: string; sub: number; fs: number; hi?: number; accent?: string; onAccent?: string}> = ({label, value, ink, sub, fs, hi = 0, accent, onAccent}) => (
  <div style={{minWidth: 0}}>
    <div style={{fontFamily: fonts.mono, fontSize: 15, letterSpacing: 2.5, color: withAlpha(ink, sub), textTransform: 'uppercase'}}>{label}</div>
    <div
      style={{
        fontFamily: fonts.sans,
        fontWeight: 800,
        fontSize: fs,
        color: hi > 0 ? onAccent : ink,
        background: hi > 0 && accent ? withAlpha(accent, hi) : 'transparent',
        borderRadius: 8,
        padding: hi > 0 ? '0 10px' : 0,
        marginLeft: hi > 0 ? -10 : 0,
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {value}
    </div>
  </div>
);

const BoardingPassPrint: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame - p.startAt;
  const colLayout = portrait || w / h < 1.15;

  // design size of the pass (design px, scaled to fit)
  const DW = colLayout ? 760 : 1300;
  const DH = colLayout ? 1180 : 540;
  const slotY = h * (colLayout ? 0.05 : 0.09);
  const printerH = 46 * u;
  const areaTop = slotY + printerH * 0.5;
  const fitW = (w * (colLayout ? 0.88 : 0.86)) / DW;
  const fitH = (h - areaTop - h * 0.05) / DH;
  const sc = Math.min(fitW, fitH);
  const PW = DW * sc;
  const PH = DH * sc;

  // timing
  const printF = Math.max(20, p.printFrames);
  const printStart = 12;
  const printEnd = printStart + printF;
  const feed = stepped(prog(t, printStart, printEnd, ease.linear), 16);
  const scanT = sseg(t, printEnd + 10, printEnd + 44);
  const seatHi = ease.out(sseg(t, printEnd + 44, printEnd + 58)) * (0.65 + 0.35 * Math.sin((t - printEnd) * 0.18));
  const settle = ease.out(sseg(t, printEnd, printEnd + 26));
  const rest = (h - areaTop - PH) / 2;
  const finalTop = areaTop + Math.max(h * 0.02, rest);
  // the pass moves out of the slot: top edge goes from slot - PH to its resting place
  const topNow = lerp(slotY - PH + printerH * 0.2, finalTop, feed);
  const tilt = (1 - settle) * -1.2 + Math.sin(t * 0.05) * 0.12 * settle;

  const printerIn = ease.out(sseg(t, 0, 12));
  const dark = '#1C1F26';
  const onAcc = onColor(p.accent);
  const seed = sum(p.flight + p.seat);

  const MAINW = colLayout ? DW : 980;
  const STUBW = colLayout ? DW : DW - 980;
  const MAINH = colLayout ? 690 : DH;
  const STUBH = colLayout ? DH - 760 : DH;
  const cut = 26; // perforation notch radius
  const notch = p.background === 'transparent' ? null : p.background;

  const codeFs = colLayout ? 118 : 150;

  return (
    <AbsoluteFill style={{background: bgOf(p.background), overflow: 'hidden', fontFamily: fonts.sans}}>
      {/* pass (clipped below the slot) */}
      <div style={{position: 'absolute', left: 0, top: slotY, width: w, height: h - slotY, overflow: 'hidden'}}>
        <div
          style={{
            position: 'absolute',
            left: (w - DW) / 2,
            top: topNow - slotY,
            width: DW,
            height: DH,
            transform: `scale(${sc}) rotate(${tilt}deg)`,
            transformOrigin: '50% 0%',
            filter: `drop-shadow(0 ${14 * u}px ${28 * u}px ${withAlpha('#000000', 0.22)})`,
          }}
        >
          {/* main body */}
          <div style={{position: 'absolute', left: 0, top: 0, width: MAINW, height: MAINH, background: p.paper, color: p.ink, borderRadius: colLayout ? '26px 26px 0 0' : '26px 0 0 26px', overflow: 'hidden'}}>
            <div style={{height: 92, background: p.accent, color: onAcc, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 44px'}}>
              <div style={{fontFamily: fonts.display, fontSize: 38, letterSpacing: 1}}>{p.airline}</div>
              <div style={{fontFamily: fonts.mono, fontSize: 18, letterSpacing: 5, fontWeight: 700}}>{p.headerLabel}</div>
            </div>
            {/* route */}
            <div style={{padding: colLayout ? '74px 44px 0' : '40px 56px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div>
                <div style={{fontFamily: fonts.display, fontSize: codeFs, lineHeight: 1, color: p.ink}}>{p.fromCode}</div>
                <div style={{fontSize: 24, fontWeight: 600, color: withAlpha(p.ink, 0.65), marginTop: 6}}>{p.fromCity}</div>
                <div style={{fontFamily: fonts.mono, fontSize: 30, fontWeight: 700, marginTop: 8}}>{p.departTime}</div>
              </div>
              <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 14px', minWidth: 0}}>
                <svg width={colLayout ? 130 : 230} height={60} viewBox="0 0 230 60" style={{overflow: 'visible'}}>
                  <line x1={0} y1={30} x2={230} y2={30} stroke={withAlpha(p.ink, 0.35)} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" />
                  <g transform="translate(115 30)">
                    <path d="M-22 5 L4 5 L-10 -22 L-2 -22 L22 3 L38 3 Q44 5 38 9 L22 9 L-2 34 L-10 34 L4 9 L-22 9 Z" fill={p.accent} transform="scale(0.9) rotate(0) translate(-8 -6)" />
                  </g>
                </svg>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{fontFamily: fonts.display, fontSize: codeFs, lineHeight: 1, color: p.ink}}>{p.toCode}</div>
                <div style={{fontSize: 24, fontWeight: 600, color: withAlpha(p.ink, 0.65), marginTop: 6}}>{p.toCity}</div>
                <div style={{fontFamily: fonts.mono, fontSize: 30, fontWeight: 700, marginTop: 8}}>{p.arriveTime}</div>
              </div>
            </div>
            {/* fields */}
            <div style={{position: 'absolute', left: colLayout ? 44 : 56, right: colLayout ? 44 : 56, bottom: colLayout ? 46 : 40, display: 'grid', gridTemplateColumns: colLayout ? '1fr 1fr 1fr' : 'repeat(3, 1fr)', rowGap: 22, columnGap: 20}}>
              <Field label="Passenger" value={p.passenger} ink={p.ink} sub={0.5} fs={30} />
              <Field label="Flight" value={p.flight} ink={p.ink} sub={0.5} fs={30} />
              <Field label="Date" value={p.date} ink={p.ink} sub={0.5} fs={30} />
              <Field label="Class" value={p.travelClass} ink={p.ink} sub={0.5} fs={30} />
              <Field label="Gate" value={p.gate} ink={p.ink} sub={0.5} fs={30} />
              <Field label="Boarding" value={p.boardingTime} ink={p.ink} sub={0.5} fs={30} />
            </div>
          </div>

          {/* stub */}
          <div
            style={{
              position: 'absolute',
              left: colLayout ? 0 : MAINW,
              top: colLayout ? MAINH : 0,
              width: STUBW,
              height: STUBH,
              background: mixHex(p.paper, p.accent, 0.07),
              color: p.ink,
              borderRadius: colLayout ? '0 0 26px 26px' : '0 26px 26px 0',
              overflow: 'hidden',
              padding: colLayout ? '46px 44px 0' : '30px 34px 0',
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
              <div style={{fontFamily: fonts.display, fontSize: 24, whiteSpace: 'nowrap'}}>{p.airline}</div>
              <div style={{fontFamily: fonts.mono, fontSize: 20, fontWeight: 700, whiteSpace: 'nowrap'}}>
                {p.fromCode} → {p.toCode}
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: colLayout ? 28 : 40}}>
              <Field label="Seat" value={p.seat} ink={p.ink} sub={0.5} fs={colLayout ? 84 : 76} hi={seatHi * 0.95} accent={p.accent} onAccent={onAcc} />
              <Field label="Gate" value={p.gate} ink={p.ink} sub={0.5} fs={colLayout ? 56 : 48} />
            </div>
            <div style={{marginTop: colLayout ? 30 : 44}}>
              <Barcode w={STUBW - (colLayout ? 88 : 68)} h={colLayout ? 120 : 170} color={dark} seed={seed} sweep={scanT} sweepColor={'#FF3B30'} />
              <div style={{fontFamily: fonts.mono, fontSize: 16, letterSpacing: 4, marginTop: 10, color: withAlpha(p.ink, 0.6)}}>
                {p.flight.replace(/\s/g, '')} {p.seat} {p.fromCode}{p.toCode}
              </div>
            </div>
          </div>

          {/* perforation + notches */}
          <svg width={DW} height={DH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
            {colLayout ? (
              <>
                <line x1={cut} y1={MAINH} x2={DW - cut} y2={MAINH} stroke={withAlpha(p.ink, 0.35)} strokeWidth={3} strokeDasharray="10 10" />
                {notch ? <circle cx={0} cy={MAINH} r={cut} fill={notch} /> : null}
                {notch ? <circle cx={DW} cy={MAINH} r={cut} fill={notch} /> : null}
              </>
            ) : (
              <>
                <line x1={MAINW} y1={cut} x2={MAINW} y2={DH - cut} stroke={withAlpha(p.ink, 0.35)} strokeWidth={3} strokeDasharray="10 10" />
                {notch ? <circle cx={MAINW} cy={0} r={cut} fill={notch} /> : null}
                {notch ? <circle cx={MAINW} cy={DH} r={cut} fill={notch} /> : null}
              </>
            )}
          </svg>
        </div>
      </div>

      {/* printer: body over the slot so the pass emerges from underneath */}
      <div style={{position: 'absolute', left: w * 0.06, width: w * 0.88, top: slotY - printerH * (0.5) - (1 - printerIn) * 80 * u, height: printerH, opacity: printerIn}}>
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${mixHex(dark, '#ffffff', 0.14)}, ${dark})`, borderRadius: 24 * u, boxShadow: `0 ${10 * u}px ${24 * u}px ${withAlpha('#000000', 0.35)}`}} />
        <div style={{position: 'absolute', left: '3%', right: '3%', top: '52%', height: 8 * u, background: '#07080B', borderRadius: 6 * u}} />
        <div style={{position: 'absolute', right: '5%', top: '18%', width: 10 * u, height: 10 * u, borderRadius: '50%', background: feed < 1 ? '#FF9F1C' : '#33D17A', boxShadow: `0 0 ${10 * u}px ${feed < 1 ? '#FF9F1C' : '#33D17A'}`}} />
      </div>
      {/* print feed lines while moving */}
      <Svg>
        {feed > 0 && feed < 1 ? <rect x={w * 0.07} y={slotY + printerH * 0.1} width={w * 0.86} height={3 * u} fill={withAlpha('#FFFFFF', 0.25 * (1 - feed))} /> : null}
      </Svg>
    </AbsoluteFill>
  );
};

export const boardingPassPrint = defineMotion<Props>({
  id: 'boarding-pass-print',
  title: 'Boarding pass printing',
  category: 'ui',
  description:
    'A printer slot feeds out a boarding pass in stepped jerks: airline header, big FROM and TO codes with a dotted flight path, passenger fields, a perforated stub with a seat that lights up and a barcode that gets scanned.',
  source: ['original (round 3)'],
  useFor: 'Travel and airline promos, trip-confirmation beats, holiday reveals, "you are going to ..." moments, check-in UI demos — set the codes, cities, times, seat and airline.',
  durationInFrames: 180,
  defaultProps: {
    airline: 'Skyline Air',
    fromCode: 'LIS',
    fromCity: 'Lisbon',
    toCode: 'OSL',
    toCity: 'Oslo',
    departTime: '09:45',
    arriveTime: '14:05',
    date: '12 JUN',
    flight: 'SK 482',
    gate: 'B14',
    seat: '12A',
    boardingTime: '09:05',
    passenger: 'A. TRAVELLER',
    travelClass: 'Economy',
    headerLabel: 'BOARDING PASS',
    printFrames: 54,
    background: '#DCE6F2',
    paper: '#FFFFFF',
    ink: '#14233B',
    accent: '#1F6FEB',
    startAt: 0,
  },
  propDocs: {
    airline: 'generic airline name (header and stub)',
    fromCode: 'departure code, e.g. 3 letters',
    fromCity: 'departure city line',
    toCode: 'arrival code',
    toCity: 'arrival city line',
    departTime: 'departure time',
    arriveTime: 'arrival time',
    date: 'travel date text',
    flight: 'flight number text',
    gate: 'gate text',
    seat: 'seat text (highlighted on the stub)',
    boardingTime: 'boarding time text',
    passenger: 'passenger name text',
    travelClass: 'cabin class text',
    headerLabel: 'small caps label in the header band',
    printFrames: 'frames the feed takes to print the whole pass',
    background: "page colour or 'transparent'",
    paper: 'pass colour',
    ink: 'text and bar colour',
    accent: 'header band, plane and seat highlight colour',
    startAt: 'frame the scene starts',
  },
  component: BoardingPassPrint,
  tags: ['boarding pass', 'flight', 'airline', 'ticket', 'travel', 'airport', 'trip', 'holiday', 'vacation', 'check-in', 'barcode', 'seat', 'print', 'ui'],
});
