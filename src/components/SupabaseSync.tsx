import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { subscribe, getStore } from '@/store'
import { pushStoreToSupabase, pullSupabaseToStore, DEBOUNCE_MS } from '@/lib/supabaseSync'

/**
 * Giriş yapmış kullanıcı için:
 * - İlk girişte: localStorage'da veri varsa Supabase'e yükler; yoksa Supabase'den çeker.
 * - Store her değiştiğinde debounce sonrası Supabase'e push eder.
 */
export function SupabaseSync() {
  const { user } = useAuth()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialSyncDone = useRef(false)

  // Giriş yapıldığında veya sayfa yüklendiğinde kullanıcı varsa: tek seferlik ilk senkron
  useEffect(() => {
    if (!user?.id) {
      initialSyncDone.current = false
      return
    }
    if (initialSyncDone.current) return
    initialSyncDone.current = true

    const store = getStore()
    const hasLocalData = store.goals.length > 0

    if (hasLocalData) {
      pushStoreToSupabase(user.id).then(({ error }) => {
        if (error) console.error('[SupabaseSync] İlk yükleme (push) hatası:', error)
      })
    } else {
      pullSupabaseToStore(user.id).then(({ error }) => {
        if (error) console.error('[SupabaseSync] İlk yükleme (pull) hatası:', error)
      })
    }
  }, [user?.id])

  // Store değişimlerinde debounce ile Supabase'e push
  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = subscribe(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null
        pushStoreToSupabase(user.id).then(({ error }) => {
          if (error) console.error('[SupabaseSync] Push hatası:', error)
        })
      }, DEBOUNCE_MS)
    })

    return () => {
      unsubscribe()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [user?.id])

  return null
}
