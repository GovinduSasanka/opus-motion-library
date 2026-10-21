import React, {useEffect, useMemo, useRef} from 'react';
import {MotionPlayer} from 'opus-motion-library/web';
import {CodeTabs} from '../components/Code';
import {Sized} from '../components/live';
import {BASE, BLOB, byId, transitions} from '../data';
import {go, href} from '../router';
import {transitionSnippets} from '../snippets';

const HOLD = 42;

export const Transitions: React.FC<{id?: string}> = ({id}) => {
  const sel = id === 'all' ? 'all' : (transitions.find((t) => t.key === id) ?? transitions.find((t) => t.key === 'iris')!).key;
  const t = transitions.find((x) => x.key === sel);
  const reel = byId.get('transition-reel');
  const props = useMemo(() => (t ? {types: [t.key], holdFrames: HOLD, title: 'Scene A'} : {}), [t]);
  const duration = t ? 2 * HOLD + t.frames : (reel?.bestLength ?? 1500);
  const snippets = useMemo(() => transitionSnippets(t?.type ?? 'iris', t?.variant), [t]);
  const list = useRef<HTMLElement>(null);
  // keep the selected entry visible inside the list (vertical on desktop, a horizontal strip on phones) without scrolling the page
  useEffect(() => {
    const box = list.current;
    const el = box?.querySelector<HTMLElement>('.tx-item.is-on');
    if (!box || !el) return;
    if (box.scrollWidth > box.clientWidth) box.scrollTo({left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2, behavior: 'smooth'});
    else if (el.offsetTop < box.scrollTop || el.offsetTop + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTo({top: el.offsetTop - box.clientHeight / 3, behavior: 'smooth'});
  }, [sel]);
  return (
    <div className="page wrap">
      <header className="page-head">
        <p className="eyebrow">Transitions</p>
        <h1 className="h1">
          {transitions.length} ways <em>from one scene to the next.</em>
        </h1>
        <p className="sub">
          Iris, ink blob, torn paper, page turn, whiteout, glitch, liquid wave… Each one is a <code>@remotion/transitions</code> presentation: put{' '}
          <code>{'"transition": {"type": "iris"}'}</code> on a scene in a Compose spec.
        </p>
      </header>
      <div className="tx">
        <aside ref={list} className="tx-list" aria-label="Transition types">
          <a className={`tx-item ${sel === 'all' ? 'is-on' : ''}`} href={href('transitions', 'all')} onClick={(e) => (e.preventDefault(), go('transitions', 'all', true))}>
            <span className="tx-name">All, back to back</span>
            <span className="tx-frames">{Math.round((reel?.bestLength ?? 0) / 30)}s</span>
          </a>
          {transitions.map((x) => (
            <a key={x.key} className={`tx-item ${x.key === sel ? 'is-on' : ''}`} href={href('transitions', x.key)} onClick={(e) => (e.preventDefault(), go('transitions', x.key, true))}>
              <span className="tx-name">
                {x.type}
                {x.variant && <em> · {x.variant}</em>}
              </span>
              <span className="tx-frames">{x.frames}f</span>
            </a>
          ))}
        </aside>
        <div className="tx-main">
          <div className="stage is-landscape">
            <div className="stage-box" style={{aspectRatio: '16 / 9'}}>
              <Sized key={sel} format="landscape">
                {(w, h) => <MotionPlayer motion="transition-reel" props={props} width={w} height={h} durationInFrames={duration} assetBase={BASE} lazy={false} loop="restart" controls fit="cover" style={{position: 'absolute', inset: 0}} placeholder="#0d0f14" />}
              </Sized>
            </div>
          </div>
          {t ? (
            <div className="tx-info">
              <h2 className="detail-title">
                {t.type}
                {t.variant && <em> · {t.variant}</em>}
              </h2>
              <p className="detail-desc">{t.looks}</p>
              <dl className="facts">
                <dt>Spec</dt>
                <dd>
                  <code>{JSON.stringify(t.variant ? {type: t.type, variant: t.variant} : {type: t.type})}</code>
                </dd>
                <dt>Frames</dt>
                <dd>{t.frames} recommended (set "frames" to override)</dd>
                {t.fields && t.fields !== '—' && (
                  <>
                    <dt>Fields</dt>
                    <dd>{t.fields}</dd>
                  </>
                )}
                {t.source && t.source !== '—' && (
                  <>
                    <dt>Reverse-engineered from</dt>
                    <dd>{t.source}</dd>
                  </>
                )}
              </dl>
            </div>
          ) : (
            <div className="tx-info">
              <h2 className="detail-title">Every transition</h2>
              <p className="detail-desc">The transition-reel motion plays all {transitions.length} between contrasting labelled panels. Each panel names the transition that revealed it.</p>
            </div>
          )}
          <CodeTabs key={sel} snippets={snippets} />
          <p className="sub small">
            Field reference:{' '}
            <a href={`${BLOB}/docs/TRANSITIONS.md`} target="_blank" rel="noreferrer">
              docs/TRANSITIONS.md
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
