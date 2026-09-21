import { useEffect, useState } from 'react'
import NavBar from '@/components/NavBar'
import ProductCard from '@/components/ProductCard'
import Pagination from '@/components/Pagination'
import ServerStatus from '@/components/ServerStatus'
import useSession from '@/hooks/useSession'
import useCart from '@/hooks/useCart'
import { listProducts } from '@/api/products'
import { categories } from '@/data/products'

function Hero() {
  return (
    <section className="hero">
      <p className="hero-eyebrow">INTERIOR DOOR</p>
      <h1>공간을 바꾸는<br />가장 확실한 한 끗</h1>
      <p className="hero-lead">중문부터 시공까지, 집의 인상을 정리해 주는 도어 컬렉션</p>
    </section>
  )
}

const PER_PAGE = 8

export default function MainPage() {
  const { user, loading, signOut } = useSession()
  const { cart } = useCart()
  const [active, setActive] = useState('전체')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [listing, setListing] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    // The server filters by category, so switching tabs refetches.
    listProducts({ page, limit: PER_PAGE, category: active === '전체' ? undefined : active })
      .then((data) => {
        if (!live) return
        setItems(data.products)
        setTotal(data.total)
        setError('')
      })
      .catch((err) => { if (live) setError(err.message) })
      // A slow response from a previous tab must not overwrite the current one.
      .finally(() => { if (live) setListing(false) })
    return () => { live = false }
  }, [active, page])

  // Flipping the spinner on here, in the event, keeps the effect free of
  // synchronous state updates.
  function selectCategory(category) {
    if (category === active) return
    setListing(true)
    setActive(category)
    // A filter change invalidates the current page number.
    setPage(1)
  }

  function goToPage(next) {
    if (next === page) return
    setListing(true)
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="shop">
      <NavBar user={user} loading={loading} onSignOut={signOut} cartCount={cart?.count ?? 0}
        categories={categories} active={active} onSelect={selectCategory} />

      <main>
        <Hero />

        <div className="listing-head">
          <p className="count">{active} <strong>{total}</strong>건</p>
          <p className="sort">신상품순</p>
        </div>

        {listing
          ? <p className="grid-message">상품을 불러오는 중…</p>
          : error
            ? <p className="grid-message">{error}</p>
            : items.length === 0
              ? <p className="grid-message">등록된 상품이 없습니다.</p>
              : <>
                <div className="product-grid">
                  {items.map((product) => <ProductCard key={product._id} product={product} />)}
                </div>
                <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} onChange={goToPage} />
              </>}

        <ServerStatus />
      </main>

      <footer className="shop-footer">
        <p>SHOPPINGMALL</p>
        <p>React + Vite 학습용 프로젝트</p>
      </footer>
    </div>
  )
}
