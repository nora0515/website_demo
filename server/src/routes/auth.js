import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
const fields = ['phone_number', 'password'];

function validateCredentials(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || fields.some((field) => typeof body[field] !== 'string')
    || Object.keys(body).some((key) => !fields.includes(key))
    || !body.phone_number.trim() || !body.password) {
    return res.status(400).json({ message: 'Provide phone_number and password as strings.' });
  }
  next();
}

router.post('/login', validateCredentials, login);

router.get('/me', requireAuth, me);

export default router;
