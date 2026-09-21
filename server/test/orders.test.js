import assert from 'node:assert/strict';
import { test } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import Order from '../src/models/Order.js';

test('orders: numbering, cart handover, access control, status and cancellation', async () => {
  const mongo = await MongoMemoryServer.create();
  let server;
  try {
    await mongoose.connect(mongo.getUri());
    await Order.init();
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const origin = `http://127.0.0.1:${server.address().port}/api`;

    const call = (path, method = 'GET', body, token) => fetch(`${origin}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = async (response) => (await response.json());

    const signIn = async (name, phone_number, user_type) => {
      await call('/users', 'POST', { name, phone_number, user_type, password: 'secret' });
      return (await json(await call('/auth/login', 'POST', { phone_number, password: 'secret' }))).token;
    };
    const admin = await signIn('관리자', '01000000001', 'admin');
    const alice = await signIn('앨리스', '01000000002', 'customer');
    const bob = await signIn('밥', '01000000003', 'customer');

    const created = await call('/products', 'POST',
      { sku: 'MD-001', name: '3연동 중문', price: 1000, category: '중문' }, admin);
    const product = (await json(created)).product;

    assert.equal((await call('/orders', 'POST')).status, 401);
    // An empty cart cannot become an order.
    assert.equal((await call('/orders', 'POST', undefined, alice)).status, 400);

    await call('/cart/items', 'POST', { product_id: product._id, quantity: 3 }, alice);
    const placed = await call('/orders', 'POST', undefined, alice);
    assert.equal(placed.status, 201);
    const order = (await json(placed)).order;
    assert.match(order.order_number, /^ORD-\d{6}$/);
    assert.equal(order.status, 'pending');
    assert.equal(order.payment_status, 'paid');
    assert.equal(order.total, 3000);
    assert.equal(order.items[0].sku, 'MD-001');
    assert.equal(order.items[0].quantity, 3);
    assert.equal(order.items[0].subtotal, 3000);

    // Placing the order empties the cart.
    assert.equal((await json(await call('/cart', 'GET', undefined, alice))).cart.count, 0);

    // Order numbers are sequential and unique.
    await call('/cart/items', 'POST', { product_id: product._id }, alice);
    const second = (await json(await call('/orders', 'POST', undefined, alice))).order;
    assert.notEqual(second.order_number, order.order_number);
    assert.equal(Number(second.order_number.slice(4)), Number(order.order_number.slice(4)) + 1);

    // Item details are a snapshot: later price changes do not rewrite them.
    await call(`/products/${product._id}`, 'PATCH', { price: 9999 }, admin);
    assert.equal((await json(await call(`/orders/${order._id}`, 'GET', undefined, alice))).order.total, 3000);

    // Customers see only their own orders; administrators see every order.
    assert.equal((await json(await call('/orders', 'GET', undefined, alice))).total, 2);
    assert.equal((await json(await call('/orders', 'GET', undefined, bob))).total, 0);
    assert.equal((await json(await call('/orders', 'GET', undefined, admin))).total, 2);
    // Someone else's order is indistinguishable from one that does not exist.
    assert.equal((await call(`/orders/${order._id}`, 'GET', undefined, bob)).status, 404);
    assert.equal((await call(`/orders/${order._id}`, 'GET', undefined, admin)).status, 200);
    assert.equal((await call(`/orders/${new mongoose.Types.ObjectId()}`, 'GET', undefined, alice)).status, 404);
    assert.equal((await call('/orders/bad-id', 'GET', undefined, alice)).status, 400);
    assert.equal((await call('/orders?status=unknown', 'GET', undefined, alice)).status, 400);

    // Only an administrator may confirm, and confirming is not a customer action.
    assert.equal((await call(`/orders/${order._id}/confirm`, 'PATCH', undefined, alice)).status, 403);
    assert.equal((await call(`/orders/${order._id}/cancel`, 'PATCH', undefined, bob)).status, 404);

    const confirmed = (await json(await call(`/orders/${order._id}/confirm`, 'PATCH', undefined, admin))).order;
    assert.equal(confirmed.status, 'confirmed');
    assert.equal(confirmed.payment_status, 'paid');
    assert.ok(confirmed.confirmed_at);
    assert.equal((await call(`/orders/${order._id}/confirm`, 'PATCH', undefined, admin)).status, 409);
    // A confirmed order can no longer be cancelled.
    assert.equal((await call(`/orders/${order._id}/cancel`, 'PATCH', undefined, alice)).status, 409);

    // A pending order can be cancelled by its owner, and the payment reverses.
    const cancelled = (await json(await call(`/orders/${second._id}/cancel`, 'PATCH', undefined, alice))).order;
    assert.equal(cancelled.status, 'cancelled');
    assert.equal(cancelled.payment_status, 'refunded');
    assert.ok(cancelled.cancelled_at);
    assert.equal((await call(`/orders/${second._id}/cancel`, 'PATCH', undefined, alice)).status, 409);
    assert.equal((await call(`/orders/${second._id}/confirm`, 'PATCH', undefined, admin)).status, 409);

    assert.equal((await json(await call('/orders?status=confirmed', 'GET', undefined, admin))).total, 1);
    assert.equal((await json(await call('/orders?status=cancelled', 'GET', undefined, admin))).total, 1);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await mongo.stop();
  }
});
