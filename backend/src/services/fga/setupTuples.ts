import { fgaClient } from './fgaClient.js';
import { OpenFgaClient } from '@openfga/sdk';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend directory (3 levels up: fga -> services -> src -> backend)
config({ path: resolve(__dirname, '../../../.env') });

/**
 * Setup Script: Write FGA Relationship Tuples
 *
 * This script writes the initial set of relationship tuples to Auth0 FGA.
 * Run this once after creating the authorization model.
 *
 * Usage:
 *   npx tsx src/services/fga/setupTuples.ts
 */

interface RelationshipTuple {
  user: string;
  relation: string;
  object: string;
}

/**
 * Relationship tuples for the demo
 *
 * IMPORTANT: Replace 'auth0|morty' with your actual Auth0 user ID
 * Get it by running "Who am I?" in the chat
 */
const tuples: RelationshipTuple[] = [
  // ============================================================
  // MORTY SMITH (EMP006) - Demo User
  // ============================================================

  // Morty can view his own payroll record
  {
    user: 'user:auth0|698bad5bfa139d574a640089', // << UPDATE THIS
    relation: 'viewer',
    object: 'payroll:EMP006',
  },

  // Morty is a member of Finance department
  {
    user: 'user:auth0|698bad5bfa139d574a640089', // << UPDATE THIS
    relation: 'member',
    object: 'department:finance',
  },

  // ============================================================
  // ALICE JOHNSON (EMP001) - Treasury Manager
  // ============================================================

  // Alice can view her own payroll
  {
    user: 'user:auth0|alice',
    relation: 'viewer',
    object: 'payroll:EMP001',
  },

  // Alice is manager of Treasury department
  {
    user: 'user:auth0|alice',
    relation: 'manager',
    object: 'department:treasury',
  },

  // Alice can execute bank transfers (treasury manager privilege)
  {
    user: 'user:auth0|alice',
    relation: 'executor',
    object: 'transfer:bank',
  },

  // Alice can view all treasury employees' payroll (EMP001, EMP002)
  {
    user: 'user:auth0|alice',
    relation: 'manager',
    object: 'payroll:EMP001',
  },
  {
    user: 'user:auth0|alice',
    relation: 'manager',
    object: 'payroll:EMP002',
  },

  // ============================================================
  // BOB SMITH (EMP002) - Treasury Employee
  // ============================================================

  // Bob can view his own payroll
  {
    user: 'user:auth0|bob',
    relation: 'viewer',
    object: 'payroll:EMP002',
  },

  // Bob is a member of Treasury department
  {
    user: 'user:auth0|bob',
    relation: 'member',
    object: 'department:treasury',
  },

  // ============================================================
  // CAROL WILLIAMS (EMP003) - Finance Manager
  // ============================================================

  // Carol can view her own payroll
  {
    user: 'user:auth0|carol',
    relation: 'viewer',
    object: 'payroll:EMP003',
  },

  // Carol is manager of Finance department
  {
    user: 'user:auth0|carol',
    relation: 'manager',
    object: 'department:finance',
  },

  // Carol can view all finance employees' payroll (EMP003, EMP006 = Morty)
  {
    user: 'user:auth0|carol',
    relation: 'manager',
    object: 'payroll:EMP003',
  },
  {
    user: 'user:auth0|carol',
    relation: 'manager',
    object: 'payroll:EMP006',
  },
];

/**
 * Write tuples to Auth0 FGA
 */
async function writeTuples() {
  console.log('🔐 Setting up Auth0 FGA relationship tuples...\n');

  // Debug: Show loaded environment variables
  console.log('Environment variables loaded:');
  console.log(`  FGA_STORE_ID: ${process.env.FGA_STORE_ID ? '✓ Found' : '✗ Missing'}`);
  console.log(`  FGA_CLIENT_ID: ${process.env.FGA_CLIENT_ID ? '✓ Found' : '✗ Missing'}`);
  console.log(`  FGA_CLIENT_SECRET: ${process.env.FGA_CLIENT_SECRET ? '✓ Found' : '✗ Missing'}`);
  console.log(`  FGA_API_URL: ${process.env.FGA_API_URL || '✗ Missing'}\n`);

  if (!process.env.FGA_STORE_ID) {
    console.error('❌ FGA_STORE_ID not configured in .env');
    process.exit(1);
  }

  // Create FGA client
  const apiUrl = process.env.FGA_API_URL!;
  const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const tokenIssuer = process.env.FGA_API_TOKEN_ISSUER || 'fga.us.auth0.com';
  const audience = process.env.FGA_API_AUDIENCE || 'https://api.us1.fga.dev/';

  console.log('FGA Configuration:');
  console.log(`  API URL: ${cleanApiUrl}`);
  console.log(`  Store ID: ${process.env.FGA_STORE_ID}`);
  console.log(`  Model ID: ${process.env.FGA_MODEL_ID || 'Not specified'}`);
  console.log(`  Token Issuer: ${tokenIssuer}`);
  console.log(`  Audience: ${audience}\n`);

  const client = new OpenFgaClient({
    apiUrl: cleanApiUrl,
    storeId: process.env.FGA_STORE_ID!,
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

  try {
    // Write all tuples
    console.log(`Writing ${tuples.length} relationship tuples...\n`);

    for (const tuple of tuples) {
      try {
        await client.write({
          writes: [tuple],
        });

        console.log(`✅ ${tuple.user} → ${tuple.relation} → ${tuple.object}`);
      } catch (error: any) {
        console.error(`❌ Failed to write tuple: ${error.message}`);
      }
    }

    console.log('\n✨ FGA relationship tuples setup complete!');
    console.log('\nYou can now test FGA checks:');
    console.log('  - Enable the FGA toggle in the UI');
    console.log('  - Try: "Show me the 2024 payroll"');
    console.log('  - You should only see records you have permission to view');
  } catch (error: any) {
    console.error('\n❌ Error setting up tuples:', error.message);
    process.exit(1);
  }
}

/**
 * List existing tuples (for debugging)
 */
async function listTuples() {
  console.log('📋 Listing existing FGA tuples...\n');

  const apiUrl = process.env.FGA_API_URL!;
  const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const tokenIssuer = process.env.FGA_API_TOKEN_ISSUER || 'fga.us.auth0.com';
  const audience = process.env.FGA_API_AUDIENCE || 'https://api.us1.fga.dev/';

  const client = new OpenFgaClient({
    apiUrl: cleanApiUrl,
    storeId: process.env.FGA_STORE_ID!,
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

  try {
    const response = await client.read();
    console.log('Existing tuples:');
    console.log(JSON.stringify(response.tuples, null, 2));
  } catch (error: any) {
    console.error('Error listing tuples:', error.message);
  }
}

// Run the script
const command = process.argv[2];

if (command === 'list') {
  listTuples();
} else {
  writeTuples();
}
