import { memo } from 'react'
import { Link } from 'react-router-dom'
import { FaSearch, FaUser, FaShoppingBag } from 'react-icons/fa'

const Navbar = memo(function Navbar({ me, isAdmin, sessionChecked, onLogout }) {
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
        <IconButton label="STYLE" ariaLabel="장바구니" icon={<FaShoppingBag />} />
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

function IconButton({ label, ariaLabel, icon }) {
  return (
    <button type="button" className="home__icon-btn" aria-label={ariaLabel}>
      {icon}
      <span className="home__icon-label">{label}</span>
    </button>
  )
}

export default Navbar
