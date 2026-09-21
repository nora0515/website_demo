import MainPage from '@/pages/MainPage'
import SignupPage from '@/pages/SignupPage'
import LoginPage from '@/pages/LoginPage'
import AdminPage from '@/pages/AdminPage'
import AdminProductsPage from '@/pages/AdminProductsPage'
import './App.css'

const routes = {
  '/login': LoginPage,
  '/signup': SignupPage,
  '/admin': AdminPage,
  '/admin/products': AdminProductsPage,
}

export default function App() {
  const Page = routes[window.location.pathname.replace(/\/$/, '')] ?? MainPage
  return <Page />
}
