const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export async function createUser(user) {
  let response
  try {
    response = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    throw new Error('서버 응답을 확인하지 못했습니다. 연결 상태를 확인해 주세요.')
  }
  if (!response.ok) {
    if (response.status === 409) {
      throw new Error('이미 가입된 전화번호입니다.')
    }
    throw new Error(response.status === 400
      ? '입력 정보를 다시 확인해 주세요.'
      : '회원가입을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }
  const data = await response.json()
  if (!data.user?._id) throw new Error('회원가입 결과를 확인하지 못했습니다.')
  return data.user
}
