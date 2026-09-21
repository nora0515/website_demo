const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export async function getHealth() {
  const response = await fetch(`${baseUrl}/health`, {
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) throw new Error('서버 연결을 확인해 주세요.')
  const data = await response.json()
  if (data.status !== 'ok' || data.database !== 'connected') {
    throw new Error('데이터베이스 연결을 확인해 주세요.')
  }
  return data
}

