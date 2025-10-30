/**
 * Spywatcher SDK Types
 * Complete type definitions for the Spywatcher API
 */

// ==================== Configuration ====================

export interface SpywatcherConfig {
  /** Base URL of the Spywatcher API */
  baseUrl: string;
  /** API key for authentication (format: spy_live_...) */
  apiKey: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom headers to include in all requests */
  headers?: Record<string, string>;
  /** Enable debug logging */
  debug?: boolean;
}

// ==================== API Response Types ====================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// ==================== User & Auth Types ====================

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'BANNED';

export interface User {
  id: string;
  discordId: string;
  username: string;
  discriminator: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  scopes: string;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

// ==================== Analytics Types ====================

export interface PresenceData {
  userId: string;
  username: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  activities: Activity[];
  clientStatus: ClientStatus;
  timestamp: string;
}

export interface Activity {
  name: string;
  type: number;
  url?: string;
  details?: string;
  state?: string;
}

export interface ClientStatus {
  web?: string;
  mobile?: string;
  desktop?: string;
}

export interface GhostUser {
  userId: string;
  username: string;
  lastSeen: string;
  daysSinceLastSeen: number;
}

export interface LurkerUser {
  userId: string;
  username: string;
  messageCount: number;
  presenceCount: number;
  joinedAt: string;
}

export interface HeatmapData {
  hour: number;
  dayOfWeek: number;
  count: number;
}

export interface RoleChange {
  userId: string;
  username: string;
  rolesBefore: string[];
  rolesAfter: string[];
  changedAt: string;
}

export interface ClientData {
  userId: string;
  username: string;
  clients: string[];
  timestamp: string;
}

export interface ShiftData {
  userId: string;
  username: string;
  previousStatus: string;
  currentStatus: string;
  timestamp: string;
}

export interface SuspicionData {
  userId: string;
  username: string;
  suspicionScore: number;
  reasons: string[];
  timestamp: string;
}

// ==================== Timeline Types ====================

export interface TimelineEvent {
  id: string;
  userId: string;
  username: string;
  eventType: string;
  data: Record<string, unknown>;
  timestamp: string;
}

// ==================== Ban Types ====================

export interface BannedGuild {
  guildId: string;
  guildName: string;
  reason: string;
  bannedAt: string;
}

export interface BannedUser {
  userId: string;
  username: string;
  reason: string;
  bannedAt: string;
}

// ==================== Query Options ====================

export interface PaginationOptions {
  page?: number;
  perPage?: number;
}

export interface DateRangeOptions {
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsQueryOptions extends PaginationOptions, DateRangeOptions {
  guildId?: string;
}

// ==================== Error Types ====================

export class SpywatcherError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'SpywatcherError';
  }
}

export class AuthenticationError extends SpywatcherError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends SpywatcherError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends SpywatcherError {
  constructor(message = 'Validation failed') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}
