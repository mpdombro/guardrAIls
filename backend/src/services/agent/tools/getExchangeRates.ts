import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3002';

export const getExchangeRatesTool = new DynamicStructuredTool({
  name: 'get_exchange_rates',
  description:
    'Get current foreign exchange rates from the MCP server. Use this when the user asks about exchange rates, currency conversion, or forex rates.',
  schema: z.object({
    baseCurrency: z
      .string()
      .optional()
      .default('USD')
      .describe('Base currency code (default: USD)'),
  }),
  func: async ({ baseCurrency = 'USD' }) => {
    try {
      const response = await axios.get(`${MCP_SERVER_URL}/api/exchange-rates`, {
        params: { base: baseCurrency },
      });

      const rates = response.data.rates;

      return JSON.stringify({
        success: true,
        data: {
          baseCurrency,
          rates,
          timestamp: response.data.timestamp,
        },
        message: `Current exchange rates (base: ${baseCurrency}): EUR: ${rates.USD_EUR}, GBP: ${rates.USD_GBP}, JPY: ${rates.USD_JPY}`,
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: 'Failed to retrieve exchange rates from MCP server',
        message: `Error: ${error.message}`,
      });
    }
  },
});
