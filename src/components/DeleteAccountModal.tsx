import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteMyAccount } from '@/lib/supabaseSync'
import { useAuth } from '@/contexts/AuthContext'
import { UserX, AlertCircle, Loader2 } from 'lucide-react'

export interface DeleteAccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteAccountModal({ open, onOpenChange }: DeleteAccountModalProps) {
  const { user, signOut } = useAuth()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep(1)
      setError(null)
    }
    onOpenChange(isOpen)
  }

  const handleConfirmDelete = async () => {
    if (!user?.id) {
      setError('Oturum bulunamadı.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: err } = await deleteMyAccount()
    if (err) {
      setError(err)
      setLoading(false)
      return
    }
    await signOut()
    handleClose(false)
    window.location.reload()
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" showClose={true}>
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <UserX className="h-5 w-5 text-destructive" />
                Hesabımı sil
              </DialogTitle>
              <DialogDescription>
                Tüm veriniz ve giriş hesabınız kalıcı olarak silinecek. Bu işlem geri alınamaz.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                İptal
              </Button>
              <Button
                variant="destructive"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => setStep(2)}
              >
                Devam
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                Emin misiniz?
              </DialogTitle>
              <DialogDescription>
                Hesabınız ve tüm verileriniz silinecek. Bu işlem geri alınamaz.
              </DialogDescription>
            </DialogHeader>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                Geri
              </Button>
              <Button
                variant="destructive"
                className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleConfirmDelete}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Evet, hesabımı sil
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
