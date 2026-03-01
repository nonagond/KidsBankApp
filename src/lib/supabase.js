import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || url.includes('your-project-id') || !key || key.includes('your-anon-key')) {
  console.error('⚠️  Missing Supabase credentials. Update .env.local with your project URL and anon key.')
}

export const supabase = createClient(url, key)
