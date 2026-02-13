import { useStore, getWaterIntake, setWaterIntake, getBottleState, cycleBottle } from '@/store'
import { dateToKey } from '@/types'

const BOTTLE_COUNT = 4

function isToday(dateKey: string): boolean {
  return dateKey === dateToKey(new Date())
}

function isYesterday(dateKey: string): boolean {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dateKey === dateToKey(d)
}

function BottleIcon({ state, title }: { state: 0 | 0.5 | 1; title: string }) {
  const half = state === 0.5
  const full = state === 1
  return (
    <svg
      viewBox="0 0 20 28"
      className="h-6 w-5 shrink-0"
      aria-hidden
    >
      <title>{title}</title>
      {/* Şişe dış çizgisi */}
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 2h2v3H5c-.6 0-1 .4-1 1v18c0 1.2 1 2 2 2h6c1 0 2-.8 2-2V6c0-.6-.4-1-1-1H9V2h2"
      />
      {/* Su: gövde içi (y=7'den aşağı, yükseklik 18) */}
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

function cn(...args: (string | boolean | undefined)[]) {
  return args.filter(Boolean).join(' ')
}

interface WaterBottlesButtonProps {
  dateKey: string
}

export function WaterBottlesButton({ dateKey }: WaterBottlesButtonProps) {
  useStore()
  const total = getWaterIntake(dateKey)
  const hasWater = total > 0
  const canEdit = isToday(dateKey) || isYesterday(dateKey)

  const handleBottleClick = (index: number) => {
    if (!canEdit) return
    const newTotal = cycleBottle(total, index)
    setWaterIntake(dateKey, newTotal)
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-0.5 h-10 px-1 rounded border shrink-0 transition-colors',
        hasWater
          ? 'border-primary/50 bg-primary/10'
          : 'border-border bg-card',
        canEdit && !hasWater && 'hover:bg-accent',
        !canEdit && 'opacity-90 cursor-default'
      )}
      title={
        canEdit
          ? hasWater
            ? `Su: ${total} L — Şişelere tıklayarak düzenle`
            : 'Su tüketimi (her şişe 1 L) — bugün ve dün giriş yapılabilir'
          : hasWater
            ? `Su: ${total} L (geçmiş gün — düzenlenemez)`
            : 'Geçmiş gün — su girişi yapılamaz'
      }
      role="group"
    >
      {Array.from({ length: BOTTLE_COUNT }, (_, i) => {
        const state = getBottleState(total, i)
        return canEdit ? (
          <button
            key={i}
            type="button"
            onClick={() => handleBottleClick(i)}
            className={cn(
              'p-0.5 rounded transition-colors touch-manipulation',
              state === 0 && 'text-muted-foreground hover:text-foreground',
              (state === 0.5 || state === 1) && 'text-primary'
            )}
            title={`Şişe ${i + 1}: ${state === 0 ? 'Boş' : state === 0.5 ? 'Yarım' : 'Dolu'} — tıkla`}
            aria-label={`Şişe ${i + 1}, ${state === 0 ? 'boş' : state === 0.5 ? 'yarım dolu' : 'dolu'}`}
          >
            <BottleIcon
              state={state}
              title={state === 0 ? 'Boş' : state === 0.5 ? 'Yarım (0,5 L)' : 'Dolu (1 L)'}
            />
          </button>
        ) : (
          <span
            key={i}
            className={cn(
              'inline-flex p-0.5 rounded',
              state === 0 && 'text-muted-foreground',
              (state === 0.5 || state === 1) && 'text-primary'
            )}
            aria-hidden
          >
            <BottleIcon
              state={state}
              title={state === 0 ? 'Boş' : state === 0.5 ? 'Yarım (0,5 L)' : 'Dolu (1 L)'}
            />
          </span>
        )
      })}
    </div>
  )
}
