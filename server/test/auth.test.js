import assert from 'node:assert/strict';
import { test } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import User from '../src/models/User.js';

test('login succeeds with valid credentials and rejects everything else', async () => {
  const mongo = await MongoMemoryServer.create();
  let server;
  try {
    await mongoose.connect(mongo.getUri());
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const origin = `http://127.0.0.1:${server.address().port}/api`;
    const post = (path, body) => fetch(`${origin}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const input = { phone_number: '01012345678', name: '홍길동', password: 'secret', user_type: 'customer' };
    const created = await post('/users', input);
    assert.equal(created.status, 201);
    const { user } = await created.json();

    const ok = await post('/auth/login', { phone_number: input.phone_number, password: input.password });
    assert.equal(ok.status, 200);
    const body = await ok.json();
    assert.equal(typeof body.token, 'string');
    const payload = jwt.verify(body.token, env.jwtSecret);
    assert.equal(payload.sub, user._id);
    assert.equal(payload.user_type, 'customer');
    // The token must not leak identifying details or the password hash.
    assert.deepEqual(Object.keys(payload).sort(), ['exp', 'iat', 'sub', 'user_type']);
    assert.ok(payload.exp > payload.iat);
    assert.equal(body.user._id, user._id);
    assert.equal(body.user.name, '홍길동');
    assert.equal(body.user.password, undefined);
    assert.equal(body.user.__v, undefined);

    // Surrounding whitespace on the phone number still resolves the account.
    assert.equal((await post('/auth/login', { phone_number: ' 01012345678 ', password: input.password })).status, 200);

    const wrongPassword = await post('/auth/login', { phone_number: input.phone_number, password: 'Secret' });
    assert.equal(wrongPassword.status, 401);
    const unknownNumber = await post('/auth/login', { phone_number: '01099999999', password: input.password });
    assert.equal(unknownNumber.status, 401);
    // Neither failure may reveal whether the account exists.
    assert.deepEqual(await wrongPassword.json(), await unknownNumber.json());

    for (const invalid of [
      undefined,
      {},
      [],
      { phone_number: input.phone_number },
      { password: input.password },
      { phone_number: input.phone_number, password: '' },
      { phone_number: '   ', password: input.password },
      { phone_number: input.phone_number, password: 123 },
      { phone_number: { $ne: null }, password: input.password },
      { phone_number: input.phone_number, password: input.password, user_type: 'admin' },
    ]) {
      assert.equal((await post('/auth/login', invalid)).status, 400, `expected 400 for ${JSON.stringify(invalid)}`);
    }

    assert.equal((await fetch(`${origin}/auth/login`)).status, 404);

    const withToken = (token) => fetch(`${origin}/auth/me`, {
      headers: token === undefined ? {} : { Authorization: token },
    });
    const mine = await withToken(`Bearer ${body.token}`);
    assert.equal(mine.status, 200);
    const meUser = (await mine.json()).user;
    assert.equal(meUser._id, user._id);
    assert.equal(meUser.password, undefined);

    const expired = jwt.sign({ sub: user._id, user_type: 'customer' }, env.jwtSecret, { expiresIn: -10 });
    const foreign = jwt.sign({ sub: user._id, user_type: 'customer' }, 'a-different-secret-of-enough-length');
    const unsigned = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from(`{"sub":"${user._id}"}`).toString('base64url')}.`;
    for (const header of [
      undefined,
      '',
      body.token,
      `Bearer ${body.token} extra`,
      `Basic ${body.token}`,
      'Bearer ',
      'Bearer not-a-token',
      `Bearer ${expired}`,
      `Bearer ${foreign}`,
      `Bearer ${unsigned}`,
    ]) {
      assert.equal((await withToken(header)).status, 401, `expected 401 for ${header}`);
    }

    // A token stays unusable once its account is gone.
    await User.findByIdAndDelete(user._id);
    assert.equal((await withToken(`Bearer ${body.token}`)).status, 401);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await mongo.stop();
  }
});
