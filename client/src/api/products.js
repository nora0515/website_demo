import { readToken } from './auth'

const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

function authHeaders() {
  const token = readToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(15000), ...options })
  } catch {
    throw new Error('서버 응답을 확인하지 못했습니다. 연결 상태를 확인해 주세요.')
  }
  if (response.status === 204) return null
  if (!response.ok) {
    throw new Error({
      400: '입력 정보를 다시 확인해 주세요.',
      401: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
      403: '관리자만 사용할 수 있는 기능입니다.',
      404: '상품을 찾을 수 없습니다.',
      409: '이미 등록된 SKU입니다.',
    }[response.status] ?? '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }
  return response.json()
}

export function listProducts({ page = 1, limit = 50, category } = {}) {
  const query = new URLSearchParams({ page, limit })
  if (category) query.set('category', category)
  return request(`/products?${query}`)
}

export function getProduct(id) {
  return request(`/products/${id}`)
}

export function createProduct(product) {
  return request('/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(product),
  })
}

export function updateProduct(id, patch) {
  return request(`/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(patch),
  })
}

export function deleteProduct(id) {
  return request(`/products/${id}`, { method: 'DELETE', headers: authHeaders() })
}
