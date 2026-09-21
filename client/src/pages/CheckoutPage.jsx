import { useState } from 'react'
import ProductThumb from '@/components/ProductThumb'
import useCart from '@/hooks/useCart'
import useSession from '@/hooks/useSession'
import { payOrder, placeOrder } from '@/api/orders'
import { NotSignedInError } from '@/api/cart'
import { isConfigured, requestPayment } from '@/lib/portone'

const won = new Intl.NumberFormat('ko-KR')

// The mock's Shipping / Payment / Review, adapted to a shop with no delivery.
const STEPS = ['주문 확인', '결제', '완료']

function Steps({ current }) {
  return (
    <ol className="steps">
      {STEPS.map((label, index) => (
        <li key={label} className={index <= current ? 'step is-done' : 'step'}>
          <span className="step-mark">{index < current ? '✓' : index + 1}</span>
          <span className="step-label">{label}</span>
        </li>
      ))}
    </ol>
  )
}

export default function CheckoutPage() {
  const { user, loading: loadingUser } = useSession()
  const { cart, loading } = useCart()
  const [placing, setPlacing] = useState(false)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  async function submit() {
    setPlacing(true)
    setError('')
    let placed
    try {
      // The order exists first so the gateway has a merchant_uid to pay against.
      placed = await placeOrder()
      await requestPayment({
        orderNumber: placed.order_number,
        amount: placed.total,
        name: placed.items.length > 1
          ? `${placed.items[0].name} 외 ${placed.items.length - 1}건`
          : placed.items[0].name,
        buyer: user,
      })
      // The server re-reads the payment from the gateway; the browser's word
      // that it succeeded is not enough.
      setOrder(await payOrder(placed._id))
    } catch (err) {
      if (err instanceof NotSignedInError) {
        window.location.assign('/login')
        return
      }
      setError(placed
        ? `${err.message} 주문 ${placed.order_number}은(는) 결제 대기 상태로 주문 내역에 있습니다.`
        : err.message)
    } finally {
      setPlacing(false)
    }
  }

  if (loading || loadingUser) {
    return <main className="detail-gate"><p role="status">불러오는 중…</p></main>
  }
  if (!user) {
    return (
      <main className="detail-gate">
        <p>주문하려면 로그인이 필요합니다.</p>
        <a className="primary-link" href="/login">로그인</a>
      </main>
    )
  }

  if (order) {
    return (
      <div className="checkout">
        <header className="checkout-nav">
          <a className="icon-button" href="/" aria-label="홈으로">←</a>
          <p className="checkout-title">주문 완료</p>
          <span />
        </header>
        <main className="checkout-body single">
          <Steps current={2} />
          <section className="panel-card done-card">
            <span className="success-mark" aria-hidden="true">✓</span>
            <h1>주문이 접수되었습니다</h1>
            <p className="order-number-big">{order.order_number}</p>
            <p className="done-lead">
              결제가 정상 처리되었습니다. <strong>관리자 승인</strong> 후 주문이 확정됩니다.
              확정 전까지는 주문 내역에서 취소할 수 있습니다.
            </p>
            <div className="done-actions">
              <a className="primary-link" href="/orders">주문 내역 보기</a>
              <a className="primary-link secondary" href="/">쇼핑 계속하기</a>
            </div>
          </section>
        </main>
      </div>
    )
  }

  const items = cart?.items ?? []
  if (items.length === 0) {
    return (
      <main className="detail-gate">
        <p>장바구니가 비어 있습니다.</p>
        <a className="primary-link" href="/">상품 보러 가기</a>
      </main>
    )
  }

  return (
    <div className="checkout">
      <header className="checkout-nav">
        <a className="icon-button" href="/cart" aria-label="장바구니로">←</a>
        <p className="checkout-title">주문 / 결제</p>
        <span />
      </header>

      <main className="checkout-body">
        <div>
          <Steps current={1} />
          <section className="panel-card">
            <h2>주문자 정보</h2>
            <dl className="buyer">
              <div><dt>이름</dt><dd>{user.name}</dd></div>
              <div><dt>연락처</dt><dd>{user.phone_number}</dd></div>
            </dl>
            <p className="panel-note">
              배송이 없는 상품이라 배송지는 받지 않습니다.
            </p>
          </section>

          <section className="panel-card">
            <h2>결제 수단</h2>
            <label className="pay-option">
              <input type="radio" name="payment" defaultChecked readOnly />
              <span>
                <strong>신용·체크카드 (KG이니시스)</strong>
                <small>{isConfigured
                  ? '테스트 모드입니다. 실제로 청구되지 않습니다.'
                  : '결제 설정이 없어 결제를 진행할 수 없습니다.'}</small>
              </span>
            </label>
          </section>
        </div>

        <aside className="order-summary">
          <h2>주문 요약</h2>
          <ul className="summary-items">
            {items.map(({ product, quantity, subtotal }) => (
              <li key={product._id}>
                <div className="summary-thumb">
                  {product.image
                    ? <img src={product.image} alt="" />
                    : <ProductThumb sku={product.sku} className="summary-blank" />}
                  <span className="summary-qty">{quantity}</span>
                </div>
                <div className="summary-text">
                  <p className="summary-name">{product.name}</p>
                  <p className="summary-meta">{product.category}</p>
                </div>
                <p className="summary-price">{won.format(subtotal)}원</p>
              </li>
            ))}
          </ul>
          <dl className="summary-totals">
            <div><dt>상품 금액 ({cart.count}개)</dt><dd>{won.format(cart.total)}원</dd></div>
            <div><dt>배송비</dt><dd>없음</dd></div>
          </dl>
          <p className="cart-total"><span>총 결제 금액</span><strong>{won.format(cart.total)}원</strong></p>
          <button className="checkout" type="button" disabled={placing || !isConfigured}
            onClick={submit}>
            {placing ? '결제 진행 중…' : `${won.format(cart.total)}원 결제하기`}
          </button>
          {error && <p className="submit-error" role="alert">{error}</p>}
          <p className="checkout-fineprint">
            결제 후 관리자 승인 시 주문이 확정됩니다.
          </p>
        </aside>
      </main>
    </div>
  )
}
