import { useStore, getCell, setCell, isGoalVisibleOnDate, getWaterIntake, setWaterIntake, getBottleState, cycleBottle, getComment, getEarnings, getEarningsNote } from '@/store'
import { dateToKey } from '@/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CommentButton } from '@/components/CommentButton'
import { EarningsModal } from '@/components/EarningsModal'
import { cn } from '@/lib/utils'
import { Check, X, Droplets, MessageSquare, Banknote, Target, Sparkles } from 'lucide-react'
import type { CellStatus } from '@/types'
import { useState } from 'react'

const todayKey = dateToKey(new Date())
const BOTTLE_COUNT = 4

function getMotivation(percent: number): { text: string; sub?: string } {
  if (percent >= 100) return { text: 'Tebrikler! Günü tamamladın.', sub: 'Harika iş çıkardın.' }
  if (percent >= 75) return { text: 'Neredeyse bitti!', sub: 'Son birkaç hedef kaldı.' }
  if (percent >= 50) return { text: 'İyi gidiyorsun!', sub: 'Devam et.' }
  if (percent >= 25) return { text: 'Erteleme, devam et.', sub: 'Hedefini tamamla.' }
  if (percent > 0) return { text: 'Başladın, sürdür.', sub: 'Hedefini tamamla.' }
  return { text: 'Hedefini tamamla!', sub: 'Bugünün seçimlerini yap.' }
}

function LargeBottleIcon({ state, title }: { state: 0 | 0.5 | 1; title: string }) {
  const full = state === 1
  const half = state === 0.5
  return (
    <svg viewBox="0 0 20 28" className="h-12 w-10 shrink-0" aria-hidden>
      <title>{title}</title>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 2h2v3H5c-.6 0-1 .4-1 1v18c0 1.2 1 2 2 2h6c1 0 2-.8 2-2V6c0-.6-.4-1-1-1H9V2h2"
      />
      {(half || full) && (
        <rect
          x="6.8"
          y={full ? 7 : 16}
          width="6.4"
          height={full ? 18 : 9}
          rx="0.8"
          fill="currentColor"
          fillOpacity="0.35"
        />
      )}
    </svg>
  )
}

function TodayWaterSection() {
  useStore()
  const total = getWaterIntake(todayKey)

  const handleBottleClick = (index: number) => {
    const newTotal = cycleBottle(total, index)
    setWaterIntake(todayKey, newTotal)
  }

  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent dark:from-primary/10">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          <span className="font-semibold">Su tüketimi</span>
          <span className="text-sm text-muted-foreground tabular-nums">({total} L)</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-end justify-center gap-3 py-4">
          {Array.from({ length: BOTTLE_COUNT }, (_, i) => {
            const state = getBottleState(total, i)
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleBottleClick(i)}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-xl transition-all touch-manipulation',
                  state === 0 && 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  (state === 0.5 || state === 1) && 'text-primary'
                )}
                title={`Şişe ${i + 1}: ${state === 0 ? 'Boş' : state === 0.5 ? 'Yarım' : 'Dolu'} — tıkla`}
              >
                <LargeBottleIcon
                  state={state}
                  title={state === 0 ? 'Boş' : state === 0.5 ? 'Yarım (0,5 L)' : 'Dolu (1 L)'}
                />
                <span className="text-[10px] font-medium text-muted-foreground">
                  {i + 1}. şişe
                </span>
              </button>
            )
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground">Her şişe 1 L — tıklayarak işaretle</p>
      </CardContent>
    </Card>
  )
}

function TodayGoalCard({
  goalId,
  title,
  dateKey,
}: {
  goalId: string
  title: string
  dateKey: string
}) {
  const status = getCell(dateKey, goalId)

  const cycle = () => {
    const next: CellStatus = status === null ? 'done' : status === 'done' ? 'skip' : null
    setCell(dateKey, goalId, next)
  }

  return (
    <button
      type="button"
      onClick={cycle}
      className={cn(
        'w-full rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]',
        status === 'done' &&
          'border-green-500/60 bg-green-500/15 dark:bg-green-500/20 text-green-700 dark:text-green-300',
        status === 'skip' &&
          'border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
        !status && 'border-border bg-card hover:bg-accent'
      )}
      title={status === 'done' ? 'Yapıldı' : status === 'skip' ? 'Yapılmadı' : 'Tıkla: yapıldı → yapılmadı → boş'}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 transition-colors',
            status === 'done' && 'border-green-500/60 bg-green-500/20',
            status === 'skip' && 'border-amber-500/40 bg-amber-500/15',
            !status && 'border-border bg-muted/50'
          )}
        >
          {status === 'done' && <Check className="h-8 w-8 text-green-600 dark:text-green-400" />}
          {status === 'skip' && <X className="h-8 w-8 text-amber-600 dark:text-amber-400" />}
          {!status && <span className="text-lg text-muted-foreground">?</span>}
        </div>
        <span
          className={cn(
            'flex-1 font-medium',
            status === 'done' && 'line-through text-muted-foreground',
            status === 'skip' && 'text-muted-foreground'
          )}
        >
          {title}
        </span>
      </div>
    </button>
  )
}

export function TodayTab() {
  const store = useStore()
  const [earningsOpen, setEarningsOpen] = useState(false)

  const goals = store.goals.filter((g) => isGoalVisibleOnDate(g, todayKey))
  const doneCount = goals.filter((g) => getCell(todayKey, g.id) === 'done').length
  const skipCount = goals.filter((g) => getCell(todayKey, g.id) === 'skip').length
  const remainingCount = goals.filter((g) => getCell(todayKey, g.id) === null).length
  const total = goals.length
  const successPercent = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const motivation = getMotivation(successPercent)

  const hasComment = Boolean(getComment(todayKey).trim())
  const earningsAmount = getEarnings(todayKey)
  const earningsNote = getEarningsNote(todayKey)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-6 items-start">
      {/* Sol: Su, Para, Yorum */}
      <div className="space-y-4 order-2 lg:order-1">
        <div>
          <TodayWaterSection />
        </div>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" />
                <span className="font-semibold">Para</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEarningsOpen(true)}
                className="text-xs"
              >
                {earningsAmount > 0 ? 'Düzenle' : 'Ekle'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {earningsAmount > 0 ? (
              <div>
                <p className="text-xl font-bold text-primary tabular-nums">{earningsAmount} ₺</p>
                {earningsNote && (
                  <p className="text-sm text-muted-foreground mt-1 truncate" title={earningsNote}>
                    {earningsNote}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Bugün için kazanç ekle</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className={cn('h-5 w-5', hasComment && 'text-primary')} />
                <span className="font-semibold">Yorum</span>
              </div>
              <CommentButton dateKey={todayKey} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {hasComment ? (
              <p className="text-sm text-muted-foreground line-clamp-3">{getComment(todayKey)}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Bu gün için not ekle</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sağ: Başarı özeti + Hedefler (daha geniş) */}
      <div className="space-y-6 order-1 lg:order-2 min-w-0">
        <Card className="border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent dark:from-primary/10">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/20">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-primary">{successPercent}%</p>
                  <p className="text-sm text-muted-foreground">Günlük başarı</p>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {motivation.text}
                </p>
                {motivation.sub && (
                  <p className="text-sm text-muted-foreground mt-0.5">{motivation.sub}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-300">
                <Check className="h-4 w-4" />
                Tamamlanan: {doneCount}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                Kalan: {remainingCount}
              </span>
              {skipCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-300">
                  <X className="h-4 w-4" />
                  Yapılmadı: {skipCount}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-3">Bugünün hedefleri</h2>
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Bu gün için görünen hedef yok.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {goals.map((goal) => (
                <TodayGoalCard
                  key={goal.id}
                  goalId={goal.id}
                  title={goal.title}
                  dateKey={todayKey}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <EarningsModal
        dateKey={todayKey}
        initialAmount={earningsAmount}
        initialNote={earningsNote}
        open={earningsOpen}
        onOpenChange={setEarningsOpen}
      />
    </div>
  )
}
