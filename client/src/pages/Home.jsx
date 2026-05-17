import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  FaRegHeart,
  FaInstagram,
  FaYoutube,
  FaFacebookF,
  FaTwitter,
} from 'react-icons/fa'
import { getMeRequest } from '../api/auth.js'
import { listAllProductOptionsRequest } from '../api/productOptions.js'
import Navbar from '../components/Navbar.jsx'
import './Home.css'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1800&q=80'

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

const PRODUCT_CATEGORY_LABEL = {
  men: 'MEN',
  women: 'WOMEN',
  unisex: 'UNISEX',
}

const KRW = new Intl.NumberFormat('ko-KR')

function isAdminUser(user) {
  return Boolean(user) && user['user-type'] === 'admin'
}

function formatPrice(value) {
  const n = Number(value)
  return Number.isFinite(n) ? `₩${KRW.format(n)}` : ''
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

function useHomeProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    setLoading(true)
    setError('')

    listAllProductOptionsRequest({}, { signal: controller.signal })
      .then(({ ok, status, data }) => {
        if (!ok) {
          setProducts([])
          setError(
            (data && typeof data === 'object' && data.message) ||
              `상품 데이터를 불러오지 못했습니다. (${status})`
          )
          return
        }

        const d = data && typeof data === 'object' ? data : {}
        setProducts(Array.isArray(d.items) ? d.items : [])
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        setProducts([])
        setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
      })
      .finally(() => {
        setLoading(false)
      })

    return () => controller.abort()
  }, [])

  return { products, loading, error }
}

export default function Home() {
  const { me, sessionChecked, logout } = useCurrentUser()
  const { products, loading, error } = useHomeProducts()
  const [gender, setGender] = useState('men')
  const handleGenderChange = useCallback((nextGender) => {
    setGender(nextGender)
  }, [])

  const isAdmin = isAdminUser(me)
  const visibleProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.product_category === gender ||
          product.product_category === 'unisex'
      ),
    [products, gender]
  )

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
        <ProductGrid
          products={visibleProducts}
          loading={loading}
          error={error}
        />
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

const ProductGrid = memo(function ProductGrid({ products, loading, error }) {
  return (
    <main className="home__content" aria-label="상품 목록">
      <p className="home__count">
        {loading ? '상품을 불러오는 중...' : `${products.length}개 상품`}
      </p>

      {loading ? (
        <ul className="home__products" aria-busy="true">
          {Array.from({ length: 6 }).map((_, idx) => (
            <li key={idx} className="home__product home__product--loading">
              <div className="home__product-skeleton home__product-skeleton--image" />
              <div className="home__product-skeleton" />
            </li>
          ))}
        </ul>
      ) : error ? (
        <div className="home__products-message" role="alert">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="home__products-message">등록된 상품이 없습니다.</div>
      ) : (
        <ul className="home__products">
          {products.map((product) => (
            <ProductCard
              key={product._id ?? product.option_id}
              product={product}
            />
          ))}
        </ul>
      )}
    </main>
  )
})

const ProductCard = memo(function ProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false)
  const productId = product.option_id ?? product._id
  const name = product.product_name || '상품명 없음'
  const category =
    PRODUCT_CATEGORY_LABEL[product.product_category] ?? product.product_category
  const image = product.option_image_url
  const price = formatPrice(product.price)

  return (
    <li className="home__product">
      <div className="home__product-color-row">
        {[product.product_category, product.sub_category].filter(Boolean).map((c, idx) => (
          <span
            key={`${productId}-${idx}`}
            className="home__product-badge"
          >
            {idx === 0 ? category : c}
          </span>
        ))}
      </div>
      <a className="home__product-image" href={`#product-${productId}`}>
        {image && !imageFailed ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="home__product-placeholder">No Image</span>
        )}
      </a>
      <div className="home__product-meta">
        <div className="home__product-text">
          <a className="home__product-name" href={`#product-${productId}`}>
            {name}
          </a>
          {price ? <span className="home__product-price">{price}</span> : null}
        </div>
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
