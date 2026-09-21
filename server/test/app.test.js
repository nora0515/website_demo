import assert from 'node:assert/strict';
import { test } from 'node:test';
import app from '../src/app.js';
import { env } from '../src/config/env.js';

test('app routing, CORS, health caching and JSON error handling', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const root = await fetch(base);
    assert.equal(root.status, 200);
    assert.equal(root.headers.get('x-powered-by'), null);
    assert.equal((await root.json()).health, '/api/health');

    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 503);
    assert.equal(health.headers.get('cache-control'), 'no-store');
    // Configuration is reported alongside the database, so a deployed server
    // can say what is missing without anyone reading its logs.
    assert.deepEqual(await health.json(), {
      status: 'unavailable',
      database: 'disconnected',
      config: 'ok',
    });

    const missing = await fetch(`${base}/api/missing`);
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { message: 'Route not found' });

    const preflight = await fetch(`${base}/api/users`, {
      method: 'OPTIONS',
      headers: { Origin: env.clientOrigin, 'Access-Control-Request-Method': 'POST' },
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), env.clientOrigin);

    for (const [body, status] of [['{', 400], [JSON.stringify({ name: 'a'.repeat(1024 * 1024) }), 413]]) {
      const response = await fetch(`${base}/api/users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
      });
      assert.equal(response.status, status);
      assert.deepEqual(await response.json(), { message: 'Invalid request' });
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
