/**
 * User API — matches server/routes/index.js (`/api` + `/users`)
 * and server/controllers/userController.js `pickAllowed` fields:
 * email, name, password, user-type, address
 */

const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

function usersUrl() {
  return `${API_BASE}/api/users`
}

/**
 * @param {{ email: string; name: string; password: string; 'user-type'?: string; address?: string }} body
 * @returns {Promise<{ ok: boolean; status: number; data: unknown }>}
 */
export async function registerUser(body) {
  const res = await fetch(usersUrl(), {
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
