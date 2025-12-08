/**
 * Supabase Client
 * Creates and exports the Supabase client for database operations
 */

import { createClient } from '@jsr/supabase__supabase-js';
import { supabaseConfig } from '../config/supabase';

const supabaseUrl = `https://${supabaseConfig.projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, supabaseConfig.anonKey, {
  auth: {
    persistSession: false, // We're not using auth for now
  },
});

