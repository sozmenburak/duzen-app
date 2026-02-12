import { dateToKey } from '@/types'
import type { Goal } from '@/types'
import { getCell, isGoalVisibleOnDate, getEarnings } from '@/store'

export type HeatmapCellStatus = 'none' | 'skip' | 'done'

export interface PeriodStats {
  done: number
  skip: number
  total: number // done + skip (gün sayısı, hedef o gün geçerliyse)
  applicableDays: number // hedefin geçerli olduğu gün sayısı
  percent: number // done / applicableDays * 100
}

/** Belirli bir tarih aralığında hedef için istatistik */
export function getPeriodStats(
  goal: Goal,
  startDateKey: string,
  endDateKey: string
): PeriodStats {
  let done = 0
  let skip = 0
  let applicableDays = 0
  const start = new Date(startDateKey)
  const end = new Date(endDateKey)
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = dateToKey(d)
    if (!isGoalVisibleOnDate(goal, key)) continue
    applicableDays++
    const status = getCell(key, goal.id)
    if (status === 'done') done++
    else if (status === 'skip') skip++
  }
  const total = done + skip
  const percent = applicableDays > 0 ? Math.round((done / applicableDays) * 100) : 0
  return { done, skip, total, applicableDays, percent }
}

/** Son N gün için heatmap hücrelerini haftalık grid için üretir (7 satır = Pzt-Paz, sütunlar = haftalar) */
export function getHeatmapGrid(goal: Goal, daysBack: number): HeatmapCellStatus[][] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const ref = new Date(today)
  ref.setDate(ref.getDate() - Math.min(daysBack, 364))
  const dayOfWeek = ref.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const gridStart = new Date(ref)
  gridStart.setDate(ref.getDate() + mondayOffset)

  const weeks = Math.ceil(daysBack / 7) + 1
  const grid: HeatmapCellStatus[][] = []
  for (let row = 0; row < 7; row++) {
    grid[row] = []
    for (let col = 0; col < weeks; col++) {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + col * 7 + row)
      const key = dateToKey(d)
      if (d > today) {
        grid[row][col] = 'none'
      } else if (!isGoalVisibleOnDate(goal, key)) {
        grid[row][col] = 'none'
      } else {
        const status = getCell(key, goal.id)
        grid[row][col] = status === 'done' ? 'done' : status === 'skip' ? 'skip' : 'none'
      }
    }
  }
  return grid
}

/** Dönem etiketleri (son 1 hafta, 1 ay, 3 ay, 6 ay, 1 yıl) için başlangıç/bitiş */
export function getPeriodRange(period: '1w' | '1m' | '3m' | '6m' | '1y'): { start: string; end: string; label: string } {
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  const start = new Date(end)
  if (period === '1w') {
    start.setDate(start.getDate() - 6)
    return { start: dateToKey(start), end: dateToKey(end), label: 'Son 1 hafta' }
  }
  if (period === '1m') {
    start.setMonth(start.getMonth() - 1)
    return { start: dateToKey(start), end: dateToKey(end), label: 'Son 1 ay' }
  }
  if (period === '3m') {
    start.setMonth(start.getMonth() - 3)
    return { start: dateToKey(start), end: dateToKey(end), label: 'Son 3 ay' }
  }
  if (period === '6m') {
    start.setMonth(start.getMonth() - 6)
    return { start: dateToKey(start), end: dateToKey(end), label: 'Son 6 ay' }
  }
  start.setFullYear(start.getFullYear() - 1)
  return { start: dateToKey(start), end: dateToKey(end), label: 'Son 1 yıl' }
}

/** Önceki dönem (karşılaştırma için) */
export function getPreviousPeriodRange(period: '1w' | '1m' | '3m' | '6m' | '1y'): { start: string; end: string } {
  const { start, end } = getPeriodRange(period)
  const startD = new Date(start)
  const endD = new Date(end)
  const days = Math.round((endD.getTime() - startD.getTime()) / (24 * 60 * 60 * 1000)) + 1
  const prevEnd = new Date(startD)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - days + 1)
  return { start: dateToKey(prevStart), end: dateToKey(prevEnd) }
}

/** Otomatik yorum üret: bu dönem vs önceki dönem */
export function getAutoInterpretation(
  _goalTitle: string,
  current: PeriodStats,
  previous: PeriodStats | null,
  period: '1w' | '1m' | '3m' | '6m' | '1y'
): string {
  const periodLabel = period === '1w' ? 'hafta' : period === '1m' ? 'ay' : period === '3m' ? '3 ay' : period === '6m' ? '6 ay' : 'yıl'
  if (current.applicableDays === 0) {
    return `Bu ${periodLabel} için henüz veri yok.`
  }
  const text = `${current.done}/${current.applicableDays} gün tamamlandı (%${current.percent}).`
  if (!previous || previous.applicableDays === 0) {
    return text
  }
  if (current.percent > previous.percent) {
    const diff = current.percent - previous.percent
    return `${text} Önceki ${periodLabel}da %${previous.percent} idi — harika, ${diff} puan ilerleme var!`
  }
  if (current.percent < previous.percent) {
    return `${text} Önceki ${periodLabel}da %${previous.percent} idi. Küçük bir gerileme; devam et!`
  }
  return `${text} Önceki ${periodLabel} ile aynı seviye — istikrarlı gidiyorsun.`
}

/** Tarih aralığında toplam kazanç (₺) */
export function getTotalEarnings(startDateKey: string, endDateKey: string): number {
  let total = 0
  const start = new Date(startDateKey)
  const end = new Date(endDateKey)
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    total += getEarnings(dateToKey(d))
  }
  return total
}

/** Tarih aralığındaki tüm günlerin dateKey listesi (start..end dahil) */
export function getDateKeysInRange(startDateKey: string, endDateKey: string): string[] {
  const keys: string[] = []
  const start = new Date(startDateKey)
  const end = new Date(endDateKey)
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    keys.push(dateToKey(d))
  }
  return keys
}
