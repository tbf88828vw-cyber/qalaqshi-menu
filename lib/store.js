// Хранилище меню: Upstash Redis (через REST, без npm-зависимостей) или локальный файл при разработке.
import { buildSeed, normalizeDoc, applyOp } from './menu.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const KEY = 'qalaqshi:menu';
const HISTORY = 'qalaqshi:history:meta';
const HISTORY_DOCS = 'qalaqshi:history:docs';
const LOCK = 'qalaqshi:lock';
const HISTORY_LEN = 40;

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
export const hasRedis = !!(REDIS_URL && REDIS_TOKEN);
export const isVercel = !!process.env.VERCEL;

const LOCAL_DIR = path.join(process.cwd(), '.data');
const LOCAL_FILE = path.join(LOCAL_DIR, 'menu.json');
const LOCAL_HISTORY = path.join(LOCAL_DIR, 'history.json');

async function redis(cmd) {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
    cache: 'no-store',
  });
  const j = await r.json().catch(() => ({ error: 'Bad Redis response ' + r.status }));
  if (j.error) throw new Error('Redis: ' + j.error);
  return j.result;
}

async function redisPipeline(cmds) {
  const r = await fetch(REDIS_URL.replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
    cache: 'no-store',
  });
  const j = await r.json();
  if (!Array.isArray(j)) throw new Error('Redis pipeline error');
  for (const x of j) if (x.error) throw new Error('Redis: ' + x.error);
  return j.map((x) => x.result);
}

export { redis };

// кэш в памяти функции — повторные запросы в той же «тёплой» функции не ходят в базу
let memo = null; // { doc, at }
const MEMO_MS = 3000;

export async function getMenu({ fresh = false } = {}) {
  if (!fresh && memo && Date.now() - memo.at < MEMO_MS) return memo.doc;
  let raw = null;
  if (hasRedis) raw = await redis(['GET', KEY]);
  else {
    try { raw = await fs.readFile(LOCAL_FILE, 'utf8'); } catch { raw = null; }
  }
  let doc;
  if (raw) {
    try { doc = normalizeDoc(JSON.parse(raw)); } catch { doc = null; }
  }
  if (!doc) doc = normalizeDoc(buildSeed());
  memo = { doc, at: Date.now() };
  return doc;
}

async function withLock(fn) {
  if (!hasRedis) return fn();
  const token = Math.random().toString(36).slice(2);
  for (let i = 0; i < 40; i++) {
    const ok = await redis(['SET', LOCK, token, 'NX', 'PX', '8000']);
    if (ok === 'OK') {
      try { return await fn(); } finally {
        const cur = await redis(['GET', LOCK]).catch(() => null);
        if (cur === token) await redis(['DEL', LOCK]).catch(() => {});
      }
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('Меню сейчас сохраняется с другого устройства — попробуйте ещё раз');
}

/** Атомарно применяет операцию к меню и сохраняет вместе с записью в истории. */
export async function mutate(op, who = 'admin') {
  return withLock(async () => {
    const cur = await getMenu({ fresh: true });
    const { doc, note } = applyOp(cur, op);
    const meta = { at: doc.updatedAt, rev: cur.rev, note, who };
    const json = JSON.stringify(doc);
    if (hasRedis) {
      await redisPipeline([
        ['SET', KEY, json],
        ['LPUSH', HISTORY, JSON.stringify(meta)],
        ['LPUSH', HISTORY_DOCS, JSON.stringify(cur)],
        ['LTRIM', HISTORY, '0', String(HISTORY_LEN - 1)],
        ['LTRIM', HISTORY_DOCS, '0', String(HISTORY_LEN - 1)],
      ]);
    } else {
      if (isVercel) throw new Error('База данных не подключена. Подключите Upstash Redis в Vercel → Storage.');
      await fs.mkdir(LOCAL_DIR, { recursive: true });
      await fs.writeFile(LOCAL_FILE, json);
      let hist = [];
      try { hist = JSON.parse(await fs.readFile(LOCAL_HISTORY, 'utf8')); } catch { /* пусто */ }
      hist.unshift({ ...meta, doc: cur });
      await fs.writeFile(LOCAL_HISTORY, JSON.stringify(hist.slice(0, HISTORY_LEN)));
    }
    memo = { doc, at: Date.now() };
    return { doc, note };
  });
}

async function localHistory() {
  try { return JSON.parse(await fs.readFile(LOCAL_HISTORY, 'utf8')); } catch { return []; }
}

export async function getHistory() {
  const list = hasRedis
    ? (await redis(['LRANGE', HISTORY, '0', String(HISTORY_LEN - 1)])).map((s) => JSON.parse(s))
    : await localHistory();
  return list.map(({ at, rev, note, who }, i) => ({ i, at, rev, note, who }));
}

/** Все сохранённые версии (для очистки файлов, на которые они ссылаются). */
export async function getHistoryDocs() {
  if (hasRedis) return (await redis(['LRANGE', HISTORY_DOCS, '0', '-1'])).map((s) => JSON.parse(s));
  return (await localHistory()).map((e) => e.doc);
}

/** Откат: вернуть меню к состоянию ДО изменения с индексом i. */
export async function restoreHistory(i) {
  let meta, doc;
  if (hasRedis) {
    const [m, d] = await redisPipeline([['LINDEX', HISTORY, String(i)], ['LINDEX', HISTORY_DOCS, String(i)]]);
    meta = m && JSON.parse(m); doc = d && JSON.parse(d);
  } else {
    const e = (await localHistory())[i]; meta = e; doc = e?.doc;
  }
  if (!meta || !doc) throw new Error('Запись истории не найдена');
  return mutate({ type: 'doc.import', doc, note: 'Откат: «' + meta.note + '»' }, 'restore');
}
