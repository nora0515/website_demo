import { readToken } from './auth'
import { NotSignedInError } from './cart'

const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

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
    let detail
    try {
      detail = (await response.json()).message
    } catch {
      detail = undefined
    }
    throw new Error({
      400: '장바구니가 비어 있어 주문할 수 없습니다.',
      403: '관리자만 사용할 수 있는 기능입니다.',
      404: '주문을 찾을 수 없습니다.',
      // The server explains exactly why a status change was refused.
      409: detail === 'A confirmed order can no longer be cancelled.'
        ? '확정된 주문은 취소할 수 없습니다.'
        : detail === 'This order is already cancelled.'
          ? '이미 취소된 주문입니다.'
          : detail === 'This order is already confirmed.'
            ? '이미 확정된 주문입니다.'
            : '주문 상태가 변경되어 처리할 수 없습니다.',
    }[response.status] ?? '주문을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }
  return response.json()
}

export function placeOrder() {
  return request('/orders', { method: 'POST' }).then((data) => data.order)
}

export function listOrders({ page = 1, limit = 20, status } = {}) {
  const query = new URLSearchParams({ page, limit })
  if (status) query.set('status', status)
  return request(`/orders?${query}`)
}

export function cancelOrder(id) {
  return request(`/orders/${id}/cancel`, { method: 'PATCH' }).then((data) => data.order)
}

export function confirmOrder(id) {
  return request(`/orders/${id}/confirm`, { method: 'PATCH' }).then((data) => data.order)
}

export const ORDER_LABELS = {
  pending: '승인 대기',
  confirmed: '주문 확정',
  cancelled: '주문 취소',
}

export const PAYMENT_LABELS = {
  pending: '결제 대기',
  paid: '결제 완료',
  refunded: '환불 완료',
}
