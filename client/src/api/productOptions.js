/**
 * Product Options API client.
 * Server: POST /api/product-options (requires admin Bearer token)
 *         GET  /api/product-options
 *         GET  /api/product-options/:id
 *         PATCH/DELETE require admin Bearer token
 */

const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

function productOptionsUrl(path = '') {
  return `${API_BASE}/api/product-options${path}`
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

/**
 * Create a new product option. Requires an admin user's JWT.
 *
 * @param {{
 *   product_name: string;
 *   price: number;
 *   product_id?: number;
 *   option_name?: string;
 *   product_category?: string;
 *   sub_category?: string;
 *   additional_price?: number;
 *   stock_quantity?: number;
 *   sku?: string | null;
 *   option_image_url?: string | null;
 * }} body
 * @param {string} token  Bearer token issued by /api/auth/login
 * @returns {Promise<{ ok: boolean; status: number; data: unknown }>}
 */
export async function createProductOptionRequest(body, token) {
  if (!token) {
    return {
      ok: false,
      status: 401,
      data: { message: '로그인이 필요합니다. 다시 로그인해 주세요.' },
    }
  }

  const res = await fetch(productOptionsUrl(), {
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
 * List product options with optional filters and pagination.
 *
 * @param {{
 *   page?: number;
 *   limit?: number;
 *   product_name?: string;
 *   product_category?: string;
 *   sub_category?: string;
 *   sku?: string;
 * }} [params]
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ ok: boolean; status: number; data: unknown }>}
 */
export async function listProductOptionsRequest(params = {}, options = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    const v = String(value).trim()
    if (!v) continue
    query.set(key, v)
  }

  const qs = query.toString()
  const url = qs ? `${productOptionsUrl()}?${qs}` : productOptionsUrl()

  const res = await fetch(url, {
    method: 'GET',
    signal: options.signal,
  })

  return parseResponse(res)
}

/**
 * Fetch all product options by walking the paginated list endpoint.
 *
 * @param {{
 *   product_name?: string;
 *   product_category?: string;
 *   sub_category?: string;
 *   sku?: string;
 * }} [params]
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ ok: boolean; status: number; data: unknown }>}
 */
export async function listAllProductOptionsRequest(params = {}, options = {}) {
  const limit = 100
  let page = 1
  let total = 0
  const items = []

  while (true) {
    const response = await listProductOptionsRequest(
      { ...params, page, limit },
      options
    )

    if (!response.ok) return response

    const d =
      response.data && typeof response.data === 'object' ? response.data : {}
    const pageItems = Array.isArray(d.items) ? d.items : []
    items.push(...pageItems)
    total = Number(d.total) || items.length

    const hasNextPage =
      typeof d.hasNextPage === 'boolean'
        ? d.hasNextPage
        : page * limit < total

    if (!hasNextPage) {
      return {
        ok: true,
        status: response.status,
        data: {
          items,
          page: 1,
          limit: items.length,
          total,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      }
    }

    page += 1
  }
}

/**
 * Get a single product option by option_id (number) or Mongo _id (string).
 *
 * @param {string | number} id
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ ok: boolean; status: number; data: unknown }>}
 */
export async function getProductOptionRequest(id, options = {}) {
  const res = await fetch(productOptionsUrl(`/${encodeURIComponent(id)}`), {
    method: 'GET',
    signal: options.signal,
  })

  return parseResponse(res)
}

/**
 * Delete a product option by option_id (number) or Mongo _id (string).
 * Requires an admin user's JWT.
 *
 * @param {string | number} id
 * @param {string} token
 * @returns {Promise<{ ok: boolean; status: number; data: unknown }>}
 */
export async function deleteProductOptionRequest(id, token) {
  if (!token) {
    return {
      ok: false,
      status: 401,
      data: { message: '로그인이 필요합니다. 다시 로그인해 주세요.' },
    }
  }

  const res = await fetch(productOptionsUrl(`/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return parseResponse(res)
}
