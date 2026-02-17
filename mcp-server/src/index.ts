import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

config();

const app = express();
const PORT = process.env.MCP_PORT || 3002;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'guardrails-mcp-server',
  });
});

// Exchange rates endpoint (placeholder for Stage 6)
app.get('/api/exchange-rates', (req, res) => {
  res.json({
    rates: {
      USD_EUR: 0.92,
      USD_GBP: 0.79,
      USD_JPY: 149.50,
    },
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🔧 MCP Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
