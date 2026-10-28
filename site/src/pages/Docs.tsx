import React from 'react';
import {totals} from '../data';
import {docsList} from '../seo-content';


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
      {docsList(totals).map((d) => (
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
