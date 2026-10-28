import React from 'react';

/** Eye library for eyes-blink (group E1): one eye per glyph, centred on the origin. Pure function of frame. */

export const EXTRA_EYES = ['happy', 'closed', 'sleepy', 'narrow', 'angry', 'determined', 'sad', 'teary', 'cry', 'heart', 'x', 'swirl', 'spark', 'shades', 'scared', 'dot'];

/** sd = -1 left / +1 right; open = blink openness 0.1..1 */
export const EyeGlyph: React.FC<{kind: string; ew: number; eh: number; k: number; color: string; open: number; sd: number; id: string; frame: number}> = ({kind, ew, eh, k, color, open, sd, id, frame}) => {
  const sw = 11 * k;
  const stroke = {fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  const oval = (
    <>
      <ellipse rx={ew / 2} ry={eh / 2} fill={color} />
      <circle cx={ew * 0.12} cy={-eh * 0.22} r={ew * 0.2} fill="#fff" />
    </>
  );
  // angled lid: positive slope = inner end lower (angry / determined), negative = inner end higher (sad)
  const slanted = (slope: number, withLight: boolean) => {
    const yl = -eh * 0.5 + slope * -sd * ew * -1; // y of the lid at x = -ew (left edge of the box)
    const yr = -eh * 0.5 - slope * -sd * ew * -1;
    return (
      <g>
        <clipPath id={`${id}-sl`}>
          <polygon points={`${-ew},${yl} ${ew},${yr} ${ew},${eh} ${-ew},${eh}`} />
        </clipPath>
        <g clipPath={`url(#${id}-sl)`}>
          <ellipse rx={ew / 2} ry={eh / 2} fill={color} />
          {withLight && <circle cx={ew * 0.12} cy={-eh * 0.1} r={ew * 0.16} fill="#fff" />}
        </g>
        <line x1={-ew * 0.8} y1={yl * 0.8 - eh * 0.1} x2={ew * 0.8} y2={yr * 0.8 - eh * 0.1} stroke={color} strokeWidth={sw * 0.8} strokeLinecap="round" />
      </g>
    );
  };
  switch (kind) {
    case 'happy':
      return <path d={`M${-ew * 0.75} ${eh * 0.12} Q0 ${-eh * 0.55} ${ew * 0.75} ${eh * 0.12}`} {...stroke} />;
    case 'closed':
      return <path d={`M${-ew * 0.75} ${-eh * 0.05} Q0 ${eh * 0.32} ${ew * 0.75} ${-eh * 0.05}`} {...stroke} />;
    case 'sleepy': {
      const lid = Math.max(0.35, open * 0.55);
      const top = -eh * 0.5 + eh * (1 - lid);
      return (
        <g>
          <clipPath id={`${id}-sy`}>
            <rect x={-ew} y={top} width={ew * 2} height={eh} />
          </clipPath>
          <g clipPath={`url(#${id}-sy)`}>
            <ellipse rx={ew / 2} ry={eh / 2} fill={color} />
          </g>
          <line x1={-ew * 0.7} x2={ew * 0.7} y1={top} y2={top} stroke={color} strokeWidth={sw * 0.9} strokeLinecap="round" />
        </g>
      );
    }
    case 'narrow':
      return <ellipse rx={ew * 0.62} ry={eh * 0.11} fill={color} />;
    case 'angry':
      return slanted(0.28, true);
    case 'determined':
      return slanted(0.16, false);
    case 'sad':
      return slanted(-0.22, true);
    case 'teary': {
      const ty = ((frame % 40) / 40) * eh * 0.5;
      return (
        <g>
          <ellipse rx={ew * 0.58} ry={eh * 0.56} fill={color} />
          <circle cx={ew * 0.14} cy={-eh * 0.2} r={ew * 0.22} fill="#fff" />
          <circle cx={-ew * 0.12} cy={eh * 0.14} r={ew * 0.1} fill="#fff" opacity={0.8} />
          <path d={`M${sd * ew * 0.35} ${eh * 0.55 + ty} q${-ew * 0.26} ${eh * 0.22} 0 ${eh * 0.32} q${ew * 0.26} ${-eh * 0.1} 0 ${-eh * 0.32} Z`} fill="#7DB3E0" />
        </g>
      );
    }
    case 'cry': {
      const t = (frame % 24) / 24;
      return (
        <g>
          <path d={`M${-ew * 0.75} ${-eh * 0.05} Q0 ${eh * 0.32} ${ew * 0.75} ${-eh * 0.05}`} {...stroke} />
          <path d={`M${-ew * 0.1} ${eh * 0.1} q${-ew * 0.1} ${eh * 0.35 * (0.5 + t)} ${-ew * 0.05} ${eh * 0.7 * (0.5 + t)}`} fill="none" stroke="#7DB3E0" strokeWidth={sw * 0.9} strokeLinecap="round" opacity={1 - t * 0.6} />
        </g>
      );
    }
    case 'heart': {
      const s = ew * 0.95 * (1 + 0.06 * Math.sin(frame * 0.3));
      return <path d={`M0 ${s * 0.8} C${-s * 1.6} ${-s * 0.4} ${-s * 0.6} ${-s * 1.2} 0 ${-s * 0.4} C${s * 0.6} ${-s * 1.2} ${s * 1.6} ${-s * 0.4} 0 ${s * 0.8} Z`} fill="#FFC9D6" />;
    }
    case 'x':
      return (
        <g {...stroke}>
          <line x1={-ew * 0.5} y1={-eh * 0.3} x2={ew * 0.5} y2={eh * 0.3} />
          <line x1={ew * 0.5} y1={-eh * 0.3} x2={-ew * 0.5} y2={eh * 0.3} />
        </g>
      );
    case 'swirl': {
      const pts = Array.from({length: 40}, (_, i) => {
        const t = i / 39;
        const a = t * Math.PI * 5 + frame * 0.35 * sd;
        const r = t * ew * 0.75;
        return `${i ? 'L' : 'M'}${Math.cos(a) * r} ${Math.sin(a) * r}`;
      }).join(' ');
      return <path d={pts} {...stroke} strokeWidth={sw * 0.7} />;
    }
    case 'spark': {
      const r = eh * 0.5 * (1 + 0.08 * Math.sin(frame * 0.4));
      return <path d={`M0 ${-r} Q${r * 0.12} ${-r * 0.12} ${r * 0.8} 0 Q${r * 0.12} ${r * 0.12} 0 ${r} Q${-r * 0.12} ${r * 0.12} ${-r * 0.8} 0 Q${-r * 0.12} ${-r * 0.12} 0 ${-r} Z`} fill={color} />;
    }
    case 'shades':
      return (
        <g>
          <rect x={-ew * 0.8} y={-eh * 0.3} width={ew * 1.6} height={eh * 0.6} rx={ew * 0.25} fill={color} />
          <line x1={-ew * 0.5} y1={-eh * 0.15} x2={-ew * 0.1} y2={-eh * 0.15} stroke="#fff" strokeOpacity={0.55} strokeWidth={sw * 0.5} strokeLinecap="round" />
        </g>
      );
    case 'scared':
      return (
        <g>
          <ellipse rx={ew * 0.62} ry={eh * 0.56} fill="#fff" stroke={color} strokeWidth={sw * 0.5} />
          <circle cx={Math.sin(frame * 1.7) * ew * 0.05} cy={0} r={ew * 0.1} fill={color} />
        </g>
      );
    case 'dot':
      return <circle r={ew * 0.2} fill={color} />;
    default:
      return oval;
  }
};
