import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import chatRouter from './routes/chat.js';
import approvalsRouter from './routes/approvals.js';
import connectedAccountsRouter from './routes/connected-accounts.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'guardrails-backend',
    security: {
      openai: !!process.env.OPENAI_API_KEY,
      auth0: !!process.env.AUTH0_DOMAIN && !!process.env.AUTH0_AUDIENCE,
    },
  });
});

// Routes
app.use('/api/chat', chatRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/connected-accounts', connectedAccountsRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);

  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  Warning: OPENAI_API_KEY not set');
  }
});

export default app;
