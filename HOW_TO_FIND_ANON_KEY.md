# How to Find the Anon Public Key

## ⚠️ Important: You Have the Wrong Key

The key you provided is a **service_role** key (I can see `"role":"service_role"` in the token). This is **NOT** what you need for the browser!

## What You Need: Anon Public Key

The anon public key should have `"role":"anon"` in the token, not `"role":"service_role"`.

## Step-by-Step: Finding the Anon Key

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your project: `ibcinipuskqgwczuobyh`

2. **Navigate to API Settings**
   - Click **Settings** (gear icon) in the left sidebar
   - Click **API** in the settings menu

3. **Find the Anon Public Key**
   - Look for the section labeled **"Project API keys"**
   - You'll see two keys:
     - **`anon` `public`** ← This is what you need!
     - **`service_role` `secret`** ← This is what you have (wrong one)

4. **Copy the Anon Key**
   - Click the eye icon or copy button next to **`anon` `public`**
   - It will start with `eyJ...` (it's a JWT token)
   - It should have `"role":"anon"` when decoded (not `"role":"service_role"`)

## Visual Guide

In the Supabase Dashboard, you should see something like:

```
Project API keys

anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliY2luaXB1c2txZ3djenVvYnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODc0MzgsImV4cCI6MjA3NDc2MzQzOH0.xxxxx
[👁️ Reveal] [📋 Copy]

service_role secret
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliY2luaXB1c2txZ3djenVvYnloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE4NzQzOCwiZXhwIjoyMDc0NzYzNDM4fQ.xxxxx
[👁️ Reveal] [📋 Copy]
```

**Copy the `anon public` one, NOT the `service_role secret` one!**

## Update Your .env File

Once you have the anon key, update your `.env`:

```bash
VITE_SUPABASE_PROJECT_ID=ibcinipuskqgwczuobyh
VITE_SUPABASE_ANON_KEY=eyJ... (the anon public key, not service_role)
```

## Why This Matters

- **Anon key**: Safe for browser, respects RLS policies
- **Service role key**: Server-side only, bypasses all security, should NEVER be in browser code

## After Updating

1. Save `.env`
2. Restart dev server: `npm run dev`
3. The 401 errors should be gone!

