export interface Env {
  DUZEN_KV: KVNamespace
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

function userKey(username: string): string {
  return `user:${username.trim().toLowerCase()}`
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS })
    }

    const url = new URL(request.url)
    const path = url.pathname

    try {
      if (path === '/auth/register' && request.method === 'POST') {
        const body = (await request.json()) as { username?: string; password?: string }
        const username = typeof body.username === 'string' ? body.username.trim() : ''
        const password = typeof body.password === 'string' ? body.password : ''
        if (!username || !password) {
          return jsonResponse({ error: 'Kullanıcı adı ve şifre gerekli' }, 400)
        }
        const key = userKey(username)
        const existing = await env.DUZEN_KV.get(key)
        if (existing) {
          return jsonResponse({ error: 'Bu kullanıcı adı zaten kullanılıyor' }, 409)
        }
        const value = JSON.stringify({ password, data: {} })
        await env.DUZEN_KV.put(key, value)
        return jsonResponse({ ok: true }, 201)
      }

      if (path === '/auth/login' && request.method === 'POST') {
        const body = (await request.json()) as { username?: string; password?: string }
        const username = typeof body.username === 'string' ? body.username.trim() : ''
        const password = typeof body.password === 'string' ? body.password : ''
        if (!username || !password) {
          return jsonResponse({ error: 'Kullanıcı adı ve şifre gerekli' }, 400)
        }
        const key = userKey(username)
        const raw = await env.DUZEN_KV.get(key)
        if (!raw) {
          return jsonResponse({ error: 'Kullanıcı adı veya şifre hatalı' }, 401)
        }
        const parsed = JSON.parse(raw) as { password: string; data: unknown }
        if (parsed.password !== password) {
          return jsonResponse({ error: 'Kullanıcı adı veya şifre hatalı' }, 401)
        }
        return jsonResponse({ data: parsed.data ?? {} }, 200)
      }

      if (path === '/user/data' && request.method === 'PUT') {
        const body = (await request.json()) as { username?: string; password?: string; data?: unknown }
        const username = typeof body.username === 'string' ? body.username.trim() : ''
        const password = typeof body.password === 'string' ? body.password : ''
        const data = body.data
        if (!username || !password) {
          return jsonResponse({ error: 'Kullanıcı adı ve şifre gerekli' }, 400)
        }
        const key = userKey(username)
        const raw = await env.DUZEN_KV.get(key)
        if (!raw) {
          return jsonResponse({ error: 'Oturum geçersiz' }, 401)
        }
        const parsed = JSON.parse(raw) as { password: string; data: unknown }
        if (parsed.password !== password) {
          return jsonResponse({ error: 'Oturum geçersiz' }, 401)
        }
        const value = JSON.stringify({ password: parsed.password, data: data ?? parsed.data ?? {} })
        await env.DUZEN_KV.put(key, value)
        return jsonResponse({ ok: true }, 200)
      }

      return jsonResponse({ error: 'Not Found' }, 404)
    } catch (e) {
      return jsonResponse({ error: 'Sunucu hatası' }, 500)
    }
  },
}
