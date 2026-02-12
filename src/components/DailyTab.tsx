import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import {
  getDailyTasksForDate,
  addDailyTask,
  removeDailyTask,
  setDailyTaskStatus,
  postponeDailyTaskToTomorrow,
} from '@/store'
import { dateToKey } from '@/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  XCircle,
  Forward,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  ListTodo,
} from 'lucide-react'
import type { DailyTask as DailyTaskType } from '@/types'

const todayKey = dateToKey(new Date())
const DAYS_VIEW = 14
const DAYS_BACK = 30

function getViewBounds() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const minStart = new Date(today)
  minStart.setDate(minStart.getDate() - DAYS_BACK)
  const maxStart = new Date(today)
  maxStart.setDate(maxStart.getDate() + 1) // so last window day = today+14
  return { minStart, maxStart, today }
}

function formatDayHeader(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('tr-TR', { weekday: 'long' })
  const short = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  if (dateKey === todayKey) return `Bugün · ${weekday} ${short}`
  return `${weekday} ${short}`
}

function DayBoardCard({ dateKey }: { dateKey: string }) {
  useStore()
  const tasks = getDailyTasksForDate(dateKey)
  const [input, setInput] = useState('')
  const isToday = dateKey === todayKey

  const todo = tasks.filter((t) => t.status === null)
  const done = tasks.filter((t) => t.status === 'done')
  const skipped = tasks.filter((t) => t.status === 'skip')

  const handleAdd = () => {
    if (!input.trim()) return
    addDailyTask(dateKey, input)
    setInput('')
  }

  return (
    <Card
      className={cn(
        'flex flex-col h-full overflow-hidden transition-all',
        isToday && 'ring-2 ring-primary/50 shadow-md'
      )}
    >
      <CardHeader className="py-3 px-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-semibold truncate">{formatDayHeader(dateKey)}</span>
          {isToday && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary text-primary-foreground shrink-0">
              Bugün
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 flex flex-col flex-1 min-h-0">
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Yeni görev..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="h-8 text-sm flex-1 min-w-0"
          />
          <Button onClick={handleAdd} size="sm" className="h-8 w-8 p-0 shrink-0" title="Ekle">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3 flex-1 min-h-0 overflow-auto">
          {todo.length > 0 && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                Yapılacaklar ({todo.length})
              </p>
              <div className="space-y-1.5">
                {todo.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-green-600 dark:text-green-400 mb-1.5">
                Yapılanlar ({done.length})
              </p>
              <div className="space-y-1.5">
                {done.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
          {skipped.length > 0 && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                Yapılmadı ({skipped.length})
              </p>
              <div className="space-y-1.5">
                {skipped.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
          {tasks.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Bu gün için görev yok
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TaskCard({ task }: { task: DailyTaskType }) {
  const isDone = task.status === 'done'
  const isSkipped = task.status === 'skip'

  return (
    <div
      className={cn(
        'group rounded-lg border bg-card p-2 text-sm transition-colors',
        isDone && 'border-green-500/30 bg-green-500/5 dark:bg-green-500/10',
        isSkipped && 'border-border/50 bg-muted/30 opacity-80'
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            'flex-1 min-w-0 break-words pt-0.5',
            isDone && 'line-through text-muted-foreground',
            isSkipped && 'text-muted-foreground'
          )}
        >
          {task.title}
        </span>
        <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-500/20"
            onClick={() => setDailyTaskStatus(task.id, isDone ? null : 'done')}
            title="Yapıldı"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setDailyTaskStatus(task.id, isSkipped ? null : 'skip')}
            title="Yapılmadı"
          >
            <XCircle className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => postponeDailyTaskToTomorrow(task.id)}
            title="Yarına ertele"
          >
            <Forward className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => removeDailyTask(task.id)}
            title="Sil"
            aria-label="Sil"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function DailyTab() {
  const { minStart, maxStart, today } = useMemo(getViewBounds, [])

  const [viewStart, setViewStart] = useState(() => {
    const d = new Date(today)
    d.setDate(d.getDate() - 7) // default: 1 hafta geri + 1 hafta ileri
    if (d < minStart) return minStart
    if (d > maxStart) return maxStart
    return d
  })

  const dateKeys = useMemo(() => {
    const keys: string[] = []
    const start = new Date(viewStart)
    for (let i = 0; i < DAYS_VIEW; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      keys.push(dateToKey(d))
    }
    return keys
  }, [viewStart])

  const canPrev = viewStart > minStart
  const canNext = viewStart < maxStart

  const goPrev = () => {
    if (!canPrev) return
    const next = new Date(viewStart)
    next.setDate(next.getDate() - DAYS_VIEW)
    setViewStart(next < minStart ? minStart : next)
  }

  const goNext = () => {
    if (!canNext) return
    const next = new Date(viewStart)
    next.setDate(next.getDate() + DAYS_VIEW)
    setViewStart(next > maxStart ? maxStart : next)
  }

  const firstKey = dateKeys[0]
  const lastKey = dateKeys[dateKeys.length - 1]
  const rangeLabel =
    firstKey && lastKey
      ? `${new Date(firstKey + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} – ${new Date(lastKey + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : ''

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Günlük görevler</h2>
          <p className="text-sm text-muted-foreground">
            Kart görünümü — tüm günlere bakabilir, 1 ay geriye kadar görebilirsin. Yapılacaklar / yapılanlar / yapılmadı.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goPrev}
            disabled={!canPrev}
            className="shrink-0"
            title="Önceki 2 hafta"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Önceki</span>
          </Button>
          <span className="text-xs text-muted-foreground min-w-[140px] text-center tabular-nums">
            {rangeLabel}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goNext}
            disabled={!canNext}
            className="shrink-0"
            title="Sonraki 2 hafta"
          >
            <span className="hidden sm:inline mr-1">Sonraki</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {dateKeys.map((dateKey) => (
          <div key={dateKey} className="min-h-[280px]">
            <DayBoardCard dateKey={dateKey} />
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Önceki / Sonraki ile 2’şer hafta kaydırabilirsin. En fazla 1 ay geriye gidebilirsin.
      </p>
    </div>
  )
}
