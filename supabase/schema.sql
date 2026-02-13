-- Düzen APP — Tek tablo: tüm kullanıcı verisi JSON sütunlarında.
-- Supabase SQL Editor'da önce bu bloku çalıştırın (eski tabloları siler), sonra aşağıdaki CREATE TABLE.

-- Eski tabloları sil (FK sırası)
DROP TABLE IF EXISTS public.completions;
DROP TABLE IF EXISTS public.column_widths;
DROP TABLE IF EXISTS public.goals;
DROP TABLE IF EXISTS public.comments;
DROP TABLE IF EXISTS public.earnings;
DROP TABLE IF EXISTS public.water_intake;
DROP TABLE IF EXISTS public.daily_tasks;

-- Tek tablo: kullanıcı başına bir satır, tüm veri JSON
CREATE TABLE IF NOT EXISTS public.user_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goals JSONB NOT NULL DEFAULT '[]',
  completions JSONB NOT NULL DEFAULT '{}',
  column_widths JSONB NOT NULL DEFAULT '{}',
  comments JSONB NOT NULL DEFAULT '{}',
  earnings JSONB NOT NULL DEFAULT '{}',
  water_intake JSONB NOT NULL DEFAULT '{}',
  daily_tasks JSONB NOT NULL DEFAULT '[]',
  theme TEXT NOT NULL DEFAULT 'light'
);

-- Tablo zaten varsa sadece tema sütununu eklemek için (yukarıdaki CREATE'ı atlayıp bunu çalıştırın):
ALTER TABLE public.user_data ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'light';

ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- Politikalar zaten varsa sil (şemayı tekrar çalıştırabilmek için)
DROP POLICY IF EXISTS "user_data_select_own" ON public.user_data;
DROP POLICY IF EXISTS "user_data_insert_own" ON public.user_data;
DROP POLICY IF EXISTS "user_data_update_own" ON public.user_data;
DROP POLICY IF EXISTS "user_data_delete_own" ON public.user_data;

CREATE POLICY "user_data_select_own" ON public.user_data
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_data_insert_own" ON public.user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_data_update_own" ON public.user_data
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_data_delete_own" ON public.user_data
  FOR DELETE USING (auth.uid() = user_id);
