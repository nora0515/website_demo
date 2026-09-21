import User from '../models/User.js';
import { publicUser } from './userController.js';
import { burnTime, verifyPassword } from '../utils/password.js';
import { issueToken } from '../utils/token.js';

// One message for both an unknown number and a wrong password, so the response
// never confirms whether a phone number is registered.
const INVALID = 'Invalid phone number or password.';

export async function login(req, res) {
  const user = await User.findOne({ phone_number: req.body.phone_number.trim() });
  const matches = user
    ? await verifyPassword(req.body.password, user.password)
    : await burnTime(req.body.password);
  if (!matches) return res.status(401).json({ message: INVALID });
  res.json({ token: issueToken(user), user: publicUser(user) });
}

export function me(req, res) {
  res.json({ user: req.user });
}
