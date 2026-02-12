import { useState } from 'react'
import { getEarnings, getEarningsNote } from '@/store'
import { EarningsModal } from '@/components/EarningsModal'

interface EarningsButtonProps {
  dateKey: string
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.', ',') + 'K'
  return n % 1 === 0 ? String(n) : n.toFixed(2).replace('.', ',')
}

export function EarningsButton({ dateKey }: EarningsButtonProps) {
  const [open, setOpen] = useState(false)
  const amount = getEarnings(dateKey)
  const hasAmount = amount > 0

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'h-10 min-w-10 px-2 rounded border flex items-center justify-center gap-1 transition-colors shrink-0 text-xs font-medium',
          hasAmount
            ? 'border-primary/50 bg-primary/15 text-primary'
            : 'border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground'
        )}
        title={hasAmount ? `${amount} ₺ — Düzenle` : 'Para kazanma ekle'}
        aria-label={hasAmount ? 'Kazancı düzenle' : 'Para kazanma ekle'}
      >
        <span className={cn('text-base font-semibold leading-none', hasAmount && 'text-primary')}>₺</span>
        {hasAmount && <span className="tabular-nums">{formatMoney(amount)}</span>}
      </button>
      <EarningsModal
        dateKey={dateKey}
        initialAmount={amount}
        initialNote={getEarningsNote(dateKey)}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}

function cn(...args: (string | boolean | undefined)[]) {
  return args.filter(Boolean).join(' ')
}
