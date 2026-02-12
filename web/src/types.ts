export type CellStatus = 'done' | 'skip' | null

export interface Goal {
  id: string
  title: string
  startDate: string // YYYY-MM-DD — bu tarihten itibaren görünür
}

export interface Completions {
  [dateKey: string]: {
    [goalId: string]: CellStatus
  }
}

export interface Store {
  goals: Goal[]
  completions: Completions
  columnWidths?: Record<string, number> // goalId -> width (px)
  comments?: Record<string, string> // dateKey -> günlük yorum
  earnings?: Record<string, { amount: number; note: string }> // dateKey -> kazanç + nereden
}

export interface EarningsEntry {
  amount: number
  note: string
}

export const STORAGE_KEY = 'duzen-app-data'

export function dateToKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const days: Date[] = []
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d))
  }
  return days
}

export function getCalendarWeeks(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startDay = first.getDay()
  const startOffset = startDay === 0 ? 6 : startDay - 1
  const weeks: (Date | null)[][] = []
  let week: (Date | null)[] = []

  for (let i = 0; i < startOffset; i++) {
    week.push(null)
  }

  for (let d = 1; d <= last.getDate(); d++) {
    week.push(new Date(year, month, d))
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }

  if (week.length) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }

  return weeks
}
