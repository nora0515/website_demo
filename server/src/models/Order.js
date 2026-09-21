import mongoose from 'mongoose';
import { nextSequence } from './Counter.js';

// The order lifecycle: placed -> confirmed by an administrator, or cancelled
// while it is still pending.
export const ORDER_STATUSES = ['pending', 'confirmed', 'cancelled'];

// Tracked separately from the order status: an order can be paid but not yet
// confirmed, and a cancelled order still needs its payment resolved.
export const PAYMENT_STATUSES = ['pending', 'paid', 'refunded'];

// Items copy the product's details at the time of ordering. Unlike a cart, an
// order is a record of what was actually agreed, so a later price change or a
// deleted product must not rewrite history.
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    order_number: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'An order must contain at least one item.',
      },
    },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, required: true, enum: ORDER_STATUSES, default: 'pending' },
    payment_status: { type: String, required: true, enum: PAYMENT_STATUSES, default: 'pending' },
    confirmed_at: { type: Date },
    cancelled_at: { type: Date },
  },
  { timestamps: true },
);

export async function nextOrderNumber() {
  const seq = await nextSequence('order');
  return `ORD-${String(seq).padStart(6, '0')}`;
}

const Order = mongoose.model('Order', orderSchema);

export default Order;
