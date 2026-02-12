import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { setEarnings } from '@/store'

interface EarningsModalProps {
  dateKey: string
  initialAmount: number
  initialNote: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function EarningsModal({
  dateKey,
  initialAmount,
  initialNote,
  open,
  onOpenChange,
}: EarningsModalProps) {
  const [inputValue, setInputValue] = useState(initialAmount > 0 ? String(initialAmount) : '')
  const [note, setNote] = useState(initialNote)

  useEffect(() => {
    if (open) {
      setInputValue(initialAmount > 0 ? String(initialAmount) : '')
      setNote(initialNote)
    }
  }, [open, initialAmount, initialNote])

  const parsed = inputValue.trim() === '' ? 0 : parseFloat(inputValue.replace(',', '.'))
  const isValid = inputValue.trim() === '' || (Number.isFinite(parsed) && parsed >= 0)

  const handleSave = () => {
    const amount = inputValue.trim() === '' ? 0 : parsed
    setEarnings(dateKey, amount, note)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Para kazanma — {formatDateLabel(dateKey)}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="earnings-amount">Kazandığın miktar (₺)</Label>
            <Input
              id="earnings-amount"
              type="number"
              min={0}
              step={0.01}
              placeholder="0"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="earnings-note">Nereden geldi? (yorum)</Label>
            <Textarea
              id="earnings-note"
              placeholder="Örn: Freelance proje, ek iş..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[80px] resize-y"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
