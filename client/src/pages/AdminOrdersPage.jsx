import { useEffect, useState } from 'react'
import OrderStatus from '@/components/OrderStatus'
import useSession from '@/hooks/useSession'
import { cancelOrder, confirmOrder, listOrders } from '@/api/orders'

const won = new Intl.NumberFormat('ko-KR')
const when = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
const FILTERS = [
  { id: '', label: '전체' },
  { id: 'pending', label: '승인 대기' },
  { id: 'confirmed', label: '주문 확정' },
  { id: 'cancelled', label: '주문 취소' },
]

export default function AdminOrdersPage() {
  const { user, loading } = useSession()
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('')
  const [listing, setListing] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [reloads, setReloads] = useState(0)

  const allowed = Boolean(user) && user.user_type === 'admin'
  useEffect(() => {
    if (!loading && !allowed) window.location.replace('/')
  }, [loading, allowed])

  useEffect(() => {
    if (!allowed) return undefined
    let live = true
    listOrders({ limit: 100, status: status || undefined })
      .then((data) => { if (live) { setOrders(data.orders); setError('') } })
      .catch((err) => { if (live) setError(err.message) })
      .finally(() => { if (live) setListing(false) })
    return () => { live = false }
  }, [allowed, status, reloads])

  function filter(next) {
    if (next === status) return
    setListing(true)
    setStatus(next)
  }

  async function act(order, action, label) {
    if (!window.confirm(`${order.order_number} 주문을 ${label}할까요?`)) return
    setBusy(order._id)
    setError('')
    try {
      const updated = await action(order._id)
      // The update response has no populated user, so keep the row's own.
      setOrders((previous) => previous.map((item) => (
        item._id === order._id ? { ...updated, user: item.user } : item
      )))
    } catch (err) {
      setError(err.message)
      // The order moved on elsewhere, so refetch rather than keep a stale row.
      setReloads((count) => count + 1)
    } finally {
      setBusy('')
    }
  }

  if (loading || !allowed) {
    return <main className="admin-gate"><p role="status">권한을 확인하는 중…</p></main>
  }

  return (
    <div className="admin">
      <header className="admin-nav">
        <div className="admin-nav-left">
          <a className="admin-icon-link" href="/admin" aria-label="대시보드로 돌아가기">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
            </svg>
          </a>
          <p className="admin-brand">주문 관리</p>
        </div>
      </header>

      <main className="admin-body">
        <div className="order-filters">
          {FILTERS.map(({ id, label }) => (
            <button key={id} type="button"
              className={id === status ? 'category is-active' : 'category'}
              onClick={() => filter(id)}>{label}</button>
          ))}
        </div>

        {error && <p className="submit-error" role="alert">{error}</p>}

        <section className="panel">
          {listing
            ? <p className="table-empty">불러오는 중…</p>
            : orders.length === 0
              ? <p className="table-empty">해당하는 주문이 없습니다.</p>
              : <table className="product-table order-table">
                <thead>
                  <tr>
                    <th>주문번호</th><th>주문자</th><th>상품</th>
                    <th className="right">금액</th><th>상태</th><th>일시</th><th />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="mono">{order.order_number}</td>
                      <td>
                        {order.user?.name ?? '-'}
                        <br /><small>{order.user?.phone_number}</small>
                      </td>
                      <td>
                        {order.items[0]?.name}
                        {order.items.length > 1 && <span className="chip"> 외 {order.items.length - 1}건</span>}
                      </td>
                      <td className="right">{won.format(order.total)}원</td>
                      <td><OrderStatus status={order.status} payment={order.payment_status} /></td>
                      <td><small>{when.format(new Date(order.createdAt))}</small></td>
                      <td className="right">
                        {/* Only a pending order can still be settled either way. */}
                        {order.status === 'pending' && (
                          <div className="row-actions">
                            <button className="row-approve" type="button" disabled={busy === order._id}
                              onClick={() => act(order, confirmOrder, '승인')}>승인</button>
                            <button className="row-delete" type="button" disabled={busy === order._id}
                              onClick={() => act(order, cancelOrder, '취소')}>취소</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>}
        </section>
      </main>
    </div>
  )
}
