// Technique after mg-styles-15/demos/01-flat-vector/index.html (updInterior / mkArm rig, MIT, © Vincentwei1021)
// — see THIRD_PARTY_NOTICES.md. Own character and room design.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {E, clamp01, inv, lerp, mg1Fonts, springT} from '../../core/r2-mg1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  wall: string;
  desk: string;
  skin: string;
  hair: string;
  shirt: string;
  ink: string;
  accent: string;
  sky: string;
  frameColor: string;
  plant: string;
  pingAt: number;
  expression: 'auto' | 'neutral' | 'surprised' | 'smile';
  message: string;
  glasses: boolean;
};

const pop = (f: number, at: number) => springT((f - at) / 30, 2.4, 0.42, 0.9);

const FlatPersonDesk: React.FC<Props> = (p) => {
  const f = useCurrentFrame();
  const {w, h, u} = useStage();
  const W = w / u;
  const H = h / u;
  const tall = H > W * 1.2;
  const cx = W / 2;
  const deskY = H * (tall ? 0.7 : 0.86);
  const K = tall ? 1.1 : 1.28; // person scale
  const ping = p.pingAt;

  // ---- acting ------------------------------------------------------------------------------------
  const snap = f < ping + 9 ? 0 : springT((f - ping - 9) / 30, 3.2, 0.38);
  const blink = (f >= 34 && f < 37) || (f >= ping + 70 && f < ping + 73) ? 1 : 0;
  let expr: 'neutral' | 'surprised' | 'smile' = f < ping + 9 ? 'neutral' : f < ping + 40 ? 'surprised' : 'smile';
  if (p.expression !== 'auto') expr = p.expression;
  const reach = E.io2(clamp01(inv(ping + 26, ping + 40, f)));
  const beatBob = f > ping + 44 ? Math.abs(Math.sin(((f - ping - 44) / 15) * Math.PI)) * 6 : 0;
  const typing = f < ping + 9 ? Math.sin(f * 1.3) * 5 : 0;
  const rise = pop(f, 8);
  const bodyY = (1 - rise) * 260 - beatBob + (expr === 'surprised' ? -10 * Math.exp(-(f - ping - 9) / 8) : 0);

  // ---- room pops (3-frame stagger) ---------------------------------------------------------------
  const sWin = pop(f, 0);
  const sPic = pop(f, 3);
  const sLamp = pop(f, 5);
  const sMug = pop(f, 10);
  const sPlant = pop(f, 12);
  const sLap = pop(f, 14);
  const sPhone = pop(f, 16);

  const winX = tall ? W * 0.06 : W * 0.04;
  const winY = H * (tall ? 0.12 : 0.17);
  const winW = tall ? W * 0.4 : W * 0.18;
  const winH = tall ? H * 0.17 : H * 0.36;
  const picW = tall ? W * 0.3 : W * 0.16;
  const picH = picW * 1.25;
  const picX = W - (tall ? W * 0.06 : W * 0.04) - picW;
  const picY = H * (tall ? 0.12 : 0.2);
  const phoneX = cx + (tall ? 330 : 440) * K;
  const mugX = cx - (tall ? 370 : 430) * K;
  const plantX = tall ? W * 0.12 : W * 0.92;
  const lampX = cx - (tall ? 0 : 400) * K;

  const ringOn = f >= ping && f < ping + 40;
  const phoneShake = f >= ping && f < ping + 14 ? Math.sin((f - ping) * 2.4) * 6 * (1 - (f - ping) / 14) : 0;
  const bell = f >= ping ? springT((f - ping) / 30, 3, 0.45) * (1 - clamp01(inv(ping + 60, ping + 70, f))) : 0;
  const bang = f >= ping + 12 ? springT((f - ping - 12) / 30, 3.4, 0.4) * (1 - clamp01(inv(ping + 46, ping + 54, f))) : 0;

  // head transform (look toward phone)
  const headX = cx + 16 * snap * K;
  const headY = deskY - 330 * K + bodyY;
  const headR = 112 * K;
  const headRot = 9 * snap;
  const eyeDX = 12 * snap * K;
  const ink = p.ink;

  const steam = (k: number) => {
    const t = (f / 30 + k * 0.5) % 1.5;
    const y = -t * 70;
    return (
      <path
        key={k}
        d={`M ${mugX - 12 + k * 22} ${deskY - 130 + y} q 14 -18 0 -36 q -14 -18 0 -36`}
        stroke="#FFF6E9"
        strokeWidth={8 * K}
        strokeLinecap="round"
        fill="none"
        opacity={Math.sin((t / 1.5) * Math.PI) * sMug}
      />
    );
  };

  return (
    <AbsoluteFill style={{background: p.wall}}>
      <Svg>
        <g transform={`scale(${u})`}>
          {/* window with city */}
          <g transform={`translate(${winX + winW / 2} ${winY + winH / 2}) scale(${sWin}) translate(${-winW / 2} ${-winH / 2})`}>
            <rect x={-14} y={-14} width={winW + 28} height={winH + 28} rx={18} fill="#FFF6E9" />
            <clipPath id="mg1-fpd-win">
              <rect width={winW} height={winH} rx={8} />
            </clipPath>
            <rect width={winW} height={winH} rx={8} fill={p.sky} />
            <g clipPath="url(#mg1-fpd-win)">
            <circle cx={winW * 0.66} cy={winH * 0.36} r={winW * 0.15} fill={p.accent} />
            {[0.05, 0.22, 0.45, 0.62, 0.82].map((x, i) => (
              <rect key={i} x={winW * x} y={winH * (0.45 + (i % 3) * 0.08)} width={winW * 0.16} height={winH} fill="#4B4BFF" />
            ))}
            </g>
            <rect x={winW / 2 - 7} y={0} width={14} height={winH} fill="#FFF6E9" />
            <rect x={0} y={winH / 2 - 7} width={winW} height={14} fill="#FFF6E9" />
            <rect x={-30} y={winH + 14} width={winW + 60} height={22} rx={11} fill="#E8B42A" />
          </g>
          {/* framed picture */}
          <g transform={`translate(${picX + picW / 2} ${picY + picH / 2}) scale(${sPic}) rotate(${(1 - sPic) * 8}) translate(${-picW / 2} ${-picH / 2})`}>
            <rect width={picW} height={picH} rx={14} fill={p.frameColor} />
            <rect x={picW * 0.09} y={picW * 0.09} width={picW * 0.82} height={picH - picW * 0.18} rx={6} fill="#FFF6E9" />
            <circle cx={picW / 2} cy={picH * 0.38} r={picW * 0.22} fill={p.accent} />
            <path d={`M ${picW * 0.15} ${picH * 0.82} L ${picW / 2} ${picH * 0.52} L ${picW * 0.85} ${picH * 0.82} Z`} fill={p.sky} />
          </g>
          {/* pendant lamp (sways) */}
          <g transform={`translate(${lampX} 0) rotate(${Math.sin(f / 22) * 2.5} 0 0) scale(${sLamp})`}>
            <line x1={0} y1={0} x2={0} y2={H * (tall ? 0.36 : 0.2)} stroke={ink} strokeWidth={6} />
            <path d={`M -95 ${H * (tall ? 0.36 : 0.2) + 70} L -50 ${H * (tall ? 0.36 : 0.2)} L 50 ${H * (tall ? 0.36 : 0.2)} L 95 ${H * (tall ? 0.36 : 0.2) + 70} Z`} fill={ink} />
            <circle cx={0} cy={H * (tall ? 0.36 : 0.2) + 78} r={22} fill="#FFF6E9" />
          </g>

          {/* person */}
          <g transform={`translate(0 ${bodyY})`}>
            {/* torso */}
            <path
              d={`M ${cx - 215 * K} ${deskY + 10} C ${cx - 220 * K} ${deskY - 160 * K}, ${cx - 160 * K} ${deskY - 215 * K}, ${cx - 60 * K} ${deskY - 225 * K} L ${cx + 60 * K} ${deskY - 225 * K} C ${cx + 160 * K} ${deskY - 215 * K}, ${cx + 220 * K} ${deskY - 160 * K}, ${cx + 215 * K} ${deskY + 10} Z`}
              fill={p.shirt}
            />
            <rect x={cx - 34 * K} y={deskY - 250 * K} width={68 * K} height={50 * K} rx={18} fill={p.skin} />
            {/* left arm to keyboard (typing bob) */}
            <path d={`M ${cx - 175 * K} ${deskY - 170 * K} Q ${cx - 255 * K} ${deskY - 70 * K} ${cx - 190 * K} ${deskY - 30 * K + typing}`} stroke={p.shirt} strokeWidth={62 * K} strokeLinecap="round" fill="none" />
            <circle cx={cx - 190 * K} cy={deskY - 30 * K + typing} r={30 * K} fill={p.skin} />
            {/* right arm: typing, then reaches for the phone */}
            {(() => {
              const hx = lerp(cx + 190 * K, phoneX - 95 * K, reach);
              const hy = lerp(deskY - 30 * K - typing, deskY - 150 * K, reach) - bodyY * reach;
              return (
                <g>
                  <path d={`M ${cx + 175 * K} ${deskY - 170 * K} Q ${lerp(cx + 255 * K, cx + 300 * K, reach)} ${lerp(deskY - 70 * K, deskY - 190 * K, reach)} ${hx} ${hy}`} stroke={p.shirt} strokeWidth={62 * K} strokeLinecap="round" fill="none" />
                  <circle cx={hx} cy={hy} r={30 * K} fill={p.skin} />
                </g>
              );
            })()}
            {/* head */}
            <g transform={`rotate(${headRot} ${headX} ${headY + headR})`}>
              <circle cx={headX - headR * 0.98} cy={headY + 12 * K} r={24 * K} fill={p.skin} />
              <circle cx={headX + headR * 0.98} cy={headY + 12 * K} r={24 * K} fill={p.skin} />
              <circle cx={headX} cy={headY} r={headR} fill={p.skin} />
              {/* hair: short bob with a side sweep */}
              <path
                d={`M ${headX - headR * 1.06} ${headY + headR * 0.35} C ${headX - headR * 1.25} ${headY - headR * 1.15}, ${headX + headR * 1.2} ${headY - headR * 1.35}, ${headX + headR * 1.08} ${headY + headR * 0.3} C ${headX + headR * 0.9} ${headY - headR * 0.35}, ${headX + headR * 0.1} ${headY - headR * 0.5}, ${headX - headR * 0.35} ${headY - headR * 0.45} C ${headX - headR * 0.7} ${headY - headR * 0.3}, ${headX - headR * 0.85} ${headY - headR * 0.05}, ${headX - headR * 1.06} ${headY + headR * 0.35} Z`}
                fill={p.hair}
              />
              <circle cx={headX + headR * 0.62} cy={headY - headR * 0.92} r={headR * 0.36} fill={p.hair} />
              {/* cheeks */}
              {expr !== 'neutral' &&
                [-1, 1].map((s) => <ellipse key={s} cx={headX + s * headR * 0.52 + eyeDX} cy={headY + headR * 0.36} rx={headR * 0.17} ry={headR * 0.11} fill="#F59A8C" opacity={0.75} />)}
              {/* eyes */}
              {[-1, 1].map((s) => {
                const ex = headX + s * headR * 0.38 + eyeDX;
                const ey = headY + headR * 0.08;
                const r = expr === 'surprised' ? headR * 0.12 : headR * 0.085;
                return blink ? (
                  <line key={s} x1={ex - r} y1={ey} x2={ex + r} y2={ey} stroke={ink} strokeWidth={8 * K} strokeLinecap="round" />
                ) : (
                  <circle key={s} cx={ex} cy={ey} r={r} fill={ink} />
                );
              })}
              {p.glasses &&
                [-1, 1].map((s) => <circle key={'g' + s} cx={headX + s * headR * 0.38 + eyeDX * 0.6} cy={headY + headR * 0.08} r={headR * 0.3} fill="none" stroke={ink} strokeWidth={8 * K} />)}
              {p.glasses && <line x1={headX - headR * 0.08 + eyeDX * 0.6} y1={headY + headR * 0.05} x2={headX + headR * 0.08 + eyeDX * 0.6} y2={headY + headR * 0.05} stroke={ink} strokeWidth={8 * K} />}
              {/* brows */}
              {[-1, 1].map((s) => (
                <line
                  key={'b' + s}
                  x1={headX + s * headR * 0.24 + eyeDX}
                  y1={headY - headR * (expr === 'surprised' ? 0.42 : 0.32)}
                  x2={headX + s * headR * 0.52 + eyeDX}
                  y2={headY - headR * (expr === 'surprised' ? 0.48 : 0.3)}
                  stroke={ink}
                  strokeWidth={8 * K}
                  strokeLinecap="round"
                />
              ))}
              {/* mouth */}
              {expr === 'surprised' ? (
                <ellipse cx={headX + eyeDX} cy={headY + headR * 0.55} rx={headR * 0.1} ry={headR * 0.13} fill={ink} />
              ) : expr === 'smile' ? (
                <path d={`M ${headX - headR * 0.28 + eyeDX} ${headY + headR * 0.45} Q ${headX + eyeDX} ${headY + headR * 0.78} ${headX + headR * 0.28 + eyeDX} ${headY + headR * 0.45}`} stroke={ink} strokeWidth={9 * K} strokeLinecap="round" fill="none" />
              ) : (
                <line x1={headX - headR * 0.14 + eyeDX} y1={headY + headR * 0.55} x2={headX + headR * 0.14 + eyeDX} y2={headY + headR * 0.55} stroke={ink} strokeWidth={8 * K} strokeLinecap="round" />
              )}
            </g>
          </g>

          {/* laptop */}
          <g transform={`translate(${cx} ${deskY}) scale(${sLap}) translate(${-cx} ${-deskY})`}>
            <rect x={cx - 215 * K} y={deskY - 205 * K} width={430 * K} height={205 * K} rx={18} fill={ink} />
            <circle cx={cx} cy={deskY - 100 * K} r={20 * K} fill={p.accent} />
          </g>
          {/* mug + steam */}
          <g transform={`translate(${mugX} ${deskY}) scale(${sMug}) translate(${-mugX} ${-deskY})`}>
            <rect x={mugX - 60 * K} y={deskY - 120 * K} width={120 * K} height={120 * K} rx={14} fill={p.accent} />
            <rect x={mugX - 60 * K} y={deskY - 92 * K} width={120 * K} height={18 * K} fill="#FFF6E9" />
            <circle cx={mugX + 66 * K} cy={deskY - 62 * K} r={30 * K} fill="none" stroke={p.accent} strokeWidth={16 * K} />
          </g>
          {[0, 1].map(steam)}
          {/* plant */}
          <g transform={`translate(${plantX} ${deskY}) scale(${sPlant}) rotate(${Math.sin(f / 18) * 2})`}>
            <rect x={-55 * K} y={-95 * K} width={110 * K} height={95 * K} rx={10} fill={ink} />
            {[-1, 0, 1].map((s) => (
              <ellipse key={s} cx={s * 50 * K} cy={-175 * K + Math.abs(s) * 25 * K} rx={34 * K} ry={92 * K} transform={`rotate(${s * 28} ${s * 50 * K} ${-120 * K})`} fill={s === 0 ? '#3FF2A6' : p.plant} />
            ))}
          </g>
          {/* phone */}
          <g transform={`translate(${phoneX + phoneShake} ${deskY}) scale(${sPhone}) rotate(${phoneShake * 0.6})`}>
            <rect x={-82 * K} y={-300 * K} width={164 * K} height={290 * K} rx={30 * K} fill={ink} />
            <rect x={-66 * K} y={-284 * K} width={132 * K} height={258 * K} rx={20 * K} fill={ringOn ? '#FFFFFF' : '#FFF6E9'} />
            <circle cx={38 * K} cy={-250 * K} r={17 * K} fill={p.accent} opacity={f >= ping ? 1 : 0.25} />
            {f >= ping &&
              [0, 1, 2].map((i) => (
                <rect key={i} x={-46 * K} y={(-180 + i * 34) * K} width={(i === 2 ? 60 : 92) * K * clamp01((f - ping - 4 - i * 3) / 6)} height={14 * K} rx={7 * K} fill={ink} />
              ))}
            <rect x={-40 * K} y={-10 * K} width={80 * K} height={14 * K} fill={ink} />
            {p.message && f >= ping + 30 && (
              <text x={0} y={-60 * K} textAnchor="middle" fontFamily={mg1Fonts.rounded} fontWeight={600} fontSize={22 * K} fill={p.accent} opacity={clamp01((f - ping - 30) / 6)}>
                {p.message}
              </text>
            )}
          </g>
          {/* bell bubble + rings */}
          {bell > 0 && (
            <g transform={`translate(${phoneX} ${deskY - 400 * K}) scale(${bell}) rotate(${Math.sin(f * 0.9) * 10 * Math.exp(-(f - ping) / 20)})`}>
              {[0, 1].map((k) => {
                const tt = ((f - ping) / 18 + k * 0.5) % 1;
                return <circle key={k} cx={0} cy={0} r={(70 + tt * 70) * K} fill="none" stroke={p.accent} strokeWidth={5 * K} opacity={(1 - tt) * 0.6} />;
              })}
              <circle cx={0} cy={0} r={74 * K} fill={p.accent} />
              <path d={`M ${-22 * K} ${66 * K} L 0 ${96 * K} L ${22 * K} ${66 * K} Z`} fill={p.accent} />
              <path d={`M ${-34 * K} ${18 * K} C ${-34 * K} ${-30 * K}, ${34 * K} ${-30 * K}, ${34 * K} ${18 * K} L ${44 * K} ${26 * K} L ${-44 * K} ${26 * K} Z`} fill="#FFF6E9" />
              <circle cx={0} cy={36 * K} r={10 * K} fill="#FFF6E9" />
            </g>
          )}
          {/* "!" with tick marks */}
          {bang > 0 && (
            <g transform={`translate(${headX + 40 * K} ${headY - headR * 2.05 + bodyY}) scale(${bang})`}>
              <path d={`M ${-6 * K} ${-60 * K} L ${10 * K} ${-60 * K} L ${4 * K} ${20 * K} L ${-8 * K} ${20 * K} Z`} fill={ink} />
              <circle cx={-2 * K} cy={46 * K} r={12 * K} fill={ink} />
              <line x1={-60 * K} y1={-70 * K} x2={-40 * K} y2={-44 * K} stroke={ink} strokeWidth={8 * K} strokeLinecap="round" />
              <line x1={44 * K} y1={-30 * K} x2={74 * K} y2={-42 * K} stroke={ink} strokeWidth={8 * K} strokeLinecap="round" />
            </g>
          )}
          {/* desk */}
          <rect x={0} y={deskY} width={W} height={H - deskY} fill={p.desk} />
          <rect x={0} y={deskY} width={W} height={42 * K} fill="#4B4BFF" />
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const flatPersonDesk = defineMotion<Props>({
  id: 'flat-person-desk',
  title: 'Flat person at desk',
  category: 'character',
  description:
    'A geometric flat-vector person with round glasses works at a laptop in a cosy sunflower room (window with skyline and sun, framed print, swaying pendant lamp, plant, steaming mug); the room pops in with springs, they type and blink, the phone pings with a bell bubble, their head snaps round with an "!" mark, they reach for the phone and break into a smile, bobbing on the beat.',
  source: ['mg-styles-15 01-flat-vector 3.8-5.0 s, index.html updInterior / mkArm (MIT, Vincentwei1021) — technique after mg-styles-15; own character design'],
  useFor: 'A reusable "user" moment for app, SaaS and notification explainers; pairs with sms-thread, chat-bubbles and kinetic-captions.',
  durationInFrames: 180,
  defaultProps: {
    wall: '#F7C934',
    desk: '#2B2BFF',
    skin: '#F6B48F',
    hair: '#151433',
    shirt: '#2EE6A8',
    ink: '#151433',
    accent: '#FF5A4E',
    sky: '#2B2BFF',
    frameColor: '#3FF2A6',
    plant: '#2ED18E',
    pingAt: 66,
    expression: 'auto',
    message: '',
    glasses: true,
  },
  propDocs: {
    wall: 'room wall colour',
    desk: 'desk colour',
    skin: 'skin tone',
    hair: 'hair colour',
    shirt: 'top colour',
    ink: 'dark line / laptop colour',
    accent: 'notification / sun / mug accent colour',
    sky: 'window sky + print colour',
    frameColor: 'picture frame colour',
    plant: 'plant leaf colour',
    pingAt: 'frame the phone pings',
    expression: "'auto' runs the acting; or neutral | surprised | smile",
    message: 'optional tiny word on the phone screen after the ping',
    glasses: 'round glasses',
  },
  component: FlatPersonDesk,
  tags: ['character', 'person', 'user', 'desk', 'laptop', 'phone', 'notification', 'ping', 'flat vector', 'explainer', 'room', 'work from home', 'reaction', 'surprised', 'smile', 'mg-styles-15', 'flat-vector-pop'],
});
