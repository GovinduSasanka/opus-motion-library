import React from 'react';
import type {CatalogEntry} from 'opus-motion-library/web';
import {asset, CATEGORY_LABEL, recipeById} from '../data';
import {href} from '../router';
import {LiveMotion, LiveRecipe, Strip, useHoverIntent} from './live';

export const Badges: React.FC<{m: CatalogEntry}> = ({m}) => (
  <span className="badges">
    {m.overlay && <span className="badge" title="Renders on a transparent background">overlay</span>}
    {m.loopable && <span className="badge" title="Loops seamlessly">loop</span>}
    {m.takesImage && <span className="badge" title="Takes your image">image</span>}
    {m.weight === 'heavy' && <span className="badge warn" title="three.js / WebGL — heavier in the browser">3D</span>}
  </span>
);

export const MotionCard: React.FC<{m: CatalogEntry; onOpen: (id: string) => void}> = ({m, onOpen}) => {
  const {active, handlers} = useHoverIntent(`m:${m.id}`);
  return (
    <a
      className={`card ${active ? 'is-live' : ''}`}
      href={href('gallery', m.id)}
      onClick={(e) => {
        e.preventDefault();
        onOpen(m.id);
      }}
      {...handlers}
    >
      <div className="card-media">
        <Strip src={asset(`gallery/${m.id}.jpg`)} />
        {active && <LiveMotion id={m.id} />}
        <span className="card-cat">{CATEGORY_LABEL[m.category] ?? m.category}</span>
      </div>
      <div className="card-body">
        <div className="card-title">
          <h3>{m.title}</h3>
          <Badges m={m} />
        </div>
        <code className="card-id">{m.id}</code>
      </div>
    </a>
  );
};

export const RecipeCard: React.FC<{id: string; onOpen?: (id: string) => void}> = ({id, onOpen}) => {
  const r = recipeById.get(id);
  const {active, handlers} = useHoverIntent(`r:${id}`);
  if (!r) return null;
  const portrait = r.format === 'portrait';
  const kind = r.scenes ? `${r.scenes.length} scenes` : `${r.layers?.length ?? 0} layers`;
  return (
    <a
      className={`card recipe ${active ? 'is-live' : ''}`}
      href={href('recipes', id)}
      onClick={(e) => {
        if (!onOpen) return;
        e.preventDefault();
        onOpen(id);
      }}
      {...handlers}
    >
      <div className={`card-media ${portrait ? 'is-portrait' : ''}`}>
        <Strip src={asset(`recipes/${id}.jpg`)} contain={portrait} />
        {active && <LiveRecipe id={id} portrait={portrait} />}
        <span className="card-cat">
          {r.format} · {kind}
        </span>
      </div>
      <div className="card-body">
        <div className="card-title">
          <h3>{r.title}</h3>
        </div>
        <p className="card-text">{r.useFor}</p>
        <code className="card-id">{id}</code>
      </div>
    </a>
  );
};
