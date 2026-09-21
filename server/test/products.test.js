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

    // Recommended order: names starting 짱 first, then 탄, then the rest by
    // Korean alphabetical order — regardless of when they were added.
    for (const [sku, name] of [
      ['R-1', '하늘 도어'], ['R-2', '짱짱한 중문'], ['R-3', '가나 도어'],
      ['R-4', '탄탄한 필름'], ['R-5', '짱 좋은 도어'], ['R-6', '나무 도어'],
      ['R-7', '탄력 도어'],
    ]) {
      assert.equal((await call('/products', 'POST',
        { sku, name, price: 1000, category: '도어' }, admin)).status, 201);
    }
    const ordered = await (await call('/products?sort=recommended&limit=10')).json();
    assert.deepEqual(ordered.products.map((item) => item.name), [
      '짱 좋은 도어', '짱짱한 중문',
      '탄력 도어', '탄탄한 필름',
      // '방문' is the product left over from the checks above.
      '가나 도어', '나무 도어', '방문', '하늘 도어',
    ]);
    // Paging keeps that order rather than restarting it.
    const first = await (await call('/products?sort=recommended&limit=2&page=1')).json();
    const second = await (await call('/products?sort=recommended&limit=2&page=2')).json();
    assert.deepEqual(first.products.map((item) => item.name), ['짱 좋은 도어', '짱짱한 중문']);
    assert.deepEqual(second.products.map((item) => item.name), ['탄력 도어', '탄탄한 필름']);
    assert.equal(first.total, 8);
    assert.equal(first.products[0].__v, undefined);
    assert.equal(first.products[0].rank, undefined);
    // The filter still applies alongside the sort.
    assert.equal((await (await call('/products?sort=recommended&category=도어')).json()).total, 8);
    assert.equal((await call('/products?sort=unknown')).status, 400);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await mongo.stop();
  }
});
