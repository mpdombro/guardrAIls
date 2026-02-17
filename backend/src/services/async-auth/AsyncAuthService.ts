import axios from 'axios';

/**
 * Auth0 CIBA (Client Initiated Backchannel Authentication) Service
 *
 * This service integrates with Auth0's CIBA implementation to:
 * 1. Initiate backchannel authentication requests for high-risk operations
 * 2. Send push notifications to users via Auth0 Guardian or other authenticators
 * 3. Poll for authentication results
 * 4. Manage approval workflow state
 */

export interface CIBARequest {
  authReqId: string; // Auth0 CIBA request ID
  userId: string;
  userEmail?: string;
  operation: string;
  details: {
    type: 'transfer' | 'payroll_access' | 'sensitive_operation';
    description: string;
    amount?: number;
    fromAccount?: string;
    toAccount?: string;
    reason?: string;
  };
  status: 'pending' | 'approved' | 'denied' | 'expired' | 'timeout';
  requestedAt: Date;
  respondedAt?: Date;
  expiresAt: Date;
  bindingMessage?: string; // Message shown to user in authenticator
  interval?: number; // Recommended polling interval in seconds (from Auth0)
}

class Auth0CIBAService {
  private domain: string;
  private clientId: string;
  private clientSecret: string;
  private audience: string;
  private pendingRequests: Map<string, CIBARequest> = new Map();

  constructor() {
    this.domain = process.env.AUTH0_DOMAIN || '';
    this.clientId = process.env.AUTH0_CLIENT_ID || '';
    this.clientSecret = process.env.AUTH0_CLIENT_SECRET || '';
    this.audience = process.env.AUTH0_AUDIENCE || '';

    if (!this.domain || !this.clientId || !this.clientSecret) {
      console.warn('⚠️  Auth0 CIBA not fully configured - async auth will be simulated');
    } else {
      console.log('✅ Auth0 CIBA Service initialized');
      console.log(`   Domain: ${this.domain}`);
      console.log(`   Client ID: ${this.clientId.substring(0, 8)}...`);
      console.log('   Will use real Auth0 CIBA for async authorization');
    }
  }

  /**
   * Initiate a CIBA request with Auth0
   */
  async initiateCIBARequest(
    userId: string,
    userEmail: string,
    operation: string,
    details: CIBARequest['details']
  ): Promise<CIBARequest> {
    const bindingMessage = this.createBindingMessage(operation, details);

    console.log('\n[Auth0 CIBA] Attempting to initiate CIBA request...');
    console.log(`  Domain: ${this.domain}`);
    console.log(`  User Email: ${userEmail}`);
    console.log(`  Binding Message: ${bindingMessage}`);

    try {
      // Initiate CIBA request via Auth0
      console.log(`[Auth0 CIBA] Calling https://${this.domain}/bc-authorize`);

      // Auth0 CIBA requires login_hint as a JSON string
      // Format: { "format": "iss_sub", "iss": "https://domain/", "sub": "auth0|..." }
      const loginHintJson = JSON.stringify({
        format: 'iss_sub',
        iss: `https://${this.domain}/`,
        sub: userId,
      });

      console.log(`[Auth0 CIBA] login_hint: ${loginHintJson}`);

      // Auth0 CIBA requires application/x-www-form-urlencoded
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'openid profile email',
        login_hint: loginHintJson,
        binding_message: bindingMessage,
      });

      const response = await axios.post(
        `https://${this.domain}/bc-authorize`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const authReqId = response.data.auth_req_id;
      const expiresIn = response.data.expires_in || 300; // Default 5 minutes
      const interval = response.data.interval || 5; // Recommended polling interval in seconds

      const request: CIBARequest = {
        authReqId,
        userId,
        userEmail,
        operation,
        details,
        status: 'pending',
        requestedAt: new Date(),
        expiresAt: new Date(Date.now() + expiresIn * 1000),
        bindingMessage,
        interval,
      };

      this.pendingRequests.set(authReqId, request);

      console.log(`✅ [Auth0 CIBA] Real CIBA request created: ${authReqId}`);
      console.log(`   Push notification sent to Guardian app for: ${userEmail}`);
      console.log(`   Expires in: ${expiresIn} seconds`);

      return request;
    } catch (error: any) {
      console.error('❌ [Auth0 CIBA] Failed to initiate real CIBA request');
      console.error(`   Status: ${error.response?.status || 'Network error'}`);
      console.error(`   Error: ${JSON.stringify(error.response?.data || error.message)}`);

      // Fallback: Create a simulated request
      const authReqId = `SIMULATED-${Date.now()}`;
      const request: CIBARequest = {
        authReqId,
        userId,
        userEmail,
        operation,
        details,
        status: 'pending',
        requestedAt: new Date(),
        expiresAt: new Date(Date.now() + 300000), // 5 minutes
        bindingMessage,
      };

      this.pendingRequests.set(authReqId, request);

      console.warn(`[Auth0 CIBA] Created simulated request: ${authReqId}`);
      return request;
    }
  }

  /**
   * Poll Auth0 for CIBA authentication result
   */
  async pollCIBAResult(authReqId: string): Promise<'approved' | 'denied' | 'pending' | 'expired'> {
    const request = this.pendingRequests.get(authReqId);

    if (!request) {
      return 'expired';
    }

    // Check if expired
    if (new Date() > request.expiresAt) {
      request.status = 'expired';
      this.pendingRequests.set(authReqId, request);
      return 'expired';
    }

    // If simulated request, return pending (will be approved manually via UI)
    if (authReqId.startsWith('SIMULATED-')) {
      console.log(`[Auth0 CIBA] Simulated request status check: ${request.status}`);
      return request.status === 'pending' ? 'pending' : request.status;
    }

    try {
      // Poll Auth0 token endpoint (real CIBA)
      console.log(`[Auth0 CIBA] Polling https://${this.domain}/oauth/token for ${authReqId}`);

      // Auth0 requires form-encoded data
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'urn:openid:params:grant-type:ciba',
        auth_req_id: authReqId,
      });

      const response = await axios.post(
        `https://${this.domain}/oauth/token`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // If we get a token, authentication succeeded
      if (response.data.access_token) {
        request.status = 'approved';
        request.respondedAt = new Date();
        this.pendingRequests.set(authReqId, request);
        console.log(`✅ [Auth0 CIBA] Request approved by user in Guardian: ${authReqId}`);
        return 'approved';
      }

      return 'pending';
    } catch (error: any) {
      const errorCode = error.response?.data?.error;

      if (errorCode === 'authorization_pending') {
        console.log(`⏳ [Auth0 CIBA] Still waiting for user response in Guardian...`);
        return 'pending';
      }

      if (errorCode === 'slow_down') {
        // Auth0 is telling us to slow down our polling
        // Increase the interval by 5 seconds as per CIBA spec
        const currentInterval = request.interval || 5;
        request.interval = currentInterval + 5;
        this.pendingRequests.set(authReqId, request);
        console.log(`⏳ [Auth0 CIBA] Rate limited - increasing interval to ${request.interval}s`);
        return 'pending';
      }

      if (errorCode === 'access_denied') {
        request.status = 'denied';
        request.respondedAt = new Date();
        this.pendingRequests.set(authReqId, request);
        console.log(`❌ [Auth0 CIBA] User denied request in Guardian: ${authReqId}`);
        return 'denied';
      }

      if (errorCode === 'expired_token') {
        request.status = 'expired';
        this.pendingRequests.set(authReqId, request);
        console.log(`⏱️ [Auth0 CIBA] Request expired: ${authReqId}`);
        return 'expired';
      }

      console.error('❌ [Auth0 CIBA] Poll error:', error.response?.data || error.message);
      return 'pending';
    }
  }

  /**
   * Wait for CIBA approval with polling
   */
  async waitForApproval(
    authReqId: string,
    maxWaitMs: number = 120000 // 2 minutes
  ): Promise<'approved' | 'denied' | 'timeout' | 'expired'> {
    const startTime = Date.now();
    const request = this.pendingRequests.get(authReqId);

    // Use the interval recommended by Auth0 (default 5 seconds)
    let pollIntervalMs = (request?.interval || 5) * 1000;
    console.log(`[Auth0 CIBA] Starting polling with ${pollIntervalMs / 1000}s interval`);

    while (Date.now() - startTime < maxWaitMs) {
      const result = await this.pollCIBAResult(authReqId);

      if (result === 'approved') {
        return 'approved';
      }

      if (result === 'denied') {
        return 'denied';
      }

      if (result === 'expired') {
        return 'expired';
      }

      // If we got slow_down error, the interval was increased by pollCIBAResult
      // Check if it was updated
      const updatedRequest = this.pendingRequests.get(authReqId);
      if (updatedRequest?.interval && updatedRequest.interval * 1000 > pollIntervalMs) {
        pollIntervalMs = updatedRequest.interval * 1000;
        console.log(`[Auth0 CIBA] Increased polling interval to ${pollIntervalMs / 1000}s`);
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    return 'timeout';
  }

  /**
   * Manually approve a simulated request (for demo purposes)
   */
  approveRequest(authReqId: string): boolean {
    const request = this.pendingRequests.get(authReqId);

    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'approved';
    request.respondedAt = new Date();
    this.pendingRequests.set(authReqId, request);

    console.log(`[Auth0 CIBA] Manually approved: ${authReqId}`);
    return true;
  }

  /**
   * Manually deny a simulated request (for demo purposes)
   */
  denyRequest(authReqId: string): boolean {
    const request = this.pendingRequests.get(authReqId);

    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'denied';
    request.respondedAt = new Date();
    this.pendingRequests.set(authReqId, request);

    console.log(`[Auth0 CIBA] Manually denied: ${authReqId}`);
    return true;
  }

  /**
   * Get a CIBA request by ID
   */
  getRequest(authReqId: string): CIBARequest | null {
    return this.pendingRequests.get(authReqId) || null;
  }

  /**
   * Get all pending requests for a user
   */
  getPendingRequestsForUser(userId: string): CIBARequest[] {
    const pending: CIBARequest[] = [];

    for (const request of this.pendingRequests.values()) {
      if (request.userId === userId && request.status === 'pending') {
        if (new Date() > request.expiresAt) {
          request.status = 'expired';
          this.pendingRequests.set(request.authReqId, request);
        } else {
          pending.push(request);
        }
      }
    }

    return pending;
  }

  /**
   * Check if operation requires approval
   */
  requiresApproval(
    operationType: string,
    details: { amount?: number; [key: string]: any }
  ): boolean {
    if (operationType === 'transfer') {
      // Transfers over $50,000 require approval
      return (details.amount || 0) > 50000;
    }

    if (operationType === 'sensitive_operation') {
      return true;
    }

    return false;
  }

  /**
   * Create binding message for CIBA request
   *
   * Auth0 CIBA only allows: alphanumerics, whitespace, and +-_.,:#
   * So we can't use $ or other special characters
   */
  private createBindingMessage(operation: string, details: CIBARequest['details']): string {
    // Sanitize helper - removes any characters not allowed by Auth0 CIBA
    const sanitize = (text: string) => text.replace(/[^\w\s+\-_.,:#]/g, '');

    if (details.type === 'transfer') {
      // Format amount without $ symbol (Auth0 restriction)
      const amount = details.amount?.toLocaleString() || '0';
      const toAccount = sanitize(details.toAccount || 'unknown');
      return `Approve transfer of ${amount} USD to ${toAccount}`;
    }

    // Sanitize description to only include allowed characters
    const sanitized = sanitize(details.description);
    return `Approve ${sanitize(operation)}: ${sanitized}`;
  }

  /**
   * Get Auth0 Management API token
   */
  private async getManagementToken(): Promise<string> {
    const response = await axios.post(
      `https://${this.domain}/oauth/token`,
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        audience: `https://${this.domain}/api/v2/`,
        grant_type: 'client_credentials',
      }
    );

    return response.data.access_token;
  }
}

// Singleton instance
export const asyncAuthService = new Auth0CIBAService();
