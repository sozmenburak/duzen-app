import * as React from 'react'
import type { Store, Goal, CellStatus, EarningsEntry } from './types'
import { STORAGE_KEY } from './types'
import { getAuth, apiUpdateData } from './lib/auth'

function migrateEarnings(raw: unknown): Record<string, { amount: number; note: string }> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, { amount: number; note: string }> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'number') {
      out[k] = { amount: v, note: '' }
    } else if (v && typeof v === 'object' && 'amount' in v) {
      const o = v as { amount?: number; note?: string }
      out[k] = { amount: Number(o.amount) || 0, note: typeof o.note === 'string' ? o.note : '' }
    }
  }
  return out
}

const DEFAULT_COLUMN_WIDTH = 140

const defaultStore: Store = {
  goals: [],
  completions: {},
  columnWidths: {},
  comments: {},
  earnings: {},
}

function normalizeStore(parsed: unknown): Store {
  if (!parsed || typeof parsed !== 'object') return { ...defaultStore }
  const p = parsed as Record<string, unknown>
  return {
    goals: Array.isArray(p.goals) ? p.goals : [],
    completions: p.completions && typeof p.completions === 'object' ? (p.completions as Store['completions']) : {},
    columnWidths: p.columnWidths && typeof p.columnWidths === 'object' ? (p.columnWidths as Store['columnWidths']) : {},
    comments: p.comments && typeof p.comments === 'object' ? (p.comments as Store['comments']) : {},
    earnings: migrateEarnings(p.earnings),
  }
}

function load(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultStore }
    return normalizeStore(JSON.parse(raw))
  } catch {
    return { ...defaultStore }
  }
}

function save(store: Store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  const auth = getAuth()
  if (auth) {
    apiUpdateData(auth.username, auth.password, store).catch(() => {})
  }
}

let state: Store = load()

type Listener = () => void
const listeners: Listener[] = []

export function subscribe(listener: Listener) {
  listeners.push(listener)
  return () => {
    const i = listeners.indexOf(listener)
    if (i >= 0) listeners.splice(i, 1)
  }
}

export function emit() {
  listeners.forEach((l) => l())
}

export function getStore(): Store {
  return state
}

export function addGoal(goal: Goal) {
  state = {
    ...state,
    goals: [...state.goals, goal],
  }
  save(state)
  emit()
}

export function removeGoal(id: string) {
  state = {
    ...state,
    goals: state.goals.filter((g) => g.id !== id),
  }
  if (state.columnWidths?.[id]) {
    const { [id]: _, ...rest } = state.columnWidths
    state.columnWidths = rest
  }
  const completions = { ...state.completions }
  for (const key of Object.keys(completions)) {
    const next = { ...completions[key] }
    delete next[id]
    if (Object.keys(next).length === 0) delete completions[key]
    else completions[key] = next
  }
  state.completions = completions
  save(state)
  emit()
}

export function setCell(dateKey: string, goalId: string, status: CellStatus) {
  const day = { ...(state.completions[dateKey] ?? {}), [goalId]: status }
  if (Object.values(day).every((s) => s === null)) {
    const { [dateKey]: _, ...rest } = state.completions
    state = { ...state, completions: rest }
  } else {
    state = {
      ...state,
      completions: { ...state.completions, [dateKey]: day },
    }
  }
  save(state)
  emit()
}

export function getCell(dateKey: string, goalId: string): CellStatus {
  return state.completions[dateKey]?.[goalId] ?? null
}

export function useStore() {
  const [, setTick] = React.useState(0)
  React.useEffect(() => {
    return subscribe(() => setTick((t) => t + 1))
  }, [])
  return state
}

export function isGoalVisibleOnDate(goal: Goal, dateKey: string): boolean {
  return dateKey >= goal.startDate
}

export function getColumnWidth(goalId: string): number {
  return state.columnWidths?.[goalId] ?? DEFAULT_COLUMN_WIDTH
}

export function setColumnWidth(goalId: string, widthPx: number) {
  const min = 80
  const max = 400
  const w = Math.min(max, Math.max(min, widthPx))
  state = {
    ...state,
    columnWidths: { ...state.columnWidths, [goalId]: w },
  }
  save(state)
  emit()
}

export function getComment(dateKey: string): string {
  return state.comments?.[dateKey] ?? ''
}

export function setComment(dateKey: string, text: string) {
  const trimmed = text.trim()
  if (!trimmed) {
    const { [dateKey]: _, ...rest } = state.comments ?? {}
    state = { ...state, comments: rest }
  } else {
    state = {
      ...state,
      comments: { ...state.comments, [dateKey]: trimmed },
    }
  }
  save(state)
  emit()
}

export function getEarnings(dateKey: string): number {
  return state.earnings?.[dateKey]?.amount ?? 0
}

export function getEarningsNote(dateKey: string): string {
  return state.earnings?.[dateKey]?.note ?? ''
}

export function getEarningsEntry(dateKey: string): EarningsEntry | null {
  return state.earnings?.[dateKey] ?? null
}

export function setEarnings(dateKey: string, amount: number, note?: string) {
  const value = Math.max(0, Number.isFinite(amount) ? amount : 0)
  const noteStr = (note ?? '').trim()
  if (value === 0 && !noteStr) {
    const { [dateKey]: _, ...rest } = state.earnings ?? {}
    state = { ...state, earnings: rest }
  } else {
    state = {
      ...state,
      earnings: { ...state.earnings, [dateKey]: { amount: value, note: noteStr } },
    }
  }
  save(state)
  emit()
}

/** Tarih aralığına göre kazanç kayıtları (tarih sıralı, en yeni önce). start/end yoksa tümü. */
export function getEarningsEntriesInRange(startDateKey?: string, endDateKey?: string): { dateKey: string; amount: number; note: string }[] {
  const entries = state.earnings ?? {}
  let list = Object.entries(entries).map(([dateKey, e]) => ({ dateKey, amount: e.amount, note: e.note }))
  if (startDateKey) list = list.filter(({ dateKey }) => dateKey >= startDateKey)
  if (endDateKey) list = list.filter(({ dateKey }) => dateKey <= endDateKey)
  list.sort((a, b) => b.dateKey.localeCompare(a.dateKey))
  return list
}

/** Tüm veriyi JSON string olarak döndürür (yedek/export). */
export function exportData(): string {
  return JSON.stringify(state, null, 2)
}

/** JSON string ile veriyi yükler (import). Başarılı olursa true, hata olursa false. */
export function importData(json: string): boolean {
  try {
    const parsed = JSON.parse(json)
    state = normalizeStore(parsed)
    save(state)
    emit()
    return true
  } catch {
    return false
  }
}

export type ResetDataOptions = {
  ticks?: boolean   // completions (yapıldı/yapılmadı)
  comments?: boolean
  earnings?: boolean
}

/** Tüm veriyi siler (hedefler dahil). */
export function resetAllData() {
  state = { ...defaultStore }
  save(state)
  emit()
}

/** Sadece veriyi siler; hedefler ve sütun genişlikleri kalır. Seçeneklere göre tikler, yorumlar, para silinir. */
export function resetDataOnly(options: ResetDataOptions) {
  const { ticks = true, comments = true, earnings = true } = options
  state = {
    ...state,
    completions: ticks ? {} : state.completions,
    comments: comments ? {} : state.comments,
    earnings: earnings ? {} : state.earnings,
  }
  save(state)
  emit()
}
