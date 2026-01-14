const ACCESS_TOKEN_KEY = 'auth.access_token'
const REFRESH_TOKEN_KEY = 'auth.refresh_token'
const SESSION_ID_KEY = 'auth.session_id'

export type Tokens = {
  accessToken: string | null
  refreshToken: string | null
  sessionId: string | null
}

export function getTokens(): Tokens {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
    sessionId: localStorage.getItem(SESSION_ID_KEY),
  }
}

export function setTokens(tokens: Partial<Tokens>): void {
  if (tokens.accessToken !== undefined) {
    if (tokens.accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    else localStorage.removeItem(ACCESS_TOKEN_KEY)
  }

  if (tokens.refreshToken !== undefined) {
    if (tokens.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
    else localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  if (tokens.sessionId !== undefined) {
    if (tokens.sessionId) localStorage.setItem(SESSION_ID_KEY, tokens.sessionId)
    else localStorage.removeItem(SESSION_ID_KEY)
  }
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(SESSION_ID_KEY)
}
