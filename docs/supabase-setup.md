# Supabase Setup

Run `supabase/valueon_projects.sql` in the Supabase SQL editor.

Set these environment variables in local development and Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_VALUEON_PROJECT_ID=default
NEXT_PUBLIC_SUPABASE_PROJECTS_TABLE=valueon_projects
```

This app is currently deployed as a static Next export, so it writes to
Supabase directly from the browser using the anon key. The SQL file includes
anonymous read/insert/update policies for `valueon_projects`.

For production access control, add Supabase Auth and replace the public policies
with user- or project-scoped policies. Until then, anyone with the app URL can
read or write the shared project row.

If Supabase is not configured, the app keeps using the browser `localStorage`
fallback so existing screens continue to work.
