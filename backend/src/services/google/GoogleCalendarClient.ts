/**
 * Google Calendar API Client
 * Wrapper for Google Calendar API v3 operations
 */

import axios, { AxiosError } from 'axios';
import {
  CalendarEvent,
  CreateEventRequest,
  GoogleCalendarError,
  GoogleCalendarListResponse,
  ListEventsOptions
} from './types';
import { formatDateTimeForGoogle, parseGoogleEvent } from './utils';

export class GoogleCalendarClient {
  private readonly CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
  private readonly PRIMARY_CALENDAR = 'primary';

  /**
   * List calendar events within a date range
   */
  async listEvents(
    accessToken: string,
    options: ListEventsOptions = {}
  ): Promise<CalendarEvent[]> {
    const {
      startDate = new Date(),
      endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default: 7 days from now
      maxResults = 20,
      timeZone = 'UTC'
    } = options;

    try {
      const response = await axios.get<GoogleCalendarListResponse>(
        `${this.CALENDAR_API_BASE}/calendars/${this.PRIMARY_CALENDAR}/events`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          params: {
            timeMin: formatDateTimeForGoogle(startDate),
            timeMax: formatDateTimeForGoogle(endDate),
            maxResults,
            singleEvents: true,
            orderBy: 'startTime',
            timeZone
          }
        }
      );

      const events = response.data.items.map(parseGoogleEvent);
      console.log(`[GoogleCalendarClient] Retrieved ${events.length} events`);

      return events;

    } catch (error) {
      throw this.handleError(error, 'listing events');
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(
    accessToken: string,
    eventRequest: CreateEventRequest
  ): Promise<CalendarEvent> {
    const {
      title,
      description,
      startDateTime,
      endDateTime,
      attendees = [],
      location,
      timeZone = 'UTC'
    } = eventRequest;

    // Build Google Calendar event object
    const googleEvent = {
      summary: title,
      description,
      location,
      start: {
        dateTime: formatDateTimeForGoogle(startDateTime),
        timeZone
      },
      end: {
        dateTime: formatDateTimeForGoogle(endDateTime),
        timeZone
      },
      attendees: attendees.map(email => ({ email }))
    };

    try {
      const response = await axios.post(
        `${this.CALENDAR_API_BASE}/calendars/${this.PRIMARY_CALENDAR}/events`,
        googleEvent,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const createdEvent = parseGoogleEvent(response.data);
      console.log(`[GoogleCalendarClient] Created event: ${createdEvent.id}`);

      return createdEvent;

    } catch (error) {
      throw this.handleError(error, 'creating event');
    }
  }

  /**
   * Handle API errors and convert to GoogleCalendarError
   */
  private handleError(error: unknown, operation: string): GoogleCalendarError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status || 500;
      const data = axiosError.response?.data;

      console.error(`[GoogleCalendarClient] Error ${operation}:`, {
        status,
        message: axiosError.message,
        data
      });

      switch (status) {
        case 401:
          return new GoogleCalendarError(
            'Unauthorized: Token expired or invalid',
            status,
            'UNAUTHORIZED',
            data
          );

        case 403:
          return new GoogleCalendarError(
            'Forbidden: Access to Google Calendar has been revoked',
            status,
            'FORBIDDEN',
            data
          );

        case 404:
          return new GoogleCalendarError(
            'Calendar not found',
            status,
            'NOT_FOUND',
            data
          );

        case 429:
          return new GoogleCalendarError(
            'Rate limit exceeded',
            status,
            'RATE_LIMIT',
            data
          );

        default:
          return new GoogleCalendarError(
            `Google Calendar API error: ${axiosError.message}`,
            status,
            'API_ERROR',
            data
          );
      }
    }

    // Non-Axios error
    console.error(`[GoogleCalendarClient] Unexpected error ${operation}:`, error);
    return new GoogleCalendarError(
      `Unexpected error ${operation}`,
      500,
      'API_ERROR',
      error
    );
  }
}

// Singleton instance
export const googleCalendarClient = new GoogleCalendarClient();
