-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Form submissions table
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id TEXT NOT NULL DEFAULT 'default',
  data JSONB NOT NULL,
  email TEXT,
  name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'archived')),
  ip_address INET,
  user_agent TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  notes TEXT
);

-- Create indexes
CREATE INDEX idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX idx_form_submissions_email ON public.form_submissions(email);
CREATE INDEX idx_form_submissions_status ON public.form_submissions(status);
CREATE INDEX idx_form_submissions_submitted_at ON public.form_submissions(submitted_at DESC);

-- Enable RLS
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Public can submit forms
CREATE POLICY "Anyone can submit forms" ON public.form_submissions
  FOR INSERT WITH CHECK (true);

-- Only service role can read submissions
CREATE POLICY "Service role can read all submissions" ON public.form_submissions
  FOR SELECT USING (auth.role() = 'service_role');

-- Only service role can update submissions
CREATE POLICY "Service role can update submissions" ON public.form_submissions
  FOR UPDATE USING (auth.role() = 'service_role');