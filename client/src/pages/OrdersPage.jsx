import { useEffect, useState } from 'react'
import OrderStatus from '@/components/OrderStatus'
import useSession from '@/hooks/useSession'
import { cancelOrder, listOrders } from '@/api/orders'
import { NotSignedInError } from '@/api/cart'

const won = new Intl.NumberFormat('ko-KR')
const when = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })

export default function OrdersPage() {
  const { user, loading: loadingUser } = useSession()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  useEffect(() => {
    let live = true
    listOrders({ limit: 50 })
      .then((data) => { if (live) setOrders(data.orders) })
      .catch((err) => {
        if (!live) return
        if (err instanceof NotSignedInError) window.location.assign('/login')
        else setError(err.message)
      })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [])

  async function cancel(order) {
    if (!window.confirm(`${order.order_number} 주문을 취소할까요?`)) return
    setBusy(order._id)
    setError('')
    try {
      const updated = await cancelOrder(order._id)
      setOrders((previous) => previous.map((item) => (item._id === order._id ? updated : item)))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  if (loadingUser || loading) {
    return <main className="detail-gate"><p role="status">주문 내역을 불러오는 중…</p></main>
  }
  if (!user) {
    return (
      <main className="detail-gate">
        <p>주문 내역은 로그인 후 확인할 수 있습니다.</p>
        <a className="primary-link" href="/login">로그인</a>
      </main>
    )
  }

  return (
    <div className="shop cart-page">
      <header className="cart-head">
        <a className="back-link" href="/">← 쇼핑 계속하기</a>
        <h1>주문 내역</h1>
      </header>

      {error && <p className="submit-error" role="alert">{error}</p>}

      {orders.length === 0
        ? <div className="cart-empty">
          <p>주문 내역이 없습니다.</p>
          <a className="primary-link" href="/">상품 보러 가기</a>
        </div>
        : <ul className="order-cards">
          {orders.map((order) => (
            <li key={order._id} className="order-card">
              <div className="order-card-head">
                <div>
                  <p className="order-number">{order.order_number}</p>
                  <p className="order-date">{when.format(new Date(order.createdAt))}</p>
                </div>
                <OrderStatus status={order.status} payment={order.payment_status} />
              </div>
              <ul className="order-items">
                {order.items.map((item) => (
                  <li key={item.sku}>
                    <span className="order-item-name">{item.name}</span>
                    <span className="order-item-qty">× {item.quantity}</span>
                    <span className="order-item-price">{won.format(item.subtotal)}원</span>
                  </li>
                ))}
              </ul>
              <div className="order-card-foot">
                <p className="order-total">총 <strong>{won.format(order.total)}원</strong></p>
                {/* Cancelling is only offered while the order is still pending. */}
                {order.status === 'pending' && (
                  <button className="cart-remove" type="button" disabled={busy === order._id}
                    onClick={() => cancel(order)}>
                    {busy === order._id ? '취소 중…' : '주문 취소'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>}
    </div>
  )
}
