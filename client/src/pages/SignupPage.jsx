import { useRef, useState } from 'react'
import { createUser } from '@/api/users'

function Icon({ kind }) {
  const paths = {
    user: <><circle cx="12" cy="8" r="3" /><path d="M5 21v-3a7 7 0 0 1 14 0v3" /></>,
    phone: <path d="m7 3 3 5-2 2a15 15 0 0 0 6 6l2-2 5 3-1 4C10 22 2 14 3 4Z" />,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V6a4 4 0 0 1 8 0v4" /></>,
    address: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
    eye: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
  }
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>
}

function PasswordField({ id, label, placeholder, onChange, error, hint }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="signup-field">
      <label htmlFor={id}>{label}</label>
      <div className="input-shell">
        <Icon kind="lock" />
        <input id={id} name={id} type={visible ? 'text' : 'password'} required
          autoComplete="new-password" placeholder={placeholder} onChange={onChange}
          aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} />
        <button className="visibility-toggle" type="button" aria-label={`${label} ${visible ? '숨기기' : '보기'}`}
          aria-pressed={visible} onClick={() => setVisible(!visible)}><Icon kind="eye" /></button>
      </div>
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
    </div>
  )
}

export default function SignupPage() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [complete, setComplete] = useState(false)
  const submitting = useRef(false)

  function clearError(event) {
    const name = event.target.name
    setErrors((previous) => ({ ...previous, [name]: '' }))
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    if (submitting.current) return
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    const invalid = {}
    if (!values.name.trim()) invalid.name = '이름을 입력해 주세요.'
    if (!/^[0-9+()\s-]{7,20}$/.test(values.phone_number.trim()) || values.phone_number.replace(/\D/g, '').length < 7) {
      invalid.phone_number = '올바른 전화번호를 입력해 주세요.'
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/.test(values.password)) {
      invalid.password = '8자 이상, 영문·숫자·특수문자를 포함해 주세요.'
    }
    if (values.password !== values.confirmPassword) invalid.confirmPassword = '비밀번호가 일치하지 않습니다.'
    setErrors(invalid)
    setError('')
    if (Object.keys(invalid).length) {
      form.elements.namedItem(Object.keys(invalid)[0]).focus()
      return
    }
    submitting.current = true
    setBusy(true)
    try {
      await createUser({
        name: values.name.trim(),
        phone_number: values.phone_number.trim(),
        password: values.password,
        user_type: 'customer',
        ...(values.address.trim() ? { address: values.address.trim() } : {}),
      })
      setComplete(true)
    } catch (err) {
      setError(err.message)
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return (
    <main className="signup-page">
      <a className="back-link" href="/">← 메인으로</a>
      <div className="signup-card">
        {complete ? <div className="signup-success" role="status">
          <span className="success-mark" aria-hidden="true">✓</span>
          <h1>회원가입이 완료되었습니다</h1>
          <p>새로운 계정으로 즐거운 쇼핑을 시작하세요.</p>
          <a className="primary-link" href="/">메인으로 돌아가기</a>
        </div> : <>
          <header className="signup-heading">
            <h1>회원가입</h1>
            <p>새로운 계정을 만들어 쇼핑을 시작하세요</p>
          </header>
          <form onSubmit={submit}>
            <fieldset disabled={busy}>
              <div className="signup-field">
                <label htmlFor="name">이름</label>
                <div className="input-shell"><Icon kind="user" />
                  <input id="name" name="name" placeholder="이름" autoComplete="name" required onChange={clearError}
                    aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} />
                </div>
                {errors.name && <p className="field-error" id="name-error">{errors.name}</p>}
              </div>
              <div className="signup-field">
                <label htmlFor="phone_number">전화번호</label>
                <div className="input-shell"><Icon kind="phone" />
                  <input id="phone_number" name="phone_number" type="tel" placeholder="010-1234-5678" autoComplete="tel" required onChange={clearError}
                    aria-invalid={Boolean(errors.phone_number)} aria-describedby={errors.phone_number ? 'phone-error' : undefined} />
                </div>
                {errors.phone_number && <p className="field-error" id="phone-error">{errors.phone_number}</p>}
              </div>
              <PasswordField id="password" label="비밀번호" placeholder="비밀번호를 입력하세요"
                hint="8자 이상, 영문, 숫자, 특수문자 포함" error={errors.password} onChange={clearError} />
              <PasswordField id="confirmPassword" label="비밀번호 확인" placeholder="비밀번호를 다시 입력하세요"
                error={errors.confirmPassword} onChange={clearError} />
              <div className="signup-field">
                <label htmlFor="address">주소 <span className="optional">(선택)</span></label>
                <div className="input-shell"><Icon kind="address" />
                  <input id="address" name="address" placeholder="주소를 입력하세요" autoComplete="street-address" />
                </div>
              </div>
              <div className="signup-footer">
                {error && <p className="submit-error" role="alert">{error}</p>}
                <button className="signup-submit" type="submit">{busy ? '가입 처리 중…' : '회원가입'}</button>
                <p className="signup-note">일반 고객 계정으로 가입됩니다.</p>
              </div>
            </fieldset>
          </form>
        </>}
      </div>
    </main>
  )
}
