import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client public (utilisé côté client / mobile)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client admin (utilisé uniquement côté serveur Next.js — contourne les RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
