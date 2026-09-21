import { useEffect, useState } from 'react'
import ProductThumb from '@/components/ProductThumb'
import useCart from '@/hooks/useCart'
import { clearCart, NotSignedInError, removeFromCart, setQuantity } from '@/api/cart'
import { readToken } from '@/api/auth'

const won = new Intl.NumberFormat('ko-KR')

function Line({ item, busy, onQuantity, onRemove }) {
  const { product, quantity, subtotal } = item
  return (
    <li className="cart-line">
      <a className="cart-thumb" href={`/products/${product._id}`}>
        {product.image
          ? <img src={product.image} alt={product.name} loading="lazy" />
          : <ProductThumb sku={product.sku} className="cart-thumb-blank" />}
      </a>
      <div className="cart-line-main">
        <a className="cart-name" href={`/products/${product._id}`}>{product.name}</a>
        <p className="cart-meta">{product.category} · {won.format(product.price)}원</p>
        <div className="quantity-control small">
          <button type="button" aria-label="수량 줄이기" disabled={busy || quantity <= 1}
            onClick={() => onQuantity(product._id, quantity - 1)}>−</button>
          <span>{quantity}</span>
          <button type="button" aria-label="수량 늘리기" disabled={busy || quantity >= 99}
            onClick={() => onQuantity(product._id, quantity + 1)}>+</button>
        </div>
      </div>
      <div className="cart-line-side">
        <p className="cart-subtotal">{won.format(subtotal)}원</p>
        <button className="cart-remove" type="button" disabled={busy}
          onClick={() => onRemove(product._id)}>삭제</button>
      </div>
    </li>
  )
}

export default function CartPage() {
  const { cart, setCart, loading } = useCart()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const signedIn = Boolean(readToken())

  useEffect(() => { document.title = '장바구니' }, [])

  async function run(action) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      setCart(await action())
    } catch (err) {
      if (err instanceof NotSignedInError) window.location.assign('/login')
      else setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const items = cart?.items ?? []

  return (
    <div className="shop cart-page">
      <header className="cart-head">
        <a className="back-link" href="/">← 쇼핑 계속하기</a>
        <h1>장바구니</h1>
      </header>

      {!signedIn
        ? <div className="cart-empty">
          <p>장바구니는 로그인 후 이용할 수 있습니다.</p>
          <a className="primary-link" href="/login">로그인</a>
        </div>
        : loading
          ? <p className="grid-message">장바구니를 불러오는 중…</p>
          : items.length === 0
            ? <div className="cart-empty">
              <p>장바구니가 비어 있습니다.</p>
              <a className="primary-link" href="/">상품 보러 가기</a>
            </div>
            : <div className="cart-layout">
              <ul className="cart-list">
                {items.map((item) => (
                  <Line key={item.product._id} item={item} busy={busy}
                    onQuantity={(id, next) => run(() => setQuantity(id, next))}
                    onRemove={(id) => run(() => removeFromCart(id))} />
                ))}
              </ul>

              <aside className="cart-summary">
                <h2>주문 요약</h2>
                <dl>
                  <div><dt>상품 수</dt><dd>{cart.count}개</dd></div>
                  <div><dt>상품 금액</dt><dd>{won.format(cart.total)}원</dd></div>
                  <div><dt>배송비</dt><dd>주문 시 확인</dd></div>
                </dl>
                <p className="cart-total"><span>결제 예정</span><strong>{won.format(cart.total)}원</strong></p>
                <a className="checkout" href="/checkout">주문하기</a>
                <button className="cart-clear" type="button" disabled={busy}
                  onClick={() => { if (window.confirm('장바구니를 비울까요?')) run(clearCart) }}>
                  장바구니 비우기
                </button>
                {error && <p className="submit-error" role="alert">{error}</p>}
                {notice && <p className="detail-notice" role="status">{notice}</p>}
              </aside>
            </div>}
    </div>
  )
}
