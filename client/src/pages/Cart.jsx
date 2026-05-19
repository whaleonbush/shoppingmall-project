import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaArrowLeft,
  FaImage,
  FaMinus,
  FaPlus,
  FaShoppingBag,
  FaTimes,
  FaTrash,
} from 'react-icons/fa'
import { getMeRequest } from '../api/auth.js'
import {
  clearCartRequest,
  getMyCartRequest,
  notifyCartUpdated,
  removeCartItemRequest,
  updateCartItemRequest,
} from '../api/cart.js'
import Navbar from '../components/Navbar.jsx'
import './Cart.css'

const KRW = new Intl.NumberFormat('ko-KR')

function formatPrice(value) {
  const n = Number(value)
  return Number.isFinite(n) ? `₩${KRW.format(n)}` : ''
}

function isAdminUser(user) {
  return Boolean(user) && user['user-type'] === 'admin'
}

function useCurrentUser() {
  const [me, setMe] = useState(null)
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem('token')
    if (!token) {
      setSessionChecked(true)
      return
    }
    let cancelled = false
    getMeRequest(token)
      .then(({ ok, data }) => {
        if (cancelled) return
        const d = data && typeof data === 'object' ? data : {}
        if (ok && d.success && d.user) {
          setMe(d.user)
          sessionStorage.setItem('authUser', JSON.stringify(d.user))
        } else {
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('authUser')
        }
      })
      .catch(() => {
        if (cancelled) return
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('authUser')
      })
      .finally(() => {
        if (!cancelled) setSessionChecked(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('authUser')
    setMe(null)
  }, [])

  return { me, sessionChecked, logout }
}

export default function Cart() {
  const navigate = useNavigate()
  const { me, sessionChecked, logout } = useCurrentUser()

  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingKey, setActingKey] = useState(null)
  const [toast, setToast] = useState('')

  const showToast = useCallback((message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }, [])

  const applyCart = useCallback((nextCart) => {
    setCart(nextCart ?? null)
    notifyCartUpdated(nextCart)
  }, [])

  const fetchCart = useCallback(async () => {
    const token = sessionStorage.getItem('token')
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    setLoading(true)
    setError('')
    try {
      const { ok, status, data } = await getMyCartRequest(token)
      if (!ok) {
        if (status === 401) {
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('authUser')
          navigate('/login', { replace: true })
          return
        }
        setError(
          (data && typeof data === 'object' && data.message) ||
            `장바구니를 불러오지 못했습니다. (${status})`
        )
        return
      }
      const d = data && typeof data === 'object' ? data : {}
      applyCart(d.cart ?? null)
    } catch {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }, [applyCart, navigate])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const items = useMemo(
    () => (Array.isArray(cart?.items) ? cart.items : []),
    [cart]
  )

  const totalQuantity = Number(cart?.total_quantity) || 0
  const totalPrice = Number(cart?.total) || 0

  const handleQuantityChange = useCallback(
    async (item, nextQty) => {
      const token = sessionStorage.getItem('token')
      if (!token) {
        navigate('/login', { replace: true })
        return
      }
      const key = `${item.option_id}::${item.size ?? ''}`
      setActingKey(key)
      try {
        const { ok, status, data } = await updateCartItemRequest(
          item.option_id,
          { size: item.size, quantity: nextQty },
          token
        )
        if (!ok) {
          if (status === 401) {
            sessionStorage.removeItem('token')
            sessionStorage.removeItem('authUser')
            navigate('/login', { replace: true })
            return
          }
          showToast(
            (data && typeof data === 'object' && data.message) ||
              '수량을 변경하지 못했습니다.'
          )
          return
        }
        const d = data && typeof data === 'object' ? data : {}
        applyCart(d.cart ?? null)
      } catch {
        showToast('서버 통신 오류가 발생했습니다.')
      } finally {
        setActingKey(null)
      }
    },
    [applyCart, navigate, showToast]
  )

  const handleRemove = useCallback(
    async (item) => {
      const token = sessionStorage.getItem('token')
      if (!token) {
        navigate('/login', { replace: true })
        return
      }
      const key = `${item.option_id}::${item.size ?? ''}`
      setActingKey(key)
      try {
        const { ok, status, data } = await removeCartItemRequest(
          item.option_id,
          item.size,
          token
        )
        if (!ok) {
          if (status === 401) {
            sessionStorage.removeItem('token')
            sessionStorage.removeItem('authUser')
            navigate('/login', { replace: true })
            return
          }
          showToast(
            (data && typeof data === 'object' && data.message) ||
              '항목을 삭제하지 못했습니다.'
          )
          return
        }
        const d = data && typeof data === 'object' ? data : {}
        applyCart(d.cart ?? null)
        showToast('항목이 삭제되었습니다.')
      } catch {
        showToast('서버 통신 오류가 발생했습니다.')
      } finally {
        setActingKey(null)
      }
    },
    [applyCart, navigate, showToast]
  )

  const handleClear = useCallback(async () => {
    if (items.length === 0) return
    if (!window.confirm('장바구니를 모두 비우시겠습니까?')) return

    const token = sessionStorage.getItem('token')
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    setActingKey('__clear__')
    try {
      const { ok, status, data } = await clearCartRequest(token)
      if (!ok) {
        if (status === 401) {
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('authUser')
          navigate('/login', { replace: true })
          return
        }
        showToast(
          (data && typeof data === 'object' && data.message) ||
            '장바구니를 비우지 못했습니다.'
        )
        return
      }
      const d = data && typeof data === 'object' ? data : {}
      applyCart(d.cart ?? null)
      showToast('장바구니를 비웠습니다.')
    } catch {
      showToast('서버 통신 오류가 발생했습니다.')
    } finally {
      setActingKey(null)
    }
  }, [applyCart, items.length, navigate, showToast])

  return (
    <div className="cart-page">
      <Navbar
        me={me}
        isAdmin={isAdminUser(me)}
        sessionChecked={sessionChecked}
        onLogout={logout}
      />

      <main className="cart">
        <header className="cart__header">
          <button
            type="button"
            className="cart__back-btn"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft aria-hidden />
            쇼핑 계속하기
          </button>
          <h1 className="cart__title">
            <FaShoppingBag aria-hidden />
            장바구니
            {totalQuantity > 0 ? (
              <span className="cart__count">{totalQuantity}</span>
            ) : null}
          </h1>
          {items.length > 0 ? (
            <button
              type="button"
              className="cart__clear-btn"
              onClick={handleClear}
              disabled={actingKey === '__clear__'}
            >
              <FaTrash aria-hidden />
              전체 비우기
            </button>
          ) : (
            <span />
          )}
        </header>

        {loading ? (
          <div className="cart__skeleton">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="cart__skeleton-row" />
            ))}
          </div>
        ) : error ? (
          <div className="cart__empty" role="alert">
            {error}
            <button
              type="button"
              className="cart__retry-btn"
              onClick={fetchCart}
            >
              다시 시도
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="cart__empty">
            <FaShoppingBag aria-hidden className="cart__empty-icon" />
            <p>장바구니가 비어 있습니다.</p>
            <Link to="/" className="cart__retry-btn cart__retry-btn--primary">
              상품 둘러보기
            </Link>
          </div>
        ) : (
          <div className="cart__layout">
            <ul className="cart__list">
              {items.map((item) => (
                <CartRow
                  key={`${item.option_id}::${item.size ?? ''}`}
                  item={item}
                  busy={actingKey === `${item.option_id}::${item.size ?? ''}`}
                  onChangeQuantity={handleQuantityChange}
                  onRemove={handleRemove}
                />
              ))}
            </ul>

            <aside className="cart__summary">
              <h2 className="cart__summary-title">주문 요약</h2>
              <dl className="cart__summary-list">
                <div>
                  <dt>상품 개수</dt>
                  <dd>{KRW.format(totalQuantity)}개</dd>
                </div>
                <div>
                  <dt>상품 금액</dt>
                  <dd>{formatPrice(totalPrice)}</dd>
                </div>
                <div>
                  <dt>배송비</dt>
                  <dd>무료</dd>
                </div>
              </dl>
              <div className="cart__summary-total">
                <span>결제 예상 금액</span>
                <strong>{formatPrice(totalPrice)}</strong>
              </div>
              <button
                type="button"
                className="cart__checkout-btn"
                onClick={() => showToast('결제 기능은 곧 추가됩니다.')}
              >
                결제하기
              </button>
            </aside>
          </div>
        )}
      </main>

      {toast ? (
        <div className="cart__toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  )
}

function CartRow({ item, busy, onChangeQuantity, onRemove }) {
  const name = item.product?.product_name || '상품 정보 없음'
  const image = item.product?.option_image_url
  const subCategory = item.product?.sub_category
  const stock = Number(item.product?.stock_quantity) || 0
  const productMissing = Boolean(item.product_missing)

  return (
    <li className="cart__item">
      <Link
        to={`/products/${item.option_id}`}
        className="cart__item-image"
        aria-label={`${name} 상세 보기`}
      >
        {image ? (
          <img src={image} alt={name} loading="lazy" />
        ) : (
          <FaImage aria-hidden />
        )}
      </Link>

      <div className="cart__item-body">
        <div className="cart__item-head">
          <div>
            <Link to={`/products/${item.option_id}`} className="cart__item-name">
              {name}
            </Link>
            <p className="cart__item-meta">
              {subCategory ? <span>{subCategory}</span> : null}
              {item.size ? <span>사이즈 {item.size}</span> : null}
              {productMissing ? (
                <span className="cart__item-warn">상품이 삭제되었습니다</span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            className="cart__remove-btn"
            aria-label="삭제"
            onClick={() => onRemove(item)}
            disabled={busy}
          >
            <FaTimes aria-hidden />
          </button>
        </div>

        <div className="cart__item-foot">
          <div className="cart__qty">
            <button
              type="button"
              className="cart__qty-btn"
              aria-label="수량 감소"
              onClick={() => onChangeQuantity(item, item.quantity - 1)}
              disabled={busy || item.quantity <= 1}
            >
              <FaMinus aria-hidden />
            </button>
            <span className="cart__qty-value" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              className="cart__qty-btn"
              aria-label="수량 증가"
              onClick={() => onChangeQuantity(item, item.quantity + 1)}
              disabled={busy || (!productMissing && stock > 0 && item.quantity >= stock)}
            >
              <FaPlus aria-hidden />
            </button>
          </div>

          <div className="cart__item-price">
            <span className="cart__item-unit">{formatPrice(item.unit_price)}</span>
            <strong className="cart__item-subtotal">{formatPrice(item.subtotal)}</strong>
          </div>
        </div>
      </div>
    </li>
  )
}
