import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { openaiConfig } from '../../config/openai.js';
import { createViewPayrollTool } from './tools/createViewPayrollTool.js';
import { executeTransferTool } from './tools/executeTransfer.js';
import { getExchangeRatesTool } from './tools/getExchangeRates.js';
import { createViewCalendarTool } from './tools/createViewCalendarTool.js';
import { createCreateEventTool } from './tools/createCreateEventTool.js';
import { formatToOpenAIFunction } from 'langchain/tools';
import { OpenAIFunctionsAgentOutputParser } from 'langchain/agents/openai/output_parser';
import { RunnableSequence } from '@langchain/core/runnables';
import { asyncAuthService } from '../async-auth/AsyncAuthService.js';
import { simulateTransfer } from '../data/treasury.js';

export interface SecurityFeatures {
  fgaEnabled: boolean;
  tokenVaultEnabled: boolean;
  asyncAuthEnabled: boolean;
}

export interface AgentConfig {
  securityFeatures: SecurityFeatures;
  userAuthenticated: boolean;
  userId?: string;
  userEmail?: string;
  auth0Token?: string;
  requireAuth?: boolean;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class GuardrAIlsAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      openAIApiKey: openaiConfig.apiKey,
      modelName: openaiConfig.model,
      temperature: 0, // Use 0 for more deterministic tool calling
      configuration: {
        baseURL: openaiConfig.baseURL,
      },
    });
  }

  /**
   * Create a security-aware agent using native tool calling
   */
  private async createAgent(config: AgentConfig): Promise<AgentExecutor> {
    // Create tools with security context
    const toolContext = {
      securityFeatures: config.securityFeatures,
      userAuthenticated: config.userAuthenticated,
      userId: config.userId,
      auth0Token: config.auth0Token,
    };

    const tools: DynamicStructuredTool[] = [
      createViewPayrollTool(toolContext),
      executeTransferTool,
      getExchangeRatesTool,
    ];

    // Add calendar tools if Token Vault is enabled
    if (config.securityFeatures.tokenVaultEnabled) {
      tools.push(createViewCalendarTool(toolContext));
      tools.push(createCreateEventTool(toolContext));
      console.log('[Agent] Calendar tools registered (Token Vault enabled)');
    }

    const systemPrompt = this.buildSystemPrompt(config);

    // Simple prompt - let the LLM handle tool calling natively
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    // Bind tools to LLM - this uses native function calling
    const llmWithTools = this.llm.bind({
      functions: tools.map((tool) => formatToOpenAIFunction(tool)),
    });

    // Create agent chain
    const agent = RunnableSequence.from([
      {
        input: (i: { input: string; chat_history: BaseMessage[]; agent_scratchpad: BaseMessage[] }) => i.input,
        agent_scratchpad: (i: { input: string; chat_history: BaseMessage[]; agent_scratchpad: BaseMessage[] }) => i.agent_scratchpad,
        chat_history: (i: { input: string; chat_history: BaseMessage[]; agent_scratchpad: BaseMessage[] }) => i.chat_history,
      },
      prompt,
      llmWithTools,
      new OpenAIFunctionsAgentOutputParser(),
    ]);

    return new AgentExecutor({
      agent,
      tools,
      verbose: true,
      maxIterations: 5,
    });
  }

  /**
   * Build system prompt based on security configuration
   */
  private buildSystemPrompt(config: AgentConfig): string {
    let prompt = `You are a Treasury Management AI Assistant for a financial organization.

You help with treasury operations including:
- Viewing payroll information (sensitive employee salary data)
- Executing bank transfers (moving money between accounts)
- Checking exchange rates (currency conversion)

You have access to the following tools:
- view_payroll: View payroll data for a specific year
- execute_transfer: Execute bank transfers
- get_exchange_rates: Get current forex rates${config.securityFeatures.tokenVaultEnabled ? `
- view_calendar_events: View Google Calendar events
- create_calendar_event: Create new calendar events` : ''}

`;

    // Add user identity context FIRST (most important)
    if (config.userAuthenticated) {
      prompt += `\n👤 USER IDENTITY:
You are currently interacting with an authenticated user.
User ID: ${config.userId}

IMPORTANT: When the user asks "Who am I?", "What's my user ID?", or similar identity questions,
tell them: "You are authenticated as user ${config.userId}"

You have access to this user's identity and can perform user-specific operations on their behalf.
`;
    } else {
      prompt += `\n👤 USER IDENTITY:
The user is NOT authenticated. You do not have their identity.

IMPORTANT: When the user asks "Who am I?", "What's my user ID?", or similar identity questions,
tell them: "You are not logged in. I don't have your identity. Please log in with Auth0 to access user-specific features and secure operations."
`;
    }

    // Add security context based on feature flags
    const anySecurityEnabled = config.securityFeatures.fgaEnabled ||
                                config.securityFeatures.tokenVaultEnabled ||
                                config.securityFeatures.asyncAuthEnabled;

    if (anySecurityEnabled) {
      if (config.userAuthenticated) {
        prompt += `\n🔒 SECURITY FEATURES ACTIVE:
`;

        if (config.securityFeatures.fgaEnabled) {
          prompt += `✓ Fine-Grained Authorization (FGA): Data access is controlled by permissions. You will check if the user has permission to access specific resources.\n`;
        }

        if (config.securityFeatures.tokenVaultEnabled) {
          prompt += `✓ Token Vaulting: You have secure access to Google Calendar through token exchange. You can view calendar events and create new events on behalf of the user. If a connection expires, direct the user to reconnect in Settings.\n`;
        }

        if (config.securityFeatures.asyncAuthEnabled) {
          prompt += `✓ Async Authorization: High-risk operations require human approval before execution.\n`;
        }

        prompt += `\nYou can execute operations with these security guardrails in place.
When you perform sensitive operations, acknowledge which security features are protecting the user.
`;
      } else {
        prompt += `\n🔒 SECURITY FEATURES ACTIVE (User Not Authenticated):
`;

        if (config.securityFeatures.fgaEnabled) {
          prompt += `✓ Fine-Grained Authorization (FGA) - ENABLED\n`;
        }

        if (config.securityFeatures.tokenVaultEnabled) {
          prompt += `✓ Token Vaulting - ENABLED\n`;
        }

        if (config.securityFeatures.asyncAuthEnabled) {
          prompt += `✓ Async Authorization - ENABLED\n`;
        }

        prompt += `\nCRITICAL: The user is NOT authenticated.

You MUST NOT execute any sensitive operations (view_payroll, execute_transfer).

When the user asks you to:
- View payroll data
- Execute transfers
- Access any sensitive information

You MUST respond with: "I cannot perform this operation because you are not logged in. Please log in to access secure treasury operations."

DO NOT call any tools. DO NOT access any data. Explain that authentication is required.
`;
      }
    } else {
      prompt += `\n⚠️ SECURITY MODE: ALL FEATURES DISABLED
Warning: All security guardrails are OFF. You have unrestricted access to all operations.

No security features are enabled:
✗ Fine-Grained Authorization (FGA) - OFF
✗ Token Vaulting - OFF
✗ Async Authorization - OFF

You can execute any operation WITHOUT authentication or authorization checks.
This demonstrates the RISK of unsecured AI agents.

When performing operations, you should:
1. Execute the requested operation
2. Warn the user that this is happening WITHOUT security checks
3. Explain the potential risks (unauthorized access, data breaches, etc.)
`;
    }

    prompt += `\nBe helpful, professional, and clear about security implications of each operation.`;

    return prompt;
  }

  /**
   * Convert conversation history to text format for ReAct agent
   */
  private formatChatHistory(messages: Message[]): string {
    if (messages.length === 0) return 'No previous conversation.';

    return messages
      .map((msg) => {
        const role = msg.role === 'user' ? 'Human' : 'Assistant';
        return `${role}: ${msg.content}`;
      })
      .join('\n');
  }

  /**
   * Process a user message with security enforcement
   */
  async processMessage(
    userMessage: string,
    conversationHistory: Message[],
    config: AgentConfig
  ): Promise<string> {
    try {
      // Check if authentication is required but user is not authenticated
      if (config.requireAuth && !config.userAuthenticated) {
        const lowerMessage = userMessage.toLowerCase();

        // Check if user is requesting sensitive operations
        const isSensitiveOperation =
          lowerMessage.includes('payroll') ||
          lowerMessage.includes('salary') ||
          lowerMessage.includes('compensation') ||
          lowerMessage.includes('transfer') ||
          lowerMessage.includes('send money') ||
          lowerMessage.includes('wire') ||
          lowerMessage.includes('execute');

        if (isSensitiveOperation) {
          return `I cannot perform this operation because you're not logged in. Please log in to access secure treasury management features.`;
        }
      }

      // Simple pattern matching for tool calls
      const lowerMessage = userMessage.toLowerCase();

      // Create tools with security context
      const toolContext = {
        securityFeatures: config.securityFeatures,
        userAuthenticated: config.userAuthenticated,
        userId: config.userId,
        auth0Token: config.auth0Token,
      };

      const viewPayrollTool = createViewPayrollTool(toolContext);

      // Check if user is asking for payroll data
      if (lowerMessage.includes('payroll') || lowerMessage.includes('salary') || lowerMessage.includes('compensation')) {
        // Extract year if mentioned, default to 2024
        const yearMatch = userMessage.match(/\b(20\d{2})\b/);
        const year = yearMatch ? parseInt(yearMatch[1]) : 2024;

        console.log(`[Agent] Calling view_payroll tool with year: ${year}`);

        // Call the tool directly
        const toolResult = await viewPayrollTool.call({ year });
        const resultData = JSON.parse(toolResult);

        if (!resultData.success) {
          return `I tried to retrieve payroll data but encountered an error: ${resultData.error || 'Unknown error'}`;
        }

        // Format the response
        const data = resultData.data;
        let response = `Here is the ${year} payroll data:\n\n`;

        data.employees.forEach((emp: any) => {
          response += `• ${emp.name} (${emp.id}) - ${emp.department}\n`;
          response += `  Salary: $${emp.salary.toLocaleString()} | Bonus: $${emp.bonuses.toLocaleString()} | Total: $${emp.totalCompensation.toLocaleString()}\n\n`;
        });

        response += `\n**Total:** ${data.totalEmployees} employees | $${data.totalAmount.toLocaleString()} total compensation\n\n`;

        // Add security context
        if (config.securityFeatures.fgaEnabled) {
          response += `🔒 **Security: Fine-Grained Authorization is active.** You can only see records you have permission to view. ${data.fgaChecks ? `(FGA checked ${data.fgaChecks.length} records)` : ''}\n\n`;
        } else {
          response += `⚠️ **Security Warning:** FGA is disabled. You can see all payroll records without permission checks. In production, this would be a serious security risk.\n\n`;
        }

        return response;
      }

      // Check if user is requesting a transfer
      if (lowerMessage.includes('transfer') || lowerMessage.includes('send money') || lowerMessage.includes('wire')) {
        // Extract amount
        const amountMatch = userMessage.match(/\$?([\d,]+(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|thousand)?/i);
        let amount = 0;

        if (amountMatch) {
          const amountStr = amountMatch[1].replace(/,/g, '');
          amount = parseFloat(amountStr);

          // Handle 'k' or 'thousand'
          if (userMessage.match(/\d+\s*k\b/i) || userMessage.match(/thousand/i)) {
            amount *= 1000;
          }
        }

        // Extract recipient
        const toMatch = userMessage.match(/to\s+([A-Za-z0-9\s]+?)(?:\s|$|,|\.|for)/i);
        const toAccount = toMatch ? toMatch[1].trim() : 'Unknown Recipient';

        if (amount === 0) {
          return `I can help with that transfer. However, I need to know the amount you want to transfer. Please specify the amount (e.g., "Transfer $75,000 to ${toAccount}").`;
        }

        console.log(`[Agent] Transfer request: $${amount} to ${toAccount}`);

        // Check if async authorization is enabled and required
        if (config.securityFeatures.asyncAuthEnabled) {
          const requiresApproval = asyncAuthService.requiresApproval('transfer', { amount });

          if (requiresApproval) {
            console.log(`[Agent] Transfer requires approval (amount: $${amount} > $50,000)`);

            if (!config.userAuthenticated || !config.userId) {
              return `⚠️ This transfer requires approval, but you are not authenticated. Please log in first.`;
            }

            // Get user email - required for CIBA login_hint
            let userEmail = config.userEmail;

            if (!userEmail) {
              console.warn('[Agent] No email in token - CIBA will use simulated mode');
              console.warn('  To fix: Ensure email scope is requested and user has verified email in Auth0');
              // For demo, construct a fallback email
              userEmail = `user-${config.userId.split('|')[1]}@demo.local`;
            }

            console.log(`[Agent] Using email for CIBA: ${userEmail}`);

            // Create CIBA request
            const cibaRequest = await asyncAuthService.initiateCIBARequest(
              config.userId,
              userEmail,
              `Transfer $${amount.toLocaleString()}`,
              {
                type: 'transfer',
                description: `Transfer $${amount.toLocaleString()} from ACC001 to ${toAccount}`,
                amount,
                fromAccount: 'ACC001',
                toAccount,
              }
            );

            // Inform user and wait
            let response = `🔐 **Async Authorization Required**\n\n`;
            response += `This transfer of **$${amount.toLocaleString()}** to **${toAccount}** requires approval.\n\n`;

            if (cibaRequest.authReqId.startsWith('SIMULATED-')) {
              response += `📱 **SIMULATED MODE**: In production, a push notification would be sent to your Auth0 Guardian app.\n\n`;
              response += `**Approval Request ID:** ${cibaRequest.authReqId}\n\n`;
              response += `To simulate approval, you would:\n`;
              response += `1. Receive push notification on your phone\n`;
              response += `2. See: "${cibaRequest.bindingMessage}"\n`;
              response += `3. Tap "Approve" or "Deny"\n\n`;
              response += `For this demo, the request will timeout after 5 minutes.\n\n`;
              response += `⏳ **Status:** Waiting for approval...`;
            } else {
              response += `📱 **Check your Auth0 Guardian app** on your phone.\n\n`;
              response += `You should see a push notification:\n`;
              response += `"${cibaRequest.bindingMessage}"\n\n`;
              response += `Tap **Approve** to proceed with this transfer, or **Deny** to cancel.\n\n`;
              response += `⏳ I'll wait up to 2 minutes for your response...`;

              // Wait for approval
              const approvalResult = await asyncAuthService.waitForApproval(cibaRequest.authReqId);

              if (approvalResult === 'approved') {
                // Execute the transfer
                const result = simulateTransfer('ACC001', toAccount, amount, `Transfer approved via CIBA`);

                if (result.success) {
                  response += `\n\n✅ **APPROVED & EXECUTED**\n\n`;
                  response += `Transfer of $${amount.toLocaleString()} to ${toAccount} completed successfully.\n`;
                  response += `Transaction ID: ${result.transactionId}`;
                } else {
                  response += `\n\n❌ **APPROVED BUT FAILED**\n\n`;
                  response += `Transfer was approved but execution failed: ${result.error}`;
                }
              } else if (approvalResult === 'denied') {
                response += `\n\n❌ **DENIED**\n\nYou denied this transfer request. No funds were moved.`;
              } else if (approvalResult === 'timeout') {
                response += `\n\n⏱️ **TIMEOUT**\n\nApproval request timed out. No funds were moved. Please try again.`;
              } else {
                response += `\n\n❌ **EXPIRED**\n\nApproval request expired. No funds were moved.`;
              }
            }

            return response;
          }
        }

        // No async auth needed - execute immediately
        console.log(`[Agent] Executing transfer immediately (no approval required)`);

        const result = simulateTransfer('ACC001', toAccount, amount, `Transfer to ${toAccount}`);

        if (result.success) {
          let response = `✅ **Transfer Completed**\n\n`;
          response += `Successfully transferred **$${amount.toLocaleString()}** from **Main Checking (ACC001)** to **${toAccount}**.\n\n`;
          response += `**Transaction ID:** ${result.transactionId}\n\n`;

          if (config.securityFeatures.asyncAuthEnabled) {
            response += `ℹ️ This transfer was under $50,000, so it didn't require approval even with Async Auth enabled.\n\n`;
          } else {
            response += `⚠️ **Security Warning:** Async Authorization is disabled. This transfer was executed immediately without any approval workflow. In production, high-value transfers should require approval.\n\n`;
          }

          return response;
        } else {
          return `❌ **Transfer Failed**\n\n${result.error}`;
        }
      }

      // Check if user is asking about calendar (view)
      // Process calendar requests regardless of toggle - let the tool handle VAULT_DISABLED errors
      if (lowerMessage.includes('calendar') || lowerMessage.includes('schedule') || lowerMessage.includes('events') || lowerMessage.includes('meetings')) {
        // Check if it's a create request
        const isCreateRequest = lowerMessage.includes('schedule') || lowerMessage.includes('create') || lowerMessage.includes('add');

        if (isCreateRequest && (lowerMessage.includes('meeting') || lowerMessage.includes('event'))) {
          console.log('[Agent] Calendar create request detected');

          const { createCreateEventTool } = await import('./tools/createCreateEventTool.js');
          const createEventTool = createCreateEventTool(toolContext);

          // Extract event details - this is simplified, real implementation would be more sophisticated
          const titleMatch = userMessage.match(/(?:schedule|create|add)(?:\s+(?:a|an))?\s+(.+?)(?:\s+(?:at|on|for|tomorrow|today))/i);
          const title = titleMatch ? titleMatch[1].trim() : 'New Event';

          // For now, create a simple event tomorrow at 2pm for 1 hour
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(14, 0, 0, 0);

          const endTime = new Date(tomorrow);
          endTime.setHours(15, 0, 0, 0);

          const toolResult = await createEventTool.call({
            title,
            startDateTime: tomorrow.toISOString(),
            endDateTime: endTime.toISOString()
          });

          const resultData = JSON.parse(toolResult);

          if (!resultData.success) {
            return `I tried to create a calendar event but encountered an error: ${resultData.message || resultData.error}`;
          }

          return `✅ **Calendar Event Created**\n\nSuccessfully created "${resultData.event.title}" on your Google Calendar.\n\n**Details:**\n- Start: ${new Date(resultData.event.startTime).toLocaleString()}\n- End: ${new Date(resultData.event.endTime).toLocaleString()}\n- Link: ${resultData.event.link || 'N/A'}`;
        }

        // View calendar request
        console.log('[Agent] Calendar view request detected');

        const { createViewCalendarTool } = await import('./tools/createViewCalendarTool.js');
        const viewCalendarTool = createViewCalendarTool(toolContext);

        // Determine date range
        let startDate: string | undefined;
        let endDate: string | undefined;

        if (lowerMessage.includes('tomorrow')) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          startDate = tomorrow.toISOString().split('T')[0];

          const dayAfter = new Date(tomorrow);
          dayAfter.setDate(dayAfter.getDate() + 1);
          endDate = dayAfter.toISOString().split('T')[0];
        } else if (lowerMessage.includes('today')) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          startDate = today.toISOString().split('T')[0];

          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          endDate = tomorrow.toISOString().split('T')[0];
        } else if (lowerMessage.includes('week')) {
          // Next 7 days
          const today = new Date();
          startDate = today.toISOString().split('T')[0];

          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          endDate = nextWeek.toISOString().split('T')[0];
        }

        const toolResult = await viewCalendarTool.call({
          startDate,
          endDate,
          maxResults: 20
        });

        const resultData = JSON.parse(toolResult);

        if (!resultData.success) {
          return `I tried to retrieve your calendar but encountered an error: ${resultData.message || resultData.error}`;
        }

        if (resultData.events.length === 0) {
          return `📅 Your calendar is clear for the requested period. No events found.`;
        }

        let response = `📅 **Your Calendar Events**\n\n`;
        response += `Found ${resultData.events.length} event(s):\n\n`;

        resultData.events.forEach((event: any) => {
          const startTime = new Date(event.startTime);
          const endTime = new Date(event.endTime);

          response += `**${event.title}**\n`;
          response += `📍 ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
          if (event.location) {
            response += `📍 Location: ${event.location}\n`;
          }
          if (event.attendees > 0) {
            response += `👥 ${event.attendees} attendee(s)\n`;
          }
          response += `\n`;
        });

        return response;
      }

      // Default response for non-tool queries
      const systemPrompt = this.buildSystemPrompt(config);
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        ...this.convertHistoryToMessages(conversationHistory),
        new HumanMessage(userMessage),
      ]);

      return response.content.toString();
    } catch (error: any) {
      console.error('Agent error:', error);
      return `I encountered an error processing your request: ${error.message}`;
    }
  }

  /**
   * Convert conversation history to LangChain messages
   */
  private convertHistoryToMessages(messages: Message[]): BaseMessage[] {
    return messages.map((msg) => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else if (msg.role === 'assistant') {
        return new AIMessage(msg.content);
      } else {
        return new SystemMessage(msg.content);
      }
    });
  }
}
