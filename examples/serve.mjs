#!/usr/bin/env node
// Tiny static server for the examples (no dependencies): serves the library root.
//   node examples/serve.mjs [port=5055] [dir=<repo root>]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const port = Number(process.argv[2] ?? 5055);
const dir = path.resolve(process.argv[3] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webm': 'video/webm'};

http
  .createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(dir, p);
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, {'content-type': TYPES[path.extname(f).toLowerCase()] ?? 'application/octet-stream'});
    fs.createReadStream(f).pipe(res);
  })
  .listen(port, () => console.log(`serving ${dir} at http://localhost:${port}/`));
