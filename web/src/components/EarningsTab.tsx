import { useMemo, useState } from 'react'
import { getStore, getEarningsEntriesInRange, getEarningsEntry } from '@/store'
import { getPeriodRange } from '@/lib/summary'
import { dateToKey } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronDown, ChevronUp } from 'lucide-react'

type PeriodKey = 'all' | '1w' | '1m' | '3m' | '6m' | '1y' | '2y' | 'custom'

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'all', label: 'Tüm zamanlar' },
  { value: '1w', label: 'Son 1 hafta' },
  { value: '1m', label: 'Son 1 ay' },
  { value: '3m', label: 'Son 3 ay' },
  { value: '6m', label: 'Son 6 ay' },
  { value: '1y', label: 'Son 1 yıl' },
  { value: '2y', label: 'Son 2 yıl' },
  { value: 'custom', label: 'Özel seçim' },
]

function getEarningsRange(period: PeriodKey, customStart?: string, customEnd?: string): { start?: string; end?: string } {
  if (period === 'all') return {}
  if (period === 'custom' && customStart && customEnd) return { start: customStart, end: customEnd }
  if (period === '2y') {
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    const start = new Date(end)
    start.setFullYear(start.getFullYear() - 2)
    return { start: dateToKey(start), end: dateToKey(end) }
  }
  const r = getPeriodRange(period as '1w' | '1m' | '3m' | '6m' | '1y')
  return { start: r.start, end: r.end }
}

type ComparePeriodKey = 'this_year' | 'last_year' | '1y' | '2y' | 'custom'

const COMPARE_PERIOD_OPTIONS: { value: ComparePeriodKey; label: string }[] = [
  { value: 'this_year', label: 'Bu yıl' },
  { value: 'last_year', label: 'Geçen yıl' },
  { value: '1y', label: 'Son 1 yıl' },
  { value: '2y', label: 'Son 2 yıl' },
  { value: 'custom', label: 'Özel tarih' },
]

function getCompareRange(
  period: ComparePeriodKey,
  customStart?: string,
  customEnd?: string
): { start: string; end: string } | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (period === 'this_year') {
    const start = new Date(today.getFullYear(), 0, 1)
    return { start: dateToKey(start), end: dateToKey(today) }
  }
  if (period === 'last_year') {
    const y = today.getFullYear() - 1
    return { start: dateToKey(new Date(y, 0, 1)), end: dateToKey(new Date(y, 11, 31)) }
  }
  if (period === 'custom' && customStart && customEnd) {
    return { start: customStart, end: customEnd }
  }
  if (period === '1y') {
    const r = getPeriodRange('1y')
    return { start: r.start, end: r.end }
  }
  if (period === '2y') {
    const r = getEarningsRange('2y')
    return r.start && r.end ? { start: r.start, end: r.end } : null
  }
  return null
}

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

function formatDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatMoney(n: number): string {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const todayKey = dateToKey(new Date())

export function EarningsTab() {
  const store = getStore()
  const [period, setPeriod] = useState<PeriodKey>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState(todayKey)
  const [comparePeriodA, setComparePeriodA] = useState<ComparePeriodKey>('this_year')
  const [comparePeriodB, setComparePeriodB] = useState<ComparePeriodKey>('last_year')
  const [compareStartA, setCompareStartA] = useState('')
  const [compareEndA, setCompareEndA] = useState(todayKey)
  const [compareStartB, setCompareStartB] = useState('')
  const [compareEndB, setCompareEndB] = useState('')
  const [compareOpen, setCompareOpen] = useState(false)

  const { entries, total, startKey, endKey } = useMemo(() => {
    const range = getEarningsRange(period, customStart, customEnd)
    if (!range.start && !range.end) {
      const entries = getEarningsEntriesInRange()
      const total = entries.reduce((s, e) => s + e.amount, 0)
      return { entries, total, startKey: undefined as string | undefined, endKey: undefined as string | undefined }
    }
    const start = range.start ?? ''
    const end = range.end ?? todayKey
    const entries = getEarningsEntriesInRange(start, end)
    const total = entries.reduce((s, e) => s + e.amount, 0)
    return { entries, total, startKey: start, endKey: end }
  }, [store, period, customStart, customEnd])

  const monthsInRange = useMemo(() => {
    if (!startKey || !endKey) {
      const keys = Object.keys(store.earnings ?? {})
      if (keys.length === 0) return []
      keys.sort()
      const first = keys[0]
      const last = keys[keys.length - 1]
      const months: { year: number; month: number }[] = []
      const start = new Date(first)
      const end = new Date(last)
      for (const d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
        months.push({ year: d.getFullYear(), month: d.getMonth() })
      }
      return months
    }
    const start = new Date(startKey)
    const end = new Date(endKey)
    const months: { year: number; month: number }[] = []
    for (const d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
      months.push({ year: d.getFullYear(), month: d.getMonth() })
    }
    return months
  }, [startKey, endKey, store.earnings])

  const comparison = useMemo(() => {
    const rangeA = getCompareRange(comparePeriodA, compareStartA, compareEndA)
    const rangeB = getCompareRange(comparePeriodB, compareStartB, compareEndB)
    if (!rangeA || !rangeB) return null
    const entriesA = getEarningsEntriesInRange(rangeA.start, rangeA.end)
    const entriesB = getEarningsEntriesInRange(rangeB.start, rangeB.end)
    const totalA = entriesA.reduce((s, e) => s + e.amount, 0)
    const totalB = entriesB.reduce((s, e) => s + e.amount, 0)
    const diff = totalA - totalB
    const percent = totalB > 0 ? ((diff / totalB) * 100) : (totalA > 0 ? 100 : 0)
    const labelFor = (p: ComparePeriodKey, start: string, end: string) => {
      if (p === 'this_year') return 'Bu yıl'
      if (p === 'last_year') return 'Geçen yıl'
      if (p === '1y') return 'Son 1 yıl'
      if (p === '2y') return 'Son 2 yıl'
      return `${start} – ${end}`
    }
    return {
      totalA,
      totalB,
      diff,
      percent,
      labelA: labelFor(comparePeriodA, rangeA.start, rangeA.end),
      labelB: labelFor(comparePeriodB, rangeB.start, rangeB.end),
      rangeA: `${rangeA.start} – ${rangeA.end}`,
      rangeB: `${rangeB.start} – ${rangeB.end}`,
    }
  }, [store, comparePeriodA, comparePeriodB, compareStartA, compareEndA, compareStartB, compareEndB])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Para kazanma</h2>
          <p className="text-sm text-muted-foreground">
            Seçili dönemde toplam <strong className="text-foreground">{formatMoney(total)} ₺</strong>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodKey)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {PERIOD_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="earnings-start" className="text-xs text-muted-foreground">Başlangıç</Label>
            <Input
              id="earnings-start"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-9 w-auto"
            />
            <Label htmlFor="earnings-end" className="text-xs text-muted-foreground">Bitiş</Label>
            <Input
              id="earnings-end"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-9 w-auto"
            />
          </div>
        )}
        </div>
      </div>

      {/* Açılır-kapanır karşılaştırma */}
      <Card>
        <button
          type="button"
          onClick={() => setCompareOpen((o) => !o)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-lg"
        >
          <div>
            <CardTitle className="text-base">Karşılaştırma</CardTitle>
            <p className="text-sm text-muted-foreground">İki dönemi yan yana karşılaştır</p>
          </div>
          {compareOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
        </button>
        {compareOpen && (
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">İlk dönem</Label>
                <select
                  value={comparePeriodA}
                  onChange={(e) => setComparePeriodA(e.target.value as ComparePeriodKey)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {COMPARE_PERIOD_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {comparePeriodA === 'custom' && (
                  <div className="flex gap-2">
                    <Input type="date" value={compareStartA} onChange={(e) => setCompareStartA(e.target.value)} className="h-9 flex-1" />
                    <Input type="date" value={compareEndA} onChange={(e) => setCompareEndA(e.target.value)} className="h-9 flex-1" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">İkinci dönem</Label>
                <select
                  value={comparePeriodB}
                  onChange={(e) => setComparePeriodB(e.target.value as ComparePeriodKey)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {COMPARE_PERIOD_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {comparePeriodB === 'custom' && (
                  <div className="flex gap-2">
                    <Input type="date" value={compareStartB} onChange={(e) => setCompareStartB(e.target.value)} className="h-9 flex-1" />
                    <Input type="date" value={compareEndB} onChange={(e) => setCompareEndB(e.target.value)} className="h-9 flex-1" />
                  </div>
                )}
              </div>
            </div>
            {comparison && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border bg-muted/20 p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{comparison.labelA}</p>
                  <p className="text-2xl font-bold tabular-nums">{formatMoney(comparison.totalA)} ₺</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{comparison.rangeA}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-4 text-center flex flex-col justify-center">
                  <p className="text-xs text-muted-foreground mb-1">Fark</p>
                  <p className={`text-xl font-semibold tabular-nums ${comparison.diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                    {comparison.diff >= 0 ? '+' : ''}{formatMoney(comparison.diff)} ₺
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({comparison.percent >= 0 ? '+' : ''}{comparison.percent.toFixed(1)}%)
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{comparison.labelB}</p>
                  <p className="text-2xl font-bold tabular-nums">{formatMoney(comparison.totalB)} ₺</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{comparison.rangeB}</p>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Grid: Liste sol, Mini takvim sağ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Liste</CardTitle>
            <p className="text-sm text-muted-foreground">Tarih, miktar ve nereden</p>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Bu dönemde kayıt yok. Takvim sekmesinde günlük ₺ hücresine tıklayarak ekleyebilirsin.
              </p>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium">Tarih</th>
                      <th className="text-right py-2 font-medium">Miktar</th>
                      <th className="text-left py-2 font-medium pl-2">Nereden</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(({ dateKey, amount, note }) => (
                      <tr key={dateKey} className="border-b border-border/50">
                        <td className="py-2">{formatDate(dateKey)}</td>
                        <td className="text-right tabular-nums font-medium">{formatMoney(amount)} ₺</td>
                        <td className="py-2 pl-2 text-muted-foreground text-xs">{note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Mini takvim</CardTitle>
            <p className="text-sm text-muted-foreground">Hücreye tıklayınca yorum görünür</p>
          </CardHeader>
          <CardContent>
            <MiniCalendarMonths months={monthsInRange} period={period} startKey={startKey} endKey={endKey} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MiniCalendarMonths({
  months,
  period: _period,
  startKey,
  endKey,
}: {
  months: { year: number; month: number }[]
  period: PeriodKey
  startKey?: string
  endKey?: string
}) {
  if (months.length === 0) {
    const entries = getEarningsEntriesInRange(startKey, endKey)
    if (entries.length === 0)
      return <p className="text-sm text-muted-foreground">Henüz kazanç kaydı yok.</p>
    const byMonth = new Map<string, { year: number; month: number }>()
    for (const { dateKey } of entries) {
      const [y, m] = dateKey.split('-').map(Number)
      byMonth.set(`${y}-${m}`, { year: y, month: m - 1 })
    }
    months = Array.from(byMonth.values()).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
  }

  return (
    <div className="flex flex-wrap gap-6">
      {months.map(({ year, month }) => (
        <MiniMonth key={`${year}-${month}`} year={year} month={month} />
      ))}
    </div>
  )
}

const WEEKDAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

function MiniMonth({ year, month }: { year: number; month: number }) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startDay = first.getDay()
  const mondayOffset = startDay === 0 ? 6 : startDay - 1
  const weeks: (string | null)[][] = []
  let week: (string | null)[] = []
  for (let i = 0; i < mondayOffset; i++) week.push(null)
  for (let d = 1; d <= last.getDate(); d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    week.push(dateKey)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }

  const [tooltip, setTooltip] = useState<{ dateKey: string; note: string } | null>(null)

  return (
    <div className="inline-block">
      <p className="text-sm font-medium text-muted-foreground mb-2">
        {MONTHS[month]} {year}
      </p>
      <div className="grid grid-cols-7 gap-0.5 text-[10px]">
        {WEEKDAY_LABELS.map((l) => (
          <span key={l} className="text-muted-foreground text-center py-0.5">
            {l}
          </span>
        ))}
        {weeks.flat().map((dateKey, i) => {
          if (!dateKey) return <div key={i} className="w-8 h-8" />
          const entry = getEarningsEntry(dateKey)
          const amount = entry?.amount ?? 0
          const note = entry?.note ?? ''
          const day = dateKey.split('-')[2]
          return (
            <button
              key={i}
              type="button"
              className={cn(
                'w-8 h-8 rounded flex flex-col items-center justify-center border min-w-0',
                amount > 0 ? 'bg-primary/15 border-primary/30 text-primary' : 'border-border/50 text-muted-foreground'
              )}
              title={note ? `${amount} ₺ — ${note}` : amount > 0 ? `${amount} ₺` : ''}
              onClick={() => setTooltip(tooltip?.dateKey === dateKey ? null : { dateKey, note })}
            >
              <span className="font-medium leading-none">{day}</span>
              {amount > 0 && <span className="leading-none text-[9px]">{amount}</span>}
            </button>
          )
        })}
      </div>
      {tooltip && (
        <div className="mt-2 p-2 rounded bg-muted text-xs text-muted-foreground">
          <strong className="text-foreground">{formatDate(tooltip.dateKey)}</strong>
          {tooltip.note ? ` — ${tooltip.note}` : ' — (yorum yok)'}
        </div>
      )}
    </div>
  )
}

function cn(...args: (string | boolean | undefined)[]) {
  return args.filter(Boolean).join(' ')
}
