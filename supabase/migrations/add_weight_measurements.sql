-- user_data tablosuna weight_measurements sütununu ekle (uzak DB'de yoksa)
ALTER TABLE public.user_data ADD COLUMN IF NOT EXISTS weight_measurements JSONB NOT NULL DEFAULT '{}';
