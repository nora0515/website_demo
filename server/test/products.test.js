import assert from 'node:assert/strict';
import { test } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import Product from '../src/models/Product.js';

test('product CRUD, validation and admin-only writes', async () => {
  const mongo = await MongoMemoryServer.create();
  let server;
  try {
    await mongoose.connect(mongo.getUri());
    await Product.init();
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
      const created = await call('/users', 'POST', { name, phone_number, user_type, password: 'secret' });
      assert.equal(created.status, 201);
      const logged = await call('/auth/login', 'POST', { phone_number, password: 'secret' });
      assert.equal(logged.status, 200);
      return (await logged.json()).token;
    };
    const admin = await signIn('관리자', '01000000001', 'admin');
    const customer = await signIn('고객', '01000000002', 'customer');

    const input = { sku: 'md-001', name: '3연동 중문', price: 1290000, category: '중문' };

    // Writes are closed to anonymous and non-admin callers.
    assert.equal((await call('/products', 'POST', input)).status, 401);
    assert.equal((await call('/products', 'POST', input, 'not-a-token')).status, 401);
    assert.equal((await call('/products', 'POST', input, customer)).status, 403);
    assert.equal(await Product.countDocuments(), 0);

    const created = await call('/products', 'POST', input, admin);
    assert.equal(created.status, 201);
    const { product } = await created.json();
    assert.equal(product.sku, 'MD-001');
    assert.equal(product.__v, undefined);
    assert.ok(product.createdAt);

    // The SKU is unique regardless of the case it was typed in.
    assert.equal((await call('/products', 'POST', input, admin)).status, 409);
    assert.equal((await call('/products', 'POST', { ...input, sku: 'MD-001' }, admin)).status, 409);
    assert.equal(await Product.countDocuments(), 1);

    for (const invalid of [
      {},
      [],
      { ...input, sku: 'A1', category: '창문' },
      { ...input, sku: 'A1', price: -1 },
      { ...input, sku: 'A1', price: 1000.5 },
      { ...input, sku: 'A1', price: '1000' },
      { ...input, sku: 'A1', name: 42 },
      { ...input, sku: 'A1', stock: 3 },
      { sku: 'A1' },
    ]) {
      const status = (await call('/products', 'POST', invalid, admin)).status;
      assert.equal(status, 400, `expected 400 for ${JSON.stringify(invalid)}`);
    }

    // Reading stays public.
    const list = await call('/products?page=1&limit=10');
    assert.equal(list.status, 200);
    const listed = await list.json();
    assert.equal(listed.total, 1);
    assert.equal(listed.products[0].sku, 'MD-001');
    assert.equal((await call('/products?limit=101')).status, 400);
    assert.equal((await call(`/products/${product._id}`)).status, 200);
    assert.equal((await call('/products/bad-id')).status, 400);
    assert.equal((await call(`/products/${new mongoose.Types.ObjectId()}`)).status, 404);

    // Category filtering counts only the matching rows.
    await call('/products', 'POST', { sku: 'DR-001', name: '방문', price: 500000, category: '도어' }, admin);
    assert.equal((await (await call('/products?category=도어')).json()).total, 1);
    assert.equal((await (await call('/products?category=중문')).json()).total, 1);
    assert.equal((await (await call('/products')).json()).total, 2);

    assert.equal((await call(`/products/${product._id}`, 'PATCH', { price: 990000 })).status, 401);
    assert.equal((await call(`/products/${product._id}`, 'PATCH', { price: 990000 }, customer)).status, 403);
    const updated = await call(`/products/${product._id}`, 'PATCH',
      { price: 990000, description: '설명 추가' }, admin);
    assert.equal(updated.status, 200);
    const after = (await updated.json()).product;
    assert.equal(after.price, 990000);
    assert.equal(after.description, '설명 추가');
    assert.equal(after.createdAt, product.createdAt);
    // Renaming onto another product's SKU is refused.
    assert.equal((await call(`/products/${product._id}`, 'PATCH', { sku: 'dr-001' }, admin)).status, 409);
    // Keeping its own SKU is not a conflict.
    assert.equal((await call(`/products/${product._id}`, 'PATCH', { sku: 'md-001' }, admin)).status, 200);

    assert.equal((await call(`/products/${product._id}`, 'DELETE')).status, 401);
    assert.equal((await call(`/products/${product._id}`, 'DELETE', undefined, customer)).status, 403);
    assert.equal((await call(`/products/${product._id}`, 'DELETE', undefined, admin)).status, 204);
    assert.equal((await call(`/products/${product._id}`)).status, 404);
    assert.equal((await call(`/products/${product._id}`, 'DELETE', undefined, admin)).status, 404);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await mongo.stop();
  }
});
