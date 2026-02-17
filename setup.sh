#!/bin/bash

# GuardrAIls Setup Script
# This script will prompt for configuration values and create all necessary .env files

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         GuardrAIls - Configuration Setup                   ║"
echo "║  Auth0 AI/MCP Security Demo - Environment Configuration    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to prompt for input with default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"

    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " value
        value="${value:-$default}"
    else
        read -p "$prompt: " value
    fi

    eval "$var_name='$value'"
}

# Function to prompt for secret input (hidden)
prompt_secret() {
    local prompt="$1"
    local var_name="$2"

    read -s -p "$prompt: " value
    echo ""
    eval "$var_name='$value'"
}

echo "This script will configure your GuardrAIls application."
echo "You'll need:"
echo "  1. An OpenAI API key (from https://platform.openai.com/api-keys)"
echo "  2. An Auth0 account (from https://auth0.com)"
echo "  3. Auth0 Application and API configured"
echo ""
print_info "See docs/auth0-setup.md for Auth0 configuration instructions"
echo ""

read -p "Press Enter to continue or Ctrl+C to exit..."
echo ""

# ============================================================================
# OpenAI Configuration
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. OpenAI Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "Get your API key from: https://platform.openai.com/api-keys"
echo ""

prompt_secret "Enter your OpenAI API key" OPENAI_API_KEY

if [ -z "$OPENAI_API_KEY" ]; then
    print_error "OpenAI API key is required"
    exit 1
fi

if [[ ! "$OPENAI_API_KEY" =~ ^sk- ]]; then
    print_warning "OpenAI API key should start with 'sk-'"
fi

print_success "OpenAI API key configured"
echo ""

# ============================================================================
# Auth0 Configuration
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  2. Auth0 Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "You need to create an Auth0 Application (SPA) and API first"
print_info "See: docs/auth0-setup.md"
echo ""

prompt_with_default "Enter your Auth0 domain (e.g., dev-abc123.us.auth0.com)" "" AUTH0_DOMAIN

if [ -z "$AUTH0_DOMAIN" ]; then
    print_error "Auth0 domain is required"
    exit 1
fi

# Remove https:// if user included it
AUTH0_DOMAIN="${AUTH0_DOMAIN#https://}"
AUTH0_DOMAIN="${AUTH0_DOMAIN#http://}"

prompt_with_default "Enter your Auth0 Client ID (from SPA application)" "" AUTH0_CLIENT_ID

if [ -z "$AUTH0_CLIENT_ID" ]; then
    print_error "Auth0 Client ID is required"
    exit 1
fi

prompt_with_default "Enter your Auth0 API Audience" "https://guardrails-api" AUTH0_AUDIENCE

if [ -z "$AUTH0_AUDIENCE" ]; then
    print_error "Auth0 Audience is required"
    exit 1
fi

print_success "Auth0 configuration collected"
echo ""

# ============================================================================
# Optional: Auth0 FGA Configuration (Stage 3+)
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  3. Auth0 FGA Configuration (Optional - for Stage 3+)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "FGA is needed for Stage 3 and later. You can skip this for now."
echo ""

read -p "Configure Auth0 FGA now? (y/N): " configure_fga

FGA_STORE_ID=""
FGA_CLIENT_ID=""
FGA_CLIENT_SECRET=""
FGA_API_URL="https://api.us1.fga.dev"

if [[ "$configure_fga" =~ ^[Yy]$ ]]; then
    prompt_with_default "Enter your FGA Store ID" "" FGA_STORE_ID
    prompt_with_default "Enter your FGA Client ID" "" FGA_CLIENT_ID
    prompt_secret "Enter your FGA Client Secret" FGA_CLIENT_SECRET
    prompt_with_default "Enter your FGA API URL" "https://api.us1.fga.dev" FGA_API_URL

    if [ -n "$FGA_STORE_ID" ]; then
        print_success "FGA configuration collected"
    fi
else
    print_info "Skipping FGA configuration (you can add it later)"
fi
echo ""

# ============================================================================
# Server Configuration
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  4. Server Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

prompt_with_default "Frontend port" "5173" FRONTEND_PORT
prompt_with_default "Backend port" "3001" BACKEND_PORT
prompt_with_default "MCP Server port" "3002" MCP_PORT

FRONTEND_URL="http://localhost:$FRONTEND_PORT"
BACKEND_URL="http://localhost:$BACKEND_PORT"
MCP_SERVER_URL="http://localhost:$MCP_PORT"

print_success "Server configuration set"
echo ""

# ============================================================================
# Create .env files
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Creating .env files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Root .env
cat > .env << EOF
# Root Environment Variables
# Generated by setup.sh on $(date)

# OpenAI
OPENAI_API_KEY=$OPENAI_API_KEY
EOF
print_success "Created .env"

# Frontend .env
cat > frontend/.env << EOF
# Frontend Environment Variables
# Generated by setup.sh on $(date)

VITE_API_URL=$BACKEND_URL

# Auth0
VITE_AUTH0_DOMAIN=$AUTH0_DOMAIN
VITE_AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID
VITE_AUTH0_AUDIENCE=$AUTH0_AUDIENCE
EOF
print_success "Created frontend/.env"

# Backend .env
cat > backend/.env << EOF
# Backend Environment Variables
# Generated by setup.sh on $(date)

# Server
PORT=$BACKEND_PORT
NODE_ENV=development
FRONTEND_URL=$FRONTEND_URL

# OpenAI
OPENAI_API_KEY=$OPENAI_API_KEY

# Auth0
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_AUDIENCE=$AUTH0_AUDIENCE
EOF

# Add FGA config if provided
if [ -n "$FGA_STORE_ID" ]; then
    cat >> backend/.env << EOF

# Auth0 FGA
FGA_STORE_ID=$FGA_STORE_ID
FGA_CLIENT_ID=$FGA_CLIENT_ID
FGA_CLIENT_SECRET=$FGA_CLIENT_SECRET
FGA_API_URL=$FGA_API_URL
EOF
else
    cat >> backend/.env << EOF

# Auth0 FGA (Stage 3+)
# FGA_STORE_ID=
# FGA_CLIENT_ID=
# FGA_CLIENT_SECRET=
# FGA_API_URL=https://api.us1.fga.dev
EOF
fi

cat >> backend/.env << EOF

# MCP Server
MCP_SERVER_URL=$MCP_SERVER_URL
EOF
print_success "Created backend/.env"

# MCP Server .env
cat > mcp-server/.env << EOF
# MCP Server Environment Variables
# Generated by setup.sh on $(date)

# Server
MCP_PORT=$MCP_PORT
NODE_ENV=development

# Auth0 (Stage 6+)
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_AUDIENCE=$AUTH0_AUDIENCE
EOF
print_success "Created mcp-server/.env"

echo ""

# ============================================================================
# Summary
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Configuration Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_success "All .env files have been created successfully"
echo ""
echo "Configuration Summary:"
echo "  • Frontend:  $FRONTEND_URL"
echo "  • Backend:   $BACKEND_URL"
echo "  • MCP:       $MCP_SERVER_URL"
echo "  • Auth0:     $AUTH0_DOMAIN"
echo "  • OpenAI:    Configured ✓"
if [ -n "$FGA_STORE_ID" ]; then
    echo "  • FGA:       Configured ✓"
else
    echo "  • FGA:       Not configured (add later for Stage 3)"
fi
echo ""

# ============================================================================
# Next Steps
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Install dependencies:"
echo "   ${BLUE}npm install${NC}"
echo ""
echo "2. Start the application:"
echo "   ${BLUE}npm run dev${NC}"
echo ""
echo "3. Open in browser:"
echo "   ${BLUE}$FRONTEND_URL${NC}"
echo ""
echo "4. Test the security toggle:"
echo "   • Toggle OFF → Ask 'Show me payroll' (unsecured)"
echo "   • Toggle ON  → Ask 'Show me payroll' (blocked without login)"
echo "   • Login      → Ask 'Show me payroll' (secured)"
echo ""
print_info "See STAGE2-REFACTORED-TESTING.md for detailed testing instructions"
echo ""

# ============================================================================
# Warnings
# ============================================================================
if [[ ! "$OPENAI_API_KEY" =~ ^sk-proj ]]; then
    print_warning "Your OpenAI API key format looks unusual. Make sure it's correct."
fi

if [[ "$AUTH0_DOMAIN" == *"auth0.com"* ]]; then
    print_success "Auth0 domain format looks good"
else
    print_warning "Auth0 domain should end with .auth0.com (e.g., dev-abc.us.auth0.com)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "Setup complete! You're ready to run GuardrAIls"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
