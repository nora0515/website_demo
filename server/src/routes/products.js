import { Router } from 'express';
import mongoose from 'mongoose';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';

const router = Router();
const strings = ['sku', 'name', 'category', 'image', 'description'];
const fields = [...strings, 'price'];

function validateBody(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).length === 0
    || Object.keys(body).some((key) => !fields.includes(key))
    || strings.some((field) => field in body && typeof body[field] !== 'string')
    || ('price' in body && typeof body.price !== 'number')) {
    return res.status(400).json({ message: 'Provide a JSON object containing only product fields of the right type.' });
  }
  next();
}

router.param('id', (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ message: 'Invalid product ID.' });
  }
  next();
});

// The catalogue is public; changing it is not.
router.get('/', getProducts);

router.get('/:id', getProductById);

router.post('/', requireAuth, requireAdmin, validateBody, createProduct);

router.patch('/:id', requireAuth, requireAdmin, validateBody, updateProduct);

router.delete('/:id', requireAuth, requireAdmin, deleteProduct);

router.use((err, req, res, next) => {
  // The unique index is the last line of defence when two registrations race.
  if (err?.code === 11000) {
    return res.status(409).json({ message: 'This SKU is already registered.' });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      message: 'Invalid product data.',
      fields: Object.keys(err.errors),
    });
  }
  next(err);
});

export default router;
