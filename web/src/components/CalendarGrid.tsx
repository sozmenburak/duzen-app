import { useMemo, useRef, useCallback } from 'react'
import { getStore, setCell, getCell, removeGoal, isGoalVisibleOnDate, getColumnWidth, setColumnWidth } from '@/store'
import { getDaysInMonth, dateToKey } from '@/types'
import { Button } from '@/components/ui/button'
import { CommentButton } from '@/components/CommentButton'
import { EarningsButton } from '@/components/EarningsButton'
import { Check, X, Trash2, GripVertical, MessageSquare } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CellStatus } from '@/types'

const WEEKDAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

function Cell({
  dateKey,
  goalId,
  visible,
}: {
  dateKey: string
  goalId: string
  visible: boolean
}) {
  const status = getCell(dateKey, goalId)

  const cycle = () => {
    if (!visible) return
    const next: CellStatus = status === null ? 'done' : status === 'done' ? 'skip' : null
    setCell(dateKey, goalId, next)
  }

  if (!visible) {
    return (
      <div className="h-10 w-10 rounded border border-border/50 bg-muted/30 flex items-center justify-center text-muted-foreground/50 shrink-0 mx-auto" />
    )
  }

  return (
    <button
      type="button"
      onClick={cycle}
      className={cn(
        'h-10 w-10 rounded border flex items-center justify-center transition-colors shrink-0 mx-auto',
        status === 'done' && 'border-green-600 bg-green-600/20 text-green-400',
        status === 'skip' && 'border-destructive/60 bg-destructive/10 text-destructive',
        !status && 'border-border bg-card hover:bg-accent'
      )}
      title={status === 'done' ? 'Yapıldı' : status === 'skip' ? 'Yapılmadı' : 'Tıkla: yapıldı → yapılmadı → boş'}
    >
      {status === 'done' && <Check className="h-5 w-5" />}
      {status === 'skip' && <X className="h-5 w-5" />}
    </button>
  )
}

function cn(...args: (string | boolean | undefined)[]) {
  return args.filter(Boolean).join(' ')
}

export function CalendarGrid({
  year,
  month,
}: {
  year: number
  month: number
}) {
  const days = useMemo(() => getDaysInMonth(year, month), [year, month])
  const goals = getStore().goals
  const resizingRef = useRef<{ goalId: string; startX: number; startWidth: number } | null>(null)

  const handleResizeStart = useCallback((goalId: string, startX: number) => {
    resizingRef.current = { goalId, startX, startWidth: getColumnWidth(goalId) }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const r = resizingRef.current
    if (!r) return
    const delta = e.clientX - r.startX
    setColumnWidth(r.goalId, r.startWidth + delta)
  }, [])

  const handleMouseUp = useCallback(() => {
    resizingRef.current = null
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [handleMouseMove])

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent, goalId: string) => {
      e.preventDefault()
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      handleResizeStart(goalId, e.clientX)
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [handleResizeStart, handleMouseMove, handleMouseUp]
  )

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[max-content]">
        {/* Başlık: Tarih | Hedef1 | Hedef2 | ... */}
        <div className="flex border-b border-border sticky top-0 bg-card z-10">
          <div className="w-28 shrink-0 flex items-center py-2 pl-2 text-sm font-medium text-muted-foreground border-r border-border">
            Tarih
          </div>
          {goals.map((goal) => {
            const width = getColumnWidth(goal.id)
            return (
              <div
                key={goal.id}
                className="shrink-0 flex flex-col border-r border-border last:border-r-0 py-1 relative group"
                style={{ width: `${width}px` }}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="w-full py-1 px-2 text-xs font-medium text-foreground hover:bg-accent rounded text-center truncate h-8 flex items-center justify-center"
                      title={goal.title}
                    >
                      {goal.title}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => removeGoal(goal.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hedefi sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  type="button"
                  aria-label="Sütunu genişlet"
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-primary/20 transition-opacity"
                  onMouseDown={(e) => onResizeMouseDown(e, goal.id)}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            )
          })}
          <div className="w-14 shrink-0 flex items-center justify-center py-1 border-r border-border text-muted-foreground" title="Günlük yorum">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="w-20 shrink-0 flex items-center justify-center py-1 border-border text-muted-foreground text-lg font-semibold" title="Para kazanma">
            ₺
          </div>
        </div>
        {/* Her gün bir satır */}
        {days.map((d) => {
          const dateKey = dateToKey(d)
          const dayLabel = d.getDate()
          const weekDay = d.getDay()
          const weekDayLabel = WEEKDAY_LABELS[weekDay === 0 ? 6 : weekDay - 1]
          return (
            <div key={dateKey} className="flex border-b border-border last:border-b-0 items-center">
              <div className="w-28 shrink-0 py-1 pl-2 flex items-center gap-1 text-sm border-r border-border">
                <span className="text-muted-foreground text-xs">{weekDayLabel}</span>
                <span className="font-medium tabular-nums">{dayLabel}</span>
              </div>
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="shrink-0 flex justify-center py-1 border-r border-border"
                  style={{ width: `${getColumnWidth(goal.id)}px` }}
                >
                  <Cell
                    dateKey={dateKey}
                    goalId={goal.id}
                    visible={isGoalVisibleOnDate(goal, dateKey)}
                  />
                </div>
              ))}
              <div className="w-14 shrink-0 flex justify-center items-center py-1 border-r border-border">
                <CommentButton dateKey={dateKey} />
              </div>
              <div className="w-20 shrink-0 flex justify-center items-center py-1 border-border">
                <EarningsButton dateKey={dateKey} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

export function MonthNav({
  year,
  month,
  onPrev,
  onNext,
}: {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <Button variant="outline" size="icon" onClick={onPrev} aria-label="Önceki ay">
        ‹
      </Button>
      <h2 className="text-xl font-semibold tabular-nums">
        {MONTHS[month]} {year}
      </h2>
      <Button variant="outline" size="icon" onClick={onNext} aria-label="Sonraki ay">
        ›
      </Button>
    </div>
  )
}
