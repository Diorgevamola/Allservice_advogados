import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// Basic client for client-side usage or simple server queries
export const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

// Helper to match the import in actions.ts
export function createClient() {
    return supabase;
}
