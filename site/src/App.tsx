import React, {Suspense, lazy, useEffect, useState} from 'react';
import {href, useRoute} from './router';
import {REPO, totals} from './data';
import {Landing} from './pages/Landing';
import {GitHubIcon, Mark} from './components/Icons';

const Gallery = lazy(() => import('./pages/Gallery').then((m) => ({default: m.Gallery})));
const Recipes = lazy(() => import('./pages/Recipes').then((m) => ({default: m.Recipes})));
const Transitions = lazy(() => import('./pages/Transitions').then((m) => ({default: m.Transitions})));
const Docs = lazy(() => import('./pages/Docs').then((m) => ({default: m.Docs})));

const NAV: [string, string][] = [
  ['gallery', 'Gallery'],
  ['recipes', 'Recipes'],
  ['transitions', 'Transitions'],
  ['docs', 'Docs'],
];

const Nav: React.FC<{page: string}> = ({page}) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, {passive: true});
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => setOpen(false), [page]);
  return (
    <header className={`nav ${scrolled || page !== 'home' ? 'is-solid' : ''} ${open ? 'is-open' : ''}`}>
      <div className="nav-inner">
        <a className="brand" href={href('home')} aria-label="Opus Motion Library home">
          <Mark />
          <span>
            Opus <em>Motion</em>
          </span>
        </a>
        <nav className="nav-links" aria-label="Main">
          {NAV.map(([id, label]) => (
            <a key={id} href={href(id)} className={page === id ? 'is-on' : ''}>
              {label}
            </a>
          ))}
        </nav>
        <a className="nav-gh" href={REPO} target="_blank" rel="noreferrer">
          <GitHubIcon size={16} />
          <span>GitHub</span>
        </a>
        <button className="nav-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <span />
          <span />
        </button>
      </div>
    </header>
  );
};

const Footer: React.FC = () => (
  <footer className="footer">
    <div className="wrap footer-inner">
      <div className="footer-brand">
        <a className="brand" href={href('home')}>
          <Mark />
          <span>
            Opus <em>Motion</em>
          </span>
        </a>
        <p>
          {totals.motions} motions · {totals.transitions} transitions · {totals.recipes} recipes. Built on{' '}
          <a href="https://www.remotion.dev" target="_blank" rel="noreferrer">
            Remotion
          </a>
          , React, SVG and three.js.
        </p>
      </div>
      <div className="footer-cols">
        <div>
          <h4>Explore</h4>
          <a href={href('gallery')}>Gallery</a>
          <a href={href('recipes')}>Recipes</a>
          <a href={href('transitions')}>Transitions</a>
          <a href={href('docs')}>Docs</a>
        </div>
        <div>
          <h4>Project</h4>
          <a href={REPO} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={`${REPO}/blob/main/AGENTS.md`} target="_blank" rel="noreferrer">
            AGENTS.md
          </a>
          <a href={`${REPO}/releases`} target="_blank" rel="noreferrer">
            Releases
          </a>
          <a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
            MIT licence
          </a>
        </div>
      </div>
    </div>
    <div className="wrap footer-legal">
      <span>Code released under the MIT licence. Remotion is source-available — see remotion.dev/license for company use.</span>
      <span>An independent open-source project. Not affiliated with or endorsed by Anthropic.</span>
    </div>
  </footer>
);

export const App: React.FC = () => {
  const route = useRoute();
  useEffect(() => {
    if (route.page === 'home' && route.anchor) {
      document.getElementById(route.anchor)?.scrollIntoView({behavior: 'smooth', block: 'start'});
    } else if (!route.id) window.scrollTo({top: 0});
  }, [route.page, route.anchor]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t: Record<string, string> = {home: 'Opus Motion Library — 453 motion graphics, by name', gallery: 'Gallery', recipes: 'Recipes', transitions: 'Transitions', docs: 'Docs'};
    document.title = route.page === 'home' ? t.home : `${t[route.page]}${route.id ? ` · ${route.id}` : ''} — Opus Motion Library`;
  }, [route.page, route.id]);
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Nav page={route.page} />
      <main id="main">
        <Suspense fallback={<div className="page-loading" />}>
          {route.page === 'home' && <Landing />}
          {route.page === 'gallery' && <Gallery id={route.id} />}
          {route.page === 'recipes' && <Recipes id={route.id} />}
          {route.page === 'transitions' && <Transitions id={route.id} />}
          {route.page === 'docs' && <Docs />}
        </Suspense>
      </main>
      <Footer />
    </>
  );
};
