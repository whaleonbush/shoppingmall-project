import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaImage,
  FaPencilAlt,
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaTrash,
} from 'react-icons/fa'
import { getMeRequest } from '../api/auth.js'
import {
  deleteProductOptionRequest,
  listProductOptionsRequest,
} from '../api/productOptions.js'
import './ProductManage.css'

const PAGE_LIMIT = 2

const PRODUCT_CATEGORIES = [
  { value: '', label: '전체' },
  { value: 'men', label: 'MEN / 남성' },
  { value: 'women', label: 'WOMEN / 여성' },
  { value: 'unisex', label: 'UNISEX / 공용' },
]

const SUB_CATEGORIES = [
  { value: '', label: '전체' },
  { value: '상의', label: '상의' },
  { value: '하의', label: '하의' },
  { value: '악세사리', label: '악세사리' },
]

const CATEGORY_LABEL = {
  men: 'MEN',
  women: 'WOMEN',
  unisex: 'UNISEX',
}

const KRW = new Intl.NumberFormat('ko-KR')

function formatPrice(value) {
  const n = Number(value)
  return Number.isFinite(n) ? `₩${KRW.format(n)}` : '-'
}

function isAdmin(user) {
  return Boolean(user) && user['user-type'] === 'admin'
}

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export default function ProductManage() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)

  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    product_category: '',
    sub_category: '',
  })

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [flash, setFlash] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    const token = sessionStorage.getItem('token')
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    let cancelled = false
    getMeRequest(token)
      .then(({ ok, data }) => {
        if (cancelled) return
        const d = data && typeof data === 'object' ? data : {}
        if (ok && d.success && isAdmin(d.user)) {
          setChecking(false)
          return
        }
        if (!ok) {
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('authUser')
          navigate('/login', { replace: true })
          return
        }
        navigate('/', { replace: true })
      })
      .catch(() => {
        if (cancelled) return
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('authUser')
        navigate('/login', { replace: true })
      })
    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters.product_category, filters.sub_category])

  useEffect(() => {
    if (checking) return

    const controller = new AbortController()
    setLoading(true)
    setLoadError('')

    listProductOptionsRequest(
      {
        page,
        limit: PAGE_LIMIT,
        product_name: debouncedSearch,
        product_category: filters.product_category,
        sub_category: filters.sub_category,
      },
      { signal: controller.signal }
    )
      .then(({ ok, status, data }) => {
        if (!ok) {
          setItems([])
          setTotal(0)
          setLoadError(
            (data && typeof data === 'object' && data.message) ||
              `상품 목록을 불러오지 못했습니다. (${status})`
          )
          return
        }
        const d = data && typeof data === 'object' ? data : {}
        setItems(Array.isArray(d.items) ? d.items : [])
        setTotal(Number(d.total) || 0)
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        setItems([])
        setTotal(0)
        setLoadError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
      })
      .finally(() => {
        setLoading(false)
      })

    return () => controller.abort()
  }, [
    checking,
    page,
    debouncedSearch,
    filters.product_category,
    filters.sub_category,
    reloadKey,
  ])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_LIMIT)),
    [total]
  )

  const handleDelete = useCallback(
    async (item) => {
      const ok = window.confirm(
        `정말 "${item.product_name}" 옵션을 삭제하시겠습니까?\n\noption_id: ${item.option_id}`
      )
      if (!ok) return

      const token = sessionStorage.getItem('token')
      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      const id = item.option_id ?? item._id
      setDeletingId(id)
      setFlash(null)

      try {
        const { ok: success, status, data } = await deleteProductOptionRequest(
          id,
          token
        )
        if (!success) {
          if (status === 401) {
            sessionStorage.removeItem('token')
            sessionStorage.removeItem('authUser')
            navigate('/login', { replace: true })
            return
          }
          const msg =
            (data && typeof data === 'object' && data.message) ||
            `삭제에 실패했습니다. (${status})`
          setFlash({ tone: 'error', message: msg })
          return
        }

        setFlash({
          tone: 'success',
          message: `"${item.product_name}" 옵션이 삭제되었습니다.`,
        })

        if (items.length === 1 && page > 1) {
          setPage((p) => p - 1)
        } else {
          refresh()
        }
      } catch {
        setFlash({
          tone: 'error',
          message: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
        })
      } finally {
        setDeletingId(null)
      }
    },
    [navigate, items.length, page, refresh]
  )

  if (checking) {
    return (
      <main
        className="product-manage product-manage--checking"
        role="status"
        aria-live="polite"
      >
        관리자 권한 확인 중...
      </main>
    )
  }

  return (
    <main className="product-manage">
      <header className="product-manage__header">
        <div className="product-manage__header-left">
          <Link className="product-manage__back" to="/admin" aria-label="관리자 대시보드로 이동">
            <FaArrowLeft aria-hidden />
          </Link>
          <h1 className="product-manage__title">상품 관리</h1>
        </div>
        <Link to="/admin/products/new" className="product-manage__new-btn">
          <FaPlus aria-hidden />
          새 상품 등록
        </Link>
      </header>

      <nav className="product-manage__tabs" aria-label="상품 관리 탭">
        <button
          type="button"
          className="product-manage__tab product-manage__tab--active"
          aria-current="page"
        >
          상품 목록
        </button>
        <Link to="/admin/products/new" className="product-manage__tab">
          상품 등록
        </Link>
      </nav>

      <section className="product-manage__toolbar" aria-label="검색 및 필터">
        <div className="product-manage__search">
          <FaSearch className="product-manage__search-icon" aria-hidden />
          <input
            type="search"
            className="product-manage__search-input"
            placeholder="상품명으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={`product-manage__filter-btn ${
            filterOpen ? 'product-manage__filter-btn--active' : ''
          }`}
          onClick={() => setFilterOpen((v) => !v)}
          aria-expanded={filterOpen}
        >
          <FaFilter aria-hidden />
          필터
        </button>
        <button
          type="button"
          className="product-manage__filter-btn"
          onClick={refresh}
          disabled={loading}
          aria-label="목록 새로고침"
          title="목록 새로고침"
        >
          <FaSyncAlt aria-hidden className={loading ? 'product-manage__spin' : ''} />
          새로고침
        </button>
      </section>

      {filterOpen ? (
        <section className="product-manage__filters" aria-label="상세 필터">
          <label className="product-manage__filter-field">
            <span>상품 카테고리</span>
            <select
              value={filters.product_category}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  product_category: e.target.value,
                }))
              }
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.value || 'all-pc'} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="product-manage__filter-field">
            <span>하위탭</span>
            <select
              value={filters.sub_category}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sub_category: e.target.value,
                }))
              }
            >
              {SUB_CATEGORIES.map((c) => (
                <option key={c.value || 'all-sc'} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          {filters.product_category || filters.sub_category ? (
            <button
              type="button"
              className="product-manage__filter-clear"
              onClick={() =>
                setFilters({ product_category: '', sub_category: '' })
              }
            >
              필터 초기화
            </button>
          ) : null}
        </section>
      ) : null}

      {flash ? (
        <p
          className={`product-manage__flash product-manage__flash--${flash.tone}`}
          role={flash.tone === 'error' ? 'alert' : 'status'}
        >
          {flash.message}
        </p>
      ) : null}

      <section className="product-manage__table-wrap" aria-busy={loading}>
        <table className="product-manage__table">
          <thead>
            <tr>
              <th scope="col" className="product-manage__th product-manage__th--image">
                이미지
              </th>
              <th scope="col" className="product-manage__th">상품명</th>
              <th scope="col" className="product-manage__th">카테고리</th>
              <th scope="col" className="product-manage__th product-manage__th--num">
                가격
              </th>
              <th scope="col" className="product-manage__th product-manage__th--num">
                재고
              </th>
              <th scope="col" className="product-manage__th product-manage__th--actions">
                액션
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="product-manage__row product-manage__row--skeleton">
                  <td><div className="product-manage__skeleton product-manage__skeleton--thumb" /></td>
                  <td><div className="product-manage__skeleton" /></td>
                  <td><div className="product-manage__skeleton" /></td>
                  <td><div className="product-manage__skeleton" /></td>
                  <td><div className="product-manage__skeleton" /></td>
                  <td><div className="product-manage__skeleton" /></td>
                </tr>
              ))
            ) : loadError ? (
              <tr>
                <td colSpan={6} className="product-manage__empty product-manage__empty--error">
                  {loadError}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="product-manage__empty">
                  <div className="product-manage__empty-inner">
                    <p>조건에 맞는 상품이 없습니다.</p>
                    <Link to="/admin/products/new" className="product-manage__empty-cta">
                      <FaPlus aria-hidden /> 첫 상품 등록하기
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <ProductRow
                  key={item._id ?? item.option_id}
                  item={item}
                  onDelete={handleDelete}
                  deleting={deletingId === (item.option_id ?? item._id)}
                />
              ))
            )}
          </tbody>
        </table>
      </section>

      {!loading && !loadError && items.length > 0 ? (
        <footer className="product-manage__pagination">
          <span className="product-manage__pagination-info">
            총 {KRW.format(total)}개 · {page} / {totalPages} 페이지
          </span>
          <div className="product-manage__pagination-controls">
            <button
              type="button"
              className="product-manage__page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="이전 페이지"
            >
              <FaChevronLeft aria-hidden />
            </button>
            <button
              type="button"
              className="product-manage__page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="다음 페이지"
            >
              <FaChevronRight aria-hidden />
            </button>
          </div>
        </footer>
      ) : null}
    </main>
  )
}

function ProductRow({ item, onDelete, deleting }) {
  const [imgFailed, setImgFailed] = useState(false)
  const hasImage = Boolean(item.option_image_url) && !imgFailed
  const stock = Number(item.stock_quantity) || 0
  const stockTone =
    stock <= 0 ? 'out' : stock < 10 ? 'low' : 'ok'

  return (
    <tr className="product-manage__row">
      <td className="product-manage__td">
        <div className="product-manage__thumb">
          {hasImage ? (
            <img
              src={item.option_image_url}
              alt={item.product_name}
              onError={() => setImgFailed(true)}
              loading="lazy"
            />
          ) : (
            <FaImage aria-hidden />
          )}
        </div>
      </td>
      <td className="product-manage__td">
        <div className="product-manage__name">
          <strong>{item.product_name}</strong>
          {item.option_name ? (
            <span className="product-manage__sub">{item.option_name}</span>
          ) : null}
          {item.sku ? (
            <span className="product-manage__sku">SKU: {item.sku}</span>
          ) : null}
        </div>
      </td>
      <td className="product-manage__td">
        <span className="product-manage__category">
          <span className="product-manage__cat-main">
            {CATEGORY_LABEL[item.product_category] ?? item.product_category}
          </span>
          {item.sub_category ? (
            <span className="product-manage__cat-sub">{item.sub_category}</span>
          ) : null}
        </span>
      </td>
      <td className="product-manage__td product-manage__td--num">
        <div className="product-manage__price">
          <strong>{formatPrice(item.price)}</strong>
          {Number(item.additional_price) > 0 ? (
            <span className="product-manage__price-add">
              +{formatPrice(item.additional_price)}
            </span>
          ) : null}
        </div>
      </td>
      <td className="product-manage__td product-manage__td--num">
        <span className={`product-manage__stock product-manage__stock--${stockTone}`}>
          {KRW.format(stock)}
        </span>
      </td>
      <td className="product-manage__td product-manage__td--actions">
        <div className="product-manage__actions">
          <button
            type="button"
            className="product-manage__icon-btn"
            aria-label="편집"
            title="편집 (준비 중)"
            onClick={() =>
              window.alert('편집 기능은 곧 추가될 예정입니다.')
            }
          >
            <FaPencilAlt aria-hidden />
          </button>
          <button
            type="button"
            className="product-manage__icon-btn product-manage__icon-btn--danger"
            aria-label="삭제"
            title="삭제"
            disabled={deleting}
            onClick={() => onDelete(item)}
          >
            <FaTrash aria-hidden />
          </button>
        </div>
      </td>
    </tr>
  )
}
