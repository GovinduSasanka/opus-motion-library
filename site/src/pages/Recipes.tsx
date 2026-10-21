import React, {useCallback, useMemo} from 'react';
import {MotionMix, type Recipe} from 'opus-motion-library/web';
import {RecipeCard} from '../components/Cards';
import {Sized} from '../components/live';
import {CodeTabs} from '../components/Code';
import {CloseButton, Drawer} from '../components/Drawer';
import {BASE, BLOB, byId, recipeById, recipes} from '../data';
import {go, href} from '../router';
import {recipeSnippets} from '../snippets';

const ASPECT = {landscape: '16 / 9', square: '1 / 1', portrait: '9 / 16'} as const;

export const Recipes: React.FC<{id?: string}> = ({id}) => {
  const open = useCallback((rid: string) => go('recipes', rid), []);
  const close = useCallback(() => go('recipes'), []);
  const current = id ? recipeById.get(id) : undefined;
  const sorted = useMemo(() => {
    const order = ['hero-aurora-night', 'product-launch', 'stats-reveal', 'music-neon-promo', 'success-celebration', 'testimonial-chat', 'app-store-preview', 'social-short-captions'];
    return recipes.slice().sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.title.localeCompare(b.title);
    });
  }, []);
  return (
    <div className="page wrap">
      <header className="page-head">
        <p className="eyebrow">Recipes</p>
        <h1 className="h1">
          {recipes.length} ready-made mixes, <em>tested and previewed.</em>
        </h1>
        <p className="sub">
          A recipe is a layer stack (backdrop + subject + type + accent) or a multi-scene spec with transitions. Start from one, then override the words and colours.
        </p>
      </header>
      <div className="grid grid-3">
        {sorted.map((r) => (
          <RecipeCard key={r.id} id={r.id} onOpen={open} />
        ))}
      </div>
      <Drawer open={Boolean(current)} onClose={close} label={current ? current.title : ''} wide>
        {current && <RecipeDetail key={current.id} r={current} onClose={close} />}
      </Drawer>
    </div>
  );
};

const RecipeDetail: React.FC<{r: Recipe; onClose: () => void}> = ({r, onClose}) => {
  const snippets = useMemo(() => recipeSnippets(r), [r]);
  const layers = r.layers ?? [];
  const scenes = r.scenes ?? [];
  const motionsUsed = [...new Set([...layers.map((l) => l.motion), ...scenes.flatMap((s) => [...(s.motion ? [s.motion] : []), ...(s.layers ?? []).map((l) => l.motion)]), ...(r.overlays ?? []).map((o) => o.motion)])];
  return (
    <div className="detail">
      <div className="detail-top">
        <div className="detail-crumbs">
          <span className="card-cat static">recipe · {r.format}</span>
          <code>{r.id}</code>
        </div>
        <div className="detail-nav">
          <CloseButton onClick={onClose} />
        </div>
      </div>
      <h2 className="detail-title">{r.title}</h2>
      <div className={`stage is-${r.format}`}>
        <div className="stage-box" style={{aspectRatio: ASPECT[r.format]}}>
          <Sized format={r.format}>
            {(w, h) => <MotionMix recipe={r.id} width={w} height={h} assetBase={BASE} lazy={false} loop controls fit="cover" style={{position: 'absolute', inset: 0}} placeholder="#0d0f14" />}
          </Sized>
        </div>
      </div>
      <div className="detail-grid">
        <div className="detail-info">
          <p className="detail-desc">{r.useFor}</p>
          {r.notes && <p className="note">{r.notes}</p>}
          <dl className="facts">
            <dt>Built from</dt>
            <dd className="pairs">
              {motionsUsed.map((mid) =>
                byId.has(mid) ? (
                  <a key={mid} href={href('gallery', mid)}>
                    {mid}
                  </a>
                ) : (
                  <span key={mid}>{mid}</span>
                ),
              )}
            </dd>
            <dt>Type</dt>
            <dd>{scenes.length ? `${scenes.length} scenes with transitions (${scenes.map((s) => s.transition?.type ?? 'cut').join(' → ')})` : `${layers.length} layers in one shot`}</dd>
            {r.web?.loop && (
              <>
                <dt>On the web</dt>
                <dd>
                  loop: <code>{String(r.web.loop)}</code>
                  {r.web.textInHtml ? ' · headline goes in your HTML' : ''}
                </dd>
              </>
            )}
            <dt>File</dt>
            <dd>
              <a href={`${BLOB}/recipes/${r.id}.json`} target="_blank" rel="noreferrer">
                recipes/{r.id}.json
              </a>
            </dd>
          </dl>
        </div>
        {scenes.length > 0 && (
          <ol className="layers">
            {scenes.map((sc, i) => (
              <li key={i}>
                <span className="role role-subject">scene {i + 1}</span>
                <code>{sc.motion ?? (sc.layers ?? []).map((l) => l.motion).join(' + ')}</code>
                <span className="dim">
                  {sc.duration ? `${(sc.duration / 30).toFixed(1)}s` : ''}
                  {sc.transition && i < scenes.length - 1 ? ` → ${sc.transition.type}` : ''}
                </span>
              </li>
            ))}
          </ol>
        )}
        {layers.length > 0 && (
          <ol className="layers">
            {layers
              .slice()
              .reverse()
              .map((l, i) => (
                <li key={i}>
                  <span className={`role role-${l.role ?? 'layer'}`}>{l.role ?? 'layer'}</span>
                  <code>{l.motion}</code>
                  <span className="dim">
                    {l.blend ? `${l.blend} ` : ''}
                    {l.opacity != null ? `${Math.round(l.opacity * 100)}%` : ''}
                  </span>
                </li>
              ))}
          </ol>
        )}
      </div>
      <h3 className="detail-h">Use it</h3>
      <CodeTabs snippets={snippets} />
    </div>
  );
};
