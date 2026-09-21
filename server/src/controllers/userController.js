import User from '../models/User.js';
import { hashPassword } from '../utils/password.js';

export function publicUser(user) {
  const result = user.toObject();
  delete result.password;
  delete result.__v;
  return result;
}

export async function createUser(req, res) {
  const user = new User(req.body);
  await user.validate();
  if (await User.exists({ phone_number: user.phone_number })) {
    return res.status(409).json({ message: 'This phone number is already registered.' });
  }
  user.password = await hashPassword(user.password);
  await user.save();
  res.status(201).location(`/api/users/${user.id}`).json({ user: publicUser(user) });
}

export async function getUsers(req, res) {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit)
    || limit < 1 || limit > 100 || !Number.isSafeInteger((page - 1) * limit)) {
    return res.status(400).json({ message: 'page must be a positive integer; limit must be between 1 and 100.' });
  }
  const [users, total] = await Promise.all([
    User.find().select('-password -__v').sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit).limit(limit),
    User.countDocuments(),
  ]);
  res.json({ users, page, limit, total });
}

export async function getUserById(req, res) {
  const user = await User.findById(req.params.id).select('-password -__v');
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ user });
}

export async function updateUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  user.set(req.body);
  await user.validate();
  if (Object.hasOwn(req.body, 'password')) {
    user.password = await hashPassword(user.password);
  }
  await user.save();
  res.json({ user: publicUser(user) });
}

export async function deleteUser(req, res) {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.status(204).end();
}
