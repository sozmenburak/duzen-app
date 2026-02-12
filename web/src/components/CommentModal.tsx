import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { setComment } from '@/store'

interface CommentModalProps {
  dateKey: string
  initialText: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function CommentModal({
  dateKey,
  initialText,
  open,
  onOpenChange,
}: CommentModalProps) {
  const [text, setText] = useState(initialText)

  useEffect(() => {
    if (open) setText(initialText)
  }, [open, initialText])

  const handleSave = () => {
    setComment(dateKey, text)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Günlük yorum — {formatDateLabel(dateKey)}</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Bu gün hakkında not ekle..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[120px] resize-y"
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSave}>
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
