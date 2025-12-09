# Fix Supabase API Key Error

## Problem
You're getting "Forbidden use of secret API key in browser" errors because your `.env` file has the **secret key** instead of the **anon public key**.

## Solution

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `ibcinipuskqgwczuobyh` (supabase-indigo-umbrella)
3. **Navigate to**: Settings → API
4. **Find the "Project API keys" section**
5. **Copy the `anon public` key** (it starts with `eyJ...` - it's a JWT token)
6. **DO NOT use the `service_role` key** (that's for server-side only)

## Update .env File

Replace the current key in your `.env` file:

```bash
# WRONG (what you have now):
VITE_SUPABASE_ANON_KEY=sb_secret_kEj9G2MBSWJSzGdOYHXdhg_qDquk75E

# CORRECT (should look like this):
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliY2luaXB1c2tnd2N6dW9ieWgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc2NDg5Nzc5MCwiZXhwIjoyMDgwNTU1NzkwfQ.xxxxx
```

The anon key is a long JWT token that starts with `eyJ`. The secret key starts with `sb_secret_` and should NEVER be used in the browser.

## After Updating

1. Save the `.env` file
2. **Restart your dev server** (stop and run `npm run dev` again)
3. The errors should be resolved

