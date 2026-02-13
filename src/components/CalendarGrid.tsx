import { useMemo, useRef, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore, setCell, getCell, removeGoal, isGoalVisibleOnDate, getColumnWidth, setColumnWidth, reorderGoals } from '@/store'
import { getDaysInMonth, dateToKey } from '@/types'
import { Button } from '@/components/ui/button'
import { CommentButton } from '@/components/CommentButton'
import { EarningsButton } from '@/components/EarningsButton'
import { WaterBottlesButton } from '@/components/WaterBottlesButton'
import { WeightButton } from '@/components/WeightButton'
import { Icon } from '@iconify/react'
import { Check, X, Trash2, GripVertical, MessageSquare, Droplets } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CellStatus, Goal } from '@/types'

const WEEKDAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

function Cell({
  dateKey,
  goalId,
  visible,
  isTodayRow,
}: {
  dateKey: string
  goalId: string
  visible: boolean
  isTodayRow?: boolean
}) {
  const status = getCell(dateKey, goalId)

  const cycle = () => {
    if (!visible) return
    const next: CellStatus = status === null ? 'done' : status === 'done' ? 'skip' : null
    setCell(dateKey, goalId, next)
  }

  if (!visible) {
    return (
      <div
        className={cn(
          'h-10 w-10 rounded border flex items-center justify-center shrink-0 mx-auto',
          isTodayRow
            ? 'border-white/40 bg-white/10 text-white/50'
            : 'border-border/50 bg-muted/30 text-muted-foreground/50'
        )}
      />
    )
  }

  const doneStyles = status === 'done' && (
    isTodayRow
      ? 'border-white/60 bg-white/20 text-white'
      : 'border-green-600 bg-green-600/20 text-green-400'
  )
  const skipStyles = status === 'skip' && (
    isTodayRow
      ? 'border-white/60 bg-white/15 text-white'
      : 'border-destructive/60 bg-destructive/10 text-destructive'
  )
  const emptyStyles = !status && (
    isTodayRow
      ? 'border-white/50 bg-white/10 hover:bg-white/20 text-white'
      : 'border-border bg-card hover:bg-accent'
  )

  return (
    <button
      type="button"
      onClick={cycle}
      className={cn(
        'h-10 w-10 rounded border flex items-center justify-center transition-colors shrink-0 mx-auto',
        doneStyles,
        skipStyles,
        emptyStyles
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

function SortableGoalHeader({
  goal,
  onResizeMouseDown,
}: {
  goal: Goal
  onResizeMouseDown: (e: React.MouseEvent, goalId: string) => void
}) {
  const width = getColumnWidth(goal.id)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id })

  const style = {
    width: `${width}px`,
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'shrink-0 flex flex-col border-r border-border last:border-r-0 py-1 relative group',
        isDragging && 'opacity-50 z-20'
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="w-full py-1 px-2 text-xs font-medium text-foreground hover:bg-accent rounded text-center truncate h-8 flex items-center justify-center gap-0.5"
            title={goal.title}
          >
            <span
              className="touch-none cursor-grab active:cursor-grabbing flex items-center shrink-0 text-muted-foreground hover:text-foreground"
              title="Sıralamak için sürükle"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </span>
            <span className="truncate flex-1 min-w-0">{goal.title}</span>
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
}

export function CalendarGrid({
  year,
  month,
}: {
  year: number
  month: number
}) {
  const store = useStore()
  const goals = store.goals
  const days = useMemo(() => getDaysInMonth(year, month), [year, month])
  const resizingRef = useRef<{ goalId: string; startX: number; startWidth: number } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = goals.map((g) => g.id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    const newOrder = arrayMove(ids, oldIndex, newIndex)
    reorderGoals(newOrder)
  }, [goals])

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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={goals.map((g) => g.id)} strategy={horizontalListSortingStrategy}>
              {goals.map((goal) => (
                <SortableGoalHeader key={goal.id} goal={goal} onResizeMouseDown={onResizeMouseDown} />
              ))}
            </SortableContext>
          </DndContext>
          <div className="w-14 shrink-0 flex items-center justify-center py-1 border-r border-border text-muted-foreground" title="Günlük yorum">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="w-20 shrink-0 flex items-center justify-center py-1 border-r border-border text-muted-foreground text-lg font-semibold" title="Para kazanma">
            ₺
          </div>
          <div className="w-28 shrink-0 flex items-center justify-center py-1 border-r border-border text-muted-foreground" title="Su tüketimi (her şişe 1 L)">
            <Droplets className="h-4 w-4" />
          </div>
          <div className="w-20 shrink-0 flex items-center justify-center py-1 border-border text-muted-foreground" title="Kilo ölçümü (kg)">
            <Icon icon="healthicons:overweight-outline" className="h-4 w-4" />
          </div>
        </div>
        {/* Her gün bir satır */}
        {days.map((d) => {
          const dateKey = dateToKey(d)
          const dayLabel = d.getDate()
          const weekDay = d.getDay()
          const weekDayLabel = WEEKDAY_LABELS[weekDay === 0 ? 6 : weekDay - 1]
          const today = new Date()
          const isToday =
            d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear()
          return (
            <div
              key={dateKey}
              className={cn(
                'flex border-b border-border last:border-b-0 items-center',
                isToday && 'bg-primary border-l-2 border-l-primary -ml-0.5 pl-0.5 text-white'
              )}
            >
              <div className={cn('w-28 shrink-0 py-1 pl-2 flex items-center gap-1 text-sm border-r', isToday ? 'border-white/40' : 'border-border')}>
                <span className={isToday ? 'text-white/80 text-xs' : 'text-muted-foreground text-xs'}>{weekDayLabel}</span>
                <span className={cn('font-medium tabular-nums', isToday && 'text-white font-semibold')}>
                  {dayLabel}
                </span>
                {isToday && (
                  <span className="text-[10px] font-medium text-white bg-white/20 px-1.5 py-0.5 rounded">
                    Bugün
                  </span>
                )}
              </div>
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className={cn('shrink-0 flex justify-center py-1 border-r', isToday ? 'border-white/40' : 'border-border')}
                  style={{ width: `${getColumnWidth(goal.id)}px` }}
                >
                  <Cell
                    dateKey={dateKey}
                    goalId={goal.id}
                    visible={isGoalVisibleOnDate(goal, dateKey)}
                    isTodayRow={isToday}
                  />
                </div>
              ))}
              <div className={cn('w-14 shrink-0 flex justify-center items-center py-1 border-r', isToday ? 'border-white/40' : 'border-border')}>
                <CommentButton dateKey={dateKey} isTodayRow={isToday} />
              </div>
              <div className={cn('w-20 shrink-0 flex justify-center items-center py-1 border-r', isToday ? 'border-white/40' : 'border-border')}>
                <EarningsButton dateKey={dateKey} isTodayRow={isToday} />
              </div>
              <div className={cn('w-28 shrink-0 flex justify-center items-center py-1 border-r', isToday ? 'border-white/40' : 'border-border')}>
                <WaterBottlesButton dateKey={dateKey} isTodayRow={isToday} />
              </div>
              <div className={cn('w-20 shrink-0 flex justify-center items-center py-1', isToday ? 'border-white/40' : 'border-border')}>
                <WeightButton dateKey={dateKey} isTodayRow={isToday} />
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
