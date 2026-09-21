import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// The payload is readable by anyone holding the token, so it carries only the
// account id and role — never the phone number or the password hash.
export function issueToken(user) {
  return jwt.sign(
    { sub: user.id, user_type: user.user_type },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

export function readToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
}

// Accepts only "Authorization: Bearer <token>".
export function bearerToken(req) {
  const header = req.get('authorization');
  if (!header) return null;
  const [scheme, token, ...rest] = header.split(' ');
  if (rest.length || scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}
