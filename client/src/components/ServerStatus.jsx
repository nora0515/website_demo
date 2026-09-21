import { useState } from 'react'
import { getHealth } from '@/api/health'

export default function ServerStatus() {
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('버튼을 눌러 서버 연결을 확인하세요.')

  async function check() {
    setChecking(true)
    setMessage('연결 확인 중…')
    try {
      await getHealth()
      setMessage('서버와 MongoDB가 연결되어 있습니다.')
    } catch {
      setMessage('연결할 수 없습니다. Express 서버와 MongoDB 실행 상태를 확인하세요.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <section className="dev-panel" aria-labelledby="connection-title">
      <h2 id="connection-title">서버 연결</h2>
      <p role="status">{message}</p>
      <button type="button" onClick={check} disabled={checking}>
        {checking ? '확인 중…' : '연결 확인'}
      </button>
    </section>
  )
}
