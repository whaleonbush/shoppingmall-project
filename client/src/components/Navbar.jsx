import { memo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaSearch, FaUser, FaShoppingBag } from 'react-icons/fa'
import {
  CART_UPDATED_EVENT,
  getMyCartRequest,
} from '../api/cart.js'
import './Navbar.css'

function useCartCount(me) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!me) {
      setCount(0)
      return
    }

    let cancelled = false

    async function fetchCount() {
      const token = sessionStorage.getItem('token')
      if (!token) {
        if (!cancelled) setCount(0)
        return
      }
      const { ok, data } = await getMyCartRequest(token)
      if (cancelled) return
      if (!ok) {
        setCount(0)
        return
      }
      const d = data && typeof data === 'object' ? data : {}
      const total = Number(d.cart?.total_quantity)
      setCount(Number.isFinite(total) ? total : 0)
    }

    fetchCount().catch(() => {})

    function onCartUpdated(e) {
      const next = e?.detail?.totalQuantity
      if (Number.isFinite(next)) {
        setCount(next)
      } else {
        fetchCount().catch(() => {})
      }
    }

    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated)
    return () => {
      cancelled = true
      window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated)
    }
  }, [me])

  return count
}

const Navbar = memo(function Navbar({ me, isAdmin, sessionChecked, onLogout }) {
  const cartCount = useCartCount(me)

  return (
    <header className="home__topbar">
      <Link to="/" className="home__brand" aria-label="홈으로">
        쇼핑몰
      </Link>

      <nav className="home__topnav" aria-label="주요 카테고리">
        <a className="home__topnav-link" href="#men">
          MEN
        </a>
        <a className="home__topnav-link" href="#women">
          WOMEN
        </a>
        <a className="home__topnav-link" href="#explore">
          EXPLORE
        </a>
        <a className="home__topnav-link" href="#magazine">
          MAGAZINE
        </a>
        <a className="home__topnav-link" href="#brand">
          BRAND
        </a>
      </nav>

      <div className="home__topbar-right">
        <AuthArea
          me={me}
          isAdmin={isAdmin}
          sessionChecked={sessionChecked}
          onLogout={onLogout}
        />
        <IconButton label="MY PAGE" ariaLabel="마이페이지" icon={<FaUser />} />
        <IconButton
          label="BAG"
          ariaLabel={
            cartCount > 0
              ? `장바구니 (${cartCount}개 상품)`
              : '장바구니'
          }
          icon={<FaShoppingBag />}
          to="/cart"
          badge={cartCount}
        />
        <IconButton label="SEARCH" ariaLabel="검색" icon={<FaSearch />} />
      </div>
    </header>
  )
})

function AuthArea({ me, isAdmin, sessionChecked, onLogout }) {
  if (!sessionChecked) return null

  if (!me) {
    return (
      <Link to="/login" className="home__nav-btn home__nav-btn--primary">
        로그인
      </Link>
    )
  }

  return (
    <div className="home__auth">
      <span className="home__greeting" aria-live="polite">
        <strong className="home__greeting-name">{me.name}</strong>님 환영합니다.
      </span>
      {isAdmin ? (
        <Link className="home__nav-btn home__nav-btn--admin" to="/admin">
          어드민
        </Link>
      ) : null}
      <button type="button" className="home__nav-btn" onClick={onLogout}>
        로그아웃
      </button>
    </div>
  )
}

function IconButton({ label, ariaLabel, icon, to, badge }) {
  const hasBadge = Number.isFinite(badge) && badge > 0
  const badgeText = hasBadge ? (badge > 99 ? '99+' : String(badge)) : null

  const content = (
    <>
      <span className="home__icon-wrap">
        {icon}
        {hasBadge ? (
          <span className="home__icon-badge" aria-hidden>
            {badgeText}
          </span>
        ) : null}
      </span>
      <span className="home__icon-label">{label}</span>
    </>
  )

  if (to) {
    return (
      <Link to={to} className="home__icon-btn" aria-label={ariaLabel}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className="home__icon-btn" aria-label={ariaLabel}>
      {content}
    </button>
  )
}

export default Navbar
