import {useEffect, useState} from 'react';

/** hash routes (#/gallery/aurora) so GitHub Pages needs no rewrites */
export interface Route {
  page: 'home' | 'gallery' | 'recipes' | 'transitions' | 'docs';
  id?: string;
  /** in-page anchor for the landing page, e.g. #/quickstart */
  anchor?: string;
}

const PAGES = new Set(['gallery', 'recipes', 'transitions', 'docs']);

export const parseHash = (hash: string): Route => {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (!parts.length) return {page: 'home'};
  if (PAGES.has(parts[0])) return {page: parts[0] as Route['page'], id: parts[1]};
  return {page: 'home', anchor: parts[0]};
};

export const href = (page: Route['page'] | string, id?: string) => (page === 'home' ? '#/' : `#/${page}${id ? `/${encodeURIComponent(id)}` : ''}`);

export const go = (page: Route['page'], id?: string, replace = false) => {
  const h = href(page, id);
  if (replace) history.replaceState(null, '', h);
  else history.pushState(null, '', h);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
};

export const useRoute = () => {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', on);
    window.addEventListener('popstate', on);
    return () => {
      window.removeEventListener('hashchange', on);
      window.removeEventListener('popstate', on);
    };
  }, []);
  return route;
};
