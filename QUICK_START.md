# Quick Start Guide

## Get Your Supabase Credentials (2 minutes)

1. **Go to Settings → API** (NOT JWT Keys)
   - Click the gear icon ⚙️ in left sidebar
   - Click **"API"** (not "JWT Keys")

2. **Find these two values:**
   - **Project ID**: Found in the "Project URL" (the part before `.supabase.co`)
     - Example: If URL is `https://abc123.supabase.co`, then Project ID is `abc123`
   - **anon public** key: A long token starting with `eyJ...`
     - Look for the section labeled **"Project API keys"**
     - Copy the **"anon public"** key (not service_role)

3. **Update your `.env` file:**
   ```bash
   VITE_SUPABASE_PROJECT_ID=your-project-id-here
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Run Database Migration (1 minute)

1. In Supabase dashboard → **SQL Editor**
2. Click **"New Query"**
3. Copy/paste contents of `supabase/migrations/001_create_tasks_table.sql`
4. Click **"Run"**

## Test It (30 seconds)

1. Restart dev server: `npm run dev`
2. Create a task
3. Check Supabase → Table Editor → `tasks` table

Done! 🎉

---

**Note about JWT Keys**: The "JWT Keys" section in Settings is for advanced signing key management. You don't need it for this app - just use the anon public key from the API section.

