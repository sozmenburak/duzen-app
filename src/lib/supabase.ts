import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

if (!url || !publishableKey) {
  throw new Error('VITE_SUPABASE_URL ve VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY .env dosyasında tanımlı olmalı.')
}

export const supabase = createClient(url, publishableKey)
