import User from '../models/User.js';
import { bearerToken, readToken } from '../utils/token.js';

// Attaches the signed-in account to req.user, or answers 401.
export async function requireAuth(req, res, next) {
  const payload = readToken(bearerToken(req) ?? '');
  if (!payload) {
    return res.status(401).json({ message: 'A valid access token is required.' });
  }
  // The account may have been deleted after the token was issued.
  const user = await User.findById(payload.sub).select('-password -__v');
  if (!user) {
    return res.status(401).json({ message: 'A valid access token is required.' });
  }
  req.user = user;
  next();
}

// Must run after requireAuth, which puts the account on req.user.
export function requireAdmin(req, res, next) {
  if (req.user?.user_type !== 'admin') {
    return res.status(403).json({ message: 'Administrator access is required.' });
  }
  next();
}
