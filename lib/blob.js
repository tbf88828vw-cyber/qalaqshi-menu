// Vercel Blob через REST API (протокол официального SDK @vercel/blob, API v12) — без npm-зависимостей.
// Браузер админки загружает файлы НАПРЯМУЮ в Blob по одноразовому токену (без лимита 4.5 МБ функций).
import crypto from 'node:crypto';

const API = process.env.VERCEL_BLOB_API_URL || 'https://vercel.com/api/blob';
const API_VERSION = '12';
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN || '';
export const hasBlob = !!TOKEN;

export const storeId = () => TOKEN.split('_')[3] || '';

const ALLOWED_TYPES = ['video/mp4', 'image/webp', 'image/jpeg', 'image/png'];
const MAX_SIZE = 60 * 1024 * 1024;

/** Одноразовый клиентский токен (аналог generateClientTokenFromReadWriteToken из @vercel/blob). */
export function clientToken(pathname, contentType) {
  if (!hasBlob) throw new Error('Хранилище файлов не подключено');
  if (!ALLOWED_TYPES.includes(contentType)) throw new Error('Недопустимый тип файла');
  const payload = Buffer.from(JSON.stringify({
    pathname,
    allowedContentTypes: [contentType],
    maximumSizeInBytes: MAX_SIZE,
    addRandomSuffix: true,
    cacheControlMaxAge: 31536000,
    validUntil: Date.now() + 10 * 60 * 1000,
  })).toString('base64');
  const sig = crypto.createHmac('sha256', TOKEN).update(payload).digest('hex');
  const id = storeId();
  return {
    token: `vercel_blob_client_${id}_${Buffer.from(`${sig}.${payload}`).toString('base64')}`,
    storeId: id,
    apiUrl: API,
    apiVersion: API_VERSION,
  };
}

async function api(pathAndQuery, init = {}) {
  const r = await fetch(API + pathAndQuery, {
    ...init,
    headers: {
      authorization: `Bearer ${TOKEN}`,
      'x-api-version': API_VERSION,
      'x-vercel-blob-store-id': storeId(),
      'x-api-blob-request-id': `${storeId()}:${Date.now()}:${Math.random().toString(16).slice(2)}`,
      'x-api-blob-request-attempt': '0',
      ...(init.headers || {}),
    },
  });
  if (!r.ok) throw new Error('Blob API ' + r.status + ': ' + (await r.text()).slice(0, 200));
  return r.json().catch(() => ({}));
}

export async function deleteBlobs(urls) {
  if (!hasBlob || !urls.length) return;
  for (let i = 0; i < urls.length; i += 100) {
    await api('/delete', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ urls: urls.slice(i, i + 100) }) });
  }
}

export async function listBlobs(prefix = 'media/') {
  const out = [];
  let cursor;
  do {
    const q = new URLSearchParams({ prefix, limit: '1000' });
    if (cursor) q.set('cursor', cursor);
    const j = await api('?' + q.toString(), { method: 'GET' });
    out.push(...(j.blobs || []));
    cursor = j.hasMore ? j.cursor : null;
  } while (cursor);
  return out;
}

export const isBlobUrl = (u) => {
  try { return new URL(u).hostname.endsWith('.blob.vercel-storage.com'); } catch { return false; }
};
