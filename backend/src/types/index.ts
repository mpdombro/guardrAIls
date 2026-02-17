export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface SecurityFeatures {
  fgaEnabled: boolean;
  tokenVaultEnabled: boolean;
  asyncAuthEnabled: boolean;
}

export interface ChatRequest {
  message: string;
  securityFeatures: SecurityFeatures;
  conversationHistory?: Message[];
  metadata?: {
    googleConnected?: boolean;
    requireAuth?: boolean;
    [key: string]: any;
  };
}

export interface ChatResponse {
  message: string;
  securityEvents?: SecurityEvent[];
  specialType?: 'user-profile' | 'pending-approval' | 'login-required' | 'connect-account-required';
  connectionFlow?: {
    provider: string;
    requiredScopes: string[];
  };
}

export interface SecurityEvent {
  id: string;
  type: 'fga-check' | 'token-exchange' | 'async-auth' | 'mcp-auth' | 'google_token_exchange' | 'google_calendar_view' | 'google_calendar_create';
  status: 'success' | 'failure' | 'pending';
  timestamp: Date;
  details: string;
  resource?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentConfig {
  openAiApiKey: string;
  securityEnabled: boolean;
}

// Google Calendar types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: number;
  isAllDay: boolean;
  location?: string;
  htmlLink?: string;
}

export interface ExchangedToken {
  token: string;
  expiresAt: Date;
  scope: string;
  userId: string;
}

export class TokenExchangeError extends Error {
  constructor(
    message: string,
    public code: 'CONNECTION_EXPIRED' | 'CONNECTION_NOT_FOUND' | 'VAULT_DISABLED' | 'VAULT_ERROR' | 'EXCHANGE_FAILED' | 'INVALID_SCOPE' | 'NETWORK_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'TokenExchangeError';
  }
}

// Tool security context
export interface ToolSecurityContext {
  securityFeatures: SecurityFeatures;
  userAuthenticated: boolean;
  userId?: string;
  auth0Token?: string;
}
