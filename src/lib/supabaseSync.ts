import type { Store } from '@/types'
import { getStore, importData } from '@/store'
import { supabase } from './supabase'

const DEBOUNCE_MS = 1500
const THEME_KEY = 'duzen-theme'
const THEME_CHANGED_EVENT = 'duzen-theme-changed'

/** Mevcut tema (localStorage). */
export function getSyncedTheme(): 'light' | 'dark' {
  if (typeof localStorage === 'undefined') return 'light'
  const t = localStorage.getItem(THEME_KEY)
  return t === 'dark' ? 'dark' : 'light'
}

/** Temayı uygula ve ThemeToggle'ı günceller. */
export function applyTheme(theme: 'light' | 'dark') {
  localStorage.setItem(THEME_KEY, theme)
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0c0c0c' : '#fafafa')
  window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT, { detail: { theme } }))
}

/** Store'u Supabase'deki tek user_data satırına yazar (tek istek: upsert). */
export async function pushStoreToSupabase(userId: string): Promise<{ error: Error | null }> {
  const store = getStore()

  try {
    const theme = store.theme === 'dark' ? 'dark' : getSyncedTheme()
    // weight_measurements uzak tabloda yoksa 400 hatası veriyor; sütun eklenene kadar göndermiyoruz
    const row = {
      user_id: userId,
      goals: store.goals,
      completions: store.completions,
      column_widths: store.columnWidths ?? {},
      comments: store.comments ?? {},
      earnings: store.earnings ?? {},
      water_intake: store.waterIntake ?? {},
      daily_tasks: store.dailyTasks ?? [],
      theme,
    }

    const { error } = await supabase.from('user_data').upsert(row, {
      onConflict: 'user_id',
    })

    return { error: error ?? null }
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) }
  }
}

/** Supabase'den kullanıcının tek satırını çekip store'a yükler (tek istek). */
export async function pullSupabaseToStore(userId: string): Promise<{ error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('goals, completions, column_widths, comments, earnings, water_intake, daily_tasks, theme')
      .eq('user_id', userId)
      .single()

    if (error) return { error }
    if (!data) return { error: new Error('Veri bulunamadı') }

    const theme = data.theme === 'dark' ? 'dark' : 'light'
    applyTheme(theme)

    // weight_measurements uzak tabloda yok; yerel store'daki değeri koruyoruz
    const existingStore = getStore()
    const storeData: Store = {
      goals: Array.isArray(data.goals) ? data.goals : [],
      completions: data.completions && typeof data.completions === 'object' ? data.completions : {},
      columnWidths: data.column_widths && typeof data.column_widths === 'object' ? data.column_widths : {},
      comments: data.comments && typeof data.comments === 'object' ? data.comments : {},
      earnings: data.earnings && typeof data.earnings === 'object' ? data.earnings : {},
      waterIntake: data.water_intake && typeof data.water_intake === 'object' ? data.water_intake : {},
      weightMeasurements: existingStore.weightMeasurements ?? {},
      dailyTasks: Array.isArray(data.daily_tasks) ? data.daily_tasks : [],
      theme,
    }

    const ok = importData(JSON.stringify(storeData))
    return ok ? { error: null } : { error: new Error('Import failed') }
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) }
  }
}

/** Kullanıcının kendi verisini (user_data) ve auth hesabını silmesi. Tek istek: Edge Function JWT ile sadece o kullanıcının verisini siler. */
export async function deleteMyAccount(): Promise<{ error: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return { error: 'Oturum bulunamadı' }

    const url = `${supabase.supabaseUrl}/functions/v1/delete-account`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const msg = (body as { error?: string })?.error || res.statusText || `Hata ${res.status}`
      return { error: msg }
    }
    return { error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Beklenmeyen hata'
    if (msg.includes('fetch') || msg.includes('Failed to fetch') || msg.includes('NetworkError'))
      return { error: 'Edge Function\'a bağlanılamadı. İnternet bağlantınızı ve CORS ayarlarını kontrol edin; fonksiyonu yeniden deploy ettiniz mi?' }
    return { error: msg }
  }
}

export { DEBOUNCE_MS }
