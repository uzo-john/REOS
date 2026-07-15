-- Supabase Setup Script: Enable Row Level Security (RLS) on all tables

-- 1. Enable RLS on all tables in the public schema programmatically
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE "' || r.tablename || '" ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;

-- 2. Create specific security policies for the Project table (users can only see their own projects)
DROP POLICY IF EXISTS "Users can view their own projects" ON "Project";
CREATE POLICY "Users can view their own projects" ON "Project"
    FOR SELECT
    TO authenticated
    USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can create their own projects" ON "Project";
CREATE POLICY "Users can create their own projects" ON "Project"
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can update their own projects" ON "Project";
CREATE POLICY "Users can update their own projects" ON "Project"
    FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = "userId")
    WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can delete their own projects" ON "Project";
CREATE POLICY "Users can delete their own projects" ON "Project"
    FOR DELETE
    TO authenticated
    USING (auth.uid()::text = "userId");
