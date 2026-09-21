import { Router } from 'express';
import mongoose from 'mongoose';
import {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  confirmOrder,
  payOrder,
} from '../controllers/orderController.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { ORDER_STATUSES } from '../models/Order.js';

const router = Router();

router.param('id', (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ message: 'Invalid order ID.' });
  }
  next();
});

function validateStatusQuery(req, res, next) {
  if (req.query.status !== undefined && !ORDER_STATUSES.includes(req.query.status)) {
    return res.status(400).json({ message: `status must be one of: ${ORDER_STATUSES.join(', ')}.` });
  }
  next();
}

// Orders always belong to an account.
router.use(requireAuth);

router.post('/', createOrder);

router.get('/', validateStatusQuery, getOrders);

router.get('/:id', getOrderById);

// The gateway is asked about this order directly, so the request carries no
// body the caller could influence.
router.post('/:id/pay', payOrder);

// The customer may cancel their own order; an administrator may cancel any.
router.patch('/:id/cancel', cancelOrder);

// Only an administrator settles an order.
router.patch('/:id/confirm', requireAdmin, confirmOrder);

router.use((err, req, res, next) => {
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      message: 'Invalid order data.',
      fields: Object.keys(err.errors),
    });
  }
  next(err);
});

export default router;
