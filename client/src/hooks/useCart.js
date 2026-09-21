import { useEffect, useState } from 'react'
import { getCart } from '@/api/cart'
import { readToken } from '@/api/auth'

// Loads the signed-in account's cart; with no token there is nothing to fetch.
export default function useCart() {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(readToken()))

  useEffect(() => {
    if (!readToken()) return undefined
    let live = true
    getCart()
      .then((loaded) => { if (live) setCart(loaded) })
      .catch(() => { if (live) setCart(null) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [])

  return { cart, setCart, loading }
}
