// Главная страница: HTML с меню внутри. Кэшируется на CDN Vercel и обновляется в фоне
// (stale-while-revalidate), поэтому гости всегда получают страницу мгновенно.
import { getMenu } from '../lib/store.js';
import { publicView, buildSeed, normalizeDoc } from '../lib/menu.js';
import { renderPage } from '../lib/page.js';

export async function GET(request) {
  const url = new URL(request.url);
  const fresh = url.searchParams.has('fresh');
  let doc, ok = true;
  try { doc = await getMenu({ fresh }); } catch (e) {
    console.error('menu load failed', e);
    doc = normalizeDoc(buildSeed()); ok = false;
  }
  const html = renderPage(publicView(doc), { origin: url.origin });
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': fresh || !ok
        ? 'no-store'
        : 'public, max-age=0, s-maxage=10, stale-while-revalidate=31536000',
      'x-menu-rev': String(doc.rev),
    },
  });
}
