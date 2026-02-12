import type { Store } from '@/types'

export const AUTH_USER_KEY = 'duzen-username'
export const AUTH_PASS_KEY = 'duzen-password'

export function getAuth(): { username: string; password: string } | null {
  try {
    const u = localStorage.getItem(AUTH_USER_KEY)
    const p = localStorage.getItem(AUTH_PASS_KEY)
    if (u && p) return { username: u, password: p }
  } catch {
    // ignore
  }
  return null
}

export function setAuth(username: string, password: string): void {
  localStorage.setItem(AUTH_USER_KEY, username.trim())
  localStorage.setItem(AUTH_PASS_KEY, password)
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(AUTH_PASS_KEY)
}

function getApiBase(): string {
  const url = import.meta.env.VITE_AUTH_API_URL as string | undefined
  return (url ?? '').replace(/\/$/, '')
}

export async function apiRegister(username: string, password: string): Promise<{ ok?: boolean; error?: string }> {
  const base = getApiBase()
  if (!base) return { error: 'Auth API adresi ayarlı değil (VITE_AUTH_API_URL)' }
  const res = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.trim(), password }),
  })
  const data = (await res.json()) as { error?: string }
  if (!res.ok) return { error: data.error ?? 'Kayıt başarısız' }
  return { ok: true }
}

export async function apiLogin(username: string, password: string): Promise<{ data?: Store; error?: string }> {
  const base = getApiBase()
  if (!base) return { error: 'Auth API adresi ayarlı değil (VITE_AUTH_API_URL)' }
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.trim(), password }),
  })
  const data = (await res.json()) as { data?: Store; error?: string }
  if (!res.ok) return { error: data.error ?? 'Giriş başarısız' }
  return { data: data.data }
}

export async function apiUpdateData(username: string, password: string, storeData: Store): Promise<{ error?: string }> {
  const base = getApiBase()
  if (!base) return {}
  const res = await fetch(`${base}/user/data`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.trim(), password, data: storeData }),
  })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    return { error: data.error ?? 'Senkronizasyon başarısız' }
  }
  return {}
}
