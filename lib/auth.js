// Вход в админку: пароль из переменных окружения → подписанная cookie (HMAC-SHA256).
// ADMIN_PASSWORD — полный доступ; STAFF_PASSWORD (необязательно) — только стоп-лист.
import crypto from 'node:crypto';
import { hasRedis, isVercel, redis } from './store.js';

const DEV_PASSWORD = 'qalaqshi';
const OWNER = process.env.ADMIN_PASSWORD || (isVercel ? '' : DEV_PASSWORD);
const STAFF = process.env.STAFF_PASSWORD || '';
const SECRET = process.env.SESSION_SECRET || crypto.createHash('sha256').update('qalaqshi|' + OWNER + '|' + STAFF).digest('hex');
const COOKIE = 'qa_session';
const TTL = 30 * 24 * 3600; // 30 дней

export const authConfigured = !!OWNER;

const b64u = (s) => Buffer.from(s).toString('base64url');
const sign = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkPassword(pw) {
  if (!OWNER || typeof pw !== 'string' || !pw) return null;
  if (safeEqual(pw, OWNER)) return 'owner';
  if (STAFF && safeEqual(pw, STAFF)) return 'staff';
  return null;
}

export function makeCookie(role, secure) {
  const body = b64u(JSON.stringify({ r: role, e: Math.floor(Date.now() / 1000) + TTL }));
  const v = `${body}.${sign(body)}`;
  return `${COOKIE}=${v}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${TTL}${secure ? '; Secure' : ''}`;
}

export function clearCookie(secure) {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;
}

export function getSession(request) {
  const c = request.headers.get('cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]+)'));
  if (!m || !OWNER) return null;
  const [body, sig] = m[1].split('.');
  if (!body || !sig || !safeEqual(sig, sign(body))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (p.e < Date.now() / 1000) return null;
    if (p.r === 'staff' && !STAFF) return null;
    return { role: p.r === 'staff' ? 'staff' : 'owner' };
  } catch { return null; }
}

// защита от подбора пароля
const localFails = new Map();
export async function loginAllowed(ip) {
  if (hasRedis) {
    const n = Number(await redis(['GET', 'qalaqshi:login:' + ip]).catch(() => 0)) || 0;
    return n < 8;
  }
  const f = localFails.get(ip);
  return !f || f.n < 8 || Date.now() - f.t > 10 * 60 * 1000;
}
export async function loginFailed(ip) {
  if (hasRedis) {
    await redis(['INCR', 'qalaqshi:login:' + ip]).catch(() => {});
    await redis(['EXPIRE', 'qalaqshi:login:' + ip, '900']).catch(() => {});
    return;
  }
  const f = localFails.get(ip) || { n: 0, t: 0 };
  localFails.set(ip, { n: f.n + 1, t: Date.now() });
}
export async function loginOk(ip) {
  if (hasRedis) await redis(['DEL', 'qalaqshi:login:' + ip]).catch(() => {});
  else localFails.delete(ip);
}
