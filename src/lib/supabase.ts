import { createClient } from '@supabase/supabase-js';

// Usamos strings de fallback para que Vercel no rompa la compilación
// si las variables de entorno aún no están configuradas correctamente.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fallback.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
