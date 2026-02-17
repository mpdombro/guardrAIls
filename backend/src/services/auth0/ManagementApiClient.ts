/**
 * Auth0 Management API Client
 * Client for accessing Auth0 Management API to retrieve user tokens from social connections
 */

import axios from 'axios';

export interface Auth0Identity {
  connection: string;
  provider: string;
  user_id: string;
  isSocial: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface Auth0User {
  user_id: string;
  email?: string;
  name?: string;
  identities: Auth0Identity[];
}

export class ManagementApiClient {
  private domain: string;
  private clientId: string;
  private clientSecret: string;
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.domain = process.env.AUTH0_DOMAIN || '';
    this.clientId = process.env.AUTH0_CLIENT_ID || '';
    this.clientSecret = process.env.AUTH0_CLIENT_SECRET || '';

    if (!this.domain || !this.clientId || !this.clientSecret) {
      console.warn('[ManagementApiClient] Auth0 credentials not configured');
    }
  }

  /**
   * Get Management API access token (M2M token)
   */
  private async getManagementToken(): Promise<string> {
    // Return cached token if still valid
    if (this.cachedToken && Date.now() < this.tokenExpiry) {
      return this.cachedToken;
    }

    console.log('[ManagementApiClient] Fetching new management token...');

    try {
      const response = await axios.post(
        `https://${this.domain}/oauth/token`,
        {
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          audience: `https://${this.domain}/api/v2/`
        }
      );

      const token = response.data.access_token;
      this.cachedToken = token;
      // Cache for 23 hours (tokens typically last 24h)
      this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;

      console.log('[ManagementApiClient] Management token acquired');
      return token;

    } catch (error) {
      console.error('[ManagementApiClient] Failed to get management token:', error);
      throw new Error('Failed to authenticate with Auth0 Management API');
    }
  }

  /**
   * Get user details including social identities
   */
  async getUserWithIdentities(userId: string): Promise<Auth0User> {
    const token = await this.getManagementToken();

    try {
      const response = await axios.get<Auth0User>(
        `https://${this.domain}/api/v2/users/${encodeURIComponent(userId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return response.data;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('[ManagementApiClient] Failed to get user:', {
          status: error.response?.status,
          data: error.response?.data
        });
      }
      throw new Error(`Failed to retrieve user ${userId} from Auth0`);
    }
  }

  /**
   * Get Google identity and access token for a user
   */
  async getGoogleIdentity(userId: string): Promise<Auth0Identity | null> {
    const user = await this.getUserWithIdentities(userId);

    // Find Google identity
    const googleIdentity = user.identities.find(
      identity => identity.provider === 'google-oauth2' || identity.connection === 'google-oauth2'
    );

    if (!googleIdentity) {
      console.log(`[ManagementApiClient] User ${userId} has no Google identity`);
      return null;
    }

    if (!googleIdentity.access_token) {
      console.log(`[ManagementApiClient] Google identity exists but no access token available`);
      return null;
    }

    console.log(`[ManagementApiClient] Found Google identity for user ${userId}`);
    return googleIdentity;
  }

  /**
   * Clear cached management token (for testing)
   */
  clearCache(): void {
    this.cachedToken = null;
    this.tokenExpiry = 0;
  }
}

// Singleton instance
export const managementApiClient = new ManagementApiClient();
