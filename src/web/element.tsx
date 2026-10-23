/**
 * <opus-motion> custom element — for plain HTML, Vue, Svelte, Astro, WordPress… (no build step needed).
 *
 *   <script src="/opus-motion.element.js"></script>
 *   <opus-motion motion="aurora" props='{"pixelSize":0}' format="landscape" loop autoplay></opus-motion>
 *   <opus-motion recipe="hero-aurora-night" background style="position:absolute;inset:0"></opus-motion>
 *
 * Attributes
 *   motion       motion id                      recipe     recipe id (layer mix or multi-scene)
 *   props        JSON props for `motion`        layers     JSON layer stack (instead of motion / recipe)
 *   overrides    JSON {motionId: props} merged into recipe layers
 *   format       landscape | square | portrait  width / height   composition size (overrides format)
 *   fps, duration (frames)
 *   loop         "" | true | false | restart | crossfade | auto | once   (default: auto)
 *   autoplay     (default on; autoplay="false" to disable)       controls
 *   fit          contain | cover                background  shorthand for fit=cover, full-bleed, no pointer events
 *   overlay      transparent background (motion only)
 *   with-text    keep recipe "type" layers (default on, off when `background` is set)
 *   play-on-view (default on)   reduced-motion  "still" (default) | "play"
 *   still-frame  frame shown for reduced motion
 *   asset-base   URL where the library's public/ folder is served (default: site root)
 * Events: "opus-ended".
 */
import React from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {createWebComponents} from './components';
import {staticResolver} from './static';
import {recipes} from '../recipes';
import {motionMeta} from '../meta';
import type {Format, LoopMode} from './types';

const {MotionPlayer, MotionMix} = createWebComponents(staticResolver);

const json = (s: string | null) => {
  if (!s) return undefined;
  try {
    return JSON.parse(s);
  } catch (e) {
    console.warn('<opus-motion>: invalid JSON attribute', s, e);
    return undefined;
  }
};
const flag = (el: HTMLElement, name: string, def: boolean) => {
  if (!el.hasAttribute(name)) return def;
  const v = el.getAttribute(name);
  return v !== 'false' && v !== '0' && v !== 'off';
};
const num = (s: string | null) => (s == null || s === '' ? undefined : Number(s));

const ATTRS = ['look', 'motion', 'recipe', 'props', 'layers', 'overrides', 'format', 'width', 'height', 'fps', 'duration', 'loop', 'autoplay', 'controls', 'fit', 'background', 'overlay', 'with-text', 'play-on-view', 'reduced-motion', 'still-frame', 'asset-base'];

class OpusMotionElement extends HTMLElement {
  static observedAttributes = ATTRS;
  private root: Root | null = null;
  private mount: HTMLDivElement | null = null;

  connectedCallback() {
    if (!this.mount) {
      this.mount = document.createElement('div');
      this.mount.style.cssText = 'width:100%;height:100%;';
      this.appendChild(this.mount);
      this.root = createRoot(this.mount);
    }
    if (!this.style.display) this.style.display = 'block';
    this.render();
  }

  disconnectedCallback() {
    // defer so moving the element in the DOM doesn't tear it down
    queueMicrotask(() => {
      if (!this.isConnected && this.root) {
        this.root.unmount();
        this.root = null;
        this.mount?.remove();
        this.mount = null;
      }
    });
  }

  attributeChangedCallback() {
    if (this.root) this.render();
  }

  private render() {
    const bg = this.hasAttribute('background');
    if (bg) {
      this.style.pointerEvents = 'none';
      if (!this.style.position && getComputedStyle(this).position === 'static') {
        this.style.position = 'absolute';
        this.style.inset = '0';
      }
    }
    const loopAttr = this.getAttribute('loop');
    const loop: LoopMode | undefined = !this.hasAttribute('loop') ? 'auto' : loopAttr === '' || loopAttr === 'true' ? 'auto' : loopAttr === 'false' ? false : (loopAttr as LoopMode);
    const fit = (this.getAttribute('fit') as 'contain' | 'cover' | null) ?? (bg ? 'cover' : 'contain');
    const common = {
      format: (this.getAttribute('format') as Format | null) ?? undefined,
      width: num(this.getAttribute('width')),
      height: num(this.getAttribute('height')),
      fps: num(this.getAttribute('fps')),
      durationInFrames: num(this.getAttribute('duration')),
      loop,
      autoPlay: flag(this, 'autoplay', true),
      controls: flag(this, 'controls', false),
      fit,
      playOnView: flag(this, 'play-on-view', true),
      respectReducedMotion: this.getAttribute('reduced-motion') !== 'play',
      stillFrame: num(this.getAttribute('still-frame')),
      assetBase: this.getAttribute('asset-base') ?? undefined,
      look: this.getAttribute('look') ?? undefined,
      style: fit === 'cover' ? {width: '100%', height: '100%'} : undefined,
      onEnded: () => this.dispatchEvent(new CustomEvent('opus-ended')),
    };
    const motion = this.getAttribute('motion');
    const recipe = this.getAttribute('recipe');
    const layers = json(this.getAttribute('layers'));
    let el: React.ReactNode = null;
    if (motion) el = <MotionPlayer {...common} motion={motion} props={json(this.getAttribute('props'))} overlay={flag(this, 'overlay', false)} />;
    else if (recipe || layers) el = <MotionMix {...common} recipe={recipe ?? undefined} layers={layers} overrides={json(this.getAttribute('overrides'))} withText={flag(this, 'with-text', !bg)} />;
    this.root?.render(el);
  }
}

if (typeof window !== 'undefined' && !customElements.get('opus-motion')) customElements.define('opus-motion', OpusMotionElement);

/** what the element can play — handy in the console: OpusMotion.motions */
(window as unknown as {OpusMotion: unknown}).OpusMotion = {motions: Object.keys(motionMeta), recipes: recipes.map((r) => r.id)};
