import { useState } from 'react'
import { getHealth } from '@/api/health'
import SignupPage from '@/pages/SignupPage'
import './App.css'

function HomePage() {
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('버튼을 눌러 서버 연결을 확인하세요.')

  async function checkServer() {
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
    <main className="starter">
      <p className="eyebrow">SHOPPINGMALL</p>
      <h1>쇼핑몰 개발을 시작하세요.</h1>
      <p>React + Vite 개발 환경이 준비되었습니다.</p>
      <a className="primary-link" href="/signup">회원가입</a>
      <p><code>src/App.jsx</code>를 수정하면 화면에 바로 반영됩니다.</p>
      <section aria-labelledby="connection-title">
        <h2 id="connection-title">서버 연결</h2>
        <p role="status">{message}</p>
        <button type="button" onClick={checkServer} disabled={checking}>
          {checking ? '확인 중…' : '연결 확인'}
        </button>
      </section>
    </main>
  )
}

export default function App() {
  return window.location.pathname.replace(/\/$/, '') === '/signup'
    ? <SignupPage />
    : <HomePage />
}

