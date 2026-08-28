import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { parseCookies } from './http.js';

const COOKIE_NAME = 'hfs_admin';

function jwtSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-not-for-production');
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('scrypt:')) return false;
  const [, salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(jwtSecret());
}

export async function verifyToken(token) {
  if (!token) return null;
  const { payload } = await jwtVerify(token, jwtSecret());
  return payload;
}

// Reads the admin cookie from a request and returns the token payload (or null).
export async function getAdminFromRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireAdmin(req, res) {
  const payload = await getAdminFromRequest(req);
  if (!payload || payload.role !== 'admin') {
    return null;
  }
  return payload;
}

export function adminCookie(token) {
  return { name: COOKIE_NAME, value: token };
}
