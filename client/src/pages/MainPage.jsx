import { useMemo, useState } from 'react'
import NavBar from '@/components/NavBar'
import ProductCard from '@/components/ProductCard'
import ServerStatus from '@/components/ServerStatus'
import useSession from '@/hooks/useSession'
import { categories, products } from '@/data/products'

function Hero() {
  return (
    <section className="hero">
      <p className="hero-eyebrow">INTERIOR DOOR</p>
      <h1>공간을 바꾸는<br />가장 확실한 한 끗</h1>
      <p className="hero-lead">중문부터 시공까지, 집의 인상을 정리해 주는 도어 컬렉션</p>
    </section>
  )
}

export default function MainPage() {
  const { user, loading, signOut } = useSession()
  const [active, setActive] = useState('전체')

  const visible = useMemo(
    () => (active === '전체' ? products : products.filter((p) => p.category === active)),
    [active],
  )

  return (
    <div className="shop">
      <NavBar user={user} loading={loading} onSignOut={signOut}
        categories={categories} active={active} onSelect={setActive} />

      <main>
        <Hero />

        <div className="listing-head">
          <p className="count">전체 <strong>{visible.length}</strong>건</p>
          <p className="sort">신상품순</p>
        </div>

        <div className="product-grid">
          {visible.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>

        <ServerStatus />
      </main>

      <footer className="shop-footer">
        <p>SHOPPINGMALL</p>
        <p>React + Vite 학습용 프로젝트</p>
      </footer>
    </div>
  )
}
