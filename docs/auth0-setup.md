# Auth0 Setup Guide for GuardrAIls

This guide will walk you through setting up Auth0 for the GuardrAIls application.

## Prerequisites

- An Auth0 account (sign up at https://auth0.com if you don't have one)
- Access to the Auth0 Dashboard

## Stage 2: Basic Authentication Setup

### Step 1: Create an Auth0 Application

1. Log in to your [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications** → **Applications**
3. Click **Create Application**
4. Configure:
   - **Name**: `GuardrAIls Frontend`
   - **Application Type**: Single Page Application
   - Click **Create**

### Step 2: Configure Application Settings

In your new application's settings:

1. **Allowed Callback URLs**:
   ```
   http://localhost:5173, http://localhost:5173/callback
   ```

2. **Allowed Logout URLs**:
   ```
   http://localhost:5173
   ```

3. **Allowed Web Origins**:
   ```
   http://localhost:5173
   ```

4. **Allowed Origins (CORS)**:
   ```
   http://localhost:5173
   ```

5. Click **Save Changes**

6. **Note down** these values (you'll need them):
   - Domain (e.g., `dev-xxx.us.auth0.com`)
   - Client ID

### Step 3: Create an Auth0 API

1. Navigate to **Applications** → **APIs**
2. Click **Create API**
3. Configure:
   - **Name**: `GuardrAIls API`
   - **Identifier**: `https://guardrails-api` (this will be your audience)
   - **Signing Algorithm**: RS256
   - Click **Create**

4. In the API settings:
   - Go to **Permissions** tab
   - Add these scopes:
     - `read:messages` - Read chat messages
     - `write:messages` - Send chat messages
   - Click **Add**

5. **Note down** the **Identifier** (Audience)

### Step 4: Configure Environment Variables

#### Frontend Environment (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3001
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://guardrails-api
```

#### Backend Environment (`backend/.env`)

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# OpenAI
OPENAI_API_KEY=your-openai-key

# Auth0
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://guardrails-api

# MCP Server
MCP_SERVER_URL=http://localhost:3002
```

Replace:
- `your-tenant.us.auth0.com` with your Auth0 domain
- `your-client-id` with your Application Client ID
- `your-openai-key` with your OpenAI API key

### Step 5: Test the Setup

1. Start the application:
   ```bash
   npm run dev
   ```

2. Open http://localhost:5173
3. Click the **Login** button
4. You should be redirected to Auth0's login page
5. Create a new account or log in
6. You should be redirected back to the application
7. Your name/email should appear in the header

### Step 6: Create Test Users (Optional)

1. In Auth0 Dashboard, go to **User Management** → **Users**
2. Click **Create User**
3. Create test users:
   - **Alice** (Treasury Admin): `alice@example.com`
   - **Bob** (Treasury Analyst): `bob@example.com`
4. Set passwords for each user

These users will be used for FGA testing in Stage 3+.

## Stage 3+: Advanced Setup (Coming Soon)

### Auth0 FGA Setup (Stage 3)
- Create FGA store
- Define authorization model
- Set up relationships

### CIBA Setup (Stage 5)
- Enable CIBA grant type
- Configure Auth0 Guardian
- Set up push notifications

### Token Vaulting (Stage 6)
- Configure token exchange
- Set up custom flows

## Troubleshooting

### "Callback URL mismatch" error
- Verify the callback URL in Auth0 matches your local dev URL
- Check for trailing slashes

### "Invalid audience" error
- Ensure the audience in frontend .env matches the API identifier exactly
- Check that you're using the identifier, not the API name

### "Unauthorized" on API calls
- Verify Auth0 domain and audience in backend .env
- Check that the access token is being sent in requests
- Look at browser console for token details

### CORS errors
- Ensure "Allowed Web Origins" includes your frontend URL
- Check CORS configuration in backend

## Verification Checklist

- [ ] Auth0 application created
- [ ] Callback URLs configured
- [ ] Auth0 API created with scopes
- [ ] Frontend .env configured with Auth0 credentials
- [ ] Backend .env configured with Auth0 domain and audience
- [ ] Can log in via Auth0
- [ ] User profile displays after login
- [ ] Can log out successfully
- [ ] Chat API requires authentication

## Next Steps

Once Stage 2 is working:
- **Stage 3**: Set up Auth0 FGA for authorization
- **Stage 4**: Implement security interceptors
- **Stage 5**: Add async authorization (CIBA)
- **Stage 6**: Implement token vaulting and MCP security

## Resources

- [Auth0 React SDK Documentation](https://auth0.com/docs/quickstart/spa/react)
- [Auth0 API Authentication](https://auth0.com/docs/secure/tokens/access-tokens)
- [express-oauth2-jwt-bearer Documentation](https://github.com/auth0/express-oauth2-jwt-bearer)
