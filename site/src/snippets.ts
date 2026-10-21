import type {Recipe} from 'opus-motion-library/web';
import type {Snippet} from './components/Code';

type Fmt = 'landscape' | 'square' | 'portrait';
const SIZE: Record<Fmt, [number, number]> = {landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1920]};

const compact = (v: unknown) => JSON.stringify(v);
const pretty = (v: unknown, indent = 2) => JSON.stringify(v, null, indent);
const shellQuote = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;
const attrQuote = (s: string) => `'${s.replace(/&/g, '&amp;').replace(/'/g, '&#39;')}'`;

/** JSON → a JS object literal (unquoted simple keys) for JSX snippets */
const jsLiteral = (v: unknown, indent = 0): string => {
  const pad = '  '.repeat(indent);
  if (Array.isArray(v)) {
    const flat = JSON.stringify(v);
    if (flat.length < 70) return flat.replace(/"([^"]*)"/g, (_, s) => `'${s.replace(/'/g, "\\'")}'`).replace(/,/g, ', ');
    return `[\n${v.map((x) => `${pad}  ${jsLiteral(x, indent + 1)}`).join(',\n')},\n${pad}]`;
  }
  if (v && typeof v === 'object') {
    const ents = Object.entries(v as Record<string, unknown>);
    if (!ents.length) return '{}';
    const key = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`);
    const one = `{${ents.map(([k, x]) => `${key(k)}: ${jsLiteral(x, indent + 1)}`).join(', ')}}`;
    if (one.length < 70 && !one.includes('\n')) return one;
    return `{\n${ents.map(([k, x]) => `${pad}  ${key(k)}: ${jsLiteral(x, indent + 1)}`).join(',\n')},\n${pad}}`;
  }
  if (typeof v === 'string') return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  return JSON.stringify(v);
};

export const motionSnippets = (id: string, props: Record<string, unknown>, format: Fmt, overlay = false): Snippet[] => {
  const has = Object.keys(props).length > 0;
  const fmtFlag = format !== 'landscape' ? ` --format ${format}` : '';
  const fmtAttr = format !== 'landscape' ? ` format="${format}"` : '';
  const [w, h] = SIZE[format];
  return [
    {
      id: 'cli',
      label: 'CLI',
      lang: 'bash',
      code: `# render an mp4 (run in the library folder)\nnode cli/mgl.mjs render ${id}${has ? ` --props ${shellQuote(compact(props))}` : ''}${fmtFlag}\n\n# or export for apps / editors: mp4 | webm-alpha | prores-alpha | gif | png | poster\nnode cli/mgl.mjs export ${id} --as ${overlay ? 'webm-alpha' : 'mp4'}${has ? ` --props ${shellQuote(compact(props))}` : ''}${fmtFlag}`,
    },
    {
      id: 'react',
      label: 'React',
      lang: 'tsx',
      code: `import {MotionPlayer} from 'opus-motion-library/web';\n\n<MotionPlayer\n  motion="${id}"${fmtAttr}${has ? `\n  props={${jsLiteral(props, 1)}}` : ''}\n  playOnView\n  loop="auto"\n/>`,
    },
    {
      id: 'html',
      label: 'HTML',
      lang: 'html',
      code: `<script src="opus-motion.element.js" defer></script>\n\n<opus-motion motion="${id}"${fmtAttr}${has ? `\n  props=${attrQuote(compact(props))}` : ''}>\n</opus-motion>`,
    },
    {
      id: 'spec',
      label: 'Remotion spec',
      lang: 'json',
      code: `${pretty({width: w, height: h, fps: 30, scenes: [{motion: id, ...(has ? {props} : {})}]})}`,
    },
  ];
};

export const recipeSnippets = (r: Recipe): Snippet[] => {
  const {id} = r;
  const firstType = r.layers?.find((l) => l.role === 'type');
  const ov = firstType ? {[firstType.motion]: Object.fromEntries(Object.entries(firstType.props ?? {}).filter(([k]) => ['title', 'text', 'lines', 'label', 'logo', 'quote'].includes(k)))} : null;
  const hasOv = ov && Object.keys(Object.values(ov)[0]).length > 0;
  return [
    {
      id: 'cli',
      label: 'CLI',
      lang: 'bash',
      code: `# render the recipe to out/${id}.mp4 (run in the library folder)\nnode cli/mgl.mjs recipe ${id}${hasOv ? ` --overrides ${shellQuote(compact(ov))}` : ''}\n\n# copy just this recipe's source into a Remotion / React project\nnode cli/mgl.mjs add ${id} --to ../my-app/src`,
    },
    {
      id: 'react',
      label: 'React',
      lang: 'tsx',
      code: r.web?.textInHtml
        ? `import {MotionBackground} from 'opus-motion-library/web';\n\n// type layers are dropped: your HTML carries the words\n<MotionBackground recipe="${id}" scrim="linear-gradient(#0000 40%, #000a)"\n  style={{minHeight: '80vh'}}>\n  <h1>Your headline</h1>\n</MotionBackground>`
        : `import {MotionMix} from 'opus-motion-library/web';\n\n<MotionMix recipe="${id}"${hasOv ? `\n  overrides={${jsLiteral(ov, 1)}}` : ''}\n  playOnView\n/>`,
    },
    {
      id: 'html',
      label: 'HTML',
      lang: 'html',
      code: `<script src="opus-motion.element.js" defer></script>\n\n<opus-motion recipe="${id}"${r.web?.textInHtml ? ' background' : ''}${hasOv ? `\n  overrides=${attrQuote(compact(ov))}` : ''}>\n</opus-motion>`,
    },
    {
      id: 'json',
      label: `recipes/${id}.json`,
      lang: 'json',
      code: pretty(r),
    },
  ];
};

export const transitionSnippets = (type: string, variant?: string): Snippet[] => {
  const t = variant ? {type, variant} : {type};
  return [
    {
      id: 'spec',
      label: 'Compose spec',
      lang: 'json',
      code: pretty({
        width: 1920,
        height: 1080,
        fps: 30,
        scenes: [
          {motion: 'blur-in-title', props: {title: 'BEFORE', swapTo: null}, transition: t},
          {motion: 'aurora'},
        ],
      }),
    },
    {
      id: 'cli',
      label: 'CLI',
      lang: 'bash',
      code: `node cli/mgl.mjs compose specs/my-video.json --out out/my-video.mp4\n\n# preview every transition in one reel\nnode cli/mgl.mjs render transition-reel --props ${shellQuote(compact({types: [variant ? `${type}:${variant}` : type]}))}`,
    },
  ];
};
