import { useState, useMemo, useEffect } from 'react'
import { getStore, useStore, getWaterIntakeEntriesInRange } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContributionHeatmap } from '@/components/ContributionHeatmap'
import {
  getPeriodRange,
  getPreviousPeriodRange,
  getPeriodStats,
  getAutoInterpretation,
  type PeriodStats,
} from '@/lib/summary'
import { Droplets, TrendingUp, TrendingDown, Minus } from 'lucide-react'

type PeriodKey = '1w' | '1m' | '3m' | '6m' | '1y'

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: '1w', label: '1 hafta' },
  { value: '1m', label: '1 ay' },
  { value: '3m', label: '3 ay' },
  { value: '6m', label: '6 ay' },
  { value: '1y', label: '1 yıl' },
]

function StatCard({
  label,
  stats,
  interpretation,
}: {
  label: string
  stats: PeriodStats
  interpretation: string
}) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-bold tabular-nums">
          {stats.done}
          <span className="text-muted-foreground font-normal text-base"> / {stats.applicableDays} gün</span>
        </p>
        <p className="text-sm text-muted-foreground mt-1">%{stats.percent} sadakat</p>
        <p className="text-sm mt-2 text-foreground/90">{interpretation}</p>
      </CardContent>
    </Card>
  )
}

function formatDateShort(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatLitres(litres: number): string {
  return litres % 1 === 0 ? `${litres} L` : `${litres.toFixed(1).replace('.', ',')} L`
}

type WaterPeriodKey = '1w' | '1m'

const WATER_PERIOD_OPTIONS: { value: WaterPeriodKey; label: string }[] = [
  { value: '1w', label: 'Son 1 hafta' },
  { value: '1m', label: 'Son 1 ay' },
]

export function SummaryTab() {
  useStore()
  const store = getStore()
  const goals = store.goals
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id ?? '')
  useEffect(() => {
    if (goals.length && !goals.some((g) => g.id === selectedGoalId)) {
      setSelectedGoalId(goals[0].id)
    }
  }, [goals, selectedGoalId])
  const selectedGoal = useMemo(
    () => goals.find((g) => g.id === selectedGoalId) ?? goals[0],
    [goals, selectedGoalId]
  )

  const periodStats = useMemo(() => {
    if (!selectedGoal) return null
    const r1w = getPeriodRange('1w')
    const r1m = getPeriodRange('1m')
    const r3m = getPeriodRange('3m')
    const r6m = getPeriodRange('6m')
    const r1y = getPeriodRange('1y')
    const result: Record<PeriodKey, { current: PeriodStats; previous: PeriodStats | null }> = {
      '1w': { current: getPeriodStats(selectedGoal, r1w.start, r1w.end), previous: null },
      '1m': { current: getPeriodStats(selectedGoal, r1m.start, r1m.end), previous: null },
      '3m': { current: getPeriodStats(selectedGoal, r3m.start, r3m.end), previous: null },
      '6m': { current: getPeriodStats(selectedGoal, r6m.start, r6m.end), previous: null },
      '1y': { current: getPeriodStats(selectedGoal, r1y.start, r1y.end), previous: null },
    }
    for (const key of PERIOD_OPTIONS.map((o) => o.value)) {
      const prev = getPreviousPeriodRange(key)
      result[key].previous = getPeriodStats(selectedGoal, prev.start, prev.end)
    }
    return result
  }, [selectedGoal])

  const interpretations = useMemo(() => {
    if (!selectedGoal || !periodStats) return {} as Record<PeriodKey, string>
    const out: Record<PeriodKey, string> = {} as Record<PeriodKey, string>
    for (const key of PERIOD_OPTIONS.map((o) => o.value)) {
      out[key] = getAutoInterpretation(
        selectedGoal.title,
        periodStats[key].current,
        periodStats[key].previous,
        key
      )
    }
    return out
  }, [selectedGoal, periodStats])

  const totalLastYear = periodStats?.['1y']?.current.done ?? 0

  const [waterPeriod, setWaterPeriod] = useState<WaterPeriodKey>('1m')

  // Dönem her render'da güncel hesaplansın (bugün dahil); böylece az önce girilen su da görünür
  const waterRange = getPeriodRange(waterPeriod)
  const waterPrevRange = getPreviousPeriodRange(waterPeriod)

  const waterEntries = useMemo(
    () => getWaterIntakeEntriesInRange(waterRange.start, waterRange.end),
    [waterRange.start, waterRange.end, store]
  )
  const waterPrevEntries = useMemo(
    () => getWaterIntakeEntriesInRange(waterPrevRange.start, waterPrevRange.end),
    [waterPrevRange.start, waterPrevRange.end, store]
  )

  const waterTotalLitres = useMemo(() => waterEntries.reduce((s, e) => s + e.litres, 0), [waterEntries])
  const waterPrevTotalLitres = useMemo(() => waterPrevEntries.reduce((s, e) => s + e.litres, 0), [waterPrevEntries])

  const daysWithWaterCount = waterEntries.length
  const avgLitresPerDay =
    daysWithWaterCount > 0 ? waterTotalLitres / daysWithWaterCount : 0
  const periodLabel = waterPeriod === '1w' ? 'hafta' : 'ay'
  const waterComparisonText =
    waterPrevEntries.length === 0 && waterEntries.length === 0
      ? 'Henüz su kaydı yok.'
      : waterPrevEntries.length === 0
        ? `Bu ${periodLabel} toplam ${formatLitres(waterTotalLitres)} (${daysWithWaterCount} gün).`
        : (() => {
            const diff = waterTotalLitres - waterPrevTotalLitres
            const prevLabel = waterPeriod === '1w' ? 'Önceki hafta' : 'Önceki ay'
            if (diff > 0)
              return `Bu ${periodLabel} ${formatLitres(waterTotalLitres)} — ${prevLabel} ${formatLitres(waterPrevTotalLitres)}. Artış var, güzel!`
            if (diff < 0)
              return `Bu ${periodLabel} ${formatLitres(waterTotalLitres)} — ${prevLabel} ${formatLitres(waterPrevTotalLitres)}. Biraz daha su içmeyi hedefle.`
            return `Bu ${periodLabel} ${formatLitres(waterTotalLitres)} — ${prevLabel} ile aynı.`
          })()

  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Henüz hedef yok. Takvim sekmesinden &quot;Yeni hedef&quot; ile ekle, özet burada görünsün.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Özet</h2>
          <p className="text-sm text-muted-foreground">
            Son 1 yılda <strong className="text-foreground">{totalLastYear}</strong> gün tamamlandı
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Hedef:</span>
          <select
            value={selectedGoalId}
            onChange={(e) => setSelectedGoalId(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedGoal && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Katılım grafiği — {selectedGoal.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ContributionHeatmap goal={selectedGoal} daysBack={364} />
            </CardContent>
          </Card>

          <div>
            <h3 className="text-sm font-medium mb-3">Dönemlere göre sadakat</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PERIOD_OPTIONS.map(({ value, label }) => (
                <StatCard
                  key={value}
                  label={label}
                  stats={periodStats![value].current}
                  interpretation={interpretations[value]}
                />
              ))}
            </div>
          </div>

          <Card>
            <CardHeader className="py-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Su tüketimi
                </CardTitle>
                <select
                  value={waterPeriod}
                  onChange={(e) => setWaterPeriod(e.target.value as WaterPeriodKey)}
                  className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {WATER_PERIOD_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <p className="text-muted-foreground">
                  Toplam <strong className="text-foreground">{formatLitres(waterTotalLitres)}</strong>
                  {daysWithWaterCount > 0 && (
                    <> — <strong className="text-foreground">{daysWithWaterCount}</strong> gün su içildi</>
                  )}
                </p>
                {daysWithWaterCount > 0 && (
                  <p className="text-muted-foreground">
                    Günlük ortalama <strong className="text-foreground">{formatLitres(avgLitresPerDay)}</strong>
                  </p>
                )}
              </div>

              <p className="text-sm text-foreground/90 flex items-center gap-2">
                {waterComparisonText.includes('Artış') && <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />}
                {waterComparisonText.includes('Biraz daha') && <TrendingDown className="h-4 w-4 text-amber-500 shrink-0" />}
                {waterComparisonText.includes('aynı') && <Minus className="h-4 w-4 text-muted-foreground shrink-0" />}
                {waterComparisonText}
              </p>

              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Su içilen günler (sadece girilen veriler)</h4>
                {waterEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Bu dönemde henüz su kaydı yok. Takvimden bugün ve dün için su girişi yapabilirsin.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                    {waterEntries.map(({ dateKey, litres }) => (
                      <li key={dateKey} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{formatDateShort(dateKey)}</span>
                        <span className="font-medium tabular-nums text-primary">{formatLitres(litres)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
