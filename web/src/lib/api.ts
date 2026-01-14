import { getApiBaseUrl } from './env'
import { clearTokens, getTokens, setTokens } from './tokens'

export type ApiError = {
  status: number
  message: string
  raw?: unknown
}

function toApiError(status: number, raw: unknown): ApiError {
  const message =
    typeof raw === 'object' && raw && 'error' in raw && typeof (raw as any).error === 'string'
      ? (raw as any).error
      : typeof raw === 'object' && raw && 'message' in raw && typeof (raw as any).message === 'string'
        ? (raw as any).message
        : `Request failed (${status})`

  return { status, message, raw }
}

async function readJsonSafe(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => '')
    return text ? { message: text } : null
  }
  return response.json().catch(() => null)
}

async function apiFetch(
  path: string,
  init: RequestInit & { auth?: boolean; retryOn401?: boolean } = {},
): Promise<unknown> {
  const url = `${getApiBaseUrl().replace(/\/$/, '')}/${path.replace(/^\//, '')}`

  const { auth, retryOn401 = true, ...requestInit } = init
  const headers = new Headers(requestInit.headers)
  headers.set('Accept', 'application/json')

  if (!headers.has('Content-Type') && requestInit.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth) {
    const { accessToken } = getTokens()
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(url, { ...requestInit, headers })

  if (response.ok) {
    return readJsonSafe(response)
  }

  // If the access token expired, try refresh once and retry the original call
  if (response.status === 401 && auth && retryOn401) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      return apiFetch(path, { ...init, retryOn401: false })
    }
  }

  const raw = await readJsonSafe(response)
  throw toApiError(response.status, raw)
}

export type LoginResponse = {
  success: boolean
  message?: string
  user?: {
    id: number
    email: string
    first_name?: string
    last_name?: string
  }
  access_token?: string
  refresh_token?: string
  session_id?: string
  expires_in?: number
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const raw = await apiFetch('login.php', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  const data = raw as LoginResponse
  if (data.access_token) setTokens({ accessToken: data.access_token })
  if (data.refresh_token) setTokens({ refreshToken: data.refresh_token })
  if (data.session_id) setTokens({ sessionId: data.session_id })

  return data
}

export type RefreshResponse = {
  success: boolean
  access_token: string
  expires_in: number
  token_type: 'Bearer'
}

export async function tryRefresh(): Promise<boolean> {
  const { refreshToken } = getTokens()
  if (!refreshToken) return false

  try {
    const raw = await apiFetch('refresh.php', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
      auth: false,
      retryOn401: false,
    })

    const data = raw as RefreshResponse
    if (data?.access_token) {
      setTokens({ accessToken: data.access_token })
      return true
    }

    return false
  } catch {
    // If refresh fails, wipe tokens so UI can re-login.
    clearTokens()
    return false
  }
}

export type ProfileResponse = {
  success: boolean
  message?: string
  user?: {
    id: number
    email: string
    first_name?: string
    last_name?: string
    created_at?: string
    last_login?: string
  }
  token_info?: {
    issued_at: string
    expires_at: string
  }
}

export async function getProfile(): Promise<ProfileResponse> {
  const raw = await apiFetch('profile.php', {
    method: 'GET',
    auth: true,
  })

  return raw as ProfileResponse
}

export async function logout(logoutAll = false): Promise<void> {
  const { refreshToken, sessionId } = getTokens()
  if (!refreshToken) {
    clearTokens()
    return
  }

  try {
    await apiFetch('logout.php', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken, logout_all: logoutAll, session_id: sessionId }),
      auth: false,
      retryOn401: false,
    })
  } finally {
    clearTokens()
  }
}
