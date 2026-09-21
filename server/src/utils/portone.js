import { env } from '../config/env.js';

const API = 'https://api.iamport.kr';

export const isConfigured = Boolean(env.impApiKey && env.impApiSecret);

class PortOneError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PortOneError';
  }
}

async function call(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(10000), ...options });
  } catch {
    throw new PortOneError('Could not reach the payment gateway.');
  }
  const body = await response.json().catch(() => ({}));
  // PortOne answers 200 with a non-zero code for business errors.
  if (!response.ok || body.code !== 0) {
    throw new PortOneError(body.message ?? 'The payment gateway rejected the request.');
  }
  return body.response;
}

// Access tokens are short lived, so each verification asks for a fresh one
// rather than caching one that may expire mid-request.
async function accessToken() {
  const token = await call('/users/getToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imp_key: env.impApiKey, imp_secret: env.impApiSecret }),
  });
  return token.access_token;
}

// Looked up by our own order number rather than by the imp_uid the browser
// reports. The browser cannot point us at someone else's payment this way, and
// PortOne's /payments/{imp_uid} route answers 404 even for real payments.
export async function getPaymentByOrderNumber(orderNumber) {
  return call(`/payments/find/${encodeURIComponent(orderNumber)}`, {
    headers: { Authorization: await accessToken() },
  });
}

// Refunds a payment in full. PortOne identifies it by imp_uid when we recorded
// one, and otherwise by our order number.
export async function cancelPayment({ impUid, orderNumber, reason }) {
  return call('/payments/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: await accessToken() },
    body: JSON.stringify(impUid ? { imp_uid: impUid, reason } : { merchant_uid: orderNumber, reason }),
  });
}
