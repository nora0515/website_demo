import { useCallback, useEffect, useState } from 'react'
import { clearToken, fetchMe, readToken } from '@/api/auth'

// Resolves the signed-in account once per page load.
export default function useSession() {
  const [user, setUser] = useState(null)
  // With no stored token there is nobody to look up, so the signed-out UI can
  // render on the first paint instead of flashing a placeholder.
  const [loading, setLoading] = useState(() => Boolean(readToken()))

  useEffect(() => {
    if (!readToken()) return undefined
    let live = true
    fetchMe()
      .then((found) => { if (live) setUser(found) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [])

  const signOut = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  return { user, loading, signOut }
}
