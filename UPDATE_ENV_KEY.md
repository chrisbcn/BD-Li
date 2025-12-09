# Update Your .env File

## New Supabase Key Format

Supabase has updated their API keys! They now use:
- **Publishable key** (for browser) - starts with `sb_publishable_`
- **Secret key** (for server) - starts with `sb_secret_`

## Update Your .env File

Replace your current `.env` file with:

```bash
# Supabase Configuration for supabase-indigo-umbrella
VITE_SUPABASE_PROJECT_ID=ibcinipuskqgwczuobyh
VITE_SUPABASE_ANON_KEY=sb_publishable_CEgf1qMN-FrIRskq0FmAFw_EpGTfd7R
```

## Important Notes

- The **publishable key** is safe to use in the browser (equivalent to the old anon key)
- The **secret key** should NEVER be in browser code
- After updating, restart your dev server: `npm run dev`

## If You See "Legacy" Tab

If you see a "Legacy anon, service_role API keys" tab in Supabase, you can use those old-style keys too, but the new publishable/secret format is recommended.

