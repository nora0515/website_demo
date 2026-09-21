const won = new Intl.NumberFormat('ko-KR')

// Stands in for photography until real product images exist.
function Thumbnail({ tone }) {
  return (
    <div className={`thumb tone-${tone}`} aria-hidden="true">
      <svg viewBox="0 0 120 150" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="18" y="12" width="84" height="126" rx="2" />
        <rect x="26" y="20" width="32" height="110" rx="1" />
        <rect x="62" y="20" width="32" height="110" rx="1" />
        <path d="M26 56h68M26 94h68" />
        <circle cx="58" cy="76" r="2.2" />
      </svg>
    </div>
  )
}

export default function ProductCard({ product }) {
  return (
    <article className="product">
      <Thumbnail tone={product.tone} />
      {product.badge && <span className={`badge badge-${product.badge.toLowerCase()}`}>{product.badge}</span>}
      <h3>{product.name}</h3>
      <p className="product-category">{product.category}</p>
      <p className="price">{won.format(product.price)}<span>원</span></p>
    </article>
  )
}
