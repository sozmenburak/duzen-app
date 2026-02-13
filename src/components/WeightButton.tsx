import { useState } from 'react'
import { getWeight } from '@/store'
import { WeightModal } from '@/components/WeightModal'
import { Icon } from '@iconify/react'
import { dateToKey } from '@/types'
import { cn } from '@/lib/utils'

interface WeightButtonProps {
  dateKey: string
  isTodayRow?: boolean
}

function isToday(dateKey: string): boolean {
  return dateKey === dateToKey(new Date())
}

function isYesterday(dateKey: string): boolean {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dateKey === dateToKey(d)
}

export function WeightButton({ dateKey, isTodayRow }: WeightButtonProps) {
  const [open, setOpen] = useState(false)
  const kg = getWeight(dateKey)
  const hasWeight = kg > 0
  const canEdit = isToday(dateKey) || isYesterday(dateKey)

  const displayValue = hasWeight ? (kg % 1 === 0 ? String(kg) : kg.toFixed(1).replace('.', ',')) : null

  return (
    <>
      <button
        type="button"
        onClick={() => canEdit && setOpen(true)}
        className={cn(
          'h-10 min-w-10 px-2 rounded border flex items-center justify-center gap-1 transition-colors shrink-0 text-xs font-medium',
          isTodayRow
            ? 'border-white/50 bg-white/15 text-white hover:bg-white/25'
            : hasWeight
              ? 'border-primary/50 bg-primary/15 text-primary'
              : 'border-border bg-card text-muted-foreground',
          canEdit && 'cursor-pointer',
          !isTodayRow && canEdit && 'hover:bg-accent hover:text-foreground',
          !canEdit && 'cursor-default opacity-90'
        )}
        title={
          canEdit
            ? hasWeight
              ? `${kg} kg — Düzenle`
              : 'Kilo ölçümü ekle (tartı değeri)'
            : hasWeight
              ? `${kg} kg (geçmiş gün)`
              : 'Geçmiş gün — kilo girişi yapılamaz'
        }
        aria-label={hasWeight ? 'Kilo değerini düzenle' : 'Kilo ölçümü ekle'}
      >
        <Icon icon="healthicons:overweight-outline" className={cn('h-4 w-4 shrink-0', isTodayRow && 'text-white')} />
        {displayValue != null && <span className={cn('tabular-nums', isTodayRow && 'text-white')}>{displayValue} kg</span>}
      </button>
      <WeightModal
        dateKey={dateKey}
        initialKg={kg}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
