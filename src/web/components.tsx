import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Player, Thumbnail, type PlayerRef} from '@remotion/player';
import type {MotionDef} from '../core/types';
import {recipes as allRecipes} from '../recipes';
import {crossfadeWindow, Defs, LayersComp, LoopWindow, MotionComp} from './hosts';
import {CommonPlayerProps, FORMAT_SIZE, LoopMode, MixLayer as LayerSpec, MixSpec as ComposeSpec, MotionResolver, Recipe} from './types';

// ------------------------------------------------------------------------------------------------ hooks

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** true when the visitor asked the OS for reduced motion */
export const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
};

/** [seen-at-least-once (near viewport), visible-now] */
const useViewport = (ref: React.RefObject<HTMLElement | null>, enabled: boolean) => {
  const [near, setNear] = useState(!enabled);
  const [visible, setVisible] = useState(!enabled);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      setVisible(true);
      return;
    }
    const nearObs = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setNear(true), {rootMargin: '300px'});
    const visObs = new IntersectionObserver((es) => setVisible(es.some((e) => e.isIntersecting)), {threshold: 0.15});
    nearObs.observe(el);
    visObs.observe(el);
    return () => {
      nearObs.disconnect();
      visObs.disconnect();
    };
  }, [ref, enabled]);
  return [near, visible] as const;
};

const useSize = (ref: React.RefObject<HTMLElement | null>, enabled: boolean) => {
  const [size, setSize] = useState<{w: number; h: number} | null>(null);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const read = () => setSize({w: el.clientWidth, h: el.clientHeight});
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, enabled]);
  return size;
};

/** resolve several motion ids (sync for the static resolver, async for the lazy one) */
const useDefs = (resolver: MotionResolver, ids: string[]) => {
  const key = ids.join('|');
  const initial = useMemo(() => {
    const out: Defs = {};
    for (const id of ids) {
      const r = resolver.motion(id);
      if (r && typeof (r as Promise<unknown>).then === 'function') return null;
      out[id] = r as MotionDef<any> | undefined;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolver, key]);
  const [defs, setDefs] = useState<Defs | null>(initial);
  useEffect(() => {
    if (initial) {
      setDefs(initial);
      return;
    }
    let alive = true;
    Promise.all(ids.map(async (id) => [id, await resolver.motion(id)] as const)).then((pairs) => alive && setDefs(Object.fromEntries(pairs)));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, resolver, key]);
  return defs;
};

const setAssetBase = (base?: string) => {
  if (base == null || typeof window === 'undefined') return;
  (window as unknown as {remotion_staticBase?: string}).remotion_staticBase = base.replace(/\/+$/, '');
};

// ------------------------------------------------------------------------------------------------ shell

interface ShellProps extends CommonPlayerProps {
  component: React.ComponentType<any> | null;
  inputProps: Record<string, unknown>;
  /** frames of the composition actually played */
  frames: number;
  loopMode: Exclude<LoopMode, 'auto'>;
}

/** sizing (contain / cover), lazy mount, play-on-view, reduced motion → still frame */
const PlayerShell: React.FC<ShellProps> = (p) => {
  const [cw, ch] = p.width && p.height ? [p.width, p.height] : FORMAT_SIZE[p.format ?? 'landscape'];
  const fps = p.fps ?? 30;
  const fit = p.fit ?? 'contain';
  const box = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerRef>(null);
  const reducedPref = useReducedMotion();
  const reduced = (p.respectReducedMotion ?? true) && reducedPref;
  const watch = (p.lazy ?? true) || Boolean(p.playOnView);
  const [near, visible] = useViewport(box, watch);
  const size = useSize(box, fit === 'cover');
  setAssetBase(p.assetBase);

  const loop = p.loopMode === true || p.loopMode === 'restart' || p.loopMode === 'crossfade';
  const autoPlay = p.autoPlay ?? true;

  useEffect(() => {
    if (!p.playOnView) return;
    if (!(visible && autoPlay !== false)) {
      player.current?.pause();
      return;
    }
    // a freshly mounted Player can ignore play() for a few frames: retry until it reports playing
    let tries = 0;
    let raf = 0;
    const kick = () => {
      const pl = player.current;
      if (pl && !pl.isPlaying()) pl.play();
      if (++tries < 30 && !(pl && pl.isPlaying())) raf = requestAnimationFrame(kick);
    };
    kick();
    return () => cancelAnimationFrame(raf);
  }, [visible, p.playOnView, autoPlay, near]);

  useEffect(() => {
    const pl = player.current;
    if (!pl || !p.onEnded) return;
    const cb = () => p.onEnded?.();
    pl.addEventListener('ended', cb);
    return () => pl.removeEventListener('ended', cb);
  }, [p.onEnded, near]);

  const outer: React.CSSProperties =
    fit === 'cover'
      ? {position: 'relative', overflow: 'hidden', width: '100%', height: '100%', background: p.placeholder, ...p.style}
      : {position: 'relative', width: '100%', aspectRatio: `${cw} / ${ch}`, background: p.placeholder, ...p.style};
  let inner: React.CSSProperties = {position: 'absolute', inset: 0, width: '100%', height: '100%'};
  if (fit === 'cover') {
    if (!size || !size.w || !size.h) inner = {display: 'none'};
    else {
      const k = Math.max(size.w / cw, size.h / ch);
      const w = cw * k;
      const h = ch * k;
      inner = {position: 'absolute', left: (size.w - w) / 2, top: (size.h - h) / 2, width: w, height: h};
    }
  }
  const frames = Math.max(1, Math.round(p.frames));
  const still = Math.min(frames - 1, Math.max(0, Math.round(p.stillFrame ?? frames * 0.6)));
  const ready = p.component && (!watch || near);

  return (
    <div ref={box} className={p.className} style={outer} data-opus-motion="">
      {ready && reduced ? (
        <Thumbnail component={p.component!} inputProps={p.inputProps} compositionWidth={cw} compositionHeight={ch} fps={fps} durationInFrames={frames} frameToDisplay={still} style={inner} />
      ) : ready ? (
        <Player
          ref={player}
          component={p.component!}
          inputProps={p.inputProps}
          compositionWidth={cw}
          compositionHeight={ch}
          fps={fps}
          durationInFrames={frames}
          loop={loop}
          autoPlay={p.playOnView ? false : autoPlay}
          controls={p.controls ?? false}
          clickToPlay={p.controls ?? false}
          doubleClickToFullscreen={false}
          spaceKeyToPlayOrPause={false}
          moveToBeginningWhenEnded={loop}
          playbackRate={p.playbackRate ?? 1}
          initiallyMuted
          acknowledgeRemotionLicense={p.acknowledgeRemotionLicense}
          style={inner}
        />
      ) : null}
    </div>
  );
};

const resolveLoop = (mode: LoopMode | undefined, loopable: boolean, fallback: LoopMode): Exclude<LoopMode, 'auto'> => {
  const m = mode ?? fallback;
  if (m === 'auto') return loopable ? 'restart' : 'crossfade';
  return m;
};

// ------------------------------------------------------------------------------------------------ public components

export interface MotionPlayerProps extends CommonPlayerProps {
  /** motion id (see catalog.json / `mgl suggest`) or a MotionDef object */
  motion: string | MotionDef<any>;
  /** props for the motion (merged over its defaults) */
  props?: Record<string, unknown>;
  /** merge the motion's `overlayProps` so it renders on a transparent background (sits on top of your page) */
  overlay?: boolean;
  /** CSS colour behind the motion inside the player */
  background?: string;
}

export interface MotionMixProps extends CommonPlayerProps {
  /** recipe id (recipes/<id>.json) or a Recipe object */
  recipe?: string | Recipe;
  /** a layer stack, bottom to top (same as the `mix` motion / Compose scenes[].layers) */
  layers?: LayerSpec[];
  /** a full multi-scene Compose spec */
  spec?: ComposeSpec;
  /** colour under all layers */
  background?: string;
  /** keep layers whose role is "type" (default true; MotionBackground defaults to false so your HTML carries the words) */
  withText?: boolean;
  /** shallow-merge props into layers by motion id, e.g. {"blur-in-title": {title: "ACME"}} */
  overrides?: Record<string, Record<string, unknown>>;
}

export interface MotionBackgroundProps extends Omit<MotionMixProps, 'fit'> {
  motion?: string | MotionDef<any>;
  props?: Record<string, unknown>;
  /** with `motion`: render it on a transparent background (see MotionPlayer.overlay) */
  overlay?: boolean;
  children?: React.ReactNode;
  /** CSS background painted between the motion and your content, e.g. "linear-gradient(#0008, #0000)" for legibility */
  scrim?: string;
  /** element type of the wrapper (default "section") */
  as?: string;
  /** style / class of the content layer */
  contentStyle?: React.CSSProperties;
  contentClassName?: string;
}

const findRecipe = (r?: string | Recipe) => (typeof r === 'string' ? allRecipes.find((x) => x.id === r) : r);

export const createWebComponents = (resolver: MotionResolver) => {
  const MotionPlayer: React.FC<MotionPlayerProps> = ({motion, props, overlay, background, ...rest}) => {
    const id = typeof motion === 'string' ? motion : motion.id;
    const defs = useDefs(resolver, typeof motion === 'string' ? [motion] : []);
    const def = typeof motion === 'string' ? defs?.[motion] : motion;
    const meta = resolver.meta(id);
    const length = rest.durationInFrames ?? meta?.bestLength ?? def?.durationInFrames ?? 150;
    const loopMode = resolveLoop(rest.loop, meta?.loopable ?? false, true);
    const win: LoopWindow | null = loopMode === 'crossfade' ? crossfadeWindow(length, rest.fps) : null;
    const merged = overlay && meta?.overlayProps ? {...meta.overlayProps, ...(props ?? {})} : props;
    const inputProps = useMemo(() => ({def, id, props: merged, background, window: win}), [def, id, JSON.stringify(merged), background, JSON.stringify(win)]); // eslint-disable-line react-hooks/exhaustive-deps
    return <PlayerShell {...rest} component={def ? MotionComp : null} inputProps={inputProps} frames={win ? length - win.start : length} loopMode={loopMode} />;
  };

  const MotionMix: React.FC<MotionMixProps> = ({recipe: recipeArg, layers: layersArg, spec: specArg, background, withText = true, overrides, ...rest}) => {
    const recipe = findRecipe(recipeArg);
    const spec: ComposeSpec | undefined = specArg ?? (recipe?.scenes ? {width: rest.width, height: rest.height, fps: recipe.fps, background: recipe.background, scenes: recipe.scenes, overlays: recipe.overlays} : undefined);
    const layers = useMemo(() => {
      const raw = (layersArg ?? recipe?.layers ?? []) as (LayerSpec & {role?: string})[];
      return raw.filter((l) => withText || l.role !== 'type').map((l) => (overrides?.[l.motion] ? {...l, props: {...(l.props ?? {}), ...overrides[l.motion]}} : l));
    }, [layersArg, recipe, withText, JSON.stringify(overrides)]); // eslint-disable-line react-hooks/exhaustive-deps
    const ids = useMemo(() => [...new Set(layers.map((l) => l.motion))], [layers]);
    const defs = useDefs(resolver, spec ? [] : ids);
    const format = rest.format ?? recipe?.format;
    // Compose specs: load the composer (pulls in the full registry in the lazy build)
    const [composeMod, setComposeMod] = useState<Awaited<ReturnType<MotionResolver['compose']>> | null>(null);
    useEffect(() => {
      if (!spec) return;
      let alive = true;
      Promise.resolve(resolver.compose()).then((m) => alive && setComposeMod(m));
      return () => {
        alive = false;
      };
    }, [Boolean(spec)]); // eslint-disable-line react-hooks/exhaustive-deps
    if (spec) {
      const frames = composeMod ? composeMod.specDuration(spec) : 1;
      const [w, h] = rest.width && rest.height ? [rest.width, rest.height] : spec.width && spec.height && !rest.format ? [spec.width, spec.height] : FORMAT_SIZE[format ?? 'landscape'];
      const loopMode = resolveLoop(rest.loop ?? recipe?.web?.loop, false, true);
      return (
        <PlayerShell
          {...rest}
          width={w}
          height={h}
          fps={spec.fps ?? rest.fps}
          component={composeMod ? (composeMod.Compose as React.ComponentType<any>) : null}
          inputProps={{spec}}
          frames={rest.durationInFrames ?? frames}
          loopMode={loopMode === 'crossfade' ? true : loopMode}
        />
      );
    }
    const length =
      rest.durationInFrames ??
      recipe?.duration ??
      Math.max(90, ...layers.map((l) => (l.from ?? 0) + (l.duration ?? defs?.[l.motion]?.durationInFrames ?? resolver.meta(l.motion)?.bestLength ?? 90)));
    const allLoopable = layers.every((l) => resolver.meta(l.motion)?.loopable);
    const loopMode = resolveLoop(rest.loop ?? recipe?.web?.loop, allLoopable, true);
    const win = loopMode === 'crossfade' ? crossfadeWindow(length, rest.fps) : null;
    return (
      <PlayerShell
        {...rest}
        format={format}
        component={defs ? LayersComp : null}
        inputProps={{layers, defs: defs ?? {}, background: background ?? recipe?.background, length, window: win}}
        frames={win ? length - win.start : length}
        loopMode={loopMode}
      />
    );
  };

  const MotionBackground: React.FC<MotionBackgroundProps> = ({children, scrim, as = 'section', className, style, contentStyle, contentClassName, motion, props, overlay, withText = false, ...rest}) => {
    const Tag = as as unknown as React.FC<{className?: string; style?: React.CSSProperties; children?: React.ReactNode}>;
    const common = {...rest, fit: 'cover' as const, loop: rest.loop ?? ('auto' as LoopMode), playOnView: rest.playOnView ?? true, style: {position: 'absolute' as const, inset: 0, width: '100%', height: '100%'}};
    return (
      <Tag className={className} style={{position: 'relative', overflow: 'hidden', isolation: 'isolate', ...style}}>
        <div aria-hidden style={{position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none'}}>
          {motion ? <MotionPlayer {...common} motion={motion} props={props} overlay={overlay} /> : <MotionMix {...common} withText={withText} />}
          {scrim ? <div style={{position: 'absolute', inset: 0, background: scrim}} /> : null}
        </div>
        <div className={contentClassName} style={{position: 'relative', zIndex: 1, ...contentStyle}}>
          {children}
        </div>
      </Tag>
    );
  };

  return {MotionPlayer, MotionMix, MotionBackground};
};

export {PlayerShell};
