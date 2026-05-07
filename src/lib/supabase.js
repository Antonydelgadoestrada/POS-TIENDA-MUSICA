import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const DB_ENABLED = Boolean(url && key);
export const supabase   = DB_ENABLED ? createClient(url, key) : null;

// Diagnóstico visible en consola para verificar si las vars están presentes
console.log('[Supabase] DB_ENABLED:', DB_ENABLED, '| URL:', url ? url.slice(0, 30) + '...' : 'MISSING');
