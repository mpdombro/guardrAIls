/**
 * Connected Accounts Routes
 * Endpoints for managing Auth0 Connected Accounts (Token Vault)
 */

import { Router } from 'express';
import axios from 'axios';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, getUserInfo } from '../middleware/auth.js';

const router = Router();

// Apply authentication middleware - connected accounts require authentication
router.use(requireAuth);
router.use(getUserInfo);

/**
 * POST /api/connected-accounts/connect
 * Initiate Google account connection flow
 */
router.post(
  '/connect',
  asyncHandler(async (req, res) => {
    const userId = req.user?.sub;
    const { provider, scopes, redirectUri } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!provider || !redirectUri) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'provider and redirectUri are required'
      });
    }

    console.log(`[ConnectedAccounts] User ${userId} initiating ${provider} connection`);

    try {
      // Get user's access token from request
      const userAccessToken = req.headers.authorization?.replace('Bearer ', '');

      if (!userAccessToken) {
        return res.status(401).json({ error: 'Access token not found' });
      }

      // Step 1: Exchange user's token for My Account API token
      const auth0Domain = process.env.AUTH0_DOMAIN || '';
      const clientId = process.env.AUTH0_TOKEN_VAULT_CLIENT_ID || '';
      const clientSecret = process.env.AUTH0_TOKEN_VAULT_CLIENT_SECRET || '';

      console.log('[ConnectedAccounts] Exchanging for My Account API token...');

      const tokenExchangeResponse = await axios.post(
        `https://${auth0Domain}/oauth/token`,
        new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
          subject_token_type: 'urn:ietf:params:oauth:token-type:refresh_token',
          subject_token: userAccessToken,
          audience: `https://${auth0Domain}/me/`,
          scope: 'create:connected_accounts',
          client_id: clientId,
          client_secret: clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const myAccountToken = tokenExchangeResponse.data.access_token;

      // Step 2: Initiate connection flow
      console.log('[ConnectedAccounts] Initiating connection flow...');

      const connectionData = {
        connection: provider,
        redirect_uri: redirectUri,
        state: `connect_${Date.now()}`,
        ...(scopes && { scope: scopes })
      };

      const connectResponse = await axios.post(
        `https://${auth0Domain}/me/v1/connected-accounts/connect`,
        connectionData,
        {
          headers: {
            'Authorization': `Bearer ${myAccountToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('[ConnectedAccounts] Connection initiated successfully');

      // Return the authorization URL and session info
      res.json({
        success: true,
        connectUri: connectResponse.data.connect_uri,
        authSession: connectResponse.data.auth_session,
        ticket: connectResponse.data.ticket,
        state: connectionData.state
      });

    } catch (error) {
      console.error('[ConnectedAccounts] Error initiating connection:', error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        console.error('[ConnectedAccounts] Error details:', { status, data });

        return res.status(status || 500).json({
          success: false,
          error: 'Connection failed',
          message: data?.error_description || data?.message || 'Failed to initiate account connection',
          details: data
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal error',
        message: 'An unexpected error occurred'
      });
    }
  })
);

/**
 * POST /api/connected-accounts/complete
 * Complete the Google account connection flow
 */
router.post(
  '/complete',
  asyncHandler(async (req, res) => {
    const userId = req.user?.sub;
    const { connectCode, authSession, redirectUri } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!connectCode || !authSession || !redirectUri) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'connectCode, authSession, and redirectUri are required'
      });
    }

    console.log(`[ConnectedAccounts] User ${userId} completing connection`);

    try {
      // Get user's access token
      const userAccessToken = req.headers.authorization?.replace('Bearer ', '');

      if (!userAccessToken) {
        return res.status(401).json({ error: 'Access token not found' });
      }

      // Step 1: Exchange for My Account API token
      const auth0Domain = process.env.AUTH0_DOMAIN || '';
      const clientId = process.env.AUTH0_TOKEN_VAULT_CLIENT_ID || '';
      const clientSecret = process.env.AUTH0_TOKEN_VAULT_CLIENT_SECRET || '';

      const tokenExchangeResponse = await axios.post(
        `https://${auth0Domain}/oauth/token`,
        new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
          subject_token_type: 'urn:ietf:params:oauth:token-type:refresh_token',
          subject_token: userAccessToken,
          audience: `https://${auth0Domain}/me/`,
          scope: 'create:connected_accounts',
          client_id: clientId,
          client_secret: clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const myAccountToken = tokenExchangeResponse.data.access_token;

      // Step 2: Complete the connection
      console.log('[ConnectedAccounts] Completing connection...');

      const completeResponse = await axios.post(
        `https://${auth0Domain}/me/v1/connected-accounts/complete`,
        {
          connect_code: connectCode,
          auth_session: authSession,
          redirect_uri: redirectUri
        },
        {
          headers: {
            'Authorization': `Bearer ${myAccountToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('[ConnectedAccounts] Connection completed successfully');

      res.json({
        success: true,
        account: completeResponse.data
      });

    } catch (error) {
      console.error('[ConnectedAccounts] Error completing connection:', error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        console.error('[ConnectedAccounts] Error details:', { status, data });

        return res.status(status || 500).json({
          success: false,
          error: 'Connection failed',
          message: data?.error_description || data?.message || 'Failed to complete account connection',
          details: data
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal error',
        message: 'An unexpected error occurred'
      });
    }
  })
);

/**
 * GET /api/connected-accounts/list
 * List user's connected accounts
 */
router.get(
  '/list',
  asyncHandler(async (req, res) => {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
      const userAccessToken = req.headers.authorization?.replace('Bearer ', '');

      if (!userAccessToken) {
        return res.status(401).json({ error: 'Access token not found' });
      }

      const auth0Domain = process.env.AUTH0_DOMAIN || '';
      const clientId = process.env.AUTH0_TOKEN_VAULT_CLIENT_ID || '';
      const clientSecret = process.env.AUTH0_TOKEN_VAULT_CLIENT_SECRET || '';

      // Exchange for My Account API token
      const tokenExchangeResponse = await axios.post(
        `https://${auth0Domain}/oauth/token`,
        new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
          subject_token_type: 'urn:ietf:params:oauth:token-type:refresh_token',
          subject_token: userAccessToken,
          audience: `https://${auth0Domain}/me/`,
          scope: 'read:connected_accounts',
          client_id: clientId,
          client_secret: clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const myAccountToken = tokenExchangeResponse.data.access_token;

      // Get connected accounts
      const accountsResponse = await axios.get(
        `https://${auth0Domain}/me/v1/connected-accounts`,
        {
          headers: {
            'Authorization': `Bearer ${myAccountToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      res.json({
        success: true,
        accounts: accountsResponse.data
      });

    } catch (error) {
      console.error('[ConnectedAccounts] Error listing accounts:', error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        return res.status(status || 500).json({
          success: false,
          error: 'Failed to list accounts',
          message: data?.message || 'Could not retrieve connected accounts',
          details: data
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal error',
        message: 'An unexpected error occurred'
      });
    }
  })
);

export default router;
