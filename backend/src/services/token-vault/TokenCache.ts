/**
 * Token Cache
 * In-memory cache for exchanged tokens with TTL management
 */

import { TokenCacheEntry } from './types';

export class TokenCache {
  private cache: Map<string, TokenCacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  // Cache TTL: 45 minutes (5-min buffer before 50-min typical expiry)
  private readonly CACHE_TTL_MS = 45 * 60 * 1000;

  constructor() {
    // Clean up expired entries every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

  /**
   * Generate cache key from userId and scope
   */
  private getCacheKey(userId: string, scope: string): string {
    return `${userId}:${scope}`;
  }

  /**
   * Get token from cache if valid
   */
  get(userId: string, scope: string): TokenCacheEntry | null {
    const key = this.getCacheKey(userId, scope);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (new Date() >= entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Store token in cache with expiration
   */
  set(userId: string, scope: string, token: string, expiresInSeconds: number): void {
    const key = this.getCacheKey(userId, scope);

    // Use the shorter of API expiry or our cache TTL
    const expiryMs = Math.min(expiresInSeconds * 1000, this.CACHE_TTL_MS);
    const expiresAt = new Date(Date.now() + expiryMs);

    this.cache.set(key, {
      token,
      expiresAt,
      scope
    });
  }

  /**
   * Remove token from cache
   */
  delete(userId: string, scope: string): void {
    const key = this.getCacheKey(userId, scope);
    this.cache.delete(key);
  }

  /**
   * Clear all cached tokens for a user
   */
  clearUser(userId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Remove expired entries from cache
   */
  private cleanup(): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`[TokenCache] Cleaned up ${keysToDelete.length} expired tokens`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Shutdown cache and clear cleanup interval
   */
  shutdown(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}
