import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  setAuth,
  apiRegister,
  apiLogin,
  getAuth,
} from '@/lib/auth'
import { STORAGE_KEY } from '@/types'
import { Target, Loader2 } from 'lucide-react'

type Mode = 'login' | 'register'

export function LoginRegisterScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const u = username.trim()
    const p = password
    if (!u || !p) {
      setError('Kullanıcı adı ve şifre gerekli.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'register') {
        const result = await apiRegister(u, p)
        if (result.error) {
          setError(result.error)
          return
        }
        setAuth(u, p)
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ goals: [], completions: {}, columnWidths: {}, comments: {}, earnings: {} }))
        window.location.reload()
      } else {
        const result = await apiLogin(u, p)
        if (result.error) {
          setError(result.error)
          return
        }
        setAuth(u, p)
        const data = result.data ?? { goals: [], completions: {}, columnWidths: {}, comments: {}, earnings: {} }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        window.location.reload()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Target className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-xl">Düzen</CardTitle>
          <CardDescription>
            {mode === 'login' ? 'Hesabına giriş yap' : 'Yeni hesap oluştur'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı adı</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="kullanici_adi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === 'login' ? (
                'Giriş yap'
              ) : (
                'Kayıt ol'
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === 'login' ? (
              <>
                Hesabın yok mu?{' '}
                <button
                  type="button"
                  className="text-primary underline underline-offset-2 hover:no-underline"
                  onClick={() => { setMode('register'); setError(''); }}
                >
                  Kayıt ol
                </button>
              </>
            ) : (
              <>
                Zaten hesabın var mı?{' '}
                <button
                  type="button"
                  className="text-primary underline underline-offset-2 hover:no-underline"
                  onClick={() => { setMode('login'); setError(''); }}
                >
                  Giriş yap
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export function isLoggedIn(): boolean {
  return getAuth() !== null
}
