/**
 * Auth API — same base as server routes:
 * POST /api/auth/login, GET /api/auth/me (Bearer token)
 */

const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

function authLoginUrl() {
  return `${API_BASE}/api/auth/login`
}

function authMeUrl() {
  return `${API_BASE}/api/auth/me`
}

/**
 * @param {{ email: string; password: string }} body
 * @returns {Promise<{ ok: boolean; status: number; data: unknown }>}
 */
export async function loginRequest(body) {
  const res = await fetch(authLoginUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

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
 * GET /api/auth/me — Authorization: Bearer <token>
 * @param {string} token
 * @returns {Promise<{ ok: boolean; status: number; data: unknown }>}
 */
export async function getMeRequest(token) {
  const res = await fetch(authMeUrl(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

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
