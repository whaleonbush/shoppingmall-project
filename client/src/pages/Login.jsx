import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaUser, FaLock, FaBolt, FaFacebookF } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'
import { loginRequest, getMeRequest } from '../api/auth.js'
import './Login.css'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80'

/** Maps HTTP status + auth JSON body to a user-facing string (authController.login). */
function loginErrorMessage(status, data) {
  const d = data && typeof data === 'object' ? data : {}
  if (typeof d.message === 'string' && d.message.trim()) {
    return d.message
  }
  if (status === 400) return '이메일과 비밀번호를 입력해 주세요.'
  if (status === 401) return '이메일 또는 비밀번호가 올바르지 않습니다.'
  if (status === 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  return `로그인에 실패했습니다. (${status})`
}

/**
 * Login form → POST /api/auth/login (see server/routes/index.js `/auth`, authController).
 * Email/password match User model used by userController CRUD; does not use /api/users for login.
 */
export default function Login() {
  const navigate = useNavigate()
  const [checkingSession, setCheckingSession] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem('token')
    if (!token) {
      setCheckingSession(false)
      return
    }

    let cancelled = false

    getMeRequest(token)
      .then(({ ok, data }) => {
        if (cancelled) return
        const d = data && typeof data === 'object' ? data : {}
        if (ok && d.success && d.user) {
          sessionStorage.setItem('authUser', JSON.stringify(d.user))
          navigate('/', { replace: true })
          return
        }
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('authUser')
        setCheckingSession(false)
      })
      .catch(() => {
        if (cancelled) return
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('authUser')
        setCheckingSession(false)
      })

    return () => {
      cancelled = true
    }
  }, [navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.')
      return
    }

    setSubmitting(true)
    try {
      const { ok, status, data } = await loginRequest({
        email: trimmed,
        password,
      })
      const d = data && typeof data === 'object' ? data : {}

      if (!ok) {
        setError(loginErrorMessage(status, d))
        return
      }

      if (d.success === false) {
        setError(loginErrorMessage(status, d))
        return
      }

      if (!d.token || typeof d.token !== 'string') {
        setError('로그인 응답에 토큰이 없습니다. 서버 설정을 확인해 주세요.')
        return
      }

      sessionStorage.setItem('token', d.token)
      if (d.user && typeof d.user === 'object') {
        sessionStorage.setItem('authUser', JSON.stringify(d.user))
      } else {
        sessionStorage.removeItem('authUser')
      }

      navigate('/', { replace: true })
    } catch {
      setError('서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="login-page login-page--checking" role="status" aria-live="polite">
        세션 확인 중…
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <section className="login-card__form" aria-labelledby="login-heading">
          <div className="login-card__brand">
            <h1 id="login-heading" className="login-card__title">
              LOGIN
            </h1>
            <p className="login-card__subtitle">
              How do I get started? Sign in with your email and start shopping.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {error ? (
              <p className="login-error" role="alert">
                {error}
              </p>
            ) : null}

            <label className="login-field" htmlFor="login-email">
              <span className="login-field__icon" aria-hidden>
                <FaUser />
              </span>
              <input
                id="login-email"
                className="login-field__input"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="login-field" htmlFor="login-password">
              <span className="login-field__icon" aria-hidden>
                <FaLock />
              </span>
              <input
                id="login-password"
                className="login-field__input"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <button className="login-submit" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Login Now'}
            </button>
          </form>

          <div className="login-divider">Login with Others</div>

          <div className="login-social">
            <button type="button" className="login-social__btn">
              <FcGoogle className="login-social__icon" aria-hidden />
              Login with Google
            </button>
            <button type="button" className="login-social__btn">
              <FaFacebookF className="login-social__icon" style={{ color: '#1877f2' }} aria-hidden />
              Login with Facebook
            </button>
          </div>

          <p className="login-footer">
            Don&apos;t have an account?{' '}
            <Link to="/signup">Sign up</Link>
          </p>
        </section>

        <aside className="login-card__visual" aria-hidden>
          <div className="login-card__visual-inner">
            <div className="login-card__frame">
              <span className="login-card__badge">
                <FaBolt />
              </span>
              <img
                src={HERO_IMAGE}
                alt=""
                width={720}
                height={900}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
