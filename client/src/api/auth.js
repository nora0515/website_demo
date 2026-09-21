const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const TOKEN_KEY = 'shoppingmall.token'

export async function login(credentials) {
  let response
  try {
    response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    throw new Error('서버 응답을 확인하지 못했습니다. 연결 상태를 확인해 주세요.')
  }
  if (!response.ok) {
    throw new Error(response.status === 401
      ? '전화번호 또는 비밀번호가 올바르지 않습니다.'
      : response.status === 400
        ? '입력 정보를 다시 확인해 주세요.'
        : '로그인을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }
  const data = await response.json()
  if (!data.token) throw new Error('로그인 결과를 확인하지 못했습니다.')
  return data
}

// Resolves to the signed-in account, or null when there is no usable token.
export async function fetchMe() {
  const token = readToken()
  if (!token) return null
  let response
  try {
    response = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    // The server may be down; keep the token so a later reload can still use it.
    return null
  }
  if (response.status === 401) {
    // Expired or revoked: drop it so the page stops presenting a signed-in state.
    clearToken()
    return null
  }
  if (!response.ok) return null
  const data = await response.json()
  return data.user ?? null
}

// sessionStorage clears when the tab closes; localStorage is the "stay signed in" case.
export function storeToken(token, persist) {
  clearToken()
  try {
    ;(persist ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
  } catch {
    // Private-mode browsers can refuse storage; the session simply won't survive a reload.
  }
}

export function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
