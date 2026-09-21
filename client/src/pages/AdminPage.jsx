import { useEffect, useState } from 'react'
import StatCard from '@/components/StatCard'
import useSession from '@/hooks/useSession'
import { countUsers } from '@/api/users'
import { listProducts } from '@/api/products'
import { listOrders } from '@/api/orders'
import OrderStatus from '@/components/OrderStatus'
import { quickActions } from '@/data/dashboard'

const won = new Intl.NumberFormat('ko-KR')

function ActionIcon({ kind }) {
  const paths = {
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    eye: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    chart: <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M20 20H3" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a5 5 0 0 1 10 0v2" /><path d="M16 5.5a3 3 0 0 1 0 5.8" /></>,
  }
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>
}

export default function AdminPage() {
  const { user, loading } = useSession()
  const [customers, setCustomers] = useState(null)
  const [productCount, setProductCount] = useState(null)
  const [orderCount, setOrderCount] = useState(null)
  const [revenue, setRevenue] = useState(null)
  const [recent, setRecent] = useState([])
  const [notice, setNotice] = useState('')

  // Only admins belong here; everyone else goes back to the shop.
  const allowed = Boolean(user) && user.user_type === 'admin'
  useEffect(() => {
    if (!loading && !allowed) window.location.replace('/')
  }, [loading, allowed])

  useEffect(() => {
    if (!allowed) return undefined
    let live = true
    countUsers().then((total) => { if (live) setCustomers(total) })
    listProducts({ limit: 1 })
      .then((data) => { if (live) setProductCount(data.total) })
      .catch(() => { if (live) setProductCount(null) })
    listOrders({ limit: 5 })
      .then((data) => { if (live) { setOrderCount(data.total); setRecent(data.orders) } })
      .catch(() => { if (live) setOrderCount(null) })
    // Revenue counts confirmed orders only, since those are the settled ones.
    listOrders({ limit: 100, status: 'confirmed' })
      .then((data) => {
        if (live) setRevenue(data.orders.reduce((sum, order) => sum + order.total, 0))
      })
      .catch(() => { if (live) setRevenue(null) })
    return () => { live = false }
  }, [allowed])

  if (loading || !allowed) {
    return <main className="admin-gate"><p role="status">권한을 확인하는 중…</p></main>
  }

  return (
    <div className="admin">
      <header className="admin-nav">
        <p className="admin-brand">
          <a href="/">NORAMALL</a> <span className="admin-tag">ADMIN</span>
        </p>
        <a className="admin-back" href="/">쇼핑몰로 돌아가기</a>
      </header>

      <main className="admin-body">
        <section className="admin-heading">
          <h1>관리자 대시보드</h1>
          <p>NORAMALL 쇼핑몰 관리 시스템에 오신 것을 환영합니다.</p>
        </section>

        <section className="stat-grid" aria-label="요약 지표">
          <StatCard label="총 주문" value={orderCount === null ? '—' : won.format(orderCount)}
            delta="취소 포함 전체 주문" icon="cart" tone="blue" pending={orderCount === null} />
          <StatCard label="총 상품" value={productCount === null ? '—' : won.format(productCount)}
            delta="등록된 상품 기준" icon="box" tone="green" pending={productCount === null} />
          <StatCard label="총 고객" value={customers === null ? '—' : won.format(customers)}
            delta="가입 계정 기준" icon="users" tone="violet" pending={customers === null} />
          <StatCard label="총 매출" value={revenue === null ? '—' : `${won.format(revenue)}원`}
            delta="확정된 주문 기준" icon="trend" tone="orange" pending={revenue === null} />
        </section>

        {notice && <p className="admin-notice" role="status">{notice}</p>}

        <div className="admin-panels">
          <section className="panel" aria-labelledby="quick-title">
            <h2 id="quick-title">빠른 작업</h2>
            <div className="quick-actions">
              {quickActions.map((action) => (action.href
                ? <a key={action.id} href={action.href}
                  className={action.primary ? 'quick primary' : 'quick'}>
                  <ActionIcon kind={action.icon} />{action.label}
                </a>
                : <button key={action.id} type="button"
                  className={action.primary ? 'quick primary' : 'quick'}
                  onClick={() => setNotice(`${action.label} 기능은 준비 중입니다.`)}>
                  <ActionIcon kind={action.icon} />{action.label}
                </button>
              ))}
            </div>
          </section>

          <section className="panel" aria-labelledby="orders-title">
            <div className="panel-head">
              <h2 id="orders-title">최근 주문</h2>
              <a className="panel-link" href="/admin/orders">전체보기</a>
            </div>
            {recent.length === 0
              ? <p className="table-empty">아직 주문이 없습니다.</p>
              : <ul className="order-list">
                {recent.map((order) => (
                  <li key={order._id}>
                    <div className="order-main">
                      <p className="order-id">{order.order_number}</p>
                      <p className="order-meta">
                        {order.user?.name ?? '-'} · {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="order-side">
                      <OrderStatus status={order.status} payment={order.payment_status} />
                      <p className="order-amount">{won.format(order.total)}원</p>
                    </div>
                  </li>
                ))}
              </ul>}
          </section>
        </div>

        <p className="admin-footnote">주문·매출 수치는 예시 데이터입니다. 상품 수와 고객 수만 실제 값입니다.</p>
      </main>
    </div>
  )
}
