/**
 * Cart API client.
 *
 * Server (all routes require Bearer token):
 *   GET    /api/cart
 *   POST   /api/cart/items
 *   PATCH  /api/cart/items/:option_id
 *   DELETE /api/cart/items/:option_id
 *   DELETE /api/cart
 */

const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

function cartUrl(path = '') {
  return `${API_BASE}/api/cart${path}`
}

async function parseResponse(res) {
  let data = {}
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }
  return { ok: res.ok, status: res.status, data }
}

function unauthorized() {
  return {
    ok: false,
    status: 401,
    data: { message: '로그인이 필요합니다. 다시 로그인해 주세요.' },
  }
}

export const CART_UPDATED_EVENT = 'cart:updated'

/**
 * Broadcast that the current user's cart has changed so that listeners
 * (e.g. the navbar badge) can refresh without re-fetching when possible.
 *
 * @param {{ total_quantity?: number } | null | undefined} cart
 */
export function notifyCartUpdated(cart) {
  if (typeof window === 'undefined') return
  const totalQuantity =
    cart && typeof cart === 'object' && Number.isFinite(Number(cart.total_quantity))
      ? Number(cart.total_quantity)
      : null
  window.dispatchEvent(
    new CustomEvent(CART_UPDATED_EVENT, { detail: { totalQuantity } })
  )
}

/**
 * GET /api/cart
 * @param {string} token
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getMyCartRequest(token, options = {}) {
  if (!token) return unauthorized()

  const res = await fetch(cartUrl(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    signal: options.signal,
  })

  return parseResponse(res)
}

/**
 * POST /api/cart/items
 * @param {{ option_id: number; quantity?: number; size?: string|null }} body
 * @param {string} token
 */
export async function addCartItemRequest(body, token) {
  if (!token) return unauthorized()

  const res = await fetch(cartUrl('/items'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  return parseResponse(res)
}

/**
 * PATCH /api/cart/items/:option_id
 * @param {string | number} optionId
 * @param {{ quantity?: number; size?: string|null; new_size?: string|null }} body
 * @param {string} token
 */
export async function updateCartItemRequest(optionId, body, token) {
  if (!token) return unauthorized()

  const res = await fetch(cartUrl(`/items/${encodeURIComponent(optionId)}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  return parseResponse(res)
}

/**
 * DELETE /api/cart/items/:option_id
 * @param {string | number} optionId
 * @param {string|null|undefined} size
 * @param {string} token
 */
export async function removeCartItemRequest(optionId, size, token) {
  if (!token) return unauthorized()

  const query = size ? `?size=${encodeURIComponent(size)}` : ''
  const res = await fetch(
    cartUrl(`/items/${encodeURIComponent(optionId)}${query}`),
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  return parseResponse(res)
}

/**
 * DELETE /api/cart
 * @param {string} token
 */
export async function clearCartRequest(token) {
  if (!token) return unauthorized()

  const res = await fetch(cartUrl(), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  return parseResponse(res)
}
