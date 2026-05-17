import { memo, useCallback, useEffect, useState } from 'react'
import {
  FaRegHeart,
  FaInstagram,
  FaYoutube,
  FaFacebookF,
  FaTwitter,
} from 'react-icons/fa'
import { getMeRequest } from '../api/auth.js'
import Navbar from '../components/Navbar.jsx'
import './Home.css'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1800&q=80'

const PRODUCTS = [
  {
    id: 'spot-stripe',
    name: 'SPOT STRIPE SHIRTS',
    image:
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
    colors: ['#ff6b35', '#1f4ea1'],
  },
  {
    id: 'spot-cool-polo',
    name: 'SPOT COOL POLO SHIRTS',
    image:
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
    colors: ['#1f4ea1', '#0f2c5d'],
  },
  {
    id: 'spot-print',
    name: 'SPOT PRINT SHIRTS',
    image:
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    colors: ['#cfe4f5'],
  },
]

const SEASON_FILTERS = [
  { id: 'all', label: 'ALL' },
  { id: 'hot-summer', label: 'HOT SUMMER', active: true },
  { id: 'tour-fit-ii', label: 'TOUR-FIT II' },
  { id: 'tour-fit', label: 'TOUR-FIT' },
  { id: 'play', label: 'PLAY' },
]

const CATEGORY_FILTERS = [
  { id: 'all', label: 'ALL', active: true },
  { id: 'shirts', label: '셔츠' },
  { id: 'tee', label: '5분 t' },
  { id: 'sweater', label: 'SWEATER' },
  { id: 'pants', label: '팬츠' },
  { id: 'skirt', label: '스커트' },
]

const SIZE_GRID = [
  ['XS', 'S', 'M'],
  ['L', 'XL', 'XXL'],
  ['28', '30', '32'],
  ['34', '36', 'FREE'],
]

const SIZE_OPTIONS = SIZE_GRID.flat()

const COLOR_SWATCHES = [
  '#ffffff',
  '#eeeeee',
  '#bdbdbd',
  '#666666',
  '#111111',
  '#f3eccd',
  '#e9d7a3',
  '#f6e35a',
  '#fff352',
  '#f4b7c0',
  '#f4a73f',
  '#e02828',
]

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

export default function Home() {
  const { me, sessionChecked, logout } = useCurrentUser()
  const [gender, setGender] = useState('men')
  const handleGenderChange = useCallback((nextGender) => {
    setGender(nextGender)
  }, [])

  const isAdmin = isAdminUser(me)

  return (
    <div className="home">
      <Navbar
        me={me}
        isAdmin={isAdmin}
        sessionChecked={sessionChecked}
        onLogout={logout}
      />
      <HeroBanner />

      <div className="home__layout">
        <ProductFilters gender={gender} onGenderChange={handleGenderChange} />
        <ProductGrid />
      </div>

      <HomeFooter />
    </div>
  )
}

const HeroBanner = memo(function HeroBanner() {
  return (
    <section className="home__hero" aria-label="시즌 캠페인">
      <img
        src={HERO_IMAGE}
        alt="HOT SUMMER 캠페인 이미지"
        loading="eager"
        decoding="async"
        className="home__hero-img"
      />
      <h1 className="home__hero-title">HOT SUMMER</h1>
    </section>
  )
})

function ProductFilters({ gender, onGenderChange }) {
  return (
    <aside className="home__sidebar" aria-label="상품 필터">
      <GenderTabs gender={gender} onGenderChange={onGenderChange} />
      <FilterBlock title="시즌" items={SEASON_FILTERS} />
      <FilterBlock title="카테고리" items={CATEGORY_FILTERS} />

      <div className="home__filter">
        <h3 className="home__filter-title">컬러</h3>
      </div>

      <SizeFilter />
      <ColorFilter />
    </aside>
  )
}

const GenderTabs = memo(function GenderTabs({ gender, onGenderChange }) {
  return (
    <div className="home__gender-tabs" role="tablist" aria-label="성별">
      <GenderTab
        label="MEN"
        value="men"
        selected={gender === 'men'}
        onSelect={onGenderChange}
      />
      <GenderTab
        label="WOMEN"
        value="women"
        selected={gender === 'women'}
        onSelect={onGenderChange}
      />
    </div>
  )
})

function GenderTab({ label, value, selected, onSelect }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={`home__gender-tab ${selected ? 'home__gender-tab--active' : ''}`}
      onClick={() => onSelect(value)}
    >
      {label}
    </button>
  )
}

const SizeFilter = memo(function SizeFilter() {
  return (
    <div className="home__filter">
      <h3 className="home__filter-title">사이즈</h3>
      <div className="home__size-grid">
        {SIZE_OPTIONS.map((s) => (
          <button key={s} type="button" className="home__size-cell">
            {s}
          </button>
        ))}
      </div>
    </div>
  )
})

const ColorFilter = memo(function ColorFilter() {
  return (
    <div className="home__filter">
      <h3 className="home__filter-title">색상</h3>
      <div className="home__color-grid">
        {COLOR_SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            className="home__color-swatch"
            style={{ background: c }}
            aria-label={`색상 ${c}`}
          />
        ))}
      </div>
    </div>
  )
})

const ProductGrid = memo(function ProductGrid() {
  return (
    <main className="home__content" aria-label="상품 목록">
      <p className="home__count">9개 상품</p>
      <ul className="home__products">
        {PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ul>
    </main>
  )
})

const ProductCard = memo(function ProductCard({ product }) {
  return (
    <li className="home__product">
      <div className="home__product-color-row">
        {product.colors.map((c, idx) => (
          <span
            key={`${product.id}-${idx}`}
            className="home__product-color"
            style={{ background: c }}
            aria-hidden
          />
        ))}
      </div>
      <a className="home__product-image" href={`#${product.id}`}>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
        />
      </a>
      <div className="home__product-meta">
        <a className="home__product-name" href={`#${product.id}`}>
          {product.name}
        </a>
        <button
          type="button"
          className="home__product-wish"
          aria-label="위시리스트 추가"
        >
          <FaRegHeart />
        </button>
      </div>
    </li>
  )
})

const HomeFooter = memo(function HomeFooter() {
  return (
    <footer className="home__footer">
      <div className="home__footer-inner">
        <ul className="home__footer-list">
          <li>
            <a href="#faq">FAQ</a>
          </li>
          <li>
            <a href="#qna">Q&amp;A</a>
          </li>
          <li>
            <a href="#news">News</a>
          </li>
          <li>
            <a href="#contact">Contact Us</a>
          </li>
          <li>
            <a href="#family">Family Site</a>
          </li>
        </ul>
        <ul className="home__footer-list home__footer-list--right">
          <li>
            <a href="#policy">개인정보 처리방침</a>
          </li>
          <li>
            <a href="#terms">이용 약관</a>
          </li>
          <li>
            <a href="#guide">주문 안내</a>
          </li>
          <li>
            <a href="#account">결제 / 환불 안내</a>
          </li>
        </ul>
      </div>
      <div className="home__footer-bottom">
        <div className="home__social">
          <a href="#instagram" aria-label="Instagram">
            <FaInstagram />
          </a>
          <a href="#youtube" aria-label="YouTube">
            <FaYoutube />
          </a>
          <a href="#facebook" aria-label="Facebook">
            <FaFacebookF />
          </a>
          <a href="#twitter" aria-label="Twitter">
            <FaTwitter />
          </a>
        </div>
        <small className="home__copyright">
          © 2026 Shopping Mall. All rights reserved.
        </small>
      </div>
    </footer>
  )
})

function FilterBlock({ title, items }) {
  return (
    <div className="home__filter">
      <h3 className="home__filter-title">{title}</h3>
      <ul className="home__filter-list">
        {items.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              className={`home__filter-item ${
                it.active ? 'home__filter-item--active' : ''
              }`}
            >
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
