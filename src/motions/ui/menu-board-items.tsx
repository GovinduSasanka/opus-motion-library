import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp} from '../../core/ease';
import {bgOf} from '../../core/commerce-kit';
import {fonts} from '../../core/fonts';
import {backOut, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A cafe / restaurant menu board. Sections and items are written on one after another — name wipes in, dotted leader runs
 * out, price pops. `look` switches between a chalkboard (hand lettering, chalk dust) and a clean printed menu.
 */
type Item = {name: string; desc?: string; price: string};
type Section = {title: string; items: Item[]};
type Props = {
  title: string;
  subtitle: string;
  sections: Section[];
  footer: string;
  look: string;
  stagger: number;
  background: string;
  frameColor: string;
  ink: string;
  accent: string;
  startAt: number;
};

const MenuBoardItems: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, square} = useStage();
  const t = frame - p.startAt;
  const chalk = p.look !== 'clean';
  const sections = (p.sections.length ? p.sections : [{title: 'Menu', items: [{name: 'Item', price: '0'}]}]).slice(0, 6);
  const n = sections.length;
  const m = Math.max(1, ...sections.map((s) => s.items.length));
  const stag = Math.max(3, p.stagger);
  const fontBody = chalk ? fonts.hand : fonts.sans;
  const fontHead = chalk ? fonts.hand : fonts.serif;

  // board geometry
  const border = chalk ? 30 * u : 0;
  const inset = chalk ? Math.min(w, h) * 0.035 : 0;
  const bx = inset;
  const by = inset;
  const bw = w - inset * 2;
  const bh = h - inset * 2;
  const innerPad = Math.min(bw, bh) * 0.05 + border;

  const cols = portrait ? 1 : square ? Math.min(2, n) : Math.min(3, n);
  const rows = Math.ceil(n / cols);
  const headH = bh * (portrait ? 0.17 : 0.24);
  const footH = p.footer ? bh * 0.07 : 0;
  const areaW = bw - innerPad * 2;
  const areaH = bh - innerPad * 2 - headH - footH;
  const gapX = 40 * u;
  const cellW = (areaW - gapX * (cols - 1)) / cols;
  const cellH = areaH / rows;
  const fMaxH = cellH / (2.35 + 2.6 * m);
  const fMaxW = cellW / (chalk ? 11.5 : 13);
  const f = Math.min(fMaxH, fMaxW, (chalk ? 60 : 48) * u);

  const boardBg = chalk ? p.background : p.background;
  const textC = chalk ? p.ink : p.ink;
  const enter = ease.out(sseg(t, 0, 16));
  const titleW = ease.out(sseg(t, 8, 30));

  const sectionStart = (i: number) => 28 + i * (stag * m + 12);

  const chalkId = 'mbi-chalk';
  const wipe = (r: number) => (r >= 0.999 ? 'none' : `inset(-30% ${(1 - r) * 100}% -30% -5%)`);
  const blockH = f * (2.35 + 2.6 * m);
  const yOff = Math.max(0, (cellH - blockH) / 2) * 0.8;

  return (
    <AbsoluteFill style={{background: bgOf(chalk ? p.frameColor : p.background), fontFamily: fontBody, overflow: 'hidden'}}>
      {chalk ? (
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <defs>
            <filter id={chalkId} x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" result="d" />
              <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="3" result="s" />
              <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -0.35" result="m" />
              <feComposite in="d" in2="m" operator="in" />
            </filter>
          </defs>
        </svg>
      ) : null}

      <div
        style={{
          position: 'absolute',
          left: bx,
          top: by,
          width: bw,
          height: bh,
          borderRadius: chalk ? 14 * u : 0,
          background: chalk ? `radial-gradient(ellipse at 30% 20%, ${mixHex(boardBg, '#ffffff', 0.1)}, ${boardBg} 70%)` : boardBg,
          border: chalk ? `${border}px solid ${p.frameColor}` : 'none',
          boxShadow: chalk ? `inset 0 0 ${60 * u}px ${withAlpha('#000000', 0.45)}, 0 ${20 * u}px ${50 * u}px ${withAlpha('#000000', 0.4)}` : 'none',
          opacity: enter,
          boxSizing: 'border-box',
        }}
      />

      <div style={{position: 'absolute', left: bx + innerPad, top: by + innerPad - (chalk ? 6 * u : 0), width: areaW, height: headH, textAlign: 'center', color: textC, filter: chalk ? `url(#${chalkId})` : undefined}}>
        <div style={{display: 'inline-block', clipPath: wipe(titleW)}}>
          <div style={{fontFamily: fontHead, fontWeight: 700, fontSize: Math.min(headH * 0.46, (portrait ? 110 : 100) * u), lineHeight: 1.05, letterSpacing: chalk ? 2 * u : 0}}>{p.title}</div>
        </div>
        <div style={{fontFamily: chalk ? fonts.hand : fonts.mono, fontSize: Math.min(headH * 0.2, 36 * u), letterSpacing: chalk ? 3 * u : 5 * u, color: p.accent, marginTop: 6 * u, textTransform: 'uppercase', opacity: ease.out(sseg(t, 18, 34))}}>{p.subtitle}</div>
        <svg width={Math.min(areaW * 0.5, 520 * u)} height={16 * u} viewBox="0 0 400 16" style={{marginTop: 10 * u, overflow: 'visible'}}>
          <path d="M2 8 Q 30 -2 60 8 T 120 8 T 180 8 T 240 8 T 300 8 T 398 8" fill="none" stroke={p.accent} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - ease.out(sseg(t, 20, 44))} />
        </svg>
      </div>

      {sections.map((s, si) => {
        const c = si % cols;
        const r = Math.floor(si / cols);
        const x = bx + innerPad + c * (cellW + gapX);
        const y = by + innerPad + headH + r * cellH + yOff;
        const s0 = sectionStart(si);
        const hw = ease.out(sseg(t, s0, s0 + 14));
        return (
          <div key={si} style={{position: 'absolute', left: x, top: y, width: cellW, height: cellH, color: textC, filter: chalk ? `url(#${chalkId})` : undefined}}>
            <div style={{display: 'inline-block', clipPath: wipe(hw)}}>
              <div style={{fontFamily: fontHead, fontWeight: 700, fontSize: f * 1.35, lineHeight: 1.2, color: p.accent, textTransform: chalk ? 'none' : 'uppercase', letterSpacing: chalk ? 1 * u : 3 * u}}>{s.title}</div>
            </div>
            <div style={{height: 2.5 * u, width: `${hw * 100}%`, background: withAlpha(p.accent, 0.7), margin: `${f * 0.1}px 0 ${f * 0.5}px`, borderRadius: 2 * u}} />
            {s.items.slice(0, 6).map((it, ii) => {
              const a = s0 + 8 + ii * stag;
              const nameW = ease.out(sseg(t, a, a + 10));
              const leader = ease.out(sseg(t, a + 5, a + 14));
              const pricePop = backOut(sseg(t, a + 9, a + 18), 2.2);
              const priceOn = sseg(t, a + 9, a + 13);
              return (
                <div key={ii} style={{marginBottom: f * 0.45}}>
                  <div style={{display: 'flex', alignItems: 'baseline', gap: f * 0.3, fontSize: f * 1.05, lineHeight: 1.2, fontWeight: chalk ? 700 : 700}}>
                    <span style={{display: 'inline-block', clipPath: wipe(nameW), whiteSpace: 'nowrap'}}>{it.name}</span>
                    <span style={{flex: 1, minWidth: 0, height: 0, borderBottom: `${2.5 * u}px dotted ${withAlpha(textC, 0.45)}`, transform: 'translateY(-0.25em)', transformOrigin: 'left', clipPath: wipe(leader)}} />
                    <span style={{opacity: priceOn, transform: `scale(${lerp(0.6, 1, pricePop)})`, transformOrigin: 'right center', color: p.accent, fontWeight: 800, whiteSpace: 'nowrap'}}>{it.price}</span>
                  </div>
                  {it.desc ? <div style={{fontSize: f * 0.68, lineHeight: 1.3, color: withAlpha(textC, 0.62), opacity: nameW, fontFamily: chalk ? fonts.hand : fonts.sans, fontWeight: 500, fontStyle: chalk ? 'normal' : 'italic'}}>{it.desc}</div> : null}
                </div>
              );
            })}
          </div>
        );
      })}

      {p.footer ? (
        <div style={{position: 'absolute', left: bx + innerPad, width: areaW, bottom: by + innerPad * 0.7, textAlign: 'center', color: withAlpha(textC, 0.7), fontFamily: chalk ? fonts.hand : fonts.mono, fontSize: Math.min(footH * 0.55, 34 * u), letterSpacing: chalk ? 2 * u : 4 * u, textTransform: chalk ? 'none' : 'uppercase', opacity: ease.out(sseg(t, sectionStart(n - 1) + stag * m + 10, sectionStart(n - 1) + stag * m + 26)), filter: chalk ? `url(#${chalkId})` : undefined}}>
          {p.footer}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const menuBoardItems = defineMotion<Props>({
  id: 'menu-board-items',
  title: 'Menu board (chalk or clean)',
  category: 'ui',
  description:
    'A cafe / restaurant menu: heading writes on, then each section and its items appear one after another — name wipe, dotted leader and a price that pops — on a chalkboard with a wooden frame or a clean printed page.',
  source: ['original (round 3)'],
  useFor: 'Cafe, restaurant, bakery and food-truck menus, price lists, specials boards, event menus, any "items with prices" list in sections — set sections, items, prices and colours.',
  durationInFrames: 210,
  defaultProps: {
    title: "Today's Menu",
    subtitle: 'Fresh · Local · Seasonal',
    sections: [
      {
        title: 'Coffee',
        items: [
          {name: 'Espresso', desc: 'Double shot, house blend', price: '$3.0'},
          {name: 'Flat white', desc: 'Silky steamed milk', price: '$4.2'},
          {name: 'Cold brew', desc: '18-hour steep, over ice', price: '$4.8'},
        ],
      },
      {
        title: 'Bakery',
        items: [
          {name: 'Butter croissant', desc: 'Baked every morning', price: '$3.5'},
          {name: 'Cinnamon roll', desc: 'Cream cheese glaze', price: '$4.0'},
          {name: 'Sourdough toast', desc: 'Jam or avocado', price: '$6.5'},
        ],
      },
      {
        title: 'Lunch',
        items: [
          {name: 'Garden salad', desc: 'Seasonal greens, lemon oil', price: '$9.0'},
          {name: 'Tomato soup', desc: 'With grilled cheese', price: '$8.5'},
          {name: 'Veggie wrap', desc: 'Hummus and roast veg', price: '$9.5'},
        ],
      },
    ],
    footer: 'Ask about our daily special',
    look: 'chalk',
    stagger: 8,
    background: '#25352E',
    frameColor: '#7A5636',
    ink: '#F3F0E6',
    accent: '#F4C95D',
    startAt: 0,
  },
  propDocs: {
    title: 'board heading',
    subtitle: 'small line under the heading',
    sections: 'sections up to 6: {title, items:[{name, desc?, price}]} — price is text, so any currency or format',
    footer: "line at the bottom ('' to hide)",
    look: "'chalk' (chalkboard, hand lettering, wooden frame) or 'clean' (printed menu)",
    stagger: 'frames between consecutive items',
    background: "board colour (chalk: board; clean: page) or 'transparent' for clean",
    frameColor: 'wooden frame colour (chalk look only)',
    ink: 'main text / chalk colour',
    accent: 'section titles, prices, underline',
    startAt: 'frame the scene starts',
  },
  component: MenuBoardItems,
  tags: ['menu', 'restaurant', 'cafe', 'coffee', 'food', 'prices', 'chalkboard', 'specials', 'bakery', 'drinks', 'list', 'price list', 'ui'],
});
