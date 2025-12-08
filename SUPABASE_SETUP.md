# Supabase Database Setup Guide

This guide will help you set up the Supabase database for the Task Management App.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- A Supabase project created

## Step 1: Run Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the contents of `supabase/migrations/001_create_tasks_table.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Cmd/Ctrl + Enter)

### Option B: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 2: Verify Tables Created

1. Go to **Table Editor** in your Supabase dashboard
2. You should see two tables:
   - `tasks` - Main tasks table
   - `column_names` - Column name customization table

## Step 3: Verify Row Level Security (RLS)

1. Go to **Authentication** → **Policies** in your Supabase dashboard
2. Verify that the `tasks` table has policies:
   - Allow public read access
   - Allow public insert access
   - Allow public update access
   - Allow public delete access

**Note**: For production, you should restrict these policies to authenticated users only.

## Step 4: Test the Connection

1. Make sure your `.env` file has the correct credentials (or use the defaults)
2. Run the app: `npm run dev`
3. Try creating a task - it should save to Supabase

## Step 5: View Your Data

1. Go to **Table Editor** in Supabase dashboard
2. Click on the `tasks` table
3. You should see your tasks appear as you create them

## Database Schema

### Tasks Table

- `id` (UUID) - Primary key
- `title` (TEXT) - Task title
- `description` (TEXT) - Task description
- `status` (TEXT) - Task status (incoming, todo, done, ai_captured)
- `priority` (TEXT) - Optional priority (low, medium, high)
- `due_date` (TIMESTAMPTZ) - Optional due date
- `completed_date` (TIMESTAMPTZ) - When task was completed
- `recurrence_enabled` (BOOLEAN) - Whether task recurs
- `recurrence_days` (INTEGER) - Days until recurrence (default: 7)
- `source` (TEXT) - Source of task (manual, gmail, etc.)
- `labels` (TEXT[]) - Array of labels
- `tags` (TEXT[]) - Array of tags
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp (auto-updated)
- Plus extended fields stored as JSONB

### Column Names Table

- `id` (UUID) - Primary key
- `user_id` (TEXT) - For future multi-user support
- `incoming`, `ai_captured`, `todo`, `done` (TEXT) - Custom column names
- `created_at`, `updated_at` (TIMESTAMPTZ) - Timestamps

## Troubleshooting

### "relation does not exist" error

- Make sure you ran the migration SQL
- Check that you're connected to the correct Supabase project

### "permission denied" error

- Check Row Level Security policies
- Verify your anon key is correct in `.env`

### Tasks not saving

- Check browser console for errors
- Verify Supabase URL and anon key in `.env`
- Check Network tab to see if requests are failing

## Security Notes

**Current Setup**: The database allows public read/write access. This is fine for:
- Personal use
- Development/testing
- Single-user applications

**For Production/Multi-user**: You should:
1. Enable Supabase Authentication
2. Update RLS policies to require authentication
3. Add user_id foreign keys to tasks
4. Filter queries by user_id

## Next Steps

- [ ] Run the migration SQL
- [ ] Verify tables are created
- [ ] Test creating a task
- [ ] (Optional) Set up authentication for multi-user support
- [ ] (Optional) Customize RLS policies for your use case

