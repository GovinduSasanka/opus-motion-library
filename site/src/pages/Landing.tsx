import React, {useRef, useState} from 'react';
import {MotionBackground} from 'opus-motion-library/web';
import {Code} from '../components/Code';
import {RecipeCard} from '../components/Cards';
import {Strip} from '../components/live';
import {asset, BASE, byId, CATEGORY_LABEL, REPO, totals} from '../data';
import {href} from '../router';
import {GitHubIcon} from '../components/Icons';

/** the hero: two motions layered live behind real HTML text, tinted to the site's gold */
const HERO_LAYERS = [
  {
    motion: 'aurora',
    props: {
      background: '#07080B',
      colors: ['#E9C27A', '#B07A3A', '#3B2A14'],
      topColor: '#F2EEE6',
      pixelSize: 0,
      intensity: 0.85,
      speed: 0.7,
      curtains: 3,
      height: 0.36,
      stars: 140,
    },
  },
  {motion: 'embers', props: {mode: 'motes', background: 'transparent', backdrop: false, count: 22, speed: 0.45, color: '#F3D9A4'}, blend: 'screen' as const, opacity: 0.75},
];

const WHY: [string, string][] = [
  ['Video', 'Render mp4 with Remotion, or compose multi-scene films with 97 transitions, 148 styles, captions and music.'],
  ['Web', 'MotionPlayer, MotionBackground and a no-build <opus-motion> element. Plays live, pauses off-screen.'],
  ['Apps', 'Export mp4, webm with alpha, ProRes 4444, GIF or PNG for iOS, Android, Flutter and editors.'],
  ['AI-agent ready', 'AGENTS.md, a measured catalog.json and `mgl suggest` let an agent choose and wire motions for you.'],
  ['16:9 · 1:1 · 9:16', 'Every motion is resolution-independent and lays itself out for landscape, square and portrait.'],
  ['Deterministic', 'Seeded randomness: the same props always render the same frames, in the browser and on the server.'],
];

const WALL = [
  'aurora', 'depth-descent', 'neon-sign', 'origami-fold', 'giant-eye-reveal', 'city-skyline', 'wireframe-build', 'comic-burst',
  'fish-school', 'blob-mascot', 'radial-blueprint', 'ken-burns', 'fireworks', 'stamp-slam', 'iso-blocks-3d', 'chat-bubbles',
  'sun-rise-set', 'hex-comb-build', 'dot-matrix', 'number-counter', 'crowd-bob', 'petal-bloom', 'live-chart', 'speed-lines',
];

const STEPS: {title: string; text: string; code: string; lang: 'bash' | 'tsx'}[] = [
  {
    title: 'Install',
    text: 'Clone the library and install once. Node 20+ and FFmpeg for rendering.',
    code: `git clone ${REPO}.git\ncd opus-motion-library\nnpm install`,
    lang: 'bash',
  },
  {
    title: 'Pick by name',
    text: 'Describe what you need — the suggester ranks recipes and motions and prints ready props.',
    code: `node cli/mgl.mjs suggest "dark hero for an AI tool"\nnode cli/mgl.mjs info stamp-slam    # props + defaults`,
    lang: 'bash',
  },
  {
    title: 'Render or embed',
    text: 'Your words, your colours. Render a video, or play it live in your site.',
    code: `node cli/mgl.mjs render stamp-slam \\\n  --props '{"lines":["HELLO","2026"],"keyword":"WORLD"}'\n\n# or, in React:  npm run build:lib\n<MotionPlayer motion="stamp-slam" props={{lines: ['HELLO']}} />`,
    lang: 'bash',
  },
];

const AGENT_PROMPT = `Use ${REPO.replace('https://', '')} — read its AGENTS.md, then give our landing page an animated hero in our brand colours (navy #0B1020, mint #5EF0B5) with a stats counter below it.`;

/** in-page link that also works when the hash is already set (scrolls every time) */
const jump = (id: string) => (e: React.MouseEvent) => {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  history.replaceState(null, '', `#/${id}`);
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'});
};

const Film: React.FC = () => {
  const v = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  return (
    <div className={`film ${started ? 'is-playing' : ''}`}>
      <video
        ref={v}
        src={asset('media/highlight.mp4')}
        poster={asset('media/poster.jpg')}
        preload="none"
        playsInline
        controls={started}
        onPlay={() => setStarted(true)}
        aria-label="Opus Motion Library highlight film, 74 seconds"
      />
      {!started && (
        <button
          className="film-play"
          onClick={() => {
            setStarted(true);
            v.current?.play();
          }}
          aria-label="Play the highlight film"
        >
          <span className="film-play-dot">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
              <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
            </svg>
          </span>
          <span className="film-play-label">
            Watch the film <small>1:14 · sound on</small>
          </span>
        </button>
      )}
    </div>
  );
};

export const Landing: React.FC = () => (
  <>
    <MotionBackground
      layers={HERO_LAYERS}
      background="#07080B"
      durationInFrames={360}
      loop="crossfade"
      assetBase={BASE}
      lazy={false}
      placeholder="#07080B"
      scrim="radial-gradient(120% 90% at 50% 100%, rgba(7,8,11,0.0) 0%, rgba(7,8,11,0.35) 55%, rgba(7,8,11,0.9) 100%), linear-gradient(180deg, rgba(7,8,11,0.55) 0%, rgba(7,8,11,0) 30%, rgba(7,8,11,0) 62%, #07080B 100%)"
      className="hero"
      contentClassName="hero-content wrap"
    >
      <p className="kicker">
        <span className="dot" /> Open source · MIT · Remotion + React
      </p>
      <h1 className="display">
        Motion graphics,
        <br />
        <em>by name.</em>
      </h1>
      <p className="lede">595 motion graphics you can drop into videos, websites and apps — by name, with your own words and colours.</p>
      <div className="cta-row">
        <a className="btn btn-gold" href={REPO} target="_blank" rel="noreferrer">
          <GitHubIcon size={16} /> Star on GitHub
        </a>
        <a className="btn btn-ghost" href="#/quickstart" onClick={jump('quickstart')}>
          Get started
        </a>
        <a className="btn btn-link" href="#/film" onClick={jump('film')}>
          Watch the film <span aria-hidden>→</span>
        </a>
      </div>
      <p className="hero-note">
        This background is live: <code>aurora</code> + <code>embers</code> layered in a <code>MotionBackground</code>, tinted gold. Not a video file.
      </p>
    </MotionBackground>

    <section className="stats wrap" aria-label="Library in numbers">
      {[
        [totals.motions, 'motions', 'in 12 families'],
        [totals.transitions, 'transitions', 'iris, ink, torn paper…'],
        [totals.recipes, 'recipes', 'ready-made mixes'],
        [3, 'formats', '16:9 · 1:1 · 9:16'],
      ].map(([n, l, s]) => (
        <div key={String(l)} className="stat">
          <span className="stat-n">{n}</span>
          <span className="stat-l">{l}</span>
          <span className="stat-s">{s}</span>
        </div>
      ))}
    </section>

    <section className="why wrap" aria-label="Why the library">
      {WHY.map(([t, d]) => (
        <div key={t} className="why-item">
          <h3>{t}</h3>
          <p>{d.split('`').map((s, i) => (i % 2 ? <code key={i}>{s}</code> : s))}</p>
        </div>
      ))}
    </section>

    <section id="film" className="section wrap">
      <div className="section-head">
        <p className="eyebrow">The film</p>
        <h2 className="h2">
          Eight minutes. Every motion. <em>Here are seventy-four seconds.</em>
        </h2>
        <p className="sub">
          A premium showreel built entirely from the library — captions timed word by word, cuts on the beat. Watch the{' '}
          <a href={`${REPO}/releases`} target="_blank" rel="noreferrer">
            full 8-minute film
          </a>
          .
        </p>
      </div>
      <Film />
    </section>

    <section className="section wrap">
      <div className="section-head split">
        <div>
          <p className="eyebrow">The library</p>
          <h2 className="h2">
            Titles, worlds, characters, data, <em>interfaces</em>, image looks and real 3D.
          </h2>
        </div>
        <a className="btn btn-ghost" href={href('gallery')}>
          Browse all {totals.motions} <span aria-hidden>→</span>
        </a>
      </div>
      <div className="wall">
        {WALL.filter((id) => byId.has(id)).map((id) => {
          const m = byId.get(id)!;
          return (
            <a key={id} className="wall-tile" href={href('gallery', id)} aria-label={m.title}>
              <Strip src={asset(`gallery/${id}.jpg`)} />
              <span className="wall-label">
                <span>{m.id}</span>
                <small>{CATEGORY_LABEL[m.category] ?? m.category}</small>
              </span>
            </a>
          );
        })}
      </div>
    </section>

    <section id="quickstart" className="section wrap">
      <div className="section-head">
        <p className="eyebrow">Quick start</p>
        <h2 className="h2">
          From clone to first render <em>in three commands.</em>
        </h2>
      </div>
      <div className="steps">
        {STEPS.map((s, i) => (
          <div key={s.title} className="step">
            <div className="step-head">
              <span className="step-n">0{i + 1}</span>
              <h3>{s.title}</h3>
            </div>
            <p>{s.text}</p>
            <Code code={s.code} lang={s.lang} title={s.lang === 'bash' ? 'terminal' : 'tsx'} />
          </div>
        ))}
      </div>
      <div className="also">
        <span>Also:</span>
        <code>&lt;opus-motion recipe="hero-aurora-night" background&gt;</code>
        <code>mgl export confetti-burst --as webm-alpha</code>
        <code>mgl add product-launch --to ../my-app/src</code>
      </div>
    </section>

    <section className="section wrap agent">
      <div className="agent-copy">
        <p className="eyebrow">Use it from your AI agent</p>
        <h2 className="h2">
          Paste the repo. <em>Your agent does the rest.</em>
        </h2>
        <p className="sub">
          The library ships with <a href={`${REPO}/blob/main/AGENTS.md`}>AGENTS.md</a> — written for the AI agent doing the work. Claude, Codex or Cursor read it, run the
          suggester, pick a recipe, replace every sample word with yours and screenshot-check the result.
        </p>
        <ol className="agent-steps">
          <li>
            <b>Reads</b> AGENTS.md, CHOOSING.md and the measured <code>catalog.json</code>
          </li>
          <li>
            <b>Chooses</b> with <code>mgl suggest</code> — recipes first, then layers backdrop + subject + accent
          </li>
          <li>
            <b>Wires</b> it in your stack: React, Next.js, plain HTML, Remotion or exported files
          </li>
          <li>
            <b>Verifies</b> with stills and screenshots, respecting reduced motion and ≤ 2 live players
          </li>
        </ol>
      </div>
      <div className="agent-chat" aria-label="Example prompt">
        <div className="chat-bar">
          <span />
          <span />
          <span />
          <b>your agent</b>
        </div>
        <div className="chat-msg user">
          <small>You</small>
          <p>{AGENT_PROMPT}</p>
        </div>
        <div className="chat-msg bot">
          <small>Agent</small>
          <pre>
            {`$ node cli/mgl.mjs suggest "dark hero, stats"
  ★ hero-aurora-night   recipe · calm, premium
  ★ stats-reveal        recipe · counter + chart
    number-counter      data · loop once

→ MotionBackground recipe="hero-aurora-night"
  overrides aurora.colors → brand navy / mint
→ MotionPlayer number-counter, playOnView
✓ screenshots 1440 / 390 · reduced motion ok`}
          </pre>
        </div>
      </div>
    </section>

    <section className="section wrap">
      <div className="section-head split">
        <div>
          <p className="eyebrow">Recipes</p>
          <h2 className="h2">
            Ready-made mixes, <em>balanced and previewed.</em>
          </h2>
          <p className="sub">Hover to play live. Each one is a layer stack or a multi-scene spec you can override.</p>
        </div>
        <a className="btn btn-ghost" href={href('recipes')}>
          All {totals.recipes} recipes <span aria-hidden>→</span>
        </a>
      </div>
      <div className="grid grid-4">
        {['product-launch', 'stats-reveal', 'music-neon-promo', 'success-celebration'].map((id) => (
          <RecipeCard key={id} id={id} />
        ))}
      </div>
    </section>

    <section className="closing wrap">
      <h2 className="display small">
        Make something <em>move.</em>
      </h2>
      <p className="lede">Free and open source. If it saves you an afternoon, a star helps others find it.</p>
      <div className="cta-row center">
        <a className="btn btn-gold" href={REPO} target="_blank" rel="noreferrer">
          <GitHubIcon size={16} /> Star on GitHub
        </a>
        <a className="btn btn-ghost" href={href('gallery')}>
          Open the gallery
        </a>
      </div>
    </section>
  </>
);
