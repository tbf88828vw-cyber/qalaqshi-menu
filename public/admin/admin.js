// Qalaqshi — админ-панель. Без сборки и фреймворков, работает с телефона.
// Видео и фото оптимизируются прямо в браузере администратора (WebCodecs + Mediabunny),
// затем загружаются в хранилище напрямую — сервер ничего тяжёлого не делает.

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LANGS = [['ru', 'RU'], ['en', 'EN'], ['ka', 'GE']];
const BADGES = {
  hit: 'Хит', new: 'Новинка', chef: 'Выбор шефа', house: 'Рецепт дома', spicy: 'Острое', veg: 'Вегетарианское', vegan: 'Веганское', lent: 'Постное',
};
const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const ORDER_DAYS = [1, 2, 3, 4, 5, 6, 0];

const I = {
  stop: '<path d="M5 12h14"/><circle cx="12" cy="12" r="9"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  dish: '<circle cx="12" cy="13" r="7"/><path d="M3 13h18M12 4v2"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
  photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  logout: '<path d="M15 4h4v16h-4M10 16l4-4-4-4M14 12H4"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
};
const icon = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24">${I[n]}</svg>`;

// ───────────────────────── СОСТОЯНИЕ ─────────────────────────
const state = {
  doc: null, role: null, status: {},
  tab: localStorage.getItem('qa_tab') || 'stop',
  stopFilter: 'all', stopQuery: '',
  menuSection: 'kitchen', catId: null,
};
const isOwner = () => state.role === 'owner';
const nm = (o) => (o && (o.ru || o.en || o.ka)) || '—';
const money = (n) => (n == null || n === '' ? '' : (Number.isInteger(+n) ? String(+n) : (+n).toFixed(2)) + ' ₾');
const catById = (id) => state.doc.categories.find((c) => c.id === id);
const itemById = (id) => state.doc.items.find((x) => x.id === id);
// где позиция окажется на сайте — та же логика, что и на самом сайте
const isPortrait = (m) => m && m.type === 'image' && m.w && m.h && m.h / m.w >= 1.25;
function placeOf(it) {
  const c = catById(it.cat);
  if (!c || c.section === 'bar') return 'list';
  if (it.place === 'big') return 'big';
  if (it.place === 'compact') return 'compact';
  if (c.display === 'compact') return 'compact';
  return it.media && (it.media.type === 'video' || isPortrait(it.media)) ? 'big' : 'compact';
}
const stopped = (it) => !!it.stop && (!it.stop.until || Date.parse(it.stop.until) > Date.now());

// ───────────────────────── API ─────────────────────────
async function api(action, body, method) {
  const r = await fetch('/api/admin/' + action, {
    method: method || (body ? 'POST' : 'GET'),
    headers: body ? { 'content-type': 'application/json', 'x-qalaqshi': '1' } : { 'x-qalaqshi': '1' },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  let j = {};
  try { j = await r.json(); } catch { /* */ }
  if (r.status === 401 && action !== 'login') { state.role = null; renderLogin(); throw new Error('Сессия истекла — войдите снова'); }
  if (!r.ok) throw new Error(j.error || ('Ошибка ' + r.status));
  return j;
}

let opBusy = Promise.resolve();
async function doOp(op, { quiet = false } = {}) {
  // операции выполняются по очереди — даже при быстрых нажатиях порядок сохраняется
  const run = async () => {
    const res = await api('op', op);
    const before = state.doc?.rev;
    state.doc = res.doc;
    if (before && res.doc.rev > before + 1) toast('Меню обновлено с другого устройства', 'info');
    if (!quiet && res.note) toast(res.note, 'ok');
    return res;
  };
  const p = opBusy.then(run, run);
  opBusy = p.catch(() => {});
  return p;
}

// ───────────────────────── UI-УТИЛИТЫ ─────────────────────────
function toast(msg, type = '', action) {
  const el = document.createElement('div');
  el.className = 'toast ' + (type === 'err' ? 'err' : type === 'ok' ? 'ok' : '');
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action.label)}</button>` : ''}`;
  if (action) el.querySelector('button').onclick = () => { action.fn(); el.remove(); };
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), type === 'err' ? 6000 : action ? 6000 : 2600);
}

function openLayer(html, { onClose, cls = 'sheet' } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-backdrop"></div><div class="${cls}">${html}</div>`;
  $('#layer').appendChild(wrap);
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
  const close = () => {
    wrap.classList.remove('open');
    setTimeout(() => wrap.remove(), 320);
    document.removeEventListener('keydown', onKey);
    onClose && onClose();
  };
  const onKey = (e) => { if (e.key === 'Escape' && wrap === $('#layer').lastElementChild) wrap._tryClose(); };
  document.addEventListener('keydown', onKey);
  wrap._tryClose = close;
  wrap.querySelector('.sheet-backdrop').onclick = () => wrap._tryClose();
  return { wrap, close, el: wrap.querySelector('.' + cls.split(' ')[0]) };
}

/** Меню действий в стиле iOS. options: [{label, value, sub, danger}] */
function choose(title, options, extraHtml = '') {
  return new Promise((resolve) => {
    let done = false;
    const html = `<div class="action-group">
        ${title ? `<div class="action-title">${esc(title)}</div>` : ''}
        ${extraHtml}
        ${options.map((o, i) => `<button class="action-btn ${o.danger ? 'danger' : ''}" data-i="${i}">${esc(o.label)}${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</button>`).join('')}
      </div>
      <button class="action-btn cancel" data-cancel>Отмена</button>`;
    const L = openLayer(html, { cls: 'action', onClose: () => { if (!done) resolve(null); } });
    L.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i],[data-cancel]');
      if (!b) return;
      done = true;
      if (b.dataset.cancel !== undefined) resolve(null);
      else resolve({ value: options[+b.dataset.i].value, root: L.el });
      L.close();
    });
  });
}
const confirmBox = async (title, label = 'Удалить', danger = true) => !!(await choose(title, [{ label, value: true, danger }]));

function thumbHtml(m) {
  if (!m) return `<div class="thumb">${icon('dish')}</div>`;
  const src = m.type === 'video' ? m.poster : m.src;
  if (!src) return `<div class="thumb">${icon(m.type === 'video' ? 'video' : 'photo')}</div>`;
  return `<div class="thumb ${m.type === 'video' ? 'video' : ''}"><img src="${esc(src)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover"></div>`;
}
function stopLabel(it) {
  if (!stopped(it)) return '';
  if (!it.stop.until) return 'на стопе';
  const d = new Date(it.stop.until);
  const same = d.toDateString() === new Date(Date.now() + 864e5).toDateString() || d.toDateString() === new Date().toDateString();
  return 'стоп до ' + (same ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) + (d.getDate() !== new Date().getDate() ? ' завтра' : '') : d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }));
}

// ───────────────────────── ВХОД ─────────────────────────
function renderLogin(msg = '') {
  $('#app').innerHTML = `
    <div class="login"><form class="login-card" autocomplete="on">
      <img class="login-logo" src="/assets/logo.svg" alt="Qalaqshi">
      <h1>Админ-панель</h1>
      <p>Управление меню ресторана</p>
      <input class="input" type="password" name="password" autocomplete="current-password" placeholder="Пароль" required autofocus>
      <button class="btn" type="submit">Войти</button>
      <div class="login-err">${esc(msg)}</div>
    </form></div>`;
  $('.login-card').onsubmit = async (e) => {
    e.preventDefault();
    const btn = $('.login-card .btn');
    btn.disabled = true;
    try {
      const r = await api('login', { password: e.target.password.value });
      state.role = r.role;
      await loadAll();
    } catch (err) { $('.login-err').textContent = err.message; btn.disabled = false; }
  };
}

async function loadAll() {
  const r = await api('menu');
  state.doc = r.doc; state.role = r.role; state.status = r.status; state.fonts = r.fonts;
  if (!isOwner()) state.tab = 'stop';
  renderShell();
}

// ───────────────────────── КАРКАС ─────────────────────────
const TABS = [
  ['stop', 'Стоп-лист', 'stop'],
  ['menu', 'Меню', 'menu'],
  ['specials', 'Спец', 'star'],
  ['settings', 'Настройки', 'gear'],
];
function renderShell() {
  const tabs = TABS.filter(([id]) => isOwner() || id === 'stop');
  const stopCount = state.doc.items.filter(stopped).length;
  const tabBtn = ([id, label, ic]) => `<button class="tab ${state.tab === id ? 'active' : ''}" data-tab="${id}">${icon(ic)}<span>${label}</span>${id === 'stop' && stopCount ? `<span class="count">${stopCount}</span>` : ''}</button>`;
  $('#app').innerHTML = `
    <div class="shell">
      <aside class="side">
        <div class="side-brand"><img src="/assets/logo.svg" alt="Qalaqshi"><span>админ</span></div>
        ${tabs.map(tabBtn).join('')}
        <div class="side-foot">
          <a class="tab" href="/?fresh=1" target="_blank">${icon('ext')}<span>Открыть сайт</span></a>
          <button class="tab" data-logout>${icon('logout')}<span>Выйти</span></button>
        </div>
      </aside>
      <div class="main"><div class="topbar" id="topbar"></div><div class="content" id="view"></div></div>
      <nav class="bottombar">${tabs.map(tabBtn).join('')}</nav>
    </div>`;
  $$('[data-tab]').forEach((b) => (b.onclick = () => { state.tab = b.dataset.tab; state.catId = null; localStorage.setItem('qa_tab', state.tab); renderShell(); scrollTo(0, 0); }));
  $('[data-logout]').onclick = logout;
  renderView();
}
async function logout() { await api('logout', {}).catch(() => {}); state.role = null; renderLogin(); }

function setTop(title, { back, right = '' } = {}) {
  $('#topbar').innerHTML = `${back ? `<button class="back" data-back>${icon('back')}<span>${esc(back)}</span></button>` : ''}<h1>${esc(title)}</h1>${right}`;
}

function renderView() {
  const v = $('#view');
  if (!v) return;
  const warn = storageBanner();
  if (state.tab === 'stop') renderStop(v, warn);
  else if (state.tab === 'menu') state.catId ? renderCategory(v) : renderMenu(v, warn);
  else if (state.tab === 'specials') renderSpecials(v, warn);
  else renderSettings(v, warn);
  // обновляем счётчик стоп-листа без перерисовки всего каркаса
  const n = state.doc.items.filter(stopped).length;
  $$('[data-tab="stop"]').forEach((b) => { let c = b.querySelector('.count'); if (n) { if (!c) { c = document.createElement('span'); c.className = 'count'; b.appendChild(c); } c.textContent = n; } else c?.remove(); });
}
function storageBanner() {
  const s = state.status;
  if (!s.vercel) return `<div class="banner info"><div><b>Локальный режим</b>Изменения сохраняются на этом компьютере. На Vercel подключите хранилища (см. инструкцию).</div></div>`;
  const miss = [];
  if (!s.redis) miss.push('базу данных (Upstash Redis)');
  if (!s.blob) miss.push('файловое хранилище (Vercel Blob)');
  if (!miss.length) return '';
  return `<div class="banner"><div><b>Не подключено: ${miss.join(' и ')}</b>Откройте проект в Vercel → Storage и подключите. Без этого изменения не сохранятся.</div></div>`;
}

// ───────────────────────── СТОП-ЛИСТ ─────────────────────────
function renderStop(v, warn) {
  setTop('Стоп-лист', { right: `<a class="btn small secondary" href="/?fresh=1" target="_blank">Сайт ${icon('ext')}</a>` });
  const q = state.stopQuery.trim().toLowerCase();
  const f = state.stopFilter;
  const stopCount = state.doc.items.filter(stopped).length;
  const match = (it) => !q || ['ru', 'en', 'ka'].some((l) => (it.name[l] || '').toLowerCase().includes(q));
  const catsIn = state.doc.categories.filter((c) => f === 'all' || f === 'stopped' || c.section === f);
  let html = warn + `
    <div class="search">${icon('search')}<input class="input" id="stop-q" type="search" placeholder="Найти блюдо или напиток" value="${esc(state.stopQuery)}" autocomplete="off"></div>
    <div class="seg" id="stop-seg">
      ${[['all', 'Все'], ['stopped', `На стопе${stopCount ? ' · ' + stopCount : ''}`], ['kitchen', 'Кухня'], ['bar', 'Бар']].map(([k, l]) => `<button data-f="${k}" class="${f === k ? 'active' : ''}">${l}</button>`).join('')}
    </div>`;
  let any = false;
  for (const c of catsIn) {
    const items = state.doc.items.filter((it) => it.cat === c.id && match(it) && (f !== 'stopped' || stopped(it)));
    if (!items.length) continue;
    any = true;
    html += `<div class="group-title">${esc(nm(c.name))}</div><div class="list">`;
    for (const it of items) {
      const off = stopped(it);
      html += `<div class="row ${off ? 'off' : ''}" data-id="${it.id}">
        ${thumbHtml(it.media)}
        <div class="row-main"><div class="row-title">${esc(nm(it.name))}</div>
          <div class="row-sub"><span class="row-price">${money(it.price)}</span>${it.portion ? `<span>· ${esc(it.portion)}</span>` : ''}${off ? `<span class="tag stop">${esc(stopLabel(it))}</span>` : ''}${it.hidden ? '<span class="tag hidden">скрыто</span>' : ''}</div></div>
        <label class="switch" title="В наличии"><input type="checkbox" ${off ? '' : 'checked'} data-stop="${it.id}"><span></span></label>
      </div>`;
    }
    html += '</div>';
  }
  if (!any) html += `<div class="empty">${f === 'stopped' ? 'Всё в наличии — стоп-лист пуст 👌' : 'Ничего не найдено'}</div>`;
  v.innerHTML = html;
  const qi = $('#stop-q');
  qi.oninput = () => { state.stopQuery = qi.value; const pos = qi.selectionStart; renderStop(v, warn); const n = $('#stop-q'); n.focus(); n.setSelectionRange(pos, pos); };
  $$('#stop-seg button').forEach((b) => (b.onclick = () => { state.stopFilter = b.dataset.f; renderStop(v, warn); }));
  $$('[data-stop]', v).forEach((inp) => (inp.onchange = () => toggleStop(inp.dataset.stop, inp)));
  if (isOwner()) $$('.row .row-main', v).forEach((m) => { m.style.cursor = 'pointer'; m.onclick = () => openItemEditor(m.closest('.row').dataset.id); });
}

async function toggleStop(id, inp) {
  const it = itemById(id);
  if (inp.checked) {
    try { await doOp({ type: 'item.stop', id, mode: 'off' }); } catch (e) { inp.checked = false; toast(e.message, 'err'); }
    renderView();
    return;
  }
  const pick = await choose(`«${nm(it.name)}» — поставить на стоп`, [
    { label: 'До утра', sub: 'Автоматически вернётся в 06:00', value: 'day' },
    { label: 'Пока не верну вручную', value: 'forever' },
    { label: 'До даты и времени…', value: 'until' },
  ]);
  if (!pick) { inp.checked = true; return; }
  let op = { type: 'item.stop', id, mode: pick.value };
  if (pick.value === 'until') {
    const d = await askDateTime();
    if (!d) { inp.checked = true; return; }
    op.until = d;
  }
  try { await doOp(op); } catch (e) { inp.checked = true; toast(e.message, 'err'); }
  renderView();
}
function askDateTime() {
  return new Promise((resolve) => {
    const def = new Date(Date.now() + 864e5); def.setHours(12, 0, 0, 0);
    const local = new Date(def.getTime() - def.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    let done = false;
    const L = openLayer(`<div class="action-group"><div class="action-title">Вернуть в меню</div>
      <div class="action-extra"><input class="input" type="datetime-local" id="dt" value="${local}"></div>
      <button class="action-btn" data-ok>Готово</button></div><button class="action-btn cancel" data-cancel>Отмена</button>`,
    { cls: 'action', onClose: () => { if (!done) resolve(null); } });
    L.el.querySelector('[data-ok]').onclick = () => { done = true; const val = $('#dt', L.el).value; resolve(val ? new Date(val).toISOString() : null); L.close(); };
    L.el.querySelector('[data-cancel]').onclick = () => { done = true; resolve(null); L.close(); };
  });
}

// ───────────────────────── МЕНЮ: КАТЕГОРИИ ─────────────────────────
function renderMenu(v, warn) {
  setTop('Меню');
  const sec = state.menuSection;
  const cats = state.doc.categories.filter((c) => c.section === sec);
  const total = state.doc.items.length;
  const withVideo = state.doc.items.filter((x) => x.media?.type === 'video').length;
  const noDesc = state.doc.items.filter((x) => catById(x.cat)?.section === 'kitchen' && !x.desc.ru && !x.ingr.ru).length;
  let html = warn + `
    <div class="stats">
      <div class="stat"><b>${total}</b><span>позиций в меню</span></div>
      <div class="stat"><b>${withVideo}</b><span>с видео</span></div>
      <div class="stat"><b>${noDesc}</b><span>блюд без описания</span></div>
    </div>
    <div class="seg mt" id="sec-seg">
      <button data-s="kitchen" class="${sec === 'kitchen' ? 'active' : ''}">Кухня</button>
      <button data-s="bar" class="${sec === 'bar' ? 'active' : ''}">Бар</button>
    </div>`;
  const catRow = (c, i, arr) => {
    const items = state.doc.items.filter((x) => x.cat === c.id);
    const st = items.filter(stopped).length;
    const vid = items.filter((x) => x.media?.type === 'video').length;
    return `<div class="row tap" data-cat="${c.id}">
      <div class="order"><button class="icon-btn" data-mv="${c.id}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Выше">${icon('up')}</button><button class="icon-btn" data-mv="${c.id}" data-dir="1" ${i === arr.length - 1 ? 'disabled' : ''} aria-label="Ниже">${icon('down')}</button></div>
      <div class="row-main"><div class="row-title">${esc(nm(c.name))}</div>
        <div class="row-sub"><span>${items.length} поз.</span>${c.section === 'kitchen' ? `<span class="tag">${items.filter((x) => placeOf(x) === 'big').length} в карусели</span><span class="tag">${c.rail === false ? 'лента скрыта' : items.filter((x) => placeOf(x) === 'compact').length + ' в ленте'}</span>` : ''}${vid ? `<span class="tag ok">${vid} видео</span>` : ''}${st ? `<span class="tag stop">${st} на стопе</span>` : ''}${c.hidden ? '<span class="tag hidden">скрыта</span>' : ''}</div></div>
      ${icon('chev', 'chev')}
    </div>`;
  };
  if (sec === 'kitchen') {
    html += `<div class="group-title">Категории кухни<span class="spacer"></span><button class="btn small ghost" data-newcat>${icon('plus')}Категория</button></div><div class="list">${cats.map(catRow).join('')}</div>`;
  } else {
    for (const [gi, g] of state.doc.groups.entries()) {
      const gc = cats.filter((c) => c.group === g.id);
      html += `<div class="group-title">${esc(nm(g.name))}<span class="spacer"></span>
        <button class="icon-btn" data-gmv="${g.id}" data-dir="-1" ${gi === 0 ? 'disabled' : ''}>${icon('up')}</button><button class="icon-btn" data-gmv="${g.id}" data-dir="1" ${gi === state.doc.groups.length - 1 ? 'disabled' : ''}>${icon('down')}</button>
        <button class="btn small ghost" data-group="${g.id}">${icon('edit')}Раздел</button></div>
        <div class="list">${gc.length ? gc.map(catRow).join('') : '<div class="empty">Нет категорий</div>'}</div>`;
    }
    const orphan = cats.filter((c) => !state.doc.groups.some((g) => g.id === c.group));
    if (orphan.length) html += `<div class="group-title">Без раздела</div><div class="list">${orphan.map(catRow).join('')}</div>`;
    html += `<div class="fab-row"><button class="btn secondary" data-newcat>${icon('plus')}Новая категория бара</button></div>`;
  }
  v.innerHTML = html;
  $$('#sec-seg button').forEach((b) => (b.onclick = () => { state.menuSection = b.dataset.s; renderView(); }));
  $$('[data-cat]', v).forEach((r) => (r.onclick = (e) => { if (e.target.closest('.order')) return; state.catId = r.dataset.cat; renderView(); scrollTo(0, 0); }));
  $$('[data-mv]', v).forEach((b) => (b.onclick = async (e) => { e.stopPropagation(); try { await doOp({ type: 'cat.move', id: b.dataset.mv, dir: +b.dataset.dir }, { quiet: true }); renderView(); } catch (er) { toast(er.message, 'err'); } }));
  $$('[data-gmv]', v).forEach((b) => (b.onclick = async () => { try { await doOp({ type: 'group.move', id: b.dataset.gmv, dir: +b.dataset.dir }, { quiet: true }); renderView(); } catch (er) { toast(er.message, 'err'); } }));
  $$('[data-newcat]', v).forEach((b) => (b.onclick = () => openCategoryEditor(null, sec)));
  $$('[data-group]', v).forEach((b) => (b.onclick = () => openGroupEditor(b.dataset.group)));
}

function renderCategory(v) {
  const c = catById(state.catId);
  if (!c) { state.catId = null; return renderView(); }
  setTop(nm(c.name), { back: 'Меню', right: `<button class="btn small secondary" data-editcat>${icon('edit')}Категория</button>` });
  $('[data-back]').onclick = () => { state.catId = null; renderView(); };
  $('[data-editcat]').onclick = () => openCategoryEditor(c.id);
  const items = state.doc.items.filter((x) => x.cat === c.id);
  let html = '';
  if (c.section === 'kitchen' && c.display === 'video') html += `<div class="banner info"><div>Блюда с видео или фото показываются большой каруселью. Остальные — компактной лентой ниже. Порядок: стрелками ↑↓.</div></div>`;
  html += `<div class="fab-row"><button class="btn" data-new>${icon('plus')}Добавить ${c.section === 'bar' ? 'позицию' : 'блюдо'}</button></div>`;
  html += `<div class="list">`;
  items.forEach((it, i) => {
    const off = stopped(it);
    html += `<div class="row tap ${off || it.hidden ? 'off' : ''}" data-id="${it.id}">
      <div class="order"><button class="icon-btn" data-mv="${it.id}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>${icon('up')}</button><button class="icon-btn" data-mv="${it.id}" data-dir="1" ${i === items.length - 1 ? 'disabled' : ''}>${icon('down')}</button></div>
      ${thumbHtml(it.media)}
      <div class="row-main"><div class="row-title">${esc(nm(it.name))}</div>
        <div class="row-sub"><span class="row-price">${money(it.price)}</span>${it.portion ? `<span>· ${esc(it.portion)}</span>` : ''}${off ? `<span class="tag stop">${esc(stopLabel(it))}</span>` : ''}${it.hidden ? '<span class="tag hidden">скрыто</span>' : ''}${c.section === 'kitchen' ? `<span class="tag ${placeOf(it) === 'big' ? 'gold' : ''}">${placeOf(it) === 'big' ? 'карусель' : c.rail === false ? 'лента скрыта' : 'лента'}</span>` : ''}${c.section === 'kitchen' && !it.desc.ru && !it.ingr.ru ? '<span class="tag">нет описания</span>' : ''}${it.media?.src?.includes('postershop') ? '<span class="tag">фото Poster</span>' : ''}</div></div>
      ${icon('chev', 'chev')}
    </div>`;
  });
  html += items.length ? '</div>' : '<div class="empty">Пока пусто</div></div>';
  v.innerHTML = html;
  $('[data-new]').onclick = () => openItemEditor(null, c.id);
  $$('.row[data-id]', v).forEach((r) => (r.onclick = (e) => { if (e.target.closest('.order')) return; openItemEditor(r.dataset.id); }));
  $$('[data-mv]', v).forEach((b) => (b.onclick = async (e) => { e.stopPropagation(); try { await doOp({ type: 'item.move', id: b.dataset.mv, dir: +b.dataset.dir }, { quiet: true }); renderView(); } catch (er) { toast(er.message, 'err'); } }));
}

// ───────────────────────── ПОЛЯ ─────────────────────────
function langTabs(id) {
  return `<div class="seg" data-langtabs="${id}">${LANGS.map(([l, L], i) => `<button type="button" data-l="${l}" class="${i === 0 ? 'active' : ''}"><span class="dot" data-dot="${l}"></span>${L}</button>`).join('')}</div>`;
}
function i18nField(key, label, obj, { textarea = false, placeholder = '', hint = '' } = {}) {
  return `<div class="field" data-i18n="${key}">
    <div class="field-label">${esc(label)}</div>
    ${LANGS.map(([l], i) => textarea
      ? `<textarea class="textarea" name="${key}.${l}" placeholder="${esc(placeholder)}" ${i ? 'hidden' : ''}>${esc(obj?.[l] || '')}</textarea>`
      : `<input class="input" name="${key}.${l}" value="${esc(obj?.[l] || '')}" placeholder="${esc(placeholder)}" ${i ? 'hidden' : ''}>`).join('')}
    ${hint ? `<div class="hint">${hint}</div>` : ''}
  </div>`;
}
function wireLangTabs(root) {
  const setLang = (l) => {
    $$('[data-langtabs] button', root).forEach((b) => b.classList.toggle('active', b.dataset.l === l));
    $$('[data-i18n] [name]', root).forEach((f) => { f.hidden = !f.name.endsWith('.' + l); });
  };
  $$('[data-langtabs] button', root).forEach((b) => (b.onclick = () => setLang(b.dataset.l)));
  const dots = () => {
    for (const [l] of LANGS) {
      const filled = $$(`[data-i18n] [name$=".${l}"]`, root).filter((f) => f.name.startsWith('name.')).some((f) => f.value.trim());
      $$(`[data-dot="${l}"]`, root).forEach((d) => d.classList.toggle('ok', filled));
    }
  };
  root.addEventListener('input', dots);
  dots();
}
function readI18n(root, key) {
  const o = {};
  for (const [l] of LANGS) o[l] = ($(`[name="${key}.${l}"]`, root)?.value || '').trim();
  return o;
}
const sw = (name, checked, label, sub = '') => `<label class="card-row"><span class="grow">${esc(label)}${sub ? `<small>${sub}</small>` : ''}</span><span class="switch"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}><span></span></span></label>`;

// ───────────────────────── МЕДИА ─────────────────────────
function mediaPreview(m) {
  if (!m) return `<div class="media-prev">${icon('photo')}</div>`;
  const f = m.focus || { x: 0.5, y: 0.6 };
  const dot = `<span class="focus-dot" style="left:${f.x * 100}%;top:${f.y * 100}%"></span>`;
  if (m.type === 'video') return `<div class="media-prev pickable" data-kind="video" style="background-image:url('${esc(m.poster || '')}')"><video src="${esc(m.srcLow || m.src)}" muted loop playsinline autoplay poster="${esc(m.poster || '')}"></video>${dot}</div>`;
  return `<div class="media-prev photo pickable" data-kind="photo" style="background-image:url('${esc(m.blur || '')}')"><div class="photo-fit" style="aspect-ratio:${m.w || 4} / ${m.h || 3}"><img src="${esc(m.srcLow || m.src)}" alt="">${dot}</div></div>`;
}
function mediaBlock(m) {
  return `<div class="card"><div class="media-box">
      <div data-prev>${mediaPreview(m)}</div>
      <div>
        <div class="media-actions">
          <label class="btn secondary">${icon('video')}Загрузить видео<input type="file" accept="video/*" data-file="video" hidden></label>
          <label class="btn secondary">${icon('photo')}Загрузить фото<input type="file" accept="image/*" data-file="image" hidden></label>
          <button type="button" class="btn ghost" data-rmmedia ${m ? '' : 'hidden'}>${icon('trash')}Убрать</button>
        </div>
        <div class="progress" hidden><div class="progress-bar"><i></i></div><div class="progress-label"><span data-plabel></span><span data-ppct></span></div></div>
      </div>
    </div>
    <div class="hint">Снимайте вертикально (9:16), 5–10 секунд — прямо с iPhone, в любом формате. Видео автоматически превращается в три версии (Full HD, HD и лёгкую), которые играют на всех телефонах. <b>Точка на превью</b> — где блюдо: сайт кадрирует по ней и пускает от неё пар. Сдвинуть — нажмите на блюдо на превью.</div>
  </div>`;
}
function wireMedia(root, getMedia, setMedia) {
  const prog = $('.progress', root);
  const setP = (label, p) => {
    prog.hidden = false;
    $('[data-plabel]', prog).textContent = label;
    $('[data-ppct]', prog).textContent = p == null ? '' : Math.round(p * 100) + '%';
    $('.progress-bar i', prog).style.width = (p == null ? 100 : Math.round(p * 100)) + '%';
  };
  const refresh = () => { $('[data-prev]', root).innerHTML = mediaPreview(getMedia()); $('[data-rmmedia]', root).hidden = !getMedia(); };
  $$('[data-file]', root).forEach((inp) => (inp.onchange = async () => {
    const file = inp.files[0]; inp.value = '';
    if (!file) return;
    root.dataset.busy = '1';
    $$('.media-actions .btn', root).forEach((b) => b.classList.add('disabled'));
    try {
      const m = inp.dataset.file === 'video' || file.type.startsWith('video/') ? await uploadVideo(file, setP) : await uploadImage(file, setP);
      setMedia(m); refresh();
      setP('Готово ✓', 1);
      setTimeout(() => { prog.hidden = true; }, 1500);
    } catch (e) {
      console.error(e);
      prog.hidden = true;
      toast(e.message || 'Не удалось обработать файл', 'err');
    } finally {
      delete root.dataset.busy;
      $$('.media-actions .btn', root).forEach((b) => b.classList.remove('disabled'));
    }
  }));
  $('[data-rmmedia]', root).onclick = () => { setMedia(null); refresh(); };
  // ручная точка блюда: нажатие на превью
  $('[data-prev]', root).addEventListener('click', (e) => {
    const m = getMedia(); if (!m) return;
    const box = e.target.closest('.photo-fit') || e.target.closest('.media-prev');
    if (!box) return;
    const r = box.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    setMedia({ ...m, focus: { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000, s: m.focus?.s || 0.5 } });
    const d = $('.focus-dot', root); if (d) { d.style.left = x * 100 + '%'; d.style.top = y * 100 + '%'; }
  });
}

// ── обработка видео в браузере ──
let MB = null;
async function mediabunny() { return MB || (MB = await import('/admin/vendor/mediabunny.mjs')); }
const MAX_SECONDS = 15;
const CODEC = window.__qaCodec || 'avc'; // H.264 — единственный кодек, который играют все телефоны
// три версии: 1080p для быстрого интернета и чётких экранов, 720p — основная, 480p — для слабой связи
const RENDITIONS = [
  { key: 'srcHi', w: 1080, h: 1920, bitrate: 5_000_000, label: 'Версия Full HD', file: '1080' },
  { key: 'src', w: 720, h: 1280, bitrate: 2_800_000, label: 'Основная версия', file: '720' },
  { key: 'srcLow', w: 480, h: 854, bitrate: 1_100_000, label: 'Лёгкая версия для слабого интернета', file: '480' },
];

async function uploadVideo(file, setP) {
  if (!('VideoEncoder' in window)) throw new Error('Этот браузер не умеет сжимать видео. Откройте админку в Safari (iPhone/Mac) или Chrome.');
  setP('Подготовка…', 0);
  const mb = await mediabunny();
  if (!(await mb.canEncodeVideo(CODEC, { width: 720, height: 1280, bitrate: 2_200_000 }))) throw new Error('Браузер не поддерживает кодирование H.264. Используйте Safari или Chrome.');
  let out;
  try {
    if (window.__qaForceFallback) throw new Error('test');
    out = await transcodeDirect(mb, file, setP);
  } catch (e) {
    // Видео HDR / Dolby Vision с iPhone и некоторые форматы WebCodecs не читает напрямую —
    // тогда кадры берём из обычного видеоплеера браузера (он умеет всё, что умеет показывать).
    console.warn('direct transcode failed, fallback', e);
    out = await transcodeViaPlayer(mb, file, setP);
  }
  // если исходник меньше 720p — основной версией становится самая большая из получившихся
  if (!out.src) { out.src = out.srcHi || out.srcLow; delete out.srcHi; }
  setP('Обложка и поиск блюда в кадре…', 0.72);
  const { poster, blur, focus, w, h } = await posterFromVideo(out.srcHi || out.src);
  const base = 'media/' + slug(file.name) + '-' + Date.now().toString(36);
  const files = [];
  for (const r of RENDITIONS) if (out[r.key]) files.push([out[r.key], base + '-' + r.file + '.mp4', 'video/mp4', r.key]);
  files.push([poster, base + '-poster.' + (poster.type === 'image/webp' ? 'webp' : 'jpg'), poster.type, 'poster']);
  const total = files.reduce((s, f) => s + f[0].size, 0);
  let doneBytes = 0;
  const media = { type: 'video', blur, w: 720, h: 1280, dur: out.dur, focus, bytes: {} };
  for (const [blob, path, type, key] of files) {
    media[key] = await putFile(blob, path, type, (loaded) => setP(`Загрузка ${fmtMB(doneBytes + loaded)} из ${fmtMB(total)}…`, 0.74 + ((doneBytes + loaded) / total) * 0.26));
    if (key !== 'poster') media.bytes[key] = blob.size;
    doneBytes += blob.size;
  }
  return media;
}

function cropFor(dw, dh) {
  // центр кадра под вертикальный формат 9:16 — как карточка на сайте
  const ar = 9 / 16;
  let cw = dw, ch = dh;
  if (dw / dh > ar) cw = Math.round(dh * ar); else ch = Math.round(dw / ar);
  cw -= cw % 2; ch -= ch % 2;
  return { left: Math.round((dw - cw) / 2), top: Math.round((dh - ch) / 2), width: cw, height: ch };
}
function sizesFor(crop) {
  // не растягиваем маленькие исходники и не делаем одинаковые копии
  const seen = new Set();
  return RENDITIONS.map((r) => {
    const w = Math.min(r.w, crop.width - (crop.width % 2));
    return { ...r, w, h: Math.round((w / 9) * 16 / 2) * 2 };
  }).filter((r) => { if (seen.has(r.w) || (r.key === 'srcHi' && r.w < 900)) return false; seen.add(r.w); return true; });
}

async function transcodeDirect(mb, file, setP) {
  const { Input, Output, Conversion, BlobSource, BufferTarget, Mp4OutputFormat, ALL_FORMATS, Quality } = mb;
  const probe = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const vt = await probe.getPrimaryVideoTrack();
  if (!vt) throw new Error('В файле нет видео');
  if (!(await vt.canDecode())) throw new Error('cannot decode');
  const crop = cropFor(await vt.getDisplayWidth(), await vt.getDisplayHeight());
  const end = Math.min(await probe.computeDuration(), MAX_SECONDS);
  const sizes = sizesFor(crop);
  const out = { dur: Math.round(end * 10) / 10 };
  for (const [ri, r] of sizes.entries()) {
    const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
    const conv = await Conversion.init({
      input, output,
      trim: { start: 0, end },
      video: { crop, width: r.w, height: r.h, fit: 'fill', frameRate: 30, codec: CODEC, quality: new Quality({ bitrate: r.bitrate }), keyFrameInterval: 2, forceTranscode: true },
      audio: { discard: true },
    });
    if (!conv.isValid) throw new Error('invalid conversion');
    conv.onProgress = (p) => setP(`${r.label}…`, (ri + p) / sizes.length * 0.7);
    await conv.execute();
    out[r.key] = new Blob([output.target.buffer], { type: 'video/mp4' });
  }
  return out;
}

async function transcodeViaPlayer(mb, file, setP) {
  const { Output, BufferTarget, Mp4OutputFormat, CanvasSource, Quality } = mb;
  const url = URL.createObjectURL(file);
  const v = document.createElement('video');
  v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
  try {
    await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error('Браузер не может открыть это видео. Попробуйте другой файл или снимите в формате «Наиболее совместимый» (Настройки → Камера → Форматы).')); setTimeout(() => rej(new Error('Видео не открывается')), 20000); });
    const crop = cropFor(v.videoWidth, v.videoHeight);
    const end = Math.min(v.duration || MAX_SECONDS, MAX_SECONDS);
    const sizes = sizesFor(crop);
    const tracks = [];
    for (const r of sizes) {
      const c = document.createElement('canvas'); c.width = r.w; c.height = r.h;
      const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high';
      const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
      const source = new CanvasSource(c, { codec: CODEC, quality: new Quality({ bitrate: r.bitrate }), keyFrameInterval: 2 });
      output.addVideoTrack(source, { frameRate: 30 });
      await output.start();
      tracks.push({ r, ctx, output, source });
    }
    const fps = 30, step = 1 / fps, frames = Math.floor(end * fps);
    const seek = (t) => new Promise((res) => {
      const done = () => { v.removeEventListener('seeked', done); res(); };
      v.addEventListener('seeked', done);
      v.currentTime = t;
      setTimeout(done, 1500);
    });
    for (let i = 0; i < frames; i++) {
      const t = i * step;
      await seek(Math.min(t + 0.001, v.duration - 0.01));
      for (const k of tracks) {
        k.ctx.drawImage(v, crop.left, crop.top, crop.width, crop.height, 0, 0, k.r.w, k.r.h);
        await k.source.add(t, step);
      }
      if (i % 5 === 0) setP('Сжимаем видео…', (i / frames) * 0.7);
    }
    const out = { dur: Math.round(end * 10) / 10 };
    for (const k of tracks) {
      k.source.close();
      await k.output.finalize();
      out[k.r.key] = new Blob([k.output.target.buffer], { type: 'video/mp4' });
    }
    return out;
  } finally {
    v.removeAttribute('src'); v.load();
    URL.revokeObjectURL(url);
  }
}

async function posterFromVideo(blob) {
  const v = document.createElement('video');
  v.muted = true; v.playsInline = true; v.preload = 'auto';
  const url = URL.createObjectURL(blob);
  v.src = url;
  await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error('Не удалось прочитать видео')); });
  v.currentTime = 0.001;
  await new Promise((res) => { v.onseeked = res; setTimeout(res, 800); });
  const poster = await canvasBlob(v, 450, 800, 0.72);
  const blur = await tinyBlur(v);
  const focus = detectFocus(v);
  URL.revokeObjectURL(url);
  return { poster, blur, focus };
}

async function uploadImage(fileOrBlob, setP, { maxSide = 1600, name = 'photo' } = {}) {
  setP && setP('Сжимаем фото…', 0.1);
  let bmp;
  try { bmp = await createImageBitmap(fileOrBlob, { imageOrientation: 'from-image' }); } catch {
    bmp = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('Формат фото не поддерживается — сохраните как JPG')); im.src = URL.createObjectURL(fileOrBlob); });
  }
  const w0 = bmp.width, h0 = bmp.height;
  const k = Math.min(1, maxSide / Math.max(w0, h0));
  const w = Math.round(w0 * k), h = Math.round(h0 * k);
  const main = await canvasBlob(bmp, w, h, 0.84);
  // уменьшенная копия для компактных карточек — грузится мгновенно
  const k2 = Math.min(1, 640 / Math.max(w0, h0));
  const small = await canvasBlob(bmp, Math.round(w0 * k2), Math.round(h0 * k2), 0.8);
  const blur = await tinyBlur(bmp);
  const focus = detectFocus(bmp);
  const base = 'media/' + slug(fileOrBlob.name || name) + '-' + Date.now().toString(36);
  const ext = (b) => (b.type === 'image/webp' ? 'webp' : 'jpg');
  const total = main.size + small.size;
  const src = await putFile(main, base + '.' + ext(main), main.type, (l) => setP && setP('Загрузка…', 0.3 + (l / total) * 0.7));
  const srcLow = await putFile(small, base + '-s.' + ext(small), small.type, (l) => setP && setP('Загрузка…', 0.3 + ((main.size + l) / total) * 0.7));
  return { type: 'image', src, srcLow, blur, w, h, focus };
}

/** Где на кадре блюдо: цветовой контраст с фоном + локальный контраст + лёгкий приоритет центра. */
function detectFocus(src) {
  try {
    const sw = src.videoWidth || src.width, sh = src.videoHeight || src.height;
    const W = 72, H = Math.max(24, Math.round((W * sh) / sw));
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(src, 0, 0, W, H);
    const px = ctx.getImageData(0, 0, W, H).data;
    const lab = new Float32Array(W * H * 3);
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    let mL = 0, mA = 0, mB = 0;
    for (let i = 0; i < W * H; i++) {
      const r = lin(px[i * 4]), g = lin(px[i * 4 + 1]), b = lin(px[i * 4 + 2]);
      const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.9505), y = f(0.2126 * r + 0.7152 * g + 0.0722 * b), z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.089);
      const L = 116 * y - 16, A = 500 * (x - y), B = 200 * (y - z);
      lab[i * 3] = L; lab[i * 3 + 1] = A; lab[i * 3 + 2] = B; mL += L; mA += A; mB += B;
    }
    mL /= W * H; mA /= W * H; mB /= W * H;
    // локальное среднее (размытие окном 9×9) для контраста «центр — окружение»
    const R = 4, loc = new Float32Array(W * H * 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let n = 0, s0 = 0, s1 = 0, s2 = 0;
      for (let dy = -R; dy <= R; dy += 2) for (let dx = -R; dx <= R; dx += 2) {
        const yy = Math.min(H - 1, Math.max(0, y + dy)), xx = Math.min(W - 1, Math.max(0, x + dx)), j = (yy * W + xx) * 3;
        s0 += lab[j]; s1 += lab[j + 1]; s2 += lab[j + 2]; n++;
      }
      const i = (y * W + x) * 3; loc[i] = s0 / n; loc[i + 1] = s1 / n; loc[i + 2] = s2 / n;
    }
    const S = new Float32Array(W * H);
    let mx = 0;
    for (let i = 0; i < W * H; i++) {
      const j = i * 3;
      const g1 = Math.hypot(lab[j] - mL, lab[j + 1] - mA, lab[j + 2] - mB);
      const g2 = Math.hypot(lab[j] - loc[j], lab[j + 1] - loc[j + 1], lab[j + 2] - loc[j + 2]);
      S[i] = g1 * 0.6 + g2 * 0.4; if (S[i] > mx) mx = S[i];
    }
    const vals = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const X = (x + 0.5) / W, Y = (y + 0.5) / H;
      const i = y * W + x;
      S[i] = (S[i] / (mx || 1)) * Math.exp(-((X - 0.5) ** 2 / 0.08 + (Y - 0.58) ** 2 / 0.12));
      vals.push(S[i]);
    }
    vals.sort((a, b) => a - b);
    const thr = vals[Math.floor(vals.length * 0.85)];
    let sw8 = 0, cx = 0, cy = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = S[y * W + x]; if (v >= thr) { sw8 += v; cx += v * (x + 0.5) / W; cy += v * (y + 0.5) / H; } }
    cx /= sw8; cy /= sw8;
    let vx = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = S[y * W + x]; if (v >= thr) vx += v * (((x + 0.5) / W - cx) ** 2 + ((y + 0.5) / H - cy) ** 2); }
    const s = Math.min(0.9, Math.max(0.2, Math.sqrt(vx / sw8) * 3));
    const r3 = (n) => Math.round(n * 1000) / 1000;
    return { x: r3(cx), y: r3(cy), s: r3(s) };
  } catch { return { x: 0.5, y: 0.6, s: 0.5 }; }
}

function drawCover(src, w, h, sw = src.videoWidth || src.width, sh = src.videoHeight || src.height) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  const k = Math.max(w / sw, h / sh);
  const dw = sw * k, dh = sh * k;
  ctx.drawImage(src, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return c;
}
async function canvasBlob(src, w, h, q) {
  const c = drawCover(src, w, h);
  let b = await new Promise((r) => c.toBlob(r, 'image/webp', q));
  if (!b || b.type !== 'image/webp') b = await new Promise((r) => c.toBlob(r, 'image/jpeg', q + 0.08)); // старый Safari не умеет WebP
  return b;
}
async function tinyBlur(src) {
  const sw = src.videoWidth || src.width, sh = src.videoHeight || src.height;
  const w = 12, h = Math.max(8, Math.round((12 * sh) / sw));
  const c = drawCover(src, w, h);
  let d = c.toDataURL('image/webp', 0.4);
  if (!d.startsWith('data:image/webp')) d = c.toDataURL('image/jpeg', 0.5);
  return d;
}
const slug = (s) => String(s || 'file').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'file';
const fmtMB = (b) => (b / 1048576).toFixed(1) + ' МБ';

/** Загрузка файла напрямую в Vercel Blob (или локально при разработке), с повтором при обрыве связи. */
async function putFile(blob, pathname, contentType, onProgress) {
  const tk = await api('upload-token', { pathname, contentType });
  for (let attempt = 1; ; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const x = new XMLHttpRequest();
        if (tk.mode === 'local') {
          x.open('PUT', '/api/admin/local-upload?pathname=' + encodeURIComponent(pathname));
          x.setRequestHeader('x-qalaqshi', '1');
        } else {
          x.open('PUT', tk.apiUrl + '/?pathname=' + encodeURIComponent(pathname));
          x.setRequestHeader('authorization', 'Bearer ' + tk.token);
          x.setRequestHeader('x-api-version', tk.apiVersion);
          x.setRequestHeader('x-vercel-blob-store-id', tk.storeId);
          x.setRequestHeader('x-vercel-blob-access', 'public');
          x.setRequestHeader('x-content-type', contentType);
          x.setRequestHeader('x-content-length', String(blob.size));
          x.setRequestHeader('x-api-blob-request-id', `${tk.storeId}:${Date.now()}:${Math.random().toString(16).slice(2)}`);
          x.setRequestHeader('x-api-blob-request-attempt', String(attempt - 1));
        }
        x.upload.onprogress = (e) => onProgress && onProgress(e.loaded);
        x.onload = () => {
          if (x.status >= 200 && x.status < 300) { try { resolve(JSON.parse(x.responseText).url); } catch { reject(new Error('Неверный ответ хранилища')); } }
          else reject(new Error('Ошибка загрузки (' + x.status + ')' + (x.status === 403 ? ': проверьте подключение Vercel Blob' : '')));
        };
        x.onerror = () => reject(Object.assign(new Error('Нет связи — повторяем…'), { retry: true }));
        x.send(blob);
      });
    } catch (e) {
      if (!e.retry || attempt >= 4) throw new Error(e.retry ? 'Нет интернета: загрузка не удалась. Попробуйте ещё раз.' : e.message);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

// ───────────────────────── РЕДАКТОР БЛЮДА ─────────────────────────
function openItemEditor(id, catId) {
  if (!isOwner()) return;
  const src = id ? structuredClone(itemById(id)) : {
    id: null, cat: catId || state.doc.categories[0].id, price: '', oldPrice: null, name: {}, desc: {}, ingr: {}, portion: '', badges: [], media: null,
    steam: !!catById(catId)?.steam, hidden: false, stop: null,
  };
  const it = src;
  const cat = catById(it.cat);
  const kitchen = cat?.section !== 'bar';
  const cats = state.doc.categories;
  const html = `
    <div class="sheet-head"><button class="btn ghost" data-cancel>Отмена</button><h2>${id ? 'Редактирование' : 'Новая позиция'}</h2><button class="btn ghost" data-save style="font-weight:700">Готово</button></div>
    <form class="sheet-body" autocomplete="off">
      ${kitchen ? mediaBlock(it.media) : ''}
      <div class="field"><div class="field-label">Язык<span class="spacer"></span></div>${langTabs('item')}</div>
      ${i18nField('name', 'Название', it.name, { placeholder: 'Например: Хачапури по-аджарски' })}
      <div class="grid3">
        <div class="field"><label>Цена</label><div class="affix"><input class="input" name="price" inputmode="decimal" value="${esc(it.price)}" placeholder="0"><span>₾</span></div></div>
        <div class="field"><label>Старая цена</label><div class="affix"><input class="input" name="oldPrice" inputmode="decimal" value="${esc(it.oldPrice || '')}" placeholder="—"><span>₾</span></div></div>
        <div class="field"><label>Порция</label><input class="input" name="portion" value="${esc(it.portion)}" placeholder="250 г · 0.5 л"></div>
      </div>
      <div class="hint" style="margin:-6px 4px 14px">Старая цена — если хотите показать скидку (будет зачёркнута). Порция: «250 г», «0.5 л», «50 мл», «1 шт» — на сайте переведётся сама.</div>
      ${kitchen ? i18nField('desc', 'Описание', it.desc, { textarea: true, placeholder: 'Пара предложений о блюде' }) : ''}
      ${kitchen ? i18nField('ingr', 'Состав', it.ingr, { textarea: true, placeholder: 'Говядина · лук · кинза · специи', hint: 'Разделяйте ингредиенты точкой «·» или запятой.' }) : ''}
      <div class="field"><label>Категория</label><select class="select" name="cat">${cats.map((c) => `<option value="${c.id}" ${c.id === it.cat ? 'selected' : ''}>${c.section === 'bar' ? 'Бар · ' : ''}${esc(nm(c.name))}</option>`).join('')}</select></div>
      ${kitchen ? `<div class="field"><label>Где показывать на сайте</label>
        <div class="seg" data-place>${[['auto', 'Авто'], ['big', 'Большая карусель'], ['compact', 'Компактная лента']].map(([k, l]) => `<button type="button" data-v="${k}" class="${(it.place || 'auto') === k ? 'active' : ''}">${l}</button>`).join('')}</div>
        <div class="hint" data-place-hint></div></div>` : ''}
      ${kitchen ? `<div class="field"><label>Метка на карточке</label><div class="chips" data-badges>${Object.entries(BADGES).map(([k, l]) => `<button type="button" class="chip ${it.badges.includes(k) ? 'on' : ''}" data-b="${k}">${l}</button>`).join('')}</div><div class="hint">На карточке показывается первая выбранная метка, в подробностях — все.</div></div>` : ''}
      <div class="card">
        ${sw('available', !stopped(it), 'В наличии', 'Выключите, чтобы поставить на стоп')}
        ${kitchen ? sw('steam', it.steam, 'Эффект пара над видео', 'Для горячих блюд') : ''}
        ${sw('hidden', it.hidden, 'Скрыть с сайта', 'Позиция останется в админке')}
      </div>
      ${id ? `<button type="button" class="btn danger" data-del style="width:100%">${icon('trash')}Удалить позицию</button>` : ''}
    </form>`;
  let dirty = false;
  const L = openLayer(html);
  const root = L.el;
  const form = $('form', root);
  wireLangTabs(root);
  form.addEventListener('input', () => { dirty = true; });
  if (kitchen) wireMedia(root, () => it.media, (m) => { it.media = m; dirty = true; placeHint(); });
  const placeHint = () => {
    const el = $('[data-place-hint]', root); if (!el) return;
    const c2 = catById($('form', root).elements.cat.value) || cat;
    const where = placeOf({ ...it, cat: c2.id });
    el.innerHTML = (where === 'big' ? 'Сейчас: <b>большая карусель</b>.' : `Сейчас: <b>компактная лента</b>${c2.rail === false ? ' — но лента в этой категории скрыта, позиция не видна на сайте' : ''}.`) +
      (it.place === 'big' && !it.media ? ' Нет видео/фото — карточка будет с логотипом вместо картинки.' : '') +
      ((it.place || 'auto') === 'auto' ? ' «Авто»: с видео — в карусель, без видео — в ленту.' : '');
  };
  $$('[data-place] button', root).forEach((b) => (b.onclick = () => {
    it.place = b.dataset.v; dirty = true;
    $$('[data-place] button', root).forEach((x) => x.classList.toggle('active', x === b));
    placeHint();
  }));
  form.addEventListener('change', (e) => { if (e.target.name === 'cat') placeHint(); });
  placeHint();
  $$('[data-b]', root).forEach((b) => (b.onclick = () => {
    const k = b.dataset.b;
    it.badges = it.badges.includes(k) ? it.badges.filter((x) => x !== k) : [...it.badges, k];
    b.classList.toggle('on'); dirty = true;
  }));
  L.wrap._tryClose = async () => {
    if (root.dataset.busy) return toast('Дождитесь окончания загрузки видео', 'err');
    if (dirty && !(await confirmBox('Закрыть без сохранения?', 'Не сохранять'))) return;
    L.close();
  };
  $('[data-cancel]', root).onclick = () => L.wrap._tryClose();
  $('[data-save]', root).onclick = async () => {
    if (root.dataset.busy) return toast('Дождитесь окончания загрузки', 'err');
    const f = form.elements;
    const item = {
      id: it.id, cat: f.cat.value, price: f.price.value, oldPrice: f.oldPrice.value, portion: f.portion.value,
      name: readI18n(root, 'name'), desc: kitchen ? readI18n(root, 'desc') : it.desc, ingr: kitchen ? readI18n(root, 'ingr') : it.ingr,
      badges: it.badges, media: it.media, place: it.place || 'auto', steam: kitchen ? f.steam.checked : it.steam, hidden: f.hidden.checked, stop: it.stop, pos: it.pos,
    };
    if (!['ru', 'en', 'ka'].some((l) => item.name[l])) return toast('Введите название', 'err');
    if (item.price === '' || isNaN(+String(item.price).replace(',', '.'))) return toast('Укажите цену', 'err');
    const btn = $('[data-save]', root); btn.disabled = true;
    try {
      const res = await doOp({ type: 'item.save', item });
      const newId = res.id || it.id;
      const wantAvail = f.available.checked;
      const saved = itemById(newId);
      if (saved && wantAvail === stopped(saved)) await doOp({ type: 'item.stop', id: newId, mode: wantAvail ? 'off' : 'forever' }, { quiet: true });
      dirty = false; L.close(); renderView();
    } catch (e) { toast(e.message, 'err'); btn.disabled = false; }
  };
  const del = $('[data-del]', root);
  if (del) del.onclick = async () => {
    if (!(await confirmBox(`Удалить «${nm(it.name)}» из меню?`, 'Удалить'))) return;
    try { await doOp({ type: 'item.delete', id: it.id }); dirty = false; L.close(); renderView(); } catch (e) { toast(e.message, 'err'); }
  };
}

// ───────────────────────── РЕДАКТОР КАТЕГОРИИ ─────────────────────────
function openCategoryEditor(id, section) {
  const c = id ? structuredClone(catById(id)) : { id: null, section: section || 'kitchen', group: state.doc.groups[0]?.id || '', display: 'video', steam: false, hidden: false, name: {} };
  const isBar = c.section === 'bar';
  const count = id ? state.doc.items.filter((x) => x.cat === id).length : 0;
  const html = `
    <div class="sheet-head"><button class="btn ghost" data-cancel>Отмена</button><h2>${id ? 'Категория' : 'Новая категория'}</h2><button class="btn ghost" data-save style="font-weight:700">Готово</button></div>
    <form class="sheet-body">
      <div class="field"><div class="field-label">Язык</div>${langTabs('cat')}</div>
      ${i18nField('name', 'Название', c.name, { placeholder: isBar ? 'Например: Красное сухое' : 'Например: Салаты' })}
      ${isBar ? `<div class="field"><label>Раздел бара</label><select class="select" name="group">${state.doc.groups.map((g) => `<option value="${g.id}" ${g.id === c.group ? 'selected' : ''}>${esc(nm(g.name))}</option>`).join('')}</select></div>` : `
      <div class="field"><label>Куда попадают блюда в режиме «Авто»</label>
        <div class="seg" data-display><button type="button" data-v="video" class="${c.display === 'video' ? 'active' : ''}">С видео — в карусель</button><button type="button" data-v="compact" class="${c.display === 'compact' ? 'active' : ''}">Все — в ленту</button></div>
        <div class="hint">«С видео — в карусель»: блюда с видео (или вертикальным фото) — в большую карусель, остальные — в компактную ленту. Для отдельного блюда можно выбрать вручную в его карточке.</div></div>
      ${id ? `<div class="field"><label>Для всех блюд категории сразу</label><div class="btn-row">
        <button type="button" class="btn small secondary" data-bulk="big">Все — в карусель</button>
        <button type="button" class="btn small secondary" data-bulk="compact">Все — в ленту</button>
        <button type="button" class="btn small ghost" data-bulk="auto">Всем «Авто»</button></div></div>` : ''}`}
      <div class="card">
        ${!isBar ? sw('rail', c.rail !== false, 'Показывать компактную ленту', 'Выключите — лента исчезнет с сайта вместе с её позициями, без пустого места') : ''}
        ${!isBar ? sw('steam', c.steam, 'Пар для новых блюд', 'Включать эффект пара по умолчанию') : ''}
        ${sw('hidden', c.hidden, 'Скрыть категорию с сайта')}
      </div>
      ${id ? `<button type="button" class="btn danger" data-del style="width:100%">${icon('trash')}Удалить категорию</button><div class="hint center">${count ? `В категории ${count} поз. — сначала перенесите или удалите их.` : 'Категория пустая.'}</div>` : ''}
    </form>`;
  const L = openLayer(html);
  const root = L.el;
  wireLangTabs(root);
  let display = c.display;
  $$('[data-display] button', root).forEach((b) => (b.onclick = () => { display = b.dataset.v; $$('[data-display] button', root).forEach((x) => x.classList.toggle('active', x === b)); }));
  $$('[data-bulk]', root).forEach((b) => (b.onclick = async () => {
    const labels = { big: 'в большую карусель', compact: 'в компактную ленту', auto: 'в режим «Авто»' };
    if (!(await confirmBox(`Перевести все блюда категории ${labels[b.dataset.bulk]}?`, 'Перевести', false))) return;
    try { await doOp({ type: 'items.place', cat: id, place: b.dataset.bulk }); renderView(); } catch (e) { toast(e.message, 'err'); }
  }));
  $('[data-cancel]', root).onclick = () => L.close();
  $('[data-save]', root).onclick = async () => {
    const f = $('form', root).elements;
    const cat = { id: c.id, section: c.section, group: isBar ? f.group.value : '', display: isBar ? 'list' : display, rail: isBar ? true : f.rail.checked, steam: !isBar && f.steam.checked, hidden: f.hidden.checked, name: readI18n(root, 'name') };
    try { await doOp({ type: 'cat.save', cat }); L.close(); renderView(); } catch (e) { toast(e.message, 'err'); }
  };
  const del = $('[data-del]', root);
  if (del) del.onclick = async () => {
    if (!(await confirmBox('Удалить категорию?'))) return;
    try { await doOp({ type: 'cat.delete', id }); L.close(); state.catId = null; renderView(); } catch (e) { toast(e.message, 'err'); }
  };
}

function openGroupEditor(id) {
  const g = structuredClone(state.doc.groups.find((x) => x.id === id));
  const artSrc = g.artUrl || '';
  const artDefault = '<span style="color:#d9c4a0;font-size:12px;text-align:center;padding:8px">Стандартная линейная иконка</span>';
  const html = `
    <div class="sheet-head"><button class="btn ghost" data-cancel>Отмена</button><h2>Раздел бара</h2><button class="btn ghost" data-save style="font-weight:700">Готово</button></div>
    <form class="sheet-body">
      <div class="field"><div class="field-label">Язык</div>${langTabs('grp')}</div>
      ${i18nField('name', 'Название раздела', g.name)}
      <div class="card"><div class="field-label">Иллюстрация</div>
        <div class="media-box"><div class="media-prev photo" data-art style="background:#3a2828">${artSrc ? `<img src="${esc(artSrc)}" alt="">` : artDefault}</div>
        <div class="media-actions">
          <label class="btn secondary">${icon('photo')}Своя иллюстрация<input type="file" accept="image/*" hidden data-artfile></label>
          <button type="button" class="btn ghost" data-artreset ${g.artUrl ? '' : 'hidden'}>Вернуть стандартную</button>
          <div class="progress" hidden><div class="progress-bar"><i></i></div><div class="progress-label"><span data-plabel></span><span data-ppct></span></div></div>
        </div></div>
        <div class="hint">Необязательно. По умолчанию — тонкая линейная иконка в стиле логотипа. Своя картинка: PNG с прозрачным фоном, светлый рисунок.</div>
      </div>
    </form>`;
  const L = openLayer(html);
  const root = L.el;
  wireLangTabs(root);
  const prog = $('.progress', root);
  $('[data-artfile]', root).onchange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      prog.hidden = false;
      const m = await uploadImageKeepAlpha(file, (l, p) => { $('[data-plabel]', prog).textContent = l; $('.progress-bar i', prog).style.width = Math.round(p * 100) + '%'; });
      g.artUrl = m; $('[data-art]', root).innerHTML = `<img src="${esc(m)}" alt="">`; $('[data-artreset]', root).hidden = false;
      prog.hidden = true;
    } catch (er) { prog.hidden = true; toast(er.message, 'err'); }
  };
  $('[data-artreset]', root).onclick = () => { g.artUrl = ''; $('[data-art]', root).innerHTML = artDefault; $('[data-artreset]', root).hidden = true; };
  $('[data-cancel]', root).onclick = () => L.close();
  $('[data-save]', root).onclick = async () => {
    try { await doOp({ type: 'group.save', group: { id: g.id, name: readI18n(root, 'name'), artUrl: g.artUrl || '' } }); L.close(); renderView(); } catch (e) { toast(e.message, 'err'); }
  };
}
async function uploadImageKeepAlpha(file, cb) {
  cb('Сжимаем…', 0.1);
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 900 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  let b = await new Promise((r) => c.toBlob(r, 'image/webp', 0.82));
  if (!b || b.type !== 'image/webp') b = await new Promise((r) => c.toBlob(r, 'image/png'));
  return putFile(b, 'media/bar-' + Date.now().toString(36) + (b.type === 'image/webp' ? '.webp' : '.png'), b.type, (l) => cb('Загрузка…', 0.3 + (l / b.size) * 0.7));
}

// ───────────────────────── СПЕЦПРЕДЛОЖЕНИЯ ─────────────────────────
function specialState(s) {
  if (!s.active) return ['выключено', ''];
  const d = new Date(Date.now() + 240 * 60000);
  const today = d.toISOString().slice(0, 10);
  if (s.from && today < s.from) return ['запланировано с ' + fmtDate(s.from), 'gold'];
  if (s.to && today > s.to) return ['завершилось ' + fmtDate(s.to), ''];
  if (s.days?.length && !s.days.includes(d.getUTCDay())) return ['сегодня не показывается', ''];
  return ['на сайте сейчас', 'ok'];
}
const fmtDate = (s) => new Date(s + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

function renderSpecials(v, warn) {
  setTop('Спецпредложения');
  const list = state.doc.specials;
  let html = warn + `<div class="banner info"><div>Активные спецпредложения автоматически появляются <b style="display:inline">первой каруселью</b> на сайте — выше всего меню. Можно задать даты и дни недели.</div></div>
    <div class="fab-row"><button class="btn" data-new>${icon('plus')}Новое спецпредложение</button><button class="btn secondary" data-fromitem>Из блюда меню</button></div>`;
  if (!list.length) html += '<div class="empty">Спецпредложений пока нет</div>';
  else {
    html += '<div class="list">';
    list.forEach((s, i) => {
      const [st, cls] = specialState(s);
      html += `<div class="row tap" data-id="${s.id}">
        <div class="order"><button class="icon-btn" data-mv="${s.id}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>${icon('up')}</button><button class="icon-btn" data-mv="${s.id}" data-dir="1" ${i === list.length - 1 ? 'disabled' : ''}>${icon('down')}</button></div>
        ${thumbHtml(s.media)}
        <div class="row-main"><div class="row-title">${esc(nm(s.name))}</div><div class="row-sub"><span class="row-price">${money(s.price)}</span><span class="tag ${cls}">${esc(st)}</span></div></div>
        <label class="switch"><input type="checkbox" data-act="${s.id}" ${s.active ? 'checked' : ''}><span></span></label>
      </div>`;
    });
    html += '</div>';
  }
  v.innerHTML = html;
  $('[data-new]', v).onclick = () => openSpecialEditor(null);
  $('[data-fromitem]', v).onclick = pickItemForSpecial;
  $$('.row[data-id]', v).forEach((r) => (r.onclick = (e) => { if (e.target.closest('.order,.switch')) return; openSpecialEditor(r.dataset.id); }));
  $$('[data-mv]', v).forEach((b) => (b.onclick = async (e) => { e.stopPropagation(); await doOp({ type: 'special.move', id: b.dataset.mv, dir: +b.dataset.dir }, { quiet: true }).catch((er) => toast(er.message, 'err')); renderView(); }));
  $$('[data-act]', v).forEach((inp) => (inp.onchange = async () => {
    const s = structuredClone(state.doc.specials.find((x) => x.id === inp.dataset.act));
    s.active = inp.checked;
    try { await doOp({ type: 'special.save', special: s }); } catch (e) { toast(e.message, 'err'); }
    renderView();
  }));
}

async function pickItemForSpecial() {
  const withMedia = state.doc.items.filter((x) => catById(x.cat)?.section === 'kitchen');
  const html = `<div class="sheet-head"><button class="btn ghost" data-cancel>Отмена</button><h2>Выберите блюдо</h2><span style="width:70px"></span></div>
    <div class="sheet-body"><div class="search">${icon('search')}<input class="input" id="pq" type="search" placeholder="Поиск"></div><div class="list" id="plist"></div></div>`;
  const L = openLayer(html);
  const draw = (q = '') => {
    $('#plist', L.el).innerHTML = withMedia.filter((x) => !q || nm(x.name).toLowerCase().includes(q.toLowerCase())).slice(0, 80)
      .map((x) => `<button class="row tap" data-id="${x.id}">${thumbHtml(x.media)}<div class="row-main"><div class="row-title">${esc(nm(x.name))}</div><div class="row-sub">${money(x.price)}</div></div></button>`).join('');
  };
  draw();
  $('#pq', L.el).oninput = (e) => draw(e.target.value);
  $('[data-cancel]', L.el).onclick = () => L.close();
  $('#plist', L.el).onclick = (e) => {
    const b = e.target.closest('[data-id]'); if (!b) return;
    const it = itemById(b.dataset.id);
    L.close();
    openSpecialEditor(null, { name: it.name, desc: it.desc, ingr: it.ingr, price: it.price, oldPrice: null, portion: it.portion, media: it.media, steam: it.steam });
  };
}

function openSpecialEditor(id, prefill) {
  const s = id ? structuredClone(state.doc.specials.find((x) => x.id === id)) : {
    id: null, name: {}, desc: {}, ingr: {}, label: {}, price: '', oldPrice: null, portion: '', media: null, steam: false, active: true, from: '', to: '', days: [], ...(prefill || {}),
  };
  if (prefill) { s.oldPrice = s.price; s.price = ''; }
  const html = `
    <div class="sheet-head"><button class="btn ghost" data-cancel>Отмена</button><h2>${id ? 'Спецпредложение' : 'Новое спецпредложение'}</h2><button class="btn ghost" data-save style="font-weight:700">Готово</button></div>
    <form class="sheet-body" autocomplete="off">
      ${mediaBlock(s.media)}
      <div class="field"><div class="field-label">Язык</div>${langTabs('sp')}</div>
      ${i18nField('name', 'Название', s.name, { placeholder: 'Например: Сет «Супра» на двоих' })}
      ${i18nField('label', 'Надпись на ленточке', s.label, { placeholder: 'Блюдо дня · Новинка · −20%', hint: 'Если пусто — «Спецпредложение».' })}
      <div class="grid3">
        <div class="field"><label>Цена</label><div class="affix"><input class="input" name="price" inputmode="decimal" value="${esc(s.price)}" placeholder="0"><span>₾</span></div></div>
        <div class="field"><label>Старая цена</label><div class="affix"><input class="input" name="oldPrice" inputmode="decimal" value="${esc(s.oldPrice || '')}" placeholder="—"><span>₾</span></div></div>
        <div class="field"><label>Порция</label><input class="input" name="portion" value="${esc(s.portion || '')}"></div>
      </div>
      ${i18nField('desc', 'Описание', s.desc, { textarea: true })}
      ${i18nField('ingr', 'Состав', s.ingr, { textarea: true })}
      <div class="grid2">
        <div class="field"><label>Показывать с</label><input class="input" type="date" name="from" value="${esc(s.from)}"></div>
        <div class="field"><label>по (включительно)</label><input class="input" type="date" name="to" value="${esc(s.to)}"></div>
      </div>
      <div class="field"><label>Дни недели</label><div class="chips" data-days>${ORDER_DAYS.map((d) => `<button type="button" class="chip ${s.days.includes(d) ? 'on' : ''}" data-d="${d}">${DAYS[d]}</button>`).join('')}</div><div class="hint">Ничего не выбрано — показывается каждый день.</div></div>
      <div class="card">${sw('active', s.active, 'Показывать на сайте')}${sw('steam', s.steam, 'Эффект пара')}</div>
      ${id ? `<button type="button" class="btn danger" data-del style="width:100%">${icon('trash')}Удалить спецпредложение</button>` : ''}
    </form>`;
  const L = openLayer(html);
  const root = L.el;
  wireLangTabs(root);
  wireMedia(root, () => s.media, (m) => { s.media = m; });
  $$('[data-d]', root).forEach((b) => (b.onclick = () => { const d = +b.dataset.d; s.days = s.days.includes(d) ? s.days.filter((x) => x !== d) : [...s.days, d]; b.classList.toggle('on'); }));
  L.wrap._tryClose = () => { if (root.dataset.busy) return toast('Дождитесь окончания загрузки', 'err'); L.close(); };
  $('[data-cancel]', root).onclick = () => L.wrap._tryClose();
  $('[data-save]', root).onclick = async () => {
    if (root.dataset.busy) return toast('Дождитесь окончания загрузки', 'err');
    const f = $('form', root).elements;
    const special = { id: s.id, name: readI18n(root, 'name'), label: readI18n(root, 'label'), desc: readI18n(root, 'desc'), ingr: readI18n(root, 'ingr'),
      price: f.price.value, oldPrice: f.oldPrice.value, portion: f.portion.value, media: s.media, steam: f.steam.checked, active: f.active.checked,
      from: f.from.value, to: f.to.value, days: s.days };
    if (!['ru', 'en', 'ka'].some((l) => special.name[l])) return toast('Введите название', 'err');
    if (special.from && special.to && special.to < special.from) return toast('Дата окончания раньше начала', 'err');
    try { await doOp({ type: 'special.save', special }); L.close(); renderView(); } catch (e) { toast(e.message, 'err'); }
  };
  const del = $('[data-del]', root);
  if (del) del.onclick = async () => {
    if (!(await confirmBox('Удалить спецпредложение?'))) return;
    try { await doOp({ type: 'special.delete', id }); L.close(); renderView(); } catch (e) { toast(e.message, 'err'); }
  };
}

// ───────────────────────── НАСТРОЙКИ ─────────────────────────
const slider = (name, label, val, min, max) => `<div class="field"><label>${label}<span class="spacer"></span><b data-val="${name}">${Math.round(val * 100)}%</b></label><input type="range" class="range" name="${name}" min="${min}" max="${max}" step="0.05" value="${val}"></div>`;
function loadFonts(ty) {
  const fams = [state.fonts.heading[ty.heading]?.q, state.fonts.body[ty.body]?.q].filter(Boolean);
  if (!fams.length) return;
  const href = 'https://fonts.googleapis.com/css2?' + fams.map((f) => 'family=' + f).join('&') + '&display=swap';
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
}
function renderSettings(v, warn) {
  setTop('Настройки');
  const s = state.doc.settings;
  const ty = { heading: 'cormorant', body: 'inter', scale: 1, headingScale: 1, logoScale: 1, ...(s.typography || {}) };
  const posterPhotos = state.doc.items.filter((x) => x.media?.type === 'image' && x.media.src.includes('img.postershop.me')).length;
  v.innerHTML = warn + `
    <form id="settings-form" autocomplete="off">
      <div class="group-title">Главный экран</div>
      <div class="card">
        <div class="field"><div class="field-label">Язык</div>${langTabs('st')}</div>
        ${i18nField('eyebrow', 'Надпись над логотипом', s.eyebrow)}
        ${i18nField('heroTitle', 'Заголовок под логотипом (необязательно)', s.heroTitle, { placeholder: 'Например: Ресторан грузинской кухни', hint: 'Пусто — показывается только логотип, как сейчас.' })}
        ${i18nField('tagline', 'Слоган', s.tagline)}
        ${i18nField('heroText', 'Описание заведения (необязательно)', s.heroText, { textarea: true, placeholder: 'Пара предложений о ресторане, этажах, террасе…' })}
        ${i18nField('specialsTitle', 'Заголовок спецпредложений', s.specialsTitle)}
        ${i18nField('address', 'Адрес', s.address)}
      </div>
      <div class="group-title">Шрифты и размер текста</div>
      <div class="card" id="typo">
        <div class="grid2">
          <div class="field"><label>Шрифт заголовков</label><select class="select" name="fontHeading">${Object.entries(state.fonts.heading).map(([k, f]) => `<option value="${k}" ${ty.heading === k ? 'selected' : ''}>${esc(f.label)}</option>`).join('')}</select></div>
          <div class="field"><label>Шрифт текста</label><select class="select" name="fontBody">${Object.entries(state.fonts.body).map(([k, f]) => `<option value="${k}" ${ty.body === k ? 'selected' : ''}>${esc(f.label)}</option>`).join('')}</select></div>
        </div>
        ${slider('scale', 'Размер текста', ty.scale, 0.85, 1.3)}
        ${slider('headingScale', 'Размер заголовков', ty.headingScale, 0.8, 1.3)}
        ${slider('logoScale', 'Размер логотипа', ty.logoScale, 0.7, 1.6)}
        <div class="btn-row" style="margin:4px 0 12px">
          <button type="button" class="btn small secondary" data-typo="std">Как было</button>
          <button type="button" class="btn small secondary" data-typo="big">Крупнее — легче читать</button>
        </div>
        <div class="typo-preview" id="typo-preview">
          <div class="tp-kicker">01 · Горячие блюда</div>
          <div class="tp-title">Хачапури по-аджарски</div>
          <div class="tp-text">Лодочка из теста с сулугуни, яйцом и сливочным маслом · ხაჭაპური</div>
          <div class="tp-price">23 ₾</div>
        </div>
        <div class="hint">Размеры подстраиваются под экран автоматически: на телефоне и компьютере текст не наезжает и не обрезается. Грузинский текст всегда набирается шрифтом Noto Georgian.</div>
      </div>
      <div class="group-title">Контакты</div>
      <div class="card">
        <div class="grid2">
          <div class="field"><label>Телефон</label><input class="input" name="phone" value="${esc(s.phone)}" inputmode="tel"></div>
          <div class="field"><label>WhatsApp для брони</label><input class="input" name="whatsapp" value="${esc(s.whatsapp)}" inputmode="tel" placeholder="995595301133"></div>
          <div class="field"><label>Instagram</label><input class="input" name="instagram" value="${esc(s.instagram)}"></div>
          <div class="field"><label>Часы работы</label><input class="input" name="hours" value="${esc(s.hours)}"></div>
        </div>
      </div>
      <div class="group-title">Поведение сайта</div>
      <div class="card">
        <div class="field"><label>Позиции на стопе</label>
          <div class="seg" data-stopmode><button type="button" data-v="hide" class="${s.stoppedMode === 'hide' ? 'active' : ''}">Скрывать</button><button type="button" data-v="dim" class="${s.stoppedMode === 'dim' ? 'active' : ''}">Показывать серыми</button></div></div>
        <div class="field"><label>Язык по умолчанию</label><select class="select" name="defaultLang">${[['en', 'English'], ['ru', 'Русский'], ['ka', 'ქართული']].map(([k, l]) => `<option value="${k}" ${s.defaultLang === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <div class="hint">Гостю автоматически показывается язык его телефона (грузинский, русский или английский), этот — если язык не определился.</div></div>
      </div>
      <div class="group-title">Фоновое видео на главном экране</div>
      ${mediaBlock(s.heroVideo ? { type: 'video', ...s.heroVideo, srcLow: s.heroVideo.src } : null)}
      <button class="btn" type="submit" style="width:100%">Сохранить настройки</button>
    </form>

    <div class="group-title">Инструменты</div>
    <div class="list">
      <button class="row tap" data-tool="history"><div class="row-main"><div class="row-title">История изменений</div><div class="row-sub">Последние 40 действий — любое можно отменить</div></div>${icon('chev', 'chev')}</button>
      <button class="row tap" data-tool="export"><div class="row-main"><div class="row-title">Скачать резервную копию</div><div class="row-sub">Всё меню одним файлом</div></div>${icon('chev', 'chev')}</button>
      <label class="row tap"><div class="row-main"><div class="row-title">Восстановить из копии</div><div class="row-sub">Загрузить ранее скачанный файл</div></div>${icon('chev', 'chev')}<input type="file" accept="application/json,.json" hidden data-import></label>
      ${posterPhotos ? `<button class="row tap" data-tool="poster"><div class="row-main"><div class="row-title">Перенести фото из Poster (${posterPhotos})</div><div class="row-sub">Сжать и сохранить на нашем сервере — сайт станет быстрее и не будет зависеть от Poster</div></div>${icon('chev', 'chev')}</button>` : ''}
      <button class="row tap" data-tool="cleanup"><div class="row-main"><div class="row-title">Очистить неиспользуемые файлы</div><div class="row-sub">Удалить старые видео и фото, которых нет в меню и истории</div></div>${icon('chev', 'chev')}</button>
      <button class="row tap" data-logout2><div class="row-main"><div class="row-title" style="color:var(--danger)">Выйти</div></div></button>
    </div>`;
  const form = $('#settings-form');
  wireLangTabs(form);
  // живой предпросмотр шрифтов
  const typo = () => {
    const f = form.elements;
    return { heading: f.fontHeading.value, body: f.fontBody.value, scale: +f.scale.value, headingScale: +f.headingScale.value, logoScale: +f.logoScale.value };
  };
  const drawTypo = () => {
    const t = typo();
    loadFonts(t);
    const p = $('#typo-preview');
    p.style.setProperty('--ph', state.fonts.heading[t.heading].css);
    p.style.setProperty('--pb', state.fonts.body[t.body].css);
    p.style.setProperty('--fs', t.scale); p.style.setProperty('--fh', t.headingScale);
    for (const k of ['scale', 'headingScale', 'logoScale']) $(`[data-val="${k}"]`, form).textContent = Math.round(t[k] * 100) + '%';
  };
  $('#typo').addEventListener('input', drawTypo);
  $('#typo').addEventListener('change', drawTypo);
  $$('[data-typo]', form).forEach((b) => (b.onclick = () => {
    const f = form.elements;
    const p = b.dataset.typo === 'big' ? { scale: 1.15, headingScale: 1.1 } : { scale: 1, headingScale: 1, logoScale: 1 };
    for (const [k, v2] of Object.entries(p)) f[k].value = v2;
    drawTypo();
  }));
  drawTypo();
  let stopMode = s.stoppedMode;
  $$('[data-stopmode] button', form).forEach((b) => (b.onclick = () => { stopMode = b.dataset.v; $$('[data-stopmode] button', form).forEach((x) => x.classList.toggle('active', x === b)); }));
  let hero = s.heroVideo ? { type: 'video', ...s.heroVideo } : null;
  wireMedia(form, () => hero, (m) => { hero = m && m.type === 'video' ? m : null; if (m && m.type !== 'video') toast('Для фона нужно видео', 'err'); });
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (form.dataset.busy) return toast('Дождитесь окончания загрузки', 'err');
    const f = form.elements;
    const settings = {
      eyebrow: readI18n(form, 'eyebrow'), tagline: readI18n(form, 'tagline'), specialsTitle: readI18n(form, 'specialsTitle'), address: readI18n(form, 'address'),
      phone: f.phone.value, whatsapp: f.whatsapp.value, instagram: f.instagram.value, hours: f.hours.value,
      stoppedMode: stopMode, defaultLang: f.defaultLang.value,
      heroTitle: readI18n(form, 'heroTitle'), heroText: readI18n(form, 'heroText'), typography: typo(),
      heroVideo: hero ? { src: hero.srcLow || hero.src, poster: hero.poster, blur: hero.blur, soft: hero.soft === true } : null,
    };
    try { await doOp({ type: 'settings.save', settings }); } catch (er) { toast(er.message, 'err'); }
  };
  $('[data-logout2]').onclick = logout;
  $('[data-tool="history"]').onclick = openHistory;
  $('[data-tool="export"]').onclick = async () => {
    const r = await fetch('/api/admin/export', { headers: { 'x-qalaqshi': '1' } });
    if (!r.ok) return toast('Не удалось скачать', 'err');
    const b = await r.blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `qalaqshi-menu-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  $('[data-import]').onchange = async (e) => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    let doc;
    try { doc = JSON.parse(await file.text()); } catch { return toast('Файл повреждён', 'err'); }
    if (!(await confirmBox(`Заменить текущее меню содержимым файла «${file.name}»? Текущее состояние останется в истории.`, 'Восстановить', false))) return;
    try { await doOp({ type: 'doc.import', doc }); renderView(); } catch (er) { toast(er.message, 'err'); }
  };
  $('[data-tool="cleanup"]').onclick = async () => {
    if (!(await confirmBox('Удалить из хранилища файлы, которые больше нигде не используются (старше суток)?', 'Очистить', false))) return;
    try { const r = await api('cleanup', {}); toast(`Удалено файлов: ${r.deleted}`, 'ok'); } catch (er) { toast(er.message, 'err'); }
  };
  const pb = $('[data-tool="poster"]');
  if (pb) pb.onclick = importPosterPhotos;
}

async function openHistory() {
  const html = `<div class="sheet-head"><span style="width:70px"></span><h2>История изменений</h2><button class="btn ghost" data-cancel>Закрыть</button></div><div class="sheet-body"><div class="boot" style="min-height:200px"><div class="spinner"></div></div></div>`;
  const L = openLayer(html);
  $('[data-cancel]', L.el).onclick = () => L.close();
  try {
    const { history } = await api('history');
    $('.sheet-body', L.el).innerHTML = history.length ? `<div class="hint" style="margin:0 4px 12px">«Отменить» вернёт меню в состояние до этого действия.</div><div class="list">${history.map((h) => `
      <div class="row history-row"><div class="row-main"><div class="row-title">${esc(h.note)}</div><div class="row-sub">${new Date(h.at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${h.who === 'staff' ? 'персонал' : h.who === 'restore' ? 'откат' : 'администратор'}</div></div>
      <button class="btn small secondary" data-restore="${h.i}">Отменить</button></div>`).join('')}</div>` : '<div class="empty">История пуста</div>';
    $$('[data-restore]', L.el).forEach((b) => (b.onclick = async () => {
      if (!(await confirmBox('Вернуть меню к состоянию до этого действия? Все более поздние изменения тоже откатятся.', 'Вернуть', false))) return;
      try { const r = await api('restore', { i: +b.dataset.restore }); state.doc = r.doc; toast('Готово: ' + r.note, 'ok'); L.close(); renderView(); } catch (e) { toast(e.message, 'err'); }
    }));
  } catch (e) { $('.sheet-body', L.el).innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

async function importPosterPhotos() {
  const items = state.doc.items.filter((x) => x.media?.type === 'image' && x.media.src.includes('img.postershop.me'));
  if (!(await confirmBox(`Перенести ${items.length} фото на наш сервер? Это займёт 1–3 минуты, не закрывайте страницу.`, 'Перенести', false))) return;
  const html = `<div class="sheet-head"><span></span><h2>Перенос фото</h2><span></span></div><div class="sheet-body"><div class="progress"><div class="progress-bar"><i></i></div><div class="progress-label"><span data-plabel>Начинаем…</span><span data-ppct></span></div></div></div>`;
  const L = openLayer(html);
  L.wrap._tryClose = () => {};
  const map = {};
  let ok = 0, fail = 0;
  for (const [i, it] of items.entries()) {
    $('[data-plabel]', L.el).textContent = `${i + 1} из ${items.length}: ${nm(it.name)}`;
    $('.progress-bar i', L.el).style.width = Math.round((i / items.length) * 100) + '%';
    try {
      const r = await fetch('/api/admin/proxy-image?url=' + encodeURIComponent(it.media.src), { headers: { 'x-qalaqshi': '1' } });
      if (!r.ok) throw new Error();
      const blob = await r.blob();
      map[it.id] = await uploadImage(blob, null, { maxSide: 1024, name: it.id });
      ok++;
    } catch { fail++; }
    if (Object.keys(map).length >= 15 || i === items.length - 1) {
      if (Object.keys(map).length) await doOp({ type: 'items.media', map: { ...map } }, { quiet: true }).catch((e) => toast(e.message, 'err'));
      for (const k of Object.keys(map)) delete map[k];
    }
  }
  L.close();
  toast(`Перенесено: ${ok}${fail ? `, не удалось: ${fail}` : ''}`, fail ? 'err' : 'ok');
  renderView();
}

// ───────────────────────── СТАРТ ─────────────────────────
addEventListener('scroll', () => $('#topbar')?.classList.toggle('scrolled', scrollY > 4), { passive: true });
(async () => {
  try {
    const me = await api('me');
    state.status = me.status;
    if (!me.status.auth) { $('#app').innerHTML = `<div class="login"><div class="login-card"><h1>Админ-панель не настроена</h1><p>Добавьте переменную <span class="kbd">ADMIN_PASSWORD</span> в Vercel → Settings → Environment Variables и сделайте Redeploy.</p></div></div>`; return; }
    if (!me.role) return renderLogin();
    state.role = me.role;
    await loadAll();
  } catch (e) { renderLogin(e.message); }
})();
