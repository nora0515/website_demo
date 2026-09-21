import { Router } from 'express';
import mongoose from 'mongoose';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} from '../controllers/cartController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { MAX_QUANTITY } from '../models/Cart.js';

const router = Router();

function isQuantity(value) {
  return Number.isInteger(value) && value >= 1 && value <= MAX_QUANTITY;
}

function validateAdd(req, res, next) {
  const body = req.body;
  const keys = Object.keys(body ?? {});
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || keys.some((key) => !['product_id', 'quantity'].includes(key))
    || !mongoose.isObjectIdOrHexString(body.product_id)
    || ('quantity' in body && !isQuantity(body.quantity))) {
    return res.status(400).json({ message: `Provide product_id and an optional quantity between 1 and ${MAX_QUANTITY}.` });
  }
  next();
}

function validateQuantity(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).length !== 1 || !isQuantity(body.quantity)) {
    return res.status(400).json({ message: `Provide a quantity between 1 and ${MAX_QUANTITY}.` });
  }
  next();
}

router.param('productId', (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ message: 'Invalid product ID.' });
  }
  next();
});

// A cart belongs to one account, so every route here needs a signed-in caller.
router.use(requireAuth);

router.get('/', getCart);

router.post('/items', validateAdd, addItem);

router.patch('/items/:productId', validateQuantity, updateItem);

router.delete('/items/:productId', removeItem);

router.delete('/', clearCart);

router.use((err, req, res, next) => {
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      message: 'Invalid cart data.',
      fields: Object.keys(err.errors),
    });
  }
  next(err);
});

export default router;
