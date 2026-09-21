import Cart from '../models/Cart.js';
import Order, { nextOrderNumber } from '../models/Order.js';

function publicOrder(order) {
  const result = order.toObject();
  delete result.__v;
  return result;
}

// An administrator may act on any order; everyone else only on their own.
function mayAccess(order, user) {
  return user.user_type === 'admin' || order.user.equals(user.id);
}

export async function createOrder(req, res) {
  const cart = await Cart.findOne({ user: req.user.id });
  await cart?.populate('items.product');
  // Products deleted since they were added cannot be ordered.
  const items = (cart?.items ?? []).filter((item) => item.product);
  if (items.length === 0) {
    return res.status(400).json({ message: 'The cart is empty.' });
  }

  const order = await Order.create({
    order_number: await nextOrderNumber(),
    user: req.user.id,
    items: items.map((item) => ({
      product: item.product.id,
      sku: item.product.sku,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    })),
    total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    status: 'pending',
    // Payment is simulated: placing the order settles it, and an administrator
    // still has to confirm before it counts as revenue.
    payment_status: 'paid',
  });

  // The cart has become the order, so it starts empty again.
  cart.items = [];
  await cart.save();

  res.status(201).location(`/api/orders/${order.id}`).json({ order: publicOrder(order) });
}

export async function getOrders(req, res) {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit)
    || limit < 1 || limit > 100 || !Number.isSafeInteger((page - 1) * limit)) {
    return res.status(400).json({ message: 'page must be a positive integer; limit must be between 1 and 100.' });
  }
  // Customers only ever see their own orders.
  const filter = req.user.user_type === 'admin' ? {} : { user: req.user.id };
  if (req.query.status !== undefined) filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).select('-__v').populate('user', 'name phone_number')
      .sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);
  res.json({ orders, page, limit, total });
}

export async function getOrderById(req, res) {
  const order = await Order.findById(req.params.id).select('-__v')
    .populate('user', 'name phone_number');
  // A missing order and someone else's order answer the same way, so the
  // response never reveals that an order exists.
  if (!order || !mayAccess(order, req.user)) {
    return res.status(404).json({ message: 'Order not found.' });
  }
  res.json({ order });
}

export async function cancelOrder(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order || !mayAccess(order, req.user)) {
    return res.status(404).json({ message: 'Order not found.' });
  }
  // Once an administrator has confirmed it, cancelling is no longer the
  // customer's call.
  if (order.status !== 'pending') {
    return res.status(409).json({
      message: order.status === 'cancelled'
        ? 'This order is already cancelled.'
        : 'A confirmed order can no longer be cancelled.',
    });
  }
  order.status = 'cancelled';
  order.cancelled_at = new Date();
  if (order.payment_status === 'paid') order.payment_status = 'refunded';
  await order.save();
  res.json({ order: publicOrder(order) });
}

export async function confirmOrder(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (order.status !== 'pending') {
    return res.status(409).json({
      message: order.status === 'confirmed'
        ? 'This order is already confirmed.'
        : 'A cancelled order cannot be confirmed.',
    });
  }
  if (order.payment_status !== 'paid') {
    return res.status(409).json({ message: 'This order has not been paid for.' });
  }
  order.status = 'confirmed';
  order.confirmed_at = new Date();
  await order.save();
  res.json({ order: publicOrder(order) });
}
