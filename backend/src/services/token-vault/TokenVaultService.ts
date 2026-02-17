/**
 * Token Vault Service
 * Uses Auth0 Token Exchange to get Google tokens from Auth0's Token Vault
 *
 * When Token Vault is ON: Uses Token Exchange to get Google tokens from Auth0
 * When Token Vault is OFF: Rejects requests, requiring manual OAuth consent
 */

import axios from 'axios';
import {
  ExchangedToken,
  TokenExchangeError,
  TokenVaultOptions
} from './types';

export class TokenVaultService {
  private auth0Domain: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.auth0Domain = process.env.AUTH0_DOMAIN || '';
    this.clientId = process.env.AUTH0_TOKEN_VAULT_CLIENT_ID || '';
    this.clientSecret = process.env.AUTH0_TOKEN_VAULT_CLIENT_SECRET || '';

    if (!this.auth0Domain || !this.clientId || !this.clientSecret) {
      console.warn('[TokenVaultService] Auth0 Token Vault credentials not configured');
      console.warn('  Set AUTH0_TOKEN_VAULT_CLIENT_ID and AUTH0_TOKEN_VAULT_CLIENT_SECRET');
      console.warn('  These should be from your Custom API Client (created in Auth0 setup step 4)');
    }

    console.log('[TokenVaultService] Initialized with M2M client:', this.clientId);
  }

  /**
   * Get Google token using Auth0 My Account API
   *
   * This retrieves tokens from Auth0's Connected Accounts (Token Vault) by:
   * 1. Exchanging user's Auth0 token for My Account API token
   * 2. Calling /me/v1/connected-accounts to get Google access token
   *
   * @param options - Token vault options including auth0AccessToken and tokenVaultEnabled flag
   * @returns Google access token from Auth0's token vault
   * @throws TokenExchangeError if Token Vault is disabled or token not available
   */
  async getGoogleToken(options: TokenVaultOptions): Promise<ExchangedToken> {
    const { userId, scope, tokenVaultEnabled, auth0AccessToken } = options;

    // CRITICAL: If Token Vault is OFF, reject immediately
    if (!tokenVaultEnabled) {
      console.log('[TokenVaultService] Token Vault is DISABLED - rejecting request');
      throw new TokenExchangeError(
        'Token Vault is disabled. Enable Token Vault to use stored Google connections, or provide manual OAuth consent.',
        'VAULT_DISABLED',
        {
          message: 'Token Vault feature is turned off',
          requiresManualConsent: true
        }
      );
    }

    console.log(`[TokenVaultService] Retrieving Google token via Token Vault (user: ${userId})`);
    console.log(`[TokenVaultService] M2M Client: ${this.clientId}`);
    console.log(`[TokenVaultService] Connection: google-oauth2`);
    console.log(`[TokenVaultService] Requested scope: ${scope}`);

    try {
      // Use My Account API to access Connected Accounts (Token Vault)
      // Frontend already provides token with correct audience (NO token exchange needed)
      console.log('[TokenVaultService] Using My Account API token from request (no token exchange)');

      // myAccountToken is already provided from frontend with correct audience

      // Step 1: List connected accounts using My Account API
      console.log('[TokenVaultService] Step 1: Fetching connected accounts...');

      const accountsResponse = await axios.get(
        `https://${this.auth0Domain}/me/v1/connected-accounts`,
        {
          headers: {
            'Authorization': `Bearer ${myAccountToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const accounts = accountsResponse.data;
      console.log('[TokenVaultService] Found accounts:', JSON.stringify(accounts, null, 2));

      // Find Google OAuth2 connected account
      const googleAccount = accounts.find((account: any) => account.connection === 'google-oauth2');

      if (!googleAccount) {
        throw new TokenExchangeError(
          'Google Calendar is not connected. Please connect your Google account using the "Connect Google Calendar" button.',
          'CONNECTION_NOT_FOUND',
          {
            message: 'No google-oauth2 connected account found',
            requiresConnectionFlow: true,
            availableAccounts: accounts.map((a: any) => a.connection) || []
          }
        );
      }

      console.log('[TokenVaultService] Found Google connected account:', googleAccount.id);

      // Step 2: Request a fresh access token for this connected account
      console.log('[TokenVaultService] Step 2: Requesting access token for account:', googleAccount.id);

      const tokenResponse = await axios.post(
        `https://${this.auth0Domain}/me/v1/connected-accounts/${googleAccount.id}/access-token`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${myAccountToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const accessToken = tokenResponse.data.access_token;
      const expiresIn = tokenResponse.data.expires_in || 3600;

      if (!accessToken) {
        throw new TokenExchangeError(
          'Failed to get Google access token from Token Vault',
          'VAULT_ERROR',
          {
            message: 'No access_token returned from connected account',
            accountId: googleAccount.id
          }
        );
      }

      const expiresAt = new Date(Date.now() + expiresIn * 1000);
      console.log(`[TokenVaultService] ✓ Got Google access token, expires at ${expiresAt.toISOString()}`);

      return {
        token: accessToken,
        expiresAt,
        scope,
        userId
      };

    } catch (error: any) {
      console.error('[TokenVaultService] Token retrieval failed:', error.message);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const url = error.config?.url;

        console.error('[TokenVaultService] Auth0 Error Response:', {
          status,
          url,
          error: data?.error,
          error_description: data?.error_description,
          message: data?.message
        });

        // Log full response for debugging
        console.error('[TokenVaultService] Full error details:', JSON.stringify(data, null, 2));

        // Handle specific Auth0 errors
        if (status === 400 && data?.error === 'invalid_request') {
          throw new TokenExchangeError(
            `Token Vault request rejected: ${data?.error_description}`,
            'EXCHANGE_FAILED',
            {
              message: 'Invalid token exchange request',
              auth0Error: data,
              fix: 'Ensure Token Exchange grant is enabled on your M2M client'
            }
          );
        }

        if (status === 401 || status === 403) {
          // Check if this is during My Account token exchange or account access
          if (url?.includes('/me/v1/connected-accounts')) {
            throw new TokenExchangeError(
              'Google Calendar is not connected. Please connect your Google account.',
              'CONNECTION_NOT_FOUND',
              {
                message: 'Unable to access Connected Accounts',
                requiresConnectionFlow: true,
                auth0Error: data
              }
            );
          }

          throw new TokenExchangeError(
            'Not authorized to access Token Vault',
            'VAULT_ERROR',
            {
              message: 'Authorization failed for My Account API',
              auth0Error: data
            }
          );
        }

        if (status === 404) {
          throw new TokenExchangeError(
            'Google Calendar connection not found',
            'CONNECTION_NOT_FOUND',
            {
              message: 'Connected Account not found',
              requiresConnectionFlow: true,
              auth0Error: data
            }
          );
        }

        if (status === 400 && data?.error === 'invalid_grant') {
          throw new TokenExchangeError(
            'Google Calendar access expired. Please reconnect your Google account.',
            'CONNECTION_EXPIRED',
            {
              message: 'Connected account token expired',
              requiresReconnection: true,
              auth0Error: data
            }
          );
        }

        throw new TokenExchangeError(
          `Token retrieval failed: ${data?.error_description || data?.message || error.message}`,
          'EXCHANGE_FAILED',
          {
            status,
            auth0Error: data
          }
        );
      }

      // Re-throw if already a TokenExchangeError
      if (error instanceof TokenExchangeError) {
        throw error;
      }

      throw new TokenExchangeError(
        'Network error during token retrieval',
        'NETWORK_ERROR',
        {
          message: error.message,
          originalError: error
        }
      );
    }
  }
}

// Singleton instance
export const tokenVaultService = new TokenVaultService();
