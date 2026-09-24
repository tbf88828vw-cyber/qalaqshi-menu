/* Qalaqshi — видео-меню.
   Без фреймворков. Данные уже внутри HTML. Видео: играет только одно (самое видимое),
   соседние подгружаются заранее, далёкие выгружаются, качество (480/720/1080) подбирается
   под скорость сети и экран и меняется на лету. */
(() => {
  'use strict';

  const DATA = JSON.parse(document.getElementById('menu-data').textContent);
  const S = DATA.settings;
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ls = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* приватный режим */ } } };
  const ss = { get(k) { try { return sessionStorage.getItem(k); } catch { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* */ } } };

  // ─────────────────────────── ТЕКСТЫ ИНТЕРФЕЙСА ───────────────────────────
  const UI = {
    en: { bar: 'Bar', scroll: 'Menu', details: 'Details', ingredients: 'Ingredients', unavailable: 'Not available today',
      also: 'More in this section', items: (n) => `${n} ${n === 1 ? 'item' : 'items'}`, special: 'Special', close: 'Close',
      barTitle: 'Wine & Bar', barSub: 'Georgian wine, chacha, cocktails and more', barEyebrow: 'Qalaqshi · Bar',
      hours: 'Open daily', call: 'Call', book: 'Book a table', noDesc: 'Your waiter will be happy to tell you more about this dish.',
      swipe: 'Swipe', light: 'Light theme', dark: 'Dark theme', prev: 'Previous', next: 'Next',
      units: { ml: 'ml', l: 'L', g: 'g', kg: 'kg', pcs: 'pc', glass: 'glass' } },
    ru: { bar: 'Бар', scroll: 'Меню', details: 'Подробнее', ingredients: 'Состав', unavailable: 'Сегодня нет',
      also: 'Ещё в этом разделе', items: (n) => `${n} ${plural(n, 'позиция', 'позиции', 'позиций')}`, special: 'Спецпредложение', close: 'Закрыть',
      barTitle: 'Вино и бар', barSub: 'Грузинское вино, чача, коктейли и не только', barEyebrow: 'Qalaqshi · Бар',
      hours: 'Ежедневно', call: 'Позвонить', book: 'Забронировать стол', noDesc: 'Подробнее об этом блюде с радостью расскажет официант.',
      swipe: 'Листайте', light: 'Светлая тема', dark: 'Тёмная тема', prev: 'Назад', next: 'Дальше',
      units: { ml: 'мл', l: 'л', g: 'г', kg: 'кг', pcs: 'шт.', glass: 'бокал' } },
    ka: { bar: 'ბარი', scroll: 'მენიუ', details: 'დეტალურად', ingredients: 'შემადგენლობა', unavailable: 'დღეს არ გვაქვს',
      also: 'ამავე განყოფილებიდან', items: (n) => `${n} პოზიცია`, special: 'სპეციალური შეთავაზება', close: 'დახურვა',
      barTitle: 'ღვინო და ბარი', barSub: 'ქართული ღვინო, ჭაჭა, კოქტეილები და სხვა', barEyebrow: 'ქალაქში · ბარი',
      hours: 'ყოველდღე', call: 'დარეკვა', book: 'მაგიდის დაჯავშნა', noDesc: 'ამ კერძის შესახებ დაწვრილებით მიმტანი მოგიყვებათ.',
      swipe: 'გადაფურცლეთ', light: 'ღია თემა', dark: 'მუქი თემა', prev: 'წინა', next: 'შემდეგი',
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
    const saved = ls.get('qa_lang');
    if (saved && UI[saved]) return saved;
    for (const l of navigator.languages || [navigator.language || '']) {
      const c = String(l).slice(0, 2).toLowerCase();
      if (c === 'ka') return 'ka';
      if (['ru', 'uk', 'be', 'kk', 'hy', 'az', 'uz', 'ky', 'tg'].includes(c)) return 'ru';
      if (c === 'en') return 'en';
    }
    return UI[S.defaultLang] ? S.defaultLang : 'en';
  }
  let lang = detectLang();
  const t = (k) => UI[lang][k] ?? UI.en[k];
  const pick = (o) => (o && (o[lang] || o.en || o.ru || o.ka)) || '';

  // тексты, меняющиеся при смене языка — обновляются на месте, без перестройки DOM и перезагрузки видео
  const textRegistry = [];
  const bindText = (el, fn, mode) => { textRegistry.push([el, fn, mode]); return el; };
  const bindAttr = (fn) => textRegistry.push([null, fn, 'fn']);
  function applyTexts() {
    for (const [el, fn, mode] of textRegistry) {
      const v = fn();
      if (mode === 'fn') continue;
      if (mode === 'html') el.innerHTML = v; else el.textContent = v;
    }
    $$('[data-t]').forEach((el) => {
      const k = el.dataset.t;
      if (k === 'eyebrow' || k === 'tagline') el.textContent = pick(S[k]);
      else if (k === 'heroTitle' || k === 'heroText') { const v = pick(S[k]); el.textContent = v; el.hidden = !v; }
      else if (UI[lang][k] !== undefined) el.textContent = t(k);
    });
    $$('.lang-btn').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
    root.lang = lang;
    const tb = $('#theme-btn');
    if (tb) tb.setAttribute('aria-label', theme() === 'dark' ? t('light') : t('dark'));
  }

  // ─────────────────────────── ТЕМА ───────────────────────────
  const theme = () => (root.dataset.theme === 'light' ? 'light' : 'dark');
  function setTheme(v, animate) {
    if (animate) { root.classList.add('theme-anim'); clearTimeout(setTheme.tm); setTheme.tm = setTimeout(() => root.classList.remove('theme-anim'), 600); }
    root.dataset.theme = v;
    ls.set('qa_theme', v);
    const m = $('#meta-theme'); if (m) m.content = v === 'light' ? '#f5f5f7' : '#07060a';
    applyTexts();
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
  function tbilisiToday() { const d = new Date(Date.now() + 240 * 60000); return { date: d.toISOString().slice(0, 10), dow: d.getUTCDay() }; }
  function specialLive(s) {
    const { date, dow } = tbilisiToday();
    if (s.from && date < s.from) return false;
    if (s.to && date > s.to) return false;
    if (s.days && s.days.length && !s.days.includes(dow)) return false;
    return true;
  }
  const isPortraitPhoto = (m) => m && m.type === 'image' && m.w && m.h && m.h / m.w >= 1.25;
  // большая карусель или компактная лента
  function isBig(it, cat) {
    if (it.place === 'big') return true;
    if (it.place === 'compact') return false;
    if (cat && cat.display === 'compact') return false;
    return !!(it.media && (it.media.type === 'video' || isPortraitPhoto(it.media)));
  }

  // ─────────────────────────── СЕТЬ И КАЧЕСТВО ВИДЕО ───────────────────────────
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = !!(conn && conn.saveData);
  const DPR = Math.min(window.devicePixelRatio || 1, 3);
  const RUNGS = ['srcLow', 'src', 'srcHi'];
  // уровень качества для всей сессии: 0 — 480p, 1 — 720p, 2 — 1080p
  let netRung = (() => {
    const saved = ss.get('qa_rung');
    if (saved !== null) return Number(saved);
    if (saveData) return 0;
    if (conn) {
      if (/(^|-)2g|3g/.test(conn.effectiveType || '')) return 0;
      if (conn.downlink && conn.downlink < 1.5) return 0;
      if (conn.downlink >= 10 && DPR >= 2) return 2;
    }
    return 1;
  })();
  const setRung = (r) => { netRung = Math.max(0, Math.min(2, r)); ss.set('qa_rung', String(netRung)); };
  function srcFor(media, rung = netRung) {
    for (let r = rung; r >= 0; r--) if (media[RUNGS[r]]) return { key: RUNGS[r], url: media[RUNGS[r]], rung: r };
    for (let r = rung + 1; r < 3; r++) if (media[RUNGS[r]]) return { key: RUNGS[r], url: media[RUNGS[r]], rung: r };
    return null;
  }
  const autoplayAllowed = !reduceMotion && !saveData;

  // ─────────────────────────── ЭФФЕКТ ПАРА ───────────────────────────
  // мягкие полупрозрачные клубы поднимаются от блюда (точка берётся из разметки фокуса),
  // закручиваются и растворяются. Рисуется в половинном разрешении — дёшево для телефона.
  const puff = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,250,242,.55)'); gr.addColorStop(.35, 'rgba(255,250,242,.28)'); gr.addColorStop(.7, 'rgba(255,250,242,.08)'); gr.addColorStop(1, 'rgba(255,250,242,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return c;
  })();
  class Steam {
    constructor(host, focus) {
      this.host = host; this.f = focus || { x: 0.5, y: 0.6, s: 0.5 };
      this.cv = h('canvas', 'steam-canvas'); this.ctx = this.cv.getContext('2d');
      this.pts = []; this.raf = 0; this.last = 0; this.t = 0;
      host.appendChild(this.cv);
      this.resize();
    }
    resize() { this.w = this.cv.width = Math.max(1, Math.round(this.host.offsetWidth / 2)); this.h = this.cv.height = Math.max(1, Math.round(this.host.offsetHeight / 2)); }
    start() { if (!this.raf) { this.last = 0; this.raf = requestAnimationFrame((ts) => this.tick(ts)); } }
    stop() { cancelAnimationFrame(this.raf); this.raf = 0; }
    destroy() { this.stop(); this.cv.remove(); }
    spawn() {
      const { w, h: H, f } = this;
      const spread = w * Math.min(0.8, Math.max(0.25, f.s)) * 0.42;
      this.pts.push({
        x: f.x * w + (Math.random() - 0.5) * 2 * spread,
        y: f.y * H - H * 0.02 + (Math.random() - 0.3) * H * 0.05,
        r: w * (0.05 + Math.random() * 0.05),
        vy: -(H * (0.0022 + Math.random() * 0.0022)),
        drift: (Math.random() - 0.5) * 0.35,
        ph: Math.random() * 6.28, fr: 0.6 + Math.random() * 0.8,
        life: 0, max: 110 + Math.random() * 90, rot: Math.random() * 6.28,
      });
    }
    tick(ts) {
      this.raf = requestAnimationFrame((x) => this.tick(x));
      if (ts - this.last < 33) return;
      this.last = ts; this.t += 1;
      const { ctx, w, h: H, pts } = this;
      ctx.clearRect(0, 0, w, H);
      if (pts.length < 22 && Math.random() < 0.28) this.spawn();
      for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        p.life++;
        const k = p.life / p.max;
        if (k >= 1 || p.y < -p.r * 2) { pts.splice(i, 1); continue; }
        // завихрение: сумма синусов даёт живое, неповторяющееся движение
        p.x += p.drift + Math.sin(p.life * 0.045 * p.fr + p.ph) * 0.45 + Math.sin(this.t * 0.013 + p.ph) * 0.2;
        p.y += p.vy * (1 - k * 0.35);
        p.r += w * 0.0012;
        const a = (k < 0.2 ? k / 0.2 : k < 0.5 ? 1 : (1 - k) / 0.5) * 0.34;
        ctx.globalAlpha = a;
        const s = p.r * 2;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot + k * 0.6); ctx.scale(1, 1.45);
        ctx.drawImage(puff, -s / 2, -s / 2, s, s);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }

  // ─────────────────────────── МЕНЕДЖЕР ВИДЕО ───────────────────────────
  const VM = {
    recs: [], attached: new Set(), MAX_ATTACHED: 4, paused: false, scheduled: false, stalls: 0,
    schedule() { if (!this.scheduled) { this.scheduled = true; requestAnimationFrame(() => { this.scheduled = false; this.update(); }); } },
    update() {
      const vh = innerHeight;
      let best = null, bestVis = 0;
      const want = new Set();
      for (const c of carousels) {
        const r = c.track.getBoundingClientRect();
        const vis = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / Math.max(1, Math.min(r.height, vh));
        c.near = r.bottom > -vh * 0.5 && r.top < vh * 1.5;
        const act = c.recs[c.active];
        if (!act || act.media?.type !== 'video') continue;
        if (c.near) want.add(act);
        if (vis > bestVis) { bestVis = vis; best = c; }
      }
      const play = new Set();
      if (best && bestVis > 0.5 && !this.paused && autoplayAllowed) {
        const act = best.recs[best.active];
        play.add(act);
        // следующую карточку подгружаем заранее, если сеть позволяет
        const n = best.recs[best.active + 1];
        if (n && n.media?.type === 'video' && netRung > 0) want.add(n);
      }
      for (const r of [...this.attached]) {
        if (!want.has(r) && !play.has(r)) {
          if (this.attached.size > this.MAX_ATTACHED || !r.carousel.near) this.detach(r); else this.pause(r);
        }
      }
      // держим не больше MAX_ATTACHED видео одновременно — телефоны не перегреваются и не перезагружают вкладку
      const order = [...play, ...want];
      for (const r of order) {
        if (r.video) continue;
        if (this.attached.size >= this.MAX_ATTACHED) {
          const victim = [...this.attached].find((x) => !play.has(x) && !want.has(x)) || [...this.attached].find((x) => !play.has(x) && x !== r);
          if (victim) this.detach(victim); else break;
        }
        this.attach(r);
      }
      for (const r of this.attached) { if (play.has(r)) this.play(r); else this.pause(r); }
      for (const r of this.recs) {
        const on = play.has(r) && r.item.steam && !reduceMotion;
        if (on) { if (!r.steam) r.steam = new Steam(r.el.querySelector('.card-media'), r.media.focus); r.steam.start(); }
        else if (r.steam) { r.steam.destroy(); r.steam = null; }
      }
    },
    attach(r) {
      const v = document.createElement('video');
      v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
      v.setAttribute('disablepictureinpicture', ''); v.setAttribute('disableremoteplayback', '');
      v.preload = 'auto';
      const s = srcFor(r.media);
      if (!s) return;
      r.rung = s.rung; r.key = s.key; r.t0 = performance.now(); r.measured = false;
      v.src = s.url;
      v.addEventListener('playing', () => { v.classList.add('playing'); clearTimeout(r.stall); r.el.classList.remove('blocked'); });
      v.addEventListener('progress', () => this.measure(r, v));
      v.addEventListener('waiting', () => {
        clearTimeout(r.stall);
        if (!r.shouldPlay) return;
        r.stall = setTimeout(() => { if (r.video === v && v.readyState < 3) this.downgrade(r); }, 3500);
      });
      v.addEventListener('error', () => { if (v.error && v.error.code === 2) this.downgrade(r); });
      r.el.querySelector('.card-media').appendChild(v);
      r.video = v;
      this.attached.add(r);
    },
    // оценка скорости по реальной загрузке видео: если файл пришёл быстро — повышаем качество
    measure(r, v) {
      if (r.measured || !v.duration || !r.media.bytes || !r.media.bytes[r.key]) return;
      const b = v.buffered;
      if (!b.length || b.end(b.length - 1) < v.duration - 0.2) return;
      r.measured = true;
      const ms = performance.now() - r.t0;
      const kbps = (r.media.bytes[r.key] * 8) / Math.max(ms, 50);
      if (kbps > 14000 && DPR >= 2 && netRung < 2) setRung(netRung + 1);
      else if (kbps > 6000 && netRung < 1) setRung(1);
    },
    downgrade(r) {
      this.stalls++;
      if (r.rung > 0) {
        setRung(Math.min(netRung, r.rung - 1));
        const v = r.video; if (!v) return;
        const s = srcFor(r.media, r.rung - 1);
        if (!s || s.url === v.currentSrc) return;
        const t0 = v.currentTime;
        r.rung = s.rung; r.key = s.key; r.measured = true;
        v.src = s.url;
        v.addEventListener('loadedmetadata', () => { try { v.currentTime = t0 % (v.duration || 1); } catch { /* */ } }, { once: true });
        if (r.shouldPlay) v.play().catch(() => {});
      }
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
  const ICON_PREV = '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>';
  const ICON_NEXT = '<svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>';

  function setFocus(el, media) {
    const f = media && media.focus;
    if (!f) return;
    el.style.setProperty('--fx', Math.round(f.x * 100) + '%');
    el.style.setProperty('--fy', Math.round(f.y * 100) + '%');
  }
  function lazyImg(cls, src, eager, onload) {
    const img = h('img', cls);
    img.alt = ''; img.decoding = 'async'; img.loading = eager ? 'eager' : 'lazy';
    img.addEventListener('load', () => { img.classList.add('loaded'); onload && onload(); }, { once: true });
    img.src = src;
    return img;
  }

  function buildCard(it, idx, opts = {}) {
    const el = h('article', 'dish-card');
    el.dataset.id = it.id;
    el.tabIndex = 0;
    const box = h('div', 'card-media');
    const m = it.media;
    if (m) {
      setFocus(box, m);
      if (m.blur) box.style.backgroundImage = `url("${m.blur}")`;
      const src = m.type === 'video' ? m.poster : m.src;
      if (src) { const img = lazyImg('card-poster', src, opts.eager); img.addEventListener('error', () => img.remove(), { once: true }); box.appendChild(img); }
    } else {
      box.appendChild(h('div', 'card-noimg', '<span class="logo-mark"></span>'));
    }
    el.appendChild(box);
    el.appendChild(h('div', 'card-overlay'));
    el.insertAdjacentHTML('beforeend', `<span class="card-play" aria-hidden="true">${ICON_PLAY}</span>`);
    if (opts.special) bindText(el.appendChild(h('span', 'special-ribbon')), () => (it.label && it.label[lang]) || t('special'));
    if (isStopped(it)) { el.classList.add('is-stopped'); bindText(el.appendChild(h('span', 'stop-pill')), () => t('unavailable')); }

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
    const badge = it.badges && it.badges.find((b) => DATA.badges[b]);
    if (badge) bindText(right.appendChild(h('span', 'card-badge')), () => pick(DATA.badges[badge]));
    const more = h('button', 'card-more', ICON_INFO); more.type = 'button';
    bindAttr(() => more.setAttribute('aria-label', t('details')));
    right.appendChild(more);
    foot.appendChild(right);
    info.appendChild(foot);
    el.appendChild(info);
    bindAttr(() => { sub.hidden = !sub.textContent; });
    bindAttr(() => { ingr.hidden = !ingr.textContent; });
    return el;
  }

  function buildMini(it) {
    const b = h('button', 'mini'); b.type = 'button'; b.dataset.id = it.id;
    if (isStopped(it)) b.classList.add('is-stopped');
    const m = it.media;
    const photo = m && (m.type === 'image' ? (m.srcLow || m.src) : m.poster);
    if (photo) {
      b.classList.add('has-photo');
      const img = lazyImg('mini-photo', photo, false);
      // фото недоступно — карточка аккуратно становится текстовой, без «битой» картинки
      img.addEventListener('error', () => { img.remove(); b.classList.remove('has-photo'); }, { once: true });
      if (m.focus) img.style.objectPosition = `${Math.round(m.focus.x * 100)}% ${Math.round(m.focus.y * 100)}%`;
      b.appendChild(img);
    }
    const body = h('div', 'mini-body');
    bindText(body.appendChild(h('span', 'mini-name')), () => pick(it.name));
    const bot = h('div', 'mini-bottom');
    bindText(bot.appendChild(h('span', 'mini-portion')), () => (isStopped(it) ? t('unavailable') : portion(it.portion)));
    bot.appendChild(h('span', 'mini-price', priceHtml(it)));
    body.appendChild(bot);
    b.appendChild(body);
    b.onclick = () => openDish(it);
    return b;
  }

  // ─────────────────────────── КАРУСЕЛЬ ───────────────────────────
  const carousels = [];
  let swiped = ls.get('qa_swiped') === '1';
  function markSwiped() {
    if (swiped) return;
    swiped = true; ls.set('qa_swiped', '1');
    $$('.swipe-hint').forEach((x) => x.classList.add('gone'));
  }
  class Carousel {
    constructor(wrap, items, opts) {
      this.wrap = wrap; this.active = 0; this.recs = [];
      this.track = h('div', 'carousel-track'); this.track.setAttribute('role', 'list'); this.track.tabIndex = -1;
      wrap.appendChild(this.track);
      items.forEach((it, i) => {
        const el = buildCard(it, i, { special: opts.special, eager: opts.eager && i < 2 });
        this.track.appendChild(el);
        const rec = { el, item: it, media: it.media, video: null, carousel: this, index: i, steam: null };
        this.recs.push(rec); VM.recs.push(rec);
        el.addEventListener('click', (e) => {
          if (this.dragMoved) return;
          const onMore = e.target.closest('.card-more');
          if (i !== this.active && !onMore) { this.go(i); return; }
          if (el.classList.contains('blocked') && rec.video && !onMore) { rec.video.play().catch(() => {}); el.classList.remove('blocked'); return; }
          openDish(it, rec);
        });
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') openDish(it, rec); });
      });
      const n = this.recs.length;
      if (n > 1) {
        this.prev = h('button', 'carousel-arrow prev', ICON_PREV); this.prev.type = 'button';
        this.next = h('button', 'carousel-arrow next', ICON_NEXT); this.next.type = 'button';
        bindAttr(() => { this.prev.setAttribute('aria-label', t('prev')); this.next.setAttribute('aria-label', t('next')); });
        this.prev.onclick = () => { markSwiped(); this.go(this.active - 1); };
        this.next.onclick = () => { markSwiped(); this.go(this.active + 1); };
        wrap.append(this.prev, this.next);
      }
      this.dots = h('div', 'carousel-dots');
      if (n > 1 && n <= 8) for (let i = 0; i < n; i++) this.dots.appendChild(h('span', 'dot'));
      else if (n > 8) { this.count = h('span', 'carousel-count'); this.bar = h('span', 'carousel-progress', '<i></i>'); this.dots.append(this.count, this.bar); }
      wrap.appendChild(this.dots);
      this.bind();
      this.setActive(0, true);
    }
    bind() {
      const tr = this.track;
      let raf = 0, startLeft = 0;
      tr.addEventListener('touchstart', () => { startLeft = tr.scrollLeft; }, { passive: true });
      tr.addEventListener('touchend', () => { if (Math.abs(tr.scrollLeft - startLeft) > 20) markSwiped(); }, { passive: true });
      tr.addEventListener('scroll', () => {
        if (raf) return;
        raf = requestAnimationFrame(() => { raf = 0; const i = this.nearest(); if (i !== this.active) this.setActive(i); });
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
          tr.classList.remove('dragging'); markSwiped();
          this.go(this.nearest());
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
    go(i, instant) {
      i = Math.max(0, Math.min(this.recs.length - 1, i));
      const el = this.recs[i].el;
      const left = el.offsetLeft - (this.track.clientWidth - el.offsetWidth) / 2;
      this.track.scrollTo({ left, behavior: instant || reduceMotion ? 'auto' : 'smooth' });
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
    // лёгкий «кивок» карусели при первом показе — сразу понятно, что её можно листать
    nudge() {
      if (swiped || reduceMotion || this.recs.length < 2 || this.nudged) return;
      this.nudged = true;
      this.track.scrollTo({ left: 70, behavior: 'smooth' });
      setTimeout(() => { if (this.active === 0) this.track.scrollTo({ left: 0, behavior: 'smooth' }); }, 650);
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
  const visibleList = (list) => (DIM ? [...list.filter((x) => !isStopped(x)), ...list.filter(isStopped)] : list.filter((x) => !isStopped(x)));
  let hintShown = false;
  const revealEls = [];

  function addSection({ id, title, sub, cards, rail, special, eager }) {
    const sec = h('section', 'menu-section' + (special ? ' section-special' : '') + (!cards.length ? ' compact-only' : ''));
    sec.id = 'sec-' + id;
    const head = h('div', 'section-header');
    const no = h('span', 'section-number', special ? '★' : String(sections.filter((s) => !s.special).length + 1).padStart(2, '0'));
    head.append(no, bindText(h('h2', 'section-title'), title), bindText(h('span', 'section-sub'), sub));
    sec.appendChild(head);
    revealEls.push(head);
    if (cards.length) {
      if (!hintShown && !swiped && cards.length > 1) {
        hintShown = true;
        const hint = h('div', 'swipe-hint');
        hint.append(bindText(h('span'), () => t('swipe')), h('i'));
        sec.appendChild(hint);
      }
      const wrap = h('div', 'carousel');
      sec.appendChild(wrap);
      const c = new Carousel(wrap, cards, { special, eager });
      c.section = sec;
      carousels.push(c);
      revealEls.push(wrap);
    }
    if (rail.length) {
      if (cards.length) sec.appendChild(bindText(h('div', 'rail-label'), () => t('also')));
      const r = h('div', 'rail');
      rail.forEach((it) => r.appendChild(buildMini(it)));
      sec.appendChild(r);
      revealEls.push(r);
    }
    menuEl.appendChild(sec);
    const pill = h('button', 'cat-pill' + (special ? ' special' : '')); pill.type = 'button';
    bindText(pill, () => (special ? '★ ' : '') + title());
    pill.onclick = () => scrollToSection(sec);
    navTrack.appendChild(pill);
    sections.push({ sec, pill, special });
  }

  function build() {
    const specials = (DATA.specials || []).filter(specialLive);
    if (specials.length) {
      addSection({
        id: 'special', special: true, eager: true,
        title: () => pick(S.specialsTitle) || t('special'),
        sub: () => t('items')(specials.length),
        cards: specials.filter((s) => s.media), rail: specials.filter((s) => !s.media),
      });
    }
    let first = !specials.length;
    for (const c of DATA.categories.filter((x) => x.section === 'kitchen')) {
      const list = visibleList(itemsByCat.get(c.id) || []);
      const cards = list.filter((x) => isBig(x, c));
      const rail = c.rail === false ? [] : list.filter((x) => !cards.includes(x));
      if (!cards.length && !rail.length) continue; // пустых разделов и пустых мест не бывает
      addSection({ id: c.id, title: () => pick(c.name), sub: () => t('items')(cards.length + rail.length), cards, rail, eager: first && cards.length > 0 });
      if (cards.length) first = false;
    }
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
    bindText(lines, () => [esc(pick(S.address)), S.hours ? `${esc(t('hours'))} · ${esc(S.hours)}` : ''].filter(Boolean).join('<br>'), 'html');
    const links = h('div', 'footer-links');
    if (S.whatsapp) { const a = h('a', 'footer-link primary'); a.href = `https://wa.me/${S.whatsapp}`; a.target = '_blank'; a.rel = 'noopener'; bindText(a, () => t('book')); links.appendChild(a); }
    if (S.phone) { const a = h('a', 'footer-link'); a.href = 'tel:' + S.phone.replace(/[^\d+]/g, ''); bindText(a, () => `${t('call')} · ${S.phone}`); links.appendChild(a); }
    if (S.instagram) { const a = h('a', 'footer-link'); a.href = S.instagram; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Instagram'; links.appendChild(a); }
    f.append(lines, links);
  }

  // ─────────────────────────── НАВИГАЦИЯ ───────────────────────────
  const header = $('#site-header');
  const nav = $('#cat-nav');
  const hero = $('.hero');
  function measureHeader() { root.style.setProperty('--header-h', header.offsetHeight + 'px'); }
  function scrollToSection(sec) {
    const y = sec.getBoundingClientRect().top + scrollY - header.offsetHeight - nav.offsetHeight + 12;
    scrollTo({ top: Math.max(0, y), behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  let activePill = null, lastNavScroll = 0;
  function onScroll() {
    header.classList.toggle('dark', scrollY > 30);
    nav.classList.toggle('show', scrollY > hero.offsetHeight - header.offsetHeight - 20);
    const line = innerHeight * 0.4;
    let cur = null;
    for (const s of sections) { if (s.sec.getBoundingClientRect().top <= line) cur = s; }
    if (cur !== activePill) {
      if (activePill) activePill.pill.classList.remove('active');
      activePill = cur;
      if (cur) {
        cur.pill.classList.add('active');
        const now = performance.now();
        const p = cur.pill;
        navTrack.scrollTo({ left: p.offsetLeft - navTrack.clientWidth / 2 + p.offsetWidth / 2, behavior: now - lastNavScroll > 250 ? 'smooth' : 'auto' });
        lastNavScroll = now;
      }
    }
    VM.schedule();
  }

  // ─────────────────────────── КАРТОЧКА БЛЮДА ───────────────────────────
  const sheet = $('#dish-sheet');
  const panel = $('#dish-sheet-panel');
  let sheetVideo = null, sheetSteam = null, sheetOpen = false;
  function openDish(it, rec) {
    const m = it.media;
    const badges = (it.badges || []).filter((b) => DATA.badges[b]).map((b) => `<span class="card-badge">${esc(pick(DATA.badges[b]))}</span>`).join('');
    const catName = pick((DATA.categories.find((c) => c.id === it.cat) || {}).name) || (it.label && it.label[lang]) || t('special');
    const desc = pick(it.desc), ingr = pick(it.ingr);
    const portrait = m && (m.type === 'video' || isPortraitPhoto(m));
    panel.innerHTML = `
      <div class="sheet-grip" aria-hidden="true"></div>
      <button class="sheet-close" type="button" data-close aria-label="${esc(t('close'))}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      ${m ? `<div class="sheet-media${portrait ? '' : ' is-photo'}"></div>` : ''}
      <div class="sheet-body">
        <div class="sheet-kicker">${esc(catName)}</div>
        <h3 class="sheet-title">${esc(pick(it.name))}</h3>
        <div class="sheet-meta"><span class="sheet-price">${priceHtml(it)}</span>${it.portion ? `<span class="sheet-portion">${esc(portion(it.portion))}</span>` : ''}${isStopped(it) ? `<span class="card-badge">${esc(t('unavailable'))}</span>` : ''}</div>
        ${badges ? `<div class="sheet-badges">${badges}</div>` : ''}
        ${desc ? `<p class="sheet-desc">${esc(desc)}</p>` : ''}
        ${ingr ? `<div class="sheet-h">${esc(t('ingredients'))}</div><p class="sheet-ingr">${esc(ingr)}</p>` : ''}
        ${!desc && !ingr ? `<p class="sheet-empty">${esc(t('noDesc'))}</p>` : ''}
      </div>`;
    if (!m) panel.querySelector('.sheet-close').style.top = '14px';
    const box = $('.sheet-media', panel);
    if (m && box) {
      setFocus(box, m);
      if (m.blur) box.style.backgroundImage = `url("${m.blur}")`;
      const still = m.type === 'video' ? m.poster : m.src;
      if (still) box.appendChild(lazyImg('', still, true));
      if (m.type === 'video') {
        const v = document.createElement('video');
        v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
        const s = rec && rec.video ? { url: rec.video.currentSrc } : srcFor(m);
        v.src = s.url;
        if (rec && rec.video) { const t0 = rec.video.currentTime; v.addEventListener('loadedmetadata', () => { try { v.currentTime = t0; } catch { /* */ } }, { once: true }); }
        v.addEventListener('playing', () => v.classList.add('playing'), { once: true });
        box.appendChild(v);
        v.play().catch(() => {});
        sheetVideo = v;
        if (it.steam && !reduceMotion) requestAnimationFrame(() => { sheetSteam = new Steam(box, m.focus); sheetSteam.start(); });
      }
    }
    sheet.hidden = false;
    lockScroll(true);
    VM.pauseAll(true);
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('open')));
    pushState('dish');
    sheetOpen = true;
  }
  function closeDish(fromPop) {
    if (!sheetOpen) return;
    sheetOpen = false;
    sheet.classList.remove('open');
    if (sheetSteam) { sheetSteam.destroy(); sheetSteam = null; }
    const v = sheetVideo; sheetVideo = null;
    setTimeout(() => {
      if (sheetOpen) return;
      if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
      sheet.hidden = true; panel.innerHTML = ''; panel.style.transform = '';
    }, 560);
    if (!barOpen) lockScroll(false);
    VM.pauseAll(barOpen);
    if (!fromPop) popState();
  }
  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeDish(); });
  // свайп вниз закрывает карточку (как в iOS)
  (() => {
    let y0 = null, dy = 0;
    panel.addEventListener('touchstart', (e) => { if (panel.scrollTop <= 0 && innerWidth < 900) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
    panel.addEventListener('touchmove', (e) => {
      if (y0 == null) return;
      dy = e.touches[0].clientY - y0;
      if (dy > 0 && panel.scrollTop <= 0) { sheet.classList.add('dragging'); panel.style.transform = `translateY(${dy}px)`; }
    }, { passive: true });
    panel.addEventListener('touchend', () => {
      if (y0 == null) return;
      y0 = null; sheet.classList.remove('dragging'); panel.style.transform = '';
      if (dy > 110) closeDish();
    });
  })();

  // ─────────────────────────── БАР ───────────────────────────
  // линейные иллюстрации в стиле логотипа (тонкая линия, скруглённые концы)
  const ART = {
    wine: '<path d="M30 6h12v24c0 8 12 12 12 26v54a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V56c0-14 12-18 12-26zM30 14h12M18 66h36M18 92h36"/><path d="M62 58h26c0 16-5 25-13 25s-13-9-13-25zM64 67h22M75 83v25M65 108h20"/>',
    chacha: '<path d="M33 10h14v16c0 6 19 14 19 38 0 27-11 44-26 44S14 91 14 64c0-24 19-32 19-38zM35 4h10v6M16 72c11 5 37 5 48 0"/><path d="M72 84h18l-3 24H75zM73 92h16"/>',
    brandy: '<path d="M24 28h52c7 20 6 46-11 56-9 5-21 5-30 0-17-10-18-36-11-56z"/><path d="M19 62c21 7 41 7 62 0M50 88v20M36 110h28"/><path d="M30 38c-2 8-2 16 0 22"/>',
    vodka: '<path d="M36 6h12v26c0 4 8 8 8 16v62a4 4 0 0 1-4 4H32a4 4 0 0 1-4-4V48c0-8 8-12 8-16zM36 14h12M28 64h28M28 86h28"/><path d="M66 86h20l-2 22H68zM67 94h18"/>',
    spirits: '<path d="M20 42h60l-5 64a4 4 0 0 1-4 4H29a4 4 0 0 1-4-4z"/><path d="M23 72h54"/><path d="M34 56l14-3 3 14-14 3zM55 60l12 2-2 12-12-2z"/><path d="M72 40c6-12 18-12 22-2"/>',
    beer: '<path d="M20 38h46v66a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6z"/><path d="M66 52h8a10 10 0 0 1 10 10v18a10 10 0 0 1-10 10h-8"/><path d="M18 38c-1-10 10-15 16-10 4-9 18-9 22-1 7-5 17 0 14 11M32 52v46M43 52v46M54 52v46"/>',
    cocktails: '<path d="M16 34h66c-2 19-15 29-33 29S18 53 16 34zM21 43h56M49 63v40M35 105h28"/><circle cx="78" cy="30" r="11"/><path d="M78 19v22M67 30h22M70 22l16 16M86 22 70 38"/><path d="M30 30c-6-10 2-19 11-17 0 9-4 15-11 17z"/>',
    coffee: '<path d="M24 54h46v20c0 14-10 23-23 23S24 88 24 74z"/><path d="M70 60h6a8 8 0 0 1 0 16h-7M12 102c6 7 70 7 76 0"/><path d="M38 44c-6-8 6-12 0-22M50 44c-6-8 6-12 0-22M62 44c-6-8 6-12 0-22"/>',
    soft: '<path d="M38 6h12v18c0 4 6 6 6 14v68a4 4 0 0 1-4 4H32a4 4 0 0 1-4-4V38c0-8 6-10 6-14zM38 13h12M28 58h28"/><circle cx="37" cy="76" r="2"/><circle cx="45" cy="88" r="2.5"/><circle cx="38" cy="98" r="1.6"/><circle cx="76" cy="94" r="13"/><path d="M76 81v26M63 94h26M67 85l18 18M85 85 67 103"/>',
  };
  const bar = $('#bar-sheet');
  let barBuilt = false, barOpen = false;
  const barPills = [];
  function buildBar() {
    barBuilt = true;
    const body = $('#bar-body'), barNav = $('#bar-nav');
    const barCats = DATA.categories.filter((c) => c.section === 'bar');
    let n = 0;
    for (const g of DATA.groups) {
      const cats = barCats.filter((c) => c.group === g.id).map((c) => ({ c, list: visibleList(itemsByCat.get(c.id) || []) })).filter((x) => x.list.length);
      if (!cats.length) continue;
      n++;
      const sec = h('section', 'bar-group'); sec.id = 'bar-' + g.id;
      const head = h('div', 'bar-group-head');
      const tt = h('div');
      tt.appendChild(h('span', 'bar-group-no', String(n).padStart(2, '0')));
      bindText(tt.appendChild(h('h3', 'bar-group-title')), () => pick(g.name));
      head.appendChild(tt);
      if (g.artUrl) { const img = lazyImg('bar-art-img', g.artUrl, false); head.appendChild(img); }
      else if (ART[g.art]) head.appendChild(h('span', 'bar-icon', `<svg viewBox="0 0 100 120" aria-hidden="true">${ART[g.art]}</svg>`));
      sec.appendChild(head);
      for (const { c, list } of cats) {
        if (cats.length > 1 || pick(c.name) !== pick(g.name)) sec.appendChild(bindText(h('div', 'bar-sub-title'), () => pick(c.name)));
        const ul = h('ul', 'bar-list');
        // одинаковые названия с разным объёмом — в одну строку: «Finlandia  50 мл 12 ₾ · 0,5 л 75 ₾ · 1 л 135 ₾»
        const rows = [];
        for (const it of list) {
          const key = JSON.stringify(it.name);
          const row = rows.find((r) => r.key === key);
          if (row) row.items.push(it); else rows.push({ key, items: [it] });
        }
        for (const r of rows) {
          const li = h('li', 'bar-row' + (r.items.length > 1 ? ' multi' : ''));
          if (r.items.every(isStopped)) li.classList.add('is-stopped');
          li.appendChild(bindText(h('span', 'bar-name'), () => pick(r.items[0].name)));
          li.appendChild(bindText(h('span', 'bar-prices'), () => r.items.map((it) => `<span class="bar-price${isStopped(it) && r.items.length > 1 ? ' is-stopped' : ''}">${it.portion ? `<small>${esc(portion(it.portion))}</small>` : ''}<b>${money(it.price)}</b></span>`).join(''), 'html'));
          ul.appendChild(li);
        }
        sec.appendChild(ul);
      }
      body.appendChild(sec);
      const pill = h('button', 'bar-pill'); pill.type = 'button';
      bindText(pill, () => pick(g.name));
      pill.onclick = () => { $('#bar-scroll').scrollTo({ top: sec.offsetTop - barNav.offsetHeight + 2, behavior: reduceMotion ? 'auto' : 'smooth' }); };
      barNav.appendChild(pill);
      barPills.push({ sec, pill });
    }
    applyTexts();
    const sc = $('#bar-scroll');
    let raf = 0, cur = null;
    sc.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        let now = null;
        for (const p of barPills) if (p.sec.getBoundingClientRect().top < innerHeight * 0.35) now = p;
        if (now === cur) return;
        cur = now;
        barPills.forEach((p) => p.pill.classList.toggle('active', p === cur));
        if (cur) barNav.scrollTo({ left: cur.pill.offsetLeft - barNav.clientWidth / 2 + cur.pill.offsetWidth / 2, behavior: 'smooth' });
      });
    }, { passive: true });
  }
  function openBar() {
    if (!barBuilt) buildBar();
    bar.hidden = false;
    lockScroll(true);
    VM.pauseAll(true);
    requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.add('open')));
    barOpen = true;
    pushState('bar');
  }
  function closeBar(fromPop) {
    if (!barOpen) return;
    barOpen = false;
    bar.classList.remove('open');
    setTimeout(() => { if (!barOpen) bar.hidden = true; }, 620);
    lockScroll(false);
    VM.pauseAll(false);
    if (!fromPop) popState();
  }
  $('#bar-open').addEventListener('click', openBar);
  $('#bar-close').addEventListener('click', () => closeBar());

  // «Назад» на телефоне закрывает окно, а не уходит со страницы
  let pushed = 0, ignorePop = 0;
  function pushState(kind) { history.pushState({ qa: kind }, ''); pushed++; }
  function popState() { if (pushed > 0) { pushed--; ignorePop++; history.back(); } }
  addEventListener('popstate', () => {
    if (ignorePop) { ignorePop--; return; }
    if (pushed > 0) pushed--;
    if (sheetOpen) closeDish(true); else if (barOpen) closeBar(true);
  });
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (sheetOpen) closeDish(); else if (barOpen) closeBar();
  });
  function lockScroll(on) { root.classList.toggle('lock', on); }

  // ─────────────────────────── HERO-ВИДЕО ───────────────────────────
  function startHero() {
    const v = $('.hero-video-bg');
    if (!v || !autoplayAllowed) return;
    v.src = v.dataset.src;
    v.addEventListener('playing', () => v.classList.add('on'), { once: true });
    v.play().catch(() => {});
    new IntersectionObserver(([e]) => { if (e.isIntersecting && !document.hidden) v.play().catch(() => {}); else v.pause(); }).observe(v);
  }

  // ─────────────────────────── СТАРТ ───────────────────────────
  build();
  applyTexts();
  measureHeader();

  // плавное появление блоков
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((ents) => {
      for (const e of ents) if (e.isIntersecting) {
        e.target.classList.add('in'); io.unobserve(e.target);
        const c = carousels.find((x) => x.wrap === e.target);
        if (c && c === carousels[0]) setTimeout(() => c.nudge(), 700);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    revealEls.forEach((el) => { el.classList.add('reveal'); io.observe(el); });
  }

  $$('.lang-btn').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang; ls.set('qa_lang', lang);
    applyTexts();
  }));
  $('#theme-btn').addEventListener('click', () => setTheme(theme() === 'dark' ? 'light' : 'dark', true));
  $('.scroll-invite').addEventListener('click', (e) => { e.preventDefault(); if (sections[0]) scrollToSection(sections[0].sec); });
  addEventListener('scroll', onScroll, { passive: true });

  // При масштабировании пальцами и появлении/скрытии адресной строки ширина макета не меняется —
  // в этих случаях ничего не перестраиваем (раньше это давало «перезагрузку» и прыжки).
  let layoutW = root.clientWidth;
  let rt = 0;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      measureHeader();
      const w = root.clientWidth;
      if (w === layoutW) { VM.schedule(); return; }
      layoutW = w;
      for (const c of carousels) c.go(c.active, true);
      for (const r of VM.recs) if (r.steam) r.steam.resize();
      VM.schedule();
    }, 150);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { for (const r of VM.attached) r.video && r.video.pause(); for (const r of VM.recs) r.steam && r.steam.stop(); }
    else VM.schedule();
  });
  // страница восстановлена из кэша «назад/вперёд» — просто продолжаем
  addEventListener('pageshow', (e) => { if (e.persisted) VM.schedule(); });
  onScroll();
  (window.requestIdleCallback || ((f) => setTimeout(f, 300)))(startHero);
  if (location.hash === '#bar') openBar();
})();
