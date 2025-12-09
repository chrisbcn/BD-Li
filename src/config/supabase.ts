/**
 * Supabase configuration
 * Reads from environment variables with fallback to hardcoded values for development
 */

const getEnvVar = (key: string, fallback: string): string => {
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }
  return fallback;
};

export const supabaseConfig = {
  projectId: getEnvVar(
    'VITE_SUPABASE_PROJECT_ID',
    'ibcinipuskqgwczuobyh'
  ),
  anonKey: getEnvVar(
    'VITE_SUPABASE_ANON_KEY',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliY2luaXB1c2txZ3djenVvYnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODc0MzgsImV4cCI6MjA3NDc2MzQzOH0.hgQmhdeCfrgOFYPIvI0t6gSTs4viLqKQzysutHDLuds'
  ),
  functionName: 'make-server-4aa4529b',
} as const;

export const getSupabaseApiUrl = (): string => {
  return `https://${supabaseConfig.projectId}.supabase.co/functions/v1/${supabaseConfig.functionName}`;
};

