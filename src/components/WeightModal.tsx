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
import { setWeight } from '@/store'

interface WeightModalProps {
  dateKey: string
  initialKg: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function WeightModal({
  dateKey,
  initialKg,
  open,
  onOpenChange,
}: WeightModalProps) {
  const [inputValue, setInputValue] = useState(initialKg > 0 ? String(initialKg) : '')

  useEffect(() => {
    if (open) {
      setInputValue(initialKg > 0 ? String(initialKg) : '')
    }
  }, [open, dateKey, initialKg])

  const parsed = inputValue.trim() === '' ? 0 : parseFloat(inputValue.replace(',', '.'))
  const isValid = inputValue.trim() !== '' && Number.isFinite(parsed) && parsed >= 20 && parsed <= 300

  const handleSave = () => {
    if (!isValid) return
    setWeight(dateKey, parsed)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kilo ölçümü — {formatDateLabel(dateKey)}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="weight-kg">Tartı değeri (kg)</Label>
            <Input
              id="weight-kg"
              type="number"
              min={20}
              max={300}
              step={0.1}
              placeholder="Örn: 72,5"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">20–300 kg arası girebilirsin.</p>
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
