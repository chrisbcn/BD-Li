# Migration 002: Contacts and Activities

## Step 1: Run the Migration

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: **supabase-indigo-umbrella**
3. Navigate to **SQL Editor** (left sidebar)
4. Click **"New Query"**
5. Open `supabase/migrations/002_create_contacts_and_activities.sql` in your code editor
6. Copy the entire SQL content
7. Paste into the SQL Editor
8. Click **"Run"** (or press Cmd/Ctrl + Enter)
9. You should see "Success. No rows returned"

## Step 2: Verify Tables Created

1. Go to **Table Editor** in your Supabase dashboard
2. You should now see these new tables:
   - ✅ `contacts` - People in your network
   - ✅ `activities` - Communication history
   - ✅ `contact_tasks` - Links contacts to tasks
3. The `tasks` table should now have a new `contact_id` column

## What This Migration Creates

- **contacts** table: Stores contact information and relationship metrics
- **activities** table: Tracks all communications (email, call, meeting, LinkedIn, etc.)
- **contact_tasks** table: Many-to-many relationship between contacts and tasks
- Adds `contact_id` column to `tasks` table for direct linking
- Indexes for performance
- RLS policies for security

## Next Steps

After running this migration, you can:
- View contacts in the Contacts section (once UI is built)
- Track activities and communication history
- Link tasks to contacts
- Use relationship scoring to find who to reconnect with

