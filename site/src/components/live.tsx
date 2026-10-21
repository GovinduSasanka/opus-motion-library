import React, {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {MotionMix, MotionPlayer, useReducedMotion} from 'opus-motion-library/web';
import {BASE} from '../data';

/*
 * One "hover slot" for the whole page: at most one card plays live at a time (plus the hero or an open detail panel),
 * everything else stays a static thumbnail.
 */
let current: string | null = null;
let locked = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
export const hoverSlot = {
  set(id: string | null) {
    if (locked && id) return;
    if (current !== id) {
      current = id;
      emit();
    }
  },
  /** while a detail panel is open, cards don't play on hover */
  lock(v: boolean) {
    locked = v;
    if (v) current = null;
    emit();
  },
  get: () => current,
  sub: (f: () => void) => {
    subs.add(f);
    return () => subs.delete(f);
  },
};
export const useHoverSlot = () => useSyncExternalStore(hoverSlot.sub, hoverSlot.get, hoverSlot.get);

const canHover = () => typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

/** hover/focus handlers that claim the slot after a short intent delay */
export const useHoverIntent = (id: string) => {
  const t = useRef<number>(0);
  const active = useHoverSlot() === id;
  const reduced = useReducedMotion();
  useEffect(() => () => window.clearTimeout(t.current), []);
  const enter = () => {
    if (reduced || !canHover()) return;
    window.clearTimeout(t.current);
    t.current = window.setTimeout(() => hoverSlot.set(id), 180);
  };
  const leave = () => {
    window.clearTimeout(t.current);
    if (hoverSlot.get() === id) hoverSlot.set(null);
  };
  return {active, handlers: {onMouseEnter: enter, onMouseLeave: leave, onFocus: enter, onBlur: leave}};
};

/** shared IntersectionObserver: thumbnails only load their image when they come near the viewport */
let io: IntersectionObserver | null = null;
const seen = new WeakMap<Element, () => void>();
const observe = (el: Element, cb: () => void) => {
  if (typeof IntersectionObserver === 'undefined') return cb();
  io ??= new IntersectionObserver(
    (es) => {
      for (const e of es) {
        if (!e.isIntersecting) continue;
        seen.get(e.target)?.();
        seen.delete(e.target);
        io!.unobserve(e.target);
      }
    },
    {rootMargin: '400px 0px'},
  );
  seen.set(el, cb);
  io.observe(el);
  return () => {
    seen.delete(el);
    io?.unobserve(el);
  };
};

/** the middle frame of a 3-frame gallery strip (gallery/<id>.jpg is 1440×270 = three 480×270 frames) */
export const Strip: React.FC<{src: string; className?: string; frame?: 0 | 1 | 2; contain?: boolean}> = ({src, className, frame = 1, contain}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => (ref.current ? observe(ref.current, () => setNear(true)) : undefined), []);
  const bg = near ? `url(${src})` : undefined;
  return (
    <div
      ref={ref}
      className={`strip ${near ? 'is-loaded' : ''} ${className ?? ''}`}
      style={
        contain
          ? {backgroundImage: bg, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'}
          : {backgroundImage: bg, backgroundSize: '300% 100%', backgroundPosition: `${frame * 50}% 0`}
      }
      aria-hidden
    />
  );
};

/** fade the live player in over the thumbnail once it has had a moment to mount */
export const LiveLayer: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(true), 260);
    return () => window.clearTimeout(t);
  }, []);
  return <div className={`live-layer ${shown ? 'is-shown' : ''}`}>{children}</div>;
};

/*
 * Players render their composition at the box's DEVICE pixel size (CSS width × devicePixelRatio), not 1920×1080.
 * Motions are resolution-independent (u-units), so the picture is the same — but it is much cheaper to draw, and
 * the library's SVG pixelate / dither filters (aurora, pixel-dither…) use 1-unit sample dots that Chrome drops when a
 * 1920-wide frame is shown scaled down, leaving those motions blank in small players.
 */
const ASPECTS = {landscape: 16 / 9, square: 1, portrait: 9 / 16} as const;
export type Fmt = keyof typeof ASPECTS;

export const useDeviceSize = (ref: React.RefObject<HTMLElement | null>, format: Fmt): [number, number] | null => {
  const [size, setSize] = useState<[number, number] | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const a = ASPECTS[format];
      // the box may be cropped (cover) — size the composition so it covers the box
      let w = r.width * dpr;
      let h = w / a;
      if (h < r.height * dpr) {
        h = r.height * dpr;
        w = h * a;
      }
      const k = Math.min(1, 1920 / Math.max(w, h));
      const even = (x: number) => Math.max(2, Math.round((x * k) / 2) * 2);
      setSize((old) => {
        const next: [number, number] = [even(w), even(h)];
        return old && Math.abs(old[0] - next[0]) < 8 ? old : next;
      });
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, format]);
  return size;
};

/** measures its box and renders children with the composition size to use */
export const Sized: React.FC<{format: Fmt; className?: string; style?: React.CSSProperties; children: (w: number, h: number) => React.ReactNode}> = ({format, className, style, children}) => {
  const ref = useRef<HTMLDivElement>(null);
  const size = useDeviceSize(ref, format);
  return (
    <div ref={ref} className={className} style={{position: 'absolute', inset: 0, ...style}}>
      {size ? children(size[0], size[1]) : null}
    </div>
  );
};

export const LiveMotion: React.FC<{id: string}> = ({id}) => (
  <LiveLayer>
    <Sized format="landscape">
      {(w, h) => <MotionPlayer motion={id} width={w} height={h} assetBase={BASE} lazy={false} playOnView loop="auto" fit="cover" style={{position: 'absolute', inset: 0}} placeholder="transparent" />}
    </Sized>
  </LiveLayer>
);

const PORTRAIT_BOX: React.CSSProperties = {position: 'absolute', top: 0, bottom: 0, left: '50%', right: 'auto', transform: 'translateX(-50%)', height: '100%', width: 'auto', aspectRatio: '9 / 16'};

export const LiveRecipe: React.FC<{id: string; portrait?: boolean}> = ({id, portrait}) => (
  <LiveLayer>
    <Sized format={portrait ? 'portrait' : 'landscape'} style={portrait ? PORTRAIT_BOX : undefined}>
      {(w, h) => <MotionMix recipe={id} width={w} height={h} assetBase={BASE} lazy={false} playOnView loop fit="cover" style={{position: 'absolute', inset: 0}} placeholder="transparent" />}
    </Sized>
  </LiveLayer>
);
