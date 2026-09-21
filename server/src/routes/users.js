import { Router } from 'express';
import mongoose from 'mongoose';
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';

const router = Router();
const fields = ['phone_number', 'name', 'password', 'user_type', 'address'];

function validateBody(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).length === 0
    || Object.keys(body).some((key) => !fields.includes(key))
    || Object.values(body).some((value) => typeof value !== 'string')) {
    return res.status(400).json({ message: 'Provide a JSON object containing only user fields with string values.' });
  }
  if ('password' in body && !body.password.trim()) {
    return res.status(400).json({ message: 'Password must not be empty.' });
  }
  next();
}

router.param('id', (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ message: 'Invalid user ID.' });
  }
  next();
});

router.post('/', validateBody, createUser);

router.get('/', getUsers);

router.get('/:id', getUserById);

router.patch('/:id', validateBody, updateUser);

router.delete('/:id', deleteUser);

router.use((err, req, res, next) => {
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      message: 'Invalid user data.',
      fields: Object.keys(err.errors),
    });
  }
  next(err);
});

export default router;
