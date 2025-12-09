/**
 * Supabase Client
 * Creates and exports the Supabase client for database operations
 */

import { createClient } from '@jsr/supabase__supabase-js';
import { supabaseConfig } from '../config/supabase';

const supabaseUrl = `https://${supabaseConfig.projectId}.supabase.co`;

// Debug: Log what we're using (first 20 chars only for security)
console.log('Supabase Config:', {
  projectId: supabaseConfig.projectId,
  anonKeyPrefix: supabaseConfig.anonKey.substring(0, 20) + '...',
  anonKeyLength: supabaseConfig.anonKey.length,
  url: supabaseUrl,
  keyStartsWithEyJ: supabaseConfig.anonKey.startsWith('eyJ'),
  keyStartsWithSb: supabaseConfig.anonKey.startsWith('sb_'),
});

export const supabase = createClient(supabaseUrl, supabaseConfig.anonKey, {
  auth: {
    persistSession: false, // We're not using auth for now
  },
});

