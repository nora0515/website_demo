import { useEffect, useRef, useState } from 'react'
import { login, storeToken } from '@/api/auth'
import useSession from '@/hooks/useSession'

function Icon({ kind }) {
  const paths = {
    phone: <path d="m7 3 3 5-2 2a15 15 0 0 0 6 6l2-2 5 3-1 4C10 22 2 14 3 4Z" />,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V6a4 4 0 0 1 8 0v4" /></>,
    eye: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
  }
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>
}

// Brand marks are solid shapes, so they are drawn with fill rather than stroke.
function BrandIcon({ kind }) {
  const paths = {
    kakao: <path d="M12 3C6.9 3 2.8 6.3 2.8 10.3c0 2.6 1.7 4.8 4.3 6.1l-1.1 4c-.1.4.3.7.6.5l4.7-3.1c.2 0 .5.1.7.1 5.1 0 9.2-3.3 9.2-7.6S17.1 3 12 3Z" />,
    facebook: <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z" />,
    apple: <path d="M16.4 12.7c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.6.7 2.8.7c1.2 0 1.9-1 2.6-2.1.8-1.2 1.2-2.4 1.2-2.4s-2.2-.9-2.3-3.4ZM14.2 6.3c.6-.7 1-1.7.9-2.8-.9 0-2 .6-2.6 1.3-.6.7-1.1 1.7-.9 2.7 1 .1 2-.5 2.6-1.2Z" />,
  }
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{paths[kind]}</svg>
}

const providers = [
  { id: 'kakao', name: '카카오톡', label: '카카오톡으로 로그인' },
  { id: 'facebook', name: 'Facebook', label: 'Facebook으로 로그인' },
  { id: 'apple', name: 'Apple', label: 'Apple로 로그인' },
]

export default function LoginPage() {
  const { user, loading } = useSession()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [visible, setVisible] = useState(false)
  const submitting = useRef(false)

  // Already signed in: send them on instead of asking again. replace() keeps the
  // login page out of history, so Back does not bounce them here.
  useEffect(() => {
    if (user) window.location.replace('/')
  }, [user])

  function clearError(event) {
    setErrors((previous) => ({ ...previous, [event.target.name]: '' }))
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    if (submitting.current) return
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    const invalid = {}
    if (!values.phone_number.trim()) invalid.phone_number = '전화번호를 입력해 주세요.'
    if (!values.password) invalid.password = '비밀번호를 입력해 주세요.'
    setErrors(invalid)
    setError('')
    setNotice('')
    if (Object.keys(invalid).length) {
      form.elements.namedItem(Object.keys(invalid)[0]).focus()
      return
    }
    submitting.current = true
    setBusy(true)
    try {
      const { token } = await login({
        phone_number: values.phone_number.trim(),
        password: values.password,
      })
      storeToken(token, values.remember === 'on')
      window.location.assign('/')
    } catch (err) {
      setError(err.message)
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  if (loading || user) {
    return <main className="signup-page"><p className="login-checking" role="status">로그인 상태를 확인하는 중…</p></main>
  }

  return (
    <main className="signup-page">
      <a className="back-link" href="/">← 메인으로</a>
      <div className="signup-card">
        <header className="signup-heading">
          <h1>로그인</h1>
          <p>계정에 로그인하여 쇼핑을 시작하세요</p>
        </header>
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <div className="signup-field">
              <label htmlFor="phone_number">전화번호</label>
              <div className="input-shell"><Icon kind="phone" />
                <input id="phone_number" name="phone_number" type="tel" placeholder="010-1234-5678"
                  autoComplete="tel" required onChange={clearError}
                  aria-invalid={Boolean(errors.phone_number)}
                  aria-describedby={errors.phone_number ? 'phone-error' : undefined} />
              </div>
              {errors.phone_number && <p className="field-error" id="phone-error">{errors.phone_number}</p>}
            </div>
            <div className="signup-field">
              <label htmlFor="password">비밀번호</label>
              <div className="input-shell"><Icon kind="lock" />
                <input id="password" name="password" type={visible ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요" autoComplete="current-password" required onChange={clearError}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined} />
                <button className="visibility-toggle" type="button" aria-pressed={visible}
                  aria-label={`비밀번호 ${visible ? '숨기기' : '보기'}`}
                  onClick={() => setVisible(!visible)}><Icon kind="eye" /></button>
              </div>
              {errors.password && <p className="field-error" id="password-error">{errors.password}</p>}
            </div>
            <div className="login-options">
              <label className="remember" htmlFor="remember">
                <input id="remember" name="remember" type="checkbox" />
                로그인 상태 유지
              </label>
              <button className="text-link" type="button"
                onClick={() => setNotice('비밀번호 찾기는 준비 중입니다.')}>비밀번호 찾기</button>
            </div>
            {error && <p className="submit-error" role="alert">{error}</p>}
            <button className="signup-submit login-submit" type="submit">
              {busy ? '로그인 중…' : '로그인'}
            </button>
            <p className="divider"><span>또는</span></p>
            <div className="providers">
              {providers.map(({ id, name, label }) => (
                <button key={id} className={`provider provider-${id}`} type="button"
                  onClick={() => setNotice(`${name} 로그인은 준비 중입니다.`)}>
                  <BrandIcon kind={id} />{label}
                </button>
              ))}
            </div>
            {notice && <p className="login-notice" role="status">{notice}</p>}
          </fieldset>
        </form>
      </div>
      <p className="signup-prompt">
        아직 계정이 없으신가요? <a href="/signup">회원가입</a>
      </p>
    </main>
  )
}
