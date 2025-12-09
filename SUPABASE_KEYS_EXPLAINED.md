# Supabase Keys Explained

## For This App (Client-Side Only)

**You ONLY need the `anon public` key** - no secret key needed!

### Why?
- All Supabase calls are made directly from the browser (client-side)
- The `anon public` key is designed to be safe in the browser
- It respects Row Level Security (RLS) policies
- The secret key is only needed if you have a backend server

## Where to Find the Anon Public Key

1. Go to: https://supabase.com/dashboard
2. Select your project: `ibcinipuskqgwczuobyh`
3. Click **Settings** (gear icon) → **API**
4. Look for **"Project API keys"** section
5. Find **`anon` `public`** - this is what you need!
6. It will look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliY2luaXB1c2tnd2N6dW9ieWgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc2NDg5Nzc5MCwiZXhwIjoyMDgwNTU1NzkwfQ.xxxxx`

## What You Currently Have (WRONG)

Your `.env` has:
```
VITE_SUPABASE_ANON_KEY=sb_secret_kEj9G2MBSWJSzGdOYHXdhg_qDquk75E
```

This is a **secret key** (starts with `sb_secret_`), which:
- ❌ Should NEVER be in browser code
- ❌ Will cause "Forbidden use of secret API key in browser" errors
- ❌ Is only for server-side use

## What You Need (CORRECT)

Your `.env` should have:
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliY2luaXB1c2tnd2N6dW9ieWgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc2NDg5Nzc5MCwiZXhwIjoyMDgwNTU1NzkwfQ.xxxxx
```

This is the **anon public key** (starts with `eyJ`), which:
- ✅ Is safe to use in the browser
- ✅ Respects RLS policies
- ✅ Is what you need for client-side Supabase calls

## When Would You Need the Secret Key?

You would ONLY need the secret key if:
- You have a backend server (Node.js, Python, etc.)
- You need to bypass RLS for admin operations
- You're making server-side API calls

**For this app**: You don't need it! All calls are from the browser.

## Quick Fix

1. Copy the `anon public` key from Supabase Dashboard → Settings → API
2. Replace the value in your `.env` file
3. Restart dev server: `npm run dev`
4. Done! ✅

