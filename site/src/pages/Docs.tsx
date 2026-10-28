import React from 'react';
import {BLOB, REPO} from '../data';

const DOCS: {title: string; text: string; url: string; tag: string}[] = [
  {tag: 'Start', title: 'README', text: 'What the library is, quick start, compose specs, narrated storyboards, layout.', url: `${REPO}#readme`},
  {tag: 'Start', title: 'Quick start', text: 'Install, list, info, render, still, studio — the first ten minutes.', url: `${REPO}#quickstart`},
  {tag: 'Agents', title: 'AGENTS.md', text: 'For the AI agent doing the work: choose, make it the host’s own, performance rules, anti-patterns.', url: `${BLOB}/AGENTS.md`},
  {tag: 'Agents', title: 'Use it from your AI agent', text: 'What to paste into Claude, Codex or Cursor, and what the agent does with it.', url: `${REPO}#use-it-from-your-ai-agent`},
  {tag: 'Choose', title: 'Choosing motions', text: 'Goal → motions, recipes and pairings: hero, numbers, story, celebrate, ambient, product UI…', url: `${BLOB}/docs/CHOOSING.md`},
  {tag: 'Integrate', title: 'Integration guide', text: 'Remotion, Next.js, Vite/React, plain HTML & WordPress, native apps and video editors, step by step.', url: `${BLOB}/docs/INTEGRATION.md`},
  {tag: 'Reference', title: 'Catalog', text: 'Every motion with its props, defaults, roles, overlay, loop, mood and weight.', url: `${BLOB}/docs/CATALOG.md`},
  {tag: 'Reference', title: 'Transitions', text: 'All 97 transitions (types and variants) with fields and recommended lengths.', url: `${BLOB}/docs/TRANSITIONS.md`},
  {tag: 'Video', title: 'Mix motions', text: 'Layer several motions into one shot, or chain scenes with transitions, overlays, captions and music.', url: `${REPO}#mix-motions`},
  {tag: 'Video', title: 'Narrated storyboards', text: 'Storyboard → local TTS voice, word-timed captions, beat-snapped cuts, mastered mix.', url: `${REPO}#make-a-narrated-video`},
  {tag: 'Web', title: 'Use it on the web', text: 'MotionPlayer, MotionBackground and the <opus-motion> element in React, Next.js and plain HTML.', url: `${REPO}#in-a-react--nextjs-site`},
  {tag: 'Reference', title: 'Motion catalogue', text: 'The live catalogue table in the README: every motion by family, with what it is for.', url: `${REPO}#motion-catalogue`},
  {tag: 'Contribute', title: 'Contributing', text: 'How to propose a motion, report a bug and open a pull request.', url: `${BLOB}/CONTRIBUTING.md`},
  {tag: 'Contribute', title: 'Authoring a motion', text: 'The conventions every motion follows: u-units, measured easing, seeded noise, three formats.', url: `${BLOB}/docs/AUTHORING.md`},
  {tag: 'Background', title: 'How it works', text: 'Reference films, MIT motion repos and a 1,138-case prompt corpus → 429 generalised motions and 148 styles.', url: `${REPO}#how-it-works`},
];

export const Docs: React.FC = () => (
  <div className="page wrap">
    <header className="page-head">
      <p className="eyebrow">Docs</p>
      <h1 className="h1">
        Everything is in the repo, <em>in plain Markdown.</em>
      </h1>
      <p className="sub">These open on GitHub. Your AI agent reads the same files.</p>
    </header>
    <div className="grid grid-3">
      {DOCS.map((d) => (
        <a key={d.title} className="doc-card" href={d.url} target="_blank" rel="noreferrer">
          <span className="doc-tag">{d.tag}</span>
          <h3>{d.title}</h3>
          <p>{d.text}</p>
          <span className="doc-go" aria-hidden>
            ↗
          </span>
        </a>
      ))}
    </div>
  </div>
);
