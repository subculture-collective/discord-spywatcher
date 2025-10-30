import { SpywatcherClient } from './client';
import {
  AnalyticsQueryOptions,
  GhostUser,
  LurkerUser,
  HeatmapData,
  RoleChange,
  ClientData,
  ShiftData,
  PaginatedResponse,
} from './types';

/**
 * Analytics API
 * Access user analytics, activity patterns, and behavioral data
 */
export class AnalyticsAPI extends SpywatcherClient {
  /**
   * Get ghost users (inactive users)
   * Users who haven't been seen in a while
   */
  async getGhosts(options?: AnalyticsQueryOptions): Promise<GhostUser[]> {
    return this.get<GhostUser[]>('/ghosts', options);
  }

  /**
   * Get lurkers (low activity users)
   * Users with presence but minimal messages
   */
  async getLurkers(options?: AnalyticsQueryOptions): Promise<LurkerUser[]> {
    return this.get<LurkerUser[]>('/lurkers', options);
  }

  /**
   * Get activity heatmap data
   * Shows when users are most active by hour and day of week
   */
  async getHeatmap(options?: AnalyticsQueryOptions): Promise<HeatmapData[]> {
    return this.get<HeatmapData[]>('/heatmap', options);
  }

  /**
   * Get role changes
   * Track when users' roles have changed
   */
  async getRoleChanges(
    options?: AnalyticsQueryOptions
  ): Promise<PaginatedResponse<RoleChange>> {
    return this.get<PaginatedResponse<RoleChange>>('/roles', options);
  }

  /**
   * Get client data
   * Shows which clients (web, mobile, desktop) users are using
   */
  async getClients(options?: AnalyticsQueryOptions): Promise<ClientData[]> {
    return this.get<ClientData[]>('/clients', options);
  }

  /**
   * Get status shifts
   * Track when users change their online status
   */
  async getShifts(options?: AnalyticsQueryOptions): Promise<ShiftData[]> {
    return this.get<ShiftData[]>('/shifts', options);
  }
}
