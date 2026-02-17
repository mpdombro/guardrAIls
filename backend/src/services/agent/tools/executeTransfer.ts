import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { simulateTransfer, getBankAccount } from '../../data/treasury.js';

export const executeTransferTool = new DynamicStructuredTool({
  name: 'execute_transfer',
  description:
    'Execute a bank transfer from one account to another. This is a high-value operation that moves money. Use this when the user asks to transfer funds, send money, or make a payment.',
  schema: z.object({
    fromAccountId: z
      .string()
      .describe('Source account ID (e.g., ACC001, ACC002, ACC003)'),
    toAccount: z.string().describe('Destination account name or identifier'),
    amount: z.number().describe('Amount to transfer in USD'),
    description: z.string().describe('Description or purpose of the transfer'),
  }),
  func: async ({ fromAccountId, toAccount, amount, description }) => {
    // Get source account details
    const sourceAccount = getBankAccount(fromAccountId);
    if (!sourceAccount) {
      return JSON.stringify({
        success: false,
        error: `Source account ${fromAccountId} not found`,
      });
    }

    // Execute the transfer
    const result = simulateTransfer(fromAccountId, toAccount, amount, description);

    if (result.success) {
      return JSON.stringify({
        success: true,
        data: {
          transactionId: result.transactionId,
          amount,
          from: sourceAccount.accountName,
          to: toAccount,
          description,
          newBalance: sourceAccount.balance,
        },
        message: `Successfully transferred $${amount.toLocaleString()} from ${
          sourceAccount.accountName
        } to ${toAccount}. Transaction ID: ${result.transactionId}. New balance: $${sourceAccount.balance.toLocaleString()}`,
      });
    } else {
      return JSON.stringify({
        success: false,
        error: result.error,
        message: `Transfer failed: ${result.error}`,
      });
    }
  },
});
