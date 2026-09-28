-- ============================================================================
-- Sunbeam English School, Bhagwanpur — Lead Management & CRM Backend Schema
-- Database: Supabase (PostgreSQL with Realtime & Row Level Security)
-- ============================================================================

-- 1. Enable RLS and Policies for existing 'enquiries' table (Fixes 401 RLS Block)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'enquiries') THEN
        ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
        
        -- Add missing columns to enquiries if not already there
        ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';
        ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
        ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS assigned_to TEXT DEFAULT 'Admissions Desk';
        ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS follow_up_date DATE;
        ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS source_page TEXT DEFAULT 'Website';
        ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS lead_type TEXT DEFAULT 'admission';
    END IF;
END $$;

-- Enquiries Table: Public can submit (INSERT), but cannot view other submissions (SELECT restricted)
DROP POLICY IF EXISTS "Public can submit enquiries" ON public.enquiries;
CREATE POLICY "Public can submit enquiries" ON public.enquiries FOR INSERT TO public WITH CHECK (true);

-- Restrict SELECT on enquiries to authenticated staff / service_role so public visitors cannot view other parent inquiries
DROP POLICY IF EXISTS "Allow select on enquiries" ON public.enquiries;
CREATE POLICY "Allow select on enquiries" ON public.enquiries FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow update on enquiries" ON public.enquiries;
CREATE POLICY "Allow update on enquiries" ON public.enquiries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete on enquiries" ON public.enquiries;
CREATE POLICY "Allow delete on enquiries" ON public.enquiries FOR DELETE TO authenticated USING (true);



-- 2. Create the unified LEADS table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    lead_type TEXT NOT NULL DEFAULT 'admission',
    parent_name TEXT NOT NULL,
    student_name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    class_applying TEXT,
    subject TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    priority TEXT NOT NULL DEFAULT 'medium',
    assigned_to TEXT DEFAULT 'Admissions Desk',
    follow_up_date DATE,
    source_page TEXT DEFAULT 'Website',
    academic_year TEXT DEFAULT '2026-2027',
    tags TEXT[] DEFAULT '{}',
    archived BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3. Create the LEAD_ACTIVITIES table for history, notes & interaction logs
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    activity_type TEXT NOT NULL DEFAULT 'note',
    author TEXT NOT NULL DEFAULT 'Admissions Counselor',
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. Enable Row Level Security (RLS) on leads & lead_activities
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit enquiries" ON public.leads;
CREATE POLICY "Public can submit enquiries" ON public.leads FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select on leads" ON public.leads;
CREATE POLICY "Allow select on leads" ON public.leads FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow update on leads" ON public.leads;
CREATE POLICY "Allow update on leads" ON public.leads FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete on leads" ON public.leads;
CREATE POLICY "Allow delete on leads" ON public.leads FOR DELETE TO public USING (true);

DROP POLICY IF EXISTS "Allow all on lead_activities" ON public.lead_activities;
CREATE POLICY "Allow all on lead_activities" ON public.lead_activities FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. Grant Schema & Table Permissions to public roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 6. Trigger to refresh Supabase PostgREST Schema Cache immediately
NOTIFY pgrst, 'reload schema';
