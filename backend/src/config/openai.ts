import { config } from 'dotenv';

config();

// LiteLLM Configuration
const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL;
const LITELLM_API_KEY = process.env.LITELLM_API_KEY;
const LITELLM_MODEL = process.env.LITELLM_MODEL || 'gpt-4';

if (!LITELLM_BASE_URL) {
  throw new Error('LITELLM_BASE_URL is required in environment variables');
}

if (!LITELLM_API_KEY) {
  throw new Error('LITELLM_API_KEY is required in environment variables');
}

export const openaiConfig = {
  apiKey: LITELLM_API_KEY,
  baseURL: LITELLM_BASE_URL,
  model: LITELLM_MODEL,
  temperature: 0.7,
  maxTokens: 1000,
};

// Log configuration on startup
console.log(`🔗 Using LiteLLM at: ${openaiConfig.baseURL}`);
console.log(`🤖 Model: ${openaiConfig.model}`);
