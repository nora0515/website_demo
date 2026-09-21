import { useEffect, useState } from 'react'
import ProductThumb from '@/components/ProductThumb'
import { getProduct } from '@/api/products'
import { addToCart, NotSignedInError } from '@/api/cart'

const won = new Intl.NumberFormat('ko-KR')

function Icon({ kind }) {
  const paths = {
    back: <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" /></>,
    heart: <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z" />,
    bag: <><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  }
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>
}

export default function ProductDetailPage({ id }) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [notice, setNotice] = useState('')
  const [adding, setAdding] = useState(false)

  async function addToBag() {
    setAdding(true)
    setNotice('')
    try {
      const cart = await addToCart(product._id, quantity)
      setNotice(`장바구니에 담았습니다. (총 ${cart.count}개)`)
    } catch (err) {
      // Signing in is the fix for an anonymous visitor, so send them there.
      if (err instanceof NotSignedInError) window.location.assign('/login')
      else setNotice(err.message)
    } finally {
      setAdding(false)
    }
  }

  useEffect(() => {
    let live = true
    getProduct(id)
      .then((data) => { if (live) setProduct(data.product) })
      .catch((err) => { if (live) setError(err.message) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [id])

  if (loading) return <main className="detail-gate"><p role="status">상품을 불러오는 중…</p></main>
  if (error || !product) {
    return (
      <main className="detail-gate">
        <p role="status">{error || '상품을 찾을 수 없습니다.'}</p>
        <a className="primary-link" href="/">목록으로 돌아가기</a>
      </main>
    )
  }

  const total = product.price * quantity

  return (
    <div className="detail">
      <header className="detail-nav">
        <a className="icon-button" href="/" aria-label="목록으로"><Icon kind="back" /></a>
        <p className="detail-title">{product.name}</p>
        <div className="detail-nav-actions">
          <button className="icon-button" type="button" aria-label="공유"
            onClick={() => setNotice('공유 기능은 준비 중입니다.')}><Icon kind="share" /></button>
          <button className="icon-button" type="button" aria-label="위시리스트"
            onClick={() => setNotice('위시리스트는 준비 중입니다.')}><Icon kind="heart" /></button>
        </div>
      </header>

      <main className="detail-body">
        <div className="detail-media">
          {product.image
            ? <img src={product.image} alt={product.name} />
            : <ProductThumb sku={product.sku} className="detail-placeholder" />}
        </div>

        <div className="detail-info">
          <p className="detail-badges"><span className="badge-soft">{product.category}</span></p>
          <h1>{product.name}</h1>
          <p className="detail-sku">SKU {product.sku}</p>
          <p className="detail-price">{won.format(product.price)}<span>원</span></p>

          <hr />

          <div className="quantity">
            <p className="field-title">수량</p>
            <div className="quantity-control">
              <button type="button" aria-label="수량 줄이기" disabled={quantity <= 1}
                onClick={() => setQuantity(quantity - 1)}>−</button>
              <span aria-live="polite">{quantity}</span>
              <button type="button" aria-label="수량 늘리기" disabled={quantity >= 99}
                onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>

          <button className="add-to-bag" type="button" disabled={adding} onClick={addToBag}>
            <Icon kind="bag" /> {adding ? '담는 중…' : `장바구니 담기 · ${won.format(total)}원`}
          </button>
          <a className="go-to-cart" href="/cart">장바구니 보기</a>
          {notice && <p className="detail-notice" role="status">{notice}</p>}

          {product.description && <section className="detail-description">
            <h2>상품 설명</h2>
            <p>{product.description}</p>
          </section>}
        </div>
      </main>
    </div>
  )
}
