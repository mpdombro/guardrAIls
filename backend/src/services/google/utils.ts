/**
 * Google Calendar Utilities
 * Helper functions for date formatting and event parsing
 */

import { CalendarEvent, GoogleCalendarEvent } from './types';

/**
 * Format Date to RFC3339 format for Google Calendar API
 */
export function formatDateTimeForGoogle(date: Date): string {
  return date.toISOString();
}

/**
 * Parse Google Calendar event to our internal format
 */
export function parseGoogleEvent(googleEvent: GoogleCalendarEvent): CalendarEvent {
  // Determine if all-day event
  const isAllDay = !!(googleEvent.start.date && googleEvent.end.date);

  // Parse start/end times
  let startTime: Date;
  let endTime: Date;

  if (isAllDay) {
    // All-day events use 'date' field (YYYY-MM-DD format)
    startTime = new Date(googleEvent.start.date + 'T00:00:00Z');
    endTime = new Date(googleEvent.end.date + 'T00:00:00Z');
  } else {
    // Timed events use 'dateTime' field (RFC3339 format)
    startTime = new Date(googleEvent.start.dateTime!);
    endTime = new Date(googleEvent.end.dateTime!);
  }

  return {
    id: googleEvent.id,
    title: googleEvent.summary,
    description: googleEvent.description,
    startTime,
    endTime,
    attendees: googleEvent.attendees?.length || 0,
    isAllDay,
    location: googleEvent.location,
    htmlLink: googleEvent.htmlLink
  };
}

/**
 * Format date range for human-readable output
 */
export function formatDateRange(start: Date, end: Date): string {
  const startStr = start.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const endStr = end.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `${startStr} - ${endStr}`;
}
