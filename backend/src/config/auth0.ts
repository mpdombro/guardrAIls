import { config } from 'dotenv';

config();

export const auth0Config = {
  domain: process.env.AUTH0_DOMAIN || '',
  audience: process.env.AUTH0_AUDIENCE || '',
};

if (!auth0Config.domain || !auth0Config.audience) {
  console.warn('⚠️  Warning: AUTH0_DOMAIN or AUTH0_AUDIENCE not set in environment variables');
  console.warn('   Authentication will not work until these are configured.');
}
