# GuardR[AI]ls - Auth0 AI Security Demo

A production-quality AI agent demo showcasing Auth0's security features for AI applications with interactive "How it Works" visualizations.

## Overview

GuardR[AI]ls demonstrates the difference between unsecured and secured AI operations through visual security toggles and real-time educational diagrams:

- **Security Toggles OFF**: See how unsecured AI agents expose vulnerabilities
- **Security Toggles ON**: See Auth0 FGA, Token Vault, and CIBA protect your data
- **Interactive Diagrams**: Mermaid visualizations appear after operations showing exactly how Auth0 secured (or didn't secure) the request

## Key Features

- ✅ **Auth0 FGA**: Fine-grained authorization filtering RAG documents by user permissions
- ✅ **Token Vault**: Secure OAuth token storage for Google Calendar integration
- ✅ **CIBA**: Async authorization for high-risk operations (simulated)
- ✅ **Visual Education**: Real-time sequence diagrams, architecture diagrams, and FGA relationship graphs
- ✅ **Large Screen Optimized**: 56px fonts, 4px lines, designed for demos and presentations

## Technology Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS + ShadcnUI + Mermaid
- **Backend**: Express.js (Node 22) + TypeScript + LangChain.js
- **AI/LLM**: LiteLLM or OpenAI GPT models
- **Auth/Security**: Auth0 (React SDK, Node SDK, FGA SDK, Management API)

## Project Structure

```
guardrails/
├── frontend/               # React + Vite frontend with security diagrams
├── backend/                # Express backend with LangChain AI agent
├── SECURITY_ARCHITECTURE.md # Mermaid diagrams documentation
├── CLAUDE.md               # Detailed replication guide
└── AUTH0_*.md              # Auth0 setup guides
```

## Quick Start

### Prerequisites

- Node.js 22+
- npm 10+
- LiteLLM endpoint OR OpenAI API key
- Auth0 account with FGA enabled

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repo-url>
   cd guardrails
   npm install
   ```

2. **Configure environment variables**:
   - See [CLAUDE.md](CLAUDE.md) for detailed `.env` setup
   - Configure Auth0 Application, API, and FGA Store
   - Add LLM credentials

3. **Run the application**:
   ```bash
   npm run dev
   ```

This will start:
- Frontend at http://localhost:5173
- Backend at http://localhost:3001

### Detailed Setup

For complete step-by-step instructions including Auth0 configuration, see **[CLAUDE.md](CLAUDE.md)**

## Development

- `npm run dev` - Run all services concurrently
- `npm run dev:frontend` - Run frontend only
- `npm run dev:backend` - Run backend only
- `npm run dev:mcp` - Run MCP server only
- `npm run build` - Build all workspaces

## Implemented Features

- ✅ **Auth0 Authentication**: Full login/logout with user profile
- ✅ **Auth0 FGA**: Document filtering based on user permissions
- ✅ **Token Vault**: Secure OAuth token storage (simplified with Management API)
- ✅ **CIBA (Simulated)**: Async authorization for high-risk transfers
- ✅ **Interactive Diagrams**: 3 diagram types showing security flows
- ✅ **Mock Data**: Realistic payroll, calendar, and transfer data
- ✅ **Large Screen Ready**: Optimized for presentations and demos

**Current Status**: All features implemented and demo-ready

## Documentation

- **Demo & Presentation**
  - **[DEMO_GUIDE.md](DEMO_GUIDE.md)** - Complete step-by-step demonstration script with talking points

- **Setup & Configuration**
  - **[CLAUDE.md](CLAUDE.md)** - Complete replication guide with step-by-step instructions
  - [AUTH0_CIBA_SETUP.md](AUTH0_CIBA_SETUP.md) - CIBA configuration
  - [TOKEN_VAULT_SETUP_GUIDE.md](TOKEN_VAULT_SETUP_GUIDE.md) - Token Vault setup
  - [LITELLM-SETUP.md](LITELLM-SETUP.md) - LiteLLM configuration

- **Architecture**
  - **[SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md)** - Visual diagrams showing secured vs unsecured flows
  - FGA for RAG document filtering
  - Token Vault for OAuth management
  - CIBA for async authorization

## License

MIT
