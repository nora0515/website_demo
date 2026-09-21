import Cart, { MAX_QUANTITY } from '../models/Cart.js';
import Product from '../models/Product.js';

// Prices are read from the product on every request rather than copied into the
// cart, so a price change is reflected before checkout.
async function present(cart, res) {
  await cart.populate('items.product', '-__v');
  // A product deleted after it was added leaves a dangling reference.
  const live = cart.items.filter((item) => item.product);
  if (live.length !== cart.items.length) {
    cart.items = live;
    await cart.save();
    await cart.populate('items.product', '-__v');
  }
  const items = cart.items.map((item) => ({
    product: item.product,
    quantity: item.quantity,
    subtotal: item.product.price * item.quantity,
  }));
  res.json({
    cart: {
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      total: items.reduce((sum, item) => sum + item.subtotal, 0),
    },
  });
}

// Every route needs the caller's cart, and a first visit has none yet.
async function cartFor(userId) {
  return await Cart.findOne({ user: userId }) ?? new Cart({ user: userId, items: [] });
}

export async function getCart(req, res) {
  return present(await cartFor(req.user.id), res);
}

export async function addItem(req, res) {
  const product = await Product.findById(req.body.product_id);
  if (!product) return res.status(404).json({ message: 'Product not found.' });

  const cart = await cartFor(req.user.id);
  const quantity = req.body.quantity ?? 1;
  const existing = cart.items.find((item) => item.product.equals(product.id));
  if (existing) {
    // Adding the same product again tops up the line rather than duplicating it.
    existing.quantity = Math.min(existing.quantity + quantity, MAX_QUANTITY);
  } else {
    cart.items.push({ product: product.id, quantity });
  }
  await cart.save();
  return present(cart, res);
}

export async function updateItem(req, res) {
  const cart = await cartFor(req.user.id);
  const existing = cart.items.find((item) => item.product.equals(req.params.productId));
  if (!existing) return res.status(404).json({ message: 'This product is not in the cart.' });
  existing.quantity = req.body.quantity;
  await cart.save();
  return present(cart, res);
}

export async function removeItem(req, res) {
  const cart = await cartFor(req.user.id);
  const before = cart.items.length;
  cart.items = cart.items.filter((item) => !item.product.equals(req.params.productId));
  if (cart.items.length === before) {
    return res.status(404).json({ message: 'This product is not in the cart.' });
  }
  await cart.save();
  return present(cart, res);
}

export async function clearCart(req, res) {
  const cart = await cartFor(req.user.id);
  cart.items = [];
  await cart.save();
  return present(cart, res);
}
