import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaBoxOpen,
  FaChartLine,
  FaEye,
  FaPlus,
  FaShoppingCart,
  FaUsers,
  FaCube,
  FaChartBar,
  FaClipboardList,
} from 'react-icons/fa'
import { getMeRequest } from '../api/auth.js'
import './Admin.css'

const STATS = [
  {
    id: 'orders',
    label: '총 주문',
    value: '1,234',
    delta: '+12% from last month',
    icon: <FaShoppingCart />,
    tone: 'blue',
  },
  {
    id: 'products',
    label: '총 상품',
    value: '156',
    delta: '+3% from last month',
    icon: <FaCube />,
    tone: 'green',
  },
  {
    id: 'customers',
    label: '총 고객',
    value: '2,345',
    delta: '+8% from last month',
    icon: <FaUsers />,
    tone: 'purple',
  },
  {
    id: 'sales',
    label: '총 매출',
    value: '$45,678',
    delta: '+15% from last month',
    icon: <FaChartLine />,
    tone: 'orange',
  },
]

const QUICK_ACTIONS = [
  {
    id: 'new-product',
    label: '새 상품 등록',
    icon: <FaPlus />,
    primary: true,
    to: '/admin/products/new',
  },
  { id: 'orders', label: '주문 관리', icon: <FaEye /> },
  { id: 'sales', label: '매출 분석', icon: <FaChartBar /> },
  { id: 'customers', label: '고객 관리', icon: <FaUsers /> },
]

const RECENT_ORDERS = [
  {
    id: 'ORD-001234',
    customer: '김민수',
    date: '2024-12-30',
    status: '처리중',
    amount: '$219',
    tone: 'yellow',
  },
  {
    id: 'ORD-001233',
    customer: '이영희',
    date: '2024-12-29',
    status: '배송중',
    amount: '$156',
    tone: 'blue',
  },
  {
    id: 'ORD-001232',
    customer: '박철수',
    date: '2024-12-28',
    status: '배송완료',
    amount: '$97',
    tone: 'green',
  },
]

const MANAGEMENT_CARDS = [
  {
    id: 'products',
    title: '상품 관리',
    desc: '상품 등록, 수정, 재고 및 가격 관리',
    icon: <FaCube />,
    tone: 'blue',
    to: '/admin/products',
  },
  {
    id: 'orders',
    title: '주문 관리',
    desc: '주문 조회, 상태 변경 및 배송 관리',
    icon: <FaShoppingCart />,
    tone: 'green',
  },
  {
    id: 'analytics',
    title: '매출 분석',
    desc: '기간별 매출과 인기 상품 분석',
    icon: <FaChartLine />,
    tone: 'orange',
  },
  {
    id: 'customers',
    title: '고객 관리',
    desc: '고객 정보, 등급 및 문의 내역 관리',
    icon: <FaUsers />,
    tone: 'purple',
  },
]

function isAdmin(user) {
  return Boolean(user) && user['user-type'] === 'admin'
}

export default function Admin() {
  const navigate = useNavigate()
  const [me, setMe] = useState(null)
  const [checking, setChecking] = useState(true)

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
          setMe(d.user)
          sessionStorage.setItem('authUser', JSON.stringify(d.user))
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
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [navigate])

  if (checking) {
    return (
      <main className="admin admin--checking" role="status" aria-live="polite">
        관리자 권한 확인 중...
      </main>
    )
  }

  return (
    <main className="admin">
      <header className="admin__header">
        <div>
          <Link className="admin__home-link" to="/">
            쇼핑몰로 돌아가기
          </Link>
          <h1 className="admin__title">관리자 대시보드</h1>
          <p className="admin__subtitle">
            CIDER 쇼핑몰 관리 시스템에 오신 것을 환영합니다.
            {me ? ` ${me.name} 관리자님.` : ''}
          </p>
        </div>
      </header>

      <section className="admin__stats" aria-label="요약 통계">
        {STATS.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </section>

      <section className="admin__main-grid">
        <QuickActions />
        <RecentOrders />
      </section>

      <section className="admin__management" aria-label="관리 메뉴">
        {MANAGEMENT_CARDS.map((card) => (
          <ManagementCard key={card.id} card={card} />
        ))}
      </section>
    </main>
  )
}

function StatCard({ stat }) {
  return (
    <article className="admin__stat-card">
      <div>
        <p className="admin__stat-label">{stat.label}</p>
        <strong className="admin__stat-value">{stat.value}</strong>
        <span className="admin__stat-delta">{stat.delta}</span>
      </div>
      <span className={`admin__stat-icon admin__stat-icon--${stat.tone}`} aria-hidden>
        {stat.icon}
      </span>
    </article>
  )
}

function QuickActions() {
  return (
    <section className="admin__panel">
      <h2 className="admin__panel-title">빠른 작업</h2>
      <div className="admin__quick-list">
        {QUICK_ACTIONS.map((action) => {
          const className = `admin__quick-btn ${
            action.primary ? 'admin__quick-btn--primary' : ''
          }`
          const content = (
            <>
              <span className="admin__quick-icon" aria-hidden>
                {action.icon}
              </span>
              {action.label}
            </>
          )

          return action.to ? (
            <Link key={action.id} to={action.to} className={className}>
              {content}
            </Link>
          ) : (
            <button key={action.id} type="button" className={className}>
              {content}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function RecentOrders() {
  return (
    <section className="admin__panel">
      <div className="admin__panel-head">
        <h2 className="admin__panel-title">최근 주문</h2>
        <a className="admin__view-all" href="#orders">
          전체보기
        </a>
      </div>
      <ul className="admin__order-list">
        {RECENT_ORDERS.map((order) => (
          <li key={order.id} className="admin__order-item">
            <div>
              <strong className="admin__order-id">{order.id}</strong>
              <span className="admin__order-customer">{order.customer}</span>
              <span className="admin__order-date">{order.date}</span>
            </div>
            <div className="admin__order-side">
              <span className={`admin__order-status admin__order-status--${order.tone}`}>
                {order.status}
              </span>
              <strong className="admin__order-amount">{order.amount}</strong>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ManagementCard({ card }) {
  return (
    <article className="admin__manage-card">
      <span className={`admin__manage-icon admin__manage-icon--${card.tone}`} aria-hidden>
        {card.icon}
      </span>
      <h3 className="admin__manage-title">{card.title}</h3>
      <p className="admin__manage-desc">{card.desc}</p>
      {card.to ? (
        <Link to={card.to} className="admin__manage-btn">
          관리하기
          <FaClipboardList aria-hidden />
        </Link>
      ) : (
        <button type="button" className="admin__manage-btn">
          관리하기
          <FaClipboardList aria-hidden />
        </button>
      )}
    </article>
  )
}
