import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { registerUser } from '../api/users.js'
import './Signup.css'

const EMAIL_DOMAINS = [
  'naver.com',
  'gmail.com',
  'daum.net',
  'hanmail.net',
  'kakao.com',
  'nate.com',
]

/**
 * POST /api/users body matches server/controllers/userController.js (pickAllowed):
 * email, name, password, user-type, address
 */
function todayIsoDateLocal() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function Signup() {
  const birthDateInputRef = useRef(null)
  const [isComplete, setIsComplete] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [loginId, setLoginId] = useState('')
  const [emailLocal, setEmailLocal] = useState('')
  const [emailDomain, setEmailDomain] = useState('naver.com')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function syncLoginIdToEmailLocal(value) {
    setLoginId(value)
    setEmailLocal(value)
  }

  function syncEmailLocalFromRow(value) {
    setEmailLocal(value)
    setLoginId(value)
  }

  function openBirthDatePicker() {
    const el = birthDateInputRef.current
    if (!el) return
    try {
      if (typeof el.showPicker === 'function') {
        el.showPicker()
      } else {
        el.focus()
        el.click()
      }
    } catch {
      el.focus()
      el.click()
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!emailLocal.trim()) {
      setError('아이디 및 이메일 앞부분을 입력해 주세요.')
      return
    }
    if (!name.trim()) {
      setError('이름을 입력해 주세요.')
      return
    }
    if (!password) {
      setError('비밀번호를 입력해 주세요.')
      return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    const email = `${emailLocal.trim()}@${emailDomain}`.toLowerCase()

    const body = {
      email,
      name: name.trim(),
      password,
      'user-type': 'customer',
    }

    setSubmitting(true)
    try {
      const { ok, status, data } = await registerUser(body)

      if (!ok) {
        const d = data && typeof data === 'object' ? data : {}
        const dup = d.keys && typeof d.keys === 'object' ? d.keys.email : undefined
        const msg =
          (dup && '이미 사용 중인 이메일입니다.') ||
          d.message ||
          (d.errors && typeof d.errors === 'object' && Object.values(d.errors).join(' ')) ||
          `가입에 실패했습니다. (${status})`
        setError(msg)
        return
      }

      setRegisteredEmail(email)
      setIsComplete(true)
    } catch {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isComplete) {
    return (
      <main className="signup">
        <h1 className="signup__title">회원가입 완료</h1>
        <p className="signup__success-lead">
          가입이 완료되었습니다.
          {registeredEmail ? (
            <>
              <br />
              <span className="signup__success-email">{registeredEmail}</span> 로 등록되었습니다.
            </>
          ) : null}
        </p>
        <Link className="signup__submit signup__submit--link" to="/">
          메인으로
        </Link>
      </main>
    )
  }

  return (
    <main className="signup">
      <h1 className="signup__title">회원가입</h1>

      <form onSubmit={handleSubmit} noValidate>
        {error ? (
          <p className="signup__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="signup__field">
          <label className="signup__label" htmlFor="login-id">
            아이디
          </label>
          <input
            id="login-id"
            className="signup__input"
            type="text"
            autoComplete="username"
            value={loginId}
            onChange={(e) => syncLoginIdToEmailLocal(e.target.value)}
            required
          />
        </div>

        <div className="signup__field">
          <label className="signup__label" htmlFor="password">
            비밀번호
          </label>
          <input
            id="password"
            className="signup__input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="signup__field">
          <label className="signup__label" htmlFor="password-confirm">
            비밀번호 확인
          </label>
          <input
            id="password-confirm"
            className="signup__input"
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />
        </div>

        <div className="signup__field">
          <label className="signup__label" htmlFor="name">
            이름
          </label>
          <input
            id="name"
            className="signup__input"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="signup__field">
          <label className="signup__label" htmlFor="birth-date">
            생년월일
          </label>
          <div className="signup__dob-wrap">
            <input
              ref={birthDateInputRef}
              id="birth-date"
              className="signup__input signup__input--dob"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              autoComplete="bday"
              min="1900-01-01"
              max={todayIsoDateLocal()}
            />
            <button
              type="button"
              className="signup__dob-icon-btn"
              aria-label="생년월일 달력 열기"
              onClick={openBirthDatePicker}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M3 10h18M8 2v4M16 2v4" />
              </svg>
            </button>
          </div>
        </div>

        <div className="signup__field">
          <span className="signup__label">이메일</span>
          <div className="signup__email-row">
            <input
              className="signup__input signup__email-local"
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder="이메일 앞부분"
              value={emailLocal}
              onChange={(e) => syncEmailLocalFromRow(e.target.value)}
              aria-label="이메일 앞부분"
              required
            />
            <span className="signup__at">@</span>
            <select
              className="signup__domain"
              value={emailDomain}
              onChange={(e) => setEmailDomain(e.target.value)}
              aria-label="이메일 도메인"
            >
              {EMAIL_DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="signup__submit" type="submit" disabled={submitting}>
          {submitting ? '처리 중…' : '회원가입하기'}
        </button>
      </form>

      <Link className="signup__back" to="/">
        메인으로
      </Link>
    </main>
  )
}
