import { useState, useMemo, useEffect } from 'react'
import { getStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContributionHeatmap } from '@/components/ContributionHeatmap'
import {
  getPeriodRange,
  getPreviousPeriodRange,
  getPeriodStats,
  getAutoInterpretation,
  type PeriodStats,
} from '@/lib/summary'

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

export function SummaryTab() {
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
        </>
      )}
    </div>
  )
}
