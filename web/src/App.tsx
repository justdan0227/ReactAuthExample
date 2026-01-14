import { useMemo, useState } from 'react'
import './App.css'
import { getApiBaseUrl } from './lib/env'
import { getProfile, login, logout } from './lib/api'
import { getTokens } from './lib/tokens'

function App() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), [])
  const [email, setEmail] = useState('john@example.com')
  const [password, setPassword] = useState('TestPass123!')
  const [status, setStatus] = useState<string>('')
  const [profileJson, setProfileJson] = useState<string>('')
  const [tokensJson, setTokensJson] = useState<string>(() => JSON.stringify(getTokens(), null, 2))

  const tokens = useMemo(() => {
    try {
      return JSON.parse(tokensJson) as ReturnType<typeof getTokens>
    } catch {
      return getTokens()
    }
  }, [tokensJson])

  function refreshTokenView() {
    setTokensJson(JSON.stringify(getTokens(), null, 2))
  }

  async function onLogin() {
    setStatus('Logging in…')
    setProfileJson('')

    try {
      const res = await login(email, password)
      refreshTokenView()
      setStatus(res.success ? 'Login ok' : 'Login returned non-success')
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setStatus(`Login failed: ${message}`)
    }
  }

  async function onLoadProfile() {
    setStatus('Loading profile…')

    try {
      const res = await getProfile()
      setProfileJson(JSON.stringify(res, null, 2))
      refreshTokenView()
      setStatus('Profile ok')
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setStatus(`Profile failed: ${message}`)
      refreshTokenView()
    }
  }

  async function onLogout(all: boolean) {
    setStatus(all ? 'Logging out (all devices)…' : 'Logging out…')
    setProfileJson('')

    try {
      await logout(all)
      refreshTokenView()
      setStatus('Logged out')
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setStatus(`Logout error: ${message}`)
      refreshTokenView()
    }
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: 24, textAlign: 'left' }}>
      <h1>ReactAuthExample (Web)</h1>
      <p style={{ opacity: 0.8 }}>
        API base URL: <code>{apiBaseUrl}</code>
      </p>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Login</h2>

        <label style={{ display: 'block', marginBottom: 12 }}>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: 'block', width: '100%', marginTop: 6, padding: 10 }}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 12 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: 'block', width: '100%', marginTop: 6, padding: 10 }}
          />
        </label>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={onLogin}>Login</button>
          <button onClick={onLoadProfile}>Get Profile (auto-refresh)</button>
          <button onClick={() => onLogout(false)}>Logout</button>
          <button onClick={() => onLogout(true)}>Logout All</button>
        </div>

        <p style={{ marginTop: 12, opacity: 0.85 }}>
          Status: <strong>{status || '—'}</strong>
        </p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Tokens (localStorage)</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 8, marginBottom: 12 }}>
          <div style={{ opacity: 0.8 }}>Access token</div>
          <div>{tokens.accessToken ? `Present (${tokens.accessToken.length} chars)` : '—'}</div>

          <div style={{ opacity: 0.8 }}>Refresh token</div>
          <div>{tokens.refreshToken ? `Present (${tokens.refreshToken.length} chars)` : '—'}</div>

          <div style={{ opacity: 0.8 }}>Session ID</div>
          <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
            {tokens.sessionId || '—'}
          </div>
        </div>

        <pre style={{ whiteSpace: 'pre-wrap' }}>{tokensJson}</pre>
        <button onClick={refreshTokenView}>Refresh View</button>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Profile response</h2>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{profileJson || '—'}</pre>
      </div>
    </div>
  )
}

export default App
