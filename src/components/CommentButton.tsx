import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { getComment } from '@/store'
import { CommentModal } from '@/components/CommentModal'

interface CommentButtonProps {
  dateKey: string
}

export function CommentButton({ dateKey }: CommentButtonProps) {
  const [open, setOpen] = useState(false)
  const hasComment = Boolean(getComment(dateKey).trim())

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'h-10 w-10 rounded border flex items-center justify-center transition-colors shrink-0',
          hasComment
            ? 'border-primary/50 bg-primary/15 text-primary'
            : 'border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground'
        )}
        title={hasComment ? 'Yorumu görüntüle / düzenle' : 'Yorum ekle'}
        aria-label={hasComment ? 'Yorumu görüntüle' : 'Yorum ekle'}
      >
        <MessageSquare className={cn('h-5 w-5', hasComment && 'fill-current')} />
      </button>
      <CommentModal
        dateKey={dateKey}
        initialText={getComment(dateKey)}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}

function cn(...args: (string | boolean | undefined)[]) {
  return args.filter(Boolean).join(' ')
}
