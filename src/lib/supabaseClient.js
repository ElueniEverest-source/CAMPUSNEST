import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL||"").replace(/[^\x20-\x7E]/g,"").trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY||"").replace(/[^\x20-\x7E]/g,"").trim()

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
