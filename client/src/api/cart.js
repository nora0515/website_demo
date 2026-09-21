import { readToken } from './auth'

const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

// Thrown when the caller is not signed in, so callers can send them to /login.
export class NotSignedInError extends Error {
  constructor() {
    super('로그인이 필요합니다.')
    this.name = 'NotSignedInError'
  }
}

async function request(path, options = {}) {
  const token = readToken()
  if (!token) throw new NotSignedInError()
  let response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      signal: AbortSignal.timeout(15000),
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...options.headers },
    })
  } catch {
    throw new Error('서버 응답을 확인하지 못했습니다. 연결 상태를 확인해 주세요.')
  }
  if (response.status === 401) throw new NotSignedInError()
  if (!response.ok) {
    throw new Error({
      400: '요청 내용을 다시 확인해 주세요.',
      404: '상품을 찾을 수 없습니다.',
    }[response.status] ?? '장바구니를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }
  const data = await response.json()
  return data.cart
}

const asJson = (body) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export function getCart() {
  return request('/cart')
}

export function addToCart(productId, quantity = 1) {
  return request('/cart/items', { method: 'POST', ...asJson({ product_id: productId, quantity }) })
}

export function setQuantity(productId, quantity) {
  return request(`/cart/items/${productId}`, { method: 'PATCH', ...asJson({ quantity }) })
}

export function removeFromCart(productId) {
  return request(`/cart/items/${productId}`, { method: 'DELETE' })
}

export function clearCart() {
  return request('/cart', { method: 'DELETE' })
}
