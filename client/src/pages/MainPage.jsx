import { useEffect, useState } from 'react'
import NavBar from '@/components/NavBar'
import ProductCard from '@/components/ProductCard'
import Pagination from '@/components/Pagination'
import useSession from '@/hooks/useSession'
import useCart from '@/hooks/useCart'
import { listProducts } from '@/api/products'
import { categories } from '@/data/products'
// Imported rather than served from public/ so Vite fingerprints the filename:
// replacing the picture changes the URL, and no stale copy can be cached.
import heroImage from '@/assets/hero.jpg'

function Hero() {
  // Full-bleed banner: no overlaid text, so the artwork carries the section.
  return (
    <section className="hero">
      <img src={heroImage} alt="" />
    </section>
  )
}

const PER_PAGE = 8
const SORTS = [
  { id: 'recommended', label: '추천순' },
  { id: 'new', label: '신상품순' },
]

export default function MainPage() {
  const { user, loading, signOut } = useSession()
  const { cart } = useCart()
  // The bar sits on the banner at the top and turns solid once past it.
  const [solid, setSolid] = useState(false)
  const [active, setActive] = useState('전체')
  const [sort, setSort] = useState('recommended')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [listing, setListing] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 90)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let live = true
    // The server filters by category, so switching tabs refetches.
    listProducts({ page, limit: PER_PAGE, sort, category: active === '전체' ? undefined : active })
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
  }, [active, sort, page])

  // Flipping the spinner on here, in the event, keeps the effect free of
  // synchronous state updates.
  function selectCategory(category) {
    if (category === active) return
    setListing(true)
    setActive(category)
    // A filter change invalidates the current page number.
    setPage(1)
  }

  function selectSort(next) {
    if (next === sort) return
    setListing(true)
    setSort(next)
    // A different order invalidates the current page number.
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
      <NavBar user={user} loading={loading} onSignOut={signOut} cartCount={cart?.count ?? 0} solid={solid}
        categories={categories} active={active} onSelect={selectCategory} />

      <main>
        <Hero />

        <div className="listing-head">
          <p className="count">{active} <strong>{total}</strong>건</p>
          <div className="sort">
            {SORTS.map(({ id, label }) => (
              <button key={id} type="button"
                className={id === sort ? 'sort-option is-active' : 'sort-option'}
                aria-pressed={id === sort}
                onClick={() => selectSort(id)}>{label}</button>
            ))}
          </div>
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
      </main>

      <footer className="shop-footer">
        <a className="footer-brand" href="/">NORAMALL</a>
        <p>React + Vite 학습용 프로젝트</p>
      </footer>
    </div>
  )
}
