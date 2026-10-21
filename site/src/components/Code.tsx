import React, {useState} from 'react';

/** tiny highlighter: comments, strings, flags, tags — enough to make snippets readable without a dependency */
const highlight = (code: string, lang: string) => {
  const out: React.ReactNode[] = [];
  const re =
    lang === 'bash'
      ? /(#[^\n]*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\s--?[a-z][\w-]*)|(\b(?:node|npm|npx|git|cd)\b)/g
      : lang === 'json'
        ? /("(?:[^"\\]|\\.)*"(?=\s*:))|("(?:[^"\\]|\\.)*")|(\b-?\d+(?:\.\d+)?\b|\btrue\b|\bfalse\b|\bnull\b)/g
        : /(\/\/[^\n]*|<!--[\s\S]*?-->)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(<\/?[A-Za-z][\w-]*|\/?>)|(\b(?:import|from|export|const|return)\b)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const cls = lang === 'json' ? (m[1] ? 'tk-key' : m[2] ? 'tk-str' : 'tk-num') : m[1] ? 'tk-com' : m[2] ? 'tk-str' : m[3] ? 'tk-tag' : 'tk-kw';
    out.push(
      <span key={i++} className={cls}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
};

export const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
};

export const CopyButton: React.FC<{text: string; label?: string}> = ({text, label = 'Copy'}) => {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`copy ${done ? 'is-done' : ''}`}
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        }
      }}
      aria-label={`${label} to clipboard`}
    >
      {done ? 'Copied' : label}
    </button>
  );
};

export const Code: React.FC<{code: string; lang?: 'bash' | 'tsx' | 'html' | 'json'; title?: string; className?: string}> = ({code, lang = 'bash', title, className}) => (
  <div className={`code ${className ?? ''}`}>
    <div className="code-bar">
      <span className="code-title">{title ?? lang}</span>
      <CopyButton text={code} />
    </div>
    <pre>
      <code>{highlight(code, lang)}</code>
    </pre>
  </div>
);

export interface Snippet {
  id: string;
  label: string;
  lang: 'bash' | 'tsx' | 'html' | 'json';
  code: string;
}

export const CodeTabs: React.FC<{snippets: Snippet[]}> = ({snippets}) => {
  const [active, setActive] = useState(snippets[0]?.id);
  const cur = snippets.find((s) => s.id === active) ?? snippets[0];
  return (
    <div className="code tabs">
      <div className="code-bar">
        <div className="tab-row" role="tablist">
          {snippets.map((s) => (
            <button key={s.id} role="tab" aria-selected={s.id === cur.id} className={`tab ${s.id === cur.id ? 'is-on' : ''}`} onClick={() => setActive(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        <CopyButton text={cur.code} />
      </div>
      <pre>
        <code>{highlight(cur.code, cur.lang)}</code>
      </pre>
    </div>
  );
};
