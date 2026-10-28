import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {useSafeId} from '../../core/image-kit';
import {EventStage, EvIcon, QRPattern, backOut, fitFont, mixHex, starPath, withAlpha} from '../../core/r3-events-kit';
import {wrapText} from '../../core/r3-social';
import {defineMotion} from '../../core/types';

/**
 * An admission ticket slides in and settles, its event name, venue and details write on, a QR-style code scans in, and then the
 * stub tears off along the perforation (drops and tilts away) while a shine sweeps the main ticket and an "admit one" stamp lands.
 */
type Detail = {label: string; value: string};
type Props = {
  eyebrow: string;
  eventName: string;
  venue: string;
  details: Detail[];
  ticketId: string;
  admit: string;
  scanLabel: string;
  tear: boolean;
  background: string;
  ticket: string;
  ink: string;
  accent: string;
  accent2: string;
  seed: number;
  startAt: number;
};

const EventTicketReveal: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const uid = useSafeId('etr');
  const f = Math.max(0, frame - p.startAt);
  const details = (p.details || []).slice(0, 4);

  return (
    <EventStage
      background={p.background}
      pre={(L) => (
        <g>
          {p.background !== 'transparent' && (
            <g opacity={0.5}>
              {Array.from({length: 7}, (_, i) => (
                <circle key={i} cx={L.w * (0.1 + 0.14 * i)} cy={L.h * (0.15 + 0.7 * ((i * 37) % 10) / 10)} r={Math.min(L.w, L.h) * (0.05 + 0.02 * (i % 3))} fill="none" stroke={withAlpha(p.accent, 0.18)} strokeWidth={3} />
              ))}
            </g>
          )}
        </g>
      )}
    >
      {(L) => {
        const vert = L.kind === 'tall';
        const A = vert ? 780 : 880; // main length along the tear axis
        const B = vert ? 700 : 520; // across
        const SA = 280;
        const mainW = vert ? B : A;
        const mainH = vert ? A : B;
        const tw = vert ? B : A + SA;
        const th = vert ? A + SA : B;
        const sc = vert ? 1.14 : L.kind === 'wide' ? 1.2 : 0.84;
        const n = 24;
        const rc = 28;
        const P = (a: number, b: number) => (vert ? `${b} ${a}` : `${a} ${b}`);
        const sw = (s: number) => (vert ? 1 - s : s);
        const arc = (r: number, s: number, a: number, b: number) => `A${r} ${r} 0 0 ${sw(s)} ${P(a, b)}`;
        const mainPath = `M${P(rc, 0)}L${P(A - n, 0)}${arc(n, 0, A, n)}L${P(A, B - n)}${arc(n, 0, A - n, B)}L${P(rc, B)}${arc(rc, 1, 0, B - rc)}L${P(0, rc)}${arc(rc, 1, rc, 0)}Z`;
        const stubPath = `M${P(A, n)}${arc(n, 0, A + n, 0)}L${P(A + SA - rc, 0)}${arc(rc, 1, A + SA, rc)}L${P(A + SA, B - rc)}${arc(rc, 1, A + SA - rc, B)}L${P(A + n, B)}${arc(n, 0, A, B - n)}Z`;

        // placement + intro
        const eIn = ease.out(prog(f, 0, 36, ease.linear));
        const settle = prog(f, 30, 62, ease.out);
        const tilt = lerp(vert ? 10 : -12, vert ? -1.2 : 1.2, ease.out(prog(f, 0, 46, ease.linear))) * (1 - settle) + (1 - eIn) * 0;
        const tilt2 = Math.sin(clamp((f - 36) / 30) * Math.PI) * 1.4;
        const offX = vert ? (1 - eIn) * 120 : (1 - eIn) * 900;
        const offY = vert ? (1 - eIn) * 1100 : (1 - eIn) * 260;
        const tx0 = (L.W - tw * sc) / 2;
        const ty0 = (L.H - th * sc) / 2;

        // tear
        const tr = p.tear ? prog(f, 136, 176, ease.inOut) : 0;
        const trBack = p.tear ? prog(f, 128, 140, ease.out) * (1 - prog(f, 140, 150, ease.out)) : 0;
        const stubDx = vert ? tr * 20 : tr * 78;
        const stubDy = vert ? tr * 96 : tr * 52;
        const stubRot = tr * (vert ? 7 : 11) + trBack * -2;
        const mainDx = vert ? 0 : -tr * 36;
        const mainDy = vert ? -tr * 44 : 0;
        const pivotX = vert ? 0 : A;
        const pivotY = vert ? A : B;
        const wob = p.tear ? Math.sin(Math.max(0, f - 150) * 0.6) * Math.max(0, 1 - (f - 150) / 30) * 1.2 : 0;

        // shine + stamp
        const shine = prog(f, 178, 214, ease.inOut);
        const stampT = backOut(prog(f, 190, 204, ease.linear), 2.4);

        // content layout
        const pad = 48;
        const inW = mainW - pad * 2;
        const tsize = fitFont(p.eventName, vert ? 88 : 80, 99999, 1);
        const lines = wrapText(p.eventName, tsize, inW, 'display', vert ? 3 : 2);
        const lineSz = Math.min(tsize, Math.max(40, ...lines.map((ln) => fitFont(ln, tsize, inW, 0.66))));
        const titleY0 = vert ? 200 : 168;
        const lh = lineSz * 1.1;
        const afterTitle = titleY0 + (lines.length - 1) * lh;
        const venueY = afterTitle + (vert ? 64 : 58);
        const divY = venueY + 36;
        const gridY = divY + (vert ? 62 : 52);
        const rowGap = vert ? 112 : 82;
        const colW = inW / 2;
        const reveal = (a: number) => ease.out(prog(f, a, a + 20, ease.linear));

        const body = (
          <g>
            <defs>
              <clipPath id={`${uid}-cm`}>
                <path d={mainPath} />
              </clipPath>
              <clipPath id={`${uid}-cs`}>
                <path d={stubPath} />
              </clipPath>
              <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#fff" stopOpacity={0} />
                <stop offset="0.5" stopColor="#fff" stopOpacity={0.65} />
                <stop offset="1" stopColor="#fff" stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* stub */}
            <g transform={`translate(${stubDx} ${stubDy}) rotate(${stubRot} ${pivotX} ${pivotY})`}>
              <path d={stubPath} fill="#000" opacity={0.22} transform="translate(6 12)" />
              <path d={stubPath} fill={p.accent} />
              <g clipPath={`url(#${uid}-cs)`}>
                <circle cx={vert ? tw - 40 : A + SA - 20} cy={vert ? A + SA - 10 : 30} r={110} fill={withAlpha('#ffffff', 0.08)} />
              </g>
              {vert ? (
                <g>
                  <QRPattern x={56} y={A + 52} size={176} seed={p.ticketId} t={prog(f, 80, 126, ease.linear)} color={p.ink} paper={p.ticket} />
                  <text x={290} y={A + 100} fontFamily={fonts.display} fontSize={fitFont(p.admit.toUpperCase(), 52, tw - 330, 0.7)} fill={p.ticket}>
                    {p.admit.toUpperCase()}
                  </text>
                  <text x={290} y={A + 154} fontFamily={fonts.mono} fontWeight={700} fontSize={26} fill={p.ticket} opacity={0.9} letterSpacing={2}>
                    {p.ticketId}
                  </text>
                  <text x={290} y={A + 204} fontFamily={fonts.sans} fontWeight={600} fontSize={22} fill={p.ticket} opacity={0.75} letterSpacing={4}>
                    {p.scanLabel.toUpperCase()}
                  </text>
                </g>
              ) : (
                <g>
                  <text x={A + SA / 2} y={78} textAnchor="middle" fontFamily={fonts.display} fontSize={fitFont(p.admit.toUpperCase(), 44, SA - 40, 0.7)} fill={p.ticket}>
                    {p.admit.toUpperCase()}
                  </text>
                  <QRPattern x={A + (SA - 176) / 2} y={118} size={176} seed={p.ticketId} t={prog(f, 80, 126, ease.linear)} color={p.ink} paper={p.ticket} />
                  <text x={A + SA / 2} y={376} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={fitFont(p.ticketId, 26, SA - 36, 0.62)} fill={p.ticket} opacity={0.95} letterSpacing={2}>
                    {p.ticketId}
                  </text>
                  <text x={A + SA / 2} y={418} textAnchor="middle" fontFamily={fonts.sans} fontWeight={600} fontSize={20} fill={p.ticket} opacity={0.75} letterSpacing={4}>
                    {p.scanLabel.toUpperCase()}
                  </text>
                </g>
              )}
              {/* scan line over the code */}
              {(() => {
                const t = prog(f, 78, 128, ease.inOut);
                if (t <= 0 || t >= 1) return null;
                const qx = vert ? 56 : A + (SA - 176) / 2;
                const qy = (vert ? A + 52 : 118) + t * 176;
                return <rect x={qx - 10} y={qy - 3} width={196} height={6} rx={3} fill={p.accent2} opacity={0.9} />;
              })()}
            </g>

            {/* main ticket */}
            <g transform={`translate(${mainDx} ${mainDy}) rotate(${wob} ${mainW / 2} ${mainH / 2})`}>
              <path d={mainPath} fill="#000" opacity={0.22} transform="translate(6 12)" />
              <path d={mainPath} fill={p.ticket} />
              <g clipPath={`url(#${uid}-cm)`}>
                <rect x={0} y={0} width={mainW} height={vert ? 18 : 18} fill={p.accent} />
                <path d={starPath(mainW - 150, mainH - 150, 230, 0.5)} fill="none" stroke={withAlpha(p.ink, 0.05)} strokeWidth={26} />
                <g transform={`translate(${shine * (mainW + 400) - 300} 0) skewX(-18)`} opacity={shine > 0 && shine < 1 ? 0.9 : 0}>
                  <rect x={0} y={-20} width={150} height={mainH + 40} fill={`url(#${uid}-shine)`} />
                </g>
              </g>

              <g opacity={reveal(30)}>
                <text x={pad} y={vert ? 92 : 80} fontFamily={fonts.sans} fontWeight={800} fontSize={24} letterSpacing={7} fill={p.accent}>
                  {p.eyebrow.toUpperCase()}
                </text>
              </g>
              {lines.map((ln, i) => {
                const k = reveal(42 + i * 8);
                return (
                  <text key={i} x={pad} y={titleY0 + i * lh + (1 - k) * 24} fontFamily={fonts.display} fontSize={lineSz} fill={p.ink} opacity={k}>
                    {ln.toUpperCase()}
                  </text>
                );
              })}
              <g opacity={reveal(62)}>
                <EvIcon name="pin" x={pad + 16} y={venueY - 9} s={30} color={p.accent} sw={1.9} />
                <text x={pad + 42} y={venueY} fontFamily={fonts.sans} fontWeight={600} fontSize={fitFont(p.venue, 30, inW - 50, 0.55)} fill={p.ink} opacity={0.85}>
                  {p.venue}
                </text>
              </g>
              <path d={`M${pad} ${divY}H${mainW - pad}`} stroke={p.ink} strokeWidth={2.4} strokeDasharray="3 11" strokeLinecap="round" opacity={0.28 * reveal(68)} />
              {details.map((d, i) => {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const x = pad + col * colW;
                const y = gridY + row * rowGap;
                const k = reveal(72 + i * 7);
                return (
                  <g key={i} opacity={k} transform={`translate(0 ${(1 - k) * 14})`}>
                    <text x={x} y={y} fontFamily={fonts.sans} fontWeight={800} fontSize={19} letterSpacing={5} fill={p.accent} opacity={0.95}>
                      {d.label.toUpperCase()}
                    </text>
                    <text x={x} y={y + 42} fontFamily={fonts.grotesk} fontWeight={700} fontSize={fitFont(d.value, 40, colW - 20, 0.56)} fill={p.ink}>
                      {d.value}
                    </text>
                  </g>
                );
              })}
              {/* stamp */}
              {stampT > 0 && (
                <g transform={`translate(${mainW - 190} ${vert ? 118 : 100}) rotate(-14) scale(${stampT})`} opacity={0.88 * (1 - 0.25 * (1 - stampT))}>
                  <rect x={-98} y={-34} width={196} height={68} rx={10} fill="none" stroke={mixHex(p.accent2, p.ink, 0.1)} strokeWidth={5} />
                  <text x={0} y={13} textAnchor="middle" fontFamily={fonts.display} fontSize={fitFont(p.admit.toUpperCase(), 40, 170, 0.7)} fill={mixHex(p.accent2, p.ink, 0.1)} letterSpacing={3}>
                    {p.admit.toUpperCase()}
                  </text>
                </g>
              )}
            </g>

            {/* perforation dots (fade as it tears) */}
            <g opacity={1 - clamp(tr * 4)}>
              {Array.from({length: Math.floor((vert ? mainW : mainH) / 26)}, (_, i) => {
                const q = n + 6 + i * 26;
                if (q > (vert ? mainW : mainH) - n - 4) return null;
                return vert ? <circle key={i} cx={q} cy={A} r={3} fill={p.ink} opacity={0.35} /> : <circle key={i} cx={A} cy={q} r={3} fill={p.ink} opacity={0.35} />;
              })}
            </g>
          </g>
        );

        return (
          <g transform={`translate(${tx0 + offX} ${ty0 + offY}) rotate(${tilt + tilt2} ${(tw * sc) / 2} ${(th * sc) / 2}) scale(${sc})`}>{body}</g>
        );
      }}
    </EventStage>
  );
};

export const eventTicketReveal = defineMotion<Props>({
  id: 'event-ticket-reveal',
  title: 'Event ticket reveal & stub tear',
  category: 'text',
  description: 'An admission ticket slides in and settles, its event name, venue and details write on, a QR-style code scans in, then the stub tears off along the perforation while a shine sweeps the ticket and an "admit one" stamp lands.',
  source: ['original (round 3, events & celebrations)'],
  useFor: 'Concert, festival, conference, cinema and match announcements, "tickets on sale" promos, event confirmations and booking flows, gift vouchers. Replace the event name, venue, date/time/seat details and colours; works as a vertical ticket in 9:16.',
  durationInFrames: 240,
  defaultProps: {
    eyebrow: 'Live in concert',
    eventName: 'Summer Lights Festival',
    venue: 'Harbour Arena, Main Stage',
    details: [
      {label: 'Date', value: 'SAT 21 JUN'},
      {label: 'Doors', value: '7:30 PM'},
      {label: 'Gate', value: 'B'},
      {label: 'Seat', value: 'Row F - 12'},
    ],
    ticketId: 'No. 004281',
    admit: 'Admit one',
    scanLabel: 'Scan at gate',
    tear: true,
    background: '#17142B',
    ticket: '#FFF7EA',
    ink: '#241B3A',
    accent: '#E8553D',
    accent2: '#2D9C8F',
    seed: 5,
    startAt: 0,
  },
  propDocs: {
    eyebrow: 'small line above the title (e.g. "Live in concert")',
    eventName: 'event title (wraps to two lines, three in 9:16)',
    venue: 'venue / location line',
    details: 'up to four {label, value} pairs shown in a grid (date, time, gate, seat…)',
    ticketId: 'reference text under the code; also seeds the code pattern',
    admit: 'stub label and stamp text',
    scanLabel: 'small line under the code',
    tear: 'tear the stub off at the end',
    background: 'frame colour (hex), or "transparent" to overlay content',
    ticket: 'paper colour of the ticket (hex)',
    ink: 'text colour (hex)',
    accent: 'stub and top-band colour (hex)',
    accent2: 'scan line and stamp colour (hex)',
    seed: 'reserved for pattern variety',
    startAt: 'frame the sequence begins',
  },
  component: EventTicketReveal,
  tags: ['ticket', 'event', 'concert', 'festival', 'admission', 'qr', 'booking', 'tear', 'stub', 'reveal', 'celebration', 'cinema', 'conference'],
});
