import ProductThumb from '@/components/ProductThumb'

const won = new Intl.NumberFormat('ko-KR')

export default function ProductCard({ product }) {
  return (
    <a className="product" href={`/products/${product._id}`}>
      {product.image
        ? <img className="thumb thumb-photo" src={product.image} alt={product.name} loading="lazy" />
        : <ProductThumb sku={product.sku} />}
      <h3>{product.name}</h3>
      <p className="product-category">{product.category}</p>
      <p className="price">{won.format(product.price)}<span>원</span></p>
    </a>
  )
}
