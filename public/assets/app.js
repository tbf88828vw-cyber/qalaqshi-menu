/* Qalaqshi — видео-меню.
   Без фреймворков: ~1 файл, данные уже внутри HTML, видео подгружаются умно:
   играет только активная карточка видимой карусели, соседние заранее подгружаются,
   далёкие выгружаются из памяти, качество подбирается под скорость интернета. */
(() => {
  'use strict';

  const DATA = JSON.parse(document.getElementById('menu-data').textContent);
  const S = DATA.settings;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* приватный режим */ } } };

  // ─────────────────────────── ТЕКСТЫ ИНТЕРФЕЙСА ───────────────────────────
  const UI = {
    en: { bar: 'Bar', scroll: 'menu', details: 'Details', ingredients: 'Ingredients', about: 'About the dish', unavailable: 'Not available today',
      also: 'Also in this section', items: (n) => `${n} ${n === 1 ? 'item' : 'items'}`, special: 'Special', close: 'Close',
      barTitle: 'Wine & Bar', barSub: 'Georgian wine, chacha, cocktails and drinks', barEyebrow: 'Qalaqshi · Bar',
      hours: 'Open daily', call: 'Call', book: 'Book a table', noDesc: 'Ask your waiter about this dish', play: 'Play',
      units: { ml: 'ml', l: 'L', g: 'g', kg: 'kg', pcs: 'pc', glass: 'glass' } },
    ru: { bar: 'Бар', scroll: 'меню', details: 'Подробнее', ingredients: 'Состав', about: 'О блюде', unavailable: 'Сегодня нет',
      also: 'Ещё в этом разделе', items: (n) => `${n} ${plural(n, 'позиция', 'позиции', 'позиций')}`, special: 'Спецпредложение', close: 'Закрыть',
      barTitle: 'Вино и бар', barSub: 'Грузинское вино, чача, коктейли и напитки', barEyebrow: 'Qalaqshi · Бар',
      hours: 'Ежедневно', call: 'Позвонить', book: 'Забронировать стол', noDesc: 'Подробности о блюде расскажет официант', play: 'Смотреть',
      units: { ml: 'мл', l: 'л', g: 'г', kg: 'кг', pcs: 'шт.', glass: 'бокал' } },
    ka: { bar: 'ბარი', scroll: 'მენიუ', details: 'დეტალურად', ingredients: 'შემადგენლობა', about: 'კერძის შესახებ', unavailable: 'დღეს არ გვაქვს',
      also: 'ასევე ამ განყოფილებაში', items: (n) => `${n} პოზიცია`, special: 'სპეციალური', close: 'დახურვა',
      barTitle: 'ღვინო და ბარი', barSub: 'ქართული ღვინო, ჭაჭა, კოქტეილები და სასმელები', barEyebrow: 'ქალაქში · ბარი',
      hours: 'ყოველდღე', call: 'დარეკვა', book: 'მაგიდის დაჯავშნა', noDesc: 'დეტალებს გეტყვით მიმტანი', play: 'ნახვა',
      units: { ml: 'მლ', l: 'ლ', g: 'გ', kg: 'კგ', pcs: 'ც', glass: 'ჭიქა' } },
  };
  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }

  // ─────────────────────────── ЯЗЫК ───────────────────────────
  function detectLang() {
    const saved = store.get('qa_lang');
    if (saved && UI[saved]) return saved;
    for (const l of navigator.languages || [navigator.language || '']) {
      const c = String(l).slice(0, 2).toLowerCase();
      if (c === 'ka') return 'ka';
      if (['ru', 'uk', 'be', 'kk', 'hy', 'az', 'uz'].includes(c)) return 'ru';
      if (c === 'en') return 'en';
    }
    return UI[S.defaultLang] ? S.defaultLang : 'en';
  }
  let lang = detectLang();
  const t = (k) => UI[lang][k] ?? UI.en[k];
  const pick = (o) => (o && (o[lang] || o.en || o.ru || o.ka)) || '';

  // реестр текстов, которые меняются при переключении языка (без перестройки DOM и перезагрузки видео)
  const textRegistry = [];
  const bindText = (el, fn, isHtml = false) => { textRegistry.push([el, fn, isHtml]); return el; };
  function applyTexts() {
    for (const [el, fn, mode] of textRegistry) { const v = fn(); if (mode === 'attr') continue; if (mode) el.innerHTML = v; else el.textContent = v; }
    $$('[data-t]').forEach((el) => {
      const k = el.dataset.t;
      if (k === 'eyebrow') el.textContent = pick(S.eyebrow);
      else if (k === 'tagline') el.textContent = pick(S.tagline);
      else if (UI[lang][k] !== undefined) el.textContent = t(k);
    });
    $$('.lang-btn').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
    document.documentElement.lang = lang;
  }

  // ─────────────────────────── ФОРМАТЫ ───────────────────────────
  const money = (n) => {
    const v = Number(n) || 0;
    return (Number.isInteger(v) ? String(v) : v.toFixed(2)) + ' ' + (S.currency || '₾');
  };
  function portion(p) {
    if (!p) return '';
    const m = String(p).trim().match(/^([\d.,]+)\s*(ml|мл|l|л|g|г|gr|kg|кг|pcs|pc|шт\.?|glass|бокал)$/i);
    if (!m) return p;
    const u = m[2].toLowerCase().replace('.', '');
    const key = { ml: 'ml', 'мл': 'ml', l: 'l', 'л': 'l', g: 'g', 'г': 'g', gr: 'g', kg: 'kg', 'кг': 'kg', pcs: 'pcs', pc: 'pcs', 'шт': 'pcs', glass: 'glass', 'бокал': 'glass' }[u];
    const num = m[1].replace(',', '.');
    return `${lang === 'ru' ? num.replace('.', ',') : num} ${t('units')[key] || m[2]}`;
  }
  const priceHtml = (it) => (it.oldPrice ? `<s>${money(it.oldPrice)}</s>` : '') + money(it.price);

  // ─────────────────────────── ДОСТУПНОСТЬ ПОЗИЦИЙ ───────────────────────────
  const NOW = Date.now();
  const isStopped = (it) => it.stop === true || (typeof it.stop === 'string' && Date.parse(it.stop) > NOW);
  const DIM = S.stoppedMode === 'dim';
  const visible = (it) => !isStopped(it) || DIM;
  function tbilisiToday() {
    const d = new Date(Date.now() + 240 * 60000);
    return { date: d.toISOString().slice(0, 10), dow: d.getUTCDay() };
  }
  function specialLive(s) {
    const { date, dow } = tbilisiToday();
    if (s.from && date < s.from) return false;
    if (s.to && date > s.to) return false;
    if (s.days && s.days.length && !s.days.includes(dow)) return false;
    return true;
  }

  // ─────────────────────────── СЕТЬ И КАЧЕСТВО ВИДЕО ───────────────────────────
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = !!(conn && conn.saveData);
  let measuredKbps = Number(sessionStorageGet('qa_kbps')) || 0;
  let forceLow = sessionStorageGet('qa_low') === '1';
  function sessionStorageGet(k) { try { return sessionStorage.getItem(k); } catch { return null; } }
  function sessionStorageSet(k, v) { try { sessionStorage.setItem(k, v); } catch { /* */ } }
  function lowQuality() {
    if (forceLow || saveData) return true;
    if (conn) {
      if (/(^|-)2g|3g/.test(conn.effectiveType || '')) return true;
      if (conn.downlink && conn.downlink < 1.6) return true;
    }
    if (measuredKbps && measuredKbps < 2600) return true;
    return false;
  }
  // оцениваем скорость по реально загруженным постерам (работает и в Safari, где нет navigator.connection)
  function measure(url) {
    try {
      const e = performance.getEntriesByName(new URL(url, location.href).href)[0];
      if (!e || !e.transferSize || e.transferSize < 15000) return;
      const ms = e.responseEnd - e.responseStart;
      if (ms < 15) return;
      const kbps = (e.transferSize * 8) / ms;
      measuredKbps = measuredKbps ? measuredKbps * 0.6 + kbps * 0.4 : kbps;
      sessionStorageSet('qa_kbps', String(Math.round(measuredKbps)));
    } catch { /* */ }
  }
  const autoplayAllowed = !reduceMotion && !saveData;

  // ─────────────────────────── ЭФФЕКТ ПАРА ───────────────────────────
  class Steam {
    constructor(card) {
      this.card = card; this.cv = h('canvas', 'steam-canvas'); this.ctx = this.cv.getContext('2d');
      this.pts = []; this.raf = 0; this.last = 0;
      card.querySelector('.card-media').after(this.cv);
      this.resize();
    }
    resize() { this.cv.width = Math.round(this.card.offsetWidth / 2); this.cv.height = Math.round(this.card.offsetHeight / 2); }
    start() { if (!this.raf) this.raf = requestAnimationFrame((ts) => this.tick(ts)); }
    stop() { cancelAnimationFrame(this.raf); this.raf = 0; }
    destroy() { this.stop(); this.cv.remove(); }
    tick(ts) {
      this.raf = requestAnimationFrame((x) => this.tick(x));
      if (ts - this.last < 33) return; // ~30 кадров/с достаточно для пара
      this.last = ts;
      const { ctx, cv, pts } = this, w = cv.width, hh = cv.height;
      ctx.clearRect(0, 0, w, hh);
      if (pts.length < 26 && Math.random() < 0.14) {
        pts.push({ x: w * (0.22 + Math.random() * 0.56), y: hh * (0.46 + Math.random() * 0.16), r: 7 + Math.random() * 10,
          vx: (Math.random() - 0.5) * 0.35, vy: -(0.28 + Math.random() * 0.5), life: 0, max: 60 + Math.random() * 80, wave: Math.random() * 6.28 });
      }
      for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        p.life++; p.x += p.vx + Math.sin(p.life * 0.07 + p.wave) * 0.15; p.y += p.vy; p.r += 0.09;
        const k = p.life / p.max;
        const a = (k < 0.25 ? k / 0.25 : k < 0.55 ? 1 : (1 - k) / 0.45) * 0.26;
        if (p.life >= p.max) { pts.splice(i, 1); continue; }
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(255,248,235,${a})`); g.addColorStop(0.45, `rgba(255,248,235,${a * 0.35})`); g.addColorStop(1, 'rgba(255,248,235,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
    }
  }

  // ─────────────────────────── МЕНЕДЖЕР ВИДЕО ───────────────────────────
  // Записи карточек: { el, item, media, video, carousel, index, steam, blocked }
  const VM = {
    recs: [],
    attached: new Set(),
    MAX_ATTACHED: 7,
    paused: false,
    scheduled: false,
    schedule() { if (!this.scheduled) { this.scheduled = true; requestAnimationFrame(() => { this.scheduled = false; this.update(); }); } },
    update() {
      const vh = innerHeight;
      const want = new Set(); // что должно быть подгружено
      const play = new Set(); // что должно играть
      for (const c of carousels) {
        const r = c.section.getBoundingClientRect();
        const visibleH = Math.min(r.bottom, vh) - Math.max(r.top, 0);
        c.onScreen = visibleH > Math.min(r.height, vh) * 0.45;
        c.near = r.bottom > -vh * 0.6 && r.top < vh * 1.6;
        const act = c.recs[c.active];
        if (!act) continue;
        if (c.near && act.media.type === 'video') want.add(act);
        if (c.onScreen) {
          if (act.media.type === 'video' && !this.paused && autoplayAllowed) play.add(act);
          for (const d of [-1, 1]) { const n = c.recs[c.active + d]; if (n && n.media.type === 'video' && !lowQuality()) want.add(n); }
        }
      }
      for (const r of play) want.add(r);
      // выгружаем лишнее (браузеры на телефонах плохо переносят много одновременных видео)
      for (const r of [...this.attached]) {
        if (!want.has(r)) {
          if (this.attached.size > this.MAX_ATTACHED || !r.carousel.near) this.detach(r);
          else this.pause(r);
        }
      }
      for (const r of want) if (!r.video) this.attach(r);
      for (const r of this.attached) { if (play.has(r)) this.play(r); else this.pause(r); }
      // пар — только на играющих горячих блюдах
      for (const r of this.recs) {
        const on = play.has(r) && r.item.steam;
        if (on) { if (!r.steam) r.steam = new Steam(r.el); r.steam.start(); } else if (r.steam) { r.steam.destroy(); r.steam = null; }
      }
    },
    attach(r) {
      const v = document.createElement('video');
      v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
      v.setAttribute('disablepictureinpicture', ''); v.setAttribute('disableremoteplayback', '');
      v.preload = 'auto';
      r.low = lowQuality() && !!r.media.srcLow;
      v.src = r.low ? r.media.srcLow : r.media.src;
      v.addEventListener('playing', () => { v.classList.add('playing'); clearTimeout(r.stall); r.el.classList.remove('blocked'); });
      v.addEventListener('waiting', () => {
        clearTimeout(r.stall);
        // интернет не успевает — переключаемся на лёгкую версию без перезагрузки страницы
        r.stall = setTimeout(() => { if (!r.low && r.media.srcLow && r.video === v) this.downgrade(r); }, 2200);
      });
      v.addEventListener('error', () => {
        // обрыв сети — пробуем лёгкую версию; ошибка формата — просто остаётся обложка
        if (v.error && v.error.code === 2 && !r.low && r.media.srcLow) this.downgrade(r);
      });
      r.el.querySelector('.card-media').appendChild(v);
      r.video = v;
      this.attached.add(r);
    },
    downgrade(r) {
      forceLow = true; sessionStorageSet('qa_low', '1');
      const v = r.video; if (!v) return;
      const t0 = v.currentTime; r.low = true;
      v.src = r.media.srcLow; v.currentTime = t0 || 0;
      if (r.shouldPlay) v.play().catch(() => {});
    },
    detach(r) {
      const v = r.video; if (!v) return;
      clearTimeout(r.stall);
      v.pause(); v.removeAttribute('src'); v.load(); v.remove();
      r.video = null; r.shouldPlay = false; this.attached.delete(r);
    },
    play(r) {
      r.shouldPlay = true;
      const v = r.video;
      if (!v || !v.paused) return;
      const p = v.play();
      if (p && p.catch) p.catch(() => { r.el.classList.add('blocked'); }); // режим энергосбережения на iPhone
    },
    pause(r) { r.shouldPlay = false; if (r.video && !r.video.paused) r.video.pause(); },
    pauseAll(flag) { this.paused = flag; this.update(); },
  };

  // ─────────────────────────── КАРТОЧКИ ───────────────────────────
  const ICON_INFO = '<svg viewBox="0 0 24 24"><path d="M12 11v6M12 7.5v.01"/><circle cx="12" cy="12" r="9"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';

  function mediaInto(box, media, eager) {
    if (media.blur) box.style.backgroundImage = `url("${media.blur}")`;
    const loading = eager ? 'eager' : 'lazy';
    if (media.type === 'video') {
      if (media.poster) {
        const img = h('img', 'card-poster');
        img.alt = ''; img.decoding = 'async'; img.loading = loading;
        img.addEventListener('load', () => { img.classList.add('loaded'); measure(media.poster); }, { once: true });
        img.src = media.poster;
        box.appendChild(img);
      }
    } else if (media.w && media.h && media.h / media.w >= 1.3) {
      // вертикальное фото — на всю карточку, как видео
      const img = h('img', 'card-poster');
      img.alt = ''; img.decoding = 'async'; img.loading = loading;
      img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
      img.src = media.src;
      box.appendChild(img);
    } else {
      box.classList.add('is-photo');
      const back = h('img', 'photo-backdrop'); back.alt = ''; back.loading = loading; back.decoding = 'async'; back.src = media.src;
      const main = h('img', 'photo-main'); main.alt = ''; main.loading = loading; main.decoding = 'async';
      if (media.w && media.h) main.style.setProperty('--ar', `${media.w} / ${media.h}`);
      main.addEventListener('load', () => main.classList.add('loaded'), { once: true });
      main.src = media.src;
      box.append(back, main);
    }
  }

  function buildCard(it, idx, cat, opts = {}) {
    const el = h('article', 'dish-card');
    el.dataset.id = it.id;
    el.tabIndex = 0;
    const media = h('div', 'card-media');
    mediaInto(media, it.media, opts.eager);
    el.appendChild(media);
    el.appendChild(h('div', 'card-overlay'));
    el.insertAdjacentHTML('beforeend', `<span class="card-play" aria-hidden="true">${ICON_PLAY}</span>`);
    if (opts.special) bindText(el.appendChild(h('span', 'special-ribbon')), () => (it.label && it.label[lang]) || t('special'));
    const stopped = isStopped(it);
    if (stopped) { el.classList.add('is-stopped'); bindText(el.appendChild(h('span', 'stop-pill')), () => t('unavailable')); }

    const info = h('div', 'card-info');
    info.appendChild(h('span', 'card-index', String(idx + 1).padStart(2, '0')));
    bindText(info.appendChild(h('h3', 'card-name')), () => pick(it.name));
    const sub = info.appendChild(h('p', 'card-sub'));
    bindText(sub, () => portion(it.portion));
    const ingr = info.appendChild(h('p', 'card-ingredients'));
    bindText(ingr, () => pick(it.ingr) || pick(it.desc));
    const foot = h('div', 'card-footer');
    foot.appendChild(h('span', 'card-price', priceHtml(it)));
    const right = h('div', 'card-right');
    const badge = it.badges && it.badges[0];
    if (badge && DATA.badges[badge]) bindText(right.appendChild(h('span', 'card-badge')), () => pick(DATA.badges[badge]));
    const more = h('button', 'card-more', ICON_INFO); more.type = 'button';
    textRegistry.push([more, () => { more.setAttribute('aria-label', t('details')); return null; }, 'attr']);
    right.appendChild(more);
    foot.appendChild(right);
    info.appendChild(foot);
    el.appendChild(info);
    // пустые строки прячем, чтобы карточка не «дырявилась»
    textRegistry.push([sub, () => { sub.hidden = !sub.textContent; return null; }, 'attr']);
    textRegistry.push([ingr, () => { ingr.hidden = !ingr.textContent; return null; }, 'attr']);
    return el;
  }

  function buildMini(it) {
    const b = h('button', 'mini'); b.type = 'button'; b.dataset.id = it.id;
    if (isStopped(it)) b.classList.add('is-stopped');
    const top = h('div', 'mini-top');
    if (it.media && it.media.type === 'image') {
      const img = h('img', 'mini-thumb'); img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.src = it.media.src; top.appendChild(img);
    } else if (it.media && it.media.poster) {
      const img = h('img', 'mini-thumb'); img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.src = it.media.poster; top.appendChild(img);
    }
    bindText(top.appendChild(h('span', 'mini-name')), () => pick(it.name));
    const bot = h('div', 'mini-bottom');
    const por = bot.appendChild(h('span', 'mini-portion'));
    bindText(por, () => (isStopped(it) ? t('unavailable') : portion(it.portion)));
    bot.appendChild(h('span', 'mini-price', priceHtml(it)));
    b.append(top, bot);
    return b;
  }

  // ─────────────────────────── КАРУСЕЛЬ ───────────────────────────
  const carousels = [];
  class Carousel {
    constructor(section, track, items, cat, opts) {
      this.section = section; this.track = track; this.active = 0; this.recs = [];
      items.forEach((it, i) => {
        const el = buildCard(it, i, cat, { ...opts, eager: opts.eager && i < 2 });
        track.appendChild(el);
        const rec = { el, item: it, media: it.media, video: null, carousel: this, index: i, steam: null };
        this.recs.push(rec); VM.recs.push(rec);
        el.addEventListener('click', (e) => {
          if (this.dragMoved) return;
          if (i !== this.active && !e.target.closest('.card-more')) { this.go(i); return; }
          if (rec.el.classList.contains('blocked') && rec.video && !e.target.closest('.card-more')) { rec.video.play().catch(() => {}); rec.el.classList.remove('blocked'); return; }
          openDish(it, rec);
        });
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') openDish(it, rec); });
      });
      this.buildControls();
      this.bind();
      this.setActive(0, true);
    }
    buildControls() {
      const n = this.recs.length;
      const ctr = h('div', 'carousel-controls');
      this.prev = h('button', 'carousel-arrow', '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>');
      this.next = h('button', 'carousel-arrow', '<svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>');
      this.prev.type = this.next.type = 'button';
      this.prev.setAttribute('aria-label', '‹'); this.next.setAttribute('aria-label', '›');
      this.prev.onclick = () => this.go(this.active - 1);
      this.next.onclick = () => this.go(this.active + 1);
      this.dots = h('div', 'carousel-dots');
      if (n > 1 && n <= 9) {
        for (let i = 0; i < n; i++) this.dots.appendChild(h('span', 'dot'));
      } else if (n > 9) {
        this.count = h('span', 'carousel-count');
        this.bar = h('span', 'carousel-progress', '<i></i>');
        this.dots.append(this.count, this.bar);
      }
      if (n > 1) { ctr.append(this.prev, this.next); this.section.appendChild(ctr); }
      this.section.appendChild(this.dots);
    }
    bind() {
      const tr = this.track;
      let raf = 0;
      tr.addEventListener('scroll', () => {
        if (raf) return;
        raf = requestAnimationFrame(() => { raf = 0; this.syncFromScroll(); });
      }, { passive: true });
      // перетаскивание мышью на компьютере
      let down = false, sx = 0, sl = 0;
      tr.addEventListener('mousedown', (e) => { if (e.button) return; down = true; this.dragMoved = false; sx = e.pageX; sl = tr.scrollLeft; });
      addEventListener('mousemove', (e) => {
        if (!down) return;
        const dx = e.pageX - sx;
        if (!this.dragMoved && Math.abs(dx) > 5) { this.dragMoved = true; tr.classList.add('dragging'); }
        if (this.dragMoved) { e.preventDefault(); tr.scrollLeft = sl - dx; }
      });
      addEventListener('mouseup', () => {
        if (!down) return; down = false;
        if (this.dragMoved) {
          tr.classList.remove('dragging');
          const i = this.nearest();
          this.go(i);
          setTimeout(() => { this.dragMoved = false; }, 50);
        }
      });
      tr.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { this.go(this.active + 1); e.preventDefault(); }
        if (e.key === 'ArrowLeft') { this.go(this.active - 1); e.preventDefault(); }
      });
    }
    nearest() {
      const c = this.track.scrollLeft + this.track.clientWidth / 2;
      let best = 0, min = Infinity;
      this.recs.forEach((r, i) => { const d = Math.abs(r.el.offsetLeft + r.el.offsetWidth / 2 - c); if (d < min) { min = d; best = i; } });
      return best;
    }
    syncFromScroll() { const i = this.nearest(); if (i !== this.active) this.setActive(i); }
    go(i) {
      i = Math.max(0, Math.min(this.recs.length - 1, i));
      const el = this.recs[i].el;
      const left = el.offsetLeft - (this.track.clientWidth - el.offsetWidth) / 2;
      this.track.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
      this.setActive(i);
    }
    setActive(i, silent) {
      this.active = i;
      this.recs.forEach((r, k) => r.el.classList.toggle('card-active', k === i));
      const n = this.recs.length;
      if (this.prev) { this.prev.disabled = i === 0; this.next.disabled = i === n - 1; }
      $$('.dot', this.dots).forEach((d, k) => d.classList.toggle('active', k === i));
      if (this.count) { this.count.innerHTML = `<b>${i + 1}</b> / ${n}`; this.bar.firstChild.style.transform = `scaleX(${(i + 1) / n})`; }
      if (!silent) VM.schedule();
    }
  }

  // ─────────────────────────── СБОРКА МЕНЮ ───────────────────────────
  const menuEl = $('#menu');
  const navTrack = $('#cat-nav-track');
  const sections = [];
  const itemsByCat = new Map();
  for (const it of DATA.items) {
    if (!itemsByCat.has(it.cat)) itemsByCat.set(it.cat, []);
    itemsByCat.get(it.cat).push(it);
  }
  const orderStopped = (list) => (DIM ? [...list.filter((x) => !isStopped(x)), ...list.filter(isStopped)] : list.filter((x) => !isStopped(x)));

  function addSection({ id, title, sub, cards, rail, special, compactOnly, eager }) {
    const sec = h('section', 'menu-section' + (special ? ' section-special' : '') + (compactOnly ? ' compact-only' : ''));
    sec.id = 'sec-' + id;
    const head = h('div', 'section-header');
    const no = h('span', 'section-number', special ? '★' : String(sections.filter((s) => !s.special).length + 1).padStart(2, '0'));
    const ttl = bindText(h('h2', 'section-title'), title);
    const sb = bindText(h('span', 'section-sub'), sub);
    head.append(no, ttl, sb);
    sec.appendChild(head);
    if (cards.length) {
      const track = h('div', 'carousel-track'); track.setAttribute('role', 'list'); track.tabIndex = -1;
      sec.appendChild(track);
      carousels.push(new Carousel(sec, track, cards, id, { special, eager }));
    }
    if (rail.length) {
      if (cards.length) bindText(sec.appendChild(h('div', 'rail-label')), () => t('also'));
      const r = h('div', 'rail');
      rail.forEach((it) => { const m = buildMini(it); m.onclick = () => openDish(it); r.appendChild(m); });
      sec.appendChild(r);
    }
    menuEl.appendChild(sec);
    const pill = h('button', 'cat-pill' + (special ? ' special' : '')); pill.type = 'button';
    bindText(pill, () => (special ? '★ ' : '') + title());
    pill.onclick = () => scrollToSection(sec);
    navTrack.appendChild(pill);
    sections.push({ sec, pill, special });
  }

  function build() {
    // 1. спецпредложения — автоматически выше всех
    const specials = (DATA.specials || []).filter(specialLive);
    if (specials.length) {
      const withMedia = specials.filter((s) => s.media);
      addSection({
        id: 'special', special: true, eager: true,
        title: () => pick(S.specialsTitle) || t('special'),
        sub: () => t('items')(specials.length),
        cards: withMedia, rail: specials.filter((s) => !s.media),
      });
    }
    // 2. кухня — в порядке категорий из админки
    let first = !specials.length;
    for (const c of DATA.categories.filter((x) => x.section === 'kitchen')) {
      const list = orderStopped(itemsByCat.get(c.id) || []);
      if (!list.length) continue;
      const cards = c.display === 'video' ? list.filter((x) => x.media) : [];
      const rail = list.filter((x) => !cards.includes(x));
      addSection({
        id: c.id, title: () => pick(c.name), sub: () => t('items')(list.length),
        cards, rail, compactOnly: !cards.length, eager: first && cards.length,
      });
      if (cards.length) first = false;
    }
    // 3. кнопка бара в навигации
    if (DATA.categories.some((c) => c.section === 'bar')) {
      const pill = h('button', 'cat-pill bar'); pill.type = 'button';
      bindText(pill, () => t('bar'));
      pill.onclick = openBar;
      navTrack.appendChild(pill);
    } else $('#bar-open').hidden = true;
    buildFooter();
  }

  function buildFooter() {
    const f = $('#footer-info');
    const lines = h('div');
    bindText(lines, () => [esc(pick(S.address)), S.hours ? `${esc(t('hours'))} · ${esc(S.hours)}` : ''].filter(Boolean).join('<br>'), true);
    const links = h('div', 'footer-links');
    if (S.whatsapp) {
      const a = h('a', 'footer-link primary'); a.href = `https://wa.me/${S.whatsapp}`; a.target = '_blank'; a.rel = 'noopener';
      bindText(a, () => t('book')); links.appendChild(a);
    }
    if (S.phone) { const a = h('a', 'footer-link'); a.href = 'tel:' + S.phone.replace(/[^\d+]/g, ''); bindText(a, () => `${t('call')} · ${S.phone}`); links.appendChild(a); }
    if (S.instagram) { const a = h('a', 'footer-link'); a.href = S.instagram; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Instagram'; links.appendChild(a); }
    f.append(lines, links);
  }

  // ─────────────────────────── НАВИГАЦИЯ ───────────────────────────
  const header = $('#site-header');
  const nav = $('#cat-nav');
  const hero = $('.hero');
  function measureHeader() { document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px'); }
  function scrollToSection(sec) {
    const y = sec.getBoundingClientRect().top + scrollY - header.offsetHeight - nav.offsetHeight + 8;
    scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  let activePill = null;
  function onScroll() {
    const past = scrollY > hero.offsetHeight - header.offsetHeight - 10;
    header.classList.toggle('dark', scrollY > 40);
    nav.classList.toggle('show', past);
    // активный раздел — тот, что пересекает линию на 40% высоты экрана
    const line = innerHeight * 0.4;
    let cur = null;
    for (const s of sections) { const r = s.sec.getBoundingClientRect(); if (r.top <= line) cur = s; }
    if (cur !== activePill) {
      if (activePill) activePill.pill.classList.remove('active');
      activePill = cur;
      if (cur) {
        cur.pill.classList.add('active');
        const p = cur.pill, tr = navTrack;
        tr.scrollTo({ left: p.offsetLeft - tr.clientWidth / 2 + p.offsetWidth / 2, behavior: 'smooth' });
      }
    }
    VM.schedule();
  }

  // ─────────────────────────── КАРТОЧКА БЛЮДА ───────────────────────────
  const sheet = $('#dish-sheet');
  const panel = $('#dish-sheet-panel');
  let sheetVideo = null;
  let sheetOpenState = false;
  function openDish(it, rec) {
    const m = it.media;
    let mediaHtml = '';
    if (m) {
      const bg = m.blur ? ` style="background-image:url('${esc(m.blur)}')"` : '';
      if (m.type === 'video') mediaHtml = `<div class="sheet-media"${bg}><img src="${esc(m.poster || '')}" alt=""></div>`;
      else mediaHtml = `<div class="sheet-media is-photo"${bg}><img class="main" src="${esc(m.src)}" alt=""></div>`;
    }
    const badges = (it.badges || []).filter((b) => DATA.badges[b]).map((b) => `<span class="card-badge">${esc(pick(DATA.badges[b]))}</span>`).join('');
    const catName = pick((DATA.categories.find((c) => c.id === it.cat) || {}).name) || pick(it.label) || t('special');
    const desc = pick(it.desc), ingr = pick(it.ingr);
    panel.innerHTML = `
      <div class="sheet-grip" aria-hidden="true"></div>
      <button class="sheet-close" type="button" data-close aria-label="${esc(t('close'))}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      ${mediaHtml}
      <div class="sheet-body">
        <div class="sheet-kicker">${esc(catName)}</div>
        <h3 class="sheet-title">${esc(pick(it.name))}</h3>
        <div class="sheet-meta"><span class="sheet-price">${priceHtml(it)}</span>${it.portion ? `<span class="sheet-portion">${esc(portion(it.portion))}</span>` : ''}${isStopped(it) ? `<span class="stop-pill" style="position:static">${esc(t('unavailable'))}</span>` : ''}</div>
        ${badges ? `<div class="sheet-badges">${badges}</div>` : ''}
        ${desc ? `<p class="sheet-desc">${esc(desc)}</p>` : ''}
        ${ingr ? `<div class="sheet-h">${esc(t('ingredients'))}</div><p class="sheet-ingr">${esc(ingr)}</p>` : ''}
        ${!desc && !ingr ? `<p class="sheet-empty">${esc(t('noDesc'))}</p>` : ''}
      </div>`;
    if (m && m.type === 'video') {
      const box = $('.sheet-media', panel);
      const v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
      v.poster = m.poster || '';
      // если видео уже загружено в карусели — берём ту же версию из кэша браузера
      v.src = rec && rec.video ? rec.video.currentSrc : (lowQuality() && m.srcLow ? m.srcLow : m.src);
      if (rec && rec.video) v.currentTime = rec.video.currentTime;
      box.appendChild(v);
      v.play().catch(() => {});
      sheetVideo = v;
    }
    sheet.hidden = false;
    lockScroll(true);
    VM.pauseAll(true);
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('open')));
    pushState('dish');
    sheetOpenState = true;
    setTimeout(() => $('.sheet-close', panel)?.focus({ preventScroll: true }), 350);
  }
  function closeDish(fromPop) {
    if (!sheetOpenState) return;
    sheetOpenState = false;
    sheet.classList.remove('open');
    if (sheetVideo) { sheetVideo.pause(); sheetVideo.removeAttribute('src'); sheetVideo.load(); sheetVideo = null; }
    setTimeout(() => { sheet.hidden = true; panel.innerHTML = ''; }, 420);
    if (!barOpenState) lockScroll(false);
    VM.pauseAll(barOpenState);
    if (!fromPop) popState();
  }
  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeDish(); });
  // свайп вниз по «ручке» закрывает карточку
  (() => {
    let y0 = null;
    panel.addEventListener('touchstart', (e) => { if (panel.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
    panel.addEventListener('touchmove', (e) => {
      if (y0 == null) return;
      const dy = e.touches[0].clientY - y0;
      if (dy > 0 && panel.scrollTop <= 0) panel.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    panel.addEventListener('touchend', (e) => {
      if (y0 == null) return;
      const dy = e.changedTouches[0].clientY - y0; y0 = null;
      panel.style.transform = '';
      if (dy > 110) closeDish();
    });
  })();

  // ─────────────────────────── БАР ───────────────────────────
  const bar = $('#bar-sheet');
  let barBuilt = false, barOpenState = false;
  const ART = { wine: '/assets/bar/wine.webp', chacha: '/assets/bar/chacha.webp', brandy: '/assets/bar/brandy.webp', vodka: '/assets/bar/vodka.webp',
    spirits: '/assets/bar/spirits.webp', beer: '/assets/bar/beer.webp', cocktails: '/assets/bar/cocktails.webp', coffee: '/assets/bar/coffee.webp', soft: '/assets/bar/soft.webp' };
  function buildBar() {
    barBuilt = true;
    const body = $('#bar-body'), barNav = $('#bar-nav');
    const heroArt = $('.bar-hero-art');
    if (heroArt.complete) heroArt.classList.add('loaded'); else heroArt.addEventListener('load', () => heroArt.classList.add('loaded'), { once: true });
    const barCats = DATA.categories.filter((c) => c.section === 'bar');
    let n = 0;
    for (const g of DATA.groups) {
      const cats = barCats.filter((c) => c.group === g.id).map((c) => ({ c, list: orderStopped(itemsByCat.get(c.id) || []) })).filter((x) => x.list.length);
      if (!cats.length) continue;
      n++;
      const sec = h('section', 'bar-group'); sec.id = 'bar-' + g.id;
      const head = h('div', 'bar-group-head');
      const tt = h('div');
      tt.appendChild(h('span', 'bar-group-no', String(n).padStart(2, '0')));
      bindText(tt.appendChild(h('h3', 'bar-group-title')), () => pick(g.name));
      head.appendChild(tt);
      const src = g.artUrl || ART[g.art];
      if (src) {
        const img = h('img', 'bar-art' + (g.art === 'wine' || g.artUrl ? '' : ' transparent'));
        img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.src = src;
        head.appendChild(img);
      }
      sec.appendChild(head);
      for (const { c, list } of cats) {
        if (cats.length > 1 || pick(c.name) !== pick(g.name)) bindText(sec.appendChild(h('div', 'bar-sub-title')), () => pick(c.name));
        const ul = h('ul', 'bar-list');
        // одинаковые названия с разным объёмом — в одну строку: «Finlandia  50 мл 12 ₾ · 0,5 л 75 ₾ · 1 л 135 ₾»
        const rows = [];
        for (const it of list) {
          const key = (it.name.en || it.name.ru || it.name.ka || '') + '|' + (it.name.ka || '');
          const row = rows.find((r) => r.key === key);
          if (row) row.items.push(it); else rows.push({ key, items: [it] });
        }
        for (const r of rows) {
          const li = h('li', 'bar-row' + (r.items.length > 1 ? ' multi' : ''));
          if (r.items.every(isStopped)) li.classList.add('is-stopped');
          bindText(li.appendChild(h('span', 'bar-name')), () => pick(r.items[0].name));
          const pr = h('span', 'bar-prices');
          bindText(pr, () => r.items.map((it) => `<span class="bar-price${isStopped(it) ? ' is-stopped' : ''}">${it.portion ? `<small>${esc(portion(it.portion))}</small>` : ''}<b>${money(it.price)}</b></span>`).join(''), true);
          li.appendChild(pr);
          ul.appendChild(li);
        }
        sec.appendChild(ul);
      }
      body.appendChild(sec);
      const pill = h('button', 'bar-pill'); pill.type = 'button';
      bindText(pill, () => pick(g.name));
      pill.onclick = () => { const sc = $('#bar-scroll'); sc.scrollTo({ top: sec.offsetTop - barNav.offsetHeight + 2, behavior: reduceMotion ? 'auto' : 'smooth' }); };
      barNav.appendChild(pill);
      barPills.push({ sec, pill });
    }
    applyTexts();
    const sc = $('#bar-scroll');
    let raf = 0;
    sc.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        let cur = null;
        for (const p of barPills) if (p.sec.getBoundingClientRect().top < innerHeight * 0.35) cur = p;
        barPills.forEach((p) => p.pill.classList.toggle('active', p === cur));
        if (cur) { const tr = barNav; tr.scrollTo({ left: cur.pill.offsetLeft - tr.clientWidth / 2 + cur.pill.offsetWidth / 2, behavior: 'smooth' }); }
      });
    }, { passive: true });
  }
  const barPills = [];
  function openBar() {
    if (!barBuilt) buildBar();
    bar.hidden = false;
    lockScroll(true);
    VM.pauseAll(true);
    requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.add('open')));
    barOpenState = true;
    pushState('bar');
    setTimeout(() => $('#bar-close').focus({ preventScroll: true }), 400);
  }
  function closeBar(fromPop) {
    if (!barOpenState) return;
    barOpenState = false;
    bar.classList.remove('open');
    setTimeout(() => { if (!barOpenState) bar.hidden = true; }, 560);
    lockScroll(false);
    VM.pauseAll(false);
    if (!fromPop) popState();
  }
  $('#bar-open').addEventListener('click', openBar);
  $('#bar-close').addEventListener('click', () => closeBar());

  // «Назад» на телефоне закрывает окно, а не уходит со страницы
  let pushed = 0;
  function pushState(kind) { history.pushState({ qa: kind }, ''); pushed++; }
  function popState() { if (pushed > 0) { pushed--; ignorePop++; history.back(); } }
  let ignorePop = 0;
  addEventListener('popstate', () => {
    if (ignorePop) { ignorePop--; return; }
    if (pushed > 0) pushed--;
    if (sheetOpenState) closeDish(true);
    else if (barOpenState) closeBar(true);
  });
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (sheetOpenState) closeDish(); else if (barOpenState) closeBar();
  });
  function lockScroll(on) { document.documentElement.classList.toggle('lock', on); }

  // ─────────────────────────── HERO-ВИДЕО ───────────────────────────
  function startHero() {
    const v = $('.hero-video-bg');
    if (!v || !autoplayAllowed || lowQuality()) return;
    v.src = v.dataset.src;
    v.addEventListener('playing', () => v.classList.add('on'), { once: true });
    v.play().catch(() => {});
    new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }).observe(v);
  }

  // ─────────────────────────── СТАРТ ───────────────────────────
  build();
  applyTexts();
  measureHeader();
  $$('.lang-btn').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang; store.set('qa_lang', lang);
    applyTexts();
  }));
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => {
    measureHeader();
    for (const r of VM.recs) if (r.steam) r.steam.resize();
    for (const c of carousels) c.go(c.active);
    VM.schedule();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { for (const r of VM.attached) r.video && r.video.pause(); for (const r of VM.recs) r.steam && r.steam.stop(); }
    else VM.schedule();
  });
  onScroll();
  (window.requestIdleCallback || ((f) => setTimeout(f, 300)))(startHero);
  if (location.hash === '#bar') openBar();
})();
