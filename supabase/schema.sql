-- ============================================================================
-- MedDecode: Supabase Database Migration & RLS Security Schema
-- Idempotent script: safe to execute multiple times in Supabase SQL Editor
-- ============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  preferred_language text DEFAULT 'english' CHECK (preferred_language IN ('english', 'hindi', 'hinglish')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (id = auth.uid());

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'english')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title text,
  patient_name text,
  lab_name text,
  report_date date,
  language text NOT NULL,
  overall_summary text,
  file_path text NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
CREATE POLICY "Users can insert own reports"
  ON public.reports FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own reports" ON public.reports;
CREATE POLICY "Users can update own reports"
  ON public.reports FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own reports" ON public.reports;
CREATE POLICY "Users can delete own reports"
  ON public.reports FOR DELETE
  USING (user_id = auth.uid());


-- 3. REPORT_TESTS TABLE
CREATE TABLE IF NOT EXISTS public.report_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  position int NOT NULL,
  test_name text NOT NULL,
  value text,
  numeric_value numeric NULL,
  unit text,
  reference_range text,
  status text CHECK (status IN ('normal', 'slightly_high', 'slightly_low', 'high', 'low', 'unclear')),
  simple_meaning text,
  what_test_measures text,
  urgency_note text,
  possible_general_reasons jsonb DEFAULT '[]'::jsonb,
  questions_for_doctor jsonb DEFAULT '[]'::jsonb,
  normalized_name text
);

ALTER TABLE public.report_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own report tests" ON public.report_tests;
CREATE POLICY "Users can view own report tests"
  ON public.report_tests FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own report tests" ON public.report_tests;
CREATE POLICY "Users can insert own report tests"
  ON public.report_tests FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.reports
      WHERE id = report_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own report tests" ON public.report_tests;
CREATE POLICY "Users can update own report tests"
  ON public.report_tests FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own report tests" ON public.report_tests;
CREATE POLICY "Users can delete own report tests"
  ON public.report_tests FOR DELETE
  USING (user_id = auth.uid());


-- 4. CHAT_MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;
CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.reports
      WHERE id = report_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own chat messages" ON public.chat_messages;
CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages FOR DELETE
  USING (user_id = auth.uid());


-- 5. INDEXES FOR PERFORMANCE & TREND QUERIES
CREATE INDEX IF NOT EXISTS idx_reports_user_created ON public.reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_tests_report_id ON public.report_tests(report_id);
CREATE INDEX IF NOT EXISTS idx_report_tests_user_normalized ON public.report_tests(user_id, normalized_name);
CREATE INDEX IF NOT EXISTS idx_chat_messages_report_created ON public.chat_messages(report_id, created_at ASC);


-- 6. STORAGE BUCKET: report-files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-files',
  'report-files',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

-- Storage RLS Policies
DROP POLICY IF EXISTS "Users can upload their own report files" ON storage.objects;
CREATE POLICY "Users can upload their own report files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'report-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can read their own report files" ON storage.objects;
CREATE POLICY "Users can read their own report files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'report-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own report files" ON storage.objects;
CREATE POLICY "Users can delete their own report files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'report-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their own report files" ON storage.objects;
CREATE POLICY "Users can update their own report files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'report-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
