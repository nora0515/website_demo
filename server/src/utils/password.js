import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt, KEY_LENGTH);
  return `scrypt:${salt}:${key.toString('hex')}`;
}

// Compares in constant time so a wrong password cannot be narrowed down by timing.
export async function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const [scheme, salt, hash] = stored.split(':');
  if (scheme !== 'scrypt' || !/^[a-f0-9]+$/.test(salt || '') || !/^([a-f0-9]{2})+$/.test(hash || '')) {
    return false;
  }
  const expected = Buffer.from(hash, 'hex');
  const actual = await deriveKey(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

// Hashing a throwaway value keeps the unknown-account path as slow as a real
// one, so response time does not reveal which phone numbers are registered.
const decoy = await hashPassword(randomBytes(32).toString('hex'));

export function burnTime(password) {
  return verifyPassword(password, decoy);
}
