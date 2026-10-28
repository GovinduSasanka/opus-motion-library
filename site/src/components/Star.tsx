import React, {useEffect, useState} from 'react';
import {REPO_API, REPO_URL} from '../seo-content';
import {GitHubIcon} from './Icons';

const KEY = 'mgl:stars';
const TTL = 60 * 60 * 1000; // the unauthenticated GitHub API allows 60 requests / hour / IP: cache for an hour

const read = (): {n: number; t: number} | null => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return v && typeof v.n === 'number' ? v : null;
  } catch {
    return null;
  }
};

let inflight: Promise<number | null> | null = null;

/** live star count from the public GitHub API; null while loading or if it fails (offline, rate-limited, blocked) */
export const useStars = (): number | null => {
  const [n, setN] = useState<number | null>(() => read()?.n ?? null);
  useEffect(() => {
    const cached = read();
    if (cached && Date.now() - cached.t < TTL) return;
    let alive = true;
    inflight ??= fetch(REPO_API, {headers: {Accept: 'application/vnd.github+json'}})
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const c = j && typeof j.stargazers_count === 'number' ? (j.stargazers_count as number) : null;
        if (c !== null) {
          try {
            localStorage.setItem(KEY, JSON.stringify({n: c, t: Date.now()}));
          } catch {
            /* storage blocked: fine */
          }
        }
        return c;
      })
      .catch(() => null);
    inflight.then((c) => alive && c !== null && setN(c));
    return () => {
      alive = false;
    };
  }, []);
  return n;
};

export const fmtStars = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n));

/** "Star on GitHub" call to action with the live count (the button works without it) */
export const StarButton: React.FC<{className?: string; label?: string}> = ({className = 'btn btn-gold', label = 'Star on GitHub'}) => {
  const n = useStars();
  return (
    <a className={className} href={REPO_URL} target="_blank" rel="noreferrer" aria-label={n !== null ? `${label} — ${n} stars` : label}>
      <GitHubIcon size={16} /> {label}
      {n !== null && (
        <span className="star-count" aria-hidden>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 .25l2.3 4.9 5.35.65-3.95 3.7 1.05 5.3L8 12.2 3.25 14.8l1.05-5.3L.35 5.8l5.35-.65z" />
          </svg>
          {fmtStars(n)}
        </span>
      )}
    </a>
  );
};

/** small variant for the nav bar */
export const NavStar: React.FC = () => {
  const n = useStars();
  return (
    <a className="nav-gh" href={REPO_URL} target="_blank" rel="noreferrer" aria-label={n !== null ? `GitHub — ${n} stars` : 'GitHub'}>
      <GitHubIcon size={16} />
      <span>GitHub</span>
      {n !== null && <span className="nav-stars">★ {fmtStars(n)}</span>}
    </a>
  );
};
