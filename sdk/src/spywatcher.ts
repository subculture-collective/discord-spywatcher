import { SpywatcherConfig } from './types';
import { AnalyticsAPI } from './analytics';
import {
  SuspicionData,
  TimelineEvent,
  BannedGuild,
  BannedUser,
  User,
  ApiKeyInfo,
  AnalyticsQueryOptions,
  PaginationOptions,
} from './types';

/**
 * Main Spywatcher SDK class
 * Provides access to all API endpoints with full TypeScript support
 * 
 * @example
 * ```typescript
 * const client = new Spywatcher({
 *   baseUrl: 'https://api.spywatcher.com',
 *   apiKey: 'spy_live_your_api_key_here'
 * });
 * 
 * // Get ghost users
 * const ghosts = await client.analytics.getGhosts();
 * 
 * // Get suspicion data
 * const suspicions = await client.getSuspicionData();
 * ```
 */
export class Spywatcher extends AnalyticsAPI {
  /**
   * Analytics API
   * Access user analytics, activity patterns, and behavioral data
   */
  public readonly analytics: AnalyticsAPI;

  constructor(config: SpywatcherConfig) {
    super(config);
    this.analytics = new AnalyticsAPI(config);
  }

  // ==================== Suspicion API ====================

  /**
   * Get suspicion data
   * Identifies users with suspicious behavior patterns
   */
  async getSuspicionData(options?: AnalyticsQueryOptions): Promise<SuspicionData[]> {
    return this.get<SuspicionData[]>('/suspicion', options);
  }

  // ==================== Timeline API ====================

  /**
   * Get timeline events
   * Retrieve chronological user activity events
   */
  async getTimeline(options?: PaginationOptions): Promise<TimelineEvent[]> {
    return this.get<TimelineEvent[]>('/timeline', options);
  }

  /**
   * Get timeline events for a specific user
   */
  async getUserTimeline(
    userId: string,
    options?: PaginationOptions
  ): Promise<TimelineEvent[]> {
    return this.get<TimelineEvent[]>(`/timeline/${userId}`, options);
  }

  // ==================== Bans API ====================

  /**
   * Get banned guilds
   */
  async getBannedGuilds(): Promise<BannedGuild[]> {
    return this.get<BannedGuild[]>('/banned');
  }

  /**
   * Ban a guild
   */
  async banGuild(guildId: string, reason: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/ban', { guildId, reason });
  }

  /**
   * Unban a guild
   */
  async unbanGuild(guildId: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/unban', { guildId });
  }

  /**
   * Get banned users
   */
  async getBannedUsers(): Promise<BannedUser[]> {
    return this.get<BannedUser[]>('/userbans');
  }

  /**
   * Ban a user
   */
  async banUser(userId: string, reason: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/userban', { userId, reason });
  }

  /**
   * Unban a user
   */
  async unbanUser(userId: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/userunban', { userId });
  }

  // ==================== Auth & User API ====================

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    return this.get<User>('/auth/me');
  }

  /**
   * Get user's API keys
   */
  async getApiKeys(): Promise<ApiKeyInfo[]> {
    return this.get<ApiKeyInfo[]>('/auth/api-keys');
  }

  /**
   * Create a new API key
   */
  async createApiKey(name: string, scopes?: string[]): Promise<{ id: string; key: string }> {
    return this.post<{ id: string; key: string }>('/auth/api-keys', { name, scopes });
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(keyId: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`/auth/api-keys/${keyId}`);
  }
}
