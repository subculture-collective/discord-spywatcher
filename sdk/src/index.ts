/**
 * Spywatcher SDK
 * Official TypeScript/JavaScript SDK for Discord Spywatcher API
 * 
 * @example
 * ```typescript
 * import { Spywatcher } from '@spywatcher/sdk';
 * 
 * const client = new Spywatcher({
 *   baseUrl: 'https://api.spywatcher.com',
 *   apiKey: 'spy_live_your_api_key_here'
 * });
 * 
 * // Get analytics data
 * const ghosts = await client.analytics.getGhosts();
 * const lurkers = await client.analytics.getLurkers();
 * 
 * // Get suspicion data
 * const suspicions = await client.getSuspicionData();
 * ```
 */

// Main SDK class
export { Spywatcher } from './spywatcher';

// API modules
export { AnalyticsAPI } from './analytics';
export { SpywatcherClient } from './client';

// Export all types
export * from './types';

// Default export
export { Spywatcher as default } from './spywatcher';
