import { Router } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import usersRouter from './users.js';
import authRouter from './auth.js';
import productsRouter from './products.js';
import cartRouter from './cart.js';
import ordersRouter from './orders.js';

const router = Router();

router.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  const healthy = connected && env.problems.length === 0;
  res.set('Cache-Control', 'no-store');
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'unavailable',
    database: connected ? 'connected' : 'disconnected',
    // Names of missing or invalid settings, never their values.
    config: env.problems.length === 0 ? 'ok' : env.problems,
  });
});

router.use('/users', usersRouter);

router.use('/auth', authRouter);

router.use('/products', productsRouter);

router.use('/cart', cartRouter);

router.use('/orders', ordersRouter);

export default router;
