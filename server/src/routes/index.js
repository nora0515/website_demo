import { Router } from 'express';
import mongoose from 'mongoose';
import usersRouter from './users.js';
import authRouter from './auth.js';
import productsRouter from './products.js';
import cartRouter from './cart.js';
import ordersRouter from './orders.js';

const router = Router();

router.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.set('Cache-Control', 'no-store');
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'unavailable',
    database: connected ? 'connected' : 'disconnected',
  });
});

router.use('/users', usersRouter);

router.use('/auth', authRouter);

router.use('/products', productsRouter);

router.use('/cart', cartRouter);

router.use('/orders', ordersRouter);

export default router;
