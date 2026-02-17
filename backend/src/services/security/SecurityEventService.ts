/**
 * Security Event Service
 * Service for logging and tracking security events
 */

interface SecurityEventInput {
  type: string;
  status: 'success' | 'failure' | 'pending';
  details: string;
  resource?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

interface SecurityEvent extends SecurityEventInput {
  id: string;
  timestamp: Date;
}

class SecurityEventService {
  private events: SecurityEvent[] = [];
  private idCounter = 0;

  /**
   * Generate a simple unique ID
   */
  private generateId(): string {
    return `evt_${Date.now()}_${++this.idCounter}`;
  }

  /**
   * Log a security event
   */
  async logEvent(input: SecurityEventInput): Promise<SecurityEvent> {
    const event: SecurityEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      ...input
    };

    this.events.push(event);

    // Log to console for visibility
    console.log(`[SecurityEvent] ${event.type} - ${event.status}: ${event.details}`, {
      userId: event.userId,
      resource: event.resource,
      metadata: event.metadata
    });

    return event;
  }

  /**
   * Get recent security events
   */
  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get events for a specific user
   */
  getUserEvents(userId: string, limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(e => e.userId === userId)
      .slice(-limit);
  }

  /**
   * Clear all events (for testing)
   */
  clearEvents(): void {
    this.events = [];
  }
}

// Singleton instance
export const securityEventService = new SecurityEventService();
