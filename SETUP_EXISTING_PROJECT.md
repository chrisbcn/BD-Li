# Setting Up Your Existing Supabase Project

You're using your existing project: **supabase-indigo-umbrella**

## Step 1: Get Your Project Credentials

1. In your Supabase dashboard, click **Settings** (gear icon in left sidebar)
2. Click **API** in the settings menu (NOT "JWT Keys" - that's for advanced signing key management)
3. You'll see a section called **"Project API keys"** with:
   - **Project URL**: Something like `https://xxxxx.supabase.co`
   - **Project ID**: The part before `.supabase.co` in the URL (this is what you need)
   - **anon public** key: A long JWT token (starts with `eyJ...`) - This is what you need!

4. Copy both the **Project ID** and **anon public** key

**Note**: The "JWT Keys" section you might see is for managing signing keys (advanced feature). You don't need to touch that - just get the anon public key from the API section.

## Step 2: Create .env File

1. In your project root, create a `.env` file:

```bash
VITE_SUPABASE_PROJECT_ID=your-project-id-from-step-1
VITE_SUPABASE_ANON_KEY=your-anon-key-from-step-1
```

2. Replace the values with what you copied

**Note**: The `.env` file is already in `.gitignore`, so it won't be committed to git.

## Step 3: Run the Database Migration

Since you already have 6 tables, we'll add the new tables for the task app:

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open `supabase/migrations/001_create_tasks_table.sql` in your code editor
4. Copy the entire SQL content
5. Paste into the SQL Editor
6. Click **"Run"** (or press Cmd/Ctrl + Enter)

This will create:
- `tasks` table (for your tasks)
- `column_names` table (for column customization)

**Note**: These won't conflict with your existing tables.

## Step 4: Verify Tables Created

1. Go to **Table Editor** in Supabase dashboard
2. You should now see 8 tables total (your 6 existing + 2 new):
   - `tasks` ✅
   - `column_names` ✅

## Step 5: Test Your App

1. Make sure your `.env` file is created with correct values
2. Restart your dev server:
   ```bash
   npm run dev
   ```
3. Try creating a task
4. Go to Supabase → **Table Editor** → `tasks` table
5. Your task should appear!

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env` file
- Make sure no extra spaces or quotes
- Restart dev server after creating `.env`

### "relation already exists" error
- The tables might already exist
- Check Table Editor to see if `tasks` and `column_names` are there
- If they exist, you can skip the migration

### Tasks not saving
- Check browser console for errors
- Verify `.env` file is in project root
- Make sure you restarted the dev server

## Your Existing Tables

Your project already has 6 tables. The new `tasks` and `column_names` tables will be completely separate and won't interfere with your existing data.

