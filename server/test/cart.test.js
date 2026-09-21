import assert from 'node:assert/strict';
import { test } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import Cart from '../src/models/Cart.js';

test('cart is per account, keeps live prices and validates quantities', async () => {
  const mongo = await MongoMemoryServer.create();
  let server;
  try {
    await mongoose.connect(mongo.getUri());
    await Cart.init();
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

    const signIn = async (name, phone_number, user_type) => {
      await call('/users', 'POST', { name, phone_number, user_type, password: 'secret' });
      const logged = await call('/auth/login', 'POST', { phone_number, password: 'secret' });
      return (await logged.json()).token;
    };
    const admin = await signIn('관리자', '01000000001', 'admin');
    const alice = await signIn('앨리스', '01000000002', 'customer');
    const bob = await signIn('밥', '01000000003', 'customer');

    const add = async (sku, price) => {
      const created = await call('/products', 'POST',
        { sku, name: sku, price, category: '중문' }, admin);
      assert.equal(created.status, 201);
      return (await created.json()).product;
    };
    const door = await add('MD-001', 1000);
    const film = await add('FL-001', 250);

    // The cart always belongs to a signed-in caller.
    assert.equal((await call('/cart')).status, 401);
    assert.equal((await call('/cart', 'GET', undefined, 'not-a-token')).status, 401);

    // A first visit sees an empty cart rather than a 404.
    const empty = await call('/cart', 'GET', undefined, alice);
    assert.equal(empty.status, 200);
    assert.deepEqual((await empty.json()).cart, { items: [], count: 0, total: 0 });

    const added = await call('/cart/items', 'POST', { product_id: door._id, quantity: 2 }, alice);
    assert.equal(added.status, 200);
    let cart = (await added.json()).cart;
    assert.equal(cart.items.length, 1);
    assert.equal(cart.items[0].product.sku, 'MD-001');
    assert.equal(cart.items[0].quantity, 2);
    assert.equal(cart.items[0].subtotal, 2000);
    assert.equal(cart.total, 2000);
    assert.equal(cart.count, 2);

    // Adding the same product again tops up the existing line.
    cart = (await (await call('/cart/items', 'POST', { product_id: door._id }, alice)).json()).cart;
    assert.equal(cart.items.length, 1);
    assert.equal(cart.items[0].quantity, 3);

    cart = (await (await call('/cart/items', 'POST', { product_id: film._id, quantity: 4 }, alice)).json()).cart;
    assert.equal(cart.items.length, 2);
    assert.equal(cart.total, 3000 + 1000);
    assert.equal(cart.count, 7);

    // Carts do not leak between accounts.
    assert.equal((await (await call('/cart', 'GET', undefined, bob)).json()).cart.count, 0);

    // A price change is picked up without touching the cart.
    await call(`/products/${door._id}`, 'PATCH', { price: 2000 }, admin);
    cart = (await (await call('/cart', 'GET', undefined, alice)).json()).cart;
    assert.equal(cart.total, 6000 + 1000);

    for (const invalid of [
      {},
      { product_id: 'not-an-id' },
      { product_id: door._id, quantity: 0 },
      { product_id: door._id, quantity: 1.5 },
      { product_id: door._id, quantity: 100 },
      { product_id: door._id, quantity: '2' },
      { product_id: door._id, note: 'x' },
    ]) {
      const status = (await call('/cart/items', 'POST', invalid, alice)).status;
      assert.equal(status, 400, `expected 400 for ${JSON.stringify(invalid)}`);
    }
    assert.equal((await call('/cart/items', 'POST',
      { product_id: new mongoose.Types.ObjectId() }, alice)).status, 404);

    cart = (await (await call(`/cart/items/${door._id}`, 'PATCH', { quantity: 1 }, alice)).json()).cart;
    assert.equal(cart.items.find((item) => item.product.sku === 'MD-001').quantity, 1);
    assert.equal((await call(`/cart/items/${door._id}`, 'PATCH', { quantity: 0 }, alice)).status, 400);
    assert.equal((await call(`/cart/items/${film._id}`, 'PATCH', { quantity: 2, extra: 1 }, alice)).status, 400);
    assert.equal((await call(`/cart/items/${new mongoose.Types.ObjectId()}`, 'PATCH',
      { quantity: 1 }, alice)).status, 404);
    assert.equal((await call('/cart/items/bad-id', 'PATCH', { quantity: 1 }, alice)).status, 400);

    // A product deleted from the catalogue drops out of the cart.
    await call(`/products/${film._id}`, 'DELETE', undefined, admin);
    cart = (await (await call('/cart', 'GET', undefined, alice)).json()).cart;
    assert.equal(cart.items.length, 1);
    assert.equal(cart.total, 2000);

    assert.equal((await call(`/cart/items/${film._id}`, 'DELETE', undefined, alice)).status, 404);
    cart = (await (await call(`/cart/items/${door._id}`, 'DELETE', undefined, alice)).json()).cart;
    assert.equal(cart.items.length, 0);

    await call('/cart/items', 'POST', { product_id: door._id, quantity: 3 }, alice);
    cart = (await (await call('/cart', 'DELETE', undefined, alice)).json()).cart;
    assert.deepEqual(cart, { items: [], count: 0, total: 0 });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await mongo.stop();
  }
});
