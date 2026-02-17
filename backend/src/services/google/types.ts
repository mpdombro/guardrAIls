/**
 * Google Calendar Types
 * Type definitions for Google Calendar API v3
 */

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: number;
  isAllDay: boolean;
  location?: string;
  htmlLink?: string;
}

export interface ListEventsOptions {
  startDate?: Date;
  endDate?: Date;
  maxResults?: number;
  timeZone?: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  attendees?: string[];
  location?: string;
  timeZone?: string;
}

// Google API response types
export interface GoogleCalendarEventDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface GoogleCalendarEventAttendee {
  email: string;
  responseStatus?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: GoogleCalendarEventDateTime;
  end: GoogleCalendarEventDateTime;
  attendees?: GoogleCalendarEventAttendee[];
  location?: string;
  htmlLink?: string;
}

export interface GoogleCalendarListResponse {
  items: GoogleCalendarEvent[];
  nextPageToken?: string;
}

export class GoogleCalendarError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'RATE_LIMIT' | 'API_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'GoogleCalendarError';
  }
}
