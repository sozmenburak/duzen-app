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
import { Label } from '@/components/ui/label'
import { exportData, resetAllData, resetDataOnly } from '@/store'
import { RotateCcw, AlertCircle, Download, Trash2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

function downloadExport() {
  const json = exportData()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `duzen-yedek-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

type ResetMode = 'all' | 'dataOnly'

export interface ResetDangerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResetDangerModal({ open, onOpenChange }: ResetDangerModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [mode, setMode] = useState<ResetMode>('dataOnly')
  const [tickTicks, setTickTicks] = useState(true)
  const [tickComments, setTickComments] = useState(true)
  const [tickEarnings, setTickEarnings] = useState(true)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep(1)
      setMode('dataOnly')
      setTickTicks(true)
      setTickComments(true)
      setTickEarnings(true)
    }
    onOpenChange(isOpen)
  }

  const handleContinueToConfirm = () => {
    setStep(2)
  }

  const handleExportBeforeDelete = () => {
    downloadExport()
  }

  const handleConfirmDelete = () => {
    // Her ihtimale karşı silmeden önce otomatik export
    downloadExport()
    if (mode === 'all') {
      resetAllData()
    } else {
      resetDataOnly({
        ticks: tickTicks,
        comments: tickComments,
        earnings: tickEarnings,
      })
    }
    handleClose(false)
    setShowSuccessModal(true)
  }

  const handleSuccessClose = () => {
    setShowSuccessModal(false)
    window.location.reload()
  }

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" showClose={true}>
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
                Veriyi sıfırla
              </DialogTitle>
              <DialogDescription>
                Bu işlem geri alınamaz. Seçtiğiniz tüm veri kalıcı olarak silinecek.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-3">
                <Label className="text-foreground">Ne silinsin?</Label>
                <div className="space-y-2">
                  <label
                    className={cn(
                      'flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors',
                      mode === 'all' && 'border-destructive bg-destructive/5'
                    )}
                  >
                    <input
                      type="radio"
                      name="resetMode"
                      className="mt-1.5"
                      checked={mode === 'all'}
                      onChange={() => setMode('all')}
                    />
                    <span className="text-sm">
                      <strong>Tüm veriyi sil</strong> — Hedefler dahil her şey silinir, uygulama başlangıç ekranına döner.
                    </span>
                  </label>
                  <label
                    className={cn(
                      'flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors',
                      mode === 'dataOnly' && 'border-destructive bg-destructive/5'
                    )}
                  >
                    <input
                      type="radio"
                      name="resetMode"
                      className="mt-1.5"
                      checked={mode === 'dataOnly'}
                      onChange={() => setMode('dataOnly')}
                    />
                    <span className="text-sm">
                      <strong>Sadece veriyi sil</strong> — Eklenen hedefler (sütunlar) kalır; aşağıdaki veriler silinir.
                    </span>
                  </label>
                </div>
              </div>

              {mode === 'dataOnly' && (
                <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                  <Label className="text-foreground text-xs">Silinecek veri türleri (işaretliler silinir)</Label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tickTicks}
                      onChange={(e) => setTickTicks(e.target.checked)}
                    />
                    <span className="text-sm">Tikler (yapıldı / yapılmadı)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tickEarnings}
                      onChange={(e) => setTickEarnings(e.target.checked)}
                    />
                    <span className="text-sm">Para verisi</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tickComments}
                      onChange={(e) => setTickComments(e.target.checked)}
                    />
                    <span className="text-sm">Yorum verisi</span>
                  </label>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                İptal
              </Button>
              <Button
                variant="destructive"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleContinueToConfirm}
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
                Seçtiğiniz veriler kalıcı olarak silinecek. Silmeden önce aşağıdaki &quot;Export al&quot; ile yedek alabilirsiniz.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-center gap-2"
                onClick={handleExportBeforeDelete}
              >
                <Download className="h-4 w-4" />
                Export al (silmeden önce yedekle)
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>
                Geri
              </Button>
              <Button
                variant="destructive"
                className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleConfirmDelete}
              >
                <Trash2 className="h-4 w-4" />
                Evet, sil
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>

    <Dialog open={showSuccessModal} onOpenChange={(isOpen) => !isOpen && handleSuccessClose()}>
      <DialogContent className="sm:max-w-md" showClose={true}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
            Yedek alındı
          </DialogTitle>
          <DialogDescription>
            Her ihtimale karşı silinmeden önce tüm veri export edildi. Kolayca import edebilirsiniz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleSuccessClose}>
            Tamam
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
