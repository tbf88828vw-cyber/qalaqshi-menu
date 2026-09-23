// API админ-панели. Один эндпоинт: /api/admin/<action> (см. rewrites в vercel.json).
import { getMenu, mutate, getHistory, getHistoryDocs, restoreHistory, hasRedis, isVercel } from '../lib/store.js';
import { STAFF_OPS, collectMediaUrls, publicView } from '../lib/menu.js';
import { checkPassword, makeCookie, clearCookie, getSession, authConfigured, loginAllowed, loginFailed, loginOk } from '../lib/auth.js';
import { hasBlob, clientToken, listBlobs, deleteBlobs, isBlobUrl } from '../lib/blob.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
});
const fail = (msg, status = 400) => json({ error: msg }, status);
const ip = (req) => (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'local';
const isSecure = (req) => new URL(req.url).protocol === 'https:';

function action(req) {
  const u = new URL(req.url);
  return u.searchParams.get('action') || u.pathname.split('/').filter(Boolean).pop();
}

async function body(req) {
  try { return await req.json(); } catch { return {}; }
}

// защита от CSRF: запросы из админки всегда JSON с нашим заголовком
function sameOrigin(req) {
  if (req.headers.get('x-qalaqshi') !== '1') return false;
  const o = req.headers.get('origin');
  if (!o) return true;
  try { return new URL(o).host === new URL(req.url).host; } catch { return false; }
}

const status = () => ({ redis: hasRedis, blob: hasBlob, vercel: isVercel, auth: authConfigured });

export async function GET(req) {
  const a = action(req);
  const s = getSession(req);
  if (a === 'me') return json({ role: s?.role || null, status: status() });
  if (!s) return fail('Нужно войти', 401);

  if (a === 'menu') {
    const doc = await getMenu({ fresh: true });
    return json({ doc, role: s.role, status: status() });
  }
  if (a === 'preview') {
    const doc = await getMenu({ fresh: true });
    return json(publicView(doc));
  }
  if (a === 'history') {
    if (s.role !== 'owner') return fail('Недостаточно прав', 403);
    return json({ history: await getHistory() });
  }
  if (a === 'export') {
    if (s.role !== 'owner') return fail('Недостаточно прав', 403);
    const doc = await getMenu({ fresh: true });
    return new Response(JSON.stringify(doc, null, 1), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': `attachment; filename="qalaqshi-menu-${new Date().toISOString().slice(0, 10)}.json"`,
        'cache-control': 'no-store',
      },
    });
  }
  if (a === 'proxy-image') {
    // для переноса старых фото из Poster в наше хранилище (у Poster нет CORS)
    const u = new URL(req.url).searchParams.get('url') || '';
    let target;
    try { target = new URL(u); } catch { return fail('Bad url'); }
    if (target.protocol !== 'https:' || target.hostname !== 'img.postershop.me') return fail('Недопустимый адрес', 403);
    const r = await fetch(target.href);
    if (!r.ok) return fail('Фото не найдено', 404);
    return new Response(r.body, { headers: { 'content-type': r.headers.get('content-type') || 'image/jpeg', 'cache-control': 'no-store' } });
  }
  return fail('Not found', 404);
}

export async function POST(req) {
  const a = action(req);
  if (!sameOrigin(req)) return fail('Forbidden', 403);

  if (a === 'login') {
    if (!authConfigured) return fail('Пароль администратора не задан. Добавьте переменную ADMIN_PASSWORD в Vercel → Settings → Environment Variables.', 500);
    const who = ip(req);
    if (!(await loginAllowed(who))) return fail('Слишком много попыток. Подождите 15 минут.', 429);
    const { password } = await body(req);
    const role = checkPassword(password);
    if (!role) {
      await loginFailed(who);
      await new Promise((r) => setTimeout(r, 600));
      return fail('Неверный пароль', 401);
    }
    await loginOk(who);
    return json({ role }, 200, { 'set-cookie': makeCookie(role, isSecure(req)) });
  }
  if (a === 'logout') return json({ ok: true }, 200, { 'set-cookie': clearCookie(isSecure(req)) });

  const s = getSession(req);
  if (!s) return fail('Нужно войти', 401);

  if (a === 'op') {
    const op = await body(req);
    if (!op || typeof op.type !== 'string') return fail('Неверный запрос');
    if (s.role !== 'owner' && !STAFF_OPS.has(op.type)) return fail('Недостаточно прав', 403);
    try {
      const { doc, note } = await mutate(op, s.role);
      return json({ doc, note, id: op._id || null });
    } catch (e) {
      return fail(e.message || 'Ошибка сохранения', 400);
    }
  }

  if (s.role !== 'owner') return fail('Недостаточно прав', 403);

  if (a === 'restore') {
    const { i } = await body(req);
    try { const { doc, note } = await restoreHistory(Number(i)); return json({ doc, note }); } catch (e) { return fail(e.message); }
  }

  if (a === 'upload-token') {
    const { pathname, contentType } = await body(req);
    if (typeof pathname !== 'string' || !/^media\/[a-z0-9/_.-]{3,160}$/i.test(pathname)) return fail('Неверное имя файла');
    if (hasBlob) {
      try { return json({ mode: 'blob', ...clientToken(pathname, contentType) }); } catch (e) { return fail(e.message); }
    }
    if (isVercel) return fail('Хранилище файлов не подключено. Подключите Vercel Blob в Vercel → Storage.', 500);
    return json({ mode: 'local' });
  }

  if (a === 'cleanup') {
    // удаляет из Blob файлы, на которые не ссылаются ни меню, ни история изменений
    if (!hasBlob) return json({ deleted: 0, kept: 0 });
    const used = collectMediaUrls(await getMenu({ fresh: true }));
    for (const d of await getHistoryDocs()) collectMediaUrls(d, used);
    const all = await listBlobs('media/');
    const dayAgo = Date.now() - 24 * 3600 * 1000;
    const junk = all.filter((b) => isBlobUrl(b.url) && !used.has(b.url) && Date.parse(b.uploadedAt) < dayAgo).map((b) => b.url);
    await deleteBlobs(junk);
    return json({ deleted: junk.length, kept: all.length - junk.length });
  }

  return fail('Not found', 404);
}

// Локальная разработка без Vercel Blob: файлы сохраняются в public/uploads
export async function PUT(req) {
  const a = action(req);
  if (a !== 'local-upload') return fail('Not found', 404);
  if (hasBlob || isVercel) return fail('Недоступно', 403);
  if (!sameOrigin(req)) return fail('Forbidden', 403);
  const s = getSession(req);
  if (!s || s.role !== 'owner') return fail('Нужно войти', 401);
  const pathname = new URL(req.url).searchParams.get('pathname') || '';
  if (!/^media\/[a-z0-9/_.-]{3,160}$/i.test(pathname) || pathname.includes('..')) return fail('Неверное имя файла');
  const ext = path.extname(pathname);
  const name = pathname.slice(0, -ext.length || undefined) + '-' + Math.random().toString(36).slice(2, 8) + ext;
  const file = path.join(process.cwd(), 'public', 'uploads', name);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, Buffer.from(await req.arrayBuffer()));
  return json({ url: '/uploads/' + name });
}
