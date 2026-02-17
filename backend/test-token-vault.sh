#!/bin/bash

# Token Vault Test Script
# Tests the Connected Accounts flow

echo "🔍 Token Vault Connection Test"
echo "================================"
echo ""

# Check if server is running
echo "1. Checking if backend is running..."
if curl -s http://localhost:3001/api/health > /dev/null; then
  echo "   ✅ Backend is running on port 3001"
else
  echo "   ❌ Backend is not running. Start it with: cd backend && npm run dev"
  exit 1
fi

echo ""
echo "2. You need an Auth0 access token to test."
echo "   Get it from your browser:"
echo "   - Open DevTools (F12)"
echo "   - Application → Local Storage → auth0 token"
echo "   - Copy the access token"
echo ""

read -p "Enter your Auth0 access token: " TOKEN

if [ -z "$TOKEN" ]; then
  echo "❌ No token provided. Exiting."
  exit 1
fi

echo ""
echo "3. Testing /api/connected-accounts/list..."
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/connected-accounts/list)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Request successful (200 OK)"
  echo ""
  echo "   Response:"
  echo "$BODY" | jq .

  # Check if accounts exist
  ACCOUNT_COUNT=$(echo "$BODY" | jq '.accounts | length')
  if [ "$ACCOUNT_COUNT" -gt "0" ]; then
    echo ""
    echo "   ✅ Found $ACCOUNT_COUNT connected account(s)!"
    echo "   🎉 Token Vault is configured and working!"
    echo ""
    echo "   Next steps:"
    echo "   1. Enable Token Vault toggle in your app"
    echo "   2. Ask AI: 'Show my calendar'"
    echo "   3. Check backend logs for token exchange flow"
  else
    echo ""
    echo "   ⚠️  No connected accounts found."
    echo ""
    echo "   You need to CONNECT Google Calendar:"
    echo "   1. Open your app (http://localhost:5173)"
    echo "   2. Click 'Connect Google Calendar' button"
    echo "   3. Complete OAuth flow in popup"
    echo "   4. Run this script again"
  fi
else
  echo "   ❌ Request failed (HTTP $HTTP_CODE)"
  echo ""
  echo "   Response:"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  echo ""
  echo "   Common issues:"
  echo "   - Token expired: Log out and log back in"
  echo "   - Wrong token: Make sure you copied the full token"
  echo "   - Server error: Check backend logs"
fi

echo ""
echo "================================"
