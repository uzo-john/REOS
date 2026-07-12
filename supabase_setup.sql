-- Supabase Setup Script: Enable Row Level Security (RLS) on the Project table

-- 1. Enable RLS on the Project table
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy for SELECT: Users can only view their own projects
CREATE POLICY "Users can view their own projects" ON "Project"
    FOR SELECT
    TO authenticated
    USING (auth.uid()::text = "userId");

-- 3. Create Policy for INSERT: Users can only create projects linked to their user ID
CREATE POLICY "Users can create their own projects" ON "Project"
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = "userId");

-- 4. Create Policy for UPDATE: Users can only update their own projects
CREATE POLICY "Users can update their own projects" ON "Project"
    FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = "userId")
    WITH CHECK (auth.uid()::text = "userId");

-- 5. Create Policy for DELETE: Users can only delete their own projects
CREATE POLICY "Users can delete their own projects" ON "Project"
    FOR DELETE
    TO authenticated
    USING (auth.uid()::text = "userId");
