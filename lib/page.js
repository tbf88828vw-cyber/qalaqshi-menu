// HTML главной страницы. Данные меню встраиваются прямо в HTML — ноль дополнительных запросов.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pick = (o, l) => (o && (o[l] || o.en || o.ru || o.ka)) || '';
import { FONTS } from './menu.js';

export const ASSET_V = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || String(Date.now())).slice(0, 10);

function jsonLd(pub, origin) {
  const byCat = (id) => pub.items.filter((i) => i.cat === id && !i.stop);
  const sections = pub.categories.filter((c) => c.section === 'kitchen').map((c) => ({
    '@type': 'MenuSection',
    name: pick(c.name, 'en'),
    hasMenuItem: byCat(c.id).map((i) => ({
      '@type': 'MenuItem', name: pick(i.name, 'en'),
      offers: { '@type': 'Offer', price: String(i.price), priceCurrency: 'GEL' },
    })),
  }));
  return {
    '@context': 'https://schema.org', '@type': 'Restaurant', name: 'Qalaqshi',
    alternateName: 'ქალაქში', servesCuisine: 'Georgian', url: origin, telephone: pub.settings.phone,
    address: { '@type': 'PostalAddress', addressLocality: 'Tbilisi', addressCountry: 'GE' },
    image: origin + '/assets/logo-192.png', sameAs: pub.settings.instagram ? [pub.settings.instagram] : [],
    hasMenu: { '@type': 'Menu', name: 'Menu', hasMenuSection: sections },
  };
}

function fontsHref(ty) {
  const fams = new Set();
  const h = FONTS.heading[ty.heading] || FONTS.heading.cormorant;
  const b = FONTS.body[ty.body] || FONTS.body.inter;
  if (h.q) fams.add(h.q);
  if (b.q) fams.add(b.q);
  fams.add('Noto+Serif+Georgian:wght@300;400;500');
  fams.add('Noto+Sans+Georgian:wght@300;400;500');
  return 'https://fonts.googleapis.com/css2?' + [...fams].map((f) => 'family=' + f).join('&') + '&display=swap';
}

export function renderPage(pub, { origin = '' } = {}) {
  const st = pub.settings;
  const lang = st.defaultLang || 'en';
  const hero = st.heroVideo || {};
  const ty = st.typography || { heading: 'cormorant', body: 'inter', scale: 1, headingScale: 1, logoScale: 1 };
  const hf = FONTS.heading[ty.heading] || FONTS.heading.cormorant;
  const bf = FONTS.body[ty.body] || FONTS.body.inter;
  const data = JSON.stringify(pub).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '');
  const ld = JSON.stringify(jsonLd(pub, origin)).replace(/</g, '\\u003c');
  const v = ASSET_V;
  const heroTitle = pick(st.heroTitle, lang);
  const heroText = pick(st.heroText, lang);
  const logo = (cls) => `<span class="logo-mark ${cls}" role="img" aria-label="Qalaqshi"></span>`;
  return `<!doctype html>
<html lang="${lang}" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script>try{var t=localStorage.getItem('qa_theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;var l=localStorage.getItem('qa_lang');if(l)document.documentElement.lang=l}catch(e){}</script>
<title>Qalaqshi · ქალაქში — Georgian Restaurant in Tbilisi · Video Menu</title>
<meta name="description" content="Qalaqshi — authentic Georgian cuisine in Tbilisi. Video menu with prices: khachapuri, khinkali, mtsvadi, Georgian wine and chacha.">
<meta name="theme-color" content="#07060a" id="meta-theme">
<script>if(document.documentElement.dataset.theme==='light')document.getElementById('meta-theme').content='#f3ede4'</script>
<meta property="og:title" content="Qalaqshi — Georgian Restaurant">
<meta property="og:description" content="${esc(pick(st.tagline, 'en'))}">
<meta property="og:image" content="${esc(origin)}${esc(hero.poster || '/assets/logo-192.png')}">
<link rel="icon" href="/assets/logo-192.png">
<link rel="apple-touch-icon" href="/assets/logo-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${hero.poster ? `<link rel="preload" as="image" href="${esc(hero.poster)}" fetchpriority="high">` : ''}
<link rel="stylesheet" href="/assets/app.css?v=${v}">
<style>:root{--font-heading:${hf.css};--font-body:${bf.css};--fs:${Number(ty.scale) || 1};--fh:${Number(ty.headingScale) || 1};--fl:${Number(ty.logoScale) || 1}}</style>
<link rel="stylesheet" href="${esc(fontsHref(ty))}" media="print" onload="this.media='all'">
<script type="application/ld+json">${ld}</script>
</head>
<body>
<div class="logo-bg" aria-hidden="true"></div>

<header id="site-header">
  <a href="#top" class="header-home" aria-label="Qalaqshi">${logo('header-logo')}</a>
  <div class="header-right">
    <button class="bar-btn" id="bar-open" type="button"><span class="bar-btn-ico" aria-hidden="true"></span><span data-t="bar">Bar</span></button>
    <button class="theme-btn" id="theme-btn" type="button" aria-label="Theme"><span class="ico-sun" aria-hidden="true"></span><span class="ico-moon" aria-hidden="true"></span></button>
    <nav class="lang-switcher" aria-label="Language">
      <button class="lang-btn" data-lang="ka" type="button">GE</button>
      <button class="lang-btn" data-lang="en" type="button">EN</button>
      <button class="lang-btn" data-lang="ru" type="button">RU</button>
    </nav>
  </div>
</header>

<main id="top">
  <section class="hero" aria-label="Qalaqshi">
    ${hero.blur ? `<div class="hero-blur" style="background-image:url('${esc(hero.blur)}')"></div>` : ''}
    ${hero.src ? `<video class="hero-video-bg${hero.soft ? ' soft' : ''}" muted loop playsinline preload="none" poster="${esc(hero.poster || '')}" data-src="${esc(hero.src)}" aria-hidden="true"></video>` : ''}
    <div class="hero-vignette" aria-hidden="true"></div>
    <div class="hero-content">
      <span class="hero-eyebrow" data-t="eyebrow">${esc(pick(st.eyebrow, lang))}</span>
      ${logo('hero-logo-img')}
      <h1 class="hero-title" data-t="heroTitle"${heroTitle ? '' : ' hidden'}>${esc(heroTitle)}</h1>
      <div class="hero-rule" aria-hidden="true"></div>
      <p class="hero-tagline" data-t="tagline">${esc(pick(st.tagline, lang))}</p>
      <p class="hero-text" data-t="heroText"${heroText ? '' : ' hidden'}>${esc(heroText)}</p>
    </div>
    <a class="scroll-invite" href="#menu" aria-label="Menu">
      <span data-t="scroll">menu</span>
      <div class="scroll-line"></div>
    </a>
  </section>

  <nav class="cat-nav" id="cat-nav" aria-label="Menu sections"><div class="cat-nav-track" id="cat-nav-track"></div></nav>
  <div id="menu" class="menu"></div>

  <footer class="site-footer">
    ${logo('footer-logo')}
    <div class="footer-rule" aria-hidden="true"></div>
    <div class="footer-info" id="footer-info"></div>
    <p class="footer-copy">© ${new Date().getFullYear()} Qalaqshi · ქალაქში</p>
  </footer>
</main>

<div class="bar-sheet" id="bar-sheet" role="dialog" aria-modal="true" aria-labelledby="bar-title" hidden>
  <div class="bar-scroll" id="bar-scroll">
    <div class="bar-hero">
      <div class="bar-hero-text">
        <span class="bar-eyebrow" data-t="barEyebrow">Qalaqshi</span>
        <h2 id="bar-title" class="bar-title" data-t="barTitle">Bar</h2>
        <p class="bar-sub" data-t="barSub"></p>
      </div>
    </div>
    <nav class="bar-nav" id="bar-nav"></nav>
    <div class="bar-body" id="bar-body"></div>
    <div class="bar-foot">${logo('bar-foot-logo')}</div>
  </div>
  <button class="sheet-close bar-close" id="bar-close" type="button" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
</div>

<div class="dish-sheet" id="dish-sheet" role="dialog" aria-modal="true" hidden>
  <div class="dish-sheet-backdrop" data-close></div>
  <div class="dish-sheet-panel" id="dish-sheet-panel"></div>
</div>

<script id="menu-data" type="application/json">${data}</script>
<script src="/assets/app.js?v=${v}" defer></script>
</body>
</html>`;
}
