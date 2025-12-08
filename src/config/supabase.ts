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
    'arbfeygvxnksqhgbpfpc'
  ),
  anonKey: getEnvVar(
    'VITE_SUPABASE_ANON_KEY',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyYmZleWd2eG5rc3FoZ2JwZnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzE5MDMsImV4cCI6MjA3NTM0NzkwM30.hMY57ZriQlpXvo4RTYuIVkjHc5e8NKmQH1jnHRtZuww'
  ),
  functionName: 'make-server-4aa4529b',
} as const;

export const getSupabaseApiUrl = (): string => {
  return `https://${supabaseConfig.projectId}.supabase.co/functions/v1/${supabaseConfig.functionName}`;
};

