import { OpenFgaClient } from '@openfga/sdk';
import { config } from 'dotenv';

config();

/**
 * Auth0 FGA (Fine-Grained Authorization) Client
 *
 * This service connects to Auth0 FGA to perform authorization checks
 * based on relationship tuples defined in the authorization model.
 */

export interface FGACheckRequest {
  user: string; // e.g., "user:auth0|123"
  relation: string; // e.g., "viewer", "manager"
  object: string; // e.g., "payroll:EMP006"
}

export interface FGACheckResponse {
  allowed: boolean;
  checkedAt: Date;
}

class FGAClientService {
  private client: OpenFgaClient | null = null;
  private storeId: string;
  private isEnabled: boolean = false;

  constructor() {
    this.storeId = process.env.FGA_STORE_ID || '';

    // Check if FGA is properly configured
    if (
      process.env.FGA_STORE_ID &&
      process.env.FGA_CLIENT_ID &&
      process.env.FGA_CLIENT_SECRET &&
      process.env.FGA_API_URL
    ) {
      this.initializeClient();
      this.isEnabled = true;
    } else {
      console.warn('⚠️  Auth0 FGA not configured. FGA features will be disabled.');
    }
  }

  /**
   * Initialize the OpenFGA client with Auth0 credentials
   */
  private initializeClient() {
    try {
      const apiUrl = process.env.FGA_API_URL!;
      // Remove trailing slash if present
      const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

      // Use the correct token issuer and audience from Auth0 FGA
      const tokenIssuer = process.env.FGA_API_TOKEN_ISSUER || 'fga.us.auth0.com';
      const audience = process.env.FGA_API_AUDIENCE || 'https://api.us1.fga.dev/';

      this.client = new OpenFgaClient({
        apiUrl: cleanApiUrl,
        storeId: this.storeId,
        credentials: {
          method: 'client_credentials',
          config: {
            clientId: process.env.FGA_CLIENT_ID!,
            clientSecret: process.env.FGA_CLIENT_SECRET!,
            apiTokenIssuer: tokenIssuer,
            apiAudience: audience,
          },
        },
      });

      console.log('✅ Auth0 FGA client initialized');
      console.log(`   Store ID: ${this.storeId}`);
      console.log(`   API URL: ${cleanApiUrl}`);
      console.log(`   Token Issuer: ${tokenIssuer}`);
    } catch (error: any) {
      console.error('❌ Failed to initialize FGA client');
      console.error(`   Error: ${error.message}`);
      console.error('   FGA features will be disabled - checks will return false');
      this.isEnabled = false;
    }
  }

  /**
   * Check if a user has permission to perform an action on a resource
   *
   * @example
   * check({
   *   user: "user:auth0|123",
   *   relation: "viewer",
   *   object: "payroll:EMP006"
   * })
   */
  async check(request: FGACheckRequest): Promise<FGACheckResponse> {
    if (!this.isEnabled || !this.client) {
      console.warn('FGA check skipped - client not enabled');
      return {
        allowed: false,
        checkedAt: new Date(),
      };
    }

    try {
      const response = await this.client.check({
        user: request.user,
        relation: request.relation,
        object: request.object,
      });

      console.log(
        `[FGA Check] ${request.user} ${request.relation} ${request.object} = ${response.allowed}`
      );

      return {
        allowed: response.allowed || false,
        checkedAt: new Date(),
      };
    } catch (error: any) {
      console.error('[FGA Check Error]', error.message);
      return {
        allowed: false,
        checkedAt: new Date(),
      };
    }
  }

  /**
   * Check if user can view a specific employee's payroll data
   *
   * Checks: user:X can view payroll:EMPYYY
   */
  async canViewPayroll(auth0UserId: string, employeeId: string): Promise<boolean> {
    const result = await this.check({
      user: `user:${auth0UserId}`,
      relation: 'viewer',
      object: `payroll:${employeeId}`,
    });

    return result.allowed;
  }

  /**
   * Check if user can execute bank transfers
   *
   * Checks: user:X can execute transfer:bank
   */
  async canExecuteTransfer(auth0UserId: string): Promise<boolean> {
    const result = await this.check({
      user: `user:${auth0UserId}`,
      relation: 'executor',
      object: 'transfer:bank',
    });

    return result.allowed;
  }

  /**
   * Check if user is a manager of a department
   *
   * Checks: user:X is manager of department:finance
   */
  async isManagerOfDepartment(
    auth0UserId: string,
    department: string
  ): Promise<boolean> {
    const result = await this.check({
      user: `user:${auth0UserId}`,
      relation: 'manager',
      object: `department:${department.toLowerCase()}`,
    });

    return result.allowed;
  }

  /**
   * Check if FGA is enabled and configured
   */
  isConfigured(): boolean {
    return this.isEnabled;
  }
}

// Singleton instance
export const fgaClient = new FGAClientService();
