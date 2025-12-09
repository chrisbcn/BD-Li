# Setting Up Your Supabase Project

## Current Situation

The code references an existing Supabase project (`arbfeygvxnksqhgbpfpc`) that was likely created by Figma Make. **You should create your own project** for the following reasons:

1. **Security**: You'll have full control over your data
2. **Access**: You'll have admin access to manage the database
3. **Customization**: You can configure it exactly how you need
4. **Production Ready**: Better for deploying your app

## Step 1: Create a New Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Name**: `task-management-app` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine to start
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to be set up

## Step 2: Get Your Project Credentials

1. Once your project is ready, go to **Settings** → **API**
2. You'll see:
   - **Project URL**: Something like `https://xxxxx.supabase.co`
   - **Project ID**: The part before `.supabase.co` (e.g., `xxxxx`)
   - **anon public** key: A long JWT token

3. Copy these values - you'll need them next

## Step 3: Configure Your App

1. Create a `.env` file in the root of your project:

```bash
VITE_SUPABASE_PROJECT_ID=your-project-id-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Replace the values with your actual project ID and anon key

## Step 4: Run the Database Migration

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the file `supabase/migrations/001_create_tasks_table.sql` in your project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **"Run"** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

## Step 5: Verify Tables Are Created

1. Go to **Table Editor** in your Supabase dashboard
2. You should see two tables:
   - ✅ `tasks`
   - ✅ `column_names`

## Step 6: Test Your App

1. Make sure your `.env` file is set up correctly
2. Restart your dev server:
   ```bash
   npm run dev
   ```
3. Try creating a task in the app
4. Go back to Supabase → **Table Editor** → `tasks` table
5. You should see your task appear!

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env` file has the correct values
- Make sure there are no extra spaces or quotes
- Restart your dev server after changing `.env`

### "relation does not exist" error
- Make sure you ran the migration SQL (Step 4)
- Check that you're looking at the correct project in Supabase

### Tasks not appearing
- Check browser console for errors
- Verify your `.env` file is in the root directory
- Make sure you restarted the dev server

## Using the Existing Project (Not Recommended)

If you want to use the existing project (`arbfeygvxnksqhgbpfpc`):

1. Try accessing it at: https://supabase.com/dashboard/project/arbfeygvxnksqhgbpfpc
2. If you don't have access, you'll need to create your own project
3. The existing project may have been created by Figma Make and you might not have admin access

## Next Steps

Once your database is set up:
- ✅ Your tasks will persist across browser sessions
- ✅ You can view/edit data in Supabase dashboard
- ✅ Ready for production deployment
- ✅ Can add authentication later for multi-user support

