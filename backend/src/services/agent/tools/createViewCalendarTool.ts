/**
 * View Calendar Tool
 * Agent tool for viewing Google Calendar events
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ToolSecurityContext } from '../../../types';
import { tokenVaultService } from '../../token-vault/TokenVaultService';
import { googleCalendarClient } from '../../google/GoogleCalendarClient';
import { TokenExchangeError } from '../../token-vault/types';
import { GoogleCalendarError } from '../../google/types';
import { securityEventService } from '../../security/SecurityEventService';

const GOOGLE_CALENDAR_READ_SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly';

// Mock calendar data for demo purposes
function getMockCalendarEvents(startDate: Date, endDate: Date, maxResults: number) {
  const events = [
    {
      id: 'mock1',
      title: 'Team Standup',
      description: 'Daily team sync-up meeting',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      endTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
      attendees: ['alice@company.com', 'bob@company.com'],
      isAllDay: false,
      location: 'Conference Room A',
      htmlLink: 'https://calendar.google.com/calendar/event?eid=mock1'
    },
    {
      id: 'mock2',
      title: 'Product Review',
      description: 'Q1 product roadmap review with stakeholders',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
      attendees: ['ceo@company.com', 'cto@company.com', 'pm@company.com'],
      isAllDay: false,
      location: 'Zoom Meeting',
      htmlLink: 'https://calendar.google.com/calendar/event?eid=mock2'
    },
    {
      id: 'mock3',
      title: 'Security Training',
      description: 'Annual security awareness and compliance training',
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      attendees: ['security@company.com'],
      isAllDay: false,
      location: 'Training Room 2',
      htmlLink: 'https://calendar.google.com/calendar/event?eid=mock3'
    },
    {
      id: 'mock4',
      title: 'Client Demo',
      description: 'Demo of new Token Vault features for enterprise client',
      startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000),
      attendees: ['sales@company.com', 'client@enterprise.com'],
      isAllDay: false,
      location: 'Virtual',
      htmlLink: 'https://calendar.google.com/calendar/event?eid=mock4'
    },
    {
      id: 'mock5',
      title: 'Company All-Hands',
      description: 'Monthly company-wide meeting and Q&A',
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
      attendees: [],
      isAllDay: false,
      location: 'Main Office',
      htmlLink: 'https://calendar.google.com/calendar/event?eid=mock5'
    }
  ];

  // Filter by date range
  const filtered = events.filter(event =>
    event.startTime >= startDate && event.startTime <= endDate
  );

  // Limit results
  return filtered.slice(0, maxResults);
}

export function createViewCalendarTool(context: ToolSecurityContext) {
  return new DynamicStructuredTool({
    name: 'view_calendar_events',
    description: `View the user's Google Calendar events within a date range.
Use this tool when the user wants to see their schedule, check availability, or view upcoming events.
Returns a list of calendar events with titles, times, and details.`,
    schema: z.object({
      startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD). Defaults to today.'),
      endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD). Defaults to 7 days from start.'),
      maxResults: z.number().optional().describe('Maximum number of events to return (1-100). Defaults to 20.')
    }),

    func: async ({ startDate, endDate, maxResults = 20 }) => {
      const startTime = Date.now();

      // Security check: User must be authenticated
      if (!context.userAuthenticated || !context.userId) {
        await securityEventService.logEvent({
          type: 'google_calendar_view',
          status: 'failure',
          details: 'User not authenticated',
          resource: 'google:calendar:events',
          userId: context.userId
        });

        return JSON.stringify({
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to view calendar events.'
        });
      }

      // Check if we have the Auth0 access token
      if (!context.auth0Token) {
        await securityEventService.logEvent({
          type: 'google_token_exchange',
          status: 'failure',
          details: 'Auth0 access token not available',
          resource: 'google:calendar:events',
          userId: context.userId
        });

        return JSON.stringify({
          success: false,
          error: 'TOKEN_NOT_AVAILABLE',
          message: 'Authentication token is not available. Please refresh and try again.'
        });
      }

      // CRITICAL: Check if Token Vault is enabled
      if (!context.securityFeatures.tokenVaultEnabled) {
        await securityEventService.logEvent({
          type: 'google_calendar_view',
          status: 'failure',
          details: 'Token Vault is disabled',
          resource: 'google:calendar:events',
          userId: context.userId,
          metadata: {
            vaultEnabled: false
          }
        });

        return JSON.stringify({
          success: false,
          error: 'VAULT_DISABLED',
          vaultDisabled: true,
          message: '🔒 Token Vault is currently disabled. To view your Google Calendar:\n\n' +
                   '1. Enable "Token Vault" in Settings, OR\n' +
                   '2. Use manual OAuth consent (requires re-authentication each time)\n\n' +
                   'Token Vault securely stores your Google connection so you don\'t need to reconnect repeatedly.'
        });
      }

      // Check if Google Calendar is connected (for demo, just show connect prompt first time)
      // In demo mode, we'll show the connection button, then after user "connects", show mock data
      const isConnected = context.metadata?.googleConnected === true;

      if (!isConnected) {
        console.log('[ViewCalendarTool] Google Calendar not connected, showing connection prompt');

        await securityEventService.logEvent({
          type: 'google_calendar_view',
          status: 'failure',
          details: 'Google Calendar not connected',
          resource: 'google:calendar:events',
          userId: context.userId
        });

        return JSON.stringify({
          success: false,
          error: 'CONNECTION_NOT_FOUND',
          requiresConnectionFlow: true,
          connectionFlow: {
            provider: 'google-oauth2',
            requiredScopes: [
              'https://www.googleapis.com/auth/calendar.events.readonly',
              'https://www.googleapis.com/auth/calendar.events'
            ]
          },
          message: '🔗 Google Calendar is not connected.\n\n' +
                   'To use calendar features with Token Vault:\n' +
                   '1. Click "Connect Google Calendar" below\n' +
                   '2. Authorize calendar access in the popup\n' +
                   '3. Come back and ask me again!\n\n' +
                   'Your connection will be securely stored in Token Vault.'
        });
      }

      try {
        console.log(`[ViewCalendarTool] User ${context.userId} requesting calendar events`);

        // Parse dates
        const start = startDate ? new Date(startDate) : new Date();
        const end = endDate
          ? new Date(endDate)
          : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

        // FOR DEMO: Use mock data instead of real API call
        console.log('[ViewCalendarTool] Using mock calendar data for demo (Token Vault enabled, connected)');
        const events = getMockCalendarEvents(start, end, Math.min(Math.max(maxResults, 1), 100));

        const elapsed = Date.now() - startTime;

        // Log successful calendar view (demo)
        await securityEventService.logEvent({
          type: 'google_calendar_view',
          status: 'success',
          details: `Retrieved ${events.length} calendar events (demo mode)`,
          resource: 'google:calendar:events',
          userId: context.userId,
          metadata: {
            eventCount: events.length,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            latencyMs: elapsed,
            demoMode: true
          }
        });

        console.log(`[ViewCalendarTool] Retrieved ${events.length} mock events in ${elapsed}ms`);

        // Format events for agent response
        const formattedEvents = events.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          startTime: event.startTime.toISOString(),
          endTime: event.endTime.toISOString(),
          attendees: event.attendees,
          isAllDay: event.isAllDay,
          location: event.location,
          link: event.htmlLink
        }));

        return JSON.stringify({
          success: true,
          events: formattedEvents,
          summary: {
            total: events.length,
            dateRange: {
              start: start.toISOString().split('T')[0],
              end: end.toISOString().split('T')[0]
            }
          },
          demoMode: true,
          message: 'Showing demo calendar data (Token Vault connected)'
        }, null, 2);

      } catch (error) {
        console.error('[ViewCalendarTool] Error:', error);

        // Handle specific error types
        if (error instanceof TokenExchangeError) {
          // Handle Token Vault disabled
          if (error.code === 'VAULT_DISABLED') {
            await securityEventService.logEvent({
              type: 'google_token_exchange',
              status: 'failure',
              details: 'Token Vault is disabled',
              resource: 'google:calendar:events',
              userId: context.userId,
              metadata: {
                vaultEnabled: false
              }
            });

            return JSON.stringify({
              success: false,
              error: 'VAULT_DISABLED',
              vaultDisabled: true,
              message: '🔒 Token Vault is currently disabled. To view your Google Calendar:\n\n' +
                       '1. Enable "Token Vault" in Settings, OR\n' +
                       '2. Use manual OAuth consent (requires re-authentication each time)\n\n' +
                       'Token Vault securely stores your Google connection so you don\'t need to reconnect repeatedly.'
            });
          }

          // Handle connection not found
          if (error.code === 'CONNECTION_NOT_FOUND') {
            await securityEventService.logEvent({
              type: 'google_token_exchange',
              status: 'failure',
              details: 'Google Calendar connection not found in Connected Accounts',
              resource: 'google:calendar:events',
              userId: context.userId
            });

            const errorDetails = error.details as any;
            const requiresConnectionFlow = errorDetails?.requiresConnectionFlow;

            return JSON.stringify({
              success: false,
              error: 'CONNECTION_NOT_FOUND',
              requiresConnectionFlow: requiresConnectionFlow,
              message: requiresConnectionFlow
                ? '🔗 Google Calendar is not connected.\n\n' +
                  'To use calendar features with Token Vault:\n' +
                  '1. You need to connect your Google account as a Connected Account\n' +
                  '2. This is different from logging in with Google\n' +
                  '3. Click "Connect Google Calendar" to link your account\n\n' +
                  'Note: Logging in WITH Google ≠ Connecting Google FOR calendar access'
                : 'Google Calendar is not connected. Please connect your Google account to access calendar features.'
            });
          }

          // Handle connection expired
          if (error.code === 'CONNECTION_EXPIRED') {
            await securityEventService.logEvent({
              type: 'google_token_exchange',
              status: 'failure',
              details: 'Google Calendar connection expired',
              resource: 'google:calendar:events',
              userId: context.userId
            });

            return JSON.stringify({
              success: false,
              error: 'CONNECTION_EXPIRED',
              reconnectionRequired: true,
              message: 'Your Google Calendar connection has expired. Please reconnect in Settings to continue using calendar features.'
            });
          }

          await securityEventService.logEvent({
            type: 'google_token_exchange',
            status: 'failure',
            details: `Token vault access failed: ${error.code}`,
            resource: 'google:calendar:events',
            userId: context.userId
          });

          return JSON.stringify({
            success: false,
            error: error.code,
            message: `Failed to access Google Calendar: ${error.message}`
          });
        }

        if (error instanceof GoogleCalendarError) {
          await securityEventService.logEvent({
            type: 'google_calendar_view',
            status: 'failure',
            details: `Google Calendar API error: ${error.code}`,
            resource: 'google:calendar:events',
            userId: context.userId
          });

          // Provide specific guidance based on error
          let message = error.message;
          if (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN') {
            message = 'Access to Google Calendar was denied. Please reconnect your Google account in Settings.';
          }

          return JSON.stringify({
            success: false,
            error: error.code,
            message,
            reconnectionRequired: error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN'
          });
        }

        // Unknown error
        await securityEventService.logEvent({
          type: 'google_calendar_view',
          status: 'failure',
          details: 'Unexpected error viewing calendar',
          resource: 'google:calendar:events',
          userId: context.userId
        });

        return JSON.stringify({
          success: false,
          error: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while accessing your calendar.'
        });
      }
    }
  });
}
