import { useEffect, useState } from 'react'
import ProductForm from '@/components/ProductForm'
import useSession from '@/hooks/useSession'
import { deleteProduct, listProducts } from '@/api/products'

const won = new Intl.NumberFormat('ko-KR')
const TABS = [
  { id: 'list', label: '상품 목록' },
  { id: 'new', label: '상품 등록' },
]

function ProductTable({ items, loading, error, onEdit, onDelete }) {
  if (loading) return <p className="table-empty">불러오는 중…</p>
  if (error) return <p className="table-empty">{error}</p>
  if (!items.length) return <p className="table-empty">등록된 상품이 없습니다. 상품 등록 탭에서 추가해 보세요.</p>

  return (
    <table className="product-table">
      <thead>
        <tr><th>SKU</th><th>상품명</th><th>카테고리</th><th className="right">가격</th><th /></tr>
      </thead>
      <tbody>
        {items.map((product) => (
          <tr key={product._id}>
            <td className="mono">{product.sku}</td>
            <td>{product.name}</td>
            <td><span className="chip">{product.category}</span></td>
            <td className="right">{won.format(product.price)}원</td>
            <td className="right">
              <div className="row-actions">
                <button className="row-edit" type="button" onClick={() => onEdit(product)}>수정</button>
                <button className="row-delete" type="button" onClick={() => onDelete(product)}>삭제</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function AdminProductsPage() {
  const { user, loading } = useSession()
  const [tab, setTab] = useState('list')
  const [items, setItems] = useState([])
  const [listing, setListing] = useState(true)
  const [listError, setListError] = useState('')
  const [reloads, setReloads] = useState(0)
  const [editing, setEditing] = useState(null)

  const allowed = Boolean(user) && user.user_type === 'admin'
  useEffect(() => {
    if (!loading && !allowed) window.location.replace('/')
  }, [loading, allowed])

  useEffect(() => {
    if (!allowed) return undefined
    let live = true
    listProducts()
      .then((data) => { if (live) { setItems(data.products); setListError('') } })
      .catch((err) => { if (live) setListError(err.message) })
      // A stale response from a previous reload must not overwrite the current one.
      .finally(() => { if (live) setListing(false) })
    return () => { live = false }
  }, [allowed, reloads])

  function reload() {
    setListing(true)
    setReloads((count) => count + 1)
  }

  function edit(product) {
    setEditing(product)
    setTab('new')
  }

  function startNew() {
    setEditing(null)
    setTab('new')
  }

  async function remove(product) {
    if (!window.confirm(`${product.name} (${product.sku}) 을(를) 삭제할까요?`)) return
    try {
      await deleteProduct(product._id)
      setItems((previous) => previous.filter((item) => item._id !== product._id))
    } catch (err) {
      setListError(err.message)
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
          <p className="admin-brand">상품 관리</p>
        </div>
        <button className="admin-cta" type="button" onClick={startNew}>
          <span aria-hidden="true">+</span> 새 상품 등록
        </button>
      </header>

      <main className="admin-body">
        <div className="tabs" role="tablist">
          {TABS.map(({ id, label }) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id}
              className={tab === id ? 'tab is-active' : 'tab'}
              onClick={() => { if (id === 'new') startNew(); else setTab(id) }}>
              {id === 'new' && editing ? '상품 수정' : label}
            </button>
          ))}
        </div>

        <section className="panel tab-panel" role="tabpanel">
          {tab === 'list'
            ? <>
              <div className="panel-head">
                <h2>등록된 상품 <span className="count-badge">{items.length}</span></h2>
                <button className="panel-link" type="button" onClick={reload}>새로고침</button>
              </div>
              <ProductTable items={items} loading={listing} error={listError}
                onEdit={edit} onDelete={remove} />
            </>
            : <ProductForm key={editing?._id ?? 'new'} product={editing}
              onSaved={reload} onCancel={() => { setEditing(null); setTab('list') }} />}
        </section>
      </main>
    </div>
  )
}
