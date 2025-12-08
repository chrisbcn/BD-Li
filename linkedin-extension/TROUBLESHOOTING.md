# LinkedIn Extension Troubleshooting

## Issue: "Could not find the table 'public.tasks' in the schema cache"

This error occurs when Supabase's REST API schema cache needs to be refreshed.

### Fix:

1. **Go to your Supabase Dashboard:**
   - Open: https://supabase.com/dashboard/project/arbfeygvxnksqhgbpfpc

2. **Reload the API Schema:**
   - In the left sidebar, click **"API"**
   - At the top of the API page, you'll see a button that says **"Reload schema"** or similar
   - Click it to refresh the schema cache

   **OR**

   - Go to **Settings** → **API**
   - Find **"Schema Cache"** section
   - Click **"Reload Schema"** or **"Refresh Schema"**

3. **Verify the migration ran:**
   - Go to **SQL Editor** in Supabase
   - Run this query to check if the tasks table exists:
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name = 'tasks'
   );
   ```
   - Should return `true`

4. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'tasks';
   ```
   - Should show 4 policies: SELECT, INSERT, UPDATE, DELETE all allowing public access

5. **Reload the extension:**
   - Go to `chrome://extensions/`
   - Find "LinkedIn Task Creator"
   - Click the refresh icon
   - Refresh the LinkedIn page

## Button Placement Issue

If the "Create Task" button only appears in the sticky header when scrolling:

1. **Reload the extension** (see step 5 above)
2. The button should now appear in the main profile card next to "Message" and "More" buttons
3. If it still doesn't work, a floating button will appear in the bottom-right corner as a fallback

## Debugging

Open the browser console (F12) and look for messages starting with `[LinkedIn Task Creator]` to see detailed logs.

