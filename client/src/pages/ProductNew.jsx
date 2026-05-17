import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaArrowLeft,
  FaBoxOpen,
  FaCheckCircle,
  FaImage,
  FaCloudUploadAlt,
  FaSave,
  FaTag,
} from 'react-icons/fa'
import { getMeRequest } from '../api/auth.js'
import { createProductOptionRequest } from '../api/productOptions.js'
import './ProductNew.css'

const INITIAL_FORM = {
  product_name: '',
  price: '0',
  product_category: 'men',
  sub_category: '상의',
  additional_price: '0',
  stock_quantity: '0',
  sku: '',
  option_image_url: '',
}

const PRODUCT_CATEGORIES = [
  { value: 'men', label: 'MEN / 남성' },
  { value: 'women', label: 'WOMEN / 여성' },
  { value: 'unisex', label: 'UNISEX / 공용' },
]

const SUB_CATEGORIES = ['상의', '하의', '악세사리']
const CLOUDINARY_SCRIPT_SRC = 'https://widget.cloudinary.com/v2.0/global/all.js'
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim()
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim()
const HAS_CLOUDINARY_CONFIG = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET
)

function isAdmin(user) {
  return Boolean(user) && user['user-type'] === 'admin'
}

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function messageFromResponse(status, data) {
  const d = data && typeof data === 'object' ? data : {}
  if (status === 401) {
    return d.message || '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  }
  if (status === 403) {
    return d.message || '관리자 권한이 필요합니다.'
  }
  if (d.code === 11000 || d.message === 'Duplicate key') {
    return '이미 사용 중인 SKU입니다. 다른 SKU를 입력해 주세요.'
  }
  if (d.errors && typeof d.errors === 'object') {
    return Object.values(d.errors).join(' ')
  }
  if (typeof d.message === 'string') return d.message
  return `상품 등록에 실패했습니다. (${status})`
}

export default function ProductNew() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [form, setForm] = useState(INITIAL_FORM)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [widgetReady, setWidgetReady] = useState(Boolean(window.cloudinary))
  const [imageUploading, setImageUploading] = useState(false)

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
    if (window.cloudinary) {
      setWidgetReady(true)
      return
    }

    const existingScript = document.querySelector(
      `script[src="${CLOUDINARY_SCRIPT_SRC}"]`
    )

    function handleLoad() {
      setWidgetReady(Boolean(window.cloudinary))
    }

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad)
      return () => existingScript.removeEventListener('load', handleLoad)
    }

    const script = document.createElement('script')
    script.src = CLOUDINARY_SCRIPT_SRC
    script.async = true
    script.addEventListener('load', handleLoad)
    document.body.appendChild(script)

    return () => script.removeEventListener('load', handleLoad)
  }, [])

  const preview = useMemo(
    () => ({
      productName: form.product_name || '상품명',
      priceTab: toNumber(form.price).toLocaleString(),
      category:
        PRODUCT_CATEGORIES.find((c) => c.value === form.product_category)?.label ??
        form.product_category,
      subCategory: form.sub_category,
      price: toNumber(form.additional_price).toLocaleString(),
      stock: toNumber(form.stock_quantity).toLocaleString(),
      sku: form.sku || 'SKU 미입력',
      image: form.option_image_url.trim(),
    }),
    [form]
  )

  function updateField(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setSuccess(null)
  }

  function openCloudinaryWidget() {
    setError('')

    if (!HAS_CLOUDINARY_CONFIG) {
      setError(
        'Cloudinary 설정이 필요합니다. client/.env에 VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET을 추가해 주세요.'
      )
      return
    }

    if (!window.cloudinary) {
      setError('Cloudinary 업로드 위젯을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.')
      return
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxFiles: 1,
        resourceType: 'image',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        cropping: false,
        folder: 'shopping-mall/products',
      },
      (err, result) => {
        if (err) {
          setImageUploading(false)
          setError('이미지 업로드 중 오류가 발생했습니다.')
          return
        }

        if (result?.event === 'upload-added') {
          setImageUploading(true)
        }

        if (result?.event === 'success') {
          const secureUrl = result.info?.secure_url
          if (secureUrl) {
            setForm((prev) => ({ ...prev, option_image_url: secureUrl }))
            setSuccess(null)
          }
          setImageUploading(false)
        }

        if (result?.event === 'close') {
          setImageUploading(false)
        }
      }
    )

    widget.open()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(null)

    if (!form.product_name.trim()) {
      setError('상품명을 입력해 주세요.')
      return
    }
    if (Number(form.price) < 0) {
      setError('가격은 0 이상이어야 합니다.')
      return
    }
    if (!form.product_category || !form.sub_category) {
      setError('상품 카테고리와 하위탭을 선택해 주세요.')
      return
    }
    if (Number(form.additional_price) < 0 || Number(form.stock_quantity) < 0) {
      setError('추가 금액과 재고량은 0 이상이어야 합니다.')
      return
    }

    const token = sessionStorage.getItem('token')
    if (!token) {
      setError('로그인이 필요합니다. 다시 로그인해 주세요.')
      navigate('/login', { replace: true })
      return
    }

    const body = {
      product_name: form.product_name.trim(),
      price: toNumber(form.price),
      option_name: `${form.sub_category} / ${form.product_name.trim()}`,
      product_category: form.product_category,
      sub_category: form.sub_category,
      additional_price: toNumber(form.additional_price),
      stock_quantity: toNumber(form.stock_quantity),
      sku: form.sku.trim() || null,
      option_image_url: form.option_image_url.trim() || null,
    }

    setSubmitting(true)
    try {
      const { ok, status, data } = await createProductOptionRequest(body, token)
      if (!ok) {
        setError(messageFromResponse(status, data))
        if (status === 401) {
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('authUser')
          navigate('/login', { replace: true })
        }
        return
      }

      setSuccess(data)
      setForm(INITIAL_FORM)
    } catch {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <main className="product-new product-new--checking" role="status" aria-live="polite">
        관리자 권한 확인 중...
      </main>
    )
  }

  return (
    <main className="product-new">
      <header className="product-new__header">
        <div>
          <Link className="product-new__back" to="/admin">
            <FaArrowLeft aria-hidden />
            관리자 대시보드로 돌아가기
          </Link>
          <h1 className="product-new__title">새 상품 등록</h1>
          <p className="product-new__subtitle">
            상품 옵션, 재고, SKU와 대표 이미지를 입력해 상품 옵션을 등록합니다.
          </p>
        </div>
      </header>

      <div className="product-new__grid">
        <section className="product-new__card">
          <div className="product-new__card-head">
            <span className="product-new__card-icon" aria-hidden>
              <FaBoxOpen />
            </span>
            <div>
              <h2 className="product-new__card-title">상품 옵션 정보</h2>
              <p className="product-new__card-desc">
                SKU는 입력하는 경우 항상 고유해야 합니다.
              </p>
            </div>
          </div>

          {error ? (
            <p className="product-new__alert product-new__alert--error" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="product-new__alert product-new__alert--success" role="status">
              <FaCheckCircle aria-hidden />
              상품 옵션이 등록되었습니다. option_id: {success.option_id}
            </p>
          ) : null}

          <form className="product-new__form" onSubmit={handleSubmit}>
            <div className="product-new__row">
              <label className="product-new__field">
                <span className="product-new__label">상품명</span>
                <input
                  name="product_name"
                  type="text"
                  maxLength={100}
                  className="product-new__input"
                  value={form.product_name}
                  onChange={updateField}
                  placeholder="예: Hot Summer Polo Shirts"
                  required
                />
              </label>

              <label className="product-new__field">
                <span className="product-new__label">가격</span>
                <input
                  name="price"
                  type="number"
                  min="0"
                  className="product-new__input"
                  value={form.price}
                  onChange={updateField}
                  placeholder="예: 59000"
                  required
                />
              </label>
            </div>

            <div className="product-new__category-panel">
              <label className="product-new__field">
                <span className="product-new__label">상품 카테고리</span>
                <select
                  name="product_category"
                  className="product-new__input product-new__select"
                  value={form.product_category}
                  onChange={updateField}
                  required
                >
                  {PRODUCT_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="product-new__field">
                <span className="product-new__label">하위탭</span>
                <div className="product-new__sub-tabs" role="tablist" aria-label="상품 하위탭">
                  {SUB_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      role="tab"
                      aria-selected={form.sub_category === category}
                      className={`product-new__sub-tab ${
                        form.sub_category === category ? 'product-new__sub-tab--active' : ''
                      }`}
                      onClick={() => {
                        setForm((prev) => ({ ...prev, sub_category: category }))
                        setSuccess(null)
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="product-new__row">
              <label className="product-new__field">
                <span className="product-new__label">옵션 추가 금액</span>
                <input
                  name="additional_price"
                  type="number"
                  min="0"
                  className="product-new__input"
                  value={form.additional_price}
                  onChange={updateField}
                />
              </label>

              <label className="product-new__field">
                <span className="product-new__label">재고 수량</span>
                <input
                  name="stock_quantity"
                  type="number"
                  min="0"
                  className="product-new__input"
                  value={form.stock_quantity}
                  onChange={updateField}
                />
              </label>
            </div>

            <label className="product-new__field">
              <span className="product-new__label">SKU</span>
              <input
                name="sku"
                type="text"
                maxLength={50}
                className="product-new__input"
                value={form.sku}
                onChange={updateField}
                placeholder="예: BLACK-L-001"
              />
              <span className="product-new__hint">
                비워둘 수 있지만, 입력하면 중복될 수 없습니다.
              </span>
            </label>

            <label className="product-new__field">
              <span className="product-new__label">옵션 대표 이미지 URL</span>
              <div className="product-new__image-control">
                <input
                  name="option_image_url"
                  type="url"
                  maxLength={500}
                  className="product-new__input"
                  value={form.option_image_url}
                  onChange={updateField}
                  placeholder="Cloudinary 업로드 후 URL이 자동 입력됩니다."
                />
                <button
                  type="button"
                  className="product-new__upload-btn"
                  onClick={openCloudinaryWidget}
                  disabled={imageUploading}
                >
                  <FaCloudUploadAlt aria-hidden />
                  {imageUploading
                    ? '업로드 중...'
                    : widgetReady
                      ? '이미지 업로드'
                      : '위젯 로딩 중'}
                </button>
              </div>
              <span className="product-new__hint">
                {HAS_CLOUDINARY_CONFIG
                  ? 'Cloudinary 위젯으로 이미지를 업로드하면 미리보기에 바로 반영됩니다.'
                  : 'client/.env에 Cloudinary cloud name과 unsigned upload preset을 설정해 주세요.'}
              </span>
            </label>

            <div className="product-new__actions">
              <button
                type="button"
                className="product-new__btn product-new__btn--ghost"
                onClick={() => {
                  setForm(INITIAL_FORM)
                  setError('')
                  setSuccess(null)
                }}
              >
                초기화
              </button>
              <button
                type="submit"
                className="product-new__btn product-new__btn--primary"
                disabled={submitting}
              >
                <FaSave aria-hidden />
                {submitting ? '등록 중...' : '상품 등록하기'}
              </button>
            </div>
          </form>
        </section>

        <aside className="product-new__preview">
          <div className="product-new__preview-image">
            {preview.image ? (
              <img src={preview.image} alt="옵션 대표 미리보기" />
            ) : (
              <div className="product-new__preview-empty">
                <FaImage aria-hidden />
                이미지 URL을 입력하면 미리보기가 표시됩니다.
              </div>
            )}
          </div>
          <div className="product-new__preview-body">
            <span className="product-new__preview-badge">
              <FaTag aria-hidden />
              {preview.category}
            </span>
            <h2 className="product-new__preview-title">{preview.productName}</h2>
            <dl className="product-new__preview-list">
              <div>
                <dt>카테고리</dt>
                <dd>{preview.category}</dd>
              </div>
              <div>
                <dt>하위탭</dt>
                <dd>{preview.subCategory}</dd>
              </div>
              <div>
                <dt>가격</dt>
                <dd>{preview.priceTab}원</dd>
              </div>
              <div>
                <dt>추가 금액</dt>
                <dd>{preview.price}원</dd>
              </div>
              <div>
                <dt>재고</dt>
                <dd>{preview.stock}개</dd>
              </div>
              <div>
                <dt>SKU</dt>
                <dd>{preview.sku}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </main>
  )
}
