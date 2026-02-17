#!/bin/bash

# Kill any existing servers
echo "🛑 Stopping existing servers..."
pkill -9 -f "tsx watch" 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Wait a moment
sleep 1

# Start the server
echo "🚀 Starting server..."
npm run dev
