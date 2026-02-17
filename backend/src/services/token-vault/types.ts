/**
 * Token Vault Types
 * Types for Auth0 Token Exchange and caching
 */

export interface ExchangedToken {
  token: string;
  expiresAt: Date;
  scope: string;
  userId: string;
}

export interface TokenCacheEntry {
  token: string;
  expiresAt: Date;
  scope: string;
}

export interface TokenExchangeResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export class TokenExchangeError extends Error {
  constructor(
    message: string,
    public code: 'CONNECTION_EXPIRED' | 'CONNECTION_NOT_FOUND' | 'VAULT_DISABLED' | 'VAULT_ERROR' | 'EXCHANGE_FAILED' | 'INVALID_SCOPE' | 'NETWORK_ERROR' | 'INVALID_TOKEN',
    public details?: unknown
  ) {
    super(message);
    this.name = 'TokenExchangeError';
  }
}

export interface TokenVaultOptions {
  userId: string;
  scope: string;
  tokenVaultEnabled: boolean;
  auth0AccessToken: string; // User's Auth0 access token
}
