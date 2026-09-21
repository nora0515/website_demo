import MainPage from '@/pages/MainPage'
import SignupPage from '@/pages/SignupPage'
import LoginPage from '@/pages/LoginPage'
import AdminPage from '@/pages/AdminPage'
import AdminProductsPage from '@/pages/AdminProductsPage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import CartPage from '@/pages/CartPage'
import CheckoutPage from '@/pages/CheckoutPage'
import OrdersPage from '@/pages/OrdersPage'
import AdminOrdersPage from '@/pages/AdminOrdersPage'
import './App.css'

const routes = {
  '/login': LoginPage,
  '/signup': SignupPage,
  '/admin': AdminPage,
  '/admin/products': AdminProductsPage,
  '/cart': CartPage,
  '/checkout': CheckoutPage,
  '/orders': OrdersPage,
  '/admin/orders': AdminOrdersPage,
}

// Mongo ids are 24 hex characters; anything else is not a product URL.
const PRODUCT_PATH = /^\/products\/([0-9a-f]{24})$/i

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '')
  const Exact = routes[path]
  if (Exact) return <Exact />

  const product = PRODUCT_PATH.exec(path)
  if (product) return <ProductDetailPage id={product[1]} />

  return <MainPage />
}
