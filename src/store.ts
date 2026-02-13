import * as React from 'react'
import type { Store, Goal, CellStatus, EarningsEntry, DailyTask, DailyTaskStatus } from './types'
import { STORAGE_KEY, dateToKey } from './types'

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

const MAX_WATER_LITRES = 4
const WATER_STEP = 0.5

function normalizeWaterLitres(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  const steps = Math.round(value / WATER_STEP) * WATER_STEP
  return Math.min(MAX_WATER_LITRES, Math.max(0, steps))
}

function migrateWaterIntake(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw)) {
    const num = typeof v === 'number' ? v : Number(v)
    if (Number.isFinite(num) && num > 0) out[k] = normalizeWaterLitres(num)
  }
  return out
}

const DEFAULT_COLUMN_WIDTH = 140

const THEME_KEY = 'duzen-theme'

const defaultStore: Store = {
  goals: [],
  completions: {},
  columnWidths: {},
  comments: {},
  earnings: {},
  waterIntake: {},
  dailyTasks: [],
  theme: 'light',
}

function normalizeGoals(goals: unknown): Goal[] {
  if (!Array.isArray(goals)) return []
  return (goals as Goal[]).map((g, i) => ({
    ...g,
    order: typeof (g as Goal).order === 'number' ? (g as Goal).order : i,
  })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function normalizeStore(parsed: unknown): Store {
  if (!parsed || typeof parsed !== 'object') return { ...defaultStore }
  const p = parsed as Record<string, unknown>
  const theme = p.theme === 'dark' ? 'dark' : 'light'
  return {
    goals: normalizeGoals(p.goals),
    completions: p.completions && typeof p.completions === 'object' ? (p.completions as Store['completions']) : {},
    columnWidths: p.columnWidths && typeof p.columnWidths === 'object' ? (p.columnWidths as Store['columnWidths']) : {},
    comments: p.comments && typeof p.comments === 'object' ? (p.comments as Store['comments']) : {},
    earnings: migrateEarnings(p.earnings),
    waterIntake: p.waterIntake && typeof p.waterIntake === 'object' ? migrateWaterIntake(p.waterIntake) : {},
    dailyTasks: Array.isArray(p.dailyTasks) ? (p.dailyTasks as DailyTask[]) : [],
    theme,
  }
}

function load(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const stored = { ...defaultStore }
      if (typeof localStorage !== 'undefined') {
        stored.theme = localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
      }
      return stored
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const stored = normalizeStore(parsed)
    if (parsed && typeof parsed === 'object' && !('theme' in parsed) && typeof localStorage !== 'undefined') {
      stored.theme = localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
    }
    return stored
  } catch {
    return { ...defaultStore }
  }
}

function save(store: Store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
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
  const order = state.goals.length
  const withOrder = { ...goal, order }
  state = {
    ...state,
    goals: [...state.goals, withOrder],
  }
  save(state)
  emit()
}

/** Hedeflerin sırasını günceller (sürükle-bırak). Sıra hem yerelde hem giriş yapılmışsa Supabase’e kaydedilir. */
export function reorderGoals(orderedGoalIds: string[]) {
  const idSet = new Set(orderedGoalIds)
  const rest = state.goals.filter((g) => !idSet.has(g.id))
  const reordered: Goal[] = orderedGoalIds
    .map((id, index) => {
      const g = state.goals.find((x) => x.id === id)
      if (!g) return null
      return { ...g, order: index } as Goal
    })
    .filter((g): g is Goal => g != null)
  const restWithOrder: Goal[] = rest.map((g, i) => ({ ...g, order: orderedGoalIds.length + i }))
  state = {
    ...state,
    goals: [...reordered, ...restWithOrder].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
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

export function getTheme(): 'light' | 'dark' {
  return state.theme === 'dark' ? 'dark' : 'light'
}

export function setTheme(theme: 'light' | 'dark') {
  state = { ...state, theme }
  save(state)
  if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_KEY, theme)
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

export function getWaterIntake(dateKey: string): number {
  return state.waterIntake?.[dateKey] ?? 0
}

export function setWaterIntake(dateKey: string, litres: number) {
  const value = normalizeWaterLitres(litres)
  if (value === 0) {
    const { [dateKey]: _, ...rest } = state.waterIntake ?? {}
    state = { ...state, waterIntake: rest }
  } else {
    state = {
      ...state,
      waterIntake: { ...state.waterIntake, [dateKey]: value },
    }
  }
  save(state)
  emit()
}

/** Belirli bir günde şişe indeksine göre mevcut durum: 0 = boş, 0.5 = yarım, 1 = dolu */
export function getBottleState(totalLitres: number, bottleIndex: number): 0 | 0.5 | 1 {
  if (totalLitres <= bottleIndex) return 0
  if (totalLitres < bottleIndex + 1) return 0.5
  return 1
}

/** Şişe tıklanınca döngü: boş -> yarım -> dolu -> boş. Yeni toplam litre döner. */
export function cycleBottle(totalLitres: number, bottleIndex: number): number {
  const state = getBottleState(totalLitres, bottleIndex)
  if (state === 0) return bottleIndex + 0.5
  if (state === 0.5) return bottleIndex + 1
  return bottleIndex
}

/** Tarih aralığında su tüketimi kayıtları (tarih sıralı, en yeni önce). */
export function getWaterIntakeEntriesInRange(startDateKey?: string, endDateKey?: string): { dateKey: string; litres: number }[] {
  const entries = state.waterIntake ?? {}
  let list = Object.entries(entries)
    .filter(([, litres]) => litres > 0)
    .map(([dateKey, litres]) => ({ dateKey, litres }))
  if (startDateKey) list = list.filter(({ dateKey }) => dateKey >= startDateKey)
  if (endDateKey) list = list.filter(({ dateKey }) => dateKey <= endDateKey)
  list.sort((a, b) => b.dateKey.localeCompare(a.dateKey))
  return list
}

/** Belirli bir güne ait günlük görevleri döndürür (başlık sıralı). */
export function getDailyTasksForDate(dateKey: string): DailyTask[] {
  const list = (state.dailyTasks ?? []).filter((t) => t.dateKey === dateKey)
  list.sort((a, b) => a.title.localeCompare(b.title))
  return list
}

/** Tarih aralığındaki tüm günlük görevleri döndürür (dateKey, sonra title sıralı). */
export function getDailyTasksInRange(startDateKey: string, endDateKey: string): DailyTask[] {
  const list = (state.dailyTasks ?? []).filter(
    (t) => t.dateKey >= startDateKey && t.dateKey <= endDateKey
  )
  list.sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.title.localeCompare(b.title))
  return list
}

export function addDailyTask(dateKey: string, title: string): void {
  const trimmed = title.trim()
  if (!trimmed) return
  const task: DailyTask = {
    id: crypto.randomUUID(),
    title: trimmed,
    dateKey,
    status: null,
  }
  state = {
    ...state,
    dailyTasks: [...(state.dailyTasks ?? []), task],
  }
  save(state)
  emit()
}

export function removeDailyTask(id: string): void {
  state = {
    ...state,
    dailyTasks: (state.dailyTasks ?? []).filter((t) => t.id !== id),
  }
  save(state)
  emit()
}

export function setDailyTaskStatus(id: string, status: DailyTaskStatus): void {
  const tasks = state.dailyTasks ?? []
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx < 0) return
  const next = [...tasks]
  next[idx] = { ...next[idx], status }
  state = { ...state, dailyTasks: next }
  save(state)
  emit()
}

/** Görevi yarına taşır (dateKey +1 gün). */
export function postponeDailyTaskToTomorrow(id: string): void {
  const tasks = state.dailyTasks ?? []
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx < 0) return
  const task = tasks[idx]
  const d = new Date(task.dateKey + 'T12:00:00')
  d.setDate(d.getDate() + 1)
  const nextKey = dateToKey(d)
  const next = [...tasks]
  next[idx] = { ...next[idx], dateKey: nextKey, status: null }
  state = { ...state, dailyTasks: next }
  save(state)
  emit()
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
  waterIntake?: boolean
  dailyTasks?: boolean
}

/** Tüm veriyi siler (hedefler dahil). */
export function resetAllData() {
  state = { ...defaultStore }
  save(state)
  emit()
}

/** Sadece veriyi siler; hedefler ve sütun genişlikleri kalır. Seçeneklere göre tikler, yorumlar, para, su, günlük görevler silinir. */
export function resetDataOnly(options: ResetDataOptions) {
  const { ticks = true, comments = true, earnings = true, waterIntake: wipeWater = true, dailyTasks: resetDaily = true } = options
  state = {
    ...state,
    completions: ticks ? {} : state.completions,
    comments: comments ? {} : state.comments,
    earnings: earnings ? {} : state.earnings,
    waterIntake: wipeWater ? {} : state.waterIntake,
    dailyTasks: resetDaily ? [] : state.dailyTasks,
  }
  save(state)
  emit()
}
