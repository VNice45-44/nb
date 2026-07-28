import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL?.trim() ||
  import.meta.env.SUPABASE_URL?.trim() ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  ''
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  import.meta.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  ''

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null

export function useSupabaseClient() {
  return {
    supabase,
    backendUrl: SUPABASE_URL,
    hasSupabaseCredentials: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  }
}
