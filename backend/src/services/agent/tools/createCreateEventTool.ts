/**
 * Create Calendar Event Tool
 * Agent tool for creating Google Calendar events
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ToolSecurityContext } from '../../../types';
import { tokenVaultService } from '../../token-vault/TokenVaultService';
import { googleCalendarClient } from '../../google/GoogleCalendarClient';
import { TokenExchangeError } from '../../token-vault/types';
import { GoogleCalendarError } from '../../google/types';
import { securityEventService } from '../../security/SecurityEventService';

const GOOGLE_CALENDAR_WRITE_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

export function createCreateEventTool(context: ToolSecurityContext) {
  return new DynamicStructuredTool({
    name: 'create_calendar_event',
    description: `Create a new event in the user's Google Calendar.
Use this tool when the user wants to schedule a meeting, appointment, or reminder.
Requires event title, start time, and end time. Optionally accepts description, location, and attendee emails.`,
    schema: z.object({
      title: z.string().describe('Event title/summary (required)'),
      description: z.string().optional().describe('Event description/notes'),
      startDateTime: z.string().describe('Event start time in ISO format (YYYY-MM-DDTHH:MM:SS)'),
      endDateTime: z.string().describe('Event end time in ISO format (YYYY-MM-DDTHH:MM:SS)'),
      location: z.string().optional().describe('Event location (address or place name)'),
      attendees: z.array(z.string()).optional().describe('Array of attendee email addresses')
    }),

    func: async ({ title, description, startDateTime, endDateTime, location, attendees = [] }) => {
      const startTime = Date.now();

      // Security check: User must be authenticated
      if (!context.userAuthenticated || !context.userId) {
        await securityEventService.logEvent({
          type: 'google_calendar_create',
          status: 'failure',
          details: 'User not authenticated',
          resource: 'google:calendar:events',
          userId: context.userId
        });

        return JSON.stringify({
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to create calendar events.'
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

      try {
        console.log(`[CreateEventTool] User ${context.userId} creating event: "${title}"`);

        // Validate dates
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return JSON.stringify({
            success: false,
            error: 'INVALID_DATE',
            message: 'Invalid date format. Please use ISO format (YYYY-MM-DDTHH:MM:SS).'
          });
        }

        if (end <= start) {
          return JSON.stringify({
            success: false,
            error: 'INVALID_DATE_RANGE',
            message: 'End time must be after start time.'
          });
        }

        // Get Google token from Auth0 Token Vault
        const exchanged = await tokenVaultService.getGoogleToken({
          userId: context.userId,
          scope: GOOGLE_CALENDAR_WRITE_SCOPE,
          tokenVaultEnabled: context.securityFeatures.tokenVaultEnabled,
          auth0AccessToken: context.auth0Token
        });

        // Log token retrieval security event
        await securityEventService.logEvent({
          type: 'google_token_exchange',
          status: 'success',
          details: 'Retrieved Google Calendar write token from Auth0 Token Vault',
          resource: 'google:calendar:events',
          userId: context.userId,
          metadata: {
            scope: GOOGLE_CALENDAR_WRITE_SCOPE,
            expiresAt: exchanged.expiresAt.toISOString(),
            vaultEnabled: true
          }
        });

        // Create calendar event
        const event = await googleCalendarClient.createEvent(exchanged.token, {
          title,
          description,
          startDateTime: start,
          endDateTime: end,
          location,
          attendees
        });

        const elapsed = Date.now() - startTime;

        // Log successful event creation
        await securityEventService.logEvent({
          type: 'google_calendar_create',
          status: 'success',
          details: `Created calendar event: "${title}"`,
          resource: 'google:calendar:events',
          userId: context.userId,
          metadata: {
            eventId: event.id,
            eventTitle: title,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            attendeeCount: attendees.length,
            latencyMs: elapsed
          }
        });

        console.log(`[CreateEventTool] Created event ${event.id} in ${elapsed}ms`);

        return JSON.stringify({
          success: true,
          event: {
            id: event.id,
            title: event.title,
            description: event.description,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            location: event.location,
            attendees: event.attendees,
            link: event.htmlLink
          },
          message: `Successfully created calendar event: "${title}"`
        }, null, 2);

      } catch (error) {
        console.error('[CreateEventTool] Error:', error);

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
              message: '🔒 Token Vault is currently disabled. To create calendar events:\n\n' +
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
              details: 'Google Calendar connection not found',
              resource: 'google:calendar:events',
              userId: context.userId
            });

            return JSON.stringify({
              success: false,
              error: 'CONNECTION_NOT_FOUND',
              reconnectionRequired: true,
              message: 'Google Calendar is not connected. Please connect your Google account in Settings to access calendar features.'
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
            type: 'google_calendar_create',
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
          type: 'google_calendar_create',
          status: 'failure',
          details: 'Unexpected error creating calendar event',
          resource: 'google:calendar:events',
          userId: context.userId
        });

        return JSON.stringify({
          success: false,
          error: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while creating the calendar event.'
        });
      }
    }
  });
}
