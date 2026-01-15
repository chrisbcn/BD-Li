/**
 * AI Configuration for VertexAI and Anthropic
 * Reads from environment variables with fallback for development
 */

const getEnvVar = (key: string, fallback: string = ''): string => {
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }
  return fallback;
};

export const aiConfig = {
  // Google VertexAI/Gemini Configuration
  vertexAI: {
    projectId: getEnvVar('VITE_GOOGLE_CLOUD_PROJECT_ID', ''),
    location: getEnvVar('VITE_GOOGLE_CLOUD_LOCATION', 'us-central1'),
    apiKey: getEnvVar('VITE_GOOGLE_AI_API_KEY', ''),
    model: getEnvVar('VITE_GEMINI_MODEL', 'gemini-pro'),
  },
  
  // Anthropic Configuration (fallback)
  anthropic: {
    apiKey: getEnvVar('VITE_ANTHROPIC_API_KEY', ''),
    model: getEnvVar('VITE_ANTHROPIC_MODEL', 'claude-3-5-sonnet-20241022'),
  },

  // Gmail API Configuration
  gmail: {
    clientId: getEnvVar('VITE_GOOGLE_CLIENT_ID', ''),
    apiKey: getEnvVar('VITE_GOOGLE_API_KEY', ''),
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  },

  // Slack API Configuration
  slack: {
    clientId: getEnvVar('VITE_SLACK_CLIENT_ID', ''),
    clientSecret: getEnvVar('VITE_SLACK_CLIENT_SECRET', ''),
    botToken: getEnvVar('VITE_SLACK_BOT_TOKEN', ''),
  },
} as const;

/**
 * Check if AI configuration is complete
 */
export function isAIConfigured(provider: 'gemini' | 'anthropic' | 'gmail' | 'slack'): boolean {
  switch (provider) {
    case 'gemini':
      return !!(aiConfig.vertexAI.apiKey || aiConfig.vertexAI.projectId);
    case 'anthropic':
      return !!aiConfig.anthropic.apiKey;
    case 'gmail':
      return !!aiConfig.gmail.clientId;
    case 'slack':
      return !!aiConfig.slack.botToken;
    default:
      return false;
  }
}

/**
 * Get the appropriate AI provider based on configuration
 */
export function getAvailableAIProvider(): 'gemini' | 'anthropic' | null {
  if (isAIConfigured('gemini')) return 'gemini';
  if (isAIConfigured('anthropic')) return 'anthropic';
  return null;
}

