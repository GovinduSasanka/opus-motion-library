import React, {useCallback, useDeferredValue, useEffect, useMemo, useRef, useState} from 'react';
import {MotionPlayer, type CatalogEntry} from 'opus-motion-library/web';
import {Badges, MotionCard} from '../components/Cards';
import {Sized} from '../components/live';
import {CodeTabs} from '../components/Code';
import {CloseButton, Drawer, Segmented} from '../components/Drawer';
import {BASE, BLOB, byId, catalog, CATEGORY_LABEL, diffProps, orderCategories, fmtValue, starterProps} from '../data';
import {go, href} from '../router';
import {motionSnippets} from '../snippets';

type Fmt = 'landscape' | 'square' | 'portrait';
const ASPECT: Record<Fmt, string> = {landscape: '16 / 9', square: '1 / 1', portrait: '9 / 16'};

const TOGGLES: {id: 'overlay' | 'image' | 'text' | 'light' | 'loop'; label: string; test: (m: CatalogEntry) => boolean}[] = [
  {id: 'overlay', label: 'Overlay', test: (m) => m.overlay},
  {id: 'image', label: 'Takes image', test: (m) => m.takesImage},
  {id: 'text', label: 'Takes text', test: (m) => m.takesText},
  {id: 'loop', label: 'Loops', test: (m) => m.loopable},
  {id: 'light', label: 'Lightweight', test: (m) => m.weight === 'light'},
];

const haystack = (m: CatalogEntry) => [m.id, m.title, m.category, CATEGORY_LABEL[m.category], m.description, m.useFor, ...m.tags, ...m.mood, ...m.roles].join(' ').toLowerCase();
const HAY = new Map(catalog.map((m) => [m.id, haystack(m)]));

export const Gallery: React.FC<{id?: string}> = ({id}) => {
  const [cat, setCat] = useState<string>('all');
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const [on, setOn] = useState<Set<string>>(new Set());
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of catalog) c[m.category] = (c[m.category] ?? 0) + 1;
    return c;
  }, []);
  const list = useMemo(() => {
    const words = dq.toLowerCase().split(/\s+/).filter(Boolean);
    return catalog.filter(
      (m) =>
        (cat === 'all' || m.category === cat) &&
        TOGGLES.every((t) => !on.has(t.id) || t.test(m)) &&
        words.every((w) => HAY.get(m.id)!.includes(w)),
    );
  }, [cat, dq, on]);
  const open = useCallback((mid: string) => go('gallery', mid), []);
  const close = useCallback(() => go('gallery'), []);
  const current = id ? byId.get(id) : undefined;
  const idx = current ? list.findIndex((m) => m.id === current.id) : -1;

  return (
    <div className="page wrap">
      <header className="page-head">
        <p className="eyebrow">Gallery</p>
        <h1 className="h1">
          {catalog.length} motions, <em>all live.</em>
        </h1>
        <p className="sub">Hover a card to play it in the browser. Open one to change its props, switch format and copy the code.</p>
      </header>

      <div className="toolbar" role="search">
        <label className="search">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" fill="none" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search — “neon”, “ocean”, “counter”, “paper”…" aria-label="Search motions" />
          {q && (
            <button className="search-clear" onClick={() => setQ('')} aria-label="Clear search">
              ×
            </button>
          )}
        </label>
        <div className="toggles" aria-label="Filters">
          {TOGGLES.map((t) => (
            <button
              key={t.id}
              className={`toggle ${on.has(t.id) ? 'is-on' : ''}`}
              aria-pressed={on.has(t.id)}
              onClick={() =>
                setOn((s) => {
                  const n = new Set(s);
                  if (n.has(t.id)) n.delete(t.id);
                  else n.add(t.id);
                  return n;
                })
              }
            >
              <span className="toggle-box" aria-hidden />
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="chips" role="tablist" aria-label="Categories">
        <button className={`chip ${cat === 'all' ? 'is-on' : ''}`} onClick={() => setCat('all')}>
          All <span>{catalog.length}</span>
        </button>
        {orderCategories(Object.keys(counts)).map((c) => (
          <button key={c} className={`chip ${cat === c ? 'is-on' : ''}`} onClick={() => setCat(c)}>
            {CATEGORY_LABEL[c]} <span>{counts[c]}</span>
          </button>
        ))}
      </div>

      <p className="result-count" aria-live="polite">
        {list.length === catalog.length ? `Showing all ${list.length}` : `${list.length} of ${catalog.length}`}
      </p>
      {list.length ? (
        <div className="grid grid-cards">
          {list.map((m) => (
            <MotionCard key={m.id} m={m} onOpen={open} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <p>No motion matches. Try fewer filters, or ask the suggester:</p>
          <code>node cli/mgl.mjs suggest "{q || 'your idea'}"</code>
        </div>
      )}

      <Drawer open={Boolean(current)} onClose={close} label={current ? current.title : ''} wide>
        {current && (
          <MotionDetail
            key={current.id}
            m={current}
            onClose={close}
            prev={idx > 0 ? list[idx - 1].id : undefined}
            next={idx >= 0 && idx < list.length - 1 ? list[idx + 1].id : undefined}
          />
        )}
      </Drawer>
    </div>
  );
};

const MotionDetail: React.FC<{m: CatalogEntry; onClose: () => void; prev?: string; next?: string}> = ({m, onClose, prev, next}) => {
  const [format, setFormat] = useState<Fmt>('landscape');
  const initial = useMemo(() => starterProps(m), [m]);
  const initialText = useMemo(() => JSON.stringify(initial, null, 2), [initial]);
  const [text, setText] = useState(initialText);
  const [applied, setApplied] = useState<Record<string, unknown>>(initial);
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef(0);
  const onEdit = (v: string) => {
    setText(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        const p = v.trim() ? JSON.parse(v) : {};
        if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('props must be a JSON object');
        const unknown = Object.keys(p).filter((k) => !m.props[k]);
        setErr(unknown.length ? `unknown prop${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')} (ignored by the motion)` : null);
        setApplied(p);
      } catch (e) {
        setErr((e as Error).message.replace(/^JSON\.parse: /, ''));
      }
    }, 350);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' && next) go('gallery', next, true);
      if (e.key === 'ArrowLeft' && prev) go('gallery', prev, true);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [prev, next]);
  const changed = diffProps(m, applied);
  const snippets = useMemo(() => motionSnippets(m.id, changed, format, m.overlay), [m.id, JSON.stringify(changed), format, m.overlay]); // eslint-disable-line react-hooks/exhaustive-deps
  const secs = (m.bestLength / 30).toFixed(1);

  return (
    <div className="detail">
      <div className="detail-top">
        <div className="detail-crumbs">
          <span className="card-cat static">{CATEGORY_LABEL[m.category] ?? m.category}</span>
          <code>{m.id}</code>
        </div>
        <div className="detail-nav">
          <button className="icon-btn" disabled={!prev} onClick={() => prev && go('gallery', prev, true)} aria-label="Previous motion">
            ‹
          </button>
          <button className="icon-btn" disabled={!next} onClick={() => next && go('gallery', next, true)} aria-label="Next motion">
            ›
          </button>
          <CloseButton onClick={onClose} />
        </div>
      </div>
      <h2 className="detail-title">{m.title}</h2>

      <div className="stage-tools">
        <Segmented
          label="Format"
          value={format}
          onChange={(v) => setFormat(v as Fmt)}
          options={(['landscape', 'square', 'portrait'] as Fmt[]).map((f) => ({id: f, label: f === 'landscape' ? '16:9' : f === 'square' ? '1:1' : '9:16', disabled: !m.formats.includes(f)}))}
        />
        <span className="stage-meta">
          {secs}s · {m.loopable ? 'seamless loop' : 'plays, then restarts'} · {m.weight}
        </span>
      </div>
      <div className={`stage is-${format}`}>
        <div className="stage-box" style={{aspectRatio: ASPECT[format]}}>
          <Sized key={format} format={format}>
            {(w, h) => <MotionPlayer motion={m.id} props={applied} width={w} height={h} assetBase={BASE} lazy={false} loop controls fit="cover" style={{position: 'absolute', inset: 0}} placeholder="#0d0f14" />}
          </Sized>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-info">
          <p className="detail-desc">{m.description}</p>
          <dl className="facts">
            <dt>Use for</dt>
            <dd>{m.useFor}</dd>
            <dt>Roles</dt>
            <dd>{m.roles.join(', ')}</dd>
            <dt>Mood</dt>
            <dd>{m.mood.join(', ')}</dd>
            {m.pairsWith.length > 0 && (
              <>
                <dt>Pairs with</dt>
                <dd className="pairs">
                  {m.pairsWith.map((p) =>
                    byId.has(p) ? (
                      <a key={p} href={href('gallery', p)} onClick={(e) => (e.preventDefault(), go('gallery', p, true))}>
                        {p}
                      </a>
                    ) : (
                      <span key={p}>{p}</span>
                    ),
                  )}
                </dd>
              </>
            )}
            {m.avoid && (
              <>
                <dt>Avoid</dt>
                <dd>{m.avoid}</dd>
              </>
            )}
            <dt>Page</dt>
            <dd>
              <a href={`${BASE}motion/${m.id}/`}>Standalone page · share or bookmark</a>
            </dd>
            <dt>Source</dt>
            <dd>
              <a href={`${BLOB}/${m.file}`} target="_blank" rel="noreferrer">
                {m.file}
              </a>
            </dd>
          </dl>
          <Badges m={m} />
        </div>

        <div className="editor">
          <div className="editor-bar">
            <span>Props · JSON</span>
            <div>
              {err && <span className="editor-err">{err}</span>}
              <button
                className="link-btn"
                onClick={() => {
                  setText(initialText);
                  setApplied(initial);
                  setErr(null);
                }}
              >
                Reset
              </button>
            </div>
          </div>
          <textarea value={text} onChange={(e) => onEdit(e.target.value)} spellCheck={false} aria-label="Props JSON" rows={Math.min(14, Math.max(6, text.split('\n').length + 1))} />
          <p className="editor-hint">Edits re-render live. Text, colour and image props are prefilled; every prop is listed below.</p>
        </div>
      </div>

      <h3 className="detail-h">Use it</h3>
      <CodeTabs snippets={snippets} />

      <h3 className="detail-h">Props</h3>
      <div className="table-wrap">
        <table className="props">
          <thead>
            <tr>
              <th>prop</th>
              <th>default</th>
              <th>what it does</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(m.props).map(([k, v]) => (
              <tr key={k}>
                <td>
                  <code>{k}</code>
                </td>
                <td>
                  <code className="dim">{fmtValue(v.default)}</code>
                </td>
                <td>{v.doc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
