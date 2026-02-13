import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type AuthDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { user, signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && open) {
      onOpenChange(false)
    }
  }, [user, open, onOpenChange])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!email.trim() || !password) {
      setError('E-posta ve şifre gerekli.')
      return
    }
    setLoading(true)
    const { error: err } = await signIn(email.trim(), password)
    setLoading(false)
    if (err) setError(err.message)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!email.trim() || !password) {
      setError('E-posta ve şifre gerekli.')
      return
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.')
      return
    }
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.')
      return
    }
    setLoading(true)
    const { error: err } = await signUp(email.trim(), password)
    setLoading(false)
    if (err) setError(err.message)
    else setMessage('Kayıt başarılı. E-posta ile gelen bağlantıya tıklayarak e-postanı doğrulayabilirsin (Supabase e-posta doğrulama açıksa).')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Giriş yap veya kayıt ol</DialogTitle>
          <DialogDescription>
            Hesabınla giriş yaparsan verilerin cihazlar arası senkronize edilir.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Giriş</TabsTrigger>
            <TabsTrigger value="signup">Kayıt</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-signin-email">E-posta</Label>
                <Input
                  id="dialog-signin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-signin-password">Şifre</Label>
                <Input
                  id="dialog-signin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-signup-email">E-posta</Label>
                <Input
                  id="dialog-signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-signup-password">Şifre (en az 6 karakter)</Label>
                <Input
                  id="dialog-signup-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-signup-confirm">Şifre tekrar</Label>
                <Input
                  id="dialog-signup-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {(error || message) && (
                <p className={error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
                  {error ?? message}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Kaydediliyor…' : 'Kayıt ol'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
