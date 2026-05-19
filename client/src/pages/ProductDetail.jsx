import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  FaArrowLeft,
  FaChevronDown,
  FaChevronUp,
  FaInstagram,
  FaYoutube,
  FaFacebookF,
  FaTwitter,
  FaImage,
  FaShoppingBag,
  FaRegHeart,
  FaMapMarkerAlt,
} from 'react-icons/fa'
import { getMeRequest } from '../api/auth.js'
import {
  getProductOptionRequest,
  listAllProductOptionsRequest,
} from '../api/productOptions.js'
import { addCartItemRequest, notifyCartUpdated } from '../api/cart.js'
import Navbar from '../components/Navbar.jsx'
import './ProductDetail.css'

const PRODUCT_CATEGORY_LABEL = {
  men: 'MEN',
  women: 'WOMEN',
  unisex: 'UNISEX',
}

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

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

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { me, sessionChecked, logout } = useCurrentUser()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [related, setRelated] = useState([])
  const [size, setSize] = useState('')
  const [toast, setToast] = useState('')
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    if (!id) return

    const controller = new AbortController()
    setLoading(true)
    setError('')
    setProduct(null)

    getProductOptionRequest(id, { signal: controller.signal })
      .then(({ ok, status, data }) => {
        if (!ok) {
          if (status === 404) {
            setError('상품을 찾을 수 없습니다.')
          } else {
            const d = data && typeof data === 'object' ? data : {}
            setError(d.message || `상품을 불러오지 못했습니다. (${status})`)
          }
          return
        }
        const d = data && typeof data === 'object' ? data : null
        setProduct(d)
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [id])

  useEffect(() => {
    if (!product) return

    const controller = new AbortController()
    listAllProductOptionsRequest({}, { signal: controller.signal })
      .then(({ ok, data }) => {
        if (!ok) return
        const d = data && typeof data === 'object' ? data : {}
        const items = Array.isArray(d.items) ? d.items : []
        const productId = product.option_id ?? product._id
        const filtered = items.filter(
          (it) => (it.option_id ?? it._id) !== productId
        )
        setRelated(filtered.slice(0, 4))
      })
      .catch(() => {})

    return () => controller.abort()
  }, [product])

  const totalPrice = useMemo(() => {
    if (!product) return 0
    return (Number(product.price) || 0) + (Number(product.additional_price) || 0)
  }, [product])

  const showToast = useCallback((message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }, [])

  async function handleAddToCart() {
    if (!product) return
    if (!size) {
      showToast('사이즈를 선택해 주세요.')
      return
    }

    const token = sessionStorage.getItem('token')
    if (!token) {
      showToast('로그인 후 이용해 주세요.')
      navigate('/login')
      return
    }

    setAddingToCart(true)
    try {
      const optionId = product.option_id ?? product._id
      const { ok, status, data } = await addCartItemRequest(
        { option_id: optionId, quantity: 1, size },
        token
      )
      if (!ok) {
        if (status === 401) {
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('authUser')
          navigate('/login')
          return
        }
        showToast(
          (data && typeof data === 'object' && data.message) ||
            `쇼핑백에 담지 못했습니다. (${status})`
        )
        return
      }
      const d = data && typeof data === 'object' ? data : {}
      notifyCartUpdated(d.cart)
      showToast('쇼핑백에 담았습니다.')
    } catch {
      showToast('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="product-detail-page">
        <Navbar
          me={me}
          isAdmin={isAdminUser(me)}
          sessionChecked={sessionChecked}
          onLogout={logout}
        />
        <main className="product-detail product-detail--checking" aria-live="polite">
          상품을 불러오는 중...
        </main>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <Navbar
          me={me}
          isAdmin={isAdminUser(me)}
          sessionChecked={sessionChecked}
          onLogout={logout}
        />
        <main className="product-detail product-detail--error">
          <p className="product-detail__error-message">
            {error || '상품 정보를 가져오지 못했습니다.'}
          </p>
          <button
            type="button"
            className="product-detail__back-btn"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft aria-hidden />
            이전으로
          </button>
        </main>
      </div>
    )
  }

  const productId = product.option_id ?? product._id
  const image = product.option_image_url
  const name = product.product_name || '상품명 없음'
  const subtitle = product.option_name
  const category =
    PRODUCT_CATEGORY_LABEL[product.product_category] ?? product.product_category
  const subCategory = product.sub_category
  const stock = Number(product.stock_quantity) || 0
  const outOfStock = stock <= 0

  return (
    <div className="product-detail-page">
      <Navbar
        me={me}
        isAdmin={isAdminUser(me)}
        sessionChecked={sessionChecked}
        onLogout={logout}
      />

      <main className="product-detail">
        <button
          type="button"
          className="product-detail__back-btn"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft aria-hidden />
          쇼핑 계속하기
        </button>

        <section className="product-detail__main">
          <div className="product-detail__gallery">
            <div className="product-detail__image-frame">
              {image ? (
                <img src={image} alt={name} loading="eager" decoding="async" />
              ) : (
                <span className="product-detail__placeholder">
                  <FaImage aria-hidden />
                  No Image
                </span>
              )}
            </div>
            <div className="product-detail__thumb-row">
              {[0, 1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`product-detail__thumb ${
                    idx === 0 ? 'product-detail__thumb--active' : ''
                  }`}
                  aria-label={`이미지 ${idx + 1}번 보기`}
                >
                  {image && idx === 0 ? (
                    <img src={image} alt="" loading="lazy" />
                  ) : (
                    <FaImage aria-hidden />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="product-detail__summary">
            <div className="product-detail__badges">
              {category ? (
                <span className="product-detail__badge">{category}</span>
              ) : null}
              {subCategory ? (
                <span className="product-detail__badge product-detail__badge--soft">
                  {subCategory}
                </span>
              ) : null}
              {outOfStock ? (
                <span className="product-detail__badge product-detail__badge--danger">
                  품절
                </span>
              ) : stock < 10 ? (
                <span className="product-detail__badge product-detail__badge--warn">
                  재고 부족 · {stock}개
                </span>
              ) : null}
            </div>

            <h1 className="product-detail__title">{name}</h1>
            {subtitle ? (
              <p className="product-detail__subtitle">{subtitle}</p>
            ) : null}

            <p className="product-detail__price">{formatPrice(totalPrice)}</p>
            {Number(product.additional_price) > 0 ? (
              <p className="product-detail__price-detail">
                기본 가격 {formatPrice(product.price)} · 옵션 +
                {formatPrice(product.additional_price)}
              </p>
            ) : null}

            <div className="product-detail__field">
              <label htmlFor="size-select" className="product-detail__label">
                사이즈 선택
              </label>
              <div className="product-detail__select-wrap">
                <select
                  id="size-select"
                  className="product-detail__select"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                >
                  <option value="">사이즈를 선택하세요</option>
                  {SIZE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="product-detail__store">
              <FaMapMarkerAlt aria-hidden />
              <span>오프라인 매장 재고 및 픽업 안내</span>
            </div>

            <div className="product-detail__cta">
              <button
                type="button"
                className="product-detail__add-btn"
                onClick={handleAddToCart}
                disabled={outOfStock || addingToCart}
              >
                <FaShoppingBag aria-hidden />
                {outOfStock
                  ? '품절된 상품입니다'
                  : addingToCart
                    ? '담는 중...'
                    : '쇼핑백 담기'}
              </button>
              <button
                type="button"
                className="product-detail__wish-btn"
                aria-label="위시리스트에 추가"
                onClick={() => showToast('위시리스트 기능은 곧 추가됩니다.')}
              >
                <FaRegHeart aria-hidden />
              </button>
            </div>

            <aside className="product-detail__notice">
              본 상품은 온라인 단독 상품으로, 매장에서는 동일한 모델을 만나
              보실 수 없을 수 있습니다. 구매 전 안내사항을 꼭 확인해 주세요.
            </aside>

            <ul className="product-detail__bullets">
              <li>실내 사용 권장</li>
              <li>입을 때 부드러운 마찰음 발생 가능</li>
              <li>실측 사이즈 1~2cm 오차 발생 가능</li>
              <li>천연 가죽 및 원단을 일부 사용</li>
              <li>밝은 색상은 이염에 주의해 주세요</li>
              <li>세탁 시 단독 세탁 권장</li>
              <li>드라이클리닝만 가능합니다</li>
            </ul>

            <p className="product-detail__material">
              SKU {product.sku ?? '미지정'} · 제조 코드는 상품 라벨에서 확인할
              수 있습니다.
            </p>

            <AccordionList product={product} />
          </div>
        </section>

        <RelatedProducts items={related} currentId={productId} />

        <Newsletter />
      </main>

      {toast ? (
        <div className="product-detail__toast" role="status">
          {toast}
        </div>
      ) : null}

      <DetailFooter />
    </div>
  )
}

function AccordionList({ product }) {
  const sections = useMemo(
    () => [
      {
        id: 'info',
        title: '상품 정보',
        body: (
          <ul className="product-detail__acc-list">
            <li>
              <span>상품명</span>
              <strong>{product.product_name}</strong>
            </li>
            {product.option_name ? (
              <li>
                <span>옵션</span>
                <strong>{product.option_name}</strong>
              </li>
            ) : null}
            <li>
              <span>카테고리</span>
              <strong>
                {PRODUCT_CATEGORY_LABEL[product.product_category] ??
                  product.product_category}{' '}
                / {product.sub_category}
              </strong>
            </li>
            <li>
              <span>가격</span>
              <strong>{formatPrice(product.price)}</strong>
            </li>
            {Number(product.additional_price) > 0 ? (
              <li>
                <span>옵션 추가 금액</span>
                <strong>+{formatPrice(product.additional_price)}</strong>
              </li>
            ) : null}
            <li>
              <span>재고</span>
              <strong>{KRW.format(Number(product.stock_quantity) || 0)}개</strong>
            </li>
            {product.sku ? (
              <li>
                <span>SKU</span>
                <strong>{product.sku}</strong>
              </li>
            ) : null}
          </ul>
        ),
      },
      {
        id: 'shipping',
        title: '배송 및 반품 안내',
        body: (
          <p>
            평일 오후 1시 이전 결제 시 당일 출고됩니다. 단순 변심에 의한 반품은
            상품 수령 후 7일 이내에만 가능합니다.
          </p>
        ),
      },
      {
        id: 'review',
        title: '등록된 리뷰 보기',
        body: <p>아직 등록된 리뷰가 없습니다. 첫 번째 리뷰의 주인공이 되어 보세요.</p>,
      },
    ],
    [product]
  )

  return (
    <ul className="product-detail__accordion">
      {sections.map((section) => (
        <AccordionItem key={section.id} title={section.title}>
          {section.body}
        </AccordionItem>
      ))}
    </ul>
  )
}

function AccordionItem({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <li className={`product-detail__acc-item ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="product-detail__acc-trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        {open ? <FaChevronUp aria-hidden /> : <FaChevronDown aria-hidden />}
      </button>
      {open ? <div className="product-detail__acc-body">{children}</div> : null}
    </li>
  )
}

const RelatedProducts = memo(function RelatedProducts({ items, currentId }) {
  if (items.length === 0) return null
  return (
    <section className="product-detail__related" aria-labelledby="related-heading">
      <h2 id="related-heading" className="product-detail__related-title">
        추천 상품
      </h2>
      <ul className="product-detail__related-list">
        {items.map((item) => {
          const itemId = item.option_id ?? item._id
          if (itemId === currentId) return null
          return (
            <li key={itemId} className="product-detail__related-item">
              <Link
                to={`/products/${itemId}`}
                className="product-detail__related-link"
              >
                <div className="product-detail__related-image">
                  {item.option_image_url ? (
                    <img
                      src={item.option_image_url}
                      alt={item.product_name}
                      loading="lazy"
                    />
                  ) : (
                    <FaImage aria-hidden />
                  )}
                </div>
                <div className="product-detail__related-meta">
                  <p className="product-detail__related-name">
                    {item.product_name}
                  </p>
                  <p className="product-detail__related-price">
                    {formatPrice(item.price)}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
})

function Newsletter() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setDone(true)
  }

  return (
    <section className="product-detail__newsletter" aria-labelledby="news-heading">
      <h2 id="news-heading" className="product-detail__newsletter-title">
        최신 소식 확인하기
      </h2>
      {done ? (
        <p className="product-detail__newsletter-done">
          구독해 주셔서 감사합니다. 새로운 소식을 빠르게 전해드리겠습니다.
        </p>
      ) : (
        <form className="product-detail__newsletter-form" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소를 입력하세요"
            className="product-detail__newsletter-input"
            required
          />
          <button type="submit" className="product-detail__newsletter-btn">
            구독
          </button>
        </form>
      )}
    </section>
  )
}

function DetailFooter() {
  return (
    <footer className="product-detail__footer">
      <div className="product-detail__footer-inner">
        <ul className="product-detail__footer-list">
          <li><a href="#policy">개인정보 처리방침</a></li>
          <li><a href="#terms">이용 약관</a></li>
          <li><a href="#guide">주문 안내</a></li>
          <li><a href="#contact">고객센터</a></li>
        </ul>
        <div className="product-detail__social">
          <a href="#instagram" aria-label="Instagram"><FaInstagram /></a>
          <a href="#youtube" aria-label="YouTube"><FaYoutube /></a>
          <a href="#facebook" aria-label="Facebook"><FaFacebookF /></a>
          <a href="#twitter" aria-label="Twitter"><FaTwitter /></a>
        </div>
      </div>
      <small className="product-detail__copyright">
        © 2026 Shopping Mall. All rights reserved.
      </small>
    </footer>
  )
}
