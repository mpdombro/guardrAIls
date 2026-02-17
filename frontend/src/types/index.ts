export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  securityBadge?: SecurityBadge;
  specialType?: 'user-profile' | 'pending-approval' | 'login-required' | 'connect-account-required';
  connectionFlow?: {
    provider: string;
    requiredScopes: string[];
  };
}

export interface SecurityBadge {
  type: 'fga' | 'async-auth' | 'token-vault' | 'mcp-auth';
  status: 'passed' | 'denied' | 'pending' | 'approved';
  details?: string;
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
  type: 'fga-check' | 'token-exchange' | 'async-auth' | 'mcp-auth';
  status: 'success' | 'failure' | 'pending';
  timestamp: Date;
  details: string;
  resource?: string;
}

export interface SecurityToggleState {
  enabled: boolean;
  features: {
    fga: boolean;
    asyncAuth: boolean;
    tokenVault: boolean;
    mcpAuth: boolean;
  };
}
