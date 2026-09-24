// Модель меню: исходные данные, валидация, операции админки, публичное представление.
import { CATEGORIES, ROWS, BAR_GROUPS, POSTER_IMG } from './seed-data.js';

export const LANGS = ['ka', 'ru', 'en'];
export const TZ_OFFSET_MIN = 240; // Тбилиси, UTC+4 (без перехода на летнее время)
export const DAY_RESET_HOUR = 6;  // «стоп до конца дня» снимается в 06:00 по Тбилиси

export const BADGES = {
  hit:   { ka: 'პოპულარული', ru: 'Хит', en: 'Popular' },
  new:   { ka: 'ახალი', ru: 'Новинка', en: 'New' },
  chef:  { ka: 'შეფის რჩევა', ru: 'Выбор шефа', en: "Chef's choice" },
  house: { ka: 'სახლის რეცეპტი', ru: 'Рецепт дома', en: 'House recipe' },
  spicy: { ka: 'ცხარე', ru: 'Острое', en: 'Spicy' },
  veg:   { ka: 'ვეგეტარიანული', ru: 'Вегетарианское', en: 'Vegetarian' },
  vegan: { ka: 'ვეგანური', ru: 'Веганское', en: 'Vegan' },
  lent:  { ka: 'სამარხვო', ru: 'Постное', en: 'Lenten' },
};

const SEED_MEDIA = {
  19: {
    type: 'video', src: '/media/pkhali-v2-720.mp4', srcLow: '/media/pkhali-v2-480.mp4', srcHi: '/media/pkhali-v2-1080.mp4', poster: '/media/pkhali-v2-poster.webp',
    blur: 'data:image/webp;base64,UklGRogAAABXRUJQVlA4IHwAAADwAwCdASoMABUAPt1apkyopSOiMAgBEBuJQBOmUAAlUopRb/3nae8AAP6sBmp3CuL45Dib9DImL5vuGu22MAM/yi+lDfvw54G19XIlOdMVCcoJCX+Dw1EyVxZPZS86bvs1GLU6+LHxCtpUG7G1n+jdMNAzLMg+oA2IAAAA',
    w: 720, h: 1280, dur: 6.2, focus: { x: 0.516, y: 0.608, s: 0.49 },
    bytes: { src: 2755587, srcLow: 1136125, srcHi: 5201727 },
  },
  85: {
    type: 'video', src: '/media/mtsvadi-v2-720.mp4', srcLow: '/media/mtsvadi-v2-480.mp4', srcHi: '/media/mtsvadi-v2-1080.mp4', poster: '/media/mtsvadi-v2-poster.webp',
    blur: 'data:image/webp;base64,UklGRoQAAABXRUJQVlA4IHgAAADwAwCdASoMABUAPt1apkyopSOiMAgBEBuJQBai4AAkV8bySL9UmyAAAP03kd5oZIPGKV8kMqSd4/2wokWvglY52H/9ceNVvxxPIUE63kFJ7g0C8EgbRZ2eWxK0aw95DOrJFFdaWfoEnjThcPEtc14kW48HdQczwAA=',
    w: 720, h: 1280, dur: 6.8, focus: { x: 0.505, y: 0.675, s: 0.518 },
    bytes: { src: 2951338, srcLow: 1207636, srcHi: 5586483 },
  },
};

const SEED_TEXT = {
  19: {
    desc: {
      ru: 'Три вида пхали из свежих овощей и зелени с грецким орехом и грузинскими специями.',
      en: 'Three kinds of pkhali made from fresh vegetables and greens with walnuts and Georgian spices.',
      ka: 'სამი სახის ფხალი ახალი ბოსტნეულითა და მწვანილით, ნიგვზითა და ქართული სანელებლებით.',
    },
    ingr: {
      ru: 'Шпинат · свёкла · грецкий орех · чеснок · кинза · специи · зёрна граната',
      en: 'Spinach · beetroot · walnuts · garlic · coriander · spices · pomegranate seeds',
      ka: 'ისპანახი · ჭარხალი · ნიგოზი · ნიორი · ქინძი · სანელებლები · ბროწეული',
    },
  },
  85: {
    desc: {
      ru: 'Сочная свинина, приготовленная на углях, с маринованным луком.',
      en: 'Juicy pork grilled over charcoal, served with pickled onion.',
      ka: 'წვნიანი ღორის ხორცი ნახშირზე, დამარინადებული ხახვით.',
    },
    ingr: {
      ru: 'Свинина · лук · специи',
      en: 'Pork · onion · spices',
      ka: 'ღორის ხორცი · ხახვი · სანელებლები',
    },
  },
};

export const DEFAULT_SETTINGS = {
  defaultLang: 'en',
  stoppedMode: 'hide', // hide — скрывать позиции на стопе; dim — показывать серыми с пометкой
  currency: '₾',
  phone: '595 30 11 33',
  whatsapp: '995595301133',
  instagram: 'https://www.instagram.com/qalaqshi.restaurant',
  hours: '11:00 – 03:00',
  address: { ka: 'თბილისი, საქართველო', ru: 'Тбилиси, Грузия', en: 'Tbilisi, Georgia' },
  eyebrow: { ka: 'ავთენტური ქართული სამზარეულო', ru: 'Аутентичная грузинская кухня', en: 'Authentic Georgian Cuisine' },
  tagline: { ka: 'სადაც ტრადიცია გემოში ცხოვრობს', ru: 'Где традиция живёт в каждом вкусе', en: 'Where tradition lives in every taste' },
  specialsTitle: { ka: 'სპეციალური შეთავაზება', ru: 'Спецпредложения', en: 'Special offers' },
  heroTitle: { ka: '', ru: '', en: '' },
  heroText: { ka: '', ru: '', en: '' },
  typography: { heading: 'cormorant', body: 'inter', scale: 1, headingScale: 1, logoScale: 1 },
  heroVideo: { src: '/media/hero-v2.mp4', poster: '/media/hero-v2-poster.webp', blur: 'data:image/webp;base64,UklGRnoAAABXRUJQVlA4IG4AAADQAwCdASoMABUAPt1apkyopSOiMAgBEBuJQBdmUABTPpHNK84+iQAA/TeR3mhWkMeGVFxT3eeGNz9eYzcQO32gbKa8YaFzr3SzI9XCaMUw5ui00JxME8XpGVaQzcs/T1V/VkZ/vNFv4r/UzmIAAA==', soft: true },
};

// Шрифты, доступные в админке (все с кириллицей; для грузинского всегда подключается Noto Georgian)
export const FONTS = {
  heading: {
    cormorant: { label: 'Cormorant Garamond', family: 'Cormorant Garamond', css: "'Cormorant Garamond', 'Noto Serif Georgian', Georgia, serif", q: 'Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400' },
    playfair: { label: 'Playfair Display', family: 'Playfair Display', css: "'Playfair Display', 'Noto Serif Georgian', Georgia, serif", q: 'Playfair+Display:ital,wght@0,400;0,500;0,600;1,400' },
    lora: { label: 'Lora', family: 'Lora', css: "'Lora', 'Noto Serif Georgian', Georgia, serif", q: 'Lora:ital,wght@0,400;0,500;0,600;1,400' },
    garamond: { label: 'EB Garamond', family: 'EB Garamond', css: "'EB Garamond', 'Noto Serif Georgian', Georgia, serif", q: 'EB+Garamond:ital,wght@0,400;0,500;0,600;1,400' },
    prata: { label: 'Prata', family: 'Prata', css: "'Prata', 'Noto Serif Georgian', Georgia, serif", q: 'Prata' },
    forum: { label: 'Forum', family: 'Forum', css: "'Forum', 'Noto Serif Georgian', Georgia, serif", q: 'Forum' },
    montserrat: { label: 'Montserrat (без засечек)', family: 'Montserrat', css: "'Montserrat', 'Noto Sans Georgian', system-ui, sans-serif", q: 'Montserrat:wght@300;400;500;600' },
  },
  body: {
    inter: { label: 'Inter', family: 'Inter', css: "'Inter', 'Noto Sans Georgian', -apple-system, system-ui, sans-serif", q: 'Inter:wght@300;400;500;600' },
    manrope: { label: 'Manrope', family: 'Manrope', css: "'Manrope', 'Noto Sans Georgian', -apple-system, system-ui, sans-serif", q: 'Manrope:wght@300;400;500;600' },
    montserrat: { label: 'Montserrat', family: 'Montserrat', css: "'Montserrat', 'Noto Sans Georgian', -apple-system, system-ui, sans-serif", q: 'Montserrat:wght@300;400;500;600' },
    raleway: { label: 'Raleway', family: 'Raleway', css: "'Raleway', 'Noto Sans Georgian', -apple-system, system-ui, sans-serif", q: 'Raleway:wght@300;400;500;600' },
    roboto: { label: 'Roboto', family: 'Roboto', css: "'Roboto', 'Noto Sans Georgian', -apple-system, system-ui, sans-serif", q: 'Roboto:wght@300;400;500' },
    system: { label: 'Системный (как на iPhone)', family: '', css: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans Georgian', system-ui, sans-serif", q: '' },
  },
};

// старые исходные ролики заменены более качественными версиями (новые имена — чтобы обойти кэш браузеров)
const MEDIA_MIGRATE = {
  '/media/pkhali-720.mp4': SEED_MEDIA[19],
  '/media/mtsvadi-720.mp4': SEED_MEDIA[85],
};

// ───────────────────────── helpers ─────────────────────────
const str = (v, max = 300) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const text = (v, max = 1200) => (typeof v === 'string' ? v.replace(/\r/g, '').trim().slice(0, max) : '');
export const i18n = (v, max = 300, multiline = false) => {
  const f = multiline ? text : str;
  const o = {};
  for (const l of LANGS) o[l] = f(v && v[l], max);
  return o;
};
const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n >= 0 && n < 1e6 ? Math.round(n * 100) / 100 : null;
};
const bool = (v) => v === true;
const safeUrl = (v) => {
  const s = str(v, 1000);
  if (!s) return '';
  if (s.startsWith('/') && !s.startsWith('//')) return s;
  try { const u = new URL(s); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; }
};
const dateStr = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');
export const newId = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const slugId = (v) => str(v, 40).toLowerCase().replace(/[^a-z0-9_-]/g, '');

export function cleanMedia(m) {
  if (!m || typeof m !== 'object') return null;
  const type = m.type === 'video' ? 'video' : m.type === 'image' ? 'image' : null;
  if (!type) return null;
  const src = safeUrl(m.src);
  if (!src) return null;
  const out = { type, src };
  const srcLow = safeUrl(m.srcLow); if (srcLow) out.srcLow = srcLow;
  const srcHi = safeUrl(m.srcHi); if (srcHi) out.srcHi = srcHi;
  const poster = safeUrl(m.poster); if (poster) out.poster = poster;
  if (typeof m.blur === 'string' && m.blur.startsWith('data:image/') && m.blur.length < 3000) out.blur = m.blur;
  const w = num(m.w), h = num(m.h), dur = num(m.dur);
  if (w) out.w = Math.round(w);
  if (h) out.h = Math.round(h);
  if (dur) out.dur = dur;
  // где на кадре блюдо (0..1) — для кадрирования и эффекта пара
  if (m.focus && typeof m.focus === 'object') {
    const f = (v, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(1, Math.max(0, Math.round(n * 1000) / 1000)) : d; };
    out.focus = { x: f(m.focus.x, 0.5), y: f(m.focus.y, 0.6), s: f(m.focus.s, 0.5) };
  }
  if (m.bytes && typeof m.bytes === 'object') {
    const b = {};
    for (const k of ['src', 'srcLow', 'srcHi']) { const n = Number(m.bytes[k]); if (Number.isFinite(n) && n > 0) b[k] = Math.round(n); }
    if (Object.keys(b).length) out.bytes = b;
  }
  return MEDIA_MIGRATE[out.src] ? { ...out, ...MEDIA_MIGRATE[out.src] } : out;
}

// ───────────────────────── seed ─────────────────────────
export function buildSeed() {
  const cats = CATEGORIES.map((c) => ({
    id: c.id, section: c.section, group: c.group || '', display: c.display || (c.section === 'bar' ? 'list' : 'video'),
    steam: !!c.steam, hidden: false, name: { ...c.name },
  }));
  const catById = Object.fromEntries(cats.map((c) => [c.id, c]));
  const items = ROWS.map(([pos, cat, price, ka, ru, en, portion, photo]) => {
    const it = {
      id: 'p' + pos, pos, cat, price,
      name: { ka, ru, en },
      desc: { ka: '', ru: '', en: '' },
      ingr: { ka: '', ru: '', en: '' },
      portion: portion || '',
      badges: [],
      media: null,
      steam: catById[cat].steam,
      hidden: false,
      stop: null,
    };
    if (SEED_TEXT[pos]) { it.desc = { ...SEED_TEXT[pos].desc }; it.ingr = { ...SEED_TEXT[pos].ingr }; }
    if (SEED_MEDIA[pos]) it.media = { ...SEED_MEDIA[pos] };
    else if (photo && catById[cat].section === 'kitchen') it.media = { type: 'image', src: POSTER_IMG + photo, w: 640, h: 480 };
    return it;
  });
  // позиции с видео — первыми в своей категории
  const rank = (x) => (x.media?.type === 'video' ? 0 : 1);
  const catOrder = Object.fromEntries(cats.map((c, i) => [c.id, i]));
  const idx = new Map(items.map((x, i) => [x, i]));
  items.sort((a, b) => catOrder[a.cat] - catOrder[b.cat] || rank(a) - rank(b) || idx.get(a) - idx.get(b));
  return {
    rev: 1,
    updatedAt: new Date().toISOString(),
    settings: structuredClone(DEFAULT_SETTINGS),
    groups: BAR_GROUPS.map((g) => ({ id: g.id, art: g.art, name: { ...g.name } })),
    categories: cats,
    items,
    specials: [],
  };
}

// ───────────────────────── normalize ─────────────────────────
function cleanItem(raw, cats, prev) {
  const catIds = new Set(cats.map((c) => c.id));
  const it = {
    id: prev?.id || slugId(raw.id) || newId('i'),
    pos: prev?.pos ?? (Number.isInteger(raw.pos) ? raw.pos : null),
    cat: catIds.has(raw.cat) ? raw.cat : (prev?.cat || cats[0].id),
    price: num(raw.price) ?? 0,
    oldPrice: num(raw.oldPrice),
    name: i18n(raw.name, 160),
    desc: i18n(raw.desc, 900, true),
    ingr: i18n(raw.ingr, 600, true),
    portion: str(raw.portion, 40),
    badges: Array.isArray(raw.badges) ? [...new Set(raw.badges.filter((b) => BADGES[b]))] : [],
    media: cleanMedia(raw.media),
    place: ['big', 'compact'].includes(raw.place) ? raw.place : 'auto',
    steam: bool(raw.steam),
    hidden: bool(raw.hidden),
    stop: raw.stop && typeof raw.stop === 'object' ? { until: typeof raw.stop.until === 'string' ? raw.stop.until : null } : null,
  };
  if (!it.oldPrice || it.oldPrice <= it.price) it.oldPrice = null;
  if (!LANGS.some((l) => it.name[l])) throw new Error('Укажите название хотя бы на одном языке');
  return it;
}

function cleanSpecial(raw, prev) {
  const s = {
    id: prev?.id || slugId(raw.id) || newId('s'),
    name: i18n(raw.name, 160),
    desc: i18n(raw.desc, 900, true),
    ingr: i18n(raw.ingr, 600, true),
    price: num(raw.price) ?? 0,
    oldPrice: num(raw.oldPrice),
    portion: str(raw.portion, 40),
    label: i18n(raw.label, 40),
    media: cleanMedia(raw.media),
    steam: bool(raw.steam),
    active: raw.active !== false,
    from: dateStr(raw.from),
    to: dateStr(raw.to),
    days: Array.isArray(raw.days) ? [...new Set(raw.days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))] : [],
  };
  if (!s.oldPrice || s.oldPrice <= s.price) s.oldPrice = null;
  if (!LANGS.some((l) => s.name[l])) throw new Error('Укажите название спецпредложения');
  return s;
}

function cleanCategory(raw, prev, groups) {
  const section = raw.section === 'bar' ? 'bar' : 'kitchen';
  const display = section === 'bar' ? 'list' : (raw.display === 'compact' ? 'compact' : 'video');
  const c = {
    id: prev?.id || slugId(raw.id) || newId('c'),
    section,
    group: section === 'bar' ? (groups.some((g) => g.id === raw.group) ? raw.group : (groups[0]?.id || '')) : '',
    display,
    rail: raw.rail !== false,
    steam: bool(raw.steam),
    hidden: bool(raw.hidden),
    name: i18n(raw.name, 80),
  };
  if (!LANGS.some((l) => c.name[l])) throw new Error('Укажите название категории');
  return c;
}

function cleanSettings(raw, prev) {
  const s = { ...DEFAULT_SETTINGS, ...prev };
  if (raw.defaultLang && LANGS.includes(raw.defaultLang)) s.defaultLang = raw.defaultLang;
  if (raw.stoppedMode === 'hide' || raw.stoppedMode === 'dim') s.stoppedMode = raw.stoppedMode;
  for (const k of ['phone', 'hours']) if (k in raw) s[k] = str(raw[k], 60);
  if ('whatsapp' in raw) s.whatsapp = str(raw.whatsapp, 20).replace(/\D/g, '');
  if ('instagram' in raw) s.instagram = safeUrl(raw.instagram);
  for (const k of ['address', 'eyebrow', 'tagline', 'specialsTitle', 'heroTitle']) if (k in raw) s[k] = i18n(raw[k], 160);
  if ('heroText' in raw) s.heroText = i18n(raw.heroText, 500, true);
  if (raw.typography && typeof raw.typography === 'object') {
    const t = raw.typography, cur = s.typography || DEFAULT_SETTINGS.typography;
    const range = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n * 100) / 100)) : d; };
    s.typography = {
      heading: FONTS.heading[t.heading] ? t.heading : cur.heading,
      body: FONTS.body[t.body] ? t.body : cur.body,
      scale: range(t.scale, 0.85, 1.3, cur.scale),
      headingScale: range(t.headingScale, 0.8, 1.3, cur.headingScale),
      logoScale: range(t.logoScale, 0.7, 1.6, cur.logoScale),
    };
  }
  if ('heroVideo' in raw) {
    const m = cleanMedia(raw.heroVideo ? { type: 'video', ...raw.heroVideo } : null);
    s.heroVideo = m ? { src: m.src, poster: m.poster || '', blur: m.blur || '', soft: raw.heroVideo.soft === true } : null;
    if (s.heroVideo && s.heroVideo.src === '/media/hero-bg.mp4') s.heroVideo = { ...DEFAULT_SETTINGS.heroVideo };
  }
  return s;
}

export function normalizeDoc(doc) {
  if (!doc || typeof doc !== 'object' || !Array.isArray(doc.items) || !Array.isArray(doc.categories)) {
    throw new Error('Неверный формат меню');
  }
  const groups = (Array.isArray(doc.groups) && doc.groups.length ? doc.groups : BAR_GROUPS).map((g) => ({
    id: slugId(g.id) || newId('g'),
    art: (BAR_GROUPS.some((b) => b.art === g.art) ? g.art : '') || '',
    artUrl: safeUrl(g.artUrl),
    name: i18n(g.name, 80),
  }));
  const categories = doc.categories.map((c) => ({ ...cleanCategory(c, null, groups), id: slugId(c.id) || newId('c') }));
  const items = [];
  const seen = new Set();
  for (const raw of doc.items) {
    try {
      const it = cleanItem(raw, categories, null);
      it.id = slugId(raw.id) || it.id;
      if (seen.has(it.id)) it.id = newId('i');
      seen.add(it.id);
      if (Number.isInteger(raw.pos)) it.pos = raw.pos;
      items.push(it);
    } catch { /* пропускаем битые позиции */ }
  }
  const specials = [];
  for (const raw of Array.isArray(doc.specials) ? doc.specials : []) {
    try { const s = cleanSpecial(raw, null); s.id = slugId(raw.id) || s.id; specials.push(s); } catch { /* skip */ }
  }
  return {
    rev: Number.isInteger(doc.rev) ? doc.rev : 1,
    updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : new Date().toISOString(),
    settings: cleanSettings(doc.settings || {}, {}),
    groups, categories, items, specials,
  };
}

// ───────────────────────── time helpers ─────────────────────────
export function nextDayReset(now = Date.now()) {
  const local = new Date(now + TZ_OFFSET_MIN * 60000);
  const reset = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), DAY_RESET_HOUR, 0, 0));
  if (local >= reset) reset.setUTCDate(reset.getUTCDate() + 1);
  return new Date(reset.getTime() - TZ_OFFSET_MIN * 60000).toISOString();
}
export function isStopped(it, now = Date.now()) {
  if (!it.stop) return false;
  if (!it.stop.until) return true;
  return Date.parse(it.stop.until) > now;
}
export function tbilisiToday(now = Date.now()) {
  const d = new Date(now + TZ_OFFSET_MIN * 60000);
  return { date: d.toISOString().slice(0, 10), dow: d.getUTCDay() };
}
export function specialLive(s, now = Date.now()) {
  if (!s.active) return false;
  const { date, dow } = tbilisiToday(now);
  if (s.from && date < s.from) return false;
  if (s.to && date > s.to) return false;
  if (s.days && s.days.length && !s.days.includes(dow)) return false;
  return true;
}

// ───────────────────────── operations ─────────────────────────
export const STAFF_OPS = new Set(['item.stop']);

function label(it) { return it?.name?.ru || it?.name?.en || it?.name?.ka || ''; }

function moveInList(list, id, dir, sameGroup) {
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) throw new Error('Не найдено');
  let j = i + dir;
  while (j >= 0 && j < list.length && !sameGroup(list[i], list[j])) j += dir;
  if (j < 0 || j >= list.length) return false;
  const [x] = list.splice(i, 1);
  list.splice(j, 0, x);
  return true;
}

function reorder(list, ids, inScope) {
  const scoped = list.filter(inScope);
  const byId = new Map(scoped.map((x) => [x.id, x]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
  for (const x of scoped) if (!ordered.includes(x)) ordered.push(x);
  let k = 0;
  return list.map((x) => (inScope(x) ? ordered[k++] : x));
}

/** Применяет операцию. Возвращает { doc, note } — note для истории изменений. */
export function applyOp(doc, op, now = Date.now()) {
  const d = structuredClone(doc);
  let note = '';
  switch (op.type) {
    case 'item.save': {
      const raw = op.item || {};
      const prevIdx = raw.id ? d.items.findIndex((x) => x.id === raw.id) : -1;
      const prev = prevIdx >= 0 ? d.items[prevIdx] : null;
      const it = cleanItem(raw, d.categories, prev);
      if (prev) {
        if (prev.cat !== it.cat) {
          d.items.splice(prevIdx, 1);
          insertAtCategoryEnd(d.items, it);
        } else d.items[prevIdx] = it;
        note = 'Изменено: ' + label(it);
      } else {
        insertAtCategoryEnd(d.items, it);
        note = 'Добавлено: ' + label(it);
      }
      op._id = it.id;
      break;
    }
    case 'item.delete': {
      const i = d.items.findIndex((x) => x.id === op.id);
      if (i < 0) throw new Error('Блюдо не найдено');
      note = 'Удалено: ' + label(d.items[i]);
      d.items.splice(i, 1);
      break;
    }
    case 'item.stop': {
      const it = d.items.find((x) => x.id === op.id);
      if (!it) throw new Error('Позиция не найдена');
      if (op.mode === 'off') { it.stop = null; note = 'Снято со стопа: ' + label(it); }
      else if (op.mode === 'day') { it.stop = { until: nextDayReset(now) }; note = 'Стоп до утра: ' + label(it); }
      else if (op.mode === 'until') {
        const t = Date.parse(op.until);
        if (!Number.isFinite(t) || t <= now) throw new Error('Выберите время в будущем');
        it.stop = { until: new Date(t).toISOString() }; note = 'Стоп до ' + op.until + ': ' + label(it);
      } else { it.stop = { until: null }; note = 'Стоп: ' + label(it); }
      break;
    }
    case 'item.move': {
      const it = d.items.find((x) => x.id === op.id);
      if (!it) throw new Error('Позиция не найдена');
      moveInList(d.items, op.id, op.dir < 0 ? -1 : 1, (a, b) => a.cat === b.cat);
      note = 'Порядок: ' + label(it);
      break;
    }
    case 'items.reorder': {
      d.items = reorder(d.items, op.order || [], (x) => x.cat === op.cat);
      note = 'Порядок блюд';
      break;
    }
    case 'items.media': {
      // пакетная замена медиа (перенос фото из Poster)
      let n = 0;
      for (const [id, m] of Object.entries(op.map || {})) {
        const it = d.items.find((x) => x.id === id);
        const media = cleanMedia(m);
        if (it && media) { it.media = media; n++; }
      }
      note = 'Фото перенесены: ' + n;
      break;
    }
    case 'items.place': {
      const place = ['big', 'compact', 'auto'].includes(op.place) ? op.place : 'auto';
      let n = 0;
      for (const it of d.items) if (it.cat === op.cat) { it.place = place; n++; }
      note = 'Размещение блюд (' + n + ')';
      break;
    }
    case 'cat.save': {
      const raw = op.cat || {};
      const i = raw.id ? d.categories.findIndex((c) => c.id === raw.id) : -1;
      const c = cleanCategory(raw, i >= 0 ? d.categories[i] : null, d.groups);
      if (i >= 0) d.categories[i] = c; else d.categories.push(c);
      note = (i >= 0 ? 'Категория изменена: ' : 'Новая категория: ') + label(c);
      op._id = c.id;
      break;
    }
    case 'cat.delete': {
      if (d.items.some((x) => x.cat === op.id)) throw new Error('Сначала перенесите или удалите блюда из этой категории');
      const i = d.categories.findIndex((c) => c.id === op.id);
      if (i < 0) throw new Error('Категория не найдена');
      note = 'Категория удалена: ' + label(d.categories[i]);
      d.categories.splice(i, 1);
      break;
    }
    case 'cat.move': {
      const c = d.categories.find((x) => x.id === op.id);
      if (!c) throw new Error('Категория не найдена');
      moveInList(d.categories, op.id, op.dir < 0 ? -1 : 1, (a, b) => a.section === b.section);
      note = 'Порядок категорий';
      break;
    }
    case 'group.save': {
      const g = d.groups.find((x) => x.id === op.group?.id);
      if (!g) throw new Error('Раздел бара не найден');
      g.name = i18n(op.group.name, 80);
      g.artUrl = safeUrl(op.group.artUrl);
      note = 'Раздел бара: ' + label(g);
      break;
    }
    case 'group.move': {
      moveInList(d.groups, op.id, op.dir < 0 ? -1 : 1, () => true);
      note = 'Порядок разделов бара';
      break;
    }
    case 'special.save': {
      const raw = op.special || {};
      const i = raw.id ? d.specials.findIndex((s) => s.id === raw.id) : -1;
      const s = cleanSpecial(raw, i >= 0 ? d.specials[i] : null);
      if (i >= 0) d.specials[i] = s; else d.specials.push(s);
      note = (i >= 0 ? 'Спецпредложение изменено: ' : 'Новое спецпредложение: ') + label(s);
      op._id = s.id;
      break;
    }
    case 'special.delete': {
      const i = d.specials.findIndex((s) => s.id === op.id);
      if (i < 0) throw new Error('Не найдено');
      note = 'Спецпредложение удалено: ' + label(d.specials[i]);
      d.specials.splice(i, 1);
      break;
    }
    case 'special.move': {
      moveInList(d.specials, op.id, op.dir < 0 ? -1 : 1, () => true);
      note = 'Порядок спецпредложений';
      break;
    }
    case 'settings.save': {
      d.settings = cleanSettings(op.settings || {}, d.settings);
      note = 'Настройки';
      break;
    }
    case 'doc.import': {
      const imported = normalizeDoc(op.doc);
      imported.rev = d.rev;
      Object.assign(d, imported);
      note = typeof op.note === 'string' ? op.note : 'Восстановлено из резервной копии';
      break;
    }
    default:
      throw new Error('Неизвестная операция');
  }
  d.rev = (d.rev || 0) + 1;
  d.updatedAt = new Date(now).toISOString();
  return { doc: d, note };
}

function insertAtCategoryEnd(items, it) {
  let last = -1;
  items.forEach((x, i) => { if (x.cat === it.cat) last = i; });
  if (last < 0) items.push(it); else items.splice(last + 1, 0, it);
}

// ───────────────────────── публичное представление ─────────────────────────
/** Только то, что нужно гостю: без скрытых позиций, без служебных полей. */
export function publicView(doc) {
  const cats = doc.categories.filter((c) => !c.hidden);
  const catIds = new Set(cats.map((c) => c.id));
  const items = doc.items
    .filter((it) => !it.hidden && catIds.has(it.cat))
    .map((it) => {
      const o = { id: it.id, cat: it.cat, name: it.name, price: it.price };
      if (it.oldPrice) o.oldPrice = it.oldPrice;
      if (it.portion) o.portion = it.portion;
      if (LANGS.some((l) => it.desc[l])) o.desc = it.desc;
      if (LANGS.some((l) => it.ingr[l])) o.ingr = it.ingr;
      if (it.badges.length) o.badges = it.badges;
      if (it.media) o.media = it.media;
      if (it.place !== 'auto') o.place = it.place;
      if (it.steam) o.steam = 1;
      if (it.stop) o.stop = it.stop.until || true;
      return o;
    });
  const specials = doc.specials.filter((s) => s.active).map((s) => {
    const o = { id: s.id, name: s.name, price: s.price };
    for (const k of ['oldPrice', 'portion', 'media', 'from', 'to']) if (s[k]) o[k] = s[k];
    if (s.days?.length) o.days = s.days;
    if (LANGS.some((l) => s.desc[l])) o.desc = s.desc;
    if (LANGS.some((l) => s.ingr[l])) o.ingr = s.ingr;
    if (LANGS.some((l) => s.label[l])) o.label = s.label;
    if (s.steam) o.steam = 1;
    return o;
  });
  const st = doc.settings;
  return {
    rev: doc.rev,
    settings: {
      defaultLang: st.defaultLang, stoppedMode: st.stoppedMode, currency: st.currency,
      phone: st.phone, whatsapp: st.whatsapp, instagram: st.instagram, hours: st.hours,
      address: st.address, eyebrow: st.eyebrow, tagline: st.tagline, specialsTitle: st.specialsTitle,
      heroTitle: st.heroTitle, heroText: st.heroText, typography: st.typography,
      heroVideo: st.heroVideo,
    },
    groups: doc.groups.map((g) => ({ id: g.id, art: g.art, artUrl: g.artUrl || '', name: g.name })),
    categories: cats.map((c) => ({ id: c.id, section: c.section, group: c.group, display: c.display, rail: c.rail !== false, name: c.name })),
    items,
    specials,
    badges: BADGES,
  };
}

/** Все URL медиафайлов, на которые ссылается документ (для очистки хранилища). */
export function collectMediaUrls(doc, set = new Set()) {
  const add = (m) => { if (m) for (const k of ['src', 'srcLow', 'srcHi', 'poster']) if (m[k]) set.add(m[k]); };
  for (const it of doc.items || []) add(it.media);
  for (const s of doc.specials || []) add(s.media);
  for (const g of doc.groups || []) if (g.artUrl) set.add(g.artUrl);
  if (doc.settings?.heroVideo) add(doc.settings.heroVideo);
  return set;
}
