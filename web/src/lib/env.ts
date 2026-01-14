export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined

  // Default uses a same-origin dev proxy configured in web/vite.config.ts.
  // If your setup differs, set VITE_API_BASE_URL in web/.env.local.
  return (fromEnv && fromEnv.trim()) || '/api'
}
