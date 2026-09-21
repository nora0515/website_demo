import assert from 'node:assert/strict';
import { test } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';

test('user CRUD, validation, password handling and timestamps', async () => {
  const mongo = await MongoMemoryServer.create();
  let server;
  try {
    await mongoose.connect(mongo.getUri());
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/users`;
    const request = (path = '', method = 'GET', body) => fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const input = { phone_number: '01012345678', name: '홍길동', password: 'secret', user_type: 'customer' };
    for (const field of Object.keys(input)) {
      const invalid = { ...input };
      delete invalid[field];
      assert.equal((await request('', 'POST', invalid)).status, 400);
    }
    for (const invalid of [[], {}, { ...input, user_type: 'other' }, { ...input, password: ' ' }, { ...input, name: {} }, { ...input, createdAt: '2000-01-01' }]) {
      assert.equal((await request('', 'POST', invalid)).status, 400);
    }
    const created = await request('', 'POST', input);
    assert.equal(created.status, 201);
    const { user } = await created.json();
    assert.equal(user.password, undefined);
    assert.ok(user.createdAt && user.updatedAt);
    const stored = await User.findById(user._id);
    assert.match(stored.password, /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/);
    assert.notEqual(stored.password, input.password);
    assert.equal((await request('', 'POST', input)).status, 409);
    assert.equal(await User.countDocuments(), 1);
    const list = await (await request('?page=1&limit=1')).json();
    assert.equal(list.total, 1);
    assert.equal(list.users[0].password, undefined);
    assert.equal((await request('?limit=101')).status, 400);
    assert.equal((await request('/bad-id')).status, 400);
    assert.equal((await request(`/${new mongoose.Types.ObjectId()}`)).status, 404);
    assert.equal((await (await request(`/${user._id}`)).json()).user.password, undefined);
    for (const invalid of [{ user_type: 'other' }, { name: '' }, { password: '' }, { $set: { name: 'bad' } }]) {
      assert.equal((await request(`/${user._id}`, 'PATCH', invalid)).status, 400);
    }
    const updated = await request(`/${user._id}`, 'PATCH', { name: '수정', address: '서울', user_type: 'admin' });
    assert.equal(updated.status, 200);
    const updatedUser = (await updated.json()).user;
    assert.equal(updatedUser.name, '수정');
    assert.equal(updatedUser.address, '서울');
    assert.equal(updatedUser.password, undefined);
    assert.equal(updatedUser.createdAt, user.createdAt);
    assert.ok(new Date(updatedUser.updatedAt) > new Date(user.updatedAt));
    assert.equal((await User.findById(user._id)).password, stored.password);
    assert.equal((await request(`/${user._id}`, 'PATCH', { password: 'new-secret' })).status, 200);
    assert.notEqual((await User.findById(user._id)).password, stored.password);
    assert.equal((await request(`/${user._id}`, 'DELETE')).status, 204);
    assert.equal((await request(`/${user._id}`)).status, 404);
    assert.equal((await request(`/${user._id}`, 'PATCH', { name: '수정' })).status, 404);
    assert.equal((await request(`/${user._id}`, 'DELETE')).status, 404);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await mongo.stop();
  }
});
