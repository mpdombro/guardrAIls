import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { optionalAuth, getUserInfo } from '../middleware/auth.js';
import { GuardrAIlsAgent } from '../services/agent/GuardrAIlsAgent.js';
import type { ChatRequest, ChatResponse } from '../types/index.js';

const router = Router();

// Apply optional authentication middleware - allows both authenticated and unauthenticated requests
router.use(optionalAuth);
router.use(getUserInfo);

// Initialize the agent (singleton instance)
const agent = new GuardrAIlsAgent();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { message, securityFeatures, conversationHistory = [], metadata = {} }: ChatRequest = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Determine authentication status
    const userAuthenticated = !!req.user;
    const userId = req.user?.sub;
    const userEmail = req.user?.email;

    // Extract requireAuth flag from metadata
    const requireAuth = metadata.requireAuth === true;

    // Extract Auth0 access token for Token Vault operations
    let auth0Token: string | undefined;

    if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        auth0Token = authHeader.substring(7);
      }
    }

    // Log request
    const featuresEnabled = [];
    if (securityFeatures.fgaEnabled) featuresEnabled.push('FGA');
    if (securityFeatures.tokenVaultEnabled) featuresEnabled.push('TokenVault');
    if (securityFeatures.asyncAuthEnabled) featuresEnabled.push('AsyncAuth');
    const featuresStr = featuresEnabled.length > 0 ? featuresEnabled.join(', ') : 'None';

    if (userAuthenticated) {
      console.log(
        `[Security Features: ${featuresStr}] Chat from authenticated user: ${userId}`
      );
      console.log(`  User Email: ${userEmail || 'Not available in token'}`);
    } else {
      console.log(
        `[Security Features: ${featuresStr}] Chat from unauthenticated user`
      );
      console.log(`  Require Auth: ${requireAuth ? 'ON (blocking)' : 'OFF (permissive)'}`);
    }

    // Detect if this is a user identity question
    const isIdentityQuestion = /who\s+am\s+i|what'?s?\s+my\s+(user\s+)?(id|identity|name)|my\s+profile|my\s+account/i.test(
      message
    );

    // Process message with agent
    const agentResponse = await agent.processMessage(message, conversationHistory, {
      securityFeatures,
      userAuthenticated,
      userId,
      userEmail,
      auth0Token,
      requireAuth,  // Pass requireAuth flag to agent
    });

    // Detect if agent is requesting authentication
    const isAuthRequired = /cannot perform.*not logged in|authentication (is )?required|please log in/i.test(
      agentResponse
    );

    // Detect if user needs to connect Google account
    const requiresGoogleConnection = /connect your Google account|Click "Connect Google Calendar"|CONNECTION_NOT_FOUND/i.test(
      agentResponse
    );

    const chatResponse: ChatResponse = {
      message: agentResponse,
      securityEvents: [], // TODO: Add security events in later stages
      // Determine special type for UI rendering
      specialType: isIdentityQuestion && userAuthenticated
        ? 'user-profile'
        : requiresGoogleConnection && userAuthenticated
        ? 'connect-account-required'
        : isAuthRequired && !userAuthenticated
        ? 'login-required'
        : undefined,
      // Provide connection flow details if needed
      connectionFlow: requiresGoogleConnection ? {
        provider: 'google-oauth2',
        requiredScopes: [
          'https://www.googleapis.com/auth/calendar.events.readonly',
          'https://www.googleapis.com/auth/calendar.events'
        ]
      } : undefined
    };

    res.json(chatResponse);
  })
);

export default router;
