// Локальный сервер, повторяющий поведение Vercel: статика из public/, /api/* — функции.
// Запуск: npm run dev  →  http://localhost:3000  (админка: /admin, пароль по умолчанию: qalaqshi)
import http from 'node:http';
import { promises as fs, createReadStream } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
process.chdir(ROOT);
const PUB = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 3000);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.json': 'application/json', '.txt': 'text/plain' };

async function callFn(name, req, res, url) {
  const mod = await import(path.join(ROOT, 'api', name + '.js') + '?t=' + Date.now());
  const fn = mod[req.method];
  if (!fn) { res.writeHead(405); return res.end(); }
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
  const init = { method: req.method, headers };
  if (!['GET', 'HEAD'].includes(req.method)) { init.body = req; init.duplex = 'half'; }
  const r = await fn(new Request(url, init));
  const out = {};
  r.headers.forEach((v, k) => { out[k] = v; });
  res.writeHead(r.status, out);
  if (r.body) for await (const chunk of r.body) res.write(chunk);
  res.end();
}

async function serveStatic(req, res, p) {
  let file = path.join(PUB, decodeURIComponent(p));
  if (!file.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  try {
    let st = await fs.stat(file);
    if (st.isDirectory()) { file = path.join(file, 'index.html'); st = await fs.stat(file); }
    const type = TYPES[path.extname(file)] || 'application/octet-stream';
    const range = req.headers.range;
    if (range && type === 'video/mp4') {
      const [s, e] = range.replace('bytes=', '').split('-');
      const start = Number(s), end = e ? Number(e) : st.size - 1;
      res.writeHead(206, { 'content-type': type, 'content-range': `bytes ${start}-${end}/${st.size}`, 'accept-ranges': 'bytes', 'content-length': end - start + 1 });
      return createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'content-type': type, 'content-length': st.size, 'accept-ranges': 'bytes', 'cache-control': 'no-cache' });
    createReadStream(file).pipe(res);
  } catch { res.writeHead(404); res.end('Not found'); }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;
  try {
    if (p === '/') return await callFn('page', req, res, url);
    const m = p.match(/^\/api\/admin\/([\w-]+)$/);
    if (m) { url.searchParams.set('action', m[1]); return await callFn('admin', req, res, url); }
    if (p.startsWith('/api/')) return await callFn(p.slice(5).replace(/\/$/, ''), req, res, url);
    return await serveStatic(req, res, p);
  } catch (e) {
    console.error(e); res.writeHead(500); res.end(String(e.stack || e));
  }
}).listen(PORT, () => console.log(`Qalaqshi: http://localhost:${PORT}  ·  админка: http://localhost:${PORT}/admin`));
